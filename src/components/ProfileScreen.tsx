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
  ShieldCheck, 
  QrCode, 
  Heart, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  AlertTriangle, 
  Move, 
  Maximize2, 
  RotateCw,
  Share2,
  Send,
  Download,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import { Category, Recommendation } from '../types';
import { TRANSLATIONS } from '../constants';
import { VibeSettings, DEFAULT_VIBE_SETTINGS, calculateVibeMatch } from './VibeCalibration';
import MoodOrbit from './MoodOrbit';
import PrivacyPolicyContent from './PrivacyPolicyContent';
import { ConciergeSOSHub } from './ConciergeSOSHub';
import { safeStorage } from '../lib/safeStorage';
import { ONBOARDING_TRANSLATIONS } from './OnboardingOverlay';

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
    targetCoords: { x: 0.75, y: 0.25 },
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
    targetCoords: { x: 0.20, y: 0.75 },
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
    targetCoords: { x: 0.20, y: 0.25 },
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
    targetCoords: { x: 0.80, y: 0.80 },
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
    targetCoords: { x: 0.50, y: 0.50 },
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

export function deriveArchetype(
  x: number = 0.5,
  y: number = 0.5,
  budget: number = 100,
  time: number = 24,
  selectedCats: Category[] = []
): typeof ARCHETYPES[0] {
  let closestArch = ARCHETYPES[0];
  let minDivergence = Infinity;

  for (const arch of ARCHETYPES) {
    // 1. 2D Coordinate distance (Primary continuous spatial position in Mood Orbit [0, 1]²)
    const targetX = arch.targetCoords?.x ?? 0.5;
    const targetY = arch.targetCoords?.y ?? 0.5;
    const coordDist = Math.hypot(x - targetX, y - targetY) / Math.SQRT2; // normalized to [0, 1]

    // 2. Budget divergence (scaled to 0-1 range)
    const budgetDiff = Math.abs(budget - arch.targetBudget) / 400;

    // 3. Time available divergence (scaled to 0-1 range)
    const timeDiff = Math.abs(time - arch.targetTime) / 48;

    // 4. Category overlap score (0 is complete overlap, 1 is no overlap)
    let catDivergence = 0;
    if (selectedCats && selectedCats.length > 0) {
      const maxCats = arch.categories.length;
      let catMatchedCount = 0;
      for (const c of arch.categories) {
        if (selectedCats.includes(c)) catMatchedCount++;
      }
      catDivergence = 1 - (catMatchedCount / Math.max(1, maxCats));
    }

    // High spatial weighting (0.90) guarantees 2D coordinates strictly govern the archetype,
    // preventing selected categories or secondary attributes from overriding the position-derived type,
    // while preserving subtle contextual refinement at ambiguous quadrant boundaries.
    const totalDivergence = (coordDist * 0.90) + (budgetDiff * 0.04) + (timeDiff * 0.03) + (catDivergence * 0.03);

    if (totalDivergence < minDivergence) {
      minDivergence = totalDivergence;
      closestArch = arch;
    }
  }

  return closestArch;
}

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
  const introCard0 = (ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS.en).cards[0];

  const [purged, setPurged] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [personalizedRecs, setPersonalizedRecs] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const [appliedToast, setAppliedToast] = useState(false);

  // Check if profile has previously been committed
  const [hasApplied, setHasApplied] = useState(() => {
    try {
      const stored = safeStorage.getItem('idemo_profile_applied_v1');
      if (stored === 'true') return true;
      const custom = safeStorage.getItem('idemo_custom_orbit_v1');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed.isCustom) return true;
      }
    } catch (e) {
      // fallback
    }
    return false;
  });

  // Active mode button: 'move' | 'resize' | 'rotate'
  const [activeMode, setActiveMode] = useState<'move' | 'resize' | 'rotate'>('move');

  // Applied settings committed to preference engine & recommendations
  const [appliedSettings, setAppliedSettings] = useState({
    x: typeof orbitX === 'number' ? orbitX : 0.5,
    y: typeof orbitY === 'number' ? orbitY : 0.5,
    budget: typeof budget === 'number' ? budget : 100,
    time: typeof time === 'number' ? time : 24
  });

  // Pending edits inside the Mood Orbit card
  const [pendingOrbit, setPendingOrbit] = useState({
    x: typeof orbitX === 'number' ? orbitX : 0.5,
    y: typeof orbitY === 'number' ? orbitY : 0.5,
    budget: typeof budget === 'number' ? budget : 100,
    time: typeof time === 'number' ? time : 24
  });

  const isEditingRef = useRef(false);
  useEffect(() => {
    if (!isEditingRef.current) {
      setAppliedSettings({
        x: typeof orbitX === 'number' ? orbitX : 0.5,
        y: typeof orbitY === 'number' ? orbitY : 0.5,
        budget: typeof budget === 'number' ? budget : 100,
        time: typeof time === 'number' ? time : 24
      });
      setPendingOrbit({
        x: typeof orbitX === 'number' ? orbitX : 0.5,
        y: typeof orbitY === 'number' ? orbitY : 0.5,
        budget: typeof budget === 'number' ? budget : 100,
        time: typeof time === 'number' ? time : 24
      });
    }
  }, [orbitX, orbitY, budget, time]);

  // Dynamically derived archetype for pending selection in Current Selection Box
  const pendingArchetype = useMemo(() => {
    return deriveArchetype(
      pendingOrbit.x,
      pendingOrbit.y,
      pendingOrbit.budget,
      pendingOrbit.time,
      selectedCats
    );
  }, [pendingOrbit.x, pendingOrbit.y, pendingOrbit.budget, pendingOrbit.time, selectedCats]);

  const handleApplyMoodOrbit = () => {
    isEditingRef.current = false;
    setHasApplied(true);
    try {
      safeStorage.setItem('idemo_profile_applied_v1', 'true');
    } catch (e) {
      console.warn(e);
    }
    setAppliedSettings({ ...pendingOrbit });
    setBudget(pendingOrbit.budget);
    setTime(pendingOrbit.time);
    if (onOrbitChange) {
      onOrbitChange(pendingOrbit.x, pendingOrbit.y, pendingOrbit.budget, pendingOrbit.time);
    }
    setAppliedToast(true);
    playHaptic([20, 30]);
    setTimeout(() => setAppliedToast(false), 2200);
  };

  // Accordion states under "Trust & Privacy"
  const [trustOpen, setTrustOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedAppShare, setCopiedAppShare] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<'share' | 'pass' | null>(null);
  const [passExplainerOpen, setPassExplainerOpen] = useState(false);

  const [confirmStep, setConfirmStep] = useState(0);

  // Hidden admin gesture state variables
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Dedicated app-level share metadata and direct social channels
  const getAppSharePayload = () => {
    const appUrl = `${window.location.origin}${window.location.pathname}`;
    const shareTitle = isSr 
      ? 'IDEMO — Kurirani vodič i konsjerž za Srbiju' 
      : isZh 
      ? 'IDEMO 塞尔维亚专属尊享旅行管家' 
      : 'IDEMO — Curated Serbia Concierge & Planner';
    
    const shareText = isSr
      ? 'Istraži autentičnu Srbiju kroz IDEMO — odabrana mesta, skrivene lokacije, lokalni partneri i lični putni planer.'
      : isZh
      ? '探索塞尔维亚的隐秘瑰宝与地道风情：IDEMO 专属旅行管家与本地精选指南。'
      : 'Explore authentic Serbia with IDEMO — curated highlights, hidden gems, verified local partners, and offline-first travel pass.';

    return { appUrl, shareTitle, shareText };
  };

  const handleNativeShareApp = async () => {
    const { appUrl, shareTitle, shareText } = getAppSharePayload();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText}\n`,
          url: appUrl
        });
        playHaptic(30);
      } catch (e) {
        console.log('Share dismissed or not completed', e);
      }
    } else {
      handleCopyAppShare();
    }
  };

  const handleCopyAppShare = () => {
    const { appUrl, shareText } = getAppSharePayload();
    const fullText = `${shareText}\n${appUrl}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        setCopiedAppShare(true);
        playHaptic(15);
        setTimeout(() => setCopiedAppShare(false), 2500);
      }).catch(() => {
        fallbackCopyAppText(fullText);
      });
    } else {
      fallbackCopyAppText(fullText);
    }
  };

  const fallbackCopyAppText = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopiedAppShare(true);
    playHaptic(15);
    setTimeout(() => setCopiedAppShare(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const { appUrl, shareText } = getAppSharePayload();
    const message = encodeURIComponent(`${shareText}\n${appUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank', 'noopener,noreferrer');
    playHaptic(15);
  };

  const handleShareTelegram = () => {
    const { appUrl, shareText } = getAppSharePayload();
    const url = encodeURIComponent(appUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
    playHaptic(15);
  };

  const handleShareViber = () => {
    const { appUrl, shareText } = getAppSharePayload();
    const text = encodeURIComponent(`${shareText} ${appUrl}`);
    window.open(`viber://forward?text=${text}`, '_blank', 'noopener,noreferrer');
    playHaptic(15);
  };

  // Dynamically derive closest archetype for active applied settings
  const currentArchetype = useMemo(() => {
    return deriveArchetype(
      appliedSettings.x,
      appliedSettings.y,
      appliedSettings.budget,
      appliedSettings.time,
      selectedCats
    );
  }, [appliedSettings.x, appliedSettings.y, appliedSettings.budget, appliedSettings.time, selectedCats]);

  // Derived archetype from last APPLIED settings
  const appliedArchetype = useMemo(() => {
    return deriveArchetype(
      appliedSettings.x,
      appliedSettings.y,
      appliedSettings.budget,
      appliedSettings.time,
      selectedCats
    );
  }, [appliedSettings.x, appliedSettings.y, appliedSettings.budget, appliedSettings.time, selectedCats]);

  const appliedVibe = useMemo(() => {
    return getVibeTag(language, selectedCats, appliedSettings.x, appliedSettings.y);
  }, [language, selectedCats, appliedSettings.x, appliedSettings.y]);

  const getCategoryLabel = (cat: Category, lang: string) => {
    const isSrLang = lang === 'sr';
    const isZhLang = lang === 'zh';
    const isEsLang = lang === 'es';
    const isDeLang = lang === 'de';
    const isRuLang = lang === 'ru';
    switch (cat) {
      case Category.HISTORY:
        return isSrLang ? 'Istorija' : isZhLang ? '历史文化' : isEsLang ? 'Historia' : isDeLang ? 'Geschichte' : isRuLang ? 'История' : 'History';
      case Category.GASTRONOMY:
        return isSrLang ? 'Gastronomija' : isZhLang ? '美食品鉴' : isEsLang ? 'Gastronomía' : isDeLang ? 'Gastronomie' : isRuLang ? 'Гастрономия' : 'Gastronomy';
      case Category.NATURE:
        return isSrLang ? 'Priroda' : isZhLang ? '自然探索' : isEsLang ? 'Naturaleza' : isDeLang ? 'Natur' : isRuLang ? 'Природа' : 'Nature';
      case Category.WELLBEING:
        return isSrLang ? 'Velnes' : isZhLang ? '健康理疗' : isEsLang ? 'Bienestar' : isDeLang ? 'Wellness' : isRuLang ? 'Велнес' : 'Wellbeing';
      case Category.MEDICAL:
        return isSrLang ? 'Medicina' : isZhLang ? '医疗健康' : isEsLang ? 'Medicina' : isDeLang ? 'Medizin' : isRuLang ? 'Медицина' : 'Medical';
      case Category.TRAVEL:
        return isSrLang ? 'Putovanja' : isZhLang ? '旅行观光' : isEsLang ? 'Viajes' : isDeLang ? 'Reisen' : isRuLang ? 'Путешествия' : 'Travel';
      case Category.CLUBBING:
        return isSrLang ? 'Noćni život' : isZhLang ? '俱乐部夜生活' : isEsLang ? 'Vida Nocturna' : isDeLang ? 'Nachtleben' : isRuLang ? 'Клубы' : 'Clubbing';
      default:
        return String(cat);
    }
  };

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

  return (
    <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden" id="profile-screen-wrapper">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 px-3.5 sm:px-6 pt-6 sm:pt-10 space-y-5 overflow-y-auto overflow-x-hidden pb-32 no-scrollbar text-brand-charcoal"
        id="profile-view-root"
      >
      {/* Question 1: Matching Intro Card 1 layout */}
      <section className="bg-brand-pearl rounded-[28px] border border-[#2D3025]/10 p-3.5 sm:p-5 space-y-3.5 shadow-[0_2px_8px_rgba(35,37,30,0.02)] relative" id="mood-orbit-section">
        {/* Editorial Headline & Subtitle matching Intro Card 1 (with 7-tap admin gesture preserved) */}
        <div 
          onMouseDown={handleLogoPressStart}
          onMouseUp={handleLogoPressEnd}
          onMouseLeave={handleLogoPressEnd}
          onTouchStart={handleLogoPressStart}
          onTouchEnd={handleLogoPressEnd}
          onClick={handleLogoTap}
          className="w-full text-center space-y-1.5 px-2 pt-1 flex-shrink-0 cursor-pointer select-none"
          id="admin-logo-trigger"
        >
          <h2 className="text-[25px] xs:text-[28px] sm:text-[31px] font-serif font-normal tracking-tight text-[#1A1A18] leading-[1.15]">
            {introCard0.title}
          </h2>
          <p className="text-[15px] sm:text-[16px] font-sans text-brand-charcoal max-w-sm mx-auto leading-relaxed">
            {pendingArchetype.desc[language] || pendingArchetype.desc.en}
          </p>
        </div>

        {/* Dynamic Live Profile-Name and 3 Characteristics */}
        <div 
          id="profile-live-profile-label"
          className="w-full text-center px-4 flex flex-col items-center justify-center flex-shrink-0 space-y-1 mb-1"
        >
          <span className="font-sans text-[17px] font-bold text-[#800020] text-center leading-snug break-words">
            {pendingArchetype.name[language] || pendingArchetype.name.en}
          </span>
          <span className="font-sans text-[17px] font-normal text-brand-charcoal text-center leading-snug break-words">
            {(pendingArchetype.tagline[language] || pendingArchetype.tagline.en).replace(/•/g, '·')}
          </span>
        </div>

        {/* Canonical Horological Orb Instrument */}
        <MoodOrbit 
          language={language}
          x={pendingOrbit.x}
          y={pendingOrbit.y}
          budget={pendingOrbit.budget}
          time={pendingOrbit.time}
          activeMode={activeMode}
          onChange={(newX: number, newY: number, newBudget: number, newTime: number) => {
            isEditingRef.current = true;
            setPendingOrbit({
              x: newX,
              y: newY,
              budget: newBudget,
              time: newTime
            });
          }}
        />

        {/* 3-Action Selector Cards (MOVE / RESIZE / ROTATE) matching Intro Card 1 */}
        <div className="grid grid-cols-3 gap-2 w-full flex-shrink-0" id="mood-orbit-mode-buttons">
          {introCard0.actions.map((act: any, aIdx: number) => {
            const modeKeys: Array<'move' | 'resize' | 'rotate'> = ['move', 'resize', 'rotate'];
            const mode = modeKeys[aIdx];
            const isSelected = activeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setActiveMode(mode);
                  playHaptic(6);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[62px] ${
                  isSelected 
                    ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                    : 'bg-white/90 backdrop-blur-xs text-brand-charcoal border-[#E2DFC2]/80 hover:bg-white'
                }`}
              >
                <div className="mb-1">
                  {act.icon === 'Move' && <Move size={18} className={isSelected ? 'text-white stroke-[2]' : 'text-brand-charcoal stroke-[1.8]'} />}
                  {act.icon === 'Maximize2' && <Maximize2 size={18} className={isSelected ? 'text-white stroke-[2]' : 'text-brand-charcoal stroke-[1.8]'} />}
                  {act.icon === 'RotateCw' && <RotateCw size={18} className={isSelected ? 'text-white stroke-[2]' : 'text-brand-charcoal stroke-[1.8]'} />}
                </div>
                <div className="flex items-center gap-1 leading-none">
                  <span className={`text-[9px] font-mono font-bold ${isSelected ? 'text-white/80' : 'text-[#800020]'}`}>
                    {act.num}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                    {act.verb}
                  </span>
                </div>
                <span className={`text-[8.5px] font-sans truncate w-full text-center mt-0.5 ${isSelected ? 'text-white/80' : 'text-brand-charcoal/60'}`}>
                  {act.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. Compact CURRENT SELECTION Box */}
        <div 
          id="current-selection-box"
          className="bg-white/95 border border-[#2D3025]/15 rounded-2xl p-3.5 shadow-2xs text-left"
        >
          <div className="flex items-center justify-between border-b border-[#2D3025]/10 pb-2 mb-2.5">
            <span className="text-[13px] font-mono uppercase tracking-[0.2em] font-black text-[#800020]">
              {isSr ? 'TRENUTNI IZBOR' : isZh ? '当前所选' : isEs ? 'SELECCIÓN ACTUAL' : isDe ? 'AKTUELLE AUSWAHL' : isRu ? 'ТЕКУЩИЙ ВЫБОР' : 'CURRENT SELECTION'}
            </span>
            <span className="text-[12px] font-mono font-bold text-brand-charcoal uppercase">
              {isSr ? 'AŽURIRA SE UŽIVO' : isZh ? '实时调整中' : 'LIVE ADJUSTMENT'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl flex flex-col justify-between">
              <span className="text-[13px] uppercase tracking-wider text-brand-charcoal block font-bold">
                {isSr ? 'TIP' : isZh ? '类型' : isEs ? 'TIPO' : isDe ? 'TYP' : isRu ? 'ТИП' : 'TYPE'}
              </span>
              <span className="text-[16px] sm:text-[17px] font-sans font-bold text-brand-charcoal block leading-snug break-words mt-1">
                {pendingArchetype.name[language] || pendingArchetype.name.en}
              </span>
            </div>
            <div className="p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl flex flex-col justify-between">
              <span className="text-[13px] uppercase tracking-wider text-brand-charcoal block font-bold">
                {isSr ? 'BUDŽET' : isZh ? '预算' : isEs ? 'PRESUPUESTO' : isDe ? 'BUDGET' : isRu ? 'БЮДЖЕТ' : 'BUDGET'}
              </span>
              <span className="text-[22px] sm:text-[24px] font-mono font-black text-brand-charcoal block mt-1 leading-tight">
                €{Math.round(pendingOrbit.budget)}
              </span>
            </div>
            <div className="p-2.5 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-xl flex flex-col justify-between">
              <span className="text-[13px] uppercase tracking-wider text-brand-charcoal block font-bold">
                {isSr ? 'VREME' : isZh ? '可用时间' : isEs ? 'TIEMPO' : isDe ? 'ZEIT' : isRu ? 'ВРЕМЯ' : 'TIME'}
              </span>
              <span className="text-[22px] sm:text-[24px] font-mono font-black text-brand-charcoal block mt-1 leading-tight">
                {pendingOrbit.time}h
              </span>
            </div>
          </div>
        </div>

        {/* 5. Full-width Oxblood APPLY Button */}
        <button
          id="mood-orbit-apply-btn"
          onClick={handleApplyMoodOrbit}
          className="w-full py-3.5 px-4 rounded-xl font-mono text-[16px] uppercase tracking-[0.2em] font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] bg-[#800020] hover:bg-[#660019] text-white border border-[#660019]/40"
        >
          {appliedToast ? (
            <>
              <Check className="w-4 h-4 text-emerald-300 animate-bounce" />
              <span>
                {isSr ? 'MOOD ORBITA PRIMENJENA ✓' : isZh ? '已应用 ✓' : isEs ? 'APLICADO ✓' : isDe ? 'ANGEWENDET ✓' : isRu ? 'ПРИМЕНЕНО ✓' : 'MOOD ORBIT APPLIED ✓'}
              </span>
            </>
          ) : (
            <span>
              {isSr ? 'PRIMENI' : isZh ? '应用' : isEs ? 'APLICAR' : isDe ? 'ANWENDEN' : isRu ? 'ПРИМЕНИТЬ' : 'APPLY'}
            </span>
          )}
        </button>

        {/* Fine-Tuning Secondary Control */}
        <div className="pt-0.5" id="fine-tuning-section">
          <button
            type="button"
            onClick={() => {
              setRefineOpen(!refineOpen);
              playHaptic(6);
            }}
            className="w-full py-3 px-3.5 rounded-xl bg-white hover:bg-[#FAF9F5] border border-[#2D3025]/15 text-brand-charcoal transition-all flex items-center justify-between text-xs font-mono font-bold cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-[#800020]" />
              <span className="uppercase tracking-wider text-[14.5px] sm:text-[15px] text-brand-charcoal font-bold">
                {refineOpen
                  ? (isSr ? 'ZATVORI PRECIZNO PODEŠAVANJE' : isZh ? '收起精确数值微调' : isEs ? 'CERRAR PANEL DE AJUSTE' : isDe ? 'FEINABSTIMMUNG SCHLIESSEN' : isRu ? 'ЗАКРЫТЬ ТОЧНУЮ НАСТРОЙКУ' : 'CLOSE FINE-TUNING PANEL')
                  : (isSr ? 'PRECIZNO PODEŠAVANJE (KLIZAČI)' : isZh ? '精确数值微调 (滑块)' : isEs ? 'AJUSTE EXACTO (DESLIZADORES)' : isDe ? 'EXAKTE FEINABSTIMMUNG (REGLER)' : isRu ? 'ТОЧНАЯ НАСТРОЙКА (ПОЛЗУНКИ)' : 'EXACT FINE-TUNING (SLIDERS)')}
              </span>
            </div>
            <span className="text-[14px] text-[#800020] font-mono font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              <span>{refineOpen ? '▲' : '▼'}</span>
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
                <div className="pt-3 space-y-3">
                  {/* Budget Slider */}
                  <div className="space-y-2 bg-white/95 rounded-2xl border border-[#2D3025]/10 p-3.5" id="budget-slider-container">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-[13px] uppercase tracking-wider text-brand-charcoal font-bold">
                        {isSr ? 'BUDŽET (KLIZAČ)' : isZh ? '预算微调' : 'BUDGET SLIDER'}
                      </span>
                      <span className="text-[18px] font-mono font-black text-brand-charcoal">
                        €{Math.round(pendingOrbit.budget)}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="500" 
                      step="25"
                      value={pendingOrbit.budget}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        isEditingRef.current = true;
                        setPendingOrbit(prev => ({ ...prev, budget: val }));
                        if (val % 100 === 0) playHaptic(3);
                      }}
                      className="w-full h-1.5 bg-[#2D3025]/10 rounded-lg appearance-none cursor-pointer accent-[#800020]"
                    />
                    <div className="flex justify-between text-[13px] text-brand-charcoal font-mono font-medium">
                      <span>€50</span>
                      <span>€250</span>
                      <span>€500</span>
                    </div>
                  </div>

                  {/* Time Slider */}
                  <div className="space-y-2 bg-white/95 rounded-2xl border border-[#2D3025]/10 p-3.5" id="time-slider-container">
                    <div className="flex justify-between items-center leading-none">
                      <span className="text-[13px] uppercase tracking-wider text-brand-charcoal font-bold">
                        {isSr ? 'VREME (KLIZAČ)' : isZh ? '时间微调' : 'TIME SLIDER'}
                      </span>
                      <span className="text-[18px] font-mono font-black text-brand-charcoal">
                        {pendingOrbit.time}h
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="2" 
                      max="48" 
                      step="2"
                      value={pendingOrbit.time}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        isEditingRef.current = true;
                        setPendingOrbit(prev => ({ ...prev, time: val }));
                        if (val % 12 === 0) playHaptic(3);
                      }}
                      className="w-full h-1.5 bg-[#2D3025]/10 rounded-lg appearance-none cursor-pointer accent-[#800020]"
                    />
                    <div className="flex justify-between text-[13px] text-brand-charcoal font-mono font-medium">
                      <span>2h</span>
                      <span>24h</span>
                      <span>48h</span>
                    </div>
                  </div>

                  {/* Day Preference */}
                  <div className="space-y-2 bg-white/95 rounded-2xl border border-[#2D3025]/10 p-3.5">
                    <span className="text-[13px] uppercase tracking-wider text-brand-charcoal font-bold block leading-none">
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
                            type="button"
                            onClick={() => {
                              setDays(dayOpt);
                              playHaptic(8);
                            }}
                            className={`h-11 rounded-xl text-[14px] font-bold uppercase transition-all border cursor-pointer tracking-wider ${
                              active 
                                ? 'bg-[#800020] text-white border-[#800020] shadow-xs' 
                                : 'bg-white border-[#2D3025]/15 text-brand-charcoal hover:bg-[#FAF9F5]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time of Day */}
                  <div className="space-y-2 bg-white/95 rounded-2xl border border-[#2D3025]/10 p-3.5">
                    <span className="text-[13px] uppercase tracking-wider text-brand-charcoal font-bold block leading-none">
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
                            type="button"
                            onClick={() => {
                              setTimeOfDay(tOpt);
                              playHaptic(8);
                            }}
                            className={`h-11 rounded-xl text-[14px] font-bold uppercase transition-all border cursor-pointer tracking-wider ${
                              active 
                                ? 'bg-[#800020] text-white border-[#800020] shadow-xs' 
                                : 'bg-white border-[#2D3025]/15 text-brand-charcoal hover:bg-[#FAF9F5]'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Low Signal Mode */}
                  <div className="bg-white/95 rounded-2xl border border-[#2D3025]/10 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[13px] uppercase tracking-wider text-brand-charcoal font-bold block leading-none">
                          {isSr ? 'PUTNI REŽIM RADNJE' : isZh ? '旅行连线模式' : 'TRAVEL CONNECTIVITY'}
                        </span>
                        <span className="text-[15px] font-bold text-brand-charcoal">
                          {lowSignalMode 
                            ? (isSr ? 'Ušteda signala (Offline)' : isZh ? '离线优先模式' : 'Low Signal Mode')
                            : (isSr ? 'Standardni režim (Online)' : isZh ? '标准在线模式' : 'Standard Online Mode')
                          }
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onToggleLowSignal();
                          playHaptic(15);
                        }}
                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                          lowSignalMode ? 'bg-[#800020]' : 'bg-[#2D3025]/20'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 transform ${
                          lowSignalMode ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 8. Dedicated App Sharing & Secure Travel Pass Section (Permanently Visible) */}
      <section className="bg-brand-pearl rounded-[28px] border border-[#2D3025]/10 p-5 space-y-3.5 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="share-travel-pass-section">
        <div className="flex items-center justify-between border-b border-[#2D3025]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <QrCode className="text-[#800020] w-4 h-4" />
            <h2 className="text-[13px] uppercase tracking-[0.25em] font-black text-brand-charcoal">
              {isSr ? 'DELJENJE & PUTNA PROPUSNICA' : isZh ? '应用分享与旅行通行证' : isEs ? 'COMPARTIR Y PASE DE VIAJE' : isDe ? 'TEILEN & REISEPASS' : isRu ? 'ПОДЕЛИТЬСЯ И ТРЕВЕЛ-ПАСС' : 'APP SHARING & TRAVEL PASS'}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded font-black tracking-wider">
            {isSr ? 'BEZ INSTALACIJE' : isZh ? '即点即用' : 'ZERO CLUTTER'}
          </span>
        </div>

        <p className="text-[13.5px] text-brand-charcoal/80 leading-relaxed font-normal">
          {isSr 
            ? 'Preporučite IDEMO prijateljima, pošaljite im Vaš izbor ruta i omogućite im da sačuvaju aplikaciju direktno na svoj telefon jednim dodirom.'
            : isZh
            ? '将 IDEMO 推荐给好友，一键分享您的定制行程，或直接添加至手机桌面畅享地道塞尔维亚之旅。'
            : 'Share IDEMO with friends, send your calibrated travel pass, and allow them to install the application instantly on their home screen.'}
        </p>

        <div className="bg-white rounded-2xl border border-[#2D3025]/10 p-3.5 space-y-3 shadow-2xs relative">
          {/* Mobile backdrop to dismiss active tooltip */}
          {activeTooltip && (
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setActiveTooltip(null)} 
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative">
            {/* Direct App Share & Install Modal Trigger */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setShareModalOpen(true);
                  playHaptic(15);
                }}
                className="w-full h-12 pr-9 pl-3 rounded-xl font-mono font-black tracking-wider uppercase text-[12.5px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] bg-[#800020] hover:bg-[#660019] text-white border border-[#660019]/40"
              >
                <Share2 size={16} className="shrink-0" />
                <span className="truncate">
                  {isSr ? 'PODELI & PREUZMI APLIKACIJU' : isZh ? '分享与安装应用' : 'SHARE & INSTALL APP'}
                </span>
              </button>

              {/* Tooltip Info Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(activeTooltip === 'share' ? null : 'share');
                  playHaptic(10);
                }}
                aria-label="Info: Podeli aplikaciju"
                title={isSr ? 'Saznaj kako radi deljenje' : 'Learn how sharing works'}
                className="absolute top-2.5 right-2 w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
              >
                <Info size={13} />
              </button>

              {/* Hover / Tap Tooltip */}
              <div
                className={`absolute bottom-full mb-2 left-0 right-0 sm:left-0 sm:right-auto sm:w-72 bg-[#2D3025] text-[#FAF9F5] p-3 rounded-xl shadow-2xl border border-white/15 z-40 text-left transition-all duration-150 ${
                  activeTooltip === 'share' 
                    ? 'block opacity-100 scale-100 pointer-events-auto' 
                    : 'hidden group-hover:block opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300">
                    {isSr ? 'KAKO RADI OVO DUGME?' : 'HOW DOES THIS WORK?'}
                  </span>
                  {activeTooltip === 'share' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-white/60 hover:text-white p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[11.5px] leading-relaxed text-white/90">
                  {isSr
                    ? 'Šalje link za celu IDEMO aplikaciju prijatelju (preko WhatsApp-a, Vibera, Telegrama ili SMS-a). Prijatelj je odmah otvara u pretraživaču bez skidanja sa prodavnice!'
                    : 'Sends a link to the complete IDEMO app to friends (via WhatsApp, Viber, SMS). Friends open it immediately in their browser without downloading from an app store!'}
                </p>
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-amber-200/90 font-mono">
                  <Smartphone size={11} className="shrink-0" />
                  <span>{isSr ? 'Bez registracije • Radi odmah' : 'No store download • Instant access'}</span>
                </div>
              </div>
            </div>

            {/* Copy Personal Travel Pass */}
            <div className="relative group">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full h-12 pr-9 pl-3 rounded-xl font-mono font-bold tracking-wider uppercase text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                  linkCopied 
                    ? 'bg-emerald-600 text-white border border-emerald-600' 
                    : 'bg-white hover:bg-[#FAF9F5] text-brand-charcoal border border-[#2D3025]/15'
                }`}
              >
                {linkCopied ? <Check size={16} className="shrink-0" /> : <Copy size={16} className="shrink-0" />}
                <span className="truncate">
                  {linkCopied 
                    ? (isSr ? 'PROPUSNICA KOPIRANA!' : isZh ? '通行证已复制！' : 'PASS COPIED!') 
                    : (isSr ? 'KOPIRAJ MOJU PROPUSNICU' : isZh ? '复制我的通行证' : 'COPY MY TRAVEL PASS')
                  }
                </span>
              </button>

              {/* Tooltip Info Trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(activeTooltip === 'pass' ? null : 'pass');
                  playHaptic(10);
                }}
                aria-label="Info: Putna propusnica"
                title={isSr ? 'Saznaj šta je putna propusnica' : 'Learn what travel pass is'}
                className="absolute top-2.5 right-2 w-7 h-7 rounded-lg bg-brand-charcoal/5 hover:bg-brand-charcoal/10 text-brand-charcoal flex items-center justify-center transition-colors z-20 cursor-pointer"
              >
                <Info size={13} />
              </button>

              {/* Hover / Tap Tooltip */}
              <div
                className={`absolute bottom-full mb-2 left-0 right-0 sm:left-auto sm:right-0 sm:w-72 bg-[#2D3025] text-[#FAF9F5] p-3 rounded-xl shadow-2xl border border-white/15 z-40 text-left transition-all duration-150 ${
                  activeTooltip === 'pass' 
                    ? 'block opacity-100 scale-100 pointer-events-auto' 
                    : 'hidden group-hover:block opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto'
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-amber-300">
                    {isSr ? 'ŠTA JE PUTNA PROPUSNICA?' : 'WHAT IS TRAVEL PASS?'}
                  </span>
                  {activeTooltip === 'pass' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTooltip(null);
                      }}
                      className="text-white/60 hover:text-white p-0.5"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[11.5px] leading-relaxed text-white/90">
                  {isSr
                    ? 'Kopira Vaš personalizovani link koji prenosi Vaša podešavanja (Mood Orbit raspoloženje, omiljene kategorije i rute). Prijatelj klikom odmah vidi Vaš profil bez ikakve instalacije!'
                    : 'Copies your personal link containing your calibrated Mood Orbit, selected interests, and venues. Friends open it directly in their browser without downloading any app!'}
                </p>
                <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-amber-200/90 font-mono">
                  <Sparkles size={11} className="shrink-0" />
                  <span>{isSr ? 'Vaše preporuke • Lični profil' : 'Your preferences • Personal profile'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Collapsible Guide: How does this work? (No store download needed) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setPassExplainerOpen(!passExplainerOpen);
                playHaptic(10);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand-pearl/70 hover:bg-brand-pearl border border-[#2D3025]/10 text-brand-charcoal transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Info size={14} className="text-[#800020] shrink-0" />
                <span className="text-[11px] font-mono font-black tracking-wider uppercase text-brand-charcoal group-hover:text-[#800020] transition-colors">
                  {isSr ? 'Da li prijatelj mora da skida aplikaciju? (Saznaj kako radi)' : isZh ? '好友需要下载应用吗？（工作原理）' : 'DOES A FRIEND NEED TO DOWNLOAD THE APP? (HOW IT WORKS)'}
                </span>
              </div>
              <ChevronDown size={14} className={`text-brand-charcoal/60 transition-transform duration-200 shrink-0 ${passExplainerOpen ? 'rotate-180 text-[#800020]' : ''}`} />
            </button>

            <AnimatePresence>
              {passExplainerOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-[#FAF9F5] rounded-xl p-3.5 border border-[#2D3025]/10 space-y-2.5 text-[12px] leading-relaxed text-brand-charcoal/90">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020]/10 text-[#800020] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <p>
                        <strong className="text-brand-charcoal font-bold">{isSr ? 'Može potpuno bez skidanja sa prodavnice:' : 'No App Store download required:'}</strong>{' '}
                        {isSr 
                          ? 'Prijatelj ne mora da traži IDEMO na App Store-u ili Google Play-u. Kada klikne na Vaš link, aplikacija se istog trenutka otvara u Safariju, Chrome-u ili bilo kom telefonu.'
                          : 'Your friend does not need to search App Store or Google Play. Clicking your link opens IDEMO instantly in Safari, Chrome, or any mobile browser.'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020]/10 text-[#800020] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <p>
                        <strong className="text-brand-charcoal font-bold">{isSr ? 'Odmah vidi Vaš lični profil:' : 'Instantly sees your calibrated profile:'}</strong>{' '}
                        {isSr 
                          ? 'Kada pošaljete „Putnu propusnicu“, prijatelj odmah vidi Vaš izbor raspoloženja (Mood Orbit), odabrane kategorije i sačuvane rute — bez kreiranja naloga.'
                          : 'Sending your Travel Pass allows them to instantly experience your Mood Orbit preferences, interests, and saved spots — zero registration required.'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#800020]/10 text-[#800020] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <p>
                        <strong className="text-brand-charcoal font-bold">{isSr ? 'Opciono čuvanje na ekran telefona:' : 'Optional Home Screen shortcut:'}</strong>{' '}
                        {isSr 
                          ? 'Ako prijatelj želi stalnu ikonicu kao pravu aplikaciju, u meniju pretraživača bira „Dodaj na početni ekran“ (Add to Home Screen) i IDEMO radi offline brzo i pouzdano.'
                          : 'For permanent offline access, they can simply tap "Add to Home Screen" in their browser menu to install the IDEMO emblem.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 8. Existing Interests Controls */}
      <section className="bg-brand-pearl rounded-[28px] border border-[#2D3025]/10 p-5 space-y-3.5 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="interests-section">
        <div className="flex items-center justify-between border-b border-[#2D3025]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#800020] w-3.5 h-3.5" />
            <h2 className="text-[13px] uppercase tracking-[0.25em] font-black text-brand-charcoal">
              {isSr ? 'GLAVNA INTERESOVANJA' : isZh ? '重点关注领域' : isEs ? 'INTERESES PRINCIPALES' : isDe ? 'HAUPTINTERESSEN' : isRu ? 'ОСНОВНЫЕ ИНТЕРЕСЫ' : 'PRIMARY INTERESTS'}
            </h2>
          </div>
          <span className="text-[12px] font-mono text-brand-charcoal uppercase font-bold">
            {isSr ? 'VIŠESTRUKI IZBOR' : isZh ? '多选' : 'MULTI-SELECT'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: Category.WELLBEING, labelSr: 'Velnes', labelZh: '健康理疗', labelEs: 'Bienestar', labelDe: 'Wellness', labelRu: 'Велнес', labelEn: 'Wellbeing' },
            { id: Category.MEDICAL, labelSr: 'Medicina', labelZh: '医疗健康', labelEs: 'Medicina', labelDe: 'Medizin', labelRu: 'Медицина', labelEn: 'Medical' },
            { id: Category.NATURE, labelSr: 'Priroda', labelZh: '自然探索', labelEs: 'Naturaleza', labelDe: 'Natur', labelRu: 'Природа', labelEn: 'Nature' },
            { id: Category.HISTORY, labelSr: 'Istorija', labelZh: '历史文化', labelEs: 'Historia', labelDe: 'Geschichte', labelRu: 'История', labelEn: 'History' },
            { id: Category.GASTRONOMY, labelSr: 'Gastronomija', labelZh: '美食品鉴', labelEs: 'Gastronomía', labelDe: 'Gastronomie', labelRu: 'Гастрономия', labelEn: 'Gastronomy' },
            { id: Category.TRAVEL, labelSr: 'Putovanja', labelZh: '旅行观光', labelEs: 'Viajes', labelDe: 'Reisen', labelRu: 'Путешествия', labelEn: 'Travel' },
            { id: Category.CLUBBING, labelSr: 'Noćni život', labelZh: '俱乐部夜生活', labelEs: 'Vida Nocturna', labelDe: 'Nachtleben', labelRu: 'Клубы', labelEn: 'Clubbing' },
          ].map((catObj) => {
            const active = selectedCats.includes(catObj.id);
            const label = isSr ? catObj.labelSr : isZh ? catObj.labelZh : isEs ? catObj.labelEs : isDe ? catObj.labelDe : isRu ? catObj.labelRu : catObj.labelEn;
            return (
              <button
                key={catObj.id}
                type="button"
                onClick={() => toggleCat(catObj.id)}
                className={`px-4 py-2.5 rounded-full text-[15px] font-sans font-bold uppercase tracking-wide transition-all border cursor-pointer flex items-center gap-1.5 active:translate-y-[1px] shadow-2xs ${
                  active 
                    ? 'bg-[#800020] text-white border-[#800020]' 
                    : 'bg-white border-[#2D3025]/20 text-brand-charcoal hover:bg-[#FAF9F5]'
                }`}
              >
                <span>{label}</span>
                {active && <span className="text-[10px]">●</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* QUESTION 3: What have I explored? -> Your Journey */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="your-journey-section">
        <div className="flex items-center gap-2">
          <Heart className="text-accent-red w-4 h-4" />
          <h2 className="text-[13px] uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'ISTRAŽENI HORIZONTI' : isZh ? '已探索的轨迹' : 'WHAT HAVE I EXPLORED?'}
          </h2>
        </div>

        {/* Clean 3-column statistics grid (Removed pulsing NOMINAL telemetric indicator card) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[12px] uppercase tracking-wider text-brand-charcoal font-black block mb-1">
              {isSr ? 'SAČUVANO' : isZh ? '已收藏' : 'SAVED'}
            </span>
            <span className="text-2xl font-black text-brand-charcoal leading-none">
              {likedIds ? likedIds.size : 0}
            </span>
          </div>
          
          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[12px] uppercase tracking-wider text-brand-charcoal font-black block mb-1">
              {isSr ? 'OCENJENO' : isZh ? '已评分' : 'RATED'}
            </span>
            <span className="text-2xl font-black text-brand-charcoal leading-none">
              {Object.keys(ratings || {}).length}
            </span>
          </div>

          <div className="bg-white/60 border border-[#2D3025]/5 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[12px] uppercase tracking-wider text-brand-charcoal font-black block mb-1">
              {isSr ? 'USKLAĐENO' : isZh ? '完美推荐' : 'ALIGNED'}
            </span>
            <span className="text-2xl font-black text-brand-charcoal leading-none">
              {Object.values(ratings || {}).filter((r: any) => r.vibe === 'like').length}
            </span>
          </div>
        </div>
      </section>

      {/* QUESTION 4: Why can I trust IDEMO? -> Trust & Privacy Expandable Card */}
      <section className="bg-brand-pearl rounded-3xl border border-[#2D3025]/10 p-5 space-y-4 shadow-[0_2px_8px_rgba(35,37,30,0.02)]" id="trust-privacy-section">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-accent-teal w-4.5 h-4.5" />
          <h2 className="text-[13px] uppercase tracking-[0.25em] font-black text-brand-charcoal">
            {isSr ? 'POVERENJE I PRIVATNOST' : isZh ? '信任与隐私' : 'TRUST & PRIVACY'}
          </h2>
        </div>

        <p className="text-[15px] leading-relaxed text-brand-charcoal font-normal">
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
              className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black tracking-wider uppercase text-[15px] text-brand-charcoal cursor-pointer hover:bg-white/60 transition-colors"
            >
              <span>{isSr ? 'Poverenje i privatnost' : isZh ? '信任与隐私' : 'Trust & Privacy'}</span>
              {trustOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                  {/* 1. Privacy Policy & GDPR */}
                  <div className="space-y-2">
                    <h3 className="text-[13px] uppercase tracking-[0.18em] font-black text-brand-charcoal">
                      {isSr ? '1. POLITIKA PRIVATNOSTI & GDPR' : isZh ? '1. 隐私规范 & 数据安全 (GDPR)' : '1. Privacy & GDPR'}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-brand-charcoal font-normal">
                      {isSr
                        ? 'IDEMO je dizajniran po principu potpune privatnosti. Vaša aktivnost se nikada ne prenosi na servere. Svi podaci o pretragama i ocenama se skladište isključivo lokalno.'
                        : isZh
                        ? '我们坚守最高标准的隐私原则：零云端跟踪、零广告画像。您的所有足迹及偏好数据 100% 存在手机本地沙盒中。'
                        : 'IDEMO is committed to your data sovereignty. We collect zero analytics, utilize no tracking SDKs, and store all configurations completely locally in your secure sandboxed browser storage.'}
                    </p>
                    <div className="max-h-40 overflow-y-auto text-[13px] text-brand-charcoal font-normal border border-[#2D3025]/10 p-2.5 rounded-xl bg-white/40 space-y-1.5">
                      <PrivacyPolicyContent language={language} />
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          onResetOnboarding();
                          playHaptic([40, 20]);
                          alert(getResetSuccessMessage());
                        }}
                        className="text-[12px] uppercase tracking-widest font-black text-accent-teal hover:underline cursor-pointer"
                      >
                        {isSr ? 'Resetuj uvodni vodič' : isZh ? '重置新手引导流程' : 'Reset Introduction Guide'}
                      </button>
                    </div>
                    
                    {/* Purge Memories block */}
                    <div className="border-t border-[#2D3025]/5 pt-3 space-y-2">
                      <span className="text-[12px] uppercase tracking-wider text-accent-red font-black block leading-none">
                        {isSr ? 'CRVENA ZONA: BRISANJE PODATAKA' : isZh ? '危机控制：永久抹除数据' : 'DANGER ZONE: DELETE ALL LOCAL MEMORIES'}
                      </span>
                      <p className="text-[13px] text-brand-charcoal font-medium">
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
                          className="h-10 px-4 rounded-xl text-[12px] uppercase tracking-widest font-black bg-accent-red text-white hover:bg-red-700 transition-all cursor-pointer active:scale-95"
                        >
                          {isSr ? 'Obriši sve podatke' : isZh ? '申请抹除数据' : 'Purge All Local Memories'}
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                          <AlertTriangle className="text-accent-red w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[13px] font-bold text-accent-red">
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
                            className="h-8 px-3 rounded-lg bg-red-700 text-white text-[12px] font-black uppercase cursor-pointer"
                          >
                            {isSr ? 'DA, IZBRIŠI' : isZh ? '是的，立即粉碎' : 'YES, PURGE'}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmStep(0);
                              playHaptic(10);
                            }}
                            className="h-8 px-3 rounded-lg bg-gray-200 text-[#2D3025] text-[12px] font-black uppercase cursor-pointer"
                          >
                            {isSr ? 'Otkaži' : isZh ? '放弃' : 'Cancel'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Legal Disclaimer */}
                  <div className="space-y-2 pt-4">
                    <h3 className="text-[13px] uppercase tracking-[0.18em] font-black text-brand-charcoal">
                      {isSr ? '3. PRAVNE INFORMACIJE I VERZIJA' : isZh ? '3. 法律声明' : '3. Legal Disclaimer'}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-brand-charcoal font-normal">
                      {isSr 
                        ? 'IDEMO je nezavisna, autentična platforma nastala u saradnji sa lokalnim turističkim kustosima i entuzijastima Beograda. Nismo zvanično povezani sa Turističkom organizacijom Beograda ili gradskim upravama.' 
                        : isZh 
                        ? 'IDEMO 是一款独立、纯粹的本地数字导游 service。我们由贝尔格莱德资深人文向导、美食品鉴师及城市漫游家联合打造，与官方旅游管理部门或任何政府机构无隶属关联。' 
                        : 'IDEMO is a sovereign, non-affiliated independent platform created in cooperation with hand-picked Belgrade curators. Not associated with the Tourist Organization of Belgrade.'}
                    </p>
                    
                    {/* Non-technical version and copyright tag */}
                    <div className="bg-[#FAF9F5] border border-[#2D3025]/5 rounded-xl p-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[11px] uppercase tracking-widest text-brand-charcoal font-black block">
                          {isSr ? 'PREDANOST KVALITETU' : isZh ? '品质及信誉承诺' : 'COMMITMENT TO EXCELLENCE'}
                        </span>
                        <span className="text-[13px] font-extrabold text-brand-charcoal flex items-center gap-1">
                          Curated with care in Belgrade
                        </span>
                      </div>
                      <span className="font-mono text-[11px] font-black text-brand-charcoal bg-[#2D3025]/10 px-2.5 py-0.5 rounded-md">
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
              className="w-full px-4 py-3.5 flex items-center justify-between text-left font-black tracking-wider uppercase text-[15px] text-brand-charcoal cursor-pointer hover:bg-white/60 transition-colors"
            >
              <span>{isSr ? 'Putna podrška i SOS' : isZh ? '旅途安全保障救援 (SOS)' : 'Travel Support & SOS'}</span>
              {supportOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
    </motion.div>

    {/* Ultra-Luxury Share & Install / Download IDEMO Modal */}
    <AnimatePresence>
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShareModalOpen(false);
              playHaptic(6);
            }}
            className="absolute inset-0 bg-[#1A1C16]/65 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-md bg-[#FAF9F5] border border-[#2D3025]/15 rounded-[28px] shadow-2xl overflow-hidden z-10 p-6 space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#2D3025]/10 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#800020] font-black block">
                  {isSr ? 'PREPORUČI & INSTALIRAJ' : isZh ? '分享与一键安装' : 'SHARE & INSTALL'}
                </span>
                <h3 className="font-serif font-black text-xl text-brand-charcoal tracking-tight">
                  {isSr ? 'Podelite IDEMO sa prijateljima' : isZh ? '将 IDEMO 分享给好友' : 'Share IDEMO with Friends'}
                </h3>
                <p className="text-[12px] text-brand-charcoal/70 leading-relaxed">
                  {isSr 
                    ? 'Omogućite drugima da istraže kurirana mesta ili odmah preuzmu IDEMO na svoj telefon.'
                    : isZh
                    ? '让朋友一键打开专属塞尔维亚指南，并支持直接添加安装至手机桌面。'
                    : 'Invite friends to explore curated experiences and easily save IDEMO directly to their devices.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShareModalOpen(false);
                  playHaptic(6);
                }}
                className="w-8 h-8 rounded-full bg-white border border-[#2D3025]/10 flex items-center justify-center text-brand-charcoal hover:bg-[#F0EEE6] cursor-pointer transition-colors shrink-0 -mt-1 -mr-1"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Primary Action: Native OS Share Sheet */}
            <button
              type="button"
              onClick={handleNativeShareApp}
              className="w-full h-12 rounded-2xl bg-[#800020] hover:bg-[#660019] text-white font-mono font-black text-[13px] tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <Share2 size={16} />
              <span>
                {isSr ? 'PODELI PREKO TELEFONA (AIRDROP / SMS / MENI)' : isZh ? '系统快捷分享 (AirDrop / 微信 / 消息)' : 'SHARE VIA SYSTEM (AIRDROP / APPS)'}
              </span>
            </button>

            {/* Direct Messaging Channels */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-charcoal/60 font-bold block">
                {isSr ? 'BRZI KANALI ZA SLANJE' : isZh ? '直接发送渠道' : 'INSTANT MESSAGING'}
              </span>

              <div className="grid grid-cols-3 gap-2">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="h-11 rounded-xl bg-white hover:bg-emerald-50 border border-[#25D366]/40 text-[#075E54] font-bold text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.97]"
                >
                  <Send size={13} className="text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>

                {/* Telegram */}
                <button
                  type="button"
                  onClick={handleShareTelegram}
                  className="h-11 rounded-xl bg-white hover:bg-sky-50 border border-[#0088cc]/30 text-[#0088cc] font-bold text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.97]"
                >
                  <Send size={13} className="text-[#0088cc]" />
                  <span>Telegram</span>
                </button>

                {/* Viber */}
                <button
                  type="button"
                  onClick={handleShareViber}
                  className="h-11 rounded-xl bg-white hover:bg-purple-50 border border-[#7360f2]/30 text-[#59267c] font-bold text-[11.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.97]"
                >
                  <Send size={13} className="text-[#7360f2]" />
                  <span>Viber</span>
                </button>
              </div>
            </div>

            {/* Direct Link One-Tap Copy */}
            <div className="bg-white rounded-2xl border border-[#2D3025]/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-charcoal/70 font-bold">
                  {isSr ? 'DIREKTAN WEB LINK' : isZh ? '直接网页链接' : 'DIRECT WEB LINK'}
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  {copiedAppShare ? (isSr ? 'KOPIRANO!' : isZh ? '已复制！' : 'COPIED!') : 'LIVE'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}`}
                  className="flex-1 h-9 px-3 bg-[#FAF9F5] border border-[#2D3025]/10 rounded-lg text-[11px] font-mono text-brand-charcoal select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyAppShare}
                  className={`h-9 px-3 rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                    copiedAppShare 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-brand-charcoal hover:bg-black text-white'
                  }`}
                >
                  {copiedAppShare ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedAppShare ? (isSr ? 'KOPIRANO' : isZh ? '已复制' : 'COPIED') : (isSr ? 'KOPIRAJ' : isZh ? '复制' : 'COPY')}</span>
                </button>
              </div>
            </div>

            {/* How Friends Can "Download" and Save to Home Screen */}
            <div className="bg-[#800020]/5 rounded-2xl border border-[#800020]/15 p-3.5 space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 text-[#800020]">
                <Download size={14} />
                <span className="text-[11px] font-bold tracking-wider uppercase font-mono">
                  {isSr ? 'KAKO PRIJATELJ PREUZIMA APLIKACIJU?' : isZh ? '好友如何免下载安装至手机？' : 'HOW TO INSTALL ON PHONE'}
                </span>
              </div>
              <p className="text-[11.5px] text-brand-charcoal/80 leading-relaxed font-sans">
                {isSr ? (
                  <>
                    Otvaranjem linka u Safariju (iOS) ili Chrome-u (Android), prijatelj bira opciju <strong>„Dodaj na početni ekran“ (Add to Home Screen)</strong>. IDEMO odmah radi kao izvorna aplikacija sa potpunim offline pristupom.
                  </>
                ) : isZh ? (
                  <>
                    在 Safari 或 Chrome 浏览器中打开链接，点击分享并选择<strong>“添加到主屏幕” (Add to Home Screen)</strong>，无需应用商店即可立享原生流畅与离线体验。
                  </>
                ) : (
                  <>
                    When opened in mobile Safari or Chrome, tap <strong>Share → "Add to Home Screen"</strong>. IDEMO immediately installs as a native, offline-capable luxury web application with zero storage clutter.
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </div>
  );
}
