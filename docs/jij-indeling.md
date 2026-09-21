# Jij opnieuw ingedeeld — voorstel

**Status:** goedgekeurd en gebouwd als ADR-172 (2026-09-21). De open vragen in §10 zijn beantwoord met de
aanbeveling uit dit voorstel; wat bij het bouwen anders uitviel, staat in §11. **Datum:** 2026-09-21.
**Codebasis:** `origin/main` 4db5bc0 (na #99, ADR-171). **Lezer van Jij:** het kind (6–12), met
soms een ouder die meekijkt.

Elke bewering draagt een label:

- **[feit]** met codeplek;
- **[aanname]** niet gemeten, wel beredeneerd;
- **[hypothese]** te toetsen door de pagina aan kinderen te laten zien.

Hoogtes op 375 breed zijn geschat uit de maten in `index.css` (kaartpadding, rijhoogte, tegels,
ring van 132, twee diploma's per rij) en niet in de app gemeten, dus het blijven **[aanname]**. De
app draait niet op deze Windows-machine, en de schermfoto's in CI worden niet over de hele pagina
gemaakt (`screens.spec.ts:26`, `fullPage: false`).

---

## 1. Waar Jij voor is

> **Vandaag:** wat doe ik nu? · **Premium:** wat krijg ik erbij, en tot wanneer? ·
> **Jij: wat heb ik al bereikt, en blijft het hangen?** Daaronder staat wat van jou is en wat je
> zelf instelt.

Dit is de maatstaf voor elk blok:

- Een blok hoort op Jij als het **terugkijkt**: wat je gehaald hebt, wat je onthoudt en hoe vaak
  je oefent. Een blok hoort er ook als het iets **van dit kind instelt**.
- **Wat je nu moet doen, hoort op Vandaag.** Vandaag heeft met premium een dagplan met een knop per
  ronde [feit] `VandaagBlok.tsx:1-20`.
- **Wat met de rekening of met de ouder te maken heeft, hoort op Premium.** Daar komt "Ik ben een
  ouder" uit [feit] ADR-171.
- **Staat iets twee keer op Jij, dan telt de tweede keer als ruis**, ook als hij anders geformuleerd
  is.

## 2. De diagnose in vijf punten

1. **Eén regel staat drie keer op de pagina.** "Drie keer goed, op drie verschillende dagen" staat
   in regel 1 van "Wanneer onthoud je iets?", in de regel boven de kast en in de eerste zin van
   "Hoe haal je een diploma?" [feit] `nl.ts` `retention.regel1`, `kast.regel`, `you.diplomaUitleg`.
2. **Twee verschillende percentages over hetzelfde.** "Je geheugen" zegt "Over drie weken weet je
   … nog 71%". "Hoe gaat het?" zegt twee blokken lager "Van alles wat er geoefend is, blijft nu
   88% hangen". Het eerste getal is de voorspelling over 21 dagen, het tweede de stand van
   vandaag [feit] `Overzicht.tsx` `GeheugenKaart` (`stand.overDrieWeken`), `Weekbericht.tsx`
   (`setRetention(states, ids, now)`). Een kind van acht ziet twee getallen die elkaar tegenspreken.
3. **Zonder premium vraagt de pagina vier keer om premium.** Dat gebeurt bij het slot van "Hoe gaat
   het?", bij de etalage onder het voorbeeldkind, bij het slot van "Per onderdeel" en bij het slot
   van "Eigen woorden" [feit] `Weekbericht.tsx:46`, `Statistieken.tsx:385` en `:525`,
   `EigenLijsten.tsx:48`. ADR-124 regel 2 is "Eén keer vragen per pagina". Die regel is gebroken
   doordat ADR-171 drie pagina's in één schoof, niet doordat iemand ervoor koos.
4. **De diploma's staan achter acht blokken cijfers.** ADR-167 maakte de diploma's tot het hele
   beloningsprogramma, en ze zijn het concreetste wat een kind van 6 hier kan zien. Toch begint de
   kast op 375 breed pas rond 4.300 px (met premium) of 3.600 px (zonder) [aanname]. Dat is het
   zesde of zevende scherm. Daarom bestaat `kastOpen`: "Bekijk alle diploma's" moet omlaag scrollen
   om de kast te vinden [feit] `ProfileScreen.tsx:80-86`.
5. **Blokken van een pagina die niet meer bestaat.** Het weekbericht is geschreven voor de ouder
   ("Er is geoefend op …"), en ADR-171 laat dat met zoveel woorden staan. Het account vraagt een
   e-mailadres en een wachtwoord, en ADR-155 noemt dat het account van de ouder. De uitleg erbij
   belooft dat je voortgang ook op de iPad staat, terwijl synchroniseren pas in F4 komt [feit]
   `account.uitleg`, ADR-157 Consequences. "Het schooljaar" herhaalt de kast als lijst.

## 3. Alle achttien blokken

Per blok staan hier: de vraag van het kind en hoe vaak het die heeft, of het blok iets laat
**doen** of alleen laat **zien**, gratis of premium (**G**/**P**), en het oordeel.

| #   | Blok                                            | Vraag van het kind · hoe vaak                                                       | Doet/ziet                      | G/P                                             | Staat ook op                                                                                | Oordeel                                                                                                | Reden                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Kop "Jij" + introzin                            | "Waar ben ik?" · elke keer                                                          | ziet                           | G                                               | —                                                                                           | **Houden, herschrijven**                                                                               | De `h1` en de etalage blijven (ADR-150). De zin krijgt de naam ("Je oefent als Noor"), zodat blok 2 geen eigen sectie meer nodig heeft, en noemt de blokken in de nieuwe volgorde.                                                                                                                                                                               |
| 2   | Jouw naam (`Ikben`)                             | "Ben ik dit?" · elke keer. "Naam wijzigen" · bijna nooit                            | doet                           | G                                               | naam in de balk (`TopBar`), en met premium in blok 3 ("oefent nu")                          | **Samenvoegen:** naam → kop (1), wijzigen → Instellingen (14)                                          | Met premium staat de naam nu drie keer op het eerste scherm: in de balk, in blok 2 en in blok 3. Hernoemen is een instelling die je bijna nooit gebruikt, maar hij stond bovenaan. ADR-126 wilde dat Jij zegt wie je bent; dat blijft gebeuren, in de kop. Het formulier (`you.childName`) zei "Naam van het kind" tegen het kind zelf.                          |
| 3   | Wie oefent er? (`Children`)                     | "Mijn broertje wil" · elke sessie in een gezin met meer kinderen                    | doet                           | P (anders niet getekend, ADR-124)               | —                                                                                           | **Houden, bovenaan**                                                                                   | Voor een gezin is dit de handeling die op Jij het vaakst voorkomt. Je komt hier via de knop met je naam in de balk (`onProfile`), en wie op zijn naam drukt, wil vaak wisselen. Zonder premium staat het er niet, dus kost het dan niets.                                                                                                                        |
| 4   | Wanneer onthoud je iets? (`Regels`)             | "Wat betekent onthouden?" · één keer, daarna bijna nooit                            | ziet                           | G                                               | regel 1 = `kast.regel` = `you.diplomaUitleg`                                                | **Samenvoegen met 5:** definitie open in de kaart, vier regels in een `Uitklap` eronder                | Wijkt af van ADR-160 (zie §6). De reden van ADR-160 blijft gelden: wie het woord niet kent, leest getallen zonder eenheid. Daarom staat de definitie zichtbaar bij het eerste getal dat hem telt. Regels 2–4 gaan over uitzonderingen (aan de beurt, opfrissen, een fout). Die leest een kind één keer, maar nu kosten ze bij elk bezoek een half scherm op 375. |
| 5   | Je geheugen (`GeheugenKaart`)                   | "Hoeveel weet ik al?" · elk bezoek                                                  | ziet                           | G                                               | het getal van nu in blok 7 (een ander getal)                                                | **Houden**, met de definitie erin                                                                      | Het getal waar het product om draait. Het is een feit over het eigen kind, dus gratis (ADR-124).                                                                                                                                                                                                                                                                 |
| 6   | Deze week (`DezeWeek`)                          | "Heb ik genoeg gedaan?" · vaak                                                      | ziet                           | G                                               | "Dagen geoefend" ≈ de eerste zin van 7; "Vragen" ≈ de staaf "nu" in 9                       | **Houden en samenvoegen met 9** tot "Hoe vaak oefen je?"                                               | Concreet en telbaar, en het enige blok over deze week. De tegel "Dagen geoefend" krijgt de noemer uit het weekbericht: "3 van 5" schooldagen.                                                                                                                                                                                                                    |
| 7   | Hoe gaat het? (`Weekbericht`)                   | "Gaat het goed?" · de vraag van een ouder, niet van een kind                        | ziet                           | P (slot zonder code)                            | zin 1 ≈ tegel "Dagen geoefend"; zin 2 ≠ de ring van 5; zin 3 ≈ het dagplan op Vandaag       | **Weghalen** (één zin gaat naar 6)                                                                     | Alle drie zinnen staan al ergens anders, en één ervan spreekt de ring tegen (§2.2). De tekst is voor een ouder geschreven (ADR-171 Consequences). "Wat wacht het langst" is een zwakkere versie van het plan op Vandaag, dat per ronde een knop heeft. Dit haalt een premiumfunctie weg: zie §5.                                                                 |
| 8   | Per vak (`PerVak`)                              | "In welk vak ben ik goed?" · af en toe                                              | doet (kiest vak in 10)         | P                                               | het totaal van 5                                                                            | **Houden, direct boven Per onderwerp**                                                                 | Dit is de zoomstap van alles naar één vak. Een druk op een rij kiest dat vak in Per onderwerp en scrollt ernaartoe [feit] `Statistieken.tsx` `kiesVak`, dus de twee blokken moeten aan elkaar grenzen.                                                                                                                                                           |
| 9   | Week na week (`WeekNaWeek`)                     | "Oefen ik meer dan vroeger?" · af en toe                                            | ziet                           | P                                               | drie tegels die bijna hetzelfde heten als die van 6 ("Rondes" / "Rondes in totaal")         | **Samenvoegen met 6**: de grafiek onder de weektegels, de totalen als één zin                          | Twee rijen tegels met bijna dezelfde namen boven elkaar lezen als één rij die zichzelf tegenspreekt. Bij nul rondes geen grafiek met acht lege staven.                                                                                                                                                                                                           |
| 10  | Per onderwerp, Alles in één blik, Per onderdeel | "Welke provincies ken ik?" · af en toe, en dan lang                                 | doet (kiezen) + ziet           | G: één onderwerp + voorbeeld · P: alles + tabel | —                                                                                           | **Houden, één kop** in plaats van drie. Zonder premium: het voorbeeld en één etalage, geen tweede slot | Drie `h2`'s voor één ding worden één `h2` met de chips, de kaart en de tabel in een `Uitklap`. Het slot bij de tabel verdwijnt (wijkt af van ADR-165, zie §6), zodat de etalage de enige vraag op de pagina is.                                                                                                                                                  |
| 11  | Jouw diploma's (`Kast`)                         | "Welke diploma's heb ik, en wat kan ik nog halen?" · het vaakst van alles [aanname] | doet (oefenen, toets, printen) | G (tafels) / P (rest)                           | Vandaag: "Bekijk alle diploma's" wijst hierheen                                             | **Houden, bovenaan** onder de kop en "Wie oefent er?"                                                  | ADR-167: het diploma is het hele beloningsprogramma. Het is het enige blok waar een kind iets kan doen dat iets oplevert: een diploma openen, oefenen, de toets doen. Hier landt ook "Bekijk alle diploma's".                                                                                                                                                    |
| 12  | Hoe haal je een diploma? (`DiplomaUitleg`)      | "Waarom heb ik hem nog niet?" · zelden, en dan dringend                             | ziet                           | G                                               | zin 1 = `kast.regel`                                                                        | **Samenvoegen met 11** als `Uitklap` onder de kast                                                     | De vraag komt op als een kind alles goed had en toch geen diploma kreeg. Dan zoekt het bij de diploma's, en daar staat het antwoord. De dubbele eerste zin wordt vervangen door wat er nog niet stond: wanneer je de toets doet.                                                                                                                                 |
| 13  | Het schooljaar (`Jaaroverzicht`)                | "Wat heb ik dit jaar gehaald?" · zelden. Printen · een paar keer per jaar           | doet (printen) + ziet          | G                                               | de kast (dezelfde diploma's), het venster van elk diploma (de datum en een eigen printknop) | **Samenvoegen met 11** als één knop "Print je diploma's van dit schooljaar"                            | Het printen is het enige wat dit blok toevoegt. Het blad voor de printer blijft (`data-print`); op het scherm staat alleen de knop, en alleen als er iets gehaald is. Nu staat er op dag één een printknop voor een leeg blad [feit] `Jaaroverzicht.tsx`.                                                                                                        |
| 14  | Instellingen (4 schakelaars)                    | "Kan het geluid uit?" · zelden                                                      | doet                           | G                                               | —                                                                                           | **Houden, uitbreiden**: "Je naam" en "Je groep" worden de eerste twee rijen                            | Eén lijst met alles wat je instelt, in rijen die hetzelfde werken: druk erop en hij verandert of gaat open.                                                                                                                                                                                                                                                      |
| 15  | Je groep (`GroepInstelling`)                    | "Ik zit nu in groep 6" · één keer per jaar, en op 1 augustus gebeurt het vanzelf    | doet                           | G                                               | de vraag op Vandaag (één keer, `GroepVraag`)                                                | **Samenvoegen met 14** als rij die de kiezer opent                                                     | Nu staan er bij elk bezoek zeven knoppen en twee zinnen, voor iets wat je hooguit één keer per jaar verandert [aanname: ongeveer 330 px op 375].                                                                                                                                                                                                                 |
| 16  | Eigen woorden (`EigenLijsten`)                  | "De woorden van deze week invoeren" · wekelijks, in gezinnen die het gebruiken      | doet                           | P (slot zonder code)                            | —                                                                                           | **Houden met premium, zonder premium niet tekenen**                                                    | Dezelfde regel als "Wie oefent er?" (ADR-124: een premiumblok tekent zichzelf zonder code niet). De etalage in blok 10 noemt het, en de vergelijking op Premium ook (`premium.regel.lijsten`). Of het naar /taal moet: open vraag 3.                                                                                                                             |
| 17  | Account (`AccountBlok`)                         | geen: een kind heeft geen e-mailadres (ADR-155)                                     | doet                           | G                                               | —                                                                                           | **Verplaatsen naar Premium**, onder "Heb je al een code?"                                              | ADR-155 maakt de ouder de houder van een e-mailadres en geeft het kind in F3 een inlogcode. "Ik ben een ouder" opent Premium (ADR-171), dus daar hoort het account van de ouder. Vraag je een kind van zes om e-mail en wachtwoord, dan zeg je in de stem van het kind iets tegen een ouder. In F3 komt "Je inlogcode" terug op Jij.                             |
| 18  | Alles van dit apparaat halen (`Wissen`)         | "Hoe haal ik het eraf?" · bijna nooit, meestal de ouder                             | doet                           | G                                               | `you.stays` erboven zegt hetzelfde als `wissen.uitleg`                                      | **Houden, als laatste**; `you.stays` weg                                                               | ADR-166: het enige wat niet terug te draaien is, komt het laatst. De losse zin erboven herhaalt de eerste zin van het blok.                                                                                                                                                                                                                                      |

**De telling:** 18 blokken worden er 10 met premium en 7 zonder. Met premium zijn dat 10 `h2`'s in
plaats van 20, zonder premium 7 in plaats van 16. Zonder premium vraagt de pagina nog één keer om
premium in plaats van vier keer.

## 4. De volgorde

### De drie volgordes die ik heb uitgewerkt

Alle drie gebruiken de samenvoegingen uit §3. Ze verschillen alleen in de volgorde en in wat er
open staat.

**A — Profiel (de volgorde van ADR-145 en ADR-171, ingekort).** Eerst wie je bent, dan hoe het
gaat, dan wat je gehaald hebt, dan de instellingen.
Kop · Wie oefent er? · Je geheugen · Hoe vaak oefen je? · Per vak · Per onderwerp ·
**Jouw diploma's** · Instellingen · Eigen woorden · Wissen.

**B — Wat je komt halen, dan wat je komt regelen.** Eerst wie er oefent (alleen als er iets te
kiezen valt), dan wat je gehaald hebt, dan of het blijft hangen, dan wat je instelt, en als laatste
de uitweg.
Kop · Wie oefent er? · **Jouw diploma's** · Je geheugen · Hoe vaak oefen je? · Per vak ·
Per onderwerp · Instellingen · Eigen woorden · Wissen.

**C — Kort, met de diepte ingeklapt.** Jij toont alleen wat voor een kind leesbaar is, en alle
cijfers per vak en per onderwerp zitten achter één uitklap "Al je cijfers".
Kop · Wie oefent er? · Jouw diploma's · Je geheugen · Hoe vaak oefen je? ·
[Uitklap: Per vak, Per onderwerp] · Instellingen · Eigen woorden · Wissen.

### De vergelijking

| Maatstaf                                                       | A                                 | B                                               | C                                                                                      |
| -------------------------------------------------------------- | --------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Waar de kast begint op 375, zonder / met premium [aanname]     | ± 2.900 / 3.700 px (4e–5e scherm) | **± 260 / 620 px (eerste scherm)**              | ± 260 / 620 px                                                                         |
| "Bekijk alle diploma's" landt                                  | na een sprong over vier blokken   | **op het eerste scherm**                        | op het eerste scherm                                                                   |
| De definitie staat bij het eerste getal dat hem telt (ADR-160) | ja, in Je geheugen                | ja, in de kast (`kast.regel`) en in Je geheugen | ja                                                                                     |
| Eigen cijfers vóór het voorbeeldkind (ADR-165)                 | ja                                | ja                                              | nee: het voorbeeld zit achter de uitklap, of erboven                                   |
| Eén vraag om premium, na alles van het kind zelf               | ja                                | ja                                              | **nee:** de etalage zit ingeklapt, en de propositie is onzichtbaar (tegen ADR-124/165) |
| Per vak grenst aan Per onderwerp (`kiesVak` scrollt)           | ja                                | ja                                              | ja, maar `kiesVak` scrollt naar een blok dat ingeklapt kan zijn                        |
| Koppen blijven navigeerbaar (schermlezer: van `h2` naar `h2`)  | ja                                | ja                                              | nee: een uitklap om vier secties verstopt hun koppen                                   |
| Pagina op 375, met premium [aanname]                           | ± 8.900 px                        | ± 8.900 px                                      | ± 5.700 px dicht                                                                       |

**C valt af.** Hij is het kortst, maar hij verstopt het enige deel van Jij dat zonder premium laat
zien wat het product doet: het voorbeeldkind en de etalage. ADR-124 en ADR-165 hebben dat deel
bewust open gezet. Een uitklap om hele secties heen breekt bovendien de navigatie van kop naar kop,
en daarmee `kiesVak`.

**A tegen B** komt neer op één vraag: wat komt een kind van 6 tot 12 op Jij het vaakst halen?

### De keuze: B

1. **De diploma's zijn wat een kind hier zoekt** [aanname, maar goed onderbouwd]. Ze zijn het hele
   beloningsprogramma (ADR-167). Ze zijn het enige blok met een knop die iets oplevert (oefenen, de
   toets, printen). En de enige andere weg naar Jij met een doel, "Bekijk alle diploma's", gaat
   erheen (ADR-153). De ring "over 3 weken", de tegels en de tabel zijn waar, maar abstract. Een
   kind van acht leest een diploma sneller dan een percentage [hypothese: toetsen door een paar
   kinderen Jij te laten openen en te vragen wat ze zagen].
2. **B verliest niets wat A beschermt.** De definitie van "onthouden" staat nog steeds bij het
   eerste getal dat hem gebruikt. In B is dat de kast: "Een onderdeel telt mee als je het drie keer
   goed weet, op drie verschillende dagen". De eigen cijfers komen nog steeds vóór het voorbeeld, en
   de etalage is nog steeds de enige vraag, onder de cijfers.
3. **De afweging die B maakt:** de cijfers zakken met de kast mee, ongeveer 1.100 px met tafels
   open. Dat is het goede ding om te laten zakken. De cijfers zijn het blok dat een kind
   **af en toe** en dan lang leest. De kast is het blok dat een kind **elke keer** kort bekijkt.
4. **`kastOpen` blijft**, al doet het bijna niets meer. Met premium staat "Wie oefent er?" boven de
   kast, dus het scrollen is dan nog nodig. Zonder premium is het een scroll van nul. Het weghalen
   is geen winst en wel een test minder.

**Binnen de cijfers** staan eerst de twee samenvattingen en dan de zoom: Je geheugen (wat blijft),
Hoe vaak oefen je? (wat je doet), en dan Per vak → Per onderwerp. De andere volgorde, geheugen →
per vak → per onderwerp → hoe vaak, is als zoom logischer. Maar zonder premium zou het voorbeeldkind
dan vóór "Deze week" staan, en dan gaat een verzonnen kind voor de echte cijfers van dit kind
(ADR-165). `nl.ts` houdt de twee assen zelf al uit elkaar: "dit gaat over antwoorden die je gaf,
dat over wat blijft" (commentaar bij `retention.verloopTitel`).

### De pagina, van boven naar beneden

**Met premium**

1. **Kop** — "Jij" · "Je oefent als Noor. Hier staan je diploma's, wat je onthoudt en hoe vaak je oefent."
2. **Wie oefent er?** — de kinderen, "Nog een kind erbij", de uitleg.
3. **Jouw diploma's** — de stand, de regel, één vak open en de rest als rij · uitklap "Hoe haal je
   een diploma?" · knop "Print je diploma's van dit schooljaar" (alleen als er een gehaald is).
4. **Je geheugen** — de definitie in één zin, de ring, de tegels · uitklap "Hoe werkt onthouden?"
   met de vier regels.
5. **Hoe vaak oefen je?** — vier tegels over deze week ("Dagen geoefend: 3 van 5"), het meest
   geoefend, de grafiek van acht weken, en de totalen in één zin.
6. **Per vak** — zes rijen; een druk kiest het vak hieronder.
7. **Per onderwerp** — chips, de kaart (tegels, kaart van Nederland, stippen) · uitklap "Laat de tabel zien".
8. **Instellingen** — Je naam · Je groep · Vragen voorlezen · Geluid bij een antwoord · Minder beweging · Doelen voor deze week.
9. **Eigen woorden** — zoals nu.
10. **Alles van dit apparaat halen** — zoals nu.

**Zonder premium** zijn het 1, 3, 4, 5, 7, 8 en 10. Blok 3 heeft dan één vak (de tafels). Blok 5
heeft dan geen grafiek en geen totalen. Blok 7 heeft de zin "Je ziet hier Provincies." (zonder
chips), de kaart van het kind zelf, daaronder het voorbeeldkind en de etalage. Dat is de enige
vraag om premium op de pagina.

**Dag één, zonder premium:**

- De kast staat met twaalf lege tafeldiploma's en "Hier komen je diploma's te hangen." Er is geen
  printknop.
- Je geheugen toont de definitie en "Je hebt nog niets geoefend…".
- "Hoe vaak oefen je?" zegt "Deze week nog niet geoefend."
- Per onderwerp toont 0 · 0 · 0 · 12 en lege stippen, met het voorbeeld eronder.

Er staat nergens een blok dat alleen een nul toont zonder uit te leggen waarom.

**Dag één, met premium:** hetzelfde. "Hoe vaak oefen je?" tekent bij nul rondes geen grafiek en geen
totalen. Nu staan daar drie tegels "–, 0, 0" en acht lege staven [feit] `Overzicht.tsx`
`WeekNaWeek`, en "Er wacht niets. Alles is op tijd herhaald." voor een kind dat nog niets gedaan
heeft [feit] `Weekbericht.tsx` `wachtZin`.

**Zo kom je binnen:**

- via de balk of de knop met je naam: je ziet de kop met je naam, met premium de wisselaar, en
  daaronder je diploma's;
- via "Bekijk alle diploma's": de kast staat bovenaan in beeld;
- via `/onthouden`: je komt op Jij, en Je geheugen is het tweede scherm. De test in `jij.spec.ts`
  kijkt of die regio zichtbaar is, en dat blijft zo, met scrollen;
- via `/ouder`: blijft Premium. Daar staat nu ook het account van de ouder.

**Op 375 breed** [aanname]: met premium ongeveer 11.600 → 8.900 px, zonder premium ongeveer
9.800 → 6.500 px. De grootste winst zit in het weekbericht, de dubbele tegelrij, het schooljaar, de
groepkiezer, het account en drie sloten. Op 1280 breed is de kolom even smal als nu (ADR-168), dus
geldt dezelfde volgorde.

## 5. De grens tussen gratis en premium: twee dingen verschuiven

ADR-124 zegt: feiten over het eigen kind zijn gratis, het bijhouden is betaald. Twee onderdelen van
dit voorstel raken die grens, en dat hoort apart benoemd te worden.

1. **"Hoe gaat het?" verdwijnt als premiumfunctie.** Op Premium verdwijnt de regel "Het weekbericht:
   hoe de week ging" uit de groep "Voor ouders" (`premium.regel.bericht`). Premium verliest
   daarmee een regel in de vergelijking. Ik denk dat dat mag, want wat die regel belooft staat op
   Jij al beter:
   - of er geoefend is: in de tegel;
   - wat blijft hangen: in de ring;
   - wat wacht: in het dagplan op Vandaag, dat premium is en per ronde een knop heeft.

   **Terugvaloptie:** houdt de eigenaar het weekbericht als verkoopargument voor ouders, dan wordt
   het geen eigen blok. Het wordt één premiumzin onder de weektegels in "Hoe vaak oefen je?" ("De
   tafel van 7 wacht het langst: 4 sommen, 3 dagen"), zonder de tweede zin met het tegenstrijdige
   percentage, en zonder slot als er geen code is.

2. **"Dagen geoefend" krijgt zijn noemer gratis: "3 van 5".** Die noemer (schooldagen, met de
   vakanties eraf) stond alleen in het premium-weekbericht. Het is een feit over het eigen kind, dus
   hoort hij volgens ADR-124 gratis te zijn. In een week met nul schooldagen staat alleen het
   getal. De motor verandert niet: `weekbericht.ts` rekent dit al uit en wordt hergebruikt.

De rest blijft waar het was: Per vak, Week na week, de chips, de tabel, Eigen woorden en Wie oefent
er? blijven premium; Je geheugen, Deze week, één onderwerp en de kast blijven gratis.

## 6. Waar dit afwijkt van eerdere ADR's

| ADR                                                    | Wat het besliste                                                             | Wat dit voorstel doet                                                                  | Waarom de reden van toen niet meer geldt                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-145, ADR-171** (volgorde)                        | wie je bent → hoe het gaat → wat je gehaald hebt → instellingen              | wie er oefent → wat je gehaald hebt → hoe het gaat → instellingen                      | ADR-145 ordende een Jij met vier blokken, en de cijfers stonden op een eigen pagina. ADR-171 schoof acht blokken cijfers tussen de naam en de diploma's, en noemde zelf het gevolg: "Jij is lang". De volgorde van een profielpagina is een conventie. Wat een kind komt halen, is een maatstaf.                                                           |
| **ADR-160** (regels bovenaan en open)                  | vier genummerde regels in een kaart, open, boven de ring                     | de definitie open in de kaart van Je geheugen, de vier regels in een `Uitklap` eronder | ADR-160 haalde de regels van onder de tabel en uit een uitklap, omdat een kind anders getallen zonder eenheid las. Dat blijft opgelost: de eenheid staat zichtbaar bij het getal, in de kast en in Je geheugen. Wat inklapt, zijn de uitzonderingen, en die bleven bij elk bezoek een half scherm kosten op een pagina die sindsdien vier keer zo lang is. |
| **ADR-126** (Jij gaat over wie je bent: naam bovenaan) | een eigen blok "Jouw naam" met de knop                                       | de naam in de introzin, het wijzigen als rij in Instellingen                           | De naam blijft het eerste wat Jij zegt. Alleen de knop gaat naar de plek van dingen die je zelden instelt.                                                                                                                                                                                                                                                 |
| **ADR-133** (het weekbericht)                          | drie zinnen die de week duiden, premium                                      | weg; de noemer "van 5" naar de tegel                                                   | Het was de duiding voor de ouder die "Voor ouders" las (ADR-133: "de vraag achter het abonnement … gaat het goed, en moet ik iets doen?"). Die pagina en die lezer zijn er niet meer (ADR-171), en elke zin staat op Jij of Vandaag al, beter.                                                                                                             |
| **ADR-165** (het slot bij de tabel blijft)             | "Het `PremiumSlot` bij de detailtabel blijft staan. Dat gaat over de tabel." | geen slot bij de tabel; de etalage noemt de tabel ("elk onderdeel")                    | Toen was het slot op Onthouden één van twee vragen. Op Jij is het er één van vier, en ADR-124 regel 2 ("één keer vragen per pagina") weegt zwaarder dan het onderscheid tussen de kaart en de tabel.                                                                                                                                                       |
| **ADR-171** (account, groep en schooljaar op Jij)      | eigen blokken op Jij                                                         | account → Premium; groep → rij in Instellingen; schooljaar → printknop in de kast      | Het account is volgens ADR-155 van de ouder, en de ouder komt via "Ik ben een ouder" op Premium uit (ADR-171). De groep verandert één keer per jaar. Het schooljaar herhaalt de kast.                                                                                                                                                                      |
| **ADR-166** (`you.stays` boven het wissen)             | "de belofte hierboven … is pas iets waard als je er ook bij kunt"            | de zin weg; `wissen.uitleg` zegt het al                                                | De belofte staat in het blok zelf ("staat op dit apparaat en nergens anders"). Twee keer dezelfde belofte op tien regels afstand maakt hem niet sterker.                                                                                                                                                                                                   |

**Wat niet verandert:**

- de motor: `leitner.ts`, `game-core`, `statistiek.ts`, `itemStatus.ts`, `rijp.ts`, en wat er
  bewaard wordt. Geen migratie, geen schemawijziging;
- de etalagekop (ADR-150);
- één kolom (ADR-168);
- de reeks, die blijft weg (ADR-171; dat besluit is aan de eigenaar);
- de kast zelf, met één vak open (ADR-064/158);
- het voorbeeldkind (ADR-165);
- de wisselaar (ADR-046/116).

## 7. Alle zinnen op het scherm die veranderen

`sleutel`: oud → nieuw. **nieuw** = een sleutel die er nog niet is; **weg** = de sleutel verdwijnt.

**Kop en naam**

| Sleutel                   | Oud                                                                               | Nieuw                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `you.intro`               | Alles over jou: wat je onthoudt, hoe het oefenen gaat en welke diploma's je hebt. | Je oefent als {naam}. Hier staan je diploma's, wat je onthoudt en hoe vaak je oefent. |
| `you.who`                 | Jouw naam                                                                         | **weg** (geen eigen blok meer)                                                        |
| `you.nameIs`              | Je oefent als {naam}.                                                             | **weg** (staat in `you.intro`)                                                        |
| `you.naam` **nieuw**      | —                                                                                 | Je naam _(titel van de rij in Instellingen; de regel eronder is de naam zelf)_        |
| `you.naamLabel` **nieuw** | (was `you.childName`: "Naam van het kind", als label voor je eigen naam)          | Je naam _(label van het veld)_                                                        |
| `you.nameChange`          | Naam wijzigen                                                                     | wijzigen _(klein, aan het eind van de rij, zoals "aan" en "uit")_                     |

**Jouw diploma's**

| Sleutel                         | Oud                                                                                                                                                                                                                         | Nieuw                                                                                                                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `you.diplomaTitel`              | Hoe haal je een diploma? _(kop)_                                                                                                                                                                                            | Hoe haal je een diploma? _(nu de knop van de uitklap)_                                                                                                                                                           |
| `you.diplomaUitleg`             | Een onderdeel telt pas mee als je het drie keer goed hebt, op drie verschillende dagen, en steeds als het weer aan de beurt was. Eén keer goed telt nog niet mee: dat is het verschil tussen iets kennen en iets onthouden. | Een goed antwoord telt alleen als het onderdeel aan de beurt was. Eén keer goed telt nog niet mee: dat is het verschil tussen iets kennen en iets onthouden. Is de ring om een diploma vol, dan doe je de toets. |
| `you.diplomaTempo`              | _(ongewijzigd)_ Hoe beter je de stof kent, hoe sneller je het diploma haalt. Wat je onthoudt, blijft meetellen, en de ring om een diploma loopt nooit terug.                                                                | _(ongewijzigd)_                                                                                                                                                                                                  |
| `uitklap.dichtUitleg` **nieuw** | —                                                                                                                                                                                                                           | Verberg de uitleg                                                                                                                                                                                                |
| `jaar.titel`                    | Het schooljaar _(kop)_                                                                                                                                                                                                      | **weg** van het scherm; blijft de kop van het printblad als `jaar.kop`                                                                                                                                           |
| `jaar.print`                    | Print het schooljaar                                                                                                                                                                                                        | Print je diploma's van dit schooljaar                                                                                                                                                                            |

**Je geheugen**

| Sleutel                       | Oud                              | Nieuw                                                          |
| ----------------------------- | -------------------------------- | -------------------------------------------------------------- |
| `retention.regel1`            | _(ongewijzigd)_                  | _(nu open boven de ring; de uitklap heeft regel 2–4, zie §11)_ |
| `retention.regelsTitel`       | Wanneer onthoud je iets? _(kop)_ | Hoe werkt onthouden? _(knop van de uitklap)_                   |
| `retention.regel1` … `regel4` | _(ongewijzigd, ADR-171)_         | _(ongewijzigd, in de uitklap)_                                 |

**Hoe vaak oefen je?**

| Sleutel                                                                                                                                                                             | Oud                                                                                                                                                                                           | Nieuw                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `you.week`                                                                                                                                                                          | Deze week _(kop)_                                                                                                                                                                             | Hoe vaak oefen je?                                                                               |
| `you.weekTegels` **nieuw**                                                                                                                                                          | —                                                                                                                                                                                             | Deze week _(klein label boven de vier tegels)_                                                   |
| `you.dagenVan` **nieuw**                                                                                                                                                            | — _(de tegel toonde alleen "3")_                                                                                                                                                              | {dagen} van {schooldagen}                                                                        |
| `retention.verloopTitel`                                                                                                                                                            | Week na week _(kop)_                                                                                                                                                                          | **weg**                                                                                          |
| `retention.cijferGoed`, `cijferRondes`, `cijferVragen`                                                                                                                              | Goed beantwoord · Rondes in totaal · Vragen in totaal _(drie tegels)_                                                                                                                         | **weg**                                                                                          |
| `retention.totaal` **nieuw**                                                                                                                                                        | —                                                                                                                                                                                             | Alles bij elkaar: {rondes} keer geoefend en {vragen} vragen beantwoord, waarvan {procent}% goed. |
| `you.berichtTitel`, `berichtNiets`, `berichtGeoefend`, `berichtGeoefendEen`, `berichtOnthouden`, `berichtWankelt`, `berichtWankeltEen`, `berichtWankeltVandaag`, `berichtNiksWacht` | Hoe gaat het? · Er is deze week niet geoefend. · Er is geoefend op … · Van alles wat er geoefend is, blijft nu …% hangen. · … wacht het langst … · Er wacht niets. Alles is op tijd herhaald. | **weg**                                                                                          |

**Per onderwerp en de verkoop**

| Sleutel                  | Oud                                                                                                                                                                                           | Nieuw                                                                                                                                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `retention.glance`       | Alles in één blik _(kop)_                                                                                                                                                                     | Alles in één blik _(nu de naam van de kaart, niet meer een kop)_                                                                                                                                                                                          |
| `retention.detail`       | Per onderdeel _(kop)_                                                                                                                                                                         | Per onderdeel _(nu de naam van de tabel, niet meer een kop)_                                                                                                                                                                                              |
| `retention.voorproef`    | Je ziet hier {onderwerp}. Met premium kies je elk vak en elk onderwerp, en zie je het per onderdeel.                                                                                          | Je ziet hier {onderwerp}.                                                                                                                                                                                                                                 |
| `retention.verkoopKop`   | Dit wil je over je eigen kind zien                                                                                                                                                            | Wil je dit over jezelf zien?                                                                                                                                                                                                                              |
| `retention.verkoopTekst` | Met premium staat hier je eigen kind: elk vak, elk onderwerp en elke som, week na week, met hoeveel het er over drie weken nog van weet. En leer.nu zet elke dag klaar wat het bijna vergeet. | Met premium zie je hier elk vak, elk onderwerp en elk onderdeel, en hoe vaak je oefent, week na week. leer.nu zet elke dag voor je klaar wat je bijna vergeet, en je kunt de woorden van school zelf invoeren. Daar hebben je ouders een code voor nodig. |
| `retention.verkoopKnop`  | _(ongewijzigd)_ Bekijk premium                                                                                                                                                                | _(ongewijzigd)_                                                                                                                                                                                                                                           |
| `premium.wat.onthouden`  | Zie per vak en per onderdeel wat je kind onthoudt, …                                                                                                                                          | **weg** (geen slot meer)                                                                                                                                                                                                                                  |
| `premium.wat.bericht`    | Hoe de week ging: …                                                                                                                                                                           | **weg**                                                                                                                                                                                                                                                   |
| `premium.wat.lijsten`    | De oefenstof van school zelf intypen of importeren, en je kind oefent deze als flitsdictee.                                                                                                   | **weg** (geen slot meer)                                                                                                                                                                                                                                  |
| `premium.regel.bericht`  | Het weekbericht: hoe de week ging                                                                                                                                                             | **weg** (op Premium, zie §5)                                                                                                                                                                                                                              |

**Instellingen, groep en wissen**

| Sleutel                   | Oud                                                                                                           | Nieuw                                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `groep.jijTitel`          | Je groep _(kop)_                                                                                              | Je groep _(titel van de rij)_                                                                                              |
| `groep.rijGeen` **nieuw** | —                                                                                                             | Geen groep gekozen _(regel onder de titel)_                                                                                |
| `groep.knop`              | Groep {groep}                                                                                                 | _(ongewijzigd, nu ook de regel onder de titel)_                                                                            |
| `groep.jijUitleg`         | _(ongewijzigd, nu pas zichtbaar als de rij open is)_                                                          | _(ongewijzigd)_                                                                                                            |
| `you.stays`               | Wat je oefent blijft op dit apparaat.                                                                         | **weg** (`wissen.uitleg` zegt het)                                                                                         |
| `wissen.watVoortgang`     | De namen en de voortgang van elk kind: wat ze geoefend hebben en hun diploma's.                               | Van elk kind op dit apparaat: de naam, wat het geoefend heeft en de diploma's.                                             |
| `wissen.watCode`          | De premiumcode. Je kunt hem daarna gewoon opnieuw invullen — en dit apparaat telt niet meer mee voor de drie. | De premiumcode. Die kun je daarna opnieuw invullen. Dit apparaat telt dan niet meer mee bij de drie apparaten van de code. |

**Account (naar Premium)**

- `account.*` blijft zoals het is. Het blok staat op Premium onder "Heb je al een code?", en daar
  leest een ouder. Zie open vraag 2 voor `account.uitleg`.

**Tekst die nog een ouder aanspreekt, en wat ermee gebeurt**

- ADR-171 noemde er twee. "Dit wil je over je eigen kind zien" wordt herschreven. "Er is geoefend
  op …" verdwijnt met het weekbericht.
- Ik heb er nog drie gevonden, en alle drie verdwijnen met hun slot: `premium.wat.onthouden` ("wat
  je kind onthoudt"), `premium.wat.lijsten` ("je kind oefent deze") en `premium.wat.bericht`.
- Het label "Naam van het kind" boven je eigen naam wordt "Je naam".
- In de code staan nog twee commentaren die over de verkeerde lezer gaan: "Het blok voor de
  volwassene" (`nl.ts` boven `you.week`) en "de zin die een ouder herhaalt" (`Overzicht.tsx`
  `DezeWeek`). Die worden bij het bouwen herschreven.
- Wat wél blijft: `you.childName` ("Naam van het kind") bij "Nog een kind erbij". Daar voeg je een
  ander kind toe, dus het klopt.

## 8. Wat er op andere pagina's verandert

- **Premium:** krijgt het account als laatste sectie, na "Heb je al een code?", en ook met een code.
  De regel `premium.regel.bericht` gaat uit de vergelijking. De groep "Voor ouders" houdt twee
  regels: de lijsten van school en het gezin.
- **Vandaag:** niets. "Bekijk alle diploma's" blijft `kastOpen` zetten.
- **/taal en de andere vakpagina's:** niets, tenzij open vraag 3 ja wordt.

## 9. Bouwen, na een ja

Het wordt één PR en één ADR, met het nummer van `origin/main` genomen vlak voor het committen.

- `ProfileScreen.tsx`: de nieuwe volgorde. `Ikben` wordt een rij in `Instellingen`, en de naam gaat
  naar de kop. `DiplomaUitleg` en de printknop van `Jaaroverzicht` komen in de kast.
- `Statistieken.tsx`: de volgorde wordt Je geheugen → Hoe vaak → Per vak → Per onderwerp.
  - `Regels` wordt een `Uitklap` onder `GeheugenKaart`.
  - Per onderwerp krijgt één `h2`.
  - Het slot bij de tabel en de `Weekbericht`-aanroep gaan weg.
- `Overzicht.tsx`: `DezeWeek` en `WeekNaWeek` worden één blok, met de noemer uit `weekbericht()`.
  Bij nul rondes geen grafiek.
- `GroepInstelling.tsx` wordt een rij in de lijst die de kiezer opent (`aria-expanded`).
- `EigenLijsten.tsx` tekent zonder code niets. `AccountBlok` verhuist naar `PremiumScreen.tsx`.
- `Weekbericht.tsx` wordt verwijderd. `weekbericht.ts` blijft, alleen voor de noemer; is dat alles
  wat er nog van gebruikt wordt, dan houdt het ook alleen dat.
- De i18n-sleutels en CSS van §7 die ongebruikt raken, gaan weg: `.tk-jaaroverzicht` op het scherm
  (het printblad blijft) en de klassen van de grafiektegels, na een grep in `index.css`.
- **e2e:**
  - `jij.spec.ts`: de lijst van regio's en de volgorde "diploma's vóór geheugen vóór instellingen";
  - `onthouden.spec.ts`: de regels in een uitklap, geen slot bij de tabel, één vraag zonder code;
  - `diplomas.spec.ts`: "Bekijk alle diploma's" en de printknop;
  - `premium.spec.ts`: één premiumblok op Jij, en het account op Premium;
  - `account.spec.ts`, `groep.spec.ts`, `woordlijsten.spec.ts`, `a11y.spec.ts` en `screens.spec.ts`
    (`04-jij`, `12-jij-cijfers`, `19-geheugen`).

## 10. Open vragen voor de eigenaar

1. **Mag het weekbericht weg** (§5.1), of wil je het als één premiumzin onder "Hoe vaak oefen je?"
   houden? Mijn voorkeur: weg.
2. **Het account: naar Premium, of helemaal niet tekenen tot F3/F4?** Op Premium is het de plek
   voor de ouder. Maar `account.uitleg` belooft "ook op de iPad en de laptop", en dat is pas waar
   vanaf het synchroniseren in F4 [feit] ADR-157 Consequences. Staan `GEZIN_URL` en `GEZIN_KEY` in
   productie niet, dan staat er nu "Inloggen is nog niet beschikbaar." op Jij. Dan is dat een blok
   met niets om te doen, en dan stel ik voor het ook op Premium pas te tekenen als het ingesteld is.
3. **Eigen woorden: op Jij blijven, of naar /taal?** Volgens de maatstaf is het oefenstof en geen
   terugblik, en /taal toont "Eigen woorden" pas als er al een lijst is [feit] `regios.ts:114`.
   Verhuizen betekent een invoerblok op de Taal-pagina, en dat is een eigen ontwerpvraag. Voorstel:
   nu laten staan en apart beslissen.
4. **De kast bovenaan is op 375 lang** (twaalf tafels in twee kolommen, ± 1.100 px). Is dat
   acceptabel, of wil je dat het open vak op de telefoon eerst alleen de diploma's toont waar je al
   aan begonnen bent? Mijn voorstel: laten zoals het is. Het raster met de gaten is volgens ADR-064
   juist het doel.
5. **"3 van 5" in een vakantieweek:** dan zijn er nul schooldagen, en staat er alleen het getal.
   Of moet er "vakantie" staan?
6. **De reeks** blijft buiten dit voorstel (ADR-171). Wordt hij teruggezet, dan hoort hij volgens de
   maatstaf in "Hoe vaak oefen je?" en nergens anders.

## 11. Wat bij het bouwen anders uitviel

- **Geen nieuwe definitiezin.** Regel 1 staat letterlijk open boven de ring, en de uitklap "Hoe werkt
  onthouden?" bevat regel 2–4. Een aparte sleutel met dezelfde zin zou de zin twee keer op het
  scherm zetten zodra de uitklap open is.
- **De totaalzin** werd "Alles bij elkaar: 37 keer geoefend en 412 vragen beantwoord, waarvan 86%
  goed." Met "1 keer geoefend" leest hij ook bij één ronde goed.
- **Het account (open vraag 2):** het staat onderaan Premium, met en zonder code. Zonder gezinsproject
  in de bouw (`GEZIN_URL`, `GEZIN_KEY`) tekent het niets meer. De belofte in `account.uitleg` over
  de iPad en de laptop is niet herschreven; die blijft een vraag voor F4.
- **"3 van 5" (open vraag 5) speelt nu niet.** Het product kent geen vakanties
  (`isSchoolDay` krijgt overal een lege lijst), en zeven dagen op rij bevatten altijd vijf
  werkdagen. `retention/schooldagen.ts` neemt vakanties mee voor de dag dat het product ze wel
  kent. Wie op een zaterdag extra oefent en zo op zes dagen komt, ziet alleen "6".
- **Het printblad** staat alleen in de pagina zolang er geprint wordt. Stond het er altijd, met
  `data-print`, dan stond het ook klaar voor de printer als je vanuit het venster één diploma
  printte.
- **De e2e-foto `20-jij-instellingen`** is erbij gekomen, met de groep open, omdat de rijen die
  openklappen nieuw zijn.
