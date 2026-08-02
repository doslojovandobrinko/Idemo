/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EditorialCollection, EditorialCollectionCategory } from "../types";

/**
 * Canonical Wave 1 Editorial Collections Dataset.
 * Museum-quality editorial collections establishing Serbia's thematic journeys.
 */
export const INITIAL_EDITORIAL_COLLECTIONS: EditorialCollection[] = [
  {
    id: "EC-001",
    titleEn: "Serbia’s Role in Global Diplomacy During the Twentieth Century",
    titleSr: "Uloga Srbije u globalnoj diplomatiji dvadesetog veka",
    titleZh: "二十世纪塞尔维亚在全球外交中的角色",
    subtitleEn:
      "Belgrade as a Pivot of International Non-Alignment and Cold War Geopolitics",
    subtitleSr:
      "Beograd kao težište međunarodnog nesvrstavanja i hladnoratovske geopolitike",
    subtitleZh: "贝尔格莱德作为国际不结盟与冷战地缘政治的枢纽",
    introductionEn: `Throughout the twentieth century, Belgrade occupied an extraordinary position in international statecraft. Operating at the geopolitical intersection of Western democracies, the Eastern Bloc, and developing nations across the Global South, the capital served as a primary neutral forum for transcontinental negotiation and multilateral dialogue.

The diplomatic architecture of Belgrade was deliberately constructed to project sovereignty and international engagement. From the suburban institutional enclave of Dedinje—where foreign delegations met in diplomatic residences and state protocol centers—to the monumental urban planning of New Belgrade, the built environment physically embodied Yugoslavia's role as a mediator between competing global power structures.

Key architectural landmarks such as the Palace of Serbia (SIV) and the Sava Centre were specifically designed to host grand assemblies, international congresses, and bilateral summits. Modernist design principles, expansive marble halls, and integrated conference facilities reflected an ambition to host global summits with complete technical independence. Today, exploring these sites offers visitors a direct encounter with the physical spaces, monumental art, and material culture that framed pivotal moments in twentieth-century international relations.`,
    introductionSr: `Tokom dvadesetog veka, Beograd je zauzimao izuzetan položaj u međunarodnoj diplomatiji. Delujući na geopolitičkom raskršću zapadnih demokratija, Istočnog bloka i zemalja u razvoju Globalnog juga, prestonica je služila kao primarni neutralni forum za transkontinentalne pregovore i multilateralni dijalog.

Diplomatska arhitektura Beograda namenski je građena da izrazi suverenitet i međunarodno angažovanje. Od Dedinja do monumentalnog urbanizma Novog Beograda, izgrađeno okruženje fizički je odražavalo ulogu posrednika između suprotstavljenih sila.`,
    heroImage:
      "/src/assets/images/bitef_theatre_belgrade_modern_1778847369770.webp",
    gallery: [
      "/src/assets/images/silosi_belgrade_industrial_night_1778842947193.webp",
    ],
    category: EditorialCollectionCategory.HISTORY_HERITAGE,
    estimatedDuration: "1 Day",
    visitorProfile: [
      "History Enthusiasts",
      "Cultural & Architectural Observers",
      "Diplomatic History Scholars",
    ],
    recommendedSeason: ["Spring", "Summer", "Autumn", "Winter"],
    estimatedBudget: "Moderate",
    geographicScope: "Belgrade (Dedinje & New Belgrade)",
    recommendationIds: ["130", "65", "64", "7"],
    recommendedOrder: [1, 2, 3, 4],
    visitorTakeawayEn:
      "Visitors completing this collection gain a nuanced understanding of how Belgrade served as a neutral diplomatic crossroads during the Cold War. The journey reveals how statecraft, modernist architecture, and urban planning merged to create a unique spatial canvas for twentieth-century global diplomacy.",
    visitorTakeawaySr:
      "Posetioci kroz ovu kolekciju stiču duboko razumevanje Beograda kao neutralnog diplomatskog raskršća tokom Hladnog rata i spoja arhitekture i diplomatije.",
    journeyRationale: {
      "130":
        "Primary institutional archive and modernist administrative complex documenting 20th-century state visits and diplomatic assemblies.",
      "65": "Contemporary evolution of Belgrade's international assembly architecture and global forum tradition.",
      "64": "Monumental state architecture providing panoramic view over Belgrade's geopolitical landscape.",
      "7": "UNESCO-registered global archival legacy illustrating Serbia's international scientific diplomacy.",
    },
    isPublished: true,
  },
  {
    id: "EC-002",
    titleEn: "Serbia and the Non-Aligned Movement",
    titleSr: "Srbija i Pokret nesvrstanih",
    titleZh: "塞尔维亚与不结盟运动",
    subtitleEn:
      "The Heritage of the 1961 Belgrade Summit and Transcontinental Cooperation",
    subtitleSr:
      "Nasleđe Beogradskog samita 1961. godine i transkontinentalne saradnje",
    subtitleZh: "1961年贝尔格莱德峰会遗产与跨洲合作",
    introductionEn: `In September 1961, leaders from twenty-five nations across Asia, Africa, Latin America, and Europe gathered in Belgrade for the First Summit Conference of Non-Aligned Countries. Co-founded by Yugoslavia alongside India, Egypt, Indonesia, and Ghana, the Non-Aligned Movement (NAM) established a third diplomatic pillar during the height of Cold War bipolar tensions, advocating peaceful coexistence, anti-colonial sovereignty, and international solidarity.

Belgrade was transformed to host this historic gathering. Urban infrastructure, civic parks, and state protocol venues were designed and constructed specifically for the summit, leaving a permanent architectural and cultural imprint on the city. The summit established Belgrade as a capital of anti-colonial diplomacy and intercultural exchange, attracting thousands of international students, diplomats, and artists from across the Global South over subsequent decades.

This collection guides visitors through the key sites associated with the founding of NAM. Through state gift collections, commemorative public spaces, and modernist administrative monuments, the journey presents the history of the movement through verifiable cultural heritage and architectural legacy, offering an objective look at one of the twentieth century's most significant international initiatives.`,
    introductionSr: `U septembru 1961. godine, lideri iz dvadeset pet zemalja Azije, Afrike, Latinske Amerike i Evrope okupili su se u Beogradu na Prvoj konferenciji šefova država ili vlada nesvrstanih zemalja. Beograd je postao svetski centar antikolonijalne diplomatije i međukulturne saradnje.`,
    heroImage:
      "/src/assets/images/bitef_theatre_belgrade_modern_1778847369770.webp",
    gallery: [
      "/src/assets/images/silosi_belgrade_industrial_night_1778842947193.webp",
    ],
    category: EditorialCollectionCategory.HISTORY_HERITAGE,
    estimatedDuration: "1 Day",
    visitorProfile: [
      "Global Historians",
      "Modernist Architecture Enthusiasts",
      "Cultural Heritage Travelers",
    ],
    recommendedSeason: ["Spring", "Summer", "Autumn"],
    estimatedBudget: "Moderate",
    geographicScope: "Belgrade (Dedinje, Ušće & New Belgrade)",
    recommendationIds: ["130", "68", "7"],
    recommendedOrder: [1, 2, 3],
    visitorTakeawayEn:
      "After experiencing this collection, visitors will appreciate Belgrade's historical role as the birthplace of the Non-Aligned Movement. The route illuminates how mid-century geopolitical initiatives shaped physical public spaces, diplomatic gift traditions, and cross-cultural institutions that endure in the city today.",
    visitorTakeawaySr:
      "Nakon ove kolekcije, posetioci razumeju istorijsku ulogu Beograda kao mesta rođenja Pokreta nesvrstanih i njegov uticaj na javni prostor i kulturne institucije.",
    journeyRationale: {
      "130":
        "Houses state gift archives, protocol materials, and administrative spaces of the inaugural 1961 Belgrade Summit.",
      "68": "International theatre festival founded in 1967 as a direct cultural extension of Non-Aligned intercultural dialogue.",
      "7": "Global archival center honoring transnational scientific heritage and international exchange.",
    },
    isPublished: true,
  },
  {
    id: "EC-003",
    titleEn: "Serbia of Three Faiths",
    titleSr: "Srbija tri vere",
    titleZh: "三信仰之地的塞尔维亚",
    subtitleEn:
      "A Journey Through Centuries of Orthodox, Islamic, and Jewish Sacred Heritage",
    subtitleSr:
      "Putovanje kroz vekove pravoslavnog, islamskog i jevrejskog svetog nasleđa",
    subtitleZh: "穿越数世纪东正教、伊斯兰教与犹太教圣地遗产之旅",
    introductionEn: `For over two millennia, the Central Balkans have stood as a meeting point of civilizations, languages, and religious traditions. Serbia’s cultural landscape preserves an extraordinary sacred heritage, where Christian Orthodox cathedrals, Islamic mosques, and Jewish synagogues reflect centuries of co-existence, artistic achievement, and communal resilience.

The architectural expressions of these three faiths demonstrate how spiritual life adapted to regional materials, imperial craftsmanship, and international artistic influences. From the monumental Serbo-Byzantine gold mosaics of the Temple of Saint Sava to the 16th-century Ottoman stone masonry of Belgrade’s Bajrakli Mosque, and the vivid Hungarian Secessionist tilework of the Subotica Synagogue, each site represents a masterwork of sacral design.

Beyond individual monuments, this collection illuminates the shared urban fabric of Serbian towns and cities, where minarets, bell towers, and synagogue domes shaped historical skyline vistas. Visiting these sacred spaces provides visitors with a thoughtful perspective on the multicultural tapestry and religious tolerance that have defined the historical character of the region.`,
    introductionSr: `Već više od dvijemilenijuma, Centralni Balkan predstavlja susretište civilizacija i veroispovesti. Sakralno nasleđe Srbije svedoči o vekovnom suživotu pravoslavne, islamske i jevrejske tradicije.`,
    heroImage:
      "/src/assets/images/saint_sava_temple_interior_1778845911761.webp",
    gallery: [
      "/src/assets/images/subotica_palic_lake_villa_1778843996440.webp",
    ],
    category: EditorialCollectionCategory.SPIRITUAL_CULTURE,
    estimatedDuration: "1 - 2 Days",
    visitorProfile: [
      "Spiritual & Cultural Heritage Travelers",
      "Architectural Historians",
      "Interfaith Scholars",
    ],
    recommendedSeason: ["Spring", "Summer", "Autumn", "Winter"],
    estimatedBudget: "Moderate",
    geographicScope: "Belgrade, Subotica & Regional Serbia",
    recommendationIds: ["54", "124", "123", "2"],
    recommendedOrder: [1, 2, 3, 4],
    visitorTakeawayEn:
      "Travelers completing this journey will gain a profound appreciation for Serbia’s rich interfaith heritage. Exploring these sacred landmarks highlights how Orthodox, Islamic, and Jewish communities cultivated distinct yet intertwined artistic and architectural legacies across the Balkans.",
    visitorTakeawaySr:
      "Putnici kroz ovu kolekciju stiču duboko poštovanje prema bogatom međukonfesionalnom nasleđu Srbije i prepletenim umetničkim tradicijama.",
    journeyRationale: {
      "54": "One of the world's largest Orthodox temples, featuring 15,000 square meters of Serbo-Byzantine gold mosaic art.",
      "124":
        "Masterpiece of Art Nouveau sacral architecture, featuring hand-painted Zsolnay ceramic tiles and stained glass.",
      "123":
        "Centuries-old Ottoman sacred architecture including the Altun-Alem mosque and traditional hammam masonry.",
      "2": "Fortified 15th-century Orthodox monastic citadel preserving medieval Resava scriptorium art.",
    },
    isPublished: true,
  },
  {
    id: "EC-004",
    titleEn: "The Roman Emperors’ Serbia",
    titleSr: "Srbija rimskih imperatora",
    titleZh: "罗马皇帝的塞尔维亚",
    subtitleEn:
      "Imperial Palaces, Castra, and Mosaics Across the Birthland of Eighteen Roman Rulers",
    subtitleSr:
      "Carski dvorci, kastrumi i mozaici u zavičaju osamnaest rimskih imperatora",
    subtitleZh: "十八位罗马皇帝诞生地的帝王宫殿、军营与马赛克艺术",
    introductionEn: `During the Late Roman Empire, the territory of modern Serbia was one of the most critical geopolitical zones of the Mediterranean world. Situated along the strategic Danube Limes frontier and the Via Militaris connecting Rome to Constantinople, this region gave birth to eighteen Roman emperors—nearly a fifth of all Roman rulers—including Constantine the Great, Galerius, Decius, and Justinian I.

The imperial legacy of the region is preserved in extraordinary archaeological parks, fortified palace complexes, and civic centers. Imperial capitals such as Sirmium served as administrative hubs during the Tetrarchy, boasting imperial palaces, hippodromes, and mints. At Viminacium, military legions garrisoned the northern frontier, leaving behind intact amphitheaters, thermal baths, and painted mausoleums.

Further east, the UNESCO World Heritage site of Felix Romuliana showcases the fortified retirement palace of Emperor Galerius, decorated with pristine floor mosaics of Dionysus and Hercules. In the south, Mediana presents the luxurious villa suburbana of Constantine the Great. This collection offers an unparalleled journey through late antique statecraft, military engineering, and imperial art.`,
    introductionSr: `Tokom poznorimskog carstva, teritorija današnje Srbije bila je jedno od najvažnijih geopolitičkih područja u kom je rođeno 18 rimskih imperatora, uključujući Konstantina Velikog i Galerija.`,
    heroImage: "/src/assets/images/felix_romuliana_ruins_1778841314415.webp",
    gallery: [
      "/src/assets/images/viminacium_archaeology_1778841330074.webp",
      "/src/assets/images/mediana_roman_villa_1778845820866.webp",
    ],
    category: EditorialCollectionCategory.HISTORY_HERITAGE,
    estimatedDuration: "2 - 3 Days",
    visitorProfile: [
      "Classical Archaeology Enthusiasts",
      "Roman Imperial Historians",
      "Cultural Explorers",
    ],
    recommendedSeason: ["Spring", "Summer", "Autumn"],
    estimatedBudget: "Moderate",
    geographicScope:
      "Sirmium (Sremska Mitrovica), Viminacium, Mediana (Niš), Felix Romuliana (Zaječar)",
    recommendationIds: ["17", "16", "49", "45"],
    recommendedOrder: [1, 2, 3, 4],
    visitorTakeawayEn:
      "Completing this imperial route reveals Serbia's vital role in shaping the Late Roman Empire. Visitors discover how Illyrian-born emperors transformed military frontiers into grand architectural hubs of power, law, and artistic patronage.",
    visitorTakeawaySr:
      "Ova carska ruta otkriva ključnu ulogu Srbije u oblikovanju Poznog rimskog carstva i transformaciji vojnih granica u centre moći i umetnosti.",
    journeyRationale: {
      "17": "Capital of Moesia Superior with preserved legionary castrum, amphitheater, Roman therms, and painted burial vaults.",
      "16": "UNESCO-listed imperial palace complex of Emperor Galerius featuring monumental fortification towers and world-class floor mosaics.",
      "49": "Suburban imperial estate of Constantine the Great in ancient Naissus, featuring over 1,000 square meters of floor mosaics.",
      "45": "Ottoman ramparts standing upon ancient Roman Naissus foundations in the birthplace of Constantine the Great.",
    },
    isPublished: true,
  },
  {
    id: "EC-005",
    titleEn: "Hidden Belgrade",
    titleSr: "Skriveni Beograd",
    titleZh: "隐藏的贝尔格莱德",
    subtitleEn:
      "Secret Passages, Atmospheric Quarters, and the Everyday Soul of the Capital",
    subtitleSr:
      "Tajni prolazi, atmosferske četvrti i svakodnevna duša prestonice",
    subtitleZh: "首都的地下通道、惬意街区与日常灵魂",
    introductionEn: `Beyond its grand boulevards and famous fortress, Belgrade conceals a rich tapestry of intimate quarters, subterranean passages, and artistic enclaves. Shaped by centuries of destruction and reconstruction, the city's urban identity is defined by layered history, where Central European elegance, Ottoman street patterns, and modernist subcultures exist side by side.

Wandering through cobblestone neighborhoods like Kosančićev Venac reveals quiet residential courtyards, historic printworks, and panoramic river overlooks. Across the Sava in Zemun, Gardoš Hill offers narrow winding alleys, Habsburg-era baroque facades, and riverside fish taverns that maintain a distinct maritime charm. In Lower Dorćol, former industrial warehouses have been revitalized into design studios, artisan bakeries, and contemporary art spaces.

Below the pavement lies Underground Belgrade—a subterranean labyrinth of Roman gunpowder stores, Austrian military tunnels, and Cold War bunkers carved into the limestone bedrock. This collection invites travelers to slow down, explore hidden passageways, and experience the authentic, everyday rhythm of one of Europe’s most resilient cities.`,
    introductionSr: `Izvan glavnih bulevara i čuvene tvrđave, Beograd krije intiman svet tihih prolaza, istorijskih četvrti i umetničkih oaza nastalih na slojevima prošlosti.`,
    heroImage: "/src/assets/images/zemun_danube_kafana_1778846414640.webp",
    gallery: [
      "/src/assets/images/silosi_belgrade_industrial_night_1778842947193.webp",
    ],
    category: EditorialCollectionCategory.URBAN_MODERN,
    estimatedDuration: "1 - 2 Days",
    visitorProfile: [
      "Urban Explorers",
      "Flâneurs",
      "Architectural & Local Culture Lovers",
    ],
    recommendedSeason: ["Spring", "Summer", "Autumn", "Winter"],
    estimatedBudget: "Moderate",
    geographicScope:
      "Belgrade (Zemun, Kosančićev Venac, Dorćol, Savamala, Tašmajdan)",
    recommendationIds: ["51", "58", "23", "10"],
    recommendedOrder: [1, 2, 3, 4],
    visitorTakeawayEn:
      "Visitors completing Hidden Belgrade gain an authentic connection to the capital’s inner character. Moving beyond tourist landmarks, the experience reveals how hidden courtyards, subterranean spaces, and neighborhood traditions sustain the living spirit of Belgrade.",
    visitorTakeawaySr:
      "Posetioci kroz Skriveni Beograd ostvaruju autentičnu vezu sa duhom grada, otkrivajući dvorišta, podzemne prolaze i živopisne komšijske tradicije.",
    journeyRationale: {
      "51": "Belgrade’s oldest preserved urban quarter with cobblestone alleys, historic ateliers, and quiet river viewpoints.",
      "58": "Habsburg-era cobbled alleys of Gardoš Hill leading to traditional riverside fish taverns along the Danube.",
      "23": "Repurposed industrial Danube grain silos transformed into an open-air public art and community space.",
      "10": "Intimate artisanal tasting venue preserving authentic Serbian spirit heritage and local hospitality culture.",
    },
    isPublished: true,
  },
];
