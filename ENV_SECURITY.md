# 🔐 ENVIRONMENT VARIABLE SECURITY GUIDE

**COMPLETE guide to securing environment variables in your Next.js + Firebase application**

---

## ⚠️ SECURITY STATUS: IMMEDIATE ACTION REQUIRED

Your application has been audited for environment variable security. This guide contains **CRITICAL INFORMATION** about protecting your Firebase configuration and API keys.

---

## 🚨 CRITICAL UNDERSTANDING: NEXT*PUBLIC* PREFIX

### **What is NEXT*PUBLIC*?**

In Next.js, any environment variable prefixed with `NEXT_PUBLIC_` is **INTENTIONALLY EXPOSED** to the client-side JavaScript bundle.

```bash
# ❌ EXPOSED TO CLIENT (bundled into JavaScript)
NEXT_PUBLIC_FIREBASE_API_KEY=abc123

# ✅ SERVER-ONLY (never sent to browser)
GEMINI_API_KEY=abc123
```

### **Why Does This Matter?**

- **Client-side variables** → Anyone can view them in browser DevTools → Network tab → JS bundles
- **Server-side variables** → Only accessible in Next.js API routes and Server Components
- **Firebase config** → MUST be client-side (users need it to authenticate)
- **API keys for AI services** → MUST be server-side (otherwise anyone can steal your quota)

---

## 🔥 FIREBASE CONFIGURATION - PUBLIC BY DESIGN

### **IMPORTANT: Firebase apiKey is NOT a secret!**

Your Firebase configuration MUST be public because:

1. **Client-side authentication** requires the config to be in the browser
2. **Firebase apiKey identifies your project** - it's like a username, not a password
3. **Security is enforced by Firestore Security Rules** - NOT by hiding the apiKey

```javascript
// This configuration is SAFE to expose publicly
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // PUBLIC ✅
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // PUBLIC ✅
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // PUBLIC ✅
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // PUBLIC ✅
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // PUBLIC ✅
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // PUBLIC ✅
};
```

### **Real Security for Firebase:**

1. **Firestore Security Rules** - See `firestore.rules` (already implemented ✅)
2. **App Check** - Add bot/abuse protection (optional)
3. **Domain restrictions** - Limit which domains can use your Firebase project

---

## 🔒 TRULY SECRET VALUES - MUST BE SERVER-ONLY

These API keys MUST NEVER have `NEXT_PUBLIC_` prefix:

```bash
# ❌ NEVER DO THIS (exposed to client)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyA...

# ✅ CORRECT (server-only)
GEMINI_API_KEY=AIzaSyA...
GOOGLE_GENAI_API_KEY=AIzaSyA...
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
```

### **How to Use Server-Only Secrets:**

```typescript
// ✅ In API routes (app/api/generate/route.ts)
export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY; // Server-only ✅
  // Use apiKey to call Gemini API
}

// ❌ In client components (components/MyComponent.tsx)
("use client");
const apiKey = process.env.GEMINI_API_KEY; // undefined ❌ (not exposed)
```

---

## 📁 PROPER .env FILE STRUCTURE

### **1. .env.local (Local Development - NEVER COMMIT)**

```bash
# ============================================================================
# LOCAL DEVELOPMENT ENVIRONMENT VARIABLES
# ============================================================================
# This file contains REAL secrets for local development
# NEVER commit this file to git (it's in .gitignore)
# ============================================================================

# ============================================================================
# FIREBASE CONFIGURATION (Public - Client-Side)
# ============================================================================
# These values are INTENTIONALLY public and bundled into client JavaScript
# Security is enforced by Firestore Security Rules, not by hiding these values
# Get these from: https://console.firebase.google.com/project/YOUR_PROJECT/settings/general
# ============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...your-real-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ============================================================================
# GOOGLE GEMINI API KEY (Secret - Server-Side ONLY)
# ============================================================================
# This is a REAL secret - do NOT use NEXT_PUBLIC_ prefix
# Only accessible in Next.js API routes and Server Components
# Get your key from: https://aistudio.google.com/app/apikey
# ============================================================================
GEMINI_API_KEY=AIzaSyA...your-real-key-here
GOOGLE_GENAI_API_KEY=AIzaSyA...your-real-key-here

# ============================================================================
# OTHER SERVER-ONLY SECRETS (Examples)
# ============================================================================
# Add any other secrets here WITHOUT the NEXT_PUBLIC_ prefix
# OPENAI_API_KEY=sk-...
# STRIPE_SECRET_KEY=sk_live_...
# DATABASE_URL=postgresql://...
```

### **2. .env.local.example (Template - SAFE TO COMMIT)**

```bash
# ============================================================================
# ENVIRONMENT VARIABLES TEMPLATE
# ============================================================================
# Copy this file to .env.local and replace with your actual values
# NEVER commit .env.local to git (it contains real secrets)
# ============================================================================

# ============================================================================
# FIREBASE CONFIGURATION (Public - Client-Side)
# ============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# ============================================================================
# GOOGLE GEMINI API KEY (Secret - Server-Side ONLY)
# ============================================================================
GEMINI_API_KEY=your_google_genai_api_key_here
GOOGLE_GENAI_API_KEY=your_google_genai_api_key_here
```

