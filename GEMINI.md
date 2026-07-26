# IDEMO Gemini Repository Instructions

## Mandatory Status

This file is the mandatory entry point for every Gemini-assisted IDEMO task.

Before analysing, proposing, generating, modifying, deleting, moving or renaming any repository file, Gemini must read and comply with the approved IDEMO Governance Framework.

These instructions apply to documentation, frontend, backend, database, Supabase, Edge Functions, security, editorial systems, AI integrations, tests, build configuration and deployment work.

No task is exempt because it appears small, urgent, temporary or obvious.

---

## 1. Mandatory Reading Order

Before performing any repository work, read the following documents completely and in this exact order:

1. `/docs/governance/GOVERNANCE_VERSION.md`
2. `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
3. `/docs/governance/PROJECT_PRINCIPLES.md`
4. `/docs/governance/AI_IMPLEMENTATION_PROTOCOL.md`
5. `/docs/governance/API_CONTRACT_SPECIFICATION.md`
6. `/docs/governance/SECURITY_MODEL.md`
7. `/docs/governance/ARCHITECTURE_CHECKLIST.md`
8. `/docs/governance/DATA_MODEL_STANDARD.md`
9. `/docs/governance/EDITORIAL_PUBLISHING_POLICY.md`
10. `/docs/governance/AI_INTEGRATION_POLICY.md`
11. `/docs/governance/CHANGE_CONTROL_POLICY.md`

The current approved governance version must be confirmed before implementation begins.

If any required governance document is missing, unreadable or internally inconsistent, stop and report the issue.

Do not continue by guessing.

---

## 2. Governance Authority

The governance documents are binding repository-level requirements.

They must not be:

- bypassed;
- silently modified;
- weakened;
- summarised as a substitute for reading them;
- reinterpreted for implementation convenience;
- overridden by generated code;
- treated as optional guidance.

If a requested task conflicts with governance, the conflict must be reported before implementation.

Ordinary implementation work must not modify governance documents.

Governance changes require the process defined in:

`/docs/governance/GOVERNANCE_VERSION.md`

---

## 3. Mandatory Pre-Implementation Report

Before modifying any file, Gemini must produce an Architecture Compliance Report using the following structure:

# ARCHITECTURE COMPLIANCE REPORT

## Task

Describe the requested task precisely.

## Governance Version

State the current approved governance version and status.

## Files Proposed for Modification

List every file expected to be created, modified, moved, renamed or deleted.

Do not use vague wording such as “related files.”

## Files Explicitly Protected

List important files, directories and systems that must not be modified during the task.

## Relevant Governance Sections

Identify the governance documents and sections that directly apply.

## Current-State Evidence

State what repository evidence has been inspected and what is confirmed.

Separate verified facts from assumptions.

## Architecture Impact

State whether the task affects:

- frontend architecture;
- backend architecture;
- API contracts;
- database schema;
- content model;
- partner model;
- inquiry routing;
- editorial publishing;
- mobile release independence.

## Security Impact

State whether the task affects:

- authentication;
- authorisation;
- Row Level Security;
- secrets;
- service-role access;
- rate limiting;
- audit logging;
- personal data;
- public endpoints.

## Data-Model Impact

State whether entities, fields, relationships, lifecycle states or source-of-truth rules are affected.

## AI Impact

State whether Gemini or another AI system is used at runtime.

If yes, confirm that AI remains advisory, server-side, schema-validated and subject to human or deterministic controls.

## Store-Release Impact

Classify whether the task requires:

- no mobile release;
- backend deployment only;
- Google Play release;
- Apple App Store release;
- both store releases;
- further review before classification.

## Risks

List concrete implementation, regression, security, data-integrity and scalability risks.

## Required Tests

List the exact validation steps required before the task can be considered complete.

## Compliance Verdict

Use exactly one of the following verdicts:

- `SAFE TO IMPLEMENT`
- `REQUIRES ARCHITECTURAL DECISION`
- `NOT SAFE TO IMPLEMENT`

Do not implement unless the verdict is `SAFE TO IMPLEMENT`.

---

## 4. Rules for Unsafe or Ambiguous Tasks

Use `REQUIRES ARCHITECTURAL DECISION` when:

- the request materially changes an approved API contract;
- the request changes source-of-truth ownership;
- the request changes deterministic routing authority;
- the request introduces a new production entity or lifecycle;
- the request may require governance modification;
- the request has unresolved security implications;
- the task scope is materially ambiguous.

Use `NOT SAFE TO IMPLEMENT` when:

- the task directly violates the Constitution;
- secrets would be exposed to the frontend;
- production workflow success would be simulated locally;
- production data would be hard-coded into React;
- Gemini would govern routing or publication;
- Row Level Security would be bypassed;
- service-role access would be exposed;
- unreviewed AI content would be published automatically;
- a protected governance control would be weakened.

When either verdict is used, stop before implementation and provide the reason.

Do not silently create a workaround.

---

## 5. Implementation Constraints

When the verdict is `SAFE TO IMPLEMENT`, Gemini must:

1. Modify only the files listed in the compliance report.
2. Keep the scope limited to the requested task.
3. Preserve existing validated behaviour unless change is explicitly required.
4. Use Supabase as the source of truth for production data and operations.
5. Keep business logic out of React where it belongs on the server.
6. Preserve deterministic routing authority.
7. Preserve Row Level Security and privilege boundaries.
8. Keep Gemini API calls server-side.
9. Treat AI output as untrusted until schema-validated.
10. Preserve human editorial approval for public content.
11. Avoid production mocks, fabricated success states and local-only workflow transitions.
12. Maintain backward compatibility unless an approved change explicitly replaces it.
13. Design for hundreds or thousands of recommendations and hundreds of partners.
14. Preserve IDEMO’s premium positioning by scaling catalogue depth without increasing interface clutter.
15. Avoid unrelated cleanup, refactoring or dependency changes.

---

## 6. Evidence and Assumptions

Gemini must distinguish between:

- repository evidence;
- test evidence;
- database evidence;
- configuration evidence;
- inferred assumptions;
- unresolved unknowns.

Never report an assumption as a verified fact.

Never claim that a test passed unless it was actually executed and its result inspected.

Never claim that a file was unchanged without verifying the modification scope.

---

## 7. Mandatory Verification

After implementation, Gemini must perform all applicable checks defined by:

`/docs/governance/ARCHITECTURE_CHECKLIST.md`

At minimum, verify where applicable:

- TypeScript;
- lint;
- production build;
- automated tests;
- database tests;
- Edge Function tests;
- API contract compatibility;
- Row Level Security;
- secret isolation;
- absence of production mocks;
- absence of hard-coded production recommendations;
- absence of hard-coded production partners;
- migration integrity;
- frontend error handling;
- offline or degraded-network behaviour;
- regression risk.

A task is not complete merely because code was generated.

---

## 8. Mandatory Completion Report

Every completed implementation must end with:

# IMPLEMENTATION COMPLETION REPORT

## Governance Version

State the approved governance version used.

## Compliance Verdict

Repeat the pre-implementation verdict.

## Files Changed

List every created, modified, moved, renamed or deleted file.

## Changes Made

Describe the actual changes without exaggeration.

## Changes Not Made

Confirm the protected scope that remained untouched.

## Tests Executed

List every executed command or manual validation and its actual result.

## Tests Not Executed

List any required test that could not be executed and explain why.

## Security Verification

Confirm the relevant security boundaries.

## Architecture Verification

Confirm source-of-truth ownership, API boundaries and deterministic authority.

## Regression Assessment

State known remaining risks.

## Final Result

Use exactly one of:

- `IMPLEMENTATION PASSED`
- `IMPLEMENTATION PASSED WITH LIMITATIONS`
- `IMPLEMENTATION FAILED`
- `IMPLEMENTATION BLOCKED`

Do not use `IMPLEMENTATION PASSED` when required tests remain incomplete.

---

## 9. Permanent IDEMO Principles

Every task must preserve the following:

1. Premium over volume.
2. Configuration over code.
3. Backend over frontend for authoritative business logic.
4. Deterministic rules over AI authority.
5. Editorial quality over automatic publication.
6. Stable application, evolving platform.
7. Security before convenience.
8. One authoritative source of truth.
9. Evidence over assumptions.
10. Design for long-term scale.

---

## 10. Prohibited Shortcuts

Gemini must not:

- skip governance review because the task is small;
- hard-code production recommendation data into frontend files;
- hard-code production partner data into frontend files;
- use local storage as the authoritative inquiry system;
- simulate backend success;
- expose Gemini keys;
- expose Supabase service-role keys;
- bypass Row Level Security;
- let Gemini select or activate an unverified partner;
- let Gemini publish content automatically;
- alter governance documents as part of normal implementation;
- claim verification without evidence;
- broaden the task without approval.

---

## 11. Start Condition

No repository implementation may begin until:

1. the governance documents have been read;
2. the governance version has been confirmed;
3. the Architecture Compliance Report has been produced;
4. the verdict is `SAFE TO IMPLEMENT`;
5. the proposed modification scope is explicit.

This boot sequence is mandatory for every future Gemini-assisted IDEMO repository task.
