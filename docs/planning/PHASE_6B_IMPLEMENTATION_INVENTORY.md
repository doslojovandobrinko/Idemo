# Phase 6B Implementation Inventory

## 1. Document Purpose

This document converts the verified current-state architecture baseline (`/docs/audits/PHASE_6B_ARCHITECTURE_BASELINE.md`) into a controlled, itemized Phase 6B work inventory. It specifies current evidence, required sources of truth, operational classifications, readiness statuses, dependency structures, release impacts, and verification standards for every subsystem in the IDEMO ecosystem.

**Notice:** This document serves as a planning and governance tool. It does not authorise code execution, database modification, or implementation by itself. Implementation must occur under explicit, gate-by-gate approval.

---

## 2. Authoritative References

1. `/GEMINI.md` — Mandatory Repository Instructions
2. `/docs/governance/GOVERNANCE_VERSION.md` — Governance Framework Version 1.0 (APPROVED)
3. `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` — IDEMO Platform Constitution
4. `/docs/governance/API_CONTRACT_SPECIFICATION.md` — API Contract Specification
5. `/docs/governance/SECURITY_MODEL.md` — Security Model & Credential Governance
6. `/docs/governance/CHANGE_CONTROL_POLICY.md` — Change Control & Release Classification Policy
7. `/docs/audits/PHASE_6B_ARCHITECTURE_BASELINE.md` — Verified Current-State Architecture Baseline

---

## 3. Classification Definitions

### Current-State Classifications
* **`KEEP`**: Existing component/code that is validated and must remain unchanged in core logic or structure.
* **`CONNECT`**: Existing frontend/backend component that requires network, API client, or Edge Function wiring.
* **`EXTEND`**: Existing schema, Edge Function, or component requiring additive interface, type, or handler capabilities.
* **`REPLACE`**: Temporary or local mechanism that must be substituted with a server-authoritative implementation.
* **`CREATE`**: New asset (e.g. API client abstraction, type contract mapper) that must be built.
* **`REMOVE AFTER PARITY`**: Static asset or mock fallback retained temporarily during transition and removed only after verified backend parity.
* **`DEFER`**: Out-of-scope feature deferred to future phases beyond Phase 6B.
* **`UNKNOWN`**: Aspect requiring targeted verification prior to implementation.

### Readiness Classifications
* **`READY`**: Backend or frontend asset fully prepared for integration without prerequisite schema or RPC work.
* **`READY WITH CONDITIONS`**: Asset ready for integration once prerequisite Gate foundation work is completed.
* **`BLOCKED`**: Asset blocked by missing contract, unverified RPC parameter, or environment blocker.
* **`UNKNOWN`**: Readiness status undetermined due to unverified runtime dependencies.

### Release Classifications
* **`DOCUMENTATION ONLY`**: No code, database, or app build changes required; documentation update only.
* **`BACKEND DEPLOYMENT`**: Changes deployed to Supabase PostgreSQL or Edge Functions; no mobile app store release required.
* **`FRONTEND BUILD`**: Changes built and deployed to Web/Cloud Run presentation container.
* **`MOBILE STORE RELEASE`**: Native app bundle rebuild required for distribution via Google Play / Apple App Store.
* **`NO RELEASE`**: Internal development or testing change with no production deployment trigger.
* **`REQUIRES REVIEW`**: Release impact contingent upon architectural evaluation.

---

## 4. Phase 6B Master Inventory

