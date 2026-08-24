# Editorial Publishing Policy

## Purpose and Scope

This document establishes the editorial standards, publication workflows, and quality review gates governing all content within the IDEMO platform. In compliance with `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` Section 7 and 13, IDEMO protects its premium brand positioning through rigorous human editorial oversight, where **quality always overrides quantity**.

---

## Editorial Publishing Lifecycle

Every recommendation, collection, and localized translation MUST pass through the following strict state sequence before becoming visible in the public application:

```
[Draft] 
   │
   ▼
[Editorial Review] ──► [Fact & Image Verification] ──► [Translation Review]
                                                              │
                                                              ▼
[Published] ◄── [Editorial Approval] ◄── [Quality Scoring & Verification]
```

### State Definitions

1. **Draft**: Initial entry created manually or drafted by Gemini AI. Inaccessible to public clients.
2. **Editorial Review**: Under active review by human editorial staff for tone, voice, and alignment with the IDEMO Editorial Luxury Design Language.
3. **Fact & Image Verification**: Geographic location, operational details, pricing ranges, and high-resolution visual assets verified.
4. **Translation Review**: Multi-language accuracy confirmed for supported languages.
5. **Quality Scoring**: Quantitative assessment ensuring a minimum quality threshold (e.g. 85/100) before approval.
6. **Approved / Scheduled**: Fully cleared content queued for publication.
7. **Published**: Actively served to presentation clients via public Edge Functions.
8. **Paused / Archived**: Temporarily hidden or permanently withdrawn without deleting historical reference logs.

---

## Quality Gates & Standards

### 1. The "Quality Over Volume" Imperative
* IDEMO's luxury position relies on curated excellence. A small, pristine catalogue of verified experiences is strictly preferred over a dense, unverified listing.

### 2. Mandatory Verification Gates
* **Factual Accuracy**: Opening times, location coordinates, and access rules must be verified against official primary sources.
* **Visual Standards**: All attached images must be high-resolution, professionally licensed, and free of artificial watermarks or low-quality compression artifacts.
* **Tone & Language**: Descriptions must remain understated, literal, and elegant—strictly avoiding marketing hype, cliches, or self-praising adjectives.

### 3. Human Approval Requirement
* AI models (Gemini) MAY draft descriptions, suggest tags, or propose translations.
* AI models MUST NEVER directly transition a recommendation or translation to `published` status. Publication requires an explicit, authenticated human editor action.

---

## HUMAN-ONLY MEDIA CHANGE AUTHORITY (INVARIANT RULE)

* **Status**: CORE / PERMANENT PLATFORM INVARIANT
* **Runtime Verification**: HUMAN VERIFIED & SYSTEM ENFORCED

IDEMO recommendation imagery is a protected part of the visual identity and product quality.

### Non-Negotiable Rule
**NO recommendation image may EVER be modified without explicit human approval.**

"Modified" includes, without limitation:
- adding a new recommendation image
- replacing an existing image
- removing an image
- changing the primary image
- changing image ordering
- substituting a fallback image
- changing an image path/reference
- regenerating or replacing media during publication
- changing destination-package media references
- changing cached/offline media mappings
- automatically repairing an image mismatch by selecting another image
- AI-generated replacement imagery
- media migration that results in a different visitor-visible image

### Automation / AI Authority Limits
Automated systems, Gemini, agents, scripts, migrations, publication processes, validators, and fallback resolvers MAY:
- detect media inconsistencies
- identify broken references
- compare canonical vs rendered media
- flag stale media
- propose a replacement
- prepare a candidate change
- validate provenance/license/integrity
- report a required change

They MAY NOT:
- approve the change
- publish the change
- replace the image
- change the primary-media designation
- silently use a different visitor-visible image

without explicit human approval.

### Human Approval Requirement
Every visitor-visible media change must require an explicit human approval action in IDEMO Studio or another governed human-approval mechanism.

Approval must identify:
- recommendation ID
- current image
- proposed image
- reason for change
- approving human
- approval timestamp
- resulting canonical media reference

No implicit approval. No automatic approval. No "best effort" replacement. No fallback substitution when an approved canonical image exists.

### Fail-Safe Rule
If approved canonical media is unavailable, broken, missing, or inconsistent:
**DO NOT replace it automatically.**

Instead:
1. preserve the approved media reference,
2. surface a media integrity warning,
3. block any automated publication that would result in a different image,
4. require human review and explicit approval.

### Canonical Media Immutability
Once an image has been explicitly approved as the primary media for a recommendation, that approved mapping is immutable until another explicit human approval replaces it. Publication, package generation, cache refresh, migrations, sync operations, or application updates must never alter that approved mapping.

---

## RECOMMENDATION LIFECYCLE MANAGEMENT INVARIANT

* **Status**: CORE / NON-REGRESSION
* **Runtime Verification**: HUMAN VERIFIED

Every IDEMO recommendation MUST remain manageable throughout its lifecycle. An authorized Admin MUST always be able to:
- **CREATE**: New recommendations begin as draft/research candidates (`CANDIDATE` / `NEEDS RESEARCH`), never auto-promote, and require explicit Admin approval before publication.
- **MODIFY**: Admin can modify local drafts, source-backed drafts, Supabase-backed unpublished records, and approved/canonical recommendations. Editing preserves lifecycle state unless the Admin explicitly performs a lifecycle action.
- **DELETE / RETIRE**: Consistent `Delete Recommendation` capability across all items:
  - *Local-only drafts*: Purged from local storage and active Studio desk.
  - *Static/source-backed drafts*: Persists a `RETIRED` tombstone in `safeStorage`.
  - *Supabase unpublished records*: Executed via governed draft abandonment.
  - *Published/canonical records*: Uses governed non-destructive retirement (`submit_recommendation_retire_secure` + `approve_recommendation_work_item_secure`), setting `is_published = false`, excluding from active packages and Visitor runtime, while preserving canonical IDs, partner/history mappings, media provenance, and historical package references.
- **APPROVE**: Explicit authenticated human Admin action only.
- **PUBLISH**: Explicit governed action only.
- **RETIRE**: Explicit Admin action only.

### Invariant Maxims
1. *"Everything is draft until explicitly approved."*
2. *"No implicit lifecycle transitions."*

---

## Cross References

* `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 7, 13)
* `/docs/governance/AI_INTEGRATION_POLICY.md`
* `/docs/governance/DATA_MODEL_STANDARD.md`

