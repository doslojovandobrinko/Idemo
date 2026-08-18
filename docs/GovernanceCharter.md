# IDEMO Systems Governance Charter
**The Supreme Authority for Architectural Decision Ownership, System Evolution Protocols, and Product Integrity Protection**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Systems Architect & Governance Board Director
- **Status:** Approved / Immutable Policy

---

## Revision History

| Version | Date | Author | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| v1.0.0 | 2025-11-12 | Executive Board | Initial board structure for Belgrade pilot validation. | Superseded |
| v2.0.0 | 2026-03-15 | Architecture Lead | Added EXPO 2027 VIP security and multi-country mandates. | Superseded |
| v2.4.0 | 2026-07-02 | Lead AI Agent | Canonical expansion and integration of full documentation suite. | Active |

---

## Table of Contents
1. [Glossary & Definitions](#glossary--definitions)
2. [Section 1: Mission Statement](#section-1-mission-statement)
3. [Section 2: Governance Principles](#section-2-governance-principles)
4. [Section 3: Documentation Hierarchy & Precedence Rules](#section-3-documentation-hierarchy--precedence-rules)
5. [Section 4: Stable Components (Strict Change Barriers)](#section-4-stable-components-strict-change-barriers)
6. [Section 5: Flexible Components (Agile Evolution Zones)](#section-5-flexible-components-agile-evolution-zones)
7. [Section 6: Change Decision & Approval Matrix](#section-6-change-decision--approval-matrix)
8. [Section 7: Change Control Process Protocol](#section-7-change-control-process-protocol)
9. [Section 8: AI Governance & Autonomous Agent Mandates](#section-8-ai-governance--autonomous-agent-mandates)
10. [Section 9: Version Governance & Release Numbering](#section-9-version-governance--release-numbering)
11. [Section 10: Standard Project Lifecycle Phases](#section-10-standard-project-lifecycle-phases)
12. [Section 11: System Quality Gates & Release Verification](#section-11-system-quality-gates--release-verification)
13. [Section 12: Long-Term Scaling Vision (Serbia to Global)](#section-12-long-term-scaling-vision-serbia-to-global)
14. [Related Documents](#related-documents)

---

## Glossary & Definitions

- **Governance Board (GB):** The supreme decision-making panel responsible for approving modifications to stable components, architectural definitions, and national database releases.
- **Architectural Drift:** The gradual degradation of the system's core design principles over time due to unstructured modifications, uncoordinated feature bloat, or low-quality AI-generated code.
- **Stable Component:** A core system module or theoretical formula whose behavioral characteristics are locked to ensure long-term cross-device consistency and reliability.
- **Flexible Component:** A data asset, translation record, or peripheral interface layer designed to evolve rapidly as new destinations are curated.
- **Curation Asset:** A highly vetted experience record complying with the parameters defined in the [Data Dictionary](./DataDictionary.md).
- **Polar Jittering:** The deterministic coordinate dispersion mechanism used to resolve location overlaps in the 2D SVG canvas as detailed in the [Technical Specification](./RecommendationEngineTechnicalSpecification.md).

---

## Section 1: Mission Statement

The **IDEMO Systems Governance Charter** exists to preserve the absolute long-term architectural integrity, product vision, and operational quality of the IDEMO platform as it scales. By defining clear boundaries for decision ownership, establishing strict documentation precedence rules, and mandating rigorous change control pipelines, this charter prevents architectural drift while providing a controlled, predictable mechanism for global product evolution.

---

## Section 2: Governance Principles

Every architectural trade-off, feature addition, and database change must align with these eight core governance pillars:

1. **Privacy First:** We never collect, track, or aggregate user data. If a feature requires tracking or centralized profile databases, it violates our core mission and is forbidden.
2. **User Trust Above Growth:** We reject clickbait, dark patterns, fake urgency mechanisms, and unsolicited ad integrations. The user is a guest, not a product.
3. **Curation Before Quantity:** We do not index the entire world. We provide an elite, expert-vetted cohort of 100+ pristine cultural and sensory assets per country.
4. **Quality Before Feature Volume:** We prioritize a highly polished, responsive, single-screen interactive interface over an extensive array of half-functional menus, screens, or features.
5. **Documentation Before Implementation:** No line of code may be committed without updating, auditing, and synchronizing its respective specifications first.
6. **Preserve Working Systems:** We maintain continuous system uptime and backward compatibility. We reject refactoring-for-refactoring's-sake and value stability.
7. **Continuous Improvement Without Regression:** Every modification must pass all quality gates with zero regressions in layout, performance, or compilation safety.
8. **Explain Every Architectural Decision:** Every choice must have a clear engineering rationale documented in the [Architecture Decision Log](./ArchitectureDecisionLog.md).

---

## Section 3: Documentation Hierarchy & Precedence Rules

The IDEMO system is defined by its engineering documents. In the event of conflicting specifications, terminology, or constraints, we enforce the following **Precedence Order Hierarchy**:

```
                         DOCUMENTATION HIERARCHY
┌──────────────────────────────────────────────────────────────┐
│  Precedence 1: Governance Charter (docs/GovernanceCharter.md) │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 2: Product Requirements Document (docs/PRD.md)    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 3: Mood Orbit Calibration Handbook                │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 4: Recommendation Engine Technical Specification │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 5: Curation Standards Handbook                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 6: Recommendation QA Handbook                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 7: Country Expansion Handbook                    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 8: Data Dictionary (docs/DataDictionary.md)      │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 9: Code Implementation                            │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Precedence 10: Test Configurations & CI Checks               │
└──────────────────────────────────────────────────────────────┘
```

*Rule of Precedence: No lower-level document, code path, or database entry may contradict, override, or weaken a constraint defined in a higher-level document.*

---

## Section 4: Stable Components (Strict Change Barriers)

Stable components are the core architectural pillars of the IDEMO platform. Any changes to these elements require formal, unanimous approval from the **Governance Board** and a formal amendment to their respective documentation:

- **Mood Orbit Philosophy:** The concept of mapping user psychology and environment density on a 2D continuous coordinate canvas.
- **Coordinate System:** The $[-5.0, +5.0]$ scale mapping sensory energy against environmental concrete density.
- **Recommendation Engine Core:** The Hybrid Spatial-Semantic similarity formulas and ranking logic.
- **Privacy Architecture:** The client-side execution profile, zero behavioral tracking, and local storage state persistence.
- **Product Vision:** The EXPO 2027 premium traveler-focused concierge approach.
- **Data Model:** The strict fields and types defined in the [Data Dictionary](./DataDictionary.md).
- **Semantic Attribute Definitions:** The definitions and complementing scales of `energy`, `social`, `luxury`, `urbanity`, `nature`, and `weatherDependency`.
- **Core Categories:** The seven canonical categories (history, gastronomy, nature, travel, clubbing, wellbeing, medical).
- **Documentation Hierarchy:** This established precedence rules structure.

---

## Section 5: Flexible Components (Agile Evolution Zones)

Flexible components may be updated, expanded, or optimized during normal development cycles by developers and curation teams, provided they pass all quality gates and update secondary metadata tables:

- **Curation Assets:** Adding or deprecating individual recommendations within a verified national dataset.
- **Cover & Gallery Images:** Updating photographs to match modern architectural standards.
- **Translations:** Refining Cyrillic or Latin script variants to correct grammatical or cultural phrasing.
- **Country Datasets:** Onboarding new country files as defined in the [Country Expansion Handbook](./CountryExpansionHandbook.md).
- **Visual Fine-tuning:** Minor CSS layout improvements (e.g., adjusting padding or updating hover animations) that preserve the design system constants.
- **Analytics Reports:** Updating internal coordinate distribution charts or maps.

---

## Section 6: Change Decision & Approval Matrix

The following matrix defines the mandatory roles, approval levels, and affected files for each type of modification:

| Change Target | Level | Affected Files | Responsible Role | Required Approval |
| :--- | :--- | :--- | :--- | :--- |
| **New Recommendation** | Minor | `src/constants.ts` | Curation Lead | QA Lead & Curation Lead |
| **Coordinate Change** | Minor | `src/constants.ts` | Calibrator | Curation Lead & Calibrator |
| **Mood Orbit Change** | Major | `src/components/MoodOrbit.tsx` | UI Architect | Governance Board (GB) Unanimous |
| **Algorithm Change** | Critical | `src/utils/scoring.ts` | Lead Mathematician | GB Unanimous & Lead Architect |
| **Privacy Change** | Critical | Root Config & Server | Security Architect | GB Unanimous & External Auditor |
| **Visual Design Change** | Major | `src/index.css` | Brand Designer | Design Lead & UI Lead |
| **Country Addition** | Major | `src/data/recs.[code].json` | Expansion Director | Systems Architect & GB Signature |
| **Documentation Update** | Minor | `docs/*` | Document Owner | Respective Document Owner |
| **Architecture Change** | Critical | Entire System | Systems Architect | GB Unanimous, signed ADL |

---

## Section 7: Change Control Process Protocol

For any **Major** or **Critical** change, the developer must adhere to the 11-step Change Control pipeline:

```
                            THE CHANGE PROCESS
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  1. Purpose Definition  │ ───► │  2. Impact Assessment   │ ───► │  3. Document Amendments │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  6. Documentation Audit  │ ◄───│  5. Implementation Phase│ ◄───│  4. Migration Strategy  │
└──────────┬──────────────┘      └─────────────────────────┘      └─────────────────────────┘
           │
           ▼
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│  7. Quality Gate QA     │ ───► │  8. Board Approval Sign │ ───► │  9. Production Release  │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                                                               │
                                                                               ▼
                                 ┌─────────────────────────┐      ┌─────────────────────────┐
                                 │  11. Post-Release Audit │ ◄─── │  10. System Sanity Check │
                                 └─────────────────────────┘      └─────────────────────────┘
```

1. **Purpose Definition:** Document why the change is requested.
2. **Impact Assessment:** Identify affected systems, components, and performance profiles.
3. **Document Amendments:** Update the respective handbooks in draft format.
4. **Migration Strategy:** Detail how old data models or records will map to the new schema.
5. **Implementation Phase:** Write clean, modular TypeScript.
6. **Documentation Audit:** Verify that no code edits contradict established handbooks.
7. **Quality Gate QA:** Execute linting, compilation, and security checks.
8. **Board Approval Sign:** Obtain authorized signatures based on the Approval Matrix.
9. **Production Release:** Deploy verified bundle to target platform.
10. **System Sanity Check:** Verify sub-millisecond sorting times and stable browser memory usage.
11. **Post-Release Audit:** Track user feedback and coordinate integrity over a 14-day cycle.

---

## Section 8: AI Governance & Autonomous Agent Mandates

Autonomous coding assistants are subject to strict quality and compliance regulations:

- **The Verification Mandate:** AI agents are forbidden from writing code until they have executed `view_file` on related specifications.
- **Refinement Principle:** AI must prioritize making precise, targeted adjustments (`edit_file` / `multi_edit_file`) over rewriting large files.
- **The Zero-Tolerance Regression Policy:** AI contributions must compile and lint perfectly. If an AI generates a build break, it has exactly 3 attempts to resolve it, or its task turns are suspended.
- **Documentation Enforcement:** AI must append its modifications to `docs/CHANGELOG.md` before completing any development cycle.

---

## Section 9: Version Governance & Release Numbering

IDEMO enforces semantic versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR (e.g., v3.0.0):** Shifting core database architectures, introducing cloud database persistence options, or modifying the coordinate canvas axes.
- **MINOR (e.g., v2.5.0):** Introducing structural UI additions (e.g., a calendar scheduler), introducing a new country coverage block, or adding database schema properties.
- **PATCH (e.g., v2.4.1):** Correcting a rendering layout bug, updating an image asset, or revising typos.
- **DOCUMENTATION UPDATE (e.g., v2.4.0-rev2):** Refining a handbook without modifying code.
- **RECOMMENDATION UPDATE (e.g., v2.4.0-rec14):** Adding or deprecating curations in the database file.

---

## Section 10: Standard Project Lifecycle Phases

Every destination release must progress through eight distinct lifecycle phases:

```
                            PROJECT LIFECYCLE
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
 │  1. Planning  │ ──► │  2. Research  │ ──► │  3. Curation  │ ──► │ 4. Development│
 └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
                                                                           │
                                                                           ▼
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
 │ 8. Deprecate  │ ◄── │7. Maintenance │ ◄── │  6. Release   │ ◄── │  5. Validation│
 └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
```

1. **Planning:** Define regional boundaries, target visitor profiles, and localized script rules.
2. **Research:** Editorial scouts perform physical on-site evaluations of cultural and culinary assets.
3. **Curation:** Mapping raw experiences to the 2D coordinate canvas, resolving clashing coordinates.
4. **Development:** Implementing customized translations and regional coordinates in the country datasets.
5. **Validation:** Executing the complete [QA Handbook](./RecommendationQAHandbook.md) checklist.
6. **Release:** Deploying the updated country database to production.
7. **Maintenance:** Bi-weekly operational checks to verify that external links remain active.
8. **Deprecation:** Removing or archiving stale venues to preserve the elite profile of the curation.

---

## Section 11: System Quality Gates & Release Verification

Before any production push, the code and datasets must pass all eight validation blocks:

- **Gate 1: Documentation Safety:** Handbooks must be compiled, internally consistent, and cross-referenced.
- **Gate 2: Architecture Integrity:** Changes must have signed-off approval records inside the [Architecture Decision Log](./ArchitectureDecisionLog.md).
- **Gate 3: Recommendation QA Check:** $100\%$ of curations must pass all 23 items in the [QA Handbook](./RecommendationQAHandbook.md).
- **Gate 4: Compilation Safety:** Code compiles cleanly with zero TypeScript errors.
- **Gate 5: Mood Orbit Coordinate Snap:** No coordinate is out-of-bounds or overlapping.
- **Gate 6: Performance Threshold:** Database scoring must execute in $<2.5\text{ms}$.
- **Gate 7: Accessibility AA Scale:** Contrast check and screen-reader accessibility on interactive SVG layers.
- **Gate 8: Privacy Lock:** Zero telemetry trackers present in the codebase.

---

## Section 12: Long-Term Scaling Vision (Serbia to Global)

IDEMO's architectural design guarantees global scalability with zero core engine code changes:

```
                          GLOBAL SCALING PATHWAY
┌──────────────────────────────────────────────────────────────┐
│  Phase 1: Serbia Pilot (Belgrade & EXPO 2027 Curation Core)  │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 2: Balkan Expansion (Montenegro, Greece, Bosnia)       │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 3: European Integration (France, Italy, Switzerland)  │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  Phase 4: Global Destinations (Japan, USA, Australia)        │
└──────────────────────────────────────────────────────────────┘
```

- **Database Multi-Tenancy:** New countries are loaded dynamically as static JSON payloads based on the user's selected country code, maintaining a sub-$100\text{KB}$ main asset footprint.
- **Scalable Coordinates:** Since coordinates are normalized relative to each country's internal sensory-density average, the Mood Orbit translates perfectly across cultures, ensuring immediate visual familiarity for global travelers.

---

## Section 13: Operational Excellence & Long-Term Governance Policies

This section establishes formal rules and processes to govern dataset modifications, recommendation versioning, spatial calibration shifts, asset hygiene, and release cycles.

### 13.1 Dataset Lifecycle Policy
Every destination country dataset must progress through five structured stages:
1. **Draft:** Active creation and local testing of recommendations. No public visibility.
2. **Review:** Undergoing peer-review and AI diagnostics checklist evaluation.
3. **Release Candidate (RC):** Staged for build verification; undergo final visual spot-checks.
4. **Production:** Live and active in user-facing applications. 
5. **Archived:** Preserved for historic reference but excluded from active client index loads.

### 13.2 Recommendation Versioning Policy
Every individual curation/recommendation is treated as an independent software asset:
- **Identifier Stability:** Recommendation IDs must never be modified once in Production.
- **Version Tracking:** Any modification to descriptions, badges, translations, or website links increments the recommendation’s patch version (e.g., `v1.0.1` -> `v1.0.2`).
- **QA Auditing:** Modifications trigger a state reset of the item to `QA Status: Pending` and `Approval Status: Draft` until re-approved by a designated reviewer.

### 13.3 Coordinate Change Policy
Coordinates (X, Y) dictate spatial recommendation placement in the Mood Orbit and must be protected:
- **Historical Retention:** Any change in coordinates must append a history entry containing previous coordinates, new coordinates, modification date, modifying author, and dataset version.
- **Calibrator Sign-off:** Coordinate changes must be accompanied by a structured explanation (e.g., "Adjusted spacing for beachside overcrowding relief").

### 13.4 Image Quality Policy
All visual assets must comply with high-definition rendering standards:
- **Resolution:** A minimum of `1920x1080` for landscape-wide banners is required.
- **WebP Transition:** WebP formats are mandatory to optimize mobile load performance under poor network conditions.
- **Copyright Compliance:** Direct attribution references (e.g., Unsplash, CC0, or partner-acquired assets) must be declared and checked during audit sweeps.
- **Seasonal Parity:** Curations styled with heavy snow details must not be showcased in "Summer Alternative" slots unless matching the user's calibration profile.

### 13.5 Recommendation Relationship Policy
To support high-dimensional matching, recommendations must declare precise logical links:
- Curators must provide links for `Similar To`, `Alternative To`, and seasonal dependencies.
- A recommendation should ideally have a defined "Rain Alternative" and a "Budget Alternative" within the same general region.

### 13.6 Release Management Policy
Production safety is paramount:
- **Production Read-Only Mandate:** No live database overrides may be directly edited while in Production status.
- **Draft Branching:** To edit any Production dataset, the administrator must spin up a new Draft version. The live Production build remains unaffected until the new Draft passes all validation checks and is promoted to Production.

### 13.7 Audit Retention Policy
Governance logs are retained for a minimum of 180 days:
- Validation outputs, full coordinate histories, change summaries, and admin actions are persisted in local and secure cloud archives.

---

## Related Documents
* [IDEMO Product Requirements Document](./ProductRequirementsDocument.md)
* [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Data Dictionary](./DataDictionary.md)
* [IDEMO Design System Handbook](./DesignSystemHandbook.md)
* [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
* [IDEMO AI Development Guidelines](./AIDevelopmentGuidelines.md)
* [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
* [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
* [IDEMO Changelog](./CHANGELOG.md)
