import { GoogleGenAI, Modality } from "@google/genai";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export async function generateSpeech(text: string, voice: VoiceName = 'Kore', acting: { emotion: string | string[], profile: string, pitch: number, raspiness: number }): Promise<string> {
  const { emotion, profile, pitch, raspiness } = acting;
  
  let instructions = [];
  if (emotion) {
    if (Array.isArray(emotion)) {
      instructions.push(...emotion);
    } else {
      instructions.push(emotion);
    }
  }
  if (profile) instructions.push(`acting like a ${profile}`);
  if (pitch < 40) instructions.push("very deep pitch");
  else if (pitch > 60) instructions.push("very high pitch");
  if (raspiness > 50) instructions.push("hoarse/raspy voice");
  
  const instructionStr = instructions.length > 0 ? `[Instruction: Speak ${instructions.join(", ")}] ` : "";
  const prompt = `${instructionStr}${text}`;

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

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data received from Gemini.");
  }
  
  return base64Audio;
}