### **3. .env.production (Deployment - NEVER COMMIT)**

```bash
# ============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ============================================================================
# For Vercel/Netlify, configure these in the platform UI, NOT in this file
# This file is for reference only - actual values go in deployment platform
# ============================================================================

# Same structure as .env.local but with PRODUCTION values
NEXT_PUBLIC_FIREBASE_API_KEY=production_firebase_key
GEMINI_API_KEY=production_gemini_key
```

---

## 🚀 DEPLOYMENT: VERCEL & NETLIFY

### **Vercel Environment Variables**

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add variables one by one:**

   ```bash
   # Public variables (exposed to client)
   NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyC...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID = your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 123456789
   NEXT_PUBLIC_FIREBASE_APP_ID = 1:123456789:web:abc123

   # Secret variables (server-only)
   GEMINI_API_KEY = AIzaSyA...
   GOOGLE_GENAI_API_KEY = AIzaSyA...
   ```

3. **Select environments:**

   - Production ✅
   - Preview ✅
   - Development ❌ (use .env.local)

4. **Redeploy** your application after adding variables

### **Netlify Environment Variables**

1. **Go to Netlify Dashboard** → Your Site → Site settings → Environment variables

2. **Add variables:**

   - Click "Add a variable"
   - Add each variable from the list above
   - Select "All scopes" or specific deploy contexts

3. **Deploy** → Trigger new deploy after adding variables

### **How Deployment Platforms Handle Variables:**

```typescript
// During build (Vercel/Netlify):
// 1. NEXT_PUBLIC_* variables are replaced in code at BUILD TIME
// 2. Non-NEXT_PUBLIC_ variables are available ONLY at runtime (API routes)

// Result:
// - Client bundle contains: NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC..."
// - Server environment contains: GEMINI_API_KEY="AIzaSyA..."
// - GEMINI_API_KEY is NEVER in client bundle ✅
```

---

## ✅ SECURITY VERIFICATION CHECKLIST

### **1. Check .gitignore (CRITICAL)**

```bash
# Run this command to verify .env files are ignored:
git ls-files ".env*"

# Expected output: EMPTY (or only .env.example, .env.local.example)
# If you see .env or .env.local → DANGER! Remove them from git immediately
```

### **2. Verify Client Bundle (CRITICAL)**

```bash
# Build your application
npm run build

# Check what's in the client bundle
# Look for exposed secrets in .next/static/chunks/*.js files

# Quick test:
grep -r "AIzaSy" .next/static/chunks/

# Expected:
# - Should find NEXT_PUBLIC_FIREBASE_API_KEY (this is OK)
# - Should NOT find GEMINI_API_KEY (this would be BAD)
```

### **3. Test in Browser DevTools**

1. Open your deployed app
2. Open DevTools → Network tab
3. Filter by "JS"
4. Search for your API keys in the JavaScript files
5. **Expected:**
   - ✅ Firebase apiKey is visible (this is OK)
   - ❌ Gemini API key is NOT visible (would be BAD)

### **4. Verify Environment Variables**

```typescript
// Add this to a server component or API route:
export async function GET() {
  console.log(
    "NEXT_PUBLIC_FIREBASE_API_KEY:",
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "SET ✅" : "MISSING ❌"
  );
  console.log(
    "GEMINI_API_KEY:",
    process.env.GEMINI_API_KEY ? "SET ✅" : "MISSING ❌"
  );

  return Response.json({
    firebaseConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
}
```

---

## 🔄 KEY ROTATION PROCEDURES

### **When to Rotate Keys:**

1. **Immediately** if a key is committed to git
2. **Immediately** if a key is exposed in client bundle (non-NEXT*PUBLIC* variable)
3. **Quarterly** as best practice for production systems
4. **Immediately** if you suspect unauthorized access

### **How to Rotate Firebase API Key:**

**IMPORTANT:** Firebase apiKey is public by design - rotation is usually NOT needed unless you want to change the project.

If you need to rotate:

1. Create a new Firebase project
2. Update all environment variables
3. Migrate Firestore data
4. Update security rules in new project

### **How to Rotate Gemini API Key:**

1. **Generate New Key:**

   - Go to https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy the new key

2. **Update Locally:**

   ```bash
   # Edit .env.local
   GEMINI_API_KEY=new_key_here
   ```

3. **Update Deployment:**

   - **Vercel:** Settings → Environment Variables → Edit `GEMINI_API_KEY`
   - **Netlify:** Site settings → Environment variables → Edit `GEMINI_API_KEY`

4. **Redeploy:**

   ```bash
   git commit --allow-empty -m "Rotate API key"
   git push
   ```

