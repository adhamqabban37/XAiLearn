import type { NextApiRequest, NextApiResponse } from "next";

// Lightweight oEmbed check to see if YouTube allows embedding for a given URL.
// If YouTube says it's not embeddable, this route returns 400 so the client can fallback.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const url = req.query.url as string | undefined;
  if (!url) {
    return res.status(400).json({ error: "Missing url" });
  }

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url
    )}&format=json`;
    const r = await fetch(oembedUrl, { method: "GET" });

    if (!r.ok) {
      return res.status(400).json({ error: "oEmbed lookup failed" });
    }
    const data = await r.json();
    // Basic signal: title and author_name exist
    if (data && data.title && data.author_name) {
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Not embeddable" });
  } catch (e) {
    // Be conservative: don't block the client on network errors
    return res.status(200).json({ ok: true, note: "network error tolerated" });
  }
}
