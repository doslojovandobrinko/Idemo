/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface CommunityActivityEvent {
  id: string;
  timestamp: number;
  type: 'NEW_REC' | 'UPDATED_REC' | 'NEW_PARTNER' | 'PACKAGE_RELEASE' | 'SEASONAL_NOTICE';
  badge: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface AuthoritativeEventRow {
  event_id: string;
  event_type: string;
  occurred_at: string;
  entity_type: string;
  entity_id: string;
  destination_id?: string;
  title_en: string;
  title_sr: string;
  summary_en: string;
  summary_sr: string;
  safe_category: string;
}

const buildBadgeMap = (eventType: string, safeCategory: string): Record<string, string> => {
  if (eventType === 'NEW_REC') {
    return {
      sr: 'NOVA PREPORUKA',
      ru: 'НОВАЯ РЕКОМЕНДАЦИЯ',
      zh: '新推荐',
      de: 'NEUE EMPFEHLUNG',
      es: 'NUEVA RECOMENDACIÓN',
      en: 'NEW RECOMMENDATION'
    };
  }
  if (eventType === 'UPDATED_REC') {
    return {
      sr: 'AŽURIRANA PREPORUKA',
      ru: 'ОБНОВЛЕННАЯ РЕКОМЕНДАЦИЯ',
      zh: '已更新推荐',
      de: 'AKTUALISIERTE EMPFEHLUNG',
      es: 'RECOMENDACIÓN ACTUALIZADA',
      en: 'UPDATED RECOMMENDATION'
    };
  }
  if (eventType === 'NEW_PARTNER') {
    return {
      sr: 'PROVERENI PARTNER',
      ru: 'ПРОВЕРЕННЫЙ ПАРТНЕР',
      zh: '已认证合作伙伴',
      de: 'GEPRÜFTER PARTNER',
      es: 'SOCIO VERIFICADO',
      en: 'VERIFIED PARTNER'
    };
  }
  if (eventType === 'PACKAGE_RELEASE') {
    return {
      sr: 'ODREDIŠNI PAKET',
      ru: 'ПАКЕТ НАПРАВЛЕНИЯ',
      zh: '目的地礼包',
      de: 'DESTINATIONS-PAKET',
      es: 'PAQUETE DE DESTINO',
      en: 'DESTINATION PACKAGE'
    };
  }
  if (eventType === 'SEASONAL_NOTICE') {
    return {
      sr: 'SEZONSKA PREPORUKA',
      ru: 'СЕЗОННАЯ РЕКОМЕНДАЦИЯ',
      zh: '时令推荐',
      de: 'SAISONALE EMPFEHLUNG',
      es: 'RECOMENDACIÓN DE TEMPORADA',
      en: 'SEASONAL RECOMMENDATION'
    };
  }
  return {
    sr: safeCategory.toUpperCase(),
    ru: safeCategory.toUpperCase(),
    zh: safeCategory,
    de: safeCategory.toUpperCase(),
    es: safeCategory.toUpperCase(),
    en: safeCategory.toUpperCase()
  };
};

export const loadAuthoritativeCommunityEvents = async (): Promise<CommunityActivityEvent[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('get_authoritative_community_events_secure');

    if (error || !data || !Array.isArray(data)) {
      // Fallback query directly against published tables if RPC function is not yet deployed
      const { data: recs } = await supabase
        .from('recommendations')
        .select('id, source_id, title_en, title_sr, short_description_en, short_description_sr, category, created_at, updated_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (recs && Array.isArray(recs) && recs.length > 0) {
        return recs.map((r: any) => ({
          id: `rec-${r.id}`,
          timestamp: new Date(r.updated_at || r.created_at || Date.now()).getTime(),
          type: 'NEW_REC',
          badge: buildBadgeMap('NEW_REC', r.category || 'Nature'),
          title: {
            sr: r.title_sr || r.title_en,
            en: r.title_en,
            ru: r.title_en,
            zh: r.title_en,
            de: r.title_en,
            es: r.title_en
          },
          description: {
            sr: r.short_description_sr || r.short_description_en || r.title_en,
            en: r.short_description_en || r.title_en,
            ru: r.short_description_en || r.title_en,
            zh: r.short_description_en || r.title_en,
            de: r.short_description_en || r.title_en,
            es: r.short_description_en || r.title_en
          }
        }));
      }

      return [];
    }

    return (data as AuthoritativeEventRow[]).map((row) => ({
      id: row.event_id,
      timestamp: new Date(row.occurred_at).getTime(),
      type: (row.event_type as any) || 'UPDATED_REC',
      badge: buildBadgeMap(row.event_type, row.safe_category || 'Editorial Notice'),
      title: {
        sr: row.title_sr || row.title_en,
        en: row.title_en,
        ru: row.title_en,
        zh: row.title_en,
        de: row.title_en,
        es: row.title_en
      },
      description: {
        sr: row.summary_sr || row.summary_en,
        en: row.summary_en,
        ru: row.summary_en,
        zh: row.summary_en,
        de: row.summary_en,
        es: row.summary_en
      }
    }));
  } catch (err) {
    console.warn('Error loading authoritative community events from Supabase:', err);
    return [];
  }
};
