# Security Model

## Purpose and Scope

This document defines the end-to-end security architecture, credential governance, access control policies, and data protection standards for the IDEMO platform. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Sections 5 and 10, security policies are strictly enforced at the API and database levels.

---

## Core Security Architecture

```
[ Public Client ]
       │
       ▼  (JWT / Public Token / Anon Role)
[ Supabase PostgREST & Edge Functions ] ──► (RLS Policies & Grants)
       │
       ▼  (Service Role Key - Restricted to Edge Functions & Backend RPCs)
[ PostgreSQL Database (SECURITY DEFINER RPCs) ]
```

---

## Access Control & Authentication

### 1. Row Level Security (RLS)
* Every table in the `public` schema MUST have RLS explicitly enabled.
* Public table reads are restricted strictly to published content (`public.recommendations`, `public.collections`).
* Operational tables (`public.inquiries`, `public.notification_outbox`, `public.audit_logs`) MUST deny direct SELECT/INSERT/UPDATE from `anon` and `authenticated` roles.
* Interactions with operational tables MUST occur through audited `SECURITY DEFINER` RPCs or `service_role` Edge Functions.

### 2. Privilege Escalation Defense
* Function permissions MUST be explicitly defined using `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated;` and `GRANT EXECUTE ... TO service_role;`.
* All PL/pgSQL functions MUST explicitly set an empty search path: `SET search_path = '';` to prevent search path hijacking attacks.

---

## Secret Governance

### 1. Strict Exclusion of Secrets from Frontend
* Service-role keys, worker authorization secrets (`NOTIFICATION_WORKER_SECRET`), and Gemini API keys MUST NEVER be committed to Git, stored in React source files, or exposed via `VITE_` prefixed environment variables.
* Client bundles are audited to guarantee zero secret leakage.

### 2. Secret Management in Server Environments
* Secrets are injected into Supabase Edge Functions exclusively via encrypted Deno environment variables (`Deno.env.get(...)`).
* Edge Functions MUST validate secret existence on boot and fail securely if unconfigured.

---

## Audit Logging & Immutability

1. **Transactional Audit Ledger**: Material events (inquiry creation, match transition, watchdog runs, notification failures) write an immutable entry to `public.audit_logs`.
2. **PII Protection**: Visitor phone numbers and emails are masked in public logs and accessible only via validated visitor token RPCs.

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 5, 10)
* `/docs/governance/API_CONTRACT_SPECIFICATION.md`
* `/docs/governance/AI_INTEGRATION_POLICY.md`
