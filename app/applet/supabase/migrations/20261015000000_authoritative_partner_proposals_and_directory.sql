-- IDEMO AUTHORITATIVE PARTNER PROPOSALS & PUBLIC DIRECTORY REPAIR
-- Migration: 20261015000000_authoritative_partner_proposals_and_directory.sql
-- Description:
-- 1. Persistent proposal model with revision history, curator locking, and explicit reconsideration.
-- 2. Atomic assignment approval updating recommendation_partner_eligibility and proposal state.
-- 3. Idempotent request replay handling for curator decisions.
-- 4. Atomic execution locking for Agent 007 daily runs.
-- 5. Secure public approved partner directory RPC based on published profile content.

BEGIN;

--------------------------------------------------------------------------------
-- 1. PERSISTENT PROPOSAL MODEL & AUDIT LOG
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.partner_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    recommendation_id TEXT NULL,
    proposed_title TEXT NULL,
    proposal_type TEXT NOT NULL CHECK (proposal_type IN ('ASSIGNMENT', 'NEW_RECOMMENDATION', 'PACKAGE')),
    origin TEXT NOT NULL CHECK (origin IN ('PARTNER_SUBMISSION', 'AGENT_007', 'CURATOR_DIRECT')),
    review_state TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (review_state IN ('PENDING_REVIEW', 'CURATOR_APPROVED', 'CURATOR_REJECTED', 'CURATOR_SUSPENDED', 'SUPERSEDED')),
    curator_decision TEXT NULL CHECK (curator_decision IN ('APPROVED', 'REJECTED', 'SUSPENDED', 'NEEDS_REVISION')),
    curator_id UUID NULL,
    curator_notes TEXT NULL,
    curator_decided_at TIMESTAMPTZ NULL,
    is_curator_locked BOOLEAN NOT NULL DEFAULT FALSE,
    eligible_for_agent_reconsideration BOOLEAN NOT NULL DEFAULT TRUE,
    rationale TEXT NOT NULL DEFAULT '',
    match_score NUMERIC(5,2) DEFAULT 0.00,
    manual_priority INT DEFAULT 0,
    revision INT NOT NULL DEFAULT 1,
    idempotency_key TEXT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_proposals_partner_id ON public.partner_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_rec_id ON public.partner_proposals(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_state ON public.partner_proposals(review_state);
CREATE INDEX IF NOT EXISTS idx_partner_proposals_locked ON public.partner_proposals(is_curator_locked, eligible_for_agent_reconsideration);

CREATE TABLE IF NOT EXISTS public.partner_proposal_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES public.partner_proposals(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,
    previous_state TEXT NULL,
    new_state TEXT NOT NULL,
    action_by UUID NULL,
    reason TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposal_revisions_prop_id ON public.partner_proposal_revisions(proposal_id);

--------------------------------------------------------------------------------
-- 2. AGENT 007 EXECUTION LOCKING TABLE
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.agent_007_execution_locks (
    lock_name TEXT PRIMARY KEY DEFAULT 'daily_agent_refresh',
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

--------------------------------------------------------------------------------
-- 3. RLS POLICIES FOR PROPOSALS
--------------------------------------------------------------------------------

ALTER TABLE public.partner_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_proposal_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_007_execution_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access disabled for proposals" ON public.partner_proposals;
CREATE POLICY "Public read access disabled for proposals" ON public.partner_proposals
    FOR SELECT TO public USING (false);

DROP POLICY IF EXISTS "Curator and Admin full access on proposals" ON public.partner_proposals;
CREATE POLICY "Curator and Admin full access on proposals" ON public.partner_proposals
    FOR ALL TO authenticated
    USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '') IN ('super_admin', 'editorial_lead', 'admin', 'idemo_admin')
        OR COALESCE(auth.role(), '') = 'service_role'
    );

--------------------------------------------------------------------------------
-- 4. SECURE RPC: CURATOR DECIDE PROPOSAL (ATOMIC ASSIGNMENT + IDEMPOTENCY)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.curator_decide_proposal_secure(
    p_proposal_id UUID,
    p_decision TEXT,
    p_curator_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_expected_revision INT DEFAULT 1,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_proposal public.partner_proposals%ROWTYPE;
    v_existing_by_key public.partner_proposals%ROWTYPE;
    v_profile_status TEXT;
    v_new_review_state TEXT;
    v_new_revision INT;
    v_res JSONB;
BEGIN
    -- 1. Authorization Check
    v_caller_role := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '');
    IF NOT (
        v_caller_role IN ('super_admin', 'editorial_lead', 'admin', 'idemo_admin') 
        OR COALESCE(auth.role(), '') = 'service_role'
    ) THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Only authorized curators or admins can decide proposals.' USING ERRCODE = '42501';
    END IF;

    -- 2. Idempotency & Request Replay Check
    IF p_idempotency_key IS NOT NULL AND TRIM(p_idempotency_key) != '' THEN
        SELECT * INTO v_existing_by_key 
        FROM public.partner_proposals 
        WHERE idempotency_key = TRIM(p_idempotency_key);

        IF FOUND THEN
            -- Check if exact replay
            IF v_existing_by_key.id = p_proposal_id AND v_existing_by_key.curator_decision = p_decision THEN
                SELECT to_jsonb(p) INTO v_res FROM public.partner_proposals p WHERE id = v_existing_by_key.id;
                RETURN jsonb_build_object(
                    'success', TRUE,
                    'is_replay', TRUE,
                    'proposal', v_res
                );
            ELSE
                RAISE EXCEPTION 'ERR_IDEMPOTENCY_KEY_REUSED: Idempotency key "%" was already used for a different decision.', p_idempotency_key USING ERRCODE = '23505';
            END IF;
        END IF;
    END IF;

    -- 3. Retrieve Target Proposal
    SELECT * INTO v_proposal FROM public.partner_proposals WHERE id = p_proposal_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % does not exist.', p_proposal_id USING ERRCODE = 'P0002';
    END IF;

    -- 4. Check Optimistic Revision Conflict
    IF v_proposal.revision != p_expected_revision THEN
        RAISE EXCEPTION 'ERR_REVISION_MISMATCH: Expected revision % but found %.', p_expected_revision, v_proposal.revision USING ERRCODE = 'P0001';
    END IF;

    -- 5. Validate Decision Parameter
    IF p_decision NOT IN ('APPROVED', 'REJECTED', 'SUSPENDED', 'NEEDS_REVISION') THEN
        RAISE EXCEPTION 'ERR_INVALID_DECISION: Invalid decision %.', p_decision USING ERRCODE = '22023';
    END IF;

    -- 6. Enforce Profile Approval Prerequisite for Assignment Proposals
    IF p_decision = 'APPROVED' AND v_proposal.proposal_type = 'ASSIGNMENT' THEN
        SELECT review_status::TEXT INTO v_profile_status 
        FROM public.partner_profile_content 
        WHERE partner_id = v_proposal.partner_id LIMIT 1;

        IF COALESCE(v_profile_status, 'draft') != 'approved' THEN
            RAISE EXCEPTION 'ERR_PROFILE_NOT_APPROVED: Cannot approve assignment proposal. Partner profile review_status is "%", must be "approved".', COALESCE(v_profile_status, 'none') USING ERRCODE = '22000';
        END IF;
    END IF;

    -- 7. Map Decision to Review State
    v_new_review_state := CASE p_decision
        WHEN 'APPROVED' THEN 'CURATOR_APPROVED'
        WHEN 'REJECTED' THEN 'CURATOR_REJECTED'
        WHEN 'SUSPENDED' THEN 'CURATOR_SUSPENDED'
        ELSE 'PENDING_REVIEW'
    END;

    v_new_revision := v_proposal.revision + 1;

    -- 8. Atomic Routing Effect on recommendation_partner_eligibility
    IF v_proposal.proposal_type = 'ASSIGNMENT' AND v_proposal.recommendation_id IS NOT NULL THEN
        IF p_decision = 'APPROVED' THEN
            INSERT INTO public.recommendation_partner_eligibility (
                recommendation_id, partner_id, qualification_state, routing_state, participation_state
            ) VALUES (
                v_proposal.recommendation_id, v_proposal.partner_id::text, 'idemo_selected'::public.qualification_state, 'active'::public.routing_pool_state, 'introduction_ready'::public.participation_state
            ) ON CONFLICT (recommendation_id, partner_id) DO UPDATE SET
                qualification_state = 'idemo_selected'::public.qualification_state,
                routing_state = 'active'::public.routing_pool_state,
                participation_state = CASE 
                    WHEN public.recommendation_partner_eligibility.participation_state = 'declined' THEN 'introduction_ready'::public.participation_state 
                    ELSE public.recommendation_partner_eligibility.participation_state 
                END,
                updated_at = NOW();
        ELSIF p_decision = 'SUSPENDED' THEN
            UPDATE public.recommendation_partner_eligibility
            SET routing_state = 'suspended'::public.routing_pool_state,
                updated_at = NOW()
            WHERE recommendation_id = v_proposal.recommendation_id AND partner_id = v_proposal.partner_id::text;
        ELSIF p_decision = 'REJECTED' THEN
            UPDATE public.recommendation_partner_eligibility
            SET routing_state = 'inactive'::public.routing_pool_state,
                qualification_state = 'preliminary'::public.qualification_state,
                updated_at = NOW()
            WHERE recommendation_id = v_proposal.recommendation_id AND partner_id = v_proposal.partner_id::text;
        END IF;
    END IF;

    -- 9. Update Proposal Record State and Curator Lock
    UPDATE public.partner_proposals
    SET review_state = v_new_review_state,
        curator_decision = p_decision,
        curator_id = COALESCE(p_curator_id, auth.uid()),
        curator_notes = p_notes,
        curator_decided_at = now(),
        is_curator_locked = TRUE,
        eligible_for_agent_reconsideration = FALSE,
        revision = v_new_revision,
        idempotency_key = COALESCE(p_idempotency_key, idempotency_key),
        updated_at = now()
    WHERE id = p_proposal_id;

    -- 10. Log Revision History
    INSERT INTO public.partner_proposal_revisions (
        proposal_id, revision_number, previous_state, new_state, action_by, reason, snapshot
    ) VALUES (
        p_proposal_id, v_new_revision, v_proposal.review_state, v_new_review_state, COALESCE(p_curator_id, auth.uid()), COALESCE(p_notes, 'Curator decision: ' || p_decision), to_jsonb(v_proposal)
    );

    SELECT to_jsonb(p) INTO v_res FROM public.partner_proposals p WHERE id = p_proposal_id;
    RETURN jsonb_build_object(
        'success', TRUE,
        'is_replay', FALSE,
        'proposal', v_res
    );
END;
$$;

--------------------------------------------------------------------------------
-- 5. SECURE RPC: CURATOR RECONSIDER ASSIGNMENT
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.curator_reconsider_assignment_secure(
    p_proposal_id UUID,
    p_curator_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_expected_revision INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_proposal public.partner_proposals%ROWTYPE;
    v_new_revision INT;
    v_res JSONB;
BEGIN
    v_caller_role := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '');
    IF NOT (
        v_caller_role IN ('super_admin', 'editorial_lead', 'admin', 'idemo_admin') 
        OR COALESCE(auth.role(), '') = 'service_role'
    ) THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Only authorized curators or admins can reconsider proposals.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_proposal FROM public.partner_proposals WHERE id = p_proposal_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR_PROPOSAL_NOT_FOUND: Proposal % does not exist.', p_proposal_id USING ERRCODE = 'P0002';
    END IF;

    IF v_proposal.revision != p_expected_revision THEN
        RAISE EXCEPTION 'ERR_REVISION_MISMATCH: Expected revision % but found %.', p_expected_revision, v_proposal.revision USING ERRCODE = 'P0001';
    END IF;

    v_new_revision := v_proposal.revision + 1;

    -- Reset curator lock and mark eligible for agent reconsideration
    UPDATE public.partner_proposals
    SET review_state = 'PENDING_REVIEW',
        curator_decision = NULL,
        curator_id = COALESCE(p_curator_id, auth.uid()),
        curator_notes = p_notes,
        is_curator_locked = FALSE,
        eligible_for_agent_reconsideration = TRUE,
        revision = v_new_revision,
        updated_at = now()
    WHERE id = p_proposal_id;

    -- Audit trail
    INSERT INTO public.partner_proposal_revisions (
        proposal_id, revision_number, previous_state, new_state, action_by, reason, snapshot
    ) VALUES (
        p_proposal_id, v_new_revision, v_proposal.review_state, 'PENDING_REVIEW', COALESCE(p_curator_id, auth.uid()), COALESCE(p_notes, 'Curator requested explicit reconsideration'), to_jsonb(v_proposal)
    );

    SELECT to_jsonb(p) INTO v_res FROM public.partner_proposals p WHERE id = p_proposal_id;
    RETURN jsonb_build_object(
        'success', TRUE,
        'proposal', v_res
    );
END;
$$;

--------------------------------------------------------------------------------
-- 6. SECURE RPC: PUBLIC APPROVED PARTNER DIRECTORY QUERY
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fetch_public_approved_partner_directory_secure()
RETURNS TABLE (
    id UUID,
    name TEXT,
    company_name TEXT,
    partner_type TEXT,
    description TEXT,
    city TEXT,
    languages TEXT[],
    website TEXT,
    logo_url TEXT,
    verification_status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        COALESCE(p.name, 'IDEMO Partner') AS name,
        COALESCE(ppc.pib, '') AS company_name,
        COALESCE(ppc.partner_type, 'Individual') AS partner_type,
        COALESCE(ppc.intro_published, '') AS description,
        COALESCE(ppc.canonical_region, 'Belgrade') AS city,
        COALESCE(ppc.languages, ARRAY['English', 'Serbian']) AS languages,
        COALESCE(ppc.website, '') AS website,
        COALESCE(ppc.published_photo_path, '') AS logo_url,
        CASE WHEN ppc.review_status = 'approved'::public.partner_profile_review_status THEN 'VERIFIED' ELSE 'UNVERIFIED' END AS verification_status,
        p.created_at
    FROM public.partners p
    JOIN public.partner_profile_content ppc ON ppc.partner_id = p.id
    WHERE ppc.review_status = 'approved'::public.partner_profile_review_status
      AND p.status = 'active'::public.partner_status
      AND p.id != 'a0000000-0000-0000-0000-000000000099'::uuid -- Exclude Onboarding Template
    ORDER BY p.created_at DESC;
END;
$$;

--------------------------------------------------------------------------------
-- 7. ATOMIC AGENT EXECUTION LOCK ACQUISITION & ASSERTION
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.agent_007_acquire_execution_lock_secure(
    p_worker_id TEXT,
    p_lock_duration_seconds INT DEFAULT 300
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_acquired BOOLEAN := FALSE;
BEGIN
    v_caller_role := COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role', '');
    IF NOT (
        v_caller_role IN ('super_admin', 'editorial_lead', 'admin') 
        OR COALESCE(auth.role(), '') = 'service_role'
    ) THEN
        RAISE EXCEPTION 'ERR_UNAUTHORIZED: Agent execution locking restricted to server worker or admin.' USING ERRCODE = '42501';
    END IF;

    -- Atomic Insert / Update ON CONFLICT
    INSERT INTO public.agent_007_execution_locks (lock_name, locked_by, locked_at, expires_at)
    VALUES ('daily_agent_refresh', p_worker_id, now(), now() + (p_lock_duration_seconds || ' seconds')::INTERVAL)
    ON CONFLICT (lock_name) DO UPDATE
    SET locked_by = p_worker_id,
        locked_at = now(),
        expires_at = now() + (p_lock_duration_seconds || ' seconds')::INTERVAL
    WHERE agent_007_execution_locks.expires_at <= now() 
       OR agent_007_execution_locks.locked_by = p_worker_id;

    IF FOUND THEN
        v_acquired := TRUE;
    END IF;

    RETURN v_acquired;
END;
$$;

CREATE OR REPLACE FUNCTION public.agent_007_assert_execution_lock_secure(
    p_worker_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_active BOOLEAN;
BEGIN
    SELECT (locked_by = p_worker_id AND expires_at > now()) INTO v_active
    FROM public.agent_007_execution_locks
    WHERE lock_name = 'daily_agent_refresh';

    IF NOT COALESCE(v_active, FALSE) THEN
        RAISE EXCEPTION 'ERR_LOCK_EXPIRED_OR_LOST: Worker "%" no longer holds the active execution lock.', p_worker_id USING ERRCODE = '55000';
    END IF;

    RETURN TRUE;
END;
$$;

--------------------------------------------------------------------------------
-- 8. GRANTS & PERMISSIONS
--------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.curator_decide_proposal_secure(UUID, TEXT, UUID, TEXT, INT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.curator_reconsider_assignment_secure(UUID, UUID, TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.agent_007_acquire_execution_lock_secure(TEXT, INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.agent_007_assert_execution_lock_secure(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.curator_decide_proposal_secure(UUID, TEXT, UUID, TEXT, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.curator_reconsider_assignment_secure(UUID, UUID, TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agent_007_acquire_execution_lock_secure(TEXT, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.agent_007_assert_execution_lock_secure(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fetch_public_approved_partner_directory_secure() TO anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- 9. REAL ELIGIBILITY BACKFILL (NO FABRICATED DUMMY DATA)
--------------------------------------------------------------------------------

INSERT INTO public.partner_proposals (
    partner_id,
    recommendation_id,
    proposal_type,
    origin,
    review_state,
    curator_decision,
    is_curator_locked,
    eligible_for_agent_reconsideration,
    rationale,
    revision
)
SELECT 
    rpe.partner_id::uuid AS partner_id,
    rpe.recommendation_id AS recommendation_id,
    'ASSIGNMENT' AS proposal_type,
    'CURATOR_DIRECT' AS origin,
    CASE 
        WHEN rpe.routing_state = 'active'::public.routing_pool_state THEN 'CURATOR_APPROVED'
        WHEN rpe.routing_state = 'suspended'::public.routing_pool_state THEN 'CURATOR_SUSPENDED'
        ELSE 'PENDING_REVIEW'
    END AS review_state,
    CASE 
        WHEN rpe.routing_state = 'active'::public.routing_pool_state THEN 'APPROVED'
        WHEN rpe.routing_state = 'suspended'::public.routing_pool_state THEN 'SUSPENDED'
        ELSE NULL
    END AS curator_decision,
    CASE WHEN rpe.routing_state IN ('active'::public.routing_pool_state, 'suspended'::public.routing_pool_state) THEN TRUE ELSE FALSE END AS is_curator_locked,
    CASE WHEN rpe.routing_state IN ('active'::public.routing_pool_state, 'suspended'::public.routing_pool_state) THEN FALSE ELSE TRUE END AS eligible_for_agent_reconsideration,
    'Backfilled from existing recommendation_partner_eligibility record' AS rationale,
    1 AS revision
FROM public.recommendation_partner_eligibility rpe
JOIN public.partners p ON p.id::text = rpe.partner_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.partner_proposals prop 
    WHERE prop.partner_id = rpe.partner_id::uuid AND prop.recommendation_id = rpe.recommendation_id
)
ON CONFLICT DO NOTHING;

--------------------------------------------------------------------------------
-- 10. DISABLED SCHEDULER CONFIGURATION (COMMENTED OUT FOR REVIEW)
--------------------------------------------------------------------------------

-- To enable daily automatic execution in Europe/Belgrade timezone:
-- SELECT cron.schedule(
--   'idemo-agent-007-daily-refresh',
--   '0 3 * * *', -- 03:00 AM Europe/Belgrade
--   $$SELECT net.http_post(
--       url:='https://<project-ref>.supabase.co/functions/v1/agent_007_refresh',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
--   );$$
-- );

COMMIT;
