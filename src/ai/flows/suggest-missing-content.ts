"use server";

/**
 * @fileOverview This file defines a Genkit flow to suggest missing content in a course structure.
 *
 * It takes course content as input and identifies missing elements like titles, steps, estimates, or resources.
 * The flow returns a checklist with prompts for the user to fill in the gaps.
 *
 * @fileExport suggestMissingContent - A function that suggests missing content in a course.
 * @fileExport SuggestMissingContentInput - The input type for the suggestMissingContent function.
 * @fileExport SuggestMissingContentOutput - The return type for the suggestMissingContent function.
 */

import { aiGenerateStream } from "@/lib/ai-provider";

export type SuggestMissingContentInput = {
  courseContent: string;
};

export type SuggestMissingContentOutput = {
  missingItemsChecklist: string[];
};

export async function suggestMissingContent(
  input: SuggestMissingContentInput
): Promise<SuggestMissingContentOutput> {
  const system =
    "You are an AI assistant designed to identify missing elements in course content and provide a checklist with prompts to the user to fill in the gaps.";
  const prompt = `Analyze the following course content and identify any missing elements such as session titles, lesson steps, time estimates for each step, external resources (videos, links), and quiz questions per session.\n\nReturn a checklist of missing items with friendly prompts for the user to fill in the gaps. Be specific about what is missing and suggest how the user can add the information. Return your answer as a simple array of strings.\n\nCourse Content:\n${input.courseContent}`;
  let out = "";
  for await (const chunk of aiGenerateStream(prompt, { system })) {
    out += chunk;
  }
  // Try to extract the first array from the response
  const match = out.match(/\[[\s\S]*?\]/);
  if (!match)
    throw new Error("DeepSeek did not return a valid checklist array.");
  return { missingItemsChecklist: JSON.parse(match[0]) };
}
