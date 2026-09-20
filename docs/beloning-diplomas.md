# De diploma's — het beloningsprogramma van leer.nu

**Status:** ontwerp. **Datum:** 2026-09-20. Op verzoek van de eigenaar.
Vervangt de toren (ADR-158). Vastgelegd als ADR-1nn, ADR-1nn+1 en ADR-1nn+2.

Dit document beschrijft één beloningssysteem, van de regel tot de tekst op het
scherm. Het is geschreven om te bouwen, niet om te overtuigen: wat hier staat is
besloten, en waarom het besloten is staat erbij.

Beweringen dragen een label. **[feit]** is na te lezen in de code of in een ADR,
met de plek erbij. **[model]** is een redenering over hoe het werkt. **[aanname]**
is iets dat we geloven en niet gemeten hebben. **[hypothese]** is falsifieerbaar
en nog niet getoetst.

---

## 1. De regel

> **Een onderdeel telt mee voor je diploma als je het drie keer goed wist, op
> drie verschillende dagen, elke keer op het moment dat het aan de beurt was.**
>
> **Heb je er genoeg, dan mag je de toets doen. Haal je die, dan is het diploma
> van jou — met je naam en de datum erop, voor altijd.**

Dat is het hele systeem. Eén regel, één beeld, één plek.

De zin waarmee een kind van zes het navertelt:

> "Mijn diploma kleurt vol als ik het onthoud. Dan doe ik de toets, en dan is hij
> van mij."

### Wat "genoeg" is

**[feit]** `src/features/home/doel.ts:136-140`, `rewards.ts:118`. Het
tafeldiploma is de hele tafel: tien van de tien onthouden. De andere drie zijn
negen van de tien van de hele set (`diplomaDrempel`) — een toets die twintig van
de zesenveertig landen vraagt, haal je door zesenveertig landen te kennen en niet
door twintig.

Dat is de lat van ADR-141 en die blijft. **[feit]** ADR-162 verving ADR-141 voor
het *doel* — het zelfgekozen doel werd het weekdoel — maar niet voor de lat;
ADR-158 zegt letterlijk `Raakt ADR-139, ADR-141 en ADR-153 niet.`

### Waarom één keer goed niets oplevert

**[feit]** `src/game-core/leitner.ts:27-52`. `INTERVAL_DAYS` is sinds ADR-160
`{1:1, 2:1, 3:1, 4:8, 5:21}` en `ONTHOUDEN_BOX = 4`. Eén goed antwoord zet een
item van doos 1 naar doos 2, en dat telt nergens mee. Pas het derde goede
antwoord, gegeven op een moment dat het item aan de beurt was, zet het in doos 4.
Met intervallen van een dag is de vroegst denkbare route dag 0, dag 1, dag 2.

**Een kind dat op dag één alles goed heeft, staat op nul.** De eerste vulling kan
pas op de derde oefendag vallen, en dan alleen bij een foutloos kind op een
kleine set. Dat is geen drempel die dit ontwerp toevoegt; het is wat "onthouden"
betekent.

### Wat de regel níét is

- **Geen punten voor volume.** Tien rondes op één dag brengen een item niet
  verder dan één ronde: een item dat vandaag al aan de beurt was, is dat vandaag
  niet nog eens.
- **Geen straf.** Er gaat nooit iets af (§3).
- **Geen valuta.** Er is niets te kopen, te ruilen, te sparen of te verliezen.
- **Geen snelheid.** Hoe lang je over een antwoord doet, telt nergens mee — en
  dat is de regel die ADR-064 al stelde toen het de stopwatch van de tafeltoets
  weigerde.

---

## 2. Waarom de toren weg moet

Dit is de **derde** keer dat het beloningsprogramma van dit product herontworpen
wordt — helden en kisten, het album, de toren — en dat is zelf het belangrijkste
gegeven. Elke keer ging het op dezelfde manier mis: er kwam een tweede
boekhouding naast de leerstof, die iets anders telde dan wat het kind leerde.
Munten, XP, sterren, kisten, lagen, stempels, zegels, stenen.

Dit ontwerp voegt **nul** nieuwe getallen toe. Elk getal dat op het scherm komt,
staat er vandaag al en wordt door bestaande code uitgerekend.

**De toren was een tweede boekhouding.** **[feit]** `src/game-core/toren.ts:40`.
De steenregel is strenger dan de doosstap, dus "een steen" en "onthouden" zijn
twee verschillende uitspraken over dezelfde vraag. Een kind kon een steen krijgen
voor een item dat nog niet meetelt voor zijn diploma, en geen steen krijgen op
een dag dat zijn diploma juist wel vooruitging.

**De toren was te groot om na te vertellen.** **[aanname]** — niet getoetst met
kinderen. Stenen, verdiepingen, meters, ijkpunten, het fundament, twee gezichten
per groep, een register-instelling en de reeks: acht begrippen. De toets uit
`docs/beloning-toren.md` §11.1 — *"laat een kind van zes na één ronde uitleggen
wat het kreeg"* — is nooit afgenomen. Het is precies dezelfde toets waarop het
album viel, in ADR-158's eigen woorden: *"Een kind van zes kan niet in één zin
zeggen wat het kreeg."*

