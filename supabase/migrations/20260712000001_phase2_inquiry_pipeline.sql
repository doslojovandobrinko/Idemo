-- IDEMO PARTNER ROUTING ENGINE - PHASE 2: INQUIRY PIPELINE MIGRATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.1.0 (Phase 2 Implementation)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. REFERENCE CODE GENERATION HELPER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_reference_code()
RETURNS VARCHAR AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    code VARCHAR(12);
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        -- Format: IDM-[100-999]-[A-Z][A-Z][A-Z]
        code := 'IDM-' || pg_catalog.floor(pg_catalog.random() * 900 + 100)::text || '-' ||
                pg_catalog.substr(chars, pg_catalog.floor(pg_catalog.random() * 26 + 1)::int, 1) ||
                pg_catalog.substr(chars, pg_catalog.floor(pg_catalog.random() * 26 + 1)::int, 1) ||
                pg_catalog.substr(chars, pg_catalog.floor(pg_catalog.random() * 26 + 1)::int, 1);
        
        -- Guarantee global uniqueness against the inquiries table
        SELECT NOT EXISTS (
            SELECT 1 FROM public.inquiries WHERE public_reference_code = code
        ) INTO is_unique;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ATOMIC INQUIRY PIPELINE CREATION TRANSACTION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_public_inquiry(
    p_recommendation_id UUID,
    p_visitor_notes TEXT,
    p_preferred_language_id UUID,
    p_service_area_id UUID,
    p_requested_start_at TIMESTAMP WITH TIME ZONE,
    p_requested_end_at TIMESTAMP WITH TIME ZONE,
    p_visitor_name VARCHAR(255),
    p_email VARCHAR(255),
    p_phone_number VARCHAR(100),
    p_consent_text_version VARCHAR(50),
    p_consent_purpose VARCHAR(255),
    p_consent_channel VARCHAR(100),
    p_required_capability_ids UUID[] DEFAULT NULL,
    p_visitor_auth_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_inquiry_id UUID;
    v_public_ref VARCHAR(12);
    v_raw_token VARCHAR(39);
    v_token_hash VARCHAR(64);
    v_visitor_notes_clean TEXT;
    v_cap_ids UUID[];
    v_cap_id UUID;
    v_partner_record RECORD;
    v_queue_order INT := 1;
    v_first_partner_id UUID := NULL;
    v_match_id UUID;
    v_expiry_interval INTERVAL := INTERVAL '2 hours';
    v_meta JSONB;
    v_result JSONB;
    v_visitor_auth_id UUID;
BEGIN
    -- ─────────────────────────────────────────────────────────────────────────────
    -- 1. INPUT VALIDATION (Validate all inputs robustly)
    -- ─────────────────────────────────────────────────────────────────────────────
    
    -- Check Recommendation
    IF NOT EXISTS (SELECT 1 FROM public.recommendations WHERE id = p_recommendation_id) THEN
        RAISE EXCEPTION 'Recommendation not found';
    END IF;

    -- Check Language
    IF NOT EXISTS (SELECT 1 FROM public.languages WHERE id = p_preferred_language_id) THEN
        RAISE EXCEPTION 'Language not found';
    END IF;

    -- Check Service Area
    IF NOT EXISTS (SELECT 1 FROM public.service_areas WHERE id = p_service_area_id) THEN
        RAISE EXCEPTION 'Service area not found';
    END IF;

    -- Clean notes and validate length
    v_visitor_notes_clean := trim(p_visitor_notes);
    IF v_visitor_notes_clean IS NULL OR v_visitor_notes_clean = '' THEN
        RAISE EXCEPTION 'Visitor notes cannot be empty';
    END IF;

    IF pg_catalog.length(v_visitor_notes_clean) > 1000 THEN
        RAISE EXCEPTION 'Visitor notes exceed maximum limit of 1000 characters';
    END IF;

    -- Date validations
    IF p_requested_start_at IS NULL OR p_requested_end_at IS NULL THEN
        RAISE EXCEPTION 'Request dates cannot be null';
    END IF;

    IF p_requested_start_at < pg_catalog.now() - INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Requested start time cannot be in the past';
    END IF;

    IF p_requested_end_at <= p_requested_start_at THEN
        RAISE EXCEPTION 'Requested end time must be after start time';
    END IF;

    -- Contact details validation
    IF p_visitor_name IS NULL OR trim(p_visitor_name) = '' THEN
        RAISE EXCEPTION 'Visitor name cannot be empty';
    END IF;

    IF (p_email IS NULL OR trim(p_email) = '') AND (p_phone_number IS NULL OR trim(p_phone_number) = '') THEN
        RAISE EXCEPTION 'At least one contact channel (email or phone) is required';
    END IF;

    -- Consent validations
    IF p_consent_text_version IS NULL OR trim(p_consent_text_version) = '' OR
       p_consent_purpose IS NULL OR trim(p_consent_purpose) = '' OR
       p_consent_channel IS NULL OR trim(p_consent_channel) = '' THEN
        RAISE EXCEPTION 'Visitor consent details are required';
    END IF;

    -- Resolve visitor auth ID
    v_visitor_auth_id := COALESCE(p_visitor_auth_user_id, auth.uid());
    IF v_visitor_auth_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
        v_visitor_auth_id := NULL;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 2. CRYPTOGRAPHIC DATA GENERATION
    -- ─────────────────────────────────────────────────────────────────────────────
    
    -- Public Reference Code
    v_public_ref := public.generate_reference_code();

    -- Recovery Token & Secure Hash
    v_raw_token := 'idm_rc_' || pg_catalog.replace(gen_random_uuid()::text, '-', '');
    v_token_hash := pg_catalog.encode(pg_catalog.sha256(v_raw_token::bytea), 'hex');

    -- Resolve required capabilities
    v_cap_ids := p_required_capability_ids;
    IF v_cap_ids IS NULL OR pg_catalog.array_length(v_cap_ids, 1) IS NULL THEN
        SELECT COALESCE(pg_catalog.array_agg(capability_id), ARRAY[]::uuid[]) INTO v_cap_ids
        FROM public.recommendation_capabilities
        WHERE recommendation_id = p_recommendation_id;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 3. CORE TABLE WRITES (Atomic inserts inside transaction)
    -- ─────────────────────────────────────────────────────────────────────────────
    
    -- Insert into Inquiries
    INSERT INTO public.inquiries (
        recommendation_id,
        visitor_auth_user_id,
        status,
        visitor_notes,
        preferred_language_id,
        service_area_id,
        requested_start_at,
        requested_end_at,
        public_reference_code,
        recovery_token_hash,
        recovery_token_expires_at
    ) VALUES (
        p_recommendation_id,
        v_visitor_auth_id,
        'new'::public.inquiry_status,
        v_visitor_notes_clean,
        p_preferred_language_id,
        p_service_area_id,
        p_requested_start_at,
        p_requested_end_at,
        v_public_ref,
        v_token_hash,
        pg_catalog.now() + INTERVAL '30 days'
    )
    RETURNING id INTO v_inquiry_id;

    -- Insert into Inquiry Private Contacts
    INSERT INTO public.inquiry_private_contacts (
        inquiry_id,
        visitor_name,
        email,
        phone_number
    ) VALUES (
        v_inquiry_id,
        trim(p_visitor_name),
        trim(p_email),
        trim(p_phone_number)
    );

    -- Insert into Visitor Consents (visitor consent recording)
    INSERT INTO public.visitor_consents (
        inquiry_id,
        consent_text_version,
        purpose,
        channel
    ) VALUES (
        v_inquiry_id,
        trim(p_consent_text_version),
        trim(p_consent_purpose),
        trim(p_consent_channel)
    );

    -- Insert required capabilities
    IF pg_catalog.array_length(v_cap_ids, 1) > 0 THEN
        FOREACH v_cap_id IN ARRAY v_cap_ids LOOP
            INSERT INTO public.inquiry_required_capabilities (
                inquiry_id,
                capability_id,
                requirement_level
            ) VALUES (
                v_inquiry_id,
                v_cap_id,
                'required'::public.requirement_level
            );
        END LOOP;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 4. DETERMINISTIC ELIGIBILITY FILTERING & QUEUE GENERATION (Immutable)
    -- ─────────────────────────────────────────────────────────────────────────────
    
    FOR v_partner_record IN 
        SELECT p.id
        FROM public.partners p
        -- 1. Active partner
        WHERE p.status = 'active'::public.partner_status
        -- 2. Open for inquiries
        AND p.is_open_for_inquiries = true
        -- 3. Not paused
        AND (p.paused_until IS NULL OR p.paused_until <= pg_catalog.now())
        -- 4. Approved service area
        AND EXISTS (
            SELECT 1 FROM public.partner_service_areas psa
            WHERE psa.partner_id = p.id
              AND psa.service_area_id = p_service_area_id
              AND psa.status = 'approved'::public.moderation_status
        )
        -- 5. Requested language
        AND EXISTS (
            SELECT 1 FROM public.partner_languages pl
            WHERE pl.partner_id = p.id
              AND pl.language_id = p_preferred_language_id
              AND pl.status = 'approved'::public.moderation_status
        )
        -- 6. All required capabilities
        AND (
            pg_catalog.array_length(v_cap_ids, 1) IS NULL OR
            NOT EXISTS (
                SELECT 1 FROM pg_catalog.unnest(v_cap_ids) req_cap_id
                WHERE req_cap_id NOT IN (
                    SELECT pc.capability_id FROM public.partner_capabilities pc
                    WHERE pc.partner_id = p.id
                      AND pc.status = 'approved'::public.moderation_status
                )
            )
        )
        -- Ordering: 1. Least recently offered, 2. Deterministic UUID tie-breaker
        ORDER BY 
            COALESCE(
                (SELECT pg_catalog.max(im.offered_at) FROM public.inquiry_matches im WHERE im.partner_id = p.id),
                '1970-01-01 00:00:00+00'::timestamptz
            ) ASC,
            p.id ASC
    LOOP
        -- Write to the immutable candidate queue
        INSERT INTO public.inquiry_candidates (
            inquiry_id,
            partner_id,
            queue_order,
            candidate_status
        ) VALUES (
            v_inquiry_id,
            v_partner_record.id,
            v_queue_order,
            'queued'::public.candidate_status
        );

        IF v_queue_order = 1 THEN
            v_first_partner_id := v_partner_record.id;
        END IF;

        v_queue_order := v_queue_order + 1;
    END LOOP;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 5. INITIALIZE THE FIRST ACTIVE OFFER
    -- ─────────────────────────────────────────────────────────────────────────────
    
    IF v_first_partner_id IS NOT NULL THEN
        -- Insert the first inquiry_match (active offer)
        INSERT INTO public.inquiry_matches (
            inquiry_id,
            partner_id,
            status,
            offered_at,
            expires_at
        ) VALUES (
            v_inquiry_id,
            v_first_partner_id,
            'offered'::public.match_status,
            pg_catalog.now(),
            pg_catalog.now() + v_expiry_interval
        )
        RETURNING id INTO v_match_id;

        -- Update the candidate status to 'offered'
        UPDATE public.inquiry_candidates
        SET candidate_status = 'offered'::public.candidate_status
        WHERE inquiry_id = v_inquiry_id AND partner_id = v_first_partner_id;

        -- Update the inquiry status to 'matching'
        UPDATE public.inquiries
        SET status = 'matching'::public.inquiry_status
        WHERE id = v_inquiry_id;
    ELSE
        -- No eligible partners found, escalate to needs_assistance for human concierge intervention
        UPDATE public.inquiries
        SET status = 'needs_assistance'::public.inquiry_status
        WHERE id = v_inquiry_id;
    END IF;

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 6. STRICT IMMUTABLE AUDIT LOG ENTRY
    -- ─────────────────────────────────────────────────────────────────────────────
    
    v_meta := pg_catalog.jsonb_build_object(
        'public_reference_code', v_public_ref,
        'candidates_count', v_queue_order - 1,
        'has_active_offer', (v_first_partner_id IS NOT NULL),
        'matched_partner_id', v_first_partner_id
    );

    INSERT INTO public.audit_logs (
        actor_auth_user_id,
        actor_role,
        action,
        resource_type,
        resource_id,
        result,
        safe_metadata
    ) VALUES (
        v_visitor_auth_id,
        CASE WHEN v_visitor_auth_id IS NOT NULL THEN 'visitor_authenticated' ELSE 'visitor_anonymous' END,
        'inquiry_created',
        'inquiries',
        v_inquiry_id,
        'success',
        v_meta
    );

    -- ─────────────────────────────────────────────────────────────────────────────
    -- 7. RETURN COMPACT SANITIZED METADATA
    -- ─────────────────────────────────────────────────────────────────────────────
    
    v_result := pg_catalog.jsonb_build_object(
        'inquiry_id', v_inquiry_id,
        'public_reference_code', v_public_ref,
        'raw_recovery_token', v_raw_token,
        'candidates_count', v_queue_order - 1,
        'first_partner_id', v_first_partner_id,
        'first_match_id', v_match_id
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Grant execution to anonymous and authenticated users so public requests can invoke it
GRANT EXECUTE ON FUNCTION public.create_public_inquiry(
    UUID, TEXT, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE,
    VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID[], UUID
) TO anon, authenticated;
