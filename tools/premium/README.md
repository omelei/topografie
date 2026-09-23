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
3. Kopieer uit het dashboard:
   - de **Project URL** (`https://….supabase.co`), onder **Project Settings →
     Data API** of via de knop **Connect**;
   - de **publishable key** (`sb_publishable_…`), onder **Project Settings →
     API Keys**. Die sleutel is openbaar bedoeld: hij kan alleen de drie
     functies uit het schema aanroepen, niet de tabellen lezen. Een oudere
     **anon key** (begint met `eyJ`) werkt ook.

   Gebruik **nooit** de secret key of de service_role key: die geeft volledige
   toegang tot de database en hoort niet in een app.

4. Zet ze in GitHub bij **Settings → Secrets and variables → Actions →
   Variables** (niet bij Secrets, want ze komen toch in de app terecht):
   - `PREMIUM_URL`: de Project URL;
   - `PREMIUM_KEY`: de publishable key.
5. Deploy opnieuw: **Actions → CI → Run workflow** op `main`. De build neemt
   de variabelen mee. De workflow `premium-wakker` vraagt de database twee
   keer per week één klein ding, zodat een gratis project niet in slaap valt;
   draai hem één keer met de hand om te zien dat de verbinding werkt.

## Codes maken

```bash
node tools/premium/maak-codes.mjs 5 2027-09-30 familie Jansen
```

Het script drukt de codes af (`LEER-XXXX-XXXX`) en de SQL om ze op te slaan.
Plak die SQL in de SQL Editor. De database bewaart alleen een hash van elke
code, dus een code die je kwijt bent is echt weg: maak dan een nieuwe.

Een code geldt standaard een jaar en voor drie apparaten.

Dit is de weg met de hand, voor testgezinnen en voor als er iets misgaat bij een
bestelling. Zet in de notitie voor wie een code is, zodat je hem later kunt
verlengen of intrekken. Codes die uit de kassa komen krijgen automatisch de
notitie `kassa tr_…`, met het betaal-id van Mollie erin.

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

## De kassa

Sinds ADR-123 kan een ouder een code kopen in plaats van erom vragen. De kassa
staat buiten de app: twee gewone pagina's onder `/kopen`, en één edge function
die met Mollie praat. De app zelf blijft aan niemand iets vragen; hij zet er
alleen een link naartoe.

Wat er gebeurt, in vier stappen:

1. Een ouder vult op `/kopen` een e-mailadres in en drukt op betalen.
2. De edge function maakt een betaling bij Mollie en stuurt de ouder daarheen.
3. Mollie meldt aan dezelfde function dat er betaald is. Die maakt een code, zet
   de hash in `premium_codes`, en mailt de code.
4. De ouder komt terug op `/kopen/klaar`, ziet de code meteen, en heeft hem ook
   in de mail.

Het e-mailadres wordt **niet** bij ons bewaard. Het gaat als metadata mee naar
Mollie — die het voor de transactie toch moet bewaren — en de function leest het
daar per keer op. In onze database staat per bestelling het betaal-id, de hash
van de code, en de code zelf tot hij gemaild is en dertig dagen oud; daarna haalt
een nachtelijke opruiming (`premium_bestellingen_opschonen`) de leesbare code
weg. Die code staat er alleen zodat een betaalde bestelling niet stilletjes
verdwijnt als het mailen mislukt.

### Instellen

Dit komt bovenop de stappen hierboven; zonder premiumdatabase heeft de kassa
niets om een code in te zetten.

1. **Mollie.** Maak op [mollie.com](https://www.mollie.com) een account, zet
   iDEAL aan en haal de **API-sleutel** op. Begin met de testsleutel
   (`test_…`); die doet alles echt, behalve geld verplaatsen.
2. **Resend.** Maak op [resend.com](https://resend.com) een account, voeg
   `leer.nu` toe als domein en zet de DNS-regels die ze noemen (SPF en DKIM).
   Zonder die regels komt de mail met de code in de spammap, en een code die een
   ouder niet vindt is een code die niet bestaat. Haal de **API-sleutel** op.
3. **De function.** Met de [Supabase CLI](https://supabase.com/docs/guides/cli):

   ```bash
   supabase link --project-ref <jouw-project-ref>
   supabase secrets set \
     MOLLIE_SLEUTEL=test_… \
     RESEND_SLEUTEL=re_… \
     KASSA_AFZENDER='leer.nu <code@leer.nu>' \
     KASSA_HERKOMST=https://www.leer.nu \
     KASSA_PREMIUM_URL=https://www.leer.nu/premium \
     KASSA_TERUG_URL=https://www.leer.nu/kopen/klaar/ \
     KASSA_WEBHOOK_URL=https://<project-ref>.supabase.co/functions/v1/kassa?actie=webhook
   supabase functions deploy kassa --no-verify-jwt
   ```

   `--no-verify-jwt` is nodig omdat Mollie geen token meestuurt en een ouder
   geen account heeft. De function is daarmee openbaar, en dat kan: hij gelooft
   niets van wat er binnenkomt en vraagt alles na bij Mollie.

   `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` staan er al — die zet Supabase
   zelf in elke function. De service-sleutel blijft hier en komt nooit in de app.

4. **Het adres in de site.** Zet bij **Settings → Secrets and variables →
   Actions → Variables** de variabele `KASSA_URL` op
   `https://<project-ref>.supabase.co/functions/v1/kassa` en deploy opnieuw.
   Zonder die variabele zeggen de pagina's onder `/kopen` dat de kassa dicht is.

### Nakijken dat het werkt

Doe één echte testbestelling voordat je de sleutel op `live_…` zet. Dat is de
enige stap die niet met tests te vangen is: de rest van de kassa wordt in
`supabase/functions/kassa/kassa.test.ts` nagespeeld, maar of Mollie en Resend
doen wat hun documentatie zegt blijkt pas hier.

1. Ga naar `/kopen`, vul je eigen adres in, betaal met de testmethode
   **"paid"**.
2. Je hoort terug te komen op `/kopen/klaar` met de code in beeld, en de mail
   hoort binnen te zijn — kijk ook in de spammap.
3. Vul de code in op `/premium`; alles hoort open te gaan.
4. Kijk in de SQL Editor of het klopt, en of er geen adres in staat:

   ```sql
   select betaling, code_hash, code is not null as nog_leesbaar, gemaild, aangemaakt
   from public.premium_bestellingen order by aangemaakt desc limit 5;
   ```

5. Betaal nog een keer en kies de testmethode **"failed"**: er hoort geen code
   bij te komen.

Gaat er iets mis, dan staat het in de logs van de function
(**Edge Functions → kassa → Logs**). Mollie probeert een mislukte melding
vanzelf opnieuw, en de function is daarop gebouwd: een tweede melding maakt geen
tweede code, maar stuurt wel alsnog de mail die de eerste keer niet wegkwam.

### Als een ouder zijn code kwijt is

De code is binnen dertig dagen nog terug te halen:

```sql
select code from public.premium_bestellingen where betaling = 'tr_…';
```

Daarna is hij echt weg — dan maak je met `maak-codes.mjs` een nieuwe en trek je
de oude in.

### Btw

Dit is geen vrijgesteld onderwijs: daarvoor is erkend onderwijs én interactie
tussen docent en leerling nodig, en een oefenprogramma heeft geen van beide.
Reken op 21%, en laat het door je boekhouder bevestigen. Blijft de jaaromzet
onder de € 20.000, dan kun je de kleineondernemersregeling gebruiken en draag je
geen btw af — bij € 79,95 is dat ongeveer 250 codes.
