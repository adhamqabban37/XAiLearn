# 🚀 Render Deployment Guide for AI Course Crafter

## Step 1: Choose Service Type

✅ **Select: "Web Service"**

This is the correct choice because your Next.js app needs:

- Server-side rendering
- Continuous running process
- HTTP request handling
- Port-based access

## Step 2: Connect Repository

1. Connect your GitHub account to Render
2. Select repository: `adhamqabban37/Ai-learn-`
3. Select branch: `main`

## Step 3: Configure Build Settings

### Basic Settings

```
Name: ai-course-crafter (or your preferred name)
Environment: Node
Region: Choose closest to your users
Branch: main
```

### Build Settings

```
Root Directory: (leave blank - uses repository root)
Build Command: npm install && npm run build
Start Command: npm run start
```

### Advanced Settings (Optional)

```
Auto-Deploy: Yes (recommended)
Health Check Path: / (default)
```

## Step 4: Add Environment Variables

⚠️ **IMPORTANT**: Add these in Render Dashboard → Environment → Environment Variables

### Required Variables:

```bash
# 1. Node Environment
NODE_ENV=production

# 2. Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 3. Google AI (Genkit)
GOOGLE_GENKIT_API_KEY=your_google_ai_api_key_here

# 4. Port (Render automatically sets this, but you can specify)
PORT=10000
```

### Where to Find These Values:

1. **Supabase Keys**:

   - Go to your Supabase project
   - Settings → API → Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Settings → API → anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Settings → API → service_role key (SUPABASE_SERVICE_ROLE_KEY)

2. **Google AI API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create/get your API key

## Step 5: Plan Selection

### Free Tier (Recommended for Testing)

- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start: 30-60 seconds on first request
- ✅ 750 hours/month (sufficient for testing)
- ✅ 100 GB bandwidth/month

### Starter Tier ($7/month)

- ✅ Always-on (no cold starts)
- ✅ Faster response times
- ✅ 400 hours/month
- ✅ Better for production use

## Step 6: Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Wait for initial build (5-10 minutes)
4. Your app will be live at: `https://ai-course-crafter-[random].onrender.com`

## Step 7: Custom Domain (Optional)

If you have a custom domain:

1. Go to Service → Settings → Custom Domain
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow Render's DNS configuration instructions
4. Wait for SSL certificate provisioning (automatic)

## 🔍 Troubleshooting

### Build Fails

- Check build logs in Render dashboard
- Verify all dependencies are in `package.json`
- Ensure Node version compatibility (check `package.json` engines)

### App Crashes on Start

- Check runtime logs
- Verify environment variables are set correctly
- Ensure `npm run start` works locally after `npm run build`

### Database Connection Issues

- Double-check Supabase URL and keys
- Ensure Supabase project is active
- Check RLS (Row Level Security) policies in Supabase

### AI Features Not Working

- Verify `GOOGLE_GENKIT_API_KEY` is set
- Check API key has proper permissions
- Review Genkit logs in application

## 📊 Monitoring

### Check App Status

- Render Dashboard → Your Service → Events tab
- View real-time logs in Logs tab
- Monitor metrics in Metrics tab

### Set Up Alerts (Optional)

- Go to Service → Settings → Health & Alerts
- Configure email notifications for downtime
- Set up response time alerts

## 🔄 Continuous Deployment

After initial setup, Render will automatically:

- ✅ Deploy on every push to `main` branch
- ✅ Run build command
- ✅ Restart service with new code
- ✅ Maintain zero-downtime deployments

To disable auto-deploy:

- Go to Service → Settings → Build & Deploy
- Toggle "Auto-Deploy" off

## 🎯 Quick Reference

| Setting       | Value                          |
| ------------- | ------------------------------ |
| Service Type  | **Web Service**                |
| Environment   | Node                           |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start`                |
| Health Check  | `/`                            |
| Port          | 10000 (auto-assigned)          |

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Community**: https://community.render.com/
- **Status**: https://status.render.com/

## ✅ Checklist

Before deploying, ensure:

- [ ] Code is pushed to GitHub
- [ ] `npm run build` works locally
- [ ] All environment variables are ready
- [ ] Supabase project is configured
- [ ] Google AI API key is active
- [ ] render.yaml is in repository (optional but recommended)

## 🚨 Security Notes

⚠️ **Never commit sensitive keys to Git!**

- Add `.env.local` to `.gitignore` (already done)
- Use Render's environment variable dashboard
- Rotate keys if accidentally exposed
- Use different keys for dev/production

## 🎉 Success!

Once deployed, your AI Course Crafter will be live!

- Share your Render URL with users
- Monitor usage in Render dashboard
- Scale up to paid tier when ready

---

**Need help?** Check the troubleshooting section or contact Render support.
