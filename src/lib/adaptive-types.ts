/**
 * @fileOverview Advanced type definitions for the Adaptive Learning System
 *
 * This file defines the complete type system for:
 * - Deep PDF understanding and structure detection
 * - Learner profiles and personalization
 * - Adaptive course generation
 * - Multi-modal resources and assessments
 */

import type { AnalyzeDocumentOutput } from "@/ai/flows/schemas";

// ==================== PDF UNDERSTANDING ====================

export type PDFMetadata = {
  title: string;
  author?: string;
  subject?: string;
  pageCount: number;
  detectedLanguage: string;
  createdDate?: string;
  keywords?: string[];
};

export type TableOfContentsEntry = {
  level: number; // 1 = chapter, 2 = section, 3 = subsection
  title: string;
  pageNumber: number;
  subsections?: TableOfContentsEntry[];
};

export type ContentChunkType =
  | "theory"
  | "example"
  | "exercise"
  | "definition"
  | "summary"
  | "reference"
  | "introduction"
  | "case_study";

export type DifficultyLevel = "intro" | "moderate" | "advanced";
export type CognitiveLoad = "low" | "medium" | "high";

export type ContentChunk = {
  id: string;
  sourcePages: number[];
  rawText: string;

  structure: {
    heading?: string;
    level: number; // 1=chapter, 2=section, 3=subsection
    chunkType: ContentChunkType;
  };

  semantics: {
    mainConcepts: string[];
    keyDefinitions: Array<{ term: string; definition: string }>;
    codeExamples: Array<{
      language?: string;
      code: string;
      explanation?: string;
    }>;
    formulas: string[];
    diagrams: Array<{ description: string; pageNumber: number }>;

    difficulty: DifficultyLevel;
    prerequisites: string[]; // concepts needed to understand this chunk

    summary: string;
    keyTakeaways: string[];
  };

  learningMetadata: {
    estimatedReadingMinutes: number;
    cognitiveLoad: CognitiveLoad;
    practicalApplications: string[];
  };
};

export type TopicNode = {
  topic: string;
  parentTopic?: string;
  relatedTopics: string[];
  chunkIds: string[]; // which chunks cover this topic
  difficultyProgression: "linear" | "branching" | "circular";
  importance: number; // 0-100
};

export type DocumentType =
  | "textbook"
  | "research_paper"
  | "lecture_notes"
  | "manual"
  | "handbook"
  | "tutorial"
  | "reference_guide"
  | "unknown";

export type GlobalContext = {
  mainTopics: string[];
  topicHierarchy: TopicNode[];
  difficultyEstimate: "beginner" | "intermediate" | "advanced" | "mixed";
  documentType: DocumentType;
  conceptDependencies: Record<string, string[]>; // concept -> prerequisites
  learningPathSuggestions: string[][]; // multiple suggested orderings
};

export type PDFStructure = {
  metadata: PDFMetadata;
  tableOfContents: TableOfContentsEntry[];
  contentChunks: ContentChunk[];
  globalContext: GlobalContext;

  // Extraction metadata
  extractionQuality: {
    structureDetectionConfidence: number; // 0-1
    tocAvailable: boolean;
    diagramsDetected: number;
    codeBlocksDetected: number;
  };
};

// ==================== LEARNER PROFILE ====================

export type GoalType =
  | "exam"
  | "skill_building"
  | "career_transition"
  | "hobby"
  | "certification"
  | "general"
  | "interview_prep";

export type BackgroundLevel =
  | "absolute_beginner"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type LearningStyle =
  | "theory_first"
  | "practice_first"
  | "balanced"
  | "example_driven"
  | "project_based";

export type PacePreference = "fast" | "moderate" | "slow" | "self_paced";

export type ResourceType =
  | "videos"
  | "code_examples"
  | "diagrams"
  | "practice_problems"
  | "real_world_projects"
  | "articles"
  | "interactive_demos";

export type QuizFrequency =
  | "every_lesson"
  | "end_of_module"
  | "minimal"
  | "comprehensive";
export type QuizDifficulty = "easy" | "medium" | "hard" | "adaptive";

export type ReadingLevel = "simple" | "standard" | "academic";

export type LearnerProfile = {
  // Core goals
  goal: string; // Free-form text: "pass my networking exam in 4 weeks"
  goalType: GoalType;
  deadline?: string; // ISO date string

  // Background
  backgroundLevel: BackgroundLevel;
  priorKnowledge: string[]; // ["basic programming", "HTML/CSS"]
  currentSkillLevel?: Record<string, number>; // {"networking": 3, "security": 1} (1-10 scale)

  // Time constraints
  timePerWeekHours: number;
  preferredSessionLength?: number; // minutes per study session (default: 30-60)
  availableDays?: string[]; // ["Monday", "Wednesday", "Friday"]

  // Learning preferences
  preferredStyle: LearningStyle;
  pacePreference: PacePreference;

  // Content preferences
  focusAreas?: string[]; // ["subnetting", "routing basics"]
  avoid?: string[]; // ["too much history", "very advanced math"]
  includeExtras?: ResourceType[];

  // Assessment preferences
  quizFrequency: QuizFrequency;
  quizDifficulty: QuizDifficulty;

  // Accessibility
  language?: string; // ISO 639-1 code (default: "en")
  readingLevel?: ReadingLevel;

  // Optional: Learning history
  completedCourses?: string[];
  struggledWith?: string[]; // topics the learner found difficult in the past
};

