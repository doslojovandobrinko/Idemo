import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Sliders, Shield, Zap, Info, ChevronLeft, ChevronRight, Check, Clock, Coins, Target, Building2, TreePine, Wine, Footprints } from 'lucide-react';
import { safeStorage } from '../lib/safeStorage';
import { ONBOARDING_TRANSLATIONS } from './OnboardingOverlay';

export interface MoodOrbitProps {
  /**
   * Current horizontal coordinate on the 2D field.
   * Range [0, 1]. 0 = Hedonist (Left), 1 = Adventurer (Right).
   */
  x?: number;
  /**
   * Current vertical coordinate on the 2D field.
   * Range [0, 1]. 0 = Urban (Top), 1 = Nature (Bottom).
   */
  y?: number;
  /**
   * Current budget limit value.
   * Range [100, 500].
   */
  budget?: number;
  /**
   * Current available time in hours.
   * Range [4, 48].
   */
  time?: number;
  /**
   * Active interaction mode: 'move' (Mood), 'resize' (Budget), or 'rotate' (Time).
   */
  activeMode?: 'move' | 'resize' | 'rotate';
  /**
   * Callback fired when any of the parameters change.
   */
  onChange?: (x: number, y: number, budget: number, time: number) => void;
  /**
   * Optional custom callback to trigger physical device haptics.
   */
  onHaptic?: (intensity: number) => void;
  /**
   * Language code ('sr', 'zh', 'en'). Defaults to 'en'.
   */
  language?: string;
  /**
   * The live style/archetype name of the Today's Concierge card to show on calibration.
   */
  conciergeStyleName?: string;
  /**
   * Fired when the Today's Concierge card is clicked to delegate modal showing.
   */
  onSelectConcierge?: () => void;
  /**
   * Optional callback to open exact fine-tuning sliders section.
   */
  onOpenFineTuning?: () => void;
}

// Fixed Travel Duration Snaps (Magnetic Detents)
const SNAP_TIMES = [4, 8, 12, 24, 28, 48];
const SNAP_ANGLES = [0, 60, 120, 180, 240, 300];

// Get snapped time interval helper
const getSnappedTime = (time: number) => {
  let closest = SNAP_TIMES[0];
  let minDiff = Infinity;
  for (const t of SNAP_TIMES) {
    const diff = Math.abs(time - t);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }
  return closest;
};

// Dynamic matching archetypes in MoodOrbit Space for continuous score calibration
const MO_ARCHETYPES = [
  { id: 'cultural_strategist', name: { en: 'Cultural Strategist', sr: 'Kulturni strateg', zh: '文化思想家' }, budget: 281, time: 12 },
  { id: 'wellness_escapist', name: { en: 'Wellness Escapist', sr: 'Velnes eskapista', zh: '康养避世客' }, budget: 408, time: 18 },
  { id: 'culinary_explorer', name: { en: 'Culinary Explorer', sr: 'Kulinarski istraživač', zh: '美食品鉴家' }, budget: 218, time: 6 },
  { id: 'active_naturalist', name: { en: 'Active Urban Naturalist', sr: 'Aktivni urbani naturalista', zh: '活力都市健行者' }, budget: 134, time: 9 },
  { id: 'legacy_family', name: { en: 'Legacy Family Traveler', sr: 'Porodični putnik', zh: '合家观光客' }, budget: 324, time: 8 }
];

