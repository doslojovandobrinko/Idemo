/**
 * IDEMO 007 V2 - Live Acceptance Test for Slice 3
 */

import { performTargetedSearch } from '../lib/idemo007v2/targetedSearch';
import { Entity } from '../types/idemo007v2';

async function testLiveSearch() {
  console.log('--- LIVE ACCEPTANCE TEST A (SEARCH) ---');

  if (!process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY is not set in process.env. Skipping live call.');
    return;
  }

  const testEntity: Entity = {
    id: 'ent-felix-live',
    entityType: 'PLACE',
    canonicalName: 'Felix Romuliana',
    location: 'Gamzigrad, Zaječar, Serbia',
    coordinates: { lat: 43.89917, lng: 22.185 },
    address: 'Gamzigrad, Serbia',
    trustLevel: 'IDEMO_VERIFIED',
    verificationStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const startTime = Date.now();
  const res = await performTargetedSearch({
    entity: testEntity,
    missingFactKeys: ['opening_hours'],
    staleFactKeys: [],
  });

  const durationMs = Date.now() - startTime;

  console.log('Result Status:', res.success ? 'SUCCESS' : 'FAILED');
  console.log('Latency:', durationMs, 'ms');
  console.log('Search Queries Count:', res.searchQueriesCount);
  console.log('Facts Returned:', JSON.stringify(res.facts, null, 2));
  console.log('Unresolved Gaps:', JSON.stringify(res.unresolvedGaps, null, 2));
}

testLiveSearch();
