# De diploma's — het beloningsprogramma van leer.nu

> **Let op (25 september 2026):** de premiumgrens in dit document is herzien in
> ADR-192. Wat premium is, staat daar en in `src/features/module/premium.ts`.

**Status:** gebouwd. **Datum:** 2026-09-20. Op verzoek van de eigenaar.
Vervangt de toren (ADR-158). Vastgelegd als ADR-167 (de ring en de kaart),
ADR-168 (de modulepagina en de feedbackronde), ADR-169 (de toren weg, de reeks
en het schooljaar naar de ouder) en ADR-170 (proefzwemmen weg).

Dit document beschrijft één beloningssysteem, van de regel tot de tekst op het
scherm. Het is geschreven om te bouwen, niet om te overtuigen: wat hier staat is
besloten, en waarom het besloten is staat erbij.

Beweringen dragen een label. **[feit]** is na te lezen in de code of in een ADR,
met de plek erbij. **[model]** is een redenering over hoe het werkt. **[aanname]**
is iets dat we geloven en niet gemeten hebben. **[hypothese]** is falsifieerbaar
en nog niet getoetst.

---

## 0b. De woorden die dit document gebruikt

Een ontwerpdocument dat zijn eigen woorden niet vastlegt, leidt tot code die ze
door elkaar haalt. Deze zeven, met wat ze letterlijk op het scherm of in de code
zijn. **Twee ervan zijn met opzet géén metafoor**, omdat dit product al twee keer
een afgeschaft woord heeft hergebruikt.

| woord                     | wat het letterlijk is                                                                                                                                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **de diplomakaart**       | Eén kaart in `DiplomaRaster`: een staand vlak met een kleurband bovenaan, de naam, een voortgangsring en een zin eronder.                                                                                                                                                  |
| **de voortgangsring**     | De cirkel op die kaart met `DiplomaIcon` erin — 40px in het raster, 88px op het grote diploma. De rand loopt rond vol naarmate het kind meer onderdelen van die set onthoudt. Technisch een `conic-gradient` met `--vul`, hetzelfde mechaniek als `.tk-ring` op Onthouden. |
| **het diplomaraster**     | Eén raster kaarten voor één vak: 12 tafels, 6 werelddelen, 4 kloktypen, 11 topokaarten (`DiplomaRaster`).                                                                                                                                                                  |
| **de diplomakast**        | De vier rasters samen op Jij (`Prijzenkast`).                                                                                                                                                                                                                              |
| **de diplomadrempel**     | Wat je moet onthouden om te mogen afzwemmen: 10 van de 10 bij een tafel, 9 van de 10 elders. Heet `diplomaDrempel` in de code.                                                                                                                                             |
| **rijp**                  | Bestaande projectterm (ADR-141): de set haalt de diplomadrempel, dus de toets wordt aangeboden.                                                                                                                                                                            |
| **de diploma-uitreiking** | Het scherm dat over Ronde klaar heen komt zodra de toets gehaald is (§7).                                                                                                                                                                                                  |

**Niet gebruikt, en waarom niet.** _Zegel_ — dat betekende in dit product de
weekzegel van ADR-149 (`zegels:<kind>`), die ADR-158 heeft gesloopt; het staat nog
acht keer in `DECISIONS.md` voor dat andere ding. _Stempel_ — dat waren de
bijhoudstempels van ADR-149 en het stempelbegrip in `leitner.ts`. _Laag_, _steen_
en _verdieping_ — album en toren. Een woord dat in de geschiedenis van dit product
al iets anders betekent, is geen naam maar een valstrik.

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
het _doel_ — het zelfgekozen doel werd het weekdoel — maar niet voor de lat;
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
`docs/beloning-toren.md` §11.1 — _"laat een kind van zes na één ronde uitleggen
wat het kreeg"_ — is nooit afgenomen. Het is precies dezelfde toets waarop het
album viel, in ADR-158's eigen woorden: _"Een kind van zes kan niet in één zin
zeggen wat het kreeg."_

**De toren beloonde het verkeerde.** **[feit]** `docs/beloning-toren.md` §4.2.
Tafel-1 foutloos geoefend geeft 60 stenen in 90 dagen; dezelfde tafel met 15%
fouten geeft er 211. Wie het goed kent, krijgt minder. Dat bezwaar staat in het
torenontwerp zelf opgeschreven als "waar", met drie antwoorden die geen oplossing
zijn.

Het diploma heeft geen van die drie problemen. Het telt exact wat het kind leert,
het is één ding met één naam, en het komt sneller naarmate je de stof beter kent.

---

## 3. Wat er dagelijks beweegt: de voortgangsring

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

