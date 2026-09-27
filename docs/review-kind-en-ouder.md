# Review leer.nu: kind en ouder, in acht toestanden

Stand: 27 september 2026, op `main` na #169 (ADR-232) en #170 (ADR-233). Een
review, geen bouwopdracht: wat hier staat is gezien of gelezen, en de ingrepen
zijn voorstellen. Alleen de eenduidige tekstfixes zitten in dezelfde PR als dit
rapport.

## Hoe het is gedaan

- **Voorwaarde.** De deploy van #169 is groen, en de nieuwe teksten en klassen
  staan in de live bundels (`index-C884HPdx.js`, `index-BYAgFMi2.css`).
- **Context.** Gelezen: de schrijfwijzer, de huisstijl, `ouder-en-kind.md`,
  de roadmap, ADR-220 tot en met ADR-233, alle 1.524 sleutels van `nl.ts`, en
  alle e2e- en unittests (zie "Testdekking").
- **Lopen.** Een Playwright-script liep elke reis zoals een gebruiker: klikken
  en typen, geen diepe links behalve de gedeelde werkbladlink. Op 390×844 en
  1280×800, met een screenshot en de zichtbare tekst per stap. Dat zijn 16
  runs en ongeveer 300 stappen.
  - Flow 1, 4, 7 en 8 draaiden op een lokale bouw met de live instelling: geen
    gezinsproject, dus de geboortejaar-poort.
  - Flow 2, 3, 5 en 6 draaiden op een bouw mét gezinsproject, met de mocks uit
    `e2e/gezin.ts`.
  - Een code is gezet zoals `playwright.config.ts` dat doet, of ingetypt tegen
    een nagebootste server.
- **Live.** Een browser op www.leer.nu kon niet: deze omgeving liet de
  browser het certificaat van de proxy niet vertrouwen. In de plaats daarvan:
  - de live bundel doorzocht op elke tekst die hieronder als fout staat;
  - de statische live pagina's (`/kopen/`, `/scholen`) opgehaald.

  Elke bevinding uit de live flows is zo teruggevonden op www.leer.nu.

**Ernst.**

- **blokkeert**: strijdig met een besluit of R-11, of een onware belofte over
  geld.
- **verwart**: de gebruiker snapt het niet, of leest iets onwaars.
- **schuurt**: klopt, maar niet volgens de schrijfwijzer of de toon.
- **detail**: klein.

**Feit** betekent gezien en herhaald. **Interpretatie** is een oordeel.

## De tien belangrijkste bevindingen

Op ernst, en binnen dezelfde ernst eerst de live flows (1, 4, 7, 8).

