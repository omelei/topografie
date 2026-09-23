#!/usr/bin/env bash
# De migraties van het gezinsproject nakijken op een lege Postgres (ADR-188).
#
# Draait de nagebootste Supabase-basis, dan elke migratie twee keer (ze horen
# opnieuw te draaien zonder schade), en dan de controles in supabase/tests/.
# Verwacht een Postgres waar `psql` zonder wachtwoord bij kan, via de gewone
# PG*-variabelen. In CI is dat de Postgres die op de runner staat.
set -euo pipefail

cd "$(dirname "$0")/.."
DB="${PGDATABASE:-gezin_nakijken}"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)
# Alleen waarschuwingen en fouten: de NOTICEs van een tweede keer draaien
# ("already exists, skipping") zijn precies de bedoeling.
export PGOPTIONS='-c client_min_messages=warning'

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB}"
"${PSQL[@]}" -d postgres -c "create database ${DB}"

"${PSQL[@]}" -d "$DB" -f supabase/tests/0000_supabase_nagebootst.sql
for migratie in supabase/migrations/*.sql; do
  echo "migratie: ${migratie}"
  "${PSQL[@]}" -d "$DB" -f "$migratie"
  "${PSQL[@]}" -d "$DB" -f "$migratie"
done

"${PSQL[@]}" -d "$DB" -f supabase/tests/gezin.sql
"${PSQL[@]}" -d postgres -c "drop database ${DB}"
