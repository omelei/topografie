# Premium: de code en de database

Premium zit achter een code die een ouder één keer invult (ADR-116). De app
controleert de code bij een kleine database in Supabase. Er gaat alleen de code
heen en een willekeurig nummer voor het apparaat; wat een kind oefent blijft op
het apparaat.

Zolang de stappen hieronder niet gedaan zijn, zegt de premiumpagina "Premium is
nog niet beschikbaar" en blijft alles wat premium is op slot.

## Eenmalig instellen

1. Maak op [supabase.com](https://supabase.com) een project aan, regio
   **Central EU (Frankfurt)**. Het gratis plan is genoeg.
2. Open **SQL Editor**, plak de inhoud van [`schema.sql`](schema.sql) en klik
   op **Run**. Het script kan veilig opnieuw worden gedraaid.
3. Open **Project Settings → API** en kopieer:
   - de **Project URL** (`https://….supabase.co`);
   - de **anon / publishable key**. Die sleutel is openbaar bedoeld: hij kan
     alleen de drie functies uit het schema aanroepen, niet de tabellen lezen.
4. Zet ze in GitHub bij **Settings → Secrets and variables → Actions →
   Variables** (niet bij Secrets, want ze komen toch in de app terecht):
   - `PREMIUM_URL`: de Project URL;
   - `PREMIUM_KEY`: de anon key.
5. De volgende deploy van `main` neemt ze mee. De workflow `premium-wakker`
   vraagt de database twee keer per week één klein ding, zodat een gratis
   project niet in slaap valt.

## Codes maken

```bash
node tools/premium/maak-codes.mjs 5 2027-09-30 familie Jansen
```

Het script drukt de codes af (`LEER-XXXX-XXXX`) en de SQL om ze op te slaan.
Plak die SQL in de SQL Editor. De database bewaart alleen een hash van elke
code, dus een code die je kwijt bent is echt weg: maak dan een nieuwe.

Een code geldt standaard een jaar en voor drie apparaten.

## Beheren

In de SQL Editor:

```sql
-- Een code intrekken (werkt binnen twee weken op elk apparaat door):
update public.premium_codes set ingetrokken = true where notitie = 'familie Jansen';

-- Een code verlengen:
update public.premium_codes set geldig_tot = '2028-09-30' where notitie = 'familie Jansen';

-- Welke apparaten een code gebruiken:
select c.notitie, a.eerst_gezien, a.laatst_gezien
from public.premium_apparaten a join public.premium_codes c using (code_hash);
```
