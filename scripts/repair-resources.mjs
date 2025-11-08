#!/usr/bin/env node

/*
  CLI: Batch-verify and auto-repair YouTube resources using oEmbed + YouTube Data API.
  Usage:
    node scripts/repair-resources.mjs input.json [output.json]

  Input format:
    - Array of resources: [{ type: "video"|"article"|"docs", title: string, url: string, ... }]
    - Or object with { resources: [...] }

  Output: Writes updated JSON to file or stdout with possibly replaced YouTube URLs.
*/

import fs from "node:fs";
import path from "node:path";

const YT_OEMBED = "https://www.youtube.com/oembed";
const YT_VIDEO_URL = (id) => `https://www.youtube.com/watch?v=${id}`;
const YT_EMBED_URL = (id) => `https://www.youtube-nocookie.com/embed/${id}`;

function extractYouTubeId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    if (host.endsWith("youtube.com")) {
      const p = url.pathname;
      if (p === "/watch") {
        const v = url.searchParams.get("v");
        return v && v.length === 11 ? v : null;
      }
      const parts = p.split("/").filter(Boolean);
      if ((parts[0] === "embed" || parts[0] === "v") && parts[1]) {
        return parts[1].length === 11 ? parts[1] : null;
      }
      if (parts[0] === "shorts" && parts[1])
        return parts[1].length === 11 ? parts[1] : null;
      if (parts[0] === "live" && parts[1])
        return parts[1].length === 11 ? parts[1] : null;
    }
  } catch {}
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = rawUrl.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

async function fetchOEmbed(url) {
  try {
    const r = await fetch(
      `${YT_OEMBED}?url=${encodeURIComponent(url)}&format=json`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchVideoStatus(id, apiKey) {
  if (!apiKey) return null;
  const params = new URLSearchParams({
    id,
    key: apiKey,
    part: "status,contentDetails,snippet",
    fields:
      "items(id,status/embeddable,status/privacyStatus,contentDetails/regionRestriction,contentDetails/contentRating/ytRating,snippet/liveBroadcastContent,snippet/title,snippet/description,snippet/channelTitle)",
  });
  const r = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
  );
  if (!r.ok) return null;
  const data = await r.json();
  return (data.items || [])[0] || null;
}

async function searchYouTubeCandidates(query, apiKey, maxResults = 5) {
  if (!apiKey) return [];
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    type: "video",
    part: "snippet",
    maxResults: String(maxResults),
    safeSearch: "moderate",
  });
  const r = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
  );
  if (!r.ok) return [];
  const data = await r.json();
  const items = data.items || [];
  return items
    .map((it) => ({
      id: it.id?.videoId,
      title: it.snippet?.title,
      description: it.snippet?.description,
      channelTitle: it.snippet?.channelTitle,
      thumbnail:
        it.snippet?.thumbnails?.high?.url ||
        it.snippet?.thumbnails?.default?.url,
    }))
    .filter((x) => x.id);
}

function isEmbeddableFromStatus(status) {
  if (!status) return false;
  const isEmbeddable = status.status?.embeddable !== false;
  const privacy = status.status?.privacyStatus;
  const live =
    status.snippet?.liveBroadcastContent &&
    status.snippet.liveBroadcastContent !== "none";
  const ytRating = status.contentDetails?.contentRating?.ytRating;
  const rr = status.contentDetails?.regionRestriction;
  const regionRestricted = !!(rr && (rr.blocked?.length || rr.allowed?.length));
  return (
    isEmbeddable &&
    privacy !== "private" &&
    !live &&
    ytRating !== "ytAgeRestricted" &&
    !regionRestricted
  );
}

async function processResource(res, apiKey) {
  if (!res || !res.url || res.type !== "video") return res;
  const url = res.url;
  const id = extractYouTubeId(url);
  const o = await fetchOEmbed(url);
  const status = id ? await fetchVideoStatus(id, apiKey) : null;
  const embeddable = !!o || isEmbeddableFromStatus(status);
  if (embeddable) return res; // keep original

  // try replacement by title
  if (res.title) {
    const candidates = await searchYouTubeCandidates(res.title, apiKey, 6);
    for (const c of candidates) {
      const s = await fetchVideoStatus(c.id, apiKey);
      if (isEmbeddableFromStatus(s)) {
        return {
          ...res,
          url: YT_VIDEO_URL(c.id),
          _replaced: true,
          _replacementId: c.id,
          _embedUrl: YT_EMBED_URL(c.id),
          _watchUrl: YT_VIDEO_URL(c.id),
        };
      }
    }
  }
  return { ...res, _replaced: false, _reason: "not_embeddable" };
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error(
      "Usage: node scripts/repair-resources.mjs input.json [output.json]"
    );
    process.exit(1);
  }
  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    "";
  const raw = fs.readFileSync(path.resolve(inputPath), "utf8");
  const data = JSON.parse(raw);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data.resources)
    ? data.resources
    : [];
  const repaired = [];
  for (const r of list) {
    // eslint-disable-next-line no-await-in-loop
    const out = await processResource(r, apiKey);
    repaired.push(out);
  }
  const output = Array.isArray(data)
    ? repaired
    : { ...data, resources: repaired };
  const json = JSON.stringify(output, null, 2);
  if (outputPath) {
    fs.writeFileSync(path.resolve(outputPath), json);
  } else {
    process.stdout.write(json + "\n");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
