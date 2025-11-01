import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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

// API Routes
app.post('/api/generate-story', async (req, res) => {
  try {
    const request = new Request('http://localhost' + req.url, {
      method: req.method,
      headers: new Headers(req.headers as any),
      body: JSON.stringify(req.body),
    });
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
app.use(express.static(join(__dirname, 'dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

