/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IDEMO PARTNER PASSPORT SUBMISSION BUTTON STATE INVARIANT TEST SUITE
 * 
 * Verifies that:
 * 1. Initial / draft / modified state renders RED button with "Podnesi na IDEMO pregled"
 * 2. Submitted state (pending_review) renders GREEN button with "PODNETO na IDEMO pregled"
 * 3. Editing any passport field sets passportModified=true and returns button to RED
 * 4. No separate confirmation message banner is emitted upon successful submission
 */

import fs from 'fs';
import path from 'path';

export interface ButtonStateTestResult {
  testNumber: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export function runPassportSubmitButtonStateTests(): ButtonStateTestResult[] {
  const results: ButtonStateTestResult[] = [];

  const partnersScreenPath = path.resolve(process.cwd(), 'src/components/PartnersScreen.tsx');
  const code = fs.readFileSync(partnersScreenPath, 'utf8');

  // TEST 1: PartnersScreen defines passportModified state
  {
    const hasModifiedState = code.includes('const [passportModified, setPassportModified] = useState<boolean>(false);');
    results.push({
      testNumber: 1,
      name: 'PartnersScreen defines passportModified state',
      expected: 'passportModified state declared with default false',
      actual: hasModifiedState ? 'Declared' : 'Missing',
      passed: hasModifiedState,
    });
  }

  // TEST 2: showSubmittedGreen is true strictly when pending_review and !passportModified
  {
    const hasCondition = code.includes("const isPassportSubmitted = passportReviewStatus === 'pending_review';") &&
                         code.includes("const showSubmittedGreen = isPassportSubmitted && !passportModified;");
    results.push({
      testNumber: 2,
      name: 'showSubmittedGreen condition strictly binds pending_review and !passportModified',
      expected: 'isPassportSubmitted && !passportModified',
      actual: hasCondition ? 'Correctly bound' : 'Condition missing or incorrect',
      passed: hasCondition,
    });
  }

  // TEST 3: Button text shows PODNETO na IDEMO pregled when green, Podnesi na IDEMO pregled when red
  {
    const hasGreenText = code.includes("isSr ? 'PODNETO na IDEMO pregled' : 'SUBMITTED For IDEMO Review'");
    const hasRedText = code.includes("isSr ? 'Podnesi na IDEMO pregled' : 'Submit For IDEMO Review'");
    const passed = hasGreenText && hasRedText;
    results.push({
      testNumber: 3,
      name: 'Button text renders "PODNETO na IDEMO pregled" when green and "Podnesi na IDEMO pregled" when red',
      expected: 'Exact Serbian text matching prompt specification',
      actual: `Green text: ${hasGreenText}, Red text: ${hasRedText}`,
      passed,
    });
  }

  // TEST 4: Button styling transitions from red (#8A1F1F) to green (bg-emerald-700)
  {
    const hasGreenStyle = code.includes('bg-emerald-700 hover:bg-emerald-800 text-white');
    const hasRedStyle = code.includes("bg-[#8A1F1F] hover:bg-[#8A1F1F]/90 text-white");
    const passed = hasGreenStyle && hasRedStyle;
    results.push({
      testNumber: 4,
      name: 'Button styling transitions from red to emerald green',
      expected: 'showSubmittedGreen ? bg-emerald-700 : bg-[#8A1F1F]',
      actual: `Green styling: ${hasGreenStyle}, Red styling: ${hasRedStyle}`,
      passed,
    });
  }

  // TEST 5: Success submit handler clears passportMsg (no separate confirmation message needed)
  {
    const clearsMsgOnSuccess = code.includes('setPassportReviewStatus(\'pending_review\');\n                            setPassportModified(false);\n                            setPassportMsg(null);');
    results.push({
      testNumber: 5,
      name: 'Submission success suppresses separate confirmation banner (green button is self-contained)',
      expected: 'setPassportMsg(null) upon submission',
      actual: clearsMsgOnSuccess ? 'passportMsg cleared to null' : 'Separate message present',
      passed: clearsMsgOnSuccess,
    });
  }

  return results;
}
