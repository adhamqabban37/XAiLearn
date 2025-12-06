# 🎓 Adaptive Learning System Architecture

## Overview

This document describes the upgraded AI Learn 2.0 architecture that transforms arbitrary PDFs into personalized, adaptive learning courses.

---

## 🏗️ System Architecture

### **Phase 1: Deep PDF Understanding**

```
PDF → Structure Detection → Content Segmentation → Semantic Analysis → Knowledge Graph
```

### **Phase 2: Learner Profile Analysis**

```
User Input → Profile Extraction → Goal Mapping → Prerequisite Analysis → Time Budget Calculation
```

### **Phase 3: Adaptive Course Generation**

```
Knowledge Graph + Learner Profile → Course Planning → Content Adaptation → Resource Enrichment → Quality Validation
```

---

## 📊 Data Models

### **1. PDF Understanding Model**

```typescript
type PDFStructure = {
  metadata: {
    title: string;
    author?: string;
    subject?: string;
    pageCount: number;
    detectedLanguage: string;
  };

  tableOfContents: {
    level: number;
    title: string;
    pageNumber: number;
    subsections: TableOfContentsEntry[];
  }[];

  contentChunks: ContentChunk[];

  globalContext: {
    mainTopics: string[];
    topicHierarchy: TopicNode[];
    difficultyEstimate: "beginner" | "intermediate" | "advanced" | "mixed";
    documentType:
      | "textbook"
      | "paper"
      | "lecture_notes"
      | "manual"
      | "handbook"
      | "unknown";
  };
};

type ContentChunk = {
  id: string;
  sourcePages: number[];
  rawText: string;

  structure: {
    heading?: string;
    level: number; // 1=chapter, 2=section, 3=subsection
    chunkType:
      | "theory"
      | "example"
      | "exercise"
      | "definition"
      | "summary"
      | "reference";
  };

  semantics: {
    mainConcepts: string[];
    keyDefinitions: { term: string; definition: string }[];
    codeExamples: { language?: string; code: string }[];
    formulas: string[];
    diagrams: { description: string; pageNumber: number }[];

    difficulty: "intro" | "moderate" | "advanced";
    prerequisites: string[]; // concepts needed to understand this chunk

    summary: string;
    keyTakeaways: string[];
  };

  learningMetadata: {
    estimatedReadingMinutes: number;
    cognitiveLoad: "low" | "medium" | "high";
    practicalApplications: string[];
  };
};

type TopicNode = {
  topic: string;
  parentTopic?: string;
  relatedTopics: string[];
  chunkIds: string[]; // which chunks cover this topic
  difficultyProgression: "linear" | "branching" | "circular";
};
```

### **2. Learner Profile Model**

```typescript
type LearnerProfile = {
  // Core goals
  goal: string; // "pass my networking exam in 4 weeks"
  goalType:
    | "exam"
    | "skill_building"
    | "career_transition"
    | "hobby"
    | "certification"
    | "general";
  deadline?: string; // ISO date

  // Background
  backgroundLevel:
    | "absolute_beginner"
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert";
  priorKnowledge: string[]; // ["basic programming", "HTML/CSS"]
  currentSkillLevel?: Record<string, number>; // {"networking": 3, "security": 1} (1-10 scale)

  // Time constraints
  timePerWeekHours: number;
  preferredSessionLength?: number; // minutes per study session
  availableDays?: string[]; // ["Monday", "Wednesday", "Friday"]

  // Learning preferences
  preferredStyle:
    | "theory_first"
    | "practice_first"
    | "balanced"
    | "example_driven";
  pacePreference: "fast" | "moderate" | "slow" | "self_paced";

  // Content preferences
  focusAreas?: string[]; // ["subnetting", "routing basics"]
  avoid?: string[]; // ["too much history", "very advanced math"]
  includeExtras?: (
    | "videos"
    | "code_examples"
    | "diagrams"
    | "practice_problems"
    | "real_world_projects"
  )[];

  // Assessment preferences
  quizFrequency: "every_lesson" | "end_of_module" | "minimal" | "comprehensive";
  quizDifficulty: "easy" | "medium" | "hard" | "adaptive";

  // Accessibility
  language?: string;
  readingLevel?: "simple" | "standard" | "academic";
};
```

### **3. Adaptive Course Model**

