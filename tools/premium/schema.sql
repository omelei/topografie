-- Premium codes for leer.nu (ADR-116).
--
-- Run once in the SQL editor of the Supabase project (region: Frankfurt). It is
-- written to be run again safely: every statement replaces or skips.
--
-- What is stored is the least that works:
--   * a code, as the SHA-256 of its eight letters and digits — never the code
--     itself, so a copy of this table does not hand anyone a working code;
--   * how long it is valid and on how many devices;
--   * per device a random number the app made up, and when it was last seen.
-- No name, no e-mail, nothing about a child. Progress never leaves the device
-- (ADR-015), so there is none of it here to protect.
--
-- The app can do three things and nothing else, each through a function:
-- check a code (and register this device on it), take a code off this device,
-- and ping. The tables themselves are closed to it: row level security is on
-- and there is no policy, so the public key reads and writes nothing directly.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.premium_codes (
  code_hash     text primary key,
  geldig_tot    date not null,
  max_apparaten integer not null default 3 check (max_apparaten > 0),
  notitie       text,
  ingetrokken   boolean not null default false,
  aangemaakt    timestamptz not null default now()
);

create table if not exists public.premium_apparaten (
  code_hash     text not null references public.premium_codes (code_hash) on delete cascade,
  apparaat      uuid not null,
  eerst_gezien  timestamptz not null default now(),
  laatst_gezien timestamptz not null default now(),
  primary key (code_hash, apparaat)
);

-- Wrong codes, per device, for an hour: enough to stop a script guessing.
create table if not exists public.premium_pogingen (
  apparaat uuid not null,
  tijdstip timestamptz not null default now()
);
create index if not exists premium_pogingen_apparaat on public.premium_pogingen (apparaat, tijdstip);

alter table public.premium_codes enable row level security;
alter table public.premium_apparaten enable row level security;
alter table public.premium_pogingen enable row level security;
revoke all on public.premium_codes, public.premium_apparaten, public.premium_pogingen
  from anon, authenticated;

-- The same normalisation as `normaliseerCode` in src/store/premium.ts:
-- capitals and digits only, and without the "LEER" the printed code carries.
create or replace function public.premium_hash(p_code text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(
      case
        when length(schoon) = 12 and left(schoon, 4) = 'LEER' then substr(schoon, 5)
        else schoon
      end,
      'sha256'
    ),
    'hex'
  )
  from (select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) as schoon) as c;
$$;

create or replace function public.premium_controleer(p_code text, p_apparaat uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_hash   text := public.premium_hash(p_code);
  v_code   public.premium_codes%rowtype;
  v_fout   integer;
  v_aantal integer;
begin
  delete from public.premium_pogingen where tijdstip < now() - interval '1 day';

  select count(*) into v_fout
  from public.premium_pogingen
  where apparaat = p_apparaat and tijdstip > now() - interval '1 hour';
  if v_fout >= 10 then
    return json_build_object('geldig', false, 'reden', 'te-vaak');
  end if;

  select * into v_code from public.premium_codes where code_hash = v_hash;
  if not found or v_code.ingetrokken then
    insert into public.premium_pogingen (apparaat) values (p_apparaat);
    return json_build_object('geldig', false, 'reden', 'onbekend');
  end if;

  if v_code.geldig_tot < current_date then
    return json_build_object('geldig', false, 'reden', 'verlopen', 'geldig_tot', v_code.geldig_tot);
  end if;

  if exists (
    select 1 from public.premium_apparaten where code_hash = v_hash and apparaat = p_apparaat
  ) then
    update public.premium_apparaten
    set laatst_gezien = now()
    where code_hash = v_hash and apparaat = p_apparaat;
  else
    select count(*) into v_aantal from public.premium_apparaten where code_hash = v_hash;
    if v_aantal >= v_code.max_apparaten then
      return json_build_object('geldig', false, 'reden', 'vol');
    end if;
    insert into public.premium_apparaten (code_hash, apparaat) values (v_hash, p_apparaat);
  end if;

  return json_build_object('geldig', true, 'geldig_tot', v_code.geldig_tot);
end;
$$;

-- A parent took the code off a device: its place is free for another.
create or replace function public.premium_afmelden(p_code text, p_apparaat uuid)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.premium_apparaten
  where code_hash = public.premium_hash(p_code) and apparaat = p_apparaat;
  return json_build_object('geldig', false, 'reden', null);
end;
$$;

-- For the weekly workflow that keeps a free project from being paused.
create or replace function public.premium_ping()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.premium_codes limit 1);
$$;

revoke all on function public.premium_hash(text) from public, anon, authenticated;
revoke all on function public.premium_controleer(text, uuid) from public;
revoke all on function public.premium_afmelden(text, uuid) from public;
revoke all on function public.premium_ping() from public;
grant execute on function public.premium_controleer(text, uuid) to anon;
grant execute on function public.premium_afmelden(text, uuid) to anon;
grant execute on function public.premium_ping() to anon;
