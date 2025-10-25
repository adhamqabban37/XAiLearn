/**
 * Resilient Firestore operation wrapper with retry logic and offline handling
 * Wraps all Firestore operations to handle transient failures and network issues
 */

import { FirebaseError } from "firebase/app";
import { isOnline, waitForOnline } from "./network";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  checkOnline?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  checkOnline: true,
};

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a Firebase error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return false;
  }

  const retryableCodes = [
    "unavailable",
    "deadline-exceeded",
    "resource-exhausted",
    "aborted",
    "internal",
    "unknown",
    "cancelled",
  ];

  return retryableCodes.includes(error.code);
}

/**
 * Check if error is due to offline state
 */
function isOfflineError(error: unknown): boolean {
  if (!(error instanceof FirebaseError)) {
    return false;
  }

  const offlineCodes = ["unavailable", "failed-precondition"];
  const offlineMessages = [
    "client is offline",
    "network error",
    "connection failed",
  ];

  return (
    offlineCodes.includes(error.code) ||
    offlineMessages.some((msg) =>
      error.message.toLowerCase().includes(msg.toLowerCase())
    )
  );
}

/**
 * Wrap any Firestore operation with exponential backoff retry logic
 *
 * Usage:
 *   const userData = await withRetry(() => getDoc(userRef));
 *   await withRetry(() => setDoc(userRef, data), { maxRetries: 5 });
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Check network status before attempting (if enabled)
      if (opts.checkOnline && !isOnline()) {
        console.warn(
          `[Firestore Retry] Browser offline, waiting for connection... (attempt ${
            attempt + 1
          }/${opts.maxRetries + 1})`
        );
        try {
          await waitForOnline(opts.maxDelayMs);
        } catch (timeoutError) {
          throw new Error(
            "Cannot complete operation: Device is offline and network did not recover"
          );
        }
      }

      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        console.error(
          `[Firestore Retry] Operation failed after ${
            opts.maxRetries + 1
          } attempts:`,
          error
        );
        throw error;
      }

      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.error(
          "[Firestore Retry] Non-retryable error encountered:",
          error
        );
        throw error;
      }

      // Log retry attempt
      const isOffline = isOfflineError(error);
      console.warn(
        `[Firestore Retry] ${
          isOffline ? "Offline" : "Transient"
        } error on attempt ${attempt + 1}/${
          opts.maxRetries + 1
        }. Retrying in ${delay}ms...`,
        error
      );

      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error("Unknown error in retry logic");
}

/**
 * Wrap Firestore operation with user-friendly error messages
 * Converts Firebase errors to readable messages for UI display
 */
export async function withFriendlyError<T>(
  operation: () => Promise<T>,
  context: string = "Operation"
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof FirebaseError) {
      const code = error.code;
      let friendlyMessage = `${context} failed`;

      if (isOfflineError(error)) {
        friendlyMessage =
          "You appear to be offline. Please check your internet connection and try again.";
      } else if (code === "permission-denied") {
        friendlyMessage =
          "You don't have permission to perform this action. Please sign in and try again.";
      } else if (code === "not-found") {
        friendlyMessage = `${context}: The requested data was not found.`;
      } else if (code === "already-exists") {
        friendlyMessage = `${context}: This data already exists.`;
      } else if (code === "resource-exhausted") {
        friendlyMessage =
          "Too many requests. Please wait a moment and try again.";
      } else if (code === "unauthenticated") {
        friendlyMessage =
          "You must be signed in to perform this action. Please log in and try again.";
      }

      // Create new error with friendly message but preserve original
      const friendlyError = new Error(friendlyMessage);
      (friendlyError as any).originalError = error;
      (friendlyError as any).code = code;
      throw friendlyError;
    }

    // Re-throw non-Firebase errors as-is
    throw error;
  }
}

/**
 * Combined wrapper: retry + friendly errors
 * This is the recommended way to wrap all Firestore operations
 *
 * Usage:
 *   const user = await withResilience(
 *     () => getDoc(userRef),
 *     { context: "Loading user profile" }
 *   );
 */
export async function withResilience<T>(
  operation: () => Promise<T>,
  options: RetryOptions & { context?: string } = {}
): Promise<T> {
  const { context, ...retryOpts } = options;
  return withFriendlyError(
    () => withRetry(operation, retryOpts),
    context || "Operation"
  );
}
