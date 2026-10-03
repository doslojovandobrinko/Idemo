import React from 'react';

/**
 * IDEMO Approved Editorial Icons
 * Custom SVG reproductions for Editorial Collections / Cultural Briefings.
 * Enforces strokeWidth="2.6", strokeLinecap="round", strokeLinejoin="round".
 */

export function EditorialSummitVapourIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Primary Peak (Left/Center) */}
      <path d="M 2 20.5 L 9.5 7 L 15.5 20.5" />
      {/* Secondary Peak (Right) */}
      <path d="M 12.5 20.5 L 17.5 11.5 L 22 20.5" />
      {/* Ground Line */}
      <path d="M 2 20.5 H 22" />
      {/* Rising Vapour Stroke */}
      <path d="M 9.5 5 C 11 3.2, 9.5 1.8, 11 0.8" />
    </svg>
  );
}

export function EditorialKafanaRitualIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Squared/angular stemmed wine glass bowl */}
      <path d="M 6 4.5 L 6.8 13.5 H 17.2 L 18 4.5 Z" />
      {/* Liquid line */}
      <path d="M 6.4 8.8 H 17.6" />
      {/* Stem */}
      <path d="M 12 13.5 V 20.2" />
      {/* Flat Base */}
      <path d="M 7.5 20.2 H 16.5" />
    </svg>
  );
}

export function EditorialAfterHoursIcon({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Minimal Stepped Skyline */}
      <path d="M 2 20.5 V 15 H 6.5 V 12 H 11 V 16.5 H 15.5 V 13.5 H 20.5 V 20.5" />
      <path d="M 2 20.5 H 22" />
      {/* Solid Crescent Moon */}
      <path 
        d="M 19.5 2.2 C 16.5 2.2, 14.2 4.5, 14.2 7.5 C 14.2 10.5, 16.5 12.8, 19.5 12.8 C 17.5 12.8, 15.8 10.6, 15.8 7.5 C 15.8 4.4, 17.5 2.2, 19.5 2.2 Z" 
        fill="currentColor" 
      />
    </svg>
  );
}

export function EditorialStoriesCustomsIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Symmetrical Open Book */}
      <path d="M 12 12 C 9 10.5, 5 10.5, 2.5 11.8 V 20 C 5 18.8, 9 18.8, 12 20.2 C 15 18.8, 19 18.8, 21.5 20 V 11.8 C 19 10.5, 15 10.5, 12 12 Z" />
      <path d="M 12 12 V 20.2" />
      {/* Small 4-point Sparkle */}
      <path d="M 12 1.5 L 12.8 4.2 L 15.5 5 L 12.8 5.8 L 12 8.5 L 11.2 5.8 L 8.5 5 L 11.2 4.2 Z" fill="currentColor" />
    </svg>
  );
}

export function EditorialLocalWisdomIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Circular Compass */}
      <circle cx="12" cy="13" r="8.2" />
      {/* North Tick */}
      <path d="M 12 2 V 4.8" />
      {/* Diagonal Compass Needle */}
      <path d="M 18.2 6.8 L 5.8 19.2" />
      <polygon points="18.2,6.8 10.5,11.5 13.5,14.5" fill="currentColor" />
    </svg>
  );
}
