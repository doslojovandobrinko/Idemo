-- Replace invalid schema-qualified pg_catalog.trim(text)
-- calls inside public database functions with pg_catalog.btrim(text).

do $$
declare
  fn record;
  corrected_definition text;
begin
  for fn in
    select
      p.oid,
      pg_get_functiondef(p.oid) as function_definition
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and position(
        'pg_catalog.trim(' in pg_get_functiondef(p.oid)
      ) > 0
  loop
    corrected_definition := replace(
      fn.function_definition,
      'pg_catalog.trim(',
      'pg_catalog.btrim('
    );

    execute corrected_definition;
  end loop;
end
$$;

notify pgrst, 'reload schema';