"use server";

/**
 * @fileOverview A Genkit flow to analyze a document and check its readiness for course creation.
 *
 * - analyzeDocument - A function that handles the document analysis.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import { aiGenerateStream } from "@/lib/ai-provider";

export type AnalyzeDocumentInput = {
  textContent: string;
  duration?: string;
  pdfVideos?: Array<{ id: string; title: string; watchUrl: string; embedUrl?: string }>;
};

export type AnalyzeDocumentOutput = any;

export async function analyzeDocument(
  input: AnalyzeDocumentInput
): Promise<AnalyzeDocumentOutput> {
  console.log("📚 Starting course generation with DeepSeek...");
  const system =
    "You are an expert AI instructional designer. Output ONLY valid JSON, no markdown or explanation.";

  // Truncate very long content to avoid timeouts
  const maxContentLength = 8000;
  const truncatedContent =
    input.textContent.length > maxContentLength
      ? input.textContent.substring(0, maxContentLength) +
        "...[content truncated]"
      : input.textContent;

  console.log(`📝 Content length: ${truncatedContent.length} chars`);
  console.log(`📝 First 200 chars of content:`, truncatedContent.substring(0, 200));
  console.log(`🎥 PDF Videos found:`, input.pdfVideos?.length || 0);

  // Build video context for AI prompt
  let videoContext = "";
  if (input.pdfVideos && input.pdfVideos.length > 0) {
    videoContext = `\n\nCRITICAL: The following YouTube videos were EXTRACTED FROM THE PDF. You MUST include these videos in your course structure:\n\n`;
    input.pdfVideos.forEach((video, idx) => {
      videoContext += `${idx + 1}. "${video.title || 'Untitled Video'}" - ${video.watchUrl}\n`;
    });
    videoContext += `\nREQUIREMENTS:\n`;
    videoContext += `- You MUST distribute these ${input.pdfVideos.length} video(s) across the lessons in your course\n`;
    videoContext += `- Match each video to the most relevant lesson based on the video title and content\n`;
    videoContext += `- Include ALL videos from the PDF - do not skip any\n`;
    videoContext += `- Use the exact URLs provided above\n`;
    videoContext += `- If you need additional videos beyond what's in the PDF, you can add them, but prioritize the PDF videos first\n\n`;
  }

  const prompt = `You are an expert AI instructional designer creating a structured educational course.

TASK: Analyze the provided text and create a comprehensive course in JSON format.

STRUCTURE REQUIREMENTS:
- 2-3 modules, each with 2-3 lessons
- Each lesson must include:
  • lesson_title (string)
  • summary (string, 2-3 sentences describing what this lesson covers)
  • key_points (array of 3-5 strings)
  • time_estimate_minutes (number, 10-30)
  • quiz (array of 2-3 multiple-choice questions)
  • videoSearchQuery (optional string - see VIDEO POLICY below)

QUIZ FORMAT:
Each quiz question must have:
- question: (string) Clear, specific question text that tests understanding, not just recall.
- type: "MCQ"
- options: (array of 4 strings) Four plausible options (1 correct, 3 distinct distractors).
- answer: (string) Exact match to one of the options.
- explanation: (string) Brief explanation of why the answer is correct.

VIDEO POLICY - CRITICAL INSTRUCTIONS:
${input.pdfVideos && input.pdfVideos.length > 0 
  ? `✅ The user provided ${input.pdfVideos.length} video(s) from their PDF:
${input.pdfVideos.map((v, i) => `   ${i+1}. "${v.title || 'Video'}"`).join('\n')}

VIDEO REQUIREMENTS (READ CAREFULLY):
- For EACH lesson, you MUST include a "videoSearchQuery" field
- This field is REQUIRED and must contain 2-5 word search terms ONLY (plain text)
- NEVER output any http:// or https:// URLs in your JSON
- NEVER output YouTube video IDs or any URL-like patterns
- NEVER include the word "youtube" or ".com" in the videoSearchQuery
- Our system will automatically match the PDF videos to lessons based on semantic similarity
- If additional videos would help, provide search queries for those lessons too

VALID videoSearchQuery examples:
  ✅ "python functions tutorial"
  ✅ "machine learning basics"
  ✅ "data structures algorithms"
  ❌ "https://youtube.com/watch?v=abc123" (NEVER do this)
  ❌ "dQw4w9WgXcQ" (NEVER output video IDs)

Example lesson structure:
{
  "lesson_title": "Introduction to Machine Learning",
  "summary": "Learn the fundamentals of machine learning and its applications.",
  "videoSearchQuery": "machine learning basics tutorial"
}
`
  : `ℹ️ No videos were found in the PDF.

VIDEO REQUIREMENTS (READ CAREFULLY):
- For EACH lesson where video would help learning, you MUST include a "videoSearchQuery" field
- This field is REQUIRED and must contain 2-5 word search terms ONLY (plain text)
- NEVER output any http:// or https:// URLs anywhere in your JSON
- NEVER generate YouTube video IDs (like "dQw4w9WgXcQ" or any 11-character strings)
- NEVER include the word "youtube" or ".com" in the videoSearchQuery
- Our system will search YouTube and find appropriate educational videos
- Use simple, specific search terms that describe the lesson topic

VALID videoSearchQuery examples:
  ✅ "python variables tutorial"
  ✅ "react hooks explained"
  ✅ "SQL joins beginner"
  ❌ "https://youtube.com/watch?v=xyz" (NEVER do this)
  ❌ "watch?v=abc123" (NEVER do this)

Example lesson structure:
{
  "lesson_title": "Variables and Data Types",
  "summary": "Understanding how to declare and use variables in Python.",
  "videoSearchQuery": "python variables data types beginners"
}
`}

CRITICAL JSON RULES:
1. Output ONLY valid JSON - no markdown code blocks (no \`\`\`), no explanations
2. Your response must start with { and end with }
3. Always include at least 1 module with at least 1 lesson
4. NEVER generate fake YouTube URLs (like "dQw4w9WgXcQ" or placeholders)
5. Use "videoSearchQuery" for video discovery, NOT "url" fields
6. All text fields must use proper escaping for quotes and special characters

REQUIRED JSON STRUCTURE:
{
  "course_title": "Descriptive Course Title Based on Content",
  "modules": [
    {
      "module_title": "Module 1: Foundation Concepts",
      "lessons": [
        {
          "lesson_title": "Specific Lesson Topic",
          "summary": "Brief 2-3 sentence overview of what this lesson covers and what students will learn.",
          "key_points": [
            "First key concept or learning objective",
            "Second key concept or learning objective",
            "Third key concept or learning objective",
            "Fourth key concept (optional)",
            "Fifth key concept (optional)"
          ],
          "time_estimate_minutes": 15,
          "videoSearchQuery": "optional search query like 'topic tutorial beginner'",
          "quiz": [
            {
              "question": "What is the main purpose of this concept?",
              "type": "MCQ",
              "options": [
                "Option A - plausible but incorrect",
                "Option B - correct answer",
                "Option C - plausible but incorrect",
                "Option D - plausible but incorrect"
              ],
              "answer": "Option B - correct answer",
              "explanation": "Brief explanation of why Option B is the correct answer."
            }
          ],
          "resources": {
            "articles": [
              {
                "title": "Real Article Title from Reputable Source",
                "url": "https://en.wikipedia.org/wiki/Relevant_Topic"
              }
            ],
            "pdfs_docs": []
          }
        }
      ]
    }
  ]
}

ARTICLE/DOCUMENTATION URLs:
Only provide REAL URLs from reputable sources:
• Wikipedia: https://en.wikipedia.org/wiki/Topic_Name
• MDN Web Docs (for web development): https://developer.mozilla.org/en-US/docs/...
• Official documentation (Python.org, React.dev, etc.)
• DO NOT generate fake URLs - only include articles if you know they exist
• If unsure, leave the articles array empty

FALLBACK BEHAVIOR:
If the text is too short or unclear:
- Still create at least 1 module with 1 lesson
- Base the content on the general topic you can infer
- Keep it simple but valid

TEXT TO ANALYZE:
${truncatedContent}

Remember: Output ONLY the JSON object. Start your response with { and end with }. No markdown, no explanations.
`;

  console.log("🤖 Streaming response from DeepSeek...");
  let out = "";
  let chunkCount = 0;
  for await (const chunk of aiGenerateStream(prompt, {
    system,
    timeout: 300_000,
  })) {
    out += chunk;
    chunkCount++;
    if (chunkCount % 50 === 0) {
      console.log(
        `📦 Received ${chunkCount} chunks, ${out.length} chars so far...`
      );
    }
  }
  console.log(
    `✅ DeepSeek completed. Total: ${out.length} chars in ${chunkCount} chunks`
  );

  // Log raw response for debugging
  console.log("🔍 Raw AI response (first 500 chars):", out.substring(0, 500));

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = out.trim();
  if (jsonStr.includes("```json")) {
    const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  } else if (jsonStr.includes("```")) {
    const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  }

  // Find the first complete JSON object
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("❌ No valid JSON found in AI response");
    console.error("Full response:", out);
    throw new Error("AI did not return a valid JSON object. Please try again.");
  }

  console.log("📦 Extracted JSON (first 300 chars):", match[0].substring(0, 300));

  let parsed;
  try {
    parsed = JSON.parse(match[0]);
  } catch (parseError: any) {
    console.error("❌ JSON parse error:", parseError.message);
    console.error("Attempted to parse:", match[0].substring(0, 500));
    throw new Error("AI returned malformed JSON. Please try again.");
  }

  // Validate structure
  if (!parsed.modules || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
    console.error("❌ AI returned empty or invalid modules:", parsed);
    console.warn("⚠️ AI course generation failed; using fallback minimal course for this document.");
    console.log("🔧 Creating fallback minimal course structure...");
    
    // Create a minimal fallback course based on the content
    const fallbackTitle = parsed.course_title || "Introduction to " + truncatedContent.substring(0, 50).trim();
    return {
      course_title: fallbackTitle,
      modules: [{
        module_title: "Getting Started",
        lessons: [{
          lesson_title: "Introduction",
          key_points: [
            "Overview of the topic",
            "Key concepts to understand",
            "Learning objectives"
          ],
          time_estimate_minutes: 15,
          quiz: [{
            question: "What is the main topic of this course?",
            type: "MCQ",
            options: [
              fallbackTitle,
              "Unrelated topic A",
              "Unrelated topic B",
              "None of the above"
            ],
            answer: fallbackTitle,
            explanation: "This course focuses on " + fallbackTitle
          }],
          resources: {
            youtube: [],
            articles: [],
            pdfs_docs: []
          }
        }]
      }]
    };
  }

  console.log("✅ Successfully parsed course with", parsed.modules.length, "modules");
  return parsed;
}
