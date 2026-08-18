# IDEMO PLATFORM CONSTITUTION

## Mandatory Architecture, Data Governance and Implementation Rules

You are working on the IDEMO application and platform.

Before analysing, proposing, generating or modifying any code, you must read and obey this document in full.

These requirements are mandatory architectural constraints. They are not optional recommendations and must not be weakened, bypassed or reinterpreted for convenience.

---

## 1. Core Platform Principle

IDEMO is a configuration-driven platform, not a static content application.

The React and mobile application are stable presentation layers.

Recommendations, translations, images, categories, collections, partners, capabilities, assignments, availability, editorial priorities, ranking weights, feature flags, routing settings and operational data must live in Supabase or approved managed storage.

The application must know how to display and operate on these entities. It must not contain production copies of the entities themselves.

The application should remain stable while the IDEMO catalogue, partner network and operating configuration continuously evolve.

---

## 2. Store-Release Independence

The architecture must allow IDEMO to add, edit, publish, pause, archive or remove recommendations and partners without submitting a new version to Apple App Store or Google Play.

Adding Recommendation #301 or Partner #101 must be a database or operations action, not a frontend-code change.

A mobile release is required only when IDEMO introduces or changes application capabilities, screen behaviour, security contracts or supported data structures.

Never solve a content or operations requirement by hard-coding production data into the application.

---

## 3. Mobile Application Responsibilities

The frontend may contain:

* reusable screen structures;
* reusable recommendation and collection renderers;
* the Mood Orbit interface;
* travel-plan functionality;
* inquiry workflow interfaces;
* Partner Portal interfaces;
* secure API-client logic;
* loading, error and offline states;
* supported component schemas;
* local caching of non-sensitive server responses;
* minimum-version and compatibility handling.

The frontend must not contain:

* production recommendation records;
* production partner records;
* partner PINs or credentials;
* production recommendation-to-partner assignments;
* active pricing records;
* routing decisions;
* editorial publication status;
* notification queues;
* Gemini API keys;
* Supabase service-role keys;
* simulated successful production operations.

---

## 4. Supabase as the Source of Truth

Supabase is the authoritative source for:

* recommendations;
* recommendation translations;
* recommendation images;
* recommendation attributes;
* categories;
* collections;
* seasonal availability;
* editorial review status;
* publication status;
* partner profiles;
* partner capabilities;
* partner languages;
* partner coverage;
* partner availability;
* recommendation-to-partner relationships;
* inquiry records;
* inquiry candidates;
* partner offers and responses;
* visitor resolutions;
* routing configuration;
* notification state;
* feature flags;
* application configuration;
* audit records.

Local React state and safeStorage may support temporary interface behaviour and caching only.

They must never act as the authoritative production system for inquiries, partner acceptance, visitor resolution, partner availability or publication state.

---

## 5. Stable API Boundary

The frontend must communicate with the platform only through approved Supabase Edge Functions, secure RPCs or explicitly approved read-only public endpoints.

The frontend must not directly depend on internal database implementation details.

Use stable typed contracts for operations such as:

* application bootstrap;
* recommendation listing;
* recommendation details;
* collections;
* inquiry creation;
* inquiry status;
* visitor resolution;
* partner authentication;
* partner opportunities;
* partner responses;
* assignment release.

Do not expose service-role credentials to the client.

Do not bypass Row Level Security.

Do not place privileged database operations inside frontend code.

---

## 6. No Production Mocks

Production workflows must never simulate success.

Forbidden patterns include:

* generating a random inquiry reference without creating a backend inquiry;
* saving an inquiry only to safeStorage;
* updating inquiry status only in React state;
* accepting a partner offer only in a local array;
* displaying mock partner opportunities as live data;
* returning a successful interface state when the backend request failed;
* silently falling back to fabricated production records.

Mock data may exist only in clearly isolated development fixtures or automated tests.

Mock behaviour must not be reachable in production builds.

---

## 7. Recommendation Publishing Model

Recommendations must follow a controlled lifecycle such as:

draft
→ editorial review
→ approved
→ scheduled
→ published
→ paused
→ archived

Only properly published recommendations may appear in the public application.

A recommendation must not become public merely because text or images exist.

Publication must respect required editorial gates, including where applicable:

* factual review;
* image-quality review;
* translation completeness;
* geographic verification;
* editorial confidence;
* legal or safety review;
* publication dates;
* curation tier.

The premium IDEMO position must be protected through editorial selection, not catalogue volume.

Scale the catalogue, not the visual density of the interface.

---

## 8. Partner Lifecycle

Partners must be managed as backend entities.

Partners must follow a controlled lifecycle such as:

candidate
→ verification
→ approved
→ active
→ suspended
→ archived

Adding, suspending, reactivating or reassigning a partner must not require an application release.

Partner eligibility must be derived from validated backend data, including:

* capability;
* language;
* geography;
* availability;
* recommendation relationships;
* service area;
* operating status;
* responsiveness;
* other approved qualification criteria.

Never hard-code individual partners or assignments into the frontend.

---

## 9. Deterministic Routing Authority

The validated Supabase routing engine remains authoritative.

Partner qualification, candidate ordering, offer creation, acceptance locking, expiry, queue advancement, release and visitor resolution must remain deterministic and auditable backend operations.

Gemini must never independently choose and assign a partner.

