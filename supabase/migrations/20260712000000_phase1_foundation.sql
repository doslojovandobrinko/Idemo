-- IDEMO PARTNER ROUTING ENGINE - PHASE 1: BACKEND FOUNDATION
-- Target Platform: Supabase + PostgreSQL (Cloud Run Hybrid Environment)
-- Version: v1.0.0 (Phase 1 Baseline)
-- Language: PL/pgSQL

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS AND CUSTOM TYPES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.partner_status AS ENUM (
    'invited', 'active', 'paused', 'suspended', 'closed'
);

CREATE TYPE public.moderation_status AS ENUM (
    'proposed', 'approved', 'rejected', 'suspended'
);

CREATE TYPE public.requirement_level AS ENUM (
    'required', 'preferred', 'informational'
);

CREATE TYPE public.inquiry_status AS ENUM (
    'new', 'matching', 'awaiting_visitor', 'confirmed', 'in_progress', 'completed', 'canceled', 'needs_assistance', 'closed'
);

CREATE TYPE public.match_status AS ENUM (
    'offered', 'viewed', 'responded', 'selected', 'not_selected', 'declined', 'expired', 'withdrawn'
);

CREATE TYPE public.candidate_status AS ENUM (
    'queued', 'offered', 'skipped', 'ineligible', 'exhausted'
);

CREATE TYPE public.response_type AS ENUM (
    'accept_as_requested', 'propose_alternative'
);

CREATE TYPE public.partner_response_status AS ENUM (
    'submitted', 'accepted_by_visitor', 'declined_by_visitor', 'withdrawn'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NORMALIZED TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 System Settings and Geography
CREATE TABLE public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en VARCHAR(255) UNIQUE NOT NULL,
    name_sr VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.service_areas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.2 Taxonomy of Capabilities and Languages
CREATE TABLE public.capabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    label_sr VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL, -- 'en', 'sr', 'zh'
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.3 Recommendations (Content Core)
CREATE TABLE public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en VARCHAR(255) NOT NULL,
    title_sr VARCHAR(255) NOT NULL,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.recommendation_capabilities (
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    requirement_level public.requirement_level DEFAULT 'required'::public.requirement_level NOT NULL,
    PRIMARY KEY (recommendation_id, capability_id)
);

-- 2.4 Partners & Portfolio Moderation
CREATE TABLE public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    status public.partner_status DEFAULT 'invited'::public.partner_status NOT NULL,
    is_open_for_inquiries BOOLEAN DEFAULT true NOT NULL,
    paused_until TIMESTAMP WITH TIME ZONE,
    contact_preference VARCHAR(100) DEFAULT 'WhatsApp' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.partner_capabilities (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, capability_id)
);

CREATE TABLE public.partner_languages (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, language_id)
);

CREATE TABLE public.partner_service_areas (
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE CASCADE,
    status public.moderation_status DEFAULT 'proposed'::public.moderation_status NOT NULL,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (partner_id, service_area_id)
);