**De toren beloonde het verkeerde.** **[feit]** `docs/beloning-toren.md` §4.2.
Tafel-1 foutloos geoefend geeft 60 stenen in 90 dagen; dezelfde tafel met 15%
fouten geeft er 211. Wie het goed kent, krijgt minder. Dat bezwaar staat in het
torenontwerp zelf opgeschreven als "waar", met drie antwoorden die geen oplossing
zijn.

Het diploma heeft geen van die drie problemen. Het telt exact wat het kind leert,
het is één ding met één naam, en het komt sneller naarmate je de stof beter kent.

---

## 3. Wat er dagelijks beweegt: het zegel

Dit is de scherpste vraag van de opdracht. Diploma's vallen zelden — tussen twee
diploma's kunnen weken zitten. Wat ziet een kind in die weken?

**Het antwoord is niet "niets".** Het antwoord is dat het diploma zelf al
beweegt, en dat je dat tot nu toe alleen in een zin kon lezen.

ADR-149 benoemde het probleem zo:

> "Voor het plaatje, de pagina en het diploma klopt ze wel: na 'ik kan het' zakt
> de inzet (post-reward resetting), en de herhalingen die ná het eerste
> onthouden komen, zijn precies de herhalingen die het blijvend maken
> (successive relearning). Een album met kleur als eindstaat en **een diploma van
> één ronde** zeggen allebei 'klaar'."

Het diploma ís geen ronde meer sinds ADR-149 het afzwemmen invoerde: het is de
uitkomst van weken onthouden. Daarmee vervalt het bezwaar uit die zin. Wat
overblijft is dat je die weken moet kúnnen zien.

### De vulling

Elk diploma dat je nog niet hebt, draagt een **zegel dat meeloopt**: de ring is
voor `bewezen / totaal` volgelopen. Acht van de tien onderdelen onthouden is een
zegel dat voor acht tiende gekleurd is.

**[model]** Dit is geen tweede boekhouding. Het is `countMastered()` — dezelfde
som die de modulepagina, Onthouden en Voor ouders vandaag al tonen, en dezelfde
som waarmee `rijpVoor()` de lat legt. Eén bron, drie beelden.

### Bewezen, niet vers

**[feit]** `src/game-core/retention.ts:143-153`. `countMastered(states, ids,
now?)` heeft `now` al als **optioneel** argument, en `leitner.ts:50-52` legt uit
waarvoor:

> "Without `now` the second half is not asked, which is what the rewards want —
> they count what was proven, not what is fresh."

Het zegel leest `countMastered(states, ids)` **zonder `now`**. Daarmee zakt het
nooit. Een kind dat twee weken ziek is, komt terug bij een zegel dat staat waar
het stond. Dat is geen nieuwe functie en geen nieuw veld — het is één argument
niet meegeven.

De lat (`standVan`, mét `now`) verandert níét. Dat is ADR-141 en die staat vast.

### De vier standen van een kaart

| stand | wanneer | zegel | wat eronder staat |
| --- | --- | --- | --- |
| nog niet | `bewezen < nodig` | ring, deels gevuld | "Je onthoudt er {bewezen} van de {totaal}." |
| net begonnen | `bewezen == 0` | ring leeg | "Nog niets onthouden. Je moet het drie keer goed weten, op drie dagen." |
| klaar | zegel vol én rijp | ring vol, in vakkleur | "Klaar om af te zwemmen" — **[feit]** bestaat al als `diploma.rijp` |
| even opfrissen | zegel vol, niet rijp | ring vol, in `--balk-leeg` | "Je diploma is vol. Fris het even op, dan mag je de toets doen." |
| gehaald | staat in `kindBadges` | zegel dicht, met `DiplomaIcon` | "Gehaald op {datum}" |

**[feit]** `leitner.ts:159-163`. De stand *even opfrissen* ontstaat als een item
méér dan zijn eigen interval te laat is — voor doos 4 dus ruim zestien dagen. Het
is de prijs van "het zegel zakt nooit", en het is de eerlijke prijs: het beeld
liegt niet, het wacht. Het kind verliest niets; het moet iets doen. Dit is het
zwakste punt van het ontwerp en het staat in §11.

### De eerste twee dagen

Op dag 1 en dag 2 is het zegel leeg, in élke module. Daar mag geen nul staan. Er
staat de regel zelf: *"Nog niets onthouden. Je moet het drie keer goed weten, op
drie dagen."* Dat is een belofte in plaats van een tekort, en het is wat een kind
van zes ervan navertelt.

De toren had dit probleem erger: daar viel de eerste steen op dag 3, met de
intervallen van vóór ADR-160. Hier is het dag 2, en de zin legt uit waarom.

### Mag het antwoord zijn: er beweegt niets, en dat is goed?

Eerlijk gewogen, en het antwoord is **nee, maar bijna**.

**[model]** ADR-149 en ADR-158 redeneerden allebei over een beloning die "af" kan
zijn — het album waarvan het plaatje klaar was, de zegels die na een reset niets
meer deden. De conclusie was elke keer dezelfde: een beloning die af is, is dood.
Maar de oorzaak was niet "er beweegt te weinig". De oorzaak was dat het ding dat
bewoog **niet de leerstof was**.

