/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO Partner Card Carousel Engine
 * 14-Slot Twice-Daily (AM/PM) Schedule Across 7 Days a Week
 * Governed via IDEMO Studio with Canonical Offline-First Fallbacks
 */

import { safeStorage } from './safeStorage';

// Curated Local Assets
import uvacImg from '../assets/images/uvac_meanders_1778841048759.webp';
import kalemegdanSunsetImg from '../assets/images/kalemegdanska_terasa_sunset_1778843501085.webp';
import golubacImg from '../assets/images/golubac_fortress_danube_1778842880053.webp';
import silosiNightImg from '../assets/images/silosi_belgrade_industrial_night_1778842947193.webp';
import manasijaImg from '../assets/images/manasija_monastery_1778841065960.webp';
import salon1905Img from '../assets/images/salon_1905_interior_1778845083168.webp';
import taraForestImg from '../assets/images/tara_forest_reset_hike_1778848171218.webp';
import zemunKafanaImg from '../assets/images/zemun_danube_kafana_1778846414640.webp';
import fruskaVineyardImg from '../assets/images/fruska_gora_monastery_vineyard_1778842911981.webp';
import hypeSplavImg from '../assets/images/hype_belgrade_splav_luxury_1778844082665.webp';
import ovcarKablarImg from '../assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp';
import rajackePimniceImg from '../assets/images/rajacke_pimnice_village_1778843436699.webp';
import vrnjackaBanjaImg from '../assets/images/vrnjacka_banja_1778841098566.webp';
import saintSavaInteriorImg from '../assets/images/saint_sava_temple_interior_1778845911761.webp';

export interface PartnerCarouselSlide {
  id: string;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  slotTime: 'AM' | 'PM'; // AM: 06:00 - 18:00, PM: 18:00 - 06:00
  slotLabelEn: string;
  slotLabelSr: string;
  titleEn: string;
  titleSr: string;
  locationEn: string;
  locationSr: string;
  tagEn: string;
  tagSr: string;
  imageUrl: string;
  isCustom?: boolean;
}

