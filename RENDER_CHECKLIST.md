# Render Deployment Checklist

## ✅ Pre-Deployment Verification (Completed)

- [x] **Build Success:** Next.js production build completed
- [x] **Standalone Output:** `.next/standalone/` folder created
- [x] **Health Endpoint:** `/api/health` returns 200 OK
- [x] **Start Script:** Cross-platform PORT support working
- [x] **Dockerfile:** Multi-stage Docker build configured
- [x] **render.yaml:** Blueprint with Docker, health check, env vars
- [x] **Docker Installed:** v28.4.0 available

## 📋 Deployment Steps

### Step 1: Push to GitHub
```bash
cd "c:\Users\Tyson\Desktop\ai learn2.0\Ai-learn-"
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Create Render Account
1. Visit: https://render.com
2. Sign up with GitHub (free)
3. Authorize Render to access your repositories

### Step 3: Deploy via Blueprint
1. Click **"New +"** → **"Blueprint"**
2. Select repository: **adhamqabban37/XAiLearn**
3. Render detects `render.yaml` automatically
4. Review the configuration
5. Click **"Apply"**

### Step 4: Add Environment Variables
Go to your service → **"Environment"** tab and add these **secret** values:

**Copy values from your `.env.local` file:**

```env
NEXT_PUBLIC_SUPABASE_URL=<from-your-env-local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from-your-env-local>
GITHUB_TOKEN=<from-your-env-local>
DEEPSEEK_API_KEY=<from-your-env-local>
YOUTUBE_API_KEY=<from-your-env-local>
```

**Already configured in render.yaml (no action needed):**
- NODE_ENV=production
- AI_PROVIDER=github
- GH_MODELS_ENDPOINT=https://models.inference.ai.azure.com
- GH_MODELS_MODEL=gpt-4o-mini
- DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
- DEEPSEEK_MODEL=deepseek-chat

### Step 5: Wait for Build
Render will:
1. Clone your repository
2. Build Docker image (~3-5 minutes)
3. Deploy container
4. Run health checks
5. Make your app live

Watch the **"Logs"** tab for real-time progress.

### Step 6: Verify Deployment
Once "Live" badge appears:

```bash
# Test health endpoint (replace with your actual URL)
curl https://ai-learn.onrender.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...}
```

Visit your app:
```
https://ai-learn.onrender.com
```

### Step 7: Test Core Features
- [ ] Homepage loads
- [ ] Upload PDF works
- [ ] Course generation works (AI)
- [ ] Login/Signup works (Firebase)
- [ ] Database reads/writes work (Supabase)
- [ ] Certificate generation works
- [ ] YouTube embeds work

## 🔧 Troubleshooting

### "Build failed"
- Check Logs tab for error
- Verify Dockerfile exists
- Ensure all deps in package.json

### "Deploy failed - Health check timeout"
- Verify `/api/health` endpoint exists
- Check startup logs for crashes
- Increase startup time in Render settings

### "App loads but features broken"
- Missing environment variables (check Step 4)
- Check browser console for API errors
- Verify Supabase/Firebase credentials

### "Slow first load"
- Free tier spins down after 15 min inactivity
- First request wakes it up (~30s)
- Upgrade to Starter plan ($7/mo) for always-on

## 📊 Post-Deployment

### Monitor Health
```bash
# Check every 5 minutes
watch -n 300 curl https://ai-learn.onrender.com/api/health
```

### View Logs
Render Dashboard → Your Service → "Logs" tab

### Auto-Deploy
Every `git push origin main` triggers new deployment automatically.

### Custom Domain (Optional)
1. Render Dashboard → "Settings" → "Custom Domain"
2. Add your domain (e.g., `learn.yourdomain.com`)
3. Update DNS records as instructed

## 💰 Cost Summary
- **Current:** Free tier (with spin-down)
- **Upgrade:** $7/mo for always-on (recommended for production)

## ✅ Success Criteria
- [ ] Health endpoint returns 200
- [ ] All environment variables set
- [ ] App loads in browser
- [ ] Login works
- [ ] Course creation works
- [ ] Database operations work
- [ ] No errors in Render logs

---

## Ready? Start with Step 1! 🚀

**Estimated time:** 10-15 minutes from start to live app.

**Need help?** Check RENDER_DEPLOY.md for detailed troubleshooting.
