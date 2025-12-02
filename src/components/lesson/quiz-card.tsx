"use client";

import { useState, useEffect } from "react";
import type { QuizQuestion } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Play, Settings2 } from "lucide-react";
import { QuestionMarkIcon } from "../ui/icons";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface QuizCardProps {
  questions: QuizQuestion[];
  onQuizComplete?: () => void;
}

type AnswerState = "unanswered" | "correct" | "incorrect";

export function QuizCard({ questions: allQuestions, onQuizComplete }: QuizCardProps) {
  // Start Screen State
  const [hasStarted, setHasStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState<string>("all");
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);

  // Quiz State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Initialize active questions when starting
  const handleStartQuiz = () => {
    let count = allQuestions.length;
    if (questionCount !== "all") {
      count = Math.min(parseInt(questionCount), allQuestions.length);
    }

    // Shuffle and slice
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    setActiveQuestions(selected);
    setHasStarted(true);

    // Reset quiz state just in case
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    setCorrectAnswers(0);
    setIsCompleted(false);
    setHasScrolled(false);
  };

  // Trigger callback when quiz completes - run only once
  useEffect(() => {
    if (isCompleted && !hasScrolled) {
      // Calculate pass threshold (70%)
      const passThreshold = 0.7;
      const passed = correctAnswers / activeQuestions.length >= passThreshold;

      // Auto-mark lesson complete if passed
      if (passed && onQuizComplete) {
        onQuizComplete();
      }

      setHasScrolled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted, correctAnswers, activeQuestions.length]);

  if (!hasStarted) {
    return (
      <Card className="bg-card shadow-sm border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
            <Settings2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Quiz Setup</CardTitle>
          <CardDescription>
            This quiz has {allQuestions.length} questions available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium text-center block">
              How many questions would you like to take?
            </Label>
            <RadioGroup
              defaultValue="all"
              onValueChange={setQuestionCount}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {[5, 10, 20].map((count) => (
                allQuestions.length >= count && (
                  <div key={count}>
                    <RadioGroupItem
                      value={count.toString()}
                      id={`count-${count}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`count-${count}`}
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                    >
                      <span className="text-xl font-bold">{count}</span>
                      <span className="text-xs text-muted-foreground">Questions</span>
                    </Label>
                  </div>
                )
              ))}
              <div>
                <RadioGroupItem value="all" id="count-all" className="peer sr-only" />
                <Label
                  htmlFor="count-all"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center h-full"
                >
                  <span className="text-xl font-bold">All</span>
                  <span className="text-xs text-muted-foreground">({allQuestions.length})</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartQuiz} className="w-full text-lg py-6 btn-gradient">
            <Play className="w-5 h-5 mr-2 fill-current" /> Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isCompleted) {
    const passThreshold = 0.7;
    const passed = correctAnswers / activeQuestions.length >= passThreshold;
    const percentage = Math.round((correctAnswers / activeQuestions.length) * 100);

    return (
      <Card
        className={`${passed ? "bg-secondary/60 border-secondary" : "bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800"} shadow-sm quiz-complete`}
      >
        <CardHeader className="space-y-2 sm:space-y-3">
          <div className="mx-auto text-secondary-foreground/80">
            {passed ? (
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 dark:text-orange-400" />
            )}
          </div>
          <CardTitle className="text-lg sm:text-xl text-center">
            {passed ? "Quiz Complete! 🎉" : "Review and Try Again"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-center">
            You answered {correctAnswers} out of {activeQuestions.length} questions
            correctly ({percentage}%).
            {passed
              ? " Lesson complete! ✨"
              : ` You need ${Math.ceil(activeQuestions.length * passThreshold)} correct to pass.`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2 sm:pt-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setHasStarted(false)}
            className="touch-target"
          >
            Change Settings
          </Button>
          {passed ? (
            <p className="text-sm text-muted-foreground flex items-center">
              ✅ Lesson marked complete
            </p>
          ) : (
            <Button
              onClick={() => {
                // Restart with same settings
                handleStartQuiz();
              }}
              className="touch-target"
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  const currentQuestion = activeQuestions[currentQuestionIndex];

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;

    if (
      selectedAnswer.trim().toLowerCase() ===
      currentQuestion.answer.trim().toLowerCase()
    ) {
      setAnswerState("correct");
      setCorrectAnswers((prev) => prev + 1);
    } else {
      setAnswerState("incorrect");
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleSkip = () => {
    // Allow skipping without answering
    console.log(`⏭️ Skipped question ${currentQuestionIndex + 1}`);
    setSelectedAnswer(null);
    setAnswerState("unanswered");
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-6">
        <div className="text-primary shrink-0">
          <QuestionMarkIcon className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base sm:text-lg">
            Check your understanding
          </CardTitle>
          <CardDescription className="text-sm">
            Question {currentQuestionIndex + 1} of {activeQuestions.length}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
        <p className="font-semibold text-sm sm:text-base leading-relaxed">
          {currentQuestion.question}
        </p>

        {/* Multiple Choice Options */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-md border cursor-pointer transition-colors touch-target ${selectedAnswer === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                  } ${answerState !== "unanswered"
                    ? "cursor-not-allowed opacity-70"
                    : ""
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={answerState !== "unanswered"}
                  className="accent-primary w-5 h-5 shrink-0"
                />
                <span className="flex-1 text-sm sm:text-base leading-relaxed">
                  {option}
                </span>
              </label>
            ))}
          </div>
        ) : (
          // Fallback for old format questions without options
          <input
            type="text"
            value={selectedAnswer || ""}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            placeholder="Type your answer here"
            className="flex h-11 md:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={answerState !== "unanswered"}
          />
        )}

        {answerState === "correct" && (
          <Alert
            variant="default"
            className="bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-800"
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300 text-sm sm:text-base">
              Correct!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
        {answerState === "incorrect" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle className="text-sm sm:text-base">
              Not quite...
            </AlertTitle>
            <AlertDescription className="text-sm">
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="p-4 sm:p-6 pt-2 sm:pt-4">
        {answerState === "unanswered" ? (
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
              className="touch-target text-base flex-1"
            >
              Check Answer
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="touch-target text-base flex-1"
            >
              Skip Question
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNext}
            className="touch-target text-base w-full sm:w-auto"
          >
            {currentQuestionIndex < activeQuestions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
