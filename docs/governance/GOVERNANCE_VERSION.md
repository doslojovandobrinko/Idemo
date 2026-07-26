# IDEMO Governance Framework Version

## Current Version

**Version:** 1.0  
**Status:** APPROVED  
**Effective Date:** 23 July 2026  
**Approved By:** Project Owner  
**Applies To:** All IDEMO application, backend, operations, editorial and AI-assisted development work  
**Supersedes:** None

## Authoritative Governance Documents

The following documents form the approved IDEMO Governance Framework:

1. `IDEMO_PLATFORM_CONSTITUTION.md`
2. `PROJECT_PRINCIPLES.md`
3. `AI_IMPLEMENTATION_PROTOCOL.md`
4. `ARCHITECTURE_CHECKLIST.md`
5. `API_CONTRACT_SPECIFICATION.md`
6. `DATA_MODEL_STANDARD.md`
7. `EDITORIAL_PUBLISHING_POLICY.md`
8. `AI_INTEGRATION_POLICY.md`
9. `SECURITY_MODEL.md`
10. `CHANGE_CONTROL_POLICY.md`

All future implementation work must comply with the current approved version of this framework.

## Modification Policy

Governance documents must not be modified as part of ordinary implementation work.

Any proposed governance change requires:

1. A documented reason for the change.
2. Identification of all affected governance documents.
3. An architecture and security impact review.
4. Explicit approval from the Project Owner.
5. A governance version increment.
6. A dated change-log entry.
7. Verification that the revised documents remain internally consistent.
8. Confirmation that no existing security, editorial or architectural control has been weakened unintentionally.

Silent changes, incidental rewrites and implementation-driven exceptions are prohibited.

## Versioning Rules

Use semantic versioning for the governance framework:

- **Patch version:** clarification that does not change meaning or obligations.
- **Minor version:** new rule or expanded requirement that remains backward compatible.
- **Major version:** material change to architecture, authority, security boundaries or governance obligations.

## Precedence

If governance documents appear inconsistent, use the following precedence order:

1. `IDEMO_PLATFORM_CONSTITUTION.md`
2. `PROJECT_PRINCIPLES.md`
3. `SECURITY_MODEL.md`
4. `API_CONTRACT_SPECIFICATION.md`
5. `AI_INTEGRATION_POLICY.md`
6. `DATA_MODEL_STANDARD.md`
7. `EDITORIAL_PUBLISHING_POLICY.md`
8. `CHANGE_CONTROL_POLICY.md`
9. `AI_IMPLEMENTATION_PROTOCOL.md`
10. `ARCHITECTURE_CHECKLIST.md`

A perceived contradiction must be reported for review. It must not be resolved silently.

## Current Change Log

### Version 1.0 — 23 July 2026

- Established the initial approved IDEMO Governance Framework.
- Consolidated all governance documents under `/docs/governance/`.
- Formalised governance authority, versioning, precedence and change control.
