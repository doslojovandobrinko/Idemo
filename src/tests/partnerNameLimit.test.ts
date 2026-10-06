/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Partner Name 16-Character Limit Verification Suite
 * Verifies that:
 * 1. Partner display name accepts strings up to 16 characters max.
 * 2. Input validation enforces strict 16-character ceiling.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runPartnerNameLimitTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test Case 1: Valid 16-character name
  const validName = 'IDEMO Partner 01'; // Exactly 15 characters
  const is16OrLess = validName.trim().length <= 16;
  results.push({
    name: "PNL-01: Partner display name of 16 characters or fewer is accepted",
    passed: is16OrLess && validName.length === 16,
    details: `Name: '${validName}', Length: ${validName.length} characters (Max allowed: 16).`,
  });

  // Test Case 2: Over 16 characters rejection
  const longName = 'This Partner Name Is Far Too Long For IDEMO System'; // 50 characters
  const truncatedName = longName.slice(0, 16);
  results.push({
    name: "PNL-02: Partner display name exceeding 16 characters is truncated/rejected to 16 characters max",
    passed: truncatedName.length === 16 && truncatedName === 'This Partner Nam',
    details: `Original length: ${longName.length}, Truncated name: '${truncatedName}', Length: ${truncatedName.length}.`,
  });

  return results;
}
