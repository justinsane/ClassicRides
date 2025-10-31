// @ts-ignore - Vercel will handle this dependency
import { GoogleGenAI, Type } from '@google/genai';
import { parseRequestBody } from './utils.js';

// Force Node.js runtime for Vercel
export const config = {
  runtime: 'nodejs',
};

const textModel = 'gemini-2.5-flash';

const storySchema = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description:
        'A short, nostalgic story about the classic car, under 200 words. Use warm, era-appropriate language.',
    },
    funFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: '2-3 interesting fun facts about the car model or its era.',
    },
    imagePrompt: {
      type: Type.STRING,
      description:
        'A vivid, detailed scene description for generating an image. Focus on visual details like color, setting, and mood.',
    },
  },
  required: ['story', 'funFacts', 'imagePrompt'],
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[generate-story] Request received:', {
      method: req.method,
      url: req.url,
    });

    const body = await parseRequestBody(req);
    const { carPrompt } = body;
    console.log('[generate-story] Car prompt:', carPrompt?.substring(0, 50));

    if (!carPrompt) {
      console.error('[generate-story] Missing carPrompt');
      return new Response(JSON.stringify({ error: 'carPrompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // @ts-ignore - process is available in Vercel serverless functions
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('[generate-story] API key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
    });

    if (!apiKey) {
      console.error('[generate-story] API key is missing');
      return new Response(
        JSON.stringify({ error: 'API key is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(
      '[generate-story] Initializing GoogleGenAI with model:',
      textModel
    );
    const ai = new GoogleGenAI({ apiKey });

    console.log('[generate-story] Calling generateContent...');
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Generate a story, fun facts, and an image prompt for this request: "${carPrompt}"`,
      config: {
        systemInstruction:
          "You are Gramps, a wise-cracking gearhead from the '50s. Respond warmly to queries about classic cars. Provide a short story, 2-3 fun facts, and a vivid scene description for an image. Keep it under 200 words, positive, and era-appropriate. Output in the requested JSON format.",
        responseMimeType: 'application/json',
        responseSchema: storySchema,
      },
    });

    console.log('[generate-story] Response received, parsing...');
    const parsedResponse = JSON.parse(response.text);
    console.log(
      '[generate-story] Success! Response keys:',
      Object.keys(parsedResponse)
    );

    return new Response(JSON.stringify(parsedResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[generate-story] Error generating story:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      cause: err.cause,
    });
    return new Response(
      JSON.stringify({
        error:
          err.message ||
          'Gramps is having a bit of engine trouble. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
