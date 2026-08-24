# IDEMO V9 CURRENT STATE LEDGER
**File**: `/docs/governance/IDEMO_CURRENT_STATE.md`  
**Platform Baseline**: IDEMO V9  
**Package Baseline**: v1.2.0  
**Status**: Current Implementation Ledger  
**Scope**: Volatile Implementation State Only  

---

## 1. Document Authority

**GOVERNING RULE: VERIFY CURRENT STATE FIRST. INSTRUCT SECOND.**

This document is the single authoritative volatile-state ledger for the current IDEMO V9 implementation. It records verified current repository state, seed fallbacks, specified architectures, and unverifiable live parameters.

This document is strictly subordinate to:
1. IDEMO Architectural Vision
2. IDEMO Constitution & Governance Framework (`/docs/governance/`)
3. Frozen Approved Architecture & Work-Package Contracts
4. Verified Live Runtime & Database State

Where verified live runtime or database evidence becomes available, it overrides static repository assumptions.

---

## 2. Baseline Summary

### Recommendations
* **192 Master Physical Recommendation Records**: Exported across 7 wave files in `src/data/recommendations/index.ts`.
* **192 Unique IDs**: Identifiers run from `rec-sr-001` through `rec-sr-192`.
* **0 Duplicate IDs / 0 Duplicate Titles**: Confirmed across the static dataset.
* **Visitor SPA Loading**: `src/App.tsx` loads all 192 physical seed records into client discovery state.
* **Editorial Distinction**: Physical presence in seed files does NOT make all 192 records canonically approved. Editorial lifecycle state is tracked separately.
* **Live Database State**: Physical PostgreSQL row count in live production Supabase remains unverified.

### Categories
* **7 Serbia Destination Categories**: Authoritative source is `src/types.ts` → `Category` enum (`Wellbeing`, `Medical`, `Nature`, `History`, `Gastronomy`, `Travel`, `Clubbing`).
* **Global Core Integration**: Rendered through the single shared Global IDEMO core engine. They are Serbia destination categories mapped through the global engine, not immutable global category labels.
* **Single Codebase Architecture**: Single-app, single-core architecture is preserved without country-specific codebase forks.

### Service Areas
* **6 Serbia Service Areas**: Belgrade Metropolitan Area, Novi Sad & Vojvodina, Western Serbia & Podrinje, Šumadija & Central Serbia, Eastern Serbia & Lower Danube, Niš & Southern Serbia.
* **Repository-Final Schema**:
  * Primary Key: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  * Slug Code: `code TEXT UNIQUE` (e.g., `'sa-belgrade-001'`)
* **Belgrade Identifier**: `'sa-belgrade-001'` is the human-readable slug code. The repository-defined UUID primary key is `43ce68cc-5f50-42ba-b3ed-0116adf47b98`.
* **Live Supabase Schema**: Deployed production table rows and schema remain unverified.

---

## 3. Recommendation Status Semantics

* **192**: Current master physical seed dataset across Waves 1–7.
* **148**: Historical canonical/published baseline prior to backlog expansion. Superseded as total catalogue count.
* **102**: Historical earlier baseline count. Superseded.
* **113**: Historical intermediate milestone; exact documented meaning unresolved. Superseded.
* **Non-Collapsible Counts**: Physical seed record count (192) must never be conflated with canonical or published counts.
* **Repository Editorial / Backlog Breakdown**:
  * 148 Canonical Baseline
  * 4 Published
  * 27 Research Candidates
  * 5 Needs Editorial Improvement
  * 2 Needs Additional Research
  * 6 Deferred
* **Static Seed Lifecycle Limitation**: Static wave objects in `src/data/recommendations/` do not carry explicit `lifecycleStatus` properties. The visitor SPA loading 192 seed objects does not make all 192 canonically approved.

---

## 4. Partner Baseline

* **28 Static Partner Seed Records**: Defined in `src/data/partners.ts` (`part-001` through `part-028`).
* **Static Seed Status**: All 28 static seed items set `verificationStatus: 'VERIFIED'` and `conciergeRoutingEligible: 'Yes'`.
* **Operational Distinction**: Seed flag settings do NOT mean 28 live active or routable partners exist in production.
* **Live Supabase Partner State**: Live database row counts and verification flags remain unverified.
* **Demo / Test Partners**:
  * Demo partners `part-demo-uno1` (`UNO1 Concierge Services`) and `part-demo-uno2` (`UNO2 Transport & Tour Services`) exist in migration `20260803000002`.
  * Demo partners are bound to test destination `dest-demo-000` and test service area `sa-test-000`.
  * Demo partners are isolated from production routing (`sa-belgrade-001`, etc.) by service area hard filters.

---

## 5. Coverage & Routing Baseline