Een zegel dat meeloopt met wat je onthoudt, kan niet af zijn zolang er stof is
die je nog niet onthoudt, en het beweegt precies wanneer het leren beweegt. Dat
is de enige beweging die dit product zou moeten tonen. Is ze traag, dan is het
leren traag, en dan is de eerlijkste ingreep de stof — niet de teller.

**[hypothese]** Dat maakt de dagelijkse beweging schraler dan de toren: op een
dag waarop geen enkel item een doos opschuift, gebeurt er zichtbaar niets. Dat is
aanvaardbaar omdat een ronde altijd iets opschuift zolang er stof is. Het is
falsifieerbaar: gaan kinderen zeggen dat oefenen "niets doet", dan is dit de
eerste plek om te kijken.

---

## 4. Wat er met een gehaald diploma gebeurt: niets. Voor altijd.

**Bijhouden komt niet terug.** Het is twee keer gebouwd en twee keer gesloopt: de
zegels en bijhoudstempels van ADR-149, en wat daarvan overbleef verviel met
ADR-158. Een derde poging zou een derde sloop zijn, en de reden is elke keer
dezelfde geweest: een diploma dat je kunt kwijtraken is geen diploma.

**[feit]** ADR-158 schreef zelf op wat de prijs is van een prikkel die op verlies
leunt: *"Het is verlies-als-prikkel bij kinderen vanaf zes, het staat op de
verbodenlijst van het eigen onderzoek dat aan ADR-149 voorafging, en het raakt
DSA art. 28 en de Code voor Kinderrechten."* Dat gold daar de reeks. Het geldt
hier het diploma sterker, want het diploma draagt een naam en een datum.

**[feit]** `src/store/rewardStore.ts:136`. De opslag doet dit vandaag al goed:
een diploma wordt alleen weggeschreven als het er nog niet stond, dus **de eerste
datum blijft staan**. Dat blijft zo.

**Waar opfrissen wél hoort: op Onthouden.** Dat is de statuspagina, daar is "even
opfrissen" een van de vier woorden die de stippen en de tabel al gebruiken, en
daar is het informatie in plaats van een beloning. Eén taal, één plek.

**Opruimen onderweg:** **[feit]** `.tk-diploma-seizoenen` en
`.tk-diploma-seizoen` staan nog in `src/index.css:4318-4335`, en de enige
verwijzing ernaar in de rest van het project is een opmerking op `nl.ts:181`. De
bijhoudstempels zijn weg; hun CSS niet.

---

## 5. Waar de diploma's staan: Jij ís de kast

### De splitsing van ADR-158 vervalt

ADR-158 zette op Jij alleen wat gehaald was, en het hele raster van drieëndertig
op Voor ouders, met de redenering: *het diploma is een toets, dus het hoort bij
degene die de toets afneemt, en een gat is iets waar een ouder iets mee kan.*

Die redenering hield zolang het diploma náást de toren stond. **Zodra het diploma
zelf de beloning is, keert hij om.**

Dat is geen nieuwe gedachte. Het is de stichtende zin van de diplomawand, uit
ADR-064:

> "Twelve of them, on a wall, with the gaps showing. **This is the one place in
> the product where something not yet earned is drawn on purpose** — ADR-059
> ruled out a shelf of unearned rewards, and rightly, because those were things a
> child could not aim at. These are twelve named tables in the order they are
> taught, and **every gap is something a child can decide to go and do this
> afternoon**."

Het verschil tussen een plank met onverdiende beloningen (ADR-059, afgewezen) en
een wand met gaten (ADR-064, het ontwerp) is of een kind erop kan mikken. Een
diploma kun je gaan halen. Daarom hoort de hele wand bij het kind.

ADR-158 zweeg op Jij bij een lege kast, want *"vier lege wanden vertellen een
kind op dag één dat het niets heeft"*. Die reden vervalt met het zegel: op dag
één is de wand niet leeg, hij is **bleek**. Elk diploma staat er, elk zegel is
leeg, en elk vlak is een knop.

### De pagina

**Jij** krijgt de kast als hoofdbeeld, op de plek waar `TorenPagina` nu staat.

```
Jouw diploma's
3 van de 12 gehaald.                       ← bij nul: "Hier komen je diploma's
                                             te hangen. Druk op een diploma om
                                             eraan te beginnen."

  Tafels      [diploma] [diploma] …        ← twaalf
  Vlaggen     [diploma] [diploma] …        ← zes, alleen met code
  Klokkijken  [diploma] …                  ← vier, alleen met code
  Topografie  [diploma] …                  ← elf, alleen met code
```

**Elk vlak is een knop**, en wat hij doet volgt uit hoe hij eruitziet:

- **Gehaald** (dicht, in kleur) → het diploma gaat groot open, met "Print je
  diploma". **[feit]** Dat is vandaag onmogelijk: de printknop bestaat alleen op
  Ronde klaar (`RondeKlaar.tsx:422-429`), dus wie zijn diploma een week later wil
  printen, kan dat niet.
- **Nog niet** (bleek, gestippeld) → naar die set, om te oefenen. **[feit]** Dat
  is precies wat een gat op de modulepagina al doet (`DiplomaRaster.tsx:69-78`,
  `onKies`); het wordt alleen ook op Jij aangesloten.

### Zonder code

