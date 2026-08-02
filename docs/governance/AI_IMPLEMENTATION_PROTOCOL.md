# AI Implementation Protocol

## Purpose and Scope

This document defines the mandatory, non-negotiable operational protocol that artificial intelligence agents (including Gemini, Antigravity, and AI Studio assistants) must follow before analyzing, proposing, or modifying any code or database structure in the IDEMO repository.

The goal of this protocol is to guarantee zero visual, structural, or architectural regression, enforce absolute adherence to the `IDEMO_PLATFORM_CONSTITUTION.md`, and prevent unapproved or out-of-scope modifications.

---

## Definitions

- **AI Agent**: Any automated LLM system, coding assistant, or background agent operating on the IDEMO codebase.
- **Constitution**: The governing architecture and platform standard located at `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`.
- **Governance Framework**: The collective suite of standards stored within `/docs/governance/`.
- **Pre-Execution Check**: Mandatory verification steps performed prior to emitting or editing code.

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

### Step 1: Constitutional Compliance & Gate 1 Verification

The AI Agent must perform read-only discovery (Gate 1) and evaluate the task against `IDEMO_PLATFORM_CONSTITUTION.md`.

- _Constraint_: If the request violates any constitutional principle, the AI Agent MUST refuse implementation.

### Step 2: Architecture Freeze & Scope Manifest (Gate 2 & Gate 3)

Before emitting or editing code, the AI Agent MUST explicitly state:

- Scope Manifest: `CREATE:`, `MODIFY:`, `PROTECT:`
- Frozen Contract Declarations (Schemas, Tables, RPCs, Routes, Contracts, UI Wording)

* _Freeze Constraint_: Once frozen, the AI Agent is strictly prohibited from redesigning, reinterpreting, simplifying, substituting, renaming, or introducing "minor improvements". Any conflict with baseline or runtime dependencies requires an immediate STOP. Silent workarounds are prohibited.

### Step 3: Risk & Regression Analysis

Evaluate RLS security, API contracts, typed contracts, and existing test suites.

### Step 4: Execution Procedure (Gate 3)

- Apply minimal surgical modifications strictly to files listed under `MODIFY:` or `CREATE:`.
- Maintain complete modularity and type safety.

### Step 5: Verification & Completion Procedure (Gate 4 & Gate 5)

- Run static analysis (`lint_applet` / `tsc`) and build verification (`compile_applet`).
- Provide evidence-based test results (command, expected, actual, PASS/FAIL).
- Include mandatory fields in completion report: `DISCREPANCIES FOUND:`, `SCOPE MANIFEST VERIFICATION:`, and `FUTURE BACKLOG ITEMS:`.
- Treat completion claims as claims until independently verified by test evidence. Do not fabricate governance versions.
- Keep deployment (Gate 5) strictly separated — do not execute unapproved SQL migrations, Edge Function deployments, storage bucket creation, or frontend publication.

---

## File Scope Rules

### Allowed File Modifications

- Files explicitly designated in the step specification.
- New additive migration scripts in `/supabase/migrations/` when database updates are required.
- New additive Edge Functions in `/supabase/functions/`.

### Prohibited Modifications

- Existing deployed database migrations (immutable historical record).
- `IDEMO_PLATFORM_CONSTITUTION.md` (immutable constitutional foundation).
- Service-role key exposures or client-side secret injections.

---

## Refusal Standard

If a user prompt requests an action that violates `IDEMO_PLATFORM_CONSTITUTION.md`, the AI Agent MUST respond with:

> **CONSTITUTIONAL REFUSAL**: The requested action violates Principle [X] of `IDEMO_PLATFORM_CONSTITUTION.md`. [Detailed explanation of conflict]. As an AI Agent bound by repository governance, I cannot proceed with this modification.

---

## Cross References

- `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
- `/docs/governance/ARCHITECTURE_CHECKLIST.md`
- `/docs/governance/SECURITY_MODEL.md`
