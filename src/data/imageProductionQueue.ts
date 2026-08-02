/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImageQueueItem {
  id: string;
  place: string;
  visualSubject: string;
  factualCharacteristics: string;
  recommendedViewpoint: string;
  seasonAndTime: string;
  people: boolean;
  peopleDescription: string;
  mustNotInvent: string;
  proposedFilename: string;
  targetPath: string;
}

export const imageProductionQueue: ImageQueueItem[] = [
  {
    id: "1030",
    place: "Zagajička Hills",
    visualSubject:
      "Roll-like green sand dunes blanketed with dense steppe grass.",
    factualCharacteristics:
      "Unique semi-arid relic dunes forming symmetrical geometric waves, remnants of the ancient Pannonian Sea bed.",
    recommendedViewpoint:
      "Wide-angle aerial or elevated ridge-line viewpoint emphasizing the rhythmic undulating contours stretching to the horizon.",
    seasonAndTime:
      "Late spring at golden hour (around sunset) to cast deep dramatic shadows in the grass valleys.",
    people: false,
    peopleDescription:
      "No people to maintain the atmosphere of absolute geological isolation.",
    mustNotInvent:
      "Do not add fantasy alpine forests, excessive jagged rock formations, or non-native flower beds.",
    proposedFilename: "zagajicka_hills_sunset_dunes.jpg",
    targetPath: "/assets/images/curations/zagajicka_hills_sunset_dunes.jpg",
  },
  {
    id: "1031",
    place: "Carska Bara",
    visualSubject:
      "Dense wetland channels bordered by reedbeds, white water lilies, and ancient willow clusters.",
    factualCharacteristics:
      "Serene swamp waters with rich duckweed carpet, gray herons or white egrets nested on branches.",
    recommendedViewpoint:
      "Low-angle eye-level perspective from a wooden rowing boat looking down a narrow aquatic lane.",
    seasonAndTime:
      "Early morning in mid-summer with light mist rising off the quiet waters.",
    people: true,
    peopleDescription:
      "A single local fisherman or conservationist in a wooden boat, blurred in the background.",
    mustNotInvent:
      "Do not add tropical bird species, manicured dock facilities, or modern speedboats.",
    proposedFilename: "carska_bara_misty_wetlands.jpg",
    targetPath: "/assets/images/curations/carska_bara_misty_wetlands.jpg",
  },
  {
    id: "1032",
    place: "Obedska Bara",
    visualSubject:
      "Oxbow lake wetland forest showing swamp oaks and floating vegetation islands.",
    factualCharacteristics:
      "Ancient horseshoe-shaped river bed, reflective dark still waters, nesting birds in flooded woodlands.",
    recommendedViewpoint:
      "Symmetrical lakeside view showing the perfect reflections of centuries-old oak branches.",
    seasonAndTime: "Mid-spring at sunrise, vibrant soft greens in the foliage.",
    people: false,
    peopleDescription: "No people to emphasize the bird sanctuary nature.",
    mustNotInvent:
      "Do not add dramatic mountains (the area is perfectly flat), artificial brick pathways, or fake swan shapes.",
    proposedFilename: "obedska_bara_oxbow_lake.jpg",
    targetPath: "/assets/images/curations/obedska_bara_oxbow_lake.jpg",
  },
  {
    id: "1033",
    place: "Maglič Fortress",
    visualSubject:
      "Medieval stone fort with eight defense towers built on a steep crag overlooking the Ibar River loop.",
    factualCharacteristics:
      "Cracked gray limestone battlements, wooden interior walks, dramatic looping river bend below, deep green valley cliffs.",
    recommendedViewpoint:
      "Distant elevated mountain trail view showing the entire fortress dominating the crest of the Ibar Gorge.",
    seasonAndTime:
      "Autumn in the afternoon, with gold and copper-colored forests covering the surrounding mountain peaks.",
    people: false,
    peopleDescription:
      "No people to preserve the ruins' deep historical dignity.",
    mustNotInvent:
      "Do not invent fantasy flags, intact tile roofs that do not exist, or simulated siege weapons.",
    proposedFilename: "maglic_fortress_autumn_gorge.jpg",
    targetPath: "/assets/images/curations/maglic_fortress_autumn_gorge.jpg",
  },
  {
    id: "1034",
    place: "Rača Monastery manuscript trail",
    visualSubject:
      "Limestone river bed leading past old stone monastic ruins toward a pristine mountain spring.",
    factualCharacteristics:
      "The rushing turquoise Rača river, deep beech forest, centuries-old mossy stone foundations, the Ladjevac thermal spring.",
    recommendedViewpoint:
      "Eye-level trail-view alongside the river, focusing on the moss-covered rocks and the green thermal waterfall.",
    seasonAndTime:
      "Late spring in the morning, soft light filtering through dense tree canopy.",
    people: true,
    peopleDescription:
      "A solitary hiker in premium, quiet gear shown from behind, distant on the path.",
    mustNotInvent: "Do not invent fantasy stone arches or artificial shrines.",
    proposedFilename: "raca_monastery_trail_ladjevac.jpg",
    targetPath: "/assets/images/curations/raca_monastery_trail_ladjevac.jpg",
  },
  {
    id: "1035",
    place: "Eastern Serbia Discovery region",
    visualSubject:
      "Dramatic limestone gorges, limestone caves, and ancient vineyards of Eastern Serbia.",
    factualCharacteristics:
      "Rugged karst peaks, winding mountain passes, traditional stone structures.",
    recommendedViewpoint:
      "Composite panorama showing a winding mountain road hugging a vertical cliff face.",
    seasonAndTime: "Late summer at golden hour.",
    people: false,
    peopleDescription: "No people to focus on the grand geographical scale.",
    mustNotInvent:
      "Do not invent modern high-rise wind turbines or wide paved multi-lane freeways.",
    proposedFilename: "eastern_serbia_discovery_karst.jpg",
    targetPath: "/assets/images/curations/eastern_serbia_discovery_karst.jpg",
  },
  {
    id: "1036",
    place: "Bač Fortress",
    visualSubject:
      "Red-brick medieval keep tower and defense walls surrounded by a grassy moat field.",
    factualCharacteristics:
      "Iconic five-story octagonal stone-and-brick Donjon tower, flat plains background, marshy canal traces.",
    recommendedViewpoint:
      "Low-angle viewpoint from the grassy floor of the ancient dry moat, looking up at the monumental red-brick ruins.",
    seasonAndTime:
      "Summer sunset, warm orange light illuminating the red brick masonry.",
    people: false,
    peopleDescription: "No people to let the historical brickwork stand alone.",
    mustNotInvent:
      "Do not add medieval knights, modern tourists with selfie sticks, or high-rise power lines.",
    proposedFilename: "bac_fortress_brick_keep.jpg",
    targetPath: "/assets/images/curations/bac_fortress_brick_keep.jpg",
  },
  {
    id: "1037",
    place: "Fetislam Fortress",
    visualSubject:
      "Stone bastions and defensive entry gates resting on the banks of the Danube River opposite Romania.",
    factualCharacteristics:
      "16th-century Ottoman fort architecture, massive stone arches with limestone inscriptions, wide river backdrop.",
    recommendedViewpoint:
      "Through the main stone gateway looking out toward the vast blue expanse of the Danube River.",
    seasonAndTime: "Late afternoon in summer, calm blue waters.",
    people: true,
    peopleDescription:
      "Local children playing near the stone steps in soft focus.",
    mustNotInvent:
      "Do not invent modern container ships, industrial harbor cranes, or non-existent bridges.",
    proposedFilename: "fetislam_fortress_danube_gate.jpg",
    targetPath: "/assets/images/curations/fetislam_fortress_danube_gate.jpg",
  },
  {
    id: "1038",
    place: "Smederevo Fortress",
    visualSubject:
      "Colossal defense walls and water towers at the confluence of the Jezava and Danube rivers.",
    factualCharacteristics:
      "25 massive stone towers, Byzantine brick inscriptions on the main keep, flat water expanses.",
    recommendedViewpoint:
      "Wide shot from the opposite river bank showing the endless stone defensive towers mirroring in the water.",
    seasonAndTime:
      "Twilight, deep blue hour with minimal accent lighting on the stone walls.",
    people: false,
    peopleDescription:
      "No people to match the monumental scale of the fortress.",
    mustNotInvent:
      "Do not add fake laser lights, cruise ships, or restored modern windows.",
    proposedFilename: "smederevo_fortress_water_towers.jpg",
    targetPath: "/assets/images/curations/smederevo_fortress_water_towers.jpg",
  },
  {
    id: "1039",
    place: "The Valley of the Kings",
    visualSubject:
      "The Raška river valley containing white-marbled Studenica Monastery.",
    factualCharacteristics:
      "12th-century Romanesque white marble church, red-tiled Byzantine domes, surrounding green mountain ridges.",
    recommendedViewpoint:
      "View from the surrounding monastery wall showing the pristine white marble chapel framed by dark green pine forests.",
    seasonAndTime: "Mid-spring at noon under clean, bright, natural light.",
    people: true,
    peopleDescription:
      "A black-robed Serbian Orthodox monk quietly walking across the manicured stone courtyard.",
    mustNotInvent:
      "Do not invent neon signs, cars parked in the courtyard, or non-native palm trees.",
    proposedFilename: "valley_of_the_kings_studenica.jpg",
    targetPath: "/assets/images/curations/valley_of_the_kings_studenica.jpg",
  },
  {
    id: "1040",
    place: "Old Ras + St Peter’s Church",
    visualSubject:
      "Circular stone church, the oldest intact church in Serbia, standing on a hill surrounded by archaeological graves.",
    factualCharacteristics:
      "Rough irregular stone masonry walls, low wooden shingle roof, ancient tombstones scattered in grass.",
    recommendedViewpoint:
      "A medium shot focusing on the circular pre-Romanesque architecture and the ancient stone cross markers in the grass.",
    seasonAndTime:
      "Late autumn afternoon, dried golden-brown grass and moody overcast skies.",
    people: false,
    peopleDescription: "No people to preserve the sacred ancient tranquility.",
    mustNotInvent:
      "Do not paint the exterior with white plaster, nor add contemporary metal fences.",
    proposedFilename: "st_peters_church_old_ras.jpg",
    targetPath: "/assets/images/curations/st_peters_church_old_ras.jpg",
  },
  {
    id: "1041",
    place: "Novi Pazar",
    visualSubject:
      "Old bazaar street featuring low Ottoman-style wooden shopfronts and towering stone minarets.",
    factualCharacteristics:
      "Cobbled streets, traditional tile roofs, Altun-alem Mosque, active street trade, authentic coffee cups.",
    recommendedViewpoint:
      "Street-level view down a cobbled lane in the Stari Bazar, leading the eye toward a stone minaret.",
    seasonAndTime:
      "Late afternoon in spring, warm street light with active local commerce.",
    people: true,
    peopleDescription:
      "Local elders in traditional attire sitting outside a small coffee house drinking Turkish coffee.",
    mustNotInvent:
      "Do not add modern franchise fast food signs, massive neon advertisements, or glass skyscrapers.",
    proposedFilename: "novi_pazar_ottoman_bazaar.jpg",
    targetPath: "/assets/images/curations/novi_pazar_ottoman_bazaar.jpg",
  },
  {
    id: "1042",
    place: "Subotica",
    visualSubject:
      "The vibrant ceramic facade of the Subotica Synagogue and City Hall.",
    factualCharacteristics:
      "Colorful Zsolnay ceramic tiles in deep emerald, orange, and red, intricate Art Nouveau wood carvings, Hungarian secessionist curves.",
    recommendedViewpoint:
      "Detailed architectural shot focusing on the curving ceramic gables and colorful stained-glass windows.",
    seasonAndTime:
      "Sunny autumn afternoon, warm natural light making the glazed roof tiles shine.",
    people: true,
    peopleDescription:
      "A stylish couple walking by in premium minimalist clothing, in soft focus.",
    mustNotInvent:
      "Do not invent modern commercial billboards, yellow cabs, or skyscrapers in the background.",
    proposedFilename: "subotica_art_nouveau_synagogue.jpg",
    targetPath: "/assets/images/curations/subotica_art_nouveau_synagogue.jpg",
  },
  {
    id: "1043",
    place: "Oplenac Royal Complex",
    visualSubject:
      "The five-domed white marble St. George Church standing in a quiet pine park.",
    factualCharacteristics:
      "White polished marble exterior, bronze doors, surrounding pine needles on grassy park floor, royal crests.",
    recommendedViewpoint:
      "A symmetrical view of the grand facade framed by tall green pine trees.",
    seasonAndTime:
      "Winter morning with a light, clean dusting of white snow on the domes and pine branches.",
    people: false,
    peopleDescription:
      "No people to evoke the quiet sanctuary of the royal mausoleum.",
    mustNotInvent:
      "Do not paint the marble with patterns, nor add modern flag poles or parking lots in the frame.",
    proposedFilename: "oplenac_royal_marble_church.jpg",
    targetPath: "/assets/images/curations/oplenac_royal_marble_church.jpg",
  },
  {
    id: "1044",
    place: "Niš (Fortress + Skull Tower)",
    visualSubject:
      "The heavy stone defensive portal of Niš Fortress, leading to a sprawling interior park.",
    factualCharacteristics:
      "18th-century Ottoman stone gateway with arched details, surrounding stone battlements, cobbled passage.",
    recommendedViewpoint:
      "Low-angle perspective looking through the monumental stone Stambol Gate of the fortress.",
    seasonAndTime:
      "Summer night with elegant, warm, low-key lighting highlighting the stone masonry.",
    people: true,
    peopleDescription:
      "Locals walking through the gate under the evening lights.",
    mustNotInvent:
      "Do not add non-historical modern glass doors or colorful lasers.",
    proposedFilename: "nis_fortress_stambol_gate.jpg",
    targetPath: "/assets/images/curations/nis_fortress_stambol_gate.jpg",
  },
  {
    id: "1045",
    place: "Viminacium & Roman Frontier",
    visualSubject:
      "The archeological excavations of a Roman amphitheater and domed tombs.",
    factualCharacteristics:
      "Ancient brick foundations, stone arches, underground tomb structures with fading frescoes.",
    recommendedViewpoint:
      "Symmetrical perspective inside the excavated wooden dome protective canopy showing the Roman brickwork.",
    seasonAndTime:
      "Spring afternoon under diffused overcast sky, soft natural shadows.",
    people: false,
    peopleDescription: "No people to reflect the archaeological stillness.",
    mustNotInvent:
      "Do not add fake gladiators, modern metal storage sheds, or generic concrete walls.",
    proposedFilename: "viminacium_roman_excavations.jpg",
    targetPath: "/assets/images/curations/viminacium_roman_excavations.jpg",
  },
  {
    id: "1046",
    place: "Fruška Gora Monasteries",
    visualSubject:
      "The quiet brick-and-stone facade of Krušedol Monastery with its painted gateway.",
    factualCharacteristics:
      "Red-and-yellow brick accents, ornate Byzantine fresco gateway, surrounding walnut groves, manicured lawn.",
    recommendedViewpoint:
      "Direct frontal view of the colorful arched entryway of Krušedol Monastery.",
    seasonAndTime: "Mid-autumn when the walnut trees are golden-yellow.",
    people: false,
    peopleDescription:
      "No people to represent the quiet spiritual monastic atmosphere.",
    mustNotInvent:
      "Do not add tour buses, commercial kiosks, or paved asphalt roads.",
    proposedFilename: "fruska_gora_krusedol_monastery.jpg",
    targetPath: "/assets/images/curations/fruska_gora_krusedol_monastery.jpg",
  },
  {
    id: "1047",
    place: "Serbia Before the Crowds",
    visualSubject:
      "A quiet country path through a rolling plum orchid in rural Šumadija.",
    factualCharacteristics:
      "Dirt cart track, wild grass borders, ripe purple plums on green branches, distant green hills.",
    recommendedViewpoint:
      "Low-angle path-view looking down between neat rows of traditional orchards.",
    seasonAndTime:
      "Late summer at harvest time, late afternoon sun reflecting on the ripe fruit.",
    people: true,
    peopleDescription:
      "An old farmer wearing a traditional šajkača cap, in soft focus, carrying a wooden fruit crate.",
    mustNotInvent:
      "Do not add modern concrete warehouses, heavy tractors, or commercial labels on fruit.",
    proposedFilename: "rural_sumadija_plum_orchards.jpg",
    targetPath: "/assets/images/curations/rural_sumadija_plum_orchards.jpg",
  },
  {
    id: "1048",
    place: "Yugoslav Belgrade Architecture",
    visualSubject:
      "The monumental concrete forms of the Genex Tower or the Palace of Serbia.",
    factualCharacteristics:
      "Raw board-marked grey concrete (brutalist architecture), bold geometric curves, wide open plaza, modernist lines.",
    recommendedViewpoint:
      "Low-angle heroic viewpoint looking up at the iconic brutalist tower against a clean blue sky.",
    seasonAndTime:
      "Sunny winter afternoon with sharp, contrasting shadows on the concrete surface.",
    people: false,
    peopleDescription:
      "No people to emphasize the massive monumentality of the architecture.",
    mustNotInvent:
      "Do not add modern glass expansions, commercial colorful neon logos, or digital screens.",
    proposedFilename: "belgrade_brutalist_genex_tower.jpg",
    targetPath: "/assets/images/curations/belgrade_brutalist_genex_tower.jpg",
  },
  {
    id: "1049",
    place: "Kragujevac Industrial Heritage",
    visualSubject:
      "19th-century red-brick industrial cannon foundry architecture in the Knežev Arsenal.",
    factualCharacteristics:
      "Weathered red-brick facades, old metal window frames, overgrown cobblestones, chimneys.",
    recommendedViewpoint:
      "A dramatic perspective along the red-brick facade of the Arsenal buildings.",
    seasonAndTime:
      "Late autumn on a rainy, wet afternoon with glossy cobblestone reflections.",
    people: false,
    peopleDescription: "No people to emphasize the silent industrial relic.",
    mustNotInvent:
      "Do not invent modern shiny steel structures, cars parked in the alley, or colorful graffiti.",
    proposedFilename: "kragujevac_knezev_arsenal.jpg",
    targetPath: "/assets/images/curations/kragujevac_knezev_arsenal.jpg",
  },
  {
    id: "1050",
    place: "Rajačke Pimnice",
    visualSubject:
      "A street of unique stone-built wine cellars (pimnice) dating back to the 18th century.",
    factualCharacteristics:
      "Rough-hewn limestone walls, heavy arched wooden doors, red-tiled roofs, grassy earthen streets, old wooden barrels.",
    recommendedViewpoint:
      "Street-level shot winding through the stone wine cellars at dusk, looking toward a cellar with an open wooden door.",
    seasonAndTime:
      "Late autumn at dusk, warm candlelight glowing from inside a stone cellar doorway.",
    people: true,
    peopleDescription:
      "A winemaker carrying a traditional glass carafe, silhouetted in the doorway.",
    mustNotInvent:
      "Do not add modern concrete buildings, modern asphalt roads, or plastic tables and chairs.",
    proposedFilename: "rajacke_pimnice_stone_cellars.jpg",
    targetPath: "/assets/images/curations/rajacke_pimnice_stone_cellars.jpg",
  },
  {
    id: "1051",
    place: "Rogljevo Pimnice",
    visualSubject:
      "Rustic stone-and-timber wine houses grouped in a rural settlement near Negotin.",
    factualCharacteristics:
      "Mossy grey limestone structures, dark aged oak beams, old hand-operated grape presses resting in yards.",
    recommendedViewpoint:
      "A medium shot focusing on three classic 19th-century limestone cellars with arched gates.",
    seasonAndTime: "Late summer afternoon, dry warm grass, deep golden light.",
    people: false,
    peopleDescription:
      "No people to capture the silent museum-like historical preservation.",
    mustNotInvent:
      "Do not paint the ancient wood, nor add metal garage doors or modern plastic barrels.",
    proposedFilename: "rogljevo_pimnice_rustic_limestone.jpg",
    targetPath:
      "/assets/images/curations/rogljevo_pimnice_rustic_limestone.jpg",
  },
  {
    id: "1052",
    place: "Bukovo Monastery Winery",
    visualSubject:
      "The monastic vineyard rows wrapping around the stone Bukovo Monastery complex.",
    factualCharacteristics:
      "Impeccably terraced hills of vines, old stone monastery tower, dark wood wine cellars, native grapes (Crna Tamjanika).",
    recommendedViewpoint:
      "Elevated shot looking across the lush green vineyard rows toward the stone monastery spire.",
    seasonAndTime: "Early autumn during grape harvest, warm morning light.",
    people: false,
    peopleDescription:
      "No people, focusing on the calm connection of church and earth.",
    mustNotInvent:
      "Do not add industrial stainless steel tanks (keep those inside) or modern agricultural heavy vehicles.",
    proposedFilename: "bukovo_monastery_vineyard.jpg",
    targetPath: "/assets/images/curations/bukovo_monastery_vineyard.jpg",
  },
  {
    id: "1053",
    place: "Sremski Karlovci Bermet",
    visualSubject:
      "The baroque architecture of Sremski Karlovci centering the Four Lions Fountain.",
    factualCharacteristics:
      "Elegant pastel-colored Austrian-Baroque facades, copper-domed church towers, red wine tastings, ornamental fountain.",
    recommendedViewpoint:
      "A classic street view showing the elegant baroque town houses leading toward the Gymnasium.",
    seasonAndTime: "Late spring afternoon, bright skies, blooming flower beds.",
    people: true,
    peopleDescription:
      "Karlovci locals reading on a public bench in soft focus.",
    mustNotInvent:
      "Do not add cars blocking the historic square or overhead trolley bus wires.",
    proposedFilename: "sremski_karlovci_baroque_center.jpg",
    targetPath: "/assets/images/curations/sremski_karlovci_baroque_center.jpg",
  },
  {
    id: "1054",
    place: "Fruška Gora Small Producers",
    visualSubject:
      "An intimate, boutique family-run wine tasting room under old cellar brick arches.",
    factualCharacteristics:
      "Raw exposed brickwork, long solid oak table, sparkling crystal glasses filled with pale gold wine, green bottle storage.",
    recommendedViewpoint:
      "Symmetrical perspective down the center of the wooden tasting table towards the dark brick bottle racks.",
    seasonAndTime: "Winter evening, cozy candlelit room.",
    people: true,
    peopleDescription:
      "A single local family winemaker pouring wine into a glass.",
    mustNotInvent:
      "Do not add neon bar signs, modern aluminum bar stools, or generic white drywall.",
    proposedFilename: "fruska_gora_boutique_cellar.jpg",
    targetPath: "/assets/images/curations/fruska_gora_boutique_cellar.jpg",
  },
  {
    id: "1055",
    place: "Župa Wine Country",
    visualSubject:
      "The rolling green hills of Župa Valley blanketed with vineyards.",
    factualCharacteristics:
      "Dense low-trained vine rows following the contours of the clay hills, local plum orchards, small stone village homes.",
    recommendedViewpoint:
      "Elevated landscape view showing the patchworks of vineyards wrapping around the curves of the Župa hills.",
    seasonAndTime: "Early summer, vibrant deep emerald-green foliage.",
    people: false,
    peopleDescription:
      "No people, celebrating the serene agricultural landscape.",
    mustNotInvent:
      "Do not add massive concrete highways or modern industrial processing plants.",
    proposedFilename: "zupa_wine_valley_vineyards.jpg",
    targetPath: "/assets/images/curations/zupa_wine_valley_vineyards.jpg",
  },
  {
    id: "1056",
    place: "Toplica Wine Journey",
    visualSubject:
      "Terraced vineyards on rocky soil producing indigenous Prokupac grapes.",
    factualCharacteristics:
      "Dry slate-like soil, low-bush vines, panoramic views of the Toplica river basin.",
    recommendedViewpoint:
      "Close-up of a grape vine bunch hanging in front of a sweeping view of dry rolling hills.",
    seasonAndTime: "Autumn grape harvest, late afternoon dry light.",
    people: false,
    peopleDescription: "No people, focusing on the native grapes.",
    mustNotInvent:
      "Do not add green lawns or lush artificial irrigation systems (the area is naturally dry and stony).",
    proposedFilename: "toplica_prokupac_stony_vineyards.jpg",
    targetPath: "/assets/images/curations/toplica_prokupac_stony_vineyards.jpg",
  },
  {
    id: "1057",
    place: "Donja Lokošnica Red Pepper Village",
    visualSubject:
      "Traditional brick houses with entire walls completely covered in hanging strings of drying red peppers.",
    factualCharacteristics:
      "Vibrant scarlet dried peppers, old wooden porches, white plaster walls, strings of garlic hanging.",
    recommendedViewpoint:
      "A detailed shot focusing on the incredible density of thousands of red peppers drying on a single white house facade.",
    seasonAndTime:
      "Autumn (September/October), when the pepper drying is at its absolute peak.",
    people: true,
    peopleDescription:
      "An elderly village woman sitting on her porch tying peppers into strings, shown in soft focus.",
    mustNotInvent:
      "Do not add contemporary plastic siding, modern metal garages, or artificial plastic peppers.",
    proposedFilename: "donja_lokosnica_red_peppers.jpg",
    targetPath: "/assets/images/curations/donja_lokosnica_red_peppers.jpg",
  },
  {
    id: "1058",
    place: "Pirot Craft & Food",
    visualSubject:
      "A local master craftsman sitting at a wooden loom weaving a geometric red Pirot rug (ćilim).",
    factualCharacteristics:
      "Intricate geometric wool patterns, dominant scarlet and black dyes, traditional hand-crafted wooden loom.",
    recommendedViewpoint:
      "Over-the-shoulder view of the weaver's hands precisely feeding the red woolen threads into the complex loom pattern.",
    seasonAndTime:
      "Winter afternoon, natural light entering through a wooden workshop window.",
    people: true,
    peopleDescription:
      "An experienced local weaver with focused, wrinkled hands.",
    mustNotInvent:
      "Do not use modern synthetic sewing machines or non-traditional computerized patterns.",
    proposedFilename: "pirot_kilim_weaving_loom.jpg",
    targetPath: "/assets/images/curations/pirot_kilim_weaving_loom.jpg",
  },
  {
    id: "1059",
    place: "Pešter Plateau Breakfast",
    visualSubject:
      "A rustic wooden highland dairy hut with fresh Sjenica cheese, sour cream, and homemade flatbread on a thick table.",
    factualCharacteristics:
      "Round wooden cheese barrels, steaming hot local pita, hand-carved wooden bowls, background view of wide grassy plateau.",
    recommendedViewpoint:
      "Top-down rustic food flatlay on a heavily textured wooden outdoor table, with the rolling Pešter plains in the background.",
    seasonAndTime: "Summer morning, crisp bright high-altitude light.",
    people: false,
    peopleDescription:
      "No people, focusing purely on the authentic culinary spread.",
    mustNotInvent:
      "Do not use modern porcelain dinnerware, processed plastic cheese wraps, or stainless steel modern cutlery.",
    proposedFilename: "pester_plateau_sjenica_breakfast.jpg",
    targetPath: "/assets/images/curations/pester_plateau_sjenica_breakfast.jpg",
  },
  {
    id: "1060",
    place: "Zlakusa Pottery",
    visualSubject:
      "Clay baking pots (sač) drying outside a traditional pottery workshop.",
    factualCharacteristics:
      "Grey-brown clay pottery, hand-turned, wood-fired kilns, rustic firewood stacks.",
    recommendedViewpoint:
      "Ground-level shot of multiple unglazed clay pots lined up on a wooden bench outside a rural stone house.",
    seasonAndTime: "Spring morning, soft diffuse shadows.",
    people: true,
    peopleDescription:
      "A potter in mud-covered apron shaping clay on a kick-wheel in the background, in soft focus.",
    mustNotInvent:
      "Do not show computerized electric pottery wheels or modern glazed porcelain shapes.",
    proposedFilename: "zlakusa_clay_pottery_sacs.jpg",
    targetPath: "/assets/images/curations/zlakusa_clay_pottery_sacs.jpg",
  },
  {
    id: "1061",
    place: "A Serbian Table Worth the Journey",
    visualSubject:
      "Curation of premium slow-roasted local meat, slow-simmered stews, and hand-rolled pastries.",
    factualCharacteristics: "Traditional table setup, local ingredients.",
    recommendedViewpoint:
      "Close-up of a slow-cooked dish in a clay pot, steaming.",
    seasonAndTime: "All seasons, indoor dining atmosphere.",
    people: false,
    peopleDescription: "No people.",
    mustNotInvent: "Do not invent modern fast-food items.",
    proposedFilename: "serbian_table_slow_food.jpg",
    targetPath: "/assets/images/curations/serbian_table_slow_food.jpg",
  },
  {
    id: "1062",
    place: "From Market to Table",
    visualSubject:
      "Belgrade’s Kalenić market stalls showing vibrant fresh vegetables and wild forest mushrooms.",
    factualCharacteristics:
      "Wooden market stalls, stacks of colorful peppers, wild chanterelles, local honey jars.",
    recommendedViewpoint:
      "Close-up of fresh green and red peppers stacked neatly under a wooden market stall awning.",
    seasonAndTime: "Autumn morning, lively market atmosphere.",
    people: true,
    peopleDescription: "Local vendor talking to a customer.",
    mustNotInvent: "Do not invent massive retail supermarket chains.",
    proposedFilename: "kalenic_market_fresh_stalls.jpg",
    targetPath: "/assets/images/curations/kalenic_market_fresh_stalls.jpg",
  },
  {
    id: "1063",
    place: "Belgrade Through an Architect’s Eyes",
    visualSubject:
      "The architectural facade of the Geozavod building in Belgrade Waterfront.",
    factualCharacteristics:
      "Intricate Baroque and Art Nouveau stone carvings, grand domes, high arched windows.",
    recommendedViewpoint:
      "Architectural corner view of the Geozavod facade, showing its majestic stone details.",
    seasonAndTime: "Sunny spring morning, clean crisp light.",
    people: false,
    peopleDescription: "No people.",
    mustNotInvent:
      "Do not invent contemporary glass facades on this historic building.",
    proposedFilename: "geozavod_belgrade_architecture.jpg",
    targetPath: "/assets/images/curations/geozavod_belgrade_architecture.jpg",
  },
  {
    id: "1064",
    place: "The Creative Workshops of Belgrade",
    visualSubject:
      "An active pottery or weaving creative studio in Belgrade's old town.",
    factualCharacteristics:
      "Exposed brick walls, tools hanging on pegboards, finished craft objects.",
    recommendedViewpoint:
      "Detail shot of a workstation with hands shaping a clay vessel on a wheel.",
    seasonAndTime: "All seasons.",
    people: true,
    peopleDescription: "An artist working diligently.",
    mustNotInvent: "Do not invent mass-manufacturing conveyor belts.",
    proposedFilename: "belgrade_creative_workshop.jpg",
    targetPath: "/assets/images/curations/belgrade_creative_workshop.jpg",
  },
  {
    id: "1065",
    place: "Subotica After Dark",
    visualSubject:
      "The beautifully illuminated Town Hall building of Subotica.",
    factualCharacteristics:
      "Deep red brickwork and green ceramic tiles lit up elegantly by warm yellow floodlights.",
    recommendedViewpoint:
      "Symmetrical wide view of the tower lit up against a deep indigo twilight sky.",
    seasonAndTime: "Summer evening, twilight hours.",
    people: false,
    peopleDescription: "No people.",
    mustNotInvent:
      "Do not invent flashing multi-color disco lights or modern advertising screens.",
    proposedFilename: "subotica_town_hall_night.jpg",
    targetPath: "/assets/images/curations/subotica_town_hall_night.jpg",
  },
  {
    id: "1066",
    place: "Contemporary Serbia Beyond Belgrade",
    visualSubject: "Modern cultural spots and gallery exhibitions in Novi Sad.",
    factualCharacteristics:
      "Clean minimalist interior gallery space, contemporary artwork hanging, neutral walls.",
    recommendedViewpoint:
      "Wide view of a clean gallery room with light wooden floors and minimalist framing.",
    seasonAndTime: "All seasons.",
    people: true,
    peopleDescription: "A visitor looking at a canvas.",
    mustNotInvent: "Do not invent commercial trade fair setups.",
    proposedFilename: "contemporary_serbia_novi_sad.jpg",
    targetPath: "/assets/images/curations/contemporary_serbia_novi_sad.jpg",
  },
  {
    id: "1067",
    place: "Ovčar Banja Thermal Rest",
    visualSubject:
      "A steaming natural hot spring pool located next to the West Morava River gorge.",
    factualCharacteristics:
      "Natural gray stone pool border, rising steam, surrounding steep forested valley walls, quiet river flow.",
    recommendedViewpoint:
      "Low-angle shot of the steaming stone pool with the towering wooded cliffs of Kablar mountain rising in the background.",
    seasonAndTime: "Late autumn morning with crisp air and heavy steam rising.",
    people: false,
    peopleDescription:
      "No people to maintain the atmosphere of secluded wellness.",
    mustNotInvent:
      "Do not invent large modern commercial water parks, slides, or neon spa signs.",
    proposedFilename: "ovcar_banja_thermal_gorge.jpg",
    targetPath: "/assets/images/curations/ovcar_banja_thermal_gorge.jpg",
  },
  {
    id: "1068",
    place: "Lukovska Banja",
    visualSubject:
      "Outdoor hot mineral water springs in a snowy mountain forest valley.",
    factualCharacteristics:
      "Steaming open-air pools, thick layer of snow on surrounding evergreens, rustic wooden walking paths, stone accents.",
    recommendedViewpoint:
      "Wide view showing the steaming thermal spring pools nestled inside the snow-covered pine forests of Mount Kopaonik.",
    seasonAndTime:
      "Mid-winter, during a sunny day with heavy snow and brilliant steam.",
    people: true,
    peopleDescription:
      "A traveler relaxing in the steaming mineral waters in soft focus.",
    mustNotInvent:
      "Do not add luxury palm trees (it's a snowy pine region) or concrete high-rise hotel blocks.",
    proposedFilename: "lukovska_banja_snowy_thermal.jpg",
    targetPath: "/assets/images/curations/lukovska_banja_snowy_thermal.jpg",
  },
  {
    id: "1069",
    place: "Prolom Banja slow time",
    visualSubject:
      "A rustic stone path winding past unique geomorphic rock formations (Devil's Town) towards a thermal spring.",
    factualCharacteristics:
      "Earthy red-brown soils, tall stone pillars with stone 'caps' (Đavolja Varoš), natural spring, dense oak woods.",
    recommendedViewpoint:
      "Wide shot showing the bizarre stone columns towering over the green forest valley with the sun setting behind them.",
    seasonAndTime:
      "Late summer at sunset, with golden rays filtering through the stone pillars.",
    people: false,
    peopleDescription: "No people to match the ancient, geological mystery.",
    mustNotInvent:
      "Do not add paved concrete boardwalks, colorful lighting displays on the stones, or fake safety railings.",
    proposedFilename: "prolom_banja_devils_town_sunset.jpg",
    targetPath: "/assets/images/curations/prolom_banja_devils_town_sunset.jpg",
  },
];
