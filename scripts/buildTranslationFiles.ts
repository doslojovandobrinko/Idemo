import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import fs from 'fs';
import path from 'path';

const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

// Dictionary mapping recommendation ID -> language -> fields
const srDict: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {};
const zhDict: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {};
const deDict: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {};
const ruDict: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {};
const esDict: Record<string, { title: string; shortDescription: string; longDescription: string; location: string }> = {};

canonical.forEach(r => {
  const id = r.id;
  const enTitle = r.title;
  const enShort = r.shortDescription;
  const enLong = r.longDescription;
  const enLoc = r.location;

  // Preserve existing SR if present
  const existingSr = r.translations?.sr;
  srDict[id] = {
    title: existingSr?.title || enTitle,
    shortDescription: existingSr?.shortDescription || enShort,
    longDescription: existingSr?.longDescription || enLong,
    location: existingSr?.location || enLoc
  };

  // Preserve existing ZH if present
  const existingZh = r.translations?.zh;
  zhDict[id] = {
    title: existingZh?.title || enTitle,
    shortDescription: existingZh?.shortDescription || enShort,
    longDescription: existingZh?.longDescription || enLong,
    location: existingZh?.location || enLoc
  };

  // DE
  const existingDe = r.translations?.de;
  deDict[id] = {
    title: existingDe?.title || enTitle,
    shortDescription: existingDe?.shortDescription || enShort,
    longDescription: existingDe?.longDescription || enLong,
    location: existingDe?.location || enLoc
  };

  // RU
  const existingRu = r.translations?.ru;
  ruDict[id] = {
    title: existingRu?.title || enTitle,
    shortDescription: existingRu?.shortDescription || enShort,
    longDescription: existingRu?.longDescription || enLong,
    location: existingRu?.location || enLoc
  };

  // ES
  const existingEs = r.translations?.es;
  esDict[id] = {
    title: existingEs?.title || enTitle,
    shortDescription: existingEs?.shortDescription || enShort,
    longDescription: existingEs?.longDescription || enLong,
    location: existingEs?.location || enLoc
  };
});

console.log(`Loaded base dictionaries for ${canonical.length} items.`);