Elke diplomakaart draagt een **voortgangsring**: een cirkel met `DiplomaIcon`
erin, waarvan de rand rond volloopt naarmate het kind meer onderdelen van die set
onthoudt. Acht van de tien onderdelen onthouden is een ring die voor acht tiende
gekleurd is. In het raster is die cirkel 40px, op het grote diploma 88px.

**[model]** Dit is geen tweede boekhouding. Het is `countMastered()` — dezelfde
som die de modulepagina, Onthouden en Voor ouders vandaag al tonen, en dezelfde
som waarmee `rijpVoor()` de lat legt. Eén bron, drie beelden.

### Bewezen, niet vers

**[feit]** `src/game-core/retention.ts:143-153`. `countMastered(states, ids,
now?)` heeft `now` al als **optioneel** argument, en `leitner.ts:50-52` legt uit
waarvoor:

> "Without `now` the second half is not asked, which is what the rewards want —
> they count what was proven, not what is fresh."

De voortgangsring leest `countMastered(states, ids)` **zonder `now`**. In gewone
woorden: een onderdeel telt mee zodra het ooit doos 4 heeft gehaald, en er wordt
niet gekeken of het daarna te lang niet gezien is. Daarmee kan de ring nooit
teruglopen — een kind dat twee weken ziek is, komt terug bij een ring die staat
waar hij stond. Dat is geen nieuwe functie en geen nieuw veld: het is één
argument niet meegeven.

De lat (`standVan`, mét `now`) verandert níét. Dat is ADR-141 en die staat vast.

### De vier standen van een kaart

| stand          | wanneer               | voortgangsring                | wat eronder staat                                                       |
| -------------- | --------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| nog niet       | `bewezen < nodig`     | ring, deels gevuld            | "Je onthoudt er {bewezen} van de {totaal}."                             |
| net begonnen   | `bewezen == 0`        | ring leeg                     | "Nog niets onthouden. Je moet het drie keer goed weten, op drie dagen." |
| klaar          | ring vol én rijp      | ring vol, in vakkleur         | "Klaar om af te zwemmen" — **[feit]** bestaat al als `diploma.rijp`     |
| even opfrissen | ring vol, niet rijp   | ring vol, in `--balk-leeg`    | "Je diploma is vol. Fris het even op, dan mag je de toets doen."        |
| gehaald        | staat in `kindBadges` | ring dicht, met `DiplomaIcon` | "Gehaald op {datum}"                                                    |

**[feit]** `leitner.ts:159-163`. De stand _even opfrissen_ ontstaat als een item
méér dan zijn eigen interval te laat is — voor doos 4 dus ruim zestien dagen. Het
is de prijs van "de ring loopt nooit terug", en het is de eerlijke prijs: het beeld
liegt niet, het wacht. Het kind verliest niets; het moet iets doen. Dit is het
zwakste punt van het ontwerp en het staat in §11.

### De eerste twee dagen

Op dag 1 en dag 2 staat elke voortgangsring op nul, in élke module. Daar mag geen
getal nul staan. Er
staat de regel zelf: _"Nog niets onthouden. Je moet het drie keer goed weten, op
drie dagen."_ Dat is een belofte in plaats van een tekort, en het is wat een kind
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

Een ring die meeloopt met wat je onthoudt, kan niet af zijn zolang er stof is
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
leunt: _"Het is verlies-als-prikkel bij kinderen vanaf zes, het staat op de
verbodenlijst van het eigen onderzoek dat aan ADR-149 voorafging, en het raakt
DSA art. 28 en de Code voor Kinderrechten."_ Dat gold daar de reeks. Het geldt
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
op Voor ouders, met de redenering: _het diploma is een toets, dus het hoort bij
degene die de toets afneemt, en een gat is iets waar een ouder iets mee kan._

Die redenering hield zolang het diploma náást de toren stond. **Zodra het diploma
zelf de beloning is, keert hij om.**

Dat is geen nieuwe gedachte. Het is de stichtende zin van het diplomaraster, uit
ADR-064:

> "Twelve of them, on a wall, with the gaps showing. **This is the one place in
> the product where something not yet earned is drawn on purpose** — ADR-059
> ruled out a shelf of unearned rewards, and rightly, because those were things a
> child could not aim at. These are twelve named tables in the order they are
> taught, and **every gap is something a child can decide to go and do this
> afternoon**."

Het verschil tussen een plank met onverdiende beloningen (ADR-059, afgewezen) en
een raster met gaten (ADR-064, het ontwerp) is of een kind erop kan mikken. Een
diploma kun je gaan halen. Daarom horen alle rasters bij het kind.

### Wat ADR-158 werkelijk tegenwierp

