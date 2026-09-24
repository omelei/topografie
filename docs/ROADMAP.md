# Roadmap leer.nu

_Bijgewerkt: 24 september 2026._ Elke PR die iets van deze lijst oppakt, afmaakt
of verschuift, werkt deze pagina in dezelfde PR bij (zie `CLAUDE.md`). De
beslissingen zelf staan in [DECISIONS.md](DECISIONS.md); hier staat alleen wat
er gebeurt, in welke volgorde, en wie aan zet is.

**Legenda:** _jij_ is de eigenaar, _Claude_ is de ontwikkelsessie.

## Nu

| Wat                                                                        | Wie           | Staat                    | Hangt af van         |
| -------------------------------------------------------------------------- | ------------- | ------------------------ | -------------------- |
| Gezinsaccount live zetten (zie hieronder)                                  | jij en Claude | Wacht op vier antwoorden | —                    |
| Code afschermen: GitHub Pro nemen, dan de repository privé (zie hieronder) | jij           | Te doen                  | —                    |
| Klassencode: pagina `/scholen` met een aanvraagknop (ADR-200)              | Claude        | Wacht op het adres       | Contactadres van jou |
| Klassencode: € 300 inclusief of exclusief btw?                             | jij           | Te beslissen             | —                    |
| Deel je uitslag na een ronde, met een link naar hetzelfde onderwerp        | Claude        | Na het vorige punt       | —                    |
| Google Search Console voor www.leer.nu, en de sitemap insturen             | jij           | Te doen                  | —                    |

### Code afschermen

De repository `omelei/topografie` is nu **openbaar**: iedereen kan de code, de
ADR's en de geschiedenis lezen en kopiëren. De site draait op GitHub Pages
vanuit deze repository.

1. **GitHub Pro nemen, dan de repository privé zetten** — _jij_. Gekozen: GitHub
   Pro, want GitHub Pages op een privé-repository vraagt een betaald plan.
   Eerst Pro (github.com → Settings → Billing and plans), dan pas de
   repository privé (Settings → General → Danger Zone). Andersom stopt de site.
   Controleer daarna dat www.leer.nu nog opent en dat de laatste deploy groen is.
