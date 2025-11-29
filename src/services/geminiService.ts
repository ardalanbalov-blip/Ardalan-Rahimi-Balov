
import { GoogleGenAI, Type } from "@google/genai";
import { Message, CoachingMode, TwinState, DailyInsight, SignalPackage, CoreMemory } from "../types";
import { MODE_CONFIG, GEMINI_API_KEY, INITIAL_TWIN_STATE } from "../constants";

// Singleton instance
let aiInstance: GoogleGenAI | null = null;
let isMockMode = false;

// Initialize or retrieve the AI instance
const getAi = (): GoogleGenAI | null => {
  if (isMockMode) return null;
  if (aiInstance) return aiInstance;

  // 1. Check if Key exists at all
  const apiKey = GEMINI_API_KEY;

  // 2. Basic Validation
  if (!apiKey || apiKey.length < 10 || apiKey.includes("PLACEHOLDER") || apiKey === '""') {
    if (!isMockMode) {
      console.warn("⚠️ Gemini API Key missing/invalid in constants. Switching to Mock AI Mode.");
      isMockMode = true;
    }
    return null;
  }
    
  try {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  } catch (e) {
    console.error("Error initializing GoogleGenAI client:", e);
    isMockMode = true;
    return null;
  }
};

// Helper to handle API errors gracefully
const handleGeminiError = (error: any, context: string) => {
  console.error(`Gemini Error (${context}):`, error);
  
  // If the SDK throws an API Key error, force Mock Mode for future calls
  if (error.message?.includes('API key') || error.toString().includes('API key')) {
    console.warn("⚠️ Invalid API Key detected during request. forcing Mock Mode.");
    isMockMode = true;
    aiInstance = null;
  }
};

// --- SCAN FOR MEMORIES ---
export const scanForCoreMemories = async (
  input: string, 
  existingMemories: CoreMemory[]
): Promise<CoreMemory | null> => {
  const ai = getAi();
  if (!ai) return null; 

  try {
    const prompt = `
      Analyze for LONG-TERM MEMORY. User said: "${input}"
      Score importance 1-10. Ignore trivial.
      Existing: ${existingMemories.map(m => m.content).join('; ')}
      Return JSON: { isMemory: boolean, content: string, category: 'emotional'|'fact'|'preference'|'milestone', importance: number }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
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
    handleGeminiError(e, "scanForCoreMemories");
    return null;
  }
};

export const preprocessUserSignal = async (text: string, historyContext: string): Promise<SignalPackage> => {
  const ai = getAi();
  
  if (!ai) {
    return {
      emotion: 'neutral',
      intensity: 50,
      intent: 'neutral',
      hiddenMeaning: 'Mock Mode - Signal Analysis Disabled',
      contradictionScore: 0,
      stressMarker: false,
      topics: [],
      detectedLanguage: 'en'
    };
  }

  try {
    const prompt = `
      Analyze user message: "${text}"
      1. Detect language ('en', 'sv', 'fr', 'de', 'es', 'zh'). Default 'en'.
      2. Detect emotion, intent, hidden meaning. 
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
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
    handleGeminiError(e, "preprocessUserSignal");
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
  const ai = getAi();

  if (!ai) {
    return `[MOCK MODE] I see you said: "${currentMessage}". 
    
    My neural core is currently offline (API Key Missing/Invalid). 
    Please configure VITE_GEMINI_API_KEY in your environment to unlock my full intelligence.`;
  }

  try {
    let systemInstruction = `User Name: ${userName}. ` + MODE_CONFIG[mode].prompt;
    if (signal?.detectedLanguage) systemInstruction += ` Respond in ${signal.detectedLanguage}.`;

    const context = history.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Context:\n${context}\nUser: "${currentMessage}"\nRespond in character.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: systemInstruction }
    });

    return response.text || "I am listening...";
  } catch (error: any) {
    handleGeminiError(error, "generateTwinResponse");
    return "Neural connection unstable. Switching to manual mode... (Please check API Key)";
  }
};

export const analyzeTwinState = async (
  history: Message[],
  currentMode: CoachingMode,
  signal?: SignalPackage
): Promise<{ twinState: TwinState; insight: DailyInsight | null }> => {
  const ai = getAi();
  
  if (!ai) {
    return { twinState: INITIAL_TWIN_STATE, insight: null };
  }

  try {
    if (history.length < 2) return { twinState: INITIAL_TWIN_STATE, insight: null };

    const conversationText = history.slice(-20).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `Analyze conversation for psychological patterns. Return JSON with mood, energy, coherence, and insight details.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + `\n${conversationText}`,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text || "{}");
    
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
    handleGeminiError(error, "analyzeTwinState");
    return { twinState: INITIAL_TWIN_STATE, insight: null };
  }
};

export const generateInitialTelemetry = async (
  history: Message[],
  userName: string,
  signal?: SignalPackage
): Promise<DailyInsight[]> => {
  const ai = getAi();
  if (!ai) return [];

  try {
    const modes = [CoachingMode.BASELINE];
    const results = await Promise.all(modes.map(mode => analyzeTwinState(history, mode, signal)));
    return results.map(r => r.insight).filter((i): i is DailyInsight => i !== null);
  } catch (error) {
    return [];
  }
};