| ID | Subsystem | Current Evidence | Current Source of Truth | Required Source of Truth | Classification | Readiness | Dependencies | Likely Files or Areas | Release Impact | Required Validation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P6B-001** | Application Bootstrap Configuration | Hardcoded fallback config in `App.tsx` | Client Bundle | Supabase `system_settings` via API | `CREATE` | `READY WITH CONDITIONS` | None | `/src/lib/api/config.ts`, `App.tsx` | `FRONTEND BUILD` | T6B-001, T6B-017 |
| **P6B-002** | Feature Flags | Hardcoded boolean checks in UI components | Client Bundle | Supabase `feature_flags` via API | `CREATE` | `READY WITH CONDITIONS` | P6B-001 | `/src/lib/api/featureFlags.ts` | `FRONTEND BUILD` | T6B-001 |
| **P6B-003** | Recommendation Catalogue | Static arrays in `/src/data/recommendations/serbia/*.ts` | Static TS Bundles | Supabase `public.recommendations` | `CONNECT` | `READY WITH CONDITIONS` | P6B-036 | `/src/data/recommendations/`, `/src/lib/api/recommendations.ts` | `FRONTEND BUILD` | T6B-013, T6B-014 |
| **P6B-004** | Recommendation Details | Local array lookup in `App.tsx` / `PlanCard.tsx` | Static TS Bundles | Supabase `public.recommendations` | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `/src/lib/api/recommendations.ts` | `FRONTEND BUILD` | T6B-013 |
| **P6B-005** | Recommendation Translations | Static dictionary in `/src/data/translations/` | Static TS Bundles | Supabase `public.recommendation_translations` | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `/src/lib/api/translations.ts` | `FRONTEND BUILD` | T6B-014 |
| **P6B-006** | Recommendation Images | Static assets in `/public/images/` & external URLs | Static TS Assets | Supabase Storage (`recommendation-images`) | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `LazyImage.tsx`, `/src/lib/api/storage.ts` | `FRONTEND BUILD` | T6B-015 |
| **P6B-007** | Recommendation Publication Status | Inferred from static inclusion | Client Bundle | Supabase `publication_status = 'published'` | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `/src/lib/api/recommendations.ts` | `BACKEND DEPLOYMENT` | T6B-005, T6B-013 |
| **P6B-008** | Recommendation Collections | Static grouping logic in UI components | Static TS Logic | Supabase `public.collections` | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `/src/lib/api/collections.ts` | `FRONTEND BUILD` | T6B-013 |
| **P6B-009** | Mood Orbit Attributes | Static `coordinateX`, `coordinateY` in TS objects | Static TS Objects | Supabase `public.recommendations` (coordinate fields) | `CONNECT` | `READY WITH CONDITIONS` | P6B-003 | `MoodOrbit.tsx`, `preferenceEngine.ts` | `FRONTEND BUILD` | T6B-013 |
| **P6B-010** | Recommendation Ranking Inputs | Local calculation in `recommendationEngine.ts` | Client Calculation | Client Calculation with Supabase dynamic inputs | `KEEP` | `READY` | P6B-003 | `/src/lib/recommendationEngine.ts` | `FRONTEND BUILD` | T6B-013 |
| **P6B-011** | Search and Filtering | Client JS array filtering in UI | Client JS Memory | Server RPC search + Client filtering fallback | `EXTEND` | `READY WITH CONDITIONS` | P6B-003 | `/src/lib/api/search.ts`, `App.tsx` | `FRONTEND BUILD` | T6B-013 |
| **P6B-012** | Partner Records | Static array in `/src/data/partners.ts` | Static TS Array | Supabase `public.partners` | `CONNECT` | `READY WITH CONDITIONS` | P6B-036 | `/src/data/partners.ts`, `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005 |
| **P6B-013** | Partner Authentication | Client PIN comparison in `PartnersScreen.tsx` | Client React State | Supabase `validate_partner_pin` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-012 | `PartnersScreen.tsx`, `/src/lib/api/partnerAuth.ts` | `FRONTEND BUILD` | T6B-005, T6B-006 |
| **P6B-014** | Partner Capabilities | Static strings in `partners.ts` | Static TS Array | Supabase `public.partner_capabilities` | `CONNECT` | `READY WITH CONDITIONS` | P6B-012 | `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005 |
| **P6B-015** | Partner Languages | Static strings in `partners.ts` | Static TS Array | Supabase `public.partner_languages` | `CONNECT` | `READY WITH CONDITIONS` | P6B-012 | `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005 |
| **P6B-016** | Partner Service Areas | Static strings in `partners.ts` | Static TS Array | Supabase `public.service_areas` | `CONNECT` | `READY WITH CONDITIONS` | P6B-012 | `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005 |
| **P6B-017** | Partner Availability | Client state toggles in `PartnersScreen.tsx` | Client React State | Supabase `public.partners.status` via RPC | `CONNECT` | `READY WITH CONDITIONS` | P6B-012 | `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005 |
| **P6B-018** | Recommendation-to-Partner Linkage | Spatial coordinate matching in `partners.ts` | Static TS Logic | Supabase `public.recommendation_partners` | `CONNECT` | `READY WITH CONDITIONS` | P6B-003, P6B-012 | `/src/lib/api/partners.ts` | `FRONTEND BUILD` | T6B-005, T6B-013 |
| **P6B-019** | Visitor Inquiry Creation | Client-side save to `idemo_saved_plans_v1` | Local Storage | Supabase `/functions/v1/create_public_inquiry` | `REPLACE` | `READY WITH CONDITIONS` | P6B-036, P6B-037 | `PlanCard.tsx`, `/src/lib/api/inquiries.ts` | `FRONTEND BUILD` | T6B-008, T6B-010 |
| **P6B-020** | Inquiry Candidate Generation | Local match logic in UI | Local JS State | Supabase `generate_inquiry_matches` RPC | `KEEP` | `READY` | P6B-019 | `/supabase/migrations/20260712000001_*.sql` | `BACKEND DEPLOYMENT` | T6B-005, T6B-008 |
| **P6B-021** | Partner Opportunity Retrieval | Client array slice in `PartnersScreen.tsx` | Local JS Memory | Supabase `get_partner_opportunities` RPC | `CONNECT` | `READY WITH CONDITIONS` | P6B-013, P6B-019 | `PartnersScreen.tsx`, `/src/lib/api/partnerOps.ts` | `FRONTEND BUILD` | T6B-005, T6B-009 |
| **P6B-022** | Partner Acceptance | Local status update in `PartnersScreen.tsx` | Local React State | Supabase `process_partner_response` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-021 | `PartnersScreen.tsx`, `/src/lib/api/partnerOps.ts` | `FRONTEND BUILD` | T6B-005, T6B-009 |
| **P6B-023** | Partner Pass or Decline | Local status update in `PartnersScreen.tsx` | Local React State | Supabase `process_partner_response` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-021 | `PartnersScreen.tsx`, `/src/lib/api/partnerOps.ts` | `FRONTEND BUILD` | T6B-005, T6B-009 |
| **P6B-024** | Partner Release or Withdrawal | Not implemented in UI | None | Supabase `process_partner_response` RPC | `CONNECT` | `READY WITH CONDITIONS` | P6B-022 | `/src/lib/api/partnerOps.ts` | `FRONTEND BUILD` | T6B-005, T6B-009 |
| **P6B-025** | Visitor Inquiry Recovery | Reading `idemo_saved_plans_v1` | Local Storage | Supabase `/functions/v1/visitor_resolution` | `CONNECT` | `READY WITH CONDITIONS` | P6B-019 | `/src/lib/api/visitorResolution.ts` | `FRONTEND BUILD` | T6B-008, T6B-016 |
| **P6B-026** | Visitor Status Retrieval | Reading local React state | Local React State | Supabase `resolve_visitor_inquiry` RPC | `CONNECT` | `READY WITH CONDITIONS` | P6B-025 | `/src/lib/api/visitorResolution.ts` | `FRONTEND BUILD` | T6B-008, T6B-010 |
| **P6B-027** | Visitor Confirmation | Local UI dialog dismissal | Local React State | Supabase `resolve_visitor_inquiry` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-026 | `PlanCard.tsx`, `/src/lib/api/visitorResolution.ts` | `FRONTEND BUILD` | T6B-008, T6B-010 |
| **P6B-028** | Visitor Decline | Local UI dialog dismissal | Local React State | Supabase `resolve_visitor_inquiry` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-026 | `/src/lib/api/visitorResolution.ts` | `FRONTEND BUILD` | T6B-008, T6B-010 |
| **P6B-029** | Visitor Alternative Request | Local UI state toggle | Local React State | Supabase `resolve_visitor_inquiry` RPC | `REPLACE` | `READY WITH CONDITIONS` | P6B-026 | `/src/lib/api/visitorResolution.ts` | `FRONTEND BUILD` | T6B-008, T6B-010 |
| **P6B-030** | Notification Outbox | Backend DB queue (`public.notification_outbox`) | Supabase PostgreSQL | Supabase PostgreSQL (`public.notification_outbox`) | `KEEP` | `READY` | None | `/supabase/migrations/20260712000004_*.sql` | `BACKEND DEPLOYMENT` | T6B-005, T6B-011 |
| **P6B-031** | Notification Worker | Edge Function `/functions/v1/notification_worker` | Supabase Edge Func | Supabase Edge Function | `KEEP` | `READY` | P6B-030 | `/supabase/functions/notification_worker/` | `BACKEND DEPLOYMENT` | T6B-007, T6B-011 |
| **P6B-032** | Scheduler and Expiry Handling | Edge Function `/functions/v1/cron_scheduler` | Supabase Edge Func | Supabase Edge Function & Cron | `KEEP` | `READY` | None | `/supabase/functions/cron_scheduler/` | `BACKEND DEPLOYMENT` | T6B-007, T6B-012 |
| **P6B-033** | Audit Logging | DB Table `public.audit_logs` via RPC triggers | Supabase PostgreSQL | Supabase PostgreSQL (`public.audit_logs`) | `KEEP` | `READY` | None | All SQL Migrations | `BACKEND DEPLOYMENT` | T6B-005 |
| **P6B-034** | Rate Limiting | DB Function `check_rate_limit` | Supabase PostgreSQL | Supabase PostgreSQL RPCs & Edge Functions | `KEEP` | `READY` | None | All SQL Migrations & Functions | `BACKEND DEPLOYMENT` | T6B-005, T6B-007 |
| **P6B-035** | Local Storage | Utility in `/src/lib/safeStorage.ts` | Browser `localStorage` | Browser `localStorage` (Transient cache & offline) | `EXTEND` | `READY` | None | `/src/lib/safeStorage.ts` | `FRONTEND BUILD` | T6B-016 |
| **P6B-036** | Frontend API Client | Non-existent; direct TS data access | None | Unified API Client (`/src/lib/api/client.ts`) | `CREATE` | `READY` | None | `/src/lib/api/client.ts`, `/src/lib/api/types.ts` | `FRONTEND BUILD` | T6B-001, T6B-002 |
| **P6B-037** | Error Normalisation | Unstructured local error strings | None | Normalized API Contract Error Handler | `CREATE` | `READY WITH CONDITIONS` | P6B-036 | `/src/lib/api/errors.ts` | `FRONTEND BUILD` | T6B-003, T6B-004 |
| **P6B-038** | Offline & Degraded-Network Behaviour | Implicit browser handling | Browser default | Offline-first queue + cached fallback reading | `CREATE` | `READY WITH CONDITIONS` | P6B-035, P6B-036 | `/src/lib/api/offlineQueue.ts` | `FRONTEND BUILD` | T6B-016, T6B-017 |
| **P6B-039** | Production Mock Removal | Static TS data objects in `/src/data/` | Static Files | Dynamic Supabase data sources | `REMOVE AFTER PARITY` | `READY WITH CONDITIONS` | P6B-003, P6B-012, P6B-019 | `/src/data/partners.ts`, `/src/data/recommendations/` | `FRONTEND BUILD` | T6B-013, T6B-018 |
| **P6B-040** | Environment Separation | Local `.env.example` file | Local Dev `.env` | Separated `.env` for Development, Staging, Production | `EXTEND` | `READY` | None | `/.env.example` | `NO RELEASE` | T6B-001 |
| **P6B-041** | Staging-to-Production Promotion | Manual process | Manual | Controlled Migration & Edge Function Deployment | `CREATE` | `READY WITH CONDITIONS` | All Gates | `/scripts/` | `NO RELEASE` | T6B-021 |
| **P6B-042** | End-to-End Test Harness | Manual user testing in UI | Manual | Automated E2E & Contract Verification Harness | `CREATE` | `READY WITH CONDITIONS` | P6B-036 | `/src/tests/` | `NO RELEASE` | T6B-020, T6B-021 |
| **P6B-043** | Regression Testing | Manual verification | Manual | Automated Jest/Vitest UI & API suite | `CREATE` | `READY WITH CONDITIONS` | P6B-042 | `/src/tests/` | `NO RELEASE` | T6B-018, T6B-020 |
| **P6B-044** | Architecture Enforcement Tests | Baseline checklists | Governance Docs | Automated Static Analysis & Lint Checks | `EXTEND` | `READY` | None | `package.json`, scripts | `NO RELEASE` | T6B-002, T6B-005 |
| **P6B-045** | Release Readiness | Manual verification | Manual | Signed Audit Checklist & Parity Certificate | `CREATE` | `READY WITH CONDITIONS` | All Items | `/docs/audits/` | `NO RELEASE` | T6B-022 |

---

## 5. Current Source-of-Truth Matrix

| Domain | Current Authority | Required Authority | Authority Conflict? | Phase 6B Action |
| :--- | :--- | :--- | :---: | :--- |
| **Recommendations** | Static TS Files (`/src/data/recommendations/`) | Supabase `public.recommendations` | **YES** | Connect frontend to API client; retain static fallback until parity verified. |
| **Recommendation Images** | Static relative asset paths (`/public/images/`) | Supabase Storage (`recommendation-images`) | **YES** | Map image URLs dynamically from Supabase; preserve local assets as fallback. |
| **Translations** | Static TS Dictionary (`/src/data/translations/`) | Supabase `public.recommendation_translations` | **YES** | Fetch localized content from Supabase RPCs based on active language. |
| **Partners** | Static TS Array (`/src/data/partners.ts`) | Supabase `public.partners` | **YES** | Transition partner retrieval to Supabase RPCs. |
| **Partner Availability** | Client React State (`PartnersScreen.tsx`) | Supabase `public.partners.status` | **YES** | Bind availability toggles to SECURITY DEFINER partner RPC. |
| **Inquiries** | Local Storage (`idemo_saved_plans_v1`) | Supabase `public.inquiries` | **YES** | Replace local-only creation with `/functions/v1/create_public_inquiry`. |
| **Partner Responses** | Local React State (`PartnersScreen.tsx`) | Supabase `public.partner_responses` | **YES** | Replace local state mutations with `process_partner_response` RPC calls. |
| **Visitor Resolution** | Local UI State | Supabase `public.inquiry_matches` | **YES** | Wire visitor confirm/decline actions to `resolve_visitor_inquiry` RPC. |
| **Routing & Matching** | Local JS calculation | Supabase PostgreSQL `generate_inquiry_matches` | **YES** | Retain deterministic routing inside PostgreSQL RPCs exclusively. |
| **Notification State** | Non-existent in UI | Supabase `public.notification_outbox` | **NO** | Keep outbox authoritative in PostgreSQL; trigger via Edge Functions. |
| **App Configuration** | Hardcoded client variables | Supabase `public.system_settings` | **YES** | Fetch dynamic settings on application boot. |
| **Feature Flags** | Hardcoded boolean checks | Supabase `public.feature_flags` | **YES** | Load feature flag map during application initialization. |
| **Local Cached State** | Browser `localStorage` (`safeStorage.ts`) | Browser `localStorage` (Transient) | **NO** | Re-classify local storage strictly as an offline cache and user preferences store. |

---

## 6. Existing Backend Assets to Preserve

| Asset Name | Asset Type & Location | Purpose | Verified Status | Phase 6B Treatment | Dependency Significance |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `20260712000000_phase1_foundation.sql` | Migration (`/supabase/migrations/`) | Foundation tables, RLS policies, audit logs, service areas | **VERIFIED** | `KEEP` — Preserve immutable historical migration. | Critical baseline for core database schema. |
| `20260712000001_phase2_inquiry_pipeline.sql` | Migration (`/supabase/migrations/`) | Inquiry pipeline, reference code generator, candidate matching | **VERIFIED** | `KEEP` — Core inquiry creation engine. | Critical for visitor inquiry creation. |
| `20260712000002_phase3_partner_lifecycle.sql` | Migration (`/supabase/migrations/`) | Partner accounts, PIN auth, offer locking, response RPC | **VERIFIED** | `KEEP` — Partner opportunity and response engine. | Critical for partner workflow. |
| `20260712000003_phase4_visitor_resolution.sql` | Migration (`/supabase/migrations/`) | Visitor token validation, inquiry resolution RPC | **VERIFIED** | `KEEP` — Visitor confirmation state machine. | Critical for visitor decision resolution. |
| `20260712000004_phase5_operations.sql` | Migration (`/supabase/migrations/`) | Notification outbox, template engine, watchdog RPC | **VERIFIED** | `KEEP` — Transactional notification outbox. | Critical for operations and messaging. |
| `20260713000001_phase5_final_reliability.sql` | Migration (`/supabase/migrations/`) | Reliability patches, transaction isolation bounds | **VERIFIED** | `KEEP` — Reliability and isolation controls. | Essential for transaction safety. |
| `20260714000000_phase6_clean_unused_variables.sql` | Migration (`/supabase/migrations/`) | Parameter cleanup for PL/pgSQL strict linting | **VERIFIED** | `KEEP` — Clean PL/pgSQL parameter foundation. | Essential for clean compilation. |
| `create_public_inquiry` | Edge Function (`/supabase/functions/`) | Public atomic inquiry handler with pre-RPC payload validation | **VERIFIED** | `CONNECT` — Wire frontend API client to endpoint. | Public entry point for inquiries. |
| `notification_worker` | Edge Function (`/supabase/functions/`) | Outbox processor executing transactional email/SMS dispatches | **VERIFIED** | `KEEP` — Preserve background worker handler. | Operates autonomously via scheduler. |
| `cron_scheduler` | Edge Function (`/supabase/functions/`) | Worker trigger executing watchdogs and processing offer expiries | **VERIFIED** | `KEEP` — Preserve scheduler and watchdog trigger. | Operates autonomously via cron. |
| `visitor_resolution` | Edge Function (`/supabase/functions/`) | Validates visitor tokens and executes resolution RPC | **VERIFIED** | `CONNECT` — Wire visitor resolution actions. | Secured entry point for visitor actions. |

---

## 7. Frontend Assets Requiring Integration

| Area / File | Current Responsibility | Future Status | Authority Transition | Integration Need | Regression Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/src/App.tsx` | App state, tab routing, static recommendation rendering | `EXTEND` | Retains UI navigation state; delegates data fetching to API client | Requires API client hook binding for initial load and inquiry creation | High — Global state disruption if API loading state handled improperly |
| `/src/components/PlanCard.tsx` | Inquiry creation UI & local plan bookmarking | `CONNECT` | Delegates inquiry submission to `/functions/v1/create_public_inquiry` | Replace local-only save with API call | Medium — Form submission UX regression |
| `/src/components/PartnersScreen.tsx` | Partner opportunity review & PIN login | `CONNECT` | Delegates PIN auth and response actions to Supabase RPCs | Replace local PIN comparison and state toggles | High — Security and workflow regression if PIN validation fails |
| `/src/components/PartnerCard.tsx` | Partner card layout & interaction | `CONNECT` | Receives dynamic partner props from API client | Bind dynamic props from backend partner records | Low — Visual layout component |
| `/src/data/partners.ts` | Static partner records & PIN definitions | `REMOVE AFTER PARITY` | Authority moves to Supabase `public.partners` | Retain as offline fallback until parity verified | High — Data mismatch during transition |
| `/src/data/recommendations/` | Static recommendation arrays | `REMOVE AFTER PARITY` | Authority moves to Supabase `public.recommendations` | Retain as offline fallback until parity verified | High — Catalogue display regression if API fails |
| `/src/lib/safeStorage.ts` | Local browser storage utility | `EXTEND` | Re-classified for transient caching and user preferences | Add typed wrapper for offline queueing | Low — Non-breaking helper utility |
| `/src/lib/recommendationEngine.ts` | On-device recommendation scoring & filtering | `KEEP` | Retains client-side ranking algorithm using dynamic input data | Feed dynamic inputs from Supabase API client | Medium — Ranking score distortion if props change |
| `/src/lib/preferenceEngine.ts` | On-device taste profile tracking | `KEEP` | Authoritative for local device taste preferences | Read/write local storage; complement backend recommendations | Low — Self-contained local engine |

