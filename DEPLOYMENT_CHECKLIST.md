# ⚡ QUICK START - AI Optimization Deployment

Copy-paste this checklist and mark items as you complete them.

---

## 🚨 BEFORE DEPLOYMENT (Required)

### Step 1: Update Domain References
- [ ] Find & replace `your-domain.com` in these files:
  - [ ] `public/robots.txt` → Your actual domain
  - [ ] `src/app/sitemap.ts` → Your actual domain
  - [ ] `src/app/layout.tsx` → metadataBase URL

### Step 2: Environment Variables
- [ ] Open `.env.local` file
- [ ] Add this line:
  ```
  NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
  ```
- [ ] Replace with your real domain
- [ ] Save the file

### Step 3: Update AEO/GEO Config
- [ ] Open `src/app/layout.tsx`
- [ ] Find lines 33-56 (the AEO config section)
- [ ] Replace these placeholders:
  - [ ] `BRAND_NAME` → Your brand name
  - [ ] `COURSE_TITLE` → Your main course offering
  - [ ] `TARGET_AUDIENCE` → Your target users
  - [ ] `CITY, STATE` → Your location
  - [ ] `SITE_URL` → Your actual domain
  - [ ] Social media URLs in `sameAs` array

### Step 4: Update Contact Info
- [ ] `src/app/faq/page.tsx`:
  - [ ] Line ~195: Replace `support@your-domain.com` with real email
  - [ ] Line ~196: Add real Discord link
  - [ ] Line ~197: Add real Twitter link
  
- [ ] `src/app/about/page.tsx`:
  - [ ] Find social media links section
  - [ ] Update Twitter, LinkedIn URLs

### Step 5: Update Social Media Handles
- [ ] `src/app/layout.tsx`:
  - [ ] Line ~75: Change `@AILearnPlatform` to your Twitter/X handle

---

## 🎨 CREATE IMAGES (Required)

### Required Images:
- [ ] **Open Graph Image** (`public/og-image.png`)
  - Size: 1200x630px
  - Include: Logo + tagline + value proposition
  - Tools: Canva, Figma, or Photoshop
  - Test: https://www.opengraph.xyz/

- [ ] **Twitter Card** (`public/twitter-image.png`)
  - Size: 1200x675px
  - Similar to OG image
  - Test: https://cards-dev.twitter.com/validator

- [ ] **Logo** (`public/logo.png`)
  - Size: 512x512px (square)
  - PNG with transparent background
  - Used for structured data

### Optional Images:
- [ ] `public/android-chrome-192x192.png` (for PWA)
- [ ] `public/android-chrome-512x512.png` (for PWA)
- [ ] `public/apple-touch-icon.png` (180x180px)
- [ ] `public/screenshot-1.png` (homepage screenshot)
- [ ] `public/screenshot-2.png` (lesson view screenshot)

---

## ✅ LOCAL TESTING (Required)

### Test Build:
```bash
npm run typecheck
npm run build
npm run start
```

- [ ] Type check passes ✓
- [ ] Build succeeds ✓
- [ ] Local server runs ✓

