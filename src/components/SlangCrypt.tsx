/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { triggerHaptic } from "../App";
import PremiumCarousel from "./PremiumCarousel";

export interface SlangTerm {
  id: string;
  word: string;
  cyrillic: string;
  phonetic: string;
  meaning: Record<string, string>;
  nuance: Record<string, string>;
  etiquetteTips: Record<string, string>;
  example: Record<string, string>;
}

export const SLANG_TERMS: SlangTerm[] = [
  {
    id: "bre",
    word: "Bre",
    cyrillic: "Бре",
    phonetic: "breh",
    meaning: {
      en: "The ultimate Serbian sentiment intensifier",
      sr: "Sveprisutni uzvik za pojačavanje značenja",
      es: "Intensificador de emoción serbio definitivo",
      de: "Der universelle serbische Gefühlsverstärker",
      ru: "Главное сербское слово-усилитель эмоций",
      zh: "终极塞尔维亚语气加强词",
    },
    nuance: {
      en: "Used to inject emotion, focus, emphasis, or casual connection. It holds no literal direct translation but carries definitive local soul. 'IDEMO!'",
      sr: "Dodaje intenzitet, emociju, naglasak ili drugarski ton. Nema direktno značenje, već oslikava beogradsku dušu.",
      es: "Inyecta emoción, énfasis o cercanía casual. No tiene una traducción literal directa, pero lleva el alma local. '¡IDEMO!'",
      de: "Fügt Emotion, Fokus oder freundschaftliche Nähe hinzu. Hat keine direkte Übersetzung, verkörpert aber echtes Balkan-Flair.",
      ru: "Служит для выражения эмоций, расстановки акцентов или дружеской близости. Не переводится, но содержит порцию балканского духа.",
      zh: "用于注入情感、焦点、强调或日常关系。它没有直接的字面翻译，但承载着地道的当地灵魂。'IDEMO!'",
    },
    etiquetteTips: {
      en: "Avoid in highly protocol-sensitive business environments. It is a badge of trust, best suited for kafanas, bars, and casual laughter.",
      sr: "Izbegavajte u visoko formalnim poslovnim sastancima. To je znak bliskosti, savršen za kafane, kafiće i opušteno druženje.",
      es: "Evite usarlo en ámbitos de negocios con protocolo muy estricto. Es un símbolo de confianza, ideal para kafanas, bares y risas espontáneas.",
      de: "In hochoffiziellen Business-Szenarien eher meiden. Im entspannten Kreis, in Wirtshäusern und Bars ist es als Zeichen des Vertrauens ideal.",
      ru: "Избегайте на строго протокольных встречах. Это знак доверия, идеально подходящий для кафан, баров и непринужденного смеха.",
      zh: "在非常注重礼仪的商务环境中应避免使用。它是信任的标志，最适合在酒馆、酒吧和轻松大小聚会中使用。",
    },
    example: {
      en: "Idemo, bre! (Let's go, dude!)",
      sr: "Idemo, bre! (Hajdemo, brate!)",
      es: "Idemo, bre! (¡Vamos ya, colega!)",
      de: "Idemo, bre! (Auf geht's, Leute!)",
      ru: "Idemo, bre! (Поехали, чувак!)",
      zh: "Idemo, bre!（来吧，老友！）",
    },
  },
  {
    id: "ziveli",
    word: "Živeli",
    cyrillic: "Живели",
    phonetic: "ZHEE-veh-lee",
    meaning: {
      en: "Cheers! / May you live long",
      sr: "Živeli! (Nazdravljanje)",
      es: "¡Salud! / Que vivan",
      de: "Prost! / Auf das Leben",
      ru: "Будем здоровы! / За здоровье!",
      zh: "干杯！（字面意：祝你长寿）",
    },
    nuance: {
      en: "The sacred, cultural toast offered when touching glasses of traditional plum rakija (Šljivovica), cold beer, or wine.",
      sr: "Uzvik nazdravljanja koji se izgovara prilikom kucanja čašama rakije, hladnog piva ili domaćih vina.",
      es: "El brindis sagrado pronunciado al chocar vasos de licor de ciruela tradicional, cerveza fría o vino.",
      de: "Der traditionelle Trinkspruch beim Anstoßen mit einheimischem Zwetschgen-Rakija (Šljivovica), Bier oder Wein.",
      ru: "Священный культурный тост при звоне рюмок с традиционной сливовой ракией (шливовицей), пивом или вином.",
      zh: "饮用传统的李子拉基亚（Šljivovica）、冰镇啤酒或葡萄酒时神圣的文化干杯词。",
    },
    etiquetteTips: {
      en: "CRITICAL: Look directly into the eyes of the person you clink glasses with. Looking down, away, or crossing arms with another pair is considered deeply impolite.",
      sr: "NAJVAŽNIJE: Gledajte direktno u oči osobu s kojom se kucate. Gledanje sa strane, dole ili ukrštanje ruku sa trećom osobom smatra se nekulturnim.",
      es: "CRÍTICO: Mire fijamente a los ojos de la persona con la que brinda. Desviar la mirada o cruzar los brazos con otra pareja es de mala educación.",
      de: "ESSENZIELL: Schauen Sie dem Gegenüber beim Anstoßen tief in die Augen! Den Blick senken oder die Arme mit einer anderen Gruppe überkreuzen gilt als grob unhöflich.",
      ru: "ИСКЛЮЧИТЕЛЬНО ВАЖНО: Смотрите прямо в глаза тому, с кем чокаетесь. Опускать взгляд или перекрещивать руки с другими считается дурным тоном.",
      zh: "重要：碰杯时必须直视对方的眼睛。向下看、看向别处或与他人交叉手臂被视为极度不礼貌的表现。",
    },
    example: {
      en: "Živeli! (Cheers to us!)",
      sr: "Živeli! (Uzdravlje!)",
      es: "Živeli! (¡Salud por nosotros!)",
      de: "Živeli! (Auf unser Wohl!)",
      ru: "Živeli! (Будем здоровы!)",
      zh: "Živeli!（祝我们好运！）",
    },
  },
  {
    id: "ajde",
    word: "Ajde",
    cyrillic: "Ајде",
    phonetic: "EYE-deh",
    meaning: {
      en: "Come on! / Let's go!",
      sr: "Ajde! (Hajde)",
      es: "¡Vamos! / ¡Andando!",
      de: "Auf geht's! / Komm schon!",
      ru: "Давай! / Погнали!",
      zh: "来吧！/ 走吧！",
    },
    nuance: {
      en: "Belgrade's internal gas pedal. Expresses excitement, swift action, agreement, or a casual verbal goodbye when repeated twice.",
      sr: "Pogonski motor Beograda. Izražava akciju, uzbuđenje, pristanak ili čak brzi drugarski pozdrav na odlasku uz duplo 'ajde'.",
      es: "El motor del movimiento en Belgrado. Expresa emoción, prisa, acuerdo o incluso una despedida informal cuando se repite doble.",
      de: "Der verbale Antrieb Belgrads. Drückt Schwung, Antrieb, Einigung oder bei zweifacher Nennung einen zwanglosen Abschiedsgruß aus.",
      ru: "Главное топливо белградского ритма. Выражает энтузиазм, спешку, согласие или быстрое прощание при повторении.",
      zh: "贝尔格莱德生活的油门。表达兴奋、迅速行动、一致同意，或者在连说两遍时作为日常的道别语。",
    },
    etiquetteTips: {
      en: "Best used dynamically. Stating 'Ajde, idemo' prompts your group to move when changing venues from one bar or restaurant to the next.",
      sr: "Najbolje se koristi spontano. Spajanje u 'Ajde, idemo' je savršen način da pokrenete ekipu kada se seli iz jednog lokala u sledeći.",
      es: "Rinde mejor si se usa con soltura. Un firme 'Ajde, idemo' es ideal para movilizar al grupo cuando se cambia de restaurante o bar.",
      de: "Eignet sich hervorragend für spontane Übergänge. Mit 'Ajde, idemo' motivieren Sie Ihre Gruppe elegant zum Wechsel der Bar.",
      ru: "Идеально звучит при смене локаций. Команда «Айде, идемо» — лучший способ ускорить переход компании в следующее заведение.",
      zh: "动态使用效果最佳。在更换酒吧或酒吧时，说一声“Ajde, idemo”是促使团队开始行动的绝妙方式。",
    },
    example: {
      en: "Ajde, idemo na kafu! (Come on, let's go get coffee!)",
      sr: "Ajde, idemo na kafu! (Hajdemo na kafu!)",
      es: "Ajde, idemo na kafu! (¡Vamos a por un café!)",
      de: "Ajde, idemo na kafu! (Auf geht's, Kaffee trinken!)",
      ru: "Ajde, idemo na kafu! (Давай, пошли пить кофе!)",
      zh: "Ajde, idemo na kafu!（来吧，我们喝杯咖啡去！）",
    },
  },
  {
    id: "brate",
    word: "Brate",
    cyrillic: "Брате",
    phonetic: "BRAH-teh",
    meaning: {
      en: "Bro / Brother / Dude",
      sr: "Brate (Vokativ imenice brat)",
      es: "Hermano / Tío / Che",
      de: "Bruder / Kumpel",
      ru: "Брат / Братуха / Чувак",
      zh: "兄弟 / 老哥 / 哥们儿",
    },
    nuance: {
      en: "An all-purpose term of warmth used by literally everyone in Belgrade (even women addressing women) to start or frame an exclamation.",
      sr: "Univerzalna reč prisnosti koju u Beogradu koriste bukvalno svi (čak i devojke u međusobnom razgovoru) za započinjane svake misli.",
      es: "Sello de calidez informal. Utilizado por todo el mundo en Belgrado (incluso mujeres entre sí) al arrancar cualquier frase de confianza.",
      de: "Allgegenwärtiger Ausdruck für Kumpelhaftigkeit. Wird von fast jedem in Belgrad (auch Frauen untereinander) im Alltag genutzt.",
      ru: "Универсальное дружеское обращение. В Белграде его используют абсолютно все (даже девушки при общении между собой).",
      zh: "一种温暖的通用称呼，贝尔格莱德的每个人都在使用（甚至女性之间交流也是如此），用于开启或点缀感叹句。",
    },
    etiquetteTips: {
      en: "Extremely informal. Perfect for waiters after a friendly interaction, taxi drivers, or new friends you made over rakija.",
      sr: "Izrazito neformalno. Odlično za konobare sa kojima ste ostvarili fin kontakt, taksiste ili nove prijatelje uz čašicu razgovora.",
      es: "Muy informal. Perfecto para camareros amables, taxistas de confianza o amigos que acabas de conocer brindando.",
      de: "Sehr informell. Bestens geeignet für freundliche Kellner, Taxifahrer oder neue Bekanntschaften nach dem ersten Toast.",
      ru: "Сугубо неформальный стиль. Подходит для дружелюбного общения с официантами, таксистами или новыми знакомыми.",
      zh: "非常日常非正式。适合在友好交流后称呼服务员、出租车司机，或是在酒桌上结识的新朋友。",
    },
    example: {
      en: "Gde si brate! (Where are you bro! / What's up!)",
      sr: "Gde si brate! (Šta ima!)",
      es: "Gde si brate! (¡Qué pasa, hermano!)",
      de: "Gde si brate! (Wie läuft's, Kumpel!)",
      ru: "Gde si brate! (Здорово, брат! / Как дела!)",
      zh: "Gde si brate!（什么风把你吹来了，兄弟！）",
    },
  },
  {
    id: "racun",
    word: "Račun",
    cyrillic: "Рачун",
    phonetic: "rah-CHOON MO-leem",
    meaning: {
      en: "The Bill, Please / Check",
      sr: "Račun, molim (Plaćanje ceha)",
      es: "La cuenta, por favor",
      de: "Die Rechnung, bitte",
      ru: "Счет, пожалуйста",
      zh: "请结账 / 买单，谢谢",
    },
    nuance: {
      en: "The standard phrase to ask for the bill at the end of a kafana feast, long coffee session, or tavern night.",
      sr: "Uobičajeni način da zatražite račun na kraju gozbe u kafani, dugog rituala ispijanja kafe ili večeri u lokalu.",
      es: "La frase indispensable para pedir la cuenta tras un festín en la kafana, un café largo o una velada animada.",
      de: "Der Höflichkeitssatz zum Bestellen der Rechnung nach einem Kafana-Essen oder Kaffeeklatsch.",
      ru: "Вежливая фраза для закрытия чека по окончании застолья в кафане, посиделок за кофе или вечера в баре.",
      zh: "在酒馆、漫长咖啡聚会或客店之夜结束时结账的标准短语。",
    },
    etiquetteTips: {
      en: "No calculators allowed. Snatching the bill to pay for your guests is a classic sign of respect. Splits must never be calculated down to the cent; simply trade rounds.",
      sr: "Bez kalkulatora. Otimanje o račun je ovde tradicionalni odraz poštovanja i gostoprimstva. Deljenje ceha ucun ne dolazi u obzir.",
      es: "Prohibido usar calculadora en mesa. Intentar pagar la cuenta de tus invitados es un gran gesto local. Se alternan rondas en vez de dividir.",
      de: "Taschenrechner tabu. Nach der Rechnung zu greifen, um Gäste einzuladen, ist Zeichen des Respekts. Cent-genaue Aufteilungen vermieden.",
      ru: "Калькуляторы запрещены. Борьба за право оплатить счет — дань вежливому этикету. Не делите копейки — просто угощайте по очереди.",
      zh: "桌上严禁掏出计算器。争抢请客买单是经典尊重的标志。切勿精算到分分角角；相互轮流请客，才是得体之道。",
    },
    example: {
      en: "Konobar, račun molim! (Waiter, bill please!)",
      sr: "Konobar, račun molim! (Donestite račun!)",
      es: "Konobar, račun molim! (¡Camarero, la cuenta por favor!)",
      de: "Konobar, račun molim! (Herr Ober, die Rechnung bitte!)",
      ru: "Konobar, račun molim! (Официант, счет, пожалуйста!)",
      zh: "Konobar, račun molim!（服务员，请帮我买下单！）",
    },
  },
  {
    id: "promaja",
    word: "Promaja",
    cyrillic: "Промаја",
    phonetic: "PROH-mah-yah",
    meaning: {
      en: "The Cross-Breeze / Draft",
      sr: "Promaja (Promaja u prozorima)",
      es: "La corriente de aire cruzada",
      de: "Die gefürchtete Zugluft",
      ru: "Сквозняк (невидимый враг)",
      zh: "穿堂风 / 空气对流风",
    },
    nuance: {
      en: "An invisible draft of wind created between two open windows. Regarded in Serbia as a dangerous physical threat that causes neck stiffness, colds, or headaches.",
      sr: "Strujanje vazduha nastalo između dva otvorena prozora. U narodu se smatra pretnjom koja izaziva prehlade, upalu mišića ili ukočenost.",
      es: "Una corriente de aire cruzada entre ventanas. Considerada con humor y recelo como la causante principal de resfriados o dolores cervicales.",
      de: "Die Luftströmung zwischen zwei Fenstern – in Serbien traditionell als reale Ursache für Nackenstarre, Grippe und Ohrenschmerzen gefürchtet.",
      ru: "Поток воздуха между двумя открытыми окнами. В Сербии имеет культовый статус угрозы здоровью, вызывающей простуду и защемление шеи.",
      zh: "两扇开着的窗户之间形成的空气流通。在塞尔维亚被普遍视为导致落枕、感冒或偏头痛的潜在健康威胁。",
    },
    etiquetteTips: {
      en: "Never open windows on opposite sides of a taxi, bus, or room without asking. If a local says 'Ubi me promaja' (Draft is killing me), close the window immediately.",
      sr: "Nikada ne otvarajte prozore na suprotnim stranama u taksiju, sobi ili prevozu bez pitanja. Zatvorite prozor ako neko spomene promaju.",
      es: "Nunca abra ventanas enfrentadas en taxis o habitaciones de hotel sin avisar. Si un local dice que le asusta la promaja, ciérrela al instante.",
      de: "Öffnen Sie keine gegenüberliegenden Fenster im Taxi oder Hotelzimmer ungefragt. Reagieren Sie sofort und schließen es bei Bedenken.",
      ru: "Никогда не открывайте окна напротив друг друга в такси или комнате без спроса. Закройте, если местный житель выразит беспокойство.",
      zh: "在出租车、公车或房间内，切勿随意同时打开对侧风窗。若当地人面带难色提起这是“Promaja”，请自觉合上。",
    },
    example: {
      en: "Zatvori prozor, promaja je! (Close the window, there is a draft!)",
      sr: "Zatvori prozor, promaja je! (Ubiće nas promaja!)",
      es: "Zatvori prozor, promaja je! (¡Cierra la ventana, que hay corriente!)",
      de: "Zatvori prozor, promaja je! (Mache das Fenster zu, es zieht!)",
      ru: "Zatvori prozor, promaja je! (Закрой окно, сквозит!)",
      zh: "Zatvori prozor, promaja je!（快关窗，穿堂风吹进来了！）",
    },
  },
];

