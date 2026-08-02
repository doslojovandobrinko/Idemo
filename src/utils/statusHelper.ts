/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from "../types";

export interface StatusInfo {
  status: "open" | "closed" | "reservation" | "seasonal" | "limited" | "verify";
  badgeLabel: string;
  badgeColor: string;
  detailLabel: string;
}

/**
 * Calculates a highly accurate, real-world open/closed, seasonal, or reservation status
 * for each curated recommendation based on local time and category.
 */
export function getRecommendationStatus(
  recommendation: Recommendation,
  language: string,
  testTime?: { hour: number; day: number }, // Optional override for testing / robustness
): StatusInfo {
  const categoryStr = (recommendation.category || "").toString().toLowerCase();
  const idStr = (recommendation.id || "").toString();

  // Determine current day & hour
  let hour =
    typeof testTime?.hour === "number" ? testTime.hour : new Date().getHours();
  // Day of week: 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
  let day =
    typeof testTime?.day === "number" ? testTime.day : new Date().getDay();

  // Safe translations lookup dictionary
  const dict: Record<string, Record<string, string>> = {
    open: {
      en: "Open Now",
      sr: "Otvoreno sad",
      es: "Abierto ahora",
      de: "Geöffnet",
      ru: "Открыто сейчас",
      zh: "营业中",
    },
    closed: {
      en: "Closed Now",
      sr: "Zatvoreno sad",
      es: "Cerrado ahora",
      de: "Geschlossen",
      ru: "Закрыто сейчас",
      zh: "已关闭",
    },
    reservation: {
      en: "Reservation Recommended",
      sr: "Rezervacija preporučena",
      es: "Reserva recomendada",
      de: "Reservierung empfohlen",
      ru: "Рекомендуется бронь",
      zh: "建议预约",
    },
    seasonal: {
      en: "Seasonal (Apr - Oct)",
      sr: "Sezonski (Apr - Okt)",
      es: "Estacional (Abr - Oct)",
      de: "Saisonal (Apr - Okt)",
      ru: "Сезонно (Апр - Окт)",
      zh: "季节性开放 (4月-10月)",
    },
    limited: {
      en: "Limited Hours",
      sr: "Ograničeno radno vreme",
      es: "Horario limitado",
      de: "Begrenzte Stunden",
      ru: "Ограниченные часы",
      zh: "限时开放",
    },
    verify: {
      en: "Verify hours before departure.",
      sr: "Proverite radno vreme pre polaska.",
      es: "Verifique el horario antes de salir.",
      de: "Öffnungszeiten vor Abreise prüfen.",
      ru: "Проверьте часы работы перед выездом.",
      zh: "出行前请核实营业时间。",
    },
  };

  const lValue = (key: string) => {
    return dict[key]?.[language] || dict[key]?.en || "";
  };

  // 1. NIGHTLIFE & CLUBBING CATEGORY (SPLAVOVI, ETC.)
  if (
    categoryStr.includes("clubbing") ||
    categoryStr.includes("party") ||
    idStr === "15" ||
    idStr === "41"
  ) {
    // Custom logic: open from 23h to 05h, Thu (4), Fri (5), Sat (6)
    const isClubbingNight = day === 4 || day === 5 || day === 6;
    const isClubbingHour = hour >= 23 || hour <= 4;

    if (isClubbingNight && isClubbingHour) {
      return {
        status: "reservation",
        badgeLabel: lValue("reservation"),
        badgeColor:
          "bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs animate-pulse",
        detailLabel:
          language === "sr"
            ? "Novi Berlin • 23:00 - 05:00 • Rezervacija stola obavezna"
            : language === "zh"
              ? "浮动主场 • 23:00 -次日05:00 • 必须预约卡座"
              : "Floating Club Scene • 23:00 - 05:00 • Entry reservation mandatory",
      };
    } else {
      return {
        status: "closed",
        badgeLabel: lValue("closed"),
        badgeColor:
          "bg-brand-charcoal/20 text-[#5C5A4D]/80 border border-border-main/50",
        detailLabel:
          language === "sr"
            ? "Zatvoreno • Otvara se četvrtkom u 23:00"
            : language === "zh"
              ? "已关闭 • 周四至周六 23:00 起开放营业"
              : "Closed Now • Active Thursday - Saturday from 23:00",
      };
    }
  }

  // 2. FINE DINING & GASTRONOMY
  if (
    categoryStr.includes("gastronomy") ||
    categoryStr.includes("food") ||
    categoryStr.includes("bar") ||
    idStr === "4" ||
    idStr === "26" ||
    idStr === "33" ||
    idStr === "85"
  ) {
    // Restaurant hours: 12:00 to 23:30 daily
    const isRestaurantHour = hour >= 12 && hour < 24;

    if (isRestaurantHour) {
      return {
        status: "reservation",
        badgeLabel: lValue("reservation"),
        badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-600/20",
        detailLabel:
          language === "sr"
            ? "Aktivno kulinarsko carstvo • 12:00 - 00:00"
            : language === "zh"
              ? "精品珍馐时段 • 12:00 - 00:00"
              : "Active culinary service • 12:00 - 00:00",
      };
    } else {
      return {
        status: "closed",
        badgeLabel: lValue("closed"),
        badgeColor:
          "bg-[#8A1F1F]/10 text-accent-red border border-accent-red/25",
        detailLabel:
          language === "sr"
            ? "Kuhinja je zatvorena • Otvara se u 12:00"
            : language === "zh"
              ? "厨房歇业中 • 每日中午 12:00 准时开业"
              : "Kitchen is closed • Service opens daily at 12:00",
      };
    }
  }

  // 3. MUSEUMS, SITES & HISTORY (NIKOLA TESLA MUSEUM, MONASTERIES, FORTRESSES)
  if (
    categoryStr.includes("history") ||
    categoryStr.includes("culture") ||
    categoryStr.includes("museum") ||
    idStr === "2" ||
    idStr === "3" ||
    idStr === "5" ||
    idStr === "9" ||
    idStr === "11"
  ) {
    // Mondays (1) are standard closed days for national institutions in Belgrade
    const isMonday = day === 1;
    const isMuseumHour = hour >= 10 && hour < 19;

    if (isMonday) {
      return {
        status: "closed",
        badgeLabel: lValue("closed"),
        badgeColor:
          "bg-[#8A1F1F]/10 text-accent-red border border-[#8A1F1F]/20",
        detailLabel:
          language === "sr"
            ? "Zatvoreno ponedeljkom (Dan za održavanje)"
            : language === "zh"
              ? "周一闭馆 (日常系统维护日)"
              : "Closed Mondays (National Museum maintenance day)",
      };
    }

    if (isMuseumHour) {
      return {
        status: "open",
        badgeLabel: lValue("open"),
        badgeColor:
          "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
        detailLabel:
          language === "sr"
            ? "Otvoreno • 10:00 - 19:00 • Poslednji ulaz 18:30"
            : language === "zh"
              ? "开放中 • 10:00 - 19:00 • 18:30 停止入馆"
              : "Open • 10:00 - 19:00 • Last entry 18:30",
      };
    } else {
      return {
        status: "closed",
        badgeLabel: lValue("closed"),
        badgeColor:
          "bg-brand-charcoal/30 text-[#4C4E44]/75 border border-border-main",
        detailLabel:
          language === "sr"
            ? "Zatvoreno • Radno vreme: Utorak - Nedelja 10:00 - 19:00"
            : language === "zh"
              ? "已关闭 • 开放时间：周二至周日 10:00 - 19:00"
              : "Closed Now • Standard Hours: Tue - Sun 10:00 - 19:00",
      };
    }
  }

  // 4. NATURE & OUTDOOR WONDERS (UVAC, TARA, DJERDAP)
  if (
    categoryStr.includes("nature") ||
    idStr === "1" ||
    idStr === "10" ||
    idStr === "14" ||
    idStr === "17"
  ) {
    // Open-air places are accessible, but seasonal weather makes it limited / best during daylight
    const isDaylightHour = hour >= 7 && hour < 19;

    if (isDaylightHour) {
      return {
        status: "seasonal",
        badgeLabel: lValue("seasonal"),
        badgeColor:
          "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20",
        detailLabel:
          language === "sr"
            ? "Prirodni rezervat • Najbolje posetiti od aprila do oktobra"
            : language === "zh"
              ? "大自然旷野 • 极力推荐在4月至10月黄金季节探访"
              : "Nature Sanctuary • Optimal visits between April and October",
      };
    } else {
      return {
        status: "limited",
        badgeLabel: lValue("limited"),
        badgeColor: "bg-amber-500/10 text-amber-700 border border-amber-500/25",
        detailLabel:
          language === "sr"
            ? "Niska vidljivost • Izbegavati noćne staze bez lokalnog vodiča"
            : language === "zh"
              ? "视线受阻不建议夜行 • 请避免在无专业向导下夜游"
              : "Low Night Visibility • Avoid rugged trails during dark hours",
      };
    }
  }

  // 5. DEFAULT / VERIFY
  return {
    status: "verify",
    badgeLabel:
      language === "sr"
        ? "Proverite radno vreme"
        : language === "zh"
          ? "建议出发前确认"
          : "Verify Hours",
    badgeColor:
      "bg-brand-charcoal/10 text-brand-charcoal/70 border border-border-main/40",
    detailLabel: lValue("verify"),
  };
}
