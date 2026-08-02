# Phase 6B Architecture Baseline Audit

## Purpose and Scope

This document establishes the official architecture baseline of the IDEMO repository prior to initiating Phase 6B (Frontend/Backend Integration). It provides an evidence-based audit of all existing frontend components, static data stores, local persistence mechanisms, Supabase database migrations, Edge Functions, and environment configurations.

---

## 1. Executive Summary

The IDEMO repository is currently structured as a dual-layer platform:

1. **Frontend Layer**: A highly responsive React 19 / TypeScript 5 / Vite 6 single-page application utilizing static TypeScript data files (`/src/data/`) and browser local storage (`safeStorage`) for user preferences, recommendations, partner interactions, and inquiry simulations.
2. **Backend Layer**: A complete, production-grade Supabase PostgreSQL database architecture governed by 7 SQL migrations (`/supabase/migrations/`) and 4 Deno Edge Functions (`/supabase/functions/`), enforcing Row Level Security, SECURITY DEFINER RPCs, transactional state machines, and automated watchdog routines.

Currently, the frontend and backend layers operate independently: the React application relies entirely on client-side static bundles without active network calls to Supabase. Phase 6B will establish the typed API service layer bridging the React UI with Supabase Edge Functions.

---

## 2. Repository Overview

- **Frontend Framework**: React 19.0.1
- **Language**: TypeScript 5.8.2
- **Build System & Styling**: Vite 6.2.3 with Tailwind CSS v4 (`@tailwindcss/vite` 4.1.14) and Motion v12 (`motion` 12.23.24)
- **Package Manager**: npm (`package-lock.json` and `bun.lock` present)
- **Backend Platform**: Supabase Edge Functions (Deno runtime)
- **Database Platform**: Supabase PostgreSQL (with pgTAP test suites in `/supabase/tests/`)
- **Storage**: Supabase Storage (`recommendation-images` bucket declared in SQL migrations)
- **Authentication**: Supabase Auth (`auth.users`) / Anonymous Visitor tokens / SECURITY DEFINER PIN validation
- **Deployment Targets**: Cloud Run container (Vite server on port 3000) & Supabase Cloud

---

## 3. Current Recommendation System

- **Origin of Recommendation Data**: Static TypeScript files located within `/src/data/recommendations/serbia/`:
  - `clubbing.ts`
  - `gastronomy.ts`
  - `history.ts`
  - `medical.ts`
  - `nature.ts`
  - `travel.ts`
  - `wellbeing.ts`
  - `draft_expansion.ts`
  - `index.ts`
- **Static vs. Supabase Status**: Static client-side arrays. Recommendations do NOT currently load from Supabase in the React application.
- **Identifiers**: String keys (e.g. `rec-bg-gastronomy-1`, `rec-bg-clubbing-1`, `rec-bg-nature-1`).
- **Language Structure**: Localized fields (`title`, `description`, `location`, `details`) mapped via language selectors (`En`, `Sr`, `Zh`) and static translation dictionaries in `/src/data/translations/`.
- **Image Sources**: Static relative paths (`/images/recommendations/...`) and external URLs cataloged in `/src/data/imageProductionQueue.ts` and `image_provenance.json`.
- **Publication Mechanism**: Direct export in `/src/data/recommendations/serbia/index.ts`.
- **Verified Source Files**:
  - `/src/data/recommendations/serbia/index.ts`
  - `/src/data/recommendations/serbia/gastronomy.ts`
  - `/src/data/recommendations/serbia/history.ts`
  - `/src/data/recommendations/serbia/clubbing.ts`
  - `/src/data/recommendations/serbia/nature.ts`
  - `/src/data/recommendations/serbia/wellbeing.ts`
  - `/src/data/recommendations/serbia/medical.ts`
  - `/src/data/recommendations/serbia/travel.ts`
  - `/src/data/imageProductionQueue.ts`
  - `/src/lib/recommendationEngine.ts`
  - `/src/types.ts`

---

## 4. Current Partner System

- **Origin of Partner Records**: Static array `PARTNERS` defined in `/src/data/partners.ts`.
- **Authentication Method**: Client-side PIN comparison (e.g., `pin: '2001'`, `pin: '2002'`).
- **Availability Model**: Static list with client-side state toggles.
- **Recommendation Linkage**: Category matching (`Hotel`, `Gastronomy`, `Wellbeing`, `Culture`, `Retail`) and 2D spatial coordinates (`coordinateX`, `coordinateY`).
- **Language Linkage**: Multilingual properties (`nameEn`, `nameSr`, `nameZh`, `specialOfferEn`, `specialOfferSr`, `specialOfferZh`, etc.).
- **Current Persistence**: Client-side `safeStorage` session key (`idemo_partner_session_v1`).
- **Verified Source Files**:
  - `/src/data/partners.ts`
  - `/src/components/PartnersScreen.tsx`
  - `/src/components/PartnerCard.tsx`
  - `/src/types.ts`