ADR-158 zweeg op Jij bij een lege kast, want _"**vier** lege wanden met een kop
erboven vertellen een kind op dag één dat het niets heeft"_. Lees die zin
nauwkeurig: het bezwaar gaat over **stapelen**, niet over een onverdiend vakje.
Dat laatste heeft ADR-064 hierboven al besloten, in het voordeel, en het draait
vandaag — de rekenenpagina toont elk kind twaalf niet-behaalde tafeldiplomakaarten,
sinds 8 september. **[aanname]** Dat is een besluit dat is blijven staan, geen
meting: er is nog geen verkeer, en het diagnosescherm van ADR-128 is leeg.

En het bezwaar is kleiner dan het lijkt. **[feit]** `VlagDiplomas.tsx:39`,
`KlokDiplomas.tsx:41` en `TopoDiplomas.tsx:41` doen alle drie
`if (!actief) return null`; alleen `Tafeldiplomas` heeft geen premiumslot. **Een
kind zonder code ziet dus nooit vier rasters, maar altijd precies één van
twaalf.** Het probleem dat ADR-158 beschrijft — vier koppen, vier rasters,
drieëndertig niet-behaalde kaarten in één scroll — bestaat alleen voor een kind
mét code.

Drie ingrepen maken het weg, en geen ervan raakt jouw besluit dat alle
drieëndertig op Jij staan.

**1. Nooit een nul afdrukken.** `kast.stand` verschijnt pas vanaf één gehaald
diploma; tot die tijd staat er de uitnodiging. Hetzelfde per raster: de
meta-telling die `vlag.diplomasCount` vandaag al zet ("0 van de 6") verschijnt pas
vanaf één. Een kop die de afwezigheid uitrekent, is wat "je hebt niets" letterlijk
op het scherm zet.

**2. Eén vak uitgeklapt, de andere drie als regel.** Het vak van je laatste ronde
staat open; de rest staat eronder als drie enkele regels die opengaan als je erop
drukt. **[feit]** Dat is het patroon dat `Prijzenkast.tsx:58-67` al voert
(`prijzenkast.meer` / `.minder`) — geen nieuw idee en geen nieuwe component,
alleen per vak in plaats van in één keer. Zonder ronde in de geschiedenis staat
tafels open: dat is het vak dat gratis is, en het vak dat een Nederlands kind al
wil. **Voor een kind zonder code verandert er hierdoor niets**, want dat heeft er
maar één.

**3. En bewust géén "Begin hier"-kaart.** Dat is de toevoeging die je hier per
reflex doet, en hij moet niet. ADR-064 schreef de volgorde al voor — _"twelve
named tables in the order they are taught"_ — dus tafel 1 staat linksboven en het
raster leest vanzelf als een leerlijn in plaats van als een veld. Een accentkaart
erbovenop zou bovendien botsen met `WeekdoelenBlok` op de voordeur, dat via
`suggesties()` (ADR-153, ADR-162) al vertelt wat je hierna kunt doen. Twee plekken
die allebei "doe dit nu" zeggen, is één te veel.

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

### Eén regel: elke kaart opent het diploma groot

**Elke kaart is een knop, en elke knop doet hetzelfde.** Gehaald of niet, je
krijgt het diploma groot te zien. Eén zin, geen uitzondering:

> "Druk op een diploma om hem te bekijken."

Een eerdere versie van dit ontwerp liet een gehaalde kaart het diploma openen en
een niet-gehaalde een oefenronde starten. Dat waren twee regels waar er één hoort
te zijn, af te leiden uit hoe een kaart eruitziet — en dat is precies het soort
onderscheid dat een kind van zes niet maakt.

#### Wat je in dat grote beeld kunt doen

Eén knop, die van woord verandert en niet van plek. **[feit]** Dat is geen nieuwe
regel maar die van ADR-141, hier hergebruikt op een tweede scherm: _"De knop
verandert van woord en niet van plek. 'Oefenen' wordt 'Doe de toets' zodra
`standVan` het doel rijp noemt."_

| stand van dit diploma | de knop zegt     | wat hij doet                |
| --------------------- | ---------------- | --------------------------- |
| nog niet rijp         | Ga oefenen       | opent die set om te oefenen |
| rijp                  | Doe de toets     | gaat naar Afzwemmen         |
| gehaald               | Print je diploma | `window.print()`            |

Daarnaast staat er altijd "Terug", die het beeld sluit en de kast terugzet waar
hij stond.

Dat lost twee dingen tegelijk op. **[feit]** Een gehaald diploma is vandaag niet
opnieuw te printen: de printknop bestaat alleen op Ronde klaar
(`RondeKlaar.tsx:422-429`), dus wie zijn diploma een week later wil ophangen, kan
dat niet. En het grote diploma bestond in dit ontwerp alleen op het moment van
halen — één keer, en daarna nooit meer. Nu is het de plek waar je je diploma's
bekijkt én waar de regel wordt uitgelegd, kaart voor kaart. Een kind dat op dag
één op een niet-behaalde kaart drukt, valt dus niet in een ronde maar krijgt eerst
het antwoord op "wat is dit dan?".

