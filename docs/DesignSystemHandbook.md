# IDEMO Design System Handbook
**The Definitive Brand Personality, Typographic Standards, and High-Fidelity UI Component Spec**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Head of Design & Brand Identity Lead
- **Status:** Approved / Active Reference

---

## Table of Contents
1. [Design Philosophy & Brand Personality](#1-design-philosophy--brand-personality)
2. [Visual Identity: Color, Typography & Grid](#2-visual-identity-color-typography--grid)
3. [The Core Component Library (Button, Card, Input)](#3-the-core-component-library-button-card-input)
4. [Custom Spatial Projections (Mood Orbit & Mini Mood Grid)](#4-custom-spatial-projections-mood-orbit--mini-mood-grid)
5. [Animations & Microinteractions (Motion Spec)](#5-animations--microinteractions-motion-spec)
6. [Accessibility & Responsive Layouts](#6-accessibility--responsive-layouts)
7. [Image and Photography Curation Standards](#7-image-and-photography-curation-standards)
8. [The 12-Point Visual QA Audit Checklist](#8-the-12-point-visual-qa-audit-checklist)

---

## 1. Design Philosophy & Brand Personality

The IDEMO visual language is **Swiss Modernism meets Premium Balkan Heritage**. It is clean, spacious, and extremely high-contrast, designed to invoke a sense of calm reassurance and high-fidelity reliability.

### Core Brand Pillars:
- **Quiet Luxury:** No flashing banners, noisy badges, or generic gradients. We utilize generous negative space, crisp borders, and dark slate backgrounds to let the imagery and curation speak.
- **Architectural Clarity:** The layout is structured like modern industrial architectural concrete—solid, well-proportioned, and structurally honest.
- **Micro-Delight:** Every interaction must feel physical. Handles slide smoothly, buttons have a subtle heavy-weight click-down effect, and cards fade in with staggered motion.

---

## 2. Visual Identity: Color, Typography & Grid

We enforce a strict light-mode-first aesthetic with a premium dark slate variant, defined in our tailwind theme.

### 2.1 The Color System

```
                           THE MONOCHROME CORE
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │     Charcoal Dark    │     │      Warm Linen      │     │      Crisp White     │
 │     #0F172A          │     │      #F8FAFC         │     │      #FFFFFF         │
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

#### Core Neutrals:
- **Canvas Base:** `#F8FAFC` (Warm Linen Light) / `#0B0F19` (Architectural Deep Dark)
- **Primary Text:** `#0F172A` (Rich Charcoal Slate) / `#E2E8F0` (Muted Silver)
- **Secondary Text:** `#64748B` (Cool Gray) / `#94A3B8` (Soft Slate)
- **Accent Slate:** `#334155` (Deep Slate)

#### Semantic Accent Highlighters:
- **Quadrant I (Active Nature):** `#10B981` (Emerald Spruce)
- **Quadrant II (Contemplative Urban):** `#8B5CF6` (Monastery Violet)
- **Quadrant III (Quiet Nature/Spa):** `#06B6D4` (Mineral Aqua)
- **Quadrant IV (Social/Clubbing):** `#F43F5E` (Splav Crimson)

---

### 2.2 Typography

Typography is our absolute primary design asset. We import and bind two standard typefaces in our CSS:
- **Primary Body Font:** **Inter** (sans-serif) — Utilized for general UI, lists, sliders, inputs, and detailed descriptions.
- **Display Headings:** **Space Grotesk** (sans-serif) or **Outfit** — Utilized for title layers, headings, and numbers to provide a crisp, tech-forward, yet friendly look.
- **Data/Mono Accent:** **JetBrains Mono** — Utilized for numbers, scores, distances, coordinates, and system stats.

#### Hierarchy Guidelines:
- **H1 (Hero):** `font-sans font-medium tracking-tight text-4xl text-slate-900`
- **H2 (Card Headers):** `font-sans font-medium tracking-normal text-lg text-slate-800`
- **Body:** `font-sans text-sm text-slate-600 leading-relaxed`
- **Stats:** `font-mono text-xs text-slate-500 tracking-wider`

---

### 2.3 The Grid & Spacing System

- We prohibit arbitrary margin and padding values. All spacings must map to the Tailind **$4\text{px}$ Grid Scale** (`p-1` to `p-16`).
- **Standard Container Padding:** `p-6` (`24px`) on desktop, `p-4` (`16px`) on mobile.
- **Bento Grid Layout:** Explore page layout uses a 3-column asymmetric layout (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`) to create a pleasing visual rhythm.

---

## 3. The Core Component Library (Button, Card, Input)

### 3.1 Buttons
- **Primary:** High-contrast solid background, zero border, heavy tracking, fully rounded corners (`rounded-full px-6 py-3 bg-slate-900 text-white font-sans text-xs uppercase font-semibold transition-all hover:bg-slate-800`).
- **Secondary:** Transparent background, thin crisp border, light padding (`border border-slate-200 text-slate-800 hover:bg-slate-50`).

### 3.2 Cards
- **Structure:** White or very light slate base, rounded corners (`rounded-2xl`), subtle border (`border border-slate-100`), and a heavy drop shadow that lifts on hover.
- **Hover Transition:** `hover:shadow-lg hover:-translate-y-1 duration-300 ease-out`.

### 3.3 Inputs & Sliders
- **Inputs:** Wide, spacious inputs with subtle placeholder text and active charcoal borders (`focus:border-slate-800 focus:ring-1 focus:ring-slate-800`).
- **Sliders:** Customized slider tracks with heavy circular sliders. Track colors are responsive to the slider state.

---

## 4. Custom Spatial Projections (Mood Orbit & Mini Mood Grid)

### 4.1 The Mood Orbit Canvas
The Mood Orbit is the central interaction of the platform.
- **Visual Grid:** Consists of concentric circular orbits (nested SVG `<circle>` nodes) rendered with a thin line weight (`stroke: #E2E8F0` / `stroke-width: 1`).
- **The Axis Markers:** The vertical and horizontal coordinate axes are rendered with a dashed line (`stroke-dasharray="4,4"`), dividing the space into four quadrants.
- **The Glow Halo:** The main cursor is styled with a subtle neon radial-gradient halo matching the active quadrant color, giving the visual feedback that the user is actively shifting the emotional balance.

### 4.2 The Mini Mood Grid
Renders the 2D coordinate placement directly on the card:
- A flat $46\text{px} \times 46\text{px}$ high-contrast grid container.
- Renders thin light gray crosshair axes representing the $X$ and $Y$ dimensions.
- Renders a single, glowing colored dot placed relative to the experience's coordinate pair (`coordinateX`, `coordinateY`), scaled to fit the grid bounds.

---

## 5. Animations & Microinteractions (Motion Spec)

We use the `motion` package (imported from `motion/react`) for all UI transitions to avoid layout pops:

- **Page Transitions:** Staggered entry transitions on the feed elements. Each card should drift upwards into place (`initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}`).
- **Coordinate Recalculation:** When coordinates change, the ranked lists must animate their positions using layout transitions (`layoutId` or CSS grid transformations) to avoid abrupt pops.
- **Hover Scale:** Icons and buttons scale by exactly $5\%$ on hover (`hover:scale-105 transition-transform`).

---

## 6. Accessibility & Responsive Layouts

- **Desktop-First Precision:** Layouts use a maximum width constraint (`max-w-7xl mx-auto`) with wide margins to look professional on $4K$ displays.
- **Mobile Touch Comfort:** Mobile layouts automatically switch navigation menus to bottom tab bars or sliding drawers, placing core interactive controls (the Mood Orbit) within easy thumb reach.
- **Contrast Check:** Every text layer has a minimum contrast ratio of $4.5:1$ against its background, verifying accessibility in high-sunlight outdoor travel.

---

## 7. Image and Photography Curation Standards

To preserve the elite look of the platform:
- **Prohibited:** Stock images featuring fake models, low-resolution snapshots, promotional brochures with text, and commercial watermarks.
- **Mandated:** Authentic architectural and landscape photography, utilizing natural lighting, deep depth-of-field, and desaturated color tones.
- **Secure Handling:** React code must load all cover images utilizing the secure referer policy:
  ```tsx
  <img src={rec.image} alt={rec.title} referrerPolicy="no-referrer" loading="lazy" />
  ```

---

## 8. The 12-Point Visual QA Audit Checklist

Before releasing a UI change, the designer/developer must verify these 12 items:

- [ ] **Gate 1: Monochromatic Harmony:** Verify that no un-declared colors outside the palette are introduced.
- [ ] **Gate 2: Spacing Parity:** No hardcoded CSS margins; all margins conform to the standard Tailwind 4px increments.
- [ ] **Gate 3: Typography Consistency:** Verify that Space Grotesk is used only for display headings, Inter for body copy, and JetBrains Mono for system metrics.
- [ ] **Gate 4: Hover Feedback Check:** $100\%$ of active interactive elements (buttons, links, coordinate markers) possess hover feedback.
- [ ] **Gate 5: Touch Target Audit:** Mobile touch buttons possess a minimum interactive radius of $44\text{px}$.
- [ ] **Gate 6: Image Referrer Policy:** Verify that the `referrerPolicy="no-referrer"` attribute is configured on every newly added image node.
- [ ] **Gate 7: SVG Screen-Reader Support:** All customized inline SVG nodes contain a `<title>` node and are mapped with `aria-label` attributes.
- [ ] **Gate 8: Mini Mood Grid Placements:** The plotted dots on the Mini Mood Grids are centered precisely according to their coordinates, with no visual clipping.
- [ ] **Gate 9: Non-Flickering Transitions:** Verify that moving between the main feed and detail views has a smooth layout flow with no flickering or layout pops.
- [ ] **Gate 10: Contrast Compliance:** High-contrast text layers pass WCAG AA evaluation.
- [ ] **Gate 11: Dark Slate Adaptability:** Swapping between light linen and dark slate maintains readability and consistent contrast.
- [ ] **Gate 12: Absolute Pixel Restraint:** Verify that no hardcoded pixel widths (`width: 350px`) are present on layout boxes; fluid flexbox or grid columns are utilized.

---
**Related Technical Documents:**
* [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Data Dictionary](./DataDictionary.md)
* [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
* [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
* [IDEMO Product Requirements Document](./ProductRequirementsDocument.md)
* [IDEMO AI Development Guidelines](./AIDevelopmentGuidelines.md)
* [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
* [IDEMO Changelog](./CHANGELOG.md)
