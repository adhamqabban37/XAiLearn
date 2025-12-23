# 🚀 Render Deployment Guide

## ✅ Pre-Deployment Checklist - COMPLETED

- ✅ **Code Pushed to GitHub**: Latest changes committed and pushed
- ✅ **Production Build**: Tested successfully (`npm run build`)
- ✅ **Standalone Mode**: Configured in `next.config.ts`
- ✅ **render.yaml**: Blueprint configured with all environment variables
- ✅ **Health Check**: `/api/health` endpoint ready
- ✅ **AI Provider**: Google Gemini API configured (gemini-1.5-flash-latest)
- ✅ **Quiz Generation**: Enhanced with session grouping and improved prompts

---

## 📋 Deployment Steps

### Step 1: Access Render Dashboard

1. Go to [https://render.com](https://render.com)
2. Sign in with your GitHub account
3. Authorize Render to access your repositories if needed

### Step 2: Deploy Using Blueprint

1. Click **"New +"** button in top right
2. Select **"Blueprint"** from the dropdown
3. Connect your repository: **adhamqabban37/XAiLearn**
4. Render will automatically detect `render.yaml`
5. Review the service configuration
6. Click **"Apply"** to start deployment

### Step 3: Configure Environment Variables

After deployment starts, go to your service → **"Environment"** tab and add these **SECRET** values:

```bash
# Required - Google Gemini API
GOOGLE_GENAI_API_KEY=AIzaSyBvetr1n5TohqJi7V6ppsqkaFivBDsaDnQ

# Optional - Admin Token (for video repair features)
ADMIN_API_TOKEN=12345

# Optional - YouTube API (for video enrichment)
YOUTUBE_API_KEY=your_youtube_api_key_here
```

**Already Configured in render.yaml** (No action needed):

- `NODE_ENV=production`
- `PORT=10000`
- `AI_PROVIDER=google`
- All Deepseek and GitHub fallback configurations

### Step 4: Monitor Deployment

1. Watch the **"Logs"** tab during deployment
2. Build should complete in 2-5 minutes
3. Look for: `✓ Ready in XX ms`
4. Your app will be live at: `https://xailearning-1.onrender.com`

---

## 🔧 Environment Variables Reference

### Required for Quiz Generation

| Variable               | Value        | Description                                |
| ---------------------- | ------------ | ------------------------------------------ |
| `GOOGLE_GENAI_API_KEY` | Your API Key | Google Gemini API for quiz generation      |
| `AI_PROVIDER`          | `google`     | Set to use Google Gemini (already in yaml) |

### Optional AI Providers (Fallback)

| Variable           | Value      | Description                        |
| ------------------ | ---------- | ---------------------------------- |
| `GITHUB_TOKEN`     | Your Token | GitHub Models API token (fallback) |
| `DEEPSEEK_API_KEY` | Your Key   | DeepSeek API key (fallback)        |

### Optional Features

| Variable          | Value        | Description                            |
| ----------------- | ------------ | -------------------------------------- |
| `YOUTUBE_API_KEY` | Your Key     | YouTube Data API for video enrichment  |
| `ADMIN_API_TOKEN` | Secret Token | Admin access for video repair features |

---

## 🎯 Testing Your Deployment

### 1. Health Check

Visit: `https://xailearning-1.onrender.com/api/health`

Expected Response:

```json
{
  "status": "ok",
  "timestamp": "2025-12-23T...",
  "env": "production"
}
```

### 2. Quiz Generation Test

1. Go to your deployed app
2. Switch to **Quiz Mode**
3. Upload a PDF with definition/term pairs
4. Check that:
   - Questions are generated
   - Sessions are properly grouped
   - Distractors use terms from the document
   - Questions are in professional English

### 3. Course Generation Test

1. Switch to **Course Mode**
2. Paste some text or upload a PDF
3. Verify course structure is created with sessions and lessons

---

## 🐛 Troubleshooting

### Build Fails

- **Check Logs**: Look for TypeScript or dependency errors
- **Environment Variables**: Ensure `GOOGLE_GENAI_API_KEY` is set
- **Build Command**: Verify it's `npm ci && npm run build`

### App Crashes on Start

- **Port Binding**: Render sets `PORT=10000` automatically
- **Start Command**: Should be `npm run start:standalone`
- **Check Health Endpoint**: Visit `/api/health`

### Quiz Generation Returns Empty

- **Check API Key**: Verify `GOOGLE_GENAI_API_KEY` is valid
- **Model Access**: Ensure your API key has access to Gemini models
- **Check Logs**: Look for "404" errors indicating model not found

### 404 Errors for Google API

- **Model Name**: Using `gemini-1.5-flash-latest`
- **API Version**: Using `v1beta` endpoint
- **Quota**: Check Google Cloud Console for API quota limits

---

## 📊 Recent Updates

### What Was Fixed:

1. ✅ **Google Gemini API**: Updated to use `gemini-1.5-flash-latest` with `v1beta` endpoint
2. ✅ **Quiz Prompt**: Enhanced to extract definition/term pairs and create sessions
3. ✅ **Session Grouping**: Questions automatically grouped by topic (Legal, Contracts, etc.)
4. ✅ **Distractor Quality**: All wrong answers come from the same document
5. ✅ **Error Handling**: Improved logging and graceful error handling
6. ✅ **Render Config**: Added `GOOGLE_GENAI_API_KEY` to environment variables

### Quiz Generation Features:

- ✅ Extracts terms and definitions from two-column PDFs
- ✅ Groups questions into logical sessions
- ✅ Creates high-plausibility distractors from document terms
- ✅ Supports recall, application, and numerical question types
- ✅ Professional English output only

---

## 🔄 Redeployment

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically detect the push and redeploy your app.

---

## 📞 Support

- **Render Docs**: [https://render.com/docs](https://render.com/docs)
- **Render Status**: [https://status.render.com](https://status.render.com)
- **Google AI Docs**: [https://ai.google.dev/docs](https://ai.google.dev/docs)

---

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ Health check returns 200 OK
- ✅ Quiz generation creates questions from PDFs
- ✅ Sessions are properly grouped
- ✅ No 404 errors in logs for Google API
- ✅ App loads at your Render URL

**Your app is now ready for production! 🚀**
