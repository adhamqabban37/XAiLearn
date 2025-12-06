/**
 * @fileOverview PDF Structure Detection and Semantic Analysis
 *
 * This module implements Stage 1 of the adaptive learning pipeline:
 * Deep PDF Understanding → Structure Detection → Content Segmentation → Semantic Analysis
 */

"use server";

import { aiGenerateStream } from "@/lib/ai-provider";
import type {
  PDFStructure,
  PDFMetadata,
  TableOfContentsEntry,
  ContentChunk,
  GlobalContext,
  TopicNode,
  DocumentType,
} from "@/lib/adaptive-types";

/**
 * Main entry point: Analyze PDF and extract deep structure
 */
export async function analyzePDFStructure(
  rawText: string,
  metadata: { pageCount: number; filename: string }
): Promise<PDFStructure> {
  console.log("🔍 Stage 1: Deep PDF Analysis Started");
  console.log(
    `📄 Pages: ${metadata.pageCount}, Length: ${rawText.length} chars`
  );

  // Step 1: Detect document structure and metadata
  const detectedMetadata = await detectMetadata(rawText, metadata);

  // Step 2: Extract table of contents
  const toc = await extractTableOfContents(rawText);

  // Step 3: Segment content into meaningful chunks
  const chunks = await segmentContent(rawText, toc);

  // Step 4: Analyze each chunk semantically (parallel)
  const analyzedChunks = await analyzeChunksInParallel(chunks);

  // Step 5: Build global knowledge graph
  const globalContext = await buildKnowledgeGraph(
    analyzedChunks,
    detectedMetadata
  );

  console.log(
    `✅ PDF Analysis Complete: ${analyzedChunks.length} chunks, ${globalContext.mainTopics.length} topics`
  );

  return {
    metadata: detectedMetadata,
    tableOfContents: toc,
    contentChunks: analyzedChunks,
    globalContext,
    extractionQuality: {
      structureDetectionConfidence: toc.length > 0 ? 0.9 : 0.5,
      tocAvailable: toc.length > 0,
      diagramsDetected: analyzedChunks.reduce(
        (sum, c) => sum + c.semantics.diagrams.length,
        0
      ),
      codeBlocksDetected: analyzedChunks.reduce(
        (sum, c) => sum + c.semantics.codeExamples.length,
        0
      ),
    },
  };
}

/**
 * Detect document metadata and type
 */
async function detectMetadata(
  text: string,
  fileMetadata: { pageCount: number; filename: string }
): Promise<PDFMetadata> {
  const sample = text.substring(0, 3000); // First 3000 chars

  const prompt = `Analyze this document excerpt and extract metadata.

DOCUMENT EXCERPT:
${sample}

TASK: Output a JSON object with:
- title: string (the document title, extracted or inferred)
- author: string | null (if detectable)
- subject: string | null (main subject area)
- detectedLanguage: string (ISO 639-1 code, e.g., "en", "es")
- keywords: string[] (3-7 key topics or terms)

Output ONLY valid JSON, no explanation.`;

  let response = "";
  for await (const chunk of aiGenerateStream(prompt, {
    system: "You are a document analysis expert. Output only JSON.",
    timeout: 30000,
  })) {
    response += chunk;
  }

  try {
    const parsed = JSON.parse(extractJSON(response));
    return {
      title: parsed.title || fileMetadata.filename,
      author: parsed.author,
      subject: parsed.subject,
      pageCount: fileMetadata.pageCount,
      detectedLanguage: parsed.detectedLanguage || "en",
      keywords: parsed.keywords || [],
    };
  } catch (err) {
    console.warn("⚠️ Metadata detection failed, using defaults");
    return {
      title: fileMetadata.filename,
      pageCount: fileMetadata.pageCount,
      detectedLanguage: "en",
    };
  }
}

/**
 * Extract table of contents from document
 */
