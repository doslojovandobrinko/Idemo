# IDEMO OPERATIONS HANDBOOK
**Level 5: The Governing Operational Standard**

---

## 1. Scope & Operational Directives
The **IDEMO Operations Handbook** defines release procedures, content updates, and testing protocols for the IDEMO application.
* It is subordinate to the **IDEMO Constitution** (Highest Governing Document), **IDEMO Design Constitution** (Governing Design Standard), and **IDEMO Architecture Manifest** (Governing Technical Standard).
* This handbook ensures that updates are shipped smoothly with zero downtime and perfect structural integrity.

---

## 2. Release & Deployment Protocols

### Development Build Phase
* Build command is strictly: `npm run build`.
* The build must produce high-performance, optimized client static assets in the `/dist/` directory.
* Every release must be preceded by complete, successful compilation (`compile_applet`) and linting (`lint_applet`).

### Custom Server Configurations (Full-Stack)
If a custom server is deployed, the package scripts must maintain strict entry and bundling structures:
```json
{
  "scripts": {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs"
  }
}
```
This bundler structure avoids runtime ES module relative resolution failures and compiles the backend safely to CJS.

---

## 3. QA Testing & Quality Gates

Before any version is tagged or deployed, it must pass three consecutive Quality Gates:

### Gate 1: Syntax & Type Checks
* Must pass `npm run lint` or `tsc --noEmit` with zero errors.
* No temporary types, unhandled standard enums, or wildcard type configurations.

### Gate 2: Curation Audits
* The dataset must match the schemas defined in `/governance/IDEMO_Knowledge_Base.md` (Living Reference Library).
* Coordinates must reside strictly in the $[-5.0, +5.0]$ canvas.
* All external links (e.g., Google Maps coordinates) must be verified and correct.

### Gate 3: UI Regression Checklist
* Verify layout integrity on a standard mobile frame and a full desktop workspace.
* Confirm that no elements overlap and touch targets are a minimum of 44px.
* Verify readability of core texts under bright mock daylight conditions.

---

## 4. Multi-National Onboarding & Dataset Management

As new countries are onboarded, developers and curation directors must follow the steps detailed in `/governance/IDEMO_Knowledge_Base.md` (Living Reference Library):
1. **Asset Selection:** Handpick exactly 100+ pristine, authentic experiences.
2. **Schema Compliance:** Format data strictly matching the type specifications.
3. **Coordinates Calibration:** Map experiences onto the $[-5.0, +5.0]$ Mood Orbit canvas.
4. **Translation Compilation:** Verify English, Serbian (Latin and Cyrillic), Spanish, German, Russian, and Chinese variants.
5. **Jittering Validation:** Verify that duplicate coordinate sets are automatically resolved via polar jittering.

---

## 5. Version Control & Changelog Management
* **Strict Versioning:** IDEMO uses semantic versioning (`MAJOR.MINOR.PATCH`).
* **The Changelog Ledger:** Every change (whether a code optimization, translation edit, or curation asset update) must be documented chronologically in `docs/CHANGELOG.md` with a timestamp and short explanation.
* **No Ghost Commits:** All changes must trace back to an authorized decision.
