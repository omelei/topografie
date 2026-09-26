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

-- Vanaf wanneer een code geldt (ADR-225). Een klaspas voor volgend schooljaar
-- kan in juni gemaakt worden en gaat pas op 1 september in. Een code van vóór
-- deze kolom geldt sinds de dag waarop hij gemaakt is, of sinds zijn laatste
-- dag als die eerder lag. Het is een dag in Nederland, zoals de controle
-- hieronder rekent: in UTC begint 1 september om twee uur 's nachts.
alter table public.premium_codes add column if not exists geldig_van date;
update public.premium_codes set geldig_van = least(aangemaakt::date, geldig_tot)
  where geldig_van is null;
alter table public.premium_codes
  alter column geldig_van set default ((now() at time zone 'Europe/Amsterdam')::date),
  alter column geldig_van set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'premium_codes_van_voor_tot'
  ) then
    alter table public.premium_codes
      add constraint premium_codes_van_voor_tot check (geldig_van <= geldig_tot);
  end if;
end
$$;

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
  v_hash    text := public.premium_hash(p_code);
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_code    public.premium_codes%rowtype;
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

  -- Geldig van en met geldig_van tot en met geldig_tot, op een Nederlandse dag
  -- (ADR-225). Een code die nog niet ingaat, is geen fout geraden code en
  -- neemt geen plek: de ouder hoort op welke dag hij ingaat.
  if v_code.geldig_tot < v_vandaag then
    return json_build_object('geldig', false, 'reden', 'verlopen', 'geldig_tot', v_code.geldig_tot);
  end if;
  if v_code.geldig_van > v_vandaag then
    return json_build_object('geldig', false, 'reden', 'nog-niet', 'geldig_van', v_code.geldig_van);
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

-- ---------------------------------------------------------------------------
-- De kassa (ADR-123): van een betaling bij Mollie naar een code.
--
-- Wat hier bij komt te staan is één rij per betaling: het betaal-id van Mollie,
-- de hash van de code, en de code zelf tot hij gemaild is en dertig dagen oud.
-- Geen naam, geen adres, geen e-mailadres — dat laatste blijft bij Mollie, die
-- het voor de transactie toch moet bewaren, en de edge function leest het daar
-- per keer op.
--
-- Waarom de code hier even leesbaar staat: bij een code die met de hand wordt
-- uitgedeeld is een hash genoeg, want het origineel is net afgedrukt. Bij een
-- betaling is er een plicht — er is betaald, dus de code moet aankomen — en een
-- code die alleen als hash bestaat is voorgoed weg als het mailen mislukt.
-- `premium_bestellingen_opschonen` haalt hem weg zodra dat niet meer kan gebeuren.

create table if not exists public.premium_bestellingen (
  betaling   text primary key,
  code_hash  text not null references public.premium_codes (code_hash) on delete cascade,
  code       text,
  gemaild    timestamptz,
  aangemaakt timestamptz not null default now()
);

alter table public.premium_bestellingen enable row level security;
revoke all on public.premium_bestellingen from anon, authenticated;

