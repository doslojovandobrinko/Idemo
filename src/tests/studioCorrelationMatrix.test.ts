/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Studio Correlation Matrix Test Suite
 *
 * Tests Step 1:
 * Single Matrix (table) correlating all approved recommendations with all approved partners (1st, 2nd, 3rd priority).
 * 1. Filter by Partner -> visibility of all recommendations assigned to this partner and priority (1, 2 or 3).
 * 2. Filter by Recommendation -> visibility of all assigned partner names (1st, 2nd, 3rd).
 * 3. Atomic priority rank persistence and slot swapping.
 * 4. Failsafe handling of unranked, unassigned, and gap recommendations.
 */

import { safeStorage } from '../lib/safeStorage';
import { 
  setPartnerCoveragePriorityRank, 
  getPartnerCoveragePriorityRank 
} from '../lib/partnerService';
import { getAllPartners, getPartnerLifecycleState } from '../lib/partnerLifecycleService';
import { INITIAL_RECOMMENDATIONS } from '../data/recommendations/serbia';
import { PARTNERS } from '../data/partners';

export interface MatrixRow {
  recId: string;
  recTitle: string;
  category: string;
  location: string;
  partner1st: { id: string; name: string; code: string } | null;
  partner2nd: { id: string; name: string; code: string } | null;
  partner3rd: { id: string; name: string; code: string } | null;
  assignedCount: number;
}

export function buildCorrelationMatrix(
  recommendations: typeof INITIAL_RECOMMENDATIONS,
  approvedPartners: ReturnType<typeof getAllPartners>,
  coverageRanks: Record<string, Record<string, number>> = {}
): MatrixRow[] {
  return recommendations.map((rec) => {
    const recId = rec.id;
    const recTitle = rec.title || (rec as any).titleEn || recId;
    const recRanks = coverageRanks[recId] || {};

    let p1: { id: string; name: string; code: string } | null = null;
    let p2: { id: string; name: string; code: string } | null = null;
    let p3: { id: string; name: string; code: string } | null = null;

    // First check explicit ranks in coverageRanks
    for (const [pId, rank] of Object.entries(recRanks)) {
      const partnerObj = approvedPartners.find(p => p.id === pId || p.nameEn === pId);
      const name = partnerObj?.nameEn || pId;
      const code = partnerObj?.id || pId;
      if (rank === 1) p1 = { id: pId, name, code };
      else if (rank === 2) p2 = { id: pId, name, code };
      else if (rank === 3) p3 = { id: pId, name, code };
    }

    // Next check linkedRecommendations for any approved partners not yet explicitly ranked
    approvedPartners.forEach((partner) => {
      const links = partner.linkedRecommendations || [];
      const isLinked = links.includes(recId) || links.includes(recTitle);
      if (isLinked) {
        const storedRank = recRanks[partner.id];
        if (storedRank === undefined) {
          if (!p1 && p2?.id !== partner.id && p3?.id !== partner.id) {
            p1 = { id: partner.id, name: partner.nameEn, code: partner.id };
          } else if (!p2 && p1?.id !== partner.id && p3?.id !== partner.id) {
            p2 = { id: partner.id, name: partner.nameEn, code: partner.id };
          } else if (!p3 && p1?.id !== partner.id && p2?.id !== partner.id) {
            p3 = { id: partner.id, name: partner.nameEn, code: partner.id };
          }
        }
      }
    });

    const assignedCount = [p1, p2, p3].filter(Boolean).length;

    return {
      recId,
      recTitle,
      category: rec.category,
      location: rec.location || 'Serbia',
      partner1st: p1,
      partner2nd: p2,
      partner3rd: p3,
      assignedCount
    };
  });
}

export function filterMatrixByPartner(matrix: MatrixRow[], partnerId: string) {
  return matrix
    .map((row) => {
      let priority: 1 | 2 | 3 | null = null;
      if (row.partner1st?.id === partnerId) priority = 1;
      else if (row.partner2nd?.id === partnerId) priority = 2;
      else if (row.partner3rd?.id === partnerId) priority = 3;

      return {
        ...row,
        partnerPriority: priority
      };
    })
    .filter((row) => row.partnerPriority !== null);
}

