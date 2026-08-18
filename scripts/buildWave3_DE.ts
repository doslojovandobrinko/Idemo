import * as fs from 'fs';
import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import { deCanonicalTranslations } from '../src/data/translations/serbia/deTranslations';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

const deData: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = { ...deCanonicalTranslations };

const deAdditions: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {
  "1": {
    "title": "Uvac-Mäander",
    "shortDescription": "Spektakuläre Flussschlingen im Uvac-Canyon und das wichtigste Schutzgebiet für den Gänsegeier in Europa.",
    "longDescription": "Der Fluss Uvac hat über Jahrtausende tiefe, dramatische Schlingen in die Kalkfelsen geformt. Von Aussichtspunkten wie Molitva eröffnet sich ein atemberaubender Blick auf die Flussmäander und die majestätischen Gänsegeier im Flug.",
    "location": "Sjenica"
  },
  "2": {
    "title": "Belgrader Festung & Kalemegdan",
    "shortDescription": "Das historische Herz Belgrads am Zusammenfluss von Save und Donau mit jahrhundertealten Festungsanlagen.",
    "longDescription": "Die Festung von Belgrad vereint römische, byzantinische, osmanische und österreichische Architektur. Der umgebende Kalemegdan-Park bietet Panoramablicke auf den Zusammenfluss der Flüsse und beherbergt das Siegerdenkmal.",
    "location": "Belgrad, Stari Grad"
  },
  "3": {
    "title": "Belgrader Fluss-Nachtleben",
    "shortDescription": "Erleben Sie die weltberühmte Energie des Belgrader Nachtlebens auf den schwimmenden Clubs (Splavovi).",
    "longDescription": "Die Splavovi an Save und Donau haben Belgrad zur Welthauptstadt des Nachtlebens gemacht. Von Underground-Techno bis zu Live-Musik bieten die schwimmenden Clubs sommerliche Feierkultur bis in die Morgenstunden.",
    "location": "Belgrad"
  },
  "4": {
    "title": "Vrnjačka Banja",
    "shortDescription": "Die Königin des serbischen Kurtourismus, berühmt für sieben Heilquellen seit der Römerzeit.",
    "longDescription": "Vrnjačka Banja ist Serbiens renommiertester Kurort mit Thermalquellen, historischen Villen, weitläufigen Parkanlagen und der berühmten Liebesbrücke.",
    "location": "Vrnjačka Banja"
  },
  "5": {
    "title": "Sondernaturschutzgebiet Zasavica",
    "shortDescription": "Geschütztes Feuchtgebiet, bekannt für seltene Vögel, Mangalica-Schweine und den teuersten Eselkäse der Welt (Pule).",
    "longDescription": "Zasavica ist ein Mosaik aus Schilfflächen und Auwäldern. Neben der Zucht von Bibern und Mangalica-Schweinen ist das Reservat weltberühmt für die Herstellung von Pule, dem exklusivsten Eselkäse im Geiste der Slow-Food-Kultur.",
    "location": "Nahe Sremska Mitrovica"
  },
  "6": {
    "title": "Sremski Karlovci",
    "shortDescription": "Serbiens eleganteste Barockstadt und kulturelles Zentrum, bekannt für den Bermet-Wein und Habsburger Architektur.",
    "longDescription": "Sremski Karlovci ist ein Freilichtmuseum des 18. und 19. Jahrhunderts. Als geistiges Zentrum der Serben in der Habsburgermonarchie unterzeichnete man hier 1699 den Frieden von Karlowitz. Berühmt für den Kräuter-Dessertwein Bermet.",
    "location": "Nahe Novi Sad"
  },
  "7": {
    "title": "Nikola-Tesla-Museum",
    "shortDescription": "Erkunden Sie das Erbe des Genies, das das 20. Jahrhundert erfand. Das Museum bewahrt Originalpatente und Teslas Urne.",
    "longDescription": "Das Museum in einer Jugendstil-Villa im Stadtteil Vračar beherbergt über 160.000 Originaldokumente, persönliche Gegenstände und funktionsfähige Modelle von Teslas Erfindungen wie dem Tesla-Transformator.",
    "location": "Belgrad, Vračar"
  },
  "8": {
    "title": "Zlakusa-Töpferei",
    "shortDescription": "Jahrhundertealte Töpferkunst aus Ton und Kalzit auf dem langsamen Rad, UNESCO-Immaterielles Kulturerbe.",
    "longDescription": "Das Dorf Zlakusa ist bekannt für die Herstellung von Kochgeschirr aus einer Ton-Kalzit-Mischung. Das Brennen auf offenem Feuer verleiht den darin langsam geschmorten Speisen ein einzigartiges Aroma.",
    "location": "Zlakusa, Užice"
  },
  "9": {
    "title": "Weine vom Sandboden (Palić)",
    "shortDescription": "Das Weinbaugebiet Palić ist bekannt für seine Sandböden, die einzigartige Weißweine hervorbringen.",
    "longDescription": "Die Sandböden der Region Subotica-Palić verleihen den Weißweinen eine charakteristische Mineralität und frische Eleganz.",
    "location": "Palić / Subotica"
  },
  "10": {
    "title": "Rakia Bar Belgrad",
    "shortDescription": "Pionier der modernen Obstbrand-Kultur mit exquisiten Degustationen und abgestimmten Häppchen.",
    "longDescription": "Die Rakia Bar hat die Wahrnehmung des traditionellen serbischen Nationalgetränks neu definiert. Sie bietet professionelle Verkostungen erstklassiger Obstbrände gepaart mit lokalen Spezialitäten.",
    "location": "Belgrad Zentrum"
  },
  "11": {
    "title": "Brennerei Zarić",
    "shortDescription": "Preisgekrönte Destillerie in Kosjerić, die Tradition und High-Tech für Weltklasse-Obstbrände verbindet.",
    "longDescription": "Die Brennerei Zarić gilt als Benchmark für Pflaumen- und Quittenbrände höchster Güte. Ihre Brände wie 'Nirvana' gewannen zahlreiche internationale Auszeichnungen.",
    "location": "Kosjerić"
  },
  "12": {
    "title": "Kafana Zum Fragezeichen (?)",
    "shortDescription": "Belgrads älteste erhaltene Kafana aus dem Jahr 1823, ein lebendiges Denkmal serbischer Gastfreundschaft.",
    "longDescription": "Gegenüber der Kathedrale gelegen, bietet die Kafana (?) traditionelle serbische Gerichte in historischem Ambiente und erzählt Geschichten aus zwei Jahrhunderten Stadtgeschichte.",
    "location": "Belgrad, Altstadt"
  },
  "13": {
    "title": "Kafana Tri Šešira (Drei Hüte)",
    "shortDescription": "Das bohemische Herz von Belgrad in der Kopfsteinpflastergasse Skadarlija mit Akkordeonmusik und Steaks.",
    "longDescription": "Seit 1864 empfängt Tri Šešira Künstler und Dichter. Mit traditioneller Tamburica-Musik und Holzkohlegrill-Spezialitäten verkörpert es den alten Belgrader Charme.",
    "location": "Belgrad, Skadarlija"
  },
  "14": {
    "title": "Dermatologische Klinik Dr. Kozarev",
    "shortDescription": "Führendes Zentrum für ästhetische Dermatologie und Laserbehandlungen mit modernster Ausstattung.",
    "longDescription": "Die Klinik im Stadtteil Vračar bietet fortschrittliche medizinische und ästhetische Hautbehandlungen unter der Leitung renommierter Fachärzte.",
    "location": "Belgrad, Vračar"
  },
  "15": {
    "title": "Zahnklinik Dr. Popović",
    "shortDescription": "Spitzenleistungen in der ästhetischen Zahnheilkunde und Implantologie nach höchsten europäischen Standards.",
    "longDescription": "Die Klinik bietet umfassende zahnmedizinische Behandlungen von Implantaten bis zu Furnieren im Rahmen des internationalen Medizintourismus.",
    "location": "Belgrad, Vračar"
  },
  "16": {
    "title": "Kloster Studenica",
    "shortDescription": "Mutter der serbisch-orthodoxen Klöster und UNESCO-Weltkulturerbe mit dem berühmten Fresko der Kreuzigung.",
    "longDescription": "1190 von Stefan Nemanja gegründet, verbindet Studenica romanische und byzantinische Architektur aus weißem Marmor mit weltberühmten Fresken des 13. Jahrhunderts.",
    "location": "Kraljevo / Raška"
  },
  "17": {
    "title": "Kloster Žiča",
    "shortDescription": "Das rote Königskloster, in dem sieben serbische Könige gekrönt wurden.",
    "longDescription": "Errichtet im frühen 13. Jahrhundert unter König Stefan dem Erstgekrönten, war Žiča der erste Sitz der unabhängigen serbischen Kirche und besticht durch seine leuchtend rote Fassade.",
    "location": "Kraljevo"
  },
  "18": {
    "title": "Weingut Aleksandrović",
    "shortDescription": "Spitzenweingut der Region Šumadija in der Tradition der königlichen Weinberge.",
    "longDescription": "Das Weingut setzt die Weinbautradition der Karadjordjević-Dynastie fort und erzeugt preisgekrönte Weine wie den berühmten Cuvee 'Trijumf'.",
    "location": "Topola / Oplenac"
  },
  "19": {
    "title": "Archäologische Stätte Vinča",
    "shortDescription": "Wiege der europäischen Jungsteinzeit an den Ufern der Donau.",
    "longDescription": "Vinča bezeugt eine hochentwickelte neolithische Kultur vor über 7.000 Jahren mit früher Kupferverarbeitung und charakteristischen Idol-Figurinen.",
    "location": "Belgrad, Grocka"
  },
  "20": {
    "title": "Römische Kaiserstadt Sirmium",
    "shortDescription": "Eine der vier Hauptstädte des Römischen Reiches mit erhaltenen Mosaiken und Kaiserpalast.",
    "longDescription": "Das heutige Sremska Mitrovica ruht auf den Mauern von Sirmium, dem Geburtsort von zehn römischen Kaisern. Das Besucherzentrum zeigt spektakuläre Mosaikböden.",
    "location": "Sremska Mitrovica"
  },
  "21": {
    "title": "Festung Petrovaradin",
    "shortDescription": "Das Gibraltar an der Donau mit dem berühmten 'trunkenen Uhrturm' und unterirdischen Tunnelsystemen.",
    "longDescription": "Die mächtige Barockfestung oberhalb von Novi Sad bietet einen Panoramablick auf die Donau und ist Austragungsort des preisgekrönten EXIT-Festivals.",
    "location": "Novi Sad"
  },
  "22": {
    "title": "Belgrader Festung & Park Kalemegdan",
    "shortDescription": "Historisches Zentrum Belgrads mit atemberaubender Aussicht auf den Zusammenfluss zweier Flüsse.",
    "longDescription": "Ein Treffpunkt der Weltreiche mit römischen Brunnen, Befestigungsmauern und weitläufigen Alleen rund um das Sieger-Denkmal.",
    "location": "Belgrad Altstadt"
  },
  "23": {
    "title": "Kulturzentrum Silosi Belgrad",
    "shortDescription": "Ein lebendiger Raum für Kunst und Kultur in ehemaligen Getreidesilos an der Donau.",
    "longDescription": "Silosi ist ein Paradebeispiel für die Umnutzung von Industrieerbe in Dorćol für Kunstausstellungen, Konzerte und Umweltinitiativen.",
    "location": "Belgrad, Dorćol"
  },
  "24": {
    "title": "Spezialklinik Čigota",
    "shortDescription": "Führendes Zentrum für Schilddrüsenerkrankungen, Stoffwechsel und Regeneration auf dem Zlatibor.",
    "longDescription": "Čigota kombiniert das Heilklima des Zlatibor-Gebirges mit medizinischer Betreuung für Gewichtsregulierung und Stoffwechselbalance.",
    "location": "Zlatibor"
  },
  "25": {
    "title": "Weingut Zvonko Bogdan",
    "shortDescription": "Luxuriöses Weingut im Jugendstil am Palić-See mit exquisiten Weinen aus Sandböden.",
    "longDescription": "Verbindet edle Architektur mit moderner Oenologie. Bekannt für strukturierte Weine aus den Sandböden Nord-Bačkas.",
    "location": "Palić"
  },
  "26": {
    "title": "Pirot-Teppichweberei",
    "shortDescription": "UNESCO-geschütztes Kunsthandwerk – beidseitig gewebte Kelims mit geometrischen Symbolen.",
    "longDescription": "Pirot-Kelims werden aus der feinsten Wolle des Stara-Planina-Gebirges in reiner Handarbeit hergestellt und zeichnen sich durch kräftige Farben aus.",
    "location": "Pirot"
  },
  "27": {
    "title": "Kafana Kovač",
    "shortDescription": "Traditionelles Restaurant mit reichhaltiger Auswahl serbischer Spezialitäten aus dem Ton-Sač.",
    "longDescription": "Kovač pflegt die Kultur des serbischen Gastmahls mit unter der Asche geschmortem Fleisch und hausgemachten Süßspeisen.",
    "location": "Belgrad, Voždovac"
  },
  "28": {
    "title": "Rtanj-Gebirge & Sokobanja",
    "shortDescription": "Der mystische Pyramidenberg Rtanj kombiniert mit den Thermalquellen des Luftkurorts Sokobanja.",
    "longDescription": "Der Rtanj fasziniert durch seine Geometrie und Heilkräuter, während Sokobanja Entspannung in Thermalbädern seit Römerzeiten bietet.",
    "location": "Ostserbien"
  },
  "29": {
    "title": "Vojvodina Salaš-Bauernhöfe",
    "shortDescription": "Traditionelle Landgüter der Pannonischen Tiefebene mit Tamburica-Musik und Deftigkeit.",
    "longDescription": "Ein Salaš bietet Zuflucht in der Natur mit hausgemachtem Kesselsuppen, Gulasch, Apfelstrudel und Fruchtbränden.",
    "location": "Vojvodina"
  },
  "30": {
    "title": "Nationalpark Tara",
    "shortDescription": "Unberührte Natur in Westserbien mit Drina-Canyon, Pančić-Fichte und spektakulären Aussichtspunkten.",
    "longDescription": "Der Nationalpark Tara ist Rückzugsgebiet des Braunbären. Aussichtspunkte wie Banjska Stena bieten grandiose Blicke auf den Drina-Canyon.",
    "location": "Westserbien"
  },
  "31": {
    "title": "Club Drugstore Belgrad",
    "shortDescription": "Kathedrale der Belgrader Techno-Szene in einem ehemaligen industriellen Schlachthof.",
    "longDescription": "Drugstore ist das Monument der Underground-Elektronik-Kultur der Region. Die Roolbeton-Architektur zieht weltbekannte DJs an.",
    "location": "Belgrad, Palilula"
  },
  "32": {
    "title": "Gardoš-Turm & Zemun",
    "shortDescription": "Millenniumsturm über den Pflastergassen von Zemun mit Weitblick auf die Donau.",
    "longDescription": "Zemun bewahrt den mittelasiatischen Charme der Habsburgerzeit. Der 1896 erbaute Gardoš-Turm bietet den besten Blick auf die roten Dächer.",
    "location": "Belgrad, Zemun"
  },
  "33": {
    "title": "Leskovac Grill-Spezialitäten",
    "shortDescription": "Die Hauptstadt des serbischen Grills mit geschützter Herkunftsbezeichnung für Hackfleischgerichte.",
    "longDescription": "Leskovac ist weltberühmt für Holzkohlegrill-Techniken. Die Pljeskavica-Frikadellen sind die Krönung der Balkan-Fleischkultur.",
    "location": "Leskovac"
  },
  "34": {
    "title": "Festung Golubac",
    "shortDescription": "Imposante mittelalterliche Festung direkt am Eingang zur spektakulären Eisernen-Tor-Schlucht.",
    "longDescription": "Mit neun Türmen, die durch Wehrmauern verbunden sind und aus der Donau ragen, gehört Golubac zu den besterhaltenen Wasserburgen Europas.",
    "location": "Golubac, Eisernes Tor"
  },
  "35": {
    "title": "Zentrum für Regenerationsmedizin Belgrad",
    "shortDescription": "Fortschrittliche Anti-Aging- und Stammzelltherapien unter medizinischer Aufsicht.",
    "longDescription": "Spezialisierte Zentren bieten modernste Verfahren zur Verjüngung und zellulären Regeneration nach internationalen Standards.",
    "location": "Belgrad Zentrum"
  },
  "36": {
    "title": "Felix Romuliana (Gamzigrad)",
    "shortDescription": "Kaiserpalast des Römischen Kaisers Galerius nahe Zaječar, UNESCO-Weltkulturerbe.",
    "longDescription": "Spätrömische Palastarchitektur mit gewaltigen Wehrtürmen und farbenprächtigen Mosaiken aus dem 4. Jahrhundert.",
    "location": "Zaječar"
  },
  "37": {
    "title": "Oplenac & Königsanlage Topola",
    "shortDescription": "Mausoleum der königlichen Familie Karađorđević mit 40 Millionen Mosaiksteinen.",
    "longDescription": "Die St.-Georgs-Kirche fasziniert durch weißen Marmor und ein Innenleben aus exakten Kopien der schönsten mittelalterlichen Fresken Serbiens.",
    "location": "Topola"
  },
  "38": {
    "title": "Ovčar-Kablar-Schlucht",
    "shortDescription": "Das serbische Athos – eine Flussmäanderschlucht mit 10 versteckten Klöstern.",
    "longDescription": "Die Schlucht der Westlichen Morava zwischen den Bergen Ovčar und Kablar ist ein Ort der Stille, Spiritualität und Wandernatur.",
    "location": "Nahe Čačak"
  },
  "39": {
    "title": "Hype Club Belgrad",
    "shortDescription": "Luxuriöser Nachtclub am Save-Ufer mit exklusivem Interieur und erstklassigem Sound.",
    "longDescription": "Hype bietet ein elegantes Ausgeherlebnis für Liebhaber von House und R&B in gehobenem Ambiente.",
    "location": "Belgrad, Savamala"
  },
  "40": {
    "title": "Zepter Hotel & Wellness",
    "shortDescription": "Holistisches Wellness-Hotel in Vrnjačka Banja mit Fokus auf Prävention und Gesundheit.",
    "longDescription": "Kombiniert luxuriöse Unterkunft mit Spa-Behandlungen und individueller Ernährungsberatung im bekanntesten Kurort.",
    "location": "Vrnjačka Banja"
  },
  "41": {
    "title": "Humska Cigar Lounge",
    "shortDescription": "Exklusiver Club für Zigarren-Liebhaber und feine Spirituosen im Nobelviertel Senjak.",
    "longDescription": "Privater Lounge-Club in Belgrad für den Genuss von Premium-Zigarren, alten Cognacs und seltenen Whiskys.",
    "location": "Belgrad, Senjak"
  },
  "42": {
    "title": "Novi Pazar Ćevapi & Gastronomie",
    "shortDescription": "Authentische Rindfleisch-Ćevapi im Geiste der orientalischen Tradition von Novi Pazar.",
    "longDescription": "Novi Pazar besticht durch sein orientalisches Erbe, die Ćevapi aus reinem Rindfleisch und süße Orientalische Spezialitäten.",
    "location": "Novi Pazar"
  },
  "43": {
    "title": "Serbische Kur- & Heilbäder",
    "shortDescription": "Ärztlich geleitete Heilbadtherapien mit natürlichen Thermalquellen und Heilmoor.",
    "longDescription": "Serbien verfügt über zahlreiche Heilquellen, deren Wirksamkeit durch jahrhundertelange Tradition balneologisch belegt ist.",
    "location": "Verschiedene Kurorte"
  },
  "44": {
    "title": "Lepenski Vir Stätte",
    "shortDescription": "Eine der ältesten und bedeutendsten mesolithischen Fundstätten Europas an der Donau.",
    "longDescription": "Eine über 8.000 Jahre alte Zivilisation, bekannt für trapezförmige Behausungen und monumentale Fischmenschen-Skulpturen.",
    "location": "Donji Milanovac"
  },
  "45": {
    "title": "Teufelsstadt (Đavolja Varoš)",
    "shortDescription": "Naturphänomen aus 202 von Erosion geschaffenen Erdpyramiden und sauren Heilquellen.",
    "longDescription": "Einzigartige Erdtürme am Berg Radan, umwoben von Mythen und umgeben von extrem sauren Mineralquellen.",
    "location": "Nahe Kuršumlija"
  },
  "46": {
    "title": "Nationalpark Eisernes Tor (Đerdap)",
    "shortDescription": "Die größte Flussschlucht Europas, in der die Donau Natur und Historie verbindet.",
    "longDescription": "Bietet spektakuläre Aussichtspunkte wie Ploče, artenreiche Fauna und Denkmäler von der Steinzeit bis Rom.",
    "location": "Ostserbien"
  },
  "47": {
    "title": "Kafana Dva Jelena (Zwei Hirsch)",
    "shortDescription": "Legendäre Belgrader Kafana aus dem Jahr 1832, Treffpunkt von Dichtern und Staatsmännern.",
    "longDescription": "Klassische Speisen, Live-Tamburica-Orchester und der unnachahmliche Geist von Skadarlija machen den Besuch unvergesslich.",
    "location": "Belgrad, Skadarlija"
  },
  "48": {
    "title": "Naive Kunst aus Kovačica",
    "shortDescription": "Weltbekannte Schule der slowakischen naiven Malerei im banater Dorf Kovačica.",
    "longDescription": "Farbenfrohe Darstellungen des ländlichen Lebens, die von Sammlern weltweit geschätzt werden.",
    "location": "Kovačica, Banat"
  },
  "49": {
    "title": "Archäologische Stätte Mediana",
    "shortDescription": "Luxuriöses Römisches Landgut von Kaiser Konstantin dem Großen bei Niš.",
    "longDescription": "Mediana bewahrt wertvolle Bodenmosaike, Reste von Thermen und Landvillen des antiken Naissus.",
    "location": "Niš"
  },
  "50": {
    "title": "Luftkurort Divčibare",
    "shortDescription": "Bergresort auf dem Maljen-Gebirge, bekannt für heilende Windrosen und Kiefernwälder.",
    "longDescription": "Ideal für erholsames Wandern, frische Luft und Erholung unweit von Belgrad.",
    "location": "Maljen-Gebirge"
  },
  "51": {
    "title": "Belgrad Design District",
    "shortDescription": "Kreativviertel Čumić mit Concept Stores und Ateliergeschäften serbischer Modedesigner.",
    "longDescription": "Das Zentrum der unabhängigen Belgrader Mode- und Kunstszene für Unikate und handgefertigte Stücke.",
    "location": "Belgrad Zentrum"
  },
  "52": {
    "title": "Weinregion Župa",
    "shortDescription": "Wiege der autochthonen serbischen Rebsorten Tamjanika und Prokupac.",
    "longDescription": "Das Župa-Tal bietet authentische Kellerdörfer (Poljane) und Weinfeste im Herzen Serbiens.",
    "location": "Aleksandrovac"
  },
  "53": {
    "title": "Apitherapie & Bienenluft",
    "shortDescription": "Natürliche Inhalationstherapie in speziellen Holzbeuten-Zimmern mit Propolis-Aroma.",
    "longDescription": "Inhalation von Bienenstockluft reich an Propolis und ätherischen Ölen fördert die Atemwege und lindert Stress.",
    "location": "Ländliche Regionen"
  },
  "54": {
    "title": "Subotica Jugendstil & Synagoge",
    "shortDescription": "Architekturperle im ungarischen Jugendstil mit der zweitgrößten Synagoge Europas.",
    "longDescription": "Rathaus und Synagoge in Subotica bezaubern durch Buntglasfenster und Keramiken aus der Zsolnay-Manufaktur.",
    "location": "Subotica"
  },
  "55": {
    "title": "Sondernaturschutzgebiet Carska Bara",
    "shortDescription": "Reichhaltiges Feuchtgebiet und Vogelparadies mit über 250 nachgewiesenen Vogelarten.",
    "longDescription": "Bootsfahrten durch Schilfkanäle der alten Begej-Arme bieten Beobachtung von Reihern und Seeadlern.",
    "location": "Nahe Zrenjanin"
  },
  "56": {
    "title": "Festung Niš",
    "shortDescription": "Eine der besterhaltenen osmanischen Festungsanlagen des zentralen Balkans.",
    "longDescription": "Am Ufer der Nišava gelegen, vereint sie byzantinische, osmanische und römische Spuren und beherbergt das Nišville Jazz Festival.",
    "location": "Niš"
  },
  "57": {
    "title": "Jerma-Flussschlucht",
    "shortDescription": "Eine der engsten und dramatischsten Schluchten Europas mit dem Kloster Poganovo.",
    "longDescription": "Unberührte Natur im Südosten Serbiens mit aufragenden Felswänden direkt über dem Flusslauf.",
    "location": "Dimitrovgrad"
  },
  "58": {
    "title": "Bermet & Keller von Sremski Karlovci",
    "shortDescription": "Verkostung des einzigartigen Kräuter-Dessertweins in historischen Familienkellern.",
    "longDescription": "Winzerfamilien bewahren das Geheimrezept des Bermet mit Trockenfrüchten und Gewürzen seit Generationen.",
    "location": "Sremski Karlovci"
  },
  "59": {
    "title": "Stein-Dorf Gostuša",
    "shortDescription": "Authentisches Bergdorf im Stara-Planina-Gebirge aus Stein, Holz und Lehm.",
    "longDescription": "Ein architektonisches Schutzgebiet, in dem die Zeit stillsteht und mit Steinplatten gedeckte Dächer dominieren.",
    "location": "Stara Planina"
  },
  "60": {
    "title": "Rooftop-Bars Belgrade Waterfront",
    "shortDescription": "Moderne Dachterrassen-Bars mit Blick auf den Fluss Zusammenfluss und die Skyline.",
    "longDescription": "Exklusive Orte für Cocktails bei Sonnenuntergang über den Flüssen Save und Donau.",
    "location": "Belgrade Waterfront"
  },
  "61": {
    "title": "Prolom Banja",
    "shortDescription": "Bekannt für hochalkalisches Prolom-Wasser und Heilmoor an den Hängen des Radan-Gebirges.",
    "longDescription": "Natürliches Heilbad für Nieren- und Hauterkrankungen mit modernen Thermalbecken.",
    "location": "Südserbien"
  },
  "62": {
    "title": "Vratna-Felsentore",
    "shortDescription": "Die höchsten natürlichen Felsenbrücken Europas im Canyon des Flusses Vratna.",
    "longDescription": "Drei spektakuläre Felsbögen, verborgen in den dichten Wäldern Ostserbiens.",
    "location": "Nahe Negotin"
  },
  "63": {
    "title": "Weingut Spasić (Župa)",
    "shortDescription": "Familienweingut, gewidmet der Wiederbelebung der autochthonen Rebsorte Prokupac.",
    "longDescription": "Verbindet Tradition mit moderner Enologie und rückt das Terroir des Balkans in den Fokus.",
    "location": "Tržac, Župa"
  },
  "64": {
    "title": "Avala-Turm & Berg Avala",
    "shortDescription": "Wahrzeichen Belgrads mit Aussichtsplattform in 122 Metern Höhe und Denkmal des Unbekannten Soldaten.",
    "longDescription": "Beliebtes Ausflugsziel mit Panoramablick auf die Šumadija. Das monumentale Denkmal stammt von Ivan Meštrović.",
    "location": "Avala, Belgrad"
  },
  "65": {
    "title": "EXPO 2027 Komplex Belgrad",
    "shortDescription": "Zukünftiges Weltausstellungszentrum zum Thema Spiel und Sport mit moderner Infrastruktur.",
    "longDescription": "Ein neuer Messe- und Kulturkomplex in Surčin, der Belgrad als regionales Innovationszentrum positioniert.",
    "location": "Surčin, Belgrad"
  },
  "66": {
    "title": "Sirogojno Wollpullover",
    "shortDescription": "Weltberühmte handgestrickte Wollpullover mit Motiven der Zlatibor-Landschaften.",
    "longDescription": "Das Handwerk der Strickerinnen aus Sirogojno eroberte Modeschauen in Paris und New York.",
    "location": "Sirogojno, Zlatibor"
  },
  "67": {
    "title": "Kloster Ravanica",
    "shortDescription": "Stiftung von Fürst Lazar und Ruhestätte seiner Gebeine, Juwel der Morava-Schule.",
    "longDescription": "Errichtet im 14. Jahrhundert mit reich verzierten Steinrosetten und bedeutenden mittelalterlichen Fresken.",
    "location": "Ćuprija"
  },
  "68": {
    "title": "Bitef Theater & Festival",
    "shortDescription": "Avantgardistisches Theater in einer umgebauten evangelischen Kirche und weltberühmtes Festival.",
    "longDescription": "Seit über 50 Jahren erweitert Bitef die Grenzen der Theaterkunst mit internationalen Ensembles.",
    "location": "Belgrad, Dorćol"
  },
  "69": {
    "title": "Serbisches Nationaltheater (Novi Sad)",
    "shortDescription": "Ältestes Berufstheater der Serben (gegründet 1861) mit Oper, Ballett und Schauspiel.",
    "longDescription": "Kultureller Leuchtturm auf dem Theaterplatz in Novi Sad mit erstklassigem Repertoire.",
    "location": "Novi Sad"
  },
  "70": {
    "title": "Kafana Hercegovina (Kragujevac)",
    "shortDescription": "Authentische Šumadija-Kafana, bekannt für Spanferkel, warmes Lepinja-Brot und Gastfreundschaft.",
    "longDescription": "Treffpunkt für Liebhaber ehrlicher traditioneller Küche im Herzen von Kragujevac.",
    "location": "Kragujevac"
  },
  "71": {
    "title": "Belgrader Jazz-Festival Orte",
    "shortDescription": "Clubs und Hallen wie Dom Omladineder, die seit 1971 eine reiche Jazztradition pflegen.",
    "longDescription": "Belgrad blickt auf eine lange Jazzgeschichte zurück und bringt internationale Legenden auf die Bühne.",
    "location": "Belgrad"
  },
  "72": {
    "title": "Weinkeller Rogljevo (Pimnice)",
    "shortDescription": "Historische Steinweinkeller aus dem 19. Jahrhundert in der Negotinska Krajina.",
    "longDescription": "Ein einzigartiges Dorf aus Naturstein für die Reifung von Rotweinen hoher Qualität.",
    "location": "Rogljevo, Negotin"
  },
  "73": {
    "title": "Kräuterheilkunde Fruška Gora",
    "shortDescription": "Traditionelle Kräutertees und Salben, hergestellt von den Mönchen der Fruška-Gora-Klöster.",
    "longDescription": "Jahrhundertealtes Heilkräuterwissen, verarbeitet zu natürlichen Tinkturen und Stärkungsmitteln.",
    "location": "Fruška Gora"
  },
  "74": {
    "title": "Pančevo Seidenbautradition",
    "shortDescription": "Historische Seidenherstellung im Süd-Banat mit erhaltenen Industriegebäuden.",
    "longDescription": "Pančevo war ein bedeutendes Zentrum der Seidenraupenzucht in der Habsburgermonarchie.",
    "location": "Pančevo"
  },
  "75": {
    "title": "Lokale Küche von Pirot",
    "shortDescription": "Gepresste Wurst (Peglana Kobasica), Pirot-Käse und Lammfleisch aus dem Sač.",
    "longDescription": "Einzigartige kulinarische Spezialitäten des Stara-Planina-Gebirges mit geschützter Herkunft.",
    "location": "Pirot"
  },
  "76": {
    "title": "Zlatibor Kulinarik",
    "shortDescription": "Komplet Lepinja mit Fleischsaft, Räucherschinken und frischer Dickmilch.",
    "longDescription": "Der luftgetrocknete Schinken aus Mačat und die Komplet Lepinja sind Ikonen der Gebirgsküche.",
    "location": "Zlatibor"
  },
  "77": {
    "title": "Vojvodina Fischsuppe & Perkelt",
    "shortDescription": "Deftige Kesselgerichte mit Donaufisch oder Rindfleisch und hausgemachten Nudeln.",
    "longDescription": "Von der ungarischen Küche geprägte Gerichte, zubereitet über offenem Holzfeuer.",
    "location": "Vojvodina"
  },
  "78": {
    "title": "Valjevo Tabak-Grammeln (Duvan Čvarci)",
    "shortDescription": "Knusprige Grieben in feinen Fäden, langstündig im Kupferkessel zubereitet.",
    "longDescription": "Eine geschützte Spezialität aus Valjevo durch stundenlanges Auslassen von Schweinefleisch.",
    "location": "Valjevo"
  },
  "79": {
    "title": "Mantije aus Novi Pazar",
    "shortDescription": "Kleine Blätterteigwürfel mit Hackfleischfüllung, serviert mit frischem Joghurt.",
    "longDescription": "Immaterielles Kulturgut Serbiens. Von Hand ausgezogener Teig im Holzofen gebacken.",
    "location": "Novi Pazar"
  },
  "80": {
    "title": "Sjenica-Käse & Lammfleisch",
    "shortDescription": "Berühmter Vollfett-Salzlakenkäse und Lammfleisch von den Weiden der Pešter-Hochfläche.",
    "longDescription": "Die unberührten Weiden auf über 1.000 Metern Höhe verleihen dem Sjenica-Käse sein Aroma.",
    "location": "Sjenica / Pešter"
  },
  "81": {
    "title": "Homolje-Honig",
    "shortDescription": "Ökologisch reiner Gebirgshonig aus den unberührten Wäldern der Homolje-Berge.",
    "longDescription": "Geschützter Marken-Honig mit hoher Konzentration an Heilkräuterpollen.",
    "location": "Homolje"
  },
  "82": {
    "title": "Šumadija Slivovitz & Schnapsrouten",
    "shortDescription": "Traditionelle Herstellung von Pflaumenbrand aus alten heimischen Sorten wie Crvena Ranka.",
    "longDescription": "Šumadija ist das Herz des serbischen Slivovitz. Besuch von Brennereien mit Eichenfasslagerung.",
    "location": "Šumadija"
  },
  "83": {
    "title": "Đerdap Radroute (EuroVelo 6)",
    "shortDescription": "Radtour entlang der Donau durch den spektakulärsten Abschnitt des EuroVelo 6 Korridors.",
    "longDescription": "Die Route führt vorbei an Burgen, Römerfelsen und durch aus dem Fels gehauen Tunnel.",
    "location": "Donau-Korridor"
  },
  "84": {
    "title": "Negotinska Krajina Weinrouten",
    "shortDescription": "Weine aus Rajačke und Rogljevačke Pimnice mit einzigartigem Mikroklima.",
    "longDescription": "Raritäten wie Začinak und Schwarzer Tamjanika gedeihen in Wassernähe der Donau.",
    "location": "Negotin"
  },
  "85": {
    "title": "Vršac Weinrouten & Hügel",
    "shortDescription": "Weinberge am Fuße der Vršac-Berge mit Blick über die Banater Ebene.",
    "longDescription": "Vršac ist die Stadt der Trauben und des Windes mit jahrhundertealtem Weinbau.",
    "location": "Vršac"
  },
  "86": {
    "title": "Medizin-Paket: Vrnjačka Banja Balneologie",
    "shortDescription": "Ganzheitliche Regeneration mit Thermalbädern und Physiotherapie.",
    "longDescription": "Ärztlich begleitetes Kurprogramm für Gelenke, Verdauungssystem und Immunsystem.",
    "location": "Vrnjačka Banja"
  },
  "87": {
    "title": "Medizin-Paket: Belgrad Zahnmedizin + Donau-Erholung",
    "shortDescription": "Erstklassige Zahnästhetik kombiniert mit Erholung am Flussufer.",
    "longDescription": "Komplettpaket aus Zahnimplantaten und ruhiger postoperativer Regeneration an der Donau.",
    "location": "Belgrad"
  },
  "88": {
    "title": "Medizin-Paket: Čigota Zlatibor Stoffwechsel-Reset",
    "shortDescription": "Spezialisiertes medizinisches Programm für Gewichtsregulierung und Schilddrüsen-Gesundheit.",
    "longDescription": "Kombination aus Ernährungsberatung, Bergwandern und Balneotherapie.",
    "location": "Zlatibor"
  },
  "89": {
    "title": "Medizin-Paket: Japanisches Head-Spa & Anti-Stress",
    "shortDescription": "Kopfhauttherapie und Mikrozirkulations-Entspannung in holistischen Zentren.",
    "longDescription": "Tiefenmassage und Wassertherapie zur Stressreduzierung und Schlafverbesserung.",
    "location": "Belgrad"
  },
  "90": {
    "title": "Medizin-Paket: Sokobanja Atemwege-Kur",
    "shortDescription": "Inhalationen mit Radonwasser und Bergluft für Lunge und Bronchien.",
    "longDescription": "Traditionelle Balneotherapie bei Atemwegserkrankungen unter ärztlicher Aufsicht.",
    "location": "Sokobanja"
  },
  "91": {
    "title": "Medizin-Paket: Regenerative Ästhetik + Tara-Kur",
    "shortDescription": "Sanfte Hautverjüngung kombiniert mit Erholung in den Kiefernwäldern der Tara.",
    "longDescription": "Nicht-invasive Verjüngungsverfahren und Höhenklima-Aufenthalt im Nationalpark.",
    "location": "Belgrad / Tara"
  },
  "92": {
    "title": "Medizin-Paket: Prolom Alkalzwasser-Kur",
    "shortDescription": "Trinkkur mit hochalkalischem Wasser für Nieren und Körperentgiftung.",
    "longDescription": "Programm in Prolom Banja zur Entgiftung der Harnwege und Hautvitalisierung.",
    "location": "Prolom Banja"
  },
  "93": {
    "title": "Medizin-Paket: Apitherapie-Wochenende",
    "shortDescription": "Inhalation von Aerosolen aus Bienenstöcken zur Stärkung der Atemwege.",
    "longDescription": "Naturnahe Therapie auf ökologischen Imkereien in der Šumadija.",
    "location": "Šumadija / Fruška Gora"
  },
  "94": {
    "title": "Medizin-Paket: Große Serbische Bäderrundreise",
    "shortDescription": "Mehrtägige Tour durch die führenden Thermal- und Heilbäder Serbiens.",
    "longDescription": "Individuelle Balneotherapie in Vrnjačka Banja, Sokobanja und Prolom Banja.",
    "location": "Serbische Kurregion"
  },
  "95": {
    "title": "Medizin-Paket: Longevity Fruška Gora",
    "shortDescription": "Holistisches Regenerationsprogramm inmitten der Wälder der Fruška Gora.",
    "longDescription": "Verbindet antioxidative Ernährung, moderates Wandern und sanfte Behandlungen.",
    "location": "Fruška Gora"
  },
  "96": {
    "title": "Belgrader Tanzfestival",
    "shortDescription": "Führendes Tanzfestival für zeitgenössisches Ballett mit Weltklasse-Ensembles.",
    "longDescription": "Verwandelt Belgrad jeden Frühling in eine Welthauptstadt des modernen Tanzes.",
    "location": "Belgrad"
  },
  "97": {
    "title": "Mikser Festival",
    "shortDescription": "Regionales Festival für Design, Architektur und Nachhaltigkeit im Silosi-Areal.",
    "longDescription": "Plattform für junge Kreative und ökologische urbane Lösungen.",
    "location": "Silosi Belgrad"
  },
  "98": {
    "title": "Arsenal Fest Kragujevac",
    "shortDescription": "Musikfestival in der historischen Kulisse des Fürstlichen Arsenals aus dem 19. Jahrhundert.",
    "longDescription": "Rock- und Alternativfestival im spektakulären Industrieerbe-Areal.",
    "location": "Kragujevac"
  },
  "99": {
    "title": "EXIT Festival (Novi Sad)",
    "shortDescription": "Mehrfach ausgezeichnetes Weltmusikfestival auf der Festung Petrovaradin.",
    "longDescription": "Entstanden aus einer Studentenbewegung, ist EXIT heute eines der bedeutendsten Festivals Europas.",
    "location": "Novi Sad"
  },
  "100": {
    "title": "Lovefest Vrnjačka Banja",
    "shortDescription": "Sommerliches Festival für elektronische Musik im Kurpark von Vrnjačka Banja.",
    "longDescription": "Vereint weltbekannte DJs der House- und Techno-Szene im grünen Kurpark.",
    "location": "Vrnjačka Banja"
  },
  "101": {
    "title": "Guča Trompetenfestival",
    "shortDescription": "Weltberühmtes Blechbläser-Festival mit mitreißenden Balkan-Rhythmen.",
    "longDescription": "Ein Rausch aus Trompetenmusik, kulinarischen Freuden und ununterbrochener Energie.",
    "location": "Guča, Dragačevo"
  },
  "102": {
    "title": "Belgrade Beer Fest",
    "shortDescription": "Größtes Bierfestival Südosteuropas im Ušće-Park mit kostenlosen Rockkonzerten.",
    "longDescription": "Hunderte Biersorten und ein großes Open-Air-Musikprogramm direkt am Flussufer.",
    "location": "Ušće, Belgrad"
  },
  "104": {
    "title": "Vratna-Felsentore Erforschung",
    "shortDescription": "Wanderung zu den über 30 Meter hohen natürlichen Gesteinsbögen im Vratna-Canyon.",
    "longDescription": "Geologisches Wunder Ostserbiens in unmittelbarer Nähe des Klosters Vratna.",
    "location": "Negotin"
  },
  "105": {
    "title": "Jerma-Schlucht Naturroute",
    "shortDescription": "Fahrt durch die enge Felsenschlucht zu den Klöstern Sukovo und Poganovo.",
    "longDescription": "Die in Fels gehauene Straße führt durch spektakuläre, unberührte Naturlandschaften.",
    "location": "Dimitrovgrad"
  },
  "106": {
    "title": "Rosomača-Canyon (Rosomački lonci)",
    "shortDescription": "Schichtfelsen-Schlucht im Stara-Planina-Gebirge mit beckenartigen Vertiefungen im Fels.",
    "longDescription": "Faszinierende Gesteinsformationen, durch die ein glasklauer Gebirgsbach fließt.",
    "location": "Stara Planina"
  },
  "107": {
    "title": "Krupaj-Quelle (Krupajsko Vrelo)",
    "shortDescription": "Türkisblaue Karstoase in Homolje mit Thermalwasser und Unterwasserhöhlen.",
    "longDescription": "Märchenhafte Quelloase mit kristallklarem Wasser, umgeben von alten Wassermühlen.",
    "location": "Homolje"
  },
  "108": {
    "title": "Canyon des Flusses Gradac",
    "shortDescription": "Einer der saubersten Flüsse Europas mit smaragdgrünen Gumpen bei Valjevo.",
    "longDescription": "Paradies für Fliegenfischer und Wanderer mit Trinkwasserqualität direkt aus dem Fluss.",
    "location": "Valjevo"
  },
  "110": {
    "title": "Aussichtspunkt Kablar",
    "shortDescription": "Spektakulärer Blick vom Gipfel des Kablar auf die Mäander der Westlichen Morava.",
    "longDescription": "Die Plattform auf 889 Metern Höhe bietet ein unvergessliches Panorama der Ovčar-Kablar-Schlucht.",
    "location": "Čačak"
  },
  "111": {
    "title": "Golija-Gebirge Naturpark",
    "shortDescription": "UNESCO-Biosphärenreservat mit den dichtesten Wäldern und unberührten Gipfeln.",
    "longDescription": "Verschneite Hänge und rauhe Gebirgsnatur mit traditioneller Almwirtschaft.",
    "location": "Golija"
  },
  "112": {
    "title": "Zagajica-Hügel (Zagajička brda)",
    "shortDescription": "Grüne Sanddünenhügel am Rande der Deliblato-Sandwüste.",
    "longDescription": "Märchenhafte sanfte Graswellen im Banat, ideal für Fotografen und Wanderer.",
    "location": "Deliblato-Sandwüste"
  },
  "114": {
    "title": "Obedska Bara Reservat",
    "shortDescription": "Alter Donau-Mäander und eines der ältesten Naturschutzgebiete der Welt.",
    "longDescription": "Feuchtgebietskomplex, berühmt für Eichenwälder und den Reichtum an Wasservögeln.",
    "location": "Pećinci, Srem"
  },
  "115": {
    "title": "Burg Maglič & Ibar-Tal",
    "shortDescription": "Mittelalterliche Höhenburg auf einem steilen Felsen über dem Fluss Ibar.",
    "longDescription": "Eine der besterhaltenen Burgen Serbiens mit acht Türmen zur Sicherung des Weges nach Studenica.",
    "location": "Ibar-Tal"
  },
  "118": {
    "title": "Burg Bač",
    "shortDescription": "Besterhaltene mittelalterliche Wasserburg in der Vojvodina mit Donjon-Turm.",
    "longDescription": "Eine Burg aus dem 14. Jahrhundert, die romanische und gotische Stilelemente verbindet.",
    "location": "Bač"
  },
  "119": {
    "title": "Festung Fetislam & Kladovo",
    "shortDescription": "Osmanische Festung an der Donau mit Besucherzentrum und Blick auf Rumänien.",
    "longDescription": "Restaurierte Befestigungsanlage aus dem 16. Jahrhundert direkt am Donauufer.",
    "location": "Kladovo"
  },
  "120": {
    "title": "Festung Smederevo",
    "shortDescription": "Letzte Hauptstadt des serbischen Mittelalterstaates und größte Flachlandfestung Europas.",
    "longDescription": "Dreieckige Festung des Despoten Đurađ Branković an der Mündung der Jezava in die Donau.",
    "location": "Smederevo"
  },
  "121": {
    "title": "Tal der Könige Raška",
    "shortDescription": "Kulturhistorische Route durch das Herzland des ersten serbischen Nemanjiden-Staates.",
    "longDescription": "Reise zu den UNESCO-Denkmälern Sopoćani, Studenica, Stari Ras und Đurđevi Stupovi.",
    "location": "Raška-Region"
  },
  "122": {
    "title": "Stari Ras & Peterskirche",
    "shortDescription": "Ältestes erhaltenes sakrales Bauwerk Serbiens aus dem 8. Jahrhundert.",
    "longDescription": "Ort der Taufe des heiligen Sava und Wiege des serbischen Christentums.",
    "location": "Novi Pazar"
  },
  "123": {
    "title": "Orient-Atmosphäre in Novi Pazar",
    "shortDescription": "Einzigartige Mischung aus osmanischem Erbe, Altun-Alem-Moschee und Basar-Leben.",
    "longDescription": "Flanieren durch den alten Basar mit traditioneller Gastronomie und orientalischer Architektur.",
    "location": "Novi Pazar"
  },
  "124": {
    "title": "Subotica Architektur",
    "shortDescription": "Zentrum des ungarischen Jugendstils mit prachtvollem Rathaus und Reichle-Palais.",
    "longDescription": "Eine Stadt voller bunter Keramikfliesen, floraler Muster und märchenhafter Fassaden.",
    "location": "Subotica"
  },
  "127": {
    "title": "Römischer Donaugrenzwall (Limes)",
    "shortDescription": "Route von Viminacium bis zur Trajanstafel durch das militärische Erbe Roms.",
    "longDescription": "Entdecken Sie Legionärslager, Amphitheater und Gedenkinschriften im Donaufelsen.",
    "location": "Donautal"
  },
  "128": {
    "title": "Klöster der Fruška Gora",
    "shortDescription": "Der serbische Heilige Berg in der Vojvodina mit 16 Barock- und Mittelalterklöstern.",
    "longDescription": "Krušedol, Grgeteg und Hopovo bewahren die serbische Kultur aus der Habsburgerzeit.",
    "location": "Fruška Gora"
  },
  "130": {
    "title": "Jugoslawische Architektur Belgrads",
    "shortDescription": "Brutalistische Perlen und Nachkriegsmodernismus in Neu-Belgrad wie Genex-Turm.",
    "longDescription": "Architektonische Zeitreise durch die monumentale Stadtplanung der sozialistischen Ära.",
    "location": "Belgrad"
  },
  "131": {
    "title": "Industriegeschichte Kragujevac",
    "shortDescription": "Wiege der modernen serbischen Industrie mit Fürstlichem Arsenal und Gedenkpark.",
    "longDescription": "Geschichte der ersten Waffengießerei, des ersten Gymnasiums und Theaters im 19. Jahrhundert.",
    "location": "Kragujevac"
  },
  "133": {
    "title": "Stein-Weindorf Rogljevo (Pimnice)",
    "shortDescription": "Versteckte Naturstein-Weinkeller mit einzigartigem Erdklima in der Krajina.",
    "longDescription": "Traditionelle Architektur von Erdkellern zur Reifung erstklassiger Rotweine.",
    "location": "Rogljevo"
  },
  "134": {
    "title": "Klosterweingut Bukovo",
    "shortDescription": "Wiederbelebung der klösterlichen Tradition mit der raritären Rebsorte Crna Tamjanika.",
    "longDescription": "Die Weinberge des Klosters erzeugen außergewöhnlich aromatische Rotweine.",
    "location": "Negotin"
  },
  "135": {
    "title": "Bermet Nachmittag Sremski Karlovci",
    "shortDescription": "Verkostung des edlen Kräuter-Dessertweins in schattigen barocken Innenhöfen.",
    "longDescription": "Erleben Sie die Tradition des Wiener Hofes bei Bermet und lokalen Leckereien.",
    "location": "Sremski Karlovci"
  },
  "137": {
    "title": "Duft der Tamjanika - Župa",
    "shortDescription": "Reise durch die sanften Weinberge des Župa-Tals auf den Spuren des Muskat-Weißweins.",
    "longDescription": "Besuch von Weinkellern mit Servieren von Tamjanika zu lokalem Käse und Schinken.",
    "location": "Župa"
  },
  "138": {
    "title": "Prokupac - Toplica Weinstraße",
    "shortDescription": "Rückkehr der authentischen serbischen Rotweinsorte in ihrer Heimat Toplica.",
    "longDescription": "Lernen Sie Winzer kennen, die hundertjährige Prokupac-Reben wieder aufleben lassen.",
    "location": "Toplica"
  },
  "139": {
    "title": "Paprika-Dorf Donja Lokošnica",
    "shortDescription": "Weltweit einzigartiges Dorf, dessen Hausfassaden im Herbst leuchtend rot getrocknet werden.",
    "longDescription": "Spektakulärer Anblick von Tausenden an Häusern aufgehängten Paprikaketten zur Chilipulver-Herstellung.",
    "location": "Nahe Leskovac"
  },
  "140": {
    "title": "Pirot Kulinarik & Handwerk",
    "shortDescription": "Verkostung von Käse, Schinken und Einblick in die Webkunst der Pirot-Kelims.",
    "longDescription": "Einzigartiges Kultur- und Gastronomie-Erlebnis im Südosten Serbiens.",
    "location": "Pirot"
  },
  "141": {
    "title": "Frühstück auf der Pešter-Hochfläche",
    "shortDescription": "Authentische Mahlzeit mit Buchweizenbrot, Kajmak-Rahm und Tee in der Bergnatur.",
    "longDescription": "Genießen Sie die deftige Hirtenküche in der Weite des 'serbischen Sibiriens'.",
    "location": "Pešter"
  },
  "142": {
    "title": "Zlakusa Töpfergeschirr & Sač",
    "shortDescription": "Zubereitung von Gerichten in Ton-Kalzit-Töpfen über sanftem Holzfeuer.",
    "longDescription": "Kulinarischer Workshop für Hochzeitskraut und geschmortes Fleisch im offenen Feuer.",
    "location": "Zlakusa"
  },
  "145": {
    "title": "Ovčar Banja Thermal-Entspannung",
    "shortDescription": "Warmes Heilwasser, gebettet in das satte Grün der Ovčar-Kablar-Schlucht.",
    "longDescription": "Kombination aus Thermalbädern und Spaziergängen zu versteckten Klöstern.",
    "location": "Ovčar Banja"
  },
  "146": {
    "title": "Lukovska Banja Höhen-Thermalbad",
    "shortDescription": "Serbiens höchstgelegenes Heilbad (681 m) mit heißen Thermalquellen im Freien.",
    "longDescription": "Ganzjähriges Open-Air-Baden in heißen Mineralquellen im Kopaonik-Gebirge.",
    "location": "Kopaonik"
  },
  "148": {
    "title": "Silbersee & Festung Ram",
    "shortDescription": "Erholung am Flusssee kombiniert mit dem Besuch der restaurierten Ram-Festung.",
    "longDescription": "Ram bietet die schönsten Sonnenuntergänge an der Donau, während der Silbersee Wassersport bietet.",
    "location": "Veliko Gradište"
  }
};

Object.assign(deData, deAdditions);

let fileContent = `/**
 * IDEMO Canonical Serbia Baseline v2 — German (DE) Translations
 * Work Package: WP-09B
 */

export const deCanonicalTranslations: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {\n`;

canonical.forEach(r => {
  const item = deData[r.id];
  if (!item) {
    console.error(`Missing DE item for ID ${r.id}`);
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

fs.writeFileSync('./src/data/translations/serbia/deTranslations.ts', fileContent);
console.log('Successfully updated src/data/translations/serbia/deTranslations.ts with 135 authentic German translations.');
