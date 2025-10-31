// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Modality } from "@google/genai";

const imageModel = "gemini-2.5-flash-image";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
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

    const fullPrompt = `${prompt}, in the style of a faded Polaroid from the 1960s, warm tones, detailed chrome and curves.`;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: fullPrompt }] },
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

    return new Response(JSON.stringify({ error: 'No image data found in response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("Error generating image:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "The old camera seems to be on the fritz. Couldn't get a picture." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

