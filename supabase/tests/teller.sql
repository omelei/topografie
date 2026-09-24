-- De teller van de premiumdatabase, nagekeken op een echte Postgres (ADR-210).
--
-- Wat hier vastligt: de app mag tellen en niets lezen, alleen de gebeurtenissen
-- uit de lijst tellen mee, en een adres dat niet van leer.nu kan zijn, wordt
-- leeg in plaats van bewaard. Eén transactie, aan het eind teruggedraaid.

\o /dev/null

begin;

set local role anon;
select public.teller_tel('binnenkomst', '/topografie/provincies');
select public.teller_tel('binnenkomst', '/topografie/provincies');
select public.teller_tel('ronde-zonder-naam', '/rekenen/tafel-7');
select public.teller_tel('naam', null);
select public.teller_tel('qr', '/topografie/provincies');
select public.teller_tel('iets-anders', '/topografie');
select public.teller_tel('binnenkomst', '<script>alert(1)</script>');

do $$
begin
  begin
    perform count(*) from public.teller;
    assert false, 'de app mag de teller niet lezen';
  exception when insufficient_privilege then
    null;
  end;
end $$;

reset role;

do $$
begin
  assert (select aantal from public.teller
          where gebeurtenis = 'binnenkomst' and pad = '/topografie/provincies') = 2,
    'twee keer binnenkomen op hetzelfde adres is één rij met 2';
  assert (select aantal from public.teller where gebeurtenis = 'qr') = 1,
    'een scan van de code op een werkblad telt mee (ADR-212)';
  assert (select count(*) from public.teller where gebeurtenis = 'iets-anders') = 0,
    'een gebeurtenis buiten de lijst telt niet mee';
  assert (select count(*) from public.teller where pad like '%script%') = 0,
    'een adres dat niet van leer.nu kan zijn, wordt niet bewaard';
  assert (select aantal from public.teller where gebeurtenis = 'binnenkomst' and pad = '') = 1,
    'zo''n adres telt wel, maar zonder adres';
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'teller') = 4,
    'de teller heeft vier kolommen: dag, gebeurtenis, adres en aantal, en niets over wie';
end $$;

rollback;

\o
\echo 'teller: alles klopt'
