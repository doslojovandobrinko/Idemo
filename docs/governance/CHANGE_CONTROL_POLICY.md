# Change Control Policy

## Purpose and Scope

This document establishes the formal classification system, impact analysis protocol, and deployment requirements for all operational, database, code, and content changes across the IDEMO ecosystem. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Section 2, the system maximizes **store-release independence** by decoupling backend configuration changes from mobile application releases.

---

## Change Classification Matrix

| Change Category | Description | Mobile Store Release? | Backend Deployment? | Docs Update? | Regression Test? | Arch. Review? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Recommendation Content** | Adding/editing/pausing recommendations, translations, or images | ❌ No | ❌ DB Ops Only | ❌ No | ❌ DB Lint | ❌ No |
| **2. Partner Profile** | Adding, verifying, or suspending partner network accounts | ❌ No | ❌ DB Ops Only | ❌ No | ❌ DB Lint | ❌ No |
| **3. System Configuration** | Modifying settings, watchdog intervals, or feature flags | ❌ No | ❌ DB Ops Only | ❌ No | ❌ DB Lint | ❌ No |
| **4. Database Migration** | Adding tables, functions, indexes, or RLS policies | ❌ No | ✅ Supabase Migration | ✅ Schema / Standard | ✅ pgTAP & DB Lint | ✅ Required |
| **5. Edge Function Update** | Updating business logic, worker auth, or API validation | ❌ No | ✅ Edge Function Deploy | ✅ API Contract | ✅ Integration Test | ✅ Required |
| **6. Frontend UI / Layout** | Modifying React components, CSS, or Mood Orbit presentation | ✅ App Store / Google Play | ❌ No | ✅ Design System | ✅ Frontend Lint & Build | ✅ Required |
| **7. API Contract Change** | Modifying request/response structures or Edge Function signatures | ✅ Mobile Release | ✅ Edge Function Deploy | ✅ API Contract | ✅ Full Suite | ✅ Required |
| **8. Security / RLS Policy** | Updating authentication, encryption, or access policies | ❌ No | ✅ Supabase Migration | ✅ Security Model | ✅ Full Security Audit | ✅ Required |

---

## Store-Release Independence Rules

1. **Content and Operations**: Adding Recommendation #301 or Partner #101 must be accomplished exclusively via database operations. Hardcoding content into React components is strictly prohibited.
2. **Mobile Release Triggers**: A mobile store build (Apple App Store / Google Play) is triggered ONLY when introducing new screen capabilities, altering user interaction paradigms, updating native SDK dependencies, or modifying API contract interfaces.

---

## Change Execution Protocol

Every major backend or database modification MUST follow this sequence:
1. Impact Analysis & Constitutional Compliance Check.
2. Additive Migration Creation (`/supabase/migrations/`).
3. Local pgTAP & Database Lint Verification (`npx supabase db lint`).
4. Controlled Staging Deployment & Execution.
5. Verification & Audit Logging.

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 2)
* `/docs/governance/API_CONTRACT_SPECIFICATION.md`
* `/docs/governance/ARCHITECTURE_CHECKLIST.md`
