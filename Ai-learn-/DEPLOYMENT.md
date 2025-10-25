# Deployment Guide

This guide covers deploying your Next.js application to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- ✅ All environment variables configured
- ✅ `output: 'standalone'` in `next.config.ts`
- ✅ Health check endpoint at `/api/health`
- ✅ PORT environment variable support in start script
- ✅ Node.js >= 18.17.0

## Platform-Specific Deployment

### 1. Render (Docker - RECOMMENDED)

**Configuration File:** `render.yaml`

**Steps:**
1. Create a new account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Render will auto-detect `render.yaml` and deploy using Docker
4. Add environment variables in Render dashboard:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

**Health Check:** Render will use `/api/health` (configured in render.yaml)

---

### 2. Railway (Docker)

**Configuration File:** `railway.json`

**Steps:**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Create project: `railway init`
4. Link project: `railway link`
5. Deploy: `railway up`

**Environment Variables:**
```bash
railway variables set NEXT_PUBLIC_FIREBASE_API_KEY=your_key
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
# ... add all other variables
```

**Health Check:** Configured in `railway.json` at `/api/health`

---

### 3. Vercel (Native Next.js)

**Configuration File:** `vercel.json` (optional)

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

**Or via Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Next.js and deploys

**Environment Variables:** Add in Vercel dashboard under Settings > Environment Variables

---

### 4. Netlify

**Configuration File:** `netlify.toml`

**Steps:**
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Initialize: `netlify init`
4. Deploy: `netlify deploy --prod`

