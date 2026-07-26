# AI Integration Policy

## Purpose and Scope

This document defines the governing boundaries, security constraints, and operational permissions for Artificial Intelligence (Gemini API) integration within the IDEMO ecosystem. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Sections 9, 10, 11, 12, and 13, **Gemini assists; Gemini never governs**.

---

## Core Operational Rule

> **Gemini is an advisory, assisted-intelligence layer. Gemini must never exercise autonomous administrative, publishing, routing, or database mutation authority.**

---

## Allowed AI Capabilities (Assistance Scope)

Gemini MAY be utilized for:
* Drafting initial recommendation descriptions and editorial summaries.
* Drafting multi-language translations for human editorial review.
* Parsing unstructured visitor inquiry text to extract structured search intent (dates, capabilities, preferences).
* Suggesting categories, tags, and 2D Mood Orbit coordinates.
* Detecting potential duplication or missing information in drafts.
* Summarizing complex travel requests for partner review.

---

## Prohibited AI Actions (Governance Prohibitions)

Gemini MUST NEVER be permitted to:
* Publish recommendations or approve editorial content.
* Activate, approve, or suspend partners.
* Select, assign, or route inquiries to partners independently.
* Accept or decline partner offers on behalf of partners or visitors.
* Alter inquiry, partner, or notification state directly in the database.
* Override deterministic qualification, locking, expiry, or routing rules.
* Modify pricing or system configuration settings.
* Execute direct, unrestricted database writes.

---

## Technical Security & Boundary Rules

### 1. Server-Side Execution Only
* All Gemini API calls MUST execute strictly inside secure server-side environments (Supabase Edge Functions).
* API keys MUST be stored in server secrets (`GEMINI_API_KEY`) and NEVER exposed in frontend code, VITE-prefixed variables, or client bundles.

### 2. Structured JSON Output Validation
* Every Gemini response affecting operational flows MUST return JSON conforming to an explicit schema.
* Free-form text parsing for business logic is strictly prohibited.
* All AI outputs MUST be validated against database entity constraints (verifying entity existence) prior to processing.

### 3. Fallback & Cost Control
* Edge Functions MUST enforce strict timeouts, retry limits, and schema validation error handling.
* If Gemini fails or returns low-confidence output, the application MUST fall back gracefully to deterministic default rules.

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Sections 9–13)
* `/docs/governance/SECURITY_MODEL.md`
* `/docs/governance/EDITORIAL_PUBLISHING_POLICY.md`
