-- Het gezinsmodel: een ouder, zijn kinderen, en wat een kind meebrengt (ADR-155).
--
-- Dit is de eerste migratie van het accountproject. Ze staat genummerd in
-- `supabase/migrations/` en wordt niet meer bewerkt zodra ze ergens gedraaid
-- heeft; een verandering is een volgende migratie. Ze is wel zo geschreven dat
-- opnieuw draaien niets kapotmaakt — elke regel maakt aan of slaat over — want
-- tot het project echt staat, wordt ze een paar keer achter elkaar gedraaid.
--
-- De hele autorisatie berust op één regel, en die staat hieronder bij elke
-- tabel letterlijk hetzelfde:
--
--     using (kind_id = auth.uid() or ouder_id = auth.uid())
--
-- Twee tabellen wijken af, allebei zichtbaar: op `kinderen` heet `kind_id`
-- gewoon `id`, want daar ís de rij het kind; en op `doelstellingen` leest het
-- kind wel en schrijft alleen de ouder, want dat is wat een doelstelling is.
--
-- Daarom draagt elke rij van een kind ook `ouder_id`, gedenormaliseerd. Een
-- policy die een join nodig heeft, is een policy die niemand nakijkt — dat is
-- dezelfde afweging die deel B van het datamodel voor `organisation_id` maakt.
-- Dat het paar (kind, ouder) niet te vervalsen is, bewaakt de database met een
-- samengestelde foreign key naar `kinderen (id, ouder_id)`, en dus niet de
-- policy. Wie de policy leest, hoeft de rest van dit bestand niet te geloven.
--
-- Wat er níét in staat: geen school, geen woonplaats, geen geboortedatum, geen
-- achternaam, geen vrij tekstveld waar een kind in kan typen. ADR-050's lijst,
-- met alleen de inlogcode erbij.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- De mensen.

create table if not exists public.ouders (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      extensions.citext not null unique,
  created_at timestamptz not null default now()
);

-- Geen naam. Dit product zegt de naam van een ouder nergens terug, dus ernaar
-- vragen zou verzamelen voor de la zijn. Het wachtwoord staat in `auth.users`
-- en wordt hier niet gedupliceerd: twee plekken zijn twee plekken om fout te
-- hebben. Dezelfde regel die het datamodel voor leraren stelt.

