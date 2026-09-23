-- Wat Supabase al heeft staan, nagebootst: de rollen, `auth.users` en
-- `auth.uid()` (ADR-188).
--
-- Alleen voor `tools/sql-nakijken.sh`, op een lege Postgres. Het is precies zo
-- veel als de migraties nodig hebben om te draaien, en `auth.uid()` leest wat
-- PostgREST zet: de `sub` uit het token van wie er vraagt.
-- Rollen gelden voor het hele cluster, dus alleen als ze er nog niet zijn.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;
create schema auth;
create schema extensions;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth, public, extensions to anon, authenticated, service_role;
grant execute on function auth.uid() to authenticated, anon;
