-- De migraties van het gezinsproject, nagekeken op een echte Postgres (ADR-188).
--
-- Wat hier vastligt, stond tot nu toe alleen in ADR's: wie wat mag lezen en
-- schrijven, en wie er wint als twee apparaten van hetzelfde kind botsen. Elke
-- controle is een `assert`; faalt er een, dan stopt het script met de zin
-- erbij.
--
-- Draai met `tools/sql-nakijken.sh`. Alles gebeurt in één transactie die aan
-- het eind wordt teruggedraaid, dus het script is opnieuw te draaien.

-- Wat de selects hieronder teruggeven, hoort niet in het logboek; alleen een
-- mislukte controle, en de zin aan het eind.
\o /dev/null

begin;

-- Twee ouders met elk een kind, zoals `kind-beheer` ze aanmaakt: de ouder via
-- de trigger op `auth.users`, het kind met de service-sleutel.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ouder-a@example.nl'),
  ('00000000-0000-0000-0000-00000000000b', 'ouder-b@example.nl'),
  ('00000000-0000-0000-0000-0000000000a1', 'a1@kind.invalid'),
  ('00000000-0000-0000-0000-0000000000b1', 'b1@kind.invalid');

insert into public.kinderen (id, ouder_id, voornaam, inlogcode) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'Noor', 'AAAAAAAA'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'Sem', 'BBBBBBBB');

do $$
begin
  assert (select count(*) from public.ouders) = 2,
    'de trigger maakt van een echt adres een ouder, en van een kind-adres niet';
  assert (select count(*) from public.kinderen where toestemming_op is null) = 0,
    'elk kind draagt het moment van toestemming (0002)';
end $$;

-- Vanaf hier is ouder A aan het woord, zoals PostgREST het doet.
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);

-- ---------------------------------------------------------------------------
-- De Leitner-dozen (0003).

-- Wat PostgREST van een upsert maakt: elke kolom uit het lichaam.
create or replace function pg_temp.stuur_doos(p_box smallint, p_laatste timestamptz, p_goed int, p_fout int, p_hoogste smallint)
returns void language sql as $$
  insert into public.voortgang
    (kind_id, ouder_id, item_id, box, laatste_review, volgende_review, goed_count, fout_count, hoogste_doos)
  values
    ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'nl-limburg',
     p_box, p_laatste, p_laatste + interval '1 day', p_goed, p_fout, p_hoogste)
  on conflict (kind_id, item_id) do update set
    box = excluded.box,
    laatste_review = excluded.laatste_review,
    volgende_review = excluded.volgende_review,
    goed_count = excluded.goed_count,
    fout_count = excluded.fout_count,
    hoogste_doos = excluded.hoogste_doos;
$$;

-- De iPad: doos 3, gisteren.
select pg_temp.stuur_doos(3::smallint, '2026-09-22 10:00+00', 5, 1, 3::smallint);
-- De laptop, die een week offline was: doos 5, een week geleden. Ouder.
select pg_temp.stuur_doos(5::smallint, '2026-09-15 10:00+00', 7, 0, 5::smallint);

do $$
declare r record;
begin
  select * into r from public.voortgang where item_id = 'nl-limburg';
  assert r.box = 3, 'de jongste laatste_review wint: een oudere rij zet de doos niet terug';
  assert r.laatste_review = '2026-09-22 10:00+00', 'de tijd van de winnaar blijft staan';
  assert r.goed_count = 7 and r.fout_count = 1, 'de tellers worden het maximum van de twee';
  assert r.hoogste_doos = 5, 'de hoogste doos loopt alleen omhoog';
end $$;

-- Dezelfde tijd, een hogere doos: de lágere blijft.
select pg_temp.stuur_doos(4::smallint, '2026-09-22 10:00+00', 5, 1, 4::smallint);
do $$ begin
  assert (select box from public.voortgang where item_id = 'nl-limburg') = 3,
    'bij een gelijke tijd wint de lagere doos';
end $$;

-- Dezelfde tijd, een lagere doos: die wint.
select pg_temp.stuur_doos(2::smallint, '2026-09-22 10:00+00', 5, 2, 2::smallint);
do $$ begin
  assert (select box from public.voortgang where item_id = 'nl-limburg') = 2,
    'bij een gelijke tijd wint de lagere doos, ook als die als tweede komt';
end $$;

-- Een jongere rij wint, ook met een hogere doos.
select pg_temp.stuur_doos(4::smallint, '2026-09-23 09:00+00', 6, 2, 4::smallint);
do $$ begin
  assert (select box from public.voortgang where item_id = 'nl-limburg') = 4,
    'een jongere rij wint';
end $$;

