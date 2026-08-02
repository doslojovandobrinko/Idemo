# IDEMO AI Development Guidelines

**The Definitive Collaboration Protocol, Quality Gates, and Safety Mandates for AI-Assisted System Synthesis**

- **System Version:** v2.4.0-Canonical
- **Release Date:** July 2, 2026
- **Author:** Director of Engineering & Lead AI Architect
- **Status:** Approved / Active Reference

---

## Table of Contents

1. [AI Development Philosophy](#1-ai-development-philosophy)
2. [The Core Directives (The Absolute Laws of Code Synthesis)](#2-the-core-directives-the-absolute-laws-of-code-synthesis)
3. [The Documentation Hierarchy & Compliance Rules](#3-the-documentation-hierarchy--compliance-rules)
4. [AI Code Review & Quality Gates](#4-ai-code-review--quality-gates)
5. [The Step-by-Step AI Implementation Pipeline](#5-the-step-by-step-ai-implementation-pipeline)
6. [Regression Prevention Checklist](#6-regression-prevention-checklist)
7. [Bespoke Prompt Blueprints for Future Developers](#7-bespoke-prompt-blueprints-for-future-developers)

---

## 1. AI Development Philosophy

In the IDEMO codebase, we view AI coding assistants (such as Google Gemini, OpenAI ChatGPT, and future autonomous agents) as **co-equal system maintainers**. We reject low-quality, copy-paste "AI slop." We mandate that any artificial intelligence collaborating on this system acts with the maturity, precision, and structural discipline of a Principal Software Engineer.

AI contributions must focus on:

- **Absolute Code Precision:** Writing clean, modular, self-documenting TypeScript.
- **Context-Aware Expansion:** Deeply understanding the existing codebase, local data tables, and structural handbooks _before_ generating a single line of code.
- **Architectural Honesty:** Designing simple, elegant solutions and completely avoiding visual clutter, telemetry logs, or pseudo-technical larping.

---

## 2. The Core Directives (The Absolute Laws of Code Synthesis)

When an AI agent modifies this codebase, it must adhere to five absolute laws:

```
                            THE FIVE LAWS OF SYNTHESIS
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │ 1. Zero Regressions  │ ──► │ 2. Refine > Replace  │ ──► │ 3. Data Integrity    │
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
                                         │
                                         ▼
 ┌──────────────────────┐     ┌──────────────────────┐
 │ 5. Complete Scopes   │ ──► │ 4. Privacy Guardrails│
 └──────────────────────┘     └──────────────────────┘
```

1. **Law 1: Zero Regressions:** You must never break existing working features, sorting logic, or page styling to implement something new. If a change breaks the compiler or the linter, it is a critical failure.
2. **Law 2: Refine over Replace:** Do not throw away established files or components to start fresh. Build incrementally on existing, production-proven code paths.
3. **Law 3: absolute Data Integrity:** The recommendation data structures are governed strictly by the [Data Dictionary](./DataDictionary.md). You are forbidden from introducing arbitrary properties or inconsistent naming conventions.
4. **Law 4: Uncompromising Privacy Guardrails:** You must never introduce telemetry trackers, analytics endpoints, server-side data loggers, or cookie collectors.
5. **Law 5: complete Scopes:** If you are tasked with implementing a multi-step feature, complete **all** steps in sequence. Never stop halfway to ask for permission.

---

## 3. The Documentation Hierarchy & Compliance Rules

IDEMO's Engineering Knowledge Base is the absolute authoritative foundation. Under no circumstances may an AI agent contradict the established documents.

### The Reading Order Strategy:

Before performing any structural code modifications, the AI agent **must** execute the following tool sequence:

1. `view_file` on `docs/README.md` to understand the general layout.
2. `view_file` on `docs/ProductRequirementsDocument.md` to verify the feature's product alignment.
3. `view_file` on `docs/DesignSystemHandbook.md` if the change involves any user interface, typography, or styling adjustments.
4. `view_file` on `docs/RecommendationEngineTechnicalSpecification.md` if modifying the sorting, scoring, or polar jitter algorithms.

_Once implemented, the AI agent is required to update the central [Changelog](./CHANGELOG.md) to log modifications._

---

## 4. AI Code Review & Quality Gates

Every code synthesis task must pass three quality gates:

### Gate 1: Typographic & Linter Safety (The Compile Gate)

- Code must compile cleanly using the standard production builder:
  `npm run build`
- TypeScript must enforce strict typing with zero implicit `any` definitions.

### Gate 2: Algorithmic Complexity Check (The Performance Gate)

- Calculations involving the 100+ curations list must be bounded within $O(N \log N)$ complexity to maintain the sub-millisecond execution target.

### Gate 3: Image & Anchor Security Check (The Security Gate)

- Cover images must be checked for stable HTTPS routes and have the `referrerPolicy="no-referrer"` configuration in React layouts.

---

## 5. The Step-by-Step AI Implementation Pipeline

```
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │  Step 1: Read Specs  │ ──► │   Step 2: Dry Run   │ ──► │  Step 3: Modify Code │
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
                                                                       │
                                                                       ▼
 ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
 │ Step 6: Log Changelog│ ──► │   Step 5: Compile    │ ──► │   Step 4: Run Lint   │
 └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

1. **Read Specs:** Retrieve related specifications from the `/docs` folder.
2. **Dry Run:** Design the component structure, ensuring zero dependency clashes.
3. **Modify Code:** Execute precise, surgical modifications using `edit_file` or `multi_edit_file` instead of replacing complete files.
4. **Run Lint:** Execute `npm run lint` (or `lint_applet` tool) to verify typing safety.
5. **Compile:** Execute `npm run build` (or `compile_applet` tool) to verify production-readiness.
6. **Log Changelog:** Append the exact changes made to `docs/CHANGELOG.md`.

---

## 6. Regression Prevention Checklist

Before completing a turn, the AI must verify:

- [ ] No existing imports are broken.
- [ ] No styling has been removed or modified (unless requested).
- [ ] The port configuration is strictly preserved on port `3000` bound to host `0.0.0.0`.
- [ ] No server-side API keys are exposed to the client bundle.
- [ ] No tracking pixels or telemetry modules have been introduced.

---

## 7. Bespoke Prompt Blueprints for Future Developers

To guide future AI interactions with this codebase, use these precise prompts to achieve high-fidelity contributions:

### Prompt 1: Adding a New Curation

> _"Analyze the `/docs/DataDictionary.md` and `/docs/MoodOrbitCalibrationHandbook.md`. We need to insert a new curation with ID `rec_belgrade_modern_art_museum`. Provide its coordinates rounded to $0.5$ increments. Ensure there are no overlaps with existing curations; apply polar jitter if necessary. Formulate the nested translations for English and Serbian (Cyrillic and Latin)."_

### Prompt 2: Refactoring a UI Component

> _"Open `/docs/DesignSystemHandbook.md` and read the spacing and typography standards. Refactor `/src/components/RecommendationCard.tsx` to align with the Swiss Modernism design guidelines. Maintain a clean grid, use Space Grotesk for titles, Inter for details, and JetBrains Mono for metrics. Do not change any business logic, states, or callbacks."_

---

**Related Technical Documents:**

- [IDEMO Mood Orbit Calibration Handbook](./MoodOrbitCalibrationHandbook.md)
- [IDEMO Curation Standards Handbook](./CurationStandardsHandbook.md)
- [IDEMO Recommendation Engine Technical Specification](./RecommendationEngineTechnicalSpecification.md)
- [IDEMO Data Dictionary](./DataDictionary.md)
- [IDEMO Recommendation QA Handbook](./RecommendationQAHandbook.md)
- [IDEMO Country Expansion Handbook](./CountryExpansionHandbook.md)
- [IDEMO Product Requirements Document](./ProductRequirementsDocument.md)
- [IDEMO Design System Handbook](./DesignSystemHandbook.md)
- [IDEMO Architecture Decision Log](./ArchitectureDecisionLog.md)
- [IDEMO Changelog](./CHANGELOG.md)
