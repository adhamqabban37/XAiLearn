import type { Course, CourseAnalysis } from "./types";

// Transform AI analysis output into the UI `Course` shape.
// - Flattens and sums time estimates for `total_estimated_time`.
// - Normalizes resource categories and quiz items.
// - Generates stable IDs based on indexes.
export function transformAnalysisToCourse(analysis: CourseAnalysis): Course {
  const allLessons = (analysis.modules || []).flatMap((m) => m.lessons || []);
  const totalTime = allLessons.reduce(
    (acc, lesson) => acc + (lesson.time_estimate_minutes || 0),
    0
  );

  return {
    course_title: analysis.course_title,
    description: `An AI-generated course on "${analysis.course_title}".`,
    total_estimated_time: `${totalTime} minutes`,
    sessions: (analysis.modules || []).map((module, sIndex) => ({
      id: `session-${sIndex}`,
      session_title: module.module_title,
      lessons: (module.lessons || []).map((lesson, lIndex) => {
        const resources = [
          ...(lesson.resources?.youtube || []).map((r) => ({
            ...r,
            type: "video" as const,
          })),
          ...(lesson.resources?.articles || []).map((r) => ({
            ...r,
            type: "article" as const,
          })),
          ...(lesson.resources?.pdfs_docs || []).map((r) => ({
            ...r,
            type: "docs" as const,
          })),
        ];

        return {
          id: `session-${sIndex}-lesson-${lIndex}`,
          lesson_title: lesson.lesson_title,
          content_summary: (lesson.key_points || []).join("\n"),
          content_snippet: (lesson.key_points || []).join(", "),
          key_points: lesson.key_points || [],
          resources: resources,
          quiz: (lesson.quiz || []).map((q) => ({
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          })),
          timeEstimateMinutes: lesson.time_estimate_minutes,
        };
      }),
    })),
    checklist: [],
    readiness_score: 100,
    analysis_report: analysis,
  };
}