---

## 8. Mock and Local-State Disposition Register

| Item | File or Key | Current Purpose | Production Risk | Temporary Disposition | Removal Condition |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Static Recommendation Datasets | `/src/data/recommendations/serbia/*.ts` | In-memory recommendation content | Out-of-date or unverified content served to users | `REMOVE AFTER PARITY` | Retained as secondary offline fallback; removed when Supabase catalogue reaches 100% parity. |
| Static Partner Records | `/src/data/partners.ts` | In-memory partner profiles and PINs | Insecure client PIN exposure & inaccurate partner status | `REMOVE AFTER PARITY` | Retained as fallback during development; removed when Supabase partner auth is verified. |
| Hardcoded Partner PINs | `pin: '2001'`, `pin: '2002'` in `partners.ts` | Local partner login simulation | Critical Security Risk — exposed partner credentials | `REMOVE AFTER PARITY` | Disabled immediately upon connecting `validate_partner_pin` RPC. |
| Local Inquiry Persistence | `idemo_saved_plans_v1` in `safeStorage.ts` | Saved plans & simulated inquiries | Inquiries unrecorded in backend operational pipeline | `REMOVE AFTER PARITY` | Re-classified as local saved bookmarks; removed as primary inquiry storage once API connected. |
| Client-Generated Fake Reference Codes | `ref-` + random string in `PlanCard.tsx` | Simulated inquiry tracking | Non-existent reference codes in production database | `REPLACE` | Replaced immediately by server-generated reference code from `/functions/v1/create_public_inquiry`. |
| Simulated Success Modals | Immediate UI closure without network call | False positive success feedback | User believes inquiry submitted when unrecorded | `REPLACE` | Replaced by async promise resolution from API client call. |

