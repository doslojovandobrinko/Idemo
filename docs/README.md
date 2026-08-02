# IDEMO Canonical Engineering Knowledge Base

**Master Entrance & Documentation Roadmap**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Systems Architect & Lead AI Engineering Agent
- **Status:** Active / Public Reference

---

## 1. Project Overview

**IDEMO** is a premium, privacy-first, offline-first travel personalization engine. It bypasses shallow search boxes and questionnaire fatigue by plotting geographic recommendations directly onto a **2D Cognitive Map** (The Mood Orbit). Users browse experiences dynamically according to their real-time psychological energy, environment desires, and time constraints.

---

## 2. Documentation Philosophy

To guarantee systems longevity, clean onboarding, and perfect code-data symmetry, IDEMO maintains a hyper-linked, synchronized internal documentation suite. The docs are treated as **compile-time production assets**; no code modification, schema change, or curation injection is considered "complete" or "production-ready" until all associated handbooks are updated, audited, and synchronized.

---

## 3. Directory Structure & Document Purposes

The documentation suite resides exclusively in the `/docs/` subdirectory:

```
docs/
├── README.md                                       <-- (This Document) Master entrance and onboarding guide
├── GovernanceCharter.md                            <-- Supreme authority for change approvals, versioning & vision
├── ProductRequirementsDocument.md                  <-- Canonical product vision, target personas, and blueprints
├── MoodOrbitCalibrationHandbook.md                 <-- Theoretical definition and sensory projection rules
├── CurationStandardsHandbook.md                    <-- Editorial guidelines, photography, and authenticity rules
├── RecommendationEngineTechnicalSpecification.md  <-- Mathematical formulas, similarity scoring, and filters
├── DataDictionary.md                               <-- Strict type annotations, boundaries, and validation constraints
├── RecommendationQAHandbook.md                     <-- High-fidelity quality assurance checklists and audits
├── CountryExpansionHandbook.md                     <-- Workflow for multi-national onboarding and releases
├── DesignSystemHandbook.md                         <-- Swiss Modernism brand identity and UI component spec
├── AIDevelopmentGuidelines.md                      <-- AI collaboration protocol and zero-regression safeguards
├── ArchitectureDecisionLog.md                      <-- Historical log tracking architectural choices & trade-offs
└── CHANGELOG.md                                    <-- Chronological ledger of system and data updates
```

---

## 4. Suggested Developer Onboarding & Reading Sequence

For new developers, engineers, and curation directors joining the IDEMO project, we strictly mandate the following reading sequence:

```
                   ONBOARDING READING SEQUENCE
┌──────────────────────────────────────────────────────────────┐
│  1. docs/GovernanceCharter.md                                 │
│     (Supreme Authority, Stable vs. Flexible Components)      │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  2. docs/ProductRequirementsDocument.md                       │
│     (Master Product Vision, Philosophy, and Target Personas) │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  3. docs/MoodOrbitCalibrationHandbook.md                      │
│     (Understand the Core 2D Philosophy and Quadrants)        │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  4. docs/CurationStandardsHandbook.md                         │
│     (Understand Editorial tone, localized authenticity)      │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  5. docs/RecommendationEngineTechnicalSpecification.md       │
│     (Master the Spatial-Semantic scoring mathematics)        │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  6. docs/DataDictionary.md                                    │
│     (Understand every data model attribute and boundaries)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  7. docs/DesignSystemHandbook.md                              │
│     (Review the visual guidelines and UI component specs)    │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  8. docs/RecommendationQAHandbook.md                          │
│     (Review the strict 23-point curation verification test)  │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  9. docs/AIDevelopmentGuidelines.md                           │
│     (Study AI safety directives and compile quality gates)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  10. docs/CountryExpansionHandbook.md                          │
│     (Learn how to scale the engine to new nations)            │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  11. docs/ArchitectureDecisionLog.md                          │
│     (Review the structural tradeoffs and decision history)   │
└──────────────┬───────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│  12. docs/CHANGELOG.md                                        │
│     (Follow previous software releases and migrations)       │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Cross-Reference Map

```
                     CROSS-REFERENCE TOPOLOGY
                    ┌────────────────────────┐
                    │   Governance Charter   │
                    └───────────┬────────────┘
                                │
                                ▼
 ┌──────────────────────────┐   │     ┌──────────────────────────┐
 │   Product Requirements   │◄──┼────►│  Design System Handbook  │
 └─────────────▲────────────┘   │     └─────────────▲────────────┘
               │                │                   │
               ▼                ▼                   ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │   Calibration Handbook   │  ◄───►  │ Technical Specification  │
 └─────────────▲────────────┘         └─────────────▲────────────┘
               │                                    │
               ▼                                    ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │    Curation Standards    │  ◄───►  │     Data Dictionary      │
 └─────────────▲────────────┘         └─────────────▲────────────┘
               │                                    │
               ▼                                    ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │   QA/QC Audit Handbook   │  ◄───►  │ AI Development Guidelines│
 └─────────────▲────────────┘         └─────────────▲────────────┘
               │                                    │
               ▼                                    ▼
 ┌──────────────────────────┐         ┌──────────────────────────┐
 │   Expansion & Release Log│  ◄───►  │   Changelog & History    │
 └──────────────────────────┘         └──────────────────────────┘