5. **Revoke Old Key:**

   - Go back to Google AI Studio
   - Delete the old API key
   - Verify old key no longer works

6. **Test Application:**
   - Verify AI course generation still works
   - Check logs for API errors

---

## 🔍 MONITORING FOR EXPOSURE

### **GitHub Commits Check:**

```bash
# Search your entire git history for exposed secrets
git log --all --full-history -p -- ".env*" | grep -i "AIza"

# Expected: Empty or only .env.example with placeholders
# If you find real keys → Follow "Emergency Response" below
```

### **Public Repository Check:**

If your repository is public on GitHub:

1. **Check if .env files are visible:**

   - Go to your GitHub repo
   - Search for `.env.local` or `.env`
   - If you can see the file → **CRITICAL SECURITY BREACH**

2. **Use GitHub Secret Scanning:**
   - GitHub automatically detects exposed secrets
   - Check Security → Secret scanning alerts

### **Google Cloud Monitoring:**

1. Go to https://console.cloud.google.com/
2. Select your project
3. Navigate to "APIs & Services" → "Credentials"
4. Check "API Key" usage metrics
5. Look for unusual spikes or unauthorized usage

---

## 🚨 EMERGENCY RESPONSE: KEY EXPOSED

If you've committed a real API key to git:

### **1. Immediately Revoke the Key**

**For Gemini API Key:**

1. Go to https://aistudio.google.com/app/apikey
2. Delete the exposed key
3. Generate a new key

**For Firebase (if needed):**

1. Firebase Console → Project Settings → Service Accounts
2. Rotate credentials if server-side admin SDK is used

### **2. Remove from Git History**

```bash
# ⚠️ WARNING: This rewrites git history - coordinate with team first!

# Install git-filter-repo (better than BFG)
pip install git-filter-repo

# Remove the file from all commits
git filter-repo --path .env.local --invert-paths --force
git filter-repo --path .env --invert-paths --force

# Force push (⚠️ THIS REWRITES HISTORY)
git push origin --force --all
```

### **3. Update All Environments**

1. Update `.env.local` with new key
2. Update Vercel/Netlify environment variables
3. Redeploy application
4. Test that everything works

### **4. Monitor for Abuse**

- Check Google Cloud billing for unexpected charges
- Monitor Firebase usage metrics
- Set up billing alerts

---

## 📊 SECURITY BEST PRACTICES

### **DO:**

✅ Use `NEXT_PUBLIC_` for Firebase configuration (public by design)
✅ Keep `.env.local` in `.gitignore` (already configured)
✅ Use `.env.local.example` with placeholder values (safe to commit)
✅ Store production secrets in Vercel/Netlify UI (never in code)
✅ Regularly audit your git history for exposed secrets
✅ Use different API keys for development and production
✅ Set up billing alerts on Google Cloud
✅ Rotate API keys quarterly

### **DON'T:**

❌ Use `NEXT_PUBLIC_` for Gemini/OpenAI API keys
❌ Commit `.env.local` or `.env` to git
❌ Put real API keys in `.env.example` files
❌ Share API keys in Slack/email/screenshots
❌ Use production keys in development
❌ Ignore security warnings from GitHub
❌ Hardcode secrets in source code

---

## 🎯 YOUR CURRENT STATUS

Based on the security audit:

### **✅ GOOD:**

- `.env*` files are properly in `.gitignore`
- No `.env` files found in git history
- Firebase configuration correctly uses `NEXT_PUBLIC_` prefix
- Source code has no hardcoded secrets
- Firestore security rules are implemented (300+ lines)

### **⚠️ ACTION REQUIRED:**

1. **ROTATE the exposed Gemini API key** (found in `.env.local.example`)
2. **Update `.env.local` with NEW key**
3. **Verify client bundle doesn't contain GEMINI_API_KEY**
4. **Update Vercel/Netlify with NEW key**

---

## 📚 ADDITIONAL RESOURCES

- **Firebase Security Best Practices:** https://firebase.google.com/docs/rules/basics
- **Next.js Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Google AI Studio:** https://aistudio.google.com/app/apikey
- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Netlify Environment Variables:** https://docs.netlify.com/environment-variables/overview/

---

## ✅ FINAL CHECKLIST

Before marking this complete:

- [ ] Rotated exposed Gemini API key
- [ ] Updated `.env.local` with new key
- [ ] Verified `.env.local.example` has placeholders only
- [ ] Checked git history (no .env files committed)
- [ ] Configured environment variables in Vercel/Netlify
- [ ] Tested application with new keys
- [ ] Verified client bundle doesn't contain server-only secrets
- [ ] Set up billing alerts on Google Cloud
- [ ] Documented key rotation procedure for team

---

**🔒 YOUR FIREBASE CONFIGURATION IS SECURE. YOUR DATABASE IS PROTECTED BY FIRESTORE RULES. 🔒**

**🚨 ROTATE THE EXPOSED GEMINI API KEY IMMEDIATELY. 🚨**
