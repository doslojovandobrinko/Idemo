# Project Principles

## Purpose and Scope

This document establishes the permanent guiding engineering philosophy and core operational tenets of the IDEMO platform. These principles serve as the foundation for every technical, architectural, and design decision made by engineers, product owners, and AI agents operating on the repository.

---

## Core Guiding Principles

### 1. Premium Over Volume
IDEMO is defined by editorial luxury and curated excellence. We prioritize a pristine, highly verified catalogue of recommendations over an unverified, high-volume listing. Scale the catalogue quality, not the visual clutter of the interface.

### 2. Configuration Over Code
The IDEMO platform is configuration-driven. Content, partner assignments, pricing rules, categories, and feature flags must live in Supabase, allowing continuous evolution without submitting new mobile application store builds.

### 3. Backend Over Frontend
Core business logic, partner qualification, state machines, offer locking, expiry processing, and transactional audits MUST reside deterministically in PostgreSQL and Edge Functions. The React application is a stable presentation layer.

### 4. Deterministic Rules Over AI
Gemini and AI models provide advisory assistance (drafting, structuring, summarizing). Partner qualification, candidate ordering, offer acceptance, locking, and database mutations MUST remain 100% deterministic and auditable.

### 5. Editorial Quality Over Automation
No AI model or automated process can publish public content directly. Human editorial review is an immutable requirement before any recommendation or localized translation enters the published state.

### 6. Stable Application, Evolving Platform
The application architecture remains stable while the underlying catalogue, partner network, and operating configuration continuously expand. Code releases occur for capabilities, not content updates.

### 7. Security Before Convenience
Service-role keys, worker secrets, and Gemini API keys are server-side secrets. They must never be exposed to frontend code or client bundles. Row Level Security and explicit permissions protect every database object.

### 8. Single Source of Truth
Supabase PostgreSQL is the sole authoritative source of truth for system state. Local client storage (safeStorage, React state) provides transient interface support and caching only.

### 9. Evidence Over Assumptions
Architectural modifications, database queries, and code edits must be justified by evidence, tested against pgTAP suites, verified with static analysis tools (`db lint`), and checked for zero visual or functional regression.

### 10. Design for Long-Term Scale
Every system component—from database indexes to Edge Function boundaries—must be engineered for long-term maintainability, strict type safety, and seamless international expansion.

### 11. Platform Extension Over Architectural Redesign (Core Engine Freeze)
Once the Core Engine architecture is established and validated, future development shifts entirely to platform extension. No further architectural redesigns are permitted. Future engineering priorities focus on operational tooling (IDEMO Studio), catalogue and content expansion, partner onboarding, and quality assurance, while preserving strict backward compatibility and eliminating architectural churn.

### 12. Editorial Content Is Versioned (Principle 28)
Every editorial asset (Recommendations, Partners, Editorial Collections, Destination Guides, Translation Records, Images, Editorial Notes) shall have its own independent version history, completely decoupled from Application and Destination Package versions. Every editorial asset shall support Current Version, Previous Versions, Change History, Approval History, and Publication History.

### 13. Every Change Has A Reason (Principle 29)
Every editorial modification shall record what changed, why it changed, who approved it, date & time, previous version, new version, and the first Destination Package containing the change. No editorial modification shall become anonymous.

### 14. Everything Is Draft Until Published (Principle 30)
Every editorial object shall progress through a governed lifecycle (`Research Candidate → Editorial Draft → Review → Approved → Canonical → Included In Destination Package → Published → Archived`). Only Published content becomes visible to visitors.

### 15. Editorial Change Intelligence (Principle 31)
Whenever an editorial object changes, IDEMO Studio shall automatically determine downstream impact (translations requiring review, partner mappings affected, collections affected, destination packages requiring regeneration, publication readiness updated). Editors shall never manually determine dependencies.

### 16. Destination Health Dashboard (Principle 32)
Every destination shall expose a real-time operational health dashboard tracking Recommendations, Partners, Translations, Images, Coordinates, Mood Orbit, Editorial Collections, Destination Packages, QA Status, Outstanding Blocking Issues, and Overall Release Readiness to answer: "Is this destination ready for release today?"

### 17. Translation Review Workspace (Principle 33)
Localization shall become a permanent operational capability inside IDEMO Studio (side-by-side language comparison, difference highlighting, translation approval workflow, mobile preview, terminology validation, progress dashboard, Translation Memory, Editorial Change Intelligence, automatic review requests when English changes, version comparison, human approval workflow). No future localization shall require external spreadsheets or manual comparison.

### 18. Operational Tooling Over Engineering (Principle 34)
The Core Engine is complete. Future investment shall prioritize editorial productivity, quality assurance, partner onboarding, content governance, publishing workflow, operational analytics, and release confidence before introducing new technical capabilities.

### 19. Destination Intelligence Platform (Principle 35)
IDEMO Studio is officially recognized as the permanent operational platform of IDEMO. Its purpose is to manage Recommendations, Partners, Editorial Collections, Translations, Destination Packages, Publication, Analytics, Editorial Intelligence, Quality Assurance, and Release Governance. The mobile application remains a presentation client while authoritative business intelligence resides within IDEMO Studio.

### 20. Single Source of Truth (Principle 36)
Every business object managed by IDEMO (Recommendations, Partners, Editorial Collections, Destinations, Translations, Image Assets, Mood Orbit Calibrations, Geographic Coordinates, Contact Details, Editorial Notes, Package Manifests, Category Definitions, Taxonomies, Service Areas, Language Definitions) shall have exactly one authoritative record stored in Supabase. No duplicated business data shall exist as independently maintained copies. Dependent systems (mobile applications, destination packages, search indexes, analytics, APIs, offline caches, partner portals, translation workspaces) consume authoritative data through generated or cached views. Destination packages and offline caches are outputs and snapshots, never authoritative.

### 21. Platform Maturation Phase & Operational Governance
The governance foundation of IDEMO is complete, the Core Engine is frozen, the Editorial Intelligence Layer is established, and the Single Source of Truth architecture is active. Future engineering prioritizes operational excellence, production readiness, editorial & partner quality, reliability, performance, and maintainability over feature expansion. All development activities must strictly align with approved operational streams (Editorial Operations, Partner Operations, Destination Operations, Platform Operations, and Production Operations).

### 22. Architecture Freeze & Stage-Gated Execution (Principle 38)
Once a work package receives explicit architectural approval, the approved architecture becomes frozen for that work package. Implementation must execute the frozen specification exactly. No human engineer or AI agent may redesign, reinterpret, simplify, substitute, rename, merge, relocate, optimize, broaden, narrow, or introduce unsolicited "minor improvements" unless a new architectural review is explicitly opened and approved. Any repository, live-schema, runtime, deployment, security, or platform conflict with the frozen architecture mandates an immediate STOP. Every work package progresses through 5 mandatory stage gates: Gate 1 (Verified Baseline), Gate 2 (Architectural Approval & Freeze), Gate 3 (Implementation with Scope Manifest), Gate 4 (Verification with Evidence), and Gate 5 (Deployment Approval). Optional post-freeze refinements are logged in a separate future backlog.

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
* `/docs/governance/AI_IMPLEMENTATION_PROTOCOL.md`
* `/docs/governance/EDITORIAL_PUBLISHING_POLICY.md`