De directe weg naar oefenen verdwijnt niet: op de **modulepagina** blijft een gat
één druk van een ronde af (`DiplomaRaster.tsx:69-78`, `onKies`), want dát is de
pagina waar je komt om te oefenen. Jij is de pagina waar je komt om te kijken.

#### Waar het staat, technisch

Hetzelfde component op twee plekken: schermvullend over Ronde klaar bij de
uitreiking (§7), en als dialoog over Jij om te kijken. De dialoog is het
bewerkelijke deel en dat staat hier zodat het niet vergeten wordt:
`role="dialog"`, `aria-modal`, focus die naar binnen gaat en bij sluiten terugkeert
naar de kaart waarop gedrukt is, Escape sluit, en de scrollpositie van de kast
blijft staan.

### Zonder code

**[feit]** `doel.ts:93` filtert al op premium, en `VlagDiplomas.tsx:39` tekent een
premiumraster zonder code helemaal niet — geen slot, gewoon afwezig (ADR-124). Dat
blijft. Een kind zonder code ziet **twaalf diploma's, en dat is zijn hele kast**,
niet een kast die voor tweederde op slot zit.

ADR-122 blijft staan, inclusief zijn reden: _"The tafeldiploma, alone of the four
diplomas. It is the one a Dutch child wants before they ever meet this app, and
the moment a parent photographs, which is the only way a product with no
marketing budget travels."_ En de regel die ADR-122 als invariant achterliet — _"a
page never opens on a lock"_ — wordt door deze kast gehaald.

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
schreef: _"De knop opent Jij met de prijzenkast open, ook wat nog te halen is, en
brengt die in beeld."_ Het herstelt een besluit in plaats van er een te nemen.

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
2. **De voortgangsring**, rechtsonder: een cirkel van 88px met `--module` als rand,
   `--module-tint` als vlak en `DiplomaIcon` erin op 40px. Dat is `Embleem` op 88
   in plaats van 56 — **geen nieuwe vorm, dezelfde taal** (`index.css:934-963`).
3. **Denker** ernaast, op `goed-gedaan`. Náást het diploma, niet erop: koraal ligt
   acht graden tint van het rood dat "fout" betekent, en mag nooit de uitslag
   zelf zijn (ADR-159, HUISSTIJL §10).

Verhouding 3:4 staand, op `--kaart` wit. Op 393px is dat 321 breed en 428 hoog,
en dat past onder de schermpadding met de knoppen eronder in beeld.

### Klein — in het raster

Hetzelfde vlak op een kwart. De vormtaal van `Embleem` bepaalt het verschil, niet
de tint:

|            | gehaald               | nog niet                           |
| ---------- | --------------------- | ---------------------------------- |
| rand       | 2px **vol**, `--inkt` | 2px **gestippeld**, `--rand-sterk` |
| band boven | `--module`            | `--balk-leeg`                      |
| naam       | `--inkt`              | `--tekst-tertiair`                 |
| ring       | dicht, `DiplomaIcon`  | ring, deels gevuld                 |
| eronder    | "Gehaald op {datum}"  | "Je onthoudt er 8 van de 10."      |

Gevuld is verdiend, gestippeld is nog niet. **[feit]** Dat is de regel die
`.tk-embleem` (`index.css:947`) al voert en die het torenontwerp overnam voor
zijn stenen: **een vorm, geen tint**, zodat het in grijstinten en bij
kleurenblindheid overeind blijft. Die taal overleeft de toren.

### De voortgangsring — en waarom hij niets nieuws kost

**[feit]** `src/index.css:2337-2346`. `.tk-ring` bestaat al, in gebruik op
Onthouden, en is precies dit mechanisme:

```css
background: conic-gradient(var(--inkt) 0 var(--vul, 0%), var(--balk-leeg) var(--vul, 0%));
```

Een `--vul` op de wortel van de kaart, gezet uit `bewezen / totaal`. De
voortgangsring is dus één bestaande CSS-klasse met een andere maat en `--module`
in plaats van `--inkt`.

**De vulling is nooit de enige drager.** Onder elke ring staat de zin met de
getallen erin, en de rand zegt met een vorm of het diploma gehaald is. HUISSTIJL
§8: nooit kleur als enige drager.

### De afwijking, en waarom

`Embleem` is vandaag altijd een **cirkel** van 56px. Het grote diploma is een
**rechthoek** met dat embleem erop.

**[feit]** Dat is minder een breuk dan het lijkt. ADR-112 zei het zelf al: _"The
travel stamps are badges, and **the diplomas are cards**, both wearing one round
emblem (`Embleem`): closed in the module's colour when earned, a dashed ring when
not."_

