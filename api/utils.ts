// Utility function to safely parse request body in Vercel API routes
export async function parseRequestBody(req: Request): Promise<any> {
  try {
    const reqAny = req as any;
    
    console.log('[utils] Request properties:', {
      type: typeof req,
      hasJson: typeof reqAny.json,
      hasText: typeof reqAny.text,
      hasBody: 'body' in reqAny,
      bodyType: typeof reqAny.body,
      keys: Object.keys(reqAny).slice(0, 10), // Log first 10 keys
    });
    
    // Check if body is already parsed (Express-style or Vercel wrapper)
    if (reqAny.body !== undefined) {
      console.log('[utils] Using req.body (already parsed)');
      // If it's already an object/string, return it
      if (typeof reqAny.body === 'object' && reqAny.body !== null) {
        return reqAny.body;
      }
      // If it's a string, parse it
      if (typeof reqAny.body === 'string') {
        return JSON.parse(reqAny.body);
      }
    }
    
    // Try standard Fetch API method
    if (typeof reqAny.json === 'function') {
      console.log('[utils] Using req.json()');
      return await reqAny.json();
    }
    
    // Try text method
    if (typeof reqAny.text === 'function') {
      console.log('[utils] Using req.text()');
      const text = await reqAny.text();
      if (!text) {
        return {};
      }
      return JSON.parse(text);
    }
    
    // Try reading from body stream if it exists
    if (reqAny.body && typeof reqAny.body.getReader === 'function') {
      console.log('[utils] Reading from body stream');
      const reader = reqAny.body.getReader();
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      
      const decoder = new TextDecoder();
      const bodyString = decoder.decode(
        new Uint8Array(
          chunks.reduce((acc, chunk) => [...acc, ...Array.from(chunk)], [] as number[])
        )
      );
      
      return JSON.parse(bodyString || '{}');
    }
    
    // Check if there's a readable stream
    if (reqAny.body && typeof reqAny.body.pipe === 'function') {
      console.log('[utils] Reading from Node.js stream');
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        reqAny.body.on('data', (chunk: Buffer) => chunks.push(chunk));
        reqAny.body.on('end', () => {
          try {
            const bodyString = Buffer.concat(chunks).toString();
            resolve(JSON.parse(bodyString || '{}'));
          } catch (err) {
            reject(err);
          }
        });
        reqAny.body.on('error', reject);
      });
    }
    
    // Last resort: try to access raw body via different methods
    console.error('[utils] Cannot determine how to parse request body');
    console.error('[utils] Full request object keys:', Object.keys(reqAny));
    throw new Error('Request object does not support standard parsing methods');
  } catch (err: any) {
    console.error('[utils] Error parsing request body:', err);
    throw new Error(`Failed to parse request body: ${err.message}`);
  }
}