create table if not exists public.kinderen (
  id               uuid primary key references auth.users (id) on delete cascade,
  ouder_id         uuid not null references public.ouders (id) on delete cascade,
  voornaam         text not null check (char_length(voornaam) between 1 and 40),
  inlogcode        text not null unique
                   check (inlogcode ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$'),
  niveau           smallint not null default 1 check (niveau between 1 and 3),
  groep            smallint check (groep between 3 and 8),
  groep_schooljaar smallint check (groep_schooljaar between 2020 and 2100),
  created_at       timestamptz not null default now(),
  -- Overbodig als constraint en dragend als doelwit: elke tabel hieronder wijst
  -- er met een samengestelde sleutel naartoe.
  unique (id, ouder_id)
);

-- Een kind is ook een echte gebruiker, met `<id>@kind.invalid` als adres.
-- `.invalid` is bij RFC 2606 gereserveerd en lost nooit op, dus dat adres kan
-- bij constructie geen post ontvangen — daarmee is "een kind heeft geen
-- e-mailadres" te controleren in plaats van te geloven. Het adres komt uit de
-- id en niet uit de inlogcode, zodat wie een code kent daarmee niet
-- rechtstreeks bij de inlog kan aankloppen.

-- Een nieuwe gebruiker met een echt adres is een ouder. Een kind krijgt zijn rij
-- van de edge function die hem aanmaakt, en valt hier dus met opzet buiten.
create or replace function public.gezin_nieuwe_gebruiker()
returns trigger
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if new.email is not null and new.email not like '%@kind.invalid' then
    insert into public.ouders (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists gezin_nieuwe_gebruiker on auth.users;
create trigger gezin_nieuwe_gebruiker
after insert on auth.users
for each row
execute function public.gezin_nieuwe_gebruiker();

-- ---------------------------------------------------------------------------
-- Wat een kind opbouwt. Dezelfde rijvormen als deel A van het datamodel, in
-- snake_case; die hernoeming is de enige vertaling tussen apparaat en server.

create table if not exists public.voortgang (
  kind_id         uuid not null,
  ouder_id        uuid not null,
  item_id         text not null,
  box             smallint not null check (box between 1 and 5),
  laatste_review  timestamptz,
  volgende_review timestamptz,
  goed_count      integer not null default 0 check (goed_count >= 0),
  fout_count      integer not null default 0 check (fout_count >= 0),
  hoogste_doos    smallint check (hoogste_doos between 1 and 5),
  stempels        timestamptz[] not null default '{}',
  primary key (kind_id, item_id),
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

create table if not exists public.sessies (
  id         uuid primary key,
  kind_id    uuid not null,
  ouder_id   uuid not null,
  mode       text not null,
  set_id     text,
  item_set   jsonb not null default '[]',
  score      integer,
  beantwoord integer,
  gestart    timestamptz not null,
  geeindigd  timestamptz,
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

-- Een ronde die nog loopt hoort bij het apparaat waar hij openstaat en wordt
-- niet verstuurd; daarom mag `geeindigd` leeg zijn en is dat geen halve rij.

create table if not exists public.pogingen (
  id                uuid primary key,
  sessie_id         uuid not null references public.sessies (id) on delete cascade,
  kind_id           uuid not null,
  ouder_id          uuid not null,
  item_id           text not null,
  mode              text not null,
  correct           boolean not null,
  response_ms       integer not null check (response_ms >= 0),
  gekozen_antwoord  text check (char_length(gekozen_antwoord) <= 200),
  tijdstip          timestamptz not null,
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

create index if not exists pogingen_kind_tijd on public.pogingen (kind_id, tijdstip);
create index if not exists pogingen_sessie on public.pogingen (sessie_id);

-- De id is een uuid en geen oplopend nummer: op het apparaat is dat vandaag wél
-- een nummer, en twee apparaten van hetzelfde kind maken dan hetzelfde nummer
-- voor een ander antwoord. Die lokale migratie gaat vooraf aan de eerste sync.

create table if not exists public.kind_diplomas (
  kind_id    uuid not null,
  ouder_id   uuid not null,
  badge_id   text not null,
  behaald_op timestamptz not null,
  primary key (kind_id, badge_id),
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

create table if not exists public.instellingen (
  kind_id      uuid not null,
  ouder_id     uuid not null,
  sleutel      text not null check (sleutel in ('weekdoel', 'zegels', 'bijhouden', 'doel', 'groepGevraagd')),
  waarde       text not null check (char_length(waarde) <= 2000),
  gewijzigd_op timestamptz not null default now(),
  primary key (kind_id, sleutel),
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

-- `sleutel` is een lijstje en geen vrije tekst, en `waarde` heeft een lengte.
-- Anders is dit precies het vrije tekstveld dat ADR-050 niet wil: een kind met
-- de ontwikkelaarsgereedschappen kan hier schrijven wat het wil.
-- `dagstand:` staat er met opzet niet bij — dat is wat dít apparaat vandaag doet
-- en het hoort nergens anders te zijn. `gewijzigd_op` bestaat omdat twee
-- apparaten anders niet kunnen zien welke van twee waarden de nieuwste is.

create table if not exists public.doelstellingen (
  id         uuid primary key default gen_random_uuid(),
  kind_id    uuid not null,
  ouder_id   uuid not null,
  set_id     text not null check (char_length(set_id) between 1 and 60),
  aantal     integer not null check (aantal > 0 and aantal <= 1000),
  deadline   date not null,
  gezet_op   timestamptz not null default now(),
  gezet_door uuid not null references public.ouders (id) on delete cascade,
  foreign key (kind_id, ouder_id) references public.kinderen (id, ouder_id) on delete cascade
);

create index if not exists doelstellingen_kind on public.doelstellingen (kind_id, deadline);

-- `set_id` is geen foreign key. De sets staan in `content/`, niet in deze
-- database, en een hernoemde set hoort een doelstelling stil te laten
-- ophouden met tellen in plaats van een migratie af te dwingen.
--
-- Er is geen kolom voor hoe ver het staat. Dat wordt geteld uit `pogingen` en
-- `sessies` op het moment dat iemand kijkt: een bewaard getal loopt scheef, en
-- het datamodel weigert er om dezelfde reden al een voor beheersing.

-- ---------------------------------------------------------------------------
-- Row level security. Aan op alles, zonder mildere standaard, en per tabel één
-- regel die steeds hetzelfde zegt.

alter table public.ouders enable row level security;
alter table public.kinderen enable row level security;
alter table public.voortgang enable row level security;
alter table public.sessies enable row level security;
alter table public.pogingen enable row level security;
alter table public.kind_diplomas enable row level security;
alter table public.instellingen enable row level security;
alter table public.doelstellingen enable row level security;

revoke all on public.ouders, public.kinderen, public.voortgang, public.sessies,
  public.pogingen, public.kind_diplomas, public.instellingen, public.doelstellingen
  from anon, authenticated;

drop policy if exists "eigen rij" on public.ouders;
create policy "eigen rij" on public.ouders
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "kind of ouder" on public.kinderen;
create policy "kind of ouder" on public.kinderen
  for select to authenticated
  using (id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder wijzigt" on public.kinderen;
create policy "kind of ouder wijzigt" on public.kinderen
  for update to authenticated
  using (id = auth.uid() or ouder_id = auth.uid())
  with check (id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder" on public.voortgang;
create policy "kind of ouder" on public.voortgang
  for all to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid())
  with check (kind_id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder" on public.sessies;
create policy "kind of ouder" on public.sessies
  for all to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid())
  with check (kind_id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder" on public.pogingen;
create policy "kind of ouder" on public.pogingen
  for all to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid())
  with check (kind_id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder" on public.kind_diplomas;
create policy "kind of ouder" on public.kind_diplomas
  for all to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid())
  with check (kind_id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "kind of ouder" on public.instellingen;
create policy "kind of ouder" on public.instellingen
  for all to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid())
  with check (kind_id = auth.uid() or ouder_id = auth.uid());

-- De doelstelling is het ene ding dat de ouder zet en het kind alleen leest.
drop policy if exists "kind leest" on public.doelstellingen;
create policy "kind leest" on public.doelstellingen
  for select to authenticated
  using (kind_id = auth.uid() or ouder_id = auth.uid());

drop policy if exists "ouder schrijft" on public.doelstellingen;
create policy "ouder schrijft" on public.doelstellingen
  for all to authenticated
  using (ouder_id = auth.uid())
  with check (ouder_id = auth.uid());

-- Welke rijen, dat zegt de policy hierboven. Welke kolommen, dat zegt het recht
-- hieronder, en dat is waarom de policy één regel kan blijven.
--
-- Een kind mag zijn eigen groep zetten (dat is gevraagd) en zijn naam, en verder
-- niets: niet zijn inlogcode, niet bij wie het hoort. Aanmaken en weghalen van
-- een kind gaat helemaal niet langs de client maar langs een edge function.
grant select on public.ouders to authenticated;
grant select on public.kinderen to authenticated;
grant update (voornaam, niveau, groep, groep_schooljaar) on public.kinderen to authenticated;

grant select, insert, update, delete on public.voortgang to authenticated;
grant select, insert, update, delete on public.sessies to authenticated;
grant select, insert on public.pogingen to authenticated;
grant select, insert, update on public.kind_diplomas to authenticated;
grant select, insert, update, delete on public.instellingen to authenticated;
grant select, insert, update, delete on public.doelstellingen to authenticated;

-- `pogingen` kent geen update en geen delete: een gegeven antwoord blijft staan.
-- Dat is wat "append-only" betekent als je het niet alleen opschrijft.

-- ---------------------------------------------------------------------------
-- De inlogcode.

-- Hetzelfde alfabet als de premiumcode van ADR-116: zonder 0, O, 1, I en L,
-- want dat zijn de tekens die iemand van een scherm verkeerd overtypt. Acht
-- daarvan is 31^8, ongeveer 850 miljard.
--
-- 256 is geen veelvoud van 31, dus een byte zomaar op het alfabet leggen maakt
-- de eerste acht tekens waarschijnlijker dan de rest. Bytes vanaf 248 worden
-- daarom overgeslagen. Dezelfde eerlijkheid als `nieuweCode` in de kassa.
create or replace function public.gezin_nieuwe_code()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  v_alfabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code    text := '';
  v_byte    integer;
begin
  while char_length(v_code) < 8 loop
    v_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if v_byte < 248 then
      v_code := v_code || substr(v_alfabet, (v_byte % 31) + 1, 1);
    end if;
  end loop;
  return v_code;
end;
$$;

-- Uniciteit komt van de database en niet van wie hem aanroept: `unique` op de
-- kolom is de waarheid, en dit probeert het gewoon opnieuw. Twintig keer botsen
-- op 850 miljard mogelijkheden gebeurt niet, en als het gebeurt is stoppen met
-- een fout beter dan een code uitgeven die van iemand anders is.
create or replace function public.gezin_code_uitgeven(p_kind uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_code text;
begin
  for i in 1 .. 20 loop
    v_code := public.gezin_nieuwe_code();
    begin
      update public.kinderen set inlogcode = v_code where id = p_kind;
      if not found then
        raise exception 'geen kind met id %', p_kind using errcode = 'no_data_found';
      end if;
      return v_code;
    exception when unique_violation then
      -- volgende poging
    end;
  end loop;
  raise exception 'geen vrije inlogcode gevonden';
end;
$$;

-- ---------------------------------------------------------------------------
-- De snelheidsbegrenzer op het inloggen.
--
-- Er staat geen code in deze tabel en geen IP-adres: van allebei alleen een
-- digest die de edge function met een peper maakt. Een kale hash van een
-- IPv4-adres is in seconden terug te rekenen — dan bewaar je een persoonsgegeven
-- en doe je alsof van niet — en een kale hash van een code maakt van deze tabel
-- een lijst om codes mee te raden.

create table if not exists public.inlog_pogingen (
  code_hash text not null,
  ip_hash   text not null,
  tijdstip  timestamptz not null default now()
);

create index if not exists inlog_pogingen_code on public.inlog_pogingen (code_hash, tijdstip);
create index if not exists inlog_pogingen_ip on public.inlog_pogingen (ip_hash, tijdstip);

alter table public.inlog_pogingen enable row level security;
revoke all on public.inlog_pogingen from anon, authenticated;

-- Tien mislukte pogingen per uur, per code én per IP. Per code, zodat één kind
-- niet te raden is; per IP, zodat een lijst codes niet af te lopen is. Het
-- apparaatnummer waar ADR-116 op telt, verzint de client zelf — goed genoeg voor
-- een premiumslot en het verkeerde ding om bij inloggen op te tellen.
create or replace function public.gezin_inlog_mag(p_code_hash text, p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code integer;
  v_ip   integer;
begin
  delete from public.inlog_pogingen where tijdstip < now() - interval '1 day';

  select count(*) into v_code from public.inlog_pogingen
  where code_hash = p_code_hash and tijdstip > now() - interval '1 hour';

  select count(*) into v_ip from public.inlog_pogingen
  where ip_hash = p_ip_hash and tijdstip > now() - interval '1 hour';

  return v_code < 10 and v_ip < 10;
end;
$$;

create or replace function public.gezin_inlog_mislukt(p_code_hash text, p_ip_hash text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.inlog_pogingen (code_hash, ip_hash) values (p_code_hash, p_ip_hash);
$$;

-- De code omzetten in een kind. Alleen de service-sleutel mag dit, en dus alleen
-- de edge function die óók om een wachtwoord vraagt. Er is met opzet nergens een
-- ingang die alleen op een code antwoordt: dat zou vertellen of een code bestaat.
create or replace function public.gezin_kind_voor_code(p_code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.kinderen
  where inlogcode = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

revoke all on function public.gezin_nieuwe_code() from public, anon, authenticated;
revoke all on function public.gezin_code_uitgeven(uuid) from public, anon, authenticated;
revoke all on function public.gezin_inlog_mag(text, text) from public, anon, authenticated;
revoke all on function public.gezin_inlog_mislukt(text, text) from public, anon, authenticated;
revoke all on function public.gezin_kind_voor_code(text) from public, anon, authenticated;

grant execute on function public.gezin_code_uitgeven(uuid) to service_role;
grant execute on function public.gezin_inlog_mag(text, text) to service_role;
grant execute on function public.gezin_inlog_mislukt(text, text) to service_role;
grant execute on function public.gezin_kind_voor_code(text) to service_role;

-- `anon` kan in dit schema niets. Er is geen enkele functie en geen enkele tabel
-- die zonder inloggen te bereiken is; wie niet is ingelogd, praat alleen met de
-- edge functions.
