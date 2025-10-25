import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type VideoReplacementLog = {
  originalUrl: string;
  originalId: string | null;
  reason: string;
  replacementId?: string | null;
  replacementTitle?: string | null;
  replacementAuthor?: string | null;
  replacementWatchUrl?: string | null;
  contextTitle?: string | null; // e.g., lesson title
  contextLessonId?: string | null;
  contextCourseId?: string | null;
  metadata?: Record<string, any> | null;
};

/**
 * Best-effort logging to Supabase table `video_replacements`.
 * The table is expected to have columns compatible with VideoReplacementLog plus created_at (timestamp default now()).
 * Function fails quietly if Supabase is not configured or the table is missing.
 */
export async function logVideoReplacement(entry: VideoReplacementLog) {
  try {
    if (!isSupabaseConfigured) return;
    await supabase.from("video_replacements").insert({
      ...entry,
      created_at: new Date().toISOString(),
    } as any);
  } catch (e) {
    // Silent fail – logging is non-critical
  }
}

/**
 * Log a replacement suggestion as pending approval. Uses metadata.status = 'pending' to avoid
 * hard dependency on a specific schema change.
 */
export async function logVideoReplacementPending(entry: VideoReplacementLog) {
  try {
    if (!isSupabaseConfigured) return;
    await supabase.from("video_replacements").insert({
      ...entry,
      metadata: { ...(entry.metadata || {}), status: "pending" },
      created_at: new Date().toISOString(),
    } as any);
  } catch (e) {
    // Silent fail – logging is non-critical
  }
}

export async function listVideoReplacements(limit = 50) {
  try {
    if (!isSupabaseConfigured) return [] as any[];
    const { data } = await supabase
      .from("video_replacements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  } catch {
    return [];
  }
}
