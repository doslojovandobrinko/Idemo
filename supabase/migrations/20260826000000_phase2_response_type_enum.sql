-- IDEMO PARTNER ROUTING ENGINE - PHASE 2 RESPONSE TYPE ENUM EXTENSION
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.3.2

ALTER TYPE public.response_type ADD VALUE IF NOT EXISTS 'counter_by_visitor';
