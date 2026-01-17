# Multi-Agent Chat - Vercel Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Vercel deployment config"
   git push
   ```

2. **In Vercel Dashboard**:
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `./` (root)
     - **Build Command**: Leave empty
     - **Output Directory**: Leave empty
     - **Install Command**: Leave empty

3. **Environment Variables**:
   Add in Vercel dashboard:
   - `OPENAI_API_KEY` = your-openai-api-key

4. **Deploy**!

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add OPENAI_API_KEY

# Deploy to production
vercel --prod
```

## Configuration Files

- `vercel.json` - Vercel configuration
- `examples/multi_agent_chat/requirements.txt` - Python dependencies
- `examples/multi_agent_chat/api/index.py` - Serverless function entry point

## How It Works

- Frontend (HTML/JS) served as static files
- Backend (FastAPI) runs as serverless functions in `/api`
- Automatically scales with traffic
- Environment variables loaded from Vercel settings

## Local Testing

Backend still works locally:
```bash
cd examples/multi_agent_chat
uv run python server.py
```

Frontend automatically detects localhost vs production.

## Troubleshooting

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify `OPENAI_API_KEY` is set in environment variables
3. Ensure all files are committed to git

## Cost

Vercel free tier includes:
- 100GB bandwidth/month
- Serverless function executions
- Automatic HTTPS

OpenAI API costs apply per chat message.