---

## 9. Dependency Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate A: Contract and Configuration Foundation                           │
│ (P6B-001, P6B-002, P6B-036, P6B-037, P6B-040)                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate B: Recommendation Content Integration                              │
│ (P6B-003, P6B-004, P6B-005, P6B-006, P6B-007, P6B-008, P6B-009, P6B-011) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate C: Partner Data Integration                                        │
│ (P6B-012, P6B-013, P6B-014, P6B-015, P6B-016, P6B-017, P6B-018)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate D: Visitor Inquiry Integration                                     │
│ (P6B-019, P6B-020, P6B-025, P6B-026)                                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate E: Partner Workflow Integration                                    │
│ (P6B-021, P6B-022, P6B-023, P6B-024)                                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate F: Visitor Resolution Integration                                  │
│ (P6B-027, P6B-028, P6B-029)                                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate G: Notifications and Operational Validation                        │
│ (P6B-030, P6B-031, P6B-032, P6B-033, P6B-034, P6B-038)                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Gate H: Parity, Mock Removal and Release Validation                     │
│ (P6B-039, P6B-041, P6B-042, P6B-043, P6B-044, P6B-045)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Gate Requirements Summary

#### Gate A — Contract and Configuration Foundation
* **Prerequisite Gates**: None
* **Entry Conditions**: Approved Governance Framework v1.0 and Architecture Baseline Audit.
* **Exit Conditions**: Typed API client (`/src/lib/api/client.ts`), error handlers, and config loaders established; `tsc` and `lint_applet` passing.
* **Blockers**: Missing Supabase URL/Anon Key configuration in development environment.
* **Evidence Required**: Successful instantiation of API client and verified error code normalization.

