// Client-side service that calls Vercel API routes
// API key is secured server-side in /api routes

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function generateStoryAndImagePrompt(carPrompt: string): Promise<{ story: string; funFacts: string[], imagePrompt: string }> {
  try {
    console.log('[client] Calling /generate-story with prompt:', carPrompt?.substring(0, 50));
    const url = `${API_BASE}/generate-story`;
    console.log('[client] Fetch URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carPrompt }),
    });

    console.log('[client] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      console.error('[client] Error response:', error);
      throw new Error(error.error || `Failed to generate story (${response.status})`);
    }

    const data = await response.json();
    console.log('[client] Story generation success, keys:', Object.keys(data));
    return data;
  } catch (err: any) {
    console.error("[client] Error generating story:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    throw new Error(err.message || "Gramps is having a bit of engine trouble. Please try again.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('[client] Calling /generate-image with prompt length:', prompt.length);
    const url = `${API_BASE}/generate-image`;
    console.log('[client] Fetch URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    console.log('[client] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      console.error('[client] Error response:', error);
      throw new Error(error.error || `Failed to generate image (${response.status})`);
    }

    const data = await response.json();
    console.log('[client] Image generation success, has imageUrl:', !!data.imageUrl);
    return data.imageUrl;
  } catch (err: any) {
    console.error("[client] Error generating image:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    throw new Error(err.message || "The old camera seems to be on the fritz. Couldn't get a picture.");
  }
}

export async function editImage(base64Image: string, prompt: string): Promise<string> {
  try {
    console.log('[client] Calling /edit-image with prompt length:', prompt.length, 'image length:', base64Image.length);
    const url = `${API_BASE}/edit-image`;
    console.log('[client] Fetch URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, prompt }),
    });

    console.log('[client] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
      console.error('[client] Error response:', error);
      throw new Error(error.error || `Failed to edit image (${response.status})`);
    }

    const data = await response.json();
    console.log('[client] Image edit success, has imageUrl:', !!data.imageUrl);
    return data.imageUrl;
  } catch (err: any) {
    console.error("[client] Error editing image:", {
      message: err.message,
      name: err.name,
      stack: err.stack,
    });
    throw new Error(err.message || "Couldn't quite get that adjustment right. Let's try another way.");
  }
}
