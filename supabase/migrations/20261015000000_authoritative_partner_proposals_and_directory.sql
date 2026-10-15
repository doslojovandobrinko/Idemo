-- IDEMO AUTHORITATIVE PARTNER PROPOSALS & PUBLIC DIRECTORY REPAIR
-- Migration: 20261015000000_authoritative_partner_proposals_and_directory.sql
-- Description:
-- 1. Creates persistent proposal model with revision history, curator locking, and explicit type separation.
-- 2. Preserves profile approval vs assignment approval separation with strict validation checks.
-- 3. Protects curator decisions (rejections, suspensions, overrides) against Agent 007 refresh via curator_locked flags.
-- 4. Provides atomic curator decision RPCs with revision conflict checks.
-- 5. Implements public directory RPC exposing only directory-safe fields for verified and approved partners.

-- ============================================================================
-- 1. CREATE PROPOSAL TABLES & HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_type VARCHAR(50) NOT NULL CHECK (proposal_type IN ('ASSIGNMENT', 'NEW_RECOMMENDATION', 'PACKAGE')),
  partner_id VARCHAR(100) NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  recommendation_id VARCHAR(100) NULL, -- Required for ASSIGNMENT, NULL for NEW_RECOMMENDATION/PACKAGE
  proposed_rec_payload JSONB NULL, -- Details for new recommendation/package proposals
  rationale TEXT NOT NULL,
  origin VARCHAR(50) NOT NULL CHECK (origin IN ('PARTNER_SUBMISSION', 'AGENT_007', 'CURATOR_DIRECT')),
  review_state VARCHAR(50) NOT NULL DEFAULT 'pending_review' CHECK (review_state IN ('pending_review', 'under_review', 'curator_approved', 'curator_rejected', 'reconsideration_requested')),
  curator_decision JSONB NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  curator_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_proposals_partner ON public.partner_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_rec ON public.partner_proposals(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_state ON public.partner_proposals(review_state);

-- Proposal Revision History
CREATE TABLE IF NOT EXISTS public.proposal_revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.partner_proposals(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  previous_state VARCHAR(50) NOT NULL,
  new_state VARCHAR(50) NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload_snapshot JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposal_rev_history_proposal ON public.proposal_revision_history(proposal_id);

-- Enable RLS
ALTER TABLE public.partner_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_revision_history ENABLE ROW LEVEL SECURITY;

-- Service role policies
DROP POLICY IF EXISTS service_role_all_partner_proposals ON public.partner_proposals;
CREATE POLICY service_role_all_partner_proposals ON public.partner_proposals FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_proposal_rev_history ON public.proposal_revision_history;
CREATE POLICY service_role_all_proposal_rev_history ON public.proposal_revision_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated studio policies
DROP POLICY IF EXISTS studio_read_partner_proposals ON public.partner_proposals;
CREATE POLICY studio_read_partner_proposals ON public.partner_proposals FOR SELECT TO authenticated
  USING (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '') IN ('super_admin', 'admin', 'editorial_lead'));

-- ============================================================================
-- 2. EXTEND RECOMMENDATION PARTNER ELIGIBILITY (CURATOR LOCKING)
-- ============================================================================

ALTER TABLE public.recommendation_partner_eligibility
  ADD COLUMN IF NOT EXISTS curator_locked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS curator_override_state VARCHAR(50) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS curator_priority_rank INTEGER DEFAULT NULL;

-- ============================================================================
-- 3. CURATOR DECISION RPC WITH ATOMIC TRANSACTION & PREREQUISITE CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION public.curator_decide_proposal_secure(
  p_proposal_id UUID,
  p_decision VARCHAR(50),
  p_note TEXT DEFAULT NULL,
  p_expected_revision INTEGER DEFAULT 1,
  p_approved_image_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_role TEXT;
  v_caller_role TEXT;
  v_proposal public.partner_proposals%ROWTYPE;
  v_partner_profile_review VARCHAR(50);
  v_new_revision INTEGER;
  v_rec_id VARCHAR(100);
BEGIN
  v_auth_role := COALESCE(auth.role(), '');
  
  -- Verify Studio Authorization
  IF v_auth_role != 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'UNAUTHORIZED', 'message', 'Authentication required.');
    END IF;
    v_caller_role := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '');
    IF v_caller_role NOT IN ('super_admin', 'admin', 'editorial_lead') THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'FORBIDDEN', 'message', 'Curator authorization required.');
    END IF;
  END IF;

  -- Lock proposal row for update
  SELECT * INTO v_proposal
  FROM public.partner_proposals
  WHERE id = p_proposal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'NOT_FOUND', 'message', 'Proposal not found.');
  END IF;

  -- Revision / Optimistic Locking Check
  IF v_proposal.revision != p_expected_revision THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'CONCURRENCY_CONFLICT',
      'message', format('Proposal has been modified by another curator. Expected revision %s, current revision is %s.', p_expected_revision, v_proposal.revision)
    );
  END IF;

  -- Check Partner Profile Approval Prerequisite for ASSIGNMENT proposals
  IF v_proposal.proposal_type = 'ASSIGNMENT' AND LOWER(p_decision) = 'curator_approved' THEN
    SELECT review_status::text INTO v_partner_profile_review
    FROM public.partner_profile_content
    WHERE partner_id = v_proposal.partner_id;

    IF v_partner_profile_review IS NULL OR LOWER(v_partner_profile_review) != 'approved' THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'PREREQUISITE_PROFILE_NOT_APPROVED',
        'message', 'Partner profile/passport must be explicitly approved before approving recommendation assignment.'
      );
    END IF;
  END IF;

  v_new_revision := v_proposal.revision + 1;

  -- Update Proposal
  UPDATE public.partner_proposals
  SET review_state = LOWER(p_decision),
      curator_decision = jsonb_build_object(
        'decision', LOWER(p_decision),
        'decided_by', COALESCE(auth.uid()::text, 'service_role'),
        'decided_at', NOW(),
        'note', p_note,
        'approved_image_url', p_approved_image_url
      ),
      revision = v_new_revision,
      curator_locked = TRUE,
      updated_at = NOW()
  WHERE id = p_proposal_id;

  -- Insert Revision History
  INSERT INTO public.proposal_revision_history (
    proposal_id, revision, previous_state, new_state, changed_by, payload_snapshot
  ) VALUES (
    p_proposal_id,
    v_new_revision,
    v_proposal.review_state,
    LOWER(p_decision),
    COALESCE(auth.uid()::text, 'service_role'),
    to_jsonb(v_proposal)
  );

  -- If proposal is for an ASSIGNMENT, sync with recommendation_partner_eligibility
  IF v_proposal.proposal_type = 'ASSIGNMENT' AND v_proposal.recommendation_id IS NOT NULL THEN
    v_rec_id := v_proposal.recommendation_id;
    IF LOWER(p_decision) = 'curator_approved' THEN
      INSERT INTO public.recommendation_partner_eligibility (
        recommendation_id, partner_id, qualification_state, participation_state, passport_state, routing_state, curator_locked, curator_override_state, updated_at
      ) VALUES (
        v_rec_id, v_proposal.partner_id, 'idemo_selected', 'confirmed', 'verified', 'active', TRUE, 'curator_approved', NOW()
      )
      ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
        qualification_state = 'idemo_selected',
        routing_state = 'active',
        curator_locked = TRUE,
        curator_override_state = 'curator_approved',
        updated_at = NOW();
    ELSIF LOWER(p_decision) = 'curator_rejected' THEN
      INSERT INTO public.recommendation_partner_eligibility (
        recommendation_id, partner_id, qualification_state, participation_state, passport_state, routing_state, curator_locked, curator_override_state, updated_at
      ) VALUES (
        v_rec_id, v_proposal.partner_id, 'preliminary', 'declined', 'verified', 'inactive', TRUE, 'curator_rejected', NOW()
      )
      ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
        routing_state = 'inactive',
        curator_locked = TRUE,
        curator_override_state = 'curator_rejected',
        updated_at = NOW();
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'proposal_id', p_proposal_id,
    'new_state', LOWER(p_decision),
    'revision', v_new_revision,
    'message', format('Proposal successfully updated to %s.', LOWER(p_decision))
  );
