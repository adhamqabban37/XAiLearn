const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

export async function* ollamaGenerateStream(
  prompt: string,
  opts: { system?: string; timeout?: number } = {}
) {
  const ctrl = new AbortController();
  const timeout = opts.timeout || 300_000; // 5 minutes default
  const id = setTimeout(() => ctrl.abort(), timeout);

  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      system: opts.system,
      stream: true,
    }),
    signal: ctrl.signal,
  });
  clearTimeout(id);

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${text}`);
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
      if (!line) continue;
      try {
        const json = JSON.parse(line);
        if (json.response) yield json.response as string;
        if (json.done) return;
      } catch {
        /* skip partial lines */
      }
    }
  }
}

export async function ollamaEmbed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status}`);
  const data = await res.json();
  // data.embedding or data.data[0].embedding depending on server version
  return data.embedding || (data.data?.[0]?.embedding ?? []);
}
