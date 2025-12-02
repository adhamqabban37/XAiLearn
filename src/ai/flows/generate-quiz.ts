"use server";

import { aiGenerateStream } from "@/lib/ai-provider";
import { quizPromptTemplate } from "@/lib/quiz-prompt-template";

export type GenerateQuizInput = {
    textContent: string;
};

export type GenerateQuizOutput = any;

const CHUNK_SIZE = 20000; // Process ~20k characters per chunk to stay within output limits

async function processChunk(text: string, chunkIndex: number, totalChunks: number): Promise<any[]> {
    console.log(`📚 Processing chunk ${chunkIndex + 1}/${totalChunks} (${text.length} chars)...`);

    const system = "You are an expert AI quiz generator. Output ONLY valid JSON, no markdown or explanation.";
    const prompt = quizPromptTemplate.replace(
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
            console.warn(`Chunk ${chunkIndex + 1} returned no valid JSON object.`);
            return [];
        }

        const parsed = JSON.parse(match[0]);
        // Extract questions from the specific schema path
        const questions = parsed?.modules?.[0]?.lessons?.[0]?.quiz || [];
        console.log(`✅ Chunk ${chunkIndex + 1} extracted ${questions.length} questions.`);
        return questions;

    } catch (e) {
        console.error(`Error processing chunk ${chunkIndex + 1}:`, e);
        return [];
    }
}

export async function generateQuiz(
    input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
    console.log("📚 Starting quiz generation with chunking strategy...");

    const text = input.textContent;
    const chunks: string[] = [];

    // Split text into chunks
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.slice(i, i + CHUNK_SIZE));
    }

    console.log(`Splitting content into ${chunks.length} chunks.`);

    // Process chunks in parallel
    const results = await Promise.all(
        chunks.map((chunk, index) => processChunk(chunk, index, chunks.length))
    );

    // Merge all questions
    const allQuestions = results.flat();
    console.log(`🎉 Total questions extracted: ${allQuestions.length}`);

    if (allQuestions.length === 0) {
        throw new Error("Could not extract any questions from the provided text.");
    }

    // Construct the final response object matching the expected schema
    return {
        course_title: "Extracted Quiz",
        modules: [
            {
                module_title: "Quiz Session",
                lessons: [
                    {
                        lesson_title: "Full Question Bank",
                        key_points: ["Extracted from uploaded documents"],
                        time_estimate_minutes: Math.ceil(allQuestions.length * 1.5), // Approx 1.5 min per question
                        quiz: allQuestions
                    }
                ]
            }
        ]
    };
}
