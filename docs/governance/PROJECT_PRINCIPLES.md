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

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
* `/docs/governance/AI_IMPLEMENTATION_PROTOCOL.md`
* `/docs/governance/EDITORIAL_PUBLISHING_POLICY.md`
