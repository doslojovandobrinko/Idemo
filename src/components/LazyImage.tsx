/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { getOptimizedImageUrl } from "../utils/assetHelper";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
  isAdminPreview?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  fallbackSrc = "assets/images/silosi_belgrade_industrial_night_1778842947193.webp",
  className = "",
  containerClassName = "w-full h-full",
  alt = "",
  isAdminPreview = false,
  ...props
}) => {
  // Safe helper to strip dev prefixes and ensure relative path for published and AppMyWeb builds
  const cleanPath = (p: string): string => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) {
      return p;
    }
    let cp = p;
    if (cp.startsWith("/")) {
      cp = cp.substring(1);
    }
    if (cp.startsWith("src/assets/images/")) {
      cp = cp.replace("src/assets/images/", "assets/images/");
    }
    return cp;
  };

  const getResolvedFallback = () => {
    if (!fallbackSrc) return "";
    if (
      fallbackSrc.startsWith("http://") ||
      fallbackSrc.startsWith("https://")
    ) {
      return fallbackSrc;
    }
    let fb = fallbackSrc;
    if (fb.startsWith("/")) {
      fb = fb.substring(1);
    }
    if (fb.startsWith("src/assets/images/")) {
      fb = fb.replace("src/assets/images/", "assets/images/");
    }
    if (fb.endsWith(".png")) {
      fb = fb.substring(0, fb.length - 4) + ".webp";
    }
    return fb;
  };

  const resolvedFallback = getResolvedFallback();
  const initialSrc = getOptimizedImageUrl(cleanPath(src));
  const [imgSrc, setImgSrc] = useState<string>(initialSrc || resolvedFallback);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Sync state when src changes (Critical for switching views and candidates)
  React.useEffect(() => {
    const nextSrc = getOptimizedImageUrl(cleanPath(src));
    setImgSrc(nextSrc || resolvedFallback);
    setIsLoaded(false);
    setHasError(false);
  }, [src, fallbackSrc]);

  // Handle cached images that are already loaded when ref is bound
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, [imgSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(resolvedFallback);
    }
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const isPending = !src || src.includes("draft_placeholder") || hasError;

  if (isPending && isAdminPreview) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-950 border border-neutral-800 p-4 select-none ${containerClassName}`}
      >
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
    <div
      className={`relative overflow-hidden bg-neutral-900 ${containerClassName}`}
    >
      {/* Shimmer/Skeleton loader when loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-[#1E1D1A]/80 flex items-center justify-center">
          <span className="text-[#8A1F1F]/40 font-mono text-[9px] tracking-[0.25em] uppercase">
            IDEMO LOAD
          </span>
        </div>
      )}
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        className={`${className} transition-opacity duration-500 ease-out ${isLoaded ? "opacity-100" : "opacity-0"}`}
        {...props}
      />
    </div>
  );
};
