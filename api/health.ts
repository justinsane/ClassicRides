// Health check endpoint to verify API key is accessible
export default async function handler(req: Request) {
  // Allow GET requests for health check
  if (req.method && req.method !== 'GET' && req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[health] Request received:', { method: req.method, url: req.url });
    const apiKey = process.env.GEMINI_API_KEY;
    
    return new Response(
      JSON.stringify({
        status: 'ok',
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey ? `${apiKey.substring(0, 4)}...` : 'none',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[health] Error:', err);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: err.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

