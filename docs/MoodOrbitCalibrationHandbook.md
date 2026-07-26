# IDEMO Mood Orbit Calibration Handbook
**Canonical Operational Reference for Sensory & Environmental Projection**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Systems Architect & Lead AI Engineering Agent
- **Status:** Approved / Active Reference

---

## Revision History

| Version | Date | Author | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| v1.0.0 | 2025-11-12 | Dev Architect | Initial draft for Belgrade Core pilot launch. | Superseded |
| v2.0.0 | 2026-03-15 | Senior Curation Lead | Added Banja Wellbeing and rural monastic calibration vectors. | Superseded |
| v2.4.0 | 2026-07-02 | Lead AI Agent | Canonical alignment across multi-dimensional attribute space. | Active |

---

## Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Sensory Architecture: Why Two Dimensions?](#2-sensory-architecture-why-two-dimensions)
3. [The Master Coordinate System](#3-the-master-coordinate-system)
    - [X-Axis: Emotional & Sensory Preference (-5 to +5)](#x-axis-emotional--sensory-preference--5-to-5)
    - [Y-Axis: Environmental & Spatial Preference (-5 to +5)](#y-axis-environmental--spatial-preference--5-to-5)
4. [Calibration & Positioning Methodology](#4-calibration--positioning-methodology)
    - [Quantitative Jitter & Clash Prevention Rules](#quantitative-jitter--clash-prevention-rules)
5. [The Four Quadrants of the Mood Orbit](#5-the-four-quadrants-of-the-mood-orbit)
6. [Mathematical Projection: Radius & Velocity](#6-mathematical-projection-radius--velocity)
7. [The Mini Mood Grid Specification](#7-the-mini-mood-grid-specification)
8. [Heat Map & Coverage Metrics](#8-heat-map--coverage-metrics)
9. [Blind Spot Classification & Strategic Tolerances](#9-blind-spot-classification--strategic-tolerances)
10. [Multi-Country Calibration Protocol](#10-multi-country-calibration-protocol)
11. [Systems Verification Checklist](#11-systems-verification-checklist)

---

## 1. Executive Summary & Purpose

The **IDEMO Mood Orbit** is a proprietary mathematical and psychological coordinate framework designed to map human desire directly onto geographic experience. Standard travel recommendation systems fail because they treat categories (e.g., "Museums", "Nightlife") as discrete, isolated silos. The Mood Orbit recognizes that human preferences are continuous, emotional, and contextual.

By plotting experiences within a standardized **2D Cartesian coordinate space** ranging from `-5` to `+5` on both axes, IDEMO bypasses shallow categorization. This handbook defines the exact calibration parameters required to place any Serbian (and future international) curation into the Mood Orbit, ensuring absolute data consistency across all system modules: the master vizualizer, the miniature cards, the recommendation ranking engines, and the future multi-destination pipelines.

---

## 2. Sensory Architecture: Why Two Dimensions?

Human spatial choice is governed by two foundational emotional axes:
1. **Sensory/Emotional Loading (The X-Axis):** How much neurological stimulation does the experience demand? Is it inward-facing (hedonistic, reflective, quiet, slow) or outward-facing (energetic, highly social, adrenaline-filled)?
2. **Environmental Density (The Y-Axis):** What is the spatial complexity and human density of the setting? Is it characterized by high-density urban structures (concrete, historic brick, bustling metropolitan lanes) or low-density, wide-open nature (forest canopies, silent mountain ranges, pristine riverbeds)?

These two dimensions create a universal **Cognitive Map** of leisure. By selecting these two orthogonal axes, IDEMO can project any possible destination, event, clinic, or gastronomic experience onto a unified visual canvas, allowing for rich, intuitive mathematical matching.

---

## 3. The Master Coordinate System

The Mood Orbit maps experiences using a $10 \times 10$ mathematical grid where coordinates range precisely from $[-5.0, -5.0]$ (bottom-left) to $[+5.0, +5.0]$ (top-right). 

```
                       [Y: +5.0] Dense Metropolitan / Urban Core
                                   ▲
                                   │
                                   │   Top-Right Quadrant
           Top-Left Quadrant       │   (Active Urban / Nightlife)
       (Contemplative Urban)       │
                                   │
[X: -5.0] ─────────────────────────┼───────────────────────── [X: +5.0]
Deep Hedonist / Quiet              │                    Extreme Energy / Active
                                   │
                                   │   Bottom-Right Quadrant
         Bottom-Left Quadrant      │   (Active Nature / Adventure)
       (Reflective Nature / Spa)   │
                                   │
                                   ▼
                       [Y: -5.0] Remote Nature / Wilderness
```

### X-Axis: Emotional & Sensory Preference (-5 to +5)
- **-5 (Deep Hedonist):** Complete silence, individual pampering, sensory isolation, exclusive private dining, luxury wellness retreats. (e.g., Private floatation tanks, high-end thermal spas).
- **-3 (Reflective / Elegant):** Slow food, quiet traditional coffee houses (*kafanas*), museum walks, intimate wine cellar tastings.
- **-1 (Gentle / Relaxed):** Artisan street walks, historical ruins, gallery tours, local craft exploration.
- **0 (Balanced / Curious):** Standard baseline. Interactive museums, local neighborhood strolls, mixed-use parks.
- **+1 (Active / Social):** Guided group tours, soft cycling paths, waterfront promenade dining.
- **+3 (Adrenaline / High Energy):** Soft rafting, via ferrata, open-air festivals, lively gastropubs.
- **+5 (Extreme Energy):** Electronic raves, extreme sports, midnight clubbing on floating barges (*splavovi*), heavy crowd events.

### Y-Axis: Environmental & Spatial Preference (-5 to +5)
- **-5 (Remote Nature):** Deep untouched wilderness, remote canyons, high peak mountain ranges, minimal to zero human infrastructure. (e.g., Tara or Uvac gorges).
- **-3 (Nature Parks):** National parks with designated trails, lake banks, protected flora/fauna reserves with minimal eco-lodges.
- **-1 (Rural Edge):** Countryside etno-villages, isolated monasteries, rural vineyards, rolling orchard hills.
- **0 (Urban Edge):** Suburbs, industrial zones transformed into art hubs, municipal parks (e.g., Ada Ciganlija, Silosi Belgrade).
- **+1 (Mixed Urban):** Historic neighborhood lanes, quiet residential city streets, courtyard cafés.
- **+3 (Historic Core):** Dense pedestrian zones, central city squares, massive metropolitan landmark structures. (e.g., Knez Mihailova pedestrian street).
- **+5 (Urban Core):** Hyper-dense, high-capacity commercial centers, underground transit hubs, concrete multi-level arenas.

---

## 4. Calibration & Positioning Methodology

Coordinates are calculated by combining a **Category-Based Weighted Anchor** with a **Semantic Keyword Density Modifier**.

1. **Calculate Category Anchor:** Each of the 7 primary categories in IDEMO possesses a fixed coordinate center (e.g., Nature is naturally anchored near $Y = -4.0$; Clubbing is anchored near $X = +4.0, Y = +3.5$).
2. **Apply Semantic Textual Modifier:** The curation’s title, short description, and long description are parsed for key phrase matches (e.g., "private", "isolation" pull the coordinate toward $X = -5.0$).
3. **Location Modifier:** If the location contains "Belgrade" or "Beograd", it automatically receives a spatial pull toward $Y \ge 1.0$, unless explicitly overridden by localized parks (e.g., Avala Mountain or Ada Ciganlija).

### Quantitative Jitter & Clash Prevention Rules
To maintain visual elegance on the $10 \times 10$ grid, no two curations may share the exact same coordinates. If multiple curations resolve to the same point (such as multiple Belgrade restaurants in the central pedestrian zone):
- The oldest curation retains the core coordinate.
- Subsequent clashing curations are adjusted using a deterministic **Polar Jitter Formula**:

$$\theta_n = \frac{2\pi \cdot n}{N}, \quad \Delta x = \text{round}\left(\cos(\theta_n) \cdot 0.5, 1\right), \quad \Delta y = \text{round}\left(\sin(\theta_n) \cdot 0.5, 1\right)$$

This spreads the points into a perfect orbital cluster of adjacent $0.5$ grid divisions, preserving readability while preventing canvas overlapping.

---

## 5. The Four Quadrants of the Mood Orbit

| Quadrant | Name | Psychological State | Architectural Context | Iconic Serbian Example |
| :--- | :--- | :--- | :--- | :--- |
| **I (Top-Right)** | **Active Urban** | Extroverted, Stimulated, Connected | Dense Concrete, Neon, Waterfront | Splav 20/4 (ID: 3), Belgrade Beer Fest (ID: 102) |
| **II (Top-Left)** | **Contemplative Urban**| Introspective, Sensory-Rich, Quiet | Historic Architecture, Quiet Cafés | Salon 1905 (ID: 41), Nikola Tesla Museum (ID: 5) |
| **III (Bottom-Left)**| **Reflective Nature** | Detached, Healing, Serene | Forests, Thermal Waters, Monasteries | Studenica Monastery (ID: 11), Vrnjačka Banja (ID: 80) |
| **IV (Bottom-Right)**| **Active Nature** | Adventurous, Physical, Bold | Gorges, Rapids, Mountain Cliffs | Tara Kayaking (ID: 53), Via Ferrata Kablar (ID: 18) |

---

## 6. Mathematical Projection: Radius & Velocity

The **Radius ($r$)** of any experience on the Mood Orbit is defined as its Euclidean distance from the central origin $[0,0]$:

$$r = \sqrt{x^2 + y^2}$$

### Radius Interpretation:
- **Core Zone ($0.0 \le r < 1.5$):** Universal comfort. Highly accessible, balanced, lower psychological demand. Extremely safe for first-time international visitors.
- **Intermediate Zone ($1.5 \le r < 3.5$):** Focused interest. Requires some active spatial or sensory intent (either traveling out of the city or diving deep into a noisy club).
- **Outer Orbit ($3.5 \le r \le 7.07$):** Pure devotion. Extremely niche, highly remote nature, or high-octane sensory environments. This represents the ultimate, uncompromised "edges" of Serbian culture.

---

## 7. The Mini Mood Grid Specification

Every recommendation card, detail view, and custom briefing panel displays a **Mini Mood Grid** component (`src/components/MiniMoodGrid.tsx`). This visual asset provides instant cognitive context for the visitor.

### Mini Grid Technical Guidelines:
- **Aspect Ratio:** $1:1$ (typically $46\text{px} \times 46\text{px}$).
- **Plotting Resolution:** Renders coordinates in exact percentages:
  - $PctX = \frac{x + 5}{10} \times 100\%$
  - $PctY = \frac{5 - y}{10} \times 100\%$ (inverting Y-axis for standard top-left SVG/CSS origin).
- **Visual Design:** Renders subtle crosshairs at $[0,0]$, light outer borders, and a colored, glowing plotted dot matching the quadrant color scheme:
  - **Top-Left (II):** Deep Crimson/Oxblood Red (`#4A0F14`)
  - **Top-Right (I):** Vivid Signal Red (`#D32F2F`)
  - **Bottom-Left (III):** Forest Green (`#2E7D32`)
  - **Bottom-Right (IV):** Teal/Adventure Green (`#00796B`)

---

## 8. Heat Map & Coverage Metrics

A continuous analysis of the 102 Serbian curations yields the following distribution across the $11 \times 11$ coordinate grid (incorporating $0.5$ step precision):

- **Top-Left Quadrant (Contemplative Urban):** 20 Curations (19.6%)
- **Top-Right Quadrant (Active Urban):** 13 Curations (12.7%)
- **Bottom-Left Quadrant (Reflective Nature):** 31 Curations (30.4%)
- **Bottom-Right Quadrant (Active Nature):** 14 Curations (13.7%)
- **Center Zone (Curated Balanced Comfort):** 14 Curations (13.7%)

**Conclusion:** The database is highly dense in historical/cultural content and peaceful nature/spa getaways (reflective of Serbia’s strong thermal wellness and Orthodox monastic heritage), but contains strategic "blind spots" on the absolute outer boundaries.

---

## 9. Blind Spot Classification & Strategic Tolerances

```
                      SPARSE OUTER RING (r > 4.5)
              ┌────────────────────────────────────────┐
              │           [X: -4.5, Y: +4.5]           │
              │         Contemplative Metropolis       │
              │            (Quiet Luxury)              │
              └───────────────────┬────────────────────┘
                                  │
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                                                       │
      │                                                       │
      │                                                       │
      │                                                       │
      │                                                       │
      │                                                       │
      │                                                       │
      └───────────────────────────┼───────────────────────────┘
                                  │
                                  │
              ┌───────────────────┴────────────────────┐
              │           [X: +4.5, Y: -4.5]           │
              │             Extreme Wilderness         │
              │               (High Adventure)         │
              └────────────────────────────────────────┘
```

Not all empty coordinates should be filled. We divide unpopulated coordinates into three strict classes based on strategic intent and geographic reality:

### Class A: Strategically Important (Target for Immediate Expansion)
- **Definition:** Areas where a highly viable, authentic, and prestigious Serbian experience exists but is currently unrepresented. Ripe for EXPO 2027 luxury or high-adrenaline visitors.
- **Example Coordinates:** $[+4.5, -4.5]$ (Deep Remote Adrenaline - e.g., Tara Canyon Extreme sports), $[-4.5, +4.5]$ (Metropolitan Quiet Luxury - e.g., restored historical private tasting rooms in Belgrade).

### Class B: Optional (Secondary Focus)
- **Definition:** Interesting niches, but having low search frequency. These represent highly seasonal or rare events.
- **Example Coordinates:** $[-3.0, -4.5]$ (Extreme Remote Deep Solitude - e.g., hermit cave monastic cells in Stara Planina).

### Class C: Not Applicable (System Excluded)
- **Definition:** Coordinates that represent physical or logical contradictions in Serbian geographic reality. Attempting to force-feed recommendations here leads to "fake data" or low-quality curation.
- **Example Coordinates:** $[+5.0, -5.0]$ (Extreme Rave Adrenaline Party in absolute Remote, Untouched, Infrastructure-free Nature - physical safety constraints and environmental preservation laws prevent massive soundstages in pristine national reserves).

---

## 10. Multi-Country Calibration Protocol

As IDEMO expands beyond Serbia, every new national dataset (e.g., France, Montenegro, Japan) must undergo a **Canonical Alignment Audit**:
1. **Preserve Origin Alignment:** $[0,0]$ must always represent the regional baseline average of that country, preventing cultural scale drift.
2. **Anchor Calibration:** Global categories must remain mapped to the same coordinate regions (e.g., "Clubbing" must always sit on the right hemisphere; "Nature" must always occupy the southern hemisphere).
3. **Regional Baseline Offset:** For highly urbanized or extremely remote nations, a minor global translation offset ($\pm 0.5$ maximum) may be applied to prevent coordinate squashing.

---

## 11. Systems Verification Checklist

Before deploying any data updates or new features, engineers must verify:
- [ ] **Single Source of Truth:** `coordinateX` and `coordinateY` are declared as static floating-point properties directly inside each recommendation object in `src/constants.ts`.
- [ ] **Precision Limit:** All coordinates are rounded to the nearest $0.5$ step to prevent UI fragmentation.
- [ ] **No Visual Overlap:** Deterministic polar jitter is applied to prevent duplicates on the canvas rendering.
- [ ] **Attribute Parity:** The plotted coordinates must match the calculated multi-dimensional attributes: $\text{energy} \approx \text{coordinateX} + 5$, and $\text{urbanity} \approx \text{coordinateY} + 5$.

---
**Related Technical Documents:**
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