| #   | Ernst     | Flow       | Bevinding                                                                                                                                                                                                                                                                                                                                                                                 | Feit of interpretatie                    | Ingreep                                                                                                        |
| --- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | blokkeert | 4, 8       | De kassa (`/kopen/`) verkoopt wat gratis is: "Ontdekken en meerkeuze zijn gratis … Premium opent de rest: aanwijzen, zoeken en zelf typen". Sinds ADR-224 zijn alle vier de manieren gratis. Een ouder betaalt voor iets wat hij al heeft.                                                                                                                                                | feit (live)                              | **In deze PR** hersteld.                                                                                       |
| 2   | blokkeert | 1, 2       | Een kind komt zonder pincode bij een koopknop. Op een premiummanier, of via "Ik wil dit diploma halen", opent het venster "Vraag het even aan je ouders". Na "Mijn ouders zijn erbij" staat daar "Een code kopen" (`premium.kopenKnop`, `OuderVraag.tsx`). Dat botst met R-11: een prijs of koopknop staat alleen achter de ouderpincode.                                                 | feit                                     | De knop vervangen door "Ik ben de ouder", die naar de pincode gaat. Staat onder "Daarna".                      |
| 3   | blokkeert | 4, 8       | Drie beloftes aan ouders zijn niet waar. Op `/voor-ouders` "staan alle manieren en de diploma’s open" met premium (ADR-224). Op `/premium` staat "Meer kinderen kun je erbij nemen" (ADR-230: binnenkort, en niet op die pagina). En "tellingen zonder naam of apparaatnummer", terwijl sinds ADR-226 een willekeurig apparaatnummer meegaat.                                             | feit (live)                              | **In deze PR** hersteld.                                                                                       |
| 4   | verwart   | 1, 2       | Zonder code ziet een kind op zijn eigen schermen om premium gevraagd worden. Op Vandaag staat het blok "Je doelen voor deze week" met een label Premium en de knop "Bekijk premium". Op de vakpagina staan vijf tegels en de diplomamuur met het label Premium. Met code blijven die labels ook staan (flow 3 en 7), en zeggen ze niets meer.                                             | feit; R-11 is interpretatie              | Zonder code het doelenblok weglaten. Op kindschermen een slotje in plaats van het woord. Staat onder "Daarna". |
| 5   | verwart   | 4, 8       | De ouderpagina opent met "Hier stel je je ouderaccount in." (`ouder.intro`). Live bestaat er geen ouderaccount (GEZIN_URL staat uit), en de pagina toont er ook geen.                                                                                                                                                                                                                     | feit (live)                              | Beslissing voor jou, want het is je eigen tekst (ADR-232). Voorstel: "Hier regel je leer.nu voor je kinderen." |
| 6   | verwart   | 1, 2, 3, 7 | Wie een ronde stopt voordat hij iets beantwoordde, krijgt "Ronde klaar" met een blije Denker. Daarbij staat "0 vragen, 0 goed" en "Je stopte na 0 van de 12 vragen". Met code komt daar nog "Morgen komen er 12 terug" en "nog ongeveer 18%" bij, over een eerdere ronde.                                                                                                                 | feit                                     | Bij 0 antwoorden terug naar de vakpagina, of alleen "Stoppen mag." zonder cijfers. Staat onder "Daarna".       |
| 7   | verwart   | alle kind  | De terugknop van de browser of telefoon tijdens een ronde verandert het adres naar `/topografie`, maar de ronde blijft staan. Het kind drukt en er gebeurt niets.                                                                                                                                                                                                                         | feit                                     | De terugknop is "Stoppen", met de gewone uitslag. Staat onder "Daarna".                                        |
| 8   | verwart   | 2, 3, 5, 6 | Een ingelogde ouder krijgt tegenstrijdige poorten en beloftes. De premiumdeur vraagt nog het geboortejaar, terwijl de ouderpagina het account vraagt. Het inlogvenster zegt "Zonder account werkt alles gewoon", terwijl je daar zonder account niet verder kunt. En "Hoe heet je kind?" belooft "De naam … gaat niet naar onze server", terwijl "Zet in mijn account" hem wel meestuurt. | feit (lokaal; live bestaat dit nog niet) | Hoort op de checklist "Gezinsaccount live zetten". Staat onder "Daarna".                                       |
| 9   | schuurt   | 4          | Op de ouderpagina zonder code wordt vijf keer om premium gevraagd: "Bekijk premium", twee keer "Een code kopen" en twee keer "Wat zit er in premium?". ADR-124 zegt één keer per pagina.                                                                                                                                                                                                  | feit                                     | Eén premiumblok. Hoe gaat het? en Deze week verwijzen daarnaar. Staat onder "Daarna".                          |
| 10  | schuurt   | 1, 7       | Kindteksten wijken af van de schrijfwijzer: "Kies een oefening", "om te blijven onthouden", "Vraag je ouders voor een code", "moet je nog oefenen", en zinnen die met een cijfer beginnen. Op Topo zegt "Ik weet het niet" niet "Geen probleem. Deze komt later nog terug.", wat de andere vier vakken wel doen.                                                                          | feit                                     | De teksten zijn **in deze PR** hersteld. De Topo-regel is code, en staat onder "Daarna".                       |

## Matrix: flows tegen reizen

Een getal is het aantal bevindingen in die cel. "goed" betekent gelopen zonder
bevinding. "bestaat niet" is een combinatie die een gebruiker niet kan
tegenkomen. "niet gelopen" was met de tijd en de mocks niet te bereiken (zie
"Testdekking").

| Reis                                   | 1 kind       | 2 kind, ingelogd | 3 kind, ingelogd, premium | 7 kind, premium |
| -------------------------------------- | ------------ | ---------------- | ------------------------- | --------------- |
| Eerste bezoek zonder naam              | 3            | bestaat niet     | bestaat niet              | 3               |
| Gedeelde werkbladlink                  | goed         | goed             | goed                      | goed            |
| Terugkeren: Vandaag, dagplan           | 2            | 1                | 2                         | 2               |
| Fouten oefenen                         | 1            | 1                | 1                         | 1               |
| Geheugencheck                          | niet gelopen | niet gelopen     | niet gelopen              | niet gelopen    |
| Diploma's                              | 1            | 1                | goed                      | goed            |
| Broertje of zusje (wisselaar)          | 1            | 1                | 1                         | 1               |
| Stuiten op premium of het ouderslot    | 3            | 3                | 2                         | 1               |
| Foutpaden: offline, stoppen, terugknop | 3            | 3                | 3                         | 3               |

