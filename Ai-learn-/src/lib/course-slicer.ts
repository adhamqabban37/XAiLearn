import type { Lesson, StoredCourse, StudySession } from "./types";

/**
 * Build a StudySession sized to a target duration from a stored course.
 *
 * Contract
 * - Inputs: a StoredCourse (with `course.sessions[].lessons[]`) and desired minutes.
 * - Output: a StudySession or null when all lessons are completed.
 * - Ordering: respects original module ordering; never pulls lessons from before the first uncompleted lesson's module.
 * - Time estimate: uses `lesson.timeEstimateMinutes` or a default of 5 minutes per lesson.
 *
 * Error modes / edge cases
 * - If no uncompleted lessons exist => returns null.
 * - If duration < first lesson estimate => returns first uncompleted lesson only.
 * - Ignores lessons considered "completed" in StoredCourse.progress map.
 */
const DEFAULT_LESSON_TIME = 5; // minutes

export function sliceSession(
  storedCourse: StoredCourse,
  durationMinutes: number
): StudySession | null {
  const { course, progress } = storedCourse;

  // Flatten lessons and filter out completed ones.
  const allLessons = course.sessions.flatMap((s) => s.lessons);
  const uncompletedLessons = allLessons.filter(
    (lesson) => !progress[lesson.id]
  );

  if (uncompletedLessons.length === 0) {
    return null; // Course is complete
  }

  // Anchor session to the first uncompleted lesson's original module.
  const firstUncompletedLesson = uncompletedLessons[0];
  const sessionIndex = course.sessions.findIndex((s) =>
    s.lessons.some((lesson) => lesson.id === firstUncompletedLesson.id)
  );
  const currentSessionInfo = course.sessions[sessionIndex];

  let cumulativeTime = 0;
  const sessionLessons: Lesson[] = [];

  for (const lesson of uncompletedLessons) {
    // Keep module ordering: only include lessons from the current or later modules.
    const lessonOriginalSessionIndex = course.sessions.findIndex((s) =>
      s.lessons.some((l) => l.id === lesson.id)
    );
    if (lessonOriginalSessionIndex < sessionIndex) continue;

    const lessonTime = lesson.timeEstimateMinutes || DEFAULT_LESSON_TIME;

    // Always include the first lesson, even if it exceeds duration, to avoid empty sessions.
    if (sessionLessons.length === 0) {
      sessionLessons.push(lesson);
      cumulativeTime += lessonTime;
      continue;
    }

    if (cumulativeTime + lessonTime <= durationMinutes) {
      cumulativeTime += lessonTime;
      sessionLessons.push(lesson);
    } else {
      break;
    }
  }

  return {
    title: currentSessionInfo.session_title,
    lessons: sessionLessons,
    sessionIndex,
    durationMinutes,
    totalStepsInCourse: allLessons.length,
    completedStepsInCourse: Object.keys(progress).length,
  };
}
