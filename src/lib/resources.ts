/**
 * Resource management utilities
 * Handles deduplication, prioritization, and quality filtering
 */

export interface Resource {
  title: string;
  url: string;
  type?: 'video' | 'article' | 'docs';
  verified?: boolean;
  embeddable?: boolean;
}

/**
 * Normalize URL for comparison (remove tracking params, normalize host)
 */
export function normalizeResourceUrl(url: string): string {
  try {
    const u = new URL(url);
    // Keep only origin and pathname, strip query params for deduplication
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Normalize title for comparison (lowercase, trim, collapse whitespace)
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Deduplicate resources by normalized title + URL
 * Keeps first occurrence of each unique resource
 */
export function dedupeResources<T extends Resource>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalizedUrl = normalizeResourceUrl(item.url);
    const normalizedTitleText = normalizeTitle(item.title);
    const key = `${normalizedTitleText}|${normalizedUrl}`;
    
    if (seen.has(key)) {
      return false;
    }
    
    seen.add(key);
    return true;
  });
}

/**
 * Prioritize resources by quality/type
 * 1. Embeddable videos from verified sources
 * 2. Embeddable videos
 * 3. External videos from verified sources
 * 4. External videos
 * 5. Official docs/articles
 * 6. Other articles
 */
export function prioritizeResources<T extends Resource>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Calculate priority scores
    const scoreA = getResourceScore(a);
    const scoreB = getResourceScore(b);
    return scoreB - scoreA; // Higher score first
  });
}

function getResourceScore(resource: Resource): number {
  let score = 0;

  // Type priority
  if (resource.type === 'video') {
    score += 100;
    if (resource.embeddable) score += 50;
  } else if (resource.type === 'docs') {
    score += 75;
  } else if (resource.type === 'article') {
    score += 50;
  }

  // Verified source bonus
  if (resource.verified) {
    score += 25;
  }

  return score;
}

/**
 * Cap resources to maximum count, preferring higher quality
 */
export function capResources<T extends Resource>(
  items: T[],
  maxCount: number = 5
): T[] {
  const prioritized = prioritizeResources(items);
  return prioritized.slice(0, maxCount);
}

/**
 * Group resources by type
 */
export function groupResourcesByType<T extends Resource>(items: T[]): {
  videos: T[];
  articles: T[];
  docs: T[];
  other: T[];
} {
  return items.reduce(
    (groups, item) => {
      if (item.type === 'video') {
        groups.videos.push(item);
      } else if (item.type === 'article') {
        groups.articles.push(item);
      } else if (item.type === 'docs') {
        groups.docs.push(item);
      } else {
        groups.other.push(item);
      }
      return groups;
    },
    { videos: [] as T[], articles: [] as T[], docs: [] as T[], other: [] as T[] }
  );
}

/**
 * Process resources: dedupe, prioritize, and cap
 */
export function processResources<T extends Resource>(
  items: T[],
  maxCount: number = 5
): T[] {
  const deduped = dedupeResources(items);
  const prioritized = prioritizeResources(deduped);
  return prioritized.slice(0, maxCount);
}
