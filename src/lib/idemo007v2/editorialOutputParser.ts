/**
 * IDEMO 007 V2 - Canonical Output Governance & Parser (Slice 4.4)
 *
 * Deterministically parses raw editorial LLM response into an intermediate
 * EditorialSynthesisOutput DTO, ensuring application-controlled fields
 * (coordinates, mapsPlaceId, canonicalName, entityType, provenance, status)
 * cannot be overridden or supplied by the model.
 */

import {
  EditorialSynthesisOutput,
  EditorialOutputParseResult,
  EditorialParseBlockingReason,
} from '../../types/idemo007v2';

// List of prohibited keys that model is strictly NOT allowed to supply or override
const PROHIBITED_MODEL_KEYS = [
  'coordinates',
  'mapsPlaceId',
  'maps_place_id',
  'canonicalName',
  'canonical_name',
  'entityType',
  'entity_type',
  'provenance',
  'verificationStatus',
  'verification_status',
  'trustLevel',
  'trust_level',
  'partnerId',
  'partner_id',
  'id',
  'recommendationId',
  'locationResolutionStatus',
  'location_resolution_status',
  'researchMode',
  'research_mode',
  'rawLlmResponse',
  'raw_llm_response',
  'previousModelOutput',
  'previous_model_output',
  'modelReasoning',
  'model_reasoning',
  'debugPayload',
  'debug_payload',
  'publicationStatus',
  'publication_status',
];

/**
 * Deterministically parses and validates raw model editorial response.
 */
export function parseEditorialOutput(rawInput: any): EditorialOutputParseResult {
  const blockingReasons: EditorialParseBlockingReason[] = [];

  if (rawInput === null || rawInput === undefined) {
    return {
      success: false,
      blockingReasons: ['MALFORMED_EDITORIAL_OUTPUT'],
      errorDetails: 'Raw model output is null or undefined',
    };
  }

  let parsedObj: any = rawInput;

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        success: false,
        blockingReasons: ['MALFORMED_EDITORIAL_OUTPUT'],
        errorDetails: 'Raw model response string is empty',
      };
    }

    try {
      // Remove possible markdown code block fences if wrapped in ```json ... ```
      const jsonText = trimmed.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '');
      parsedObj = JSON.parse(jsonText);
    } catch (err: any) {
      return {
        success: false,
        blockingReasons: ['MALFORMED_EDITORIAL_OUTPUT'],
        errorDetails: `Failed to parse model JSON: ${err.message}`,
      };
    }
  }

  if (typeof parsedObj !== 'object' || parsedObj === null || Array.isArray(parsedObj)) {
    return {
      success: false,
      blockingReasons: ['UNSUPPORTED_OUTPUT_STRUCTURE'],
      errorDetails: 'Model output must be a valid JSON object',
    };
  }

  // Check for prohibited keys that attempt to override application-controlled fields
  const objKeys = Object.keys(parsedObj);
  const foundProhibited = objKeys.filter((k) => PROHIBITED_MODEL_KEYS.includes(k));

  if (foundProhibited.length > 0) {
    return {
      success: false,
      blockingReasons: ['PROHIBITED_OUTPUT_FIELD'],
      errorDetails: `Model response attempted to supply prohibited application-owned fields: ${foundProhibited.join(', ')}`,
    };
  }

  // Check required editorial fields: shortDescriptionEn (or shortDescription) and usedFactKeys
  const shortDescriptionEn =
    parsedObj.shortDescriptionEn ||
    parsedObj.shortDescription ||
    parsedObj.short_description_en ||
    parsedObj.short_description;

  const usedFactKeys = parsedObj.usedFactKeys || parsedObj.used_fact_keys;

  if (!shortDescriptionEn || typeof shortDescriptionEn !== 'string' || !shortDescriptionEn.trim()) {
    blockingReasons.push('MISSING_REQUIRED_EDITORIAL_FIELD');
  }

  if (!Array.isArray(usedFactKeys)) {
    blockingReasons.push('MISSING_REQUIRED_EDITORIAL_FIELD');
  }

  if (blockingReasons.length > 0) {
    return {
      success: false,
      blockingReasons,
      errorDetails: 'Missing required editorial fields (shortDescriptionEn or usedFactKeys)',
    };
  }

  // Deterministically normalize allowed editorial fields ONLY
  const normalized: EditorialSynthesisOutput = {
    titleEn: typeof parsedObj.titleEn === 'string' ? parsedObj.titleEn.trim() : typeof parsedObj.title === 'string' ? parsedObj.title.trim() : undefined,
    titleSr: typeof parsedObj.titleSr === 'string' ? parsedObj.titleSr.trim() : undefined,
    subtitleEn: typeof parsedObj.subtitleEn === 'string' ? parsedObj.subtitleEn.trim() : typeof parsedObj.subtitle === 'string' ? parsedObj.subtitle.trim() : undefined,
    subtitleSr: typeof parsedObj.subtitleSr === 'string' ? parsedObj.subtitleSr.trim() : undefined,
    shortDescriptionEn: String(shortDescriptionEn).trim(),
    shortDescriptionSr: typeof parsedObj.shortDescriptionSr === 'string' ? parsedObj.shortDescriptionSr.trim() : undefined,
    longDescriptionEn: typeof parsedObj.longDescriptionEn === 'string' ? parsedObj.longDescriptionEn.trim() : typeof parsedObj.longDescription === 'string' ? parsedObj.longDescription.trim() : undefined,
    longDescriptionSr: typeof parsedObj.longDescriptionSr === 'string' ? parsedObj.longDescriptionSr.trim() : undefined,
    whyItMattersEn: typeof parsedObj.whyItMattersEn === 'string' ? parsedObj.whyItMattersEn.trim() : typeof parsedObj.whyItMatters === 'string' ? parsedObj.whyItMatters.trim() : undefined,
    whyItMattersSr: typeof parsedObj.whyItMattersSr === 'string' ? parsedObj.whyItMattersSr.trim() : undefined,
    usedFactKeys: (usedFactKeys as any[]).map((k) => String(k).trim()).filter(Boolean),
  };

  return {
    success: true,
    editorialOutput: normalized,
    blockingReasons: [],
  };
}
