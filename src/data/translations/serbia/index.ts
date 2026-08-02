/**
 * IDEMO Canonical Serbia Baseline v2 — Combined 6-Language Translation Matrix
 * Work Package: WP-09
 */

import { srCanonicalTranslations } from "./srTranslations";
import { zhCanonicalTranslations } from "./zhTranslations";
import { deCanonicalTranslations } from "./deTranslations";
import { ruCanonicalTranslations } from "./ruTranslations";
import { esCanonicalTranslations } from "./esTranslations";

export const CANONICAL_SERBIA_TRANSLATIONS: Record<
  string,
  Record<
    string,
    {
      title: string;
      shortDescription: string;
      longDescription: string;
      location: string;
    }
  >
> = {
  sr: srCanonicalTranslations,
  zh: zhCanonicalTranslations,
  de: deCanonicalTranslations,
  ru: ruCanonicalTranslations,
  es: esCanonicalTranslations,
};
