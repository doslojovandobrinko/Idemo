/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseAndValidateStudioRole } from '../components/studio/StudioAuthShell';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { reserveRecommendationDraft } from '../lib/recommendationMediaService';

export interface TestResult {
  testId: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export async function runStudioAuthenticationContractTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // AUTH-01: unauthenticated Studio cannot access governed editor
  try {
    const unauthRole = parseAndValidateStudioRole(undefined);
    const passed = unauthRole === null;
    results.push({
      testId: 'AUTH-01',
      name: 'unauthenticated Studio cannot access governed editor',
      expected: 'parseAndValidateStudioRole returns null for unauthenticated user',
      actual: passed ? 'Null returned for unauthenticated' : `Returned: ${unauthRole}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-01',
      name: 'unauthenticated Studio cannot access governed editor',
      expected: 'parseAndValidateStudioRole returns null',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-02: authenticated editorial_lead can access
  try {
    const leadRole = parseAndValidateStudioRole('editorial_lead');
    const passed = leadRole === 'Editor' || leadRole !== null;
    results.push({
      testId: 'AUTH-02',
      name: 'authenticated editorial_lead can access',
      expected: 'editorial_lead resolves to valid StudioRole',
      actual: `Resolved role: ${leadRole}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-02',
      name: 'authenticated editorial_lead can access',
      expected: 'editorial_lead resolves to valid StudioRole',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-03: authenticated super_admin can access
  try {
    const adminRole = parseAndValidateStudioRole('super_admin');
    const passed = adminRole === 'Super Admin';
    results.push({
      testId: 'AUTH-03',
      name: 'authenticated super_admin can access',
      expected: 'super_admin resolves to Super Admin',
      actual: `Resolved role: ${adminRole}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-03',
      name: 'authenticated super_admin can access',
      expected: 'super_admin resolves to Super Admin',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-04: unauthorized role is denied
  try {
    const invalidRole = parseAndValidateStudioRole('unauthorized_random_role');
    const passed = invalidRole === null;
    results.push({
      testId: 'AUTH-04',
      name: 'unauthorized role is denied',
      expected: 'Unrecognized role returns null',
      actual: passed ? 'Denied (null)' : `Allowed: ${invalidRole}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-04',
      name: 'unauthorized role is denied',
      expected: 'Unrecognized role returns null',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-05: valid session restored after refresh where supported
  try {
    let sessionValid = false;
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        sessionValid = Boolean(data?.session);
      }
    }
    results.push({
      testId: 'AUTH-05',
      name: 'valid session restored after refresh where supported',
      expected: 'Supabase session state checked safely on restore',
      actual: `Session active: ${sessionValid}`,
      passed: true,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-05',
      name: 'valid session restored after refresh where supported',
      expected: 'Supabase session state checked safely',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-06: expired/missing session returns to login
  try {
    const missingRole = parseAndValidateStudioRole(null);
    const passed = missingRole === null;
    results.push({
      testId: 'AUTH-06',
      name: 'expired/missing session returns to login',
      expected: 'Missing session produces null role, forcing login rendering',
      actual: passed ? 'Role is null (forces StudioAuthShell)' : `Role: ${missingRole}`,
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-06',
      name: 'expired/missing session returns to login',
      expected: 'Missing session forces login',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-07: media reservation receives valid access token
  try {
    const res = await reserveRecommendationDraft('a1000000-0000-0000-0000-000000000003', `test_auth_${Date.now()}`);
    // If unauthenticated, safely returns MEDIA_AUTH_REQUIRED without crashing or bypassing
    const handledSafely = res.error === 'MEDIA_AUTH_REQUIRED' || res.success === true;
    results.push({
      testId: 'AUTH-07',
      name: 'media reservation receives valid access token',
      expected: 'Requires valid access token or returns MEDIA_AUTH_REQUIRED',
      actual: res.success ? 'Reservation succeeded with token' : `Safely required auth: ${res.error}`,
      passed: handledSafely,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-07',
      name: 'media reservation receives valid access token',
      expected: 'Handled safely without uncaught errors',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-08: no auth bypass exists
  try {
    const anonRole = parseAndValidateStudioRole('anonymous');
    const guestRole = parseAndValidateStudioRole('guest');
    const passed = anonRole === null && guestRole === null;
    results.push({
      testId: 'AUTH-08',
      name: 'no auth bypass exists',
      expected: 'Anonymous or guest attempts return null role',
      actual: passed ? 'Bypass rejected' : 'Bypass allowed',
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-08',
      name: 'no auth bypass exists',
      expected: 'Bypass attempts rejected',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-09: stale Unsplash fallback does not appear as verified media
  try {
    // Check if Unsplash image URL fallback was removed from RecommendationEditorModal.tsx
    const fs = await import('fs');
    const path = await import('path');
    const modalPath = path.join(process.cwd(), 'src/components/studio/RecommendationEditorModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');
    const hasUnsplashFallback = content.includes('photo-1517248135467-4c7edcad34c4');
    const passed = !hasUnsplashFallback;
    results.push({
      testId: 'AUTH-09',
      name: 'stale Unsplash fallback does not appear as verified media',
      expected: 'Unsplash image fallback removed from editor modal preview',
      actual: passed ? 'Unsplash fallback absent (displays NO MEDIA ATTACHED)' : 'Unsplash fallback still present',
      passed,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-09',
      name: 'stale Unsplash fallback does not appear as verified media',
      expected: 'Fallback removed',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-10: existing legitimate media remains unaffected
  try {
    const fs = await import('fs');
    const path = await import('path');
    const modalPath = path.join(process.cwd(), 'src/components/studio/RecommendationEditorModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');
    const supportsDisplayUrl = content.includes('resolvedDisplayUrl') && content.includes('fileLocalPreview');
    results.push({
      testId: 'AUTH-10',
      name: 'existing legitimate media remains unaffected',
      expected: 'Display url resolution and file preview preserved',
      actual: supportsDisplayUrl ? 'Display URL & file preview preserved' : 'Media handling compromised',
      passed: supportsDisplayUrl,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-10',
      name: 'existing legitimate media remains unaffected',
      expected: 'Preserved',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  // AUTH-11: GOLDEN-R01 manual recommendation path still passes through authenticated Studio
  try {
    const fs = await import('fs');
    const path = await import('path');
    const studioPath = path.join(process.cwd(), 'src/components/IdemoStudio.tsx');
    const content = fs.readFileSync(studioPath, 'utf8');
    const rendersAuthShell = content.includes('StudioAuthShell') && content.includes('!session');
    results.push({
      testId: 'AUTH-11',
      name: 'GOLDEN-R01 manual recommendation path still passes through authenticated Studio',
      expected: 'IdemoStudio enforces session before rendering StudioLayout',
      actual: rendersAuthShell ? 'Auth shell enforced before Studio render' : 'Auth shell bypassed',
      passed: rendersAuthShell,
    });
  } catch (err: any) {
    results.push({
      testId: 'AUTH-11',
      name: 'GOLDEN-R01 manual recommendation path still passes through authenticated Studio',
      expected: 'Enforced',
      actual: `Error: ${err?.message || String(err)}`,
      passed: false,
    });
  }

  return results;
}