Het embleem is het teken; de kaart is de drager. Die twee stonden altijd al zo in
het besluit — alleen was de kaart nooit groot genoeg getekend om als kaart te
lezen. De reden om hem nu wél groot te tekenen is de opdracht zelf: _het moet
voelen als iets dat je krijgt_, en een cirkel van 56px in een rij voelt als een
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

**[feit]** ADR-142 legt het plafond op vierhonderdtwintig milliseconden: _"Alles
wat hier beweegt beweegt omdat er iets gebeurde, en duurt hoogstens
vierhonderdtwintig milliseconden."_ ADR-158 maakte daar precies één uitzondering
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

| t    | wat                                                                                                       | duur | hoe                             |
| ---- | --------------------------------------------------------------------------------------------------------- | ---- | ------------------------------- |
| 0    | Ronde klaar zakt naar 15% dekking; het lege diploma komt in beeld, van schaal 0,94 naar 1                 | 420  | `--beweeg-traag` `--beweeg-uit` |
| 420  | De soort verschijnt: "Tafeldiploma"                                                                       | 180  | opacity                         |
| 600  | De naam verschijnt: "Tafel van 7"                                                                         | 180  | opacity                         |
| 780  | **De voortgangsring wordt gedrukt**: van schaal 1,6 en dekking 0 naar 1. Eén keer `speelMoment('pagina')` | 240  | `--beweeg-veer`                 |
| 1020 | "Gehaald door {naam}" en "op {datum}"                                                                     | 180  | opacity                         |
| 1200 | Denker komt ernaast staan op `goed-gedaan`, één sprongetje                                                | 240  | `--beweeg-veer`                 |
| 1440 | De knoppen worden zichtbaar                                                                               | 180  | opacity                         |

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
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.id)).toEqual(
  draaiboek({ ...basis, rustig: false }).beats.map((b) => b.id),
);
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.geluid)).toEqual(
  draaiboek({ ...basis, rustig: false }).beats.map((b) => b.geluid),
);
```

---

## 8. De zinnen die op het scherm komen

Nederlands op het scherm, Engels in de code.

**De kast, op Jij**

| sleutel      | zin                                                                          |
| ------------ | ---------------------------------------------------------------------------- |
| `kast.titel` | Jouw diploma's                                                               |
| `kast.stand` | {aantal} van de {totaal} gehaald.                                            |
| `kast.leeg`  | Hier komen je diploma's te hangen. Druk op een diploma om eraan te beginnen. |
| `kast.print` | Print je diploma                                                             |
| `kast.sluit` | Terug naar je diploma's                                                      |

**Op een kaart** — `diploma.gehaald`, `diploma.nogNiet` en `diploma.rijp` bestaan al.

| sleutel             | zin                                                                   |
| ------------------- | --------------------------------------------------------------------- |
| `diploma.gehaaldOp` | Gehaald op {datum}                                                    |
| `diploma.onthoudt`  | Je onthoudt er {bewezen} van de {totaal}.                             |
| `diploma.nogNiets`  | Nog niets onthouden. Je moet het drie keer goed weten, op drie dagen. |
| `diploma.opfrissen` | Je diploma is vol. Fris het even op, dan mag je de toets doen.        |

**Het haalmoment** — `afzwemmen.printNaam` en `.printDatum` worden hergebruikt.

| sleutel              | zin      |
| -------------------- | -------- |
| `diploma.gehaaldKop` | Gehaald! |
| `diploma.verder`     | Verder   |

**Het grote diploma, geopend vanuit de kast** (§5)

| sleutel             | zin                       |
| ------------------- | ------------------------- |
| `diploma.openLabel` | Bekijk je diploma: {naam} |
| `diploma.oefen`     | Ga oefenen                |
| `diploma.toets`     | Doe de toets              |
| `diploma.terug`     | Terug                     |

`kast.print` ("Print je diploma") is de derde stand van diezelfde knop.

**Voor ouders**

| sleutel               | zin                                                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ouder.diplomaTitel`  | Hoe een diploma verdiend wordt                                                                                                                                                                                                                      |
| `ouder.diplomaUitleg` | Een onderdeel telt pas mee als uw kind het drie keer goed wist, op drie verschillende dagen, steeds op het moment dat het weer aan de beurt was. Eén keer goed antwoorden telt niet mee — dat is het verschil tussen iets kennen en iets onthouden. |
| `ouder.diplomaTempo`  | Hoe beter uw kind de stof kent, hoe sneller het diploma komt: alles wat onthouden is, blijft meetellen. De ring op een diploma loopt nooit terug.                                                                                                   |

**Herschreven, want ze gaan nog over het album**