#### Gate B — Recommendation Content Integration
* **Prerequisite Gates**: Gate A
* **Entry Conditions**: Verified API client interface in place.
* **Exit Conditions**: React UI loads recommendations, translations, collections, and image URLs dynamically from Supabase with static fallback; zero visual regression.
* **Blockers**: Empty `public.recommendations` table in Supabase instance.
* **Evidence Required**: Network payload inspection verifying recommendation fetch and UI render.

#### Gate C — Partner Data Integration
* **Prerequisite Gates**: Gate B
* **Entry Conditions**: Successful recommendation dataset connectivity.
* **Exit Conditions**: Partner profiles, service areas, and availability state retrieved via API; PIN login validated via `validate_partner_pin` RPC.
* **Blockers**: Missing partner seed data in database.
* **Evidence Required**: PIN login test passing against backend RPC.

#### Gate D — Visitor Inquiry Integration
* **Prerequisite Gates**: Gate C
* **Entry Conditions**: Verified partner authentication and recommendation catalogue.
* **Exit Conditions**: Visitor inquiry submission via `/functions/v1/create_public_inquiry` returning real reference code; local mock generator disabled.
* **Blockers**: Unhandled Edge Function payload validation errors.
* **Evidence Required**: Database query confirming new row in `public.inquiries` with valid reference code.

