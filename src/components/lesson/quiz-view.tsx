"use client";

import { useState } from "react";
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
import { CheckCircle, XCircle } from "lucide-react";

interface QuizViewProps {
  questions: QuizQuestion[];
  onQuizComplete: () => void;
}

type AnswerState = "unanswered" | "correct" | "incorrect";

export function QuizView({ questions, onQuizComplete }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];

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
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      onQuizComplete();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quiz Time!</CardTitle>
        <CardDescription>
          Question {currentQuestionIndex + 1} of {questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="font-semibold text-lg">{currentQuestion.question}</p>

        {/* Multiple Choice Options */}
        {currentQuestion.options && currentQuestion.options.length > 0 ? (
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedAnswer === option
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                } ${
                  answerState !== "unanswered"
                    ? "cursor-not-allowed opacity-70"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name={`quiz-question-${currentQuestionIndex}`}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                  disabled={answerState !== "unanswered"}
                  className="accent-primary"
                />
                <span className="flex-1">{option}</span>
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={answerState !== "unanswered"}
          />
        )}

        {answerState === "correct" && (
          <Alert
            variant="default"
            className="bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-800"
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">
              Correct!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
        {answerState === "incorrect" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Not quite...</AlertTitle>
            <AlertDescription>
              The correct answer is: <strong>{currentQuestion.answer}</strong>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {answerState === "unanswered" ? (
          <Button onClick={handleCheckAnswer} disabled={!selectedAnswer}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentQuestionIndex < questions.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