### Coverage Metrics
* **TOTAL RECS**: Total master recommendations evaluated in the coverage matrix.
* **GAP**: Recommendations with 0 linked active partners (`partner_count = 0`).
* **SINGLE**: Recommendations with 1 linked active partner (`partner_count = 1`).
* **COVERED**: Recommendations with 2 linked active partners (`partner_count = 2`).
* **ROBUST**: Recommendations with 3+ linked active partners (`partner_count >= 3`).
* **ACTIVE POOL**: Distinct partners actively linked to at least one recommendation in `public.partner_coverage` with status `'ACTIVE'`.
* **Directory vs Active Pool**: 28 is the static partner directory capacity, NOT the Active Pool. Default initial seed state yields `ACTIVE POOL = 0` and `GAP = 192`. Live Active Pool cannot be verified without production database access.

### Routing Predicate & Hard Filters
To receive an inquiry, a partner must satisfy all hard SQL filters in `match_inquiry_candidates` / `select_and_release_partner_coverage_secure`:
1. **Partner Account Status**: `p.status = 'ACTIVE'`
2. **Verification Status**: `p.verification_status = 'VERIFIED'`
3. **Active Recommendation Coverage**: `pc.recommendation_id = p_recommendation_id` AND `pc.status = 'ACTIVE'` in `public.partner_coverage`
4. **Service Area Coverage**: `psa.service_area_id = p_service_area_id` in `public.partner_service_areas`
5. **Concierge Routing Eligibility**: `(p.concierge_routing_eligible = 'Yes' OR p.concierge_routing_eligible IS TRUE OR p.concierge_routing_eligible IS NULL)`. Explicit `'No'` is excluded.

### Soft Ranking Signals
Applied after hard filtering: Tier assignment (`PRIMARY` / `SECONDARY` / `TERTIARY`), language capability overlap, historical response speed.

---

## 6. Direct-Contact vs Concierge Routing

* **Concierge-Eligible Partners**: Partners with `conciergeRoutingEligible: 'Yes'` participate in automated inquiry routing.
* **Direct-Contact-Only Partners**: Partners with `conciergeRoutingEligible: 'No'` (venue-only entities, splavovi, museums) are excluded from candidate selection SQL queries.
* **Frontend Enforcement**: `src/components/concierge/RecommendationDetailModal.tsx` checks `conciergeRoutingEligible`. If `'No'`, it suppresses the concierge inquiry form button and renders direct contact actions (Call, WhatsApp, Website).
* **Enforcement Dual-Layer**: Direct-contact isolation is enforced in executable SQL and frontend UI, not merely by presentation convention.

---

## 7. Destination Package / Offline Implementation

### Implemented Today
* Canonical-scope CLI JSON export utility (`scripts/exportCanonicalScope.ts`).
* SHA-256 hash generation in export utility via Node.js `crypto`.
* Local storage wrapper with exception handling (`src/lib/safeStorage.ts`).
* JSON parse error fallback and key recovery.
* Static recommendation and partner seed fallback.
* Visitor SPA startup from bundled static seed data.

### Specified / Frozen Only (Not Implemented in Runtime)
* Client-side Destination Package manager.
* Client package download/update pipeline.
* Package activation workflow.
* Client SHA-256 verification before package activation.
* Browser IndexedDB storage (code uses `window.localStorage`, NOT IndexedDB APIs like `indexedDB.open`).
* Previous-version package retention and rollback.
* RFC 8785 canonicalization runtime pipeline.
* Runtime package signing and signature verification.
* Verified destination-specific package cache namespacing.

**Architecture Status**: The Destination Package architecture is **approved and frozen as architecture**, but the full runtime package manager is not implemented in V9. `exportCanonicalScope.ts` is a CLI export utility, NOT a client package manager.

---

## 8. WP-14 Implementation Status

### Implemented / Repository-Verified
* Recommendation lifecycle/review state (`RecommendationLifecycleStatus` enum in `src/types.ts` & SQL).
* Publication state (`is_published`, `published_at` in SQL).
* Recommendation revision snapshots/history (`public.recommendation_revisions` table).
* Studio editorial workflow UI (`StudioEditorialReview.tsx`).
* Workflow service helpers (`recommendationWorkflowService.ts`).
* Matching/coverage components (`partnerIntelligenceService.ts` & RPCs).

### Partial
* Immutable event architecture (snapshots recorded, but lack PostgreSQL append-only lock triggers).
* Typed workflow handlers and derived indexes (`public.partner_coverage`).
* Feature flags (`executionMode` flags in recommendation agent).
* Workflow metrics (`StudioDashboard.tsx`).

### Specified / Frozen Only
* Formal Application State dimension (`AMBER / GREEN / RED` in UI code represents header color state, NOT WP-14 Application State).
* Handler/version registry.
* Event-driven recomputation.
* Full append-only immutable workflow event model.
* Forward-corrective rollback framework.

---

## 9. Partner Introduction Capability (PIC-01)

### Status: NOT FULLY IMPLEMENTED

### Existing Generic / Partial Building Blocks
* Partner photo URL field (`Partner.photoUrl`).
* Partner bio/profile text (`Partner.bio`).
* Partner Passport profile editing (`PartnerPassportModal.tsx`).

