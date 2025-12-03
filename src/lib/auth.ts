// Firebase dependencies removed. Consumers should migrate to Supabase-backed auth in authSupabase.ts
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Course } from "./types";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface LessonProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: Date;
  score?: number;
  timeSpent?: number;
}

export interface SavedCourse {
  courseId: string;
  course: Course;
  progress: LessonProgress[];
  savedAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date | null;
}

// Authentication functions
export const signUp = async () => {
  throw new Error("Deprecated: use authSupabase.signUp instead");
};

export const signIn = async () => {
  throw new Error("Deprecated: use authSupabase.signIn instead");
};

export const logOut = async () => {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
};

// User profile functions
export const getUserProfile = async (
  _uid: string
): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // If a specific UID was requested and it doesn't match current user, 
    // we might need to fetch from a public profiles table. 
    // For now, we assume this function is mostly used for "current user".
    if (_uid && user.id !== _uid) {
      console.warn("[auth.getUserProfile] Requested UID does not match current session UID");
      // TODO: If you have a 'profiles' table, fetch from there.
    }

    return {
      uid: user.id,
      email: user.email || "",
      displayName: user.user_metadata?.display_name || "User",
      createdAt: new Date(user.created_at),
      lastLoginAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : new Date(),
    };
  } catch (e) {
    console.error("[auth.getUserProfile] Error fetching user:", e);
    return null;
  }
};

// Course and progress functions
/**
 * Insert a new course row for a user.
 *
 * Contract
 * - Input: uid, Course object (see types.ts)
 * - Output: course id (uuid) on success; returns a temporary id `tmp_<timestamp>` on failure
 * - Side effects: writes to `user_courses` table.
 */
export const saveCourse = async (
  uid: string,
  course: Course
): Promise<string> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.saveCourse] Supabase not configured; skipping insert");
      return `tmp_${Date.now()}`;
    }
    const payload = {
      user_id: uid,
      course,
      progress: [],
      saved_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    } as any;
    const { data, error } = await supabase
      .from("user_courses")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return (data as any).id as string;
  } catch (e) {
    console.warn("[auth.saveCourse] Supabase insert failed:", e);
    // Fallback: return a temporary id so callers can proceed (non-persistent)
    return `tmp_${Date.now()}`;
  }
};

/**
 * List a user's saved courses sorted by saved_at DESC.
 * Returns simplified rows with proper Date objects for timestamps.
 */
export const getUserCourses = async (
  uid: string
): Promise<(SavedCourse & { courseId: string })[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.getUserCourses] Supabase not configured; returning empty list");
      return [] as any;
    }
    const { data, error } = await supabase
      .from("user_courses")
      .select("id, course, progress, saved_at, last_accessed_at, completed_at")
      .eq("user_id", uid)
      .order("saved_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      courseId: row.id as string,
      course: row.course as Course,
      progress: (row.progress as LessonProgress[]) || [],
      savedAt: row.saved_at ? new Date(row.saved_at) : new Date(),
      lastAccessedAt: row.last_accessed_at
        ? new Date(row.last_accessed_at)
        : new Date(),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    }));
  } catch (e) {
    console.warn("[auth.getUserCourses] Supabase select failed:", e);
    return [];
  }
};

// Update a user's lesson progress for a specific course/lesson
/**
 * Merge and persist lesson progress for a user/course.
 *
 * Behavior
 * - Reads current `progress` array
 * - Upserts the target lesson's progress, setting `completedAt` when completed
 * - Updates `last_accessed_at`
 */
export const updateLessonProgress = async (
  uid: string,
  courseId: string,
  lessonId: string,
  progress: Partial<LessonProgress>
) => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.updateLessonProgress] Supabase not configured; skipping update");
      return;
    }
    const { data: row, error: fetchError } = await supabase
      .from("user_courses")
      .select("progress")
      .eq("id", courseId)
      .eq("user_id", uid)
      .single();
    if (fetchError) throw fetchError;

    const current: LessonProgress[] = (row?.progress as LessonProgress[]) || [];
    const idx = current.findIndex((p) => p.lessonId === lessonId);
    const base: LessonProgress = {
      courseId,
      lessonId,
      completed: false,
    };
    const updated: LessonProgress = {
      ...base,
      ...current[idx],
      ...progress,
      completedAt: progress.completed ? new Date() : current[idx]?.completedAt,
    } as LessonProgress;

    if (idx >= 0) {
      current[idx] = updated;
    } else {
      current.push(updated);
    }

    const { error: updateError } = await supabase
      .from("user_courses")
      .update({
        progress: current,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("user_id", uid);
    if (updateError) throw updateError;
  } catch (e) {
    console.warn("[auth.updateLessonProgress] Supabase update failed:", e);
  }
};

