# IDEMO Product Requirements Document (PRD)
**Canonical Product Definition, Vision, Target Personas, and Operational Blueprints**

- **Product Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Product Officer & Lead Systems Analyst
- **Status:** Approved / Active Reference

---

## Revision History

| Version | Date | Author | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| v1.0.0 | 2025-11-12 | Product Team | Core requirements for Belgrade pilot launch. | Superseded |
| v2.0.0 | 2026-03-15 | Senior Curation Lead | Added EXPO 2027 and high-end medical travel constraints. | Superseded |
| v2.4.0 | 2026-07-02 | Lead AI Agent | Expanded product definitions, integration with Mood Orbit calibrators. | Active |

---

## Table of Contents
1. [Vision, Mission & Core Philosophy](#1-vision-mission--core-philosophy)
2. [Problem Statement: Why Modern Travel Apps Fail](#2-problem-statement-why-modern-travel-apps-fail)
3. [Target User Personas](#3-target-user-personas)
4. [Core Product Principles](#4-core-product-principles)
5. [Functional Requirements Blueprint](#5-functional-requirements-blueprint)
6. [Non-Functional Requirements Specification](#6-non-functional-requirements-specification)
7. [Product Success & North Star Metrics](#7-product-success--north-star-metrics)

---

## 1. Vision, Mission & Core Philosophy

### The Vision
To build a world where travel is guided by emotional alignment and cultural authenticity rather than advertisement bids, spam reviews, or algorithmic echo chambers.

### The Mission
To connect premium travelers, EXPO delegates, and cultural explorers directly with high-fidelity, verified, and deeply localized cultural experiences. We fulfill this by replacing boring query forms with the **IDEMO Mood Orbit**—a continuous, sensory-environmental 2D cognitive map that matches the user's emotional energy with tailored destinations in sub-millisecond response times.

---

## 2. Problem Statement: Why Modern Travel Apps Fail

Modern travel applications suffer from three structural failures:
1. **Search Fatigue:** Forcing users to type into empty search inputs assumes they already know what they want. It creates high cognitive strain.
2. **Review Pollution & Sponsor Bias:** Popular platforms are polluted by fake, sponsored, or highly commercialized tourist traps. Authentic, high-quality, family-owned local gems are pushed to page 5 because they don't buy ad slots.
3. **Privacy Degradation:** Travel apps aggressively track user location history, search logs, and device metadata to sell to downstream ad networks.

### The IDEMO Antidote
IDEMO treats travel as a sensory journey. 
- **Curation over Search:** Instead of listing thousands of mediocre venues, IDEMO curates a premium dataset of exactly 100+ highly verified assets.
- **Cognitive Mapping:** By mapping experiences onto the [Mood Orbit](./MoodOrbitCalibrationHandbook.md), users browse by mood sliders rather than text keywords.
- **Absolute Privacy:** IDEMO operates an offline-first, client-side model with no tracking pixels, zero cloud-profiling databases, and no mandatory registration.

---

## 3. Target User Personas

The platform optimizes for nine key travelers, particularly targeting the millions of global visitors attending **EXPO 2027 Belgrade**:

### 3.1 Business & EXPO Delegates
- **Context:** Highly limited free time between meetings; demands flawless execution, high English fluency, stable Wi-Fi, and premium quiet settings.
- **Preferred Quadrant:** II (Contemplative Urban - e.g., Humska Cigar Lounge).

### 3.2 First-Time International Visitors
- **Context:** High anxiety about getting lost, language barriers, and local customs; requires clear directions, localized naming guides, and historic context.
- **Preferred Quadrant:** Center (Universal Comfort - e.g., Kalemegdan Park).

### 3.3 Multi-generational Families
- **Context:** Traveling with children and elderly relatives; demands high physical accessibility, child-friendly spaces, and low adrenaline risk.
- **Preferred Quadrant:** III (Reflective Nature / Quiet Spa - e.g., Vrnjačka Banja).

### 3.4 Couples & Romantic Explorers
- **Context:** Seeking intimate, aesthetically beautiful settings with premium dining.
- **Preferred Quadrant:** II & III (Quiet Luxury - e.g., Salon 1905).

### 3.5 Solo Adventurers
- **Context:** High physical energy, seeking social connections, extreme nature, or raw night culture.
- **Preferred Quadrant:** I & IV (Active Nature & Clubbing - e.g., Tara Rafting, Drugstore Belgrade).

### 3.6 Luxury & Premium Collectors
- **Context:** Expecting ultra-exclusive, customized care (VIP/Platinum tiers), private vineyard estates, or bespoke artisan workshops.
- **Preferred Quadrant:** Outer ring, high luxury index ($>8.5$).

### 3.7 Medical & Wellbeing Travelers
- **Context:** Seeking advanced diagnostics, longevity treatments, or restorative thermal springs.
- **Preferred Quadrant:** III (Reflective Nature / Spa).

### 3.8 Weekend / Short-Dwell Visitors
- **Context:** Cruising down the Danube or on a 48-hour layover; demands immediate proximity to Belgrade core.
- **Preferred Quadrant:** Y-axis high ($Y > 1.0$).

### 3.9 Academic & Heritage Researchers
- **Context:** Demands extreme historical truth, medieval monastery tours, and deep cultural immersion.
- **Preferred Quadrant:** III (e.g., Studenica Monastery).

---

## 4. Core Product Principles

```
                             PRODUCT PILLARS
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │    Privacy First     │     │  Concierge Curation  │     │  Cognitive Simplicity│
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

- **Privacy First:** Data never leaves the user's device. No login, no cloud tracking, no advertising SDKs.
- **Concierge over Search:** Guide the user like a professional local concierge. Frame each choice with a "Why It Matters" highlight.
- **No Dark Patterns:** No fake urgency popups ("3 people are booking this now!"), no countdown clocks, and no hidden sponsorships.
- **Offline-First:** All core calculations and text descriptions must run offline, ensuring perfect operations in canyons, flight cabins, and dense concrete halls.

---

## 5. Functional Requirements Blueprint

The IDEMO interface is divided into six distinct functional modules:

### 5.1 Landing & Language Selection
- Simple, high-fidelity entry screen with a premium cinematic cover image.
- Single-tap language selection (English vs. Cyrillic/Latin Serbian) with instant, non-flickering client-side translation.

### 5.2 The Mood Orbit UI Canvas
- A beautiful, responsive SVG circular canvas projecting the 2D coordinate space.
- A physical-feeling coordinate handle that users drag to dynamically recalculate recommendations.
- Interactive glowing dots representing curations that expand into floating detail previews on hover or tap.

### 5.3 Today's Concierge Dashboard
- High-priority, real-time recommendation panel adapting to current local weather, day of week, and time of day.
- Highlighted daily editorial briefing (Slang guides, cultural tips, weather alerts).

### 5.4 Explore Feed (Categorized Filters)
- Side-scrolling lists of the 100+ curations grouped by primary categories.
- Sliders allowing granular control over budget limit (€100-500) and travel duration limit (2-48 hours).
- Highly responsive cards displaying the [Mini Mood Grid](./RecommendationEngineTechnicalSpecification.md#7-mini-mood-grid-rendering-mechanics).

### 5.5 My Event Planner
- Client-side schedule where visitors allocate saved recommendations into specific daily time blocks.
- **Canonical Inquiry Entry Point:** The discovery interface remains focused purely on inspiration. Recommendation cards feature a single action ("Add to My Event Planner") that displays a temporary visual confirmation ("✓ Added to My Event Planner [View Planner]") with no immediate inquiry creation.
- **Progressive Disclosure Interface:** Inside the planner, each saved experience card maintains a calm, uncluttered appearance. Tapping a discrete, premium action labeled **"Arrange This"** expands the card (or opens a lightweight sheet) to progressively disclose input fields for date, optional time, and optional personal notes before submission.
- **Wording & Brand Alignment:** Replaces all transactional marketplace terminology (such as "Ask About This", "Request Assistance", "Get Quotations", or "Contact Partners") with the understated, concierge-oriented **"Arrange This"** concept. This guarantees that visitors interact exclusively with IDEMO as the trusted curator.
- **Conflict Prevention:** Integrates client-side smart duration logic to automatically flag and prevent scheduling overlaps.

### 5.6 Admin Panel & Analytics (Internal Only)
- Secure, hidden dashboard for system calibrators.
- Renders aggregate coordinate distribution metrics, coverage heat maps, and cluster analyses.

---

## 6. Non-Functional Requirements Specification

- **Algorithmic Performance:** Sorting and scoring 100+ listings must execute in $<2.5\text{ms}$ on standard mobile devices ($O(N \log N)$ complexity).
- **Accessibility (WCAG 2.1 AA):** High-contrast typography, screen-reader text labels on SVG nodes, and touch targets of at least $44\text{px} \times 44\text{px}$ on mobile.
- **Multi-lingual Consistency:** Simultaneous support for English and Serbian (both Latin and Cyrillic transcripts) without coordinate or ID misalignment.
- **Offline Resiliency:** Zero remote API calls are required to run the core matching, mapping, or scheduling loops.

---

## 7. Product Success & North Star Metrics

We evaluate IDEMO's product success using five quantitative parameters:

1. **Cognitive Match Time:** The duration from app boot to a user saving their first recommendation. (Target: $<15$ seconds).
2. **Curation Relevance Score:** Post-trip user satisfaction rating of saved items. (Target: $>4.7/5.0$).
3. **Database Quality Index:** Ratio of curations passing the full 23-point checklist defined in the [QA Handbook](./RecommendationQAHandbook.md). (Target: $100\%$).
4. **Offline Operational Rate:** Percentage of app capabilities functional with cellular network disconnected. (Target: $>95\%$).
5. **Onboarding Conversion Rate:** Percentage of users completing onboarding and reaching the main dashboard. (Target: $>98\%$).

---
**Related Technical Documents:**
* [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
* [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
* [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
* [IDEMO Data Dictionary](./DataDictionary.md)
* [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
* [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
* [IDEMO Design System Handbook](./DesignSystemHandbook.md)
* [IDEMO AI Development Guidelines](./AIDevelopmentGuidelines.md)
* [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
* [IDEMO Changelog](./CHANGELOG.md)
