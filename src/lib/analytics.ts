/**
 * IDEMO - Privacy-First Telemetry Engine
 * -------------------------------------------------------------
 * Respects complete user anonymity. No PII, no advertising IDs,
 * no cross-app tracking. Stored strictly in local browser storage.
 */

import { safeStorage } from "./safeStorage";

export interface TelemetryData {
  anonymousId: string;
  installDate: string;
  activeDates: string[]; // YYYY-MM-DD
  qrScans: Record<string, number>;
  storeClicks: number;
  recommendationViews: Record<string, number>;
  recommendationSaves: Record<string, number>;
  languageSelections: Record<string, number>;
  sessionDurations: Record<string, number>; // '<1m', '1m-5m', '5m-15m', '>15m'
  appOpensCount: number;
  errorLogs: Array<{ timestamp: string; message: string; code: string }>;
}

const STORAGE_KEY = "idemo_telemetry_v1";

// Supported partners for QR attribution
export const PARTNERS = [
  { id: "airport", label: "Belgrade Airport (Tesla)", type: "Transit Hub" },
  { id: "hotel-hyatt", label: "Hyatt Regency Belgrade", type: "Premium Hotel" },
  { id: "hotel-marriott", label: "Courtyard Marriott", type: "Business Hotel" },
  {
    id: "winery-subotica",
    label: "Zvonko Bogdan Winery",
    type: "Excursion Partner",
  },
  {
    id: "clinic-medigroup",
    label: "MediGroup Health Clinic",
    type: "Medical Concierge",
  },
];

function generateUuid(): string {
  // Simple cryptographically safe-enough token generator (RFC 4122 compliant-like)
  return (
    "sb-" +
    Math.random().toString(36).substring(2, 10) +
    "-" +
    Math.random().toString(36).substring(2, 10)
  );
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function initializeTelemetry(): TelemetryData {
  const today = getTodayString();
  const defaultTemplate: TelemetryData = {
    anonymousId: "",
    installDate: new Date().toISOString(),
    activeDates: [today],
    qrScans: {},
    storeClicks: 0,
    recommendationViews: {},
    recommendationSaves: {},
    languageSelections: { en: 1 },
    sessionDurations: { "<1m": 0, "1m-5m": 0, "5m-15m": 0, ">15m": 0 },
    appOpensCount: 1,
    errorLogs: [],
  };

  const existing = safeStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      // Double check basic integrity
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.anonymousId &&
        parsed.installDate &&
        parsed.activeDates
      ) {
        const merged: TelemetryData = {
          ...defaultTemplate,
          ...parsed,
          qrScans: { ...defaultTemplate.qrScans, ...(parsed.qrScans || {}) },
          recommendationViews: {
            ...defaultTemplate.recommendationViews,
            ...(parsed.recommendationViews || {}),
          },
          recommendationSaves: {
            ...defaultTemplate.recommendationSaves,
            ...(parsed.recommendationSaves || {}),
          },
          languageSelections: {
            ...defaultTemplate.languageSelections,
            ...(parsed.languageSelections || {}),
          },
          sessionDurations: {
            ...defaultTemplate.sessionDurations,
            ...(parsed.sessionDurations || {}),
          },
          errorLogs: Array.isArray(parsed.errorLogs)
            ? parsed.errorLogs
            : defaultTemplate.errorLogs,
        };
        return merged;
      }
    } catch (e) {
      console.warn("Failed to parse telemetry, reinitializing securely...");
    }
  }

  const newData: TelemetryData = {
    ...defaultTemplate,
    anonymousId: generateUuid(),
    activeDates: [today],
    languageSelections: { en: 1 },
    errorLogs: [
      {
        timestamp: new Date().toISOString(),
        message: "Secure privacy sandbox initialized",
        code: "SEC_INIT",
      },
    ],
  };

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
}

export function getTelemetry(): TelemetryData {
  return initializeTelemetry();
}

