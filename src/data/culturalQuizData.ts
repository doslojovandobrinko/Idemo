/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuizQuestion {
  id: string;
  category: string;
  question: {
    en: string;
    sr: string;
    zh?: string;
  };
  options: {
    en: string[];
    sr: string[];
    zh?: string[];
  };
  correctAnswerIndex: number;
  explanation: {
    en: string;
    sr: string;
    zh?: string;
  };
  recommendedRecIds: string[];
}

export const CULTURAL_QUIZ_POOL: QuizQuestion[] = [
  {
    id: 'quiz-01-roman-emperors',
    category: 'Imperial Heritage',
    question: {
      en: 'How many Roman emperors were born on the territory of modern-day Serbia?',
      sr: 'Koliko je rimskih careva rođeno na teritoriji današnje Srbije?',
      zh: '有多少位罗马帝国皇帝出生在今天的塞尔维亚境内？'
    },
    options: {
      en: ['0', '5', '12', '17'],
      sr: ['0', '5', '12', '17'],
      zh: ['0位', '5位', '12位', '17位']
    },
    correctAnswerIndex: 3,
    explanation: {
      en: 'Exactly 17 Roman emperors were born on Serbian soil—the highest number anywhere outside of Italy—including Constantine the Great, Galerius, and Trajan Decius.',
      sr: 'Čak 17 rimskih careva rođeno je na tlu Srbije—najviše na svetu posle Italije—uključujući Konstantina Velikog, Galerija i Trajana Decija.',
      zh: '多达17位罗马皇帝出生在塞尔维亚这片土地上（仅次于意大利本土），包括君士坦丁大帝与伽列里乌斯。'
    },
    recommendedRecIds: ['16', '17'] // Felix Romuliana, Viminacium Archaeological Park
  },
  {
    id: 'quiz-02-titans-of-science',
    category: 'Scientific Heritage',
    question: {
      en: 'Which visionary titan of science patented the AC polyphase electrical system and has his personal archive preserved in a dedicated museum in Belgrade?',
      sr: 'Koji vizionarski naučni velikan je patentirao višefazni sistem naizmenične struje, a njegova lična arhiva se čuva u posvećenom muzeju u Beogradu?',
      zh: '哪位高瞻远瞩的科学巨匠发明了多相交流电系统，其珍贵个人档案保存在贝尔格莱德的专属博物馆中？'
    },
    options: {
      en: ['Nikola Tesla', 'Milutin Milanković', 'Mihajlo Pupin', 'Ruđer Bošković'],
      sr: ['Nikola Tesla', 'Milutin Milanković', 'Mihajlo Pupin', 'Ruđer Bošković'],
      zh: ['尼古拉·特斯拉', '米卢廷·米兰科维奇', '米海洛·普平', '鲁杰尔·博斯科维奇']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Nikola Tesla patented alternating current, the induction motor, and radio frequency systems. His working models, urn, and personal papers are safeguarded at the Nikola Tesla Museum in Belgrade.',
      sr: 'Nikola Tesla je patentirao naizmeničnu struju, indukcioni motor i radio-prenos. Njegovi radni modeli, urna i lična arhiva čuvaju se u Muzeju Nikole Tesle u Beogradu.',
      zh: '尼古拉·特斯拉为交流电与无线电技术奠定了基石。他的原始手稿、发明模型与骨灰金球皆珍藏于贝尔格莱德特斯拉博物馆。'
    },
    recommendedRecIds: ['7'] // Nikola Tesla Museum
  },
  {
    id: 'quiz-03-novak-djokovic-origins',
    category: 'Sporting Legends',
    question: {
      en: 'On which Serbian mountain resort did 24-time Grand Slam champion Novak Đoković hit his very first tennis balls at age 4 under legendary mentor Jelena Genčić?',
      sr: 'Na kojoj srpskoj planini je 24-struki grend slem šampion Novak Đoković sa 4 godine odigrao svoje prve teniske udarce pod vođstvom Jelene Genčić?',
      zh: '24座大满贯得主诺瓦克·德约科维奇4岁时在塞尔维亚哪座高山度假胜地首次挥拍受训？'
    },
    options: {
      en: ['Kopaonik Mountain Resort', 'Zlatibor Pine Plateau', 'Tara National Park', 'Fruška Gora'],
      sr: ['Planinski centar Kopaonik', 'Zlatibor', 'Nacionalni park Tara', 'Fruška gora'],
      zh: ['科帕奥尼克高山度假区', '兹拉蒂博尔松林高原', '塔拉国家公园', '弗鲁什卡格拉']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Novak’s parents ran a parlor on Mount Kopaonik, where renowned tennis coach Jelena Genčić first spotted the prodigy practicing on high-altitude courts.',
      sr: 'Novakovi roditelji vodili su restoran na Kopaoniku, gde je legendarna Jelena Genčić prvi put uočila njegov vanserijski talenat na planinskim terenima.',
      zh: '德约科维奇童年随父母在科帕奥尼克山经营餐馆，名帅耶莱娜·根契奇正是在这里的高山网球场发掘了这位未来的王者。'
    },
    recommendedRecIds: ['57'] // Kopaonik Mountain Resort
  },
  {
    id: 'quiz-04-nikola-jokic-hometown',
    category: 'Bačka Culture & Sport',
    question: {
      en: 'NBA Finals MVP Nikola Jokić is famously loyal to his hometown in Vojvodina, celebrated for horse breeding, acoustic tamburica lutherie, and serene green avenues. Which city is it?',
      sr: 'NBA šampion i MVP Nikola Jokić izuzetno je privržen svom rodnom vojvođanskom gradu, poznatom po konjarstvu, izradi tamburica i zelenim alejama. Koji je to grad?',
      zh: 'NBA总冠军兼总决赛MVP尼古拉·约基奇极为眷恋其家乡——一座以良种赛马、手工冬不拉乐器坊和幽静林荫道闻名的伏伊伏丁那名城。这是哪座城市？'
    },
    options: {
      en: ['Sombor', 'Novi Sad', 'Subotica', 'Zrenjanin'],
      sr: ['Sombor', 'Novi Sad', 'Subotica', 'Zrenjanin'],
      zh: ['松博尔 (Sombor)', '诺维萨德 (Novi Sad)', '苏博蒂察 (Subotica)', '兹雷尼亚宁 (Zrenjanin)']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Nikola Jokić spends his NBA off-seasons in Sombor tending to his harness trotters and enjoying peaceful Bačka salaš gastronomy and acoustic tamburica music.',
      sr: 'Nikola Jokić svaku pauzu u NBA provodi u rodnom Somboru, posvećen konjičkom sportu, tamburaškoj muzici i mirnom salašarskom ritmu Bačke.',
      zh: '约基奇休赛期常驻故乡松博尔，照顾其纯种驾车马，徜徉于传统农庄与纯正的巴奇卡民间弦乐传统中。'
    },
    recommendedRecIds: ['G-04', '155'] // Sombor Tamburica Workshops, Majkin Salaš
  },
  {
    id: 'quiz-05-constantine-the-great',
    category: 'Imperial Heritage',
    question: {
      en: 'Which modern Serbian city was the birthplace of Constantine the Great, the Roman emperor who legalized Christianity in 313 AD?',
      sr: 'Koji savremeni grad u Srbiji je rodno mesto Konstantina Velikog, rimskog cara koji je 313. godine Milanskim ediktom priznao hrišćanstvo?',
      zh: '于公元313年颁布《米兰敕令》使基督教合法化的罗马皇帝君士坦丁大帝，出生在今天塞尔维亚的哪座城市？'
    },
    options: {
      en: ['Niš (Ancient Naissus)', 'Belgrade (Singidunum)', 'Sremska Mitrovica (Sirmium)', 'Zaječar (Romuliana)'],
      sr: ['Niš (antički Naissus)', 'Beograd (Singidunum)', 'Sremska Mitrovica (Sirmium)', 'Zaječar (Romuliana)'],
      zh: ['尼什 (古代纳伊苏斯)', '贝尔格莱德 (辛吉杜努姆)', '斯雷姆斯卡米特罗维察 (西尔米乌姆)', '扎耶查尔 (罗慕利亚纳)']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Constantine the Great was born in ancient Naissus (modern Niš) around 272 AD. Visitors can explore his imperial summer residence at the Mediana Archaeological Site.',
      sr: 'Konstantin Veliki rođen je u antičkom Naisusu (današnji Niš) oko 272. godine. Njegova carska rezidencija danas se može posetiti na lokalitetu Medijana.',
      zh: '君士坦丁大帝约于公元272年出生在古代纳伊苏斯（今尼什），其奢华的夏宫遗址如今即为著名的麦迪亚纳考古公园。'
    },
    recommendedRecIds: ['49'] // Mediana Archaeological Site
  },
  {
    id: 'quiz-06-danube-mesolithic',
    category: 'Prehistoric Archaeology',
    question: {
      en: 'Dating back over 8,000 years, Europe’s most significant Mesolithic settlement featuring monumental fish-human stone sculptures is located at which Danube site?',
      sr: 'Na kom dunavskom lokalitetu se nalazi najvažnije evropsko mezolitsko naselje staro preko 8.000 godina, poznato po monumentalnim ribolikim kamenim skulpturama?',
      zh: '距今8000多年、拥有独特鱼人雕像的欧洲最重要中石器时代文明聚落遗址，位于多瑙河畔的何处？'
    },
    options: {
      en: ['Lepenski Vir', 'Vinča Belo Brdo', 'Starčevo', 'Gamzigrad'],
      sr: ['Lepenski Vir', 'Vinča Belo Brdo', 'Starčevo', 'Gamzigrad'],
      zh: ['莱彭斯基维尔 (Lepenski Vir)', '温查白山 (Vinča)', '斯塔尔切沃 (Starčevo)', '加姆济格勒 (Gamzigrad)']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Lepenski Vir in the Iron Gates gorge reveals Europe’s oldest planned stone dwellings and enigmatic trapezoidal architecture facing the Danube whirlpools.',
      sr: 'Lepenski Vir u Đerdapskoj klisuri otkriva najstarije planski građeno naselje u Evropi sa enigmatičnim trapezoidnim kućama i kamenim skulpturama.',
      zh: '莱彭斯基维尔位于铁门峡谷入口，见证了欧洲最早的定居规划和面向多瑙河漩涡的神秘拟人化巨石艺术。'
    },
    recommendedRecIds: ['20'] // Lepenski Vir
  },
  {
    id: 'quiz-07-golubac-fortress',
    category: 'Medieval Fortresses',
    question: {
      en: 'Which 14th-century fortress, perched on sheer cliff walls where the Danube narrows into the Iron Gates, boasts 10 imposing defensive towers?',
      sr: 'Koja tvrđava iz 14. veka, smeštena na strmim liticama gde se Dunav sužava u Đerdapsku klisuru, ima 10 impozantnih odbrambenih kula?',
      zh: '哪座雄踞于多瑙河进入铁门峡谷隘口绝壁之上、拥有10座巍峨防御石塔的14世纪中世纪城堡？'
    },
    options: {
      en: ['Golubac Fortress', 'Petrovaradin Fortress', 'Smederevo Fortress', 'Kalemegdan'],
      sr: ['Golubačka tvrđava', 'Petrovaradinska tvrđava', 'Smederevska tvrđava', 'Kalemegdan'],
      zh: ['戈卢巴茨要塞 (Golubac)', '彼得罗瓦拉丁城堡', '斯梅代雷沃城堡', '卡莱梅格丹城堡']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Golubac Fortress guarded the entrance to the Iron Gates gorge, witnessing fierce medieval battles between Hungarian knights, Serbian despots, and Ottoman forces.',
      sr: 'Golubačka tvrđava je stražarila na ulazu u Đerdap i bila poprište velikih bitaka između srpskih vladara, ugarskih vitezova i osmanske vojske.',
      zh: '戈卢巴茨城堡扼守多瑙河铁门峡谷天险，其石塔直插波涛，是巴尔干军事建筑与河岸景观的登峰造极之作。'
    },
    recommendedRecIds: ['19'] // Golubac Fortress
  },
  {
    id: 'quiz-08-manasija-monastery',
    category: 'Medieval Monasteries',
    question: {
      en: 'Founded by Despot Stefan Lazarević in the early 15th century, which fortified monastery is encircled by 11 massive stone defensive towers and housed the famed Resava Scriptorium?',
      sr: 'Koji utvrđeni manastir, zadužbina despota Stefana Lazarevića iz 15. veka, okružen je sa 11 masivnih kamenih kula i bio je sedište čuvene Resavske prepisivačke škole?',
      zh: '由斯特凡·拉扎列维奇大公于15世纪初奠基、被11座巨型防御石塔环抱并曾作为著名雷萨瓦手抄经院的是哪座修道院？'
    },
    options: {
      en: ['Manasija Monastery (Resava)', 'Studenica Monastery', 'Žiča Monastery', 'Ravanica Monastery'],
      sr: ['Manastir Manasija (Resava)', 'Manastir Studenica', 'Manastir Žiča', 'Manastir Ravanica'],
      zh: ['马纳西亚修道院 (雷萨瓦)', '斯图代尼察修道院', '日恰修道院', '拉瓦尼察修道院']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Manasija is a masterpiece of the Morava architectural school. Its formidable defensive walls sheltered master scribes who painstakingly preserved European medieval manuscripts.',
      sr: 'Manasija je vrhunac moravske škole graditeljstva čiji su moćni bedemi štitili prepisivače i sačuvali neprocenjivu srednjovekovnu pismenost.',
      zh: '马纳西亚修道院拥有独特的11塔防御城墙，其内部圣殿绘制的“圣武士”壁画被誉为拜占庭晚期艺术的最高造诣。'
    },
    recommendedRecIds: ['2'] // Manasija Monastery
  },
  {
    id: 'quiz-09-saint-sava-temple',
    category: 'Sacred Architecture',
    question: {
      en: 'Dominating Belgrade’s skyline on the Vračar plateau, the Temple of Saint Sava is celebrated for having one of the world’s largest church interiors lined with over 15,000 m² of which material?',
      sr: 'Dominirajući panoramom Beograda na Vračarskom platou, Hram Svetog Save poznat je po tome što ima jedan od najvećih crkvenih enterijera na svetu ukrašen sa preko 15.000 m² kog materijala?',
      zh: '耸立于贝尔格莱德弗拉查尔高地的圣萨瓦大教堂，以其逾15,000平方米的何种材质装点殿堂而跻身世界最大东正教建筑群？'
    },
    options: {
      en: ['Golden Glass Mosaic', 'White Carrara Marble', 'Gilded Fresco Tempera', 'Carved Walnut Wood'],
      sr: ['Zlatni stakleni mozaik', 'Beli karara mermer', 'Pozlaćena fresko tempera', 'Duborez u orahovini'],
      zh: ['金箔玻璃马赛克镶嵌', '白色卡拉拉大理石', '镀金蛋彩壁画', '精雕胡桃木']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'The Temple of Saint Sava features breathtaking golden glass mosaics crafted by hundreds of master artists, covering its monumental central dome and vaults.',
      sr: 'Hram Svetog Save krasi preko 15.000 kvadratnih metara blistavog zlatnog staklenog mozaika koji pokriva monumentalnu kupolu i potkupolni prostor.',
      zh: '圣萨瓦大教堂的穹顶与拱券全部由数以百万计的威尼斯彩色玻璃与金箔马赛克微粒拼就，金碧辉煌，气势恢宏。'
    },
    recommendedRecIds: ['54'] // Temple of Saint Sava
  },
  {
    id: 'quiz-10-royal-oplenac',
    category: 'Dynastic Heritage',
    question: {
      en: 'In which hilltop church near Topola are members of the Serbian royal Karađorđević dynasty interred under 40 million mosaic tesserae reproducing medieval masterpieces?',
      sr: 'U kojoj crkvi na brdu kod Topole su sahranjeni članovi kraljevske dinastije Karađorđević pod mozaikom od 40 miliona kockica koje reprodukuju srednjovekovne freske?',
      zh: '塞尔维亚卡拉乔尔杰维奇王室成员安息于托波拉附近的哪座高山教堂内？该教堂由4000万块微型马赛克拼缀复刻了中世纪壁画巅峰之作。'
    },
    options: {
      en: ['Oplenac (Saint George’s Church)', 'Kalemegdan Ružica', 'Petrovaradin Chapel', 'Topčider Church'],
      sr: ['Oplenac (Crkva Svetog Đorđa)', 'Ružica na Kalemegdanu', 'Kapela na Petrovaradinu', 'Topčiderska crkva'],
      zh: ['奥普莱纳克 (圣乔治皇家教堂)', '卡莱梅格丹鲁日察教堂', '彼得罗瓦拉丁礼拜堂', '托普契德尔教堂']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Saint George’s Church on Oplenac hill in Topola houses the crypt of the Karađorđević dynasty, illuminated by 725 mosaic compositions replicating 60 Serbian monasteries.',
      sr: 'Crkva Svetog Đorđa na Oplencu čuva kraljevsku kriptu dinastije Karađorđević sa 725 mozaičkih kompozicija koje verno oslikavaju najlepše srpske srednjovekovne freske.',
      zh: '奥普莱纳克圣乔治教堂是塞尔维亚王室陵寝所在地，其内部汇聚了全欧最繁复奢华的拜占庭风格复刻马赛克艺术。'
    },
    recommendedRecIds: ['56'] // Oplenac & Royal Mausoleum
  },
  {
    id: 'quiz-11-uvac-meanders',
    category: 'Pristine Nature',
    question: {
      en: 'The dramatic turquoise ribbon loops of the Uvac River Gorge are globally renowned as the premier sanctuary for which majestic, once-endangered bird of prey?',
      sr: 'Dramatične tirkizne meandre reke Uvac svetski su poznate kao glavno stanište i utočište za koju veličanstvenu, nekada ugroženu pticu grabljivicu?',
      zh: '乌瓦茨河峡谷那如绿松石缎带般的壮丽连续蛇形河湾，是哪种曾濒临灭绝的珍稀猛禽在欧洲的重要栖息保护区？'
    },
    options: {
      en: ['Griffon Vulture (Beloglavi sup)', 'Golden Eagle', 'Peregrine Falcon', 'Imperial Eagle'],
      sr: ['Beloglavi sup (Griffon Vulture)', 'Suri orao', 'Sivi soko', 'Krstaš'],
      zh: ['白头秃鹫 (Griffon Vulture)', '金雕', '游隼', '白肩雕']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Uvac Special Nature Reserve rescued the Eurasian Griffon Vulture from extinction in the region; with a wingspan up to 3 meters, hundreds now soar above the dramatic canyon meanders.',
      sr: 'Specijalni rezervat prirode Uvac uspešno je sačuvao beloglavog supa od izumiranja; sa rasponom krila do 3 metra, ove impresivne ptice ponovo vladaju nebom kanjona.',
      zh: '乌瓦茨特级自然保护区是白头秃鹫的复育摇篮。这种翼展可达近3米的空中霸主每日在百米悬崖与蛇形碧波上空翱翔巡弋。'
    },
    recommendedRecIds: ['1'] // Uvac Meanders
  },
  {
    id: 'quiz-12-djavolja-varos',
    category: 'Geological Wonders',
    question: {
      en: 'Which striking geological phenomenon on Radan Mountain consists of 202 sculpted earth pyramids capped with andesite stone blocks, formed by millions of years of erosion?',
      sr: 'Koji upečatljivi geomorfološki fenomen na planini Radan čini 202 zemljane piramide sa kamenim andezitskim kapama, nastale milionima godina erozije?',
      zh: '位于拉丹山、由数百万年风雨侵蚀塑造出的202座顶戴安山岩石帽的奇特土柱群地质奇观被称为：'
    },
    options: {
      en: ['Đavolja Varoš (Devil’s Town)', 'Resava Cave Formations', 'Vratna Natural Gates', 'Prilepac Gorge'],
      sr: ['Đavolja Varoš (Devil’s Town)', 'Resavska pećina', 'Vratnjanske kapije', 'Prilepački kanjon'],
      zh: ['魔鬼城 (Đavolja Varoš)', '雷萨瓦溶洞岩柱', '弗拉特纳天然石门', '普里莱帕克峡谷']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Đavolja Varoš features 202 natural spires reaching up to 15 meters in height, flanked by two highly acidic mineral springs steeped in local folklore.',
      sr: 'Đavolja Varoš sadrži 202 zemljane kule visoke do 15 metara sa kamenim blokovima na vrhu, okružene mineralnim izvorima sa izuzetno kiselom vodom.',
      zh: '魔鬼城是入选世界自然奇观提名的地质奇观，土柱最高达15米，且常年流淌着富含矿物质与强酸性的罕见红色泉水。'
    },
    recommendedRecIds: ['13'] // Đavolja Varoš
  },
  {
    id: 'quiz-13-tara-national-park',
    category: 'Pristine Nature',
    question: {
      en: 'Which pristine western Serbian national park is famous for the Banjska Stena viewpoint over Drina Canyon, thick old-growth forests, and the endemic Pančić’s Spruce?',
      sr: 'Koji zapadnosrpski nacionalni park je čuven po vidikovcu Banjska stena nad kanjonom Drine, gustim prašumama i endemskoj Pančićevoj omorici?',
      zh: '塞尔维亚西部哪座原始国家公园以俯瞰德里纳峡谷的班尼斯卡石台眺望点、茂密原始针叶林与孑遗活化石“潘契奇云杉”著称？'
    },
    options: {
      en: ['Tara National Park', 'Fruška Gora', 'Kopaonik', 'Đerdap National Park'],
      sr: ['Nacionalni park Tara', 'Fruška gora', 'Kopaonik', 'Nacionalni park Đerdap'],
      zh: ['塔拉国家公园 (Tara)', '弗鲁什卡格拉', '科帕奥尼克', '捷尔达普国家公园']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Tara National Park protects dense spruce-fir forests, home to brown bears, chamois, and the rare relic spruce discovered in 1875 by Serbian botanist Josif Pančić.',
      sr: 'Nacionalni park Tara dom je mrkog medveda, divokoza i tercijarnog relikta Pančićeve omorike koju je 1875. otkrio botaničar Josif Pančić.',
      zh: '塔拉国家公园不仅是欧洲野生棕熊的核心保护地，还生长着冰河时期遗存至今的珍贵潘契奇云杉（塞尔维亚云杉）。'
    },
    recommendedRecIds: ['32'] // Tara National Park
  },
  {
    id: 'quiz-14-exit-festival-fortress',
    category: 'Festivals & Nightlife',
    question: {
      en: 'Which internationally acclaimed music festival unfolds every July inside the stone moats and ramparts of the 17th-century Petrovaradin Fortress overlooking the Danube?',
      sr: 'Koji međunarodno nagrađivani muzički festival se svakog jula održava u kamenim rovovima i na bedemima Petrovaradinske tvrđave iz 17. veka iznad Dunava?',
      zh: '每年七月在俯瞰多瑙河的17世纪彼得罗瓦拉丁城堡石质城壕与堡垒群中震撼开场的享誉国际的音乐节是：'
    },
    options: {
      en: ['EXIT Festival', 'Arsenal Fest', 'Belgrade Beer Fest', 'Guča Trumpet Festival'],
      sr: ['EXIT Festival', 'Arsenal Fest', 'Belgrade Beer Fest', 'Guča trubački sabor'],
      zh: ['EXIT音乐节 (出口音乐节)', '阿森纳音乐节', '贝尔格莱德啤酒节', '古查铜管小号狂欢节']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Founded as a student movement in 2000, EXIT at Petrovaradin Fortress in Novi Sad has twice won Best Major European Festival, famed for its world-class Dance Arena.',
      sr: 'Nastao iz studentskog pokreta 2000. godine, EXIT na Petrovaradinskoj tvrđavi u Novom Sadu višestruki je dobitnik nagrade za najbolji evropski festival.',
      zh: 'EXIT音乐节两度荣膺欧洲最佳大型音乐节桂冠，其舞曲竞技场（Dance Arena）坐落于高大古城墙之间，日出时分的电音盛景举世闻名。'
    },
    recommendedRecIds: ['99'] // EXIT Festival
  },
  {
    id: 'quiz-15-belgrade-modernism-art',
    category: 'Architecture & Art',
    question: {
      en: 'Designed by Ivan Antić and Ivanka Raspopović in 1965, which riverside museum consists of six crystalline cubes in Ušće Park celebrating Yugoslav and Serbian avant-garde art?',
      sr: 'Koji muzej na reci, delo arhitekata Ivana Antića i Ivanke Raspopović iz 1965. godine, čini šest kristalnih kubusa u parku Ušće posvećenih avangardnoj umetnosti?',
      zh: '由伊万·安蒂奇与伊万卡·拉斯波波维奇于1965年设计的、坐落于乌什切公园并由六个晶体立方体构成的河畔先锋美术馆是：'
    },
    options: {
      en: ['Museum of Contemporary Art (MSUB)', 'National Museum of Serbia', 'Museum of Applied Art', 'Zepter Museum'],
      sr: ['Muzej savremene umetnosti (MSUB)', 'Narodni muzej Srbije', 'Muzej primenjene umetnosti', 'Zepter muzej'],
      zh: ['贝尔格莱德当代艺术博物馆 (MSUB)', '塞尔维亚国家博物馆', '应用艺术博物馆', '齐普特博物馆']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'The Museum of Contemporary Art Belgrade (MSUB) in Ušće Park is a pinnacle of Yugoslav modernism, bathed in natural skylight at the confluence of the Sava and Danube.',
      sr: 'Muzej savremene umetnosti na Ušću predstavlja remek-delo jugoslovenskog modernizma, sa prirodnim zenitalnim svetlom na samom ušću Save u Dunav.',
      zh: '贝尔格莱德当代艺术博物馆宛若洒落在萨瓦河与多瑙河交汇处湿地上的水晶几何体，完整珍藏了20世纪巴尔干现代艺术精粹。'
    },
    recommendedRecIds: ['149'] // Museum of Contemporary Art Belgrade
  },
  {
    id: 'quiz-16-naive-art-kovacica',
    category: 'Folk Art & Heritage',
    question: {
      en: 'Which Banat village is internationally recognized as the cradle of Slovak Naïve Art painting, where artists like Zuzana Chalupová turned rural daily life into collector masterpieces?',
      sr: 'Koje banatsko selo je međunarodno priznato kao prestonica slovačkog naivnog slikarstva, gde su umetnici poput Zuzane Halupove pretvorili seoski život u remek-dela?',
      zh: '哪个巴纳特村镇被公认为斯洛伐克族素朴派民间画派的国际摇篮？包括祖扎娜·哈鲁波娃在内的无师自通画家将田园日常升华为艺术瑰宝。'
    },
    options: {
      en: ['Kovačica', 'Bački Petrovac', 'Sremski Karlovci', 'Bela Crkva'],
      sr: ['Kovačica', 'Bački Petrovac', 'Sremski Karlovci', 'Bela Crkva'],
      zh: ['科瓦契察 (Kovačica)', '巴奇基彼得罗瓦茨', '斯雷姆斯基卡尔洛夫奇', '贝拉茨尔克瓦']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Kovačica Naïve Art is renowned worldwide for its radiant depictions of wheat harvests, folklore costumes, and village celebrations, preserved in authentic home ateliers.',
      sr: 'Kovačičko naivno slikarstvo slavno je širom sveta po živopisnim prikazima seoskog života, žetve i narodnih nošnji u kućnim ateljeima.',
      zh: '科瓦契察的朴素派油画享有联合国教科文组织非遗美誉，画家们自制画布，以浓郁明媚的色彩描绘多瑙河平原的婚丧嫁娶与麦浪金秋。'
    },
    recommendedRecIds: ['21'] // Kovačica Naïve Art
  },
  {
    id: 'quiz-17-sirogojno-wool',
    category: 'Crafts & Heritage',
    question: {
      en: 'Which open-air ethno-museum on Mount Zlatibor preserves authentic 19th-century Dinaric timber log cabins and the world-famous hand-knitted sheep’s wool sweaters?',
      sr: 'Koji muzej na otvorenom na Zlatiboru čuva autentične dinarske brvnare iz 19. veka i svetski poznate ručno pletene džempere od ovčije vune?',
      zh: '兹拉蒂博尔山上哪座露天生态民俗博物馆完整保存了19世纪迪纳拉木构原木屋舍，以及名扬巴黎米兰时装周的传统手工纯羊毛编织毛衣？'
    },
    options: {
      en: ['Sirogojno Open-Air Museum (Staro Selo)', 'Drvengrad Mokra Gora', 'Tršić Ethno Complex', 'Goračići Village'],
      sr: ['Staro selo Sirogojno', 'Drvengrad Mokra Gora', 'Etno-kompleks Tršić', 'Selo Goračići'],
      zh: ['希罗戈伊诺“老村”露天博物馆 (Sirogojno)', '木头村 (Drvengrad)', '特尔希奇生态综合体', '戈拉奇契村']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Staro Selo Sirogojno showcases 50 relocated historic wooden dwellings and celebrates the master knitters of Zlatibor whose pure wool garments were worn by royalty and style icons globally.',
      sr: 'Staro selo Sirogojno predstavlja 50 autentičnih zlatiborskih brvnara i slavi veštinu lokalnih pletilja čiji su vuneni odevni komadi obišli svetske modne piste.',
      zh: '希罗戈伊诺露天博物馆将整座古老村落原真迁移保护，这里出产的纯羊毛提花外套曾被多国政要与名流竞相订购收藏。'
    },
    recommendedRecIds: ['44'] // Sirogojno Open-Air Museum
  },
  {
    id: 'quiz-18-pirot-kilim',
    category: 'Living Traditions',
    question: {
      en: 'Woven on vertical looms using Balkan Pramenka sheep’s wool without any knots, which UNESCO-candidate textile features 95 ancient geometric symbols like the Sovra and Turtle?',
      sr: 'Tkan na vertikalnim razbojima od vune autohtone pramenke bez ijednog čvora, koji tekstilni dragulj ima 95 drevnih geometrijskih šara poput sovre i kornjače?',
      zh: '在竖式织机上采用巴尔干原生普拉门卡羊毛纯手工无结编织、拥有95种如“八角宝座”与“灵龟”等古老几何图腾的丝毯杰作是：'
    },
    options: {
      en: ['Pirot Kilim (Pirotski ćilim)', 'Stapar Rug', 'Banat Wool Tapestry', 'Sandžak Kelim'],
      sr: ['Pirotski ćilim', 'Staparski ćilim', 'Banatski goblen', 'Sandžački ćilim'],
      zh: ['皮罗特平纹提花地毯 (Pirot Kilim)', '斯塔帕尔毯', '巴纳特羊毛挂毯', '桑扎克基里姆']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Pirot kilims are flat-weave masterpieces identical on both sides, prized for centuries by Ottoman sultans, Serbian royal courts, and international collectors.',
      sr: 'Pirotski ćilim je remek-delo glatkog tkanja identično sa lica i naličja, vekovima cenjeno na carskim dvorovima od Carigrada do Beča.',
      zh: '皮罗特地毯正反两面纹理完全一致，天然植物染色经百年不褪，被誉为巴尔干织物艺术皇冠上的明珠。'
    },
    recommendedRecIds: ['67'] // Pirot Kilim Workshop
  },
  {
    id: 'quiz-19-princess-ljubica-residence',
    category: 'Urban History',
    question: {
      en: 'Which 1831 residence on Kosančićev Venac blends Ottoman divanhana wooden salons with Central European Biedermeier furniture, built for the wife of Prince Miloš Obrenović?',
      sr: 'Koji konak iz 1831. godine na Kosančićevom vencu spaja osmansku divanhanu i evropski bidermajer enterijer, a sagrađen je za suprugu kneza Miloša Obrenovića?',
      zh: '位于贝尔格莱德考桑契奇环形高地、建于1831年、将奥斯曼式挑梁木榻客厅与中欧比德迈风格家具完美融合的米洛什大公夫人官邸是：'
    },
    options: {
      en: ['Princess Ljubica’s Residence (Konak)', 'Prince Miloš’s Topčider Residence', 'Captain Miša’s Mansion', 'Belgrade City Palace'],
      sr: ['Konak kneginje Ljubice', 'Milošev konak u Topčideru', 'Kapetan-Mišino zdanje', 'Stari dvor'],
      zh: ['柳比察王妃宫邸 (Konak kneginje Ljubice)', '托普契德尔米洛什王府', '米沙船长宫殿', '老王宫']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Konak kneginje Ljubice represents the transitional architecture of 19th-century Belgrade as Serbia asserted its cultural independence from Ottoman rule toward European statehood.',
      sr: 'Konak kneginje Ljubice svedoči o prelaznom stilu 19. veka kada se Beograd transformisao iz orijentalne varoši u modernu evropsku prestonicu.',
      zh: '柳比察王妃宫邸真实见证了19世纪初塞尔维亚脱离奥斯曼帝国统治、迈向近代欧洲文明国家时期的建筑转型典范。'
    },
    recommendedRecIds: ['150'] // Princess Ljubica’s Residence
  },
  {
    id: 'quiz-20-bajrakli-mosque',
    category: 'Multiconfessional Belgrade',
    question: {
      en: 'Built around 1575 in the vibrant historic neighborhood of Dorćol, which is the sole surviving Ottoman mosque among Belgrade’s hundreds of former Islamic sanctuaries?',
      sr: 'Sagrađena oko 1575. u istorijskom Dorćolu, koja je jedina sačuvana osmanska džamija od nekadašnjih stotina islamskih bogomolja u Beogradu?',
      zh: '始建于约1575年、坐落于多尔乔尔历史街区、作为贝尔格莱德历史上数百座伊斯兰礼拜建筑中仅存的奥斯曼清真寺是：'
    },
    options: {
      en: ['Bajrakli Mosque', 'Batal Mosque', 'Defterdar Mosque', 'Sultan Mahmud Mosque'],
      sr: ['Bajrakli džamija', 'Batal džamija', 'Defterdarova džamija', 'Džamija sultana Mahmuda'],
      zh: ['巴伊拉克利清真寺 (Bajrakli Mosque)', '巴塔尔清真寺', '德夫特达尔清真寺', '苏丹马哈茂德清真寺']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Bajrakli Mosque earned its name from the signal flag (barjak) historically raised from its minaret to coordinate prayer times across Belgrade’s mosques.',
      sr: 'Bajrakli džamija je dobila ime po barjaku koji se na njoj isticao kao znak za početak molitve u svim ostalim beogradskim džamijama.',
      zh: '巴伊拉克利（意为“悬旗”）清真寺因当年宣礼塔上挂旗指挥全市清真寺同步礼拜而得名，是贝尔格莱德多元宗教交融的珍贵见证。'
    },
    recommendedRecIds: ['153'] // Bajrakli Mosque
  },
  {
    id: 'quiz-21-tri-sesira-skadarlija',
    category: 'Bohemian Gastronomy',
    question: {
      en: 'Dating back to 1864 in the cobblestone bohemian quarter of Skadarlija, which legendary kafana owes its name to an old hatmaker’s workshop sign?',
      sr: 'Osnovana davne 1864. godine u kaldrmisanoj boemskoj četvrti Skadarlija, koja legendarna kafana nosi ime po natpisu sa nekadašnje šeširdžijske radionice?',
      zh: '创立于1864年、坐落在斯卡达利亚鹅卵石步行街上的传奇波西米亚风格传统餐馆，因当年旧帽匠铺招牌而得名的是：'
    },
    options: {
      en: ['Tri Šešira (Three Hats)', 'Dva Jelena (Two Deers)', 'Zlatni Bokal (Golden Chalice)', 'Ima Dana (There Are Days)'],
      sr: ['Tri Šešira', 'Dva Jelena', 'Zlatni Bokal', 'Ima Dana'],
      zh: ['三顶帽子餐厅 (Tri Šešira)', '两只鹿餐厅 (Dva Jelena)', '金酒壶餐厅', '来日方长餐厅']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Tri Šešira has welcomed poets, presidents, and artists for over 160 years, maintaining authentic candlelit tables, slow-roasted roštilj, and acoustic starogradska violinists.',
      sr: 'Tri Šešira već više od 16 decenija okupljaju umetnike i putnike uz roštilj na ćumuru, starogradsku muziku i autentični beogradski šarm.',
      zh: '三顶帽子餐厅曾招待过从英国女王到吉米·亨德里克斯等众多历史名流，保留着炭火烤肉与现场小提琴伴奏的纯正老城待客传统。'
    },
    recommendedRecIds: ['33'] // Tri Šešira
  },
  {
    id: 'quiz-22-zemun-gardos-kafanas',
    category: 'Riverside Culture',
    question: {
      en: 'Which historic Danube quarter of Belgrade, defined by Central European Habsburg facades and the 1896 Millennium Tower (Gardoš), is world-famous for its fish stew kafanas?',
      sr: 'Koji istorijski dunavski deo Beograda sa habsburškom arhitekturom i Milenijumskom kulom na Gardošu iz 1896. je slavan po ribljim čorbama u kafanama uz reku?',
      zh: '贝尔格莱德哪座拥有浓郁哈布斯堡王朝风貌、坐拥1896年千禧塔（加尔多什塔）的多瑙河畔古老街区，以河鲜鱼汤与传统水上酒家闻名？'
    },
    options: {
      en: ['Old Zemun', 'Dorćol', 'Savamala', 'Vračar'],
      sr: ['Stari Zemun', 'Dorćol', 'Savamala', 'Vračar'],
      zh: ['泽蒙老城 (Zemun)', '多尔乔尔', '萨瓦马拉', '弗拉查尔']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Zemun operated under Austro-Hungarian administration until the 20th century. Its riverside quay is celebrated for fresh Danube carp, catfish stew, and acoustic tamburica evenings.',
      sr: 'Zemun je vekovima baštinio srednjoevropsku tradiciju; njegov kej uz Dunav sinonim je za svežu dunavsku ribu, riblju čorbu u kotliću i tamburaše.',
      zh: '泽蒙保留着典雅的中欧古典街巷格局，其河滨大道汇聚了无数现煮多瑙河鲤鱼汤锅与弦乐飘荡的慢调水岸餐馆。'
    },
    recommendedRecIds: ['58'] // Kafanas of Old Zemun
  },
  {
    id: 'quiz-23-unesco-sljivovica',
    category: 'Gastro Heritage',
    question: {
      en: 'In 2022, UNESCO inscribed which traditional Serbian fruit spirit ritual—traditionally distilled from autochthonous plums like Požegača and Crvena Ranka—on its Intangible Cultural Heritage list?',
      sr: 'Koji tradicionalni ritual pripreme i ispijanja voćne rakije od autohtonih šljiva poput požegače i crvene ranke je UNESKO 2022. upisao na listu nematerijalnog kulturnog nasleđa?',
      zh: '2022年，联合国教科文组织将塞尔维亚采用本土红蓝李古法双重蒸馏的何种传统烈酒仪式列入人类非物质文化遗产名录？'
    },
    options: {
      en: ['Šljivovica (Plum Rakija)', 'Pelinkovac Herbal Liqueur', 'Bermet Spiced Wine', 'Dunjevača (Quince Spirit)'],
      sr: ['Šljivovica', 'Pelinkovac', 'Bermet', 'Dunjevača'],
      zh: ['什利沃维察李子白兰地 (Šljivovica)', '苦艾草药利口酒', '贝尔梅特草本香甜酒', '木瓜白兰地']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Serbian Šljivovica was inscribed by UNESCO recognizing its vital social role in hospitality, festive toasts (Živeli!), and generational distilling knowledge in oak casks.',
      sr: 'Srpska šljivovica je upisana na UNESKO listu kao svedočanstvo duboke društvene prakse, tradicije gostoprimstva i umeća odležavanja u hrastovim buradima.',
      zh: '塞尔维亚李子白兰地不仅是一种高烈度果馏酒，更是贯穿当地人出生、婚礼与待客祝酒礼仪不可或缺的精神文化纽带。'
    },
    recommendedRecIds: ['10'] // Rakia Bar Belgrade
  },
  {
    id: 'quiz-24-rajacke-pimnice',
    category: 'Wine Heritage',
    question: {
      en: 'Which unique 18th-century stone village in Eastern Serbia’s Negotin Valley was built solely to house over 270 sandstone wine-aging cellars rather than permanent human residents?',
      sr: 'Koje jedinstveno kameno selo iz 18. veka u Negotinskoj krajini je izgrađeno isključivo za preko 270 peščarskih vinskih podruma, a ne za stanovanje ljudi?',
      zh: '位于塞尔维亚东部内戈廷谷地、始建于18世纪、拥有270多座砂岩酒窖且仅为酿酒和陈年而建、无人长期定居的奇特石头酒村是：'
    },
    options: {
      en: ['Rajačke Pimnice (Rajac Cellars)', 'Sremski Karlovci Vineyards', 'Oplenac Cellars', 'Župa Stone Press'],
      sr: ['Rajačke pimnice', 'Karlovački vinogradi', 'Oplenački podrumi', 'Župski podrumi'],
      zh: ['拉亚茨石雕酒窖村 (Rajačke Pimnice)', '斯雷姆斯基卡尔洛夫奇庄园', '奥普莱纳克王家酒窖', '茹帕老石磨坊']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Rajačke Pimnice is a settlement built purely for wine making, carved into a hillside of local sandstone, famous for cultivating rare native grapes like Crna Tamjanika.',
      sr: 'Rajačke pimnice su kameno naselje gde vino „živi”, a seljani dolaze samo da neguju berbu i proizvode autohtonu crnu tamjaniku i prokupac.',
      zh: '拉亚茨石头酒窖村宛如一座专属葡萄酒的中世纪微型城堡群，这里终年恒温恒湿，出产极其稀有的本土“黑麝香”（Crna Tamjanika）佳酿。'
    },
    recommendedRecIds: ['25'] // Rajačke Pimnice
  },
  {
    id: 'quiz-25-majkin-salas',
    category: 'Pannonian Slow Living',
    question: {
      en: 'Situated near Lake Palić, which authentic North Bačka ethno-farmstead (Salaš) is renowned for clay-pot gulaš, poppy-seed strudel, and sprawling orchards built from adobe and timber?',
      sr: 'Smešten u blizini Palićkog jezera, koji autentični severnobački salaš je poznat po gulašu iz zemljanih lonaca, štrudlama s makom i kućama od čerpića i drveta?',
      zh: '坐落在帕利奇湖畔、以陶罐焖牛肉古法炖菜、手作罂粟籽卷饼及生土原木庄园著称的北巴奇卡传统田园农庄（Salaš）是：'
    },
    options: {
      en: ['Majkin Salaš', 'Perkov Salaš', 'Salaš Vrdnička Kula', 'Stari Salaš'],
      sr: ['Majkin salaš', 'Perkov salaš', 'Salaš Vrdnička kula', 'Stari salaš'],
      zh: ['梅金农庄 (Majkin Salaš)', '佩尔科夫农庄', '弗尔德尼克塔农庄', '老农庄']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Majkin Salaš preserves the 19th-century agricultural pace of the Pannonian basin with wood-burning stoves, fruit orchards, and evening tamburica serenades.',
      sr: 'Majkin salaš čuva miran vojvođanski seoski način života, sa domaćom kuhinjom iz zemljanog posuđa i tamburašima u hladu bagremova.',
      zh: '梅金农庄展现了潘诺尼亚平原经典的“慢食与慢生活”哲学，客人可在一望无际的果树林荫下品尝老奶奶食谱烹调的地道家常风味。'
    },
    recommendedRecIds: ['155'] // Majkin Salaš
  },
  {
    id: 'quiz-26-perkov-salas-fruska-gora',
    category: 'Fruška Gora Heritage',
    question: {
      en: 'Tucked into the southern slopes of Fruška Gora in Neradin village, which intimate family farmstead showcases century-old weaving heirlooms and slow-simmered Srem goulash?',
      sr: 'Ušuškan na južnim padinama Fruške gore u selu Neradin, koji intimni porodični salaš čuva vekovne tkane starine i poslužuje lagano kuvani sremski gulaš?',
      zh: '深藏于弗鲁什卡格拉南麓内拉丁村、珍藏百年手织民俗刺绣并以小火慢炖斯雷姆特色浓汤闻名的温馨家族农庄是：'
    },
    options: {
      en: ['Perkov Salaš', 'Majkin Salaš', 'Salaš 137', 'Krušedol Farm'],
      sr: ['Perkov salaš', 'Majkin salaš', 'Salaš 137', 'Krušedolski salaš'],
      zh: ['佩尔科夫农庄 (Perkov Salaš)', '梅金农庄', '137号农庄', '克鲁舍多尔庄园']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Managed for generations by the Šević family, Perkov Salaš serves organic elderberry juice, homemade Bermet, and orchard feasts surrounded by ethnographic artifacts.',
      sr: 'Perkov salaš porodice Šević predstavlja pravi živi muzej Srema gde se poslužuje sok od zove, bermet i domaća trpeza spremljena po receptima baka.',
      zh: '佩尔科夫农庄保留着原汁原味的斯雷姆老宅风貌，主人亲自烹调接骨木花果汁与私房贝尔梅特草本酒款待远方来客。'
    },
    recommendedRecIds: ['156'] // Perkov Salaš
  },
  {
    id: 'quiz-27-vrnjacka-banja-springs',
    category: 'Thermal Healing & Spas',
    question: {
      en: 'Celebrated since Roman times when legionnaires bathed in Fons Romanus, which is Serbia’s most renowned royal spa resort, also famous for the original Bridge of Love padlocks?',
      sr: 'Poznata još od rimskog doba kada su se legionari kupali u izvoru Fons Romanus, koja je najslavnija kraljevska banja Srbije, poznata i po Mostu ljubavi sa katancima?',
      zh: '自古罗马军团在此沐浴疗养温泉起便闻名遐迩、被誉为塞尔维亚“皇家温泉之冠”且作为世界“爱情锁同心桥”发源地的度假名镇是：'
    },
    options: {
      en: ['Vrnjačka Banja', 'Sokobanja', 'Banja Koviljača', 'Prolom Banja'],
      sr: ['Vrnjačka Banja', 'Sokobanja', 'Banja Koviljača', 'Prolom Banja'],
      zh: ['弗尔尼亚奇卡矿泉疗养镇 (Vrnjačka Banja)', '索科矿泉镇', '科维利亚查矿泉镇', '普罗洛姆矿泉镇']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Vrnjačka Banja features 7 curative mineral water springs matching human body temperature (36.5°C), expansive botanical parks, and the poetic Bridge of Love.',
      sr: 'Vrnjačka Banja poseduje 7 lekovitih mineralnih izvora od kojih je topli izvor tačno temperature ljudskog tela (36,5°C), okružena prelepim parkovima.',
      zh: '弗尔尼亚奇卡矿泉镇拥有7口富含矿物质的理疗泉眼，其中温矿泉温度恰好为36.5摄氏度，镇内古树成荫，绿意盎然。'
    },
    recommendedRecIds: ['4'] // Vrnjačka Banja
  },
  {
    id: 'quiz-28-bermet-wine-titanic',
    category: 'Viticulture Legends',
    question: {
      en: 'Infused with over 20 aromatic alpine herbs and wormwood, which sweet spiced dessert wine originating in Sremski Karlovci was famously listed on the wine manifest of the RMS Titanic?',
      sr: 'Aromatizovano sa preko 20 lekovitih planinskih trava i pelinom, koje slatko desertno vino iz Sremskih Karlovaca se nalazilo na vinskoj karti potonulog Titanika?',
      zh: '浸润了20余种阿尔卑斯药草与苦艾、源自斯雷姆斯基卡尔洛夫奇并据记载曾位列泰坦尼克号头等舱酒单上的标志性草本香甜甜酒是：'
    },
    options: {
      en: ['Bermet', 'Prokupac', 'Tamjanika', 'Vranac'],
      sr: ['Bermet', 'Prokupac', 'Tamjanika', 'Vranac'],
      zh: ['贝尔梅特甜香酒 (Bermet)', '普罗库帕茨 (Prokupac)', '塔米扬尼卡 (Tamjanika)', '乌拉纳茨 (Vranac)']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Bermet has been produced by Karlovci winemaking families since the Middle Ages and was exported across Vienna and Budapest courts as an elite digestive tonic.',
      sr: 'Bermet se vekovima proizvodi u porodičnim podrumima Sremskih Karlovaca po tajnim recepturama sa travama i bio je omiljeno piće bečkog dvora.',
      zh: '贝尔梅特甜酒由伏伊伏丁那酿酒名门世代恪守秘方酿制，香气芬芳馥郁，几个世纪以来常年直供维也纳与布达佩斯皇室宫宴。'
    },
    recommendedRecIds: ['135'] // The Bermet Afternoon (Sremski Karlovci)
  },
  {
    id: 'quiz-29-silosi-danube-creative',
    category: 'Industrial Rebirth',
    question: {
      en: 'Located on the Danube bank in Dorćol, four towering 28-meter brutalist grain storage silos have been revitalized into which dynamic beacon for contemporary art, ecology, and music?',
      sr: 'Smeštena na obali Dunava na Dorćolu, četiri monumentalna betonska silosa za žito visoka 28 metara preuređena su u koji dinamični centar savremene umetnosti i muzike?',
      zh: '位于贝尔格莱德多尔乔尔多瑙河畔、由四座高达28米的野兽派巨型储粮筒仓改建而成的集当代艺术、生态绿意与先锋音乐于一体的创意地标是：'
    },
    options: {
      en: ['Silosi Belgrade', 'Ciglana Creative Quarter', 'Drugstore Belgrade', 'Barutana'],
      sr: ['Silosi Beograd', 'Ciglana', 'Drugstore', 'Barutana'],
      zh: ['贝尔格莱德筒仓创意园 (Silosi)', '奇格拉纳创意区', '药店艺术空间 (Drugstore)', '火药库音乐空间']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Silosi Belgrade transformed former industrial logistics infrastructure into an open cultural ecosystem with riverside beekeeping, brutalist acoustic music, and mural galleries.',
      sr: 'Silosi Beograd su nekadašnje industrijsko skladište pretvorili u zeleni kulturni centar na reci sa izložbama, pčelarstvom i eksperimentalnim događajima.',
      zh: '贝尔格莱德筒仓园区将昔日冷峻的混凝土工业重地注入全新灵魂，打造出包含河滨蜂场、巨幅先锋壁画与自然工坊的文化奇迹。'
    },
    recommendedRecIds: ['23'] // Silosi Belgrade
  },
  {
    id: 'quiz-30-viminacium-roman-ships',
    category: 'Imperial Archaeology',
    question: {
      en: 'Near Kostolac, which Roman legionary camp and provincial capital of Moesia Superior famously revealed remarkably preserved Roman wooden fleet ships and a million-year-old mammoth skeleton?',
      sr: 'Kod Kostolca, koji rimski legionarski logor i prestonica provincije Gornje Mezije je otkrio odlično očuvane rimske drvene brodove i milion godina star skelet mamuta?',
      zh: '位于科斯托拉茨附近、曾作为上默西亚行省首府与军团大营、在此出土了极为罕见的整艘罗马木质军舰与百万年前猛犸象完整化石的考古遗址是：'
    },
    options: {
      en: ['Viminacium Archaeological Park', 'Sirmium', 'Singidunum', 'Felix Romuliana'],
      sr: ['Arheološki park Viminacijum', 'Sirmijum', 'Singidunum', 'Feliks Romulijana'],
      zh: ['维米纳奇乌姆考古公园 (Viminacium)', '西尔米乌姆', '辛吉杜努姆', '罗慕利亚纳']
    },
    correctAnswerIndex: 0,
    explanation: {
      en: 'Viminacium was home to Legio VII Claudia with over 40,000 residents; today, visitors descend into painted Roman tombs and witness ancient flat-bottomed river warships.',
      sr: 'Viminacijum je bio moćni rimski vojni logor i grad sa 40.000 stanovnika, sa oslikanim grobnicama, amfiteatrom i jedinstvenim rimskim rečnim brodovima.',
      zh: '维米纳奇乌姆考古公园占地辽阔，地下不仅完好保存着罗马地下壁画墓穴与引水渠，还重现了昔日罗马多瑙河巡航舰队的造船奇迹。'
    },
    recommendedRecIds: ['17'] // Viminacium Archaeological Park
  }
];

/**
 * Monte Carlo Randomization:
 * Samples N unique questions uniformly at random from the 30-question pool
 * using the standard Fisher-Yates shuffle algorithm.
 */
export function sampleRandomQuizQuestions(count: number = 6): QuizQuestion[] {
  const poolCopy = [...CULTURAL_QUIZ_POOL];
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
  }
  return poolCopy.slice(0, Math.min(count, poolCopy.length));
}
