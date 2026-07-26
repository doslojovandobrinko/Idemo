/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../types';

export interface TruthCurationResult {
  whyRecommended: string;
  whatMakesItSpecial: string;
  whoWillEnjoy: string;
  antiAdvice: string[]; // Kept for backward compatibility
  coreValue: string;
  desiredOutcome: string;
  outcomeProtection: string[]; // Kept for backward compatibility
  idealFor: string;
  notIdealFor: string;
  unlearn: string[];
  worthKnowing: string[];
  shortRecommendation: string;
  whyItsWorthYourTime: string;
}

// 1. SPECIFIC TRUTH DATA FOR OVERRIDES
const SPECIFIC_TRUTH_DATA: Record<string, {
  desiredOutcome: Record<string, string>;
  whyItsWorthYourTime: Record<string, string>;
  unlearn: Record<string, string[]>;
  worthKnowing: Record<string, string[]>;
  idealFor: Record<string, string>;
  notIdealFor: Record<string, string>;
  whyRecommended: Record<string, string>;
  whatMakesItSpecial: Record<string, string>;
  coreValue: Record<string, string>;
}> = {
  // '1': Uvac Meanders
  '1': {
    desiredOutcome: {
      en: "Gaze at the vast, raw meander loops and watch the soaring flight of the rare wild Griffon Vulture in deep silence.",
      sr: "Posmatranje veličanstvenih prirodnih meandara kanjona i praćenje leta retkog divljeg beloglavog supa u čistoj tišini.",
      zh: "在极致安宁的旷野深处，亲眼凝望大自然鬼斧神工作品的马蹄型大回旋，与展翅高低翱翔的白头巨鹫并肩互望。"
    },
    whyItsWorthYourTime: {
      en: "Most travelers view canyons merely as dramatic scenery, but the Uvac Gorge teaches you how water can carve masterworks of geographic sovereignty deep into stone across millions of years. This represents an active, raw biosphere reserve where the majestic Griffon Vulture—which was saved from high extinction risks—glides so close to the Molitva platform that you can hear the rush of their wings. As you stand twelve hundred meters above the emerald river looping in absolute, mathematically perfect 180-degree loops across the highland plateau, you are enveloped in a rare, total silence that demands you slow your thoughts to match the geological tempo. It is an experience that cannot be rushed in an afternoon; it requires half a day of quiet contemplation, trekking with proper high-grasp outdoor footwear, and taking a silent boat glide below. In return, it is most guaranteed to completely reset your nervous system from the sensory friction of modern city living, culminating in a pristine table tasting of aged, salty Sjenica cheese crafted inside a high-mountain family cabin.",
      sr: "Većina putnika vidi kanjone samo kao dramatične pejzaže, ali kanjon reke Uvac vas uči kako voda može urezati remek-dela geografskog suvereniteta duboko u kamen tokom miliona godina. Ovo je divlji i aktivni rezervat biosfere u kome veličanstveni beli supovi – spašeni od visokog rizika od izumiranja – jedre toliko blizu drvene platforme vidikovca Molitva da bukvalno možete čuti šum njihovih krila. Dok stojite na 1.200 metara nadmorske visine iznad smaragdne reke koja se savija u savršenim, matematičkim krugovima od 180 stepeni na Pešterskoj visoravni, obuzima vas tišina koja zahteva da usporite misli i uskladite se sa geološkim ritmom prirode. Ovaj doživljaj se ne sme ugurati u jedno ubrzano popodne; on zahteva poludnevnu tihu kontemplaciju, hodanje u planinarskoj obući i laganu vožnju čamcem kroz jezerske dubine. Zauzvrat, garantovano će vam u potpunosti oporaviti nervni sistem od gradske buke, završavajući se degustacijom zrelog sjeničkog sira u autentičnom planinskom domaćinstvu.",
      zh: "多数旅行者习惯将峡谷小流视作微缩景观，而乌瓦茨峡谷则开辟了全新的格局。数百万年板块碰撞将湍急冰冷的水流锤炼成180度马蹄形蛇形曲回，深凿入陡峭千尺的石灰岩壁。这里绝非架设了平滑扶栏与商业摊点的人造打卡公园，而是一处纯然狂野、几乎未受商业污染的高山野生动物自然保护区。当您伫立于海拔1247米险峻的莫利特瓦顶峰栈台，极其罕见而庞大的冰川期巨兽——白头巨鹫拍击着近三米长的双翼，在身旁触手及的绝壁深渊上借着热气流翱翔。长风掠过，天地间充溢着震慑灵魂的原生寂静。必须要拔出整整半天光阴，着专业登山靴沿锋利碎石小道徒步并融入静谧的谷底游船慢荡，方能悟见这片不向时代屈服的原始地理之主权，并在深山牧舍人家温热的火炉旁，品尝一口泉水手工陈酿的谢尼察乳酪与厚重带汽的荞麦圆饼。"
    },
    unlearn: {
      en: [
        "Overlook safety railings do not exist here: Unlearn the expectation of smooth, handrailed tourist walkways; the Pešter clifftops are kept in their raw, natural state to preserve primordial geological scale.",
        "This is not a quick 30-minute photo stop: Unlearn the rushed 'snapshot' mindset; to absorb the true silent scale of the meanders, you must stand on the wooden Molitva platform in total stillness for at least 15 minutes.",
        "Ordinary flat walking shoes are completely useless: Unlearn the assumption that city sneakers will suffice; the trails consist of sharp, loose limestone rocks and require professional high-grip outdoor footwear."
      ],
      sr: [
        "Zaboravite na sigurnosne ograde svuda: Vidikovac Molitva i planinske litice su sačuvani u svom prirodnom obliku, bez veštačkih barijera i betona da se ne bi narušio geološki sklad.",
        "Ovo nije brza pauza od 15 minuta za slikanje: Odustanite od žurbe; da biste zaista osetili dubinu i tišinu kanjona, morate nepomično stajati na ivici platforme bar 15 minuta.",
        "Meke gradske patike su neupotrebljive: Zaboravite na udobnost gradske obuće; staze su strme, kamenite i prekrivene oštrim krečnjakom, te zahtevaju čvrstu planinarsku obuću."
      ],
      zh: [
        "切勿期待铺满全路的安全网护栏：请抛下习惯依赖城市景区人造台阶与全包围围栏的安全惰性；佩什特高山悬崖完全保留了陡峭锋利的真实野外状态。",
        "告别速食式的快门一闪：丢弃“九宫格打卡即走”的心浮气躁；想要真正与之共鸣，请在莫利特瓦观景台边缘静立漫看至少15分钟，待长风拂过方觉神清。",
        "普通高街平底鞋在这里极易打滑：卸下“一鞋走天下”的都市偏见；这里的步道全由风化的尖锐裸露喀斯特碎石自生铺成，必须要着专业高抓地力户外徒步靴。"
      ]
    },
    worthKnowing: {
      en: [
        "Allot five full hours for exploration: Never compromise your connection by rushing. Spend at least five hours to experience both the river boat-glide and the steep high climb without frantic bursts.",
        "Prepare your own hydration and dry food: The reserve maintains an anti-tourist zero-commercialization rule. There are no soda kiosks or snack stands at the viewpoints; pack your own heavy water flask.",
        "Engage the highland locals with respect: Take time to pause at high-altitude small wooden family cabins on the plateau; order slow-cured brined Sjenica cheese and organic buckwheat pies directly from the host."
      ],
      sr: [
        "Izdvojite bar pet punih sati za obilazak: Ne pravite kompromise sa vremenom. Planirajte pet sati da biste opušteno doživeli i plovidbu čamcem i strmi uspon bez stresa i žurbe.",
        "Spakujte sopstvenu vodu i suve obroke: Na vidikovcima i stazama nema prodavnica, komercijalnih kioska niti uličnih prodavaca. Obavezno ponesite dovoljno vode sa sobom.",
        "Poštujte domaćine na visoravni: Svratite u drvene brvnare lokalnih gorštaka i naručite pravi sjenički sir i domaću pitu od heljde direktno na izvoru."
      ],
      zh: [
        "预留充沛无虞的五个完整小时：决不能在半天内匆忙完成全套旅程。必须腾出5小时闲暇，方能不喘息且优雅地衔接谷底游船微漾与崖顶徒步登高。",
        "强行自带足够温水及高能干粮：保护区秉持极严的“非商业化”生态原则，崖尖绝壁处无任何零食摊或饮料推车。请保证个人保温热量自带。",
        "用尊重的温情拍打高原农家木门：在攀登顶峰的林道旁，请大方敲开纯朴高山人家的木屋，坐下来热腾腾吃一碟手工陈酿的谢尼察干酪与荞麦薄饼。"
      ]
    },
    idealFor: {
      en: "Patience-driven explorers, birdwatchers, active hikers, and travelers looking to completely disconnect from the digital grid.",
      sr: "Strpljivi istraživači divljine, planinari, posmatrači ptica i svi koji žele apsolutni detoks od ekrana u tišini.",
      zh: "愿意为绝景等待的深度荒野探险者、高山徒步发烧友、野生动物摄影家，以及渴望彻底切断城市信号、寻求心灵长假的人。"
    },
    notIdealFor: {
      en: "Rushed checklist travelers, people expecting smooth handrailed concrete walkways/fences, or individuals unprepared with professional high-grip outdoor hiking footwear.",
      sr: "Turiste u žurbi koji sakupljaju kvačice na mapi, posetioce koji očekuju popločane staze sa zaštitnim ogradama, ili one koji nemaju planinarsku obuću sa dobrim prianjanjem.",
      zh: "追求在30分钟内拍照闪人的打卡速游客、无法离开平坦水泥人行道与高耸扶栏安全栅网的城市行者、或是不愿换装专业高抓地力户外登山鞋的休闲观光客。"
    },
    whyRecommended: {
      en: "To experience the raw primordial scale of European geological evolution and witness the wild, soaring flight of the rare Griffon Vulture.",
      sr: "Da iskusite iskonsku snagu evropske geološke evolucije i posmatrate let retkog beloglavog supa u njegovom prirodnom carstvu.",
      zh: "亲身领略欧洲古老大陆板块运动所遗存的首屈一指、波澜壮阔的原始喀斯特奇观，亲眼凝望濒危巨兽白头鹫翱翔云霄的野性震撼。"
    },
    whatMakesItSpecial: {
      en: "The river carves intense 180-degree horseshoe loops deeply into the Pešter plateau, surrounded by pristine limestone walls, hidden cave entrances, and absolute silence untouched by commercial tourism.",
      sr: "Reka urezuje savršene zavoje od 180 stepeni u Peštersku visoravan, okružena divljim krečnjačkim liticama, skrivenim pećinama i apsolutnom tišinom bez komercijalnog turizma.",
      zh: "汹涌碧绿的河流在佩什特石灰岩台地上深凿出鬼斧神工的180度马蹄形蛇形回旋，两侧是刀劈斧削的千尺峭壁与隐秘洞穴，毫无人工修饰、极致宁静。"
    },
    coreValue: {
      en: "Immersion in raw, pristine geological grandeur and sovereign natural wildlife.",
      sr: "Uronite u čistu, netaknutu geološku veličanstvenost i suvereni život divljeg sveta.",
      zh: "沉浸于原始、纯净的地质壮丽与主宰自然界的野生生灵之中。"
    }
  },

  // '2': Manasija Monastery
  '2': {
    desiredOutcome: {
      en: "Achieve a profound state of spiritual silence and contemplation before 15th-century Byzantium frescoes inside a fortress sanctuary.",
      sr: "Postizanje stanja duboke duhovne tišine i posmatranja srednjovekovnih fresaka iz 15. veka unutar moćne pravoslavne tvrđave.",
      zh: "身处重兵把守的十一连万古要塞深处，在不灭烛火与斑驳香火旁，与历经六百载劫余的莫拉瓦神圣画卷达到灵魂深处的共鸣。"
    },
    whyItsWorthYourTime: {
      en: "Manasija Monastery represents the ultimate historical synthesis of medieval spiritual isolation, defensive fort-castle construction, and heroic scholarly literature transcription. Surrounded by eleven intimidating stone towers rising up to thirty meters high, this 15th-century stronghold was built by Despot Stefan Lazarević not merely to guard a church, but to shield the core of Serbian literacy. Inside the massive stone walls, the Holy Trinity Church preserves some of the most exquisite, glowing Byzantium frescoes in the world, particularly the famed murals of the Holy Warriors whose azure and golden strokes survived centuries of fire and foreign sieges. To step into this compound is to leave the noise of the digital age completely behind; the cool mountain valley air and the smell of frankincense create an atmosphere of heavy, meditative peace. It serves as a physical archive of human resilience, where scholars transcribed manuscripts to preserve culture. To appreciate its scale, you must sit in silence beneath the dim dome, allowing your eyes to adjust to the shadows where history remains actively preserved.",
      sr: "Manastir Manasija predstavlja vrhunsku istorijsku sintezu srednjovekovne duhovne posvećenosti, odbrambene arhitekture i očuvanja pismenosti kroz prepisivački rad čuvene Resavske škole. Okružena sa jedanaest moćnih kamenih krupnih kula visine do trideset metara, ova tvrđava iz 15. veka podignuta je od strane Despota Stefana Lazarevića sa jasnim ciljem: da zaštiti veru i srpsku pismenost od naleta carstava. Unutar njenog korskog mira, crkva Svete Trojice čuva freske neverovatnog kolorita i lepote, naročito čuvene prikaze Svetih ratnika čiji su plavi i zlatni tonovi preživeli vekove opsada i vatri. Zakoračiti u ovaj krug znači potpuno ostaviti buku digitalnog sveta iza sebe; hladan dolinski vazduh podno zidina i miris tamjana stvaraju atmosferu dubokog i tihog mira. Manasija nije običan spomenik; to je živi arhiv ljudske izdržljivosti i herojstva, idealan za one koji žele da spoznaju dostojanstvenu tišinu rano ujutru pre bučnih posetilaca.",
      zh: "马纳西亚修道院是中世纪东正教灵性、固若金汤的军事城防要塞工程，与古老抄写员书写文明不屈死守的终极结晶。这并非一处只留遗迹、毫无温润生息的战争堡垒。由11座巍峨高耸至30米的巨型厚石碉楼防御工事环形锁死，其中庭大殿却极尽清凉与世外桃源之气。由德斯波特·斯特凡·拉扎列维奇于15世纪初奠基，大殿内完好保存着莫拉瓦学派的湿壁画圣品，其著名的《圣战士》画卷中那一抹犹如浩瀚星空的青金石蔚蓝墨迹，奇迹般地在长达两百年的战火蹂躏下劫后余生。入内静立，嗅着斑驳香火与百年老檀的清香，让感官在幽暗烛光下慢慢苏醒，感受中世纪抄写员们在烛火摇曳下执笔记录史料、守护文字薪火相传的神圣意志。请务必在寂静的清晨探访，将身心浸润在这片饱含人类抗御毁灭、守护文明温度的巨石殿堂中。"
    },
    unlearn: {
      en: [
        "This is not a dead museum or castle: Unlearn treating this defensive sanctuary merely as an ancient stone fort; it is a highly revered active monastery where silence is respected.",
        "Bypass the rushed sightseeing tour pace: Unlearn the urge to quickly walk through the nave of the Holy Trinity Church; sit still on the stone benches for ten minutes to study the brushwork.",
        "Expect no commercial digital conveniences: Unlearn the expectation of automated qr-code audio guides or interactive display sheets; the values here are oral and passed down directly."
      ],
      sr: [
        "Zaboravite da je ovo prazan muzej ili utvrđenje: Ovo nije samo stari kameni zamak; to je aktivni i visoko poštovani pravoslavni manastir gde se tišina čuva kao svetinja.",
        "Zaboravite na brz obilazak: Nemojte samo proći kroz unutrašnjost crkve Svete Trojice; sedite na kamenu klupu u polumraku bar deset minuta kako biste uočili dubinu i boju fresaka.",
        "Ne očekujte plastične audio-vodiče i skenere: Ovde se istorija prenosi živom rečju. Razgovarajte sa kustosima i monasima; njihovo znanje je ključ za otključavanje ovih zidina."
      ],
      zh: [
        "绝非没有温度的死寂战争石堡：排斥将这片神圣道场仅视作自拍背景的浅显思维；其内部至今依然生活着闭门修行的东正教修士，起火熏香皆是日常修行组成。",
        "切勿在主殿中行色匆匆：卸下走马观花快速折返的旅游习惯；请在三位一体主殿的石凳上静坐10分钟，待双眼适应微光后，方能看清六百年前《圣战士》壁画的神韵。",
        "这里听不到千篇一律的电子语音讲解：不要习惯戴着耳机机械扫码；这里的历史温度锁在黑袍修士与白胡子馆员的口耳相传中，大方上前礼貌用英文探讨方有惊喜。"
      ]
    },
    worthKnowing: {
      en: [
        "Respect the active monastery: Turn off your phones, keep your voice at a low whisper, and never photograph nuns or monks without their explicit blessing.",
        "Dress under strict traditional standards: Both men and women must wear modest clothing that fully covers knees and shoulders. Avoid flashy athletic wear.",
        "Inspect the medieval Resava Transcription Scriptorium: Spend ten minutes viewing the stone chambers where monks meticulously preserved the Slavic language from erasure."
      ],
      sr: [
        "Poštujte pravila aktivnog manastira: Isključite telefone, razgovarajte tihim šapatom i nikada ne fotografišite monaštvo bez njihovog izričitog blagoslova.",
        "Odenite se pristojno pre ulaska: I muškarci i žene moraju imati odeću koja u potpunosti pokriva kolena i ramena; izbegavajte sportsku odeću.",
        "Pogledajte odaje prepisivačke škole: Provedite malo vremena posmatrajući kamene prostorije u kojima su monasi pedantno čuvali slovensku pismenost od brisanja."
      ],
      zh: [
        "绝对敬畏清修道场的肃穆：千万不要把这座要塞等同于毫无生命的遗迹。入内请将手机静音，穿着长裤长裙，绝不可对着清修的僧侣进行直接拍摄。",
        "遵循严肃的服装穿着規範：所有男女访客入内均需避膝避肩，禁止身穿大红大绿、露宿或过于紧身的暴汗瑜伽运动服饰。",
        "寻访雷萨瓦手抄经书院旧址：在旧大厅内花时间阅览那些执着抄写、让斯拉夫拼音与圣经文学薪火传承的面貌遗迹，感受书写保护文化的信仰。"
      ]
    },
    idealFor: {
      en: "Admirers of authentic sacred art, students of medieval European castle construction, and travelers searching for profound, meditative silence and history.",
      sr: "Ljubitelji autentične umetnosti, istraživači vojne arhitekture i svi koji tragaju za carstvom mira i istorijske pismenosti.",
      zh: "中世纪圣殿壁画修复研究者、硬核欧洲古城堡防务工程爱好者，以及渴望在远离电子噪音的斑驳石林中汲取静修之气的寻道者。"
    },
    notIdealFor: {
      en: "Tourists seeking loud commercial amusement parks, modern flashy shows, or those unwilling to pack modest clothing and honor quiet monastic prayer silence.",
      sr: "Ljubitelje bučnih turističkih atrakcija i zabavnih parkova, moderne glasne prezentacije, ili one koji ne žele da poštuju pravila odevanja i mir u aktivnom verskom hramu.",
      zh: "期待游乐园式声光电娱乐、吵闹叫嚷商业团氛围的行者，或者是无法安静在神圣内殿保持轻微低语、抗拒避膝蔽肩严肃着装规范的旅客。"
    },
    whyRecommended: {
      en: "To stand before the ultimate architectural synthesis of medieval Serbian Orthodox spirituality, defensive fortification, and scholarly transcription heritage.",
      sr: "Da kročite u najsavremeniju sintezu srednjovekovne srpske duhovnosti, odbrambenog utvrđenja i nasleđa čuvenog prepisivačkog rada.",
      zh: "直面塞尔维亚中世纪东正教至高宗教灵性、军事城防要塞工事设计，与学者手抄古籍圣典精神相结合的终极建筑范式。"
    },
    whatMakesItSpecial: {
      en: "Protected by eleven massive stone towers rising up to thirty meters, the peaceful interior church preserves some of the most exquisite, luminous 15th-century Byzantium frescoes of Holy Warriors.",
      sr: "Zaštićena sa jedanaest masivnih kamenih krupnih kula visine do 30 metara, mirna unutrašnja crkva čuva veličanstvene i blistave freske Svetih ratnika iz 15. veka.",
      zh: "由11座巍峨耸立至30米的巨型石筑城堡环护，其内部中庭却如同世外桃源般清凉宁静。大殿内完好保留着两百年战火蹂躏而幸存下来的十五世纪莫拉瓦学派湿壁画圣品，尤其是著名的《圣战士》系列壁画。"
    },
    coreValue: {
      en: "Connection with the spiritual architectural resilience and medieval literacy heritage of Serbia.",
      sr: "Povezivanje sa duhovnom i arhitektonskom otpornošću i srednjovekovnim nasleđem pismenosti Srbije.",
      zh: "感悟塞尔维亚中世纪灵性建筑之坚韧不拔，与传统书写文化薪火守望的神圣意志。"
    }
  },

  // '3': Belgrade Waterfront Clubbing / splavovi
  '3': {
    desiredOutcome: {
      en: "Immerse yourself completely in the ecstatic, raw electronic pulse of Belgrade's world-famous floating clubs (splavovi).",
      sr: "Potpuno prepuštanje vibrantnom i iskrenom elektronskom ritmu na legendarnim beogradskim splavovima.",
      zh: "彻底融化于世界上首屈一指、在河面上漂浮跳动的贝尔格莱德“Splavovi（夜行驳船）”顶级地下电子乐声学风暴中。"
    },
    whyItsWorthYourTime: {
      en: "Many global cities claim iconic nightlife, but Belgrade treats collective electronic music dancing as a sovereign spiritual release and unhurried horizontal community. The legendary 'splavovi'—handcrafted floating clubs anchored forever along the confluence of the Sava and Danube rivers—contain custom, high-fidelity acoustics and a sub-cultural commitment to raw music curation that completely avoids commercial top-40 shortcuts. Under customized warm steel rafters and dark, minimalist brick interiors, you enter an organic wave where local DJs conduct narratives that build gradually for hours. It is an experience that strictly rejects fast, superficial club-hopping; the soul is found by staying in one space, adapting your ears to the sonic blueprint, and waiting for the sunrise to hit the calm river waters. The local community values design-driven, tailored minimalist dark styles, and treats visitors with a genuine, non-exclusive warmth that makes the floating dock feel like a temporary sanctuary from the predictable structures of Western commercial nightlife.",
      sr: "Mnogi svetski gradovi se hvale noćnim životom, ali Beograd doživljava zajednički ples uz elektronsku muziku kao suvereni duhovni ventil i neposrednu zajednicu koja ne poznaje predrasude. Legendarni splavovi – ručno građeni klubovi trajno usidreni na ušćima Save i Dunava – poseduju vrhunske i prilagođene zvučne sisteme, kao i potpunu andergraund posvećenost zvukovima koji zaobilaze jeftine komercijalne trendove. Pod metalnim konstrukcijama i svedenim enterijerima, ulazite u talas gde lokalni DJ-evi satima grade duboke, spore zvučne narative. Ovo je iskustvo koje striktno odbacuje površno trčanje iz jednog kluba u drugi; prava vrednost se nalazi u tome da ostanete i prepustite se jednom ritmu sve dok prve jutarnje zrake sunca ne obasjaju mirnu površinu reke. Beogradska publika izuzetno ceni minimalistički crni stil oblačenja, a posetioce prihvata sa toplinom koja čini da se osećate kao deo zajednice.",
      zh: "许多都市宣称拥有标志性蹦迪，而贝氏河畔则将彻夜共舞升华为一种洗刷灵魂杂念、追求彻底自我解放的乌托邦式群落仪式。永久锚泊于萨瓦河与多瑙河汇流碧波之上的“Splavovi（浮游驳船俱乐部）”，远离了全球高同质化的口水流行歌款。这里的音学系统专为硬核、迷幻的地下电子乐定制，DJ的即兴演播是一场要从凌晨一点一直缓缓叙事推衍至清晨五点、拒绝快熟卡点拼盘的声波史诗。严禁将其当成猎奇、打卡式的快餐旅游景点。唯有选定一处，将指尖与心灵融化在纯黑极简的声光钢架中，陪伴它数小时，方能内化这股在其他流水线派对中绝难寻到的原始乐潮。这里的本土玩家热忱、包容、推崇富有质感的暗黑色系装扮，只用饱满的声学海浪，不期而遇地迎候天亮时分落在宽阔多瑙河面上的那一抹宿醉日出金色，震撼且终生难忘。"
    },
    unlearn: {
      en: [
        "Do not expect peak dance energy early: Unlearn showing up before midnight expecting an active dancefloor; Belgrade clubs peak organically from 01:30 to 05:00 AM.",
        "Leave tourist gear and tracksuits behind: Unlearn loose sporty sweatpants or high-color outerwear; the clubbing community values tailored, minimalist dark styles.",
        "Reject high-velocity venue-hopping: Unlearn spending your night in taxis jumping between four different splavs. Pick one club and give it hours to reveal its sonic narrative."
      ],
      sr: [
        "Ne dolazite rano očekujući lud provod: Zaboravite na rano izlaženje; beogradski klupski život dostiže svoj pravi i organski vrhunac tek između 01:30 i 05:00 časova ujutru.",
        "Zaboravite na sportske trenerke i turističku opremu: Izbegavajte šarenu garderobu i sportske kapuljače; klupska zajednica ceni prefinjeni, minimalistički tamni kroj.",
        "Odbacite grozničavu promenu splavova: Ne gubite noć preskačući sa jednog mesta na drugo. Izaberite jedan zvuk, ostanite na tom splavu i dozvolite setu da se razvije."
      ],
      zh: [
        "零点前半步舞池是看不见人潮的：抛下“晚上9点进酒吧”的常规行程，这里的灵魂共振波段要在凌晨01:30及至清晨05:00间方才臻至最顶峰。",
        "扔掉慵懒肥大的休闲连体帽衫与运动裤：别带着打卡沙滩的观光客穿着习惯；此地的电子乐社群极讲究富有设计感的雅致低调暗黑色系装扮。",
        "拒绝在一个晚上频繁更换四个场子：摒弃走马观花式的驳船串游；选定一家你认可的声音路线，踏实陪伴它数个小时，让声波的叙事层层剥开。"
      ]
    },
    worthKnowing: {
      en: [
        "Lock in your entry beforehand: Distinct electronic sets enforce selective RSVPs and table bookings. Have our concierge secure your confirmation 48 hours early.",
        "Adopt the local minimalist style: Belgrade dance lovers prefer dark, tailored, or sleek monochromatic clothing. Bright ski jackets or neon colors will make you stand out awkwardly.",
        "Embrace Sava and Danube Confluence dawn: Stay until 05:30 AM to witness the morning sun reflecting on the silent, broad Danube water right through the open wooden rafts."
      ],
      sr: [
        "Rezervišite ulaz unapred: Selektivni klupski repertoari primenjuju stroga pravila rezervisanja stolova. Zamolite našeg konsijerža da vam osigura potvrdu 48 sati ranije.",
        "Uskladite se sa vizuelnim kodom: Beogradska publika preferira tamnu, svedenu i crnu garderobu. Izbegavajte jarke šarene boje i sportske kapuljače.",
        "Dočekajte svitanje na ušću Save u Dunav: Ostanite do pola 6 ujutru da vidite jutarnje sunce na reci i osetite beogradsku slobodu."
      ],
      zh: [
        "提前锁定您的RSVP：深度的电音专场和高端夜游极其讲究席位限制，必须提前48小时通过我们的专属礼宾台进行内部锁定登记。",
        "融入当地的纯黑视觉规范：本地舞客大多崇尚暗黑色系或黑白极简。身穿扎眼的霓虹色羽绒服或彩色衣物会在纯黑舞池中显得极不协调。",
        "迎接萨瓦多瑙汇流处的清晨：请务必坚守到朝阳初升。透过漂游驳船的钢瓦空隙，看朝晖柔和地洒在宽阔无垠的多瑙河碧波上，极其壮美。"
      ]
    },
    idealFor: {
      en: "Electronic music enthusiasts, late-night high-energy socializers, sub-cultural purists, and world-class dancers.",
      sr: "Poštovaoci andergraund muzike, pasionirani klaberi, plesači i svetski putnici koji cene iskreni noćni ritam reka.",
      zh: "高品质电子音乐藏家、狂热舞池斗士、厌恶俗套商业拼盘蹦迪的地下乐迷，以及不息攀登、执着于捕捉宿醉后日出光晕的夜行动物。"
    },
    notIdealFor: {
      en: "Early sleepers, sports tracksuit/sweatpants wearers, or those seeking generic, commercial top-40 club hits with high-volume hype instead of curated sub-cultural electronic sets.",
      sr: "One koji ležu ranije, nose sportske trenerke ili traže isključivo industrijsku top-40 komercijalnu pop muziku umesto kustoski probranih underground elektronskih setova.",
      zh: "习惯晚上10点早憩的家庭游客、身着过于臃肿或休闲的肥大连体运动服人士，或者是只想随处听到口水洗脑单曲、拒绝融入地下暗黑电子先锋声波大浪潮的舞客。"
    },
    whyRecommended: {
      en: "To completely immerse yourself in the legendary, hedonistic river confluence nightlife of Belgrade, widely recognized as Europe's most organic music scene.",
      sr: "Da se potpuno prepustite legendarnom klupskom ritmu i noćnom životu na ušćima beogradskih reka, najživljoj muzičkoj sceni Evrope.",
      zh: "百分之百投身于享誉全球的贝尔格莱德“多瑙与萨瓦河畔浮动俱乐部夜生活”，亲身体验那股无拘无束、充满乌托邦温情与先锋艺术属性的主流乐潮。"
    },
    whatMakesItSpecial: {
      en: "The unique local 'splavovi' — floating clubs secured permanently to the riverbeds — that offer cutting-edge custom acoustics, from raw industrial brick warehouses to sleek river party platforms.",
      sr: "Jedinstveni lokalni 'splavovi' - klupske platforme trajno usidrene na reci - sa vrhunskim ozvučenjem, od sirovih industrijskih enterijera do elegantnih barži.",
      zh: "独一无二的本地浮游驳船酒吧（Splavovi）永久锚泊于萨瓦河与多瑙河的碧波上。它与岸边的硬核纯黑砖石仓库区遥相呼应，携带着定制设计的顶奢声学系统，交织出一座从不落幕的电声国度"
    },
    coreValue: {
      en: "Music-driven liberation, architectural contrasts, and hedonistic river-confluence camaraderie.",
      sr: "Muzičko oslobođenje, arhitektonski kontrasti i hedonističko druženje na ušću beogradskih reka.",
      zh: "音乐主导的心灵释缚、新旧建筑视觉冲击，与在河流交汇处滋生的享乐主义社交狂欢。"
    }
  },
  // '9': Subotica & Palić Sand Wines / Vinarija Zvonko Bogdan
  '9': {
    desiredOutcome: {
      en: "Experience the unique salt-tinged terroir of 'Vina sa peska' (Wines from the Sands) and explore the breathtaking Art Nouveau elegance of Vinarija Zvonko Bogdan.",
      sr: "Uživajte u jedinstvenoj slankastoj mineralnosti vina sa peska i istražite čudesnu secesijsku eleganciju Vinarije Zvonko Bogdan.",
      zh: "领略来自古老潘诺尼亚海床的“沙土之酒”（Vina sa peska）那带着微咸盐度的高雅矿质，并在奢华艺术地标“兹沃科·博格丹酒庄”（Vinarija Zvonko Bogdan）体验极尽考究的二十世纪初塞塞申新艺术美学。"
    },
    whyItsWorthYourTime: {
      en: "Most travelers buy generic industrial wines, but the Subotica-Palić sand dunes near the Hungarian border offer an entirely different, elite viticulture shaped by the prehistoric Pannonian Sea bed. Over these ancient sands, grapevines must dig exceptionally deep for nutrients, infusing the fruit with refreshing minerality and crisp salinity. Vinarija Zvonko Bogdan stands as an architectural and sensory masterpiece of Secessionist (Art Nouveau) design, adorned with custom traditional roofs, stained glass, and grand French barrique cellars. Savoring their celebrated white blend '8 Tamburaša' or their barrel-aged 'Cuvee No. 1' here is a high-status cultural encounter, far removed from standard wine tours. Reclining at sunset over the Palić vineyards while listening to the lingering notes of Pannonian acoustic music is an intellectually satisfying experience that honors regional identity and Pannonian songcraft.",
      sr: "Dok je centralni deo Srbije prepoznatljiv po rustičnim šumadijskim ili župskim podrumima, Subotičko-horgoška peščara pruža vinarstvo visoke i prefinjene klase oblikovano dnom nekadašnjeg Panonskog mora. Vinarija Zvonko Bogdan na Paliću predstavlja pravi arhitektonski i senzorni dragulj mađarske secesije (Art Nouveau), ukrašen jedinstvenim crvenim krovovima od Žolnai keramike, vitražima i raskošnim barik dvoranama. Kada probate njihov čuveni beli kupaž '8 Tamburaša' ili odležali 'Cuvee No. 1', vi ne pijete samo vino; vi doživljavate tradiciju severnog peska koja daje izuzetnu svežinu i mineralnost vama na dlanu. Uživanje u degustaciji uz zalazak sunca nad palićkim vinogradima pisaće nove stranice vaših putovanja, slaveći pesmu, tradiciju i vrhunski kvalitet.",
      zh: "许多旅行者习惯购买普通的流水线干红，而靠近匈牙利边境的苏博蒂察-帕利奇（Subotica-Palić）沙丘，则凭借史前潘诺尼亚大湖遗存的独特沙粒床，开创了被称为“Vina sa peska（沙地之酒）”的贵族级小众葡萄酒庄。这里的葡萄藤必须在松软洁净的细沙下深扎数十米以汲取母岩养分，从而赋予白葡萄酒极其罕见的海盐矿感和爽冽果酸。在该产区的核心，著名的**“兹沃科·博格丹酒庄”（Vinarija Zvonko Bogdan）**宛如一座宏伟的新艺术运动（Secessionist）殿堂——彩色乔纳伊琉璃瓦、典雅的主题彩绘壁画与整齐堆叠法式橡木桶的宏大地下酒窖在这里融为一体。品味其风靡巴尔干的白混酿**“八位弹唱手”（8 Tamburaša）**或醇厚辛香的**“一号特酿”（Cuvee No. 1）**，是对地缘生命力的顶奢致敬。在余晖洒向辽阔沙地葡萄园之时，伴着耳畔潘诺尼亚传统坦布里察手琴乐，静坐饮一盏带有海风微涩残存的微醺，这将是一辈子也难以忘怀的美妙记忆。"
    },
    unlearn: {
      en: [
        "Unlearn expecting dark, cramped rustic stone cellars: Palić's sand viticulture is celebrated in elegant, palatial Art Nouveau estates and grand French barrique chambers rather than dusty cave-like rooms.",
        "Do not dismiss sand-grown wines as simple: The reflective sand under the intense northern sun forces vines to concentrate complex aromatics and salt-tinged acidity.",
        "Do not skip the estate's visual art tour: Vinarija Zvonko Bogdan is a living museum, where custom stained glass and hand-painted secessionist vaults deserve slow, unhurried appreciation."
      ],
      sr: [
        "Zaboravite na mračne i prašnjave male podrume: Palićko slano vinarstvo se slavi u raskošnim, dvorcima nalik secesijskim imanjima i velikim barik dvoranama od francuskog hrasta.",
        "Nemojte misliti da je pesak previše jednostavan: Specifičan odsjaj sunca od peščanog tla tera lozu da povuče duboku mineralnost, složene arome i jedinstvenu sočnu svežinu.",
        "Nikada ne ubrzavajte obilazak zgrade: Vinarija Zvonko Bogdan je živi muzej gde unikatni vitraži, skulpture i oslikani svodovi zaslužuju sporu i pažljivu vizuelnu analizu."
      ],
      zh: [
        "丢弃对幽暗、潮湿家庭作坊地窖的陈旧成见：帕利奇的沙土红酒文化，是在彩绘挑高阁楼、奢雅法式橡木桶林立、新艺术宫殿般的酒堡中呈现的顶级风采。",
        "切勿随意轻视沙土反射阳光的卓越力量：耀目的白沙反光迫使葡萄藤凝聚极致饱满的芳香族单宁，并赋予其清新怡人的高酸和特殊的深沉矿物骨架。",
        "切勿敷衍略过酒庄本身的画廊导览：兹沃科·博格丹酒庄是一座陈列了众多艺术作品与乔纳伊陶瓷制品的活体艺术展厅，挑高的穹顶玻璃和手绘花纹值得用至少15分钟细细观赏。"
      ]
    },
    worthKnowing: {
      en: [
        "Savor the flagship '8 Tamburaša' and 'Cuvee No. 1': These outstanding wines embody the dual souls (crisp mineral and majestic mature) of the Palić sand vineyards.",
        "Take a slow walk through the Art Nouveau estate gardens: Spend at least 30 minutes admiring the Hungarian Secessionist roof patterns and custom facades reflecting the local light.",
        "Inquire about wine tastings at sunset: Watching the soft light fade over the sandy vineyard rows while enjoying a chilled glass is the ultimate way to appreciate the local terroir."
      ],
      sr: [
        "Naručite vodeća vina '8 Tamburaša' i 'Cuvee No. 1': Ova izuzetna ostvarenja otelotvoruju dve duše (osvežavajuću mineralnu i zrelu moćnu) palićkih vinograda.",
        "Prošetajte vrtovima secesijskog dvorca: Odvojite bar pola sata za posmatranje karakterističnih mađarskih ornamenata i secesijskog krovnog uzorka pod palićkim suncem.",
        "Tempirajte degustaciju u vreme zalaska sunca: Posmatranje polarnog sjaja od peska i lagano gašenje boja nad lozama dok držite hladnu čašu u ruci predstavlja vrhunac doživljaja."
      ],
      zh: [
        "点单酒庄的旗舰款“8 Tamburaša”与“Cuvee No. 1”：它们最经典地诠释了帕利奇沙地葡萄园——极富穿透性的矿香骨骼与成熟饱满的香气结构的双重特质。",
        "漫步于新艺术风格的庄园露打花园中：至少花30分钟静静端详匈牙利塞塞申彩色瓷砖拼贴出的几何屋脊纹理，以及在清晨斜射日光下不断变幻的外立面细节。",
        "选择在夕阳落山时刻进行酒窖品鉴：看夕阳金黄色的余辉缓缓在细密晶莹的沙粒葡萄植株行间褪去，手捧温润的酒杯，这是深度融入当地风土 the soul of sands。"
      ]
    },
    idealFor: {
      en: "Experiential wine collectors, history and architecture lovers, and travelers seeking refined, mineral wines paired with Pannonian melodic soul.",
      sr: "Iskusni ljubitelji belih mineralnih vina, poštovaoci istorije i arhitekture, kao i putnici koji cene prefinjene ukuse u spoju sa panonskim ravničarskim melosom.",
      zh: "拒绝雷同工业量产酒的精品干白干红收藏家、资深新艺术运动（Art Nouveau）建筑拥趸，以及喜欢在悠长民歌坦布里察怀股音乐中寻找古典欧陆庄园诗意的格调旅人。"
    },
    notIdealFor: {
      en: "Rushed checklist tourists, people expecting rustic farm cellars/dirt floors, or individuals demanding cheap sweet table wines.",
      sr: "Turiste u žurbi koji samo jure kvačice na mapi, ljude koji žele isključivo mračne seoske konobe sa zemljanim podom, ili kupce jeftinih stonih slatkih vina.",
      zh: "走马观花急于拍照走人的打卡观光客、坚持执着于寻找低端潮湿乡村泥土农家乐酒窖的人群，以及抗拒干爽回甘、专点便宜量产甜腻佐餐酒精的旅客。"
    },
    whyRecommended: {
      en: "To discover the pristine salt-tinged freshness of sand viticulture inside highly sophisticated Art Nouveau wine estates of Subotica / Palić.",
      sr: "Da otkrijete čistu slankastu svežinu sand vitikulture u prefinjenim secesijskim vinskim dvorcima Subotice i Palića.",
      zh: "在苏博蒂察/帕利奇典雅奢华的新艺术风格酒堡园林中，探索欧洲最古老、纯净温和的“沙地葡萄酒（Vina sa peska）”所蕴藏的独特微咸咸度与果香生命力。"
    },
    whatMakesItSpecial: {
      en: "The ancient Pannonian Sea sediment sandbox terroir combined with Vinarija Zvonko Bogdan's majestic French-oak barrique halls, Zsolnay tiled design, and live acoustic heritage.",
      sr: "Jedinstveno tlo nastalo na sedimentima drevnog Panonskog mora spojeno sa veličanstvenim barik dvoranama Vinariije Zvonko Bogdan, krovom od Žolnai crepa i tradicijom tamburaša.",
      zh: "远古潘诺尼亚海盐沙粒层土壤培育出的纯净爽脆葡萄原料，搭配兹沃科·博格丹酒庄气势恢宏的法式橡木桶陈酿大厅、经典的乔纳伊彩釉琉璃瓦几何线条，以及高雅纯粹的原声拨弦乐传承。"
    },
    coreValue: {
      en: "Rich sand minerality preservation, Secessionist architectural integration, and authentic Pannonian songcraft romance.",
      sr: "Očuvanje mineralnosti peska, spoj vinarstva sa secesijskom arhitekturom i panonska romansa u znaku tamburaša.",
      zh: "高雅沙丘矿物感风味的完美提振、塞塞申新艺术美学设计的融会贯通，以及经典潘诺尼亚坦布里察非遗弹唱的浪漫情坏。"
    }
  }
};

