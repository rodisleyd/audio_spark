import { GoogleGenAI, Modality } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName: string) {
  console.log(`Testing model: ${modelName}`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: "Hello world" }] }],
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
    console.log(`Success! ${modelName} returned ${parts.length} parts.`);
    const inlineDataPart = parts.find(p => p.inlineData);
    if (inlineDataPart) {
      console.log(`  Found inlineData of size: ${inlineDataPart.inlineData.data?.length}`);
    } else {
      console.log("  No inlineData part found.");
    }
  } catch (err: any) {
    console.error(`  Error for ${modelName}:`, err.message || err);
  }
}

async function test() {
  await testModel("gemini-2.5-flash-preview-tts");
  await testModel("gemini-2.5-pro-preview-tts");
}

test().catch(console.error);
