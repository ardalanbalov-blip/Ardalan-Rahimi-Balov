import { GoogleGenAI, Type } from "@google/genai";
import { Message, CoachingMode, TwinState, DailyInsight, SignalPackage, CoreMemory } from "../types";
import { MODE_CONFIG, GEMINI_API_KEY } from "../constants";

// Lazy initialization to prevent crash on load if API key is missing.
let aiInstance: GoogleGenAI | null = null;

const getAi = (): GoogleGenAI => {
  if (!aiInstance) {
    // Attempt to resolve API Key
    // We strictly use the GEMINI_API_KEY defined in constants which pulls from VITE_GEMINI_API_KEY or env.API_KEY
    // We do NOT fallback to Firebase config as the user requested separation.
    
    const apiKey = GEMINI_API_KEY;

    if (!apiKey || apiKey.length === 0 || apiKey === '""') {
      console.error("CRITICAL ERROR: Gemini API Key is missing. Please check VITE_GEMINI_API_KEY.");
      throw new Error("API key is missing.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

// --- NEW: LONG-TERM MEMORY SCANNER ---
export const scanForCoreMemories = async (
  input: string, 
  existingMemories: CoreMemory[]
): Promise<CoreMemory | null> => {
  try {
    const ai = getAi();
    const prompt = `
      Analyze this user input for LONG-TERM MEMORY value.
      User said: "${input}"

      Does this contain a significant fact, preference, life milestone, or deep emotional truth?
      Score importance 1-10. Ignore trivial chat.
      
      Existing Memories (avoid duplicates):
      ${existingMemories.map(m => m.content).join('; ')}

      Return JSON or null if unimportant (score < 7).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMemory: { type: Type.BOOLEAN },
            content: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['emotional', 'fact', 'preference', 'milestone'] },
            importance: { type: Type.INTEGER }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    if (data.isMemory && data.importance >= 7) {
      return {
        id: Date.now().toString(),
        content: data.content,
        category: data.category,
        importance: data.importance,
        createdAt: new Date().toISOString()
      };
    }
    return null;
  } catch (e) {
    // Fail silently for memory scans to avoid interrupting the main flow
    console.warn("Memory scan skipped:", e);
    return null;
  }
};

export const preprocessUserSignal = async (text: string, historyContext: string): Promise<SignalPackage> => {
  try {
    const ai = getAi();
    const prompt = `
      Analyze user message. Context: ${historyContext.slice(-200)}. Message: "${text}"
      1. Detect the language code strictly from this list: 'en', 'sv', 'fr', 'de', 'es', 'zh'. If unknown, default to 'en'.
      2. Detect emotion, intent, hidden meaning. 
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            emotion: { type: Type.STRING },
            intensity: { type: Type.INTEGER },
            intent: { type: Type.STRING, enum: ['venting', 'planning', 'avoidance', 'fear', 'ambition', 'reflection', 'confusion', 'neutral'] },
            hiddenMeaning: { type: Type.STRING },
            contradictionScore: { type: Type.INTEGER },
            stressMarker: { type: Type.BOOLEAN },
            topics: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      emotion: data.emotion || 'neutral',
      intensity: data.intensity || 50,
      intent: data.intent || 'neutral',
      hiddenMeaning: data.hiddenMeaning || 'None detected',
      contradictionScore: data.contradictionScore || 0,
      stressMarker: data.stressMarker || false,
      topics: data.topics || [],
      detectedLanguage: data.detectedLanguage || 'en'
    };
  } catch (e) {
    console.warn("Signal processing skipped:", e);
    return {
      emotion: 'neutral',
      intensity: 50,
      intent: 'neutral',
      hiddenMeaning: '',
      contradictionScore: 0,
      stressMarker: false,
      topics: [],
      detectedLanguage: 'en'
    };
  }
};

// --- CORE CHAT GENERATION WITH MEMORY INJECTION ---
export const generateTwinResponse = async (
  currentMessage: string,
  history: Message[],
  mode: CoachingMode,
  userName: string,
  recentInsights: DailyInsight[] = [],
  signal?: SignalPackage,
  memories: CoreMemory[] = []
): Promise<string> => {
  try {
    const ai = getAi();
    let systemInstruction = `User Name: ${userName}. ` + MODE_CONFIG[mode].prompt;

    if (signal) {
      systemInstruction += `\n\nSIGNAL ANALYSIS:\nUser Intent: ${signal.intent}\nLatent Emotion: ${signal.hiddenMeaning}`;
      if (signal.detectedLanguage) {
        systemInstruction += `\n\nIMPORTANT: You must respond exclusively in the detected language code: "${signal.detectedLanguage}".`;
      }
    }

    if (memories.length > 0) {
      const topMemories = [...memories].sort((a, b) => b.importance - a.importance).slice(0, 3);
      systemInstruction += `\n\nCORE MEMORIES (Things you know about the user):\n${topMemories.map(m => `- [${m.category.toUpperCase()}] ${m.content}`).join('\n')}`;
    }

    const context = history.slice(-15).map(m => `${m.role}: ${m.text}`).join('\n');
    
    const prompt = `
      Context:
      ${context}

      User Input: "${currentMessage}"
      
      Respond strictly in character.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: mode === CoachingMode.SHADOW ? 0.9 : 0.7, 
      }
    });

    return response.text || "I am processing...";
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.message?.includes('API key')) {
      return "System Notice: I cannot connect to my neural core (API Key Missing). Please check your settings.";
    }
    return "Neural core connection interrupted. Retrying...";
  }
};

export const analyzeTwinState = async (
  history: Message[],
  currentMode: CoachingMode,
  signal?: SignalPackage
): Promise<{ twinState: TwinState; insight: DailyInsight | null }> => {
  try {
    if (history.length < 2) return { twinState: { mood: 'neutral', energy: 50, coherence: 50 }, insight: null };

    const ai = getAi();
    const conversationText = history.slice(-20).map(m => `${m.role}: ${m.text}`).join('\n');
    const modeConfig = MODE_CONFIG[currentMode];

    const prompt = `
      You are the Deep Insight Engine. Mode: ${modeConfig.name}.
      Analyze this conversation for deep psychological patterns.
      Conversation:
      ${conversationText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: ['neutral', 'happy', 'stressed', 'focused', 'reflective'] },
            energy: { type: Type.INTEGER },
            coherence: { type: Type.INTEGER },
            emotionalScore: { type: Type.INTEGER },
            dominantEmotion: { type: Type.STRING },
            title: { type: Type.STRING },
            bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            trend: { type: Type.STRING, enum: ['up', 'down', 'stable'] },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            insightType: { type: Type.STRING, enum: ['behavioral', 'emotional', 'strategic', 'shadow', 'future', 'meta', 'conflict'] },
            summary: { type: Type.STRING },
            patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
            blindSpots: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflicts: { type: Type.ARRAY, items: { type: Type.STRING } },
            trajectory: { type: Type.STRING },
            actionableStep: { type: Type.STRING },
            patternPersistence: { type: Type.INTEGER },
            distortions: {
              type: Type.OBJECT,
              properties: {
                allOrNothing: { type: Type.INTEGER },
                catastrophizing: { type: Type.INTEGER },
                emotionalReasoning: { type: Type.INTEGER },
                shouldStatements: { type: Type.INTEGER },
                personalization: { type: Type.INTEGER },
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    const intensity = signal ? signal.intensity : 50;
    const memoryStrength = Math.min(100, Math.floor((intensity + (data.patternPersistence || 50)) / 2));

    return {
      twinState: {
        mood: data.mood || 'neutral',
        energy: data.energy || 50,
        coherence: data.coherence || 50
      },
      insight: {
        date: new Date().toISOString(),
        sourceMode: currentMode,
        emotionalScore: data.emotionalScore || 50,
        energyLevel: data.energy || 50,
        dominantEmotion: data.dominantEmotion || "Neutral",
        title: data.title || "Daily Analysis",
        bullets: data.bullets || [],
        trend: data.trend || 'stable',
        tags: data.tags || [],
        insightType: data.insightType || 'behavioral',
        summary: data.summary || "Processing...",
        patterns: data.patterns || [],
        blindSpots: data.blindSpots || [],
        conflicts: data.conflicts || [],
        trajectory: data.trajectory || "Stable",
        actionableStep: data.actionableStep || "Reflect",
        memoryStrength: memoryStrength,
        patternPersistence: data.patternPersistence || 50,
        distortions: data.distortions || {
          allOrNothing: 0,
          catastrophizing: 0,
          emotionalReasoning: 0,
          shouldStatements: 0,
          personalization: 0
        }
      }
    };
  } catch (error) {
    console.warn("Analysis failed (Non-critical):", error);
    return { twinState: { mood: 'neutral', energy: 50, coherence: 50 }, insight: null };
  }
};

export const generateMetaInsight = async (allInsights: DailyInsight[]): Promise<DailyInsight | null> => {
  return null; 
};

export const generateInitialTelemetry = async (
  history: Message[],
  userName: string,
  signal?: SignalPackage
): Promise<DailyInsight[]> => {
  try {
    const modes = [CoachingMode.BASELINE, CoachingMode.SHADOW, CoachingMode.FUTURE];
    const results = await Promise.all(modes.map(mode => analyzeTwinState(history, mode, signal)));
    return results.map(r => r.insight).filter((i): i is DailyInsight => i !== null);
  } catch (error) {
    return [];
  }
};