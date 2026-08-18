# IDEMO Country Expansion Handbook
**Onboarding Blueprints, Localization Protocol, and Release Checklists for Multi-National Scaling**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Global Expansion Director & Lead Systems Architect
- **Status:** Approved / Active Reference

---

## Table of Contents
1. [Introduction & Architectural Goals](#1-introduction--architectural-goals)
2. [The New Country Onboarding Workflow](#2-the-new-country-onboarding-workflow)
3. [Minimum Curation & Category Balance Thresholds](#3-minimum-curation--category-balance-thresholds)
4. [The Regional Calibration Protocol](#4-the-regional-calibration-protocol)
5. [Localization & Script Translation Workflows](#5-localization--script-translation-workflows)
6. [Metadata Completeness Checklists](#6-metadata-completeness-checklists)
7. [The Pre-Flight Release Gate](#7-the-pre-flight-release-gate)
8. [Future Scalability & Multi-Tenancy Strategy](#8-future-scalability--multi-tenancy-strategy)

---

## 1. Introduction & Architectural Goals

The **IDEMO** platform is structurally designed to expand beyond its initial Serbian footprint. As the platform prepares to onboard subsequent destination nations (e.g., Montenegro, France, Greece, Japan), this handbook defines the immutable standards, quality gates, and database schemas required to ensure a seamless integration.

Our goal is simple: **Zero Code Changes during Country Onboarding.** Expanding to a new country must be a pure *data-layer operations task*, requiring no changes to the central React components, layout code, or visual styling of the platform.

---

## 2. The New Country Onboarding Workflow

The expansion pipeline consists of five consecutive phases, each governed by a strict quality sign-off:

```
                      COUNTRY ONBOARDING PIPELINE
 ┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
 │ Phase 1:      │ ──► │ Phase 2:      │ ──► │ Phase 3:      │ ──► │ Phase 4:      │
 │ Reconnaissance│     │ Curation Core │     │ Orbit Mapping │     │ QA/QC Audit   │
 └───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
                                                                           │
                                                                           ▼
                                                                   ┌───────────────┐
                                                                   │ Phase 5:      │
                                                                   │ Production Go │
                                                                   └───────────────┘
```

### Phase 1: Reconnaissance & Regional Analysis
- Analyze the target country's geographical layout, public transport hubs, and cultural identity.
- Establish the regional origin point $[0.0, 0.0]$ representing the national average of sensory and urban density.

### Phase 2: Curation Core
- Deploy local editorial scouts to assemble the initial curation cohort.
- Verify the physical existence, bookability, and safety profile of every candidate attraction.

### Phase 3: Orbit Mapping
- Calculate coordinates for each recommendation using the **Sensory-Environmental Axis Model** detailed in the [Calibration Handbook](./MoodOrbitCalibrationHandbook.md).
- Apply polar jittering to resolve geographic center clashes.

### Phase 4: QA/QC Audit
- Execute the complete 23-point verification test detailed in the [QA Handbook](./RecommendationQAHandbook.md).
- Generate and validate the Country Coverage Heat Map.

### Phase 5: Production Go
- Commit the validated JSON array to the production database and flag the country as active.

---

## 3. Minimum Curation & Category Balance Thresholds

To prevent a country from feeling sparse or heavily biased, a new country launch must meet strict density and categorical distribution limits:

### Minimum Curation Densities:
- **Major Metropolitan Cities (e.g., Tokyo, Paris):** Minimum of $50$ highly curated experiences.
- **Medium National Entities (e.g., Montenegro, Greece):** Minimum of $75$ highly curated experiences.
- **Large National Entities (e.g., France, USA):** Minimum of $120$ highly curated experiences.

### Categorical Distribution Targets:
No single category may dominate the national dataset. We enforce the following mathematical boundaries:

- **History & Heritage:** $15\% - 30\%$
- **Gastronomy & Local Foodways:** $15\% - 25\%$
- **Nature & Protected Ecosystems:** $15\% - 30\%$
- **Clubbing & Evening Socials:** $10\% - 20\%$
- **Wellbeing & Spas:** $10\% - 20\%$

*These strict ratios ensure that regardless of the country chosen, users moving the sliders in any direction will receive a rich, diverse array of choices.*

---

## 4. The Regional Calibration Protocol

A common expansion pitfall is "relative scale drift." For example, what constitutes a "high-energy metropolitan club" in Montenegro might feel like a quiet suburban lounge in Tokyo.

To correct this, we mandate **Regional Origin Normalization**:
- **$[0,0]$ Alignment:** The center of the Mood Orbit ($x=0.0, y=0.0$) must represent the cultural average *of the target country*, not a global scale.
- **Northern Hemisphere ($Y > 0$):** Reserved for concrete and urban density relative to that nation. In Montenegro, the Old Town of Kotor is calibrated at $Y=+3.0$. In Japan, the Shibuya Crossing sits at $Y=+5.0$.
- **Southern Hemisphere ($Y < 0$):** Reserved for natural ecosystems. A mountain hike in Serbia’s Tara sits at $Y=-4.5$; a wilderness peak in Japan’s Northern Alps sits at $Y=-5.0$.

---

## 5. Localization & Script Translation Workflows

High-end translation must preserve localized idioms and alphabetical integrity.

- **Dual-Script Policy:** For countries with multiple official alphabets or complex writing scripts (e.g., Serbia's Cyrillic and Latin, Japan's Kanji/Kana), the database must store fully localized representations inside the `translations` schema.
- **Zero Translation Machines:** The use of un-edited machine translation engines (e.g., Google Translate, deep-L) is strictly forbidden for final production builds. Every string must be reviewed and polished by a native, professional translator with background experience in cultural heritage copywriting.

---

## 6. Metadata Completeness Checklists

Before passing to the pre-flight release gate, a country dataset must prove $100\%$ metadata compliance. The engineering team runs automatic validation scripts on the JSON array to check:

- [ ] **Coordinate Parity:** $100\%$ of items possess valid `coordinateX` and `coordinateY` values within the range $[-5.0, +5.0]$.
- [ ] **Multi-Dimensional Attributes:** $100\%$ of items possess valid numeric attributes for `energy`, `social`, `luxury`, `urbanity`, `nature`, and `weatherDependency`.
- [ ] **Image Security:** $100\%$ of image URL strings point to secure, audited domains with the `referrerPolicy="no-referrer"` configuration in React layouts.
- [ ] **Geographic Integrity:** GPS coordinates mapped in the `coordinates` property fall physically within the territorial boundaries of the target nation.

---

## 7. The Pre-Flight Release Gate

Once metadata completeness is verified, the country release requires the signature of the **Global Release Committee**:

1. **The Regional Director Signature:** Confirms that all editorial, historical, and cultural descriptions are authentic, bookable, and representative.
2. **The QA Lead Signature:** Confirms that the dataset passes $100\%$ of the testing cases in the [QA Handbook](./RecommendationQAHandbook.md).
3. **The Systems Architect Signature:** Confirms that the dataset parses with zero typescript errors, complies with the [Data Dictionary](./DataDictionary.md), and displays sub-millisecond sorting latency.

---

## 8. Future Scalability & Multi-Tenancy Strategy

To support thousands of curations across 20+ countries without degrading client-side performance:
- **Dynamic Module Loading:** Split the `constants.ts` file into modular country-specific chunks (e.g., `constants.serbia.ts`, `constants.france.ts`).
- **Dynamic Import:** Use React lazy-loading and dynamic ES imports to load only the active country's data payload when the user switches national profiles in the global navigation menu:

```typescript
// Future Architectural Target (Paved by this Handbook)
export async function loadCountryDatabase(countryCode: string) {
  const module = await import(`./data/recs.${countryCode}.json`);
  return module.default;
}
```

This guarantees a persistent, lightweight footprint, allowing IDEMO to scale globally while preserving its ultra-fast, offline-first execution profile.

---
**Related Technical Documents:**
* [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Data Dictionary](./DataDictionary.md)
* [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
* [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
