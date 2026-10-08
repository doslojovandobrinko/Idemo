/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PACKAGE COLLAGE & CURATOR PHOTO APPROVAL TEST SUITE
 * Verifies:
 * 1. Attaching single image for Option A (Recommendation)
 * 2. Attaching up to 5 images for Option B (Package) and Agent 007 collage compilation
 * 3. Principle 40 compliance: Curator retains sole final authority to approve or override imagery
 * 4. Published recommendation inherits the exact Curator-approved image
 */

import { 
  savePartnerRecommendationProposal, 
  curatorApproveProposal,
  getPartnerRecommendationProposals,
  PartnerRecommendationProposal 
} from '../lib/partnerProposalService';
import { compilePackageCollage } from '../lib/collageCompiler';
import { safeStorage } from '../lib/safeStorage';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export async function runPackageCollageMediaTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const record = (name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ name, passed, expected, actual });
  };

  const TEST_PARTNER_ID = 'test-partner-uno-collage';
  const TEST_PARTNER_CODE = 'UNO77';
  const TEST_PARTNER_NAME = 'UNO77 — Vojvodina Heritage Expeditions';

  // Seed portal partners list for co-assignment verification
  safeStorage.setItem('idemo_portal_partners', JSON.stringify([
    {
      id: TEST_PARTNER_ID,
      pin: TEST_PARTNER_CODE,
      name: TEST_PARTNER_NAME,
      assignedRecs: []
    }
  ]));

  // --- TEST 1: Option A with single high quality photo ---
  const propA = savePartnerRecommendationProposal({
    partnerId: TEST_PARTNER_ID,
    partnerCode: TEST_PARTNER_CODE,
    partnerName: TEST_PARTNER_NAME,
    partnerEmail: 'vojvodina@idemo.internal',
    proposalType: 'RECOMMENDATION',
    title: 'Kovačica Naive Art Gallery & Studio',
    category: 'History',
    location: 'Kovačica, South Banat, Serbia',
    proposalReason: 'EXPERTISE',
    description: 'Renowned Slovak naive art center with master oil paintings on canvas depicting rural Banat folklore.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200',
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1200']
  });

  record(
    'Photo-A-01: Option A retains single photo and sets imageUrl',
    propA.imageUrl?.includes('photo-1579783900882') === true &&
      Array.isArray(propA.images) &&
      propA.images.length === 1,
    'imageUrl populated and images array length 1',
    `imageUrl: ${propA.imageUrl}, images: ${propA.images?.length}`
  );

  // --- TEST 2: Option B with 5 high quality package photos and Agent 007 collage ---
  const MOCK_5_IMAGES = [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800', // Stop 1
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800', // Stop 2
    'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=800', // Stop 3
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&q=80&w=800', // Stop 4
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'  // Stop 5
  ];

  // Test collage compiler function with 5 images
  const compiledCollage = await compilePackageCollage(MOCK_5_IMAGES);

  record(
    'Collage-Compiler-01: compilePackageCollage returns valid image representation',
    typeof compiledCollage === 'string' && compiledCollage.length > 0,
    'Valid non-empty image string',
    `Type: ${typeof compiledCollage}, length: ${compiledCollage.length}`
  );

  const propB = savePartnerRecommendationProposal({
    partnerId: TEST_PARTNER_ID,
    partnerCode: TEST_PARTNER_CODE,
    partnerName: TEST_PARTNER_NAME,
    partnerEmail: 'vojvodina@idemo.internal',
    proposalType: 'PACKAGE',
    title: 'Fruška Gora Monastic & Wine Trail Package',
    category: 'Travel',
    location: 'Belgrade → Sremski Karlovci → Krušedol → Grgeteg',
    proposalReason: 'EXPERTISE',
    description: 'Bespoke multi-stop day package visiting 16th-century frescoes, Bermet wine cellars, and honey tasting.',
    durationBucket: 'FULL-DAY',
    routeStops: ['Krušedol Monastery', 'Grgeteg Apiary', 'Sremski Karlovci Cellar', 'Bermet Tasting', 'Danube Sunset'],
    includedServices: ['Licensed Guide', 'Private Transit', 'Wine Tasting', 'Monastery Entry'],
    images: MOCK_5_IMAGES,
    collageImageUrl: compiledCollage
  });

  record(
    'Photo-B-01: Option B stores all 5 candidate images and collageImageUrl',
    propB.proposalType === 'PACKAGE' &&
      Array.isArray(propB.images) &&
      propB.images.length === 5 &&
      Boolean(propB.collageImageUrl),
    '5 images stored and collageImageUrl set',
    `images: ${propB.images?.length}, hasCollage: ${Boolean(propB.collageImageUrl)}`
  );

  record(
    'Photo-B-02: Agent 007 evaluation mentions 5 verified package photos for Curator review',
    Boolean(
      propB.agent007Evaluation?.regionalImpact?.includes('5 high-resolution package photos') ||
      propB.agent007Evaluation?.curatorRecommendation?.includes('5 package photos')
    ),
    'Mentions 5 photos and collage in evaluation',
    `Evaluation recommendation: ${propB.agent007Evaluation?.curatorRecommendation}`
  );

  // --- TEST 3: Principle 40 - Curator has Final Say and can approve either Collage or Source Photo ---
  // Scenario 1: Curator approves the compiled collage
  const approveWithCollage = curatorApproveProposal(propB.id, propB.collageImageUrl);

  record(
    'Curator-Media-Authority-01: Curator can explicitly approve the compiled collage',
    approveWithCollage.success === true &&
      approveWithCollage.recommendation?.imageUrl === propB.collageImageUrl,
    'Published imageUrl equals approved collageImageUrl',
    `Published imageUrl: ${approveWithCollage.recommendation?.imageUrl?.slice(0, 40)}...`
  );

  // Scenario 2: Curator chooses to approve a specific individual photo instead of collage
  const propB2 = savePartnerRecommendationProposal({
    partnerId: TEST_PARTNER_ID,
    partnerCode: TEST_PARTNER_CODE,
    partnerName: TEST_PARTNER_NAME,
    partnerEmail: 'vojvodina@idemo.internal',
    proposalType: 'PACKAGE',
    title: 'Tara & Drina River Canyon Explorer Package',
    category: 'Nature',
    location: 'Bajina Bašta → Tara National Park → Drina River',
    proposalReason: 'UNDERREPRESENTED_SERBIA',
    description: 'High-altitude canyon trails and scenic river boat excursion.',
    durationBucket: 'FULL-DAY',
    images: MOCK_5_IMAGES,
    collageImageUrl: compiledCollage
  });

  const curatorSelectedPhoto = MOCK_5_IMAGES[2]; // Curator picks photo #3
  const approveWithPhotoOverride = curatorApproveProposal(propB2.id, curatorSelectedPhoto);

  record(
    'Curator-Media-Authority-02: Curator can override and approve specific candidate photo',
    approveWithPhotoOverride.success === true &&
      approveWithPhotoOverride.recommendation?.imageUrl === curatorSelectedPhoto,
    'Published imageUrl equals Curator selected photo #3',
    `Published imageUrl: ${approveWithPhotoOverride.recommendation?.imageUrl}`
  );

  record(
    'Curator-Media-Authority-03: Recommendation curatorNotes records Curator final image authority',
    Boolean(approveWithPhotoOverride.recommendation?.curatorNotes?.includes('Curator with final image authority')),
    'Notes record Curator final image authority',
    `curatorNotes: ${approveWithPhotoOverride.recommendation?.curatorNotes}`
  );

  return results;
}

if (import.meta.url.endsWith('packageCollageMedia.test.ts')) {
  console.log('--- RUNNING PACKAGE COLLAGE & MEDIA AUTHORITY TESTS ---');
  runPackageCollageMediaTests().then((results) => {
    let passed = 0;
    for (const r of results) {
      const icon = r.passed ? '✓ PASS' : '✗ FAIL';
      if (r.passed) passed++;
      console.log(`[${icon}] ${r.name}`);
      if (!r.passed) {
        console.log(`       Expected: ${r.expected}`);
        console.log(`       Actual:   ${r.actual}`);
      }
    }
    console.log(`\nSUMMARY: ${passed} / ${results.length} PASSED`);
  });
}
