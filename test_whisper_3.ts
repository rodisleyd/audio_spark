import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
  const prompts = [
    "[Instruction: Speak whispering] Olá",
    "[whisper] Olá",
    "Speak in a whisper: Olá"
  ];

  for (const p of prompts) {
    console.log(`Testing prompt: ${p}`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: p }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
          },
        },
      });
      console.log(`  Finish Reason: ${response.candidates?.[0]?.finishReason}`);
      console.log(`  Success: ${!!response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data}`);
    } catch (e) {
      console.log(`  Error: ${e}`);
    }
  }
}

test().catch(console.error);
