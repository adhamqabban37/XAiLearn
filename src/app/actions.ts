"use server";

import { AnalyzeDocumentOutputSchema } from "@/ai/flows/schemas";
import { analyzeDocument } from "@/ai/flows/restructure-messy-pdf";
import { auditCourse } from "@/ai/flows/audit-course";
import { generateQuiz } from "@/ai/flows/generate-quiz";
import type { Course, Session, Lesson, QuizQuestion } from "@/lib/types";
import { transformAnalysisToCourse } from "@/lib/course-transform";
import { QUIZ_PAPERS, getQuizPaperById } from "@/data/quizPapers";
import {
  matchVideosToLessons,
  searchYouTubeForTopic,
  validateAndSelectBestVideo,
  type LessonWithQuery,
} from "@/lib/youtube-search";

export async function generateCourseFromText(
  text: string,
  duration?: string,
  pdfVideos?: Array<{
    id: string;
    title: string;
    watchUrl: string;
    embedUrl?: string;
  }>
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

    const course = transformAnalysisToCourse(analysis);

    // NEW: Enhanced video enrichment pipeline
    await enrichCourseWithVideos(course, pdfVideos || []);

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

/**
 * Enhanced video enrichment pipeline:
 * 1. Match PDF videos to lessons semantically
 * 2. Search YouTube for lessons with videoSearchQuery
 * 3. Skip videos gracefully if none found
 */
async function enrichCourseWithVideos(
  course: Course,
  pdfVideos: Array<{
    id: string;
    title: string;
    watchUrl: string;
    embedUrl?: string;
  }>
): Promise<void> {
  console.log(`🎥 Starting video enrichment pipeline...`);
  console.log(`   PDF videos: ${pdfVideos.length}`);
  console.log(
    `   Total lessons: ${course.sessions.flatMap((s) => s.lessons).length}`
  );

  // Step 1: Build lesson query map
  const lessonsWithQueries: LessonWithQuery[] = [];
  const lessonMap = new Map<string, Lesson>();

  course.sessions.forEach((session) => {
    session.lessons.forEach((lesson) => {
      lessonMap.set(lesson.id, lesson);

      // Extract videoSearchQuery from analysis_report if available
      const videoSearchQuery = extractVideoSearchQuery(
        course.analysis_report,
        lesson.lesson_title
      );

      lessonsWithQueries.push({
        lessonId: lesson.id,
        lessonTitle: lesson.lesson_title,
        keyPoints: lesson.key_points,
        videoSearchQuery,
      });
    });
  });

  // Step 2: Match PDF videos to lessons semantically
  let videoMatches = new Map<string, any>();

  if (pdfVideos.length > 0) {
    console.log(`🔍 Matching ${pdfVideos.length} PDF videos to lessons...`);
    videoMatches = await matchVideosToLessons(pdfVideos, lessonsWithQueries);
    console.log(`✅ Matched ${videoMatches.size} PDF videos to lessons`);
  }

  // Step 3: For lessons without matched videos, search YouTube if query exists
  for (const lessonQuery of lessonsWithQueries) {
    const lesson = lessonMap.get(lessonQuery.lessonId);
    if (!lesson) continue;

    // Initialize resources array if missing
    if (!lesson.resources) {
      lesson.resources = [];
    }

    // Check if lesson already has a matched PDF video
    const matchedVideo = videoMatches.get(lessonQuery.lessonId);
    if (matchedVideo) {
      console.log(
        `✅ Adding matched PDF video to lesson "${lesson.lesson_title}"`
      );
      lesson.resources.push({
        title: matchedVideo.title,
        url: matchedVideo.watchUrl,
        type: "video" as const,
      });
      continue;
    }

    // If no PDF match and videoSearchQuery exists, search YouTube
    if (lessonQuery.videoSearchQuery) {
      console.log(
        `🔍 Searching YouTube for: "${lessonQuery.videoSearchQuery}"`
      );

      try {
        const searchResults = await searchYouTubeForTopic(
          lessonQuery.videoSearchQuery,
          {
            maxResults: 3,
            minDuration: 120, // 2 minutes minimum
          }
        );

        if (searchResults.length > 0) {
          const validVideo = await validateAndSelectBestVideo(searchResults);

          if (validVideo) {
            console.log(
              `✅ Found video for "${lesson.lesson_title}": ${validVideo.title}`
            );
            lesson.resources.push({
              title: validVideo.title,
              url: validVideo.watchUrl,
              type: "video" as const,
            });
          } else {
            console.log(
              `⚠️ No embeddable video found for "${lesson.lesson_title}" (all search results blocked embedding)`
            );
          }
        } else {
          const apiKeyConfigured =
            process.env.YOUTUBE_API_KEY ||
            process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
          if (!apiKeyConfigured) {
            console.log(
              `ℹ️ Skipping YouTube search for "${lesson.lesson_title}" (API key not configured)`
            );
          } else {
            console.log(
              `ℹ️ No YouTube videos found for query: "${lessonQuery.videoSearchQuery}"`
            );
          }
        }
      } catch (error: any) {
        console.error(
          `❌ YouTube search failed for "${lesson.lesson_title}":`,
          error.message
        );
      }
    } else {
      console.log(
        `ℹ️ No videoSearchQuery provided for lesson "${lesson.lesson_title}" - skipping video enrichment`
      );
    }
  }

  const videosAdded = course.sessions
    .flatMap((s) => s.lessons)
    .filter((l) => l.resources?.some((r) => r.type === "video")).length;

  console.log(
    `🎥 Video enrichment complete: ${videosAdded} lessons have videos`
  );
}

/**
 * Extract videoSearchQuery from AI analysis output
 */
function extractVideoSearchQuery(
  analysisReport: any,
  lessonTitle: string
): string | undefined {
  if (!analysisReport?.modules) return undefined;

  for (const module of analysisReport.modules) {
    const lesson = module.lessons?.find(
      (l: any) => l.lesson_title === lessonTitle
    );
    if (lesson?.videoSearchQuery) {
      return lesson.videoSearchQuery;
    }
  }

  return undefined;
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

export async function generateQuizFromPaper(
  paperId: string
): Promise<Course | { error: string }> {
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
    isCompleted: false,
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
      modules: [],
    },
  };

  return course;
}