### Specified Only / Not Found in Code
* Dedicated stable Portfolio ID (code uses general `Partner.id`).
* Explicit photo consent state.
* Dedicated introduction text field with <=200-word enforcement.
* Introduction-specific IDEMO approval.
* Visitor-facing "Let me introduce myself" link tied to accepted inquiries.
* Post-acceptance availability gating.
* PIC-specific opaque inquiry-bound access, expiry, and revocation.
* Consent withdrawal handling.

---

## 10. Build / Test / Dependency Baseline

* **`npm run lint`**: Executes `tsc --noEmit` -> **PASS / 0 errors**.
* **`npm run build`**: Compiles Vite SPA and esbuild CJS server -> **PASS**.
* **`npx tsx src/tests/runTests.ts`**: Executes Proposal Agent Acceptance Suite -> **33 / 33 PASSED**.
* **Test Suite Scope**: `33/33` represents the Proposal Agent acceptance suite (`src/tests/proposalAgentRemediation.test.ts`), NOT the entire repository test footprint. Standalone scripts exist in `scripts/`.
* **Lint Scope**: Covers entire TypeScript codebase in `src/` and `server.ts`.
* **Dependency Audits**: `npm audit` and `npm outdated` have NOT been executed in this audit. Dependency vulnerability and freshness status is **CANNOT VERIFY**.

---

## 11. Source-of-Truth Register

| Domain | Live / Backend Authority | Repository Seed / Fallback | Governance / Specification | Verification State |
|---|---|---|---|---|
| **Recommendations** | Supabase `public.recommendations` | `src/data/recommendations/index.ts` (192 items) | `DATA_MODEL_STANDARD.md` | REPOSITORY VERIFIED / LIVE UNVERIFIED |
| **Partner Operational State** | Supabase `public.partners` | `src/data/partners.ts` (28 items) | `DATA_MODEL_STANDARD.md` | REPOSITORY VERIFIED / LIVE UNVERIFIED |
| **Service Areas** | Supabase `public.service_areas` (`UUID` PK, `code`) | `SERVICE_AREA_OPTIONS` in `recommendationWorkflowService.ts` | Migration `20260803000001` | REPOSITORY VERIFIED / LIVE UNVERIFIED |
| **Coverage / Routing** | Supabase RPCs (`select_and_release_partner_coverage_secure`, `match_inquiry_candidates`) | `StudioPartnerCoverage.tsx` (In-memory fallback) | `API_CONTRACT_SPECIFICATION.md` | REPOSITORY VERIFIED / LIVE UNVERIFIED |
| **Destination Packages** | Generated Scope Artifacts | Static seed fallback files | `IDEMO_PLATFORM_CONSTITUTION.md` | SPECIFIED / EXPORT SCRIPT ONLY |
| **Editorial Workflow** | Supabase `public.recommendation_revisions` | `src/data/editorialBacklog.ts` | WP-14 / `GOVERNANCE_VERSION.md` | PARTIALLY IMPLEMENTED |
| **Offline Storage** | Browser `localStorage` | `src/lib/safeStorage.ts` (`localStorage` wrapper) | `ARCHITECTURE_CHECKLIST.md` | REPOSITORY VERIFIED |
| **Partner Introduction** | Supabase Edge Functions / DB | `PartnerPassportModal.tsx` (Passport UI) | `EDITORIAL_PUBLISHING_POLICY.md` | SPECIFIED / PARTIAL UI ONLY |

---

## 12. Unresolved / Live Verification Required

1. Physical recommendation row count in live production Supabase instance.
2. Active partner count and verification status distribution in live production database.
3. Current Active Pool and coverage matrix values in live production database.
4. Deployed `public.service_areas` table rows and primary key values in live production database.
5. Recommendation revision snapshot row counts in live production database.
6. Storage bucket artifacts for destination packages.
7. `npm audit` vulnerability and `npm outdated` freshness status.

---

## 13. Historical / Superseded Facts

* **102**: Historical baseline count. Superseded as catalogue total.
* **113**: Historical intermediate milestone. Superseded as catalogue total.
* **148**: Historical canonical baseline before backlog expansion. Superseded as master physical catalogue total.
* **192**: Authoritative current master physical catalogue count across Waves 1–7.
* **28**: Static partner seed count; NOT the live Active Pool.
* **0**: Default/initial Active Pool state in unlinked seed state; NOT the live production value.

---

## 14. Engineering Continuity Rule

Before issuing any implementation instruction affecting volatile state, the Engineering Office must:
1. Read this document.
2. Verify whether the affected fact may have changed.
3. Prefer live/runtime evidence over repository assumptions.
4. Reconcile conflicts before implementation.
5. Update this document at approved work-package closeout.

If current V9 repository or runtime state cannot be verified where required:
**BASELINE NOT RE-VERIFIED — IMPLEMENTATION INSTRUCTIONS BLOCKED**
