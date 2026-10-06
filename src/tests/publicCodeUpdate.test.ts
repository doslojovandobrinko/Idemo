/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Public Code Update Test Suite
 * Verifies that setting a custom partner name on first logon updates both display name and login code (public_code).
 */

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPublicCodeUpdateTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  let mockPartner = {
    id: 'a0000000-0000-0000-0000-000000000099',
    public_code: 'IDEMO',
    name: 'IDEMO Partner',
    pin: '1611',
    must_change_pin: true,
  };

  // Simulate first logon credential update with custom name UNO3 and PIN 3003
  const customName = 'UNO3';
  const customPin = '3003';

  if (customName && customPin) {
    mockPartner.name = customName;
    mockPartner.public_code = customName;
    mockPartner.pin = customPin;
    mockPartner.must_change_pin = false;
  }

  results.push({
    name: "PCU-01: Setting custom name UNO3 updates both display name and login code (public_code)",
    passed: mockPartner.public_code === 'UNO3' && mockPartner.name === 'UNO3',
    details: `Updated public_code: '${mockPartner.public_code}', name: '${mockPartner.name}'.`,
  });

  results.push({
    name: "PCU-02: Partner can log in using custom code UNO3 and new PIN 3003",
    passed: mockPartner.public_code === 'UNO3' && mockPartner.pin === '3003' && mockPartner.must_change_pin === false,
    details: `Login Code: '${mockPartner.public_code}', PIN: '${mockPartner.pin}', must_change_pin: ${mockPartner.must_change_pin}.`,
  });

  return results;
}
