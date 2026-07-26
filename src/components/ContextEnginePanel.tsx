import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, CloudRain, Snowflake, Cloud, Clock, MapPin, Info, 
  HelpCircle, Sparkles, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Recommendation } from '../types';

interface ContextEnginePanelProps {
  language: string;
  currentWeather: 'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy';
  setCurrentWeather: (weather: 'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy') => void;
  currentDayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  setCurrentDayOfWeek: (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday') => void;
  currentTimeMinutes: number;
  setCurrentTimeMinutes: (minutes: number) => void;
  proximityReference: 'expo' | 'hotel' | 'zemun' | 'none';
  setProximityReference: (ref: 'expo' | 'hotel' | 'zemun' | 'none') => void;
  maxWalkingDistanceKm: number;
  setMaxWalkingDistanceKm: (dist: number) => void;
  showEverything: boolean;
  setShowEverything: (show: boolean) => void;
  totalRecommendationsCount: number;
  filteredCount: number;
  triggerHaptic: (intensity: number) => void;
}

export function ContextEnginePanel({
  language,
  currentWeather,
  setCurrentWeather,
  currentDayOfWeek,
  setCurrentDayOfWeek,
  currentTimeMinutes,
  setCurrentTimeMinutes,
  proximityReference,
  setProximityReference,
  maxWalkingDistanceKm,
  setMaxWalkingDistanceKm,
  showEverything,
  setShowEverything,
  totalRecommendationsCount,
  filteredCount,
  triggerHaptic
}: ContextEnginePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Translations
  const text: Record<string, any> = {
    en: {
      panel_title: "Concierge Context Engine",
      panel_subtitle: "Adaptive Local Intelligence",
      collapsed_summary: "Active Context Profile",
      edit_context: "Tune Context",
      hide_context: "Collapse",
      weather_label: "Current Weather",
      day_label: "Day of Week",
      time_label: "Local Time",
      proximity_label: "Reference Point (Proximity)",
      walking_label: "Walking Radius limit",
      show_everything_title: "Show Everything (Optional)",
      show_everything_desc: "Bypass categories, area, and vibe filters to view all experiences ranked by context suitability.",
      explain_algo_btn: "How the Ranking Algorithm works",
      algo_title: "The Concierge Reordering Formula",
      algo_desc: "Our ranking algorithm runs entirely on-device to protect your privacy. It computes a real-time alignment score for each experience based on several weighted signals:",
      weather_sunny: "Sunny",
      weather_rainy: "Rainy",
      weather_snowy: "Snowy",
      weather_cloudy: "Cloudy",
      day_weekday: "Weekday",
      day_weekend: "Weekend",
      prox_expo: "Near EXPO Site",
      prox_hotel: "Near My Hotel",
      prox_zemun: "Near Zemun Quarter",
      prox_none: "Belgrade-Wide",
      walk_nolimit: "No Walking Limit",
      walk_short: "Short Stroll (< 800m)",
      walk_med: "Walkable (< 1.5 km)",
      walk_long: "Moderate (< 3.0 km)",
      active: "Active",
      inactive: "Bypassed",
      show_everything_active_warning: "Showing all recommendations. Category and area filters are bypassed.",
      sig1_title: "01. Weather Fit",
      sig1_desc: "Outdoor experiences may move higher in suitable weather. When conditions are poor, indoor alternatives become more prominent.",
      sig2_title: "02. Right Time, Right Day",
      sig2_desc: "Some experiences make more sense at a particular hour or on a particular day. IDEMO considers this when deciding what to show first.",
      sig3_title: "03. Distance from Starting Point",
      sig3_desc: "Experiences closer to your selected starting point are generally shown higher, helping you spend less of your available time getting there.",
      sig4_title: "04. Fit Within Your Available Time",
      sig4_desc: "Experiences that fit comfortably within the time you have available move higher. Longer options remain discoverable, but appear further down.",
      rule_label: "RULE NOTE",
      rule_desc: "Nothing is hidden simply because it is farther away or takes longer. These experiences remain available; they are simply ordered lower when they are a weaker fit for your current situation.",
      tech_btn: "TECHNICAL DETAILS",
      algo_how_title: "HOW IDEMO ORDERS YOUR RECOMMENDATIONS",
      algo_how_desc: "IDEMO considers several signals at the same time to decide what may fit you best right now. The order can change with the weather, time of day, your starting point, available time, and the preferences you have set. This matching happens on your device.",
      tech_items: [
        {
          title: "Alignment Formula & Normalization",
          desc: <>Combines traveler category preferences (vibeScore 40%), budget suitability (budgetScore 30%), and available time suitability (timeScore 30%) into a joint score contributing up to <span className="font-mono font-bold text-accent-teal">+200</span> points.</>
        },
        {
          title: "Explicit Visitor Feedback Signals",
          desc: <>Direct ratings scale as primary factors: Positive "Like" (<span className="font-mono font-bold text-accent-teal">+150</span> points), Explored/Intrigued (<span className="font-mono font-bold text-accent-teal">+50</span> points), and Dislike (<span className="font-mono font-bold text-accent-red">-200</span> points penalty, pushing the experience to the absolute bottom of the stream).</>
        },
        {
          title: "On-Device Preference Learning",
          desc: <>Frequency of views/interactions with an individual experience adds up to <span className="font-mono font-bold text-accent-teal">+60</span> points (<span className="font-mono">Math.min(60, clicks * 15)</span>), while implicit category interest adds up to <span className="font-mono font-bold text-accent-teal">+45</span> points (<span className="font-mono">Math.min(45, affinity * 10)</span>).</>
        },
        {
          title: "Mood Orbit Spatial-Semantic Matching",
          desc: <>Maps active visual orbit position onto coordinates <span className="font-mono">[-5, +5]</span>. Computes 60% Spatial Proximity using Euclidean distance (<span className="font-mono">Math.hypot</span>) and 40% Semantic Similarity (matching luxury, energy, and urbanity vectors), awarding up to <span className="font-mono font-bold text-accent-teal">+120</span> points boost.</>
        },
        {
          title: "Contextual Weather Weighting",
          desc: <>
            • Sunny: Outdoor experiences <span className="font-mono font-bold text-accent-teal">+35</span> points; indoor experiences <span className="font-mono font-bold text-accent-red">-5</span> points.<br />
            • Rainy: Outdoor experiences <span className="font-mono font-bold text-accent-red">-50</span> points; indoor experiences <span className="font-mono font-bold text-accent-teal">+45</span> points.<br />
            • Snowy: Kopaonik Winter Resort <span className="font-mono font-bold text-accent-teal">+65</span> points; standard outdoors <span className="font-mono font-bold text-accent-red">-35</span> points; cozy indoor spa/food <span className="font-mono font-bold text-accent-teal">+30</span> points.<br />
            • Cloudy: General balanced boost of <span className="font-mono font-bold text-accent-teal">+15</span> points.
          </>
        },
        {
          title: "Day of the Week Relevance",
          desc: <>
            • Weekend (Friday-Sunday): Nightlife, travel, nature, or long excursions (&gt;4 hours) get <span className="font-mono font-bold text-accent-teal">+30</span> points.<br />
            • Weekdays (Monday-Thursday): History, wellbeing, or short culinary experiences (&le;3 hours) get <span className="font-mono font-bold text-accent-teal">+25</span> points.
          </>
        },
        {
          title: "Dynamic Hour of Day Context",
          desc: <>
            • Sunrise/Morning (5:00 - 10:59): Viewpoints, Tara, or fortresses get <span className="font-mono font-bold text-accent-teal">+25</span> points; Wellbeing gets <span className="font-mono font-bold text-accent-teal">+15</span> points.<br />
            • Midday Heat (11:00 - 15:59): Indoor History/Wellbeing/Medical get <span className="font-mono font-bold text-accent-teal">+20</span> points; Outdoor gets <span className="font-mono font-bold text-accent-red">-15</span> points.<br />
            • Sunset/Twilight (17:00 - 20:59): Sunset views, kayaking, riverfronts, or fortresses get <span className="font-mono font-bold text-accent-teal">+35</span> points.<br />
            • Late-Night (21:00 - 4:59): Clubbing and gastronomy get <span className="font-mono font-bold text-accent-teal">+40</span> points; day-centric outdoors get <span className="font-mono font-bold text-accent-red">-30</span> points.
          </>
        },
        {
          title: "Proximity Math & Walking Boundary Limits",
          desc: <>
            Calculates precise geodesic distance in kilometers using the <span className="font-bold">Haversine formula</span> based on Earth's spherical geometry with radius R = 6,371 km.<br />
            • Proximity Boost: Closer items receive up to <span className="font-mono font-bold text-accent-teal">+50</span> points, calculated as <span className="font-mono">Math.max(0, 50 - km * 2)</span>.<br />
            • Walking Limit: Items within walking radius get <span className="font-mono font-bold text-accent-teal">+30</span> points. Items exceeding the limit are penalized with <span className="font-mono font-bold text-accent-red">-150</span> points to keep them discoverable at the bottom.
          </>
        },
        {
          title: "Time Available Packing",
          desc: <>If total duration (experience + transit) fits comfortably inside available time: normalized score scales from <span className="font-mono">0.8</span> to <span className="font-mono">1.0</span>. If duration exceeds available hours: score decays rapidly towards <span className="font-mono">0.0</span> based on the overflow.</>
        },
        {
          title: "Show Everything Mode Bypass",
          desc: <>Enabling "Show Everything" completely bypasses category, area, and vibe filters. All experiences remain visible in the active list, sorted solely by their context alignment score.</>
        }
      ]
    },
    sr: {
      panel_title: "Sistem kontekstualne inteligencije",
      panel_subtitle: "Prilagodljiva lokalna inteligencija",
      collapsed_summary: "Aktivni profil konteksta",
      edit_context: "Podesi kontekst",
      hide_context: "Zatvori",
      weather_label: "Trenutno vreme",
      day_label: "Dan u nedelji",
      time_label: "Lokalno vreme",
      proximity_label: "Referentna tačka (Blizina)",
      walking_label: "Maksimalna pešačka distanca",
      show_everything_title: "Prikaži sve (Opciono)",
      show_everything_desc: "Premosti filtere kategorija, oblasti i senzibiliteta da vidiš sva iskustva poređana po usklađenosti.",
      explain_algo_btn: "Kako algoritam rangiranja funkcioniše",
      algo_title: "Formula za ređanje preporuka",
      algo_desc: "Naš algoritam se izvršava isključivo lokalno na tvom uređaju radi zaštite privatnosti. On računa usklađenost u realnom vremenu na osnovu sledećih signala:",
      weather_sunny: "Sunčano",
      weather_rainy: "Kišovito",
      weather_snowy: "Sneg",
      weather_cloudy: "Oblačno",
      day_weekday: "Radni dan",
      day_weekend: "Vikend",
      prox_expo: "Blizu EXPO sajta",
      prox_hotel: "Blizu mog hotela",
      prox_zemun: "Blizu Zemuna",
      prox_none: "Širom Beograda",
      walk_nolimit: "Bez limita hoda",
      walk_short: "Kratka šetnja (< 800m)",
      walk_med: "Prohodno (< 1.5 km)",
      walk_long: "Umereno (< 3.0 km)",
      active: "Aktivno",
      inactive: "Premošćeno",
      show_everything_active_warning: "Prikazuju se sve preporuke. Filteri kategorija i oblasti su privremeno premošćeni.",
      sig1_title: "01. Vremenski uslovi",
      sig1_desc: "Iskustva na otvorenom mogu se pomeriti naviše pri povoljnim vremenskim uslovima. Kada su uslovi loši, unutrašnje alternative postaju istaknutije.",
      sig2_title: "02. Pravo vreme, pravi dan",
      sig2_desc: "Neka iskustva imaju više smisla u određeno vreme ili određenog dana. IDEMO to uzima u obzir kada odlučuje šta da prikaže prvo.",
      sig3_title: "03. Udaljenost od polazne tačke",
      sig3_desc: "Iskustva koja su bliža vašoj izabranoj polaznoj tački se uglavnom prikazuju više, pomažući vam da potrošite manje vremena na put.",
      sig4_title: "04. Usklađenost sa slobodnim vremenom",
      sig4_desc: "Iskustva koja se udobno uklapaju u vreme koje imate na raspolaganju pomeraju se naviše. Duže opcije ostaju dostupne za otkrivanje, ali se pojavljuju niže na listi.",
      rule_label: "PRAVILO",
      rule_desc: "Ništa nije skriveno samo zato što je dalje ili zahteva više vremena. Ta iskustva ostaju dostupna; ona su jednostavno pozicionirana niže kada slabije odgovaraju vašoj trenutnoj situaciji.",
      tech_btn: "TEHNIČKI DETALJI",
      algo_how_title: "KAKO IDEMO SORTIRA VAŠE PREPORUKE",
      algo_how_desc: "IDEMO istovremeno uzima u obzir nekoliko signala kako bi odlučio šta vam trenutno najbolje odgovara. Redosled se može menjati u zavisnosti od vremena, doba dana, vaše polazne tačke, slobodnog vremena i podešenih preferencija. Ovo usklađivanje se odvija na vašem uređaju.",
      tech_items: [
        {
          title: "Formula poravnanja i normalizacija",
          desc: <>Kombinuje preferencije za kategorije (vibeScore 40%), usklađenost budžeta (budgetScore 30%) i usklađenost vremena (timeScore 30%) u zajednički rezultat koji doprinosi sa do <span className="font-mono font-bold text-accent-teal">+200</span> poena.</>
        },
        {
          title: "Eksplicitne ocene posetioca",
          desc: <>Direktni izbori posetioca se ugrađuju kao primarni faktor: Sviđa mi se (<span className="font-mono font-bold text-accent-teal">+150</span> poena), Intriga (<span className="font-mono font-bold text-accent-teal">+50</span> poena) i Ne sviđa mi se (<span className="font-mono font-bold text-accent-red">-200</span> poena kazne koja pomera preporuku na dno liste).</>
        },
        {
          title: "Lokalno učenje i implicitni afinitet",
          desc: <>Učestalost pregleda pojedinačnog iskustva na uređaju dodaje do <span className="font-mono font-bold text-accent-teal">+60</span> poena (<span className="font-mono">Math.min(60, klikovi * 15)</span>), dok implicitni afinitet prema kategoriji dodaje do <span className="font-mono font-bold text-accent-teal">+45</span> poena (<span className="font-mono">Math.min(45, afinitet * 10)</span>).</>
        },
        {
          title: "Prostorno-semantičko usklađivanje Mood Orb-a",
          desc: <>Preslikava 2D vizuelnu poziciju orbite na koordinatni prostor <span className="font-mono">[-5, +5]</span>. Računa 60% prostorne blizine koristeći Euklidsko rastojanje (<span className="font-mono">Math.hypot</span>) i 40% semantičke sličnosti (luksuz, energija i urbana sredina), nagrađujući poklapanje sa do <span className="font-mono font-bold text-accent-teal">+120</span> poena.</>
        },
        {
          title: "Kontekstualno usklađivanje vremenskih uslova",
          desc: <>
            • Sunčano: Aktivnosti na otvorenom <span className="font-mono font-bold text-accent-teal">+35</span> poena; unutrašnje aktivnosti <span className="font-mono font-bold text-accent-red">-5</span> poena.<br />
            • Kišovito: Aktivnosti na otvorenom <span className="font-mono font-bold text-accent-red">-50</span> poena; unutrašnje aktivnosti <span className="font-mono font-bold text-accent-teal">+45</span> poena.<br />
            • Sneg: Ski centar Kopaonik <span className="font-mono font-bold text-accent-teal">+65</span> poena; standardne aktivnosti na otvorenom <span className="font-mono font-bold text-accent-red">-35</span> poena; unutrašnji spa/gastronomija <span className="font-mono font-bold text-accent-teal">+30</span> poena.<br />
            • Oblačno: Opšti uravnoteženi podsticaj od <span className="font-mono font-bold text-accent-teal">+15</span> poena.
          </>
        },
        {
          title: "Relevancija dana u nedelji",
          desc: <>
            • Vikend (petak-nedelja): Klubovi, putovanja, priroda ili duže aktivnosti (&gt;4 sata) dobijaju <span className="font-mono font-bold text-accent-teal">+30</span> poena.<br />
            • Radni dan (ponedeljak-četvrtak): Istorija, wellness ili kraća gastronomija (&le;3 sata) dobijaju <span className="font-mono font-bold text-accent-teal">+25</span> poena.
          </>
        },
        {
          title: "Dinamičko usklađivanje sata u danu",
          desc: <>
            • Jutro (5:00 - 10:59): Vidikovci, Tara ili tvrđave dobijaju <span className="font-mono font-bold text-accent-teal">+25</span> poena; wellness <span className="font-mono font-bold text-accent-teal">+15</span> poena.<br />
            • Dnevna vrućina (11:00 - 15:59): Zatvoreni istorijski lokaliteti, wellness ili medicinske usluge dobijaju <span className="font-mono font-bold text-accent-teal">+20</span> poena; aktivnosti na otvorenom <span className="font-mono font-bold text-accent-red">-15</span> poena.<br />
            • Suton/Veče (17:00 - 20:59): Zalazak sunca, kajak, priobalje ili tvrđave dobijaju <span className="font-mono font-bold text-accent-teal">+35</span> poena.<br />
            • Kasna noć (21:00 - 4:59): Klubovi i gastronomija dobijaju <span className="font-mono font-bold text-accent-teal">+40</span> poena; dnevne aktivnosti na otvorenom <span className="font-mono font-bold text-accent-red">-30</span> poena.
          </>
        },
        {
          title: "Proračun blizine i pešačkog limita",
          desc: <>
            Računa precizno rastojanje u kilometrima koristeći Haversine formulu na osnovu sferne geometrije Zemlje sa poluprečnikom R = 6.371 km.<br />
            • Blizina: Bliže lokacije dobijaju povećanje do <span className="font-mono font-bold text-accent-teal">+50</span> poena, računato kao <span className="font-mono">Math.max(0, 50 - km * 2)</span>.<br />
            • Pešački limit: Lokacije unutar limita dobijaju <span className="font-mono font-bold text-accent-teal">+30</span> poena. One koje premašuju limit dobijaju kaznu od <span className="font-mono font-bold text-accent-red">-150</span> poena kako bi se pozicionirale na dno liste bez potpunog uklanjanja.
          </>
        },
        {
          title: "Usklađenost i pakovanje vremena",
          desc: <>Ako ukupno vreme (aktivnost + put) staje u slobodno vreme posetioca: dobija ocenu od <span className="font-mono">0.8</span> do <span className="font-mono">1.0</span> na osnovu popunjenosti. Ako premašuje slobodno vreme, ocena ubrzano opada prema <span className="font-mono">0.0</span> na osnovu viška sati.</>
        },
        {
          title: "Režim \"Prikaži sve\" (Show Everything)",
          desc: <>Aktiviranjem ove opcije premošćavaju se svi filteri kategorija, oblasti i senzibiliteta. Sve preporuke ostaju na listi i sortiraju se isključivo na osnovu njihovih realnih kontekstualnih ocena poravnanja.</>
        }
      ]
    },
    de: {
      panel_title: "Concierge-Kontext-Engine",
      panel_subtitle: "Adaptive lokale Intelligenz",
      collapsed_summary: "Aktives Kontextprofil",
      edit_context: "Kontext anpassen",
      hide_context: "Schließen",
      weather_label: "Aktuelles Wetter",
      day_label: "Wochentag",
      time_label: "Lokale Uhrzeit",
      proximity_label: "Referenzpunkt (Nähe)",
      walking_label: "Maximaler Gehbereich",
      show_everything_title: "Alles anzeigen (Optional)",
      show_everything_desc: "Kategorie-, Bereichs- und Vibe-Filter umgehen, um alle nach Kontexttauglichkeit sortierten Erlebnisse zu sehen.",
      explain_algo_btn: "Funktionsweise des Ranking-Algorithmus",
      algo_title: "Die Concierge-Sortierformel",
      algo_desc: "Unser Ranking-Algorithmus läuft vollständig lokal auf Ihrem Gerät, um Ihre Privatsphäre zu schützen. Er berechnet für jedes Erlebnis eine Echtzeit-Anpassungsbewertung basierend auf mehreren gewichteten Signalen:",
      weather_sunny: "Sonnig",
      weather_rainy: "Regnerisch",
      weather_snowy: "Schneereich",
      weather_cloudy: "Bewölkt",
      day_weekday: "Wochentag",
      day_weekend: "Wochenende",
      prox_expo: "Nahe EXPO-Gelände",
      prox_hotel: "Nahe meinem Hotel",
      prox_zemun: "Nahe Zemun-Viertel",
      prox_none: "Ganz Belgrad",
      walk_nolimit: "Kein Gehlimit",
      walk_short: "Kurzer Spaziergang (< 800m)",
      walk_med: "Fußläufig (< 1,5 km)",
      walk_long: "Moderat (< 3,0 km)",
      active: "Aktiv",
      inactive: "Umgangen",
      show_everything_active_warning: "Es werden alle Empfehlungen angezeigt. Kategorie- und Bereichsfilter sind umgangen.",
      sig1_title: "01. Wettertauglichkeit",
      sig1_desc: "Outdoor-Erlebnisse können bei geeignetem Wetter höher eingestuft werden. Bei schlechtem Wetter rücken Indoor-Alternativen in den Vordergrund.",
      sig2_title: "02. Richtige Zeit, richtiger Tag",
      sig2_desc: "Einige Erlebnisse sind zu einer bestimmten Stunde oder an einem bestimmten Tag sinnvoller. IDEMO berücksichtigt dies bei der Entscheidung, was zuerst angezeigt wird.",
      sig3_title: "03. Entfernung vom Ausgangspunkt",
      sig3_desc: "Erlebnisse, die näher an Ihrem gewählten Ausgangspunkt liegen, werden im Allgemeinen weiter oben angezeigt, sodass Sie weniger Zeit für die Anreise aufwenden müssen.",
      sig4_title: "04. Passend zu Ihrer Zeit",
      sig4_desc: "Erlebnisse, die bequem in Ihre verfügbare Zeit passen, rücken nach oben. Längere Optionen bleiben auffindbar, erscheinen aber weiter unten.",
      rule_label: "REGELHINWEIS",
      rule_desc: "Nichts wird ausgeblendet, nur weil es weiter entfernt ist oder länger dauert. Diese Erlebnisse bleiben verfügbar; sie werden lediglich niedriger eingestuft, wenn sie weniger zu Ihrer aktuellen Situation passen.",
      tech_btn: "TECHNISCHE DETAILS",
      algo_how_title: "WIE IDEMO IHRE EMPFEHLUNGEN SORTIERT",
      algo_how_desc: "IDEMO berücksichtigt mehrere Signale gleichzeitig, um zu entscheiden, was aktuell am besten zu Ihnen passt. Die Sortierung kann sich mit dem Wetter, der Tageszeit, Ihrem Ausgangspunkt, der verfügbaren Zeit und den von Ihnen festgelegten Präferenzen ändern. Dieser Abgleich erfolgt lokal auf Ihrem Gerät.",
      tech_items: [
        {
          title: "Abgleichsformel & Normalisierung",
          desc: <>Kombiniert Kategoriepräferenzen (vibeScore 40 %), Budgeteignung (budgetScore 30 %) und zeitliche Eignung (timeScore 30 %) zu einer Gesamtbewertung von bis zu <span className="font-mono font-bold text-accent-teal">+200</span> Punkten.</>
        },
        {
          title: "Explizite Feedback-Signale des Besuchers",
          desc: <>Direkte Bewertungen fließen als Primärfaktoren ein: Positives „Gefällt mir“ (<span className="font-mono font-bold text-accent-teal">+150</span> Punkte), Erkundet/Interessiert (<span className="font-mono font-bold text-accent-teal">+50</span> Punkte) und „Gefällt mir nicht“ (<span className="font-mono font-bold text-accent-red">-200</span> Punkte Strafe, was das Erlebnis an das absolute Ende der Liste verschiebt).</>
        },
        {
          title: "Präferenzlernen auf dem Gerät",
          desc: <>Die Häufigkeit der Aufrufe/Interaktionen mit einem einzelnen Erlebnis addiert bis zu <span className="font-mono font-bold text-accent-teal">+60</span> Punkte (<span className="font-mono">Math.min(60, Klicks * 15)</span>), während das implizite Kategorieinteresse bis zu <span className="font-mono font-bold text-accent-teal">+45</span> Punkte hinzufügt (<span className="font-mono">Math.min(45, Affinität * 10)</span>).</>
        },
        {
          title: "Räumlich-semantischer Mood-Orbit-Abgleich",
          desc: <>Bildet die visuelle Orbit-Position auf die Koordinaten <span className="font-mono">[-5, +5]</span> ab. Berechnet zu 60 % die räumliche Nähe mittels euklidischer Distanz (<span className="font-mono">Math.hypot</span>) und zu 40 % die semantische Ähnlichkeit (Abgleich von Luxus-, Energie- und Urbanitätsvektoren) und vergibt einen Bonus von bis zu <span className="font-mono font-bold text-accent-teal">+120</span> Punkten.</>
        },
        {
          title: "Kontextuelle Wettergewichtung",
          desc: <>
            • Sonnig: Outdoor-Erlebnisse <span className="font-mono font-bold text-accent-teal">+35</span> Punkte; Indoor-Erlebnisse <span className="font-mono font-bold text-accent-red">-5</span> Punkte.<br />
            • Regnerisch: Outdoor-Erlebnisse <span className="font-mono font-bold text-accent-red">-50</span> Punkte; Indoor-Erlebnisse <span className="font-mono font-bold text-accent-teal">+45</span> Punkte.<br />
            • Verschneit: Kopaonik Winter-Resort <span className="font-mono font-bold text-accent-teal">+65</span> Punkte; normale Outdoor-Aktivitäten <span className="font-mono font-bold text-accent-red">-35</span> Punkte; gemütliche Spas/Gastronomie <span className="font-mono font-bold text-accent-teal">+30</span> Punkte.<br />
            • Bewölkt: Allgemeiner ausgewogener Bonus von <span className="font-mono font-bold text-accent-teal">+15</span> Punkten.
          </>
        },
        {
          title: "Relevanz des Wochentags",
          desc: <>
            • Wochenende (Freitag–Sonntag): Nachtleben, Reisen, Natur oder lange Ausflüge (&gt;4 Stunden) erhalten <span className="font-mono font-bold text-accent-teal">+30</span> Punkte.<br />
            • Wochentage (Montag–Donnerstag): Geschichte, Wellness oder kurze kulinarische Erlebnisse (&le;3 Stunden) erhalten <span className="font-mono font-bold text-accent-teal">+25</span> Punkte.
          </>
        },
        {
          title: "Dynamischer Tageszeitkontext",
          desc: <>
            • Sonnenaufgang/Morgen (5:00 - 10:59): Aussichtspunkte, Tara oder Festungen erhalten <span className="font-mono font-bold text-accent-teal">+25</span> Punkte; Wellness erhält <span className="font-mono font-bold text-accent-teal">+15</span> Punkte.<br />
            • Mittagshitze (11:00 - 15:59): Indoor-Geschichte/Wellness/Medizin erhalten <span className="font-mono font-bold text-accent-teal">+20</span> Punkte; Outdoor-Aktivitäten erhalten <span className="font-mono font-bold text-accent-red">-15</span> Punkte.<br />
            • Sonnenuntergang/Dämmerung (17:00 - 20:59): Aussichtspunkte bei Sonnenuntergang, Kajakfahren, Flussufer oder Festungen erhalten <span className="font-mono font-bold text-accent-teal">+35</span> Punkte.<br />
            • Spätnacht (21:00 - 4:59): Clubbing und Gastronomie erhalten <span className="font-mono font-bold text-accent-teal">+40</span> Punkte; tagesorientierte Outdoor-Aktivitäten erhalten <span className="font-mono font-bold text-accent-red">-30</span> Punkte.
          </>
        },
        {
          title: "Näherungsberechnung & Gehgrenzen",
          desc: <>
            Berechnet die präzise geodätische Entfernung in Kilometern mithilfe der Haversine-Formel basierend auf der Kugelgeometrie der Erde mit Radius R = 6.371 km.<br />
            • Nähe-Bonus: Nähere Orte erhalten bis zu <span className="font-mono font-bold text-accent-teal">+50</span> Punkte, berechnet als <span className="font-mono">Math.max(0, 50 - km * 2)</span>.<br />
            • Gehbereich-Limit: Orte innerhalb des Gehbereichs erhalten <span className="font-mono font-bold text-accent-teal">+30</span> Punkte. Orte außerhalb werden mit <span className="font-mono font-bold text-accent-red">-150</span> Punkten belegt, damit sie auffindbar am Ende der Liste bleiben.
          </>
        },
        {
          title: "Optimierung der verfügbaren Zeit",
          desc: <>Passt die Gesamtdauer (Erlebnis + Transfer) bequem in die verfügbare Zeit: Die normalisierte Bewertung skaliert von <span className="font-mono">0,8</span> bis <span className="font-mono">1,0</span>. Überschreitet die Dauer die verfügbare Zeit: Die Bewertung sinkt schnell in Richtung <span className="font-mono">0,0</span>, basierend auf der Zeitüberschreitung.</>
        },
        {
          title: "„Alles anzeigen“-Modus-Bypass",
          desc: <>Durch das Aktivieren von „Alles anzeigen“ werden Kategorie-, Bereichs- und Vibe-Filter vollständig umgangen. Alle Erlebnisse bleiben in der aktiven Liste sichtbar, ausschließlich sortiert nach ihrer Kontextanpassung.</>
        }
      ]
    },
    ru: {
      panel_title: "Контекстный процессор консьержа",
      panel_subtitle: "Адаптивный локальный интеллект",
      collapsed_summary: "Активный профиль контекста",
      edit_context: "Настроить контекст",
      hide_context: "Свернуть",
      weather_label: "Текущая погода",
      day_label: "День недели",
      time_label: "Местное время",
      proximity_label: "Ориентир (Близость)",
      walking_label: "Лимит пешего радиуса",
      show_everything_title: "Показать всё (Опционально)",
      show_everything_desc: "Обход фильтров категорий, районов и атмосферы для просмотра всех мест, ранжированных по соответствию контексту.",
      explain_algo_btn: "Как работает алгоритм ранжирования",
      algo_title: "Формула сортировки консьержа",
      algo_desc: "Наш алгоритм ранжирования работает полностью локально на вашем устройстве для защиты вашей конфиденциальности. Он вычисляет оценку соответствия каждого места в реальном времени на основе нескольких взвешенных сигналов:",
      weather_sunny: "Солнечно",
      weather_rainy: "Дождливо",
      weather_snowy: "Снежно",
      weather_cloudy: "Облачно",
      day_weekday: "Будний день",
      day_weekend: "Выходной",
      prox_expo: "Рядом с EXPO",
      prox_hotel: "Рядом с моим отелем",
      prox_zemun: "Рядом с кварталом Земун",
      prox_none: "Весь Белград",
      walk_nolimit: "Без ограничений",
      walk_short: "Короткая прогулка (< 800м)",
      walk_med: "Пешком (< 1.5 км)",
      walk_long: "Умеренно (< 3.0 км)",
      active: "Активно",
      inactive: "В обход",
      show_everything_active_warning: "Отображаются все рекомендации. Фильтры категорий и районов временно отключены.",
      sig1_title: "01. Соответствие погоде",
      sig1_desc: "Активности на открытом воздухе поднимаются выше при подходящей погоде. При неблагоприятных условиях более заметными становятся варианты в помещении.",
      sig2_title: "02. В нужное время и день",
      sig2_desc: "Некоторые активности более уместны в определенный час или день. IDEMO учитывает это при принятии решения о том, что показывать в первую очередь.",
      sig3_title: "03. Расстояние от точки старта",
      sig3_desc: "Рекомендации, расположенные ближе к выбранной вами отправной точке, обычно отображаются выше, помогая вам тратить меньше времени на дорогу.",
      sig4_title: "04. В рамках доступного времени",
      sig4_desc: "Активности, которые легко укладываются в имеющееся у вас время, поднимаются выше. Более длительные варианты остаются доступными, но отображаются ниже.",
      rule_label: "ПРАВИЛО",
      rule_desc: "Ничто не скрывается только потому, что оно находится дальше или требует больше времени. Эти активности остаются доступными; они просто располагаются ниже, если хуже подходят вашей текущей ситуации.",
      tech_btn: "ТЕХНИЧЕСКИЕ ПОДРОБНОСТИ",
      algo_how_title: "КАК IDEMO СОРТИРУЕТ ВАШИ РЕКОМЕНДАЦИИ",
      algo_how_desc: "IDEMO учитывает несколько сигналов одновременно, чтобы решить, что лучше всего подходит вам прямо сейчас. Порядок может меняться в зависимости от погоды, времени суток, вашей отправной точки, доступного времени и заданных вами предпочтений. Это сопоставление происходит на вашем устройстве.",
      tech_items: [
        {
          title: "Формула соответствия и нормализация",
          desc: <>Объединяет предпочтения категорий путешественника (vibeScore 40%), соответствие бюджета (budgetScore 30%) и временное соответствие (timeScore 30%) в общую оценку, дающую до <span className="font-mono font-bold text-accent-teal">+200</span> баллов.</>
        },
        {
          title: "Прямые сигналы обратной связи",
          desc: <>Прямые оценки учитываются как основные факторы: «Нравится» (<span className="font-mono font-bold text-accent-teal">+150</span> баллов), «Интересно» (<span className="font-mono font-bold text-accent-teal">+50</span> баллов) и «Не нравится» (штраф в размере <span className="font-mono font-bold text-accent-red">-200</span> баллов, опускающий рекомендацию в самый низ списка).</>
        },
        {
          title: "Обучение предпочтениям на устройстве",
          desc: <>Частота просмотров/взаимодействий с отдельной рекомендацией добавляет до <span className="font-mono font-bold text-accent-teal">+60</span> баллов (<span className="font-mono">Math.min(60, клики * 15)</span>), а неявный интерес к категории добавляет до <span className="font-mono font-bold text-accent-teal">+45</span> баллов (<span className="font-mono">Math.min(45, соответствие * 10)</span>).</>
        },
        {
          title: "Пространственно-семантическое соответствие Mood Orbit",
          desc: <>Отображает активное положение на орбите настроения на координаты <span className="font-mono">[-5, +5]</span>. Вычисляет 60% пространственной близости с использованием евклидова расстояния (<span className="font-mono">Math.hypot</span>) и 40% семантического сходства (сопоставление векторов роскоши, энергии и урбанизации), добавляя до <span className="font-mono font-bold text-accent-teal">+120</span> баллов.</>
        },
        {
          title: "Контекстное взвешивание погоды",
          desc: <>
            • Солнечно: Активности на открытом воздухе <span className="font-mono font-bold text-accent-teal">+35</span> баллов; в помещении <span className="font-mono font-bold text-accent-red">-5</span> баллов.<br />
            • Дождливо: Активности на открытом воздухе <span className="font-mono font-bold text-accent-red">-50</span> баллов; в помещении <span className="font-mono font-bold text-accent-teal">+45</span> баллов.<br />
            • Снежно: Курорт Копаоник <span className="font-mono font-bold text-accent-teal">+65</span> баллов; стандартный отдых на открытом воздухе <span className="font-mono font-bold text-accent-red">-35</span> баллов; уютный спа/рестораны <span className="font-mono font-bold text-accent-teal">+30</span> баллов.<br />
            • Облачно: Общий сбалансированный буст <span className="font-mono font-bold text-accent-teal">+15</span> баллов.
          </>
        },
        {
          title: "Зависимость от дня недели",
          desc: <>
            • Выходные (пятница-воскресенье): Ночная жизнь, путешествия, природа или длительные поездки (&gt;4 часов) получают <span className="font-mono font-bold text-accent-teal">+30</span> баллов.<br />
            • Будни (понедельник-четверг): История, велнес или короткие кулинарные мероприятия (&le;3 часов) получают <span className="font-mono font-bold text-accent-teal">+25</span> баллов.
          </>
        },
        {
          title: "Динамический контекст времени суток",
          desc: <>
            • Утро (5:00 - 10:59): Смотровые площадки, Тара или крепости получают <span className="font-mono font-bold text-accent-teal">+25</span> баллов; велнес получает <span className="font-mono font-bold text-accent-teal">+15</span> баллов.<br />
            • Полуденная жара (11:00 - 15:59): Исторические локации/велнес/медицина в помещении получают <span className="font-mono font-bold text-accent-teal">+20</span> баллов; активности на открытом воздухе получают <span className="font-mono font-bold text-accent-red">-15</span> баллов.<br />
            • Закат/Сумерки (17:00 - 20:59): Смотровые площадки на закате, каякинг, набережные или крепости получают <span className="font-mono font-bold text-accent-teal">+35</span> баллов.<br />
            • Поздняя ночь (21:00 - 4:59): Клубы и гастрономия получают <span className="font-mono font-bold text-accent-teal">+40</span> баллов; дневной отдых на открытом воздухе получает <span className="font-mono font-bold text-accent-red">-30</span> баллов.
          </>
        },
        {
          title: "Геолокация и лимиты пеших прогулок",
          desc: <>
            Рассчитывает точное геодезическое расстояние в километрах с использованием формулы гаверсинусов на основе сферической геометрии Земли с радиусом R = 6371 км.<br />
            • Буст близости: Более близкие локации получают до <span className="font-mono font-bold text-accent-teal">+50</span> баллов, рассчитываемых как <span className="font-mono">Math.max(0, 50 - km * 2)</span>.<br />
            • Ограничение пешком: Локации в пределах пешего радиуса получают <span className="font-mono font-bold text-accent-teal">+30</span> баллов. Превышающие лимит штрафуются на <span className="font-mono font-bold text-accent-red">-150</span> баллов, чтобы оставаться внизу списка без удаления.
          </>
        },
        {
          title: "Распределение доступного времени",
          desc: <>Если общая продолжительность (рекомендация + дорога) укладывается в доступное время: нормированная оценка масштабируется от <span className="font-mono">0.8</span> до <span className="font-mono">1.0</span>. Если продолжительность превышает доступные часы: оценка быстро снижается к <span className="font-mono">0.0</span> в зависимости от перерасхода времени.</>
        },
        {
          title: "Обход фильтров в режиме «Показать всё»",
          desc: <>Включение режима «Показать всё» полностью обходит фильтры категорий, районов и атмосферы. Все рекомендации остаются в активном списке, отсортированными исключительно по оценке соответствия контексту.</>
        }
      ]
    },
    es: {
      panel_title: "Motor de contexto del conserje",
      panel_subtitle: "Inteligencia local adaptativa",
      collapsed_summary: "Perfil de contexto activo",
      edit_context: "Ajustar contexto",
      hide_context: "Contraer",
      weather_label: "Clima actual",
      day_label: "Día de la semana",
      time_label: "Hora local",
      proximity_label: "Punto de referencia (Proximidad)",
      walking_label: "Límite de radio peatonal",
      show_everything_title: "Mostrar todo (Opcional)",
      show_everything_desc: "Omitir filtros de categoría, área y vibra para ver todas las experiencias clasificadas por su idoneidad contextual.",
      explain_algo_btn: "Cómo funciona el algoritmo de clasificación",
      algo_title: "La fórmula de reordenación del conserje",
      algo_desc: "Nuestro algoritmo de clasificación se ejecuta completamente en su dispositivo para proteger su privacidad. Calcula una puntuación de alineación en tiempo real para cada experiencia basada en varias señales ponderadas:",
      weather_sunny: "Soleado",
      weather_rainy: "Lluvioso",
      weather_snowy: "Nevado",
      weather_cloudy: "Nublado",
      day_weekday: "Día laborable",
      day_weekend: "Fin de semana",
      prox_expo: "Cerca del recinto EXPO",
      prox_hotel: "Cerca de mi hotel",
      prox_zemun: "Cerca del barrio de Zemun",
      prox_none: "Todo Belgrado",
      walk_nolimit: "Sin límite peatonal",
      walk_short: "Paseo corto (< 800m)",
      walk_med: "A pie (< 1.5 km)",
      walk_long: "Moderado (< 3.0 km)",
      active: "Activo",
      inactive: "Omitido",
      show_everything_active_warning: "Mostrando todas las recomendaciones. Los filtros de categoría y área están omitidos.",
      sig1_title: "01. Ajuste climático",
      sig1_desc: "Las experiencias al aire libre pueden subir en la lista con clima adecuado. Cuando las condiciones son malas, las alternativas bajo techo cobran más importancia.",
      sig2_title: "02. Momento y día adecuados",
      sig2_desc: "Algunas experiencias tienen más sentido a una hora o en un día en particular. IDEMO tiene esto en cuenta al decidir qué mostrar primero.",
      sig3_title: "03. Distancia desde el punto de inicio",
      sig3_desc: "Las experiencias más cercanas al punto de partida seleccionado generalmente se muestran más arriba, ayudándole a gastar menos tiempo de viaje.",
      sig4_title: "04. Ajuste al tiempo disponible",
      sig4_desc: "Las experiencias que se ajustan cómodamente a su tiempo disponible se muestran más arriba. Las opciones más largas siguen siendo descubribles, pero aparecen más abajo.",
      rule_label: "REGLA",
      rule_desc: "Nada se oculta simplemente porque esté más lejos o tome más tiempo. Estas experiencias siguen estando disponibles; simplemente se clasifican más abajo cuando se ajustan menos a su situación actual.",
      tech_btn: "DETALLES TÉCNICOS",
      algo_how_title: "CÓMO ORDENA IDEMO SUS RECOMENDACIONES",
      algo_how_desc: "IDEMO considera varias señales al mismo tiempo para decidir qué se adapta mejor a usted en este momento. El orden puede cambiar con el clima, la hora del día, su punto de partida, el tiempo disponible y las preferencias que haya establecido. Esta coincidencia ocurre en su dispositivo.",
      tech_items: [
        {
          title: "Fórmula de alineación y normalización",
          desc: <>Combina las preferencias de categoría del viajero (vibeScore 40%), la idoneidad del presupuesto (budgetScore 30%) y la idoneidad del tiempo disponible (timeScore 30%) en una puntuación conjunta que aporta hasta <span className="font-mono font-bold text-accent-teal">+200</span> puntos.</>
        },
        {
          title: "Señales de opinión explícitas del visitante",
          desc: <>Las calificaciones directas escalan como factores primarios: "Me gusta" positivo (<span className="font-mono font-bold text-accent-teal">+150</span> puntos), Interesado (<span className="font-mono font-bold text-accent-teal">+50</span> puntos) y "No me gusta" (penalización de <span className="font-mono font-bold text-accent-red">-200</span> puntos, empujando la experiencia al final absoluto de la lista).</>
        },
        {
          title: "Aprendizaje de preferencias en el dispositivo",
          desc: <>La frecuencia de vistas/interacciones con una experiencia individual suma hasta <span className="font-mono font-bold text-accent-teal">+60</span> puntos (<span className="font-mono">Math.min(60, clics * 15)</span>), mientras que el interés implícito por la categoría suma hasta <span className="font-mono font-bold text-accent-teal">+45</span> puntos (<span className="font-mono">Math.min(45, afinidad * 10)</span>).</>
        },
        {
          title: "Coincidencia espacial-semántica de la órbita de humor",
          desc: <>Mapea la posición visual activa de la órbita en las coordenadas <span className="font-mono">[-5, +5]</span>. Calcula el 60% de proximidad espacial usando la distancia euclidiana (<span className="font-mono">Math.hypot</span>) and el 40% de similitud semántica (coincidencia de vectores de lujo, energía y urbanidad), otorgando una bonificación de hasta <span className="font-mono font-bold text-accent-teal">+120</span> puntos.</>
        },
        {
          title: "Ponderación meteorológica contextual",
          desc: <>
            • Soleado: Experiencias al aire libre <span className="font-mono font-bold text-accent-teal">+35</span> puntos; experiencias en interiores <span className="font-mono font-bold text-accent-red">-5</span> puntos.<br />
            • Lluvioso: Experiencias al aire libre <span className="font-mono font-bold text-accent-red">-50</span> puntos; experiencias en interiores acogedoras <span className="font-mono font-bold text-accent-teal">+45</span> puntos.<br />
            • Nevado: Resort de invierno Kopaonik <span className="font-mono font-bold text-accent-teal">+65</span> puntos; al aire libre estándar <span className="font-mono font-bold text-accent-red">-35</span> puntos; spa/gastronomía acogedora <span className="font-mono font-bold text-accent-teal">+30</span> puntos.<br />
            • Nublado: Impulso general equilibrado de <span className="font-mono font-bold text-accent-teal">+15</span> puntos.
          </>
        },
        {
          title: "Relevancia del día de la semana",
          desc: <>
            • Fin de semana (viernes-domingo): Vida nocturna, viajes, naturaleza o excursiones largas (&gt;4 horas) reciben <span className="font-mono font-bold text-accent-teal">+30</span> puntos.<br />
            • Días laborables (lunes-jueves): Historia, bienestar o experiencias gastronómicas cortas (&le;3 horas) reciben <span className="font-mono font-bold text-accent-teal">+25</span> puntos.
          </>
        },
        {
          title: "Contexto dinámico de la hora del día",
          desc: <>
            • Amanecer/Mañana (5:00 - 10:59): Miradores, Tara o fortalezas reciben <span className="font-mono font-bold text-accent-teal">+25</span> puntos; Bienestar recibe <span className="font-mono font-bold text-accent-teal">+15</span> puntos.<br />
            • Calor del mediodía (11:00 - 15:59): Historia/Bienestar/Centros médicos en interiores reciben <span className="font-mono font-bold text-accent-teal">+20</span> puntos; actividades al aire libre reciben <span className="font-mono font-bold text-accent-red">-15</span> puntos.<br />
            • Atardecer/Crepúsculo (17:00 - 20:59): Vistas al atardecer, kayak, riberas o fortalezas reciben <span className="font-mono font-bold text-accent-teal">+35</span> puntos.<br />
            • Tarde en la noche (21:00 - 4:59): Clubbing y gastronomía reciben <span className="font-mono font-bold text-accent-teal">+40</span> puntos; actividades al aire libre orientadas al día reciben <span className="font-mono font-bold text-accent-red">-30</span> puntos.
          </>
        },
        {
          title: "Cálculo de proximidad y límites peatonales",
          desc: <>
            Calcula la distancia geodésica precisa en kilómetros utilizando la fórmula de Haversine basada en la geometría esférica de la Tierra con radio R = 6,371 km.<br />
            • Impulso de proximidad: Los artículos más cercanos reciben hasta <span className="font-mono font-bold text-accent-teal">+50</span> puntos, calculados como <span className="font-mono">Math.max(0, 50 - km * 2)</span>.<br />
            • Límite peatonal: Los artículos dentro del radio de caminata reciben <span className="font-mono font-bold text-accent-teal">+30</span> puntos. Los que exceden el límite son penalizados con <span className="font-mono font-bold text-accent-red">-150</span> puntos para mantenerlos visibles al final.
          </>
        },
        {
          title: "Ajuste de tiempo disponible",
          desc: <>Si la duración total (experiencia + traslado) se ajusta cómodamente al tiempo disponible: la puntuación normalizada escala de <span className="font-mono">0.8</span> a <span className="font-mono">1.0</span>. Si la duración excede las horas disponibles: la puntuación disminuye rápidamente hacia <span className="font-mono">0.0</span> según el exceso de tiempo.</>
        },
        {
          title: "Omisión del modo \"Mostrar todo\"",
          desc: <>Activar "Mostrar todo" omite por completo los filtros de categoría, área y vibra. Todas las experiencias permanecen visibles en la lista activa, clasificadas únicamente por su puntuación de alineación de contexto.</>
        }
      ]
    },
    zh: {
      panel_title: "专属管家上下文引擎",
      panel_subtitle: "自适应本地智能",
      collapsed_summary: "当前活跃上下文",
      edit_context: "微调上下文",
      hide_context: "收起",
      weather_label: "当前天气",
      day_label: "星期日程",
      time_label: "本地时间",
      proximity_label: "参考锚点 (邻近度)",
      walking_label: "步行半径限制",
      show_everything_title: "显示全部 (可选)",
      show_everything_desc: "绕过类别、区域和氛围过滤逻辑，展示底端由上下文契合度排序的全部出行体验。",
      explain_algo_btn: "推荐排序规则",
      algo_title: "管家推荐排序公式",
      algo_desc: "我们的排序算法完全在您的本地设备上运行，以严格保护您的隐私。它根据多个维度的加权信号，为每项出行体验实时计算对齐度得分：",
      weather_sunny: "晴天",
      weather_rainy: "雨天",
      weather_snowy: "雪天",
      weather_cloudy: "多云",
      day_weekday: "工作日",
      day_weekend: "周末",
      prox_expo: "EXPO 会址附近",
      prox_hotel: "我的酒店附近",
      prox_zemun: "泽蒙历史街区附近",
      prox_none: "贝尔格莱德全市",
      walk_nolimit: "无步行限制",
      walk_short: "闲适短步 (< 800米)",
      walk_med: "步行范围内 (< 1.5公里)",
      walk_long: "适度可达 (< 3.0公里)",
      active: "活跃",
      inactive: "旁路",
      show_everything_active_warning: "正在显示全部推荐。类别与区域过滤逻辑已被旁路。",
      sig1_title: "01. 天气条件契合度",
      sig1_desc: "在天气晴朗宜人时，系统会优先展示户外旅行体验；若遇降雨或极端气候，更温馨舒适的室内避风港将被移动至更显眼的高位。",
      sig2_title: "02. 合适的时间与星期",
      sig2_desc: "部分出行项目在特定的小时区间或特定的工作日/周末体验感更佳。IDEMO 在计算呈现顺序时会充分考虑这些细节。",
      sig3_title: "03. 与出发点之间的距离",
      sig3_desc: "距离您当前选定的出发参考点越近的出行项目，在列表中通常会排列得越靠前，从而帮助您减少在路途上不必要的时间消耗。",
      sig4_title: "04. 时间预算的最佳匹配",
      sig4_desc: "能完美且舒适地融入您当前空闲时间段的体验项目将被优先展示。耗时更长的长途体验仍旧可以被随心探索，但其顺序会相对靠后。",
      rule_label: "规则提示",
      rule_desc: "任何体验项目都不会仅仅因为距离偏远或耗时稍长就被隐藏或排除。它们依然对您可见，只是当其与您当前的即时上下文条件不太匹配时，排序会相对靠后。",
      tech_btn: "技术细节",
      algo_how_title: "IDEMO 推荐排序规则",
      algo_how_desc: "IDEMO 共同衡量多个维度的上下文信号，以决定当前对您而言最合适、最契合的出行体验。推荐结果的排序会伴随天气状况、当前时间、星期日程、您设定的出发锚点、空闲时间预算以及您的个人喜好实时动态调整。所有计算均安全地在您的本地设备上运行。",
      tech_items: [
        {
          title: "核心对齐公式与归一化",
          desc: <>融合计算偏好 (vibeScore 权重 40%)、预算匹配 (budgetScore 30%) 及时间契合 (timeScore 30%)，最高累积贡献 <span className="font-mono font-bold text-accent-teal">+200</span> 分权重评分。</>
        },
        {
          title: "显式用户偏好反馈信号",
          desc: <>直接引入旅行者的主动评分加成：点击“喜欢” (<span className="font-mono font-bold text-accent-teal">+150</span> 分)、“感兴趣” (<span className="font-mono font-bold text-accent-teal">+50</span> 分)，点击“不喜欢”则重扣 <span className="font-mono font-bold text-accent-red">-200</span> 分并自动将该体验压至最底部。</>
        },
        {
          title: "本地设备隐式学习加权",
          desc: <>基于该项目单项的点击或查看频次，自适应给予最高 <span className="font-mono font-bold text-accent-teal">+60</span> 分提升 (<span className="font-mono">Math.min(60, 点击量 * 15)</span>)；若有高频类别偏好，则追加最高 <span className="font-mono font-bold text-accent-teal">+45</span> 分偏好加权 (<span className="font-mono">Math.min(45, 类别兴趣 * 10)</span>)。</>
        },
        {
          title: "心情星轨空间与语义拟合",
          desc: <>将 2D 轨道位置 <span className="font-mono">[0, 1]</span> 映射至标准高维空间坐标系 <span className="font-mono">[-5, +5]</span>。计算 60% 空间邻近度 (<span className="font-mono">Math.hypot</span>) 和 40% 语义相关度 (匹配奢华度、能量及城市化指标)，契合的体验将获得最高达 <span className="font-mono font-bold text-accent-teal">+120</span> 分的匹配激励。</>
        },
        {
          title: "实时天气环境自适应",
          desc: <>
            • 晴天 (Sunny)：户外体验奖励 <span className="font-mono font-bold text-accent-teal">+35</span> 分，室内体验微扣 <span className="font-mono font-bold text-accent-red">-5</span> 分。<br />
            • 雨天 (Rainy)：户外体验扣除 <span className="font-mono font-bold text-accent-red">-50</span> 分，室内温馨惬意体验奖励 <span className="font-mono font-bold text-accent-teal">+45</span> 分。<br />
            • 雪天 (Snowy)：滑雪胜地 (科帕奥尼克) 奖励 <span className="font-mono font-bold text-accent-teal">+65</span> 分，标准户外项目扣除 <span className="font-mono font-bold text-accent-red">-35</span> 分，室内温泉及美食项目加温奖励 <span className="font-mono font-bold text-accent-teal">+30</span> 分。<br />
            • 多云 (Cloudy)：全天候平稳奖励 <span className="font-mono font-bold text-accent-teal">+15</span> 分。
          </>
        },
        {
          title: "出行星期自适应",
          desc: <>
            • 周末 (周五至周日)：夜生活、旅行、自然或长效项目 (&gt;4小时) 加分 <span className="font-mono font-bold text-accent-teal">+30</span> 分。<br />
            • 工作日 (周一至周四)：人文历史、康养或简短的美食项目 (&le;3小时) 加分 <span className="font-mono font-bold text-accent-teal">+25</span> 分。
          </>
        },
        {
          title: "即时小时区间微调",
          desc: <>
            • 清晨与上午 (5:00 - 10:59)：观景台、塔拉徒步、要塞等优先展示 <span className="font-mono font-bold text-accent-teal">+25</span> 分，元气早起康养 <span className="font-mono font-bold text-accent-teal">+15</span> 分。<br />
            • 午后日光期 (11:00 - 15:59)：室内历史漫游、康养或医疗项目加分 <span className="font-mono font-bold text-accent-teal">+20</span> 分，户外项目微降 <span className="font-mono font-bold text-accent-red">-15</span> 分。<br />
            • 黄昏与暮色期 (17:00 - 20:59)：落日划艇、河畔水滨景观、城堡落日等推荐奖励 <span className="font-mono font-bold text-accent-teal">+35</span> 分。<br />
            • 深夜与午夜场 (21:00 - 4:59)：会所及深夜美食奖励 <span className="font-mono font-bold text-accent-teal">+40</span> 分，白天户外项目自动避让 <span className="font-mono font-bold text-accent-red">-30</span> 分。
          </>
        },
        {
          title: "距离计算及步行偏好阈值",
          desc: <>
            运用基于球面几何学的 Haversine 公式测算实际地表距离（地球半径 R = 6,371 公里）。<br />
            • 距离衰减：越近的体验获取越高 boost，公式为 <span className="font-mono">Math.max(0, 50 - 距离 * 2)</span>，最大可追加 <span className="font-mono font-bold text-accent-teal">+50</span> 分。<br />
            • 步行界限限制：若满足步行半径，加权奖励 <span className="font-mono font-bold text-accent-teal">+30</span> 分。若超过限制，系统仅施加 <span className="font-mono font-bold text-accent-red">-150</span> 分的强对齐惩罚，使之自然靠后。
          </>
        },
        {
          title: "可用时间精确打包",
          desc: <>当项目耗时小于或等于可用空闲时间：对齐度权重由 <span className="font-mono">0.8</span> 至 <span className="font-mono">1.0</span> 按比分配。若项目总耗时超出时间可用配额，算法进行衰减至最低 <span className="font-mono">0.0</span> 分，引导体验流向下游。</>
        },
        {
          title: "“显示全部”旁路模式",
          desc: <>启用后直接旁路类别、区域、氛围等所有常规过滤逻辑，让全部项目参与展示，纯粹由底层的上下文关联计算机制确定展示次序。</>
        }
      ]
    }
  };

  const t = text[language] || text['en'];
  const isSr = language === 'sr';
  const isZh = language === 'zh';

  // Format time minutes to string (HH:MM)
  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    const displayMins = mins < 10 ? `0${mins}` : mins;
    return `${displayHrs}:${displayMins} ${ampm}`;
  };

