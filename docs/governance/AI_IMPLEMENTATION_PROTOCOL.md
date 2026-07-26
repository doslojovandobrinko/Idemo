# AI Implementation Protocol

## Purpose and Scope

This document defines the mandatory, non-negotiable operational protocol that artificial intelligence agents (including Gemini, Antigravity, and AI Studio assistants) must follow before analyzing, proposing, or modifying any code or database structure in the IDEMO repository.

The goal of this protocol is to guarantee zero visual, structural, or architectural regression, enforce absolute adherence to the `IDEMO_PLATFORM_CONSTITUTION.md`, and prevent unapproved or out-of-scope modifications.

---

## Definitions

* **AI Agent**: Any automated LLM system, coding assistant, or background agent operating on the IDEMO codebase.
* **Constitution**: The governing architecture and platform standard located at `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`.
* **Governance Framework**: The collective suite of standards stored within `/docs/governance/`.
* **Pre-Execution Check**: Mandatory verification steps performed prior to emitting or editing code.

---

## Mandatory Reading Order

Before proposing or applying any code changes, the AI Agent MUST read and digest documentation in the following strict order:

1. `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Authoritative Platform Foundation)
2. `/docs/governance/PROJECT_PRINCIPLES.md` (Permanent Engineering Principles)
3. `/docs/governance/AI_IMPLEMENTATION_PROTOCOL.md` (This document)
4. Specific domain policy relevant to the prompt (e.g., `/docs/governance/SECURITY_MODEL.md` or `/docs/governance/API_CONTRACT_SPECIFICATION.md`)
5. Active task specification provided by the user.

---

## Pre-Implementation Protocol Steps

### Step 1: Constitutional Compliance Verification
The AI Agent must evaluate the requested task against the 13 Core Principles of `IDEMO_PLATFORM_CONSTITUTION.md`.
* *Constraint*: If the user request violates any constitutional principle (e.g., asking to hardcode recommendation records in React or expose Gemini keys in the client), the AI Agent MUST explicitly refuse the implementation and state the constitutional conflict.

### Step 2: Architecture & Scope Review
Identify:
* Exactly which files need modification.
* Exactly which files must NOT be touched.
* Whether the change requires store-release intervention or backend configuration only.

### Step 3: Risk Analysis
Evaluate:
* Potential regression in database RLS policies or RPC security.
* Potential breaking changes in typed API contracts.
* Impact on existing test suites (e.g., pgTAP, unit tests).

### Step 4: Execution Procedure
* Apply minimal surgical modifications.
* Ensure all database RPC parameters use explicit type annotations and handle NULL safety.
* Maintain complete modularity and type safety.

### Step 5: Verification Procedure
* Run static analysis / linting (`lint_applet` or `tsc`).
* Verify applet compilation (`compile_applet`).
* Verify that no files outside the agreed scope were modified.

---

## File Scope Rules

### Allowed File Modifications
* Files explicitly designated in the step specification.
* New additive migration scripts in `/supabase/migrations/` when database updates are required.
* New additive Edge Functions in `/supabase/functions/`.

### Prohibited Modifications
* Existing deployed database migrations (immutable historical record).
* `IDEMO_PLATFORM_CONSTITUTION.md` (immutable constitutional foundation).
* Service-role key exposures or client-side secret injections.

---

## Refusal Standard

If a user prompt requests an action that violates `IDEMO_PLATFORM_CONSTITUTION.md`, the AI Agent MUST respond with:

> **CONSTITUTIONAL REFUSAL**: The requested action violates Principle [X] of `IDEMO_PLATFORM_CONSTITUTION.md`. [Detailed explanation of conflict]. As an AI Agent bound by repository governance, I cannot proceed with this modification.

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
* `/docs/governance/ARCHITECTURE_CHECKLIST.md`
* `/docs/governance/SECURITY_MODEL.md`