| Reis                                   | 4 ouder      | 5 ouder, ingelogd | 6 ouder, ingelogd, premium | 8 ouder, premium |
| -------------------------------------- | ------------ | ----------------- | -------------------------- | ---------------- |
| Eerste keer: poort, pincode, ouderslot | 2            | 3                 | 3                          | 2                |
| Lezen wat het kind doet                | 3            | 3                 | 1                          | 1                |
| Premium: voor-ouders, prijzen, kassa   | 6            | 6                 | 1                          | 1                |
| Code invoeren, extra kind, apparaat    | 1            | 1                 | 1                          | 1                |
| Account: inloggen, uitloggen, overname | bestaat niet | 3                 | 3                          | bestaat niet     |
| Pincode vergeten                       | goed         | goed              | goed                       | goed             |

## Per flow

In de kolom "tekst" staat de sleutel uit `src/i18n/nl.ts`. "PR" betekent dat
de fix in deze PR zit.

### Flow 1: kind, niet ingelogd, geen premium (live)

| Stap               | Scherm                     | Tekst (sleutel)                                                                                                                        | Probleem                                                                                                              | Ernst     | Voorstel                                                                               |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| Eerste bezoek      | Vandaag                    | "Kies een oefening en begin met leren." (`home.todayOpen`)                                                                             | "oefening" staat in de woordenlijst onder _niet_. Feit.                                                               | schuurt   | PR: "Kies een onderwerp en begin met leren."                                           |
| Eerste bezoek      | Vandaag, Zo werkt het      | "…een onderwerp en een spelvorm." (`home.zo.oefen.uitleg`), en in de startbalk "manier" (`start.manier`)                               | Jouw keuze, maar het kind leest twee woorden voor één ding. Feit.                                                     | detail    | Beslissing: "spelvorm" overal, of alleen hier                                          |
| Eerste bezoek      | Vandaag, Zo werkt het      | "…kun jij je officiële leer.nu-diploma halen." (`home.zo.diploma.uitleg`)                                                              | Het diploma is niet officieel. "Voldoende" is een schoolcijferwoord. Interpretatie.                                   | detail    | Jouw tekst. Voorstel: "Oefen genoeg, dan haal je je leer.nu-diploma."                  |
| Eerste ronde       | "Ik weet het niet" op Topo | "Noord-Brabant ligt hier." plus het weetje                                                                                             | Geen "Geen probleem. Deze komt later nog terug." De andere vakken zeggen dat wel (`sums.dontKnowSub` e.a.). Feit.     | schuurt   | Dezelfde regel in `PracticeScreen.tsx` (code)                                          |
| Uitslag            | Ronde klaar                | "Herhaal je fouten" (`result.herhaalFouten`) naast de tegel "Jouw fouten"                                                              | De woordenlijst zegt "jouw fouten" als naam. Interpretatie, want het is een werkwoordzin.                             | detail    | "Oefen jouw fouten"                                                                    |
| Terugkeren         | Vandaag                    | "Je doelen voor deze week · Premium · Met premium kies je elke week … · Bekijk premium" (`premium.wat.weekdoelen`, `premium.slotKnop`) | Een koopduw naar het kind (R-11). De knop gaat naar een deur die het kind niet door mag. Feit, R-11 is interpretatie. | verwart   | Zonder code niet tonen                                                                 |
| Diploma's          | Jij, diplomavenster        | "Ik wil dit diploma halen" (`premium.vraagKnop`), dan het venster met "Een code kopen"                                                 | Koopknop zonder pincode (R-11). Feit.                                                                                 | blokkeert | "Een code kopen" vervangen door "Ik ben de ouder"                                      |
| Stuiten op premium | Vakpagina                  | Het label "Premium" op Bliksemronde, Overleven, Oefentoets, Topodiploma en "Jouw topodiploma’s" (`premium.label`)                      | Vijf keer het woord premium op een kindscherm. Feit.                                                                  | verwart   | Een slotje, zonder het woord                                                           |
| Stuiten op premium | Venster                    | "Wat is premium? · Lees eerst wat je ermee kunt" (`ouderVraag.bekijken`, `…Regel`)                                                     | Stuurt het kind naar de premiumpagina, met prijs, achter een deur die het kind niet door mag. Interpretatie.          | schuurt   | Weglaten                                                                               |
| Broertje of zusje  | Wisselaar                  | "Ouder · Instellingen, premium en hoe het gaat" (`wisselaar.ouder`, `wisselaar.ouderRegel`)                                            | Dezelfde pagina heet ook "Ouders" (balk), "Voor de ouder" (kop) en "Dit is de ouderpagina" (deur). Interpretatie.     | verwart   | Eén naam, "Ouderpagina", in de woordenlijst                                            |
| Ouderslot          | Poort                      | "Ben je een volwassene?" … "Dat klopt niet. Haal er even je ouders bij."                                                               | Goed: kort, zonder oordeel, met een uitweg.                                                                           | —         | —                                                                                      |
| Foutpad: terugknop | Ronde                      | Het adres wordt `/topografie`, maar de ronde blijft staan                                                                              | Het kind drukt terug en er gebeurt niets. Feit.                                                                       | verwart   | Terug is "Stoppen"                                                                     |
| Foutpad: stoppen   | Uitslag                    | "Ronde klaar · 0 vragen, 0 goed · Je stopte na 0 van de 12 vragen." (`result.gedaan`, `result.stoppedEarly`)                           | Een feestscherm met nullen voor een ronde die er niet was. Feit.                                                      | verwart   | Bij 0 antwoorden terug naar de vakpagina                                               |
| Foutpad: offline   | Ronde                      | "Deze ronde laadt even niet." (`practice.mapFailed`)                                                                                   | Zegt niet waarom, en niet wat het kind kan doen. Interpretatie.                                                       | detail    | "De kaart laadt niet. Is er internet? Probeer het zo nog eens." met een knop "Opnieuw" |

