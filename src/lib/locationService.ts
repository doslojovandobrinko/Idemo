/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeStorage } from './safeStorage';

export type LocationHubId = 'republic_square' | 'expo_hub' | 'zemun' | 'live_gps';

export interface HubDefinition {
  id: LocationHubId;
  name: { en: string; sr: string; es: string; de: string; ru: string; zh: string };
  coordinates: { lat: number; lng: number };
}

export const BASE_LOCATION_HUBS: HubDefinition[] = [
  { 
    id: 'republic_square', 
    name: { 
      en: 'Republic Square (City Center)', 
      sr: 'Trg Republike (Centar)', 
      es: 'Plaza de la República (Centro)', 
      de: 'Republiksplatz (Zentrum)', 
      ru: 'Площадь Республики (Центр)', 
      zh: '共和国广场（市中心）' 
    }, 
    coordinates: { lat: 44.8154, lng: 20.4607 } 
  },
  { 
    id: 'expo_hub', 
    name: { 
      en: 'EXPO 2027 Belgrade Complex', 
      sr: 'Kompleks EXPO 2027', 
      es: 'Recinto de la EXPO 2027', 
      de: 'EXPO 2027 Gelände', 
      ru: 'Комплекс ЭКСПО 2027', 
      zh: '2027世博会园区' 
    }, 
    coordinates: { lat: 44.7176, lng: 20.2794 } 
  },
  { 
    id: 'zemun', 
    name: { 
      en: 'Zemun Old Quarter', 
      sr: 'Zemun (Staro jezgro)', 
      es: 'Barrio Antiguo Zemun', 
      de: 'Zemun Altstadt', 
      ru: 'Земун (Старый город)', 
      zh: '泽蒙老城区' 
    }, 
    coordinates: { lat: 44.8415, lng: 20.4136 } 
  }
];

export interface LocationState {
  selectedHubId: LocationHubId;
  deviceCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  locError: string | null;
  isAbroad: boolean;
  distanceFromBelgradeKm: number | null;
}

// Regional Serbia/Belgrade threshold (180 km from Republic Square)
const SERBIA_REGION_MAX_KM = 180;
const BELGRADE_CENTER = { lat: 44.8154, lng: 20.4607 };

// Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Standard Belgrade Taxi Tariff 1
export function calculateTaxiFare(distanceKm: number): { rsd: string; eur: string; rsdNum: number; eurNum: number } {
  const baseStart = 270; // RSD start
  const ratePerKm = 100; // RSD per km
  const estimatedRsd = Math.round(baseStart + (distanceKm * ratePerKm));
  const estimatedEur = Math.round(estimatedRsd / 117);

  const minRsd = Math.max(350, Math.round(estimatedRsd * 0.95));
  const maxRsd = Math.round(estimatedRsd * 1.15);
  const minEur = Math.max(3, Math.round(estimatedEur * 0.95));
  const maxEur = Math.round(estimatedEur * 1.15);

  return {
    rsd: `${minRsd} - ${maxRsd} RSD`,
    eur: `€${minEur} - €${maxEur}`,
    rsdNum: estimatedRsd,
    eurNum: estimatedEur
  };
}

// In-memory state with safeStorage hydration
const STORAGE_KEY_HUB = 'idemo_visitor_hub_v1';
const STORAGE_KEY_COORDS = 'idemo_visitor_coords_v1';

let currentState: LocationState = (() => {
  let initialHub: LocationHubId = 'republic_square';
  let initialCoords: { lat: number; lng: number } | null = null;
  let isAbroad = false;
  let distFromBelgrade: number | null = null;

  try {
    const savedHub = safeStorage.getItem(STORAGE_KEY_HUB);
    if (savedHub === 'republic_square' || savedHub === 'expo_hub' || savedHub === 'zemun' || savedHub === 'live_gps') {
      initialHub = savedHub as LocationHubId;
    }
    const savedCoordsRaw = safeStorage.getItem(STORAGE_KEY_COORDS);
    if (savedCoordsRaw) {
      const parsed = JSON.parse(savedCoordsRaw);
      if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
        initialCoords = parsed;
        const d = calculateDistanceKm(BELGRADE_CENTER.lat, BELGRADE_CENTER.lng, parsed.lat, parsed.lng);
        distFromBelgrade = d;
        if (d > SERBIA_REGION_MAX_KM) {
          isAbroad = true;
          if (initialHub === 'live_gps') {
            initialHub = 'republic_square';
          }
        }
      }
    }
  } catch {
    // Fail-safe to default
  }

  return {
    selectedHubId: initialHub,
    deviceCoords: initialCoords,
    isLocating: false,
    locError: null,
    isAbroad,
    distanceFromBelgradeKm: distFromBelgrade
  };
})();

// Listeners
type Listener = (state: LocationState) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn(currentState);
    } catch (e) {
      console.warn('Location listener error:', e);
    }
  });
}

