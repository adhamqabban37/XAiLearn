/**
 * Image Optimization Utilities
 *
 * Provides helpers for image optimization, lazy loading,
 * and responsive image sizing across the application.
 */

import { ImageProps } from "next/image";

/**
 * Generate optimized image sizes for responsive layouts
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 64, height: 64 },
  small: { width: 128, height: 128 },
  medium: { width: 256, height: 256 },
  large: { width: 512, height: 512 },
  hero: { width: 1920, height: 1080 },
  card: { width: 400, height: 300 },
  avatar: { width: 40, height: 40 },
} as const;

/**
 * Responsive sizes string for different breakpoints
 */
export const RESPONSIVE_SIZES = {
  full: "100vw",
  hero: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
  card: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px",
  thumbnail: "(max-width: 768px) 33vw, 128px",
  avatar: "40px",
} as const;

/**
 * Default image optimization props
 */
export const DEFAULT_IMAGE_PROPS: Partial<ImageProps> = {
  loading: "lazy",
  quality: 85, // Good balance between quality and file size
  placeholder: "blur",
};

/**
 * Generate blur placeholder data URL
 */
export function getBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString("base64")}`;
}

/**
 * Optimize external image URL for Next.js Image
 */
export function optimizeImageUrl(
  url: string,
  width?: number,
  quality: number = 85
): string {
  if (!url) return "";

  // For placeholder services, add optimization params
  if (url.includes("picsum.photos")) {
    const baseUrl = url.split("?")[0];
    return width ? `${baseUrl}?w=${width}&q=${quality}` : url;
  }

  if (url.includes("images.unsplash.com")) {
    const urlObj = new URL(url);
    if (width) urlObj.searchParams.set("w", width.toString());
    urlObj.searchParams.set("q", quality.toString());
    urlObj.searchParams.set("fm", "webp"); // Request WebP format
    urlObj.searchParams.set("fit", "crop");
    return urlObj.toString();
  }

  return url;
}

/**
 * Check if image should be prioritized (above the fold)
 */
export function shouldPrioritize(
  imageType: "hero" | "logo" | "avatar" | "content"
): boolean {
  return imageType === "hero" || imageType === "logo";
}

/**
 * Get optimized image props based on context
 */
export function getOptimizedImageProps(
  context: "hero" | "card" | "thumbnail" | "avatar" | "logo",
  overrides?: Partial<ImageProps>
): Partial<ImageProps> {
  const baseProps: Partial<ImageProps> = {
    ...DEFAULT_IMAGE_PROPS,
    ...overrides,
  };

  switch (context) {
    case "hero":
      return {
        ...baseProps,
        priority: true, // Load immediately
        sizes: RESPONSIVE_SIZES.hero,
        ...IMAGE_SIZES.hero,
      };

    case "logo":
      return {
        ...baseProps,
        priority: true,
        sizes: RESPONSIVE_SIZES.avatar,
        ...IMAGE_SIZES.avatar,
      };

    case "card":
      return {
        ...baseProps,
        sizes: RESPONSIVE_SIZES.card,
        ...IMAGE_SIZES.card,
      };

    case "thumbnail":
      return {
        ...baseProps,
        sizes: RESPONSIVE_SIZES.thumbnail,
        ...IMAGE_SIZES.small,
      };

    case "avatar":
      return {
        ...baseProps,
        sizes: RESPONSIVE_SIZES.avatar,
        ...IMAGE_SIZES.avatar,
      };

    default:
      return baseProps;
  }
}

/**
 * Preload critical images
 */
export function preloadImage(src: string) {
  if (typeof window === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Convert image to WebP (client-side utility)
 */
export async function convertToWebP(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/webp",
        0.85 // 85% quality
      );
    };

    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * CDN URL generator (for future CDN integration)
 */
export function getCDNUrl(path: string, cdnDomain?: string): string {
  if (!cdnDomain) return path;

  // Remove leading slash and construct CDN URL
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${cdnDomain}/${cleanPath}`;
}
