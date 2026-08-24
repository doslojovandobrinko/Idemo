/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  Check, 
  Copy, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Phone, 
  QrCode, 
  Heart, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  X
} from 'lucide-react';
import { Category, Recommendation } from '../types';
import { TRANSLATIONS } from '../constants';
import { VibeSettings, DEFAULT_VIBE_SETTINGS, calculateVibeMatch } from './VibeCalibration';
import MoodOrbit from './MoodOrbit';
import PrivacyPolicyContent from './PrivacyPolicyContent';
import { ConciergeSOSHub } from './ConciergeSOSHub';
import { PartnerCard } from './PartnerCard';

// Direct trigger of haptic patterns
const triggerHaptic = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignored
    }
  }
};

export const ARCHETYPES: any[] = [
  {
    id: 'cultural_strategist',
    name: {
      en: 'Cultural Strategist',
      sr: 'Kulturni strateg',
      es: 'Estratega Cultural',
      de: 'Kultur-Stratege',
      ru: 'Культурный раскрыватель',
      zh: '文化思想家'
    },
    tagline: {
      en: 'Curious • Reflective • Sophisticated',
      sr: 'Radoznao • Promišljen • Sofisticiran',
      es: 'Curioso • Reflexivo • Sofificado',
      de: 'Neugierig • Nachdenklich • Anspruchsvoll',
      ru: 'Любознательный • Вдумчивый • Изысканный',
      zh: '好奇 • 沉思 • 雅致'
    },
    categories: [Category.HISTORY, Category.GASTRONOMY],
    targetBudget: 120,
    targetTime: 24,
    targetVibe: { heritageVSmodern: 1, gourmetVSmuseum: 5, natureVSnightlife: 3, classicsVSsecrets: 5, activeVSrelaxed: 4 },
    desc: {
      en: 'Deep architecture, historic monasteries, and rare local archives.',
      sr: 'Duboka arhitektura, istorijski manastiri i retki lokalni arhivi.',
      es: 'Arquitectura profunda, monasterios históricos y archivos raros.',
      de: 'Tiefgründige Architektur, historische Klöster und rare Archive.',
      ru: 'Интерес к архитектуре, древним монастырям и редким архивам.',
      zh: '深度建筑、历史修道院与极具深度本土文化。'
    }
  },
  {
    id: 'wellness_escapist',
    name: {
      en: 'Wellness Escapist',
      sr: 'Velnes eskapista',
      es: 'Escapista de Bienestar',
      de: 'Wellness-Aussteiger',
      ru: 'Искатель веллнеса',
      zh: '康养避世客'
    },
    tagline: {
      en: 'Calm • Restorative • Mindful',
      sr: 'Spokojan • Okrepljujući • Svestan',
      es: 'Tranquilo • Restaurativo • Consciente',
      de: 'Ruhig • Regenerativ • Achtsam',
      ru: 'Спокойный • Восстанавливающий • Осознанный',
      zh: '平静 • 恢复 • 正念'
    },
    categories: [Category.WELLBEING, Category.MEDICAL, Category.NATURE],
    targetBudget: 180,
    targetTime: 36,
    targetVibe: { heritageVSmodern: 3, gourmetVSmuseum: 3, natureVSnightlife: 1, classicsVSsecrets: 4, activeVSrelaxed: 5 },
    desc: {
      en: 'Thermal sanctuaries, longevity clinics, and mountain forest retreats.',
      sr: 'Termalna svetilišta, klinike za dugovečnost i šumska utočišta.',
      es: 'Santuarios térmicos, clínicas de longevidad y retiros forestales.',
      de: 'Thermalbäder, Langlebigkeitskliniken und Bergwälder.',
      ru: 'Термальные источники, спа-отели и лесные горные курорты.',
      zh: '温泉疗养所、长寿诊所与山林静修地。'
    }
  },
  {
    id: 'culinary_explorer',
    name: {
      en: 'Culinary Explorer',
      sr: 'Kulinarski istraživač',
      es: 'Explorador Culinario',
      de: 'Kulinarischer Entdecker',
      ru: 'Кулинарный исследователь',
      zh: '美食品鉴家'
    },
    tagline: {
      en: 'Indulgent • Analytical • Epicurean',
      sr: 'Uživalac • Analitičan • Epikurejac',
      es: 'Indulgente • Analítico • Epicúreo',
      de: 'Genussvoll • Analytisch • Epikureisch',
      ru: 'Гурман • Аналитик • Эпикуреец',
      zh: '沉溺美食 • 分析主义 • 享乐主义'
    },
    categories: [Category.GASTRONOMY, Category.HISTORY],
    targetBudget: 250,
    targetTime: 12,
    targetVibe: { heritageVSmodern: 3, gourmetVSmuseum: 1, natureVSnightlife: 4, classicsVSsecrets: 3, activeVSrelaxed: 3 },
    desc: {
      en: 'Aged charcuterie, artisan single-vineyard cellars, and heritage bakeries.',
      sr: 'Sušeno meso, zanatski vinski podrumi i tradicionalne pekare.',
      es: 'Embutidos madurados, bodegas artesanales y panaderías patrimoniales.',
      de: 'Gereifte Wurstwaren, handwerkliche Weinkeller und Bäckereien.',
      ru: 'Вяленое мясо, ремесленные винодельни и старинные пекарни.',
      zh: '熟成肉品、手工单一葡萄园酒庄与传统老字号饼店。'
    }
  },
  {
    id: 'active_naturalist',
    name: {
      en: 'Active Urban Naturalist',
      sr: 'Aktivni urbani naturalista',
      es: 'Naturalista Urbano Activo',
      de: 'Aktiver Stadt-Naturfreund',
      ru: 'Активный любитель природы',
      zh: '活力都市健行者'
    },
    tagline: {
      en: 'Energetic • Scenic • Balanced',
      sr: 'Energičan • Slikovit • Uravnotežen',
      es: 'Enérgico • Escénico • Equilibrado',
      de: 'Energetisch • Malerisch • Ausgewogen',
      ru: 'Энергичный • Живописный • Сбалансированный',
      zh: '活力 • 风光 • 平衡'
    },
    categories: [Category.NATURE, Category.TRAVEL],
    targetBudget: 50,
    targetTime: 18,
    targetVibe: { heritageVSmodern: 3, gourmetVSmuseum: 2, natureVSnightlife: 1, classicsVSsecrets: 3, activeVSrelaxed: 1 },
    desc: {
      en: 'Epic gorges, multi-sport cycling, kayaking, and hiking trails.',
      sr: 'Epske klisure, biciklizam, vožnja kajaka i planinarske staze.',
      es: 'Gargantas épicas, ciclismo, kayak y senderos de montaña.',
      de: 'Schluchten, Radsport, Kajakfahren und Wanderpfade.',
      ru: 'Каньоны, веломаршруты, каякинг и горные тропы.',
      zh: '壮丽峡谷、户外骑行、落日划艇与健行步道。'
    }
  },
  {
    id: 'legacy_family',
    name: {
      en: 'Legacy Family Traveler',
      sr: 'Porodični putnik',
      es: 'Viajero Familiar Tradicional',
      de: 'Komfortabler Familienreisender',
      ru: 'Семейный путешественник',
      zh: '合家观光客'
    },
    tagline: {
      en: 'Comfortable • Educational • Shared',
      sr: 'Udoban • Edukativan • Zajednički',
      es: 'Cómodo • Educativo • Compartido',
      de: 'Bequem • Lehrreich • Gemeinsam',
      ru: 'Комфортный • Познавательный • Семейный',
      zh: '舒适 • 寓教极乐 • 共享'
    },
    categories: [Category.TRAVEL, Category.HISTORY],
    targetBudget: 140,
    targetTime: 16,
    targetVibe: { heritageVSmodern: 2, gourmetVSmuseum: 4, classicsVSsecrets: 1, activeVSrelaxed: 4 },
    desc: {
      en: 'Comfortable, multi-generational discoveries, and landmarks.',
      sr: 'Udobna, višegeneracijska otkrića i kultni spomenici.',
      es: 'Descubrimientos cómodos y multigeneracionales y atracciones.',
      de: 'Bequeme, generationenübergreifende Entdeckungen und Sehenswürdigkeiten.',
      ru: 'Комфортные путешествия для всей семьи i знаковые места.',
      zh: '舒适省心的多代家庭出游与地标打卡。'
    }
  }
];

