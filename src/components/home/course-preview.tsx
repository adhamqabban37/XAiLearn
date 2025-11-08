
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCourseStorage } from '@/hooks/use-course-storage';
import { CheckCircle, Clock, FileText, Link, ListChecks, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/types';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

interface CoursePreviewProps {
  initialCourse: Course;
  onClear: () => void;
}

export function CoursePreview({ initialCourse, onClear }: CoursePreviewProps) {
  const [course, setCourse] = useState(initialCourse);
  const [sessionDuration, setSessionDuration] = useState("30");
  const { saveCourse, startNewSession } = useCourseStorage();
  const router = useRouter();

  const handleStartLearning = () => {
    saveCourse(course);
    const newSession = startNewSession(parseInt(sessionDuration, 10));
    if (newSession) {
      router.push('/lesson');
    }
  };

  const totalLessons = course.sessions.reduce((acc, session) => acc + session.lessons.length, 0);

  const readinessScoreValue = course.readiness_score;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-headline break-words">{course.course_title}</CardTitle>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{course.total_estimated_time || 'N/A'}</span>
            </div>
             <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 shrink-0" />
                <span>{totalLessons} lessons</span>
            </div>
          </div>
          <CardDescription className="text-sm sm:text-base leading-relaxed">
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
          
          <Card className="bg-muted/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'><Sparkles className="text-primary w-5 h-5 sm:w-6 sm:h-6 shrink-0"/> Analysis Report</CardTitle>
              <CardDescription className="text-sm">The AI has analyzed your document. Here's what it found.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-base sm:text-lg">Readiness Score</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary">{readinessScoreValue}%</span>
                </div>
                <Progress value={readinessScoreValue} className="h-2.5 sm:h-3"/>
              </div>

              {course.checklist && course.checklist.length > 0 && (
                <Alert className="text-sm">
                  <HelpCircle className="h-4 w-4 shrink-0" />
                  <AlertTitle className="text-sm sm:text-base">Improvement Recommendations</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 sm:pl-5 space-y-1 mt-2 text-sm leading-relaxed">
                      {course.checklist.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>


          <div className="space-y-2">
            <h3 className="font-bold text-lg sm:text-xl">Suggested Course Structure</h3>
            <Accordion type="single" collapsible className="w-full border rounded-md px-3 sm:px-4" defaultValue="session-0">
              {course.sessions.map((session, sIndex) => (
                <AccordionItem value={`session-${sIndex}`} key={session.id} className={sIndex === course.sessions.length - 1 ? 'border-b-0' : ''}>
                  <AccordionTrigger className="text-base sm:text-lg font-semibold hover:no-underline touch-target">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-left">
                      <span className="text-primary text-sm sm:text-base">{`Module ${sIndex + 1}`}</span>
                      <span className="break-words">{session.session_title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 sm:space-y-3 pl-4 sm:pl-6 border-l-2 ml-2">
                      {session.lessons.map((lesson) => (
                        <li key={lesson.id} className="text-muted-foreground pl-2 text-sm sm:text-base">
                          <p className="font-medium text-foreground leading-snug">{lesson.lesson_title}</p>
                          {lesson.key_points && lesson.key_points.length > 0 &&
                            <ul className='text-xs sm:text-sm italic mt-1 list-disc pl-3 sm:pl-4 leading-relaxed'>
                              {lesson.key_points.map((point, pIndex) => <li key={pIndex}>"{point}"</li>)}
                            </ul>
                          }
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-4 bg-muted/50 p-4 sm:p-6 rounded-b-lg">
            <div className="flex-1">
                <h4 className="font-bold mb-3 text-sm sm:text-base">Choose your study session length:</h4>
                <RadioGroup defaultValue="30" onValueChange={setSessionDuration} className="flex flex-wrap gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2 touch-target">
                        <RadioGroupItem value="30" id="r1" />
                        <Label htmlFor="r1" className="text-sm sm:text-base cursor-pointer">30 min</Label>
                    </div>
                    <div className="flex items-center space-x-2 touch-target">
                        <RadioGroupItem value="45" id="r2" />
                        <Label htmlFor="r2" className="text-sm sm:text-base cursor-pointer">45 min</Label>
                    </div>
                    <div className="flex items-center space-x-2 touch-target">
                        <RadioGroupItem value="60" id="r3" />
                        <Label htmlFor="r3" className="text-sm sm:text-base cursor-pointer">60 min</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
                 <Button variant="outline" onClick={onClear} className="touch-target text-base w-full sm:w-auto">Start Over</Button>
                 <Button onClick={handleStartLearning} className="text-base sm:text-lg touch-target w-full sm:flex-1">Start Learning</Button>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