export function filterMatrixByRecommendation(matrix: MatrixRow[], recIdOrTitle: string) {
  const norm = recIdOrTitle.toLowerCase().trim();
  return matrix.filter(
    (row) => row.recId.toLowerCase() === norm || row.recTitle.toLowerCase() === norm
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXECUTE TESTS
// ─────────────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log('--- TEST 1: Build Full Approved Recommendations & Approved Partners Matrix ---');
  const allPartners = getAllPartners();
  const approvedPartners = allPartners.filter(p => {
    const s = getPartnerLifecycleState(p);
    return s.isVerified || s.isActive || p.id.startsWith('a0000000-');
  });

  const matrix = buildCorrelationMatrix(INITIAL_RECOMMENDATIONS, approvedPartners);
  if (!matrix || matrix.length !== INITIAL_RECOMMENDATIONS.length) {
    throw new Error(`Expected ${INITIAL_RECOMMENDATIONS.length} matrix rows, got ${matrix.length}`);
  }
  console.log(`✓ Matrix successfully built with ${matrix.length} approved recommendations and ${approvedPartners.length} approved partners.`);

  console.log('--- TEST 2: Assign Priority Ranks (1st, 2nd, 3rd) and Verify Single Table Correlation ---');
  const testRec = INITIAL_RECOMMENDATIONS[0];
  const testRecId = testRec.id;
  const partner1 = approvedPartners[0]?.id || 'a0000000-0000-0000-0000-000000000099';
  const partner2 = approvedPartners[1]?.id || 'a0000000-0000-0000-0000-000000000091';
  const partner3 = approvedPartners[2]?.id || 'a0000000-0000-0000-0000-000000000092';

  await setPartnerCoveragePriorityRank(testRecId, partner1, 1);
  await setPartnerCoveragePriorityRank(testRecId, partner2, 2);
  await setPartnerCoveragePriorityRank(testRecId, partner3, 3);

  const rawRanks = safeStorage.getItem('idemo_coverage_ranks');
  const parsedRanks = rawRanks ? JSON.parse(rawRanks) : {};

  const updatedMatrix = buildCorrelationMatrix(INITIAL_RECOMMENDATIONS, approvedPartners, parsedRanks);
  const targetRow = updatedMatrix.find(r => r.recId === testRecId);
  if (!targetRow) throw new Error('Target matrix row not found');

  if (targetRow.partner1st?.id !== partner1) throw new Error(`Expected partner 1st to be ${partner1}`);
  if (targetRow.partner2nd?.id !== partner2) throw new Error(`Expected partner 2nd to be ${partner2}`);
  if (targetRow.partner3rd?.id !== partner3) throw new Error(`Expected partner 3rd to be ${partner3}`);
  if (targetRow.assignedCount !== 3) throw new Error(`Expected 3 assigned partners, got ${targetRow.assignedCount}`);
  console.log(`✓ Priority ranks 1st, 2nd, and 3rd verified for "${targetRow.recTitle}"`);

  console.log('--- TEST 3: Filter by Partner -> Visibility of assigned recommendations and priority (1, 2, or 3) ---');
  const partner1Filtered = filterMatrixByPartner(updatedMatrix, partner1);
  if (partner1Filtered.length === 0) throw new Error('Partner 1 filter returned no results');
  const foundAssignedRec = partner1Filtered.find(r => r.recId === testRecId);
  if (!foundAssignedRec) throw new Error('Test recommendation missing from partner 1 filter');
  if (foundAssignedRec.partnerPriority !== 1) {
    throw new Error(`Expected partner 1 priority to be 1, got ${foundAssignedRec.partnerPriority}`);
  }
  console.log(`✓ Filter by partner ${partner1} returned ${partner1Filtered.length} recommendations, priority correctly marked as 1st.`);

  const partner2Filtered = filterMatrixByPartner(updatedMatrix, partner2);
  const foundAssignedRec2 = partner2Filtered.find(r => r.recId === testRecId);
  if (!foundAssignedRec2 || foundAssignedRec2.partnerPriority !== 2) {
    throw new Error(`Expected partner 2 priority to be 2, got ${foundAssignedRec2?.partnerPriority}`);
  }
  console.log(`✓ Filter by partner ${partner2} returned recommendation with priority correctly marked as 2nd.`);

  console.log('--- TEST 4: Filter by Recommendation -> Visibility of all partner names ---');
  const recFiltered = filterMatrixByRecommendation(updatedMatrix, testRecId);
  if (recFiltered.length !== 1) throw new Error(`Expected 1 row for recommendation filter, got ${recFiltered.length}`);
  const rRow = recFiltered[0];
  if (!rRow.partner1st?.name || !rRow.partner2nd?.name || !rRow.partner3rd?.name) {
    throw new Error('Expected all 3 partner names to be present on recommendation filter');
  }
  console.log(`✓ Filter by recommendation "${rRow.recTitle}" returned all assigned partner names: 1st=${rRow.partner1st.name}, 2nd=${rRow.partner2nd.name}, 3rd=${rRow.partner3rd.name}.`);

  console.log('--- TEST 5: Collision-free Priority Rank Swapping ---');
  // Swap partner2 into Rank 1
  await setPartnerCoveragePriorityRank(testRecId, partner2, 1);
  const swappedRanks = JSON.parse(safeStorage.getItem('idemo_coverage_ranks') || '{}');
  const swappedMatrix = buildCorrelationMatrix(INITIAL_RECOMMENDATIONS, approvedPartners, swappedRanks);
  const swappedRow = swappedMatrix.find(r => r.recId === testRecId);
  if (!swappedRow) throw new Error('Swapped row not found');
  if (swappedRow.partner1st?.id !== partner2) throw new Error(`Expected partner2 to be 1st after swap, got ${swappedRow.partner1st?.id}`);
  if (swappedRow.partner2nd?.id !== partner1) throw new Error(`Expected partner1 to be 2nd after swap, got ${swappedRow.partner2nd?.id}`);
  console.log(`✓ Atomic rank swap passed: partner2 is now 1st, partner1 swapped to 2nd.`);

  console.log('\nALL 5 MATRIX CORRELATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failure:', err);
  process.exit(1);
});
