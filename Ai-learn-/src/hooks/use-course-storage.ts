"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Course, StoredCourse, StudySession } from '@/lib/types';
import { sliceSession } from '@/lib/course-slicer';

const COURSE_STORAGE_KEY = 'ai-course-crafter-course';
const SESSION_STORAGE_KEY = 'ai-course-crafter-session';

export function useCourseStorage() {
  const [storedCourse, setStoredCourse] = useState<StoredCourse | null>(null);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const courseItem = window.localStorage.getItem(COURSE_STORAGE_KEY);
      if (courseItem) {
        setStoredCourse(JSON.parse(courseItem));
      }
      const sessionItem = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionItem) {
        setStudySession(JSON.parse(sessionItem));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      window.localStorage.removeItem(COURSE_STORAGE_KEY);
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCourse = useCallback((course: Course) => {
    try {
      const newStoredCourse: StoredCourse = {
        course,
        progress: {},
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(newStoredCourse));
      setStoredCourse(newStoredCourse);
    } catch (error) {
      console.error("Failed to save course to localStorage", error);
    }
  }, []);
  
  const clearCourse = useCallback(() => {
    try {
        window.localStorage.removeItem(COURSE_STORAGE_KEY);
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        setStoredCourse(null);
        setStudySession(null);
    } catch (error) {
        console.error("Failed to clear course from localStorage", error);
    }
  }, []);

  const startNewSession = useCallback((duration: number) => {
    // This function needs the most up-to-date 'storedCourse'
    // so we retrieve it from localStorage directly inside the function
    const courseItem = window.localStorage.getItem(COURSE_STORAGE_KEY);
    const currentStoredCourse = courseItem ? JSON.parse(courseItem) : null;

    if (!currentStoredCourse) return null;

    const newSession = sliceSession(currentStoredCourse, duration);
    if (newSession) {
        try {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
            setStudySession(newSession);
        } catch (error) {
            console.error("Failed to save session to localStorage", error);
        }
    } else {
        // Handle course completion
        try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY);
            setStudySession(null);
        } catch (error) {
            console.error("Failed to clear session from localStorage", error);
        }
    }
    return newSession;
  }, []);

  const updateStepProgress = useCallback((stepId: string, status: 'completed') => {
    setStoredCourse(prev => {
        if (!prev) return null;
        const newProgress = { ...prev.progress, [stepId]: status };
        const newStoredCourse: StoredCourse = { ...prev, progress: newProgress };
        try {
            window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(newStoredCourse));
        } catch (error) {
            console.error("Failed to update progress in localStorage", error);
        }
        return newStoredCourse;
    });
  }, []);


  return { isLoading, storedCourse, studySession, saveCourse, startNewSession, updateStepProgress, clearCourse };
}
