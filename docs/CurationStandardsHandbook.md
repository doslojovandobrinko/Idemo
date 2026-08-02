# IDEMO Curation Standards Handbook

**Editorial Guidelines, Authenticity Protocols & Quality Thresholds for Premium Serbian Curations**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Editorial Officer & Lead Curational Analyst
- **Status:** Approved / Active Reference

---

## Revision History

| Version | Date       | Author              | Description                                                       | Status     |
| :------ | :--------- | :------------------ | :---------------------------------------------------------------- | :--------- |
| v1.0.0  | 2025-11-12 | Curation Team       | Initial editorial guidelines for Belgrade Core pilot launch.      | Superseded |
| v2.0.0  | 2026-03-15 | Lead Ethno-Research | Added strict verification steps for rural and monastery listings. | Superseded |
| v2.4.0  | 2026-07-02 | Lead AI Agent       | Canonical alignment of multi-dimensional attribute metrics.       | Active     |

---

## Table of Contents

1. [Core Mission & Philosophy](#1-core-mission--philosophy)
2. [Strict Authenticity & Bookability Protocols](#2-strict-authenticity--bookability-protocols)
3. [Editorial Standards: Copywriting & Nomenclature](#3-editorial-standards-copywriting--nomenclature)
4. [Metadata Mapping & Categorization rules](#4-metadata-mapping--categorization-rules)
5. [The Mood Orbit Calibration Rulebook](#5-the-mood-orbit-calibration-rulebook)
6. [Demographic Profiles & Target Audience Suitability](#6-demographic-profiles--target-audience-suitability)
7. [Photography & Visual Standards](#7-photography--visual-standards)
8. [Multi-Step Verification Workflow](#8-multi-step-verification-workflow)
9. [Lifecycle Management: Annual Reviews & Deprecation](#9-lifecycle-management-annual-reviews--deprecation)

---

## 1. Core Mission & Philosophy

The primary mission of **IDEMO** is to dismantle standard tourism clichès and replace them with high-fidelity, culturally deep, and geographically authentic local curations. We do not curate tourist traps. Every entry in the IDEMO database must reflect the real, living heartbeat of Serbia—connecting international travelers, business executives, and EXPO 2027 attendees directly with genuine local communities, hidden historical wonders, top-tier medical wellness clinics, and untamed natural ecosystems.

Our philosophy stands on three pillars:

- **Zero Simulation:** We never invent attractions, festivals, or experiences.
- **Narrative Depth:** We provide cultural context, localized terminology (e.g., _Silosi_, _Kafana_, _Pimnice_), and historical truth.
- **Cognitive Integration:** Every curated asset is mathematically indexed within the **IDEMO Mood Orbit**, making it instantly discoverable through the emotional state of the visitor.

---

## 2. Strict Authenticity & Bookability Protocols

To preserve the reputation of the platform, every recommendation must adhere to the **Four Laws of Serbian Authenticity**:

1. **Physical Reality:** The attraction must physically exist and be operational. Abandoned ruins must be explicitly described as such, with precise parking or hiking coordinates.
2. **Bookability:** The visitor must be able to experience the asset. For restaurants, a phone number or booking link is mandatory. For remote mountain trails, a clear public trail guide or licensed local guide association must be provided.
3. **Local Sovereignty:** We prioritize local, family-owned, and ecologically sustainable operators. We reject massive hyper-commercial tourist chains in favor of authentic local artisans (e.g., Pirot Kilim weavers, third-generation brandy distillers in Sumadija).
4. **No Sponsor Bias:** Curated listings cannot purchase high rankings. Ranking is purely governed by mathematical proximity and semantic alignment to the user's real-time sliders.

---

## 3. Editorial Standards: Copywriting & Nomenclature

Our copywriting is sophisticated, intellectually honest, and evocative. We avoid generic travel marketing terms like "breathtaking", "stunning", or "jaw-dropping". Instead, we use precise, descriptive, and historically grounded language.

### Nomenclature Rules:

- **Localization:** Always include localized Serbian names in the original Cyrillic/Latin script alongside English translations (e.g., _Hram Svetog Save_ for Temple of Saint Sava; _Rajačke Pimnice_ for Rajac Wine Cellars).
- **Conciseness:**
  - `shortDescription` must be a high-impact, single-sentence summary focusing on the _sensory hook_ (maximum 160 characters).
  - `longDescription` must provide complete cultural context, historical details, transport advice, and specific insider tips (typically 3 to 4 well-structured paragraphs).
- **Avoid Tech Larping:** Do not add fake status coordinates, telemetry lines, or server ports inside the descriptions. The copy must read as if written by a seasoned culture journalist.

---

## 4. Metadata Mapping & Categorization Rules

Every recommendation must map to exactly one primary category (declared inside `src/types.ts` as `Category`):

```
                          CATEGORICAL HIERARCHY
                        ┌───────────────────────┐
                        │        Category       │
                        └───────────┬───────────┘
         ┌──────────────┬───────────┼───────────┬──────────────┐
  ┌──────┴──────┐┌──────┴──────┐┌───┴───┐┌──────┴──────┐┌──────┴──────┐
  │   History   ││  Gastronomy ││Nature ││  Clubbing   ││  Wellbeing  │
  └─────────────┘└─────────────┘└───────┘└─────────────┘└─────────────┘
```

- **History (Historic Sites & Museums):** Fortresses, monasteries, archaeological sites, monument complexes, museums.
- **Gastronomy (Culinary Traditions):** Historic kafanas, modern fine dining, local farmsteads (_salaši_), wine cellars (_pimnice_).
- **Nature (Outdoors & Protected Ecosystems):** Canyons, rivers, mountain reserves, lookout points, hiking trails.
- **Travel (Urban Explorations & Transit):** Historic neighborhoods (Zemun, Kosančićev Venac), scenic rail routes, scenic viewpoints.
- **Clubbing (Social Gatherings & Events):** Music festivals, floating clubs (_splavovi_), underground cocktail lounges, warehouse clubs.
- **Wellbeing (Regenerative Spa & Health):** Mud baths, thermal springs, medical clinics, sensory deprivation tanks.
- **Medical (Advanced Clinical Diagnostics):** Anti-stress clinics, physical therapy centers, stem-cell research centers, high-end dental restoration clinics (retaining EXPO 2027 luxury focus).

---

## 5. The Mood Orbit Calibration Rulebook

Curation teams must assign coordinates based on physical and sensory impact, avoiding arbitrary guess-work.

### Standard Calibration Values (SCV):

- **Remote Wilderness (e.g., Tara Lookout):** $[x: +2.0, y: -4.5]$ (Highly active physical walk, absolute natural serenity).
- **Underground Nightclub (e.g., Drugstore):** $[x: +4.5, y: +3.0]$ (Massive high-intensity techno, industrial urban setting).
- **Isolated Hermit Monastery (e.g., Crna Reka):** $[x: -4.0, y: -3.5]$ (Deep introspective meditation, rugged vertical cliff face).
- **Michelin-Tier Gastronomy (e.g., Salon 1905):** $[x: -3.5, y: +3.0]$ (Deeply refined quiet luxury, central historical bank building).

### Slider-to-Coordinate Mapping Rules:

- **Budget Level:** High-cost curations ($>€100$ per person) are positioned with a high luxury attribute ($>8.5$) and typically occupy the left hemisphere of the Mood Orbit ($X < 0$), reflecting personalized, exclusive, uncrowded care.
- **Time/Duration:** Multi-day excursions automatically receive lower urbanity ($Y < 0$) and lower accessibility ratings, as they require significant travel time away from the Belgrade concrete core.

---

## 6. Demographic Profiles & Target Audience Suitability

Every curation must declare explicit suitability flags to feed into the recommendation engine filters:

- **Business Travellers (EXPO Delegations):** Demands high accessibility, high English-fluency staff, stable Wi-Fi, premium levels of dining, and close proximity to Belgrade. (e.g., Humska Cigar Lounge).
- **Families (Multi-generational):** Must possess high physical accessibility, child-friendly spaces, zero late-night adult themes, and low safety risk. (e.g., Kalemegdan Park or Ada Ciganlija).
- **Solo Adventurers:** Demands highly social or rugged active environments. (e.g., Tara Kayaking, Belgrade Hostels, or Free Walking Tours).
- **Seniors / Quiet Relaxers:** Demands gentle walking paths, high safety, historical significance, and thermal comfort. (e.g., Vrnjačka Banja clinics).

---

## 7. Photography & Visual Standards

Visual assets must reinforce the premium, editorial nature of the platform.

- **Refined Imagery:** Never use low-quality, cell-phone photos or stock images of generic locations. Every image must be a high-definition photograph captured during golden hour, emphasizing authentic architectural lines, pristine natural mist, or moody urban shadows.
- **Referrer Security:** All visual image elements rendered in React templates must include `referrerPolicy="no-referrer"` to prevent domain leakages or third-party blocks.
- **No Overlays:** Images must be clean. No graphic text, watermark logos, or computer-generated frames.

---

## 8. Multi-Step Verification Workflow

Before a curation is promoted to the production database (`src/constants.ts`), it must pass through the four gates of the **IDEMO Curation Pipeline**:

```
                       THE CURATION PIPELINE
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │ 1. Fact-Check│ ──► │ 2. Phone Call│ ──► │ 3. Coord-Fit │ ──► │ 4. Peer-Sign │
 └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Gate 1: Fact-Checking:** Cross-reference physical details against local Serbian registries, municipal tourism pages, and historical catalogs.
2. **Gate 2: Direct Contact:** Call the venue or operator directly to confirm operating hours, English proficiency, and EXPO 2027 booking capacities.
3. **Gate 3: Coordinate Fitting:** Run a local simulation of the coordinate plotting to ensure it does not clash with existing points and aligns precisely with the sensory parameters.
4. **Gate 4: Peer Sign-off:** A minimum of two senior curators must sign off on the linguistic quality and authenticity before the database is committed.

---

## 9. Lifecycle Management: Annual Reviews & Deprecation

No curated listing is permanent. The local landscape shifts rapidly.

### The Annual Review Protocol:

Every January, the curation team must audit all 100+ active recommendations:

- Verify phone numbers, website links, and reservation URLs.
- Update seasonal pricing bounds to adjust for inflation.
- Read local reviews (Google, TripAdvisor, local blogs) to catch any decline in quality or service deterioration.

### Deprecation Policy:

A curation is automatically deactivated and moved to archive status if:

- It ceases operations for more than 45 consecutive days.
- It loses local authenticity (e.g., a quiet family vineyard is sold to a massive international beverage conglomerate).
- Its average user satisfaction score drops below $4.0/5.0$ over a 3-month rolling window.

---

**Related Technical Documents:**

- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
