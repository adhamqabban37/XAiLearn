/**
 * Video validation and normalization utilities
 * Handles YouTube URL validation, embeddability checks, and replacement logic
 */

export interface VideoValidationResult {
  isValid: boolean;
  isEmbeddable: boolean;
  normalizedUrl: string | null;
  videoId: string | null;
  reason?: string;
  verifiedSource?: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    // youtube.com/watch?v=VIDEO_ID
    if (host === 'youtube.com' && u.pathname === '/watch') {
      return u.searchParams.get('v');
    }

    // youtube.com/embed/VIDEO_ID
    if (host === 'youtube.com' && u.pathname.startsWith('/embed/')) {
      const parts = u.pathname.split('/');
      return parts[2] || null;
    }

    // youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const parts = u.pathname.split('/');
      return parts[1] || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is an allowed YouTube format (not Shorts, Live, etc.)
 */
export function isAllowedYouTubeFormat(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname;

    // Reject Shorts, Live, TikTok, Facebook, etc.
    if (path.includes('/shorts/') || path.includes('/live/')) {
      return false;
    }
    if (host.includes('tiktok.com') || host.includes('facebook.com')) {
      return false;
    }

    // Accept standard YouTube formats
    return (
      (host === 'youtube.com' && path === '/watch' && u.searchParams.has('v')) ||
      (host === 'youtube.com' && path.startsWith('/embed/')) ||
      (host === 'youtu.be' && path.length > 1)
    );
  } catch {
    return false;
  }
}

/**
 * Normalize YouTube URL to standard watch format
 */
export function normalizeYouTubeUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Get embeddable iframe URL for YouTube video
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Check if video is from a verified/reputable source
 * Add more channels as needed
 */
const VERIFIED_CHANNELS = [
  'freecodecamp',
  'google developers',
  'mit opencourseware',
  'stanford',
  'harvard',
  'microsoft',
  'mozilla',
  'w3c',
  'crash course',
  'khan academy',
  'the coding train',
  'traversy media',
  'net ninja',
  'academind',
  'fireship',
];

export function isVerifiedSource(channelName: string): boolean {
  const normalized = channelName.toLowerCase().trim();
  return VERIFIED_CHANNELS.some((vc) => normalized.includes(vc));
}

/**
 * Validate video URL format and embeddability
 * Note: This is client-side validation. For full validation including
 * age-restricted/region-blocked/private/deleted, use server-side oEmbed check.
 */
export function isEmbeddableYouTube(url: string): VideoValidationResult {
  // Check if it's an allowed format
  if (!isAllowedYouTubeFormat(url)) {
    return {
      isValid: false,
      isEmbeddable: false,
      normalizedUrl: null,
      videoId: null,
      reason: 'URL format not allowed (Shorts, Live, or non-YouTube)',
    };
  }

  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return {
      isValid: false,
      isEmbeddable: false,
      normalizedUrl: null,
      videoId: null,
      reason: 'Could not extract video ID',
    };
  }

  const normalizedUrl = normalizeYouTubeUrl(url);
  
  return {
    isValid: true,
    isEmbeddable: true, // Assume embeddable unless server check says otherwise
    normalizedUrl,
    videoId,
  };
}

/**
 * Validate video with server-side oEmbed check
 * Returns full validation result including embeddability status
 */
export async function validateWithOEmbed(url: string): Promise<VideoValidationResult> {
  const clientResult = isEmbeddableYouTube(url);
  if (!clientResult.isValid) {
    return clientResult;
  }

  try {
    // Call your existing YouTube validation API
    const response = await fetch(`/api/youtube-validate?url=${encodeURIComponent(url)}`);
    const data = await response.json();

    return {
      ...clientResult,
      isEmbeddable: data.embeddable !== false && data.accessible !== false,
      verifiedSource: data.verified_source || false,
      reason: data.embeddable === false ? 'Not embeddable (age-restricted, private, or deleted)' : undefined,
    };
  } catch (error) {
    console.warn('[validateWithOEmbed] Server validation failed, using client result:', error);
    return clientResult;
  }
}

/**
 * Find replacement video by title search
 * Uses existing repair batch API to find suitable replacements
 */
export async function findReplacementByTitle(
  originalTitle: string,
  originalUrl: string
): Promise<{ url: string; title: string } | null> {
  try {
    const response = await fetch('/api/youtube-repair-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videos: [{ url: originalUrl, title: originalTitle }],
      }),
    });

    const data = await response.json();
    if (data.results?.[0]?.replacement) {
      const replacement = data.results[0].replacement;
      return {
        url: replacement.url,
        title: replacement.title,
      };
    }

    return null;
  } catch (error) {
    console.warn('[findReplacementByTitle] Replacement search failed:', error);
    return null;
  }
}
