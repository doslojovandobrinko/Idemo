import React from 'react';

/**
 * IDEMO Premium Bottom Navigation Icons
 * Custom-drawn SVG icon set matching IDEMO Editorial Luxury design guidelines.
 * 100% faithful reproduction of the reference icon artwork.
 */

export function CustomHomeIcon({ size = 25, className = "" }: { size?: number; className?: string }) {
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
      {/* Roof line */}
      <path d="M 3 12.5 L 12 3.8 L 21 12.5" />
      {/* Left wall */}
      <path d="M 4.8 12.5 V 20.5" />
      {/* Center arched entrance */}
      <path d="M 9.5 20.5 V 14.8 C 9.5 13.2 10.6 12 12 12 C 13.4 12 14.5 13.2 14.5 14.8 V 20.5" />
    </svg>
  );
}

export function CustomExploreIcon({ size = 25, className = "" }: { size?: number; className?: string }) {
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
      {/* Top-left compass arc */}
      <path d="M 18.2 7.5 A 8.5 8.5 0 0 0 7.5 18.2" />
      {/* Bottom-right compass arc */}
      <path d="M 5.8 16.5 A 8.5 8.5 0 0 0 16.5 5.8" />
      {/* Top-right solid pointer */}
      <path d="M 21.5 2.5 L 9.8 10.8 L 13.2 14.2 Z" fill="currentColor" />
      {/* Bottom-left open pointer */}
      <path d="M 2.5 21.5 L 9.8 10.8 L 13.2 14.2 Z" />
    </svg>
  );
}

export function CustomPlannerIcon({ size = 25, className = "" }: { size?: number; className?: string }) {
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
      <rect x="4" y="5.8" width="16" height="15.2" rx="3.5" />
      <path d="M 8 3.5 V 8.2" />
      <path d="M 16 3.5 V 8.2" />
      <path d="M 4.2 15 C 7.5 12, 11 18, 15 14.5 C 17 13, 18.5 14.2, 19.8 15" />
    </svg>
  );
}

export function CustomPartnersIcon({ size = 25, className = "" }: { size?: number; className?: string }) {
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
      <circle cx="8" cy="7.2" r="2.4" />
      <circle cx="16" cy="7.2" r="2.4" />
      <path d="M 4 20.5 C 4 15, 6.5 12.8, 8 12.8 C 10.5 12.8, 12 15, 14.5 20.5" />
      <path d="M 9.5 20.5 C 12 15, 13.5 12.8, 16 12.8 C 17.5 12.8, 20 15, 20 20.5" />
    </svg>
  );
}

export function CustomProfileIcon({ size = 25, className = "" }: { size?: number; className?: string }) {
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
      <circle cx="12" cy="7.2" r="3.2" />
      <path d="M 4.5 20.5 C 4.5 14, 8 12.8, 12 12.8 C 16 12.8, 19.5 14, 19.5 20.5" />
    </svg>
  );
}