// 2. CATEGORY TRUTH DATA FOR FALLBACKS
const CATEGORY_TRUTH_DATA: Record<string, {
  desiredOutcome: Record<string, string>;
  whyItsWorthYourTime: Record<string, string>;
  unlearn: Record<string, string[]>;
  worthKnowing: Record<string, string[]>;
  idealFor: Record<string, string>;
  notIdealFor: Record<string, string>;
  whyRecommended: Record<string, string>;
  whatMakesItSpecial: Record<string, string>;
  coreValue: Record<string, string>;
}> = {
  // Gastronomy
  'gastronomy': {
    desiredOutcome: {
      en: "Indulge in a memorable traditional Balkan feast, savoring deep, home-style slow food flavors without commercial stress.",
      sr: "Potpuno prepuštanje čulima kroz bogatu tradicionalnu balkansku gozbu, pripremanu ispod sača, u toploj boemskoj atmosferi bez pritiska.",
      zh: "慢享一顿由老厨师手工揉制面饼、明火炭烤Sač温软起锅，无任何工业流水线感、温暖人心的巴尔干传统卡法纳大餐。"
    },
    whyItsWorthYourTime: {
      en: "Balkan gastronomy is not about fast food or sterile high-end plates; it is an unhurried social ritual where meals represent generational pride and deep human connection. You will witness the incredible craftsmanship of slow-braising meats under heavy clay domed lids (sač) buried in live charcoal embers for hours until it effortlessly melts. Diners who appreciate authentic scratch-baking and warm, slow food will find a rare sense of belonging, away from corporate franchises.",
      sr: "Balkanska gastronomija se nikada ne svodi na brzu hranu i sterilne porcije u skupim kupovnim restoranima; to je spori porodični ritual gde hrana predstavlja ponos i najdublju ljudsku vezu. Svedočićete umeću spremanja jela pod teškim pečenim sačem zatrpanim vrelim ugljem satima, sve dok se jagnjetina i mladi krompir sami ne pretoče u meki puter. Gosti koji cene domaće pečenje iz furune, sveže lepinje i organski ajvar naći će u našim kafanama topli osećaj pripadnosti.",
      zh: "巴尔干美食绝非泛泛的流水线大排档或华而不实的网红西餐。它是一场不赶时间、凝聚了几代人情感骄傲与纯朴好客精髓的高山膳食社交仪式。在这里，世代家传的匠人们依然虔诚地守着被烧得通红的粘土铁镬圆盖（Sač），将大块高山羔羊肉与浸润牛油的薯块，深埋于炭火余烬中慢火温炖数小时。当揭开盖的那一刻，麦香浓郁、由老灶手工拉出的皮饼热气腾腾。每一盘现斩煨肉，是对时间的敬畏。你会品味到市井酒馆手风琴声里的温情。忘却都市时钟，在长达两小时的桌端家常叙旧里重返生活的朴拙本真。"
    },
    unlearn: {
      en: [
        "Authentic kafanas are not fast-food establishments: Unlearn the expectation of high-speed mechanized service; honest slow-clay baking takes genuine kitchen hours.",
        "Do not rate a venue by premium luxury fittings: Unlearn using sterile architectural standards; historical tavern warmth lies in hand-carved wooden tables and live acoustic chords.",
        "Avoid ordering international imports: Unlearn demanding dry-aged steak imports when fresh organic high-mountain spit roasts or clay-pot lamb are baking directly over charcoal."
      ],
      sr: [
        "Zaboravite na brzu hranu i industrijsku poslugu: Autentična balkanska kuhinja se sprema po porudžbini i zahteva vreme i strpljenje.",
        "Ne sudite kafani po skupom neon dizajnu: Prava boemska kafana živi od jednostavnog drvenog nameštaja, zvuka akustičnih tambura i topline konobara koji zna svoj posao.",
        "Izbegavajte zapadne uniformisane uvozne stekove: Zašto biste naručivali uvozno meso kada su pred vama vrela planinska jagnjetina ispod sača i svež kajmak."
      ],
      zh: [
        "原生态酒馆“卡法纳”绝非快餐流水线：卸下高效率现代都市快节奏就餐期望；传统Sač黏土镬慢火温煨需要充足的灶头光阴。",
        "切勿用高冷奢装酒店灯具去衡量酒馆：有些最具灵魂的美味正藏在那些陈旧泛黄的木桌与现场充满烟气的手风琴、老吉他声中。",
        "将冷链进口牛排彻底踢出清单：在最纯正的原野高原，永远不要放弃现斩、现煨的高山走地乳羊、酥香脆皮烤猪，那才是至高风味价值所在。"
      ]
    },
    worthKnowing: {
      en: [
        "Consult the tavern host on off-menu specials: The prime oven cuts (like fresh, hot rotisserie veal) are rarely listed on standard printed sheets; ask politely what is ready.",
        "Embrace the traditional table progress: Never skip the starters. Begin with unpasteurized clotted kaymak, wood-oven flatbreads, and single-estate house plum rakia.",
        "Allot at least two full hours for major meals: Treat dining not as a physical refueling stop, but as a leisurely horizontal conversation that slows your pulse."
      ],
      sr: [
        "Pitajte domaćina šta je van jelovnika: Najbolji i najsvežiji komadi pečenja i jela od divljači se retko pišu; uvek pitajte šta je u rerni najsvežije.",
        "Poštujte redosled predjela: Ne skačite odmah na glavno jelo. Započnite sa vrelom somun pogačom, starim planinskim sirom, pršutom i domaćom šljivovicom.",
        "Odvojte bar dva puna sata za ručak: Balkanska večera je društveni obred koji se odvija polako, bez stresa i gledanja u ručni sat."
      ],
      zh: [
        "大方询问餐厅主理人今日隐藏招牌：最惊艳、刚出碳炉的烤仔排在纸面上是看不到的，用最和善的微笑问问店家什么肉最鲜嫩香气逼人。",
        "遵循神圣的冷前菜餐桌排序：直接上主食会破坏胃觉层级。首先上刚起泥炉热气腾腾的大 Somun 皮面包，覆上一抹融化的高山凝乳（Kaymak）。",
        "空出两个半钟头的神清空闲：别把吃饭当成补充体能指标的停靠站。这代表着将心慢下来，融入当地热闹温暖的烟火气社群。"
      ]
    },
    idealFor: {
      en: "Epicureans who appreciate honest scratch cooking, advocates of slow food, and social diners who cherish intimate table conversations.",
      sr: "Gurmani koji cene domaće recepte, poštovaoci slow food koncepta i društveni putnici koji uživaju za kafanskim stolom.",
      zh: "痴迷于食材本真风味的有心饕客、倡导不时不食慢食美学的行家里手，以及对带着人烟气息、毫无高冷修饰的市井餐酒情有独钟的旅人。"
    },
    notIdealFor: {
      en: "Clock-watching, high-speed diners, tourists seeking automated fast food, or those expecting sterile, silent corporate eating spaces.",
      sr: "Goste u žurbi koji nemaju bar dva slobodna sata za večeru, one koji očekuju instant fast-food posluženje, ili tražioce sterilnih, nemih korporativnih franšiza.",
      zh: "追求在数十分钟内快战快决填饱肚皮的速食吃货、苛求绝对静音就餐环境、或者是抗拒酒馆现场手风琴及乐手即兴歌舞互动的人群。"
    },
    whyRecommended: {
      en: "To participate in authentic Balkan social rituals where meals are never rushed, and hospitality is a generational pride.",
      sr: "Da učestvujete u autentičnim balkanskim društvenim ritualima gde ručak traje satima, a gostoprimstvo je stvar porodičnog ponosa.",
      zh: "置身于醇厚温情的巴尔干市井画卷中，享用餐桌上绝不催促、将每一盘珍馐视为维系至亲好友情感的神圣社交洗礼。"
    },
    whatMakesItSpecial: {
      en: "The master craftsmanship of slow clay-pot charcoal baking (sač), dry-aged local steak cuts, hand-kneaded hot flatbreads, and single-estate house rakias served inside traditional bohemian taverns.",
      sr: "Umeće spremanja hrane pod glinenim sačem na žaru, domaći juneći bifteci, ručno mešene vruće lepinje i organske rakije u boemskim kafanama sa živom muzikom.",
      zh: "代代相传、用天然粘土制成的厚重sač圆锅，在炭火余烬中将鲜肉与根茎时蔬慢煨十多个小时的独门厨艺，配以刚出炉的手撕带汽皮饼与酒庄自酿的水果拉客家。"
    },
    coreValue: {
      en: "Participated belonging in authentic Balkan dining rituals, rich scratch baking, and unhurried hospitality.",
      sr: "Zajedničko učešće u autentičnim balkanskim kulinarskim ritualima, domaćoj kuhinji i laganom gostoprimstvu.",
      zh: "深度融入地道巴尔干传统膳食餐饮仪式、扎实的纯手作烘焙文化与舒缓宁然的待客精神中。"
    }
  },

  // Nature
  'nature': {
    desiredOutcome: {
      en: "Experience restorative physical rejuvenation and mental clarity by entering pristine, untamed mountain ecosystems.",
      sr: "Postizanje dubokog mentalnog i telesnog oporavka kroz uranjanje u divlje planinske ekosisteme van domašaja masovnog turizma.",
      zh: "深入未经抛磨改写、几乎未受任何商业侵蚀的温带原始云杉森林，在崇崖绝渊间彻底洗刷脑波噪音，唤醒细胞原动力。"
    },
    whyItsWorthYourTime: {
      en: "Many travelers seek paved parks with concrete smooth paths and steel safety barriers, but Western and Eastern Serbia retain a rare, untamed ecosystem where paths are made of raw stone and wild spruce pine. This represents a sanctuary of raw alpine exposure, silent geological canyons, and hidden clear-water springs. Dedicated active hikers who yearn for a complete digital detox will find their energy restored by matching the primal tempo of these ancient spruce mountains.",
      sr: "Mnogi putnici traže asfaltirane i betonirane parkove sa bezbednosnim ogradama, ali divlji planinski krajevi sačuvali su retke ekosisteme gde su staze napravljene od sirovog kamena i borovih šumskih iglica. Ovo je utočište čiste planinske izloženosti, tihih kanjona i planinske svežine. Aktivni planinari koji žude za digitalnim detoksom i tišinom osetiće kako im se vitalna snaga obnavlja usklađivanjem sa iskonskim tempom stogodišnjih šuma.",
      zh: "许多游客倾向于寻找铺设了平坦水泥石阶和安装了坚固防跌金属网围栏的商业景区，而塞尔维亚的原野森林则坚守着其未被驯服的野性主权。落叶松针铺就的湿软泥道、峭壁之下直接迸出的冰冷甘甜泉水、以及毫无任何商业便利遮蔽的高空视野，编织出一座全欧洲堪称凤毛麟角的纯净生态庇护所。这代表着高负氧离子的心灵净化，需要您带着敬重，踏着专业登山登山靴穿行越过险峰。将电子信号留给都市，让细胞与古老松涛保持同频共振。"
    },
    unlearn: {
      en: [
        "Nature is not an amusement park with guards: Unlearn expecting high-density tourist cafes or concrete smooth paving; wild trails are left natural to preserve the biosphere's integrity.",
        "Ditch the quick-checking trail checklist: Unlearn rushing through forest trails just to tick off coordinates; find a raw oak root, sit down, and listen to the wind for fifteen minutes.",
        "Do not rely on consistent mobile internet: Unlearn the assumption of seamless high-speed internet in deep gaps like Tara mountains; save maps offline to guard safety."
      ],
      sr: [
        "Planina nije veštački zabavni park sa vodičima: Zaboravite asfaltirane i osigurane gradske šetačke staze; divlje rute Tare su kamenite i divlje kako bi se sačuvao ekosistem.",
        "Odbacite brzinsko skupljanje vidikovaca: Nemojte samo trčati kroz borik samo da biste se fotografisali na vrhu; zastanite u šumi na petnaest minuta, zatvorite oči i slušajte prirodu.",
        "Zaboravite na brzu 4G mrežu na liticama: Pokrivenost signalom u planinskim procepima i starim šumama je izuzetno slaba; uvek preuzmite mape u telefon."
      ],
      zh: [
        "原野森林绝对不是配备保全的安全游乐园：请扔掉对水泥光滑台阶与密集零食小卖部设点的城市依赖；裸岩松针才是高山森林最干净的主权宣告方式。",
        "抛弃快门卡点速食打卡：别在林间步道上火急火燎一掠而过。请在树林深处坐下，静心听松涛刮过深潭碎石的回响半刻钟。",
        "不要依赖畅通无阻的高清移动网络：别妄想在高海拔山地或峡谷死角中一直刷出高清导航；必须提前完成地理数据离线。安全至上。"
      ]
    },
    worthKnowing: {
      en: [
        "Download offline maps before heading deep: Cell towers are absent in several deep gorges. Relying on live navigation can leave you stranded.",
        "Verify mountain micro-climates before departures: Mountain weather can turn from perfectly clear skies to blinding dense storm fog inside fifteen minutes.",
        "Pack your own water and energy rations: Pure forest viewpoints maintain zero commercial stands; bring your own high-grip footwear and glass flask."
      ],
      sr: [
        "Preuzmite mape na telefon pre puta: U kanjonima i dubokim šumama mobilni operateri gube signal. Nemojte se oslanjati na online osvežavanja.",
        "Proverite mikroklimu pre polaska: Vreme na visokim planinama se menja neverovatnom brzinom. Jasno nebo može preći u olujnu maglu u roku od petnaest minuta.",
        "Donesite sopstvenu vodu i zaštitu: Na vrhovima staza nema prodavnica. Obezbedite adekvatnu planinsku obuću, ponesite flašu vode i lagane grickalice."
      ],
      zh: [
        "进山谷前先强制离线缓存GPS定位路线：云杉森林和深壑盲区极多，决不能拿网络安全去赌运气。",
        "出门前精确对天气走势：高空骤雨与烈风会在极短时间内突变，如若遇到雷电、飓风警报，切记必须果断退避，择日探访。",
        "自备足量饮用水与高能肉干：悬崖之尖谢绝商业垃圾桶和自动便利机，请踩好防滑户外登山鞋，肩背您的热量装备。"
      ]
    },
    idealFor: {
      en: "Serious wilderness hikers, landscape photographers, conservation lovers, and anyone seeking a digital detox and pure mountain elementals.",
      sr: "Planinari, fotografi pejzaža, ljubitelji zaštićene prirode i svi kojima je potreban beg od laptopa u zagrljaj divlje zemlje.",
      zh: "极限户外穿越旅人、纯粹风光摄影狂热分子、深信山岳森林具有天然细胞修护能量的养生慢游族。"
    },
    notIdealFor: {
      en: "Travelers seeking concrete paved trails, steel handrail safety grids, dense convenience stands, or those unwilling to bring outdoor gear.",
      sr: "Posetioce koji traže isključivo asfaltirane i betonirane staze sa bezbednosnim barijerama, ili one koji ne poseduju osnovnu sportsku i planinarsku opremu.",
      zh: "无法脱离水泥台阶、每百步就需要冷热售货亭与便利店、或者是不习惯独自踏着天然湿软松针步道越过原始峭壁峰峦的观光客。"
    },
    whyRecommended: {
      en: "To stand face-to-face with vast, ancient ecosystems that are largely left un-commercialized, raw, and biologically diverse.",
      sr: "Da se suočite sa ogromnim, drevnim prirodnim ekosistemima koji su ostali divlji, netaknuti i puni retkih vrsta životinja.",
      zh: "置身于未经现代人工抛光、原汁原味地保留了冰川与喀斯特板块冲突痕迹的浩瀚原始温带森林与绝崖幽谷中。"
    },
    whatMakesItSpecial: {
      en: "Cliff viewpoints without steel barriers, deep ancient spruce forests, hidden cold water springs, and dynamic weather patterns that challenge and restore human energy.",
      sr: "Vidikovci na liticama bez metalnih ograda, stogodišnje četinarske šume, skriveni hladni izvori i snažan planinski vazduh koji obnavlja telesnu snagu.",
      zh: "拒绝刺眼工业围栏遮蔽的高山悬岩远眺顶峰、千年古树遮天蔽日的云杉绿廊、石缝中直接流淌而出的零度高山泉水，以及带着凉爽薄荷甜香的高空负氧离子。"
    },
    coreValue: {
      en: "Silent geological scale, untouched eco-sanctuary and raw alpine exposure.",
      sr: "Tiha geološka prostranstva, netaknuti eko-rezervati i direktan susret sa divljom planinskom prirodom.",
      zh: "幽深宏大地质时间、毫无商业侵蚀的原始生态保护区，与澄澈高山稀薄空气的自然拥抱。"
    }
  },

  // History
  'history': {
    desiredOutcome: {
      en: "Obtain a meaningful and deep historical understanding of Roman, Byzantine, and Ottoman geopolitical crossroads.",
      sr: "Ostvarivanje dubokog i zrelog istorijskog razumevanja rimskih, vizantijskih i otomanskih epoha očuvanih u kamenu.",
      zh: "触碰横跨公元前古罗马边墙、拜占庭黄金圣殿与奥斯曼烽火巨堤的城石印记，感悟千年人类不屈求存的精神轨迹。"
    },
    whyItsWorthYourTime: {
      en: "Many travel guides treat historical landmarks as mere scenic backdrops, but European history is physically written into the raw stone ruins of Roman forts, Byzantine sanctuaries, and Ottoman fortress gateway keeps here. You will trace the epic struggles of empires that fought for control of geostrategic river crossroads. This represents an archive of human perseverance under immense struggles. To fully appreciate it, you must bypass fast-paced commercial tours and engage with oral resident scholars.",
      sr: "Većina vodiča predstavlja istorijske spomenike samo kao pozadinu za slikanje, ali ovde je evropska istorija fizički uklesana u sirovi kamen rimskih palata, vizantijskih crkava i otomanskih kapija. Pratićete epske borbe carstava koja su ginula za kontrolu nad geostrateškim rečnim raskrsnicama i ušćima. Ovo je živi arhiv ljudske izdržljivosti. Da biste ga osetili, morate izbeći bučne turističke grupe i saslušati usmenu istoriju od lokalnih čuvara.",
      zh: "许多旅行指南仅将历史遗迹视作冰冷的自拍背景片，而此处的巨石要塞与修道院深墙则是横跨两千年、刀劈斧凿般刻入石阶下的帝国史诗。您将抚摸到由古罗马军团红砖砌成的城防护墙，与拜占庭及奥斯曼火炮攻防留下的焦痕。这里是文明碰撞地缘十字路口上生存意志、不屈死守精魂的壮丽见证。坚决拒绝游乐园式的低俗商业伪演出，唯有带着敬畏之心，轻声向神坛旁的黑袍隐士或老年掌故馆员客气探讨，方能揭开尘封在一千载烟尘下的英雄抵抗战记。"
    },
    unlearn: {
      en: [
        "These ancient fortresses are not photography props: Unlearn treating historic battlements merely as visual selfie platforms; they contain layers of tragic and epic geopolitical struggles.",
        "Expect no theme-park actors: Unlearn the desire for tourist theatrical shows or costumed historical reenactors; the dignity of Belgrade's ruins lies in unpolished medieval stone.",
        "Do not run through stone crypts: Unlearn the fast sightseer pace; silent galleries and ancient brickworks require standing still to absorb their temperature."
      ],
      sr: [
        "Utvrđenja nisu obični foto-rekviziti: Zaboravite posmatranje kula isključivo kroz sočivo telefona; ove stene kriju slojeve epskih stradanja i herojske geopolitičke odbrane.",
        "Ne očekujte kostimirane animatore: Odustanite od očekivanja komercijalnog pozorišta za turiste; prava snaga leži u neizmijenjenom i ogoljenom srednjovekovnom kamenu.",
        "Ne žurite kroz planiske kripte: Zaboravite na brzi turistički hod; tamne podzemne galerije zahtevaju zastoj u tišini kako biste osetili hladnoću prohujalih vekova."
      ],
      zh: [
        "绝壁要塞绝非空洞的网红拍照道具：抛弃将刀斧枪弹战壕仅当做自拍画布的肤浅心态；每一块厚墙背后都深埋着文明拼死抵御外侮的悲壮鲜血。",
        "不要期待游乐园式的古装演出：别去寻找假惺惺、雇佣演员扮演中世纪骑士的闹剧；废墟废垣高贵的价值恰来源于其冷冰冰、原封不动的真实历史面貌。",
        "切勿大肆疾走穿越地下暗河：抛开催促的脚步；唯有独自在幽暗、浸透硝石气味的拱顶下默立数分钟，方能穿越时空感受金戈铁马的气息。"
      ]
    },
    worthKnowing: {
      en: [
        "Read geostrategic histories before visiting: Reviewing a summary of imperial clashes will turn simple massive grey cubes into dramatic sites of global siege.",
        "Engage with local caretakers: These ruins reject plastic automated guides; open up polite conversations with elderly scholars who carry oral local chronicles.",
        "Respect active religious rules: Active monasteries enforce strict dressing rules (long pants, covered shoulders). Turn off phone devices inside the sanctuaries."
      ],
      sr: [
        "Pročitajte istoriju pre samog polaska: Razumevanje geopolitike Rimskog ili Turskog carstva pretvoriće sivi kamen u uzbudljivu arenu dramatičnih opsada.",
        "Popričajte sa čuvarima i kustosima: Ovde se izbegavaju jeftini digitalni audio-snimci; dragocenost se skriva u usmenom predanju starijih meštana.",
        "Poštujte crkvena i sestrinska pravila: U aktivnim hramovima obavezna je dugačka odeća koja pokriva ramena i kolena. Isključite mobilne telefone pri ulasku."
      ],
      zh: [
        "动身前粗读一两段该古迹的围攻历史：对罗马或奥斯曼帝国地缘战线的轻微框架了解，会让原本无趣的灰色城砖瞬间在脑中化为狼烟四起的古战场。",
        "去向历史库藏管理员主动礼貌交谈：此处的掌故皆通过口耳相传。不要对微胖、严肃、但满腹经纶的老学者视而不见点，客气问两句会大开眼界。",
        "严格自律敬奉场所的神圣清规：保持教堂大殿的肃静与断网状态；入寺绝不暴露肩膝、不拍摄做早课的神职人员，共同守望这份庄严。"
      ]
    },
    idealFor: {
      en: "Intellectual travelers, visual historians, researchers of geostrategic architecture, and deep seekers of human endurance and perseverance.",
      sr: "Ljubitelji istorije i geopolitike, istraživači kulture, pasionirani arhitekte i svi koji traže dublju istinu u kamenu.",
      zh: "深度地缘历史迷、古典堡垒结构设计师、古建筑人文考据爱好者，以及在文明废墟中探求地缘生存哲学、审视时间长河的智者。"
    },
    notIdealFor: {
      en: "People looking for fast-paced amusement parks, loud commercial checklist tours, or those uninterested in slow, silent historical contemplation.",
      sr: "Posetioce koji traže brzu zabavu u stilu diznilenda, bučni grupni turizam sa zastavicama, ili koji nisu spremni za tiho i duboko kulturno promišljanje.",
      zh: "钟情于网红背景板打卡合影、喜欢凑热闹追随大喇叭旗帜旅行团、或者是对聆听古圣贤石刻碑文残章背后的沉重心灵故事感到枯燥乏味的过客。"
    },
    whyRecommended: {
      en: "To trace the physically striking crossroads of Roman, Byzantine, Ottoman, and Christian struggles preserved in stone architecture across Europe's eastern gateway.",
      sr: "Da se uverite u arhitektonske svedoke burnih rimskih, vizantijskih, turskih i hrišćanskih borbi na istočnoj kapiji Evrope.",
      zh: "抚摸凝固在堡垒巨墙、皇权废墟与东正道场之中的两千年人类史诗，体悟欧亚地缘大碰撞中对信念死守不退的悲壮气魄。"
    },
    whatMakesItSpecial: {
      en: "Unrestored massive stone walls containing authentic Roman brick scars, fortress cliffs facing majestic rivers, and ancient monasteries preserving centuries of living traditions.",
      sr: "Neobnovljeni masivni kameni zidovi sa originalnim rimskim opekama, stene i utvrđenja uz reke i manastiri koji čuvaju duga vekovna predanja.",
      zh: "完全拒绝假古董式的钢筋水泥伪修复，这些斑驳巨石至今保留着公元前古罗马箭镞的凿痕，与迎风屹立于萨瓦和多瑙河交界处的雄浑城防火线。"
    },
    coreValue: {
      en: "Direct physical contemplation of historical crossroads and ancient manual stone craftsmanship.",
      sr: "Direktno svedočenje burnim istorijskim raskrsnicama i drevnom ručnom klesarskom umeću.",
      zh: "直面欧亚交界处地缘史诗断代，与古代石匠巧夺天工的纯手作厚重工艺。"
    }
  },

  // Wellbeing
  'wellbeing': {
    desiredOutcome: {
      en: "Achieve deep cell rejuvenation, physical tissue recovery, and clinical wellness with unhurried modern medical precision.",
      sr: "Postizanje dugoročne ćelijske obnove, obnavljanja vitalne snage tkiva i oporavka kroz tihu banjsku vulkansku terapiju.",
      zh: "享受世界前沿显微及医美器械的非凡精准度，配以千年天然火山高硅硫矿温泉，重唤全身脏器与活性发肤的顶级健康机能。"
    },
    whyItsWorthYourTime: {
      en: "True medical well-being is not about high-speed, glossy franchise clinics or cosmetic superficial shortcuts; it is an unhurried diagnostic investment in your cellular longevity and structural body tissue health. Serbia's top-tier thermal volcanological spas and micro-endodontic dental centers synthesize cutting-edge clinical devices with high-precision medical attention. Your tissue recovery is backed by the restorative trace metals of volcanic hot mineral waters that heal from within.",
      sr: "Istinski zdravstveni oporavak se nikada ne meri brzim i skupim neon kozmetičkim tretmanima u sterilnim modernim klinikama, već dugim, preciznim radom na ćelijskoj obnovi vašeg tela. Banje i klinike u Srbiji spajaju savremene svetske mikroskopske i estetske uređaje sa visoko personalizovanim vremenom lekara koji vam se posveti. Regeneracija vašeg tkiva je podržana i lekovitom vulkanskom izvorskom vodom bogatom silicijumskom kiselinom.",
      zh: "真正的医疗康养绝非流于表面的网红整形项目或一味追求高效的商业美容 franchise 诊所，而是一场由主治医师一对一、倾注海量排查光阴的细胞层级抗衰与机体组织结构系统重塑。本国顶尖的微创显微种植专科与医疗级火山硫矿温泉，无缝结合了最严苛的前沿微创设备及罗马帝国传承千年的自然水热疗法。高浓度的硅酸与锶等活性微量阳离子，将在寂静、温暖的火山热裹敷中渗透发肤，带来直达脏器和骨骼内部的深层细胞级奇迹重组。"
    },
    unlearn: {
      en: [
        "Wellbeing is not a rapid cosmetic shortcut: Unlearn expecting neon franchise clinics with overnight miracle lasers; genuine cell rejuvenation is backed by rigorous diagnostic timelines and medical patience.",
        "Avoid high-noise amusement slide parks: Unlearn expecting loud commercial aquaparks with shouting crowds; premium thermal healing requires silent natural steam pools.",
        "Do not demand corporate luxury packaging: Unlearn seeking high-contrast marble showrooms; true medical quality resides in highly individualized doctor attentiveness and rich volcanic soil."
      ],
      sr: [
        "Urbana kozmetika nije medicinsko lečenje: Zaboravite instant čuda i instant rešenja u neonskim klinikama; prava regeneracija ćelija kože i tkiva zahteva stručne preglede i posvećenost lekara.",
        "Izbegavajte bučne akva-parkove sa toboganima: Prava lekovita vulkanska voda traži tihu, mirnu banjsku tišinu i prirodne parne kupatila.",
        "Ne tražite hladan korporativni salonski luksuz: Savršen ishod zavisi od medicinske posvećenosti stručnjaka, a ne od skupih mermernih predsoblja."
      ],
      zh: [
        "网红医美绝对不是细胞康养的捷径：扔掉三天速成变美的流水线激光执念；真正的脏器与组织修复需要主治医师在显微镜前花费数小时精耕细作。",
        "绝非吵闹的游乐戏水大喇叭滑梯游乐园：请远离那些喧闹、充满高架喊叫声音的普通水上充气滑水乐园；顶奢泉热需要安静、蒸汽缭绕的火山死水环境。",
        "切勿用空洞的五星酒店大理石秀场定义品质：顶级的医疗技术核心正蕴含在医生耐心专注的面诊问话，和富含火山锶的高纯矿泥中。"
      ]
    },
    worthKnowing: {
      en: [
        "Honor individual diagnostic timelines: Allow the physician maximum evaluation time without rushing; diagnostic precision is what generates absolute surgical/aesthetic safety.",
        "Leverage native volcanological minerals: True organic recovery is driven by natural volcanic springs rich in healing silicic acid and strontium.",
        "Maintain strict post-therapy recovery: Combine high-end dental or micro-dermatology treatments with offline rest in quiet scenic banjas (spas) to let tissues heal."
      ],
      sr: [
        "Poštujte medicinske termine i preglede: Dozvolite lekaru da u potpunosti prouči vaše stanje; precizna dijagnostika osigurava bezbednost estetskih tretmana.",
        "Iskoristite snagu vulkanskih minerala: Prirodni oporavak tela se pojačava banjskom vodom bogatom silicijumovom kiselinom i aktivnim metalima.",
        "Pratite striktna pravila nakon tretmana: Kombinujte stomatološki ili dermatološki rad sa odmorom u tišini banjskih lečilišta radi potpunog zaceljenja tkiva."
      ],
      zh: [
        "严格尊奉个性化排查时间红线：请向诊疗医生空出极其安稳细致的面诊光阴，精细前置检查是根绝术后创伤与不良后遗反应的第一铁则。",
        "深度沐浴古老火山的高硅矿温泉：全身发肤的更新源自富含超高硅酸、锶等活性微量阳离子的火山热裹水疗法。能快速舒缓精神面部压力。",
        "坚持规范的术后断代深静养期：将高端显微微创治疗与小镇静谧泉疗隐休无缝拼合。不要直接乘坐飞机颠簸，保证伤口在清凉山风中自愈。"
      ]
    },
    idealFor: {
      en: "Meticulous clients, international health tourists, and individuals prioritizing absolute dental/skin safety, biological cell rejuvenation, and unhurried clinical attention.",
      sr: "Pedantne klijente, međunarodne zdravstvene turiste i pojedince koji cene apsolutnu sigurnost, ćelijskom podmlađivanju i tihu lečilišnu negu.",
      zh: "对医学严谨性要求极高的高净值客户、跨国大病及美学医疗康养人群，以及将牙齿、皮肤健康和天然温泉排毒置于首位的人群。"
    },
    notIdealFor: {
      en: "Travelers seeking high-tech sterile laser aesthetics, instant cosmetic treatments, or crowded water parks and high-noise amusement slides.",
      sr: "Klijente koji očekuju sterilne hirurške prostore u neonu, brza rešenja bez vremena oporavka, ili goste željne bučnih akva partijski-tobogana sa bukom.",
      zh: "偏好高冷现代风科美手术治疗、期待欢叫大喇叭过山水上滑梯乐园、或者是完全无法躺下来静心接受巴尔干草本火山排毒泥裹敷的急性子人士。"
    },
    whyRecommended: {
      en: "To receive top-tier restorative dermatological, dental, or thermal therapies with high physician precision and organic balneological mineral counts.",
      sr: "Da doživite vrhunski estetski oporavak, rekonstruktivnu negu i blagotvorna termalna lečenja pod nadzorom vodećih lekara.",
      zh: "在此私享欧洲顶尖、极具高性价比的显微牙齿种植系统、基因抗衰皮肤医学，及源自罗马帝国的天然富矿火山温泉水疗护理。"
    },
    whatMakesItSpecial: {
      en: "The combination of cutting-edge clinical devices, highly individualized diagnostic time, and thermal mineral volcanic springs rich in curative silicic acid and trace metals.",
      sr: "Kombinacija najsavremenije svetske medicinske tehnologije, dugog personalnog rada sa lekarom i lekovitih mineralnih termalnih voda.",
      zh: "将西方最前沿的实验室制备医学设备、主治医师一对一深度面诊排查的充裕光阴，与地壳深处富含高硅酸、锶及微量金属阳离子的医疗级火山温泉，完美交融。"
    },
    coreValue: {
      en: "Achievment of cellular resilience and clinical state of wellbeing under strict, unhurried physician devotion.",
      sr: "Postizanje ćelijske regeneracije i dugotrajnog oporavka uz potpunu, opuštenu posvećenost stručnih planinskih lekara.",
      zh: "在高山温泉水热能量与显微医学精磨器械交织下，完成直达骨骼与脏器深处的生命细胞自我进化."
    }
  }
};

