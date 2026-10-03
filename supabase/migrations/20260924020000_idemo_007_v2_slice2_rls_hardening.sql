-- IDEMO 007 V2 - SLICE 2 RLS HARDENING MIGRATION
-- Target: Supabase / PostgreSQL
-- Description: Restricts internal entity facts and fact pack cache to authenticated/service_role while preserving public access for entities and components.

-- 1. Drop public read policies on sensitive internal tables
DROP POLICY IF EXISTS select_entity_facts ON public.entity_facts;
DROP POLICY IF EXISTS select_fact_pack_cache ON public.fact_pack_cache;

-- 2. Create restricted read policies for entity_facts (authenticated operators & service_role)
CREATE POLICY authenticated_select_entity_facts ON public.entity_facts 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY service_select_entity_facts ON public.entity_facts 
  FOR SELECT TO service_role USING (true);

-- 3. Create restricted read policies for fact_pack_cache (authenticated operators & service_role)
CREATE POLICY authenticated_select_fact_pack_cache ON public.fact_pack_cache 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY service_select_fact_pack_cache ON public.fact_pack_cache 
  FOR SELECT TO service_role USING (true);
