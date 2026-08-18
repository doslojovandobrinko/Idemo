/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from '../../../types';

/**
 * IDEMO V8 — STREAM F (ACTIVE SERBIA)
 * BATCH F1 — MOUNTAIN TRAILS & HIGH-PEAK HIKES (F1-01 through F1-10)
 * 
 * Curated high-altitude mountain trails, ridge traverses, and peak ascents across Serbia.
 */
export const streamFActiveSerbiaRecommendations: Recommendation[] = [
  {
    id: "F1-01",
    title: "Rtanj Pyramid Summit Ascent",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Ascend the iconic limestone pyramid peak of Šiljak on Rtanj Mountain, featuring 360-degree views across Eastern Serbia, unique medicinal flora, and legendary local folklore.",
    longDescription: "Rtanj Mountain is renowned for its symmetrical pyramidal peak, Šiljak (1,565m). The southern approach trail climbs through dense beech woodland before emerging onto open limestone ridges. Hikers are rewarded with sweeping panoramas of the Timok region, abundant wild herbs such as Rtanj tea (Satureja montana), and the historic ruins of the St. George hilltop chapel.",
    image: "/src/assets/images/rtanj_summit_trail.webp",
    duration: "5-6 Hours",
    travelTime: "2.5 - 3 Hours from Belgrade",
    travelTimeMinutes: 160,
    location: "Boljevac / Rtanj",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 360,
    coordinates: {
      lat: 43.7761,
      lng: 21.8903
    },
    equivalents: {
      en: "Mount Snowdon (UK)",
      de: "Watzmann Ridge (Germany)"
    },
    translations: {
      sr: {
        title: "Uspon na piramidalni vrh Rtnja",
        shortDescription: "Slikoviti uspon na piramidalni vrh Šiljak na planini Rtanj sa panoramskim pogledom na istočnu Srbiju i bogatom lekovitom florom.",
        longDescription: "Planina Rtanj je poznata po svom simetričnom piramidalnom vrhu Šiljak (1.565m). Južna staza vodi kroz bukovu šumu i izlazi na otvorene krečnjačke grebene, nudeći veličanstven pogled na timočki kraj.",
        location: "Boljevac / Rtanj"
      }
    }
  },
  {
    id: "F1-02",
    title: "Midžor High-Peak Summit Ridge",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Hike the highest peak of Central Serbia along the serene alpine border ridge of Stara Planina, offering expansive subalpine meadows and open mountain panoramas.",
    longDescription: "Midžor (2,169m) forms the summit peak of Stara Planina along the Serbian-Bulgarian border. Departing from the Babin Zub ski refuge area, the trail follows a wide, rolling alpine ridge. The route provides an accessible high-altitude experience free of technical climbing, passing seasonal glacial springs and vibrant alpine grasslands.",
    image: "/src/assets/images/midzor_stara_planina.webp",
    duration: "4-5 Hours",
    travelTime: "3.5 - 4 Hours from Belgrade",
    travelTimeMinutes: 220,
    location: "Stara Planina / Knjaževac",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 300,
    coordinates: {
      lat: 43.3958,
      lng: 22.6806
    },
    equivalents: {
      en: "Brecon Beacons High Ridge (UK)"
    },
    translations: {
      sr: {
        title: "Grebenski uspon na Midžor",
        shortDescription: "Pješačenje na najviši vrh centralne Srbije duž spokojnog visokoplaninskog grebena Stare planine.",
        longDescription: "Midžor (2.169m) predstavlja najviši vrh Stare planine. Staza od Babinog zuba vodi duž prostranog grebena sa kojeg se pružaju otvoreni vidici na alpine livade i okolne planinske lance.",
        location: "Stara Planina / Knjaževac"
      }
    }
  },
  {
    id: "F1-03",
    title: "Suva Planina Ridge Traverse & Trem Peak",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Traverse the dramatic, razor-sharp limestone ridge of Suva Planina to reach Trem Peak (1,810m), experiencing South-Eastern Serbia's most impressive alpine scenery.",
    longDescription: "Suva Planina (\"Dry Mountain\") is famed for its horseshoe-shaped karst ridge and vertical limestone cliffs. Starting from Bojanine Vode near Niška Banja, the ascent via Devojački Grob tests stamina before reaching Trem Peak. The trail offers unparalleled exposures and vistas across the Zaplanje valley.",
    image: "/src/assets/images/suva_planina_trem.webp",
    duration: "5-6 Hours",
    travelTime: "3 Hours from Belgrade",
    travelTimeMinutes: 180,
    location: "Niška Banja / Suva Planina",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 360,
    coordinates: {
      lat: 43.1817,
      lng: 22.1803
    },
    equivalents: {
      en: "Crib Goch / Snowdonia (UK)"
    },
    translations: {
      sr: {
        title: "Grebenska staza Suve Planine i vrh Trem",
        shortDescription: "Uzbudljiva grebenska staza preko oštrog krečnjačkog masiva Suve Planine do najvišeg vrha Trem (1.810m).",
        longDescription: "Suva Planina je poznata po svojim vertikalnim krečnjačkim stena i potkovičastom grebenu. Uspon od Bojaninih voda preko Devojačkog groba vodi na sam vrh Trem sa koga se pruža pogled na Zaplanje.",
        location: "Niška Banja / Suva Planina"
      }
    }
  },
  {
    id: "F1-04",
    title: "Rajac Alpine Meadow Circuit",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Enjoy accessible high-altitude walking through rolling meadows, conifer groves, and scenic viewpoints on Rajac Mountain, just two hours from Belgrade.",
    longDescription: "Rajac is part of the Suvobor mountain cluster and serves as an approachable haven for gentle hiking. The circular trail connects mountain lodges, memorial monuments from WWI, and grassy ridges overlooking Šumadija. Ideal for day trips, family walking, and traditional mountain dining.",
    image: "/src/assets/images/rajac_meadow_trail.webp",
    duration: "2-3 Hours",
    travelTime: "1.5 - 2 Hours from Belgrade",
    travelTimeMinutes: 100,
    location: "Ljig / Suvobor",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    coordinates: {
      lat: 44.1378,
      lng: 20.2181
    },
    equivalents: {
      en: "Malvern Hills (UK)"
    },
    translations: {
      sr: {
        title: "Kružna staza Rajačkih livada",
        shortDescription: "Pristupačna planinska šetnja kroz cvetne livade, četinarske šume i vidikovce planine Rajac.",
        longDescription: "Rajac pripada suvoborskom planinskom masivu i nudi pitome staze za šetnju. Kružna staza povezuje planinarske domove, spomenike iz Prvog svetskog rata i prostrane vidikovce nad Šumadijom.",
        location: "Ljig / Suvobor"
      }
    }
  },
  {
    id: "F1-05",
    title: "Veliki Štrbac Danube Gorge Trail",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Ascend through Djerdap National Park to Veliki Štrbac peak (768m), taking in towering cliffside views over the narrowest gorge of the Danube River.",
    longDescription: "Overlooking the dramatic Iron Gates (Kazan Gorge), the trail to Veliki Štrbac climbs through dense oak-hornbeam reserves and past the Ploče forest station. At the summit cliffs, hikers look down nearly 800 meters to the swirling turquoise waters of the Danube, where the river narrows to under 150 meters wide.",
    image: "/src/assets/images/veliki_strbac_djerdap.webp",
    duration: "4-5 Hours",
    travelTime: "2.5 - 3 Hours from Belgrade",
    travelTimeMinutes: 170,
    location: "Djerdap National Park / Donji Milanovac",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 270,
    coordinates: {
      lat: 44.6067,
      lng: 22.2611
    },
    equivalents: {
      en: "Cheddar Gorge Cliff Walk (UK)"
    },
    translations: {
      sr: {
        title: "Staza Veliki Štrbac nad Đerdapskom klisurom",
        shortDescription: "Uspon kroz Nacionalni park Đerdap do vrha Veliki Štrbac sa koga se pruža pogled na najuži deo Dunava u Kazanu.",
        longDescription: "Staza do Velikog Štrpca (768m) vodi kroz šumske rezervate Đerdapa i preko vidikovca Ploče. Sa vršnih stena pruža se nesvakidašnji pogled na Dunav procepljen između uskih krečnjačkih litica.",
        location: "Nacionalni park Đerdap / Donji Milanovac"
      }
    }
  },
  {
    id: "F1-06",
    title: "Stolovi Wild Horse Ridge Trail",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Hike the scenic ridge of Stolovi Mountain above the Ibar River valley, where herds of free-roaming horses may be encountered amidst vast, grassy alpine heights.",
    longDescription: "Stolovi Mountain near Kraljevo is famous for its Kamarište ridge (1,375m) and the semi-wild horse herds that roam freely across its open slopes. Starting from Brezna, the trail wanders across carpeted mountain meadows with views stretching toward Maglič Fortress and the Ibar Gorge.",
    image: "/src/assets/images/stolovi_wild_horse_ridge.webp",
    duration: "4-5 Hours",
    travelTime: "2.5 - 3 Hours from Belgrade",
    travelTimeMinutes: 165,
    location: "Kraljevo / Stolovi Mountain",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 270,
    coordinates: {
      lat: 43.6083,
      lng: 20.6861
    },
    equivalents: {
      en: "Dartmoor Wild Pony Trails (UK)"
    },
    translations: {
      sr: {
        title: "Grebenska staza divljih konja na Stolovima",
        shortDescription: "Slikovito pješačenje grebenom planine Stolovi iznad doline Ibra gde se mogu sresti krda slobodnih konja.",
        longDescription: "Planina Stolovi pored Kraljeva poznata je po grebenu Kamarište (1.375m) i polu-divljim konjima koji slobodno pasu. Staza iz Brezne vodi preko prostranih livada sa pogledom na dolinu Ibra i tvrđavu Maglič.",
        location: "Kraljevo / Planina Stolovi"
      }
    }
  },
  {
    id: "F1-07",
    title: "Divčibare Twin Peaks Trail",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "A gentle, family-friendly mountain trek on the Maljen plateau, linking the wooded summits and open panoramas of Crni Vrh and Golubac.",
    longDescription: "Located in the Valjevo Highlands, Divčibare offers mild mountain walking accessible year-round. This trail connects two prominent peaks—Crni Vrh (1,096m) and Golubac (1,050m)—traversing pine woods, peat meadows, and quiet ridges overlooking Western Serbia.",
    image: "/src/assets/images/divcibare_maljen_trail.webp",
    duration: "2-3 Hours",
    travelTime: "1.5 - 2 Hours from Belgrade",
    travelTimeMinutes: 110,
    location: "Divčibare / Maljen",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 180,
    coordinates: {
      lat: 44.1083,
      lng: 19.9917
    },
    equivalents: {
      en: "Surrey Hills Woodland Walk (UK)"
    },
    translations: {
      sr: {
        title: "Staza dva vrha na Divčibarama",
        shortDescription: "Prijatna, porodična planinska šetnja platoom Maljena koja povezuje šumovite vrhove Crni Vrh i Golubac.",
        longDescription: "Divčibare na visoravni Maljen nude pristupačne staze tokom cele godine. Ova ruta povezuje Crni Vrh (1.096m) i Golubac (1.050m), vodeći kroz borove šume i mirne vidikovce zapadne Srbije.",
        location: "Divčibare / Maljen"
      }
    }
  },
  {
    id: "F1-08",
    title: "Beljanica Plateau & Waterfall Crest Trail",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Experience an active ascent from the lush karst waterfall basin of Lisine up into the solitary, limestone high plateau of Beljanica Mountain (1,339m).",
    longDescription: "Distinct from valley sightseeing, this mountain trail begins at the Veliki Buk karst spring and climbs steadily through beech woodland onto the limestone karst crest of Beljanica. The route opens onto rolling alpine pastures, sinkholes, and sweeping views of Eastern Serbia.",
    image: "/src/assets/images/beljanica_lisine.webp",
    duration: "4-5 Hours",
    travelTime: "2 - 2.5 Hours from Belgrade",
    travelTimeMinutes: 140,
    location: "Despotovac / Beljanica",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: false,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 270,
    coordinates: {
      lat: 44.1139,
      lng: 21.6983
    },
    equivalents: {
      en: "Yorkshire Dales Karst Ascent (UK)"
    },
    translations: {
      sr: {
        title: "Staza vodopada i visoke platoe Beljanice",
        shortDescription: "Uspon od kraškog vodopada Veliki Buk na Lisine do usamljene krečnjačke visoravni Beljanice (1.339m).",
        longDescription: "Aktivna planinarska staza polazi od vodopada Lisine i kroz bukovu šumu savladava visinu do otvorenog kraškog platoa Beljanice sa vršnim grebenom i kraškim uvalama.",
        location: "Despotovac / Beljanica"
      }
    }
  },
  {
    id: "F1-09",
    title: "Kopaonik Celestial Ridge & Metođe Walk",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Discover Kopaonik beyond the ski slopes on a high-altitude trail uniting panoramic ridge crests, the ancient Nebeske Stolice sanctuary ruins, and the Metođe nature reserve.",
    longDescription: "Away from winter resort infrastructure, Kopaonik National Park reveals pristine subalpine ecosystems. This trail traverses the Nebeske Stolice (\"Celestial Chairs\") ridge, offering views toward Kosovo and Montenegro, before descending toward the protected sanctuary waters of Metođe spring.",
    image: "/src/assets/images/kopaonik_metodje.webp",
    duration: "3-4 Hours",
    travelTime: "3.5 - 4 Hours from Belgrade",
    travelTimeMinutes: 230,
    location: "Kopaonik National Park",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 210,
    coordinates: {
      lat: 43.2858,
      lng: 20.8256
    },
    equivalents: {
      en: "Cairngorms High Plateau (UK)"
    },
    translations: {
      sr: {
        title: "Kopaoničke Nebeske Stolice i prirodni rezervat Metođe",
        shortDescription: "Visokoplaninsko pješačenje Kopaonikom van skijališta koje spaja grebenske vidikovce, lokalitet Nebeske Stolice i rezervat Metođe.",
        longDescription: "Staza vodi preko arheološko-prirodnog lokaliteta Nebeske Stolice na 1.800m nadmorske visine i spušta se ka svetilištu i izvoru Metođe u gustoj smrčevoj šumi.",
        location: "Nacionalni park Kopaonik"
      }
    }
  },
  {
    id: "F1-10",
    title: "Povlen Three Peaks Mountain Traverse",
    category: Category.NATURE,
    publicationStatus: "CANONICAL",
    shortDescription: "Explore the quiet summits of Mali, Srednji, and Veliki Povlen, traversing ancient beech groves and highland pastures in the heart of the Valjevo Mountains.",
    longDescription: "Povlen is the highest peak group in the Valjevo mountain range (Mali Povlen 1,347m). The trail links all three main summits, winding through shaded deciduous forests, limestone outcrops, and solitary highland meadows far removed from commercial tourism.",
    image: "/src/assets/images/povlen_three_peaks.webp",
    duration: "4-5 Hours",
    travelTime: "2 Hours from Belgrade",
    travelTimeMinutes: 120,
    location: "Valjevo Mountains / Povlen",
    estimatedCost: "€0 - €20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 270,
    coordinates: {
      lat: 44.1333,
      lng: 19.7417
    },
    equivalents: {
      en: "Peak District Ridge Traverse (UK)"
    },
    translations: {
      sr: {
        title: "Traverza tri vrha Povlena",
        shortDescription: "Mirno planinarenje kroz tri vrha Povlena – Mali, Srednji i Veliki Povlen – u srcu Valjevskih planina.",
        longDescription: "Povlen predstavlja najviši masiv Valjevskih planina. Staza spaja Mali, Srednji i Veliki Povlen (1.347m), vodeći kroz bukove šume, krečnjačke stene i osamljene planinske livade.",
        location: "Valjevske planine / Povlen"
      }
    }
  }
];
