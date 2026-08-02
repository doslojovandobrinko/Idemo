import React, { useState, useMemo } from "react";
import { Recommendation, Category } from "../types";
import { ShieldCheck, Plus, Check, Info, Grid, RefreshCw } from "lucide-react";

interface MoodOrbGridAnalyzerProps {
  language: string;
  recommendations: Recommendation[];
  onAddCustomRecommendations?: (recs: Recommendation[]) => void;
  onHaptic?: (intensity: number) => void;
  budget: number;
  time: number;
  selectedCats: string[];
}

// Map of categories to coordinates in the range 0 to 1
const CATEGORY_COORDS: Record<string, { x: number; y: number }> = {
  [Category.HISTORY]: { x: 0.55, y: 0.25 },
  [Category.NATURE]: { x: 0.85, y: 0.85 },
  [Category.GASTRONOMY]: { x: 0.15, y: 0.3 },
  [Category.CLUBBING]: { x: 0.3, y: 0.15 },
  [Category.WELLBEING]: { x: 0.2, y: 0.75 },
  [Category.TRAVEL]: { x: 0.75, y: 0.55 },
  [Category.MEDICAL]: { x: 0.45, y: 0.45 },
};

// 4 Premium Gap-Filling Curations to resolve blind spots
const GAP_FILLERS: any[] = [
  {
    id: "gap-filler-gledic",
    title: "Gledić Highlands Retreat",
    category: "Wellbeing, Nature",
    shortDescription:
      "Tucked away in the isolated peaks of central Serbia, this eco-haven offers pristine forest baths and slow-food gastronomy at 900m altitude.",
    longDescription:
      "Gledić Highlands Retreat is designed for travelers seeking complete digital detox and physical restoration. Positioned perfectly in the high-elevation forests, it features cold-plunge mountain springs, private stone saunas, and hand-foraged organic dining led by local shepherds.",
    image: "/src/assets/images/gledic_highlands_retreat.png",
    duration: "6-8 hours",
    travelTime: "2 - 2.5 hours",
    travelTimeMinutes: 130,
    location: "Gledić Mountains",
    estimatedCost: "€65",
    preferredTransport: "SUV / 4x4",
    coordinates: { lat: 43.7554, lng: 20.9136 },
    translations: {
      sr: {
        title: "Planinski azil Gledić",
        shortDescription:
          "Skriveno eko-utočište na Gledićkim planinama sa šumskim kupatilima i organskom hranom.",
        location: "Gledićke planine",
      },
      zh: {
        title: "格莱迪奇高地静修所",
        shortDescription:
          "坐落于塞尔维亚中部的幽静山脉中，提供森林浴与原始有机餐饮。",
        location: "格莱迪奇山脉",
      },
    },
    // Forced coordinate mapping override to represent the extreme top-left blind spot
    customCoords: { x: -4.5, y: 4.5 },
  },
  {
    id: "gap-filler-krupaj",
    title: "Krupaj Springs Sanctuary",
    category: "Nature, Wellbeing",
    shortDescription:
      "An exotic turquoise karst spring of surreal beauty, paired with thermal mineral baths and fresh river trout dining.",
    longDescription:
      "Krupaj Springs Sanctuary represents a geological masterpiece in eastern Serbia. The thermal spring forms a deep turquoise pool surrounded by dense forest, where visitors can enjoy private mineral therapy and historical monastery visits.",
    image: "/src/assets/images/krupaj_springs.png",
    duration: "4-5 hours",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Homolje Region",
    estimatedCost: "€40",
    preferredTransport: "Car",
    coordinates: { lat: 44.1833, lng: 21.6167 },
    translations: {
      sr: {
        title: "Svetilište Krupajskog Vrela",
        shortDescription:
          "Egzotični kraški izvor tirkizne vode, uparen sa termalnim mineralnim kupatilima.",
        location: "Homolje",
      },
      zh: {
        title: "库帕伊泉生态保护区",
        shortDescription: "超现实的绿松石色喀斯特泉水，配有热矿泉疗养。",
        location: "霍莫列地区",
      },
    },
    // Forced coordinate mapping override to represent the top-right blind spot
    customCoords: { x: 1.5, y: 4.5 },
  },
  {
    id: "gap-filler-despot",
    title: "Despot Stefan’s Gilded Heritage",
    category: "History, Gastronomy",
    shortDescription:
      "A premium medieval banquet in the outer courtyard of Manasija Fortress, featuring authentic spiced honey wines.",
    longDescription:
      "Despot Stefan’s Gilded Heritage merges royal history with medieval gastronomy. Set against the limestone towers of Manasija, guests dine on venison roast and copper-pot wines prepared according to preserved 15th-century court codices.",
    image: "/src/assets/images/despot_banquet.png",
    duration: "3-4 hours",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "Despotovac",
    estimatedCost: "€85",
    preferredTransport: "Limousine / Sedan",
    coordinates: { lat: 44.1017, lng: 21.4697 },
    translations: {
      sr: {
        title: "Zlaćana baština despota Stefana",
        shortDescription:
          "Ekskluzivni srednjovekovni banket u zidinama tvrđave Manasija sa vinima od meda.",
        location: "Despotovac",
      },
      zh: {
        title: "斯特凡大公鎏金晚宴",
        shortDescription:
          "马纳西亚城堡外院的顶级中世纪宴会，配有秘制香料蜜酒。",
        location: "德斯波托瓦茨",
      },
    },
    // Forced coordinate mapping override to represent the extreme bottom-right blind spot
    customCoords: { x: 4.5, y: -4.5 },
  },
  {
    id: "gap-filler-zemun",
    title: "Zemun Riverfront Midnight Lounge",
    category: "Clubbing, Gastronomy",
    shortDescription:
      "A private riverside terrace offering custom molecular cocktails and ambient deep house under the stars.",
    longDescription:
      "Zemun Riverfront Midnight Lounge offers premium late-night entertainment on the banks of the Danube. Combining historical tavern elements with modern luxury mixology and high-contrast sound design.",
    image: "/src/assets/images/zemun_lounge.png",
    duration: "3-5 hours",
    travelTime: "20 mins",
    travelTimeMinutes: 20,
    location: "Old Zemun Quay",
    estimatedCost: "€50",
    preferredTransport: "Taxi / Boat",
    coordinates: { lat: 44.8415, lng: 20.4136 },
    translations: {
      sr: {
        title: "Zemunski ponoćni kej salon",
        shortDescription:
          "Ekskluzivni bar na Dunavskom keju sa molekularnim koktelima i deep house ritmovima.",
        location: "Zemunski kej",
      },
      zh: {
        title: "泽蒙河畔午夜沙龙",
        shortDescription:
          "私密的河畔露台，在星空下提供定制分子鸡尾酒与深度浩室音乐。",
        location: "老泽蒙码头",
      },
    },
    // Forced coordinate mapping override to represent the extreme bottom-left blind spot
    customCoords: { x: -4.5, y: -4.5 },
  },
];

