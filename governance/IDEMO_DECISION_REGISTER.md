# IDEMO DECISION REGISTER
**The Permanent Historical Record of Significant Decisions Affecting the IDEMO Ecosystem**

---

## 1. Purpose
The **IDEMO Decision Register** provides a permanent, auditable historical record of all significant architectural, design, product, and governance decisions within the IDEMO ecosystem. 

By detailing context, alternatives considered, and final rationale with explicit approval tracking, this register preserves institutional memory, ensures absolute governance accountability, and eliminates repetitive discussions of previously resolved matters.

---

## 2. Decision Log

### IDEMO-DEC-001: Establishment of the IDEMO Governance Library
* **Date:** July 02, 2026
* **Creator Approval:** YES (Approved via explicit governance directives)
* **Context:** The IDEMO ecosystem requires a structured, consistent, and professionally governed documentation framework to prevent "architectural drift" and coordinate visual regression as multiple contributors/AI models scale the app.
* **Alternatives Considered:** 
  1. Rely on inline code documentation and reactive chat prompt guidance (Rejected: Leads to duplication, drift, and loss of Creator's core vision).
  2. Maintain a single monolithic README (Rejected: Overwhelms contributors, difficult to split concerns between technical manifests and brand voices).
* **Final Decision:** Establish a modular 7-tier Documentation Hierarchy in `/governance/` indexed by `/README_GOVERNANCE.md`.
* **Reasoning:** Clearly separates governance levels from brand voices, operational checklists, and dynamic reference datasets.
* **Governing Documents Affected:** All (Ecosystem wide)
* **Implementation Status:** COMPLETED
* **Future Review Requirements:** N/A

---

### IDEMO-DEC-002: Transition to Proprietary Editorial Luxury Design Language
* **Date:** July 02, 2026
* **Creator Approval:** YES (Approved via governance amendments)
* **Context:** The application previously made references to external design movements (such as Swiss Modernism), which could lead to design decisions based on external trends rather than IDEMO's custom-built criteria.
* **Alternatives Considered:**
  1. Continue referencing "Swiss Modernism" as the stylistic baseline (Rejected: External definitions can evolve or conflict with IDEMO's tailored luxury and event requirements).
* **Final Decision:** Adopt and define **IDEMO Editorial Luxury Design Language** as IDEMO's proprietary visual standard.
* **Reasoning:** Keeps our visual identity completely self-contained and highly specialized, defined by calm, editorial, timeless, under-stated, tactile, elegant, and highly readable characteristics.
* **Governing Documents Affected:** 
  * `IDEMO_Design_Constitution.md` (Governing Design Standard)
  * `IDEMO_Brand_Guide.md` (Governing Brand Standard)
* **Implementation Status:** COMPLETED
* **Future Review Requirements:** N/A

---

### IDEMO-DEC-003: Formalization of Stable vs. Flexible Component Framework
* **Date:** July 02, 2026
* **Creator Approval:** YES (Approved via governance amendments)
* **Context:** Need to clearly demarcate which portions of the codebase are locked and require explicit Creator approval versus which parts can be continuously iterated on to optimize performance and data curation under delegated authority.
* **Alternatives Considered:**
  1. Lock the entire codebase (Rejected: Inhibits critical operational updates, translation refinements, and curation expansion).
  2. Treat all code as mutable (Rejected: High risk of losing core privacy architecture or unique design philosophies).
* **Final Decision:** Implement a formal division between Stable Components (Constitution, Privacy, Offline state) and Flexible Components (Curation, Localizations, QA steps).
* **Reasoning:** Safely separates IDEMO's core DNA from its high-tempo operational extensions.
* **Governing Documents Affected:**
  * `IDEMO_Constitution.md` (Highest Governing Document)
  * `README_GOVERNANCE.md` (Governance Index)
* **Implementation Status:** COMPLETED
* **Future Review Requirements:** Periodic audit during major country onboarding events.

---

### IDEMO-DEC-004: Standardizing Content Quality with the Editorial Authenticity Standard
* **Date:** July 02, 2026
* **Creator Approval:** YES (Approved via governance amendments)
* **Context:** The project needs a highly professional nomenclature to replace informal terms like "No AI Slop" while protecting high-integrity travel curations.
* **Alternatives Considered:**
  1. Keep the informal "No AI Slop" language (Rejected: Unsuitable for enterprise-grade, high-end product environments).
* **Final Decision:** Codify the **Human Editorial Quality Standard** (also known as the **Editorial Authenticity Standard**).
* **Reasoning:** Establishes a professional benchmark demanding that all descriptions and photos satisfy premium, vetted editorial criteria regardless of their generation tool.
* **Governing Documents Affected:**
  * `IDEMO_Product_Manifest.md` (Governing Product Standard)
  * `IDEMO_Brand_Guide.md` (Governing Brand Standard)
* **Implementation Status:** COMPLETED
* **Future Review Requirements:** N/A

---

### IDEMO-DEC-005: Retrospective Governance Closure of Contextual Intelligence Panel Refinements
* **Date:** July 05, 2026
* **Creator Approval:** YES (Approved via explicit governance directives)
* **Context:** The Ranking Transparency and Contextual Intelligence Panel refinements were successfully implemented and compiled, but missing a formal corresponding design and compliance record in the IDEMO Governance Library.
* **Alternatives Considered:**
  1. Rely on existing code-level structure and notes without formal records (Rejected: Creates architectural and compliance drift).
  2. Conduct and record an honest retrospective review to restore complete framework traceability (Selected).
* **Final Decision:** Perform a comprehensive retrospective design impact and empirical validation audit (logged under `/governance/RETROSPECTIVE_GOVERNANCE_CLOSURE_001.md`).
* **Reasoning:** Restores single-source-of-truth integrity and verifies WCAG daylight contrast, touch targets, and localization layouts across all six languages.
* **Governing Documents Affected:**
  * `IDEMO_Design_Constitution.md` (Design Principles 20 and 25, Section 7)
  * `IDEMO_DECISION_REGISTER.md` (Decision tracking)
* **Implementation Status:** COMPLETED & SIGNED OFF
* **Future Review Requirements:** Regular checks on localizations during feature expansions.

---

### IDEMO-DEC-006: Phase 4 Final Hardening and Governance Lock
* **Date:** July 13, 2026
* **Creator Approval:** YES (Approved via explicit hardening directives)
* **Context:** Formalizing the completion of Phase 4 (Visitor Resolution & Durable Throttling) and freezing the baseline to protect security, privacy, and architecture before proceeding to Phase 5.
* **Alternatives Considered:**
  1. Complete hardening without freezing the architecture (Rejected: Raises regression risks and increases architectural drift during major phase handoffs).
  2. Implement partial local freeze (Rejected: Leads to fragmented boundaries and incomplete verification tracking).
* **Final Decision:** Implement enterprise security, privacy, and deadlock-safety hardening, document the canonical IP normalization pipeline, and formally lock the Phase 4 baseline (logged under `/governance/RETROSPECTIVE_GOVERNANCE_CLOSURE_002.md`).
* **Reasoning:** Establishes a highly secure, deadlock-safe, zero-trust edge gateway with calm editorial error messages and a permanent governance lock.
* **Governing Documents Affected:**
  * `README_GOVERNANCE.md` (Ecosystem-wide indices)
  * `IDEMO_DECISION_REGISTER.md` (Decision tracking)
  * `IDEMO_Architecture_Manifest.md` (Technical standards)
* **Implementation Status:** COMPLETED & GOVERNANCE-LOCKED
* **Future Review Requirements:** Review proxy trust mappings if the deployment platform changes.

---

### IDEMO-DEC-007: Phase 5 Operations and Automation Implementation
* **Date:** July 13, 2026
* **Creator Approval:** YES (Approved via Phase 5 Operations implementation directive)
* **Context:** Implementing the complete production operations layer supporting the frozen routing engine, including automatic queue advancement, offer expiration, the operational watchdog, an outbox pattern for notifications, system maintenance, and aggregate metrics.
* **Alternatives Considered:**
  1. Introduce new routing behaviors or reordering mechanisms during automation (Rejected: Violates the frozen baseline constraint and business logic boundaries).
  2. Implement manual/ad-hoc scripts rather than integrated triggers and Deno Edge Function workers (Rejected: Fails the automatic operational automation goal and raises reliability/drift risks).
* **Final Decision:** Build a robust, non-intrusive operations and automation layer. Use database triggers to automate queue advancement on decline/expiry and outbox enqueuing, and Deno Edge Functions to run scheduled cron maintenance, watchdogs, and outbox workers.
* **Reasoning:** Reduces manual operational workload while maintaining a completely frozen, immutable client-facing UX and business routing logic.
* **Governing Documents Affected:**
  * `README_GOVERNANCE.md` (Ecosystem indices)
  * `IDEMO_DECISION_REGISTER.md` (Decision tracking)
* **Implementation Status:** COMPLETED & SIGNED OFF
* **Future Review Requirements:** Monitor retry exhaustion and adjust retry intervals if third-party delivery channels exhibit persistent instability.

---

### IDEMO-DEC-008: Phase 5 Final Reliability and Concurrency Enhancements
* **Date:** July 13, 2026
* **Creator Approval:** YES (Approved via Phase 5 Final Reliability directive)
* **Context:** Resolving concurrency and race condition risks in Phase 5 operations by introducing atomic claiming for notifications and singleton execution constraints for the operational watchdog.
* **Alternatives Considered:**
  1. Continue using client-side select-and-lock queries (Rejected: Exposed to race conditions under high concurrency where multiple workers claim the same notification batch).
  2. Implement application-level locking (Rejected: Adds severe statefulness, latency, and reliability risks to stateless Edge Functions).
* **Final Decision:** 
  1. Implement an atomic, database-level dequeue function (`public.dequeue_notifications`) using `FOR UPDATE SKIP LOCKED` to guarantee exactly-one database claim per notification per processing cycle.
  2. Add transaction-scoped advisory locking (`pg_try_advisory_xact_lock`) at the entry of the operational watchdog to enforce singleton execution and eliminate overlapping execution pressure.
  3. Correct the notification backoff documentation to accurately represent the 5-minute linear step progression (`nextRetryCount * 5` minutes).
  4. Ensure complete preservation of all Phase 1–5 frozen routing logic, candidate queueing, and UI.
* **Reasoning:** Leverages standard PostgreSQL transactional guarantees to provide lightweight, bulletproof concurrency protection without adding third-party lock managers or altering frozen business code.
* **Governing Documents Affected:**
  * `IDEMO_DECISION_REGISTER.md` (Decision tracking)
* **Implementation Status:** COMPLETED & GOVERNANCE-LOCKED
* **Future Review Requirements:** Periodically verify advisory lock efficiency and review watchdog execution logs to confirm singleton executions are cleanly registered without contention.


