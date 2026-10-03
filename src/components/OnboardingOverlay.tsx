import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  ShieldCheck,
  Lock,
  ArrowRight,
  Footprints,
  Heart
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
        eyebrow: "YOUR TRIP · YOUR WAY",
        title: "Your trip. Your way.",
        subtitle: "Set what fits you.",
        description: "Adjust your mood, budget and time. IDEMO finds experiences that match.",
        actions: [
          { num: "1", verb: "MOVE", label: "Mood", icon: "Move" },
          { num: "2", verb: "RESIZE", label: "Budget", icon: "Maximize2" },
          { num: "3", verb: "ROTATE", label: "Time", icon: "RotateCw" }
        ],
        guidance: [
          "Position the Orb to set your travel mood. Urban, Nature, Hedonist or Adventurer.",
          "Resize the Orb to set your target budget and spending range.",
          "Rotate the Orb dial to specify your available hours."
        ],
        axis_urban: "URBAN",
        axis_nature: "NATURE",
        axis_hedonist: "HEDONIST",
        axis_adventurer: "ADVENTURER"
      },
      {
        eyebrow: "CURATED DISCOVERY",
        title: "From idea to experience.",
        subtitle: "Discover and shape your journey.",
        description: "Save, plan or ask for local help.",
        dest_badge: "NATURE",
        dest_title: "Uvac Meanders",
        dest_subtitle: "Western Serbia",
        actions: [
          { num: "1", verb: "SAVE", label: "Keep it", icon: "Bookmark" },
          { num: "2", verb: "PLAN", label: "Choose when", icon: "Calendar" },
          { num: "3", verb: "ASK", label: "Get local help", icon: "Send" }
        ],
        guidance: [
          "Found something you like? Save it. It stays available while you continue exploring.",
          "Add the experience to your Travel Plan and choose when to go.",
          "Send a request for local help, guide, or transport assistance."
        ],
        req_title: "YOUR REQUEST",
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
        title: "You decide what happens next.",
        subtitle: "Review proposals and connect directly.",
        description: "Review proposals and connect directly with verified local partners.",
        partner_badge: "VERIFIED LOCAL PARTNER",
        available_badge: "AVAILABLE",
        partner_title: "Uvac Meanders",
        partner_sub: "Private guided experience",
        partner_schedule: "18 MAY • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "for 2 people",
        partner_quote: "“Happy to arrange this for you.”",
        actions: [
          { num: "1", verb: "REQUEST", label: "Send details", icon: "Send" },
          { num: "2", verb: "REVIEW", label: "See proposal", icon: "FileText" },
          { num: "3", verb: "CONNECT", label: "You decide", icon: "User" }
        ],
        guidance: [
          "Share your travel date and what assistance you need.",
          "See the partner's availability, quote, and tailored arrangement.",
          "Connect directly to confirm, ask questions, or choose not to proceed."
        ],
        commercial_boundary: {
          title: "IDEMO INTRODUCES. YOU ARRANGE DIRECTLY.",
          text: "Booking, payment, and terms remain exclusively between you and the partner."
        }
      }
    ],
    start: "START EXPLORING",
    next: "NEXT",
    back: "Back",
    skip: "Skip",
    trust_line: "Zero registration. Preferences stay private on your device.",
    step_label: "STEP"
  },
  sr: {
    cards: [
      {
        eyebrow: "VAŠE PUTOVANJE · VAŠ NAČIN",
        title: "Vaše putovanje. Vaš način.",
        subtitle: "Podesite ono što Vam odgovara.",
        description: "Podesite raspoloženje, budžet i vreme. IDEMO pronalazi iskustva po Vašoj meri.",
        actions: [
          { num: "1", verb: "POMERI", label: "Raspoloženje", icon: "Move" },
          { num: "2", verb: "VELIČINA", label: "Budžet", icon: "Maximize2" },
          { num: "3", verb: "ROTIRAJ", label: "Vreme", icon: "RotateCw" }
        ],
        guidance: [
          "Pozicionirajte Orbitu na mreži za željeni stil: Grad, Priroda, Hedonizam ili Avantura.",
          "Promenite veličinu Orbite prema Vašem planiranom budžetu.",
          "Okrenite brojčanik Orbite za raspoložive sate."
        ],
        axis_urban: "GRAD",
        axis_nature: "PRIRODA",
        axis_hedonist: "HEDONIZAM",
        axis_adventurer: "AVANTURA"
      },
      {
        eyebrow: "KUSTOSKO OTKRIĆE",
        title: "Od ideje do iskustva.",
        subtitle: "Otkrijte i oblikujte Vaše putovanje.",
        description: "Sačuvajte, planirajte ili zatražite lokalnu pomoć.",
        dest_badge: "PRIRODA",
        dest_title: "Meandri Uvca",
        dest_subtitle: "Zapadna Srbija",
        actions: [
          { num: "1", verb: "SAČUVAJ", label: "Zadrži", icon: "Bookmark" },
          { num: "2", verb: "PLANIRAJ", label: "Izaberi kada", icon: "Calendar" },
          { num: "3", verb: "PITAJ", label: "Lokalna pomoć", icon: "Send" }
        ],
        guidance: [
          "Sviđa Vam se iskustvo? Sačuvajte ga za kasnije istraživanje.",
          "Dodajte iskustvo u Plan putovanja i izaberite datum posete.",
          "Pošaljite upit za lokalnog vodiča ili organizaciju."
        ],
        req_title: "VAŠ UPIT",
        req_date_label: "DATUM",
        req_date: "18 MAJ",
        req_party_label: "GUEST",
        req_party: "2 OSOBE",
        req_note_label: "NAPOMENA",
        req_note: "PRIVATNI VODIČ",
        matching_text: "POVEZIVANJE SA PROVERENIM LOKALNIM PARTNEROM..."
      },
      {
        eyebrow: "VI ODLUČUJETE ŠTA SLEDI.",
        title: "Vi odlučujete šta sledi.",
        subtitle: "Pregledajte ponudu i povežite se direktno.",
        description: "Pregledajte ponude i povežite se direktno sa proverenim lokalnim partnerima.",
        partner_badge: "PROVERENI LOKALNI PARTNER",
        available_badge: "DOSTUPNO",
        partner_title: "Meandri Uvca",
        partner_sub: "Privatno vođeno iskustvo",
        partner_schedule: "18 MAJ • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "za 2 osobe",
        partner_quote: "“Rado ćemo organizovati ovo za Vas.”",
        actions: [
          { num: "1", verb: "UPIT", label: "Pošalji detalje", icon: "Send" },
          { num: "2", verb: "PREGLED", label: "Pogledaj ponudu", icon: "FileText" },
          { num: "3", verb: "KONEKCIJA", label: "Vi odlučujete", icon: "User" }
        ],
        guidance: [
          "Podelite Vaš datum i potrebne detalje sa partnerom.",
          "Pregledajte dostupnost, cenu i personalizovani predlog.",
          "Direktno potvrdite, postavite pitanje ili odustanite."
        ],
        commercial_boundary: {
          title: "IDEMO POVEZUJE. VI DOGOVARATE DIREKTNO.",
          text: "Rezervacija, plaćanje i uslovi ostaju isključivo između Vas i partnera."
        }
      }
    ],
    start: "ZAPOČNI ISTRAŽIVANJE",
    next: "DALJE",
    back: "Nazad",
    skip: "Preskoči",
    trust_line: "Bez registracije. Podešavanja ostaju privatna na Vašem uređaju.",
    step_label: "KORAK"
  },
  de: {
    cards: [
      {
        eyebrow: "IHRE REISE · IHR WEG",
        title: "Ihre Reise. Ihr Weg.",
        subtitle: "Passen Sie alles an.",
        description: "Stimmen Sie Stimmung, Budget und Zeit ab. IDEMO findet passende Erlebnisse.",
        actions: [
          { num: "1", verb: "STIMMUNG", label: "Profil", icon: "Move" },
          { num: "2", verb: "BUDGET", label: "Rahmen", icon: "Maximize2" },
          { num: "3", verb: "ZEIT", label: "Dauer", icon: "RotateCw" }
        ],
        guidance: [
          "Positionieren Sie den Orb auf dem Raster für Ihre Reisestimmung.",
          "Passen Sie die Orb-Größe an Ihr geplantes Budget an.",
          "Drehen Sie das Orb-Zifferblatt für Ihre verfügbaren Stunden."
        ],
        axis_urban: "STADT",
        axis_nature: "NATUR",
        axis_hedonist: "GENUSS",
        axis_adventurer: "ABENTEUER"
      },
      {
        eyebrow: "KURATIERTE ENTDECKUNG",
        title: "Von der Idee zum Erlebnis.",
        subtitle: "Gestalten Sie Ihre Reise.",
        description: "Speichern, planen oder lokale Hilfe anfragen.",
        dest_badge: "NATUR",
        dest_title: "Uvac-Mäander",
        dest_subtitle: "Westserbien",
        actions: [
          { num: "1", verb: "MERKEN", label: "Speichern", icon: "Bookmark" },
          { num: "2", verb: "PLANEN", label: "Termin", icon: "Calendar" },
          { num: "3", verb: "FRAGEN", label: "Lokale Hilfe", icon: "Send" }
        ],
        guidance: [
          "Gefällt Ihnen ein Erlebnis? Speichern Sie es für später.",
          "Fügen Sie das Erlebnis Ihrem Reiseplan hinzu.",
          "Senden Sie eine Anfrage für lokale Unterstützung oder Guides."
        ],
        req_title: "IHRE ANFRAGE",
        req_date_label: "DATUM",
        req_date: "18. MAI",
        req_party_label: "PERSONEN",
        req_party: "2 PERSONEN",
        req_note_label: "NOTIZ",
        req_note: "PRIVATER GUIDE",
        matching_text: "MATCHING MIT VERIFIZIERTEM PARTNER..."
      },
      {
        eyebrow: "SIE ENTSCHEIDEN.",
        title: "Sie entscheiden, was passiert.",
        subtitle: "Angebote prüfen und direkt verbinden.",
        description: "Prüfen Sie Angebote und verbinden Sie sich direkt mit verifizierten Partnern.",
        partner_badge: "VERIFIZIERTER LOKALER PARTNER",
        available_badge: "VERFÜGBAR",
        partner_title: "Uvac-Mäander",
        partner_sub: "Private geführte Tour",
        partner_schedule: "18. MAI • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "für 2 Personen",
        partner_quote: "“Gerne organisieren wir das für Sie.”",
        actions: [
          { num: "1", verb: "ANFRAGE", label: "Details", icon: "Send" },
          { num: "2", verb: "PRÜFEN", label: "Angebot", icon: "FileText" },
          { num: "3", verb: "VERBINDEN", label: "Sie entscheiden", icon: "User" }
        ],
        guidance: [
          "Teilen Sie Ihr Datum und Ihre Wünsche mit dem Partner.",
          "Erhalten Sie Verfügbarkeit, Preis und maßgeschneiderte Details.",
          "Verbinden Sie sich direkt zur Bestätigung oder lehnen Sie ab."
        ],
        commercial_boundary: {
          title: "IDEMO VERMITTELT. SIE VEREINBAREN DIREKT.",
          text: "Buchung, Zahlung und Bedingungen bleiben exklusiv zwischen Ihnen und dem Partner."
        }
      }
    ],
    start: "ENTDECKUNG STARTEN",
    next: "WEITER",
    back: "Zurück",
    skip: "Überspringen",
    trust_line: "Keine Registrierung. Einstellungen bleiben privat auf Ihrem Gerät.",
    step_label: "SCHRITT"
  },
  es: {
    cards: [
      {
        eyebrow: "TU VIAJE · TU ESTILO",
        title: "Tu viaje. Tu estilo.",
        subtitle: "Ajusta lo que te conviene.",
        description: "Ajusta tu ánimo, presupuesto y tiempo. IDEMO encuentra experiencias a tu medida.",
        actions: [
          { num: "1", verb: "MOVER", label: "Ánimo", icon: "Move" },
          { num: "2", verb: "TAMAÑO", label: "Presupuesto", icon: "Maximize2" },
          { num: "3", verb: "ROTAR", label: "Tiempo", icon: "RotateCw" }
        ],
        guidance: [
          "Posiciona el Orb para elegir tu estilo: Urbano, Naturaleza, Hedonismo o Aventura.",
          "Cambia el tamaño del Orb según tu presupuesto planificado.",
          "Gira el dial del Orb para especificar tus horas disponibles."
        ],
        axis_urban: "URBANO",
        axis_nature: "NATURALEZA",
        axis_hedonist: "HEDONISMO",
        axis_adventurer: "AVENTURA"
      },
      {
        eyebrow: "DESCUBRIMIENTO SELECCIONADO",
        title: "De la idea a la experiencia.",
        subtitle: "Diseña tu viaje paso a paso.",
        description: "Guarda, planifica o solicita ayuda local.",
        dest_badge: "NATURALEZA",
        dest_title: "Meandros del Uvac",
        dest_subtitle: "Serbia Occidental",
        actions: [
          { num: "1", verb: "GUARDAR", label: "Conservar", icon: "Bookmark" },
          { num: "2", verb: "PLANEAR", label: "Elegir fecha", icon: "Calendar" },
          { num: "3", verb: "PEDIR", label: "Ayuda local", icon: "Send" }
        ],
        guidance: [
          "¿Te gusta una experiencia? Guárdala para explorarla después.",
          "Añade la experiencia a tu Plan de Viaje y elige tu fecha.",
          "Envía una solicitud para guía privado o transporte local."
        ],
        req_title: "TU SOLICITUD",
        req_date_label: "FECHA",
        req_date: "18 MAYO",
        req_party_label: "PERSONAS",
        req_party: "2 PERSONAS",
        req_note_label: "NOTA",
        req_note: "GUÍA PRIVADO",
        matching_text: "CONECTANDO CON UN SOCIO LOCAL VERIFICADO..."
      },
      {
        eyebrow: "TÚ DECIDES EL SIGUIENTE PASO.",
        title: "Tú decides lo que sigue.",
        subtitle: "Revisa propuestas y conecta directamente.",
        description: "Revisa propuestas y conecta directamente con socios locales verificados.",
        partner_badge: "SOCIO LOCAL VERIFICADO",
        available_badge: "DISPONIBLE",
        partner_title: "Meandros del Uvac",
        partner_sub: "Experiencia con guía privado",
        partner_schedule: "18 MAYO • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "para 2 personas",
        partner_quote: "“Con gusto organizaremos esto para ti.”",
        actions: [
          { num: "1", verb: "PEDIR", label: "Detalles", icon: "Send" },
          { num: "2", verb: "REVISAR", label: "Ver propuesta", icon: "FileText" },
          { num: "3", verb: "CONECTAR", label: "Tú decides", icon: "User" }
        ],
        guidance: [
          "Comparte tu fecha y requerimientos con el socio local.",
          "Revisa disponibilidad, precio y detalles personalizados.",
          "Conecta directamente para confirmar o cancelar cuando quieras."
        ],
        commercial_boundary: {
          title: "IDEMO PRESENTA. TÚ ACUERDAS DIRECTAMENTE.",
          text: "La reserva, el pago y las condiciones son exclusivamente entre tú y el socio."
        }
      }
    ],
    start: "COMENZAR EXPLORACIÓN",
    next: "SIGUIENTE",
    back: "Atrás",
    skip: "Omitir",
    trust_line: "Sin registro. Las preferencias se guardan de forma privada en tu dispositivo.",
    step_label: "PASO"
  },
  ru: {
    cards: [
      {
        eyebrow: "ВАШЕ ПУТЕШЕСТВИЕ · ВАШ СТИЛЬ",
        title: "Ваше путешествие. Ваш стиль.",
        subtitle: "Настройте под себя.",
        description: "Настройте настроение, бюджет и время. IDEMO подберет идеальные варианты.",
        actions: [
          { num: "1", verb: "ДВИГАТЬ", label: "Настроение", icon: "Move" },
          { num: "2", verb: "РАЗМЕР", label: "Бюджет", icon: "Maximize2" },
          { num: "3", verb: "КРУТИТЬ", label: "Время", icon: "RotateCw" }
        ],
        guidance: [
          "Перемещайте Orb для выбора стиля: Город, Природа, Гедонизм или Приключения.",
          "Изменяйте размер Orb под планируемый бюджет.",
          "Вращайте циферблат Orb для выбора доступных часов."
        ],
        axis_urban: "ГОРОД",
        axis_nature: "ПРИРОДА",
        axis_hedonist: "ГЕДОНИЗМ",
        axis_adventurer: "ПРИКЛЮЧЕНИЯ"
      },
      {
        eyebrow: "КУРАТОРСКИЙ ПОДБОР",
        title: "От идеи к впечатлению.",
        subtitle: "Сформируйте маршрут.",
        description: "Сохраняйте, планируйте и запрашивайте помощь.",
        dest_badge: "ПРИРОДА",
        dest_title: "Меандры Уваца",
        dest_subtitle: "Западная Сербия",
        actions: [
          { num: "1", verb: "СОХРАНИТЬ", label: "В закладки", icon: "Bookmark" },
          { num: "2", verb: "ПЛАН", label: "Выбрать дату", icon: "Calendar" },
          { num: "3", verb: "ПОМОЩЬ", label: "Запрос", icon: "Send" }
        ],
        guidance: [
          "Понравилось впечатление? Сохраните его для удобного доступа.",
          "Добавьте впечатление в план и выберите удобную дату.",
          "Отправьте запрос на гида или трансфер у местных экспертов."
        ],
        req_title: "ВАШ ЗАПРОС",
        req_date_label: "ДАТА",
        req_date: "18 МАЯ",
        req_party_label: "ГОСТИ",
        req_party: "2 ЧЕЛОВЕКА",
        req_note_label: "ЗАМЕТКА",
        req_note: "ЛИЧНЫЙ ГИД",
        matching_text: "ПОДБОР ПРОВЕРЕННОГО ПАРТНЕРА..."
      },
      {
        eyebrow: "ВЫ РЕШАЕТЕ, ЧТО ДАЛЬШЕ.",
        title: "Вы решаете, что дальше.",
        subtitle: "Изучайте предложения напрямую.",
        description: "Изучайте предложения и связывайтесь с проверенными партнерами.",
        partner_badge: "ПРОВЕРЕННЫЙ ПАРТНЕР",
        available_badge: "ДОСТУПНО",
        partner_title: "Меандры Уваца",
        partner_sub: "Индивидуальный гид",
        partner_schedule: "18 МАЯ • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "за 2 человек",
        partner_quote: "“С удовольствием организуем эту поездку для вас.”",
        actions: [
          { num: "1", verb: "ЗАПРОС", label: "Детали", icon: "Send" },
          { num: "2", verb: "ОБЗОР", label: "Предложение", icon: "FileText" },
          { num: "3", verb: "СВЯЗЬ", label: "Вы решаете", icon: "User" }
        ],
        guidance: [
          "Передайте дату и предпочтения партнеру.",
          "Получите подтверждение цены и персональный план.",
          "Свяжитесь напрямую для бронирования или откажитесь."
        ],
        commercial_boundary: {
          title: "IDEMO ЗНАКОМИТ. ВЫ ДОГОВАРИВАЕТЕСЬ НАПРЯМУЮ.",
          text: "Бронирование и оплата происходят исключительно между вами и партнером."
        }
      }
    ],
    start: "НАЧАТЬ ОБЗОР",
    next: "ДАЛЕЕ",
    back: "Назад",
    skip: "Пропустить",
    trust_line: "Без регистрации. Настройки хранятся конфиденциально на устройстве.",
    step_label: "ШАГ"
  },
  zh: {
    cards: [
      {
        eyebrow: "专属旅程 · 由您做主",
        title: "专属旅程，由您做主",
        subtitle: "设定最适合您的出行偏好",
        description: "调整情绪、预算与时间，IDEMO为您精确匹配最佳塞尔维亚体验。",
        actions: [
          { num: "1", verb: "拖拽", label: "情绪画卷", icon: "Move" },
          { num: "2", verb: "放缩", label: "预算范围", icon: "Maximize2" },
          { num: "3", verb: "旋转", label: "可用时间", icon: "RotateCw" }
        ],
        guidance: [
          "移动情绪星轨，在都市、自然、享乐与探险之间寻找平衡。",
          "放缩星轨圈层，设定符合您预期的旅行消费区间。",
          "旋转星轨表盘，指定您计划在此体验投入的小时数。"
        ],
        axis_urban: "都市",
        axis_nature: "自然",
        axis_hedonist: "享乐",
        axis_adventurer: "探险"
      },
      {
        eyebrow: "臻选探索",
        title: "从灵感至身临其境",
        subtitle: "发现并定制您的非凡之旅",
        description: "收藏灵感、规划日程，随时获取当地向导协助。",
        dest_badge: "自然风光",
        dest_title: "乌瓦茨峡谷 (Uvac)",
        dest_subtitle: "塞尔维亚西部",
        actions: [
          { num: "1", verb: "收藏", label: "保留灵感", icon: "Bookmark" },
          { num: "2", verb: "规划", label: "选择日期", icon: "Calendar" },
          { num: "3", verb: "咨询", label: "本地协助", icon: "Send" }
        ],
        guidance: [
          "遇到心仪的非凡体验？即刻收藏，随心探索。",
          "将体验加入行程规划，自由选择出行日期。",
          "发送协助需求，获取专属向导与包车协助。"
        ],
        req_title: "您的咨询需求",
        req_date_label: "日期",
        req_date: "5月18日",
        req_party_label: "人数",
        req_party: "2位",
        req_note_label: "备注",
        req_note: "私人向导包车",
        matching_text: "正在为您匹配认证当地专家..."
      },
      {
        eyebrow: "选择权始终在您手中",
        title: "选择权始终在您手中",
        subtitle: "查看定制方案，直接联系当地专家",
        description: "轻松查看专家回复与报价，直接沟通确定细节。",
        partner_badge: "官方认证当地专家",
        available_badge: "实时可约",
        partner_title: "乌瓦茨峡谷 (Uvac)",
        partner_sub: "私人专属向导体验",
        partner_schedule: "5月18日 • 09:00",
        partner_price: "€ 220",
        partner_price_sub: "2位共计",
        partner_quote: "“非常荣幸为您安排这次独家行程。”",
        actions: [
          { num: "1", verb: "需求", label: "发送细节", icon: "Send" },
          { num: "2", verb: "方案", label: "查看报价", icon: "FileText" },
          { num: "3", verb: "对接", label: "自由选择", icon: "User" }
        ],
        guidance: [
          "共享您的出行日期与具体向导需求。",
          "实时接收专家回复、透明报价与行程细节。",
          "直接联系沟通，自由决定是否确认行程。"
        ],
        commercial_boundary: {
          title: "IDEMO搭建桥梁，您与专家直接对接",
          text: "预订、支付及商业条款完全由您与当地专家直接沟通决定。"
        }
      }
    ],
    start: "开启探索之旅",
    next: "下一步",
    back: "返回",
    skip: "跳过",
    trust_line: "无需注册 · 您的个人偏好严格存储于本地设备",
    step_label: "步骤"
  }
};

