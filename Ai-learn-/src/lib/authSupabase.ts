"use client";

// Resend confirmation email for Supabase user
export async function resendConfirmationEmail(email: string) {
  if (!supabase || !supabase.auth) {
    throw new Error(
      "Supabase client is not initialized. Please contact support."
    );
  }
  // Supabase: send magic link for email confirmation
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
}

import { supabase } from "./supabaseClient";
// Note: Avoid importing Firebase at module load to keep tests light; use dynamic imports inside functions

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Create a new user account.
 *
 * Inputs: email, password, displayName (stored in Supabase user_metadata.display_name)
 * Output: { id } on success; throws on error.
 * Error modes: network failures, email already in use, password policy errors.
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
) {
  if (!supabase || !supabase.auth) {
    throw new Error(
      "Supabase client is not initialized. Please contact support."
    );
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  const user = data.user;
  if (!user) throw new Error("Signup succeeded but user is missing");

  // Firebase profile creation removed. Supabase handles user data.

  return { id: user.id };
}

/**
 * Sign in a user with email/password.
 * Returns `{ id }` when successful; throws on error.
 */
export async function signIn(email: string, password: string) {
  if (!supabase || !supabase.auth) {
    throw new Error(
      "Supabase client is not initialized. Please contact support."
    );
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  const user = data.user;
  return { id: user?.id };
}

/**
 * Log out the current session. Throws on error.
 */
export async function logOut() {
  if (!supabase || !supabase.auth) {
    throw new Error(
      "Supabase client is not initialized. Please contact support."
    );
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the currently authenticated user in a UI-friendly shape.
 * Returns `null` when no session is active.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  if (!supabase || !supabase.auth) {
    return null;
  }
  const { data } = await supabase.auth.getUser();
  const u = data.user;
  if (!u) return null;
  return {
    uid: u.id,
    email: u.email ?? null,
    displayName: (u.user_metadata as any)?.display_name ?? null,
  };
}

/**
 * Start OAuth sign-in flow (redirect) for supported providers.
 * Returns provider data; throws on error.
 */
export async function signInWithOAuth(provider: "google" | "github") {
  if (!supabase || !supabase.auth) {
    throw new Error(
      "Supabase client is not initialized. Please contact support."
    );
  }
  const { data, error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw error;
  return data;
}
