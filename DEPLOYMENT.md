# Deployment Instructions for Vercel

## Setting Up the Gemini API Key

### For Vercel Production:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environment:** Production (and optionally Preview/Development)
4. Save and redeploy

### For Local Development:
1. Create a `.env.local` file in the project root
2. Add: `GEMINI_API_KEY=your_gemini_api_key_here`
3. The `.env.local` file is already in `.gitignore` and won't be committed

## Deployment Steps

1. Push your code to GitHub/GitLab/Bitbucket
2. Connect your repository to Vercel
3. Vercel will auto-detect Vite and deploy
4. Make sure `GEMINI_API_KEY` is set in Vercel environment variables
5. Deploy!

## API Routes

The API routes are in `/api` and handle:
- `/api/generate-story` - Generates story and image prompt
- `/api/generate-image` - Generates the image
- `/api/edit-image` - Edits an existing image

These routes run as Vercel serverless functions, keeping your API key secure server-side.