const CARD1_ARCHETYPES: Record<string, Record<string, string>> = {
  en: {
    balanced: "BALANCED DISCOVERER",
    cultural: "CULTURAL URBAN EXPLORER",
    wild: "WILD NATURE ADVENTURER",
    wellness: "HEDONISTIC NATURE RETREAT",
    metropolis: "METROPOLITAN LUXURY HEDONIST"
  },
  sr: {
    balanced: "IZBALANSIRANI ISTRAŽIVAČ",
    cultural: "KULTURNI GRADSKI ISTRAŽIVAČ",
    wild: "DIVLJI AVANTURISTA U PRIRODI",
    wellness: "HEDONISTIČKI ODMOD U PRIRODI",
    metropolis: "METROPOLITAN LUKSUZNI HEDONISTA"
  },
  de: {
    balanced: "AUSGEWOGENER ENTDECKER",
    cultural: "KULTURELLER STADTERKUNDER",
    wild: "WILDER NATURABENTEUERER",
    wellness: "HEDONISTISCHER NATURRÜCKZUG",
    metropolis: "METROPOLITANER LUXUSGENIESSER"
  },
  es: {
    balanced: "EXPLORADOR EQUILIBRADO",
    cultural: "EXPLORADOR URBANO CULTURAL",
    wild: "AVENTURERO DE LA NATURALEZA",
    wellness: "REFUGIO HEDONISTA NATURAL",
    metropolis: "HEDONISTA DE LUJO METROPOLITANO"
  },
  ru: {
    balanced: "СБАЛАНСИРОВАННЫЙ ИССЛЕДОВАТЕЛЬ",
    cultural: "ГОРОДСКОЙ КУЛЬТУРНЫЙ ИССЛЕДОВАТЕЛЬ",
    wild: "ДИКИЙ ИССЛЕДОВАТЕЛЬ ПРИРОДЫ",
    wellness: "ГЕДОНИСТИЧЕСКИЙ ОТДЫХ НА ПРИРОДЕ",
    metropolis: "РОСКОШНЫЙ ГОРОДСКОЙ ГЕДОНИСТ"
  },
  zh: {
    balanced: "平衡全境探索家",
    cultural: "人文都市漫游者",
    wild: "荒野拓荒先锋",
    wellness: "林野康养行",
    metropolis: "都市臻奢派"
  }
};

