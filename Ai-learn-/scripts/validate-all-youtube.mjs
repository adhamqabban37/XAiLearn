#!/usr/bin/env node

/*
  CLI: Validate ALL YouTube links in the project, with optional auto-fix suggestions
  
  This script will:
  1. Find all YouTube URLs in the codebase
  2. Validate each one using the YouTube Data API
  3. Report which ones are working/broken
  4. Suggest replacements for broken ones
  5. Optional: attempt auto-fix by finding embeddable alternatives and write a mapping file
  
  Usage:
    node scripts/validate-all-youtube.mjs [--autofix] [--out replacements.json]
    
  Requirements:
    - YOUTUBE_API_KEY environment variable must be set
*/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const YT_OEMBED = "https://www.youtube.com/oembed";

// Extract YouTube ID from URL
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

// Validate using oEmbed (fast check)
async function validateWithOEmbed(url) {
  try {
    const r = await fetch(
      `${YT_OEMBED}?url=${encodeURIComponent(url)}&format=json`
    );
    if (!r.ok) return { valid: false, reason: "oEmbed failed" };
    const data = await r.json();
    return {
      valid: true,
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
    };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

// Validate using YouTube Data API (detailed check)
async function validateWithDataAPI(id, apiKey) {
  if (!apiKey) return null;
  try {
    const params = new URLSearchParams({
      id,
      key: apiKey,
      part: "status,snippet,contentDetails",
      fields:
        "items(id,status/embeddable,status/privacyStatus,snippet/liveBroadcastContent,snippet/title,snippet/description,snippet/channelTitle,contentDetails/regionRestriction,contentDetails/contentRating/ytRating)",
    });
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
    );
    if (!r.ok) return { valid: false, reason: "API request failed" };
    const data = await r.json();
    const item = (data.items || [])[0];

    if (!item) return { valid: false, reason: "Video not found" };

    const status = item.status || {};
    const snippet = item.snippet || {};
    const contentDetails = item.contentDetails || {};

    // Check various blocking conditions
    const reasons = [];
    if (status.embeddable === false) reasons.push("embed_disabled");
    if (status.privacyStatus === "private") reasons.push("private");
    if (status.privacyStatus === "unlisted" && status.embeddable === false)
      reasons.push("unlisted_non_embeddable");
    if (contentDetails.contentRating?.ytRating === "ytAgeRestricted")
      reasons.push("age_restricted");
    if (snippet.liveBroadcastContent && snippet.liveBroadcastContent !== "none")
      reasons.push("live");

    const rr = contentDetails.regionRestriction;
    if (rr && (rr.blocked?.length || rr.allowed?.length)) {
      reasons.push("region_blocked");
    }

    return {
      valid: reasons.length === 0,
      embeddable: status.embeddable !== false,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      description: snippet.description?.substring(0, 200),
      reasons: reasons.length > 0 ? reasons : ["ok"],
    };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
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
      channelTitle: it.snippet?.channelTitle,
    }))
    .filter((x) => x.id);
}

// Extract YouTube URLs from file content
function extractYouTubeUrls(content, filePath) {
  const urls = [];
  const youtubeRegex =
    /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/live\/)[\w-]+/g;

  let match;
  while ((match = youtubeRegex.exec(content)) !== null) {
    const url = match[0];
    const lineNumber = content.substring(0, match.index).split("\n").length;
    urls.push({ url, filePath, lineNumber });
  }

  return urls;
}

