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
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
        }
      }
    }
  });

  console.log(JSON.stringify(response, null, 2));
}

test().catch(console.error);