const CARD_BACKGROUND_IMAGES = [
  '/assets/images/kalemegdanska_terasa_sunset_1778843501085.webp', // Card 1: Sunset river & fortress landscape
  '/assets/images/uvac_meanders_1778841048759.webp',                // Card 2: Uvac meanders river valley
  '/assets/images/banjska_stena_outlook_1778841232535.webp'         // Card 3: Banjska Stena mountain overlook
];

export function OnboardingOverlay({
  language,
  recommendations,
  onClose,
  onBackToLanding,
  onRegisterBackHandler
}: {
  language: string;
  recommendations?: Recommendation[];
  onClose: () => void;
  onBackToLanding?: () => void;
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
    } else if (onBackToLanding) {
      onBackToLanding();
      return true;
    }
    return false;
  }, [cardIndex, onBackToLanding]);

  useEffect(() => {
    if (onRegisterBackHandler) {
      onRegisterBackHandler(() => {
        return handleBack();
      });
    }
    return () => {
      if (onRegisterBackHandler) {
        onRegisterBackHandler(null);
      }
    };
  }, [handleBack, onRegisterBackHandler]);

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

    const stepDuration = cardIndex === 0 
      ? (activeStepAnim === 1 ? 6200 : activeStepAnim === 2 ? 4500 : 4500)
      : 3200;

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

      subTimers.push(setTimeout(() => setCard1Budget(100), 700));
      subTimers.push(setTimeout(() => setCard1Budget(500), 2000));
      subTimers.push(setTimeout(() => setCard1Budget(250), 3300));
    } else if (activeStepAnim === 3) {
      setCard1X(0.5);
      setCard1Y(0.5);
      setCard1Budget(250);
      setCard1QuadrantKey('balanced');
      setCard1Time(4);

      subTimers.push(setTimeout(() => setCard1Time(8), 900));
      subTimers.push(setTimeout(() => setCard1Time(24), 1900));
      subTimers.push(setTimeout(() => setCard1Time(48), 2900));
      subTimers.push(setTimeout(() => setCard1Time(24), 3900));
    }

    return () => {
      subTimers.forEach(clearTimeout);
    };
  }, [cardIndex, activeStepAnim, shouldReduceMotion]);

  useEffect(() => {
    setActiveStepAnim(1);
    setPauseAutoCycle(false);
  }, [cardIndex]);

  const renderActionIcon = (iconName: string, className = "text-brand-charcoal stroke-[1.8]") => {
    switch (iconName) {
      case 'Move': return <Move size={18} className={className} />;
      case 'Maximize2': return <Maximize2 size={18} className={className} />;
      case 'RotateCw': return <RotateCw size={18} className={className} />;
      case 'Bookmark': return <Bookmark size={18} className={className} />;
      case 'Calendar': return <CalendarIcon size={18} className={className} />;
      case 'Send': return <Send size={18} className={className} />;
      case 'FileText': return <FileText size={18} className={className} />;
      case 'CheckCircle': return <CheckCircle size={18} className={className} />;
      case 'User': return <User size={18} className={className} />;
      default: return <Sparkles size={18} className={className} />;
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
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.22, ease: "easeOut" as const }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -32 : 32,
      opacity: 0,
      transition: {
        x: { type: "spring" as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.18, ease: "easeIn" as const }
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
      className="fixed inset-0 bg-[#FAF9F5] z-[110] flex flex-col justify-between p-4 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] select-none overflow-hidden h-[100dvh] w-full"
    >
      {/* Dynamic Background Scenic Image Layer Matching Guiding Directive Image */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.img 
            key={cardIndex}
            src={CARD_BACKGROUND_IMAGES[cardIndex] || CARD_BACKGROUND_IMAGES[0]} 
            alt="Scenic Background" 
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.82, scale: 1.01 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.94] contrast-[1.05]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallbackTried) {
                target.dataset.fallbackTried = 'true';
                target.src = '/assets/images/uvac_meanders_1778841048759.webp';
              }
            }}
          />
        </AnimatePresence>
        {/* Soft warm luxury gradient overlay preserving text legibility & card contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F5]/92 via-[#FAF9F5]/65 to-[#FAF9F5]/96 pointer-events-none" />
      </div>

      {/* TOP: Back Button, Step Indicator (1 / 3) & Skip */}
      <div className="relative z-10 flex-shrink-0 w-full max-w-md mx-auto flex justify-between items-center text-[12px] font-sans text-brand-charcoal/70">
        <div className="flex items-center gap-2">
          {cardIndex > 0 ? (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="hover:text-brand-charcoal transition-colors cursor-pointer py-1 px-2 -ml-2 flex items-center gap-1 font-medium min-h-[44px]"
            >
              <ArrowLeft size={18} className="stroke-[2]" />
            </button>
          ) : onBackToLanding ? (
            <button
              onClick={handleBack}
              aria-label="Back to landing"
              className="hover:text-brand-charcoal transition-colors cursor-pointer py-1 px-2 -ml-2 flex items-center gap-1 font-medium min-h-[44px]"
            >
              <ArrowLeft size={18} className="stroke-[2]" />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Numeric Step Indicator matching design mockup (1 / 3) */}
        <span className="font-serif text-[14px] font-medium tracking-widest text-brand-charcoal/80">
          {cardIndex + 1} / 3
        </span>

        <button 
          onClick={handleDismiss}
          className="hover:text-brand-charcoal transition-colors cursor-pointer py-1 px-2 -mr-2 font-normal text-[13px] text-brand-charcoal/70 min-h-[44px] flex items-center"
        >
          {t.skip}
        </button>
      </div>

      {/* Animated Card Body Container */}
      <div className="relative z-10 flex-1 flex flex-col justify-between overflow-hidden min-h-0 my-1 max-w-md mx-auto w-full">
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
            {/* 1. EDITORIAL HEADLINE & SUBTITLE                                         */}
            {/* ========================================================================= */}
            <div className="w-full text-center space-y-1 px-2 pt-1 flex-shrink-0">
              <h2 className="text-[25px] xs:text-[28px] sm:text-[31px] font-serif font-normal tracking-tight text-[#1A1A18] leading-[1.15]">
                {current.title}
              </h2>
              <p className="text-[12.5px] xs:text-[13px] font-sans text-[#2D3025]/80 max-w-xs mx-auto leading-snug">
                {current.description}
              </p>
            </div>

            {/* ========================================================================= */}
            {/* 2. HERO VISUAL AREA (~35-40% Height)                                     */}
            {/* ========================================================================= */}

            {/* CARD 1 HERO VISUAL: Approved Horological Orb Instrument over Compass Axes */}
            {cardIndex === 0 && (
              <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center my-1">
                <div className="w-full aspect-square max-w-[210px] xs:max-w-[230px] sm:max-w-[250px] max-h-[28vh] relative bg-white/80 backdrop-blur-md border border-[#E2DFC2]/80 rounded-[28px] overflow-hidden select-none shadow-sm mx-auto flex items-center justify-center p-2">
                  
                  {/* Subtle Grid Reticles */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-[#D5D3C8]/40" />
                    <div className="absolute h-full w-[1px] bg-[#D5D3C8]/40" />
                  </div>

                  {/* Compass Axis 1: URBAN (Top) */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
                    <Building2 size={13} className="text-[#23251E] mb-0.5" />
                    <span>{current.axis_urban}</span>
                  </div>

                  {/* Compass Axis 2: NATURE (Bottom) */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
                    <TreePine size={13} className="text-[#23251E] mb-0.5" />
                    <span>{current.axis_nature}</span>
                  </div>

                  {/* Compass Axis 3: HEDONIST (Left) */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
                    <Wine size={13} className="text-[#23251E] mb-0.5" />
                    <span>{current.axis_hedonist}</span>
                  </div>

                  {/* Compass Axis 4: ADVENTURER (Right) */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#23251E] pointer-events-none z-10">
                    <Footprints size={13} className="text-[#23251E] mb-0.5" />
                    <span>{current.axis_adventurer}</span>
                  </div>

                  {/* Canonical Horological Orb Instrument */}
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

                        {/* Slate Navy Time Segment */}
                        <linearGradient id="onboardingOrbTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1E293B" />
                          <stop offset="100%" stopColor="#0F172A" />
                        </linearGradient>

                        {/* IDEMO Oxblood Red Budget Segment */}
                        <linearGradient id="onboardingOrbBudget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card1Budget >= 300 ? "#9E2A2A" : "#800020"} />
                          <stop offset="100%" stopColor={card1Budget >= 300 ? "#6B001B" : "#500014"} />
                        </linearGradient>

                        {/* Precision Crown Steel Bezel */}
                        <linearGradient id="onboardingOrbCrown" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#FFFFFF" />
                          <stop offset="25%" stopColor="#D4D4D8" />
                          <stop offset="50%" stopColor="#71717A" />
                          <stop offset="75%" stopColor="#D4D4D8" />
                          <stop offset="100%" stopColor="#18181B" />
                        </linearGradient>

                        {/* Glass Convex Reflection */}
                        <radialGradient id="onboardingOrbReflection" cx="30%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                        </radialGradient>

                        {/* Sapphire glass AR Sheen */}
                        <linearGradient id="onboardingOrbSapphire" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.12" />
                          <stop offset="30%" stopColor="#818CF8" stopOpacity="0.04" />
                          <stop offset="70%" stopColor="#C084FC" stopOpacity="0" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.06" />
                        </linearGradient>

                        {/* Luminous paint gradient */}
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

                      {/* Budget segment overlaid */}
                      <path 
                        d="M -90,0 C -45,12 45,-12 90,0 A 90,90 0 0,0 -90,0 Z" 
                        fill="url(#onboardingOrbBudget)" 
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
                        {card1Time}h
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
                        €{card1Budget}
                      </text>

                      {/* Center Compass Needle */}
                      <g className="pointer-events-none">
                        <polygon points="0,-22 5,0 0,6 -5,0" fill="#FFFFFF" />
                        <polygon points="0,22 5,0 0,6 -5,0" fill="#94A3B8" />
                        <circle r="3" fill="#800020" />
                      </g>

                      {/* Bezel Ring */}
                      <circle r={98 - outerBezelWidth / 2} fill="none" stroke="url(#onboardingOrbBezel)" strokeWidth={outerBezelWidth} className="opacity-85 pointer-events-none" />

                      {/* Sapphire glass and reflection */}
                      <circle r="96" fill="url(#onboardingOrbReflection)" className="pointer-events-none mix-blend-overlay" />
                      <circle r="96" fill="url(#onboardingOrbSapphire)" className="pointer-events-none mix-blend-screen" />
                    </svg>
                  </motion.div>
                </div>
              </div>
            )}

            {/* CARD 2 HERO VISUAL: Curated Card for Uvac Meanders */}
            {cardIndex === 1 && (
              <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center my-1">
                <div className="w-full h-[190px] xs:h-[210px] sm:h-[230px] max-h-[30vh] rounded-[22px] bg-white border border-[#E2DFC2]/80 relative overflow-hidden flex flex-col justify-between p-3 select-none shadow-md">
                  {/* Background Image */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#23251E]/90 via-[#23251E]/30 to-transparent" />
                  </div>

                  {/* Top Badges inside Card 2 Image */}
                  <div className="relative z-10 flex justify-between items-center w-full">
                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[9.5px] font-mono font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1 shadow-xs">
                      <TreePine size={11} className="text-[#800020]" />
                      {current.dest_badge}
                    </span>
                    <motion.div 
                      animate={{ scale: activeStepAnim === 1 ? [1, 1.25, 1] : 1 }}
                      transition={{ duration: 0.5 }}
                      className={`p-2 rounded-full backdrop-blur-xs transition-colors shadow-xs ${
                        activeStepAnim === 1 ? 'bg-[#800020] text-white' : 'bg-white/80 text-[#800020]'
                      }`}
                    >
                      <Heart size={14} className={activeStepAnim === 1 ? 'fill-current' : ''} />
                    </motion.div>
                  </div>

                  {/* Card 2 Bottom Overlay */}
                  <div className="relative z-10 w-full space-y-1 text-white">
                    {activeStepAnim < 3 ? (
                      <div>
                        <h4 className="text-[17px] xs:text-[19px] font-serif font-normal tracking-wide leading-tight drop-shadow-xs">
                          {current.dest_title}
                        </h4>
                        <p className="text-[11px] font-sans text-white/80 flex items-center gap-1">
                          <span>📍</span> {current.dest_subtitle}
                        </p>
                        {activeStepAnim === 2 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF9F5] text-brand-charcoal text-[10px] font-mono font-bold"
                          >
                            <CalendarIcon size={12} className="text-[#800020]" />
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
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#800020]">
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
                        <div className="pt-0.5 flex items-center gap-1.5 text-[8.5px] font-mono font-bold text-[#800020] uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />
                          <span>{current.matching_text}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CARD 3 HERO VISUAL: Verified Partner Proposal */}
            {cardIndex === 2 && (
              <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center space-y-2 my-1">
                {/* Proposal Card */}
                <div className="w-full rounded-[20px] bg-white/90 backdrop-blur-md border border-[#E2DFC2]/90 p-3 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF9F5] border border-[#E2DFC2] text-[9px] font-mono font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1">
                      <ShieldCheck size={12} className="text-[#800020]" />
                      {current.partner_badge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[8.5px] uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {current.available_badge}
                    </span>
                  </div>

                  <div className="flex justify-between items-start pt-1 gap-2">
                    <div className="flex-1">
                      <h4 className="text-[14px] font-serif font-normal text-brand-charcoal">
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
                      <span className="text-[15px] font-mono font-bold text-[#800020] block leading-none">
                        {current.partner_price}
                      </span>
                      <span className="text-[8.5px] font-sans text-brand-charcoal/60 block">
                        {current.partner_price_sub}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#E2DFC2]/60 text-[10.5px] font-sans text-brand-charcoal/80 italic flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#800020]/10 text-[#800020] font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                      U
                    </div>
                    <span>{current.partner_quote}</span>
                  </div>
                </div>

                {/* Commercial Boundary Box */}
                {current.commercial_boundary && (
                  <div className="w-full bg-[#23251E]/5 rounded-xl p-2.5 border border-[#23251E]/10 text-center">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-brand-charcoal block">
                      {current.commercial_boundary.title}
                    </span>
                    <span className="text-[9.5px] font-sans text-brand-charcoal/70 block mt-0.5">
                      {current.commercial_boundary.text}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. 3-ACTION SELECTOR CARDS (Oxblood Red Active State)                    */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-3 gap-2 w-full flex-shrink-0">
              {current.actions.map((act: any, aIdx: number) => {
                const stepNum = aIdx + 1;
                const isActive = activeStepAnim === stepNum;
                return (
                  <button
                    key={aIdx}
                    onClick={() => handleStepClick(stepNum)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer min-h-[62px] ${
                      isActive 
                        ? 'bg-[#800020] text-white border-[#800020] shadow-md' 
                        : 'bg-white/90 backdrop-blur-xs text-brand-charcoal border-[#E2DFC2]/80 hover:bg-white'
                    }`}
                  >
                    <div className="mb-1">
                      {renderActionIcon(act.icon, isActive ? 'text-white stroke-[2]' : 'text-brand-charcoal stroke-[1.8]')}
                    </div>
                    <div className="flex items-center gap-1 leading-none">
                      <span className={`text-[9px] font-mono font-bold ${isActive ? 'text-white/80' : 'text-[#800020]'}`}>
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
            {/* 4. DYNAMIC GUIDANCE TEXT BELOW CARDS                                       */}
            {/* ========================================================================= */}
            <div className="w-full text-center px-2 py-1 min-h-[44px] flex items-center justify-center flex-shrink-0">
              <p className="text-[17px] font-medium text-[#1A1A18] leading-[1.4] text-center">
                {current.guidance[activeStepAnim - 1]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM FOOTER: PRIVACY + PAGINATION DOTS + CTA BUTTON                     */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex-shrink-0 w-full max-w-md mx-auto pt-1 space-y-2">
        {/* Bottom Privacy Guarantee - Applied consistently across all 3 cards */}
        <div className="flex items-center justify-center gap-1.5 text-[15px] font-medium text-[#1A1A18] leading-[1.35] text-center px-2">
          <Lock size={16} className="text-[#1A1A18] stroke-[2.2] shrink-0" />
          <span>{t.trust_line}</span>
        </div>

        {cardIndex < 2 ? (
          <div className="flex items-center justify-between gap-2 min-h-[44px]">
            {/* Center Page Dots */}
            <div className="flex gap-1.5 items-center px-2">
              {[0, 1, 2].map(idx => (
                <button
                  key={idx}
                  onClick={() => handleGoTo(idx)}
                  aria-label={`Go to card ${idx + 1}`}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    cardIndex === idx ? 'bg-[#800020] scale-110' : 'bg-[#23251E]/20 hover:bg-[#23251E]/40'
                  }`}
                />
              ))}
            </div>

            {/* Right Circular CTA Button */}
            <button
              onClick={handleNext}
              aria-label="Next step"
              className="w-11 h-11 rounded-full bg-[#23251E] hover:bg-black text-white flex items-center justify-center transition-all active:scale-95 shadow-md cursor-pointer shrink-0"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Page Dots for Card 3 */}
            <div className="flex justify-center gap-1.5 items-center">
              {[0, 1, 2].map(idx => (
                <button
                  key={idx}
                  onClick={() => handleGoTo(idx)}
                  aria-label={`Go to card ${idx + 1}`}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    cardIndex === idx ? 'bg-[#800020] scale-110' : 'bg-[#23251E]/20 hover:bg-[#23251E]/40'
                  }`}
                />
              ))}
            </div>

            {/* Full-width Final CTA Button */}
            <button
              onClick={handleNext}
              className="w-full py-3 px-4 rounded-full bg-[#800020] hover:bg-[#660019] text-white font-sans font-bold text-[12px] uppercase tracking-[0.14em] shadow-md transition-all active:scale-[0.99] cursor-pointer min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>{t.start}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default OnboardingOverlay;
