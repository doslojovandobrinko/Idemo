-- IDEMO Work Package CLT-001C Contract Test Verification
-- Test file: supabase/tests/20260810070000_clt_001_minimal_governance_correction_tests.sql

BEGIN;

-- 1. Create test partner and initial records
INSERT INTO public.partners (id, public_code, pin_hash, name, status, contact_phone, contact_email)
VALUES (
  'e1111111-1111-4111-8111-111111111111',
  'TEST-PTR-01',
  'hash',
  'Test Partner Corp',
  'active',
  '064111111',
  'old_unapproved@partner.com'
) ON CONFLICT (id) DO NOTHING;

-- Test Case A: Saving draft contact details does NOT alter published contact details
SELECT public.save_partner_profile_draft_with_authorization_secure(
  'e1111111-1111-4111-8111-111111111111'::UUID,
  'Draft introduction text'::TEXT,
  NULL::TEXT,
  NULL::TEXT,
  FALSE::BOOLEAN,
  '+381 64 9998887'::TEXT,
  'governed_draft@partner.com'::TEXT
);

-- Assert draft fields updated, published fields remain NULL
DO $$
DECLARE
  v_rec public.partner_profile_content%ROWTYPE;
BEGIN
  SELECT * INTO v_rec FROM public.partner_profile_content WHERE partner_id = 'e1111111-1111-4111-8111-111111111111';
  ASSERT v_rec.draft_contact_phone = '+381 64 9998887', 'Draft phone failed to save';
  ASSERT v_rec.draft_contact_email = 'governed_draft@partner.com', 'Draft email failed to save';
  ASSERT v_rec.published_contact_phone IS NULL, 'Published phone leaked without approval!';
  ASSERT v_rec.published_contact_email IS NULL, 'Published email leaked without approval!';
  ASSERT v_rec.review_status = 'draft', 'Review status should be draft';
END;
$$;

-- Test Case B: Approving profile publishes draft contact details
SELECT public.review_partner_profile_secure(
  'e1111111-1111-4111-8111-111111111111'::UUID,
  'a2222222-2222-4222-8222-222222222222'::UUID,
  'approve'::TEXT,
  'Approved by IDEMO test suite'::TEXT
);

-- Assert published contact details now reflect approved draft details
DO $$
DECLARE
  v_rec public.partner_profile_content%ROWTYPE;
BEGIN
  SELECT * INTO v_rec FROM public.partner_profile_content WHERE partner_id = 'e1111111-1111-4111-8111-111111111111';
  ASSERT v_rec.published_contact_phone = '+381 64 9998887', 'Published phone failed to copy on approval';
  ASSERT v_rec.published_contact_email = 'governed_draft@partner.com', 'Published email failed to copy on approval';
  ASSERT v_rec.review_status = 'approved', 'Review status should be approved';
END;
$$;

-- Test Case C: update_partner_professional_contact_secure saves to draft without changing published
SELECT public.update_partner_professional_contact_secure(
  'e1111111-1111-4111-8111-111111111111'::UUID,
  '+381 65 7776655'::TEXT,
  'new_draft@partner.com'::TEXT
);

DO $$
DECLARE
  v_rec public.partner_profile_content%ROWTYPE;
BEGIN
  SELECT * INTO v_rec FROM public.partner_profile_content WHERE partner_id = 'e1111111-1111-4111-8111-111111111111';
  ASSERT v_rec.draft_contact_phone = '+381 65 7776655', 'Draft phone failed to update via contact RPC';
  ASSERT v_rec.draft_contact_email = 'new_draft@partner.com', 'Draft email failed to update via contact RPC';
  -- Published contact fields remain at previously approved state until re-approved!
  ASSERT v_rec.published_contact_phone = '+381 64 9998887', 'Published phone should remain at approved state!';
  ASSERT v_rec.published_contact_email = 'governed_draft@partner.com', 'Published email should remain at approved state!';
END;
$$;

ROLLBACK;
