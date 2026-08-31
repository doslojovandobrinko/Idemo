import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  Building2, 
  TreePine, 
  Wine, 
  Compass, 
  Move, 
  Maximize2, 
  RotateCw, 
  Bookmark, 
  Calendar as CalendarIcon, 
  Send, 
  FileText, 
  CheckCircle, 
  User, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { Recommendation } from '../types';
import { INITIAL_RECOMMENDATIONS } from '../constants';
import { getApprovedPrimaryMedia } from '../lib/recommendationMediaService';
import { resolveImage } from '../utils/assetHelper';

export const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
};

export const ONBOARDING_TRANSLATIONS: Record<string, any> = {
  en: {
    cards: [
      {
        eyebrow: "YOUR MOOD · YOUR TIME · YOUR PRIORITIES",
        title: "SET WHAT FITS YOU.",
        description: "Set your mood, budget and available time. IDEMO prioritises what fits you now.",
        actions: [
          { num: "1", verb: "MOVE", label: "Mood", icon: "Move" },
          { num: "2", verb: "RESIZE", label: "Budget", icon: "Maximize2" },
          { num: "3", verb: "ROTATE", label: "Time", icon: "RotateCw" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "MOVE · MOOD", 
            primary: "Position the Orb on the 2D grid to choose your travel mood.", 
            supporting: "Your position across Urban, Nature, Hedonist and Adventurer determines the type of recommendations selected and offered." 
          },
          { 
            num: "②", 
            heading: "RESIZE · BUDGET", 
            primary: "Resize the Orb to set your target budget.", 
            supporting: "Expanding or contracting the Orb sets your spending range, determining matching recommendation tiers." 
          },
          { 
            num: "③", 
            heading: "ROTATE · TIME", 
            primary: "Rotate the Orb dial to specify your available time.", 
            supporting: "Rotating the dial tells us how many hours you have so recommendations are fine-tuned to perfection." 
          }
        ],
        axis_urban: "URBAN",
        axis_nature: "NATURE",
        axis_hedonist: "HEDONIST",
        axis_adventurer: "ADVENTURER"
      },
      {
        eyebrow: "CURATED DISCOVERY",
        title: "FROM IDEA TO EXPERIENCE.",
        description: "Save what interests you, choose when, and ask for local help when you need it.",
        dest_badge: "CURATED EXPERIENCE",
        dest_title: "UVAC MEANDERS",
        dest_subtitle: "Nature • Western Serbia",
        actions: [
          { num: "1", verb: "SAVE", label: "Keep the experience", icon: "Bookmark" },
          { num: "2", verb: "PLAN", label: "Choose when", icon: "Calendar" },
          { num: "3", verb: "ASK", label: "Request local help", icon: "Send" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "SAVE · KEEP IT", 
            primary: "Found something you like? Save it.", 
            supporting: "It stays available while you continue exploring." 
          },
          { 
            num: "②", 
            heading: "PLAN · CHOOSE WHEN", 
            primary: "Add the experience to your Travel Plan.", 
            supporting: "Choose the date that works for your visit." 
          },
          { 
            num: "③", 
            heading: "ASK · LOCAL HELP", 
            primary: "Need help arranging it? Send a request.", 
            supporting: "Add your date, party details and what assistance you need." 
          }
        ],
        req_title: "YOUR REQUEST (EXAMPLE)",
        req_date_label: "DATE",
        req_date: "18 MAY",
        req_party_label: "PARTY",
        req_party: "2 PEOPLE",
        req_note_label: "NOTE",
        req_note: "PRIVATE GUIDE",
        matching_text: "MATCHING WITH A VERIFIED LOCAL PARTNER..."
      },
      {
        eyebrow: "YOU DECIDE WHAT HAPPENS NEXT.",
        title: "YOU DECIDE WHAT HAPPENS NEXT.",
        description: "Review what is proposed, choose what works, then connect directly with the verified partner.",
        partner_badge: "VERIFIED LOCAL PARTNER",
        available_badge: "AVAILABLE",
        partner_title: "Uvac Meanders",
        partner_sub: "Private guided experience",
        partner_schedule: "18 MAY • 09:00",
        partner_meta: "Private guide + local transport",
        partner_price: "€ 220",
        partner_price_sub: "for 2 people",
        partner_quote: "“Happy to arrange this for you.”",
        partner_btn: "VIEW RESPONSE >",
        actions: [
          { num: "1", verb: "REQUEST", label: "Send details", icon: "Send" },
          { num: "2", verb: "REVIEW", label: "Your proposal", icon: "FileText" },
          { num: "3", verb: "CONNECT", label: "You decide", icon: "User" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "REQUEST · SEND DETAILS", 
            primary: "Share your date and what local assistance you need.", 
            supporting: "Your request is matched with a qualified verified partner." 
          },
          { 
            num: "②", 
            heading: "REVIEW · YOUR PROPOSAL", 
            primary: "See the partner's availability and tailored arrangement.", 
            supporting: "Review details, price and a personal note before deciding." 
          },
          { 
            num: "③", 
            heading: "CONNECT · YOU DECIDE", 
            primary: "Choose what works and continue directly with the partner.", 
            supporting: "Confirm, ask for an alternative, or choose not to proceed." 
          }
        ],
        commercial_boundary: {
          title: "IDEMO INTRODUCES. YOU ARRANGE DIRECTLY.",
          subtitle: "You arrange directly with the partner.",
          text: "Booking, payment, and terms remain exclusively between you and the partner."
        }
      }
    ],
    start: "START EXPLORING >",
    next: "NEXT >",
    back: "Back",
    skip: "Skip",
    trust_line: "Zero registration. Preferences stay private on your device.",
    trust_ribbon: "PRIVACY BY DESIGN • CURATED EXPERIENCES • VERIFIED LOCAL EXPERTS",
    step_label: "STEP"
  },
  sr: {
    cards: [
      {
        eyebrow: "VAŠE RASPOLOŽENJE · VAŠE VREME · VAŠI PRIORITETI",
        title: "PODEŠAVANJE PO VAŠOJ MERI.",
        description: "Postavite raspoloženje, budžet i raspoloživo vreme. IDEMO ističe ono što vam sada najviše odgovara.",
        actions: [
          { num: "1", verb: "POMERI", label: "Raspoloženje", icon: "Move" },
          { num: "2", verb: "VELIČINA", label: "Budžet", icon: "Maximize2" },
          { num: "3", verb: "ROTIRAJ", label: "Vreme", icon: "RotateCw" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "POMERI · RASPOLOŽENJE", 
            primary: "Pozicionirajte Orbitu na 2D mreži za željeni stil putovanja.", 
            supporting: "Položaj između Grada, Prirode, Hedonizma i Avanture određuje vrstu preporuka koje se biraju i nude." 
          },
          { 
            num: "②", 
            heading: "VELIČINA · BUDŽET", 
            primary: "Promenite veličinu Orbite prema vašem planiranom budžetu.", 
            supporting: "Veličina kruga postavlja okvir troškova i određuje nivo i tip preporuka koje vam odgovaraju." 
          },
          { 
            num: "③", 
            heading: "ROTIRAJ · VREME", 
            primary: "Okrenite brojčanik Orbite za raspoloživo vreme.", 
            supporting: "Rotiranje označava koliko sati imate na raspolaganju kako bi se preporuke usavršile do savršenstva." 
          }
        ],
        axis_urban: "GRAD",
        axis_nature: "PRIRODA",
        axis_hedonist: "HEDONIZAM",
        axis_adventurer: "AVANTURA"
      },
      {
        eyebrow: "AUTENTIČNA ISKUSTVA",
        title: "OD INSPIRACIJE DO DOŽIVLJAJA.",
        description: "Sačuvajte šta vam se dopada, odaberite datum i zatražite lokalnu podršku kad god vam je potrebna.",
        dest_badge: "ODABRANO ISKUSTVO",
        dest_title: "MEANDRI UVCA",
        dest_subtitle: "Priroda • Zapadna Srbija",
        actions: [
          { num: "1", verb: "SAČUVAJ", label: "Zadržite iskustvo", icon: "Bookmark" },
          { num: "2", verb: "PLANIRAJ", label: "Izaberite datum", icon: "Calendar" },
          { num: "3", verb: "ZATRAŽI", label: "Lokalna pomoć", icon: "Send" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "SAČUVAJ · ZADRŽITE ISKUSTVO", 
            primary: "Pronašli ste nešto što vam se sviđa? Sačuvajte to.", 
            supporting: "Ostaje pri ruci dok nastavljate sa istraživanjem." 
          },
          { 
            num: "②", 
            heading: "PLANIRAJ · IZABERITE DATUM", 
            primary: "Dodajte iskustvo u vaš Plan Putovanja.", 
            supporting: "Izaberite datum koji najviše odgovara vašem rasporedu." 
          },
          { 
            num: "③", 
            heading: "ZATRAŽI · LOKALNA POMOĆ", 
            primary: "Potrebna vam je pomoć u organizaciji? Pošaljite upit.", 
            supporting: "Navedite datum, broj osoba i vrstu usluge koju tražite." 
          }
        ],
        req_title: "VAŠ UPIT (PRIMER)",
        req_date_label: "DATUM",
        req_date: "18. MAJ",
        req_party_label: "BROJ",
        req_party: "2 OSOBE",
        req_note_label: "NAPOMENA",
        req_note: "PRIVATNI VODIČ",
        matching_text: "POVEZIVANJE SA PROVERENIM LOKALNIM PARTNEROM..."
      },
      {
        eyebrow: "VI ODLUČUJETE ŠTA SLEDI.",
        title: "VI ODLUČUJETE ŠTA SLEDI.",
        description: "Pregledajte šta je predloženo, izaberite šta vam odgovara i povežite se direktno sa partnerom.",
        partner_badge: "PROVERENI LOKALNI PARTNER",
        available_badge: "DOSTUPNO",
        partner_title: "Meandri Uvca",
        partner_sub: "Privatno vođeno iskustvo",
        partner_schedule: "18. MAJ • 09:00",
        partner_meta: "Privatni vodič + lokalni prevoz",
        partner_price: "€ 220",
        partner_price_sub: "za 2 osobe",
        partner_quote: "“Rado ću ovo organizovati za vas.”",
        partner_btn: "PREGLED ODGOVORA >",
        actions: [
          { num: "1", verb: "ZATRAŽI", label: "Pošaljite detalje", icon: "Send" },
          { num: "2", verb: "PREGLED", label: "Vaš predlog", icon: "FileText" },
          { num: "3", verb: "KONTAKT", label: "Vi odlučujete", icon: "User" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "ZATRAŽI · POŠALJITE DETALJE", 
            primary: "Navedite kada putujete i kakva pomoć vam je potrebna.", 
            supporting: "Vaš upit se spaja sa odgovarajućim proverenim partnerom." 
          },
          { 
            num: "②", 
            heading: "PREGLED · VAŠ PREDLOG", 
            primary: "Pregledajte dostupnost partnera i predloženi aranžman.", 
            supporting: "Proverite detalje, cenu i ličnu poruku pre donošenja odluke." 
          },
          { 
            num: "③", 
            heading: "KONTAKT · VI ODLUČUJETE", 
            primary: "Izaberite šta vam odgovara i nastavite direktno sa partnerom.", 
            supporting: "Potvrdite, zatražite izmenu ili odlučite da ne nastavite." 
          }
        ],
        commercial_boundary: {
          title: "IDEMO INTRODUCES. YOU ARRANGE DIRECTLY.",
          subtitle: "Vi direktno dogovarate sa partnerom.",
          text: "Rezervacija, plaćanje i uslovi važe isključivo između vas i partnera."
        }
      }
    ],
    start: "ZAPOČNI ISTRAŽIVANJE >",
    next: "NASTAVI >",
    back: "Nazad",
    skip: "Preskoči",
    trust_line: "Bez registracije. Podešavanja ostaju privatna na vašem uređaju.",
    trust_ribbon: "PRIVATNOST PO DIZAJNU • ODABRANA ISKUSTVA • PROVERENI LOKALNI STRUČNJACI",
    step_label: "KORAK"
  },
  zh: {
    cards: [
      {
        eyebrow: "您的心境 · 您的时间 · 您的偏好",
        title: "随心调校。",
        description: "设置您的心境、预算与可用时间。IDEMO 将优先呈现最契合您当下的体验。",
        actions: [
          { num: "1", verb: "移动", label: "心境", icon: "Move" },
          { num: "2", verb: "缩放", label: "预算", icon: "Maximize2" },
          { num: "3", verb: "旋转", label: "时间", icon: "RotateCw" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "移动 · 心境定位", 
            primary: "在2D网格上移动灵感轨道以表达出行心境。", 
            supporting: "在都市、自然、享乐与探险之间的位置决定系统为您挑选与呈现的体验类型。" 
          },
          { 
            num: "②", 
            heading: "缩放 · 预算设定", 
            primary: "缩放灵感轨道以设定您的预期预算范围。", 
            supporting: "放大或缩小轨道设定消费区间，精准决定匹配的推荐体验档次。" 
          },
          { 
            num: "③", 
            heading: "旋转 · 时间微调", 
            primary: "旋转灵感轨道表盘以指定可用探索时间。", 
            supporting: "设定可用时间使 IDEMO 能够将个性化推荐微调至最佳状态。" 
          }
        ],
        axis_urban: "都市",
        axis_nature: "自然",
        axis_hedonist: "享乐",
        axis_adventurer: "探险"
      },
      {
        eyebrow: "深度甄选探索",
        title: "从灵感到真实体验。",
        description: "收藏心仪体验，选择出行时间，在需要时向 IDEMO 寻求本地专属协助。",
        dest_badge: "深度甄选体验",
        dest_title: "乌瓦茨峡谷曲流",
        dest_subtitle: "自然风光 • 塞尔维亚西部",
        actions: [
          { num: "1", verb: "收藏", label: "保留心仪体验", icon: "Bookmark" },
          { num: "2", verb: "规划", label: "选择出行时间", icon: "Calendar" },
          { num: "3", verb: "咨询", label: "获取本地支持", icon: "Send" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "收藏 · 随心保留", 
            primary: "发现心仪之选？即刻一键收藏。", 
            supporting: "在您继续探索其它体验时，已收藏项目将始终妥善保留。" 
          },
          { 
            num: "②", 
            heading: "规划 · 选定日期", 
            primary: "将该体验添加入您的专属旅行计划中。", 
            supporting: "选择最契合您出行节奏的专属日期。" 
          },
          { 
            num: "③", 
            heading: "咨询 · 本地支持", 
            primary: "需要行程协调？一键发送专属需求。", 
            supporting: "填写出行时间、同行人数及所需协助（自主可选）。" 
          }
        ],
        req_title: "您的专属需求（示例）",
        req_date_label: "日期",
        req_date: "5月18日",
        req_party_label: "人数",
        req_party: "2 位同行",
        req_note_label: "备注",
        req_note: "私人向导",
        matching_text: "正在为您匹配认证本土合作伙伴..."
      },
      {
        eyebrow: "行程节奏由您决定。",
        title: "行程节奏由您决定。",
        description: "审阅方案细节，选择心仪安排，随后与认证伙伴直接对接确认。",
        partner_badge: "认证本土合作伙伴",
        available_badge: "已确认空档",
        partner_title: "乌瓦茨峡谷曲流",
        partner_sub: "私人定制向导体验",
        partner_schedule: "5月18日 • 09:00",
        partner_meta: "专属私人向导 + 本地专属接送",
        partner_price: "€ 220",
        partner_price_sub: "2人合计",
        partner_quote: "“很高兴为您定制并安排这段行程。”",
        partner_btn: "查看方案详情 >",
        actions: [
          { num: "1", verb: "咨询", label: "发送细节", icon: "Send" },
          { num: "2", verb: "审阅", label: "定制方案", icon: "FileText" },
          { num: "3", verb: "直连", label: "由您定夺", icon: "User" }
        ],
        guidance: [
          { 
            num: "①", 
            heading: "咨询 · 发送细节", 
            primary: "告知您的出行时间与所需的本地协助。", 
            supporting: "您的需求将为您精准匹配经过官方认证的本土合作伙伴。" 
          },
          { 
            num: "②", 
            heading: "审阅 · 定制方案", 
            primary: "查看伙伴提供的空档排期与定制方案建议。", 
            supporting: "在做决定前，清晰审阅所有细节安排、透明报价与留言。" 
          },
          { 
            num: "③", 
            heading: "直连 · 由您定夺", 
            primary: "挑选心仪安排，随后直接与本土伙伴对接沟通。", 
            supporting: "确认安排、请求调整备选，或选择暂不推进。" 
          }
        ],
        commercial_boundary: {
          title: "IDEMO INTRODUCES. YOU ARRANGE DIRECTLY.",
          subtitle: "您与伙伴直接对接安排。",
          text: "所有预订、支付及服务条款均直接在您与合作伙伴之间达成。"
        }
      }
    ],
    start: "开始探索之旅 >",
    next: "继续 >",
    back: "返回",
    skip: "跳过",
    trust_line: "无需注册。偏好设置私密保留在您的个人设备中。",
    trust_ribbon: "原生隐私保护 • 深度甄选体验 • 值得信赖的本地专家",
    step_label: "步骤"
  }
};

