
import { GoogleGenAI } from "@google/genai";
import { SOVEREIGN_SYSTEM_PROMPT, LOGO_GENERATION_PROMPT } from "../constants.ts";

export class NeuralAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NeuralAuthError";
  }
}

export const callSovereignEngineer = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new NeuralAuthError("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const userParts: any[] = [{ text: prompt }];
  if (imageData) {
    userParts.push({
      inlineData: {
        data: imageData.data,
        mimeType: imageData.mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { role: 'user', parts: userParts }
      ],
      config: {
        systemInstruction: SOVEREIGN_SYSTEM_PROMPT,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    return response.text || "Handshake failed. No response received.";
  } catch (error: any) {
    const errorMessage = error?.message || "";
    if (errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("API_KEY") || 
        errorMessage.includes("401") || 
        errorMessage.includes("403")) {
      throw new NeuralAuthError("INVALID_API_KEY");
    }
    console.error("Gemini Bridge Fault:", error);
    throw error;
  }
};

export const generateLogo = async () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new NeuralAuthError("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: LOGO_GENERATION_PROMPT }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from neural bridge.");
  } catch (error: any) {
    const errorMessage = error?.message || "";
    if (errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("API_KEY") || 
        errorMessage.includes("401") || 
        errorMessage.includes("403")) {
      throw new NeuralAuthError("INVALID_API_KEY");
    }
    throw error;
  }
};
