-- IDEMO DEMONSTRATION PARTNERS SEEDING - PHASE 6B SLICE 7
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.0.0 (Slice 7 Production-Safe Demonstration Partner Accounts)

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
VALUES
    (
        'a0000000-0000-0000-0000-000000000091',
        'UNO1',
        'UNO1',
        extensions.crypt('3001', extensions.gen_salt('bf')),
        false,
        'active',
        true,
        'WhatsApp'
    ),
    (
        'a0000000-0000-0000-0000-000000000092',
        'UNO2',
        'UNO2',
        extensions.crypt('3002', extensions.gen_salt('bf')),
        false,
        'active',
        true,
        'WhatsApp'
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public_code = EXCLUDED.public_code,
    passport_pin_hash = EXCLUDED.passport_pin_hash,
    must_change_pin = EXCLUDED.must_change_pin,
    status = EXCLUDED.status,
    is_open_for_inquiries = EXCLUDED.is_open_for_inquiries;