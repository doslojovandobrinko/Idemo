/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, ReactNode, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  MapPin, 
  Navigation, 
  Calendar as CalendarIcon, 
  Search, 
  User, 
  Home as HomeIcon,
  ChevronRight,
  Info,
  Clock,
  ExternalLink,
  Utensils,
  Wine,
  Music,
  Theater,
  Map as MapIcon,
  Gift,
  Zap,
  Shield,
  ShieldCheck,
  Globe,
  Trash2,
  Instagram,
  MessageCircle,
  QrCode,
  Phone,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  CreditCard,
  Users,
  Eye,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Target,
  Star,
  Bookmark,
  MessageSquare
} from 'lucide-react';
import { 
  AppScreen, 
  Recommendation, 
  Category 
} from './types';
import { 
  INITIAL_RECOMMENDATIONS, 
  LANGUAGES,
  TRANSLATIONS,
  USEFUL_TIPS,
  DID_YOU_KNOW
} from './constants';
import { loadRecommendations } from './lib/recommendationsLoader';
import PremiumCarousel from './components/PremiumCarousel';
import PremiumBadge from './components/PremiumBadge';
import PlanCard from './components/PlanCard';
import QRScanner from './components/QRScanner';
import { LazyImage } from './components/LazyImage';
import { ContextEnginePanel } from './components/ContextEnginePanel';
import { PrepEtiquetteGuide } from './components/PrepEtiquetteGuide';
import { AntiAdviceSection } from './components/AntiAdviceSection';
import { getTruthCurationForRecommendation } from './lib/antiAdviceEngine';
import { ConciergeSOSHub } from './components/ConciergeSOSHub';
import { VibeSettings, DEFAULT_VIBE_SETTINGS, calculateVibeMatch, VibeCalibrationDashboard } from './components/VibeCalibration';
import { REGIONS, LocalTransitCard, isLocationInRegion, calculateDistance, BASE_HUBS, getTaxiEstimation } from './components/AreaAndTransit';
import { SlangCrypt } from './components/SlangCrypt';
import MoodOrbit from './components/MoodOrbit';
import MoodOrbGridAnalyzer from './components/MoodOrbGridAnalyzer';
import MiniMoodGrid from './components/MiniMoodGrid';
import PrivacyPolicyContent from './components/PrivacyPolicyContent';
import ProfileScreen, { ARCHETYPES } from './components/ProfileScreen';
import PartnersScreen from './components/PartnersScreen';

const CATEGORY_COORDS: Record<string, { x: number; y: number }> = {
  [Category.HISTORY]: { x: 0.55, y: 0.25 }, // Urban-leaning, slightly explorer
  [Category.NATURE]: { x: 0.85, y: 0.85 },  // Nature-leaning, high adventure
  [Category.GASTRONOMY]: { x: 0.15, y: 0.3 }, // Urban-leaning, high Hedonist
  [Category.CLUBBING]: { x: 0.3, y: 0.15 },  // Urban-leaning, high Hedonist
  [Category.WELLBEING]: { x: 0.2, y: 0.75 }, // Nature-leaning, high Hedonist
  [Category.TRAVEL]: { x: 0.75, y: 0.55 },  // Nature-leaning, adventure
  [Category.MEDICAL]: { x: 0.45, y: 0.45 }, // Central, slightly urban/hedonist
};
import { getRecommendationStatus } from './utils/statusHelper';
import { getRecommendationWalkability } from './utils/walkabilityHelper';
import { Sliders, Compass, Printer, X, Share2, Download } from 'lucide-react';
import { getLocalizedValue, formatCategory } from './lib/utils';
import { getRankedRecommendations, UserPreferences } from './lib/recommendationEngine';
import branding from './branding.json';
import { 
  getPreferenceProfile,
  trackFavoriteSignal,
  trackSearchSignal,
  trackCategoryViewSignal,
  trackQRScanSignal,
  trackMapOpenSignal,
  trackCalendarExportSignal,
  trackViewDetailsSignal,
  SIGNAL_WEIGHTS
} from './lib/preferenceEngine';
import { 
  trackAppOpen, trackQRScan, trackStoreClick, trackRecView, 
  trackRecSave, trackLanguageSelection, trackSessionDuration, logSystemError 
} from './lib/analytics';
const AdminDashboard = import.meta.env.DEV
  ? React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
  : (() => null) as unknown as React.ComponentType<any>;

const AdminAccessDialog = import.meta.env.DEV
  ? React.lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminAccessDialog })))
  : (() => null) as unknown as React.ComponentType<any>;
import { draftExpansionPool } from './data/recommendations/serbia/draft_expansion';
import IdemoLogo from './components/IdemoLogo';
import { safeStorage } from './lib/safeStorage';

// Available travel durations steps
export const ALLOWED_TIMES = [4, 8, 12, 24, 28, 48];

function NavButton({ icon, label, active, onClick, isQuiet }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; isQuiet?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
        active ? 'text-brand-charcoal font-bold scale-105' : isQuiet ? 'text-brand-charcoal/30 hover:text-brand-charcoal/60' : 'text-brand-charcoal/40 hover:text-brand-charcoal/70'
      }`}
    >
      {icon}
      <span className="text-[10px] uppercase font-mono tracking-wider">{label}</span>
    </button>
  );
}

function DetailStatSmall({ icon, label, value, onClick, link }: { icon: React.ReactNode; label: string; value: string; onClick?: () => void; link?: string }) {
  const content = (
    <div className="bg-[#F7F6F0] p-2.5 rounded-xl border border-[#E2DFC2]/60 flex items-center gap-2 text-left">
      <div className="text-accent-teal shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[8.5px] font-mono uppercase tracking-wider text-brand-charcoal/50 font-bold">{label}</p>
        <p className="text-[11px] font-sans font-bold text-brand-charcoal truncate">{value}</p>
      </div>
    </div>
  );

  if (link) {
    return <a href={link} className="block hover:opacity-80 transition-opacity">{content}</a>;
  }
  if (onClick) {
    return <button onClick={onClick} className="block w-full text-left hover:opacity-80 transition-opacity cursor-pointer">{content}</button>;
  }
  return content;
}

const ITINERARY_LOCALIZATIONS: Record<string, any> = {
  en: {
    watermark: "IDEMO • CURATED ITINERARY",
    recommended: "RECOMMENDED PLAN",
    title: "YOUR PERSONAL SERBIA JOURNEY",
    desc: "Tailored based on your calibrated Mood Orbit & Vibe.",
    visitor_profile: "Calibrated Travel Style",
    calendar_title: "Travel Horizon Calendar",
    additional_months: "Additional scheduled dates below",
    essential_protocol: "Essential Protocol",
    currency: "Currency",
    timezone: "Time Zone",
    emergency: "Emergency",
    emergency_val: "112 (EU) / 192 (Police)",
    alphabet: "Alphabet",
    alphabet_val: "Cyrillic & Latin",
    chronological: "Chronological Itinerary",
    flexible: "Flexible Schedule",
    export: "Export Plan",
    print: "Print Plan",
    saved: "Saved Destinations",
    custom_notes: "Notes & Insights"
  },
  sr: {
    watermark: "IDEMO • ODABRANI PLAN",
    recommended: "PREPORUČENI PLAN",
    title: "VAŠE LIČNO PUTOVANJE KROZ SRBIJU",
    desc: "Prilagođeno na osnovu vaše kalibrisane Mood Orbite i Vajba.",
    visitor_profile: "Kalibrisani stil putovanja",
    calendar_title: "Kalendar putovanja",
    additional_months: "Dodatni zakazani datumi ispod",
    essential_protocol: "Osnovni protokol",
    currency: "Valuta",
    timezone: "Vremenska zona",
    emergency: "Hitne službe",
    emergency_val: "112 (EU) / 192 (Policija)",
    alphabet: "Pismo",
    alphabet_val: "Ćirilica i Latinica",
    chronological: "Hronološki plan",
    flexible: "Fleksibilan raspored",
    export: "Izvezi plan",
    print: "Odštampaj plan",
    saved: "Sačuvane destinacije",
    custom_notes: "Beleške i uvidi"
  },
  zh: {
    watermark: "IDEMO • 专属定制行程",
    recommended: "推荐行程方案",
    title: "您的专属塞尔维亚探索之旅",
    desc: "根据您校准的情绪星轨与氛围智能生成。",
    visitor_profile: "已校准的旅行风格",
    calendar_title: "旅行日历",
    additional_months: "下方包含更多预订日期",
    essential_protocol: "出行基本须知",
    currency: "货币",
    timezone: "时区",
    emergency: "紧急电话",
    emergency_val: "112 (欧洲通用) / 192 (报警)",
    alphabet: "文字",
    alphabet_val: "西里尔字母与拉丁字母",
    chronological: "按时间顺序行程",
    flexible: "灵活时间安排",
    export: "导出行程",
    print: "打印行程",
    saved: "已收藏目的地",
    custom_notes: "笔记与见解"
  }
};

export const CYRILLIC_DICTIONARY: Record<string, { cyrillic: string; phonetic: string; tip: string }> = {
  '1': {
    cyrillic: "Меандри Увца",
    phonetic: "meh-AHN-dree OOV-tsah",
    tip: "Bring walking boots. Avoid noon heat as lookouts have minimal shade."
  },
  '2': {
    cyrillic: "Манастир Манасија",
    phonetic: "mah-nah-SEE-yah",
    tip: "Modest dress requested. Photography inside the church is forbidden."
  },
  '3': {
    cyrillic: "Београдски сплавови",
    phonetic: "beh-OH-grahd-skee SPLA-voh-vee",
    tip: "Book tables by 10 PM. Taxis around the waterfront might charge extra."
  },
  '4': {
    cyrillic: "Врњачка Бања",
    phonetic: "vr-NYAHCH-kah BAH-nyah",
    tip: "Drink warm 'Snežnik' spring water only in small doses as advised."
  },
  '5': {
    cyrillic: "Засавица",
    phonetic: "zah-SAH-vee-tsah",
    tip: "Taste the Mangalica cured meat plate; it is incredibly rich and unique."
  },
  '6': {
    cyrillic: "Сремски Карловци",
    phonetic: "SREM-skee KAR-lov-tsee",
    tip: "Ask winery hosts to tell you the 'Bermet wine Titanic' legend over a glass."
  },
  '7': {
    cyrillic: "Музеј Николе Тесле",
    phonetic: "MOO-zey nee-KOH-leh-TES-leh",
    tip: "Reservations mandatory. English tours happen every hour on the half-hour."
  },
  '8': {
    cyrillic: "Злакушка грнчарија",
    phonetic: "ZLAH-koosh-kah grn-CHAH-ree-yah",
    tip: "Pots here are baked with calcite; perfect for slow stove-simmered dishes."
  },
  '9': {
    cyrillic: "Вина са песка",
    phonetic: "VEE-nah sah PES-kah",
    tip: "Kadarka is the premier local grape variety here. High minerality."
  },
  '10': {
    cyrillic: "Ракија Бар",
    phonetic: "RAH-kee-yah BAR",
    tip: "Order quince (Dunja) or apricot (Kajsija). Always toast looking into eyes!"
  },
  '11': {
    cyrillic: "Дестилерија Зарић",
    phonetic: "des-tee-LEH-ree-yah ZAH-reech",
    tip: "Nirvana is their ultra-premium triple-distilled plum masterpiece."
  }
};

export const resolveImage = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  let cleanPath = path;
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  if (cleanPath.startsWith('src/assets/images/')) {
    cleanPath = cleanPath.replace('src/assets/images/', 'assets/images/');
  }
  if (cleanPath.endsWith('.png')) {
    cleanPath = cleanPath.substring(0, cleanPath.length - 4) + '.webp';
  }
  return cleanPath;
};

const getNavigationUrl = (lat: number, lng: number, title: string) => {
  if (typeof navigator === 'undefined') return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  
  const userAgent = navigator.userAgent || '';
  const isApple = /Mac|iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);

  if (isApple) {
    return `maps://?q=${encodeURIComponent(title)}&ll=${lat},${lng}`;
  } else if (isAndroid) {
    return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(title)})`;
  }
  
  // Desktop browser fallback
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};

export const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Suppress errors (e.g. security block or device limitations)
    }
  }
};

const isOfflineReady = (item: any) => {
  return !!(
    item &&
    item.id &&
    item.title &&
    item.category &&
    item.shortDescription &&
    item.longDescription &&
    item.image &&
    item.duration &&
    item.location &&
    item.coordinates &&
    item.coordinates.lat !== undefined &&
    item.coordinates.lng !== undefined
  );
};

export function getDynamicStyle(language: string, selectedCats: string[], days: string, budget: number, time: number) {
  let styleKey = 'relaxed';
  if (selectedCats.includes(Category.GASTRONOMY) || selectedCats.includes('Gastronomy')) {
    styleKey = 'gourmet';
  } else if (selectedCats.includes(Category.HISTORY) || selectedCats.includes('History') || selectedCats.includes(Category.WELLBEING) || selectedCats.includes('Wellbeing')) {
    styleKey = 'cultural';
  } else if (selectedCats.includes(Category.NATURE) || selectedCats.includes('Nature')) {
    styleKey = 'hidden';
  } else if (selectedCats.includes(Category.CLUBBING) || selectedCats.includes('Clubbing')) {
    styleKey = 'beats';
  } else if (days === 'Workdays' && budget >= 100) {
    styleKey = 'business';
  }

  const styleNames: Record<string, Record<string, string>> = {
    relaxed: {
      en: "Relaxed Discovery",
      sr: "Opušteno istraživanje",
      zh: "慢调探索",
      es: "Descubrimiento Relajado",
      de: "Entspannte Entdeckung",
      ru: "Спокойные открытия"
    },
    business: {
      en: "Business Escape",
      sr: "Poslovni beg",
      zh: "商务闲暇",
      es: "Escape de Negocios",
      de: "Business-Auszeit",
      ru: "Бизнес-отдых"
    },
    hidden: {
      en: "Hidden Serbia",
      sr: "Skrivena Srbija",
      zh: "秘境塞尔维亚",
      es: "Serbia Oculta",
      de: "Verborgenes Serbien",
      ru: "Тайны Сербии"
    },
    gourmet: {
      en: "Gourmet Afternoon",
      sr: "Gurmansko popodne",
      zh: "美味午后",
      es: "Tarde Gourmet",
      de: "Feinschmecker-Nachmittag",
      ru: "Гурманский полдень"
    },
    cultural: {
      en: "Cultural Explorer",
      sr: "Kulturni istraživač",
      zh: "人文探索者",
      es: "Explorador Cultural",
      de: "Kultur-Entdecker",
      ru: "Культурный исследователь"
    },
    beats: {
      en: "Belgrade Beats",
      sr: "Beogradski ritam",
      zh: "贝尔格莱德律动",
      es: "Ritmo de Belgrado",
      de: "Belgrader Rhythmus",
      ru: "Ритмы Белграда"
    }
  };

  const styleName = styleNames[styleKey][language] || styleNames[styleKey].en;

  // Weather description
  const hr = new Date().getHours();
  let weatherStr = "";
  if (hr >= 5 && hr < 12) {
    weatherStr = language === 'sr' ? 'sveže letnje jutro' :
                 language === 'zh' ? '清凉的夏日早晨' :
                 language === 'es' ? 'mañana fresca de verano' :
                 language === 'de' ? 'frischer Sommermorgen' :
                 language === 'ru' ? 'прохладное летнее утро' :
                 'breezy summer morning';
  } else if (hr >= 12 && hr < 17) {
    weatherStr = language === 'sr' ? 'sunčano letnje popodne' :
                 language === 'zh' ? '阳光明媚的夏日午后' :
                 language === 'es' ? 'tarde soleada de verano' :
                 language === 'de' ? 'sonniger Nachmittag im Sommer' :
                 language === 'ru' ? 'солнечный летний день' :
                 'sunny summer afternoon';
  } else if (hr >= 17 && hr < 22) {
    weatherStr = language === 'sr' ? 'toplo letnje veče' :
                 language === 'zh' ? '温暖的夏日傍晚' :
                 language === 'es' ? 'cálido atardecer de verano' :
                 language === 'de' ? 'warmer Sommerabend' :
                 language === 'ru' ? 'теплый летний вечер' :
                 'warm summer evening';
  } else {
    weatherStr = language === 'sr' ? 'vedro letnje noćno nebo' :
                 language === 'zh' ? '晴朗的夏夜星空' :
                 language === 'es' ? 'noche despejada de verano' :
                 language === 'de' ? 'klarer Sommernachthimmel' :
                 language === 'ru' ? 'ясная летняя ночь' :
                 'clear summer night sky';
  }

  // Time explanation
  let timeStr = "";
  if (time <= 4) {
    timeStr = language === 'sr' ? `raspoloživo ${time} sata (mikro-izlet)` :
              language === 'zh' ? `仅有 ${time} 小时可用 (微旅行)` :
              language === 'es' ? `${time} horas disponibles (micro-viaje)` :
              language === 'de' ? `${time} Stunden verfügbar (Mikro-Trip)` :
              language === 'ru' ? `доступно ${time} ч. (микро-поездка)` :
              `${time} hours available (micro-trip)`;
  } else if (time <= 8) {
    timeStr = language === 'sr' ? `raspoloživo ${time} sati (poludnevni doživljaj)` :
              language === 'zh' ? `${time} 小时可用 (半日深度体验)` :
              language === 'es' ? `${time} horas disponibles (inmersión de medio día)` :
              language === 'de' ? `${time} Stunden verfügbar (Halbtages-Erlebnis)` :
              language === 'ru' ? `доступно ${time} ч. (на poludnevni doživljaj)` :
              `${time} hours available (half-day immersion)`;
  } else {
    timeStr = language === 'sr' ? `raspoloživo ${time} sati (celodnevno putovanje)` :
              language === 'zh' ? `${time} 小时可用 (全天深度之旅)` :
              language === 'es' ? `${time} horas disponibles (viaje de día completo)` :
              language === 'de' ? `${time} Stunden verfügbar (Tagesausflug)` :
              language === 'ru' ? `доступно ${time} ч. (полный день)` :
              `${time} hours available (full day journey)`;
  }

  // Interests list
  const interestBullets: string[] = [];
  if (selectedCats.length > 0) {
    const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
    selectedCats.forEach((cat: string) => {
      const label = t['category_' + cat.toLowerCase()] || cat;
      let interestStr = "";
      if (language === 'sr') interestStr = `sklonost ka: ${label.toLowerCase()}`;
      else if (language === 'zh') interestStr = `偏好：${label}`;
      else if (language === 'es') interestStr = `preferencia por ${label.toLowerCase()}`;
      else if (language === 'de') interestStr = `Vorliebe für ${label.toLowerCase()}`;
      else if (language === 'ru') interestStr = `предпочтение: ${label.toLowerCase()}`;
      else interestStr = `preference for ${label.toLowerCase()}`;
      interestBullets.push(interestStr);
    });
  } else {
    let generalStr = "";
    if (language === 'sr') generalStr = "prilagođeno opštem istraživanju";
    else if (language === 'zh') generalStr = "通用探索校准";
    else if (language === 'es') generalStr = "adaptado para exploración general";
    else if (language === 'de') generalStr = "angepasst an allgemeine Erkundung";
    else if (language === 'ru') generalStr = "настроено для общего исследования";
    else generalStr = "calibrated for general discovery";
    interestBullets.push(generalStr);
  }

  // Location explanation
  let locationStr = "";
  if (selectedCats.includes(Category.NATURE) || selectedCats.includes('Nature')) {
    locationStr = language === 'sr' ? "blizu slikovitog ušća Save i Dunava" :
                  language === 'zh' ? "邻近萨瓦河与多瑙河的壮丽交汇处" :
                  language === 'es' ? "cerca de los escénicos ríos Sava y Danubio" :
                  language === 'de' ? "nahe der malerischen Save und Donau" :
                  language === 'ru' ? "близ живописного слияния Савы и Дуная" :
                  "close to scenic Sava/Danube rivers";
  } else if (selectedCats.includes(Category.GASTRONOMY) || selectedCats.includes('Gastronomy')) {
    locationStr = language === 'sr' ? "pogodno za kulinarski centar Beograda" :
                  language === 'zh' ? "便捷通达贝尔格莱德美食中心" :
                  language === 'es' ? "conveniente para el núcleo culinario de Belgrado" :
                  language === 'de' ? "ideal für das kulinarische Herz Belgrads" :
                  language === 'ru' ? "удобно для гастрономического central'nogo kulinarnogo centra" :
                  "convenient for Belgrade's culinary core";
  } else if (selectedCats.includes(Category.CLUBBING) || selectedCats.includes('Clubbing')) {
    locationStr = language === 'sr' ? "savršeno pozicionirano blizu splavova na Savi" :
                  language === 'zh' ? "完美契合萨瓦河畔的浮船俱乐部 (Splavovi)" :
                  language === 'es' ? "perfectamente alineado con los splavovi del río Sava" :
                  language === 'de' ? "perfekt gelegen nahe den Save-Splavovi" :
                  language === 'ru' ? "отлично подходит для сплавов на реке Сава" :
                  "perfectly aligned with Sava River splavovi";
  } else {
    locationStr = language === 'sr' ? "izuzetno blizu kompleksa EXPO 2027" :
                  language === 'zh' ? "高效便捷通达世博会 (EXPO 2027) 展馆" :
                  language === 'es' ? "muy accesible al complejo EXPO 2027" :
                  language === 'de' ? "hervorragende Anbindung zum EXPO 2027 Gelände" :
                  language === 'ru' ? "отличная доступность до комплекса ЭКСПО-2027" :
                  "highly accessible to EXPO 2027 complex";
  }

  const whyBullets = [
    weatherStr,
    timeStr,
    ...interestBullets,
    locationStr
  ];

  return {
    styleName,
    whyBullets
  };
}

interface CalendarMonthViewProps {
  year: number;
  month: number;
  highlightedDays: number[];
  language: string;
  key?: any;
}

function CalendarMonthView({ year, month, highlightedDays, language }: CalendarMonthViewProps) {
  const dayNamesEn = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const dayNamesSr = ['По', 'Ут', 'Ср', 'Че', 'Пе', 'Су', 'Не'];
  const dayNames = language === 'sr' ? dayNamesSr : dayNamesEn;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesSr = [
    'Јануар', 'Фебруар', 'Март', 'Април', 'Мај', 'Јун',
    'Јул', 'Август', 'Септембар', 'Октобар', 'Новембар', 'Децембар'
  ];
  const monthName = language === 'sr' ? monthNamesSr[month - 1] : monthNamesEn[month - 1];

  const firstDay = new Date(year, month - 1, 1);
  const adjustedFirstDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < adjustedFirstDay; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="bg-[#FAF9F5]/90 border border-[#E5E3DB] rounded-xl p-2.5 w-full text-center font-sans shadow-xs mt-1">
      <div className="text-[9px] font-black uppercase text-[#1E2E20] tracking-wider mb-2 border-b border-[#E5E3DB]/80 pb-1 font-serif flex items-center justify-between">
        <span>{monthName}</span>
        <span className="opacity-60">{year}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[7.5px] font-bold text-[#8C8A7D] uppercase mb-1">
        {dayNames.map((d, i) => (
          <div key={i} className="text-center w-full">{d}</div>
        ))}
      </div>
      <div className="space-y-0.5">
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-7 gap-0.5 text-[8.5px]">
            {row.map((day, dIdx) => {
              if (day === null) return <div key={dIdx} className="w-[18px] h-[18px] pointer-events-none" />;
              const isHighlighted = highlightedDays.includes(day);
              return (
                <div 
                  key={dIdx} 
                  className={`w-[18px] h-[18px] flex items-center justify-center rounded-full font-semibold transition-all ${
                    isHighlighted 
                      ? 'bg-[#2E7D32] text-white font-black shadow-xs scale-105 border border-[#1E2E20]/10' 
                      : 'text-[#2D3025] hover:bg-[#E5E3DB]/30'
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function getInitialFavorites(): Set<string> {
  let raw: string | null = null;
  try {
    raw = safeStorage.getItem('idemo_favorites_v1');
  } catch (e) {
    console.warn('Could not read idemo_favorites_v1:', e);
  }

  let isLegacy = false;
  if (!raw) {
    try {
      raw = safeStorage.getItem('idemo_liked_ids_v1');
      if (raw) isLegacy = true;
    } catch (e) {
      console.warn('Could not read idemo_liked_ids_v1:', e);
    }
  }

  if (!raw) return new Set<string>();

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();

    const validIds: string[] = [];
    const set = new Set<string>();

    for (const item of parsed) {
      if (item === null || item === undefined) continue;
      if (typeof item === 'object') continue;
      if (typeof item === 'boolean') continue;

      const norm = String(item).trim();
      if (!norm || norm === '[object Object]') continue;

      if (!set.has(norm)) {
        set.add(norm);
        validIds.push(norm);
      }
    }

    if (isLegacy && validIds.length > 0) {
      try {
        safeStorage.setItem('idemo_favorites_v1', JSON.stringify(validIds));
      } catch (e) {
        console.warn('Could not migrate legacy favorites:', e);
      }
    }

    return set;
  } catch (e) {
    console.warn('Could not parse favorites:', e);
    return new Set<string>();
  }
}

function getInitialSchedule(): Recommendation[] {
  let raw: string | null = null;
  try {
    raw = safeStorage.getItem('idemo_schedule');
  } catch (e) {
    console.warn('Could not read idemo_schedule:', e);
  }

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const result: Recommendation[] = [];
    const seenIds = new Set<string>();

    for (const item of parsed) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      if (item.id === null || item.id === undefined) continue;
      if (typeof item.id === 'object' || typeof item.id === 'boolean') continue;

      const normId = String(item.id).trim();
      if (!normId || normId === '[object Object]') continue;

      if (seenIds.has(normId)) continue;
      seenIds.add(normId);

      const validDate = typeof item.scheduledDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.scheduledDate)
        ? item.scheduledDate
        : undefined;

      result.push({
        ...item,
        id: normId,
        scheduledDate: validDate
      });
    }

    return result;
  } catch (e) {
    console.warn('Could not parse schedule:', e);
    return [];
  }
}

function resolvePlannerItems(storedItems: Recommendation[], userFacingRecs: Recommendation[]): Recommendation[] {
  const recMap = new Map<string, Recommendation>();
  for (const r of userFacingRecs) {
    if (r && r.id) {
      recMap.set(String(r.id).trim(), r);
    }
  }

  return storedItems.map(item => {
    const normId = String(item.id).trim();
    const liveRec = recMap.get(normId);

    if (liveRec) {
      return {
        ...liveRec,
        scheduledDate: item.scheduledDate,
        isAvailable: true
      };
    } else {
      return {
        ...item,
        isAvailable: false
      };
    }
  });
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing');
  const [selectedRecId, setSelectedRecId] = useState<string | null>(null);
  const [landingImage, setLandingImage] = useState<string>(() => {
    try {
      return safeStorage.getItem('idemo_custom_landing_image_v1') || '';
    } catch {
      return '';
    }
  });

  const handleUpdateLandingImage = (img: string) => {
    setLandingImage(img);
    try {
      safeStorage.setItem('idemo_custom_landing_image_v1', img);
    } catch (err) {
      console.error("Storage failed:", err);
    }
  };
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  
  const [customRecommendations, setCustomRecommendations] = useState<Recommendation[]>(() => {
    try {
      const saved = safeStorage.getItem('idemo_custom_recommendations_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [modifiedRecommendations, setModifiedRecommendations] = useState<Record<string, Recommendation>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_modified_recommendations_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [deletedRecommendationIds, setDeletedRecommendationIds] = useState<string[]>(() => {
    try {
      const saved = safeStorage.getItem('idemo_deleted_recommendations_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editorialStatuses, setEditorialStatuses] = useState<Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_editorial_statuses_v1');
      if (saved) return JSON.parse(saved);
    } catch {}

    const initial: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'> = {};
    INITIAL_RECOMMENDATIONS.forEach(r => {
      initial[r.id] = 'APPROVED';
    });
    const needsResearchIds = ['draft-41', 'draft-42', 'draft-44', 'draft-46'];
    draftExpansionPool.forEach(r => {
      if (needsResearchIds.includes(r.id)) {
        initial[r.id] = 'NEEDS RESEARCH';
      } else {
        initial[r.id] = 'CANDIDATE';
      }
    });
    return initial;
  });

  const [liveRecommendations, setLiveRecommendations] = useState<Recommendation[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadRecommendations().then((res) => {
      if (isMounted) {
        if (res.data && res.data.length > 0) {
          setLiveRecommendations(res.data);
        } else if (res.error) {
          console.info('[IDEMO Recommendations Loader]', res.error);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const baseRecommendationsList = liveRecommendations ?? INITIAL_RECOMMENDATIONS;

  const liveIdsSet = useMemo(() => {
    if (!liveRecommendations) return null;
    return new Set(liveRecommendations.map(r => r.id));
  }, [liveRecommendations]);

  const handleUpdateEditorialStatuses = (nextStatuses: Record<string, 'CANDIDATE' | 'NEEDS RESEARCH' | 'APPROVED' | 'MERGE CANDIDATE' | 'RETIRED'>) => {
    setEditorialStatuses(nextStatuses);
    try {
      safeStorage.setItem('idemo_editorial_statuses_v1', JSON.stringify(nextStatuses));
    } catch (e) {
      console.warn('Could not save editorial statuses:', e);
    }
  };

  const allRecommendations = useMemo(() => {
    const deletedSet = new Set(deletedRecommendationIds);
    
    // Only include base recommendations and any draft candidate explicitly APPROVED
    const approvedDrafts = draftExpansionPool.filter(r => editorialStatuses[r.id] === 'APPROVED');
    
    const baseItems = [...baseRecommendationsList, ...approvedDrafts].map(item => {
      if (modifiedRecommendations[item.id]) {
        return { ...item, ...modifiedRecommendations[item.id] };
      }
      return item;
    });

    // Plus customRecommendations (with overrides)
    const customItems = customRecommendations.map(item => {
      if (modifiedRecommendations[item.id]) {
        return { ...item, ...modifiedRecommendations[item.id] };
      }
      return item;
    });

    const combined = [...baseItems, ...customItems];

    const uniqueMap = new Map<string, Recommendation>();
    combined.forEach(item => {
      if (!deletedSet.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [baseRecommendationsList, customRecommendations, modifiedRecommendations, deletedRecommendationIds, editorialStatuses]);

  const adminAllRecommendations = useMemo(() => {
    const deletedSet = new Set(deletedRecommendationIds);
    
    // Include BOTH base recommendations and draftExpansionPool for admin review desk
    const baseItems = [...baseRecommendationsList, ...draftExpansionPool].map(item => {
      if (modifiedRecommendations[item.id]) {
        return { ...item, ...modifiedRecommendations[item.id] };
      }
      return item;
    });

    const customItems = customRecommendations.map(item => {
      if (modifiedRecommendations[item.id]) {
        return { ...item, ...modifiedRecommendations[item.id] };
      }
      return item;
    });

    const combined = [...baseItems, ...customItems];

    const uniqueMap = new Map<string, Recommendation>();
    combined.forEach(item => {
      if (!deletedSet.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    return Array.from(uniqueMap.values());
  }, [baseRecommendationsList, customRecommendations, modifiedRecommendations, deletedRecommendationIds]);

  const appStartTimeRef = React.useRef(Date.now());
  const [likedIds, setLikedIds] = useState<Set<string>>(() => getInitialFavorites());
  const likedIdsRef = React.useRef<Set<string>>(likedIds);

  const [scheduledItems, setScheduledItems] = useState<Recommendation[]>(() => getInitialSchedule());
  const [language, setLanguage] = useState('en');
  const [translationNonce, setTranslationNonce] = useState(0);

  const [confirmedAccuracyRecs, setConfirmedAccuracyRecs] = useState<Record<string, { timestamp: string, result: string, categories?: string[], note?: string }>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_accuracy_confirmations_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [accuracyModalOpen, setAccuracyModalOpen] = useState(false);
  const [accuracySelectedItem, setAccuracySelectedItem] = useState<any | null>(null);
  const [accuracyQuestionStep, setAccuracyQuestionStep] = useState<1 | 2 | 'success'>(1);
  const [accuracyAnswers, setAccuracyAnswers] = useState<{ accurate: 'Yes' | 'Mostly' | 'NeedsUpdate' | null, categories: string[], note: string }>({
    accurate: null,
    categories: [],
    note: ''
  });
  const [showAccuracyNoteField, setShowAccuracyNoteField] = useState(false);

  const handleConfirmAccuracySubmit = () => {
    if (!accuracySelectedItem) return;

    const timestamp = new Date().toISOString();
    const result = accuracyAnswers.accurate || 'Yes';
    const categories = accuracyAnswers.categories;
    const note = accuracyAnswers.note;
    const recId = accuracySelectedItem.id;

    // ANTI-ABUSE: One submission per recommendation per device per 24 hours
    const now = Date.now();
    const existingConf = confirmedAccuracyRecs[recId];
    if (existingConf && existingConf.timestamp) {
      const confTime = new Date(existingConf.timestamp).getTime();
      const diffHrs = (now - confTime) / (1000 * 60 * 60);
      if (diffHrs < 24) {
        alert(
          language === 'sr' 
            ? 'Već ste poslali potvrdu za ovu lokaciju u poslednja 24 sata.' 
            : language === 'zh' 
            ? '您在过去 24 小时内已提交过该地点的验证。' 
            : 'You have already submitted a confirmation for this location in the last 24 hours.'
        );
        setAccuracyModalOpen(false);
        return;
      }
    }

    // ANTI-ABUSE: Sanitize note (strip HTML, remove links, limit to 200 chars)
    let sanitizedNote = note.replace(/<[^>]*>/g, ''); // strip HTML
    sanitizedNote = sanitizedNote.replace(/https?:\/\/[^\s]+/gi, '[link removed]'); // strip links
    sanitizedNote = sanitizedNote.replace(/www\.[^\s]+/gi, '[link removed]');
    sanitizedNote = sanitizedNote.slice(0, 200); // max 200 chars

    // ANTI-ABUSE: Ignore identical duplicate submissions
    let submissionsList: any[] = [];
    try {
      const savedSubmissions = safeStorage.getItem('idemo_editorial_observations_v1');
      submissionsList = savedSubmissions ? JSON.parse(savedSubmissions) : [];
    } catch (e) {
      console.warn(e);
    }

    const isDuplicate = submissionsList.some((s: any) => 
      s.recId === recId && 
      s.category === (result === 'Yes' ? 'Yes' : categories.join(', ')) && 
      s.note === sanitizedNote
    );

    if (isDuplicate) {
      console.log("Ignored identical duplicate submission");
      setAccuracyQuestionStep('success');
      setTimeout(() => {
        setAccuracyModalOpen(false);
      }, 2500);
      return;
    }

    const updatedConfirmations = {
      ...confirmedAccuracyRecs,
      [recId]: {
        timestamp,
        result,
        categories,
        note: sanitizedNote
      }
    };
    setConfirmedAccuracyRecs(updatedConfirmations);
    try {
      safeStorage.setItem('idemo_accuracy_confirmations_v1', JSON.stringify(updatedConfirmations));
    } catch (e) {
      console.warn("Could not save accuracy confirmations locally:", e);
    }

    try {
      const newSubmission = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        recId,
        recTitle: accuracySelectedItem.title,
        category: result === 'Yes' ? 'Yes' : categories.join(', '),
        note: sanitizedNote,
        language,
        appVersion: '1.0.0',
        timestamp,
        status: 'New'
      };

      submissionsList.push(newSubmission);
      safeStorage.setItem('idemo_editorial_observations_v1', JSON.stringify(submissionsList));
    } catch (e) {
      console.warn("Could not save submission to CEMS editorial inbox:", e);
    }

    setAccuracyQuestionStep('success');
    setTimeout(() => {
      setAccuracyModalOpen(false);
    }, 2500);
  };

  useEffect(() => {
    const handleTranslationUpdate = () => {
      setTranslationNonce(n => n + 1);
    };
    window.addEventListener('translation-updated', handleTranslationUpdate);
    return () => {
      window.removeEventListener('translation-updated', handleTranslationUpdate);
    };
  }, []);

  React.useEffect(() => {
    trackAppOpen();

    // Check query string QR attribution and deep routing parameters
    try {
      const qParams = new URLSearchParams(window.location.search);
      const srcAttribution = qParams.get('src');
      if (srcAttribution) {
        trackQRScan(srcAttribution);
      }

      const screenParam = qParams.get('screen') || qParams.get('route');
      const recIdParam = qParams.get('rec_id') || qParams.get('recId') || qParams.get('recommendation');

      if (screenParam) {
        const validScreens: AppScreen[] = ['landing', 'home', 'explore', 'plan', 'profile'];
        if (validScreens.includes(screenParam as AppScreen)) {
          setCurrentScreen(screenParam as AppScreen);
          safeStorage.setItem('idemo_onboarded_v3', 'true');
          setShowOnboarding(false);
        }
      }

      if (recIdParam) {
        setSelectedRecId(recIdParam);
        setCurrentScreen('details');
        safeStorage.setItem('idemo_onboarded_v3', 'true');
        setShowOnboarding(false);
      }

      // Cleanse parameters only if there's tracking data without direct routes
      if (srcAttribution && !screenParam && !recIdParam) {
        const targetCleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, targetCleanUrl);
      }
    } catch (err) {
      logSystemError('Failed to parse query string campaign/deep links', 'URL_PARSER_ERROR');
    }
  }, []);

  React.useEffect(() => {
    if (language) {
      trackLanguageSelection(language);
    }
  }, [language]);

  React.useEffect(() => {
    const updateDuration = () => {
      const elapsedMins = (Date.now() - appStartTimeRef.current) / 60000;
      trackSessionDuration(elapsedMins);
    };

    const trackingInterval = setInterval(updateDuration, 30000); // Update aggregate buckets every 30s

    const visibilityChecker = () => {
      if (document.visibilityState === 'hidden') {
        updateDuration();
      }
    };

    window.addEventListener('visibilitychange', visibilityChecker);
    return () => {
      clearInterval(trackingInterval);
      window.removeEventListener('visibilitychange', visibilityChecker);
    };
  }, []);

  React.useEffect(() => {
    if (!isAdmin) return;
    let absoluteLastActive = Date.now();
    const handleInactivityTouch = () => {
      absoluteLastActive = Date.now();
    };

    const actionEvents = ['mousemove', 'keypress', 'touchstart', 'click', 'scroll'];
    actionEvents.forEach(ev => window.addEventListener(ev, handleInactivityTouch));

    const checkLockStatusInterval = setInterval(() => {
      if (Date.now() - absoluteLastActive > 15 * 60 * 1000) { // 15 Minute absolute timeout
        setIsAdmin(false);
        logSystemError('Administrative session expired due to inactivity', 'SECURITY_LOCKOUT');
      }
    }, 10000); // Heartbeat validation every 10 seconds

    return () => {
      actionEvents.forEach(ev => window.removeEventListener(ev, handleInactivityTouch));
      clearInterval(checkLockStatusInterval);
    };
  }, [isAdmin]);

  const [lowSignalMode, setLowSignalMode] = useState<boolean>(() => {
    try {
      const saved = safeStorage.getItem('idemo_low_signal');
      if (saved !== null) return JSON.parse(saved);
      // Default to false to ensure a premium visual experience without false-positives
      // caused by sandboxed iframe navigator.onLine reporting false
      return false;
    } catch {
      return false;
    }
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [networkToast, setNetworkToast] = useState<'online' | 'offline' | null>(null);
  const [pendingExternalLink, setPendingExternalLink] = useState<string | null>(null);

  useEffect(() => {
    if (networkToast) {
      const timer = setTimeout(() => setNetworkToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [networkToast]);

  const toggleLowSignalMode = () => {
    setLowSignalMode(prev => {
      const next = !prev;
      try {
        safeStorage.setItem('idemo_low_signal', JSON.stringify(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const handlePurgeMemories = () => {
    setLikedIds(new Set());
    setScheduledItems([]);
    setRatings({});
    setImplicitTastes({});
    setBudget(100);
    setTime(24);
    setDays('All');
    try {
      const h = new Date().getHours();
      setTimeOfDay((h >= 9 && h < 18) ? 'Working hours' : 'Evening');
    } catch {
      setTimeOfDay('All');
    }
    setSelectedCats([Category.TRAVEL, Category.HISTORY]);

    try {
      safeStorage.getAllKeys().forEach(key => {
        if (key.startsWith('tr_') || key.startsWith('idemo_') || key.startsWith('serbiabre_')) {
          safeStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
  };

  const handleResetOnboarding = () => {
    try {
      safeStorage.removeItem('idemo_onboarded_v3');
      safeStorage.removeItem('idemo_discovery_dismissed_v1');
    } catch (e) {}
    setShowOnboarding(true);
  };

  React.useEffect(() => {
    const handleOffline = () => {
      setLowSignalMode(true);
      setIsOnline(false);
      setNetworkToast('offline');
    };
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkToast('online');
      const conn = (navigator as any).connection;
      if (conn && (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType))) {
        setLowSignalMode(true);
      } else {
        setLowSignalMode(false);
      }
    };

    // Global interceptor for external departure confirmation (safeguarding user attention)
    const handleGlobalClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          const href = target.getAttribute('href');
          // Match any web link (http/https) that doesn't navigate locally or internally
          if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.host)) {
            e.preventDefault();
            e.stopPropagation();
            setPendingExternalLink(href);
            return;
          }
        }
        target = target.parentElement;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
      window.addEventListener('click', handleGlobalClick as any, { capture: true });

      const conn = (navigator as any).connection;
      if (conn) {
        const handleConnChange = () => {
          if (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) {
            setLowSignalMode(true);
          }
        };
        conn.addEventListener('change', handleConnChange);
        return () => {
          window.removeEventListener('offline', handleOffline);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('click', handleGlobalClick as any, { capture: true });
          conn.removeEventListener('change', handleConnChange);
        };
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('click', handleGlobalClick as any, { capture: true });
      }
    };
  }, []);

  const parsedDates = React.useMemo(() => {
    return scheduledItems
      .map((item: any) => item.scheduledDate)
      .filter((d: any) => !!d)
      .map((dStr: string) => {
        const parts = dStr.split('-');
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10),
          day: parseInt(parts[2], 10)
        };
      });
  }, [scheduledItems]);

  const sortedMonths = React.useMemo(() => {
    const monthsMap: Record<string, { year: number, month: number, days: number[] }> = {};
    parsedDates.forEach((p: any) => {
      const key = `${p.year}-${p.month}`;
      if (!monthsMap[key]) {
        monthsMap[key] = { year: p.year, month: p.month, days: [] };
      }
      if (!monthsMap[key].days.includes(p.day)) {
        monthsMap[key].days.push(p.day);
      }
    });
    
    const list = Object.values(monthsMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    if (list.length === 0) {
      return [{ year: 2027, month: 5, days: [] }];
    }
    return list;
  }, [parsedDates]);

  // Lifted Profile Preferences
  const [budget, setBudget] = useState(100);
  const [time, setTime] = useState(24);
  const [days, setDays] = useState('All');
  const [timeOfDay, setTimeOfDay] = useState(() => {
    try {
      const h = new Date().getHours();
      return (h >= 9 && h < 18) ? 'Working hours' : 'Evening';
    } catch {
      return 'All';
    }
  });
  const [selectedCats, setSelectedCats] = useState([Category.TRAVEL, Category.HISTORY]);

  // Contextual Intelligence States (Dynamic Local Engine)
  const [currentWeather, setCurrentWeather] = useState<'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy'>('Sunny');
  const [currentDayOfWeek, setCurrentDayOfWeek] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>(() => {
    try {
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
      return daysOfWeek[new Date().getDay()] || 'Tuesday';
    } catch {
      return 'Tuesday';
    }
  });
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number>(() => {
    try {
      const d = new Date();
      return d.getHours() * 60 + d.getMinutes();
    } catch {
      return 600; // 10:00 AM default
    }
  });
  const [proximityReference, setProximityReference] = useState<'expo' | 'hotel' | 'zemun' | 'none'>('none');
  const [maxWalkingDistanceKm, setMaxWalkingDistanceKm] = useState<number>(0);
  const [showEverything, setShowEverything] = useState<boolean>(false);

  // Dynamically derive visitor archetype in real-time, based strictly on budget, time, and categories
  const currentArchetype = React.useMemo(() => {
    let closestArch = ARCHETYPES[0];
    let minDivergence = Infinity;

    for (const arch of ARCHETYPES) {
      // 1. Budget divergence (scaled to 0-1 range)
      const budgetDiff = Math.abs(budget - arch.targetBudget) / 400;

      // 2. Time available divergence (scaled to 0-1 range)
      const timeDiff = Math.abs(time - arch.targetTime) / 48;

      // 3. Category overlap score (0 is complete overlap, 1 is no overlap)
      const maxCats = arch.categories.length;
      let catMatchedCount = 0;
      for (const c of arch.categories) {
        if (selectedCats.includes(c)) {
          catMatchedCount++;
        }
      }
      const catDivergence = 1 - (catMatchedCount / Math.max(1, maxCats));

      // 4. Weighted global divergence strictly on these three factors
      const totalDivergence = (catDivergence * 0.5) + (budgetDiff * 0.25) + (timeDiff * 0.25);

      if (totalDivergence < minDivergence) {
        minDivergence = totalDivergence;
        closestArch = arch;
      }
    }
    return closestArch;
  }, [budget, time, selectedCats]);

  const [ratings, setRatings] = useState<Record<string, { vibe: 'like' | 'intrigue' | 'dislike', tags: string[] }>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_ratings');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveRating = (recId: string, vibe: 'like' | 'intrigue' | 'dislike', tags: string[] = []) => {
    const newRatings = { ...ratings };
    if (ratings[recId]?.vibe === vibe && tags.length === 0) {
      delete newRatings[recId];
    } else {
      newRatings[recId] = { vibe, tags };
    }
    setRatings(newRatings);
    try {
      safeStorage.setItem('idemo_ratings', JSON.stringify(newRatings));
    } catch (e) {
      console.warn('Could not save rating locally:', e);
    }
  };

  // On-Device Silent Taste Profile: Category Views & Clicks Tracking
  const [implicitTastes, setImplicitTastes] = useState<Record<string, number>>(() => {
    try {
      const saved = safeStorage.getItem('idemo_taste_profile');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const trackImplicitInterest = (recId: string, category: string) => {
    setImplicitTastes(prev => {
      const updated = { ...prev };
      
      const recKey = `rec_${recId}`;
      updated[recKey] = (updated[recKey] || 0) + 1;

      const cats = typeof category === 'string'
        ? category.split(',').map(s => s.trim())
        : [category];

      for (const cat of cats) {
        const catKey = `cat_${cat}`;
        updated[catKey] = (updated[catKey] || 0) + 1;
      }

      try {
        safeStorage.setItem('idemo_taste_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save taste profile locally:', e);
      }
      return updated;
    });
  };

  const [lpeProfile, setLpeProfile] = useState(() => getPreferenceProfile());

  useEffect(() => {
    setLpeProfile(getPreferenceProfile());
  }, [currentScreen]);

  const recordFavoriteSignal = (rec: Recommendation, isSaved: boolean) => {
    trackFavoriteSignal(rec, isSaved);
    setLpeProfile(getPreferenceProfile());
  };

  const recordCategoryViewSignal = (category: string) => {
    trackCategoryViewSignal(category);
    setLpeProfile(getPreferenceProfile());
  };

  const recordQRScanSignal = (rec: Recommendation) => {
    trackQRScanSignal(rec);
    setLpeProfile(getPreferenceProfile());
  };

  const recordMapOpenSignal = (rec: Recommendation) => {
    trackMapOpenSignal(rec);
    setLpeProfile(getPreferenceProfile());
  };

  const recordCalendarExportSignal = (rec: Recommendation) => {
    trackCalendarExportSignal(rec);
    setLpeProfile(getPreferenceProfile());
  };

  const recordViewDetailsSignal = (rec: Recommendation) => {
    trackViewDetailsSignal(rec);
    setLpeProfile(getPreferenceProfile());
  };

  const handleSelectRec = (id: string) => {
    setSelectedRecId(id);
    const rec = allRecommendations.find(r => r.id === id);
    if (rec) {
      trackImplicitInterest(id, rec.category);
      trackRecView(id); // Track recommendation views for privacy analytics
      recordViewDetailsSignal(rec);
    }
    setCurrentScreen('details');
  };

  // Calculate current coordinate representation for MoodOrbit
  const { orbitX, orbitY } = useMemo(() => {
    let totalX = 0;
    let totalY = 0;
    let count = 0;

    for (const cat of selectedCats) {
      if (CATEGORY_COORDS[cat]) {
        totalX += CATEGORY_COORDS[cat].x;
        totalY += CATEGORY_COORDS[cat].y;
        count++;
      }
    }

    let ox = count > 0 ? totalX / count : 0.5;
    let oy = count > 0 ? totalY / count : 0.5;

    // Blend coordinates with budget and time sliders to keep perfect 2-way sync
    const budgetFactor = Math.min(1, Math.max(0, (budget - 100) / 400)); // App budget [100, 500]
    ox = ox * 0.75 + (1 - budgetFactor) * 0.25;

    const timeFactor = Math.min(1, Math.max(0, (time - 2) / 46)); // App time [2, 48]
    oy = oy * 0.75 + timeFactor * 0.25;

    ox = Math.min(0.92, Math.max(0.08, ox));
    oy = Math.min(0.92, Math.max(0.08, oy));

    return { orbitX: ox, orbitY: oy };
  }, [selectedCats, budget, time]);

  const prefs: UserPreferences = {
    budget,
    time,
    days,
    timeOfDay,
    selectedCategories: selectedCats,
    ratings,
    implicitTastes,
    lpeProfile,
    currentWeather,
    currentDayOfWeek,
    currentTimeMinutes,
    proximityReference,
    maxWalkingDistanceKm,
    orbitX,
    orbitY
  };

  const userFacingRecommendations = useMemo(() => {
    return allRecommendations.filter(r => {
      const explicitStatus = editorialStatuses[r.id];
      if (explicitStatus) {
        return explicitStatus === 'APPROVED';
      }
      if (liveIdsSet !== null) {
        return liveIdsSet.has(r.id);
      }
      return false;
    });
  }, [allRecommendations, editorialStatuses, liveIdsSet]);

  const resolvedScheduledItems = React.useMemo(() => {
    return resolvePlannerItems(scheduledItems, userFacingRecommendations);
  }, [scheduledItems, userFacingRecommendations]);

  const rankedRecommendations = getRankedRecommendations(userFacingRecommendations, prefs);

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  const SEASONAL_TIPS = [
    {
      id: 'january',
      title: 'JANUARY 2027',
      subtitle: 'WINTER MAJESTY & ALPINE REST',
      image: '/src/assets/images/january_kopaonik_1779810002641.png', // Winter snowy scene
      highlights: [
        { label: 'Kopaonik Boarding', linkId: '57' }, // Kopaonik Mountain Resort
        { label: 'Old Zemun Kafanas', linkId: '58' }, // Kafanas of Old Zemun
        { label: 'Sirogojno Woolens', linkId: '66' }, // Sirogojno Hand-Knitted Wool
        { label: 'Humska Club Lounge', linkId: '41' }, // Humska Cigar Lounge
        { label: 'Gilded Fine-Dining', linkId: '42' }, // Salon 1905
        { label: 'Snowy Peaks', linkId: '26' }, // Stara Planina
        { label: 'Rakija Tasting', linkId: '63' }, // Boutique Rakija Distilleries
        { label: 'Saint Sava Temple', linkId: '54' } // Temple of Saint Sava
      ],
      mood: 'Crisp, majestic, cozy winter comfort'
    },
    {
      id: 'february',
      title: 'FEBRUARY 2027',
      subtitle: 'THERMAL SANCTUARIES & DETOX',
      image: '/src/assets/images/february_spa_1779810023424.png', // Therapeutic spa wellness pool
      highlights: [
        { label: 'Japanese Head Spa', linkId: '89' }, // Medical Package: Japanese Head Spa & Anti-Stress Belgrade Circuit
        { label: 'Vrnjačka Thermal', linkId: '86' }, // Medical Package: Vrnjačka Banja Medical Spa Recovery Circuit
        { label: 'Sokobanja Air Spa', linkId: '90' }, // Medical Package: Sokobanja Respiratory & Herbal Recovery Retreat
        { label: 'Čigota Metabolic', linkId: '88' }, // Medical Package: Čigota Zlatibor Metabolic Reset Program
        { label: 'Zepter Wellness', linkId: '40' }, // Zepter Hotel & Wellness
        { label: 'Medical Rehab', linkId: '43' }, // Serbian Medical Rehabilitation
        { label: 'Dermatology Care', linkId: '14' }, // Clinic Dr Kozarev
        { label: 'Dental Premium', linkId: '15' } // Clinic Dr Popovic
      ],
      mood: 'Restorative, warm, clinically pure'
    },
    {
      id: 'march',
      title: 'MARCH 2027',
      subtitle: 'CULTURAL HERITAGE & ARCHITECTURE',
      image: '/src/assets/images/march_heritage_1779810042111.png', // Historic castle/monastery ruins
      highlights: [
        { label: 'Secession Design', linkId: '34' }, // Subotica & Palić
        { label: 'Baroque Heritage', linkId: '6' }, // Sremski Karlovci
        { label: 'Oplenac Crypt', linkId: '56' }, // Oplenac & Royal Mausoleum
        { label: 'Monastic Calm', linkId: '2' }, // Manasija Monastery
        { label: 'Felix Romuliana', linkId: '16' }, // Felix Romuliana
        { label: 'Lepenski Vir Cradle', linkId: '20' }, // Lepenski Vir
        { label: 'Viminacium Ruins', linkId: '17' }, // Viminacium Archaeological Park
        { label: 'Boutique Shopping', linkId: '51' } // Belgrade Design Districts
      ],
      mood: 'Intellectual, historic, fresh'
    },
    {
      id: 'april',
      title: 'APRIL 2027',
      subtitle: 'ECO-ADVENTURES & FOREST PATHING',
      image: '/src/assets/images/april_fruska_gora_1779810058272.png', // Lush green forest/wooden path
      highlights: [
        { label: 'Fruška Gora Hiking', linkId: '21' }, // Fruška Gora
        { label: 'Zasavica Wetland', linkId: '5' }, // Zasavica Special Nature Reserve
        { label: 'Uvac Meanders', linkId: '1' }, // Uvac Meanders
        { label: 'Tara Pine Forest', linkId: '32' }, // Tara National Park
        { label: 'Ovčar-Kablar Gorge', linkId: '38' }, // Ovčar-Kablar Gorge
        { label: 'Carska Bara Birds', linkId: '62' }, // Carska Bara Wetlands
        { label: 'Divčibare Forest', linkId: '50' }, // Divčibare Air Spa
        { label: 'Rtanj Hermetic Peak', linkId: '28' } // Rtanj Mountain & Sokobanja
      ],
      mood: 'Vibrant, green, optimistic'
    },
    {
      id: 'may',
      title: 'MAY 2027',
      subtitle: 'SPRINGTIME AWAKENINGS',
      image: '/src/assets/images/may_zasavica_1779810079166.png', // Lush spring valley
      highlights: [
        { label: 'Dance Festival', linkId: '96' }, // Belgrade Dance Festival
        { label: 'Tesla Legacies', linkId: '7' }, // Tesla Museum
        { label: 'Fortress Views', linkId: '19' }, // Golubac Fortress
        { label: 'Baroque Spirit', linkId: '6' }, // Sremski Karlovci
        { label: 'Monastic Calm', linkId: '2' }, // Manasija Monastery
        { label: 'Organic Soul', linkId: '5' }, // Zasavica
        { label: 'Meander Cruise', linkId: '1' }, // Uvac Meanders
        { label: 'Ancient Vistas', linkId: '16' } // Felix Romuliana
      ],
      mood: 'Inspirational, fresh, vibrant'
    },
    {
      id: 'june',
      title: 'JUNE 2027',
      subtitle: 'CREATIVE ENERGY & URBAN RHYTHMS',
      image: '/src/assets/images/june_silosi_1779810096101.png', // Emerald river/kayaking
      highlights: [
        { label: 'Mikser Design', linkId: '97' }, // Mikser Festival
        { label: 'Arsenal Rock', linkId: '98' }, // Arsenal Fest
        { label: 'Riverside Beer', linkId: '102' }, // Belgrade Beer Fest
        { label: 'Industrial Hub', linkId: '23' }, // Silosi Belgrade
        { label: 'Meander Cruise', linkId: '1' }, // Uvac
        { label: 'Secession Art', linkId: '34' }, // Subotica & Palic
        { label: 'River Rhythm', linkId: '3' }, // Belgrade Waterfront Clubbing
        { label: 'Cinema Village', linkId: '30' } // Drvengrad
      ],
      mood: 'Dynamic, creative, rhythmic'
    },
    {
      id: 'july',
      title: 'JULY 2027',
      subtitle: 'PEAK SUMMER IN THE BALKANS',
      image: '/src/assets/images/july_exit_1779810113925.png', // Dramatic mountain river canyon
      highlights: [
        { label: 'EXIT Festival', linkId: '99' }, // EXIT Festival
        { label: 'Sava Lake Swim', linkId: '80' }, // Ada Ciganlija
        { label: 'Drina Regatta', linkId: '79' }, // Drina Regatta
        { label: 'Tara Wilderness', linkId: '32' }, // Tara National Park
        { label: 'Canyon Vistas', linkId: '12' }, // Banjska Stena
        { label: 'Naïve Paintings', linkId: '36' }, // Kovacica Naive Art
        { label: 'Drina Rafting', linkId: '76' }, // Drina River Soft Rafting
        { label: 'Scenic Train', linkId: '22' } // Mokra Gora
      ],
      mood: 'Electrifying, sun-drenched, wild'
    },
    {
      id: 'august',
      title: 'AUGUST 2027',
      subtitle: 'MID-SUMMER FESTIVITIES & ESCAPERIES',
      image: '/src/assets/images/august_guca_1779810130927.png', // Golden late summer lake
      highlights: [
        { label: 'Lovefest Beats', linkId: '100' }, // Lovefest
        { label: 'Nišville Jazz', linkId: '101' }, // Nišville Jazz Festival
        { label: 'Guča Trumpet', linkId: '70' }, // Guča Trumpet Festival Grounds
        { label: 'Thermal Retreat', linkId: '4' }, // Vrnjačka Banja
        { label: 'Wine Stone Cellars', linkId: '25' }, // Rajačke Pimnice
        { label: 'Medical Spa', linkId: '43' }, // Serbian Medical Rehab
        { label: 'Boho Dining', linkId: '33' }, // Tri Šešira (Three Hats)
        { label: 'Thermal Gold', linkId: '24' } // Special Hospital Čigota
      ],
      mood: 'Warm, soul-stirring, folk-infused'
    },
    {
      id: 'september',
      title: 'SEPTEMBER 2027',
      subtitle: 'GOLDEN HARVESTS & STAGE ARTS',
      image: '/src/assets/images/september_vineyards_1779810155795.png', // Vineyards golden mood
      highlights: [
        { label: 'Bitef Avant-Garde', linkId: '68' }, // Bitef Theatre & Festival
        { label: 'Šumadija Wine', linkId: '55' }, // Wine Routes of Šumadija
        { label: 'Bermet Culinary', linkId: '6' }, // Sremski Karlovci
        { label: 'Sargan Eight Rail', linkId: '22' }, // Mokra Gora
        { label: 'Fairytale Village', linkId: '30' }, // Drvengrad
        { label: 'Oplenac Heritage', linkId: '56' }, // Oplenac & Royal Mausoleum
        { label: 'Imperial Glory', linkId: '16' }, // Felix Romuliana
        { label: 'Zlakusa Clay', linkId: '8' } // Zlakusa Pottery Village
      ],
      mood: 'Mellow, vintage, grape-scented'
    },
    {
      id: 'october',
      title: 'OCTOBER 2027',
      subtitle: 'CRIMSON FORESTS & HIGH OPERA',
      image: '/src/assets/images/october_tara_1779810171643.png', // Autumn forest
      highlights: [
        { label: 'Belgrade Jazz', linkId: '71' }, // Belgrade Jazz Festival Venues
        { label: 'Forest Hike', linkId: '75' }, // Tara Forest Reset & Banjska Stena Hike
        { label: 'Danube Autumn', linkId: '18' }, // Đerdap Gorge
        { label: 'Neolithic Mystery', linkId: '20' }, // Lepenski Vir
        { label: 'Opera Season', linkId: '69' }, // Serbian National Theatre
        { label: 'Salaš Comfort', linkId: '72' }, // Vojvodina Salaš (Ethno-Farms)
        { label: 'Air Spa Wells', linkId: '28' }, // Rtanj & Sokobanja
        { label: 'Pirot Flavors', linkId: '52' } // Pirot Gastronomy
      ],
      mood: 'Intellectual, leafy, acoustic'
    },
    {
      id: 'november',
      title: 'NOVEMBER 2027',
      subtitle: 'RESTORATIVE WINTER DETOX CIRCUIT',
      image: '/src/assets/images/november_temple_1779810188541.png', // Spa wellness interior
      highlights: [
        { label: 'Anti-Stress Spa', linkId: '89' }, // Medical Package: Japanese Head Spa
        { label: 'Danube & Dental', linkId: '87' }, // Medical Package: Dental Tourism
        { label: 'Aesthetic Fashion', linkId: '51' }, // Belgrade Design Districts
        { label: 'Cozy Cigar Lounge', linkId: '41' }, // Humska Cigar Lounge
        { label: 'Saint Sava Temple', linkId: '54' }, // Temple of Saint Sava
        { label: 'Avala Panorama', linkId: '64' }, // Avala Tower & Mountain
        { label: 'Dermatology Care', linkId: '14' }, // Clinic Dr Kozarev
        { label: 'Dental Premium', linkId: '15' } // Clinic Dr Popovic
      ],
      mood: 'Warm, healing, clinical precision'
    },
    {
      id: 'december',
      title: 'DECEMBER 2027',
      subtitle: 'WINTER WONDERLANDS & HIGH ALPS',
      image: '/src/assets/images/december_zemun_1779810208124.png', // Cozy snow cabins
      highlights: [
        { label: 'Kopaonik Skiing', linkId: '57' }, // Kopaonik Mountain Resort
        { label: 'Snowy Peaks', linkId: '26' }, // Stara Planina
        { label: 'Zemun Winter Cozy', linkId: '58' }, // Kafanas of Old Zemun
        { label: 'Gilded Fine-Dining', linkId: '42' }, // Salon 1905
        { label: 'Warm Wool Artisan', linkId: '66' }, // Sirogojno Hand-Knitted Wool
        { label: 'Kilim Weaving', linkId: '67' }, // Pirot Kilim Workshop
        { label: 'Clubbing Pulse', linkId: '31' }, // Drugstore Belgrade
        { label: 'Zepter Wellness', linkId: '40' } // Zepter Hotel & Wellness
      ],
      mood: 'Festive, alpine, snug comfort'
    }
  ];

  // Disclaimer constants as per user request
  const DISCLAIMER_1 = t.disclaimer_1;
  const DISCLAIMER_2 = t.disclaimer_2;

  const toggleLike = (id: string) => {
    const normId = String(id).trim();
    if (!normId || normId === '[object Object]') return;

    const isAdding = !likedIdsRef.current.has(normId);

    const next = new Set(likedIdsRef.current);
    if (isAdding) {
      next.add(normId);
    } else {
      next.delete(normId);
    }

    likedIdsRef.current = next;
    setLikedIds(next);

    try {
      safeStorage.setItem('idemo_favorites_v1', JSON.stringify(Array.from(next)));
    } catch (e) {
      console.warn('Could not save favorites to safeStorage:', e);
    }

    const rec = userFacingRecommendations.find(r => String(r.id).trim() === normId);
    if (rec) {
      recordFavoriteSignal(rec, isAdding);
    }
  };

  const scheduleItem = (rec: Recommendation, date: string, preventRedirect = false) => {
    const normId = String(rec.id).trim();
    if (!normId || normId === '[object Object]') return;

    if (scheduledItems.find(item => String(item.id).trim() === normId)) return;
    trackRecSave(normId);
    recordCalendarExportSignal(rec);

    const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

    const updated = [...scheduledItems, { ...rec, id: normId, scheduledDate: validDate }];
    setScheduledItems(updated);
    try {
      safeStorage.setItem('idemo_schedule', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save schedule locally:', e);
    }
    if (!preventRedirect) {
      setCurrentScreen('plan');
    }
  };

  const addBundleToPlan = (bundleRecIds: string[]) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setScheduledItems(prev => {
      const updated = [...prev];
      bundleRecIds.forEach(id => {
        const normId = String(id).trim();
        const rec = userFacingRecommendations.find(r => String(r.id).trim() === normId);
        if (rec && !updated.find(item => String(item.id).trim() === normId)) {
          updated.push({ ...rec, id: normId, scheduledDate: dateStr });
          recordCalendarExportSignal(rec);
        }
      });
      try {
        safeStorage.setItem('idemo_schedule', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save schedule locally:', e);
      }
      return updated;
    });
    setCurrentScreen('plan');
  };

  const updateScheduledDate = (id: string, date: string) => {
    const normId = String(id).trim();
    const validDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;

    setScheduledItems(prev => {
      const updated = prev.map(item => String(item.id).trim() === normId ? { ...item, scheduledDate: validDate } : item);
      try {
        safeStorage.setItem('idemo_schedule', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save schedule locally:', e);
      }
      return updated;
    });
  };

  const removeScheduledItem = (id: string) => {
    const normId = String(id).trim();
    setScheduledItems(prev => {
      const updated = prev.filter(item => String(item.id).trim() !== normId);
      try {
        safeStorage.setItem('idemo_schedule', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save schedule locally:', e);
      }
      return updated;
    });
  };

  const selectedRec = React.useMemo(() => {
    if (!selectedRecId) return null;
    const normId = String(selectedRecId).trim();
    return userFacingRecommendations.find(r => String(r.id).trim() === normId) || null;
  }, [selectedRecId, userFacingRecommendations]);

  const isAfterSunset = React.useMemo(() => {
    try {
      const h = new Date().getHours();
      return h >= 20 || h < 6; // After 8 PM or before 6 AM
    } catch {
      return false;
    }
  }, []);

  return (
    <>
      <div 
        id="app-main-layout"
        className={`h-screen max-h-screen h-[100dvh] max-h-[100dvh] max-w-[420px] mx-auto bg-brand-bg relative overflow-hidden overscroll-x-contain flex flex-col font-sans select-none shadow-2xl border-x border-border-main transition-all duration-1000 ${
          isAfterSunset ? 'sepia-[0.025] saturate-[0.97]' : ''
        }`}
        style={{ transform: 'translate3d(0, 0, 0)' }}
      >
      <AnimatePresence mode="wait">
        {currentScreen === 'landing' && (
          <LandingScreen 
            key="landing"
            onStart={() => {
              setCurrentScreen('home');
            }} 
            onNavigateToProfile={() => {
              setCurrentScreen('profile');
            }}
            language={language}
            setLanguage={setLanguage}
            seasonalTips={SEASONAL_TIPS}
            landingImage={landingImage}
          />
        )}

        {currentScreen === 'home' && (
          <HomeScreen 
            key="home"
            likedIds={likedIds}
            language={language}
            recommendations={rankedRecommendations}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            seasonalTips={SEASONAL_TIPS}
            onSelectRec={handleSelectRec}
            vibeSettings={currentArchetype.targetVibe}
            ratings={ratings}
            lowSignalMode={lowSignalMode}
            onToggleLowSignal={toggleLowSignalMode}
          />
        )}

        {currentScreen === 'details' && selectedRec && (
          <DetailsScreen 
            key="details"
            recommendation={selectedRec}
            language={language}
            isLiked={likedIds.has(selectedRec.id)}
            onToggleLike={() => toggleLike(selectedRec.id)}
            onBack={() => setCurrentScreen('home')}
            onSchedule={(date, preventRedirect) => scheduleItem(selectedRec, date, preventRedirect)}
            onNavigate={(screen: string) => setCurrentScreen(screen)}
            onRemove={() => removeScheduledItem(selectedRec.id)}
            rating={ratings[selectedRec.id]}
            onSaveRating={(vibe: any, tags: string[]) => saveRating(selectedRec.id, vibe, tags)}
            vibeSettings={currentArchetype.targetVibe}
            onSelectRec={handleSelectRec}
            lowSignalMode={lowSignalMode}
            allRecommendations={userFacingRecommendations}
            onConfirmAccuracy={() => {
              setAccuracySelectedItem(selectedRec);
              setAccuracyQuestionStep(1);
              setAccuracyAnswers({ accurate: null, categories: [], note: '' });
              setShowAccuracyNoteField(false);
              setAccuracyModalOpen(true);
              triggerHaptic(5);
            }}
          />
        )}

        {currentScreen === 'plan' && (
          <PlanScreen 
            key="plan"
            scheduledItems={resolvedScheduledItems}
            language={language}
            currentArchetype={currentArchetype}
            sortedMonths={sortedMonths}
            onSelectRec={handleSelectRec}
            onUpdateDate={updateScheduledDate}
            onRemove={removeScheduledItem}
            onExplore={() => setCurrentScreen('explore')}
            onAddBundle={addBundleToPlan}
            lowSignalMode={lowSignalMode}
            allRecommendations={userFacingRecommendations}
            budget={budget}
            time={time}
            days={days}
            timeOfDay={timeOfDay}
            selectedCats={selectedCats}
            orbitX={orbitX}
            orbitY={orbitY}
          />
        )}

        {currentScreen === 'explore' && (
          <ExploreScreen 
            key="explore"
            language={language}
            recommendations={rankedRecommendations}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onSelectRec={handleSelectRec}
            vibeSettings={currentArchetype.targetVibe}
            ratings={ratings}
            lowSignalMode={lowSignalMode}
            onToggleLowSignal={toggleLowSignalMode}
            recordCategoryViewSignal={recordCategoryViewSignal}
            recordQRScanSignal={recordQRScanSignal}
            recordMapOpenSignal={recordMapOpenSignal}
            lpeProfile={lpeProfile}
            currentWeather={currentWeather}
            setCurrentWeather={setCurrentWeather}
            currentDayOfWeek={currentDayOfWeek}
            setCurrentDayOfWeek={setCurrentDayOfWeek}
            currentTimeMinutes={currentTimeMinutes}
            setCurrentTimeMinutes={setCurrentTimeMinutes}
            proximityReference={proximityReference}
            setProximityReference={setProximityReference}
            maxWalkingDistanceKm={maxWalkingDistanceKm}
            setMaxWalkingDistanceKm={setMaxWalkingDistanceKm}
            showEverything={showEverything}
            setShowEverything={setShowEverything}
            allRecommendationsLength={userFacingRecommendations.length}
            budget={budget}
            time={time}
            days={days}
            selectedCats={selectedCats}
            orbitX={orbitX}
            orbitY={orbitY}
          />
        )}

        {currentScreen === 'partners' && (
          <PartnersScreen 
            key="partners"
            language={language}
            triggerHaptic={triggerHaptic}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onSelectRec={handleSelectRec}
            onNavigate={(screen: string) => setCurrentScreen(screen)}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen 
            key="profile"
            language={language}
            budget={budget} setBudget={setBudget}
            time={time} setTime={setTime}
            days={days} setDays={setDays}
            timeOfDay={timeOfDay} setTimeOfDay={setTimeOfDay}
            selectedCats={selectedCats} setSelectedCats={setSelectedCats}
            recommendations={rankedRecommendations}
            onSelectRec={handleSelectRec}
            ratings={ratings}
            likedIds={likedIds}
            lowSignalMode={lowSignalMode}
            onToggleLowSignal={toggleLowSignalMode}
            onPurgeMemories={handlePurgeMemories}
            onResetOnboarding={handleResetOnboarding}
            onTriggerAdmin={() => {
              if (import.meta.env.DEV) {
                setShowAdminLogin(true);
              }
            }}
            onNavigate={(screen: string) => setCurrentScreen(screen)}
            onAddCustomRecommendations={(recs: Recommendation[]) => {
              setCustomRecommendations(prev => {
                const updated = [...prev];
                for (const r of recs) {
                  if (!updated.some(item => item.id === r.id)) {
                    updated.push(r);
                  }
                }
                try {
                  safeStorage.setItem('idemo_custom_recommendations_v1', JSON.stringify(updated));
                } catch (e) {
                  console.warn(e);
                }
                return updated;
              });
            }}
            orbitX={orbitX}
            orbitY={orbitY}
            confirmedAccuracyRecs={confirmedAccuracyRecs}
            onConfirmAccuracy={(exp: any) => {
              setAccuracySelectedItem(exp);
              setAccuracyQuestionStep(1);
              setAccuracyAnswers({ accurate: null, categories: [], note: '' });
              setShowAccuracyNoteField(false);
              setAccuracyModalOpen(true);
              triggerHaptic(5);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {currentScreen !== 'landing' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-white/90 backdrop-blur-xl border-t border-border-main px-4 pt-4 pb-10 flex justify-between items-center z-[110] rounded-t-[40px] shadow-[0_-8px_40px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center flex-1 pr-6">
            <NavButton icon={<HomeIcon size={25} />} label={t.home} active={currentScreen === 'home'} onClick={() => { triggerHaptic(8); setCurrentScreen('home'); }} />
            <NavButton icon={<Search size={25} />} label={t.explore} active={currentScreen === 'explore'} onClick={() => { triggerHaptic(8); setCurrentScreen('explore'); }} />
            <NavButton icon={<CalendarIcon size={25} />} label={t.plan} active={currentScreen === 'plan'} onClick={() => { triggerHaptic(8); setCurrentScreen('plan'); }} />
            <NavButton icon={<User size={25} />} label={t.profile} active={currentScreen === 'profile'} onClick={() => { triggerHaptic(8); setCurrentScreen('profile'); }} />
          </div>
          <div className="pl-6 border-l border-transparent shrink-0 flex items-center justify-center">
            <NavButton 
              icon={<ShieldCheck size={25} />} 
              label={t.partners || 'Partners'} 
              active={currentScreen === 'partners'} 
              onClick={() => { triggerHaptic(8); setCurrentScreen('partners'); }} 
              isQuiet={currentScreen !== 'partners'}
            />
          </div>
        </nav>
      )}

      {/* Hidden Admin Verification Popup dialog */}
      <AnimatePresence>
        {import.meta.env.DEV && showAdminLogin && (
          <React.Suspense fallback={null}>
            <AdminAccessDialog 
              language={language}
              onSuccess={() => {
                if (import.meta.env.DEV) {
                  setShowAdminLogin(false);
                  setIsAdmin(true);
                }
              }}
              onClose={() => setShowAdminLogin(false)}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* CEMS ACCURACY CONFIRMATION OVERLAY MODAL */}
      <AnimatePresence>
        {accuracyModalOpen && accuracySelectedItem && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[700]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAccuracyModalOpen(false)}
            />
            {/* Modal Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="fixed inset-x-4 top-16 bottom-24 max-w-[400px] mx-auto bg-brand-bg rounded-[32px] border border-border-main p-6 z-[710] shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-main/50 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#44463C]">
                    {language === 'sr' ? 'CEMS VERIFIKACIJA' : language === 'zh' ? 'CEMS 信息校验' : 'CEMS VERIFICATION'}
                  </span>
                </div>
                <button 
                  onClick={() => setAccuracyModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white border border-border-main/60 flex items-center justify-center text-brand-charcoal/60 hover:text-brand-charcoal active:scale-90 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Content Panel (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-5 no-scrollbar space-y-5 text-left">
                {accuracyQuestionStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-extrabold uppercase text-[#6C5A4D] tracking-wider">
                        {accuracySelectedItem.visited}
                      </span>
                      <h4 className="font-serif text-lg font-black text-brand-charcoal leading-snug">
                        {accuracySelectedItem.title}
                      </h4>
                    </div>

                    <div className="p-4 bg-white border border-border-main/40 rounded-2xl space-y-1">
                      <h5 className="text-[12.5px] font-serif font-bold text-brand-charcoal leading-snug">
                        {language === 'sr' ? 'Da li je ova preporuka i dalje tačna?' : language === 'zh' ? '该推荐地点的信息目前依然准确吗？' : 'Is this recommendation still accurate?'}
                      </h5>
                      <p className="text-[10.5px] leading-relaxed text-brand-charcoal/60">
                        {language === 'sr'
                          ? 'Vaša činjenična potvrda direktno jača IDEMO kustos-standard. Ako se bilo šta promenilo, slobodno nam javite.'
                          : language === 'zh'
                            ? '您的客观反馈将直接协助 IDEMO 独立编辑团队维护信息准确度。若信息有变动，请告诉我们。'
                            : 'Your factual confirmation directly strengthens the IDEMO curation. If anything has changed, please let us know.'}
                      </p>
                    </div>

                    {/* Quiet Confirmation Choices */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => {
                          triggerHaptic(5);
                          setAccuracyAnswers(prev => ({ ...prev, accurate: 'Yes' }));
                          // Yes is a quiet confirmation signal
                          const timestamp = new Date().toISOString();
                          const recId = accuracySelectedItem.id;

                          // ANTI-ABUSE: One submission per recommendation per device per 24 hours
                          const now = Date.now();
                          const existingConf = confirmedAccuracyRecs[recId];
                          if (existingConf && existingConf.timestamp) {
                            const confTime = new Date(existingConf.timestamp).getTime();
                            const diffHrs = (now - confTime) / (1000 * 60 * 60);
                            if (diffHrs < 24) {
                              alert(
                                language === 'sr' 
                                  ? 'Već ste poslali potvrdu za ovu lokaciju u poslednja 24 sata.' 
                                  : language === 'zh' 
                                  ? '您在过去 24 小时内已提交过该地点的验证。' 
                                  : 'You have already submitted a confirmation for this location in the last 24 hours.'
                              );
                              setAccuracyModalOpen(false);
                              return;
                            }
                          }

                          // ANTI-ABUSE: Ignore identical duplicate submissions
                          let list: any[] = [];
                          try {
                            const saved = safeStorage.getItem('idemo_editorial_observations_v1');
                            list = saved ? JSON.parse(saved) : [];
                          } catch (e) {
                            console.warn(e);
                          }

                          const isDuplicate = list.some((s: any) => 
                            s.recId === recId && 
                            s.category === 'Yes' && 
                            s.note === ''
                          );

                          if (isDuplicate) {
                            console.log("Ignored identical duplicate submission");
                            setAccuracyQuestionStep('success');
                            setTimeout(() => {
                              setAccuracyModalOpen(false);
                            }, 2500);
                            return;
                          }

                          const updatedConfirmations = {
                            ...confirmedAccuracyRecs,
                            [recId]: {
                              timestamp,
                              result: 'Yes'
                            }
                          };
                          setConfirmedAccuracyRecs(updatedConfirmations);
                          try {
                            safeStorage.setItem('idemo_accuracy_confirmations_v1', JSON.stringify(updatedConfirmations));
                          } catch (e) {
                            console.warn("Storage failed:", e);
                          }

                          // Add to CEMS Editorial Inbox
                          try {
                            list.push({
                              id: 'sub-' + Math.random().toString(36).substring(2, 9),
                              recId,
                              recTitle: accuracySelectedItem.title,
                              category: 'Yes',
                              note: '',
                              language,
                              appVersion: '1.0.0',
                              timestamp,
                              status: 'New'
                            });
                            safeStorage.setItem('idemo_editorial_observations_v1', JSON.stringify(list));
                          } catch (e) {
                            console.warn(e);
                          }

                          setAccuracyQuestionStep('success');
                          setTimeout(() => {
                            setAccuracyModalOpen(false);
                          }, 2500);
                        }}
                        className="w-full p-4 bg-white hover:bg-white/80 border border-border-main rounded-2xl flex items-center justify-between text-left active:scale-[0.99] transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[12.5px] font-bold text-brand-charcoal flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                            {language === 'sr' ? 'Da, sve je tačno' : language === 'zh' ? '是的，准确无误' : "Yes, it's accurate"}
                          </span>
                          <span className="text-[10px] text-brand-charcoal/50 block font-medium">
                            {language === 'sr' ? 'Potvrdite detalje lokacije bez izmena' : language === 'zh' ? '验证位置、价格、营业时间等完整信息' : 'Confirm hours, location & details as is'}
                          </span>
                        </div>
                        <span className="text-brand-charcoal/30 group-hover:text-brand-charcoal transition-colors">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic(5);
                          setAccuracyAnswers(prev => ({ ...prev, accurate: 'Mostly' }));
                          setAccuracyQuestionStep(2);
                        }}
                        className="w-full p-4 bg-white hover:bg-white/80 border border-border-main rounded-2xl flex items-center justify-between text-left active:scale-[0.99] transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[12.5px] font-bold text-brand-charcoal flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#E65100]" />
                            {language === 'sr' ? 'Uglavnom tačno' : language === 'zh' ? '基本准确' : 'Mostly accurate'}
                          </span>
                          <span className="text-[10px] text-brand-charcoal/50 block font-medium">
                            {language === 'sr' ? 'Baza je dobra, ali mali detalji se razlikuju' : language === 'zh' ? '基本信息符合，但个别微小信息有变' : 'The core is right, but minor detail differs'}
                          </span>
                        </div>
                        <span className="text-brand-charcoal/30 group-hover:text-brand-charcoal transition-colors">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerHaptic(5);
                          setAccuracyAnswers(prev => ({ ...prev, accurate: 'NeedsUpdate' }));
                          setAccuracyQuestionStep(2);
                        }}
                        className="w-full p-4 bg-white hover:bg-white/80 border border-border-main rounded-2xl flex items-center justify-between text-left active:scale-[0.99] transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="text-[12.5px] font-bold text-brand-charcoal flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#C62828]" />
                            {language === 'sr' ? 'Nešto treba ažurirati' : language === 'zh' ? '信息需要更新' : 'Something needs updating'}
                          </span>
                          <span className="text-[10px] text-brand-charcoal/50 block font-medium">
                            {language === 'sr' ? 'Važna promena radnog vremena, cena ili lokacije' : language === 'zh' ? '营业时间、消费情况或位置有较明显变化' : 'Critical updates needed for hours, price, etc.'}
                          </span>
                        </div>
                        <span className="text-brand-charcoal/30 group-hover:text-brand-charcoal transition-colors">➔</span>
                      </button>
                    </div>
                  </div>
                )}

                  {accuracyQuestionStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-extrabold uppercase text-[#6C5A4D] tracking-wider">
                          {language === 'sr' ? 'ČINJENIČNA DETEKCIJA' : language === 'zh' ? '精准指出待更新项' : 'FACTUAL CHECKLIST'}
                        </span>
                        <h4 className="font-serif text-base font-black text-brand-charcoal">
                          {language === 'sr' ? 'Šta je potrebno ažurirati?' : language === 'zh' ? '哪些信息需要更新？' : 'What needs to be updated?'}
                        </h4>
                      </div>

                      {/* Chip Multi-select Layout */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { id: 'hours', label_en: 'Opening hours', label_sr: 'Radno vreme', label_zh: '营业时间' },
                          { id: 'price', label_en: 'Price details', label_sr: 'Cene', label_zh: '价格变动' },
                          { id: 'contact', label_en: 'Contact info', label_sr: 'Kontakt podaci', label_zh: '联系方式' },
                          { id: 'location', label_en: 'Location / Address', label_sr: 'Adresa / Lokacija', label_zh: '地理位置' },
                          { id: 'perm_closed', label_en: 'Closed permanently', label_sr: 'Trajno zatvoreno', label_zh: '永久停业' },
                          { id: 'temp_closed', label_en: 'Temporarily closed', label_sr: 'Privremeno zatvoreno', label_zh: '暂停营业' },
                          { id: 'desc', label_en: 'Description', label_sr: 'Tekst / Opis', label_zh: '描述内容' },
                          { id: 'photos', label_en: 'Photos', label_sr: 'Slike / Galerija', label_zh: '实景照片' },
                          { id: 'other', label_en: 'Other', label_sr: 'Drugo / Ostalo', label_zh: '其它' }
                        ].map(chip => {
                          const chipLabel = language === 'sr' ? chip.label_sr : language === 'zh' ? chip.label_zh : chip.label_en;
                          const isSelected = accuracyAnswers.categories.includes(chipLabel);
                          return (
                            <button
                              key={chip.id}
                              onClick={() => {
                                triggerHaptic(3);
                                setAccuracyAnswers(prev => {
                                  const updated = prev.categories.includes(chipLabel)
                                    ? prev.categories.filter(c => c !== chipLabel)
                                    : [...prev.categories, chipLabel];
                                  return { ...prev, categories: updated };
                                });
                                if (chip.id === 'other') {
                                  setShowAccuracyNoteField(true);
                                }
                              }}
                              className={`px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#2E7D32]/5 text-[#1B5E20] border-[#1B5E20]'
                                  : 'bg-white text-brand-charcoal/70 border-border-main/60 hover:border-brand-charcoal/30'
                              }`}
                            >
                              <span>{chipLabel}</span>
                              {isSelected && <span className="text-[9.5px]">✓</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Optional Note Trigger / Note Input Field */}
                      {!showAccuracyNoteField ? (
                        <button
                          type="button"
                          onClick={() => setShowAccuracyNoteField(true)}
                          className="text-[10px] font-extrabold uppercase tracking-widest text-[#6C5A4D] hover:text-[#4e4036] flex items-center gap-1 py-1 cursor-pointer"
                        >
                          + {language === 'sr' ? 'Dodaj belešku kustosu' : language === 'zh' ? '添加附加备注说明' : 'Add custom note to editors'}
                        </button>
                      ) : (
                        <div className="space-y-1.5 animate-fade-in pt-1">
                          <label className="text-[9.5px] uppercase tracking-wider text-brand-charcoal/50 font-extrabold block">
                            {language === 'sr' ? 'Detalji (maksimalno 200 karaktera)' : language === 'zh' ? '详细备注（最多200字）' : 'Additional Details (Max 200 Characters)'}
                          </label>
                          <textarea
                            value={accuracyAnswers.note}
                            onChange={(e) => {
                              const val = e.target.value.slice(0, 200);
                              setAccuracyAnswers(prev => ({ ...prev, note: val }));
                            }}
                            placeholder={
                              language === 'sr' 
                                ? 'Unesite tačne podatke ako su vam poznati...' 
                                : language === 'zh' 
                                ? '请输入正确的商家信息或发现的事实误差...' 
                                : 'Provide accurate details here...'
                            }
                            className="w-full p-3 bg-white border border-border-main rounded-2xl text-[12px] text-[#2D2D2D] placeholder-brand-charcoal/40 font-sans h-20 resize-none focus:outline-none focus:border-accent-teal"
                          />
                          <div className="flex justify-between text-[9px] text-brand-charcoal/40 font-mono font-bold px-1">
                            <span>{language === 'sr' ? 'Samo činjenice' : language === 'zh' ? '限客观事实' : 'Factual updates only'}</span>
                            <span>{accuracyAnswers.note.length}/200</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {accuracyQuestionStep === 'success' && (
                    <div className="py-8 text-center space-y-6 animate-fade-in flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-[#E8F5E9] border border-[#1B5E20]/20 flex items-center justify-center text-[#1B5E20] text-xl font-bold shadow-sm">
                        ✓
                      </div>

                      <div className="space-y-2 max-w-[280px]">
                        <h4 className="font-serif text-base font-black text-brand-charcoal leading-snug">
                          {language === 'sr' ? 'Potvrda uspešno poslata' : language === 'zh' ? '校准校对提交成功' : 'Verification Received'}
                        </h4>
                        <p className="text-[12px] leading-relaxed text-brand-charcoal/60">
                          {language === 'sr'
                            ? 'Hvala vam. Pomogli ste nam da održimo tačnost IDEMO baze preporuka.'
                            : language === 'zh'
                              ? '感谢您的客观测定。您已协助独立编辑部保持 IDEMO 甄选信息的严密与精确。'
                              : 'Thank you. You have helped us keep IDEMO accurate.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="border-t border-border-main/50 pt-4 shrink-0 flex gap-2">
                  {accuracyQuestionStep === 1 && (
                    <button
                      onClick={() => setAccuracyModalOpen(false)}
                      className="w-full h-11 rounded-xl bg-brand-pearl border border-border-main/60 hover:bg-brand-pearl/80 text-brand-charcoal text-[10px] uppercase tracking-widest font-extrabold active:scale-95 transition-all cursor-pointer"
                    >
                      {language === 'sr' ? 'Odustani' : language === 'zh' ? '取消' : 'Cancel'}
                    </button>
                  )}

                  {accuracyQuestionStep === 2 && (
                    <>
                      <button
                        onClick={() => {
                          triggerHaptic(3);
                          setAccuracyQuestionStep(1);
                        }}
                        className="w-1/3 h-11 rounded-xl bg-brand-pearl border border-border-main/60 hover:bg-brand-pearl/80 text-brand-charcoal text-[10px] uppercase tracking-widest font-extrabold active:scale-95 transition-all cursor-pointer"
                      >
                        {language === 'sr' ? 'Nazad' : language === 'zh' ? '上一步' : 'Back'}
                      </button>
                      <button
                        onClick={handleConfirmAccuracySubmit}
                        disabled={accuracyAnswers.categories.length === 0 && accuracyAnswers.note.trim().length === 0}
                        className={`w-2/3 h-11 rounded-xl text-[10px] uppercase tracking-widest font-extrabold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          (accuracyAnswers.categories.length > 0 || accuracyAnswers.note.trim().length > 0)
                            ? 'bg-[#2E7D32] text-white hover:bg-[#1B5E20]'
                            : 'bg-brand-charcoal/15 text-brand-charcoal/40 cursor-not-allowed'
                        }`}
                      >
                        {language === 'sr' ? 'Pošalji' : language === 'zh' ? '提交校准' : 'Submit'}
                      </button>
                    </>
                  )}

                  {accuracyQuestionStep === 'success' && (
                    <button
                      onClick={() => {
                        triggerHaptic(5);
                        setAccuracyModalOpen(false);
                      }}
                      className="w-full h-11 rounded-xl bg-brand-charcoal text-white hover:bg-brand-charcoal/90 text-[10px] uppercase tracking-widest font-extrabold active:scale-95 transition-all cursor-pointer"
                    >
                      {language === 'sr' ? 'Zatvori' : language === 'zh' ? '返回探索' : 'Return to Journey'}
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      {/* Hidden Admin Executive Campaign Dashboard overlay */}
      <AnimatePresence>
        {import.meta.env.DEV && isAdmin && (
          <React.Suspense fallback={null}>
            <AdminDashboard 
              language={language}
              onClose={() => setIsAdmin(false)}
            customRecommendations={customRecommendations}
            onUpdateCustomRecommendations={(recs) => {
              setCustomRecommendations(recs);
              try {
                safeStorage.setItem('idemo_custom_recommendations_v1', JSON.stringify(recs));
              } catch (e) {
                console.warn('Could not save custom recommendations:', e);
              }
            }}
            modifiedRecommendations={modifiedRecommendations}
            onUpdateModifiedRecommendations={(mods) => {
              setModifiedRecommendations(mods);
              try {
                safeStorage.setItem('idemo_modified_recommendations_v1', JSON.stringify(mods));
              } catch (e) {
                console.warn('Could not save modified recommendations:', e);
              }
            }}
            deletedRecommendationIds={deletedRecommendationIds}
            onUpdateDeletedRecommendationIds={(deleted) => {
              setDeletedRecommendationIds(deleted);
              try {
                safeStorage.setItem('idemo_deleted_recommendations_v1', JSON.stringify(deleted));
              } catch (e) {
                console.warn('Could not save deleted recommendations:', e);
              }
            }}
            allRecommendations={adminAllRecommendations}
            landingImage={landingImage}
            onUpdateLandingImage={handleUpdateLandingImage}
            editorialStatuses={editorialStatuses}
            onUpdateEditorialStatuses={handleUpdateEditorialStatuses}
            renderRecommendationCard={(item: any, onClick: () => void) => {
              const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
              return (
                <div 
                  onClick={onClick}
                  className="relative h-[480px] w-[310px] rounded-[40px] overflow-hidden shadow-2xl border border-border-main bg-brand-charcoal cursor-pointer flex-shrink-0 transition-transform duration-300 hover:scale-[1.02]"
                >
                  {lowSignalMode ? (
                    <div className="w-full h-full bg-[#FAF9F5] border-b border-[#E5E3DB] flex flex-col items-center justify-center p-6 text-center select-none">
                      <span className="text-[24px] mb-2 font-serif opacity-35 text-brand-charcoal/80">✦</span>
                      <span className="text-xs uppercase tracking-[0.2em] font-black text-brand-charcoal leading-snug px-6">{getLocalizedValue(item, 'title', language)}</span>
                      <span className="text-[12px] font-mono tracking-wider text-[#5C5A4D] uppercase mt-4 bg-[#EDEBDF] px-3.5 py-1.5 rounded-full border border-border-main/40 font-bold">Bandwidth Optimized</span>
                    </div>
                  ) : (
                    <LazyImage 
                      src={item.image} 
                      alt={getLocalizedValue(item, 'title', language)} 
                      className="w-full h-full object-cover" 
                      isAdminPreview={true}
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end text-white text-left">
                    <div className="flex justify-between items-start mb-auto w-full">
                      <div className="flex flex-col items-start gap-1.5 animate-fade-in-slow">
                        <span className="text-[12px] uppercase tracking-widest text-[#FFF] bg-[#8A1F1F] px-2.5 py-1 rounded-md font-bold leading-none">{formatCategory(item.category, t)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-end w-full">
                      <div className="min-w-0 flex flex-col justify-end">
                        <h3 className="text-xl font-serif leading-tight line-clamp-2 text-white">{getLocalizedValue(item, 'title', language)}</h3>
                        <div className="mt-2.5 flex items-center gap-2 opacity-85">
                           <div className="h-[1.5px] w-4 bg-white" />
                           <span className="text-[12px] uppercase tracking-widest truncate font-extrabold">{t.explore_narrative}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2.5 shrink-0 z-10">
                        <MiniMoodGrid coordinateX={item.coordinateX} coordinateY={item.coordinateY} className="shadow-md border-white/20" />
                        {item.badge && (
                          <div className="scale-100 origin-bottom-right">
                            <PremiumBadge type={item.badge} compact />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
            renderDetailsScreen={(rec: any, onBack: () => void) => (
              <DetailsScreen 
                recommendation={rec}
                language={language}
                isLiked={likedIds.has(rec.id)}
                onToggleLike={() => toggleLike(rec.id)}
                onBack={onBack}
                onSchedule={(date, preventRedirect) => scheduleItem(rec, date, preventRedirect)}
                onNavigate={(screen: string) => setCurrentScreen(screen)}
                onRemove={() => removeScheduledItem(rec.id)}
                rating={ratings[rec.id]}
                onSaveRating={(vibe: any, tags: string[]) => saveRating(rec.id, vibe, tags)}
                vibeSettings={currentArchetype.targetVibe}
                onSelectRec={handleSelectRec}
                lowSignalMode={lowSignalMode}
                allRecommendations={userFacingRecommendations}
                isAdminPreview={true}
                onConfirmAccuracy={() => {
                  setAccuracySelectedItem(rec);
                  setAccuracyQuestionStep(1);
                  setAccuracyAnswers({ accurate: null, categories: [], note: '' });
                  setShowAccuracyNoteField(false);
                  setAccuracyModalOpen(true);
                  triggerHaptic(5);
                }}
              />
            )}
          />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Network Connectivity Toast Overlays (Proposal 2) */}
      <AnimatePresence>
        {networkToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-20 left-4 right-4 z-[99] flex justify-center pointer-events-none"
          >
            <div className={`px-4 py-2 w-full max-w-[340px] text-[10px] font-mono tracking-wider uppercase font-semibold text-center border rounded-full backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 ${
              networkToast === 'online' 
                ? 'bg-[#1E2E20]/95 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-950/95 border-amber-500/20 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${networkToast === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              <span>
                {networkToast === 'online' 
                  ? (language === 'sr' ? 'Veza uspostavljena • Online' : language === 'zh' ? '网络已连接 • 在线模式' : 'Network link secured • Online') 
                  : (language === 'sr' ? 'Sistem u lokalu • Ofline' : language === 'zh' ? '本地缓存运行 • 离线模式' : 'Operating in local cache • Offline')
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Overlay Flow */}
      <AnimatePresence>
        {showOnboarding && currentScreen !== 'landing' && (
          <OnboardingOverlay 
            language={language}
            onClose={() => {
              setShowOnboarding(false);
              try {
                safeStorage.setItem('idemo_onboarded_v3', 'true');
              } catch (e) {}
            }}
          />
        )}
      </AnimatePresence>

      {/* External Link Safety Departure Interceptor (Proposal 1 / Rule 10) */}
      <AnimatePresence>
        {pendingExternalLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-md z-[150] flex items-center justify-center p-6"
            onClick={() => {
              setPendingExternalLink(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FAF9F5] border-2 border-[#E7E4DB] rounded-[32px] p-7 max-w-[340px] w-full text-center shadow-[0_30px_70px_rgba(0,0,0,0.25)] flex flex-col relative font-sans"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-charcoal text-white flex items-center justify-center mx-auto mb-4 border border-[#E7E4DB] shadow-sm">
                <ExternalLink size={20} className="text-emerald-400" />
              </div>
              
              <h3 className="font-serif text-[18px] font-bold text-brand-charcoal leading-snug mb-2">
                {language === 'sr' ? 'Napuštanje aplikacije' : language === 'zh' ? '您正在离开应用' : 'Leaving IDEMO Guide'}
              </h3>
              
              <p className="text-[12px] text-brand-charcoal/65 leading-relaxed mb-1">
                {language === 'sr' 
                  ? 'Bićete preusmereni na spoljni resurs koji ne pripada našem nezavisnom vodiču:' 
                  : language === 'zh'
                  ? '您即将访问独立导览范围外的外部第三方资源：'
                  : 'You are transferring to an external resource beyond our independent private guide:'}
              </p>
              
              <div className="bg-[#EAE8DF]/40 p-2.5 rounded-xl text-center border border-border-main/20 text-[10px] font-mono tracking-tight text-brand-charcoal/85 break-all mb-4 select-all">
                {pendingExternalLink}
              </div>

              {!isOnline && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/30 rounded-xl mb-4 text-left">
                  <p className="text-[10px] text-amber-800 leading-normal font-medium">
                    ⚠️ {language === 'sr' 
                      ? 'Trenutno ste ofline. Spoljne stranice se možda neće učitati bez aktivne internet veze.' 
                      : language === 'zh'
                      ? '当前您处于离线状态。打开此链接可能需要活跃的网络连接本地缓存除外。'
                      : 'You are currently offline. This external resource may fail to load.'}
                  </p>
                </div>
              )}

              <p className="text-[9.5px] text-brand-charcoal/40 italic leading-snug mb-5">
                "{branding.notAffiliatedDisclaimer}"
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPendingExternalLink(null)}
                  className="flex-1 py-3 text-[11px] uppercase tracking-wider font-extrabold text-brand-charcoal bg-white hover:bg-[#EAE8DF]/40 border border-[#D5D3C8] rounded-xl active:scale-[0.98] transition-all cursor-pointer select-none"
                >
                  {language === 'sr' ? 'Nazad' : language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    if (pendingExternalLink) {
                      window.open(pendingExternalLink, '_blank', 'noopener,noreferrer');
                    }
                    setPendingExternalLink(null);
                  }}
                  className="flex-1 py-3 text-[11px] uppercase tracking-wider font-extrabold text-white bg-[#1E2E20] hover:bg-[#152016] border border-transparent rounded-xl active:scale-[0.98] transition-all cursor-pointer select-none"
                >
                  {language === 'sr' ? 'Potvrdi' : language === 'zh' ? '继续访问' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Elegant printing portfolio with beautiful design elements, Cyrillic watermarks, Roman Constantine Coin and Tesla coils */}
    <div id="print-portfolio-element" className="relative p-[1.6cm] bg-[#FAF9F5] text-[#2F3126] font-sans antialiased text-[11px] leading-relaxed select-text">
      {/* Absolute Svg Artistic Watermarks */}
      <div className="absolute top-[12%] left-[4%] opacity-[0.035] pointer-events-none z-[-10] w-[140px]">
        <svg viewBox="0 0 100 150" fill="none" stroke="#2D3025" strokeWidth="0.5" className="w-full h-auto">
          <polygon points="50,15 25,45 75,45" />
          <line x1="38" y1="33" x2="45" y2="35" />
          <line x1="62" y1="33" x2="55" y2="35" />
          <line x1="50" y1="15" x2="50" y2="45" />
          <polygon points="35,45 65,45 75,100 25,100" />
          <line x1="30" y1="60" x2="20" y2="75" />
          <line x1="70" y1="60" x2="80" y2="75" />
          <line x1="35" y1="65" x2="65" y2="65" />
          <line x1="33" y1="75" x2="67" y2="75" />
          <line x1="30" y1="85" x2="70" y2="85" />
          <path d="M45,110 L50,115 L55,110 M40,120 L50,127 L60,120 M35,130 L50,140 L65,130" strokeWidth="0.4"/>
        </svg>
      </div>
      
      <div className="absolute top-[42%] right-[4%] opacity-[0.035] pointer-events-none z-[-10] w-[170px]">
        <svg viewBox="0 0 200 200" fill="none" stroke="#2D3025" strokeWidth="0.4" className="w-full h-auto">
          <circle cx="100" cy="100" r="15" strokeDasharray="2,2" />
          <circle cx="100" cy="100" r="30" />
          <circle cx="100" cy="100" r="45" strokeDasharray="4,2" />
          <circle cx="100" cy="100" r="60" />
          <circle cx="100" cy="100" r="75" strokeDasharray="6,3" />
          <circle cx="100" cy="100" r="90" />
          <path d="M100,25 L100,175" />
          <path d="M25,100 L175,100" />
          <path d="M47,47 L153,153" strokeDasharray="3,3" />
          <path d="M47,153 L153,47" strokeDasharray="3,3" />
          <circle cx="100" cy="100" r="5" fill="#2D3025" />
          <rect x="94" y="25" width="12" height="150" rx="4" strokeDasharray="1,1" />
          <path d="M10,100 Q 32.5,130 55,100 T 100,100 T 145,100 T 190,100" />
          <path d="M10,100 Q 32.5,70 55,100 T 100,100 T 145,100 T 190,100" strokeDasharray="2,2" />
        </svg>
      </div>

      <div className="absolute bottom-[10%] left-[8%] opacity-[0.035] pointer-events-none z-[-10] w-[150px]">
        <svg viewBox="0 0 120 120" fill="none" stroke="#2D3025" strokeWidth="0.5" className="w-full h-auto">
          <circle cx="60" cy="60" r="52" strokeDasharray="3,1" />
          <circle cx="60" cy="60" r="48" />
          <path d="M 45,85 C 45,75 50,70 50,65 C 50,60 42,58 40,50 C 38,42 45,35 55,33 C 65,31 75,37 77,48 C 78,54 75,56 73,59 C 71,62 76,65 74,72 C 72,78 68,82 65,85 Z" />
          <path d="M 40,50 L 37,53 L 41,55 L 39,58 L 43,60 M 42,65 C 44,70 48,72 50,72" />
          <path d="M 52,32 Q 55,27 60,30 Q 56,33 53,35" />
          <path d="M 58,30 Q 62,25 66,29 Q 62,32 59,34" />
          <path d="M 64,29 Q 69,26 71,31 Q 67,33 65,35" />
          <path d="M 69,32 Q 74,31 74,36 Q 70,37 69,37" />
          <path d="M 76,48 Q 83,46 81,54 Q 75,52 76,48 Z" />
          <path d="M 77,53 Q 86,55 83,62 Q 78,58 77,53 Z" />
          <path id="roman_txt_print" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" stroke="none" />
          <text fontSize="5.5" fontFamily="serif" letterSpacing="1">
            <textPath href="#roman_txt_print" startOffset="5%">IMP CONSTANTINVS P F AVG</textPath>
          </text>
        </svg>
      </div>

      {/* Cyrillic Column Margin Label */}
      <div 
        className="absolute top-[2cm] right-[0.5cm] h-[85%] text-[10px] uppercase font-bold text-[#2D3025] opacity-[0.05] pointer-events-none z-[-5]"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          letterSpacing: '0.9em',
          fontFamily: '"Playfair Display", serif'
        }}
      >
        {language === 'sr' 
          ? 'СРБИЈА • БЕОГРАД • ЕКСПО БЕОГРАД • ВИНЧА • ТЕСЛА' 
          : 'SERBIA • BELGRADE • EXPO BELGRADE 2027 • VINCA • TESLA'}
      </div>

      {/* Crisp Header Box */}
      <div className="bg-white border border-[#E0DDD5] border-b-[3px] border-b-[#1E2E20] p-6 mb-6 rounded-lg relative">
        <div className="text-[8px] uppercase tracking-[0.4em] text-[#8F8B73] font-bold mb-1.5">
          {language === 'sr' ? 'ЕКСПО БЕОГРАД • ОФИЦИЈЕЛНИ ДЕЛЕГАТСКИ ПЛАН' : 'EXPO BELGRADE • OFFICIAL DELEGATE PORTFOLIO'}
        </div>
        <h1 className="font-serif text-[26px] font-bold text-[#1E2E20] tracking-tight leading-none mb-2">
          {language === 'sr' ? 'ИТИНЕРАР ЛИЧНИ СЛУЖБЕНИ ПУТ' : 'ELEGANT VISITOR ITINERARY'}
        </h1>
        <p className="text-[10px] italic text-[#5C5E54] max-w-[80%] leading-relaxed">
          {language === 'sr' 
            ? 'Dizajniran i kalibrisan izveštaj za posetioce – nezvaničan, premium i lokalno vođen.'
            : 'A premium, custom-calibrated travel portfolio for visiting delegates and cultural explorers.'}
        </p>
      </div>

      {/* Metadata Details Row */}
      <div className="grid grid-cols-12 gap-5 mb-6">
        {/* Profile Card */}
        <div className="col-span-5 bg-white border-2 border-[#D5D3C8] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <h2 className="font-serif text-[11.5px] font-extrabold text-[#5C5A4D] uppercase tracking-[0.18em] border-b-2 border-[#FAF9F5] pb-1.5 mb-2.5">
              {language === 'sr' ? 'УСКЛАЂЕН ПРОФИЛ ПОСЕТИОЦА' : 'CALIBRATED VISITOR PROFILE'}
            </h2>
            <h3 className="font-serif text-[16px] font-black text-[#1B5E20] leading-snug mb-3">
              {getDynamicStyle(language, selectedCats, days, budget, time).styleName}
            </h3>
            <div className="space-y-2">
              {getDynamicStyle(language, selectedCats, days, budget, time).whyBullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11.5px] text-brand-charcoal font-semibold leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-accent-teal flex-shrink-0 mt-1.5" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="col-span-4 bg-white border border-[#E5E3DB] rounded-xl p-4 flex flex-col">
          <h2 className="font-serif text-[11px] font-bold text-[#1E2E20] uppercase tracking-[0.15em] border-b border-[#E0DDD5] pb-1.5 mb-2">
            {language === 'sr' ? 'КАЛЕНДАР ПОСЕТЕ' : 'TRAVEL HORIZON CALENDAR'}
          </h2>
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {sortedMonths.slice(0, 1).map((m) => (
              <CalendarMonthView 
                key={`${m.year}-${m.month}`}
                year={m.year}
                month={m.month}
                highlightedDays={m.days}
                language={language}
              />
            ))}
            {sortedMonths.length > 1 && (
              <p className="text-[7.5px] text-[#8C8A7D] text-center italic mt-1">
                {language === 'sr' ? '*Додатни месеци планирани у наставку' : '*Additional months scheduled below'}
              </p>
            )}
          </div>
        </div>

        {/* Essential Protocol Card */}
        <div className="col-span-3 bg-white border border-[#E5E3DB] rounded-xl p-4">
          <h2 className="font-serif text-[11px] font-bold text-[#1E2E20] uppercase tracking-[0.15em] border-b border-[#E0DDD5] pb-1.5 mb-2.5">
            {language === 'sr' ? 'КЉУЧНЕ ИНФОРМАЦИЈЕ' : 'ESSENTIAL PROTOCOL'}
          </h2>
          <table className="w-full text-[9px]">
            <tbody>
              <tr className="border-b border-[#F3F1ED]">
                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider w-[40%]">
                  {language === 'sr' ? 'Валута' : 'Currency'}
                </td>
                <td className="py-1 text-[#2F3126]">RSD (Srpski dinar)</td>
              </tr>
              <tr className="border-b border-[#F3F1ED]">
                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                  {language === 'sr' ? 'Вр. зона' : 'Timezone'}
                </td>
                <td className="py-1 text-[#2F3126]">CET/CEST</td>
              </tr>
              <tr className="border-b border-[#F3F1ED]">
                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                  {language === 'sr' ? 'Хитне службе' : 'Emergency'}
                </td>
                <td className="py-1 text-[#2F3126]">
                  {language === 'sr' 
                    ? '192 (Полиција) / 193 (Ватрогасци) / 194 (Хитна)' 
                    : '192 (Police) / 193 (Fire) / 194 (Ambulance)'}
                </td>
              </tr>
              <tr className="border-b border-[#F3F1ED]">
                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                  {language === 'sr' ? 'Слово' : 'Alphabet'}
                </td>
                <td className="py-1 text-[#2F3126]">{language === 'sr' ? 'Ћирилица' : 'Cyrillic & Latin'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled list cards sorted chronologically */}
      <div className="mb-6">
        <h2 className="font-serif text-[12px] font-bold text-[#1E2E20] uppercase tracking-[0.15em] border-b border-[#E0DDD5] pb-1.5 mb-4">
          {language === 'sr' ? 'ХРОНОЛОШКИ ПЛАН И САТНИЦА' : 'CHRONOLOGICAL TRIP SCHEDULE'}
        </h2>
        
        <div className="space-y-3">
          {[...scheduledItems]
            .sort((a: any, b: any) => {
              if (!a.scheduledDate) return 1;
              if (!b.scheduledDate) return -1;
              return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            })
            .map((item: any, idx: number) => {
              const dateFormatted = item.scheduledDate 
                ? new Date(item.scheduledDate.split('T')[0].replace(/-/g, '/')).toLocaleDateString(language === 'sr' ? 'sr-RS' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : (language === 'sr' ? 'Период посете' : 'Flexible Schedule');
              
              return (
                <div key={item.id} className="bg-white border border-[#E5E3DB] rounded-xl overflow-hidden itinerary-card">
                  <div className="bg-[#F8F7F4] border-b border-[#E5E3DB] px-4 py-2 flex justify-between items-center">
                    <span className="font-mono font-bold text-[#2E7D32] text-[10px]">#{idx + 1}</span>
                    <span className="font-bold text-[10px] text-[#1E2E20] uppercase tracking-wide">{dateFormatted}</span>
                  </div>
                  <div className="p-4 flex gap-5 animate-none">
                    <div className="flex-[1.2]">
                      <h4 className="font-serif text-[15px] font-bold text-[#1E2E20] mb-0.5">{getLocalizedValue(item, 'title', language)}</h4>
                      <p className="text-[8px] uppercase tracking-widest text-[#2E7D32] font-black mb-2">{formatCategory(item.category, t)}</p>
                      <p className="text-[9.5px] text-[#8C8A7D] mb-2.5">📍 {getLocalizedValue(item, 'location', language)}</p>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {item.duration && (
                          <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-2 py-0.5 text-[8.5px] font-medium text-[#5C5E54]">
                            🕒 {language === 'sr' ? 'Трајање' : 'Duration'}: {item.duration}
                          </span>
                        )}
                        {item.travelTime && (
                          <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-2 py-0.5 text-[8.5px] font-medium text-[#5C5E54]">
                            ⚡ {language === 'sr' ? 'Транзит' : 'Transit'}: {item.travelTime}
                          </span>
                        )}
                        {item.preferredTransport && (
                          <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-2 py-0.5 text-[8.5px] font-medium text-[#5C5E54]">
                            🚗 {language === 'sr' ? 'Транспорт' : 'Transport'}: {item.preferredTransport}
                          </span>
                        )}
                        {item.estimatedCost && (
                          <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-2 py-0.5 text-[8.5px] font-medium text-[#5C5E54]">
                            💶 {language === 'sr' ? 'Буџет' : 'Cost'}: {item.estimatedCost}
                          </span>
                        )}
                      </div>

                      {(item.website || item.phone) && (
                        <div className="mt-3 text-[8.5px] text-[#5C5E54] space-y-0.5 border-t border-[#E5E3DB]/80 pt-2">
                          {item.website && (
                            <p className="truncate">
                              🌐 <span className="font-bold">{language === 'sr' ? 'Вебсајт' : 'Website'}:</span> {item.website}
                            </p>
                          )}
                          {item.phone && (
                            <p className="truncate">
                              📞 <span className="font-bold">{language === 'sr' ? 'Телефон' : 'Phone'}:</span> {item.phone}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-[1.8] border-l border-dashed border-[#E0DDD5] pl-4">
                      <p className="text-[#5C5E54] text-[10px] leading-[1.45] m-0">
                        {getLocalizedValue(item, 'shortDescription', language) || getLocalizedValue(item, 'longDescription', language)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer info and Disclaimer */}
      <div className="border-t border-dashed border-[#E0DDD5] pt-4 mt-8 flex justify-between items-center text-[8.5px] text-[#8C8A7D] uppercase tracking-wider">
        <span>IDEMO • CONCIERGE BRIEF</span>
        <span>EXPO 2027 • REPUBLIC OF SERBIA</span>
      </div>

      <p className="text-[8px] text-[#A3A195] text-center max-w-[90%] mx-auto mt-5 leading-normal">
        {language === 'sr'
          ? 'Независни водич и лични уређај за планирање. Није повезан са званичним организаторима ЕКСПО 2027 у Београду.'
          : 'Independent guide and personal planner portfolio. Not affiliated with the official organizers of EXPO 2027 in Belgrade.'}
      </p>
    </div>
  </>
);
}

// --- SUB-COMPONENTS ---

function LandingScreen({ onStart, language, setLanguage, landingImage }: any) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  const subData = {
    en: {
      line2: "Configure - Discover - Private - Travel Pass",
      line3: "GUIDANCE NEEDED?",
      line4: "Ask IDEMO directly from within the app."
    },
    sr: {
      line2: "Podesite - Istražite - Privatno - Propusnica",
      line3: "TREBATE LI SMERNICE?",
      line4: "Pitajte IDEMO direktno unutar aplikacije."
    },
    es: {
      line2: "Configurar - Descubrir - Privado - Pase de viaje",
      line3: "¿NECESITA ORIENTACIÓN?",
      line4: "Pregunte a IDEMO directamente desde la aplicación."
    },
    de: {
      line2: "Konfigurieren - Entdecken - Privat - Reisepass",
      line3: "HILFE BENÖTIGT?",
      line4: "Fragen Sie IDEMO direkt in der App."
    },
    ru: {
      line2: "Настроить - Открыть - Приватно - Пропуск",
      line3: "ТРЕБУЕТСЯ ПОМОЩЬ?",
      line4: "Спросите IDEMO прямо в приложении."
    },
    zh: {
      line2: "配置 - 探索 - 私密 - 旅行卡",
      line3: "需要指导吗？",
      line4: "在应用内直接咨询 IDEMO。"
    }
  }[language as string] || {
    line2: "Configure - Discover - Private - Travel Pass",
    line3: "GUIDANCE NEEDED?",
    line4: "Ask IDEMO directly from within the app."
  };

  const handleStart = (e: MouseEvent) => {
    e.stopPropagation();
    onStart();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex-1 flex flex-col justify-center items-center py-4 px-5 relative h-full overflow-y-auto overflow-x-hidden no-scrollbar premium-paper select-none gap-y-4"
    >
      {/* Group top section (Brand / Texts) with confident, elegant rhythm */}
      <div className="flex-shrink-0 flex flex-col justify-center items-center gap-y-1.5 max-w-[340px] mx-auto w-full">
        {/* 1. Serbia’s Hidden Corners - Main Title */}
        <div className="text-center w-full">
          <h1 className="text-[29px] xs:text-[32px] sm:text-[35px] font-serif text-brand-charcoal font-medium tracking-tight leading-snug">
            {t.serbia_headline}
          </h1>
        </div>

        {/* 2. Tagline Refinement */}
        <div className="text-center w-full flex flex-col justify-center items-center gap-y-0.5 mt-1">
          <p className="font-sans text-[14.3px] xs:text-[15.6px] sm:text-[16.9px] text-[#800020] font-bold uppercase tracking-[0.12em] xs:tracking-[0.14em] sm:tracking-[0.16em] opacity-95 whitespace-nowrap">
            {t.serbia_subheadline_line1_l1}
          </p>
          <p className="font-sans text-[14.3px] xs:text-[15.6px] sm:text-[16.9px] text-[#800020] font-bold uppercase tracking-[0.12em] xs:tracking-[0.14em] sm:tracking-[0.16em] opacity-95 whitespace-nowrap">
            {t.serbia_subheadline_line1_l2}
          </p>
        </div>
      </div>

      {/* Group middle section (Tactile IDEMO Logo & Compact Language Selector) - Perfect spacing, zero empty bloat */}
      <div className="flex-shrink-0 flex flex-col justify-center items-center gap-y-3.5 my-1 w-full">
        {/* 5. IDEMO Logo - Precision Physical Plaque Button */}
        <div className="relative flex justify-center items-center w-[210px] h-[52px]" style={{ perspective: "1000px" }}>
          {/* 3D solid thickness plate base */}
          <div className="absolute inset-0 bg-[#C4C2B8] rounded-[14px] translate-y-[5px] border border-brand-charcoal/[0.04] shadow-[0_4px_8px_rgba(35,37,30,0.12),0_1px_2px_rgba(35,37,30,0.08)] pointer-events-none" />
          
          <motion.div 
            onClick={handleStart}
            className="relative w-full h-full cursor-pointer select-none bg-[#FAF9F5] rounded-[14px] flex items-center justify-center border border-brand-charcoal/[0.12] overflow-hidden px-4"
            initial={{ 
              y: 0,
              boxShadow: "0 1px 2px rgba(35,37,30,0.02), inset 0px 1.5px 1px rgba(255,255,255,0.95)"
            }}
            whileHover={{ 
              y: 1.5,
              boxShadow: "0 0.5px 1px rgba(35,37,30,0.01), inset 0px 1.5px 1px rgba(255,255,255,0.95)"
            }}
            whileTap={{ 
              y: 5,
              boxShadow: "inset 0px 2px 4px rgba(35,37,30,0.12)"
            }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            onMouseDown={() => triggerHaptic(8)}
            onTouchStart={() => triggerHaptic(8)}
            id="tactile-hero-logo"
          >
            {/* Premium Glass reflection glaze */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none rounded-[14px]" />
            
            <IdemoLogo 
              width="100%" 
              height="100%" 
              showBg={false}
              className="text-brand-charcoal select-none pointer-events-none" 
            />
          </motion.div>
        </div>

        {/* 6. Precision Machined Language Selector (Gently recessed control directly below IDEMO Logo) */}
        <div className="w-full max-w-[280px] px-2 z-50">
          <div className="flex justify-between p-[4px] bg-[#FAF9F5]/40 rounded-full border border-brand-charcoal/[0.08] shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <motion.button
                  key={lang.code}
                  onClick={() => {
                    triggerHaptic(10);
                    setLanguage(lang.code);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-1 py-2 rounded-full text-[10.5px] xs:text-[11.5px] font-bold uppercase tracking-widest transition-all duration-200 select-none cursor-pointer text-center relative ${
                    isSelected
                      ? 'bg-[#EAE8E0]/50 text-brand-charcoal shadow-[inset_0_1.5px_3.5px_rgba(35,37,30,0.13)] border border-brand-charcoal/[0.02] font-black'
                      : 'text-brand-charcoal/45 hover:text-brand-charcoal/75 bg-transparent border border-transparent'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                  id={`premium-lang-${lang.code}`}
                >
                  {/* Invisible padding expansion for touch target */}
                  <span className="absolute -inset-1.5 rounded-full bg-transparent" />
                  <span className="relative z-10">{lang.code}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Group bottom section (Disclaimer Card) */}
      <div className="flex-shrink-0 w-full max-w-[340px] mx-auto pt-0 mb-2">
        {/* 7. Disclaimer Card */}
        <div className="text-center space-y-1 bg-white/30 border border-border-main/8 rounded-[12px] py-2.5 px-4 shadow-[0_1.5px_8px_rgba(35,37,30,0.01)] backdrop-blur-xs flex flex-col items-center justify-center" id="refined-disclaimer-card">
          <p className="text-[10.5px] xs:text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-charcoal/50 leading-normal">
            {t.disclaimer_1}
          </p>
          <div className="h-[1px] bg-border-main/10 my-1 w-1/5 mx-auto" />
          <p className="text-[10px] xs:text-[11px] uppercase tracking-[0.11em] text-brand-charcoal/50 leading-relaxed font-semibold">
            {t.disclaimer_2}
          </p>
          <div className="h-[1px] bg-border-main/10 my-1 w-1/5 mx-auto" />
          <button
            onClick={() => {
              triggerHaptic(10);
              setShowPrivacy(true);
            }}
            className="text-[10px] xs:text-[11px] uppercase tracking-[0.12em] text-accent-teal hover:text-accent-teal/85 transition-colors font-bold cursor-pointer underline decoration-dotted underline-offset-2"
          >
            {language === 'sr' ? 'Politika Privatnosti' : language === 'es' ? 'Política de Privacidad' : language === 'de' ? 'Datenschutzerklärung' : language === 'ru' ? 'Политика конфиденциальности' : language === 'zh' ? '隐私政策' : 'Privacy Policy'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPrivacy && (
          <>
            {/* Backdrop */}
            <motion.div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[600]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacy(false)}
            />
            {/* Content Drawer/Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] max-w-[400px] mx-auto bg-brand-bg rounded-[24px] border border-border-main p-6 z-[610] shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border-main/20 shrink-0">
                <h3 className="font-serif text-[12px] font-black text-brand-charcoal uppercase tracking-wider">
                  {language === 'sr' ? 'Politika Privatnosti (GDPR)' : language === 'es' ? 'Política de Privacidad (GDPR)' : language === 'de' ? 'Datenschutzerklärung (DSGVO)' : language === 'ru' ? 'Политика конфиденциальности (GDPR)' : language === 'zh' ? '隐私政策 (GDPR)' : 'Privacy Policy (GDPR Compliant)'}
                </h3>
                <button
                  onClick={() => setShowPrivacy(false)}
                  className="w-8 h-8 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal text-xs font-bold hover:bg-brand-charcoal/10 transition-colors cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 no-scrollbar space-y-4 text-left">
                <PrivacyPolicyContent language={language} />
              </div>
              <button
                onClick={() => setShowPrivacy(false)}
                className="w-full h-11 shrink-0 rounded-xl bg-brand-charcoal text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all cursor-pointer mt-2"
              >
                {language === 'sr' ? 'Zatvori' : language === 'es' ? 'Cerrar' : language === 'de' ? 'Schließen' : language === 'ru' ? 'Закрыть' : language === 'zh' ? '关闭' : 'Close'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PulsatingProfileButton({ onClick, language, size = 48, iconSize = 20 }: any) {
  const [isPressed, setIsPressed] = useState(false);
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    let frameId: number;
    const tick = () => {
      setTime(new Date());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const secondsVal = time.getSeconds() + time.getMilliseconds() / 1000;
  const minutesVal = time.getMinutes() + secondsVal / 60;
  const hoursVal = (time.getHours() % 12) + minutesVal / 60;

  const hourAngle = hoursVal * 30;
  const minuteAngle = minutesVal * 6;
  const secondAngle = secondsVal * 6;
  
  const text = "IT ALL STARTS HERE : IDEMO • IT ALL STARTS HERE : IDEMO • ";
  
  // Custom micro-jitter haptic values for premium tactile physical feel on press
  const jitterX = isPressed ? [0, -1.2, 1.2, -0.8, 0.8, -0.4, 0.4, 0] : 0;
  const jitterY = isPressed ? [0, 0.9, -0.9, 0.6, -0.6, 0.4, -0.4, 0] : 0;

  return (
    <button 
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={onClick} 
      className="relative flex items-center justify-center cursor-pointer select-none outline-none group active:outline-none"
      style={{ width: size, height: size }}
    >
      {/* Pulsating Ambient Outer Teal Glow */}
      <motion.div 
        animate={{ 
          scale: isPressed ? 0.95 : [1, 1.15, 1],
          opacity: isPressed ? 0.1 : [0.2, 0.4, 0.2] 
        }}
        transition={{ 
          duration: 3, 
          repeat: isPressed ? 0 : Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 rounded-full bg-accent-teal/15 blur-md pointer-events-none"
      />
      
      {/* Circular Rotating Text: "IT ALL STARTS HERE : IDEMO" */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 16, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute pointer-events-none"
        style={{ 
          inset: "-13px",
          transformOrigin: "center"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            {/* Circular text path centered at (50, 50) with radius 36.5 */}
            <path id="buttonCirclePath" d="M 50, 50 m -36.5, 0 a 36.5,36.5 0 1,1 73,0 a 36.5,36.5 0 1,1 -73,0" />
          </defs>
          <text className="text-[12px] uppercase font-mono font-black tracking-[0.16em] fill-brand-charcoal/45 group-hover:fill-accent-teal transition-colors duration-300">
            <textPath xlinkHref="#buttonCirclePath" startOffset="0%">
              {text}
            </textPath>
          </text>
        </svg>
      </motion.div>

      {/* The 3D Tactile Mood ORB */}
      <motion.div
        animate={{
          scale: isPressed ? 0.92 : 1,
          x: jitterX,
          y: isPressed ? [3, 2.2, 3.8, 2.4, 3.6, 2.7, 3.3, 3] : 0, // Sinks 3px down + high-frequency vibration
          boxShadow: isPressed 
            ? "0 2px 4px rgba(15, 23, 42, 0.15), inset 0 2px 4px rgba(0,0,0,0.15)"
            : "0 8px 16px rgba(15, 23, 42, 0.12), 0 3px 5px rgba(15, 23, 42, 0.08), inset 0 1.5px 0.5px rgba(255,255,255,0.65)"
        }}
        transition={isPressed ? {
          x: { repeat: Infinity, duration: 0.15, ease: "linear" },
          y: { repeat: Infinity, duration: 0.15, ease: "linear" },
          scale: { type: "spring", stiffness: 450, damping: 20 },
          boxShadow: { duration: 0.08 }
        } : {
          type: "spring",
          stiffness: 400,
          damping: 25
        }}
        className="w-full h-full rounded-full border border-[#D9D8D0] bg-brand-charcoal flex items-center justify-center relative overflow-hidden"
      >
        <svg viewBox="-100 -100 200 200" className="w-full h-full select-none pointer-events-none overflow-hidden rounded-full">
          <defs>
            {/* Metallic Titanium Outer Ring Bezel */}
            <linearGradient id="orbButtonBezel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="20%" stopColor="#F4F4F5" />
              <stop offset="40%" stopColor="#D4D4D8" />
              <stop offset="50%" stopColor="#A1A1AA" />
              <stop offset="60%" stopColor="#E4E4E7" />
              <stop offset="80%" stopColor="#71717A" />
              <stop offset="90%" stopColor="#3F3F46" />
              <stop offset="100%" stopColor="#18181B" />
            </linearGradient>

            {/* Slate Navy Time Segment (Bottom-Left) */}
            <linearGradient id="orbButtonTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Rose Gold Budget Segment (Top-Right) */}
            <linearGradient id="orbButtonBudget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>

            {/* Glass Convex Reflection Layer Highlight */}
            <radialGradient id="orbButtonReflection" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            {/* Sapphire glass AR Coating Sheen */}
            <linearGradient id="orbButtonSapphire" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="30%" stopColor="#818CF8" stopOpacity="0.04" />
              <stop offset="70%" stopColor="#C084FC" stopOpacity="0" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
            </linearGradient>

            {/* Chromalight Glow Filter for Luxury Watch Luminescence */}
            <filter id="orbButtonChroma" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Luminous paint gradient mimicking Rolex Chromalight */}
            <linearGradient id="orbButtonLume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="60%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Embedded luxury watch motion style for sweeping seconds */}
            <style>{`
              @keyframes watchSecondHandSweep {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .watch-second-hand-sweep {
                transform-origin: 0px 0px;
                animation: watchSecondHandSweep 60s linear infinite;
              }
            `}</style>
          </defs>

          {/* Time Segment base layer */}
          <circle r="98" fill="url(#orbButtonTime)" stroke="#334155" strokeWidth="1" />

          {/* Upper Budget segment overlaid & divided dynamically by organic wavy liquid line */}
          <path 
            d="M -90,0 C -45,12 45,-12 90,0 A 90,90 0 0,0 -90,0 Z" 
            fill="url(#orbButtonBudget)" 
            transform="rotate(-22)"
          />

          {/* Polished Metallic Beveled Divider on Dial Seam to split segments elegantly */}
          <path 
            d="M -90,0 C -45,12 45,-12 90,0" 
            fill="none" 
            stroke="#E2E8F0" 
            strokeWidth="0.8" 
            className="opacity-90 pointer-events-none"
            transform="rotate(-22)"
          />

          {/* Rolex Explorer Fine 60-Minute Dial Track & Hourly Grade */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = i * 6;
            const isHourMarker = i % 5 === 0;
            
            // Skip drawing standard ticks on positions with big Arabic numerals or the triangle index
            if (isHourMarker) {
              const hour = i / 5;
              if (hour === 0 || hour === 3 || hour === 6 || hour === 9) {
                return null;
              }
            }
            
            const r1 = isHourMarker ? 80 : 83;
            const r2 = 85;
            const rad = (angle * Math.PI) / 180;
            const x1 = r1 * Math.cos(rad);
            const y1 = r1 * Math.sin(rad);
            const x2 = r2 * Math.cos(rad);
            const y2 = r2 * Math.sin(rad);
            
            return (
              <line 
                key={i} 
                x1={x1} 
                y1={y1} 
                x2={x2} 
                y2={y2} 
                stroke="#FFFFFF" 
                className={isHourMarker ? 'opacity-40' : 'opacity-15'}
                strokeWidth={isHourMarker ? 0.75 : 0.4} 
              />
            );
          })}

          {/* Rolex Explorer 12 O'Clock Inverted Triangle (Chromalight) */}
          <polygon 
            points="-5.5,-83 5.5,-83 0,-71" 
            fill="url(#orbButtonLume)" 
            stroke="#E4E4E7" 
            strokeWidth="0.5" 
            filter="url(#orbButtonChroma)" 
            className="pointer-events-none"
          />

          {/* Rolex Explorer High-Contrast 3, 6, 9 Numerals (Chromalight) */}
          <text
            x="73"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fill="url(#orbButtonLume)"
            stroke="#E4E4E7"
            strokeWidth="0.5"
            filter="url(#orbButtonChroma)"
            className="font-sans font-black select-none pointer-events-none"
            style={{ fontSize: '11px', letterSpacing: '-0.05em' }}
          >
            3
          </text>

          <text
            x="0"
            y="73"
            textAnchor="middle"
            dominantBaseline="central"
            fill="url(#orbButtonLume)"
            stroke="#E4E4E7"
            strokeWidth="0.5"
            filter="url(#orbButtonChroma)"
            className="font-sans font-black select-none pointer-events-none"
            style={{ fontSize: '11px', letterSpacing: '-0.05em' }}
          >
            6
          </text>

          <text
            x="-73"
            y="0"
            textAnchor="middle"
            dominantBaseline="central"
            fill="url(#orbButtonLume)"
            stroke="#E4E4E7"
            strokeWidth="0.5"
            filter="url(#orbButtonChroma)"
            className="font-sans font-black select-none pointer-events-none"
            style={{ fontSize: '11px', letterSpacing: '-0.05em' }}
          >
            9
          </text>

          {/* Rolex Explorer Baton Hour Indices (Chromalight) */}
          {[1, 2, 4, 5, 7, 8, 10, 11].map(h => {
            const angle = h * 30;
            return (
              <g key={h} transform={`rotate(${angle})`}>
                <rect 
                  x="-1.8" 
                  y="-83" 
                  width="3.6" 
                  height="9" 
                  rx="0.5"
                  fill="url(#orbButtonLume)" 
                  stroke="#E4E4E7" 
                  strokeWidth="0.5" 
                  filter="url(#orbButtonChroma)" 
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Thick Bezel Ring Frame */}
          <circle r="93" fill="none" stroke="url(#orbButtonBezel)" strokeWidth="10" className="opacity-95 pointer-events-none" />
          
          {/* Watch Bezel Hand-Polished Chamfer Ring */}
          <circle r="97.5" fill="none" stroke="#FFFFFF" strokeWidth="0.75" className="opacity-60 pointer-events-none" />

          {/* Inner dark bezel shadow step/rim separating bezel and dial face */}
          <circle r="88" fill="none" stroke="#090d16" strokeWidth="1.25" className="opacity-35 pointer-events-none" />

          {/* Mechanical Watch Crown Rotatable Indicator Pointer */}
          <g transform="rotate(110) translate(92, 0)">
            {/* Precision casing */}
            <rect x="-6.5" y="-13" width="13" height="26" rx="2.5" fill="url(#orbButtonBezel)" stroke="#1F2937" strokeWidth="0.75" />
            {/* Elegant circular inset with emerald/teal gemstone centerpiece */}
            <circle r="2.5" fill="#14B8A6" stroke="#0D9488" strokeWidth="0.5" cx="0" cy="0" />
            {/* Micro-machined physical grip ridges */}
            <line x1="-4.5" y1="-9" x2="4.5" y2="-9" stroke="#374151" strokeWidth="0.75" />
            <line x1="-4.5" y1="-6" x2="4.5" y2="-6" stroke="#374151" strokeWidth="0.75" />
            <line x1="-4.5" y1="-3" x2="4.5" y2="-3" stroke="#374151" strokeWidth="0.75" />
            <line x1="-4.5" y1="3" x2="4.5" y2="3" stroke="#374151" strokeWidth="0.75" />
            <line x1="-4.5" y1="6" x2="4.5" y2="6" stroke="#374151" strokeWidth="0.75" />
            <line x1="-4.5" y1="9" x2="4.5" y2="9" stroke="#374151" strokeWidth="0.75" />
          </g>

          {/* Rolex Explorer Mercedes Hour Hand */}
          <g transform={`rotate(${hourAngle})`} className="pointer-events-none">
            <path 
              d="M 0,0 L -1.5,-6 L -1.5,-23 A 4.5,4.5 0 0,1 -4,-26.5 A 4.5,4.5 0 0,1 -1.5,-30.5 L -1.5,-38 L 0,-41 L 1.5,-38 L 1.5,-30.5 A 4.5,4.5 0 0,1 4,-26.5 A 4.5,4.5 0 0,1 1.5,-23 L 1.5,-6 Z" 
              fill="#3F3F46" 
              className="opacity-40" 
              transform="translate(0, 0.5)"
            />
            <path 
              d="M 0,0 L -1.2,-6 L -1.2,-23 A 4.2,4.2 0 0,1 -3.5,-26.5 A 4.2,4.2 0 0,1 -1.2,-30 L -1.2,-37 L 0,-40 L 1.2,-37 L 1.2,-30 A 4.2,4.2 0 0,1 3.5,-26.5 A 4.2,4.2 0 0,1 1.2,-23 L 1.2,-6 Z" 
              fill="url(#orbButtonLume)" 
              stroke="#E4E4E7" 
              strokeWidth="0.75" 
              filter="url(#orbButtonChroma)"
            />
            <circle cx="0" cy="-26.5" r="3.2" fill="none" stroke="#52525B" strokeWidth="0.5" />
            <line x1="0" y1="-26.5" x2="0" y2="-29.7" stroke="#52525B" strokeWidth="0.55" />
            <line x1="0" y1="-26.5" x2="-2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
            <line x1="0" y1="-26.5" x2="2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
          </g>

          {/* Rolex Explorer Tapered Minute Hand */}
          <g transform={`rotate(${minuteAngle})`} className="pointer-events-none">
            <path 
              d="M 0,0 L -1.5,-8 L -1.5,-55 L 0,-59 L 1.5,-55 L 1.5,-8 Z" 
              fill="#3F3F46" 
              className="opacity-40" 
              transform="translate(0, 0.5)"
            />
            <path 
              d="M 0,0 L -1.1,-8 L -1.1,-54 L 0,-58 L 1.1,-54 L 1.1,-8 Z" 
              fill="url(#orbButtonLume)" 
              stroke="#E4E4E7" 
              strokeWidth="0.75" 
              filter="url(#orbButtonChroma)"
            />
            <line x1="0" y1="-8" x2="0" y2="-53" stroke="#52525B" strokeWidth="0.5" className="opacity-40" />
          </g>

          {/* Rolex Explorer Lollipop Second Hand (Mesmerizing Continuous Sweep) */}
          <g transform={`rotate(${secondAngle})`} className="pointer-events-none">
            <line x1="0" y1="15" x2="0" y2="-66" stroke="#E2E8F0" strokeWidth="0.5" />
            <circle cx="0" cy="-48" r="3.2" fill="url(#orbButtonLume)" stroke="#E4E4E7" strokeWidth="0.5" filter="url(#orbButtonChroma)" />
            <circle cx="0" cy="12" r="1.5" fill="#E2E8F0" />
          </g>

          {/* Watch crown Position Anchor Core Center Button (Chronograph Style) */}
          <g className="pointer-events-none">
            <circle r="15" fill="url(#orbButtonBezel)" stroke="#4B5563" strokeWidth="0.5" />
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = i * 30;
              const rad = (angle * Math.PI) / 180;
              const x1 = 12 * Math.cos(rad);
              const y1 = 12 * Math.sin(rad);
              const x2 = 14.5 * Math.cos(rad);
              const y2 = 14.5 * Math.sin(rad);
              return (
                <line 
                  key={i} 
                  x1={x1} 
                  y1={y1} 
                  x2={x2} 
                  y2={y2} 
                  stroke="#374151" 
                  strokeWidth="0.75" 
                  className="opacity-70 pointer-events-none" 
                />
              );
            })}
            <circle r="11" fill="#111827" stroke="#9CA3AF" strokeWidth="0.5" className="opacity-90" />
            <circle r="8.5" fill="url(#orbButtonBezel)" stroke="#111827" strokeWidth="0.5" />
            <circle r="5" fill="none" stroke="#374151" strokeWidth="0.5" className="opacity-40" />
            <circle r="2.5" fill="#14B8A6" className="opacity-90" />
            <circle r="4" fill="#FFFFFF" className="opacity-30" cx="-1.5" cy="-1.5" />
          </g>

          {/* Sapphire glass and convex reflection overlays */}
          <circle r="88" fill="url(#orbButtonReflection)" className="pointer-events-none mix-blend-overlay" />
          <circle r="88" fill="url(#orbButtonSapphire)" className="pointer-events-none mix-blend-screen" />
        </svg>
      </motion.div>
    </button>
  );
}

function HomeScreen({ likedIds, onSelectRec, language, recommendations, onNavigateToProfile, seasonalTips, vibeSettings, ratings, lowSignalMode, onToggleLowSignal }: any) {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const [activeRecIndex, setActiveRecIndex] = useState(0);
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [openedEnvelope, setOpenedEnvelope] = useState<'sunset' | 'gastronomy' | 'after_hours' | null>(null);
  const [envelopeRevealed, setEnvelopeRevealed] = useState(false);
  const [selectedTip, setSelectedTip] = useState<any | null>(null);
  const [selectedFact, setSelectedFact] = useState<any | null>(null);
  const [activeBriefingTab, setActiveBriefingTab] = useState<'stories' | 'wisdom' | 'slang'>('stories');
  const [showDiscoveryBanner, setShowDiscoveryBanner] = useState<boolean>(() => {
    try {
      return safeStorage.getItem('idemo_discovery_dismissed_v1') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissDiscovery = () => {
    triggerHaptic(5);
    setShowDiscoveryBanner(false);
    try {
      safeStorage.setItem('idemo_discovery_dismissed_v1', 'true');
    } catch (e) {}
  };

  const getMysteryRec = (type: 'sunset' | 'gastronomy' | 'after_hours' | null) => {
    if (!type) return recommendations[0];
    return recommendations.find((item: any) => {
      const cats = (item.category || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      if (type === 'sunset') {
        return cats.includes('nature') || cats.includes('travel') || cats.includes('history') || title.includes('lookout') || title.includes('fortress') || title.includes('view') || title.includes('peak') || title.includes('canyon');
      } else if (type === 'gastronomy') {
        return cats.includes('gastronomy') || title.includes('kafana') || title.includes('dining') || title.includes('distillery');
      } else { // after_hours
        return cats.includes('clubbing') || cats.includes('entertainment') || cats.includes('bar') || cats.includes('music') || cats.includes('nightlife');
      }
    }) || recommendations[0];
  };

  return (
    <motion.div 
      className="flex-1 p-6 pt-10 space-y-8 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif text-brand-charcoal tracking-tighter">{t.welcome}</h2>
          <p className="text-[13px] text-accent-red font-bold flex items-center gap-2 tracking-normal leading-tight">
            <span className="w-1.5 h-1.5 bg-accent-red rounded-full animate-pulse flex-shrink-0" />
            <span className="max-w-[220px] sm:max-w-md">{t.curated_for_you}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <PulsatingProfileButton 
            onClick={onNavigateToProfile}
            language={language}
            size={52}
            iconSize={22}
          />
        </div>
      </header>

  
 
      <section id="recommendations-section" className="relative -mx-6">
        <PremiumCarousel 
          items={recommendations} 
          onSelect={onSelectRec}
          onIndexChange={(idx) => {
            setActiveRecIndex(idx);
            setActiveTooltipId(null);
          }}
          itemWidth={310}
          height="505px"
          renderItem={(item, isCenter) => (
            <div className={`relative h-[480px] rounded-[40px] overflow-hidden shadow-xl transition-all duration-300 ease-out border border-border-main cursor-pointer ${isCenter ? 'bg-brand-charcoal' : 'bg-brand-charcoal/80'}`}>
              {lowSignalMode ? (
                <div className="w-full h-full bg-[#FAF9F5] border-b border-[#E5E3DB] flex flex-col items-center justify-center p-6 text-center select-none">
                  <span className="text-[24px] mb-2 font-serif opacity-35 text-brand-charcoal/80">✦</span>
                  <span className="text-xs uppercase tracking-[0.2em] font-black text-brand-charcoal leading-snug px-6">{getLocalizedValue(item, 'title', language)}</span>
                  <span className="text-[12px] font-mono tracking-wider text-[#5C5A4D] uppercase mt-4 bg-[#EDEBDF] px-3.5 py-1.5 rounded-full border border-border-main/40 font-bold">Bandwidth Optimized</span>
                </div>
              ) : (
                <LazyImage 
                  src={item.image} 
                  alt={getLocalizedValue(item, 'title', language)} 
                  className="w-full h-full object-cover" 
                />
              )}
              
              {/* Subtle Offline-Ready Indicator Badge removed to minimize tech noise */}

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end text-white text-left">
                <div className="flex justify-between items-start mb-auto w-full">
                  <div className="flex flex-col items-start gap-1.5 animate-fade-in-slow">
                    <span className="text-[12px] uppercase tracking-widest text-[#FFF] bg-[#8A1F1F] px-2.5 py-1 rounded-md font-bold leading-none">{formatCategory(item.category, t)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.coordinates && (
                      <a 
                        href={getNavigationUrl(item.coordinates.lat, item.coordinates.lng, getLocalizedValue(item, 'title', language))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic(10);
                          trackMapOpenSignal(item);
                        }}
                        className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/20 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-md hover:bg-white/40"
                      >
                        <MapPin size={16} />
                      </a>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(8);
                        setActiveTooltipId(activeTooltipId === item.id ? null : item.id);
                      }}
                      className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/20 active:scale-95 transition-all hover:bg-white/40 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-md"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-4 items-end w-full">
                  <div className="min-w-0 flex flex-col justify-end">
                    <h3 className="text-xl font-serif leading-tight line-clamp-2 text-white">{getLocalizedValue(item, 'title', language)}</h3>
                    <div className="mt-2.5 flex items-center gap-2 opacity-85">
                       <div className="h-[1.5px] w-4 bg-white" />
                       <span className="text-[12px] uppercase tracking-widest truncate font-extrabold">{t.explore_narrative}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 shrink-0 z-10">
                    <MiniMoodGrid coordinateX={item.coordinateX} coordinateY={item.coordinateY} className="shadow-md border-white/20" />
                    {item.badge && (
                      <div className="scale-100 origin-bottom-right">
                        <PremiumBadge type={item.badge} compact />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tooltip Overlay */}
              <AnimatePresence>
                {activeTooltipId === item.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(5);
                      setActiveTooltipId(null);
                    }}
                    className="absolute top-16 right-6 z-40 bg-brand-charcoal/95 border border-white/20 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl w-[220px]"
                  >
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-white/90">
                        <Clock size={12} className="text-accent-red shrink-0" />
                        <span className="truncate">
                          <strong>{t.travel_time || "Travel Time"}:</strong> {item.travelTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/90">
                        <Zap size={12} className="text-accent-red shrink-0" />
                        <span className="truncate">
                          <strong>{t.primary_transport || "Transport"}:</strong> {item.preferredTransport}
                        </span>
                      </div>
                    </div>
                    {/* Tiny speech-bubble pointer */}
                    <div className="absolute top-[-5px] right-3.5 w-2.5 h-2.5 bg-brand-charcoal/95 rotate-45 border-t border-l border-white/20" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
           {recommendations.map((_: any, i: number) => (
             <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${i === activeRecIndex ? 'bg-accent-red w-3' : 'bg-brand-charcoal/10'}`} />
           ))}
        </div>
      </section>

      {/* Concierge Sealed Envelopes section (Insider Discoveries) */}
      <section className="space-y-4 pt-2 border-t border-border-main/20">
        <div className="space-y-1">
          <h3 className="text-xl font-serif tracking-tight text-brand-charcoal">
            {language === 'sr' ? 'Lokalne tajne' : language === 'zh' ? '圈内探秘' : 'Insider Discoveries'}
          </h3>
          <p className="text-[12px] uppercase tracking-[0.2em] font-extrabold text-[#5C5A4D]">
            {language === 'sr' ? 'ZAPEČAĆENA POŠILJKA' : language === 'zh' ? '密函推荐' : 'THE SEALED DISPATCH'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* Envelope 1 */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setOpenedEnvelope('sunset');
              setEnvelopeRevealed(false);
            }}
            className="h-[125px] bg-[#FAF9F6] border border-[#EBEBE6] rounded-[24px] flex flex-col justify-between p-4 transition-all active:scale-[0.97] duration-200 group relative overflow-hidden shadow-sm hover:shadow-md text-left cursor-pointer min-h-[48px]"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-xl">⛰️</span>
              <div className="w-5 h-5 rounded-full bg-[#8A1F1F]/10 border border-[#8A1F1F]/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#8A1F1F] shadow-sm" />
              </div>
            </div>
            <div>
              <span className="block text-[12px] uppercase tracking-wider text-accent-red font-black mb-0.5">Summit & Vapour</span>
              <span className="block text-[13px] font-serif text-brand-charcoal font-extrabold leading-tight">Secret Vista</span>
            </div>
          </button>

          {/* Envelope 2 */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setOpenedEnvelope('gastronomy');
              setEnvelopeRevealed(false);
            }}
            className="h-[125px] bg-[#FAF9F6] border border-[#EBEBE6] rounded-[24px] flex flex-col justify-between p-4 transition-all active:scale-[0.97] duration-200 group relative overflow-hidden shadow-sm hover:shadow-md text-left cursor-pointer min-h-[48px]"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-xl">🍷</span>
              <div className="w-5 h-5 rounded-full bg-[#8A1F1F]/10 border border-[#8A1F1F]/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#8A1F1F] shadow-sm" />
              </div>
            </div>
            <div>
              <span className="block text-[12px] uppercase tracking-wider text-[#5C5A4D] font-black mb-0.5">Kafana Ritual</span>
              <span className="block text-[13px] font-serif text-brand-charcoal font-extrabold leading-tight">Curated Dining</span>
            </div>
          </button>

          {/* Envelope 3 */}
          <button
            onClick={() => {
              triggerHaptic(15);
              setOpenedEnvelope('after_hours');
              setEnvelopeRevealed(false);
            }}
            className="h-[125px] bg-[#FAF9F6] border border-[#EBEBE6] rounded-[24px] flex flex-col justify-between p-4 transition-all active:scale-[0.97] duration-200 group relative overflow-hidden shadow-sm hover:shadow-md text-left cursor-pointer min-h-[48px]"
          >
            <div className="flex justify-between items-start w-full">
              <span className="text-xl">🌃</span>
              <div className="w-5 h-5 rounded-full bg-[#8A1F1F]/10 border border-[#8A1F1F]/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[#8A1F1F] shadow-sm" />
              </div>
            </div>
            <div>
              <span className="block text-[12px] uppercase tracking-wider text-accent-teal font-black mb-0.5">After-Hours</span>
              <span className="block text-[13px] font-serif text-brand-charcoal font-extrabold leading-tight">Midnight Secrets</span>
            </div>
          </button>
        </div>
      </section>

      {/* Dynamic Dispatch Modal Reveal */}
      <AnimatePresence>
        {openedEnvelope && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[360px] rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 flex flex-col items-center text-center relative"
            >
              <button 
                onClick={() => {
                  setOpenedEnvelope(null);
                  setEnvelopeRevealed(false);
                  triggerHaptic(10);
                }} 
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              {/* Physical Sealed Letter Visual Interface */}
              {!envelopeRevealed ? (
                <div className="space-y-6 py-6 w-full flex flex-col items-center">
                  <div className="w-16 h-12 border border-[#8C8A7D]/30 bg-white/40 rounded-lg relative flex items-center justify-center shadow-inner">
                    <div className="absolute top-0 inset-x-0 h-0.5 bg-[#8C8A7D]/10" />
                    {/* The Crimson Monogram Wax Seal */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        triggerHaptic([10, 30]);
                        setEnvelopeRevealed(true);
                      }}
                      className="w-10 h-10 rounded-full bg-[#8A1F1F] text-[#FFF4F4] flex items-center justify-center font-serif text-xs font-bold shadow-[0_4px_10px_rgba(138,31,31,0.4)] border border-[#751717] relative z-10 cursor-pointer"
                    >
                      С
                    </motion.button>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-accent-red">SECRET NO: {openedEnvelope === 'sunset' ? '01' : openedEnvelope === 'gastronomy' ? '02' : '03'}</span>
                    <h4 className="text-xl font-serif text-brand-charcoal">
                      {openedEnvelope === 'sunset' ? "The Summit & Vapour Link" : openedEnvelope === 'gastronomy' ? "The Kafana Code Link" : "The Gilded After-Hours Link"}
                    </h4>
                    <p className="text-xs text-brand-charcoal/60 leading-relaxed max-w-[240px] mx-auto">
                      This sealed dispatch contains a personalized recommendation aligned with your active vibe match matrix and the Belgrade Waterfront spring calendar.
                    </p>
                  </div>

                  <button 
                    onClick={() => {
                      triggerHaptic([10, 30]);
                      setEnvelopeRevealed(true);
                    }}
                    className="w-full h-11 bg-brand-charcoal text-[#F6F5F2] rounded-xl font-serif text-sm tracking-tight hover:bg-brand-charcoal/90 transition-all flex items-center justify-center gap-2 shadow-sm border border-brand-charcoal/10 cursor-pointer"
                  >
                    Break Wax Seal & Read
                  </button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 py-2 w-full text-left"
                >
                  <div className="border-b border-border-main/50 pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] uppercase tracking-[0.2em] font-black text-accent-red">REVEALED DISPATCH</span>
                      <span className="text-[9px] font-mono text-[#8C8A7D]">🌿 DYNAMIC CALIBRATION MATCH</span>
                    </div>
                    <h4 className="text-2xl font-serif text-brand-charcoal tracking-tight">
                      {getMysteryRec(openedEnvelope).title}
                    </h4>
                    {CYRILLIC_DICTIONARY[getMysteryRec(openedEnvelope).id] && (
                      <p className="text-xs font-serif italic text-[#8C8A7D] mt-1">
                        Serbian: {CYRILLIC_DICTIONARY[getMysteryRec(openedEnvelope).id].cyrillic}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-4 bg-[#F5F4EE] rounded-2xl border border-border-main/40 text-xs text-[#3A3D32] leading-relaxed relative">
                      <p className="font-serif italic text-brand-charcoal/80 mb-2 font-medium font-bold text-accent-red">Concierge Secret Note:</p>
                      <p className="font-sans font-light">
                        {CYRILLIC_DICTIONARY[getMysteryRec(openedEnvelope).id]?.tip || getMysteryRec(openedEnvelope).shortDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-brand-charcoal/70 bg-white/40 border border-[#EBEBE6] p-3 rounded-2xl">
                      <div>
                        <span className="block text-[#8C8A7D] uppercase tracking-wider text-[7.5px] font-bold">Duration</span>
                        <span className="font-medium text-brand-charcoal">{getMysteryRec(openedEnvelope).duration}</span>
                      </div>
                      <div>
                        <span className="block text-[#8C8A7D] uppercase tracking-wider text-[7.5px] font-bold">Transit</span>
                        <span className="font-medium text-brand-charcoal">{getMysteryRec(openedEnvelope).preferredTransport}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        onSelectRec(getMysteryRec(openedEnvelope).id);
                        setOpenedEnvelope(null);
                        setEnvelopeRevealed(false);
                        triggerHaptic(10);
                      }}
                      className="flex-1 h-11 bg-accent-teal text-white rounded-xl font-serif text-xs tracking-wide hover:bg-accent-teal/90 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button 
                      onClick={() => {
                        setOpenedEnvelope(null);
                        setEnvelopeRevealed(false);
                      }}
                      className="px-4 h-11 bg-white border border-[#E5E3DB] text-brand-charcoal rounded-xl text-xs hover:bg-[#F3F2EC] transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Expanded Useful Tip (Serbia Decoded) Modal */}
        {selectedTip && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => {
              setSelectedTip(null);
              triggerHaptic(10);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[420px] rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 flex flex-col relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setSelectedTip(null);
                  triggerHaptic(10);
                }} 
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-border-main/30 pb-3">
                  <span className="text-[12px] uppercase tracking-widest text-accent-red font-bold">
                    {formatCategory(selectedTip.category, t)}
                  </span>
                  <span className="text-[14px] font-serif italic text-brand-charcoal/40 font-bold">
                    {selectedTip.id.replace(/[_-]/g, ' ').toUpperCase()}
                  </span>
                </div>

                <h4 className="text-[24px] font-serif font-bold leading-tight text-brand-charcoal">
                  {getLocalizedValue(selectedTip, 'title', language)}
                </h4>

                <div className="max-h-[300px] overflow-y-auto pr-1 text-[16.5px] text-brand-charcoal/80 leading-relaxed font-normal space-y-3 font-sans">
                  <p>{getLocalizedValue(selectedTip, 'description', language)}</p>
                  {selectedTip.equivalentPhrases && (
                    <div className="pt-3 border-t border-border-main/20 mt-3 bg-brand-pearl/25 p-3.5 rounded-2xl border border-border-main/10">
                      <span className="block text-[11px] uppercase tracking-wider text-[#8C8A7D] font-black mb-1">Equivalent / Pronunciation</span>
                      <p className="text-[15px] text-[#8C8A7D] italic">
                        {selectedTip.equivalentPhrases}
                      </p>
                    </div>
                  )}
                </div>

                {(selectedTip.link || selectedTip.androidLink || selectedTip.iosLink) && (
                  <div className="pt-4 border-t border-border-main/20 flex flex-wrap gap-2 items-center justify-end w-full">
                    {selectedTip.androidLink && (
                      <a 
                        href={selectedTip.androidLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-[#FAF9F5] hover:bg-brand-charcoal/95 transition-all active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Android <ExternalLink size={10} />
                      </a>
                    )}
                    {selectedTip.iosLink && (
                      <a 
                        href={selectedTip.iosLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-[#FAF9F5] hover:bg-brand-charcoal/95 transition-all active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        iOS App <ExternalLink size={10} />
                      </a>
                    )}
                    {selectedTip.link && !selectedTip.androidLink && !selectedTip.iosLink && (
                      <a 
                        href={selectedTip.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[13.5px] uppercase tracking-widest font-bold text-accent-red hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.action_link || 'Learn More'} <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Expanded Did You Know (Fun Fact) Modal */}
        {selectedFact && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => {
              setSelectedFact(null);
              triggerHaptic(10);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[420px] rounded-[36px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-8 flex flex-col relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => {
                  setSelectedFact(null);
                  triggerHaptic(10);
                }} 
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-border-main/30 pb-3">
                  <div className="w-2.5 h-2.5 bg-accent-red rounded-sm rotate-45" />
                  <p className="text-[12px] uppercase font-black tracking-[0.2em] text-[#8C8A7D]">
                    {t.mystery_label || 'Did You Know'}
                  </p>
                </div>

                <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4">
                  <p className="text-[21px] font-serif text-brand-charcoal leading-snug">
                    {getLocalizedValue(selectedFact, 'fact', language)}
                  </p>
                  
                  <div className="pt-4 border-t border-border-main">
                    <p className="text-[12px] uppercase tracking-[0.3em] text-accent-red font-black mb-1.5">{t.revelation_label}</p>
                    <p className="text-[16.5px] text-[#5C5E54] leading-relaxed italic">
                      {getLocalizedValue(selectedFact, 'whyItMatters', language)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CULTURAL BRIEFINGS PILLAR */}
      <section className="space-y-4 pt-2 border-t border-border-main/20">
        <div className="space-y-1">
          <h3 className="text-xl font-serif tracking-tight text-brand-charcoal">
            {language === 'sr' ? 'Kulturni brifinzi' : language === 'zh' ? '文化简报' : 'Cultural Briefings'}
          </h3>
          <p className="text-[12px] uppercase tracking-[0.2em] font-extrabold text-[#5C5A4D]">
            {language === 'sr' ? 'SVE ŠTO TREBA DA ZNATE O SRBIJI' : language === 'zh' ? '帮助您深入了解塞尔维亚的专属窗口' : 'WHAT SHOULD I KNOW ABOUT SERBIA?'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 border-b border-border-main/10">
          {[
            { id: 'stories', label: language === 'sr' ? 'Priče i običaji' : language === 'zh' ? '故事与习俗' : 'Stories & Customs', icon: '✦' },
            { id: 'wisdom', label: language === 'sr' ? 'Lokalna mudrost' : language === 'zh' ? '地方智慧' : 'Local Wisdom', icon: '❂' },
            { id: 'slang', label: language === 'sr' ? 'Sleng i bonton' : language === 'zh' ? '社交礼仪与方言' : 'Social Codes & Slang', icon: '💬' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic(6);
                setActiveBriefingTab(tab.id as any);
              }}
              className={`px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer min-h-[44px] ${
                activeBriefingTab === tab.id
                  ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm font-bold'
                  : 'bg-[#FAF9F5] hover:bg-[#FAF9F5] border-border-main text-[#5C5A4D]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content renderer inside motion container */}
        <AnimatePresence mode="wait">
          {activeBriefingTab === 'stories' && (
            <motion.div 
              key="briefing-stories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-1"
            >
              <div className="relative -mx-6">
                <PremiumCarousel 
                  items={USEFUL_TIPS}
                  height="430px"
                  itemWidth={280}
                  onSelect={(id) => {
                    const tip = USEFUL_TIPS.find(t => t.id === id);
                    if (tip) {
                      setSelectedTip(tip);
                      triggerHaptic(15);
                    }
                  }}
                  renderItem={(tip, isCenter) => (
                    <div className={`h-[400px] p-6 rounded-[32px] flex flex-col justify-between items-start text-left group transition-all duration-300 ${
                      isCenter 
                        ? 'bg-white border-2 border-brand-charcoal/25 shadow-[0_12px_28px_rgba(45,48,37,0.14)]' 
                        : 'bg-[#EDE9DE] border border-border-main shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
                    }`}>
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[12px] uppercase tracking-widest text-accent-red font-bold">{formatCategory(tip.category, t)}</span>
                          <span className="text-[15px] font-serif italic text-brand-charcoal/40">{tip.id.padStart(2, '0')}</span>
                        </div>
                        <h4 className="text-[24px] font-serif font-bold leading-tight text-brand-charcoal mb-2">{getLocalizedValue(tip, 'title', language)}</h4>
                        <p className="text-[21px] text-brand-charcoal/70 leading-relaxed font-normal line-clamp-4">{getLocalizedValue(tip, 'description', language)}</p>
                        {tip.equivalentPhrases && (
                          <p className="mt-2 text-[13.5px] text-[#8C8A7D] italic border-t border-border-main/40 pt-2">
                             {tip.equivalentPhrases}
                          </p>
                        )}
                      </div>
                      <div className="mt-auto pt-3 border-t border-border-main/20 flex items-center justify-between w-full">
                        <span className="text-[18px] uppercase tracking-[0.1em] text-[#8A1F1F] font-black opacity-90">
                          {language === 'sr' ? 'Dodirni za detalje' : language === 'zh' ? '点击查看详情' : 'Tap for details'}
                        </span>
                        {(tip.link || tip.androidLink || tip.iosLink) && (
                          <div className="flex flex-wrap gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                            {tip.androidLink && (
                              <a 
                                href={tip.androidLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-[#FAF9F5] hover:bg-brand-charcoal/95 transition-all active:scale-95"
                              >
                                Android <ExternalLink size={10} />
                              </a>
                            )}
                            {tip.iosLink && (
                              <a 
                                href={tip.iosLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-brand-charcoal text-[#FAF9F5] hover:bg-brand-charcoal/95 transition-all active:scale-95"
                              >
                                iOS <ExternalLink size={10} />
                              </a>
                            )}
                            {tip.link && !tip.androidLink && !tip.iosLink && (
                              <a 
                                href={tip.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-[13.5px] uppercase tracking-widest font-bold text-accent-red hover:underline"
                              >
                                {t.action_link} <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            </motion.div>
          )}

          {activeBriefingTab === 'wisdom' && (
            <motion.div 
              key="briefing-wisdom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 pt-1"
            >
              <div className="relative -mx-6">
                <PremiumCarousel 
                  items={DID_YOU_KNOW}
                  height="430px"
                  itemWidth={280}
                  onSelect={(id) => {
                    const item = DID_YOU_KNOW.find(k => k.id === id);
                    if (item) {
                      setSelectedFact(item);
                      triggerHaptic(15);
                    }
                  }}
                  renderItem={(item, isCenter) => (
                    <div className={`h-[400px] p-6 rounded-[32px] space-y-4 flex flex-col justify-between transition-all duration-300 ${
                      isCenter 
                        ? 'bg-white border-2 border-brand-charcoal/25 shadow-[0_12px_28px_rgba(45,48,37,0.14)]' 
                        : 'bg-[#EDE9DE] border border-border-main shadow-[0_4px_12px_rgba(0,0,0,0.06)]'
                    }`}>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-accent-red rounded-sm rotate-45" />
                          <p className="text-[13.5px] uppercase font-black tracking-[0.2em] text-[#8C8A7D]">{t.mystery_label}</p>
                        </div>
                      </div>
                      <p className="text-[21px] font-serif text-brand-charcoal leading-snug flex-1">{getLocalizedValue(item, 'fact', language)}</p>
                      <div className="pt-4 border-t border-border-main flex flex-col justify-between items-start gap-2.5 w-full">
                        <div className="w-full">
                          <p className="text-[12px] uppercase tracking-[0.3em] text-accent-red font-black mb-1">{t.revelation_label}</p>
                          <p className="text-[16.5px] text-[#5C5E54] leading-relaxed italic line-clamp-2">{getLocalizedValue(item, 'whyItMatters', language)}</p>
                        </div>
                        <span className="text-[18px] uppercase tracking-[0.1em] text-[#8A1F1F] font-black opacity-90">
                          {language === 'sr' ? 'Dodirni za detalje' : language === 'zh' ? '点击查看详情' : 'Tap for details'}
                        </span>
                      </div>
                    </div>
                  )}
                />
              </div>
            </motion.div>
          )}

          {activeBriefingTab === 'slang' && (
            <motion.div 
              key="briefing-slang"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="pt-1"
            >
              <SlangCrypt language={language} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Seasonal Tips Carousel (Seasonal Highlights) */}
      <section className="space-y-6 pt-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.4em] text-accent-red font-black">
              {language === 'sr' ? 'AKTUELNA SEZONA U SRBIJI' : language === 'zh' ? '本季限定游览精选' : 'THIS SEASON IN SERBIA'}
            </p>
            <h2 className="text-3xl font-serif text-brand-charcoal tracking-tighter">
              {language === 'sr' ? 'Sezonski noviteti' : language === 'zh' ? '季节限定推荐' : 'Seasonal Highlights'}
            </h2>
          </div>
        </div>

        <div className="relative -mx-6">
          <PremiumCarousel 
            items={seasonalTips}
            height="505px"
            itemWidth={310}
            renderItem={(tip, isCenter) => (
              <div 
                className={`relative h-[480px] rounded-[40px] overflow-hidden shadow-xl transition-all duration-500 border border-border-main group ${isCenter ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}
              >
                <LazyImage 
                  src={tip.image} 
                  alt={tip.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white backdrop-blur-[1px]">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.4em] font-black opacity-80">{tip.subtitle}</p>
                    <h3 className="text-4xl font-serif tracking-tighter leading-none font-bold">{tip.title}</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">Curated Experiences</p>
                      <div className="grid grid-cols-2 gap-2">
                        {tip.highlights.map((h: any) => (
                          <button 
                            key={h.label} 
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRec(h.linkId);
                            }}
                            className="px-2 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md rounded-xl text-[14px] uppercase tracking-wider font-black border border-white/10 transition-all active:scale-95 text-center leading-normal shadow-sm truncate"
                          >
                            {h.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t border-white/20 flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-60 italic">{tip.mood}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>
    </motion.div>
  );
}

const FEEDBACK_TRANSLATIONS: Record<string, any> = {
  en: {
    title: "Vibe Match Check",
    perfect: "Fits Me",
    intrigue: "Intriguing",
    skip: "Not for Me",
    tags_title: "What defines it for you?",
    thank_you: "Sentiment saved. Your concierge is calibrated."
  },
  sr: {
    title: "Usklađenost stila",
    perfect: "Moj stil",
    intrigue: "Zanimljivo",
    skip: "Nije za mene",
    tags_title: "Šta ga definiše za vas?",
    thank_you: "Stil je sačuvan. Vaš konsijerž je kalibrisan."
  },
  es: {
    title: "Ajuste de estilo",
    perfect: "Va conmigo",
    intrigue: "Intrigante",
    skip: "No es para mí",
    tags_title: "¿Qué cualidades destacan?",
    thank_you: "Estilo guardado. Conserjería calibrada."
  },
  de: {
    title: "Stimmungs-Check",
    perfect: "Passt genau",
    intrigue: "Interessant",
    skip: "Nicht für mich",
    tags_title: "Was zeichnet es aus?",
    thank_you: "Stimmung gespeichert. Concierge kalibriert."
  },
  ru: {
    title: "Настройка стиля",
    perfect: "В моем стиле",
    intrigue: "Интересно",
    skip: "Не для меня",
    tags_title: "Какие качества выделяются?",
    thank_you: "Настройки сохранены. Консьерж откалиброван."
  },
  zh: {
    title: "契合度测试",
    perfect: "深得我意",
    intrigue: "颇感兴趣",
    skip: "不合口味",
    tags_title: "令您印象最深的是什么？",
    thank_you: "偏好已保存。专属智囊校准完成。"
  }
};

const FEEDBACK_TAGS = [
  { id: 'authentic', label: { en: 'Authentic Curation', sr: 'Autentična priča', es: 'Curación auténtica', de: 'Authentisch', ru: 'Аутентично', zh: '正宗精选' } },
  { id: 'peaceful', label: { en: 'Serene Atmosphere', sr: 'Spokojna atmosfera', es: 'Ambiente sereno', de: 'Ruhig & Gelassen', ru: 'Умиротворенно', zh: '幽静宁谧' } },
  { id: 'unique', label: { en: 'True Hidden Gem', sr: 'Pravi skriveni dragulj', es: 'Joya oculta', de: 'Geheimtipp', ru: 'Скрытая жемчужина', zh: '隐秘宝藏' } },
  { id: 'magnificent', label: { en: 'Stunning Visuals', sr: 'Čarobni predeli', es: 'Paisaje magnífico', de: 'Atemberaubend', ru: 'Потрясающие виды', zh: '震撼景致' } },
  { id: 'gastronomy', label: { en: 'Exceptional Taste', sr: 'Izuzetan ukus', es: 'Sabor excepcional', de: 'Gaumenschmaus', ru: 'Изысканный вкус', zh: '极致风味' } }
];

export const CONCIERGE_T: Record<string, any> = {
  en: {
    desk: "✦ PREMIUM CONCIERGE DESK ✦",
    sub: "Securely brokering arrangements for",
    hidden_id: "Inquiry Reference",
    inquiry_reference: "Inquiry Reference",
    regarding: "Regarding",
    select_template: "Choose a pre-filled arrangement template:",
    custom_details: "Custom special requests & notes (optional)",
    placeholder: "e.g., Preferred time, party size, dietary bounds, language needs...",
    despatch: "Despatch to Concierge",
    submitting: "Securing connection...",
    logging: "Registering referral broker handshake...",
    confirmed_title: "ENQUIRY RECORDED",
    confirmed_msg: "Your brokerage request has been recorded. To retain priority VIP status and premium pricing, please complete this scheduling through our designated secure desk lines:",
    via_whatsapp: "Message via WhatsApp Gate",
    via_instagram: "Message via Instagram",
    via_call: "Initiate Private Call",
    close: "Return to Curation",
    warning: "Direct bookings without our broker code may void VIP privileges.",
    temp_gastronomy: [
      "Request private table reservation",
      "Arrange curated chef's tasting menu",
      "Inquire about exclusive VIP seating"
    ],
    temp_medical: [
      "Coordinate priority appointment slot",
      "Request executive treatment pre-approval",
      "Arrange premium transfer from airport"
    ],
    temp_default: [
      "Request private guided VIP tour",
      "Arrange professional multilingual escort",
      "Request premium chauffeur transfer"
    ]
  },
  sr: {
    desk: "✦ ПРЕМИЈУМ СЛУЖБА КОНСИЈЕРЖА ✦",
    sub: "Безбедно посредовање у аранжманима за",
    hidden_id: "Упитна референца",
    inquiry_reference: "Упитна референца",
    regarding: "Поводом",
    select_template: "Изаберите шаблон за брзи упит:",
    custom_details: "Додатни захтеви и белешке (опционо)",
    placeholder: "нпр. Жељено време, број особа, дијететске преференције, језик...",
    despatch: "Пошаљи упит консијержу",
    submitting: "Успостављање сигурне везе...",
    logging: "Регистровање посредовања консијерж заједнице...",
    confirmed_title: "УПИТ ЈЕ УСПЕШНО ЗАБЕЛЕЖЕН",
    confirmed_msg: "Ваш упут је забележен. Да бисте задржали ВИП статус и повлашћене цене, молимо вас да довршите разговор путем наших заштићених каналских линија:",
    via_whatsapp: "Пошаљи поруку преко WhatsApp-а",
    via_instagram: "Пошаљи поруку преко Instagram-а",
    via_call: "Оствари сигуран телефонски позив",
    close: "Повратак на водич",
    warning: "Директан контакт са објектом ван нашег система поништава ВИП погодности.",
    temp_gastronomy: [
      "Резервација приватног стола",
      "Договор специјалног менија за дегустацију",
      "Упит за ексклузивни ВИП сепаре"
    ],
    temp_medical: [
      "Координација приоритетног термина",
      "Упит за ексклузивни третман",
      "Приватни луксузни трансфер до клинике"
    ],
    temp_default: [
      "Резервација приватног ВИП водича",
      "Ангажовање професионалног пратиоца",
      "Луксузни трансфер возилом премијум класе"
    ]
  },
  es: {
    desk: "✦ SERVICIO DE CONSERJERÍA PREMIUM ✦",
    sub: "Intermediando de forma segura para",
    hidden_id: "Referencia de la Solicitud",
    inquiry_reference: "Referencia de la Solicitud",
    regarding: "Respecto a",
    select_template: "Seleccione una plantilla de solicitud preestablecida:",
    custom_details: "Detalles adicionales y notas especiales (opcional)",
    placeholder: "ej., Hora de preferencia, número de personas, alergias, idioma...",
    despatch: "Enviar a conserjería",
    submitting: "Asegurando conexión...",
    logging: "Registrando la firma de intermediación VIP...",
    confirmed_title: "SOLICITUD REGISTRADA",
    confirmed_msg: "Su solicitud exclusiva ha sido registrada de forma segura. Para mantener los privilegios VIP y las tarifas de convenio, finalice el acuerdo a través de nuestros canales oficiales:",
    via_whatsapp: "Enviar Mensaje de WhatsApp",
    via_instagram: "Enviar Mensaje de Instagram",
    via_call: "Iniciar Llamada Privada",
    close: "Volver a la selección",
    warning: "El contacto directo sin nuestro código de intermediación invalida las facilidades VIP.",
    temp_gastronomy: [
      "Solicitar reserva de mesa privada",
      "Organizar menú de gastronomía de autor",
      "Consultar por asientos VIP exclusivos"
    ],
    temp_medical: [
      "Coordinar turno de cita prioritaria",
      "Solicitar aprobación previa de tratamiento ejecutivo",
      "Organizar traslado de lujo de aeropuerto al centro"
    ],
    temp_default: [
      "Solicitar visita guided VIP privada",
      "Organizar acompañamiento profesional multilingüe",
      "Solicitar traslado con chofer de lujo"
    ]
  },
  de: {
    desk: "✦ PREMIUM-CONCIERGE-SERVICE ✦",
    sub: "Sichere Vermittlung von Arrangements für",
    hidden_id: "Anfrage-Referenz",
    inquiry_reference: "Anfrage-Referenz",
    regarding: "Betreffend",
    select_template: "Wählen Sie eine vorbereitete Vorlage aus:",
    custom_details: "Zusätzliche Wünsche & Notizen (optional)",
    placeholder: "z.B. Bevorzugte Uhrzeit, Personenanzahl, Ernährung, Sprache...",
    despatch: "An Concierge übermitteln",
    submitting: "Sichere Verbindung aufbauen...",
    logging: "Luxus-Broker-Handshake einloggen...",
    confirmed_title: "ANFRAGE ERFASST",
    confirmed_msg: "Ihre exklusive Anfrage wurde erfasst. Um den VIP-Status und die ermäßigten Preise zu behalten, schließen Sie die Buchung bitte über unsere sicheren Leitungen ab:",
    via_whatsapp: "Per WhatsApp anfragen",
    via_instagram: "Per Instagram anfragen",
    via_call: "Privaten Anruf starten",
    close: "Zurück zur Übersicht",
    warning: "Direktbuchungen ohne unseren Vermittlungscode können VIP-Vorteile aufheben.",
    temp_gastronomy: [
      "Privaten Tisch reservieren",
      "Exklusives Degustationsmenü anfragen",
      "VIP-Sitzplätze anfragen"
    ],
    temp_medical: [
      "Prioritätstermin vereinbaren",
      "Zusage für Executive-Behandlung anfragen",
      "Luxustransfer vom Flughafen zur Klinik"
    ],
    temp_default: [
      "Private geführte VIP-Tour anfragen",
      "Professionelle mehrsprachige Begleitung",
      "Luxus-Chauffeurservice anfordern"
    ]
  },
  ru: {
    desk: "✦ ПРЕМИУМ-КОНСЬЕРЖ СЛУЖБА ✦",
    sub: "Безопасное посредничество бронирования для",
    hidden_id: "Номер запроса",
    inquiry_reference: "Номер запроса",
    regarding: "Касательно",
    select_template: "Выберите подходящий шаблон запроса:",
    custom_details: "Особые пожелания и комментарии (необязательно)",
    placeholder: "например, желаемое время, количество гостей, предпочтения по меню...",
    despatch: "Отправить запрос консьержу",
    submitting: "Установка защищенного канала...",
    logging: "Регистрация сделки во внутрисистемной базе...",
    confirmed_title: "ЗАПРОС ЗАРЕГИСТРИРОВАН",
    confirmed_msg: "Ваш эксклюзивный запрос успешно оформлен. Для сохранения закрытых тарифов и VIP-привилегий завершите бронирование через наши безопасные каналы связи:",
    via_whatsapp: "Написать в WhatsApp",
    via_instagram: "Написать в Instagram",
    via_call: "Перейти к звонку",
    close: "Вернуться в гид",
    warning: "Обращение напрямую повышает риск отмены VIP-программы и скидки.",
    temp_gastronomy: [
      "Запросить бронирование vip-стола",
      "Организовать дегустационное меню от шефа",
      "Узнать о наличии свободных VIP-мест"
    ],
    temp_medical: [
      "Согласовать приоритетное время приема",
      "Запросить предварительное подтверждение обслуживания",
      "Организовать премиум-трансфер из аэропорта"
    ],
    temp_default: [
      "Заказать частную VIP-экскурсию с гидом",
      "Организовать профессиональное сопровождение",
      "Заказать индивидуальный трансфер с водителем"
    ]
  },
  zh: {
    desk: "✦ 尊享高端礼宾服务台 ✦",
    sub: "已为您安全开启独家服务中介流程",
    hidden_id: "查询参考号",
    inquiry_reference: "查询参考号",
    regarding: "关于",
    select_template: "请选择快速预约服务模板：",
    custom_details: "个性化备忘与特别说明（选填）",
    placeholder: "如：期望时间、到店人数、饮食忌口、随员语言等...",
    despatch: "派遣该预约至礼宾部",
    submitting: "正在建立安全专线...",
    logging: "正在联结专有中介代理握手协议...",
    confirmed_title: "专享礼宾预约已登记",
    confirmed_msg: "您的礼宾中介专属委托已安全登记成功。为了确保您的贵宾特权、优先权及协议价不被覆盖，请不要绕过平台直接联系商户，点击下方专属通道完成确认：",
    via_whatsapp: "通过 WhatsApp 专线发送",
    via_instagram: "通过 Instagram 私信发送",
    via_call: "发起私密电话确认",
    close: "返回浏览",
    warning: "若绕过中介代理自行直接联系商家，将无法享受平台提供的贵宾级增值待遇。",
    temp_gastronomy: [
      "申请贵宾专属桌位预订",
      "安排定制主厨品鉴菜单",
      "咨询奢华VIP专座空位"
    ],
    temp_medical: [
      "协调优先尊享面诊时间段",
      "申请高管治疗方案预先审核",
      "安排机场到医疗中心的豪华接送"
    ],
    temp_default: [
      "预约私人专属VIP导览服务",
      "安排专业多语种高端随行翻译",
      "预订奢华礼宾专车接送服务"
    ]
  }
};

export const getConciergePhone = (rec: any): string => {
  return "+381 62 187 3260"; // All concierge inquiries shall go to WhatsApp account +381 62 187 3260
};

export const getCompactTransportIndicator = (transportStr: string, lang: string): string => {
  if (!transportStr) return "🚗 Car Recommended";
  const lower = transportStr.toLowerCase();
  
  if (lower.includes("train") || lower.includes("soko")) {
    if (lang === 'sr') return "🚆 Voz dostupan";
    if (lang === 'zh') return "🚆 火车可达";
    return "🚆 Accessible by Train";
  }
  if (lower.includes("taxi") || lower.includes("rideshare") || lower.includes("cargo") || lower.includes("foot") || lower.includes("walking") || lower.includes("tram")) {
    if (lang === 'sr') return "🚕 Preporučen taksi";
    if (lang === 'zh') return "🚕 推荐打车";
    return "🚕 Taxi Recommended";
  }
  if (lang === 'sr') return "🚗 Preporučen auto";
  if (lang === 'zh') return "🚗 建议自驾";
  return "🚗 Car Recommended";
};

const DETAIL_UI_T: Record<string, any> = {
  en: {
    ask_concierge: "Ask IDEMO Concierge",
    add_to_plan: "SAVE TO MY EVENT PLANNER",
    added_to_plan: "Saved to My Event Planner",
    pronunciation_title: "Local Name & Pronunciation",
    prep_title: "Preparation & Etiquette",
    anti_advice_title: "Local Insights & Advice",
    transit_title: "Logistics & Getting There",
    companions_title: "Nearby Discoveries",
    feedback_title: "Calibrate Your Concierge",
    history_title: "History & Cultural Context",
    show_more: "Expand",
    show_less: "Collapse"
  },
  sr: {
    ask_concierge: "Pitaj IDEMO konsijerža",
    add_to_plan: "SAČUVAJ U MOJ PLANER DOGAĐAJA",
    added_to_plan: "Sačuvano u planer",
    pronunciation_title: "Lokalni naziv i izgovor",
    prep_title: "Priprema i bonton",
    anti_advice_title: "Lokalni uvid i saveti",
    transit_title: "Logistika i dolazak",
    companions_title: "Okolna otkrića",
    feedback_title: "Kalibrišite vašeg konsijerža",
    history_title: "Istorija i kulturni kontekst",
    show_more: "Prikaži više",
    show_less: "Prikaži manje"
  },
  zh: {
    ask_concierge: "联系 IDEMO 礼宾部",
    add_to_plan: "保存到我的活动计划器",
    added_to_plan: "已保存到活动计划器",
    pronunciation_title: "本地名称与发音",
    prep_title: "出行准备与当地礼仪",
    anti_advice_title: "行家本地洞察",
    transit_title: "交通物流与抵达指引",
    companions_title: "周边探索与发现",
    feedback_title: "校准您的私人礼宾",
    history_title: "历史与文化背景",
    show_more: "展开详情",
    show_less: "收起详情"
  }
};

function AccordionSection({ 
  id,
  icon, 
  title, 
  preview, 
  isOpen, 
  onToggle, 
  children 
}: { 
  id: string;
  icon: React.ReactNode; 
  title: string; 
  preview: string; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#FAF9F5]/40 border border-border-main rounded-2.5xl overflow-hidden transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5.5 text-left active:bg-[#FAF9F5] transition-colors focus:outline-none focus:ring-1 focus:ring-accent-red/20 min-h-[60px] cursor-pointer"
        aria-expanded={isOpen}
        id={`accordion-trigger-${id}`}
      >
        <div className="flex items-start gap-4 pr-2">
          <div className="text-[22px] shrink-0 mt-0.5 text-[#1C1E18]">{icon}</div>
          <div className="space-y-1">
            <span className="text-[15.5px] uppercase tracking-wider text-brand-charcoal font-black block leading-snug">
              {title}
            </span>
            {!isOpen && (
              <p className="text-[13px] text-[#4C4E43] leading-relaxed font-semibold mt-0.5">
                {preview}
              </p>
            )}
          </div>
        </div>
        <ChevronRight 
          className={`size-5 text-brand-charcoal/65 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90 text-accent-red opacity-100' : ''}`} 
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <div className="p-5.5 pt-1 border-t border-border-main/40">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getQuickFacts(rec: any, lang: string) {
  const cat = (rec.category || '').toLowerCase();
  const id = rec.id ? String(rec.id) : '';
  const facts: Array<{ label: string; value: string; iconElement: React.ReactNode }> = [];

  const isSr = lang === 'sr';
  const isZh = lang === 'zh';

  // 1. Typical Duration: maps to rec.duration
  if (rec.duration) {
    facts.push({
      label: isSr ? 'Trajanje' : isZh ? '建议时长' : 'Typical Duration',
      value: getLocalizedValue(rec, 'duration', lang) || rec.duration,
      iconElement: <Clock size={18} />
    });
  }

  // 2. Indoor / Outdoor
  const isOutdoor = cat.includes('nature') || id === '1' || id === '3' || id === '4' || id === '29';
  facts.push({
    label: isSr ? 'Ambijent' : isZh ? '环境' : 'Indoor/Outdoor',
    value: isOutdoor 
      ? (isSr ? 'Na otvorenom' : isZh ? '户外环境' : 'Outdoor') 
      : (isSr ? 'Zatvoren prostor' : isZh ? '室内空间' : 'Indoor'),
    iconElement: isOutdoor ? <Compass size={18} /> : <HomeIcon size={18} />
  });

  // 3. Best Time to Visit
  let bestTimeVal = isSr ? 'Tokom cele godine' : isZh ? '全年皆宜' : 'Year-round';
  if (id === '1') {
    bestTimeVal = isSr ? 'Maj – Septembar' : isZh ? '5月至9月' : 'May – September';
  } else if (cat.includes('nature')) {
    bestTimeVal = isSr ? 'Proleće / Leto' : isZh ? '春季与夏季' : 'Spring / Summer';
  } else if (cat.includes('gastronomy') || cat.includes('clubbing')) {
    bestTimeVal = isSr ? 'Kasno popodne / Veče' : isZh ? '傍晚或夜间' : 'Evening / Night';
  }
  facts.push({
    label: isSr ? 'Najbolje vreme' : isZh ? '最佳时间' : 'Best Time',
    value: bestTimeVal,
    iconElement: <CalendarIcon size={18} />
  });

  // 4. Reservations Recommended
  const needsReservation = cat.includes('gastronomy') || id === '10' || id === '11' || cat.includes('medical');
  if (needsReservation) {
    facts.push({
      label: isSr ? 'Rezervacija' : isZh ? '预订要求' : 'Reservations',
      value: isSr ? 'Preporučuje se' : isZh ? '建议预订' : 'Recommended',
      iconElement: <Sparkles size={18} />
    });
  }

  // 5. Cash / Card
  const isCashOnly = id === '1' || id === '13' || id === '18';
  facts.push({
    label: isSr ? 'Plaćanje' : isZh ? '支付方式' : 'Payment',
    value: isCashOnly 
      ? (isSr ? 'Samo keš' : isZh ? '仅限现金' : 'Cash Only') 
      : (isSr ? 'Kartica / Keš' : isZh ? '刷卡/现金' : 'Cards & Cash'),
    iconElement: <CreditCard size={18} />
  });

  // 6. Accessibility
  const isRugged = id === '1' || id === '3' || id === '4' || id === '18';
  facts.push({
    label: isSr ? 'Pristup' : isZh ? '无障碍通行' : 'Accessibility',
    value: isRugged 
      ? (isSr ? 'Težak teren' : isZh ? '部分崎岖' : 'Rugged')
      : (isSr ? 'Pristupačno' : isZh ? '无障碍' : 'Accessible'),
    iconElement: <CheckCircle size={18} />
  });

  // 7. Family Friendly
  if (!cat.includes('clubbing')) {
    facts.push({
      label: isSr ? 'Porodično' : isZh ? '家庭友好' : 'Family Friendly',
      value: isSr ? 'Da' : isZh ? '适合家庭' : 'Yes',
      iconElement: <Users size={18} />
    });
  }

  // 8. Pet Friendly
  const isPetFriendly = cat.includes('nature') || cat.includes('travel') || id === '29';
  if (isPetFriendly) {
    facts.push({
      label: isSr ? 'Ljubimci' : isZh ? '宠物友好' : 'Pet Friendly',
      value: isSr ? 'Dozvoljeno' : isZh ? '欢迎' : 'Allowed',
      iconElement: <Heart size={18} />
    });
  }

  return facts;
}

function getConciergeButtonText(rec: any, lang: string) {
  const cat = (rec.category || '').toLowerCase();
  const title = (getLocalizedValue(rec, 'title', lang) || rec.title || '').toLowerCase();
  
  const isSr = lang === 'sr';
  const isZh = lang === 'zh';

  if (cat.includes('gastronomy') || title.includes('winery') || title.includes('restoran')) {
    if (isSr) return 'Pitaj o ovom restoranu';
    if (isZh) return '咨询此餐厅及预订';
    return 'Inquire on this dining';
  }
  if (cat.includes('wellbeing') || cat.includes('medical') || title.includes('spa') || title.includes('banja')) {
    if (isSr) return 'Konsultuj se o wellnessu';
    if (isZh) return '咨询此康养与疗愈计划';
    return 'Consult on this wellness';
  }
  if (cat.includes('nature') || title.includes('hike') || title.includes('meanders') || title.includes('gorge') || title.includes('trail')) {
    if (isSr) return 'Pitaj o ovoj stazi/hike-u';
    if (isZh) return '咨询此户外与远足建议';
    return 'Ask about this hike';
  }
  if (cat.includes('history') || cat.includes('culture') || title.includes('museum') || title.includes('muzej') || title.includes('monastery') || title.includes('manastir')) {
    if (isSr) return 'Pitaj o ovom istorijskom dragulju';
    if (isZh) return '咨询此历史地标深度游';
    return 'Consult on this history';
  }
  
  // General Fallback
  if (isSr) return 'Pitaj konsijerža o ovome';
  if (isZh) return '咨询专属礼宾助理';
  return 'Inquire on this discovery';
}

function DetailsCTA({ 
  language, 
  recommendation, 
  isAdding, 
  onAdd, 
  detailT, 
  idPrefix 
}: { 
  language: string; 
  recommendation: any; 
  isAdding: boolean; 
  onAdd: () => void; 
  detailT: any;
  idPrefix: string;
}) {
  return (
    <div className="w-full select-none">
      <motion.button
        disabled={isAdding}
        onClick={onAdd}
        whileTap={{ y: 2 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.14 }}
        className={`w-full h-13 rounded-2xl bg-accent-red hover:bg-accent-red/90 text-white font-bold uppercase text-[12px] xs:text-[13px] sm:text-[14px] tracking-wider transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 px-4 border border-accent-red/15 active:shadow-inner ${
          isAdding ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        id={`${idPrefix}-add-to-plan`}
        style={{ touchAction: 'manipulation' }}
      >
        {isAdding ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <CalendarIcon size={15} className="flex-shrink-0" />
            <span className="truncate whitespace-nowrap">{detailT.add_to_plan}</span>
          </>
        )}
      </motion.button>
    </div>
  );
}

function DetailsScreen({ recommendation, isLiked, onToggleLike, onBack, onSchedule, onNavigate, onRemove, language, rating, onSaveRating, vibeSettings, onSelectRec, lowSignalMode, allRecommendations, isAdminPreview = false, onConfirmAccuracy }: any) {
  const [expanded, setExpanded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [activeFactIndex, setActiveFactIndex] = useState(0);
  const factCarouselRef = React.useRef<HTMLDivElement>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const toastTimeoutRef = React.useRef<any>(null);

  const handleScroll = (e: any) => {
    if (e.target.scrollTop > 320) {
      setScrolledPast(true);
    } else {
      setScrolledPast(false);
    }
  };

  const detailT = DETAIL_UI_T[language] || DETAIL_UI_T['en'];
  const [copiedShare, setCopiedShare] = useState(false);
  const [showConcierge, setShowConcierge] = useState(false);
  const [inquirySuffix, setInquirySuffix] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [conciergeStep, setConciergeStep] = useState<'form' | 'submitting' | 'confirmed'>('form');

  const generateInquirySuffix = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    if (showConcierge) {
      setInquirySuffix(generateInquirySuffix());
    }
  }, [showConcierge]);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [instagramCopied, setInstagramCopied] = useState(false);
  const [callCopied, setCallCopied] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [showAssistanceChannels, setShowAssistanceChannels] = useState(false);
  const [assistanceCopied, setAssistanceCopied] = useState<string | null>(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showDriverCard, setShowDriverCard] = useState(false);
  const [taxiCopied, setTaxiCopied] = useState(false);

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isResourceCached = React.useMemo(() => {
    if (!recommendation) return false;
    const path = recommendation.image || '';
    // Standard static images packaged locally in assets are 100% pre-cached offline assets.
    const isLocalAsset = path.startsWith('/src/assets/images/') || path.startsWith('/assets/images/') || path.startsWith('assets/images/');
    const isStandardId = recommendation.id && !recommendation.id.toString().startsWith('cur_');
    return !!(isLocalAsset || isStandardId);
  }, [recommendation]);

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const fT = FEEDBACK_TRANSLATIONS[language] || FEEDBACK_TRANSLATIONS['en'];

  const nearbyCompanions = React.useMemo(() => {
    if (!recommendation.coordinates) return [];
    const sourceLat = recommendation.coordinates.lat;
    const sourceLng = recommendation.coordinates.lng;

    const allRecs = allRecommendations || [];
    return allRecs
      .filter((r: any) => r.id !== recommendation.id && r.coordinates)
      .map((r) => {
        const dist = calculateDistance(sourceLat, sourceLng, r.coordinates!.lat, r.coordinates!.lng);
        let mode: 'walking' | 'driving' = dist <= 1.5 ? 'walking' : 'driving';
        let mins = 0;
        if (mode === 'walking') {
          mins = Math.round((dist / 5) * 60);
          if (mins < 2) mins = 2;
        } else {
          mins = Math.round((dist / 40) * 60 + 2);
          if (mins < 3) mins = 3;
        }
        return {
          ...r,
          distance: dist,
          transitMins: mins,
          transitMode: mode
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);
  }, [recommendation, language]);

  const handleToggleTag = (tagId: string) => {
    if (!rating) return;
    const currentTags = rating.tags || [];
    const nextTags = currentTags.includes(tagId) 
      ? currentTags.filter((t: string) => t !== tagId)
      : [...currentTags, tagId];
    onSaveRating(rating.vibe, nextTags);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setTimeout(() => {
      onSchedule(new Date().toISOString(), true);
      setIsAdding(false);
      setShowSaveToast(true);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = setTimeout(() => {
        setShowSaveToast(false);
      }, 5000);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 32, stiffness: 320 }}
      onScroll={handleScroll}
      className="absolute inset-0 bg-brand-bg z-[100] flex flex-col overflow-y-auto overflow-x-hidden pb-32 no-scrollbar"
    >
      <AnimatePresence>
        {copiedShare && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 bg-[#2D3025] border border-[#2D3025] text-[#FAF9F5] px-4 py-2 bg-opacity-95 backdrop-blur-md rounded-full shadow-xl z-[150] flex items-center gap-2 text-[10px] font-black uppercase tracking-wider select-none font-sans"
          >
            <Check size={12} className="text-emerald-500" />
            <span>{language === 'sr' ? 'PREPORUKA KOPIRANA!' : 'RECOMMENDATION COPIED!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative h-[38vh]">
        {lowSignalMode ? (
          <div className="w-full h-full bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center select-none border-b border-border-main">
            <span className="text-[32px] mb-3 font-serif opacity-35 text-[#1E2E20]">✦</span>
            <span className="text-xl font-serif text-brand-charcoal max-w-xs leading-tight">{getLocalizedValue(recommendation, 'title', language)}</span>
            <span className="text-[8px] font-mono tracking-wider text-[#8C8A7D] uppercase mt-3 bg-[#EAE8DF]/50 px-3 py-1 rounded-full border border-border-main/20">Media Preserved • Low Signal Mode</span>
          </div>
        ) : isAdminPreview ? (
          <LazyImage 
            src={recommendation.image} 
            alt={getLocalizedValue(recommendation, 'title', language)} 
            className="w-full h-full object-cover" 
            isAdminPreview={true}
          />
        ) : (
          <motion.img 
            layoutId={`img-${recommendation.id}`}
            src={resolveImage(recommendation.image)} 
            alt={getLocalizedValue(recommendation, 'title', language)} 
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
        
        <header className="absolute top-10 left-0 right-0 px-8 flex justify-between items-center z-30 pointer-events-auto">
          <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-black/25 backdrop-blur-3xl flex items-center justify-center text-white border border-white/30 active:scale-90 transition-all cursor-pointer">
            <ChevronRight className="rotate-180" size={22} />
          </button>

          <div className="flex items-center gap-2.5">
            {recommendation.badge && (
              <PremiumBadge type={recommendation.badge} onClick={() => setShowPartnerModal(true)} />
            )}
            
            {/* Native Share Sheet Trigger */}
            <button
              onClick={async () => {
                const title = getLocalizedValue(recommendation, 'title', language);
                const desc = getLocalizedValue(recommendation, 'shortDescription', language) || '';
                const loc = getLocalizedValue(recommendation, 'location', language);
                const coords = recommendation.coordinates ? `${recommendation.coordinates.lat},${recommendation.coordinates.lng}` : '';
                const shareText = `${title}\n${desc}\n📍 ${loc}\n🛰️ Coordinates: ${coords}`;
                
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: title,
                      text: shareText,
                      url: window.location.href
                    });
                    triggerHaptic(30);
                  } catch (err) {
                    console.log('Share canceled/failed', err);
                  }
                } else {
                  try {
                    await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
                    setCopiedShare(true);
                    triggerHaptic(10);
                    setTimeout(() => setCopiedShare(false), 2000);
                  } catch (err) {
                    console.error('Copy failed', err);
                  }
                }
              }}
              className="w-12 h-12 rounded-2xl bg-black/25 backdrop-blur-3xl flex items-center justify-center text-white border border-white/30 active:scale-90 transition-all cursor-pointer"
              id="native-share-recommendation"
              title="Share Recommendation"
            >
              <Share2 size={20} />
            </button>

            <button 
              onClick={onToggleLike}
              className={`w-12 h-12 rounded-2xl backdrop-blur-3xl flex items-center justify-center shadow-2xl transition-all border active:scale-90 cursor-pointer ${
                rating?.vibe === 'like'
                  ? 'bg-accent-red/20 border-accent-red/50 text-[#FFAAAA] shadow-[0_0_15px_rgba(138,31,31,0.35)]'
                  : rating?.vibe === 'intrigue'
                  ? 'bg-yellow-500/20 border-yellow-500/50 text-[#FFE57F] shadow-[0_0_15px_rgba(234,179,8,0.35)]'
                  : isLiked 
                  ? 'bg-accent-red border-accent-red text-white' 
                  : 'bg-black/25 border-white/30 text-white'
              }`}
            >
              <Heart 
                size={20} 
                fill={
                  rating?.vibe === 'like'
                    ? '#8A1F1F'
                    : rating?.vibe === 'intrigue'
                    ? '#EAB308'
                    : isLiked 
                    ? 'currentColor' 
                    : 'none'
                }
                className="transition-all duration-300"
              />
            </button>
          </div>
        </header>

        <div className="absolute bottom-10 left-8 right-8">
           <div className="flex gap-2 items-center mb-2">
             <motion.div 
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="inline-flex px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-white border border-white/20"
             >
                <span className="text-[8px] uppercase font-black tracking-[0.2em]">{formatCategory(recommendation.category, t)}</span>
             </motion.div>
           </div>
           <motion.h2 
             initial={{ opacity: 0, y: 15 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="text-2xl sm:text-3xl md:text-4xl font-serif text-white tracking-tight leading-tight"
           >
             {getLocalizedValue(recommendation, 'title', language)}
           </motion.h2>
        </div>
      </div>

      <div className="px-8 pt-10 pb-10 -mt-6 bg-brand-bg rounded-t-[48px] relative z-20 space-y-6 flex-1 border-t border-border-main">
        {/* KEY METADATA BAR (JOURNEY TIME, ESTIMATED COST, DISTANCE, BEST TRANSPORT) */}
        {(() => {
          const isCalibrated = recommendation.coordinates && typeof recommendation.coordinates.lat === 'number' && typeof recommendation.coordinates.lng === 'number' && recommendation.coordinates.lat !== 0 && recommendation.coordinates.lng !== 0 && !(recommendation.id && recommendation.id.toString().startsWith('draft-'));
          const recCoords = recommendation.coordinates || { lat: 44.8154, lng: 20.4607 };
          const repSquare = BASE_HUBS?.find(h => h.id === 'republic_square') || { coordinates: { lat: 44.8154, lng: 20.4607 } };
          const dist = calculateDistance(repSquare.coordinates.lat, repSquare.coordinates.lng, recCoords.lat, recCoords.lng);
          return (
            <div className="grid grid-cols-4 gap-1 sm:gap-2 border-y border-border-main/50 py-5 mt-4 text-center px-0.5">
              {/* 1. Journey Time */}
              <div className="flex flex-col items-center justify-between min-h-[74px] leading-tight">
                <Clock size={18} className="text-accent-red mb-2 shrink-0" />
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[8.5px] uppercase tracking-[0.12em] text-[#5C5A4D] font-black leading-none">{t.journey_time}</span>
                  <span className="text-[11px] sm:text-[12px] font-extrabold text-brand-charcoal break-words leading-tight px-0.5 max-w-full">
                    {getLocalizedValue(recommendation, 'duration', language) || recommendation.duration}
                  </span>
                </div>
              </div>

              {/* 2. Estimated Cost */}
              <div className="flex flex-col items-center justify-between min-h-[74px] border-l border-border-main/30 leading-tight">
                <span className="text-[17px] font-sans font-black text-accent-red mb-1.5 shrink-0 leading-none">€</span>
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[8.5px] uppercase tracking-[0.12em] text-[#5C5A4D] font-black leading-none">{t.exp_investment}</span>
                  <span className="text-[11px] sm:text-[12px] font-extrabold text-brand-charcoal break-words leading-tight px-0.5 max-w-full">
                    {getLocalizedValue(recommendation, 'estimatedCost', language) || recommendation.estimatedCost}
                  </span>
                </div>
              </div>

              {/* 3. Distance */}
              <div className="flex flex-col items-center justify-between min-h-[74px] border-l border-border-main/30 leading-tight">
                <MapPin size={18} className="text-accent-teal mb-2 shrink-0" />
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[8.5px] uppercase tracking-[0.12em] text-[#5C5A4D] font-black leading-none">
                    {language === 'sr' ? 'Udaljenost' : language === 'zh' ? '距市中心' : 'Distance'}
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-extrabold text-brand-charcoal leading-tight">
                    {isCalibrated ? `${dist.toFixed(1)} km` : '—'}
                  </span>
                </div>
              </div>

              {/* 4. Best Transport */}
              <div className="flex flex-col items-center justify-between min-h-[74px] border-l border-border-main/30 leading-tight">
                <Navigation size={18} className="text-accent-red mb-2 shrink-0" />
                <div className="flex flex-col items-center gap-1 w-full">
                  <span className="text-[8.5px] uppercase tracking-[0.12em] text-[#5C5A4D] font-black leading-none">
                    {language === 'sr' ? 'Prevoz' : language === 'zh' ? '最佳交通' : 'Transport'}
                  </span>
                  <span className="text-[11px] sm:text-[12px] font-extrabold text-brand-charcoal break-words leading-tight px-0.5 max-w-full">
                    {getCompactTransportIndicator(recommendation.preferredTransport, language)}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* BRIEF EDITORIAL SUMMARY & CONVERSION CTAs */}
        <div className="space-y-4 pt-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-[1.5px] bg-accent-red" />
              <h3 className="text-[11px] uppercase tracking-[0.3em] text-[#6C6A5D] font-black">{t.the_curation}</h3>
            </div>
            {(() => {
              const fullText = getLocalizedValue(recommendation, 'longDescription', language) || '';
              const wordCount = fullText.split(/\s+/).length;
              const shouldTruncate = wordCount > 65;
              const displayedText = shouldTruncate && !isNotesExpanded
                ? fullText.split(/\s+/).slice(0, 65).join(' ') + '...'
                : fullText;
              return (
                <div className="space-y-4">
                  <p className="text-brand-charcoal leading-loose font-serif text-[17.5px] tracking-tight italic font-medium">
                    {displayedText}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => {
                        triggerHaptic(30);
                        setIsNotesExpanded(!isNotesExpanded);
                      }}
                      className="text-[#8A1F1F] hover:text-[#8A1F1F]/80 font-extrabold uppercase text-[12px] tracking-widest transition-all flex items-center gap-1 cursor-pointer py-1.5"
                      id="toggle-curator-notes"
                    >
                      <span>
                        {isNotesExpanded 
                          ? (language === 'sr' ? 'Prikaži manje' : language === 'zh' ? '收起策展笔记' : 'Collapse Notes') 
                          : (language === 'sr' ? 'Pročitaj cele kustoske beleške' : language === 'zh' ? '阅读完整策展笔记' : 'Read Full Curator Notes')
                        }
                      </span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isNotesExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          {/* SUBTLE CONCIERGE INVITATION */}
          <div className="pt-2 pb-1 border-t border-[#E7E4DB]/40 mt-3 text-left">
            <p className="text-[12px] font-sans italic text-[#6C6A5D] leading-relaxed">
              {language === 'sr' 
                ? 'Treba vam pomoć pri odluci? Vaš IDEMO konsijerž vam može pomoći oko usklađivanja vremena, prevoza, rezervacija i kreiranja personalizovanog plana puta.'
                : language === 'zh'
                ? '需要决策帮助吗？您的 IDEMO 私人礼宾可为您协助安排时间、交通、预订并量身定制专属行程。'
                : 'Need help deciding? Your IDEMO Concierge can assist with timing, transport, reservations and creating a personalised itinerary.'
              }
            </p>
          </div>

          {/* QUICK FACTS STRIP */}
          <div className="py-2.5 relative">
            <div 
              ref={factCarouselRef}
              onScroll={() => {
                if (factCarouselRef.current) {
                  const { scrollLeft, scrollWidth, clientWidth } = factCarouselRef.current;
                  const totalItems = getQuickFacts(recommendation, language).length;
                  if (totalItems > 1) {
                    const scrollRatio = scrollLeft / (scrollWidth - clientWidth || 1);
                    const idx = Math.min(
                      totalItems - 1,
                      Math.max(0, Math.round(scrollRatio * (totalItems - 1)))
                    );
                    setActiveFactIndex(idx);
                  }
                }
              }}
              className="flex gap-3.5 overflow-x-auto pb-3.5 no-scrollbar border-y border-[#E7E4DB]/40 py-4 scroll-smooth snap-x snap-mandatory"
            >
              {getQuickFacts(recommendation, language).map((fact, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 shrink-0 bg-[#FAF9F5]/90 border border-[#E7E4DB]/60 rounded-2xl px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] snap-center select-none w-[165px] min-w-[165px]"
                >
                  <span className="text-[#8C8A7D] shrink-0">{fact.iconElement}</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-extrabold mb-0.5">{fact.label}</span>
                    <span className="text-[13px] font-black text-brand-charcoal">{fact.value}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-2">
              {getQuickFacts(recommendation, language).map((_, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    triggerHaptic(5);
                    if (factCarouselRef.current) {
                      const totalItems = getQuickFacts(recommendation, language).length;
                      const scrollWidth = factCarouselRef.current.scrollWidth;
                      const clientWidth = factCarouselRef.current.clientWidth;
                      const maxScrollLeft = scrollWidth - clientWidth;
                      const targetScroll = (idx / (totalItems - 1 || 1)) * maxScrollLeft;
                      factCarouselRef.current.scrollTo({ left: targetScroll, behavior: 'smooth' });
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeFactIndex === idx ? 'w-4 bg-[#8A1F1F]' : 'w-1.5 bg-brand-charcoal/20 hover:bg-brand-charcoal/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {recommendation.equivalents?.[language] && (
            <div className="pt-3 border-t border-[#E7E4DB]/40">
              <div className="flex items-center gap-2 mb-1">
                <Globe size={11} className="text-[#8A1F1F] opacity-80" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8C8A7D] font-black">{t.local_equivalent}</span>
              </div>
              <p className="text-brand-charcoal font-serif text-[15px] leading-tight font-medium">
                {recommendation.equivalents[language]}
              </p>
            </div>
          )}

          {/* FIRST VIEWPORT CONVERSION ACTIONS */}
          <div className="pt-3 w-full">
            <DetailsCTA
              language={language}
              recommendation={recommendation}
              isAdding={isAdding}
              onAdd={handleAdd}
              detailT={detailT}
              idPrefix="first-viewport"
            />
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE EXPANDABLE PANELS */}
        <div className="space-y-4 pt-4 border-t border-border-main/70">
          {/* 1. LOGISTICS & GETTING THERE ACCORDION */}
          <AccordionSection
            id="transit"
            icon="🚖"
            title={detailT.transit_title}
            preview={(() => {
              const isCalibrated = recommendation.coordinates && typeof recommendation.coordinates.lat === 'number' && typeof recommendation.coordinates.lng === 'number' && recommendation.coordinates.lat !== 0 && recommendation.coordinates.lng !== 0 && !(recommendation.id && recommendation.id.toString().startsWith('draft-'));
              if (!isCalibrated) {
                if (language === 'sr') {
                  return 'Tranzitni podaci: Nisu još kalibrisani za ovaj nacrt.';
                } else if (language === 'zh') {
                  return '交通数据：此草案尚未校准。';
                } else {
                  return 'Transit data: Not yet calibrated for this draft.';
                }
              }
              const recCoords = recommendation.coordinates || { lat: 44.8154, lng: 20.4607 };
              const repSquare = BASE_HUBS?.find(h => h.id === 'republic_square') || { coordinates: { lat: 44.8154, lng: 20.4607 } };
              const dist = calculateDistance(repSquare.coordinates.lat, repSquare.coordinates.lng, recCoords.lat, recCoords.lng);
              const taxi = getTaxiEstimation(dist);
              
              if (language === 'sr') {
                return `Taksi: ~${taxi.rsd} RSD (~${Math.round(dist * 2.5 + 4)} min). Udaljenost: ${dist.toFixed(1)} km.`;
              } else if (language === 'zh') {
                return `出租车: ~${taxi.rsd} RSD (~${Math.round(dist * 2.5 + 4)} 分钟)。距离老城: ${dist.toFixed(1)} 公里。`;
              } else {
                return `Taxi: ~${taxi.rsd} RSD (~${Math.round(dist * 2.5 + 4)} min). Distance: ${dist.toFixed(1)} km from Center.`;
              }
            })()}
            isOpen={activeAccordion === 'transit'}
            onToggle={() => setActiveAccordion(activeAccordion === 'transit' ? null : 'transit')}
          >
            <div className="space-y-4 py-1.5">
              {/* Compact Grid with Travel Time & Primary Transport */}
              <div className="grid grid-cols-2 gap-3">
                <DetailStatSmall 
                  icon={<MapIcon size={14} />} 
                  label={t.travel_time} 
                  value={getLocalizedValue(recommendation, 'travelTime', language) || recommendation.travelTime} 
                />
                <DetailStatSmall 
                  icon={<Compass size={14} />} 
                  label={t.primary_transport} 
                  value={getCompactTransportIndicator(recommendation.preferredTransport, language)} 
                />
                {recommendation.website && (
                  <DetailStatSmall 
                    icon={<Globe size={14} />} 
                    label={t.website} 
                    value={t.visit_website || 'Visit Website'} 
                    onClick={() => {
                      setSelectedTemplate(CONCIERGE_T[language]?.temp_default?.[0] || 'Inquire details');
                      setConciergeStep('form');
                      setShowConcierge(true);
                    }}
                  />
                )}
                {recommendation.phone && (
                  <DetailStatSmall 
                    icon={<Phone size={14} />} 
                    label={`${t.phone || 'Phone'} (VIP)`} 
                    value={getConciergePhone(recommendation)} 
                    link={`tel:${getConciergePhone(recommendation).replace(/\s+/g, '').replace('+3810', '+381')}`}
                  />
                )}
              </div>

              {/* Walkability Info Box inside Transit Accordion */}
              {(() => {
                const walkInfo = getRecommendationWalkability(recommendation, language);
                return (
                  <div className="bg-white border border-[#E7E4DB] rounded-2xl p-4 flex gap-3.5 items-start shadow-sm">
                    <div className="w-9 h-9 rounded-xl bg-accent-teal/10 text-accent-teal flex items-center justify-center shrink-0 font-sans text-base">
                      🚶‍♂️
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-[#8C8A7D] font-extrabold block">{language === 'sr' ? 'PODACI O PEŠAČENJU' : 'WALKABILITY & TERRAIN'}</span>
                      <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-brand-charcoal font-bold leading-none">
                        <span>{walkInfo.walkingTime}</span>
                        <span className="text-[#DDDCCF]">•</span>
                        <span className="italic">{walkInfo.terrain}</span>
                        <span className="text-[#DDDCCF]">•</span>
                        <span className="text-accent-red font-semibold">{walkInfo.elevation}</span>
                      </div>
                      <p className="text-[11.5px] text-[#5C5A4D] font-medium leading-tight pt-0.5">
                        {language === 'sr' ? 'Prohodnost pešaka:' : 'Pedestrian zone friendliness:'} <span className="font-bold text-[#155e5b]">{walkInfo.friendliness}</span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Driver Direct Flashcard button inside Transit Accordion */}
              <button
                onClick={() => {
                  triggerHaptic(60);
                  setShowDriverCard(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white rounded-2xl transition-all shadow-md active:scale-99 select-none group border border-brand-charcoal/30 min-h-[52px]"
                id="show-taxi-address-card-accordion"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">🚖</span>
                  <div className="text-left">
                    <span className="block text-[12px] font-black uppercase tracking-widest leading-none mb-0.5">
                      {language === 'sr' ? 'TAKSI KARTA VOZAČA' : language === 'zh' ? '出租车向导司机卡片' : 'CAB DRIVER CARD'}
                    </span>
                    <span className="text-[9px] text-white/50 block tracking-normal font-sans">
                      {language === 'sr' ? 'Prikažite direktno taksisti' : 'Hand screen directly to taxi driver'}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase bg-white/10 group-hover:bg-white/20 py-1.5 px-3 rounded-xl border border-white/5">
                  {language === 'sr' ? 'OTVORI' : language === 'zh' ? '展示' : 'OPEN'}
                </span>
              </button>

              <LocalTransitCard
                recommendation={recommendation}
                language={language}
              />
            </div>
          </AccordionSection>

          {/* 2. PREPARATION & ETIQUETTE ACCORDION */}
          <AccordionSection
            id="preparation"
            icon="🍷"
            title={detailT.prep_title}
            preview={(() => {
              const cat = (recommendation.category || '').toLowerCase();
              if (cat.includes('gastronomy') || cat.includes('clubbing')) {
                return language === 'sr' 
                  ? "Bonton oblačenja (Smart Casual) • 10% napojnice" 
                  : language === 'zh'
                  ? "着装要求 (时尚休闲) • 标准10%小费"
                  : "Dress code (Smart Casual) • 10% standard gratuity";
              } else if (cat.includes('history') || cat.includes('culture')) {
                return language === 'sr' 
                  ? "Pristojna/manastirska odeća • Tišina se poštuje" 
                  : language === 'zh'
                  ? "庄重/修道院着装 • 保持安静与尊重"
                  : "Sanctuary modest attire • Quiet respect required";
              } else if (cat.includes('wellbeing') || cat.includes('nature')) {
                return language === 'sr' 
                  ? "Udobna sportska odeća • Kupaći kostim za spa" 
                  : language === 'zh'
                  ? "舒适运动衣物 • 准备室内泳装"
                  : "Comfort apparel • Prepare indoor swimwear";
              } else {
                return language === 'sr' 
                  ? "Zaokružite manji račun • Naučite Dobar dan i Hvala" 
                  : language === 'zh'
                  ? "小额账单四舍五入 • 学习简单塞语"
                  : "Round up small checks • Learn Dobar Dan & Hvala";
              }
            })()}
            isOpen={activeAccordion === 'preparation'}
            onToggle={() => setActiveAccordion(activeAccordion === 'preparation' ? null : 'preparation')}
          >
            <div className="space-y-4 py-1.5">
              <PrepEtiquetteGuide
                recommendation={recommendation}
                language={language}
              />
            </div>
          </AccordionSection>

          {/* 3. LOCAL INSIGHTS ACCORDION */}
          <AccordionSection
            id="anti_advice"
            icon="💡"
            title={detailT.anti_advice_title}
            preview={
              language === 'sr' 
                ? "Preispitajte uobičajene zablude i otkrijte kustoske savete" 
                : language === 'zh'
                ? "打破游客偏见与固化设想，看真实行家分析"
                : "Challenge common tourist assumptions with expert local insights"
            }
            isOpen={activeAccordion === 'anti_advice'}
            onToggle={() => setActiveAccordion(activeAccordion === 'anti_advice' ? null : 'anti_advice')}
          >
            <div className="py-1">
              <AntiAdviceSection
                recommendation={recommendation}
                language={language}
              />
            </div>
          </AccordionSection>

          {/* 4. NEARBY DISCOVERIES ACCORDION */}
          {nearbyCompanions.length > 0 && (
            <AccordionSection
              id="companions"
              icon="🧭"
              title={detailT.companions_title}
              preview={
                language === 'sr' 
                  ? `Preporučeni saputnici u krugu od ${(nearbyCompanions[0]?.distance || 0).toFixed(1)} km` 
                  : language === 'zh' 
                  ? `方圆 ${(nearbyCompanions[0]?.distance || 0).toFixed(1)} 公里内的文化探索伴侣` 
                  : `Curated companions within ${(nearbyCompanions[0]?.distance || 0).toFixed(1)} km`
              }
              isOpen={activeAccordion === 'companions'}
              onToggle={() => setActiveAccordion(activeAccordion === 'companions' ? null : 'companions')}
            >
              <div className="space-y-4 py-1.5">
                <div className="grid grid-cols-1 gap-3">
                  {nearbyCompanions.map((comp: any) => {
                    const compTitle = getLocalizedValue(comp, 'title', language);
                    const compDesc = getLocalizedValue(comp, 'shortDescription', language);
                    return (
                      <div 
                        key={comp.id}
                        onClick={() => {
                          triggerHaptic(15);
                          onSelectRec(comp);
                        }}
                        className="p-4 bg-white border border-[#E7E4DB] hover:border-accent-red/30 rounded-2xl transition-all cursor-pointer flex justify-between items-center group shadow-sm active:scale-99"
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase bg-accent-teal/10 text-accent-teal px-2 py-0.5 rounded-md leading-none">
                              {comp.transitMode === 'walking' ? '🚶‍♂️ Walk' : '🚗 Drive'} • {comp.transitMins}m
                            </span>
                          </div>
                          <h4 className="text-[13.5px] font-serif font-black text-brand-charcoal group-hover:text-accent-red transition-colors leading-tight">
                            {compTitle}
                          </h4>
                          <p className="text-[11px] text-[#6C6A5D] leading-relaxed font-medium line-clamp-2">
                            {compDesc}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-brand-charcoal/30 group-hover:text-accent-red transition-all" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionSection>
          )}

          {/* 5. LOCAL PRONUNCIATION & CYRILLIC ACCORDION */}
          {CYRILLIC_DICTIONARY[recommendation.id] && (
            <AccordionSection
              id="pronunciation"
              icon="🗣️"
              title={detailT.pronunciation_title}
              preview={`${CYRILLIC_DICTIONARY[recommendation.id].cyrillic} • ${CYRILLIC_DICTIONARY[recommendation.id].phonetic}`}
              isOpen={activeAccordion === 'pronunciation'}
              onToggle={() => setActiveAccordion(activeAccordion === 'pronunciation' ? null : 'pronunciation')}
            >
              <div className="py-2.5 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 bg-white border border-[#E7E4DB] rounded-2xl p-4 text-center shadow-sm">
                    <span className="block text-[10px] uppercase tracking-wider text-[#8C8A7D] font-extrabold mb-1">
                      {language === 'sr' ? 'LOKALNI NAZIV' : 'LOCAL NAME'}
                    </span>
                    <span className="text-xl font-serif font-black text-brand-charcoal">
                      {CYRILLIC_DICTIONARY[recommendation.id].cyrillic}
                    </span>
                  </div>
                  <div className="flex-1 bg-white border border-[#E7E4DB] rounded-2xl p-4 text-center shadow-sm">
                    <span className="block text-[10px] uppercase tracking-wider text-[#8C8A7D] font-extrabold mb-1">
                      {language === 'sr' ? 'IZGOVOR' : 'PRONUNCIATION'}
                    </span>
                    <span className="text-xl font-sans font-black text-accent-red">
                      {CYRILLIC_DICTIONARY[recommendation.id].phonetic}
                    </span>
                  </div>
                </div>
              </div>
            </AccordionSection>
          )}

          {/* 6. HISTORY / CULTURAL CONTEXT ACCORDION */}
          {(recommendation.category?.toLowerCase() === 'history' || 
            recommendation.category?.toLowerCase() === 'culture' || 
            recommendation.category?.toLowerCase().includes('history') ||
            recommendation.category?.toLowerCase().includes('culture') ||
            recommendation.id === '7' || recommendation.id === '29') && (
            <AccordionSection
              id="history"
              icon="🏛️"
              title={detailT.history_title}
              preview={
                language === 'sr'
                  ? "Saznajte više o istorijskom nasleđu ove beogradske lokacije"
                  : language === 'zh'
                  ? "深入了解此贝尔格莱德地标的丰富历史与人文底蕴"
                  : "Delve into the historic pedigree & Belgrade cultural footprint"
              }
              isOpen={activeAccordion === 'history'}
              onToggle={() => setActiveAccordion(activeAccordion === 'history' ? null : 'history')}
            >
              <div className="p-5 bg-white border border-[#E7E4DB] rounded-2xl shadow-sm space-y-3.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-[#E7E4DB]/50">
                  <span className="text-xl">📜</span>
                  <span className="text-[11px] uppercase tracking-wider text-[#8C8A7D] font-extrabold">
                    {language === 'sr' ? 'ISTORIJSKI ZAPIS' : language === 'zh' ? '历史档案' : 'HISTORICAL PEDIGREE'}
                  </span>
                </div>
                <div className="font-serif italic text-brand-charcoal text-[13.5px] leading-relaxed space-y-2.5">
                  {(() => {
                    const recId = recommendation.id;
                    if (recId === '7' || recommendation.title?.toLowerCase().includes('tesla')) {
                      return language === 'sr' ? (
                        <p>
                          Nikola Tesla, vizionar i genije srpskog porekla, zaveštao je svetu osnove moderne elektrotehnike. Njegov lični arhiv, koji se čuva u ovom beogradskom muzeju, uvršten je u UNESCO-ov registar „Pamćenje sveta” i svedoči o neizmernom doprinosu čovečanstvu.
                        </p>
                      ) : language === 'zh' ? (
                        <p>
                          尼古拉·特斯拉（Nikola Tesla）是塞尔维亚裔科学远见者和发明巨匠。他在该博物馆内保存的私人珍贵档案，已被列入联合国教科文组织（UNESCO）的《世界记忆名录》，见证了他对全人类做出的永恒贡献。
                        </p>
                      ) : (
                        <p>
                          Nikola Tesla, a scientific visionary of Serbian origin, bequeathed the foundations of modern electricity to the world. His personal archive, preserved in this Belgrade museum, is inscribed in UNESCO's Memory of the World Register, witnessing his immortal contribution to humanity.
                        </p>
                      );
                    } else if (recId === '29' || recommendation.title?.toLowerCase().includes('fortress') || recommendation.title?.toLowerCase().includes('kalemegdan')) {
                      return language === 'sr' ? (
                        <p>
                          Beogradska tvrđava (Kalemegdan) predstavlja istorijsko srce grada, svedočeći o preko dva milenijuma sukoba i ponovnog rađanja. Smeštena na ušću Save u Dunav, ova monumentalna vojna fortifikacija branila je granice carstava i služila kao kulturno čvorište Balkana.
                        </p>
                      ) : language === 'zh' ? (
                        <p>
                          贝尔格莱德城堡（卡莱梅格丹）是这座城市的历史中心，见证了两个多世纪的冲突与重生。坐落于萨瓦河与多瑙河的交汇处，这座宏伟的军事要塞曾捍卫了各大帝国的边境，也是巴尔干半岛极其重要的文化枢纽。
                        </p>
                      ) : (
                        <p>
                          The Belgrade Fortress (Kalemegdan) stands as the historical heart of the capital, bearing witness to over two millennia of clashes and rebirths. Situated at the confluence of the Sava and Danube, this monumental fortification guarded imperial borders and served as the cultural hub of the Balkans.
                        </p>
                      );
                    } else {
                      return language === 'sr' ? (
                        <p>
                          Beograd je jedan od najstarijih kontinuirano naseljenih gradova u Evropi. Njegovo istorijsko nasleđe predstavlja raskošnu mešavinu vizantijskih, habzburških, osmanskih i jugoslovenskih uticaja koji stvaraju jedinstven i neponovljiv duh savremenog Beograda.
                        </p>
                      ) : language === 'zh' ? (
                        <p>
                          贝尔格莱德是欧洲最古老的持续有人居住的城市之一。其历史遗产交织着拜占庭、哈布斯堡、奥斯曼以及南斯拉夫的丰富影响，塑造了现代贝城独特、不屈而迷人的性格魅力。
                        </p>
                      ) : (
                        <p>
                          Belgrade is one of the oldest continuously inhabited cities in Europe. Its historical legacy is a rich tapestry of Byzantine, Habsburg, Ottoman, and Yugoslav influences, shaping the unique, resilient, and charming character of modern Belgrade.
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
            </AccordionSection>
          )}
        </div>

        {/* IMPROVE THIS PLACE - CEMS ACCURACY FEEDBACK CONTAINER */}
        {onConfirmAccuracy && (
          <div 
            onClick={() => {
              triggerHaptic(5);
              onConfirmAccuracy();
            }}
            className="border border-accent-red/20 hover:border-accent-red/45 bg-accent-red/[0.02] hover:bg-accent-red/[0.04] p-4.5 rounded-[22px] transition-all duration-300 cursor-pointer text-left select-none group flex items-center justify-between gap-4 mt-2"
          >
            <div className="space-y-1">
              <h4 className="text-[12.5px] font-sans font-black uppercase tracking-wider text-accent-red group-hover:text-accent-red/90 transition-colors">
                {language === 'sr' ? 'Poboljšajte ovo mesto' : language === 'zh' ? '改进此地点' : 'Improve this place'}
              </h4>
              <p className="text-[10.5px] leading-relaxed text-brand-charcoal/65 font-medium">
                {language === 'sr' 
                  ? 'Zastarelo, nejasno, zatvoreno ili vredno dodavanja? Javi nam.' 
                  : language === 'zh' 
                    ? '信息陈旧、不清晰、已关闭或值得补充？请告诉我们。' 
                    : 'Outdated, unclear, closed, or worth adding? Tell us.'}
              </p>
            </div>
            <span className="text-accent-red/40 group-hover:text-accent-red/80 transition-colors shrink-0 text-[18px]">
              ✎
            </span>
          </div>
        )}

        {/* LIGHTWEIGHT FEATURED PARTNER MODAL/INFORMATION SHEET */}
        <AnimatePresence>
          {showPartnerModal && (
            <>
              {/* Backdrop */}
              <motion.div 
                className="fixed inset-0 bg-black/50 backdrop-blur-md z-[600]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPartnerModal(false)}
              />
              {/* Content Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-x-6 top-1/3 max-w-[360px] mx-auto bg-brand-bg rounded-[32px] border border-border-main p-6 z-[610] shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-accent-teal/10 flex items-center justify-center mx-auto text-accent-teal font-black text-lg">
                  ★
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                    {language === 'sr' ? 'Istaknuto partnersko iskustvo' : 'Featured Partner Experience'}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#3A3D32] text-left">
                    {language === 'sr' 
                      ? 'Ovo iskustvo je preporuka našeg istaknutog partnera. Status partnera utiče na vidljivost unutar aplikacije, ali ne garantuje uređivačko uključenje. Ova preporuka ostaje predmet IDEMO kustos-standarda.'
                      : 'This experience is a Featured Partner recommendation. Partner status influences visibility within the app but does not guarantee editorial inclusion. This recommendation remains subject to IDEMO’s curation standards.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPartnerModal(false)}
                  className="w-full h-10 rounded-xl bg-brand-charcoal text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all cursor-pointer"
                >
                  {language === 'sr' ? 'U redu' : 'Acknowledged'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* PREMIUM CONCIERGE VISUAL BOTTOM SHEET */}
        <AnimatePresence>
          {showConcierge && (
            <>
              {/* Backdrop */}
              <motion.div 
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[500]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConcierge(false)}
              />

              {/* Sheet Container */}
              <motion.div 
                className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto bg-[#F6F5F2] border-t border-border-main rounded-t-[36px] z-[510] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              >
                {/* Drag handle */}
                <div className="w-12 h-1.5 bg-[#8C8A7D]/20 rounded-full mx-auto mt-4 shrink-0" />

                <div className="p-6 overflow-y-auto no-scrollbar flex-1 space-y-5">
                  {/* Title Header */}
                  <div className="text-center space-y-1">
                    <h3 className="font-serif text-sm tracking-[0.2em] uppercase font-bold text-accent-red">
                      {CONCIERGE_T[language]?.desk || CONCIERGE_T['en'].desk}
                    </h3>
                    <p className="text-[10px] text-brand-charcoal/40 font-mono">
                      {CONCIERGE_T[language]?.sub || CONCIERGE_T['en'].sub} <span className="font-bold text-brand-charcoal">{getLocalizedValue(recommendation, 'title', language)}</span>
                    </p>
                  </div>

                  {conciergeStep === 'form' && (
                    <div className="space-y-4">
                      {/* Inquiry Reference Badge Container */}
                      <div className="bg-[#EAE8DF]/65 p-3 rounded-2xl border border-border-main flex flex-col items-center justify-center text-center">
                        <span className="text-[12px] uppercase tracking-[0.2em] font-mono text-[#5C5A4D] font-extrabold">
                          {CONCIERGE_T[language]?.inquiry_reference || CONCIERGE_T['en'].inquiry_reference}
                        </span>
                        <span className="text-sm font-mono font-bold text-accent-teal mt-0.5 select-all">
                          IDEMO–REC{recommendation.id}–{inquirySuffix}
                        </span>
                        <span className="text-[11px] text-brand-charcoal/70 mt-1 font-sans">
                          {CONCIERGE_T[language]?.regarding || CONCIERGE_T['en'].regarding}: {getLocalizedValue(recommendation, 'title', language)}
                        </span>
                      </div>

                      {/* Select Quick Templates */}
                      <div className="space-y-2">
                        <label className="text-[13px] uppercase tracking-[0.1em] text-[#5C5A4D] font-bold">
                          {CONCIERGE_T[language]?.select_template || CONCIERGE_T['en'].select_template}
                        </label>
                        <div className="grid gap-2">
                          {(() => {
                            const cat = (recommendation.category || '').toLowerCase();
                            const ct = CONCIERGE_T[language] || CONCIERGE_T['en'];
                            const templates = cat.includes('food') || cat.includes('gastronomy') || cat.includes('clubbing')
                              ? ct.temp_gastronomy
                              : cat.includes('medical') || cat.includes('dental') || cat.includes('wellbeing') || cat.includes('clinic')
                              ? ct.temp_medical
                              : ct.temp_default;
                            return templates.map((tmpl: string) => (
                              <button
                                key={tmpl}
                                onClick={() => setSelectedTemplate(tmpl)}
                                className={`p-4.5 text-[13px] font-semibold rounded-xl border text-left transition-all active:scale-[0.99] min-h-[44px] ${
                                  selectedTemplate === tmpl
                                    ? 'bg-accent-teal/10 border-accent-teal/30 text-[#1E2E20] font-bold'
                                    : 'bg-white border-border-main text-brand-charcoal hover:bg-brand-pearl'
                                }`}
                              >
                                ✦ {tmpl}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* Special Request Specifications Textarea */}
                      <div className="space-y-2">
                        <label className="text-[13px] uppercase tracking-[0.1em] text-[#5C5A4D] font-bold">
                          {CONCIERGE_T[language]?.custom_details || CONCIERGE_T['en'].custom_details}
                        </label>
                        <textarea
                          rows={3}
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          placeholder={CONCIERGE_T[language]?.placeholder || CONCIERGE_T['en'].placeholder}
                          className="w-full p-4 text-[13px] bg-white border border-border-main rounded-2xl focus:outline-none focus:border-accent-teal font-sans leading-relaxed text-brand-charcoal transition-all placeholder:text-[#5C5A4D]/60"
                        />
                      </div>

                      {/* Confirm Dispatch Request */}
                      <button
                        onClick={() => {
                          setConciergeStep('submitting');
                          setSubmissionProgress(0);
                          const interval = setInterval(() => {
                            setSubmissionProgress((p) => {
                              if (p >= 100) {
                                clearInterval(interval);
                                setConciergeStep('confirmed');
                                return 100;
                              }
                              return p + 5;
                            });
                          }, 100);
                        }}
                        className="w-full h-14 rounded-2xl bg-brand-charcoal text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                      >
                        <ShieldCheck size={16} className="text-accent-teal" />
                        <span>{CONCIERGE_T[language]?.despatch || CONCIERGE_T['en'].despatch}</span>
                      </button>
                    </div>
                  )}

                  {conciergeStep === 'submitting' && (
                    <div className="py-10 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="absolute inset-0 border-4 border-accent-teal/10 border-t-accent-teal rounded-full"
                        />
                        <Compass size={24} className="text-accent-teal animate-bounce" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-serif text-sm font-bold text-brand-charcoal">
                          {CONCIERGE_T[language]?.submitting || CONCIERGE_T['en'].submitting}
                        </h4>
                        <div className="w-48 h-1 bg-[#EAE8DF] rounded-full overflow-hidden mx-auto/10">
                          <motion.div 
                            className="h-full bg-accent-teal" 
                            style={{ width: `${submissionProgress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-[9px] font-mono tracking-wide text-brand-charcoal/40 animate-pulse">
                        {submissionProgress < 35 
                          ? 'Initializing premium proxy secure brokering...' 
                          : submissionProgress < 70 
                          ? 'Securing connection to designated Belgrade VIP hotline...' 
                          : 'Registering referral broker handshake...'}
                      </p>
                    </div>
                  )}

                  {conciergeStep === 'confirmed' && (
                    <div className="space-y-5 py-2">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-2 text-accent-teal border border-accent-teal/20">
                          <ShieldCheck size={24} />
                        </div>
                        <h4 className="font-serif text-base font-black tracking-tight text-[#1E2E20]">
                          {CONCIERGE_T[language]?.confirmed_title || CONCIERGE_T['en'].confirmed_title}
                        </h4>
                        <p className="text-[11px] leading-relaxed text-brand-charcoal/70">
                          {CONCIERGE_T[language]?.confirmed_msg || CONCIERGE_T['en'].confirmed_msg}
                        </p>
                      </div>

                      {/* Display Inquiry Reference */}
                      <div className="p-4 bg-white rounded-2xl border border-border-main/40 text-center font-mono space-y-1 shadow-sm select-all">
                        <span className="text-[7.5px] uppercase tracking-[0.2em] font-mono text-[#8C8A7D]">
                          {CONCIERGE_T[language]?.inquiry_reference || CONCIERGE_T['en'].inquiry_reference}
                        </span>
                        <div className="text-sm font-black text-accent-teal tracking-tighter mt-0.5">
                          IDEMO–REC{recommendation.id}–{inquirySuffix}
                        </div>
                        <div className="text-[10px] text-brand-charcoal/70 font-sans mt-1">
                          {CONCIERGE_T[language]?.regarding || CONCIERGE_T['en'].regarding}: {getLocalizedValue(recommendation, 'title', language)}
                        </div>
                        <div className="text-[8px] italic text-[#8C8A7D] mt-1.5">Show this credential at checkout for priority benefits</div>
                      </div>

                      {/* Direct Hotlines Channels */}
                      <div className="grid gap-3.5 pt-1.5">
                        {(() => {
                          const getLanguageFullName = (lang: string) => {
                            switch (lang) {
                              case 'sr': return 'Serbian';
                              case 'es': return 'Spanish';
                              case 'de': return 'German';
                              case 'ru': return 'Russian';
                              case 'zh': return 'Chinese';
                              default: return 'English';
                            }
                          };

                          const textMessage = `Hello Concierge,

I would like to arrange a premium experience.

Inquiry Reference: IDEMO–REC${recommendation.id}–${inquirySuffix}
Regarding: ${getLocalizedValue(recommendation, 'title', language)}
Request: ${selectedTemplate || 'None'}
Visitor Notes: ${customNote || 'None'}
Language: ${getLanguageFullName(language)}`;
                          
                          const getWhatsappLabel = () => {
                            if (whatsappCopied) {
                              switch (language) {
                                case 'sr': return "Zahtev kopiran. Otvaram WhatsApp — nalepite ga u polje za poruku i pošaljite.";
                                case 'es': return "Solicitud copiada. Abriendo WhatsApp — péguela en el campo de mensaje y envíe.";
                                case 'de': return "Anfrage kopiert. WhatsApp wird geöffnet — in das Nachrichtenfeld einfügen und senden.";
                                case 'ru': return "Запрос скопирован. Открываем WhatsApp — вставьте в поле сообщения и отправьте.";
                                case 'zh': return "预约已复制。正在跳转 WhatsApp — 请粘贴至对话框并发送。";
                                default: return "Request copied. Opening WhatsApp — paste it into the message field and send.";
                              }
                            }
                            return CONCIERGE_T[language]?.via_whatsapp || CONCIERGE_T['en'].via_whatsapp;
                          };

                          return (
                            <a 
                              href="https://wa.me/381621873260"
                              onClick={(e) => {
                                // Copy prefilled concierge details to user clipboard
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  navigator.clipboard.writeText(textMessage).catch(() => {});
                                } else {
                                  // Fallback for older browsers
                                  const textEl = document.createElement('textarea');
                                  textEl.value = textMessage;
                                  document.body.appendChild(textEl);
                                  textEl.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textEl);
                                }
                                setWhatsappCopied(true);
                                setTimeout(() => setWhatsappCopied(false), 4000);
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`h-14 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all border ${
                                whatsappCopied 
                                  ? 'bg-[#25D366]/10 border-[#25D366] text-[#128C7E]' 
                                  : 'bg-white border-[#25D366]/30 text-[#1E2E20] hover:bg-[#25D366]/5'
                              }`}
                            >
                              <span className="text-[#25D366] text-sm shrink-0">💬</span>
                              <span>{getWhatsappLabel()}</span>
                            </a>
                          );
                        })()}

                        {(() => {
                          const getLanguageFullName = (lang: string) => {
                            switch (lang) {
                              case 'sr': return 'Serbian';
                              case 'es': return 'Spanish';
                              case 'de': return 'German';
                              case 'ru': return 'Russian';
                              case 'zh': return 'Chinese';
                              default: return 'English';
                            }
                          };

                          const textMessage = `Hello Concierge,

I would like to arrange a premium experience.

Inquiry Reference: IDEMO–REC${recommendation.id}–${inquirySuffix}
Regarding: ${getLocalizedValue(recommendation, 'title', language)}
Request: ${selectedTemplate || 'None'}
Visitor Notes: ${customNote || 'None'}
Language: ${getLanguageFullName(language)}`;

                          const getInstagramLabel = () => {
                            if (instagramCopied) {
                              switch (language) {
                                case 'sr': return "Zahtev kopiran. Otvaram Instagram — nalepite ga u polje za poruku i pošaljite.";
                                case 'es': return "Solicitud copiada. Abriendo Instagram — péguela en el campo de mensaje y envíe.";
                                case 'de': return "Anfrage kopiert. Instagram wird geöffnet — in das Nachrichtenfeld einfügen und senden.";
                                case 'ru': return "Запрос скопирован. Открываем Instagram — вставьте в поле сообщения и отправьте.";
                                case 'zh': return "预约已复制。正在跳转 Instagram — 请粘贴至对话框并发送。";
                                default: return "Request copied. Opening Instagram — paste it into the message field and send.";
                              }
                            }
                            return CONCIERGE_T[language]?.via_instagram || CONCIERGE_T['en'].via_instagram;
                          };

                          return (
                            <a 
                              href="https://ig.me/m/idemo.concierge"
                              onClick={(e) => {
                                // Copy prefilled concierge details to user clipboard
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  navigator.clipboard.writeText(textMessage).catch(() => {});
                                } else {
                                  // Fallback for older browsers
                                  const textEl = document.createElement('textarea');
                                  textEl.value = textMessage;
                                  document.body.appendChild(textEl);
                                  textEl.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textEl);
                                }
                                setInstagramCopied(true);
                                setTimeout(() => setInstagramCopied(false), 4000);
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`h-14 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all border ${
                                instagramCopied 
                                  ? 'bg-[#E1306C]/10 border-[#E1306C] text-[#E1306C]' 
                                  : 'bg-white border-[#E1306C]/30 text-[#1E2E20] hover:bg-[#E1306C]/5'
                              }`}
                            >
                              <Instagram size={14} className="text-[#E1306C]" />
                              <span>{getInstagramLabel()}</span>
                            </a>
                          );
                        })()}

                        {(() => {
                          const getCallLabel = () => {
                            if (callCopied) {
                              switch (language) {
                                case 'sr': return "Kopirano! Pozivam...";
                                case 'es': return "¡Copiado! Llamando...";
                                case 'de': return "Kopiert! Rufe an...";
                                case 'ru': return "Скопировано! Звоним...";
                                case 'zh': return "已复制！正在拨号...";
                                default: return "Number Copied! Calling...";
                              }
                            }
                            return CONCIERGE_T[language]?.via_call || CONCIERGE_T['en'].via_call;
                          };

                          return (
                            <a 
                              href={`tel:${getConciergePhone(recommendation).replace(/\s+/g, '').replace('+3810', '+381')}`}
                              onClick={(e) => {
                                const rawPhone = getConciergePhone(recommendation);
                                if (navigator.clipboard && navigator.clipboard.writeText) {
                                  navigator.clipboard.writeText(rawPhone).catch(() => {});
                                } else {
                                  const textEl = document.createElement('textarea');
                                  textEl.value = rawPhone;
                                  document.body.appendChild(textEl);
                                  textEl.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textEl);
                                }
                                setCallCopied(true);
                                setTimeout(() => setCallCopied(false), 4000);
                              }}
                              className={`h-14 font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-md ${
                                callCopied 
                                  ? 'bg-accent-teal text-white' 
                                  : 'text-white bg-brand-charcoal hover:opacity-90'
                              }`}
                            >
                              <Phone size={14} className={callCopied ? "text-white" : "text-accent-teal"} />
                              <span>{getCallLabel()}</span>
                            </a>
                          );
                        })()}
                      </div>

                      <div className="pt-2 text-center text-[9px] text-[#8C8A7D] italic border-t border-border-main/50 font-sans flex flex-col gap-1">
                        <p>{CONCIERGE_T[language]?.warning || CONCIERGE_T['en'].warning}</p>
                        <p className="text-[7.5px] opacity-75">Concierge desk routing hotline: {getConciergePhone(recommendation)} • Belgrade support</p>
                      </div>

                      {/* Return/Close Button */}
                      <button
                        onClick={() => setShowConcierge(false)}
                        className="w-full py-3.5 text-center font-bold text-[10px] uppercase text-brand-charcoal/50 hover:text-brand-charcoal tracking-widest font-mono cursor-pointer"
                      >
                        {CONCIERGE_T[language]?.close || CONCIERGE_T['en'].close}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* FULL HD CONTRAST DRIVER COMMUNICATION OVERLAY CARD (Taxi Card Mode) */}
        <AnimatePresence>
          {showDriverCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.92, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 40 }}
                className="bg-white border-4 border-brand-charcoal text-brand-charcoal w-full max-w-md rounded-[32px] p-6.5 space-y-6 shadow-2xl relative overflow-hidden"
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    triggerHaptic(6);
                    setShowDriverCard(false);
                  }}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-brand-pearl hover:bg-[#EDE9DE] text-brand-charcoal flex items-center justify-center border border-[#DDDCCF] active:scale-90 transition-all font-black cursor-pointer min-h-[40px]"
                  id="close-driver-card"
                >
                  <X size={20} />
                </button>

                {/* Taxi Icon Header */}
                <div className="flex items-center gap-3.5 border-b border-brand-charcoal/15 pb-4">
                  <span className="text-3.5xl">🚖</span>
                  <div>
                    <h4 className="text-[11.5px] uppercase tracking-[0.3em] font-black text-[#5C5A4D]">
                      {language === 'sr' ? 'TAKSI KARTICA VOZAČA' : language === 'zh' ? '出租车地址名片' : 'CAB DRIVER ADDRESS CARD'}
                    </h4>
                    <p className="text-[13px] text-brand-charcoal/60 font-mono">IDEMO Premium Digital Concierge</p>
                  </div>
                </div>

                {/* Local Command Phrase */}
                <div className="p-4 bg-brand-pearl border border-[#DDDCCF] rounded-2xl">
                  <p className="text-[11.5px] uppercase tracking-widest text-[#8C8A7D] font-mono leading-none mb-2">
                    {language === 'sr' ? 'Prikažite vozaču' : language === 'zh' ? '请直接出示给司机看' : 'Hand device to driver'}
                  </p>
                  <p className="text-xl font-serif leading-relaxed text-brand-charcoal font-bold italic">
                    “Molim Vas, odvezite me do ove lokacije:”
                  </p>
                </div>

                {/* Destination Details */}
                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#8C8A7D] font-extrabold font-mono block">
                      {language === 'sr' ? 'LOKACIJA (NAZIV):' : language === 'zh' ? '目的地 (名称):' : 'DESTINATION (NAME):'}
                    </span>
                    <p className="text-[25px] font-serif font-black tracking-tight text-brand-charcoal leading-tight">
                      {getLocalizedValue(recommendation, 'title', 'sr') || recommendation.title}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#8C8A7D] font-extrabold font-mono block">
                      {language === 'sr' ? 'PRECIZNA ADRESA:' : language === 'zh' ? '精准地址:' : 'PRECISE ADDRESS:'}
                    </span>
                    <p className="text-[19px] font-semibold leading-relaxed text-[#1a1c13]">
                      {getLocalizedValue(recommendation, 'location', 'sr') || recommendation.location}
                    </p>
                  </div>

                  {(() => {
                    const isCalibrated = recommendation.coordinates && typeof recommendation.coordinates.lat === 'number' && typeof recommendation.coordinates.lng === 'number' && recommendation.coordinates.lat !== 0 && recommendation.coordinates.lng !== 0 && !(recommendation.id && recommendation.id.toString().startsWith('draft-'));
                    if (!isCalibrated) return null;
                    return (
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider text-[#8C8A7D] font-extrabold font-mono block">
                          {language === 'sr' ? 'SATELITSKE KOORDINATE (GPS):' : language === 'zh' ? '卫星卫星导航坐标 (GPS):' : 'SATELLITE COORDINATES (GPS):'}
                        </span>
                        <p className="font-mono text-xs font-bold text-accent-red tracking-wide uppercase bg-accent-red/5 border border-accent-red/15 inline-block px-2.5 py-1 rounded-md">
                          {recommendation.coordinates.lat}° N, {recommendation.coordinates.lng}° E
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Copy Action Grid */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const isCalibrated = recommendation.coordinates && typeof recommendation.coordinates.lat === 'number' && typeof recommendation.coordinates.lng === 'number' && recommendation.coordinates.lat !== 0 && recommendation.coordinates.lng !== 0 && !(recommendation.id && recommendation.id.toString().startsWith('draft-'));
                      const srTitle = getLocalizedValue(recommendation, 'title', 'sr') || recommendation.title;
                      const srAddr = getLocalizedValue(recommendation, 'location', 'sr') || recommendation.location;
                      const gps = (recommendation.coordinates && isCalibrated) ? `${recommendation.coordinates.lat}, ${recommendation.coordinates.lng}` : 'TBD';
                      const textToCopy = `Molim Vas, odvezite me do ove lokacije:\nNaziv: ${srTitle}\nAdresa: ${srAddr}\nGPS: ${gps}\nHvala!`;
                      navigator.clipboard.writeText(textToCopy);
                      setTaxiCopied(true);
                      triggerHaptic(50);
                      setTimeout(() => setTaxiCopied(false), 2000);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white rounded-2xl font-black text-xs uppercase tracking-widest min-h-[50px] transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    {taxiCopied ? (
                      <>
                        <Check size={14} className="text-emerald-400 animate-pulse" />
                        <span>{language === 'sr' ? 'KOPIRANO U PRIVREMENU MEMORIJU!' : language === 'zh' ? '名片内容已复制！' : 'COPIED TO CLIPBOARD!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>{language === 'sr' ? 'KOPIRAJ UPUTSTVA ZA TAKSI' : language === 'zh' ? '复制完整地址口令' : 'COPY CAB DIRECTIVE'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-[10.5px] text-[#8C8A7D] font-medium leading-snug">
                  {language === 'sr' ? 'Ova kartica je dizajnirana sa namerom da se telefon direktno preda vozaču u ruke, radi lakše koordinacije.' :
                   language === 'zh' ? '本名片专为解决语言障碍而设计，支持高对比度离线出示。' :
                   'This card is highly optimized for late-night illumination and direct delivery into a host taxi driver’s hands.'}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSISTENT LIGHTWEIGHT STICKY BOTTOM ACTION BAR */}
        <AnimatePresence>
          {scrolledPast && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed bottom-[88px] left-4 right-4 p-3 bg-[#FAF9F5]/95 backdrop-blur-md border border-border-main z-[50] max-w-[388px] mx-auto shadow-[0_8px_32px_rgba(35,37,30,0.08)] rounded-2xl flex items-center justify-center"
            >
              <DetailsCTA
                language={language}
                recommendation={recommendation}
                isAdding={isAdding}
                onAdd={handleAdd}
                detailT={detailT}
                idPrefix="sticky-bar"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSaveToast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#2D3025] text-[#FAF9F5] px-5 py-3.5 rounded-2xl shadow-xl z-[200] flex flex-col xs:flex-row items-center gap-4 text-[12.5px] font-bold select-none border border-brand-charcoal/30 w-[90%] max-w-[380px] justify-between"
            >
              <span>{language === 'sr' ? 'Sačuvano u planer' : language === 'zh' ? '已保存到活动计划器' : 'Saved to My Event Planner'}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    triggerHaptic(5);
                    onNavigate('plan');
                  }}
                  className="text-accent-teal hover:underline uppercase text-[10px] tracking-wider font-black cursor-pointer"
                >
                  {language === 'sr' ? 'Planer' : language === 'zh' ? '查看计划器' : 'View Planner'}
                </button>
                <span className="text-white/20">|</span>
                <button 
                  onClick={() => {
                    triggerHaptic(5);
                    onRemove();
                    setShowSaveToast(false);
                  }}
                  className="text-accent-red hover:underline uppercase text-[10px] tracking-wider font-black cursor-pointer"
                >
                  {language === 'sr' ? 'Poništi' : language === 'zh' ? '撤销' : 'Undo'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PlanScreen({ scheduledItems, onSelectRec, onUpdateDate, onRemove, language, onExplore, currentArchetype, sortedMonths, onAddBundle, lowSignalMode, allRecommendations, budget, time, days, timeOfDay, selectedCats = [], orbitX, orbitY }: any) {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const dynamicStyle = React.useMemo(() => {
    return getDynamicStyle(language, selectedCats, days, budget, time);
  }, [language, selectedCats, days, budget, time]);
  const [showLivePreview, setShowLivePreview] = React.useState(false);
  const [copiedToast, setCopiedToast] = React.useState(false);
  const [calendarToast, setCalendarToast] = React.useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const renderJourneyBundles = () => {
    const JOURNEY_BUNDLES = [
      {
        id: 'old_belgrade',
        title: { en: '3 Hours in Old Belgrade', sr: '3 sata u starom Beogradu', zh: '老贝尔格莱德3小时游' },
        tag: '2 Hours / 3 Hours',
        duration: '3h',
        vibe: 'Classic Heritage & Coffee',
        itemIds: ['29', '7', '10'], // Kalemegdanska Terasa, Nikola Tesla Museum, Rakia Bar Belgrade
        description: {
          en: 'A concise historical circuit through old fortress steps, Nikola Tesla’s archive, and Belgrade’s oldest social spirits.',
          sr: 'Kompaktna istorijska šetnja kroz kule Kalemegdana, arhiv Nikole Tesle i najstarije beogradske kafane.',
          zh: '一段穿越古老城堡、特斯拉科学陈列馆与最古老酒馆的紧凑历史人文漫游。'
        }
      },
      {
        id: 'belgrade_architects',
        title: { en: 'Belgrade for Architects', sr: 'Beograd za arhitekte', zh: '建筑师的贝尔格莱德' },
        tag: 'Half-Day',
        duration: 'Half-Day',
        vibe: 'Brutalist Masterpieces & Confluence',
        itemIds: ['23', '29'], // Silosi Belgrade, Kalemegdanska Terasa (with high fortress geography)
        description: {
          en: 'An editorial route exploring post-war industrial concrete structures, defensive military battlements, and Sava riverfront urban planning.',
          sr: 'Pregled monumentalnih silosa, odbrambenih vizantijskih i austrijskih zidina i rečne urbane arhitekture.',
          zh: '品读战后粗野主义工业粮仓、历代军事保卫要塞与萨瓦河岸新规划区，体验建筑的力量。'
        }
      },
      {
        id: 'quiet_serbia',
        title: { en: 'Quiet Serbia', sr: 'Mirna Srbija', zh: '宁谧塞尔维亚' },
        tag: 'Full-Day',
        duration: 'Full-Day',
        vibe: 'Wilderness & Organic Distilleries',
        itemIds: ['1', '11'], // Uvac Meanders, Distillery Zarić
        description: {
          en: 'Unpowered nature escape featuring Europe’s most majestic meanders, organic premium fruit distilleries, and quiet valley air.',
          sr: 'Premium izolacija u netaknutoj prirodi: veličanstveni meandri Uvca i organic destilerija premium rakije.',
          zh: '远离尘嚣，行舟于雄阔的曲流大峡谷，探访手工高级果实蒸馏工坊与静谧的山林。'
        }
      },
      {
        id: 'concrete_coffee',
        title: { en: 'Concrete & Coffee', sr: 'Beton i kafa', zh: '混凝土与咖啡' },
        tag: '2 Hours',
        duration: '2h',
        vibe: 'Brutalist Acoustics & Coffee Cult',
        itemIds: ['23', '10'], // Silosi Belgrade, Rakia Bar / craft coffee area
        description: {
          en: 'A lightweight exploration of Belgrade’s industrial concrete acoustic cavities paired with premium, slow-brewed local coffee.',
          sr: 'Kratka šetnja kroz brutalističke akustične silose uz vrhunsku, lagano kuvanu domaću kafu.',
          zh: '轻松探索贝尔格莱德粗野建筑巨构的混能共鸣腔，品鉴慢速手冲咖啡与微醺果味。'
        }
      },
      {
        id: 'rakija_river',
        title: { en: 'Rakija & River Evenings', sr: 'Rakija i rečne večeri', zh: '拉基亚与河畔之夜' },
        tag: 'Weekend',
        duration: 'Weekend',
        vibe: 'Traditional Gastronomy & Confluence Melodies',
        itemIds: ['10', '58', '3'], // Rakia Bar, Kafanas of Old Zemun, Riverside splavovi Confluence
        description: {
          en: 'A weekend immersion into traditional plum distillates, riverside fish stews, and floating acoustic melodies on the Danube.',
          sr: 'Vikend uranjanje u tradicionalnu šljivu, autentičnu čorbu u Zemunu i akustičnu tamburicu na rekama.',
          zh: '周末沉浸式体验：传统双蒸橡木桶李子烧酒搭配多瑙河畔鲜美鱼汤，以及浮动船坞里的现场弦乐。'
        }
      }
    ];

    const handleDownloadBundleICS = (b: any) => {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//IDEMO//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];
      
      const today = new Date();
      b.itemIds.forEach((id: string, index: number) => {
        const item = allRecommendations.find((r: any) => r.id === id);
        if (!item) return;

        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + index);

        const year = eventDate.getFullYear();
        const month = String(eventDate.getMonth() + 1).padStart(2, '0');
        const day = String(eventDate.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:bundle-${b.id}-${item.id}-${Date.now()}@idemo.com`);
        icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
        icsContent.push(`DTEND;VALUE=DATE:${dateStr}`);
        icsContent.push(`SUMMARY:${getLocalizedValue(item, 'title', language)}`);
        icsContent.push(`DESCRIPTION:Curated Itinerary Step for ${b.title[language] || b.title['en']}. Vibe: ${b.vibe}. Cost: ${item.estimatedCost || 'N/A'}`);
        icsContent.push(`LOCATION:${getLocalizedValue(item, 'location', language)}`);
        icsContent.push('END:VEVENT');
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${b.id}_trip_plan.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-4 pt-10 border-t border-border-main/50 mt-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-accent-teal">
            <Compass size={11} className="text-accent-teal" />
            <span className="text-[8.5px] uppercase font-black tracking-widest">
              {language === 'sr' ? 'Kustoske rute' : language === 'zh' ? '精品路线' : 'Curated Journeys'}
            </span>
          </div>
          <h3 className="text-xl font-serif text-brand-charcoal tracking-tight">
            {language === 'sr' ? 'Predefinisane rute (Offline)' : language === 'zh' ? '离线品质行程包' : 'Offline Journey Bundles'}
          </h3>
          <p className="text-[11px] text-[#5C5E54] leading-normal font-sans">
            {language === 'sr' 
              ? 'Učitajte stručno odabrane itinerere u svoj planer jednim klikom. Potpuno offline operativno.' 
              : language === 'zh' 
              ? '一键载入本地学者雕琢的主题路线。断网离线也能正常导航和查阅。' 
              : 'Direct drop-in itineraries configured by local curatorial scholars. Pre-cached and 100% functional offline.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {JOURNEY_BUNDLES.map((b) => {
            const isAdded = b.itemIds.every(id => scheduledItems.some((s: any) => s.id === id));
            return (
              <div 
                key={b.id} 
                className="bg-white border border-border-main p-5 rounded-[28px] shadow-tactile hover:shadow-md transition-all flex flex-col justify-between text-left"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-wider text-accent-red bg-accent-red/5 border border-accent-red/10 px-2 py-0.5 rounded-full">
                      {b.tag}
                    </span>
                    <span className="text-[8.5px] font-mono text-[#8C8A7D]">
                      ⏱ {b.duration}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-serif font-bold text-brand-charcoal leading-tight">
                    {b.title[language] || b.title['en']}
                  </h4>
                  <p className="text-[10.5px] text-[#5C5E54]/80 leading-relaxed font-sans mt-1">
                    {b.description[language] || b.description['en']}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#EAE8DF] flex justify-between items-center">
                  <span className="text-[8px] font-mono text-[#8C8A7D] uppercase">
                    Vibe: {b.vibe}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {isAdded ? (
                      <span className="text-[8.5px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                        ✓ Active
                      </span>
                    ) : (
                      <button 
                        onClick={() => {
                          triggerHaptic(12);
                          onAddBundle(b.itemIds);
                        }}
                        className="px-3.5 py-1.5 bg-accent-red hover:bg-accent-red/90 text-white uppercase text-[8px] tracking-widest font-black rounded-full shadow-sm active:scale-95 transition-all outline-none cursor-pointer"
                      >
                        {language === 'sr' ? 'Sačuvaj u planer događaja' : language === 'zh' ? '保存到我的活动计划器' : 'Save to My Event Planner'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const shareBtnLabels: Record<string, string> = {
    en: 'SHARE EVENT PLANNER AS PDF',
    sr: 'PODELI PLANER DOGAĐAJA KAO PDF',
    de: 'EVENT-PLANER ALS PDF TEILEN',
    es: 'COMPARTIR PLANIFICADOR COMO PDF',
    ru: 'ПОДЕЛИТЬСЯ ПЛАНИРОВЩИКОМ КАК PDF',
    zh: '分享活动计划器为 PDF'
  };

  const modalCloseLabels: Record<string, string> = {
    en: 'CLOSE',
    sr: 'ZATVORI',
    de: 'SCHLIESSEN',
    es: 'CERRAR',
    ru: 'ЗАКРЫТЬ',
    zh: '关闭'
  };

  const modalPrintLabels: Record<string, string> = {
    en: 'PRINT / SHARE PDF',
    sr: 'ŠTAMPAJ / PODELI PDF',
    de: 'DRUCKEN / TEILEN',
    es: 'IMPRIMIR / COMPARTIR',
    ru: 'ПЕЧАТЬ / ПОДЕЛИТЬСЯ',
    zh: '打印 / 分享 PDF'
  };

  const modalDownloadLabels: Record<string, string> = {
    en: 'DOWNLOAD PDF',
    sr: 'PREUZMI PDF',
    de: 'PDF HERUNTERLADEN',
    es: 'DESCARGAR PDF',
    ru: 'СКАЧАТЬ PDF',
    zh: '下载 PDF'
  };

  const modalShareLabels: Record<string, string> = {
    en: 'SHARE PLANNER',
    sr: 'PODELI PLANER',
    de: 'PLANER TEILEN',
    es: 'COMPARTIR PLANIFICADOR',
    ru: 'ПОДЕЛИТЬСЯ',
    zh: '分享计划器'
  };

  const shareToastSuccess: Record<string, string> = {
    en: 'Link copied! Send it using your preferred app.',
    sr: 'Link je kopiran! Pošaljite ga koristeći željenu aplikaciju.',
    de: 'Link kopiert! Senden Sie ihn mit Ihrer bevorzugten App.',
    es: '¡Enlace copiado! Envíalo usando tu aplicación preferida.',
    ru: 'Ссылка скопирована! Отправьте её своим близким.',
    zh: '链接已复制！使用您喜爱的应用发送吧。'
  };

  const shareBtnLabel = shareBtnLabels[language] || shareBtnLabels['en'];

  const handleSharePDF = async () => {
    const shareData = {
      title: language === 'sr' ? 'Moj EXPO 2027 Planer Događaja' : 'My EXPO 2027 Event Planner',
      text: language === 'sr' ? 'Pogledaj moj skrojeni planer događaja za EXPO 2027 u Beogradu!' : 'Check out my custom event planner for EXPO 2027 Belgrade!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      } catch (err) {
        console.error('Clipboard failed', err);
      }
    }
  };

  const handleSyncCalendar = () => {
    triggerHaptic(5);
    
    const calendarEmptyMsgs: Record<string, string> = {
      en: 'Your Event Planner is empty. Find and save some Serbian wonders first!',
      sr: 'Vaš planer događaja je prazan. Pronađite i sačuvajte srpska čuda prvo!',
      de: 'Ihr Event-Planer ist leer. Finden und speichern Sie zuerst serbische Wunder!',
      es: '¡Tu planificador está vacío. Encuentra y guarda maravillas serbias primero!',
      ru: 'Ваш планировщик пуст. Сначала найдите и сохраните сербские чудеса!',
      zh: '您的行程计划为空，请先发现并保存您心仪的塞尔维亚景点！'
    };

    const calendarErrorMsgs: Record<string, string> = {
      en: 'Failed to sync calendar. Please check browser permissions and try again.',
      sr: 'Greška pri sinhronizaciji kalendara. Proverite dozvole pretraživača i pokušajte ponovo.',
      de: 'Fehler beim Synchronisieren des Kalenders. Bitte Browser-Berechtigungen prüfen und erneut versuchen.',
      es: 'Error al sincronizar el calendario. Revisa los permisos de tu navegador e inténtalo de nuevo.',
      ru: 'Ошибка синхронизации календаря. Проверьте разрешения браузера и попробуйте снова.',
      zh: '同步日历失败，请检查浏览器权限并重试。'
    };

    const calendarSuccessMsgs: Record<string, string> = {
      en: 'Calendar sync (.ics) file generated successfully!',
      sr: 'Sinhronizacioni fajl (.ics) je uspešno generisan!',
      de: 'Kalender-Synchronisationsdatei (.ics) erfolgreich erstellt!',
      es: '¡Archivo de sincronización (.ics) creado con éxito!',
      ru: 'Файл синхронизации календаря (.ics) успешно создан!',
      zh: '日历同步文件 (.ics) 生成成功！'
    };

    if (scheduledItems.length === 0) {
      setCalendarToast({
        type: 'warning',
        message: calendarEmptyMsgs[language] || calendarEmptyMsgs['en']
      });
      setTimeout(() => setCalendarToast(null), 4000);
      return;
    }

    try {
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//IDEMO//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      scheduledItems.forEach((item: any) => {
        if (item.isAvailable === false) return;
        const date = item.scheduledDate ? new Date(item.scheduledDate) : new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        const dateStr = `${year}${month}${day}`;

        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${item.id}-${Date.now()}@idemo.com`);
        icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
        icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`);
        icsContent.push(`DTEND;VALUE=DATE:${dateStr}`);
        icsContent.push(`SUMMARY:${getLocalizedValue(item, 'title', language)}`);
        icsContent.push(`DESCRIPTION:${t.event_description(formatCategory(item.category, t), getLocalizedValue(item, 'location', language))}`);
        icsContent.push(`LOCATION:${getLocalizedValue(item, 'location', language)}`);
        icsContent.push('END:VEVENT');

        // Learn quietly from calendar sync
        trackCalendarExportSignal(item);
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expo2027_trip_plan.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCalendarToast({
        type: 'success',
        message: calendarSuccessMsgs[language] || calendarSuccessMsgs['en']
      });
      setTimeout(() => setCalendarToast(null), 4000);
    } catch (err) {
      console.error('Calendar generation/sync failed', err);
      setCalendarToast({
        type: 'error',
        message: calendarErrorMsgs[language] || calendarErrorMsgs['en']
      });
      setTimeout(() => setCalendarToast(null), 4000);
    }
  };

  const transliterateCyrillicToLatin = (str: string): string => {
    const cyrillicToLatinMap: Record<string, string> = {
      // Serbian & Russian Uppercase
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Ђ': 'Dj', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
      'Й': 'Y', 'Ј': 'J', 'К': 'K', 'Л': 'L', 'Љ': 'Lj', 'М': 'M', 'Н': 'N', 'Њ': 'Nj', 'О': 'O', 'П': 'P', 'Р': 'R',
      'С': 'S', 'Т': 'T', 'Ћ': 'C', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Џ': 'Dz', 'Ш': 'Sh', 'Щ': 'Shch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
      
      // Serbian & Russian Lowercase
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
      'й': 'y', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r',
      'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'џ': 'dz', 'ш': 'sh', 'щ': 'shch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    return str.split('').map(char => cyrillicToLatinMap[char] || char).join('');
  };

  const sanitizePdfText = (text: string): string => {
    if (!text) return '';
    let temp = transliterateCyrillicToLatin(text);
    const accentMap: Record<string, string> = {
      'é': 'e', 'è': 'e', 'ê': 'e', 'á': 'a', 'à': 'a', 'ó': 'o', 'í': 'i', 'ú': 'u',
      'ñ': 'n', 'Ñ': 'N',
      // German Umlauts
      'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue',
      // Serbian Latin Characters
      'š': 's', 'ć': 'c', 'č': 'c', 'đ': 'dj', 'ž': 'z',
      'Š': 'S', 'Ć': 'C', 'Č': 'C', 'Đ': 'Dj', 'Ž': 'Z'
    };
    return temp.split('').map(char => accentMap[char] || char).join('')
               .replace(/✔|✓/g, 'Y')
               .replace(/✘|✗/g, 'N')
               .replace(/⚡/g, 'Time:')
               .replace(/🚗/g, 'Transit:')
               .replace(/💶/g, 'Cost:')
               .replace(/🌐/g, 'Web:')
               .replace(/📞/g, 'Tel:')
               .replace(/🌸|🍽|🍷|🍸|🎨|🏛|🎪|🛍|🛎|🧭|📍/g, '-')
               .replace(/[^\x00-\x7F]/g, '');
  };

  const urlToBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const urlToBase64Cover = (url: string, targetW: number, targetH: number): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const scale = 10; // 10x scale for crisp printing
          canvas.width = targetW * scale;
          canvas.height = targetH * scale;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }

          const imgRatio = img.naturalWidth / img.naturalHeight;
          const targetRatio = targetW / targetH;

          let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

          if (imgRatio > targetRatio) {
            sWidth = img.naturalHeight * targetRatio;
            sx = (img.naturalWidth - sWidth) / 2;
          } else {
            sHeight = img.naturalWidth / targetRatio;
            sy = (img.naturalHeight - sHeight) / 2;
          }

          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      const resolvedPath = url.startsWith('/') ? url : '/' + url;
      img.src = resolveImage(resolvedPath);
    });
  };

  const drawIdemoWatermark = (pdfDoc: any, cx: number, cy: number, scale: number) => {
    const angle = -25 * Math.PI / 180;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    
    const letterStrokes: Record<string, number[][]> = {
      'I': [
        [2, 0, 8, 0],
        [5, 0, 5, 15],
        [2, 15, 8, 15]
      ],
      'D': [
        [1, 0, 1, 15],
        [1, 0, 6, 0],
        [1, 15, 6, 15],
        [6, 0, 9, 3.5],
        [9, 3.5, 9, 11.5],
        [9, 11.5, 6, 15]
      ],
      'E': [
        [1, 0, 1, 15],
        [1, 0, 10, 0],
        [1, 7.5, 8, 7.5],
        [1, 15, 10, 15]
      ],
      'M': [
        [1, 0, 1, 15],
        [9, 0, 9, 15],
        [1, 0, 5, 10],
        [5, 10, 9, 0]
      ],
      'O': [
        [3, 0, 7, 0],
        [3, 15, 7, 15],
        [1, 2, 1, 13],
        [9, 2, 9, 13],
        [1, 2, 3, 0],
        [9, 2, 7, 0],
        [1, 13, 3, 15],
        [9, 13, 7, 15]
      ]
    };
    
    const textChars = ['I', 'D', 'E', 'M', 'O'];
    const charWidth = 10;
    const padding = 3;
    const totalWidth = textChars.length * (charWidth + padding) - padding;
    
    const startX = -totalWidth / 2;
    const startY = -7.5;
    
    // Very faint color for premium, elegant aesthetic
    pdfDoc.setDrawColor(247, 245, 241);
    pdfDoc.setLineWidth(1.2 * scale);
    
    textChars.forEach((char, idx) => {
      const strokes = letterStrokes[char];
      if (!strokes) return;
      
      strokes.forEach(stroke => {
        const lx1 = startX + idx * (charWidth + padding) + stroke[0];
        const ly1 = startY + stroke[1];
        const lx2 = startX + idx * (charWidth + padding) + stroke[2];
        const ly2 = startY + stroke[3];
        
        const sx1 = lx1 * scale;
        const sy1 = ly1 * scale;
        const sx2 = lx2 * scale;
        const sy2 = ly2 * scale;
        
        const rx1 = cx + sx1 * cosA - sy1 * sinA;
        const ry1 = cy + sx1 * sinA + sy1 * cosA;
        const rx2 = cx + sx2 * cosA - sy2 * sinA;
        const ry2 = cy + sx2 * sinA + sy2 * cosA;
        
        pdfDoc.line(rx1, ry1, rx2, ry2);
      });
    });
  };

  const createHighQualityTeslaImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.clearRect(0, 0, 160, 160);
    ctx.globalAlpha = 0.10;
    
    const cx = 80;
    const cy = 80;
    
    ctx.strokeStyle = '#5C5E54';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.stroke();
    
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 55, cy + Math.sin(a) * 55);
      ctx.lineTo(cx + Math.cos(a) * 70, cy + Math.sin(a) * 70);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#1E2E20';
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 50);
    ctx.bezierCurveTo(cx - 35, cy + 25, cx - 40, cy + 10, cx - 35, cy - 15);
    ctx.bezierCurveTo(cx - 30, cy - 35, cx - 15, cy - 45, cx + 5, cy - 45);
    ctx.bezierCurveTo(cx + 17, cy - 45, cx + 22, cy - 35, cx + 23, cy - 20);
    ctx.bezierCurveTo(cx + 21, cy - 15, cx + 18, cy - 12, cx + 20, cy - 8);
    ctx.lineTo(cx + 33, cy + 2);
    ctx.lineTo(cx + 20, cy + 6);
    ctx.bezierCurveTo(cx + 22, cy + 8, cx + 24, cy + 11, cx + 24, cy + 15);
    ctx.bezierCurveTo(cx + 22, cy + 17, cx + 18, cy + 16, cx + 15, cy + 16);
    ctx.bezierCurveTo(cx + 17, cy + 19, cx + 18, cy + 22, cx + 12, cy + 24);
    ctx.bezierCurveTo(cx + 11, cy + 26, cx + 13, cy + 32, cx + 5, cy + 34);
    ctx.bezierCurveTo(cx - 5, cy + 35, cx - 15, cy + 36, cx - 20, cy + 48);
    ctx.lineTo(cx - 18, cy + 55);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#1E2E20';
    ctx.font = 'bold 12px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('N. TESLA', cx, cy + 68);
    
    return canvas.toDataURL('image/png');
  };

  const createHighQualityRomanCoinImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.clearRect(0, 0, 160, 160);
    ctx.globalAlpha = 0.10;
    
    const cx = 80;
    const cy = 80;
    
    ctx.strokeStyle = '#6E644B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.1) {
      const r = 67 + Math.sin(a * 7) * 1.2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
    
    ctx.strokeStyle = '#6E644B';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#6E644B';
    ctx.beginPath();
    ctx.moveTo(cx - 15, cy + 45);
    ctx.quadraticCurveTo(cx - 22, cy + 35, cx - 20, cy + 15);
    ctx.bezierCurveTo(cx - 28, cy + 5, cx - 25, cy - 15, cx - 12, cy - 30);
    ctx.bezierCurveTo(cx - 2, cy - 38, cx + 18, cy - 32, cx + 22, cy - 20);
    ctx.bezierCurveTo(cx + 24, cy - 13, cx + 21, cy - 8, cx + 20, cy - 3);
    ctx.bezierCurveTo(cx + 25, cy - 1, cx + 25, cy + 3, cx + 16, cy + 8);
    ctx.lineTo(cx + 23, cy + 13);
    ctx.lineTo(cx + 14, cy + 17);
    ctx.lineTo(cx + 17, cy + 20);
    ctx.bezierCurveTo(cx + 21, cy + 24, cx + 15, cy + 29, cx + 10, cy + 31);
    ctx.bezierCurveTo(cx + 2, cy + 33, cx - 8, cy + 35, cx - 10, cy + 45);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FCFBF8'; 
    for (let angle = -0.5; angle < 0.6; angle += 0.28) {
      const lx = cx + Math.cos(angle) * 16;
      const ly = cy - 20 + Math.sin(angle) * 16;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 4, 2, angle + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = '#6E644B';
    ctx.font = 'bold 7.5px "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('IMP CONSTANTINVS AVG', cx, cy - 43);
    
    return canvas.toDataURL('image/png');
  };

  const createPhrasesCard = (lang: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Card white background to prevent transparent overlay
    ctx.fillStyle = '#FCFBF8';
    ctx.fillRect(0, 0, 600, 360);

    // Subtle premium border
    ctx.strokeStyle = '#DCDAD0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, 598, 358);

    // Header strip (Sage green)
    ctx.fillStyle = '#3E563F'; // Sage green accent
    ctx.fillRect(2, 2, 596, 42);

    ctx.fillStyle = '#FCFBF8';
    ctx.font = 'bold 13px "Times New Roman", Times, serif';
    ctx.fillStyle = '#FCFBF8';
    ctx.fillText(lang === 'sr' ? 'KORISNE LOKALNE FRAZE (SRBIJA)' : 'USEFUL LINGUISTIC PHRASES (SERBIA)', 20, 26);

    const phrases = [
      {
        latin: "Dobar dan",
        cyrillicReal: "Добар дан",
        english: "Good day"
      },
      {
        latin: "Hvala",
        cyrillicReal: "Хвала",
        english: "Thank you"
      },
      {
        latin: "Racun, molim",
        cyrillicReal: "Рачун, молим",
        english: "The bill, please"
      },
      {
        latin: "Da li govorite engleski?",
        cyrillicReal: "Да ли говорите енглески?",
        english: "Do you speak English?"
      },
      {
        latin: "Koliko kosta?",
        cyrillicReal: "Колико кошта?",
        english: "How much does it cost?"
      }
    ];

    let y = 78;
    phrases.forEach((p, idx) => {
      // Number index
      ctx.fillStyle = '#8C8A7D';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`${idx + 1}.`, 20, y);

      // Latin Latinic/Pronunciation
      ctx.fillStyle = '#2C2D27'; // charcoal text
      ctx.font = 'bold 12.5px sans-serif';
      ctx.fillText(`"${p.latin}"`, 45, y);

      // Serbian Cyrillic script
      ctx.fillStyle = '#1B2E20'; // dark forest sage
      ctx.font = 'bold 12.5px serif';
      ctx.fillText(p.cyrillicReal, 285, y);

      // English Meaning
      ctx.fillStyle = '#7E7C6F';
      ctx.font = 'italic 11px sans-serif';
      ctx.fillText(p.english, 45, y + 17);

      // Divider between phrases
      if (idx < phrases.length - 1) {
        ctx.strokeStyle = '#EAE8E0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, y + 27);
        ctx.lineTo(580, y + 27);
        ctx.stroke();
      }

      y += 56;
    });

    return canvas.toDataURL('image/png');
  };

  const drawCompassFallback = (pdfDoc: any, x: number, y: number, w: number, h: number) => {
    const cx = x + w / 2;
    const cy = y + h / 2;
    
    pdfDoc.setDrawColor(215, 212, 203);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.ellipse(cx, cy, 12, 12);
    pdfDoc.ellipse(cx, cy, 11, 11);
    
    pdfDoc.line(cx, cy - 9, cx, cy + 9);
    pdfDoc.line(cx - 9, cy, cx + 9, cy);
    
    pdfDoc.setFillColor(220, 38, 38);
    pdfDoc.triangle(cx, cy, cx - 1.5, cy, cx, cy - 8, 'F');
    
    pdfDoc.setFillColor(30, 46, 32);
    pdfDoc.triangle(cx, cy, cx + 1.5, cy, cx, cy + 8, 'F');
    
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(5);
    pdfDoc.setTextColor(220, 38, 38);
    pdfDoc.text('N', cx - 1.2, cy - 9.5);
    pdfDoc.setTextColor(30, 46, 32);
    pdfDoc.text('S', cx - 1.2, cy + 11.5);
    
    pdfDoc.setFont('times', 'bold');
    pdfDoc.setFontSize(15);
    pdfDoc.setTextColor(140, 138, 125);
    pdfDoc.text('IDEMO', cx - pdfDoc.getTextWidth('IDEMO') / 2, cy + 18);
  };

  const drawCalendar = (pdfDoc: any, x: number, y: number, width: number, height: number, year: number, month: number, highlightedDay: number, lang: string) => {
    pdfDoc.setDrawColor(220, 218, 208);
    pdfDoc.setFillColor(252, 251, 248);
    pdfDoc.setLineWidth(0.25);
    pdfDoc.rect(x, y, width, height, 'FD');
    
    const monthsEN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const monthsSR = ['JANUAR', 'FEBRUAR', 'MART', 'APRIL', 'MAJ', 'JUN', 'JUL', 'AVGUST', 'SEPTEMBAR', 'OKTOBAR', 'NOVEMBAR', 'DECEMBAR'];
    const monthLabel = lang === 'sr' ? monthsSR[month] : monthsEN[month];
    
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(6.5);
    pdfDoc.setTextColor(30, 46, 32);
    pdfDoc.text(`${monthLabel} ${year}`, x + 4, y + 5);
    
    const daysHeader = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const cellWidth = (width - 8) / 7;
    pdfDoc.setFontSize(5);
    pdfDoc.setTextColor(140, 138, 125);
    daysHeader.forEach((day, idx) => {
      pdfDoc.text(day, x + 4 + idx * cellWidth + cellWidth/2 - pdfDoc.getTextWidth(day)/2, y + 10);
    });
    
    pdfDoc.setDrawColor(229, 227, 219);
    pdfDoc.line(x + 3, y + 11.5, x + width - 3, y + 11.5);
    
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfWeek = (y: number, m: number) => {
      let day = new Date(y, m, 1).getDay();
      return day === 0 ? 6 : day - 1;
    };
    
    const numDays = getDaysInMonth(year, month);
    const startOffset = getFirstDayOfWeek(year, month);
    
    let currentDay = 1;
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(5);
    const rowHeight = 4.2;
    
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const dayCellIndex = r * 7 + c;
        if (dayCellIndex >= startOffset && currentDay <= numDays) {
          const cx = x + 4 + c * cellWidth + cellWidth/2;
          const cy = y + 15.5 + r * rowHeight;
          
          if (currentDay === highlightedDay) {
            pdfDoc.setFillColor(220, 38, 38);
            pdfDoc.ellipse(cx, cy - 0.7, 1.6, 1.6, 'F');
            pdfDoc.setFont('helvetica', 'bold');
            pdfDoc.setTextColor(255, 255, 255);
          } else {
            pdfDoc.setFont('helvetica', 'normal');
            pdfDoc.setTextColor(92, 94, 84);
          }
          
          const dayStr = String(currentDay);
          pdfDoc.text(dayStr, cx - pdfDoc.getTextWidth(dayStr)/2, cy);
          currentDay++;
        }
      }
    }
  };

  const getCategoryTips = (cat: string, lang: string): string[] => {
    const isSR = lang === 'sr';
    const norm = String(cat).toLowerCase();
    if (norm.includes('gastro') || norm.includes('drink') || norm.includes('food')) {
      return [
        isSR 
          ? 'Dinarski kes je obavezan za male kafane. Kuver se naplacuje odvojeno u nekim tradicionalnim mestima.'
          : 'Cash in Dinars is highly recommended for traditional kafanas. Cover charge (kuver) is common.',
        isSR
          ? 'Prilikom nazdravljanja uvek gledajte sagovornika u oci. Ziveli je univerzalni pozdrav reka rakije.'
          : 'Always lock eyes when making a toast with Rakia. Say "Ziveli!" with confidence.'
      ];
    }
    if (norm.includes('nature') || norm.includes('adventure')) {
      return [
        isSR
          ? 'Nosite flasicu vode sa sobom i planirajte rane jutarnje obilaske pre nego sto sunce dostigne vrhunac.'
          : 'Carry a water bottle and schedule hiking trips on Mt. Tara early before peak midday sun.',
        isSR
          ? 'Skinite lokalne offline mape pre ulaska u planinske kanjone jer mreza zna da oslabi.'
          : 'Download offline regional maps prior to entering mountain gorges as reception drops out.'
      ];
    }
    if (norm.includes('history') || norm.includes('culture') || norm.includes('place')) {
      return [
        isSR
          ? 'Obucite se skromno prilikom posete manastirima (pokrijte ramena i kolena) iz postovanja prema tradiciji.'
          : 'Dress modestly (shoulders & knees covered) when exploring Serbian monasteries to honor legacy.',
        isSR
          ? 'Muzeji ponedeljkom obicno ne rade. Rezervisite karte za Teslin muzej unapred jer su grupe limitirane.'
          : 'Museums are typically closed on Mondays. Pre-book Nikola Tesla Museum tours online due to group sizes.'
      ];
    }
    return [
      isSR
        ? 'Koristite iskljucivo zvanicne TAXI stanice ili narucite voznju preko Cargo ili Pink aplikacije.'
        : 'Use official TAXI stands or request rides strictly via the CarGo or Pink Taxi apps to prevent scams.',
      isSR
        ? 'Zvanicna valuta je srpski dinar (RSD). Menjacnice u gradu imaju znatno povoljniji kurs od aerodroma.'
        : 'The legal tender is Serbian Dinar (RSD). Local exchange bureaus (Menjacnica) offer best market rates.'
    ];
  };

  const getWeatherForecast = (month: number, lang: string) => {
    let tempRange = '';
    let advise = '';
    let day1 = '';
    let day2 = '';
    let day3 = '';
    
    if (month >= 5 && month <= 8) {
      tempRange = '26 - 32 C (Hot & Sunny)';
      day1 = 'Sunny / 28 C';
      day2 = 'Sunny / 31 C';
      day3 = 'Partly Cloudy / 29 C';
      advise = lang === 'sr' 
        ? 'Preporucuje se lagana lanena odeca, naocare za sunce i dobra hidratacija za vrele beogradske popodneve pored reka.'
        : 'Light linen clothing, sunglasses, and proper hydration are advised for warm Belgrade afternoons by the rivers.';
    } else if (month >= 2 && month <= 4) {
      tempRange = '14 - 22 C (Mild & Breezy)';
      day1 = 'Mild Rain / 16 C';
      day2 = 'Sunny / 19 C';
      day3 = 'Mild / 21 C';
      advise = lang === 'sr'
        ? 'Slojevito oblacenje i lagana jesenja jakna sa kisobranom za promenljivo balkansko prolecno vreme.'
        : 'Layered clothing, a light spring jacket, and a portable umbrella are ideal for changeable Balkan spring weather.';
    } else if (month >= 9 && month <= 10) {
      tempRange = '10 - 18 C (Crisp & Autumnal)';
      day1 = 'Overcast / 13 C';
      day2 = 'Sunny / 16 C';
      day3 = 'Rain / 12 C';
      advise = lang === 'sr'
        ? 'Topla slojevitija odeca, sal i vetrovka za prohladne vetrovite kosava ekspedicije setalistima.'
        : 'Warm layers, a cozy scarf, and a windbreaker are perfect for crisp windward Kosava breeze expeditions.';
    } else {
      tempRange = '0 - 6 C (Cold & Snowy)';
      day1 = 'Light Snow / 2 C';
      day2 = 'Freezing / -1 C';
      day3 = 'Overcast / 3 C';
      advise = lang === 'sr'
        ? 'Zimska odeca, kapa, rukavice i topli salovi za istrazivanje beogradskih kafana u zimskoj idili.'
        : 'Heavy winter coat, thermal gloves, and a wool beanie for discovering cozy Belgrade kafanas in winter.';
    }
  
    return { tempRange, advise, day1, day2, day3 };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // distance in km
  };

  const findCompanionRecommendation = (currentItem: any) => {
    if (!currentItem.coordinates || typeof currentItem.coordinates.lat !== 'number' || typeof currentItem.coordinates.lng !== 'number') {
      return null;
    }
    const all = allRecommendations || [];
    let bestMatch: any = null;
    let minDistance = 30.0; // max 30 km straight line
    
    all.forEach((r: any) => {
      if (r.id === currentItem.id || !r.coordinates || typeof r.coordinates.lat !== 'number' || typeof r.coordinates.lng !== 'number') {
        return;
      }
      const dist = calculateDistance(
        currentItem.coordinates.lat,
        currentItem.coordinates.lng,
        r.coordinates.lat,
        r.coordinates.lng
      );
      if (dist > 0 && dist <= minDistance) {
        minDistance = dist;
        bestMatch = r;
      }
    });
    
    if (bestMatch) {
      return { item: bestMatch, distance: minDistance };
    }
    return null;
  };

  const generatePdfDocument = async () => {
    if (scheduledItems.length === 0) return null;

    // Use direct current Mood Orb coordinates passed from state
    const pdfOrbitX = orbitX !== undefined ? orbitX : 0.5;
    const pdfOrbitY = orbitY !== undefined ? orbitY : 0.5;

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    }) as any;

    const pageHeight = 297;
    const pageWidth = 210;

    // Use English fallback for Chinese Mandarin and Russian Cyrillic since jsPDF Helvetica doesn't support Chinese or Cyrillic fonts.
    const pdfLang = (language === 'zh' || language === 'ru') ? 'en' : language;
    const activeT = TRANSLATIONS[pdfLang] || TRANSLATIONS['en'];

    const pdfLabels: Record<string, {
      title: string;
      subtitle: string;
      planItem: string;
      journeySnapshot: string;
      suggestedVisitFlow: string;
      whySelected: string;
      moodOrbContext: string;
      knowBeforeYouGo: string;
      culturalContext: string;
      typicalConditions: string;
      travelEssentials: string;
      practicalNotes: string;
      emergencyAssistance: string;
      moneyPayment: string;
      usefulPhrases: string;
      gettingThere: string;
      parking: string;
      taxiTransport: string;
      timeBudget: string;
      gettingThereLabel: string;
      enjoyingVisitLabel: string;
      gettingBackLabel: string;
      totalTimeLabel: string;
      approx: string;
      allowApprox: string;
      notSpecified: string;
      experienceFocusLabel: string;
      afterYourVisitTitle: string;
      afterYourVisitCopy: string;
    }> = {
      en: {
        title: "IDEMO — MY EVENT PLANNER",
        subtitle: "Your curated visit brief",
        planItem: "Plan item",
        journeySnapshot: "JOURNEY SNAPSHOT",
        suggestedVisitFlow: "SUGGESTED VISIT FLOW",
        whySelected: "WHY IDEMO SELECTED THIS",
        moodOrbContext: "MOOD ORB CONTEXT",
        knowBeforeYouGo: "KNOW BEFORE YOU GO",
        culturalContext: "CULTURAL CONTEXT",
        typicalConditions: "Typical conditions for this month",
        travelEssentials: "IDEMO — Travel Essentials",
        practicalNotes: "Practical notes for this plan",
        emergencyAssistance: "EMERGENCY & ASSISTANCE",
        moneyPayment: "MONEY & PAYMENT",
        usefulPhrases: "USEFUL SERBIAN PHRASES",
        gettingThere: "GETTING THERE & BACK",
        parking: "PARKING",
        taxiTransport: "TAXI & LOCAL TRANSPORT",
        timeBudget: "TIME BUDGET",
        gettingThereLabel: "Getting there",
        enjoyingVisitLabel: "Enjoying the visit",
        gettingBackLabel: "Getting back",
        totalTimeLabel: "Total time to plan",
        approx: "Approx.",
        allowApprox: "Allow approx.",
        notSpecified: "Not specified",
        experienceFocusLabel: "Experience focus",
        afterYourVisitTitle: "AFTER YOUR VISIT",
        afterYourVisitCopy: "Help IDEMO keep this recommendation accurate. After visiting, update the Mood Orb if your pace or preferred atmosphere changed, then leave a short note about what was accurate, what changed, or what future visitors should know."
      },
      sr: {
        title: "IDEMO — MOJ PLANER DOGADAJA",
        subtitle: "Vas kustoski izvestaj o poseti",
        planItem: "Stavka plana",
        journeySnapshot: "PREGLED PUTOVANJA",
        suggestedVisitFlow: "PREDLOZENI TOK POSETE",
        whySelected: "ZASTO JE IDEMO IZABRAO OVO",
        moodOrbContext: "MOOD ORB KONTEKST",
        knowBeforeYouGo: "SRECAN PUT: VAZNE INFORMACIJE",
        culturalContext: "KULTURNI KONTEKST",
        typicalConditions: "Tipicni uslovi za ovaj mesec",
        travelEssentials: "IDEMO — Travel Essentials",
        practicalNotes: "Practical notes for this plan",
        emergencyAssistance: "HITNE SLUZBE I POMOC",
        moneyPayment: "NOVAC I PLACANJE",
        usefulPhrases: "KORISNE FRAZE NA SRPSKOM",
        gettingThere: "DOLAZAK I POVRATAK",
        parking: "PARKING",
        taxiTransport: "TAKSI I LOKALNI PREVOZ",
        timeBudget: "VREMENSKI BUDZET",
        gettingThereLabel: "Dolazak",
        enjoyingVisitLabel: "Uzivanje u poseti",
        gettingBackLabel: "Povratak",
        totalTimeLabel: "Ukupno vreme za plan",
        approx: "Oko",
        allowApprox: "Planirajte oko",
        notSpecified: "Nije navedeno",
        experienceFocusLabel: "Fokus iskustva",
        afterYourVisitTitle: "NAKON VASE POSETE",
        afterYourVisitCopy: "Pomozite IDEMO-u da ova preporuka ostane tacna. Nakon posete, azurirajte Mood Orb ako su se vas tempo ili zeljena atmosfera promenili, a zatim ostavite kratku belesku o tome sta je bilo tacno, sta se promenilo ili sta bi buduci posetioci trebali da znaju."
      },
      de: {
        title: "IDEMO — MEIN EVENT-PLANER",
        subtitle: "Ihr kuratiertes Besuchs-Briefing",
        planItem: "Planpunkt",
        journeySnapshot: "REISE-SCHNAPPSCHUSS",
        suggestedVisitFlow: "EMPFOHLENER BESUCHSABLAUF",
        whySelected: "WARUM IDEMO DIES GEWAEHLT HAT",
        moodOrbContext: "MOOD ORB KONTEXT",
        knowBeforeYouGo: "WISSENSWERTES VORAB",
        culturalContext: "KULTURELLER KONTEXT",
        typicalConditions: "Typische Bedingungen fuer diesen Monat",
        travelEssentials: "IDEMO — Travel Essentials",
        practicalNotes: "Practical notes for this plan",
        emergencyAssistance: "NOTFALL & HILFE",
        moneyPayment: "GELD & BEZAHLUNG",
        usefulPhrases: "NUETZLICHE SERBISCHE PHRASEN",
        gettingThere: "AN- & ABREISE",
        parking: "PARKEN",
        taxiTransport: "TAXI & LOKALER TRANSPORT",
        timeBudget: "ZEITBUDGET",
        gettingThereLabel: "Anreise",
        enjoyingVisitLabel: "Aufenthaltszeit",
        gettingBackLabel: "Rueckreise",
        totalTimeLabel: "Gesamtzeit fuer den Plan",
        approx: "Ca.",
        allowApprox: "Planen Sie ca.",
        notSpecified: "Nicht angegeben",
        experienceFocusLabel: "Erlebnisfokus",
        afterYourVisitTitle: "NACH IHREM BESUCH",
        afterYourVisitCopy: "Helfen Sie IDEMO, diese Empfehlung aktuell zu halten. Aktualisieren Sie nach Ihrem Besuch das Mood Orb, falls sich Ihr Tempo oder Ihre bevorzugte Atmosphaere geandert haben, und hinterlassen Sie eine kurze Notiz darueber, was zutreffend war, was sich geaendert hat oder was zukuenftige Besucher wissen sollten."
      },
      ru: {
        title: "IDEMO — MOJ PLANER DOGADAJA",
        subtitle: "Vash kurirovannyj kratkij obzor",
        planItem: "Punkt plana",
        journeySnapshot: "OBZOR POEZDKI",
        suggestedVisitFlow: "REKOMENDUEMYJ PLAN POSEWENIYA",
        whySelected: "POCHEMU IDEMO VYBRAL ETO",
        moodOrbContext: "MOOD ORB KONTEKST",
        knowBeforeYouGo: "CHTO NUZHNO ZNAT` PERED POEZDKOJ",
        culturalContext: "KUL`TURNYJ KONTEKST",
        typicalConditions: "Tipichnye usloviya dlya etogo mesyaca",
        travelEssentials: "IDEMO — Travel Essentials",
        practicalNotes: "Practical notes for this plan",
        emergencyAssistance: "AVARIJNYE SLUZHBY I POMOW`",
        moneyPayment: "DEN`GI I OPLATA",
        usefulPhrases: "POLEZNYE SERBSKIE FRAZY",
        gettingThere: "KAK DOBRAT`SYA I VERNUT`SYA",
        parking: "PARKOVKA",
        taxiTransport: "TAKSI I MESTNYJ TRANSPORT",
        timeBudget: "VREMENSKIJ BYUDZHET",
        gettingThereLabel: "Doroga tuda",
        enjoyingVisitLabel: "Vremya na meste",
        gettingBackLabel: "Obratnyj put`",
        totalTimeLabel: "Obwee vremya na plan",
        approx: "Pribl.",
        allowApprox: "Zaplanirujte pribl.",
        notSpecified: "Ne ukazano",
        experienceFocusLabel: "Fokus opyta",
        afterYourVisitTitle: "POSLE VASEJ POEZDKI",
        afterYourVisitCopy: "Pomogite IDEMO sohranit` etu rekomendaciyu tochnoj. Posle poseweniya nastrojte Mood Orb, esli vash temp ili predpochitaemaya atmosfera izmenilis`, a zatem ostav'te korotkuyu zametku o tom, chto bylo tochno, chto izmenilos` ili chto sleduet znat` buduwim posetitelyam."
      },
      es: {
        title: "IDEMO — MI PLANIFICADOR",
        subtitle: "Su informe de visita personalizado",
        planItem: "Elemento del plan",
        journeySnapshot: "RESUMEN DEL VIAJE",
        suggestedVisitFlow: "FLUJO DE VISITA RECOMENDADO",
        whySelected: "POR QUE IDEMO SELECCIONO ESTO",
        moodOrbContext: "CONTEXTO MOOD ORB",
        knowBeforeYouGo: "INFORMACION CLAVE",
        culturalContext: "CONTEXTO CULTURAL",
        typicalConditions: "Condiciones tipicas para este mes",
        travelEssentials: "IDEMO — Travel Essentials",
        practicalNotes: "Practical notes for this plan",
        emergencyAssistance: "EMERGENCIA Y ASISTENCIA",
        moneyPayment: "DINERO Y PAGO",
        usefulPhrases: "FRASES UTILES EN SERBIO",
        gettingThere: "COMO LLEGAR Y VOLVER",
        parking: "ESTACIONAMIENTO",
        taxiTransport: "TAXI Y TRANSPORTE LOCAL",
        timeBudget: "PRESUPUESTO DE TIEMPO",
        gettingThereLabel: "Llegada",
        enjoyingVisitLabel: "Disfrutando la visita",
        gettingBackLabel: "Regreso",
        totalTimeLabel: "Tiempo total del plan",
        approx: "Aprox.",
        allowApprox: "Reserve aprox.",
        notSpecified: "No especificado",
        experienceFocusLabel: "Enfoque de experiencia",
        afterYourVisitTitle: "DESPUES DE SU VISITA",
        afterYourVisitCopy: "Ayude a IDEMO a mantener esta recomendacion precisa. Despues de su visita, actualice el Mood Orb si su ritmo o la atmosfera de su preferencia cambiaron, luego deje una breve nota sobre lo que fue preciso, lo que cambio o lo que los futuros visitantes deberian saber."
      }
    };

    const pL = pdfLabels[pdfLang] || pdfLabels['en'];

    const getKnowBeforeYouGoBullets = (recItem: any, lang: string) => {
      const isSR = lang === 'sr';
      const isDE = lang === 'de';
      const isRU = lang === 'ru';
      const isES = lang === 'es';
      
      const bulletsList: string[] = [];
      const categoryTips = getCategoryTips(recItem.category, lang);
      if (categoryTips && categoryTips[0]) {
        bulletsList.push(categoryTips[0]);
      }
      
      if (recItem.preferredTransport) {
        if (isSR) {
          bulletsList.push(`Preporuceni nacin transporta: ${recItem.preferredTransport}.`);
        } else if (isDE) {
          bulletsList.push(`Empfohlenes Transportmittel: ${recItem.preferredTransport}.`);
        } else if (isRU) {
          bulletsList.push(`Rekomenduemyj transport: ${recItem.preferredTransport}.`);
        } else if (isES) {
          bulletsList.push(`Transporte recomendado: ${recItem.preferredTransport}.`);
        } else {
          bulletsList.push(`Recommended mode of transport: ${recItem.preferredTransport}.`);
        }
      } else if (categoryTips && categoryTips[1]) {
        bulletsList.push(categoryTips[1]);
      }
      
      if (isSR) {
        bulletsList.push(`Ova lokacija se nalazi u regiji ${recItem.location || 'Srbija'}. Planirajte u skladu sa tim.`);
      } else if (isDE) {
        bulletsList.push(`Dieser Ort befindet sich in der Region ${recItem.location || 'Serbien'}. Planen Sie entsprechend.`);
      } else if (isRU) {
        bulletsList.push(`Eto mesto nahoditsya v regione ${recItem.location || 'Serbiya'}. Zaplanirujte zaranee.`);
      } else if (isES) {
        bulletsList.push(`Este lugar se encuentra en la region de ${recItem.location || 'Serbia'}. Planifique en consecuencia.`);
      } else {
        bulletsList.push(`This location is situated in ${recItem.location || 'Serbia'}. Please plan accordingly.`);
      }
      
      return bulletsList;
    };

    const activeMapping = { estimated_weather: 'Estimated weather' };

    const drawMoodField = (x: number, y: number, w: number, plotX: number, plotY: number, dotColor: number[], caption: string, lang: string, isUserMoodField: boolean = false) => {
      // 1. Draw outer border
      doc.setDrawColor(220, 218, 208); // light beige border
      doc.setFillColor(252, 251, 247); // off-white fill
      doc.setLineWidth(0.15);
      doc.rect(x, y, w, w, 'FD');

      // 2. Draw crosshairs
      doc.setDrawColor(235, 233, 224); // even lighter lines for grid
      doc.setLineWidth(0.12);
      doc.line(x, y + w / 2, x + w, y + w / 2); // horizontal
      doc.line(x + w / 2, y, x + w / 2, y + w); // vertical

      // 3. Draw Axis Labels
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(4.5);
      doc.setTextColor(140, 138, 125);

      // Translations for axis labels
      const labelCalm = lang === 'sr' ? "Mirno" : lang === 'de' ? "Ruhig" : lang === 'ru' ? "Spokoyno" : lang === 'es' ? "Calma" : "Calm";
      const labelEnergetic = lang === 'sr' ? "Aktivno" : lang === 'de' ? "Energisch" : lang === 'ru' ? "Aktivno" : lang === 'es' ? "Energia" : "Energetic";
      const labelUrban = lang === 'sr' ? "Urbano" : lang === 'de' ? "Urban" : lang === 'ru' ? "Urbano" : lang === 'es' ? "Urbano" : "Urban";
      const labelNature = lang === 'sr' ? "Priroda" : lang === 'de' ? "Natur" : lang === 'ru' ? "Priroda" : lang === 'es' ? "Naturaleza" : "Nature";

      // Position label texts:
      // Urban: centered above the box
      doc.text(sanitizePdfText(labelUrban), x + w / 2, y - 1, { align: 'center' });
      // Nature: centered below the box
      doc.text(sanitizePdfText(labelNature), x + w / 2, y + w + 2.2, { align: 'center' });
      // Calm: right-aligned left of the box
      doc.text(sanitizePdfText(labelCalm), x - 0.8, y + w / 2 + 0.6, { align: 'right' });
      // Energetic: left-aligned right of the box
      doc.text(sanitizePdfText(labelEnergetic), x + w + 0.8, y + w / 2 + 0.6, { align: 'left' });

      // 4. Draw Caption above Urban label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.0);
      doc.setTextColor(30, 46, 32); // deep green
      const wrappedCaption = doc.splitTextToSize(sanitizePdfText(caption.toUpperCase()), w + 8);
      const captionY = y - 4 - (wrappedCaption.length - 1) * 2;
      doc.text(wrappedCaption, x + w / 2, captionY, { align: 'center' });

      if (isUserMoodField) {
        const r = 2.05; // radius of mini watch face in mm
        const dialR = r - 0.22; // radius of dial in mm

        // 5.1. Base white halo ring
        doc.setFillColor(255, 255, 255);
        doc.circle(plotX, plotY, r + 0.15, 'F');

        // 5.2. Outer bezel ring (titanium/silver)
        doc.setDrawColor(140, 138, 125);
        doc.setFillColor(15, 23, 30); // deep dark slate
        doc.setLineWidth(0.24);
        doc.circle(plotX, plotY, r, 'FD');

        // 5.3. Dial split background (slate navy vs rose gold)
        doc.setFillColor(15, 23, 42); // slate navy
        doc.circle(plotX, plotY, dialR, 'F');

        // Semicircular wedge for top-right rose gold segment
        const numSegments = 16;
        const baseAngle = -22 * Math.PI / 180;
        doc.setFillColor(225, 29, 72); // rose gold pink
        for (let i = 0; i < numSegments; i++) {
          const angle1 = baseAngle + (i * Math.PI / numSegments);
          const angle2 = baseAngle + ((i + 1) * Math.PI / numSegments);
          doc.triangle(
            plotX, plotY,
            plotX + dialR * Math.cos(angle1), plotY + dialR * Math.sin(angle1),
            plotX + dialR * Math.cos(angle2), plotY + dialR * Math.sin(angle2),
            'F'
          );
        }

        // 5.4. White/silver seam line
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.06);
        doc.line(
          plotX + dialR * Math.cos(baseAngle),
          plotY + dialR * Math.sin(baseAngle),
          plotX - dialR * Math.cos(baseAngle),
          plotY - dialR * Math.sin(baseAngle)
        );

        // 5.5. Hour markings (luminous paint)
        doc.setFillColor(0, 240, 255); // luminescent cyan
        
        // Triangle index at 12 o'clock pointing down
        const triApexY = plotY - dialR + 0.12;
        doc.triangle(
          plotX, triApexY,
          plotX - 0.22, triApexY - 0.4,
          plotX + 0.22, triApexY - 0.4,
          'F'
        );

        // Baton/dot markings at 3, 6, 9
        const markerDist = dialR - 0.32;
        doc.circle(plotX + markerDist, plotY, 0.12, 'F');
        doc.circle(plotX, plotY + markerDist, 0.12, 'F');
        doc.circle(plotX - markerDist, plotY, 0.12, 'F');

        // 5.6. Clock hands (Hour, Minute, and Second sweeping hands)
        // Hour Hand pointing to 10 o'clock (-140 degrees)
        const hrAngle = -140 * Math.PI / 180;
        doc.setDrawColor(244, 244, 245);
        doc.setLineWidth(0.18);
        doc.line(plotX, plotY, plotX + (dialR * 0.48) * Math.cos(hrAngle), plotY + (dialR * 0.48) * Math.sin(hrAngle));
        // Mercedes circular emblem
        doc.setFillColor(244, 244, 245);
        doc.circle(plotX + (dialR * 0.32) * Math.cos(hrAngle), plotY + (dialR * 0.32) * Math.sin(hrAngle), 0.18, 'F');

        // Minute Hand pointing to ~10 past (35 degrees)
        const minAngle = 35 * Math.PI / 180;
        doc.setLineWidth(0.12);
        doc.line(plotX, plotY, plotX + (dialR * 0.72) * Math.cos(minAngle), plotY + (dialR * 0.72) * Math.sin(minAngle));

        // Sweep Second Hand pointing to 215 degrees
        const secAngle = 215 * Math.PI / 180;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.04);
        doc.line(plotX, plotY, plotX + (dialR * 0.8) * Math.cos(secAngle), plotY + (dialR * 0.8) * Math.sin(secAngle));
        // Lollipop dot
        doc.setFillColor(0, 240, 255);
        doc.circle(plotX + (dialR * 0.58) * Math.cos(secAngle), plotY + (dialR * 0.58) * Math.sin(secAngle), 0.14, 'F');

        // 5.7. Center pinion cap
        doc.setFillColor(255, 255, 255);
        doc.circle(plotX, plotY, 0.24, 'F');
      } else {
        // 5. Draw plotted Dot with a white background halo ring for high definition print
        doc.setFillColor(255, 255, 255);
        doc.circle(plotX, plotY, 1.1, 'F');

        // Solid colored dot
        doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
        doc.circle(plotX, plotY, 0.75, 'F');
      }
    };

    for (let idx = 0; idx < scheduledItems.length; idx++) {
      if (idx > 0) {
        doc.addPage();
      }

      const item = scheduledItems[idx];
      
      const testDate = item.scheduledDate ? new Date(item.scheduledDate) : new Date(2027, 5, 15);
      const year = testDate.getFullYear();
      const month = testDate.getMonth();
      const day = testDate.getDate();

      // 1. Draw elegant IDEMO background watermark
      drawIdemoWatermark(doc, pageWidth / 2, pageHeight / 2, 2.1);

      // Header Banner block (stretching full-width across margins)
      doc.setFillColor(30, 46, 32);
      doc.rect(15, 12, 180, 20, 'F');
      
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(250, 249, 245);
      doc.text(sanitizePdfText(pL.title), 20, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(174, 187, 175);
      doc.text(sanitizePdfText(pL.subtitle.toUpperCase()), 20, 23);
      doc.text(sanitizePdfText(`Plan item ${idx + 1} of ${scheduledItems.length}`.toUpperCase()), 20, 27);

      let titleVal = sanitizePdfText(getLocalizedValue(item, 'title', pdfLang) || item.title || '');
      if (item.isAvailable === false) {
        const unavailableTag = pdfLang === 'sr' ? '[Arhivirano / Nije dostupno]' : '[Archived / Unavailable]';
        titleVal = `${unavailableTag} ${titleVal}`;
      }
      const locationVal = sanitizePdfText(getLocalizedValue(item, 'location', pdfLang) || item.location || '');
      const categoryVal = sanitizePdfText(formatCategory(item.category, activeT) || item.category || '');

      // --- ROW 1: GRID ROW AT y = 37 ---
      doc.setFillColor(252, 251, 248);
      doc.setDrawColor(220, 218, 208);
      doc.setLineWidth(0.25);
      doc.rect(15, 37, 58, 42, 'FD');

      let imgBase64: string | null = null;
      if (item.image) {
        imgBase64 = await urlToBase64Cover(item.image, 56, 40);
      }

      if (imgBase64) {
        try {
          doc.addImage(imgBase64, 'PNG', 16, 38, 56, 40);
        } catch {
          drawCompassFallback(doc, 15, 37, 58, 42);
        }
      } else {
        drawCompassFallback(doc, 15, 37, 58, 42);
      }

      // Col 2: Info Card
      doc.setFillColor(252, 251, 248);
      doc.rect(77, 37, 66, 42, 'FD');
      
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 46, 32);
      const wrappedTitle = doc.splitTextToSize(titleVal, 62);
      doc.text(wrappedTitle, 80, 43);

      const titleHeightOffset = wrappedTitle.length > 1 ? 8 : 4;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(220, 38, 38);
      doc.text(categoryVal.toUpperCase(), 80, 43 + titleHeightOffset);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(92, 94, 84);
      doc.text(sanitizePdfText(`Location: ${locationVal}`), 80, 51 + (titleHeightOffset > 4 ? 4 : 0));
      doc.text(sanitizePdfText(`Journey Time: ${item.travelTime || 'Flexible'}`), 80, 56 + (titleHeightOffset > 4 ? 4 : 0));
      doc.text(sanitizePdfText(`Transit Mode: ${item.preferredTransport || 'Car/Walk'}`), 80, 61 + (titleHeightOffset > 4 ? 4 : 0));
      doc.text(sanitizePdfText(`Est. Investment: ${item.estimatedCost || 'Curated'}`), 80, 66 + (titleHeightOffset > 4 ? 4 : 0));

      if (item.coordinates) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(140, 138, 125);
        doc.text(`GPS: Lat ${item.coordinates.lat.toFixed(4)}, Lng ${item.coordinates.lng.toFixed(4)}`, 80, 71 + (titleHeightOffset > 4 ? 4 : 0));
      }

      // Col 3: Calendar Widget
      drawCalendar(doc, 147, 37, 48, 42, year, month, day, pdfLang);

      // --- ROW 2: SPLIT TWO-COLUMN DYNAMIC FLOW (y = 84 to 234) ---
      doc.setDrawColor(229, 227, 219);
      doc.setLineWidth(0.4);
      doc.line(15, 83, 195, 83);

      // LEFT COLUMN: x = 15, width = 85
      let leftY = 85;

      // 1. TIME BUDGET
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.timeBudget), 15, leftY + 3);
      doc.line(15, leftY + 5, 100, leftY + 5);

      const formatDuration = (mins: number, lang: string): string => {
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        if (lang === 'sr') {
          return hrs > 0 ? `${hrs}c ${m}m` : `${m}m`;
        } else if (lang === 'de') {
          return hrs > 0 ? `${hrs} Std. ${m} Min.` : `${m} Min.`;
        } else if (lang === 'ru') {
          return hrs > 0 ? `${hrs} ch. ${m} min.` : `${m} min.`;
        } else if (lang === 'es') {
          return hrs > 0 ? `${hrs}h ${m}min` : `${m}min`;
        } else if (lang === 'zh') {
          return hrs > 0 ? `${hrs} xiao shi ${m} fen` : `${m} fen`;
        } else {
          return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
        }
      };

      const hasTravelTime = !!item.travelTime && item.travelTime.trim().length > 0;
      const travelTimeText = hasTravelTime ? item.travelTime : pL.notSpecified;

      const hasVisitDuration = (typeof item.recommendedVisitDuration === 'number' && item.recommendedVisitDuration > 0) || (!!item.duration && item.duration.trim().length > 0);
      const visitDurationText = (typeof item.recommendedVisitDuration === 'number' && item.recommendedVisitDuration > 0)
        ? formatDuration(item.recommendedVisitDuration, pdfLang)
        : (item.duration || pL.notSpecified);

      let budgetY = leftY + 10;

      // First line: Getting there
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(92, 94, 84);
      doc.text(sanitizePdfText(`${pL.gettingThereLabel}:`), 15, budgetY);
      doc.setFont('helvetica', 'normal');
      if (hasTravelTime) {
        doc.text(sanitizePdfText(`${pL.approx} ${travelTimeText}`), 45, budgetY);
      } else {
        doc.text(sanitizePdfText(travelTimeText), 45, budgetY);
      }
      budgetY += 5.5;

      // Second line: Enjoying the visit
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizePdfText(`${pL.enjoyingVisitLabel}:`), 15, budgetY);
      doc.setFont('helvetica', 'normal');
      if (hasVisitDuration) {
        doc.text(sanitizePdfText(`${pL.approx} ${visitDurationText}`), 45, budgetY);
      } else {
        doc.text(sanitizePdfText(visitDurationText), 45, budgetY);
      }
      budgetY += 5.5;

      // Third line: Getting back
      doc.setFont('helvetica', 'bold');
      doc.text(sanitizePdfText(`${pL.gettingBackLabel}:`), 15, budgetY);
      doc.setFont('helvetica', 'normal');
      if (hasTravelTime) {
        doc.text(sanitizePdfText(`${pL.allowApprox} ${travelTimeText}`), 45, budgetY);
      } else {
        doc.text(sanitizePdfText(travelTimeText), 45, budgetY);
      }
      budgetY += 5.5;

      // Fourth line: Total time (optional)
      const hasNumericDurations = typeof item.travelTimeMinutes === 'number' && typeof item.recommendedVisitDuration === 'number' && item.travelTimeMinutes > 0 && item.recommendedVisitDuration > 0;
      if (hasNumericDurations) {
        const totalMins = item.travelTimeMinutes * 2 + item.recommendedVisitDuration;
        const totalDurationText = formatDuration(totalMins, pdfLang);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 46, 32); // deep green accent
        doc.text(sanitizePdfText(`${pL.totalTimeLabel}:`), 15, budgetY);
        doc.text(sanitizePdfText(`${pL.approx} ${totalDurationText}`), 45, budgetY);
        doc.setTextColor(92, 94, 84); // restore standard color
        budgetY += 5.5;
      }

      // Fifth line: Experience focus (compact, directly below TIME BUDGET)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 46, 32); // deep green accent
      doc.text(sanitizePdfText(`${pL.experienceFocusLabel}:`), 15, budgetY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(92, 94, 84);
      const focusText = `${categoryVal} — ${titleVal}`;
      const wrappedFocusText = doc.splitTextToSize(sanitizePdfText(focusText), 54);
      doc.text(wrappedFocusText, 45, budgetY);
      budgetY += (wrappedFocusText.length * 4) + 1;

      leftY = budgetY + 1;

      // 2. Why IDEMO Selected This
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.whySelected), 15, leftY + 3);
      doc.line(15, leftY + 5, 100, leftY + 5);

      const whyText = pdfLang === 'sr'
        ? "Izabrano iz vasih trenutnih IDEMO preporuka i sacuvanog planera dogadaja."
        : pdfLang === 'de'
        ? "Ausgewaehlt aus Ihren aktuellen IDEMO-Empfehlungen und Ihrem gespeicherten Event-Planer."
        : pdfLang === 'ru'
        ? "Vybrano iz vashih tekushih rekomendacij IDEMO i sohranennogo planera sobytij."
        : pdfLang === 'es'
        ? "Seleccionado de sus recomendaciones actuales de IDEMO y planificador de eventos guardado."
        : "Selected from your current IDEMO recommendations and saved event planner.";

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(92, 94, 84);
      const wrappedWhy = doc.splitTextToSize(sanitizePdfText(whyText), 85);
      doc.text(wrappedWhy, 15, leftY + 10);

      leftY += 10 + (wrappedWhy.length * 4) + 4;

      // 3. Mood Orb Context
      const hasMoodData = pdfOrbitX !== undefined && pdfOrbitY !== undefined;
      if (hasMoodData) {
        doc.setFont('times', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 46, 32);
        doc.text(sanitizePdfText(pL.moodOrbContext), 15, leftY + 3);
        doc.line(15, leftY + 5, 100, leftY + 5);

        // Under Mood Orb Context, keep compact text:
        const moodText = pdfLang === 'sr'
          ? "Ovaj plan odrazava vasu trenutnu kalibraciju Mood Orb-a. Prilagodite Mood Orb kada se vasa energija, tempo ili zeljeni ambijent promene; IDEMO ce u skladu sa tim prilagoditi buduce preporuke."
          : pdfLang === 'de'
          ? "Dieser Plan spiegelt Ihre aktuelle Mood-Orb-Kalibrierung wider. Passen Sie das Mood Orb an, wenn sich Ihre Energie, Ihr Tempo oder Ihre bevorzugte Atmosphaere aendern; IDEMO wird zukuenftige Empfehlungen entsprechend anpassen."
          : pdfLang === 'ru'
          ? "Etot plan otrazhaet vashu tekushuyu kalibrovku Mood Orb. Nastrojte Mood Orb, esli vash uroven` energii, temp ili predpochitaemaya atmosfera izmenyatsya; IDEMO skorrektiruet buduwie rekomendacii."
          : pdfLang === 'es'
          ? "Este plan refleja su calibracion actual de Mood Orb. Ajuste el Mood Orb cuando su energia, ritmo o atmosfera de preferencia cambien; IDEMO adaptara las futuras recomendaciones en consecuencia."
          : "This plan reflects your current Mood Orb calibration. Adjust the Mood Orb when your energy, pace, or preferred atmosphere changes; IDEMO will adapt future recommendations accordingly.";

        const hasRecCoords = 
          typeof item.coordinateX === 'number' && 
          typeof item.coordinateY === 'number' && 
          !isNaN(item.coordinateX) && 
          !isNaN(item.coordinateY) && 
          isFinite(item.coordinateX) && 
          isFinite(item.coordinateY);
        const textWidth = hasRecCoords ? 41 : 56;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.2);
        doc.setTextColor(92, 94, 84);
        const wrappedMood = doc.splitTextToSize(sanitizePdfText(moodText), textWidth);
        doc.text(wrappedMood, 15, leftY + 10);

        const textBlockHeight = 10 + (wrappedMood.length * 3.8);
        let visualsBlockHeight = 0;

        if (hasRecCoords) {
          visualsBlockHeight = 12 + 14 + 4.5; // ~30.5mm
          
          const caption1 = pdfLang === 'sr' ? "Trenutna kalibracija" : pdfLang === 'de' ? "Aktuelle Kalibrierung" : pdfLang === 'ru' ? "Tekushchaya kalibrovka" : pdfLang === 'es' ? "Calibracion actual" : "Your current calibration";
          const caption2 = pdfLang === 'sr' ? "Pozicija preporuke" : pdfLang === 'de' ? "Position dieser Empfehlung" : pdfLang === 'ru' ? "Poziciya rekomendacii" : pdfLang === 'es' ? "Posicion de esta recomendacion" : "This recommendation's position";

          // Panel 1: User Mood Orb at x = 58, y = leftY + 12
          const plotX1 = 58 + pdfOrbitX * 14;
          const plotY1 = leftY + 12 + pdfOrbitY * 14;
          drawMoodField(58, leftY + 12, 14, plotX1, plotY1, [30, 46, 32], caption1, pdfLang, true);

          // Panel 2: Recommendation Field at x = 83, y = leftY + 12
          const normX = (item.coordinateX + 5) / 10;
          const normY = (5 - item.coordinateY) / 10;
          const plotX2 = 83 + normX * 14;
          const plotY2 = leftY + 12 + normY * 14;
          drawMoodField(83, leftY + 12, 14, plotX2, plotY2, [138, 31, 31], caption2, pdfLang);
        } else {
          visualsBlockHeight = 12 + 14 + 4.5; // ~30.5mm

          const caption1 = pdfLang === 'sr' ? "Trenutna kalibracija" : pdfLang === 'de' ? "Aktuelle Kalibrierung" : pdfLang === 'ru' ? "Tekushchaya kalibrovka" : pdfLang === 'es' ? "Calibracion actual" : "Your current calibration";

          // Panel 1: User Mood Orb only, positioned at x = 75, y = leftY + 12
          const plotX1 = 75 + pdfOrbitX * 14;
          const plotY1 = leftY + 12 + pdfOrbitY * 14;
          drawMoodField(75, leftY + 12, 14, plotX1, plotY1, [30, 46, 32], caption1, pdfLang, true);
        }

        leftY += Math.max(textBlockHeight, visualsBlockHeight) + 4;
      }

      // 4. AFTER YOUR VISIT
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.afterYourVisitTitle), 15, leftY + 3);
      doc.line(15, leftY + 5, 100, leftY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(92, 94, 84);
      const wrappedAfterVisit = doc.splitTextToSize(sanitizePdfText(pL.afterYourVisitCopy), 85);
      doc.text(wrappedAfterVisit, 15, leftY + 10);
      leftY += 10 + (wrappedAfterVisit.length * 3.5) + 4;


      // RIGHT COLUMN: x = 110, width = 85
      let rightY = 85;

      // 1. Know Before You Go
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.knowBeforeYouGo), 110, rightY + 3);
      doc.line(110, rightY + 5, 195, rightY + 5);

      const knowBullets = getKnowBeforeYouGoBullets(item, pdfLang);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(92, 94, 84);
      let knowY = rightY + 10;
      knowBullets.forEach(bullet => {
        const wrappedBullet = doc.splitTextToSize(sanitizePdfText(`• ${bullet}`), 85);
        doc.text(wrappedBullet, 110, knowY);
        knowY += (wrappedBullet.length * 4) + 1.5;
      });

      rightY = knowY + 3;

      // 2. Cultural Context
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.culturalContext), 110, rightY + 3);
      doc.line(110, rightY + 5, 195, rightY + 5);

      const descVal = getLocalizedValue(item, 'shortDescription', pdfLang) || getLocalizedValue(item, 'longDescription', pdfLang) || item.shortDescription || item.longDescription || '';
      doc.setFont('times', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(92, 94, 84);
      const wrappedDesc = doc.splitTextToSize(sanitizePdfText(descVal), 85);
      const slicedDesc = wrappedDesc.slice(0, 5);
      doc.text(slicedDesc, 110, rightY + 10);

      rightY += 10 + (slicedDesc.length * 4) + 4;

      // 3. Cultural Fact Box (Only if verified fact exists)
      const hasVerifiedFact = !!(item.fact && typeof item.fact === 'string' && item.fact.trim() !== '' && !item.fact.includes('[fact]') && !item.fact.includes('[') && item.whyItMatters && typeof item.whyItMatters === 'string' && item.whyItMatters.trim() !== '' && !item.whyItMatters.includes('[whyItMatters]') && !item.whyItMatters.includes('['));

      if (hasVerifiedFact) {
        doc.setDrawColor(180, 195, 185);
        doc.setFillColor(252, 251, 247);
        doc.setLineWidth(0.25);
        
        let factText = sanitizePdfText(getLocalizedValue(item, 'fact', pdfLang) || item.fact || '');
        let whyText = sanitizePdfText(getLocalizedValue(item, 'whyItMatters', pdfLang) || item.whyItMatters || '');
        
        const wrappedFact = doc.splitTextToSize(`Fact: ${factText}`, 80);
        const wrappedWhy = doc.splitTextToSize(`Why: ${whyText}`, 80);
        
        const boxHeight = 8 + (wrappedFact.length * 3.5) + (wrappedWhy.length * 3.5);
        doc.rect(110, rightY, 85, boxHeight, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(120, 110, 80);
        doc.text(sanitizePdfText(pL.culturalContext.toUpperCase()), 113, rightY + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(92, 94, 84);
        
        doc.text(wrappedFact, 113, rightY + 8);
        doc.text(wrappedWhy, 113, rightY + 8 + (wrappedFact.length * 3.5) + 1);
        
        rightY += boxHeight + 4;
      }

      // 4. Typical Conditions for This Month (weather renamed)
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(pL.typicalConditions), 110, rightY + 3);
      doc.line(110, rightY + 5, 195, rightY + 5);

      const wx = getWeatherForecast(month, pdfLang);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 46, 32);
      doc.text(sanitizePdfText(`Average temp: ${wx.tempRange}`), 110, rightY + 10);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(92, 94, 84);
      const wrappedAdvise = doc.splitTextToSize(sanitizePdfText(wx.advise), 85);
      doc.text(wrappedAdvise, 110, rightY + 15);
      rightY += 15 + (wrappedAdvise.length * 4) + 4;

      // --- NEW ROW: COMPACT TRIP ESSENTIALS SECTION ---
      const dynamicColumnEndY = Math.max(leftY, rightY);
      let essentialsY = Math.max(dynamicColumnEndY + 4, 182);
      // Cap essentialsY to make sure it doesn't push the legal line off the page
      if (essentialsY > 228) {
        essentialsY = 228;
      }

      // Title & line
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 46, 32);
      doc.text("TRIP ESSENTIALS", 15, essentialsY + 3);
      doc.line(15, essentialsY + 5, 195, essentialsY + 5);

      const colY = essentialsY + 10;
      const colHeight = 29;

      // Draw the 4 Column Background Cards
      for (let c = 0; c < 4; c++) {
        const colX = 15 + c * 46; // 15, 61, 107, 153
        doc.setFillColor(252, 251, 248);
        doc.setDrawColor(220, 218, 208);
        doc.setLineWidth(0.25);
        doc.rect(colX, colY, 41, colHeight, 'FD');
      }

      // Column 1: EMERGENCY
      let colX1 = 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(220, 38, 38); // Emergency red
      doc.text("EMERGENCY", colX1 + 3, colY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("112", colX1 + 3, colY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(92, 94, 84);
      const emergencyDesc = pdfLang === 'sr'
        ? "Univerzalni broj za hitne slucajeve"
        : "Universal emergency number";
      const wrappedEmergency = doc.splitTextToSize(sanitizePdfText(emergencyDesc), 35);
      doc.text(wrappedEmergency, colX1 + 3, colY + 17);

      // Column 2: MONEY
      let colX2 = 61;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 46, 32);
      doc.text("MONEY", colX2 + 3, colY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text("RSD", colX2 + 3, colY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(92, 94, 84);
      const moneyDesc = pdfLang === 'sr'
        ? "Srpski Dinar (RSD). Kurs varira; proverite pre menjanja."
        : "Serbian Dinar (RSD). Exchange rates vary; check before exchanging money.";
      const wrappedMoney = doc.splitTextToSize(moneyDesc, 35);
      doc.text(wrappedMoney, colX2 + 3, colY + 17);

      // Column 3: USEFUL SERBIAN
      let colX3 = 107;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 46, 32);
      doc.text("USEFUL SERBIAN", colX3 + 3, colY + 5);

      // Dobar dan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.text("Dobar dan", colX3 + 3, colY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text("— Good day", colX3 + 3, colY + 12.5);

      // Hvala
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.text("Hvala", colX3 + 3, colY + 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text("— Thank you", colX3 + 3, colY + 19.5);

      // Racun, molim
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.2);
      doc.text("Racun, molim", colX3 + 3, colY + 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text("— The bill, please", colX3 + 3, colY + 26.5);

      // Column 4: GETTING THERE & BACK
      let colX4 = 153;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 46, 32);
      doc.text("GETTING THERE & BACK", colX4 + 3, colY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(92, 94, 84);
      doc.text("Transport:", colX4 + 3, colY + 10);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizePdfText(item.preferredTransport || pL.notSpecified), colX4 + 3, colY + 12.5);

      doc.setFont('helvetica', 'bold');
      doc.text("Travel Time:", colX4 + 3, colY + 17);
      doc.setFont('helvetica', 'normal');
      doc.text(sanitizePdfText(item.travelTime || pL.notSpecified), colX4 + 3, colY + 19.5);

      doc.setFont('helvetica', 'bold');
      doc.text("Location:", colX4 + 3, colY + 24);
      doc.setFont('helvetica', 'normal');
      const wrappedLoc = doc.splitTextToSize(sanitizePdfText(item.location || pL.notSpecified), 35);
      doc.text(wrappedLoc, colX4 + 3, colY + 26.5);

      const essentialsEndY = colY + colHeight;

      // --- ROW 3: Legal & Disclaimer ---
      const legalY = essentialsEndY + 4;
      doc.setDrawColor(229, 227, 219);
      doc.setLineWidth(0.3);
      doc.line(15, legalY, 195, legalY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(140, 138, 125);
      
      const disclaimerText = `${activeT.legal_disclaimer}: ${activeT.disclaimer_1} ${activeT.disclaimer_2}`;
      const wrappedDisclaimer = doc.splitTextToSize(sanitizePdfText(disclaimerText), 180);
      doc.text(wrappedDisclaimer, 15, legalY + 4);

      // A4 base line with Dynamic numbers
      doc.setDrawColor(229, 227, 219);
      doc.setLineWidth(0.4);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 138, 125);
      const footerText1 = sanitizePdfText('IDEMO — MY EVENT PLANNER');
      const footerText2 = sanitizePdfText(`Plan item ${idx + 1} of ${scheduledItems.length}`);
      doc.text(footerText1, 15, pageHeight - 10);
      doc.text(footerText2, pageWidth - 15 - doc.getTextWidth(footerText2), pageHeight - 10);
    }

    return doc;
  };

  const handleDownloadPDF = async () => {
    const doc = await generatePdfDocument();
    if (doc) {
      doc.save('idemo-travel-plan.pdf');
    }
  };

  const handlePrintPDF = async () => {
    if (scheduledItems.length === 0) return;
    const doc = await generatePdfDocument();
    if (!doc) return;

    try {
      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], 'idemo-event-planner.pdf', { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: language === 'sr' ? 'IDEMO Planer Događaja' : 'IDEMO Event Planner',
            text: language === 'sr' ? 'Pogledaj moj skrojeni plan za Srbiju!' : 'Check out my custom itinerary for Serbia!'
          });
          return;
        } catch (shareErr) {
          console.log('Native file sharing rejected', shareErr);
        }
      }
    } catch (blobErr) {
      console.error('Failed to prepare PDF blob for sharing', blobErr);
    }

    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      let opened = false;
      try {
        const newWin = window.open(blobUrl, '_blank');
        if (newWin && !newWin.closed) {
          newWin.focus();
          opened = true;
        }
      } catch (e) {
        console.log('window.open blocked or failed in WebView', e);
      }
      if (!opened) {
        doc.save('idemo-travel-plan.pdf');
      }
    } catch (tabErr) {
      console.log('Failed to open new tab or blob, downloading instead', tabErr);
      doc.save('idemo-travel-plan.pdf');
    }

    try {
      window.print();
    } catch (pErr) {
      console.warn('Direct iframe print blocked', pErr);
    }
  };

  return (
    <motion.div 
      className="flex-1 p-6 pt-10 space-y-8 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar relative"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      {/* Calendar Sync Status Toast Overlay */}
      <AnimatePresence>
        {calendarToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 border text-[#FAF9F5] px-5 py-3.5 bg-opacity-95 backdrop-blur-md rounded-2xl shadow-xl z-[150] flex items-center gap-2.5 text-[9px] font-bold uppercase tracking-wider select-none max-w-[90%] md:max-w-md ${
              calendarToast.type === 'success' 
                ? 'bg-[#1E2E20] border-[#3E5037]' 
                : calendarToast.type === 'warning'
                  ? 'bg-[#5B461E] border-[#8C6D34]'
                  : 'bg-[#5B1E1E] border-[#8C3434]'
            }`}
          >
            {calendarToast.type === 'success' ? (
              <CheckCircle size={14} className="text-accent-teal flex-shrink-0" />
            ) : calendarToast.type === 'warning' ? (
              <Info size={14} className="text-[#FBC02D] flex-shrink-0" />
            ) : (
              <X size={14} className="text-[#FF5252] flex-shrink-0" />
            )}
            <span>{calendarToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex justify-between items-start">
        <div className="space-y-1">
           <p className="text-[10px] uppercase tracking-[0.4em] text-accent-red font-black">{t.personal_concierge}</p>
           <h2 className="text-4xl font-serif text-brand-charcoal tracking-tighter">{t.my_travel_plan}</h2>
        </div>
      </header>

      {scheduledItems.length === 0 ? (
        <div>
          <div className="py-14 text-center space-y-4 px-10">
             <div className="w-16 h-16 bg-brand-pearl rounded-full flex items-center justify-center mx-auto mb-2 border border-border-main/60 opacity-60">
                <CalendarIcon size={24} className="text-brand-charcoal" />
             </div>
             <p className="text-sm font-serif italic text-brand-charcoal leading-relaxed px-2 text-center opacity-60">
               "{t.empty_plan}"
             </p>
             <button 
               onClick={onExplore}
               className="text-[9px] uppercase tracking-widest font-black text-accent-red border border-accent-red/25 px-5 py-2.5 rounded-full active:scale-95 transition-all cursor-pointer inline-block mt-1"
             >
               {t.start_exploring}
             </button>
          </div>
          {renderJourneyBundles()}
        </div>
      ) : (
        <div className="space-y-5">
           <div className="flex items-center gap-2 text-accent-red">
             <div className="w-1 h-1 rounded-full bg-accent-red" />
             <span className="text-[9px] font-black uppercase tracking-widest">{scheduledItems.length} {t.events_scheduled}</span>
           </div>
           
           <AnimatePresence mode="popLayout">
             {scheduledItems.map((item: any) => (
               <div key={item.id}>
                 <PlanCard 
                   item={item} 
                   language={language}
                   onRemove={onRemove} 
                   onUpdateDate={onUpdateDate}
                 />
               </div>
             ))}
           </AnimatePresence>

           {renderJourneyBundles()}

            {/* HIGH-FIDELITY LIVE DOCUMENT PREVIEW MODAL OVERLAY */}
            <AnimatePresence>
              {showLivePreview && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4"
                >
                  <motion.div 
                    initial={{ scale: 0.95, y: 15 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 15 }}
                    className="bg-[#FAF9F5] w-full max-w-[400px] h-[85vh] max-h-[calc(100dvh-24px)] md:max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-[#E5E3DB]"
                  >
                    {/* Animated premium feedback alert */}
                    <AnimatePresence>
                      {copiedToast && (
                        <motion.div 
                          initial={{ opacity: 0, y: -20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#2E7D32] border border-[#1E2E20] text-[#FAF9F5] px-4 py-2 bg-opacity-95 backdrop-blur-md rounded-full shadow-xl z-50 flex items-center gap-2 text-[8px] font-black uppercase tracking-wider select-none"
                        >
                          <ShieldCheck size={12} className="text-white" />
                          {shareToastSuccess[language] || shareToastSuccess['en']}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Sticky preview header with control close */}
                    <div className="bg-white border-b border-[#E5E3DB] px-5 py-3.5 flex justify-between items-center z-10">
                      <div className="flex flex-col">
                        <span className="text-[7px] uppercase tracking-[0.3em] text-[#8F8B73] font-bold">
                          IDEMO • CONCIERGE BRIEF
                        </span>
                        <span className="text-[11px] font-black text-[#1E2E20] uppercase font-serif tracking-tight">
                          {language === 'sr' ? 'PREGLED PRE PREUZIMANJA' : 'LIVE PORTFOLIO PREVIEW'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowLivePreview(false)}
                        className="w-8 h-8 rounded-full bg-brand-pearl border border-border-main/50 flex items-center justify-center text-brand-charcoal hover:bg-black/5 hover:scale-105 active:scale-95 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Embedded custom CSS printing styles to isolate the printable itinerary sheet without extra packages */}
                    <style>{`
                      @media print {
                        body, html, #root, main, div, header, footer, nav, button {
                          background: white !important;
                          color: black !important;
                          box-shadow: none !important;
                          border: none !important;
                        }
                        body * {
                          visibility: hidden !important;
                        }
                        #print-preview-document, #print-preview-document * {
                          visibility: visible !important;
                        }
                        #print-preview-document {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          height: auto !important;
                          overflow: visible !important;
                          padding: 1.5cm !important;
                          background: white !important;
                          color: #1E2E20 !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                      }
                    `}</style>

                    {/* Document Body scrollable */}
                    <div id="print-preview-document" className="flex-1 overflow-y-auto p-5 pb-24 relative select-text no-scrollbar scroll-smooth">
                      
                      {/* Absolute Svg Artistic Watermarks */}
                      <div className="absolute top-[12%] left-[4%] opacity-[0.035] pointer-events-none z-0 w-[120px]">
                        <svg viewBox="0 0 100 150" fill="none" stroke="#2D3025" strokeWidth="0.5" className="w-full h-auto">
                          <polygon points="50,15 25,45 75,45" />
                          <line x1="38" y1="33" x2="45" y2="35" />
                          <line x1="62" y1="33" x2="55" y2="35" />
                          <line x1="50" y1="15" x2="50" y2="45" />
                          <polygon points="35,45 65,45 75,100 25,100" />
                          <line x1="30" y1="60" x2="20" y2="75" />
                          <line x1="70" y1="60" x2="80" y2="75" />
                          <line x1="35" y1="65" x2="65" y2="65" />
                          <line x1="33" y1="75" x2="67" y2="75" />
                          <line x1="30" y1="85" x2="70" y2="85" />
                          <path d="M45,110 L50,115 L55,110 M40,120 L50,127 L60,120 M35,130 L50,140 L65,130" strokeWidth="0.4"/>
                        </svg>
                      </div>
                      
                      <div className="absolute top-[42%] right-[4%] opacity-[0.035] pointer-events-none z-0 w-[140px]">
                        <svg viewBox="0 0 200 200" fill="none" stroke="#2D3025" strokeWidth="0.4" className="w-full h-auto">
                          <circle cx="100" cy="100" r="15" strokeDasharray="2,2" />
                          <circle cx="100" cy="100" r="30" />
                          <circle cx="100" cy="100" r="45" strokeDasharray="4,2" />
                          <circle cx="100" cy="100" r="60" />
                          <circle cx="100" cy="100" r="75" strokeDasharray="6,3" />
                          <circle cx="100" cy="100" r="90" />
                          <path d="M100,25 L100,175" />
                          <path d="M25,100 L175,100" />
                          <path d="M47,47 L153,153" strokeDasharray="3,3" />
                          <path d="M47,153 L153,47" strokeDasharray="3,3" />
                          <circle cx="100" cy="100" r="5" fill="#2D3025" />
                          <rect x="94" y="25" width="12" height="150" rx="4" strokeDasharray="1,1" />
                          <path d="M10,100 Q 32.5,130 55,100 T 100,100 T 145,100 T 190,100" />
                          <path d="M10,100 Q 32.5,70 55,100 T 100,100 T 145,100 T 190,100" strokeDasharray="2,2" />
                        </svg>
                      </div>

                      <div className="absolute bottom-[10%] left-[8%] opacity-[0.035] pointer-events-none z-0 w-[130px]">
                        <svg viewBox="0 0 120 120" fill="none" stroke="#2D3025" strokeWidth="0.5" className="w-full h-auto">
                          <circle cx="60" cy="60" r="52" strokeDasharray="3,1" />
                          <circle cx="60" cy="60" r="48" />
                          <path d="M 45,85 C 45,75 50,70 50,65 C 50,60 42,58 40,50 C 38,42 45,35 55,33 C 65,31 75,37 77,48 C 78,54 75,56 73,59 C 71,62 76,65 74,72 C 72,78 68,82 65,85 Z" />
                          <path d="M 40,50 L 37,53 L 41,55 L 39,58 L 43,60 M 42,65 C 44,70 48,72 50,72" />
                          <path d="M 52,32 Q 55,27 60,30 Q 56,33 53,35" />
                          <path d="M 58,30 Q 62,25 66,29 Q 62,32 59,34" />
                          <path d="M 64,29 Q 69,26 71,31 Q 67,33 65,35" />
                          <path d="M 69,32 Q 74,31 74,36 Q 70,37 69,37" />
                          <path d="M 76,48 Q 83,46 81,54 Q 75,52 76,48 Z" />
                          <path d="M 77,53 Q 86,55 83,62 Q 78,58 77,53 Z" />
                          <path id="roman_txt_preview" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" stroke="none" />
                          <text fontSize="5.5" fontFamily="serif" letterSpacing="1">
                            <textPath href="#roman_txt_preview" startOffset="5%">IMP CONSTANTINVS P F AVG</textPath>
                          </text>
                        </svg>
                      </div>

                      {/* Side Cyrylic Ribbon */}
                      <div 
                        className="absolute top-[2cm] right-[0.2cm] h-[85%] text-[7px] uppercase font-bold text-[#2D3025] opacity-[0.035] pointer-events-none z-0"
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                          letterSpacing: '0.8em',
                          fontFamily: '"Playfair Display", serif'
                        }}
                      >
                        {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).watermark}
                      </div>

                      <div className="relative z-10 space-y-5">
                        {/* Double ruled header block */}
                        <div className="bg-white border border-[#E0DDD5] border-b-[3px] border-b-[#1E2E20] p-4 rounded-lg">
                          <span className="text-[7px] uppercase tracking-[0.3em] font-bold text-[#8F8B73]">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).recommended}
                          </span>
                          <h4 className="font-serif text-lg font-bold text-[#1E2E20] leading-tight mt-1 mb-1.5">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).title}
                          </h4>
                          <p className="text-[9px] text-[#5C5E54] italic leading-relaxed">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).desc}
                          </p>
                        </div>

                        {/* Calibrated Profile */}
                        <div className="bg-white border-2 border-[#D5D3C8] rounded-[20px] p-5 space-y-3.5 shadow-xs">
                          <span className="text-[11px] text-[#5C5A4D] uppercase font-black tracking-[0.18em] block border-b-2 border-[#FAF9F5] pb-1.5">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).visitor_profile}
                          </span>
                          <h5 className="font-serif text-[17px] font-black text-[#1B5E20] leading-snug pt-0.5">
                            {dynamicStyle.styleName}
                          </h5>
                          <div className="space-y-2 pt-2 border-t border-[#FAF9F5]">
                            {dynamicStyle.whyBullets.map((bullet, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[12px] text-brand-charcoal font-semibold leading-relaxed">
                                <span className="w-2 h-2 rounded-full bg-accent-teal flex-shrink-0 mt-1.5" />
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Travel Horizon Calendar */}
                        <div className="bg-white border border-[#E5E3DB] rounded-xl p-3.5 space-y-2">
                          <span className="text-[7.5px] text-[#8C8A7D] uppercase font-bold tracking-widest block border-b border-[#F3F1ED] pb-1">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).calendar_title}
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {sortedMonths.slice(0, 1).map((m) => (
                              <CalendarMonthView 
                                key={`${m.year}-${m.month}`}
                                year={m.year}
                                month={m.month}
                                highlightedDays={m.days}
                                language={language}
                              />
                            ))}
                            {sortedMonths.length > 1 && (
                              <p className="text-[7px] text-[#8C8A7D] text-center italic mt-0.5">
                                {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).additional_months}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Essential Protocol inside Preview */}
                        <div className="bg-white border border-[#E5E3DB] rounded-xl p-3.5 space-y-1">
                          <span className="text-[7.5px] text-[#8C8A7D] uppercase font-bold tracking-widest block border-b border-[#F3F1ED] pb-1">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).essential_protocol}
                          </span>
                          <table className="w-full text-[9px] mt-1.5">
                            <tbody>
                              <tr className="border-b border-[#F3F1ED]">
                                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider w-[40%]">
                                  {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).currency}
                                </td>
                                <td className="py-1 text-[#2F3126]">RSD (Srpski dinar)</td>
                              </tr>
                              <tr className="border-b border-[#F3F1ED]">
                                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                                  {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).timezone}
                                </td>
                                <td className="py-1 text-[#2F3126]">CET/CEST (Belgrade)</td>
                              </tr>
                              <tr className="border-b border-[#F3F1ED]">
                                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                                  {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).emergency}
                                </td>
                                <td className="py-1 text-[#2F3126]">
                                  {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).emergency_val}
                                </td>
                              </tr>
                              <tr className="border-b border-[#F3F1ED]">
                                <td className="py-1 font-black text-[#8C8A7D] uppercase text-[7.5px] tracking-wider">
                                  {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).alphabet}
                                </td>
                                <td className="py-1 text-[#2F3126]">{(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).alphabet_val}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Schedule cards */}
                        <div className="space-y-3">
                          <span className="text-[7.5px] text-[#8C8A7D] uppercase font-bold tracking-widest block border-b border-[#E0DDD5] pb-1">
                            {(ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).chronological}
                          </span>

                          {[...scheduledItems]
                            .sort((a: any, b: any) => {
                              if (!a.scheduledDate) return 1;
                              if (!b.scheduledDate) return -1;
                              return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
                            })
                            .map((item: any, idx: number) => {
                              const localeMap: Record<string, string> = {
                                sr: 'sr-RS',
                                ru: 'ru-RU',
                                es: 'es-ES',
                                de: 'de-DE',
                                zh: 'zh-CN',
                                en: 'en-US'
                              };
                              const currentLocale = localeMap[language] || 'en-US';
                              const dateFormatted = item.scheduledDate 
                                ? new Date(item.scheduledDate.split('T')[0].replace(/-/g, '/')).toLocaleDateString(currentLocale, { weekday: 'long', month: 'short', day: 'numeric' })
                                : (ITINERARY_LOCALIZATIONS[language] || ITINERARY_LOCALIZATIONS['en']).flexible;
                              
                              return (
                                <div key={item.id} className="bg-white border border-[#E5E3DB] rounded-xl overflow-hidden shadow-xs">
                                  <div className="bg-[#F8F7F4] border-b border-[#E5E3DB] px-3 py-1.5 flex justify-between items-center">
                                    <span className="font-mono text-[9px] font-bold text-[#2E7D32]">#{idx + 1}</span>
                                    <span className="text-[8.5px] text-[#1E2E20] font-bold uppercase tracking-wide">{dateFormatted}</span>
                                  </div>
                                  <div className="p-3 space-y-2">
                                    <div>
                                      <h6 className="font-serif text-[12px] font-bold text-[#1E2E20] leading-snug">
                                        {getLocalizedValue(item, 'title', language)}
                                      </h6>
                                      <div className="text-[7.5px] uppercase font-black text-[#2E7D32] tracking-wider mt-0.5">
                                        {formatCategory(item.category, t)}
                                      </div>
                                      <p className="text-[8px] text-[#8C8A7D] mt-1">📍 {getLocalizedValue(item, 'location', language)}</p>
                                    </div>

                                    <p className="text-[8.5px] text-[#5C5E54] leading-relaxed border-t border-[#F3F1ED] pt-2">
                                      {getLocalizedValue(item, 'shortDescription', language) || getLocalizedValue(item, 'longDescription', language)}
                                    </p>

                                    <div className="flex flex-wrap gap-1 border-t border-[#F3F1ED] pt-2">
                                      {item.duration && (
                                        <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-1.5 py-0.5 text-[7.5px] font-medium text-[#505249]">
                                          🕒 {item.duration}
                                        </span>
                                      )}
                                      {item.travelTime && (
                                        <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-1.5 py-0.5 text-[7.5px] font-medium text-[#505249]">
                                          ⚡ {item.travelTime}
                                        </span>
                                      )}
                                      {item.preferredTransport && (
                                        <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-1.5 py-0.5 text-[7.5px] font-medium text-[#505249]">
                                          🚗 {item.preferredTransport}
                                        </span>
                                      )}
                                      {item.estimatedCost && (
                                        <span className="bg-[#F3F1ED] border border-[#E5E3DB] rounded px-1.5 py-0.5 text-[7.5px] font-medium text-[#505249]">
                                          💶 {item.estimatedCost}
                                        </span>
                                      )}
                                    </div>

                                    {(item.website || item.phone) && (
                                      <div className="text-[8px] text-[#5C5E54] space-y-0.5 border-t border-dashed border-[#E5E3DB] pt-2">
                                        {item.website && (
                                          <p className="truncate">🌐 <span className="font-bold">{language === 'sr' ? 'Вебсајт' : 'Website'}:</span> {item.website}</p>
                                        )}
                                        {item.phone && (
                                          <p className="truncate">📞 <span className="font-bold">{language === 'sr' ? 'Телефон' : 'Phone'}:</span> {item.phone}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Briefing Footer */}
                        <div className="border-t border-dashed border-[#E0DDD5] pt-3 text-[7.5px] text-[#8C8A7D] uppercase tracking-wider flex justify-between items-center">
                          <span>IDEMO • CONCIERGE BRIEF</span>
                          <span>EXPO 2027 • SERBIA</span>
                        </div>
                      </div>
                    </div>

                    {/* Integrated sharing, printing, and jspdf download triggers inside preview */}
                    <div className="bg-white border-t border-[#E5E3DB] p-4 flex flex-col gap-2 z-10 shadow-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDownloadPDF}
                          className="h-11 bg-[#1E2E20] hover:bg-black text-[#FAF9F5] rounded-xl text-[8px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Download size={11} className="text-accent-teal" />
                          {modalDownloadLabels[language] || modalDownloadLabels['en']}
                        </button>
                        <button
                          onClick={() => {
                            setShowLivePreview(false);
                            setTimeout(() => handlePrintPDF(), 250);
                          }}
                          className="h-11 border border-border-main bg-white hover:bg-[#FAF9F5] text-brand-charcoal rounded-xl text-[8px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Printer size={11} className="text-[#8C8A7D]" />
                          {modalPrintLabels[language] || modalPrintLabels['en']}
                        </button>
                      </div>
                      <button
                        onClick={() => setShowLivePreview(false)}
                        className="h-10 border border-border-main/50 rounded-xl text-brand-charcoal/60 text-[8px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer bg-neutral-50 hover:bg-[#FAF9F5]"
                      >
                        {modalCloseLabels[language] || modalCloseLabels['en']}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
           <div className="pt-6 space-y-3">
              <button 
                onClick={handleSyncCalendar}
                className="w-full h-14 bg-[#1E2E20] hover:bg-black text-[#FAF9F5] rounded-2xl flex items-center justify-center gap-3 font-bold tracking-widest uppercase text-[9px] shadow-md active:scale-95 transition-all cursor-pointer"
              >
                 <ExternalLink size={16} className="text-accent-teal" />
                 {t.sync_calendar}
              </button>
              <button 
                onClick={() => setShowLivePreview(true)}
                className="w-full h-14 bg-white border border-border-main text-brand-charcoal hover:bg-[#FAF9F5] rounded-2xl flex items-center justify-center gap-3 font-bold tracking-widest uppercase text-[9px] shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                 <Printer size={16} className="text-[#8C8A7D]" />
                 {shareBtnLabel}
              </button>
              <div className="px-6 pt-2">
                <p className="text-[8px] text-center text-brand-charcoal/40 uppercase tracking-widest leading-loose">
                  {t.privacy_commitment}
                </p>
              </div>
           </div>
        </div>
      )}
    </motion.div>
  );
}

const BUSINESS_PAIRINGS = [
  {
    id: 'p1',
    badge: {
      en: 'Diplomatic Gala',
      sr: 'Diplomatska elegancija',
      zh: '外宾接待 / 商务宴请',
      es: 'Gala diplomática',
      de: 'Diplomatisches Fest',
      ru: 'Дипломатический прием'
    },
    title: {
      en: 'Executive Artistry & Dining',
      sr: 'Umetnički spektakl i otmena večera',
      zh: '前卫艺术大作与殿堂级晚宴',
      es: 'Arte y cena de etiqueta',
      de: 'Executive Kunst & Fine Dining',
      ru: 'Премиум искусство и ужин'
    },
    description: {
      en: 'Synchronize world-class contemporary choreography with Belgrade’s most opulent Belle Époque ballroom fine-dining.',
      sr: 'Spojite vrhunsku savremenu koreografiju sa svečanom večerom u najraskošnijem mermernom salonu Beograda.',
      zh: '将世界级的前卫现代舞演出与旧世界最奢华的挑高大理石金箔晚宴完美相融。',
      es: 'Combine coreografía contemporánea con una cena en el salón Belle Époque más opulento de Belgrado.',
      de: 'Verbinden Sie moderne Choreografie mit Belgrads opulentem Jugendstil-Feinschmecker-Dinner.',
      ru: 'Сочетайте шедевры современной хореографии с ужином в самом роскошном бальном зале Белграда.'
    },
    rec1Id: '96', // Belgrade Dance Festival
    rec2Id: '42'  // Salon 1905
  },
  {
    id: 'p2',
    badge: {
      en: 'Tech Connection',
      sr: 'Tehnološka sinergija',
      zh: '科技创始 / 新一代地标',
      es: 'Conexión tecnológica',
      de: 'Tech-Schnittstelle',
      ru: 'Технологический мост'
    },
    title: {
      en: 'Silos Innovation & Wireless Pioneer',
      sr: 'Inovacija u Silosima i svetski pionir',
      zh: '后工业创意中心与特斯拉传奇',
      es: 'Innovación en Silos y pionero inalámbrico',
      de: 'Silos Innovation & Wireless-Pionier',
      ru: 'Инновации Силосов и гений Теслы'
    },
    description: {
      en: 'Explore future-facing design exhibitions at the Silosi, paired with the brilliant legacy of physical wireless energy.',
      sr: 'Istražite vizionarski industrijski dizajn u startap čvorištu Silosi, uz obilazak legendarne laboratorije Nikole Tesle.',
      zh: '走进在旧水泥筒仓重塑而成的密克瑟创意展，随后朝圣无线电先驱尼古拉·特斯拉的物理奇迹。',
      es: 'Explore el diseño de vanguardia en Silosi con el brillante legado inalámbrico de Nikola Tesla.',
      de: 'Erkunden Sie zukunftsweisende Design-Ausstellungen am Silosi gepaart mit dem Vermächtnis von Nikola Tesla.',
      ru: 'Исследуйте выставки дизайна в Силосах вместе с гениальным наследием великого Николы Теслы.'
    },
    rec1Id: '97', // Mikser Festival
    rec2Id: '7'   // Nikola Tesla Museum
  },
  {
    id: 'p3',
    badge: {
      en: 'Mind & Body Reset',
      sr: 'Bitan spa oporavak',
      zh: '温矿泉复苏与深林电音',
      es: 'Restauración mental',
      de: 'Geist & Körper Reset',
      ru: 'Перезагрузка души и тела'
    },
    title: {
      en: 'Atmospheric Beats & Balneotherapy',
      sr: 'Letnji festivalski ritam i spa tretmani',
      zh: '深林电音派对与热矿泉理疗',
      es: 'Ritmos y balneoterapia',
      de: 'Atmosphärische Beats & Balneotherapie',
      ru: 'Атмосферный ритм и бальнеотерапия'
    },
    description: {
      en: 'Enjoy premium wellness treatments at Roman warm-spring baths, paired with high-energy electronic beats floating in park forests.',
      sr: 'Priuštite sebi dragoceni oporavak u rimskim mineralnim izvorima, uz prateće energične večeri u banjskoj šumi.',
      zh: '在古老罗马矿泉中享受舒缓修复，随后隐入森系湖畔的塞国最潮电音狂欢。',
      es: 'Disfrute de tratamientos de spa romano de aguas termales con ritmos de música electrónica en el bosque.',
      de: 'Genießen Sie erstklassige Wellnessanwendungen in römischen Thermalbädern gepaart mit elektronischen Beats im Kurpark.',
      ru: 'Насладитесь велнес-процедурами в римских лечебных источниках наряду с мощными ритмами в лесу.'
    },
    rec1Id: '100', // Lovefest
    rec2Id: '4'    // Vrnjačka Banja (Thermal)
  },
  {
    id: 'p4',
    badge: {
      en: 'Corporate Retreat',
      sr: 'Korporativni merak',
      zh: '南方雄关与音乐盛会',
      es: 'Retiro corporativo',
      de: 'Firmen-Retreat',
      ru: 'Корпоративный уикенд'
    },
    title: {
      en: 'Gourmet Southern Jazz & Citadel Ramparts',
      sr: 'Južnjački merak, džez i Niška tvrđava',
      zh: '奥斯曼要塞壁、醇厚爵士与南部烤肉',
      es: 'Jazz sureño y murallas de la ciudadela',
      de: 'Gourmet-Südjazz & Zitadelle',
      ru: 'Южный джаз и древняя цитадель'
    },
    description: {
      en: 'Dine on rich local spice grilling and regional reserve wines during elite concerts inside the high stone walls of Niš Fortress.',
      sr: 'Spojite autentična pikantna jela juga i vrhunska vina sa vrhunskim džez koncertima unutar istorijske Niške tvrđave.',
      zh: '在奥斯曼古要塞的璀璨灯光和醇亮爵士乐中，深度品尝南部极具风味的红肉烧烤与精选地道红酒。',
      es: 'Cene ricas parrilladas locales y vinos de reserva regionales durante los conciertos de jazz en la fortaleza.',
      de: 'Genießen Sie lokales Barbecue und erlesene Weine der Region bei erstklassigen Konzerten in der Festung Niš.',
      ru: 'Попробуйте изысканные южные блюда и вина во время элитных концертов в Нишской крепости.'
    },
    rec1Id: '101', // Nišville Jazz
    rec2Id: '45'   // Niš Fortress
  }
];

const PAIRINGS_TRANSLATIONS: Record<string, any> = {
  en: {
    title: "Executive Curated Pairings",
    subtitle: "Bespoke professional partnerships combining active culture with elite recovery.",
    both_title: "Curated Duo",
    all_discoveries: "All Curated Discoveries",
    click_to_view: "Click either curation below to inspect its itinerary."
  },
  sr: {
    title: "Preporučeni poslovni parovi",
    subtitle: "Namenska i pažljivo usklađena iskustva koja spajaju aktivnu kulturu sa oporavkom.",
    both_title: "Usklađeni par",
    all_discoveries: "Sva odabrana otkrića",
    click_to_view: "Kliknite na bilo koje mesto ispod da pogledate detalje plana."
  },
  zh: {
    title: "高管定制尊享组合",
    subtitle: "为世博商务精英和高层代表度身定制的完美行程，合力倍增社交深度与身心静治。",
    both_title: "经典双生组合",
    all_discoveries: "全部精选目的地列表",
    click_to_view: "点击下方任意目的地微卡，即可直接查阅对应行程及预订方案。"
  },
  es: {
    title: "Combinaciones ejecutivas",
    subtitle: "Asociaciones profesionales a la medida que combinan cultura activa y recuperación.",
    both_title: "Dúo seleccionado",
    all_discoveries: "Todos los descubrimientos",
    click_to_view: "Haga clic en cualquiera de las opciones para ver sus detalles."
  },
  de: {
    title: "Executive Kuratierte Paare",
    subtitle: "Maßgeschneiderte professionelle Erlebnisse, die aktive Kultur mit Erholung verbinden.",
    both_title: "Kuriertes Duo",
    all_discoveries: "Alle Entdeckungen",
    click_to_view: "Klicken Sie auf ein Element, um die Reiseroute anzuzeigen."
  },
  ru: {
    title: "Премиум сочетания для бизнеса",
    subtitle: "Специально разработанные комбинации, сочетающие культуру высшего уровня со спа-восстановлением.",
    both_title: "Эксклюзивный дуэт",
    all_discoveries: "Все кураторские открытия",
    click_to_view: "Нажмите на любую карточку ниже, чтобы изучить подробности маршрута."
  }
};

const SORT_TRANSLATIONS: Record<string, any> = {
  en: {
    sort_by: "Sort Transit",
    featured: "Featured Curation",
    shortest: "Shortest Transit",
    longest: "Longest Exploration"
  },
  sr: {
    sort_by: "Sortiraj prevoz",
    featured: "Istaknute rute",
    shortest: "Najkraći prevoz",
    longest: "Najduže putovanje"
  },
  zh: {
    sort_by: "交通用时排序",
    featured: "默认精选推荐",
    shortest: "极速直达 (耗时最短)",
    longest: "深度探索 (距离较远)"
  },
  es: {
    sort_by: "Ordenar tránsito",
    featured: "Curación recomendada",
    shortest: "Tránsito más corto",
    longest: "Exploración larga"
  },
  de: {
    sort_by: "Anreise sortieren",
    featured: "Empfohlene Kuration",
    shortest: "Kürzeste Anreise",
    longest: "Längste Erkundung"
  },
  ru: {
    sort_by: "Сортировка",
    featured: "Рекомендуемые",
    shortest: "Быстрый транзит",
    longest: "Дальнее исследование"
  }
};

function ExploreScreen({ 
  language, 
  onSelectRec, 
  recommendations, 
  onNavigateToProfile, 
  vibeSettings, 
  ratings, 
  lowSignalMode, 
  onToggleLowSignal,
  recordCategoryViewSignal,
  recordQRScanSignal,
  recordMapOpenSignal,
  lpeProfile,
  currentWeather,
  setCurrentWeather,
  currentDayOfWeek,
  setCurrentDayOfWeek,
  currentTimeMinutes,
  setCurrentTimeMinutes,
  proximityReference,
  setProximityReference,
  maxWalkingDistanceKm,
  setMaxWalkingDistanceKm,
  showEverything,
  setShowEverything,
  allRecommendationsLength,
  budget,
  time,
  days,
  selectedCats,
  orbitX,
  orbitY
}: any) {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const dynamicConciergeStyle = useMemo(() => {
    return getDynamicStyle(language, selectedCats || [], days || '1', budget || 100, time || 24);
  }, [language, selectedCats, days, budget, time]);

  const isCultural = useMemo(() => {
    const styleName = dynamicConciergeStyle?.styleName || '';
    return styleName.toLowerCase().includes('cultural') || styleName.toLowerCase().includes('kulturn');
  }, [dynamicConciergeStyle]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [exploreMode, setExploreMode] = useState<'categories' | 'areas'>('categories');
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [vibeFilterOpen, setVibeFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'shortest' | 'longest'>('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);

  const isSr = language === 'sr';
  const isZh = language === 'zh';

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const handler = setTimeout(() => {
        trackSearchSignal(searchQuery, recommendations);
      }, 600);
      return () => clearTimeout(handler);
    }
  }, [searchQuery, recommendations]);


  const toggleVibeFilter = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe) 
        : [...prev, vibe]
    );
  };

  const categories = [
    { id: Category.WELLBEING, icon: <Heart size={16} />, label: 'Wellbeing' },
    { id: Category.MEDICAL, icon: <ShieldCheck size={16} />, label: 'Medical' },
    { id: Category.NATURE, icon: <MapPin size={16} />, label: 'Nature' },
    { id: Category.HISTORY, icon: <Theater size={16} />, label: 'History' },
    { id: Category.GASTRONOMY, icon: <Utensils size={16} />, label: 'Gastronomy' },
    { id: Category.TRAVEL, icon: <MapIcon size={16} />, label: 'Travel' },
    { id: Category.CLUBBING, icon: <Music size={16} />, label: 'Clubbing' },
  ];

  const filteredRecs = showEverything
    ? recommendations
    : (exploreMode === 'categories'
        ? (selectedCategory 
            ? recommendations.filter((r: any) => {
                if (!r.category) return false;
                const rCats = typeof r.category === 'string'
                  ? r.category.split(',').map((s: string) => s.trim())
                  : [r.category];
                return rCats.includes(selectedCategory);
              })
            : recommendations)
        : (selectedAreaId
            ? recommendations.filter((r: any) => {
                if (!r.location) return false;
                return isLocationInRegion(r.location, selectedAreaId);
              })
            : recommendations));

  const finalFilteredRecs = showEverything
    ? filteredRecs
    : (selectedVibes.length > 0
        ? filteredRecs.filter((r: any) => {
            const itemRating = ratings && ratings[r.id];
            const itemVibe = itemRating?.vibe;
            // Map ratings vibe back to filters
            return selectedVibes.includes(itemVibe || '');
          })
        : filteredRecs);

  const searchFilteredRecs = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return finalFilteredRecs;
    const cleanQuery = searchQuery.toLowerCase().trim();
    return finalFilteredRecs.filter((r: any) => {
      const searchTarget = `${getLocalizedValue(r, 'title', language)} ${getLocalizedValue(r, 'shortDescription', language)} ${getLocalizedValue(r, 'longDescription', language)} ${r.location} ${r.category}`.toLowerCase();
      return searchTarget.includes(cleanQuery);
    });
  }, [finalFilteredRecs, searchQuery, language]);

  const getTravelMinutes = (item: any): number => {
    if (typeof item.travelTimeMinutes === 'number') {
      return item.travelTimeMinutes;
    }
    const str = String(item.travelTime || '').toLowerCase();
    if (str.includes('minute') || str.includes('min')) {
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 15;
    }
    if (str.includes('hour') || str.includes('h') || str.includes('sat')) {
      const match = str.match(/([\d.]+)/);
      if (match) {
        return Math.round(parseFloat(match[1]) * 60);
      }
    }
    return 60; // fallback
  };

  const sortedFilteredRecs = useMemo(() => {
    const list = [...searchFilteredRecs];
    if (sortBy === 'shortest') {
      return list.sort((a, b) => getTravelMinutes(a) - getTravelMinutes(b));
    }
    if (sortBy === 'longest') {
      return list.sort((a, b) => getTravelMinutes(b) - getTravelMinutes(a));
    }
    return list;
  }, [searchFilteredRecs, sortBy]);

  if (scanOpen) {
    return (
      <motion.div 
        className="flex-1 p-6 pt-10 space-y-8 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
        <QRScanner
          language={language}
          translations={TRANSLATIONS}
          recommendations={recommendations}
          onMatch={(id: string) => {
            setScanOpen(false);
            const rec = recommendations.find((r: any) => r.id === id);
            if (rec) {
              if (recordQRScanSignal) {
                recordQRScanSignal(rec);
              } else {
                trackQRScanSignal(rec);
              }
            }
            onSelectRec(id);
          }}
          onClose={() => setScanOpen(false)}
          triggerHaptic={triggerHaptic}
        />
      </motion.div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden" id="explore-screen-wrapper">
      <motion.div 
        className="flex-1 p-6 pt-10 space-y-8 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      >
      <header className="flex justify-between items-start">
        <div className="space-y-1">
           <p className="text-[10px] uppercase tracking-[0.4em] text-accent-red font-black">{t.explore_title}</p>
           <h2 className="text-4xl font-serif text-brand-charcoal tracking-tighter">{t.filter_by}</h2>
           <div className="pt-2 select-none">
             <button 
               onClick={(e) => { e.stopPropagation(); onToggleLowSignal(); }}
               className={`px-3 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all outline-none border cursor-pointer ${
                 lowSignalMode 
                   ? 'bg-amber-500/15 border-amber-500/30 text-amber-700' 
                   : 'bg-white border-border-main text-[#8C8A7D]/80 hover:bg-[#F6F5F2]'
               }`}
             >
               <div className={`w-1 h-1 rounded-full ${lowSignalMode ? 'bg-amber-600 animate-pulse' : 'bg-green-600'}`} />
               <span>{lowSignalMode ? 'Low Signal Active' : 'Connected'}</span>
             </button>
           </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              triggerHaptic(10);
              setScanOpen(true);
            }}
            className="w-11 h-11 bg-white hover:bg-brand-pearl border border-border-main rounded-full flex items-center justify-center text-brand-charcoal hover:shadow-sm active:scale-[0.95] transition-all cursor-pointer relative"
            title={t.scan_qr || "Scan QR Code"}
          >
            <QrCode size={18} className="text-accent-teal" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-teal rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent-teal rounded-full" />
          </button>
          <PulsatingProfileButton 
            onClick={onNavigateToProfile}
            language={language}
            size={44}
            iconSize={18}
          />
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {/* Today's Concierge Card repeated for continuous live feedback on Explore */}
        <div 
          onClick={() => {
            setShowCorrelationModal(true);
            triggerHaptic(6);
          }}
          className="bg-white rounded-[24px] border border-border-main p-4.5 shadow-tactile text-left relative overflow-hidden cursor-pointer hover:border-accent-teal/30 active:scale-[0.99] transition-all group"
        >
          <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-accent-teal/5 blur-xl pointer-events-none" />
          
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <p className="text-[9px] uppercase tracking-[0.25em] text-accent-teal font-extrabold flex items-center gap-1">
                <span>{language === 'sr' ? 'DANAŠNJI KONSJERŽ' : language === 'zh' ? '今日专属管家' : language === 'es' ? 'EL CONSERJE DE HOY' : language === 'de' ? 'DER HEUTIGE CONCIERGE' : language === 'ru' ? 'СЕГОДНЯŠНИЙ КОНSJERŽ' : 'TODAY\'S CONCIERGE'}</span>
                <span className="text-[8px] font-sans font-bold text-accent-teal opacity-0 group-hover:opacity-100 transition-opacity">({language === 'sr' ? 'Saznaj više' : language === 'zh' ? '了解更多' : 'Learn more'})</span>
              </p>
              <h3 className="font-serif font-black text-lg text-brand-charcoal tracking-tight group-hover:text-accent-teal transition-colors">
                {dynamicConciergeStyle.styleName}
              </h3>
            </div>
            <span className="text-[8.5px] uppercase font-bold bg-accent-teal/10 text-accent-teal px-2.5 py-0.5 rounded-full select-none">
              {language === 'sr' ? 'Usklađeno' : language === 'zh' ? '已校准' : language === 'es' ? 'Calibrado' : language === 'de' ? 'Kalibriert' : language === 'ru' ? 'Откалиброван' : 'Calibrated'}
            </span>
          </div>
        </div>

        {/* Invisible preference-engine driven, quiet and elegant Search bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'sr' ? 'Pretraži iskustva...' : language === 'zh' ? '搜索体验项目...' : 'Search experiences...'}
            className="w-full h-12 pl-11 pr-10 bg-[#FAF9F5]/70 border border-[#D5D3C8] rounded-2xl text-[13px] font-medium placeholder-brand-charcoal/40 text-brand-charcoal focus:outline-none focus:border-accent-teal/50 transition-all shadow-xs"
          />
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-charcoal/40 hover:text-brand-charcoal font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 flex bg-[#EAE8DF]/40 p-1.5 rounded-2xl border border-border-main shadow-inner h-13 items-center">
            <button
              onClick={() => {
                setExploreMode('categories');
                setSelectedAreaId(null);
                triggerHaptic(10);
              }}
              className={`flex-1 py-1.5 text-[12px] uppercase tracking-widest font-black rounded-xl transition-all cursor-pointer h-[40px] flex items-center justify-center ${
                exploreMode === 'categories' ? 'bg-white text-brand-charcoal shadow-sm border border-border-main/20' : 'text-[#5C5A4D]'
              }`}
            >
              {t.categories_label}
            </button>
            <button
              onClick={() => {
                setExploreMode('areas');
                setSelectedCategory(null);
                triggerHaptic(10);
              }}
              className={`flex-1 py-1.5 text-[12px] uppercase tracking-widest font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer h-[40px] ${
                exploreMode === 'areas' ? 'bg-white text-brand-charcoal shadow-sm border border-[#D5D3C8] border-opacity-30' : 'text-[#5C5A4D]'
              }`}
            >
              <Compass size={13} className="text-accent-red" />
              {t.areas_label}
            </button>
          </div>

          <button
            onClick={() => {
              setVibeFilterOpen(!vibeFilterOpen);
              triggerHaptic(10);
            }}
            className={`h-13 px-4 rounded-2xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 min-w-[50px] ${
              vibeFilterOpen || selectedVibes.length > 0
                ? 'bg-accent-red/10 border-accent-red/40 text-accent-red font-black'
                : 'bg-white border-[#C2C0B5] text-brand-charcoal hover:bg-brand-pearl'
            }`}
          >
            <Heart size={14} fill={selectedVibes.length > 0 ? '#8A1F1F' : 'none'} className="text-accent-red transition-all duration-300" />
            <span className="text-[12px] uppercase tracking-wider font-extrabold whitespace-nowrap">
              {t.vibe_label}
              {selectedVibes.length > 0 && ` (${selectedVibes.length})`}
            </span>
          </button>
        </div>

        <AnimatePresence>
          {vibeFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              className="overflow-hidden"
            >
              <div className="bg-[#FAF9F5]/90 border border-border-main p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[12px] uppercase tracking-widest font-extrabold text-[#5C5A4D]">
                    {t.filter_vibe_label}
                  </span>
                  {selectedVibes.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedVibes([]);
                        triggerHaptic(10);
                      }}
                      className="text-[12px] uppercase tracking-wider font-extrabold text-accent-red hover:underline cursor-pointer min-h-[36px] flex items-center"
                    >
                      {t.clear_all}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      toggleVibeFilter('like');
                      triggerHaptic(10);
                    }}
                    className={`py-3 px-1.5 rounded-xl border text-center font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer min-h-[44px] ${
                      selectedVibes.includes('like')
                        ? 'bg-accent-red/10 border-accent-red/40 text-accent-red shadow-sm'
                        : 'bg-white border-border-main text-[#5C5A4D] hover:bg-brand-pearl hover:text-accent-red'
                    }`}
                  >
                    <Heart size={13} fill={selectedVibes.includes('like') ? '#8A1F1F' : 'none'} className="text-accent-red" />
                    <span>{(FEEDBACK_TRANSLATIONS[language] || FEEDBACK_TRANSLATIONS['en']).perfect}</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleVibeFilter('intrigue');
                      triggerHaptic(10);
                    }}
                    className={`py-3 px-1.5 rounded-xl border text-center font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer min-h-[44px] ${
                      selectedVibes.includes('intrigue')
                        ? 'bg-[#EAB308]/10 border-yellow-500/40 text-[#EAB308] shadow-sm'
                        : 'bg-white border-border-main text-[#5C5A4D] hover:bg-brand-pearl hover:text-[#EAB308]'
                    }`}
                  >
                    <Heart size={13} fill={selectedVibes.includes('intrigue') ? '#EAB308' : 'none'} className="text-[#EAB308]" />
                    <span>{(FEEDBACK_TRANSLATIONS[language] || FEEDBACK_TRANSLATIONS['en']).intrigue}</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleVibeFilter('dislike');
                      triggerHaptic(10);
                    }}
                    className={`py-3 px-1.5 rounded-xl border text-center font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer min-h-[44px] ${
                      selectedVibes.includes('dislike')
                        ? 'bg-brand-charcoal border-brand-charcoal text-white shadow-sm'
                        : 'bg-white border-border-main text-[#5C5A4D] hover:bg-brand-pearl'
                    }`}
                  >
                    <Heart size={13} fill="none" className={selectedVibes.includes('dislike') ? 'text-white' : 'text-[#5C5A4D]/70'} />
                    <span>{(FEEDBACK_TRANSLATIONS[language] || FEEDBACK_TRANSLATIONS['en']).skip}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {exploreMode === 'categories' ? (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar touch-pan-x">
          <button 
            onClick={() => {
              setSelectedCategory(null);
              triggerHaptic(10);
            }}
            className={`px-5 py-3 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm active:scale-95 cursor-pointer min-h-[44px] ${
              !selectedCategory ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold' : 'bg-white text-[#5C5A4D] border-border-main'
            }`}
          >
            {t.all}
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                triggerHaptic(10);
                if (recordCategoryViewSignal) {
                  recordCategoryViewSignal(cat.id);
                } else {
                  trackCategoryViewSignal(cat.id);
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm active:scale-95 cursor-pointer min-h-[44px] ${
                selectedCategory === cat.id ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold' : 'bg-white text-[#5C5A4D] border-border-main'
              }`}
            >
              {cat.icon}
              {t['category_' + cat.id.toLowerCase()] || cat.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar touch-pan-x">
          <button 
            onClick={() => {
              setSelectedAreaId(null);
              triggerHaptic(10);
            }}
            className={`px-5 py-3 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm active:scale-95 cursor-pointer min-h-[44px] ${
              !selectedAreaId ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold' : 'bg-white text-[#5C5A4D] border-border-main'
            }`}
          >
            {t.all}
          </button>
          {REGIONS.map(reg => (
            <button 
              key={reg.id}
              onClick={() => {
                setSelectedAreaId(reg.id);
                triggerHaptic(10);
              }}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-full text-[12px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm active:scale-95 cursor-pointer min-h-[44px] ${
                selectedAreaId === reg.id ? 'bg-brand-charcoal text-white border-brand-charcoal font-bold' : 'bg-white text-[#5C5A4D] border-border-main'
              }`}
            >
              <span className="text-accent-teal">{reg.icon}</span>
              <span>{reg.name[language as keyof typeof reg.name] || reg.name.en}</span>
            </button>
          ))}
        </div>
      )}

      <ContextEnginePanel
        language={language}
        currentWeather={currentWeather}
        setCurrentWeather={setCurrentWeather}
        currentDayOfWeek={currentDayOfWeek}
        setCurrentDayOfWeek={setCurrentDayOfWeek}
        currentTimeMinutes={currentTimeMinutes}
        setCurrentTimeMinutes={setCurrentTimeMinutes}
        proximityReference={proximityReference}
        setProximityReference={setProximityReference}
        maxWalkingDistanceKm={maxWalkingDistanceKm}
        setMaxWalkingDistanceKm={setMaxWalkingDistanceKm}
        showEverything={showEverything}
        setShowEverything={setShowEverything}
        totalRecommendationsCount={allRecommendationsLength}
        filteredCount={searchFilteredRecs.length}
        triggerHaptic={triggerHaptic}
      />

      {selectedCategory === null && selectedAreaId === null && !showEverything && (
        <section className="space-y-4 pt-1 pb-2">
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-brand-charcoal tracking-tight">
              {(PAIRINGS_TRANSLATIONS[language] || PAIRINGS_TRANSLATIONS['en']).title}
            </h3>
            <p className="text-[11px] text-[#5C5E54] leading-normal font-sans tracking-tight">
              {(PAIRINGS_TRANSLATIONS[language] || PAIRINGS_TRANSLATIONS['en']).subtitle}
            </p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar touch-pan-x">
            {BUSINESS_PAIRINGS.map((p) => {
              const rec1 = recommendations.find((r: any) => r.id === p.rec1Id);
              const rec2 = recommendations.find((r: any) => r.id === p.rec2Id);
              const pairingsLocal = PAIRINGS_TRANSLATIONS[language] || PAIRINGS_TRANSLATIONS['en'];
              if (!rec1 || !rec2) return null;

              return (
                <div 
                  key={p.id} 
                  className="w-[290px] flex-shrink-0 bg-white border border-border-main p-4.5 rounded-[32px] shadow-tactile flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[7.5px] uppercase font-black tracking-[0.2em] bg-[#ECEAE2] text-[#5C5E54] border border-[#D9D7CE]/30 px-2.5 py-0.5 rounded-full leading-none">
                        {p.badge[language] || p.badge['en']}
                      </span>
                      <span className="text-[8px] uppercase font-bold text-accent-teal flex items-center gap-1 leading-none">
                        <Zap size={10} />
                        {pairingsLocal.both_title}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-serif font-bold text-brand-charcoal leading-tight">
                      {p.title[language] || p.title['en']}
                    </h4>
                    <p className="text-[10.5px] text-[#5C5E54]/80 leading-relaxed font-sans mt-1.5 italic">
                      {p.description[language] || p.description['en']}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2 bg-[#F6F5F2] p-2 rounded-2xl relative border border-[#ECEAE6]">
                    {/* Option 1 */}
                    <div 
                      onClick={() => onSelectRec(rec1.id)}
                      className="flex gap-2 items-center bg-white hover:bg-brand-pearl p-2 rounded-xl border border-border-main/20 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      {lowSignalMode ? (
                        <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-border-main/50 flex items-center justify-center select-none text-[8px] font-mono text-[#8C8A7D] shrink-0">
                          ✦
                        </div>
                      ) : (
                        <LazyImage src={rec1.image} containerClassName="w-8 h-8 rounded-lg flex-shrink-0" className="w-8 h-8 rounded-lg object-cover bg-neutral-100" alt="" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[7px] uppercase font-black text-accent-red tracking-wider leading-none">
                          {formatCategory(rec1.category, t)}
                        </p>
                        <h5 className="font-serif text-[11px] font-bold text-brand-charcoal leading-tight truncate mt-0.5">
                          {getLocalizedValue(rec1, 'title', language)}
                        </h5>
                        <p className="text-[8px] text-brand-charcoal/40 font-medium truncate mt-0.5 flex items-center gap-0.5">
                          <Clock size={8} /> {rec1.travelTime}
                        </p>
                      </div>
                      <ChevronRight size={12} className="text-brand-charcoal/30" />
                    </div>

                    {/* Aesthetic Circular Spacer & Connector */}
                    <div className="absolute top-[48%] left-3 w-4 h-4 rounded-full bg-[#EAE8DF] flex items-center justify-center text-[#5C5E54] text-[8px] font-black border border-border-main/30 shadow-sm z-10">
                      &
                    </div>

                    {/* Option 2 */}
                    <div 
                      onClick={() => onSelectRec(rec2.id)}
                      className="flex gap-2 items-center bg-white hover:bg-brand-pearl p-2 rounded-xl border border-border-main/20 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      {lowSignalMode ? (
                        <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] border border-border-main/50 flex items-center justify-center select-none text-[8px] font-mono text-[#8C8A7D] shrink-0">
                          ✦
                        </div>
                      ) : (
                        <LazyImage src={rec2.image} containerClassName="w-8 h-8 rounded-lg flex-shrink-0" className="w-8 h-8 rounded-lg object-cover bg-neutral-100" alt="" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[7px] uppercase font-black text-accent-red tracking-wider leading-none">
                          {formatCategory(rec2.category, t)}
                        </p>
                        <h5 className="font-serif text-[11px] font-bold text-brand-charcoal leading-tight truncate mt-0.5">
                          {getLocalizedValue(rec2, 'title', language)}
                        </h5>
                        <p className="text-[8px] text-brand-charcoal/40 font-medium truncate mt-0.5 flex items-center gap-0.5">
                          <Clock size={8} /> {rec2.travelTime}
                        </p>
                      </div>
                      <ChevronRight size={12} className="text-brand-charcoal/30" />
                    </div>
                  </div>
                  
                  <p className="text-[8px] font-serif text-[#8C8A7D] text-center mt-3 font-medium">
                    {pairingsLocal.click_to_view}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {selectedCategory === null && selectedAreaId === null && !showEverything && (
        <div className="h-[1px] bg-border-main/60 w-full" />
      )}

      <div className="flex justify-between items-center gap-4 pt-1 relative">
        <h3 className="text-xl font-serif text-brand-charcoal tracking-tight">
          {showEverything
            ? (language === 'sr' ? 'Sve preporuke (Poređane po kontekstu)' : 'All Experiences (Context-Ranked)')
            : (exploreMode === 'categories'
                ? (selectedCategory === null 
                    ? (PAIRINGS_TRANSLATIONS[language] || PAIRINGS_TRANSLATIONS['en']).all_discoveries 
                    : (t['category_' + selectedCategory.toLowerCase()] || selectedCategory))
                : (selectedAreaId === null
                    ? (language === 'sr' ? 'Sve lokacije' : language === 'zh' ? '全部地理发现' : 'All Curated Districts')
                    : (REGIONS.find(reg => reg.id === selectedAreaId)?.name[language as any] || 'Curated district')))}
        </h3>

        {/* Custom Premium Minimal Sort Selector */}
        <div className="relative shrink-0 z-[60]">
          <button
            onClick={() => {
              setSortOpen(!sortOpen);
              triggerHaptic(10);
            }}
            className="h-9 px-3 rounded-2xl bg-white border border-[#D5D3C8] hover:bg-[#FAF9F5] flex items-center gap-1.5 shadow-sm text-[8.5px] font-black uppercase tracking-wider text-brand-charcoal active:scale-95 transition-all cursor-pointer select-none"
          >
            <Sliders size={11} className="text-accent-teal" />
            <span>
              {(SORT_TRANSLATIONS[language] || SORT_TRANSLATIONS['en'])[sortBy]}
            </span>
          </button>

          <AnimatePresence>
            {sortOpen && (
              <>
                {/* Backdrop overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-[110]" 
                  onClick={() => setSortOpen(false)}
                />
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-[#E7E4DB] rounded-2xl p-1.5 shadow-[0_15px_30px_rgba(0,0,0,0.12)] z-[120] flex flex-col gap-0.5 text-left"
                >
                  <p className="px-2.5 py-1 text-[7.5px] uppercase tracking-widest font-black text-brand-charcoal/40 border-b border-[#F0EDE6] select-none pb-1.5 mb-1">
                    {(SORT_TRANSLATIONS[language] || SORT_TRANSLATIONS['en']).sort_by}
                  </p>
                  
                  {(['featured', 'shortest', 'longest'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setSortOpen(false);
                        triggerHaptic(10);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-[8.5px] font-bold uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                        sortBy === opt 
                          ? 'bg-[#1E2E20]/5 text-[#1E2E20] font-black border-l-4 border-accent-teal pl-1.5' 
                          : 'text-brand-charcoal/70 hover:bg-[#FAF9F5] hover:text-brand-charcoal'
                      }`}
                    >
                      <span>{(SORT_TRANSLATIONS[language] || SORT_TRANSLATIONS['en'])[opt]}</span>
                      {sortBy === opt && <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {sortedFilteredRecs.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 35,
                mass: 1,
                opacity: { duration: 0.25 }
              }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              key={item.id}
              onClick={() => onSelectRec(item.id)}
              className="bg-white rounded-[32px] overflow-hidden border border-border-main shadow-tactile flex h-[102px] cursor-pointer transition-shadow duration-300 hover:shadow-md"
            >
              <div className="w-[102px] h-full overflow-hidden border-r border-border-main relative animate-fade-in flex items-center justify-center bg-neutral-100">
                {lowSignalMode ? (
                  <div className="w-full h-full bg-[#FAF9F5] flex flex-col items-center justify-center p-2 text-center select-none">
                    <span className="text-xs uppercase font-serif opacity-30 text-brand-charcoal">✦</span>
                    <span className="text-[7.5px] font-mono tracking-wider text-[#8C8A7D] uppercase mt-1">Preserved</span>
                  </div>
                ) : (
                <LazyImage 
                  src={item.image} 
                  alt={getLocalizedValue(item, 'title', language)} 
                  className="w-full h-full object-cover" 
                />
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start max-w-[95%]">
                  <div className="px-2 py-0.5 bg-white/85 backdrop-blur-md rounded-lg border border-border-main shadow-sm">
                    <p className="text-[7px] uppercase font-bold text-accent-red tracking-tight leading-none">
                      {formatCategory(item.category, t)}
                    </p>
                  </div>

                  {ratings && ratings[item.id] && ratings[item.id].vibe !== 'dislike' && (
                    <div className="px-1.5 py-0.5 bg-[#E8F5E9]/95 backdrop-blur-md rounded-lg border border-[#2E7D32]/20 shadow-sm flex items-center gap-0.5 leading-none">
                      <span className="text-[6.5px] uppercase font-black text-[#2E7D32] tracking-wider font-sans">
                        ✓ {ratings[item.id].vibe === 'love' ? 'FAVORITE' : 'VALIDATED'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 py-2.5 px-3.5 flex flex-col justify-between min-w-0">
                <div className="flex justify-between items-start gap-1">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-[15px] font-serif text-brand-charcoal leading-tight line-clamp-2 pb-[1px]">
                      {getLocalizedValue(item, 'title', language)}
                    </h4>
                    <p className="text-[10px] text-brand-charcoal/40 font-medium flex items-center gap-1">
                      <MapPin size={10} className="text-accent-red" />
                      {getLocalizedValue(item, 'location', language)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {item.badge && (
                      <div className="shrink-0 scale-90 origin-top-right">
                        <PremiumBadge type={item.badge} compact />
                      </div>
                    )}
                    <MiniMoodGrid coordinateX={item.coordinateX} coordinateY={item.coordinateY} className="scale-90 origin-top-right" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1.5 border-t border-border-main/40">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ChevronRight size={10} className="text-accent-red shrink-0" />
                    <span className="text-[9px] font-bold text-brand-charcoal truncate">{item.estimatedCost}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock size={10} className="text-accent-red shrink-0" />
                    <span className="text-[9px] font-bold text-brand-charcoal truncate">{item.travelTime}</span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Zap size={10} className="text-accent-red shrink-0" />
                    <span className="text-[9px] font-bold text-brand-charcoal truncate">{item.preferredTransport}</span>
                  </div>
                  {item.coordinates && (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={10} className="text-accent-red shrink-0" />
                      <span className="text-[9px] font-bold text-brand-charcoal truncate">Maps</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {finalFilteredRecs.length === 0 && (
          <div className="bg-[#FAF9F5]/70 border border-border-main/40 p-8 rounded-[32px] text-center space-y-3.5 shadow-sm">
            <Heart size={36} className="mx-auto text-brand-charcoal/20" />
            <div className="space-y-1">
              <h4 className="font-serif text-[15px] font-bold text-brand-charcoal">
                {language === 'sr' ? 'Nema rezultata za ovaj vajb' : language === 'zh' ? '暂无符合该氛围的推荐' : 'No Vibe Matches Found'}
              </h4>
              <p className="text-[10.5px] text-brand-charcoal/50 leading-relaxed font-sans max-w-[240px] mx-auto">
                {language === 'sr' 
                  ? 'Istražite preporuke i označite ih u detaljima da biste kalibrisali svoj vajb filter.' 
                  : language === 'zh' 
                  ? '去详情页给推荐打分，即可在此进行个性化推荐筛选。' 
                  : 'Start exploring and rating recommendations in their detail cards to calibrate your personal vibe filters.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* 4. Dynamic correlation explanatory modal */}
    <AnimatePresence>
      {showCorrelationModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" id="correlation-modal">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 flex flex-col relative text-left"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCorrelationModal(false);
                triggerHaptic(10);
              }}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
              id="close-correlation-modal"
            >
              ✕
            </button>

            <div className="space-y-4 pt-2">
              <span className="text-[8px] uppercase tracking-[0.25em] text-accent-teal font-black block leading-none">
                {isSr ? 'POVEZANOST I UTICAJ NA PREPORUKE' : isZh ? '画像关联与推荐机制' : 'ALIGNMENT & OFFER INFLUENCE'}
              </span>
              
              <h4 className="text-base font-serif font-black text-brand-charcoal tracking-tight leading-snug">
                {isCultural && !isSr && !isZh ? (
                  'How Do Your Persona & Vibe Work Together?'
                ) : (
                  isSr ? 'Kako se Vaša Persona i Vajb dopunjuju?' : isZh ? '您的旅行人格与核心氛围如何相辅相成？' : 'How Do Your Persona & Vibe Relate?'
                )}
              </h4>

              <div className="space-y-3.5 text-[#2D3025] text-[11.5px] leading-relaxed font-medium">
                {isCultural && !isSr && !isZh ? (
                  <>
                    <p>
                      Your <strong>Mood Orbit</strong> is where personalization begins. By adjusting it, you tell IDEMO how you feel today.
                    </p>
                    <p className="border-t border-[#2D3025]/10 pt-3">
                      Your <strong>Vibe</strong> reflects your current mood, while your <strong>Persona</strong> represents your broader travel style, shaped over time by your preferences and interactions.
                    </p>
                    <p>
                      Together, they help IDEMO curate recommendations that feel personal and relevant—all processed privately on your device.
                    </p>
                    <p className="border-t border-[#2D3025]/10 pt-3 text-xs font-bold text-accent-teal">
                      <strong>New to IDEMO?</strong> Visit <strong>Profile</strong> and calibrate your Mood Orbit for more personalized recommendations.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      {isSr ? (
                        <>
                          Vaša <strong>Preovlađujuća Persona</strong> predstavlja Vaš osnovni, dugoročni stil putovanja (određen položajem Mood Orbite). S druge strane, <strong>Atmosfera / Vajb</strong> je trenutni dinamički odraz Vaših izabranih kategorija interesovanja.
                        </>
                      ) : isZh ? (
                        <>
                          您的<strong>核心旅行人格</strong>代表您长期且本质的探索方式（由情绪星轨定义），而<strong>核心氛围</strong>则是您当前选择的兴趣品类的动态映射。
                        </>
                      ) : (
                        <>
                          Your <strong>Dominant Persona</strong> represents your core, long-term travel style (defined by your Mood Orbit position), while <strong>Vibe & Atmosphere</strong> reflects your active interest categories right now.
                        </>
                      )}
                    </p>
                    <p className="border-t border-[#2D3025]/10 pt-3 text-xs font-bold text-accent-teal">
                      {isSr ? (
                        <>
                          <strong>Novo na IDEMO?</strong> Posetite <strong>Profil</strong> i kalibrišite Vašu Mood Orbitu za još personalizovanije preporuke.
                        </>
                      ) : isZh ? (
                        <>
                          <strong>新使用 IDEMO？</strong> 访问 <strong>个人资料</strong> 校准您的 Mood Orbit，获取更个性化的推荐。
                        </>
                      ) : (
                        <>
                          <strong>New to IDEMO?</strong> Visit <strong>Profile</strong> and calibrate your Mood Orbit for more personalized recommendations.
                        </>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
);
};

const ONBOARDING_TRANSLATIONS: Record<string, any> = {
  en: {
    cards: [
      {
        eyebrow: "PRIVATE BY DESIGN • 100% LOCAL",
        title: "YOUR PROFILE. YOUR START.",
        description: "Every journey begins differently. Tell IDEMO what you enjoy, how much time you have and how you feel today. In less than a minute, your personal guide is ready to curate experiences that fit you—not the average traveller.",
        bottom_statement: "Configure once. Discover effortlessly.",
        chips: [
          { icon: "Shield", label: "Private by Design" },
          { icon: "Clock", label: "Under One Minute" },
          { icon: "RefreshCw", label: "Update Anytime" }
        ]
      },
      {
        eyebrow: "PERSONALISED DISCOVERY",
        title: "DISCOVER WHAT FITS NOW.",
        description: "Your mood changes. Your recommendations should too. IDEMO carefully matches places and experiences to your interests, available time, budget and current location, so every suggestion feels relevant when you need it.",
        bottom_statement: "Quality over quantity.",
        chips: [
          { icon: "Target", label: "Personalised" },
          { icon: "Star", label: "Carefully Curated" },
          { icon: "MapPin", label: "Location Aware" },
          { icon: "Clock", label: "Fits Your Time" }
        ]
      },
      {
        eyebrow: "LOCAL CONCIERGE • TRUSTED EXPERTS",
        title: "EXPLORE WITH CONFIDENCE.",
        description: "Save favourite places, build your personal travel plan and enjoy Serbia with confidence. Whenever you want local insight or assistance, IDEMO Concierge and trusted local experts are ready to help.",
        bottom_statement: "Your private local companion.",
        chips: [
          { icon: "Bookmark", label: "Save Favourites" },
          { icon: "Calendar", label: "Travel Plan" },
          { icon: "MessageSquare", label: "Concierge" },
          { icon: "Users", label: "Trusted Local Experts" }
        ]
      }
    ],
    start: "Start Exploring",
    next: "Continue",
    skip: "Skip",
    trust_line: "No registration required. Your preferences stay private on your device.",
    trust_ribbon: "PRIVATE BY DESIGN • CURATED EXPERIENCES • TRUSTED LOCAL EXPERTS",
    card_indicator: "Step"
  },
  sr: {
    cards: [
      {
        eyebrow: "PRIVATNOST PO DIZAJNU • 100% LOKALNO",
        title: "VAŠ PROFIL. VAŠ POČETAK.",
        description: "Svako putovanje počinje drugačije. Recite IDEMO aplikaciji šta volite, koliko vremena imate i kako se danas osećate. Za manje od minuta, vaš lični vodič je spreman da odabere iskustva koja odgovaraju vama—a ne prosečnom putniku.",
        bottom_statement: "Podesite jednom. Otkrivajte bez napora.",
        chips: [
          { icon: "Shield", label: "Privatnost po dizajnu" },
          { icon: "Clock", label: "Ispod jednog minuta" },
          { icon: "RefreshCw", label: "Ažurirajte bilo kada" }
        ]
      },
      {
        eyebrow: "PERSONALIZOVANO OTKRIVANJE",
        title: "OTKRIJTE ŠTA VAM SAD PRIJA.",
        description: "Vaše raspoloženje se menja. Vaše preporuke bi takođe trebalo. IDEMO pažljivo usklađuje mesta i iskustva sa vašim interesovanjima, vremenom, budžetom i trenutnom lokacijom.",
        bottom_statement: "Kvalitet ispred kvantiteta.",
        chips: [
          { icon: "Target", label: "Personalizovano" },
          { icon: "Star", label: "Pažljivo odabrano" },
          { icon: "MapPin", label: "Svesno lokacije" },
          { icon: "Clock", label: "Prilagođeno vašem vremenu" }
        ]
      },
      {
        eyebrow: "LOKALNI KONSIJERŽ • PROVERENI STRUČNJACI",
        title: "ISTRAŽUJTE SA SAMOPOUZDANJEM.",
        description: "Sačuvajte omiljena mesta, kreirajte lični plan putovanja i uživajte u Srbiji sa samopouzdanjem. Kada god poželite lokalni uvid ili pomoć, IDEMO konsijerž i provereni lokalni stručnjaci su tu da pomognu.",
        bottom_statement: "Vaš privatni lokalni saputnik.",
        chips: [
          { icon: "Bookmark", label: "Sačuvajte omiljeno" },
          { icon: "Calendar", label: "Plan putovanja" },
          { icon: "MessageSquare", label: "Konsijerž" },
          { icon: "Users", label: "Provereni lokalni stručnjaci" }
        ]
      }
    ],
    start: "Započni istraživanje",
    next: "Nastavi",
    skip: "Preskoči",
    trust_line: "Bez registracije. Vaše preferencije ostaju privatne na vašem uređaju.",
    trust_ribbon: "PRIVATNOST PO DIZAJNU • PAŽLJIV IZBOR • PROVERENI LOKALNI STRUČNJACI",
    card_indicator: "Korak"
  },
  zh: {
    cards: [
      {
        eyebrow: "原生隐私保护 • 100% 深度本土",
        title: "您的资料。您的起点。",
        description: "每一段旅程各有不同。告知 IDEMO 您的喜好、可用时间与当下心境。不到一分钟，您的专属随行指南即可为您精准甄选体验。",
        bottom_statement: "一次配置，从容无忧探索。",
        chips: [
          { icon: "Shield", label: "原生隐私保护" },
          { icon: "Clock", label: "一分钟内快速校准" },
          { icon: "RefreshCw", label: "随时随心更新" }
        ]
      },
      {
        eyebrow: "专属个性化探索",
        title: "发现当下契合之选。",
        description: "心境在变，推荐亦随之演进。IDEMO 根据您的兴趣、可用时间、预算及实时位置精细匹配，让每一项建议都恰到好处。",
        bottom_statement: "精益求精，重质不重量。",
        chips: [
          { icon: "Target", label: "专属个性化" },
          { icon: "Star", label: "严选深度甄选" },
          { icon: "MapPin", label: "实时位置感知" },
          { icon: "Clock", label: "契合可用时间" }
        ]
      },
      {
        eyebrow: "本土礼宾 • 值得信赖的本地专家",
        title: "从容自信探索。",
        description: "收藏心仪目的地，定制专属行程，从容自信探索塞尔维亚。如需深入本土建议，IDEMO 礼宾与值得信赖的本地专家随时为您提供支持。",
        bottom_statement: "您的专属私人本土随行伙伴。",
        chips: [
          { icon: "Bookmark", label: "收藏心仪之地" },
          { icon: "Calendar", label: "专属行程规划" },
          { icon: "MessageSquare", label: "专属礼宾服务" },
          { icon: "Users", label: "值得信赖的本地专家" }
        ]
      }
    ],
    start: "开始探索之旅",
    next: "继续",
    skip: "跳过",
    trust_line: "无需注册。偏好设置私密地保留在您的个人设备中。",
    trust_ribbon: "原生隐私保护 • 深度甄选体验 • 值得信赖的本地专家",
    card_indicator: "步骤"
  }
};

function OnboardingOverlay({ language, onClose }: { language: string; onClose: () => void }) {
  const [cardIndex, setCardIndex] = useState(0);

  const t = ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS['en'];

  const renderChipIcon = (iconName: string) => {
    const props = { size: 12, className: "text-brand-charcoal stroke-[1.5] shrink-0 opacity-80" };
    switch (iconName) {
      case 'Shield': return <Shield {...props} />;
      case 'Clock': return <Clock {...props} />;
      case 'RefreshCw': return <RefreshCw {...props} />;
      case 'Target': return <Target {...props} />;
      case 'Star': return <Star {...props} />;
      case 'MapPin': return <MapPin {...props} />;
      case 'Bookmark': return <Bookmark {...props} />;
      case 'Calendar': return <CalendarIcon {...props} />;
      case 'MessageSquare': return <MessageSquare {...props} />;
      case 'Users': return <Users {...props} />;
      default: return <Shield {...props} />;
    }
  };

  const VISUAL_ILLUSTRATIONS = [
    // Card 1 Editorial Illustration: Premium Tactile Mood Orb Watch Centerpiece (~30% screen height)
    (
      <div className="flex-shrink-0 w-full h-[28vh] min-h-[160px] max-h-[220px] rounded-[24px] bg-[#F7F6F0] border border-[#E2DFC2]/60 p-3 relative overflow-hidden flex items-center justify-center select-none shadow-inner">
        {/* Subtle radial dial markings background */}
        <div className="absolute inset-0 bg-[radial-gradient(#23251E_1px,transparent_1px)] [background-size:18px_18px] opacity-[0.04] pointer-events-none" />

        {/* Tactile Mood Orb Watch Centerpiece */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="p-3 rounded-full bg-white/85 backdrop-blur-md border border-[#D8D5C8] shadow-md flex items-center justify-center">
            <PulsatingProfileButton size={78} language={language} onClick={() => {}} />
          </div>
        </div>
      </div>
    ),
    // Card 2 Editorial Illustration: Integrated Panoramic Uvac Landscape & 2D Recommendation Field Overlay
    (
      <div className="flex-shrink-0 w-full h-[28vh] min-h-[160px] max-h-[220px] rounded-[24px] bg-[#FAF9F5] border border-[#E2DFC2]/60 relative overflow-hidden flex items-center justify-center select-none shadow-inner group">
        {/* Background Panoramic Landscape Slice: Uvac Meanders */}
        <LazyImage 
          src="assets/images/uvac_meanders_1778841048759.png" 
          alt="Uvac Meanders" 
          containerClassName="absolute inset-0 w-full h-full"
          className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08] transition-transform duration-700 group-hover:scale-105"
        />

        {/* Editorial Vignette & Glassy Backdrop Tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/40 backdrop-blur-[0.5px]" />

        {/* Concentric orbital radar rings */}
        <div className="absolute w-28 h-28 rounded-full border border-dashed border-white/35 pointer-events-none" />
        <div className="absolute w-40 h-40 rounded-full border border-white/20 pointer-events-none" />

        {/* Integrated 2D Field Axes (Clearly Visible) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-white/40 shadow-xs" />
          <div className="absolute h-full w-[1px] bg-white/40 shadow-xs" />
        </div>

        {/* Established Axis Names (Exactly as used throughout IDEMO) */}
        <span className="absolute top-2 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/95 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
          URBAN ↑
        </span>
        <span className="absolute bottom-2 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/95 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
          ↓ NATURE
        </span>
        <span className="absolute left-2 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/95 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
          ← HEDONIST
        </span>
        <span className="absolute right-2 text-[8px] font-mono font-bold uppercase tracking-[0.2em] text-white/95 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
          ADVENTURER →
        </span>

        {/* Glowing Recommendation Orb (Clearly Visible) */}
        <div 
          className="absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
          style={{ left: '60%', top: '70%' }}
        >
          <div className="relative flex items-center justify-center">
            {/* Outer pulse aura */}
            <div className="absolute w-10 h-10 rounded-full bg-amber-400/40 animate-ping" />
            <div className="absolute w-7 h-7 rounded-full bg-amber-300/50 blur-xs" />
            {/* Core Glowing Orb Dot */}
            <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-white border-2 border-white shadow-[0_0_12px_rgba(251,191,36,0.9)] z-10" />
            {/* Coordinate Tag */}
            <div className="absolute -top-6 bg-black/80 backdrop-blur-md text-amber-300 text-[8.5px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm font-bold border border-amber-400/30">
              98% VIBE MATCH
            </div>
          </div>
        </div>
      </div>
    ),
    // Card 3 Editorial Illustration: Authentic Manasija Monastery Heritage Spot
    (
      <div className="flex-shrink-0 w-full h-[28vh] min-h-[160px] max-h-[220px] rounded-[24px] bg-[#F7F6F0] border border-[#E2DFC2]/60 p-1.5 relative overflow-hidden select-none shadow-inner flex items-center justify-center">
        <div className="relative w-full h-full rounded-[18px] overflow-hidden group">
          <LazyImage 
            src="assets/images/manasija_monastery_1778841065960.png" 
            alt="Manasija Monastery" 
            containerClassName="w-full h-full rounded-[18px]"
            className="w-full h-full object-cover rounded-[18px] transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute top-2.5 left-3">
            <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-md text-[8px] font-mono uppercase tracking-widest text-[#8A1F1F] font-bold border border-white/40 shadow-xs">
              AUTHENTIC HERITAGE
            </span>
          </div>
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between text-white">
            <div>
              <h4 className="font-serif text-[15px] font-bold tracking-tight text-white drop-shadow-sm leading-tight">
                Manasija Monastery
              </h4>
              <p className="text-[9.5px] font-mono uppercase tracking-wider text-white/80 mt-0.5">
                15th Century Fortified Sanctuary • Despotovac
              </p>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[8.5px] font-mono uppercase tracking-wider text-white font-semibold border border-white/30 shrink-0">
              Curated Spot
            </div>
          </div>
        </div>
      </div>
    )
  ];

  const handleNext = () => {
    triggerHaptic(5);
    if (cardIndex < 2) {
      setCardIndex(cardIndex + 1);
    } else {
      onClose();
    }
  };

  const handleDismiss = () => {
    triggerHaptic(5);
    onClose();
  };

  const current = t.cards[cardIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-[1px] bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-5 rounded-[44px]"
    >
      <motion.div 
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="bg-[#FAF9F5] rounded-[28px] sm:rounded-[32px] border border-border-main p-4 sm:p-5 w-full max-w-md relative shadow-2xl flex flex-col space-y-3 sm:space-y-3.5 max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Top Header Controls & Progress Bar */}
        <div className="flex-shrink-0 w-full space-y-2">
          {/* 3-Segment Progress Bar */}
          <div className="flex gap-1.5 w-full">
            {[0, 1, 2].map(idx => (
              <div 
                key={idx}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  cardIndex === idx ? 'bg-brand-charcoal' : 'bg-brand-charcoal/15'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider text-brand-charcoal/50">
            <span>{t.card_indicator} {cardIndex + 1} / 3</span>
            {cardIndex < 2 && (
              <button 
                onClick={handleDismiss}
                className="hover:text-brand-charcoal transition-colors cursor-pointer py-0.5 px-2 -mr-2"
              >
                {t.skip}
              </button>
            )}
            {cardIndex === 2 && (
              <button 
                onClick={handleDismiss}
                className="hover:text-brand-charcoal transition-colors cursor-pointer p-1 -mr-1"
                aria-label="Dismiss Guide"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Editorial Visual Illustration Holder (~30% height) */}
        {VISUAL_ILLUSTRATIONS[cardIndex]}

        {/* Card Copy Content */}
        <div className="flex-shrink-0 space-y-2 text-left">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#8A1F1F] font-bold mb-0.5">
              {current.eyebrow}
            </p>
            <h3 className="text-[19px] sm:text-[22px] font-serif font-bold text-brand-charcoal leading-tight uppercase tracking-tight">
              {current.title}
            </h3>
            <p className="text-[12.5px] text-brand-charcoal/70 leading-relaxed font-sans mt-1.5">
              {current.description}
            </p>
            {current.bottom_statement && (
              <p className="text-[11.5px] font-serif italic text-[#8A1F1F] font-medium pt-1">
                “{current.bottom_statement}”
              </p>
            )}
          </div>

          {/* Minimal Monochromatic Trust Chips - No outlined boxes, clean outline icons */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-2 border-t border-border-main/20">
            {current.chips.map((chip: { icon: string; label: string }, idx: number) => (
              <div key={idx} className="inline-flex items-center gap-1.5 text-brand-charcoal/80">
                {renderChipIcon(chip.icon)}
                <span className="text-[10.5px] font-sans font-medium text-brand-charcoal/85 tracking-tight">{chip.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button, Trust Line & Premium Trust Ribbon */}
        <div className="flex-shrink-0 w-full space-y-2 pt-0.5">
          <button
            onClick={handleNext}
            className="w-full h-10 sm:h-11 rounded-[16px] bg-[#23251E] hover:bg-[#32352B] text-white flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.18em] text-[10.5px] shadow-sm group active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{cardIndex === 2 ? t.start : t.next}</span>
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform text-white/80" />
          </button>

          <p className="text-[9.5px] text-brand-charcoal/50 tracking-wide font-sans text-center select-none">
            {t.trust_line}
          </p>

          {/* Premium Trust Ribbon */}
          <div className="pt-1.5 border-t border-border-main/20 w-full text-center">
            <p className="text-[8.5px] sm:text-[9px] font-mono tracking-widest text-brand-charcoal/40 uppercase font-bold select-none">
              {t.trust_ribbon}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}



