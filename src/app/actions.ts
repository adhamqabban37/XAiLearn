"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { promptTemplate } from "@/lib/prompt-template";
import { AnalyzeDocumentOutputSchema } from "@/ai/flows/schemas";
import { analyzeDocument } from "@/ai/flows/restructure-messy-pdf";
import { auditCourse } from "@/ai/flows/audit-course";
import { generateQuiz } from "@/ai/flows/generate-quiz";
import type { Course, Session, Lesson, QuizQuestion } from "@/lib/types";
import { transformAnalysisToCourse } from "@/lib/course-transform";
import { QUIZ_PAPERS, getQuizPaperById } from "@/data/quizPapers";

export async function generateCourseFromText(
  text: string,
  duration?: string,
  pdfVideos?: Array<{ id: string; title: string; watchUrl: string; embedUrl?: string }>
): Promise<Course | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 100) {
    return {
      error:
        "Please enter a substantial amount of text (at least 100 characters) to create a course.",
    };
  }
  // Cap very large inputs to keep latency/cost in check
  const MAX_CHARS = 12000; // Reduced from 16000 for faster processing
  const safeText =
    trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;

  try {
    // Add timeout wrapper for AI processing (5 minutes for Ollama)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Course generation timed out after 5 minutes")),
        300000 // 5 minutes
      );
    });

    const analysisPromise = analyzeDocument({
      textContent: safeText,
      duration: duration,
      pdfVideos: pdfVideos || [],
    });

    const analysis = await Promise.race([analysisPromise, timeoutPromise]);

    if (!analysis || !analysis.modules || analysis.modules.length === 0) {
      return {
        error:
          "The AI could not generate a valid course structure. This can happen if:\n" +
          "• The content is too short or unclear\n" +
          "• The AI service is overloaded\n" +
          "• The text doesn't contain structured educational content\n\n" +
          "Try providing more detailed, structured content (e.g., lesson outlines, chapter headings).",
      };
    }

    let course = transformAnalysisToCourse(analysis);

    // Post-processing: Ensure PDF videos are included in the course
    if (pdfVideos && pdfVideos.length > 0) {
      console.log(`🔍 Post-processing: Ensuring ${pdfVideos.length} PDF videos are included in course...`);

      // Collect all video URLs already in the course
      const existingVideoUrls = new Set<string>();
      course.sessions.forEach(session => {
        session.lessons.forEach(lesson => {
          lesson.resources?.forEach(resource => {
            if (resource.type === "video" && resource.url) {
              existingVideoUrls.add(resource.url);
            }
          });
        });
      });

      // Find PDF videos that aren't in the course yet
      const missingVideos = pdfVideos.filter(video => {
        const videoUrl = video.watchUrl || video.embedUrl;
        return videoUrl && !existingVideoUrls.has(videoUrl);
      });

      if (missingVideos.length > 0) {
        console.log(`➕ Adding ${missingVideos.length} missing PDF videos to course...`);

        // Distribute missing videos across lessons (prefer earlier lessons)
        const allLessons = course.sessions.flatMap(session => session.lessons);
        let videoIndex = 0;

        missingVideos.forEach(video => {
          if (videoIndex < allLessons.length) {
            const lesson = allLessons[videoIndex];
            if (!lesson.resources) {
              lesson.resources = [];
            }

            // Add video resource
            lesson.resources.push({
              title: video.title || "Video from PDF",
              url: video.watchUrl || video.embedUrl || "",
              type: "video" as const,
            });

            videoIndex = (videoIndex + 1) % allLessons.length;
          }
        });
      } else {
        console.log(`✅ All PDF videos are already included in the course`);
      }
    }

    // Run audit in background without blocking
    auditCourse({ courseContent: JSON.stringify(analysis, null, 2) })
      .then((report) =>
        console.log("Course Audit Report:", JSON.stringify(report, null, 2))
      )
      .catch((err) => console.error("Auditing failed:", err));

    return course;
  } catch (e: any) {
    return {
      error:
        e?.message ||
        "An unexpected error occurred while generating the course. Please try again later.",
    };
  }
}

export async function generateQuizFromText(
  text: string
): Promise<Course | { error: string }> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 100) {
    return {
      error: "Please enter at least 100 characters to create a quiz.",
    };
  }

  try {
    const analysis = await generateQuiz({ textContent: trimmed });
    // Transform the raw analysis into a full Course object (adds IDs, etc.)
    const course = transformAnalysisToCourse(analysis);
    return course;
  } catch (e: any) {
    return {
      error: e?.message || "Failed to generate quiz.",
    };
  }
}

export async function getQuizPapers() {
  return QUIZ_PAPERS.map((paper) => ({
    id: paper.id,
    title: paper.title,
    description: paper.description ?? "",
    questionCount: paper.questions.length,
  }));
}

export async function generateQuizFromPaper(paperId: string): Promise<Course | { error: string }> {
  const paper = getQuizPaperById(paperId);
  if (!paper) {
    return { error: `Quiz paper not found: ${paperId}` };
  }

  // Map QuizQuestion[] -> Course structure
  const quizQuestions: QuizQuestion[] = paper.questions.map((q, index) => ({
    question: q.questionText,
    type: "MCQ",
    options: q.options ?? [],
    answer: q.answerText,
    explanation: q.explanation ?? "Correct answer from paper.",
  }));

  const lesson: Lesson = {
    id: `lesson-${paper.id}`,
    lesson_title: "Full Question Bank",
    key_points: ["Static Question Bank"],
    time_estimate_minutes: 60,
    content_summary: "Complete set of questions from the selected paper.",
    content_snippet: "Complete set of questions from the selected paper.",
    quiz: quizQuestions,
    resources: [],
    isCompleted: false
  };

  const session: Session = {
    id: `session-${paper.id}`,
    session_title: "Quiz Session",
    lessons: [lesson],
  };

  const course: Course = {
    course_title: paper.title,
    description: paper.description ?? "Static Quiz Paper",
    readiness_score: 100,
    sessions: [session],
    analysis_report: {
      course_title: paper.title,
      modules: []
    }
  };

  return course;
}
