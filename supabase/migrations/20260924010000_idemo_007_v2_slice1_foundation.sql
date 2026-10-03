-- IDEMO 007 V2 - SLICE 1 DATA FOUNDATION MIGRATION
-- Target: Supabase / PostgreSQL
-- Description: Introduces idemo_entities, entity_facts, recommendation_components, and fact_pack_cache

-- 1. IDEMO ENTITIES
CREATE TABLE IF NOT EXISTS public.idemo_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('PLACE', 'ACCOMMODATION', 'RESTAURANT', 'GUIDE', 'TRANSPORT', 'EXPERIENCE_PROVIDER')),
  canonical_name TEXT NOT NULL,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  trust_level TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (trust_level IN ('UNVERIFIED', 'IDEMO_VERIFIED', 'STRATEGIC_PARTNER')),
  verification_status TEXT NOT NULL DEFAULT 'PENDING',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ENTITY FACTS
CREATE TABLE IF NOT EXISTS public.entity_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.idemo_entities(id) ON DELETE CASCADE,
  fact_key TEXT NOT NULL,
  fact_value JSONB NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('CURATOR', 'PARTNER', 'PRIMARY_OFFICIAL', 'MAPS', 'SEARCH_GROUNDED', 'SECONDARY_REFERENCE')),
  source_url TEXT,
  source_title TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  volatility TEXT NOT NULL DEFAULT 'STATIC' CHECK (volatility IN ('STATIC', 'LOW', 'MEDIUM', 'HIGH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_facts_entity_key ON public.entity_facts (entity_id, fact_key);

-- 3. RECOMMENDATION COMPONENTS (References canonical public.recommendations table)
CREATE TABLE IF NOT EXISTS public.recommendation_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES public.idemo_entities(id) ON DELETE RESTRICT,
  stop_order INT NOT NULL,
  component_role TEXT NOT NULL DEFAULT 'PRIMARY_STOP' CHECK (component_role IN ('PRIMARY_STOP', 'SECONDARY_STOP', 'OVERNIGHT', 'MEAL', 'GUIDE', 'TRANSPORT', 'OTHER')),
  is_optional BOOLEAN NOT NULL DEFAULT false,
  recommended_duration_minutes INT,
  is_overnight_stay BOOLEAN NOT NULL DEFAULT false,
  curator_note TEXT,
  travel_from_previous_minutes INT,
  distance_from_previous_km NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unq_rec_component_stop_order UNIQUE (recommendation_id, stop_order)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_components_rec_id ON public.recommendation_components (recommendation_id);

-- 4. FACT PACK CACHE
CREATE TABLE IF NOT EXISTS public.fact_pack_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  recommendation_type TEXT NOT NULL,
  fact_pack JSONB NOT NULL,
  source_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_fact_pack_cache_key ON public.fact_pack_cache (cache_key);

-- 5. ROW LEVEL SECURITY
ALTER TABLE public.idemo_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_pack_cache ENABLE ROW LEVEL SECURITY;

-- Read policies for public access
CREATE POLICY select_idemo_entities ON public.idemo_entities FOR SELECT TO public USING (true);
CREATE POLICY select_entity_facts ON public.entity_facts FOR SELECT TO public USING (true);
CREATE POLICY select_recommendation_components ON public.recommendation_components FOR SELECT TO public USING (true);
CREATE POLICY select_fact_pack_cache ON public.fact_pack_cache FOR SELECT TO public USING (true);

-- Write policies restricted to service_role / authenticated studio operators
CREATE POLICY service_write_idemo_entities ON public.idemo_entities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_write_entity_facts ON public.entity_facts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_write_recommendation_components ON public.recommendation_components FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_write_fact_pack_cache ON public.fact_pack_cache FOR ALL TO service_role USING (true) WITH CHECK (true);
