-- IDEMO PARTNER ROUTING ENGINE - QUEUE ADVANCEMENT FIX
-- Ensures that when a primary partner (e.g. UNO1) declines an opportunity,
-- the system automatically advances the candidate queue to the next priority partner (e.g. UNO2).

CREATE OR REPLACE FUNCTION public.decline_partner_opportunity_secure(
    p_partner_id UUID,
    p_match_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_must_change BOOLEAN;
BEGIN
    SELECT must_change_pin INTO v_must_change FROM public.partners WHERE id = p_partner_id;
    IF v_must_change IS TRUE THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'code', 'PIN_CHANGE_REQUIRED',
            'message', 'You must replace your temporary PIN before continuing.'
        );
    END IF;

    SELECT m.id, m.status, m.expires_at, m.inquiry_id 
    INTO v_match_rec
    FROM public.inquiry_matches m
    WHERE m.id = p_match_id AND m.partner_id = p_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity not found or access denied.');
    END IF;

    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity is not in editable state.');
    END IF;

    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = p_match_id;

    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_match_rec.inquiry_id AND partner_id = p_partner_id;

    -- Automatically advance candidate queue to next priority partner (e.g. UNO2)
    PERFORM public.advance_inquiry_queue(v_match_rec.inquiry_id);

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'declined'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.decline_opportunity(p_match_id UUID, p_message TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_partner_id UUID;
    v_partner_status public.partner_status;
    v_match_rec RECORD;
    v_inquiry_status public.inquiry_status;
    v_message_clean TEXT;
    v_result JSONB;
BEGIN
    -- 1. Authentication and caller partner resolution
    v_partner_id := public.get_current_partner_id();
    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Partner profile not found or unauthorized';
    END IF;

    -- 2. Partner status verification
    SELECT status INTO v_partner_status FROM public.partners WHERE id = v_partner_id;
    IF v_partner_status IS NULL OR v_partner_status != 'active'::public.partner_status THEN
        RAISE EXCEPTION 'Partner is not in active status';
    END IF;

    -- 3. Match retrieval, ownership verification and locking
    SELECT id, status, expires_at, inquiry_id INTO v_match_rec
    FROM public.inquiry_matches
    WHERE id = p_match_id AND partner_id = v_partner_id
    FOR UPDATE;

    IF v_match_rec.id IS NULL THEN
        RAISE EXCEPTION 'Opportunity not found or access denied';
    END IF;

    -- 4. Expiration check
    IF v_match_rec.expires_at < pg_catalog.now() THEN
        RAISE EXCEPTION 'Opportunity has expired';
    END IF;

    -- 5. Match status validation (must be offered or viewed)
    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RAISE EXCEPTION 'Illegal state transition from %', v_match_rec.status;
    END IF;

    -- 6. Associated inquiry retrieval and lock
    SELECT status INTO v_inquiry_status
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    -- 7. Inquiry status validation
    IF v_inquiry_status != 'matching'::public.inquiry_status THEN
        RAISE EXCEPTION 'Inquiry is not in matching phase';
    END IF;

    -- 8. Clean decline message if provided
    v_message_clean := trim(p_message);
    IF v_message_clean = '' THEN
        v_message_clean := NULL;
    END IF;

    -- 9. Update match status to 'declined'
    UPDATE public.inquiry_matches
    SET status = 'declined'::public.match_status
    WHERE id = p_match_id;

    -- 10. Update candidate status in public.inquiry_candidates to 'skipped'
    UPDATE public.inquiry_candidates
    SET candidate_status = 'skipped'::public.candidate_status
    WHERE inquiry_id = v_match_rec.inquiry_id AND partner_id = v_partner_id;

    -- 11. Automatically advance candidate queue to next priority partner (e.g. UNO2)
    PERFORM public.advance_inquiry_queue(v_match_rec.inquiry_id);

    -- 12. Strict immutable audit log write
    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_partner_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        auth.uid(),
        v_partner_id,
        'partner',
        'opportunity_declined',
        'inquiry_matches',
        p_match_id,
        'success',
        pg_catalog.jsonb_build_object(
            'inquiry_id', v_match_rec.inquiry_id,
            'message', v_message_clean
        )
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'declined'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.decline_partner_opportunity_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_partner_opportunity_secure(UUID, UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.decline_opportunity(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_opportunity(UUID, TEXT) TO authenticated, service_role;
