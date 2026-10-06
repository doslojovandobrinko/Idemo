-- IDEMO PARTNER PIN RPC OVERLOAD AMBIGUITY RESOLUTION MIGRATION
-- Exhaustively drops all existing change_partner_pin_secure function overloads in public schema,
-- then creates the single, authoritative function signature with optional partner name (max 16 chars).

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
BEGIN
    SELECT id, public_code, passport_pin_hash, must_change_pin, name
    INTO v_partner_rec
    FROM public.partners
    WHERE id = p_partner_id AND status = 'active'::public.partner_status
    FOR UPDATE;

    IF v_partner_rec.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'PARTNER_NOT_FOUND', 'message', 'Partner account not found or inactive.');
    END IF;

    -- Validate optional partner name (strictly max 16 characters)
    IF p_partner_name IS NOT NULL THEN
        v_name_clean := trim(p_partner_name);
        IF length(v_name_clean) > 16 THEN
            RETURN pg_catalog.jsonb_build_object('success', false, 'error_code', 'NAME_TOO_LONG', 'message', 'Naziv partnera ne može biti duži od 16 karaktera.');
        END IF;
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

    -- Update partner record (setting custom name if provided and valid <= 16 chars)
    UPDATE public.partners
    SET passport_pin_hash = extensions.crypt(trim(p_new_pin), extensions.gen_salt('bf')),
        name = COALESCE(NULLIF(v_name_clean, ''), name),
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
        'message', 'PIN i naziv partnera uspešno ažurirani. Molimo prijavite se ponovo sa novim PIN-om.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_partner_pin_secure(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
