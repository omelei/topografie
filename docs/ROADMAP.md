# Roadmap leer.nu

_Bijgewerkt: 26 september 2026._ Elke PR die iets van deze lijst oppakt, afmaakt
of verschuift, werkt deze pagina in dezelfde PR bij (zie `CLAUDE.md`). De
beslissingen zelf staan in [DECISIONS.md](DECISIONS.md); hier staat alleen wat
er gebeurt, in welke volgorde, en wie aan zet is.

**Legenda:** _jij_ is de eigenaar, _Claude_ is de ontwikkelsessie.

## Nu

### Actielijst voor jou, in deze volgorde

1. **De teller aanzetten:** `tools/premium/schema.sql` opnieuw draaien in de SQL
   Editor van Supabase (ADR-210, ADR-211). Zonder dat telt de server niets.
2. **Testaankoop in de kassa.** De code staat na betalen op het scherm; de mail
   met de code komt waarschijnlijk niet aan, want in de DNS staan geen records
   van Resend. Zet die records erbij (Resend → Domains → leer.nu).
3. **Google Search Console** voor www.leer.nu, en `https://www.leer.nu/sitemap.xml`
   insturen. Herinnering staat op 25 september.
4. **Een werkblad delen** met een leerkracht en in een oudergroep, bijvoorbeeld
   `leer.nu/topografie/provincies/werkblad`. De snelste test of het aanslaat.
5. **DMARC opschalen**: mail op @leer.nu werkt via Google Workspace sinds 25
   september, met `p=none`. Zijn de rapporten na twee tot vier weken schoon,
   dan `p=quarantine`; `p=reject` pas als de mail van Resend ook klopt.
6. **Op 8 oktober de teller uitlezen** (de vragen staan in
   `tools/premium/README.md`) en samen het volgende kiezen.

### Lopend

| Wat                                                                        | Wie | Staat        | Hangt af van |
| -------------------------------------------------------------------------- | --- | ------------ | ------------ |
| Code afschermen: GitHub Pro nemen, dan de repository privé (zie hieronder) | jij | Te doen      | —            |
| Klassencode: € 300 inclusief of exclusief btw?                             | jij | Te beslissen | —            |

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

### Gezinsaccount live zetten (geparkeerd)

Geparkeerd op 24 september, samen met de privacypagina: de eigenaar komt erop
terug. De code staat klaar en is getest (ADR-155 tot en met ADR-190). Wat nog
moet, in deze volgorde. De klikken staan in [SUPABASE.md](SUPABASE.md).

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
| Betalen per maand, € 9,95 (Mollie: mandaat, abonnement, webhook, opzeggen)                                                 | Claude        | Staat nu als "binnenkort" op de site (ADR-196)                                      | Later (24 september)                  |
| Klassencode stap B: klasmodus op schoolapparaten, overzicht voor de leerkracht, verwerkersovereenkomst, betalen op factuur | jij en Claude | Een school koopt voor inzicht; dat maakt leer.nu verwerker voor de school (ADR-200) | Gezinsaccount live, besluit na stap A |

## De volgende tien (24 september)

Op volgorde van wat het oplevert voor bezoekers en omzet, tegen wat het kost.
Na 8 oktober bijstellen op wat de teller laat zien. Keuzes van de eigenaar op
24 september: 1 tot en met 5 bouwen, 6 en 7 geparkeerd, 8 ja, 9 later, 10 na de
teller.

