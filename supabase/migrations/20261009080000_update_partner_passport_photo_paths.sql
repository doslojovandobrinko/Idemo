-- IDEMO UPDATE PARTNER PASSPORT PHOTOGRAPHIC MEDIA PATHS (UNO1 & UNO2)
-- Migration: 20261009080000_update_partner_passport_photo_paths.sql
-- Target Platform: Supabase + PostgreSQL (Active Live Schema)
-- Purpose: Updates published_photo_path from legacy vector SVG avatar to genuine editorial photographic WebP portraits.

UPDATE public.partner_profile_content
SET
    published_photo_path = '/assets/images/partners/uno_guide_portrait.webp',
    photo_consent_given = true,
    content_version = content_version + 1,
    updated_at = NOW()
WHERE partner_id = 'a0000000-0000-0000-0000-000000000091'
   OR partner_id IN (SELECT id FROM public.partners WHERE public_code = 'UNO1');

UPDATE public.partner_profile_content
SET
    published_photo_path = '/assets/images/partners/uno_regional_portrait.webp',
    photo_consent_given = true,
    content_version = content_version + 1,
    updated_at = NOW()
WHERE partner_id = 'a0000000-0000-0000-0000-000000000092'
   OR partner_id IN (SELECT id FROM public.partners WHERE public_code = 'UNO2');