| sleutel                                      | nu                                                                                                                                       | wordt                                                                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `afzwemmen.nietRijpUitleg` (`nl.ts:157-158`) | "Een **plaatje krijgt kleur** als je het op verschillende dagen goed weet. Proefzwemmen kan al, maar het diploma krijg je dan nog niet." | "Je diploma kleurt vol als je de onderdelen op verschillende dagen goed weet. Is het vol, dan mag je de toets doen." |
| `afzwemmen.proefUitleg` (`nl.ts:176`)        | "Bij proefzwemmen krijg je nog geen diploma. Dat komt als je **albumpagina** klaar is om af te zwemmen."                                 | vervalt met proefzwemmen (§9)                                                                                        |

---

## 9. Proefzwemmen verdwijnt; de oefentoets blijft

Dit is de enige plek waar dit ontwerp aan de ronde komt, en het is daarom apart
onderbouwd.

**Het zijn twee verschillende dingen.** **[feit]**

|            | proefzwemmen                                             | de oefentoets (`toetsstand`)                                           |
| ---------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| wat        | de diplomatoets afleggen terwijl de set nog niet rijp is | een ronde zonder hulp, zonder verbetering onderweg, met een **cijfer** |
| waar       | `Afzwemmen.tsx:168-211`, `rewardStore.ts:145-156`        | ADR-085, ADR-100; `App.tsx:200`                                        |
| welke sets | alleen sets mét diploma                                  | elke set, ook mixen zonder diploma                                     |
| prijs      | gratis waar het diploma gratis is                        | premium (ADR-122)                                                      |
| icoon      | `DiplomaIcon`                                            | `RoundMark`, met opzet **niet** `DiplomaIcon` (`Icon.tsx:537`)         |
| levert op  | niets                                                    | een cijfer                                                             |

**Proefzwemmen gaat weg.** Het diploma moet echte waarde opleveren, en een toets
die je mag afleggen terwijl vaststaat dat je er niets voor krijgt, is een toets
zonder waarde. Hij bestond omdat een kind anders niet kon voelen hoe de toets is
— en dat argument valt op twee manieren tegelijk weg: de voortgangsring laat nu zien hoe
ver je bent, en de oefentoets doet hetzelfde maar beter.

**De oefentoets blijft, en is daarmee nodiger dan eerst.** **[feit]** ADR-104
zegt dat een diploma altijd draait _"the way the oefentoets runs (ADR-085)"_ —
niets terug tot het eind. De oefentoets is dus letterlijk dezelfde vorm, op elke
set, met een cijfer eraan. Hij vangt op wat proefzwemmen deed, hij werkt op sets
zonder diploma waar een diploma niets kan betekenen, en hij wordt op de
premiumpagina verkocht met _"Jij hoeft niet meer te overhoren"_ (`nl.ts:598`).

**Hij hernoemen kan niet: "oefentoets" ís zijn naam**, sinds ADR-100 hem een
eigen tegel gaf — als laatste van de manieren, met het typen erbij.

Wat verdwijnt: de proef-tak in `rewardStore.ts:145-156`, `afzwemmen.proef`,
`.proefGehaald`, `.proefUitleg`, de tweede knop op `Afzwemmen.tsx:202-210`, en de
weergave op `RondeKlaar.tsx:246-252`. Het scherm Afzwemmen wordt bij "nog niet
rijp" één knop: **Eerst oefenen**.

---

## 10. Wat verdwijnt en wat blijft

### Weg, helemaal

| wat                                                                                                                                                                     | regels      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `src/features/toren/` — op `ReeksBlok.tsx` en `reeks.ts` na                                                                                                             | 1861 → 80   |
| `src/game-core/toren.ts`                                                                                                                                                | 186         |
| `src/game-core/ijkpunten.ts`                                                                                                                                            | 125         |
| `src/store/torenStore.ts`                                                                                                                                               | 116         |
| `features/toren/register.ts` + `RegisterInstelling.tsx`                                                                                                                 | 112         |
| `features/toren/ReeksRegel.tsx` (de prikkel op de voordeur)                                                                                                             | 27          |
| `features/toren/SteenRegel.tsx`, `Toren.tsx`, `TorenPagina.tsx`, `Scene.tsx`, `draaiboek.ts`, `geometrie.ts`                                                            | 824         |
| toetsen: `toren.test.ts` (133), `ijkpunten.test.ts` (121), `draaiboek.test.ts` (137), `geometrie.test.ts` (76), `e2e/toren.spec.ts` (87)                                | 554         |
| CSS: `index.css:4392-4661`, de toren-animaties op `4680-4710`, en `@keyframes tk-steen-aan`, `tk-verdieping-zet`, `tk-wacht-pols`, `tk-denker-sprong`, `tk-mijlpaal-in` | ±300        |
| i18n: `toren.*` (26), `ijkpunt.*` (13), `register.*` (5)                                                                                                                | 44 sleutels |
| dode CSS: `.tk-diploma-seizoenen`, `.tk-diploma-seizoen` (`index.css:4318-4335`)                                                                                        | 18          |
| dode opmerking `nl.ts:181`, en de drie zwevende sectiekopjes `nl.ts:1411-1416`                                                                                          | 7           |