**[feit]** `doel.ts:93` filtert al op premium, en `VlagDiplomas.tsx:39` tekent een
premiumwand zonder code helemaal niet — geen slot, gewoon afwezig (ADR-124). Dat
blijft. Een kind zonder code ziet **twaalf diploma's, en dat is zijn hele kast**,
niet een kast die voor tweederde op slot zit.

ADR-122 blijft staan, inclusief zijn reden: *"The tafeldiploma, alone of the four
diplomas. It is the one a Dutch child wants before they ever meet this app, and
the moment a parent photographs, which is the only way a product with no
marketing budget travels."* En de regel die ADR-122 als invariant achterliet — *"a
page never opens on a lock"* — wordt door deze kast gehaald.

### Voor ouders

Voor ouders houdt géén tweede raster meer. Wat er komt te staan is wat een ouder
er wél mee kan:

- **De reeks** (`ReeksBlok`), verhuisd van Jij en Ronde klaar. Het kind ziet hem
  niet meer; de ouder ziet of er volgehouden wordt. Daarmee verdwijnt ook de
  prikkel op de voordeur (`ReeksRegel`) waarvan ADR-158 zelf schreef dat hij op
  de verbodenlijst staat.
- **Jouw schooljaar** (`Jaaroverzicht`), herbouwd uit de diploma's: welke
  diploma's dit schooljaar, met datum, printbaar. Geen stenen, geen meters.
- **De uitleg**: `TorenUitleg` wordt `DiplomaUitleg`.

**[feit]** De diepe link "Bekijk alle diploma's" (ADR-153) wijst sinds ADR-158
naar Voor ouders. Die gaat **terug naar Jij** — letterlijk wat ADR-153 zelf
schreef: *"De knop opent Jij met de prijzenkast open, ook wat nog te halen is, en
brengt die in beeld."* Het herstelt een besluit in plaats van er een te nemen.

---

## 6. Het beeld: hoe een diploma eruitziet

Binnen het palet van ADR-159 en binnen wat `Embleem.tsx` al vormgeeft. Eén
afwijking, en die staat eronder.

### Groot — het diploma zoals het gedrukt wordt

Het uitgangspunt is niet nieuw. **[feit]** `.tk-diplomaprint` bestaat al
(`RondeKlaar.tsx:428-434`, `index.css:4345-4388`) en is precies "een vlak met een
naam, een datum": een **dubbele rand van 8px** in `--inkt`, de soort in
`--font-kop` op `--type-sectiekop`, de naam op `--type-paginakop`, daaronder
"Gehaald door {naam}" en "op {datum}". Het staat vandaag alleen nooit op het
scherm — alleen op papier.

**Het ontwerp is: datzelfde object op het scherm zetten, met drie toevoegingen.**

1. **Een band in de vakkleur** langs de bovenrand, 12px, in `--module`. De enige
   plek waar het vak kleur krijgt. Genoeg om vier tafeldiploma's uit elkaar te
   houden zonder dat de kaart bont wordt, en het is de regel die HUISSTIJL §6 al
   stelt.
2. **Het zegel**, rechtsonder: een cirkel van 88px met `--module` als rand,
   `--module-tint` als vlak en `DiplomaIcon` erin op 40px. Dat is `Embleem` op 88
   in plaats van 56 — **geen nieuwe vorm, dezelfde taal** (`index.css:934-963`).
3. **Denker** ernaast, op `goed-gedaan`. Náást het diploma, niet erop: koraal ligt
   acht graden tint van het rood dat "fout" betekent, en mag nooit de uitslag
   zelf zijn (ADR-159, HUISSTIJL §10).

Verhouding 3:4 staand, op `--kaart` wit. Op 393px is dat 321 breed en 428 hoog,
en dat past onder de schermpadding met de knoppen eronder in beeld.

### Klein — in de wand

Hetzelfde vlak op een kwart. De vormtaal van `Embleem` bepaalt het verschil, niet
de tint:

| | gehaald | nog niet |
| --- | --- | --- |
| rand | 2px **vol**, `--inkt` | 2px **gestippeld**, `--rand-sterk` |
| band boven | `--module` | `--balk-leeg` |
| naam | `--inkt` | `--tekst-tertiair` |
| zegel | dicht, `DiplomaIcon` | ring, deels gevuld |
| eronder | "Gehaald op {datum}" | "Je onthoudt er 8 van de 10." |

Gevuld is verdiend, gestippeld is nog niet. **[feit]** Dat is de regel die
`.tk-embleem` (`index.css:947`) al voert en die het torenontwerp overnam voor
zijn stenen: **een vorm, geen tint**, zodat het in grijstinten en bij
kleurenblindheid overeind blijft. Die taal overleeft de toren.

### Het zegel dat meeloopt — en waarom het niets nieuws kost

**[feit]** `src/index.css:2337-2346`. `.tk-ring` bestaat al, in gebruik op
Onthouden, en is precies dit mechanisme:

```css
background: conic-gradient(var(--inkt) 0 var(--vul, 0%), var(--balk-leeg) var(--vul, 0%));
```

Een `--vul` op de wortel van de kaart, gezet uit `bewezen / totaal`. Het zegel is
dus één bestaande CSS-klasse met een andere maat en `--module` in plaats van
`--inkt`.

**De vulling is nooit de enige drager.** Onder elk zegel staat de zin met de
getallen erin, en de rand zegt met een vorm of het diploma gehaald is. HUISSTIJL
§8: nooit kleur als enige drager.

