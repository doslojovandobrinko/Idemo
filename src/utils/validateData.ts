/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { INITIAL_RECOMMENDATIONS } from '../constants';
import { Category } from '../types';

interface ValidationResult {
  id: string;
  title: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  errors: string[];
  warnings: string[];
}

export function runDataValidation() {
  console.log('====================================================');
  console.log('         IDEMO DATASET CERTIFICATION ENGINE          ');
  console.log('====================================================');
  
  const results: ValidationResult[] = [];
  const seenIds = new Set<string>();
  const validCategoryList = Object.values(Category) as string[];

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  INITIAL_RECOMMENDATIONS.forEach(rec => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Duplicate IDs
    if (!rec.id) {
      errors.push('Missing ID field.');
    } else if (seenIds.has(rec.id)) {
      errors.push(`Duplicate ID: "${rec.id}".`);
    } else {
      seenIds.add(rec.id);
    }

    // 2. Missing required fields
    const requiredFields: (keyof typeof rec)[] = [
      'title', 'category', 'shortDescription', 'longDescription', 
      'image', 'duration', 'travelTime', 'travelTimeMinutes', 
      'location', 'estimatedCost', 'preferredTransport'
    ];

    requiredFields.forEach(field => {
      if (rec[field] === undefined || rec[field] === null || rec[field] === '') {
        errors.push(`Missing required field: "${field}".`);
      }
    });

    // 3. CoordinateX and CoordinateY within -5 to +5
    if (rec.coordinateX === undefined || rec.coordinateY === undefined) {
      errors.push('Missing Mood Orbit coordinateX or coordinateY.');
    } else {
      if (rec.coordinateX < -5 || rec.coordinateX > 5) {
        errors.push(`coordinateX (${rec.coordinateX}) is out of bounds [-5, 5].`);
      }
      if (rec.coordinateY < -5 || rec.coordinateY > 5) {
        errors.push(`coordinateY (${rec.coordinateY}) is out of bounds [-5, 5].`);
      }
    }

    // 4. Invalid Categories
    if (rec.category) {
      const splitCats = rec.category.split(',').map(c => c.trim());
      splitCats.forEach(cat => {
        if (!validCategoryList.includes(cat)) {
          errors.push(`Invalid category component: "${cat}". Must be one of: ${validCategoryList.join(', ')}`);
        }
      });
    }

    // 5. Missing translations
    if (!rec.translations) {
      warnings.push('Missing "translations" block.');
    } else {
      const languages = Object.keys(rec.translations);
      if (languages.length === 0) {
        warnings.push('Translations block is empty.');
      } else {
        languages.forEach(lang => {
          const trans = rec.translations![lang];
          if (!trans.title) warnings.push(`Translation [${lang}] is missing title.`);
          if (!trans.shortDescription) warnings.push(`Translation [${lang}] is missing shortDescription.`);
          if (!trans.longDescription) warnings.push(`Translation [${lang}] is missing longDescription.`);
        });
      }
    }

    // 6. Missing image references (checking local physical existence)
    if (rec.image) {
      if (!rec.image.startsWith('/src/')) {
        errors.push(`Image reference path "${rec.image}" should be standard "/src/..." relative format.`);
      } else {
        // Strip leading slash to get relative path from workspace root
        const physicalPath = path.join(process.cwd(), rec.image.slice(1));
        if (!fs.existsSync(physicalPath)) {
          errors.push(`Physical image file not found at: "${physicalPath}".`);
        }
      }
    }

    // 7. Invalid Latitude / Longitude
    if (rec.coordinates) {
      const { lat, lng } = rec.coordinates;
      if (lat === undefined || lng === undefined) {
        errors.push('Coordinates object is missing lat or lng properties.');
      } else {
        if (lat < -90 || lat > 90) {
          errors.push(`Latitude (${lat}) is out of range [-90, 90].`);
        }
        if (lng < -180 || lng > 180) {
          errors.push(`Longitude (${lng}) is out of range [-180, 180].`);
        }
      }
    } else {
      warnings.push('Missing geo-coordinates (latitude and longitude).');
    }

    // 8. Missing semantic attributes
    const semanticAttributes = ['energy', 'social', 'luxury', 'urbanity', 'nature', 'weatherDependency'];
    semanticAttributes.forEach(attr => {
      const val = (rec as any)[attr];
      if (val === undefined || val === null) {
        errors.push(`Missing semantic attribute: "${attr}".`);
      } else if (typeof val !== 'number' || val < 0 || val > 10) {
        errors.push(`Semantic attribute "${attr}" value (${val}) must be a number between 0 and 10.`);
      }
    });

    // 9. Duration or Budget fields validity
    if (rec.duration && rec.duration.length < 2) {
      warnings.push(`Suspiciously short duration value: "${rec.duration}".`);
    }
    if (rec.estimatedCost && rec.estimatedCost.length < 2) {
      warnings.push(`Suspiciously short estimatedCost value: "${rec.estimatedCost}".`);
    }
    if (rec.travelTimeMinutes !== undefined && rec.travelTimeMinutes < 0) {
      errors.push(`Negative travelTimeMinutes: ${rec.travelTimeMinutes}.`);
    }

    const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'WARNING' : 'PASS';
    if (status === 'PASS') passCount++;
    if (status === 'WARNING') warnCount++;
    if (status === 'FAIL') failCount++;

    results.push({
      id: rec.id,
      title: rec.title || 'Untitled',
      status,
      errors,
      warnings
    });
  });

  console.log(`\nAUDIT SUMMARY:`);
  console.log(`Total Curated Recommendations: ${INITIAL_RECOMMENDATIONS.length}`);
  console.log(`✅ Passed perfectly:            ${passCount}`);
  console.log(`⚠️ Passed with warnings:        ${warnCount}`);
  console.log(`❌ Failed validation:           ${failCount}`);
  console.log('----------------------------------------------------');

  if (failCount > 0) {
    console.log('\n❌ FAILED CHECKS DETAILS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`\n[ID: ${r.id}] "${r.title}":`);
      r.errors.forEach(e => console.log(`  - ERROR: ${e}`));
    });
  }

  if (warnCount > 0) {
    console.log('\n⚠️ WARNING DETAILS:');
    results.filter(r => r.status === 'WARNING').forEach(r => {
      console.log(`\n[ID: ${r.id}] "${r.title}":`);
      r.warnings.forEach(w => console.log(`  - WARNING: ${w}`));
    });
  }

  console.log('====================================================');
  console.log('          VALIDATION PROCESS COMPLETED              ');
  console.log('====================================================');

  return {
    total: INITIAL_RECOMMENDATIONS.length,
    passed: passCount,
    warned: warnCount,
    failed: failCount,
    results
  };
}

// Self-execute if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('validateData.ts')) {
  runDataValidation();
}
