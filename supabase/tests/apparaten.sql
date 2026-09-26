-- Plekken op een code, nagekeken op een echte Postgres (ADR-226).
--
-- Wat hier vastligt:
--   * een ouder die de code invult zonder dat er een kind premium start, neemt
--     geen plek;
--   * een volle code weigert een vierde apparaat, en een ouder op een apparaat
--     met een plek kan er een vervangen, waarna het vierde erbij kan;
--   * vervangen kan drie keer per code in twaalf maanden;
--   * een plek die negentig dagen niet gebruikt is, komt vanzelf vrij;
--   * alleen een apparaat met een plek ziet welke apparaten er op de code staan.
-- Eén transactie, aan het eind teruggedraaid.

\o /dev/null

begin;

insert into public.premium_codes (code_hash, geldig_tot, notitie)
values (public.premium_hash('GEZINAAA'), (now() at time zone 'Europe/Amsterdam')::date + 365, 'gezin');

do $$
declare
  a uuid := '00000000-0000-4000-8000-00000000000a';
  b uuid := '00000000-0000-4000-8000-00000000000b';
  c uuid := '00000000-0000-4000-8000-00000000000c';
  d uuid := '00000000-0000-4000-8000-00000000000d';
  e uuid := '00000000-0000-4000-8000-00000000000e';
  ouder uuid := '00000000-0000-4000-8000-0000000000f0';
  v_hash text := public.premium_hash('GEZINAAA');
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v json;
  v_plek_c text;
