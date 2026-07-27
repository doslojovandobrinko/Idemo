-- IDEMO PARTNER AUTHENTICATION & OPPORTUNITY RESOLUTION - PHASE 6B SLICE 6
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.1.0 (Slice 6 Temporary & Mandatory PIN Management)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PARTNERS CREDENTIAL EXTENSION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'public_code'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN public_code TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'passport_pin_hash'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN passport_pin_hash TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'credential_version'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN credential_version INTEGER NOT NULL DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'must_change_pin'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN must_change_pin BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'pin_changed_at'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN pin_changed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'partners' AND column_name = 'pin_reset_at'
    ) THEN
        ALTER TABLE public.partners ADD COLUMN pin_reset_at TIMESTAMPTZ;
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED STAGING PARTNERS & CREDENTIALS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.partners (id, name, public_code, passport_pin_hash, must_change_pin, status, is_open_for_inquiries, contact_preference)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Belgrade Undercover Walking', 'P-TG-01', extensions.crypt('1611', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000002', 'Danube Delta Sailing Guides', 'P-TG-02', extensions.crypt('1612', extensions.gen_salt('bf')), true, 'active', true, 'Viber'),
    ('a0000000-0000-0000-0000-000000000003', 'Hotel Moskva', 'P-HO-01', extensions.crypt('2001', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000004', 'Salon 1905', 'P-WB-01', extensions.crypt('2002', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000005', 'Square Nine Hotel', 'P-HO-02', extensions.crypt('2003', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000006', 'Zemun Heritage Guild', 'P-TG-03', extensions.crypt('3003', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000007', 'Tara Peak Outdoors Guild', 'P-TG-04', extensions.crypt('3004', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000008', 'Belgrade Elite Dental Care', 'P-HC-01', extensions.crypt('4001', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp'),
    ('a0000000-0000-0000-0000-000000000009', 'Tesla Ride Belgrade Premium', 'P-TR-01', extensions.crypt('5001', extensions.gen_salt('bf')), true, 'active', true, 'WhatsApp')
ON CONFLICT (id) DO UPDATE SET
    public_code = EXCLUDED.public_code,
    passport_pin_hash = EXCLUDED.passport_pin_hash,
    status = EXCLUDED.status,
    is_open_for_inquiries = EXCLUDED.is_open_for_inquiries;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SESSIONS & LOGIN ATTEMPTS TABLES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.partner_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    credential_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_source_hash TEXT
);

CREATE TABLE IF NOT EXISTS public.partner_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code_hash TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    success BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_sessions_token_hash ON public.partner_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_partner_sessions_partner_id ON public.partner_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_login_attempts_code ON public.partner_login_attempts(partner_code_hash, attempted_at);
CREATE INDEX IF NOT EXISTS idx_partner_login_attempts_source ON public.partner_login_attempts(source_hash, attempted_at);

ALTER TABLE public.partner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.partner_sessions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.partner_login_attempts FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SERVER-ONLY AUTHENTICATION & SESSION FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.authenticate_partner_login(
    p_public_code TEXT,
    p_pin TEXT,
    p_token_hash TEXT,
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_source_hash TEXT,
    p_partner_code_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_recent_failed_code INT;
    v_recent_failed_source INT;
    v_partner_rec RECORD;
    v_pin_valid BOOLEAN;
    v_session_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Check Rate Limits (max 5 failed per partner code hash, 20 failed per source hash in 15 mins)
    SELECT COUNT(*) INTO v_recent_failed_code
    FROM public.partner_login_attempts
    WHERE partner_code_hash = p_partner_code_hash
      AND success = false
      AND attempted_at > (timezone('utc'::text, now()) - INTERVAL '15 minutes');

    IF v_recent_failed_code >= 5 THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'error_code', 'RATE_LIMITED',
            'message', 'Too many failed login attempts for this account. Please wait 15 minutes.'
        );
    END IF;

    SELECT COUNT(*) INTO v_recent_failed_source
    FROM public.partner_login_attempts
    WHERE source_hash = p_source_hash
      AND success = false
      AND attempted_at > (timezone('utc'::text, now()) - INTERVAL '15 minutes');

    IF v_recent_failed_source >= 20 THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'error_code', 'RATE_LIMITED',
            'message', 'Too many requests from this device. Please wait 15 minutes.'
        );
    END IF;

    -- 2. Lookup Partner
    SELECT id, public_code, name, status, passport_pin_hash, credential_version, must_change_pin
    INTO v_partner_rec
    FROM public.partners
    WHERE LOWER(public_code) = LOWER(trim(p_public_code))
      AND status = 'active'::public.partner_status;

    IF v_partner_rec.id IS NULL OR v_partner_rec.passport_pin_hash IS NULL THEN
        INSERT INTO public.partner_login_attempts (partner_code_hash, source_hash, success)
        VALUES (p_partner_code_hash, p_source_hash, false);

        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_CREDENTIALS',
            'message', 'Invalid partner code or PIN.'
        );
    END IF;

    -- 3. Verify PIN
    v_pin_valid := (v_partner_rec.passport_pin_hash = extensions.crypt(p_pin, v_partner_rec.passport_pin_hash));

    IF NOT v_pin_valid THEN
        INSERT INTO public.partner_login_attempts (partner_code_hash, source_hash, success)
        VALUES (p_partner_code_hash, p_source_hash, false);

        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_CREDENTIALS',
            'message', 'Invalid partner code or PIN.'
        );
    END IF;

    -- 4. Record Successful Login
    INSERT INTO public.partner_login_attempts (partner_code_hash, source_hash, success)
    VALUES (p_partner_code_hash, p_source_hash, true);

    -- 5. Create Session
    INSERT INTO public.partner_sessions (
        partner_id,
        token_hash,
        credential_version,
        expires_at,
        created_source_hash
    ) VALUES (
        v_partner_rec.id,
        p_token_hash,
        v_partner_rec.credential_version,
        p_expires_at,
        p_source_hash
    ) RETURNING id INTO v_session_id;

    v_result := pg_catalog.jsonb_build_object(
        'success', true,
        'partner_id', v_partner_rec.id,
        'public_code', v_partner_rec.public_code,
        'name', v_partner_rec.name,
        'must_change_pin', v_partner_rec.must_change_pin,
        'credential_version', v_partner_rec.credential_version,
        'expires_at', p_expires_at
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.validate_partner_session(
    p_token_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_session_rec RECORD;
BEGIN
    SELECT 
        s.id AS session_id,
        s.partner_id,
        s.credential_version AS session_cred_version,
        s.expires_at,
        p.public_code,
        p.name,
        p.status,
        p.must_change_pin,
        p.credential_version AS partner_cred_version
    INTO v_session_rec
    FROM public.partner_sessions s
    JOIN public.partners p ON p.id = s.partner_id
    WHERE s.token_hash = p_token_hash
      AND s.revoked_at IS NULL
      AND s.expires_at > timezone('utc'::text, now());

    IF v_session_rec.session_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'valid', false,
            'error_code', 'SESSION_EXPIRED',
            'message', 'Session is invalid or expired.'
        );
    END IF;

    IF v_session_rec.status != 'active'::public.partner_status THEN
        RETURN pg_catalog.jsonb_build_object(
            'valid', false,
            'error_code', 'PARTNER_INACTIVE',
            'message', 'Partner account is not active.'
        );
    END IF;

    IF v_session_rec.session_cred_version != v_session_rec.partner_cred_version THEN
        RETURN pg_catalog.jsonb_build_object(
            'valid', false,
            'error_code', 'CREDENTIALS_CHANGED',
            'message', 'Partner credentials have changed. Please log in again.'
        );
    END IF;

    -- Update last_used_at
    UPDATE public.partner_sessions
    SET last_used_at = timezone('utc'::text, now())
    WHERE id = v_session_rec.session_id;

    RETURN pg_catalog.jsonb_build_object(
        'valid', true,
        'partner_id', v_session_rec.partner_id,
        'public_code', v_session_rec.public_code,
        'name', v_session_rec.name,
        'must_change_pin', v_session_rec.must_change_pin,
        'expires_at', v_session_rec.expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.revoke_partner_session(
    p_token_hash TEXT
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.partner_sessions
    SET revoked_at = timezone('utc'::text, now())
    WHERE token_hash = p_token_hash
      AND revoked_at IS NULL;

    RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PIN CHANGE & ADMIN RESET FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.change_partner_pin_secure(
    p_partner_id UUID,
    p_current_pin TEXT,
    p_new_pin TEXT,
    p_confirm_new_pin TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_partner_rec RECORD;
    v_numeric_code TEXT;
BEGIN
    SELECT id, public_code, passport_pin_hash, must_change_pin
    INTO v_partner_rec
    FROM public.partners
    WHERE id = p_partner_id AND status = 'active'::public.partner_status
    FOR UPDATE;

    IF v_partner_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PARTNER_NOT_FOUND', 'message', 'Partner account not found or inactive.');
    END IF;

    -- 1. Verify current PIN
    IF v_partner_rec.passport_pin_hash != extensions.crypt(p_current_pin, v_partner_rec.passport_pin_hash) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'INVALID_CURRENT_PIN', 'message', 'Nevažeći trenutni PIN.');
    END IF;

    -- 2. Confirm new PIN match
    IF trim(p_new_pin) != trim(p_confirm_new_pin) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PIN_MISMATCH', 'message', 'Novi PIN i potvrda se ne poklapaju.');
    END IF;

    -- 3. Validate PIN policy
    IF trim(p_new_pin) !~ '^[0-9]{4}$' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'INVALID_PIN_FORMAT', 'message', 'PIN mora sadržati tačno 4 cifre.');
    END IF;

    IF trim(p_new_pin) IN ('1234', '4321') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'TRIVIAL_PIN', 'message', 'PIN ne sme biti sekvencijalan (npr. 1234).');
    END IF;

    IF trim(p_new_pin) IN ('0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'REPEATED_PIN', 'message', 'PIN ne sme sadržati sve iste cifre.');
    END IF;

    IF trim(p_new_pin) = trim(p_current_pin) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PIN_REUSE', 'message', 'Novi PIN ne može biti isti kao trenutni PIN.');
    END IF;

    v_numeric_code := regexp_replace(v_partner_rec.public_code, '[^0-9]', '', 'g');
    IF v_numeric_code != '' AND trim(p_new_pin) = v_numeric_code THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PIN_EQUAL_CODE', 'message', 'PIN ne sme biti jednak kodu partnera.');
    END IF;

    -- Update partner record
    UPDATE public.partners
    SET passport_pin_hash = extensions.crypt(trim(p_new_pin), extensions.gen_salt('bf')),
        must_change_pin = false,
        pin_changed_at = timezone('utc'::text, now()),
        credential_version = credential_version + 1
    WHERE id = p_partner_id;

    -- Revoke all existing sessions for this partner
    UPDATE public.partner_sessions
    SET revoked_at = timezone('utc'::text, now())
    WHERE partner_id = p_partner_id AND revoked_at IS NULL;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'code', 'PIN_CHANGED_REAUTHENTICATION_REQUIRED',
        'message', 'PIN uspešno promenjen. Molimo prijavite se ponovo sa novim PIN-om.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.admin_reset_partner_pin(
    p_partner_id UUID,
    p_temp_pin TEXT
)
RETURNS JSONB AS $$
BEGIN
    UPDATE public.partners
    SET passport_pin_hash = extensions.crypt(trim(p_temp_pin), extensions.gen_salt('bf')),
        must_change_pin = true,
        pin_reset_at = timezone('utc'::text, now()),
        credential_version = credential_version + 1
    WHERE id = p_partner_id;

    UPDATE public.partner_sessions
    SET revoked_at = timezone('utc'::text, now())
    WHERE partner_id = p_partner_id AND revoked_at IS NULL;

    RETURN pg_catalog.jsonb_build_object('success', true, 'message', 'Partner PIN reset successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SECURE PARTNER OPPORTUNITY PL/PGSQL FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_partner_opportunities_secure(
    p_partner_id UUID,
    p_scope TEXT DEFAULT 'new'
)
RETURNS JSONB AS $$
DECLARE
    v_opportunities JSONB;
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

    IF p_scope = 'new' THEN
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'visitor_notes', i.visitor_notes,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'offered_at', m.offered_at,
                'expires_at', m.expires_at,
                'viewed_at', m.viewed_at,
                'match_status', m.status,
                'inquiry_status', i.status
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND m.status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          AND m.expires_at > timezone('utc'::text, now())
          AND i.status IN ('matching'::public.inquiry_status, 'new'::public.inquiry_status);

    ELSIF p_scope = 'active' THEN
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'visitor_notes', i.visitor_notes,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'offered_at', m.offered_at,
                'expires_at', m.expires_at,
                'match_status', m.status,
                'inquiry_status', i.status,
                'visitor_contact', CASE WHEN i.status = 'confirmed'::public.inquiry_status THEN (
                    SELECT pg_catalog.jsonb_build_object(
                        'visitor_name', c.visitor_name,
                        'email', c.email,
                        'phone_number', c.phone_number
                    ) FROM public.inquiry_private_contacts c WHERE c.inquiry_id = i.id
                ) ELSE NULL END
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND (m.status IN ('responded'::public.match_status, 'selected'::public.match_status)
               OR i.status IN ('awaiting_visitor'::public.inquiry_status, 'confirmed'::public.inquiry_status, 'in_progress'::public.inquiry_status));

    ELSE -- 'history'
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'match_status', m.status,
                'inquiry_status', i.status
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND (m.status IN ('declined'::public.match_status, 'expired'::public.match_status, 'withdrawn'::public.match_status, 'not_selected'::public.match_status)
               OR i.status IN ('completed'::public.inquiry_status, 'closed'::public.inquiry_status, 'canceled'::public.inquiry_status));
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'opportunities', COALESCE(v_opportunities, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.view_partner_opportunity_secure(
    p_partner_id UUID,
    p_match_id UUID
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
    WHERE m.id = p_match_id AND m.partner_id = p_partner_id;

    IF v_match_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity not found or access denied.');
    END IF;

    IF v_match_rec.status = 'offered'::public.match_status THEN
        UPDATE public.inquiry_matches
        SET status = 'viewed'::public.match_status,
            viewed_at = timezone('utc'::text, now())
        WHERE id = p_match_id;
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'viewed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.accept_partner_opportunity_secure(
    p_partner_id UUID,
    p_match_id UUID,
    p_message TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_inquiry_rec RECORD;
    v_message_clean TEXT;
    v_response_id UUID;
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

    IF v_match_rec.expires_at < timezone('utc'::text, now()) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity has expired.');
    END IF;

    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity is not in editable state.');
    END IF;

    SELECT id, status, requested_start_at, requested_end_at INTO v_inquiry_rec
    FROM public.inquiries
    WHERE id = v_match_rec.inquiry_id
    FOR UPDATE;

    v_message_clean := trim(COALESCE(p_message, ''));
    IF v_message_clean = '' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Message is required.');
    END IF;

    INSERT INTO public.partner_responses (
        match_id,
        response_type,
        message,
        proposed_start_at,
        proposed_end_at,
        status
    ) VALUES (
        p_match_id,
        'accept_as_requested'::public.response_type,
        v_message_clean,
        v_inquiry_rec.requested_start_at,
        v_inquiry_rec.requested_end_at,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_response_id;

    UPDATE public.inquiry_matches
    SET status = 'responded'::public.match_status
    WHERE id = p_match_id;

    UPDATE public.inquiries
    SET status = 'awaiting_visitor'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'response_id', v_response_id,
        'status', 'responded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

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

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'status', 'declined'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.propose_partner_alternative_secure(
    p_partner_id UUID,
    p_match_id UUID,
    p_proposed_start TIMESTAMP WITH TIME ZONE,
    p_proposed_end TIMESTAMP WITH TIME ZONE,
    p_message TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_match_rec RECORD;
    v_message_clean TEXT;
    v_response_id UUID;
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

    IF v_match_rec.expires_at < timezone('utc'::text, now()) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity has expired.');
    END IF;

    IF v_match_rec.status NOT IN ('offered'::public.match_status, 'viewed'::public.match_status) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Opportunity is not in editable state.');
    END IF;

    v_message_clean := trim(COALESCE(p_message, ''));
    IF v_message_clean = '' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Message is required when proposing an alternative.');
    END IF;

    IF p_proposed_start IS NULL OR p_proposed_end IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Proposed start and end dates are required.');
    END IF;

    INSERT INTO public.partner_responses (
        match_id,
        response_type,
        message,
        proposed_start_at,
        proposed_end_at,
        status
    ) VALUES (
        p_match_id,
        'propose_alternative'::public.response_type,
        v_message_clean,
        p_proposed_start,
        p_proposed_end,
        'submitted'::public.partner_response_status
    ) RETURNING id INTO v_response_id;

    UPDATE public.inquiry_matches
    SET status = 'responded'::public.match_status
    WHERE id = p_match_id;

    UPDATE public.inquiries
    SET status = 'awaiting_visitor'::public.inquiry_status
    WHERE id = v_match_rec.inquiry_id;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'response_id', v_response_id,
        'status', 'responded'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. SECURITY GRANTS MATRIX
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.authenticate_partner_login(TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_partner_session(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.revoke_partner_session(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_reset_partner_pin(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_partner_opportunities_secure(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.view_partner_opportunity_secure(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_partner_opportunity_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decline_partner_opportunity_secure(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.propose_partner_alternative_secure(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.authenticate_partner_login(TEXT, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_partner_session(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_partner_session(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_partner_pin(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_partner_opportunities_secure(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.view_partner_opportunity_secure(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_partner_opportunity_secure(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decline_partner_opportunity_secure(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.propose_partner_alternative_secure(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;