#### Gate E — Partner Workflow Integration
* **Prerequisite Gates**: Gate D
* **Entry Conditions**: Active inquiries present in database.
* **Exit Conditions**: Partner opportunity dashboard retrieving live opportunities via `get_partner_opportunities` RPC; response submission (accept/pass) executing via `process_partner_response`.
* **Blockers**: RLS policy blocking partner account query.
* **Evidence Required**: Audit log verification of partner response transaction.

#### Gate F — Visitor Resolution Integration
* **Prerequisite Gates**: Gate E
* **Entry Conditions**: Inquiry matches in `offered` status present.
* **Exit Conditions**: Visitor resolution screen validating visitor tokens and processing confirm/decline actions via `/functions/v1/visitor_resolution`.
* **Blockers**: Invalid visitor token validation logic.
* **Evidence Required**: Terminal status transition (`resolved`/`cancelled`) recorded in `public.inquiries`.

#### Gate G — Notifications and Operational Validation
* **Prerequisite Gates**: Gate F
* **Entry Conditions**: Complete end-to-end transaction flow executing in database.
* **Exit Conditions**: Outbox processing verified via `notification_worker`; watchdog execution verified via `cron_scheduler`; offline queue operational.
* **Blockers**: Missing worker secret environment credentials.
* **Evidence Required**: Outbox queue state transitioning from `queued` to `sent` or `processing`.

