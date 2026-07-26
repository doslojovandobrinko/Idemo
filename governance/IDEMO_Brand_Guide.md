# IDEMO BRAND GUIDE
**Level 6: The Governing Brand Standard**

---

## 1. Scope & Brand Philosophy
The **IDEMO Brand Guide** governs the sensory, visual, and literary expression of the IDEMO ecosystem.
* It is subordinate to the **IDEMO Constitution** (Highest Governing Document) and **IDEMO Design Constitution** (Governing Design Standard).
* This guide ensures a coherent, highly sophisticated presentation across all interfaces, communication rails, and print collateral.

---

## 2. Brand Identity: IDEMO Editorial Luxury Design Language
IDEMO represents its own proprietary **IDEMO Editorial Luxury Design Language**: a school of design characterized by cleanliness, readability, objectivity, and precise typographic structure.
* **No Over-Decoration:** Flashy, trendy, or overly ornamental patterns (such as heavy glowing drop-shadows or 3D visual card depths) are strictly forbidden.
* **Grid and Symmetry:** Visual components must align perfectly with a proportional geometric grid. Spacing must feel highly intentional.
* **Negative Space:** Negative space is a premium feature. It must be used generously to provide cognitive breathing room and visual luxury.

---

## 3. Typographic System

We pairing highly legible structural fonts with elegant display serifs to establish an editorial feel:

```
                            TYPOGRAPHIC PAIRING
┌─────────────────────────────────────────────────────────────────┐
│  DISPLAY HEADINGS: Space Grotesk / Outfit / Playfair            │
│  (Titles, storytelling, high-end feature names)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  CORE INTERFACE & LABELS: Inter                                 │
│  (Buttons, text panels, cards, navigation items)                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  TECHNICAL DATA & ACCENTS: JetBrains Mono / Fira Code           │
│  (Coordinates, match percentages, timers, status indices)       │
└─────────────────────────────────────────────────────────────────┘
```

* Limit any single view or card layout to a maximum of three distinct text styles to prevent visual fatigue.

---

## 4. Canonical Color Palette

IDEMO employs a calm, organic, high-contrast palette:
* **The Background (Canvas):** High-end neutral off-whites (e.g., `#FAF9F5`, `#FFFFFF`) to create an elegant, eye-safe, bright daylight experience.
* **The Charcoal (Ink):** Deep slate-black (e.g., `#1A1C16`, `#2B2D27`) for perfect readable contrast under any lighting conditions.
* **Accent Teal:** A calming, tactical green-blue (e.g., `#0D5C5A`, `#14B8A6`) to highlight interactive nodes, active filters, and saves.
* **Accent Red:** A classic red (e.g., `#D32F2F`, `#F43F5E`) used sparingly for location markers, categories, and urgent statuses.

---

## 5. Iconography Standards
* **Unified Source:** All icons must be imported from the `lucide-react` library.
* **No Custom SVGs:** Custom SVG shapes are forbidden to maintain bundle-level consistency and accessibility styling.
* **Consistent Weight:** Icons must share consistent line-weights (typically `strokeWidth={1.5}` or `2.0`) and sizing across matching component groups.

---

## 6. Tone of Voice & Writing Style

IDEMO speaks with **Professional Composure, Humility, and Directness**:
* **Human Editorial Quality Standard:** Avoid hyped, self-praising marketing phrases (such as "revolutionary", "stellar", "groundbreaking", or "flawless"). Keep descriptions objective, literal, and understated. All content must satisfy high professional standards regardless of whether it is created by humans or assisted by AI models.
* **Human Labels:** Use standard, humble, literal labels (e.g., "Clock" or "Current Time" instead of "Chronos Meter"; "Recommendations" instead of "Celestial Vectors").
* **No Infrastructure Noise:** Do not display technical container or server metrics (such as *"PORT: 3000"*, *"ONLINE"*, or *"CORE_NODE_ACTIVE"*) in user interfaces. This clutter belongs in server logs, not premium traveler cards.
* **Concise and Thoughtful:** Content must be highly scannable, using short, evocative sentences that convey the true essence of each local destination.
