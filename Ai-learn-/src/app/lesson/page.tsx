"use client";

import { useCourseStorage } from "@/hooks/use-course-storage";
import { LessonView } from "@/components/lesson/lesson-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/common/logo";

export default function LessonPage() {
  const { studySession, isLoading } = useCourseStorage();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-muted-foreground">Loading your session...</h2>
      </div>
    );
  }

  if (!studySession) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <Card className="text-center shadow-lg">
            <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit">
                    <Logo className="text-primary"/>
                </div>
                <CardTitle className="mt-4">No Active Session</CardTitle>
                <CardDescription>It looks like you don't have a study session in progress. Let's create one!</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg">
                    <Link href="/">Create a New Course</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return <LessonView initialSession={studySession} />;
}
