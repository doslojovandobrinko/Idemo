-- IDEMO DEFAULT PARTNER LOGIN SEED MIGRATION
-- Ensures default username 'IDEMO' with temporary passcode '1611' and mandatory first-logon credential update (must_change_pin = true).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    true, -- Force partner to set custom credential / PIN on first logon
    'active',
    true,
    'WhatsApp'
)
ON CONFLICT (id) DO UPDATE SET
    public_code = EXCLUDED.public_code,
    passport_pin_hash = EXCLUDED.passport_pin_hash,
    must_change_pin = EXCLUDED.must_change_pin,
    status = EXCLUDED.status,
    is_open_for_inquiries = EXCLUDED.is_open_for_inquiries;
