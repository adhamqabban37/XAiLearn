"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { useCourseStorage } from "@/hooks/use-course-storage";
import { useRouter } from "next/navigation";
import { ContentForm } from "@/components/home/content-form";
import { CoursePreview } from "@/components/home/course-preview";
import { Loader2, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfUploadClient from "@/components/home/PdfUploadClient";

export default function Home() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    storedCourse,
    clearCourse,
    isLoading: storageIsLoading,
  } = useCourseStorage();
  const showLoadingBar = isLoading || storageIsLoading;
  const router = useRouter();

  const handleResume = () => {
    router.push("/lesson");
  };

  const handleStartOver = () => {
    clearCourse();
    setCourse(null);
  };

  if (storageIsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-muted-foreground">
          Loading your library...
        </h2>
      </div>
    );
  }

  if (course) {
    return <CoursePreview initialCourse={course} onClear={handleStartOver} />;
  }

  if (storedCourse?.course) {
    const hasProgress =
      storedCourse.progress && Object.keys(storedCourse.progress).length > 0;
    const totalSteps = storedCourse.course.sessions.reduce(
      (acc, s) => acc + s.lessons.length,
      0
    );
    const completedSteps = hasProgress
      ? Object.keys(storedCourse.progress).length
      : 0;
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="text-center my-4 sm:my-6 md:my-8 p-6 sm:p-8 md:p-12 bg-card border rounded-xl elevation-2 max-w-2xl mx-auto border-primary/20">
          <div className="mx-auto bg-primary/10 rounded-full p-4 sm:p-6 w-fit mb-4 sm:mb-6">
            <BookOpenCheck className="text-primary h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 font-headline px-2">
            Welcome Back!
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-base sm:text-lg px-2">
            You have a course in progress. Ready to dive back in?
          </p>

          {totalSteps > 0 && (
            <>
              <div className="w-full bg-muted/20 rounded-full h-2.5 sm:h-3 mb-3 sm:mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-2.5 sm:h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                {completedSteps} of {totalSteps} lessons completed
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
            <Button onClick={handleResume} size="lg" className="btn-gradient touch-target w-full sm:w-auto">
              Resume Learning
            </Button>
            <Button onClick={handleStartOver} variant="outline" size="lg" className="touch-target w-full sm:w-auto">
              Start a New Course
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Hero Section - Mobile optimized */}
      <section className="relative text-center my-4 sm:my-8 md:my-16 p-6 sm:p-8 md:p-12 rounded-xl overflow-hidden circuit-bg border border-accent/20 elevation-2">
        <div className="circuit-lines"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 text-gradient font-headline leading-tight">
            Turn Any Document into an Adventure
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
            Upload a PDF, paste text, or provide a link. Our AI will analyze
            your content and build a personalized, interactive course for you in
            seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-2">
            <button className="btn-gradient px-6 sm:px-8 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all touch-target text-base">
              Get Started
            </button>
            <a
              href="https://youtu.be/WadeMfgr_hA"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 sm:px-8 py-3 rounded-lg border-2 border-accent/30 text-accent hover:bg-accent/10 hover:border-accent/50 transition-all duration-300 font-semibold text-center flex items-center justify-center touch-target text-base"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Content Form Section */}
      <section className="mb-8 sm:mb-12 md:mb-16">
        <ContentForm
          onCourseGenerated={setCourse}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </section>

      {/* PDF Upload Section */}
      <section className="mb-8 sm:mb-12 md:mb-16 max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4">PDF Upload Test</h2>
        <PdfUploadClient onCourseGenerated={setCourse} />
      </section>
    </div>
  );
}
