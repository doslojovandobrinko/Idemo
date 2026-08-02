import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  HelpCircle,
  Compass,
  Sliders,
  Info,
  Zap,
} from "lucide-react";
import { Category } from "../types";
import { safeStorage } from "../lib/safeStorage";

interface MoodOrbitPanelProps {
  language: string;
  budget: number;
  setBudget: (b: number) => void;
  time: number;
  setTime: (t: number) => void;
  selectedCats: Category[];
  setSelectedCats: (cats: Category[]) => void;
  triggerHaptic: (intensity: number) => void;
}

const CATEGORY_COORDS: Record<string, { x: number; y: number }> = {
  [Category.HISTORY]: { x: 0.55, y: 0.25 }, // Urban-leaning, slightly explorer
  [Category.NATURE]: { x: 0.85, y: 0.85 }, // Nature-leaning, high adventure
  [Category.GASTRONOMY]: { x: 0.15, y: 0.3 }, // Urban-leaning, high Hedonist
  [Category.CLUBBING]: { x: 0.3, y: 0.15 }, // Urban-leaning, high Hedonist
  [Category.WELLBEING]: { x: 0.2, y: 0.75 }, // Nature-leaning, high Hedonist
  [Category.TRAVEL]: { x: 0.75, y: 0.55 }, // Nature-leaning, adventure
  [Category.MEDICAL]: { x: 0.45, y: 0.45 }, // Central, slightly urban/hedonist
};

