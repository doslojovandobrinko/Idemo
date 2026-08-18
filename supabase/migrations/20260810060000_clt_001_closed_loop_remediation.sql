-- Migration: 20260810060000_clt_001_closed_loop_remediation.sql
-- Description: CLT-001 Closed-Loop Transaction Remediation: Visitor contact isolation & partner professional contact

-- 1. Add professional contact columns to public.partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS contact_phone TEXT NULL;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS contact_email TEXT NULL;

-- 2. RPC to update partner professional contact
CREATE OR REPLACE FUNCTION public.update_partner_professional_contact_secure(
  p_partner_id UUID,
  p_contact_phone TEXT,
  p_contact_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.partners
  SET contact_phone = NULLIF(TRIM(p_contact_phone), ''),
      contact_email = NULLIF(TRIM(p_contact_email), '')
  WHERE id = p_partner_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'message', 'Professional contact details updated successfully.'
  );
END;
$$ SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.update_partner_professional_contact_secure(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_professional_contact_secure(UUID, TEXT, TEXT) TO service_role;

-- 3. Update get_partner_opportunities_secure to enforce Visitor Contact Isolation
-- Removes email and phone_number from visitor_contact payload provided to partners.
CREATE OR REPLACE FUNCTION public.get_partner_opportunities_secure(
    p_partner_id UUID,
    p_scope TEXT DEFAULT 'new'
)
RETURNS JSONB AS $$
DECLARE
    v_opportunities JSONB;
    v_must_change BOOLEAN;
BEGIN
    SELECT must_change_pin INTO v_must_change FROM public.partners WHERE id = p_partner_id;
    IF v_must_change IS TRUE THEN
        RETURN pg_catalog.jsonb_build_object(
            'success', false,
            'code', 'PIN_CHANGE_REQUIRED',
            'message', 'You must replace your temporary PIN before continuing.'
        );
    END IF;

    IF p_scope = 'new' THEN
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'visitor_notes', i.visitor_notes,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'offered_at', m.offered_at,
                'expires_at', m.expires_at,
                'viewed_at', m.viewed_at,
                'match_status', m.status,
                'inquiry_status', i.status
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND m.status IN ('offered'::public.match_status, 'viewed'::public.match_status)
          AND m.expires_at > timezone('utc'::text, now())
          AND i.status IN ('matching'::public.inquiry_status, 'new'::public.inquiry_status);

    ELSIF p_scope = 'active' THEN
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'visitor_notes', i.visitor_notes,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'offered_at', m.offered_at,
                'expires_at', m.expires_at,
                'match_status', m.status,
                'inquiry_status', i.status,
                'visitor_contact', CASE WHEN i.status = 'confirmed'::public.inquiry_status THEN (
                    SELECT pg_catalog.jsonb_build_object(
                        'visitor_name', c.visitor_name
                    ) FROM public.inquiry_private_contacts c WHERE c.inquiry_id = i.id
                ) ELSE NULL END
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND (m.status IN ('responded'::public.match_status, 'selected'::public.match_status)
               OR i.status IN ('awaiting_visitor'::public.inquiry_status, 'confirmed'::public.inquiry_status, 'in_progress'::public.inquiry_status));

    ELSE -- 'history'
        SELECT pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
                'match_id', m.id,
                'inquiry_id', i.id,
                'public_reference_code', i.public_reference_code,
                'recommendation_id', r.id,
                'recommendation_title', r.title_en,
                'requested_start_at', i.requested_start_at,
                'requested_end_at', i.requested_end_at,
                'created_at', i.created_at,
                'match_status', m.status,
                'inquiry_status', i.status
            )
        ) INTO v_opportunities
        FROM public.inquiry_matches m
        JOIN public.inquiries i ON i.id = m.inquiry_id
        JOIN public.recommendations r ON r.id = i.recommendation_id
        WHERE m.partner_id = p_partner_id
          AND (m.status IN ('declined'::public.match_status, 'expired'::public.match_status, 'withdrawn'::public.match_status, 'not_selected'::public.match_status)
               OR i.status IN ('completed'::public.inquiry_status, 'closed'::public.inquiry_status, 'canceled'::public.inquiry_status));
    END IF;

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'opportunities', COALESCE(v_opportunities, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.get_partner_opportunities_secure(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_opportunities_secure(UUID, TEXT) TO service_role;