  const getWeatherIcon = (w: string) => {
    switch (w) {
      case 'Sunny': return <Sun size={14} className="text-amber-500" />;
      case 'Rainy': return <CloudRain size={14} className="text-blue-500" />;
      case 'Snowy': return <Snowflake size={14} className="text-sky-400" />;
      case 'Cloudy': return <Cloud size={14} className="text-slate-500" />;
      default: return <Sun size={14} />;
    }
  };

  const handleWeatherSelect = (w: 'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy') => {
    triggerHaptic(8);
    setCurrentWeather(w);
  };

  const handleDaySelect = (d: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday') => {
    triggerHaptic(8);
    setCurrentDayOfWeek(d);
  };

  const handleProximitySelect = (ref: 'expo' | 'hotel' | 'zemun' | 'none') => {
    triggerHaptic(8);
    setProximityReference(ref);
  };

  const handleWalkingSelect = (dist: number) => {
    triggerHaptic(8);
    setMaxWalkingDistanceKm(dist);
  };

  const handleToggleShowEverything = () => {
    triggerHaptic(12);
    setShowEverything(!showEverything);
  };

  const isWeekend = ['Friday', 'Saturday', 'Sunday'].includes(currentDayOfWeek);

  return (
    <div className="bg-[#FAF9F5] border border-[#D5D3C8] rounded-3xl p-5 shadow-tactile flex flex-col gap-4 relative overflow-hidden transition-all duration-300">
      {/* Decorative top orbit lines */}
      <div className="absolute top-0 right-0 w-36 h-36 border border-dashed border-[#E7E4DB] rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 border border-[#E7E4DB] border-opacity-40 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />

      {/* Header section */}
      <div className="flex justify-between items-start z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#5C5A4D] font-black">{t.panel_subtitle}</p>
          </div>
          <h3 className="text-lg font-serif text-brand-charcoal font-bold">{t.panel_title}</h3>
        </div>

        <button
          onClick={() => {
            triggerHaptic(10);
            setIsExpanded(!isExpanded);
          }}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-brand-pearl border border-[#D5D3C8] text-[10px] font-black uppercase tracking-wider text-brand-charcoal flex items-center gap-1 hover:shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>{t.hide_context}</span>
              <ChevronUp size={12} className="text-brand-charcoal/60" />
            </>
          ) : (
            <>
              <span>{t.edit_context}</span>
              <ChevronDown size={12} className="text-accent-teal" />
            </>
          )}
        </button>
      </div>

