/**
 * IDEMO 007 V2 - Entity Foundation Inspector
 * Minimal read-only Studio debug view for inspected entities, facts, FactPacks,
 * Lookup Decisions, and Selective External Evidence Enrichment state.
 */

import React, { useState } from 'react';
import { Entity, FactRecord, FactPack } from '../../types/idemo007v2';
import { buildFactPack } from '../../lib/idemo007v2/factPackBuilder';

interface EntityFoundationInspectorProps {
  entities?: Entity[];
  facts?: FactRecord[];
}

const SAMPLE_ENTITIES: Entity[] = [
  {
    id: 'ent-001',
    entityType: 'PLACE',
    canonicalName: 'Felix Romuliana',
    location: 'Gamzigrad, Zaječar',
    coordinates: { lat: 43.89917, lng: 22.185 },
    address: 'Gamzigrad, Serbia',
    trustLevel: 'IDEMO_VERIFIED',
    verificationStatus: 'VERIFIED',
    lastVerifiedAt: '2026-09-24T00:00:00.000Z',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'ent-002',
    entityType: 'ACCOMMODATION',
    canonicalName: 'Hotel Eulogium Zaječar',
    location: 'Zaječar',
    coordinates: { lat: 43.9035, lng: 22.278 },
    address: 'Nikole Pašića 12, Zaječar',
    trustLevel: 'IDEMO_VERIFIED',
    verificationStatus: 'VERIFIED',
    lastVerifiedAt: '2026-09-20T00:00:00.000Z',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'ent-003',
    entityType: 'RESTAURANT',
    canonicalName: 'Kafana Dva Jelena Candidate',
    location: 'Skadarlija, Belgrade',
    coordinates: { lat: 44.8172, lng: 20.4633 },
    address: 'Skadarska 32, Belgrade',
    trustLevel: 'UNVERIFIED',
    verificationStatus: 'PENDING_REVIEW',
    lastVerifiedAt: null,
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
];

const SAMPLE_FACTS: FactRecord[] = [
  {
    id: 'f-001',
    entityId: 'ent-001',
    factKey: 'unesco_status',
    value: 'UNESCO World Heritage Site since 2007',
    sourceType: 'PRIMARY_OFFICIAL',
    sourceUrl: 'https://whc.unesco.org/en/list/1253',
    sourceTitle: 'UNESCO World Heritage Centre',
    verifiedAt: '2026-09-24T00:00:00.000Z',
    volatility: 'LOW',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
  {
    id: 'f-002',
    entityId: 'ent-001',
    factKey: 'opening_hours',
    value: '08:00 - 20:00 daily (Summer)',
    sourceType: 'PRIMARY_OFFICIAL',
    sourceUrl: 'http://www.trajan.rs',
    sourceTitle: 'National Museum Zaječar',
    verifiedAt: '2026-09-24T00:00:00.000Z',
    volatility: 'HIGH',
    createdAt: '2026-09-24T00:00:00.000Z',
    updatedAt: '2026-09-24T00:00:00.000Z',
  },
];

export const EntityFoundationInspector: React.FC<EntityFoundationInspectorProps> = ({
  entities = SAMPLE_ENTITIES,
  facts = SAMPLE_FACTS,
}) => {
  const [showFactPack, setShowFactPack] = useState(false);

  const sampleFactPack: FactPack = buildFactPack({
    recommendationType: 'JOURNEY',
    curatorInput: { title: 'Imperial Roman Serbia Circuit', requiresOvernight: true },
    entities,
    facts,
    journeyComponents: [
      {
        id: 'jc-1',
        recommendationId: 'rec-roman-001',
        entityId: 'ent-001',
        stopOrder: 1,
        componentRole: 'PRIMARY_STOP',
        isOptional: false,
        recommendedDurationMinutes: 120,
        isOvernightStay: false,
        travelFromPreviousMinutes: 0,
        distanceFromPreviousKm: 0,
      },
      {
        id: 'jc-2',
        recommendationId: 'rec-roman-001',
        entityId: 'ent-002',
        stopOrder: 2,
        componentRole: 'OVERNIGHT',
        isOptional: false,
        recommendedDurationMinutes: 480,
        isOvernightStay: true,
        travelFromPreviousMinutes: 15,
        distanceFromPreviousKm: 12.4,
      },
    ],
  });

  const lookupDecision = sampleFactPack.lookupDecision;

  return (
    <div className="bg-stone-900 border border-amber-900/40 rounded-lg p-5 text-stone-200 text-sm font-sans my-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-amber-200">
            007 V2 — Selective Evidence & FactPack Inspector
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Deterministic SSOT entity register, lookup decisions, freshness, and evidence enrichment
          </p>
        </div>
        <button
          onClick={() => setShowFactPack(!showFactPack)}
          className="px-3 py-1.5 text-xs font-mono font-semibold rounded border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 transition-colors"
        >
          {showFactPack ? 'Hide FactPack JSON' : 'Inspect FactPack JSON'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-stone-950/60 p-3 rounded border border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
            Registered Entities
          </div>
          <div className="text-xl font-mono text-amber-300 font-bold mt-1">
            {entities.length}
          </div>
        </div>
        <div className="bg-stone-950/60 p-3 rounded border border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
            Provenanced Facts
          </div>
          <div className="text-xl font-mono text-emerald-400 font-bold mt-1">
            {facts.length}
          </div>
        </div>
        <div className="bg-stone-950/60 p-3 rounded border border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
            Lookup Outcome
          </div>
          <div className="text-xs font-mono text-amber-200 font-bold mt-1.5 truncate">
            {lookupDecision?.outcome || 'NO_EXTERNAL_LOOKUP'}
          </div>
        </div>
        <div className="bg-stone-950/60 p-3 rounded border border-stone-800">
          <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
            Cache Readiness
          </div>
          <div className="text-xs font-mono text-emerald-300 font-bold mt-1.5">
            {sampleFactPack.cacheStatus || 'CACHE_VALID'}
          </div>
        </div>
      </div>

      {lookupDecision && (
        <div className="bg-stone-950/80 p-3 rounded border border-stone-800 mb-4 text-xs font-mono">
          <div className="font-semibold text-amber-300 mb-1">
            Deterministic Decision Engine Diagnostic:
          </div>
          <div className="grid grid-cols-2 gap-2 text-stone-300">
            <div>Search Needed: <span className={lookupDecision.searchNeeds.length > 0 ? 'text-amber-400' : 'text-stone-500'}>{lookupDecision.searchNeeds.length > 0 ? 'YES' : 'NO'}</span></div>
            <div>Maps Needed: <span className={lookupDecision.mapsNeeds.length > 0 ? 'text-amber-400' : 'text-stone-500'}>{lookupDecision.mapsNeeds.length > 0 ? 'YES' : 'NO'}</span></div>
            <div>Missing Facts: {lookupDecision.missingFacts.length}</div>
            <div>Stale Facts: {lookupDecision.staleFacts.length}</div>
          </div>
          {lookupDecision.reasons.length > 0 && (
            <div className="mt-2 text-stone-400">
              Decision Reasons: {lookupDecision.reasons.join(' | ')}
            </div>
          )}
        </div>
      )}

      {showFactPack ? (
        <div className="bg-stone-950 p-4 rounded border border-stone-800 overflow-x-auto">
          <div className="text-xs font-mono text-stone-400 mb-2">
            Generated FactPack V2 (Selective Evidence Enriched):
          </div>
          <pre className="text-xs font-mono text-emerald-300/90 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {JSON.stringify(sampleFactPack, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-2">
          {entities.map((ent) => (
            <div
              key={ent.id}
              className="flex items-center justify-between bg-stone-950/40 p-3 rounded border border-stone-800/80"
            >
              <div>
                <span className="font-medium text-stone-100">{ent.canonicalName}</span>
                <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                  {ent.entityType}
                </span>
                <div className="text-xs text-stone-400 mt-0.5">{ent.location || 'No location string'}</div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded font-mono font-semibold ${
                    ent.trustLevel === 'STRATEGIC_PARTNER'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : ent.trustLevel === 'IDEMO_VERIFIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {ent.trustLevel}
                </span>
                <span className="text-xs font-mono text-stone-500">
                  {facts.filter((f) => f.entityId === ent.id).length} facts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
