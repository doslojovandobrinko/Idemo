-- Resolve PostgREST overload ambiguity by preserving the newer
-- reservation-aware create RPC under the canonical name.

do $$
begin
  if to_regprocedure(
    'public.submit_recommendation_create_secure(uuid,uuid,jsonb,text,uuid)'
  ) is not null
  and to_regprocedure(
    'public.submit_recommendation_create_secure_legacy(uuid,uuid,jsonb,text,uuid)'
  ) is null then
    alter function public.submit_recommendation_create_secure(
      uuid,
      uuid,
      jsonb,
      text,
      uuid
    )
    rename to submit_recommendation_create_secure_legacy;
  end if;
end
$$;

-- Allow authenticated Studio users to call the active create RPC.

grant execute on function public.submit_recommendation_create_secure(
  uuid,
  uuid,
  jsonb,
  text,
  uuid,
  uuid
)
to authenticated;

-- Allow authenticated Studio users to read their draft work items.

grant select on table public.editorial_work_items
to authenticated;

-- RLS policy for restoring only the current user's own drafts.

drop policy if exists
  "Authenticated users read own editorial work items"
on public.editorial_work_items;

create policy
  "Authenticated users read own editorial work items"
on public.editorial_work_items
for select
to authenticated
using (
  submitted_by_id = auth.uid()
);

-- Refresh PostgREST's schema cache.

notify pgrst, 'reload schema';