async function extractTableOfContents(
  text: string
): Promise<TableOfContentsEntry[]> {
  // Look for common TOC patterns
  const tocPatterns = [
    /Table of Contents[\s\S]{0,500}?(?=\n\n|\f)/gi,
    /Contents[\s\S]{0,500}?(?=\n\n|\f)/gi,
  ];

  let tocText = "";
  for (const pattern of tocPatterns) {
    const match = text.match(pattern);
    if (match) {
      tocText = match[0];
      break;
    }
  }

  if (!tocText) {
    // Fallback: detect headings
    return detectHeadingsAsTOC(text);
  }

  const prompt = `Extract the table of contents structure from this text.

TOC TEXT:
${tocText}

TASK: Output a JSON array of entries with:
- level: number (1=chapter, 2=section, 3=subsection)
- title: string
- pageNumber: number (extract if present, otherwise 0)

Output ONLY valid JSON array, no explanation.`;

  let response = "";
  for await (const chunk of aiGenerateStream(prompt, {
    system: "You are a document structure expert. Output only JSON.",
    timeout: 30000,
  })) {
    response += chunk;
  }

  try {
    const parsed = JSON.parse(extractJSON(response));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("⚠️ TOC extraction failed, using heading detection");
    return detectHeadingsAsTOC(text);
  }
}

/**
 * Detect headings in text and create a synthetic TOC
 */
function detectHeadingsAsTOC(text: string): TableOfContentsEntry[] {
  const lines = text.split("\n");
  const toc: TableOfContentsEntry[] = [];

  // Simple heuristic: short lines (< 80 chars) in title case
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (
      trimmed.length > 5 &&
      trimmed.length < 80 &&
      /^[A-Z]/.test(trimmed) && // Starts with capital
      !/[.;,]$/.test(trimmed) && // Doesn't end with punctuation
      /[A-Z].*[a-z]/.test(trimmed) // Has mixed case
    ) {
      // Estimate level by indentation or numbering
      let level = 1;
      if (/^\d+\.\d+/.test(trimmed)) level = 2;
      if (/^\d+\.\d+\.\d+/.test(trimmed)) level = 3;

      toc.push({
        level,
        title: trimmed,
        pageNumber: Math.floor(idx / 40), // Rough estimate: 40 lines/page
      });
    }
  });

  return toc.slice(0, 50); // Limit to 50 entries
}

/**
 * Segment document into meaningful chunks based on TOC and structure
 */
async function segmentContent(
  text: string,
  toc: TableOfContentsEntry[]
): Promise<Array<Omit<ContentChunk, "semantics" | "learningMetadata">>> {
  // If we have a good TOC, use it to segment
  if (toc.length > 3) {
    return segmentByTOC(text, toc);
  }

  // Otherwise, use intelligent chunking (fixed size with semantic boundaries)
  return segmentBySemanticBoundaries(text);
}

/**
 * Segment text using TOC as guide
 */
function segmentByTOC(
  text: string,
  toc: TableOfContentsEntry[]
): Array<Omit<ContentChunk, "semantics" | "learningMetadata">> {
  const chunks: Array<Omit<ContentChunk, "semantics" | "learningMetadata">> =
    [];
  const lines = text.split("\n");

  for (let i = 0; i < toc.length; i++) {
    const entry = toc[i];
    const nextEntry = toc[i + 1];

    // Find text between this heading and next
    const startIdx = lines.findIndex((line) =>
      line.includes(entry.title.substring(0, 20))
    );
    const endIdx = nextEntry
      ? lines.findIndex((line) =>
          line.includes(nextEntry.title.substring(0, 20))
        )
      : lines.length;

    if (startIdx >= 0 && endIdx > startIdx) {
      const chunkText = lines.slice(startIdx, endIdx).join("\n");

      // Skip very small chunks (< 100 chars)
      if (chunkText.length < 100) continue;

      chunks.push({
        id: `chunk-${i}`,
        sourcePages: [entry.pageNumber],
        rawText: chunkText,
        structure: {
          heading: entry.title,
          level: entry.level,
          chunkType: inferChunkType(entry.title, chunkText),
        },
      });
    }
  }

  return chunks;
}

/**
 * Segment text by semantic boundaries (paragraphs, sections)
 */