export const ARCHETYPE_INTERESTS_MAP: Record<string, {
  label: Record<string, string>;
  keywords: string[];
}[]> = {
  cultural_strategist: [
    {
      label: {
        en: "Deep Architecture",
        sr: "Duboka arhitektura",
        es: "Arquitectura profunda",
        de: "Tiefgründige Architektur",
        ru: "Глубокая архитектура",
        zh: "深度建筑"
      },
      keywords: ["architecture", "fortress", "building", "tvrđava", "stefan", "belgrade fortress", "morava school", "tower", "castle", "gate", "structural", "savagery", "concrete hall", "morava", "kalemegdan"]
    },
    {
      label: {
        en: "Historic Monasteries",
        sr: "Istorijski manastiri",
        es: "Monasterios históricos",
        de: "Historische Klöster",
        ru: "Исторические монастыри",
        zh: "历史修道院"
      },
      keywords: ["monastery", "church", "frescoes", "resava", "manasija", "studenica", "monasteries", "byzantine", "temple", "orthodox", "fresco", "shrine"]
    },
    {
      label: {
        en: "Rare Local Archives",
        sr: "Retki lokalni arhivi",
        es: "Archivos locales raros",
        de: "Rare lokale Archive",
        ru: "Редкие местные архивы",
        zh: "罕见地方档案"
      },
      keywords: ["museum", "archives", "archive", "history", "legacy", "heritage", "artifacts", "scriptorium", "manuscripts", "tesla", "collection", "exhibit"]
    }
  ],
  wellness_escapist: [
    {
      label: {
        en: "Thermal Sanctuaries",
        sr: "Termalna svetilišta",
        es: "Santuarios térmicos",
        de: "Thermalbäder & Quellen",
        ru: "Термальные источники",
        zh: "温泉疗养处"
      },
      keywords: ["thermal", "spa", "bath", "spring", "pool", "water", "vrujci", "banja", "sanctuary", "wellness", "sauna"]
    },
    {
      label: {
        en: "Longevity Clinics & Mindful",
        sr: "Klinike za dugovečnost i svestan način života",
        es: "Clínicas de longevidad y bienestar consciente",
        de: "Langlebigkeitskliniken & Achtsamkeit",
        ru: "Клиники долголетия и осознанность",
        zh: "长寿调理与正念"
      },
      keywords: ["longevity", "clinic", "mindful", "mental", "wellness", "therapy", "escape", "treatment", "detox", "health", "herbal", "massage"]
    },
    {
      label: {
        en: "Mountain Forest Retreats",
        sr: "Planinska šumska utočišta",
        es: "Retiros en bosques de montaña",
        de: "Bergwald-Schutzhütten",
        ru: "Горно-лесные ретриты",
        zh: "山地原林避修"
      },
      keywords: ["mountain", "forest", "retreat", "tara", "kopaonik", "wood", "nature reserve", "lake", "hiking", "cabin", "pines", "scenic"]
    }
  ],
  culinary_explorer: [
    {
      label: {
        en: "Traditional Kafanas",
        sr: "Tradicionalne kafane",
        es: "Kafanas tradicionales",
        de: "Traditionelle Kafanas",
        ru: "Традиционные кафаны",
        zh: "传统老字号酒馆 (Kafanas)"
      },
      keywords: ["kafana", "tavern", "traditional", "serbian food", "meze", "rostilj", "cevapi", "sarme", "pečenje", "ethno", "gourmet", "dardaneli", "question mark"]
    },
    {
      label: {
        en: "Artisan Vineyard Cellars",
        sr: "Zanatski vinski podrumi",
        es: "Bodegas artesanales",
        de: "Handwerkliche Weinkeller",
        ru: "Ремесленные винодельни",
        zh: "匠人手作酒庄"
      },
      keywords: ["vineyard", "cellar", "winery", "wine", "tasting", "degustation", "vranac", "tamjanika", "rakija", "distillery", "sommelier", "vintage"]
    },
    {
      label: {
        en: "Heritage Bakeries",
        sr: "Tradicionalne pekare",
        es: "Panaderías tradicionales",
        de: "Traditionelle Bäckereien",
        ru: "Старинные пекарни",
        zh: "历史悠久饼店"
      },
      keywords: ["bakery", "pekara", "burek", "pogača", "pastry", "dough", "artisan bread", "traditional baking", "local baker", "strudla", "kifle"]
    }
  ],
  active_naturalist: [
    {
      label: {
        en: "Epic Gorges",
        sr: "Epske klisure",
        es: "Gargantas épicas",
        de: "Epische Schluchten",
        ru: "Великолепные каньоны",
        zh: "壮丽峡谷奇景"
      },
      keywords: ["gorge", "canyon", "meanders", "uvac", "cliffs", "river gorge", "rocks", "djerdap", "predator", "outlook", "viewpoint"]
    },
    {
      label: {
        en: "Multi-sport Cycling",
        sr: "Biciklizam na više spotova",
        es: "Ciclismo multideportivo",
        de: "Radsport",
        ru: "Велоспорт",
        zh: "多场地骑行探险"
      },
      keywords: ["cycling", "cyclist", "riding", "bike", "bicycle", "trail", "paved", "sport", "rental", "mtb", "hills"]
    },
    {
      label: {
        en: "Kayaking & Hiking Trails",
        sr: "Vožnja kajaka i planinarske staze",
        es: "Kayak y senderos de montaña",
        de: "Kajakfahren & Wanderwege",
        ru: "Каякинг и пешие тропы",
        zh: "划艇与徒步林道"
      },
      keywords: ["kayak", "kayaking", "hiking", "trails", "hike", "water", "lake", "paddle", "canoe", "rafting", "trekking"]
    }
  ],
  legacy_family: [
    {
      label: {
        en: "Comfortable Discoveries",
        sr: "Udobna otkrića",
        es: "Descubrimientos cómodos",
        de: "Bequeme Entdeckungen",
        ru: "Комфортные открытия",
        zh: "舒适省心观光"
      },
      keywords: ["comfortable", "tour", "cruise", "safari", "bus", "cabin", "ride", "gondola", "sightseeing", "guide", "transport"]
    },
    {
      label: {
        en: "Multi-generational Fun",
        sr: "Višegeneracijska zabava",
        es: "Diversión multigeneracional",
        de: "Mehrgenerationen-Erlebnisse",
        ru: "Развлеčenja za cijelu obitelj",
        zh: "老少皆宜共享"
      },
      keywords: ["family", "interactive", "zoo", "park", "kids", "museum for children", "science", "aquarium", "lake", "nature park", "play", "workshop"]
    },
    {
      label: {
        en: "Iconic Landmarks",
        sr: "Kultni spomenici",
        es: "Atracciones icónicas",
        de: "Kultige Sehenswürdigkeiten",
        ru: "Достопримечательности",
        zh: "城市标志性地标"
      },
      keywords: ["landmark", "monument", "temple", "gate", "tower", "statue", "pobednik", "saint sava", "square", "avala", "building"]
    }
  ]
};

