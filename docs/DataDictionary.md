# IDEMO Data Dictionary
**Canonical Database Schema, Type Constraints, and Validation Rules for Curation Objects**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Lead Systems Architect & Data Integrity Officer
- **Status:** Approved / Active Reference

---

## Table of Contents
1. [Core Architectural Typing](#1-core-architectural-typing)
2. [Data Schema & Field-Level Specifications](#2-data-schema--field-level-specifications)
3. [Field Rules & Allowed Values](#3-field-rules--allowed-values)
4. [Dual-Language schema & Translation Nesting](#4-dual-language-schema--translation-nesting)
5. [Future Compatibility & Extension Notes](#5-future-compatibility--extension-notes)

---

## 1. Core Architectural Typing

All recommendations within the IDEMO engine conform to the strict TypeScript definitions declared in `src/types.ts`. Any database schema updates must preserve backwards-compatibility with this core signature.

---

## 2. Data Schema & Field-Level Specifications

Below is the definitive documentation for every property processed by the IDEMO recommendation, planning, and rendering engines.

### 2.1 Core Identity Fields

#### `id`
- **Description:** Globally unique identifier for the recommendation.
- **Data Type:** `string` (UUID or unique numeric string).
- **Allowed Values:** Non-empty, alphanumeric characters, hyphens, and underscores.
- **Units:** N/A
- **Default Value:** None (Mandatory).
- **Validation Rules:** Must be unique across all active, archived, and multi-country lists.
- **Example:** `"3"` (or `"rec_belgrade_silosi_04"`)

#### `title`
- **Description:** The primary human-readable name of the curation.
- **Data Type:** `string`
- **Allowed Values:** 3 to 80 characters.
- **Units:** N/A
- **Default Value:** None (Mandatory).
- **Validation Rules:** Must avoid clickbait or promotional language.
- **Example:** `"Silosi Belgrade"`

#### `subtitle`
- **Description:** A brief secondary sensory headline or brand tag.
- **Data Type:** `string`
- **Allowed Values:** 5 to 100 characters.
- **Units:** N/A
- **Default Value:** `""`
- **Validation Rules:** Must complement the title, adding immediate cultural context.
- **Example:** `"Silosi Beograd - Creative District & Honeycomb Architecture"`

#### `description`
- **Description:** The primary English narrative description of the curation.
- **Data Type:** `string`
- **Allowed Values:** Markdown-compatible text, 100 to 1200 characters.
- **Units:** N/A
- **Default Value:** None (Mandatory).
- **Validation Rules:** Must provide historical context and specific insider tips.
- **Example:** `"Silosi Belgrade is a former industrial flour mill transformed into a vibrant cultural center..."`

---

### 2.2 Classification & Geography

#### `category`
- **Description:** The primary core category mapping for search and filtering.
- **Data Type:** `string` / `Category` (Union type)
- **Allowed Values:** `"history"`, `"gastronomy"`, `"nature"`, `"travel"`, `"clubbing"`, `"wellbeing"`, `"medical"`
- **Units:** N/A
- **Default Value:** None (Mandatory).
- **Validation Rules:** Must match exactly one of the active categories in `src/types.ts`.
- **Example:** `"wellbeing"`

#### `country`
- **Description:** The ISO 3166-1 alpha-2 code of the country the experience is physically located in.
- **Data Type:** `string`
- **Allowed Values:** `"RS"` (Serbia), `"ME"` (Montenegro), `"FR"` (France), `"JP"` (Japan), etc.
- **Units:** N/A
- **Default Value:** `"RS"`
- **Validation Rules:** Must be uppercase, 2-letter ISO code.
- **Example:** `"RS"`

#### `region`
- **Description:** The regional province or federal state.
- **Data Type:** `string`
- **Allowed Values:** Regional divisions (e.g., `"Vojvodina"`, `"Šumadija"`, `"Kanto"`, `"Provence"`).
- **Units:** N/A
- **Default Value:** `""`
- **Validation Rules:** Text field.
- **Example:** `"Vojvodina"`

#### `city`
- **Description:** The closest municipality, city, or town.
- **Data Type:** `string`
- **Allowed Values:** Standard city names.
- **Units:** N/A
- **Default Value:** None (Mandatory).
- **Validation Rules:** Must be spelled correctly in both English and Latin local script.
- **Example:** `"Belgrade"`

#### `latitude`
- **Description:** The geographic WGS-84 coordinate latitude.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[-90.0, 90.0]$
- **Units:** Decimal degrees.
- **Default Value:** `0.0`
- **Validation Rules:** Must fall within the physical borders of the country.
- **Example:** `44.8219`

#### `longitude`
- **Description:** The geographic WGS-84 coordinate longitude.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[-180.0, 180.0]$
- **Units:** Decimal degrees.
- **Default Value:** `0.0`
- **Validation Rules:** Must fall within the physical borders of the country.
- **Example:** `20.4489`

---

### 2.3 The Mood Orbit & Spatial Projection

#### `coordinateX`
- **Description:** The canonical position along the horizontal Emotional/Sensory axis of the Mood Orbit.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[-5.0, +5.0]$, rounded to the nearest $0.5$ step.
- **Units:** Orbit Units.
- **Default Value:** `0.0` (Origin centered).
- **Validation Rules:** $-5.0$ represents Deep Introspection / Hedonism; $+5.0$ represents Extreme Energy / Social Raves.
- **Example:** `-3.5`

#### `coordinateY`
- **Description:** The canonical position along the vertical Environmental Density axis of the Mood Orbit.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[-5.0, +5.0]$, rounded to the nearest $0.5$ step.
- **Units:** Orbit Units.
- **Default Value:** `0.0` (Origin centered).
- **Validation Rules:** $-5.0$ represents Untouched Nature / Wilderness; $+5.0$ represents High-Density Urban Concrete.
- **Example:** `4.0`

#### `radius`
- **Description:** Calculated Euclidean distance of the curation coordinate from the central origin $[0,0]$.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[0.0, 7.071]$
- **Units:** Euclidean distance.
- **Default Value:** `0.0`
- **Validation Rules:** Calculated dynamically: $r = \sqrt{x^2 + y^2}$.
- **Example:** `5.31`

---

### 2.4 Multi-Dimensional Semantic Attributes

#### `energy`
- **Description:** Metric tracking the sensory and neurological intensity of the curation.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Sensory Intensity Scale.
- **Default Value:** `5.0`
- **Validation Rules:** Must align with `coordinateX`: $\text{energy} \approx \text{coordinateX} + 5$.
- **Example:** `1.5`

#### `social`
- **Description:** Level of human density and active social interaction expected.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Social Density Scale.
- **Default Value:** `5.0`
- **Validation Rules:** High values denote crowds and shared spaces; low values denote extreme privacy.
- **Example:** `9.2`

#### `luxury`
- **Description:** Level of customized care, exclusivity, and premium pricing.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Exclusivity Scale.
- **Default Value:** `5.0`
- **Validation Rules:** Strongly linked with `budgetLevel` and `premiumLevel`.
- **Example:** `8.5`

#### `urbanity`
- **Description:** Environmental density score evaluating concrete infrastructure vs. foliage.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Urban Density Index.
- **Default Value:** `5.0`
- **Validation Rules:** Must align with `coordinateY`: $\text{urbanity} \approx \text{coordinateY} + 5$.
- **Example:** `9.0`

#### `nature`
- **Description:** Complementary index representing vegetation and natural open space.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Wilderness Index.
- **Default Value:** `5.0`
- **Validation Rules:** Must be the exact complement of urbanity: $\text{nature} = 10.0 - \text{urbanity}$.
- **Example:** `1.0`

#### `weatherDependency`
- **Description:** The vulnerability of the curation to poor climate conditions (rain, snow, extreme heat).
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 10.0]$
- **Units:** Meteorological Vulnerability Scale.
- **Default Value:** `1.0`
- **Validation Rules:** Indoor spaces evaluate to $1.0-3.0$; high outdoor peaks evaluate to $8.0-10.0$.
- **Example:** `8.5`

#### `seasonality`
- **Description:** Seasonal constraints governing operation.
- **Data Type:** `string`
- **Allowed Values:** `"all"`, `"summer"`, `"winter"`, `"spring-fall"`
- **Units:** N/A
- **Default Value:** `"all"`
- **Validation Rules:** String check.
- **Example:** `"summer"`

#### `familySuitability`
- **Description:** Determines suitability for children and multi-generational families.
- **Data Type:** `boolean`
- **Allowed Values:** `true`, `false`
- **Units:** N/A
- **Default Value:** `true`
- **Validation Rules:** Must be flagged as `false` for late-night venues, active bars, or high-risk climbing trails.
- **Example:** `false`

#### `accessibility`
- **Description:** Declares wheelchair and physical accessibility.
- **Data Type:** `boolean`
- **Allowed Values:** `true`, `false`
- **Units:** N/A
- **Default Value:** `false`
- **Validation Rules:** Binary switch.
- **Example:** `true`

#### `premiumLevel`
- **Description:** The tiering classification for luxury and EXPO VIP filtering.
- **Data Type:** `string`
- **Allowed Values:** `"standard"`, `"premium"`, `"ultra"`
- **Units:** N/A
- **Default Value:** `"standard"`
- **Validation Rules:** Standard maps to silver/no badge; premium to gold; ultra to platinum.
- **Example:** `"premium"`

#### `budgetLevel`
- **Description:** Ordinal tier representing cost bounds.
- **Data Type:** `string`
- **Allowed Values:** `"free"`, `"low"`, `"moderate"`, `"high"`, `"exclusive"`
- **Units:** N/A
- **Default Value:** `"moderate"`
- **Validation Rules:** Must map to standard pricing bands (e.g., exclusive represents values $>€100$).
- **Example:** `"high"`

#### `recommendedVisitDuration`
- **Description:** Expected dwell time at the location.
- **Data Type:** `number`
- **Allowed Values:** Integers $>0$.
- **Units:** Minutes.
- **Default Value:** `60`
- **Validation Rules:** Measured in flat minutes.
- **Example:** `120` (2 hours)

---

### 2.5 Presentation & Logistics

#### `image`
- **Description:** High-resolution cover photograph URL.
- **Data Type:** `string`
- **Allowed Values:** Clean URL pointing to approved image servers.
- **Units:** N/A
- **Default Value:** `""`
- **Validation Rules:** Must resolve to valid static asset; no broken dynamic redirects.
- **Example:** `"https://images.unsplash.com/photo-1549144511-f099e773c147"`

#### `gallery`
- **Description:** Array of secondary high-definition photographs.
- **Data Type:** `string[]`
- **Allowed Values:** Non-empty array of valid URL strings.
- **Units:** N/A
- **Default Value:** `[]`
- **Validation Rules:** All links must match image standards.
- **Example:** `["https://images.unsplash.com/photo-1", "https://images.unsplash.com/photo-2"]`

#### `tags`
- **Description:** Secondary thematic discoverability metadata keywords.
- **Data Type:** `string[]`
- **Allowed Values:** Unstructured alphanumeric strings (typically 3 to 8 tags).
- **Units:** N/A
- **Default Value:** `[]`
- **Validation Rules:** Lowercase strings, separated by commas.
- **Example:** `["mill", "design", "gallery", "waterfront"]`

#### `openingHours`
- **Description:** Human-readable operating times.
- **Data Type:** `string`
- **Allowed Values:** Clear hour descriptions (e.g., `"Mon-Fri 09:00 - 18:00"`).
- **Units:** N/A
- **Default Value:** `"Open 24/7"`
- **Validation Rules:** Text representation.
- **Example:** `"Daily 10:00 - 22:00"`

#### `estimatedCost`
- **Description:** Text representation of cost for immediate presentation.
- **Data Type:** `string`
- **Allowed Values:** Text, typically currency indicators or ranges.
- **Units:** Dinars / Euros.
- **Default Value:** `"Free"`
- **Validation Rules:** Must contain the currency symbol or clear indication.
- **Example:** `"1200 RSD (Approx €10)"`

#### `transportMode`
- **Description:** Recommended mode of transit to reach the venue from Belgrade core.
- **Data Type:** `string`
- **Allowed Values:** `"walk"`, `"car"`, `"train"`, `"boat"`, `"bicycle"`
- **Units:** N/A
- **Default Value:** `"car"`
- **Validation Rules:** Class selection.
- **Example:** `"walk"`

---

### 2.6 Algorithmic Scoring & Tracking

#### `popularity`
- **Description:** Base weight representing relative popularity.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[1.0, 5.0]$
- **Units:** Rating stars.
- **Default Value:** `4.5`
- **Validation Rules:** Synthesized from aggregated reviews.
- **Example:** `4.9`

#### `recommendationScore`
- **Description:** Calculated rank score for sorting.
- **Data Type:** `number`
- **Allowed Values:** Floating point within $[0.0, 150.0]$
- **Units:** Points.
- **Default Value:** `0.0`
- **Validation Rules:** Calculated dynamically by the scoring pipeline.
- **Example:** `118.4`

#### `confidenceScore`
- **Description:** Deterministic data auditing confidence score.
- **Data Type:** `number`
- **Allowed Values:** Percentage within $[0.0, 1.0]$
- **Units:** Percent.
- **Default Value:** `0.90`
- **Validation Rules:** Calculated using the 5-tier checklist in the [Technical Specification](./RecommendationEngineTechnicalSpecification.md).
- **Example:** `0.98`

#### `createdDate`
- **Description:** ISO 8601 timestamp logging database ingestion.
- **Data Type:** `string`
- **Allowed Values:** Valid ISO datetime string.
- **Units:** Time.
- **Default Value:** Current system datetime.
- **Validation Rules:** Date format: `YYYY-MM-DDTHH:mm:ssZ`.
- **Example:** `"2025-11-12T14:30:00Z"`

#### `updatedDate`
- **Description:** ISO 8601 timestamp logging last database update.
- **Data Type:** `string`
- **Allowed Values:** Valid ISO datetime string.
- **Units:** Time.
- **Default Value:** Current system datetime.
- **Validation Rules:** Must match or exceed `createdDate`.
- **Example:** `"2026-07-02T01:00:00Z"`

---

## 3. Field Rules & Allowed Values

To preserve strict type safety, certain categorical properties are bounded using fixed union types or static maps:

### The Category Scale Map:
- `"history"`: Maps to culture, archeology, monuments, and religious structures.
- `"gastronomy"`: Maps to restaurants, wineries, kafanas, and agricultural salaši.
- `"nature"`: Maps to hiking, kayaking, viewpoints, and canyons.
- `"travel"`: Maps to scenic drives, neighborhood strolls, and architectural assets.
- `"clubbing"`: Maps to electronic festivals, splavovi, lounges, and late-night socials.
- `"wellbeing"`: Maps to medical spas, physical wellness centers, and anti-stress complexes.
- `"medical"`: Maps to advanced diagnostics and rehabilitation (retaining EXPO VIP focus).

---

## 4. Dual-Language Schema & Translation Nesting

To maintain Hand-Crafted offline multi-lingual capability, recommendations include a nested `translations` property:

```typescript
// Nested translation definition
translations?: Record<string, {
  title?: string;
  shortDescription?: string;
  longDescription?: string;
  location?: string;
  estimatedCost?: string;
  duration?: string;
  travelTime?: string;
}>;
```

### Key Rules:
1. **Fallback Strategy:** If a language request (e.g., Serbian `"sr"`) cannot resolve a key, the engine must default instantly and gracefully to English (`"en"`).
2. **Key Preservation:** The structural record keys (e.g., `"sr"`, `"de"`) must remain lowercase ISO language codes.

---

## 5. Future Compatibility & Extension Notes

As IDEMO expands, future data schema additions must respect these boundaries:
- **Null Safety:** New properties should be declared as optional (`property?: type`) to prevent breaking current JSON structures.
- **Attribute Scale Stability:** Any new sensory attribute must use the standard $[1.0, 10.0]$ scale to preserve compatibility with the semantic similarity formulas.

---

## 6. Permanent Editorial Collections Architecture Schema

Editorial Collections introduce a canonical presentation and storytelling layer above individual recommendations.

### 6.1 Entity Definition (`EditorialCollection`)
- **`id`**: `string` - Unique identifier for the collection (e.g. `"col_roman_emperors_01"`).
- **`titleEn` / `titleSr` / `titleZh`**: `string` - Multilingual collection titles.
- **`subtitleEn` / `subtitleSr` / `subtitleZh`**: `string` - Multilingual collection subtitles.
- **`introductionEn` / `introductionSr` / `introductionZh`**: `string` - Narrative introduction.
- **`heroImage`**: `string` - Path or URL to high-resolution thematic hero visual asset.
- **`gallery`**: `string[]` - Optional gallery of curated images.
- **`category`**: `EditorialCollectionCategory | string` - Category (`History & Heritage`, `Spiritual & Culture`, `Nature & Trails`, `Urban & Modern`, `Gastronomy & Wine`, `Special Journey`).
- **`estimatedDuration`**: `string` - Recommended completion timeframe (e.g., `"2 Days"` or `"Half Day"`).
- **`visitorProfile`**: `string[]` - Target traveler profiles (e.g., `["History Enthusiasts", "Families"]`).
- **`recommendedSeason`**: `string[]` - Optimal seasons (e.g., `["Spring", "Autumn"]`).
- **`estimatedBudget`**: `string` - General budget band across the collection.
- **`geographicScope`**: `string` - Region or geographical reach (e.g., `"Eastern Serbia & Danube"`).
- **`recommendationIds`**: `string[]` - List of linked `Recommendation.id` items.
- **`recommendedOrder`**: `number[]` - Optional indices specifying suggested journey sequence.
- **`mapRoute`**: `EditorialCollectionMapRouteItem[]` - Optional ordered route coordinates for journey mapping.

---

**Related Technical Documents:**
* [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
* [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
* [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)

