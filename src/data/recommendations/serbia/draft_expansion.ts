/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from '../../../types';

/**
 * 49 Candidate Curation Expansion Pool (DRAFT)
 * 
 * Note: Coordinates, Mood Orbit spatial positions (coordinateX, coordinateY), 
 * and multi-dimensional scores (energy, social, luxury, urbanity, nature, weatherDependency, radius)
 * are set to initial draft placeholders (0) and clearly marked as unverified editorial values.
 * This file is prepared as a draft resource and is not yet merged or active in the live application.
 */
export const draftExpansionPool: Recommendation[] = [
  // NATURE, LANDSCAPE & ACTIVE DISCOVERY (1 - 15)
  {
    id: "draft-1",
    title: "The Wild Karst of Eastern Serbia (Lazarev Canyon + Zlot Caves)",
    category: Category.NATURE,
    shortDescription: "Explore Lazarev Canyon, the deepest and longest canyon in eastern Serbia, coupled with the magnificent caverns of Zlot. A rugged, dramatic karst ecosystem featuring spectacular natural viewpoints, rich biodiversity, and deep prehistoric cave passages.",
    longDescription: "Lazarev Canyon is a dramatic limestone gorge carved into the eastern foothills of the Kučaj mountains. As the deepest canyon in eastern Serbia, its vertical limestone cliffs harbor unique tertiary flora and fauna. Coupled with the Zlot Caves—specifically Lazareva Pećina, famous for its ancient homonid remains, fossilized cave bear bones, and pristine stalactite galleries—this experience presents an adventurous escape into the untamed karst heartland of the country.",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/29/Lazarev_kanjon._Srbija,_%D0%A1%D0%9F245.jpg",
    duration: "Full day",
    travelTime: "3 - 3.5 hours",
    travelTimeMinutes: 210,
    location: "Near Bor",
    estimatedCost: "€15 - €30",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Gorges du Verdon (France)"
    }
  },
  {
    id: "draft-2",
    title: "Through the Stone Gates (Vratna natural bridges)",
    category: Category.NATURE,
    shortDescription: "Witness the magnificent natural limestone arches of Vratna, some of the highest stone bridges in Europe. Tucked away in a pristine forested valley, this destination offers a silent, deeply spiritual encounter with raw geology.",
    longDescription: "The Vratna natural stone gates are three massive limestone bridge-like structures (the Great, Little, and Dry gates) carved out by the Vratna River. Located next to the isolated 14th-century Vratna Monastery, these geological marvels tower up to 34 meters high. A quiet hike through the untouched forest leads travelers to the third gate, offering a profound sense of isolation and raw geological scale.",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Prerast_u_kanjonu_Vratne_1.jpg",
    duration: "3-4 hours",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Near Negotin",
    estimatedCost: "€5 - €10",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Pont d'Arc (France)"
    }
  },
  {
    id: "draft-3",
    title: "The Hidden Canyon Road (Jerma Gorge)",
    category: Category.NATURE,
    shortDescription: "A spectacular driving and hiking route winding through the narrow rock passages of the Jerma River. Bordered by towering cliffs, it leads to medieval monasteries hidden in deep mountain folds.",
    longDescription: "Jerma Gorge is one of the most visually stunning and narrowest river gorges in the Balkans, slicing through the limestone massifs of Vlaška and Greben mountains. The route once served as a narrow-gauge mining railway, and now offers a scenic driving experience flanked by near-vertical rock face walls. Hidden within the gorge are spiritual sanctuaries like the Poganovo Monastery, known for its preservation of rare 14th-century frescoes.",
    image: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Reka_Jerma_-_kanjon.jpg",
    duration: "Full day",
    travelTime: "4.5 hours",
    travelTimeMinutes: 270,
    location: "Near Dimitrovgrad",
    estimatedCost: "€20 - €40",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 300,
    equivalents: {
      en: "Aosta Valley (Italy)"
    }
  },
  {
    id: "draft-4",
    title: "Serbia’s Layered Canyon (Rosomača Canyon)",
    category: Category.NATURE,
    shortDescription: "The 'Stara Planina's Colorado' features extraordinary layered limestone cliffs that resemble stacked pancakes or geological ribs. A short but visually breathtaking walk along a rushing mountain stream.",
    longDescription: "Rosomača Canyon (locally known as Rosomački Lonci or Slavinjsko Grlo) is an unbelievable natural gorge in Stara Planina. The limestone rocks are formed in distinct parallel layers, creating a rocky throat that looks artificially carved. Over millions of years, the cold mountain water has carved out dynamic circular pools and bowls. It is a highly photogenic and unique geological monument of the Balkan mountain region.",
    image: "/src/assets/images/idemo_rosomaca_canyon.webp",
    duration: "2-3 hours",
    travelTime: "4.5 hours",
    travelTimeMinutes: 270,
    location: "Stara Planina",
    estimatedCost: "Free",
    preferredTransport: "Car + Walk",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 90,
    equivalents: {
      en: "Antelope Canyon (USA)"
    }
  },
  {
    id: "draft-5",
    title: "The Turquoise Spring Journey (Krupaj Spring + Eastern Serbia)",
    category: Category.NATURE,
    shortDescription: "An ecological oasis of mystical, deep turquoise waters flowing from a karst cave in eastern Serbia. A refreshing and calming forest walk beneath a canopy of hanging trees and limestone cliffs.",
    longDescription: "Krupaj Spring is a stunning karst spring nestled in the Homolje region of eastern Serbia. The spring water flows from a deep, submerged cave, creating an amphitheater of dense forest and turquoise pools. Underneath the serene surface lies a maze of underwater channels attracting diving explorers. It represents the quiet, mystical side of Serbian nature, where water, stone, and ancient lore meet.",
    image: "/src/assets/images/idemo_krupaj_spring.webp",
    duration: "2-4 hours",
    travelTime: "2.5 hours",
    travelTimeMinutes: 150,
    location: "Homolje Region",
    estimatedCost: "€5 - €20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Plitvice Springs (Croatia)"
    }
  },
  {
    id: "draft-6",
    title: "The Clear River Escape (Gradac River Gorge)",
    category: Category.NATURE,
    shortDescription: "Walk along Europe's cleanest river, winding through an ecological corridor near Valjevo. Features clear water pools, traditional mills, and isolated karst caves.",
    longDescription: "The Gradac River is celebrated as one of the cleanest and most ecologically pristine rivers in Southern Europe. Sourced from deep underground springs, its gorge is protected to preserve rare otters, wild trout, and unique water vegetation. Visitors can hike alongside the rushing waters, dine on freshly caught river trout near old watermills, and discover ancient cave hermitages.",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Valjevske_planine_-_kanjon_reke_Gradac_-_mesto_%C5%A0areno_platno_-_detalj_1.jpg",
    duration: "Half day",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "Valjevo",
    estimatedCost: "€10 - €25",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Soca Valley (Slovenia)"
    }
  },
  {
    id: "draft-7",
    title: "Between Two Mountains (Ovčar-Kablar Active Day)",
    category: Category.NATURE,
    shortDescription: "An immersive outdoor day in the 'Serbian Mount Athos' gorge. Combines hiking through dramatic river bends with visits to monasteries hidden in dense forest.",
    longDescription: "The Ovčar-Kablar Gorge is carved by the West Morava River, separating the peaks of Ovčar and Kablar mountains. Renowned for its ten medieval monasteries built into the cliffs during Ottoman times, the region offers a harmonious blend of pristine nature and deep religious heritage. This active route takes travelers along winding paths, offering fresh mountain air, mineral spring wells, and historic stone architecture.",
    image: "/src/assets/images/idemo_ovcar_kablar.webp",
    duration: "Full day",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Near Čačak",
    estimatedCost: "€10 - €30",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 360,
    equivalents: {
      en: "Meteora (Greece)"
    }
  },
  {
    id: "draft-8",
    title: "Above the Meanders (Kablar Viewpoint Experience)",
    category: Category.NATURE,
    shortDescription: "Stand on the newly designed glass-deck lookout perched atop Kablar Mountain. Offers a breathtaking vertical vista of the West Morava's curved meanders and the surrounding valley.",
    longDescription: "The Kablar viewpoint stands at nearly 890 meters above sea level, offering a dramatic aerial look down onto the meanders of the West Morava River. The recently established glass platform provides a secure yet thrilling view over the gorge walls and the green hills of central Serbia. It is an ideal spot for photography, panorama watching, and admiring the scale of the Serbian mountain topography.",
    image: "/src/assets/images/idemo_kablar_viewpoint.webp",
    duration: "2-3 hours",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Near Čačak",
    estimatedCost: "Free",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 90,
    equivalents: {
      en: "Grand Canyon Skywalk (USA)"
    }
  },
  {
    id: "draft-9",
    title: "The Forested Interior (Golija Mountain Retreat)",
    category: Category.NATURE,
    shortDescription: "Journey into Serbia's most forested UNESCO Biosphere Reserve. A haven of deep fir and spruce woods, cold rivers, and traditional highland villages where life moves slowly.",
    longDescription: "Golija is a mountain massif of exceptional ecological value, designated as a UNESCO Biosphere Reserve due to its pristine, dense forests and rich water systems. The peak of Jankov Kamen reaches 1,833 meters, overlooking valleys of traditional wooden cottages and pastures. It is a slow-time mountain retreat perfect for escaping modern noise, collecting wild berries, and walking under old canopies.",
    image: "/src/assets/images/idemo_golija_retreat.webp",
    duration: "Weekend",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Golija Biosphere",
    estimatedCost: "€40 - €100",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Black Forest (Germany)"
    }
  },
  {
    id: "draft-10",
    title: "Serbia’s Unexpected Hills (Zagajička Hills)",
    category: Category.NATURE,
    shortDescription: "Walk among the strange, wave-like grass hills of the Deliblato Sands. This ancient dune system looks like a rolling green carpet straight out of a dream.",
    longDescription: "Zagajička Brda are a unique geological formation situated on the edge of the Deliblato Sands—Europe’s largest continental sandy terrain. These spherical, grass-covered dunes resemble emerald waves frozen in time. The area offers exceptional panoramas towards the Danube, the Vršac mountains, and southern Banat, providing a serene walking environment with zero urban noise.",
    image: "/src/assets/images/idemo_zagajicka_hills.webp",
    duration: "4-5 hours",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "Deliblato Sands",
    estimatedCost: "Free",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Tuscany Hills (Italy)"
    }
  },
  {
    id: "draft-11",
    title: "A Morning Among the Birds (Carska Bara)",
    category: Category.NATURE,
    shortDescription: "A spectacular wetland reserve in Vojvodina hosting hundreds of rare migratory bird species. Enjoy quiet boat rides and photography among fields of water lilies.",
    longDescription: "Carska Bara (The Imperial Pond) is an exceptional marshland ecosystem situated near the Begej River. Home to over 250 species of birds, including rare herons and cormorants, it is an international Ramsar wetland. Boat cruises navigate the quiet waterways under dense willow galleries, offering travelers a peaceful morning of birdwatching, soft light photography, and absolute silence.",
    image: "/src/assets/images/idemo_carska_bara.webp",
    duration: "Half day",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Near Zrenjanin",
    estimatedCost: "€5 - €15",
    preferredTransport: "Car + Boat",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "The Everglades (USA)"
    }
  },
  {
    id: "draft-12",
    title: "The Wetlands Near Belgrade (Obedska Bara)",
    category: Category.NATURE,
    shortDescription: "One of Europe’s oldest protected reserves, located just an hour from Belgrade. A peaceful oxbow lake rich in oak forests, birds, and water lilies.",
    longDescription: "Obedska Bara is a vast swamp and forest area situated along the Sava River. First protected in 1874 by the Austro-Hungarian crown, it is one of the world's oldest nature reserves. The oxbow lake structure contains rare water vegetation, while surrounding oak forests offer shade and quiet walking paths, ideal for a short ecological getaway from the capital.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Near Pećinci",
    estimatedCost: "€5 - €10",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Coto Doñana (Spain)"
    }
  },
  {
    id: "draft-13",
    title: "The Fortress Above the Ibar (Maglič Landscape Journey)",
    category: Category.NATURE,
    shortDescription: "Witness the ruins of Maglič Castle perched spectacularly on a rocky ridge high above the winding Ibar River. A dramatic medieval landscape full of history and wild peaks.",
    longDescription: "Maglič is a medieval fortress built in the 13th century to protect the surrounding monasteries and trading routes. Flanked on three sides by the rushing Ibar River, the stone ruins stand like a sentinel on a near-vertical cliff. Climbing to the top rewards travelers with panoramic mountain views and a deep, historical sense of wild Serbia.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3-4 hours",
    travelTime: "3 hours",
    travelTimeMinutes: 180,
    location: "Ibar Valley",
    estimatedCost: "Free",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Dunnotar Castle (Scotland)"
    }
  },
  {
    id: "draft-14",
    title: "Tara’s Manuscript Trail (Rača Monastery + Surrounding Landscape)",
    category: Category.NATURE,
    shortDescription: "A gentle walking trail in Tara National Park linking the historical Rača Monastery to clear mountain springs. Blends dense woodlands with medieval monastic literacy lore.",
    longDescription: "This tranquil route begins at Rača Monastery, founded in the 13th century and famous for preserving the Serbian Cyrillic script during Ottoman rule. The path follows the crystal-clear Rača River through thick beech and spruce forests to the emerald-green 'Ladjevac' thermal spring, representing a peaceful pilgrimage of heritage and nature.",
    image: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Manastir_Ra%C4%8Da_124.jpg",
    duration: "3-4 hours",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Tara National Park",
    estimatedCost: "Free",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Fountains Abbey (UK)"
    }
  },
  {
    id: "draft-15",
    title: "Eastern Serbia Discovery Weekend",
    category: Category.NATURE,
    shortDescription: "A curated multi-stop nature circuit winding through eastern Serbia's dense forests, limestone cliffs, and rushing water springs.",
    longDescription: "Designed as a comprehensive road trip, this route connects the most spectacular natural landmarks of Eastern Serbia, including Krupaj Spring, Ždrelo Gorge, and the majestic waterfalls of Veliki Buk. Travelers discover a region steeped in ancient Vlach traditions, rich geological architecture, and rustic mountain taverns serving local Homolje honey and sheep's cheese.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Weekend",
    travelTime: "3 hours",
    travelTimeMinutes: 180,
    location: "Eastern Serbia",
    estimatedCost: "€50 - €120",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Black Forest High Road (Germany)"
    }
  },

  // HISTORY, ARCHITECTURE & CULTURAL DEPTH (16 - 29)
  {
    id: "draft-16",
    title: "The Forgotten Fortress of Bač (Bač Fortress + Cultural Landscape)",
    category: Category.HISTORY,
    shortDescription: "Discover the remnants of Vojvodina's most significant medieval fortress, dating back to the 14th century. Features a striking, preserved brick keep surrounded by historical plains.",
    longDescription: "The Fortress of Bač represents the best-preserved medieval fortification in the Vojvodina plains. Built on a former island of the Mostonga River, its architectural layers span Hungarian kings, Ottoman garrisons, and Franciscan monasteries. Climbing the central tower offers dramatic views over the flat, agrarian landscape and the ancient trade routes that built Vojvodina.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Bač",
    estimatedCost: "€5 - €10",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Malbork Castle (Poland)"
    }
  },
  {
    id: "draft-17",
    title: "Where Empires Met the Danube (Fetislam Fortress + Kladovo)",
    category: Category.HISTORY,
    shortDescription: "A massive 16th-century Ottoman fortification on the banks of the Danube River in Kladovo. Blends military history with scenic river views at the border with Romania.",
    longDescription: "Fetislam (literally meaning 'Victory of Islam') is an imposing fortress complex featuring a small inner fort and a larger outer bastion built to control the Danube trade. Recently restored, its gates and artillery bastions provide an evocative journey through Ottoman-Austrian border conflicts, while the tranquil town of Kladovo offers a relaxed riverine escape.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Kladovo",
    estimatedCost: "€5 - €15",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Rumeli Hisari (Turkey)"
    }
  },
  {
    id: "draft-18",
    title: "A Danube Afternoon Beyond Belgrade (Smederevo Fortress + River Evening)",
    category: Category.HISTORY,
    shortDescription: "Explore the colossal 15th-century Smederevo Fortress, one of Europe's largest flatland fortifications. Walk atop its massive brick towers as the sun sets over the Danube.",
    longDescription: "Smederevo Fortress was built by Despot Djuradj Brankovic to serve as the final medieval capital of Serbia before the Ottoman conquest. Built in a triangular shape at the confluence of the Jezava and Danube rivers, its twenty-five massive defensive towers still stand as a monument to medieval engineering. The quiet riverfront offers a classic setting for a peaceful evening walk.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Smederevo",
    estimatedCost: "€5 - €10",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Fortress of Carcassonne (France)"
    }
  },
  {
    id: "draft-19",
    title: "The Valley of the Kings (Curated Medieval Serbia Journey)",
    category: Category.HISTORY,
    shortDescription: "A deep cultural pilgrimage tracing the foundations of the medieval Serbian state through royal monasteries hidden in mountain valleys.",
    longDescription: "This curated route through the valley of the Ibar River guides travelers to monumental UNESCO-listed medieval foundations, specifically Studenica and Sopoćani monasteries. Famous for housing world-renowned Byzantine frescoes, marble vaults, and royal tombs, this experience represents a profound look into the visual, artistic, and administrative roots of the Nemanjić dynasty.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Weekend",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Raška Region",
    estimatedCost: "€30 - €80",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Abbeys of the Loire Valley (France)"
    }
  },
  {
    id: "draft-20",
    title: "The Foundations of Serbia (Old Ras + St Peter’s Church)",
    category: Category.HISTORY,
    shortDescription: "Stand inside the oldest intact Christian church in Serbia, surrounded by the ruins of the medieval capital fortress of Ras.",
    longDescription: "St. Peter’s Church (Petrova Crkva) in Novi Pazar dates back to the 9th century, built upon a prehistoric Illyrian burial mound. As a UNESCO World Heritage site, it hosted critical medieval assemblies of the Nemanjić state. Coupled with the nearby hilltop ruins of the fortress of Old Ras, this trip is an evocative journey to the physical cradle of Serbian history.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Novi Pazar",
    estimatedCost: "€5 - €10",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Byzantine Churches of Ravenna (Italy)"
    }
  },
  {
    id: "draft-21",
    title: "Where Serbia Meets the Orient (Novi Pazar Cultural Journey)",
    category: Category.HISTORY,
    shortDescription: "Immerse yourself in a lively, historic city blending Ottoman architecture, busy bazaars, traditional hammams, and authentic culinary specialties.",
    longDescription: "Novi Pazar represents a unique cultural intersection in Serbia, where Ottoman mosques and Turkish baths stand alongside orthodox historical centers. The city’s ancient bazaar area (Altun-Alem Mosque and the old hammam) remains highly authentic, offering travelers a vibrant, bustling environment known for its traditional regional food (mantije, ćevapi) and rich craft traditions.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Novi Pazar",
    estimatedCost: "€20 - €50",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 300,
    equivalents: {
      en: "Sarajevo Old Town (Bosnia)"
    }
  },
  {
    id: "draft-22",
    title: "Serbia’s Art Nouveau North (Subotica Architecture + Synagogue)",
    category: Category.HISTORY,
    shortDescription: "An architectural route through Subotica’s vibrant, colorful Secessionist facades and the beautifully restored Art Nouveau Synagogue.",
    longDescription: "Subotica is celebrated for its outstanding heritage of Hungarian Secessionist architecture (a localized branch of Art Nouveau). Highlights include the spectacular City Hall, Raichle Palace, and the Subotica Synagogue—one of Europe's finest examples of its kind. Hand-painted Zsolnay ceramics, sweeping curved rooflines, and floral brick facades define this elegant, Central European northern gateway.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Subotica",
    estimatedCost: "€15 - €40",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Art Nouveau Districts of Riga (Latvia)"
    }
  },
  {
    id: "draft-23",
    title: "Royal Serbia in Half a Day (Oplenac + Royal Heritage + Historic Winery)",
    category: Category.HISTORY,
    shortDescription: "Visit the spectacular white-marble royal mausoleum of the Karađorđević dynasty in Topola, boasting one of the world's largest collections of mosaic art.",
    longDescription: "Perched atop Oplenac Hill, St. George's Church houses the tombs of the Serbian and Yugoslav royal family. The interior is decorated with stunning mosaics comprising 40 million tiles in 15,000 different colors, recreating frescoes from Serbia’s finest medieval monasteries. The experience is paired with the historic Royal Winery, founded in 1930 to produce wines on the sun-soaked slopes of Šumadija.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1.2 hours",
    travelTimeMinutes: 75,
    location: "Topola",
    estimatedCost: "€15 - €35",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Sacre Coeur Basilica (France)"
    }
  },
  {
    id: "draft-24",
    title: "Niš Through Its People",
    category: Category.HISTORY,
    shortDescription: "A narrative cultural route exploring the layered historical memories of southern Serbia's largest city, from Roman imperial heritage to dark modern memories.",
    longDescription: "This curated cultural tour takes travelers through the historical memories of Niš. Highlights include Mediana, the luxury estate of Roman Emperor Constantine the Great; the evocative Skull Tower (Ćele Kula), built by Ottoman forces in 1809; and the historic Niš Fortress, offering a balanced narrative of battlefields, family memory, and southern Serbian hospitality.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "2.5 hours",
    travelTimeMinutes: 150,
    location: "Niš",
    estimatedCost: "€15 - €30",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 300,
    equivalents: {
      en: "Ancient Sites of Split (Croatia)"
    }
  },
  {
    id: "draft-25",
    title: "The Danube’s Ancient Frontier (Roman Heritage Journey)",
    category: Category.HISTORY,
    shortDescription: "Follow the ancient northern border of the Roman Empire along the Danube. Visited sites include Viminacium's archaeological ruins and Trajan's Bridge.",
    longDescription: "Viminacium was a vast Roman military camp and capital of the Upper Moesia province. This archaeological experience allows visitors to explore underground crypts, reconstructed imperial villas, and dinosaur remains. The journey continues along the Danube to Trajan's Plaque (Tabula Traiana), built to commemorate the Roman road that connected Rome to Dacia.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "2.5 hours",
    travelTimeMinutes: 150,
    location: "Danube Valley",
    estimatedCost: "€15 - €30",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Hadrian's Wall (UK)"
    }
  },
  {
    id: "draft-26",
    title: "The Monasteries of Fruška Gora",
    category: Category.HISTORY,
    shortDescription: "A selected, non-exhaustive monastic route through Fruška Gora National Park, visiting historic orthodox sanctuaries nestled in forest folds.",
    longDescription: "Often called the 'Serbian Holy Mountain,' Fruška Gora was once home to over 30 medieval monasteries. This non-exhaustive route highlights Krušedol and Novo Hopovo monasteries, famous for their brickwork, baroque bell towers, and hidden frescoes. It offers a balanced, peaceful journey connecting natural silence with ancient literacy preservation.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Fruška Gora",
    estimatedCost: "Free",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Tuscan Monasteries (Italy)"
    }
  },
  {
    id: "draft-27",
    title: "Serbia Before the Crowds",
    category: Category.HISTORY,
    shortDescription: "A carefully curated medieval heritage route guiding you through lesser-known, isolated fortifications and architectural treasures.",
    longDescription: "For travelers seeking quiet authenticity, this route highlights architectural and fortification heritage off the main tourist trail. It includes Soko Grad's clifftop ruins and Mileševa Monastery—home to the world-famous 'White Angel' fresco. These isolated valleys offer deep tranquility, uncrowded stone ruins, and honest contact with ancient Serbian history.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Central & Southern Serbia",
    estimatedCost: "Free",
    preferredTransport: "Car + Hike",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Cathar Castles (France)"
    }
  },
  {
    id: "draft-28",
    title: "The Architecture of Yugoslav Belgrade (Modernist Architecture Route)",
    category: Category.HISTORY,
    shortDescription: "Discover the colossal, bold concrete architecture of New Belgrade and Belgrade's center, tracing socialist modernist and brutalist monuments.",
    longDescription: "New Belgrade (Novi Beograd) is an architectural museum of mid-20th century urban planning. This architecture route takes design enthusiasts past iconic monumental sights, including the Western City Gate (Genex Tower), the Palace of Serbia (SIV), and the Sava Center. It represents a fascinating look at how Concrete, Ideology, and Modernist dreams combined to build Yugoslavia's administrative core.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3-4 hours",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "Belgrade",
    estimatedCost: "Free",
    preferredTransport: "Walk + Public Transit",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Le Corbusier District of Chandigarh (India)"
    }
  },
  {
    id: "draft-29",
    title: "The City that Built Modern Serbia (Kragujevac Industrial-Modernist Story)",
    category: Category.HISTORY,
    shortDescription: "Uncover Kragujevac’s fascinating historical layers, from the 19th-century industrial complexes to the monumental memorial parks of the Yugoslav era.",
    longDescription: "As Serbia’s first industrial powerhouse, Kragujevac features the 'Knežev Arsenal'—a spectacular 19th-century red-brick military-industrial foundry. This is balanced by the Šumarice Memorial Park, home to the iconic 'Interrupted Flight' modernist monument, presenting a profound, reflective narrative of industrialization and war memory.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "Kragujevac",
    estimatedCost: "Free",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Zollverein Coal Mine (Germany)"
    }
  },

  // WINE, GASTRONOMY & LIVING TRADITIONS (30 - 42)
  {
    id: "draft-30",
    title: "Wine Among Stone Cellars (Rajačke Pimnice at Dusk)",
    category: Category.GASTRONOMY,
    shortDescription: "A timeless village of 270 hand-carved stone cellars dedicated exclusively to wine. Taste local Prokupac and Tamjanika in medieval atmospheric stone vaults.",
    longDescription: "The Rajačke Pimnice (cellars) in eastern Serbia are a unique architectural complex built of local limestone during the 18th and 19th centuries. Erected separate from the human dwellings, these cells are carved into the ground to provide naturally stable temperatures for winemaking. Walking through the narrow dusty paths at dusk feels like stepping into a medieval wine sanctuary, complete with family wine-tasting rooms.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Rajac Village",
    estimatedCost: "€20 - €50",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Burgenland Wine Cellars (Austria)"
    }
  },
  {
    id: "draft-31",
    title: "The Other Stone Wine Village (Rogljevo)",
    category: Category.GASTRONOMY,
    shortDescription: "Rogljevo’s authentic, preserved limestone wine cellars offer an alternative, highly intimate tasting environment less crowded than Rajac.",
    longDescription: "Rogljevske Pimnice are the close neighbors to Rajac, featuring over 150 stone wine-cellars constructed with similar Ottoman and Central European design overlays. Selected because of its highly intimate, family-run micro-winery culture, Rogljevo allows visitors to talk directly with generational winemakers while enjoying traditional charcuterie under wooden arches.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "2-3 hours",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Rogljevo Village",
    estimatedCost: "€20 - €40",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Traditional cellars of Tokaj (Hungary)"
    }
  },
  {
    id: "draft-32",
    title: "Wine Behind Monastery Walls (Bukovo Monastery Winery)",
    category: Category.GASTRONOMY,
    shortDescription: "Taste elegant, local wines produced by orthodox monks within the serene courtyards of the historic Bukovo Monastery.",
    longDescription: "Bukovo Monastery, founded in Negotin, has preserved winemaking traditions for centuries. Monks here have revived 'Crna Tamjanika' (Black Tamjanika), an exceptionally rare, aromatic muscat grape. Tasting these premium, hand-crafted wines within the peaceful monastery gardens offers an evocative, deeply calming culinary experience.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "2 hours",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Near Negotin",
    estimatedCost: "€15 - €30",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 90,
    equivalents: {
      en: "Abbey Wine Tastings (France)"
    }
  },
  {
    id: "draft-33",
    title: "The Bermet Afternoon (Sremski Karlovci)",
    category: Category.GASTRONOMY,
    shortDescription: "Taste Bermet—the sweet, herbal wine once served on the Titanic—in the colorful, baroque wine estates of Sremski Karlovci.",
    longDescription: "Sremski Karlovci is a beautiful, historic town on the Danube, serving as the cultural heartland of Vojvodina's winemaking. Bermet is the town's jewel: a sweet dessert wine infused with over 20 secret mountain herbs. Enjoy cellars run by generational families and walk through the historic town square, famous for its elegant, Austro-Hungarian design.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3-4 hours",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Sremski Karlovci",
    estimatedCost: "€15 - €35",
    preferredTransport: "Car + Train",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Port Wine Lodges of Porto (Portugal)"
    }
  },
  {
    id: "draft-34",
    title: "Native Grapes of Fruška Gora (Small-Producer Wine Journey)",
    category: Category.GASTRONOMY,
    shortDescription: "A curated driving and tasting tour visiting boutique, family-run vineyards specializing in native grapes like Grašac and Sila.",
    longDescription: "Escape the commercial estates and enter the private tasting tables of Fruška Gora’s boutique wine makers. Discover the renaissance of Grašac (an ancient white variety) and modern blends that benefit from the Danube’s unique micro-climate, paired with home-baked bread, cold cuts, and field view sunset walks.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "1 hour",
    travelTimeMinutes: 60,
    location: "Fruška Gora Slopes",
    estimatedCost: "€25 - €60",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Burgenland Boutique Wineries (Austria)"
    }
  },
  {
    id: "draft-35",
    title: "The Scent of Tamjanika (Župa Wine Country)",
    category: Category.GASTRONOMY,
    shortDescription: "Immerse yourself in Župa, the historical home of Tamjanika. Taste floral white wines and rich Prokupac reds directly at the vineyards.",
    longDescription: "Župa is often called the 'Serbian Champagne' region, boasting a spectacular basin landscape surrounded by sun-soaked hills. Famous for Tamjanika—an intensely aromatic, native white grape carrying scent notes of wild thyme and elderflower—and the robust red Prokupac, this area provides visitors with highly traditional, generational family cellars and local food pairings.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Weekend",
    travelTime: "3 hours",
    travelTimeMinutes: 180,
    location: "Aleksandrovac (Župa)",
    estimatedCost: "€30 - €80",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Alsace Wine Route (France)"
    }
  },
  {
    id: "draft-36",
    title: "The Return of Prokupac (Toplica Wine Journey)",
    category: Category.GASTRONOMY,
    shortDescription: "Discover Toplica, a emerging southern wine region focusing on organic, complex expressions of Serbia's flagship native red grape, Prokupac.",
    longDescription: "Toplica features a rugged climate and volcanic soils perfect for cultivating deep, structure-heavy red wines. This tasting journey guides wine lovers through boutique family cellars committed to returning Prokupac to global tables, highlighting the region’s authentic culinary specialties and wild oak landscapes.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "3 hours",
    travelTimeMinutes: 180,
    location: "Toplica Valley",
    estimatedCost: "€20 - €50",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: false,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 300,
    equivalents: {
      en: "Rioja Alavesa (Spain)"
    }
  },
  {
    id: "draft-37",
    title: "The Village that Turns Red (Donja Lokošnica)",
    category: Category.GASTRONOMY,
    shortDescription: "Witness a spectacular, strictly seasonal autumn tradition where entire village houses are completely covered in hanging red pepper chains.",
    longDescription: "Donja Lokošnica is a small, southern village celebrated as the world capital of ground pepper. Every autumn, local farmers harvest millions of native 'nizača' peppers, threading them manually into long chains. The facades of almost every single brick and plaster house are completely draped in deep red, creating a stunning visual and culinary monument to Balkan family agrarian life.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "2-3 hours",
    travelTime: "3 hours",
    travelTimeMinutes: 180,
    location: "Near Leskovac",
    estimatedCost: "Free",
    preferredTransport: "Car",
    seasonality: "summer", // Strict Autumn harvest window
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Espelette Pepper Harvest (France)"
    }
  },
  {
    id: "draft-38",
    title: "Pirot at the Table (Regional Food + Craft Journey)",
    category: Category.GASTRONOMY,
    shortDescription: "Savor the unique gastronomy of southeastern Serbia. Highlights include ironed sausage (peglana), Sabor cheese, and handmade wool kilims (Pirot carpets).",
    longDescription: "Pirot is situated beneath the slopes of Stara Planina, harboring exceptional living traditions. This culinary experience guides travelers into local makers' tables to taste peglana kobasica (a specialized cured sausage flattened manually with a bottle) and Sjenica cheese. This is coupled with a visit to the Pirot Kilim weavers, who preserve complex, geometric symbols passed down for generations.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Pirot",
    estimatedCost: "€20 - €50",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 300,
    equivalents: {
      en: "Gastronomy of Parma & Artisan Weaving (Italy)"
    }
  },
  {
    id: "draft-39",
    title: "Breakfast on the Pešter Plateau (Sjenica Highland Food Experience)",
    category: Category.GASTRONOMY,
    shortDescription: "An authentic, hearty culinary morning on Serbia’s cold highland plateau. Savor Sjenica cheese, fresh clotted cream (kajmak), and traditional buckwheat pies.",
    longDescription: "The Pešter Plateau is a vast, cold highland region known for its harsh winters and spectacular, rolling grasslands. This traditional breakfast experience introduces travelers to local farms to taste authentic Sjenica sheep cheese (protected geographical status) and buckwheat pita baked under metal domes (sač), presenting a warm, rustic introduction to shepherd culture.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3 hours",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Pešter Plateau",
    estimatedCost: "€10 - €25",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    equivalents: {
      en: "Highland Breakfast in South Tyrol (Italy)"
    }
  },
  {
    id: "draft-40",
    title: "Made of Earth and Fire (Zlakusa Pottery + Slow-Cooked Food)",
    category: Category.GASTRONOMY,
    shortDescription: "Discover the generation-old clay pottery village of Zlakusa. Watch potters shape pots manually, then dine on meat slow-cooked in these clay vessels.",
    longDescription: "Zlakusa is globally famous for its UNESCO-listed pottery tradition, where artisans mix local clay with ground calcite to produce exceptionally durable vessels. Visitors can participate in workshop forming and enjoy a traditional feast of cabbage or meat slow-cooked for over six hours in these fire-resistant pots, creating a rich, smoky culinary memory.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "2.5 hours",
    travelTimeMinutes: 150,
    location: "Zlakusa Village",
    estimatedCost: "€15 - €35",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Clay Craft & Tajine cooking of Fez (Morocco)"
    }
  },
  {
    id: "draft-41",
    title: "[CONCEPT DRAFT] A Serbian Table Worth the Journey", // DRAFT / UNVERIFIED
    category: Category.GASTRONOMY,
    shortDescription: "A curated dining experience at a specific, verified rural destination that celebrates local heirloom ingredients and zero-kilometer cooking.",
    longDescription: "To be verified during the later integration phases, this culinary card targets an exceptional, high-concept farm-to-table estate that integrates generational recipes with modern culinary techniques, highlighting hand-pressed pumpkin seed oil, wild mushrooms, and traditional baking methods.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3-4 hours",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "To be verified", // DRAFT / UNVERIFIED
    estimatedCost: "€30 - €70",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "premium",
    budgetLevel: "moderate",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Slow Food Estates of Piedmont (Italy)"
    }
  },
  {
    id: "draft-42",
    title: "[CONCEPT DRAFT] From Market to Table", // DRAFT / UNVERIFIED
    category: Category.GASTRONOMY,
    shortDescription: "A genuinely curated, hands-on market walking and cooking experience tracing fresh ingredients and traditional recipes.",
    longDescription: "To be verified and structured with local chefs, this card represents an active culinary walkthrough, taking travelers into traditional open markets to source ingredients, followed by an intimate cooking workshop preparing traditional Serbian specialties like ajvar or sarma.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Half day",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "To be verified", // DRAFT / UNVERIFIED
    estimatedCost: "€40 - €80",
    preferredTransport: "Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Boqueria Market Cooking Classes (Spain)"
    }
  },

  // URBAN, DESIGN & CONTEMPORARY SERBIA (43 - 46)
  {
    id: "draft-43",
    title: "Belgrade Through an Architect’s Eyes (Focused Design and Modernism Route)",
    category: Category.TRAVEL,
    shortDescription: "A curated walking tour focusing on Belgrade’s design evolution, from Art Nouveau details to brutalist housing blocks and modern galleries.",
    longDescription: "Step away from standard sightseeing and explore Belgrade’s urban fabric through architectural design blocks. A curated path explores the historic center's classic Secessionist buildings, the modernist architecture of post-war squares, and active contemporary galleries that trace Serbia's architectural history.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3 hours",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "Belgrade",
    estimatedCost: "€10 - €25",
    preferredTransport: "Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Bauhaus District Walk of Weimar (Germany)"
    }
  },
  {
    id: "draft-44",
    title: "[CONCEPT DRAFT] The Creative Workshops of Belgrade", // DRAFT / UNVERIFIED
    category: Category.TRAVEL,
    shortDescription: "A curated design crawl linking named, verified studios, print shops, and local makers keeping artisanal Belgrade crafts alive.",
    longDescription: "To be verified with specific makers, this card serves as an active link to Belgrade's local designer community. It highlights hand-binding bookmakers, modern pottery designers, and custom screenprinters, offering visitors direct contact with the modern creative pulse of Belgrade.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3-4 hours",
    travelTime: "0.2 hours",
    travelTimeMinutes: 10,
    location: "To be verified", // DRAFT / UNVERIFIED
    estimatedCost: "Free",
    preferredTransport: "Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "free",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Artisan Studios of Marais (France)"
    }
  },
  {
    id: "draft-45",
    title: "Subotica After Dark",
    category: Category.HISTORY,
    shortDescription: "Witness the illuminated Art Nouveau masterpieces of Subotica under soft evening lights, followed by a quiet, refined dinner.",
    longDescription: "At sunset, Subotica's spectacular City Hall, Synagogue, and Secessionist facades are illuminated with warm, architectural spotlights. This creates a peaceful, deeply cinematic design walk, best finished with a glass of native wine and slow dinner in an elegant northern setting.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "3 hours",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Subotica",
    estimatedCost: "€20 - €50",
    preferredTransport: "Car + Walk",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 180,
    equivalents: {
      en: "Illuminated Ringstrasse of Vienna (Austria)"
    }
  },
  {
    id: "draft-46",
    title: "[CONCEPT DRAFT] Contemporary Serbia Beyond Belgrade", // DRAFT / UNVERIFIED
    category: Category.TRAVEL,
    shortDescription: "A rotating, verified gallery and design circuit highlighting modern visual art, industrial design, and cultural centers outside Belgrade.",
    longDescription: "To be verified in later production stages, this route highlights provincial galleries, cultural hubs, and industrial design studios located in towns like Novi Sad and Niš, presenting a multi-faceted portrait of modern Serbian design culture.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Full day",
    travelTime: "1.5 hours",
    travelTimeMinutes: 90,
    location: "To be verified", // DRAFT / UNVERIFIED
    estimatedCost: "€5 - €20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Contemporary Art Circuit of Leipzig (Germany)"
    }
  },

  // RESTORATION & SLOWER TIME (47 - 49)
  {
    id: "draft-47",
    title: "Gorge, Water and Thermal Rest (Ovčar Banja Combined with Ovčar-Kablar)",
    category: Category.WELLBEING,
    shortDescription: "A slow, healing day in the green heart of Ovčar Gorge. Combine mild scenic hiking with peaceful thermal baths nestled beneath towering mountains.",
    longDescription: "Ovčar Banja is a small, historical thermal spring settlement nestled in the middle of the Ovčar-Kablar Gorge. Rich in mineral waters at a warm 38°C, the baths have provided wellness and relief since ancient Roman times. After a gentle walk along the West Morava riverbanks, travelers can submerge in warm pools, surrounded by dense forests and the silence of nearby monasteries.",
    image: "https://upload.wikimedia.org/wikipedia/commons/6/60/Ov%C4%8Darsko-kablarska_klisura_01.jpg",
    duration: "Half day",
    travelTime: "2 hours",
    travelTimeMinutes: 120,
    location: "Ovčar Banja",
    estimatedCost: "€15 - €35",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 240,
    equivalents: {
      en: "Gastein Thermal Springs (Austria)"
    }
  },
  {
    id: "draft-48",
    title: "A Weekend Above the Noise (Lukovska Banja Mountain Thermal Retreat)",
    category: Category.WELLBEING,
    shortDescription: "Relax in Serbia’s highest thermal resort, perched at 681m on the slopes of Kopaonik. Features hot spring pools surrounded by clean alpine air and snow.",
    longDescription: "Lukovska Banja represents the ultimate slow thermal retreat, located in an alpine mountain fold rich in mineral springs. Surrounded by dense pine forests, its thermal waters range up to 56°C, allowing hot outdoor baths even during freezing winters. It is a peaceful destination for mountain walks, clear air inhalation, and high-altitude relaxation.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Weekend",
    travelTime: "4 hours",
    travelTimeMinutes: 240,
    location: "Kopaonik Slopes",
    estimatedCost: "€40 - €90",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Thermal Spas of Bad Gastein (Austria)"
    }
  },
  {
    id: "draft-49",
    title: "Southern Serbia in Slow Time (Prolom Banja + Carefully Curated Regional Experience)",
    category: Category.WELLBEING,
    shortDescription: "A quiet wellness retreat famous for its highly alkaline Prolom mineral water, coupled with peaceful walks among ancient volcanic cliffs.",
    longDescription: "Prolom Banja is nestled in southern Serbia, surrounded by the green hills of Radan Mountain. Highly regarded for its pure, mineral-light water, this peaceful spa provides therapeutic programs, forest paths, and scenic stone churches. Paired with a trip to the nearby Devils Town geological pillars, it offers a harmonious, slow-time journey of physical rest and natural exploration.",
    image: "/src/assets/images/draft_placeholder.png",
    duration: "Weekend",
    travelTime: "3.5 hours",
    travelTimeMinutes: 210,
    location: "Southern Serbia",
    estimatedCost: "€30 - €70",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 1440,
    equivalents: {
      en: "Evian-les-Bains (France)"
    }
  }
];
