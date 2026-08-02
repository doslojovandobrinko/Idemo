# IDEMO Recommendation QA Handbook

**Quality Assurance Standards, Validation Checklists, and Curation Auditing Protocols**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Lead Quality Assurance Auditor & Curation Quality Controller
- **Status:** Approved / Active Reference

---

## Table of Contents

1. [Introduction & QA Philosophy](#1-introduction--qa-philosophy)
2. [The 23-Point Canonical QA Audit Checklist](#2-the-23-point-canonical-qa-audit-checklist)
3. [Testing Environments & Tooling](#3-testing-environments--tooling)
4. [Continuous Integration & Regression Testing Rules](#4-continuous-integration--regression-testing-rules)
5. [User Feedback Loops & Post-Release Auditing](#5-user-feedback-loops--post-release-auditing)
6. [The Deprecation & Archival Workflow](#6-the-deprecation--archival-workflow)

---

## 1. Introduction & QA Philosophy

In a high-fidelity recommendation engine, **data quality is system performance**. An elegant UI or a lightning-fast ranking algorithm is worthless if it serves incorrect, outdated, or un-bookable recommendations.

The **IDEMO Quality Assurance (QA) Handbook** codifies the exhaustive, step-by-step verification pipeline that every single curation must pass before it is released to the public database. We reject casual reviews; we mandate a rigid, criteria-driven, repeatable audit.

---

## 2. The 23-Point Canonical QA Audit Checklist

Every candidate recommendation must pass all 23 verification gates. The auditor must check off each item manually inside the release record:

```
                            THE QA CHECKLIST GATES
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │    Core Integrity    │ ──► │  Spatial-Semantic   │ ──► │ Demographic & Context│
 │      (Gates 1-8)     │     │     (Gates 9-16)     │     │     (Gates 17-23)    │
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

### Core Integrity Gates (1 - 8)

- [ ] **Gate 1: Physical Authenticity:** The location must physically exist and match real-world historical, cultural, or natural parameters. Fake, AI-generated, or non-existent attractions are strictly prohibited.
- [ ] **Gate 2: Active Operational Availability:** Operating hours, contact numbers, and website links must be verified as active within the last 30 days.
- [ ] **Gate 3: Explicit Bookability:** Visitors must be able to experience the venue. If it requires a reservation, a direct reservation URL, phone number, or authorized physical agency address must be provided.
- [ ] **Gate 4: Representative Quality:** The location must represent authentic regional heritage. We reject standard tourist traps, commercial fast-food venues, or low-quality operations.
- [ ] **Gate 5: High-Definition Photography:** Images must be verified, crisp, high-resolution photographs without commercial watermarks, overlay text, or visual artifacts.
- [ ] **Gate 6: Image Reference Security:** The image source URL must be safe, stable, and configured with `referrerPolicy="no-referrer"` in React rendering layers.
- [ ] **Gate 7: Category Assignment Integrity:** The primary category must conform strictly to the `Category` enum defined in the [Data Dictionary](./DataDictionary.md). No arbitrary, un-declared categories.
- [ ] **Gate 8: Multi-lingual Parity:** Copy descriptions must be hand-crafted, reviewed, and grammatically perfect in both English and regional script variants (e.g., Serbian Latin/Cyrillic), maintaining narrative consistency.

### Spatial-Semantic Calibration Gates (9 - 16)

- [ ] **Gate 9: Mood Orbit Coordinate Validation:** The $X$ and $Y$ coordinates must fall precisely within the range $[-5.0, +5.0]$ and match the [Calibration Handbook](./MoodOrbitCalibrationHandbook.md) rules.
- [ ] **Gate 10: Anti-Clash Verification:** The curation's coordinates must not overlap with any existing recommendation. Clashes must be resolved using the deterministic Polar Jitter Formula.
- [ ] **Gate 11: Energy Attribute Alignment:** The `energy` attribute (range $[1.0, 10.0]$) must match the $X$ coordinate mapping: $\text{energy} \approx \text{coordinateX} + 5$.
- [ ] **Gate 12: Urbanity Attribute Alignment:** The `urbanity` attribute (range $[1.0, 10.0]$) must match the $Y$ coordinate mapping: $\text{urbanity} \approx \text{coordinateY} + 5$.
- [ ] **Gate 13: Budget Scale Calibration:** The `budgetLevel` ordinal class ('free' through 'exclusive') must align exactly with the plain-text `estimatedCost` parameter and match defined pricing bands.
- [ ] **Gate 14: Recommended Visit Duration Precision:** Dwell time in minutes (`recommendedVisitDuration`) must be calculated and documented to allow scheduling engine processing.
- [ ] **Gate 15: Weather Dependency Grading:** The `weatherDependency` score (range $[1.0, 10.0]$) must accurately reflect indoor vs. outdoor risks, protecting user paths in inclement weather.
- [ ] **Gate 16: Operational Seasonality Mapping:** The `seasonality` tag ('all', 'summer', 'winter', 'spring-fall') must align with local climate realities (e.g., ski resorts limited to 'winter').

### Demographic & Contextual Suitability Gates (17 - 23)

- [ ] **Gate 17: Physical Accessibility Audit:** Clear declaration of binary `accessibility` (e.g., wheel-chair/mobility support), verified by site photographs or direct operator contact.
- [ ] **Gate 18: Family Suitability Mapping:** Binary `familySuitability` validation. Raves, adult bars, and rugged mountaineering peaks must be flagged as false.
- [ ] **Gate 19: Premium Tier Categorization:** Verified classification of premium tiers ('standard', 'premium', 'ultra') to align with user luxury sliders.
- [ ] **Gate 20: Business Traveler (EXPO 2027) Suitability:** Verify if the venue supports English-proficient service, Wi-Fi connectivity, cards, and quiet work spaces.
- [ ] **Gate 21: Mini Mood Grid Renders Check:** The plotted dot on the card's Mini Mood Grid matches the master Mood Orbit placement, with correct styling, color matching, and no manual pixel offsets.
- [ ] **Gate 22: Recommendation Engine Rank Verification:** Test cases verify that moving sliders in a certain direction displays this recommendation at the expected rank in the output array.
- [ ] **Gate 23: Live Analytics Integration Validation:** Verify that search queries, rating saves, and calendar bookings correctly process this recommendation ID without database constraint violations.

---

## 3. Testing Environments & Tooling

To run recommendations QA, engineers and curation auditors use a specialized tool suite:

1. **Linter & Compiler Integrity:** Standard TypeScript linter (`npm run lint`) and compiler (`npm run build`) are run to check for schema compliance.
2. **Deterministic Simulation Script:** Use the automated validation runner (`npx tsx src/utils/validate_recs.ts` when configured) to parse the JSON database, checking for coordinate out-of-bounds, duplicates, or missing fields.
3. **Local Visual Playground:** Run the application locally in developer mode (`npm run dev`) and visually audit the dot rendering on the interactive SVG canvas.

---

## 4. Continuous Integration & Regression Testing Rules

To protect the production database from corruption, we enforce a **Zero-Tolerance Regression Policy** on our CI server:

- Any pull request that modifies `src/constants.ts` must execute the automatic validation script.
- If the script detects a single out-of-bounds coordinate, a duplicate coordinate, or a missing semantic attribute, the build **must fail** automatically. No human overrides are allowed.

---

## 5. User Feedback Loops & Post-Release Auditing

The QA cycle does not end at release. We operate a structured loop to catch real-world drift:

- **Rating Signals:** If a curation receives more than three consecutive "Low Satisfaction" flags from users, the curation team is automatically alerted to investigate.
- **Bi-Weekly Link Checks:** A lightweight backend cron job (where active) or an auditor checks all outer website links to prevent "404 link rot" from degrading the user experience.

---

## 6. The Deprecation & Archival Workflow

When a curation fails to meet IDEMO standards (e.g., restaurant closes, trail degrades, operator changes), it must be retired gracefully:

```
                         THE DEPRECATION PIPELINE
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
 │ 1. Flag Alert │ ──► │ 2. Audit Verification │ ──► │ 3. Flag Deprecate │ ──► │ 4. Clean Database │
 └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
```

1. **Flag Alert:** The curation is flagged based on automated link failures or poor user feedback.
2. **Audit Verification:** A curation investigator visits the venue or contacts the operator to confirm issues.
3. **Flag Deprecation:** The item's property is modified, or the item is cleanly removed from the active `INITIAL_RECOMMENDATIONS` array in `src/constants.ts` and moved to a historical archive file (`docs/archived_recs.json`) to preserve reference integrity.
4. **Database Clean-up:** Re-run the polar jitter script to compact the coordinates of any nearby points that were previously offset due to clashes with the retired curation.

---

**Related Technical Documents:**

- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
- [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
- [IDEMO Data Dictionary](./DataDictionary.md)
- [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
- [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