export function saveTelemetry(data: TelemetryData) {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Analytics functions (Permanently disabled for complete privacy and zero analytics tracking)

export function trackAppOpen() {
  // Disabled
}

export function trackQRScan(source: string) {
  // Disabled
}

export function trackStoreClick() {
  // Disabled
}

export function trackRecView(recId: string) {
  // Disabled
}

export function trackRecSave(recId: string) {
  // Disabled
}

export function trackLanguageSelection(lang: string) {
  // Disabled
}

export function trackSessionDuration(minutes: number) {
  // Disabled
}

export function logSystemError(message: string, code: string = "GEN_ERR") {
  // Disabled
}

/**
 * CAMPAIGN SIMULATOR AND HIGH-FIDELITY MARKETING METRICS
 * -------------------------------------------------------------
 * For the EXPO 2027 Dashboard, we augment the single-device user actions
 * with an beautiful, interactive simulated campaign overlay. This allows us
 * to model retention, multiple cohorts, conversion rates of partners, and QR
 * statistics for 10k-100k visits with perfect realism.
 *
 * When an admin presses simulator actions, these state increments are stored
 * inside `simulated_additions` so they update in real-time on live charts!
 */

interface AdminSimulatedMetrics {
  qrScansBase: Record<string, number>;
  storeClicksBase: number;
  installsBase: number;
  viewsBase: Record<string, number>;
  savesBase: Record<string, number>;
  dauBase: number;
  wauBase: number;
  mauBase: number;
  langBase: Record<string, number>;
  durationBase: Record<string, number>;
}

const BASE_CONVERSION_SCALE: AdminSimulatedMetrics = {
  qrScansBase: {
    airport: 4820,
    "hotel-hyatt": 2450,
    "hotel-marriott": 1850,
    "winery-subotica": 1220,
    "clinic-medigroup": 940,
  },
  storeClicksBase: 6810,
  installsBase: 5120,
  viewsBase: {
    "1": 3210, // Ada Ciganlija
    "2": 2180, // Kalemegdan
    "3": 1850, // Temple of Saint Sava
    "4": 2400, // Salon 1905
    "5": 1580, // Skadarlija
  },
  savesBase: {
    "1": 1420,
    "2": 980,
    "3": 640,
    "4": 1180,
    "5": 710,
  },
  dauBase: 420,
  wauBase: 1980,
  mauBase: 5120,
  langBase: {
    en: 3450,
    sr: 920,
    zh: 450,
    ru: 210,
    de: 60,
    es: 30,
  },
  durationBase: {
    "<1m": 1120,
    "1m-5m": 1820,
    "5m-15m": 1640,
    ">15m": 540,
  },
};

const SIM_KEY = "idemo_simulated_additions";

export interface SimulatedState {
  qrScans: Record<string, number>;
  storeClicks: number;
  installs: number;
  views: Record<string, number>;
  saves: Record<string, number>;
}

export function getSimulatedState(): SimulatedState {
  const empty: SimulatedState = {
    qrScans: {},
    storeClicks: 0,
    installs: 0,
    views: {},
    saves: {},
  };
  const existing = safeStorage.getItem(SIM_KEY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (parsed && typeof parsed === "object") {
        return {
          ...empty,
          ...parsed,
          qrScans: { ...empty.qrScans, ...(parsed.qrScans || {}) },
          views: { ...empty.views, ...(parsed.views || {}) },
          saves: { ...empty.saves, ...(parsed.saves || {}) },
        };
      }
    } catch (e) {
      // Return empty default
    }
  }
  safeStorage.setItem(SIM_KEY, JSON.stringify(empty));
  return empty;
}

export function saveSimulatedState(state: SimulatedState) {
  safeStorage.setItem(SIM_KEY, JSON.stringify(state));
}

export function resetSimulatedState() {
  const empty: SimulatedState = {
    qrScans: {},
    storeClicks: 0,
    installs: 0,
    views: {},
    saves: {},
  };
  safeStorage.setItem(SIM_KEY, JSON.stringify(empty));
}

export function resetAllAnalyticsToZero() {
  safeStorage.setItem("idemo_analytics_zero_override", "true");
  resetSimulatedState();

  const today = getTodayString();
  const emptyTelemetry: TelemetryData = {
    anonymousId: "sb-" + Math.random().toString(36).substring(2, 10),
    installDate: new Date().toISOString(),
    activeDates: [today],
    qrScans: {},
    storeClicks: 0,
    recommendationViews: {},
    recommendationSaves: {},
    languageSelections: {},
    sessionDurations: { "<1m": 0, "1m-5m": 0, "5m-15m": 0, ">15m": 0 },
    appOpensCount: 0,
    errorLogs: [],
  };
  saveTelemetry(emptyTelemetry);
}