-- Een betaling vastleggen. Idempotent, en dat is de hele truc: Mollie stuurt
-- dezelfde melding met opzet vaker, en twee codes voor één betaling zou zowel
-- verwarrend als duur zijn. De tweede keer wordt er niets gemaakt en komt de
-- bestelling terug zoals hij was.
create or replace function public.premium_bestelling_vastleggen(
  p_betaling   text,
  p_code_hash  text,
  p_code       text,
  p_geldig_tot date
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rij public.premium_bestellingen%rowtype;
begin
  select * into v_rij from public.premium_bestellingen where betaling = p_betaling;
  if found then
    return json_build_object(
      'nieuw', false,
      'code', v_rij.code,
      'geldig_tot', (select geldig_tot from public.premium_codes where code_hash = v_rij.code_hash),
      'gemaild', v_rij.gemaild is not null
    );
  end if;

  insert into public.premium_codes (code_hash, geldig_tot, max_apparaten, notitie)
  values (p_code_hash, p_geldig_tot, 3, 'kassa ' || p_betaling)
  on conflict (code_hash) do nothing;

  insert into public.premium_bestellingen (betaling, code_hash, code)
  values (p_betaling, p_code_hash, p_code);

  return json_build_object(
    'nieuw', true, 'code', p_code, 'geldig_tot', p_geldig_tot, 'gemaild', false
  );
end;
$$;

create or replace function public.premium_bestelling_lezen(p_betaling text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'nieuw', false,
    'code', b.code,
    'geldig_tot', c.geldig_tot,
    'gemaild', b.gemaild is not null
  )
  from public.premium_bestellingen b
  join public.premium_codes c using (code_hash)
  where b.betaling = p_betaling;
$$;

create or replace function public.premium_bestelling_gemaild(p_betaling text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.premium_bestellingen set gemaild = now()
  where betaling = p_betaling and gemaild is null
  returning true;
$$;

-- De leesbare code weghalen zodra hij zijn werk gedaan heeft: gemaild, en dertig
-- dagen oud. Draait mee met de workflow die de database wakker houdt.
create or replace function public.premium_bestellingen_opschonen()
returns integer
language sql
security definer
set search_path = public
as $$
  with opgeruimd as (
    update public.premium_bestellingen set code = null
    where code is not null and gemaild is not null and aangemaakt < now() - interval '30 days'
    returning 1
  )
  select count(*)::integer from opgeruimd;
$$;

-- Alleen de edge function, met de service-sleutel, mag deze vier. De app kent ze
-- niet en heeft ze niet nodig: die vult alleen een code in.
revoke all on function public.premium_bestelling_vastleggen(text, text, text, date) from public, anon, authenticated;
revoke all on function public.premium_bestelling_lezen(text) from public, anon, authenticated;
revoke all on function public.premium_bestelling_gemaild(text) from public, anon, authenticated;
revoke all on function public.premium_bestellingen_opschonen() from public, anon, authenticated;
grant execute on function public.premium_bestelling_vastleggen(text, text, text, date) to service_role;
grant execute on function public.premium_bestelling_lezen(text) to service_role;
grant execute on function public.premium_bestelling_gemaild(text) to service_role;
grant execute on function public.premium_bestellingen_opschonen() to service_role;

-- De leesbare codes opruimen zonder dat er ergens een sleutel voor nodig is:
-- pg_cron draait het in de database zelf, elke nacht. Draait dit script op een
-- plek zonder pg_cron, dan zegt het dat en gaat het verder — het opschonen kan
-- dan met de hand of vanuit de edge function.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.unschedule('premium-bestellingen-opschonen')
  where exists (select 1 from cron.job where jobname = 'premium-bestellingen-opschonen');
  perform cron.schedule(
    'premium-bestellingen-opschonen',
    '23 3 * * *',
    $cron$select public.premium_bestellingen_opschonen();$cron$
  );
exception when others then
  raise notice 'pg_cron niet beschikbaar (%): ruim premium_bestellingen.code met de hand op.', sqlerrm;
end
$$;

-- ---------------------------------------------------------------------------
-- De teller (ADR-210): hoeveel keer iets gebeurde, per dag. Geen apparaat,
-- geen naam, geen cookie, geen tijdstip: alleen een dag, een gebeurtenis, een
-- adres en een aantal. Een rij zegt "op 24 september begonnen er 17 rondes op
-- /topografie/provincies", en nooit wie.
--
-- De app mag alleen tellen, via `teller_tel`, en alleen wat in de lijst staat.
-- Lezen doet de eigenaar in de SQL Editor (zie README.md).

create table if not exists public.teller (
  dag         date not null,
  gebeurtenis text not null,
  pad         text not null default '',
  aantal      integer not null default 0,
  primary key (dag, gebeurtenis, pad)
);

alter table public.teller enable row level security;
revoke all on public.teller from anon, authenticated;

create or replace function public.teller_tel(p_gebeurtenis text, p_pad text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pad text := coalesce(p_pad, '');
begin
  -- Alleen de gebeurtenissen die de app kent, en alleen een adres van leer.nu
  -- zelf: wie de publieke sleutel misbruikt, kan geen tekst van zichzelf
  -- achterlaten.
  if p_gebeurtenis not in (
    'binnenkomst', 'ronde', 'ronde-zonder-naam', 'naam', 'gedeeld', 'premium', 'kassa',
    'werkblad', 'qr'
  ) then
    return;
  end if;
  if v_pad !~ '^(/[a-z0-9-]{1,40}){0,2}/?$' then
    v_pad := '';
  end if;

  insert into public.teller as t (dag, gebeurtenis, pad, aantal)
  values ((now() at time zone 'Europe/Amsterdam')::date, p_gebeurtenis, v_pad, 1)
  on conflict (dag, gebeurtenis, pad) do update set aantal = t.aantal + 1;
end;
$$;

revoke all on function public.teller_tel(text, text) from public;
grant execute on function public.teller_tel(text, text) to anon;
