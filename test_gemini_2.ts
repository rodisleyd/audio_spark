import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  console.log("Iniciando teste Gemini TTS com a SDK...");
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: "Hello world",
    config: {
      responseModalities: ["AUDIO"], // camelCase
      speechConfig: {
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
        }
      }
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  console.log("Keys in part:", Object.keys(part || {}));
  if (part?.inlineData) {
      console.log("Keys in inlineData:", Object.keys(part.inlineData));
      console.log("Has data:", !!part.inlineData.data);
      console.log("Data length:", part.inlineData.data?.length);
  } else {
      console.log("No inlineData in part", JSON.stringify(part, null, 2));
  }
}

test().catch(console.error);