// Reusable elegant parameter tile component (keeps layout unified and ultra-clean)
function ProfileDetailTile({ label, value, description, onClick, ariaLabel }: { label: string; value: string; description?: string; onClick?: () => void; ariaLabel?: string }) {
  const finalAria = ariaLabel || `${label}: ${value}. ${onClick ? 'Tap to view details.' : ''}`;
  return (
    <div 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={finalAria}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-[#FAF9F5] border border-[#2D3025]/10 px-4 py-3 rounded-2xl flex flex-col justify-between min-h-[72px] transition-all shadow-[0_1px_2px_rgba(35,37,30,0.01)] relative group text-left ${
        onClick 
          ? 'cursor-pointer hover:border-[#2D3025]/35 hover:bg-white/80 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent-teal/50' 
          : 'hover:border-[#2D3025]/20'
      }`}
    >
      <div className="pr-4">
        <span className="text-[9px] uppercase tracking-widest text-[#2D3025]/50 font-black leading-none block mb-1">
          {label}
        </span>
        <span className="text-[13px] font-extrabold text-[#2D3025] leading-snug">
          {value}
        </span>
      </div>
      {onClick && (
        <span className="absolute top-3 right-3 text-[#2D3025]/20 group-hover:text-[#2D3025]/50 transition-colors">
          <Info size={11} />
        </span>
      )}
      {description && (
        <span className="text-[10px] text-[#2D3025]/45 font-medium mt-1 leading-normal">
          {description}
        </span>
      )}
    </div>
  );
}

export default function ProfileScreen({ 
  language, 
  budget, setBudget, 
  time, setTime, 
  days, setDays, 
  timeOfDay, setTimeOfDay, 
  selectedCats, setSelectedCats,
  recommendations,
  onSelectRec,
  ratings,
  likedIds,
  lowSignalMode,
  onToggleLowSignal,
  onPurgeMemories,
  onResetOnboarding,
  onTriggerAdmin,
  onAddCustomRecommendations,
  orbitX,
  orbitY,
  onOrbitChange,
  confirmedAccuracyRecs,
  onConfirmAccuracy,
  onNavigate
}: any) {
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  const isSr = language === 'sr';
  const isZh = language === 'zh';
  const isEs = language === 'es';
  const isDe = language === 'de';
  const isRu = language === 'ru';

  const [purged, setPurged] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState<string | null>(null);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);

  // Staged Mood Orbit local state before explicit commit
  const [stagedX, setStagedX] = useState<number | null>(null);
  const [stagedY, setStagedY] = useState<number | null>(null);
  const [stagedBudget, setStagedBudget] = useState<number | null>(null);
  const [stagedTime, setStagedTime] = useState<number | null>(null);
  const [appliedToast, setAppliedToast] = useState(false);

  // Accordion states under "Trust & Privacy"
  const [trustOpen, setTrustOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const [confirmStep, setConfirmStep] = useState(0);

  // Hidden admin gesture state variables
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveExplanation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoPressStart = () => {
    if (!import.meta.env.DEV) return;
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      triggerHaptic([80, 50, 80]);
      if (onTriggerAdmin) {
        onTriggerAdmin();
      }
    }, 2500); // 2.5 seconds hold
  };

  const handleLogoPressEnd = () => {
    if (!import.meta.env.DEV) return;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const handleLogoTap = () => {
    if (!import.meta.env.DEV) return;
    const now = Date.now();
    if (now - lastTapTime < 600) {
      const nextCount = tapCount + 1;
      setTapCount(nextCount);
      if (nextCount >= 6) { // 6 rapid taps
        triggerHaptic([40, 40]);
        if (onTriggerAdmin) {
          onTriggerAdmin();
        }
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  // Safe wrapper for haptic feedback
  const playHaptic = (ms: number | number[]) => {
    triggerHaptic(ms);
  };

  const getResetSuccessMessage = () => {
    if (isSr) return 'Vodič je uspešno resetovan. Pri sledećem pokretanju biće Vam ponovo prikazan.';
    if (isZh) return '新手指南重置成功！下次启动应用时将自动展示。';
    if (isEs) return 'Guía de inicio restablecida con éxito.';
    if (isDe) return 'Einführung erfolgreich zurückgesetzt.';
    if (isRu) return 'Инструкция успешно сброшена.';
    return 'Introduction guide successfully reset. It will be presented again on your next session.';
  };

  const toggleCat = (cat: Category) => {
    playHaptic(10);
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c: Category) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const getVibeTag = (lang: string, cats: Category[], x: number, y: number) => {
    if (x !== undefined && y !== undefined) {
      if (x <= 0.45 && y <= 0.45) {
        if (isSr) return "Urbani velnes";
        if (isZh) return "都市疗愈";
        if (isEs) return "Bienestar Urbano";
        if (isDe) return "Urbane Wellness";
        if (isRu) return "Урбанистический гедонизм";
        return "Metropolis Hedonist";
      } else if (x > 0.55 && y <= 0.45) {
        if (isSr) return "Kulturno istraživanje";
        if (isZh) return "历史人文";
        if (isEs) return "Exploración Cultural";
        if (isDe) return "Kulturerkundung";
        if (isRu) return "Культурное исследование";
        return "Cultural Explorer";
      } else if (x <= 0.45 && y > 0.55) {
        if (isSr) return "Oaza spokoja";
        if (isZh) return "林野康养";
        if (isEs) return "Santuario de Bienestar";
        if (isDe) return "Wellness-Oase";
        if (isRu) return "Оазис велнеса";
        return "Wellness Sanctuary";
      } else if (x > 0.55 && y > 0.55) {
        if (isSr) return "Avantura na terenu";
        if (isZh) return "荒野探险";
        if (isEs) return "Aventura del Horizonte";
        if (isDe) return "Horizont-Abenteuer";
        if (isRu) return "Дикие горизонты";
        return "Horizon Explorer";
      } else {
        if (isSr) return "Uravnotežen putnik";
        if (isZh) return "平衡探索";
        if (isEs) return "Viajero Equilibrado";
        if (isDe) return "Ausgewogener Reisender";
        if (isRu) return "Сбалансированный путешественник";
        return "Balanced Voyager";
      }
    }

    let tag = 'Curated';
    if (lang === 'sr') tag = 'Odabrano';
    else if (lang === 'zh') tag = '臻选推荐';
    else if (lang === 'es') tag = 'Curado';
    else if (lang === 'de') tag = 'Kuratiert';
    else if (lang === 'ru') tag = 'Кураторский';

    if (cats.includes(Category.HISTORY)) {
      tag = isSr ? 'Autentično' : isZh ? '地道体验' : isEs ? 'Auténtico' : isDe ? 'Authentisch' : isRu ? 'Аутентичный' : 'Authentic';
    } else if (cats.includes(Category.WELLBEING)) {
      tag = isSr ? 'Obnavljajuće' : isZh ? '正念康养' : isEs ? 'Restaurativo' : isDe ? 'Regenerativ' : isRu ? 'Оздоровительный' : 'Restorative';
    } else if (cats.includes(Category.NATURE)) {
      tag = isSr ? 'Slikovito' : isZh ? '自然风光' : isEs ? 'Escénico' : isDe ? 'Malerisch' : isRu ? 'Живописный' : 'Scenic';
    } else if (cats.includes(Category.GASTRONOMY)) {
      tag = isSr ? 'Kulinarsko' : isZh ? '美食品鉴' : isEs ? 'Gastronómico' : isDe ? 'Kulinarisch' : isRu ? 'Кулинарный' : 'Gastronomic';
    } else if (cats.includes(Category.CLUBBING)) {
      tag = isSr ? 'Dinamično' : isZh ? '活力派对' : isEs ? 'Vibrante' : isDe ? 'Vibrant' : isRu ? 'Динамичный' : 'Vibrant';
    }
    return tag;
  };

  const getBudgetTag = (lang: string, val: number) => {
    if (val >= 400) {
      return isSr ? 'Luks' : isZh ? '奢华尊享' : isEs ? 'Lujo' : isDe ? 'Luxus' : isRu ? 'Люкс' : 'Luxe';
    } else if (val >= 200) {
      return isSr ? 'Premium' : isZh ? '高端定制' : isEs ? 'Premium' : isDe ? 'Premium' : isRu ? 'Премиум' : 'Premium';
    } else {
      return isSr ? 'Povoljno' : isZh ? '经济适用' : isEs ? 'Económico' : isDe ? 'Preiswert' : isRu ? 'Доступно' : 'Affordable';
    }
  };

  const getTimeTag = (lang: string, val: number) => {
    if (val <= 4) {
      return isSr ? '2–4 sata' : isZh ? '2–4 小时' : isEs ? '2–4 horas' : isDe ? '2–4 Std.' : isRu ? '2–4 ч.' : '2–4 hours';
    } else {
      return isSr ? `${val} sati` : isZh ? `${val} 小时` : isEs ? `${val} horas` : isDe ? `${val} Std.` : isRu ? `${val} ч.` : `${val} hours`;
    }
  };

  const getTempoTag = (lang: string, activeVSrelaxed: number, y?: number) => {
    if (y !== undefined) {
      if (y <= 0.35) {
        return isSr ? 'Aktivno' : isZh ? '活力' : isEs ? 'Activo' : isDe ? 'Aktiv' : isRu ? 'Активный' : 'Active';
      } else if (y >= 0.65) {
        return isSr ? 'Opušteno' : isZh ? '轻缓' : isEs ? 'Relajado' : isDe ? 'Entspannt' : isRu ? 'Расслабленный' : 'Relaxed';
      } else {
        return isSr ? 'Uravnoteženo' : isZh ? '平衡' : isEs ? 'Equilibrado' : isDe ? 'Ausgewogen' : isRu ? 'Сбалансированный' : 'Balanced';
      }
    }

    if (activeVSrelaxed >= 4) {
      return isSr ? 'Opušteno' : isZh ? '轻缓' : isEs ? 'Relajado' : isDe ? 'Entspannt' : isRu ? 'Расслабленный' : 'Relaxed';
    } else if (activeVSrelaxed <= 2) {
      return isSr ? 'Aktivno' : isZh ? '活力' : isEs ? 'Activo' : isDe ? 'Aktiv' : isRu ? 'Активный' : 'Active';
    } else {
      return isSr ? 'Uravnoteženo' : isZh ? '平衡' : isEs ? 'Equilibrado' : isDe ? 'Ausgewogen' : isRu ? 'Сбалансированный' : 'Balanced';
    }
  };

  const handleCopyLink = () => {
    const params = new URLSearchParams();
    params.set('budget', budget.toString());
    params.set('time', time.toString());
    params.set('days', days);
    params.set('timeOfDay', timeOfDay);
    if (selectedCats && selectedCats.length > 0) {
      params.set('cats', selectedCats.join(','));
    }
    params.set('lang', language);

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const shareData = {
      title: isSr ? 'IDEMO Putna Propusnica' : isZh ? '专属旅游通票' : 'IDEMO Travel Pass',
      text: isSr ? 'Moje sačuvane rute i preferencije za Beograd:' : isZh ? '您在贝尔格莱德的专属旅行通票：' : 'My curated travel preferences and saved routes for Belgrade:',
      url: shareUrl
    };

    if (navigator.share) {
      navigator.share(shareData).then(() => {
        playHaptic(30);
      }).catch(err => {
        console.log('Pass share dismissed/failed', err);
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setLinkCopied(true);
        playHaptic(10);
        setTimeout(() => setLinkCopied(false), 2000);
      }).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      });
    }
  };

  // Dynamically derive closest archetype
  const currentArchetype = useMemo(() => {
    let closestArch = ARCHETYPES[0];
    let minDivergence = Infinity;

    for (const arch of ARCHETYPES) {
      const budgetDiff = Math.abs(budget - arch.targetBudget) / 400;
      const timeDiff = Math.abs(time - arch.targetTime) / 48;
      const maxCats = arch.categories.length;
      let catMatchedCount = 0;
      for (const c of arch.categories) {
        if (selectedCats.includes(c)) catMatchedCount++;
      }
      const catDivergence = 1 - (catMatchedCount / Math.max(1, maxCats));
      const totalDivergence = (catDivergence * 0.5) + (budgetDiff * 0.25) + (timeDiff * 0.25);

      if (totalDivergence < minDivergence) {
        minDivergence = totalDivergence;
        closestArch = arch;
      }
    }
    return closestArch;
  }, [budget, time, selectedCats]);

  const isCultural = useMemo(() => {
    const activeArchId = currentArchetype?.id || '';
    const vibe = getVibeTag(language, selectedCats, orbitX, orbitY);
    return activeArchId === 'cultural_strategist' || vibe.toLowerCase().includes('cultural') || vibe.toLowerCase().includes('kulturn');
  }, [currentArchetype, language, selectedCats, orbitX, orbitY]);

  const explanationData = useMemo(() => {
    if (!activeExplanation) return null;

    const data: Record<string, {
      title: string;
      value: string;
      meaning: string;
      why: string;
      how: string;
      actionLabel: string;
      action: () => void;
    }> = {
      persona: {
        title: isSr ? 'VAŠA PREOVLAĐUJUĆA PERSONA' : isZh ? '您的核心旅行人格' : 'YOUR PREVAILING PERSONA',
        value: currentArchetype.name[language] || currentArchetype.name.en,
        meaning: isSr 
          ? 'Vaš osnovni arhetip definiše Vaš preovlađujući putnički karakter i današnje preferencije.' 
          : isZh 
          ? '您的核心探索角色定义了您今天的整体旅行风格与偏好调性。' 
          : 'Your core archetype defines your overarching travel character and preferences today.',
        why: isSr 
          ? 'Izvedeno dinamički iz kombinacije Vašeg dnevnog budžeta, raspoloživog vremena i odabranih interesovanja.' 
          : isZh 
          ? '基于您当前设置的每日预算、单日可用时长以及所选的兴趣领域组合，通过本地算法匹配得出。' 
          : 'Derived dynamically from the combination of your active daily budget, available time, and chosen category interests.',
        how: isSr 
          ? 'Postavlja kvalitativni prag i kustoski stil preporuka—prioritizujući skrivene dragulje, istorijske tačke ili društvene rute.' 
          : isZh 
          ? '设定推荐内容的整体广度与质感基调——优先筛选小众秘境、人文遗迹或市井风物，确保内容贴合您的人格画像。' 
          : 'Sets the qualitative threshold and curatorial style of recommendations—prioritizing hidden gems, historic spots, or social venues to match your travel character.',
        actionLabel: isSr ? 'Pregledaj moj profil' : isZh ? '回顾我的画像' : 'Review My Profile',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
        }
      },
      vibe: {
        title: isSr ? 'PREOVLAĐUJUĆI VAJB' : isZh ? '核心氛围' : 'ATMOSPHERE / VIBE',
        value: getVibeTag(language, selectedCats, orbitX, orbitY),
        meaning: isSr 
          ? 'Estetska atmosfera i okruženje koje podsvesno tražite u ovom trenutku.' 
          : isZh 
          ? '您当前潜意识里所向往的视觉美学、空间氛围与环境特征。' 
          : 'The aesthetic atmosphere and surroundings you sub-consciously seek right now.',
        why: isSr 
          ? 'Izračunato na osnovu Vaših izabranih interesovanja i preciznih koordinata Vaše Mood Orbite.' 
          : isZh 
          ? '基于您勾选的兴趣分类以及情绪星轨仪当前的二维空间坐标综合计算得出。' 
          : 'Calculated based on your selected interests and the exact coordinates of your live Mood Orb.',
        how: isSr 
          ? 'Direktno vrednuje i reorganizuje listu preporuka, gurajući mesta koja se savršeno slažu sa Vašim raspoloženjem na sam vrh beogradske mape.' 
          : isZh 
          ? '作为排序引擎的关键权重，对贝尔格莱德的地标点位进行精细化重排，将最契合您当下心境的探索地送达首屏。' 
          : 'Directly weights and reorganizes the recommendation list, pushing spots that perfectly match your current mood straight to the top of your Belgrade map.',
        actionLabel: isSr ? 'Prilagodi Mood Orbitu' : isZh ? '调整情绪星轨' : 'Adjust Mood Orb',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
          document.getElementById('mood-orbit-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      tempo: {
        title: isSr ? 'ŽELJENI TEMPO' : isZh ? '偏好节奏' : 'PREFERRED TEMPO',
        value: getTempoTag(language, currentArchetype.targetVibe.activeVSrelaxed, orbitY),
        meaning: isSr 
          ? 'Vaš željeni tempo kretanja i nivo energije za današnji plan puta.' 
          : isZh 
          ? '您今天期望的行旅节奏、探索频次以及体力/精力分配模式。' 
          : "Your preferred pace of movement and energy level for today's itinerary.",
        why: isSr 
          ? 'Određeno vertikalnim položajem Vaše Mood Orbite, odražavajući Vaš trenutni nivo energije.' 
          : isZh 
          ? '由情绪星轨仪的纵轴位置（能量维度）直接决定，映射您当前的精力状态。' 
          : 'Determined by the vertical position of your Mood Orb, reflecting your current energy levels.',
        how: isSr 
          ? 'Utiče na dnevni tempo i gustinu rute—preporučujući opuštena, spora svetilišta nasuprot aktivnim, brzim ekskurzijama.' 
          : isZh 
          ? '直接影响每日行程的饱满度与节奏密度——在悠闲慵懒的静修所与充满活力的动感路线之间做出精确筛选。' 
          : 'Influences daily pacing and density—recommending relaxed, slow-paced sanctuaries versus active, fast-paced excursions.',
        actionLabel: isSr ? 'Promeni tempo putovanja' : isZh ? '调节旅行节奏' : 'Update Travel Pace',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
          document.getElementById('mood-orbit-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      budget: {
        title: isSr ? 'TIPIČAN BUDŽET' : isZh ? '典型预算' : 'TYPICAL BUDGET',
        value: `${getBudgetTag(language, budget)} (€${budget}${budget >= 500 ? '+' : ''})`,
        meaning: isSr 
          ? 'Vaša definisana granica potrošnje po danu, čuvajući preporuke u okviru komfornih finansijskih mogućnosti.' 
          : isZh 
          ? '您设定的每日消费预算上限，用于将推荐条目限制在您舒适的经济区间内。' 
          : 'Your designated spend cap per day, keeping recommendations within comfortable financial reach.',
        why: isSr 
          ? 'Podešeno direktno od Vaše strane kroz kontrolu dnevnog limita budžeta.' 
          : isZh 
          ? '由您在个人中心或星轨仪下方的预算控制器中直接设定。' 
          : 'Configured directly by you using the daily budget cap controls.',
        how: isSr 
          ? 'Filtrira opcije koje premašuju Vaš limit i usklađuje cene ulaznica, restorana i aktivnosti sa Vašom zonom komfora.' 
          : isZh 
          ? '自动过滤超出上限的奢华项目，并对景点门票、餐饮及娱乐费用进行筛选，确保行程不会带来财务负担。' 
          : 'Filters out options exceeding your cap and weights entry fees, dining, and activity costs to fit your financial comfort zone.',
        actionLabel: isSr ? 'Promeni budžet' : isZh ? '修改预算上限' : 'Change Budget',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
          setRefineOpen(true);
          setTimeout(() => {
            document.getElementById('budget-slider-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      },
      time: {
        title: isSr ? 'RASPOLOŽIVO VREME' : isZh ? '可用时长' : 'AVAILABLE TIME',
        value: getTimeTag(language, time),
        meaning: isSr 
          ? 'Apsolutni broj sati koje ste izdvojili za Vaše današnje izlete.' 
          : isZh 
          ? '您今天计划用于出门在外、探索城市的累计时间预算。' 
          : 'The absolute hours you have allocated for your excursions today.',
        why: isSr 
          ? 'Definisano preko Vašeg aktivnog klizača za jednodnevni vremenski budžet.' 
          : isZh 
          ? '由您在时间预算调节器中所设定的出行小时数决定。' 
          : 'Set by your active single-day time budget slider.',
        how: isSr 
          ? 'Odbacuje lokacije čije bi uobičajeno vreme posete ili vreme putovanja premašilo Vaš raspored, osiguravajući opušten tok.' 
          : isZh 
          ? '智能剔除耗时过长或交通拉锯点位，保证推荐的总时长和游览节奏在指定时间内绰绰有余。' 
          : 'Prunes locations whose typical visiting duration or transit overhead would exceed your schedule, ensuring a stress-free flow.',
        actionLabel: isSr ? 'Promeni raspoloživo vreme' : isZh ? '调整可用时间' : 'Change Available Time',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
          setRefineOpen(true);
          setTimeout(() => {
            document.getElementById('time-slider-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      },
      interests: {
        title: isSr ? 'GLAVNA INTERESOVANJA' : isZh ? '重点关注领域' : 'PRIMARY INTERESTS',
        value: selectedCats.map((cat: string) => t[cat.toLowerCase()] || cat).join(', '),
        meaning: isSr 
          ? 'Glavne kategorije iskustava na koje ste trenutno fokusirani.' 
          : isZh 
          ? '您当前最感兴趣、最希望在这趟行程中重点探索的体验品类。' 
          : 'The core categories of experiences you are focusing on right now.',
        why: isSr 
          ? 'Vaša aktivno označena interesovanja sa ekrana za istraživanje.' 
          : isZh 
          ? '您在探索首页上主动勾选并启用的兴趣分类过滤器。' 
          : 'Your actively checked filter interests from the exploration interface.',
        how: isSr 
          ? 'Određuje primarni tematski fond iz kojeg se prikupljaju preporuke, gradeći fokusiranu strukturu rute.' 
          : isZh 
          ? '决定推荐引擎检索的主题池，以此构建重点突出的个性化路线结构。' 
          : 'Determines the primary thematic pool from which recommendations are gathered, building a focused itinerary structure.',
        actionLabel: isSr ? 'Ažuriraj interesovanja' : isZh ? '修改兴趣偏好' : 'Update Interests',
        action: () => {
          setActiveExplanation(null);
          playHaptic(10);
          if (onNavigate) {
            onNavigate('explore');
          }
        }
      }
    };

    return data[activeExplanation] || null;
  }, [activeExplanation, language, budget, time, selectedCats, currentArchetype, orbitX, orbitY, onNavigate, t]);

  // Interpolation and scoring logic
  useEffect(() => {
    const weights = ARCHETYPES.map(arch => {
      const budgetDiff = Math.abs(budget - arch.targetBudget) / 200;
      const timeDiff = Math.abs(time - arch.targetTime) / 48;
      const maxCats = arch.categories.length;
      let catMatchedCount = 0;
      for (const c of arch.categories) {
        if (selectedCats.includes(c)) catMatchedCount++;
      }
      const catDivergence = 1 - (catMatchedCount / Math.max(1, maxCats));
      const totalDivergence = (catDivergence * 0.5) + (budgetDiff * 0.25) + (timeDiff * 0.25);
      const weight = Math.exp(-totalDivergence * 8);
      return { arch, weight };
    });

    let totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight === 0) totalWeight = 1;

    const interpolatedVibes: VibeSettings = { ...DEFAULT_VIBE_SETTINGS };
    const keys = ['heritageVSmodern', 'gourmetVSmuseum', 'natureVSnightlife', 'classicsVSsecrets', 'activeVSrelaxed'];
    for (const key of keys) {
      let sum = 0;
      for (const w of weights) {
        const val = w.arch.targetVibe[key] !== undefined ? w.arch.targetVibe[key] : DEFAULT_VIBE_SETTINGS[key as keyof VibeSettings];
        sum += val * (w.weight / totalWeight);
      }
      interpolatedVibes[key as keyof VibeSettings] = sum;
    }

    const scored = recommendations.map((rec: any) => {
      const vibePercent = calculateVibeMatch(rec, interpolatedVibes, ratings);
      let categoryBonus = 0;
      let budgetScore = 0;
      
      for (const w of weights) {
        const arch = w.arch;
        const normalizedW = w.weight / totalWeight;
        const recCats = typeof rec.category === 'string'
          ? rec.category.split(',').map((s: string) => s.trim())
          : [rec.category];
        const categoryOverlap = recCats.some((c: any) => arch.categories.includes(c));
        if (categoryOverlap) {
          categoryBonus += 20 * normalizedW;
        }

        const costMatch = rec.estimatedCost.match(/\d+/);
        if (costMatch) {
          const minCost = parseInt(costMatch[0]);
          if (minCost <= arch.targetBudget) {
            budgetScore += 15 * normalizedW;
          }
        }
      }

      return {
        rec,
        totalScore: vibePercent + categoryBonus + budgetScore,
        vibePercent
      };
    });

    const interests = ARCHETYPE_INTERESTS_MAP[currentArchetype.id];
    const pickedIds = new Set<string>();
    const finalTop3: any[] = [];

    if (interests && interests.length === 3) {
      for (let i = 0; i < 3; i++) {
        const interest = interests[i];
        const scoredForInterest = scored
          .filter((item: any) => {
            const feedback = ratings && ratings[item.rec.id];
            return (!feedback || feedback.vibe !== 'dislike') && !pickedIds.has(item.rec.id);
          })
          .map((item: any) => {
            const textToSearch = `${item.rec.title} ${item.rec.shortDescription} ${item.rec.longDescription} ${item.rec.location} ${item.rec.category}`.toLowerCase();
            let kwBonus = 0;
            for (const kw of interest.keywords) {
              if (textToSearch.includes(kw.toLowerCase())) {
                kwBonus += 15;
              }
            }
            return {
              ...item,
              interestScore: item.totalScore + kwBonus
            };
          })
          .sort((a: any, b: any) => {
            const getBadgeWeight = (rec: any): number => {
              const bType = (rec.badge || '').toLowerCase();
              if (bType === 'platinum') return 3;
              if (bType === 'gold') return 2;
              if (bType === 'silver') return 1;
              return 0;
            };
            const weightA = getBadgeWeight(a.rec);
            const weightB = getBadgeWeight(b.rec);
            if (weightA !== weightB) {
              return weightB - weightA;
            }
            return b.interestScore - a.interestScore;
          });

        if (scoredForInterest.length > 0) {
          const bestMatch = scoredForInterest[0];
          pickedIds.add(bestMatch.rec.id);
          finalTop3.push({
            ...bestMatch.rec,
            archetypeMatchPercent: Math.round(bestMatch.vibePercent),
            interestSubtitle: interest.label[language] || interest.label.en
          });
        }
      }
    }

    if (finalTop3.length < 3) {
      const remainingScored = scored
        .filter((item: any) => {
          const feedback = ratings && ratings[item.rec.id];
          return (!feedback || feedback.vibe !== 'dislike') && !pickedIds.has(item.rec.id);
        })
        .sort((a: any, b: any) => {
          const getBadgeWeight = (rec: any): number => {
            const bType = (rec.badge || '').toLowerCase();
            if (bType === 'platinum') return 3;
            if (bType === 'gold') return 2;
            if (bType === 'silver') return 1;
            return 0;
          };
          const weightA = getBadgeWeight(a.rec);
          const weightB = getBadgeWeight(b.rec);
          if (weightA !== weightB) {
            return weightB - weightA;
          }
          return b.totalScore - a.totalScore;
        });
      
      while (finalTop3.length < 3 && remainingScored.length > 0) {
        const nextItem = remainingScored.shift();
        if (nextItem) {
          pickedIds.add(nextItem.rec.id);
          finalTop3.push({
            ...nextItem.rec,
            archetypeMatchPercent: Math.round(nextItem.vibePercent),
            interestSubtitle: t.recommended_match
          });
        }
      }
    }

    setPersonalizedRecs(finalTop3.slice(0, 3));
  }, [currentArchetype, recommendations, ratings, language, budget, time, selectedCats, t]);

  // Journey Contextual Editorial Observations
  const accuracyCandidates = [
    {
      id: '29',
      title: isSr ? 'Kalemegdanska tvrđava' : isZh ? '卡莱梅格丹城堡' : 'Kalemegdan Fortress',
      location: isSr ? 'Kalemegdan, Beograd' : isZh ? '贝城卡莱梅格丹' : 'Kalemegdan, Belgrade',
      visited: isSr ? 'Posećeno juče' : isZh ? '昨日已游览' : 'Visited yesterday',
    },
    {
      id: '33',
      title: isSr ? 'Skadarlija' : isZh ? '斯卡达里亚' : 'Skadarlija',
      location: isSr ? 'Skadarlija, Beograd' : isZh ? '贝城斯卡达里亚' : 'Skadarlija, Belgrade',
      visited: isSr ? 'Posećeno pre 2 dana' : isZh ? '两日前已游览' : 'Visited 2 days ago',
    }
  ];

  const pendingCandidates = accuracyCandidates.filter(exp => !confirmedAccuracyRecs[exp.id]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden" id="profile-screen-wrapper">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 p-6 pt-10 space-y-6 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar text-brand-charcoal"
        id="profile-view-root"
      >
      {/* 1. Header with logo and secret Admin long-press trigger */}
      <div className="flex flex-col mb-4">
        <div 
          onMouseDown={handleLogoPressStart}
          onMouseUp={handleLogoPressEnd}
          onMouseLeave={handleLogoPressEnd}
          onTouchStart={handleLogoPressStart}
          onTouchEnd={handleLogoPressEnd}
          onClick={handleLogoTap}
          className="cursor-default select-none pb-2.5 flex items-center border-b border-[#2D3025]/5 mb-2.5 active:opacity-90 transition-opacity"
          id="admin-logo-trigger"
        >
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.45em] text-brand-charcoal">
            {isSr ? 'IDEMO PROFIL' : isZh ? 'IDEMO 个人主页' : 'IDEMO PROFILE'}
          </span>
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-teal/60"></span>
        </div>
        <p className="text-[11px] leading-relaxed text-[#2D3025]/60 font-medium">
          {isSr 
            ? 'Upravljajte Vašim lokalnim putnim profilom, rekalibrišite raspoloženje i pregledajte sačuvana mesta u Beogradu.' 
            : isZh 
            ? '管理您的本地旅行画像，校准星轨仪并查看您在贝尔格莱德收藏的特色地点。' 
            : 'Manage your sovereign local travel profile, recalibrate your mood, and inspect saved locations in Belgrade.'}
        </p>
      </div>

      {/* QUESTION 1: How do I feel today? -> Mood Orbit (Hero) */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="mood-orbit-section">
        <div className="flex items-center gap-2">
          <Sparkles className="text-accent-teal w-4 h-4" />
          <h2 className="text-xs uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'KAKO SE DANAS OSEĆATE?' : isZh ? '您今天感觉如何？' : 'HOW DO I FEEL TODAY?'}
          </h2>
        </div>
        
        <div className="rounded-2xl overflow-hidden bg-white/40 p-2 border border-[#2D3025]/5 shadow-inner">
          <MoodOrbit 
            language={language}
            x={stagedX ?? orbitX}
            y={stagedY ?? orbitY}
            budget={stagedBudget ?? budget}
            time={stagedTime ?? time}
            onChange={(newX: number, newY: number, newBudget: number, newTime: number) => {
              setStagedX(newX);
              setStagedY(newY);
              setStagedBudget(newBudget);
              setStagedTime(newTime);
            }}
            onSelectConcierge={() => {
              setShowCorrelationModal(true);
              playHaptic(6);
            }}
            onOpenFineTuning={() => {
              setRefineOpen(true);
              setTimeout(() => {
                document.getElementById('fine-tuning-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 120);
            }}
          />
        </div>

        {/* EXPLICIT MOOD ORBIT COMMIT CONTROL */}
        <div className="pt-1 flex flex-col items-center gap-2">
          <button
            id="apply-mood-orbit-btn"
            onClick={() => {
              const finalX = stagedX ?? orbitX;
              const finalY = stagedY ?? orbitY;
              const finalB = stagedBudget ?? budget;
              const finalT = stagedTime ?? time;

              setBudget(finalB);
              setTime(finalT);

              if (onOrbitChange) {
                onOrbitChange(finalX, finalY, finalB, finalT);
              }

              setAppliedToast(true);
              playHaptic(10);
              setTimeout(() => setAppliedToast(false), 2500);
            }}
            className={`w-full py-3.5 px-4 rounded-xl font-mono text-xs uppercase tracking-[0.2em] font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] ${
              appliedToast
                ? 'bg-emerald-600 text-white border border-emerald-500 shadow-emerald-600/30'
                : 'bg-brand-charcoal text-white hover:bg-black border border-white/10 shadow-brand-charcoal/20'
            }`}
          >
            {appliedToast ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>{isSr ? 'MOOD ORBITA PRIMENJENA ✓' : isZh ? 'MOOD ORBIT 已应用 ✓' : 'MOOD ORBIT APPLIED ✓'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-accent-teal" />
                <span>{isSr ? 'PRIMENI MOOD ORBITU' : isZh ? '应用 MOOD ORBIT' : 'APPLY MOOD ORBIT'}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* QUESTION 2: What kind of traveler am I today? -> Your Travel Profile (Simplified) */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="travel-profile-section">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-teal" />
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-brand-charcoal">
              {isSr ? 'MOJ PUTNI PROFIL' : isZh ? '我的旅行画像' : 'WHAT KIND OF TRAVELER AM I TODAY?'}
            </h2>
          </div>
          <span 
            onClick={() => {
              setActiveExplanation('persona');
              playHaptic(6);
            }}
            className="text-[9px] font-mono uppercase bg-accent-teal/10 text-accent-teal px-2 py-0.5 rounded-full font-bold cursor-pointer hover:bg-accent-teal/20 active:scale-[0.97] transition-all select-none focus:outline-none focus:ring-2 focus:ring-accent-teal/50"
            role="button"
            tabIndex={0}
            aria-label={`${isSr ? 'Vaša preovlađujuća persona' : isZh ? '您的核心旅行人格' : 'Your prevailing persona'}: ${currentArchetype.name[language] || currentArchetype.name.en}. Tap to view details.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveExplanation('persona');
                playHaptic(6);
              }
            }}
          >
            {currentArchetype.name[language] || currentArchetype.name.en}
          </span>
        </div>

        {/* Travel Persona Card */}
        <div 
          onClick={() => {
            setActiveExplanation('persona');
            playHaptic(6);
          }}
          role="button"
          tabIndex={0}
          aria-label={`${isSr ? 'Vaša preovlađujuća persona' : isZh ? '您的核心旅行人格' : 'Your prevailing persona'}: ${currentArchetype.name[language] || currentArchetype.name.en}. ${isSr ? 'Saznajte više detalja.' : isZh ? '轻触查看详情。' : 'Tap to view details.'}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveExplanation('persona');
              playHaptic(6);
            }
          }}
          className="bg-white/70 rounded-2xl border border-[#2D3025]/5 p-4 space-y-2 cursor-pointer hover:border-[#2D3025]/20 hover:bg-white/85 active:scale-[0.99] transition-all group relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-accent-teal/50"
        >
          <div className="flex justify-between items-start">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#2D3025]/40 leading-none">
              {isSr ? 'VAŠA PREOVLAĐUJUĆA PERSONA' : isZh ? '您的核心旅行人格' : 'YOUR PREVAILING PERSONA'}
            </p>
            <span className="text-[9px] font-sans font-bold text-accent-teal uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
              {isSr ? 'Saznaj više' : isZh ? '了解更多' : 'Learn more'} →
            </span>
          </div>
          <div className="text-base font-black text-brand-charcoal tracking-tight leading-none">
            {currentArchetype.name[language] || currentArchetype.name.en}
          </div>
          <p className="text-[8px] uppercase tracking-widest font-black text-accent-teal/85 leading-tight">
            {currentArchetype.tagline[language] || currentArchetype.tagline.en}
          </p>
          <p className="text-[11px] leading-relaxed text-[#2D3025]/70 font-medium">
            {currentArchetype.desc[language] || currentArchetype.desc.en}
          </p>
        </div>

        {/* Dynamic Parameter Grid (No Spectra, Vectors, or raw coordinates) */}
        <div className="grid grid-cols-2 gap-3" id="traveler-parameter-grid">
          <ProfileDetailTile 
            label={isSr ? 'Preovlađujući Vajb' : isZh ? '核心氛围' : 'Atmosphere / Vibe'}
            value={getVibeTag(language, selectedCats, orbitX, orbitY)}
            onClick={() => {
              setActiveExplanation('vibe');
              playHaptic(6);
            }}
          />
          <ProfileDetailTile 
            label={isSr ? 'Željeni Tempo' : isZh ? '偏好节奏' : 'Preferred Tempo'}
            value={getTempoTag(language, currentArchetype.targetVibe.activeVSrelaxed, orbitY)}
            onClick={() => {
              setActiveExplanation('tempo');
              playHaptic(6);
            }}
          />
          <ProfileDetailTile 
            label={isSr ? 'Tipičan Budžet' : isZh ? '典型预算' : 'Typical Budget'}
            value={`${getBudgetTag(language, budget)} (€${budget}${budget >= 500 ? '+' : ''})`}
            onClick={() => {
              setActiveExplanation('budget');
              playHaptic(6);
            }}
          />
          <ProfileDetailTile 
            label={isSr ? 'Raspoloživo Vreme' : isZh ? '可用时长' : 'Available Time'}
            value={getTimeTag(language, time)}
            onClick={() => {
              setActiveExplanation('time');
              playHaptic(6);
            }}
          />
          <div className="col-span-2">
            <ProfileDetailTile 
              label={isSr ? 'Glavna Interesovanja' : isZh ? '重点关注领域' : 'Primary Interests'}
              value={selectedCats.map((cat: string) => t[cat.toLowerCase()] || cat).join(', ')}
              onClick={() => {
                setActiveExplanation('interests');
                playHaptic(6);
              }}
            />
          </div>
        </div>

        {/* 2A. Collapsible Refine Preferences (Fine-Tuning sliders inside or below profile) */}
        <div className="border-t border-[#2D3025]/5 pt-4" id="fine-tuning-section">
          <button
            onClick={() => {
              setRefineOpen(!refineOpen);
              playHaptic(6);
            }}
            className={`w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest uppercase text-[10px] transition-all border shadow-sm cursor-pointer ${
              refineOpen
                ? 'bg-[#FAF9F5] border-[#2D3025]/20 text-brand-charcoal hover:bg-[#F5F4EE]'
                : 'bg-accent-teal text-white border-accent-teal hover:bg-accent-teal/95 active:scale-95'
            }`}
          >
            <Sliders size={14} />
            <span>
              {refineOpen 
                ? (isSr ? 'ZATVORI PODEŠAVANJA' : isZh ? '收起微调选项' : 'CLOSE TUNING PANEL')
                : (isSr ? 'FINO PODEŠAVANJE PROFILA' : isZh ? '微调旅行偏好设置' : 'FINE-TUNE TRAVEL PROFILE')
              }
            </span>
          </button>

          <AnimatePresence>
            {refineOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-5">
                  
                  {/* Travel Mode Toggle (Low Signal) */}
                  <div className="bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black block leading-none">
                          {isSr ? 'PUTNI REŽIM RADNJE' : isZh ? '旅行连线模式' : 'TRAVEL CONNECTIVITY'}
                        </span>
                        <span className="text-[11px] font-extrabold text-brand-charcoal">
                          {lowSignalMode 
                            ? (isSr ? 'Ušteda signala (Offline-first)' : isZh ? '离线优先节能模式' : 'Low Signal Mode')
                            : (isSr ? 'Standardni režim (Full Online)' : isZh ? '标准在线渲染模式' : 'Standard Online Mode')
                          }
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onToggleLowSignal();
                          playHaptic(15);
                        }}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                          lowSignalMode ? 'bg-[#2D3025]' : 'bg-[#2D3025]/10'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-brand-pearl shadow-sm transition-transform duration-200 transform ${
                          lowSignalMode ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                    <p className="text-[10px] text-[#2D3025]/55 leading-relaxed font-medium">
                      {isSr 
                        ? 'Smanjuje mrežni saobraćaj, oslanja se serveski isključivo na lokalne baze podataka i čuva bateriju u toku kretanja kroz beogradska predgrađa.' 
                        : isZh 
                        ? '降低网络流量开销，绝大部分计算都将由本地数据库和缓存支撑，极为适合偏远地区或国际漫游。' 
                        : 'Reduces network payloads, relies strictly on internal static databases, and cuts battery drainage in low-reception zones.'}
                    </p>
                  </div>

                  {/* Primary Interests Multi-select */}
                  <div className="space-y-3 bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4" id="interests-container">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black">
                        {isSr ? 'GLAVNA INTERESOVANJA' : isZh ? '重点关注领域' : 'PRIMARY INTERESTS'}
                      </span>
                      <span className="text-[9px] font-mono text-[#2D3025]/40 uppercase font-bold">
                        {isSr ? 'VIŠESTRUKI IZBOR' : isZh ? '多选' : 'MULTI-SELECT'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { id: Category.WELLBEING, labelSr: 'Velnes', labelZh: '健康理疗', labelEn: 'Wellbeing' },
                        { id: Category.MEDICAL, labelSr: 'Medicina', labelZh: '医疗健康', labelEn: 'Medical' },
                        { id: Category.NATURE, labelSr: 'Priroda', labelZh: '自然探索', labelEn: 'Nature' },
                        { id: Category.HISTORY, labelSr: 'Istorija', labelZh: '历史文化', labelEn: 'History' },
                        { id: Category.GASTRONOMY, labelSr: 'Gastronomija', labelZh: '美食品鉴', labelEn: 'Gastronomy' },
                        { id: Category.TRAVEL, labelSr: 'Putovanja', labelZh: '旅行观光', labelEn: 'Travel' },
                        { id: Category.CLUBBING, labelSr: 'Noćni život', labelZh: '俱乐部夜生活', labelEn: 'Clubbing' },
                      ].map((catObj) => {
                        const active = selectedCats.includes(catObj.id);
                        const label = isSr ? catObj.labelSr : isZh ? catObj.labelZh : catObj.labelEn;
                        return (
                          <button
                            key={catObj.id}
                            onClick={() => toggleCat(catObj.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border cursor-pointer flex items-center gap-1 ${
                              active 
                                ? 'bg-accent-teal text-white border-accent-teal shadow-xs' 
                                : 'bg-white/40 border-[#2D3025]/10 text-brand-charcoal/70 hover:bg-white/60'
                            }`}
                          >
                            <span>{label}</span>
                            {active && <span className="text-[8px]">●</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Budget Slider */}
                  <div className="space-y-2 bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4" id="budget-slider-container">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black">
                        {isSr ? 'BUDŽET ZA DANAS' : isZh ? '日均预算上限' : 'DAILY BUDGET CAP'}
                      </span>
                      <span className="text-xs font-mono font-black text-brand-charcoal">
                        €{stagedBudget ?? budget}{(stagedBudget ?? budget) >= 500 ? '+' : ''}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="500" 
                      step="25"
                      value={stagedBudget ?? budget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setBudget(val);
                        setStagedBudget(val);
                        if (val % 100 === 0) playHaptic(3);
                      }}
                      className="w-full h-1 bg-[#2D3025]/10 rounded-lg appearance-none cursor-pointer accent-[#2D3025]"
                    />
                    <div className="flex justify-between text-[9px] text-[#2D3025]/40 font-mono">
                      <span>€50</span>
                      <span>€250</span>
                      <span>€500+</span>
                    </div>
                  </div>

                  {/* Time Slider */}
                  <div className="space-y-2 bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4" id="time-slider-container">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black">
                        {isSr ? 'RASPOLOŽIVO VREME' : isZh ? '单日可用时长' : 'SINGLE-DAY TIME BUDGET'}
                      </span>
                      <span className="text-xs font-mono font-black text-brand-charcoal">
                        {getTimeTag(language, stagedTime ?? time)}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="48" 
                      step="2"
                      value={stagedTime ?? time}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setTime(val);
                        setStagedTime(val);
                        if (val % 12 === 0) playHaptic(3);
                      }}
                      className="w-full h-1 bg-[#2D3025]/10 rounded-lg appearance-none cursor-pointer accent-[#2D3025]"
                    />
                    <div className="flex justify-between text-[9px] text-[#2D3025]/40 font-mono">
                      <span>{isSr ? '2 sata' : isZh ? '2小时' : '2h'}</span>
                      <span>{isSr ? '24 sata' : isZh ? '24小时' : '24h'}</span>
                      <span>{isSr ? '48 sati' : isZh ? '48小时' : '48h'}</span>
                    </div>
                  </div>

                  {/* Days Filter */}
                  <div className="space-y-2 bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4">
                    <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black block leading-none">
                      {isSr ? 'DAN U NEDELJI' : isZh ? '出行日期筛选' : 'DAY PREFERENCE'}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {['any', 'weekday', 'weekend'].map((dayOpt) => {
                        const active = days === dayOpt;
                        let label = dayOpt;
                        if (dayOpt === 'any') label = isSr ? 'Bilo koji' : isZh ? '不限日期' : 'Any Day';
                        if (dayOpt === 'weekday') label = isSr ? 'Radni dan' : isZh ? '工作日' : 'Weekday';
                        if (dayOpt === 'weekend') label = isSr ? 'Vikend' : isZh ? '周末' : 'Weekend';
                        return (
                          <button
                            key={dayOpt}
                            onClick={() => {
                              setDays(dayOpt);
                              playHaptic(8);
                            }}
                            className={`h-9 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer ${
                              active 
                                ? 'bg-[#2D3025] text-brand-pearl border-[#2D3025] shadow-sm' 
                                : 'bg-white/40 border-[#2D3025]/10 text-brand-charcoal/60 hover:bg-white/60'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time of Day Filter */}
                  <div className="space-y-2 bg-white/60 rounded-2xl border border-[#2D3025]/5 p-4">
                    <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/45 font-black block leading-none">
                      {isSr ? 'DOBA DANA' : isZh ? '时段偏好设置' : 'TIME OF DAY'}
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['any', 'morning', 'afternoon', 'night'].map((tOpt) => {
                        const active = timeOfDay === tOpt;
                        let label = tOpt;
                        if (tOpt === 'any') label = isSr ? 'Sve' : isZh ? '不限' : 'Any';
                        if (tOpt === 'morning') label = isSr ? 'Jutro' : isZh ? '早晨' : 'AM';
                        if (tOpt === 'afternoon') label = isSr ? 'Podne' : isZh ? '下午' : 'PM';
                        if (tOpt === 'night') label = isSr ? 'Noć' : isZh ? '夜间' : 'Night';
                        return (
                          <button
                            key={tOpt}
                            onClick={() => {
                              setTimeOfDay(tOpt);
                              playHaptic(8);
                            }}
                            className={`h-9 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer ${
                              active 
                                ? 'bg-[#2D3025] text-brand-pearl border-[#2D3025] shadow-sm' 
                                : 'bg-white/40 border-[#2D3025]/10 text-brand-charcoal/60 hover:bg-white/60'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Travel Pass Integration (preference transfer utility) */}
                  <div className="bg-[#FAF9F5] rounded-2xl border border-[#2D3025]/10 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="text-accent-teal w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest text-[#2D3025]/70 font-black">
                        {isSr ? 'VAŠA PUTNA PROPUSNICA' : isZh ? '您的旅行通行证 (Travel Pass)' : 'SECURE TRAVEL PASS'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#2D3025]/60 font-medium">
                      {isSr 
                        ? 'Podelite Vaš jedinstveni, šifrovani profil sa saputnicima. Svi podešeni parametri i interesovanja prenose se bez ijednog kolačića ili eksternog upisa u bazu.' 
                        : isZh 
                        ? '通过专属数字通行证安全转移您的偏好配置。IDEMO 秉承完全不设云端服务器和多余 Cookie 的隐私至上承诺。' 
                        : 'Securely export and transfer your exact travel configurations. Zero cookies, zero servers, 100% cryptographic.'}
                    </p>
                    <button
                      onClick={handleCopyLink}
                      className={`w-full h-11 rounded-xl font-bold tracking-widest uppercase text-[10px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        linkCopied 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-[#2D3025] hover:bg-[#23251E] text-white border-[#2D3025]'
                      }`}
                    >
                      {linkCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>
                        {linkCopied 
                          ? (isSr ? 'LINK JE KOPIRAN!' : isZh ? '链接已成功复制！' : 'LINK COPIED!') 
                          : (isSr ? 'KOPIRAJ PUTNU PROPUSNICU' : isZh ? '一键生成旅行通行证' : 'COPY TRAVEL PASS LINK')
                        }
                      </span>
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* QUESTION 3: What have I explored? -> Your Journey */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="your-journey-section">
        <div className="flex items-center gap-2">
          <Heart className="text-accent-red w-4 h-4" />
          <h2 className="text-xs uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'ISTRAŽENI HORIZONTI' : isZh ? '已探索的轨迹' : 'WHAT HAVE I EXPLORED?'}
          </h2>
        </div>

        {/* Clean 3-column statistics grid (Removed pulsing NOMINAL telemetric indicator card) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase tracking-wider text-[#2D3025]/45 font-black block mb-0.5">
              {isSr ? 'SAČUVANO' : isZh ? '已收藏' : 'SAVED'}
            </span>
            <span className="text-xl font-black text-brand-charcoal leading-none">
              {likedIds ? likedIds.size : 0}
            </span>
          </div>
          
          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase tracking-wider text-[#2D3025]/45 font-black block mb-0.5">
              {isSr ? 'OCENJENO' : isZh ? '已评分' : 'RATED'}
            </span>
            <span className="text-xl font-black text-brand-charcoal leading-none">
              {Object.keys(ratings || {}).length}
            </span>
          </div>

          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[9px] uppercase tracking-wider text-[#2D3025]/45 font-black block mb-0.5">
              {isSr ? 'USKLAĐENO' : isZh ? '完美推荐' : 'ALIGNED'}
            </span>
            <span className="text-xl font-black text-brand-charcoal leading-none">
              {Object.values(ratings || {}).filter((r: any) => r.vibe === 'like').length}
            </span>
          </div>
        </div>

        {/* Dynamic Contextual Assistance: Place Accuracy Feedback from Recent Visits (Appears only when there are pending Candidates) */}
        <AnimatePresence>
          {pendingCandidates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-[#2D3025] text-brand-pearl rounded-2xl p-4 space-y-3 shadow-md"
              id="contextual-editorial-observation"
            >
              <div className="flex items-center gap-2 border-b border-brand-pearl/10 pb-2">
                <MapPin className="text-accent-teal w-4 h-4 flex-shrink-0" />
                <span className="text-[10px] uppercase tracking-widest font-black leading-none text-brand-pearl/80">
                  {isSr 
                    ? 'PROVERA TAČNOSTI PODATAKA' 
                    : isZh 
                    ? '地点信息客观校验' 
                    : isEs 
                    ? 'VERIFICACIÓN DE DATOS' 
                    : isDe 
                    ? 'DATENGENAUIGKEIT PRÜFEN' 
                    : isRu 
                    ? 'ПРОВЕРКА ТОЧНОСТИ ДАННЫХ' 
                    : 'VERIFY PLACE DETAILS'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-brand-pearl/70 font-medium">
                {isSr 
                  ? 'Bili ste nedavno u blizini ovih mesta? Pomozite kustosima i putnicima brzom potvrdom da li su podaci o lokaciji, radnom vremenu i cenama i dalje tačni.' 
                  : isZh 
                  ? '您近期曾前往以下贝尔格莱德地点？请协助编辑团队与其他旅行者，快速确认营业时间、价格及地点信息是否依然准确。' 
                  : isEs 
                  ? '¿Ha visitado estos lugares recientemente? Ayude a los editores y viajeros confirmando si los horarios, precios y ubicación siguen siendo precisos.' 
                  : isDe 
                  ? 'Waren Sie kürzlich in der Nähe dieser Orte? Helfen Sie Kuratoren und Reisenden, indem Sie bestätigen, ob Öffnungszeiten, Preise und Standort noch aktuell sind.' 
                  : isRu 
                  ? 'Недавно были рядом с этими местами? Помогите кураторам и путешественникам, подтвердив актуальность часов работы, цен и адреса.' 
                  : 'Visited near these locations recently? Help curators and fellow travelers by confirming whether hours, prices, and place details are still accurate.'}
              </p>
              
              <div className="space-y-2 pt-1">
                {pendingCandidates.map((exp) => (
                  <div key={exp.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-brand-pearl leading-snug">
                        {exp.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-brand-pearl/50 font-medium leading-none">
                        <MapPin size={10} />
                        <span>{exp.location}</span>
                        <span className="mx-0.5">•</span>
                        <span>{exp.visited}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onConfirmAccuracy(exp);
                        playHaptic([20, 10, 20]);
                      }}
                      className="bg-accent-teal text-white text-[10px] font-black uppercase px-3 h-8 rounded-lg hover:bg-accent-teal/90 transition-all cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                    >
                      {isSr 
                        ? 'POTVRDI TAČNOST' 
                        : isZh 
                        ? '校验信息' 
                        : isEs 
                        ? 'VERIFICAR' 
                        : isDe 
                        ? 'ÜBERPRÜFEN' 
                        : isRu 
                        ? 'ПРОВЕРИТЬ' 
                        : 'VERIFY DETAILS'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* EXCLUSIVE VENUE PARTNER SYSTEM (v2.0.0) */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500 w-4 h-4" />
          <h2 className="text-xs uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'EKSKLUZIVNI PARTNERI' : isZh ? '合作伙伴计划' : 'BESPOKE PARTNER PRIVILEGES'}
          </h2>
        </div>
        <p className="text-[11px] leading-relaxed text-[#2D3025]/60 font-medium">
          {isSr 
            ? 'Otključajte ekskluzivne lokalne pogodnosti, poklone i VIP usluge kod 30 kustoski selektovanih beogradskih partnera unosom unikatnog verifikacionog koda.' 
            : isZh 
            ? '输入特约商户验证码，即可在 30 家经过严格挑选的贝尔格莱德顶级场所解锁专属迎宾特权、贵宾礼遇与尊享服务。' 
            : 'Unlock premier local privileges, curated welcome gifts, and VIP services at 30 handpicked Belgrade partner venues using their bespoke access codes.'}
        </p>
        <PartnerCard language={language} />
      </section>

      {/* QUESTION 4: Why can I trust IDEMO? -> Trust & Privacy Expandable Card */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="trust-privacy-section">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent-teal w-4.5 h-4.5" />
          <h2 className="text-xs uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'POVERENJE I PRIVATNOST' : isZh ? '信任与隐私' : 'TRUST & PRIVACY'}
          </h2>
        </div>

        <p className="text-[11px] leading-relaxed text-[#2D3025]/60 font-medium">
          {isSr 
            ? 'IDEMO radi na temelju suverene arhitekture. Sva Vaša kalibrisana stanja i istorije istraživanja ostaju u potpunosti na ovom uređaju.' 
            : isZh 
            ? 'IDEMO 秉承本地主权架构。所有的探索印记、校准参数皆 100% 留存在您当前的设备中。无云端账户、无行为跟踪。' 
            : 'IDEMO operates on a zero-tracking, localized architecture. No remote databases, no profiles, no user profiling. Completely secure.'}
        </p>

        {/* Single expandable card that contains Privacy, GDPR, Legal Disclaimer, and How IDEMO Works */}
        <div className="space-y-2">
          <div className="border border-[#2D3025]/10 rounded-2xl overflow-hidden bg-white/40 shadow-sm">
            <button
              onClick={() => {
                setTrustOpen(!trustOpen);
                playHaptic(6);
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-left font-black tracking-wider uppercase text-[10px] text-brand-charcoal cursor-pointer hover:bg-white/60 transition-colors"
            >
              <span>{isSr ? 'Poverenje i privatnost' : isZh ? '信任与隐私' : 'Trust & Privacy'}</span>
              {trustOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence>
              {trustOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 pb-4 space-y-5 divide-y divide-[#2D3025]/10 border-t border-[#2D3025]/5 pt-4"
                >
                  {/* 1. How IDEMO Works */}
                  <div className="space-y-2">
                    <h3 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-charcoal">
                      {isSr ? '1. KAKO IDEMO FUNKCIONIŠE' : isZh ? '1. 运行机制' : '1. How IDEMO Works'}
                    </h3>
                    <p className="text-[10.5px] leading-relaxed text-[#2D3025]/75 font-medium">
                      {isSr 
                        ? 'Vaša Mood Orbita na privatan način kombinuje Vaše sklonosti kako bi personalizovala preporuke. Sve se obrađuje lokalno na Vašem uređaju i nikakav lični profil se ne šalje na spoljne servere.' 
                        : isZh 
                        ? '您的情绪星轨（Mood Orbit）能够私密地结合您的个性偏好，为您定制专属的旅行推荐。所有操作均在您的设备本地完成，绝不会向外部服务器发送任何个人画像或隐私数据。' 
                        : 'Your Mood Orbit privately combines your preferences to personalize recommendations. Everything is processed locally on your device, and no personal profile is sent to external servers.'}
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          onResetOnboarding();
                          playHaptic([40, 20]);
                          alert(getResetSuccessMessage());
                        }}
                        className="text-[9px] uppercase tracking-widest font-black text-accent-teal hover:underline cursor-pointer"
                      >
                        {isSr ? 'Resetuj uvodni vodič' : isZh ? '重置新手引导流程' : 'Reset Introduction Guide'}
                      </button>
                    </div>
                  </div>

                  {/* 2. Privacy Policy & GDPR */}
                  <div className="space-y-2 pt-4">
                    <h3 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-charcoal">
                      {isSr ? '2. POLITIKA PRIVATNOSTI & GDPR' : isZh ? '2. 隐私规范 & 数据安全 (GDPR)' : '2. Privacy & GDPR'}
                    </h3>
                    <p className="text-[10.5px] leading-relaxed text-[#2D3025]/75 font-medium">
                      {isSr
                        ? 'IDEMO je dizajniran po principu potpune privatnosti. Vaša aktivnost se nikada ne prenosi na servere. Svi podaci o pretragama i ocenama se skladište isključivo lokalno.'
                        : isZh
                        ? '我们坚守最高标准的隐私原则：零云端跟踪、零广告画像。您的所有足迹及偏好数据 100% 存在手机本地沙盒中。'
                        : 'IDEMO is committed to your data sovereignty. We collect zero analytics, utilize no tracking SDKs, and store all configurations completely locally in your secure sandboxed browser storage.'}
                    </p>
                    <div className="max-h-40 overflow-y-auto text-[9.5px] text-[#2D3025]/60 font-medium border border-[#2D3025]/10 p-2.5 rounded-xl bg-white/40 space-y-1.5">
                      <PrivacyPolicyContent language={language} />
                    </div>
                    
                    {/* Purge Memories block */}
                    <div className="border-t border-[#2D3025]/5 pt-3 space-y-2">
                      <span className="text-[8.5px] uppercase tracking-wider text-accent-red font-black block leading-none">
                        {isSr ? 'CRVENA ZONA: BRISANJE PODATAKA' : isZh ? '危机控制：永久抹除数据' : 'DANGER ZONE: DELETE ALL LOCAL MEMORIES'}
                      </span>
                      <p className="text-[10px] text-[#2D3025]/60 font-medium">
                        {isSr 
                          ? 'Ova akcija je nepovratna. Trajno briše sva sačuvana mesta, istoriju ocena, kalibracije raspoloženja i vraća IDEMO na fabrička podešavanja.' 
                          : isZh 
                          ? '此操作不可逆。它将立即永久粉碎您的全部收藏轨迹、评分历史以及校准设定，使应用恢复出厂状态。' 
                          : 'Irreversibly vaporizes your ratings, saved places, calibrations, and settings from this device.'}
                      </p>

                      {confirmStep === 0 ? (
                        <button
                          onClick={() => {
                            setConfirmStep(1);
                            playHaptic(50);
                          }}
                          className="h-8 px-3 rounded-lg text-[8.5px] uppercase tracking-widest font-black bg-accent-red text-white hover:bg-red-700 transition-all cursor-pointer active:scale-95"
                        >
                          {isSr ? 'Obriši sve podatke' : isZh ? '申请抹除数据' : 'Purge All Local Memories'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                          <AlertTriangle className="text-accent-red w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-accent-red">
                            {isSr ? 'Sigurni ste?' : isZh ? '确认要抹除吗？' : 'Are you 100% sure?'}
                          </span>
                          <button
                            onClick={() => {
                              onPurgeMemories();
                              setPurged(true);
                              setConfirmStep(0);
                              playHaptic([80, 80, 80]);
                              setTimeout(() => {
                                window.location.reload();
                              }, 1000);
                            }}
                            className="h-7 px-2.5 rounded bg-red-700 text-white text-[8.5px] font-black uppercase cursor-pointer"
                          >
                            {isSr ? 'DA, IZBRIŠI' : isZh ? '是的，立即粉碎' : 'YES, PURGE'}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmStep(0);
                              playHaptic(10);
                            }}
                            className="h-7 px-2.5 rounded bg-gray-200 text-[#2D3025] text-[8.5px] font-black uppercase cursor-pointer"
                          >
                            {isSr ? 'Otkaži' : isZh ? '放弃' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Legal Disclaimer */}
                  <div className="space-y-2 pt-4">
                    <h3 className="text-[9px] uppercase tracking-[0.2em] font-black text-brand-charcoal">
                      {isSr ? '3. PRAVNE INFORMACIJE I VERZIJA' : isZh ? '3. 法律声明' : '3. Legal Disclaimer'}
                    </h3>
                    <p className="text-[10.5px] leading-relaxed text-[#2D3025]/60 font-medium">
                      {isSr 
                        ? 'IDEMO je nezavisna, autentična platforma nastala u saradnji sa lokalnim turističkim kustosima i entuzijastima Beograda. Nismo zvanično povezani sa Turističkom organizacijom Beograda ili gradskim upravama.' 
                        : isZh 
                        ? 'IDEMO 是一款独立、纯粹的本地数字导游 service。我们由贝尔格莱德资深人文向导、美食品鉴师及城市漫游家联合打造，与官方旅游管理部门或任何政府机构无隶属关联。' 
                        : 'IDEMO is a sovereign, non-affiliated independent platform created in cooperation with hand-picked Belgrade curators. Not associated with the Tourist Organization of Belgrade.'}
                    </p>
                    
                    {/* Non-technical version and copyright tag */}
                    <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] uppercase tracking-widest text-[#2D3025]/45 font-black block">
                          {isSr ? 'PREDANOST KVALITETU' : isZh ? '品质及信誉承诺' : 'COMMITMENT TO EXCELLENCE'}
                        </span>
                        <span className="text-[9.5px] font-extrabold text-[#2D3025]/75 flex items-center gap-1">
                          Curated with care in Belgrade
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-black text-[#2D3025]/40 bg-[#2D3025]/5 px-2 py-0.5 rounded-md">
                        v1.2.0
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* C. Safety & Concierge SOS Accordion (kept separate as a clean progressive-disclosure card) */}
          <div className="border border-[#2D3025]/10 rounded-2xl overflow-hidden bg-white/40 shadow-sm">
            <button
              onClick={() => {
                setSupportOpen(!supportOpen);
                playHaptic(6);
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-left font-black tracking-wider uppercase text-[10px] text-brand-charcoal cursor-pointer hover:bg-white/60 transition-colors"
            >
              <span>{isSr ? 'Putna podrška i SOS' : isZh ? '旅途安全保障救援 (SOS)' : 'Travel Support & SOS'}</span>
              {supportOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <AnimatePresence>
              {supportOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="px-4 pb-4 border-t border-[#2D3025]/5 pt-4"
                >
                  <ConciergeSOSHub language={language} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Footer Tagline */}
      <footer className="pt-2 opacity-30 text-center space-y-0.5" id="profile-view-footer">
         <p className="text-[7px] uppercase tracking-[0.3em] font-black text-brand-charcoal">{t.footer_tagline}</p>
         <p className="text-[6px] uppercase tracking-[0.2em] font-bold text-brand-charcoal">v1.2.0</p>
      </footer>

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
                  playHaptic(10);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
                id="close-correlation-modal"
              >
                <X size={14} />
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
                        <strong>Want to change your Vibe?</strong> Visit the category selectors on the <strong>Explore</strong> page to adjust your active interests and fine-tune your recommendations.
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
                            Your <strong>Prevailing Persona</strong> acts as your overarching travel signature (derived from your Mood Orbit), while your <strong>Atmosphere / Vibe</strong> is a real-time reflection of your selected category interests.
                          </>
                        )}
                      </p>

                      <p className="border-t border-[#2D3025]/10 pt-3">
                        {isSr ? (
                          <>
                            <strong>Uticaj na ponudu:</strong> Persona postavlja osnovni stil kustosiranja (npr. naglašavajući skrivena mesta naspram elitnog nasleđa), dok aktivni Vajb direktno utiče na težinu i redosled preporuka u katalogu, izdvajajući na vrh beogradska mesta koja se najviše poklapaju sa Vašim trenutnim raspoloženjem.
                          </>
                        ) : isZh ? (
                          <>
                            <strong>推荐影响：</strong>核心旅行人格设定了整体推荐内容的深度与调性，而核心氛围则根据当下的兴趣标签直接对贝尔格莱德的地标点位进行排序与加权，确保展示最契合您的特色行程。
                          </>
                        ) : (
                          <>
                            <strong>Consequence on offer selection:</strong> The Persona sets the qualitative curation threshold (e.g., prioritizing hidden gems versus historic heritage), while the active Vibe directly weights and prioritizes the list of Belgrade spots—bringing locations that maximize both your active mindset and your selected interests straight to the top of your catalog.
                          </>
                        )}
                      </p>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShowCorrelationModal(false);
                    playHaptic(10);
                  }}
                  className="w-full h-10 mt-2 bg-brand-charcoal text-[#F6F5F2] rounded-xl font-serif text-xs tracking-tight hover:bg-brand-charcoal/90 transition-all flex items-center justify-center gap-2 shadow-sm border border-brand-charcoal/10 cursor-pointer"
                >
                  {isSr ? 'Razumem' : isZh ? '我知道了' : 'Understood'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeExplanation && explanationData && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" id="explanation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 flex flex-col relative text-left font-sans"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveExplanation(null);
                  playHaptic(10);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-teal/50"
                id="close-explanation-modal"
                aria-label={isSr ? 'Zatvori' : isZh ? '关闭' : 'Close'}
              >
                <X size={14} />
              </button>

              <div className="space-y-4 pt-2">
                <div>
                  <span className="text-[8px] uppercase tracking-[0.25em] text-accent-teal font-black block leading-none mb-1">
                    {explanationData.title}
                  </span>
                  <h4 className="text-[17px] font-extrabold text-brand-charcoal tracking-tight leading-snug">
                    {explanationData.value}
                  </h4>
                </div>

                <div className="space-y-3.5 text-[#2D3025] text-[11px] leading-relaxed font-medium">
                  <div>
                    <span className="text-[7.5px] uppercase tracking-wider font-black text-[#2D3025]/40 block mb-1">
                      {isSr ? 'ŠTA OVO ZNAČI' : isZh ? '概念定义' : 'WHAT IT MEANS'}
                    </span>
                    <p className="bg-[#2D3025]/5 rounded-xl p-3 border border-[#2D3025]/5 text-xs text-[#2D3025]/85">
                      {explanationData.meaning}
                    </p>
                  </div>

                  <div className="border-t border-[#2D3025]/10 pt-2.5">
                    <span className="text-[7.5px] uppercase tracking-wider font-black text-[#2D3025]/40 block mb-1">
                      {isSr ? 'ZAŠTO OVO VIDITE' : isZh ? '为何展示此项' : 'WHY YOU’RE SEEING THIS'}
                    </span>
                    <p className="text-xs text-[#2D3025]/80 pl-1">
                      {explanationData.why}
                    </p>
                  </div>

                  <div className="border-t border-[#2D3025]/10 pt-2.5">
                    <span className="text-[7.5px] uppercase tracking-wider font-black text-[#2D3025]/40 block mb-1">
                      {isSr ? 'KAKO IDEMO OVO KORISTI' : isZh ? 'IDEMO 如何运用' : 'HOW IDEMO USES IT'}
                    </span>
                    <p className="text-xs text-[#2D3025]/80 pl-1">
                      {explanationData.how}
                    </p>
                  </div>
                </div>

                <button
                  onClick={explanationData.action}
                  className="w-full h-11 mt-3 bg-brand-charcoal text-[#F6F5F2] rounded-xl font-serif text-xs tracking-tight hover:bg-brand-charcoal/90 transition-all flex items-center justify-center gap-2 shadow-sm border border-brand-charcoal/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-charcoal/50"
                >
                  {explanationData.actionLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  );
}
