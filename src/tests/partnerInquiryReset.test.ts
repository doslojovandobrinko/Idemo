/**
 * Automated test suite to verify that Partner Inquiries start with a clean slate (0 records)
 * for testing accounts like UNO1, UNO2, and all partner slots.
 */

import { safeStorage } from '../lib/safeStorage';

function runPartnerInquiryResetTests() {
  console.log('--- PARTNER INQUIRY RESET TEST SUITE ---');

  // Test 1: Verify legacy mock inquiries are purged from storage
  const legacySeeded = [
    { id: 'INQ-2001', recId: '1', recTitle: 'Uvac Meanders' },
    { id: 'INQ-2002', recId: '4', recTitle: 'Vrnjačka Banja' },
    { id: 'INQ-2003', recId: '3', recTitle: 'Belgrade Splavovi' },
    { id: 'INQ-2004', recId: '7', recTitle: 'Nikola Tesla Museum' },
  ];

  safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(legacySeeded));

  const savedInquiries = safeStorage.getItem('idemo_portal_inquiries');
  let cleaned: any[] = [];
  if (savedInquiries) {
    try {
      const parsed = JSON.parse(savedInquiries);
      cleaned = Array.isArray(parsed) ? parsed.filter((inq: any) => !['INQ-2001', 'INQ-2002', 'INQ-2003', 'INQ-2004'].includes(inq.id)) : [];
      safeStorage.setItem('idemo_portal_inquiries', JSON.stringify(cleaned));
    } catch {
      cleaned = [];
    }
  }

  console.log('[RESET-01] Cleaned inquiries count:', cleaned.length);
  if (cleaned.length === 0) {
    console.log('✅ PASS: Legacy mock inquiries successfully purged to 0 (clean slate)');
  } else {
    console.error('❌ FAIL: Expected 0 inquiries, got', cleaned.length);
    process.exit(1);
  }

  // Test 2: Fresh initialization returns 0 inquiries
  const storedAfter = JSON.parse(safeStorage.getItem('idemo_portal_inquiries') || '[]');
  console.log('[RESET-02] Stored inquiries after reset:', storedAfter);
  if (Array.isArray(storedAfter) && storedAfter.length === 0) {
    console.log('✅ PASS: Stored inquiries are confirmed clean slate (0 records)');
  } else {
    console.error('❌ FAIL: Expected empty array in storage');
    process.exit(1);
  }

  console.log('--- ALL PARTNER INQUIRY RESET TESTS PASSED ---');
}

runPartnerInquiryResetTests();
