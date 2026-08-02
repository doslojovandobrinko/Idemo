/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from "../types";

/**
 * Group B — Editorial Concept Backlog
 * Incomplete or conceptual drafts retained for future editorial development.
 * These are excluded from the canonical production dataset.
 */
export const EDITORIAL_BACKLOG: Recommendation[] = [
  {
    id: "draft-41",
    title: "[CONCEPT DRAFT] A Serbian Table Worth the Journey",
    category: Category.GASTRONOMY,
    shortDescription:
      "A curated dining experience at a specific, verified rural destination that celebrates local heirloom ingredients and zero-kilometer cooking.",
    longDescription:
      "To be verified during the later integration phases, this culinary card targets an exceptional, high-concept farm-to-table estate that integrates generational recipes with modern culinary techniques, highlighting hand-pressed pumpkin seed oil, wild mushrooms, and traditional baking methods.",
    image: "/src/assets/images/salas_ethno_farm_food_1778847386244.webp",
    duration: "3-4 hours",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "To be verified",
    estimatedCost: "€30 - €70",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "premium",
    budgetLevel: "moderate",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Slow Food Estates of Piedmont (Italy)",
    },
    coordinates: {
      lat: 44.15,
      lng: 20.75,
    },
    coordinateX: 1,
    coordinateY: 2,
    radius: 4,
    energy: 4,
    social: 6,
    luxury: 4,
    urbanity: 3,
    nature: 5,
    weatherDependency: 3,
    translations: {
      sr: {
        title: "Srpska trpeza vredna putovanja",
        shortDescription:
          "A curated dining experience at a specific, verified rural destination that celebrates local heirloom ingredients and zero-kilometer cooking.",
        longDescription:
          "To be verified during the later integration phases, this culinary card targets an exceptional, high-concept farm-to-table estate that integrates generational recipes with modern culinary techniques, highlighting hand-pressed pumpkin seed oil, wild mushrooms, and traditional baking methods.",
        location: "To be verified",
      },
      zh: {
        title: "值得前往的塞尔维亚盛宴",
        shortDescription:
          "A curated dining experience at a specific, verified rural destination that celebrates local heirloom ingredients and zero-kilometer cooking.",
        longDescription:
          "To be verified during the later integration phases, this culinary card targets an exceptional, high-concept farm-to-table estate that integrates generational recipes with modern culinary techniques, highlighting hand-pressed pumpkin seed oil, wild mushrooms, and traditional baking methods.",
        location: "To be verified",
      },
    },
  },
  {
    id: "draft-42",
    title: "[CONCEPT DRAFT] From Market to Table",
    category: Category.GASTRONOMY,
    shortDescription:
      "A genuinely curated, hands-on market walking and cooking experience tracing fresh ingredients and traditional recipes.",
    longDescription:
      "To be verified and structured with local chefs, this card represents an active culinary walkthrough, taking travelers into traditional open markets to source ingredients, followed by an intimate cooking workshop preparing traditional Serbian specialties like ajvar or sarma.",
    image: "/src/assets/images/homa_restaurant_interior_1778843469455.webp",
    duration: "Half day",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "To be verified",
    estimatedCost: "€40 - €80",
    preferredTransport: "Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Boqueria Market Cooking Classes (Spain)",
    },
    coordinates: {
      lat: 44.802,
      lng: 20.474,
    },
    coordinateX: 0,
    coordinateY: 5,
    radius: 4,
    energy: 4,
    social: 7,
    luxury: 5,
    urbanity: 8,
    nature: 1,
    weatherDependency: 2,
    translations: {
      sr: {
        title: "Od pijace do trpeze (Beogradske pijace)",
        shortDescription:
          "A genuinely curated, hands-on market walking and cooking experience tracing fresh ingredients and traditional recipes.",
        longDescription:
          "To be verified and structured with local chefs, this card represents an active culinary walkthrough, taking travelers into traditional open markets to source ingredients, followed by an intimate cooking workshop preparing traditional Serbian specialties like ajvar or sarma.",
        location: "To be verified",
      },
      zh: {
        title: "从集市到餐桌（贝尔格莱德美食品鉴）",
        shortDescription:
          "A genuinely curated, hands-on market walking and cooking experience tracing fresh ingredients and traditional recipes.",
        longDescription:
          "To be verified and structured with local chefs, this card represents an active culinary walkthrough, taking travelers into traditional open markets to source ingredients, followed by an intimate cooking workshop preparing traditional Serbian specialties like ajvar or sarma.",
        location: "To be verified",
      },
    },
  },
  {
    id: "draft-44",
    title: "[CONCEPT DRAFT] The Creative Workshops of Belgrade",
    category: Category.TRAVEL,
    shortDescription:
      "A curated design crawl linking named, verified studios, print shops, and local makers keeping artisanal Belgrade crafts alive.",
    longDescription:
      "To be verified with specific makers, this card serves as an active link to Belgrade's local designer community. It highlights hand-binding bookmakers, modern pottery designers, and custom screenprinters, offering visitors direct contact with the modern creative pulse of Belgrade.",
    image: "/src/assets/images/belgrade_design_district_1778845854594.webp",
    duration: "3-4 hours",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "To be verified",
    estimatedCost: "Free",
    preferredTransport: "Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Artisan Studios of Marais (France)",
    },
    coordinates: {
      lat: 44.815,
      lng: 20.463,
    },
    coordinateX: 0,
    coordinateY: 5,
    radius: 4,
    energy: 5,
    social: 6,
    luxury: 4,
    urbanity: 8,
    nature: 1,
    weatherDependency: 2,
    translations: {
      sr: {
        title: "Kreativne radionice Beograda",
        shortDescription:
          "A curated design crawl linking named, verified studios, print shops, and local makers keeping artisanal Belgrade crafts alive.",
        longDescription:
          "To be verified with specific makers, this card serves as an active link to Belgrade's local designer community. It highlights hand-binding bookmakers, modern pottery designers, and custom screenprinters, offering visitors direct contact with the modern creative pulse of Belgrade.",
        location: "To be verified",
      },
      zh: {
        title: "贝尔格莱德的创意工坊",
        shortDescription:
          "A curated design crawl linking named, verified studios, print shops, and local makers keeping artisanal Belgrade crafts alive.",
        longDescription:
          "To be verified with specific makers, this card serves as an active link to Belgrade's local designer community. It highlights hand-binding bookmakers, modern pottery designers, and custom screenprinters, offering visitors direct contact with the modern creative pulse of Belgrade.",
        location: "To be verified",
      },
    },
  },
  {
    id: "draft-46",
    title: "[CONCEPT DRAFT] Contemporary Serbia Beyond Belgrade",
    category: Category.TRAVEL,
    shortDescription:
      "A rotating, verified gallery and design circuit highlighting modern visual art, industrial design, and cultural centers outside Belgrade.",
    longDescription:
      "To be verified in later production stages, this route highlights provincial galleries, cultural hubs, and industrial design studios located in towns like Novi Sad and Niš, presenting a multi-faceted portrait of modern Serbian design culture.",
    image: "/src/assets/images/national_theatre_novi_sad_1778847437149.webp",
    duration: "Full day",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "To be verified",
    estimatedCost: "€5 - €20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Contemporary Art Circuit of Leipzig (Germany)",
    },
    coordinates: {
      lat: 45.255,
      lng: 19.845,
    },
    coordinateX: -1,
    coordinateY: 5,
    radius: 4,
    energy: 5,
    social: 6,
    luxury: 4,
    urbanity: 7,
    nature: 2,
    weatherDependency: 2,
    translations: {
      sr: {
        title: "Savremena Srbija izvan Beograda",
        shortDescription:
          "A rotating, verified gallery and design circuit highlighting modern visual art, industrial design, and cultural centers outside Belgrade.",
        longDescription:
          "To be verified in later production stages, this route highlights provincial galleries, cultural hubs, and industrial design studios located in towns like Novi Sad and Niš, presenting a multi-faceted portrait of modern Serbian design culture.",
        location: "To be verified",
      },
      zh: {
        title: "贝尔格莱德之外的当代塞尔维亚",
        shortDescription:
          "A rotating, verified gallery and design circuit highlighting modern visual art, industrial design, and cultural centers outside Belgrade.",
        longDescription:
          "To be verified in later production stages, this route highlights provincial galleries, cultural hubs, and industrial design studios located in towns like Novi Sad and Niš, presenting a multi-faceted portrait of modern Serbian design culture.",
        location: "To be verified",
      },
    },
  },
];
