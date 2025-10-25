import type { NextApiRequest, NextApiResponse } from "next";
import {
  validateYouTubeUrl,
  extractYouTubeId,
} from "@/lib/youtube";

// Runtime config for Node.js environment
export const config = {
  runtime: "nodejs",
  maxDuration: 60,
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

/*
  POST /api/youtube-repair
  Body: { url: string; title?: string }
  
  Always returns HTTP 200 with JSON:
  {
    ok: boolean,
    reason: string,
    embedUrl: string | null,
    openUrl: string,
    title?: string,
    author?: string,
    thumbnail?: string,
    note?: string
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
      embedUrl: null,
      openUrl: null,
    });
  }

  // Feature flag - return clean responses, not 503
  if (process.env.ENABLE_VIDEO_REPAIR !== "true") {
    const { url } = (req.body || {}) as { url?: string };
    const id = url ? extractYouTubeId(url) : null;
    return res.status(200).json({ 
      ok: true,
      reason: "repair_disabled",
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
      openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url || null,
      note: "Video repair feature is currently disabled",
    });
  }

  // Admin auth
  const token = (req.headers["x-admin-token"] as string) || "";
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    const { url } = (req.body || {}) as { url?: string };
    const id = url ? extractYouTubeId(url) : null;
    return res.status(200).json({ 
      ok: true,
      reason: "unauthorized",
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
      openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url || null,
      note: "Authentication required for video repair",
    });
  }

  // Rate limit
  if (!rateLimit(req)) {
    const { url } = (req.body || {}) as { url?: string };
    const id = url ? extractYouTubeId(url) : null;
    return res.status(200).json({ 
      ok: true,
      reason: "rate_limited",
      embedUrl: id ? `https://www.youtube-nocookie.com/embed/${id}` : null,
      openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url || null,
      note: "Rate limit exceeded, try again later",
    });
  }

  try {
    const { url, title } = (req.body || {}) as { url?: string; title?: string };
    
    if (!url) {
      return res.status(200).json({ 
        ok: false,
        reason: "missing_url",
        embedUrl: null,
        openUrl: null,
      });
    }
    
    if (!isYouTubeUrl(url)) {
      return res.status(200).json({ 
        ok: false,
        reason: "invalid_url",
        embedUrl: null,
        openUrl: url,
      });
    }
    
    if (isPlaylistUrl(url)) {
      return res.status(200).json({ 
        ok: true,
        reason: "playlist",
        embedUrl: null,
        openUrl: url,
        note: "Playlists cannot be embedded",
      });
    }
    
    console.log(`[${new Date().toISOString()}] youtube-repair attempt`, { url, title });

    // Validate with retry logic
    let validated = null as any;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        validated = await validateYouTubeUrl(url);
        break;
      } catch (err) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    
    if (!validated) {
      const id = extractYouTubeId(url);
      return res.status(200).json({
        ok: true,
        reason: "validation_failed",
        embedUrl: null,
        openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url,
        title: title || "Video",
        note: "Could not validate video, external link provided",
      });
    }
    
    if (validated.embeddable) {
      return res.status(200).json({ 
        ok: true,
        reason: "ok",
        embedUrl: validated.embedUrl,
        openUrl: validated.watchUrl,
        title: validated.title,
        author: validated.author,
        thumbnail: validated.thumbnail,
        replaced: false,
      });
    }

    // Return clean response with fallback
    return res.status(200).json({
      ok: true,
      reason: validated.reason || "unembeddable",
      embedUrl: null,
      openUrl: validated.watchUrl || url,
      title: validated.title || title || "Video",
      author: validated.author,
      thumbnail: validated.thumbnail,
      note: "Video cannot be embedded, external link provided",
    });
  } catch (e: any) {
    console.error(`[${new Date().toISOString()}] youtube-repair error`, e);
    const { url } = (req.body || {}) as { url?: string };
    const id = url ? extractYouTubeId(url) : null;
    return res.status(200).json({
      ok: true,
      reason: "error",
      embedUrl: null,
      openUrl: id ? `https://www.youtube.com/watch?v=${id}` : url || null,
      note: "An error occurred, external link provided",
    });
  }
}
