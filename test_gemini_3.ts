import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const prompt = "Hello world";
  const voice = "Puck";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  console.log("Number of parts:", parts.length);
  for (let i = 0; i < parts.length; i++) {
    console.log(`Part ${i}:`, Object.keys(parts[i]));
    if (parts[i].inlineData) {
        console.log(`  inlineData keys:`, Object.keys(parts[i].inlineData));
    }
    if (parts[i].text) {
        console.log(`  text:`, parts[i].text);
    }
  }
}

test().catch(console.error);