// 3. DEFAULT TRUTH DATA
const DEFAULT_TRUTH_DATA: Record<string, any> = {
  desiredOutcome: {
    en: "Experience deep cellular recovery and genuine cultural alignment away from superficial city checklists.",
    sr: "Doživite dubok telesni oporavak i iskreno povezivanje sa tradicijom, van površnih gradskih šema.",
    zh: "在被钢筋水泥过度驯化之外，彻底卸下高压防备，感悟一门由衷而充满自尊风骨的慢调人生哲学。"
  },
  whyItsWorthYourTime: {
    en: "True travel is not a rushed checklist of superficial sights or standardized commercial tour packages; it is a profound expansion of your presence and an authentic alignment with local ways of being. This curated journey teaches you to ditch structured hourly slots and open yourself to spontaneous invitations, neighborhood chats, and local table rituals. By seeking raw heritage over high-tech luxury superficialities, you discover a meaningful lifestyle where hospitality is a sovereign pride.",
    sr: "Pravi put doživljaja nije ubrzani spisak spomenika sa kvačicama na mapi koji služe za plitko fotografisanje, već duboko proširenje vaše prisutnosti i spajanje sa lokalnom filozofijom života. Ovaj uređeni vodič vas uči da odbacite kruto tempiranje dana i otvorite se za spontane razgovore u komšijskim starim kafićima. Tragajući za izvornim nasleđem umesto sterilnog korporativnog luksuza, otkrivate autentično gostoprimstvo koje se drži kao porodični ponos.",
    zh: "真实的行旅绝非行色匆匆、执着于对照勾选打卡表格的流水线包车团套餐，而是一场旨在拓宽心灵觉知深度、与本地原住居民高贵慢生活腔调共振的洗礼。这项专属典藏指引将教会您摒除生硬的钟表槽刻，空出松弛充沛的日程，去偶遇街角大爷突然推开窗向你递出的一杯馥郁咖啡。珍视充满岁月烟熏痕迹的高山手作遗存，远胜于消费大同小异的统一高平奢华装潢。您会在这里重新体悟到，何为被赋予了由衷神圣感的手作、地缘温度与真诚待客之道。"
  },
  unlearn: {
    en: [
      "Travel is not a fast list checking: Unlearn the urge to rush between sights to tick off check-boxes; true heritage requires unhurried, quiet observation.",
      "Drop online rating engines: Unlearn relying strictly on commercial reviewer apps; ask active street vendors or local neighborhood craftsmen instead.",
      "Sanitized cruise-ship services do not exist here: Unlearn looking for highly standardized corporate corporate pampering. Value native family warmth."
    ],
    sr: [
      "Zaboravite na jurnjavu po mapi: Ne gledajte uspeh puta kroz broj fotografisanih mesta; istinsko nasleđe zahteva mirno i sporo posmatranje bez žurbe.",
      "Ugasite pretraživače i algoritme: Zaboravite zvezdice turističkih korporativnih sajtova; usmena preporuka pekara ili komšije vredi stotinu puta više.",
      "Ne očekujte sterilni hotelski luksuz svuda: Odustanite od korporativnih franšiza. Naučite da cenite prirodno gostoprimstvo i domaću iskrenu hranu."
    ],
    zh: [
      "行旅绝不是填表格上的打卡九宫格：卸下急躁赶往下一场景的心浮气躁；真正的文化底蕴，往往需要慢行与静默空闲去滋养。",
      "关闭充斥着消费主义的商业推荐应用：不要完全听信互联网冷冰冰的算法推荐；不妨向热心的花商、洗杯大叔投去善意的微笑，他们口中是真正的口碑。",
      "高同质化的连锁酒店套路并不适用：丢掉空洞五星商务的星级框架，去体会巴尔干高山家庭亲自为你端上一杯泉水陈酿热汤背后的神圣骄傲。"
    ]
  },
  worthKnowing: {
    en: [
      "Leave some margins open in your daily hours: Avoid cramming every single hour. Spontaneous chats over local house coffee are the soul of the culture.",
      "Keep cash dinars paper (RSD) handy: Many traditional bakers, open markets, and rural handcraft workshops do not accept dynamic credit cards.",
      "Engage directly with neighborhood residents: Cultivate active presence. Address locals politely with a warm greeting; local home hospitality is a serious pride."
    ],
    sr: [
      "Ostavite slobodan prostor u rasporedu: Nemojte planirati svaku sekundu. Spontana domaća kafa i čašica razgovora su stvarna duša balkanske kulture.",
      "Uvek imajte spremne papirne dinare (RSD): Autentične pekare, zelene pijace i zanatlije ne primaju digitalne kartice; nemojte ostati bez gotovine.",
      "Komunicirajte toplo sa meštanima: Budite prisutni u trenutku. Pozdravite ljude sa osmehom; naše gostoprimstvo je stvar najvišeg porodičnog ponosa."
    ],
    zh: [
      "空出大量没有预设轨道的缓冲日程：切勿像开会般排雷日程。街边咖啡桌大叔的偶遇攀谈，往往是文化中最绚烂的奇迹花朵。",
      "备齐当地纸张现金第纳尔（RSD）：无数古老传统面包房、老摊头和高山上的手工作坊几乎都拒绝一切数字信用卡刷卡设备。",
      "直率热诚地向原住民点头致意：保持大方、亲切的心态，用客气尊重的口吻交接，你会叩开整个地区最引以为豪的传统家庭款待之门。"
    ]
  },
  whyRecommended: {
    en: "To discover the true, unhurried cultural soil and raw natural integrity of a geostrategic crossroad preserved in family pride.",
    sr: "Da otkrijete istinski, spori kulturni koren i prirodnu snagu geostrateške raskrsnice sačuvane u porodičnom ponosu.",
    zh: "深入这片横跨地缘欧亚、由家族世系传人以自尊守护、流淌着最纯正日光力量与人文风骨的原生大地。"
  },
  whatMakesItSpecial: {
    en: "Generational oral history, raw stone architectures untouched by global chains, and highly personalized host attention.",
    sr: "Usmena istorija koja se prenosi generacijama, autentične kamene građevine van globalnih lanaca i tupa neposrednost domaćina.",
    zh: "跨越几代人薪火传承的口耳史诗、完全摒绝了全球大连锁、大资本清洗的原始地缘巨石，与庄主对宾客倾注光阴的桌端招待。"
  },
  whoWillEnjoy: {
    en: "Mindful travelers seeking human depth, advocates of slow travel, and lovers of geographic and culinary authenticity.",
    sr: "Svesni putnici koji traže ljudsku toplinu, ljubitelji slow travel koncepta i tragači za geografskom i kulinarskom istinom.",
    zh: "推崇慢行旅、渴望沉淀觉知并在市井风土中寻得由衷真实人情温度与自然风貌洗礼的深度智者。"
  },
  coreValue: {
    en: "Deepening your present presence and embracing direct, unhurried local perspectives.",
    sr: "Produbljivanje prisutnosti u trenutku i prihvatanje direktnih, laganih beogradskih perspektiva.",
    zh: "沉淀当下饱满的心灵觉知，悉心内化地道、随心且绝不紧绷的巴尔干式本地智慧。"
  }
};

