import type { AnalyzeDocumentOutput } from "@/ai/flows/schemas";

export type CourseAnalysis = AnalyzeDocumentOutput;

// Extract the lesson and resource types from the new schema
type Module = AnalyzeDocumentOutput["modules"][number];
type LessonSchema = Module["lessons"][number];

// A generic resource type for the client, combining all possible fields
type ResourceSchema =
  | (NonNullable<NonNullable<LessonSchema["resources"]>["youtube"]>[number] & {
      type: "video";
    })
  | (NonNullable<NonNullable<LessonSchema["resources"]>["articles"]>[number] & {
      type: "article";
    })
  | (NonNullable<
      NonNullable<LessonSchema["resources"]>["pdfs_docs"]
    >[number] & {
      type: "docs";
    });

// Augmented types with client-side IDs and more details for the interactive phase
export type Lesson = Omit<LessonSchema, "resources" | "quiz"> & {
  id: string;
  content_summary: string; // The full summary text for the lesson
  content_snippet: string; // A short snippet for previews
  resources?: ResourceSchema[];
  quiz?: {
    question: string;
    answer: string;
    options?: string[];
    explanation?: string;
  }[];
  timeEstimateMinutes?: number;
};

export type Session = {
  id: string;
  session_title: string; // Renamed from module_title
  lessons: Lesson[];
  estimated_time?: string;
};

// This is the final course object used by the learning interface
export type Course = {
  course_title: string;
  description: string;
  sessions: Session[];
  checklist?: string[]; // Kept for compatibility, but not in new schema
  total_estimated_time?: string;
  readiness_score: number; // Kept for compatibility
  analysis_report: CourseAnalysis; // include the full analysis for potential detailed views
};

// Extracted for convenience
export type Resource = NonNullable<Lesson["resources"]>[0];
export type QuizQuestion = NonNullable<Lesson["quiz"]>[0];

// Storage types
export type StoredCourse = {
  course: Course;
  progress: Record<string, "completed">; // Key is lesson.id
  createdAt: string;
};

export type StudySession = {
  title: string;
  lessons: Lesson[];
  sessionIndex: number;
  durationMinutes: number;
  totalStepsInCourse: number; // Note: "steps" are now "lessons"
  completedStepsInCourse: number;
};
