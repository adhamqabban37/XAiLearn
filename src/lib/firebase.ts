import { initializeApp, type FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// 1. Safe Environment Check
const isBrowser = typeof window !== "undefined";

// 2. Configuration with Fallbacks (prevents crashes)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// 3. Singleton Instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// 4. Safe Initialization
if (isBrowser) {
  // Check if critical keys exist before trying to initialize
  const hasKeys = firebaseConfig.apiKey && firebaseConfig.projectId;

  if (hasKeys) {
    try {
      // Prevent double-initialization
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      // Note: Persistence removed to prevent "multiple tabs" errors which block the app
    } catch (e) {
      console.warn("[Firebase] Init failed (non-blocking):", e);
    }
  } else {
    // Silent skip - no noisy warnings unless debugging
    if (process.env.NODE_ENV === "development") {
      console.debug("[Firebase] Skipping init: Missing env vars");
    }
  }
}

// 5. Safe Exports (Nullable)
export { app, auth, db };
export default app;
