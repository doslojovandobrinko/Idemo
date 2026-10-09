-- IDEMO REVERT SYNTHETIC PARTNER PASSPORT PHOTO PATHS (UNO1 & UNO2)
-- Migration: 20261009090000_revert_synthetic_partner_passport_photo_paths.sql
-- Target Platform: Supabase + PostgreSQL (Active Live Schema)
-- Purpose: Replaces synthetic WebP paths with the authentic canonical partner portrait path (/assets/images/partners/uno_portrait.svg)
--          and creates immutable audit log entries per IDEMO Governance Principle 29 (Every Change Has A Reason).

-- 1. Restore Authentic Canonical Vector Portrait for UNO1 (Guide)
UPDATE public.partner_profile_content
SET
    draft_photo_path = '/assets/images/partners/uno_portrait.svg',
    draft_photo_mime = 'image/svg+xml',
    published_photo_path = '/assets/images/partners/uno_portrait.svg',
    published_photo_mime = 'image/svg+xml',
    photo_consent_given = true,
    content_version = content_version + 1,
    updated_at = NOW()
WHERE partner_id = 'a0000000-0000-0000-0000-000000000091'
   OR partner_id IN (SELECT id FROM public.partners WHERE public_code = 'UNO1');

-- 2. Restore Authentic Canonical Vector Portrait for UNO2 (Regional Guide)
UPDATE public.partner_profile_content
SET
    draft_photo_path = '/assets/images/partners/uno_portrait.svg',
    draft_photo_mime = 'image/svg+xml',
    published_photo_path = '/assets/images/partners/uno_portrait.svg',
    published_photo_mime = 'image/svg+xml',
    photo_consent_given = true,
    content_version = content_version + 1,
    updated_at = NOW()
WHERE partner_id = 'a0000000-0000-0000-0000-000000000092'
   OR partner_id IN (SELECT id FROM public.partners WHERE public_code = 'UNO2');

-- 3. Immutable Audit Log Entries (IDEMO Principle 29 & Principle 40 Compliance)
INSERT INTO public.audit_logs (
    actor_role,
    action,
    resource_type,
    resource_id,
    result,
    safe_metadata
) VALUES (
    'admin',
    'partner_photo_canonical_restore',
    'partner_profile_content',
    'a0000000-0000-0000-0000-000000000091',
    'success',
    jsonb_build_object(
        'reason', 'Restored authentic canonical portrait vector and purged synthetic webp reference per Creator instruction',
        'partner_code', 'UNO1',
        'restored_path', '/assets/images/partners/uno_portrait.svg'
    )
);

INSERT INTO public.audit_logs (
    actor_role,
    action,
    resource_type,
    resource_id,
    result,
    safe_metadata
) VALUES (
    'admin',
    'partner_photo_canonical_restore',
    'partner_profile_content',
    'a0000000-0000-0000-0000-000000000092',
    'success',
    jsonb_build_object(
        'reason', 'Restored authentic canonical portrait vector and purged synthetic webp reference per Creator instruction',
        'partner_code', 'UNO2',
        'restored_path', '/assets/images/partners/uno_portrait.svg'
    )
);