export const CANONICAL_PARTNER_CAROUSEL_SLIDES: PartnerCarouselSlide[] = [
  // MONDAY (Day Index 1)
  {
    id: 'mon-am',
    dayIndex: 1,
    slotTime: 'AM',
    slotLabelEn: 'MONDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'PONEDELJAK DAN • 06:00–18:00',
    titleEn: 'Uvac Canyon Meanders',
    titleSr: 'Meandri Kanjona Uvca',
    locationEn: 'Sjenica & Pešter Plateau',
    locationSr: 'Sjenica i Pešterska Visoravan',
    tagEn: 'WILD NATURE & HABITAT',
    tagSr: 'DIVLJA PRIRODA I STANIŠTE',
    imageUrl: uvacImg,
  },
  {
    id: 'mon-pm',
    dayIndex: 1,
    slotTime: 'PM',
    slotLabelEn: 'MONDAY EVENING • 18:00–06:00',
    slotLabelSr: 'PONEDELJAK VEČE • 18:00–06:00',
    titleEn: 'Kalemegdan Sunset Confluence',
    titleSr: 'Zalazak Sunca na Kalemegdanu',
    locationEn: 'Belgrade Fortress & Terrace',
    locationSr: 'Beogradska Tvrđava i Terasa',
    tagEn: 'GOLDEN HOUR PANORAMA',
    tagSr: 'PANORAMA ZLATNOG ČASA',
    imageUrl: kalemegdanSunsetImg,
  },

  // TUESDAY (Day Index 2)
  {
    id: 'tue-am',
    dayIndex: 2,
    slotTime: 'AM',
    slotLabelEn: 'TUESDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'UTORAK DAN • 06:00–18:00',
    titleEn: 'Golubac Danube Fortress',
    titleSr: 'Golubačka Tvrđava na Dunavu',
    locationEn: 'Djerdap Gorge & Iron Gates',
    locationSr: 'Đerdapska Klisura i Gvozdena Vrata',
    tagEn: 'MEDIEVAL WATER CITADEL',
    tagSr: 'SREDNJEVEKOVNA VODENA TVRĐAVA',
    imageUrl: golubacImg,
  },
  {
    id: 'tue-pm',
    dayIndex: 2,
    slotTime: 'PM',
    slotLabelEn: 'TUESDAY EVENING • 18:00–06:00',
    slotLabelSr: 'UTORAK VEČE • 18:00–06:00',
    titleEn: 'Silosi Belgrade Riverside Arts',
    titleSr: 'Silosi Beograd i Dunavska Umetnost',
    locationEn: 'Dorćol Danube Waterfront',
    locationSr: 'Dorćolsko Dunavsko Priobalje',
    tagEn: 'CULTURAL LIGHTS & GATHERING',
    tagSr: 'KULTURNA RASVETA I SUSRETI',
    imageUrl: silosiNightImg,
  },

  // WEDNESDAY (Day Index 3)
  {
    id: 'wed-am',
    dayIndex: 3,
    slotTime: 'AM',
    slotLabelEn: 'WEDNESDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'SREDA DAN • 06:00–18:00',
    titleEn: 'Manasija Royal Monastery',
    titleSr: 'Kraljevski Manastir Manasija',
    locationEn: 'Despotovac, Resava Valley',
    locationSr: 'Despotovac, Resavska Dolina',
    tagEn: 'ROYAL HERITAGE & TOWERS',
    tagSr: 'KRALJEVSKA BAŠTINA I KULE',
    imageUrl: manasijaImg,
  },
  {
    id: 'wed-pm',
    dayIndex: 3,
    slotTime: 'PM',
    slotLabelEn: 'WEDNESDAY EVENING • 18:00–06:00',
    slotLabelSr: 'SREDA VEČE • 18:00–06:00',
    titleEn: 'Salon 1905 Heritage Dining',
    titleSr: 'Salon 1905 Istorijska Gastronomija',
    locationEn: 'Geozavod Palace, Belgrade',
    locationSr: 'Palata Geozavoda, Beograd',
    tagEn: 'BELLE ÉPOQUE LUXURY',
    tagSr: 'BELLE ÉPOQUE EKSKLUZIVA',
    imageUrl: salon1905Img,
  },

  // THURSDAY (Day Index 4)
  {
    id: 'thu-am',
    dayIndex: 4,
    slotTime: 'AM',
    slotLabelEn: 'THURSDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'ČETVRTAK DAN • 06:00–18:00',
    titleEn: 'Tara National Park Forest Reset',
    titleSr: 'Nacionalni Park Tara i Šumski Mir',
    locationEn: 'Bajina Bašta & Tara Canopy',
    locationSr: 'Bajina Bašta i Tarine Šume',
    tagEn: 'PRISTINE ALPINE RESIDENTIAL',
    tagSr: 'AUTENTIČNI PLANINSKI MIR',
    imageUrl: taraForestImg,
  },
  {
    id: 'thu-pm',
    dayIndex: 4,
    slotTime: 'PM',
    slotLabelEn: 'THURSDAY EVENING • 18:00–06:00',
    slotLabelSr: 'ČETVRTAK VEČE • 18:00–06:00',
    titleEn: 'Zemun Danube Quay at Twilight',
    titleSr: 'Zemunski Kej u Sumrak',
    locationEn: 'Gardoš Promenade & Riverfront',
    locationSr: 'Gardoš Promenada i Dunav',
    tagEn: 'TRADITIONAL KAFANA WARMTH',
    tagSr: 'TRADICIONALNA KAFANSKA TOPLINA',
    imageUrl: zemunKafanaImg,
  },

  // FRIDAY (Day Index 5)
  {
    id: 'fri-am',
    dayIndex: 5,
    slotTime: 'AM',
    slotLabelEn: 'FRIDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'PETAK DAN • 06:00–18:00',
    titleEn: 'Fruška Gora Monastic Vineyards',
    titleSr: 'Fruškogorski Manastirski Vinogradi',
    locationEn: 'Sremski Karlovci & Fruška Gora',
    locationSr: 'Sremski Karlovci i Fruška Gora',
    tagEn: 'ROLLING VINEYARDS & TERROIR',
    tagSr: 'VINORODNA BRDA I TEROAR',
    imageUrl: fruskaVineyardImg,
  },
  {
    id: 'fri-pm',
    dayIndex: 5,
    slotTime: 'PM',
    slotLabelEn: 'FRIDAY EVENING • 18:00–06:00',
    slotLabelSr: 'PETAK VEČE • 18:00–06:00',
    titleEn: 'Belgrade Waterfront Splav Lounge',
    titleSr: 'Beogradski Rečni Splav Saloni',
    locationEn: 'Sava Riverbank, Belgrade',
    locationSr: 'Savski Kej, Beograd',
    tagEn: 'RIVERSIDE NIGHTLIFE PRESTIGE',
    tagSr: 'REČNA NOĆNA EKSKLUZIVA',
    imageUrl: hypeSplavImg,
  },

  // SATURDAY (Day Index 6)
  {
    id: 'sat-am',
    dayIndex: 6,
    slotTime: 'AM',
    slotLabelEn: 'SATURDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'SUBOTA DAN • 06:00–18:00',
    titleEn: 'Ovčar-Kablar Gorge & Monasteries',
    titleSr: 'Ovčarsko-Kablarska Klisura i Manastiri',
    locationEn: 'West Morava River & Summit',
    locationSr: 'Zapadna Morava i Kablarski Vrh',
    tagEn: 'PANORAMIC GORGE VISTA',
    tagSr: 'PANORAMSKI POGLED NA KLISURU',
    imageUrl: ovcarKablarImg,
  },
  {
    id: 'sat-pm',
    dayIndex: 6,
    slotTime: 'PM',
    slotLabelEn: 'SATURDAY EVENING • 18:00–06:00',
    slotLabelSr: 'SUBOTA VEČE • 18:00–06:00',
    titleEn: 'Rajačke Pimnice Medieval Cellars',
    titleSr: 'Rajačke Pimnice i Kameni Podrumi',
    locationEn: 'Negotin Valley, Eastern Serbia',
    locationSr: 'Negotinska Krajina',
    tagEn: 'STONE ARCHITECTURE & WINE LORE',
    tagSr: 'KAMENA ARHITEKTURA I VINA',
    imageUrl: rajackePimniceImg,
  },

  // SUNDAY (Day Index 0)
  {
    id: 'sun-am',
    dayIndex: 0,
    slotTime: 'AM',
    slotLabelEn: 'SUNDAY DAYLIGHT • 06:00–18:00',
    slotLabelSr: 'NEDELJA DAN • 06:00–18:00',
    titleEn: 'Vrnjačka Banja Historic Spa Park',
    titleSr: 'Vrnjačka Banja i Istorijski Park',
    locationEn: 'Central Serbia Thermal Springs',
    locationSr: 'Termalni Izvori Centralne Srbije',
    tagEn: 'SERENE ROMAN THERMAL PROMENADE',
    tagSr: 'MIRNA PROMENADA I MINERALNI IZVORI',
    imageUrl: vrnjackaBanjaImg,
  },
  {
    id: 'sun-pm',
    dayIndex: 0,
    slotTime: 'PM',
    slotLabelEn: 'SUNDAY EVENING • 18:00–06:00',
    slotLabelSr: 'NEDELJA VEČE • 18:00–06:00',
    titleEn: 'Saint Sava Temple Gold Mosaics',
    titleSr: 'Hram Svetog Save i Zlatni Mozaici',
    locationEn: 'Vračar Plateau, Belgrade',
    locationSr: 'Vračarski Plato, Beograd',
    tagEn: 'BYZANTINE DOME ILLUMINATION',
    tagSr: 'VIZANTIJSKA KUPOLA I TIŠINA',
    imageUrl: saintSavaInteriorImg,
  },
];