---

## 5. Visitor Inquiry Flow

- **UI Entry Points**: `PlanCard.tsx`, `ConciergeSOSHub.tsx`, and `App.tsx`.
- **Client Validation**: Required field validation (contact details, request notes, requested dates).
- **Client Storage**: Persisted locally via `safeStorage.setItem('idemo_saved_plans_v1', ...)`.
- **Backend Integration**: Not connected. The React UI generates local reference codes and displays success modals without invoking `/functions/v1/create_public_inquiry`.
- **Verified Backend Flow**: Database migration `20260712000001_phase2_inquiry_pipeline.sql` and Edge Function `/supabase/functions/create_public_inquiry/index.ts` provide a fully functional atomic SECURITY DEFINER RPC (`create_public_inquiry`) ready for connection.

---

## 6. Supabase Inventory

### Migrations

1. `20260712000000_phase1_foundation.sql` (Core tables, RLS, audit logs, service areas)
2. `20260712000001_phase2_inquiry_pipeline.sql` (Inquiry creation, reference code generator, matching engine)
3. `20260712000002_phase3_partner_lifecycle.sql` (Partner accounts, PIN auth, offer locking, response RPC)
4. `20260712000003_phase4_visitor_resolution.sql` (Visitor token validation, inquiry resolution RPC)
5. `20260712000004_phase5_operations.sql` (Notification outbox, template engine, watchdog RPC)
6. `20260713000001_phase5_final_reliability.sql` (Reliability patches, transaction bounds)
7. `20260714000000_phase6_clean_unused_variables.sql` (PL/pgSQL parameter cleanup)

### Edge Functions

- `create_public_inquiry` (`/supabase/functions/create_public_inquiry/index.ts`)
- `cron_scheduler` (`/supabase/functions/cron_scheduler/index.ts`)
- `notification_worker` (`/supabase/functions/notification_worker/index.ts`)
- `visitor_resolution` (`/supabase/functions/visitor_resolution/index.ts`)

### Major PostgreSQL RPCs

- `create_public_inquiry(...)`
- `process_partner_response(...)`
- `resolve_visitor_inquiry(...)`
- `get_partner_opportunities(...)`
- `process_notification_batch(...)`
- `run_system_watchdog(...)`

### Major Tables

- `public.recommendations`, `public.categories`, `public.collections`, `public.recommendation_translations`
- `public.partners`, `public.partner_accounts`, `public.service_areas`
- `public.inquiries`, `public.inquiry_matches`, `public.partner_responses`
- `public.notification_outbox`, `public.notification_templates`
- `public.audit_logs`, `public.system_settings`, `public.feature_flags`

---

## 7. Frontend API Layer

- **Current Status**: No dedicated Supabase API client or HTTP fetch abstraction exists inside `/src/lib/` or `/src/api/`. Data access occurs directly against static TypeScript objects or browser `safeStorage`.

---

## 8. Mock Data Inventory

1. **Mock Recommendations**: Static arrays in `/src/data/recommendations/serbia/*.ts` acting as the in-memory recommendation dataset.
2. **Mock Partners**: Static array in `/src/data/partners.ts` with hardcoded client PINs (e.g. `'2001'`).
3. **Mock Inquiries**: In-memory state in `App.tsx` saved to `idemo_saved_plans_v1`.
4. **Fake Identifiers**: Client-side generated reference codes (`ref-` + random string).
5. **Simulated Success States**: Immediate UI dialog closures without network validation.

---

## 9. Local Storage Inventory

1. `idemo_local_preference_profile_v1`
   - **Owner**: `preferenceEngine.ts`
   - **Purpose**: On-device implicit/explicit taste profile & engagement history
   - **Lifecycle**: Persistent
   - **Authority**: Authoritative for local client recommendation scoring.
2. `idemo_saved_plans_v1`
   - **Owner**: `App.tsx` / `PlanCard.tsx`
   - **Purpose**: Local travel itinerary and inquiry bookmarks
   - **Lifecycle**: Transient client cache
   - **Authority**: Non-authoritative cache.
3. `idemo_partner_session_v1`
   - **Owner**: `PartnersScreen.tsx`
   - **Purpose**: Active partner PIN login session state
   - **Lifecycle**: Session / Transient
   - **Authority**: Non-authoritative client state.
4. `idemo_language_preference`
   - **Owner**: `App.tsx`
   - **Purpose**: User selected UI language (`en`, `sr`, `zh`)
   - **Lifecycle**: Persistent client preference
   - **Authority**: Authoritative for client display language.
