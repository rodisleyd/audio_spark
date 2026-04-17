import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export async function generateSpeech(
  text: string, 
  voice: VoiceName = 'Kore', 
  acting: { emotion: string[], profile: string, pitch: number, raspiness: number }
): Promise<string> {
  const { emotion, profile, pitch, raspiness } = acting;
  
  let instructions = [];
  
  // Handle emotions
  if (emotion && emotion.length > 0) {
    emotion.forEach(emo => {
      // Map 'whisper' or 'whispering' to a more stable tag if needed
      if (emo === 'whispering' || emo === 'whisper') {
        instructions.push('whispering');
      } else {
        instructions.push(emo);
      }
    });
  }

  if (profile) instructions.push(`acting like a ${profile}`);
  if (pitch < 40) instructions.push("very deep pitch");
  else if (pitch > 60) instructions.push("very high pitch");
  if (raspiness > 50) instructions.push("hoarse/raspy voice");
  
  // Use a cleaner, natural prompt structure. Gemini 3.1 Flash TTS responds better to inline parentheses/asterisks for acting.
  const promptInstruction = instructions.length > 0 ? `(${instructions.join(", ")}) ` : "";
  const finalPrompt = `${promptInstruction}${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: finalPrompt }] }],
    config: {
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      responseModalities: ["AUDIO"],
      speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  const part = parts.find((p: any) => p.inlineData || p.inline_data);
  const base64Audio = (part as any)?.inlineData?.data || (part as any)?.inline_data?.data;
  
  if (!base64Audio) {
    const finishReason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
    // Check if there was a text part instead (which happens when audio fails)
    const textPart = parts.find((p: any) => p.text);
    const detail = textPart ? ` Model returned text instead of audio: "${textPart.text}"` : "";
    throw new Error(`No audio data received from Gemini. Finish reason: ${finishReason}.${detail}`);
  }
  
  return base64Audio;
}
