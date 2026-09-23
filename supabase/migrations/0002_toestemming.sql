-- Wanneer de ouder toestemming gaf voor een kind (ADR-187).
--
-- Artikel 8 AVG vraagt voor een kind onder de zestien de toestemming van wie
-- de ouderlijke verantwoordelijkheid draagt, en artikel 7 vraagt dat je kunt
-- aantonen dát die gegeven is. In dit product geeft de ouder die op één moment:
-- als hij een kind aanmaakt, of een kind dat al oefende in zijn account opneemt
-- — beide alleen met zijn eigen token, langs `kind-beheer`. Dat moment is dus
-- het moment dat de rij in `kinderen` ontstaat.
--
-- Daarom een standaard en geen kolom die de edge function vult: een rij kán
-- niet ontstaan zonder dit moment, en een project waarop deze migratie nog niet
-- gedraaid heeft, blijft gewoon werken.
--
-- Opnieuw te draaien zonder schade, net als 0001.

alter table public.kinderen
  add column if not exists toestemming_op timestamptz not null default now();

-- Alleen lezen. Het recht om te wijzigen op `kinderen` noemt zijn kolommen
-- (0001), en deze staat daar met opzet niet bij: een toestemming die achteraf
-- te verplaatsen is, toont niets aan.
