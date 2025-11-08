
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lesson } from "@/lib/types";
import { LightbulbIcon } from "../ui/icons";
import { Clock } from "lucide-react";

interface ConceptCardProps {
    lesson: Lesson;
}

export function ConceptCard({ lesson }: ConceptCardProps) {
    return (
        <Card className="bg-background shadow-sm">
            <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-6">
                <div className="text-accent shrink-0">
                    <LightbulbIcon className="w-7 h-7 sm:w-8 sm:h-8"/>
                </div>
                <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg leading-snug">{lesson.lesson_title}</CardTitle>
                    {lesson.timeEstimateMinutes && (
                        <CardDescription className="flex items-center gap-1.5 pt-1 text-sm">
                            <Clock className="w-4 h-4 shrink-0"/>
                            Estimated time: {lesson.timeEstimateMinutes} minutes
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed">
                    <p>{lesson.content_summary || "No content available for this step."}</p>
                     {lesson.key_points && lesson.key_points.length > 0 &&
                        <ul className='text-sm sm:text-base mt-3 sm:mt-4 space-y-1.5 sm:space-y-2'>
                          {lesson.key_points.map((point, pIndex) => <li key={pIndex} className="leading-relaxed">{point}</li>)}
                        </ul>
                      }
                </div>
            </CardContent>
        </Card>
    )
}
