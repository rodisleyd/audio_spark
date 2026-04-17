import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testTTS(promptText) {
    console.log(`Testing prompt: "${promptText}"`);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: promptText }] }],
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
                        prebuiltVoiceConfig: { voiceName: "Kore" },
                    },
                },
            },
        });
        
        const finishReason = response.candidates?.[0]?.finishReason;
        const parts = response.candidates?.[0]?.content?.parts || [];
        const part = parts.find(p => p.inlineData || p.inline_data);
        const hasAudio = !!part;
        
        console.log(`-> Finish Reason: ${finishReason}, Has Audio: ${hasAudio}`);
        if (!hasAudio) {
            console.log("-> Detailed response:", JSON.stringify(response, null, 2));
        }
    } catch (e) {
        console.error("-> Error:", e.message);
    }
}

async function run() {
    await testTTS("(whispering) Olá! Estou testando a conversão de texto em voz do Gemini.");
    await testTTS("(speaking softly) Olá! Estou testando a conversão de texto em voz do Gemini.");
    await testTTS("*whispering* Olá! Estou testando a conversão de texto em voz do Gemini.");
    await testTTS("whispering, Olá! Estou testando a conversão de texto em voz do Gemini.");
}

run();
