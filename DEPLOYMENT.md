# Deployment Instructions for Render

## Setting Up the Gemini API Key

### For Render Production:
1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add a new environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
4. Save changes (this will trigger a redeploy)

### For Local Development:
1. Create a `.env.local` file in the project root
2. Add: `GEMINI_API_KEY=your_gemini_api_key_here`
3. The `.env.local` file is already in `.gitignore` and won't be committed

## Deployment Steps

### Option 1: Using Render Dashboard
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your repository (GitHub authorization may be required)
5. Configure the service:
   - **Name:** classic-rides
   - **Region:** Choose closest to your users
   - **Branch:** main (or your default branch)
   - **Root Directory:** (leave empty)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Add environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
7. Click "Create Web Service"

### Option 2: Using Render MCP
If you've already connected your repository to Render, the deployment can be automated via MCP commands.

## API Routes

The API routes are in `/api` and handle:
- `/api/generate-story` - Generates story and image prompt
- `/api/generate-image` - Generates the image
- `/api/edit-image` - Edits an existing image
- `/api/health` - Health check endpoint

These routes run server-side, keeping your API key secure.
