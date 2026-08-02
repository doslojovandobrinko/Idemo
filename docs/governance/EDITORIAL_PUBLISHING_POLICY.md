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

- IDEMO's luxury position relies on curated excellence. A small, pristine catalogue of verified experiences is strictly preferred over a dense, unverified listing.

### 2. Mandatory Verification Gates

- **Factual Accuracy**: Opening times, location coordinates, and access rules must be verified against official primary sources.
- **Visual Standards**: All attached images must be high-resolution, professionally licensed, and free of artificial watermarks or low-quality compression artifacts.
- **Tone & Language**: Descriptions must remain understated, literal, and elegant—strictly avoiding marketing hype, cliches, or self-praising adjectives.

### 3. Human Approval Requirement

- AI models (Gemini) MAY draft descriptions, suggest tags, or propose translations.
- AI models MUST NEVER directly transition a recommendation or translation to `published` status. Publication requires an explicit, authenticated human editor action.

---

## Cross References

- `/docs/governance/IDEMO_PLATFORM_CONSTITUTION.md` (Section 7, 13)
- `/docs/governance/AI_INTEGRATION_POLICY.md`
- `/docs/governance/DATA_MODEL_STANDARD.md`
