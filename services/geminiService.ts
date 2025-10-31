
import { GoogleGenAI, Type, Modality } from "@google/genai";

const textModel = "gemini-2.5-flash";
const imageModel = "gemini-2.5-flash-image";

// FIX: Create the AI client on-demand for each request. This ensures the app uses
// the API key from the environment and is more resilient to injection timing.
const getAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        // This provides a clear error message in the UI if the API key is not configured.
        throw new Error("API key is not configured. The application cannot contact the server.");
    }
    return new GoogleGenAI({ apiKey });
}

const storySchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "A short, nostalgic story about the classic car, under 200 words. Use warm, era-appropriate language.",
    },
    funFacts: {
        type: Type.ARRAY,
        items: {
            type: Type.STRING
        },
        description: "2-3 interesting fun facts about the car model or its era."
    },
    imagePrompt: {
      type: Type.STRING,
      description: "A vivid, detailed scene description for generating an image. Focus on visual details like color, setting, and mood."
    }
  },
  required: ["story", "funFacts", "imagePrompt"],
};

export async function generateStoryAndImagePrompt(carPrompt: string): Promise<{ story: string; funFacts: string[], imagePrompt: string }> {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Generate a story, fun facts, and an image prompt for this request: "${carPrompt}"`,
      config: {
        systemInstruction: "You are Gramps, a wise-cracking gearhead from the '50s. Respond warmly to queries about classic cars. Provide a short story, 2-3 fun facts, and a vivid scene description for an image. Keep it under 200 words, positive, and era-appropriate. Output in the requested JSON format.",
        responseMimeType: "application/json",
        responseSchema: storySchema,
      }
    });
    const parsedResponse = JSON.parse(response.text);
    return parsedResponse;
  } catch (err: any) {
    console.error("Error generating story:", err);
    throw new Error(err.message || "Gramps is having a bit of engine trouble. Please try again.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
    const fullPrompt = `${prompt}, in the style of a faded Polaroid from the 1960s, warm tones, detailed chrome and curves.`;
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: fullPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data found in response.");
    } catch (err: any) {
        console.error("Error generating image:", err);
        throw new Error(err.message || "The old camera seems to be on the fritz. Couldn't get a picture.");
    }
}

function base64ToInlineData(base64String: string) {
    const [header, data] = base64String.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !data) {
        throw new Error("Invalid base64 string for image.");
    }
    return { mimeType, data };
}

export async function editImage(base64Image: string, prompt: string): Promise<string> {
    try {
        const ai = getAIClient();
        const { mimeType, data } = base64ToInlineData(base64Image);

        const response = await ai.models.generateContent({
            model: imageModel,
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data found in edited response.");
    } catch (err: any) {
        console.error("Error editing image:", err);
        throw new Error(err.message || "Couldn't quite get that adjustment right. Let's try another way.");
    }
}
