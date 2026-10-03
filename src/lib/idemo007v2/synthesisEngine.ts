/**
 * IDEMO 007 V2 - Synthesis Engine (Slice 4.1 Factual Integrity & Strict Editorial Authority)
 * 
 * CORE FACTUAL RULE:
 * The synthesis model is an EDITOR, NOT a knowledge source.
 * It may:
 *  - paraphrase supplied facts
 *  - connect supplied facts
 *  - improve clarity
 *  - write editorial transitions
 *  - communicate Curator emphasis
 * 
 * It may NOT introduce new externally verifiable facts from model memory.
 * Application owns all deterministic, geographic, route, media, practical, and trust fields.
 * Gemini outputs ONLY editorial strings (titles, subtitles, descriptions) and cited fact keys.
 */

import { GoogleGenAI, Type } from '@google/genai';
import { 
  Entity,
  FactPack, 
  SynthesisInput, 
  SynthesisResult, 
  EditorialOutput,
  GovernedSynthesisInput,
  EditorialSynthesisOutput,
} from '../../types/idemo007v2';
import { Category } from '../../types';
import {
  generateSynthesisCacheKey,
  getCachedSynthesis,
  setCachedSynthesis,
} from './synthesisCacheManager';
import { candidateIsPromoted } from './candidatePromotionGate';
import {
  buildGovernedSynthesisInput,
  validateGovernedSynthesisInput,
} from './governedSynthesisInput';
import { parseEditorialOutput } from './editorialOutputParser';
import { validateCanonicalRecommendationForPublication } from './publicationGate';
import { resolveFinalPublicationDecision } from './curatorAuthority';

// Strict Editorial Response Schema for @google/genai structured output
export const EDITORIAL_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    titleEn: {
      type: Type.STRING,
      description: 'Understated, elegant English title reflecting the entity name without hype',
    },
    titleSr: {
      type: Type.STRING,
      description: 'Serbian Cyrillic title reflecting the entity name',
    },
    subtitleEn: {
      type: Type.STRING,
      description: 'Short English subtitle derived strictly from supplied facts (e.g. UNESCO World Heritage Site)',
    },
    subtitleSr: {
      type: Type.STRING,
      description: 'Short Serbian Cyrillic subtitle derived strictly from supplied facts',
    },
    shortDescriptionEn: {
      type: Type.STRING,
      description: 'Calm, refined 2-3 sentence English overview using ONLY supplied facts',
    },
    shortDescriptionSr: {
      type: Type.STRING,
      description: 'Serbian Cyrillic translation of short overview using ONLY supplied facts',
    },
    longDescriptionEn: {
      type: Type.STRING,
      description: 'Editorial narrative weaving supplied facts and curator emphasis without any model memory inventions',
    },
    longDescriptionSr: {
      type: Type.STRING,
      description: 'Serbian Cyrillic translation of editorial narrative using ONLY supplied facts',
    },
    usedFactKeys: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Array of exact factKey strings from the supplied FactPack that were cited in this editorial text',
    },
  },
  required: [
    'titleEn',
    'titleSr',
    'subtitleEn',
    'subtitleSr',
    'shortDescriptionEn',
    'shortDescriptionSr',
    'longDescriptionEn',
    'longDescriptionSr',
    'usedFactKeys',
  ],
};

/**
 * Build the minimal, compact fact enumeration prompt for synthesis.
 * Consumes strictly governed DTO fields, excluding raw search payloads and discovery metadata.
 */
