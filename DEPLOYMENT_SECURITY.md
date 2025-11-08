# 🚀 SECURE DEPLOYMENT GUIDE - VERCEL & NETLIFY

**Complete guide to securely deploying your Next.js + Firebase application**

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying, verify:

- [ ] `.env*` files are in `.gitignore` ✅ (already configured)
- [ ] No secrets in git history ✅ (verified clean)
- [ ] Firestore security rules deployed ✅ (already implemented)
- [ ] Firebase project configured
- [ ] API keys ready for production

---

## 🔑 ENVIRONMENT VARIABLES REFERENCE

### **Client-Side Variables (NEXT*PUBLIC*)**

These are bundled into JavaScript and visible to users:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### **Server-Side Variables (NO PREFIX)**

These are ONLY accessible in API routes:

```bash
GEMINI_API_KEY=AIzaSyA...
GOOGLE_GENAI_API_KEY=AIzaSyA...
```

---

## 🔵 VERCEL DEPLOYMENT

### **Step 1: Connect Repository**

1. Go to https://vercel.com/new
2. Import your Git repository
3. Vercel auto-detects Next.js configuration

### **Step 2: Configure Environment Variables**

1. **Before deploying**, click "Environment Variables"
2. Add each variable:

   | Key                                        | Value                          | Environment         |
   | ------------------------------------------ | ------------------------------ | ------------------- |
   | `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSyC...`                   | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com` | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `your-project-id`              | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `your-project.appspot.com`     | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789`                    | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:123456789:web:abc123`       | Production, Preview |
   | `GEMINI_API_KEY`                           | `AIzaSyA...`                   | Production, Preview |
   | `GOOGLE_GENAI_API_KEY`                     | `AIzaSyA...`                   | Production, Preview |

3. **DO NOT** select "Development" environment (use `.env.local` for that)

### **Step 3: Deploy**

1. Click "Deploy"
2. Wait for build to complete
3. Vercel assigns you a URL: `https://your-app.vercel.app`

### **Step 4: Verify Deployment**

1. Visit your deployed site
2. Test Firebase authentication (sign up/login)
3. Test AI course generation
4. Check Vercel logs for errors: Dashboard → Deployments → Logs

### **How Vercel Handles Variables:**

```typescript
// During build:
// - NEXT_PUBLIC_* variables → Replaced in code at build time
// - Non-NEXT_PUBLIC_* → Available only at runtime (API routes)

// Example:
// src/lib/firebase.ts (client-side):
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
// Vercel replaces this with: const apiKey = "AIzaSyC...";

// app/api/generate/route.ts (server-side):
const geminiKey = process.env.GEMINI_API_KEY;
// Vercel injects this at runtime (NEVER in client bundle)
```

### **Updating Variables After Deployment:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click the variable you want to update
3. Edit the value
4. **Redeploy** (variables are NOT updated until redeploy):
   ```bash
   git commit --allow-empty -m "Update environment variables"
   git push
   ```

---

## 🟢 NETLIFY DEPLOYMENT

### **Step 1: Connect Repository**

1. Go to https://app.netlify.com/start
2. Connect your Git provider (GitHub/GitLab/Bitbucket)
3. Select your repository

### **Step 2: Configure Build Settings**

Netlify auto-detects Next.js, but verify:

- **Build command:** `npm run build` or `next build`
- **Publish directory:** `.next`
- **Functions directory:** `.netlify/functions` (auto-configured)

### **Step 3: Configure Environment Variables**

1. **Before deploying**, go to Site settings → Environment variables
2. Add variables one by one:

   | Variable Key                               | Value                          |
   | ------------------------------------------ | ------------------------------ |
   | `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSyC...`                   |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `your-project.firebaseapp.com` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `your-project-id`              |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `your-project.appspot.com`     |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789`                    |
   | `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:123456789:web:abc123`       |
   | `GEMINI_API_KEY`                           | `AIzaSyA...`                   |
   | `GOOGLE_GENAI_API_KEY`                     | `AIzaSyA...`                   |

3. Select scopes:

   - **All:** Available in all contexts
   - **Build:** Only during build time
   - **Function:** Only in serverless functions

   **Recommendation:** Use "All" for simplicity

### **Step 4: Deploy**

1. Click "Deploy site"
2. Netlify builds and deploys automatically
3. You get a URL: `https://your-app.netlify.app`

### **Step 5: Verify Deployment**

1. Visit your deployed site
2. Test Firebase authentication
3. Test AI course generation
4. Check Netlify logs: Site overview → Functions → View logs

### **How Netlify Handles Variables:**

Same as Vercel:

- `NEXT_PUBLIC_*` → Bundled at build time
- Other variables → Available only in serverless functions (API routes)

### **Updating Variables After Deployment:**

1. Site settings → Environment variables → Edit
2. Click "Save"
3. **Trigger redeploy:** Deploys → Trigger deploy → Deploy site

---

## 🔐 SECURITY VERIFICATION AFTER DEPLOYMENT

### **1. Check Client Bundle**

