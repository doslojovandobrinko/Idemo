-- IDEMO DEFAULT PARTNER LOGIN SEED FIX
-- Resolves public_code unique constraint conflict and ensures IDEMO + 1611 login record is active.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Delete any existing orphan IDEMO partner records if public_code conflict exists under a different ID
DELETE FROM public.partners WHERE LOWER(public_code) = 'idemo' AND id != 'a0000000-0000-0000-0000-000000000099';

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
ON CONFLICT (public_code) DO UPDATE SET
    passport_pin_hash = extensions.crypt('1611', extensions.gen_salt('bf')),
    must_change_pin = true,
    status = 'active',
    is_open_for_inquiries = true;
