/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  const baseStart = 270; // RSD entry
  const ratePerKm = 100; // RSD per km
  const estimatedRsd = Math.round(baseStart + (distanceKm * ratePerKm));
  const estimatedEur = Math.round(estimatedRsd / 117);

  const minRsd = Math.max(350, Math.round(estimatedRsd * 0.95));
  const maxRsd = Math.round(estimatedRsd * 1.15);
  const minEur = Math.max(3, Math.round(estimatedEur * 0.95));
  const maxEur = Math.round(estimatedEur * 1.15);

  return {
    rsd: `${minRsd} - ${maxRsd} RSD`,
    eur: `€${minEur} - €${maxEur}`
  };
}
