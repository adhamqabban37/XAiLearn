import { NextResponse } from "next/server";
import { generateQuizQuestions } from "@/ai/flows/generate-quiz-questions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { textContent } = body || {};
    if (!textContent || typeof textContent !== "string") {
      return NextResponse.json(
        { error: "Missing required field: textContent" },
        { status: 400 }
      );
    }
    const result = await generateQuizQuestions({ textContent });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to generate quiz questions" },
      { status: 500 }
    );
  }
}
