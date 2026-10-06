-- IDEMO MOCK PARTNER TAXONOMY EXPANSION
-- Migration: 20261006020000_enable_mock_partners_all_service_areas.sql
-- Description: Approves taxonomy service areas and languages for test/mock partners (UNO1, UNO2, UNO3) across all service areas in Serbia.

INSERT INTO public.partner_service_areas (partner_id, service_area_id, status)
SELECT p.id, sa.id, 'approved'::public.moderation_status
FROM (
    SELECT 'a0000000-0000-0000-0000-000000000099'::uuid as id UNION ALL
    SELECT 'a0000000-0000-0000-0000-000000000091'::uuid UNION ALL
    SELECT 'a0000000-0000-0000-0000-000000000092'::uuid
) p
CROSS JOIN public.service_areas sa
ON CONFLICT (partner_id, service_area_id) DO UPDATE SET status = 'approved'::public.moderation_status;

INSERT INTO public.partner_languages (partner_id, language_id, status)
SELECT p.id, l.id, 'approved'::public.moderation_status
FROM (
    SELECT 'a0000000-0000-0000-0000-000000000099'::uuid as id UNION ALL
    SELECT 'a0000000-0000-0000-0000-000000000091'::uuid UNION ALL
    SELECT 'a0000000-0000-0000-0000-000000000092'::uuid
) p
CROSS JOIN public.languages l
ON CONFLICT (partner_id, language_id) DO UPDATE SET status = 'approved'::public.moderation_status;
