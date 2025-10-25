/**
 * Supabase diagnostics and error logging utilities
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

export interface SupabaseDiagnostics {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  canConnect: boolean;
  tables: {
    user_courses: boolean;
    user_lesson_progress: boolean;
    certificates: boolean;
  };
  errors: string[];
}

/**
 * Run diagnostics on Supabase connection and schema
 */
export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnostics> {
  const diagnostics: SupabaseDiagnostics = {
    isConfigured: isSupabaseConfigured,
    hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    canConnect: false,
    tables: {
      user_courses: false,
      user_lesson_progress: false,
      certificates: false,
    },
    errors: [],
  };

  if (!isSupabaseConfigured) {
    diagnostics.errors.push("Supabase is not configured (missing URL or anon key)");
    return diagnostics;
  }

  // Test connection by querying each table
  try {
    const { error: userCoursesError } = await supabase
      .from("user_courses")
      .select("id")
      .limit(1);
    
    if (!userCoursesError) {
      diagnostics.tables.user_courses = true;
      diagnostics.canConnect = true;
    } else {
      diagnostics.errors.push(`user_courses table error: ${userCoursesError.message}`);
    }
  } catch (e: any) {
    diagnostics.errors.push(`user_courses query failed: ${e.message}`);
  }

  try {
    const { error: progressError } = await supabase
      .from("user_lesson_progress")
      .select("id")
      .limit(1);
    
    if (!progressError) {
      diagnostics.tables.user_lesson_progress = true;
    } else {
      diagnostics.errors.push(`user_lesson_progress table error: ${progressError.message}`);
    }
  } catch (e: any) {
    diagnostics.errors.push(`user_lesson_progress query failed: ${e.message}`);
  }

  try {
    const { error: certError } = await supabase
      .from("certificates")
      .select("id")
      .limit(1);
    
    if (!certError) {
      diagnostics.tables.certificates = true;
    } else {
      diagnostics.errors.push(`certificates table error: ${certError.message}`);
    }
  } catch (e: any) {
    diagnostics.errors.push(`certificates query failed: ${e.message}`);
  }

  return diagnostics;
}

/**
 * Log detailed Supabase error information
 */
export function logSupabaseError(context: string, error: any): void {
  console.error(`[${context}] Supabase error details:`, {
    message: error?.message || "No message",
    details: error?.details || "No details",
    hint: error?.hint || "No hint",
    code: error?.code || "No code",
    statusCode: error?.statusCode || error?.status || "No status",
    name: error?.name || "No name",
    fullError: JSON.stringify(error, null, 2),
  });
}

/**
 * Check if error is due to missing table
 */
export function isMissingTableError(error: any): boolean {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code || "";
  
  return (
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("table") && message.includes("not found") ||
    code === "42P01" // PostgreSQL: undefined_table
  );
}

/**
 * Check if error is due to RLS policy blocking access
 */
export function isRLSPolicyError(error: any): boolean {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code || "";
  
  return (
    message.includes("row-level security") ||
    message.includes("policy") ||
    code === "42501" // PostgreSQL: insufficient_privilege
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (isMissingTableError(error)) {
    return "Database table not found. Please check your Supabase schema.";
  }
  
  if (isRLSPolicyError(error)) {
    return "Access denied. Please check your Row Level Security policies in Supabase.";
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return "An unknown database error occurred.";
}
