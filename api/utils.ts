// Utility function to safely parse request body in Vercel API routes
export async function parseRequestBody(req: Request): Promise<any> {
  try {
    console.log('[utils] Request type:', typeof req, 'has json:', typeof (req as any).json, 'has text:', typeof (req as any).text);
    
    // Try standard Fetch API method first
    if (typeof (req as any).json === 'function') {
      console.log('[utils] Using req.json()');
      return await (req as any).json();
    }
    
    // Fallback: read as text and parse
    if (typeof (req as any).text === 'function') {
      console.log('[utils] Using req.text() fallback');
      const text = await (req as any).text();
      if (!text) {
        return {};
      }
      return JSON.parse(text);
    }
    
    // Last resort: check if body is already parsed or accessible differently
    console.error('[utils] Request does not have json() or text() methods');
    throw new Error('Request object does not support standard parsing methods');
  } catch (err: any) {
    console.error('[utils] Error parsing request body:', err);
    throw new Error(`Failed to parse request body: ${err.message}`);
  }
}