Gemini may interpret unstructured visitor language, but the backend must validate and normalise the result before deterministic routing begins.

The required sequence is:

1. Receive visitor input.
2. Validate input.
3. Optionally use Gemini to extract structured intent.
4. Validate Gemini output against an explicit schema.
5. Apply deterministic database eligibility rules.
6. Rank eligible partners using approved configuration.
7. Create offers transactionally.
8. Accept only the first valid authorised response.
9. Audit every material transition.

Gemini must not override qualification, locking, expiry, security or routing rules.

---

## 10. Gemini Security Boundary

Gemini API calls must never be made directly from the public React or mobile client.

All Gemini calls must pass through a secure server-side function.

The Gemini API key must be stored as a server-side secret.

Never place a Gemini API key in:

* App.tsx;
* frontend source files;
* VITE-prefixed environment variables;
* mobile packages;
* safeStorage;
* localStorage;
* public configuration tables;
* committed repository files.

The secure server-side function must apply:

* authentication where required;
* authorisation;
* rate limits;
* input-length limits;
* timeout limits;
* retry limits;
* daily cost controls;
* schema validation;
* safe fallback behaviour;
* audit logging.

---

## 11. Gemini Is Advisory

Gemini is an assisted intelligence layer.

Gemini may:

* draft editorial descriptions;
* draft translations;
* extract structured inquiry attributes;
* suggest categories;
* suggest tags;
* suggest Mood Orbit coordinates;
* detect missing information;
* flag editorial weaknesses;
* identify possible duplication;
* summarise inquiries;
* propose alternatives from an already verified candidate set.

Gemini may not:

* publish recommendations;
* approve translations;
* activate partners;
* assign unverified partners;
* accept or reject partner offers;
* alter inquiry status directly;
* bypass editorial review;
* alter prices;
* change routing rules;
* execute unrestricted database writes;
* treat generated claims as verified facts.

Gemini output is always untrusted input until validated.

---

## 12. Structured AI Output

Gemini must return structured data conforming to an explicit schema whenever its output affects application behaviour or database records.

Do not rely on free-form prose parsing for operational decisions.

Every AI response must be:

1. parsed;
2. schema-validated;
3. range-validated;
4. checked against allowed enumerations;
5. checked for missing required values;
6. checked against existing database entities;
7. rejected or routed for review when confidence is insufficient.

Never allow Gemini to invent IDs, partners, recommendation records, prices, business names, geographic facts or operational states.

When an entity is referenced, confirm that it exists in the authoritative database.

---

## 13. Human Editorial Control

All Gemini-generated public content must begin as a draft.

Gemini-generated content must not automatically become public.

Publication requires an explicit authorised editorial approval step.

The review interface must clearly distinguish:

* source material;
* Gemini-generated draft;

---

## 14. Architecture Freeze & Stage-Gated Execution Protocol

Once a work package receives explicit architectural approval, the approved architecture becomes frozen for that work package.

### 1. Frozen Specification Mandate
From the point of architectural approval forward:
- Implementation must execute the frozen specification exactly.
- No human engineer or AI agent may redesign, reinterpret, simplify, substitute, rename, merge, relocate, optimize, broaden, narrow, or introduce "minor improvements" unless a new architectural review is explicitly opened and approved.
- Renaming or altering frozen contracts is strictly prohibited (including tables, columns, enum values, RPC names, route names, request contracts, response contracts, UI wording, status values, storage paths, and feature boundaries).

### 2. Mandatory Conflict Stop
Any repository, live-schema, runtime, deployment, security, or platform conflict with the frozen architecture mandates an immediate STOP.
The implementer must:
1. Identify the exact conflict.
2. Identify the affected file, table, column, RPC, route, status, UI contract, or runtime dependency.
3. Explain why the frozen requirement cannot be implemented as approved.
4. Make no substitute implementation or silent workaround.
5. Await explicit architectural direction.

### 3. Stage-Gated Execution Pipeline
1. **GATE 1 — VERIFIED BASELINE**: Read-only discovery. Produce verified repository, live-schema, and runtime facts. No implementation or assumptions presented as facts.
2. **GATE 2 — ARCHITECTURAL APPROVAL**: Approve and freeze one minimal design, including file manifest (`CREATE:`, `MODIFY:`, `PROTECT:`), database schema, RPC signatures, routes, enums, status transitions, UI wording, and security boundaries.
3. **GATE 3 — IMPLEMENTATION**: Execute frozen specification exactly. Provide mandatory scope manifest (`CREATE:`, `MODIFY:`, `PROTECT:`) before editing.
4. **GATE 4 — VERIFICATION**: Provide evidence-based test results (command, expected, actual, PASS/FAIL) rather than summary claims.
5. **GATE 5 — DEPLOYMENT APPROVAL**: Separate approval gate required before running SQL migrations, deploying Edge Functions, creating storage buckets, or publishing frontend builds.

### 4. Conflict Precedence Authority Order
1. IDEMO Architectural Vision
2. Approved Engineering Constitution and Governance Framework
3. Frozen work-package architecture
4. Verified live database & deployed runtime
5. Current repository implementation
6. Migration history
7. Technical documentation
8. Previous AI reports or assumptions

### 5. Future Backlog Rule
Optional refinements or improvements discovered after architectural freeze must be recorded separately as future backlog items and excluded from the active work package unless approved through a formal change-control decision.

