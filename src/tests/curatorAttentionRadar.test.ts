/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateTaskAging, aggregateCuratorTasks } from '../lib/curatorTaskService';
import { Recommendation } from '../types';
import { PartnerProfileQueueItem } from '../lib/partnerService';
import { PartnerRecommendationProposal } from '../lib/partnerProposalService';

function runTests() {
  console.log('--- CURATOR ATTENTION RADAR TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (!condition) {
      console.error(`FAIL: ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
    console.log(`PASS: ${msg}`);
    passed++;
  }

  // 1. Aging Calculation Tests
  const now = Date.now();
  const freshDate = new Date(now - 4 * 60 * 60 * 1000).toISOString(); // 4 hours ago
  const agingDate = new Date(now - 36 * 60 * 60 * 1000).toISOString(); // 36 hours ago (1d 12h)
  const criticalDate = new Date(now - 90 * 60 * 60 * 1000).toISOString(); // 90 hours ago (3d 18h)

  const freshAging = calculateTaskAging(freshDate);
  assert(freshAging.tier === 'TIER_1_FRESH', '4 hours ago is classified as TIER_1_FRESH');
  assert(freshAging.hours === 4, '4 hours correctly calculated');

  const agingAging = calculateTaskAging(agingDate);
  assert(agingAging.tier === 'TIER_2_AGING', '36 hours ago is classified as TIER_2_AGING');
  assert(agingAging.label.includes('1d 12h'), 'Aging label formats correctly');

  const criticalAging = calculateTaskAging(criticalDate);
  assert(criticalAging.tier === 'TIER_3_BOTTLENECK', '90 hours ago is classified as TIER_3_BOTTLENECK');
  assert(criticalAging.label.includes('critical SLA'), 'Critical SLA label formatted correctly');

  // 2. Task Aggregation Tests
  const mockPartners: PartnerProfileQueueItem[] = [
    {
      partner_id: 'p-1',
      partner_name: 'Vinarija Deurić',
      category: 'Winery',
      review_status: 'pending_review',
      submitted_at: criticalDate,
      image_urls: ['img1.jpg']
    },
    {
      partner_id: 'p-2',
      partner_name: 'Hotel Square Nine',
      category: 'Hospitality',
      review_status: 'changes_requested',
      submitted_at: agingDate
    }
  ];

  const mockRecs: Recommendation[] = [
    {
      id: 'rec-test-1',
      title: 'Monastery Hopovo',
      category: 'culture',
      shortDescription: 'Historic monastery',
      location: 'Fruška Gora',
      image: 'hopovo.jpg'
    } as any
  ];

  const mockProposals: PartnerRecommendationProposal[] = [
    {
      id: 'prop-1',
      partnerId: 'p-1',
      partnerName: 'Vinarija Deurić',
      proposedTitle: 'Sunset Cellar Tasting',
      category: 'gastronomy',
      description: 'Exclusive barrel tasting',
      location: 'Mala Remeta',
      curatorReviewStatus: 'PENDING',
      submittedAt: freshDate
    }
  ];

  const aggregated = aggregateCuratorTasks({
    recommendations: mockRecs,
    editorialStatuses: { 'rec-test-1': 'CANDIDATE' },
    partnerQueue: mockPartners,
    proposals: mockProposals
  });

  assert(aggregated.length >= 3, 'Aggregates tasks across partners, recs, and proposals');
  
  // First task should be critical (Vinarija Deurić with >72h)
  const topTask = aggregated[0];
  assert(topTask.urgency === 'CRITICAL', 'Top task has CRITICAL urgency');
  assert(topTask.agingTier === 'TIER_3_BOTTLENECK', 'Top task is TIER_3_BOTTLENECK');
  assert(topTask.targetId === 'p-1', 'Target ID correctly mapped to p-1');

  // Verify partner changes_requested is flagged as AMBIGUITY
  const ambiguityTask = aggregated.find(t => t.targetId === 'p-2');
  assert(!!ambiguityTask, 'Found partner p-2 in tasks');
  assert(ambiguityTask?.issueType === 'AMBIGUITY', 'Changes requested mapped to AMBIGUITY issue type');

  console.log(`\nALL ${passed}/${total} CURATOR ATTENTION RADAR TESTS PASSED!`);
}

runTests();
