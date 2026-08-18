-- IDEMO SEED TEST PARTNER PASSPORT PROFILES & OPERATIONAL CONTACTS (UNO1 & UNO2)
-- Migration: 20260817010000_seed_test_partner_passports.sql
-- Target Platform: Supabase + PostgreSQL (Active Live Schema)
-- Purpose: Provisions complete approved Partner Passport records and sets synthetic operational contacts on active Uvac eligibility rows.

-- 1. Populate/Update Partner Profile Content for UNO1 & UNO2
INSERT INTO public.partner_profile_content (
    partner_id,
    intro_draft,
    intro_published,
    review_status,
    photo_consent_given,
    content_version,
    reviewed_at,
    submitted_at,
    created_at,
    updated_at
)
VALUES
    (
        'a0000000-0000-0000-0000-000000000091',
        'Welcome to IDEMO. As a licensed professional heritage and nature guide with over a decade of field experience across Serbia, I specialize in curated cultural walks, architectural heritage tours, and scenic day excursions throughout Belgrade, the Danube basin, and the rolling landscapes of Šumadija. My work focuses on providing attentive, small-group hospitality tailored to discerning travelers seeking authentic historical context, local culinary traditions, and tranquil walking trails. From the winding cobblestones of vintage urban quarters to secluded panoramic viewpoints overlooking river confluences, every itinerary is planned with precision, safety, and pacing in mind. Whether you require flexible scheduling, personalized cultural interpretation in fluent English or Serbian, or discreet logistical coordination for your day trip, I am dedicated to ensuring your time is seamless, enriching, and memorable. (Notice: This profile is a verified synthetic test fixture for IDEMO transaction engine validation.)',
        'Welcome to IDEMO. As a licensed professional heritage and nature guide with over a decade of field experience across Serbia, I specialize in curated cultural walks, architectural heritage tours, and scenic day excursions throughout Belgrade, the Danube basin, and the rolling landscapes of Šumadija. My work focuses on providing attentive, small-group hospitality tailored to discerning travelers seeking authentic historical context, local culinary traditions, and tranquil walking trails. From the winding cobblestones of vintage urban quarters to secluded panoramic viewpoints overlooking river confluences, every itinerary is planned with precision, safety, and pacing in mind. Whether you require flexible scheduling, personalized cultural interpretation in fluent English or Serbian, or discreet logistical coordination for your day trip, I am dedicated to ensuring your time is seamless, enriching, and memorable. (Notice: This profile is a verified synthetic test fixture for IDEMO transaction engine validation.)',
        'approved'::public.partner_profile_review_status,
        false,
        1,
        NOW(),
        NOW(),
        NOW(),
        NOW()
    ),
    (
        'a0000000-0000-0000-0000-000000000092',
        'Welcome to IDEMO. As an accredited regional transfer specialist and outdoor activities coordinator, I provide comprehensive logistics, private executive transport, and guided adventure experiences across Western Serbia, the Dinaric Alps, and national park reserves. With extensive operational expertise navigating the canyon waterways of Uvac, the mountain routes of Tara, and the historic fortress trails of the Iron Gate, I deliver dependable, safety-certified excursions for individual travelers and private parties. My services encompass seamless airport and inter-city connections, customized multi-day itineraries, and localized outdoor guidance with full proficiency in English, German, and Serbian. Every journey emphasizes punctuality, vehicle comfort, environmental respect, and deep regional knowledge. I look forward to coordinating your travel arrangements with the highest standards of reliability and personal care. (Notice: This profile is a verified synthetic test fixture for IDEMO transaction engine validation.)',
        'Welcome to IDEMO. As an accredited regional transfer specialist and outdoor activities coordinator, I provide comprehensive logistics, private executive transport, and guided adventure experiences across Western Serbia, the Dinaric Alps, and national park reserves. With extensive operational expertise navigating the canyon waterways of Uvac, the mountain routes of Tara, and the historic fortress trails of the Iron Gate, I deliver dependable, safety-certified excursions for individual travelers and private parties. My services encompass seamless airport and inter-city connections, customized multi-day itineraries, and localized outdoor guidance with full proficiency in English, German, and Serbian. Every journey emphasizes punctuality, vehicle comfort, environmental respect, and deep regional knowledge. I look forward to coordinating your travel arrangements with the highest standards of reliability and personal care. (Notice: This profile is a verified synthetic test fixture for IDEMO transaction engine validation.)',
        'approved'::public.partner_profile_review_status,
        false,
        1,
        NOW(),
        NOW(),
        NOW(),
        NOW()
    )
ON CONFLICT (partner_id) DO UPDATE SET
    intro_draft = EXCLUDED.intro_draft,
    intro_published = EXCLUDED.intro_published,
    review_status = EXCLUDED.review_status,
    photo_consent_given = EXCLUDED.photo_consent_given,
    content_version = EXCLUDED.content_version,
    updated_at = NOW();

-- 2. Populate Synthetic Operational Contact on Proven Uvac Eligibility Rows
UPDATE public.recommendation_partner_eligibility
SET
    contact_phone = '+381600000001',
    contact_email = 'uno1.test@idemo.internal',
    updated_at = NOW()
WHERE id = '6921dbd3-cb3a-40f3-b636-229e91d23950'
   OR (partner_id = 'a0000000-0000-0000-0000-000000000091' AND recommendation_id = '4862aa0f-686c-491e-a81a-d9ded2c7a156');

UPDATE public.recommendation_partner_eligibility
SET
    contact_phone = '+381600000002',
    contact_email = 'uno2.test@idemo.internal',
    updated_at = NOW()
WHERE id = '28b88700-d55a-4ed9-81e7-ecdca61a1df1'
   OR (partner_id = 'a0000000-0000-0000-0000-000000000092' AND recommendation_id = '4862aa0f-686c-491e-a81a-d9ded2c7a156');