```

- **Systems Governance:** The [Governance Charter](./GovernanceCharter.md) sits at the peak of the systems architecture, defining precedence rules and the stable component boundary for all child documents.
- **Coordinates & Attributes:** The coordinate constraints defined in the [Calibration Handbook](./MoodOrbitCalibrationHandbook.md) correspond exactly with the semantic variables detailed in the [Data Dictionary](./DataDictionary.md) and evaluated in the [Technical Specification](./RecommendationEngineTechnicalSpecification.md).
- **Quality Gates:** The [Curation Standards Handbook](./CurationStandardsHandbook.md) provides the creative raw material, which is subsequently audited against the checklist in the [Recommendation QA Handbook](./RecommendationQAHandbook.md).
- **AI Synthesis Guardrails:** The [AI Development Guidelines](./AIDevelopmentGuidelines.md) ensure that any automated agent changes code safely, while respecting the [Design System Handbook](./DesignSystemHandbook.md) specs.
- **Scaling Out:** The [Country Expansion Handbook](./CountryExpansionHandbook.md) uses the combined blueprints of all other documents to onboard a new national entity without requiring engine redesign.

---

## 6. Document Ownership & Revision Policy

- **Document Owners:**
  - **Engineering Leads:** Responsible for `RecommendationEngineTechnicalSpecification.md`, `DataDictionary.md`, `ArchitectureDecisionLog.md`, and `AIDevelopmentGuidelines.md`.
  - **Curation & Editorial Leads:** Responsible for `CurationStandardsHandbook.md`, `RecommendationQAHandbook.md`, and `CountryExpansionHandbook.md`.
  - **Product & Design Leads:** Responsible for `ProductRequirementsDocument.md` and `DesignSystemHandbook.md`.
  - **Governance Board:** Responsible for `GovernanceCharter.md`, `README.md`, `CHANGELOG.md`, and `MoodOrbitCalibrationHandbook.md`.
- **Revision Cadence:** Living document suite. Any modification to JSON databases, API contracts, or physical UI coordinates requires an instant and synchronous pull request updating the respective handbook. Revisions must increment the semantic version number and log precise notes in the document's `Revision History` table, as well as appending logs to the master `CHANGELOG.md`.

---

## 7. Operational Contact & Maintenance Panel

For architectural escalations, board approvals, and release authorizations, contact the Governance Board director or open a tracking issue in the central engineering workspace.

---

**Related Technical Documents:**

- [IDEMO Governance Charter](./GovernanceCharter.md)
- [IDEMO Product Requirements Document](./ProductRequirementsDocument.md)
- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
- [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
- [IDEMO Data Dictionary](./DataDictionary.md)
- [IDEMO Design System Handbook](./DesignSystemHandbook.md)
- [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
- [IDEMO AI Development Guidelines](./AIDevelopmentGuidelines.md)
- [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
- [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
- [IDEMO Changelog](./CHANGELOG.md)
