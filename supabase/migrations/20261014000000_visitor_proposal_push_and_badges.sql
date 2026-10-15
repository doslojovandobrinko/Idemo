-- ============================================================================
-- IDEMO PHASE 5 EXTENSION: VISITOR PROPOSAL PUSH NOTIFICATIONS & BADGE COUNTS
-- Migration: 20261014000000_visitor_proposal_push_and_badges.sql
-- Description:
--   1. Adds server-side read persistence (visitor_read_at) on public.partner_responses.
--   2. Adds verified visitor push recipient binding (visitor_external_id) on public.inquiries.
--   3. Adds unique idempotency index on public.notification_outbox(idempotency_key).
--   4. Provides authoritative PostgreSQL unread proposal counting, read-marking,
--      and push identity binding/unbinding RPCs using validate_and_get_inquiry.
--   5. Updates get_visitor_active_proposal and on_notification_trigger to enqueue
--      visitor push notifications with minimal navigation identifiers.
-- ============================================================================

-- 1. Server-side proposal read-status persistence on partner_responses
ALTER TABLE public.partner_responses
  ADD COLUMN IF NOT EXISTS visitor_read_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Verified visitor push recipient identity (OneSignal external_id) on inquiries
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS visitor_external_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_visitor_external_id
  ON public.inquiries(visitor_external_id)
  WHERE visitor_external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_responses_unread_submitted
  ON public.partner_responses(match_id, status)
  WHERE visitor_read_at IS NULL;