// Retrieve a user's course progress
/**
 * Fetch a user's progress for a given course.
 * Returns an array of LessonProgress; coerces `completedAt` to Date when present.
 */
export const getCourseProgress = async (
  uid: string,
  courseId: string
): Promise<LessonProgress[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.getCourseProgress] Supabase not configured; returning []");
      return [];
    }
    const { data, error } = await supabase
      .from("user_courses")
      .select("progress")
      .eq("id", courseId)
      .eq("user_id", uid)
      .single();
    if (error) throw error;
    return ((data?.progress as LessonProgress[]) || []).map((p) => ({
      ...p,
      completedAt: p.completedAt ? new Date(p.completedAt as any) : undefined,
    }));
  } catch (e) {
    console.warn("[auth.getCourseProgress] Supabase select failed:");
    return [];
  }
};

/**
 * Mark a course as completed
 * 
 * Contract:
 * - Input: uid (user id), courseId (course id)
 * - Output: boolean (success/failure)
 * - Side effects: Updates user_courses table with completed_at timestamp
 */
export const markCourseComplete = async (
  uid: string,
  courseId: string
): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.markCourseComplete] Supabase not configured; skipping update");
      return false;
    }
    const { error } = await supabase
      .from("user_courses")
      .update({
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", courseId)
      .eq("user_id", uid);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[auth.markCourseComplete] Supabase update failed:", e);
    return false;
  }
};

/**
 * Get all completed courses for a user
 * 
 * Contract:
 * - Input: uid (user id)
 * - Output: array of completed courses with completion dates
 */
export const getCompletedCourses = async (
  uid: string
): Promise<(SavedCourse & { courseId: string; completedAt: Date })[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.getCompletedCourses] Supabase not configured; returning []");
      return [] as any;
    }

    if (!uid) {
      console.error('[auth.getCompletedCourses] Invalid input: uid is null/undefined');
      return [];
    }

    console.log('[auth.getCompletedCourses] Fetching completed courses for user:', uid);

    const { data, error } = await supabase
      .from("user_courses")
      .select("id, course, progress, saved_at, last_accessed_at, completed_at")
      .eq("user_id", uid)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error('[auth.getCompletedCourses] Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    console.log('[auth.getCompletedCourses] Found', data?.length || 0, 'completed courses');

    return (data || []).map((row: any) => ({
      courseId: row.id as string,
      course: row.course as Course,
      progress: (row.progress as LessonProgress[]) || [],
      savedAt: row.saved_at ? new Date(row.saved_at) : new Date(),
      lastAccessedAt: row.last_accessed_at
        ? new Date(row.last_accessed_at)
        : new Date(),
      completedAt: row.completed_at ? new Date(row.completed_at) : new Date(),
    }));
  } catch (e: any) {
    console.error("[auth.getCompletedCourses] Exception caught:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      fullError: JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
    });
    return [];
  }
};

/**
 * Get in-progress courses (not completed) for a user
 */
export const getInProgressCourses = async (
  uid: string
): Promise<(SavedCourse & { courseId: string })[]> => {
  try {
    if (!isSupabaseConfigured) {
      console.warn("[auth.getInProgressCourses] Supabase not configured; returning []");
      return [] as any;
    }

    if (!uid) {
      console.error('[auth.getInProgressCourses] Invalid input: uid is null/undefined');
      return [];
    }

    console.log('[auth.getInProgressCourses] Fetching in-progress courses for user:', uid);

    const { data, error } = await supabase
      .from("user_courses")
      .select("id, course, progress, saved_at, last_accessed_at, completed_at")
      .eq("user_id", uid)
      .is("completed_at", null)
      .order("last_accessed_at", { ascending: false });

    if (error) {
      console.error('[auth.getInProgressCourses] Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: JSON.stringify(error, null, 2)
      });
      throw error;
    }

    console.log('[auth.getInProgressCourses] Found', data?.length || 0, 'in-progress courses');

    return (data || []).map((row: any) => ({
      courseId: row.id as string,
      course: row.course as Course,
      progress: (row.progress as LessonProgress[]) || [],
      savedAt: row.saved_at ? new Date(row.saved_at) : new Date(),
      lastAccessedAt: row.last_accessed_at
        ? new Date(row.last_accessed_at)
        : new Date(),
      completedAt: null,
    }));
  } catch (e: any) {
    console.error("[auth.getInProgressCourses] Exception caught:", {
      name: e?.name,
      message: e?.message,
      stack: e?.stack,
      fullError: JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
    });
    return [];
  }
};