const STORAGE_KEY = 'idemo_partner_carousel_config_v1';
export const EVENT_PARTNER_CAROUSEL_UPDATED = 'idemo_partner_carousel_updated';

/**
 * Calculates current active slot index based on local device day and hour.
 * AM slot: 06:00 to 17:59:59 (6:00 AM - 5:59 PM)
 * PM slot: 18:00 to 05:59:59 (6:00 PM - 5:59 AM)
 */
export function getActiveSlotIndex(slides: PartnerCarouselSlide[], customDate?: Date): number {
  if (!slides || slides.length === 0) return 0;
  
  const d = customDate || new Date();
  const currentDay = d.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
  const currentHour = d.getHours();
  const currentSlotTime: 'AM' | 'PM' = (currentHour >= 6 && currentHour < 18) ? 'AM' : 'PM';

  const matchIdx = slides.findIndex(
    s => s.dayIndex === currentDay && s.slotTime === currentSlotTime
  );

  return matchIdx >= 0 ? matchIdx : 0;
}

/**
 * Loads carousel configuration with safe local storage persistence.
 */
export function getPartnerCarouselSlides(): PartnerCarouselSlide[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[PartnerCarousel] Failed to parse custom config, using canonical', err);
  }
  return CANONICAL_PARTNER_CAROUSEL_SLIDES;
}

/**
 * Saves updated carousel configuration and dispatches live notification.
 */
export function savePartnerCarouselSlides(slides: PartnerCarouselSlide[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_PARTNER_CAROUSEL_UPDATED, { detail: slides }));
    }
  } catch (err) {
    console.error('[PartnerCarousel] Save failed', err);
  }
}

/**
 * Resets carousel configuration to canonical IDEMO curation.
 */
export function resetPartnerCarouselSlides(): void {
  try {
    safeStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_PARTNER_CAROUSEL_UPDATED, { detail: CANONICAL_PARTNER_CAROUSEL_SLIDES }));
    }
  } catch (err) {
    console.error('[PartnerCarousel] Reset failed', err);
  }
}
