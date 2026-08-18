-- IDEMO V9 FINAL FORWARD PG_CATALOG.TRIM REMEDIATION
-- Additive Forward-Only Migration File: 20260811010000_v9_final_pg_catalog_trim_remediation.sql
-- Work Package: V9-MIG-01 Final Forward pg_catalog.trim Remediation
-- Purpose: Inspect public-schema functions for invalid pg_catalog.trim calls and replace with pg_catalog.btrim idempotently.

DO $v9trim$
DECLARE
  v_rec RECORD;
  v_func_def TEXT;
  v_remediated_def TEXT;
  v_updated_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT
      p.oid,
      p.proname,
      n.nspname,
      pg_catalog.pg_get_functiondef(p.oid) AS func_def
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n
      ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND pg_catalog.pg_get_functiondef(p.oid) LIKE '%pg_catalog.trim(%'
  LOOP
    v_func_def := v_rec.func_def;

    v_remediated_def := pg_catalog.replace(
      v_func_def,
      'pg_catalog.trim(',
      'pg_catalog.btrim('
    );

    EXECUTE v_remediated_def;
    v_updated_count := v_updated_count + 1;

    RAISE NOTICE
      'Remediated function public.% (OID %) from pg_catalog.trim to pg_catalog.btrim',
      v_rec.proname,
      v_rec.oid;
  END LOOP;

  IF v_updated_count > 0 THEN
    NOTIFY pgrst, 'reload schema';
    RAISE NOTICE
      'Remediated % public function(s) containing pg_catalog.trim',
      v_updated_count;
  ELSE
    RAISE NOTICE
      'No public functions found containing pg_catalog.trim - zero mutations required';
  END IF;
END;
$v9trim$;