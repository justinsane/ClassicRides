// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Modality } from "@google/genai";
import { parseRequestBody } from './utils';

// Force Node.js runtime for Vercel
export const config = {
  runtime: 'nodejs',
};

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
    console.log('[edit-image] Request received:', { method: req.method, url: req.url });
    
    const body = await parseRequestBody(req);
    const { base64Image, prompt } = body;
    console.log('[edit-image] Prompt:', prompt?.substring(0, 100));
    console.log('[edit-image] Image data length:', base64Image?.length || 0);

    if (!base64Image || !prompt) {
      console.error('[edit-image] Missing required fields:', { hasImage: !!base64Image, hasPrompt: !!prompt });
      return new Response(JSON.stringify({ error: 'base64Image and prompt are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // @ts-ignore - process is available in Vercel serverless functions
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[edit-image] API key check:', { 
      hasKey: !!apiKey, 
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });
    
    if (!apiKey) {
      console.error('[edit-image] API key is missing');
      return new Response(JSON.stringify({ error: 'API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[edit-image] Initializing GoogleGenAI with model:', imageModel);
    const ai = new GoogleGenAI({ apiKey });
    const { mimeType, data } = base64ToInlineData(base64Image);
    console.log('[edit-image] Converted image data, mimeType:', mimeType, 'data length:', data.length);

    console.log('[edit-image] Calling generateContent...');
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

    console.log('[edit-image] Response received, checking for image data...');
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log('[edit-image] Found edited image data! Size:', part.inlineData.data?.length || 0);
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return new Response(JSON.stringify({ imageUrl: imageData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.error('[edit-image] No image data found in edited response');
    return new Response(JSON.stringify({ error: 'No image data found in edited response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("[edit-image] Error editing image:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      cause: err.cause,
    });
    return new Response(JSON.stringify({ 
      error: err.message || "Couldn't quite get that adjustment right. Let's try another way." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