export function SlangCrypt({ language }: { language: string }) {
  const [activeTermIndex, setActiveTermIndex] = useState(0);
  const [pledges, setPledges] = useState<Record<string, boolean>>({});

  const t_localColors: Record<string, string> = {
    bre: "bg-accent-red/5 border-accent-red/20 text-accent-red",
    ziveli: "bg-accent-teal/5 border-accent-teal/20 text-accent-teal",
    ajde: "bg-amber-600/5 border-amber-600/20 text-amber-600",
    brate: "bg-emerald-600/5 border-emerald-600/20 text-emerald-600",
    racun: "bg-indigo-600/5 border-indigo-600/20 text-indigo-600",
    promaja: "bg-sky-600/5 border-sky-600/20 text-sky-600",
  };

  const currentTerm = SLANG_TERMS[activeTermIndex];

  const handlePledge = (id: string) => {
    triggerHaptic(20);
    setPledges((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectTerm = (idx: number) => {
    triggerHaptic(8);
    setActiveTermIndex(idx);
  };

  // Locale translation labels
  const uiLabels: Record<string, any> = {
    en: {
      title: "The Belgrade Codex & Social Etiquette",
      subtitle:
        "A curated collection of cultural formulas, idiomatic nuances, and unspoken rules for the discerning traveler.",
      pronounced: "PRONOUNCED:",
      literal: "Meaning & Definition",
      concierge_spirit: "Concierge Insight",
      etiquette_oath: "Cultural Etiquette Note",
      pledge_compliance: "Review & Internalize Protocol",
      pledged: "noted in travel diary",
      not_pledged: "mark as studied",
      example_title: "Daily Belgrade Application",
      copied: "Example copied to clipboard!",
      copy_cta: "Copy Phrasing",
    },
    sr: {
      title: "Beogradski kodeks i bonton",
      subtitle:
        "Prečišćena zbirka kulturnih formula, idiomatskih nijansi i neobaveznih pravila za prefinjenog putnika.",
      pronounced: "IZGOVOR:",
      literal: "Značenje i kontekst",
      concierge_spirit: "Savet konsijerža",
      etiquette_oath: "Kulturni bonton i napomene",
      pledge_compliance: "Prihvati i prouči pravilo",
      pledged: "zabeleženo u dnevniku",
      not_pledged: "označi kao pročitano",
      example_title: "Svakodnevna primena",
      copied: "Primer kopiran!",
      copy_cta: "Kopiraj primer",
    },
    es: {
      title: "El Códice de Belgrado y Etiqueta",
      subtitle:
        "Un compendio selecto de modismos, matices locales y normas tácitas para el viajero exigente.",
      pronounced: "PRONUNCIACIÓN:",
      literal: "Significado y Contexto",
      concierge_spirit: "Matiz del Conserje",
      etiquette_oath: "Nota de Etiqueta Cultural",
      pledge_compliance: "Asimilar y Registrar Protocolo",
      pledged: "registrado en diario de viaje",
      not_pledged: "marcar como estudiado",
      example_title: "Aplicación Diaria en Belgrado",
      copied: "¡Copiado!",
      copy_cta: "Copiar frase",
    },
    de: {
      title: "Der Belgrader Kodex & Knigge",
      subtitle:
        "Eine erlesene Sammlung kultureller Redewendungen, Nuancen und ungeschriebener Regeln für kultivierte Reisende.",
      pronounced: "AUSSPRACHE:",
      literal: "Bedeutung & Definition",
      concierge_spirit: "Concierge-Einsicht",
      etiquette_oath: "Kultureller Verhaltenskodex",
      pledge_compliance: "Verhaltensregel verinnerlichen",
      pledged: "im Reisetagebuch vermerkt",
      not_pledged: "als gelernt markieren",
      example_title: "Alltägliche Anwendung in Belgrad",
      copied: "Kopiert!",
      copy_cta: "Satz kopieren",
    },
    ru: {
      title: "Белградский кодекс и этикет",
      subtitle:
        "Кураторское собрание идиоматических нюансов, культурных кодов и негласных правил для взыскательного путешественника.",
      pronounced: "ПРОИЗНОШЕНИЕ:",
      literal: "Значение и контекст",
      concierge_spirit: "Тонкости консьержа",
      etiquette_oath: "Заметки по культурному этикету",
      pledge_compliance: "Изучить и зафиксировать правило",
      pledged: "отмечено в путевом дневнике",
      not_pledged: "отметить как изученное",
      example_title: "Ежедневное применение в Белграде",
      copied: "Скопировано в буфер!",
      copy_cta: "Скопировать фразу",
    },
    zh: {
      title: "贝尔格莱德社交流量法典",
      subtitle:
        "为品位非凡的行者专属定制的民俗术语、地道语境与无形社交礼仪指南。",
      pronounced: "发音指南：",
      literal: "原意与释义",
      concierge_spirit: "私属管家指津",
      etiquette_oath: "地道社交礼仪注解",
      pledge_compliance: "研读并内化此项社交原则",
      pledged: "已登记在行旅备忘录",
      not_pledged: "标为已熟读",
      example_title: "贝尔格莱德日常对话写照",
      copied: "示例已复制！",
      copy_cta: "复制口语示范",
    },
  };

  const l = uiLabels[language] || uiLabels["en"];

  const handleCopyExample = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerHaptic(50);
  };

  return (
    <div className="space-y-6">
      {/* Container Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-accent-red" />
          <h3 className="text-xl font-serif text-brand-charcoal tracking-tight">
            {l.title} 🇷🇸
          </h3>
        </div>
        <p className="text-sm text-[#4C4E44] italic leading-relaxed font-sans font-medium">
          {l.subtitle}
        </p>
      </div>

      {/* Tactile Slavic Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {SLANG_TERMS.map((term, i) => {
          const isActive = activeTermIndex === i;
          return (
            <button
              id={`slang-tab-${term.id}`}
              key={term.id}
              onClick={() => selectTerm(i)}
              className={`px-3.5 py-2.5 rounded-2xl text-[15px] uppercase font-bold tracking-widest transition-all cursor-pointer whitespace-nowrap shrink-0 border outline-none ${
                isActive
                  ? "bg-brand-charcoal border-brand-charcoal text-white shadow-tactile"
                  : "bg-[#FAF9F5] border-border-main/55 text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-[#F3F2EC]"
              }`}
            >
              {term.cyrillic}
            </button>
          );
        })}
      </div>

      {/* Parchment Main Content Grid Carousel */}
      <div className="relative -mx-6">
        <PremiumCarousel
          items={SLANG_TERMS}
          height="600px"
          itemWidth={295}
          currentIndex={activeTermIndex}
          onIndexChange={(idx) => setActiveTermIndex(idx)}
          renderItem={(term, isCenter) => {
            const isPledged = pledges[term.id];
            return (
              <div
                className={`h-[560px] p-5.5 rounded-[32px] flex flex-col justify-between text-left group transition-all duration-300 ${
                  isCenter
                    ? "bg-white border-2 border-brand-charcoal/25 shadow-[0_12px_28px_rgba(45,48,37,0.14)] opacity-100"
                    : "bg-[#EDE9DE] border border-border-main shadow-[0_4px_12px_rgba(0,0,0,0.06)] opacity-70"
                }`}
              >
                {/* Scrollable details wrapper to guarantee no truncation */}
                <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-2">
                  <div className="flex justify-between items-start border-b border-border-main/10 pb-3">
                    <div>
                      <span className="text-3xl font-serif text-brand-charcoal font-black tracking-tight">
                        {term.cyrillic}
                      </span>
                      <span className="text-xs text-brand-charcoal/40 font-mono italic ml-2">
                        ({term.word})
                      </span>
                    </div>
                    <span className="text-[8.5px] font-mono uppercase bg-brand-pearl text-[#8C8A7D] tracking-wider px-2 py-0.5 rounded-md leading-none border border-border-main/30 flex items-center gap-1">
                      <Sparkles size={10} className="text-accent-teal" />
                      No {SLANG_TERMS.indexOf(term) + 1}
                    </span>
                  </div>

                  {/* Pronunciation block */}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] uppercase font-black tracking-widest text-[#8C8A7D] font-mono leading-none">
                      {l.pronounced}
                    </span>
                    <span className="text-[13.5px] font-bold font-mono text-accent-red tracking-wider bg-accent-red/5 border border-accent-red/15 px-2.5 py-1 rounded-xl uppercase leading-none">
                      {term.phonetic}
                    </span>
                  </div>

                  {/* Translation block */}
                  <div className="space-y-1">
                    <h5 className="text-[13.5px] uppercase tracking-widest text-[#8C8A7D] font-black">
                      {l.literal}
                    </h5>
                    <p className="text-[21px] font-serif text-brand-charcoal leading-snug">
                      {term.meaning[language] || term.meaning.en}
                    </p>
                  </div>

                  {/* Nuance block */}
                  <div className="space-y-1">
                    <h5 className="text-[13.5px] uppercase tracking-widest text-[#8C8A7D] font-black">
                      {l.concierge_spirit}
                    </h5>
                    <p className="text-[16.5px] leading-relaxed text-[#4A4C40]/90 font-light italic">
                      {term.nuance[language] || term.nuance.en}
                    </p>
                  </div>

                  {/* Dialog examples block */}
                  <div className="p-4 bg-brand-pearl/50 border border-border-main/40 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h6 className="text-[12px] font-bold uppercase tracking-widest text-[#8C8A7D]">
                        {l.example_title}
                      </h6>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyExample(
                            term.example[language] || term.example.en,
                          );
                        }}
                        className="text-[13.5px] uppercase font-bold tracking-wider text-accent-teal hover:underline cursor-pointer"
                      >
                        {l.copy_cta}
                      </button>
                    </div>
                    <p className="text-[16.5px] font-mono text-brand-charcoal font-bold italic leading-relaxed">
                      “{term.example[language] || term.example.en}”
                    </p>
                  </div>
                </div>

                {/* Bottom Etiquette Shield Oath */}
                <div className="pt-3 border-t border-[#F1EFE9] space-y-3">
                  <div
                    className={`p-3 rounded-2xl border flex gap-2.5 items-start ${t_localColors[term.id] || "bg-[#FAF9F5] border-border-main/50 text-[#8C8A7D]"}`}
                  >
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <span className="text-[13.5px] uppercase font-black tracking-widest block leading-none">
                        {l.etiquette_oath}
                      </span>
                      <p className="text-[16.5px] leading-snug font-sans font-light">
                        {term.etiquetteTips[language] || term.etiquetteTips.en}
                      </p>
                    </div>
                  </div>

                  {/* Pledge button */}
                  <button
                    id={`slang-pledge-${term.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePledge(term.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-[14px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPledged
                        ? "bg-accent-teal border-accent-teal text-white shadow-inner shadow-black/10"
                        : "bg-white border-border-main text-[#2D3025] hover:bg-brand-pearl"
                    }`}
                  >
                    <CheckCircle
                      size={12}
                      className={isPledged ? "text-white" : "text-[#2D3025]/20"}
                    />
                    <span className="truncate">
                      {isPledged ? l.pledged : l.not_pledged}
                    </span>
                  </button>
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
