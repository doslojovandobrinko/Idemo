-- IDEMO Authoritative Community Activity Feed RPC Migration
-- Work Package: WP-14C4A
-- Migration File: 20260803000003_wp14c4a_authoritative_community_feed.sql
-- Target Platform: Supabase + PostgreSQL
-- Version: v1.0.0

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER RPC: public.get_authoritative_community_events_secure()
-- Returns presentation-safe public events for the Community Overview feed.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_authoritative_community_events_secure()
RETURNS TABLE (
    event_id TEXT,
    event_type VARCHAR(100),
    occurred_at TIMESTAMPTZ,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    destination_id VARCHAR(100),
    title_en TEXT,
    title_sr TEXT,
    summary_en TEXT,
    summary_sr TEXT,
    safe_category VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_seven_days TIMESTAMPTZ := timezone('utc'::text, now()) - INTERVAL '7 days';
    v_thirty_days TIMESTAMPTZ := timezone('utc'::text, now()) - INTERVAL '30 days';
    v_recent_count INT;
BEGIN
    -- Count eligible events in the last 7 days
    SELECT COUNT(*) INTO v_recent_count
    FROM (
        SELECT r.id::text FROM public.recommendations r WHERE r.is_published = true AND COALESCE(r.updated_at, r.created_at) >= v_seven_days
        UNION ALL
        SELECT p.id::text FROM public.partners p WHERE p.status IN ('active', 'verified', 'approved') AND COALESCE(p.updated_at, p.created_at) >= v_seven_days
        UNION ALL
        SELECT e.id::text FROM public.editorial_work_item_events e 
        JOIN public.editorial_work_items w ON w.id = e.work_item_id
        WHERE (e.new_review_status = 'approved' OR e.new_publication_status = 'published')
          AND e.created_at >= v_seven_days
    ) sub;

    IF v_recent_count >= 3 THEN
        RETURN QUERY
        WITH raw_events AS (
            -- Published Recommendations
            SELECT 
                'rec-' || r.id::text AS event_id,
                'NEW_REC'::VARCHAR(100) AS event_type,
                COALESCE(r.updated_at, r.created_at) AS occurred_at,
                'recommendation'::VARCHAR(100) AS entity_type,
                COALESCE(r.source_id, r.id::text) AS entity_id,
                'serbia'::VARCHAR(100) AS destination_id,
                r.title_en::TEXT AS title_en,
                COALESCE(r.title_sr, r.title_en)::TEXT AS title_sr,
                COALESCE(r.short_description_en, r.title_en)::TEXT AS summary_en,
                COALESCE(r.short_description_sr, r.short_description_en, r.title_en)::TEXT AS summary_sr,
                COALESCE(r.category, 'Nature')::VARCHAR(100) AS safe_category
            FROM public.recommendations r
            WHERE r.is_published = true AND COALESCE(r.updated_at, r.created_at) >= v_seven_days

            UNION ALL

            -- Active / Verified Partners
            SELECT 
                'partner-' || p.id::text AS event_id,
                'NEW_PARTNER'::VARCHAR(100) AS event_type,
                COALESCE(p.updated_at, p.created_at) AS occurred_at,
                'partner'::VARCHAR(100) AS entity_type,
                p.id::text AS entity_id,
                'serbia'::VARCHAR(100) AS destination_id,
                p.name::TEXT AS title_en,
                p.name::TEXT AS title_sr,
                'Verified partner profile active in IDEMO Serbia Network.'::TEXT AS summary_en,
                'Provereni partnerski profil aktivan u IDEMO mreži Srbije.'::TEXT AS summary_sr,
                'Verified Partner'::VARCHAR(100) AS safe_category
            FROM public.partners p
            WHERE p.status IN ('active', 'verified', 'approved') AND COALESCE(p.updated_at, p.created_at) >= v_seven_days

            UNION ALL

            -- Approved / Published Workflow Events
            SELECT 
                'wkf-' || e.id::text AS event_id,
                CASE 
                    WHEN w.entity_type = 'recommendation' THEN 'UPDATED_REC'
                    WHEN w.entity_type = 'partner_portfolio' THEN 'NEW_PARTNER'
                    WHEN w.entity_type = 'destination_package' THEN 'PACKAGE_RELEASE'
                    ELSE 'UPDATED_REC'
                END::VARCHAR(100) AS event_type,
                e.created_at AS occurred_at,
                w.entity_type::VARCHAR(100) AS entity_type,
                COALESCE(w.entity_id, w.id::text) AS entity_id,
                COALESCE(w.scope_id, 'serbia')::VARCHAR(100) AS destination_id,
                COALESCE(w.item_key, 'Editorial Work Item Approved')::TEXT AS title_en,
                COALESCE(w.item_key, 'Odobrena urednička stavka')::TEXT AS title_sr,
                'Verified operational details and compliance with the IDEMO premium standard.'::TEXT AS summary_en,
                'Verifikovani operativni detalji i usklađenost sa IDEMO premijum standardom.'::TEXT AS summary_sr,
                'Editorial Notice'::VARCHAR(100) AS safe_category
            FROM public.editorial_work_item_events e
            JOIN public.editorial_work_items w ON w.id = e.work_item_id
            WHERE (e.new_review_status = 'approved' OR e.new_publication_status = 'published')
              AND e.created_at >= v_seven_days
        ),
        deduped AS (
            SELECT DISTINCT ON (re.entity_id, re.event_type) re.*
            FROM raw_events re
            ORDER BY re.entity_id, re.event_type, re.occurred_at DESC
        )
        SELECT d.event_id, d.event_type, d.occurred_at, d.entity_type, d.entity_id, d.destination_id, d.title_en, d.title_sr, d.summary_en, d.summary_sr, d.safe_category
        FROM deduped d
        ORDER BY d.occurred_at DESC
        LIMIT 6;
    ELSE
        -- Fallback to 30 days window if fewer than 3 items in 7 days
        SELECT COUNT(*) INTO v_recent_count
        FROM (
            SELECT r.id::text FROM public.recommendations r WHERE r.is_published = true AND COALESCE(r.updated_at, r.created_at) >= v_thirty_days
            UNION ALL
            SELECT p.id::text FROM public.partners p WHERE p.status IN ('active', 'verified', 'approved') AND COALESCE(p.updated_at, p.created_at) >= v_thirty_days
            UNION ALL
            SELECT e.id::text FROM public.editorial_work_item_events e 
            JOIN public.editorial_work_items w ON w.id = e.work_item_id
            WHERE (e.new_review_status = 'approved' OR e.new_publication_status = 'published')
              AND e.created_at >= v_thirty_days
        ) sub30;

        IF v_recent_count >= 1 THEN
            RETURN QUERY
            WITH raw_events AS (
                SELECT 
                    'rec-' || r.id::text AS event_id,
                    'NEW_REC'::VARCHAR(100) AS event_type,
                    COALESCE(r.updated_at, r.created_at) AS occurred_at,
                    'recommendation'::VARCHAR(100) AS entity_type,
                    COALESCE(r.source_id, r.id::text) AS entity_id,
                    'serbia'::VARCHAR(100) AS destination_id,
                    r.title_en::TEXT AS title_en,
                    COALESCE(r.title_sr, r.title_en)::TEXT AS title_sr,
                    COALESCE(r.short_description_en, r.title_en)::TEXT AS summary_en,
                    COALESCE(r.short_description_sr, r.short_description_en, r.title_en)::TEXT AS summary_sr,
                    COALESCE(r.category, 'Nature')::VARCHAR(100) AS safe_category
                FROM public.recommendations r
                WHERE r.is_published = true AND COALESCE(r.updated_at, r.created_at) >= v_thirty_days

                UNION ALL

                SELECT 
                    'partner-' || p.id::text AS event_id,
                    'NEW_PARTNER'::VARCHAR(100) AS event_type,
                    COALESCE(p.updated_at, p.created_at) AS occurred_at,
                    'partner'::VARCHAR(100) AS entity_type,
                    p.id::text AS entity_id,
                    'serbia'::VARCHAR(100) AS destination_id,
                    p.name::TEXT AS title_en,
                    p.name::TEXT AS title_sr,
                    'Verified partner profile active in IDEMO Serbia Network.'::TEXT AS summary_en,
                    'Provereni partnerski profil aktivan u IDEMO mreži Srbije.'::TEXT AS summary_sr,
                    'Verified Partner'::VARCHAR(100) AS safe_category
                FROM public.partners p
                WHERE p.status IN ('active', 'verified', 'approved') AND COALESCE(p.updated_at, p.created_at) >= v_thirty_days

                UNION ALL

                SELECT 
                    'wkf-' || e.id::text AS event_id,
                    CASE 
                        WHEN w.entity_type = 'recommendation' THEN 'UPDATED_REC'
                        WHEN w.entity_type = 'partner_portfolio' THEN 'NEW_PARTNER'
                        WHEN w.entity_type = 'destination_package' THEN 'PACKAGE_RELEASE'
                        ELSE 'UPDATED_REC'
                    END::VARCHAR(100) AS event_type,
                    e.created_at AS occurred_at,
                    w.entity_type::VARCHAR(100) AS entity_type,
                    COALESCE(w.entity_id, w.id::text) AS entity_id,
                    COALESCE(w.scope_id, 'serbia')::VARCHAR(100) AS destination_id,
                    COALESCE(w.item_key, 'Editorial Work Item Approved')::TEXT AS title_en,
                    COALESCE(w.item_key, 'Odobrena urednička stavka')::TEXT AS title_sr,
                    'Verified operational details and compliance with the IDEMO premium standard.'::TEXT AS summary_en,
                    'Verifikovani operativni detalji i usklađenost sa IDEMO premijum standardom.'::TEXT AS summary_sr,
                    'Editorial Notice'::VARCHAR(100) AS safe_category
                FROM public.editorial_work_item_events e
                JOIN public.editorial_work_items w ON w.id = e.work_item_id
                WHERE (e.new_review_status = 'approved' OR e.new_publication_status = 'published')
                  AND e.created_at >= v_thirty_days
            ),
            deduped AS (
                SELECT DISTINCT ON (re.entity_id, re.event_type) re.*
                FROM raw_events re
                ORDER BY re.entity_id, re.event_type, re.occurred_at DESC
            )
            SELECT d.event_id, d.event_type, d.occurred_at, d.entity_type, d.entity_id, d.destination_id, d.title_en, d.title_sr, d.summary_en, d.summary_sr, d.safe_category
            FROM deduped d
            ORDER BY d.occurred_at DESC
            LIMIT 6;
        ELSE
            -- Final fallback: All published/approved items regardless of age
            RETURN QUERY
            WITH raw_events AS (
                SELECT 
                    'rec-' || r.id::text AS event_id,
                    'NEW_REC'::VARCHAR(100) AS event_type,
                    COALESCE(r.updated_at, r.created_at, timezone('utc'::text, now())) AS occurred_at,
                    'recommendation'::VARCHAR(100) AS entity_type,
                    COALESCE(r.source_id, r.id::text) AS entity_id,
                    'serbia'::VARCHAR(100) AS destination_id,
                    r.title_en::TEXT AS title_en,
                    COALESCE(r.title_sr, r.title_en)::TEXT AS title_sr,
                    COALESCE(r.short_description_en, r.title_en)::TEXT AS summary_en,
                    COALESCE(r.short_description_sr, r.short_description_en, r.title_en)::TEXT AS summary_sr,
                    COALESCE(r.category, 'Nature')::VARCHAR(100) AS safe_category
                FROM public.recommendations r
                WHERE r.is_published = true

                UNION ALL

                SELECT 
                    'partner-' || p.id::text AS event_id,
                    'NEW_PARTNER'::VARCHAR(100) AS event_type,
                    COALESCE(p.updated_at, p.created_at, timezone('utc'::text, now())) AS occurred_at,
                    'partner'::VARCHAR(100) AS entity_type,
                    p.id::text AS entity_id,
                    'serbia'::VARCHAR(100) AS destination_id,
                    p.name::TEXT AS title_en,
                    p.name::TEXT AS title_sr,
                    'Verified partner profile active in IDEMO Serbia Network.'::TEXT AS summary_en,
                    'Provereni partnerski profil aktivan u IDEMO mreži Srbije.'::TEXT AS summary_sr,
                    'Verified Partner'::VARCHAR(100) AS safe_category
                FROM public.partners p
                WHERE p.status IN ('active', 'verified', 'approved')

                UNION ALL

                SELECT 
                    'wkf-' || e.id::text AS event_id,
                    CASE 
                        WHEN w.entity_type = 'recommendation' THEN 'UPDATED_REC'
                        WHEN w.entity_type = 'partner_portfolio' THEN 'NEW_PARTNER'
                        WHEN w.entity_type = 'destination_package' THEN 'PACKAGE_RELEASE'
                        ELSE 'UPDATED_REC'
                    END::VARCHAR(100) AS event_type,
                    e.created_at AS occurred_at,
                    w.entity_type::VARCHAR(100) AS entity_type,
                    COALESCE(w.entity_id, w.id::text) AS entity_id,
                    COALESCE(w.scope_id, 'serbia')::VARCHAR(100) AS destination_id,
                    COALESCE(w.item_key, 'Editorial Work Item Approved')::TEXT AS title_en,
                    COALESCE(w.item_key, 'Odobrena urednička stavka')::TEXT AS title_sr,
                    'Verified operational details and compliance with the IDEMO premium standard.'::TEXT AS summary_en,
                    'Verifikovani operativni detalji i usklađenost sa IDEMO premijum standardom.'::TEXT AS summary_sr,
                    'Editorial Notice'::VARCHAR(100) AS safe_category
                FROM public.editorial_work_item_events e
                JOIN public.editorial_work_items w ON w.id = e.work_item_id
                WHERE (e.new_review_status = 'approved' OR e.new_publication_status = 'published')
            ),
            deduped AS (
                SELECT DISTINCT ON (re.entity_id, re.event_type) re.*
                FROM raw_events re
                ORDER BY re.entity_id, re.event_type, re.occurred_at DESC
            )
            SELECT d.event_id, d.event_type, d.occurred_at, d.entity_type, d.entity_id, d.destination_id, d.title_en, d.title_sr, d.summary_en, d.summary_sr, d.safe_category
            FROM deduped d
            ORDER BY d.occurred_at DESC
            LIMIT 6;
        END IF;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_authoritative_community_events_secure() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_authoritative_community_events_secure() TO anon, authenticated, service_role;
