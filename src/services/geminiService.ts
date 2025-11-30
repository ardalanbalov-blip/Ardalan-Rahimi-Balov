import { GoogleGenAI } from '@google/genai';
import { Message, CoachingMode, TwinState, DailyInsight, SignalPackage, CoreMemory } from "../types";
import { MODE_CONFIG, INITIAL_TWIN_STATE } from "../constants";

// Initialize GenAI Client directly with the API Key from environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to safely parse JSON from model output
const parseJSON = (text: string) => {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n|\n```|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON", text);
    return {};
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSON(response.text || "{}");
    
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
      Context: ${historyContext}
      1. Detect language ('en', 'sv', 'fr', 'de', 'es', 'zh'). Default 'en'.
      2. Detect emotion, intensity (0-100), intent, hidden meaning.
      3. Contradiction score (0-10) and if it marks stress.
      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSON(response.text || "{}");
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
    // Fallback
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
    let systemInstruction = `You are Aura, an AI Twin. User Name: ${userName}. ` + MODE_CONFIG[mode].prompt;
    if (signal?.detectedLanguage) systemInstruction += ` Respond in ${signal.detectedLanguage}.`;
    
    const memoryText = memories.map(m => `[Memory: ${m.content}]`).join('\n');
    const insightText = recentInsights.map(i => `[Insight: ${i.summary}]`).join('\n');

    const context = history.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
      Memories:\n${memoryText}
      Insights:\n${insightText}
      Context:\n${context}
      User: "${currentMessage}"
      Respond in character. Short, concise, empathetic.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        systemInstruction: systemInstruction 
      }
    });

    return response.text || "I am listening...";
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

    const conversationText = history.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const prompt = `
      Analyze conversation for psychological patterns. 
      Return JSON with:
      - mood (neutral, happy, stressed, focused, reflective)
      - energy (0-100)
      - coherence (0-100)
      - insight details (summary, title, bullets, trend, insightType, etc.)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt + `\n${conversationText}`,
      config: { responseMimeType: "application/json" }
    });

    const data = parseJSON(response.text || "{}");
    
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
    // Only run baseline analysis for initial telemetry to save tokens
    const result = await analyzeTwinState(history, CoachingMode.BASELINE, signal);
    return result.insight ? [result.insight] : [];
  } catch (error) {
    return [];
  }
};