export function buildSynthesisPrompt(
  input: GovernedSynthesisInput | FactPack | any,
  curatorNotesOverride?: string
): { systemInstruction: string; userPrompt: string } {
  let factPack: FactPack;
  let canonicalName: string;
  let entityType: string;
  let primaryLocation: string;
  let curatorEmphasis: string;

  if (input && (input as GovernedSynthesisInput).canonicalName && (input as GovernedSynthesisInput).factPack) {
    const governed = input as GovernedSynthesisInput;
    factPack = governed.factPack;
    canonicalName = governed.canonicalName;
    entityType = governed.entityType;
    primaryLocation = factPack.geography?.primaryLocation || factPack.entities?.[0]?.location || 'Serbia';
    curatorEmphasis = governed.curatorNotes || curatorNotesOverride || factPack.curatorInput?.emphasis || factPack.curatorInput?.curatorNotes || 'Understated luxury presentation.';
  } else if (input && Array.isArray((input as FactPack).facts)) {
    factPack = input as FactPack;
    const primaryEntity = factPack.entities?.[0];
    canonicalName = primaryEntity?.canonicalName || 'Unknown Place';
    entityType = primaryEntity?.entityType || 'PLACE';
    primaryLocation = factPack.geography?.primaryLocation || primaryEntity?.location || 'Serbia';
    curatorEmphasis = curatorNotesOverride || factPack.curatorInput?.emphasis || factPack.curatorInput?.curatorNotes || 'Understated luxury presentation.';
  } else if (input && input.entities) {
    factPack = input as FactPack;
    canonicalName = factPack.entities[0]?.canonicalName || 'Unknown Place';
    entityType = factPack.entities[0]?.entityType || 'PLACE';
    primaryLocation = factPack.geography?.primaryLocation || factPack.entities[0]?.location || 'Serbia';
    curatorEmphasis = curatorNotesOverride || factPack.curatorInput?.emphasis || 'Understated luxury presentation.';
  } else {
    throw new Error('GOVERNED_INPUT_INVALID: buildSynthesisPrompt requires a valid GovernedSynthesisInput or FactPack');
  }

  const systemInstruction = `You are the IDEMO Editorial Writer for Serbia.
Your role is an EDITOR, NOT a knowledge source.

YOU MAY:
- Paraphrase supplied facts with understated, luxury editorial phrasing.
- Connect supplied facts into smooth, elegant sentences.
- Communicate the Curator's specific emphasis.
- Leave out awkward technical jargon while preserving exact factual truths.

PROHIBITION ON MODEL MEMORY:
- You possess vast world knowledge, but for this task it is strictly PROHIBITED evidence.
- DO NOT use facts from model memory.
- DO NOT introduce new historical figures, emperors, dates, construction details, architectural elements, unverified claims, or external facts not present in the supplied FactPack.
- ONLY supplied FactPack evidence is authorized.
- When evidence is absent: OMIT IT.
- If the FactPack contains only one or two facts, write a brief, calm description that speaks ONLY about those exact facts and nothing more.
- In "usedFactKeys", list ONLY the exact fact keys from the FactPack that you referenced.`;

  // Format compact enumerated facts strictly from factPack.facts
  const factsList = factPack.facts.length > 0
    ? factPack.facts.map((f) => `[${f.factKey}] ${typeof f.value === 'object' ? JSON.stringify(f.value) : f.value} (Source: ${f.sourceType})`).join('\n')
    : '(No external facts supplied - rely strictly on Entity Name and Curator Emphasis)';

  let journeyContext = '';
  if (factPack.recommendationType === 'JOURNEY' && factPack.journeyData?.stops) {
    journeyContext = `\nJOURNEY CONTEXT (Deterministic - describe itinerary flow without altering sequence):
- Total Stops: ${factPack.journeyData.stops.length}
- Total Distance: ${factPack.journeyData.totalDistanceKm || 0} km
- Total Estimated Driving: ${factPack.journeyData.totalDurationMinutes || 0} minutes
- Stops Sequence: ${factPack.journeyData.stops.map((s, i) => `${i + 1}. Entity ${s.entityId} (${s.componentRole})`).join(', ')}`;
  }

  const userPrompt = `CANONICAL ENTITY:
- Canonical Name: "${canonicalName}"
- Type: ${entityType}
- Destination/Location: "${primaryLocation}"

CURATOR EMPHASIS:
"${curatorEmphasis}"

AUTHORIZED FACTPACK EVIDENCE (STRICT BOUNDARY - DO NOT SUPPLEMENT):
${factsList}${journeyContext}

TASK:
Write the editorial presentation in English and Serbian (Cyrillic).
Adhere strictly to the provided facts. Do not invent details from model memory.
In "usedFactKeys", list the fact keys from the FactPack that you used.`;

  return { systemInstruction, userPrompt };
}

