-- Progres belajar pengguna (PRD §7, §8.7, §11.3).
-- Ditulis klien hanya lewat RPC merge_progress; RLS membatasi ke baris sendiri.

create table public.user_progress (
  user_id     uuid not null references auth.users on delete cascade,
  item_type   text not null check (item_type in ('lesson', 'quiz')),
  item_id     text not null,
  status      text not null check (status in ('started', 'completed')),
  first_score smallint check (first_score between 0 and 5),
  best_score  smallint check (best_score between 0 and 5),
  attempts    int not null default 0 check (attempts >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, item_type, item_id),
  check (
    (item_type = 'lesson' and item_id ~ '^L[0-9]{3}$')
    or (item_type = 'quiz' and item_id ~ '^L[0-9]{3}\.quiz(\.[0-9]+)?$')
  )
);

alter table public.user_progress enable row level security;
revoke all on public.user_progress from anon, authenticated;
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.user_progress to service_role;

create policy "user_progress: baca milik sendiri" on public.user_progress
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_progress: tambah milik sendiri" on public.user_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_progress: ubah milik sendiri" on public.user_progress
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_progress: hapus milik sendiri" on public.user_progress
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Gabungkan progres dari browser. Aman diulang: nilai terbesar menang,
-- status 'completed' menang, waktu diisi server. Berjalan sebagai pemanggil
-- (security invoker), jadi RLS tetap berlaku.
-- items: [{item_type, item_id, status, first_score, best_score, attempts}]
create function public.merge_progress(items jsonb)
returns setof public.user_progress
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'merge_progress: harus login' using errcode = '42501';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 500 then
    raise exception 'merge_progress: items harus array berisi maksimal 500 item' using errcode = '22023';
  end if;

  return query
  insert into public.user_progress as p
    (user_id, item_type, item_id, status, first_score, best_score, attempts, updated_at)
  select uid, i.item_type, i.item_id, i.status, i.first_score, i.best_score,
         coalesce(i.attempts, 0), now()
  from jsonb_to_recordset(items)
    as i(item_type text, item_id text, status text,
         first_score smallint, best_score smallint, attempts int)
  on conflict (user_id, item_type, item_id) do update set
    status      = case when p.status = 'completed' or excluded.status = 'completed'
                       then 'completed' else 'started' end,
    first_score = coalesce(p.first_score, excluded.first_score),
    best_score  = greatest(p.best_score, excluded.best_score),
    attempts    = greatest(p.attempts, excluded.attempts),
    updated_at  = now()
  returning p.*;
end;
$$;

revoke execute on function public.merge_progress(jsonb) from public, anon;
grant execute on function public.merge_progress(jsonb) to authenticated;

-- Hapus akun pemanggil beserta progresnya (on delete cascade).
-- Security definer karena klien tidak punya hak atas auth.users;
-- hanya menghapus baris milik auth.uid().
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'delete_my_account: harus login' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
