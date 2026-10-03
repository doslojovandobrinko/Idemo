/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';

interface CachedSignedUrl {
  url: string;
  expiresAt: number;
}

const signedUrlCache = new Map<string, CachedSignedUrl>();

const imageMap = new Map<string, string>();

try {
  if (typeof import.meta !== 'undefined' && typeof (import.meta as any).glob === 'function') {
    const imageModules = (import.meta as any).glob(
      ['/src/assets/images/*.{webp,png,jpg,jpeg}', '/public/assets/images/*.{webp,png,jpg,jpeg}'],
      { eager: true, import: 'default' }
    );
    for (const [path, url] of Object.entries(imageModules)) {
      if (typeof url === 'string') {
        const filename = path.split('/').pop()?.toLowerCase() || '';
        if (filename) {
          imageMap.set(filename, url);
          const base = filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
          imageMap.set(base, url);
        }
      }
    }
  }
} catch {
  // Fallback for non-Vite environments
}

/**
 * Utility to map image assets to optimized WebP versions and Vite module URLs.
 * Provides authoritative asset resolution for the entire IDEMO platform across all deployment environments.
 */
export function getOptimizedImageUrl(src: string): string {
  if (!src) return '';
  if (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Extract base filename
  const parts = src.split('/');
  const rawFilename = parts[parts.length - 1].toLowerCase();
  
  if (rawFilename) {
    // 1. Direct filename lookup in Vite module map
    if (imageMap.has(rawFilename)) {
      return imageMap.get(rawFilename)!;
    }
    
    // 2. Base name lookup (extension-agnostic, resolving .png references to .webp)
    const baseName = rawFilename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    if (imageMap.has(baseName)) {
      return imageMap.get(baseName)!;
    }
  }
  
  // 3. Fallback: clean relative path without leading root slashes that break iframe origins
  let cleaned = src;
  if (cleaned.startsWith('/src/assets/images/')) {
    cleaned = cleaned.replace('/src/assets/images/', 'assets/images/');
  } else if (cleaned.startsWith('src/assets/images/')) {
    cleaned = cleaned.replace('src/assets/images/', 'assets/images/');
  } else if (cleaned.startsWith('/assets/images/')) {
    cleaned = cleaned.replace('/assets/images/', 'assets/images/');
  }
  
  if (cleaned.endsWith('.png')) {
    cleaned = cleaned.substring(0, cleaned.length - 4) + '.webp';
  }
  
  return cleaned;
}

export const resolveImage = getOptimizedImageUrl;

/**
 * Invalidates cached signed URLs for private media assets.
 * If specific path is provided, invalidates only that path; otherwise clears full cache.
 */
export function invalidateMediaCache(objectPath?: string): void {
  if (!objectPath) {
    signedUrlCache.clear();
    return;
  }
  let cleanPath = objectPath.trim().replace(/^\/+/, '');
  while (cleanPath.startsWith('recommendation-media/')) {
    cleanPath = cleanPath.slice('recommendation-media/'.length).replace(/^\/+/, '');
  }
  signedUrlCache.delete(cleanPath);
}

/**
 * Authoritative Single Source of Truth (SSOT) for resolving any IDEMO media reference
 * into a valid, displayable browser URL.
 * 
 * Supports:
 * 1. Temporary local blob URLs ('blob:...') -> returned directly for immediate interactive previews
 * 2. Data URLs ('data:...') -> returned directly
 * 3. Remote HTTP/HTTPS URLs ('http://', 'https://') -> returned directly
 * 4. Bundled/static assets ('/src/assets/...', '/assets/...') -> mapped via getOptimizedImageUrl
 * 5. Governed private media storage references ('recommendation-media/...', 'recommendations/...') -> fetches signed read URL via Supabase Storage
 */
export async function resolveMediaDisplayUrl(src: string, expiresInSeconds: number = 3600): Promise<string> {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (
    trimmed.startsWith('/src/assets/images/') ||
    trimmed.startsWith('src/assets/images/') ||
    trimmed.startsWith('assets/images/') ||
    trimmed.startsWith('/assets/images/')
  ) {
    return getOptimizedImageUrl(trimmed);
  }

  // Check if src is a storage path reference (bucket-prefixed or bucket-relative)
  const isStorageReference =
    trimmed.startsWith('recommendation-media/') ||
    trimmed.startsWith('/recommendation-media/') ||
    trimmed.startsWith('recommendations/') ||
    trimmed.startsWith('/recommendations/');

  if (isStorageReference) {
    // Strip leading slashes and any leading 'recommendation-media/' bucket prefix(es)
    let cleanPath = trimmed.replace(/^\/+/, '');
    while (cleanPath.startsWith('recommendation-media/')) {
      cleanPath = cleanPath.slice('recommendation-media/'.length).replace(/^\/+/, '');
    }
    
    // Check in-memory cache first (with 60-second safety buffer)
    const cached = signedUrlCache.get(cleanPath);
    if (cached && cached.expiresAt > Date.now() + 60000) {
      return cached.url;
    }

    if (!isSupabaseConfigured()) {
      throw new Error('MEDIA_STORAGE_UNAVAILABLE: Supabase is not configured to resolve private media.');
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('MEDIA_STORAGE_UNAVAILABLE: Supabase client is uninitialized.');
    }

    const { data, error } = await supabase.storage
      .from('recommendation-media')
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (!error && data?.signedUrl) {
      // Cache valid signed URL
      signedUrlCache.set(cleanPath, {
        url: data.signedUrl,
        expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
      });

      return data.signedUrl;
    }

    // Fallback attempt: getPublicUrl for public-bucket assets if createSignedUrl fails
    try {
      const publicResult = supabase.storage
        .from('recommendation-media')
        .getPublicUrl(cleanPath);
      if (publicResult?.data?.publicUrl) {
        return publicResult.data.publicUrl;
      }
    } catch {
      // ignore fallback error and throw signedUrl error below
    }

    throw new Error(error?.message || 'MEDIA_SIGNED_URL_FAILED: Could not generate signed read URL.');
  }

  // Default fallback to getOptimizedImageUrl for any other static/relative paths
  return getOptimizedImageUrl(trimmed);
}

