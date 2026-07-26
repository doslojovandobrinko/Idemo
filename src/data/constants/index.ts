/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UsefulTip, DidYouKnow } from '../../types';

export const LANGUAGES = [
  {
    "code": "sr",
    "label": "Srpski"
  },
  {
    "code": "en",
    "label": "English"
  },
  {
    "code": "es",
    "label": "Español"
  },
  {
    "code": "de",
    "label": "Deutsch"
  },
  {
    "code": "ru",
    "label": "Русский"
  },
  {
    "code": "zh",
    "label": "中文"
  }
];

export const USEFUL_TIPS: UsefulTip[] = [
  {
    "id": "salas_capsule",
    "category": "Culture",
    "title": "The Origin of the Salaš",
    "description": "In the vast plains of Vojvodina, a \"Salaš\" was originally a secluded farmstead born out of Austrian-Hungarian borderlands. Over centuries, they morphed from hardworking borderland outposts into quiet islands of culinary and spiritual rest. Savoring slow-cooked traditional meats or wood-oven baked bread on a salaš connects you directly with centuries of unhurried local agricultural resilience.",
    "translations": {
      "sr": {
        "title": "Istorijat vojvođanskog salaša",
        "description": "U nepreglednim ravnicama Vojvodine, salaši su prvobitno nastali kao izolovana prigradska imanja na austrougarskoj granici. Tokom vekova, ovi radni posedi prerasli su u prave oaze mira, domaće kuhinje i vinskog spokoja, gde se i danas neguje spora i tradicijom bogata panonska filozofija života."
      },
      "zh": {
        "title": "萨拉斯庄园的历史渊源",
        "description": "在伏伊伏丁那的辽阔平原上，“萨拉斯”（Salaš）最初是在奥匈边境线上诞生的一种与世隔绝的农舍庄园。几个世纪以来，它们从艰苦的边防前哨演变成静静的温情岛屿。在这里享用慢炖烤肉或木柴烤制的传统面包，能让您立即与数百年来的悠闲乡村文化底蕴产生共鸣。"
      }
    }
  },
  {
    "id": "rakija_capsule",
    "category": "Gastronomy",
    "title": "The Pre-Prandial Rakija Ritual",
    "description": "In Serbia, the digestif concept is turned on its head. Serving a small glass of ice-cold \"Rakija\" (traditional double-distilled organic fruit brandy) before breakfast or mid-day lunch is a centuries-old social formula of clean trust and warm hospitality. Highly complex in aromatic esters, custom plum (Šljiva) or quince (Dunja) rakija sets the gastric pace and opens sincere philosophical dialogue.",
    "translations": {
      "sr": {
        "title": "Ritual pre-prandijalne rakije",
        "description": "U Srbiji se rakija (tradicionalna dvostruko destilisana voćna rakija) ne pije nakon jela, već pre njega. Služenje domaće šljive ili dunje pre obroka stari je ceremonijal poverenja i dobrodošlice koji otvara apetit i pokreće iskrene filozofske razgovore."
      },
      "zh": {
        "title": "餐前拉基亚白兰地仪式",
        "description": "在塞尔维亚，餐后消化酒的概念被颠覆了。在早餐或午餐餐前递上一小杯冰镇的“拉基亚”（Rakija，一种传统双重蒸馏的有机水果白兰地）是持续数白年的迎客与信任礼仪。高芳香酯、口感复杂的李子（Šljiva）或榲桲（Dunja）拉基亚，有助于调理肠胃，并开启真挚幽微的灵魂对话。"
      }
    }
  },
  {
    "id": "tara_crossroads",
    "category": "Nature",
    "title": "The Atmospheric Tara Air Crossroads",
    "description": "Tara National Park boasts an unusual microclimatic phenomenon known as the \"air crossroads.\" Resinous, dry, cold Alpine currents collision directly with warm, salt-tinged Mediterranean waves traveling up through southern canyons. This constant localized meeting creates an atmospheric blend rich in ozone, volatile pine terpenes, and essential ions, acting as a natural unpowered respiratory cure for centuries.",
    "translations": {
      "sr": {
        "title": "Ruža vetrova na planini Tari",
        "description": "Nacionalni park Tara poseduje jedinstveni mikroklimatski fenomen poznat kao ruža vetrova. Ovde se suve, hladne alpske vazdušne struje sudaraju sa toplim, slanim mediteranskim talasima koji pristižu kroz rečne kanjone, formirajući vazduh izuzetno bogat ozonom i blagotvornim aerosolima borove šume."
      },
      "zh": {
        "title": "塔拉山的高空风之玫瑰",
        "description": "塔拉国家公园拥有独特的“空气交汇十字路口”微气候现象。来自北部的冷冽干燥高山气流与穿过南部峡谷而来的温暖、略带咸味的亚德里亚海地中海气流在此直接撞击。这种气流的终年交汇，孕育出富含臭氧、松脂揮发物与负氧离子的纯度极高的养生空气，几个世纪以来一直是天然的绿色呼吸疗法圣地。"
      }
    }
  },
  {
    "id": "1",
    "coordinateX": 2,
    "coordinateY": -4,
    "category": "Transport",
    "title": "Belgrade Public Transport",
    "description": "Public transportation in Belgrade is completely FREE. For seamless navigation and transit schedules, we recommend downloading the Moovit app—the most popular navigation and public transportation app in Belgrade. It integrates buses, trams, trolleybuses, and the BG Voz commuter rail system, providing lists of real-time schedule, arrival info, and step-by-step guidance.\n\nMain Features: Trip Planner\nSimply enter your starting point and destination (or tap on the map) and Moovit will suggest the fastest routes and best combinations of transit lines.",
    "link": "https://moovitapp.com",
    "androidLink": "https://play.google.com/store/apps/details?id=com.tranzmate",
    "iosLink": "https://apps.apple.com/app/moovit-public-transit-app/id498472935",
    "translations": {
      "sr": {
        "title": "Gradski prevoz u Beogradu",
        "description": "Gradski prevoz u Beogradu je potpuno BESPLATAN za sve. Za snalaženje i navigaciju najviše preporučujemo Moovit aplikaciju. Ona integriše sve autobuse, tramvaje, trolejbuse i BG Voz gradsku železnicu, pružajući redove vožnje, informacije o dolascima u realnom vremenu i korak-po-korak uputstva.\n\nGlavna funkcija: Planer putovanja\nSamo unesite početnu tačku i odredište (ili izaberite lokaciju na mapi) i Moovit će predložiti najbrže rute i najbolje kombinacije linija."
      },
      "zh": {
        "title": "贝尔格莱德公共交通",
        "description": "贝尔格莱德的公共交通是完全免费的。为了顺畅出行，我们强烈推荐使用 Moovit——当地最受欢迎的公共交通与导航应用之一。它整合了公交车、有轨电车、无轨电车和 BG Voz 城市通勤铁路系统，提供时刻表、实时到达信息以及分步导航指引。\n\n核心功能：行程规划 (Trip Planner)\n只需输入起点和终点（或在地图上选择地点），Moovit 就会为您规划最快的路线和出行的最佳线路组合。"
      }
    }
  },
  {
    "id": "2",
    "coordinateX": 0,
    "coordinateY": -1.5,
    "category": "Money",
    "title": "Cash is Essential",
    "description": "While cards are common, cash (Dinars) is essential for small vendors. Expect to pay ~200 RSD ($1.35) for an ice cream scoop, and ~100 RSD ($0.90) for street popcorn. Always carry small bills for these traditional spots.",
    "translations": {
      "sr": {
        "title": "Keš je neophodan",
        "description": "Iako su kartice uobičajene, keš (dinari) je neophodan za male prodavce. Uvek nosite sitan novac za tradicionalna mesta."
      },
      "zh": {
        "title": "现金至关重要",
        "description": "虽然银行卡很普遍，但对于小商贩来说，现金（第纳尔）必不可少。一个冰淇淋球大约需要支付 200 RSD（1.35 美元），街头爆米花大约 100 RSD（0.90 美元）。在这些传统地点，请务必随身携带小额钞票。"
      }
    }
  },
  {
    "id": "3",
    "coordinateX": 3.5,
    "coordinateY": 2.5,
    "category": "Etiquette",
    "title": "Useful Phrases",
    "description": "Learn 'Dobar dan' (Good day) and 'Hvala' (Thanks). Serbians rank among the top English speakers in Europe, but locals love small efforts. 'Račun molim' asks for the bill. A linguistic gem is the word 'Bre'—a versatile, informal intensifier used for emphasis, surprise, or camaraderie.",
    "equivalentPhrases": "'Man/Dude' (EN), 'Же/Ну' (RU), 'Tío/Che' (ES).",
    "translations": {
      "sr": {
        "title": "Korisne fraze",
        "description": "Naučite 'Dobar dan' i 'Hvala'. Srbi su među najboljim govornicima engleskog u Evropi, ali lokalci vole trud. 'Račun molim' služi za traženje računa."
      },
      "zh": {
        "title": "实用短语",
        "description": "学习“Dobar dan”（你好）和“Hvala”（谢谢）。塞尔维亚人的英语口语在欧洲名列前茅，但当地人很喜欢游客的小小尝试。“Račun molim”是结账的意思。一个语言瑰宝是“Bre”这个词——它是一个通用的、非正式的语气词，用于强调、惊讶或表示亲近。"
      }
    }
  },
  {
    "id": "4",
    "coordinateX": -3,
    "coordinateY": -2,
    "category": "Safety",
    "title": "Tap Water Quality",
    "description": "Tap water is safe and meets high safety standards, often rated cleaner than in many major EU capitals. You can refill your bottle freely at public fountains ('Česma') found throughout Belgrade and other cities."
  },
  {
    "id": "5",
    "coordinateX": -2,
    "coordinateY": -3,
    "category": "Connectivity",
    "title": "Local SIM Cards",
    "description": "Prepaid SIMs are very affordable. You can get 15GB of data for ~€5-10, which is a fraction of the €30+ cost for similar tourist plans in the US or UK. Newsstands (Trafika) sell them everywhere—just bring your passport.",
    "link": "https://www.yettel.rs/en/consumer/prepaid/prepaid-plans"
  },
  {
    "id": "6",
    "coordinateX": -1.5,
    "coordinateY": 2.5,
    "category": "Transport",
    "title": "Use CarGo App",
    "description": "CarGo is the local Uber alternative. It is reliable and typically ~30% cheaper than ride-sharing services in Western European cities. Link your card for seamless payments and track drivers in real-time for a safe experience.",
    "link": "https://appcargo.com"
  },
  {
    "id": "7",
    "coordinateX": -2,
    "coordinateY": 3.5,
    "category": "Money",
    "title": "Exchange Rates",
    "description": "Exchange rates in Serbia are officially established and monitored by the National Bank of Serbia (NBS). Daily exchange lists can be checked directly on the official NBS English website. Local licensed exchange offices (Menjačnica) offer excellent rates with spreads often under 1% based on the official NBS middle rate, far superior to airports. Avoid hotel exchanges for the best value.",
    "link": "https://www.nbs.rs/en/index.html",
    "translations": {
      "sr": {
        "title": "Kursna lista",
        "description": "Zvanični kurs u Srbiji utvrđuje i prati Narodna banka Srbije (NBS). Dnevne kursne liste možete proveriti direktno na zvaničnom sajtu NBS. Lokalne licencirane menjačnice nude odlične kurseve sa razlikom obično ispod 1%, što je daleko bolje od nepovoljnih stopa na aerodromima. Izbegavajte hotelske menjačnice za najbolju vrednost."
      },
      "zh": {
        "title": "汇率监管",
        "description": "塞尔维亚的官方汇率由塞尔维亚国家银行（NBS）制定与监管。您可直接在NBS英文官网查询每日实时中行汇率。当地持牌兑换所（Menjačnica）依据官方汇率结算，买卖价差通常在1%内，远好于机场及酒店，建议避开机场和酒店兑换。"
      }
    }
  },
  {
    "id": "8",
    "coordinateX": 0.5,
    "coordinateY": -2.5,
    "category": "Etiquette",
    "title": "Tipping Culture",
    "description": "A 10% tip is standard in restaurants—less aggressive than the 20%+ expected in the US. In cafes, simply rounding up the bill is common and appreciated as a sign of good service in tourist areas."
  },
  {
    "id": "9",
    "coordinateX": -0.5,
    "coordinateY": -2.5,
    "category": "Safety",
    "title": "Emergency Numbers",
    "description": "112 is the universal emergency number, same as across the EU. Operators are trained to handle English calls. Serbia is statistically one of the safest countries in Europe for travelers."
  },
  {
    "id": "10",
    "coordinateX": -0.5,
    "coordinateY": 2.5,
    "category": "Connectivity",
    "title": "Free Public WiFi",
    "description": "Belgrade has a high density of free WiFi spots in parks and squares compared to many Western capitals. Most cafes ('Kafić') offer fast, free internet—just ask for the 'Šifra' (password)."
  },
  {
    "id": "11",
    "coordinateX": -1.5,
    "coordinateY": -2.5,
    "category": "Transport",
    "title": "Public Parking & Zones",
    "description": "Belgrade parking is color-coded: Red (1h max), Yellow (2h), Green (3h), and Blue (no limit). Pay via SMS by sending your license plate to 9111, 9112, 9113, or 9119 respectively. Rates are ~60 RSD/hr. Free after 9 PM on weekdays and after 2 PM on Saturdays.",
    "link": "https://parking-servis.co.rs/en/"
  },
  {
    "id": "12",
    "coordinateX": 2,
    "coordinateY": -3.5,
    "category": "Transport",
    "title": "Taxi Services & Fares",
    "description": "Official taxis start at ~270 RSD with a day rate of ~100 RSD/km ($0.90). Use 'Yandex Go' to avoid 'wild' taxis and ensure transparent pricing and real-time tracking.",
    "link": "https://taxi.yandex.com"
  },
  {
    "id": "13",
    "coordinateX": 3.5,
    "coordinateY": -3.5,
    "category": "Etiquette",
    "title": "Nightlife starts late",
    "description": "Serbian nightlife begins much later than in Western Europe. Clubs often fill after midnight. Tip: Plan dinner later and expect peak activity between 00:00–03:00."
  },
  {
    "id": "14",
    "coordinateX": 1,
    "coordinateY": 2.5,
    "category": "Etiquette",
    "title": "Kafana Culture",
    "description": "A kafana is not just a place to eat—it’s a social institution with music, long stays, and spontaneous atmosphere. Tip: Expect live music, flexible pacing, and a more informal dining structure."
  },
  {
    "id": "15",
    "coordinateX": 0,
    "coordinateY": 3.5,
    "category": "Gastronomy",
    "title": "Bread is a Staple",
    "description": "Bread is a staple and automatically included with most meals. Tip: It may be charged separately even if not ordered—this is standard practice."
  },
  {
    "id": "16",
    "coordinateX": 0,
    "coordinateY": -0.5,
    "category": "Safety",
    "title": "Health: Dental Tourism",
    "description": "Serbia is a premier dental tourism hub, offering elite care with savings up to 70% compared to Western Europe. Recommended Clinics: Cvejanović Clinic, Dental Clinic Beograd, and Dr. Popović."
  }
];