-- 3. Unique index on notification_outbox(idempotency_key) to prevent duplicate enqueues
CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_outbox_idempotency_key
  ON public.notification_outbox(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 4. Authoritative Database Unread Partner Proposal Count
CREATE OR REPLACE FUNCTION public.get_visitor_unread_proposal_count(
    p_visitor_external_id TEXT DEFAULT NULL,
    p_inquiry_id UUID DEFAULT NULL,
    p_verified_inquiry_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS INT AS $$
DECLARE
    v_clean_external_id TEXT;
    v_unread_count INT := 0;
BEGIN
    v_clean_external_id := NULLIF( pg_catalog.btrim(COALESCE(p_visitor_external_id, '')), '' );

    IF v_clean_external_id IS NULL
       AND p_inquiry_id IS NULL
       AND COALESCE(pg_catalog.array_length(p_verified_inquiry_ids, 1), 0) = 0 THEN
        RETURN 0;
    END IF;

    SELECT COUNT(DISTINCT i.id)::INT
    INTO v_unread_count
    FROM public.inquiries i
    JOIN public.inquiry_matches m
      ON m.inquiry_id = i.id
     AND m.status = 'responded'::public.match_status
    WHERE i.status = 'awaiting_visitor'::public.inquiry_status
      AND (
          (v_clean_external_id IS NOT NULL AND i.visitor_external_id = v_clean_external_id)
          OR (p_inquiry_id IS NOT NULL AND i.id = p_inquiry_id)
          OR (COALESCE(pg_catalog.array_length(p_verified_inquiry_ids, 1), 0) > 0 AND i.id = ANY(p_verified_inquiry_ids))
      )
      AND EXISTS (
          SELECT 1
          FROM (
              SELECT pr.visitor_read_at
              FROM public.partner_responses pr
              WHERE pr.match_id = m.id
                AND pr.status = 'submitted'::public.partner_response_status
                AND pr.response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
              ORDER BY pr.created_at DESC, pr.id DESC
              LIMIT 1
          ) latest_pr
          WHERE latest_pr.visitor_read_at IS NULL
      );

    RETURN COALESCE(v_unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 5. Mark Visitor Proposal Read & Return Authoritative Database Unread Count
CREATE OR REPLACE FUNCTION public.mark_visitor_proposal_read(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_response_id UUID DEFAULT NULL,
    p_sibling_inquiries JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_id UUID;
    v_target_response_id UUID;
    v_read_at TIMESTAMP WITH TIME ZONE;
    v_verified_ids UUID[] := ARRAY[]::UUID[];
    v_item JSONB;
    v_sib_id UUID;
    v_sib_token TEXT;
    v_sib_hash VARCHAR(64);
    v_unread_count INT := 0;
BEGIN
    -- 1. Validate caller identity and lock inquiry
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);
    v_verified_ids := pg_catalog.array_append(v_verified_ids, p_inquiry_id);

    -- 2. Verify any additional sibling inquiries belonging to the same visitor installation
    IF p_sibling_inquiries IS NOT NULL AND pg_catalog.jsonb_typeof(p_sibling_inquiries) = 'array' THEN
        FOR v_item IN SELECT * FROM pg_catalog.jsonb_array_elements(p_sibling_inquiries)
        LOOP
            BEGIN
                v_sib_id := (v_item->>'inquiry_id')::UUID;
                v_sib_token := NULLIF(pg_catalog.btrim(COALESCE(v_item->>'visitor_token', '')), '');
                IF v_sib_id IS NOT NULL AND v_sib_token IS NOT NULL THEN
                    v_sib_hash := pg_catalog.encode(pg_catalog.sha256(v_sib_token::bytea), 'hex');
                    IF EXISTS (
                        SELECT 1
                        FROM public.inquiries si
                        WHERE si.id = v_sib_id
                          AND si.recovery_token_hash = v_sib_hash
                          AND si.recovery_token_expires_at >= pg_catalog.now()
                          AND si.recovery_token_revoked_at IS NULL
                    ) THEN
                        v_verified_ids := pg_catalog.array_append(v_verified_ids, v_sib_id);
                    END IF;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;
    END IF;

    -- 3. Locate active responded match and submitted partner response
    SELECT id INTO v_match_id
    FROM public.inquiry_matches
    WHERE inquiry_id = p_inquiry_id
      AND status = 'responded'::public.match_status
    LIMIT 1;

    IF v_match_id IS NULL THEN
        RAISE EXCEPTION 'Proposal details not found or already resolved';
    END IF;

    SELECT pr.id
    INTO v_target_response_id
    FROM public.partner_responses pr
    WHERE pr.match_id = v_match_id
      AND pr.status = 'submitted'::public.partner_response_status
      AND pr.response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
      AND (p_response_id IS NULL OR pr.id = p_response_id)
    ORDER BY pr.created_at DESC, pr.id DESC
    LIMIT 1;

    IF v_target_response_id IS NULL THEN
        RAISE EXCEPTION 'Proposal details not found or already resolved';
    END IF;

    -- 4. Persist read status in PostgreSQL (restricted to target response ID, preserving timestamp on repeat calls)
    UPDATE public.partner_responses
    SET visitor_read_at = COALESCE(visitor_read_at, pg_catalog.now())
    WHERE id = v_target_response_id
      AND match_id = v_match_id
      AND status = 'submitted'::public.partner_response_status
      AND response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
    RETURNING visitor_read_at INTO v_read_at;

    -- 5. Compute remaining unread proposals from PostgreSQL source of truth
    v_unread_count := public.get_visitor_unread_proposal_count(
        v_inquiry.visitor_external_id,
        p_inquiry_id,
        v_verified_ids
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'status', 'marked_read',
        'inquiry_id', p_inquiry_id,
        'match_id', v_match_id,
        'response_id', v_target_response_id,
        'visitor_read_at', v_read_at,
        'unread_count', v_unread_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 6. Bind Verified Visitor Push Identity (Requires valid visitor token per inquiry)
CREATE OR REPLACE FUNCTION public.bind_visitor_push_identity(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_visitor_external_id TEXT,
    p_sibling_inquiries JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_clean_external_id TEXT;
    v_verified_ids UUID[] := ARRAY[]::UUID[];
    v_item JSONB;
    v_sib_id UUID;
    v_sib_token TEXT;
    v_bound_count INT := 0;
    v_unread_count INT := 0;
BEGIN
    v_clean_external_id := NULLIF(pg_catalog.btrim(COALESCE(p_visitor_external_id, '')), '');
    IF v_clean_external_id IS NULL OR pg_catalog.length(v_clean_external_id) > 128 THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Verify primary inquiry credential
    PERFORM public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    UPDATE public.inquiries
    SET visitor_external_id = v_clean_external_id
    WHERE id = p_inquiry_id;

    v_verified_ids := pg_catalog.array_append(v_verified_ids, p_inquiry_id);
    v_bound_count := 1;

    -- Verify and bind any additional sibling inquiries owned by this visitor
    IF p_sibling_inquiries IS NOT NULL AND pg_catalog.jsonb_typeof(p_sibling_inquiries) = 'array' THEN
        FOR v_item IN SELECT * FROM pg_catalog.jsonb_array_elements(p_sibling_inquiries)
        LOOP
            BEGIN
                v_sib_id := (v_item->>'inquiry_id')::UUID;
                v_sib_token := NULLIF(pg_catalog.btrim(COALESCE(v_item->>'visitor_token', '')), '');
                IF v_sib_id IS NOT NULL AND v_sib_id != p_inquiry_id AND v_sib_token IS NOT NULL THEN
                    PERFORM public.validate_and_get_inquiry(v_sib_id, v_sib_token);
                    UPDATE public.inquiries
                    SET visitor_external_id = v_clean_external_id
                    WHERE id = v_sib_id;
                    v_verified_ids := pg_catalog.array_append(v_verified_ids, v_sib_id);
                    v_bound_count := v_bound_count + 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;
    END IF;

    v_unread_count := public.get_visitor_unread_proposal_count(
        v_clean_external_id,
        p_inquiry_id,
        v_verified_ids
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'status', 'bound',
        'visitor_external_id', v_clean_external_id,
        'bound_inquiries_count', v_bound_count,
        'unread_count', v_unread_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 7. Unbind Visitor Push Identity on Logout / Account Switch
CREATE OR REPLACE FUNCTION public.unbind_visitor_push_identity(
    p_inquiry_id UUID,
    p_raw_token TEXT,
    p_sibling_inquiries JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_sib_id UUID;
    v_sib_token TEXT;
    v_unbound_count INT := 0;
BEGIN
    PERFORM public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    UPDATE public.inquiries
    SET visitor_external_id = NULL
    WHERE id = p_inquiry_id;

    v_unbound_count := 1;

    IF p_sibling_inquiries IS NOT NULL AND pg_catalog.jsonb_typeof(p_sibling_inquiries) = 'array' THEN
        FOR v_item IN SELECT * FROM pg_catalog.jsonb_array_elements(p_sibling_inquiries)
        LOOP
            BEGIN
                v_sib_id := (v_item->>'inquiry_id')::UUID;
                v_sib_token := NULLIF(pg_catalog.btrim(COALESCE(v_item->>'visitor_token', '')), '');
                IF v_sib_id IS NOT NULL AND v_sib_id != p_inquiry_id AND v_sib_token IS NOT NULL THEN
                    PERFORM public.validate_and_get_inquiry(v_sib_id, v_sib_token);
                    UPDATE public.inquiries
                    SET visitor_external_id = NULL
                    WHERE id = v_sib_id;
                    v_unbound_count := v_unbound_count + 1;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'status', 'unbound',
        'unbound_inquiries_count', v_unbound_count,
        'unread_count', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 8. Backend Dispatch Context RPC for OneSignal Push & Badge Calculation
CREATE OR REPLACE FUNCTION public.get_visitor_push_dispatch_context(
    p_inquiry_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry RECORD;
    v_match_id UUID;
    v_response_id UUID;
    v_unread_count INT := 0;
BEGIN
    SELECT id, status, public_reference_code, visitor_external_id
    INTO v_inquiry
    FROM public.inquiries
    WHERE id = p_inquiry_id;

    IF v_inquiry.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'found', false,
            'error', 'INQUIRY_NOT_FOUND'
        );
    END IF;

    SELECT m.id, pr.id
    INTO v_match_id, v_response_id
    FROM public.inquiry_matches m
    JOIN public.partner_responses pr
      ON pr.match_id = m.id
     AND pr.status = 'submitted'::public.partner_response_status
     AND pr.response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
    WHERE m.inquiry_id = p_inquiry_id
      AND m.status = 'responded'::public.match_status
    ORDER BY pr.created_at DESC, pr.id DESC
    LIMIT 1;

    v_unread_count := public.get_visitor_unread_proposal_count(
        v_inquiry.visitor_external_id,
        p_inquiry_id,
        ARRAY[p_inquiry_id]
    );

    RETURN pg_catalog.jsonb_build_object(
        'found', true,
        'inquiry_id', v_inquiry.id,
        'inquiry_status', v_inquiry.status,
        'match_id', v_match_id,
        'response_id', v_response_id,
        'visitor_external_id', v_inquiry.visitor_external_id,
        'unread_count', v_unread_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 9. Update get_visitor_active_proposal to expose visitor_read_at and unread_count
CREATE OR REPLACE FUNCTION public.get_visitor_active_proposal(
    p_inquiry_id UUID,
    p_raw_token TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry public.inquiries;
    v_match_rec RECORD;
    v_response_rec RECORD;
    v_has_countered BOOLEAN := false;
    v_unread_count INT := 0;
    v_result JSONB;
BEGIN
    v_inquiry := public.validate_and_get_inquiry(p_inquiry_id, p_raw_token);

    v_unread_count := public.get_visitor_unread_proposal_count(
        v_inquiry.visitor_external_id,
        p_inquiry_id,
        ARRAY[p_inquiry_id]
    );

    SELECT id, status INTO v_match_rec
    FROM public.inquiry_matches
    WHERE inquiry_id = p_inquiry_id AND status = 'responded'::public.match_status
    LIMIT 1;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'proposal_found', false,
            'unread_count', v_unread_count,
            'message', 'No active proposal found'
        );
    END IF;

    SELECT id, response_type, message, proposed_start_at, proposed_end_at, created_at, visitor_read_at
    INTO v_response_rec
    FROM public.partner_responses
    WHERE match_id = v_match_rec.id
      AND status = 'submitted'::public.partner_response_status
      AND response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF v_response_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'proposal_found', false,
            'unread_count', v_unread_count,
            'message', 'Proposal details not found or already resolved'
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.partner_responses
        WHERE match_id = v_match_rec.id AND response_type = 'counter_by_visitor'::public.response_type
    ) INTO v_has_countered;

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'proposal_found', true,
        'match_id', v_match_rec.id,
        'response_id', v_response_rec.id,
        'response_type', v_response_rec.response_type,
        'message', v_response_rec.message,
        'proposed_start_at', v_response_rec.proposed_start_at,
        'proposed_end_at', v_response_rec.proposed_end_at,
        'created_at', v_response_rec.created_at,
        'visitor_read_at', v_response_rec.visitor_read_at,
        'unread_count', v_unread_count,
        'has_countered', v_has_countered
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 10. Update on_notification_trigger() to enqueue idempotent visitor email & push notifications
CREATE OR REPLACE FUNCTION public.on_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_contact_pref VARCHAR(100);
    v_ref_code VARCHAR(12);
    v_match_id UUID;
    v_response_id UUID;
    v_idempotency_key VARCHAR(100);
BEGIN
    -- 1. Notify Partner on New Offer
    IF TG_TABLE_NAME = 'inquiry_matches' THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'offered'::public.match_status) OR
           (TG_OP = 'UPDATE' AND OLD.status != 'offered'::public.match_status AND NEW.status = 'offered'::public.match_status) THEN
            
            SELECT contact_preference INTO v_contact_pref FROM public.partners WHERE id = NEW.partner_id;
            SELECT public_reference_code INTO v_ref_code FROM public.inquiries WHERE id = NEW.inquiry_id;
            
            INSERT INTO public.notification_outbox (
                recipient_type,
                recipient_id,
                channel,
                payload,
                idempotency_key
            ) VALUES (
                'partner',
                NEW.partner_id,
                COALESCE(LOWER(v_contact_pref), 'email'),
                pg_catalog.jsonb_build_object(
                    'title', 'New Opportunity Offered',
                    'body', 'You have received a new opportunity (' || COALESCE(v_ref_code, '') || '). Please review and respond before expiration.',
                    'match_id', NEW.id,
                    'inquiry_id', NEW.inquiry_id,
                    'public_reference_code', v_ref_code,
                    'expires_at', NEW.expires_at
                ),
                'partner_offer_' || NEW.id::text
            ) ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
        END IF;
    END IF;

    -- 2. Notify on Inquiry Status changes
    IF TG_TABLE_NAME = 'inquiries' THEN
        IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            -- Concierge fallback
            IF NEW.status = 'needs_assistance'::public.inquiry_status THEN
                INSERT INTO public.notification_outbox (
                    recipient_type,
                    recipient_id,
                    channel,
                    payload,
                    idempotency_key
                ) VALUES (
                    'concierge',
                    NEW.id,
                    'email',
                    pg_catalog.jsonb_build_object(
                        'title', 'Concierge Intervention Required',
                        'body', 'Inquiry ' || NEW.public_reference_code || ' has been escalated to concierge assistance.',
                        'inquiry_id', NEW.id,
                        'public_reference_code', NEW.public_reference_code
                    ),
                    'concierge_esc_' || NEW.id::text
                ) ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

            -- Partner proposal saved -> Notify Visitor via Email & Push alongside
            ELSIF NEW.status = 'awaiting_visitor'::public.inquiry_status THEN
                SELECT m.id, pr.id
                INTO v_match_id, v_response_id
                FROM public.inquiry_matches m
                JOIN public.partner_responses pr
                  ON pr.match_id = m.id
                 AND pr.status = 'submitted'::public.partner_response_status
                 AND pr.response_type IN ('accept_as_requested'::public.response_type, 'propose_alternative'::public.response_type)
                WHERE m.inquiry_id = NEW.id
                  AND m.status = 'responded'::public.match_status
                ORDER BY pr.created_at DESC, pr.id DESC
                LIMIT 1;

                -- 1. Preserve existing visitor email notification channel
                INSERT INTO public.notification_outbox (
                    recipient_type,
                    recipient_id,
                    channel,
                    payload,
                    idempotency_key
                ) VALUES (
                    'visitor',
                    NEW.id,
                    'email',
                    pg_catalog.jsonb_build_object(
                        'title', 'Partner Response Received',
                        'body', 'A partner has responded to your inquiry ' || NEW.public_reference_code || '. Please review and proceed.',
                        'inquiry_id', NEW.id,
                        'public_reference_code', NEW.public_reference_code
                    ),
                    'visitor_proposal_email_' || COALESCE(v_response_id::text, v_match_id::text, NEW.id::text)
                ) ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;

                -- 2. Add visitor push notification alongside email with distinct idempotency key
                v_idempotency_key := 'visitor_proposal_push_' || COALESCE(v_response_id::text, v_match_id::text, NEW.id::text);

                INSERT INTO public.notification_outbox (
                    recipient_type,
                    recipient_id,
                    channel,
                    payload,
                    idempotency_key
                ) VALUES (
                    'visitor',
                    NEW.id,
                    'push',
                    pg_catalog.jsonb_build_object(
                        'title', 'IDEMO',
                        'body', 'You have a new partner proposal ready to review.',
                        'inquiry_id', NEW.id,
                        'match_id', v_match_id,
                        'response_id', v_response_id,
                        'action', 'review_proposal'
                    ),
                    v_idempotency_key
                ) ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- 11. Defense-in-depth privilege revocations & grants
REVOKE EXECUTE ON FUNCTION public.get_visitor_unread_proposal_count(TEXT, UUID, UUID[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_unread_proposal_count(TEXT, UUID, UUID[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_visitor_proposal_read(UUID, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_visitor_proposal_read(UUID, TEXT, UUID, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.bind_visitor_push_identity(UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bind_visitor_push_identity(UUID, TEXT, TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.unbind_visitor_push_identity(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unbind_visitor_push_identity(UUID, TEXT, JSONB) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_visitor_push_dispatch_context(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_push_dispatch_context(UUID) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_active_proposal(UUID, TEXT) TO service_role;
