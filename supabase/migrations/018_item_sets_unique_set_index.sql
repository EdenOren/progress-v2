-- ItemSetsService upserts sets with onConflict 'item_id,set_index'. Postgres
-- only accepts that when a matching unique constraint exists; without it every
-- "Add set" fails with "there is no unique or exclusion constraint matching the
-- ON CONFLICT specification".
--
-- Stops instead of deleting anything if duplicate (item_id, set_index) rows
-- already exist — which copy to keep is a decision, not a migration step.

do $$
declare
  duplicate_count int;
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'item_sets_item_id_set_index_key'
      and conrelid = 'public.item_sets'::regclass
  ) then
    raise notice 'item_sets_item_id_set_index_key already exists, nothing to do';
    return;
  end if;

  select count(*) into duplicate_count
  from (
    select item_id, set_index
    from public.item_sets
    group by item_id, set_index
    having count(*) > 1
  ) as duplicates;

  if duplicate_count > 0 then
    raise exception
      'item_sets has % duplicated (item_id, set_index) pairs; resolve them before adding the constraint',
      duplicate_count;
  end if;

  alter table public.item_sets
    add constraint item_sets_item_id_set_index_key unique (item_id, set_index);
end $$;