### De afwijking, en waarom

`Embleem` is vandaag altijd een **cirkel** van 56px. Het grote diploma is een
**rechthoek** met dat embleem erop.

**[feit]** Dat is minder een breuk dan het lijkt. ADR-112 zei het zelf al: *"The
travel stamps are badges, and **the diplomas are cards**, both wearing one round
emblem (`Embleem`): closed in the module's colour when earned, a dashed ring when
not."*

Het embleem is het teken; de kaart is de drager. Die twee stonden altijd al zo in
het besluit — alleen was de kaart nooit groot genoeg getekend om als kaart te
lezen. De reden om hem nu wél groot te tekenen is de opdracht zelf: *het moet
voelen als iets dat je krijgt*, en een cirkel van 56px in een rij voelt als een
pictogram, niet als een oorkonde. De rechthoek bestaat bovendien al, op papier.

De reisstempels zelf zijn met ADR-149 vervallen; het embleem dat zij met het
diploma deelden, is het enige dat overleeft, en het gaat nu voluit naar het
diploma.

---

## 7. Het moment van halen

Eén scène, **1620ms**, met een harde bovengrens van 3200ms. Alleen `transform` en
`opacity`, met de bestaande tokens — **[feit]** `index.css:320-324`:
`--beweeg-vlot` 120ms, `--beweeg-rustig` 240ms, `--beweeg-traag` 420ms,
`--beweeg-uit`, `--beweeg-veer`.

De scène komt over Ronde klaar heen zodra `reward.diplomas` niet leeg is.

### Waarom dit binnen de bewegingsregels valt

**[feit]** ADR-142 legt het plafond op vierhonderdtwintig milliseconden: *"Alles
wat hier beweegt beweegt omdat er iets gebeurde, en duurt hoogstens
vierhonderdtwintig milliseconden."* ADR-158 maakte daar precies één uitzondering
op, en die uitzondering is dit slot:

> "**De beweging zit op één scherm**: Ronde klaar, één scène van hoogstens 3,2
> seconden, met een tik over te slaan en met knoppen die vanaf de eerste frame
> werken. Alleen transform en opacity, met de tokens van ADR-142."

De nieuwe scène **neemt dat slot over** en maakt het kleiner: 1620ms in plaats
van 2200ms, op hetzelfde scherm, met dezelfde voorwaarden. Er komt geen tweede
uitzondering bij. Tijdens de ronde komt er nog steeds niets bij: `SteenRegel`
verdwijnt en er komt niets voor in de plaats, zoals ADR-158 en het onderzoek
achter ADR-149 het willen — decoratie naast de leerstof schaadt het leren.

### De scène, beat voor beat

| t | wat | duur | hoe |
| --- | --- | --- | --- |
| 0 | Ronde klaar zakt naar 15% dekking; het lege diploma komt in beeld, van schaal 0,94 naar 1 | 420 | `--beweeg-traag` `--beweeg-uit` |
| 420 | De soort verschijnt: "Tafeldiploma" | 180 | opacity |
| 600 | De naam verschijnt: "Tafel van 7" | 180 | opacity |
| 780 | **Het zegel wordt gedrukt**: van schaal 1,6 en dekking 0 naar 1. Eén keer `speelMoment('pagina')` | 240 | `--beweeg-veer` |
| 1020 | "Gehaald door {naam}" en "op {datum}" | 180 | opacity |
| 1200 | Denker komt ernaast staan op `goed-gedaan`, één sprongetje | 240 | `--beweeg-veer` |
| 1440 | De knoppen worden zichtbaar | 180 | opacity |

De knoppen zijn **vanaf de eerste frame bruikbaar** — alleen hun dekking
animeert, ze staan in de documentvolgorde en er ligt niets overheen. Twee
knoppen, niet drie: **Print je diploma** en **Verder**.

**Overslaan** is een tik op het diploma: alles in de eindstand. Geen
`preventDefault`, geen laag over de knoppen, dus spatie op een knop met focus
drukt die knop in én eindigt de scène, en de eindstand is wat het kind toch al
zou zien.

**[feit]** Twee diploma's in één ronde kan niet: een ronde is er één per set, en
`doelwitVan(deel)` geeft precies één diploma per set. De scène hoeft nooit te
stapelen.

### Rustig moet écht werken

Bij `prefers-reduced-motion: reduce` en bij `:root[data-beweging='rustig']` staat
**alles in de eindstand op de eerste frame**. Zelfde scherm, zelfde zinnen,
zelfde geluid, nul beweging.

Dat gaat niet vanzelf, en het torenontwerp heeft precies uitgezocht waarom —
**[feit]** `docs/beloning-toren.md` §6.3, `index.css:550-569`:

1. **De globale squash drukt alleen `animation-duration` naar 0,01ms.**
   `animation-delay` blijft staan. Zeven beats zouden dus nog steeds over 1440ms
   binnendruppelen: de beweging weg, de volgorde niet.
2. **Een tijdlijn in JavaScript ziet CSS niet.** De scène zou 1,6 seconde lang
   niets doen.
3. **`usePreferences()` geeft bij de eerste render de standaardwaarden terug** en
   leest pas daarna uit IndexedDB. Een scène die op mount begint, beweegt dan
   vóórdat de voorkeur binnen is.