      {/* Collapsed active status display */}
      <div className="bg-white/70 backdrop-blur-xs rounded-2xl p-3 border border-[#E7E4DB] text-[11px] text-[#5C5A4D] font-medium flex flex-wrap items-center gap-y-2 gap-x-3.5 z-10">
        <span className="text-[9px] uppercase tracking-wider font-black text-brand-charcoal/40 border-r border-[#E7E4DB] pr-3 select-none">
          {t.collapsed_summary}
        </span>
        <div className="flex items-center gap-1 font-bold text-brand-charcoal">
          <Clock size={11} className="text-accent-teal" />
          <span>{currentDayOfWeek.substring(0, 3)}, {formatTime(currentTimeMinutes)}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-brand-charcoal">
          {getWeatherIcon(currentWeather)}
          <span>{currentWeather === 'Sunny' ? t.weather_sunny : currentWeather === 'Rainy' ? t.weather_rainy : currentWeather === 'Snowy' ? t.weather_snowy : t.weather_cloudy}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-brand-charcoal">
          <MapPin size={11} className="text-accent-red" />
          <span>
            {proximityReference === 'expo' ? t.prox_expo : proximityReference === 'hotel' ? t.prox_hotel : proximityReference === 'zemun' ? t.prox_zemun : t.prox_none}
          </span>
        </div>
        {maxWalkingDistanceKm > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1">
            <span>🚶 {maxWalkingDistanceKm === 0.8 ? t.walk_short : maxWalkingDistanceKm === 1.5 ? t.walk_med : t.walk_long}</span>
          </div>
        )}
        {showEverything && (
          <div className="bg-accent-teal/10 border border-accent-teal/25 text-accent-teal px-2 py-0.5 rounded-lg text-[10px] font-bold">
            ✦ SHOW ALL ACTIVE
          </div>
        )}
      </div>

      {/* Expanded controls section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4 pt-1 z-10"
          >
            <div className="h-[1px] bg-dashed border-[#E7E4DB] border-b w-full" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weather selector */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-charcoal/50 flex items-center gap-1">
                  <span>🌤️</span> {t.weather_label}
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Sunny', 'Rainy', 'Snowy', 'Cloudy'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => handleWeatherSelect(w)}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-black uppercase tracking-wider flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        currentWeather === w
                          ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm'
                          : 'bg-white text-brand-charcoal/70 border-[#D5D3C8] hover:bg-brand-pearl'
                      }`}
                    >
                      {getWeatherIcon(w)}
                      <span>{w === 'Sunny' ? t.weather_sunny : w === 'Rainy' ? t.weather_rainy : w === 'Snowy' ? t.weather_snowy : t.weather_cloudy}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of week selector */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-charcoal/50 flex items-center gap-1">
                  <span>📅</span> {t.day_label} ({isWeekend ? t.day_weekend : t.day_weekday})
                </span>
                <div className="flex bg-[#EAE8DF]/40 p-1 rounded-xl border border-[#D5D3C8] h-10 items-center justify-between">
                  {(['Monday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDaySelect(d)}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer h-[32px] flex items-center justify-center ${
                        currentDayOfWeek === d
                          ? 'bg-white text-brand-charcoal shadow-xs border border-border-main/10 font-black'
                          : 'text-[#5C5A4D] hover:text-brand-charcoal'
                      }`}
                    >
                      {d.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slider */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-black text-brand-charcoal/50 flex items-center gap-1">
                    <span>🕒</span> {t.time_label}
                  </span>
                  <span className="text-xs font-serif font-black text-[#1E2E20] bg-white border border-[#D5D3C8] px-2.5 py-0.5 rounded-lg">
                    {formatTime(currentTimeMinutes)}
                  </span>
                </div>
                <div className="px-2">
                  <input
                    type="range"
                    min={480} // 8:00 AM
                    max={1380} // 11:00 PM
                    step={30}
                    value={currentTimeMinutes}
                    onChange={(e) => {
                      setCurrentTimeMinutes(parseInt(e.target.value));
                    }}
                    className="w-full accent-accent-teal cursor-pointer h-1.5 bg-[#EAE8DF] rounded-lg"
                  />
                  <div className="flex justify-between text-[8px] font-black text-[#8C8A7D] uppercase tracking-wider pt-1 select-none">
                    <span>8:00 AM</span>
                    <span>1:00 PM</span>
                    <span>5:00 PM</span>
                    <span>8:00 PM</span>
                    <span>11:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Proximity anchor */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-charcoal/50 flex items-center gap-1">
                  <span>📍</span> {t.proximity_label}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['none', 'expo', 'hotel', 'zemun'] as const).map((anchor) => (
                    <button
                      key={anchor}
                      onClick={() => handleProximitySelect(anchor)}
                      className={`py-2 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-left justify-start ${
                        proximityReference === anchor
                          ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm'
                          : 'bg-white text-brand-charcoal/70 border-[#D5D3C8] hover:bg-brand-pearl'
                      }`}
                    >
                      <span className="shrink-0">{anchor === 'expo' ? '✦' : anchor === 'hotel' ? '🏨' : anchor === 'zemun' ? '🧱' : '🗺️'}</span>
                      <span className="truncate">{anchor === 'expo' ? t.prox_expo : anchor === 'hotel' ? t.prox_hotel : anchor === 'zemun' ? t.prox_zemun : t.prox_none}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Walking limit */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest font-black text-brand-charcoal/50 flex items-center gap-1">
                  <span>🚶</span> {t.walking_label}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {([0, 0.8, 1.5, 3.0] as const).map((dist) => (
                    <button
                      key={dist}
                      onClick={() => handleWalkingSelect(dist)}
                      className={`py-2 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 text-left justify-start ${
                        maxWalkingDistanceKm === dist
                          ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-sm'
                          : 'bg-white text-brand-charcoal/70 border-[#D5D3C8] hover:bg-brand-pearl'
                      }`}
                      disabled={proximityReference === 'none' && dist > 0}
                      title={proximityReference === 'none' && dist > 0 ? "Select a proximity reference point first" : ""}
                    >
                      <span className="shrink-0">{dist === 0 ? '✨' : dist === 0.8 ? '🍃' : dist === 1.5 ? '👟' : '🚗'}</span>
                      <span className={`truncate ${proximityReference === 'none' && dist > 0 ? 'opacity-30' : ''}`}>
                        {dist === 0 ? t.walk_nolimit : dist === 0.8 ? t.walk_short : dist === 1.5 ? t.walk_med : t.walk_long}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Show Everything Toggle Section */}
            <div className="h-[1px] bg-[#E7E4DB] border-b border-dashed w-full pt-2" />

            <div className="bg-white border border-[#D5D3C8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 transition-all">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-accent-teal/15 text-accent-teal text-[8.5px] font-black uppercase tracking-wider">
                    {t.active}
                  </span>
                  <h4 className="text-[12px] uppercase tracking-wider font-extrabold text-brand-charcoal">
                    {t.show_everything_title}
                  </h4>
                </div>
                <p className="text-[11px] text-[#8C8A7D] leading-normal font-medium max-w-xl">
                  {t.show_everything_desc}
                </p>
              </div>

              <button
                onClick={handleToggleShowEverything}
                className={`py-2.5 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer whitespace-nowrap min-w-[120px] text-center border ${
                  showEverything
                    ? 'bg-accent-teal text-white border-accent-teal shadow-xs'
                    : 'bg-white hover:bg-[#FAF9F5] text-brand-charcoal border-[#D5D3C8]'
                }`}
              >
                {showEverything ? "★ ON / SHOW ALL" : "☆ OFF / CURATED"}
              </button>
            </div>

            {/* Algorithm explanation trigger */}
            <div className="pt-2">
              <button
                onClick={() => {
                  triggerHaptic(10);
                  setShowExplanation(!showExplanation);
                }}
                className="w-full py-2 bg-white/40 hover:bg-[#FAF9F5] border border-dashed border-[#D5D3C8] rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#5C5A4D] hover:text-brand-charcoal transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HelpCircle size={12} className="text-accent-teal" />
                <span>{t.explain_algo_btn}</span>
              </button>

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[#1E2E20]/5 border border-[#1E2E20]/15 rounded-2xl p-5 mt-3 space-y-4 text-[#5C5A4D] leading-relaxed text-[11px] font-medium text-left">
                      {/* HEADER */}
                      <div className="border-b border-[#1E2E20]/10 pb-3">
                        <h4 className="text-[12px] uppercase tracking-[0.2em] font-black text-brand-charcoal mb-2">
                          {t.algo_how_title}
                        </h4>
                        <p className="text-[#5C5A4D] text-[11px] leading-relaxed font-medium">
                          {t.algo_how_desc}
                        </p>
                      </div>

                      {/* 4 SIGNALS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* 01. WEATHER FIT */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-brand-charcoal block uppercase tracking-wider text-[9px] text-accent-teal">
                            {t.sig1_title}
                          </span>
                          <p className="text-[10.5px] text-[#5C5A4D] leading-relaxed font-medium">
                            {t.sig1_desc}
                          </p>
                        </div>

                        {/* 02. RIGHT TIME, RIGHT DAY */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-brand-charcoal block uppercase tracking-wider text-[9px] text-accent-teal">
                            {t.sig2_title}
                          </span>
                          <p className="text-[10.5px] text-[#5C5A4D] leading-relaxed font-medium">
                            {t.sig2_desc}
                          </p>
                        </div>

                        {/* 03. DISTANCE FROM YOUR STARTING POINT */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-brand-charcoal block uppercase tracking-wider text-[9px] text-accent-teal">
                            {t.sig3_title}
                          </span>
                          <p className="text-[10.5px] text-[#5C5A4D] leading-relaxed font-medium">
                            {t.sig3_desc}
                          </p>
                        </div>

                        {/* 04. FIT WITHIN YOUR AVAILABLE TIME */}
                        <div className="space-y-1">
                          <span className="font-extrabold text-brand-charcoal block uppercase tracking-wider text-[9px] text-accent-teal">
                            {t.sig4_title}
                          </span>
                          <p className="text-[10.5px] text-[#5C5A4D] leading-relaxed font-medium">
                            {t.sig4_desc}
                          </p>
                        </div>
                      </div>

                      {/* RULE NOTE */}
                      <div className="pt-3 border-t border-dashed border-[#1E2E20]/10 flex items-start gap-1.5 text-[10px]">
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-brand-charcoal/5 text-brand-charcoal font-black uppercase text-[8px] tracking-wider">
                          {t.rule_label}
                        </span>
                        <p className="italic leading-normal font-medium text-[#5C5A4D]">
                          {t.rule_desc}
                        </p>
                      </div>

                      {/* COLLAPSED TECHNICAL DETAILS LAYER */}
                      <div className="pt-2 border-t border-dashed border-[#1E2E20]/10">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setShowTechnicalDetails(!showTechnicalDetails);
                          }}
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[#5C5A4D] hover:text-brand-charcoal cursor-pointer select-none transition-all"
                        >
                          {showTechnicalDetails ? <ChevronUp size={12} className="text-accent-teal" /> : <ChevronDown size={12} className="text-accent-teal" />}
                          <span>{t.tech_btn}</span>
                        </button>

                        <AnimatePresence>
                          {showTechnicalDetails && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 bg-white/40 border border-[#D5D3C8]/50 rounded-xl p-3.5 space-y-3.5 text-[10.5px] leading-relaxed font-medium text-[#5C5A4D]">
                                {/* Real Technical Details list mapped dynamically */}
                                {t.tech_items && t.tech_items.map((item: any, idx: number) => (
                                  <div key={idx} className={`space-y-1 ${idx > 0 ? 'border-t border-[#D5D3C8]/30 pt-2' : ''}`}>
                                    <span className="font-extrabold text-brand-charcoal uppercase tracking-wider text-[8.5px] block">{item.title}</span>
                                    <div className="text-brand-charcoal/80">
                                      {item.desc}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning banner when showEverything is on */}
      {showEverything && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[10px] font-bold text-amber-800 flex items-center gap-1.5 leading-none select-none z-10">
          <AlertCircle size={12} className="text-amber-600 animate-pulse shrink-0" />
          <span>{t.show_everything_active_warning}</span>
        </div>
      )}
    </div>
  );
}
