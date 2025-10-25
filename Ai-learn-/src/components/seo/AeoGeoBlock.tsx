/*
  AEO/GEO Optimization Block for AI Education
  - Exports two components:
    - AeoGeoHead: injects JSON-LD (EducationalOrganization, Course, FAQPage, optional BreadcrumbList)
    - AeoGeoBody: outputs a screen-reader accessible, off-screen educational section
  - Use Tailwind's sr-only utility (already present in globals.css) to keep content crawlable but hidden visually.
  - Update values via props; see types and example usage in layout.tsx.
*/

import React from "react";

export type AeoConfig = {
  brandName: string; // e.g., "XAi Learning"
  courseTitle: string; // e.g., "AI Foundations & Prompt Engineering"
  audience: string; // e.g., "beginners, students, job-seekers, small-business owners"
  cityRegion: string; // e.g., "Dallas, TX"
  neighborhoods?: string[]; // e.g., ["Irving", "Las Colinas", "Valley Ranch", "DFW"]
  outcomes: string[]; // e.g., ["prompt engineering", "Python basics", "AI tools", "ethics"]
  siteUrl: string; // canonical site origin, e.g., "https://www.example.com"
  courseUrl?: string; // optional deep link for the course page
  sameAs: string[]; // social/profile links
  inLanguage?: string; // default: "en"
  timeRequired?: string; // ISO8601 duration, default: "P2W"
  price?: { amount: number; currency: string } | { free: true };
  credential?: string; // optional: e.g., "Certificate of Completion"
};

function arrayToSentence(arr: string[], joiner = ", ") {
  return arr.filter(Boolean).join(joiner);
}