// ==================== LEARNING PLAN ====================

export type PrerequisiteCheck = {
  required: string[];
  recommended: string[];
  learnersLevel: string; // "ready", "needs_prep", "challenging_but_doable"
  isReadyToStart: boolean;
  gapsToBridge: Array<{
    concept: string;
    importance: "critical" | "important" | "nice_to_have";
    suggestedPrework?: string;
  }>;
};

export type GoalAlignment = {
  relevanceScore: number; // 0-100
  alignedTopics: string[];
  missingFromPDF: string[];
  excessInPDF: string[];
  recommendations: string[];
};

export type PacingPlan = {
  totalWeeks: number;
  hoursPerWeek: number;
  sessionsPerWeek: number;
  minutesPerSession: number;
  flexibilityBuffer: number; // percentage of extra time
};

export type CustomizationStrategy = {
  simplifyLanguage: boolean;
  addMoreExamples: boolean;
  emphasizePractice: boolean;
  includeRealWorldProjects: boolean;
  reduceTheory: boolean;
  skipAdvancedTopics: boolean;
  focusOnExamFormat: boolean;
};

export type LearningPlan = {
  goalAlignment: GoalAlignment;
  prerequisiteCheck: PrerequisiteCheck;
  pacing: PacingPlan;
  relevantChunkIds: string[]; // filtered from PDF
  customizationStrategy: CustomizationStrategy;
  estimatedCompletionDate?: string;
  confidenceLevel: number; // 0-100, how well PDF matches learner goals
};

// ==================== ADAPTIVE COURSE ====================

export type PriorityLevel =
  | "critical"
  | "important"
  | "supplementary"
  | "optional";

export type CoursePhase = {
  phaseName: string; // "Foundation", "Core Concepts", "Advanced Topics"
  description: string;
  moduleIds: string[];
  gatekeeper: boolean; // must complete before next phase
  estimatedWeeks: number;
};

export type VideoResource = {
  title: string;
  url: string;
  embedUrl?: string;
  duration?: string; // "15:30"
  timestamps?: Array<{ time: string; label: string }>; // [{ time: "2:30", label: "Example 1" }]
  relevanceScore?: number; // 0-100
};

export type ArticleResource = {
  title: string;
  url: string;
  source?: string; // "MDN", "Wikipedia", etc.
  section?: string;
  estimatedReadingMinutes?: number;
};

export type CodeExample = {
  language: string;
  code: string;
  explanation: string;
  runnable?: boolean;
  complexity: "simple" | "moderate" | "complex";
};

export type DiagramResource = {
  description: string;
  imageUrl?: string;
  sourcePageNumber?: number;
  type: "flowchart" | "architecture" | "graph" | "illustration" | "other";
};

export type InteractiveResource = {
  type: "quiz" | "sandbox" | "simulation" | "visualization";
  title: string;
  url?: string;
  embedCode?: string;
};

export type Checkpoint = {
  id: string;
  question: string;
  expectedAnswer: string;
  hint?: string;
  pointsToReview?: string[]; // section IDs or concept names
  difficulty: "easy" | "medium" | "hard";
};

export type PracticeProblem = {
  id: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  solution?: string;
  hints: string[];
  skillsPracticed: string[];
  estimatedMinutes: number;
};

export type LessonSectionType =
  | "introduction"
  | "explanation"
  | "example"
  | "practice"
  | "summary"
  | "checkpoint"
  | "deep_dive";

export type LessonSection = {
  id: string;
  type: LessonSectionType;
  title: string;
  content: string;

  // Semantic linking
  conceptsTaught: string[];
  conceptsRevisited: string[];

  // Cognitive load indicators
  complexity: CognitiveLoad;
  estimatedMinutes: number;
};