-- 2.5 Inquiries and Isolated Private Contact Data
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE RESTRICT NOT NULL,
    visitor_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status public.inquiry_status DEFAULT 'new'::public.inquiry_status NOT NULL,
    visitor_notes TEXT NOT NULL,
    preferred_language_id UUID REFERENCES public.languages(id) ON DELETE RESTRICT NOT NULL,
    service_area_id UUID REFERENCES public.service_areas(id) ON DELETE RESTRICT NOT NULL,
    requested_start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    requested_end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Cryptographically secure recovery and tracking without authentication
    public_reference_code VARCHAR(12) UNIQUE NOT NULL, -- Short readable code (e.g., IDM-827-XAA)
    recovery_token_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of secret token
    recovery_token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    recovery_token_revoked_at TIMESTAMP WITH TIME ZONE,
    recovery_token_used_at TIMESTAMP WITH TIME ZONE,
    recovery_failed_attempts INT DEFAULT 0 NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.inquiry_private_contacts (
    inquiry_id UUID PRIMARY KEY REFERENCES public.inquiries(id) ON DELETE CASCADE,
    visitor_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.inquiry_required_capabilities (
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE,
    capability_id UUID REFERENCES public.capabilities(id) ON DELETE CASCADE,
    requirement_level public.requirement_level DEFAULT 'required'::public.requirement_level NOT NULL,
    PRIMARY KEY (inquiry_id, capability_id)
);

-- 2.6 Consent Model
CREATE TABLE public.visitor_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    consent_text_version VARCHAR(50) NOT NULL, -- Version of legal terms at consent time
    purpose VARCHAR(255) NOT NULL, -- e.g. "Release contacts to selected partner"
    channel VARCHAR(100) NOT NULL, -- e.g. "Email and Viber"
    consented_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- 2.7 Immutable Candidate Queue & Matches
CREATE TABLE public.inquiry_candidates (
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
    queue_order INT NOT NULL,
    candidate_status public.candidate_status DEFAULT 'queued'::public.candidate_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (inquiry_id, partner_id),
    CONSTRAINT unique_queue_order UNIQUE (inquiry_id, queue_order)
);

CREATE TABLE public.inquiry_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE CASCADE NOT NULL,
    partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
    status public.match_status DEFAULT 'offered'::public.match_status NOT NULL,
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.8 Partner Responses (Alternative Proposals & Acceptances)
CREATE TABLE public.partner_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.inquiry_matches(id) ON DELETE CASCADE UNIQUE NOT NULL,
    response_type public.response_type NOT NULL,
    message TEXT NOT NULL,
    proposed_start_at TIMESTAMP WITH TIME ZONE,
    proposed_end_at TIMESTAMP WITH TIME ZONE,
    status public.partner_response_status DEFAULT 'submitted'::public.partner_response_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.9 Strict Immutable Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_auth_user_id UUID,
    actor_partner_id UUID,
    actor_role VARCHAR(50) NOT NULL, -- 'visitor_anonymous', 'partner', 'concierge', 'admin', 'system_cron'
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    result VARCHAR(50) DEFAULT 'success' NOT NULL,
    safe_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGERS AND AUDITING SAFETY
-- ─────────────────────────────────────────────────────────────────────────────

-- Prevent updates and deletions on audit logs at the database level
CREATE OR REPLACE FUNCTION public.block_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit zapisi su trajni i nepromenljivi. UPDATE i DELETE operacije su strogo zabranjene.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER secure_audit_logs_immutability
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.block_audit_log_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. EXPLICIT PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Operational constraint: Guarantee at most ONE active offered/viewed match per inquiry
CREATE UNIQUE INDEX unique_active_match_per_inquiry 
ON public.inquiry_matches (inquiry_id) 
WHERE status IN ('offered', 'viewed');

-- Performance Indexes on foreign keys
CREATE INDEX idx_service_areas_parent ON public.service_areas(parent_id);
CREATE INDEX idx_recommendations_area ON public.recommendations(service_area_id);
CREATE INDEX idx_partners_auth_user ON public.partners(auth_user_id);
CREATE INDEX idx_partner_capabilities_cap ON public.partner_capabilities(capability_id);
CREATE INDEX idx_partner_languages_lang ON public.partner_languages(language_id);
CREATE INDEX idx_partner_service_areas_area ON public.partner_service_areas(service_area_id);
CREATE INDEX idx_inquiries_rec ON public.inquiries(recommendation_id);
CREATE INDEX idx_inquiries_visitor ON public.inquiries(visitor_auth_user_id);
CREATE INDEX idx_inquiries_lang ON public.inquiries(preferred_language_id);
CREATE INDEX idx_inquiries_area ON public.inquiries(service_area_id);
CREATE INDEX idx_inquiry_matches_inquiry ON public.inquiry_matches(inquiry_id);
CREATE INDEX idx_inquiry_matches_partner ON public.inquiry_matches(partner_id);
CREATE INDEX idx_partner_responses_match ON public.partner_responses(match_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. IDENTITY HELPERS (SECURITY DEFINER WITH SEARCH_PATH)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_current_partner_id()
RETURNS UUID AS $$
DECLARE
    p_id UUID;
BEGIN
    SELECT id INTO p_id
    FROM public.partners
    WHERE auth_user_id = auth.uid();
    RETURN p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. EXPLICIT GRANTS MATRIX (Defense-in-Depth)
-- ─────────────────────────────────────────────────────────────────────────────

-- Revoke all default privileges from public on tables and functions
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM PUBLIC;

-- Metadata tables (Public Read-Only)
GRANT SELECT ON public.service_areas TO anon, authenticated;
GRANT SELECT ON public.capabilities TO anon, authenticated;
GRANT SELECT ON public.languages TO anon, authenticated;
GRANT SELECT ON public.recommendations TO anon, authenticated;
GRANT SELECT ON public.recommendation_capabilities TO anon, authenticated;

-- Partner Profile & Portfolio Permissions
GRANT SELECT, UPDATE ON public.partners TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_capabilities TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_languages TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.partner_service_areas TO authenticated;

-- Inquiry Lifecycle Permissions
GRANT SELECT ON public.inquiries TO authenticated;
GRANT SELECT ON public.inquiry_required_capabilities TO authenticated;
GRANT SELECT ON public.inquiry_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_responses TO authenticated;

-- Explicitly revoke access to sensitive tables from standard clients (restricted to server-role and SEC DEFINER RPC)
REVOKE ALL ON public.system_settings FROM anon, authenticated;
REVOKE ALL ON public.inquiry_private_contacts FROM anon, authenticated;
REVOKE ALL ON public.visitor_consents FROM anon, authenticated;
REVOKE ALL ON public.inquiry_candidates FROM anon, authenticated;
REVOKE ALL ON public.audit_logs FROM anon, authenticated;

-- Grant EXECUTE privileges on helpers
GRANT EXECUTE ON FUNCTION public.get_current_partner_id() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all operational and business tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_private_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_required_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiry_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Public Read-Only Metadata Policies
CREATE POLICY select_public_service_areas ON public.service_areas
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY select_public_capabilities ON public.capabilities
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY select_public_languages ON public.languages
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY select_public_recommendations ON public.recommendations
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY select_public_rec_capabilities ON public.recommendation_capabilities
    FOR SELECT TO anon, authenticated USING (true);

-- 7.2 Partner Profile & Portfolio Policies
CREATE POLICY select_own_partner_profile ON public.partners
    FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY update_own_partner_profile ON public.partners
    FOR UPDATE TO authenticated 
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY select_own_partner_capabilities ON public.partner_capabilities
    FOR SELECT TO authenticated 
    USING (partner_id = public.get_current_partner_id());

CREATE POLICY insert_own_partner_capabilities ON public.partner_capabilities
    FOR INSERT TO authenticated 
    WITH CHECK (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

CREATE POLICY delete_own_partner_capabilities ON public.partner_capabilities
    FOR DELETE TO authenticated 
    USING (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

CREATE POLICY select_own_partner_languages ON public.partner_languages
    FOR SELECT TO authenticated 
    USING (partner_id = public.get_current_partner_id());

CREATE POLICY insert_own_partner_languages ON public.partner_languages
    FOR INSERT TO authenticated 
    WITH CHECK (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

CREATE POLICY delete_own_partner_languages ON public.partner_languages
    FOR DELETE TO authenticated 
    USING (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

CREATE POLICY select_own_partner_service_areas ON public.partner_service_areas
    FOR SELECT TO authenticated 
    USING (partner_id = public.get_current_partner_id());

CREATE POLICY insert_own_partner_service_areas ON public.partner_service_areas
    FOR INSERT TO authenticated 
    WITH CHECK (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

CREATE POLICY delete_own_partner_service_areas ON public.partner_service_areas
    FOR DELETE TO authenticated 
    USING (partner_id = public.get_current_partner_id() AND status = 'proposed'::public.moderation_status);

-- 7.3 Inquiry & Lifecycle Policies
CREATE POLICY select_own_visitor_inquiries ON public.inquiries
    FOR SELECT TO authenticated 
    USING (visitor_auth_user_id = auth.uid());

CREATE POLICY select_matched_partner_inquiries ON public.inquiries
    FOR SELECT TO authenticated 
    USING (id IN (
        SELECT inquiry_id 
        FROM public.inquiry_matches 
        WHERE partner_id = public.get_current_partner_id()
    ));

CREATE POLICY select_own_visitor_private_contacts ON public.inquiry_private_contacts
    FOR SELECT TO authenticated 
    USING (inquiry_id IN (
        SELECT id 
        FROM public.inquiries 
        WHERE visitor_auth_user_id = auth.uid()
    ));

CREATE POLICY select_required_capabilities ON public.inquiry_required_capabilities
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY select_own_partner_matches ON public.inquiry_matches
    FOR SELECT TO authenticated 
    USING (partner_id = public.get_current_partner_id());

CREATE POLICY update_own_partner_matches ON public.inquiry_matches
    FOR UPDATE TO authenticated 
    USING (partner_id = public.get_current_partner_id())
    WITH CHECK (partner_id = public.get_current_partner_id());

CREATE POLICY select_own_partner_responses ON public.partner_responses
    FOR SELECT TO authenticated 
    USING (match_id IN (
        SELECT id 
        FROM public.inquiry_matches 
        WHERE partner_id = public.get_current_partner_id()
    ));

CREATE POLICY insert_own_partner_responses ON public.partner_responses
    FOR INSERT TO authenticated 
    WITH CHECK (match_id IN (
        SELECT id 
        FROM public.inquiry_matches 
        WHERE partner_id = public.get_current_partner_id()
    ));

CREATE POLICY update_own_partner_responses ON public.partner_responses
    FOR UPDATE TO authenticated 
    USING (match_id IN (
        SELECT id 
        FROM public.inquiry_matches 
        WHERE partner_id = public.get_current_partner_id()
    ) AND status = 'submitted'::public.partner_response_status)
    WITH CHECK (match_id IN (
        SELECT id 
        FROM public.inquiry_matches 
        WHERE partner_id = public.get_current_partner_id()
    ));
