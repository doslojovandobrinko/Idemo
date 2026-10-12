import { readFileSync } from 'fs';
import { resolve } from 'path';

function runHeroCarouselIndicatorTest() {
  const appPath = resolve(process.cwd(), 'src/App.tsx');
  const appCode = readFileSync(appPath, 'utf-8');

  // 1. Verify hero carousel controls have 'top-' and not 'bottom-1.5'
  const carouselControlsRegex = /{\/\*\s*7 Daily Rotating Carousel Controls\s*\*\/}[\s\S]*?<div[\s\S]*?className="([^"]+)"/;
  const match = appCode.match(carouselControlsRegex);

  if (!match) {
    throw new Error('FAILED: Could not find 7 Daily Rotating Carousel Controls in src/App.tsx');
  }

  const className = match[1];
  console.log('Carousel controls container className:', className);

  if (!className.includes('top-')) {
    throw new Error(`FAILED: Carousel controls container does not have 'top-' position. Got: ${className}`);
  }

  if (className.includes('bottom-')) {
    throw new Error(`FAILED: Carousel controls container still has 'bottom-' position. Got: ${className}`);
  }

  // 2. Verify controls have required accessibility and layout classes
  if (!className.includes('absolute') || !className.includes('z-30') || !className.includes('rounded-full')) {
    throw new Error(`FAILED: Carousel controls container missing essential styling: ${className}`);
  }

  // 3. Verify language selector still exists directly below the hero card
  if (!appCode.includes('{/* Language Selector (Exact match to IMG_8431.png reference) */}')) {
    throw new Error('FAILED: Language selector missing or displaced in src/App.tsx');
  }

  console.log('PASS: Hero image carousel indicator bar is correctly positioned at the top of the image.');
}

try {
  runHeroCarouselIndicatorTest();
} catch (err: any) {
  console.error(err.message);
  process.exit(1);
}
