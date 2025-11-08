"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { updateLessonProgress, getCourseProgress } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import type { LessonProgress } from "@/lib/auth";

interface CourseCompletionData {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  isCompleted: boolean;
}

/**
 * useUserProgress
 *
 * Contract
 * - Inputs: courseId, courseTitle, totalLessons
 * - Returns: local progress state, helpers to mark complete, scoring accessors, and a refresher.
 * - Side effects: fetches progress for the logged-in user; updates server on mark complete.
 *
 * Edge cases
 * - When no user or courseId: no-ops.
 * - If server calls fail: logs to console and preserves last known client state.
 */
export function useUserProgress(
  courseId?: string,
  courseTitle?: string,
  totalLessons?: number
) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [onCourseComplete, setOnCourseComplete] = useState<
    ((data: CourseCompletionData) => void) | null
  >(null);

  useEffect(() => {
    if (user && courseId) {
      loadProgress();
    }
  }, [user, courseId]);

  const loadProgress = async () => {
    if (!user || !courseId) return;

    setLoading(true);
    try {
      const userProgress = await getCourseProgress(user.id, courseId);
      setProgress(userProgress);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async (
    lessonId: string,
    score?: number,
    timeSpent?: number
  ) => {
    if (!user || !courseId) return;

    try {
      await updateLessonProgress(user.id, courseId, lessonId, {
        completed: true,
        score,
        timeSpent,
      });

      // Update local state
      setProgress((prev) => {
        const existingIndex = prev.findIndex((p) => p.lessonId === lessonId);
        const updatedProgress = {
          courseId,
          lessonId,
          completed: true,
          completedAt: new Date(),
          score,
          timeSpent,
        };

        let newProgress;
        if (existingIndex >= 0) {
          newProgress = [...prev];
          newProgress[existingIndex] = updatedProgress;
        } else {
          newProgress = [...prev, updatedProgress];
        }

        // Check if course is now complete
        if (totalLessons && courseTitle) {
          const completedCount = newProgress.filter((p) => p.completed).length;
          if (completedCount >= totalLessons && onCourseComplete) {
            onCourseComplete({
              courseId,
              courseTitle,
              totalLessons,
              completedLessons: completedCount,
              isCompleted: true,
            });
          }
        }

        return newProgress;
      });
    } catch (error) {
      console.error("Error updating lesson progress:", error);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  const getLessonScore = (lessonId: string) => {
    const lessonProgress = progress.find((p) => p.lessonId === lessonId);
    return lessonProgress?.score;
  };

  const getCourseCompletionStatus = () => {
    if (!totalLessons)
      return { completedLessons: 0, totalLessons: 0, isCompleted: false };

    const completedLessons = progress.filter((p) => p.completed).length;
    return {
      completedLessons,
      totalLessons,
      isCompleted: completedLessons >= totalLessons,
    };
  };

  const setCourseCompleteCallback = useCallback(
    (callback: (data: CourseCompletionData) => void) => {
      setOnCourseComplete(() => callback);
    },
    []
  );

  return {
    progress,
    loading,
    markLessonComplete,
    isLessonCompleted,
    getLessonScore,
    getCourseCompletionStatus,
    setCourseCompleteCallback,
    refreshProgress: loadProgress,
  };
}
