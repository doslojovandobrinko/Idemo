-- IDEMO PERMANENT GENERIC ONBOARDING FIX
-- Target Platform: Supabase PostgreSQL
-- Resolves generic IDEMO + 1611 onboarding regression by implementing the "Immortal Template" pattern:
-- 1. Restores and permanently locks IDEMO template account (a0000000-0000-0000-0000-000000000099)
-- 2. Clones/provisions a dedicated partner row when a new partner onboards via IDEMO
-- 3. Supports dual-transport for custom partner name (both p_partner_name and p_confirm_new_pin with colon)
-- 4. Cleans up stale function overloads and resets rate limit lockouts

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Cleanly drop any conflicting change_partner_pin_secure overloads
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT oid::regprocedure AS func_signature 
        FROM pg_proc 
        WHERE proname = 'change_partner_pin_secure' 
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE;';
    END LOOP;
END $$;

-- 2. Restore and protect permanent generic IDEMO onboarding record
INSERT INTO public.partners (
    id,
    name,
    public_code,
    passport_pin_hash,
    must_change_pin,
    status,
    is_open_for_inquiries,
    contact_preference
)
VALUES (
    'a0000000-0000-0000-0000-000000000099',
    'IDEMO Partner',
    'IDEMO',
    extensions.crypt('1611', extensions.gen_salt('bf')),
    true, -- Always enforces customization of passname & PIN
    'active'::public.partner_status,
    true,
    'WhatsApp'
)
ON CONFLICT (id) DO UPDATE SET
    public_code = 'IDEMO',
    name = 'IDEMO Partner',
    passport_pin_hash = extensions.crypt('1611', extensions.gen_salt('bf')),
    must_change_pin = true,
    status = 'active'::public.partner_status,
    is_open_for_inquiries = true;

