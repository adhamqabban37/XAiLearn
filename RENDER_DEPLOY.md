# Deploy to Render - Quick Start Guide

## Prerequisites
✅ Your code is ready with Docker support
✅ Health endpoint at `/api/health`
✅ `render.yaml` configured
✅ GitHub repository ready

## Step-by-Step Deployment

### 1. Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for auto-deploys)

### 2. Connect Your Repository
1. Click "New +" → "Blueprint"
2. Connect your GitHub account (authorize Render)
3. Select your repository: `adhamqabban37/XAiLearn`
4. Render will detect `render.yaml` automatically
5. Click "Apply"

### 3. Configure Environment Variables

**IMPORTANT:** You need to add these secrets in the Render dashboard:

#### Required Secrets (sync: false in render.yaml)
Navigate to your service → "Environment" tab and add:

**Copy values from your `.env.local` file:**

```
NEXT_PUBLIC_SUPABASE_URL = <your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your-supabase-anon-key>
GITHUB_TOKEN = <your-github-token>
DEEPSEEK_API_KEY = <your-deepseek-api-key>
YOUTUBE_API_KEY = <your-youtube-api-key>
```

#### Auto-Configured (from render.yaml)
These are already set in render.yaml:
- `NODE_ENV = production`
- `AI_PROVIDER = github`
- `GH_MODELS_ENDPOINT = https://models.inference.ai.azure.com`
- `GH_MODELS_MODEL = gpt-4o-mini`
- `DEEPSEEK_BASE_URL = https://api.deepseek.com/v1`
- `DEEPSEEK_MODEL = deepseek-chat`

### 4. Deploy
1. After adding environment variables, Render will automatically build and deploy
2. Docker build process:
   - Installs dependencies
   - Builds Next.js with standalone output
   - Creates optimized production image
3. Monitor the deploy logs in the Render dashboard

### 5. Verify Deployment

Once deployed, your app will be at: `https://ai-learn.onrender.com` (or your custom name)

**Test the health endpoint:**
```bash
curl https://ai-learn.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "0.1.0",
  "port": "10000"
}
```

### 6. Configure Custom Domain (Optional)
1. Go to your service → "Settings" tab
2. Click "Add Custom Domain"
3. Follow DNS configuration instructions

## Render Free Tier Limits
- ✅ 750 hours/month free (enough for 1 always-on service)
- ✅ Automatic SSL certificates
- ✅ Continuous deployment from GitHub
- ⚠️ Spins down after 15 min of inactivity (first request takes ~30s)
- ⚠️ 512 MB RAM limit

## Monitoring
- **Health Check:** Render uses `/api/health` every 30 seconds
- **Logs:** Available in Render dashboard under "Logs" tab
- **Metrics:** CPU, Memory, and Request metrics in "Metrics" tab

## Troubleshooting

### Build Fails
- Check "Logs" tab for detailed error messages
- Common issue: Missing environment variables
- Verify Dockerfile exists and is valid

### App Won't Start
- Verify all required environment variables are set
- Check that health endpoint returns 200
- Review startup logs for errors

### Health Check Fails
- Ensure `/api/health` route exists
- Check app logs for runtime errors
- Verify PORT environment variable is set

### Database Connection Fails
- Verify Supabase URL and anon key are correct
- Check Supabase service status
- Test connection locally first

## Auto-Deploy from GitHub
Every push to your `main` branch will trigger:
1. Automatic build using Docker
2. Health check verification
3. Zero-downtime deployment

## Cost Estimate
- **Free Tier:** $0/month (with spin-down)
- **Starter Plan:** $7/month (always-on, 512 MB RAM)
- **Standard Plan:** $25/month (2 GB RAM, priority support)

## Next Steps After Deployment
1. ✅ Test all features (auth, database, AI generation)
2. ✅ Configure custom domain
3. ✅ Set up monitoring alerts
4. ✅ Add CD/CI checks (optional)
5. ✅ Consider upgrading to paid plan for always-on service

## Quick Commands

### Manual Deploy Trigger
```bash
# Commit and push to trigger deploy
git add .
git commit -m "Deploy to Render"
git push origin main
```

### View Logs
```bash
# Install Render CLI (optional)
npm install -g render-cli
render login
render logs <service-id>
```

### Redeploy
Go to Render dashboard → "Manual Deploy" → "Deploy latest commit"

---

**Ready to deploy?** Follow steps 1-5 above and your app will be live in ~5-10 minutes! 🚀