```typescript
type AdaptiveCourse = {
  metadata: {
    courseId: string;
    generatedAt: string;
    sourceDocument: {
      filename: string;
      pdfHash: string;
    };
    learnerProfile: LearnerProfile;
    customizationLevel: number; // 0-100, how much it's tailored
  };

  courseOverview: {
    title: string;
    description: string;
    learningObjectives: string[];
    totalEstimatedHours: number;

    prerequisiteCheck: {
      required: string[];
      recommended: string[];
      learnersLevel: string;
      isReadyToStart: boolean;
      gapsToBridge: string[];
    };

    roadmap: {
      phases: CoursePhase[];
      criticalPath: string[]; // lesson IDs that are essential
      optionalPath: string[]; // can be skipped based on goals
    };
  };

  modules: AdaptiveModule[];

  assessmentStrategy: {
    diagnosticQuiz?: Quiz; // check initial level
    formativeQuizzes: Quiz[]; // during learning
    summativeQuiz?: Quiz; // final assessment
  };

  adaptiveElements: {
    difficultyScaling: "enabled" | "disabled";
    contentPersonalization: {
      examplesMatchProfile: boolean;
      languageSimplified: boolean;
      focusAreasHighlighted: boolean;
    };
    pacing: {
      recommendedSchedule: StudySession[];
      flexibilityAllowed: boolean;
    };
  };
};

type AdaptiveModule = {
  id: string;
  moduleTitle: string;
  learningObjectives: string[];

  // Pedagogical metadata
  difficultyLevel: "intro" | "intermediate" | "advanced";
  estimatedHours: number;
  prerequisites: string[]; // module IDs or concept names

  // Content adaptation
  lessons: AdaptiveLesson[];

  // Personalization flags
  priorityLevel: "critical" | "important" | "supplementary" | "optional";
  relevanceScore: number; // 0-100, based on learner goals

  moduleIntro: {
    whatYoullLearn: string[];
    whyItMatters: string;
    realWorldApplications: string[];
  };
};

type AdaptiveLesson = {
  id: string;
  lessonTitle: string;

  // Content structure
  sections: LessonSection[];

  // Learning design
  objectives: string[];
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";

  // Adaptive content
  contentVariants: {
    simplified?: string; // for beginners
    standard: string;
    detailed?: string; // for advanced learners
  };

  // Multimodal resources
  resources: {
    videos?: VideoResource[];
    articles?: ArticleResource[];
    codeExamples?: CodeExample[];
    diagrams?: DiagramResource[];
    interactiveElements?: InteractiveResource[];
  };

  // Practice & assessment
  checkpoints: Checkpoint[];
  practiceProblems: PracticeProblem[];
  quiz?: Quiz;

  // Personalization metadata
  relevanceToGoal: number; // 0-100
  prerequisiteConcepts: string[];
  enablesUnlocking: string[]; // what this lesson enables
};

type LessonSection = {
  type: "introduction" | "explanation" | "example" | "practice" | "summary";
  title: string;
  content: string;

  // Semantic linking
  conceptsTaught: string[];
  conceptsRevisited: string[];

  // Cognitive load indicators
  complexity: "low" | "medium" | "high";
  estimatedMinutes: number;
};

type CoursePhase = {
  phaseName: string; // "Foundation", "Core Concepts", "Advanced Topics"
  moduleIds: string[];
  description: string;
  gatekeeper: boolean; // must complete before next phase
};

type Checkpoint = {
  id: string;
  question: string;
  expectedAnswer: string;
  hint?: string;
  pointsToReview?: string[]; // if user struggles
};

type PracticeProblem = {
  id: string;
  prompt: string;
  difficulty: "easy" | "medium" | "hard";
  solution?: string;
  hints: string[];
  skillsPracticed: string[];
};
```

---

## 🔄 Processing Pipeline

### **Stage 1: PDF Analysis (Deep Understanding)**

```typescript
async function analyzePDFStructure(pdfBuffer: Buffer): Promise<PDFStructure> {
  // 1. Extract raw text and metadata
  const rawData = await parsePdfBuffer(pdfBuffer);

  // 2. Detect structure using AI
  const structure = await detectDocumentStructure(rawData);

  // 3. Segment into meaningful chunks
  const chunks = await segmentContent(rawData, structure);

  // 4. Analyze each chunk semantically
  const analyzedChunks = await Promise.all(
    chunks.map((chunk) => analyzeChunkSemantics(chunk))
  );

  // 5. Build global knowledge graph
  const knowledgeGraph = await buildKnowledgeGraph(analyzedChunks);

  return {
    metadata: structure.metadata,
    tableOfContents: structure.toc,
    contentChunks: analyzedChunks,
    globalContext: knowledgeGraph,
  };
}
```

### **Stage 2: Learner Profile Processing**

