import React from 'react';
import { motion } from 'framer-motion';

interface SerbiaMapButtonProps {
  onClick: (e: React.MouseEvent | React.TouchEvent) => void;
  triggerHaptic?: (intensity?: number) => void;
  language?: string;
  className?: string;
}

export const SerbiaMapButton: React.FC<SerbiaMapButtonProps> = ({
  onClick,
  triggerHaptic,
  className = ''
}) => {
  const handlePressStart = () => {
    if (triggerHaptic) {
      triggerHaptic(10);
    } else if (
      typeof window !== 'undefined' &&
      window.navigator &&
      typeof window.navigator.vibrate === 'function'
    ) {
      try {
        window.navigator.vibrate(8);
      } catch {
        // Fail silently where unsupported
      }
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Primary Interactive Serbia Landing Map CTA Button */}
      <motion.button
        type="button"
        onClick={onClick}
        onMouseDown={handlePressStart}
        onTouchStart={handlePressStart}
        aria-label="Explore Serbia with IDEMO - Primary Action"
        role="button"
        id="authoritative-serbia-map-button"
        className="relative group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-charcoal/40 rounded-[20px] p-1.5 transition-colors duration-150"
        initial={{
          y: 0,
          scale: 1,
          filter: 'drop-shadow(0px 8px 20px rgba(18, 43, 30, 0.16))'
        }}
        whileHover={{
          scale: 1.015,
          filter: 'drop-shadow(0px 12px 26px rgba(18, 43, 30, 0.24))'
        }}
        whileTap={{
          y: 4,
          scale: 0.97,
          filter: 'drop-shadow(0px 2px 5px rgba(18, 43, 30, 0.22))'
        }}
        transition={{
          duration: 0.16,
          ease: [0.25, 1, 0.5, 1]
        }}
      >
        {/* Hidden Accessibility Support */}
        <span className="sr-only">Explore Serbia - Tap to begin</span>

        {/* Authoritative Serbia Map Landing Image Surface */}
        <div className="relative w-[220px] xs:w-[250px] sm:w-[275px] h-[240px] xs:h-[270px] sm:h-[295px] flex items-center justify-center pointer-events-none">
          <img
            src="/assets/images/idemo_serbia_landing_map_v3.png"
            alt="Authoritative Serbia Map CTA"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </motion.button>
    </div>
  );
};

export default SerbiaMapButton;