# Architecture Checklist

## Purpose and Scope

This document provides a comprehensive verification framework for all engineering, database, and feature implementations across the IDEMO repository. No task, feature, edge function, or migration is considered complete until every applicable item in this checklist is satisfied and verified.

---

## Definitions

* **Completion Gate**: A mandatory verification boundary that must be passed before code merge or deployment.
* **Constitutional Compliance**: Verification against `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`.

---

## Comprehensive Implementation Checklist

### 1. Architecture & Platform Isolation
- [ ] Is the application strictly configuration-driven, with zero hardcoded production content? (Constitution Section 1)
- [ ] Can content or partners be added/edited/archived without a mobile store release? (Constitution Section 2)
- [ ] Is the React/mobile application acting solely as a presentation layer? (Constitution Section 3)
- [ ] Is Supabase maintained as the sole authoritative source of truth? (Constitution Section 4)

### 2. Security & Secret Management
- [ ] Are service-role keys completely absent from frontend source code and VITE-prefixed environment variables? (Constitution Section 5, 10)
- [ ] Is Row Level Security (RLS) enabled and verified for all database tables?
- [ ] Are all Edge Functions enforcing JWT verification or custom worker secret verification?
- [ ] Are input parameters bounds-checked and sanitized before RPC execution?

### 3. API & Contract Boundary
- [ ] Are all database operations encapsulated behind typed Edge Functions or SECURITY DEFINER RPCs?
- [ ] Are all 14+ RPC parameters explicitly supplied with null normalization?
- [ ] Are API error responses normalized into structured JSON with HTTP status codes?
- [ ] Is backward compatibility preserved for mobile presentation clients?

### 4. AI & Gemini Boundary
- [ ] Are all Gemini API calls executing strictly on the server side? (Constitution Section 10)
- [ ] Is Gemini restricted to advisory roles (drafting, structuring, proposing)? (Constitution Section 11)
- [ ] Is Gemini strictly prohibited from publishing content, activating partners, or modifying routing state directly?
- [ ] Are all AI responses validated against strict JSON schemas before database ingestion? (Constitution Section 12)

### 5. Deterministic Routing & Business Logic
- [ ] Is partner qualification, ranking, offer creation, and locking handled deterministically in PostgreSQL? (Constitution Section 9)
- [ ] Are all offer transitions and state changes transactionally isolated and logged in `audit_logs`?
- [ ] Is advisory locking enforced on background workers and watchdogs to prevent race conditions?

### 6. Data Integrity & Quality Gates
- [ ] Does every production content item follow the draft -> editorial review -> published lifecycle? (Constitution Section 7)
- [ ] Are partner candidates verified through approved verification workflows? (Constitution Section 8)
- [ ] Are production mock behaviors completely absent from non-test code paths? (Constitution Section 6)

### 7. Performance & Resilience
- [ ] Are database queries bounded with explicit limits and indexed search paths?
- [ ] Are long-running queries executing asynchronously or via queued background jobs?
- [ ] Does the presentation client handle offline states and network degradation gracefully?

### 8. Testing & Documentation
- [ ] Are pgTAP unit and integration tests passing cleanly for modified backend functions?
- [ ] Is `npx supabase db lint` returning zero errors?
- [ ] Has the corresponding documentation in `/docs/governance/` been updated?

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md`
* `/docs/governance/AI_IMPLEMENTATION_PROTOCOL.md`
* `/docs/governance/API_CONTRACT_SPECIFICATION.md`
