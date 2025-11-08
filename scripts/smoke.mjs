// Simple smoke test: hit each API flow and print the response
const baseUrl = process.env.BASE_URL || "http://localhost:9010";

async function postJson(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, text };
  }
}

(async () => {
  try {
    console.log("Smoke test against", baseUrl);

    const audit = await postJson("/api/genkit/auditCourse", {
      courseContent:
        "Intro to AI: Module 1 - Basics. Lesson 1 - What is AI? Include 2 key points and 1 quiz.",
    });
    console.log("\n/auditCourse =>", JSON.stringify(audit, null, 2));

    const genQuiz = await postJson("/api/genkit/generateQuizQuestions", {
      textContent:
        "AI enables machines to perform tasks that typically require human intelligence, such as perception, reasoning, and learning.",
    });
    console.log(
      "\n/generateQuizQuestions =>",
      JSON.stringify(genQuiz, null, 2)
    );

    const suggest = await postJson("/api/genkit/suggestMissingContent", {
      courseContent:
        "Course: Web Basics. Module: HTML. Lesson: Tags overview. Missing time estimates and resources.",
    });
    console.log(
      "\n/suggestMissingContent =>",
      JSON.stringify(suggest, null, 2)
    );

    const analyze = await postJson("/api/genkit/analyzeDocument", {
      textContent:
        "Docker is a platform for building, running, and shipping containers. Explain images, containers, and Dockerfiles.",
    });
    console.log("\n/analyzeDocument =>", JSON.stringify(analyze, null, 2));
  } catch (err) {
    console.error("Smoke test failed:", err);
    process.exit(1);
  }
})();
