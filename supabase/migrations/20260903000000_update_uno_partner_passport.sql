-- IDEMO UPDATE UNO PARTNER PASSPORT PROFILE CONTENT & PHOTO
-- Migration: 20260903000000_update_uno_partner_passport.sql
-- Target Platform: Supabase + PostgreSQL (Active Live Schema)
-- Purpose: Updates authoritative partner profile content and photo consent for UNO (UNO1 & UNO2) to the canonical guide identity.

-- 1. Update Partner Profile Content for UNO1 (a0000000-0000-0000-0000-000000000091)
INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    intro_published,
    review_status,
    photo_consent_given,
    published_photo_path,
    content_version,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000091',
        'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
        'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
        'approved'::public.partner_profile_review_status,
        true,
        '/assets/images/partners/uno_portrait.svg',
        2,
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
ON CONFLICT (partner_id) DO UPDATE SET
    intro_draft = EXCLUDED.intro_draft,
    intro_published = EXCLUDED.intro_published,
    review_status = EXCLUDED.review_status,
    photo_consent_given = true,
    published_photo_path = '/assets/images/partners/uno_portrait.svg',
    content_version = public.partner_profile_content.content_version + 1,
    updated_at = NOW();

-- 2. Update Partner Profile Content for UNO2 (a0000000-0000-0000-0000-000000000092)
INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    intro_published,
    review_status,
    photo_consent_given,
    published_photo_path,
    content_version,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000092',
        'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
        'I am a licensed local guide with strong knowledge of Belgrade, Serbian history, cultural heritage and traditional gastronomy. I enjoy helping visitors understand the stories behind the places they see and creating memorable experiences tailored to their interests.',
        'approved'::public.partner_profile_review_status,
        true,
        '/assets/images/partners/uno_portrait.svg',
        2,
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
ON CONFLICT (partner_id) DO UPDATE SET
    intro_draft = EXCLUDED.intro_draft,
    intro_published = EXCLUDED.intro_published,
    review_status = EXCLUDED.review_status,
    photo_consent_given = true,
    published_photo_path = '/assets/images/partners/uno_portrait.svg',
    content_version = public.partner_profile_content.content_version + 1,
    updated_at = NOW();
