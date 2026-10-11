/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test suite for IDEMO Partner Portal Gateway & Generic Onboarding Invariants:
 * 1. Validates Gateway SHA-256 hash for passcode 1611
 * 2. Validates IDEMO + 1611 authentication and must_change_pin enforcement
 * 3. Validates passname length limit (<= 16 characters)
 * 4. Validates 4-digit PIN policy
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Test suite for IDEMO Partner Portal Gateway & Generic Onboarding Invariants:
 * 1. Validates Gateway SHA-256 hash for passcode 1611
 * 2. Validates IDEMO + 1611 authentication and must_change_pin enforcement
 * 3. Validates passname length limit (<= 16 characters)
 * 4. Validates 4-digit PIN policy
 * 5. Validates immortal template availability after onboarding
 */

import { loginPartner, changePartnerPin } from '../lib/partnerService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runGenericOnboardingRegressionTests(): Promise<boolean> {
  console.log('--- IDEMO GENERIC ONBOARDING REGRESSION SUITE ---');

  // Test 1: Gateway SHA-256 hash calculation
  console.log('[GOR-01] Validating Gateway passcode 1611 SHA-256 hash...');
  const msgUint8 = new TextEncoder().encode('1611');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const EXPECTED_HASH = '68722dedde84631c45b4aade9365a91aa6fd11c5766e66191ffbf07361204a4c';
  assert(hex === EXPECTED_HASH, `SHA-256 hash mismatch for 1611. Expected ${EXPECTED_HASH}, got ${hex}`);
  console.log('✅ PASS: Gateway SHA-256 hash exactly matches 1611 invariant.');

  // Test 2: Live login with IDEMO / 1611
  console.log('[GOR-02] Verifying login with generic IDEMO / 1611...');
  const res = await loginPartner('IDEMO', '1611');
  assert(res.success, `Login failed: ${res.error || res.message}`);
  assert(res.partner?.public_code === 'IDEMO', `Expected public_code IDEMO, got ${res.partner?.public_code}`);
  assert(res.partner?.must_change_pin === true, 'IDEMO generic partner must enforce must_change_pin = true');
  console.log('✅ PASS: IDEMO / 1611 logged in successfully with must_change_pin = true');

  // Test 3: Passname length limit (<= 16 characters)
  console.log('[GOR-03] Verifying passname length constraint...');
  const over16 = await changePartnerPin('1611', '8492', '8492', 'EXCEEDING_SIXTEEN_CHARS_REJECT');
  assert(!over16.success, 'Expected name > 16 characters to be rejected');
  assert(typeof over16.error === 'string' && over16.error.includes('16'), 'Expected error to mention 16 characters');
  console.log('✅ PASS: Passname validation rules enforced (<= 16 characters).');

  // Test 4: Sequential and trivial PINs
  console.log('[GOR-04] Verifying sequential, repeated, and reused PIN rejection...');
  const trivial = await changePartnerPin('1611', '1234', '1234', 'VALID_NAME');
  assert(!trivial.success, 'Sequential PIN 1234 must be rejected');
  const repeat = await changePartnerPin('1611', '7777', '7777', 'VALID_NAME');
  assert(!repeat.success, 'Repeated PIN 7777 must be rejected');
  const reuse = await changePartnerPin('1611', '1611', '1611', 'VALID_NAME');
  assert(!reuse.success, 'Reused PIN 1611 must be rejected');
  console.log('✅ PASS: Weak PIN rejection verified.');

  // Test 5: Immortal template test
  console.log('[GOR-05] Verifying immortal template preservation after onboarding...');
  const uniqueName = 'TEST_' + Math.floor(1000 + Math.random() * 9000);
  const uniquePin = '7392';
  const custom = await changePartnerPin('1611', uniquePin, uniquePin, uniqueName);
  assert(custom.success, `Failed to customize credentials: ${custom.error || custom.message}`);

  const indLogin = await loginPartner(uniqueName, uniquePin);
  assert(indLogin.success, `Failed to login to individual space: ${indLogin.error || indLogin.message}`);
  assert(indLogin.partner?.public_code === uniqueName, 'Individual space code mismatch');
  assert(indLogin.partner?.must_change_pin === false, 'Individual space must have must_change_pin = false');

  const templateCheck = await loginPartner('IDEMO', '1611');
  assert(templateCheck.success, 'IDEMO / 1611 template must remain available');
  assert(templateCheck.partner?.public_code === 'IDEMO', 'Template code must be IDEMO');
  assert(templateCheck.partner?.must_change_pin === true, 'Template must enforce must_change_pin = true');
  console.log('✅ PASS: Immortal template IDEMO / 1611 preserved.');

  console.log('--- ALL GENERIC ONBOARDING REGRESSION TESTS PASSED ---');
  return true;
}

runGenericOnboardingRegressionTests();