export function MoodOrbitPanel({
  language,
  budget,
  setBudget,
  time,
  setTime,
  selectedCats,
  setSelectedCats,
  triggerHaptic,
}: MoodOrbitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return safeStorage.getItem("idemo_mood_orbit_hint_dismissed") === "true";
    } catch {
      return false;
    }
  });

  // Calculate local coordinates (x, y) based on current external state
  const currentCoords = useMemo(() => {
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

    let x = count > 0 ? totalX / count : 0.5;
    let y = count > 0 ? totalY / count : 0.5;

    // Blend coordinates slightly with budget and time sliders to keep perfect 2-way sync
    const budgetFactor = Math.min(1, Math.max(0, (budget - 10) / 190)); // 0 to 1
    // High budget pulls left (Hedonist), low budget pulls right (Adventurer)
    x = x * 0.75 + (1 - budgetFactor) * 0.25;

    const timeFactor = Math.min(1, Math.max(0, (time - 2) / 46)); // 0 to 1
    // Long time available pulls down (Nature/Excursions), short time pulls up (Urban/Quick stops)
    y = y * 0.75 + timeFactor * 0.25;

    // Constrain to bounds [0.05, 0.95] to prevent orb going outside boundaries
    return {
      x: Math.min(0.92, Math.max(0.08, x)),
      y: Math.min(0.92, Math.max(0.08, y)),
    };
  }, [selectedCats, budget, time]);

  // Handle local dragging and map it directly to states
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    setIsDragging(true);
    triggerHaptic(15);

    if (!hintDismissed) {
      try {
        safeStorage.setItem("idemo_mood_orbit_hint_dismissed", "true");
      } catch (err) {
        console.error(err);
      }
      setHintDismissed(true);
    }

    updateCoordsFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    updateCoordsFromPointer(e);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      triggerHaptic(20);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener("pointerup", handleGlobalMouseUp);
    return () => window.removeEventListener("pointerup", handleGlobalMouseUp);
  }, [isDragging]);

  const updateCoordsFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    // Constrain
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));

    // Magnetic center snap
    const distanceToCenter = Math.hypot(x - 0.5, y - 0.5);
    if (distanceToCenter < 0.07) {
      x = 0.5;
      y = 0.5;
    }

    // Map x to Budget (0 is Hedonist/Lux, 1 is Adventurer/Budget)
    // Left (x=0) -> €200. Right (x=1) -> €20.
    const rawBudget = 200 - x * 180;
    const stepBudget =
      Math.round(Math.min(200, Math.max(10, rawBudget)) / 10) * 10;
    if (stepBudget !== budget) {
      setBudget(stepBudget);
      triggerHaptic(6);
    }

    // Map y to Time (0 is Urban/Short, 1 is Nature/Long)
    // Top (y=0) -> 2 hr. Bottom (y=1) -> 48 hr.
    const rawTime = 2 + y * 46;
    const stepTime = Math.round(Math.min(48, Math.max(2, rawTime)));
    if (stepTime !== time) {
      setTime(stepTime);
      triggerHaptic(5);
    }

    // Map position to nearest 3 categories
    const categoriesByProximity = Object.keys(CATEGORY_COORDS)
      .map((cat) => {
        const cCoords = CATEGORY_COORDS[cat];
        const dist = Math.hypot(cCoords.x - x, cCoords.y - y);
        return { cat: cat as Category, dist };
      })
      .sort((a, b) => a.dist - b.dist);

    // Get closest categories
    const topCats = categoriesByProximity.slice(0, 3).map((item) => item.cat);

    // Check if categories changed
    const isDifferent =
      topCats.length !== selectedCats.length ||
      topCats.some((c) => !selectedCats.includes(c));

    if (isDifferent && topCats.length > 0) {
      setSelectedCats(topCats);
      triggerHaptic(10);
    }
  };

  // Interpretations based on position coordinates
  const styleInterpretation = useMemo(() => {
    const { x, y } = currentCoords;
    const isSr = language === "sr";
    const isZh = language === "zh";

    if (x <= 0.4 && y <= 0.4) {
      return {
        style: isSr
          ? "Premium gradski hedonista"
          : isZh
            ? "至臻都市探索者"
            : "Premium Urban Hedonist",
        description: isSr
          ? "Prefinjena gastronomska i kulturna čuda."
          : isZh
            ? "探索精致的米其林餐饮与高雅文化殿堂。"
            : "Refined gastronomy and sophisticated cultural delights.",
        archetype: isSr
          ? "Biznis beg"
          : isZh
            ? "商务奢享客"
            : "Business Escape",
      };
    } else if (x > 0.6 && y <= 0.4) {
      return {
        style: isSr
          ? "Metropolitanski istraživač"
          : isZh
            ? "都市历史战略家"
            : "Metropolitan Explorer",
        description: isSr
          ? "Istorijske rute i autentična arhitektura grada."
          : isZh
            ? "深度品味贝尔格莱德的地道古迹与特色建筑。"
            : "Historic paths and authentic city architecture.",
        archetype: isSr
          ? "Kulturni strateg"
          : isZh
            ? "文化思想家"
            : "Cultural Strategist",
      };
    } else if (x <= 0.4 && y > 0.6) {
      return {
        style: isSr
          ? "Velnes eskapista"
          : isZh
            ? "自然康养隐居客"
            : "Wellness Escapist",
        description: isSr
          ? "Umirujući banjski rituali i spa utočišta."
          : isZh
            ? "置身于大自然疗愈怀抱，悦享惬意的水疗服务。"
            : "Calm sanctuary rituals and restorative spa escapes.",
        archetype: isSr
          ? "Spokojno utočište"
          : isZh
            ? "身心康养行"
            : "Mindful Sanctuary",
      };
    } else if (x > 0.6 && y > 0.6) {
      return {
        style: isSr
          ? "Aktivni avanturista"
          : isZh
            ? "户外探索家"
            : "Active Adventurer",
        description: isSr
          ? "Biciklizam, kajak i uzbudljivi prirodni predeli."
          : isZh
            ? "充满活力的野外健行、皮划艇与大自然骑行。"
            : "Cycling, kayaking, and wild scenic explorations.",
        archetype: isSr ? "Sportski beg" : isZh ? "自然探索" : "Wild Horizon",
      };
    } else {
      return {
        style: isSr
          ? "Balansirani putnik"
          : isZh
            ? "全能漫游家"
            : "Balanced Voyager",
        description: isSr
          ? "Usklađen spoj gradskog života i prirodnih lepota."
          : isZh
            ? "平衡都市历史底蕴与郊野自然风光的臻选路线。"
            : "A harmonized blend of urban culture and light nature.",
        archetype: isSr
          ? "Svestrani nomad"
          : isZh
            ? "全景旅行通票"
            : "Curated Voyager",
      };
    }
  }, [currentCoords, language]);

  // Format budget label
  const budgetLabel = useMemo(() => {
    if (budget >= 150)
      return language === "sr"
        ? "Premium / €" + budget
        : "Premium / €" + budget;
    if (budget >= 80)
      return language === "sr"
        ? "Umereno / €" + budget
        : "Moderate / €" + budget;
    return language === "sr"
      ? "Ekonomično / €" + budget
      : "Affordable / €" + budget;
  }, [budget, language]);

  // Format time label
  const timeLabel = useMemo(() => {
    const isSr = language === "sr";
    if (time <= 4)
      return isSr ? "Kratak obilazak (2-4 sata)" : "Brief stop (2-4 hours)";
    if (time <= 12)
      return isSr ? `Pola dana (${time} sati)` : `Half-day (${time} hours)`;
    if (time <= 24)
      return isSr ? `Ceo dan (${time} sata)` : `Full-day (${time} hours)`;
    return isSr ? `Višednevno (${time} sati)` : `Multi-day (${time} hours)`;
  }, [time, language]);

  // Size of the orb represents budget. Small (48px) -> Large (96px)
  const orbSize = useMemo(() => {
    const minSize = 48;
    const maxSize = 96;
    const budgetFactor = (budget - 10) / 190; // 0 to 1
    return minSize + budgetFactor * (maxSize - minSize);
  }, [budget]);

  // Time is visualized inside: Black fraction represents available time
  const timePercentage = useMemo(() => {
    return (time / 48) * 100;
  }, [time]);

  // Translations
  const text: Record<string, any> = {
    en: {
      section_title: "The Mood Orbit",
      section_subtitle: "Flagship Adaptive Calibration",
      axis_urban: "Urban",
      axis_nature: "Nature",
      axis_hedonist: "Hedonist",
      axis_adventurer: "Adventurer",
      today_style: "Today's Style",
      budget: "Budget Limit",
      available_time: "Available Time",
      explorer_style: "Discovery Profile",
      hint: "Move the orb to match today's mood.",
    },
    sr: {
      section_title: "Senzor raspoloženja",
      section_subtitle: "Glavna adaptivna kalibracija",
      axis_urban: "Grad",
      axis_nature: "Priroda",
      axis_hedonist: "Hedonizam",
      axis_adventurer: "Avantura",
      today_style: "Današnji stil",
      budget: "Budžet",
      available_time: "Raspoloživo vreme",
      explorer_style: "Profil istraživanja",
      hint: "Pomeraj krug da prilagodiš današnje raspoloženje.",
    },
  };

  const t = text[language] || text["en"];

  return (
    <div className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-[32px] p-5 shadow-tactile relative overflow-hidden flex flex-col gap-4">
      {/* Visual background rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-[#D5D3C8]/20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full border border-dashed border-[#D5D3C8]/40 pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start z-10">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
            <p className="text-[9px] uppercase tracking-[0.25em] text-[#5C5A4D] font-black">
              {t.section_subtitle}
            </p>
          </div>
          <h3 className="text-lg font-serif text-brand-charcoal font-bold">
            {t.section_title}
          </h3>
        </div>
        <div className="p-2 rounded-full bg-white border border-[#D5D3C8] text-accent-teal hover:bg-brand-pearl cursor-help transition-all">
          <Compass size={14} className="animate-spin-slow" />
        </div>
      </div>

      {/* 2D Interaction Area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full aspect-square relative bg-white border border-[#D5D3C8] rounded-[24px] overflow-hidden select-none touch-none cursor-crosshair z-10 transition-all ${
          isDragging
            ? "shadow-inner bg-[#FAF9F5]/40 border-accent-teal/40"
            : "shadow-xs hover:border-[#BEBBB2]"
        }`}
      >
        {/* Grid lines and central crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-[#D5D3C8]/40" />
          <div className="absolute h-full w-[1px] bg-[#D5D3C8]/40" />
        </div>

        {/* Diagonal axis reference marks */}
        <div className="absolute inset-4 rounded-full border border-dashed border-[#D5D3C8]/25 pointer-events-none" />

        {/* Grid labels at edges */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.15em] text-brand-charcoal/50 select-none pointer-events-none">
          {t.axis_urban} ↑
        </div>
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.15em] text-brand-charcoal/50 select-none pointer-events-none">
          ↓ {t.axis_nature}
        </div>
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[0.15em] text-brand-charcoal/50 select-none pointer-events-none origin-center -rotate-90">
          ← {t.axis_hedonist}
        </div>
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-[0.15em] text-brand-charcoal/50 select-none pointer-events-none origin-center rotate-90">
          {t.axis_adventurer} →
        </div>

        {/* Subtle First Launch Hint Overlay */}
        <AnimatePresence>
          {!hintDismissed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-charcoal/5 backdrop-blur-[1px] flex flex-col items-center justify-center p-6 text-center pointer-events-none z-20"
            >
              <div className="bg-white/95 border border-[#D5D3C8] rounded-2xl p-3 shadow-md space-y-1 max-w-[190px]">
                <div className="flex justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-5 h-5 rounded-full bg-accent-teal/20 flex items-center justify-center text-accent-teal"
                  >
                    <Zap size={10} />
                  </motion.div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-charcoal">
                  {t.hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Flagship Interactive Orb */}
        <motion.div
          animate={{
            left: `${currentCoords.x * 100}%`,
            top: `${currentCoords.y * 100}%`,
            width: orbSize,
            height: orbSize,
          }}
          transition={{
            type: "spring",
            stiffness: isDragging ? 400 : 150,
            damping: isDragging ? 35 : 20,
            mass: 0.8,
          }}
          style={{
            transform: "translate(-50%, -50%)",
          }}
          className={`absolute rounded-full shadow-lg border border-white/60 flex items-center justify-center cursor-pointer pointer-events-none transition-shadow ${
            isDragging ? "shadow-accent-teal/20 shadow-2xl scale-105" : ""
          }`}
        >
          {/* Visual Conic Gradient representing Budget vs Time split */}
          {/* Black slice represent time. Rose red represents budget. */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-300 overflow-hidden"
            style={{
              background: `conic-gradient(#090D16 0% ${timePercentage}%, #E11D48 ${timePercentage}% 100%)`,
            }}
          />

          {/* Premium Glassmorphic Overlay Gloss with white radial gradients */}
          <div className="absolute inset-[1px] rounded-full bg-gradient-to-tr from-transparent via-white/10 to-white/30 mix-blend-overlay" />

          {/* Inner ambient glow ring */}
          <div className="absolute inset-[3px] rounded-full border border-white/15 pointer-events-none mix-blend-screen" />

          {/* Active indicator dot at exact center */}
          <div
            className={`w-2 h-2 rounded-full bg-white transition-all duration-300 shadow-sm ${isDragging ? "scale-125" : "scale-100"}`}
          />

          {/* Interactive feedback soft outer aura ring */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.15, scale: 1.3 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 rounded-full bg-accent-teal"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Live Interpretation Summary Panel below Orb */}
      <div className="bg-white rounded-[24px] border border-[#D5D3C8] p-4 space-y-3 z-10 select-none">
        <div className="flex justify-between items-center border-b border-[#FAF9F5] pb-2.5">
          <div className="space-y-0.5">
            <span className="text-[8.5px] uppercase tracking-[0.2em] text-[#8C8A7D] font-black">
              {t.today_style}
            </span>
            <h4 className="font-serif font-black text-base text-brand-charcoal leading-none tracking-tight">
              {styleInterpretation.archetype}
            </h4>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest leading-none">
            {styleInterpretation.style}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <div className="bg-[#FAF9F5] border border-[#D5D3C8]/40 p-2.5 rounded-xl">
            <span className="text-[8.5px] uppercase tracking-wider text-[#8C8A7D] font-black block mb-0.5">
              💰 {t.budget}
            </span>
            <span className="text-[12px] font-black text-brand-charcoal">
              {budgetLabel}
            </span>
          </div>

          <div className="bg-[#FAF9F5] border border-[#D5D3C8]/40 p-2.5 rounded-xl">
            <span className="text-[8.5px] uppercase tracking-wider text-[#8C8A7D] font-black block mb-0.5">
              ⏱️ {t.available_time}
            </span>
            <span className="text-[12px] font-black text-brand-charcoal truncate block">
              {timeLabel}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-accent-teal/5 border border-accent-teal/10 rounded-xl flex gap-2 items-start">
          <Info size={13} className="text-accent-teal shrink-0 mt-0.5" />
          <p className="text-[11px] text-brand-charcoal/80 font-medium leading-relaxed">
            {styleInterpretation.description}
          </p>
        </div>
      </div>
    </div>
  );
}
