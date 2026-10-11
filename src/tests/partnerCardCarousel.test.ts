/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test suite for IDEMO Partner Card Carousel Engine:
 * 1. Verifies 14-slot schedule (7 days x 2 slots) integrity
 * 2. Validates twice-daily AM/PM slot calculation based on clock hour
 * 3. Confirms custom carousel modification, persistence, and reset
 */

import { 
  CANONICAL_PARTNER_CAROUSEL_SLIDES,
  getActiveSlotIndex,
  getPartnerCarouselSlides,
  savePartnerCarouselSlides,
  resetPartnerCarouselSlides,
  PartnerCarouselSlide
} from '../lib/partnerCarouselStorage';

export function runPartnerCarouselTests(): boolean {
  console.log('--- PARTNER CARD CAROUSEL TEST SUITE ---');

  // Test 1: Canonical 14-slot count and schema completeness
  console.log('[PCC-01] Checking canonical 14-slot structure...');
  if (CANONICAL_PARTNER_CAROUSEL_SLIDES.length !== 14) {
    console.error(`❌ FAIL: Expected 14 canonical slides, got ${CANONICAL_PARTNER_CAROUSEL_SLIDES.length}`);
    return false;
  }

  const amSlots = CANONICAL_PARTNER_CAROUSEL_SLIDES.filter(s => s.slotTime === 'AM');
  const pmSlots = CANONICAL_PARTNER_CAROUSEL_SLIDES.filter(s => s.slotTime === 'PM');
  if (amSlots.length !== 7 || pmSlots.length !== 7) {
    console.error(`❌ FAIL: Expected 7 AM and 7 PM slots, got ${amSlots.length} AM and ${pmSlots.length} PM`);
    return false;
  }
  console.log('✅ PASS: Exactly 7 AM and 7 PM slots present for each day of the week');

  // Test 2: Time resolution across hours
  console.log('[PCC-02] Verifying twice-daily AM/PM slot calculation...');
  // Monday 10:00 AM (Day index 1, hour 10 -> AM)
  const monMorning = new Date(2026, 9, 12, 10, 0, 0); // Monday Oct 12, 2026
  const monMorningIdx = getActiveSlotIndex(CANONICAL_PARTNER_CAROUSEL_SLIDES, monMorning);
  const monMorningSlide = CANONICAL_PARTNER_CAROUSEL_SLIDES[monMorningIdx];

  if (monMorningSlide.dayIndex !== 1 || monMorningSlide.slotTime !== 'AM') {
    console.error('❌ FAIL: Monday 10:00 AM did not resolve to Monday AM slot', monMorningSlide);
    return false;
  }

  // Monday 20:30 PM (Day index 1, hour 20 -> PM)
  const monEvening = new Date(2026, 9, 12, 20, 30, 0);
  const monEveningIdx = getActiveSlotIndex(CANONICAL_PARTNER_CAROUSEL_SLIDES, monEvening);
  const monEveningSlide = CANONICAL_PARTNER_CAROUSEL_SLIDES[monEveningIdx];

  if (monEveningSlide.dayIndex !== 1 || monEveningSlide.slotTime !== 'PM') {
    console.error('❌ FAIL: Monday 20:30 PM did not resolve to Monday PM slot', monEveningSlide);
    return false;
  }

  // Friday 19:00 PM (Day index 5, hour 19 -> PM)
  const friEvening = new Date(2026, 9, 16, 19, 0, 0); // Friday Oct 16, 2026
  const friEveningIdx = getActiveSlotIndex(CANONICAL_PARTNER_CAROUSEL_SLIDES, friEvening);
  const friEveningSlide = CANONICAL_PARTNER_CAROUSEL_SLIDES[friEveningIdx];

  if (friEveningSlide.dayIndex !== 5 || friEveningSlide.slotTime !== 'PM') {
    console.error('❌ FAIL: Friday 19:00 PM did not resolve to Friday PM slot', friEveningSlide);
    return false;
  }
  console.log('✅ PASS: Time-of-day clock accurately routes to appropriate daylight / evening slots');

  // Test 3: IDEMO Studio modification and reset lifecycle
  console.log('[PCC-03] Testing IDEMO Studio persistence and reset...');
  const initial = getPartnerCarouselSlides();
  const modified: PartnerCarouselSlide[] = initial.map(s => 
    s.id === 'mon-am' ? { ...s, titleEn: 'Uvac Canyon VIP Sunrise Flight' } : s
  );
  savePartnerCarouselSlides(modified);

  const reloaded = getPartnerCarouselSlides();
  const uvacMod = reloaded.find(s => s.id === 'mon-am');
  if (uvacMod?.titleEn !== 'Uvac Canyon VIP Sunrise Flight') {
    console.error('❌ FAIL: Modified slide title not persisted');
    return false;
  }

  resetPartnerCarouselSlides();
  const resetList = getPartnerCarouselSlides();
  const uvacReset = resetList.find(s => s.id === 'mon-am');
  if (uvacReset?.titleEn !== 'Uvac Canyon Meanders') {
    console.error('❌ FAIL: Reset did not restore canonical title');
    return false;
  }
  console.log('✅ PASS: Persistence and canonical reset verified successfully');

  console.log('--- ALL PARTNER CARD CAROUSEL TESTS PASSED ---');
  return true;
}

runPartnerCarouselTests();