Alle drie zijn al opgelost, en die oplossing moet de toren overleven:

- **Eén puur draaiboek** (`draaiboek()`) dat bij `rustig: true` élke duur én élke
  vertraging op nul zet en dezelfde beats met dezelfde geluiden teruggeeft. De
  component voert alleen uit. Geen Web Animations API — jsdom kent
  `Element.animate` niet, en dan zou juist de bewering die het eerst rot niet te
  testen zijn.
- **`leesRustig()`** (`features/player/settings.ts:98-106`) leest synchroon van
  `document.documentElement`, met `prefers-reduced-motion` als terugval. **[feit]**
  Die functie bestaat precies hiervoor, en `Scene.tsx` is vandaag haar enige
  lezer. Zij gaat dus níét mee weg met de toren; de nieuwe scène erft haar.
- **Elke animatie is een binnenkomst waarvan de eindstand de gewone ruststand
  is.** Geen enkele houdt met `forwards` een waarde vast die niet al in de
  stylesheet staat. Dan is de squash vanzelf de juiste eindstand, en is overslaan
  vanzelf correct.

De twee toetsen die dat bewijzen zijn elk één regel, overgenomen uit
`draaiboek.test.ts`:

```ts
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.id))
  .toEqual(draaiboek({ ...basis, rustig: false }).beats.map((b) => b.id));
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.geluid))
  .toEqual(draaiboek({ ...basis, rustig: false }).beats.map((b) => b.geluid));
```

---

## 8. De zinnen die op het scherm komen

Nederlands op het scherm, Engels in de code.

**De kast, op Jij**

| sleutel | zin |
| --- | --- |
| `kast.titel` | Jouw diploma's |
| `kast.stand` | {aantal} van de {totaal} gehaald. |
| `kast.leeg` | Hier komen je diploma's te hangen. Druk op een diploma om eraan te beginnen. |
| `kast.print` | Print je diploma |
| `kast.sluit` | Terug naar je diploma's |

**Op een kaart** — `diploma.gehaald`, `diploma.nogNiet` en `diploma.rijp` bestaan al.

| sleutel | zin |
| --- | --- |
| `diploma.gehaaldOp` | Gehaald op {datum} |
| `diploma.onthoudt` | Je onthoudt er {bewezen} van de {totaal}. |
| `diploma.nogNiets` | Nog niets onthouden. Je moet het drie keer goed weten, op drie dagen. |
| `diploma.opfrissen` | Je diploma is vol. Fris het even op, dan mag je de toets doen. |

**Het haalmoment** — `afzwemmen.printNaam` en `.printDatum` worden hergebruikt.

| sleutel | zin |
| --- | --- |
| `diploma.gehaaldKop` | Gehaald! |
| `diploma.verder` | Verder |

**Voor ouders**

| sleutel | zin |
| --- | --- |
| `ouder.diplomaTitel` | Hoe een diploma verdiend wordt |
| `ouder.diplomaUitleg` | Een onderdeel telt pas mee als uw kind het drie keer goed wist, op drie verschillende dagen, steeds op het moment dat het weer aan de beurt was. Eén keer goed antwoorden telt niet mee — dat is het verschil tussen iets kennen en iets onthouden. |
| `ouder.diplomaTempo` | Hoe beter uw kind de stof kent, hoe sneller het diploma komt: alles wat onthouden is, blijft meetellen. Het zegel op een diploma loopt nooit terug. |

**Herschreven, want ze gaan nog over het album**

| sleutel | nu | wordt |
| --- | --- | --- |
| `afzwemmen.nietRijpUitleg` (`nl.ts:157-158`) | "Een **plaatje krijgt kleur** als je het op verschillende dagen goed weet. Proefzwemmen kan al, maar het diploma krijg je dan nog niet." | "Je zegel kleurt vol als je de onderdelen op verschillende dagen goed weet. Is het vol, dan mag je de toets doen." |
| `afzwemmen.proefUitleg` (`nl.ts:176`) | "Bij proefzwemmen krijg je nog geen diploma. Dat komt als je **albumpagina** klaar is om af te zwemmen." | vervalt met proefzwemmen (§9) |

---

## 9. Proefzwemmen verdwijnt; de oefentoets blijft

Dit is de enige plek waar dit ontwerp aan de ronde komt, en het is daarom apart
onderbouwd.

**Het zijn twee verschillende dingen.** **[feit]**

| | proefzwemmen | de oefentoets (`toetsstand`) |
| --- | --- | --- |
| wat | de diplomatoets afleggen terwijl de set nog niet rijp is | een ronde zonder hulp, zonder verbetering onderweg, met een **cijfer** |
| waar | `Afzwemmen.tsx:168-211`, `rewardStore.ts:145-156` | ADR-085, ADR-100; `App.tsx:200` |
| welke sets | alleen sets mét diploma | elke set, ook mixen zonder diploma |
| prijs | gratis waar het diploma gratis is | premium (ADR-122) |
| icoon | `DiplomaIcon` | `RoundMark`, met opzet **niet** `DiplomaIcon` (`Icon.tsx:537`) |
| levert op | niets | een cijfer |

