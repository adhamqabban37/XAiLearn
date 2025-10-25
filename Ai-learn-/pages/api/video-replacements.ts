import type { NextApiRequest, NextApiResponse } from "next";
import { listVideoReplacements } from "@/lib/video-log";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const limit = Math.min(
    200,
    Number.parseInt(String(req.query.limit || "50"), 10) || 50
  );
  try {
    const items = await listVideoReplacements(limit);
    res.setHeader(
      "Cache-Control",
      "public, max-age=15, s-maxage=15, stale-while-revalidate=60"
    );
    return res.status(200).json({ items });
  } catch (e: any) {
    return res.status(200).json({ items: [], note: e?.message || "err" });
  }
}