#### Gate H — Parity, Mock Removal and Release Validation
* **Prerequisite Gates**: Gate G
* **Entry Conditions**: 100% end-to-end transaction test suite passing green.
* **Exit Conditions**: Static fallback mocks safely removed or quarantined; build verification passing; Signed Release Readiness Certificate (P6B-045) issued.
* **Blockers**: Unresolved regression test failures or remaining hardcoded production credentials.
* **Evidence Required**: Clean `compile_applet` and `lint_applet` outputs with zero mock dependencies in active production code path.

---

## 10. Critical Path

The minimum critical path required to complete the core visitor-to-partner transaction loop:

1. **P6B-036**: Establish Frontend API Client (`/src/lib/api/client.ts`)
2. **P6B-003**: Connect Recommendation Catalogue Fetch
3. **P6B-012**: Connect Partner Profiles Fetch
4. **P6B-013**: Wire Partner PIN Authentication (`validate_partner_pin` RPC)
5. **P6B-019**: Connect Visitor Inquiry Creation (`/functions/v1/create_public_inquiry`)
6. **P6B-021**: Connect Partner Opportunity Retrieval (`get_partner_opportunities` RPC)
7. **P6B-022**: Wire Partner Response Acceptance (`process_partner_response` RPC)
8. **P6B-025**: Connect Visitor Inquiry Recovery (`/functions/v1/visitor_resolution`)
9. **P6B-027**: Wire Visitor Decision Confirmation (`resolve_visitor_inquiry` RPC)
10. **P6B-039**: Retire Production Fallback Mocks after verified parity

---

## 11. Deferred Scope

The following items are explicitly **excluded** from Phase 6B and deferred to future releases:

1. **Gemini Direct Publishing**: AI-generated recommendation or translation auto-publishing without human editorial intervention.
2. **AI-Driven Inquiry Routing**: Autonomous partner selection or inquiry assignment driven by LLM agents.
3. **Semantic / Vector Search**: Embedding-based vector search implementation in PostgreSQL.
4. **Supabase Realtime Subscriptions**: WebSocket-based live state streaming (polling or fetch-on-action is enforced).
5. **Dynamic Pricing & Payment Gateways**: Credit card, Stripe, or payment escrow processing.
6. **Full Editorial Portal UI**: Comprehensive web management interface for editorial teams (database migrations support editorial states, but UI portal is deferred).
7. **Major Consumer UI Redesign**: Altering the established IDEMO Editorial Luxury Design Language or layout structure.

---

## 12. Known Blockers and Unknowns

| ID | Blocker or Unknown | Evidence | Why It Matters | Required Resolution Before Which Gate? |
| :--- | :--- | :--- | :--- | :--- |
| **BLK-001** | Supabase Project Credentials in Dev Environment | `.env.example` lacks `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` | Frontend cannot instantiate Supabase client without runtime endpoint configuration | **Gate A** |
| **BLK-002** | Initial Database Seed Data Volume | `20260712000000_*.sql` establishes schema; live database seed state unverified | Empty backend tables will cause frontend API fetch to return empty arrays | **Gate B** |
| **BLK-003** | Storage Bucket Public Access Policy | Storage bucket `recommendation-images` declared in migration; bucket creation in active instance unverified | Image URLs will return 404/403 if storage bucket policies are missing | **Gate B** |
| **UNK-001** | Production Network Latency under Cold Start | Supabase Edge Function cold start latency unmeasured in current container environment | Edge Function delays may impact initial visitor inquiry creation response time | **Gate D** |

---

## 13. Testing Inventory

