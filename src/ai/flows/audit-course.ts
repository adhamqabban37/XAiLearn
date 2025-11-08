"use server";

/**
 * @fileOverview This file defines a Genkit flow to audit and evaluate a course structure.
 *
 * It takes course content as input (JSON, PDF, or text) and returns a structured report
 * highlighting what works, what's missing, and what can be improved.
 *
 * @fileExport auditCourse - A function that audits the course content.
 * @fileExport AuditCourseInput - The input type for the auditCourse function.
 * @fileExport AuditCourseOutput - The return type for the auditCourse function.
 */

import { aiGenerateStream } from "@/lib/ai-provider";

export type AuditCourseInput = {
  courseContent: string;
};

export type AuditCourseOutput = {
  summary: any;
  recommendations: string[];
};

export async function auditCourse(
  input: AuditCourseInput
): Promise<AuditCourseOutput> {
  const system =
    "You are an expert AI instructional designer, course evaluator, and AI content auditor.";
  const prompt = `Analyze the following course content and return a detailed JSON report highlighting what is working (✅), what is missing (❌), and suggestions for improvement.\n\nCourse Content:\n${input.courseContent}`;
  let out = "";
  for await (const chunk of aiGenerateStream(prompt, { system })) {
    out += chunk;
  }
  // Try to extract the first JSON object from the response
  const match = out.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("DeepSeek did not return a valid JSON object.");
  return JSON.parse(match[0]);
}
