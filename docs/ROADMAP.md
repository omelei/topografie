# Roadmap leer.nu

_Bijgewerkt: 30 september 2026._ Elke PR die iets van deze lijst oppakt, afmaakt
of verschuift, werkt deze pagina in dezelfde PR bij (zie `CLAUDE.md`). De
beslissingen zelf staan in [DECISIONS.md](DECISIONS.md); hier staat alleen wat
er gebeurt, in welke volgorde, en wie aan zet is.

**Legenda:** _jij_ is de eigenaar, _Claude_ is de ontwikkelsessie.

## Nu

### Actielijst voor jou, in deze volgorde

1. **Testaankoop in de kassa.** Kijk of Mollie het nieuwe jaarbedrag vraagt
   (ADR-230). De code staat na betalen op het scherm; de mail met de code komt
   waarschijnlijk niet aan, want in de DNS staan geen records van Resend. Zet
   die records erbij (Resend → Domains → leer.nu).
2. **Zoekwoorden verzamelen** in de Zoekwoordplanner van Google Ads (zonder
   campagne), taal Nederlands, locatie Nederland, en de CSV aan Claude geven.
   Search Console staat sinds 30 september aan, met de sitemap ingestuurd en
   tien pagina's aangevraagd. Rond 3 oktober het rapport Pagina-indexering
   bekijken.
3. **Een werkblad delen** met een leerkracht en in een oudergroep, bijvoorbeeld
   `leer.nu/topografie/provincies/werkblad`. De snelste test of het aanslaat.
4. **DMARC opschalen**: mail op @leer.nu werkt via Google Workspace sinds 25
   september, met `p=none`. Zijn de rapporten na twee tot vier weken schoon,
   dan `p=quarantine`; `p=reject` pas als de mail van Resend ook klopt.