### Flow 4: ouder, niet ingelogd, geen premium (live)

| Stap          | Scherm         | Tekst (sleutel)                                                                                                                                             | Probleem                                                                                                                                                   | Ernst     | Voorstel                                                                                              |
| ------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| Eerste keer   | Pincode kiezen | "Maak een ouderpagina · Maak je ouderpagina aan om de voortgang van je kind(eren) te zien. …" (`ouder.maakTitel`, `ouder.maakUitleg`)                       | Zonder code ziet de ouder geen voortgang, alleen het voorbeeld. "kind(eren)" en "hierbij" lezen stroef, en de derde zin herhaalt de tweede. Interpretatie. | schuurt   | Jouw tekst. Voorstel: "Kies een pincode. Dan kun alleen jij bij je ouderpagina, en je kinderen niet." |
| Eerste keer   | Ouderpagina    | "Hier stel je je ouderaccount in." (`ouder.intro`)                                                                                                          | Live bestaat er geen ouderaccount. Feit.                                                                                                                   | verwart   | "Hier regel je leer.nu voor je kinderen."                                                             |
| Lezen         | Ouderpagina    | "Bekijk premium", twee keer "Een code kopen", twee keer "Wat zit er in premium?"                                                                            | Vijf keer om premium gevraagd op één pagina (ADR-124). Feit.                                                                                               | schuurt   | Eén premiumblok                                                                                       |
| Lezen         | Deze week      | "Met premium zet het plan ze voor Noor klaar om te herhalen: morgen." (`ouder.weekPlanPremium`)                                                             | Een dubbele punt met één los woord erachter. Interpretatie.                                                                                                | detail    | "…klaar om te herhalen, {dagen}."                                                                     |
| Lezen         | Deze week      | "…Zo blijft het hangen." (`ouder.weekAanbod`, `ouder.geheugencheckAanbod`)                                                                                  | Het herhaalsysteem wordt "in deze woorden" uitgelegd: "Zo blijft het in het hoofd." Feit.                                                                  | detail    | PR                                                                                                    |
| Premium       | `/voor-ouders` | "…staan alle manieren en de diploma’s open." (`ouders.kosten.premium`)                                                                                      | Onwaar sinds ADR-224. Ook ontbreekt "3 kinderen op 3 apparaten". Feit.                                                                                     | blokkeert | PR                                                                                                    |
| Premium       | `/voor-ouders` | "…ziet jouw kind wat hij/zij goed en fout heeft gedaan." (`ouders.oefenen.tekst`)                                                                           | "hij/zij" en "jouw" terwijl elders "je kind … het" staat. Interpretatie.                                                                                   | schuurt   | "…ziet je kind wat het goed en fout had."                                                             |
| Premium       | `/voor-ouders` | De prijs, zonder deur                                                                                                                                       | Een kind komt hier via "Ik ben een ouder" op Vandaag. Of R-11 ook voor deze openbare pagina geldt, is niet besloten. Interpretatie.                        | schuurt   | Beslissing voor jou                                                                                   |
| Premium       | `/premium`     | "Meer kinderen kun je erbij nemen." (`premium.usp.gezinUit`)                                                                                                | Onwaar (ADR-230). Feit.                                                                                                                                    | blokkeert | PR                                                                                                    |
| Premium       | `/premium`     | "…zonder naam of apparaatnummer." (`premium.waarom.apparaatUit`)                                                                                            | Onwaar sinds ADR-226. Feit.                                                                                                                                | blokkeert | PR                                                                                                    |
| Premium       | `/premium`     | "…blijft de stof hangen." (`premium.etalageKop`), "Aanrader" (`premium.aanrader`)                                                                           | De schrijfwijzer wil geen verkoopzinnen voor ouders. Interpretatie.                                                                                        | schuurt   | "Oefenen is gratis. Premium plant het herhalen en opent de diploma’s." Het label weglaten.            |
| Premium       | `/kopen/`      | "Ontdekken en meerkeuze zijn gratis … Premium opent de rest: aanwijzen, zoeken en zelf typen", en in de lijst "Aanwijzen, zoeken en zelf typen, in elk vak" | Onwaar sinds ADR-224. Een ouder betaalt voor iets wat al gratis is. Feit.                                                                                  | blokkeert | PR                                                                                                    |
| Premium       | `/scholen`     | "…een jaar geldig." (`scholen.intro`)                                                                                                                       | Een klassencode is sinds ADR-225 een klaspas, die het schooljaar geldt. Interpretatie: dat hangt af van hoe je de klassencode verkoopt.                    | detail    | "…een schooljaar geldig."                                                                             |
| Code invoeren | Ouderpagina    | "Code van dit apparaat halen · Dan komt er een plek vrij voor een ander apparaat." (`premium.afmeldenUitleg`)                                               | Alleen waar als dit apparaat een plek had (ADR-226). Feit.                                                                                                 | detail    | "Had dit apparaat een plek, dan komt die vrij."                                                       |