-- 3. Definitive change_partner_pin_secure function
CREATE OR REPLACE FUNCTION public.change_partner_pin_secure(
    p_partner_id UUID,
    p_current_pin TEXT,
    p_new_pin TEXT,
    p_confirm_new_pin TEXT,
    p_partner_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_partner_rec RECORD;
    v_numeric_code TEXT;
    v_name_clean TEXT;
    v_actual_new_pin TEXT;
    v_actual_confirm_pin TEXT;
    v_name_from_confirm TEXT;
    v_new_partner_id UUID;
BEGIN
    SELECT id, public_code, passport_pin_hash, must_change_pin, name
    INTO v_partner_rec
    FROM public.partners
    WHERE id = p_partner_id AND status = 'active'::public.partner_status
    FOR UPDATE;

    IF v_partner_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PARTNER_NOT_FOUND', 'message', 'Partner account not found or inactive.');
    END IF;

    -- Extract PIN and optional embedded name from p_confirm_new_pin (format: "PIN:NAME" or "PIN")
    v_actual_new_pin := trim(p_new_pin);
    IF p_confirm_new_pin LIKE '%:%' THEN
        v_actual_confirm_pin := trim(split_part(p_confirm_new_pin, ':', 1));
        v_name_from_confirm := trim(substring(p_confirm_new_pin from position(':' in p_confirm_new_pin) + 1));
    ELSE
        v_actual_confirm_pin := trim(p_confirm_new_pin);
        v_name_from_confirm := NULL;
    END IF;

    -- Resolve custom partner name (prefers p_partner_name if passed, else falls back to embedded name)
    v_name_clean := COALESCE(NULLIF(trim(p_partner_name), ''), NULLIF(v_name_from_confirm, ''));

    IF v_name_clean IS NOT NULL AND length(v_name_clean) > 16 THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'NAME_TOO_LONG', 'message', 'Naziv partnera ne može biti duži od 16 karaktera.');
    END IF;

    -- 1. Verify current PIN
    IF v_partner_rec.passport_pin_hash != extensions.crypt(trim(p_current_pin), v_partner_rec.passport_pin_hash) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'INVALID_CURRENT_PIN', 'message', 'Nevažeći trenutni PIN.');
    END IF;

    -- 2. Confirm new PIN match
    IF v_actual_new_pin != v_actual_confirm_pin THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PIN_MISMATCH', 'message', 'Novi PIN i potvrda se ne poklapaju.');
    END IF;

    -- 3. Validate PIN format & safety
    IF v_actual_new_pin !~ '^[0-9]{4}$' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'INVALID_PIN_FORMAT', 'message', 'PIN mora sadržati tačno 4 cifre.');
    END IF;

    IF v_actual_new_pin IN ('1234', '4321') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'TRIVIAL_PIN', 'message', 'PIN ne sme biti sekvencijalan.');
    END IF;

    IF v_actual_new_pin IN ('0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'REPEATED_PIN', 'message', 'PIN ne sme sadržati sve iste cifre.');
    END IF;

    IF v_actual_new_pin = trim(p_current_pin) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PIN_REUSE', 'message', 'Novi PIN ne može biti isti kao trenutni PIN.');
    END IF;

    -- 4. Check whether this is the generic IDEMO onboarding template
    IF p_partner_id = 'a0000000-0000-0000-0000-000000000099' OR UPPER(v_partner_rec.public_code) = 'IDEMO' THEN
        -- Check for public_code collision
        IF v_name_clean IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.partners WHERE LOWER(public_code) = LOWER(v_name_clean) AND id != 'a0000000-0000-0000-0000-000000000099'
        ) THEN
            RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'CODE_ALREADY_EXISTS', 'message', 'Izabrani naziv/kod partnera već postoji. Izaberite drugi.');
        END IF;

        -- Create a dedicated partner row for this newly onboarded partner
        v_new_partner_id := gen_random_uuid();
        INSERT INTO public.partners (
            id,
            name,
            public_code,
            passport_pin_hash,
            must_change_pin,
            status,
            is_open_for_inquiries,
            contact_preference,
            pin_changed_at,
            credential_version
        )
        VALUES (
            v_new_partner_id,
            COALESCE(NULLIF(v_name_clean, ''), 'Partner ' || SUBSTRING(v_new_partner_id::text, 1, 6)),
            COALESCE(NULLIF(v_name_clean, ''), UPPER(SUBSTRING(v_new_partner_id::text, 1, 8))),
            extensions.crypt(v_actual_new_pin, extensions.gen_salt('bf')),
            false,
            'active'::public.partner_status,
            true,
            'WhatsApp',
            timezone('utc'::text, now()),
            1
        );

        -- Keep the generic template row pristine (reset to IDEMO / 1611 / must_change_pin = true)
        UPDATE public.partners
        SET public_code = 'IDEMO',
            name = 'IDEMO Partner',
            passport_pin_hash = extensions.crypt('1611', extensions.gen_salt('bf')),
            must_change_pin = true
        WHERE id = 'a0000000-0000-0000-0000-000000000099';
    ELSE
        -- Standard existing partner: update own credentials in-place
        UPDATE public.partners
        SET passport_pin_hash = extensions.crypt(v_actual_new_pin, extensions.gen_salt('bf')),
            name = COALESCE(NULLIF(v_name_clean, ''), name),
            public_code = COALESCE(NULLIF(v_name_clean, ''), public_code),
            must_change_pin = false,
            pin_changed_at = timezone('utc'::text, now()),
            credential_version = credential_version + 1
        WHERE id = p_partner_id;
    END IF;

    -- Revoke existing temporary sessions for this partner
    UPDATE public.partner_sessions
    SET revoked_at = timezone('utc'::text, now())
    WHERE partner_id = p_partner_id AND revoked_at IS NULL;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'code', 'PIN_CHANGED_REAUTHENTICATION_REQUIRED',
        'message', 'Podaci uspešno ažurirani. Molimo prijavite se sa novim podacima.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- 5. Clear rate limit lockouts
TRUNCATE TABLE public.partner_login_attempts;
