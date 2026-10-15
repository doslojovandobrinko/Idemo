/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from './safeStorage';

export const getLocalizedValue = (item: any, field: string, lang: string) => {
  if (!item) return '';

  // Tier 1: Selected Language - Try hardcoded translation first
  if (item.translations?.[lang]?.[field]) {
    return item.translations[lang][field];
  }

  // Tier 2: Check localStorage translation cache for the selected language
  const originalText = item[field] || item.translations?.['en']?.[field] || '';
  const cacheKey = `tr_${item.id || item.title || 'g'}_${lang}_${field}`;
  
  if (lang !== 'en') {
    const cachedValue = safeStorage.getItem(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }
  }

  // Tier 3: Fall back to English hardcoded translation if available
  if (item.translations?.['en']?.[field]) {
    return item.translations['en'][field];
  }

  // Tier 4: Fall back to base field (English / Primary)
  if (item[field]) {
    return item[field];
  }

  // Tier 5: Absolute protection against empty text (scan all other translation keys)
  if (item.translations) {
    for (const otherLang of Object.keys(item.translations)) {
      if (item.translations[otherLang]?.[field]) {
        return item.translations[otherLang][field];
      }
    }
  }

  // Return original text immediately (offline-first, zero tracking / network leakage)
  return originalText || `[${field}]`;
};

export const formatCategory = (categoryStr: string, tDict: any) => {
  if (!categoryStr) return '';
  return categoryStr.split(',').map(c => {
    const term = c.trim();
    return tDict['category_' + term.toLowerCase()] || term;
  }).join(' / ');
};

/**
 * Formats estimated cost / price strings based on user's active language selection.
 * English ('en') -> USD ($)
 * Russian ('ru') -> RUB (₽)
 * Chinese ('zh') -> CNY (¥)
 * German ('de') / Spanish ('es') -> EUR (€)
 * Serbian ('sr') / Default -> EUR (€)
 * 
 * Benchmark exchange rates relative to EUR:
 * 1 EUR ≈ 1.08 USD
 * 1 EUR ≈ 100 RUB
 * 1 EUR ≈ 7.8 CNY
 * 1 EUR ≈ 117 RSD
 */
export const formatCurrencyByLanguage = (costStr: string | undefined | null, lang: string): string => {
  if (!costStr || typeof costStr !== 'string') return '';

  const trimmed = costStr.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Handle Free / Besplatno cases
  if (lower === 'free' || lower === 'besplatno' || lower.includes('besplatno') || lower.includes('free')) {
    if (lang === 'ru') return 'Бесплатно';
    if (lang === 'zh') return '免费';
    if (lang === 'de') return 'Kostenlos';
    if (lang === 'es') return 'Gratis';
    if (lang === 'sr') return 'Besplatno';
    return 'Free';
  }

  // Determine target currency config
  let config: { rate: number; symbol: string; isPrefix: boolean; locale: string } = {
    rate: 1.0,
    symbol: '€',
    isPrefix: true,
    locale: 'de-DE'
  };

  if (lang === 'en') {
    config = { rate: 1.08, symbol: '$', isPrefix: true, locale: 'en-US' };
  } else if (lang === 'ru') {
    config = { rate: 100, symbol: '₽', isPrefix: false, locale: 'ru-RU' };
  } else if (lang === 'zh') {
    config = { rate: 7.8, symbol: '¥', isPrefix: true, locale: 'zh-CN' };
  } else if (lang === 'de' || lang === 'es' || lang === 'sr') {
    config = { rate: 1.0, symbol: '€', isPrefix: true, locale: 'de-DE' };
  }

  // Replace each number sequence inside costStr with converted value
  const isRSD = lower.includes('rsd') || lower.includes('din');
  const baseRate = isRSD ? (1 / 117) * config.rate : config.rate;

  const convertNum = (numStr: string): string => {
    const rawVal = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(rawVal)) return numStr;
    const converted = Math.round(rawVal * baseRate);
    if (config.isPrefix) {
      return `${config.symbol}${converted.toLocaleString(config.locale)}`;
    }
    return `${converted.toLocaleString(config.locale)} ${config.symbol}`;
  };

  // Strip existing currency markers
  let cleaned = trimmed
    .replace(/€\s*/g, '')
    .replace(/\s*€/g, '')
    .replace(/EUR/gi, '')
    .replace(/RSD/gi, '')
    .trim();

  // Replace numbers
  const formattedNumbers = cleaned.replace(/\d+(?:[\.,]\d+)?/g, (match) => convertNum(match));

  return formattedNumbers || costStr;
};