5. **Op 8 oktober de teller uitlezen** (de vragen staan in
   `tools/premium/README.md`) en samen het volgende kiezen. Kijk daarbij ook
   hoe vaak groep 1 en 2 gekozen worden (`/1` en `/2`): dat beslist of fase 1
   voor kleuters gebouwd wordt (zie [Groep 1 en 2](#groep-1-en-2)).

### Lopend

| Wat                                                                        | Wie | Staat   | Hangt af van |
| -------------------------------------------------------------------------- | --- | ------- | ------------ |
| Code afschermen: GitHub Pro nemen, dan de repository privé (zie hieronder) | jij | Te doen | —            |

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

1. **Vijf antwoorden voor de privacyverklaring** — _jij_:
   - wie verantwoordelijk is (naam of bedrijf, KvK-nummer);
   - het contactadres voor privacyvragen en verwijderverzoeken;
   - welke mailprovider de bevestigingsmails stuurt (advies: een Europese, zoals
     Brevo of Mailjet);
   - akkoord met de bewaartermijn: zolang het account bestaat, zelf te
     verwijderen, en weg na 24 maanden zonder gebruik;
   - of elk antwoord van een kind op de server bewaard wordt (zie "Open
     beslissingen").
2. **Privacypagina `/privacy`**, met links vanaf account aanmaken, de kassa en de
   ouderpagina — _Claude_, na stap 1. De pagina zegt per groep wat er op de
   server staat (zie hieronder), en noemt Supabase, Mollie en de mailprovider
   als verwerkers.
   In dezelfde PR gaan de beloftes op de premiumpagina mee ("alles blijft op je
   eigen apparaat", "je voornaam gaat nergens heen") en de uitleg bij wissen:
   met een account gaat er met toestemming wel iets naar de server (ADR-197).
   Ook de naamvraag ("blijft opgeslagen op dit apparaat en niet op onze
   servers") en `/scholen` ("slaat geen persoonlijke gegevens op van
   kinderen"): met een account klopt dat niet meer.
3. **Supabase inrichten** — _jij_:
   - EU-regio controleren, migraties 0001 tot en met 0004 draaien;
   - geheimen van de edge functions zetten, project-ref in GitHub, de workflow
     van de gezinsfuncties één keer met de hand draaien;
   - Auth: Confirm email aan, SMTP met de gekozen provider, redirect-URL
     `https://www.leer.nu/ouder`;
   - de verwerkersovereenkomst (DPA) tekenen, en daarin nakijken welke logs
     Supabase zelf bijhoudt (IP-adressen van verzoeken) en hoe lang.
4. **`GEZIN_URL` en `GEZIN_KEY` in GitHub zetten** — _jij_, pas als de
   privacypagina live staat. De volgende deploy zet de accounts aan.
5. **Nakijken**: `Gezin nakijken` draaien en de keten van account tot kind
   doorlopen — _Claude_.

#### Wat er op de server staat (29 september)

- **Nu, zonder account** (`tools/premium/schema.sql`): de hash van elke
  premiumcode met geldigheid en notitie; per code een willekeurig
  apparaatnummer, het soort apparaat en de dag van eerst en laatst gezien;
  foute codepogingen per apparaatnummer; per betaling het id van Mollie en de
  code, leesbaar tot hij gemaild is en 30 dagen oud; en de teller (dag,
  gebeurtenis, pagina, aantal; sinds ADR-243 ook hoe vaak per dag een groep
  gekozen werd). Niets over een kind. Het e-mailadres van een
  koper staat alleen bij Mollie.
- **Met het gezinsaccount erbij** (`supabase/migrations/`): het e-mailadres van
  de ouder (geen naam); per kind de voornaam, inlogcode, niveau, groep en
  toestemmingsdatum; de doos en tellingen per item; elke ronde met score en
  tijden; elk antwoord met goed of fout, reactietijd, het gekozen of getypte
  antwoord en tijdstip; diploma's, vijf vaste instellingen en doelen van de
  ouder; en inlogpogingen als hash van code en IP. Alles van een kind gaat weg
  met het kind of de ouder.
- **Afspraak voor nu** — _jij_: zet in de `notitie` van een premiumcode geen
  naam of adres van een klant. Het is het enige vrije tekstveld op de server.

## Daarna

| Wat                                                                                                                                                                                                  | Wie           | Waarom                                                                              | Hangt af van                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| Review kind en ouder: een klassencode per schooljaar op `/scholen` ("een jaar geldig", ADR-225)                                                                                                      | jij           | Hangt af van hoe de klassencode verkocht wordt                                      | Besluit over de klassencode                     |
| Review kind en ouder: poorten en beloftes met een account. De premiumdeur achter de pincode, geen "Zonder account werkt alles" in de poort, en de naam- en wisbelofte laten afhangen van de overname | Claude        | Tegenstrijdig voor een ingelogde ouder (bevinding 8)                                | Gezinsaccount live                              |
| Premium per gezin in plaats van per apparaat                                                                                                                                                         | Claude        | Eén code voor alle kinderen en apparaten, zonder hem overal in te typen             | Gezinsaccount live                              |
| Opruimen van accounts na 24 maanden zonder gebruik                                                                                                                                                   | Claude        | De bewaartermijn uit de privacyverklaring waarmaken                                 | Akkoord op de termijn                           |
| Een extra kind bijkopen, per jaar of per maand (ADR-230): een tweede product in de kassa, en de grens van 3 kinderen per code in plaats van per apparaat                                             | Claude        | Staat nu als "binnenkort" op de ouderpagina en `/kopen`                             | Premium per gezin                               |
| Betalen per maand, € 9,95 (Mollie: mandaat, abonnement, webhook, opzeggen)                                                                                                                           | Claude        | Staat nu als "binnenkort" op de site (ADR-196)                                      | Later (24 september)                            |
| Groep 1 en 2: fase 1 tot en met 3, van tellen tot letterklanken (stappen [hieronder](#groep-1-en-2))                                                                                                 | jij en Claude | Groep 1 en 2 kunnen hun groep kiezen (ADR-244); nu meten of er vraag is             | De teller: hoe vaak `/1` en `/2` gekozen worden |
| Klassencode stap B: klasmodus op schoolapparaten, overzicht voor de leerkracht, verwerkersovereenkomst, betalen op factuur                                                                           | jij en Claude | Een school koopt voor inzicht; dat maakt leer.nu verwerker voor de school (ADR-200) | Gezinsaccount live, besluit na stap A           |

### Groep 1 en 2

Stap 0 staat in #185: een kind uit groep 1 of 2 kan zijn groep kiezen, en de
teller telt het (ADR-244). Tellen doet hij pas als `schema.sql` opnieuw
gedraaid is (actie 6 hierboven). Wat nog komt, in deze volgorde. Wat, waarom en de
opnamelijst staan in [kleuters.md](kleuters.md).

1. **De teller uitlezen op 8 oktober** — _jij en Claude_: hoe vaak `/1` en `/2`
   gekozen worden naast de andere groepen. Dan kiezen: fase 1 bouwen, langer
   meten, of groep 1 en 2 weer uit de groepsvraag.
2. **De stem voor fase 1 inspreken** — _jij_: 55 korte opnames (getallen,
   "Waar is …?", vragen en terugkoppeling), ongeveer een uur. Kan al vóór het
   besluit.
3. **Fase 1 bouwen: tellen en getallen** — _Claude_, na een ja bij stap 1:
   - de kleuterstand: alles voorgelezen, alleen tikken met drie keuzes, rondes
     van 5 of 6, geen typen, toetsstand of cijfer;
   - zes onderwerpen: hoeveel zie je, getalbeelden, cijfers, meer of minder,
     wat komt erna, hoeveel zijn er verstopt;
   - de plaatjes getekend in code, in de huisstijl;
   - Vandaag voor een kleuter met één grote knop, en de diploma's om te
     printen;
   - de grens van gratis en premium voor kleuters, met een eigen ADR;
   - de opnames omzetten en even hard maken, en een deel voor gesproken tekst
     in de schrijfwijzer.
4. **De woordenlijst voor fase 2 kiezen** — _jij en Claude_: ongeveer 70
   woorden die een kind van 4 als plaatje herkent.
5. **Fase 2 bouwen: klappen en rijmen** — _Claude tekent de plaatjes en bouwt,
   jij spreekt de woorden in_.
6. **Fase 3 bouwen: beginklank, hakken en plakken, letterklanken** — _jij
   spreekt de losse klanken in, Claude bouwt_. Losse klanken kunnen niet met
   een browserstem.

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
| Privacypagina (`/privacy`)                                                                                                         | De eigenaar bepaalt later wat erin komt (24 september); de vijf vragen staan bij het gezinsaccount                                                                                                                                  |
| Gezinsaccount live zetten                                                                                                          | Later (24 september); de stappen staan hierboven                                                                                                                                                                                    |
| De DNS-records van Resend voor de kassa                                                                                            | Geparkeerd op 25 september; de mail van Google Workspace werkt al. Resend op een eigen subdomein, bijvoorbeeld `send.leer.nu`                                                                                                       |
| Een bericht of mail aan ouders (bijvoorbeeld "klaar voor de toets")                                                                | Kan pas met het gezinsaccount, en dan met toestemming                                                                                                                                                                               |
| Proefperiode                                                                                                                       | Bewust niet: een ouder die zijn kind wil laten oefenen, koopt meteen (ADR-192)                                                                                                                                                      |

## Open beslissingen

| Vraag                                                                                                                                                        | Voorstel                                                                                                                                                                         | Waar het staat                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Mag "Klaar voor de toets, met premium" zonder code blijven? Strikt genomen is het een vorm van voortgang.                                                    | Laten staan: het is de sterkste aanleiding om premium te kopen                                                                                                                   | ADR-193                              |
| Fase 1 voor groep 1 en 2 bouwen (ADR-244)?                                                                                                                   | Bouwen als ouders van kleuters de groepsvraag duidelijk gebruiken; samen bekijken bij het uitlezen op 8 oktober                                                                  | [kleuters.md](kleuters.md)           |
| Mag het aantal op Vandaag ("N vragen die herhaald moeten worden") zonder code blijven?                                                                       | Laten staan als lokkertje                                                                                                                                                        | ADR-192                              |
| Met een account elk antwoord van een kind op de server bewaren (`pogingen`: goed of fout, reactietijd, het antwoord, tijdstip)? Het is de gevoeligste tabel. | Bewaren: de doelen van de ouder en het inzicht in wat telkens fout gaat worden eruit geteld. Wel in de privacyverklaring noemen, en een kortere termijn overwegen dan 24 maanden | `supabase/migrations/0001_gezin.sql` |

## Klein onderhoud

Niets open.

## Gedaan (recent)

| PR        | Wat                                                                                                                                                                                                                                                                                                                                  | ADR      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| #186      | De kop van een vak- of onderwerppagina noemt zonder naam het onderwerp ("Provincies van Nederland oefenen"), en onder een onderwerp staan de andere onderwerpen van het vak als echte links, voor Google. Het app-icoon is de hele Denker op een tegel in koraal diep, het tabblad Denker los                                        | 245, 246 |
| #185      | Groep 1 en 2 in de groepsvraag, eerst om te meten: voor een kleuter "Voor groep 1 en 2 komt er iets aan" op Vandaag, de teller telt `/1` en `/2`, migratie 0004, en het plan met de opnamelijst in `kleuters.md`                                                                                                                     | 244      |
| #184      | De groep bovenaan Vandaag: een nieuw kind kiest zijn groep (of "Weet ik niet") en daarna een van de vijf onderwerpen van die groep, in plaats van altijd de provincies; de teller telt de gekozen groep                                                                                                                              | 243      |
| #183      | Wat er op de server staat, nu en met het gezinsaccount; een vijfde vraag voor de privacyverklaring (elk antwoord van een kind bewaren of niet); de logs van Supabase bij de verwerkersovereenkomst; en geen klantnamen in de notitie van een premiumcode                                                                             | —        |
| #182      | Feedback op de navigatie: een witte tabbalk die opvalt (actief in koraaltint met streep), met Ouders als vierde tab; een fijnere tegelrand aan een bureau; op `/oefenen` de vaktegels van Vandaag; alle vaktegels even hoog; en op elke vakpagina springt elke keuze naar het volgende onderdeel                                     | 242      |
| #181      | Nieuwe navigatie en vakkleuren: vakken 70° uit elkaar (klok roze), een witte kop met premium als enige opvallende knop, een zijbalk met Oefenen en de vakken (inklapbaar) aan een bureau, `/oefenen` met de vakken als kaarten, en op een telefoon een kop op de grond met drie ronde knoppen en de tabs Vandaag · Oefenen · Jij     | 241      |
| #180      | Witte tegels zoals op Vandaag (rand in de lichte vaktoon, onderkant en plaat in de heldere vakkleur) op elke vakpagina, een witte rail, en één kopkleur op elke pagina                                                                                                                                                               | 240      |
| #179      | Kleur erin: room als grond en perzik als warm vlak, de kop van een vakpagina in de vaktint, kaarten, tegels en chips met een rand in de vakkleur, het stapnummer als munt, de actieve tab in nacht met zon, zon op een geoefende dag, de diplomategel en premium, en een tint per instelling op Jij                                  | 239      |
| #176      | Kleurblokken (richting 1b): melk als grond, nacht als accent buiten een vak, een welkomstvlak in koraal, de rondes van vandaag als vaktegels, weekdoelen als pillen, een vakvlak op de vakpagina, en in een ronde de vraag als enige gekleurde vlak met een witte terugkoppelkaart                                                   | 238      |
| #175      | Denker in stijl Strip: witte ogen met pupil in nacht, geen losse punt, elf uitdrukkingen (nieuw: verdrietig, jaloers, verbaasd, verward), het nieuwe beeldmerk in logo en app-icoon, de bewegingen uit de levering, en verward op het foutscherm en bij een kaart die niet laadt                                                     | 237      |
| #174      | Verbeteringen uit de review van kind en ouder: "Ik ben de ouder" in plaats van een koopknop bij het kind, stoppen zonder nullen, de terugknop in een ronde, één premiumblok op de ouderpagina, "Ouderpagina" als naam, e2e voor een kind met een ingelogde ouder, en kleinere teksten                                                | 236      |
| #173      | Besluiten op de review: spelvorm overal, het woord premium mag bij het kind en de prijs op `/voor-ouders`, en de ouderpagina opent met "Hier vind je je ouderinstellingen."; en #172: een cijfer op Vandaag alleen bij een toets                                                                                                     | 234, 235 |
| #171      | Review kind en ouder in acht toestanden (`docs/review-kind-en-ouder.md`) en de eenduidige tekstfixes: woordenlijst, geen zin die met een cijfer begint, en onware beloftes op `/voor-ouders`, `/premium` en `/kopen`                                                                                                                 | —        |
| #170      | Een keuze in het eerste onderdeel van een vakpagina springt naar het tweede                                                                                                                                                                                                                                                          | 233      |
| #169      | Jij zonder premium en met dichte diplomavakken; een deur voor de premiumpagina; Ouders in de navigatie; account- en pincodevensters met eigen teksten; ouderpagina met voorbeeld, code en instellingen (sessieduur, pincode); Zo werkt leer.nu in de huisstijl; geen eindeloze plekvraag offline; Jouw fouten gratis op de vakpagina | 232      |
| #168      | Jouw fouten gratis in de gratis manieren; zonder naam geen "Hier begin je mee"; Zo werkt leer.nu in vier stappen; "Klaar voor vandaag" alleen als er vandaag iets te herhalen was; Friesland in plaats van Fryslân                                                                                                                   | 231      |
| #167      | Nieuwe prijzen: premium per jaar in de kassa en op de site, voor 3 kinderen op 3 apparaten; een extra kind als binnenkort op de ouderpagina en `/kopen`; de klassencode exclusief btw                                                                                                                                                | 230      |
| #166      | Geen naam en geen groep vooraf: de app opent op Vandaag met een kind zonder naam, en vraagt de naam na de eerste ronde (weg te klikken), op Jij, vóór de toets, bij een tweede kind en op de ouderpagina                                                                                                                             | 229      |
| #165      | De geheugencheck: één ronde zonder hulp per kind, over vragen van 3 tot 8 weken geleden, zonder invloed op de dozen; de ouder ziet de uitslag en het aanbod                                                                                                                                                                          | 228      |
| #164      | "Deze week" op de ouderpagina: per kind hoeveel vragen het deze week oefende en de volgende twee herhaaldagen, zonder code met het aanbod; niets voor het kind                                                                                                                                                                       | 227      |
| #163      | Een plek op de code wordt pas genomen als een kind premium start; de ouder ziet onder Apparaten welke apparaten de code gebruiken en vervangt er zelf een (3 keer per jaar); na 90 dagen zonder gebruik komt een plek vrij                                                                                                           | 226      |
| #162      | Een code heeft een begindatum; `maak-codes.mjs --klaspas` maakt een code voor een schooljaar, 1 september tot en met 31 augustus                                                                                                                                                                                                     | 225      |
| #161      | Zoeken en zelf typen gratis in elk vak, gratis manieren eerst op een vakpagina, zand tot onderaan, geen tekstflits bij het openen, nieuwe teksten op Vandaag, bij de naam en de groep, voor ouders en in de vraag aan de ouders, en `/scholen` in de vorm van de premiumpagina                                                       | 224      |
| #155      | Alle teksten als CSV exporteren en importeren (`npm run teksten:export` en `teksten:import`), en het klein onderhoud                                                                                                                                                                                                                 | —        |
| #154      | Een zin per diploma (79), en de tegels op de overzichtspagina's in de vorm van het diploma                                                                                                                                                                                                                                           | 219      |
| #153      | Het diploma liggend, naar het herontwerp: vakkleur, Denker, van wie, wat je kunt en de score                                                                                                                                                                                                                                         | 218      |
| #152      | Engels: 183 woordjes voor groep 7 en 8 als derde deel van Taal, met kiezen, typen, ontdekken, overleven, een diploma per set en een werkblad                                                                                                                                                                                         | 217      |
| #151      | Een pagina voor de klas (`/scholen`): wat een klassencode is, en aanvragen per mail aan info@leer.nu                                                                                                                                                                                                                                 | 216      |
| #150      | Elke maandag het weekoverzicht van de teller als issue in GitHub                                                                                                                                                                                                                                                                     | 215      |
| #149      | Een pagina voor ouders (`/voor-ouders`), en premium ook zonder naam te bekijken                                                                                                                                                                                                                                                      | 214      |
| #148      | "Over dit onderwerp": wat erin zit en de vragen van ouders, op de pagina voor Google en onder het onderwerp in de app                                                                                                                                                                                                                | 213      |
| #147      | Een QR-code op elk werkblad en een klassenset van 30 verschillende bladen                                                                                                                                                                                                                                                            | 212      |
| #145      | Een werkblad om te printen per onderwerp, met een blinde kaart, sommen, klokken, vlaggen of zinnen en de antwoorden erbij                                                                                                                                                                                                            | 211      |
| #144      | Een anonieme teller: per dag hoe vaak iemand binnenkwam, een ronde begon, een naam invulde, deelde of naar premium keek; nooit wie                                                                                                                                                                                                   | 210      |
| #143      | Deel je uitslag na een ronde, met een link naar hetzelfde onderwerp en zonder naam                                                                                                                                                                                                                                                   | 209      |
| #142      | Eerst een ronde proberen, daarna je naam: een onderwerp opent zonder naamveld, en de eerste kaart zegt wat leer.nu is                                                                                                                                                                                                                | 208      |
| #141      | Vindbaar in Google: een eigen pagina met titel en tekst per vak en onderwerp, sitemap.xml en robots.txt                                                                                                                                                                                                                              | 207      |
| #140      | De groep doet iets op Vandaag: eigen starters per groep, de groep in de kop, en de rij "Past bij groep" voor wie al geoefend heeft                                                                                                                                                                                                   | 206      |
| #139      | Meldingen na een knop (account, wachtwoord, pincode, code) als duidelijk vak: groen met vinkje, rood met uitroepteken                                                                                                                                                                                                                | 205      |
| #138      | Vandaag voor een nieuw kind: eerste ronde, vakken, hoe het werkt; menu onderin duidelijker; op een telefoon schuift de app niet meer weg                                                                                                                                                                                             | 203, 204 |
| #137      | Grotere stip voor een stad, avatar naast je naam, 48 nieuwe avatars, diplomanamen breken netjes af, twee teksten                                                                                                                                                                                                                     | 202      |
| #136      | De kassa wordt door een workflow gedeployd, bij elke wijziging en met de hand                                                                                                                                                                                                                                                        | 201      |
| #135      | Een ouder is geen profiel meer en telt niet mee in de drie; een kind kan van het apparaat; de pagina groeit mee op een groot scherm; klassencode van 40 plekken; een code geldt 365 dagen                                                                                                                                            | 198–200  |
| #134      | Alle interfaceteksten herschreven volgens een nieuwe schrijfwijzer: één woord per begrip, één vorm voor feedback                                                                                                                                                                                                                     | 197      |
| #132      | Eigen woordenlijsten zijn te oefenen; nieuwe prijzen € 79,95 per jaar en € 9,95 per maand (binnenkort)                                                                                                                                                                                                                               | 195, 196 |
| #131      | Scherpe letters op een desktop: ClearType terug op Vandaag, Baloo gehint                                                                                                                                                                                                                                                             | 194      |
| #130      | Triggers voor ouders: wat het kind wilde, en waar het klaar voor is                                                                                                                                                                                                                                                                  | 193      |
| #129      | Premiumgrens: gratis is oefenen, premium is alles wat over weken gaat; consistent door de hele app                                                                                                                                                                                                                                   | 192      |
| #128      | Menu altijd in beeld op een telefoon, logo blijft wit, "ken je inmiddels", derde persoon op de ouderpagina                                                                                                                                                                                                                           | 191      |
| #124–#127 | Gezinsaccount stap 3: een kind mee naar het account, synchroniseren, inloggen met een code                                                                                                                                                                                                                                           | 187–190  |
