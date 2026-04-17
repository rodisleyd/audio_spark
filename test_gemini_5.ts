import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: "[Instruction: Speak angry] vamos lá" }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  console.log("Parts array:", JSON.stringify(parts.map(p => Object.keys(p))));
  
  const inlineDataPart = parts.find(p => p.inlineData);
  if (inlineDataPart) {
      console.log("Found inlineData!");
  } else {
      console.log("No inlineData found in any part.");
  }
}

test().catch(console.error);