| #   | Wat                                                                                                       | Waarom                                                                     | Omvang | Staat         |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------ | ------------- |
| 1   | QR-code en adres op elk werkblad, en een klassenset: 30 verschillende bladen in één keer printen          | Elk uitgedeeld blad wijst naar de app; een juf deelt uit aan een hele klas | Klein  | Gedaan (#147) |
| 2   | Echte inhoud op de pagina's voor Google: de lijst (provincies met hoofdstad), uitleg, veelgestelde vragen | Dunne pagina's scoren slecht; inhoud is wat Google en ouders zoeken        | Middel | Gedaan (#148) |
| 3   | Pagina voor ouders (`/ouders`): wat het is, hoe herhalen werkt, wat het kost, privacy                     | Wie via Google komt, weet nu niet waarom leer.nu beter is                  | Middel | Gedaan (#149) |
| 4   | `/scholen` met de klassencode aanvragen                                                                   | Scholen zijn de snelste weg naar veel kinderen tegelijk                    | Klein  | Gedaan (#151) |
| 5   | Wekelijks overzicht van de teller als issue in GitHub                                                     | Cijfers die niemand opzoekt, sturen niets                                  | Klein  | Gedaan (#150) |
| 6   | Privacypagina (`/privacy`)                                                                                | Nodig voor accounts, scholen en vertrouwen                                 | Klein  | Geparkeerd    |
| 7   | Gezinsaccount live: voortgang op elk apparaat                                                             | Premium per gezin in plaats van per apparaat; een ouder kijkt mee          | Middel | Geparkeerd    |
| 8   | Engels: woordjes voor groep 7 en 8                                                                        | Grote vraag, en de brug naar de brugklas                                   | Groot  | Gedaan (#152) |
| 9   | Betalen per maand, € 9,95                                                                                 | Lagere drempel dan een jaar vooruit                                        | Middel | Later         |
| 10  | Uitdagen (A + D)                                                                                          | Pas als delen (ADR-209) laat zien dat kinderen elkaar opzoeken             | Middel | Na 8 oktober  |

## Geparkeerd

| Wat                                                                                                                                | Waarom geparkeerd                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversie meten: verkochte en geactiveerde codes per week, vóór en na de nieuwe grens                                              | Later; de cijfers staan in Mollie en op de premiumserver, er is geen tracking van kinderen voor nodig                                                                                                                               |
| Uitdagen: een kind daagt een ander uit met een code (A), of om de beurt op één apparaat (D); met premium de stand per tegenstander | Opties uitgewerkt op 23 september (A code, B server, C A + gezin, D één apparaat; advies A + D). Vervalsen bij A uitgewerkt op 24 september. Delen van de uitslag is gebouwd als eerste stap (ADR-209). De eigenaar komt erop terug |
| Privacypagina (`/privacy`)                                                                                                         | De eigenaar bepaalt later wat erin komt (24 september); de vier vragen staan bij het gezinsaccount                                                                                                                                  |
| Gezinsaccount live zetten                                                                                                          | Later (24 september); de stappen staan hierboven                                                                                                                                                                                    |
| De DNS-records van Resend voor de kassa                                                                                            | Geparkeerd op 25 september; de mail van Google Workspace werkt al. Resend op een eigen subdomein, bijvoorbeeld `send.leer.nu`                                                                                                       |
| Een bericht of mail aan ouders (bijvoorbeeld "klaar voor de toets")                                                                | Kan pas met het gezinsaccount, en dan met toestemming                                                                                                                                                                               |
| Proefperiode                                                                                                                       | Bewust niet: een ouder die zijn kind wil laten oefenen, koopt meteen (ADR-192)                                                                                                                                                      |

## Open beslissingen

| Vraag                                                                                                     | Voorstel                                                       | Waar het staat |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------- |
| Mag "Klaar voor de toets, met premium" zonder code blijven? Strikt genomen is het een vorm van voortgang. | Laten staan: het is de sterkste aanleiding om premium te kopen | ADR-193        |
| Mag het aantal op Vandaag ("N oefeningen die herhaald moeten worden") zonder code blijven?                | Laten staan als lokkertje                                      | ADR-192        |

## Klein onderhoud

Niets open.

## Gedaan (recent)

| PR        | Wat                                                                                                                                                                                       | ADR      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| #155      | Alle teksten als CSV exporteren en importeren (`npm run teksten:export` en `teksten:import`), en het klein onderhoud                                                                      | —        |
| #154      | Een zin per diploma (79), en de tegels op de overzichtspagina's in de vorm van het diploma                                                                                                | 219      |
| #153      | Het diploma liggend, naar het herontwerp: vakkleur, Denker, van wie, wat je kunt en de score                                                                                              | 218      |
| #152      | Engels: 183 woordjes voor groep 7 en 8 als derde deel van Taal, met kiezen, typen, ontdekken, overleven, een diploma per set en een werkblad                                              | 217      |
| #151      | Een pagina voor de klas (`/scholen`): wat een klassencode is, en aanvragen per mail aan info@leer.nu                                                                                      | 216      |
| #150      | Elke maandag het weekoverzicht van de teller als issue in GitHub                                                                                                                          | 215      |
| #149      | Een pagina voor ouders (`/voor-ouders`), en premium ook zonder naam te bekijken                                                                                                           | 214      |
| #148      | "Over dit onderwerp": wat erin zit en de vragen van ouders, op de pagina voor Google en onder het onderwerp in de app                                                                     | 213      |
| #147      | Een QR-code op elk werkblad en een klassenset van 30 verschillende bladen                                                                                                                 | 212      |
| #145      | Een werkblad om te printen per onderwerp, met een blinde kaart, sommen, klokken, vlaggen of zinnen en de antwoorden erbij                                                                 | 211      |
| #144      | Een anonieme teller: per dag hoe vaak iemand binnenkwam, een ronde begon, een naam invulde, deelde of naar premium keek; nooit wie                                                        | 210      |
| #143      | Deel je uitslag na een ronde, met een link naar hetzelfde onderwerp en zonder naam                                                                                                        | 209      |
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