### Flow 7: kind, niet ingelogd, premium (live). Alleen wat anders is dan flow 1

| Stap          | Scherm    | Tekst (sleutel)                                                                                                            | Probleem                                                                                                  | Ernst   | Voorstel                                                              |
| ------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------- |
| Terugkeren    | Vandaag   | "Cijfer 4,0 · 4 van de 12 goed" (`home.recentLine`), onder een gewone meerkeuzeronde                                       | Een schoolcijfer bij oefenen. Dat is het oordeel dat de schrijfwijzer bij fouten vermijdt. Interpretatie. | schuurt | Het cijfer alleen bij de oefentoets. Bij oefenen: "4 van de 12 goed". |
| Vakpagina     | Vakpagina | Het label "Premium" blijft op de tegels staan, ook mét code                                                                | Het label zegt een kind met premium niets. Feit.                                                          | detail  | Met code het label weglaten                                           |
| Jij           | Jij       | "Je oefent als Noor. Hieronder vind je je instellingen, jouw diploma’s, welke stof … en hoe vaak je oefent." (`you.intro`) | 17 woorden; de schrijfwijzer zegt hooguit 12. Feit.                                                       | detail  | "Hier staan je instellingen, je diploma’s en wat je beheerst."        |
| Stoppen bij 0 | Uitslag   | Daarbij "Morgen komen er 12 terug" en "…nog ongeveer 18% van" (`result.morgenTerug`, `result.onthoud`)                     | Gaat over een eerdere ronde, en staat onder een ronde zonder antwoorden. Feit.                            | verwart | Zie bevinding 6                                                       |

Geheugencheck, doelen en diploma's: geen afwijking gezien.

### Flow 8: ouder, niet ingelogd, premium (live). Alleen wat anders is dan flow 4

| Stap        | Scherm      | Tekst (sleutel)                                                                       | Probleem                                                             | Ernst   | Voorstel      |
| ----------- | ----------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------- | ------------- |
| Eerste keer | Ouderpagina | "Hier stel je je ouderaccount in." (`ouder.intro`)                                    | Zoals in flow 4. Feit.                                               | verwart | Zie flow 4    |
| Premium     | `/premium`  | "Heb je al een code?" (`premium.codeTitel`) boven "Premium staat aan op dit apparaat" | Een vraag die al beantwoord is. Feit.                                | detail  | Kop "Je code" |
| Code        | Ouderpagina | "Je code: LEER-E2ET-ESTS · Vul deze code in op een ander apparaat …"                  | Goed: wat een ouder op een tweede apparaat nodig heeft, staat erbij. | —       | —             |