### Blijft, in nieuwe vorm

| wat                                                            | waar het heen gaat                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `ReeksBlok` + `features/toren/reeks.ts` + `game-core/reeks.ts` | naar `features/player/`, alleen op Voor ouders. `reeks.*` (14 sleutels) blijft                                    |
| `Jaaroverzicht`                                                | naar `features/player/`, herbouwd uit diploma's. `jaar.stenen`, `.steenEen`, `.verdiepingen`, `.hoogte` vervallen |
| `TorenUitleg` (`ParentScreen.tsx:347-360`)                     | wordt `DiplomaUitleg`, nieuwe tekst                                                                               |
| `draaiboek.ts` als patroon                                     | het bestand gaat weg; het patroon komt terug als `features/badges/draaiboek.ts`                                   |
| `leesRustig()`                                                 | blijft. De nieuwe scène wordt haar lezer                                                                          |
| de gestippeld-vs-vol-taal                                      | blijft in `.tk-embleem` en gaat naar de diplomakaart                                                              |

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
zijn diploma's staan er nog, en de voortgangsring van het volgende diploma staat meteen
op de juiste hoogte omdat het uit de Leitner-standen komt die er al zijn. Er valt
geen gat — en dat is precies waarom de migratie niets hoeft uit te leggen.

### Twee dingen die pas bij het bouwen bleken

**[feit]** `useDiplomaStand` stond op `onderdelen()`, en die kent maar twee
vlaggensets — de wereld en de provincies. De zes werelddelen worden pas door
`loadVlagSets()` opgebouwd, en die zit alleen in `startbareOnderdelen()`. Voor de
zes vlaggendiploma's gaf `rijp` dus **altijd `false`**: "Klaar om af te zwemmen"
stond daar nooit, hoe goed een kind de vlaggen ook kende. Dat is ouder dan dit
ontwerp en is in PR 1 gerepareerd, met een toets die telt dat het er
drieëndertig zijn.

Hetzelfde mankement zit in elk ander gebruik van `doelwitten(onderdelen(), …)`,
en dus in de weekdoelen van ADR-162: die kunnen geen vlaggendiploma voorstellen.
Dat is niet meegerepareerd — het raakt een andere beslissing — maar het staat nu
opgeschreven en `kast.test.ts` bewaakt het verschil.

**[feit]** De diplomadrempel stond op twee plekken: verstopt in `rijpVoor`
(`doel.ts`) en nog eens uitgeschreven in `Afzwemmen.tsx:82`. Met de kaart erbij
zouden het er drie zijn geweest — precies de tweede boekhouding waar dit hele
ontwerp tegen is. `nodigVoor` is nu één geëxporteerde uitdrukking die `rijpVoor`
zelf gebruikt. Dat is de enige regel in `doel.ts` die verandert, en hij verandert
niets aan de lat: `onthouden === totaal` en `onthouden >= totaal` zijn hetzelfde
zolang `onthouden` nooit boven `totaal` komt.

### Een gat in de dekking

**[feit]** Er is **geen** `src/features/afzwemmen/*.test.ts` en **geen**
`e2e/afzwemmen.spec.ts`. Afzwemmen is alleen indirect gedekt
(`e2e/diplomas.spec.ts:57-59`, `e2e/doel.spec.ts:188`). Dat was te billijken toen
het diploma een bijzaak was; het is het niet meer.

---

## 11. Wat hier zwak aan is

Vijf dingen, opgeschreven omdat ze anders pas na de bouw gevonden worden.

**De ring kan vol staan terwijl de toets niet open is.** De voortgangsring telt
elk onderdeel dat ooit doos 4 haalde; de diplomadrempel telt alleen wat ook
recent genoeg gezien is (`standVan` mét `now`). Na ruim twee weken wegblijven lopen
die uit elkaar, en dan staat er een vierde zin op de kaart die er niet hoorde te
zijn. Het alternatief was een ring die leegloopt, en dat is erger. Maar het is
een extra stand, en de zesjarigentoets is hier het strengst.