// Recursively scan directory for files
function scanDirectory(
  dir,
  extensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".mjs"]
) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    // Skip node_modules, .next, .git, etc.
    if (
      item.name === "node_modules" ||
      item.name === ".next" ||
      item.name === ".git" ||
      item.name === "dist" ||
      item.name === "build"
    ) {
      continue;
    }

    if (item.isDirectory()) {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (extensions.some((ext) => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes("--autofix") || process.env.AUTOFIX === "1";
  const outIndex = Math.max(0, args.indexOf("--out"));
  const outPath = outIndex > -1 ? args[outIndex + 1] : null;
  console.log("🔍 Scanning project for YouTube URLs...\n");

  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    "";
  if (!apiKey) {
    console.log(
      "⚠️  Warning: No YOUTUBE_API_KEY found. Will use oEmbed only (less detailed validation).\n"
    );
  }

  // Scan project root
  const projectRoot = path.resolve(__dirname, "..");
  const files = scanDirectory(projectRoot);

  console.log(`📁 Found ${files.length} files to scan\n`);

  // Extract all YouTube URLs
  const allUrls = [];
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const urls = extractYouTubeUrls(
        content,
        path.relative(projectRoot, filePath)
      );
      allUrls.push(...urls);
    } catch (err) {
      // Skip files that can't be read
    }
  }

  // Remove duplicates
  const uniqueUrls = new Map();
  for (const item of allUrls) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, [item]);
    } else {
      uniqueUrls.get(item.url).push(item);
    }
  }

  console.log(`📹 Found ${uniqueUrls.size} unique YouTube URLs\n`);

  if (uniqueUrls.size === 0) {
    console.log("✅ No YouTube URLs found in the project.");
    return;
  }

  // Validate each URL
  const results = [];
  let index = 0;

  for (const [url, locations] of uniqueUrls.entries()) {
    index++;
    console.log(`[${index}/${uniqueUrls.size}] Checking: ${url}`);

    const id = extractYouTubeId(url);
    if (!id) {
      results.push({
        url,
        locations,
        status: "invalid",
        reason: "Could not extract video ID",
      });
      continue;
    }

    // Check with oEmbed first (fast)
    const oEmbedResult = await validateWithOEmbed(url);

    // If we have API key, also check with Data API for detailed info
    let apiResult = null;
    if (apiKey) {
      apiResult = await validateWithDataAPI(id, apiKey);
    }

    const finalResult = apiResult || oEmbedResult;

    results.push({
      url,
      id,
      locations,
      status: finalResult.valid ? "valid" : "invalid",
      ...finalResult,
    });

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Print results
  console.log("\n" + "=".repeat(80));
  console.log("📊 VALIDATION RESULTS");
  console.log("=".repeat(80) + "\n");

  const valid = results.filter((r) => r.status === "valid");
  const invalid = results.filter((r) => r.status === "invalid");

  console.log(`✅ Valid URLs: ${valid.length}`);
  console.log(`❌ Invalid URLs: ${invalid.length}\n`);

  if (invalid.length > 0) {
    console.log("❌ INVALID/BROKEN URLs:\n");
    for (const result of invalid) {
      console.log(`URL: ${result.url}`);
      console.log(`ID: ${result.id || "N/A"}`);
      console.log(
        `Reason: ${result.reason || result.reasons?.join(", ") || "Unknown"}`
      );
      console.log(`Found in:`);
      for (const loc of result.locations) {
        console.log(`  - ${loc.filePath}:${loc.lineNumber}`);
      }
      console.log();
    }
  }

  if (valid.length > 0) {
    console.log("✅ VALID URLs:\n");
    for (const result of valid) {
      console.log(`URL: ${result.url}`);
      console.log(`Title: ${result.title || "N/A"}`);
      console.log(`Channel: ${result.author || result.channelTitle || "N/A"}`);
      if (
        result.reasons &&
        result.reasons.length > 0 &&
        result.reasons[0] !== "ok"
      ) {
        console.log(`⚠️  Notes: ${result.reasons.join(", ")}`);
      }
      console.log(`Found in ${result.locations.length} location(s)`);
      console.log();
    }
  }

  // Attempt auto-fix if requested
  let replacements = [];
  if (autoFix && invalid.length > 0 && apiKey) {
    if (process.env.ENABLE_VIDEO_REPAIR !== "true") {
      console.log("\n⏸️  Auto-fix disabled: ENABLE_VIDEO_REPAIR is not 'true'. Skipping replacement search.\n");
    } else {
    console.log("\n🛠  Attempting auto-fix for broken videos...\n");
    for (const result of invalid) {
      const { url } = result;
      // Prefer oEmbed title if present; else derive simple topic from file path
      const topic =
        result.title ||
        (result.locations?.[0]?.filePath || "").split(path.sep).slice(-3).join(" ") ||
        "tech tutorial";
      const queryCandidates = [topic, `${topic} tutorial`, `${topic} explained`];
      let fixed = null;
      for (const q of queryCandidates) {
        const candidates = await searchYouTubeCandidates(q, apiKey, 6);
        for (const c of candidates) {
          const api = await validateWithDataAPI(c.id, apiKey);
          if (api && api.embeddable) {
            fixed = { url, replacementId: c.id, replacementTitle: c.title };
            break;
          }
        }
        if (fixed) break;
      }
      if (fixed) {
        replacements.push(fixed);
        console.log(`✅ Replacement found for ${url} → ${fixed.replacementId}`);
      } else {
        console.log(`⚠️  No replacement found for ${url}`);
      }
    }

      if (replacements.length > 0) {
        const payload = { generatedAt: new Date().toISOString(), replacements };
        if (outPath) {
          fs.writeFileSync(path.resolve(outPath), JSON.stringify(payload, null, 2));
          console.log(`\n📝 Wrote replacements to ${outPath}`);
        } else {
          console.log("\n📝 Suggested replacements:\n" + JSON.stringify(payload, null, 2));
        }
      }
    }
  }

  // Summary
  console.log("=".repeat(80));
  console.log("📝 SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total URLs scanned: ${uniqueUrls.size}`);
  console.log(`✅ Working: ${valid.length}`);
  console.log(`❌ Broken: ${invalid.length}`);
  console.log(
    `📈 Success rate: ${((valid.length / uniqueUrls.size) * 100).toFixed(1)}%`
  );

  if (invalid.length > 0) {
    console.log(
      "\n💡 Recommendation: Run the repair script to fix broken URLs:"
    );
    console.log("   npm run repair:resources input.json output.json");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
