
import { GoogleGenAI } from "@google/genai";
import { SOVEREIGN_SYSTEM_PROMPT } from "../constants.ts";

export const callSovereignEngineer = async (
  prompt: string, 
  history: { role: 'user' | 'model', parts: any[] }[] = [],
  imageData?: { data: string, mimeType: string }
) => {
  // Use the API key directly from the environment without unsafe fallbacks.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
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
        // Rules requirement: paired maxOutputTokens and thinkingBudget
        maxOutputTokens: 16384,
        thinkingConfig: { thinkingBudget: 4000 }
      },
    });

    return response.text || "Handshake failed. No response received.";
  } catch (error) {
    console.error("Gemini Bridge Fault:", error);
    throw error;
  }
};