-- ---------------------------------------------------------------------------
-- De diploma's en de instellingen (0003).

insert into public.kind_diplomas (kind_id, ouder_id, badge_id, behaald_op) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'tafel-2', '2026-09-20 10:00+00')
on conflict (kind_id, badge_id) do update set behaald_op = excluded.behaald_op;
insert into public.kind_diplomas (kind_id, ouder_id, badge_id, behaald_op) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'tafel-2', '2026-09-22 10:00+00')
on conflict (kind_id, badge_id) do update set behaald_op = excluded.behaald_op;

do $$ begin
  assert (select behaald_op from public.kind_diplomas where badge_id = 'tafel-2') = '2026-09-20 10:00+00',
    'een diploma houdt de dag waarop het voor het eerst gehaald werd';
end $$;

insert into public.instellingen (kind_id, ouder_id, sleutel, waarde, gewijzigd_op) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'weekdoel', 'nieuw', '2026-09-22 10:00+00')
on conflict (kind_id, sleutel) do update set waarde = excluded.waarde, gewijzigd_op = excluded.gewijzigd_op;
insert into public.instellingen (kind_id, ouder_id, sleutel, waarde, gewijzigd_op) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'weekdoel', 'oud', '2026-09-20 10:00+00')
on conflict (kind_id, sleutel) do update set waarde = excluded.waarde, gewijzigd_op = excluded.gewijzigd_op;

do $$ begin
  assert (select waarde from public.instellingen where sleutel = 'weekdoel') = 'nieuw',
    'van een instelling wint de jongste schrijver';
end $$;

-- ---------------------------------------------------------------------------
-- Sessies en pogingen: alleen aanvullen (0001), en dezelfde rij twee keer is
-- geen fout (`resolution=ignore-duplicates`).

insert into public.sessies (id, kind_id, ouder_id, mode, gestart, geeindigd) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a',
   'meerkeuze', '2026-09-22 10:00+00', '2026-09-22 10:05+00')
on conflict do nothing;
insert into public.pogingen (id, sessie_id, kind_id, ouder_id, item_id, mode, correct, response_ms, tijdstip) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-00000000000a', 'nl-limburg', 'meerkeuze', true, 1200, '2026-09-22 10:01+00')
on conflict do nothing;
insert into public.pogingen (id, sessie_id, kind_id, ouder_id, item_id, mode, correct, response_ms, tijdstip) values
  ('00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-0000000000a1',
   '00000000-0000-0000-0000-00000000000a', 'nl-limburg', 'meerkeuze', false, 900, '2026-09-22 10:01+00')
on conflict do nothing;

do $$ begin
  assert (select correct from public.pogingen where id = '00000000-0000-0000-0000-00000000d001'),
    'een gegeven antwoord blijft staan: een tweede met dezelfde id verandert het niet';
end $$;

-- ---------------------------------------------------------------------------
-- Wie wat mag (0001, 0002).

do $$ begin
  assert (select count(*) from public.kinderen) = 1,
    'een ouder ziet alleen zijn eigen kinderen';
  assert (select voornaam from public.kinderen) = 'Noor', 'en dat is Noor, niet Sem';
end $$;

do $$ begin
  begin
    insert into public.voortgang (kind_id, ouder_id, item_id, box)
    values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000b', 'nl-limburg', 1);
    raise exception 'ouder A kon een rij van het kind van ouder B schrijven';
  exception when insufficient_privilege then
    null; -- de policy houdt het tegen, zoals hij hoort
  end;
end $$;

do $$ begin
  begin
    insert into public.voortgang (kind_id, ouder_id, item_id, box)
    values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'nl-drenthe', 1);
    raise exception 'ouder A kon het kind van B aan zichzelf hangen';
  exception when foreign_key_violation or insufficient_privilege then
    null; -- de samengestelde sleutel naar kinderen (id, ouder_id) houdt het tegen
  end;
end $$;

do $$ begin
  begin
    update public.pogingen set correct = false;
    raise exception 'een gegeven antwoord was te wijzigen';
  exception when insufficient_privilege then
    null;
  end;
end $$;

do $$ begin
  begin
    update public.kinderen set toestemming_op = now() - interval '1 year';
    raise exception 'het moment van toestemming was te verplaatsen';
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- Het kind zelf, ingelogd met zijn eigen token: ziet zijn eigen rijen.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
do $$ begin
  assert (select count(*) from public.voortgang) = 1, 'een kind ziet zijn eigen dozen';
  assert (select count(*) from public.kinderen) = 1, 'en zichzelf, en verder niemand';
end $$;

reset role;
rollback;

\o

\echo 'Gezin nagekeken: alles klopt.'