**Or via Dashboard:**
1. Go to [netlify.com](https://netlify.com)
2. Import your GitHub repository
3. Netlify uses `netlify.toml` configuration

**Required Plugin:** `@netlify/plugin-nextjs` (automatically installed)

---

### 5. Fly.io (Docker)

**Configuration File:** `fly.toml`

**Steps:**
1. Install Fly CLI: 
   - Windows: `iwr https://fly.io/install.ps1 -useb | iex`
   - Mac/Linux: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Launch app (first time):
   ```bash
   fly launch --no-deploy
   # Edit fly.toml if needed
   fly deploy
   ```
4. Set secrets:
   ```bash
   fly secrets set NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   fly secrets set GEMINI_API_KEY=your_key
   # ... add all other variables
   ```

**Health Check:** Configured in `fly.toml` at `/api/health`

---

### 6. Heroku

**Configuration File:** `Procfile`

**Steps:**
1. Install Heroku CLI: [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set buildpack: `heroku buildpacks:set heroku/nodejs`
5. Set environment variables:
   ```bash
   heroku config:set NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   heroku config:set GEMINI_API_KEY=your_key
   # ... add all other variables
   ```
6. Deploy: `git push heroku main`

**Health Check:** Add in Heroku dashboard or use CLI:
```bash
heroku ps:wait --wait-for=healthy --type=web
```

---

### 7. Google Cloud Run (Docker)

**Configuration File:** `service.yaml`

**Steps:**
1. Install gcloud CLI: [cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2. Login: `gcloud auth login`
3. Set project: `gcloud config set project YOUR_PROJECT_ID`
4. Enable APIs:
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```
5. Build and push Docker image:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ai-learn
   ```
6. Deploy:
   ```bash
   gcloud run deploy ai-learn \
     --image gcr.io/YOUR_PROJECT_ID/ai-learn \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```
7. Set environment variables:
   ```bash
   gcloud run services update ai-learn \
     --update-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=your_key,GEMINI_API_KEY=your_key
   ```

**Health Check:** Configured in `service.yaml`

---

### 8. AWS Elastic Beanstalk

**Configuration Files:** `.platform/hooks/predeploy/01_build.sh`, `.platform/options.config`

**Steps:**
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init -p node.js-18 your-app-name`
3. Create environment: `eb create production-env`
4. Set environment variables:
   ```bash
   eb setenv NEXT_PUBLIC_FIREBASE_API_KEY=your_key GEMINI_API_KEY=your_key
   ```
5. Deploy: `eb deploy`

**Health Check:** Configured in `.platform/options.config` at `/api/health`

---

### 9. Azure App Service

**Steps:**
1. Install Azure CLI: [docs.microsoft.com/cli/azure/install-azure-cli](https://docs.microsoft.com/cli/azure/install-azure-cli)
2. Login: `az login`
3. Create resource group:
   ```bash
   az group create --name ai-learn-rg --location eastus
   ```
4. Create App Service plan:
   ```bash
   az appservice plan create \
     --name ai-learn-plan \
     --resource-group ai-learn-rg \
     --sku B1 \
     --is-linux
   ```
5. Create web app:
   ```bash
   az webapp create \
     --resource-group ai-learn-rg \
     --plan ai-learn-plan \
     --name your-unique-app-name \
     --runtime "NODE:18-lts"
   ```
6. Configure deployment:
   ```bash
   az webapp deployment source config-local-git \
     --name your-unique-app-name \
     --resource-group ai-learn-rg
   ```
7. Set environment variables:
   ```bash
   az webapp config appsettings set \
     --resource-group ai-learn-rg \
     --name your-unique-app-name \
     --settings NEXT_PUBLIC_FIREBASE_API_KEY=your_key GEMINI_API_KEY=your_key
   ```
8. Deploy via Git:
   ```bash
   git remote add azure <git-url-from-step-6>
   git push azure main
   ```

**Health Check:** Configure in Azure portal under "Health check" settings, set path to `/api/health`

---

## Environment Variables

All platforms require these environment variables:

### Firebase (Authentication)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Supabase (Database)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### AI/ML Services
- `GEMINI_API_KEY`

### System (Auto-set by most platforms)
- `NODE_ENV=production`
- `PORT` (platform-provided)

---

## Testing Deployment Locally

### Test with Node.js
```bash
npm run build
npm start
# Visit http://localhost:3000/api/health
```

### Test with Docker
```bash
docker build -t ai-learn .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_FIREBASE_API_KEY=your_key \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  ai-learn
# Visit http://localhost:3000/api/health
```

---

## Troubleshooting

### Build Fails
- Check Node.js version: `node -v` (should be >= 18.17.0)
- Clear cache: `rm -rf .next node_modules && npm ci && npm run build`
- Check for TypeScript errors: `npm run typecheck`

### Health Check Fails
- Test locally: `curl http://localhost:3000/api/health`
- Check logs for startup errors
- Verify PORT environment variable is set correctly

### App Won't Start
- Check `package.json` start script uses PORT: `next start -p ${PORT:-3000}`
- Verify `next.config.ts` has `output: 'standalone'`
- Check platform logs for errors

### Docker Build Fails
- Ensure `.dockerignore` excludes `node_modules` and `.next`
- Build locally to test: `docker build -t test .`
- Check Docker logs: `docker logs <container-id>`

---

## Recommended Platform

**For beginners:** Vercel or Netlify (native Next.js support, easiest setup)
**For Docker:** Render or Railway (great free tier, simple Docker deployment)
**For production:** Google Cloud Run or AWS (enterprise-grade, scalable)
**For cost:** Fly.io (generous free tier, auto-scaling)

---

## Post-Deployment Checklist

- [ ] Health check endpoint returns 200: `curl https://your-app.com/api/health`
- [ ] All environment variables are set
- [ ] Firebase authentication works
- [ ] Supabase database queries work
- [ ] Certificate generation works (requires Gemini API)
- [ ] HTTPS is enabled
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/logging enabled
- [ ] Backup strategy in place

---

## Need Help?

If you encounter issues:
1. Check platform-specific documentation
2. Review application logs
3. Test health endpoint: `/api/health`
4. Verify all environment variables
5. Test locally with Docker first

Happy deploying! 🚀
