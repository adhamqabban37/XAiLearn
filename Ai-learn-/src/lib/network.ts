/**
 * Network connectivity utility for detecting online/offline state
 * Checks before making Firestore requests to provide graceful degradation
 *
 * This module contains ONLY pure functions safe for server/client.
 * For React hooks, see network.client.ts
 */

/**
 * Check if browser is online
 * Returns true if online, false if offline
 * Safe to use in server-side and client-side code
 */
export function isOnline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    // Server-side or unsupported environment - assume online
    return true;
  }
  return navigator.onLine;
}

/**
 * Promise that resolves when network is back online
 * Useful for waiting before retrying failed operations
 * Only works in browser environments
 */
export function waitForOnline(timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      // Server-side - can't wait for network events
      resolve();
      return;
    }

    if (isOnline()) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Network timeout: Still offline after waiting"));
    }, timeoutMs);

    const handleOnline = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("online", handleOnline);
    };

    window.addEventListener("online", handleOnline);
  });
}
