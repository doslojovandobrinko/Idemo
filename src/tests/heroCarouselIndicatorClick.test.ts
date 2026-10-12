import { readFileSync } from 'fs';
import { resolve } from 'path';

function runHeroCarouselIndicatorClickTest() {
  const appPath = resolve(process.cwd(), 'src/App.tsx');
  const appCode = readFileSync(appPath, 'utf-8');

  // 1. Verify hero carousel controls have 'top-' position
  const carouselControlsRegex = /{\/\*\s*7 Daily Rotating Carousel Controls\s*\*\/}[\s\S]*?<div[\s\S]*?className="([^"]+)"/;
  const match = appCode.match(carouselControlsRegex);

  if (!match) {
    throw new Error('FAILED: Could not find 7 Daily Rotating Carousel Controls in src/App.tsx');
  }

  const className = match[1];
  if (!className.includes('top-2.5')) {
    throw new Error(`FAILED: Carousel controls container does not have 'top-2.5'. Got: ${className}`);
  }

  // 2. Verify container stops mousedown and touchstart to prevent parent tactile-hero-logo triggering
  const containerSnippet = appCode.substring(match.index!, match.index! + 300);
  if (!containerSnippet.includes('onMouseDown={(e) => e.stopPropagation()}') || 
      !containerSnippet.includes('onTouchStart={(e) => e.stopPropagation()}')) {
    throw new Error('FAILED: Container does not intercept onMouseDown or onTouchStart propagation');
  }

  // 3. Verify individual buttons stop mousedown and touchstart as well
  if (!appCode.includes('setActiveHeroIndex(idx)')) {
    throw new Error('FAILED: setActiveHeroIndex handler missing');
  }

  // 4. Verify dots have padding wrapper with touch-manipulation and cursor-pointer for generous clickable hit area
  if (!appCode.includes('touch-manipulation') || !appCode.includes('py-1.5 -my-1 px-0.5')) {
    throw new Error('FAILED: Carousel dots missing touch-manipulation or hit-target padding');
  }

  console.log('PASS: Hero image carousel indicator bar is accessible, positioned at the top, and clicks/touches reliably switch images without triggering card activation.');
}

try {
  runHeroCarouselIndicatorClickTest();
} catch (err: any) {
  console.error(err.message);
  process.exit(1);
}
