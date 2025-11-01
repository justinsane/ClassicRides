import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import generateStoryHandler from './api/generate-story.ts';
import generateImageHandler from './api/generate-image.ts';
import editImageHandler from './api/edit-image.ts';
import healthHandler from './api/health.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.post('/api/generate-story', async (req, res) => {
  try {
    console.log('[server] Express req.body:', JSON.stringify(req.body));
    console.log('[server] Express req.body type:', typeof req.body);
    console.log('[server] Express req.body keys:', req.body ? Object.keys(req.body) : 'null/undefined');
    console.log('[server] Express req.body.carPrompt:', req.body?.carPrompt);
    
    // If Express has already parsed the body, use it directly
    const bodyString = typeof req.body === 'object' && req.body !== null 
      ? JSON.stringify(req.body) 
      : (req.body || '{}');
    
    console.log('[server] Body string for Request:', bodyString);
    
    // Create headers with explicit Content-Type for JSON body
    const headers = new Headers(req.headers as any);
    headers.set('Content-Type', 'application/json');
    
    console.log('[server] Request headers:', Object.fromEntries(headers.entries()));
    
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: headers,
      body: bodyString,
    });
    
    console.log('[server] Request created, calling handler...');
    const response = await generateStoryHandler(request);
    const body = await response.text();
    res.status(response.status).set(Object.fromEntries(response.headers.entries())).send(body);
  } catch (error: any) {
    console.error('[server] Error in generate-story:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: JSON.stringify(req.body),
    });
    const response = await generateImageHandler(request);
    const body = await response.text();
    res.status(response.status).set(Object.fromEntries(response.headers.entries())).send(body);
  } catch (error: any) {
    console.error('[server] Error in generate-image:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.post('/api/edit-image', async (req, res) => {
  try {
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: JSON.stringify(req.body),
    });
    const response = await editImageHandler(request);
    const body = await response.text();
    res.status(response.status).set(Object.fromEntries(response.headers.entries())).send(body);
  } catch (error: any) {
    console.error('[server] Error in edit-image:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: new Headers(req.headers as any),
    });
    const response = await healthHandler(request);
    const body = await response.text();
    res.status(response.status).set(Object.fromEntries(response.headers.entries())).send(body);
  } catch (error: any) {
    console.error('[server] Error in health:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Serve static files from dist directory
const staticPath = join(__dirname, 'dist');
app.use(express.static(staticPath, {
  setHeaders: (res, path) => {
    console.log(`[static] Serving: ${path}`);
  }
}));

// Catch-all handler: send back React's index.html file for any non-API routes
// This should only hit if static middleware didn't serve a file
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = join(__dirname, 'dist', 'index.html');
  console.log(`[server] Catch-all: Serving index.html for ${req.path}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[server] Error serving index.html:', err);
      res.status(500).send('Error serving application');
    }
  });
});

// Error handler (must be last)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files from: ${join(__dirname, 'dist')}`);
  
  // Check if dist directory exists
  const distPath = join(__dirname, 'dist');
  const indexPath = join(distPath, 'index.html');
  console.log(`Dist exists: ${existsSync(distPath)}`);
  console.log(`Index.html exists: ${existsSync(indexPath)}`);
});

