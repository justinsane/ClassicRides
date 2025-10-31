// Client-side service that calls Vercel API routes
// API key is secured server-side in /api routes

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function generateStoryAndImagePrompt(carPrompt: string): Promise<{ story: string; funFacts: string[], imagePrompt: string }> {
  try {
    const response = await fetch(`${API_BASE}/generate-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ carPrompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate story');
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error("Error generating story:", err);
    throw new Error(err.message || "Gramps is having a bit of engine trouble. Please try again.");
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (err: any) {
    console.error("Error generating image:", err);
    throw new Error(err.message || "The old camera seems to be on the fritz. Couldn't get a picture.");
  }
}

export async function editImage(base64Image: string, prompt: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/edit-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to edit image');
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (err: any) {
    console.error("Error editing image:", err);
    throw new Error(err.message || "Couldn't quite get that adjustment right. Let's try another way.");
  }
}
