-- Migration: 20260823000000_canonical_service_areas_code_resolution.sql
-- Description: Establishes stable code column and canonical Serbia service areas with UUID primary keys.

-- 1. Add code column to public.service_areas if absent
ALTER TABLE public.service_areas ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- 2. Non-destructive legacy Belgrade row reconciliation
-- Preserves existing UUID 43ce68cc-5f50-42ba-b3ed-0116adf47b98 while assigning code sa-belgrade-001
UPDATE public.service_areas
SET code = 'sa-belgrade-001',
    name_en = 'Belgrade Metropolitan Area',
    name_sr = 'Beogradska mitropolitanska oblast'
WHERE id = '43ce68cc-5f50-42ba-b3ed-0116adf47b98'
   OR (code IS NULL AND (LOWER(name_en) LIKE '%belgrade%' OR LOWER(name_sr) LIKE '%beograd%'));

-- 3. Idempotently insert/upsert the 6 canonical Serbia service areas
INSERT INTO public.service_areas (id, code, name_en, name_sr)
VALUES
  ('43ce68cc-5f50-42ba-b3ed-0116adf47b98', 'sa-belgrade-001', 'Belgrade Metropolitan Area', 'Beogradska mitropolitanska oblast')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name_en = EXCLUDED.name_en,
  name_sr = EXCLUDED.name_sr;

INSERT INTO public.service_areas (id, code, name_en, name_sr)
VALUES
  ('a1000000-0000-0000-0000-000000000002', 'sa-novisad-002', 'Novi Sad & Vojvodina', 'Novi Sad i Vojvodina'),
  ('a1000000-0000-0000-0000-000000000003', 'sa-west-003', 'Western Serbia & Podrinje', 'Zapadna Srbija i Podrinje'),
  ('a1000000-0000-0000-0000-000000000004', 'sa-sumadija-004', 'Šumadija & Central Serbia', 'Šumadija i Centralna Srbija'),
  ('a1000000-0000-0000-0000-000000000005', 'sa-east-005', 'Eastern Serbia & Lower Danube', 'Istočna Srbija i Donje Podunavlje'),
  ('a1000000-0000-0000-0000-000000000006', 'sa-south-006', 'Niš & Southern Serbia', 'Niš i Južna Srbija')
ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_sr = EXCLUDED.name_sr;
