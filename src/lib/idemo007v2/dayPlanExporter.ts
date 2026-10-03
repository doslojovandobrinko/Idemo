/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItineraryProposal } from './dayPlanComposer';

export interface VisitorExportStop {
  stopOrder: number;
  recommendationId: string;
  title: string;
  category: string;
  location: string;
  suggestedTimeSlot: string;
  recommendedDurationMinutes: number;
  shortDescription: string;
  website?: string;
  travelFromPreviousKm: number;
  travelFromPreviousMins: number;
}

export interface VisitorDayPlanExport {
  exportId: string;
  title: string;
  serviceAreaId: string;
  durationBucket: string;
  totalDurationMinutes: number;
  totalDistanceKm: number;
  stopCount: number;
  stops: VisitorExportStop[];
  curatorNotes?: string;
  feasibilitySummary: {
    feasible: boolean;
    warningCount: number;
    warnings: string[];
  };
  exportedAt: string;
  status: 'APPROVED';
}

export interface DayPlanExportResult {
  success: boolean;
  exportData?: VisitorDayPlanExport;
  textSummary?: string;
  error?: string;
}

/**
 * Pure deterministic exporter for approved Day Plan itineraries.
 * Strictly requires publicationStatus === 'APPROVED'.
 * Performs ZERO recalculation, scoring, selection, or object mutation.
 */
export function exportDayPlanProposal(proposal: ItineraryProposal): DayPlanExportResult {
  if (!proposal) {
    return {
      success: false,
      error: 'EXPORTER_REJECTED: No itinerary proposal provided.',
    };
  }

  if (proposal.publicationStatus !== 'APPROVED') {
    return {
      success: false,
      error: `EXPORTER_REJECTED: Proposal status is '${proposal.publicationStatus || 'UNKNOWN'}'. Only 'APPROVED' itineraries are eligible for visitor export.`,
    };
  }

  const exportStops: VisitorExportStop[] = (proposal.stops || []).map((s) => ({
    stopOrder: s.stopOrder,
    recommendationId: s.recommendation?.id || '',
    title: s.recommendation?.title || 'Untitled Stop',
    category: s.recommendation?.category || 'General',
    location: s.recommendation?.location || 'Unspecified Location',
    suggestedTimeSlot: s.suggestedTimeSlot || '',
    recommendedDurationMinutes: s.recommendedDurationMinutes || 0,
    shortDescription: s.recommendation?.shortDescription || '',
    website: s.recommendation?.website || s.recommendation?.practicalInfo?.website,
    travelFromPreviousKm: s.travelFromPreviousKm || 0,
    travelFromPreviousMins: s.travelFromPreviousMins || 0,
  }));

  const warnings = (proposal.feasibilityResult?.warnings || []).map((w) => w.message);

  const exportData: VisitorDayPlanExport = {
    exportId: `exp-${proposal.id}`,
    title: proposal.title || 'Day Plan Itinerary',
    serviceAreaId: proposal.serviceAreaId || '',
    durationBucket: proposal.durationBucket || 'HALF-DAY',
    totalDurationMinutes: proposal.totalDurationMinutes || 0,
    totalDistanceKm: proposal.totalDistanceKm || 0,
    stopCount: exportStops.length,
    stops: exportStops,
    curatorNotes: proposal.curatorNotes,
    feasibilitySummary: {
      feasible: proposal.feasibilityResult?.feasible ?? true,
      warningCount: warnings.length,
      warnings,
    },
    exportedAt: new Date().toISOString(),
    status: 'APPROVED',
  };

  const textSummary = generateHumanReadableTextSummary(exportData);

  return {
    success: true,
    exportData,
    textSummary,
  };
}

function generateHumanReadableTextSummary(data: VisitorDayPlanExport): string {
  const lines: string[] = [];
  lines.push(`====================================================`);
  lines.push(`IDEMO CURATED DAY PLAN: ${data.title.toUpperCase()}`);
  lines.push(`====================================================`);
  lines.push(`Service Area: ${data.serviceAreaId}`);
  lines.push(`Pacing Bucket: ${data.durationBucket}`);
  lines.push(`Total Experience Duration: ${Math.floor(data.totalDurationMinutes / 60)}h ${data.totalDurationMinutes % 60}m`);
  lines.push(`Total Transit Distance: ${data.totalDistanceKm.toFixed(1)} km`);
  lines.push(`Status: APPROVED Curator Itinerary`);
  lines.push(``);

  if (data.curatorNotes && data.curatorNotes.trim() !== '') {
    lines.push(`CURATOR EDITORIAL NOTES:`);
    lines.push(`"${data.curatorNotes.trim()}"`);
    lines.push(``);
  }

  lines.push(`ITINERARY STOPS (${data.stopCount} stops):`);
  lines.push(`----------------------------------------------------`);

  data.stops.forEach((stop) => {
    lines.push(`STOP ${stop.stopOrder}: ${stop.title}`);
    lines.push(`  Time Slot: ${stop.suggestedTimeSlot}`);
    lines.push(`  Category: ${stop.category} | Location: ${stop.location}`);
    lines.push(`  Duration: ${stop.recommendedDurationMinutes} mins`);
    if (stop.shortDescription) {
      lines.push(`  Summary: ${stop.shortDescription}`);
    }
    if (stop.website) {
      lines.push(`  Web: ${stop.website}`);
    }
    if (stop.travelFromPreviousMins > 0) {
      lines.push(`  Transit from previous: ${stop.travelFromPreviousMins} mins (${stop.travelFromPreviousKm.toFixed(1)} km)`);
    }
    lines.push(``);
  });

  if (data.feasibilitySummary.warningCount > 0) {
    lines.push(`FEASIBILITY NOTES:`);
    data.feasibilitySummary.warnings.forEach((w) => {
      lines.push(`  - ${w}`);
    });
    lines.push(``);
  }

  lines.push(`====================================================`);
  lines.push(`Handed off from IDEMO Studio Curation Desk`);
  return lines.join('\n');
}