function segmentBySemanticBoundaries(
  text: string
): Array<Omit<ContentChunk, "semantics" | "learningMetadata">> {
  const chunks: Array<Omit<ContentChunk, "semantics" | "learningMetadata">> =
    [];
  const paragraphs = text.split(/\n\s*\n/); // Split by double newlines

  const targetChunkSize = 2000; // ~2000 chars per chunk
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if (
      currentChunk.length + para.length > targetChunkSize &&
      currentChunk.length > 500
    ) {
      // Save current chunk
      chunks.push({
        id: `chunk-${chunkIndex++}`,
        sourcePages: [Math.floor(chunkIndex / 2)], // Rough estimate
        rawText: currentChunk,
        structure: {
          level: 2,
          chunkType: inferChunkType("", currentChunk),
        },
      });
      currentChunk = para;
    } else {
      currentChunk += "\n\n" + para;
    }
  }

  // Add final chunk
  if (currentChunk.length > 100) {
    chunks.push({
      id: `chunk-${chunkIndex}`,
      sourcePages: [Math.floor(chunkIndex / 2)],
      rawText: currentChunk,
      structure: {
        level: 2,
        chunkType: inferChunkType("", currentChunk),
      },
    });
  }

  return chunks;
}

/**
 * Infer chunk type from title and content
 */
function inferChunkType(
  title: string,
  content: string
): ContentChunk["structure"]["chunkType"] {
  const lower = (title + " " + content.substring(0, 200)).toLowerCase();

  if (
    lower.includes("introduction") ||
    lower.includes("overview") ||
    lower.includes("getting started")
  ) {
    return "introduction";
  }
  if (
    lower.includes("example") ||
    lower.includes("case study") ||
    lower.includes("demo")
  ) {
    return "example";
  }
  if (
    lower.includes("exercise") ||
    lower.includes("practice") ||
    lower.includes("problem")
  ) {
    return "exercise";
  }
  if (lower.includes("definition") || lower.includes("terminology")) {
    return "definition";
  }
  if (lower.includes("summary") || lower.includes("conclusion")) {
    return "summary";
  }
  if (lower.includes("reference") || lower.includes("appendix")) {
    return "reference";
  }

  return "theory"; // Default
}

/**
 * Analyze chunks in parallel for performance
 */
async function analyzeChunksInParallel(
  chunks: Array<Omit<ContentChunk, "semantics" | "learningMetadata">>
): Promise<ContentChunk[]> {
  console.log(`🔬 Analyzing ${chunks.length} content chunks...`);

  // Process in batches to avoid overwhelming the AI
  const batchSize = 3;
  const results: ContentChunk[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((chunk) => analyzeChunkSemantics(chunk))
    );
    results.push(...batchResults);
    console.log(
      `  ✓ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} complete`
    );
  }

  return results;
}

/**
 * Analyze a single chunk for semantic information
 */
async function analyzeChunkSemantics(
  chunk: Omit<ContentChunk, "semantics" | "learningMetadata">
): Promise<ContentChunk> {
  // Truncate very long chunks for analysis
  const textSample =
    chunk.rawText.length > 3000
      ? chunk.rawText.substring(0, 3000) + "..."
      : chunk.rawText;

  const prompt = `Analyze this learning content chunk and extract semantic information.

CONTENT:
${textSample}

TASK: Output JSON with:
- mainConcepts: string[] (3-7 key concepts taught)
- keyDefinitions: Array<{term: string, definition: string}> (important terms defined)
- codeExamples: Array<{language?: string, code: string}> (extract code blocks if present)
- formulas: string[] (mathematical formulas if present)
- difficulty: "intro" | "moderate" | "advanced"
- prerequisites: string[] (concepts needed to understand this)
- summary: string (2-3 sentence summary)
- keyTakeaways: string[] (3-5 main points)

Output ONLY valid JSON, no markdown.`;

  let response = "";
  try {
    for await (const chunk of aiGenerateStream(prompt, {
      system: "You are an educational content analyzer. Output only JSON.",
      timeout: 45000,
    })) {
      response += chunk;
    }

    const semantics = JSON.parse(extractJSON(response));

    // Calculate learning metadata
    const wordCount = chunk.rawText.split(/\s+/).length;
    const estimatedReadingMinutes = Math.ceil(wordCount / 200); // ~200 words/min

    return {
      ...chunk,
      semantics: {
        ...semantics,
        diagrams: [], // Would need image processing for this
      },
      learningMetadata: {
        estimatedReadingMinutes,
        cognitiveLoad:
          semantics.difficulty === "advanced"
            ? "high"
            : semantics.difficulty === "moderate"
              ? "medium"
              : "low",
        practicalApplications: [], // Could be extracted with more sophisticated analysis
      },
    };
  } catch (err) {
    console.error(`❌ Failed to analyze chunk ${chunk.id}:`, err);
    // Return chunk with minimal semantics
    return {
      ...chunk,
      semantics: {
        mainConcepts: [],
        keyDefinitions: [],
        codeExamples: [],
        formulas: [],
        diagrams: [],
        difficulty: "moderate",
        prerequisites: [],
        summary: chunk.rawText.substring(0, 200) + "...",
        keyTakeaways: [],
      },
      learningMetadata: {
        estimatedReadingMinutes: Math.ceil(
          chunk.rawText.split(/\s+/).length / 200
        ),
        cognitiveLoad: "medium",
        practicalApplications: [],
      },
    };
  }
}

