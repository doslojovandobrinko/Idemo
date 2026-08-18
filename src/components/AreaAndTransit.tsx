/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Compass, AlertCircle, Copy, Check, Info } from 'lucide-react';
import { Recommendation } from '../types';
import { triggerHaptic } from '../App';
import { getLocalizedValue } from '../lib/utils';
import { trackMapOpenSignal } from '../lib/preferenceEngine';

export interface Hub {
  id: string;
  name: { en: string; sr: string; es: string; de: string; ru: string; zh: string };
  coordinates: { lat: number; lng: number };
}

export const BASE_HUBS: Hub[] = [
  { id: 'republic_square', name: { en: 'Republic Square (City Center)', sr: 'Trg Republike (Centar grada)', es: 'Plaza de la República (Centro)', de: 'Republiksplatz (Stadtzentrum)', ru: 'Площадь Республики (Центр)', zh: '共和国广场（市中心）' }, coordinates: { lat: 44.8154, lng: 20.4607 } },
  { id: 'expo_hub', name: { en: 'EXPO 2027 Belgrade Site', sr: 'Kompleks EXPO 2027 Beograd', es: 'Recinto de la EXPO 2027', de: 'EXPO 2027 Belgrad Gelände', ru: 'Площадка ЭКСПО 2027', zh: '2027年贝尔格莱德世博会场' }, coordinates: { lat: 44.7176, lng: 20.2794 } },
  { id: 'zemun', name: { en: 'Zemun Old Quarter', sr: 'Zemun - Staro jezgro', es: 'Barrio Antiguo de Zemun', de: 'Zemun Altstadt', ru: 'Старый квартал Земун', zh: '泽蒙老城区' }, coordinates: { lat: 44.8415, lng: 20.4136 } }
];

export const REGIONS = [
  { id: 'belgrade_historic', name: { en: 'Historic Center', sr: 'Istorijsko jezgro', es: 'Centro Histórico', de: 'Historisches Zentrum', ru: 'Исторический центр', zh: '历史中心' }, icon: '🏛️', locations: ['Belgrade Historic Center', 'Stari Grad', 'Dorćol', 'Kosančićev Venac'] },
  { id: 'sava_waterfront', name: { en: 'Sava Waterfront', sr: 'Savski kej i pristan', es: 'Ribeira del Sava', de: 'Sava-Uferpromenade', ru: 'Набережная Савы', zh: '萨瓦河滨' }, icon: '🌊', locations: ['Belgrade Waterfront Clubbing', 'Sava Confluence', 'Beton Hala', 'Savamala'] },
  { id: 'zemun_novi', name: { en: 'Zemun & Novi Beograd', sr: 'Zemun i Novi Beograd', es: 'Zemun y Nuevo Belgrado', de: 'Zemun & Neu-Belgrad', ru: 'Земун и Нови Белград', zh: '泽蒙与新贝尔格莱德' }, icon: '🧱', locations: ['Zemun Quay', 'Novi Beograd', 'Zemun'] },
  { id: 'fruska_gora', name: { en: 'Vojvodina & North', sr: 'Vojvodina i Fruška gora', es: 'Vojvodina y el Norte', de: 'Vojvodina & Norden', ru: 'Воеводина и север', zh: '伏伊伏丁那与北部' }, icon: '🍷', locations: ['Sremski Karlovci', 'Fruška Gora', 'Novi Sad'] },
  { id: 'wilderness', name: { en: 'Serbian Wilderness', sr: 'Divljina i planine Srbije', es: 'Naturaleza Serbia', de: 'Serbische Wildnis', ru: 'Заповедная Сербия', zh: '塞尔维亚荒野' }, icon: '🦅', locations: ['Sjenica', 'Despotovac', 'Western Serbia', 'Tara', 'Uvac'] }
];

