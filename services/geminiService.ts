import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCandle } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client
const ai = new GoogleGenAI({ apiKey });

export const generateCustomCandle = async (mood: string): Promise<GeneratedCandle> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const model = "gemini-3-flash-preview";
  const prompt = `
    Create a unique, luxurious candle concept based on the following mood or feeling: "${mood}".
    The output must be a JSON object containing:
    - name: A creative, evocative name for the candle.
    - description: A poetic description of the scent and the atmosphere it creates (max 2 sentences).
    - notes: An array of 3 distinct fragrance notes (e.g., "Bergamot", "Oud", "Tobacco").
    - suggestedColor: A hex color code that represents the candle wax.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            notes: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedColor: { type: Type.STRING }
          },
          required: ["name", "description", "notes", "suggestedColor"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as GeneratedCandle;
  } catch (error) {
    console.error("Error generating candle:", error);
    throw error;
  }
};