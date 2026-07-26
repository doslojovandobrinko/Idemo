/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Suppress any errors
    }
  }
};

interface PremiumCarouselProps {
  items: any[];
  renderItem: (item: any, isCenter: boolean) => ReactNode;
  onSelect?: (id: string) => void;
  onIndexChange?: (index: number) => void;
  height?: string;
  itemWidth?: number;
  currentIndex?: number;
}

export default function PremiumCarousel({ 
  items, 
  renderItem, 
  onSelect, 
  onIndexChange,
  height = "420px",
  itemWidth = 280,
  currentIndex
}: PremiumCarouselProps) {
  const [index, setIndex] = useState(currentIndex !== undefined ? currentIndex : 0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const touchStartRef = useRef({ x: 0, y: 0 });
  const swipeDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none');
  
  // The raw motion value for the carousel position
  const x = useMotionValue(-(index * itemWidth));

  useEffect(() => {
    if (currentIndex !== undefined && currentIndex !== index) {
      const safeIdx = Math.max(0, Math.min(items.length - 1, currentIndex));
      setIndex(safeIdx);
    }
  }, [currentIndex, items.length]);
  
  // Spring settings for the snapping animation - "Luxurious and natural"
  const snapTransition = {
    type: "spring",
    stiffness: 400, // Increased for a faster, more responsive snap
    damping: 38,   // Adjusted to maintain smooth, non-oscillating motion
    mass: 0.8,     // Lower mass for faster acceleration
    restDelta: 0.001
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      swipeDirectionRef.current = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1 || swipeDirectionRef.current === 'vertical') {
        return;
      }

      const diffX = e.touches[0].clientX - touchStartRef.current.x;
      const diffY = e.touches[0].clientY - touchStartRef.current.y;

      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      if (swipeDirectionRef.current === 'none') {
        // Highly responsive threshold: determine swipe intent early (after 5px of movement)
        if (absX > 5 || absY > 5) {
          if (absX > absY) {
            swipeDirectionRef.current = 'horizontal';
          } else {
            swipeDirectionRef.current = 'vertical';
          }
        }
      }

      // If we are swipe-locked horizontally, prevent the browser's default viewport vertical pan
      if (swipeDirectionRef.current === 'horizontal') {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  useEffect(() => {
    // Ensure index is always within safe bounds of the items length
    const safeIndex = Math.min(index, Math.max(0, items.length - 1));
    if (safeIndex !== index) {
      setIndex(safeIndex);
    } else {
      if (onIndexChange) onIndexChange(safeIndex);
      // When index changes, animate to it smoothly
      animate(x, -(safeIndex * itemWidth), snapTransition as any);
    }
  }, [index, items.length, itemWidth, onIndexChange]);

  const handleDragEnd = (_: any, info: any) => {
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    // Predicted movement based on distance and velocity (Momentum-aware)
    const projectedOffset = offset + (velocity * 0.25);
    
    // If movement is more than 20% of item width, move to next
    const threshold = itemWidth * 0.2;
    
    let move = 0;
    if (Math.abs(projectedOffset) > threshold) {
      move = projectedOffset > 0 ? -1 : 1;
      
      // For very fast swipes, allow skipping items proportionate to velocity
      if (Math.abs(velocity) > 800) {
        move = projectedOffset > 0 
          ? -Math.ceil(Math.abs(projectedOffset) / (itemWidth * 0.8)) 
          : Math.ceil(Math.abs(projectedOffset) / (itemWidth * 0.8));
      }
    }

    const nextIndex = Math.max(0, Math.min(items.length - 1, index + move));
    
    if (nextIndex !== index) {
      triggerHaptic(8);
      setIndex(nextIndex);
    } else {
      // If we didn't cross a threshold, snap back forcefully but smoothly
      animate(x, -(index * itemWidth), snapTransition as any);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y overscroll-x-contain" 
      style={{ height }}
    >
      <div className="absolute left-1/2 top-0 h-full flex items-center">
        <motion.div
          drag="x"
          dragConstraints={{ 
            left: -((items.length - 1) * itemWidth), 
            right: 0
          }}
          dragElastic={0.6}
          dragPropagation={false}
          dragDirectionLock={true}
          style={{ x }}
          onDragEnd={handleDragEnd}
          className="flex items-center cursor-grab active:cursor-grabbing"
        >
          {items.map((item, i) => {
            return (
              <CarouselItem 
                key={item.id || i}
                item={item}
                index={i}
                currentIndex={index}
                itemWidth={itemWidth}
                x={x}
                renderItem={renderItem}
                onClick={() => {
                  triggerHaptic(6);
                  if (index === i && onSelect) onSelect(item.id);
                  else setIndex(i);
                }}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

function CarouselItem({ item, index, currentIndex, itemWidth, x, renderItem, onClick }: any) {
  // Center pos is just index * itemWidth because x starts at 0 at index 0 and moves left
  const targetPos = -(index * itemWidth);
  
  // Calculate distance from center for scaling/opacity
  const distance = useTransform(x, (val: number) => Math.abs(val - targetPos));
  
  const scale = useTransform(distance, [0, itemWidth], [1.0, 0.9]);
  const opacity = useTransform(distance, [0, itemWidth * 1.2], [1, 0.65]);
  const blurValue = useTransform(distance, [0, itemWidth], [0, 0.5]);
  const filter = useTransform(blurValue, (v) => `blur(${v}px)`);
  const zIndex = useTransform(distance, [0, itemWidth], [20, 10]);
  
  // Subtle rotation as it moves away from center
  const rotateY = useTransform(x, (val: number) => {
    const d = val - targetPos;
    return d / 15;
  });

  return (
    <motion.div
      whileTap={{ y: 4 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        width: itemWidth,
        scale,
        rotateY,
        opacity,
        filter,
        zIndex,
        perspective: 1000,
        x: -itemWidth / 2, // Shift left by half width to center the first card
        willChange: "transform, opacity",
      }}
      onClick={onClick}
      className="px-2 h-full cursor-pointer origin-center flex-shrink-0"
    >
      {renderItem(item, currentIndex === index)}
    </motion.div>
  );
}
