/*
  YouTube validation and normalization utilities.
  - Extract video ID from various URL shapes
  - Reject shorts/live
  - Validate embeddability via oEmbed and YouTube Data API v3
*/

const YT_OEMBED = "https://www.youtube.com/oembed";
const YT_VIDEO_URL = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const YT_EMBED_URL = (id: string) => `https://www.youtube-nocookie.com/embed/${id}`;

export type YouTubeValidationReason =
  | "ok"
  | "invalid_url"
  | "shorts"
  | "live"
  | "private"
  | "age_restricted"
  | "embed_disabled"
  | "region_blocked"
  | "not_found"
  | "unknown";

export type YouTubeValidation = {
  embeddable: boolean;
  id: string | null;
  embedUrl: string | null;
  watchUrl: string | null;
  reason: YouTubeValidationReason;
  title?: string;
  author?: string;
  thumbnail?: string;
};

export function extractYouTubeId(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }

    if (host.endsWith("youtube.com")) {
      const path = url.pathname;
      if (path === "/watch") {
        const v = url.searchParams.get("v");
        return v && v.length === 11 ? v : null;
      }
      const parts = path.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "v") && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      if (parts[0] === "shorts" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      if (parts[0] === "live" && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
    }
  } catch {
    /* ignore */
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = rawUrl.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

function isShortsOrLive(rawUrl: string): YouTubeValidationReason | null {
  try {
    const url = new URL(rawUrl);
    const path = url.pathname;
    if (/\/shorts\//.test(path)) return "shorts";
    if (/^\/live(\/|$)/.test(path)) return "live";
  } catch {
    // ignore
  }
  return null;
}

type OEmbedResult = {
  ok: boolean;
  status: number;
  data?: any | null;
};

async function fetchOEmbed(url: string): Promise<OEmbedResult> {
  try {
    const r = await fetch(`${YT_OEMBED}?url=${encodeURIComponent(url)}&format=json`);
    if (!r.ok) return { ok: false, status: r.status };
    const data = await r.json();
    return { ok: true, status: r.status, data };
  } catch {
    return { ok: false, status: 0 };
  }
}

type YTApiVideoItem = {
  id: string;
  status?: { embeddable?: boolean; privacyStatus?: string };
  contentDetails?: {
    regionRestriction?: { allowed?: string[]; blocked?: string[] };
    contentRating?: { ytRating?: string };
  };
  snippet?: { liveBroadcastContent?: string };
};

async function fetchVideoStatus(id: string) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";
  if (!apiKey) return null;
  const params = new URLSearchParams({
    id,
    key: apiKey,
    part: "status,contentDetails,snippet",
    fields:
      "items(id,status/embeddable,status/privacyStatus,contentDetails/regionRestriction,contentDetails/contentRating/ytRating,snippet/liveBroadcastContent)",
  });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
  if (!r.ok) return null;
  const data = await r.json();
  const item: YTApiVideoItem | undefined = data.items?.[0];
  return item || null;
}

export async function validateYouTubeUrl(rawUrl: string): Promise<YouTubeValidation> {
  const reasonShortLive = isShortsOrLive(rawUrl);
  if (reasonShortLive) {
    return {
      embeddable: false,
      id: extractYouTubeId(rawUrl),
      embedUrl: null,
      watchUrl: null,
      reason: reasonShortLive,
    };
  }

  const id = extractYouTubeId(rawUrl);
  if (!id) {
    return {
      embeddable: false,
      id: null,
      embedUrl: null,
      watchUrl: null,
      reason: "invalid_url",
    };
  }

  // oEmbed check (fast, catches removed/private/unavailable reliably)
  const oembed = await fetchOEmbed(rawUrl);

  // YouTube Data API for detailed status
  const status = await fetchVideoStatus(id);
  let embeddable = true;
  let reason: YouTubeValidationReason = "ok";
  let available = !!oembed?.ok; // Default: only trust links with successful oEmbed

  if (status) {
    const isEmbeddable = status.status?.embeddable !== false; // undefined -> assume true
    const privacy = status.status?.privacyStatus;
    const ytRating = status.contentDetails?.contentRating?.ytRating;
    const live = status.snippet?.liveBroadcastContent && status.snippet.liveBroadcastContent !== "none";
    const rr = status.contentDetails?.regionRestriction;

    if (!isEmbeddable) {
      embeddable = false;
      reason = "embed_disabled";
    }
    if (privacy === "private" || privacy === "unlisted" && !isEmbeddable) {
      embeddable = false;
      reason = privacy === "private" ? "private" : reason;
      available = false;
    }
    if (ytRating === "ytAgeRestricted") {
      // Age-restricted may still be available on YouTube; keep available true but be cautious for embed
      embeddable = false;
      reason = "age_restricted";
    }
    if (live) {
      embeddable = false;
      reason = "live";
    }
    if (rr && (rr.blocked?.length || rr.allowed?.length)) {
      // If there are any regional restrictions, we conservatively treat as region blocked
      // since we don't know the viewer region on the server.
      // Region-restricted videos often won't play for users; mark as not broadly available
      embeddable = false;
      reason = "region_blocked";
      available = oembed.ok ? true : false;
    }
  } else if (!oembed) {
    // Neither oEmbed nor API returned data; treat as not found or unknown
    embeddable = false;
    reason = "not_found";
    available = false;
  }

  // If oEmbed failed with API present, we already set embeddable appropriately
  // If oEmbed succeeded and API didn't contradict, allow embedding

  const base: YouTubeValidation = {
    embeddable,
    id,
    embedUrl: embeddable ? YT_EMBED_URL(id) : null,
    // Only provide a watch URL if we believe it's available; this lets callers filter dead links
    watchUrl: available ? YT_VIDEO_URL(id) : null,
    reason,
  };

  if (oembed?.ok && oembed.data && typeof oembed.data === "object") {
    base.title = oembed.data.title;
    base.author = oembed.data.author_name;
    base.thumbnail = oembed.data.thumbnail_url;
  }
  return base;
}
