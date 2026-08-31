/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from '../../../types';

/**
 * Backward Compatibility ID Migration Layer
 * Maps legacy Wave 2 draft identifiers to promoted canonical recommendation IDs.
 */
export const DRAFT_TO_CANONICAL_ID_MAP: Record<string, string> = {
  'draft-1': '103',
  'draft-2': '104',
  'draft-3': '105',
  'draft-4': '106',
  'draft-5': '107',
  'draft-6': '108',
  'draft-7': '109',
  'draft-8': '110',
  'draft-9': '111',
  'draft-10': '112',
  'draft-11': '113',
  'draft-12': '114',
  'draft-13': '115',
  'draft-14': '116',
  'draft-15': '117',
  'draft-16': '118',
  'draft-17': '119',
  'draft-18': '120',
  'draft-19': '121',
  'draft-20': '122',
  'draft-21': '123',
  'draft-22': '124',
  'draft-23': '125',
  'draft-24': '126',
  'draft-25': '127',
  'draft-26': '128',
  'draft-27': '129',
  'draft-28': '130',
  'draft-29': '131',
  'draft-30': '132',
  'draft-31': '133',
  'draft-32': '134',
  'draft-33': '135',
  'draft-34': '136',
  'draft-35': '137',
  'draft-36': '138',
  'draft-37': '139',
  'draft-38': '140',
  'draft-39': '141',
  'draft-40': '142',
  'draft-43': '143',
  'draft-45': '144',
  'draft-47': '145',
  'draft-48': '146',
  'draft-49': '147',
  'draft-50': '148'
};

/**
 * Resolves any recommendation identifier (including legacy draft IDs) to its permanent canonical ID.
 */
export function resolveCanonicalId(id: string): string {
  return DRAFT_TO_CANONICAL_ID_MAP[id] || id;
}

/**
 * Wave 2 Promoted Canonical Recommendations (103 - 148)
 * Promoted from Wave 2 draft status following comprehensive Editorial Quality Assurance review.
 * Excludes Group B conceptual backlog items.
 */