**Op dag één is er nog geen kaart gehaald, en de ring staat overal op nul.** §5
haalt het zwaarste eraf — geen nultellingen, één vak open in plaats van vier, en
het grote beeld dat uitlegt wat een diploma is zodra je erop drukt — maar het
blijft waar dat een kind op dag één naar twaalf niet-behaalde kaarten kijkt, en
dat de voortgangsring het pas vanaf de derde oefendag kan dragen omdat er eerder
niets in kan staan. Die twee dagen leunen op één zin: _"Nog niets onthouden. Je
moet het drie keer goed weten, op drie dagen."_ **[hypothese]** Dit blijft het
eerste wat getoetst moet worden bij een kind dat de app voor het eerst opent
(toets 3 in §12).

**Als die toets faalt, is de uitweg klein en staat hij hier alvast.** Geef een
raster weer `stilAlsLeeg` wanneer er niets gehaald én niets in aanbouw is — dan
verschijnt een vak in de kast zodra je het aanraakt. **[feit]** Dat is één boolean
op een prop die er al is (`Tafeldiplomas.tsx:39`, en dezelfde in de andere drie),
geen herontwerp. Het staat hier opgeschreven zodat het later niet opnieuw
bevochten hoeft te worden. Het is niet de standaard, omdat het voor een kind mét
code verbergt dat klokkijken bestaat: de kast is ook het menu van het product, en
een ouder heeft voor vier vakken betaald.

**Het grote beeld kost een druk extra op weg naar oefenen.** Kaart → groot beeld →
"Ga oefenen", waar het eerst kaart → ronde was. Dat is de prijs van één regel in
plaats van twee (§5), en ik denk dat hij het waard is omdat die tussenstap het
antwoord geeft op "wat is dit dan?". Maar het is een aanname, en de directe weg
bestaat nog: op de modulepagina is een gat één druk van een ronde af. Blijkt de
extra druk in de weg te zitten, dan is de kast de verkeerde plek om te beginnen
met oefenen, niet het grote beeld de verkeerde oplossing.

**De dialoog is het bewerkelijkste deel van PR 1.** Focus die naar binnen gaat en
bij sluiten terugkeert naar de kaart waarop gedrukt is, Escape, `aria-modal`, en
een scrollpositie die blijft staan. Dat is standaardwerk, maar het is het soort
standaardwerk dat half af gaat en dan alleen met een toetsenbord opvalt.

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
3. **Zet een kind op dag één voor het raster waarin niets gehaald is** en vraag wat het ziet. Zegt het
   "ik heb niets", dan faalt §5.
4. **Zet rustig aan en haal een diploma.** Alles moet hetzelfde zeggen, zonder
   één beweging, met hetzelfde geluid.
5. **Teken het grote diploma op 393px voordat er een regel CSS bij komt**, met de
   knoppen in beeld.

---

## 13. De fasering

Drie PR's, drie ADR's. De nummers worden **pas vlak voor het committen** van
`origin/main` genomen; vandaag is ADR-166 het hoogste.

**PR 1 — Het diploma wordt het beloningsprogramma.**

- `bewezenVan()`: `countMastered(states, ids)` zonder `now`.
- De voortgangsring op `DiplomaRaster`, met `.tk-ring` als mechaniek en `--vul`.
- De vier standen van een kaart en hun zinnen (§3), en nergens een telling die
  nul is (§5).
- **Het grote diploma als één component**, op twee plekken: schermvullend bij de
  uitreiking, en als dialoog over Jij — met de focusafhandeling uit §11.
- De scène op Ronde klaar, met `draaiboek()` en `leesRustig()`.
- De kast op Jij: alle diploma's, één vak open en de rest ingeklapt, elke kaart
  één knop met één uitkomst.
- **Twee dingen die uit PR 3 naar voren zijn gehaald**, omdat ze anders een gat
  laten vallen: het raster verdwijnt van Voor ouders (anders staat het twee keer)
  en de diepe link van ADR-153 wijst weer naar Jij (anders wijst hij naar een
  pagina waar het raster niet meer staat).
- De toetsen die er niet waren: `afzwemmen`, het draaiboek, de voortgangsring, en
  de dialoog met een toetsenbord.

**Vastgelegd als ADR-167.**

De toren staat er nog gewoon onder. **Dit is de PR die als eerste weg kan zonder
dat er een gat valt** — en tegelijk de PR waarna de toren overbodig is.

**PR 2 — De toren eruit.** Alles uit §10, de reeks en het jaaroverzicht naar Voor
ouders, `TorenUitleg` wordt `DiplomaUitleg`, `SteenRegel` uit de vijf
rondeschermen, de e2e-specs bijgewerkt.

**PR 3 — De opruiming.** Proefzwemmen eruit, de albumzinnen herschreven, de dode
seizoen-CSS, de zwevende i18n-kopjes, en de resterende album-opmerkingen in
`badges/rijp.ts:11`, `retention/StandKaart.tsx:11`, `game-core/terugkomst.ts:6`,
`rewards.ts:9`. De diepe link is in PR 1 al verhuisd.