export default function MoodOrbit({
  x: propX = 0.5,
  y: propY = 0.5,
  budget: propBudget = 100,
  time: propTime = 24,
  activeMode,
  onChange,
  onHaptic,
  language = 'en',
  conciergeStyleName,
  onSelectConcierge,
  onOpenFineTuning
}: MoodOrbitProps) {
  // Local state representing coordinates, budget and time
  const [localX, setLocalX] = useState(propX);
  const [localY, setLocalY] = useState(propY);
  const [localBudget, setLocalBudget] = useState(propBudget);
  const [localTime, setLocalTime] = useState(propTime);

  const isSr = language === 'sr';
  const isZh = language === 'zh';
  const onboardingCard0 = (ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS.en).cards[0];

  // Gestures active tracking
  const [activeGesture, setActiveGesture] = useState<'position' | 'budget' | 'time' | null>(null);

  // Advanced synchronization tracking system to prevent snapping back
  const lastSyncedPropX = useRef(propX);
  const lastSyncedPropY = useRef(propY);
  const lastSyncedPropBudget = useRef(propBudget);
  const lastSyncedPropTime = useRef(propTime);

  // Keep track of whether we are in an active dragging gesture (or have recently finished one)
  const isDraggingRef = useRef(false);
  const dragEndingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manage dragging states and provide a smooth, premium cooldown buffer (800ms) to absorb parent updates
  useEffect(() => {
    if (activeGesture !== null) {
      isDraggingRef.current = true;
      if (dragEndingTimeoutRef.current) {
        clearTimeout(dragEndingTimeoutRef.current);
        dragEndingTimeoutRef.current = null;
      }
    } else {
      dragEndingTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
      }, 800);
    }
    return () => {
      if (dragEndingTimeoutRef.current) {
        clearTimeout(dragEndingTimeoutRef.current);
      }
    };
  }, [activeGesture]);

  // Handle external prop changes while completely ignoring self-induced drag feedback
  useEffect(() => {
    if (isDraggingRef.current) {
      lastSyncedPropX.current = propX;
      lastSyncedPropY.current = propY;
      lastSyncedPropBudget.current = propBudget;
      lastSyncedPropTime.current = propTime;
      return;
    }

    const changedX = propX !== lastSyncedPropX.current;
    const changedY = propY !== lastSyncedPropY.current;
    const changedBudget = propBudget !== lastSyncedPropBudget.current;
    const changedTime = propTime !== lastSyncedPropTime.current;

    if (changedX || changedY || changedBudget || changedTime) {
      if (changedX) {
        setLocalX(propX);
        lastSyncedPropX.current = propX;
      }
      if (changedY) {
        setLocalY(propY);
        lastSyncedPropY.current = propY;
      }
      if (changedBudget) {
        setLocalBudget(propBudget);
        lastSyncedPropBudget.current = propBudget;
      }
      if (changedTime) {
        setLocalTime(propTime);
        lastSyncedPropTime.current = propTime;
      }
    }
  }, [propX, propY, propBudget, propTime]);
  
  // Accessibility panel toggle
  const [showAccessibility, setShowAccessibility] = useState(false);

  // Long press timer ref for opening accessibility panel
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reference elements for pointer tracker relative calculations
  const fieldRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  // Multi-dimensional gesture continuous ref records
  const gestureState = useRef({
    startX: 0,
    startY: 0,
    startOrbX: 0.5,
    startOrbY: 0.5,
    startBudget: 240,
    startDistance: 100,
    startAngle: 0,
    startTime: 6
  });

  // Liquid divider organic physics state (underdamped spring oscillator)
  const [wiggle, setWiggle] = useState(0);
  const wiggleVelocity = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const prevTimeValue = useRef(propTime);

  // Trigger premium tactile profiles based on interaction confidence
  const triggerHapticProxy = (intensity: number) => {
    if (onHaptic) {
      onHaptic(intensity);
    } else if (navigator.vibrate) {
      navigator.vibrate(intensity);
    }
  };

  // Liquid slosh physics engine loop
  useEffect(() => {
    let animId: number;
    const stiffness = 160; // snappy organic response
    const damping = 22;    // high resistance damping so it settles quickly and cleanly

    const updatePhysics = () => {
      const now = Date.now();
      const dt = Math.min(0.032, (now - lastTimeRef.current) / 1000); // capped step
      lastTimeRef.current = now;

      // Spring acceleration towards zero resting position
      const springForce = -stiffness * wiggle;
      wiggleVelocity.current += springForce * dt;
      wiggleVelocity.current *= (1 - damping * dt); // decay velocity

      const nextWiggle = wiggle + wiggleVelocity.current * dt;

      // Settle thresholds to kill infinite float rendering
      if (Math.abs(nextWiggle) < 0.02 && Math.abs(wiggleVelocity.current) < 0.02) {
        setWiggle(0);
        wiggleVelocity.current = 0;
      } else {
        setWiggle(nextWiggle);
      }
      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [wiggle]);

  // Trigger liquid slosh when time value is dialed
  useEffect(() => {
    if (localTime !== prevTimeValue.current) {
      const diff = localTime - prevTimeValue.current;
      wiggleVelocity.current += diff * 12; // transfer spin velocity to slosh wiggle
      prevTimeValue.current = localTime;
    }
  }, [localTime]);

  // Handle translation files
  const t = useMemo(() => {
    const translations: Record<string, any> = {
      en: {
        title: "Mood Orbit™",
        subtitle: "Premium Quadrant & Sensory Calibration",
        axisUrban: "Urban",
        axisNature: "Nature",
        axisHedonist: "Hedonist",
        axisAdventurer: "Adventurer",
        tipPosition: "Drag CENTER CORE to move quadrant",
        tipBudget: "Pull RADIAL EDGE to scale budget",
        tipTime: "Dial OUTER RING to wind hours",
        calibrated: "CALIBRATED",
        privacy: "100% Cryptographic Local Engine",
        privacyDesc: "Sensory state stays completely stored on your terminal.",
        ringHint: "Rotate ring to adjust available travel time",
        excellent: "Excellent Match",
        veryStrong: "Very Strong Match",
        strong: "Strong Match",
        good: "Good Match",
        confidence: "Recommendation Confidence",
        manualTitle: "Manual Adjustment Panel",
        close: "Done",
        longPressTip: "HOLD CENTRE TO FINE-TUNE",
        heartOfConcierge: "Mood Orbit is the heart of your concierge.",
        alignedToMood: "Every recommendation is aligned to your mood, budget and time.",
        flowMoodOrbit: "Mood Orbit",
        flowLiveProfile: "Live Profile",
        flowRecommendations: "Recommendations",
        flowItinerary: "Itinerary",
        guideBtn: "✨ Interactive Guide",
        guideTitle: "Calibration Tutorial",
        guideStep0: "1. AVAILABLE TIME (Ring): Click and drag clockwise around the outermost bezel track to wind your travel hours (4 to 48 hours), auto-adjusting daily itineraries.",
        guideStep1: "2. BUDGET LIMIT (Bezel): Drag outward or inward on the inner dial area to scale your budget limit (€50 - €450). The luxury watch physically scales to match!",
        guideStep2: "3. TRAVEL VIBE (Center): Drag the watch core in any direction on the grid to change your mood quadrant (e.g. Nature/Urban, Adventure/Hedonist) and update recommendations instantly.",
        next: "Next",
        prev: "Back",
        finish: "EXPLORE - IDEMO"
      },
      sr: {
        title: "Senzor Orbita™",
        subtitle: "Premium kvadrant i senzorna kalibracija",
        axisUrban: "Grad",
        axisNature: "Priroda",
        axisHedonist: "Hedonista",
        axisAdventurer: "Avanturista",
        tipPosition: "Prevuci CENTAR za promenu kvadranta",
        tipBudget: "Povuci RADIALNU IVICU za promenu budžeta",
        tipTime: "Okreći SPOLJNI PRSTEN za promenu vremena",
        calibrated: "KALIBRISANO",
        privacy: "100% Kriptografski lokalni rad",
        privacyDesc: "Senzorno stanje ostaje isključivo na vašem uređaju.",
        ringHint: "Okrećite prsten za podešavanje vremena",
        excellent: "Izuzetan spoj",
        veryStrong: "Veoma jak spoj",
        strong: "Snažan spoj",
        good: "Dobar spoj",
        confidence: "Pouzdanost preporuke",
        manualTitle: "Ručni kontrolni panel",
        close: "Gotovo",
        longPressTip: "Zadržite centar za ručni unos",
        heartOfConcierge: "Senzor Orbita je srce vašeg konsijerža.",
        alignedToMood: "Svaka preporuka je usklađena sa vašim raspoloženjem, budžetom i vremenom.",
        flowMoodOrbit: "Orbita",
        flowLiveProfile: "Uživo profil",
        flowRecommendations: "Preporuke",
        flowItinerary: "Plan puta",
        guideBtn: "✨ Interaktivni vodič",
        guideTitle: "Vodič za kalibraciju",
        guideStep0: "1. VREME (Prsten): Prevlačite kružno oko najudaljenijeg prstena sata da podesite sate puta (4-48h). Ovo automatski prilagođava trajanje plana puta.",
        guideStep1: "2. BUDŽET (Brojčanik): Prevucite ka spolja/unutra središnju zonu da podesite budžet (€50-€450). Brojčanik sata se fizički širi ili smanjuje!",
        guideStep2: "3. KOORDINATE (Središte): Prevucite krunicu sata u bilo kom smeru. Ovo kalibriše vaše raspoloženje (Priroda/Grad, Hedonizam/Avantura) i odmah ažurira sve preporuke.",
        next: "Sledeće",
        prev: "Nazad",
        finish: "ISTRAŽI - IDEMO"
      },
      zh: {
        title: "心情星轨™",
        subtitle: "高端四象限感官校准控制器",
        axisUrban: "都市历史",
        axisNature: "荒野自然",
        axisHedonist: "奢华享乐",
        axisAdventurer: "极限探索",
        tipPosition: "拖动 【中央圆环】 以改变空间象限",
        tipBudget: "向外或向内 【拉伸圆球】 以调整预算",
        tipTime: "沿 【外围轨环】 顺时针拨动以调整时间",
        calibrated: "已精准标定",
        privacy: "100% 本地端侧计算保护",
        privacyDesc: "偏好计算与感官指标完全在您的安全终端上运行。",
        ringHint: "旋转外侧旋钮以调整行程可用时间",
        excellent: "完美匹配",
        veryStrong: "高度契合",
        strong: "实力推荐",
        good: "理想选择",
        confidence: "推荐方案匹配度",
        manualTitle: "精准手动标定器",
        close: "完成",
        longPressTip: "长按中心圆点以开启手动控制面板",
        heartOfConcierge: "心情星轨是您专属管家的核心。",
        alignedToMood: "每一项推荐均完美契合您的即时氛围、专属预算和可用时间。",
        flowMoodOrbit: "心情星轨",
        flowLiveProfile: "实时画像",
        flowRecommendations: "专属推荐",
        flowItinerary: "定制行程",
        guideBtn: "✨ 互动玩转指南",
        guideTitle: "互动式罗盘指南",
        guideStep0: "1. 专属时间（外圈）：沿最外圈轨道顺时针旋转，即可调节行程可用小时数（4-48小时），动态计算与填充您的单日行程图谱。",
        guideStep1: "2. 预算极限（内圈）：在其中段区域向外拉伸或向内收缩，即可调节行旅预算上限（€50-€450）。表壳将随其档次优雅进行等比缩放！",
        guideStep2: "3. 探索偏好（中心）：在雷达图上拖拽表壳中心。这会即时调整您的旅行偏好（如自然/都市，探索/享乐）并实时刷新个性化定制推荐。",
        next: "下一步",
        prev: "上一步",
        finish: "探索 - IDEMO"
      }
    };
    return translations[language] || translations['en'];
  }, [language]);

  // Non-linear continuous budget mapping curves
  const computeBudgetFromS = (s: number) => {
    // Power curve yields ultra high-precision in lower tiers (€50 - €200)
    return Math.round((50 + 400 * Math.pow(s, 1.5)) / 10) * 10;
  };

  const computeSFromBudget = (b: number) => {
    return Math.pow((b - 100) / 400, 1 / 1.5);
  };

  // Orb Diameter based on budget size - doubled maximum rendered diameter on Profile
  const orbDiameter = useMemo(() => {
    const ratio = (localBudget - 100) / 400;
    // Preserves 68px minimum at €100, reaching 212px at €500 (doubled from previous 106px maximum)
    return Math.max(68, 68 + ratio * 144);
  }, [localBudget]);

  // Titanium outer bezel width matching Intro Card 1
  const outerBezelWidth = useMemo(() => {
    const ratio = (localBudget - 100) / 400;
    return 8 + ratio * 4;
  }, [localBudget]);

  // Measure field width for safe visual boundary clamping without mutating normalized mood coordinates
  const [fieldWidth, setFieldWidth] = useState(340);
  useEffect(() => {
    if (!fieldRef.current) return;
    const updateWidth = () => {
      if (fieldRef.current) {
        const w = fieldRef.current.getBoundingClientRect().width;
        if (w > 0) setFieldWidth(w);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Visual boundary handling: keep the orb strictly within the field at every permitted size and position,
  // without mutating the underlying normalized mood coordinates (localX, localY).
  const visualMargin = (orbDiameter / 2 + 2) / (fieldWidth || 340);
  const visualMin = Math.min(0.5, visualMargin);
  const visualMax = Math.max(0.5, 1 - visualMargin);
  const visualX = Math.max(visualMin, Math.min(visualMax, localX));
  const visualY = Math.max(visualMin, Math.min(visualMax, localY));

  // Synchronize time value directly to polar angle coordinates
  const computeAngleFromTime = (time: number) => {
    for (let i = 0; i < SNAP_TIMES.length - 1; i++) {
      if (time >= SNAP_TIMES[i] && time <= SNAP_TIMES[i + 1]) {
        const t = (time - SNAP_TIMES[i]) / (SNAP_TIMES[i + 1] - SNAP_TIMES[i]);
        return SNAP_ANGLES[i] + t * (SNAP_ANGLES[i + 1] - SNAP_ANGLES[i]);
      }
    }
    return 300; // max angle
  };

  const computeTimeFromAngle = (angle: number) => {
    // Map angle back to snapped travel durations
    let rawAngle = angle;
    if (rawAngle < 0) rawAngle += 360;
    
    // Find closest snap indices
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < SNAP_ANGLES.length; i++) {
      let diff = Math.abs(rawAngle - SNAP_ANGLES[i]);
      if (diff > 180) diff = 360 - diff;
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    return {
      timeValue: SNAP_TIMES[closestIndex],
      snapAngle: SNAP_ANGLES[closestIndex],
      diff: minDiff
    };
  };

  // Calculated visual magnetic dial rotation angle
  const visualAngle = useMemo(() => {
    const rawAngle = computeAngleFromTime(localTime);
    // Return snapped visual angle directly to present discrete magnetic states elegantly
    return rawAngle;
  }, [localTime]);

  // Compute live match confidence scoring relative to active archetypes
  const confidenceScore = useMemo(() => {
    let minDistance = Infinity;
    MO_ARCHETYPES.forEach(arch => {
      // Scale differences between [0, 1] relative to domain limits
      const dBudget = Math.abs(localBudget - arch.budget) / 400;
      const dTime = Math.abs(localTime - arch.time) / 44;
      const dist = Math.hypot(dBudget, dTime);
      if (dist < minDistance) minDistance = dist;
    });

    const maxDistance = 0.58; // maximum plausible workspace distance
    const percentage = Math.round(Math.max(48, Math.min(99, (1 - minDistance / maxDistance) * 100)));
    return percentage;
  }, [localBudget, localTime]);

  const confidenceRating = useMemo(() => {
    if (confidenceScore >= 88) return { label: t.excellent, color: 'text-rose-600 bg-rose-50 border-rose-200/50', dots: 4, glow: 'shadow-rose-500/10 border-rose-500/40' };
    if (confidenceScore >= 75) return { label: t.veryStrong, color: 'text-amber-600 bg-amber-50 border-amber-200/50', dots: 3, glow: 'shadow-amber-500/10 border-amber-500/30' };
    if (confidenceScore >= 60) return { label: t.strong, color: 'text-yellow-600 bg-yellow-50 border-yellow-200/50', dots: 2, glow: 'shadow-yellow-500/10 border-yellow-500/30' };
    return { label: t.good, color: 'text-emerald-600 bg-emerald-50 border-emerald-200/50', dots: 1, glow: 'shadow-emerald-500/10 border-emerald-500/20' };
  }, [confidenceScore, t]);

  // Upright Centroid geometry coordinates so texts remain fully readable inside segments
  const centroids = useMemo(() => {
    const radB = ((visualAngle - 90) * Math.PI) / 180;
    const radT = ((visualAngle + 90) * Math.PI) / 180;
    
    // Offset texts safely away from the curved liquid divider line
    const dist = 48;

    return {
      budgetX: dist * Math.cos(radB),
      budgetY: dist * Math.sin(radB),
      timeX: dist * Math.cos(radT),
      timeY: dist * Math.sin(radT)
    };
  }, [visualAngle]);

  // Map budget range [100, 500] to [0, 360] degrees for the chronograph minute hand rotation
  const budgetAngle = useMemo(() => {
    return ((localBudget - 100) / 400) * 360;
  }, [localBudget]);

  // Dynamic travel recommendations summary interpretation
  const liveInterpretation = useMemo(() => {
    const isSr = language === 'sr';
    const isZh = language === 'zh';

    if (localX <= 0.45 && localY <= 0.45) {
      return {
        tag: isSr ? "GRADSKI HEDONISTA" : isZh ? "都市臻奢派" : "METROPOLIS HEDONIST",
        desc: isSr ? "Maksimalan komfor, izuzetna kuhinja i kulturni prefinjeni ugođaji." : isZh ? "追寻极致的米其林美食品鉴、高奢沙龙与精品艺术博览。" : "Highest tier comfort, fine gastronomy, and tailored private gallery spaces."
      };
    } else if (localX > 0.55 && localY <= 0.45) {
      return {
        tag: isSr ? "KULTURNI ISTRAŽIVAČ" : isZh ? "历史漫游者" : "CULTURAL STRATEGIST",
        desc: isSr ? "Temeljne pešačke rute, muzejske riznice i skriveni istorijski kutci." : isZh ? "深度穿梭于地标性历史名胜、古旧书店与巴洛克街区。" : "Detailed heritage exploration, historic architecture, and local archives."
      };
    } else if (localX <= 0.45 && localY > 0.55) {
      return {
        tag: isSr ? "OAZA SPOKOJA" : isZh ? "林野康养行" : "WELLNESS SANCTUARY",
        desc: isSr ? "Umirujući banjski rituali, organska hrana i rehabilitujući spa tretmani." : isZh ? "置身山野私汤，呼吸天然负氧离子，舒展疲惫的身心。" : "Curated thermal therapy, organic gardens, and regenerative sensory silence."
      };
    } else if (localX > 0.55 && localY > 0.55) {
      return {
        tag: isSr ? "AVANTURISTA NA TERENU" : isZh ? "荒野拓荒先锋" : "WILD HORIZON EXPLORER",
        desc: isSr ? "Adrenalinske rute, brdski biciklizam i savladavanje prirodnih staza." : isZh ? "充满热血的峭壁徒步、江河漂流与原生态露营探险。" : "Off-grid mountain biking, custom river kayaking, and scenic challenges."
      };
    } else {
      return {
        tag: isSr ? "BALANSIRANI NOMAD" : isZh ? "全能探索官" : "BALANCED VOYAGER",
        desc: isSr ? "Sinergija prirodnog sklada i rafinirane gradske dinamike." : isZh ? "在热闹繁荣的都会社区与宁静深幽的旷野山川间寻找黄金平衡点。" : "Optimal harmony connecting premium social spots and untouched nature."
      };
    }
  }, [localX, localY, language]);

  const isCultural = useMemo(() => {
    const activeTag = conciergeStyleName || liveInterpretation.tag;
    return activeTag.toLowerCase().includes('cultural') || activeTag.toLowerCase().includes('kulturn');
  }, [conciergeStyleName, liveInterpretation.tag]);

  // Pointer interaction down handlers for multi-gestures
  const handlePositionStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!fieldRef.current) return;
    
    setActiveGesture('position');
    triggerHapticProxy(12);

    gestureState.current = {
      ...gestureState.current,
      startX: e.clientX,
      startY: e.clientY,
      startOrbX: localX,
      startOrbY: localY
    };

    // Long press detector for accessibility fallback panel
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
    longPressTimeout.current = setTimeout(() => {
      setShowAccessibility(true);
      triggerHapticProxy(35); // distinct long-press pulse
    }, 700);
  };

  const handleBudgetStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!orbRef.current) return;

    const rect = orbRef.current.getBoundingClientRect();
    const orbCenterX = rect.left + rect.width / 2;
    const orbCenterY = rect.top + rect.height / 2;

    const initialDistance = Math.hypot(e.clientX - orbCenterX, e.clientY - orbCenterY);
    if (initialDistance === 0) return;

    setActiveGesture('budget');
    triggerHapticProxy(14);

    gestureState.current = {
      ...gestureState.current,
      startX: e.clientX,
      startY: e.clientY,
      startDistance: initialDistance,
      startBudget: localBudget
    };
  };

  const handleTimeStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!orbRef.current) return;

    const rect = orbRef.current.getBoundingClientRect();
    const orbCenterX = rect.left + rect.width / 2;
    const orbCenterY = rect.top + rect.height / 2;

    const initialAngle = Math.atan2(e.clientY - orbCenterY, e.clientX - orbCenterX) * (180 / Math.PI);

    setActiveGesture('time');
    triggerHapticProxy(15);

    gestureState.current = {
      ...gestureState.current,
      startX: e.clientX,
      startY: e.clientY,
      startAngle: initialAngle,
      startTime: localTime
    };
  };

  // Pointer movement tracking loop
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      if (!activeGesture) return;

      // Cancel long press sequence if mouse drifts significantly
      if (activeGesture === 'position') {
        const dx = Math.abs(e.clientX - gestureState.current.startX);
        const dy = Math.abs(e.clientY - gestureState.current.startY);
        if ((dx > 10 || dy > 10) && longPressTimeout.current) {
          clearTimeout(longPressTimeout.current);
        }
      }

      if (activeGesture === 'position' && fieldRef.current) {
        const rect = fieldRef.current.getBoundingClientRect();
        const dx = e.clientX - gestureState.current.startX;
        const dy = e.clientY - gestureState.current.startY;

        // Apply a high-precision, premium weighted damping factor (0.55) to make dragging
        // feel exceptionally smooth, deliberate, stable, and tactile, matching high-end mechanical instruments
        const dampingFactor = 0.55;
        let computedX = gestureState.current.startOrbX + (dx / rect.width) * dampingFactor;
        let computedY = gestureState.current.startOrbY + (dy / rect.height) * dampingFactor;

        // Magnetized center alignment snaps
        if (Math.abs(computedX - 0.5) < 0.035) computedX = 0.5;
        if (Math.abs(computedY - 0.5) < 0.035) computedY = 0.5;

        // Elastic overscroll simulation: resist dragging beyond standard boundaries [0.08, 0.92]
        const minBound = 0.08;
        const maxBound = 0.92;

        let finalX = computedX;
        let finalY = computedY;

        if (computedX < minBound) {
          finalX = minBound - (minBound - computedX) * 0.35; // compressive resistance
        } else if (computedX > maxBound) {
          finalX = maxBound + (computedX - maxBound) * 0.35;
        }

        if (computedY < minBound) {
          finalY = minBound - (minBound - computedY) * 0.35;
        } else if (computedY > maxBound) {
          finalY = maxBound + (computedY - maxBound) * 0.35;
        }

        setLocalX(finalX);
        setLocalY(finalY);
        triggerHapticProxy(4);

        // Clip actual trigger values so background remains calibrated
        const triggerX = Math.min(maxBound, Math.max(minBound, finalX));
        const triggerY = Math.min(maxBound, Math.max(minBound, finalY));
        if (onChange) onChange(triggerX, triggerY, localBudget, localTime);
      }

      else if (activeGesture === 'budget' && orbRef.current) {
        const rect = orbRef.current.getBoundingClientRect();
        const orbCenterX = rect.left + rect.width / 2;
        const orbCenterY = rect.top + rect.height / 2;

        let currentDistance = Math.hypot(e.clientX - orbCenterX, e.clientY - orbCenterY);
        
        const minDragDistance = 25; // pixels from center
        const maxDragDistance = 140; // pixels from center
        const fraction = (currentDistance - minDragDistance) / (maxDragDistance - minDragDistance);
        const clampedFraction = Math.max(0, Math.min(1, fraction));
        // Map across €50 to €500 in fine-tuned €25 steps for precision
        let targetBudget = Math.round((50 + clampedFraction * 450) / 25) * 25;
        targetBudget = Math.max(50, Math.min(500, targetBudget));

        if (targetBudget !== localBudget) {
          setLocalBudget(targetBudget);
          triggerHapticProxy(12); // mechanical shift click!
          if (onChange) onChange(localX, localY, targetBudget, localTime);
        }
      }

      else if (activeGesture === 'time' && orbRef.current) {
        const rect = orbRef.current.getBoundingClientRect();
        const orbCenterX = rect.left + rect.width / 2;
        const orbCenterY = rect.top + rect.height / 2;

        const currentAngle = Math.atan2(e.clientY - orbCenterY, e.clientX - orbCenterX) * (180 / Math.PI);
        let angleDelta = currentAngle - gestureState.current.startAngle;

        // Angle full wrap calculations
        if (angleDelta > 180) angleDelta -= 360;
        if (angleDelta < -180) angleDelta += 360;

        let targetAngle = computeAngleFromTime(gestureState.current.startTime) + angleDelta;
        if (targetAngle < 0) targetAngle += 360;
        if (targetAngle >= 360) targetAngle -= 360;

        // Extract snapped details dynamically
        const { timeValue, diff } = computeTimeFromAngle(targetAngle);

        if (timeValue !== localTime) {
          setLocalTime(timeValue);
          triggerHapticProxy(10); // watch bezel mechanical click feel
          if (onChange) onChange(localX, localY, localBudget, timeValue);
        }
      }
    };

    const handleGlobalUp = () => {
      if (longPressTimeout.current) clearTimeout(longPressTimeout.current);

      if (activeGesture) {
        setActiveGesture(null);
        triggerHapticProxy(15); // soft release haptic

        // Release spring elastic boundaries back onto resting limits
        let restingX = localX;
        let restingY = localY;
        let didSpring = false;

        if (localX < 0.08) { restingX = 0.08; didSpring = true; }
        else if (localX > 0.92) { restingX = 0.92; didSpring = true; }

        if (localY < 0.08) { restingY = 0.08; didSpring = true; }
        else if (localY > 0.92) { restingY = 0.92; didSpring = true; }

        if (didSpring) {
          setLocalX(restingX);
          setLocalY(restingY);
          triggerHapticProxy(18); // boundary snap pulse
          if (onChange) onChange(restingX, restingY, localBudget, localTime);
        }
      }
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [activeGesture, localX, localY, localBudget, localTime, onChange]);

  // Handle accessibility stepper changes
  const adjustBudgetStep = (direction: 'up' | 'down') => {
    let nextBudget = localBudget;
    if (direction === 'up') {
      nextBudget = Math.min(500, localBudget + 100);
    } else {
      nextBudget = Math.max(100, localBudget - 100);
    }
    setLocalBudget(nextBudget);
    triggerHapticProxy(10);
    if (onChange) onChange(localX, localY, nextBudget, localTime);
  };

  const adjustTimeStep = (direction: 'up' | 'down') => {
    const currentIndex = SNAP_TIMES.indexOf(localTime);
    let nextIndex = currentIndex;
    if (direction === 'up') {
      nextIndex = Math.min(SNAP_TIMES.length - 1, currentIndex + 1);
    } else {
      nextIndex = Math.max(0, currentIndex - 1);
    }
    const nextTime = SNAP_TIMES[nextIndex];
    setLocalTime(nextTime);
    triggerHapticProxy(12);
    if (onChange) onChange(localX, localY, localBudget, nextTime);
  };

  const shiftCoordinate = (axis: 'x' | 'y', direction: 'positive' | 'negative') => {
    const step = 0.10;
    let nextVal = axis === 'x' ? localX : localY;
    if (direction === 'positive') {
      nextVal = Math.min(0.92, nextVal + step);
    } else {
      nextVal = Math.max(0.08, nextVal - step);
    }
    
    if (axis === 'x') {
      setLocalX(nextVal);
      if (onChange) onChange(nextVal, localY, localBudget, localTime);
    } else {
      setLocalY(nextVal);
      if (onChange) onChange(localX, nextVal, localBudget, localTime);
    }
    triggerHapticProxy(8);
  };

  return (
    <div className="w-full relative select-none flex flex-col items-center">
      {/* Primary Coordinate Field Area (Dominant Interactive Canvas) */}
      <div 
        ref={fieldRef}
        onPointerDown={(e) => {
          if (e.target === fieldRef.current) {
            const rect = fieldRef.current.getBoundingClientRect();
            const clickX = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
            const clickY = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));
            
            setLocalX(clickX);
            setLocalY(clickY);
            if (onChange) onChange(clickX, clickY, localBudget, localTime);
            
            setActiveGesture('position');
            triggerHapticProxy(12);
            gestureState.current = {
              ...gestureState.current,
              startX: e.clientX,
              startY: e.clientY,
              startOrbX: clickX,
              startOrbY: clickY
            };
          }
        }}
        onDoubleClick={(e) => {
          // Double-click background resets the tracker precisely to center (0.5, 0.5)
          if (e.target === fieldRef.current) {
            setLocalX(0.5);
            setLocalY(0.5);
            if (onChange) onChange(0.5, 0.5, localBudget, localTime);
            triggerHapticProxy(25);
          }
        }}
        className={`w-full aspect-square max-w-[420px] relative bg-white/80 backdrop-blur-md border border-[#E2DFC2]/80 rounded-[28px] overflow-hidden select-none touch-none shadow-sm mx-auto flex items-center justify-center p-2 cursor-pointer z-10 transition-all duration-300 ${
          activeGesture === 'position' ? 'shadow-inner bg-[#FAF9F5]/40 border-[#800020]/35' : 'hover:border-[#BEBBB2]'
        }`}
      >
        {/* Subtle Grid Reticles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-[#D5D3C8]/40" />
          <div className="absolute h-full w-[1px] bg-[#D5D3C8]/40" />
        </div>

        {/* Compass Axis 1: URBAN (Top) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
          <Building2 size={13} className="text-[#23251E] mb-0.5" />
          <span>{onboardingCard0.axis_urban}</span>
        </div>

        {/* Compass Axis 2: NATURE (Bottom) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
          <TreePine size={13} className="text-[#23251E] mb-0.5" />
          <span>{onboardingCard0.axis_nature}</span>
        </div>

        {/* Compass Axis 3: HEDONIST (Left) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
          <Wine size={13} className="text-[#23251E] mb-0.5" />
          <span>{onboardingCard0.axis_hedonist}</span>
        </div>

        {/* Compass Axis 4: ADVENTURER (Right) */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
          <Footprints size={13} className="text-[#23251E] mb-0.5" />
          <span>{onboardingCard0.axis_adventurer}</span>
        </div>

        {/* Precision Instrument Center Orb */}
        <motion.div
          ref={orbRef}
          animate={{
            left: `${visualX * 100}%`,
            top: `${visualY * 100}%`,
            width: orbDiameter,
            height: orbDiameter,
          }}
          transition={{
            type: "spring",
            stiffness: activeGesture ? 360 : 180,
            damping: activeGesture ? 30 : 20,
            mass: 0.85
          }}
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
          }}
          className={`z-20 cursor-pointer pointer-events-auto filter drop-shadow-md flex items-center justify-center ${
            activeGesture ? 'scale-[1.04]' : ''
          }`}
          onPointerDown={(e) => {
            if (activeMode === 'resize') {
              handleBudgetStart(e);
            } else if (activeMode === 'rotate') {
              handleTimeStart(e);
            } else {
              handlePositionStart(e);
            }
          }}
        >
          <svg 
            viewBox="-100 -100 200 200" 
            className="w-full h-full select-none pointer-events-none overflow-visible"
          >
            <defs>
              {/* Metallic Titanium Outer Ring Bezel */}
              <linearGradient id="moodOrbBezel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#F4F4F5" />
                <stop offset="40%" stopColor="#D4D4D8" />
                <stop offset="50%" stopColor="#A1A1AA" />
                <stop offset="60%" stopColor="#E4E4E7" />
                <stop offset="80%" stopColor="#71717A" />
                <stop offset="90%" stopColor="#3F3F46" />
                <stop offset="100%" stopColor="#18181B" />
              </linearGradient>

              {/* Slate Navy Time Segment */}
              <linearGradient id="moodOrbTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* IDEMO Oxblood Red Budget Segment */}
              <linearGradient id="moodOrbBudget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={localBudget >= 300 ? "#9E2A2A" : "#800020"} />
                <stop offset="100%" stopColor={localBudget >= 300 ? "#6B001B" : "#500014"} />
              </linearGradient>

              {/* Glass Convex Reflection */}
              <radialGradient id="moodOrbReflection" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>

              {/* Sapphire glass AR Sheen */}
              <linearGradient id="moodOrbSapphire" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                <stop offset="30%" stopColor="#818CF8" stopOpacity="0.04" />
                <stop offset="70%" stopColor="#C084FC" stopOpacity="0" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            {/* Time Segment base layer */}
            <circle r="98" fill="url(#moodOrbTime)" stroke="#334155" strokeWidth="1" />

            {/* Budget segment overlaid */}
            <path 
              d="M -90,0 C -45,12 45,-12 90,0 A 90,90 0 0,0 -90,0 Z" 
              fill="url(#moodOrbBudget)" 
              transform={`rotate(${visualAngle})`}
            />

            {/* Beveled Seam Divider */}
            <path 
              d="M -90,0 C -45,12 45,-12 90,0" 
              fill="none" 
              stroke="#0F172A" 
              strokeWidth="2" 
              className="opacity-45 pointer-events-none"
              transform={`rotate(${visualAngle})`}
            />
            <path 
              d="M -90,0 C -45,12 45,-12 90,0" 
              fill="none" 
              stroke="#E2E8F0" 
              strokeWidth="0.75" 
              className="opacity-90 pointer-events-none"
              transform={`rotate(${visualAngle})`}
            />

            {/* Time text indicator in dial */}
            <text 
              x="0" 
              y="-32" 
              textAnchor="middle" 
              fill="#FFFFFF" 
              fontSize="18" 
              fontWeight="bold" 
              fontFamily="sans-serif"
              className="select-none pointer-events-none"
            >
              {localTime}h
            </text>

            {/* Budget text indicator in dial */}
            <text 
              x="0" 
              y="42" 
              textAnchor="middle" 
              fill="#FFFFFF" 
              fontSize="18" 
              fontWeight="bold" 
              fontFamily="sans-serif"
              className="select-none pointer-events-none"
            >
              €{Math.round(localBudget)}
            </text>

            {/* Center Compass Needle */}
            <g className="pointer-events-none">
              <polygon points="0,-22 5,0 0,6 -5,0" fill="#FFFFFF" />
              <polygon points="0,22 5,0 0,6 -5,0" fill="#94A3B8" />
              <circle r="3" fill="#800020" />
            </g>

            {/* Bezel Ring */}
            <circle r={98 - outerBezelWidth / 2} fill="none" stroke="url(#moodOrbBezel)" strokeWidth={outerBezelWidth} className="opacity-85 pointer-events-none" />

            {/* Sapphire glass and reflection */}
            <circle r="96" fill="url(#moodOrbReflection)" className="pointer-events-none mix-blend-overlay" />
            <circle r="96" fill="url(#moodOrbSapphire)" className="pointer-events-none mix-blend-screen" />




            {/* Interactive Hit Targets to preserve touch gestures */}
            <circle 
              r="24" 
              fill="transparent" 
              className="cursor-move pointer-events-auto"
              onPointerDown={(e) => {
                if (activeMode === 'resize') {
                  handleBudgetStart(e);
                } else if (activeMode === 'rotate') {
                  handleTimeStart(e);
                } else {
                  handlePositionStart(e);
                }
              }}
            />

            {/* Outer Dial Track Ring to Adjust Time limit (Rotatable Bezel Track) */}
            <circle 
              r="92" 
              fill="none" 
              stroke="transparent" 
              strokeWidth="20" 
              className="cursor-pointer pointer-events-auto"
              onPointerDown={(e) => {
                if (activeMode === 'move') {
                  handlePositionStart(e);
                } else if (activeMode === 'resize') {
                  handleBudgetStart(e);
                } else {
                  handleTimeStart(e);
                }
              }}
            />

            {/* Inner Body Zone to scale Budget limit (Radial Dial Area) */}
            <circle 
              r="55" 
              fill="none" 
              stroke="transparent" 
              strokeWidth="50" 
              className="cursor-pointer pointer-events-auto"
              onPointerDown={(e) => {
                if (activeMode === 'move') {
                  handlePositionStart(e);
                } else if (activeMode === 'rotate') {
                  handleTimeStart(e);
                } else {
                  handleBudgetStart(e);
                }
              }}
            />
          </svg>

          {/* Halo Feedback Aura during pointer updates */}
          <AnimatePresence>
            {activeGesture && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 0.12, scale: 1.05 }}
                exit={{ opacity: 0, scale: 1.15 }}
                className="absolute inset-0 rounded-full bg-rose-500 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Compact Synchronized Accessibility Fallback Manual Steppers Panel */}
        <AnimatePresence>
          {showAccessibility && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-white/95 backdrop-blur-md p-6 flex flex-col justify-between z-30 select-none text-brand-charcoal"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-[#D5D3C8]/40 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-charcoal">
                    ⚙️ {t.manualTitle}
                  </span>
                  <button 
                    onClick={() => { setShowAccessibility(false); triggerHapticProxy(12); }}
                    className="h-7 px-3 rounded-full bg-brand-charcoal text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-charcoal/95"
                  >
                    {t.close}
                  </button>
                </div>

                {/* Coordinates manual keys */}
                <div className="p-3 bg-[#FAF9F5] border border-[#D5D3C8]/40 rounded-xl space-y-2">
                  <span className="text-[8.5px] uppercase tracking-wider text-[#8C8A7D] font-black">
                    🗺️ Quadrant Offset
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => shiftCoordinate('x', 'negative')}
                      className="w-10 h-10 rounded-lg bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-bold text-sm"
                    >
                      ◀
                    </button>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => shiftCoordinate('y', 'negative')}
                        className="w-10 h-10 rounded-lg bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-bold text-sm"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => shiftCoordinate('y', 'positive')}
                        className="w-10 h-10 rounded-lg bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-bold text-sm"
                      >
                        ▼
                      </button>
                    </div>
                    <button 
                      onClick={() => shiftCoordinate('x', 'positive')}
                      className="w-10 h-10 rounded-lg bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-bold text-sm"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Budget Limit controls */}
                <div className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#D5D3C8]/40 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[8.5px] uppercase tracking-wider text-[#8C8A7D] font-black">
                      💰 Budget Limit
                    </span>
                    <span className="text-[13px] font-black">€{Math.round(localBudget)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => adjustBudgetStep('down')}
                      className="w-10 h-10 rounded-full bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-black text-lg shadow-sm"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => adjustBudgetStep('up')}
                      className="w-10 h-10 rounded-full bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-black text-lg shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Time Hours controls */}
                <div className="flex items-center justify-between p-3 bg-[#FAF9F5] border border-[#D5D3C8]/40 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[8.5px] uppercase tracking-wider text-[#8C8A7D] font-black">
                      ⏱️ Available Time
                    </span>
                    <span className="text-[13px] font-black">{getSnappedTime(localTime)} Hours</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => adjustTimeStep('down')}
                      className="w-10 h-10 rounded-full bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-black text-lg shadow-sm"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => adjustTimeStep('up')}
                      className="w-10 h-10 rounded-full bg-white border border-[#D5D3C8] hover:bg-[#F5F4EE] flex items-center justify-center font-black text-lg shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[8.5px] text-[#8C8A7D] text-center uppercase tracking-widest font-black">
                IDEMO PRECISION UX ENGINE • 100% SYNCED
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