export function isLocationInRegion(location: string, regionId: string): boolean {
  if (!location) return false;
  const loc = location.toLowerCase();

  switch (regionId) {
    case 'belgrade_historic':
      if (
        loc.includes('stari grad') ||
        loc.includes('dorćol') ||
        loc.includes('dorcol') ||
        loc.includes('kosančićev') ||
        loc.includes('kosancicev') ||
        loc.includes('kalemegdan') ||
        loc.includes('skadarlija') ||
        loc.includes('vračar') ||
        loc.includes('vracar') ||
        loc.includes('senjak') ||
        loc.includes('palilula') ||
        loc.includes('city center') ||
        loc.includes('belgrade center') ||
        loc.includes('central belgrade') ||
        loc.includes('belgrade, v') ||
        loc.includes('belgrade v')
      ) {
        return true;
      }
      if (loc.includes('belgrade') || loc.includes('beograd')) {
        const otherBeogradKeywords = [
          'waterfront', 'sava', 'confluence', 'ušće', 'usce', 'silosi',
          'zemun', 'novi beograd', 'neu-belgrad', 'nuevo belgrado', 'surčin', 'surcin'
        ];
        return !otherBeogradKeywords.some(kw => loc.includes(kw));
      }
      return false;

    case 'sava_waterfront':
      return (
        loc.includes('waterfront') ||
        loc.includes('sava') ||
        loc.includes('beton hala') ||
        loc.includes('savamala') ||
        loc.includes('confluence') ||
        loc.includes('ušće') ||
        loc.includes('usce') ||
        loc.includes('silosi') ||
        loc.includes('danube riverside') ||
        loc.includes('danube river')
      );

    case 'zemun_novi':
      return (
        loc.includes('zemun') ||
        loc.includes('novi beograd') ||
        loc.includes('neu-belgrad') ||
        loc.includes('nuevo belgrado') ||
        loc.includes('surčin') ||
        loc.includes('surcin')
      );

    case 'fruska_gora':
      return (
        loc.includes('sremski karlovci') ||
        loc.includes('fruška gora') ||
        loc.includes('fruska gora') ||
        loc.includes('novi sad') ||
        loc.includes('subotica') ||
        loc.includes('palić') ||
        loc.includes('palic') ||
        loc.includes('zrenjanin') ||
        loc.includes('pančevo') ||
        loc.includes('pancevo') ||
        loc.includes('vojvodina') ||
        loc.includes('sremska mitrovica')
      );

    case 'wilderness':
      return (
        loc.includes('sjenica') ||
        loc.includes('despotovac') ||
        loc.includes('western serbia') ||
        loc.includes('tara') ||
        loc.includes('uvac') ||
        loc.includes('zlatibor') ||
        loc.includes('mokra gora') ||
        loc.includes('kosjerić') ||
        loc.includes('kosjeric') ||
        loc.includes('kuršumlija') ||
        loc.includes('kursumlija') ||
        loc.includes('kopaonik') ||
        loc.includes('national park') ||
        loc.includes('wilderness') ||
        loc.includes('mountain') ||
        loc.includes('gorge') ||
        loc.includes('guca') ||
        loc.includes('guča') ||
        loc.includes('southeastern serbia') ||
        loc.includes('eastern serbia') ||
        loc.includes('southern serbia') ||
        loc.includes('central serbia') ||
        loc.includes('valleys') ||
        loc.includes('village') ||
        loc.includes('rural') ||
        loc.includes('šumadija') ||
        loc.includes('sumadija') ||
        loc.includes('topola') ||
        loc.includes('sirogojno') ||
        loc.includes('pirot') ||
        loc.includes('bor') ||
        loc.includes('niš') ||
        loc.includes('nis') ||
        loc.includes('gamzigrad') ||
        loc.includes('zaječar') ||
        loc.includes('zajecar') ||
        loc.includes('kostolac') ||
        loc.includes('požarevac') ||
        loc.includes('pozarevac') ||
        loc.includes('golubac') ||
        loc.includes('donji milanovac') ||
        loc.includes('djerdap') ||
        loc.includes('đerdap') ||
        loc.includes('canyon') ||
        loc.includes('kragujevac')
      );

    default:
      return false;
  }
}

