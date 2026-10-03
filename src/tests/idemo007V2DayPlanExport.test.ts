/**
 * IDEMO 007 V2 - Day Plan Visitor Export Test Suite
 * Tests pure deterministic formatting of approved itinerary proposals,
 * eligibility enforcement, text summary generation, and zero data mutation.
 */

import {
  exportDayPlanProposal,
  DayPlanExportResult,
} from '../lib/idemo007v2/dayPlanExporter';
import { ItineraryProposal, DayPlanStop } from '../lib/idemo007v2/dayPlanComposer';
import { Recommendation } from '../types';

export interface TestResult {
  id: string;
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const mockRec1: Recommendation = {
  id: 'rec-export-1',
  title: 'Kalemegdan Fortress',
  category: 'History',
  shortDescription: 'Ancient fortress overlooking the confluence of Sava and Danube.',
  longDescription: 'Historic landmark with panoramic views and fortress walks.',
  image: '/src/assets/images/kalemegdan.jpg',
  duration: '2 hours',
  travelTime: '10 mins',
  travelTimeMinutes: 10,
  location: 'Belgrade',
  estimatedCost: 'Free',
  preferredTransport: 'Walk',
  website: 'https://beogradskatvrdjava.co.rs',
};

const mockRec2: Recommendation = {
  id: 'rec-export-2',
  title: 'Kafana Question Mark',
  category: 'Gastronomy',
  shortDescription: 'Traditional Serbian kafana built in 1823.',
  longDescription: 'Authentic cuisine and Balkan music history.',
  image: '/src/assets/images/kafana-question-mark.jpg',
  duration: '1.5 hours',
  travelTime: '5 mins',
  travelTimeMinutes: 5,
  location: 'Belgrade Old Town',
  estimatedCost: '€15-€30',
  preferredTransport: 'Walk',
  website: 'https://kafanaquestionmark.rs',
};

const mockApprovedProposal: ItineraryProposal = {
  id: 'prop-approved-101',
  title: 'Belgrade Historic & Gastronomic Trail',
  serviceAreaId: 'sa-serbia-belgrade',
  durationBucket: 'HALF-DAY',
  publicationStatus: 'APPROVED',
  createdAt: '2026-10-01T00:00:00Z',
  curatorNotes: 'Wear comfortable walking shoes for fortress cobblestones.',
  totalDurationMinutes: 210,
  totalDistanceKm: 1.2,
  stops: [
    {
      stopOrder: 1,
      recommendation: mockRec1,
      suggestedTimeSlot: '10:00 - 12:00',
      recommendedDurationMinutes: 120,
      travelFromPreviousKm: 0,
      travelFromPreviousMins: 0,
    },
    {
      stopOrder: 2,
      recommendation: mockRec2,
      suggestedTimeSlot: '12:15 - 13:45',
      recommendedDurationMinutes: 90,
      travelFromPreviousKm: 1.2,
      travelFromPreviousMins: 15,
    },
  ],
  feasibilityResult: {
    feasible: true,
    warnings: [],
    totalExperienceMinutes: 210,
    totalTransitMinutes: 15,
    totalBufferMinutes: 15,
    totalPlanMinutes: 240,
  },
};

export function runDayPlanExportTests(): TestResult[] {
  const results: TestResult[] = [];

  // DPE-01: APPROVED proposal generates valid visitor export
  (() => {
    const res = exportDayPlanProposal(mockApprovedProposal);
    const passed =
      res.success === true &&
      res.exportData !== undefined &&
      res.exportData.status === 'APPROVED' &&
      res.exportData.stopCount === 2;

    results.push({
      id: 'DPE-01',
      testId: 'DPE-01',
      name: 'APPROVED proposal generates valid visitor export',
      expected: 'success=true, status=APPROVED, stopCount=2',
      actual: `success=${res.success}, status=${res.exportData?.status}, stopCount=${res.exportData?.stopCount}`,
      passed,
    });
  })();

  // DPE-02: Text output contains available stop titles, time slots, locations and curator notes
  (() => {
    const res = exportDayPlanProposal(mockApprovedProposal);
    const txt = res.textSummary || '';
    const hasTitle1 = txt.includes('Kalemegdan Fortress');
    const hasTitle2 = txt.includes('Kafana Question Mark');
    const hasSlot = txt.includes('10:00 - 12:00');
    const hasLocation = txt.includes('Belgrade Old Town');
    const hasNotes = txt.includes('Wear comfortable walking shoes');

    const passed = hasTitle1 && hasTitle2 && hasSlot && hasLocation && hasNotes;

    results.push({
      id: 'DPE-02',
      testId: 'DPE-02',
      name: 'Text output contains available stop titles, time slots, locations and curator notes',
      expected: 'all key fields present in text summary',
      actual: `hasTitle1=${hasTitle1}, hasTitle2=${hasTitle2}, hasSlot=${hasSlot}, hasLocation=${hasLocation}, hasNotes=${hasNotes}`,
      passed,
    });
  })();

  // DPE-03: Structured export preserves required existing proposal information without recalculation
  (() => {
    const res = exportDayPlanProposal(mockApprovedProposal);
    const data = res.exportData;
    const passed =
      data !== undefined &&
      data.totalDurationMinutes === 210 &&
      data.totalDistanceKm === 1.2 &&
      data.stops[1].travelFromPreviousKm === 1.2 &&
      data.stops[1].travelFromPreviousMins === 15;

    results.push({
      id: 'DPE-03',
      testId: 'DPE-03',
      name: 'Structured export preserves required existing proposal information without recalculation',
      expected: 'totalDurationMinutes=210, totalDistanceKm=1.2, travelMins=15',
      actual: data ? `dur=${data.totalDurationMinutes}, dist=${data.totalDistanceKm}, travelMins=${data.stops[1]?.travelFromPreviousMins}` : 'no data',
      passed,
    });
  })();

  // DPE-04: Exporter performs zero mutation
  (() => {
    const originalJson = JSON.stringify(mockApprovedProposal);
    exportDayPlanProposal(mockApprovedProposal);
    const postExportJson = JSON.stringify(mockApprovedProposal);

    results.push({
      id: 'DPE-04',
      testId: 'DPE-04',
      name: 'Exporter performs zero mutation',
      expected: 'source proposal object remains unchanged',
      actual: originalJson === postExportJson ? 'unchanged' : 'mutated',
      passed: originalJson === postExportJson,
    });
  })();

  // DPE-05: Identical input produces identical output
  (() => {
    const res1 = exportDayPlanProposal(mockApprovedProposal);
    const res2 = exportDayPlanProposal(mockApprovedProposal);

    const txt1 = res1.textSummary;
    const txt2 = res2.textSummary;

    results.push({
      id: 'DPE-05',
      testId: 'DPE-05',
      name: 'Identical input produces identical output',
      expected: 'identical text summary across repeated calls',
      actual: txt1 === txt2 ? 'identical' : 'mismatch',
      passed: txt1 === txt2,
    });
  })();

  // DPE-06: Non-APPROVED proposal is rejected from export
  (() => {
    const draftProp: ItineraryProposal = {
      ...mockApprovedProposal,
      publicationStatus: 'DRAFT',
    };
    const res = exportDayPlanProposal(draftProp);

    const passed = res.success === false && res.error?.includes('EXPORTER_REJECTED') === true;

    results.push({
      id: 'DPE-06',
      testId: 'DPE-06',
      name: 'Non-APPROVED proposal is rejected from export',
      expected: 'success=false with EXPORTER_REJECTED error',
      actual: `success=${res.success}, error=${res.error}`,
      passed,
    });
  })();

  return results;
}
