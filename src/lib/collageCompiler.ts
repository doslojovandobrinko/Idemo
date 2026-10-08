/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO AGENT 007 PACKAGE COLLAGE COMPILER
 * Compiles up to 5 high-quality partner-provided images into a single
 * editorial luxury composite collage representation for package recommendations.
 * 
 * Works in browser via HTML5 Canvas with fallback for server/headless environments.
 */

export interface CollageCompileOptions {
  width?: number;  // Default 1200
  height?: number; // Default 800 (3:2 editorial aspect ratio)
  quality?: number; // Default 0.88 JPEG quality
}

/**
 * Loads an image from a URL or Data URL asynchronously
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image for collage: ${src.slice(0, 50)}...`));
    img.src = src;
  });
}

/**
 * Helper to draw an image centered and cropped ("object-fit: cover") onto a canvas region
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let sX = 0;
  let sY = 0;
  let sW = img.width;
  let sH = img.height;

  if (imgRatio > targetRatio) {
    // Image is wider than target
    sW = img.height * targetRatio;
    sX = (img.width - sW) / 2;
  } else {
    // Image is taller than target
    sH = img.width / targetRatio;
    sY = (img.height - sH) / 2;
  }

  ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
}

/**
 * Compiles up to 5 images into a single editorial collage representation.
 * 
 * Layouts:
 * - 1 image: Full bleed 1200x800
 * - 2 images: 2 vertical panels (600x800 each)
 * - 3 images: Left feature (600x800), Right 2 stacked (600x398 each)
 * - 4 images: 2x2 grid (598x398 each)
 * - 5 images: Left feature (600x800), Right 2x2 grid (298x398 each)
 */
export async function compilePackageCollage(
  images: string[],
  options: CollageCompileOptions = {}
): Promise<string> {
  if (!images || images.length === 0) {
    throw new Error('At least one image is required to compile a package collage.');
  }

  // Cap at 5 images
  const targetImages = images.slice(0, 5);

  // If running outside browser (SSR, Node tests), provide deterministic synthetic representation
  if (typeof window === 'undefined' || typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return targetImages[0];
  }

  const width = options.width || 1200;
  const height = options.height || 800;
  const quality = options.quality ?? 0.88;
  const divider = 4; // 4px divider

  try {
    const loadedImages = await Promise.all(targetImages.map(src => loadImage(src)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return targetImages[0];
    }

    // Fill background with IDEMO deep charcoal
    ctx.fillStyle = '#1A1D1A';
    ctx.fillRect(0, 0, width, height);

    const count = loadedImages.length;

    if (count === 1) {
      // Single image full cover
      drawImageCover(ctx, loadedImages[0], 0, 0, width, height);
    } else if (count === 2) {
      // 2 vertical panels
      const halfW = (width - divider) / 2;
      drawImageCover(ctx, loadedImages[0], 0, 0, halfW, height);
      drawImageCover(ctx, loadedImages[1], halfW + divider, 0, halfW, height);
    } else if (count === 3) {
      // Left 50% feature, Right 2 stacked
      const leftW = (width - divider) / 2;
      const rightX = leftW + divider;
      const rightH = (height - divider) / 2;

      drawImageCover(ctx, loadedImages[0], 0, 0, leftW, height);
      drawImageCover(ctx, loadedImages[1], rightX, 0, leftW, rightH);
      drawImageCover(ctx, loadedImages[2], rightX, rightH + divider, leftW, rightH);
    } else if (count === 4) {
      // 2x2 grid
      const halfW = (width - divider) / 2;
      const halfH = (height - divider) / 2;

      drawImageCover(ctx, loadedImages[0], 0, 0, halfW, halfH);
      drawImageCover(ctx, loadedImages[1], halfW + divider, 0, halfW, halfH);
      drawImageCover(ctx, loadedImages[2], 0, halfH + divider, halfW, halfH);
      drawImageCover(ctx, loadedImages[3], halfW + divider, halfH + divider, halfW, halfH);
    } else if (count >= 5) {
      // 5 images: Left 50% hero feature, Right 2x2 grid
      const leftW = (width - divider) / 2;
      const rightX = leftW + divider;
      const subW = (leftW - divider) / 2;
      const subH = (height - divider) / 2;

      drawImageCover(ctx, loadedImages[0], 0, 0, leftW, height);
      drawImageCover(ctx, loadedImages[1], rightX, 0, subW, subH);
      drawImageCover(ctx, loadedImages[2], rightX + subW + divider, 0, subW, subH);
      drawImageCover(ctx, loadedImages[3], rightX, subH + divider, subW, subH);
      drawImageCover(ctx, loadedImages[4], rightX + subW + divider, subH + divider, subW, subH);
    }

    // Add subtle editorial badge overlay at bottom left
    const badgeText = `IDEMO EXPERIENCE PACKAGE • ${count} ITINERARY HIGHLIGHTS`;
    ctx.font = 'bold 16px monospace';
    const textWidth = ctx.measureText(badgeText).width;

    ctx.fillStyle = 'rgba(26, 29, 26, 0.85)';
    ctx.fillRect(20, height - 52, textWidth + 30, 32);

    ctx.fillStyle = '#C5A059';
    ctx.fillText(badgeText, 35, height - 31);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('[CollageCompiler] Fallback to primary image due to load error:', err);
    return targetImages[0];
  }
}