2. **Nalopen wat er in de repository staat** — _Claude_: geen geheimen, geen
   persoonsgegevens, en welke documenten (bedrijfsplan, prijzen, ADR's) niet
   buiten de deur horen.
3. **De app in de browser** — _Claude_: er gaan al geen sourcemaps mee, en de
   code is verkleind. Helemaal verbergen kan niet: een webapp draait in de
   browser van de gebruiker, dus wie moeite doet, kan de JavaScript lezen. Wat
   echt geheim moet blijven (premiumcodes controleren, de kassa), gebeurt
   daarom al op de server. Dat blijft de regel.

### Gezinsaccount live zetten

De code staat klaar en is getest (ADR-155 tot en met ADR-190). Wat nog moet,
in deze volgorde. De klikken staan in [SUPABASE.md](SUPABASE.md).

1. **Vier antwoorden voor de privacyverklaring** — _jij_:
   - wie verantwoordelijk is (naam of bedrijf, KvK-nummer);
   - het contactadres voor privacyvragen en verwijderverzoeken;
   - welke mailprovider de bevestigingsmails stuurt (advies: een Europese, zoals
     Brevo of Mailjet);
   - akkoord met de bewaartermijn: zolang het account bestaat, zelf te
     verwijderen, en weg na 24 maanden zonder gebruik.
2. **Privacypagina `/privacy`**, met links vanaf account aanmaken, de kassa en de
   ouderpagina — _Claude_, na stap 1.
   In dezelfde PR gaan de beloftes op de premiumpagina mee ("alles blijft op je
   eigen apparaat", "je voornaam gaat nergens heen") en de uitleg bij wissen:
   met een account gaat er met toestemming wel iets naar de server (ADR-197).
3. **Supabase inrichten** — _jij_:
   - EU-regio controleren, migraties 0001, 0002 en 0003 draaien;
   - geheimen van de edge functions zetten, project-ref in GitHub, de workflow
     van de gezinsfuncties één keer met de hand draaien;
   - Auth: Confirm email aan, SMTP met de gekozen provider, redirect-URL
     `https://www.leer.nu/ouder`;
   - de verwerkersovereenkomst (DPA) tekenen.
4. **`GEZIN_URL` en `GEZIN_KEY` in GitHub zetten** — _jij_, pas als de
   privacypagina live staat. De volgende deploy zet de accounts aan.
5. **Nakijken**: `Gezin nakijken` draaien en de keten van account tot kind
   doorlopen — _Claude_.

## Daarna

| Wat                                                                                                                        | Wie           | Waarom                                                                              | Hangt af van                          |
| -------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- | ------------------------------------- |
| Premium per gezin in plaats van per apparaat                                                                               | Claude        | Eén code voor alle kinderen en apparaten, zonder hem overal in te typen             | Gezinsaccount live                    |
| Opruimen van accounts na 24 maanden zonder gebruik                                                                         | Claude        | De bewaartermijn uit de privacyverklaring waarmaken                                 | Akkoord op de termijn                 |
| Betalen per maand, € 9,95 (Mollie: mandaat, abonnement, webhook, opzeggen)                                                 | Claude        | Staat nu als "binnenkort" op de site (ADR-196)                                      | Besluit om te bouwen                  |
| Klassencode stap B: klasmodus op schoolapparaten, overzicht voor de leerkracht, verwerkersovereenkomst, betalen op factuur | jij en Claude | Een school koopt voor inzicht; dat maakt leer.nu verwerker voor de school (ADR-200) | Gezinsaccount live, besluit na stap A |

## Geparkeerd

| Wat                                                                                                                                | Waarom geparkeerd                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conversie meten: verkochte en geactiveerde codes per week, vóór en na de nieuwe grens                                              | Later; de cijfers staan in Mollie en op de premiumserver, er is geen tracking van kinderen voor nodig                                                                    |
| Uitdagen: een kind daagt een ander uit met een code (A), of om de beurt op één apparaat (D); met premium de stand per tegenstander | Opties uitgewerkt op 23 september (A code, B server, C A + gezin, D één apparaat; advies A + D). Vervalsen bij A uitgewerkt op 24 september. De eigenaar komt erop terug |
| Mail op @leer.nu via Google Workspace, en de DNS-records van Resend voor de kassa                                                  | Geparkeerd op 24 september; de stappen staan in het gesprek van die dag                                                                                                  |
| Een bericht of mail aan ouders (bijvoorbeeld "klaar voor de toets")                                                                | Kan pas met het gezinsaccount, en dan met toestemming                                                                                                                    |
| Proefperiode                                                                                                                       | Bewust niet: een ouder die zijn kind wil laten oefenen, koopt meteen (ADR-192)                                                                                           |

## Open beslissingen

| Vraag                                                                                                     | Voorstel                                                       | Waar het staat |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------- |
| Mag "Klaar voor de toets, met premium" zonder code blijven? Strikt genomen is het een vorm van voortgang. | Laten staan: het is de sterkste aanleiding om premium te kopen | ADR-193        |
| Mag het aantal vragen op Vandaag ("N vragen die je bijna vergeten bent") zonder code blijven?             | Laten staan als lokkertje                                      | ADR-192        |

## Klein onderhoud

- `docs/jij-indeling.md` en `docs/beloning-diplomas.md` beschrijven nog de oude
  premiumgrens; een regel bovenaan dat ADR-192 die grens herzag.
- In `WeekdoelenBlok` is de regel per diploma voor wie geen premium heeft dode
  code sinds het hele blok premium is.

## Gedaan (recent)

| PR        | Wat                                                                                                                                                                                       | ADR      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| #142      | Eerst een ronde proberen, daarna je naam: een onderwerp opent zonder naamveld, en de eerste kaart zegt wat leer.nu is                                                                     | 208      |
| #141      | Vindbaar in Google: een eigen pagina met titel en tekst per vak en onderwerp, sitemap.xml en robots.txt                                                                                   | 207      |
| #140      | De groep doet iets op Vandaag: eigen starters per groep, de groep in de kop, en de rij "Past bij groep" voor wie al geoefend heeft                                                        | 206      |
| #139      | Meldingen na een knop (account, wachtwoord, pincode, code) als duidelijk vak: groen met vinkje, rood met uitroepteken                                                                     | 205      |
| #138      | Vandaag voor een nieuw kind: eerste ronde, vakken, hoe het werkt; menu onderin duidelijker; op een telefoon schuift de app niet meer weg                                                  | 203, 204 |
| #137      | Grotere stip voor een stad, avatar naast je naam, 48 nieuwe avatars, diplomanamen breken netjes af, twee teksten                                                                          | 202      |
| #136      | De kassa wordt door een workflow gedeployd, bij elke wijziging en met de hand                                                                                                             | 201      |
| #135      | Een ouder is geen profiel meer en telt niet mee in de drie; een kind kan van het apparaat; de pagina groeit mee op een groot scherm; klassencode van 40 plekken; een code geldt 365 dagen | 198–200  |
| #134      | Alle interfaceteksten herschreven volgens een nieuwe schrijfwijzer: één woord per begrip, één vorm voor feedback                                                                          | 197      |
| #132      | Eigen woordenlijsten zijn te oefenen; nieuwe prijzen € 79,95 per jaar en € 9,95 per maand (binnenkort)                                                                                    | 195, 196 |
| #131      | Scherpe letters op een desktop: ClearType terug op Vandaag, Baloo gehint                                                                                                                  | 194      |
| #130      | Triggers voor ouders: wat het kind wilde, en waar het klaar voor is                                                                                                                       | 193      |
| #129      | Premiumgrens: gratis is oefenen, premium is alles wat over weken gaat; consistent door de hele app                                                                                        | 192      |
| #128      | Menu altijd in beeld op een telefoon, logo blijft wit, "ken je inmiddels", derde persoon op de ouderpagina                                                                                | 191      |
| #124–#127 | Gezinsaccount stap 3: een kind mee naar het account, synchroniseren, inloggen met een code                                                                                                | 187–190  |