export type AdaptiveLesson = {
  id: string;
  lessonTitle: string;

  // Content structure
  sections: LessonSection[];

  // Learning design
  objectives: string[];
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";

  // Adaptive content variants
  contentVariants: {
    simplified?: string; // for beginners
    standard: string;
    detailed?: string; // for advanced learners
  };

  // Multimodal resources
  resources: {
    videos?: VideoResource[];
    articles?: ArticleResource[];
    codeExamples?: CodeExample[];
    diagrams?: DiagramResource[];
    interactiveElements?: InteractiveResource[];
  };

  // Practice & assessment
  checkpoints: Checkpoint[];
  practiceProblems: PracticeProblem[];
  quiz?: {
    questions: QuizQuestion[];
    passingScore?: number; // percentage
  };

  // Personalization metadata
  relevanceToGoal: number; // 0-100
  prerequisiteConcepts: string[];
  enablesUnlocking: string[]; // lesson IDs that require this one
  sourceChunkIds: string[]; // links back to PDF chunks
};

export type ModuleIntro = {
  whatYoullLearn: string[];
  whyItMatters: string;
  realWorldApplications: string[];
  timeCommitment: string;
};

export type AdaptiveModule = {
  id: string;
  moduleTitle: string;
  learningObjectives: string[];

  // Pedagogical metadata
  difficultyLevel: DifficultyLevel;
  estimatedHours: number;
  prerequisites: string[]; // module IDs or concept names

  // Content
  lessons: AdaptiveLesson[];

  // Personalization
  priorityLevel: PriorityLevel;
  relevanceScore: number; // 0-100, based on learner goals

  moduleIntro: ModuleIntro;

  // Assessment
  moduleQuiz?: {
    questions: QuizQuestion[];
    passingScore: number;
  };
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: "MCQ" | "short_answer" | "code_completion" | "practical";
  options?: string[]; // for MCQ
  answer: string;
  explanation?: string;
  difficulty: QuizDifficulty;
  conceptsTested: string[];
  pointValue?: number;
};

export type Quiz = {
  id: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // minutes
  attemptsAllowed?: number;
};

export type StudySession = {
  sessionNumber: number;
  date?: string; // ISO date
  lessonIds: string[];
  estimatedMinutes: number;
  objectives: string[];
};

export type AdaptiveCourseMetadata = {
  courseId: string;
  generatedAt: string; // ISO date-time
  sourceDocument: {
    filename: string;
    pdfHash: string;
    pageCount: number;
  };
  learnerProfile: LearnerProfile;
  customizationLevel: number; // 0-100, how much it's tailored
  version: string; // semantic version for schema evolution
};

export type CourseOverview = {
  title: string;
  description: string;
  learningObjectives: string[];
  totalEstimatedHours: number;

  prerequisiteCheck: PrerequisiteCheck;

  roadmap: {
    phases: CoursePhase[];
    criticalPath: string[]; // lesson IDs that are essential
    optionalPath: string[]; // can be skipped based on goals
  };

  keyTopics: string[];
  targetAudience: string;
};

export type AssessmentStrategy = {
  diagnosticQuiz?: Quiz; // check initial level
  formativeQuizzes: Quiz[]; // during learning
  summativeQuiz?: Quiz; // final assessment
  practiceExams?: Quiz[];
};

export type ContentPersonalization = {
  examplesMatchProfile: boolean;
  languageSimplified: boolean;
  focusAreasHighlighted: boolean;
  avoidedTopicsExcluded: boolean;
  extraResourcesIncluded: boolean;
};

export type AdaptiveElements = {
  difficultyScaling: "enabled" | "disabled";
  contentPersonalization: ContentPersonalization;
  pacing: {
    recommendedSchedule: StudySession[];
    flexibilityAllowed: boolean;
  };
};

export type AdaptiveCourse = {
  metadata: AdaptiveCourseMetadata;
  courseOverview: CourseOverview;
  modules: AdaptiveModule[];
  assessmentStrategy: AssessmentStrategy;
  adaptiveElements: AdaptiveElements;

  // Analytics & tracking
  analytics?: {
    expectedCompletionRate: number; // 0-100
    difficultyRating: number; // 1-10
    engagementScore: number; // 0-100
  };
};

// ==================== BACKWARD COMPATIBILITY ====================

// Map new types to existing Course type for gradual migration
export type LegacyCourse = {
  course_title: string;
  description: string;
  sessions: Array<{
    id: string;
    session_title: string;
    lessons: Array<{
      id: string;
      lesson_title: string;
      content_summary: string;
      content_snippet: string;
      key_points: string[];
      resources?: Array<{ title: string; url: string; type: string }>;
      quiz?: Array<{
        question: string;
        answer: string;
        options?: string[];
        explanation?: string;
      }>;
      timeEstimateMinutes?: number;
      isCompleted?: boolean;
    }>;
    estimated_time?: string;
  }>;
  checklist?: string[];
  total_estimated_time?: string;
  readiness_score: number;
  analysis_report: AnalyzeDocumentOutput;
};

// Helper function to convert AdaptiveCourse to LegacyCourse
export function adaptiveToLegacy(course: AdaptiveCourse): LegacyCourse {
  // Implementation will map new structure to old for backward compatibility
  // This allows gradual frontend migration
  return {} as LegacyCourse; // Placeholder
}
