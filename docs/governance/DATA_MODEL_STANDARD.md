# Data Model Standard

## Purpose and Scope

This document defines the authoritative data schema standards, entity lifecycles, relationships, and data governance policies across the IDEMO database platform. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Section 4, Supabase PostgreSQL is the sole authoritative source of truth for all system entities.

---

## Core Entities & Data Dictionary

### 1. Recommendation (`public.recommendations`)

- **Purpose**: Represents curated travel experiences, venues, or editorial highlights.
- **Ownership**: System / Editorial Team.
- **Lifecycle**: `draft` → `editorial_review` → `approved` → `scheduled` → `published` → `paused` → `archived`.
- **Key Fields**: `id`, `slug`, `title`, `description`, `category_id`, `publication_status`, `created_at`.
- **Publication Rule**: Must satisfy all editorial quality gates before transitioning to `published`.

### 2. Partner (`public.partners`)

- **Purpose**: Represents verified service providers, guides, or local venues fulfilling visitor inquiries.
- **Ownership**: Operations / Partner Network.
- **Lifecycle**: `candidate` → `verification` → `approved` → `active` → `suspended` → `archived`.
- **Key Fields**: `id`, `business_name`, `status`, `service_area_id`, `created_at`.
- **Access Rule**: Managed strictly via backend RPCs; credentials and PINs are never exposed to the client.

### 3. Inquiry (`public.inquiries`)

- **Purpose**: Visitor requests created for specific recommendations or service areas.
- **Ownership**: Visitor / Operations.
- **Lifecycle**: `draft` → `matching` → `offered` → `responded` → `resolved` → `cancelled` → `needs_assistance`.
- **Key Fields**: `id`, `public_reference_code`, `recommendation_id`, `status`, `visitor_name`, `email`, `phone_number`.

### 4. Offer / Partner Response (`public.inquiry_matches`, `public.partner_responses`)

- **Purpose**: Represents candidate matches and binding responses submitted by eligible partners.
- **Lifecycle**: `offered` → `viewed` → `accepted` → `declined` → `expired`.
- **Locking Rule**: First valid partner acceptance locks the match transactionally.

### 5. Visitor (`public.visitors` / `auth.users`)

- **Purpose**: Identifies anonymous or registered travel visitors.
- **Privacy Standard**: PII is restricted and accessible only through authorized visitor token validation RPCs.

### 6. Translation (`public.recommendation_translations`)

- **Purpose**: Multi-language localized content for recommendations and collections.
- **Key Fields**: `recommendation_id`, `language_code`, `title`, `description`.

### 7. Collection & Category (`public.collections`, `public.categories`)

- **Purpose**: Groupings and taxonomies structuring the Mood Orbit and discovery screens.

### 8. Notification (`public.notification_outbox`)

- **Purpose**: System-wide transactional email and SMS dispatch queue.
- **Lifecycle**: `queued` → `processing` → `sent` → `failed` → `permanently_failed`.

### 9. Configuration & Feature Flags (`public.system_settings`, `public.feature_flags`)

- **Purpose**: Dynamic settings controlling watchdog intervals, thresholds, and application features.

---

## Data Governance & Integrity Rules

1. **Foreign Key Integrity**: All foreign keys must enforce appropriate `ON DELETE RESTRICT` or `ON DELETE CASCADE` constraints.
2. **Audit Logging**: Every state transition in `inquiries`, `inquiry_matches`, and `notification_outbox` MUST write a corresponding record to `public.audit_logs`.
3. **No Soft Data Deletion**: Soft deletion (`status = 'archived'`) is preferred over destructive physical record removal.
4. **Single Source of Truth (Principle 36)**: Every business object managed by IDEMO has exactly one authoritative record stored in Supabase. Dependent systems (mobile apps, destination packages, search indexes, analytics, APIs, offline cache, partner portals, translation workspaces) consume authoritative data via generated snapshots or cached views and are never directly authoritative.

---

## Cross References

- `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 4, 7, 8)
- `/docs/governance/EDITORIAL_PUBLISHING_POLICY.md`
- `/docs/governance/API_CONTRACT_SPECIFICATION.md`
