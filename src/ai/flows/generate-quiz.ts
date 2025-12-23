"use server";

import { aiGenerateStream } from "@/lib/ai-provider";
import {
  quizPromptTemplate,
  quizChunkPrompt,
} from "@/lib/quiz-prompt-template";

export type GenerateQuizInput = {
  textContent: string;
};

export type GenerateQuizOutput = any;

const CHUNK_SIZE = 20000; // Process ~20k characters per chunk to stay within output limits

async function processChunk(
  text: string,
  chunkIndex: number,
  totalChunks: number
): Promise<any[]> {
  console.log(
    `📚 Processing chunk ${chunkIndex + 1}/${totalChunks} (${text.length} chars)...`
  );
  console.log(`📝 First 200 chars of chunk: ${text.slice(0, 200)}...`);

  const system =
    "You are an expert AI quiz generator. Output ONLY valid JSON, no markdown or explanation.";
  // Use the chunk-specific prompt
  const prompt = quizChunkPrompt.replace(
    "[TEXT_TO_ANALYZE_WILL_BE_INSERTED_HERE]",
    text
  );

  let out = "";
  try {
    for await (const chunk of aiGenerateStream(prompt, {
      system,
      timeout: 300_000,
    })) {
      out += chunk;
    }

    console.log(
      `🔍 Raw AI output for chunk ${chunkIndex + 1}: ${out.slice(0, 300)}...`
    );

    // Extract JSON
    let jsonStr = out.trim();
    if (jsonStr.includes("```json")) {
      const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
      jsonStr = match ? match[1] : jsonStr;
    } else if (jsonStr.includes("```")) {
      const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
      jsonStr = match ? match[1] : jsonStr;
    }

    // Find the JSON object
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn(`⚠️ Chunk ${chunkIndex + 1} returned no valid JSON object.`);
      console.warn(`Raw output: ${out}`);
      return [];
    }

    const parsed = JSON.parse(match[0]);
    // Extract questions from the simplified schema
    const questions = parsed?.questions || [];
    console.log(
      `✅ Chunk ${chunkIndex + 1} extracted ${questions.length} questions.`
    );
    if (questions.length > 0) {
      console.log(`📋 Sample question:`, questions[0]);
    }
    return questions;
  } catch (e) {
    console.error(`❌ Error processing chunk ${chunkIndex + 1}:`, e);
    console.error(`Output was: ${out.slice(0, 500)}`);
    return [];
  }
}

export async function generateQuiz(
  input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
  console.log("📚 [Quiz] Starting generation...");

  const text = input.textContent || "";

  // 1. Validate Input
  if (text.length < 100) {
    throw new Error("Input text is too short to generate a quiz.");
  }

  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  console.log(`🔹 [Quiz] Split into ${chunks.length} chunks.`);

  // 2. Process Chunks (Parallel)
  const results = await Promise.all(
    chunks.map((chunk, index) => processChunk(chunk, index, chunks.length))
  );

  // 3. Merge & Validate
  const allQuestions = results.flat();
  console.log(`🎉 [Quiz] Total questions generated: ${allQuestions.length}`);

  if (allQuestions.length === 0) {
    console.warn(
      "⚠️ [Quiz] No questions generated. Returning empty set instead of crashing."
    );
    // Return a valid empty structure so the UI can handle it gracefully
    return {
      course_title: "Generated Quiz (Empty)",
      modules: [],
    };
  }

  // 4. Group questions by session
  const sessionMap = new Map<string, any[]>();

  allQuestions.forEach((q) => {
    const sessionName = q.session || "General Questions";
    if (!sessionMap.has(sessionName)) {
      sessionMap.set(sessionName, []);
    }
    sessionMap.get(sessionName)!.push(q);
  });

  console.log(
    `📊 [Quiz] Grouped into ${sessionMap.size} sessions:`,
    Array.from(sessionMap.keys())
  );

  // 5. Build modules structure with sessions
  const modules = Array.from(sessionMap.entries()).map(
    ([sessionTitle, questions]) => ({
      module_title: sessionTitle,
      lessons: [
        {
          lesson_title: sessionTitle,
          key_points: [`${questions.length} questions covering key concepts`],
          time_estimate_minutes: Math.ceil(questions.length * 1.5),
          quiz: questions.map((q) => ({
            question: q.question,
            type: q.type || "MCQ",
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          })),
        },
      ],
    })
  );

  // 6. Return Success with sessions structure
  return {
    course_title: "Generated Quiz",
    modules,
  };
}
