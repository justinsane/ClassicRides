// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Modality } from "@google/genai";

const imageModel = "gemini-2.5-flash-image";

function base64ToInlineData(base64String: string) {
  const [header, data] = base64String.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1];
  if (!mimeType || !data) {
    throw new Error("Invalid base64 string for image.");
  }
  return { mimeType, data };
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { base64Image, prompt } = await req.json();

    if (!base64Image || !prompt) {
      return new Response(JSON.stringify({ error: 'base64Image and prompt are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // @ts-ignore - process is available in Vercel serverless functions
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ai = new GoogleGenAI({ apiKey });
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
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return new Response(JSON.stringify({ imageUrl: imageData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'No image data found in edited response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("Error editing image:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "Couldn't quite get that adjustment right. Let's try another way." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

