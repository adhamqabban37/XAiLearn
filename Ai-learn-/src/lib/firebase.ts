import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";

// Only initialize Firebase on the client. Avoid throwing at import time so
// server/edge builds (like Render) don't fail if env vars are missing.
const isBrowser = typeof window !== "undefined";

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isBrowser) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  } as const;

  const missing = Object.entries(firebaseConfig)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missing.length) {
    console.warn(
      "[Firebase] Missing env vars; skipping client initialization:",
      missing.join(", ")
    );
  } else {
    try {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);

      // Enable offline persistence with comprehensive error handling
      enableIndexedDbPersistence(dbInstance)
        .then(() => {
          console.log("[Firebase] ✓ Offline persistence enabled successfully");
        })
        .catch((err: any) => {
          const code = err?.code;
          if (code === "failed-precondition") {
            console.warn(
              "[Firebase] Offline persistence failed: Multiple tabs open. Only one tab can enable persistence."
            );
          } else if (code === "unimplemented") {
            console.warn(
              "[Firebase] Offline persistence not available in this browser."
            );
          } else {
            console.error(
              "[Firebase] Unexpected persistence error:",
              code,
              err
            );
          }
        });
    } catch (e) {
      console.error("[Firebase] Initialization error:", e);
    }
  }
}

// Export possibly-null instances. Client-only consumers should check availability.
// In production, Diagnostics page is disabled; other app code shouldn't rely on Firebase.
export const auth = authInstance as unknown as Auth;
export const db = dbInstance as unknown as Firestore;

export default app as FirebaseApp | null;
