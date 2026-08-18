import { INITIAL_RECOMMENDATIONS } from '../src/data/recommendations/serbia';
import fs from 'fs';
import path from 'path';

// Get all 135 canonical recommendations
const canonical = INITIAL_RECOMMENDATIONS.filter(r => r.publicationStatus === 'CANONICAL');

console.log(`Processing ${canonical.length} canonical recommendations...`);
