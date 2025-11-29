import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";

// Initialize GenAI with the API key from Secrets (Backend only)
// Note: process.env.GEMINI_API_KEY is populated automatically by the secret configuration
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GenerateRequest {
  model: string;
  contents: any;
  config?: any;
}

export const generateGeminiContent = onCall(
  {
    region: "europe-west3", // Matching your existing infrastructure region
    secrets: ["GEMINI_API_KEY"],
    cors: true, // Allow calls from your web app
    maxInstances: 10,
  },
  async (request) => {
    // 1. Security: Ensure the user is authenticated via Firebase Auth
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { model, contents, config } = request.data as GenerateRequest;

    if (!model || !contents) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a model and contents."
      );
    }

    try {
      // 2. Call Google GenAI (Server-to-Server)
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config,
      });

      // 3. Extract the text/result to return a simplified object to the client
      // The client SDK's getters (like .text) won't exist on the serialized JSON response,
      // so we extract the text here for convenience.
      const text = response.text; // The SDK getter extracts this for us on the server

      return {
        success: true,
        text: text,
        // We also return the raw candidates in case the frontend needs deep inspection
        candidates: response.candidates,
      };
    } catch (error: any) {
      console.error("Gemini Backend Error:", error);
      throw new HttpsError("internal", error.message || "Failed to generate content");
    }
  }
);