### Flow 2: kind, ingelogd, geen premium (lokaal). Alleen wat anders is dan flow 1

| Stap        | Scherm      | Tekst (sleutel)                                                                    | Probleem                                                                                                                | Ernst   | Voorstel                                                          |
| ----------- | ----------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------- |
| Ouderslot   | Ouders-knop | "Even je pincode · Vier cijfers, en je bent er."                                   | Goed: de ouder zette al een pincode, dus alleen die wordt gevraagd.                                                     | —       | —                                                                 |
| Premiumdeur | `/premium`  | "Deze pagina is voor ouders … Vul dan je geboortejaar in." (`premium.poortUitleg`) | Op dit apparaat is het account de poort, maar deze deur vraagt nog een jaartal. Een kind komt er zo alsnog langs. Feit. | verwart | Met een gezinsproject is de deur de pincode, zoals de ouderpagina |
| Testdekking | —           | —                                                                                  | Deze flow heeft geen enkele e2e-test (zie "Testdekking"). Feit.                                                         | detail  | Eén e2e-reis                                                      |

### Flow 3: kind, ingelogd, premium (lokaal). Alleen wat anders is dan flow 2

| Stap       | Scherm    | Tekst (sleutel)                                     | Probleem                        | Ernst   | Voorstel   |
| ---------- | --------- | --------------------------------------------------- | ------------------------------- | ------- | ---------- |
| Terugkeren | Vandaag   | "Cijfer 1,8 · 1 van de 12 goed" (`home.recentLine`) | Zoals in flow 7. Interpretatie. | schuurt | Zie flow 7 |
| Vakpagina  | Vakpagina | Het label "Premium" op de tegels, mét code          | Zoals in flow 7. Feit.          | detail  | Zie flow 7 |

### Flow 5: ouder, ingelogd, geen premium (lokaal). Alleen wat anders is dan flow 4

| Stap        | Scherm           | Tekst (sleutel)                                                                                                         | Probleem                                                                                                                                | Ernst   | Voorstel                                                                             |
| ----------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| Eerste keer | Inlogvenster     | "Log in met je ouderaccount", met eronder "…Zonder account werkt alles gewoon zoals je gewend bent." (`account.uitleg`) | In dit venster kun je zonder account niet verder. Het blok zegt het omgekeerde van de poort, en de kop "Account" staat er dubbel. Feit. | verwart | In de poort alleen de zin van de kop, zonder het blok met uitleg                     |
| Eerste keer | Naam van je kind | "…De naam blijft op dit apparaat en gaat niet naar onze server." (`naam.ouder.uitleg`)                                  | Met een account stuurt "Zet in mijn account" de voornaam wel naar de server (ADR-187). Feit.                                            | verwart | Met een account: "De naam blijft op dit apparaat, tot je je kind in je account zet." |
| Account     | Overname         | "Ik ben hun ouder of voogd, en ik geef toestemming." (`overname.toestemming`)                                           | "hun" bij één kind. Feit.                                                                                                               | detail  | Enkelvoud bij één kind                                                               |
| Account     | Wissen           | "Wat je kinderen hier oefenen, staat op dit apparaat en nergens anders." (`wissen.uitleg`)                              | Niet meer waar zodra een kind in het account staat. Interpretatie: in flow 5 stond het kind er nog niet in.                             | verwart | Laten afhangen van de overname                                                       |
| Premiumdeur | `/premium`       | Geboortejaar, terwijl de ouder ingelogd is                                                                              | Zoals in flow 2. Feit.                                                                                                                  | verwart | Zie flow 2                                                                           |

### Flow 6: ouder, ingelogd, premium (lokaal). Alleen wat anders is dan flow 5

| Stap    | Scherm     | Tekst (sleutel)                                 | Probleem               | Ernst  | Voorstel   |
| ------- | ---------- | ----------------------------------------------- | ---------------------- | ------ | ---------- |
| Premium | `/premium` | "Heb je al een code?" boven "Premium staat aan" | Zoals in flow 8. Feit. | detail | Zie flow 8 |