/**
 * Deterministic Post-Validation of Claims and Evidence Keys (Slice 4.4 & Slice 5)
 */
export function validateEditorialClaims(
  editorial: EditorialSynthesisOutput | EditorialOutput | any,
  inputOrFactPack: GovernedSynthesisInput | FactPack | any
): { passed: boolean; violations: string[]; citedFactKeys: string[]; validFactKeys: string[] } {
  const violations: string[] = [];

  let factPack: FactPack;
  let isUnresolvedLocation = false;

  if (inputOrFactPack && inputOrFactPack.factPack) {
    const governed = inputOrFactPack as GovernedSynthesisInput;
    factPack = governed.factPack;
    isUnresolvedLocation =
      governed.locationResolutionStatus === 'UNRESOLVED' ||
      (governed.verifiedLocation && governed.verifiedLocation.coordinates === null);
  } else if (inputOrFactPack && Array.isArray((inputOrFactPack as FactPack).facts)) {
    factPack = inputOrFactPack as FactPack;
  } else if (inputOrFactPack && inputOrFactPack.entities) {
    factPack = inputOrFactPack as FactPack;
  } else {
    throw new Error('FACTPACK_REQUIRED: validateEditorialClaims requires a valid GovernedSynthesisInput or FactPack');
  }

  const validFactKeys = factPack.facts.map((f) => f.factKey);
  const citedFactKeys = editorial.usedFactKeys || [];

  // 1. Verify cited fact keys exist in FactPack
  for (const key of citedFactKeys) {
    if (!validFactKeys.includes(key)) {
      violations.push(`Model cited non-existent fact key: "${key}"`);
    }
  }

  // 2. Resolve CITED FactRecords vs UNCITED FactRecords
  const citedFactRecords = factPack.facts.filter((f) => citedFactKeys.includes(f.factKey));
  const uncitedFactRecords = factPack.facts.filter((f) => !citedFactKeys.includes(f.factKey));

  // Build primary evidence text envelope from CITED FactRecords, Entity Context, and Curator Input
  const primaryEntity = factPack.entities[0];
  const canonicalNameText = primaryEntity?.canonicalName || '';
  const locationText = factPack.geography?.primaryLocation || primaryEntity?.location || '';
  const curatorText = `${factPack.curatorInput?.emphasis || ''} ${factPack.curatorInput?.curatorNotes || ''}`;

  const citedEvidenceTexts = [
    ...citedFactRecords.map((f) => (typeof f.value === 'object' ? JSON.stringify(f.value) : String(f.value))),
    canonicalNameText,
    locationText,
    curatorText,
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFC');

  // Full generated text from editorial output
  const fullTextEn = `${editorial.titleEn || ''} ${editorial.subtitleEn || ''} ${editorial.shortDescriptionEn || ''} ${
    editorial.longDescriptionEn || ''
  } ${editorial.whyItMattersEn || ''}`
    .toLowerCase()
    .normalize('NFC');
  const fullTextSr = `${editorial.titleSr || ''} ${editorial.subtitleSr || ''} ${editorial.shortDescriptionSr || ''} ${
    editorial.longDescriptionSr || ''
  } ${editorial.whyItMattersSr || ''}`
    .toLowerCase()
    .normalize('NFC');
  const fullText = `${fullTextEn} ${fullTextSr}`;

  // Helper to check if a term exists in cited evidence
  const isTermInCitedEvidence = (term: string): boolean => {
    const normTerm = term.toLowerCase().normalize('NFC').trim();
    if (!normTerm) return true;
    if (citedEvidenceTexts.includes(normTerm)) return true;

    // For multi-word terms (e.g., "medieval church" or "palace complex"), check if all words exist in evidence
    const words = normTerm.split(/\s+/).filter((w) => w.length > 2);
    if (words.length > 1) {
      return words.every((w) => citedEvidenceTexts.includes(w));
    }

    return false;
  };

  // 3. UNCITED FACT LEAK DETECTOR (S5-20)
  for (const uncitedFact of uncitedFactRecords) {
    const valStr = (typeof uncitedFact.value === 'object' ? JSON.stringify(uncitedFact.value) : String(uncitedFact.value))
      .toLowerCase()
      .normalize('NFC');
    const keywords = valStr.match(/[a-zа-шђјљњћџ0-9]{4,}/gi) || [];
    const significantUncitedKeywords = keywords.filter((kw) => {
      const lowerKw = kw.toLowerCase();
      return !citedEvidenceTexts.includes(lowerKw) && !['http', 'https', 'value', 'fact', 'source', 'type'].includes(lowerKw);
    });

    for (const kw of significantUncitedKeywords) {
      if (fullText.includes(kw.toLowerCase())) {
        violations.push(
          `Uncited evidence leak: Model used fact content ("${kw}") from FactRecord "${uncitedFact.factKey}" without citing it in usedFactKeys`
        );
        break;
      }
    }
  }

  // 4. UNRESOLVED LOCATION CLAIM RULE (Slice 4.4 Section E)
  if (isUnresolvedLocation) {
    const proximityTriggers = [
      'located in',
      'located near',
      'situated in',
      'situated near',
      'minutes from',
      'km from',
      'kilometers from',
      'walking distance',
      'close to',
      'located at',
      'exact location',
      'address:',
    ];

    for (const trigger of proximityTriggers) {
      if (fullText.includes(trigger) && !isTermInCitedEvidence(trigger)) {
        violations.push(
          `UNRESOLVED location cannot gain invented address/proximity claim ("${trigger}") without supporting cited FactRecord evidence`
        );
      }
    }
  }

  // 5. NUMBER, DATE, YEAR, AND TIME ATOM GROUNDING
  const numberMatches = fullText.match(/\b\d{1,4}(:\d{2})?\b/g) || [];
  for (const numToken of numberMatches) {
    if (numToken.length === 1 && !citedEvidenceTexts.includes(numToken)) {
      continue;
    }

    const hasExactNumInEvidence = citedFactRecords.some((f) =>
      new RegExp(`\\b${numToken.replace(':', '\\:')}\\b`).test(String(f.value))
    );

    if (!hasExactNumInEvidence) {
      violations.push(
        `Model memory leak / unsupported number or date atom: Introduced "${numToken}" without supporting cited FactRecord evidence`
      );
      continue;
    }

    if (numToken === '2007') {
      if (
        fullText.includes('founded in 2007') ||
        fullText.includes('built in 2007') ||
        fullText.includes('built the palace in 2007') ||
        fullText.includes('constructed in 2007')
      ) {
        const fact2007 = citedFactRecords.find((f) => String(f.value).includes('2007'));
        if (fact2007) {
          const val = String(fact2007.value).toLowerCase();
          if (!val.includes('built') && !val.includes('founded') && !val.includes('constructed')) {
            violations.push(
              `Unsupported relationship binding: Atom "2007" is bound to "founded/built" in prose, but cited FactRecord "${fact2007.factKey}" specifies UNESCO inscription/listing`
            );
          }
        }
      }

      if (fullText.includes('unesco designated eastern serbia') || fullText.includes('unesco listed eastern serbia')) {
        violations.push(
          'Unsupported cross-fact recombination: UNESCO designation incorrectly assigned to region "Eastern Serbia" rather than canonical entity'
        );
      }
    }
  }

  // 6. HISTORICAL FIGURES & PROPER NAMES GROUNDING
  const historicalPersons = [
    { en: 'galerius', sr: 'галерије' },
    { en: 'romula', sr: 'ромула' },
    { en: 'licinius', sr: 'лициније' },
    { en: 'srejović', sr: 'срејовић' },
    { en: 'dragoslav', sr: 'драгослав' },
    { en: 'danube', sr: 'дунав' },
    { en: 'timok', sr: 'тимок' },
    { en: 'persians', sr: 'персијанци' },
    { en: 'dushan', sr: 'душан' },
    { en: 'lazar', sr: 'лазар' },
    { en: 'nemanja', sr: 'немања' },
  ];

  for (const person of historicalPersons) {
    if (
      (fullText.includes(person.en) || fullText.includes(person.sr)) &&
      !isTermInCitedEvidence(person.en) &&
      !isTermInCitedEvidence(person.sr)
    ) {
      violations.push(
        `Model memory leak: Introduced proper name / figure ("${person.en}") without supporting cited FactRecord evidence`
      );
    }
  }

  if (
    fullText.includes('felix romuliana commissioned') ||
    fullText.includes('site commissioned emperor') ||
    fullText.includes('location commissioned emperor')
  ) {
    violations.push(
      'Reversed relationship direction: Candidate entity cannot be stated as the commissioner of a historical figure'
    );
  }

  // 7. STRUCTURAL & ARCHITECTURAL CLASSIFICATION ASSERTIONS
  const structuralTermPairs: Array<{ en: string; sr: string }> = [
    { en: 'palace', sr: 'палата' },
    { en: 'palace complex', sr: 'палата' },
    { en: 'mausoleum', sr: 'маузолеј' },
    { en: 'villa', sr: 'вила' },
    { en: 'fortress', sr: 'тврђава' },
    { en: 'castle', sr: 'замак' },
    { en: 'amphitheater', sr: 'амфитеатар' },
    { en: 'mosaic', sr: 'мозаик' },
    { en: 'temple', sr: 'храм' },
    { en: 'basilica', sr: 'базилика' },
    { en: 'baths', sr: 'купатила' },
    { en: 'fortification', sr: 'утврђење' },
    { en: 'monastery', sr: 'манастир' },
    { en: 'church', sr: 'црква' },
    { en: 'spa', sr: 'бања' },
    { en: 'winery', sr: 'винарија' },
    { en: 'museum', sr: 'музеј' },
    { en: 'restaurant', sr: 'ресторан' },
    { en: 'unesco site', sr: 'унеско локалитет' },
    { en: 'roman complex', sr: 'римски' },
    { en: 'medieval church', sr: 'црква' },
    { en: 'ottoman building', sr: 'османско' },
    { en: 'protected monument', sr: 'споменик' },
  ];

  for (const pair of structuralTermPairs) {
    const hasEn = fullText.includes(pair.en);
    const hasSr = fullText.includes(pair.sr);

    if ((hasEn || hasSr) && !isTermInCitedEvidence(pair.en) && !isTermInCitedEvidence(pair.sr)) {
      violations.push(
        `Model memory leak / unsupported structural claim: Introduced specific historical/structural assertion ("${pair.en}") without supporting cited FactRecord evidence`
      );
    }
  }

  // 8. COMPARATIVE & SUPERLATIVE CLAIMS
  const comparativeTermPairs: Array<{ en: string; sr: string }> = [
    { en: 'best-preserved', sr: 'најбоље сачуван' },
    { en: 'best preserved', sr: 'најбоље сачуван' },
    { en: 'most preserved', sr: 'најбоље сачуван' },
    { en: "one of serbia's best", sr: 'један од најбољих' },
    { en: "one of serbia’s best", sr: 'један од најбољих' },
    { en: 'largest', sr: 'највећи' },
    { en: 'oldest', sr: 'најстарији' },
    { en: 'most intact', sr: 'најсачуванији' },
    { en: 'most significant', sr: 'најзначајнији' },
    { en: 'premier', sr: 'најбољи' },
    { en: 'iconic', sr: 'иконичан' },
    { en: 'must-see', sr: 'обавезно' },
    { en: 'leading', sr: 'водећи' },
    { en: 'unique', sr: 'јединствен' },
  ];

  for (const pair of comparativeTermPairs) {
    const hasEn = fullText.includes(pair.en);
    const hasSr = fullText.includes(pair.sr);

    if ((hasEn || hasSr) && !isTermInCitedEvidence(pair.en) && !isTermInCitedEvidence(pair.sr)) {
      violations.push(
        `Model memory leak / unsupported comparative claim: Introduced comparative/superlative assertion ("${pair.en}") without supporting cited FactRecord evidence`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    citedFactKeys,
    validFactKeys,
  };
}

/**
 * Deterministically assemble canonical Recommendation from Application-Owned Fields + Gemini Editorial Fields
 */
export function assembleCanonicalRecommendation(
  editorial: EditorialSynthesisOutput | EditorialOutput | any,
  input: GovernedSynthesisInput | SynthesisInput | any
): any {
  const factPack: FactPack = input.factPack;
  const curatorNotes = input.curatorNotes;
  const humanProvidedMedia = input.humanProvidedMedia;
  const partnerId = input.partnerId;
  const existingRecommendationId = input.existingRecommendationId;

  const isUnresolved =
    input.locationResolutionStatus === 'UNRESOLVED' ||
    (input.verifiedLocation && input.verifiedLocation.coordinates === null);

  const primaryEntity: Entity = factPack.entities[0] || {
    id: `ent-${Date.now()}`,
    canonicalName: input.canonicalName || editorial.titleEn || 'Recommended Place',
    entityType: input.entityType || 'PLACE',
    trustLevel: 'UNVERIFIED',
    verificationStatus: 'PENDING_REVIEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: 'Serbia',
    coordinates: null,
  };

  // Determine category deterministically
  let category: Category | string = Category.HISTORY;
  if (primaryEntity.entityType === 'RESTAURANT') category = Category.GASTRONOMY;
  else if (primaryEntity.entityType === 'ACCOMMODATION') category = Category.TRAVEL;
  else if (factPack.recommendationType === 'JOURNEY') category = Category.TRAVEL;
  else if (factPack.curatorInput?.category) category = factPack.curatorInput.category;

  // Extract practical info strictly from FactRecords - NEVER invent
  const cleanPractical: Record<string, string | undefined> = {};
  const openingHoursFact = factPack.facts.find(f => f.factKey === 'opening_hours' || f.factKey === 'hours');
  if (openingHoursFact && openingHoursFact.value) {
    cleanPractical.opening_hours = typeof openingHoursFact.value === 'string' ? openingHoursFact.value : JSON.stringify(openingHoursFact.value);
  }

  const ticketPriceFact = factPack.facts.find(f => f.factKey === 'ticket_price' || f.factKey === 'admission_fee' || f.factKey === 'entry_fee');
  if (ticketPriceFact && ticketPriceFact.value) {
    cleanPractical.admission_fee = typeof ticketPriceFact.value === 'string' ? ticketPriceFact.value : JSON.stringify(ticketPriceFact.value);
  }

  const phoneFact = factPack.facts.find(f => f.factKey === 'phone_number' || f.factKey === 'contact_phone');
  if (phoneFact && phoneFact.value) {
    cleanPractical.contact_phone = typeof phoneFact.value === 'string' ? phoneFact.value : JSON.stringify(phoneFact.value);
  }

  const emailFact = factPack.facts.find(f => f.factKey === 'contact_email' || f.factKey === 'email');
  if (emailFact && emailFact.value) {
    cleanPractical.contact_email = typeof emailFact.value === 'string' ? emailFact.value : JSON.stringify(emailFact.value);
  }

  const websiteFact = factPack.facts.find(f => f.factKey === 'official_website' || f.factKey === 'website');
  if (websiteFact && websiteFact.value) {
    cleanPractical.website = typeof websiteFact.value === 'string' ? websiteFact.value : JSON.stringify(websiteFact.value);
  }

  // Media strictly from curator/human provided media - ZERO model invention
  const finalImage = humanProvidedMedia?.url || '';

  // Curator notes strictly from curator input - ZERO model invention
  const finalCuratorNote = curatorNotes || factPack.curatorInput?.curatorNotes || undefined;

  // Mood orbit strictly application-owned / curator-supplied
  const moodOrbit = factPack.curatorInput?.moodOrbit || {
    coordinateX: 0,
    coordinateY: 0,
    energy: 0.5,
    social: 0.5,
    luxury: 0.5,
    urbanity: 0.5,
    nature: 0.5,
  };

  const coordinates = isUnresolved
    ? null
    : input.verifiedLocation?.coordinates || factPack.geography?.coordinates || primaryEntity.coordinates || null;

  const primaryLocation = factPack.geography?.primaryLocation || primaryEntity.location || 'Serbia';

  const canonicalName = input.canonicalName || primaryEntity.canonicalName;

  const canonical: any = {
    id: existingRecommendationId || `rec-v2-${Date.now()}`,
    serviceAreaId: factPack.geography?.serviceAreaId || 'sa-rs-eastern',
    title: editorial.titleEn || canonicalName,
    titleEn: editorial.titleEn || canonicalName,
    titleSr: editorial.titleSr || canonicalName,
    category,
    categories: [category],
    expertiseIds: ['exp-culture-museums'],
    capabilityIds: ['cap-english-fluent'],
    shortDescription: editorial.shortDescriptionEn,
    shortDescriptionEn: editorial.shortDescriptionEn,
    shortDescriptionSr: editorial.shortDescriptionSr,
    longDescription: editorial.longDescriptionEn,
    longDescriptionEn: editorial.longDescriptionEn,
    longDescriptionSr: editorial.longDescriptionSr,
    location: primaryLocation,
    locationEn: primaryLocation,
    locationSr: primaryLocation,
    image: finalImage,
    coordinates,
    coordinateX: moodOrbit.coordinateX ?? 0,
    coordinateY: moodOrbit.coordinateY ?? 0,
    energy: moodOrbit.energy ?? 0.5,
    social: moodOrbit.social ?? 0.5,
    luxury: moodOrbit.luxury ?? 0.5,
    urbanity: moodOrbit.urbanity ?? 0.5,
    nature: moodOrbit.nature ?? 0.5,
    weatherDependency: 0.3,
    seasonality: 'all',
    familySuitability: true,
    accessibility: true,
    premiumLevel: 'standard',
    budgetLevel: cleanPractical.admission_fee ? 'moderate' : 'free',
    duration: primaryEntity.entityType === 'PLACE' ? '1-2 hours' : 'Half day',
    travelTime: '',
    travelTimeMinutes: 0,
    estimatedCost: cleanPractical.admission_fee || '',
    preferredTransport: 'Car',
    publicationStatus: 'DRAFT',
    website: cleanPractical.website,
    phone: cleanPractical.contact_phone,
    practicalInfo: Object.keys(cleanPractical).length > 0 ? cleanPractical : undefined,
    curatorNote: finalCuratorNote,
    additionalCuratorNotes: finalCuratorNote,
    provenance: {
      source: humanProvidedMedia?.source || 'IDEMO Verified FactPack',
      method: humanProvidedMedia?.url ? 'original' : 'idemo-007-v2',
      license: humanProvidedMedia?.license || 'IDEMO Protected',
      attributionRequired: false,
      attributionText: 'IDEMO Concierge',
      verificationStatus: 'VERIFIED',
      altText: editorial.titleEn || canonicalName,
    },
    translations: {
      en: {
        title: editorial.titleEn || canonicalName,
        shortDescription: editorial.shortDescriptionEn,
        longDescription: editorial.longDescriptionEn,
        location: primaryLocation,
      },
      sr: {
        title: editorial.titleSr || canonicalName,
        shortDescription: editorial.shortDescriptionSr,
        longDescription: editorial.longDescriptionSr,
        location: primaryLocation,
      },
      de: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      ru: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      es: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
      zh: { title: '', shortDescription: 'PENDING LOCALIZATION', longDescription: 'PENDING LOCALIZATION', location: '' },
    },
  };

  if (partnerId) {
    canonical.partnerId = partnerId;
  }

  // Attach deterministic Journey fields if journey recommendation
  if (factPack.recommendationType === 'JOURNEY' && factPack.journeyData) {
    canonical.journeyData = {
      stops: factPack.journeyData.stops,
      totalDurationMinutes: factPack.journeyData.totalDurationMinutes,
      totalDistanceKm: factPack.journeyData.totalDistanceKm,
    };
  }

  return canonical;
}

/**
 * Execute Gemini Synthesis with true structured output (responseSchema)
 */
export async function executeV2Synthesis(
  input: SynthesisInput | GovernedSynthesisInput | any,
  apiKey?: string
): Promise<SynthesisResult> {
  // Build & validate GovernedSynthesisInput boundary (Slices 4.2 & 4.3)
  const governedInput = buildGovernedSynthesisInput(input);

  const startTime = Date.now();
  const cacheKey = generateSynthesisCacheKey(governedInput);

  // Check cache hit unless manual forceRegenerate is requested
  if (!governedInput.forceRegenerate) {
    const cachedEditorial = await getCachedSynthesis(cacheKey);
    if (cachedEditorial) {
      // Re-run current deterministic validation on cached output
      const claimsValidation = validateEditorialClaims(cachedEditorial, governedInput.factPack);
      if (claimsValidation.passed) {
        const recommendation = assembleCanonicalRecommendation(cachedEditorial, governedInput);
        const publicationValidation = validateCanonicalRecommendationForPublication(recommendation, governedInput);
        const finalPublicationDecision = resolveFinalPublicationDecision(
          publicationValidation,
          governedInput.curatorOverride
        );
        return {
          recommendation,
          editorialOutput: cachedEditorial,
          telemetry: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            durationMs: Date.now() - startTime,
            model: 'synthesis-cache-hit',
            cacheHit: true,
          },
          claimsValidation,
          publicationValidation,
          finalPublicationDecision,
        };
      }
    }
  }

  const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY || '';
  if (!effectiveApiKey) {
    throw new Error('GEMINI_API_KEY is required for V2 editorial synthesis');
  }

  const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
  const { systemInstruction, userPrompt } = buildSynthesisPrompt(governedInput);

  let editorialOutput: EditorialOutput;
  let usage: any = {};
  const modelName = 'gemini-3.7-flash';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: EDITORIAL_RESPONSE_SCHEMA,
        maxOutputTokens: 1200,
        temperature: 0.1,
      },
    });

    const responseText = response.text || '{}';
    editorialOutput = JSON.parse(responseText);
    usage = (response as any).usageMetadata || {};
  } catch (err: any) {
    console.warn(`[synthesisEngine] Model ${modelName} error, attempting fallback to gemini-3.6-flash:`, err.message);
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: EDITORIAL_RESPONSE_SCHEMA,
        maxOutputTokens: 1200,
        temperature: 0.1,
      },
    });
    editorialOutput = JSON.parse(fallbackResponse.text || '{}');
    usage = (fallbackResponse as any).usageMetadata || {};
  }

  const durationMs = Date.now() - startTime;

  // Validate editorial claims against FactPack evidence
  const claimsValidation = validateEditorialClaims(editorialOutput, governedInput.factPack);

  // Assemble canonical recommendation with deterministic application ownership
  const recommendation = assembleCanonicalRecommendation(editorialOutput, governedInput);
  if (!claimsValidation.passed) {
    recommendation.publicationStatus = 'PENDING_REVIEW';
  }

  // Validate canonical recommendation for publication readiness (Slice 4.5)
  const publicationValidation = validateCanonicalRecommendationForPublication(recommendation, governedInput);

  // Resolve final publication decision with human curator override authority (Slice 4.6)
  const finalPublicationDecision = resolveFinalPublicationDecision(
    publicationValidation,
    governedInput.curatorOverride
  );

  // Cache resulting EditorialOutput for current key
  await setCachedSynthesis(cacheKey, editorialOutput);

  return {
    recommendation,
    editorialOutput,
    telemetry: {
      inputTokens: usage.promptTokenCount || 0,
      outputTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
      durationMs,
      model: modelName,
      cacheHit: false,
    },
    claimsValidation,
    publicationValidation,
    finalPublicationDecision,
  };
}