```bash
# Open your deployed site
# DevTools → Network → Filter "JS"
# Look for main bundle files (e.g., main-abc123.js)

# Search for your API keys:
# - NEXT_PUBLIC_FIREBASE_API_KEY → Should be visible (OK)
# - GEMINI_API_KEY → Should NOT be visible (if visible, BAD!)
```

### **2. Test API Routes**

```bash
# Create a test endpoint to verify server-side variables are loaded
# app/api/test-env/route.ts

export async function GET() {
  return Response.json({
    firebaseConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    // Don't return actual values!
  });
}

# Visit: https://your-app.vercel.app/api/test-env
# Expected: { firebaseConfigured: true, geminiConfigured: true }
```

### **3. Test Firebase Connection**

```bash
# Try to sign up/login
# Check browser console for Firebase errors
# If you see "auth/invalid-api-key" → Check NEXT_PUBLIC_FIREBASE_API_KEY
# If you see "auth/network-request-failed" → Check Firebase domain restrictions
```

### **4. Test AI Generation**

```bash
# Try to generate a course
# If you see 400/403 errors → Check GEMINI_API_KEY configuration
# Check deployment platform logs for API errors
```

---

## 🌐 CUSTOM DOMAIN SETUP

### **Vercel Custom Domain:**

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `www.yourapp.com`
3. Configure DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

### **Netlify Custom Domain:**

1. Site settings → Domain management → Add custom domain
2. Add your domain: `www.yourapp.com`
3. Configure DNS records (Netlify provides instructions)
4. Enable HTTPS (automatic)

### **Firebase Domain Restrictions:**

After adding a custom domain:

1. Go to Firebase Console → Authentication → Settings
2. Under "Authorized domains", add:

   - `your-app.vercel.app`
   - `www.yourapp.com`
   - `localhost` (for development)

3. This prevents your Firebase project from being used on unauthorized domains

---

## 📊 MONITORING & DEBUGGING

### **Vercel Logs:**

```bash
# Real-time logs
vercel logs --follow

# Or in dashboard:
# Project → Deployments → Select deployment → View logs
```

### **Netlify Logs:**

```bash
# In dashboard:
# Site overview → Functions → Select function → View logs
```

### **Firebase Monitoring:**

1. Firebase Console → Authentication → Users
   - Verify users can sign up/login
2. Firestore → Data
   - Verify data is being created
3. Usage → Authentication
   - Monitor authentication requests

### **Common Deployment Issues:**

| Error                            | Cause                                   | Solution                                      |
| -------------------------------- | --------------------------------------- | --------------------------------------------- |
| `auth/invalid-api-key`           | Missing or wrong Firebase API key       | Check `NEXT_PUBLIC_FIREBASE_API_KEY`          |
| `Failed to fetch`                | Firebase domain not authorized          | Add domain to Firebase authorized domains     |
| `API key not valid`              | Wrong Gemini API key                    | Check `GEMINI_API_KEY` value                  |
| `Environment variable undefined` | Variable not set in deployment platform | Add variable in Vercel/Netlify UI             |
| `Build failed`                   | Missing dependency                      | Check `package.json` and install dependencies |

---

## 🔄 CI/CD WORKFLOW

### **Automatic Deployments:**

Both Vercel and Netlify automatically deploy on git push:

```bash
# Local development
git add .
git commit -m "Add new feature"
git push origin main

# Triggers automatic deployment
# - Vercel: Deploys to production
# - Netlify: Deploys to production
```

### **Preview Deployments:**

```bash
# Create a feature branch
git checkout -b feature/new-feature

# Push to branch
git push origin feature/new-feature

# Triggers preview deployment
# - Vercel: Creates preview URL
# - Netlify: Creates deploy preview
```

### **Environment-Specific Variables:**

```bash
# Vercel: Separate variables for Production, Preview, Development
# Netlify: Separate variables for Production, Deploy Previews, Branch Deploys

# Example: Use different Firebase projects for production vs preview
Production: NEXT_PUBLIC_FIREBASE_PROJECT_ID=prod-project
Preview: NEXT_PUBLIC_FIREBASE_PROJECT_ID=staging-project
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Application is accessible at deployment URL
- [ ] Firebase authentication works (sign up/login)
- [ ] AI course generation works
- [ ] Firestore data is being saved
- [ ] No errors in deployment logs
- [ ] Client bundle doesn't contain server-only secrets
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (HTTPS)
- [ ] Firebase authorized domains updated
- [ ] Monitoring and alerts set up

---

## 🚨 ROLLBACK PROCEDURE

If deployment fails or introduces bugs:

### **Vercel Rollback:**

1. Dashboard → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Instant rollback ✅

### **Netlify Rollback:**

1. Site overview → Deploys
2. Find the last working deploy
3. Click "..." → "Publish deploy"
4. Instant rollback ✅

---

## 📚 ADDITIONAL RESOURCES

- **Vercel Next.js Deployment:** https://vercel.com/docs/frameworks/nextjs
- **Netlify Next.js Deployment:** https://docs.netlify.com/frameworks/next-js/
- **Firebase Hosting (alternative):** https://firebase.google.com/docs/hosting
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

**🚀 YOUR APPLICATION IS NOW SECURELY DEPLOYED WITH PROPER ENVIRONMENT VARIABLE MANAGEMENT! 🚀**
