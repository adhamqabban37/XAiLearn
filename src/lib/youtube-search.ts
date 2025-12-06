/**
 * YouTube Search and Semantic Video Matching
 *
 * This module provides:
 * 1. YouTube Data API v3 search functionality
 * 2. Semantic matching of PDF videos to course lessons
 * 3. Video ranking and filtering for educational content
 */

import { validateYouTubeUrl, type YouTubeValidation } from "./youtube";

export type YouTubeSearchResult = {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  embedUrl: string;
  watchUrl: string;
  viewCount?: number;
  duration?: string;
};

export type ValidatedVideo = {
  id: string;
  title: string;
  watchUrl: string;
  embedUrl: string;
  author?: string;
  thumbnail?: string;
};

export type LessonWithQuery = {
  lessonId: string;
  lessonTitle: string;
  keyPoints: string[];
  videoSearchQuery?: string;
};

const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Search YouTube Data API for educational videos
 */
export async function searchYouTubeForTopic(
  query: string,
  opts?: {
    maxResults?: number;
    minDuration?: number; // seconds
    preferredChannels?: string[];
  }
): Promise<YouTubeSearchResult[]> {
  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
    "";

  if (!apiKey) {
    console.warn("⚠️ YouTube API key not configured. Video search disabled.");
    return [];
  }

  const maxResults = opts?.maxResults || 5;
  const minDuration = opts?.minDuration || 120; // Default: 2 minutes minimum

  try {
    // Step 1: Search for videos with timeout
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(maxResults * 2), // Get extra for filtering
      order: "relevance",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      videoDuration: minDuration > 240 ? "medium" : "any", // medium = 4-20 min
      key: apiKey,
    });

    const searchUrl = `${YT_API_BASE}/search?${searchParams.toString()}`;

    // Add timeout using AbortController (10 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const searchResponse = await fetch(searchUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Handle rate limiting (429)
    if (searchResponse.status === 429) {
      console.warn(
        `⚠️ YouTube API rate limit exceeded. Video search temporarily disabled.`
      );
      return [];
    }

    if (!searchResponse.ok) {
      console.error(
        `❌ YouTube search failed: ${searchResponse.status} ${searchResponse.statusText}`
      );
      return [];
    }

    const searchData = await searchResponse.json();
    const videoIds = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      console.log(`ℹ️ No videos found for query: "${query}"`);
      return [];
    }

    // Step 2: Get video details (duration, statistics)
    const detailsParams = new URLSearchParams({
      part: "contentDetails,statistics,snippet",
      id: videoIds.join(","),
      key: apiKey,
    });

    const detailsUrl = `${YT_API_BASE}/videos?${detailsParams.toString()}`;

    // Add timeout using AbortController (10 seconds)
    const detailsController = new AbortController();
    const detailsTimeoutId = setTimeout(() => detailsController.abort(), 10000);

    const detailsResponse = await fetch(detailsUrl, {
      signal: detailsController.signal,
    });
    clearTimeout(detailsTimeoutId);

    // Handle rate limiting (429)
    if (detailsResponse.status === 429) {
      console.warn(
        `⚠️ YouTube API rate limit exceeded. Video search temporarily disabled.`
      );
      return [];
    }

    if (!detailsResponse.ok) {
      console.error(
        `❌ YouTube details fetch failed: ${detailsResponse.status}`
      );
      return [];
    }

    const detailsData = await detailsResponse.json();
    const results: YouTubeSearchResult[] = [];

    for (const item of detailsData.items || []) {
      const id = item.id;
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      const statistics = item.statistics;

      // Parse duration (ISO 8601 format: PT15M33S)
      const duration = parseDuration(contentDetails?.duration);

      // Filter by minimum duration
      if (duration && duration < minDuration) {
        continue;
      }

      // Exclude shorts (< 60s) and extremely long videos (> 2 hours)
      if (duration && (duration < 60 || duration > 7200)) {
        continue;
      }

      results.push({
        id,
        title: snippet?.title || "Untitled",
        description: snippet?.description || "",
        channelTitle: snippet?.channelTitle || "Unknown Channel",
        publishedAt: snippet?.publishedAt || "",
        thumbnailUrl:
          snippet?.thumbnails?.medium?.url ||
          snippet?.thumbnails?.default?.url ||
          "",
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        viewCount: parseInt(statistics?.viewCount || "0", 10),
        duration: contentDetails?.duration,
      });

      if (results.length >= maxResults) break;
    }

    // Sort by view count (prefer popular educational content)
    results.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

    console.log(`✅ Found ${results.length} videos for query: "${query}"`);
    return results;
  } catch (error: any) {
    // Handle timeout errors
    if (error.name === "AbortError") {
      console.warn(
        `⚠️ YouTube API request timeout after 10 seconds for query: "${query}"`
      );
      return [];
    }

    // Handle network errors
    console.error(`❌ YouTube search error for "${query}":`, error.message);
    return [];
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT15M33S -> 933 seconds
 */
function parseDuration(isoDuration?: string): number | null {
  if (!isoDuration) return null;

  const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return null;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Match PDF videos to course lessons using semantic similarity
 *
 * Strategy:
 * 1. Extract keywords from lesson title + key points
 * 2. Compare with video title using simple keyword matching
 * 3. Return best match for each lesson (or null if no good match)
 */
export async function matchVideosToLessons(
  pdfVideos: Array<{
    id: string;
    title: string;
    watchUrl: string;
    embedUrl?: string;
  }>,
  lessons: LessonWithQuery[]
): Promise<Map<string, ValidatedVideo>> {
  console.log(
    `🔍 Matching ${pdfVideos.length} PDF videos to ${lessons.length} lessons...`
  );

  // Step 1: Validate all PDF videos
  const validatedVideos: ValidatedVideo[] = [];

  for (const video of pdfVideos) {
    const validation = await validateYouTubeUrl(video.watchUrl);

    if (validation.embeddable && validation.embedUrl) {
      validatedVideos.push({
        id: validation.id!,
        title: video.title || validation.title || "Untitled",
        watchUrl: validation.watchUrl!,
        embedUrl: validation.embedUrl,
        author: validation.author,
        thumbnail: validation.thumbnail,
      });
    } else {
      console.log(
        `⚠️ Skipping invalid/non-embeddable video: ${video.title} (${validation.reason})`
      );
    }
  }

  if (validatedVideos.length === 0) {
    console.log(`ℹ️ No valid videos to match`);
    return new Map();
  }

  // Step 2: Calculate match scores for each lesson-video pair
  const matches = new Map<string, ValidatedVideo>();
  const usedVideoIds = new Set<string>();

  for (const lesson of lessons) {
    let bestScore = 0;
    let bestVideo: ValidatedVideo | null = null;

    const lessonKeywords = extractKeywords(
      `${lesson.lessonTitle} ${lesson.keyPoints.join(" ")}`
    );

    for (const video of validatedVideos) {
      if (usedVideoIds.has(video.id)) continue; // Each video used once

      const videoKeywords = extractKeywords(video.title);
      const score = calculateMatchScore(lessonKeywords, videoKeywords);

      if (score > bestScore) {
        bestScore = score;
        bestVideo = video;
      }
    }

    // Only match if score is above threshold (30% keyword overlap)
    if (bestVideo && bestScore > 0.3) {
      matches.set(lesson.lessonId, bestVideo);
      usedVideoIds.add(bestVideo.id);
      console.log(
        `✅ Matched "${bestVideo.title}" to lesson "${lesson.lessonTitle}" (score: ${bestScore.toFixed(2)})`
      );
    } else {
      console.log(`ℹ️ No good video match for lesson "${lesson.lessonTitle}"`);
    }
  }

  return matches;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "be",
    "been",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "you",
    "your",
    "we",
    "tutorial",
    "guide",
    "introduction",
    "learn",
    "learning",
    "course",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return new Set(words);
}

/**
 * Calculate match score between two keyword sets (Jaccard similarity)
 */
function calculateMatchScore(
  keywords1: Set<string>,
  keywords2: Set<string>
): number {
  const intersection = new Set([...keywords1].filter((x) => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Validate and return the best video from search results
 */
export async function validateAndSelectBestVideo(
  searchResults: YouTubeSearchResult[]
): Promise<ValidatedVideo | null> {
  for (const result of searchResults) {
    const validation = await validateYouTubeUrl(result.watchUrl);

    if (validation.embeddable && validation.embedUrl) {
      return {
        id: result.id,
        title: result.title,
        watchUrl: result.watchUrl,
        embedUrl: validation.embedUrl,
        author: result.channelTitle,
        thumbnail: result.thumbnailUrl,
      };
    }
  }

  return null;
}