// Haversine formula for distance
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Scam-Free Taxi Estimator
export function getTaxiEstimation(distanceKm: number): { rsd: string; eur: string } {
  // Belgrade Taxi Tariff 1 (Standard daytime rate in 2026/2027)
  const baseStart = 270; // RSD entry
  const ratePerKm = 100; // RSD per km
  const estimatedRsd = Math.round(baseStart + (distanceKm * ratePerKm));
  const estimatedEur = Math.round(estimatedRsd / 117);

  // Buffer range for traffic / premium service
  const minRsd = Math.max(350, Math.round(estimatedRsd * 0.95));
  const maxRsd = Math.round(estimatedRsd * 1.15);
  const minEur = Math.max(3, Math.round(estimatedEur * 0.95));
  const maxEur = Math.round(estimatedEur * 1.15);

  return {
    rsd: `${minRsd} - ${maxRsd} RSD`,
    eur: `€${minEur} - €${maxEur}`
  };
}

export function LocalTransitCard({ 
  recommendation, 
  language 
}: { 
  recommendation: Recommendation; 
  language: string; 
}) {
  const [selectedHubId, setSelectedHubId] = useState<string>('republic_square');
  const [copied, setCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleRequestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocError(language === 'sr' ? 'Geolociranje nije podržano' : 'Geolocation not supported');
      return;
    }
    setIsLocating(true);
    setLocError(null);
    triggerHaptic(20);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSelectedHubId('live_gps');
        setIsLocating(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocError(language === 'sr' ? 'Pristup lokaciji je odbijen.' : 'GPS location access denied.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const isLiveActive = selectedHubId === 'live_gps' && deviceCoords;
  const activeHubCoords = isLiveActive ? deviceCoords! : (BASE_HUBS.find(h => h.id === selectedHubId) || BASE_HUBS[0]).coordinates;
  const recCoords = recommendation.coordinates || { lat: 44.8154, lng: 20.4607 };
  
  const distance = calculateDistance(
    activeHubCoords.lat, 
    activeHubCoords.lng, 
    recCoords.lat, 
    recCoords.lng
  );

  const taxiEst = getTaxiEstimation(distance);

  const handleCopyCoords = () => {
    const coordString = `${recCoords.lat}, ${recCoords.lng}`;
    navigator.clipboard.writeText(coordString);
    setCopied(true);
    triggerHaptic(60);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSerbianAddress = () => {
    const srTitle = getLocalizedValue(recommendation, 'title', 'sr') || recommendation.title || '';
    const loc = getLocalizedValue(recommendation, 'location', 'sr') || recommendation.location || '';
    if (loc.includes(',')) {
      return `${srTitle}, ${loc.split(',')[0].trim()}`;
    }
    return `${srTitle}, ${loc}`;
  };

  const handleCopySerbianCue = () => {
    const cue = `${l.prompt_driver}: ${getSerbianAddress()}`;
    navigator.clipboard.writeText(cue);
    setAddressCopied(true);
    triggerHaptic(60);
    setTimeout(() => setAddressCopied(false), 2000);
  };

  const labels: Record<string, any> = {
    en: {
      location_router: "Logistics & Transport Calibrator",
      transit_from: "Set Current Belgrade Hub:",
      scam_free_taxi: "Verified Local Taxi Fare (Scam-Free):",
      estimated_dist: "Calculated Distance:",
      approx_transit: "Est. Driving Time:",
      copy_gps: "Copy Decoded GPS Coords",
      gps_copied: "Coordinates Copied!",
      warning_scam: "Insist on the taximeter being active. Official city starts at 270 RSD. Avoid airport solicitors.",
      tip_label: "Concierge Tip",
      coord_system: "Secure Coordinate Payload",
      walk_score: "Walkability Index",
      high_walk: "✦✦✦ High Walkability (Scenic, flat boulevard stroll)",
      mod_walk: "✦✦✧ Moderate Walkability (Suggest Taxi or Cargo app)",
      low_walk: "✦✧✧ Adventure Transit (Dedicated drive required)",
      show_driver: "Show Taxi Driver Card / Map Address",
      copy_address: "Copy Serbian Direction Cue",
      address_copied: "Direction Cue Copied!",
      prompt_driver: "Please take me to",
      custom_calc_active: "Bespoke Concierge Transit Calculations Active"
    },
    sr: {
      location_router: "Kalibracija logistike i prevoza",
      transit_from: "Izaberite polaznu tačku u Beogradu:",
      scam_free_taxi: "Procenjena fer cena taksija (bez prevara):",
      estimated_dist: "Izračunata udaljenost:",
      approx_transit: "Procenjeno vreme vožnje:",
      copy_gps: "Kopiraj GPS koordinate",
      gps_copied: "Koordinate kopirane!",
      warning_scam: "Uvek insistirajte na uključenom taksimetru. Početna cena je 270 RSD. Izbegavajte neovlašćene taksiste na aerodromu.",
      tip_label: "Savet konsijerža",
      coord_system: "Sigurnosne koordinate lokacije",
      walk_score: "Indeks prohodnosti",
      high_walk: "✦✦✦ Visoka prohodnost (Odlično za laganu šetnju)",
      mod_walk: "✦✦✧ Srednja prohodnost (Preporučuje se taksi ili Cargo)",
      low_walk: "✦✧✧ Dalji prevoz (Potrebna vožnja auto-putem)",
      show_driver: "Prikaži karticu za taksistu / Lokalna adresa",
      copy_address: "Kopiraj uputstvo na srpskom",
      address_copied: "Uputstvo kopirano!",
      prompt_driver: "Molim vas odvezite me do",
      custom_calc_active: "Aktivna luksuzna kalkulacija rute"
    },
    es: {
      location_router: "Calibrador de Logística y Transporte",
      transit_from: "Punto de partida en Belgrado:",
      scam_free_taxi: "Tarifa de Taxi Certificada (Sin estafas):",
      estimated_dist: "Distancia calculada:",
      approx_transit: "Tiempo est. de viaje:",
      copy_gps: "Copiar coordenadas GPS",
      gps_copied: "¡Coordenadas copiadas!",
      warning_scam: "Exija siempre el taxímetro encendido. Tarifa inicial oficial 270 RSD. Evite captadores en el aeropuerto.",
      tip_label: "Nota del Conserje",
      coord_system: "Coordenadas seguras",
      walk_score: "Índice de Caminabilidad",
      high_walk: "✦✦✦ Alta Caminabilidad (Paseo panorámico y plano)",
      mod_walk: "✦✦✧ Caminabilidad Moderada (Se sugiere taxi o app)",
      low_walk: "✦✧✧ Tránsito Distante (Requiere transporte vehicular)",
      show_driver: "Mostrar Tarjeta para el Taxista",
      copy_address: "Copiar dirección en serbio",
      address_copied: "¡Copidado en portapapeles!",
      prompt_driver: "Por favor lléveme a",
      custom_calc_active: "Cálculos de tránsito concierge activos"
    },
    de: {
      location_router: "Logistik- & Transport-Kalibrierung",
      transit_from: "Belgrader Ausgangspunkt festlegen:",
      scam_free_taxi: "Zertifizierter lokaler Taxitarif (Scam-frei):",
      estimated_dist: "Berechnete Entfernung:",
      approx_transit: "Geschätzte Fahrzeit:",
      copy_gps: "GPS-Koordinaten kopieren",
      gps_copied: "Koordinaten kopiert!",
      warning_scam: "Bestehen Sie immer auf ein eingeschaltetes Taxameter. Grundgebühr 270 RSD. Keine Flughafen-Werber annehmen.",
      tip_label: "Concierge-Hinweis",
      coord_system: "Sichere Koordinaten",
      walk_score: "Begehbarkeits-Index",
      high_walk: "✦✦✦ Hohe Begehbarkeit (Ebene, malerische Allee)",
      mod_walk: "✦✦✧ Mittlere Begehbarkeit (Taxi/Cargo empfohlen)",
      low_walk: "✦✧✧ Ferne Erkundung (Fahrzeug erforderlich)",
      show_driver: "Taxi-Fahrerkarte / Adresse anzeigen",
      copy_address: "Anweisung auf Serbisch kopieren",
      address_copied: "Anweisung kopiert!",
      prompt_driver: "Bitte bringen Sie mich zu",
      custom_calc_active: "Individuelle Concierge-Routenberechnung aktiv"
    },
    ru: {
      location_router: "Калибровка логистики и транспорта",
      transit_from: "Выберите вашу базу в Белграде:",
      scam_free_taxi: "Сертифицированный тариф такси (без обмана):",
      estimated_dist: "Вычисленное расстояние:",
      approx_transit: "Оцененное время в пути:",
      copy_gps: "Скопировать GPS координаты",
      gps_copied: "Координаты скопированы!",
      warning_scam: "Всегда требуйте включения таксометра. Официальная посадка — 270 RSD. Избегайте частников в аэропорту.",
      tip_label: "Совет консьержа",
      coord_system: "Координаты объекта",
      walk_score: "Индекс пешеходности",
      high_walk: "✦✦✦ Отличная пешеходность (Живописные плоские улочки)",
      mod_walk: "✦✦✧ Средняя пешеходность (Рекомендуется такси/карго)",
      low_walk: "✦✧✧ Дальний транзит (Требуется автотранспорт)",
      show_driver: "Показать карту для водителя такси",
      copy_address: "Скопировать адрес на сербском",
      address_copied: "Адрес скопирован!",
      prompt_driver: "Пожалуйста, отвезите меня в",
      custom_calc_active: "Расчеты консьерж-логистики выполнены"
    },
    zh: {
      location_router: "物流及交通校准",
      transit_from: "设置您当前的贝尔格莱德基地：",
      scam_free_taxi: "官方出租车收费（无欺诈估算）：",
      estimated_dist: "经计算距离：",
      approx_transit: "预计行程时间：",
      copy_gps: "复制 GPS 坐标",
      gps_copied: "坐标已复制！",
      warning_scam: "坚持要求开启计价器。官方起步价 270 RSD。避免接受机场黑车司机的兜售。",
      tip_label: "专属管家提示",
      coord_system: "安全坐标位置",
      walk_score: "步行指数评价",
      high_walk: "✦✦✦ 高步行舒适度 (适合平坦而美丽的林荫漫步)",
      mod_walk: "✦✦✧ 中等步行距离 (推荐使用出租车或打车软件)",
      low_walk: "✦✧✧ 长途探索路段 (需要专车或公共交通工具)",
      show_driver: "向司机显示中塞地址卡片",
      copy_address: "复制塞尔维亚文目的地指令",
      address_copied: "目的地卡片已成功复制！",
      prompt_driver: "请送我去",
      custom_calc_active: "个性化世博管家交通数据计算完成"
    }
  };

  const l = labels[language] || labels['en'];

  // Speed assumptions: 45 km/h for local city, 75 km/h for highway/nature
  const isNature = distance > 50;
  const averageSpeed = isNature ? 75 : 40;
  const estMinutes = Math.max(5, Math.round((distance / averageSpeed) * 60));
  const travelTimeString = estMinutes >= 60 
    ? `${Math.floor(estMinutes / 60)}h ${estMinutes % 60}m`
    : `${estMinutes} mins`;

  // Walkability algorithm based on computed distance
  const getWalkabilityInfo = () => {
    if (distance <= 2.2) {
      return { 
        text: l.high_walk, 
        color: "text-emerald-700 bg-emerald-50 border-emerald-100", 
        badge: "bg-emerald-500" 
      };
    }
    if (distance <= 6.0) {
      return { 
        text: l.mod_walk, 
        color: "text-amber-700 bg-amber-50 border-amber-100", 
        badge: "bg-amber-500" 
      };
    }
    return { 
      text: l.low_walk, 
      color: "text-[#8C8A7D] bg-brand-pearl border-[#E7E4DB]", 
      badge: "bg-brand-charcoal/40" 
    };
  };

  const walkability = getWalkabilityInfo();

  return (
    <div className="bg-[#FAF9F5] border border-[#E7E4DB] rounded-[32px] p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation size={16} className="text-accent-red animate-pulse" />
          <h4 className="text-[13.5px] uppercase tracking-[0.25em] text-brand-charcoal font-black">{l.location_router}</h4>
        </div>
        <span className="text-[12px] font-mono uppercase tracking-widest text-[#5C5A4D] font-bold select-none">
          {l.custom_calc_active}
        </span>
      </div>

      <div className="space-y-3">
        <label className="text-[13px] uppercase tracking-[0.15em] text-[#5C5A4D] font-extrabold block">{l.transit_from}</label>
        <div className="grid grid-cols-4 gap-1.5">
          {BASE_HUBS.map(hub => (
            <button
              key={hub.id}
              onClick={() => {
                setSelectedHubId(hub.id);
                setLocError(null);
                triggerHaptic(10);
              }}
              className={`p-2 rounded-xl border text-center font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer min-h-[46px] flex items-center justify-center leading-none ${
                selectedHubId === hub.id 
                  ? 'bg-brand-charcoal border-brand-charcoal text-white shadow-sm font-black scale-[1.02]' 
                  : 'bg-white border-[#E7E4DB] text-[#5C5A4D] hover:bg-brand-pearl hover:text-brand-charcoal'
              }`}
            >
              {hub.id === 'republic_square' ? '📍' : hub.id === 'expo_hub' ? '✦' : '🧱'} {hub.name[language as keyof typeof hub.name]?.split(' ')[0] || hub.name.en.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={handleRequestDeviceLocation}
            className={`p-2 rounded-xl border text-center font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer min-h-[46px] flex items-center justify-center gap-1 leading-none ${
              selectedHubId === 'live_gps' && deviceCoords
                ? 'bg-[#155e5b] border-[#155e5b] text-white shadow-sm font-black scale-[1.02]' 
                : 'bg-white border-[#E7E4DB] text-[#155e5b] hover:bg-brand-pearl font-extrabold'
            }`}
          >
            {isLocating ? '⏳...' : '🧭 GPS'}
          </button>
        </div>
        {locError && (
          <div className="text-[11px] font-bold text-accent-red bg-red-50/50 border border-red-500/15 p-2.5 rounded-xl flex items-center gap-1.5 leading-none mt-2 select-none">
            <AlertCircle size={12} className="shrink-0" />
            <span>{locError}</span>
          </div>
        )}
      </div>

      {/* Dynamic Walkability Score Card */}
      <div className={`p-4 rounded-2xl border flex items-center gap-3.5 select-none transition-all duration-300 ${walkability.color}`}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${walkability.badge}`} />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] uppercase tracking-wider font-extrabold opacity-80 leading-none mb-1">{l.walk_score}</p>
          <p className="text-[14px] font-black uppercase tracking-wider truncate leading-tight">{walkability.text}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-white border border-[#E7E4DB] p-4 rounded-2xl flex flex-col justify-center shadow-xs">
          <p className="text-[13px] uppercase tracking-wider text-[#5C5A4D] font-extrabold">{l.estimated_dist}</p>
          <p className="text-2xl font-serif font-black text-brand-charcoal mt-1">{distance} km</p>
        </div>
        <div className="bg-white border border-[#E7E4DB] p-4 rounded-2xl flex flex-col justify-center shadow-xs">
          <p className="text-[13px] uppercase tracking-wider text-[#5C5A4D] font-extrabold">{l.approx_transit}</p>
          <p className="text-2xl font-serif font-black text-brand-charcoal mt-1">{travelTimeString}</p>
        </div>
      </div>

      <div className="bg-white border border-[#E7E4DB] p-4 rounded-2xl space-y-2.5 shadow-xs relative overflow-hidden">
        <p className="text-[13px] uppercase tracking-wider text-[#155e5b] font-black">{l.scam_free_taxi}</p>
        <div className="flex items-baseline justify-between select-none">
          <span className="text-2xl font-serif font-black text-brand-charcoal">{taxiEst.rsd}</span>
          <span className="text-sm font-extrabold text-[#5C5A4D]">({taxiEst.eur})</span>
        </div>
        <div className="pt-2.5 border-t border-[#F0EDE6] flex gap-2 items-start mt-1">
          <AlertCircle size={14} className="text-accent-red shrink-0 mt-0.5" />
          <p className="text-[13px] leading-relaxed text-[#4C4A3D] font-bold italic">
            {l.warning_scam}
          </p>
        </div>
      </div>

      {/* Tactile Show Driver Direction Cue Flashcard */}
      <div className="bg-white border border-[#D5D3C8] p-5 rounded-2xl space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[13px] uppercase tracking-wider font-extrabold text-brand-charcoal/70">
            ✉️ {l.show_driver}
          </span>
          <span className="text-[12px] font-mono uppercase bg-emerald-500/10 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full">
            Offline Safe
          </span>
        </div>
        
        <div className="bg-brand-pearl p-4 rounded-xl border border-[#FAF9F5] select-all">
          <p className="text-[12px] font-mono font-bold text-[#5C5A4D]/70 uppercase mb-1">Serbian Prompt:</p>
          <p className="text-base md:text-lg font-serif text-brand-charcoal font-black italic tracking-wide leading-snug">
            "{l.prompt_driver}: {getSerbianAddress()}"
          </p>
        </div>

        <button
          onClick={handleCopySerbianCue}
          className={`w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer flex items-center justify-center gap-2 transition-all outline-none active:scale-95 min-h-[48px] ${
            addressCopied 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 font-black' 
              : 'bg-white border-[#D5D3C8] hover:bg-brand-pearl text-brand-charcoal font-extrabold shadow-sm'
          }`}
        >
          {addressCopied ? <Check size={14} /> : <Copy size={14} />}
          <span>{addressCopied ? l.address_copied : l.copy_address}</span>
        </button>
      </div>

      <div className="pt-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[13px] uppercase tracking-widest text-[#5C5A4D] font-extrabold">{l.coord_system}</span>
            <p className="text-base font-mono text-brand-charcoal font-bold mt-0.5">
              {recCoords.lat.toFixed(5)}° N, {recCoords.lng.toFixed(5)}° E
            </p>
          </div>
          <button
            onClick={handleCopyCoords}
            className={`px-4 py-3 rounded-xl text-[12px] font-black uppercase tracking-wider border cursor-pointer flex items-center gap-1.5 transition-all outline-none min-h-[44px] ${
              copied 
                ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal shadow-inner' 
                : 'bg-white border-[#D5D3C8] hover:bg-[#F6F5F2] text-[#5C5A4D]'
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? l.gps_copied : l.copy_gps}</span>
          </button>
        </div>

        {/* Dual Native Map Shortcuts */}
        <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-dashed border-[#E7E4DB]">
          <a
            href={`maps://?q=${encodeURIComponent(getLocalizedValue(recommendation, 'title', language || 'en'))}&ll=${recCoords.lat},${recCoords.lng}`}
            onClick={() => {
              triggerHaptic(10);
              trackMapOpenSignal(recommendation);
            }}
            className="p-3 bg-white border border-[#D5D3C8] hover:bg-brand-pearl rounded-xl text-center font-extrabold text-[11px] uppercase tracking-wider text-brand-charcoal flex items-center justify-center gap-1.5 transition-all outline-none"
            id="open-apple-maps"
          >
            🍎 {language === 'sr' ? 'Apple Mape' : language === 'zh' ? '苹果地图' : 'Apple Maps'}
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${recCoords.lat},${recCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              triggerHaptic(10);
              trackMapOpenSignal(recommendation);
            }}
            className="p-3 bg-white border border-[#D5D3C8] hover:bg-brand-pearl rounded-xl text-center font-extrabold text-[11px] uppercase tracking-wider text-brand-charcoal flex items-center justify-center gap-1.5 transition-all outline-none"
            id="open-google-maps"
          >
            🌐 {language === 'sr' ? 'Google Mape' : language === 'zh' ? '谷歌地图' : 'Google Maps'}
          </a>
        </div>
      </div>
    </div>
  );
}
