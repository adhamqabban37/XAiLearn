"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartyPopper, Trophy, Star, Award, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { markCourseComplete } from "@/lib/auth";
import { awardCertificate } from "@/lib/certificates";
import dynamic from "next/dynamic";

// Dynamically import the certificate download component to avoid SSR issues
const CertificateDownloadButton = dynamic(
  () => import("@/components/certificates/CertificateDownloadButton"),
  { 
    ssr: false,
    loading: () => <Button size="lg" className="w-full bg-green-600" disabled>Loading Certificate...</Button>
  }
);

interface CompletionCardProps {
    onNextSession: () => void;
    onFinish: () => void;
    isCourseComplete: boolean;
    courseTitle?: string;
    courseId?: string;
}

export function CompletionCard({ onNextSession, onFinish, isCourseComplete, courseTitle, courseId }: CompletionCardProps) {
    const { user, userProfile } = useAuth();
    const [completionSaved, setCompletionSaved] = useState(false);
    const [certificateAwarded, setCertificateAwarded] = useState(false);
    const [certificateId, setCertificateId] = useState<string>("");
    
    // Track achievement and save completion when course is completed
    useEffect(() => {
        if (isCourseComplete && !completionSaved) {
            // Record achievement in localStorage
            const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
            const newAchievement = {
                id: `course-${Date.now()}`,
                type: 'course_completion',
                title: courseTitle || 'Course',
                completedAt: new Date().toISOString(),
                icon: '🏆'
            };
            achievements.push(newAchievement);
            localStorage.setItem('achievements', JSON.stringify(achievements));
            
            // Save course completion to database and award certificate
            if (user && userProfile && courseId && courseId !== 'course-temp') {
                // Mark course as complete
                markCourseComplete(user.id, courseId).then((success) => {
                    if (success) {
                        setCompletionSaved(true);
                        console.log('✅ Course completion saved to database');
                        
                        // Award certificate automatically
                        awardCertificate(
                            user.id,
                            courseId,
                            courseTitle || 'Course',
                            userProfile.displayName
                        ).then((certId) => {
                            setCertificateId(certId);
                            setCertificateAwarded(true);
                            console.log('✅ Certificate awarded:', certId);
                            
                            // Show success toast with certificate info
                            const event = new CustomEvent('show-toast', {
                                detail: {
                                    title: '🎉 Course Completed!',
                                    description: `"${courseTitle || 'Course'}" has been added to your completed lessons! Certificate awarded.`
                                }
                            });
                            window.dispatchEvent(event);
                        }).catch((error) => {
                            console.error('Failed to award certificate:', error);
                            // Still show success for course completion
                            const event = new CustomEvent('show-toast', {
                                detail: {
                                    title: '🎉 Course Completed!',
                                    description: `"${courseTitle || 'Course'}" has been added to your completed lessons!`
                                }
                            });
                            window.dispatchEvent(event);
                        });
                    }
                });
            } else if (!user) {
                // For non-authenticated users, just show achievement toast
                const event = new CustomEvent('show-toast', {
                    detail: {
                        title: '🎉 Achievement Unlocked!',
                        description: `You've completed "${courseTitle || 'the course'}"!`
                    }
                });
                window.dispatchEvent(event);
            }
        }
    }, [isCourseComplete, courseTitle, user, userProfile, courseId, completionSaved]);

    if (isCourseComplete) {
        return (
            <Card className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-amber-400 dark:border-amber-600 shadow-2xl text-center completion-card animate-in fade-in-50 zoom-in-95 duration-700 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_50%)]" />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 animate-pulse">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 animate-pulse delay-100">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="absolute bottom-3 left-6 sm:bottom-4 sm:left-8 animate-pulse delay-200">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300" />
                </div>
                <div className="absolute bottom-3 right-6 sm:bottom-4 sm:right-8 animate-pulse delay-300">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 fill-amber-300" />
                </div>

                <CardHeader className="pb-4 sm:pb-6 pt-6 sm:pt-8 px-4 sm:px-6 relative z-10">
                    <div className="mx-auto relative mb-3 sm:mb-4">
                        <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" />
                        <div className="relative text-amber-600 dark:text-amber-400 rounded-full p-4 sm:p-5 bg-amber-100 dark:bg-amber-900/50 w-fit mx-auto border-3 sm:border-4 border-amber-300 dark:border-amber-700">
                            <Trophy className="w-12 h-12 sm:w-16 sm:h-16" />
                        </div>
                    </div>
                    
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold mt-3 sm:mt-4 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent px-4">
                        You finished the course! 🎉
                    </CardTitle>
                    
                    <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 px-4">
                        <p className="text-base sm:text-lg font-semibold text-foreground">
                            Congratulations on completing the entire course!
                        </p>
                        <CardDescription className="text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                            Your hard work and perseverance have paid off. You've mastered new skills, expanded your knowledge, and shown incredible determination.
                        </CardDescription>
                        
                        {/* Achievement Badge */}
                        <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-full px-4 sm:px-6 py-2 sm:py-3 mt-3 sm:mt-4">
                            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                            <span className="font-bold text-sm sm:text-base text-amber-800 dark:text-amber-300">Course Complete!</span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-3 pt-2 pb-6 sm:pb-8 px-4 sm:px-6 relative z-10">
                    {/* Certificate Download Button */}
                    {certificateAwarded && user && userProfile && (
                        <CertificateDownloadButton
                          userName={userProfile.displayName}
                          courseTitle={courseTitle || 'Course'}
                          completedAt={new Date()}
                          certificateId={certificateId}
                          size="lg"
                          variant="default"
                        />
                    )}
                    
                    <Button onClick={onFinish} size="lg" className="btn-gradient shadow-lg hover:shadow-xl transition-shadow touch-target text-base w-full">
                        Browse more courses
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Session complete (but not full course yet)
    return (
        <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 border-primary/30 shadow-lg text-center completion-card animate-in fade-in-50 zoom-in-95 duration-500">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                <div className="mx-auto text-primary rounded-full p-3 sm:p-4 bg-primary/20 w-fit mb-2 animate-bounce">
                    <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold mt-2 px-4">
                    ✨ Session Complete! ✨
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-2 px-4 space-y-1">
                    <p className="font-semibold">Great job! You've finished all lessons in this session.</p>
                    <p className="text-xs sm:text-sm">Ready to continue learning?</p>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-2 pb-4 sm:pb-6 px-4 sm:px-6">
                <div className="bg-muted/50 border border-primary/20 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">📖 More content available!</p>
                    <p className="text-muted-foreground text-xs">Click below to load the next set of lessons</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button onClick={onNextSession} size="lg" className="btn-gradient touch-target text-base w-full sm:w-auto shadow-lg">
                        ▶️ Go to next session
                    </Button>
                    <Button onClick={onFinish} variant="outline" size="lg" className="touch-target text-base w-full sm:w-auto">
                        ⏸️ Save & Exit
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
