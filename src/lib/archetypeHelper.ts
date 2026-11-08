/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category } from '../types';

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
    const timeDiff = Math.abs(time - arch.targetTime) / 72;

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