## De overgangen tussen toestanden

- **Van geen premium naar premium.**
  - Na de code op de ouderpagina maakt het voorbeeld (Sanne) plaats voor het
    echte kind, en verdwijnen de koopknoppen. Goed.
  - De eerste premiumronde vraagt de server om een plek. Zonder antwoord
    begint de ronde nu toch (#169).
  - Voert een ouder de code in het venster van het kind in, dan start de ronde
    daarna niet vanzelf. Het kind moet opnieuw drukken. Uit de code gelezen,
    niet gelopen.
- **Van niet ingelogd naar ingelogd.** De poort vóór de pincode wisselt van
  geboortejaar naar account, maar de premiumdeur niet (bevinding 8). Het
  venster zegt "Zonder account werkt alles gewoon" op de plek waar je zonder
  account niet verder kunt. De beloftes "blijft op dit apparaat" (naam, wissen,
  `/voor-ouders`: "Zonder account.") zijn waar zolang er geen kind in het
  account staat. Zet ze op de checklist "Gezinsaccount live zetten".
- **Uitloggen.** Het accountblok gaat terug naar het inlogformulier, en de
  kinderen, de pincode en premium blijven staan. De zin "Wat je kinderen op dit
  apparaat hebben geoefend, blijft gewoon staan" klopt. Goed.
- **Een code die verloopt.** Niet gelopen: dat vraagt een datum in het
  verleden, en `verlopen.spec.ts` dekt het. Uit de code gelezen:
  - `/premium` zegt "Verleng hem vóór die dag";
  - op de ouderpagina staat geen knop om te verlengen;
  - de kassa verkoopt een nieuwe code en verlengt geen bestaande.

  Een ouder moet zelf bedenken dat "een nieuwe code kopen" verlengen is.

## Testdekking

**Hoe de tests een toestand opzetten.**

- Premium komt uit de `storageState` in `playwright.config.ts`: de sleutel
  `leernu.premium` met code E2ETESTS, geldig tot 2099, en `plek: true`.
- Zonder code: `test.use({ storageState: { cookies: [], origins: [] } })`.
- Een ingetypte code gaat tegen een nagebootste `premium_controleer`
  (`premium.spec.ts`).
- Een ingelogde ouder komt via `stubGezin` en `langsDePoort` (`e2e/gezin.ts`).
- Een kind met een naam komt via `signIn` (`e2e/naam.ts`), een kind met
  voortgang via `alsOnthouden` (`e2e/zaai.ts`).
- De e2e-bouw zet `VITE_GEZIN_URL`. Daardoor is de poort vóór de pincode in
  elke e2e-test het account, en komt de geboortejaar-poort van live in geen
  enkele e2e-test voor.

**Gaten per flow.**

| Flow | Wat geen test heeft                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| 1    | Het ouderslot met de geboortejaar-poort (alleen unit), de browser-terugknop, offline, en "Welkom terug" (TerugBlok). |
| 2    | Alles: geen enkele test loopt een kind op een apparaat met een ingelogde ouder en zonder code.                       |
| 3    | Fouten oefenen, diploma's, de wisselaar en de geheugencheck. Alleen losse stukken na een ouderactie.                 |
| 4    | De geboortejaar-poort vóór de pincode, en account aanmaken (het versturen).                                          |
| 5    | Uitloggen, overname, extra kind, een apparaat vervangen, en `/voor-ouders`.                                          |
| 6    | De geheugencheck-uitslag en Deze week mét code, een apparaat vervangen (alleen unit), en de kassa.                   |
| 7    | De geheugencheck mét code, de klok- en taaldiplomaronde, en de terugknop.                                            |
| 8    | Een code invoeren zonder in te loggen, en de wachttijd na drie foute pincodes (alleen unit).                         |

Schermen die geen enkele e2e-test bezoekt:

- het foutscherm "Er ging iets mis";
- "Welkom terug" na twee weken;
- het schooljaar printen;
- de schakelaars op Jij en een avatar kiezen;
- een naam of groep wijzigen op de ouderpagina;
- de werkbladen van Vlaggen en Taal;
- `CategoryScreen` (onbereikbaar: `/rekenen` opent de module).

**Tests die een onduidelijke tekst vastleggen.** De eerste drie zijn in deze
PR met de tekst meeveranderd.

- `premium.spec.ts:440` legde "om te blijven onthouden" vast. Dat is nu "vandaag terug moet".
- `aankondiging.spec.ts:76` legde de zin vast die met een cijfer begon.
- `screens.spec.ts:120` en `Apparaten.test.tsx:102` deden hetzelfde.
- `fouten.spec.ts:85` en `premium.spec.ts:215` leggen "Herhaal je fouten" vast.
- `onthouden.spec.ts:96-97`: "1 vragen" is een meervoud bij één. Er is geen
  enkelvoud-sleutel. Correct Nederlands vraagt een code-ingreep.
- `sums.spec.ts:257-268` legt het label "Premium" vast, ook mét code.
- `premium.spec.ts:441` legt "Leer.nu zet …" vast, met een hoofdletter.
  `src/config/brand.ts` verbiedt die hoofdletter, de schrijfwijzer niet.
- `ouder.spec.ts:67` legt "Maak een ouderpagina" vast, terwijl de handeling een
  pincode kiezen is.

## In deze PR veranderd

Alleen teksten die een concrete regel breken, of die botsen met een besluit
dat al genomen is:

- **Woordenlijst:**
  - `home.todayOpen`: "oefening" wordt "onderwerp";
  - `vandaag.eenVraag` en `vandaag.vragen`: "onthouden" wordt "vandaag terug", in de uitleg van het herhaalsysteem;
  - `taal.practiceMore` en `taal.practiceMoreVormen`: "moet je nog oefenen" wordt "komen nog terug", zoals in de andere vakken;
  - `ouder.weekAanbod` en `ouder.geheugencheckAanbod`: "blijft hangen" wordt "blijft in het hoofd".
- **Correct Nederlands:** `doorsturen.titel`: "vragen voor" wordt "vragen om".
- **Geen zin die met een cijfer begint:** `start.eerderGehad`,
  `terug.klaar(Een)`, `module.terugVandaag(Een)`, `ouder.apparatenBezet` en
  `ouder.apparatenGeenPlek`.
- **Onware beloftes:**
  - `ouders.kosten.premium` (ADR-224, ADR-230);
  - `premium.usp.gezinUit` (ADR-230);
  - `premium.waarom.apparaatUit` (ADR-226);
  - `public/kopen/index.html` (ADR-224).
- **Jouw keuze:** `home.zo.oefen.uitleg`: "spelvorm".

## Beslissingen die bij jou liggen

1. **Spelvorm of manier.** Alleen op "Zo werkt leer.nu", of overal? Overal
   betekent de woordenlijst en drie sleutels aanpassen: `start.manier`,
   `over.antwoord.hoe` en `ouders.kosten.premium`. ADR-231 zegt nu het
   omgekeerde, dus leg de keuze vast in een ADR.
2. **R-11 voor kindschermen.** Mag het woord "premium", als label en in het
   venster, nog op schermen van het kind staan? En mag `/voor-ouders` de prijs
   tonen zonder deur?
3. **`ouder.intro`.** Jouw tekst noemt een ouderaccount dat live niet bestaat.
   Houden tot het gezinsaccount live is, of nu aanpassen?
4. **Het cijfer bij oefenen.** Alleen bij de oefentoets, of ook onder gewone
   rondes op Vandaag?

## Uitgevoerd (27 september)

Vastgelegd in ADR-235 en ADR-236.

| Bevinding                              | Stand                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1, 3, 10: onware beloftes en teksten   | Hersteld in #171                                                                                                      |
| 2: koopknop zonder pincode             | Hersteld: "Ik ben de ouder" in plaats van "Een code kopen"                                                            |
| 4: premium op kindschermen             | Vervalt (besluit, ADR-234)                                                                                            |
| 5: `ouder.intro`                       | Hersteld in #173: "Hier vind je je ouderinstellingen."                                                                |
| 6: stoppen voor de eerste vraag        | Hersteld: "Gestopt · Stoppen mag." zonder nullen                                                                      |
| 7: terugknop in een ronde              | Hersteld: terug gaat terug, de ronde staat bij "Maak af"                                                              |
| 8: poorten en beloftes met een account | Deels: geen accountuitleg meer in de poort. De premiumdeur en de beloftes staan op de checklist van het gezinsaccount |
| 9: vijf koopoproepen op de ouderpagina | Hersteld: één premiumblok                                                                                             |
| Topo zonder "Geen probleem"            | Hersteld                                                                                                              |
| Cijfer bij oefenen                     | Hersteld in #172 (ADR-235)                                                                                            |
| Flow 2 zonder test                     | Hersteld: `e2e/kind-ingelogd.spec.ts`                                                                                 |
