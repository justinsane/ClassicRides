// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Modality } from "@google/genai";

// Force Node.js runtime for Vercel
export const config = {
  runtime: 'nodejs',
};

const imageModel = "gemini-2.5-flash-image";

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('[generate-image] Request received:', { method: req.method, url: req.url });
    
    const { prompt } = await req.json();
    console.log('[generate-image] Prompt:', prompt?.substring(0, 100));

    if (!prompt) {
      console.error('[generate-image] Missing prompt');
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // @ts-ignore - process is available in Vercel serverless functions
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[generate-image] API key check:', { 
      hasKey: !!apiKey, 
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none'
    });
    
    if (!apiKey) {
      console.error('[generate-image] API key is missing');
      return new Response(JSON.stringify({ error: 'API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fullPrompt = `${prompt}, in the style of a faded Polaroid from the 1960s, warm tones, detailed chrome and curves.`;
    console.log('[generate-image] Full prompt length:', fullPrompt.length);
    
    console.log('[generate-image] Initializing GoogleGenAI with model:', imageModel);
    const ai = new GoogleGenAI({ apiKey });
    
    console.log('[generate-image] Calling generateContent...');
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    console.log('[generate-image] Response received, checking for image data...');
    console.log('[generate-image] Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      hasContent: !!response.candidates?.[0]?.content,
      partsLength: response.candidates?.[0]?.content?.parts?.length || 0,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log('[generate-image] Found image data! Size:', part.inlineData.data?.length || 0);
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return new Response(JSON.stringify({ imageUrl: imageData }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    console.error('[generate-image] No image data found in response');
    return new Response(JSON.stringify({ error: 'No image data found in response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("[generate-image] Error generating image:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
      cause: err.cause,
    });
    return new Response(JSON.stringify({ 
      error: err.message || "The old camera seems to be on the fritz. Couldn't get a picture." 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

