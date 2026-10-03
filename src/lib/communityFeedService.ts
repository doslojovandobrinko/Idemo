/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { safeStorage } from './safeStorage';

const HISTORY_STORAGE_KEY = 'idemo_publication_history_v1';

interface PackageReleaseRecordLike {
  id: string;
  destinationId?: string;
  destinationName: string;
  packageVersion: string;
  publishedAt: string;
  releaseNotes: string;
  status: string;
}

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

export const getFallbackCommunityEvents = (): CommunityActivityEvent[] => {
  const events: CommunityActivityEvent[] = [];

  // 1. Load publications published from IDEMO Studio
  try {
    const rawHistory = safeStorage.getItem(HISTORY_STORAGE_KEY);
    if (rawHistory) {
      const history: PackageReleaseRecordLike[] = JSON.parse(rawHistory);
      if (Array.isArray(history) && history.length > 0) {
        history.slice(0, 3).forEach((pkg) => {
          events.push({
            id: `pkg-${pkg.id || pkg.packageVersion}`,
            timestamp: new Date(pkg.publishedAt || Date.now()).getTime(),
            type: 'PACKAGE_RELEASE',
            badge: buildBadgeMap('PACKAGE_RELEASE', 'Destination Package'),
            title: {
              sr: `Objavljen odredišni paket: ${pkg.destinationName} v${pkg.packageVersion}`,
              en: `Destination Package Released: ${pkg.destinationName} v${pkg.packageVersion}`,
              ru: `Выпущен пакет направления: ${pkg.destinationName} v${pkg.packageVersion}`,
              zh: `目的地礼包已发布：${pkg.destinationName} v${pkg.packageVersion}`,
              de: `Destinationspaket veröffentlicht: ${pkg.destinationName} v${pkg.packageVersion}`,
              es: `Paquete de destino publicado: ${pkg.destinationName} v${pkg.packageVersion}`
            },
            description: {
              sr: pkg.releaseNotes || 'Zvanično odobren i objavljen odredišni paket u IDEMO ekosistemu.',
              en: pkg.releaseNotes || 'Officially verified and published destination package in the IDEMO ecosystem.',
              ru: pkg.releaseNotes || 'Официально проверенный и опубликованный пакет направления.',
              zh: pkg.releaseNotes || 'IDEMO 生态系统中经过官方验证并发布的目的地礼包。',
              de: pkg.releaseNotes || 'Offiziell verifiziertes und veröffentlichtes Destinationspaket.',
              es: pkg.releaseNotes || 'Paquete de destino oficialmente verificado y publicado.'
            }
          });
        });
      }
    }
  } catch (err) {
    console.warn('[communityFeed] Error reading publication history fallback:', err);
  }

  // 2. Add canonical editorial notices so the feed always provides curated updates
  const canonicalNotices: CommunityActivityEvent[] = [
    {
      id: 'canon-kablar-viewpoint',
      timestamp: Date.now() - 3600 * 1000 * 24, // 1 day ago
      type: 'NEW_REC',
      badge: buildBadgeMap('NEW_REC', 'Nature'),
      title: {
        sr: 'Nova kuracija: Vidikovac Kablar i Ovčarsko-kablarska klisura',
        en: 'New Curation: Kablar Viewpoint & Ovčar-Kablar Gorge',
        ru: 'Новая рекомендация: Смотровая площадка Каблар',
        zh: '新推荐：卡布拉尔观景点与峡谷',
        de: 'Neue Empfehlung: Kablar Aussichtspunkt & Ovčar-Kablar Schlucht',
        es: 'Nueva recomendación: Mirador de Kablar y Desfiladero'
      },
      description: {
        sr: 'Urednička preporuka sa autentičnim fotografijama vidikovca, planinarskim rutama i savetima kustosa za posetu.',
        en: 'Editorial recommendation featuring authentic viewpoint photography, hiking trails, and curator timing advice.',
        ru: 'Кураторская рекомендация с аутентичными фотографиями, пешеходными маршрутами и советами.',
        zh: '包含真实观景点摄影、远足步道和策展人时间的独家推荐。',
        de: 'Redaktionelle Empfehlung mit authentischer Fotografie, Wanderrouten und Empfehlungen des Kurators.',
        es: 'Recomendación editorial con fotografía auténtica del mirador, senderos y consejos del curador.'
      }
    },
    {
      id: 'canon-partner-network',
      timestamp: Date.now() - 3600 * 1000 * 48, // 2 days ago
      type: 'NEW_PARTNER',
      badge: buildBadgeMap('NEW_PARTNER', 'Verified Partner'),
      title: {
        sr: 'Aktivirana IDEMO privatna partnerska mreža',
        en: 'IDEMO Private Partner Network Activated',
        ru: 'Активирована сеть партнеров IDEMO',
        zh: 'IDEMO 私人合作伙伴网络已激活',
        de: 'IDEMO Privates Partnernetzwerk aktiviert',
        es: 'Red privada de socios de IDEMO activada'
      },
      description: {
        sr: 'Akreditovani lokalni partneri sa QR pasošima i direktnom konsijerž koordinacijom za posetioce.',
        en: 'Accredited local partners with QR passports and direct concierge coordination for travelers.',
        ru: 'Аккредитованные партнеры с QR-паспортами и консьерж-координацией.',
        zh: '具有二维码通行证并为旅行者提供礼宾协调服务的认证本地合作伙伴。',
        de: 'Akkreditierte lokale Partner mit QR-Pässen und direkter Concierge-Koordination.',
        es: 'Socios locales acreditados con pasaportes QR y coordinación directa de conserjería.'
      }
    },
    {
      id: 'canon-baseline-pkg',
      timestamp: Date.now() - 3600 * 1000 * 72, // 3 days ago
      type: 'PACKAGE_RELEASE',
      badge: buildBadgeMap('PACKAGE_RELEASE', 'Destination Package'),
      title: {
        sr: 'Objavljen odredišni paket: Srbija Kanonski Baseline v1.2.0',
        en: 'Destination Package Released: Serbia Canonical Baseline v1.2.0',
        ru: 'Выпущен пакет направления: Сербия v1.2.0',
        zh: '目的地礼包已发布：塞尔维亚基线 v1.2.0',
        de: 'Destinationspaket veröffentlicht: Serbien Baseline v1.2.0',
        es: 'Paquete de destino publicado: Serbia Canonical Baseline v1.2.0'
      },
      description: {
        sr: 'Zvanični paket sa 113 verifikovanih kuracija, 5 licenciranih partnera i kalibrisanim Mood Orbit koordinatama.',
        en: 'Official package with 113 verified curations, 5 licensed partners, and calibrated Mood Orbit coordinates.',
        ru: 'Официальный пакет со 113 проверенными рекомендациями и 5 партнерами.',
        zh: '官方礼包，包含 113 项经过验证的精选推荐和 5 个授权合作伙伴。',
        de: 'Offizielles Paket mit 113 geprüften Empfehlungen und 5 lizenzierten Partnern.',
        es: 'Paquete oficial con 113 recomendaciones verificadas y 5 socios con licencia.'
      }
    }
  ];

  // Merge events and avoid duplicate titles
  const existingIds = new Set(events.map((e) => e.id));
  canonicalNotices.forEach((notice) => {
    if (!existingIds.has(notice.id)) {
      events.push(notice);
    }
  });

  return events.slice(0, 6);
};

export const loadAuthoritativeCommunityEvents = async (): Promise<CommunityActivityEvent[]> => {
  if (!isSupabaseConfigured()) {
    return getFallbackCommunityEvents();
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return getFallbackCommunityEvents();
  }

  try {
    const { data, error } = await supabase.rpc('get_authoritative_community_events_secure');

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      // Fallback query directly against published tables if RPC function is not yet deployed or returned empty
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

      // If database is empty or RPC returned 0 rows, fallback gracefully to Studio publication history & canonical notices
      return getFallbackCommunityEvents();
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
    return getFallbackCommunityEvents();
  }
};
