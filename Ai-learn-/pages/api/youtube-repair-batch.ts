import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateYouTubeUrl,
  extractYouTubeId,
} from "@/lib/youtube";

// Runtime config for Node.js environment
export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};

export const dynamic = "force-dynamic";

function isYouTubeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
    return h.endsWith("youtube.com") || h === "youtu.be";
  } catch {
    return false;
  }
}

function isPlaylistUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return !!u.searchParams.get("list") || u.pathname.includes("/playlist");
  } catch {
    return false;
  }
}

// Simple in-memory rate limiter per IP: 10 req/min
const ipHits: Map<string, number[]> = new Map();
function getClientIp(req: NextApiRequest): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  const ip = fwd.split(",")[0].trim() || (req.socket as any)?.remoteAddress || "unknown";
  return ip;
}
function rateLimit(req: NextApiRequest, limit = 10, windowMs = 60_000): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const arr = ipHits.get(ip) || [];
  const fresh = arr.filter((t) => now - t < windowMs);
  if (fresh.length >= limit) {
    ipHits.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  ipHits.set(ip, fresh);
  return true;
}

// Process items with concurrency limit
async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency = 3
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// Retry wrapper for external API calls
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  return null;
}

/*
  POST /api/youtube-repair-batch
  Body: { items: Array<{ url: string; title?: string }> }
  
  Always returns HTTP 200 with JSON:
  {
    ok: boolean,
    results: Array<{
      originalUrl: string,
      title?: string,
      ok: boolean,
      reason: string,
      embedUrl: string | null,
      openUrl: string,
      author?: string,
      thumbnail?: string,
      note?: string
    }>
  }
*/
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(200).json({ 
      ok: false,
      reason: "method_not_allowed",
      results: [],
    });
  }

  // Feature flag - return clean responses, not 503
  if (process.env.ENABLE_VIDEO_REPAIR !== "true") {
    const { items } = (req.body || {}) as {
      items?: Array<{ url: string; title?: string }>;
    };
    const results = (items || []).map(item => {
      const id = extractYouTubeId(item.url);
      return {
        originalUrl: item.url,
        title: item.title,
        ok: true,
        reason: "repair_disabled",
        embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
        openUrl: id ? `https://www.youtube.com/watch?v=${id}` : item.url,
        note: "Video repair feature is currently disabled",
      };
    });
    return res.status(200).json({ ok: true, results });
  }

  // Admin auth
  const token = (req.headers["x-admin-token"] as string) || "";
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    const { items } = (req.body || {}) as {
      items?: Array<{ url: string; title?: string }>;
    };
    const results = (items || []).map(item => {
      const id = extractYouTubeId(item.url);
      return {
        originalUrl: item.url,
        title: item.title,
        ok: true,
        reason: "unauthorized",
        embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
        openUrl: id ? `https://www.youtube.com/watch?v=${id}` : item.url,
        note: "Authentication required for video repair",
      };
    });
    return res.status(200).json({ ok: true, results });
  }

  // Rate limit
  if (!rateLimit(req)) {
    const { items } = (req.body || {}) as {
      items?: Array<{ url: string; title?: string }>;
    };
    const results = (items || []).map(item => {
      const id = extractYouTubeId(item.url);
      return {
        originalUrl: item.url,
        title: item.title,
        ok: true,
        reason: "rate_limited",
        embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
        openUrl: id ? `https://www.youtube.com/watch?v=${id}` : item.url,
        note: "Rate limit exceeded, try again later",
      };
    });
    return res.status(200).json({ ok: true, results });
  }

  try {
    const { items } = (req.body || {}) as {
      items?: Array<{ url: string; title?: string }>;
    };
    
    if (!Array.isArray(items)) {
      return res.status(200).json({ 
        ok: false,
        reason: "invalid_body",
        results: [],
        note: "Body must include array: items",
      });
    }

    console.log(`[${new Date().toISOString()}] youtube-repair-batch attempt`, { count: items.length });

    // Process items with concurrency control
    const out = await processBatch(items, async (item) => {
      const url = String(item?.url || "");
      const title = item?.title || "";

      if (!isYouTubeUrl(url) || isPlaylistUrl(url)) {
        return {
          originalUrl: url,
          title,
          ok: true,
          reason: isPlaylistUrl(url) ? "playlist" : "invalid_url",
          embedUrl: null,
          openUrl: url,
        };
      }

      // Validate with retry logic
      const validated = await withRetry(() => validateYouTubeUrl(url));
      
      if (!validated) {
        const id = extractYouTubeId(url);
        return {
          originalUrl: url,
          title,
          ok: true,
          reason: "validation_failed",
          embedUrl: null,
          openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url,
          note: "Could not validate video, external link provided",
        };
      }

      if (validated.embeddable) {
        return {
          originalUrl: url,
          title,
          ok: true,
          reason: "ok",
          embedUrl: validated.embedUrl,
          openUrl: validated.watchUrl,
          author: validated.author,
          thumbnail: validated.thumbnail,
        };
      }

      // Not embeddable
      return {
        originalUrl: url,
        title,
        ok: true,
        reason: validated.reason || "unembeddable",
        embedUrl: null,
        openUrl: validated.watchUrl || url,
        author: validated.author,
        thumbnail: validated.thumbnail,
        note: "Video cannot be embedded, external link provided",
      };
    }, 3); // Process 3 items concurrently

    res.setHeader(
      "Cache-Control",
      "public, max-age=120, s-maxage=120, stale-while-revalidate=300"
    );
    return res.status(200).json({ ok: true, results: out });
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] youtube-repair-batch error`, e);
    return res.status(200).json({ 
      ok: false,
      reason: "error",
      results: [],
      note: "An error occurred during batch processing",
    });
  }
}
