import data from "./placeholder-images.json";
import { optimizeImageUrl } from "./image-optimization";

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

/**
 * Get optimized placeholder image URL
 * Applies width and quality parameters to external services
 */
export function getOptimizedPlaceholderUrl(
  id: string,
  width?: number,
  quality: number = 85
): string {
  const placeholder = PlaceHolderImages.find((img) => img.id === id);
  if (!placeholder) return "";

  return optimizeImageUrl(placeholder.imageUrl, width, quality);
}
