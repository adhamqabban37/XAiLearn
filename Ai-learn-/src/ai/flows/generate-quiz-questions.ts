"use server";

/**
 * @fileOverview This file defines a Genkit flow to generate quiz questions from text content.
 *
 * The flow takes text content as input and generates a set of quiz questions with answers and explanations.
 *
 * @file GenerateQuizQuestionsInput - The input type for the generateQuizQuestions function.
 * @file GenerateQuizQuestionsOutput - The return type for the generateQuizQuestions function.
 * @file generateQuizQuestions - a function that handles the quiz questions generation process.
 */

import { aiGenerateStream } from "@/lib/ai-provider";
import { z } from "zod";

const GenerateQuizQuestionsInputSchema = z.object({
  textContent: z
    .string()
    .describe("The text content to generate quiz questions from."),
});

export type GenerateQuizQuestionsInput = z.infer<
  typeof GenerateQuizQuestionsInputSchema
>;

const GenerateQuizQuestionsOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe("The quiz question."),
        type: z
          .literal("MCQ")
          .describe("The type of quiz question - always MCQ."),
        options: z
          .array(z.string())
          .describe("Array of 4 answer choices (3 distractors + 1 correct)."),
        answer: z.string().describe("The correct answer to the question."),
        explanation: z.string().describe("Explanation of the answer."),
      })
    )
    .describe("The generated multiple-choice quiz questions."),
});

export type GenerateQuizQuestionsOutput = z.infer<
  typeof GenerateQuizQuestionsOutputSchema
>;

// Prompt template
const QUIZ_PROMPT = `You are an expert educator creating multiple-choice quizzes to test understanding of course content.

Based on the following text content, generate 3-5 multiple-choice quiz questions. Each question MUST have:
- One correct answer
- 3 plausible distractors (incorrect but reasonable options)
- A brief explanation of why the correct answer is right
- All options should be clearly related to the lesson content

Text Content: {{{textContent}}}

Format the questions as a JSON array with this EXACT structure:
[
  {
    "question": "The quiz question.",
    "type": "MCQ",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B",
    "explanation": "Brief explanation of why this is correct."
  }
]

Make sure the "answer" field exactly matches one of the items in the "options" array.`;

export async function generateQuizQuestions(
  input: GenerateQuizQuestionsInput
): Promise<GenerateQuizQuestionsOutput> {
  // Fill in the prompt
  const prompt = QUIZ_PROMPT.replace("{{{textContent}}}", input.textContent);
  let fullResponse = "";
  for await (const chunk of aiGenerateStream(prompt)) {
    fullResponse += chunk;
  }
  // Extract the first JSON array from the response
  const match = fullResponse.match(/\[[\s\S]*?\]/);
  if (!match)
    throw new Error(
      "AI provider did not return a valid JSON array of questions."
    );
  const questions = JSON.parse(match[0]);
  return { questions };
}
