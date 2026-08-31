/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../../../types';

export const wellbeingRecommendations: Recommendation[] = [
  {
    "id": "4",
    "coordinateX": -3,
    "coordinateY": -2,
    "title": "Vrnjačka Banja",
    "category": "Wellbeing, Travel",
    "shortDescription": "The \"Queen of Serbian Spas\" combines Austro-Hungarian spa culture with Balkan thermal traditions. It maintains a functioning medical rehabilitation ecosystem since Roman times, with seven mineral springs and lush parklands.",
    "longDescription": "Known since Roman times as \"Aquae Orcinae,\" Vrnjačka Banja is the most celebrated of Serbia's mineral spas. It flourished in the 19th century under the patronage of Prince Miloš Obrenović and later the Karađorđević dynasty, reflecting an Austro-Hungarian \"Kurgarten\" elegance. The town features seven mineral springs, including Toplovič (the only one at human body temperature, 36.5°C). Landmarks like the Bridge of Love (Most ljubavi), where the tradition of padlocks allegedly began during WWI, add a layer of romantic folklore. Today, it combines specialized rehabilitation centers like \"Merkur\" with sophisticated Japanese gardens and expansive parks, maintaining its status as the \"Queen of Serbian Spas.\"",
    "image": "/src/assets/images/vrnjacka_banja_1778841098566.png",
    "duration": "Weekend to 1 week",
    "travelTime": "2.5 - 3 hours",
    "travelTimeMinutes": 160,
    "location": "Central Serbia",
    "estimatedCost":"€20 - €960+",
    "preferredTransport": "Car / Train",
    "coordinates": {
      "lat": 43.6214,
      "lng": 20.8924
    },
    "equivalents": {
      "en": "Bath Spa (UK)",
      "es": "Balnearios de Arnedillo (Spain)",
      "de": "Baden-Baden (Germany)",
      "ru": "Pyatigorsk Spas (Russia)",
      "zh": "Tangshan Hot Springs (China)"
    },
    "translations": {
      "sr": {
        "title": "Vrnjačka Banja",
        "shortDescription": "Kraljica srpskih banja sa tradicijom još iz rimskih vremena i sedam mineralnih izvora.",
        "longDescription": "Vrnjačka Banja je najpoznatije banjsko mesto u Srbiji, sa tradicijom lečenja koja datira još od vremena cara Konstantina. Pored lekovitih izvora, nudi luksuzne wellness centre i prelepe parkove idealne za šetnju. Čuvena je i po 'Mostu ljubavi' gde je tradicija zaključavanja katanaca i počela.",
        "location": "Vrnjačka Banja"
      }
    },
    "radius": 3.61,
    "energy": 2,
    "social": 6,
    "luxury": 5,
    "urbanity": 3,
    "nature": 7,
    "weatherDependency": 8.5,
    "seasonality": "spring-fall",
    "familySuitability": true,
    "accessibility": true,
    "premiumLevel": "standard",
    "budgetLevel": "low",
    "recommendedVisitDuration": 120
  },
  {
    "id": "28",
    "coordinateX": -1,
    "coordinateY": -3.5,
    "title": "Rtanj Mountain & Sokobanja",
    "category": "Wellbeing",
    "shortDescription": "A blend of thermal recovery in Sokobanja and the mystical energy of the pyramid-shaped Rtanj Mountain. A hotspot for alternative wellness.",
    "longDescription": "Rtanj is a geological enigma—a near-perfect pyramid rising to the Šiljak peak (1,565m). Scientists and mystics alike are drawn to its unique electromagnetic properties and its endemic plant life, notably \"Rtanj Tea\" (Satureja montana), which grows only on its slopes. The nearby town of Sokobanja, flourishing since the 19th century as a Romanesque air spa, provides the social and medical base for the region. Together, they offer a sophisticated blend of high-altitude adventure and restorative thermal wellness, perfect for mental and physical decompression.",
    "image": "/src/assets/images/rtanj_mountain_sokobanja_1778843487063.png",
    "duration": "Weekend to 4 days",
    "travelTime": "3 hours",
    "travelTimeMinutes": 180,
    "location": "Eastern Serbia",
    "estimatedCost":"€30 - €240",
    "preferredTransport": "Car",
    "website": "https://tosokobanja.rs",
    "coordinates": {
      "lat": 43.7667,
      "lng": 21.8667
    },
    "equivalents": {
      "en": "Glastonbury and the Tor (UK)",
      "es": "Montserrat (Spain)",
      "de": "Externsteine (Germany)",
      "ru": "Mount Belukha area (Russia)",
      "zh": "Mount Tai (China)"
    },
    "radius": 3.64,
    "energy": 4,
    "social": 4.5,
    "luxury": 5,
    "urbanity": 1.5,
    "nature": 8.5,
    "weatherDependency": 8.5,
    "seasonality": "spring-fall",
    "familySuitability": true,
    "accessibility": false,
    "premiumLevel": "standard",
    "budgetLevel": "low",
    "recommendedVisitDuration": 600
  },
  {
    "id": "40",
    "coordinateX": -2.5,
    "coordinateY": 2,
    "title": "Zepter Hotel & Wellness",
    "category": "Wellbeing",
    "shortDescription": "A holistic wellness ecosystem in Vrnjačka Banja. Integrating luxury hospitality with preventive medicine, nutrition, and spa therapy.",
    "longDescription": "Zepter Hotel in Vrnjačka Banja is a hallmark of \"Health-First\" luxury, integrating the Zepter group's global health technologies like Bioptron light therapy and water ionizers into the hospitality experience. The resort focuses on preventive medicine and respiratory wellness, drawing on the region's 2000-year thermal water history. For the Expo visitor, it provides an intellectually satisfying medical-wellness circuit that combines high-spec physical recovery, organic nutrition, and a level of specialized spa care typically found in the elite clinics of Western Europe.",
    "image": "/src/assets/images/zepter_hotel_wellness_serbia_1778844098516.png",
    "duration": "Weekend to 1 week",
    "travelTime": "3 hours",
    "travelTimeMinutes": 180,
    "location": "Vrnjačka Banja",
    "estimatedCost":"€180 - €720+",
    "preferredTransport": "Car / Private Transfer",
    "website": "https://hotelzeptervrnjackabanja.rs",
    "coordinates": {
      "lat": 43.6214,
      "lng": 20.8924
    },
    "equivalents": {
      "en": "Grayshott Health Spa (UK)",
      "es": "Vichy Catalán (Spain)",
      "de": "Brenners Park-Hotel & Spa (Germany)",
      "ru": "Plaza Spa Kislovodsk (Russia)",
      "zh": "Banyan Tree Spa (Global)"
    },
    "radius": 3.2,
    "energy": 2.5,
    "social": 4.5,
    "luxury": 8.5,
    "urbanity": 7,
    "nature": 3,
    "weatherDependency": 3,
    "seasonality": "all",
    "familySuitability": true,
    "accessibility": true,
    "premiumLevel": "premium",
    "budgetLevel": "low",
    "recommendedVisitDuration": 120
  },
  {
    "id": "61",
    "coordinateX": -3,
    "coordinateY": -3.5,
    "title": "Prolom Banja",
    "category": "Wellbeing",
    "shortDescription": "Renowned for its unique alkaline water and southern mountain air. A destination for restorative health and metabolic wellness.",
    "longDescription": "Prolom Banja is globally unique for its \"Prolom Water\"—a highly alkaline (pH 8.8), low-mineral thermal water that originates from the depths of the Radan Mountain. Historically significant for metabolic and dermatological recovery, the spa maintains a clinical atmosphere within a pristine, zero-pollution environment. For the Expo visitor, it offers a high-value \"Metabolic Reset\" circuit, often combined with the geological enigma of the nearby Devil's Town. It represents the authentic, scientifically grounded Balkan spa tradition at its most restorative and clinical peak.",
    "image": "/src/assets/images/prolom_banja_wellness_1778846468292.png",
    "duration": "Weekend to 1 week",
    "travelTime": "4 hours",
    "travelTimeMinutes": 240,
    "location": "Southern Serbia",
    "estimatedCost":"€80 - €270 per night",
    "preferredTransport": "Car / Private Transfer",
    "website": "https://prolombanja.com",
    "coordinates": {
      "lat": 43.0333,
      "lng": 21.4
    },
    "equivalents": {
      "en": "Bath Spa (UK)",
      "es": "Balneario de Lanjarón (Spain)",
      "de": "Bad Elster (Germany)",
      "ru": "Yessentuki (Russia)",
      "zh": "Jiuhua Spa (China)"
    },
    "radius": 4.61,
    "energy": 2,
    "social": 3,
    "luxury": 5,
    "urbanity": 1.5,
    "nature": 8.5,
    "weatherDependency": 8.5,
    "seasonality": "spring-fall",
    "familySuitability": true,
    "accessibility": false,
    "premiumLevel": "standard",
    "budgetLevel": "moderate",
    "recommendedVisitDuration": 120
  },
  {
    "id": "73",
    "coordinateX": -1.5,
    "coordinateY": -3,
    "title": "Herbal Pharmacies of Fruška Gora",
    "category": "Wellbeing",
    "shortDescription": "Monastery-grade herbalism and natural wellness. Traditional remedies based on the \"Holy Mountain’s\" unique botanical diversity.",
    "longDescription": "Fruška Gora, the \"Holy Mountain,\" has 16 active Orthodox monasteries that have preserved Balkan botanical wisdom since the Middle Ages. Specialized herbal pharmacies in monasteries like Kovilj and Krušedol now offer organic tinctures, monastery honey, and medicinal teas based on these centuries-old pharmaceutical recipes. These are not merely shops but centers of botanical-spiritual continuity. For the wellness explorer, they provide a sophisticated, chemical-free path to restorative health, rooted in the unique biodiversity of the region’s first National Park (est. 1960).",
    "image": "/src/assets/images/fruska_gora_herbal_pharmacy_1778847479340.png",
    "duration": "1 - 2 hours",
    "travelTime": "1.5 hours",
    "travelTimeMinutes": 90,
    "location": "Fruška Gora Monasteries",
    "estimatedCost":"€20 - €60",
    "preferredTransport": "Car",
    "coordinates": {
      "lat": 45.1192,
      "lng": 19.9405
    },
    "equivalents": {
      "en": "Neal's Yard Remedies (UK)",
      "es": "Herbolarios Madrileños (Spain)",
      "de": "Weleda Wellness centers (Germany/CH)",
      "ru": "Altai Herbalists (Russia)",
      "zh": "TCM Herbal Pharmacies (China)"
    },
    "radius": 3.35,
    "energy": 3.5,
    "social": 3,
    "luxury": 2,
    "urbanity": 2,
    "nature": 8,
    "weatherDependency": 8.5,
    "seasonality": "spring-fall",
    "familySuitability": true,
    "accessibility": true,
    "premiumLevel": "standard",
    "budgetLevel": "low",
    "recommendedVisitDuration": 90
  }
];
