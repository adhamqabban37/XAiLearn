/**
 * @fileOverview Learner Profile Processing and Goal Alignment
 *
 * This module implements Stage 2 of the adaptive learning pipeline:
 * Learner Profile Analysis → Goal Mapping → Prerequisite Assessment → Time Budget Calculation
 */

"use server";

import { aiGenerateStream } from "@/lib/ai-provider";
import type {
  LearnerProfile,
  PDFStructure,
  LearningPlan,
  GoalAlignment,
  PrerequisiteCheck,
  PacingPlan,
  CustomizationStrategy,
} from "@/lib/adaptive-types";

/**
 * Main entry point: Process learner profile and create learning plan
 */
export async function processLearnerProfile(
  profile: LearnerProfile,
  pdfStructure: PDFStructure
): Promise<LearningPlan> {
  console.log("🎯 Stage 2: Learner Profile Processing Started");
  console.log(`  Goal: ${profile.goal}`);
  console.log(`  Level: ${profile.backgroundLevel}`);
  console.log(`  Time: ${profile.timePerWeekHours} hours/week`);

  // Step 1: Analyze goal alignment with PDF content
  const goalAlignment = await analyzeGoalAlignment(profile.goal, pdfStructure);

  // Step 2: Assess prerequisite gaps
  const prerequisiteCheck = await assessPrerequisites(
    profile.priorKnowledge,
    profile.backgroundLevel,
    pdfStructure
  );

  // Step 3: Calculate optimal pacing
  const pacing = calculatePacing(
    profile.timePerWeekHours,
    profile.deadline,
    pdfStructure.contentChunks.length,
    profile.preferredSessionLength
  );

  // Step 4: Filter content by focus areas and preferences
  const relevantChunkIds = filterContentByPreferences(
    pdfStructure,
    profile.focusAreas,
    profile.avoid
  );

  // Step 5: Determine customization strategy
  const customizationStrategy = determineCustomizationStrategy(
    profile,
    pdfStructure,
    prerequisiteCheck
  );

  // Step 6: Calculate confidence and completion date
  const confidenceLevel = calculateConfidenceLevel(
    goalAlignment,
    prerequisiteCheck
  );
  const estimatedCompletionDate = calculateCompletionDate(
    pacing,
    profile.deadline
  );

  console.log(
    `✅ Learning Plan Created: ${relevantChunkIds.length} chunks, ${pacing.totalWeeks} weeks`
  );
  console.log(
    `  Confidence: ${confidenceLevel}%, Customization: ${Object.values(customizationStrategy).filter(Boolean).length} strategies`
  );

  return {
    goalAlignment,
    prerequisiteCheck,
    pacing,
    relevantChunkIds,
    customizationStrategy,
    estimatedCompletionDate,
    confidenceLevel,
  };
}

/**
 * Analyze how well the learner's goal aligns with PDF content
 */
async function analyzeGoalAlignment(
  goal: string,
  pdfStructure: PDFStructure
): Promise<GoalAlignment> {
  const topics = pdfStructure.globalContext.mainTopics.join(", ");
  const docType = pdfStructure.globalContext.documentType;

  const prompt = `Analyze goal alignment between a learner's goal and document content.

LEARNER'S GOAL:
"${goal}"

DOCUMENT CONTENT:
- Type: ${docType}
- Main topics: ${topics}
- Difficulty: ${pdfStructure.globalContext.difficultyEstimate}
- Total chunks: ${pdfStructure.contentChunks.length}

TASK: Output JSON with:
- relevanceScore: number (0-100, how well document matches goal)
- alignedTopics: string[] (topics in document that match goal)
- missingFromPDF: string[] (important topics for goal not covered in PDF)
- excessInPDF: string[] (topics in PDF not relevant to goal)
- recommendations: string[] (3-5 suggestions for the learner)

Example:
{
  "relevanceScore": 85,
  "alignedTopics": ["networking basics", "subnetting"],
  "missingFromPDF": ["advanced routing protocols"],
  "excessInPDF": ["network hardware history"],
  "recommendations": [
    "Focus on chapters 2-4 for exam preparation",
    "Skip historical sections to save time",
    "Supplement with practice subnetting problems"
  ]
}

Output ONLY valid JSON, no explanation.`;

  let response = "";
  try {
    for await (const chunk of aiGenerateStream(prompt, {
      system: "You are an educational planning expert. Output only JSON.",
      timeout: 45000,
    })) {
      response += chunk;
    }

    const parsed = JSON.parse(extractJSON(response));
    return {
      relevanceScore: parsed.relevanceScore || 50,
      alignedTopics: parsed.alignedTopics || [],
      missingFromPDF: parsed.missingFromPDF || [],
      excessInPDF: parsed.excessInPDF || [],
      recommendations: parsed.recommendations || [],
    };
  } catch (err) {
    console.error("❌ Goal alignment analysis failed:", err);
    return {
      relevanceScore: 50,
      alignedTopics: pdfStructure.globalContext.mainTopics.slice(0, 3),
      missingFromPDF: [],
      excessInPDF: [],
      recommendations: ["Review all content thoroughly"],
    };
  }
}