export const wave2CanonicalRecommendations: Recommendation[] = [
{
  "id": "103",
  "title": "The Wild Karst of Eastern Serbia (Lazarev Canyon + Zlot Caves)",
  category: Category.NATURE,
  "shortDescription": "Explore Lazarev Canyon, the deepest and longest canyon in eastern Serbia, coupled with the magnificent caverns of Zlot. A rugged, dramatic karst ecosystem featuring spectacular natural viewpoints, rich biodiversity, and deep prehistoric cave passages.",
  "longDescription": "Lazarev Canyon is a dramatic limestone gorge carved into the eastern foothills of the Kučaj mountains. As the deepest canyon in eastern Serbia, its vertical limestone cliffs harbor unique tertiary flora and fauna. Coupled with the Zlot Caves—specifically Lazareva Pećina, famous for its ancient homonid remains, fossilized cave bear bones, and pristine stalactite galleries—this experience presents an adventurous escape into the untamed karst heartland of the country.",
  "image": "/src/assets/images/lazarev_canyon_wild_1778845803839.webp",
  "duration": "Full day",
  "travelTime": "3 - 3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Near Bor",
  "estimatedCost":"€20 - €40",
  "preferredTransport": "Car",
  "seasonality": "spring-fall",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Gorges du Verdon (France)"
  },
  "coordinates": {
    "lat": 44.032,
    "lng": 21.961
  },
  "coordinateX": 5,
  "coordinateY": -4,
  "radius": 4,
  "energy": 8,
  "social": 4,
  "luxury": 2,
  "urbanity": 1,
  "nature": 10,
  "weatherDependency": 6,
  "translations": {
    "sr": {
      "title": "Divlji krš Istočne Srbije (Lazarev kanjon + Zlotske pećine)",
      "shortDescription": "Explore Lazarev Canyon, the deepest and longest canyon in eastern Serbia, coupled with the magnificent caverns of Zlot. A rugged, dramatic karst ecosystem featuring spectacular natural viewpoints, rich biodiversity, and deep prehistoric cave passages.",
      "longDescription": "Lazarev Canyon is a dramatic limestone gorge carved into the eastern foothills of the Kučaj mountains. As the deepest canyon in eastern Serbia, its vertical limestone cliffs harbor unique tertiary flora and fauna. Coupled with the Zlot Caves—specifically Lazareva Pećina, famous for its ancient homonid remains, fossilized cave bear bones, and pristine stalactite galleries—this experience presents an adventurous escape into the untamed karst heartland of the country.",
      "location": "Near Bor"
    },
    "zh": {
      "title": "塞尔维亚东部野生喀斯特（拉扎列夫峡谷与兹洛特洞穴）",
      "shortDescription": "Explore Lazarev Canyon, the deepest and longest canyon in eastern Serbia, coupled with the magnificent caverns of Zlot. A rugged, dramatic karst ecosystem featuring spectacular natural viewpoints, rich biodiversity, and deep prehistoric cave passages.",
      "longDescription": "Lazarev Canyon is a dramatic limestone gorge carved into the eastern foothills of the Kučaj mountains. As the deepest canyon in eastern Serbia, its vertical limestone cliffs harbor unique tertiary flora and fauna. Coupled with the Zlot Caves—specifically Lazareva Pećina, famous for its ancient homonid remains, fossilized cave bear bones, and pristine stalactite galleries—this experience presents an adventurous escape into the untamed karst heartland of the country.",
      "location": "Near Bor"
    }
  }
},
{
  "id": "104",
  "title": "Through the Stone Gates (Vratna natural bridges)",
  category: Category.NATURE,
  "shortDescription": "Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.",
  "longDescription": "The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.",
  "image": "/src/assets/images/lazarev_canyon_wild_1778845803839.png",
  "duration": "3-4 hours",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Near Negotin",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Pont d'Arc (France)"
  },
  "coordinates": {
    "lat": 44.383,
    "lng": 22.344
  },
  "coordinateX": 6,
  "coordinateY": -5,
  "radius": 4,
  "energy": 7,
  "social": 3,
  "luxury": 1,
  "urbanity": 1,
  "nature": 10,
  "weatherDependency": 7,
  "translations": {
    "sr": {
      "title": "Kroz kamena vrata (Vratnjanske prerasti)",
      "shortDescription": "Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.",
      "longDescription": "The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.",
      "location": "Near Negotin"
    },
    "zh": {
      "title": "穿过石门（夫拉特纳天然石桥）",
      "shortDescription": "Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.",
      "longDescription": "The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.",
      "location": "Near Negotin"
    }
  }
},
{
  "id": "105",
  "title": "The Hidden Canyon Road (Jerma Gorge)",
  category: Category.NATURE,
  "shortDescription": "A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.",
  "longDescription": "Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.",
  "image": "/src/assets/images/jerma_gorge_canyon_road.webp",
  "duration": "Full day",
  "travelTime": "4.5 hours",
  "travelTimeMinutes": 270,
  "location": "Near Dimitrovgrad",
  "estimatedCost":"€30 - €50",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 300,
  "equivalents": {
    "en": "Aosta Valley (Italy)"
  },
  "coordinates": {
    "lat": 42.983,
    "lng": 22.633
  },
  "coordinateX": 4,
  "coordinateY": -5,
  "radius": 4,
  "energy": 7,
  "social": 3,
  "luxury": 2,
  "urbanity": 1,
  "nature": 9,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Put kroz skriveni kanjon (Kanjon Jerme)",
      "shortDescription": "A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.",
      "longDescription": "Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.",
      "location": "Near Dimitrovgrad"
    },
    "zh": {
      "title": "隐藏的峡谷之路（耶尔马峡谷）",
      "shortDescription": "A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.",
      "longDescription": "Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.",
      "location": "Near Dimitrovgrad"
    }
  }
},
{
  "id": "106",
  "title": "Serbia’s Layered Canyon (Rosomača Canyon)",
  category: Category.NATURE,
  "shortDescription": "The 'Stara Planina's Colorado' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.",
  "longDescription": "Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.",
  "image": "/src/assets/images/stara_planina_landscape_1778843454764.webp",
  "duration": "2-3 hours",
  "travelTime": "4.5 hours",
  "travelTimeMinutes": 270,
  "location": "Stara Planina",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Walk",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 90,
  "equivalents": {
    "en": "Antelope Canyon (USA)"
  },
  "coordinates": {
    "lat": 43.149,
    "lng": 22.784
  },
  "coordinateX": 5,
  "coordinateY": -6,
  "radius": 4,
  "energy": 6,
  "social": 3,
  "luxury": 2,
  "urbanity": 1,
  "nature": 10,
  "weatherDependency": 6,
  "translations": {
    "sr": {
      "title": "Slojeviti kanjon Srbije (Kanjon Rosomače)",
      "shortDescription": "The 'Stara Planina's Colorado' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.",
      "longDescription": "Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.",
      "location": "Stara Planina"
    },
    "zh": {
      "title": "塞尔维亚的分层峡谷（罗索马恰峡谷）",
      "shortDescription": "The 'Stara Planina's Colorado' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.",
      "longDescription": "Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.",
      "location": "Stara Planina"
    }
  }
},
{
  "id": "107",
  "title": "The Turquoise Spring Journey (Krupaj Spring + Eastern Serbia)",
  category: Category.NATURE,
  "shortDescription": "An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.",
  "longDescription": "Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.",
  "image": "/src/assets/images/krupaj_spring_homolje.webp",
  "duration": "2-4 hours",
  "travelTime": "2.5 hours",
  "travelTimeMinutes": 150,
  "location": "Homolje Region",
  "estimatedCost":"€10 - €30",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Plitvice Springs (Croatia)"
  },
  "coordinates": {
    "lat": 44.183,
    "lng": 21.603
  },
  "coordinateX": 4,
  "coordinateY": -3,
  "radius": 4,
  "energy": 5,
  "social": 4,
  "luxury": 3,
  "urbanity": 2,
  "nature": 9,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Putovanje do tirkiznog vrela (Krupajsko vrelo)",
      "shortDescription": "An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.",
      "longDescription": "Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.",
      "location": "Homolje Region"
    },
    "zh": {
      "title": "绿松石泉水之旅（克鲁帕伊泉）",
      "shortDescription": "An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.",
      "longDescription": "Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.",
      "location": "Homolje Region"
    }
  }
},
{
  "id": "108",
  "title": "The Clear River Escape (Gradac River Gorge)",
  category: Category.NATURE,
  "shortDescription": "Walk along Europe's cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.",
  "longDescription": "The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.",
  "image": "/src/assets/images/tara_forest_reset_hike_1778848171218.png",
  "duration": "Half day",
  "travelTime": "1.5 hours",
  "travelTimeMinutes": 90,
  "location": "Valjevo",
  "estimatedCost":"€20 - €30",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Soca Valley (Slovenia)"
  },
  "coordinates": {
    "lat": 44.233,
    "lng": 19.883
  },
  "coordinateX": 3,
  "coordinateY": -3,
  "radius": 4,
  "energy": 6,
  "social": 4,
  "luxury": 2,
  "urbanity": 2,
  "nature": 9,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Bekstvo na bistru reku (Kanjon reke Gradac)",
      "shortDescription": "Walk along Europe's cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.",
      "longDescription": "The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.",
      "location": "Valjevo"
    },
    "zh": {
      "title": "清澈河流逃逸之旅（格拉达茨河峡谷）",
      "shortDescription": "Walk along Europe's cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.",
      "longDescription": "The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.",
      "location": "Valjevo"
    }
  }
},
{
  "id": "109",
  "title": "Between Two Mountains (Ovčar-Kablar Active Day)",
  category: Category.NATURE,
  "shortDescription": "An immersive outdoor day in the 'Serbian Mount Athos' gorge. Combines hiking through dramatic river bends with visits to monasteries hidden in dense forest.",
  "longDescription": "The Ovčar-Kablar Gorge is carved by the West Morava River, separating the peaks of Ovčar and Kablar mountains. Renowned for its ten medieval monasteries built into the cliffs during Ottoman times, the region offers a harmonious blend of pristine nature and deep religious heritage. This active route takes travelers along winding paths, offering fresh mountain air, mineral spring wells, and historic stone architecture.",
  "image": "/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp",
  "duration": "Full day",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Near Čačak",
  "estimatedCost":"€20 - €40",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 360,
  "equivalents": {
    "en": "Meteora (Greece)"
  },
  "coordinates": {
    "lat": 43.903,
    "lng": 20.187
  },
  "coordinateX": 3,
  "coordinateY": -2,
  "radius": 4,
  "energy": 7,
  "social": 4,
  "luxury": 3,
  "urbanity": 2,
  "nature": 9,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Između dve planine (Ovčarsko-kablarska klisura)",
      "shortDescription": "An immersive outdoor day in the 'Serbian Mount Athos' gorge. Combines hiking through dramatic river bends with visits to monasteries hidden in dense forest.",
      "longDescription": "The Ovčar-Kablar Gorge is carved by the West Morava River, separating the peaks of Ovčar and Kablar mountains. Renowned for its ten medieval monasteries built into the cliffs during Ottoman times, the region offers a harmonious blend of pristine nature and deep religious heritage. This active route takes travelers along winding paths, offering fresh mountain air, mineral spring wells, and historic stone architecture.",
      "location": "Near Čačak"
    },
    "zh": {
      "title": "两山之间（奥夫查尔-卡布拉尔峡谷动态一日游）",
      "shortDescription": "An immersive outdoor day in the 'Serbian Mount Athos' gorge. Combines hiking through dramatic river bends with visits to monasteries hidden in dense forest.",
      "longDescription": "The Ovčar-Kablar Gorge is carved by the West Morava River, separating the peaks of Ovčar and Kablar mountains. Renowned for its ten medieval monasteries built into the cliffs during Ottoman times, the region offers a harmonious blend of pristine nature and deep religious heritage. This active route takes travelers along winding paths, offering fresh mountain air, mineral spring wells, and historic stone architecture.",
      "location": "Near Čačak"
    }
  }
},
{
  "id": "110",
  "title": "Above the Meanders (Kablar Viewpoint Experience)",
  category: Category.NATURE,
  "shortDescription": "Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava's curved meanders and the surrounding valley.",
  "longDescription": "The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.",
  "image": "/src/assets/images/via_ferrata_kablar_climb_1778848271890.webp",
  "duration": "2-3 hours",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Near Čačak",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 90,
  "equivalents": {
    "en": "Grand Canyon Skywalk (USA)"
  },
  "coordinates": {
    "lat": 43.91,
    "lng": 20.18
  },
  "coordinateX": 2,
  "coordinateY": -3,
  "radius": 4,
  "energy": 8,
  "social": 3,
  "luxury": 2,
  "urbanity": 1,
  "nature": 10,
  "weatherDependency": 7,
  "translations": {
    "sr": {
      "title": "Iznad meandara (Vidikovac Kablar)",
      "shortDescription": "Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava's curved meanders and the surrounding valley.",
      "longDescription": "The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.",
      "location": "Near Čačak"
    },
    "zh": {
      "title": "曲流之上（卡布拉尔观景台体验）",
      "shortDescription": "Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava's curved meanders and the surrounding valley.",
      "longDescription": "The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.",
      "location": "Near Čačak"
    }
  }
},
{
  "id": "111",
  "title": "The Forested Interior (Golija Mountain Retreat)",
  category: Category.NATURE,
  "shortDescription": "Journey into Serbia's most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.",
  "longDescription": "Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.",
  "image": "/src/assets/images/tara_national_park_forest_1778843961956.webp",
  "duration": "Weekend",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Golija Biosphere",
  "estimatedCost":"€50 - €120",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Black Forest (Germany)"
  },
  "coordinates": {
    "lat": 43.341,
    "lng": 20.273
  },
  "coordinateX": 1,
  "coordinateY": -5,
  "radius": 4,
  "energy": 6,
  "social": 2,
  "luxury": 3,
  "urbanity": 1,
  "nature": 10,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Šumoviti mir unutrašnjosti (Planina Golija)",
      "shortDescription": "Journey into Serbia's most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.",
      "longDescription": "Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.",
      "location": "Golija Biosphere"
    },
    "zh": {
      "title": "深林静谧之所（戈利亚山隐逸）",
      "shortDescription": "Journey into Serbia's most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.",
      "longDescription": "Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.",
      "location": "Golija Biosphere"
    }
  }
},
{
  "id": "112",
  "title": "Serbia’s Unexpected Hills (Zagajička Hills)",
  category: Category.NATURE,
  "shortDescription": "Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.",
  "longDescription": "Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.",
  "image": "/src/assets/images/stara_planina_landscape_1778843454764.png",
  "duration": "4-5 hours",
  "travelTime": "1.5 hours",
  "travelTimeMinutes": 90,
  "location": "Deliblato Sands",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Tuscany Hills (Italy)"
  },
  "coordinates": {
    "lat": 44.916,
    "lng": 21.183
  },
  "coordinateX": 3,
  "coordinateY": -1,
  "radius": 4,
  "energy": 6,
  "social": 3,
  "luxury": 2,
  "urbanity": 1,
  "nature": 9,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Neočekivana brda Srbije (Zagajička brda)",
      "shortDescription": "Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.",
      "longDescription": "Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.",
      "location": "Deliblato Sands"
    },
    "zh": {
      "title": "塞尔维亚意想不到的山丘（扎加伊察丘陵）",
      "shortDescription": "Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.",
      "longDescription": "Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.",
      "location": "Deliblato Sands"
    }
  }
},
{
  "id": "113",
  "title": "A Morning Among the Birds (Carska Bara)",
  category: Category.NATURE,
  "shortDescription": "A spectacular wetland reserve in Vojvodina hosting hundreds of rare migratory bird species. Enjoy quiet boat rides and photography among fields of water lilies.",
  "longDescription": "Carska Bara (The Imperial Pond) is an exceptional marshland ecosystem situated near the Begej River. Home to over 250 species of birds, including rare herons and cormorants, it is an international Ramsar wetland. Boat cruises navigate the quiet waterways under dense willow galleries, offering travelers a peaceful morning of birdwatching, soft light photography, and absolute silence.",
  "image": "/src/assets/images/carska_bara_wetlands_birds_aerial_1778846483752.webp",
  "duration": "Half day",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Near Zrenjanin",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car + Boat",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "The Everglades (USA)"
  },
  "coordinates": {
    "lat": 45.253,
    "lng": 20.395
  },
  "coordinateX": 2,
  "coordinateY": -1,
  "radius": 4,
  "energy": 4,
  "social": 3,
  "luxury": 3,
  "urbanity": 1,
  "nature": 9,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Jutro među pticama (Carska bara)",
      "shortDescription": "A spectacular wetland reserve in Vojvodina hosting hundreds of rare migratory bird species. Enjoy quiet boat rides and photography among fields of water lilies.",
      "longDescription": "Carska Bara (The Imperial Pond) is an exceptional marshland ecosystem situated near the Begej River. Home to over 250 species of birds, including rare herons and cormorants, it is an international Ramsar wetland. Boat cruises navigate the quiet waterways under dense willow galleries, offering travelers a peaceful morning of birdwatching, soft light photography, and absolute silence.",
      "location": "Near Zrenjanin"
    },
    "zh": {
      "title": "鸟语花香的早晨（沙皇沼泽自然保护区）",
      "shortDescription": "A spectacular wetland reserve in Vojvodina hosting hundreds of rare migratory bird species. Enjoy quiet boat rides and photography among fields of water lilies.",
      "longDescription": "Carska Bara (The Imperial Pond) is an exceptional marshland ecosystem situated near the Begej River. Home to over 250 species of birds, including rare herons and cormorants, it is an international Ramsar wetland. Boat cruises navigate the quiet waterways under dense willow galleries, offering travelers a peaceful morning of birdwatching, soft light photography, and absolute silence.",
      "location": "Near Zrenjanin"
    }
  }
},
{
  "id": "114",
  "title": "The Wetlands Near Belgrade (Obedska Bara)",
  category: Category.NATURE,
  "shortDescription": "One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.",
  "longDescription": "Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world's oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.",
  "image": "/src/assets/images/zasavica_reserve_1778841114905.webp",
  "duration": "Half day",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Near Pećinci",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Coto Doñana (Spain)"
  },
  "coordinates": {
    "lat": 44.707,
    "lng": 20.083
  },
  "coordinateX": 1,
  "coordinateY": 0,
  "radius": 4,
  "energy": 4,
  "social": 4,
  "luxury": 3,
  "urbanity": 2,
  "nature": 8,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Močvare nadomak Beograda (Obedska bara)",
      "shortDescription": "One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.",
      "longDescription": "Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world's oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.",
      "location": "Near Pećinci"
    },
    "zh": {
      "title": "贝尔格莱德附近的湿地（欧贝德斯卡沼泽）",
      "shortDescription": "One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.",
      "longDescription": "Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world's oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.",
      "location": "Near Pećinci"
    }
  }
},
{
  "id": "115",
  "title": "The Fortress Above the Ibar (Maglič Landscape Journey)",
  category: Category.NATURE,
  "shortDescription": "Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.",
  "longDescription": "Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.",
  "image": "/src/assets/images/maglic_fortress_ibar_river.webp",
  "duration": "3-4 hours",
  "travelTime": "3 hours",
  "travelTimeMinutes": 180,
  "location": "Ibar Valley",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Dunnotar Castle (Scotland)"
  },
  "coordinates": {
    "lat": 43.613,
    "lng": 20.523
  },
  "coordinateX": 1,
  "coordinateY": 2,
  "radius": 4,
  "energy": 7,
  "social": 4,
  "luxury": 2,
  "urbanity": 1,
  "nature": 8,
  "weatherDependency": 6,
  "translations": {
    "sr": {
      "title": "Tvrđava nad Ibarom (Srednjovekovni Maglič)",
      "shortDescription": "Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.",
      "longDescription": "Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.",
      "location": "Ibar Valley"
    },
    "zh": {
      "title": "伊巴尔河上的城堡（马格利奇城堡景观之旅）",
      "shortDescription": "Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.",
      "longDescription": "Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.",
      "location": "Ibar Valley"
    }
  }
},
{
  "id": "116",
  "title": "Tara’s Manuscript Trail (Rača Monastery + Surrounding Landscape)",
  category: Category.NATURE,
  "shortDescription": "A gentle walking trail in Tara National Park linking the historical Rača Monastery to clear mountain springs. Blends dense woodlands with medieval monastic literacy lore.",
  "longDescription": "This tranquil route begins at Rača Monastery, founded in the 13th century and famous for preserving the Serbian Cyrillic script during Ottoman rule. The path follows the crystal-clear Rača River through thick beech and spruce forests to the emerald-green 'Ladjevac' thermal spring, representing a peaceful pilgrimage of heritage and nature.",
  "image": "/src/assets/images/manasija_monastery_1778841065960.webp",
  "duration": "3-4 hours",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Tara National Park",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Fountains Abbey (UK)"
  },
  "coordinates": {
    "lat": 43.931,
    "lng": 19.542
  },
  "coordinateX": 0,
  "coordinateY": -3,
  "radius": 4,
  "energy": 5,
  "social": 3,
  "luxury": 3,
  "urbanity": 1,
  "nature": 9,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Rukopisni tragovi Tare (Manastir Rača)",
      "shortDescription": "A gentle walking trail in Tara National Park linking the historical Rača Monastery to clear mountain springs. Blends dense woodlands with medieval monastic literacy lore.",
      "longDescription": "This tranquil route begins at Rača Monastery, founded in the 13th century and famous for preserving the Serbian Cyrillic script during Ottoman rule. The path follows the crystal-clear Rača River through thick beech and spruce forests to the emerald-green 'Ladjevac' thermal spring, representing a peaceful pilgrimage of heritage and nature.",
      "location": "Tara National Park"
    },
    "zh": {
      "title": "塔拉的手稿小径（拉查修道院与周边景观）",
      "shortDescription": "A gentle walking trail in Tara National Park linking the historical Rača Monastery to clear mountain springs. Blends dense woodlands with medieval monastic literacy lore.",
      "longDescription": "This tranquil route begins at Rača Monastery, founded in the 13th century and famous for preserving the Serbian Cyrillic script during Ottoman rule. The path follows the crystal-clear Rača River through thick beech and spruce forests to the emerald-green 'Ladjevac' thermal spring, representing a peaceful pilgrimage of heritage and nature.",
      "location": "Tara National Park"
    }
  }
},
{
  "id": "117",
  "title": "Eastern Serbia Discovery Weekend",
  category: Category.NATURE,
  "shortDescription": "A curated multi-stop nature circuit winding through eastern Serbia's dense forests, limestone cliffs, and rushing water springs.",
  "longDescription": "Designed as a comprehensive road trip, this route connects the most spectacular natural landmarks of Eastern Serbia, including Krupaj Spring, Ždrelo Gorge, and the majestic waterfalls of Veliki Buk. Travelers discover a region steeped in ancient Vlach traditions, rich geological architecture, and rustic mountain taverns serving local Homolje honey and sheep's cheese.",
  "image": "/src/assets/images/djerdap_gorge_danube_1778842863362.webp",
  "duration": "Weekend",
  "travelTime": "3 hours",
  "travelTimeMinutes": 180,
  "location": "Eastern Serbia",
  "estimatedCost":"€60 - €150",
  "preferredTransport": "Car",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Black Forest High Road (Germany)"
  },
  "coordinates": {
    "lat": 44.464,
    "lng": 22.152
  },
  "coordinateX": 5,
  "coordinateY": -2,
  "radius": 4,
  "energy": 6,
  "social": 5,
  "luxury": 3,
  "urbanity": 2,
  "nature": 8,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Vikend otkrivanja Istočne Srbije",
      "shortDescription": "A curated multi-stop nature circuit winding through eastern Serbia's dense forests, limestone cliffs, and rushing water springs.",
      "longDescription": "Designed as a comprehensive road trip, this route connects the most spectacular natural landmarks of Eastern Serbia, including Krupaj Spring, Ždrelo Gorge, and the majestic waterfalls of Veliki Buk. Travelers discover a region steeped in ancient Vlach traditions, rich geological architecture, and rustic mountain taverns serving local Homolje honey and sheep's cheese.",
      "location": "Eastern Serbia"
    },
    "zh": {
      "title": "塞尔维亚东部探索周末",
      "shortDescription": "A curated multi-stop nature circuit winding through eastern Serbia's dense forests, limestone cliffs, and rushing water springs.",
      "longDescription": "Designed as a comprehensive road trip, this route connects the most spectacular natural landmarks of Eastern Serbia, including Krupaj Spring, Ždrelo Gorge, and the majestic waterfalls of Veliki Buk. Travelers discover a region steeped in ancient Vlach traditions, rich geological architecture, and rustic mountain taverns serving local Homolje honey and sheep's cheese.",
      "location": "Eastern Serbia"
    }
  }
},
{
  "id": "118",
  "title": "The Forgotten Fortress of Bač (Bač Fortress + Cultural Landscape)",
  category: Category.HISTORY,
  "shortDescription": "Discover the remnants of Vojvodina's most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.",
  "longDescription": "The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.",
  "image": "/src/assets/images/bac_fortress_vojvodina.webp",
  "duration": "Half day",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Bač",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Malbork Castle (Poland)"
  },
  "coordinates": {
    "lat": 45.392,
    "lng": 19.237
  },
  "coordinateX": -3,
  "coordinateY": 2,
  "radius": 4,
  "energy": 5,
  "social": 3,
  "luxury": 3,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Zaboravljena tvrđava Bača",
      "shortDescription": "Discover the remnants of Vojvodina's most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.",
      "longDescription": "The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.",
      "location": "Bač"
    },
    "zh": {
      "title": "被遗忘的巴奇要塞（巴奇要塞与文化景观）",
      "shortDescription": "Discover the remnants of Vojvodina's most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.",
      "longDescription": "The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.",
      "location": "Bač"
    }
  }
},
{
  "id": "119",
  "title": "Where Empires Met the Danube (Fetislam Fortress + Kladovo)",
  category: Category.HISTORY,
  "shortDescription": "A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.",
  "longDescription": "Fetislam (literally meaning 'Victory of Islam') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.",
  "image": "/src/assets/images/golubac_fortress_danube_1778842880053.webp",
  "duration": "Half day",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Kladovo",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Rumeli Hisari (Turkey)"
  },
  "coordinates": {
    "lat": 44.606,
    "lng": 22.61
  },
  "coordinateX": 6,
  "coordinateY": 1,
  "radius": 4,
  "energy": 5,
  "social": 4,
  "luxury": 3,
  "urbanity": 3,
  "nature": 7,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Gde su se carstva sretala na Dunavu (Fetislam i Kladovo)",
      "shortDescription": "A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.",
      "longDescription": "Fetislam (literally meaning 'Victory of Islam') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.",
      "location": "Kladovo"
    },
    "zh": {
      "title": "帝国外交与多瑙河相遇之地（费蒂斯拉姆要塞与克拉多沃）",
      "shortDescription": "A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.",
      "longDescription": "Fetislam (literally meaning 'Victory of Islam') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.",
      "location": "Kladovo"
    }
  }
},
{
  "id": "120",
  "title": "A Danube Afternoon Beyond Belgrade (Smederevo Fortress + River Evening)",
  category: Category.HISTORY,
  "shortDescription": "Explore the colossal 15th-century Smederevo Fortress, one of Europe's largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.",
  "longDescription": "Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.",
  "image": "/src/assets/images/smederevo_fortress_danube.webp",
  "duration": "Half day",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Smederevo",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Fortress of Carcassonne (France)"
  },
  "coordinates": {
    "lat": 44.665,
    "lng": 20.93
  },
  "coordinateX": 2,
  "coordinateY": 2,
  "radius": 4,
  "energy": 4,
  "social": 5,
  "luxury": 3,
  "urbanity": 4,
  "nature": 5,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Dunavsko popodne izvan Beograda (Smederevska tvrđava)",
      "shortDescription": "Explore the colossal 15th-century Smederevo Fortress, one of Europe's largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.",
      "longDescription": "Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.",
      "location": "Smederevo"
    },
    "zh": {
      "title": "贝尔格莱德郊外的多瑙河下午（斯梅代雷沃要塞）",
      "shortDescription": "Explore the colossal 15th-century Smederevo Fortress, one of Europe's largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.",
      "longDescription": "Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.",
      "location": "Smederevo"
    }
  }
},
{
  "id": "121",
  "title": "The Valley of the Kings (Curated Medieval Serbia Journey)",
  category: Category.HISTORY,
  "shortDescription": "A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.",
  "longDescription": "This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.",
  "image": "/src/assets/images/manasija_monastery_1778841065960.webp",
  "duration": "Weekend",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Raška Region",
  "estimatedCost":"€40 - €100",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Abbeys of the Loire Valley (France)"
  },
  "coordinates": {
    "lat": 43.486,
    "lng": 20.531
  },
  "coordinateX": 0,
  "coordinateY": 3,
  "radius": 4,
  "energy": 5,
  "social": 4,
  "luxury": 4,
  "urbanity": 2,
  "nature": 7,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Dolina kraljeva (Srednjovekovna Srbija)",
      "shortDescription": "A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.",
      "longDescription": "This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.",
      "location": "Raška Region"
    },
    "zh": {
      "title": "国王之谷（精心策划的塞尔维亚中世纪之旅）",
      "shortDescription": "A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.",
      "longDescription": "This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.",
      "location": "Raška Region"
    }
  }
},
{
  "id": "122",
  "title": "The Foundations of Serbia (Old Ras + St Peter’s Church)",
  category: Category.HISTORY,
  "shortDescription": "Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.",
  "longDescription": "St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.",
  "image": "/src/assets/images/st_peters_church_old_ras.webp",
  "duration": "Half day",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Novi Pazar",
  "estimatedCost":"€10 - €20",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Byzantine Churches of Ravenna (Italy)"
  },
  "coordinates": {
    "lat": 43.161,
    "lng": 20.527
  },
  "coordinateX": -1,
  "coordinateY": 3,
  "radius": 4,
  "energy": 4,
  "social": 4,
  "luxury": 3,
  "urbanity": 3,
  "nature": 5,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Temelji Srbije (Stari Ras i Petrova crkva)",
      "shortDescription": "Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.",
      "longDescription": "St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.",
      "location": "Novi Pazar"
    },
    "zh": {
      "title": "塞尔维亚的基石（老拉斯与圣彼得教堂）",
      "shortDescription": "Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.",
      "longDescription": "St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.",
      "location": "Novi Pazar"
    }
  }
},
{
  "id": "123",
  "title": "Where Serbia Meets the Orient (Novi Pazar Cultural Journey)",
  category: Category.HISTORY,
  "shortDescription": "Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.",
  "longDescription": "Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.",
  "image": "/src/assets/images/novi_pazar_old_bazaar.webp",
  "duration": "Full day",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Novi Pazar",
  "estimatedCost":"€30 - €60",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 300,
  "equivalents": {
    "en": "Sarajevo Old Town (Bosnia)"
  },
  "coordinates": {
    "lat": 43.136,
    "lng": 20.517
  },
  "coordinateX": -2,
  "coordinateY": 3,
  "radius": 4,
  "energy": 5,
  "social": 5,
  "luxury": 3,
  "urbanity": 5,
  "nature": 3,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Gde se Srbija susreće sa Orijentom (Novi Pazar)",
      "shortDescription": "Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.",
      "longDescription": "Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.",
      "location": "Novi Pazar"
    },
    "zh": {
      "title": "塞尔维亚与东方相遇之地（新帕扎尔文化之旅）",
      "shortDescription": "Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.",
      "longDescription": "Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.",
      "location": "Novi Pazar"
    }
  }
},
{
  "id": "124",
  "title": "Serbia’s Art Nouveau North (Subotica Architecture + Synagogue)",
  category: Category.HISTORY,
  "shortDescription": "An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.",
  "longDescription": "Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe's finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.",
  "image": "/src/assets/images/subotica_palic_lake_villa_1778843996440.webp",
  "duration": "Full day",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Subotica",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Art Nouveau Districts of Riga (Latvia)"
  },
  "coordinates": {
    "lat": 46.099,
    "lng": 19.665
  },
  "coordinateX": -2,
  "coordinateY": 5,
  "radius": 4,
  "energy": 4,
  "social": 6,
  "luxury": 5,
  "urbanity": 7,
  "nature": 2,
  "weatherDependency": 2,
  "translations": {
    "sr": {
      "title": "Secesijski sever Srbije (Subotica i Sinagoga)",
      "shortDescription": "An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.",
      "longDescription": "Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe's finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.",
      "location": "Subotica"
    },
    "zh": {
      "title": "塞尔维亚北部新艺术风格（苏博蒂察建筑与犹太教堂）",
      "shortDescription": "An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.",
      "longDescription": "Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe's finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.",
      "location": "Subotica"
    }
  }
},
{
  "id": "125",
  "title": "Royal Serbia in Half a Day (Oplenac + Royal Heritage + Historic Winery)",
  category: Category.HISTORY,
  "shortDescription": "Visit the spectacular white-marble royal mausoleum of the Karađorđević dynasty in Topola, boasting one of the world's largest collections of mosaic art.",
  "longDescription": "Perched atop Oplenac Hill, St. George's Church houses the tombs of the Serbian and Yugoslav royal family. The interior is decorated with stunning mosaics comprising 40 million tiles in 15,000 different colors, recreating frescoes from Serbia’s finest medieval monasteries. The experience is paired with the historic Royal Winery, founded in 1930 to produce wines on the sun-soaked slopes of Šumadija.",
  "image": "/src/assets/images/oplenac_mausoleum_mosaics_1778846378714.webp",
  "duration": "Half day",
  "travelTime": "1.2 hours",
  "travelTimeMinutes": 75,
  "location": "Topola",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Sacre Coeur Basilica (France)"
  },
  "coordinates": {
    "lat": 44.258,
    "lng": 20.683
  },
  "coordinateX": 1,
  "coordinateY": 3,
  "radius": 4,
  "energy": 4,
  "social": 5,
  "luxury": 5,
  "urbanity": 3,
  "nature": 5,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Kraljevska Srbija (Oplenac i Topola)",
      "shortDescription": "Visit the spectacular white-marble royal mausoleum of the Karađorđević dynasty in Topola, boasting one of the world's largest collections of mosaic art.",
      "longDescription": "Perched atop Oplenac Hill, St. George's Church houses the tombs of the Serbian and Yugoslav royal family. The interior is decorated with stunning mosaics comprising 40 million tiles in 15,000 different colors, recreating frescoes from Serbia’s finest medieval monasteries. The experience is paired with the historic Royal Winery, founded in 1930 to produce wines on the sun-soaked slopes of Šumadija.",
      "location": "Topola"
    },
    "zh": {
      "title": "皇家塞尔维亚半日游（奥普莱纳茨与皇家遗产）",
      "shortDescription": "Visit the spectacular white-marble royal mausoleum of the Karađorđević dynasty in Topola, boasting one of the world's largest collections of mosaic art.",
      "longDescription": "Perched atop Oplenac Hill, St. George's Church houses the tombs of the Serbian and Yugoslav royal family. The interior is decorated with stunning mosaics comprising 40 million tiles in 15,000 different colors, recreating frescoes from Serbia’s finest medieval monasteries. The experience is paired with the historic Royal Winery, founded in 1930 to produce wines on the sun-soaked slopes of Šumadija.",
      "location": "Topola"
    }
  }
},
{
  "id": "126",
  "title": "Niš Through Its People",
  category: Category.HISTORY,
  "shortDescription": "A narrative cultural route exploring the layered historical memories of southern Serbia's largest city, from Roman imperial heritage to dark modern memories.",
  "longDescription": "This curated cultural tour takes travelers through the historical memories of Niš. Highlights include Mediana, the luxury estate of Roman Emperor Constantine the Great; the evocative Skull Tower (Ćele Kula), built by Ottoman forces in 1809; and the historic Niš Fortress, offering a balanced narrative of battlefields, family memory, and southern Serbian hospitality.",
  "image": "/src/assets/images/nis_fortress_stambol_gate_1778845134540.webp",
  "duration": "Full day",
  "travelTime": "2.5 hours",
  "travelTimeMinutes": 150,
  "location": "Niš",
  "estimatedCost":"€20 - €40",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 300,
  "equivalents": {
    "en": "Ancient Sites of Split (Croatia)"
  },
  "coordinates": {
    "lat": 43.321,
    "lng": 21.895
  },
  "coordinateX": 2,
  "coordinateY": 4,
  "radius": 4,
  "energy": 6,
  "social": 7,
  "luxury": 3,
  "urbanity": 6,
  "nature": 3,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Niš kroz svoje ljude",
      "shortDescription": "A narrative cultural route exploring the layered historical memories of southern Serbia's largest city, from Roman imperial heritage to dark modern memories.",
      "longDescription": "This curated cultural tour takes travelers through the historical memories of Niš. Highlights include Mediana, the luxury estate of Roman Emperor Constantine the Great; the evocative Skull Tower (Ćele Kula), built by Ottoman forces in 1809; and the historic Niš Fortress, offering a balanced narrative of battlefields, family memory, and southern Serbian hospitality.",
      "location": "Niš"
    },
    "zh": {
      "title": "通过人民了解尼斯",
      "shortDescription": "A narrative cultural route exploring the layered historical memories of southern Serbia's largest city, from Roman imperial heritage to dark modern memories.",
      "longDescription": "This curated cultural tour takes travelers through the historical memories of Niš. Highlights include Mediana, the luxury estate of Roman Emperor Constantine the Great; the evocative Skull Tower (Ćele Kula), built by Ottoman forces in 1809; and the historic Niš Fortress, offering a balanced narrative of battlefields, family memory, and southern Serbian hospitality.",
      "location": "Niš"
    }
  }
},
{
  "id": "127",
  "title": "The Danube’s Ancient Frontier (Roman Heritage Journey)",
  category: Category.HISTORY,
  "shortDescription": "Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium's archaeological ruins and Trajan's Bridge.",
  "longDescription": "Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan's Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.",
  "image": "/src/assets/images/viminacium_archaeology_1778841330074.webp",
  "duration": "Full day",
  "travelTime": "2.5 hours",
  "travelTimeMinutes": 150,
  "location": "Danube Valley",
  "estimatedCost":"€20 - €40",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Hadrian's Wall (UK)"
  },
  "coordinates": {
    "lat": 44.717,
    "lng": 21.233
  },
  "coordinateX": 3,
  "coordinateY": 3,
  "radius": 4,
  "energy": 5,
  "social": 4,
  "luxury": 4,
  "urbanity": 3,
  "nature": 5,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Drevna dunavska granica (Rimska ruta)",
      "shortDescription": "Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium's archaeological ruins and Trajan's Bridge.",
      "longDescription": "Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan's Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.",
      "location": "Danube Valley"
    },
    "zh": {
      "title": "多瑙河古老的边境（罗马遗产之旅）",
      "shortDescription": "Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium's archaeological ruins and Trajan's Bridge.",
      "longDescription": "Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan's Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.",
      "location": "Danube Valley"
    }
  }
},
{
  "id": "128",
  "title": "The Monasteries of Fruška Gora",
  category: Category.HISTORY,
  "shortDescription": "A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.",
  "longDescription": "Often called the 'Serbian Holy Mountain,' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.",
  "image": "/src/assets/images/fruska_gora_monastery_vineyard_1778842911981.webp",
  "duration": "Half day",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Fruška Gora",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Tuscan Monasteries (Italy)"
  },
  "coordinates": {
    "lat": 45.158,
    "lng": 19.791
  },
  "coordinateX": -1,
  "coordinateY": 2,
  "radius": 4,
  "energy": 4,
  "social": 4,
  "luxury": 4,
  "urbanity": 2,
  "nature": 7,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Manastiri Fruške gore",
      "shortDescription": "A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.",
      "longDescription": "Often called the 'Serbian Holy Mountain,' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.",
      "location": "Fruška Gora"
    },
    "zh": {
      "title": "弗鲁什卡格拉的修道院",
      "shortDescription": "A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.",
      "longDescription": "Often called the 'Serbian Holy Mountain,' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.",
      "location": "Fruška Gora"
    }
  }
},
{
  "id": "129",
  "title": "Serbia Before the Crowds",
  category: Category.HISTORY,
  "shortDescription": "A carefully curated medieval heritage route guiding you through lesser-known, isolated fortifications and architectural treasures.",
  "longDescription": "For travelers seeking quiet authenticity, this route highlights architectural and fortification heritage off the main tourist trail. It includes Soko Grad's clifftop ruins and Mileševa Monastery—home to the world-famous 'White Angel' fresco. These isolated valleys offer deep tranquility, uncrowded stone ruins, and honest contact with ancient Serbian history.",
  "image": "/src/assets/images/gostusa_stone_village_1778846432213.webp",
  "duration": "Full day",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Central & Southern Serbia",
  "estimatedCost":"Free",
  "preferredTransport": "Car + Hike",
  "seasonality": "spring-fall",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Cathar Castles (France)"
  },
  "coordinates": {
    "lat": 43.084,
    "lng": 22.842
  },
  "coordinateX": 4,
  "coordinateY": 1,
  "radius": 4,
  "energy": 5,
  "social": 4,
  "luxury": 3,
  "urbanity": 1,
  "nature": 8,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Srbija pre gužvi",
      "shortDescription": "A carefully curated medieval heritage route guiding you through lesser-known, isolated fortifications and architectural treasures.",
      "longDescription": "For travelers seeking quiet authenticity, this route highlights architectural and fortification heritage off the main tourist trail. It includes Soko Grad's clifftop ruins and Mileševa Monastery—home to the world-famous 'White Angel' fresco. These isolated valleys offer deep tranquility, uncrowded stone ruins, and honest contact with ancient Serbian history.",
      "location": "Central & Southern Serbia"
    },
    "zh": {
      "title": "喧嚣之外的塞尔维亚",
      "shortDescription": "A carefully curated medieval heritage route guiding you through lesser-known, isolated fortifications and architectural treasures.",
      "longDescription": "For travelers seeking quiet authenticity, this route highlights architectural and fortification heritage off the main tourist trail. It includes Soko Grad's clifftop ruins and Mileševa Monastery—home to the world-famous 'White Angel' fresco. These isolated valleys offer deep tranquility, uncrowded stone ruins, and honest contact with ancient Serbian history.",
      "location": "Central & Southern Serbia"
    }
  }
},
{
  "id": "130",
  "title": "The Architecture of Yugoslav Belgrade (Modernist Architecture Route)",
  category: Category.HISTORY,
  "shortDescription": "Discover the colossal, bold concrete architecture of New Belgrade and Belgrade's center, tracing socialist modernist and brutalist monuments.",
  "longDescription": "New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia's administrative core.",
  "image": "/src/assets/images/bitef_theatre_belgrade_modern_1778847369770.webp",
  "duration": "3-4 hours",
  "travelTime": "0.2 hours",
  "travelTimeMinutes": 10,
  "location": "Belgrade",
  "estimatedCost":"Free",
  "preferredTransport": "Walk + Public Transit",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Le Corbusier District of Chandigarh (India)"
  },
  "coordinates": {
    "lat": 44.821,
    "lng": 20.448
  },
  "coordinateX": 0,
  "coordinateY": 6,
  "radius": 4,
  "energy": 5,
  "social": 6,
  "luxury": 4,
  "urbanity": 8,
  "nature": 1,
  "weatherDependency": 2,
  "translations": {
    "sr": {
      "title": "Arhitektura jugoslovenskog Beograda (Modernizam)",
      "shortDescription": "Discover the colossal, bold concrete architecture of New Belgrade and Belgrade's center, tracing socialist modernist and brutalist monuments.",
      "longDescription": "New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia's administrative core.",
      "location": "Belgrade"
    },
    "zh": {
      "title": "南斯拉夫贝尔格莱德的建筑（现代主义建筑路线）",
      "shortDescription": "Discover the colossal, bold concrete architecture of New Belgrade and Belgrade's center, tracing socialist modernist and brutalist monuments.",
      "longDescription": "New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia's administrative core.",
      "location": "Belgrade"
    }
  }
},
{
  "id": "131",
  "title": "The City that Built Modern Serbia (Kragujevac Industrial-Modernist Story)",
  category: Category.HISTORY,
  "shortDescription": "Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.",
  "longDescription": "As Serbia’s first industrial powerhouse, Kragujevac features the 'Knežev Arsenal'—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic 'Interrupted Flight' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.",
  "image": "/src/assets/images/arsenal_fest_1779796252730.webp",
  "duration": "Half day",
  "travelTime": "1.5 hours",
  "travelTimeMinutes": 90,
  "location": "Kragujevac",
  "estimatedCost":"Free",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Zollverein Coal Mine (Germany)"
  },
  "coordinates": {
    "lat": 44.012,
    "lng": 20.916
  },
  "coordinateX": 1,
  "coordinateY": 4,
  "radius": 4,
  "energy": 5,
  "social": 5,
  "luxury": 3,
  "urbanity": 6,
  "nature": 3,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Grad koji je gradio modernu Srbiju (Kragujevac)",
      "shortDescription": "Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.",
      "longDescription": "As Serbia’s first industrial powerhouse, Kragujevac features the 'Knežev Arsenal'—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic 'Interrupted Flight' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.",
      "location": "Kragujevac"
    },
    "zh": {
      "title": "构建现代塞尔维亚的城市（克拉古耶瓦茨工业与现代主义故事）",
      "shortDescription": "Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.",
      "longDescription": "As Serbia’s first industrial powerhouse, Kragujevac features the 'Knežev Arsenal'—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic 'Interrupted Flight' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.",
      "location": "Kragujevac"
    }
  }
},
{
  "id": "132",
  "title": "Wine Among Stone Cellars (Rajačke Pimnice at Dusk)",
  category: Category.GASTRONOMY,
  "shortDescription": "A timeless village of 270 hand-carved stone cellars dedicated exclusively to wine. Taste local Prokupac and Tamjanika in medieval atmospheric stone vaults.",
  "longDescription": "The Rajačke Pimnice (cellars) in eastern Serbia are a unique architectural complex built of local limestone during the 18th and 19th centuries. Erected separate from the human dwellings, these cells are carved into the ground to provide naturally stable temperatures for winemaking. Walking through the narrow dusty paths at dusk feels like stepping into a medieval wine sanctuary, complete with family wine-tasting rooms.",
  "image": "/src/assets/images/rajacke_pimnice_village_1778843436699.webp",
  "duration": "Half day",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Rajac Village",
  "estimatedCost":"€30 - €60",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Burgenland Wine Cellars (Austria)"
  },
  "coordinates": {
    "lat": 44.097,
    "lng": 22.548
  },
  "coordinateX": 5,
  "coordinateY": 1,
  "radius": 4,
  "energy": 5,
  "social": 6,
  "luxury": 4,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Vino među kamenim pivnicama (Rajačke pimnice u sumrak)",
      "shortDescription": "A timeless village of 270 hand-carved stone cellars dedicated exclusively to wine. Taste local Prokupac and Tamjanika in medieval atmospheric stone vaults.",
      "longDescription": "The Rajačke Pimnice (cellars) in eastern Serbia are a unique architectural complex built of local limestone during the 18th and 19th centuries. Erected separate from the human dwellings, these cells are carved into the ground to provide naturally stable temperatures for winemaking. Walking through the narrow dusty paths at dusk feels like stepping into a medieval wine sanctuary, complete with family wine-tasting rooms.",
      "location": "Rajac Village"
    },
    "zh": {
      "title": "石库中的美酒（黄昏时分的拉扎茨皮姆尼采）",
      "shortDescription": "A timeless village of 270 hand-carved stone cellars dedicated exclusively to wine. Taste local Prokupac and Tamjanika in medieval atmospheric stone vaults.",
      "longDescription": "The Rajačke Pimnice (cellars) in eastern Serbia are a unique architectural complex built of local limestone during the 18th and 19th centuries. Erected separate from the human dwellings, these cells are carved into the ground to provide naturally stable temperatures for winemaking. Walking through the narrow dusty paths at dusk feels like stepping into a medieval wine sanctuary, complete with family wine-tasting rooms.",
      "location": "Rajac Village"
    }
  }
},
{
  "id": "133",
  "title": "The Other Stone Wine Village (Rogljevo)",
  category: Category.GASTRONOMY,
  "shortDescription": "Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.",
  "longDescription": "Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.",
  "image": "/src/assets/images/rajacke_pimnice_village_1778843436699.png",
  "duration": "2-3 hours",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Rogljevo Village",
  "estimatedCost":"€30 - €50",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Traditional cellars of Tokaj (Hungary)"
  },
  "coordinates": {
    "lat": 44.123,
    "lng": 22.565
  },
  "coordinateX": 5,
  "coordinateY": 0,
  "radius": 4,
  "energy": 4,
  "social": 5,
  "luxury": 4,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Drugo kameno selo vina (Rogljevo)",
      "shortDescription": "Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.",
      "longDescription": "Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.",
      "location": "Rogljevo Village"
    },
    "zh": {
      "title": "另一个石雕葡萄酒村（罗格列沃）",
      "shortDescription": "Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.",
      "longDescription": "Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.",
      "location": "Rogljevo Village"
    }
  }
},
{
  "id": "134",
  "title": "Wine Behind Monastery Walls (Bukovo Monastery Winery)",
  category: Category.GASTRONOMY,
  "shortDescription": "Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.",
  "longDescription": "Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived 'Crna Tamjanika' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.",
  "image": "/src/assets/images/serbian_boutique_distillery_rakija_1778846500524.webp",
  "duration": "2 hours",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Near Negotin",
  "estimatedCost":"€20 - €40",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 90,
  "equivalents": {
    "en": "Abbey Wine Tastings (France)"
  },
  "coordinates": {
    "lat": 44.218,
    "lng": 22.483
  },
  "coordinateX": 4,
  "coordinateY": 1,
  "radius": 4,
  "energy": 3,
  "social": 4,
  "luxury": 4,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Vino iza manastirskih zidina (Vinarija Bukovo)",
      "shortDescription": "Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.",
      "longDescription": "Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived 'Crna Tamjanika' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.",
      "location": "Near Negotin"
    },
    "zh": {
      "title": "修道院高墙后的美酒（布科沃修道院酒庄）",
      "shortDescription": "Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.",
      "longDescription": "Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived 'Crna Tamjanika' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.",
      "location": "Near Negotin"
    }
  }
},
{
  "id": "135",
  "title": "The Bermet Afternoon (Sremski Karlovci)",
  category: Category.GASTRONOMY,
  "shortDescription": "Taste Bermet—the sweet, herbal wine steeped in centuries of local tradition—in the colorful, baroque wine estates of Sremski Karlovci.",
  "longDescription": "Sremski Karlovci is a beautiful, historic town on the Danube, serving as the cultural heartland of Vojvodina's winemaking. Bermet is the town's jewel: a sweet dessert wine infused with over 20 secret mountain herbs. Ask any local winemaker about Bermet and, sooner or later, the Titanic story is likely to come up. Whether it is history or local legend is still debated—but it has become an enduring part of Bermet’s mystique.",
  "image": "/src/assets/images/sremski_karlovci_town_1778841131222.webp",
  "duration": "3-4 hours",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Sremski Karlovci",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car + Train",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Port Wine Lodges of Porto (Portugal)"
  },
  "coordinates": {
    "lat": 45.203,
    "lng": 19.934
  },
  "coordinateX": -1,
  "coordinateY": 4,
  "radius": 4,
  "energy": 4,
  "social": 6,
  "luxury": 4,
  "urbanity": 5,
  "nature": 4,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Bermet popodne (Sremski Karlovci)",
      "shortDescription": "Procurajte Bermet—slatko, aromatično vino sa bogatom lokalnom tradicijom—u živopisnim baroknim podrumima Sremskih Karlovaca.",
      "longDescription": "Sremski Karlovci su prelep, istorijski grad na Dunavu i kulturno srce vojvođanskog vinarstva. Bermet je dragulj ovog grada: slatko desertno vino aromatizovano sa preko 20 tajnih planinskih trava. Pitajte bilo kog lokalnog vinara o Bermetu i pre ili kasnije priča o Titaniku će doći na red. Bilo da je reč o istoriji ili lokalnoj legendi, o tome se i dalje raspravlja—ali je to postalo trajni deo mistike Bermeta.",
      "location": "Sremski Karlovci"
    },
    "zh": {
      "title": "贝梅特午后（斯雷姆斯基卡尔洛夫奇）",
      "shortDescription": "在斯雷姆斯基卡尔洛夫奇绚丽的巴洛克酒庄中，品尝融入数百年当地传统与芳香草本的贝梅特甜酒。",
      "longDescription": "斯雷姆斯基卡尔洛夫奇是多瑙河畔一座美丽而悠久的古镇，也是沃伊伏丁那酿酒文化的核心地带。贝梅特酒是小镇的瑰宝：一种融入了20多种秘密高山草药的甜型甜点酒。询问任何一位当地酿酒师关于贝梅特的故事，迟早会提到泰坦尼克号传说。这究竟是历史事实还是民间传说仍存有争议，但它已成为贝梅特独具魅力的持久传奇。",
      "location": "斯雷姆斯基卡尔洛夫奇"
    }
  }
},
{
  "id": "136",
  "title": "Native Grapes of Fruška Gora (Small-Producer Wine Journey)",
  category: Category.GASTRONOMY,
  "shortDescription": "A curated driving and tasting tour visiting boutique, family-run vineyards specializing in native grapes like Grašac and Sila.",
  "longDescription": "Escape the commercial estates and enter the private tasting tables of Fruška Gora’s boutique wine makers. Discover the renaissance of Grašac (an ancient white variety) and modern blends that benefit from the Danube’s unique micro-climate, paired with home-baked bread, cold cuts, and field view sunset walks.",
  "image": "/src/assets/images/fruska_gora_ebike_route_1778848222663.webp",
  "duration": "Half day",
  "travelTime": "1 hour",
  "travelTimeMinutes": 60,
  "location": "Fruška Gora Slopes",
  "estimatedCost":"€30 - €80",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": false,
  "accessibility": false,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Burgenland Boutique Wineries (Austria)"
  },
  "coordinates": {
    "lat": 45.163,
    "lng": 19.824
  },
  "coordinateX": -1,
  "coordinateY": 3,
  "radius": 4,
  "energy": 5,
  "social": 5,
  "luxury": 4,
  "urbanity": 2,
  "nature": 7,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Autohtone sorte Fruške gore",
      "shortDescription": "A curated driving and tasting tour visiting boutique, family-run vineyards specializing in native grapes like Grašac and Sila.",
      "longDescription": "Escape the commercial estates and enter the private tasting tables of Fruška Gora’s boutique wine makers. Discover the renaissance of Grašac (an ancient white variety) and modern blends that benefit from the Danube’s unique micro-climate, paired with home-baked bread, cold cuts, and field view sunset walks.",
      "location": "Fruška Gora Slopes"
    },
    "zh": {
      "title": "弗鲁什卡格拉的原生葡萄品种（小生产者葡萄酒之旅）",
      "shortDescription": "A curated driving and tasting tour visiting boutique, family-run vineyards specializing in native grapes like Grašac and Sila.",
      "longDescription": "Escape the commercial estates and enter the private tasting tables of Fruška Gora’s boutique wine makers. Discover the renaissance of Grašac (an ancient white variety) and modern blends that benefit from the Danube’s unique micro-climate, paired with home-baked bread, cold cuts, and field view sunset walks.",
      "location": "Fruška Gora Slopes"
    }
  }
},
{
  "id": "137",
  "title": "The Scent of Tamjanika (Župa Wine Country)",
  category: Category.GASTRONOMY,
  "shortDescription": "Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.",
  "longDescription": "Župa is often called the 'Serbian Champagne' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.",
  "image": "/src/assets/images/sumadija_wine_route_1778845927893.webp",
  "duration": "Weekend",
  "travelTime": "3 hours",
  "travelTimeMinutes": 180,
  "location": "Aleksandrovac (Župa)",
  "estimatedCost":"€40 - €100",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Alsace Wine Route (France)"
  },
  "coordinates": {
    "lat": 43.456,
    "lng": 21.047
  },
  "coordinateX": 1,
  "coordinateY": 1,
  "radius": 4,
  "energy": 4,
  "social": 6,
  "luxury": 4,
  "urbanity": 3,
  "nature": 6,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Miris Tamjanike (Župa aleksandrovačka)",
      "shortDescription": "Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.",
      "longDescription": "Župa is often called the 'Serbian Champagne' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.",
      "location": "Aleksandrovac (Župa)"
    },
    "zh": {
      "title": "塔姆亚尼卡葡萄的芬芳（茹帕葡萄酒乡）",
      "shortDescription": "Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.",
      "longDescription": "Župa is often called the 'Serbian Champagne' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.",
      "location": "Aleksandrovac (Župa)"
    }
  }
},
{
  "id": "138",
  "title": "The Return of Prokupac (Toplica Wine Journey)",
  category: Category.GASTRONOMY,
  "shortDescription": "Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia's flagship native red grape, Prokupac.",
  "longDescription": "Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.",
  "image": "/src/assets/images/subotica_sand_wines_1778841182776.webp",
  "duration": "Full day",
  "travelTime": "3 hours",
  "travelTimeMinutes": 180,
  "location": "Toplica Valley",
  "estimatedCost":"€30 - €60",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": false,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 300,
  "equivalents": {
    "en": "Rioja Alavesa (Spain)"
  },
  "coordinates": {
    "lat": 43.235,
    "lng": 21.587
  },
  "coordinateX": 2,
  "coordinateY": 1,
  "radius": 4,
  "energy": 4,
  "social": 5,
  "luxury": 4,
  "urbanity": 3,
  "nature": 5,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Povratak Prokupca (Topličko vinogorje)",
      "shortDescription": "Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia's flagship native red grape, Prokupac.",
      "longDescription": "Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.",
      "location": "Toplica Valley"
    },
    "zh": {
      "title": "普洛库帕茨的复兴（托普利察葡萄酒之旅）",
      "shortDescription": "Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia's flagship native red grape, Prokupac.",
      "longDescription": "Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.",
      "location": "Toplica Valley"
    }
  }
},
{
  "id": "139",
  "title": "The Village that Turns Red (Donja Lokošnica)",
  category: Category.GASTRONOMY,
  "shortDescription": "Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.",
  "longDescription": "Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native 'nizača' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.",
  "image": "/src/assets/images/pirot_gastronomy_cheese_1778845871088.png",
  "duration": "2-3 hours",
  "travelTime": "3 hours",
  "travelTimeMinutes": 180,
  "location": "Near Leskovac",
  "estimatedCost":"Free",
  "preferredTransport": "Car",
  "seasonality": "summer",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "free",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Espelette Pepper Harvest (France)"
  },
  "coordinates": {
    "lat": 43.072,
    "lng": 21.968
  },
  "coordinateX": 3,
  "coordinateY": 0,
  "radius": 4,
  "energy": 5,
  "social": 6,
  "luxury": 3,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Selo koje pocrveni (Donja Lokošnica)",
      "shortDescription": "Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.",
      "longDescription": "Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native 'nizača' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.",
      "location": "Near Leskovac"
    },
    "zh": {
      "title": "变红的村庄（多尼亚洛科什尼察）",
      "shortDescription": "Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.",
      "longDescription": "Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native 'nizača' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.",
      "location": "Near Leskovac"
    }
  }
},
{
  "id": "140",
  "title": "Pirot at the Table (Regional Food + Craft Journey)",
  category: Category.GASTRONOMY,
  "shortDescription": "Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).",
  "longDescription": "Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.",
  "image": "/src/assets/images/pirot_gastronomy_cheese_1778845871088.webp",
  "duration": "Full day",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Pirot",
  "estimatedCost":"€30 - €60",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 300,
  "equivalents": {
    "en": "Gastronomy of Parma & Artisan Weaving (Italy)"
  },
  "coordinates": {
    "lat": 43.155,
    "lng": 22.585
  },
  "coordinateX": 4,
  "coordinateY": 0,
  "radius": 4,
  "energy": 5,
  "social": 6,
  "luxury": 4,
  "urbanity": 4,
  "nature": 5,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Pirot za stolom (Gastro-zanatska ruta)",
      "shortDescription": "Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).",
      "longDescription": "Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.",
      "location": "Pirot"
    },
    "zh": {
      "title": "皮罗特的餐桌（区域美食与手工艺之旅）",
      "shortDescription": "Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).",
      "longDescription": "Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.",
      "location": "Pirot"
    }
  }
},
{
  "id": "141",
  "title": "Breakfast on the Pešter Plateau (Sjenica Highland Food Experience)",
  category: Category.GASTRONOMY,
  "shortDescription": "An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.",
  "longDescription": "The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.",
  "image": "/src/assets/images/stara_planina_landscape_1778843454764.png",
  "duration": "3 hours",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Pešter Plateau",
  "estimatedCost":"€20 - €30",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 120,
  "equivalents": {
    "en": "Highland Breakfast in South Tyrol (Italy)"
  },
  "coordinates": {
    "lat": 43.272,
    "lng": 19.998
  },
  "coordinateX": -1,
  "coordinateY": -2,
  "radius": 4,
  "energy": 5,
  "social": 5,
  "luxury": 3,
  "urbanity": 1,
  "nature": 8,
  "weatherDependency": 5,
  "translations": {
    "sr": {
      "title": "Doručak na Pešterskoj visoravni (Sjenica)",
      "shortDescription": "An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.",
      "longDescription": "The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.",
      "location": "Pešter Plateau"
    },
    "zh": {
      "title": "佩什特尔高原的高原早餐（谢尼察美食体验）",
      "shortDescription": "An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.",
      "longDescription": "The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.",
      "location": "Pešter Plateau"
    }
  }
},
{
  "id": "142",
  "title": "Made of Earth and Fire (Zlakusa Pottery + Slow-Cooked Food)",
  category: Category.GASTRONOMY,
  "shortDescription": "Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.",
  "longDescription": "Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.",
  "image": "/src/assets/images/zlakusa_pottery_craft_1778841163739.webp",
  "duration": "Half day",
  "travelTime": "2.5 hours",
  "travelTimeMinutes": 150,
  "location": "Zlakusa Village",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Clay Craft & Tajine cooking of Fez (Morocco)"
  },
  "coordinates": {
    "lat": 43.805,
    "lng": 19.967
  },
  "coordinateX": 0,
  "coordinateY": 0,
  "radius": 4,
  "energy": 4,
  "social": 5,
  "luxury": 3,
  "urbanity": 2,
  "nature": 6,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Od zemlje i vatre (Lončarstvo Zlakuse)",
      "shortDescription": "Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.",
      "longDescription": "Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.",
      "location": "Zlakusa Village"
    },
    "zh": {
      "title": "由泥土与火焰造成（兹拉库萨陶艺与慢炖美食）",
      "shortDescription": "Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.",
      "longDescription": "Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.",
      "location": "Zlakusa Village"
    }
  }
},
{
  "id": "143",
  "title": "Belgrade Through an Architect’s Eyes (Focused Design and Modernism Route)",
  category: Category.TRAVEL,
  "shortDescription": "A curated walking tour focusing on Belgrade’s design evolution, from Art Nouveau details to brutalist housing blocks and modern galleries.",
  "longDescription": "Step away from standard sightseeing and explore Belgrade’s urban fabric through architectural design blocks. A curated path explores the historic center's classic Secessionist buildings, the modernist architecture of post-war squares, and active contemporary galleries that trace Serbia's architectural history.",
  "image": "/src/assets/images/belgrade_design_district_1778845854594.webp",
  "duration": "3 hours",
  "travelTime": "0.2 hours",
  "travelTimeMinutes": 10,
  "location": "Belgrade",
  "estimatedCost":"€20 - €30",
  "preferredTransport": "Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Bauhaus District Walk of Weimar (Germany)"
  },
  "coordinates": {
    "lat": 44.818,
    "lng": 20.457
  },
  "coordinateX": 0,
  "coordinateY": 6,
  "radius": 4,
  "energy": 5,
  "social": 6,
  "luxury": 4,
  "urbanity": 8,
  "nature": 1,
  "weatherDependency": 2,
  "translations": {
    "sr": {
      "title": "Beograd očima arhitekte",
      "shortDescription": "A curated walking tour focusing on Belgrade’s design evolution, from Art Nouveau details to brutalist housing blocks and modern galleries.",
      "longDescription": "Step away from standard sightseeing and explore Belgrade’s urban fabric through architectural design blocks. A curated path explores the historic center's classic Secessionist buildings, the modernist architecture of post-war squares, and active contemporary galleries that trace Serbia's architectural history.",
      "location": "Belgrade"
    },
    "zh": {
      "title": "建筑师眼中的贝尔格莱德（设计与现代主义路线）",
      "shortDescription": "A curated walking tour focusing on Belgrade’s design evolution, from Art Nouveau details to brutalist housing blocks and modern galleries.",
      "longDescription": "Step away from standard sightseeing and explore Belgrade’s urban fabric through architectural design blocks. A curated path explores the historic center's classic Secessionist buildings, the modernist architecture of post-war squares, and active contemporary galleries that trace Serbia's architectural history.",
      "location": "Belgrade"
    }
  }
},
{
  "id": "144",
  "title": "Subotica After Dark",
  category: Category.HISTORY,
  "shortDescription": "Witness the illuminated Art Nouveau masterpieces of Subotica under soft evening lights, followed by a quiet, refined dinner.",
  "longDescription": "At sunset, Subotica's spectacular City Hall, Synagogue, and Secessionist facades are illuminated with warm, architectural spotlights. This creates a peaceful, deeply cinematic design walk, best finished with a glass of native wine and slow dinner in an elegant northern setting.",
  "image": "/src/assets/images/subotica_palic_lake_villa_1778843996440.webp",
  "duration": "3 hours",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Subotica",
  "estimatedCost":"€30 - €60",
  "preferredTransport": "Car + Walk",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Illuminated Ringstrasse of Vienna (Austria)"
  },
  "coordinates": {
    "lat": 46.1,
    "lng": 19.667
  },
  "coordinateX": -2,
  "coordinateY": 4,
  "radius": 4,
  "energy": 6,
  "social": 6,
  "luxury": 4,
  "urbanity": 6,
  "nature": 3,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Subotica noću",
      "shortDescription": "Witness the illuminated Art Nouveau masterpieces of Subotica under soft evening lights, followed by a quiet, refined dinner.",
      "longDescription": "At sunset, Subotica's spectacular City Hall, Synagogue, and Secessionist facades are illuminated with warm, architectural spotlights. This creates a peaceful, deeply cinematic design walk, best finished with a glass of native wine and slow dinner in an elegant northern setting.",
      "location": "Subotica"
    },
    "zh": {
      "title": "夜幕下的苏博蒂察",
      "shortDescription": "Witness the illuminated Art Nouveau masterpieces of Subotica under soft evening lights, followed by a quiet, refined dinner.",
      "longDescription": "At sunset, Subotica's spectacular City Hall, Synagogue, and Secessionist facades are illuminated with warm, architectural spotlights. This creates a peaceful, deeply cinematic design walk, best finished with a glass of native wine and slow dinner in an elegant northern setting.",
      "location": "Subotica"
    }
  }
},
{
  "id": "145",
  "title": "Gorge, Water and Thermal Rest (Ovčar Banja Combined with Ovčar-Kablar)",
  category: Category.WELLBEING,
  "shortDescription": "A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.",
  "longDescription": "Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.",
  "image": "/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp",
  "duration": "Half day",
  "travelTime": "2 hours",
  "travelTimeMinutes": 120,
  "location": "Ovčar Banja",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 240,
  "equivalents": {
    "en": "Gastein Thermal Springs (Austria)"
  },
  "coordinates": {
    "lat": 43.901,
    "lng": 20.192
  },
  "coordinateX": 2,
  "coordinateY": -2,
  "radius": 4,
  "energy": 4,
  "social": 4,
  "luxury": 3,
  "urbanity": 2,
  "nature": 8,
  "weatherDependency": 3,
  "translations": {
    "sr": {
      "title": "Klisura, voda i termalni odmor (Ovčar Banja)",
      "shortDescription": "A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.",
      "longDescription": "Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.",
      "location": "Ovčar Banja"
    },
    "zh": {
      "title": "峡谷、温泉与身心调理（奥夫查尔温泉）",
      "shortDescription": "A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.",
      "longDescription": "Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.",
      "location": "Ovčar Banja"
    }
  }
},
{
  "id": "146",
  "title": "A Weekend Above the Noise (Lukovska Banja Mountain Thermal Retreat)",
  category: Category.WELLBEING,
  "shortDescription": "Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.",
  "longDescription": "Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.",
  "image": "/src/assets/images/serbian_thermal_spa_tour_1778850947138.webp",
  "duration": "Weekend",
  "travelTime": "4 hours",
  "travelTimeMinutes": 240,
  "location": "Kopaonik Slopes",
  "estimatedCost":"€50 - €110",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Thermal Spas of Bad Gastein (Austria)"
  },
  "coordinates": {
    "lat": 43.167,
    "lng": 21.033
  },
  "coordinateX": 1,
  "coordinateY": -4,
  "radius": 4,
  "energy": 3,
  "social": 3,
  "luxury": 4,
  "urbanity": 1,
  "nature": 9,
  "weatherDependency": 2,
  "translations": {
    "sr": {
      "title": "Vikend iznad buke (Lukovska Banja)",
      "shortDescription": "Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.",
      "longDescription": "Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.",
      "location": "Kopaonik Slopes"
    },
    "zh": {
      "title": "喧嚣之上的周末（卢科沃温泉高山康养度假）",
      "shortDescription": "Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.",
      "longDescription": "Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.",
      "location": "Kopaonik Slopes"
    }
  }
},
{
  "id": "147",
  "title": "Southern Serbia in Slow Time (Prolom Banja + Carefully Curated Regional Experience)",
  category: Category.WELLBEING,
  "shortDescription": "A quiet wellness retreat famous for its highly alkaline Prolom mineral water, coupled with peaceful walks among ancient volcanic cliffs.",
  "longDescription": "Prolom Banja is nestled in southern Serbia, surrounded by the green hills of Radan Mountain. Highly regarded for its pure, mineral-light water, this peaceful spa provides therapeutic programs, forest paths, and scenic stone churches. Paired with a trip to the nearby Devils Town geological pillars, it offers a harmonious, slow-time journey of physical rest and natural exploration.",
  "image": "/src/assets/images/prolom_banja_alkaline_spa_1778850911305.webp",
  "duration": "Weekend",
  "travelTime": "3.5 hours",
  "travelTimeMinutes": 210,
  "location": "Southern Serbia",
  "estimatedCost":"€40 - €90",
  "preferredTransport": "Car",
  "seasonality": "all",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "low",
  "recommendedVisitDuration": 1440,
  "equivalents": {
    "en": "Evian-les-Bains (France)"
  },
  "coordinates": {
    "lat": 43.042,
    "lng": 21.405
  },
  "coordinateX": 2,
  "coordinateY": -3,
  "radius": 4,
  "energy": 3,
  "social": 3,
  "luxury": 4,
  "urbanity": 1,
  "nature": 8,
  "weatherDependency": 2,
  "translations": {
    "sr": {
      "title": "Južna Srbija u laganom ritmu (Prolom Banja)",
      "shortDescription": "A quiet wellness retreat famous for its highly alkaline Prolom mineral water, coupled with peaceful walks among ancient volcanic cliffs.",
      "longDescription": "Prolom Banja is nestled in southern Serbia, surrounded by the green hills of Radan Mountain. Highly regarded for its pure, mineral-light water, this peaceful spa provides therapeutic programs, forest paths, and scenic stone churches. Paired with a trip to the nearby Devils Town geological pillars, it offers a harmonious, slow-time journey of physical rest and natural exploration.",
      "location": "Southern Serbia"
    },
    "zh": {
      "title": "漫调南塞尔维亚（普罗洛姆温泉体验）",
      "shortDescription": "A quiet wellness retreat famous for its highly alkaline Prolom mineral water, coupled with peaceful walks among ancient volcanic cliffs.",
      "longDescription": "Prolom Banja is nestled in southern Serbia, surrounded by the green hills of Radan Mountain. Highly regarded for its pure, mineral-light water, this peaceful spa provides therapeutic programs, forest paths, and scenic stone churches. Paired with a trip to the nearby Devils Town geological pillars, it offers a harmonious, slow-time journey of physical rest and natural exploration.",
      "location": "Southern Serbia"
    }
  }
},
{
  "id": "148",
  "title": "The Silver River Sanctuary (Silver Lake & Ram Fortress)",
  category: Category.TRAVEL,
  "shortDescription": "A picturesque Danube lakeside escape featuring the magnificent 15th-century Ram Fortress perched atop steep river cliffs, offering unforgettable sunset views across the water.",
  "longDescription": "Located where the Danube reaches its widest expanse in Serbia, Silver Lake (Srebrno Jezero) and the nearby Ram Fortress represent a harmonious synthesis of medieval military heritage and serene water leisure. Ram Fortress, meticulously restored, stands dramatically over the river currents where Roman, Byzantine, and Ottoman fleets once navigated. A tranquil afternoon spent walking the ramparts followed by lakeside dining showcases the romantic charm of Eastern Serbia Danube corridor.",
  "image": "/src/assets/images/golubac_fortress_danube_1778842880053.webp",
  "duration": "Half day",
  "travelTime": "1.5 - 2 hours",
  "travelTimeMinutes": 100,
  "location": "Veliko Gradište & Ram",
  "estimatedCost":"€20 - €50",
  "preferredTransport": "Car + Walk",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 180,
  "equivalents": {
    "en": "Lake Como (Italy)"
  },
  "coordinates": {
    "lat": 44.812,
    "lng": 21.332
  },
  "coordinateX": 4,
  "coordinateY": -1,
  "radius": 4,
  "energy": 5,
  "social": 5,
  "luxury": 4,
  "urbanity": 3,
  "nature": 7,
  "weatherDependency": 4,
  "translations": {
    "sr": {
      "title": "Srebrno jezero i tvrdjava Ram",
      "shortDescription": "A picturesque Danube lakeside escape featuring the magnificent 15th-century Ram Fortress perched atop steep river cliffs, offering unforgettable sunset views across the water.",
      "longDescription": "Located where the Danube reaches its widest expanse in Serbia, Silver Lake (Srebrno Jezero) and the nearby Ram Fortress represent a harmonious synthesis of medieval military heritage and serene water leisure. Ram Fortress, meticulously restored, stands dramatically over the river currents where Roman, Byzantine, and Ottoman fleets once navigated. A tranquil afternoon spent walking the ramparts followed by lakeside dining showcases the romantic charm of Eastern Serbia Danube corridor.",
      "location": "Veliko Gradište & Ram"
    },
    "zh": {
      "title": "银湖圣地与拉姆要塞",
      "shortDescription": "A picturesque Danube lakeside escape featuring the magnificent 15th-century Ram Fortress perched atop steep river cliffs, offering unforgettable sunset views across the water.",
      "longDescription": "Located where the Danube reaches its widest expanse in Serbia, Silver Lake (Srebrno Jezero) and the nearby Ram Fortress represent a harmonious synthesis of medieval military heritage and serene water leisure. Ram Fortress, meticulously restored, stands dramatically over the river currents where Roman, Byzantine, and Ottoman fleets once navigated. A tranquil afternoon spent walking the ramparts followed by lakeside dining showcases the romantic charm of Eastern Serbia Danube corridor.",
      "location": "Veliko Gradište & Ram"
    }
  }
},
{
  "id": "rec-draft-zestival-uzice",
  "draftReservationId": "c813ec58-84b0-487f-9c67-49f71a88230b",
  "workflowWorkItemId": "20771354-e72a-42ab-9f35-c58f23e150ce",
  "title": "Žestival Užice",
  "titleSr": "Жестивал Ужице",
  category: Category.GASTRONOMY,
  "categories": [Category.GASTRONOMY, Category.HISTORY],
  "expertiseIds": ["exp-culture-museums", "exp-gastronomy-wine"],
  "capabilityIds": ["cap-english-fluent"],
  "publicationStatus": "RESEARCH_CANDIDATE",
  "headerVisualState": "AMBER",
  "serviceAreaId": "sa-west-003",
  "shortDescription": "An international gathering celebrating Western Serbia’s heritage of fruit cultivation, artisanal distillation, and regional gastronomy. Set against the historic backdrop of Užice, Žestival presents an immersive encounter with the living traditions of rakija craft, traditional coppersmithing, and authentic highland hospitality.",
  "shortDescriptionSr": "Међународни фестивал природе и традиције у Ужицу посвећен воћарству, традиционалном дестилисању ракије и гастрономском наслеђу Западне Србије. Кроз изложбе, стручна оцењивања и боемске вечери, Жестивал пружа аутентичан увид у деценијске обичаје и локално гостопримство.",
  "longDescription": "Originating as a dedicated fruit brandy exhibition in 2006 and revived as an expanded cultural festival in 2016, Žestival has established itself as Western Serbia's premier celebration of rural tradition and culinary heritage. Held annually in late summer at the central town square of Užice, the festival brings together master distillers, local artisans, and gastronomic producers from across Serbia, Montenegro, and Bosnia and Herzegovina.\n\nVisitors wander among wooden pavilions showcasing small-batch plum, pear, and quince rakijas evaluated by sensory juries, alongside heirloom jams, mountain cheeses, Zlakusa pottery, and traditional coppersmithing tools. Beyond tasting and trade, the evening program transforms Užice into a vibrant cultural stage with 'Bohemian Evenings' paying tribute to old tavern lore, traditional 'singing from the throat' (pevanje iz vika), and live folk performances. Pairing a glass of aged šljivovica with the legendary regional komplet lepinja offers a sensory entrance into the agricultural soul and enduring hospitality of Užice.",
  "longDescriptionSr": "Настао 2006. године као смотра воћних ракија и обновљен 2016. као међународни фестивал природе и традиције, Жестивал је постао централна културно-гастрономска манифестација Западне Србије. Сваког касного лета на Градском тргу у Ужицу, фестивал окупља врхунске дестилере, занатлије и произвођаче хране из Србије, Црне Горе и Босне и Херцеговине.\n\nПосетиоци могу дегустирати награђиване ракије од шљиве, крушке и дуње, али и истражити богату понуду домаћих џемова, планинских сирева, Злакушке грнчарије и казанџијског заната. Вечерњи програм доноси атмосферу старих кафана кроз 'Боемске вечери', наступе фолклорних ансамбала и певање из вика. Спој врхунске ракије и чувене комплет лепиње пружа посебни увид у живу традицију воћарства и срдачно гостопримство Ужичког краја.",
  "image": "/src/assets/images/distillery_zaric_modern_1778841217471.webp",
  "bestTimeToVisitEn": "Late August / early autumn during the annual multi-day festival events on Užice's town square.",
  "insiderTipEn": "Do not miss the 'Bohemian Evening' segment at the festival square, where local storytellers and musicians recreate the tavern atmosphere of old Užice. Pair your rakija tasting with a hot komplet lepinja prepared fresh from nearby bakeries.",
  "additionalCuratorNotes": "Žestival offers far more than a spirit competition; it serves as a living portrait of Užice's agricultural heritage. Here, the ritual of distillation intersects with centuries of orchard husbandry, Zlakusa pottery, and highland gastronomy, inviting travelers directly into the genuine warmth of Western Serbian hospitality.",
  "curatorNote": "Žestival offers far more than a spirit competition; it serves as a living portrait of Užice's agricultural heritage. Here, the ritual of distillation intersects with centuries of orchard husbandry, Zlakusa pottery, and highland gastronomy, inviting travelers directly into the genuine warmth of Western Serbian hospitality.",
  "location": "City Square, Užice, Western Serbia",
  "locationSr": "Градски трг, Ужице, Западна Србија",
  "coordinates": {
    "lat": 43.8556,
    "lng": 19.8425
  },
  "coordinateX": -3.5,
  "coordinateY": -2.0,
  "energy": 0.6,
  "social": 0.8,
  "luxury": 0.5,
  "urbanity": 0.6,
  "nature": 0.7,
  "weatherDependency": 0.6,
  "duration": "Full day / Evening program",
  "travelTime": "2.5 - 3 hours from Belgrade",
  "travelTimeMinutes": 160,
  "estimatedCost":"Free entry for square events; €20 - €30 for tastings & regional food",
  "preferredTransport": "Car or Intercity Bus to Užice",
  "seasonality": "spring-fall",
  "familySuitability": true,
  "accessibility": true,
  "premiumLevel": "standard",
  "budgetLevel": "moderate",
  "recommendedVisitDuration": 180,
  "website": "https://turizamuzica.org.rs",
  "phone": "+381 31 513 555",
  "practicalInfo": {
    "opening_hours": "Late August annual festival dates; square events 10:00 - 22:00",
    "contact_phone": "+381 31 513 555",
    "contact_email": "info@turizamuzica.org.rs",
    "website": "https://turizamuzica.org.rs",
    "admission_fee": "Free entry to open-air square exhibitions and cultural programs"
  },
  "provenance": {
    "source": "Turistička Organizacija Užice / Human Curator",
    "license": "CC-BY-4.0",
    "verificationStatus": "Verified",
    "altText": "Žestival Užice"
  },
  "moods": ["Cultural", "Gastronomic", "Authentic", "Vibrant"],
  "translations": {
    "en": {
      "title": "Žestival Užice",
      "shortDescription": "An international gathering celebrating Western Serbia’s heritage of fruit cultivation, artisanal distillation, and regional gastronomy. Set against the historic backdrop of Užice, Žestival presents an immersive encounter with the living traditions of rakija craft, traditional coppersmithing, and authentic highland hospitality.",
      "longDescription": "Originating as a dedicated fruit brandy exhibition in 2006 and revived as an expanded cultural festival in 2016, Žestival has established itself as Western Serbia's premier celebration of rural tradition and culinary heritage. Held annually in late summer at the central town square of Užice, the festival brings together master distillers, local artisans, and gastronomic producers from across Serbia, Montenegro, and Bosnia and Herzegovina.\n\nVisitors wander among wooden pavilions showcasing small-batch plum, pear, and quince rakijas evaluated by sensory juries, alongside heirloom jams, mountain cheeses, Zlakusa pottery, and traditional coppersmithing tools. Beyond tasting and trade, the evening program transforms Užice into a vibrant cultural stage with 'Bohemian Evenings' paying tribute to old tavern lore, traditional 'singing from the throat' (pevanje iz vika), and live folk performances. Pairing a glass of aged šljivovica with the legendary regional komplet lepinja offers a sensory entrance into the agricultural soul and enduring hospitality of Užice.",
      "location": "City Square, Užice, Western Serbia",
      "bestTimeToVisit": "Late August / early autumn during the annual multi-day festival events on Užice's town square.",
      "insiderTip": "Do not miss the 'Bohemian Evening' segment at the festival square, where local storytellers and musicians recreate the tavern atmosphere of old Užice. Pair your rakija tasting with a hot komplet lepinja prepared fresh from nearby bakeries."
    },
    "sr": {
      "title": "Жестивал Ужице",
      "shortDescription": "Међународни фестивал природе и традиције у Ужицу посвећен воћарству, традиционалном дестилисању ракије и гастрономском наслеђу Западне Србије. Кроз изложбе, стручна оцењивања и боемске вечери, Жестивал пружа аутентичан увид у деценијске обичаје и локално гостопримство.",
      "longDescription": "Настао 2006. године као смотра воћних ракија и обновљен 2016. као међународни фестивал природе и традиције, Жестивал је постао централна културно-гастрономска манифестација Западне Србије. Сваког касного лета на Градском тргу у Ужицу, фестивал окупља врхунске дестилере, занатлије и произвођаче хране из Србије, Црне Горе и Босне и Херцеговине.\n\nПосетиоци могу дегустирати награђиване ракије од шљиве, крушке и дуње, али и истражити богату понуду домаћих џемова, планинских сирева, Злакушке грнчарије и казанџијског заната. Вечерњи програм доноси атмосферу старих кафана кроз 'Боемске вечери', наступе фолклорних ансамбала и певање из вика. Спој врхунске ракије и чувене комплет лепиње пружа посебни увид у живу традицију воћарства и срдачно гостопримство Ужичког краја.",
      "location": "Градски трг, Ужице, Западна Србија",
      "bestTimeToVisit": "Крајем августа током годишњег вишедневног фестивала на Градском тргу у Ужицу.",
      "insiderTip": "Не пропустите 'Боемско вече' на градском тргу, где локални музичари и приповедачи оживавају атмосферу старих ужичких кафана. Уз дегустацију ракије обавезно пробајте топлу комплет лепињу."
    },
    "de": {
      "title": "Žestival Užice",
      "shortDescription": "Ein internationales Festival in Užice, das das kulturelle Erbe Westserbiens, die Kunst der Obstbrand-Destillation und die regionale Gastronomie feiert.",
      "longDescription": "Das Žestival wurde 2006 ins Leben gerufen und ist heute Westserbiens führendes Fest der ländlichen Traditionen und Kulinarik. Jedes Jahr im Spätsommer verwandelt sich der Stadtplatz von Užice in eine lebendige Bühne für Meisterdestilleure, Zlakusa-Töpfer und traditionelle Kunsthandwerker.",
      "location": "Stadtplatz, Užice, Westserbien"
    },
    "ru": {
      "title": "Жестивал Ужице",
      "shortDescription": "Международный фестиваль в Ужице, посвященный традициям дистилляции ракии, гастрономии и культурному наследию Западной Сербии.",
      longDescription: "Основанный в 2006 году и возрожденный в 2016-м, «Жестивал» является главным праздником фруктовых традиций и кулинарного наследия Западной Сербии. Ежегодно на центральной площади Ужице собираются лучшие мастера-дистилляторы, ремесленники и производители фермерских продуктов.",
      location: "Городская площадь, Ужице, Западная Сербия"
    },
    "es": {
      "title": "Žestival Užice",
      shortDescription: "Un festival internacional en Užice que celebra el patrimonio cultural, la destilación artesanal de rakija y la gastronomía de Serbia Occidental.",
      longDescription: "Iniciado en 2006 y revitalizado en 2016, Žestival es la principal celebración de las tradiciones rurales y gastronómicas de Serbia Occidental. Cada año a finales de verano, la plaza central de Užice reúne a maestros destiladores, artesanos de cerámica de Zlakusa y productores locales.",
      location: "Plaza Central, Užice, Serbia Occidental"
    },
    "zh": {
      "title": "乌日采Žestival烈酒与传统节",
      shortDescription: "乌日采举办的国际自然与传统节，旨在展现塞尔维亚西部的果园种植、手工白兰地酿造与地方美食遗产。",
      longDescription: "Žestival始于2006年，是塞尔维亚西部最具代表性的乡村传统与美食盛会。每年晚夏，乌日采中心广场聚集了来自塞尔维亚及周边地区的酿酒大师、兹拉库萨制陶匠人和传统手工艺人，呈现充满活力的民俗风情与待客之道。",
      location: "城市广场，乌日采，塞尔维亚西部"
    }
  }
}
];

/**
 * Alias for backward compatibility across legacy imports.
 */
export const draftExpansionPool: Recommendation[] = wave2CanonicalRecommendations;
