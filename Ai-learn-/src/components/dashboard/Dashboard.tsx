"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserCourses, getCompletedCourses, getInProgressCourses, SavedCourse, updateLessonProgress } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, BookOpen, Trophy, Play, Award, Download, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCourseStorage } from "@/hooks/use-course-storage";
import { CertificateGallery } from "@/components/certificates/CertificateGallery";
import { getUserCertificates, Certificate } from "@/lib/certificates";
import type { Course } from "@/lib/types";
import dynamic from "next/dynamic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserFriendlyErrorMessage, logSupabaseError } from "@/lib/supabase-diagnostics";

// Dynamically import certificate download component to avoid SSR issues
const CertificateDownloadButton = dynamic(
  () => import("@/components/certificates/CertificateDownloadButton"),
  { 
    ssr: false,
    loading: () => <Button variant="outline" size="sm" className="w-full" disabled>Loading...</Button>
  }
);

export function Dashboard() {
  const { user, userProfile } = useAuth();
  const [inProgressCourses, setInProgressCourses] = useState<
    (SavedCourse & { courseId: string })[]
  >([]);
  const [completedCourses, setCompletedCourses] = useState<
    (SavedCourse & { courseId: string })[]
  >([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { saveCourse } = useCourseStorage();

  useEffect(() => {
    if (user) {
      loadCoursesAndCertificates();
    }
  }, [user]);

  const loadCoursesAndCertificates = async () => {
    if (!user) return;

    try {
      console.log('[Dashboard] Loading courses for user:', user.id);
      setErrorMessage(null); // Clear any previous errors
      
      const [inProgress, completed, userCertificates] = await Promise.all([
        getInProgressCourses(user.id).catch(err => {
          console.error('[Dashboard] getInProgressCourses failed:', err);
          logSupabaseError('Dashboard.getInProgressCourses', err);
          return [];
        }),
        getCompletedCourses(user.id).catch(err => {
          console.error('[Dashboard] getCompletedCourses failed:', err);
          logSupabaseError('Dashboard.getCompletedCourses', err);
          return [];
        }),
        getUserCertificates(user.id).catch(err => {
          console.error('[Dashboard] getUserCertificates failed:', err);
          logSupabaseError('Dashboard.getUserCertificates', err);
          return [];
        }),
      ]);
      
      console.log('[Dashboard] Loaded courses:', {
        inProgress: inProgress.length,
        completed: completed.length,
        certificates: userCertificates.length
      });
      
      setInProgressCourses(inProgress);
      setCompletedCourses(completed);
      setCertificates(userCertificates);
    } catch (error: any) {
      console.error("Error loading dashboard data:", error);
      logSupabaseError('Dashboard.loadCoursesAndCertificates', error);
      setErrorMessage(getUserFriendlyErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course: SavedCourse) => {
    const totalLessons = course.course.sessions.reduce(
      (acc, session) => acc + session.lessons.length,
      0
    );
    const completedLessons = course.progress.filter((p) => p.completed).length;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const continueCourse = (courseData: SavedCourse & { courseId: string }) => {
    // Set the course in storage and navigate to lesson view
    saveCourse(courseData.course);
    router.push("/lesson");
  };

  const getNextLesson = (course: SavedCourse) => {
    const completedLessons = new Set(
      course.progress.filter((p) => p.completed).map((p) => p.lessonId)
    );

    for (const session of course.course.sessions) {
      for (const lesson of session.lessons) {
        if (!completedLessons.has(lesson.id)) {
          return {
            session: session.session_title,
            lesson: lesson.lesson_title,
          };
        }
      }
    }
    return null;
  };

  const getCertificateForCourse = (courseId: string): Certificate | undefined => {
    return certificates.find(cert => cert.courseId === courseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-2">
            Welcome back, {userProfile?.displayName || "Learner"}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Continue your AI learning journey where you left off
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
              <br />
              <span className="text-xs mt-2 block">
                Check the browser console for detailed error information.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards - Mobile optimized grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="circuit-bg border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Progress
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCourses.length}</div>
            </CardContent>
          </Card>

          <Card className="circuit-bg border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completed Courses
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCourses.length}</div>
            </CardContent>
          </Card>

          <Card className="circuit-bg border-accent/30 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Certificates Earned
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs - Mobile optimized */}
        <Tabs defaultValue="in-progress" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="in-progress" className="flex items-center gap-2 py-3 touch-target">
              <Play className="h-4 w-4" />
              <span className="hidden xs:inline">In Progress</span>
              <span className="xs:hidden">Active</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 py-3 touch-target">
              <Trophy className="h-4 w-4" />
              <span className="hidden xs:inline">Completed</span>
              <span className="xs:hidden">Done</span>
            </TabsTrigger>
            <TabsTrigger
              value="certificates"
              className="flex items-center gap-2 py-3 touch-target"
            >
              <Award className="h-4 w-4" />
              <span className="hidden xs:inline">Certificates</span>
              <span className="xs:hidden">Awards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="in-progress" className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold">In Progress Courses</h2>

            {inProgressCourses.length === 0 ? (
              <Card className="text-center p-6 sm:p-8 circuit-bg border-accent/30">
                <CardContent>
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No courses in progress</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Start your learning journey by creating your first course
                  </p>
                  <Button
                    onClick={() => router.push("/")}
                    className="btn-gradient touch-target"
                  >
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {inProgressCourses.map((courseData) => {
                  const progress = calculateProgress(courseData);
                  const nextLesson = getNextLesson(courseData);

                  return (
                    <Card
                      key={courseData.courseId}
                      className="circuit-bg border-accent/30 hover:glow-subtle transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {courseData.course.course_title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {courseData.course.sessions.length} modules •{" "}
                              {courseData.course.total_estimated_time}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {nextLesson && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Next:</span>{" "}
                            {nextLesson.lesson}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => continueCourse(courseData)}
                            className="flex-1 btn-gradient"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Last accessed:{" "}
                          {new Date(
                            courseData.lastAccessedAt
                          ).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold">Completed Lessons</h2>

            {completedCourses.length === 0 ? (
              <Card className="text-center p-6 sm:p-8 circuit-bg border-accent/30">
                <CardContent>
                  <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No completed courses yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Finish your first course to see it here!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {completedCourses.map((courseData) => {
                  const progress = calculateProgress(courseData);
                  const completedDate = courseData.completedAt 
                    ? new Date(courseData.completedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : null;
                  
                  const certificate = getCertificateForCourse(courseData.courseId);

                  return (
                    <Card
                      key={courseData.courseId}
                      className="circuit-bg border-accent/30 hover:glow-subtle transition-all duration-300"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">
                              {courseData.course.course_title}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {courseData.course.sessions.length} modules •{" "}
                              {courseData.course.total_estimated_time}
                            </CardDescription>
                          </div>
                          <Badge
                            variant="default"
                            className="bg-green-600 text-white"
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {completedDate && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Completed:</span>{" "}
                            {completedDate}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {/* Certificate Download Button */}
                          {certificate && userProfile && (
                            <CertificateDownloadButton
                              userName={certificate.userName || userProfile.displayName}
                              courseTitle={certificate.courseTitle}
                              completedAt={certificate.completedAt}
                              certificateId={certificate.id}
                              variant="outline"
                              size="sm"
                            />
                          )}
                          
                          <Button
                            onClick={() => continueCourse(courseData)}
                            className="w-full btn-gradient"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Review Course
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Certificates</h2>
              <Badge variant="secondary">
                {completedCourses.length} earned
              </Badge>
            </div>

            {user && (
              <CertificateGallery
                userId={user.id}
                certificates={certificates}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
