import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Info,
  Sparkles,
  Shirt,
  DollarSign,
} from "lucide-react";
import { Recommendation } from "../types";
import { triggerHaptic } from "../App";
import { safeStorage } from "../lib/safeStorage";

interface PrepEtiquetteGuideProps {
  recommendation: Recommendation;
  language: string;
}

export function PrepEtiquetteGuide({
  recommendation,
  language,
}: PrepEtiquetteGuideProps) {
  const categoryStr = (recommendation.category || "").toLowerCase();
  const recId = recommendation.id;

  // Local state for checking items
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load persisted checkbox status
    try {
      const saved = safeStorage.getItem(`idemo_prep_${recId}`);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      } else {
        setCheckedItems({});
      }
    } catch (e) {
      console.warn("Failed to load checklist persistence", e);
    }
  }, [recId]);

  const toggleItem = (itemId: string) => {
    const nextCheckState = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId],
    };
    setCheckedItems(nextCheckState);
    triggerHaptic(30);

    try {
      safeStorage.setItem(
        `idemo_prep_${recId}`,
        JSON.stringify(nextCheckState),
      );
    } catch (e) {
      console.warn("Failed to save checklist state", e);
    }
  };

  // Content source of truth for the concierge tips
  const content: Record<string, any> = {
    en: {
      title: "Concierge Preparation & Etiquette",
      subtitle: "Tailored insights to match local Belgrade standards",
      tipping_label: "Serbian Tipping Culture",
      dress_label: "Dress Code & Vibe",
      checklist_label: "Essential Preparation Steps",
      completed_status: "Fully Prepared",
      not_completed: "Preparation Pending",
      types: {
        gastronomy_clubbing: {
          tipping:
            "10% cash/card in restaurants is the gold standard. In high-end lounges, round up bills. Splavovi (river clubs) require cash tips to keep tables secure.",
          dress:
            "Belgrade Elegance / Smart Casual. Avoid athletic shorts, sandals, or heavy sportswear after 19:00 at Michelin-referenced destinations.",
          items: [
            {
              id: "res_auth",
              label: "VIP reservation secured via Concierge desk",
            },
            {
              id: "cash_din",
              label: "Carry Dinars (RSD) for cash-only gratuities",
            },
            {
              id: "late_vibe",
              label: "Arrive fashionably: dinner peaks after 21:00",
            },
          ],
        },
        history_culture: {
          tipping:
            "Not expected at monuments or public exhibits. For private tour guides, 500-1000 RSD is standard and highly appreciated.",
          dress:
            "Respectful / Sanctuary Modest. Orthodox monasteries and historical churches require covered shoulders and long trousers/skirts.",
          items: [
            {
              id: "mod_app",
              label: "Ensure shoulders and knees are fully covered",
            },
            {
              id: "silent_mode",
              label: "Enable silent mode on communication devices",
            },
            {
              id: "footwear",
              label: "Wear walking shoes for Belgrade Fortress stone pavements",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "Round up to the nearest 100 RSD for wellness therapist staff. Gratuity box at standard premium spas is common.",
          dress:
            "Comfort apparel, robust outerwear for scenic outdoor trails. Bring sleek indoor swimwear & protective pool slippers.",
          items: [
            {
              id: "spa_app",
              label: "Pack premium swim wear and light dry change",
            },
            {
              id: "water_bottle",
              label: "Carry hydration (Srbija tap water is highly safe)",
            },
            {
              id: "digital_slip",
              label: "Prepare offline voucher or booking receipt reference",
            },
          ],
        },
        general: {
          tipping:
            "Round up small café checks to nearest 50-100 RSD. Politeness with local greetings is more valued than large financial gestures.",
          dress:
            "Clean Casual / Smart Contemporary. Feel loose, artistic, and modern like citizens of Vračar or Stari Grad.",
          items: [
            {
              id: "hello_sr",
              label: "Learn to say Hello (Dobar dan) and Thank you (Hvala)",
            },
            {
              id: "map_cache",
              label: "Confirm offline Belgrade directions template is saved",
            },
            {
              id: "battery",
              label: "Fully charge mobile for premium photos and QR boarding",
            },
          ],
        },
      },
    },
    sr: {
      title: "Priprema i srpski bonton",
      subtitle: "Personalizovane smernice prilagođene beogradskim standardima",
      tipping_label: "Srpska kultura napojnica",
      dress_label: "Kodeks oblačenja i atmosfera",
      checklist_label: "Ključni koraci za pripremu",
      completed_status: "Sve je spremno!",
      not_completed: "Priprema u toku...",
      types: {
        gastronomy_clubbing: {
          tipping:
            "10% u restoranima je nepisano pravilo. U luksuznim lokalima zaokružite račun. Splavovi zahtevaju keš za obezbeđivanje rezervisane lokacije.",
          dress:
            "Beogradska elegancija / Smart Casual. Izbegavajte sportske šorceve i papuče posle 19:00 u renomiranim kulinarskim mestima.",
          items: [
            {
              id: "res_auth",
              label: "Obezbeđena VIP rezervacija putem Konsijerž tima",
            },
            {
              id: "cash_din",
              label: "Ponesite dinare (RSD) za gotovinske napojnice",
            },
            {
              id: "late_vibe",
              label: "Krenite lagano: večera počinje najčešće posle 21:00",
            },
          ],
        },
        history_culture: {
          tipping:
            "Nije uobičajeno na spomenicima. Za privatne vodiče, 500-1000 RSD je izraz velikog poštovanja.",
          dress:
            "Pristojna / Manastirska odeća. Hramovi i crkve zahtevaju pokrivena ramena i duge pantalone ili suknje.",
          items: [
            {
              id: "mod_app",
              label:
                "Proverite da li su ramena i kolena u potpunosti pokriveni",
            },
            {
              id: "silent_mode",
              label: "Utišajte mobilne uređaje u hramovima i muzejima",
            },
            {
              id: "footwear",
              label: "Udobna obuća za kaldrmu i kamenje Beogradske tvrđave",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "Zaokružite račun terapeutu ili maseru na najbližih 100-200 RSD. Kutije za bakšiš su standardne u spa centrima.",
          dress:
            "Udobna sportska odeća za pešačke staze. Ponesite kupaći kostim i odgovarajuće papuče za bazene.",
          items: [
            {
              id: "spa_app",
              label: "Spakujte kupaći kostim i laganu presvlaku",
            },
            {
              id: "water_bottle",
              label: "Ponesite vodu (česmuša u Beogradu je potpuno bezbedna)",
            },
            {
              id: "digital_slip",
              label: "Pripremite oflajn vaučer ili potvrdu o uplati",
            },
          ],
        },
        general: {
          tipping:
            "U kafićima zaokružite manji račun za 50 do 100 RSD. Iskren osmeh i topli pozdrav znače više od samog bakšiša.",
          dress:
            "Čist Casual / Elegantno opušteno. Budite opušteni, umetnički i moderni poput stanara Vračara.",
          items: [
            {
              id: "hello_sr",
              label: 'Naučite osnovne reči: \"Dobar dan\" i \"Hvala\"',
            },
            {
              id: "map_cache",
              label: "Proverite da li su lokalna uputstva sačuvana u memoriji",
            },
            {
              id: "battery",
              label: "Napunite bateriju za vrhunske fotografije i QR kodove",
            },
          ],
        },
      },
    },
    es: {
      title: "Preparación y Etiqueta Concierge",
      subtitle:
        "Información a medida para cumplir con los estándares de Belgrado",
      tipping_label: "Cultura de Propinas en Serbia",
      dress_label: "Código de Vestimenta y Ambiente",
      checklist_label: "Pasos esenciales para preparar",
      completed_status: "Todo Listo",
      not_completed: "Planificación Pendiente",
      types: {
        gastronomy_clubbing: {
          tipping:
            "El 10% en restaurantes es la regla de oro. En bares de alta gama, redondeé. Los Clubes Flotantes (Splavovi) sugieren efectivo.",
          dress:
            "Elegancia de Belgrado / Casual Elegante. Evite pantalones deportivos o chanclas tras las 19:00 en sitios michelin.",
          items: [
            {
              id: "res_auth",
              label: "Confirmar reservación VIP vía mesa Concierge",
            },
            {
              id: "cash_din",
              label: "Llevar dinares serbios (RSD) para las propinas directas",
            },
            {
              id: "late_vibe",
              label:
                "Llegue con elegancia: la cena se activa después de las 21:00",
            },
          ],
        },
        history_culture: {
          tipping:
            "No esperable en monumentos. Para guías privados locales, de 500 a 1000 RSD es estándar.",
          dress:
            "Conservador / Modesto. Los monasterios ortodoxos exigen hombros cubiertos y pantalones o faldas largas.",
          items: [
            {
              id: "mod_app",
              label: "Verifique tener hombros y rodillas cubiertas",
            },
            {
              id: "silent_mode",
              label: "Silencie el teléfono dentro de iglesias o museos",
            },
            {
              id: "footwear",
              label:
                "Calce calzado resistente para las piedras de la Fortaleza",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "Redondeé hasta los 100 RSD más cercanos para el masajista/terapeuta.",
          dress:
            "Atuendo cómodo y capa impermeable. Traiga traje de baño fino y sandalias limpias.",
          items: [
            {
              id: "spa_app",
              label: "Empaque traje de baño y una toallita de microfibra",
            },
            {
              id: "water_bottle",
              label:
                "Cargue agua para hidratarse (el grifo es perfectamente potable)",
            },
            {
              id: "digital_slip",
              label: "Tenga a mano el boleto, cupón / código guardado",
            },
          ],
        },
        general: {
          tipping:
            "Redondeé las cuentas del café hacia los 50-100 RSD. Un saludo cordial es altamente valorado por los locales.",
          dress: "Ocasional Limpio / Contemporáneo Inteligente.",
          items: [
            {
              id: "hello_sr",
              label: "Aprenda a decir hola (Dobar dan) y gracias (Hvala)",
            },
            {
              id: "map_cache",
              label: "Confirme que las direcciones estén en caché offline",
            },
            {
              id: "battery",
              label: "Cargue su teléfono para fotos y tickets QR",
            },
          ],
        },
      },
    },
    de: {
      title: "Concierge-Vorbereitungsguide",
      subtitle: "Persönliche Insider-Tipps für Belgrader Etikette",
      tipping_label: "Trinkgeld-Kultur in Serbien",
      dress_label: "Dresscode & Vibe",
      checklist_label: "Wichtige Vorbereitungsschritte",
      completed_status: "Rundum Vorbereitet",
      not_completed: "Vorbereitung offen",
      types: {
        gastronomy_clubbing: {
          tipping:
            "10% in Restaurants ist der Standard. In Premium-Lounges runden Sie auf. Splavovi (Flussclubs) erfordern Bargeld für Service.",
          dress:
            "Belgrade Chic / Smart Casual. Keine sportlichen Shorts oder Sandalen ab 19:00 Uhr bei gehobenen Adressen.",
          items: [
            {
              id: "res_auth",
              label: "VIP-Gästelistenplatz über Concierge gesichert",
            },
            {
              id: "cash_din",
              label: "Bargeld in Dinar (RSD) für Trinkgeld mitführen",
            },
            {
              id: "late_vibe",
              label: "Zeitplanung anpassen: Abendessen startet ab 21:00 Uhr",
            },
          ],
        },
        history_culture: {
          tipping:
            "An Denkmälern nicht erwartet. Private Tourguides freuen sich über 500-1000 RSD Anerkennung.",
          dress:
            "Respektvoll / Kirchlich bedeckt. Orthodoxe Kirchen verlangen gedeckte Schultern und Knie.",
          items: [
            {
              id: "mod_app",
              label: "Schultern und Knie für Sakralbauten bedecken",
            },
            {
              id: "silent_mode",
              label: "Telefon in Museen und Kapellen stumm schalten",
            },
            {
              id: "footwear",
              label: "Festes Schuhwerk für historische Festungspfade",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "Für Therapeuten runden Sie diskret auf die nächsten 100-200 RSD auf.",
          dress:
            "Bequeme Outdoorkleidung. Eigene Badeschuhe und schlichte Swimwear für Spa-Bereiche.",
          items: [
            {
              id: "spa_app",
              label: "Badetasche mit sauberem Handtuch vorbereiten",
            },
            {
              id: "water_bottle",
              label: "Eigenes Wasser dabeihaben (Leitungswasser ist trinkbar)",
            },
            {
              id: "digital_slip",
              label: "Buchungsnummer / Buchung offline bereithalten",
            },
          ],
        },
        general: {
          tipping:
            "Im Café runden Sie um 50-100 RSD auf. Höflichkeit schlägt Summen.",
          dress: "Clean Casual / Zeitgemäß gepflegt.",
          items: [
            {
              id: "hello_sr",
              label: "Lernen Sie Hallo (Dobar dan) und Danke (Hvala) zu sagen",
            },
            {
              id: "map_cache",
              label: "Wegbeschreibung und Adresse offline speichern",
            },
            {
              id: "battery",
              label: "Handy für Tickets und Fotos ausreichend laden",
            },
          ],
        },
      },
    },
    ru: {
      title: "Подготовка и белградский этикет",
      subtitle: "Рекомендации консьержа для комфортного отдыха без накладок",
      tipping_label: "Культура чаевых в Сербии",
      dress_label: "Дресс-код и стиль",
      checklist_label: "Список необходимых приготовлений",
      completed_status: "Всё готово!",
      not_completed: "Необходимо подготовиться",
      types: {
        gastronomy_clubbing: {
          tipping:
            "10% в ресторанах — золотой стандарт. В барах высокого уровня принято округлять счет. На сплавах (клубах на реке) чаевые дают наличными.",
          dress:
            "Belgrade Elegance / Smart Casual. Избегайте спортивных шорт, маек и открытых сланцев после 19:00 в ресторанах Michelin.",
          items: [
            {
              id: "res_auth",
              label: "Подтверждена резервация стола консьержем",
            },
            {
              id: "cash_din",
              label:
                "Заготовьте наличные динары (RSD) для обслуживающего персонала",
            },
            {
              id: "late_vibe",
              label: "Не спешите: ужин в Сербии расцветает после 21:00",
            },
          ],
        },
        history_culture: {
          tipping:
            "В музеях не требуется. Частному гиду принято дарить признательность в 500-1000 RSD.",
          dress:
            "Благопристойный / Манеры приличия. В храмах православных монастырей обязательны закрытые плечи и колени.",
          items: [
            {
              id: "mod_app",
              label: "Проверьте закрытые плечи и одежду ниже колен",
            },
            {
              id: "silent_mode",
              label: "Переведите телефоны в беззвучный режим в святых обителях",
            },
            {
              id: "footwear",
              label:
                "Наденьте удобную обувь для каменной брусчатки Белградской крепости",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "Рекомендуется округлить чаевые терапевту в спа до ближайших 100-200 динаров.",
          dress:
            "Удобная спортивная одежда и ветровка. Возьмите купальные принадлежности и чистую сменную обувь.",
          items: [
            {
              id: "spa_app",
              label: "Приготовьте купальник, плавки и личные шлепанцы",
            },
            {
              id: "water_bottle",
              label:
                "Возьмите бутылку воды (водопроводная вода в Белграде пригодна для питья)",
            },
            {
              id: "digital_slip",
              label: "Сохраните билет, ваучер или квитанцию на телефоне",
            },
          ],
        },
        general: {
          tipping:
            "В кофейнях округлите мелкие счета на 50-100 динаров. Вежливость и добрый разговор здесь очень любят.",
          dress: "Clean Casual / Прогрессивный городской стиль.",
          items: [
            {
              id: "hello_sr",
              label:
                "Выучите основы: Здравствуйте (Dobar dan) и Спасибо (Hvala)",
            },
            {
              id: "map_cache",
              label: "Убедитесь, что маршрут доступен офлайн в приложении",
            },
            {
              id: "battery",
              label:
                "Зарядите телефон, чтобы легко фотографировать и считывать QR-код",
            },
          ],
        },
      },
    },
    zh: {
      title: "尊享世博会礼仪与准备",
      subtitle: "为高品质客户定制的贝尔格莱德本地规范指南",
      tipping_label: "塞尔维亚小费礼仪",
      dress_label: "着装规范与现场氛围",
      checklist_label: "出发及入场必备检查",
      completed_status: "已全部准备就绪",
      not_completed: "正在准备中...",
      types: {
        gastronomy_clubbing: {
          tipping:
            "餐厅内消费总额的10%是标准。在高档酒廊，建议整数对齐。河上浮动俱乐部（Splavovi）服务需用现金小费致谢。",
          dress:
            "贝尔格莱德经典优雅 / 雅致休闲。19:00后在米其林推荐名店请避免穿着运动短裤、凉拖鞋或宽松运动装。",
          items: [
            { id: "res_auth", label: "已通过VIP管家服务台获得专属席位预订" },
            { id: "cash_din", label: "携带部分第纳尔（RSD）纸币用于面付小费" },
            {
              id: "late_vibe",
              label: "时间规划：晚餐通常要在21点后才会进入高峰氛围",
            },
          ],
        },
        history_culture: {
          tipping:
            "纪念馆和公展区不强制给。向私人导游提供500-1000 RSD是极佳致谢意向。",
          dress:
            "端庄庄重 / 敬拜礼俗。东正教修道院及圣殿要求穿着遮盖肩膀、男士下装过膝、女士着长裙或长裤。",
          items: [
            { id: "mod_app", label: "确保入场时肩膀与膝盖处于遮盖状态" },
            { id: "silent_mode", label: "进入教堂及展馆内请开启手机静音模式" },
            {
              id: "footwear",
              label: "穿着防滑行走鞋，贝尔格莱德要塞内部多石板和卵石路",
            },
          ],
        },
        wellbeing_nature: {
          tipping:
            "疗养师/理疗师可将余额四舍五入至最接近的100或200 RSD小费箱。",
          dress: "舒适随步活动装。带好拖鞋及深色游泳装入内使用疗养涉水项目。",
          items: [
            { id: "spa_app", label: "打包准备干净泳衣以及快干备用换洗衣物" },
            {
              id: "water_bottle",
              label: "备一瓶水（贝尔格莱德自来水可放心直接饮用）",
            },
            {
              id: "digital_slip",
              label: "将电子凭证或预约确认邮件截图保存，防信号盲区",
            },
          ],
        },
        general: {
          tipping:
            "在咖啡馆将小钱凑整50或100 RSD。塞尔维亚人热情随和，问候比小费款项更能令其欣然欢喜。",
          dress:
            "时尚休闲 / 都市简约风。让自己沉浸于贝尔格莱德老城（Stari Grad）艺术感和市民活力中。",
          items: [
            {
              id: "hello_sr",
              label: "学会运用塞尔维亚语问候：你好 (Dobar dan) 和 谢谢 (Hvala)",
            },
            { id: "map_cache", label: "确保离线导航地址复制模板无误" },
            {
              id: "battery",
              label: "电量保持充沛，以方便拍摄贝尔格莱德风采与存储电子票证",
            },
          ],
        },
      },
    },
  };

  const l = content[language] || content["en"];

  // Match appropriate config based on category string
  const getCategoryConfig = () => {
    if (
      categoryStr.includes("gastronomy") ||
      categoryStr.includes("clubbing") ||
      categoryStr.includes("food") ||
      categoryStr.includes("bar")
    ) {
      return l.types.gastronomy_clubbing;
    }
    if (
      categoryStr.includes("history") ||
      categoryStr.includes("culture") ||
      categoryStr.includes("museum")
    ) {
      return l.types.history_culture;
    }
    if (
      categoryStr.includes("wellbeing") ||
      categoryStr.includes("nature") ||
      categoryStr.includes("medical") ||
      categoryStr.includes("adventure") ||
      categoryStr.includes("spa")
    ) {
      return l.types.wellbeing_nature;
    }
    return l.types.general;
  };

  const config = getCategoryConfig();
  const items = config.items || [];

  // Calculate completed count
  const checkedCount = items.filter(
    (item: any) => checkedItems[item.id],
  ).length;
  const isFullyPrepared = checkedCount === items.length;

  return (
    <div className="bg-[#FAF9F5] border border-[#E7E4DB] rounded-[32px] p-6 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent-teal" />
          <h4 className="text-[13px] uppercase tracking-[0.25em] text-brand-charcoal font-black">
            {l.title}
          </h4>
        </div>
        <span
          className={`text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-700 font-bold px-3 py-1 rounded-full ${
            isFullyPrepared ? "opacity-100 scale-100" : "opacity-60"
          } transition-all duration-300`}
        >
          {isFullyPrepared
            ? `✓ ${l.completed_status}`
            : `${checkedCount}/${items.length} ${l.not_completed}`}
        </span>
      </div>

      <p className="text-base text-[#5C5A4D] leading-relaxed font-sans italic font-medium">
        {l.subtitle}
      </p>

      {/* Info grids */}
      <div className="grid grid-cols-1 gap-3 pt-1">
        {/* Tipping advice */}
        <div className="bg-white border border-[#E7E4DB] p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-accent-teal/10 flex items-center justify-center shrink-0">
            <DollarSign size={16} className="text-accent-teal" />
          </div>
          <div className="space-y-1">
            <p className="text-[11.5px] uppercase tracking-widest text-[#155e5b] font-black">
              {l.tipping_label}
            </p>
            <p className="text-base leading-relaxed text-brand-charcoal font-semibold">
              {config.tipping}
            </p>
          </div>
        </div>

        {/* Dress code advice */}
        <div className="bg-white border border-[#E7E4DB] p-5 rounded-2xl flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-accent-red/10 flex items-center justify-center shrink-0">
            <Shirt size={15} className="text-accent-red" />
          </div>
          <div className="space-y-1">
            <p className="text-[11.5px] uppercase tracking-widest text-[#8A1F1F] font-black">
              {l.dress_label}
            </p>
            <p className="text-base leading-relaxed text-brand-charcoal font-semibold">
              {config.dress}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive packing check list */}
      <div className="pt-4 border-t border-[#F0EDE6] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#8C8A7D]" />
          <p className="text-[11px] uppercase tracking-widest text-[#6C6A5D] font-extrabold">
            {l.checklist_label}
          </p>
        </div>

        <div className="space-y-2.5">
          {items.map((item: any) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`w-full p-4.5 rounded-xl border text-left flex items-start gap-3.5 cursor-pointer transition-all outline-none active:scale-[0.99] group min-h-[52px] ${
                  isChecked
                    ? "bg-emerald-500/5 border-emerald-500/20 text-brand-charcoal/40 line-through decoration-brand-charcoal/20"
                    : "bg-white border-[#E7E4DB] hover:border-[#D5D3C8] text-brand-charcoal hover:shadow-xs"
                }`}
              >
                <div className="shrink-0 mt-0.5 transition-transform group-hover:scale-105 duration-200">
                  {isChecked ? (
                    <CheckSquare size={16} className="text-emerald-600" />
                  ) : (
                    <Square
                      size={16}
                      className="text-[#D5D3C8] group-hover:text-[#8C8A7D]"
                    />
                  )}
                </div>
                <span className="text-base leading-snug font-bold">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
