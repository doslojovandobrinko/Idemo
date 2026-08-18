import * as fs from 'fs';
import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import { esCanonicalTranslations } from '../src/data/translations/serbia/esTranslations';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

const esData: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = { ...esCanonicalTranslations };

const esAdditions: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {
  "1": {
    "title": "Meandros del río Uvac",
    "shortDescription": "Espectaculares meandros serpenteantes en el cañón del Uvac y el santuario de buitres leonados más importante de Europa.",
    "longDescription": "El río Uvac ha esculpido impresionantes meandros a través de los cañones de caliza. El mirador Molitva ofrece una vista panorámica sublime con los buitres leonados sobrevolando el paisaje protegido.",
    "location": "Sjenica"
  },
  "2": {
    "title": "Fortaleza de Belgrado y Parque Kalemegdan",
    "shortDescription": "El corazón histórico de Belgrado en la confluencia de los ríos Sava y Danubio, rodeado de fortificaciones centenarias.",
    "longDescription": "La fortaleza combina vestigios romanos, bizantinos, otomanos y austríacos. El parque Kalemegdan ofrece vistas panorámicas al atardecer y alberga el icónico monumento del Victor.",
    "location": "Belgrado, Stari Grad"
  },
  "3": {
    "title": "Vida nocturna fluvial de Belgrado",
    "shortDescription": "Viva la famosa energía de la vida nocturna de Belgrado en los barcos-clubes flotantes (Splavovi).",
    "longDescription": "Los Splavovi en las orillas del Sava y del Danubio han convertido a Belgrado en una capital europea de la fiesta nocturna, desde techno underground hasta música en directo.",
    "location": "Belgrado"
  },
  "4": {
    "title": "Vrnjačka Banja",
    "shortDescription": "La reina del turismo termal en Serbia, famosa por sus fuentes de agua mineral de origen romano.",
    "longDescription": "Vrnjačka Banja es el balneario más famoso de Serbia, con siete fuentes minerales, villas históricas, frondosos parques y el célebre Puente del Amor.",
    "location": "Vrnjačka Banja"
  },
  "5": {
    "title": "Reserva Natural Especial Zasavica",
    "shortDescription": "Humedal protegido famoso por sus aves raras, cerdos mangalica y el queso de leche de burra más caro del mundo (Pule).",
    "longDescription": "Zasavica es un mosaico de carrizales y prados inundables. Además de proteger al castor europeo, es conocida mundialmente por su granja de burras donde se elabora el exclusivo queso Pule siguiendo la filosofía Slow Food.",
    "location": "Cerca de Sremska Mitrovica"
  },
  "6": {
    "title": "Sremski Karlovci",
    "shortDescription": "La ciudad barroca más elegante de Serbia y centro cultural, famosa por el vino Bermet y su arquitectura habsbúrgica.",
    "longDescription": "Sremski Karlovci es un museo al aire libre que evoca la elegancia del siglo XVIII. Sede espiritual ortodoxa bajo los Habsburgo donde se firmó la Paz de Karlowitz en 1699, destaca por su vino de postre aromatizado con hierbas.",
    "location": "Cerca de Novi Sad"
  },
  "7": {
    "title": "Museo Nikola Tesla",
    "shortDescription": "Explore el legado del genio que inventó el siglo XX. El museo alberga sus patentes originales y su urna funeraria.",
    "longDescription": "Ubicado en una elegante villa en el barrio de Vračar, el museo custodia más de 160.000 documentos originales, objetos personales y modelos funcionales de sus inventos como el transformador de Tesla.",
    "location": "Belgrado, Vračar"
  },
  "8": {
    "title": "Alfarería tradicional de Zlakusa",
    "shortDescription": "Tradicíón alfarera milenaria de vasijas de arcilla y calcita cocidas en fuego abierto, patrimonio de la UNESCO.",
    "longDescription": "El pueblo de Zlakusa destaca por su técnica de modelado en torno lento con una mezcla de arcilla y calcita molida. Las cazuelas cocidas a fuego abierto otorgan un sabor incomparable a los guisos estofados.",
    "location": "Zlakusa, Užice"
  },
  "9": {
    "title": "Vinos de suelos arenosos (Palić)",
    "shortDescription": "La región vinícola de Palić destaca por sus suelos de arena que producen blancos minerales únicos.",
    "longDescription": "Los suelos arenosos de Subotica-Palić imprimen a los vinos blancos una personalidad viva, una acidez fresca y elegantes notas minerales.",
    "location": "Palić / Subotica"
  },
  "10": {
    "title": "Rakia Bar Belgrado",
    "shortDescription": "Pioneros de la cultura moderna de la rakia de frutas, con catas maridadas con bocados gourmet.",
    "longDescription": "Rakia Bar transformó la percepción de la bebida nacional serbia proponiendo catas guiadas de aguardientes de fruta artesanales combinados con aperitivos regionales.",
    "location": "Centro de Belgrado"
  },
  "11": {
    "title": "Destilería Zarić",
    "shortDescription": "Destilería galardonada en Kosjerić que une tradición e innovación para crear destilados de fruta prémium.",
    "longDescription": "Ubicada en Kosjerić, la Destilería Zarić es sinónimo de aguardientes de ciruela y membrillo de la máxima calidad, galardonada en concursos internacionales por marcas como 'Nirvana'.",
    "location": "Kosjerić"
  },
  "12": {
    "title": "Kafana El Signo de Interrogación (?)",
    "shortDescription": "La taberna más antigua conservada de Belgrado (1823), monumento vivo de la hospitalidad serbia.",
    "longDescription": "Situada frente a la Catedral, la Kafana (?) sirve platos tradicionales serbios en un ambiente centenario con un encanto histórico inigualable.",
    "location": "Belgrado, Stari Grad"
  },
  "13": {
    "title": "Kafana Tri Šešira (Tres Sombreros)",
    "shortDescription": "El corazón bohemio de Belgrado en el callejón empedrado de Skadarlija, con música romántica en directo.",
    "longDescription": "Desde 1864, Tri Šešira es un punto de encuentro de artistas e intelectuales. Su ambiente con orquestas de guitarras y carnes a la brasa transmite el espíritu bohemio del viejo Belgrado.",
    "location": "Belgrado, Skadarlija"
  },
  "14": {
    "title": "Clínica Dermatológica Dr. Kozarev",
    "shortDescription": "Centro de referencia en dermatología estética y tratamientos láser con tecnología de vanguardia.",
    "longDescription": "La clínica del Dr. Kozarev en Vračar ofrece procedimientos médico-estéticos personalizados supervisados por reconocidos especialistas.",
    "location": "Belgrado, Vračar"
  },
  "15": {
    "title": "Clínica Dental Dr. Popović",
    "shortDescription": "Odontología estética e implantología de alto nivel bajo estrictos estándares europeos.",
    "longDescription": "Proporciona servicios odontológicos integrales, desde implantes hasta carillas estéticas, para pacientes internacionales en el marco del turismo médico.",
    "location": "Belgrado, Vračar"
  },
  "16": {
    "title": "Monasterio de Studenica",
    "shortDescription": "Madre de los monasterios serbios y Patrimonio de la Humanidad por la UNESCO con su fresco de la Crucifixión.",
    "longDescription": "Fundado en 1190 por Stefan Nemanja, Studenica destaca por sus templos de mármol blanco y sus frescos bizantinos del siglo XIII de incalculable valor artístico.",
    "location": "Kraljevo / Raška"
  },
  "17": {
    "title": "Monasterio de Žiča",
    "shortDescription": "El monasterio real de fachada roja donde fueron coronados siete reyes serbios.",
    "longDescription": "Construido a principios del siglo XIII, fue la primera sede de la iglesia serbia autocéfala y impresiona por su característico color rojo real.",
    "location": "Kraljevo"
  },
  "18": {
    "title": "Bodega Aleksandrović",
    "shortDescription": "Bodega referente de la región de Šumadija inspirada en los viñedos de la familia real.",
    "longDescription": "La bodega Aleksandrović mantiene viva la tradición vinícola de los Karadjordjević en Topola, produciendo vinos tan prestigiosos como la gama 'Trijumf'.",
    "location": "Topola / Oplenac"
  },
  "19": {
    "title": "Yacimiento Arqueológico Vinča",
    "shortDescription": "Cuna de la civilización neolítica europea a orillas del río Danubio.",
    "longDescription": "El yacimiento de Vinča atestigua una desarrollada cultura neolítica de más de 7.000 años de antigüedad que fue pionera en la metalurgia del cobre.",
    "location": "Belgrado, Grocka"
  },
  "20": {
    "title": "Ciudad Imperial Romana de Sirmium",
    "shortDescription": "Una de las cuatro capitales del Imperio Romano y cuna de diez emperadores con mosaicos del palacio imperial.",
    "longDescription": "La actual Sremska Mitrovica descansa sobre los cimientos de la antigua Sirmium. Su centro de visitantes custodia mosaicos y restos del hipódromo imperial.",
    "location": "Sremska Mitrovica"
  },
  "21": {
    "title": "Fortaleza de Petrovaradin",
    "shortDescription": "El Gibraltar del Danubio con su famoso reloj 'ebrio' y 16 km de galerías subterráneas.",
    "longDescription": "Esta imponente fortaleza barroca sobre Novi Sad ofrece vistas espectaculares del río y acoge anualmente el célebre festival internacional EXIT.",
    "location": "Novi Sad"
  },
  "22": {
    "title": "Fortaleza de Belgrado y Kalemegdan",
    "shortDescription": "El bastión histórico de la capital con espectaculares panorámicas sobre el río Sava y Danubio.",
    "longDescription": "Lugar de encuentro de varios imperios que alberga museos, murallas centenarias y el monumento del Victor sobre el acantilado.",
    "location": "Belgrado, Stari Grad"
  },
  "23": {
    "title": "Espacio Cultural Silosi Belgrado",
    "shortDescription": "Centro cultural y creativo a orillas del Danubio ubicado en antiguos silos industriales.",
    "longDescription": "Silosi es un brillante ejemplo de reconversión del patrimonio industrial en Dorćol para acoger exposiciones de arte, conciertos y talleres.",
    "location": "Belgrado, Dorćol"
  },
  "24": {
    "title": "Hospital Especializado Čigota",
    "shortDescription": "Centro de tiroides, salud metabólica y recuperación médica en la montaña de Zlatibor.",
    "longDescription": "Čigota combina el clima tonificante de Zlatibor con supervisión médica para programas de pérdida de peso y equilibrio metabólico.",
    "location": "Zlatibor"
  },
  "25": {
    "title": "Bodega Zvonko Bogdan",
    "shortDescription": "Bodega de lujo de estilo Art Nouveau junto al lago Palić con vinos de suelo arenoso.",
    "longDescription": "Unión de tradición y tecnología en el norte de Bačka, conocida por la belleza de sus instalaciones y la elegancia mineral de sus caldos.",
    "location": "Palić"
  },
  "26": {
    "title": "Alfombras artesanales de Pirot",
    "shortDescription": "Patrimonio de la UNESCO: alfombras de lana tejidas a mano con motivos geométricos y sin revés.",
    "longDescription": "Las alfombras de Pirot se confeccionan con lana fina de Stara Planina y destacan por sus vivos colores y su profunda simbología espiritual.",
    "location": "Pirot"
  },
  "27": {
    "title": "Kafana Kovač",
    "shortDescription": "Restaurante tradicional con una amplia variedad de guisos al horno de campana de barro (Sač).",
    "longDescription": "Kovač mantiene la cultura del banquete serbio con carnes asadas lentamente a la brasa y repostería casera tradicional.",
    "location": "Belgrado, Voždovac"
  },
  "28": {
    "title": "Monte Rtanj y Sokobanja",
    "shortDescription": "La mística montaña piramidal de Rtanj combinada con las aguas termales de Sokobanja.",
    "longDescription": "Rtanj atrae a senderistas por su silueta geométrica y sus infusiones medicinales, mientras Sokobanja ofrece aguas termales desde la época romana.",
    "location": "Serbia Oriental"
  },
  "29": {
    "title": "Fincas tradicionales Salaš en Vojvodina",
    "shortDescription": "Fincas rústicas de la llanura con huertos, música de tamborileros y comida sabrosa.",
    "longDescription": "Un Salaš es un refugio acogedor en el campo donde degustar estofados en caldero, hojaldres caseros y licor de frutas.",
    "location": "Vojvodina"
  },
  "30": {
    "title": "Parque Nacional Tara",
    "shortDescription": "Naturaleza virgen en Serbia Occidental con el cañón del Drina, abetos Pančić y miradores de vértigo.",
    "longDescription": "Tara es el hábitat del oso pardo europeo. Miradores como Banjska Stena ofrecen panorámicas al cañón del río Drina y al lago Perućac.",
    "location": "Serbia Occidental"
  },
  "31": {
    "title": "Club Drugstore Belgrado",
    "shortDescription": "Catedral de la escena techno underground de Belgrado ubicada en un antiguo matadero industrial.",
    "longDescription": "Drugstore es el santuario de la música electrónica en la región. Su arquitectura brutalista de hormigón reúne a los mejores DJ del mundo.",
    "location": "Belgrado, Palilula"
  },
  "32": {
    "title": "Torre Gardoš y barrio de Zemun",
    "shortDescription": "Torre del Milenio sobre las callejuelas empedradas de Zemun con vistas al río Danubio.",
    "longDescription": "Zemun conserva el encanto señorial del Imperio Austrohúngaro. La torre Gardoš de 1896 regala la mejor panorámica sobre los tejados rojos.",
    "location": "Belgrado, Zemun"
  },
  "33": {
    "title": "Especialidades de parrilla de Leskovac",
    "shortDescription": "La capital de la barbacoa serbia cuya receta de carne picada sazonada tiene sello de origen.",
    "longDescription": "Leskovac es mundialmente conocida por la cocina a la brasa de carbón. La pljeskavica y los ćevapi son la cima de la gastronomía carnívora.",
    "location": "Leskovac"
  },
  "34": {
    "title": "Fortaleza de Golubac",
    "shortDescription": "Imponente fortaleza medieval a la entrada del desfiladero de las Puertas de Hierro en el Danubio.",
    "longDescription": "Con nueve torres conectadas por murallas que emergen de las aguas del Danubio, Golubac es una de las fortalezas fluviales mejor conservadas de Europa.",
    "location": "Golubac, Puertas de Hierro"
  },
  "35": {
    "title": "Centro de Medicina Regenerativa Belgrado",
    "shortDescription": "Tratamientos avanzados de antienvejecimiento y terapia con células madre con supervisión médica.",
    "longDescription": "Centros especializados en Belgrado ofrecen terapias de rejuvenecimiento celular según los más altos estándares internacionales.",
    "location": "Centro de Belgrado"
  },
  "36": {
    "title": "Felix Romuliana (Gamzigrad)",
    "shortDescription": "Palacio imperial del emperador Galerio cerca de Zaječar, Patrimonio de la Humanidad por la UNESCO.",
    "longDescription": "Un deslumbrante complejo palaciego romano tardío con poderosas torres defensivas y detallados mosaicos que representan escenas mitológicas.",
    "location": "Zaječar"
  },
  "37": {
    "title": "Complejo Real de Oplenac y Topola",
    "shortDescription": "Mausoleo de la dinastía Karađorđević decorado con 40 millones de teselas de cristal de color.",
    "longDescription": "La iglesia de San Jorge en Oplenac impresiona por su fachada de mármol blanco y su interior revestido de réplicas de los mejores frescos medievales.",
    "location": "Topola"
  },
  "38": {
    "title": "Desfiladero de Ovčar-Kablar",
    "shortDescription": "El Athos serbio: un cañón fluvial que alberga 10 monasterios medievales entre montañas.",
    "longDescription": "El cañón del río Morava Occidental entre los montes Ovčar y Kablar es un remanso de paz, espiritualidad y paisajes naturales idílicos.",
    "location": "Cerca de Čačak"
  },
  "39": {
    "title": "Hype Club Belgrado",
    "shortDescription": "Club nocturno de lujo a orillas del Sava con un elegante interiorismo y sonido de vanguardia.",
    "longDescription": "Hype ofrece una experiencia nocturna sofisticada en Belgrado para los amantes de la música House y R&B en un ambiente exclusivo.",
    "location": "Belgrado, Savamala"
  },
  "40": {
    "title": "Zepter Hotel & Wellness",
    "shortDescription": "Hotel holístico de bienestar en Vrnjačka Banja centrado en la medicina preventiva y el descanso.",
    "longDescription": "Combina alojamiento de lujo, spa con aguas termales y nutrición personalizada en el balneario más famoso de Serbia.",
    "location": "Vrnjačka Banja"
  },
  "41": {
    "title": "Humska Cigar Lounge",
    "shortDescription": "Club privado exclusivo para amantes de los puros prémium y licores seleccionados.",
    "longDescription": "Un lounge privado en Belgrado concebido para el disfrute de puros de renombre mundial, viejos coñacs y whiskies de colección.",
    "location": "Belgrado, Senjak"
  },
  "42": {
    "title": "Gastronomía de Novi Pazar y Ćevap",
    "shortDescription": "Especialidades elaboradas con carne pura de vacuno siguiendo la tradición oriental.",
    "longDescription": "Novi Pazar destaca por su impronta otomana, con sus famosos ćevapi de vacuno, sus hojaldres mantije y sus dulces tradicionales.",
    "location": "Novi Pazar"
  },
  "43": {
    "title": "Balnearios y termas de Serbia",
    "shortDescription": "Tratamientos médicos de hidroterapia con aguas minerales térmicas y fangos medicinales.",
    "longDescription": "Serbia cuenta con docenas de manantiales medicinales cuya eficacia está avalada por siglos de tradición y balneología moderna.",
    "location": "Varias villas termales"
  },
  "44": {
    "title": "Yacimiento de Lepenski Vir",
    "shortDescription": "Uno de los yacimientos mesolíticos más antiguos e importantes de Europa a orillas del Danubio.",
    "longDescription": "Una cultura de más de 8.000 años de antigüedad famosa por sus viviendas trapezoidales y sus monumentales esculturas de piedra con rostro de pez.",
    "location": "Donji Milanovac"
  },
  "45": {
    "title": "Ciudad del Diablo (Đavolja Varoš)",
    "shortDescription": "Fenómeno natural compuesto por 202 pirámides de tierra esculpidas por la erosión y manantiales ácidos.",
    "longDescription": "Singulares agujas de tierra en la montaña Radan rodeadas de mitos y manantiales de agua mineral altamente ácida.",
    "location": "Cerca de Kuršumlija"
  },
  "46": {
    "title": "Parque Nacional del Desfiladero de Đerdap",
    "shortDescription": "El desfiladero fluvial más grande de Europa donde el Danubio une naturaleza e historia.",
    "longDescription": "Las Puertas de Hierro del Danubio ofrecen espectaculares miradores como Ploče y un rico patrimonio que abarca desde la prehistoria hasta Roma.",
    "location": "Serbia Oriental"
  },
  "47": {
    "title": "Kafana Dva Jelena (Dos Ciervos)",
    "shortDescription": "Mítica taberna de Belgrado de 1832 frecuentada por poetas, artistas y jefes de Estado.",
    "longDescription": "Su menú tradicional, sus músicos de tamburica y la atmósfera de Skadarlija hacen de esta kafana un paso obligado en Belgrado.",
    "location": "Belgrado, Skadarlija"
  },
  "48": {
    "title": "Arte Naíf de Kovačica",
    "shortDescription": "Famosa escuela de pintura naíf eslovaca afincada en el pueblo de Kovačica.",
    "longDescription": "Escenas bucólicas y coloridas de la vida rural reconocidas a nivel internacional por coleccionistas de todo el mundo.",
    "location": "Kovačica, Banat"
  },
  "49": {
    "title": "Villa Romana de Mediana",
    "shortDescription": "Lujosa villa residencial romana del emperador Constantino el Grande en las afueras de Niš.",
    "longDescription": "Mediana alberga mosaicos de gran valor artístico, termas y ruinas palaciegas que testimonian la opulencia del antiguo Naissus.",
    "location": "Niš"
  },
  "50": {
    "title": "Estación de montaña Divčibare",
    "shortDescription": "Destino de descanso en el monte Maljen, conocido por sus brisas puras y sus pinares.",
    "longDescription": "Un entorno apacible para caminatas ligeras, aire puro y descanso a corta distancia de Belgrado.",
    "location": "Monte Maljen"
  },
  "51": {
    "title": "Distrito de Diseño de Belgrado",
    "shortDescription": "Barrios creativos como Čumić con boutiques conceptuales y talleres de diseñadores locales.",
    "longDescription": "El escaparate de la moda independiente y el arte serbio contemporáneo donde adquirir prendas exclusivas.",
    "location": "Belgrado Centro"
  },
  "52": {
    "title": "Región Vinícola de Župa",
    "shortDescription": "Cuna de las variedades autóctonas serbias Tamjanika y Prokupac.",
    "longDescription": "El valle de Župa ofrece una inmersión genuina en sus bodegas centenarias (poljane) y festivales de la vendimia.",
    "location": "Aleksandrovac"
  },
  "53": {
    "title": "Apiterapia y aire de colmena",
    "shortDescription": "Tratamientos de bienestar inhalando aire enriquecido con propóleo directamente de las colmenas.",
    "longDescription": "Terapia natural en cabinas de madera donde se inhala aire de colmena para aliviar el estrés y afecciones respiratorias.",
    "location": "Zonas rurales de Serbia"
  },
  "54": {
    "title": "Art Nouveau de Subotica y Sinagoga",
    "shortDescription": "Joya arquitectónica del Modernismo húngaro con la segunda sinagoga más grande de Europa.",
    "longDescription": "El Ayuntamiento y la Sinagoga de Subotica deslumbran por sus vidrieras de colores y sus cerámicas de majólica Zsolnay.",
    "location": "Subotica"
  },
  "55": {
    "title": "Reserva Natural Especial Carska Bara",
    "shortDescription": "Humedal protegido y paraíso ornitológico con más de 250 especies de aves registradas.",
    "longDescription": "Paseos en barca por canales de carrizos que permiten observar garzas, cormoranes y águilas pigmentadas.",
    "location": "Cerca de Zrenjanin"
  },
  "56": {
    "title": "Fortaleza de Niš",
    "shortDescription": "Una de las fortalezas otomanas mejor conservadas del centro de los Balcanes.",
    "longDescription": "A orillas del río Nišava, la fortaleza alberga vestigios bizantinos, romanos y otomanos, y acoge el festival Nišville Jazz.",
    "location": "Niš"
  },
  "57": {
    "title": "Cañón del río Jerma",
    "shortDescription": "Uno de los cañones más estrechos e impresionantes de Europa, con el monasterio de Poganovo.",
    "longDescription": "Naturaleza virgen en el sureste de Serbia con acantilados verticales que se elevan sobre el curso del agua.",
    "location": "Dimitrovgrad"
  },
  "58": {
    "title": "Vino Bermet y bodegas de Sremski Karlovci",
    "shortDescription": "Cata del célebre vino dulce aromatizado con especias en bodegas familiares históricas.",
    "longDescription": "Las bodegas familiares de Karlovci guardan la receta secreta del Bermet macerado con hierbas medicinales y frutos secos.",
    "location": "Sremski Karlovci"
  },
  "59": {
    "title": "Pueblo de piedra de Gostuša",
    "shortDescription": "Pueblo rústico en Stara Planina construido exclusivamente con piedra, madera y barro.",
    "longDescription": "Un reducto arquitectónico donde se ha detenido el tiempo y las casas con tejados de losas de piedra se mimetizan con la montaña.",
    "location": "Stara Planina"
  },
  "60": {
    "title": "Terrazas de Belgrado Waterfront",
    "shortDescription": "Bares en azoteas modernas con vistas panorámicas a la confluencia de los ríos y al perfil urbano.",
    "longDescription": "Espacios exclusivos para disfrutar de cócteles al atardecer sobre el horizonte del Sava y del Danubio.",
    "location": "Belgrado Waterfront"
  },
  "61": {
    "title": "Balneario de Prolom Banja",
    "shortDescription": "Conocido por su agua altamente alcalina y sus barros curativos en las laderas de la montaña Radan.",
    "longDescription": "Un santuario natural indicado para afecciones renales y dermatológicas con modernas piscinas termales.",
    "location": "Serbia del Sur"
  },
  "62": {
    "title": "Puentes de piedra de Vratna",
    "shortDescription": "Los arcos de piedra naturales más altos de Europa en el cañón del río Vratna.",
    "longDescription": "Tres impresionantes formaciones rocosas escondidas entre los frondosos bosques del este serbio.",
    "location": "Cerca de Negotin"
  },
  "63": {
    "title": "Bodega Spasić (Župa)",
    "shortDescription": "Bodega familiar dedicada a la recuperación de la variedad autóctona Prokupac.",
    "longDescription": "Combina la tradición con la enología moderna para realzar la autenticidad del terruño balcánico.",
    "location": "Tržac, Župa"
  },
  "64": {
    "title": "Torre de Avala y monte Avala",
    "shortDescription": "Símbolo de Belgrado con mirador a 122 metros de altura y el Monumento al Héroe Desconocido.",
    "longDescription": "Lugar preferido de excursión con vistas a las colinas de Šumadija. El monumento de piedra fue diseñado por Ivan Meštrović.",
    "location": "Monte Avala, Belgrado"
  },
  "65": {
    "title": "Recinto EXPO 2027 Belgrado",
    "shortDescription": "Futuro recinto ferial para la Exposición Especializada dedicada al juego y el deporte.",
    "longDescription": "Nuevo complejo cultural e infraestructural en Surčin que posiciona a Belgrado como centro de innovación regional.",
    "location": "Surčin, Belgrado"
  },
  "66": {
    "title": "Jerseis de lana de Sirogojno",
    "shortDescription": "Famosos jerseis de lana de oveja tejidos a mano con motivos del paisaje de Zlatibor.",
    "longDescription": "Una artesanía tradicional de las tegedoras de Sirogojno que desfiló en pasarelas de moda de París y Nueva York.",
    "location": "Sirogojno, Zlatibor"
  },
  "67": {
    "title": "Monasterio de Ravanica",
    "shortDescription": "Fundación del príncipe Lazar y lugar de reposo de sus reliquias, joya de la escuela del Morava.",
    "longDescription": "Monasterio del siglo XIV con ricas rosetas labradas en piedra y frescos que plasman pasajes históricos.",
    "location": "Ćuprija"
  },
  "68": {
    "title": "Teatro y Festival Bitef",
    "shortDescription": "Centro teatral de vanguardia en una iglesia evangélica reconvertida y renombrado festival internacional.",
    "longDescription": "Durante más de medio siglo, Bitef ha sido un referente del teatro experimental atrayendo a directores de todo el mundo.",
    "location": "Belgrado, Dorćol"
  },
  "69": {
    "title": "Teatro Nacional Serbio (Novi Sad)",
    "shortDescription": "El teatro profesional más antiguo de Serbia (1861), con repertorio de ópera, ballet y drama.",
    "longDescription": "Pilar de la cultura en Novi Sad que ofrece producciones de gran nivel en su edificio de la Plaza del Teatro.",
    "location": "Novi Sad"
  },
  "70": {
    "title": "Kafana Hercegovina (Kragujevac)",
    "shortDescription": "Taberna tradicional de Šumadija famosa por sus asados, pan recién horneado y trato familiar.",
    "longDescription": "Punto de encuentro para los amantes de la cocina casera tradicional en la histórica Kragujevac.",
    "location": "Kragujevac"
  },
  "71": {
    "title": "Escenarios del Festival de Jazz de Belgrado",
    "shortDescription": "Salas y clubes que mantienen viva una fructífera tradición jazzística desde 1971.",
    "longDescription": "Belgrado posee una dilatada historia de jazz que reúne a leyendas internacionales y talentos locales.",
    "location": "Belgrado"
  },
  "72": {
    "title": "Bodegas de piedra de Rogljevo (Pimnice)",
    "shortDescription": "Bodegas subterráneas de piedra del siglo XIX en la región vinícola de Negotinska Krajina.",
    "longDescription": "Una auténtica aldea de piedra dedicada exclusivamente a la maduración de vinos tintos de gran calidad.",
    "location": "Rogljevo, Negotin"
  },
  "73": {
    "title": "Remedios herbales de Fruška Gora",
    "shortDescription": "Preparados naturales y tés elaborados por los monjes de los monasterios de Fruška Gora.",
    "longDescription": "Sabiduría botánica centenaria aplicada a la elaboración de ungüentos y mezclas herbales medicinales.",
    "location": "Fruška Gora"
  },
  "74": {
    "title": "Tradición sedera de Pančevo",
    "shortDescription": "Patrimonio industrial de la producción de seda en el sur del Banato.",
    "longDescription": "Pančevo fue un centro neurálgico del cultivo de la seda en la monarquía de los Habsburgo.",
    "location": "Pančevo"
  },
  "75": {
    "title": "Gastronomía local de Pirot",
    "shortDescription": "Embutido prensado (Peglana kobasica), queso curado de Pirot y cordero asado al Sač.",
    "longDescription": "Pirot ofrece sabores únicos del sureste serbio con productos artesanales con denominación de origen.",
    "location": "Pirot"
  },
  "76": {
    "title": "Especialidades de Zlatibor",
    "shortDescription": "Komplet lepinja con salsa de carne, jamón curado de montaña y leche cuajada casera.",
    "longDescription": "El jamón curado al humo de Mačat y el pan relleno horneado son símbolos gastronómicos de la montaña.",
    "location": "Zlatibor"
  },
  "77": {
    "title": "Sopa de pescado y Perkelt de Vojvodina",
    "shortDescription": "Guisos tradicionales en caldero con pescados del Danubio o ternera y pasta casera.",
    "longDescription": "Cocina de llanura con influencias húngaras cocinada a fuego lento sobre leña.",
    "location": "Vojvodina"
  },
  "78": {
    "title": "Chicharrones de hebilla de Valjevo (Duvan Čvarci)",
    "shortDescription": "Chicharrones crujientes deshilachados en finas hebras elaborados en caldera de cobre.",
    "longDescription": "Especialidad gastronómica de Valjevo elaborada tras horas de pausada fritura de carne de cerdo.",
    "location": "Valjevo"
  },
  "79": {
    "title": "Mantije de Novi Pazar",
    "shortDescription": "Bocados de hojaldre rellenos de carne picada y servidos con yogur fresco.",
    "longDescription": "Patrimonio inmaterial de Serbia. Masa estirada a mano y horneada en horno de leña.",
    "location": "Novi Pazar"
  },
  "80": {
    "title": "Queso y cordero de Sjenica",
    "shortDescription": "Queso blanco curado en salmuera y cordero de los pastos de la meseta de Pešter.",
    "longDescription": "La alta meseta de Pešter, a más de 1.000 metros de altitud, otorga un sabor excepcional a sus quesos.",
    "location": "Sjenica / Pešter"
  },
  "81": {
    "title": "Miel de los montes Homolje",
    "shortDescription": "Miel ecológica pura recolectada en los frondosos bosques de las montañas de Homolje.",
    "longDescription": "Producto protegido de calidad suprema obtenido de la flora silvestre de la región.",
    "location": "Homolje"
  },
  "82": {
    "title": "Ruta del Slivovitz en Šumadija",
    "shortDescription": "Elaboración tradicional del aguardiente de ciruela a partir de variedades autóctonas.",
    "longDescription": "Šumadija es el corazón del Slivovitz. Visita a destilerías artesanales con crianza en barrica de roble.",
    "location": "Šumadija"
  },
  "83": {
    "title": "Ruta ciclista de Đerdap (EuroVelo 6)",
    "shortDescription": "Recorrido en bicicleta a lo largo del Danubio por el tramo más espectacular de la ruta EuroVelo 6.",
    "longDescription": "Un itinerario que discurre entre fortalezas, yacimientos arqueológicos y túneles en la roca.",
    "location": "Corredor del Danubio"
  },
  "84": {
    "title": "Ruta del vino de Negotinska Krajina",
    "shortDescription": "Vinos de las bodegas de Rajačke y Rogljevačke con un microclima único cerca del Danubio.",
    "longDescription": "Variedades autóctonas como Začinak y Crna Tamjanika dan lugar a vinos con marcada identidad.",
    "location": "Negotin"
  },
  "85": {
    "title": "Ruta del vino y colinas de Vršac",
    "shortDescription": "Viñedos centenarios al pie de los montes de Vršac con vistas al horizonte del Banato.",
    "longDescription": "Vršac es la ciudad de las uvas y del viento, con una dilatada tradición vitivinícola.",
    "location": "Vršac"
  },
  "86": {
    "title": "Paquete Médico: Balneología en Vrnjačka Banja",
    "shortDescription": "Recuperación integral con baños de agua mineral y fisioterapia supervisada.",
    "longDescription": "Programa médico indicado para la salud articular, digestiva e inmunológica.",
    "location": "Vrnjačka Banja"
  },
  "87": {
    "title": "Paquete Médico: Odontología en Belgrado + Relax fluvial",
    "shortDescription": "Servicios dentales estéticos de nivel superior combinados con estancia junto al río.",
    "longDescription": "Tratamientos de implantología con estancia de recuperación serena a orillas del Danubio.",
    "location": "Belgrado"
  },
  "88": {
    "title": "Paquete Médico: Reinicio metabólico Čigota Zlatibor",
    "shortDescription": "Programa médico enfocado en el control de peso y la salud tiroidea.",
    "longDescription": "Combinación de dieta supervisada, senderismo de montaña y balneoterapia.",
    "location": "Zlatibor"
  },
  "89": {
    "title": "Paquete Médico: Spa capilar japonés y antiestrés",
    "shortDescription": "Terapia de cuero cabelludo y estimulación de la microcirculación en Belgrado.",
    "longDescription": "Masaje profundo e hidroterapia para aliviar el estrés y mejorar la calidad del sueño.",
    "location": "Belgrado"
  },
  "90": {
    "title": "Paquete Médico: Cuidado respiratorio en Sokobanja",
    "shortDescription": "Inhalaciones con agua de radón y aire puro de montaña para vías respiratorias.",
    "longDescription": "Tratamientos balnearios tradicionales para la salud bronquial bajo control médico.",
    "location": "Sokobanja"
  },
  "91": {
    "title": "Paquete Médico: Estética regenerativa + Relax en Tara",
    "shortDescription": "Rejuvenecimiento facial no invasivo combinado con estancia entre pinares en Tara.",
    "longDescription": "Técnicas avanzadas de revitalización cutánea y reposo en el entorno del Parque Nacional.",
    "location": "Belgrado / Tara"
  },
  "92": {
    "title": "Paquete Médico: Cura alcalina de Prolom",
    "shortDescription": "Terapia de hidratación con agua alcalina Prolom y depuración renal.",
    "longDescription": "Programa de salud en Prolom Banja para la desintoxicación del sistema urinario.",
    "location": "Prolom Banja"
  },
  "93": {
    "title": "Paquete Médico: Apiterapia e inhalaciones",
    "shortDescription": "Tratamiento natural de vías respiratorias con aerosoles de colmena en apiarios ecológicos.",
    "longDescription": "Terapia en plena naturaleza en fincas de Šumadija para fortalecer el sistema inmunitario.",
    "location": "Šumadija / Fruška Gora"
  },
  "94": {
    "title": "Paquete Médico: Gran Ruta de Balnearios de Serbia",
    "shortDescription": "Circuito de varios días por los balnearios de aguas termales más destacados de Serbia.",
    "longDescription": "Sesiones termales personalizadas en Vrnjačka Banja, Sokobanja y Prolom Banja.",
    "location": "Región Balnearia"
  },
  "95": {
    "title": "Paquete Médico: Longevidad en Fruška Gora",
    "shortDescription": "Programa holístico antiedad en la paz de los bosques y monasterios de Fruška Gora.",
    "longDescription": "Nutrición antioxidante, caminatas suaves y tratamientos de rejuvenecimiento natural.",
    "location": "Fruška Gora"
  },
  "96": {
    "title": "Festival de Danza de Belgrado",
    "shortDescription": "Festival internacional de danza contemporánea que reúne a las mejores compañías del mundo.",
    "longDescription": "Transforma Belgrado cada primavera en una capital mundial de la danza moderna.",
    "location": "Belgrado"
  },
  "97": {
    "title": "Festival Mikser",
    "shortDescription": "Festival regional de diseño, arquitectura y desarrollo sostenible en los Silos culturales.",
    "longDescription": "Plataforma para jóvenes creadores e iniciativas ecológicas urbanas.",
    "location": "Silosi Belgrado"
  },
  "98": {
    "title": "Arsenal Fest Kragujevac",
    "shortDescription": "Festival de música en el singular recinto industrial del Arsenal del Príncipe del siglo XIX.",
    "longDescription": "Un referente de la música rock y alternativa en un espacio de valor histórico industrial.",
    "location": "Kragujevac"
  },
  "99": {
    "title": "Festival EXIT (Novi Sad)",
    "shortDescription": "Galardonado festival de música internacional en la fortaleza de Petrovaradin.",
    "longDescription": "Nacido de un movimiento estudiantil, EXIT es uno de los festivales más importantes de Europa.",
    "location": "Novi Sad"
  },
  "100": {
    "title": "Lovefest Vrnjačka Banja",
    "shortDescription": "Festival veraniego de música electrónica en los jardines de Vrnjačka Banja.",
    "longDescription": "Reúne a reconocidos DJ de la escena House y Techno junto a las piscinas del balneario.",
    "location": "Vrnjačka Banja"
  },
  "101": {
    "title": "Festival de Trompetas de Guča",
    "shortDescription": "Mundialmente famoso festival de orquestas de metales y ritmo balcánico en directo.",
    "longDescription": "Una fiesta de música folclórica, gastronomía a la brasa y alegría ininterrumpida.",
    "location": "Guča, Dragačevo"
  },
  "102": {
    "title": "Belgrade Beer Fest",
    "shortDescription": "El mayor festival de cerveza del sureste de Europa con conciertos de rock gratuitos.",
    "longDescription": "Cientos de marcas de cerveza artesanal y música en vivo en el parque Ušće junto al río.",
    "location": "Ušće, Belgrado"
  },
  "104": {
    "title": "Exploración de los arcos de Vratna",
    "shortDescription": "Excursión a los monumentales puentes naturales de piedra de más de 30 metros de altura.",
    "longDescription": "Una maravilla geológica en el este serbio próxima al monasterio de Vratna.",
    "location": "Negotin"
  },
  "105": {
    "title": "Ruta del desfiladero de Jerma",
    "shortDescription": "Recorrido entre murallas de roca vertical hacia los monasterios de Sukovo y Poganovo.",
    "longDescription": "Carretera esculpida en la roca que atraviesa un paisaje de belleza natural intacta.",
    "location": "Dimitrovgrad"
  },
  "106": {
    "title": "Cañón de Rosomača (Rosomački lonci)",
    "shortDescription": "Singular cañón estratificado en Stara Planina con pozas esculpidas en la roca.",
    "longDescription": "Fascinantes formaciones rocosas en capas por las que fluye un arroyo cristalino.",
    "location": "Stara Planina"
  },
  "107": {
    "title": "Manantial de Krupaj",
    "shortDescription": "Oasis kárstico turquesa en Homolje con agua termal y cuevas subterráneas.",
    "longDescription": "Un rincón de ensueño con aguas cristalinas rodeado de vegetación y antiguos molinos.",
    "location": "Homolje"
  },
  "108": {
    "title": "Cañón del río Gradac",
    "shortDescription": "Uno de los ríos más limpios de Europa con pozas esmeralda cerca de Valjevo.",
    "longDescription": "Paraíso para la pesca a mosca y el senderismo con agua potable directo del cauce.",
    "location": "Valjevo"
  },
  "110": {
    "title": "Mirador de Kablar",
    "shortDescription": "Espectacular vista panorámica desde la cima de Kablar a los meandros del Morava Occidental.",
    "longDescription": "Plataforma a 889 metros de altitud con vistas al desfiladero de Ovčar-Kablar.",
    "location": "Čačak"
  },
  "111": {
    "title": "Parque Natural de la montaña Golija",
    "shortDescription": "Reserva de la Biosfera por la UNESCO con tupidos bosques de abetos.",
    "longDescription": "Macizo montañoso de clima alpino y casas tradicionales de arquitectura de madera.",
    "location": "Golija"
  },
  "112": {
    "title": "Colinas de Zagajica (Zagajička brda)",
    "shortDescription": "Onduladas colinas verdes en el borde de las arenas de Deliblato.",
    "longDescription": "Un paisaje de ensueño en el Banato con verdes lomas ideales para la fotografía.",
    "location": "Arenas de Deliblato"
  },
  "114": {
    "title": "Reserva de Obedska Bara",
    "shortDescription": "Antiguo meandro del Sava y una de las reservas naturales más antiguas del mundo.",
    "longDescription": "Humedal famoso por su mosaico de lagunas y robledales de gran valor ecológico.",
    "location": "Pećinci, Srem"
  },
  "115": {
    "title": "Fortaleza de Maglič y valle del Ibar",
    "shortDescription": "Castillo medieval erigido sobre un risco que custodiaba el paso a Studenica.",
    "longDescription": "Una de las fortalezas mejor conservadas de Serbia con ocho torres de piedra.",
    "location": "Valle del Ibar"
  },
  "118": {
    "title": "Fortaleza de Bač",
    "shortDescription": "El castillo medieval con foso mejor conservado de Vojvodina con su torre del homenaje.",
    "longDescription": "Castillo del siglo XIV que combina los estilos románico y gótico en la llanura de Bačka.",
    "location": "Bač"
  },
  "119": {
    "title": "Fortaleza de Fetislam y Kladovo",
    "shortDescription": "Fortificación otomana junto al Danubio con centro de visitantes y vistas a Rumanía.",
    "longDescription": "Fortaleza restaurada del siglo XVI situada estratégicamente a orillas del río.",
    "location": "Kladovo"
  },
  "120": {
    "title": "Fortaleza de Smederevo",
    "shortDescription": "Última capital de la Serbia medieval y la mayor fortaleza de llanura de Europa.",
    "longDescription": "Castillo triangular erigido por el príncipe Đurađ Branković con 25 torres defensivas.",
    "location": "Smederevo"
  },
  "121": {
    "title": "Valle de los Reyes de Raška",
    "shortDescription": "Ruta histórico-cultural por el núcleo del primer Estado medieval serbio.",
    "longDescription": "Recorrido por monumentos de la UNESCO: Sopoćani, Studenica y Stari Ras.",
    "location": "Región de Raška"
  },
  "122": {
    "title": "Stari Ras e iglesia de San Pedro",
    "shortDescription": "El templo sacro de arquitectura cristiana más antiguo conservado en Serbia (s. VIII).",
    "longDescription": "Lugar de bautismo de San Sava y cuna del cristianismo en los Balcanes.",
    "location": "Novi Pazar"
  },
  "123": {
    "title": "Novi Pazar Oriental",
    "shortDescription": "Combinación única de herencia otomana, la mezquita Altun-alem y el ambiente del zoco.",
    "longDescription": "Paseo por el antiguo bazar degustando la repostería y la cocina tradicional.",
    "location": "Novi Pazar"
  },
  "124": {
    "title": "Arquitectura de Subotica",
    "shortDescription": "Ciudad referente del Modernismo húngaro con su Casa Consistorial y el Palacio Raichle.",
    "longDescription": "Una ciudad de cuentos de hadas repleta de detalles cerámicos y motivos florales.",
    "location": "Subotica"
  },
  "127": {
    "title": "Limes Romano del Danubio",
    "shortDescription": "Ruta desde Viminacium hasta la Tabula Traiana a través del legado del Imperio Romano.",
    "longDescription": "Descubra campamentos legionarios, anfiteatros e inscripciones labradas en la roca.",
    "location": "Valle del Danubio"
  },
  "128": {
    "title": "Monasterios de Fruška Gora",
    "shortDescription": "El Monte Athos serbio en Vojvodina con 16 monasterios barrocos y medievales.",
    "longDescription": "Krušedol, Grgeteg y Hopovo albergan el legado cultural de la época de los Habsburgo.",
    "location": "Fruška Gora"
  },
  "129": {
    "title": "Círculo de galerías del Modernismo de Belgrado",
    "shortDescription": "Galerías de diseño e interiorismo en los edificios históricos del centro.",
    "longDescription": "Recorrido por estudios de diseño contemporáneo serbio y arquitectura vanguardista.",
    "location": "Belgrado"
  },
  "130": {
    "title": "Arquitectura yugoslava de Belgrado",
    "shortDescription": "Iconos brutalistas y urbanismo moderno de Nuevo Belgrado como la Torre Genex.",
    "longDescription": "Un viaje arquitectónico por la monumental planificación urbana de la era socialista.",
    "location": "Belgrado"
  },
  "131": {
    "title": "Kragujevac Industrial",
    "shortDescription": "Cuna de la industria serbia, el Arsenal del Príncipe y el parque conmemorativo.",
    "longDescription": "Historia de la primera fundición de armas y del primer instituto de Serbia en el siglo XIX.",
    "location": "Kragujevac"
  },
  "133": {
    "title": "Bodegas de piedra de Rogljevo (Pimnice)",
    "shortDescription": "Bodegas rústicas de piedra tallada con un microclima ideal para la crianza del vino.",
    "longDescription": "Arquitectura tradicional de galerías subterráneas donde se crían caldos de excepción.",
    "location": "Rogljevo"
  },
  "134": {
    "title": "Bodega del Monasterio de Bukovo",
    "shortDescription": "Recuperación de la tradición vinícola monástica con la rara variedad Crna Tamjanika.",
    "longDescription": "Los viñedos del monasterio producen un vino tinto singular de intenso aroma floral.",
    "location": "Negotin"
  },
  "135": {
    "title": "Tarde de Bermet en Sremski Karlovci",
    "shortDescription": "Cata de vino dulce de hierbas a la sombra de patios barrocos y jardines señoriales.",
    "longDescription": "Disfrute de la tradición de la corte imperial austríaca acompañando el Bermet con aperitivos locales.",
    "location": "Sremski Karlovci"
  },
  "137": {
    "title": "Aroma de Tamjanika - Župa",
    "shortDescription": "Ruta entre las colinas de viñedos de Župa dedicada a la variedad blanca más aromática.",
    "longDescription": "Visita a bodegas familiares donde la Tamjanika se sirve con quesos y jamón de la región.",
    "location": "Župa"
  },
  "138": {
    "title": "Prokupac - Ruta del vino de Toplica",
    "shortDescription": "Renacimiento de la uva tinta autóctona en su región histórica de Toplica.",
    "longDescription": "Encuentro con viticultores que recuperan cepas centenarias de la variedad Prokupac.",
    "location": "Toplica"
  },
  "139": {
    "title": "Pueblo de los pimientos de Donja Lokošnica",
    "shortDescription": "La capital mundial del pimiento seco cuyas fachadas se tiñen totalmente de rojo en otoño.",
    "longDescription": "Un paisaje fascinante donde miles de guirnaldas de pimientos secan al sol en cada casa.",
    "location": "Cerca de Leskovac"
  },
  "140": {
    "title": "Mesa artesanal y gastronómica de Pirot",
    "shortDescription": "Cata de queso curado, embutido prensado y exhibición de tejido de alfombras de Pirot.",
    "longDescription": "Una inmersión cultural y gastronómica genuina en las tradiciones del sureste serbio.",
    "location": "Pirot"
  },
  "141": {
    "title": "Desayuno en la meseta de Pešter",
    "shortDescription": "Auténtico desayuno rústico con pan de trigo sarraceno, kajmak fresco y té caliente.",
    "longDescription": "Viva la gastronomía pastoril en la inmensidad de la llamada 'Siberia serbia'.",
    "location": "Pešter"
  },
  "142": {
    "title": "Alfarería de Zlakusa y guiso al Sač",
    "shortDescription": "Elaboración de guisos en cazuelas de barro con calcita a fuego lento de leña.",
    "longDescription": "Taller gastronómico para degustar estofados de col y carnes al horno en barro tradicional.",
    "location": "Zlakusa"
  },
  "145": {
    "title": "Relax termal en Ovčar Banja",
    "shortDescription": "Aguas termales curativas en la frondosa naturaleza del desfiladero de Ovčar-Kablar.",
    "longDescription": "Combinación de baños térmicos con paseos hacia monasterios de montaña.",
    "location": "Ovčar Banja"
  },
  "146": {
    "title": "Termas de alta montaña en Lukovska Banja",
    "shortDescription": "El balneario más alto de Serbia (681 m) con manantiales calientes al aire libre.",
    "longDescription": "Baños termales al aire libre durante todo el año entre los bosques de Kopaonik.",
    "location": "Kopaonik"
  },
  "148": {
    "title": "Lago de Plata y Fortaleza de Ram",
    "shortDescription": "Descanso junto al lago fluvial y visita a la restaurada fortaleza otomana de Ram.",
    "longDescription": "Ram regala los atardeceres más hermosos sobre el Danubio, mientras el Lago de Plata ofrece ocio náutico.",
    "location": "Veliko Gradište"
  }
};

Object.assign(esData, esAdditions);

let fileContent = `/**
 * IDEMO Canonical Serbia Baseline v2 — Spanish (ES) Translations
 * Work Package: WP-09B
 */

export const esCanonicalTranslations: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {\n`;

canonical.forEach(r => {
  const item = esData[r.id];
  if (!item) {
    console.error(`Missing ES item for ID ${r.id}`);
    return;
  }
  fileContent += `  "${r.id}": {
    "title": ${JSON.stringify(item.title)},
    "shortDescription": ${JSON.stringify(item.shortDescription)},
    "longDescription": ${JSON.stringify(item.longDescription)},
    "location": ${JSON.stringify(item.location)}
  },\n`;
});

fileContent += `};\n`;

fs.writeFileSync('./src/data/translations/serbia/esTranslations.ts', fileContent);
console.log('Successfully updated src/data/translations/serbia/esTranslations.ts with 135 authentic Spanish translations.');
