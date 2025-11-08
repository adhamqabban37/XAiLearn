const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function* deepseekGenerateStream(
  prompt: string,
  opts: { system?: string; timeout?: number } = {}
) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error(
      "DeepSeek is selected but DEEPSEEK_API_KEY is missing. Set a valid key or switch AI_PROVIDER to 'github'."
    );
  }
  const ctrl = new AbortController();
  const timeout = opts.timeout || 300_000; // 5 minutes default
  const id = setTimeout(() => ctrl.abort(), timeout);

  const messages = [];
  if (opts.system) {
    messages.push({ role: "system", content: opts.system });
  }
  messages.push({ role: "user", content: prompt });

  const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
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
    throw new Error(`DeepSeek API error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    let idx;

    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);

      if (!line || line === "data: [DONE]") continue;
      if (!line.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(line.slice(6)); // Remove "data: " prefix
        const content = json.choices?.[0]?.delta?.content;
        if (content) yield content as string;
        if (json.choices?.[0]?.finish_reason) return;
      } catch {
        /* skip malformed lines */
      }
    }
  }
}

export async function deepseekGenerate(
  prompt: string,
  opts: { system?: string; timeout?: number } = {}
): Promise<string> {
  let result = "";
  for await (const chunk of deepseekGenerateStream(prompt, opts)) {
    result += chunk;
  }
  return result;
}