export default function MoodOrbGridAnalyzer({
  language,
  recommendations,
  onAddCustomRecommendations,
  onHaptic,
  budget,
  time,
  selectedCats,
}: MoodOrbGridAnalyzerProps) {
  const [gapFillersActive, setGapFillersActive] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Helper to calculate coordinates in the range -5 to +5 based on category coords
  const getCurationCoords = (rec: any) => {
    if (
      typeof rec.coordinateX === "number" &&
      typeof rec.coordinateY === "number"
    ) {
      return { x: rec.coordinateX, y: rec.coordinateY };
    }
    if (rec.customCoords) {
      return rec.customCoords;
    }
    const cats =
      typeof rec.category === "string"
        ? rec.category.split(",").map((s: string) => s.trim())
        : [rec.category];

    let totalX = 0;
    let totalY = 0;
    let count = 0;

    for (const cat of cats) {
      if (CATEGORY_COORDS[cat]) {
        totalX += CATEGORY_COORDS[cat].x;
        totalY += CATEGORY_COORDS[cat].y;
        count++;
      }
    }

    const x = count > 0 ? totalX / count : 0.5;
    const y = count > 0 ? totalY / count : 0.5;

    return {
      x: Math.round((x - 0.5) * 10 * 10) / 10,
      y: Math.round((y - 0.5) * 10 * 10) / 10,
    };
  };

  // List of active curations with their coordinates
  const activeCurations = useMemo(() => {
    const list = [...recommendations];

    // Add gap fillers if toggled on
    if (gapFillersActive) {
      for (const gf of GAP_FILLERS) {
        if (!list.some((r) => r.id === gf.id)) {
          list.push(gf);
        }
      }
    }

    return list.map((rec) => ({
      id: rec.id,
      title: rec.title,
      srTitle: rec.translations?.sr?.title || rec.title,
      zhTitle: rec.translations?.zh?.title || rec.title,
      category: rec.category,
      coords: getCurationCoords(rec),
    }));
  }, [recommendations, gapFillersActive]);

  // Calculate coordinates of 100 squares (centers)
  // X columns from -5 to +5 (centers: -4.5 to +4.5)
  // Y rows from -5 to +5 (centers: -4.5 to +4.5, displayed top to bottom)
  const gridSquares = useMemo(() => {
    const squares = [];
    const centers = [-4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5];

    for (let rowIdx = 0; rowIdx < 10; rowIdx++) {
      const sy = centers[9 - rowIdx]; // Top row is +4.5, bottom is -4.5
      for (let colIdx = 0; colIdx < 10; colIdx++) {
        const sx = centers[colIdx]; // Left col is -4.5, right is +4.5

        // Find max match with any curation
        // Match = 100% - 5% * (|sx - cx| + |sy - cy|)
        let maxMatch = 0;
        let closestCurationId = "";
        let closestCurationTitle = "";

        for (const cur of activeCurations) {
          const dist =
            Math.abs(sx - cur.coords.x) + Math.abs(sy - cur.coords.y);
          const matchPercent = Math.max(0, 100 - 5 * dist);
          if (matchPercent > maxMatch) {
            maxMatch = matchPercent;
            closestCurationId = cur.id;
            closestCurationTitle =
              language === "sr"
                ? cur.srTitle
                : language === "zh"
                  ? cur.zhTitle
                  : cur.title;
          }
        }

        squares.push({
          row: rowIdx,
          col: colIdx,
          x: sx,
          y: sy,
          match: Math.round(maxMatch * 10) / 10,
          closestId: closestCurationId,
          closestTitle: closestCurationTitle,
        });
      }
    }
    return squares;
  }, [activeCurations, language]);

  // Analyze blind spots and overall coverage match rate
  const analysis = useMemo(() => {
    const blindSpots = gridSquares.filter((s) => s.match < 90);
    const averageMatch = gridSquares.reduce((sum, s) => sum + s.match, 0) / 100;
    const squaresAbove90 = gridSquares.filter((s) => s.match >= 90).length;

    return {
      blindSpots,
      averageMatch: Math.round(averageMatch * 10) / 10,
      coveragePercent: squaresAbove90, // Since there are 100 squares
    };
  }, [gridSquares]);

  const handleToggleGapFillers = () => {
    if (onHaptic) onHaptic(12);
    const nextState = !gapFillersActive;
    setGapFillersActive(nextState);

    if (nextState && onAddCustomRecommendations) {
      // Actually push them to parent store
      onAddCustomRecommendations(GAP_FILLERS);
    }
  };

  // Convert current slider preferences (budget/time) to a user target point in -5 to +5 space
  const userTargetCoords = useMemo(() => {
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

    const budgetFactor = Math.min(1, Math.max(0, (budget - 100) / 400));
    ox = ox * 0.75 + (1 - budgetFactor) * 0.25;

    const timeFactor = Math.min(1, Math.max(0, (time - 2) / 46));
    oy = oy * 0.75 + timeFactor * 0.25;

    ox = Math.min(0.92, Math.max(0.08, ox));
    oy = Math.min(0.92, Math.max(0.08, oy));

    return {
      x: Math.round((ox - 0.5) * 10 * 10) / 10,
      y: Math.round((oy - 0.5) * 10 * 10) / 10,
    };
  }, [selectedCats, budget, time]);

  return (
    <div
      className="bg-white rounded-[32px] border border-border-main p-6 shadow-tactile text-left animate-fade-in relative overflow-hidden mt-6"
      id="mood-orb-grid-analyzer"
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-accent-teal font-black flex items-center gap-1.5 mb-1">
            <Grid size={12} className="text-accent-teal" />
            {language === "sr"
              ? "DIJAGNOSTIKA ORB POKRIVENOSTI"
              : language === "zh"
                ? "星轨仪覆盖诊断"
                : "ORB COVERAGE DIAGNOSTICS"}
          </span>
          <h3 className="text-lg font-serif text-brand-charcoal font-bold tracking-tight">
            {language === "sr"
              ? "Sistem 100 Kvadrata"
              : language === "zh"
                ? "100 格局微调诊断"
                : "100-Squares Precision Grid"}
          </h3>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1.5 rounded-full hover:bg-neutral-100 text-brand-charcoal/50 hover:text-brand-charcoal transition-colors"
          title="Show Grid Information"
        >
          <Info size={16} />
        </button>
      </div>

      {showInfo && (
        <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-border-main/60 mb-5 text-[11px] text-brand-charcoal/75 space-y-2 leading-relaxed">
          <p>
            {language === "sr"
              ? "Svemir raspoloženja (Mood Orb) je podeljen na koordinatnu mrežu 10x10 (od -5 do +5 po obe ose). Horizontalna osa predstavlja spektar urbanog komfora naspram divljine, dok vertikalna osa označava nivo adrenalina/tempa."
              : language === "zh"
                ? "情感星轨仪区域被细分为 10x10 的精密网络（双轴范围为 -5 至 +5）。横轴代表城市享乐与自然旷野的平衡，纵轴则代表感官节奏与探索强度的张力。"
                : "The Mood Orb space is divided into a 10x10 coordinate grid spanning -5 to +5 on both axes. The horizontal axis measures urban luxury vs wilderness, while the vertical axis represents adrenaline/tempo."}
          </p>
          <p>
            <strong>
              {language === "sr"
                ? "Pravilo blizine:"
                : language === "zh"
                  ? "邻近匹配原则："
                  : "Proximity Decaying Rule:"}
            </strong>{" "}
            {language === "sr"
              ? "Svaki kvadrat udaljenosti smanjuje procenat podudaranja za 5%. Da bismo postigli uvek optimalan predlog od 90%+ podudaranja, svaka tačka na koordinatnoj mreži mora imati kuraciju na rastojanju od maksimalno 2 kvadrata."
              : language === "zh"
                ? "每远离目标单元格一个格距，匹配度衰减 5%。为了确保在任意状态微调下均能获得 90% 以上的臻享匹配，网络中任一网格必须在 2 格距离内拥有至少一款专属策划。"
                : "Each square step away decays compatibility by 5%. To maintain an optimal >90% match globally, every square on the grid must have an experience within 2 units."}
          </p>
        </div>
      )}

      {/* Metrics Panel */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-[#FAF9F5] border border-border-main/50 px-3 py-2.5 rounded-2xl text-center">
          <p className="text-[8.5px] uppercase font-bold tracking-wider text-brand-charcoal/45 mb-0.5">
            {language === "sr"
              ? "PROSEČNA USKLAĐENOST"
              : language === "zh"
                ? "全局平均适配度"
                : "AVG COMPATIBILITY"}
          </p>
          <p className="text-xl font-mono font-black text-brand-charcoal">
            {analysis.averageMatch}%
          </p>
        </div>

        <div className="bg-[#FAF9F5] border border-border-main/50 px-3 py-2.5 rounded-2xl text-center">
          <p className="text-[8.5px] uppercase font-bold tracking-wider text-brand-charcoal/45 mb-0.5">
            {language === "sr"
              ? "OPTIMALNA POKRIVENOST"
              : language === "zh"
                ? "90%+ 完美覆盖率"
                : "OPTIMAL COVERAGE"}
          </p>
          <p
            className={`text-xl font-mono font-black ${analysis.coveragePercent >= 90 ? "text-[#2E7D32]" : "text-[#D32F2F]"}`}
          >
            {analysis.coveragePercent}%
          </p>
        </div>

        <div className="bg-[#FAF9F5] border border-border-main/50 px-3 py-2.5 rounded-2xl text-center">
          <p className="text-[8.5px] uppercase font-bold tracking-wider text-brand-charcoal/45 mb-0.5">
            {language === "sr"
              ? "BLIND TAČKE"
              : language === "zh"
                ? "覆盖盲点数"
                : "BLIND SPOTS"}
          </p>
          <p
            className={`text-xl font-mono font-black ${analysis.blindSpots.length === 0 ? "text-[#2E7D32]" : "text-accent-red"}`}
          >
            {analysis.blindSpots.length}
          </p>
        </div>
      </div>

      {/* Interactive Visualizer and Sidebar */}
      <div className="flex flex-col md:flex-row gap-5 items-center md:items-start">
        {/* 10x10 Grid representation in SVG */}
        <div className="relative bg-neutral-900 rounded-[24px] p-4 flex-shrink-0 w-full max-w-[280px] aspect-square shadow-inner flex items-center justify-center">
          <div className="absolute top-2 left-3 text-[8px] font-mono text-white/30 uppercase tracking-widest">
            {language === "sr"
              ? "Senzorna Mreža 10x10"
              : language === "zh"
                ? "10x10 感官坐标网"
                : "10x10 Sensory Net"}
          </div>

          <svg viewBox="0 0 220 220" className="w-full h-full select-none">
            {/* Axis grid lines */}
            <line
              x1="110"
              y1="10"
              x2="110"
              y2="210"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <line
              x1="10"
              y1="110"
              x2="210"
              y2="110"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* 100 Squares */}
            {gridSquares.map((sq, i) => {
              // Map matrix indices (0-9) to pixel coordinates (10 to 200)
              const cellX = 15 + sq.col * 19;
              const cellY = 15 + sq.row * 19;

              // Color based on match compatibility
              let fillColor = "rgba(211, 47, 47, 0.4)"; // Red under 80%
              if (sq.match >= 90) {
                fillColor = "rgba(46, 125, 50, 0.65)"; // Green >= 90%
              } else if (sq.match >= 80) {
                fillColor = "rgba(245, 124, 0, 0.5)"; // Amber 80-89%
              }

              // Highlight if active user target is currently inside this cell
              const isUserInside =
                Math.abs(sq.x - userTargetCoords.x) < 0.5 &&
                Math.abs(sq.y - userTargetCoords.y) < 0.5;

              return (
                <g key={`sq-${sq.row}-${sq.col}`}>
                  <rect
                    x={cellX}
                    y={cellY}
                    width="17"
                    height="17"
                    rx="3"
                    fill={fillColor}
                    className="transition-all duration-300 hover:brightness-125"
                  >
                    <title>{`${sq.closestTitle}\nCoords: [${sq.x}, ${sq.y}]\nMatch: ${sq.match}%`}</title>
                  </rect>
                  {isUserInside && (
                    <rect
                      x={cellX - 1.5}
                      y={cellY - 1.5}
                      width="20"
                      height="20"
                      rx="4"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* Render Curation Centroid markers */}
            {activeCurations.map((cur) => {
              // Convert coord to pixels
              // x from -5 to +5 -> pixels from 15 to 200
              const cx = 110 + cur.coords.x * 19;
              const cy = 110 - cur.coords.y * 19;

              return (
                <circle
                  key={`centroid-${cur.id}`}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill={cur.id.startsWith("gap-filler") ? "#E57373" : "#00E676"}
                  stroke="#121212"
                  strokeWidth="1"
                  className="animate-fade-in"
                >
                  <title>{`${cur.title} [${cur.coords.x}, ${cur.coords.y}]`}</title>
                </circle>
              );
            })}
          </svg>

          {/* Map legend overlay */}
          <div className="absolute bottom-2 right-3 flex items-center gap-2 text-[7.5px] font-mono text-white/40">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676]" />
              <span>Base</span>
            </div>
            {gapFillersActive && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E57373]" />
                <span>Gap Filler</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 border border-white/80 rounded-sm" />
              <span>User</span>
            </div>
          </div>
        </div>

        {/* Diagnostic details & Gap closer button */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h4 className="text-[11px] font-mono font-bold text-brand-charcoal/45 uppercase tracking-wider mb-2">
              {language === "sr"
                ? "STANJE DIJAGNOSTIKE"
                : language === "zh"
                  ? "诊断报告明细"
                  : "DIAGNOSTIC STATUS"}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-brand-charcoal/60">
                  {language === "sr"
                    ? "Pozicija korisnika:"
                    : language === "zh"
                      ? "当前心境星点:"
                      : "Current User Target:"}
                </span>
                <span className="font-mono font-bold text-accent-teal">
                  [{userTargetCoords.x}, {userTargetCoords.y}]
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-brand-charcoal/60">
                  {language === "sr"
                    ? "Zabeležene curacije:"
                    : language === "zh"
                      ? "可用专属策划数:"
                      : "Available Curations:"}
                </span>
                <span className="font-bold">{activeCurations.length}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-brand-charcoal/60">
                  {language === "sr"
                    ? "Zasićenost pokrivenosti:"
                    : language === "zh"
                      ? "全局理想覆合度:"
                      : "Global Coverage Fitness:"}
                </span>
                <span
                  className={`font-mono font-black ${analysis.coveragePercent >= 90 ? "text-[#2E7D32]" : "text-accent-red"}`}
                >
                  {analysis.coveragePercent}%{" "}
                  {analysis.coveragePercent >= 90 ? "✓ SECURE" : "⚠ WEAK"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button to close gaps */}
          <button
            onClick={handleToggleGapFillers}
            className={`w-full py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-[11px] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              gapFillersActive
                ? "bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/25 shadow-inner"
                : "bg-brand-charcoal text-white hover:bg-brand-charcoal/90 hover:scale-[1.01] shadow-md"
            }`}
          >
            {gapFillersActive ? (
              <>
                <Check size={14} className="text-[#2E7D32] animate-bounce" />
                <span>
                  {language === "sr"
                    ? "PRODUKCIJA OSLOBOĐENA SLEPIH TAČAKA"
                    : language === "zh"
                      ? "100% 理想盲区覆盖已启动"
                      : "100% GAP-FILLERS PROVISIONED"}
                </span>
              </>
            ) : (
              <>
                <Plus size={14} className="text-white" />
                <span>
                  {language === "sr"
                    ? "OTKLONI SLEPE TAČKE (+4 CURACIJE)"
                    : language === "zh"
                      ? "一键弥补体验盲区 (+4 奢华方案)"
                      : "CLOSE BLIND SPOTS (+4 CURATIONS)"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