```typescript
async function processLearnerProfile(
  profile: LearnerProfile,
  pdfStructure: PDFStructure
): Promise<LearningPlan> {
  // 1. Analyze goal alignment
  const goalAlignment = await analyzeGoalAlignment(
    profile.goal,
    pdfStructure.globalContext
  );

  // 2. Assess prerequisite gaps
  const prerequisiteGaps = await assessPrerequisites(
    profile.priorKnowledge,
    pdfStructure.globalContext.mainTopics
  );

  // 3. Calculate optimal pacing
  const pacing = calculatePacing(
    profile.timePerWeekHours,
    profile.deadline,
    pdfStructure.contentChunks.length
  );

  // 4. Filter content by focus areas
  const relevantChunks = filterByFocusAreas(
    pdfStructure.contentChunks,
    profile.focusAreas,
    profile.avoid
  );

  return {
    goalAlignment,
    prerequisiteGaps,
    pacing,
    relevantChunks,
    customizationStrategy: determineCustomizationStrategy(profile),
  };
}
```

### **Stage 3: Adaptive Course Generation**

```typescript
async function generateAdaptiveCourse(
  pdfStructure: PDFStructure,
  learnerProfile: LearnerProfile
): Promise<AdaptiveCourse> {
  // 1. Process learner profile
  const learningPlan = await processLearnerProfile(
    learnerProfile,
    pdfStructure
  );

  // 2. Plan course structure
  const courseOutline = await planCourseStructure(pdfStructure, learningPlan);

  // 3. Generate adaptive modules
  const modules = await Promise.all(
    courseOutline.modules.map((outline) =>
      generateAdaptiveModule(outline, learnerProfile, learningPlan)
    )
  );

  // 4. Enrich with resources
  const enrichedModules = await enrichWithResources(modules, learnerProfile);

  // 5. Generate assessments
  const assessments = await generateAssessments(
    enrichedModules,
    learnerProfile.quizFrequency,
    learnerProfile.quizDifficulty
  );

  // 6. Create study schedule
  const schedule = createStudySchedule(
    enrichedModules,
    learnerProfile.timePerWeekHours,
    learnerProfile.deadline
  );

  return {
    metadata: createMetadata(pdfStructure, learnerProfile),
    courseOverview: createOverview(pdfStructure, learningPlan),
    modules: enrichedModules,
    assessmentStrategy: assessments,
    adaptiveElements: {
      difficultyScaling: "enabled",
      contentPersonalization: learningPlan.customizationStrategy,
      pacing: {
        recommendedSchedule: schedule,
        flexibilityAllowed: true,
      },
    },
  };
}
```

---

## 🎯 Key Improvements Over Current System

### **1. PDF Understanding**

- **Current**: Simple text extraction → direct to LLM
- **New**: Structure detection → chunking → semantic analysis → knowledge graph

### **2. Personalization**

- **Current**: One-size-fits-all course structure
- **New**: Adaptive content based on learner profile

### **3. Learning Design**

- **Current**: Basic modules/lessons/quizzes
- **New**: Learning objectives, prerequisite tracking, difficulty scaling, checkpoints

### **4. Content Quality**

- **Current**: 2-3 modules, fixed structure
- **New**: Intelligent chunking, concept dependencies, real-world applications

### **5. Resource Enrichment**

- **Current**: Simple YouTube search
- **New**: Multi-modal resources (videos, articles, code, diagrams) aligned to lesson objectives

---

## 🚀 Implementation Priority

### **Phase 1: Enhanced PDF Analysis** (Week 1-2)

- Implement structure detection
- Build chunking algorithm
- Create semantic analyzer

### **Phase 2: Learner Profile System** (Week 2-3)

- Design profile schema
- Build profile processor
- Implement goal alignment

### **Phase 3: Adaptive Generation** (Week 3-4)

- Rewrite course generation prompts
- Implement difficulty scaling
- Add prerequisite tracking

### **Phase 4: Resource Enrichment** (Week 4-5)

- Enhance video matching
- Add code example extraction
- Implement diagram detection

### **Phase 5: Testing & Refinement** (Week 5-6)

- Test with various PDF types
- Validate with different learner profiles
- Performance optimization

---

## 📈 Success Metrics

1. **Content Quality**: Semantic coherence score > 0.85
2. **Personalization**: Learner satisfaction > 4.5/5
3. **Completion Rate**: >70% of learners finish their courses
4. **Learning Outcomes**: Quiz scores improve by >25% from diagnostic to summative
5. **Adaptivity**: 80%+ of learners report content matched their level

---

## 🔧 Technical Implementation Notes

### **AI Orchestration Strategy**

- Use **multi-stage LLM calls** instead of single mega-prompt
- Each stage has focused, validated output
- Enables caching, parallel processing, and error recovery

### **Prompt Engineering Principles**

- **Specificity**: Each prompt has one clear task
- **Constraints**: Explicit output format, length, difficulty level
- **Context**: Provide learner profile + PDF context
- **Examples**: Few-shot examples for consistent quality

### **Performance Optimization**

- Stream long-running AI calls
- Cache PDF analysis results (by hash)
- Parallelize independent operations
- Lazy-load optional content