**Proefzwemmen gaat weg.** Het diploma moet echte waarde opleveren, en een toets
die je mag afleggen terwijl vaststaat dat je er niets voor krijgt, is een toets
zonder waarde. Hij bestond omdat een kind anders niet kon voelen hoe de toets is
— en dat argument valt op twee manieren tegelijk weg: het zegel laat nu zien hoe
ver je bent, en de oefentoets doet hetzelfde maar beter.

**De oefentoets blijft, en is daarmee nodiger dan eerst.** **[feit]** ADR-104
zegt dat een diploma altijd draait *"the way the oefentoets runs (ADR-085)"* —
niets terug tot het eind. De oefentoets is dus letterlijk dezelfde vorm, op elke
set, met een cijfer eraan. Hij vangt op wat proefzwemmen deed, hij werkt op sets
zonder diploma waar een diploma niets kan betekenen, en hij wordt op de
premiumpagina verkocht met *"Jij hoeft niet meer te overhoren"* (`nl.ts:598`).

**Hij hernoemen kan niet: "oefentoets" ís zijn naam**, sinds ADR-100 hem een
eigen tegel gaf — als laatste van de manieren, met het typen erbij.

Wat verdwijnt: de proef-tak in `rewardStore.ts:145-156`, `afzwemmen.proef`,
`.proefGehaald`, `.proefUitleg`, de tweede knop op `Afzwemmen.tsx:202-210`, en de
weergave op `RondeKlaar.tsx:246-252`. Het scherm Afzwemmen wordt bij "nog niet
rijp" één knop: **Eerst oefenen**.

---

## 10. Wat verdwijnt en wat blijft

### Weg, helemaal

| wat | regels |
| --- | --- |
| `src/features/toren/` — op `ReeksBlok.tsx` en `reeks.ts` na | 1861 → 80 |
| `src/game-core/toren.ts` | 186 |
| `src/game-core/ijkpunten.ts` | 125 |
| `src/store/torenStore.ts` | 116 |
| `features/toren/register.ts` + `RegisterInstelling.tsx` | 112 |
| `features/toren/ReeksRegel.tsx` (de prikkel op de voordeur) | 27 |
| `features/toren/SteenRegel.tsx`, `Toren.tsx`, `TorenPagina.tsx`, `Scene.tsx`, `draaiboek.ts`, `geometrie.ts` | 824 |
| toetsen: `toren.test.ts` (133), `ijkpunten.test.ts` (121), `draaiboek.test.ts` (137), `geometrie.test.ts` (76), `e2e/toren.spec.ts` (87) | 554 |
| CSS: `index.css:4392-4661`, de toren-animaties op `4680-4710`, en `@keyframes tk-steen-aan`, `tk-verdieping-zet`, `tk-wacht-pols`, `tk-denker-sprong`, `tk-mijlpaal-in` | ±300 |
| i18n: `toren.*` (26), `ijkpunt.*` (13), `register.*` (5) | 44 sleutels |
| dode CSS: `.tk-diploma-seizoenen`, `.tk-diploma-seizoen` (`index.css:4318-4335`) | 18 |
| dode opmerking `nl.ts:181`, en de drie zwevende sectiekopjes `nl.ts:1411-1416` | 7 |

### Blijft, in nieuwe vorm

| wat | waar het heen gaat |
| --- | --- |
| `ReeksBlok` + `features/toren/reeks.ts` + `game-core/reeks.ts` | naar `features/player/`, alleen op Voor ouders. `reeks.*` (14 sleutels) blijft |
| `Jaaroverzicht` | naar `features/player/`, herbouwd uit diploma's. `jaar.stenen`, `.steenEen`, `.verdiepingen`, `.hoogte` vervallen |
| `TorenUitleg` (`ParentScreen.tsx:347-360`) | wordt `DiplomaUitleg`, nieuwe tekst |
| `draaiboek.ts` als patroon | het bestand gaat weg; het patroon komt terug als `features/badges/draaiboek.ts` |
| `leesRustig()` | blijft. De nieuwe scène wordt haar lezer |
| de gestippeld-vs-vol-taal | blijft in `.tk-embleem` en gaat naar de diplomakaart |

### Regels die verbouwd worden, niet verwijderd

`App.tsx:209` (de afzwemgate blijft) · `RondeKlaar.tsx:13-17, 246-252, 305-323,
428-434` · `ProfileScreen.tsx:8-9, 71, 75, 77` · `ParentScreen.tsx:26, 162, 186,
194` · `HomeScreen.tsx:23, 172` · `Weekbericht.tsx:9` · `SumScreen`,
`TaalScreen`, `VlagScreen`, `KlokScreen`, `PracticeScreen` (elk één import en één
render van `SteenRegel`) · `useRoundCore.ts:17, 287-311` en
`practice/useRound.ts:26, 854` (`torenStore` eruit; `rijpVoorDiploma` blijft
precies zoals het is) · `game-core/index.ts:19-21` · `shell/routes.test.ts:240`.

### e2e-specs die bijgewerkt moeten worden, niet verwijderd

`a11y.spec.ts:143,152` · `children.spec.ts:52,54` ·
`kindouder.spec.ts:52,55,56,79,82` · `ouder.spec.ts:28,38,62,65,67` ·
`premium.spec.ts:127,131,151,154` · `screens.spec.ts:82,89,90` ·
`sums.spec.ts:256,257` · `onthouden.spec.ts:8,102,104` ·
`useRoundCore.test.tsx:24-28`.

