import type { NextApiRequest, NextApiResponse } from "next";
import { validateYouTubeUrl } from "@/lib/youtube";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });
  const raw = (req.query.url as string) || "";
  if (!raw) return res.status(400).json({ error: "Missing url" });
  try {
    const validated = await validateYouTubeUrl(raw);
    // Cache for a short time to reduce API load
    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    );
    return res.status(200).json(validated);
  } catch (e: any) {
    return res.status(200).json({
      embeddable: false,
      id: null,
      embedUrl: null,
      watchUrl: null,
      reason: "unknown",
      note: e?.message || "Validation failed",
    });
  }
}