export const locationService = {
  getState(): LocationState {
    return currentState;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setSelectedHub(hubId: LocationHubId): void {
    if (currentState.selectedHubId === hubId && !currentState.locError) return;
    
    // If selecting live_gps but no coords yet, request them
    if (hubId === 'live_gps' && !currentState.deviceCoords) {
      this.requestDeviceLocation();
      return;
    }

    currentState = {
      ...currentState,
      selectedHubId: hubId,
      locError: null
    };

    try {
      safeStorage.setItem(STORAGE_KEY_HUB, hubId);
    } catch {}

    notifyListeners();
  },

  requestDeviceLocation(onComplete?: (success: boolean) => void): void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      currentState = {
        ...currentState,
        isLocating: false,
        locError: 'Geolociranje nije podržano na ovom uređaju.'
      };
      notifyListeners();
      onComplete?.(false);
      return;
    }

    currentState = {
      ...currentState,
      isLocating: true,
      locError: null
    };
    notifyListeners();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        const distFromCenter = calculateDistanceKm(
          BELGRADE_CENTER.lat, 
          BELGRADE_CENTER.lng, 
          coords.lat, 
          coords.lng
        );

        const isAbroad = distFromCenter > SERBIA_REGION_MAX_KM;

        // If abroad, don't force live_gps as origin, keep republic_square or expo_hub
        const effectiveHub: LocationHubId = isAbroad ? 'republic_square' : 'live_gps';

        currentState = {
          selectedHubId: effectiveHub,
          deviceCoords: coords,
          isLocating: false,
          locError: null,
          isAbroad,
          distanceFromBelgradeKm: distFromCenter
        };

        try {
          safeStorage.setItem(STORAGE_KEY_HUB, effectiveHub);
          safeStorage.setItem(STORAGE_KEY_COORDS, JSON.stringify(coords));
        } catch {}

        notifyListeners();
        onComplete?.(true);
      },
      (error) => {
        console.warn('Geolocation acquisition error:', error);
        let errorMsg = 'Pristup lokaciji je onemogućen.';
        if (error.code === error.TIMEOUT) {
          errorMsg = 'Isteklo je vreme za očitavanje GPS signala.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS lokacija trenutno nije dostupna.';
        }

        currentState = {
          ...currentState,
          isLocating: false,
          locError: errorMsg
        };
        notifyListeners();
        onComplete?.(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  },

  getActiveOrigin(): {
    coords: { lat: number; lng: number };
    labelSr: string;
    labelEn: string;
    isLiveGps: boolean;
    isAbroad: boolean;
  } {
    const isLiveActive = currentState.selectedHubId === 'live_gps' && !!currentState.deviceCoords && !currentState.isAbroad;

    if (isLiveActive) {
      return {
        coords: currentState.deviceCoords!,
        labelSr: 'Vaša trenutna lokacija',
        labelEn: 'Your Live Location',
        isLiveGps: true,
        isAbroad: false
      };
    }

    const hub = BASE_LOCATION_HUBS.find(h => h.id === currentState.selectedHubId) || BASE_LOCATION_HUBS[0];
    return {
      coords: hub.coordinates,
      labelSr: hub.name.sr,
      labelEn: hub.name.en,
      isLiveGps: false,
      isAbroad: currentState.isAbroad
    };
  },

  calculateTransitTo(destinationCoords?: { lat: number; lng: number } | null): {
    distanceKm: number;
    walkingMins: number;
    drivingMins: number;
    recommendedMode: 'walking' | 'taxi' | 'car';
    taxi: { rsd: string; eur: string; rsdNum: number; eurNum: number };
    originLabelSr: string;
    originLabelEn: string;
    isLiveGps: boolean;
    isAbroad: boolean;
    distanceFromBelgradeKm: number | null;
  } {
    const defaultCoords = { lat: 44.8154, lng: 20.4607 };
    const dest = (destinationCoords && typeof destinationCoords.lat === 'number' && typeof destinationCoords.lng === 'number' && destinationCoords.lat !== 0)
      ? destinationCoords
      : defaultCoords;

    const origin = this.getActiveOrigin();
    const distanceKm = calculateDistanceKm(origin.coords.lat, origin.coords.lng, dest.lat, dest.lng);

    // Walking speed: ~4.8 km/h
    const walkingMins = Math.max(2, Math.round((distanceKm / 4.8) * 60));

    // Driving speed: 40 km/h city, 75 km/h highway
    const avgDrivingSpeed = distanceKm > 35 ? 75 : 40;
    const drivingMins = Math.max(4, Math.round((distanceKm / avgDrivingSpeed) * 60));

    // Recommended mode
    let recommendedMode: 'walking' | 'taxi' | 'car' = 'taxi';
    if (distanceKm <= 1.5) {
      recommendedMode = 'walking';
    } else if (distanceKm > 35) {
      recommendedMode = 'car';
    }

    const taxi = calculateTaxiFare(distanceKm);

    return {
      distanceKm,
      walkingMins,
      drivingMins,
      recommendedMode,
      taxi,
      originLabelSr: origin.labelSr,
      originLabelEn: origin.labelEn,
      isLiveGps: origin.isLiveGps,
      isAbroad: origin.isAbroad,
      distanceFromBelgradeKm: currentState.distanceFromBelgradeKm
    };
  }
};