### De opslag

**[feit]** `toren:<kindId>` en `register` blijven in de settings-store staan en
worden door niets meer gelezen — het patroon van ADR-130 en ADR-149, en precies
wat `torenStore.ts:26-27` zelf al doet met `hoogsteDoos` en `stempels`. Geen
schemawijziging, geen migratie, geen risico op dataverlies. `kindBadges`
(`db.ts:202`) verandert niet: daar staan de diploma's al.

**Een kind ziet niets van de overgang.** De toren is er op een dag niet meer,
zijn diploma's staan er nog, en het zegel van het volgende diploma staat meteen
op de juiste hoogte omdat het uit de Leitner-standen komt die er al zijn. Er valt
geen gat — en dat is precies waarom de migratie niets hoeft uit te leggen.

### Een gat in de dekking

**[feit]** Er is **geen** `src/features/afzwemmen/*.test.ts` en **geen**
`e2e/afzwemmen.spec.ts`. Afzwemmen is alleen indirect gedekt
(`e2e/diplomas.spec.ts:57-59`, `e2e/doel.spec.ts:188`). Dat was te billijken toen
het diploma een bijzaak was; het is het niet meer.

---

## 11. Wat hier zwak aan is

Vier dingen, opgeschreven omdat ze anders pas na de bouw gevonden worden.

**Het zegel kan vol staan terwijl de toets niet open is.** Het zegel telt bewezen
(zonder `now`), de lat telt vers (mét `now`). Na ruim twee weken wegblijven lopen
die uit elkaar, en dan staat er een vierde zin op de kaart die er niet hoorde te
zijn. Het alternatief was een zegel dat leegloopt, en dat is erger. Maar het is
een extra stand, en de zesjarigentoets is hier het strengst.

**De wand op dag één is bleek, en dat is nog steeds een wand zonder iets erop.**
ADR-158 vond dat een verkeerde boodschap en zette hem daarom op Voor ouders. Het
zegel en de knopwerking moeten dat dragen, en dat is veel gevraagd van een
gestippelde rand. **[hypothese]** Dit is het eerste wat getoetst moet worden bij
een kind dat de app voor het eerst opent.

**Twee acties op één wand.** Een gehaald diploma opent zichzelf; een niet-gehaald
diploma opent een oefenronde. Dat volgt uit hoe de kaart eruitziet, maar het zijn
twee regels waar er één hoorde te zijn. Struikelt het daar, dan is de ingreep:
elke kaart gaat groot open, en "Ga oefenen" staat in het grote beeld.

**De dagelijkse beweging is schraler dan de toren.** Dat is met opzet (§3), maar
het is niet gratis. Op een dag waarop geen enkel item een doos opschuift, gebeurt
er zichtbaar niets. Gaan kinderen zeggen dat oefenen "niets doet", dan is dit de
eerste plek om te kijken — en het eerlijke antwoord is dan de stof, niet de
teller.

---

## 12. De toetsen voordat dit af heet

Vijf. De eerste drie kunnen alleen met echte kinderen, en zijn bij de toren nooit
afgenomen.

1. **Laat een kind van zes of zeven na één ronde uitleggen wat er gebeurde.**
   Komt daar meer dan één zin uit, dan is het ontwerp te groot.
2. **Laat datzelfde kind zonder tekst zeggen wat het verschil is** tussen een
   gehaald en een niet-gehaald diploma.
3. **Zet een kind op dag één voor de bleke wand** en vraag wat het ziet. Zegt het
   "ik heb niets", dan faalt §5.
4. **Zet rustig aan en haal een diploma.** Alles moet hetzelfde zeggen, zonder
   één beweging, met hetzelfde geluid.
5. **Teken het grote diploma op 393px voordat er een regel CSS bij komt**, met de
   knoppen in beeld.

---

## 13. De fasering

Drie PR's, drie ADR's. De nummers worden **pas vlak voor het committen** van
`origin/main` genomen; vandaag is ADR-166 het hoogste.

**PR 1 — Het diploma wordt het beloningsprogramma.** `bewezenVan()`, het zegel op
`DiplomaRaster`, de vier standen en hun zinnen, het grote diploma als component,
de scène op Ronde klaar met `draaiboek()` en `leesRustig()`, de kast op Jij, en
de toetsen die er niet waren (afzwemmen, het draaiboek, het zegel).

De toren staat er nog gewoon onder. **Dit is de PR die als eerste weg kan zonder
dat er een gat valt** — en tegelijk de PR waarna de toren overbodig is.

**PR 2 — De toren eruit.** Alles uit §10, de reeks en het jaaroverzicht naar Voor
ouders, `TorenUitleg` wordt `DiplomaUitleg`, `SteenRegel` uit de vijf
rondeschermen, de e2e-specs bijgewerkt.

**PR 3 — De opruiming.** Proefzwemmen eruit, de albumzinnen herschreven, de diepe
link van ADR-153 terug naar Jij, de dode seizoen-CSS, de zwevende i18n-kopjes, en
de resterende album-opmerkingen in `badges/rijp.ts:11`, `useDiplomaStand.ts:13`,
`retention/StandKaart.tsx:11`, `game-core/terugkomst.ts:6`, `rewards.ts:9`.
