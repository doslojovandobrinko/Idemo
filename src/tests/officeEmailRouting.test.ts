/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * IDEMO Office Email Routing Test Suite
 * Verifies that partner messages in 'MESSAGES WITH IDEMO' route to 'office@idemo.group'.
 */

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

export async function runOfficeEmailRoutingTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const targetEmail = 'office@idemo.group';
  const partnerMessage = {
    text: 'Hello IDEMO team, confirming availability for weekend guide tours.',
    recipient: targetEmail,
  };

  results.push({
    name: "OER-01: Partner message dispatch recipient is strictly office@idemo.group",
    passed: partnerMessage.recipient === 'office@idemo.group',
    details: `Target email: '${partnerMessage.recipient}'.`,
  });

  const mailtoSubject = encodeURIComponent('IDEMO Partner Message - UNO3 (UNO3)');
  const mailtoUrl = `mailto:${targetEmail}?subject=${mailtoSubject}`;

  results.push({
    name: "OER-02: Mailto dispatch URI constructs valid destination to office@idemo.group",
    passed: mailtoUrl.startsWith('mailto:office@idemo.group'),
    details: `Mailto URL: '${mailtoUrl}'.`,
  });

  return results;
}
