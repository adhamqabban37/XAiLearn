import type { NextApiRequest, NextApiResponse } from "next";
import { validateYouTubeUrl } from "@/lib/youtube";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const { urls } = (req.body || {}) as { urls?: string[] };
    if (!Array.isArray(urls))
      return res.status(400).json({ error: "Body must include array: urls" });

    const results = await Promise.all(
      urls.map((u) => validateYouTubeUrl(String(u || "")))
    );
    const embeds = results.filter((r) => r.embeddable);
    const excluded = results
      .filter((r) => !r.embeddable)
      .map((r, i) => ({ url: urls[i], reason: r.reason }));

    res.setHeader(
      "Cache-Control",
      "public, max-age=300, s-maxage=300, stale-while-revalidate=600"
    );
    return res.status(200).json({ results, embeds, excluded });
  } catch (e: any) {
    return res
      .status(200)
      .json({ results: [], embeds: [], excluded: [], note: e?.message });
  }
}
