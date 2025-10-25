import dotenv from "dotenv";
import process from "node:process";

// Load .env.local explicitly for this standalone script
dotenv.config({ path: ".env.local" });

const endpoint =
  process.env.GH_MODELS_ENDPOINT || "https://models.github.ai/inference";
const model = process.env.GH_MODELS_MODEL || "deepseek/DeepSeek-V3-0324";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error("Missing GITHUB_TOKEN in environment.");
  process.exit(1);
}

async function main() {
  const url = `${endpoint}/chat/completions`;
  const body = {
    model,
    messages: [
      { role: "system", content: "You are a concise assistant." },
      { role: "user", content: "Reply with exactly 5 words that say hello." },
    ],
    temperature: 0.2,
    max_tokens: 64,
    stream: false,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      `GitHub Models request failed: ${res.status} ${res.statusText}\n${text}`
    );
    process.exit(2);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content || "(no content)";
  console.log("Model:", model);
  console.log("Response:", content);
}

main().catch((err) => {
  console.error("Error:", err?.message || err);
  process.exit(3);
});
