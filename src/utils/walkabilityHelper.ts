/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from "../types";

export interface WalkabilityInfo {
  distanceLabel: string;
  walkingTime: string;
  terrain: string;
  elevation: string;
  friendliness: string;
  badgeColor: string;
}

/**
 * Returns premium walking, elevation, and terrain insights for Serbia's destinations.
 */
export function getRecommendationWalkability(
  recommendation: Recommendation,
  language: string,
  distanceFromHub?: number, // Option to compute dynamic walking time if near Belgrade hub
): WalkabilityInfo {
  const categoryStr = (recommendation.category || "").toString().toLowerCase();
  const idStr = (recommendation.id || "").toString();

  // Translations
  const dict: Record<string, Record<string, string>> = {
    elevation_flat: {
      en: "Flat (±5m change)",
      sr: "Ravno (±5m razlike)",
      es: "Plano (±5m cambio)",
      de: "Flach (±5m)",
      ru: "Плоский рельеф",
      zh: "平坦起伏（步道起伏 ±5米）",
    },
    elevation_mount: {
      en: "Steep paths (+180m rise)",
      sr: "Strma staza (+180m uspon)",
      es: "Senda inclinada (+180m ascenso)",
      de: "Steilpfade (+180m Steigung)",
      ru: "Крутой подъем (+180м)",
      zh: "陡峭攀爬 (落差约 180米)",
    },
    elevation_mod: {
      en: "Moderate stairs (+35m rise)",
      sr: "Umerene stepenice (+35m uspon)",
      es: "Escaleras moderadas (+35m)",
      de: "Mäßige Stufen (+35m)",
      ru: "Лестничный подъем (+35м)",
      zh: "中等阶梯 (落差约 35米)",
    },

    terrain_paved: {
      en: "Paved city sidewalks",
      sr: "Popločani gadski trotoari",
      es: "Aceras urbanas pavimentadas",
      de: "Gepflasterte Gehwege",
      ru: "Городские тротуары",
      zh: "平整城市便道",
    },
    terrain_cobble: {
      en: "Cobblestones & uneven slabs",
      sr: "Kaldrma i neravne kamene ploče",
      es: "Adoquines y losas irregulares",
      de: "Kopfsteinpflaster",
      ru: "Историческая мостовая и брусчатка",
      zh: "经典鹅卵石与不规则石板路",
    },
    terrain_dirt: {
      en: "Dirt forest trails & gravel",
      sr: "Šumska zemljana i šljunčana staza",
      es: "Senderos de tierra y grava",
      de: "Wald- und Schotterwege",
      ru: "Лесные грунтовые тропы",
      zh: "森林泥土与碎石荒径",
    },

    friend_excellent: {
      en: "Excellent (Pedestrian zone)",
      sr: "Odlično (Pešačka zona)",
      es: "Excelente (Zona peatonal)",
      de: "Hervorragend (Fußgängerzone)",
      ru: "Идеально (Пешеходная зона)",
      zh: "极佳 (纯步行区)",
    },
    friend_moderate: {
      en: "Moderate (Standard city streets)",
      sr: "Umereno (Klasične gradske ulice)",
      es: "Moderado (Calles estándar)",
      de: "Mittelmäßig (Normale Straßen)",
      ru: "Специфически (Городские дороги)",
      zh: "中等 (城市常规街道)",
    },
    friend_trail: {
      en: "Wilderness (Needs hiking shoes)",
      sr: "Divljina (Obavezna planinska obuća)",
      es: "Montaña (Requiere calzado de senderismo)",
      de: "Wildnis (Wanderschuhe empfohlen)",
      ru: "Горная местность (Нужен протектор)",
      zh: "户外越野 (务必携带运动登山鞋)",
    },
  };

  const getT = (key: string) => dict[key]?.[language] || dict[key]?.en || "";

  // Calculate dynamic default based on distance
  if (distanceFromHub && distanceFromHub < 3.0) {
    const walkMins = Math.round(distanceFromHub * 12);
    return {
      distanceLabel: `${distanceFromHub} km`,
      walkingTime: `≈ ${walkMins} min ${language === "sr" ? "pešačenja" : language === "zh" ? "徒步" : "walk"}`,
      terrain: getT("terrain_paved"),
      elevation: getT("elevation_flat"),
      friendliness: getT("friend_excellent"),
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
    };
  }

  // 1. HIGH WILDERNESS TRAILS (Uvac, Tara, Devil's Town, Rtanj)
  if (
    categoryStr.includes("nature") ||
    idStr === "1" ||
    idStr === "10" ||
    idStr === "14" ||
    idStr === "17" ||
    idStr === "22" ||
    idStr === "27"
  ) {
    return {
      distanceLabel: distanceFromHub
        ? `${distanceFromHub} km`
        : "Wilderness Zone",
      walkingTime:
        language === "sr"
          ? "≈ 45-90 min aktivnog uspona"
          : language === "zh"
            ? "约 45-90 分钟徒步攀登"
            : "≈ 45-90 min active hike",
      terrain: getT("terrain_dirt"),
      elevation: getT("elevation_mount"),
      friendliness: getT("friend_trail"),
      badgeColor: "text-amber-700 bg-amber-50 border-amber-100",
    };
  }

  // 2. COBBLESTONE / STEPS HISTORIC CHEVRONS (Gardoš Tower, Kalemegdan Forts, Golubac Fortress)
  if (
    idStr === "3" ||
    idStr === "8" ||
    idStr === "9" ||
    idStr === "12" ||
    idStr === "47" ||
    categoryStr.includes("history")
  ) {
    return {
      distanceLabel: distanceFromHub
        ? `${distanceFromHub} km`
        : "Historic Landmark",
      walkingTime:
        language === "sr"
          ? "≈ 15-25 min lagane šetnje"
          : language === "zh"
            ? "约 15-25 分钟古迹踱步"
            : "≈ 15-25 min stroll",
      terrain: getT("terrain_cobble"),
      elevation: getT("elevation_mod"),
      friendliness: getT("friend_excellent"),
      badgeColor: "text-[#155e5b] bg-[#FAF9F5] border-emerald-100",
    };
  }

  // 3. URBAN WALKWAYS / INDOOR (Savamala, Tesla Museum, Beton Hala, Salon 1905)
  return {
    distanceLabel: distanceFromHub ? `${distanceFromHub} km` : "Urban Venue",
    walkingTime:
      language === "sr"
        ? "≈ 5-10 min ravnog pešačenja"
        : language === "zh"
          ? "约 5-10 分钟极其轻松"
          : "≈ 5-10 min level walking",
    terrain: getT("terrain_paved"),
    elevation: getT("elevation_flat"),
    friendliness: getT("friend_excellent"),
    badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
  };
}
