/**
 * IDEMO 007 V2 - Source Authority & Deterministic Conflict Resolver
 * Ranks sources, evaluates category suitability, and detects unresolved material conflicts.
 */

import { FactRecord, FactSourceType, FactConflict, Entity } from '../../types/idemo007v2';

export const SOURCE_PRECEDENCE_RANK: Record<FactSourceType, number> = {
  CURATOR: 1,
  PRIMARY_OFFICIAL: 2,
  PARTNER: 3,
  MAPS: 4,
  SEARCH_GROUNDED: 5,
  SECONDARY_REFERENCE: 6,
};

/**
 * Returns the effective source rank for a specific fact key.
 * Adjusts rank based on source suitability by category.
 */
export function getSourceCategorySuitabilityRank(
  sourceType: FactSourceType,
  factKey: string,
  entity?: Entity
): number {
  const baseRank = SOURCE_PRECEDENCE_RANK[sourceType] || 99;
  const k = factKey.toLowerCase();

  // 1. Geographic / Coordinates facts -> MAPS is highly authoritative (rank 2, just below CURATOR)
  if (k.includes('coordinates') || k.includes('latitude') || k.includes('longitude')) {
    if (sourceType === 'MAPS') return 1.5;
    if (sourceType === 'CURATOR') return 1.0;
    if (sourceType === 'PRIMARY_OFFICIAL') return 2.0;
  }

  // 2. Partner profile / service facts -> PARTNER is highly authoritative for their own profile
  if (k.includes('partner_') || k.includes('contact_') || k.includes('service_')) {
    if (sourceType === 'PARTNER') return 1.5;
    if (sourceType === 'CURATOR') return 1.0;
  }

  // 3. UNESCO / Official Status -> PRIMARY_OFFICIAL is preferred
  if (k.includes('unesco') || k.includes('official_status')) {
    if (sourceType === 'PRIMARY_OFFICIAL') return 1.2;
    if (sourceType === 'CURATOR') return 1.0;
  }

  return baseRank;
}

/**
 * Checks whether two fact values are equal.
 */
export function areFactValuesEqual(valA: any, valB: any): boolean {
  if (valA === valB) return true;
  if (valA == null || valB == null) return false;
  return JSON.stringify(valA) === JSON.stringify(valB);
}

/**
 * Reconciles or flags conflicts among facts belonging to the same entityId and factKey.
 */
export function detectAndReconcileFactConflicts(
  facts: FactRecord[],
  entities: Entity[] = []
): FactConflict[] {
  const conflicts: FactConflict[] = [];

  // Group facts by entityId + factKey
  const grouped: Record<string, FactRecord[]> = {};
  for (const f of facts) {
    const key = `${f.entityId}:${f.factKey}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(f);
  }

  for (const [groupKey, groupFacts] of Object.entries(grouped)) {
    if (groupFacts.length < 2) continue;

    // Check if any values differ
    const firstVal = groupFacts[0].value;
    const hasDifference = groupFacts.some((f) => !areFactValuesEqual(f.value, firstVal));

    if (!hasDifference) continue;

    const [entityId, factKey] = groupKey.split(':');
    const matchEntity = entities.find((e) => e.id === entityId);

    // Calculate suitability rank for each conflicting fact
    const rankedFacts = groupFacts.map((fact) => ({
      fact,
      rank: getSourceCategorySuitabilityRank(fact.sourceType, factKey, matchEntity),
    })).sort((a, b) => a.rank - b.rank);

    const topFact = rankedFacts[0];
    const runnerUpFact = rankedFacts[1];

    // If top fact has strictly superior rank (lower number) than runner-up, it reconciles!
    if (topFact.rank < runnerUpFact.rank) {
      conflicts.push({
        entityId,
        factKey,
        conflictingFacts: groupFacts,
        isReconciled: true,
        winningFact: topFact.fact,
        reconciliationReason: `Higher authority source '${topFact.fact.sourceType}' (rank ${topFact.rank}) overrode '${runnerUpFact.fact.sourceType}' (rank ${runnerUpFact.rank})`,
      });
    } else {
      // Equally authoritative conflicting facts -> UNRESOLVED CONFLICT
      conflicts.push({
        entityId,
        factKey,
        conflictingFacts: groupFacts,
        isReconciled: false,
        reconciliationReason: `Unresolved conflict between equally authoritative sources '${topFact.fact.sourceType}' and '${runnerUpFact.fact.sourceType}'`,
      });
    }
  }

  return conflicts;
}
