/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { getOptimizedImageUrl, resolveMediaDisplayUrl } from '../utils/assetHelper';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  isAdminPreview?: boolean;
  loading?: 'lazy' | 'eager';
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  fallbackSrc = '',
  className = '',
  containerClassName = 'w-full h-full',
  alt = '',
  isAdminPreview = false,
  loading = 'eager',
  ...props
}) => {
  // Safe helper to strip dev prefixes and ensure relative path for published and AppMyWeb builds
  const cleanPath = (p: string): string => {
    if (!p) return '';
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('blob:') || p.startsWith('data:')) {
      return p;
    }
    let cp = p;
    if (cp.startsWith('/src/assets/images/')) {
      cp = cp.replace('/src/assets/images/', '/assets/images/');
    } else if (cp.startsWith('src/assets/images/')) {
      cp = cp.replace('src/assets/images/', '/assets/images/');
    } else if (cp.startsWith('assets/images/')) {
      cp = '/' + cp;
    }
    return cp;
  };

  const getResolvedFallback = () => {
    if (!fallbackSrc) return '';
    if (fallbackSrc.startsWith('http://') || fallbackSrc.startsWith('https://') || fallbackSrc.startsWith('blob:')) {
      return fallbackSrc;
    }
    let fb = fallbackSrc;
    if (fb.startsWith('/src/assets/images/')) {
      fb = fb.replace('/src/assets/images/', '/assets/images/');
    } else if (fb.startsWith('src/assets/images/')) {
      fb = fb.replace('src/assets/images/', '/assets/images/');
    } else if (fb.startsWith('assets/images/')) {
      fb = '/' + fb;
    }
    if (fb.endsWith('.png')) {
      fb = fb.substring(0, fb.length - 4) + '.webp';
    }
    return fb;
  };

  const resolvedFallback = getResolvedFallback();
  const isGovernedMedia = Boolean(src && (src.startsWith('recommendation-media/') || src.startsWith('/recommendation-media/')));
  const initialSrc = isGovernedMedia ? '' : getOptimizedImageUrl(cleanPath(src));
  const [imgSrc, setImgSrc] = useState<string>(initialSrc || resolvedFallback);
  const [isLoaded, setIsLoaded] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // Synchronize imgSrc when src prop changes
  React.useEffect(() => {
    let active = true;

    if (isGovernedMedia) {
      resolveMediaDisplayUrl(src)
        .then((resolvedUrl) => {
          if (active && resolvedUrl) {
            setImgSrc(resolvedUrl);
          }
        })
        .catch(() => {
          if (active) {
            setHasError(true);
            if (resolvedFallback) setImgSrc(resolvedFallback);
          }
        });
    } else {
      const nextSrc = getOptimizedImageUrl(cleanPath(src));
      if (nextSrc && nextSrc !== imgSrc) {
        setImgSrc(nextSrc);
        setIsLoaded(false);
        setHasError(false);
      }
    }

    return () => {
      active = false;
    };
  }, [src, fallbackSrc, isGovernedMedia, imgSrc]);

  // Handle image load verification
  const checkComplete = (imgNode: HTMLImageElement | null) => {
    if (imgNode && imgNode.complete && imgNode.naturalWidth > 0) {
      setIsLoaded(true);
    }
  };

  const handleRef = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    checkComplete(node);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    checkComplete(e.currentTarget);
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (resolvedFallback && imgSrc !== resolvedFallback) {
        setImgSrc(resolvedFallback);
      }
    }
  };

  const isPending = !src || src.includes('draft_placeholder') || (hasError && !resolvedFallback);

  if (isPending && isAdminPreview) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800 p-4 select-none ${containerClassName}`}>
        <span className="text-[#8A1F1F] font-mono text-[9px] tracking-[0.2em] font-black uppercase mb-1">
          CURATED IMAGE PENDING
        </span>
        <span className="text-neutral-500 font-mono text-[7px] tracking-wider text-center uppercase">
          Visual Identity Review Required
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${containerClassName}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-[#1E1D1A]/80 flex items-center justify-center pointer-events-none z-10">
          <span className="text-[#8A1F1F]/40 font-mono text-[9px] tracking-[0.25em] uppercase">IDEMO LOAD</span>
        </div>
      )}
      <img
        ref={handleRef}
        src={imgSrc || undefined}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        {...props}
      />
    </div>
  );
};
