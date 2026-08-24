import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, Sliders, Shield, Zap, Info, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { safeStorage } from '../lib/safeStorage';

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
  const [learnOpen, setLearnOpen] = useState(false);

  const isSr = language === 'sr';
  const isZh = language === 'zh';

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
      // Cooldown buffer lets parent components safely stabilize without triggering a snap-back
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

  // Handle external prop changes (like presets/category button clicks) while completely ignoring self-induced drag feedback
  useEffect(() => {
    // If the user was recently dragging, absorb the incoming changes as synchronized but do NOT override
    // the precise, high-fidelity continuous local coordinates with discrete parent averages
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
  
  // User selected mode that locks down adjustments to one specific control (Position, Budget, or Time)
  const [selectedMode, setSelectedMode] = useState<'position' | 'budget' | 'time' | null>(null);
  
  // Accessibility panel toggle
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);

  // Onboarding guide state (auto-shows on first visit, can be manually triggered)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return safeStorage.getItem('idemo_mood_orbit_onboarding_seen') !== 'true';
    } catch {
      return true;
    }
  });
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  // Long press timer ref for opening accessibility panel
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  // One-time interactive hints dismissed flags (managed via localStorage)
  const [ringHintDismissed, setRingHintDismissed] = useState(() => {
    try {
      return safeStorage.getItem('idemo_time_ring_hint_dismissed') === 'true';
    } catch {
      return false;
    }
  });

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
        longPressTip: "Hold center to open manual editor",
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

  // Orb Diameter based on budget size
  const orbDiameter = useMemo(() => {
    // Starting default size at 100 euro is 85px.
    // Double size at 500 euro is 170px.
    const startD = 85; 
    const ratio = (localBudget - 100) / 400; // ranges from 0.0 to 1.0
    return startD * (1 + ratio);
  }, [localBudget]);

  // Multi-bezel metallic ring thickness scales subtly with budget
  const outerBezelWidth = useMemo(() => {
    const s = computeSFromBudget(localBudget);
    return 8 + s * 6; // Thicker ring as budget expands
  }, [localBudget]);

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

    if (!ringHintDismissed) {
      try {
        safeStorage.setItem('idemo_time_ring_hint_dismissed', 'true');
      } catch {}
      setRingHintDismissed(true);
    }
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
        let finalX = computedX;
        let finalY = computedY;

        if (computedX < 0.08) {
          finalX = 0.08 - (0.08 - computedX) * 0.35; // compressive resistance
        } else if (computedX > 0.92) {
          finalX = 0.92 + (computedX - 0.92) * 0.35;
        }

        if (computedY < 0.08) {
          finalY = 0.08 - (0.08 - computedY) * 0.35;
        } else if (computedY > 0.92) {
          finalY = 0.92 + (computedY - 0.92) * 0.35;
        }

        setLocalX(finalX);
        setLocalY(finalY);
        triggerHapticProxy(4);

        // Clip actual trigger values so background remains calibrated
        const triggerX = Math.min(0.92, Math.max(0.08, finalX));
        const triggerY = Math.min(0.92, Math.max(0.08, finalY));
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
    <div className="w-full max-w-md mx-auto bg-white border border-[#D5D3C8] rounded-[32px] p-6 shadow-tactile text-left select-none relative overflow-hidden flex flex-col gap-4">
      {/* Premium ambient backdrop shading */}
      <div className="absolute inset-0 bg-radial-gradient from-[#FAF9F5] to-transparent pointer-events-none opacity-40" />

      {/* Premium Bezel Design Header */}
      <div className="flex justify-between items-start z-10 relative">
        <div className="space-y-0.5">
          <h3 className="text-xl font-serif text-brand-charcoal font-black tracking-tight">{t.title}</h3>
        </div>
      </div>

      {/* TODAY'S CONCIERGE box placed above Learn Mood Orbit box */}
      <div 
        onClick={() => {
          if (onSelectConcierge) {
            onSelectConcierge();
          } else {
            setShowCorrelationModal(true);
          }
          triggerHapticProxy(6);
        }}
        className="bg-white rounded-[24px] border border-[#D5D3C8] p-4.5 shadow-xs text-left relative overflow-hidden cursor-pointer hover:border-accent-teal/30 active:scale-[0.99] transition-all group z-10 w-full"
      >
        <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-accent-teal/5 blur-xl pointer-events-none" />
        
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase tracking-[0.25em] text-accent-teal font-extrabold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
              <span>{language === 'sr' ? 'DANAŠNJI KONSJERŽ' : language === 'zh' ? '今日专属管家' : language === 'es' ? 'EL CONSERJE DE HOY' : language === 'de' ? 'DER HEUTIGE CONCIERGE' : language === 'ru' ? 'СЕГОДНЯŠНИЙ КОНSJERŽ' : "TODAY'S CONCIERGE"}</span>
              <span className="text-[8px] font-sans font-bold text-accent-teal opacity-0 group-hover:opacity-100 transition-opacity">({language === 'sr' ? 'Saznaj više' : language === 'zh' ? '了解更多' : 'Learn more'})</span>
            </p>
            <h3 className="font-serif font-black text-lg text-brand-charcoal tracking-tight group-hover:text-accent-teal transition-colors">
              {conciergeStyleName || liveInterpretation.tag}
            </h3>
          </div>
          <span className="text-[8.5px] uppercase font-bold bg-accent-teal/10 text-accent-teal px-2.5 py-0.5 rounded-full select-none group-hover:bg-accent-teal/20 transition-colors">
            {language === 'sr' ? 'Usklađeno' : language === 'zh' ? '已校准' : language === 'es' ? 'Calibrado' : language === 'de' ? 'Kalibriert' : language === 'ru' ? 'Откалиброван' : 'Calibrated'}
          </span>
        </div>
      </div>

      {/* Learn Mood Orbit Collapsible Accordion */}
      <div className="z-10 relative mt-1">
        <button
          onClick={() => {
            setLearnOpen(!learnOpen);
            triggerHapticProxy(6);
          }}
          className="w-full h-10 rounded-xl flex items-center justify-between px-4 font-bold tracking-widest uppercase text-[9.5px] bg-[#FAF9F5] border border-[#D5D3C8] text-brand-charcoal hover:bg-[#F5F3EB] transition-all cursor-pointer outline-none"
        >
          <span className="flex items-center gap-2">
            <Info size={14} className="text-accent-teal" />
            <span>{language === 'sr' ? 'Saznajte više o Mood Orbit-u' : language === 'zh' ? '了解情绪星轨仪' : 'Learn Mood Orbit'}</span>
          </span>
          <span className="text-lg leading-none">{learnOpen ? '−' : '+'}</span>
        </button>
        
        <AnimatePresence initial={false}>
          {learnOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-4"
            >
              {/* 2.5. Mood Flow Copy & Concept visualizer */}
              <div className="bg-[#FAF9F5]/60 border border-[#D5D3C8]/40 rounded-[24px] p-4 space-y-3 select-none relative overflow-hidden">
                {/* Decorative light reflection highlight */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent-teal/5 rounded-full blur-xl pointer-events-none" />

                <div className="text-center space-y-1">
                  <p className="text-[11.5px] font-serif font-black text-brand-charcoal tracking-tight leading-snug">
                    “{t.heartOfConcierge}”
                  </p>
                  <p className="text-[9.5px] font-medium text-brand-charcoal/65 leading-normal max-w-[280px] mx-auto">
                    {t.alignedToMood}
                  </p>
                </div>

                {/* Horizontal Flow visualizer */}
                <div className="flex items-center justify-between px-1.5 pt-0.5 relative">
                  {/* Connector Track passing precisely through the center of 32px bubbles */}
                  <div className="absolute left-8 right-8 top-[16px] h-[1px] bg-gradient-to-r from-accent-teal/30 via-amber-500/30 via-rose-500/30 to-accent-teal/30 pointer-events-none z-0" />
                  
                  {/* Step 1: Mood Orbit */}
                  <div className="flex flex-col items-center space-y-1.5 flex-1 z-10">
                    <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-accent-teal/30 flex items-center justify-center text-accent-teal shadow-xs">
                      <Compass size={11} className="animate-spin-slow" />
                    </div>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-brand-charcoal/60 text-center leading-none">
                      {t.flowMoodOrbit}
                    </span>
                  </div>

                  {/* Step 2: Live Profile */}
                  <div className="flex flex-col items-center space-y-1.5 flex-1 z-10">
                    <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
                      <Sparkles size={11} />
                    </div>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-brand-charcoal/60 text-center leading-none">
                      {t.flowLiveProfile}
                    </span>
                  </div>

                  {/* Step 3: Recommendations */}
                  <div className="flex flex-col items-center space-y-1.5 flex-1 z-10">
                    <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-xs">
                      <Zap size={11} />
                    </div>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-brand-charcoal/60 text-center leading-none">
                      {t.flowRecommendations}
                    </span>
                  </div>

                  {/* Step 4: Itinerary */}
                  <div className="flex flex-col items-center space-y-1.5 flex-1 z-10">
                    <div className="w-8 h-8 rounded-full bg-[#FAF9F5] border border-accent-teal/30 flex items-center justify-center text-accent-teal shadow-xs">
                      <Sliders size={11} />
                    </div>
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-brand-charcoal/60 text-center leading-none">
                      {t.flowItinerary}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Guide Quick Access Button */}
              <div>
                <button
                  onClick={() => {
                    setShowOnboarding(true);
                    setOnboardingStep(0);
                    triggerHapticProxy(15);
                  }}
                  className="w-full py-3 px-4.5 rounded-2xl bg-[#FAF9F5] hover:bg-[#F5F3EB] border-2 border-[#D5D3C8] text-brand-charcoal transition-all flex items-center justify-between text-xs font-bold cursor-pointer group shadow-xs outline-none"
                >
                  <span className="font-sans uppercase tracking-[0.2em] text-[10.5px] text-[#5C5A4D] font-black group-hover:text-brand-charcoal transition-colors">
                    {language === 'sr' ? '> POKRENI INTERAKTIVNI VODIČ' : language === 'zh' ? '> 开启互动指南' : '> START INTERACTIVE GUIDE'}
                  </span>
                  <span className="text-[11px] text-[#8C8A7D] font-serif italic group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Profile Calibration Panel hidden at this moment but preserved as requested */}
      {false && (
        <div className="bg-[#FAF9F5] rounded-[24px] border border-[#D5D3C8] p-4.5 space-y-2.5 z-10 select-none">
          <div className="flex justify-between items-center border-b border-[#D5D3C8]/30 pb-2">
            <div className="space-y-0.5">
              <span className="text-[8.5px] uppercase tracking-[0.2em] text-[#8C8A7D] font-black">
                LIVE PROFILE CALIBRATION
              </span>
              <h4 className="font-serif font-black text-base text-brand-charcoal leading-none tracking-tight">
                {liveInterpretation.tag}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded bg-brand-charcoal text-white text-[8px] font-black uppercase tracking-widest leading-none">
              €{Math.round(localBudget)} • {getSnappedTime(localTime)} {language === 'sr' ? 'SATI' : 'HRS'}
            </span>
          </div>

          <p className="text-[11px] text-brand-charcoal/85 font-medium leading-relaxed">
            {liveInterpretation.desc}
          </p>

          <div className="p-2.5 bg-white border border-[#D5D3C8]/40 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5">
              <Shield className="text-emerald-600" style={{ width: 11, height: 11 }} />
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                {t.privacy}
              </p>
            </div>
            <p className="text-[9px] text-brand-charcoal/70 leading-relaxed font-semibold">
              {t.privacyDesc}
            </p>
          </div>
        </div>
      )}

      {/* Primary Coordinate Field Area */}
      <div 
        ref={fieldRef}
        onPointerDown={(e) => {
          // If the user clicks on the field background (not inside the watch orb), and selectedMode is null or position
          if (e.target === fieldRef.current && (!selectedMode || selectedMode === 'position')) {
            const rect = fieldRef.current.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / rect.width;
            const clickY = (e.clientY - rect.top) / rect.height;
            
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
            triggerHapticProxy(25); // Premium reset tactile indicator
          }
        }}
        className={`w-full aspect-square relative bg-white border border-[#D5D3C8] rounded-[24px] overflow-hidden select-none touch-none cursor-crosshair z-10 transition-all duration-300 ${
          activeGesture === 'position' ? 'shadow-inner bg-[#FAF9F5]/40 border-rose-500/35' : 'shadow-xs hover:border-[#BEBBB2]'
        }`}
      >
        {/* Alignment radar reticles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-[#D5D3C8]/45" />
          <div className="absolute h-full w-[1px] bg-[#D5D3C8]/45" />
        </div>

        {/* Sensory guide circles */}
        <div className="absolute inset-8 rounded-full border border-dashed border-[#D5D3C8]/25 pointer-events-none" />
        <div className="absolute inset-20 rounded-full border border-[#D5D3C8]/15 pointer-events-none" />

        {/* Grid Axis Labels (Premium High-Contrast Sun-Readable Scales) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[13px] font-black uppercase tracking-[0.18em] text-brand-charcoal select-none pointer-events-none z-10 whitespace-nowrap">
          {t.axisUrban} ↑
        </div>
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[13px] font-black uppercase tracking-[0.18em] text-brand-charcoal select-none pointer-events-none z-10 whitespace-nowrap">
          ↓ {t.axisNature}
        </div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-40 flex items-center justify-center z-10 select-none pointer-events-none">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-brand-charcoal whitespace-nowrap -rotate-90 flex items-center gap-1">
            <span className="rotate-90 inline-block">←</span>
            <span>{t.axisHedonist}</span>
          </div>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-40 flex items-center justify-center z-10 select-none pointer-events-none">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-brand-charcoal whitespace-nowrap rotate-90 flex items-center gap-1">
            <span>{t.axisAdventurer}</span>
            <span className="-rotate-90 inline-block">→</span>
          </div>
        </div>

        {/* Precision Instrument Center Orb */}
        <motion.div
          ref={orbRef}
          animate={{
            left: `${localX * 100}%`,
            top: `${localY * 100}%`,
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
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute rounded-full flex items-center justify-center select-none pointer-events-auto shadow-2xl border border-white/90 bg-transparent ${
            activeGesture ? 'shadow-rose-500/20 scale-[1.04]' : 'hover:shadow-xl'
          }`}
        >
          <svg 
            viewBox="-100 -100 200 200" 
            onPointerDown={(e) => {
              if (selectedMode === 'position') {
                handlePositionStart(e);
              } else if (selectedMode === 'budget') {
                handleBudgetStart(e);
              } else if (selectedMode === 'time') {
                handleTimeStart(e);
              }
            }}
            className="w-full h-full rounded-full select-none overflow-hidden"
          >
            <defs>
              {/* Bezel Metallic Titanium Ring Brushed Stop Gradients */}
              <linearGradient id="silverBezel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#F4F4F5" />
                <stop offset="40%" stopColor="#D4D4D8" />
                <stop offset="50%" stopColor="#A1A1AA" />
                <stop offset="60%" stopColor="#E4E4E7" />
                <stop offset="80%" stopColor="#71717A" />
                <stop offset="90%" stopColor="#3F3F46" />
                <stop offset="100%" stopColor="#18181B" />
              </linearGradient>

              {/* Lower Segment Space Dark Slate Gradient */}
              <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0F172A" />
              </linearGradient>

              {/* Upper Segment Premium Rose Gold Gradient (Vibrancy adjusts dynamically with budget scale) */}
              <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={localBudget >= 300 ? "#FB7185" : "#FDA4AF"} />
                <stop offset="100%" stopColor={localBudget >= 300 ? "#E11D48" : "#F43F5E"} />
              </linearGradient>

              {/* Crown Mechanical Ridged Texture Gradient */}
              <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="25%" stopColor="#D4D4D8" />
                <stop offset="50%" stopColor="#71717A" />
                <stop offset="75%" stopColor="#D4D4D8" />
                <stop offset="100%" stopColor="#18181B" />
              </linearGradient>

              {/* Glass Convex Reflection Layer Highlight */}
              <radialGradient id="glassReflection" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>

              {/* Sapphire Glass Anti-Reflective (AR) Coating Sheen */}
              <linearGradient id="sapphireAR" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                <stop offset="30%" stopColor="#818CF8" stopOpacity="0.04" />
                <stop offset="70%" stopColor="#C084FC" stopOpacity="0" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
              </linearGradient>

              {/* Chromalight Glow Filter for Luxury Watch Luminescence */}
              <filter id="chromalightGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Luminous paint gradient mimicking Rolex Chromalight */}
              <linearGradient id="lumeFill" x1="0" y1="0" x2="0" y2="1">
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
            <circle r="98" fill="url(#timeGrad)" stroke="#334155" strokeWidth="1" />

            {/* Upper Budget segment overlaid & divided dynamically by organic wavy liquid line */}
            <path 
              d={`M -90,0 C -45,${12 + wiggle} 45,${-(12 + wiggle)} 90,0 A 90,90 0 0,0 -90,0 Z`} 
              fill="url(#budgetGrad)" 
              transform={`rotate(${visualAngle})`}
              className="transition-all duration-75"
            />

            {/* Polished Metallic Beveled Divider on Dial Seam to split segments elegantly */}
            <path 
              d={`M -90,0 C -45,${12 + wiggle} 45,${-(12 + wiggle)} 90,0`} 
              fill="none" 
              stroke="#0F172A" 
              strokeWidth="2" 
              className="opacity-45 pointer-events-none transition-all duration-75"
              transform={`rotate(${visualAngle})`}
            />
            <path 
              d={`M -90,0 C -45,${12 + wiggle} 45,${-(12 + wiggle)} 90,0`} 
              fill="none" 
              stroke="#E2E8F0" 
              strokeWidth="0.75" 
              className="opacity-90 pointer-events-none transition-all duration-75"
              transform={`rotate(${visualAngle})`}
            />

            {/* Rolex Explorer Fine 60-Minute Dial Track */}
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
              fill="url(#lumeFill)" 
              stroke="#E4E4E7" 
              strokeWidth="0.5" 
              filter="url(#chromalightGlow)" 
              className="pointer-events-none"
            />

            {/* Rolex Explorer High-Contrast 3, 6, 9 Numerals (Chromalight) */}
            <text
              x="73"
              y="0"
              textAnchor="middle"
              dominantBaseline="central"
              fill="url(#lumeFill)"
              stroke="#E4E4E7"
              strokeWidth="0.5"
              filter="url(#chromalightGlow)"
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
              fill="url(#lumeFill)"
              stroke="#E4E4E7"
              strokeWidth="0.5"
              filter="url(#chromalightGlow)"
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
              fill="url(#lumeFill)"
              stroke="#E4E4E7"
              strokeWidth="0.5"
              filter="url(#chromalightGlow)"
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
                    fill="url(#lumeFill)" 
                    stroke="#E4E4E7" 
                    strokeWidth="0.5" 
                    filter="url(#chromalightGlow)" 
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {/* Thick Bezel Ring Frame */}
            <circle r={98 - outerBezelWidth / 2} fill="none" stroke="url(#silverBezel)" strokeWidth={outerBezelWidth} className="opacity-85 pointer-events-none" />
            
            {/* Sapphire glass and convex reflection overlays */}
            <circle r="96" fill="url(#glassReflection)" className="pointer-events-none mix-blend-overlay" />
            <circle r="96" fill="url(#sapphireAR)" className="pointer-events-none mix-blend-screen" />

            {/* Watch Bezel Hand-Polished Chamfer Ring */}
            <circle r="97.5" fill="none" stroke="#FFFFFF" strokeWidth="0.75" className="opacity-60 pointer-events-none" />

            {/* Inner dark bezel shadow step/rim separating bezel and dial face */}
            <circle r={98 - outerBezelWidth} fill="none" stroke="#090d16" strokeWidth="1.25" className="opacity-35 pointer-events-none" />

            {/* Mechanical Watch Crown Rotatable Indicator Pointer */}
            <g transform={`rotate(${visualAngle}) translate(92, 0)`}>
              {/* Dropshadow */}
              <rect x="-6.5" y="-13" width="13" height="26" rx="2" fill="#000" className="opacity-15 pointer-events-none" transform="translate(1, 1)" />
              
              {/* Precision casing */}
              <rect x="-6.5" y="-13" width="13" height="26" rx="2.5" fill="url(#silverBezel)" stroke="#1F2937" strokeWidth="0.75" />
              
              {/* Elegant circular inset with emerald/teal gemstone centerpiece */}
              <circle r="2.5" fill="#14B8A6" stroke="#0D9488" strokeWidth="0.5" cx="0" cy="0" className="shadow-xs" />
              
              {/* Micro-machined physical grip ridges */}
              <line x1="-4.5" y1="-9" x2="4.5" y2="-9" stroke="#374151" strokeWidth="0.75" />
              <line x1="-4.5" y1="-6" x2="4.5" y2="-6" stroke="#374151" strokeWidth="0.75" />
              <line x1="-4.5" y1="-3" x2="4.5" y2="-3" stroke="#374151" strokeWidth="0.75" />
              <line x1="-4.5" y1="3" x2="4.5" y2="3" stroke="#374151" strokeWidth="0.75" />
              <line x1="-4.5" y1="6" x2="4.5" y2="6" stroke="#374151" strokeWidth="0.75" />
              <line x1="-4.5" y1="9" x2="4.5" y2="9" stroke="#374151" strokeWidth="0.75" />
            </g>

            {/* Symmetrically Centered Live Value Displays inside segments */}
            {/* Budget text */}
            <g transform={`translate(${centroids.budgetX}, ${centroids.budgetY})`}>
              {/* Elegant text background drop shadow for readability on bright colors */}
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-black/30 font-sans font-black tracking-tight"
                style={{ fontSize: '18.5px', userSelect: 'none', transform: 'translateY(1.5px)' }}
              >
                €{Math.round(localBudget)}
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-white font-sans font-black tracking-tight"
                style={{ fontSize: '18px', userSelect: 'none' }}
              >
                €{Math.round(localBudget)}
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-black/20 font-sans font-extrabold tracking-widest"
                style={{ fontSize: '7.5px', transform: 'translateY(14.5px)', userSelect: 'none' }}
              >
                BUDGET
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-white/75 font-sans font-extrabold tracking-widest"
                style={{ fontSize: '7.5px', transform: 'translateY(13.5px)', userSelect: 'none' }}
              >
                BUDGET
              </text>
            </g>

            {/* Time text */}
            <g transform={`translate(${centroids.timeX}, ${centroids.timeY})`}>
              {/* Background text drop shadow */}
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-black/35 font-sans font-black tracking-tight"
                style={{ fontSize: '18.5px', userSelect: 'none', transform: 'translateY(1.5px)' }}
              >
                {getSnappedTime(localTime)} h
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-white font-sans font-black tracking-tight"
                style={{ fontSize: '18px', userSelect: 'none' }}
              >
                {getSnappedTime(localTime)} h
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-black/20 font-sans font-extrabold tracking-widest"
                style={{ fontSize: '7.5px', transform: 'translateY(14.5px)', userSelect: 'none' }}
              >
                TIME
              </text>
              <text 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="fill-white/75 font-sans font-extrabold tracking-widest"
                style={{ fontSize: '7.5px', transform: 'translateY(13.5px)', userSelect: 'none' }}
              >
                TIME
              </text>
            </g>

            {/* Rolex Explorer Mercedes Hour Hand */}
            <g transform={`rotate(${visualAngle})`} className="pointer-events-none">
              {/* Silver outline shadow */}
              <path 
                d="M 0,0 L -1.5,-6 L -1.5,-23 A 4.5,4.5 0 0,1 -4,-26.5 A 4.5,4.5 0 0,1 -1.5,-30.5 L -1.5,-38 L 0,-41 L 1.5,-38 L 1.5,-30.5 A 4.5,4.5 0 0,1 4,-26.5 A 4.5,4.5 0 0,1 1.5,-23 L 1.5,-6 Z" 
                fill="#3F3F46" 
                className="opacity-40" 
                transform="translate(0, 0.5)"
              />
              {/* Main Hand body with Chromalight lume */}
              <path 
                d="M 0,0 L -1.2,-6 L -1.2,-23 A 4.2,4.2 0 0,1 -3.5,-26.5 A 4.2,4.2 0 0,1 -1.2,-30 L -1.2,-37 L 0,-40 L 1.2,-37 L 1.2,-30 A 4.2,4.2 0 0,1 3.5,-26.5 A 4.2,4.2 0 0,1 1.2,-23 L 1.2,-6 Z" 
                fill="url(#lumeFill)" 
                stroke="#E4E4E7" 
                strokeWidth="0.75" 
                filter="url(#chromalightGlow)"
              />
              {/* Mercedes logo star divider inside the circle */}
              <circle cx="0" cy="-26.5" r="3.2" fill="none" stroke="#52525B" strokeWidth="0.5" />
              <line x1="0" y1="-26.5" x2="0" y2="-29.7" stroke="#52525B" strokeWidth="0.55" />
              <line x1="0" y1="-26.5" x2="-2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
              <line x1="0" y1="-26.5" x2="2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
            </g>

            {/* Rolex Explorer Tapered Minute Hand */}
            <g transform={`rotate(${budgetAngle})`} className="pointer-events-none">
              {/* Silver outline shadow */}
              <path 
                d="M 0,0 L -1.5,-8 L -1.5,-55 L 0,-59 L 1.5,-55 L 1.5,-8 Z" 
                fill="#3F3F46" 
                className="opacity-40" 
                transform="translate(0, 0.5)"
              />
              {/* Main Hand body with Chromalight lume */}
              <path 
                d="M 0,0 L -1.1,-8 L -1.1,-54 L 0,-58 L 1.1,-54 L 1.1,-8 Z" 
                fill="url(#lumeFill)" 
                stroke="#E4E4E7" 
                strokeWidth="0.75" 
                filter="url(#chromalightGlow)"
              />
              {/* Center rib lines */}
              <line x1="0" y1="-8" x2="0" y2="-53" stroke="#52525B" strokeWidth="0.5" className="opacity-40" />
            </g>

            {/* Rolex Explorer Lollipop Second Hand (Mesmerizing Continuous Sweep) */}
            <g className="watch-second-hand-sweep pointer-events-none">
              {/* Main ultra-thin needle */}
              <line x1="0" y1="15" x2="0" y2="-66" stroke="#E2E8F0" strokeWidth="0.5" />
              
              {/* Lollipop luminescent bubble */}
              <circle cx="0" cy="-48" r="3.2" fill="url(#lumeFill)" stroke="#E4E4E7" strokeWidth="0.5" filter="url(#chromalightGlow)" />
              
              {/* Counterweight circular balance at the tail */}
              <circle cx="0" cy="12" r="1.5" fill="#E2E8F0" />
            </g>

            {/* Watch crown Position Anchor Core Center Button (Chronograph Style) */}
            <g 
              onPointerDown={(e) => {
                if (!selectedMode) {
                  handlePositionStart(e);
                }
              }}
              className="cursor-move group pointer-events-auto"
            >
              <circle r="24" fill="transparent" /> {/* Large catch target */}
              
              {/* Dropshadow for 3D depth */}
              <circle r="16.5" fill="#000" className="opacity-15 pointer-events-none" transform="translate(0, 1.5)" />
              
              {/* Outer high-polished steel collar/bezel */}
              <circle 
                r="15" 
                fill="url(#silverBezel)" 
                stroke="#4B5563" 
                strokeWidth="0.5" 
                className="transition-transform duration-200 group-hover:scale-105" 
              />
              
              {/* Machined outer teeth/ridges (minimal tactile detents for crown feel) */}
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
              
              {/* Inner bezel core rim */}
              <circle r="11" fill="#111827" stroke="#9CA3AF" strokeWidth="0.5" className="opacity-90" />
              
              {/* Dome crown cabochon face with precision-engraved target rings */}
              <circle r="8.5" fill="url(#crownGrad)" stroke="#111827" strokeWidth="0.5" />
              <circle r="5" fill="none" stroke="#374151" strokeWidth="0.5" className="opacity-40" />
              
              {/* Glowing or colored central jewel pivot (sapphire/teal dot) */}
              <circle r="2.5" fill="#14B8A6" className="opacity-90" />
              
              {/* Soft asymmetric light reflection on dome */}
              <circle r="4" fill="#FFFFFF" className="opacity-30" cx="-1.5" cy="-1.5" />
            </g>

            {/* Outer Dial Track Ring to Adjust Time limit (Rotatable Bezel Track) */}
            <circle 
              r="92" 
              fill="none" 
              stroke="transparent" 
              strokeWidth="20" 
              className="cursor-pointer pointer-events-auto"
              onPointerDown={(e) => {
                if (!selectedMode || selectedMode === 'time') {
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
                if (!selectedMode || selectedMode === 'budget') {
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

      {/* Manual Calibration Access longpress trigger helper text */}
      <div className="text-center text-[8.5px] text-[#8C8A7D] font-black uppercase tracking-widest py-0.5">
        ⚡ {t.longPressTip}
      </div>

      {/* Interactive Tooltips explaining sensory gesture inputs */}
      <div className="grid grid-cols-3 gap-2.5 py-1.5 z-10 select-none text-center">
        {/* POSITION button */}
        <button 
          onClick={() => {
            const next = selectedMode === 'position' ? null : 'position';
            setSelectedMode(next);
            triggerHapticProxy(15);
          }}
          className={`px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer flex flex-col items-center justify-center outline-none ${
            selectedMode === 'position' 
              ? 'bg-amber-50/80 border border-amber-500 border-b-[1px] translate-y-[3px] shadow-[inset_0_2px_4px_rgba(245,158,11,0.2)]' 
              : 'bg-gradient-to-b from-white to-[#FAF9F5] border border-[#D5D3C8] border-b-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_2px_0_#D5D3C8] hover:to-amber-50/10 hover:border-amber-400/40 active:translate-y-[2px] active:border-b-[2px]'
          }`}
        >
          <span className={`text-[13px] mb-1 transition-transform ${selectedMode === 'position' ? 'scale-90 translate-y-0.5' : 'scale-100'}`}>🎯</span>
          <span className={`text-[8.5px] font-black uppercase tracking-wider leading-none mb-0.5 ${selectedMode === 'position' ? 'text-amber-700' : 'text-brand-charcoal'}`}>POSITION</span>
          <span className="text-[7px] font-bold text-[#8C8A7D] leading-tight scale-90">{t.tipPosition}</span>
        </button>

        {/* BUDGET button */}
        <button 
          onClick={() => {
            const next = selectedMode === 'budget' ? null : 'budget';
            setSelectedMode(next);
            triggerHapticProxy(15);
          }}
          className={`px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer flex flex-col items-center justify-center outline-none ${
            selectedMode === 'budget' 
              ? 'bg-rose-50/80 border border-rose-500 border-b-[1px] translate-y-[3px] shadow-[inset_0_2px_4px_rgba(244,63,94,0.2)]' 
              : 'bg-gradient-to-b from-white to-[#FAF9F5] border border-[#D5D3C8] border-b-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_2px_0_#D5D3C8] hover:to-rose-50/10 hover:border-rose-400/40 active:translate-y-[2px] active:border-b-[2px]'
          }`}
        >
          <span className={`text-[13px] mb-1 transition-transform ${selectedMode === 'budget' ? 'scale-90 translate-y-0.5' : 'scale-100'}`}>📐</span>
          <span className={`text-[8.5px] font-black uppercase tracking-wider leading-none mb-0.5 ${selectedMode === 'budget' ? 'text-rose-700' : 'text-brand-charcoal'}`}>BUDGET</span>
          <span className="text-[7px] font-bold text-[#8C8A7D] leading-tight scale-90">{t.tipBudget}</span>
        </button>

        {/* TIME button */}
        <button 
          onClick={() => {
            const next = selectedMode === 'time' ? null : 'time';
            setSelectedMode(next);
            triggerHapticProxy(15);
          }}
          className={`px-1.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer flex flex-col items-center justify-center outline-none ${
            selectedMode === 'time' 
              ? 'bg-teal-50/80 border border-teal-500 border-b-[1px] translate-y-[3px] shadow-[inset_0_2px_4px_rgba(20,184,166,0.2)]' 
              : 'bg-gradient-to-b from-white to-[#FAF9F5] border border-[#D5D3C8] border-b-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.05),_0_2px_0_#D5D3C8] hover:to-teal-50/10 hover:border-teal-400/40 active:translate-y-[2px] active:border-b-[2px]'
          }`}
        >
          <span className={`text-[13px] mb-1 transition-transform ${selectedMode === 'time' ? 'scale-90 translate-y-0.5' : 'scale-100'}`}>⏱️</span>
          <span className={`text-[8.5px] font-black uppercase tracking-wider leading-none mb-0.5 ${selectedMode === 'time' ? 'text-teal-700' : 'text-brand-charcoal'}`}>TIME</span>
          <span className="text-[7px] font-bold text-[#8C8A7D] leading-tight scale-90">{t.tipTime}</span>
        </button>
      </div>

      {/* Direct Fine-Tuning Discoverability Bridge */}
      {onOpenFineTuning && (
        <button
          type="button"
          onClick={() => {
            onOpenFineTuning();
            triggerHapticProxy(10);
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#FAF9F5] border border-[#D5D3C8] hover:border-accent-teal/40 hover:bg-[#F5F3EB] text-brand-charcoal transition-all flex items-center justify-between text-xs font-bold cursor-pointer group shadow-xs outline-none select-none z-10"
        >
          <div className="flex items-center gap-2">
            <Sliders size={13} className="text-accent-teal" />
            <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold text-[#5C5A4D] group-hover:text-brand-charcoal">
              {isSr ? 'Precizno podešavanje (Klizači)' : isZh ? '精确数值微调 (滑块)' : 'Exact Fine-Tuning (Sliders)'}
            </span>
          </div>
          <span className="text-[9.5px] font-mono text-accent-teal font-extrabold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            <span>{isSr ? 'Otvori' : isZh ? '展开' : 'Open'}</span>
            <span>&rarr;</span>
          </span>
        </button>
      )}

      {/* Dynamic correlation explanatory modal */}
      <AnimatePresence>
        {showCorrelationModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" id="mood-orbit-correlation-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#FAF9F5] border-2 border-[#E3DFD5] w-full max-w-[360px] rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 flex flex-col relative text-left select-none"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowCorrelationModal(false);
                  triggerHapticProxy(10);
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal hover:bg-brand-charcoal/10 transition-colors cursor-pointer"
                id="close-mood-orbit-correlation-modal"
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
                    triggerHapticProxy(10);
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

      {/* Onboarding Tutorial HUD Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 right-3 bg-brand-charcoal/95 backdrop-blur-[6px] z-40 p-4 flex flex-col justify-between select-none pointer-events-auto text-white rounded-[20px] h-[175px] border border-white/10 shadow-2xl"
          >
            {/* Animated HUD Corner Brackets */}
            <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-amber-400" />
            <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-amber-400" />
            <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-amber-400" />
            <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-amber-400" />

            {/* Title */}
            <div className="flex justify-between items-center text-white pb-1.5 border-b border-white/10">
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-amber-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {t.guideTitle}
              </span>
            </div>

            {/* Simple Instructions list */}
            <div className="flex-1 flex flex-col justify-center space-y-1.5 py-1.5 text-left text-[9.5px] sm:text-[10px] font-medium leading-normal text-slate-200">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 text-xs leading-none">⏱️</span>
                <span>
                  {language === 'sr' ? (
                    <><strong>Vreme:</strong> Izaberite raspoloživo vreme rotiranjem prstena.</>
                  ) : language === 'zh' ? (
                    <><strong>可用时间:</strong> 通过旋转最外侧轨环来选择行程可用时间。</>
                  ) : (
                    <><strong>Time:</strong> Select time available by rotating the ring.</>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-amber-400 text-xs leading-none">💰</span>
                <span>
                  {language === 'sr' ? (
                    <><strong>Budžet:</strong> Podesite budžet povlačenjem prečnika unutra i spolja.</>
                  ) : language === 'zh' ? (
                    <><strong>预算上限:</strong> 通过向内或向外拉伸表壳以设置行旅预算。</>
                  ) : (
                    <><strong>Budget:</strong> Set the budget by pulling the diameter in and out.</>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-rose-400 text-xs leading-none">🎯</span>
                <span>
                  {language === 'sr' ? (
                    <><strong>Smer:</strong> Postavite centar tamo gde najbolje opisuje Vaše raspoloženje.</>
                  ) : language === 'zh' ? (
                    <><strong>旅行心情:</strong> 拖拽中心点，将其定位在最契合您当下心情的位置。</>
                  ) : (
                    <><strong>Mood:</strong> Place where best describes your current mood.</>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end pt-1.5 border-t border-white/10">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  triggerHapticProxy(12);
                  setShowOnboarding(false);
                  try {
                    safeStorage.setItem('idemo_mood_orbit_onboarding_seen', 'true');
                  } catch (err) {
                    console.warn(err);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="px-4 py-1 rounded-md bg-amber-500 text-brand-charcoal hover:bg-amber-400 font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1 cursor-pointer outline-none shadow-md shadow-amber-500/20 pointer-events-auto"
              >
                <span>{language === 'sr' ? 'U REDU' : language === 'zh' ? '我知道了' : 'Got it'}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