// 4. NOT IDEAL FOR PROFILES DIRECT LOOKUPS
const NOT_IDEAL_PROFILES: Record<string, Record<string, string>> = {
  '1': {
    en: "Rushed checklist travelers, people expecting smooth handrailed concrete sidewalks/fences, or individuals unprepared with professional high-grip outdoor hiking footwear.",
    sr: "Turiste u žurbi koji sakupljaju kvačice na mapi, posetioce koji očekuju popločane staze sa zaštitnim ogradama, ili one koji nemaju planinarsku obuću sa dobrim prianjanjem.",
    zh: "追求在30分钟内拍照闪人的打卡速食游客、无法离开平坦水泥人行道与高耸扶栏安全栅网的城市行者、或是不愿换装专业高抓地力户外登山鞋的休闲观光客。"
  },
  '2': {
    en: "Tourists seeking loud commercial amusement parks, modern flashy shows, or those unwilling to pack modest clothing and honor quiet monastic prayer silence.",
    sr: "Ljubitelje bučnih turističkih atrakcija i zabavnih parkova, moderne glasne prezentacije, ili one koji ne žele da poštuju pravila odevanja i mir u aktivnom verskom hramu.",
    zh: "期待游乐园式声光电娱乐、吵闹叫嚷商业团氛围的行者，或者是无法安静在神圣内殿保持轻微低语、抗拒避膝蔽肩严肃着装规范的旅客。"
  },
  '3': {
    en: "Early sleepers, sports tracksuit/sweatpants wearers, or those seeking generic, commercial top-40 club hits with high-volume hype instead of curated sub-cultural electronic sets.",
    sr: "One koji ležu ranije, nose sportske trenerke ili traže isključivo industrijsku top-40 komercijalnu pop muziku umesto kustoski probranih underground elektronskih setova.",
    zh: "习惯晚上10点早憩的家庭游客、身着过于臃肿或休闲的肥大连体运动服人士，或者是只想随处听到口水洗脑单曲、拒绝融入地下暗黑电子先锋声波大浪潮的舞客。"
  },
  'wine': {
    en: "Uninterested or rushed sightseeing groups, guests seeking sweet mass-produced dining wines, or those demanding sterile corporate luxury showrooms.",
    sr: "Turiste u žurbi, kupce industrijskih visokoslatkih vina ili posetioce koji očekuju sterilni korporativni luksuz i preskupe salonske prodavnice.",
    zh: "抱着“买瓶即走”快餐心态的行者、图省事专点全球同质化赤霞珠/梅洛等大众甜水的人群、或者是极力要求高冷美式商业Showroom展厅的人士。"
  },
  'gastronomy': {
    en: "Clock-watching, high-speed diners, tourists seeking automated fast food, or those expecting sterile, silent corporate eating spaces.",
    sr: "Goste u žurbi koji nemaju bar dva slobodna sata za večeru, one koji očekuju instant fast-food posluženje, ili tražioce sterilnih, nemih korporativnih franšiza.",
    zh: "追求在数十分钟内快战快决填饱肚皮的速食吃货、苛求绝对静音就餐环境、或者是抗拒酒馆现场手风琴及乐手即兴歌舞互动的人群。"
  },
  'nature': {
    en: "Travelers seeking concrete paved trails, steel handrail safety grids, dense convenience stands, or those unwilling to bring outdoor gear.",
    sr: "Posetioce koji traže isključivo asfaltirane i betonirane staze sa bezbednosnim barijerama, ili one koji ne poseduju osnovnu sportsku i planinarsku opremu.",
    zh: "无法脱离水泥台阶、极度依赖平坦护栏、每百步就需要售货亭与便利店、或者是不习惯独自踏着天然湿软松针步道越过原始峭壁峰峦的观光客。"
  },
  'history': {
    en: "People looking for fast-paced amusement parks, loud commercial checklist tours, or those uninterested in slow, silent historical contemplation.",
    sr: "Posetioce koji traže brzu zabavu u stilu diznilenda, bučni grupni turizam sa zastavicama, ili koji nisu spremni za tiho i duboko kulturno promišljanje.",
    zh: "钟情于网红背景板打卡合影、喜欢凑热闹追随大喇叭旗帜旅行团、或者是对聆听古圣贤石刻碑文残章背后的沉重心灵故事感到枯燥乏味的过客。"
  },
  'wellbeing': {
    en: "Travelers seeking high-tech sterile laser aesthetics, instant cosmetic treatments, or crowded water parks and high-noise amusement slides.",
    sr: "Klijente koji očekuju sterilne hirurške prostore u neonu, brza rešenja bez vremena oporavka, ili goste željne bučnih akva partijski-tobogana sa bukom.",
    zh: "偏好高冷现代风科美手术治疗、期待欢叫大喇叭过山水上滑梯乐园、或者是完全无法躺下来静心接受巴尔干草本火山排毒泥裹敷的急性子人士。"
  },
  'default': {
    en: "Rushed checklist travelers, commercial comfort seekers who demand sanitized cruise-ship services, or tourists who evaluate deep heritage by high-tech luxury superficialities.",
    sr: "Turiste u žurbi koji samo sakupljaju kvačice na mapi, one koji očekuju sterilni korporativni luksuz, ili koji prate isključivo trendovska komercijalna mesta.",
    zh: "行色匆匆、急于完成打卡九宫格表格、抗拒与真实活生生的小镇居民微笑交接，以及不满足于朴实厚重家庭桌端接待的超快节奏游客。"
  }
};