| Test ID | Test Name | Applies to Inventory IDs | Required Gate | Pass Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **T6B-001** | API Client Instantiation & Configuration Test | P6B-001, P6B-002, P6B-036, P6B-040 | **Gate A** | Client initializes with valid endpoint headers without throwing exceptions. |
| **T6B-002** | Static Analysis & Type Safety Check | P6B-036, P6B-037, P6B-044 | **Gate A** | `tsc --noEmit` returns zero type errors. |
| **T6B-003** | API Error Contract Normalization Test | P6B-037 | **Gate A** | Error payload correctly maps HTTP status to `INVALID_INPUT` / `UNAUTHORIZED` codes. |
| **T6B-004** | Security Boundary Audit (No Secret Leakage) | P6B-036, P6B-040, P6B-044 | **Gate A** | Client bundle search verifies zero presence of service-role key or worker secrets. |
| **T6B-005** | Database Migration & RPC Lint Audit | P6B-007, P6B-012, P6B-020, P6B-033, P6B-034 | **Gate B** | `npx supabase db lint` returns zero errors across all 7 migrations. |
| **T6B-006** | Partner PIN Authentication RPC Test | P6B-013 | **Gate C** | Valid PIN returns success token; invalid PIN returns 401 Unauthorized via RPC. |
| **T6B-007** | Edge Function Authorization & Payload Test | P6B-031, P6B-032, P6B-034 | **Gate C** | Edge Function rejects unauthenticated calls and accepts valid worker secrets. |
| **T6B-008** | Atomic Public Inquiry Creation Test | P6B-019, P6B-020, P6B-025, P6B-026, P6B-027 | **Gate D** | Successful POST to `/functions/v1/create_public_inquiry` returns UUID and public reference code. |
| **T6B-009** | Partner Response & Match Lock Test | P6B-021, P6B-022, P6B-023, P6B-024 | **Gate E** | First partner acceptance locks `inquiry_matches` row; subsequent attempt fails gracefully. |
| **T6B-010** | Visitor Resolution State Machine Test | P6B-026, P6B-027, P6B-028, P6B-029 | **Gate F** | Visitor confirmation transitions inquiry status to `resolved` with immutable audit log. |
| **T6B-011** | Transactional Notification Outbox Test | P6B-030, P6B-031 | **Gate G** | Inquiry event queues outbox record; `notification_worker` marks row as `sent`. |
| **T6B-012** | Cron Scheduler & Watchdog Test | P6B-032 | **Gate G** | Scheduled watchdog run identifies expired offers and transitions state to `expired`. |
| **T6B-013** | Recommendation Catalogue Integration Parity | P6B-003, P6B-004, P6B-008, P6B-009, P6B-010 | **Gate B** | UI displays identical recommendation count and detail accuracy from Supabase API fetch. |
| **T6B-014** | Multilingual Translation Parity Test | P6B-005 | **Gate B** | UI language switch seamlessly renders EN, SR, and ZH strings from translation tables. |
| **T6B-015** | Storage Image Asset Resolution Test | P6B-006 | **Gate B** | All recommendation image cards load valid visual assets with HTTP 200 status. |
| **T6B-016** | Offline Cache & Degraded Network Test | P6B-025, P6B-035, P6B-038 | **Gate G** | App gracefully renders cached recommendations and queues inquiries when network offline. |
| **T6B-017** | Application Build Verification | P6B-001, P6B-038 | **Gate H** | `npm run build` completes successfully producing valid production bundle in `dist/`. |
| **T6B-018** | UI Visual Regression Check | P6B-039, P6B-043 | **Gate H** | Mobile viewport inspection confirms zero visual layout shift or contrast degradation. |
| **T6B-019** | Android Build & Verification | P6B-043 | **Gate H** | Android container compilation passes cleanly without native bridge errors. |
| **T6B-020** | iOS Viewport Verification | P6B-042, P6B-043 | **Gate H** | iOS mobile safari viewport verification confirms 100% layout and touch target compliance. |
| **T6B-021** | End-to-End Staging Validation | P6B-041, P6B-042 | **Gate H** | Complete visitor-to-partner transaction loop passes 100% green in staging environment. |
| **T6B-022** | Final Release Readiness Certification | P6B-045 | **Gate H** | Signed audit document confirms all 22 tests passed and zero governance violations exist. |

---

## 14. Release Impact Matrix

| Operation / Change | Database Deployment? | Edge Function Deploy? | Frontend Build? | Google Play Release? | Apple App Store Release? | Docs Update? | Regression Test? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Adding a Recommendation** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Editing Recommendation Text** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Replacing an Image** | ❌ No (Storage Upload) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Adding a Translation** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Adding a Partner** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Changing Partner Availability** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Changing Routing Configuration** | ❌ No (DB Ops Only) | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| **Changing an API Contract** | ✅ Migration | ✅ Deploy | ✅ Build | ⚠️ If Breaking | ⚠️ If Breaking | ✅ API Spec | ✅ Full Suite |
| **Changing Frontend UI / Layout** | ❌ No | ❌ No | ✅ Build | ✅ Mobile Release | ✅ Mobile Release | ✅ Design Doc | ✅ UI Layout |
| **Changing Security Policy / RLS** | ✅ Migration | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Security Doc | ✅ Security Audit |
| **Changing an Edge Function** | ❌ No | ✅ Deploy | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Integration |
| **Changing Database Schema** | ✅ Migration | ⚠️ If Affected | ⚠️ If Affected | ❌ No | ❌ No | ✅ Data Model | ✅ DB Lint |

---

## 15. Phase 6B Planning Verdict

### Readiness Assessment
* The IDEMO repository is **READY** to begin Gate A implementation planning.
* Gate A (Contract and Configuration Foundation) MUST begin first.
* **Blocker Requirement**: `BLK-001` (Supabase project credentials configuration in dev environment) must be resolved during Gate A setup before initiating Gate B network calls.
* No architectural decisions are required to begin Gate A; the API contracts and security boundaries are fully specified in approved governance documents.
* Mobile release scope is **predictable**: Phase 6B frontend updates will require a Web/Cloud Run container build and a standard mobile application store release once integration is verified.

---

**STEP 4 PASSED — Phase 6B implementation inventory established.**
