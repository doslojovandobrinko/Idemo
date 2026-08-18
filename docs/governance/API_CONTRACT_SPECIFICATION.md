# API Contract Specification

## Purpose and Scope

This document defines the permanent API boundary between the React presentation layer, Supabase Edge Functions, and Supabase PostgreSQL RPCs. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Section 5, the frontend must communicate with the platform exclusively through stable, typed contracts, preventing direct dependency on internal schema implementation details.

---

## Definitions

* **API Boundary**: The isolated interface layer exposing public and authenticated operations.
* **RPC (Remote Procedure Call)**: PostgreSQL SECURITY DEFINER functions exposed via PostgREST.
* **Edge Function**: Deno-based serverless handlers managing complex orchestrations, external API calls, and pre-RPC validations.

---

## Architecture of the API Layer

```
React / Mobile Presentation Layer
          │
          ▼  (HTTPS / JWT / Public API)
Supabase Edge Functions
          │
          ▼  (Service Role Key / Strict Pre-RPC Validation)
Supabase PostgreSQL RPCs & RLS Tables
```

---

## Standard Contract Policies

### 1. Request Normalization & Pre-RPC Validation
* All incoming Edge Function requests MUST parse JSON payloads safely.
* Missing or empty required fields MUST trigger an immediate HTTP 400 Bad Request before initiating database transactions.
* All parameters passed to PostgreSQL RPCs MUST be explicitly named and typed. JavaScript `undefined` MUST be normalized to `null`.

### 2. Standard Response Structure

#### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

#### Error Response Format
```json
{
  "success": false,
  "error": "Missing or invalid required inquiry fields",
  "code": "INVALID_INPUT"
}
```

---

## Major Endpoint Contracts

### 1. `POST /functions/v1/create_public_inquiry`
* **Access**: Public / Anonymous (with optional Bearer JWT for authenticated visitors)
* **Purpose**: Creates an atomic visitor inquiry with consent tracking.
* **Parameters**:
  - `recommendation_id` (UUID, Required)
  - `visitor_notes` (String, Required)
  - `preferred_language_id` (UUID, Required)
  - `service_area_id` (UUID, Required)
  - `requested_start_at` (TIMESTAMPTZ, Required)
  - `requested_end_at` (TIMESTAMPTZ, Required)
  - `visitor_name` (String, Required)
  - `email` (String, Optional*) *At least one of email/phone required
  - `phone_number` (String, Optional*)
  - `consent_text_version` (String, Required)
  - `consent_purpose` (String, Required)
  - `consent_channel` (String, Required)
  - `required_capability_ids` (UUID[], Optional)
* **Pre-RPC Rule**: Validates non-empty strings and format prior to database invocation. Returns HTTP 400 on invalid payload.

### 2. `POST /functions/v1/cron_scheduler`
* **Access**: Restricted / Scheduled Worker (`x-idemo-worker-secret`)
* **Purpose**: Orchestrates operational watchdogs, notification worker triggers, and offer expiry processing.

---

## Versioning & Backward Compatibility

1. **Additive Schema Updates**: API additions must be non-breaking and additive.
2. **Deprecation Window**: Any schema change affecting existing fields requires a minimum 90-day deprecation notice and concurrent version support in Edge Functions.
3. **No Direct Table Ingestion**: The presentation layer must never perform direct `INSERT` or `UPDATE` queries on core operational tables (`inquiries`, `notification_outbox`, `audit_logs`).

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 5)
* `/docs/governance/SECURITY_MODEL.md`
* `/docs/governance/DATA_MODEL_STANDARD.md`
