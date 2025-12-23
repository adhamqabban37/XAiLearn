const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || "";
const GOOGLE_MODEL = "gemini-1.5-flash-latest";

export async function* googleGenerateStream(
  prompt: string,
  opts: { system?: string; timeout?: number } = {}
) {
  if (!GOOGLE_GENAI_API_KEY) {
    throw new Error(
      "Google GenAI is selected but GOOGLE_GENAI_API_KEY is missing. Set a valid key."
    );
  }

  const ctrl = new AbortController();
  const timeout = opts.timeout || 300_000;
  const id = setTimeout(() => ctrl.abort(), timeout);

  const contents = [];
  // Google's system instructions should conceptually be part of the prompt
  // or sent as system_instruction if supported, but prepending is safe.
  let fullPrompt = prompt;
  if (opts.system) {
    fullPrompt = `System: ${opts.system}\n\nUser: ${prompt}`;
  }

  contents.push({
    role: "user",
    parts: [{ text: fullPrompt }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_MODEL}:streamGenerateContent?key=${GOOGLE_GENAI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
    signal: ctrl.signal,
  });

  clearTimeout(id);

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google GenAI error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buf += decoder.decode(value, { stream: true });

    // Process buffer for complete JSON objects
    // The stream returns an array: [ {...}, {...} ]
    // or just separated objects depending on the API version, but usually it's a JSON array.
    // We will look for objects bounded by { and } that contain "candidates".

    // Simple parser: split by "}\n,\n{" or similar boundaries isn't robust.
    // Instead, we scan for balanced braces if we want to be correct,
    // or just look for the specific field we need.

    // Valid hack for this specific API: response chunks are usually well-formed JSON objects
    // extracted from the array.

    // Let's try to parse the buffer as much as possible.
    // Since it's a stream of an array, we might get `[` at the start.
    if (buf.startsWith("[")) {
      buf = buf.slice(1); // remove starting [
    }

    // remove potential leading comma
    if (buf.startsWith(",")) {
      buf = buf.slice(1);
    }

    buf = buf.trim();

    // Try to find the end of the first object
    // We assume objects don't contain unescaped } except at the end.
    // A simplified approach: accumulate until we can parse a valid JSON object.

    let boundary = buf.indexOf("}");
    while (boundary !== -1) {
      const candidate = buf.slice(0, boundary + 1);
      try {
        const json = JSON.parse(candidate);
        // If successful, yield content and strip from buf
        if (
          json.candidates &&
          json.candidates[0] &&
          json.candidates[0].content &&
          json.candidates[0].content.parts
        ) {
          const text = json.candidates[0].content.parts[0].text;
          if (text) yield text;
        }

        buf = buf.slice(boundary + 1).trim();
        if (buf.startsWith(",")) {
          buf = buf.slice(1).trim();
        }
        boundary = buf.indexOf("}");
      } catch (e) {
        // Not a complete object yet, find next }
        boundary = buf.indexOf("}", boundary + 1);
      }
    }
  }
}