export const CARD1_ARCHETYPES: Record<string, {
  balanced: string;
  cultural: string;
  wild: string;
  wellness: string;
  metropolis: string;
  label: string;
}> = {
  en: {
    balanced: "BALANCED VOYAGER",
    cultural: "CULTURAL STRATEGIST",
    wild: "WILD HORIZON EXPLORER",
    wellness: "WELLNESS SANCTUARY",
    metropolis: "METROPOLIS HEDONIST",
    label: "TYPE"
  },
  sr: {
    balanced: "BALANSIRANI NOMAD",
    cultural: "KULTURNI ISTRAŽIVAČ",
    wild: "AVANTURISTA NA TERENU",
    wellness: "OAZA SPOKOJA",
    metropolis: "GRADSKI HEDONISTA",
    label: "PROFIL"
  },
  zh: {
    balanced: "全能探索官",
    cultural: "文化探索官",
    wild: "荒野拓荒先锋",
    wellness: "林野康养行",
    metropolis: "都市臻奢派",
    label: "画像类型"
  }
};

export function OnboardingOverlay({
  language,
  recommendations,
  onClose,
  onRegisterBackHandler
}: {
  language: string;
  recommendations?: Recommendation[];
  onClose: () => void;
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [activeStepAnim, setActiveStepAnim] = useState<number>(1);
  const [card1X, setCard1X] = useState<number>(0.5);
  const [card1Y, setCard1Y] = useState<number>(0.5);
  const [card1Budget, setCard1Budget] = useState<number>(250);
  const [card1Time, setCard1Time] = useState<number>(24);
  const [card1QuadrantKey, setCard1QuadrantKey] = useState<'balanced' | 'cultural' | 'wild' | 'wellness' | 'metropolis'>('balanced');
  const [pauseAutoCycle, setPauseAutoCycle] = useState<boolean>(false);
  const shouldReduceMotion = useReducedMotion();

  const t = ONBOARDING_TRANSLATIONS[language] || ONBOARDING_TRANSLATIONS['en'];
  const archData = CARD1_ARCHETYPES[language] || CARD1_ARCHETYPES['en'];
  const current = t.cards[cardIndex];

  const recList = recommendations && recommendations.length > 0 ? recommendations : INITIAL_RECOMMENDATIONS;
  const uvacRec = recList.find(r => r.id === '1');
  const uvacImage = resolveImage(getApprovedPrimaryMedia('1', uvacRec?.image));

  // Handle manual step selection with temporary pause before resuming cycle
  const handleStepClick = useCallback((stepNum: number) => {
    triggerHaptic(5);
    setActiveStepAnim(stepNum);
    setPauseAutoCycle(true);
  }, []);

  const handleNext = () => {
    triggerHaptic(5);
    if (cardIndex < 2) {
      setDirection(1);
      setCardIndex(cardIndex + 1);
    } else {
      onClose();
    }
  };

  const handleBack = useCallback(() => {
    triggerHaptic(5);
    if (cardIndex > 0) {
      setDirection(-1);
      setCardIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [cardIndex]);

  useEffect(() => {
    if (onRegisterBackHandler) {
      if (cardIndex > 0) {
        onRegisterBackHandler(() => {
          return handleBack();
        });
      } else {
        onRegisterBackHandler(null);
      }
    }
    return () => {
      if (onRegisterBackHandler) {
        onRegisterBackHandler(null);
      }
    };
  }, [cardIndex, handleBack, onRegisterBackHandler]);

  // Continuous 1 -> 2 -> 3 loop engine across all onboarding cards
  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }
    if (pauseAutoCycle) {
      const pauseTimer = setTimeout(() => {
        setPauseAutoCycle(false);
        setActiveStepAnim(prev => (prev >= 3 ? 1 : prev + 1));
      }, 4000);
      return () => clearTimeout(pauseTimer);
    }

    // Step duration: Card 1 retains calibrated timing (Step 1 = 6200ms, Step 2 = 4500ms, Step 3 = 4500ms).
    // Cards 2 and 3 dwell time is 2600ms per step for crisp progression.
    const stepDuration = cardIndex === 0 
      ? (activeStepAnim === 1 ? 6200 : activeStepAnim === 2 ? 4500 : 4500)
      : 2600;

    const nextStepTimer = setTimeout(() => {
      setActiveStepAnim(prev => (prev >= 3 ? 1 : prev + 1));
    }, stepDuration);

    return () => clearTimeout(nextStepTimer);
  }, [cardIndex, activeStepAnim, pauseAutoCycle, shouldReduceMotion]);

  // Card 1 sub-step calibration updates for Coordinates, Archetype, Budget (€100 -> €500 -> €250) and Time (4h -> 8h -> 24h -> 48h -> 24h)
  useEffect(() => {
    if (cardIndex !== 0 || shouldReduceMotion) {
      setCard1X(0.5);
      setCard1Y(0.5);
      setCard1Budget(250);
      setCard1Time(24);
      setCard1QuadrantKey('balanced');
      return;
    }

    const subTimers: ReturnType<typeof setTimeout>[] = [];

    if (activeStepAnim === 1) {
      setCard1Budget(250);
      setCard1Time(24);
      setCard1X(0.5);
      setCard1Y(0.5);
      setCard1QuadrantKey('balanced');

      // Cultural (Adventurer + Urban)
      subTimers.push(setTimeout(() => {
        setCard1X(0.68);
        setCard1Y(0.32);
        setCard1QuadrantKey('cultural');
      }, 850));

      // Wild (Adventurer + Nature)
      subTimers.push(setTimeout(() => {
        setCard1X(0.68);
        setCard1Y(0.68);
        setCard1QuadrantKey('wild');
      }, 2050));

      // Wellness (Hedonist + Nature)
      subTimers.push(setTimeout(() => {
        setCard1X(0.32);
        setCard1Y(0.68);
        setCard1QuadrantKey('wellness');
      }, 3250));

      // Metropolis (Hedonist + Urban)
      subTimers.push(setTimeout(() => {
        setCard1X(0.32);
        setCard1Y(0.32);
        setCard1QuadrantKey('metropolis');
      }, 4450));

      // Balanced (Center)
      subTimers.push(setTimeout(() => {
        setCard1X(0.5);
        setCard1Y(0.5);
        setCard1QuadrantKey('balanced');
      }, 5650));
    } else if (activeStepAnim === 2) {
      setCard1X(0.5);
      setCard1Y(0.5);
      setCard1Time(24);
      setCard1QuadrantKey('balanced');
      setCard1Budget(250);

      // Step 2: Start neutral €250 -> contract to €100 -> expand to maximum €500 -> return to €250
      subTimers.push(setTimeout(() => {
        setCard1Budget(100);
      }, 700));
      subTimers.push(setTimeout(() => {
        setCard1Budget(500);
      }, 2000));
      subTimers.push(setTimeout(() => {
        setCard1Budget(250);
      }, 3300));
    } else if (activeStepAnim === 3) {
      setCard1X(0.5);
      setCard1Y(0.5);
      setCard1Budget(250);
      setCard1QuadrantKey('balanced');
      setCard1Time(4);

      // Step 3: Rotate Time (4h -> 8h -> 24h -> 48h -> 24h)
      subTimers.push(setTimeout(() => setCard1Time(8), 900));
      subTimers.push(setTimeout(() => setCard1Time(24), 1900));
      subTimers.push(setTimeout(() => setCard1Time(48), 2900));
      subTimers.push(setTimeout(() => setCard1Time(24), 3900));
    }

    return () => {
      subTimers.forEach(clearTimeout);
    };
  }, [cardIndex, activeStepAnim, shouldReduceMotion]);

  // Reset active step and pause on card navigation
  useEffect(() => {
    setActiveStepAnim(1);
    setPauseAutoCycle(false);
  }, [cardIndex]);

  const renderActionIcon = (iconName: string, className = "text-brand-charcoal stroke-[1.8]") => {
    switch (iconName) {
      case 'Move': return <Move size={22} className={className} />;
      case 'Maximize2': return <Maximize2 size={22} className={className} />;
      case 'RotateCw': return <RotateCw size={22} className={className} />;
      case 'Bookmark': return <Bookmark size={22} className={className} />;
      case 'Calendar': return <CalendarIcon size={22} className={className} />;
      case 'Send': return <Send size={22} className={className} />;
      case 'FileText': return <FileText size={22} className={className} />;
      case 'CheckCircle': return <CheckCircle size={22} className={className} />;
      case 'User': return <User size={22} className={className} />;
      default: return <Sparkles size={22} className={className} />;
    }
  };

  const handleGoTo = (idx: number) => {
    if (idx === cardIndex) return;
    triggerHaptic(5);
    setDirection(idx > cardIndex ? 1 : -1);
    setCardIndex(idx);
  };

  const handleDismiss = () => {
    triggerHaptic(5);
    onClose();
  };

  const cardVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 320, damping: 32 },
        opacity: { duration: 0.22, ease: "easeOut" }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 320, damping: 32 },
        opacity: { duration: 0.18, ease: "easeIn" }
      }
    })
  };

  const SNAP_TIMES = [4, 8, 12, 24, 28, 48];
  const SNAP_ANGLES = [0, 60, 120, 180, 240, 300];

  const computeAngleFromTime = (time: number) => {
    for (let i = 0; i < SNAP_TIMES.length - 1; i++) {
      if (time >= SNAP_TIMES[i] && time <= SNAP_TIMES[i + 1]) {
        const ratio = (time - SNAP_TIMES[i]) / (SNAP_TIMES[i + 1] - SNAP_TIMES[i]);
        return SNAP_ANGLES[i] + ratio * (SNAP_ANGLES[i + 1] - SNAP_ANGLES[i]);
      }
    }
    return 180;
  };

  const visualAngle = computeAngleFromTime(card1Time);
  const budgetAngle = ((card1Budget - 100) / 400) * 360;

  const centroids = useMemo(() => {
    const radB = ((visualAngle - 90) * Math.PI) / 180;
    const radT = ((visualAngle + 90) * Math.PI) / 180;
    const dist = 48;
    return {
      budgetX: dist * Math.cos(radB),
      budgetY: dist * Math.sin(radB),
      timeX: dist * Math.cos(radT),
      timeY: dist * Math.sin(radT)
    };
  }, [visualAngle]);

  const orbDiameter = useMemo(() => {
    const ratio = (card1Budget - 100) / 400;
    return 68 + ratio * 38; // 68px at €100, 87px at €250, 106px at €500
  }, [card1Budget]);

  const outerBezelWidth = useMemo(() => {
    const ratio = (card1Budget - 100) / 400;
    return 8 + ratio * 4;
  }, [card1Budget]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#FAF9F5] z-[110] flex flex-col justify-between p-3.5 sm:p-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-hidden h-[100dvh] w-full"
    >
      {/* TOP: Segmented Progress Bar & Step Tracker + Back / Skip */}
      <div className="flex-shrink-0 w-full space-y-2 pt-0.5 max-w-md mx-auto">
        {/* 3-Segment Solid Progress Bar with Tappable Step Selection */}
        <div className="flex gap-2 w-full">
          {[0, 1, 2].map(idx => (
            <button 
              key={idx}
              onClick={() => handleGoTo(idx)}
              aria-label={`Go to card ${idx + 1}`}
              className={`h-[4px] rounded-full flex-1 transition-all duration-300 cursor-pointer ${
                cardIndex === idx ? 'bg-[#23251E]' : 'bg-[#23251E]/15 hover:bg-[#23251E]/30'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-brand-charcoal/60">
          <div className="flex items-center gap-2">
            {cardIndex > 0 ? (
              <button
                onClick={handleBack}
                className="hover:text-brand-charcoal transition-colors cursor-pointer py-1 px-1.5 -ml-1 flex items-center gap-1 normal-case font-sans text-[11.5px] font-medium text-brand-charcoal/70 min-h-[44px]"
              >
                <ArrowLeft size={13} className="stroke-[2.2]" />
                <span>{t.back || "Back"}</span>
              </button>
            ) : (
              <span className="w-1" />
            )}
            <span>{t.step_label || "STEP"} {cardIndex + 1} / 3</span>
          </div>

          <button 
            onClick={handleDismiss}
            className="hover:text-brand-charcoal transition-colors cursor-pointer py-1 px-2.5 -mr-2 normal-case font-sans text-[11.5px] font-normal text-brand-charcoal/60 min-h-[44px] flex items-center"
          >
            {t.skip}
          </button>
        </div>
      </div>

      {/* Animated Container for the 3 Greeting Cards */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 my-1 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={cardIndex}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col justify-between space-y-2 min-h-0"
          >
            {/* ========================================================================= */}
            {/* 1. HERO VISUAL (~40-44% of Card Height)                                   */}
            {/* ========================================================================= */}

            {/* CARD 1 HERO VISUAL: Canonical Mood Orbit with Animated Calibration Sequence */}
            {cardIndex === 0 && (
              <div className="flex-shrink-0 w-full flex flex-col items-center space-y-1">
                {/* Live Quadrant Archetype Indicator */}
                <div className="w-full flex items-center justify-center min-h-[26px] pointer-events-none select-none">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={card1QuadrantKey}
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="flex items-center justify-center gap-2 text-center"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#8A1F1F] animate-pulse shrink-0" />
                      <span className="text-[18px] xs:text-[20px] font-mono font-black uppercase tracking-[0.06em] text-brand-charcoal leading-none">
                        {archData[card1QuadrantKey]}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Canonical 2D Grid - Exactly Matching Profile MoodOrbit */}
                <div className="w-full aspect-square max-w-[200px] xs:max-w-[220px] sm:max-w-[240px] max-h-[26vh] relative bg-white border border-[#D5D3C8] rounded-[24px] overflow-hidden select-none shadow-xs mx-auto flex items-center justify-center">
                  {/* Alignment Radar Reticles */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-[#D5D3C8]/45" />
                    <div className="absolute h-full w-[1px] bg-[#D5D3C8]/45" />
                  </div>

                  {/* Sensory Guide Circles */}
                  <div className="absolute inset-6 rounded-full border border-dashed border-[#D5D3C8]/25 pointer-events-none" />
                  <div className="absolute inset-16 rounded-full border border-[#D5D3C8]/15 pointer-events-none" />

                  {/* Top Axis: Urban */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[11px] xs:text-[12px] font-black uppercase tracking-[0.18em] text-brand-charcoal select-none pointer-events-none z-10 whitespace-nowrap">
                    {current.axis_urban} ↑
                  </div>

                  {/* Bottom Axis: Nature */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11px] xs:text-[12px] font-black uppercase tracking-[0.18em] text-brand-charcoal select-none pointer-events-none z-10 whitespace-nowrap">
                    ↓ {current.axis_nature}
                  </div>

                  {/* Left Axis: Hedonist */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-5 h-32 flex items-center justify-center z-10 select-none pointer-events-none">
                    <div className="text-[11px] xs:text-[12px] font-black uppercase tracking-[0.18em] text-brand-charcoal whitespace-nowrap -rotate-90 flex items-center gap-1">
                      <span className="rotate-90 inline-block">←</span>
                      <span>{current.axis_hedonist}</span>
                    </div>
                  </div>

                  {/* Right Axis: Adventurer */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-32 flex items-center justify-center z-10 select-none pointer-events-none">
                    <div className="text-[11px] xs:text-[12px] font-black uppercase tracking-[0.18em] text-brand-charcoal whitespace-nowrap rotate-90 flex items-center gap-1">
                      <span>{current.axis_adventurer}</span>
                      <span className="-rotate-90 inline-block">→</span>
                    </div>
                  </div>

                  {/* Canonical Horological Instrument Orb */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: `${card1X * 100}%`,
                      top: `${card1Y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${orbDiameter}px`,
                      height: `${orbDiameter}px`,
                    }}
                    transition={{
                      left: { type: "spring", stiffness: 180, damping: 22 },
                      top: { type: "spring", stiffness: 180, damping: 22 },
                      width: { type: "spring", stiffness: 220, damping: 24 },
                      height: { type: "spring", stiffness: 220, damping: 24 }
                    }}
                    className="z-20 cursor-pointer pointer-events-auto filter drop-shadow-md flex items-center justify-center"
                  >
                    <svg viewBox="-100 -100 200 200" className="w-full h-full select-none pointer-events-none overflow-visible">
                      <defs>
                        {/* Metallic Titanium Outer Ring Bezel */}
                        <linearGradient id="onboardingOrbBezel" x1="0" y1="0" x2="1" y2="1">
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
                        <linearGradient id="onboardingOrbTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>

                        {/* Rose Gold Budget Segment (Top-Right) */}
                        <linearGradient id="onboardingOrbBudget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card1Budget >= 300 ? "#FB7185" : "#FDA4AF"} />
                          <stop offset="100%" stopColor={card1Budget >= 300 ? "#E11D48" : "#F43F5E"} />
                        </linearGradient>

                        {/* Precision Crown Steel Bezel */}
                        <linearGradient id="onboardingOrbCrown" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="25%" stopColor="#D4D4D8" />
                          <stop offset="50%" stopColor="#71717A" />
                          <stop offset="75%" stopColor="#D4D4D8" />
                          <stop offset="100%" stopColor="#18181B" />
                        </linearGradient>

                        {/* Glass Convex Reflection Layer Highlight */}
                        <radialGradient id="onboardingOrbReflection" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </radialGradient>

                        {/* Sapphire glass AR Coating Sheen */}
                        <linearGradient id="onboardingOrbSapphire" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                          <stop offset="30%" stopColor="#818CF8" stopOpacity="0.04" />
                          <stop offset="70%" stopColor="#C084FC" stopOpacity="0" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
                        </linearGradient>

                        {/* Chromalight Glow Filter for Luxury Watch Luminescence */}
                        <filter id="onboardingOrbChroma" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur1" />
                          <feGaussianBlur in="SourceGraphic" stdDeviation="3.0" result="blur2" />
                          <feMerge>
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>

                        {/* Luminous paint gradient mimicking Rolex Chromalight */}
                        <linearGradient id="onboardingOrbLume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E0F2FE" />
                          <stop offset="60%" stopColor="#00F0FF" />
                          <stop offset="100%" stopColor="#0284C7" />
                        </linearGradient>

                        <style>{`
                          @keyframes onboardingSecondHandSweep {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                          }
                          .onboarding-second-hand-sweep {
                            transform-origin: 0px 0px;
                            animation: onboardingSecondHandSweep 60s linear infinite;
                          }
                        `}</style>
                      </defs>

                      {/* Time Segment base layer */}
                      <circle r="98" fill="url(#onboardingOrbTime)" stroke="#334155" strokeWidth="1" />

                      {/* Upper Budget segment overlaid & divided dynamically by organic wavy liquid line */}
                      <path 
                        d="M -90,0 C -45,12 45,-12 90,0 A 90,90 0 0,0 -90,0 Z" 
                        fill="url(#onboardingOrbBudget)" 
                        transform={`rotate(${visualAngle})`}
                      />

                      {/* Polished Metallic Beveled Divider on Dial Seam to split segments elegantly */}
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

                      {/* Rolex Explorer Fine 60-Minute Dial Track & Hourly Grade */}
                      {Array.from({ length: 60 }).map((_, i) => {
                        const angle = i * 6;
                        const isHourMarker = i % 5 === 0;
                        
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
                        fill="url(#onboardingOrbLume)" 
                        stroke="#E4E4E7" 
                        strokeWidth="0.5" 
                        filter="url(#onboardingOrbChroma)" 
                        className="pointer-events-none"
                      />

                      {/* Rolex Explorer High-Contrast 3, 6, 9 Numerals (Chromalight) */}
                      <text
                        x="73"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="url(#onboardingOrbLume)"
                        stroke="#E4E4E7"
                        strokeWidth="0.5"
                        filter="url(#onboardingOrbChroma)"
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
                        fill="url(#onboardingOrbLume)"
                        stroke="#E4E4E7"
                        strokeWidth="0.5"
                        filter="url(#onboardingOrbChroma)"
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
                        fill="url(#onboardingOrbLume)"
                        stroke="#E4E4E7"
                        strokeWidth="0.5"
                        filter="url(#onboardingOrbChroma)"
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
                              fill="url(#onboardingOrbLume)" 
                              stroke="#E4E4E7" 
                              strokeWidth="0.5" 
                              filter="url(#onboardingOrbChroma)" 
                              className="pointer-events-none"
                            />
                          </g>
                        );
                      })}

                      {/* Thick Bezel Ring Frame */}
                      <circle r={98 - outerBezelWidth / 2} fill="none" stroke="url(#onboardingOrbBezel)" strokeWidth={outerBezelWidth} className="opacity-85 pointer-events-none" />
                      
                      {/* Watch Bezel Hand-Polished Chamfer Ring */}
                      <circle r="97.5" fill="none" stroke="#FFFFFF" strokeWidth="0.75" className="opacity-60 pointer-events-none" />

                      {/* Inner dark bezel shadow step/rim separating bezel and dial face */}
                      <circle r={98 - outerBezelWidth} fill="none" stroke="#090d16" strokeWidth="1.25" className="opacity-35 pointer-events-none" />

                      {/* Mechanical Watch Crown Rotatable Indicator Pointer */}
                      <g transform={`rotate(${visualAngle}) translate(92, 0)`}>
                        <rect x="-6.5" y="-13" width="13" height="26" rx="2" fill="#000" className="opacity-15 pointer-events-none" transform="translate(1, 1)" />
                        <rect x="-6.5" y="-13" width="13" height="26" rx="2.5" fill="url(#onboardingOrbCrown)" stroke="#1F2937" strokeWidth="0.75" />
                        <circle r="2.5" fill="#14B8A6" stroke="#0D9488" strokeWidth="0.5" cx="0" cy="0" className="shadow-xs" />
                        <line x1="-4.5" y1="-9" x2="4.5" y2="-9" stroke="#374151" strokeWidth="0.75" />
                        <line x1="-4.5" y1="-6" x2="4.5" y2="-6" stroke="#374151" strokeWidth="0.75" />
                        <line x1="-4.5" y1="-3" x2="4.5" y2="-3" stroke="#374151" strokeWidth="0.75" />
                        <line x1="-4.5" y1="3" x2="4.5" y2="3" stroke="#374151" strokeWidth="0.75" />
                        <line x1="-4.5" y1="6" x2="4.5" y2="6" stroke="#374151" strokeWidth="0.75" />
                        <line x1="-4.5" y1="9" x2="4.5" y2="9" stroke="#374151" strokeWidth="0.75" />
                      </g>

                      {/* Live Value Readouts inside Segments */}
                      {/* 1. Symmetrically Centered Budget Segment Display */}
                      <g transform={`translate(${centroids.budgetX}, ${centroids.budgetY})`}>
                        <text
                          x="0"
                          y="-2"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#0F172A"
                          className="font-sans font-black select-none pointer-events-none opacity-40"
                          style={{ fontSize: '18.5px', letterSpacing: '-0.06em' }}
                        >
                          €{Math.round(card1Budget)}
                        </text>
                        <text
                          x="0"
                          y="-3"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#FFFFFF"
                          className="font-sans font-black select-none pointer-events-none"
                          style={{ fontSize: '18px', letterSpacing: '-0.06em' }}
                        >
                          €{Math.round(card1Budget)}
                        </text>
                        <text
                          x="0"
                          y="10.5"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#0F172A"
                          className="font-sans font-extrabold uppercase tracking-widest select-none pointer-events-none opacity-30"
                          style={{ fontSize: '7.5px' }}
                        >
                          BUDGET
                        </text>
                        <text
                          x="0"
                          y="10"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#FFFFFF"
                          className="font-sans font-extrabold uppercase tracking-widest select-none pointer-events-none opacity-75"
                          style={{ fontSize: '7.5px' }}
                        >
                          BUDGET
                        </text>
                      </g>

                      {/* 2. Symmetrically Centered Time Segment Display */}
                      <g transform={`translate(${centroids.timeX}, ${centroids.timeY})`}>
                        <text
                          x="0"
                          y="-2"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#0F172A"
                          className="font-sans font-black select-none pointer-events-none opacity-40"
                          style={{ fontSize: '18.5px', letterSpacing: '-0.06em' }}
                        >
                          {card1Time} h
                        </text>
                        <text
                          x="0"
                          y="-3"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#FFFFFF"
                          className="font-sans font-black select-none pointer-events-none"
                          style={{ fontSize: '18px', letterSpacing: '-0.06em' }}
                        >
                          {card1Time} h
                        </text>
                        <text
                          x="0"
                          y="10.5"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#0F172A"
                          className="font-sans font-extrabold uppercase tracking-widest select-none pointer-events-none opacity-30"
                          style={{ fontSize: '7.5px' }}
                        >
                          TIME
                        </text>
                        <text
                          x="0"
                          y="10"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#FFFFFF"
                          className="font-sans font-extrabold uppercase tracking-widest select-none pointer-events-none opacity-75"
                          style={{ fontSize: '7.5px' }}
                        >
                          TIME
                        </text>
                      </g>

                      {/* Rolex Explorer Mercedes Hour Hand */}
                      <g transform={`rotate(${visualAngle})`} className="pointer-events-none">
                        <path 
                          d="M 0,0 L -1.5,-6 L -1.5,-23 A 4.5,4.5 0 0,1 -4,-26.5 A 4.5,4.5 0 0,1 -1.5,-30.5 L -1.5,-38 L 0,-41 L 1.5,-38 L 1.5,-30.5 A 4.5,4.5 0 0,1 4,-26.5 A 4.5,4.5 0 0,1 1.5,-23 L 1.5,-6 Z" 
                          fill="#3F3F46" 
                          className="opacity-40" 
                          transform="translate(0, 0.5)"
                        />
                        <path 
                          d="M 0,0 L -1.2,-6 L -1.2,-23 A 4.2,4.2 0 0,1 -3.5,-26.5 A 4.2,4.2 0 0,1 -1.2,-30 L -1.2,-37 L 0,-40 L 1.2,-37 L 1.2,-30 A 4.2,4.2 0 0,1 3.5,-26.5 A 4.2,4.2 0 0,1 1.2,-23 L 1.2,-6 Z" 
                          fill="url(#onboardingOrbLume)" 
                          stroke="#E4E4E7" 
                          strokeWidth="0.75" 
                          filter="url(#onboardingOrbChroma)" 
                        />
                        <circle cx="0" cy="-26.5" r="3.2" fill="none" stroke="#52525B" strokeWidth="0.5" />
                        <line x1="0" y1="-26.5" x2="0" y2="-29.7" stroke="#52525B" strokeWidth="0.55" />
                        <line x1="0" y1="-26.5" x2="-2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
                        <line x1="0" y1="-26.5" x2="2.77" y2="-24.9" stroke="#52525B" strokeWidth="0.55" />
                      </g>

                      {/* Rolex Explorer Tapered Minute Hand */}
                      <g transform={`rotate(${budgetAngle})`} className="pointer-events-none">
                        <path 
                          d="M 0,0 L -1.5,-8 L -1.5,-55 L 0,-59 L 1.5,-55 L 1.5,-8 Z" 
                          fill="#3F3F46" 
                          className="opacity-40" 
                          transform="translate(0, 0.5)"
                        />
                        <path 
                          d="M 0,0 L -1.1,-8 L -1.1,-54 L 0,-58 L 1.1,-54 L 1.1,-8 Z" 
                          fill="url(#onboardingOrbLume)" 
                          stroke="#E4E4E7" 
                          strokeWidth="0.75" 
                          filter="url(#onboardingOrbChroma)" 
                        />
                        <line x1="0" y1="-8" x2="0" y2="-53" stroke="#52525B" strokeWidth="0.5" className="opacity-40" />
                      </g>

                      {/* Rolex Explorer Lollipop Second Hand (Mesmerizing Continuous Sweep) */}
                      <g className="pointer-events-none onboarding-second-hand-sweep">
                        <line x1="0" y1="15" x2="0" y2="-66" stroke="#E2E8F0" strokeWidth="0.5" />
                        <circle cx="0" cy="-48" r="3.2" fill="url(#onboardingOrbLume)" stroke="#E4E4E7" strokeWidth="0.5" filter="url(#onboardingOrbChroma)" />
                        <circle cx="0" cy="12" r="1.5" fill="#E2E8F0" />
                      </g>

                      {/* Watch crown Position Anchor Core Center Button (Chronograph Style) */}
                      <g className="pointer-events-none">
                        <circle r="15" fill="url(#onboardingOrbBezel)" stroke="#4B5563" strokeWidth="0.5" />
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
                        <circle r="8.5" fill="url(#onboardingOrbCrown)" stroke="#111827" strokeWidth="0.5" />
                        <circle r="5" fill="none" stroke="#374151" strokeWidth="0.5" className="opacity-40" />
                        <circle r="2.5" fill="#14B8A6" className="opacity-90" />
                        <circle r="4" fill="#FFFFFF" className="opacity-30" cx="-1.5" cy="-1.5" />
                      </g>

                      {/* Sapphire glass and convex reflection overlays */}
                      <circle r="96" fill="url(#onboardingOrbReflection)" className="pointer-events-none mix-blend-overlay" />
                      <circle r="96" fill="url(#onboardingOrbSapphire)" className="pointer-events-none mix-blend-screen" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            )}

            {/* CARD 2 HERO VISUAL: Curated Discovery (Uvac Meanders + Interactive Simulation) */}
            {cardIndex === 1 && (
              <div className="flex-shrink-0 w-full flex flex-col items-center space-y-1">
                <div className="w-full h-[180px] xs:h-[205px] sm:h-[220px] max-h-[30vh] rounded-[20px] bg-white border border-[#E2DFC2]/80 relative overflow-hidden flex flex-col justify-between p-3 select-none shadow-xs">
                  {/* Background Image with elegant overlay */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={uvacImage} 
                      alt="Uvac" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.fallbackTried) {
                          target.dataset.fallbackTried = 'true';
                          target.src = '/assets/images/uvac_meanders_1778841048759.png';
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#23251E]/90 via-[#23251E]/40 to-transparent" />
                  </div>

                  {/* Top Bar inside Card 2 Image */}
                  <div className="relative z-10 flex justify-between items-center w-full">
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF9F5]/90 backdrop-blur-xs text-[9px] font-mono font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1">
                      <Sparkles size={11} className="text-[#8A1F1F]" />
                      {current.dest_badge}
                    </span>
                    <motion.div 
                      animate={{ scale: activeStepAnim === 1 ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 0.5 }}
                      className={`p-1.5 rounded-full backdrop-blur-xs transition-colors ${
                        activeStepAnim === 1 ? 'bg-[#8A1F1F] text-white' : 'bg-white/70 text-brand-charcoal'
                      }`}
                    >
                      <Bookmark size={13} className={activeStepAnim === 1 ? 'fill-current' : ''} />
                    </motion.div>
                  </div>

                  {/* Dynamic Simulation Body inside Card 2 */}
                  <div className="relative z-10 w-full space-y-1 text-white">
                    {activeStepAnim < 3 ? (
                      <div>
                        <h4 className="text-[16px] xs:text-[18px] font-mono font-black uppercase tracking-wider leading-tight drop-shadow-xs">
                          {current.dest_title}
                        </h4>
                        <p className="text-[11px] font-sans text-white/80">
                          {current.dest_subtitle}
                        </p>
                        {activeStepAnim === 2 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FAF9F5] text-brand-charcoal text-[10px] font-mono font-bold"
                          >
                            <CalendarIcon size={12} className="text-[#8A1F1F]" />
                            <span>18 MAY • PROPOSED DATE</span>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#FAF9F5]/95 backdrop-blur-xs p-2.5 rounded-xl text-brand-charcoal border border-white/60 shadow-md space-y-1.5"
                      >
                        <div className="flex justify-between items-center border-b border-brand-charcoal/10 pb-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8A1F1F]">
                            {current.req_title}
                          </span>
                          <span className="text-[9px] font-mono text-brand-charcoal/70">
                            {current.req_date}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                          <div>
                            <span className="text-[8.5px] font-mono text-brand-charcoal/50 uppercase block">{current.req_party_label}</span>
                            <span className="font-bold text-brand-charcoal">{current.req_party}</span>
                          </div>
                          <div>
                            <span className="text-[8.5px] font-mono text-brand-charcoal/50 uppercase block">{current.req_note_label}</span>
                            <span className="font-bold text-brand-charcoal">{current.req_note}</span>
                          </div>
                        </div>
                        <div className="pt-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-[#8A1F1F] uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8A1F1F]" />
                          <span>{current.matching_text}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CARD 3 HERO VISUAL: You Decide What Happens Next (Partner Proposal & Commercial Boundary) */}
            {cardIndex === 2 && (
              <div className="flex-shrink-0 w-full flex flex-col items-center space-y-1.5">
                {/* Verified Partner Proposal Card */}
                <div className="w-full rounded-[18px] bg-white border border-[#E2DFC2]/90 p-3 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E2DFC2] text-[9px] font-mono font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1">
                      <ShieldCheck size={11} className="text-[#8A1F1F]" />
                      {current.partner_badge}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[8.5px] uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {current.available_badge}
                    </span>
                  </div>

                  <div className="flex justify-between items-start pt-0.5">
                    <div>
                      <h4 className="text-[13px] font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                        {current.partner_title}
                      </h4>
                      <p className="text-[10px] font-sans text-brand-charcoal/70">
                        {current.partner_sub}
                      </p>
                      <div className="flex items-center gap-1 text-[9.5px] font-mono text-brand-charcoal/60 mt-0.5">
                        <Clock size={10} />
                        <span>{current.partner_schedule}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-mono font-black text-[#8A1F1F] block leading-none">
                        {current.partner_price}
                      </span>
                      <span className="text-[8.5px] font-sans text-brand-charcoal/60 block">
                        {current.partner_price_sub}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2DFC2]/60 text-[10px] font-sans text-brand-charcoal/80 italic">
                    {current.partner_quote}
                  </div>
                </div>

                {/* Commercial Boundary Guarantee Box */}
                {current.commercial_boundary && (
                  <div className="w-full bg-[#23251E]/5 rounded-xl p-2 border border-[#23251E]/10 text-center">
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-brand-charcoal block">
                      {current.commercial_boundary.title}
                    </span>
                    <span className="text-[9px] font-sans text-brand-charcoal/70 block mt-0.5">
                      {current.commercial_boundary.text}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. CARD HEADLINE & COPY                                                   */}
            {/* ========================================================================= */}
            <div className="w-full text-center space-y-0.5 px-2">
              <span className="text-[9.5px] font-mono font-bold uppercase tracking-[0.14em] text-[#8A1F1F]">
                {current.eyebrow}
              </span>
              <h3 className="text-[17px] xs:text-[19px] sm:text-[21px] font-mono font-black uppercase tracking-tight text-brand-charcoal leading-tight">
                {current.title}
              </h3>
              <p className="text-[11.5px] font-sans text-brand-charcoal/75 max-w-sm mx-auto leading-snug">
                {current.description}
              </p>
            </div>

            {/* ========================================================================= */}
            {/* 3. 3-ACTION SELECTOR PILLS                                                */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-3 gap-1.5 w-full">
              {current.actions.map((act: any, aIdx: number) => {
                const stepNum = aIdx + 1;
                const isActive = activeStepAnim === stepNum;
                return (
                  <button
                    key={aIdx}
                    onClick={() => handleStepClick(stepNum)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer min-h-[58px] ${
                      isActive 
                        ? 'bg-[#23251E] text-white border-[#23251E] shadow-sm' 
                        : 'bg-white text-brand-charcoal border-[#E2DFC2]/80 hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="mb-1">
                      {renderActionIcon(act.icon, isActive ? 'text-white stroke-[2]' : 'text-brand-charcoal stroke-[1.8]')}
                    </div>
                    <div className="flex items-center gap-1 leading-none">
                      <span className={`text-[8.5px] font-mono font-bold ${isActive ? 'text-white/60' : 'text-[#8A1F1F]'}`}>
                        {act.num}
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                        {act.verb}
                      </span>
                    </div>
                    <span className={`text-[8.5px] font-sans truncate w-full text-center mt-0.5 ${isActive ? 'text-white/80' : 'text-brand-charcoal/60'}`}>
                      {act.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ========================================================================= */}
            {/* 4. DYNAMIC SYNCHRONIZED GUIDANCE PANEL                                    */}
            {/* ========================================================================= */}
            {current.guidance && current.guidance[activeStepAnim - 1] && (
              <div className="w-full bg-white rounded-xl border border-[#E2DFC2]/80 p-2.5 shadow-2xs">
                <div className="flex items-start gap-2">
                  <span className="text-[13px] font-mono font-bold text-[#8A1F1F] leading-none mt-0.5 shrink-0">
                    {current.guidance[activeStepAnim - 1].num}
                  </span>
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                      {current.guidance[activeStepAnim - 1].heading}
                    </h5>
                    <p className="text-[10.5px] font-sans text-brand-charcoal/90 leading-tight">
                      {current.guidance[activeStepAnim - 1].primary}
                    </p>
                    <p className="text-[9.5px] font-sans text-brand-charcoal/60 leading-tight">
                      {current.guidance[activeStepAnim - 1].supporting}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM: PRIVACY / TRUST LINE & CTA BUTTON                                 */}
      {/* ========================================================================= */}
      <div className="flex-shrink-0 w-full space-y-2 pt-1 max-w-md mx-auto">
        <p className="text-[9px] font-sans text-center text-brand-charcoal/60">
          {t.trust_line}
        </p>

        <button
          onClick={handleNext}
          className="w-full py-3 px-4 rounded-xl bg-[#23251E] hover:bg-black text-white font-mono font-bold text-[12px] uppercase tracking-[0.14em] shadow-md transition-all active:scale-[0.99] cursor-pointer min-h-[44px] flex items-center justify-center"
        >
          {cardIndex < 2 ? t.next : t.start}
        </button>
      </div>
    </motion.div>
  );
}

export default OnboardingOverlay;