/**
 * Build a global knowledge graph from analyzed chunks
 */
async function buildKnowledgeGraph(
  chunks: ContentChunk[],
  metadata: PDFMetadata
): Promise<GlobalContext> {
  // Collect all concepts across chunks
  const allConcepts = chunks.flatMap((c) => c.semantics.mainConcepts);
  const conceptCounts = new Map<string, number>();
  allConcepts.forEach((concept) => {
    conceptCounts.set(concept, (conceptCounts.get(concept) || 0) + 1);
  });

  // Main topics are most frequently mentioned concepts
  const sortedConcepts = Array.from(conceptCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([concept]) => concept);

  const mainTopics = sortedConcepts.slice(0, 10);

  // Build topic hierarchy
  const topicHierarchy: TopicNode[] = mainTopics.map((topic) => ({
    topic,
    relatedTopics: sortedConcepts
      .slice(0, 20)
      .filter((t) => t !== topic)
      .slice(0, 3),
    chunkIds: chunks
      .filter((c) => c.semantics.mainConcepts.includes(topic))
      .map((c) => c.id),
    difficultyProgression: "linear",
    importance: conceptCounts.get(topic) || 0,
  }));

  // Estimate overall difficulty
  const difficulties = chunks.map((c) => c.semantics.difficulty);
  const difficultyScore =
    difficulties.filter((d) => d === "advanced").length / difficulties.length;
  const difficultyEstimate =
    difficultyScore > 0.5
      ? "advanced"
      : difficultyScore > 0.2
        ? "intermediate"
        : "beginner";

  // Detect document type
  const documentType = detectDocumentType(chunks, metadata);

  // Build concept dependencies
  const conceptDependencies: Record<string, string[]> = {};
  chunks.forEach((chunk) => {
    chunk.semantics.mainConcepts.forEach((concept) => {
      if (!conceptDependencies[concept]) {
        conceptDependencies[concept] = [];
      }
      conceptDependencies[concept].push(...chunk.semantics.prerequisites);
    });
  });

  return {
    mainTopics,
    topicHierarchy,
    difficultyEstimate,
    documentType,
    conceptDependencies,
    learningPathSuggestions: [mainTopics], // Simplified for now
  };
}

/**
 * Detect document type from content
 */
function detectDocumentType(
  chunks: ContentChunk[],
  metadata: PDFMetadata
): DocumentType {
  const allText = chunks
    .map((c) => c.rawText)
    .join(" ")
    .toLowerCase();

  if (
    allText.includes("abstract") &&
    allText.includes("references") &&
    allText.includes("methodology")
  ) {
    return "research_paper";
  }
  if (
    allText.includes("chapter") &&
    chunks.some((c) => c.structure.chunkType === "exercise")
  ) {
    return "textbook";
  }
  if (allText.includes("lecture") || allText.includes("slides")) {
    return "lecture_notes";
  }
  if (
    allText.includes("user manual") ||
    allText.includes("installation") ||
    allText.includes("troubleshooting")
  ) {
    return "manual";
  }
  if (allText.includes("tutorial") || allText.includes("step-by-step")) {
    return "tutorial";
  }
  if (allText.includes("reference") || allText.includes("api")) {
    return "reference_guide";
  }

  return "unknown";
}

/**
 * Helper: Extract JSON from AI response (handles markdown code blocks)
 */
function extractJSON(response: string): string {
  let jsonStr = response.trim();

  // Remove markdown code blocks
  if (jsonStr.includes("```json")) {
    const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  } else if (jsonStr.includes("```")) {
    const match = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
    jsonStr = match ? match[1] : jsonStr;
  }

  // Find first complete JSON object or array
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  const arrMatch = jsonStr.match(/\[[\s\S]*\]/);

  return objMatch?.[0] || arrMatch?.[0] || jsonStr;
}
