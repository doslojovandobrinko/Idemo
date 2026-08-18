/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation, Category } from '../../../types';

/**
 * IDEMO V8 — STREAM G (LIVING SERBIA)
 * EDITORIAL DRAFTING PART 2 (G-01 through G-10)
 * 
 * Curated living crafts, artisan workshops, and authentic rural heritage experiences across Serbia.
 */
export const streamGLivingSerbiaRecommendations: Recommendation[] = [
  {
    id: "G-01",
    title: "Zlakusa Hand-Thrown Pottery Ateliers",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Discover Zlakusa's ancient hand-thrown clay pottery technique, using a unique blend of clay and calcite ground on stone wheels and wood-fired in open kilns.",
    longDescription: "Zlakusa pottery represents an unbroken centuries-old ceramic tradition in Western Serbia. Local master potters combine natural clay with coarsely ground calcite mineral on slow manual wheels, shaping vessels before firing them in open wood-fuelled pits. Visitors can observe master artisans shaping traditional bakrač and sač vessels, learn about calcite tempering, and experience authentic rural workshops.",
    image: "/src/assets/images/zlakusa_pottery_craft_1778841163739.webp",
    duration: "1.5–2.5 Hours",
    travelTime: "2.5 Hours from Belgrade",
    travelTimeMinutes: 150,
    location: "Zlakusa / Užice",
    estimatedCost: "€10–€25",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 120,
    coordinates: {
      lat: 43.8053,
      lng: 19.9881
    },
    equivalents: {
      en: "St Ives Pottery Workshops (UK)"
    },
    translations: {
      sr: {
        title: "Ateljei ručno rađene lončarije u Zlakusi",
        shortDescription: "Otkrijte drevnu tehniku izrade zlakuske lončarije na ručnom kolu, uz korišćenje jedinstvene mešavine gline i kalcita pečene na otvorenoj vatri.",
        longDescription: "Zlakuska lončarija predstavlja vekovnu tradiciju izrade posuđa u zapadnoj Srbiji. Majstori kombinuju prirodnu glinu sa mlevenim kalcitom na ručnom kolu, oblikujući posude koje se peku na otvorenoj vatri. Posetioci mogu posmatrati izradu posuda za sač, upoznati se sa tehnikom kalcitnog vezivanja i obići autentične seoske radionice.",
        location: "Zlakusa / Užice"
      }
    }
  },
  {
    id: "G-02",
    title: "Pirot Kilim Weaving Looms",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Observe master weavers crafting world-famous Pirot kilim carpets on vertical looms using two-sided geometric ornamentation and natural wool dyes.",
    longDescription: "Pirot kilim weaving is an extraordinary cultural heritage art form from South-Eastern Serbia. Hand-woven on vertical looms without reverse sides, each kilim features intricate geometric motifs and symbolic protective iconography passed down through generations. Visits provide intimate insight into wool spinning, natural dyeing processes, and precision loom craftsmanship.",
    image: "/src/assets/images/pirot_kilim_weaving_craft_1778847353764.webp",
    duration: "1.5–2 Hours",
    travelTime: "3.5 Hours from Belgrade",
    travelTimeMinutes: 210,
    location: "Pirot",
    estimatedCost: "€10–€30",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 100,
    coordinates: {
      lat: 43.1531,
      lng: 22.5861
    },
    equivalents: {
      en: "Harris Tweed Handloom Weaving (UK)"
    },
    translations: {
      sr: {
        title: "Tkačke radionice pirotskog ćilima",
        shortDescription: "Posmatrajte majstorice tkanja kako na vertikalnim razbojima izrađuju čuvene pirotske ćilime sa obostranim geometrijskim šarama i prirodno bojenom vunom.",
        longDescription: "Tkanje pirotskog ćilima predstavlja izuzetno kulturno nasleđe jugoistočne Srbije. Izrađeni na vertikalnom razboju bez naličja, ovi ćilimi nose složene geometrijske šare i simbole sa zaštitnim značenjem. Poseta omogućava uvid u pripremu vune, prirodno bojenje i preciznu veštinu tkanja.",
        location: "Pirot"
      }
    }
  },
  {
    id: "G-03",
    title: "Kovačica Naïve Art Painter Ateliers",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Immerse yourself in Kovačica's celebrated Slovak naïve art community, exploring home ateliers filled with vibrant oil canvases depicting rural Banat life.",
    longDescription: "Kovačica is Serbia's celebrated center of self-taught Slovak naïve painting. Since the mid-20th century, local self-taught painters have captured agricultural cycles, folk costumes, village festivals, and Banat landscapes in striking detailed oil compositions. Visitors meet active artists in their home studios, view historical gallery collections, and gain personal appreciation for Banat's folk art.",
    image: "/src/assets/images/kovacica_naive_art_gallery_1778844026577.webp",
    duration: "1.5–2.5 Hours",
    travelTime: "1 Hour from Belgrade",
    travelTimeMinutes: 60,
    location: "Kovačica / Banat",
    estimatedCost: "€10–€20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    coordinates: {
      lat: 45.1111,
      lng: 20.8039
    },
    equivalents: {
      en: "St Ives Artists' Studios (UK)"
    },
    translations: {
      sr: {
        title: "Ateljei naivnog slikarstva u Kovačici",
        shortDescription: "Uronite u poznatu zajednicu slovačkog naivnog slikarstva u Kovačici, obilazeći kućne ateljea ispunjene živopisnim platnima seoskog života u Banatu.",
        longDescription: "Kovačica je poznat centar slovačkog samoukog naivnog slikarstva. Od sredine 20. veka, lokalni slikari na platnima objašnjavaju poljoprivredne radove, narodne nošnje i seoske običaje Banata. Posetioci mogu sresti umetnike u njihovim radionicama, obići galerijske zbirke i doživeti autentičnu umetničku viziju seoskog života.",
        location: "Kovačica / Banat"
      }
    }
  },
  {
    id: "G-04",
    title: "Sombor Tamburica Lutherie Workshops",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Explore master lutherie workshops in Sombor where traditional Vojvodina string instruments—from prim to bas-prim—are meticulously crafted by hand.",
    longDescription: "Sombor's acoustic heritage lives through master luthiers who handcraft traditional tamburica instruments. Selecting aged spruce, maple, and walnut woods, artisans carve soundboards, shape necks, and adjust bridge resonances to achieve the warm, resonant acoustic tone essential to Vojvodina's musical culture. Visitors gain rare insight into wood seasoning, inlay decoration, and acoustic tuning.",
    image: "/src/assets/images/sombor_tamburica_craft_teaser.webp",
    duration: "1.5–2 Hours",
    travelTime: "2 Hours from Belgrade",
    travelTimeMinutes: 120,
    location: "Sombor / Bačka",
    estimatedCost: "€10–€25",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 100,
    coordinates: {
      lat: 45.7742,
      lng: 19.1122
    },
    equivalents: {
      en: "Violin Lutherie Workshops in Cremona (Italy)"
    },
    translations: {
      sr: {
        title: "Graditeljske radionice tambura u Somboru",
        shortDescription: "Istražite graditeljske radionice u Somboru gde se tradicionalni žičani instrumenti Vojvodine — od prima do bas-prima — ručno izrađuju od plemenitog drveta.",
        longDescription: "Vojvođansko muzičko nasleđe Sombora čuva se kroz radionice graditelja tambura. Odabirom odležanog smrekovog i javorovog drveta, majstori ručno oblikuju korpuse i glasnjače dajući instrumentima specifičan topli ton. Poseta pruža uvid u odabir drveta, finu obradu i zvučnu kalibraciju instrumenata.",
        location: "Sombor / Bačka"
      }
    }
  },
  {
    id: "G-05",
    title: "Šumadija Traditional Opanak Leather Craft",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Observe master opančari hand-weaving traditional Serbian leather footwear with distinctive upturned toes (kljun) using vegetable-tanned straps.",
    longDescription: "The opanak is Serbia's iconic traditional leather footwear, crafted through precise hand-braid techniques. In Šumadija workshops, master leatherworkers strip vegetable-tanned hide into fine ribbons, weaving sole structures and forming the upturned toe horn (kljun) characteristic of Šumadija style. Demonstrations reveal centuries-old tools, leather preparation methods, and historical folk costume traditions.",
    image: "/src/assets/images/sirogojno_ethno_village_1778845118794.webp",
    duration: "1.5–2 Hours",
    travelTime: "1.5 Hours from Belgrade",
    travelTimeMinutes: 90,
    location: "Kragujevac / Šumadija",
    estimatedCost: "€10–€20",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 100,
    coordinates: {
      lat: 44.0128,
      lng: 20.9114
    },
    equivalents: {
      en: "Traditional Shoemaking Workshops (UK)"
    },
    translations: {
      sr: {
        title: "Opančarske radionice Šumadije",
        shortDescription: "Posmatrajte opančarske majstore kako ručno pletu tradicionalnu srpsku kožnu obuću sa prepoznatljivim kljunom od prirodno štavljene kože.",
        longDescription: "Opanak je simbol srpske narodne nošnje, izrađen preciznim ručnim pletenjem kože. U radionicama Šumadije, opančari seku prirodno štavljenu kožu na trake, pletu gornji deo i oblikuju karakterističan zavijeni kljun. Poseta prikazuje stare alate, pripremu kože i očuvanje tradicionalnog zanata.",
        location: "Kragujevac / Šumadija"
      }
    }
  },
  {
    id: "G-06",
    title: "Gradac & Mionica Active River Watermills",
    category: Category.NATURE,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Visit centuries-old wooden watermills powered by crystal-clear karst rivers, watching heavy millstones turn corn into fresh stone-ground flour.",
    longDescription: "Along the pristine karst waters of the Gradac River and Kolubara tributaries, historic wooden watermills continue a living milling tradition. Powered by water sluices driving horizontal wheels, heavy natural stones slowly grind local corn, buckwheat, and wheat into nutrient-rich coarse flour. Visitors can watch millers adjust water intake, inspect rustic timber architecture, and purchase freshly ground stone meal.",
    image: "/src/assets/images/ovcar_kablar_gorge_monastery_1778844065335.webp",
    duration: "1.5–2.5 Hours",
    travelTime: "1.5 Hours from Belgrade",
    travelTimeMinutes: 90,
    location: "Valjevo / Gradac River",
    estimatedCost: "€10–€20",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    coordinates: {
      lat: 44.2500,
      lng: 19.8833
    },
    equivalents: {
      en: "Historic Watermills in Dorset (UK)"
    },
    translations: {
      sr: {
        title: "Aktivne vodenice na Gradcu i Mionici",
        shortDescription: "Obiđite vekovne drvene vodenice na čistim kraškim rekama i posmatrajte rad žrvnja koji mlevenjem kukuruza stvara domaće brašno.",
        longDescription: "Duž bistrih reka gradačkog kraja i Mionice, stare drvene vodenice i dalje mlevu žito na tradicionalan način. Pokretane rečnim tokom preko drvenog vitla, kamene ploče polako melju kukuruz i pšenicu u integralno brašno. Posetioci mogu posmatrati rad vodenice, uživati u prirodi i kupiti sveže mleveno brašno.",
        location: "Valjevo / Gradac River"
      }
    }
  },
  {
    id: "G-07",
    title: "Niš Silver Filigree Master Workshops",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Witness master filigree artisans shape fine silver wire into delicate lace jewellery, preserving a Balkan metalworking craft originating in Byzantine times.",
    longDescription: "Niš is one of Serbia's historic sanctuaries for silver filigree craftsmanship. Working with fine gauge silver wire, master artisans twist, solder, and assemble delicate lacelike ornaments, earrings, and brooches using small handheld tweezers and soldering torches. Studio demonstrations showcase the meticulous patience, design mastery, and Balkan filigree heritage.",
    image: "/src/assets/images/nis_fortress_stambol_gate_1778845134540.webp",
    duration: "1.5–2 Hours",
    travelTime: "2.5 Hours from Belgrade",
    travelTimeMinutes: 150,
    location: "Niš",
    estimatedCost: "€15–€35",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 100,
    coordinates: {
      lat: 43.3209,
      lng: 21.8958
    },
    equivalents: {
      en: "Goldsmiths' Hall Filigree Artisans (UK)"
    },
    translations: {
      sr: {
        title: "Filigranske radionice srebra u Nišu",
        shortDescription: "Svedočite veštini filigranista koji od tanke srebrne žice stvaraju delikatni nakit, čuvajući balkanski metalurški zanat vizantijskih korena.",
        longDescription: "Niš predstavlja istorijski centar filigranskog zanata u Srbiji. Koristeći finu srebrnu žicu, majstori uvijaju, leme i spajaju mrežaste komade nakita i ukrasa pomoću pinceta i gorionika. Poseta radionici otkriva izuzetnu preciznost i tradiciju izrade srebrnog nakita.",
        location: "Niš"
      }
    }
  },
  {
    id: "G-08",
    title: "Srem Oak & Acacia Cooperage Workshops",
    category: Category.GASTRONOMY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Step into traditional Srem cooperage workshops to see master pinteri shape seasoned oak and acacia staves over open fires to craft wine and rakija barrels.",
    longDescription: "Srem's rich winemaking and rakija culture relies heavily on master coopers (pinteri). Selecting naturally seasoned local oak and acacia wood, craftsmen shape curved wooden staves, heat them over open fire hearths to bend the wood without splitting, and drive heavy iron hoops around the barrels. Visitors observe stave planing, fire toasting, and hoop fitting.",
    image: "/src/assets/images/sremski_karlovci_town_1778841131222.webp",
    duration: "1.5–2.5 Hours",
    travelTime: "1 Hour from Belgrade",
    travelTimeMinutes: 60,
    location: "Sremska Mitrovica / Fruška Gora",
    estimatedCost: "€10–€25",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 120,
    coordinates: {
      lat: 44.9764,
      lng: 19.6122
    },
    equivalents: {
      en: "Speyside Cooperage (Scotland)"
    },
    translations: {
      sr: {
        title: "Pinterske radionice hrastovih i bagremovih buradi u Sremu",
        shortDescription: "Uđite u tradicionalne sremske pinterske radionice i posmatrajte oblikovanje hrastovih i bagremovih duga nad vatrom za izradu buradi za vino i rakiju.",
        longDescription: "Vinarska i rakijska kultura Srema neodvojiva je od pinterskog zanata. Koristeći odležano hrastovo i bagremovo drvo, majstori savijaju dužice nad otvorenom vatrom i utežu ih gvozdenim obručima. Poseta radionici prikazuje obradu drveta, paljenje buradi i uvid u sazrevanje pića.",
        location: "Sremska Mitrovica / Fruška Gora"
      }
    }
  },
  {
    id: "G-09",
    title: "Svrljig Frula & Gajde Instrument Carving",
    category: Category.HISTORY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Discover how traditional wooden flutes (frula) and Svrljig bagpipes (gajde) are hand-carved, tuned, and tested in South-Eastern Serbia.",
    longDescription: "The Svrljig area is legendary for its folk music traditions and master wind instrument makers. Craftsmen select plum, maple, and boxwood timber, seasoning the wood before hand-boring, carving fingerholes, and tuning acoustic pitch. Visits include demonstrations of wooden frula carving, hornhead bagpipe assembly, and short traditional acoustic performances.",
    image: "/src/assets/images/g-09_svrljig_frula_gajde_instrument_carving.webp",
    duration: "1.5–2.5 Hours",
    travelTime: "2.5 Hours from Belgrade",
    travelTimeMinutes: 160,
    location: "Svrljig / Eastern Serbia",
    estimatedCost: "€10–€25",
    preferredTransport: "Car",
    seasonality: "all",
    familySuitability: true,
    accessibility: true,
    premiumLevel: "standard",
    budgetLevel: "low",
    recommendedVisitDuration: 120,
    coordinates: {
      lat: 43.4136,
      lng: 22.0864
    },
    equivalents: {
      en: "Northumbrian Smallpipes Craft (UK)"
    },
    translations: {
      sr: {
        title: "Radionice izrade frula i gajdi u Svrljigu",
        shortDescription: "Otkrijte kako se drvene frule i svrljiške gajde ručno dube, podešavaju i štimuju u tradicionalnim radionicama jugoistočne Srbije.",
        longDescription: "Svrljiški kraj je čuven po muzičkoj tradiciji i majstorima za izradu narodnih duvačkih instrumenata. Odabirom šljivovog i javorovog drveta, majstori ručno dube frule i izrađuju gajde sa autentičnim zvučnim štimom. Poseta uključuje prikaz izrade i kratku zvučnu demonstraciju.",
        location: "Svrljig / Eastern Serbia"
      }
    }
  },
  {
    id: "G-10",
    title: "Pešter Plateau Artisan Dairy Households",
    category: Category.GASTRONOMY,
    publicationStatus: "RESEARCH_CANDIDATE",
    shortDescription: "Visit traditional high-altitude mountain households on the Pešter Plateau to taste Sjenica white cheese aged in traditional wooden vats.",
    longDescription: "High on the windswept Pešter Plateau, sheep and cattle graze vast alpine pastures producing milk for famed Sjenica cheese. Pastoral households maintain time-honored dairy practices, curdling fresh milk and aging brine-soaked cheeses in traditional wooden vats. Visitors experience mountain hospitality, view traditional dairy pantries, and sample artisanal cheeses.",
    image: "/src/assets/images/pirot_gastronomy_cheese_1778845871088.webp",
    duration: "2–3 Hours",
    travelTime: "4 Hours from Belgrade",
    travelTimeMinutes: 240,
    location: "Sjenica / Pešter Plateau",
    estimatedCost: "€15–€35",
    preferredTransport: "Car",
    seasonality: "spring-fall",
    familySuitability: true,
    accessibility: false,
    premiumLevel: "standard",
    budgetLevel: "moderate",
    recommendedVisitDuration: 150,
    coordinates: {
      lat: 43.2711,
      lng: 20.0019
    },
    equivalents: {
      en: "Wensleydale Creamery Artisan Cheese (UK)"
    },
    translations: {
      sr: {
        title: "Seoska domaćinstva za proizvodnju sira na Pešterskoj visoravni",
        shortDescription: "Obiđite visoko-planinska domaćinstva na Pešterskoj visoravni i probajte sjenički beli sir sazrevao u drvenim kacama.",
        longDescription: "Na prostranoj Pešterskoj visoravni, stada pasu na čestim planinskim pašnjacima dajući mleko vrhunskog kvaliteta za sjenički sir. Seoska domaćinstva čuvaju tradiciju prerade mleka i sazrevanja sira u drvenim kacama. Poseta nudi planinsko gostoprimstvo, obilazak mlekara i degustaciju sira.",
        location: "Sjenica / Pešter Plateau"
      }
    }
  }
];
