import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

async function test() {
  for (const voice of VOICES) {
    console.log(`Testing with voice: ${voice}`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: "[Instruction: Speak whispering] Olá testando" }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      const inlineData = parts[0]?.inlineData?.data;
      console.log(`Result for ${voice}: ${inlineData ? 'SUCCESS' : 'NO AUDIO'}`);
    } catch (e) {
      console.log(`Error for ${voice}: ${e}`);
    }
  }
}

test().catch(console.error);
