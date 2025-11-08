"use server";

import { analyzeDocument } from "@/ai/flows/restructure-messy-pdf";
import { auditCourse } from "@/ai/flows/audit-course";
import type { Course } from "@/lib/types";
import { transformAnalysisToCourse } from "@/lib/course-transform";

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