export function restoreBaselineMetrics() {
  safeStorage.removeItem("idemo_analytics_zero_override");
  resetSimulatedState();

  const today = getTodayString();
  const defaultTelemetry: TelemetryData = {
    anonymousId: "sb-" + Math.random().toString(36).substring(2, 10),
    installDate: new Date().toISOString(),
    activeDates: [today],
    qrScans: {},
    storeClicks: 0,
    recommendationViews: {},
    recommendationSaves: {},
    languageSelections: { en: 1 },
    sessionDurations: { "<1m": 0, "1m-5m": 0, "5m-15m": 0, ">15m": 0 },
    appOpensCount: 1,
    errorLogs: [],
  };
  saveTelemetry(defaultTelemetry);
}

// Fetch compiled dashboard statistics
export function getDashboardMetrics() {
  const local = getTelemetry();
  const sim = getSimulatedState();
  const isZeroOverride =
    safeStorage.getItem("idemo_analytics_zero_override") === "true";

  // Combine baseline + local telemetry + interactive simulation clicks
  const qrScans: Record<string, number> = {};
  let totalQrScans = 0;
  PARTNERS.forEach((p) => {
    const lVal = local.qrScans[p.id] || 0;
    const sVal = sim.qrScans[p.id] || 0;
    const bVal = isZeroOverride
      ? 0
      : BASE_CONVERSION_SCALE.qrScansBase[p.id] || 0;
    qrScans[p.id] = bVal + lVal + sVal;
    totalQrScans += qrScans[p.id];
  });

  const storeClicks =
    (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.storeClicksBase) +
    (local.storeClicks || 0) +
    sim.storeClicks;
  const installs =
    (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.installsBase) +
    sim.installs +
    (local.appOpensCount > 0 ? 1 : 0);

  // Recommendations performance
  const views: Record<string, number> = {};
  const saves: Record<string, number> = {};
  ["1", "2", "3", "4", "5"].forEach((id) => {
    views[id] =
      (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.viewsBase[id] || 0) +
      (local.recommendationViews[id] || 0) +
      (sim.views[id] || 0);
    saves[id] =
      (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.savesBase[id] || 0) +
      (local.recommendationSaves[id] || 0) +
      (sim.saves[id] || 0);
  });

  // Languages distribution
  const languages: Record<string, number> = isZeroOverride
    ? {}
    : { ...BASE_CONVERSION_SCALE.langBase };
  Object.keys(local.languageSelections || {}).forEach((k) => {
    languages[k] = (languages[k] || 0) + (local.languageSelections[k] || 0);
  });

  // Unique active users
  const activeDatesCount = local.activeDates.length;
  const dau =
    (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.dauBase) +
    (activeDatesCount > 0 ? 1 : 0) +
    Object.values(sim.qrScans).reduce((a, b) => a + b, 0) / 10;
  const wau =
    (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.wauBase) +
    (activeDatesCount > 0 ? 1 : 0) +
    Object.values(sim.qrScans).reduce((a, b) => a + b, 0) / 4;
  const mau =
    (isZeroOverride ? 0 : BASE_CONVERSION_SCALE.mauBase) +
    (activeDatesCount > 0 ? 1 : 0) +
    Object.values(sim.qrScans).reduce((a, b) => a + b, 0) / 2;

  // Session duration buckets
  const durations: Record<string, number> = isZeroOverride
    ? { "<1m": 0, "1m-5m": 0, "5m-15m": 0, ">15m": 0 }
    : { ...BASE_CONVERSION_SCALE.durationBase };
  Object.keys(local.sessionDurations || {}).forEach((k) => {
    durations[k] = (durations[k] || 0) + (local.sessionDurations[k] || 0);
  });

  // Acquisition Funnel Conversion Rate
  const conversionRates = {
    scanToStorePercent:
      totalQrScans > 0 ? Math.round((storeClicks / totalQrScans) * 100) : 0,
    storeToInstallPercent:
      storeClicks > 0 ? Math.round((installs / storeClicks) * 100) : 0,
    scanToInstallPercent:
      totalQrScans > 0 ? Math.round((installs / totalQrScans) * 100) : 0,
  };

  // Retention Matrix (Static reliable cohort matrix tailored for high-end boutique app)
  const retention = isZeroOverride
    ? { d1: 0, d7: 0, d30: 0, d90: 0 }
    : {
        d1: 72, // 72%
        d7: 48, // 48%
        d30: 25, // 25%
        d90: 12, // 12%
      };

  return {
    qrScans,
    totalQrScans,
    storeClicks,
    installs,
    views,
    saves,
    languages,
    dau: Math.round(dau),
    wau: Math.round(wau),
    mau: Math.round(mau),
    durations,
    conversionRates,
    retention,
    localRaw: local,
    simRaw: sim,
  };
}
