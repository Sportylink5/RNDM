-- RNDM Chat v23 — REAL RANDOM CHAT / MATCHMAKING
-- Run AFTER v22 (or use supabase_FULL_v23.sql on a fresh database).

create table if not exists public.random_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check(status in ('waiting','matched')),
  matched_user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists random_queue_status_idx on public.random_queue(status,updated_at);

alter table public.random_queue enable row level security;

drop policy if exists random_queue_read_own on public.random_queue;
create policy random_queue_read_own on public.random_queue
for select to authenticated using(user_id=auth.uid());

grant select on public.random_queue to authenticated;

create or replace function public.random_chat_join()
returns table(match_status text, conversation_id uuid, matched_user_id uuid)
language plpgsql
security definer
set search_path=public
as $$
declare
  me uuid := auth.uid();
  other_user uuid;
  cid uuid;
  existing public.random_queue%rowtype;
begin
  if me is null then raise exception 'not authenticated'; end if;

  -- Serialize matchmaking to avoid two users being matched twice at the same moment.
  perform pg_advisory_xact_lock(83920417);

  -- Old abandoned searches stop participating automatically.
  delete from public.random_queue
  where (status='waiting' and updated_at < now() - interval '3 minutes')
     or (status='matched' and updated_at < now() - interval '15 minutes');

  select * into existing from public.random_queue where user_id=me;
  if found and existing.status='matched' and existing.conversation_id is not null then
    return query select 'matched'::text, existing.conversation_id, existing.matched_user_id;
    return;
  end if;

  insert into public.random_queue(user_id,status,matched_user_id,conversation_id,joined_at,updated_at)
  values(me,'waiting',null,null,now(),now())
  on conflict(user_id) do update set
    status='waiting', matched_user_id=null, conversation_id=null, joined_at=now(), updated_at=now();

  select q.user_id into other_user
  from public.random_queue q
  where q.user_id<>me
    and q.status='waiting'
    and q.updated_at >= now() - interval '3 minutes'
    and not exists (
      select 1 from public.friendships f
      where f.status='blocked'
        and ((f.requester=me and f.addressee=q.user_id) or (f.requester=q.user_id and f.addressee=me))
    )
  order by q.joined_at asc
  limit 1;

  if other_user is null then
    return query select 'waiting'::text, null::uuid, null::uuid;
    return;
  end if;

  cid := public.get_or_create_direct(other_user);

  update public.random_queue set
    status='matched', matched_user_id=other_user, conversation_id=cid, updated_at=now()
  where user_id=me;

  update public.random_queue set
    status='matched', matched_user_id=me, conversation_id=cid, updated_at=now()
  where user_id=other_user;

  return query select 'matched'::text, cid, other_user;
end $$;

create or replace function public.random_chat_leave()
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then return; end if;
  delete from public.random_queue where user_id=auth.uid();
end $$;

create or replace function public.random_waiting_count()
returns bigint
language sql
stable
security definer
set search_path=public
as $$
  select count(*)::bigint from public.random_queue
  where status='waiting' and updated_at >= now() - interval '3 minutes';
$$;

grant execute on function public.random_chat_join() to authenticated;
grant execute on function public.random_chat_leave() to authenticated;
grant execute on function public.random_waiting_count() to authenticated;

DO $$
begin
  if not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='random_queue'
  ) then
    alter publication supabase_realtime add table public.random_queue;
  end if;
end $$;