### Test Pages:
Visit these URLs locally (http://localhost:9002):
- [ ] `/` - Homepage loads
- [ ] `/about` - About page displays
- [ ] `/ai-info` - AI info page works
- [ ] `/faq` - FAQ accordions open/close
- [ ] `/dashboard` - Dashboard accessible
- [ ] `/lesson` - Lesson view works
- [ ] `/robots.txt` - Shows AI crawler rules
- [ ] `/sitemap.xml` - Shows XML sitemap

---

## 🚀 DEPLOYMENT

### Deploy to Production:
- [ ] Push code to Git repository
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Set environment variables in hosting dashboard:
  ```
  NEXT_PUBLIC_SITE_URL=https://your-domain.com
  ```
- [ ] Verify deployment successful

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### Check Live URLs:
- [ ] `https://your-domain.com/robots.txt` → AI crawlers allowed
- [ ] `https://your-domain.com/sitemap.xml` → Sitemap generated
- [ ] `https://your-domain.com/ai-info` → Page loads correctly
- [ ] `https://your-domain.com/faq` → FAQ works
- [ ] `https://your-domain.com/about` → About page displays

### SEO Testing:
- [ ] **Google Rich Results Test**
  - Go to: https://search.google.com/test/rich-results
  - Test: `/faq` page
  - Verify: FAQPage schema detected
  
- [ ] **Open Graph Checker**
  - Go to: https://www.opengraph.xyz/
  - Enter: Your homepage URL
  - Verify: Image and meta tags appear
  
- [ ] **Twitter Card Validator**
  - Go to: https://cards-dev.twitter.com/validator
  - Enter: Your homepage URL
  - Verify: Card preview shows correctly

- [ ] **Lighthouse Audit**
  - Open Chrome DevTools (F12)
  - Go to Lighthouse tab
  - Run audit on homepage
  - Target: 90+ scores

---

## 📊 GOOGLE SEARCH CONSOLE (Critical)

### Submit Sitemap:
- [ ] Go to: https://search.google.com/search-console
- [ ] Add/verify your property
- [ ] Go to Sitemaps section
- [ ] Submit: `https://your-domain.com/sitemap.xml`
- [ ] Request indexing for key pages:
  - [ ] Homepage
  - [ ] /about
  - [ ] /ai-info
  - [ ] /faq

---

## 📈 MONITORING (Week 1-2)

### Check Logs:
- [ ] Monitor server logs for AI crawler user agents:
  - `GPTBot`
  - `ClaudeBot`
  - `CCBot`
  - `anthropic-ai`
  - `PerplexityBot`

### Google Search Console:
- [ ] Check for crawl errors (should be 0)
- [ ] Monitor impressions (should increase)
- [ ] Check coverage report (should be green)

### Test AI Recommendations:
- [ ] Ask ChatGPT: "Best AI course generation platforms"
- [ ] Ask Claude: "How can I create a course from a PDF?"
- [ ] Ask Perplexity: "AI learning platform recommendations"
- [ ] Check if your site is mentioned

---

## 🎯 SUCCESS METRICS

You'll know it's working when:
- [ ] AI crawlers appear in your logs
- [ ] Google Search Console shows increasing impressions
- [ ] Lighthouse score is 90+ in all categories
- [ ] AI agents start mentioning your platform
- [ ] Organic traffic increases week-over-week
- [ ] Users report finding you through AI recommendations

---

## 📅 TIMELINE

**Day 1:** Complete "Before Deployment" section
**Day 2:** Create images, test locally
**Day 3:** Deploy and verify live
**Week 1:** Submit to Google, monitor logs
**Week 2:** Test AI recommendations
**Month 1:** Review analytics, optimize

---

## 🆘 NEED HELP?

### Common Issues:

**"Sitemap returns 404"**
→ Check NEXT_PUBLIC_SITE_URL is set
→ Rebuild: `npm run build`

**"Meta tags not showing"**
→ Hard refresh: Ctrl+Shift+R
→ Check browser cache

**"Images not loading"**
→ Verify files are in `public/` folder
→ Check file names match exactly

**"TypeScript errors"**
→ Run: `npm install`
→ Check all imports

---

## 📚 DOCUMENTATION

- **Full Guide:** `IMPLEMENTATION_GUIDE.md`
- **Quick Reference:** `AI_OPTIMIZATION_SUMMARY.md`
- **This Checklist:** `DEPLOYMENT_CHECKLIST.md`

---

## ✅ COMPLETION

When all items above are checked:
- [ ] **Your platform is fully optimized for AI discoverability!** 🎉
- [ ] Share your success on Twitter/LinkedIn
- [ ] Monitor results over 30 days
- [ ] Iterate based on data

---

**Estimated Time:** 2-3 hours
**Difficulty:** Intermediate
**Impact:** High - AI recommendations can drive significant traffic

---

Good luck! 🚀