/**
 * Assess learner's prerequisites and identify gaps
 */
async function assessPrerequisites(
  priorKnowledge: string[],
  backgroundLevel: LearnerProfile["backgroundLevel"],
  pdfStructure: PDFStructure
): Promise<PrerequisiteCheck> {
  const requiredConcepts = pdfStructure.contentChunks
    .flatMap((chunk) => chunk.semantics.prerequisites)
    .filter((p, i, arr) => arr.indexOf(p) === i) // unique
    .slice(0, 20); // limit to top 20

  const docDifficulty = pdfStructure.globalContext.difficultyEstimate;

  const prompt = `Assess if a learner is ready for this course based on their background.

LEARNER BACKGROUND:
- Level: ${backgroundLevel}
- Prior knowledge: ${priorKnowledge.join(", ") || "None specified"}

COURSE REQUIREMENTS:
- Difficulty: ${docDifficulty}
- Required concepts: ${requiredConcepts.join(", ")}

TASK: Output JSON with:
- required: string[] (concepts absolutely needed to start)
- recommended: string[] (helpful but not critical)
- learnersLevel: "ready" | "needs_prep" | "challenging_but_doable" | "too_advanced"
- isReadyToStart: boolean
- gapsToBridge: Array<{concept: string, importance: "critical"|"important"|"nice_to_have", suggestedPrework?: string}>

Output ONLY valid JSON, no explanation.`;

  let response = "";
  try {
    for await (const chunk of aiGenerateStream(prompt, {
      system: "You are an educational assessment expert. Output only JSON.",
      timeout: 45000,
    })) {
      response += chunk;
    }

    const parsed = JSON.parse(extractJSON(response));
    return {
      required: parsed.required || [],
      recommended: parsed.recommended || [],
      learnersLevel: parsed.learnersLevel || "ready",
      isReadyToStart: parsed.isReadyToStart !== false,
      gapsToBridge: parsed.gapsToBridge || [],
    };
  } catch (err) {
    console.error("❌ Prerequisite assessment failed:", err);
    // Default to optimistic assessment
    return {
      required: [],
      recommended: requiredConcepts.slice(0, 3),
      learnersLevel: "ready",
      isReadyToStart: true,
      gapsToBridge: [],
    };
  }
}

/**
 * Calculate optimal pacing based on time constraints
 */
function calculatePacing(
  timePerWeekHours: number,
  deadline: string | undefined,
  totalChunks: number,
  preferredSessionLength: number = 45
): PacingPlan {
  // Estimate 30 minutes per chunk on average
  const estimatedMinutesPerChunk = 30;
  const totalMinutes = totalChunks * estimatedMinutesPerChunk;
  const totalHours = totalMinutes / 60;

  let totalWeeks: number;

  if (deadline) {
    // Calculate weeks until deadline
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    totalWeeks = Math.max(
      1,
      Math.ceil((deadlineDate.getTime() - now.getTime()) / msPerWeek)
    );
  } else {
    // Calculate based on available time per week
    totalWeeks = Math.ceil(totalHours / timePerWeekHours);
  }

  const hoursPerWeek = Math.ceil(totalHours / totalWeeks);
  const minutesPerWeek = hoursPerWeek * 60;
  const sessionsPerWeek = Math.max(
    1,
    Math.ceil(minutesPerWeek / preferredSessionLength)
  );
  const minutesPerSession = Math.ceil(minutesPerWeek / sessionsPerWeek);

  // Add 20% flexibility buffer
  const flexibilityBuffer = 20;

  return {
    totalWeeks,
    hoursPerWeek,
    sessionsPerWeek,
    minutesPerSession,
    flexibilityBuffer,
  };
}

/**
 * Filter content chunks by learner's focus areas and avoidance preferences
 */
