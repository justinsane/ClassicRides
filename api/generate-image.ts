// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Modality } from "@google/genai";
import { parseRequestBody } from './utils.js';

// Force Node.js runtime for Vercel
export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60 seconds (increase if needed)
};

const imageModel = "gemini-2.5-flash-image";

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  try {
    console.log('[generate-image] Request received:', { method: req.method, url: req.url });
    
    const body = await parseRequestBody(req);
    const { prompt } = body;
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
    const geminiResponse = await ai.models.generateContent({
      model: imageModel,
      contents: { parts: [{ text: fullPrompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    console.log('[generate-image] Response received, checking for image data...');
    console.log('[generate-image] Response structure:', {
      hasCandidates: !!geminiResponse.candidates,
      candidatesLength: geminiResponse.candidates?.length || 0,
      hasContent: !!geminiResponse.candidates?.[0]?.content,
      partsLength: geminiResponse.candidates?.[0]?.content?.parts?.length || 0,
    });

    for (const part of geminiResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        console.log('[generate-image] Found image data! Size:', part.inlineData.data?.length || 0);
        const imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        console.log('[generate-image] Returning response with image...');
        const responseBody = JSON.stringify({ imageUrl: imageData });
        console.log('[generate-image] Response body length:', responseBody.length);
        
        const httpResponse = new Response(responseBody, {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Length': responseBody.length.toString(),
          }
        });
        
        console.log('[generate-image] Response created, status:', httpResponse.status);
        return httpResponse;
      }
    }

    console.error('[generate-image] No image data found in response');
    return new Response(JSON.stringify({ error: 'No image data found in response' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
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
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

