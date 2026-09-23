-- Eén kind op twee apparaten: wat er gebeurt als twee rijen botsen (ADR-155,
-- ADR-188).
--
-- ADR-155 schreef per winkel op wie er wint. Tot nu toe stond dat alleen in dat
-- record; een apparaat dat zijn rij naar de server stuurde, overschreef wat een
-- ander apparaat er eerder had neergezet, ook als dat nieuwer was. Deze
-- triggers maken van de regels iets wat de database doet, bij elke botsing en
-- voor elke schrijver — en dus niet iets wat elke client goed moet onthouden.
--
-- Ze vuren op `update`, en dus ook op `insert … on conflict do update`, wat een
-- upsert van PostgREST is (`Prefer: resolution=merge-duplicates`). Een rij die
-- nieuw is, komt er gewoon in.
--
-- `sessies` en `pogingen` hebben geen trigger nodig: die worden alleen
-- aangevuld, en een botsing is dezelfde rij nog eens (de client stuurt ze met
-- `resolution=ignore-duplicates`).
--
-- Opnieuw te draaien zonder schade, net als 0001 en 0002.

-- ---------------------------------------------------------------------------
-- De Leitner-dozen.
--
-- Per item wint de rij met de jongste `laatste_review`, met doos en volgende
-- keer erbij. Bij een gelijke tijd wint de lágere doos: een item te vaak vragen
-- kost een minuut, een item ten onrechte "geleerd" noemen kost eenentwintig
-- dagen stilte. De tellers en de hoogste doos lopen alleen omhoog en worden het
-- maximum van de twee.
create or replace function public.gezin_voortgang_samenvoegen()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.laatste_review is not null and (
    new.laatste_review is null
    or old.laatste_review > new.laatste_review
    or (old.laatste_review = new.laatste_review and old.box < new.box)
  ) then
    new.box := old.box;
    new.laatste_review := old.laatste_review;
    new.volgende_review := old.volgende_review;
  end if;

  new.goed_count := greatest(old.goed_count, new.goed_count);
  new.fout_count := greatest(old.fout_count, new.fout_count);
  -- `greatest` slaat een lege waarde over, dus een onbekende hoogste doos
  -- verdringt nooit een bekende.
  new.hoogste_doos := greatest(old.hoogste_doos, new.hoogste_doos);
  return new;
end;
$$;

drop trigger if exists gezin_voortgang_samenvoegen on public.voortgang;
create trigger gezin_voortgang_samenvoegen
before update on public.voortgang
for each row
execute function public.gezin_voortgang_samenvoegen();

-- ---------------------------------------------------------------------------
-- De diploma's: een diploma houdt de dag waarop het voor het eerst gehaald
-- werd, op welk apparaat dan ook.
create or replace function public.gezin_diploma_samenvoegen()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.behaald_op := least(old.behaald_op, new.behaald_op);
  return new;
end;
$$;

drop trigger if exists gezin_diploma_samenvoegen on public.kind_diplomas;
create trigger gezin_diploma_samenvoegen
before update on public.kind_diplomas
for each row
execute function public.gezin_diploma_samenvoegen();

-- ---------------------------------------------------------------------------
-- De instellingen: per sleutel wint de jongste schrijver.
--
-- ADR-155 noemde voor `zegels` de vereniging. Sinds ADR-149 schrijft niets die
-- sleutel nog, en een regel voor iets wat niet gebeurt, is een regel die
-- niemand toetst; hij staat hier dus als de jongste, net als de rest.
create or replace function public.gezin_instelling_samenvoegen()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.gewijzigd_op > new.gewijzigd_op then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists gezin_instelling_samenvoegen on public.instellingen;
create trigger gezin_instelling_samenvoegen
before update on public.instellingen
for each row
execute function public.gezin_instelling_samenvoegen();

-- De functies draaien met de rechten van wie schrijft (geen `security
-- definer`): ze kijken alleen naar de twee versies van de rij die de policy al
-- had toegelaten, en hoeven verder nergens bij.