begin
  -- Een ouder vult de code in op zijn telefoon, zonder kind dat er premium
  -- start: de code klopt, en er gaat geen plek af.
  v := public.premium_controleer('LEER-GEZI-NAAA', ouder, false, 'iphone');
  assert v ->> 'geldig' = 'true', 'de code klopt';
  assert v ->> 'plek' = 'false', 'zonder kind neemt de telefoon van de ouder geen plek';
  assert (v ->> 'bezet')::int = 0 and (v ->> 'plekken')::int = 3, 'en hoort hoeveel er bezet zijn';
  assert not exists (select 1 from public.premium_apparaten where code_hash = v_hash),
    'er staat geen apparaat op de code';

  -- Drie kinderen starten premium op drie apparaten.
  assert public.premium_controleer('GEZINAAA', a, true, 'ipad') ->> 'plek' = 'true', 'plek 1';
  assert public.premium_controleer('GEZINAAA', b, true, 'chromebook') ->> 'plek' = 'true', 'plek 2';
  assert public.premium_controleer('GEZINAAA', c, true, 'iets-anders') ->> 'plek' = 'true', 'plek 3';
  assert (select label from public.premium_apparaten where apparaat = c) = 'onbekend',
    'een label buiten de lijst wordt "onbekend"';
  assert (select eerst_gezien from public.premium_apparaten where apparaat = a) = v_vandaag,
    'een plek draagt de dag waarop hij genomen is';

  -- De code is vol: een vierde apparaat krijgt geen plek, en controleren alleen
  -- zegt dat de code klopt maar dit apparaat er niet op staat.
  v := public.premium_controleer('GEZINAAA', d, true, 'android-tablet');
  assert v ->> 'geldig' = 'false' and v ->> 'reden' = 'vol', 'een vierde apparaat past niet';
  v := public.premium_controleer('GEZINAAA', d, false, null);
  assert v ->> 'geldig' = 'true' and v ->> 'plek' = 'false', 'de code klopt wel';

  -- Een apparaat zonder plek ziet niet welke apparaten erop staan.
  v := public.premium_apparaten_tonen('GEZINAAA', d);
  assert v ->> 'ok' = 'false' and v ->> 'reden' = 'geen-plek', 'zonder plek geen lijst';
  assert (v ->> 'bezet')::int = 3, 'wel hoeveel plekken er bezet zijn';
  assert v -> 'apparaten' is null, 'en geen enkel apparaat';

  -- Een apparaat met een plek wel, met zichzelf bovenaan en zonder de nummers
  -- van de andere apparaten.
  v := public.premium_apparaten_tonen('GEZINAAA', a);
  assert v ->> 'ok' = 'true', 'met een plek een lijst';
  assert json_array_length(v -> 'apparaten') = 3, 'van drie apparaten';
  assert (v -> 'apparaten' -> 0 ->> 'dit_apparaat') = 'true', 'dit apparaat eerst';
  assert (v -> 'apparaten' -> 0 ->> 'label') = 'ipad', 'met zijn label';
  assert (v ->> 'vervangingen_over')::int = 3, 'nog drie keer vervangen';
  assert position(c::text in v::text) = 0, 'het nummer van een ander apparaat gaat niet mee';
  select a2 ->> 'plek' into v_plek_c
  from json_array_elements(v -> 'apparaten') as a2
  where a2 ->> 'label' = 'onbekend';

  -- Vervangen: C gaat eraf, en D kan erbij.
  v := public.premium_plek_vervangen('GEZINAAA', a, v_plek_c);
  assert v ->> 'ok' = 'true', 'een plek vervangen';
  assert (v ->> 'vervangingen_over')::int = 2, 'daarna nog twee keer';
  assert not exists (select 1 from public.premium_apparaten where apparaat = c), 'C staat er niet meer op';
  assert public.premium_controleer('GEZINAAA', d, true, 'android-tablet') ->> 'plek' = 'true',
    'het volgende apparaat neemt de vrije plek';

  -- Zichzelf vervangen kan niet (dat is afmelden), en vanaf een apparaat zonder
  -- plek ook niet.
  v := public.premium_plek_vervangen('GEZINAAA', a, public.premium_plek_id(v_hash, a));
  assert v ->> 'reden' = 'dit-apparaat', 'je vervangt jezelf niet';
  v := public.premium_plek_vervangen('GEZINAAA', e, public.premium_plek_id(v_hash, b));
  assert v ->> 'reden' = 'geen-plek', 'zonder plek vervang je niets';
  assert (select count(*) from public.premium_vervangingen) = 1, 'geen van beide telt mee';

  -- De grens: drie keer in twaalf maanden. Twee keer nog, dan niet meer.
  assert public.premium_plek_vervangen('GEZINAAA', a, public.premium_plek_id(v_hash, b)) ->> 'ok' = 'true',
    'de tweede keer';
  assert public.premium_controleer('GEZINAAA', b, true, 'chromebook') ->> 'plek' = 'true', 'B terug';
  assert public.premium_plek_vervangen('GEZINAAA', a, public.premium_plek_id(v_hash, b)) ->> 'ok' = 'true',
    'de derde keer';
  assert public.premium_controleer('GEZINAAA', b, true, 'chromebook') ->> 'plek' = 'true', 'B weer terug';
  v := public.premium_plek_vervangen('GEZINAAA', a, public.premium_plek_id(v_hash, b));
  assert v ->> 'ok' = 'false' and v ->> 'reden' = 'grens', 'de vierde keer niet';
  assert exists (select 1 from public.premium_apparaten where apparaat = b), 'B staat er nog';
  assert (public.premium_apparaten_tonen('GEZINAAA', a) ->> 'vervangingen_over')::int = 0,
    'en de lijst zegt dat er geen vervanging meer over is';

  -- Een vervanging van dertien maanden geleden telt niet meer mee.
  update public.premium_vervangingen set dag = v_vandaag - interval '13 months'
  where ctid = (select ctid from public.premium_vervangingen limit 1);
  assert public.premium_plek_vervangen('GEZINAAA', a, public.premium_plek_id(v_hash, b)) ->> 'ok' = 'true',
    'na twaalf maanden kan het weer';

  -- Automatisch vrijgeven: B terug, en dan negentig dagen niet gezien.
  assert public.premium_controleer('GEZINAAA', b, true, 'chromebook') ->> 'plek' = 'true', 'B terug';
  update public.premium_apparaten set laatst_gezien = v_vandaag - 90 where apparaat = b;
  v := public.premium_controleer('GEZINAAA', e, true, 'windows');
  assert v ->> 'reden' = 'vol', 'negentig dagen niet gezien is nog in gebruik';
  update public.premium_apparaten set laatst_gezien = v_vandaag - 91 where apparaat = b;
  v := public.premium_controleer('GEZINAAA', e, true, 'windows');
  assert v ->> 'plek' = 'true', 'eenennegentig dagen niet gezien: de plek is vrij';
  assert not exists (select 1 from public.premium_apparaten where apparaat = b), 'B is eraf';

  -- Gebruiken is gezien worden: een apparaat met een plek dat de code
  -- controleert, schuift zijn laatste dag op.
  update public.premium_apparaten set laatst_gezien = v_vandaag - 30 where apparaat = a;
  perform public.premium_controleer('GEZINAAA', a, false, null);
  assert (select laatst_gezien from public.premium_apparaten where apparaat = a) = v_vandaag,
    'controleren telt als gebruik';
  assert (select label from public.premium_apparaten where apparaat = a) = 'ipad',
    'zonder label blijft het label staan';

  -- Een app van vóór ADR-226 vraagt met twee argumenten, en neemt dan een plek
  -- zoals hij altijd deed.
  delete from public.premium_apparaten where apparaat = e;
  v := public.premium_controleer('GEZINAAA', e);
  assert v ->> 'plek' = 'true', 'de oude vorm neemt een plek';

  -- 's Nachts gaat de rest weg.
  update public.premium_apparaten set laatst_gezien = v_vandaag - 100 where apparaat = d;
  assert public.premium_apparaten_opschonen() = 1, 'één plek vrijgegeven';

  -- Een onbekende code telt als een fout geraden code, ook bij de lijst.
  delete from public.premium_pogingen;
  v := public.premium_apparaten_tonen('ONBEKEND', a);
  assert v ->> 'reden' = 'onbekend', 'een onbekende code';
  assert (select count(*) from public.premium_pogingen) = 1, 'telt als poging';
end $$;

-- Wat de app mag: de functies, en geen tabel.
do $$
begin
  assert has_function_privilege('anon', 'public.premium_controleer(text, uuid, boolean, text)', 'execute'),
    'de app mag controleren';
  assert has_function_privilege('anon', 'public.premium_apparaten_tonen(text, uuid)', 'execute'),
    'de app mag de apparaten tonen';
  assert has_function_privilege('anon', 'public.premium_plek_vervangen(text, uuid, text)', 'execute'),
    'de app mag een plek vervangen';
  assert not has_function_privilege('anon', 'public.premium_apparaten_opschonen()', 'execute'),
    'de app mag niet opschonen';
  assert not has_table_privilege('anon', 'public.premium_apparaten', 'select'),
    'de app leest de apparaten niet rechtstreeks';
  assert not has_table_privilege('anon', 'public.premium_vervangingen', 'select'),
    'en de vervangingen ook niet';
  assert (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'premium_apparaten') = 5,
    'een plek is een code, een nummer, een label en twee dagen, en niets meer';
end $$;

rollback;

\o
\echo 'apparaten: alles klopt'
