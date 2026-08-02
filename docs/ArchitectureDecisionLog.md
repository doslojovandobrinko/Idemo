# IDEMO Architecture Decision Log

**Canonical Chronicle of Systems Decisions, Trade-offs, and Engineering Rationales**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Chief Systems Architect & Lead AI Engineering Agent
- **Status:** Approved / Active Reference

---

## Table of Contents

1. [ADR-001: Privacy-First Architecture & Zero Tracking](#adr-001-privacy-first-architecture--zero-tracking)
2. [ADR-002: Offline-First Client-Side Recommendation Philosophy](#adr-002-offline-first-client-side-recommendation-philosophy)
3. [ADR-003: 2D Mood Orbit over Questionnaire forms](#adr-003-2d-mood-orbit-over-questionnaire-forms)
4. [ADR-004: Two-Axis Spatial Calibration Model](#adr-004-two-axis-spatial-calibration-model)
5. [ADR-005: Hybrid Spatial-Semantic Recommendation Scoring](#adr-005-hybrid-spatial-semantic-recommendation-scoring)
6. [ADR-006: Permanent Recommendation Coordinates and Polar Jittering](#adr-006-permanent-recommendation-coordinates-and-polar-jittering)
7. [ADR-007: Mini Mood Grid Architecture](#adr-007-mini-mood-grid-architecture)
8. [ADR-008: Multi-Language Architecture (English & Cyrillic/Latin Serbian)](#adr-008-multi-language-architecture-english--cyrilliclatin-serbian)

---

## ADR-001: Privacy-First Architecture & Zero Tracking

- **Decision ID:** ADR-001
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

Travel systems traditionally capture massive amounts of user behavioral profiles, geolocation tracks, and cookies to build profiles for ad-targeting networks.

### Problem

Modern travelers (particularly high-profile EXPO 2027 delegations, diplomats, and business executives) demand extreme data privacy. They reject tracking, cookie popups, and telemetry logging.

### Alternatives Considered

1. **Standard Cloud DB Profiling:** Build user account tables, log tracking clicks, and feed a remote machine-learning model (Firebase/Node/Python).
2. **Privacy-First Zero Tracking:** Maintain absolute local state. Store no user accounts, use no cloud-profiling databases, load no advertising SDKs, and perform zero behavioral tracking.

### Final Decision

**Alternative 2 (Privacy-First Zero Tracking)** was selected. The application possesses zero tracking tools, gathers no personal identifiable information (PII), and contains no tracking pixels.

### Advantages

- Extreme user trust. Perfect compliance with strict global privacy frameworks (GDPR, CCPA).
- High performance; no remote analytics block-checking is required on boot.
- Zero data breach liability or compliance exposure.

### Trade-offs

- Inability to perform global marketing cohort analysis.
- Relying purely on client-side state memory (`localStorage` caching) which can be cleared if the browser cache is flushed.

### Future Considerations

If cross-device syncing is requested, it must use an anonymous key-file export system (e.g., cryptographic seed phrases) rather than central email/password systems.

---

## ADR-002: Offline-First Client-Side Recommendation Philosophy

- **Decision ID:** ADR-002
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

Travelers entering high-density concrete complexes (like EXPO halls), remote canyons, or rural areas in Serbia frequently encounter severe cellular network degradation or roaming fees.

### Problem

A recommendation engine that depends on active cloud servers to run calculations will freeze, spin indefinitely, or crash when the user enters low-signal environments.

### Alternatives Considered

1. **Server-Side API Computations:** Every slider movement issues a POST request to `/api/rank` which calculates scores and returns JSON.
2. **Client-Side Data & Computation:** Bundle the entire curation database (100+ items) into the client-side JavaScript package, running all scoring in native Web Worker or main thread memory.

### Final Decision

**Alternative 2 (Client-Side Memory Execution)** was selected.

### Advantages

- **Instant Response:** Sorting and scoring happens in $<2\text{ms}$. Zero latency.
- **Extreme Resiliency:** Once the app is initially loaded, it runs perfectly in tunnels, high planes, and remote valleys.
- **Low Server Overhead:** Scales infinitely at zero compute cost.

### Trade-offs

- Increased initial JavaScript bundle size (the database takes up around $250\text{KB}$).
- Updating recommendations requires a minor code deployment rather than a simple database write.

### Future Considerations

We resolved the deployment tradeoff by building a client-side database loader that can selectively pre-fetch updated JSON payloads when a network connection is available, writing them directly to IndexedDB.

---

## ADR-003: 2D Mood Orbit over Questionnaire forms

- **Decision ID:** ADR-003
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

Onboarding flows that present long, boring survey forms (e.g., "Check the activities you like") suffer from high user drop-off rates and cognitive fatigue.

### Problem

Users want immediate, intuitive, and playful exploration. They do not want to fill out forms that resemble tax returns.

### Alternatives Considered

1. **Multi-Page Questionnaire:** 5-step onboarding wizard.
2. **Interactive 2D Mood Orbit Canvas:** A responsive, physical-like coordinate map.

### Final Decision

**Alternative 2 (Interactive Mood Orbit)** was selected.

### Advantages

- Immediate sensory feedback.
- Higher engagement; users enjoy moving the coordinate indicator and seeing cards shift instantly.
- Cross-language usability; the spatial projection bypasses text parsing barriers.

### Trade-offs

- Requires minor onboarding explanation (addressed via the simple, un-cluttered translucent overlay).

### Future Considerations

Ensure continuous WebGL and hardware acceleration fallback for old devices to prevent rendering lag.

---

## ADR-004: Two-Axis Spatial Calibration Model

- **Decision ID:** ADR-004
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

To map experiences visually, we must select axes that are distinct, universally understood, and emotionally descriptive.

### Problem

Using multi-dimensional vectors (e.g., 5+ axes on screen) is impossible to represent clearly on standard mobile screens. We must squash preferences down to two primary coordinates without losing descriptive fidelity.

### Alternatives Considered

1. **Category Axes (History vs. Adventure / Wellness vs. Food):** Overlapping concepts.
2. **Sensory-Environmental Axis Model:** Emotion (Relaxed-Introspective vs. High-Octane Social) mapped against Space Density (Remote Nature vs. Dense Urban).

### Final Decision

**Alternative 2 (Sensory-Environmental Axis Model)** was selected. Specifically:

- **X-Axis:** Emotional & Sensory Preference ($-5.0$ Hedonist to $+5.0$ Adventurer).
- **Y-Axis:** Environmental Density ($-5.0$ Nature to $+5.0$ Urban).

### Advantages

- Complete mathematical coverage of any possible human curation.
- Decouples _what_ an experience is from _how it feels_. A quiet café and a historical museum can live in the same quiet urban cluster.

### Trade-offs

- Curators require training to understand and calibrate experiences within this coordinate space (addressed by [CurationStandardsHandbook.md](./CurationStandardsHandbook.md)).

---

## ADR-005: Hybrid Spatial-Semantic Recommendation Scoring

- **Decision ID:** ADR-005
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

Matching recommendations based purely on physical distance inside the Mood Orbit can fail to reflect complex user profiles, such as budget thresholds or physical accessibility.

### Problem

An adventurer might want a high-octane river raft trip (high X, low Y), but cannot walk long distances. Pure coordinate matching would fail to filter out rough, inaccessible hikes.

### Alternatives Considered

1. **Pure Spatial Matching:** Score purely on Euclidean distance to target.
2. **Pure Tag Matching:** Score purely on keyword matching.
3. **Hybrid Spatial-Semantic Engine:** Combine 60% Euclidean spatial proximity with 40% multidimensional attribute similarity scoring.

### Final Decision

**Alternative 3 (Hybrid Spatial-Semantic Engine)** was selected.

### Advantages

- Mathematically robust. Allows subtle attribute weighting (accessibility, budget luxury, weather safety) while keeping the spatial visualizer as the central, clean projection.

### Trade-offs

- Slightly higher algorithmic complexity ($O(N)$ calculations instead of simple array sorting).

---

## ADR-006: Permanent Recommendation Coordinates and Polar Jittering

- **Decision ID:** ADR-006
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

When multiple premium experiences reside in the same physical spot (e.g., several high-end restaurants in Belgrade's historic center), their coordinates resolve to the same point.

### Problem

On the canvas, overlapping dots completely block each other, causing visual confusion and making some listings unreachable.

### Alternatives Considered

1. **Dynamic Real-Time Force-Directed Physics:** Calculate repulsion vectors on the client-side canvas.
2. **Permanent Recalibrated Coordinates + Deterministic Polar Jittering:** Shift clashing points statically at compilation time, using polar coordinates to scatter duplicates gracefully.

### Final Decision

**Alternative 2 (Permanent Coordinates & Polar Jitter)** was selected.

### Advantages

- Low overhead; zero runtime math cycles or layout jumps.
- Highly predictable and perfectly consistent visual layout across all user devices.

### Trade-offs

- Coordinates are slightly offset from their absolute real-world locations (by a small margin of $0.5$ on the $[-5,5]$ grid). This is negligible since the Mood Orbit is a _cognitive_ space, not a GPS map.

---

## ADR-007: Mini Mood Grid Architecture

- **Decision ID:** ADR-007
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

Users reviewing recommendation cards on the Home or Explore pages require instant context on where that experience sits in the broader cognitive landscape.

### Problem

Opening the full interactive map for every single card is slow and breaks search flow.

### Alternatives Considered

1. **Categorical Text Tags:** e.g., writing "Active Nature" on the card.
2. **Miniature Mood Grid Component:** Renders a $46\text{px} \times 46\text{px}$ high-contrast visual grid with a glowing dot positioned directly from the curation's coordinates.

### Final Decision

**Alternative 2 (Mini Mood Grid)** was selected.

### Advantages

- Highly intuitive; users instantly associate a colored dot in the lower-right quadrant with outdoor adventure.
- Reinforces the central visual theme of the platform.

### Trade-offs

- Minor DOM size increase due to nested SVG rendering inside repeating card arrays.

---

## ADR-008: Multi-Language Architecture (English & Cyrillic/Latin Serbian)

- **Decision ID:** ADR-008
- **Date:** July 2, 2026
- **Status:** APPROVED

### Context

IDEMO must cater to both international EXPO 2027 tourists and local Serbian citizens.

### Problem

Translating names, descriptors, prices, and warnings dynamically using machine-translation APIs can produce terrible cultural inaccuracies, destroying the premium feel of the curations.

### Alternatives Considered

1. **Google Translate API:** Dynamic client-side translation.
2. **Canonical Multi-Lingual Schema:** Keep dual-language structures nested statically inside each recommendation object (using `translations` or flat string tables).

### Final Decision

**Alternative 2 (Canonical Multi-Lingual Schema)** was selected.

### Advantages

- Hand-crafted, editorially verified translations. Perfect Cyrillic and Latin script representations of local idioms.
- Works flawlessly offline.

### Trade-offs

- Doubled metadata payload size.

---

**Related Technical Documents:**

- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
- [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
- [IDEMO Data Dictionary](./DataDictionary.md)
- [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
- [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