function filterContentByPreferences(
  pdfStructure: PDFStructure,
  focusAreas: string[] = [],
  avoid: string[] = []
): string[] {
  const chunks = pdfStructure.contentChunks;

  // If no preferences, include all chunks
  if (focusAreas.length === 0 && avoid.length === 0) {
    return chunks.map((c) => c.id);
  }

  return chunks
    .filter((chunk) => {
      const chunkText = (
        chunk.structure.heading +
        " " +
        chunk.semantics.mainConcepts.join(" ")
      ).toLowerCase();

      // Exclude if matches avoidance criteria
      if (avoid.length > 0) {
        const matchesAvoid = avoid.some((term) =>
          chunkText.includes(term.toLowerCase())
        );
        if (matchesAvoid) return false;
      }

      // Include if matches focus areas (or no focus areas specified)
      if (focusAreas.length > 0) {
        const matchesFocus = focusAreas.some((term) =>
          chunkText.includes(term.toLowerCase())
        );
        return matchesFocus;
      }

      return true;
    })
    .map((c) => c.id);
}

/**
 * Determine customization strategy based on profile
 */
function determineCustomizationStrategy(
  profile: LearnerProfile,
  pdfStructure: PDFStructure,
  prerequisiteCheck: PrerequisiteCheck
): CustomizationStrategy {
  const isBeginnerOrLower =
    profile.backgroundLevel === "absolute_beginner" ||
    profile.backgroundLevel === "beginner";

  const hasGaps = prerequisiteCheck.gapsToBridge.length > 0;

  const isExamFocused =
    profile.goalType === "exam" || profile.goal.toLowerCase().includes("exam");

  const isPracticeFocused =
    profile.preferredStyle === "practice_first" ||
    profile.preferredStyle === "project_based";

  const needsMoreTime = profile.timePerWeekHours < 5;

  return {
    simplifyLanguage:
      isBeginnerOrLower || profile.readingLevel === "simple" || hasGaps,
    addMoreExamples: isBeginnerOrLower || hasGaps,
    emphasizePractice: isPracticeFocused || isExamFocused,
    includeRealWorldProjects:
      profile.includeExtras?.includes("real_world_projects") || false,
    reduceTheory: isPracticeFocused || needsMoreTime,
    skipAdvancedTopics:
      isBeginnerOrLower ||
      needsMoreTime ||
      pdfStructure.globalContext.difficultyEstimate === "advanced",
    focusOnExamFormat: isExamFocused,
  };
}

/**
 * Calculate confidence level in course success
 */
function calculateConfidenceLevel(
  goalAlignment: GoalAlignment,
  prerequisiteCheck: PrerequisiteCheck
): number {
  let confidence = 50; // Start at neutral

  // Goal alignment contributes up to 40 points
  confidence += goalAlignment.relevanceScore * 0.4;

  // Prerequisite readiness contributes up to 30 points
  if (prerequisiteCheck.isReadyToStart) {
    confidence += 30;
  } else {
    const criticalGaps = prerequisiteCheck.gapsToBridge.filter(
      (g) => g.importance === "critical"
    ).length;
    confidence += Math.max(0, 30 - criticalGaps * 10);
  }

  // Missing topics reduce confidence
  if (goalAlignment.missingFromPDF.length > 0) {
    confidence -= goalAlignment.missingFromPDF.length * 5;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Calculate estimated completion date
 */
function calculateCompletionDate(
  pacing: PacingPlan,
  deadline?: string
): string | undefined {
  if (deadline) {
    return deadline; // User-specified deadline
  }

  // Calculate based on pacing
  const weeksToAdd = Math.ceil(
    pacing.totalWeeks * (1 + pacing.flexibilityBuffer / 100)
  );
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + weeksToAdd * 7);

  return completionDate.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Helper: Extract JSON from AI response
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

  // Find first complete JSON object
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  return objMatch?.[0] || jsonStr;
}

/**
 * Create a default learner profile for users who don't provide one
 */
export function createDefaultProfile(): LearnerProfile {
  return {
    goal: "Learn this material thoroughly",
    goalType: "general",
    backgroundLevel: "beginner",
    priorKnowledge: [],
    timePerWeekHours: 5,
    preferredSessionLength: 45,
    preferredStyle: "balanced",
    pacePreference: "moderate",
    quizFrequency: "end_of_module",
    quizDifficulty: "medium",
    language: "en",
    readingLevel: "standard",
  };
}