export const DID_YOU_KNOW: DidYouKnow[] = [
  {
    "id": "1",
    "fact": "Belgrade lies near Vinča–Belo Brdo, occupied c. 5700–4500 BCE (Vinča culture).",
    "whyItMatters": "This culture represents one of Europe's earliest complex societies, alongside Çatalhöyük and Jericho.",
    "translations": {
      "sr": {
        "fact": "Beograd leži blizu Vinče-Belo Brdo, naseljenog c. 5700–4500 p.n.e. (Vinčanska kultura).",
        "whyItMatters": "Ova kultura predstavlja jedno od najranijih složenih društava u Evropi."
      },
      "zh": {
        "fact": "贝尔格莱德位于温查-贝洛布尔多（Vinča–Belo Brdo）附近，约于公元前 5700-4500 年被占领（温查文化）。",
        "whyItMatters": "这种文化代表了欧洲最早的复杂社会之一，与恰塔霍裕克和耶利哥齐名。"
      }
    }
  },
  {
    "id": "2",
    "fact": "Belgrade’s strategic position on imperial frontiers led to dozens of sieges and rebuilds.",
    "whyItMatters": "The city has been destroyed and rebuilt over 40 times, reflecting its incredible resilience.",
    "translations": {
      "sr": {
        "fact": "Strateški položaj Beograda na granicama imperija doveo je do desetina opsada i obnova.",
        "whyItMatters": "Grad je uništen i obnavljan preko 40 puta, što odražava njegovu neverovatnu otpornost."
      },
      "zh": {
        "fact": "贝尔格莱德在帝国疆界上的战略位置导致了数十次的围攻和重建。",
        "whyItMatters": "这座城市被摧毁并重建了 40 多次，体现了其惊人的韧性。"
      }
    }
  },
  {
    "id": "3",
    "fact": "The city controls the junction of the Danube and Sava, a gateway between Central Europe and the Black Sea.",
    "whyItMatters": "This strategic node has been a critical military and trade point since the Roman Singidunum."
  },
  {
    "id": "4",
    "fact": "Kalemegdan Fortress contains layers of Roman, Byzantine, Serbian, Ottoman, and Austrian architecture.",
    "whyItMatters": "It is a physical history book of the Balkans, reflecting shifting powers over two millennia."
  },
  {
    "id": "5",
    "fact": "Belgrade houses the Nikola Tesla Museum, holding his personal archive and ashes.",
    "whyItMatters": "Tesla’s inventions in AC power and wireless technology laid the foundation for the modern world."
  },
  {
    "id": "6",
    "fact": "Serbia is digraphic, using both Cyrillic and Latin scripts interchangeably.",
    "whyItMatters": "This reflects its unique position between Eastern Orthodox and Western Catholic cultural spheres."
  },
  {
    "id": "7",
    "fact": "Saint Sava Temple is one of the largest Orthodox churches in the world.",
    "whyItMatters": "The interior is covered in millions of mosaic pieces, creating a breathtaking golden atmosphere."
  },
  {
    "id": "8",
    "fact": "The \"Vinča signs\" found on prehistoric pottery are argued by some to be the earliest form of writing.",
    "whyItMatters": "If true, it predates Sumerian cuneiform, highlighting the high sophistication of prehistoric Balkan culture."
  },
  {
    "id": "9",
    "fact": "Medieval fortresses like Golubac and Smederevo were built to control trade on the Danube.",
    "whyItMatters": "They served as vital customs and military posts protecting the critical river trade artery."
  },
  {
    "id": "10",
    "fact": "Belgrade’s \"splavovi\" are floating clubs and restaurants that define the city’s unique river life.",
    "whyItMatters": "They offer a vibrant nightlife experience where the party happens literally on the water."
  },
  {
    "id": "11",
    "fact": "Serbia is consistently one of the world’s top exporters of raspberries, known as \"red gold.\"",
    "whyItMatters": "The quality of the local raspberries is unparalleled, making them a cornerstone of the agricultural economy."
  },
  {
    "id": "12",
    "fact": "At least 17 Roman emperors were born on the territory of modern-day Serbia.",
    "whyItMatters": "This is the highest number of Roman emperors born outside of Italy, including Constantine the Great."
  },
  {
    "id": "13",
    "fact": "Savamala transformed from a neglected industrial district into Belgrade’s creative hub.",
    "whyItMatters": "It perfectly blends 19th-century architecture with cutting-edge street art and alternative nightlife."
  },
  {
    "id": "14",
    "fact": "The Iron Gates (Đerdap) is Europe’s longest and deepest gorge.",
    "whyItMatters": "It features Lepenski Vir, one of the oldest planned settlements in the world (c. 9500–6000 BCE)."
  },
  {
    "id": "15",
    "fact": "Beneath Belgrade lies a vast network of Roman wells, dungeons, and Cold War bunkers.",
    "whyItMatters": "This subterranean layer offers a hidden perspective on the city’s complex military history."
  },
  {
    "id": "16",
    "fact": "The \"kafana\" is a cultural institution where social and business life in Serbia happens.",
    "whyItMatters": "It’s where deals are made and songs are sung, reflecting the true heart of the Serbian spirit."
  },
  {
    "id": "17",
    "coordinateX": -1.5,
    "coordinateY": -2,
    "fact": "Josip Broz Tito was a founding member of the Non-Aligned Movement during the Cold War.",
    "whyItMatters": "His global influence was massive, as shown by his funeral being one of the largest in history."
  },
  {
    "id": "18",
    "coordinateX": -0.5,
    "coordinateY": -4,
    "fact": "For centuries, the Sava and Danube formed the border between the Ottoman and Austro-Hungarian Empires.",
    "whyItMatters": "This frontier history shaped the unique architecture, culture, and cuisine of northern Serbia."
  },
  {
    "id": "19",
    "coordinateX": -1.5,
    "coordinateY": -1,
    "fact": "Belgrade’s green markets (pijace) are the city’s pulse, selling products directly from farmers.",
    "whyItMatters": "They maintain a healthy farm-to-table tradition that predates modern global trends."
  },
  {
    "id": "20",
    "coordinateX": -1.5,
    "coordinateY": 0,
    "fact": "The name \"Beograd\" (White City) first appeared in 878 CE.",
    "whyItMatters": "It refers to the white limestone fortress that stood prominently above the river confluence."
  },
  {
    "id": "21",
    "coordinateX": -1.5,
    "coordinateY": -3,
    "fact": "Roman Singidunum hosted Legio IV Flavia Felix, guarding the vital Danube frontier.",
    "whyItMatters": "Folklore later reimagined the massive Roman ruins as walls built by giants."
  },
  {
    "id": "22",
    "coordinateX": -1,
    "coordinateY": -2.5,
    "fact": "Church bells ring at noon across Christendom to celebrate the 1456 defense of Belgrade.",
    "whyItMatters": "The victory against the Ottomans was so significant that the tradition is still observed today."
  },
  {
    "id": "23",
    "coordinateX": 2.5,
    "coordinateY": 1,
    "fact": "Thousands of Serbs migrated north across the Sava and Danube in 1690 (The Great Migration).",
    "whyItMatters": "This event fundamentally reshaped the demographic and cultural landscape of the region."
  },
  {
    "id": "24",
    "coordinateX": -4,
    "coordinateY": -3.5,
    "fact": "Belgrade claims to have opened Europe’s first kafana (coffee house) in 1522.",
    "whyItMatters": "It predates the coffee houses of London, Paris, and Vienna by more than a century."
  },
  {
    "id": "25",
    "coordinateX": -1.5,
    "coordinateY": -0.5,
    "fact": "During Ottoman rule, Belgrade was often called \"Dar al-Jihad\" or the \"House of Wars.\"",
    "whyItMatters": "Its strategic value made it a constant prize fought over by the Ottoman and Habsburg Empires."
  },
  {
    "id": "26",
    "coordinateX": 0,
    "coordinateY": -4,
    "fact": "The Avala Tower is a symbol of Belgrade’s resilience, rebuilt after the 1999 bombing.",
    "whyItMatters": "It remains the tallest structure in the Balkans and offers panoramic views of central Serbia."
  },
  {
    "id": "27",
    "coordinateX": -3.5,
    "coordinateY": 2.5,
    "fact": "The Pobednik (Victor) monument was moved to the fortress due to public outcry over its nudity.",
    "whyItMatters": "It has since become the city’s most famous landmark and a symbol of freedom."
  },
  {
    "id": "28",
    "coordinateX": -1,
    "coordinateY": -3.5,
    "fact": "The \"Roman Well\" in Belgrade Fortress was actually built by Austrians in the 18th century.",
    "whyItMatters": "Its 60-meter depth and eerie atmosphere inspired legends and even Alfred Hitchcock."
  },
  {
    "id": "29",
    "coordinateX": -1.5,
    "coordinateY": 3,
    "fact": "Strahinjića Bana street is nicknamed \"Silicon Valley\" for its glamorous 90s social life.",
    "whyItMatters": "It was the epicenter of high-end fashion and nightlife during a turbulent decade."
  },
  {
    "id": "30",
    "coordinateX": -1,
    "coordinateY": -3,
    "fact": "The Skull Tower (Ćele Kula) in Niš was built by Ottomans using the skulls of Serbian rebels.",
    "whyItMatters": "Intended as a warning, it became a powerful monument to the spirit of national resistance."
  },
  {
    "id": "31",
    "coordinateX": 2.5,
    "coordinateY": 2.5,
    "fact": "The White Palace (Beli Dvor) was built in the 1930s for the royal Karađorđević dynasty.",
    "whyItMatters": "It represents the peak of Serbian neoclassical architecture and hosted countless world leaders."
  },
  {
    "id": "32",
    "coordinateX": 1,
    "coordinateY": -4,
    "fact": "The House of Flowers is the final resting place of Yugoslavia’s leader, Josip Broz Tito.",
    "whyItMatters": "It is a site of pilgrimage for those seeking to understand the era of \"Brotherhood and Unity.\""
  },
  {
    "id": "33",
    "coordinateX": -2.5,
    "coordinateY": 2.5,
    "fact": "A genuine 3500-year-old Egyptian sphinx stands in the Royal Compound in Belgrade.",
    "whyItMatters": "A gift from Egypt in the 1920s, it is one of the most unique artifacts in the city."
  },
  {
    "id": "34",
    "coordinateX": 1.5,
    "coordinateY": -1,
    "fact": "Dorćol was the industrial heart of 19th-century Belgrade, home to its first power plant.",
    "whyItMatters": "It was the center of progress where the city first transitioned into a modern European capital."
  },
  {
    "id": "35",
    "coordinateX": -4,
    "coordinateY": 2.5,
    "fact": "Belgrade hosted the first cinema screening in the Balkans in 1896.",
    "whyItMatters": "It occurred just six months after the Lumière brothers’ invention debuted in Paris."
  },
  {
    "id": "36",
    "coordinateX": -2,
    "coordinateY": 0,
    "fact": "In the interwar period, Belgrade was celebrated as the \"Paris of the Balkans.\"",
    "whyItMatters": "Its vibrant bohemian lifestyle and French-inspired architecture defined the city’s golden age."
  },
  {
    "id": "37",
    "coordinateX": -2,
    "coordinateY": 3.5,
    "fact": "Belgrade is built over several underground rivers and streams that still flow today.",
    "whyItMatters": "These hidden waterways are now contained in massive tunnels beneath the city’s main streets."
  },
  {
    "id": "38",
    "coordinateX": -2.5,
    "coordinateY": -0.5,
    "fact": "The \"Bermuda Triangle\" was a legendary trio of kafanas where Belgrade’s intellectuals met.",
    "whyItMatters": "Šumatovac, Pod lipom, and Grmeč formed the epicenter of the city’s bohemian and cultural life."
  },
  {
    "id": "39",
    "coordinateX": 4,
    "coordinateY": 2.5,
    "fact": "The EXIT Festival takes place inside the historic 17th-century Petrovaradin Fortress.",
    "whyItMatters": "The fortress’s unique acoustics make it one of the most spectacular festival venues in the world."
  },
  {
    "id": "40",
    "coordinateX": -2.5,
    "coordinateY": 2,
    "fact": "The clock on Petrovaradin Fortress has reversed hands so fishermen could see it from the river.",
    "whyItMatters": "The big hand shows hours and the small hand shows minutes—a unique nautical adjustment."
  },
  {
    "id": "41",
    "coordinateX": 0,
    "coordinateY": 2.5,
    "fact": "Seven Serbian-American engineers played crucial roles in NASA’s Apollo 11 moon mission.",
    "whyItMatters": "Known as the \"Serbian Seven,\" they helped design the systems that put humans on the moon."
  },
  {
    "id": "42",
    "coordinateX": -0.5,
    "coordinateY": 3.5,
    "fact": "Lusatian Serbs (Sorbs) in Germany share a name but are a distinct Slavic ethnic group.",
    "whyItMatters": "They represent a branch of the tribe that stayed in the North during the Great Migrations."
  },
  {
    "id": "43",
    "coordinateX": -3,
    "coordinateY": -1,
    "fact": "Serbia has produced global scientific giants like Tesla, Pupin, Bošković, and Milanković.",
    "whyItMatters": "Their work in AC electricity, telephony, and climate cycles changed the course of human science."
  },
  {
    "id": "44",
    "coordinateX": -1.5,
    "coordinateY": -1.5,
    "fact": "Serbian Slava is a UNESCO-protected intangible heritage.",
    "whyItMatters": "It’s a unique family feast celebrating a patron saint, showing deep cultural family roots."
  },
  {
    "id": "45",
    "coordinateX": -2.5,
    "coordinateY": 0,
    "fact": "The first \"vampire\" described in literature came from a small Serbian village.",
    "whyItMatters": "Folk horror is part of the deep rural tradition, adding mystique to mountain tourism."
  }
];
