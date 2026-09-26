-- De premiumcontrole, nagekeken op een echte Postgres (ADR-116, ADR-225).
--
-- Wat hier vastligt: een code geldt van en met `geldig_van` tot en met
-- `geldig_tot`, op een dag in Nederland. Een code die nog niet ingaat, zegt
-- wanneer wel, neemt geen plek en telt niet als een fout geraden code. Eén
-- transactie, aan het eind teruggedraaid.

\o /dev/null

begin;

-- Vier codes rond vandaag. De hash is die van premium_hash, zoals
-- maak-codes.mjs hem uitrekent.
create temporary table vandaag as
select (now() at time zone 'Europe/Amsterdam')::date as dag;

insert into public.premium_codes (code_hash, geldig_van, geldig_tot, notitie)
select public.premium_hash(code), van, tot, notitie
from vandaag, lateral (values
  ('AAAAAAAA', dag + 1, dag + 365, 'gaat morgen in'),
  ('BBBBBBBB', dag, dag + 365, 'gaat vandaag in'),
  ('CCCCCCCC', dag - 365, dag, 'stopt vandaag'),
  ('DDDDDDDD', dag - 365, dag - 1, 'stopte gisteren')
) as codes (code, van, tot, notitie);

create temporary table uitkomst (code text, antwoord json);
grant insert on uitkomst to anon;

set local role anon;
insert into uitkomst
select code, public.premium_controleer(code, '00000000-0000-4000-8000-000000000001')
from (values ('AAAAAAAA'), ('BBBBBBBB'), ('CCCCCCCC'), ('DDDDDDDD')) as codes (code);
reset role;

do $$
declare
  v_dag date := (select dag from vandaag);
  v_nog_niet json := (select antwoord from uitkomst where code = 'AAAAAAAA');
begin
  assert v_nog_niet ->> 'geldig' = 'false', 'een code die morgen ingaat, geldt vandaag niet';
  assert v_nog_niet ->> 'reden' = 'nog-niet', 'en dat zegt de server met een eigen reden';
  assert (v_nog_niet ->> 'geldig_van')::date = v_dag + 1, 'met de dag waarop hij ingaat';
  assert not exists (
    select 1 from public.premium_apparaten where code_hash = public.premium_hash('AAAAAAAA')
  ), 'een code die nog niet ingaat, neemt geen plek';
  assert not exists (select 1 from public.premium_pogingen),
    'en telt niet als een fout geraden code';

  assert (select antwoord ->> 'geldig' from uitkomst where code = 'BBBBBBBB') = 'true',
    'op de dag dat hij ingaat, geldt een code';
  assert (select antwoord ->> 'geldig' from uitkomst where code = 'CCCCCCCC') = 'true',
    'op zijn laatste dag geldt een code nog';
  assert (select antwoord ->> 'reden' from uitkomst where code = 'DDDDDDDD') = 'verlopen',
    'de dag erna niet meer';
end $$;

-- Een code die eindigt voordat hij begint, bestaat niet.
do $$
begin
  begin
    insert into public.premium_codes (code_hash, geldig_van, geldig_tot)
    values ('omgekeerd', '2027-09-01', '2027-08-31');
    assert false, 'een code die eindigt voordat hij begint, wordt geweigerd';
  exception when check_violation then
    null;
  end;
end $$;

-- Een code zonder begindatum, zoals de kassa hem maakt, geldt vanaf vandaag.
insert into public.premium_codes (code_hash, geldig_tot)
values ('uit-de-kassa', (select dag + 365 from vandaag));
do $$
begin
  assert (select geldig_van from public.premium_codes where code_hash = 'uit-de-kassa')
    = (select dag from vandaag), 'een code uit de kassa gaat vandaag in';
end $$;

rollback;

\o
\echo 'premium: alles klopt'
