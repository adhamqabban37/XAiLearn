const GH_MODELS_ENDPOINT =
  process.env.GH_MODELS_ENDPOINT || "https://models.github.ai/inference";
const GH_MODELS_MODEL = process.env.GH_MODELS_MODEL || "gpt-4o-mini";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

export async function* githubModelsChatStream(
  prompt: string,
  opts: { system?: string; timeout?: number; model?: string } = {}
) {
  if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN in environment.");

  const ctrl = new AbortController();
  const timeout = opts.timeout ?? 300_000;
  const id = setTimeout(() => ctrl.abort(), timeout);

  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });

  const res = await fetch(`${GH_MODELS_ENDPOINT}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model: opts.model || GH_MODELS_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192,
    }),
    signal: ctrl.signal,
  });
  clearTimeout(id);

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub Models error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    // SSE lines prefixed with 'data: '
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      if (line === "data: [DONE]") return;
      if (!line.startsWith("data:")) continue;
      try {
        const json = JSON.parse(line.slice(5).trim());
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content as string;
      } catch {
        // ignore malformed partial lines
      }
    }
  }
}

export async function githubModelsGenerate(
  prompt: string,
  opts: { system?: string; timeout?: number; model?: string } = {}
): Promise<string> {
  let result = "";
  for await (const chunk of githubModelsChatStream(prompt, opts))
    result += chunk;
  return result;
}
