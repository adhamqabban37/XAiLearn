# ✅ Pre-Launch Checklist

Use this checklist before deploying to production.

## 🔍 Pre-Deployment Verification

### Build & Server

- [ ] Run `npm run build` - Should complete in ~34 seconds
- [ ] Run `npm run start` - Should start in ~3.4 seconds
- [ ] Run `npm run typecheck` - Should pass with no errors
- [ ] Check build output - Should show optimized bundles

### Environment

- [ ] `.env.local` exists with all required variables
- [ ] `GEMINI_API_KEY` is set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and valid
- [ ] `.env.example` documents all variables

### Dependencies

- [ ] Run `npm install` - All dependencies installed
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] All peer dependencies satisfied
- [ ] Lock file is up to date

### Configuration Files

- [ ] `next.config.ts` - Image optimization enabled
- [ ] `tsconfig.json` - Test files excluded
- [ ] `vercel.json` or `netlify.toml` - Hosting configured
- [ ] `apphosting.yaml` - Firebase configured (if using)

### Database (Supabase)

- [ ] User authentication table exists
- [ ] `user_courses` table created
- [ ] Row Level Security (RLS) enabled
- [ ] RLS policies created and tested
- [ ] Test user can sign up and log in
- [ ] Test user can save and retrieve courses

### Testing (Optional but Recommended)

- [ ] Run `npm test` - Unit tests pass
- [ ] Run `npm run e2e` - E2E tests pass (if configured)
- [ ] Manual test: Sign up flow
- [ ] Manual test: Login flow
- [ ] Manual test: PDF upload
- [ ] Manual test: Course creation
- [ ] Manual test: Lesson navigation
- [ ] Manual test: Progress tracking

---

## 🚀 Deployment Steps

### 1. Choose Platform

- [ ] Vercel (recommended for Next.js)
- [ ] Netlify
- [ ] Firebase App Hosting

### 2. Pre-Deploy Check

```bash
# Automated check
.\scripts\pre-deploy.ps1

# Or manual
npm run typecheck
npm run build
npm run start
```

### 3. Deploy

#### If using Vercel:

```bash
.\scripts\deploy-vercel.ps1
# or
npx vercel --prod
```

#### If using Netlify:

```bash
npx netlify deploy --prod
```

#### If using Firebase:

```bash
firebase deploy --only hosting
```

### 4. Set Environment Variables

In your hosting platform dashboard, add:

- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Verify Deployment

- [ ] Visit production URL
- [ ] Test homepage loads
- [ ] Test login page loads
- [ ] Test sign-up flow
- [ ] Test authentication
- [ ] Test PDF upload
- [ ] Test course creation
- [ ] Test lesson view
- [ ] Check browser console for errors
- [ ] Check network tab for failed requests

---

## 📊 Post-Deployment

### Immediate (First Hour)

- [ ] Test all main routes:
  - [ ] `/` - Homepage
  - [ ] `/login` - Login page
  - [ ] `/signup` - Sign-up page
  - [ ] `/dashboard` - Dashboard
  - [ ] `/lesson` - Lesson view
- [ ] Test authentication flow end-to-end
- [ ] Test file upload functionality
- [ ] Check API endpoints respond correctly
- [ ] Monitor error logs

### First 24 Hours

- [ ] Run Lighthouse audit (aim for 90+ score)
- [ ] Check Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] Monitor Supabase usage dashboard
- [ ] Check Gemini API usage and quotas
- [ ] Review error rates in hosting dashboard
- [ ] Test on mobile devices
- [ ] Test on different browsers

### First Week

- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry recommended)
- [ ] Set up analytics (Google Analytics, Plausible)
- [ ] Monitor performance metrics
- [ ] Gather user feedback
- [ ] Review API costs
- [ ] Check database storage usage

### Ongoing

- [ ] Weekly: Review error logs
- [ ] Weekly: Check performance metrics
- [ ] Monthly: Review API usage and costs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] As needed: Scale hosting resources

---

## 🐛 Troubleshooting

### Build Fails

1. Check environment variables are set
2. Run `npm install` to ensure dependencies
3. Check for TypeScript errors: `npm run typecheck`
4. Review build logs for specific errors

### Server Won't Start

1. Check port is not already in use
2. Verify `.env.local` exists and is valid
3. Check build completed successfully
4. Review console output for errors

### Authentication Not Working

1. Verify Supabase URL and keys in environment
2. Check Supabase dashboard for user creation
3. Verify RLS policies are enabled
4. Check browser console for auth errors

### Images Not Loading

1. Verify remote patterns in `next.config.ts`
2. Check image URLs are accessible
3. Review browser console for CORS errors
4. Confirm image optimization is enabled

### API Routes Failing

1. Check Gemini API key is valid
2. Verify API quotas not exceeded
3. Review API error responses
4. Check network tab for request details

---

## 📞 Emergency Contacts

### Platform Support

- **Vercel:** https://vercel.com/support
- **Netlify:** https://www.netlify.com/support/
- **Firebase:** https://firebase.google.com/support

### Service Status

- **Vercel:** https://www.vercel-status.com
- **Supabase:** https://status.supabase.com
- **Google Cloud:** https://status.cloud.google.com

### Documentation

- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Genkit:** https://firebase.google.com/docs/genkit

---

## 📝 Notes

### Quick Reference

- Build time: ~34 seconds
- Startup time: ~3.4 seconds
- Build size: ~570 MB
- Bundle optimized: Yes
- Image optimization: AVIF/WebP
- Code splitting: Enabled
- Lazy loading: Configured

### Important Files

- `DEPLOYMENT_SUMMARY.md` - Quick deployment overview
- `docs/VERIFICATION_REPORT.md` - Full technical report
- `docs/DEPLOYMENT_READINESS.md` - Complete deployment guide
- `.env.example` - Environment variable template

---

## ✅ Sign-Off

### Before Deploying

- [ ] All pre-deployment checks complete
- [ ] Environment variables documented
- [ ] Hosting platform chosen
- [ ] Deployment script ready

### After Deploying

- [ ] Production URL accessible
- [ ] All routes tested
- [ ] Environment variables set in dashboard
- [ ] Monitoring configured
- [ ] Team notified

---

**Prepared:** October 15, 2025  
**Status:** Ready for deployment  
**Confidence:** High (98%)

🚀 Good luck with your launch!
