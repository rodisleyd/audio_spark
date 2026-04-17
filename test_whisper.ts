import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: "[Instruction: Speak whispering] Olá testando sussurro" }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
        },
      },
    });

    const candidates = response.candidates;
    console.log("Finish Reason:", candidates?.[0]?.finishReason);
    
    const parts = candidates?.[0]?.content?.parts || [];
    console.log("Parts array keys:", parts.map(p => Object.keys(p)));
    
    if (parts[0]?.text) {
        console.log("It returned TEXT instead of audio:", parts[0].text);
    }
  } catch (e) {
    console.error("SDK Error Throw:", e);
  }
}

test().catch(console.error);
