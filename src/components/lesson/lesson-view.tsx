"use client";

import { useState, useEffect, useRef } from "react";
import type { StudySession, Lesson } from "@/lib/types";
import { useCourseStorage } from "@/hooks/use-course-storage";
import { useUserProgress } from "@/hooks/use-user-progress";
import { useRouter } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "../ui/scroll-area";
import { ConceptCard } from "./concept-card";
import { QuizCard } from "./quiz-card";
import { AskTheDocumentCard } from "./ask-the-document-card";
import { LessonProgressBar } from "./progress-bar";
import { Checkbox } from "../ui/checkbox";
import { CompletionCard } from "./completion-card";
import { ResourcesPanel } from "./resources-panel";
import { CertificateAwardModal } from "../certificates/CertificateAwardModal";
import { NotesPanel } from "./notes-panel";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  clampProgress,
  formatProgressHeader,
  formatProgressFooter,
} from "@/lib/progress";

interface LessonViewProps {
  initialSession: StudySession;
}

export function LessonView({ initialSession }: LessonViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile(); // Custom hook to detect mobile viewport
  const [session, setSession] = useState(initialSession);
  const [showNotes, setShowNotes] = useState(false); // Mobile: toggle notes panel
  const { updateStepProgress, startNewSession, storedCourse } =
    useCourseStorage();
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    () => {
      if (!storedCourse?.progress) return {};
      return session.lessons.reduce(
        (acc, lesson) => {
          if (storedCourse.progress[lesson.id]) {
            acc[lesson.id] = true;
          }
          return acc;
        },
        {} as Record<string, boolean>
      );
    }
  );

  // Generate course ID from session data
  // Avoid using Date.now() during SSR which can cause hydration mismatches.
  // Fallback to a deterministic slug; if none, create a stable client-only ID after mount.
  const baseSlug = storedCourse?.course.course_title
    ? storedCourse.course.course_title.replace(/[^a-zA-Z0-9]/g, "-")
    : null;
  const generatedIdRef = useRef<string | null>(null);
  if (!baseSlug && typeof window !== "undefined" && !generatedIdRef.current) {
    generatedIdRef.current = `course-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
  const courseId = baseSlug || generatedIdRef.current || "course-temp";
  const courseTitle = storedCourse?.course.course_title || session.title;
  const totalLessons = session.totalStepsInCourse;

  // Enable Supabase-backed progress tracking
  const {
    markLessonComplete,
    isLessonCompleted,
    getCourseCompletionStatus,
    setCourseCompleteCallback,
  } = useUserProgress(courseId, courseTitle, totalLessons);

  // Compute counts and completion state from Supabase
  const { completedLessons, isCompleted: courseIsComplete } =
    getCourseCompletionStatus();
  const totalStepsInSession = session.lessons.length;
  // Count only completions for lessons that belong to THIS session
  const completedCount = session.lessons.reduce(
    (acc, l) => acc + (isLessonCompleted(l.id) ? 1 : 0),
    0
  );

  // Use progress utility to ensure no negatives and correct math
  const progressState = clampProgress(completedCount, totalStepsInSession);
  const isSessionComplete = progressState.isComplete;

  // Debug logging for completion status
  useEffect(() => {
    console.log("📊 Progress State:", {
      completed: progressState.completed,
      total: progressState.total,
      isComplete: progressState.isComplete,
      sessionLessons: session.lessons.map((l) => ({
        id: l.id,
        title: l.lesson_title,
        completed: isLessonCompleted(l.id),
      })),
    });
  }, [progressState.completed, progressState.total, progressState.isComplete]);

  // Set up certificate awarding callback
  const [shouldAwardCertificate, setShouldAwardCertificate] = useState(false);
  useEffect(() => {
    setCourseCompleteCallback((data) => {
      if (data.isCompleted) {
        setShowCertificateModal(true);
        setShouldAwardCertificate(true);
      }
    });
  }, [setCourseCompleteCallback]);

  // state moved above

  // Use Supabase-backed progress
  const isStepCompleted = (stepId: string) => isLessonCompleted(stepId);

  const handleStepComplete = async (stepId: string, isChecked: boolean) => {
    if (isChecked) {
      console.log(`✅ Marking lesson ${stepId} as complete`);
      // Persist to Supabase first
      await markLessonComplete(stepId, 100, 30); // Default score and time
      // Update local course storage
      updateStepProgress(stepId, "completed");
    } else {
      console.log(
        `⬜ Unmarking lesson ${stepId} - note: local storage doesn't support unchecking`
      );
      // Note: updateStepProgress only supports "completed" status
      // To uncheck, we'd need to implement a removeStepProgress function
    }
  };

  // derived values moved above

  // Firebase course completion disabled temporarily
  // const { completedLessons, isCompleted: courseIsComplete } =
  //   getCourseCompletionStatus();

  const handleNextSession = () => {
    const newSession = startNewSession(session.durationMinutes);
    if (newSession) {
      setSession(newSession);
      setCompletedSteps({});
      // Scroll to top of new session
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Show notification
      const event = new CustomEvent("show-toast", {
        detail: {
          title: "📚 New Session Started!",
          description: `Now studying: ${newSession.title}`,
        },
      });
      window.dispatchEvent(event);
    } else {
      // No more sessions - course is complete!
      console.log("🎉 No more sessions - course complete!");
      handleFinish();
    }
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  // derived values moved above

  // Mobile layout: stack vertically with toggle button for notes
  if (isMobile) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] bg-background">
        {/* Mobile: show notes panel as overlay or stacked */}
        {showNotes && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
            <div className="flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotes(false)}
                  className="touch-target"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <NotesPanel courseId={courseId} />
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <ScrollArea className="h-full">
          <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-3xl">
            {/* Sticky header with progress */}
            <div className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 py-3 -my-3 border-b border-border/40">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                  {session.title}
                </h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotes(true)}
                  className="touch-target shrink-0"
                  aria-label="Open notes panel"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </div>
              <LessonProgressBar
                completedSteps={progressState.completed}
                totalSteps={progressState.total}
              />
            </div>

            <AskTheDocumentCard />

            {session.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-start gap-3 sm:gap-4"
                data-lesson-id={lesson.id}
                data-completed={isStepCompleted(lesson.id)}
              >
                {/* Enhanced Skip/Complete Button */}
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 shrink-0">
                  <label
                    htmlFor={`cb-${lesson.id}`}
                    className="cursor-pointer group relative block"
                    title={isStepCompleted(lesson.id) ? "Mark as incomplete" : "Skip/Mark as complete"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {/* Large touch target wrapper - minimum 48x48px for better mobile accessibility */}
                    <div 
                      className="p-3 -m-3 sm:p-3 sm:-m-3 rounded-lg hover:bg-primary/5 active:bg-primary/10 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const checkbox = document.getElementById(`cb-${lesson.id}`) as HTMLInputElement;
                        if (checkbox) {
                          checkbox.click();
                        }
                      }}
                    >
                      <div className="shrink-0 pointer-events-none">
                        <Checkbox
                          id={`cb-${lesson.id}`}
                          size="large"
                          onCheckedChange={(checked) => {
                            handleStepComplete(lesson.id, !!checked);
                          }}
                          checked={isStepCompleted(lesson.id)}
                          aria-label={isStepCompleted(lesson.id) ? `Mark lesson "${lesson.lesson_title}" as incomplete` : `Skip/Mark lesson "${lesson.lesson_title}" as complete`}
                        />
                      </div>
                    </div>
                  </label>
                  {/* Label text for clarity - visible on all screens but smaller on mobile */}
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center max-w-[60px] sm:max-w-[80px] leading-tight px-1">
                    {isStepCompleted(lesson.id) ? "Done" : "Skip"}
                  </span>
                </div>
                <div
                  className={`flex-1 transition-opacity space-y-3 sm:space-y-4 ${
                    isStepCompleted(lesson.id) ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <ConceptCard lesson={lesson} />
                  {lesson.resources && lesson.resources.length > 0 && (
                    <ResourcesPanel resources={lesson.resources} />
                  )}
                  {lesson.quiz && lesson.quiz.length > 0 && (
                    <QuizCard
                      questions={lesson.quiz}
                      onQuizComplete={() => {
                        if (!isStepCompleted(lesson.id)) {
                          handleStepComplete(lesson.id, true);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Progress Summary - shown when making progress */}
            {progressState.completed > 0 && !isSessionComplete && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatProgressHeader(progressState)}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold text-primary">
                      {progressState.completed}
                    </div>
                    <div className="text-muted-foreground">/</div>
                    <div className="text-2xl font-bold">
                      {progressState.total}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {progressState.remaining} lesson
                    {progressState.remaining !== 1 ? "s" : ""} remaining
                  </p>
                </CardContent>
              </Card>
            )}

            {isSessionComplete && (
              <CompletionCard
                onNextSession={handleNextSession}
                onFinish={handleFinish}
                isCourseComplete={courseIsComplete}
                courseTitle={storedCourse?.course.course_title}
                courseId={courseId}
              />
            )}
          </div>
        </ScrollArea>

        {/* Certificate Award Modal */}
        <CertificateAwardModal
          courseTitle={courseTitle}
          courseId={courseId}
          visible={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setShouldAwardCertificate(false);
          }}
          shouldAward={shouldAwardCertificate}
        />
      </div>
    );
  }

  // Desktop layout: resizable panels
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="w-full h-[calc(100vh-4rem)] rounded-none border-none bg-background"
    >
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <div className="flex h-full p-4">
          <NotesPanel courseId={courseId} />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65} minSize={40}>
        <ScrollArea className="h-full px-4 lg:px-6">
          <div className="container mx-auto py-6 lg:py-8 space-y-6 max-w-3xl">
            <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 -my-4">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                {session.title}
              </h1>
              <LessonProgressBar
                completedSteps={progressState.completed}
                totalSteps={progressState.total}
              />
            </div>

            <AskTheDocumentCard />

            {session.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-start gap-4"
                data-lesson-id={lesson.id}
                data-completed={isStepCompleted(lesson.id)}
              >
                {/* Enhanced Skip/Complete Button */}
                <div className="flex flex-col items-center gap-2 mt-8 shrink-0">
                  <label
                    htmlFor={`cb-desktop-${lesson.id}`}
                    className="cursor-pointer group relative block"
                    title={isStepCompleted(lesson.id) ? "Mark as incomplete" : "Skip/Mark as complete"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {/* Large touch target wrapper - minimum 48x48px for better accessibility */}
                    <div 
                      className="p-3 -m-3 rounded-lg hover:bg-primary/5 active:bg-primary/10 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const checkbox = document.getElementById(`cb-desktop-${lesson.id}`) as HTMLInputElement;
                        if (checkbox) {
                          checkbox.click();
                        }
                      }}
                    >
                      <div className="shrink-0 pointer-events-none">
                        <Checkbox
                          id={`cb-desktop-${lesson.id}`}
                          size="large"
                          onCheckedChange={(checked) => {
                            handleStepComplete(lesson.id, !!checked);
                          }}
                          checked={isStepCompleted(lesson.id)}
                          aria-label={isStepCompleted(lesson.id) ? `Mark lesson "${lesson.lesson_title}" as incomplete` : `Skip/Mark lesson "${lesson.lesson_title}" as complete`}
                        />
                      </div>
                    </div>
                  </label>
                  {/* Label text for clarity */}
                  <span className="text-xs font-medium text-muted-foreground text-center max-w-[80px] leading-tight">
                    {isStepCompleted(lesson.id) ? "Done" : "Skip"}
                  </span>
                </div>
                <div
                  className={`flex-1 transition-opacity space-y-4 ${
                    isStepCompleted(lesson.id) ? "opacity-50" : "opacity-100"
                  }`}
                >
                  <ConceptCard lesson={lesson} />
                  {lesson.resources && lesson.resources.length > 0 && (
                    <ResourcesPanel resources={lesson.resources} />
                  )}
                  {lesson.quiz && lesson.quiz.length > 0 && (
                    <QuizCard
                      questions={lesson.quiz}
                      onQuizComplete={() => {
                        if (!isStepCompleted(lesson.id)) {
                          handleStepComplete(lesson.id, true);
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Progress Summary - shown when making progress */}
            {progressState.completed > 0 && !isSessionComplete && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatProgressHeader(progressState)}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-2xl font-bold text-primary">
                      {progressState.completed}
                    </div>
                    <div className="text-muted-foreground">/</div>
                    <div className="text-2xl font-bold">
                      {progressState.total}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {progressState.remaining} lesson
                    {progressState.remaining !== 1 ? "s" : ""} remaining
                  </p>
                </CardContent>
              </Card>
            )}

            {isSessionComplete && (
              <CompletionCard
                onNextSession={handleNextSession}
                onFinish={handleFinish}
                isCourseComplete={courseIsComplete}
                courseTitle={storedCourse?.course.course_title}
                courseId={courseId}
              />
            )}
          </div>
        </ScrollArea>
      </ResizablePanel>

      {/* Certificate Award Modal */}
      <CertificateAwardModal
        courseTitle={courseTitle}
        courseId={courseId}
        visible={showCertificateModal}
        onClose={() => {
          setShowCertificateModal(false);
          setShouldAwardCertificate(false);
        }}
        shouldAward={shouldAwardCertificate}
      />
    </ResizablePanelGroup>
  );
}
