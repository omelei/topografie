-- Groep 1 en 2 (ADR-244).
--
-- 0001 liet alleen groep 3 tot en met 8 toe, want groep 1 en 2 hadden geen
-- stof. Nu kan een kind uit groep 1 of 2 zijn groep kiezen, en die moet mee
-- kunnen naar de server zodra het gezinsaccount aan staat.
--
-- 0001 maakt de tabel met `create table if not exists`, dus een wijziging daar
-- raakt een database die al bestaat niet. Daarom hier, en opnieuw te draaien
-- zonder schade, net als 0001 tot en met 0003.
alter table public.kinderen drop constraint if exists kinderen_groep_check;
alter table public.kinderen
  add constraint kinderen_groep_check check (groep between 1 and 8);
