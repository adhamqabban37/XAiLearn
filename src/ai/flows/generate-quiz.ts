"use server";

import { aiGenerateStream } from "@/lib/ai-provider";
import { quizPromptTemplate } from "@/lib/quiz-prompt-template";

export type GenerateQuizInput = {
    textContent: string;
};

export type GenerateQuizOutput = any;

export async function generateQuiz(
    input: GenerateQuizInput
): Promise<GenerateQuizOutput> {
    console.log("📚 Starting quiz generation...");
    const system =
        "You are an expert AI quiz generator. Output ONLY valid JSON, no markdown or explanation.";

    // Truncate very long content to avoid timeouts
    const maxContentLength = 12000;
    const truncatedContent =
        input.textContent.length > maxContentLength
            ? input.textContent.substring(0, maxContentLength) +
            "...[content truncated]"
            : input.textContent;

    const prompt = quizPromptTemplate.replace(
        "[TEXT_TO_ANALYZE_WILL_BE_INSERTED_HERE]",
        truncatedContent
    );

    console.log("🤖 Streaming response for quiz...");
    let out = "";
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

    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error("AI did not return a valid JSON object.");
    }

    try {
        const parsed = JSON.parse(match[0]);
        return parsed;
    } catch (e) {
        console.error("JSON parse error:", e);
        throw new Error("AI returned malformed JSON.");
    }
}