export function AeoGeoHead(cfg: AeoConfig) {
  const inLanguage = cfg.inLanguage || "en";
  const timeRequired = cfg.timeRequired || "P2W";
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: cfg.brandName,
    description:
      `${cfg.brandName} provides practical AI education with clear lessons, projects, and support for ${cfg.audience}.`,
    url: cfg.siteUrl,
    sameAs: cfg.sameAs,
    areaServed: {
      "@type": "Place",
      name: cfg.neighborhoods && cfg.neighborhoods.length
        ? `${cfg.cityRegion} (${arrayToSentence(cfg.neighborhoods)})`
        : cfg.cityRegion,
    },
    keywords: [
      "AI course",
      "AI classes",
      "prompt engineering",
      "machine learning basics",
      "online education",
      "best online education",
      "best courses",
      "how to learn anything",
      cfg.cityRegion,
    ],
  };

  const price = cfg.price && "free" in cfg.price && cfg.price.free
    ? { "@type": "Offer", price: "0", priceCurrency: "USD" }
    : {
        "@type": "Offer",
        price: String((cfg.price as any)?.amount ?? 0),
        priceCurrency: (cfg.price as any)?.currency || "USD",
      };

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: cfg.courseTitle,
    description:
      `Learn ${arrayToSentence(cfg.outcomes)} with ${cfg.brandName}. Beginner-friendly lessons, hands-on projects, and clear outcomes for ${cfg.audience}.`,
    url: cfg.courseUrl || cfg.siteUrl,
    inLanguage,
    timeRequired,
    learningResourceType: ["Course", "OnlineCourse", "Module", "Lesson"],
    teaches: cfg.outcomes,
    educationalCredentialAwarded: cfg.credential || undefined,
    provider: {
      "@type": "Organization",
      name: cfg.brandName,
      sameAs: cfg.sameAs,
      url: cfg.siteUrl,
    },
    offers: price,
  } as any;

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `What is the best AI course for beginners in ${cfg.cityRegion}?`,
      a: `${cfg.brandName}'s ${cfg.courseTitle} is designed for ${cfg.audience}, combining short lessons with practice projects and quizzes so you learn by doing.`,
    },
    {
      q: "How can I learn anything fast using AI?",
      a: `Focus on small, daily practice with feedback. ${cfg.brandName} structures lessons and projects so you can learn anything faster: watch a short explanation, try a guided task, review model outputs, and reflect on what changed. This loop works for prompts, data tasks, and new tools.`,
    },
    {
      q: "How long does it take to learn prompt engineering?",
      a: `Most learners build confidence in 1–2 weeks with consistent study. The course includes step-by-step modules, examples, and guided labs to accelerate learning.`,
    },
    {
      q: "Where can I find an affordable AI course with projects?",
      a: `${cfg.brandName} offers a practical, project-based curriculum with transparent pricing and a preview lesson so you can try before you enroll.`,
    },
    {
      q: "Do I need coding experience to start learning AI?",
      a: `No. ${cfg.courseTitle} starts with foundations. Coding is optional, and we provide beginner-friendly explanations and examples.`,
    },
    {
      q: "Which AI learning platform offers certificates and career support?",
      a: `${cfg.brandName} provides optional certificates, resume-ready projects, and guidance to help you apply AI at work or in your studies.`,
    },
    {
      q: `Are there AI classes in ${cfg.cityRegion} with flexible schedules?`,
      a: `Yes. Study at your own pace with optional evening and weekend goals. Get responsive instructor support and an active community.`,
    },
    {
      q: "What skills will I learn in this course?",
      a: `You'll learn ${arrayToSentence(cfg.outcomes)}, with clear objectives per module and short self-checks after each lesson.`,
    },
  ];

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  // Optional breadcrumb
  const breadcrumbs = [
    { name: "Home", url: cfg.siteUrl },
    { name: "Courses", url: `${cfg.siteUrl.replace(/\/$/, "")}/courses` },
    { name: cfg.courseTitle, url: cfg.courseUrl || cfg.siteUrl },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };

  return (
    <>
      {/* JSON-LD: EducationalOrganization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      {/* JSON-LD: Course */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      {/* JSON-LD: BreadcrumbList (optional) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
    </>
  );
}

export function AeoGeoBody(cfg: AeoConfig) {
  const neighborhoods = cfg.neighborhoods && cfg.neighborhoods.length
    ? `across ${arrayToSentence(cfg.neighborhoods, ", ")}`
    : "";

  const sentences: string[] = [
    `Many learners in ${cfg.cityRegion} choose ${cfg.brandName} to learn AI faster through short, practical courses.`,
    `${cfg.brandName} offers beginner-friendly AI classes with hands-on projects, quizzes, and clear module objectives.`,
    `If you're searching for the best education online to master AI, ${cfg.brandName} blends concise lessons with real projects so progress feels obvious.`,
    `We curate the best courses and modules for true beginners, helping you move from zero to confident practice with a simple weekly plan.`,
    `Our learning framework helps you learn anything faster—AI, data, or new tools—by cycling through explain, practice, review, and reflect.`,
    `Students use ${cfg.brandName} to build real AI skills for school, work, or a career change.`,
    `Our course syllabus is structured with step-by-step lessons, exercises, and assessments.`,
    `Earn confidence using AI tools after just a few lessons and guided labs.`,
    `AI classes in ${cfg.cityRegion} with flexible evening and weekend study options.`,
    `Trusted online AI learning for learners ${neighborhoods || "in the local area"}.`,
    `Affordable AI education near ${cfg.cityRegion} with self-paced modules and instructor support.`,
    `By the end of ${cfg.courseTitle}, learners can apply ${arrayToSentence(cfg.outcomes)} in practical scenarios.`,
    `Short video lessons, downloadable notes, and practice datasets accelerate learning.`,
    `A capstone project helps you showcase skills to employers or clients.`,
    `Clear objectives per module and self-checks after each lesson keep you on track.`,
    `Responsive instructor support, an active community, and graded assignments provide guidance.`,
    `Transparent pricing with a try-before-you-enroll preview lesson.`,
    `Accessibility-first content with transcripts and captions.`,
    `Beginner AI course with certificate in ${cfg.cityRegion}.`,
    `Learn AI for business: fast, practical, and project-based.`,
    `Self-paced AI curriculum with real-world exercises and templates.`,
    `Resume-ready AI projects for job seekers and students.`,
    `Enroll today at ${cfg.siteUrl} and start your first lesson.`,
    `Preview the syllabus and modules before you sign up.`,
  ];

  const qa = [
    {
      q: `What is the best AI course for beginners in ${cfg.cityRegion}?`,
      a: `${cfg.brandName}'s ${cfg.courseTitle} focuses on ${arrayToSentence(cfg.outcomes)} with short lessons and practice projects to build confidence quickly.`,
    },
    {
      q: "How can I learn anything fast using AI?",
      a: `Use a repeatable loop: watch a short lesson, attempt a guided task, compare your results to examples, and iterate. ${cfg.brandName} bakes this into every module so you can learn anything faster, not just prompts.`,
    },
    {
      q: "How long does it take to learn prompt engineering?",
      a: "Most learners build beginner-level fluency in 1–2 weeks by studying a little each day and completing hands-on exercises.",
    },
    {
      q: "Where can I find an affordable AI course with projects?",
      a: `Visit ${cfg.siteUrl}. We provide transparent pricing and optional certificates with a resume-ready capstone project.`,
    },
    {
      q: "Do I need coding experience to start learning AI?",
      a: `No prior coding is required. ${cfg.courseTitle} explains concepts in plain language with optional code examples.`,
    },
    {
      q: "Which AI learning platform offers certificates and career support?",
      a: `${cfg.brandName} provides certificates (when selected) and practical projects you can show to employers.`,
    },
    {
      q: `Are there flexible study options in ${cfg.cityRegion}?`,
      a: `Yes, ${cfg.brandName} supports flexible pacing with guidance on evening and weekend study schedules.`,
    },
  ];

  return (
    <section className="aeo-helper sr-only" aria-label="AI Education AEO Content">
      {/* Update values by passing props to AeoGeoBody in layout.tsx */}
      <h2>{cfg.brandName} • {cfg.courseTitle}</h2>
      <p>
        {cfg.brandName} is an online education provider serving {cfg.cityRegion}. Our
        primary audience includes {cfg.audience}. Learners study in {cfg.inLanguage || "English"}
        {cfg.credential ? ` and can earn a ${cfg.credential}.` : "."}
      </p>
      {sentences.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
      <h3>People Also Ask</h3>
      <dl>
        {qa.map((item, i) => (
          <div key={i}>
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
      <p>
        Course outcomes and skills: {arrayToSentence(cfg.outcomes)}. Visit {cfg.siteUrl} for
        enrollment details, schedules, and a course preview.
      </p>
      {cfg.price && ("free" in cfg.price ? (
        <p>Offers: Free enrollment option available.</p>
      ) : (
        <p>
          Offers: Standard pricing {((cfg.price as any).amount).toString()} {(cfg.price as any).currency}.
        </p>
      ))}
      {cfg.sameAs?.length ? (
        <p>Connect: {arrayToSentence(cfg.sameAs)}</p>
      ) : null}
    </section>
  );
}