/**
 * Solid, analytical, first-principles mapping resolver under the unified MASTER CURATION FRAMEWORK.
 * Combines Hormozi parameters with extreme design visual layouts.
 */
export function getTruthCurationForRecommendation(item: Recommendation, lang: string): TruthCurationResult {
  const l = lang === 'sr' ? 'sr' : lang === 'zh' ? 'zh' : 'en';

  if (!item) {
    const defaultRec = DEFAULT_TRUTH_DATA.whyItsWorthYourTime[l] || DEFAULT_TRUTH_DATA.whyItsWorthYourTime.en;
    const defaultUnlearn = DEFAULT_TRUTH_DATA.unlearn[l] || DEFAULT_TRUTH_DATA.unlearn.en;
    const defaultWorth = DEFAULT_TRUTH_DATA.worthKnowing[l] || DEFAULT_TRUTH_DATA.worthKnowing.en;
    const defaultIdeal = DEFAULT_TRUTH_DATA.whoWillEnjoy[l] || DEFAULT_TRUTH_DATA.whoWillEnjoy.en;
    const defaultNotIdeal = NOT_IDEAL_PROFILES.default[l] || NOT_IDEAL_PROFILES.default.en;

    return {
      whyRecommended: DEFAULT_TRUTH_DATA.whyRecommended[l] || DEFAULT_TRUTH_DATA.whyRecommended.en,
      whatMakesItSpecial: DEFAULT_TRUTH_DATA.whatMakesItSpecial[l] || DEFAULT_TRUTH_DATA.whatMakesItSpecial.en,
      whoWillEnjoy: defaultIdeal,
      antiAdvice: defaultWorth,
      coreValue: DEFAULT_TRUTH_DATA.coreValue[l] || DEFAULT_TRUTH_DATA.coreValue.en,
      desiredOutcome: DEFAULT_TRUTH_DATA.desiredOutcome[l] || DEFAULT_TRUTH_DATA.desiredOutcome.en,
      outcomeProtection: defaultWorth,
      idealFor: defaultIdeal,
      notIdealFor: defaultNotIdeal,
      unlearn: defaultUnlearn,
      worthKnowing: defaultWorth,
      shortRecommendation: "Explore the raw, sovereign heritage and escape commercial clichés.",
      whyItsWorthYourTime: defaultRec
    };
  }

  const itemId = String(item.id || '');
  const categories = String(item.category || '').toLowerCase();
  const title = String(item.title || '').toLowerCase();

  // Pick short description
  let shortRec = "Explore the raw, sovereign heritage and escape commercial clichés.";
  if (item.shortDescription) {
    if (typeof item.shortDescription === 'object') {
      shortRec = (item.shortDescription as any)[l] || (item.shortDescription as any)['en'] || shortRec;
    } else {
      shortRec = String(item.shortDescription);
    }
  }

  // 1. Direct Item Matching
  if (SPECIFIC_TRUTH_DATA[itemId]) {
    const d = SPECIFIC_TRUTH_DATA[itemId];
    return {
      whyRecommended: d.whyRecommended[l] || d.whyRecommended.en,
      whatMakesItSpecial: d.whatMakesItSpecial[l] || d.whatMakesItSpecial.en,
      whoWillEnjoy: d.idealFor[l] || d.idealFor.en,
      antiAdvice: d.worthKnowing[l] || d.worthKnowing.en,
      coreValue: d.coreValue[l] || d.coreValue.en,
      desiredOutcome: d.desiredOutcome[l] || d.desiredOutcome.en,
      outcomeProtection: d.worthKnowing[l] || d.worthKnowing.en,
      idealFor: d.idealFor[l] || d.idealFor.en,
      notIdealFor: d.notIdealFor[l] || d.notIdealFor.en,
      unlearn: d.unlearn[l] || d.unlearn.en,
      worthKnowing: d.worthKnowing[l] || d.worthKnowing.en,
      shortRecommendation: shortRec,
      whyItsWorthYourTime: d.whyItsWorthYourTime[l] || d.whyItsWorthYourTime.en
    };
  }

  // 2. Viticulture / Wine Regions
  if (title.includes('wine') || title.includes('winery') || title.includes('vino') || categories.includes('wine') || title.includes('vineyard') || title.includes('zupa')) {
    const wineOutcome = {
      en: "Savor rare indigenous wine grapes (Prokupac and Tamjanika) and engage in memorable, slow-paced family table conversations in rustic stone cellars.",
      sr: "Uspostavljanje toplog, neposrednog razgovora sa autentičnim vinarima Župe i uživanje u izvornim ukusima autohtonih sorti Prokupac i Tamjanika.",
      zh: "在风化千载的高山石窑深处，慢尝最纯净古老濒非葡萄品种原浆（香姬Tamjanika与普罗库帕茨Prokupac），深交酒农并带回手作珍藏。"
    };

    const wineRec = {
      en: "Most travelers buy generic supermarket brands, but the Župa wine valleys teach you that a bottle can carry centuries of survival and geological memory. Savoring the rare, ancient indigenous grape varieties Prokupac and Tamjanika in family-run stone cellars (poljane) is an intimate conversation with generational winemakers, not a cold commercial transaction. This experience rejects superficial checklist tourism; it invites you to spend time on shared local platters, hearing raw, oral memories of family resilience.",
      sr: "Većina komercijalnih turista kupuje uniformisana industrijska francuska i italijanska vina, ali vinske regije Srbije poput bajkovite Župe preneće vam tajne o tlu, suncu i opstanku koje su se čuvale stotinama godina kroz porodične loze. Kada degustirate retke, drevne autohtone sorte Prokupac (crveni kralj balkanskih brda) i mirisnu Tamjanicu unutar podrumskih poljana od klesanog kamena, vi ne vršite samo transakciju; vi ulazite u duboki, spori i dirljivi razgovor sa samim vinarima i njihovom istorijom.",
      zh: "多数旅行者习惯购买高度工业化的主流知名葡萄酒款，而巴尔干高山石窑里的原生葡萄汁液则完全是另一种灵魂洗礼。在著名的如帕（Župa）等高山古老阶地深处，由世代庄主躬身守护的普罗库帕茨（Prokupac，红葡萄之王）与带有玫瑰麝香甜美的香姬（Tamjanika），正静静在天然阴凉、在泥土里掘出的古朴地窖里陈酿。这绝对不是流水线式的商业品鉴展厅，而是一场伴着手工自制熏猪后腿和老干酪、听大叔大爷们叙述家族数百年沉浮的地道家庭对话。不赶时间、轻晃酒杯，去触碰在火山页岩与松软页沙中流淌出的一万年日光力量。"
    };

    const wineUnlearn = {
      en: [
        "This is not a corporate wine showroom: Unlearn expecting high-contrast glass showrooms or standardized commercial corporate selling; family cellars are rustic archives of stone.",
        "Reject sweet mass-produced cooking wines: Unlearn standard mass tastes; true Balkan viticulture values the complex, mineral dry nature of native Prokupac.",
        "Do not rush the tasting briefing: Unlearn looking at your watch; winemakers expect you to sit down, break bread, and have conversational presence."
      ],
      sr: [
        "Ovo nije sterilna salonska prodavnica vina: Zaboravite korporativni luksuz i staklene police u sjaju; ovdašnji porodični podrumi su stari kameni arhivi ispunjeni tradicijom.",
        "Odbacite preslatka industrijska stona vina: Sredite svoja čula; pravo balkansko vinarstvo gosti dubokom i mineralnom suvom strukturom autohtonog Prokupca.",
        "Nikada nemojte žuriti sa degustacijom: Zaboravite na gledanje u sat; ovdašnji vinari vas doživljaju kao gosta sa kojim se deli hleb, loza i razgovor."
      ],
      zh: [
        "这绝非高大上的美式商业Showroom展馆：丢掉大理石玻璃酒杯陈列的条饰偏见；此处的家庭酒窖往往是潮湿、昏暗、原汁原味的黑石地窑群落（Poljana）。",
        "拒绝口水级的工业甜水佐餐酒：别戴着“越甜越好喝”的偏见入场；真正的巴尔干原生葡萄，极推崇普罗库帕茨火山沙土带来的矿物质和干涩厚重。",
        "切勿带着赶场的心浮气躁：别踩着秒针去倒酒；庄主会倒上海里的水果 rakija，搬出熏猪腿和你在柴火旁痛快大聊他们曾从侵蚀中幸存的历史。"
      ]
    };

    const wineWorth = {
      en: [
        "Limit visits to maximum three cellars a day: Unlearn running between viewpoints; tasting wine here is a major investment of hospitality, requiring time.",
        "Prioritize native grapes like Prokupac and Tamjanika: Pass on standard uniform international grapes (Cabernet/Merlot) to honor real cultural viticulture.",
        "Engage in direct slow conversations with winemakers: Avoid quick transactions; hear their stories of geopolitical survival and family cellar inheritance."
      ],
      sr: [
        "Ograničite se na najviše tri podruma dnevno: Ne trčite od kušaone do kušaone. Degustacija je ovde investicija u gostoprimstvo koje zahteva vreme.",
        "Apsolutno birajte domaće sorte poput Prokupca i Tamjanike: Preskočite globalne sorte kako biste doživeli stvarni i autentični vinski duh.",
        "Uđite u spor i ličan razgovor sa vinarima: Izbegavajte brzi pazar; saslušajte njihove priče o preživljavanju vinograda kroz teška vremena."
      ],
      zh: [
        "限制单日探访在最多三家酒窖之内：决不进行走马观花。每一次叩门都是一轮盛情款待，需要投入充沛的生命光阴。",
        "将香姬（Tamjanika）和普罗库帕茨（Prokupac）列为第一顺位：舍弃高度同质化的赤霞珠/梅洛，去聆听本土地壳沙土里本源的声音。",
        "与酿酒大叔开启真诚漫长的一对一畅聊：拒绝冷冰冰的刷卡购买即走；伴着熏火腿，听大叔讲讲当年为了抢救这一株原生藤曼所经历的坚守。"
      ]
    };

    const wineIdeal = {
      en: "Experiential wine collectors, culinary purists, and travelers prioritizing authentic human connection over polished luxury showrooms.",
      sr: "Poštovaoci originalnih ukusa, istraživači vinske tradicije i putnici koji cene ljudsku iskrenost ispred sterilnog luksuza.",
      zh: "拒绝雷同包装的精品独立葡萄酒藏家、偏好手作感质地风味的味觉极简主义者，以及愿意将时间融化在醇厚酒香中的行者。"
    };

    const wineNotIdeal = NOT_IDEAL_PROFILES.wine[l] || NOT_IDEAL_PROFILES.wine.en;

    return {
      whyRecommended: wineOutcome[l] || wineOutcome.en,
      whatMakesItSpecial: wineRec[l] || wineRec.en,
      whoWillEnjoy: wineIdeal[l] || wineIdeal.en,
      antiAdvice: wineWorth[l] || wineWorth.en,
      coreValue: "Cultivating slow, authentic conversations with passionate winemakers in historic family cellars.",
      desiredOutcome: wineOutcome[l] || wineOutcome.en,
      outcomeProtection: wineWorth[l] || wineWorth.en,
      idealFor: wineIdeal[l] || wineIdeal.en,
      notIdealFor: wineNotIdeal,
      unlearn: wineUnlearn[l] || wineUnlearn.en,
      worthKnowing: wineWorth[l] || wineWorth.en,
      shortRecommendation: shortRec,
      whyItsWorthYourTime: wineRec[l] || wineRec.en
    };
  }

  // Determine category key
  let catKey = 'default';
  if (categories.includes('gastronomy') || categories.includes('food') || title.includes('bar') || title.includes('restaurant') || title.includes('kafana') || title.includes('distillery') || title.includes('shack')) {
    catKey = 'gastronomy';
  } else if (categories.includes('clubbing') || categories.includes('nightlife') || title.includes('club') || title.includes('hangar') || title.includes('dance') || title.includes('fest')) {
    catKey = 'clubbing';
  } else if (categories.includes('nature') || categories.includes('scenic') || categories.includes('adventure') || title.includes('viewpoint') || title.includes('nature') || title.includes('canyon') || title.includes('reserve') || title.includes('gorge') || title.includes('waterfall') || title.includes('meanders') || title.includes('mountain')) {
    catKey = 'nature';
  } else if (categories.includes('history') || categories.includes('culture') || categories.includes('museum') || title.includes('museum') || title.includes('monastery') || title.includes('fortress') || title.includes('palace') || title.includes('temple') || title.includes('church') || title.includes('monument')) {
    catKey = 'history';
  } else if (categories.includes('wellbeing') || categories.includes('medical') || categories.includes('spa') || title.includes('clinic') || title.includes('therapy') || title.includes('wellness') || title.includes('spa') || title.includes('banja') || title.includes('dental') || title.includes('surgery')) {
    catKey = 'wellbeing';
  }

  // Handle clubbing category specifically pointing to SPECIFIC_TRUTH_DATA['3'] under old mapping or category-level clubbing fallbacks
  if (catKey === 'clubbing') {
    const d = SPECIFIC_TRUTH_DATA['3'];
    return {
      whyRecommended: d.whyRecommended[l] || d.whyRecommended.en,
      whatMakesItSpecial: d.whatMakesItSpecial[l] || d.whatMakesItSpecial.en,
      whoWillEnjoy: d.idealFor[l] || d.idealFor.en,
      antiAdvice: d.worthKnowing[l] || d.worthKnowing.en,
      coreValue: d.coreValue[l] || d.coreValue.en,
      desiredOutcome: d.desiredOutcome[l] || d.desiredOutcome.en,
      outcomeProtection: d.worthKnowing[l] || d.worthKnowing.en,
      idealFor: d.idealFor[l] || d.idealFor.en,
      notIdealFor: d.notIdealFor[l] || d.notIdealFor.en,
      unlearn: d.unlearn[l] || d.unlearn.en,
      worthKnowing: d.worthKnowing[l] || d.worthKnowing.en,
      shortRecommendation: shortRec,
      whyItsWorthYourTime: d.whyItsWorthYourTime[l] || d.whyItsWorthYourTime.en
    };
  }

  const d = (CATEGORY_TRUTH_DATA[catKey] || DEFAULT_TRUTH_DATA) as any;
  const rawWhyRec = d.whyRecommended[l] || d.whyRecommended.en;
  const rawSpecial = d.whatMakesItSpecial[l] || d.whatMakesItSpecial.en;
  const rawWho = d.idealFor ? (d.idealFor[l] || d.idealFor.en) : (d.whoWillEnjoy ? (d.whoWillEnjoy[l] || d.whoWillEnjoy.en) : "Mindful discoverers");
  const rawUnlearn = d.unlearn[l] || d.unlearn.en;
  const rawWorth = d.worthKnowing[l] || d.worthKnowing.en;
  const rawNotIdeal = NOT_IDEAL_PROFILES[catKey] ? (NOT_IDEAL_PROFILES[catKey][l] || NOT_IDEAL_PROFILES[catKey].en) : (NOT_IDEAL_PROFILES.default[l] || NOT_IDEAL_PROFILES.default.en);
  const rawTime = d.whyItsWorthYourTime ? (d.whyItsWorthYourTime[l] || d.whyItsWorthYourTime.en) : rawWhyRec;

  return {
    whyRecommended: rawWhyRec,
    whatMakesItSpecial: rawSpecial,
    whoWillEnjoy: rawWho,
    antiAdvice: rawWorth,
    coreValue: d.coreValue ? (d.coreValue[l] || d.coreValue.en) : "Preserving unhurried local presence.",
    desiredOutcome: d.desiredOutcome ? (d.desiredOutcome[l] || d.desiredOutcome.en) : "Connect with authentic, pristine heritage.",
    outcomeProtection: rawWorth,
    idealFor: rawWho,
    notIdealFor: rawNotIdeal,
    unlearn: rawUnlearn,
    worthKnowing: rawWorth,
    shortRecommendation: shortRec,
    whyItsWorthYourTime: rawTime
  };
}