END;
$$;

-- ============================================================================
-- 4. CURATOR RECONSIDERATION ACTION RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.curator_reconsider_assignment_secure(
  p_recommendation_id VARCHAR(100),
  p_partner_id VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.recommendation_partner_eligibility
  SET curator_locked = FALSE,
      curator_override_state = 'reconsideration_requested',
      updated_at = NOW()
  WHERE recommendation_id = p_recommendation_id AND partner_id = p_partner_id;

  UPDATE public.partner_proposals
  SET curator_locked = FALSE,
      review_state = 'reconsideration_requested',
      updated_at = NOW()
  WHERE partner_id = p_partner_id AND (recommendation_id = p_recommendation_id OR recommendation_id IS NULL);

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', format('Assignment between partner %s and recommendation %s is unlocked and queued for Agent 007 reconsideration.', p_partner_id, p_recommendation_id)
  );
END;
$$;

-- ============================================================================
-- 5. PUBLIC APPROVED PARTNER DIRECTORY RPC (DIRECTORY-SAFE FIELDS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fetch_public_approved_partner_directory_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_results JSONB;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'public_code', COALESCE(p.public_code, 'PARTNER'),
        'name', COALESCE(p.name, 'Partner'),
        'category', COALESCE(p.category, 'General'),
        'partner_type', COALESCE(ppc.partner_type, 'Individual'),
        'location', COALESCE(ppc.canonical_region, p.location, 'Serbia'),
        'description', COALESCE(ppc.intro_published, p.description, ''),
        'website', ppc.website,
        'languages', COALESCE(ppc.languages, '{}'::TEXT[]),
        'transport_capacity', COALESCE(ppc.transport_capacity, 'none'),
        'notice_window', COALESCE(ppc.notice_window, '24h'),
        'photo_url', ppc.published_photo_path,
        'published_contact_phone', ppc.published_contact_phone,
        'published_contact_email', ppc.published_contact_email,
        'review_status', ppc.review_status,
        'status', p.status,
        'active_assignments_count', (
          SELECT COUNT(*)
          FROM public.recommendation_partner_eligibility rpe
          WHERE rpe.partner_id = p.id AND rpe.routing_state = 'active'
        )
      )
      ORDER BY p.name ASC
    ),
    '[]'::jsonb
  ) INTO v_results
  FROM public.partners p
  JOIN public.partner_profile_content ppc ON ppc.partner_id = p.id
  WHERE LOWER(ppc.review_status::text) = 'approved'
    AND LOWER(p.status::text) = 'active'
    AND LOWER(p.id::text) NOT IN ('a0000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000000')
    AND LOWER(COALESCE(p.public_code, '')) != 'p-onboarding-template-000';

  RETURN jsonb_build_object(
    'success', TRUE,
    'partners', COALESCE(v_results, '[]'::jsonb)
  );
END;
$$;

-- Permissions
REVOKE ALL ON FUNCTION public.curator_decide_proposal_secure(UUID, VARCHAR, TEXT, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curator_decide_proposal_secure(UUID, VARCHAR, TEXT, INTEGER, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.curator_decide_proposal_secure(UUID, VARCHAR, TEXT, INTEGER, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.curator_reconsider_assignment_secure(VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curator_reconsider_assignment_secure(VARCHAR, VARCHAR) FROM anon;
GRANT EXECUTE ON FUNCTION public.curator_reconsider_assignment_secure(VARCHAR, VARCHAR) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.fetch_public_approved_partner_directory_secure() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_public_approved_partner_directory_secure() TO anon, authenticated, service_role;
