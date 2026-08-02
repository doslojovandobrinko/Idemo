/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utility to map image assets to optimized WebP versions when available.
 * Provides a single point of asset resolution for the entire IDEMO platform,
 * allowing seamless migration to WebP without database modifications.
 */
export function getOptimizedImageUrl(src: string): string {
  if (!src) return "";

  let cleaned = src;
  if (cleaned.startsWith("/src/assets/images/")) {
    cleaned = cleaned.replace("/src/assets/images/", "assets/images/");
  } else if (cleaned.startsWith("src/assets/images/")) {
    cleaned = cleaned.replace("src/assets/images/", "assets/images/");
  } else if (cleaned.startsWith("/assets/images/")) {
    cleaned = cleaned.replace("/assets/images/", "assets/images/");
  }

  if (cleaned.endsWith(".png")) {
    cleaned = cleaned.substring(0, cleaned.length - 4) + ".webp";
  }

  return cleaned;
}
