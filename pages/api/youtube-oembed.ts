import type { NextApiRequest, NextApiResponse } from "next";

// Enhanced oEmbed check to validate YouTube videos and return metadata.
// Returns video title, author, thumbnail if video exists and is embeddable.
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
      // Video doesn't exist, is private, or embedding is disabled
      return res.status(404).json({
        error: "Video not found or not embeddable",
        embeddable: false,
      });
    }

    const data = await r.json();

    // Validate we got proper metadata
    if (data && data.title && data.author_name) {
      return res.status(200).json({
        ok: true,
        embeddable: true,
        title: data.title,
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url,
        width: data.width,
        height: data.height,
      });
    }

    return res.status(400).json({
      error: "Incomplete video metadata",
      embeddable: false,
    });
  } catch (e) {
    console.error("YouTube oEmbed error:", e);
    // Be conservative: don't block on network errors
    // Return 200 but indicate we couldn't verify
    return res.status(200).json({
      ok: true,
      embeddable: true,
      verified: false,
      note: "Could not verify - network error",
    });
  }
}