5. `idemo_vibe_calibration_v1`
   - **Owner**: `VibeCalibration.tsx`
   - **Purpose**: 2D Mood Orbit user calibration parameters
   - **Lifecycle**: Persistent client preference.

---

## 10. Environment Configuration

- **Verified Variables (`.env.example`)**:
  - `GEMINI_API_KEY`: Server-side secret for Gemini API.
  - `APP_URL`: Hosting URL.
- **Supabase URL & Anon Key**: Not declared in `.env.example` yet.
- **Service-Role Key**: Not exposed to frontend (strictly kept in server environment).

---

## 11. Current Backend Integration Status

| Capability                    | Integration Status | Notes                                                |
| :---------------------------- | :----------------: | :--------------------------------------------------- |
| Recommendation Loading        | **NOT CONNECTED**  | Serves static data from `/src/data/recommendations/` |
| Recommendation Images         | **NOT CONNECTED**  | Serves static asset paths                            |
| Partner Loading               | **NOT CONNECTED**  | Serves static array from `/src/data/partners.ts`     |
| Inquiry Creation              | **NOT CONNECTED**  | Saves to local `idemo_saved_plans_v1`                |
| Inquiry Status Retrieval      | **NOT CONNECTED**  | Not wired to Supabase                                |
| Partner Opportunity Retrieval | **NOT CONNECTED**  | Not wired to Edge Function                           |
| Partner Response Submission   | **NOT CONNECTED**  | Handled in client React state                        |
| Visitor Confirmation          | **NOT CONNECTED**  | Not wired to Supabase                                |
| Notification Queue            |     **READY**      | Backend RPC & Edge Function exist; UI not connected  |
| Authentication                | **NOT CONNECTED**  | UI uses client PIN check; Supabase Auth not wired    |
| Storage Bucket                | **NOT CONNECTED**  | SQL bucket migration exists; UI uses static files    |
| Translations                  | **NOT CONNECTED**  | Uses static dictionary in `/src/data/translations/`  |

---

## 12. Architecture Risks

1. **Duplicated Logic**: Recommendation scoring, distance calculations, and partner PIN checks exist in React frontend files while parallel SECURITY DEFINER RPCs exist in PostgreSQL.
2. **Hardcoded Data**: Production content resides inside compiled JavaScript bundles rather than loading dynamically from Supabase.
3. **Missing API Layer**: No unified API service interface exists to seamlessly toggle between remote Supabase endpoints and local offline fallbacks.
4. **State Coupling**: UI components mix presentation layout with local storage persistence.

---

## 13. Phase 6B Readiness

- **Database Schema & Migrations**: **READY**
- **Edge Functions & RPC Engine**: **READY**
- **Governance & Protocol Framework**: **READY**
- **Frontend API Layer**: **NOT CONNECTED** (Requires creating typed API client service)
- **UI Integration**: **NOT CONNECTED** (Requires connecting React components to API client with offline fallback support)

---

## 14. Evidence Appendix

### Frontend

- `/src/App.tsx`
- `/src/main.tsx`
- `/src/types.ts`
- `/src/data/partners.ts`
- `/src/data/recommendations/serbia/index.ts`
- `/src/data/imageProductionQueue.ts`
- `/src/lib/safeStorage.ts`
- `/src/lib/recommendationEngine.ts`
- `/src/lib/preferenceEngine.ts`
- `/src/lib/antiAdviceEngine.ts`
- `/src/lib/analytics.ts`
- `/src/components/PartnersScreen.tsx`
- `/src/components/PartnerCard.tsx`
- `/src/components/PlanCard.tsx`
- `/src/components/ConciergeSOSHub.tsx`

### Backend & Supabase

- `/supabase/config.toml`
- `/supabase/migrations/20260712000000_phase1_foundation.sql`
- `/supabase/migrations/20260712000001_phase2_inquiry_pipeline.sql`
- `/supabase/migrations/20260712000002_phase3_partner_lifecycle.sql`
- `/supabase/migrations/20260712000003_phase4_visitor_resolution.sql`
- `/supabase/migrations/20260712000004_phase5_operations.sql`
- `/supabase/migrations/20260713000001_phase5_final_reliability.sql`
- `/supabase/migrations/20260714000000_phase6_clean_unused_variables.sql`
- `/supabase/functions/create_public_inquiry/index.ts`
- `/supabase/functions/cron_scheduler/index.ts`
- `/supabase/functions/notification_worker/index.ts`
- `/supabase/functions/visitor_resolution/index.ts`

### Configuration & Documentation

- `/package.json`
- `/vite.config.ts`
- `/tsconfig.json`
- `/.env.example`
- `/GEMINI.md`
- `/docs/governance/GOVERNANCE_VERSION.md`
- `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
