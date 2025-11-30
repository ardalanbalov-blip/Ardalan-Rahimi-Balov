
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase'; // Use the shared instance
import { Message, CoachingMode, TwinState, DailyInsight, SignalPackage, CoreMemory } from "../types";
import { MODE_CONFIG, INITIAL_TWIN_STATE } from "../constants";

// Initialize reference to the backend function using the shared functions instance
const generateGeminiContentFn = httpsCallable(functions, 'generateGeminiContent');

/**
 * Helper to call the secure backend function.
 * This replaces the direct `ai.models.generateContent` call.
 */
const callSecureGemini = async (payload: { model: string, contents: any, config?: any }): Promise<string> => {
  try {
    const result = await generateGeminiContentFn(payload);
    const data = result.data as any;
    
    if (data.success && data.text) {
      return data.text;
    }
    throw new Error("No text returned from Gemini Backend");
  } catch (error: any) {
    console.error("Secure Gemini Call Failed:", error);
    // Return a safe fallback to prevent UI crash
    return ""; 
  }
};

// --- SCAN FOR MEMORIES ---
export const scanForCoreMemories = async (
  input: string, 
  existingMemories: CoreMemory[]
): Promise<CoreMemory | null> => {
  try {
    const prompt = `
      Analyze for LONG-TERM MEMORY. User said: "${input}"
      Score importance 1-10. Ignore trivial.
      Existing: ${existingMemories.map(m => m.content).join('; ')}
      Return JSON: { isMemory: boolean, content: string, category: 'emotional'|'fact'|'preference'|'milestone', importance: number }
    `;

    const jsonText = await callSecureGemini({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (!jsonText) return null;

    const data = JSON.parse(jsonText);
    
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
    console.error("Error scanning memories:", e);
    return null;
  }
};

export const preprocessUserSignal = async (text: string, historyContext: string): Promise<SignalPackage> => {
  try {
    const prompt = `
      Analyze user message: "${text}"
      1. Detect language ('en', 'sv', 'fr', 'de', 'es', 'zh'). Default 'en'.
      2. Detect emotion, intent, hidden meaning. 
      Return JSON.
    `;

    const jsonText = await callSecureGemini({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(jsonText || "{}");
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
    console.error("Error preprocessing signal:", e);
    return {
      emotion: 'neutral',
      intensity: 50,
      intent: 'neutral',
      hiddenMeaning: 'Analysis failed',
      contradictionScore: 0,
      stressMarker: false,
      topics: [],
      detectedLanguage: 'en'
    };
  }
};

// --- GENERATE RESPONSE ---
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
    let systemInstruction = `User Name: ${userName}. ` + MODE_CONFIG[mode].prompt;
    if (signal?.detectedLanguage) systemInstruction += ` Respond in ${signal.detectedLanguage}.`;

    const context = history.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Context:\n${context}\nUser: "${currentMessage}"\nRespond in character.`;

    const text = await callSecureGemini({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: systemInstruction 
      }
    });

    return text || "I am listening...";
  } catch (error: any) {
    console.error("Error generating twin response:", error);
    return "Neural connection unstable. Please try again.";
  }
};

export const analyzeTwinState = async (
  history: Message[],
  currentMode: CoachingMode,
  signal?: SignalPackage
): Promise<{ twinState: TwinState; insight: DailyInsight | null }> => {
  try {
    if (history.length < 2) return { twinState: INITIAL_TWIN_STATE, insight: null };

    const conversationText = history.slice(-20).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Analyze conversation for psychological patterns. Return JSON with mood, energy, coherence, and insight details.`;

    const jsonText = await callSecureGemini({
      model: 'gemini-2.5-flash',
      contents: prompt + `\n${conversationText}`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(jsonText || "{}");
    
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
        memoryStrength: 50,
        patternPersistence: 50
      }
    };
  } catch (error) {
    console.error("Error analyzing twin state:", error);
    return { twinState: INITIAL_TWIN_STATE, insight: null };
  }
};

export const generateInitialTelemetry = async (
  history: Message[],
  userName: string,
  signal?: SignalPackage
): Promise<DailyInsight[]> => {
  try {
    const modes = [CoachingMode.BASELINE];
    const results = await Promise.all(modes.map(mode => analyzeTwinState(history, mode, signal)));
    return results.map(r => r.insight).filter((i): i is DailyInsight => i !== null);
  } catch (error) {
    return [];
  }
};
