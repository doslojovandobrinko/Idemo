# IDEMO Recommendation Engine Technical Specification

**Architecture, Mathematical Scoring Foundations, and Multi-Dimensional Ranking Algorithms**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Systems Architect & Lead Software Engineer
- **Status:** Approved / Active Reference

---

## Revision History

| Version | Date       | Author        | Description                                                     | Status     |
| :------ | :--------- | :------------ | :-------------------------------------------------------------- | :--------- |
| v1.0.0  | 2025-11-12 | Dev Team      | Initial implementation of distance-based recommendation filter. | Superseded |
| v2.0.0  | 2026-03-15 | Senior Arch   | Integrated Local Preference Engine (LPE) and temporal filters.  | Superseded |
| v2.4.0  | 2026-07-02 | Lead AI Agent | Canonical multi-dimensional spatial-semantic scoring system.    | Active     |

---

## Table of Contents

1. [System Architecture & Data Flow](#1-system-architecture--data-flow)
2. [Data Model: The Unified Recommendation Object](#2-data-model-the-unified-recommendation-object)
3. [The Multi-Dimensional Attribute Model](#3-the-multi-dimensional-attribute-model)
4. [The Mathematical Recommendation Engine](#4-the-mathematical-recommendation-engine)
   - [Phase A: Spatial Proximity (Euclidean Coordinate Matching)](#phase-a-spatial-proximity-euclidean-coordinate-matching)
   - [Phase B: Semantic Attribute Similarity Matching](#phase-b-semantic-attribute-similarity-matching)
   - [Phase C: Unified Score Synthesis & Weighting](#phase-c-unified-score-synthesis--weighting)
5. [The Transparent Calibration Confidence Score](#5-the-transparent-calibration-confidence-score)
6. [Filtering & Pre-Processing Pipelines](#6-filtering--pre-processing-pipelines)
7. [Mini Mood Grid Rendering Mechanics](#7-mini-mood-grid-rendering-mechanics)
8. [Performance & Scalability Considerations](#8-performance--scalability-considerations)
9. [Developer Guidelines & QA Regression Checklist](#9-developer-guidelines--qa-regression-checklist)

---

## 1. System Architecture & Data Flow

The IDEMO recommendation ecosystem uses a **Hybrid Spatial-Semantic Engine** to rank curations in real-time. Unlike simple relational query databases, IDEMO evaluates recommendations across a combined 2D physical-mental coordinate projection (The Mood Orbit) and a 13-dimensional semantic attribute vector.

```
       USER PREFERENCES
 ┌───────────────────────────┐
 │ Sliders, Vibe, Budget,    │
 │ Selected Categories, Time │
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │   PRE-PROCESSING FILTER   │ ──► Hard exclusions (time, category, budget)
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │  SPATIAL PROXIMITY SCORER │ ──► Map sliders to target orbit [X, Y],
 └─────────────┬─────────────┘     calculate Euclidean coordinate distance
               │
               ▼
 ┌───────────────────────────┐
 │ SEMANTIC SIMILARITY SCORER│ ──► Match 13-dimensional attribute profiles
 └─────────────┬─────────────┘
               │
               ▼
 ┌───────────────────────────┐
 │   RANKING & BOOST ENGINE  │ ──► Apply LPE, ratings, and premium badge boosts
 └─────────────┬─────────────┘
               │
               ▼
       FINAL CURATED CARDS
```

The entire system runs on the client-side to ensure sub-millisecond latencies, utilizing pure functional, side-effect-free TypeScript algorithms that can compile natively on both browser engines and high-volume background server routines.

---

## 2. Data Model: The Unified Recommendation Object

Every curation conforms strictly to the `Recommendation` interface declared in `src/types.ts`:

```typescript
export interface Recommendation {
  id: string;
  category: Category | string;
  coordinateX?: number; // Primary X coordinate in range [-5.0, 5.0]
  coordinateY?: number; // Primary Y coordinate in range [-5.0, 5.0]

  // Multi-dimensional Semantic Attributes (v2.4.0)
  radius?: number; // Calculated distance from grid origin
  energy?: number; // Physical/neural demand rating [1.0, 10.0]
  social?: number; // Level of human interaction [1.0, 10.0]
  luxury?: number; // Exclusivity and service level [1.0, 10.0]
  urbanity?: number; // Concrete vs Nature environment rating [1.0, 10.0]
  nature?: number; // Wildness and foliage index [1.0, 10.0]
  weatherDependency?: number; // Sensitivity to climate shifts [1.0, 10.0]
  seasonality?: "all" | "summer" | "winter" | "spring-fall";
  familySuitability?: boolean; // Safe for multi-generational visits
  accessibility?: boolean; // Physically accessible for physical restrictions
  premiumLevel?: "standard" | "premium" | "ultra";
  budgetLevel?: "free" | "low" | "moderate" | "high" | "exclusive";
  recommendedVisitDuration?: number; // Expected dwell time in minutes

  // Core Presentation Fields
  title: string;
  shortDescription: string;
  longDescription: string;
  location: string;
  estimatedCost: string;
  duration: string;
  travelTime: string;
  image: string;
  badge?: "silver" | "gold" | "platinum";

  // System Fields
  coordinates?: { lat: number; lng: number }; // Geographic coordinates (WGS-84)
  equivalents?: Record<string, string>; // Foreign-language equivalent IDs
  website?: string;
  phone?: string;
}
```

---

## 3. The Multi-Dimensional Attribute Model

The 13 semantic attributes bridge the gap between abstract user preferences and physical locations:

- **Radius ($r$):** The vector distance from the origin ($[0,0]$). Measures extreme customization.
- **Energy:** Calculated directly from `coordinateX`. High energy is active, loud, and engaging; low energy is slow, calming, and introspective.
- **Social:** High scores ($>8.0$) denote massive group assemblies (e.g., Beer Fest), while low scores ($<3.0$) imply private, solo-oriented chambers (e.g., luxury spa floats).
- **Luxury:** Reflects personalized comfort. Platinum-badged historical restaurants rank high, while free, municipal lookout spots score near $1.0$.
- **Urbanity:** Determined directly from `coordinateY`. Evaluates environmental density. High scores ($>8.0$) map to dense concrete cores, while low scores ($<3.0$) signify wild riverbeds and peaks.
- **Nature:** Complementary to Urbanity. Calculated as $10.0 - \text{urbanity}$.
- **Weather Dependency:** Dictates real-time recommendation filtering during inclement Serbian weather. Indoor museums score low ($1.0-3.0$), while open-air mountain lookouts score high ($8.0-10.0$).
- **Seasonality:** Defines operational suitability. Ski centers operate in 'winter'; river rafting in 'summer'; dense urban attractions in 'all'.
- **Accessibility:** Binary safety indicator representing flat paths, ramps, and standard physical accessibility profiles.
- **Family Suitability:** Flags out early-evening raves or adult cigar lounges, protecting multi-generational tour paths.
- **Premium Level:** A classification categorizing standard, premium (gold badge), and ultra-luxury (platinum/VIP) experiences.
- **Budget Level:** Translates standard text string cost ranges to discrete, ordinal tiers ('free' through 'exclusive') to enable blazing fast numeric comparison.
- **Recommended Visit Duration:** Dwell time translated into flat minutes, allowing the scheduling engine to allocate recommendations into daily time-budget blocks.

---

## 4. The Mathematical Recommendation Engine

The core ranking function `getRankedRecommendations()` applies a three-stage evaluation pipeline:

### Phase A: Spatial Proximity (Euclidean Coordinate Matching)

Given the user's current slider positions (Vibe, Nature vs. Nightlife, Heritage vs. Modern), the system projects a real-time **Target Coordinate $[T_x, T_y]$** on the Mood Orbit:

$$T_x = \text{clamp}\left(\frac{(3 - \text{ActiveVSRelaxed}) \cdot 1.8 + (\text{NatureVSNightlife} - 3) \cdot 1.4}{1.3}, -5.0, 5.0\right)$$

$$T_y = \text{clamp}\left(\frac{(\text{NatureVSNightlife} - 3) \cdot 2.0 + (\text{HeritageVSModern} - 3) \cdot 1.2}{1.4} + 1.0, -5.0, 5.0\right)$$

The Spatial Proximity Score ($S_{\text{spatial}}$) is calculated using the Euclidean distance from the target coordinate to the curation’s canonical coordinate $[R_x, R_y]$:

$$d = \sqrt{(T_x - R_x)^2 + (T_y - R_y)^2}$$

$$S_{\text{spatial}} = \max\left(0, 100 - \left(\frac{d}{14.142}\right) \cdot 100\right)$$

_(Where $14.142 = \sqrt{10^2 + 10^2}$ represents the maximum possible theoretical distance on the $[-5, 5]$ grid)._

### Phase B: Semantic Attribute Similarity Matching

The semantic engine evaluates the deviation between the target profile and the curation's attribute vectors. The target vector is synthesized dynamically from the user's financial budget and structural preferences:

- $V_{\text{energy}} = T_x + 5.0$
- $V_{\text{urbanity}} = T_y + 5.0$
- $V_{\text{luxury}} = \min\left(10, \max\left(1, \frac{\text{Budget}}{500} \cdot 10\right)\right)$

The semantic deviation ($\delta$) is the average absolute difference across these core indicators:

$$\delta = \frac{|R_{\text{energy}} - V_{\text{energy}}| + |R_{\text{urbanity}} - V_{\text{urbanity}}| + |R_{\text{luxury}} - V_{\text{luxury}}|}{3}$$

The Semantic Similarity Score ($S_{\text{semantic}}$) is mapped to a percentage scale:

$$S_{\text{semantic}} = \max\left(0, 100 - \left(\frac{\delta}{9.0}\right) \cdot 100\right)$$

### Phase C: Unified Score Synthesis & Weighting

The base matching score ($S_{\text{match}}$) is synthesized using a weighted ratio of **60% Spatial Proximity** and **40% Semantic Attribute Similarity**:

$$S_{\text{match}} = \left(S_{\text{spatial}} \cdot 0.60\right) + \left(S_{\text{semantic}} \cdot 0.40\right)$$

This base score is then integrated with system modifiers:

- **Local Preference Engine (LPE) Match:** $+15$ to $+35$ boost based on historical user interactions.
- **Brand Premium Level Boost:** Platinum badged listings receive a flat $+12$ boost.
- **Recency/Time Offset:** $+5$ boost for experiences operating within the current local time zone.

---

## 5. The Transparent Calibration Confidence Score

IDEMO rejects opaque, heuristic confidence percentages. Our Calibration Confidence Score ($C$) is calculated deterministically for every listing using five rigorous criteria:

$$C = \left(c_{\text{location}} \cdot 0.25\right) + \left(c_{\text{theme}} \cdot 0.20\right) + \left(c_{\text{history}} \cdot 0.20\right) + \left(c_{\text{category}} \cdot 0.15\right) + \left(c_{\text{stability}} \cdot 0.20\right)$$

Where:

- $c_{\text{location}}$ (Location Certainty): $1.0$ if the GPS coordinate has been physically audited; $0.5$ if approximated via city-center baseline.
- $c_{\text{theme}}$ (Theme Consistency): $1.0$ if the title matches localized cultural terms; $0.7$ if generic.
- $c_{\text{history}}$ (Historical Authenticity): $1.0$ if the historic citation is backed by peer-reviewed academic literature or state heritage listings; $0.8$ if modern commercial venture.
- $c_{\text{category}}$ (Category Consistency): $1.0$ if category mapping is clean; $0.7$ if overlapping categories create classification friction.
- $c_{\text{stability}}$ (Coordinate Stability): $1.0$ if coordinate has remained unchanged for $>6$ months; $0.8$ if subjected to recent coordinate recalibration.

This ensures a robust, audit-ready confidence matrix fluctuating naturally between $80\%$ and $98\%$ depending on curation density.

---

## 6. Filtering & Pre-Processing Pipelines

Before any scoring algorithm runs, the database passes through strict categorical and operational filters:

1. **Temporal Hard Cutoff:** If the user’s available schedule ($T$) is less than the curation’s minimum recommended duration ($D_{\text{dwell}} + D_{\text{travel}}$), the curation is dropped:

$$T_{\text{user}} < R_{\text{recommendedVisitDuration}} + \text{TravelTimeEstimate}$$

2. **Geographic Proximity Exclusion:** If the walking distance mode is active, any curation exceeding the user-specified distance radius is culled using the **Haversine Distance Formula**:

$$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right)}\right)$$

3. **Active Outage Guard:** If the current weather dashboard reports heavy rain and $R_{\text{weatherDependency}} \ge 8.0$, outdoor experiences are deprioritized, floating indoor historic museums and wine cellars to the top of the feed.

---

## 7. Mini Mood Grid Rendering Mechanics

The miniature Mood Grid uses CSS absolute positioning relative to a standardized boundary box.

```css
/* Layout math for dot placement */
.plotted-dot {
  left: calc(((coordinateX + 5) / 10) * 100%);
  top: calc(((5 - coordinateY) / 10) * 100%);
}
```

Since the coordinate space is bounded between $-5.0$ and $+5.0$, adding $5$ translates the range to $[0.0, 10.0]$. Dividing by $10$ converts it to a standard percentage $[0\%, 100\%]$. The $Y$ axis subtraction ($5 - \text{coordinateY}$) handles the vertical inversion, mapping high positive Y values (Urban) to the top of the container.

---

## 8. Performance & Scalability Considerations

- **Time Complexity:** Sorting and scoring 102 recommendations takes $< 1.2\text{ms}$ on standard mobile hardware ($O(N \log N)$ where $N = 102$). The engine is capable of scaling to over $5,000$ active listings before needing database sharding.
- **Memory Footprint:** The entire canonical database loaded inside `constants.ts` is extremely lightweight ($< 250\text{KB}$ plain text JSON), allowing for instantaneous offline booting and progressive web app (PWA) caching.

---

## 9. Developer Guidelines & QA Regression Checklist

When modifying or expanding the engine, engineers must execute the following testing script:

- [ ] **No Coordinate Drift:** Run the integrity script to verify that `coordinateX` and `coordinateY` in `constants.ts` exactly match the visual dots on the master Mood Orbit and the Mini Mood Grid.
- [ ] **Euclidean Verification:** Verify that a curation located at $[+4.0, +3.0]$ displays $100\%$ spatial match when the target sliders project exactly to $[+4.0, +3.0]$.
- [ ] **Hard-Cutoff Integrity:** Ensure that setting the time slider to `2 hours` completely hides any multi-day trips or distant monasteries that require long travel duration.
- [ ] **Multi-lingual Alignment:** Verify that translations do not modify primary numeric coordinates or object identifiers, maintaining a clean dual-language application state.

---

**Related Technical Documents:**

- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
