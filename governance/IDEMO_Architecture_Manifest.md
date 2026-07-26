# IDEMO ARCHITECTURE MANIFEST
**Level 3: The Governing Technical Standard**

---

## 1. Scope & Core Directives
The **IDEMO Architecture Manifest** defines the permanent technical architecture, coding standards, and state management conventions of the IDEMO application.
* It is subordinate to the **IDEMO Constitution** (Highest Governing Document) and **IDEMO Design Constitution** (Governing Design Standard).
* This manifest ensures that the codebase remains highly performant, type-safe, maintainable, modular, and structurally sound as features scale.

---

## 2. Privacy-First Architecture
Privacy is our primary architectural constant.
* **No Remote Tracking:** The system is strictly forbidden from capturing, logging, or transmitting user behavior, selections, coordinate inputs, or preferences to external servers.
* **No Remote Profiles:** All user preferences, ratings, saved states, and itinerary plans must remain exclusively on the client-side.
* **No Unsolicited API Calls:** External APIs, remote analytics frameworks, and tracking logs must never be integrated unless explicitly requested by the Creator.

---

## 3. Offline-First Philosophy & State Management
IDEMO must operate seamlessly without internet connectivity.
* **Local State Execution:** All similarity matching, filter evaluation, and itinerary coordinate mapping must be performed locally on the client device.
* **Storage Strategy:** Use standard browser storage (`localStorage` or IndexedDB) for persistent user states (such as ratings, liked items, active language, and custom coordinates).
* **Graceful Degradation:** When optional remote assets (like live Map layers) are unavailable, the application must fallback gracefully to fully functional static alternatives (such as stylized vector canvas grids).

---

## 4. Coding Standards & Type Safety
To prevent bugs and compile-time issues, we mandate strict TypeScript standards:

### Import Restrictions
* **Named Imports:** All `import` statements must use explicit named imports rather than wildcard imports (`* as React` or object destructuring on import).
* **Top-Level Imports:** All import declarations must reside at the very top of each source file.
* **Type Imports:** Do NOT use `import type` when importing standard runtime values or enum elements.

### Enums
* **Standard Enums:** Always use standard TypeScript `enum` declarations for state matrices or fixed selections.
* **No Const Enums:** `const enum` is strictly forbidden to prevent bundle-time stripping issues.

### Modularity & Code Splitting
* **No Megafiles:** Do NOT consolidate all application logic into a single monolithic file (e.g. putting everything in `App.tsx`). This leads to generation cut-offs and merge conflicts.
* **Data & Logic Isolation:** Large datasets, static configuration matrices, helper functions, and mathematical models must reside in separate dedicated files (e.g., `/src/data/`, `/src/utils/`).
* **Shared Types:** Global interfaces, types, and enums must be declared early in a dedicated `/src/types.ts` file.

---

## 5. Component Architecture
* **Functional Components:** All React components must be written as functional components using modern hooks (e.g., `useState`, `useMemo`, `useCallback`).
* **Avoid Infinite Re-renders:** State updates must never occur directly in the body of a functional component.
* **Stabilize Dependencies:** Never include arrays, objects, or inline functions in a `useEffect` dependency array unless they are strictly memoized using `useMemo` or `useCallback`. Prefer primitive values (strings, numbers, booleans) in dependency arrays wherever possible.

---

## 6. Spatial-Semantic Scoring Architecture
* **The Coordinates:** Curation assets are plotted on a continuous $[-5.0, +5.0]$ coordinate space.
* **Engine Implementation:** The technical similarity scorer computes match ratios locally on the client. (Detailed formulas are housed in the Living Reference Library).
* **Overlapping Resolution:** When multiple recommendations occupy identical coordinates, a deterministic polar jittering mechanism must disperse their coordinates on the canvas slightly to keep all items interactively pressable.

---

## 7. Build & Deployment Architecture
* **Vite + React:** The client application uses React with Vite as the bundler.
* **Port Bindings:** Any server or preview engine must strictly bind to port `3000` on host `0.0.0.0` to meet container ingress routing rules.
* **Production Build:** The production build output must be fully contained inside the `/dist/` folder and serve high-performance static assets.
* **API Key Handling:** All server-side keys (like Gemini keys) must remain strictly server-side in `/api/*` proxies. No public exposure of critical developer keys is permitted.
