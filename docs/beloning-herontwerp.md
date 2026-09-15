# Het beloningsprogramma, opnieuw ontworpen

Datum: 15 september 2026 · Voor: Jeroen Weijs
Basis: `src/game-core/{helden,rewards,klim,streak,dagplan}.ts`,
`src/features/round/*`, `src/features/reis/Kist.tsx`, `src/components/stickerSet.ts`,
`src/index.css` (bewegingslaag), `src/features/diagnose/afhaken.ts`,
`docs/DECISIONS.md` (ADR-096, 097, 098, 099, 112, 116, 128, 130, 134, 137–144).

---

## 0. Vier feiten die de opdracht weerspreken

Ze veranderen het ontwerp, dus ze staan vooraan.

**De helden zijn niet naamloos en het zijn geen willekeurige dieren.** Sinds
ADR-098 heten ze Valerie Vos, Daan Das, Olaf Otter, Harm Havik, Willem Wolf,
Esmee Egel, Bart Bever, Udo Uil, Minou Marter, Fem Flamingo, Richard Ree en Ben
Buizerd — twaalf Nederlandse dieren, alliteratie op de eerste letter, één pose
per held, zestig tekeningen in vijf materialen. "Kat…draak" is de lijst van
vóór ADR-098; die ids leven alleen nog in `Sticker.vroeger` voor de migratie.
Wat ontbreekt is geen naam maar een **rol**: geen van de twaalf doet iets, zegt
iets of is ergens voor.

**Er is al een teller voor "drie goed op rij", en die keert niets uit.**
`useRoundCore.ts` telt `combo`, en alle vier de rondeschermen zetten hem in de
balk als `×3`. Boven de 768 pixels, want op een telefoon paste hij niet
(`Teller.tsx`). Dat is de vierde keer dat dit product iets bouwt dat niemand
leest — na munten, XP en de kist die nergens bereikbaar was.

**De badges en de streakzin zitten achter de betaalmuur** (ADR-116). Een kind
zonder code verdient badges die het nooit ziet, en hoort nooit dat zijn reeks
groeide. Dat is de vijfde keer.

**En een vierde feit, van buiten de code: er is nog geen verkeer.** Het
diagnosescherm van ADR-128 staat er, en er staat niets in. Dat betekent twee
dingen die door dit hele document heen lopen. De klacht "de helden zijn saai"
komt niet uit het veld maar van binnen het project — wat haar niet onwaar
maakt, maar wel iets anders dan gebruikersbewijs. En de falsificatietoets die
ik in §1 voorstel is nu niet uit te voeren. Zie §8.

---

## 0b. De getallen waar dit op rust, en wat de eigenaar besloot

**20 seconden per vraag** inclusief nakijken, **80% goed**, **rondes van tien
vragen** (topo vijftien, `ROUND_SIZE`), en — opgegeven door de eigenaar —
**hoogstens tien minuten per dag, op één apparaat**. Dat is 27 vragen, 22 goede
antwoorden en drie rondes per dag. Klopt die twintig seconden niet, dan schuift
alles hieronder mee.

Dat plafond is geen detail maar de scherpste ontwerpbeperking in dit document:
**een sessie is niet te verlengen.** De ouder bepaalt de lengte, niet het
ontwerp. Elke mechaniek die probeert een kind langer vast te houden is dus
verspilling, en de enige vraag die telt is of het morgen terugkomt. Dat
verschuift gewicht van de lus ín de ronde naar de afsluiting van de dag (§3.5)
en naar de belofte die over meerdere dagen loopt (§3.4) — bij tien minuten per
dag ligt een kist twee à drie dagen weg, en dat maakt hem een terugkomreden in
plaats van een sessiebeloning.

Eén risico dat direct uit "één apparaat" volgt: bij twee kinderen is het vijf
minuten per kind, en dan halveert alles. Eén ster per dag, één kist per vijf
dagen, alle twaalf helden pas na acht weken. Dan is het stermoment niet
belangrijk maar het enige dat er dagelijks nog gebeurt.

Drie vragen stonden open. Ze zijn beantwoord en hieronder verwerkt:

- **De reeksstap mag de 420 ms-grens breken.** Toegestaan (§4, §5).
- **ADR-116 mag sneuvelen waar dat beter werkt.** Dat doet hij: badges en de
  streakzin gaan uit premium (§6).
- **Het diagnosescherm heeft geen data.** Fase 1 gaat dus op redenering de deur
  uit, en dat is verantwoord juist omdát er nog niemand is (§8, §9).

---

## 1. Diagnose

### De rekensom die de klacht verklaart

Zet de gebeurtenissen op een tijdlijn, met de huidige lus:

| schaal         | interval                  | wat er nu gebeurt                                            |
| -------------- | ------------------------- | ------------------------------------------------------------ |
| antwoord       | elke 20 s                 | geluid, teken 44px, maatje 88px, klimtrede                   |
| 3 op rij       | elke ~2 min               | **niets** — een getal in de balk, alleen op een groot scherm |
| ster (10 goed) | elke ~3,5 min             | **niets** — een vijfde van een balk in de zijkolom           |
| ronde klaar    | elke ~3,5 min             | uitslagscherm: tegels, zinnen, soms een kist                 |
| kist (50 goed) | elke ~17 min              | ceremonie, drie kaarten, een held erbij                      |
| reeks omhoog   | elke ~1,5 week na kist 12 | dezelfde 420 ms als elke andere kist                         |

Van de ongeveer dertig beloningsmomenten per tien minuten zitten er
**zevenentwintig op het kleinste niveau en nul in het midden**. Het product
beloont per seconde en per kwartier, en niets daartussen. Dat is precies het
gat waar een kind van tien uit valt: de bevestiging per antwoord is binnen drie
minuten geen gebeurtenis meer, en de kist is nog veertien minuten weg.

### Het tweede gat: het product spreekt zijn eigen voordeel nooit uit

`aanbod()` weet exact welke drie helden de volgende kist voorlegt. Het is puur,
deterministisch, en voor elk kind dezelfde volgorde. Het product vertelt het
nooit. Een kind kan op geen enkel scherm zien wat er komt.

Dat is de dure helft van determinisme zonder de goedkope helft. Een loot box
werkt op _niet weten_; deze kist heeft dat opgegeven — terecht — maar heeft er
niets voor teruggenomen. Het enige dat een deterministische beloning kan wat
een kansbeloning niet kan, is **een belofte doen**. Die belofte wordt niet
gedaan.

### Het derde gat: zes dingen die berekend werden en nergens aankwamen

**Correctie op een eerdere versie van dit stuk.** Daarin stond dat "Niveau 34"
en "nog 143 goede antwoorden tot niveau 35" op élk scherm staan. Dat klopt niet:
ADR-112 heeft "Jouw voortgang" uit de zijkolom gehaald, en sindsdien staat het
niveau nergens. Het is erger dan ik schreef, maar anders.

Wat er feitelijk stond, nagerekend in de code:

| wat                           | staat in               | gelezen door                      |
| ----------------------------- | ---------------------- | --------------------------------- |
| `goedInSter`                  | `game-core/helden.ts`  | niets                             |
| `goedTotKist`                 | `game-core/helden.ts`  | niets                             |
| `kistProgress`                | `game-core/helden.ts`  | niets                             |
| `RoundOutcome.sterren`        | `store/rewardStore.ts` | niets                             |
| `levelProgress`               | `game-core/rewards.ts` | niets                             |
| `correctToNextLevel`          | `game-core/rewards.ts` | niets                             |
| `combo` (`×0`, `×1`, `×2`, …) | vijf rondeschermen     | het kind, en het keerde niets uit |

Zes pure functies en een veld, allemaal getest, allemaal per antwoord of per
ronde uitgerekend, en geen enkel scherm dat ze aanriep. `RoundOutcome.sterren`
werd élke ronde berekend uit twee tellingen over de hele geschiedenis van een
kind, en verdween.

Dat is precies de fout van de munten en de XP (ADR-130), drie keer over. En de
comboteller is de zichtbare variant ervan: een getal dat oploopt, alleen boven
768 pixels, en dat nergens toe leidt.

### Oordeel

**H3 (zichtbaarheid) is dominant, en H2 (kadans) is er de helft van.** H1
(thema) is de zwakste van de drie.

Waarom niet H1: er liggen zestig handgetekende platen in vijf materialen, met
namen, en sinds ADR-142 staat de held 88 pixels groot op de voordeur en in de
terugkoppelkaart. Als het thema de oorzaak was, zou die ingreep iets hebben
gedaan. De klacht kwam er ná. Een skin lost een plaatsingsprobleem niet op.

Waarom niet H2 in zijn gewone vorm: 50 goede antwoorden voor een kist is niet
traag. De eerste kist valt op dag drie, alle twaalf helden in vijfenhalve week,
en dáárna — dit is de best bewaarde eigenschap van het huidige ontwerp — elke
drie kisten een reeksstap, dus ongeveer één keer per anderhalve week, anderhalf
jaar lang. De kadans van de kist klopt. Wat ontbreekt is de **tussenliggende**
kadans: de ster, die er al is en nooit iets zegt.

**Het echte probleem achter "de helden zijn saai": een held die je draagt maar
die nooit iets doet, nooit wordt aangekondigd en nooit iets zegt, is geen
personage maar een portret.** Het kind heeft gelijk. Alleen zit het saaie niet
in de tekening maar in het feit dat de tekening nergens aan meedoet.

### Het enige gebruikersbewijs dat er is, en het spreekt mij half tegen

Na de eerste versie van dit stuk kwam er informatie die er daarvoor niet was.
De kinderen van de eigenaar hebben het gebruikt. Wat zij lieten zien:

- ze vonden **de helden niet leuk**;
- ze gingen er **niet meer of langer door spelen**;
- ze **haken snel af** en hebben **geen interesse**.

Dat is het eerste directe bewijs in dit hele project, en het is scherper dan
alles wat ik hierboven heb beredeneerd. Drie dingen volgen eruit, en ik moet ze
alle drie noemen omdat ze niet alle drie in mijn voordeel zijn.

**H1 is sterker dan ik hem weeg.** "Ze vonden de helden niet leuk" is precies de
helft van mijn eigen afkeurcriterium hieronder. Ik heb de tekeningen in §4 met
rust gelaten en dat op de goedkoopte gebaseerd, niet op bewijs. Dit is bewijs de
andere kant op. Het maakt fase 3 (een tweede pose, en de vraag of twaalf
Nederlandse bosdieren zijn wat een tienjarige cool vindt) urgenter dan waar ik
hem heb gezet.

**"Geen interesse" is geen beloningsprobleem.** Dit is de ongemakkelijkste
regel in dit document. Een kind dat snel afhaakt en geen belangstelling heeft,
wordt niet gered door een ster elke drie en een halve minuut. Er zijn oorzaken
die één niveau hóger liggen dan alles wat hier staat: het is schoolwerk zonder
spel eromheen, terwijl Squla dezelfde vragen in een spelvorm giet; en het is een
app die een ouder installeert, die concurreert met spellen die het kind zelf
koos. Voor geen van beide is dit document het medicijn.

**En toch verandert het fase 1 niet.** Wat fase 1 doet is geen gok op een
hypothese maar het wegwerken van gebreken die op zichzelf staan: een teller die
oploopt en niets uitkeert, een beloning die berekend wordt en nergens aankomt,
een belofte die het product wel kan doen en niet doet. Die horen weg, welke van
de drie hypothesen ook klopt. Wat het bewijs wél verandert is de **verwachting**:
fase 1 haalt gebreken weg, en het is onwaarschijnlijk dat het op zichzelf een
kind terugbrengt dat geen interesse heeft.

### Welk bewijs mij ongelijk zou geven

Concreet en gratis, want het staat al op het apparaat. `afhaken.ts` (ADR-128)
rekent uit waar in een ronde een kind stopt en of het daarvóór foutging.

- **Mijn voorspelling:** afbrekingen clusteren in het middenstuk van een ronde,
  met een normaal foutaandeel in de laatste drie antwoorden. Dat is verveling.
- **Wat mij ongelijk geeft:** een hoog foutaandeel vlak vóór het stoppen. Dan is
  het te moeilijk, niet te saai, en dan is dit hele document het verkeerde
  medicijn — dan gaat het over rondelengte en itemselectie.
- **Wat H1 zou bevestigen:** een kind dat bij observatie na twintig minuten geen
  enkele held bij naam kan noemen én desgevraagd zegt dat het de dieren niet
  leuk vindt, terwijl het wél kan zeggen wanneer de volgende kist komt.

**En dat kan nu niet**, want er is nog geen verkeer: het scherm staat er, het
is leeg, en het blijft leeg tot er gezinnen zijn (§0b). Deze toets is dus niet
afgeschaft maar uitgesteld, en hij is het eerste dat gelezen wordt zodra er vijf
tot tien kinderen regelmatig oefenen. Wat dat betekent voor nu staat in §8.

Met één uitzondering, en die is nu al te doen: de kinderen die het al gebruikt
hebben, kunnen het antwoord op de derde vraag gewoon geven. _"Wat zou je wél een
leuke held vinden?"_ is tien minuten werk en het is op dit moment het enige
bewijs dat er te halen valt.

---

## 2. Ontwerpprincipes

Zeven regels. Elke latere keuze wordt hiermee beslecht.

1. **Wat bestaat, wordt aangekondigd.** Determinisme is pas iets waard als het
   wordt uitgesproken. Elke beloning die vaststaat, is vooraf te zien.
2. **Ceremonie schaalt met zeldzaamheid.** Iets dat 27× per dag gebeurt mag
   260 ms kosten. Iets dat 2× per week gebeurt mag 1200 ms kosten. Alles even
   lang vieren is niets vieren.
3. **Een teller keert uit of gaat weg.** Geen getal op het scherm dat nergens
   toe leidt. Dit product heeft die fout vijf keer gemaakt.
4. **Verlies bestaat alleen waar het echt is: vergeten.** Geen verzonnen
   verlies, geen aftellende klok, geen bezit dat kan afnemen. De vergeetcurve is
   de enige eerlijke vorm van verliesaversie die dit product heeft, en het heeft
   hem al.
5. **De held doet mee of hij is versiering.** Hij verschijnt op het moment dat
   er iets gebeurt, niet als achtergrond.
6. **De betaalgrens loopt nooit door de beloningslus.** Premium verkoopt
   planning en rapportage aan de ouder. Wat een kind verdient, ziet een kind.
7. **Leren wint.** Geen tussenscherm, geen wachttijd, geen beloning die een
   vraag vertraagt. Beweging gebeurt omdat er iets gebeurde.

---

## 3. De lus op vijf tijdschalen

### 3.1 Per antwoord — 27× per dag

**Blijft zoals het is.** Geluid (twee tonen omhoog, 90 + 120 ms), uitkomstteken
44px dat landt in 260 ms, maatje 88px dat doorveert bij goed, klimtrede 300 ms.
Dit is het enige niveau dat al af is.

Eén toevoeging, nul beweging: de **sterpips** in de rondebalk, tien puntjes die
vollopen. `goedInSter()` bestaat al. Het kind ziet daarmee voor het eerst dat er
iets kleiners aankomt dan een kist.

_Wat het kind erna wil:_ de volgende vraag.

### 3.2 Drie goed op rij — ~6× per dag

**Nieuw, uit een teller die er al is.** Bij de derde, zesde en negende
opeenvolgende goede antwoord sluit een ring in de modulekleur om het maatje,
300 ms, en `×3` in de balk wordt het woord "3 op rij". Geen geluid: het
antwoordgeluid klonk 0 ms eerder, en twee geluiden binnen 400 ms lezen als één
rommelig geluid.

Waarom een ring en geen extra ster: de economie blijft onaangeraakt. Tien goed
is een ster, altijd, voor iedereen. Dit is **erkenning, geen valuta**.

_Wat het kind erna wil:_ een vierde goede op rij.

### 3.3 Het stermoment — 2,2× per dag

**Dit is de belangrijkste ingreep van het hele document.** De tiende goede
antwoord is nu een vijfde van een balk in een kolom. Vanaf nu is het een
gebeurtenis, ín de ronde, op het moment dat het tiende antwoord wordt
nagekeken:

- de tien pips lopen vol, de laatste landt (420 ms, veercurve);
- een sterteken verschijnt in de rondebalk;
- het antwoordgeluid krijgt één toon erbij — 660-880 wordt 660-880-1320. Geen
  nieuw geluid, hetzelfde geluid één trede verder;
- één regel: "Ster 3 van 5. Nog 2 tot de kist."

Geen scherm, geen onderbreking, geen wachttijd. De volgende vraag staat er al.

_Wat het kind erna wil:_ de volgende tien.

### 3.4 Einde ronde — 3× per dag

Het uitslagscherm blijft in de volgorde die ADR-143 en ADR-126 hebben gezet:
eerst wat er geleerd is, dan pas wat het opleverde. Dat is geen smaak maar de
demping tegen overjustification (§7). Twee toevoegingen:

- **De volgende kist wordt bij naam genoemd.** Onder de balk: _"Nog 12 goede
  antwoorden tot je kist. Erin zitten Willem Wolf, Fem Flamingo en Daan Das —
  je kiest er één."_ `aanbod()` rekent dat al uit en niemand vraagt het.

Die tweede regel is de anticipatiemotor. Hij is waar, hij is controleerbaar, en
hij is het enige wat een deterministische kist kan doen wat een kansmechaniek
niet kan.

_Wat het kind erna wil:_ die twaalf antwoorden. Nu.

### 3.5 Einde dag — 1× per dag

Het dagplan slinkt al (ADR-139) en een dag kan af zijn. Daar komt bij:

- de held van dit kind op 120px met een ring die sluit, 420 ms;
- **wat morgen klaarstaat**: "Morgen staan er 14 klaar." Leitner weet dat al;
- de streakzin, die **uit premium komt** (§6).

_Wat het kind erna wil:_ morgen.

### 3.6 Week, mijlpaal, lange termijn

- **Wekelijks** (maandag, eerste uitslagscherm): "Deze week 214 goed. Vorige
  week 180." Vergelijking met jezelf, nooit met iemand anders — er is geen
  netwerk en er komt er geen.
- **Kist 12** — alle twaalf helden, 600 goede antwoorden, ~5,5 week. Dit is het
  enige moment waarop ik confetti toesta, één keer ooit (§5).
- **De reeksstap** — brons → zilver → goud → platina → ultra, elke drie kisten
  ná kist 12, dus ongeveer elke anderhalve week, anderhalf jaar lang. Dit is de
  sterkste eigenschap van de bestaande economie en ze krijgt nu dezelfde 420 ms
  als elke andere kist. Ze krijgt 1200 ms (§5).
- **De niveauladder gaat weg** (§6).

### 3.7 De kadans doorgerekend

Per dag van tien minuten — het plafond uit §0b — dus 27 vragen, 22 goede
antwoorden, drie rondes:

| moment                    | nu       | na       |
| ------------------------- | -------- | -------- |
| antwoord                  | 27       | 27       |
| 3 op rij                  | 0        | 6        |
| ster                      | 0        | 2,2      |
| ronde klaar               | 3        | 3        |
| dag af                    | 0,5      | 1        |
| kist                      | 0,44     | 0,44     |
| **totaal per dag**        | **30,9** | **39,6** |
| waarvan op antwoordniveau | 87%      | 68%      |

Het aantal momenten stijgt met ruim een kwart; belangrijker is dat het
middengat dicht is. Er zit nooit meer dan ~90 seconden tussen twee
gebeurtenissen die groter zijn dan één antwoord.

En over langere afstanden, bij tien minuten per dag:

| mijlpaal              | wanneer, bij dagelijks oefenen                 |
| --------------------- | ---------------------------------------------- |
| eerste ster           | dag 1, na ~4 minuten                           |
| eerste kist           | dag 3 (50 goede antwoorden)                    |
| daarna elke kist      | elke 2,3 dagen                                 |
| alle twaalf helden    | dag 27 (600 goede antwoorden), ~4 weken        |
| daarna elke reeksstap | elke 7 dagen (3 kisten = 150 goede antwoorden) |
| alles op ultra        | ~7800 goede antwoorden, ruim een jaar          |

Bij vijf dagen per week in plaats van zeven duurt alles in die tabel ongeveer
anderhalf keer zo lang: de eerste kist op dag 4, alle twaalf helden na
vijfenhalve week, een reeksstap elke tien dagen.

Die voorlaatste regel is het best bewaarde geheim van de bestaande economie:
**na de twaalfde held gaat er wekelijks een held een materiaal omhoog**, meer
dan een jaar lang. Er is geen enkel product in dit vergelijk met een
lange-termijnlus die zo netjes uitkomt, en op dit moment krijgt die stap
dezelfde 420 ms als elke andere kist. Vandaar §4.

### 3.8 Het eerste uur van een nieuw kind

Bij tien minuten per dag is een uur spelen geen uur maar **zes dagen**. Dat is
niet hetzelfde ontwerpprobleem, en het is de reden dat de dagafsluiting in fase
1 zit en niet in fase 2.

**Dag 1, de eerste tien minuten, minuut voor minuut:**

| tijd | wat er gebeurt                                                                                                                                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00 | Naam typen. **Nieuw:** kies je held uit alle twaalf, met hun karakterregel. Nu krijgt een kind de eerste drie toegewezen en draagt het de eerste, zonder ooit gekozen te hebben.       |
| 0:01 | Ronde 1, vraag 1: geluid, teken, maatje. Het kind ziet de held terug die het zelf koos.                                                                                                |
| 0:02 | Vraag 4: drie goed op rij, ring om het maatje. Eerste gebeurtenis boven antwoordniveau, binnen anderhalve minuut.                                                                      |
| 0:04 | Ronde 1 klaar, 8 van 10 goed. Acht van de tien pips vol. Regel: _"Nog 2 goede antwoorden tot je eerste ster."_ Geen ster — en dat is eerlijk, maar het is geteld, benoemd en dichtbij. |
| 0:05 | Ronde 2, vraag 2: **de eerste ster landt, ín de ronde.** Vier minuten na het begin.                                                                                                    |
| 0:08 | Ronde 2 klaar. _"Nog 32 tot je kist. Erin zitten Willem Wolf, Fem Flamingo en Daan Das — je kiest er één."_ Eerste keer dat het kind weet wat er komt.                                 |
| 0:09 | Ronde 3, ster 2.                                                                                                                                                                       |
| 0:10 | Dag af: de held op 120px, de ring sluit, _"Morgen staan er 14 klaar."_ Het laatste wat een kind ziet gaat over morgen.                                                                 |

**Dag 2 tot en met 6, het eerste uur vol:**

| dag   | wat er gebeurt                                                                                                                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dag 2 | Sterren 3 en 4. Aan het eind: _"Nog 6 tot je kist."_ De belofte van gisteren is nu binnen één dag.                                                                                                      |
| dag 3 | Ster 5 → **de eerste kist**, rond minuut 3. Drie kaarten, elk zegt wat hij doet, het kind kiest en draagt de gekozen held meteen. Daarna: _"De volgende kist: Harm Havik, Minou Marter of Esmee Egel."_ |
| dag 4 | Sterren 8 en 9. Niets bijzonders — en dat mag: de streakzin zegt dat dit dag vier is.                                                                                                                   |
| dag 5 | Ster 10, en tegen het eind kist 2. Tweede held.                                                                                                                                                         |
| dag 6 | Sterren 12 en 13. Het eerste uur is vol.                                                                                                                                                                |

Het eerste uur, uitgesmeerd over zes dagen: **2 kisten, 13 sterren, ~36 keer
drie-op-rij, 6 dagafsluitingen, 3 helden in bezit** (de gekozen eerste plus
twee uit kisten). Onder de huidige lus is datzelfde uur: 2 kisten, en verder
niets dat groter is dan één antwoord.

Dat verschil — zesendertig tegenover twee — is de hele diagnose in één getal.

---

## 4. De helden

### Wat ze nu zijn

Twaalf namen, zestig tekeningen, één pose per held, vijf materialen. De naam
begint met de letter van het dier zodat een kind van zeven hem kan onthouden
(ADR-098). De reeks is een laag over dezelfde tekening: het materiaal verandert
en ringen tellen de stappen.

Wat ontbreekt: **een reden om déze te willen.** Twaalf gelijkwaardige portretten
zonder onderling verschil zijn twaalf keer hetzelfde aanbod.

### Wat ze worden: een karakter en drie momenten

Geen krachten, geen modules, geen verschil in opbrengst — dat zou breken wat
ADR-097 en ADR-098 met opzet hebben vastgelegd: twee kinderen die evenveel
oefenen eindigen met evenveel, en geen held hoort bij een vak.

Wél: **elke held krijgt één karakterregel en drie momentregels.**

De karakterregel staat onder de naam bij het kiezen en op de kistkaart. Eén
zin, en hij gaat over hoe deze held leert — want dat is het enige waar dit
product over gaat:

| held         | karakterregel                                            |
| ------------ | -------------------------------------------------------- |
| Udo Uil      | Weet alles al twee keer. Kijkt eerst, zegt dan pas iets. |
| Willem Wolf  | Gaat er hard in en komt er hard uit. Nooit één rondje.   |
| Valerie Vos  | Zoekt de kortste weg. Vindt hem meestal ook.             |
| Esmee Egel   | Rolt op bij een fout en gaat daarna gewoon door.         |
| Bart Bever   | Bouwt liever twee keer goed dan één keer snel.           |
| Fem Flamingo | Blijft op één been staan tot ze het weet.                |
| …            | (twaalf in totaal)                                       |

De momentregels zijn drie korte zinnen per held, gezegd door de held die dit
kind draagt, op de drie momenten die er zijn: **de ster**, **de kist**, **de dag
af**. Twaalf helden × drie momenten = zesendertig regels kopij. Nul nieuwe
tekeningen.

Dat is de goedkoopst mogelijke stap van portret naar personage: het kind hoort
zijn eigen held op het moment dat er iets gebeurt, en het verschil tussen twee
helden wordt hoorbaar in plaats van alleen zichtbaar.

### De evolutie: brons → ultra

Het materiaal verandert al. Wat ontbreekt is dat het **opklimmen voelt als
opklimmen**, en dat is een kwestie van ceremonie, niet van tekeningen:

- de reeksstap krijgt de langste animatie van het product, 1200 ms: de oude
  plaat kruist over naar de nieuwe terwijl een ring dichtloopt en het aantal
  ringen met één toeneemt;
- de zin is de naam van de stap: _"Udo Uil gaat naar goud."_ Die staat er al
  (`kist.gewonnenHoger`), maar hij krijgt nu zijn eigen moment in plaats van een
  regel onder een kaart;
- het is het enige moment in het product dat de 420 ms-grens overschrijdt.
  **Besloten: toegestaan** (§0b). De motivering die daaronder ligt: die grens
  gaat over interfacebeweging — iets waar een kind dóórheen wil. Dit is geen
  interface maar een afsluiting, er staat niets te lezen, de volgende handeling
  wacht niet, en het gebeurt ongeveer één keer per week. Omdat het de enige
  uitzondering is, hoort ze ook als uitzondering in het blad te staan: één
  klasse, één `@keyframes`, met de reden erboven — niet als een vierde token,
  want dan is het geen uitzondering meer maar een maat die overal opduikt.

### Wat er met de zestig tekeningen gebeurt

**Alle zestig blijven. Er wordt niets hertekend, nu niet.**

Redenering: de diagnose zegt dat de tekeningen niet het probleem zijn maar hun
plaatsing en hun stilte. Zestig platen hertekenen kost weken handwerk en zet
alles in op H1 — de hypothese waar ik het minste bewijs voor heb. Eerst de
goedkope ingreep, dan meten.

Als de observatie (§8) uitwijst dat kinderen de tekeningen zélf saai vinden, is
het antwoord niet twaalf nieuwe dieren maar **een tweede pose per held**:
twaalf tekeningen, niet zestig, voor het drie-op-rij-moment en het stermoment.
Dan kan een held reageren in plaats van alleen verschijnen. Grove orde: twaalf
platen tegenover zestig, en de reeksmaterialen blijven ongemoeid omdat de
tweede pose alleen in de reeks van dat moment nodig is.

Afschrijven: niets.

---

## 5. Animatie-inventaris

Frequenties bij **vijf dagen van tien minuten per week** — de voorzichtige
variant van het plafond uit §0b: 135 vragen, 110 goede antwoorden, 15 rondes,
11 sterren, 2,2 kisten. Bij zeven dagen ligt alles ongeveer 40% hoger.

| trigger              | wat beweegt                            | duur    | curve | geluid                         | per week | reduced motion                  |
| -------------------- | -------------------------------------- | ------- | ----- | ------------------------------ | -------- | ------------------------------- |
| antwoord nagekeken   | uitkomstteken 44px landt               | 260 ms  | veer  | ja (bestaand)                  | 135×     | teken staat er, geen beweging   |
| antwoord goed        | maatje veert door en terug             | 420 ms  | veer  | nee                            | 110×     | plaat verschijnt zonder veer    |
| antwoord goed        | klimtrede komt aan                     | 300 ms  | veer  | nee                            | ~95×     | trede is gevuld                 |
| antwoord goed        | sterpip vult                           | 120 ms  | uit   | nee                            | 110×     | pip is gevuld                   |
| **3 op rij**         | ring om maatje sluit                   | 300 ms  | uit   | nee                            | ~30×     | ring staat er, woord verschijnt |
| **ster (10 goed)**   | pips lopen vol, sterteken landt        | 420 ms  | veer  | ja, derde toon op de bestaande | 10×      | ster staat er, regel eronder    |
| ronde klaar          | kistbalk loopt naar nieuwe stand       | 240 ms  | uit   | nee                            | 15×      | balk staat op stand             |
| kist verdiend        | drie kaarten komen op, gestaffeld      | 420 ms  | veer  | nee                            | 2,2×     | kaarten staan er                |
| kist gekozen         | held komt op (`tk-kist-held`, bestaat) | 420 ms  | veer  | ja                             | 2,2×     | held staat er                   |
| **reeks omhoog**     | materiaalwissel + ring sluit           | 1200 ms | uit   | ja                             | ~0,7×    | nieuwe plaat + zin              |
| dag af               | held 120px, ring sluit                 | 420 ms  | uit   | nee                            | 5×       | staat er                        |
| week                 | weekgetal telt op                      | 240 ms  | uit   | nee                            | 1×       | getal staat er                  |
| alle twaalf compleet | confetti, één keer ooit                | 900 ms  | uit   | ja                             | 1× ooit  | statisch beeld + zin            |

Alles binnen de bestaande tokens (`--beweeg-vlot` 120 ms, `--beweeg-rustig`
240 ms, `--beweeg-traag` 420 ms, twee curves), met precies twee uitzonderingen:
de reeksstap op 1200 ms (toegestaan, §0b) en de eenmalige confetti op 900 ms.
Allebei staan ze los in het blad met hun reden erboven, niet als token. Alleen
`transform` en kleur; niets dat de doos van een element verandert.

### Confetti: nee, met één uitzondering

_Tegenargument dat ik serieus neem:_ confetti is het goedkoopste feestsignaal
dat bestaat en elk kind van tien herkent het onmiddellijk. Squla gebruikt het.

_Waarom toch niet:_ confetti zegt "er is iets goeds gebeurd" zonder te zeggen
wát. Dit product heeft de regel dat een beloning zegt wat ze is — een kind dat
vraagt "waarom kreeg ik dat?" krijgt een zin. Confetti is precies de
schouderophaling. En zodra confetti bij de kist hoort, is een kist zonder
confetti een teleurstelling: je kunt hem er niet meer afhalen.

De uitzondering: **één keer, bij de twaalfde held.** Dat is het enige moment in
het hele product dat één keer voorkomt en niets anders betekent dan "af".

### Geluid bij beweging: alleen waar het geluid de gebeurtenis is

Ja bij de ster, de kist en de reeksstap. Nee bij het maatje, de klim, de ring,
de hover, de balk.

Reden: twee geluiden binnen 400 ms zijn geen twee gebeurtenissen maar één
rommelige. Het stermoment valt samen met een antwoord dat al klinkt — daarom
krijgt het geen éigen geluid maar **een derde toon op het bestaande**. Hetzelfde
geluid, één trede hoger. Een kind hoort het verschil zonder dat er iets bij komt.

### Tussenscherm tussen twee vragen: nee

_Tegenargument dat ik serieus neem:_ dit is precies waar Duolingo zijn ceremonie
vandaan haalt. Een scherm tussen twee vragen maakt ruimte voor een reactie, en
zonder ruimte is er geen viering mogelijk.

_Waarom toch niet:_ 135 vragen per week × 800 ms = bijna twee minuten per week
waarin een kind wacht op een animatie. Dat is 5% van de leertijd, en het
onderbreekt het ritme waar Leitner op leunt: herhaling werkt op dichtheid.
"Leren wint van spelen" is hier geen slogan maar een som.

Wat in plaats daarvan: elke ceremonie gebeurt **ín** het scherm dat er al is.
Het stermoment onderbreekt niets — de volgende vraag staat er al terwijl de ster
landt. Dat is het verschil tussen ceremonie en wachttijd.

---

## 6. Wat eruit gaat

**1. De dode tellers uit `game-core`.** `levelProgress`, `correctToNextLevel`
en `kistProgress` worden door geen enkel scherm gelezen en kunnen dat ook niet
zinvol worden: sinds ADR-096 keert een niveau niets uit, en de balk die ADR-099
beloofde staat in een kolom die ADR-112 heeft verborgen. Ze gaan weg, met hun
tests. `levelFor` blijft, want `uitLadder` heeft hem nodig voor de migratie —
dat is een migratie en geen beloning. Er wordt niets gewist dat een kind bezit:
het zijn afgeleiden van één teller.

**2. De combo-teller `×N` in de rondebalk.** Hij telt iets echts, hij staat
alleen boven 768 pixels, en hij keert niets uit. Hij wordt de
drie-op-rij-gebeurtenis of hij gaat weg. Als getal blijft hij niet staan.

**3. De premiumgrens om de badges en de streakzin (ADR-116).** Een badge die
verdiend wordt en niet getoond, is hetzelfde probleem als munten en XP, alleen
dan met een prijskaartje eromheen.

**Besloten: ADR-116 wordt op dit punt herzien** (§0b). De grens komt te liggen
waar hij hoort: premium verkoopt wat een óuder koopt en elke extra manier van
oefenen — het dagplan (ADR-126), Onthouden, de oefentoets, het weekbericht, de
reekspagina, "Goed beantwoord", meerdere kinderen, ontdekken, overleven, de
bliksemronde, de eigen lijsten. Dat is het overgrote deel van ADR-116 en het is
ruim genoeg om te verkopen. Wat eruit gaat zijn de twee dingen die niets anders
doen dan een kind motiveren en die nu verdiend-maar-verborgen zijn: de tien
badges en de streakzin.

Het strategische argument staat los van het ethische en wijst dezelfde kant op:
er is nog geen verkeer (§0b). Er valt dus geen omzet te verliezen, en een
dikkere gratis lus is precies wat de eerste gezinnen binnenhaalt. Dit is het
goedkoopste moment dat er ooit zal zijn om deze grens te verleggen.

**4. De verborgen verzamelpagina (ADR-112).** Ze staat sinds die beslissing
uit "tot het opnieuw doordacht is", en de heldenkiezer op de voordeur doet
inmiddels de helft van haar werk. Ofwel ze komt terug als de galerij waar de
reeksen te zien zijn, ofwel ze gaat weg. Ze blijft niet in het donker staan.

**5. Het maatje bij een fout antwoord.** Het beweegt 420 ms om niets toe te
voegen: de woorden ernaast zeggen al wat er gebeurde. Bij fout staat de held
stil. Dat maakt het doorveren bij goed ook weer iets waard.

---

## 7. Risico's en ethiek

### Waar dit ontwerp aan verslavingsmechaniek raakt

**De regel "nog 12 tot je kist".** Dat is een Zeigarnik-haak en hij werkt juist
omdát hij onaf is. Dempingen: hoogstens één zo'n regel per scherm, nooit op de
voordeur als aftelling, nooit met een klok erbij, en altijd geformuleerd als
werk ("nog 12 goede antwoorden") en niet als tijd ("nog 4 minuten").

**Het stermoment op elke tien.** Een vaste-ratio-beloning is de sterkste vorm
die er is zonder kans. Demping: hij is volstrekt voorspelbaar, hij is
aangekondigd, en hij keert niets uit dat opgespaard of verloren kan worden.

**Wat er níét in zit en er niet in komt:** kans, bijna-winst, aflopende timers,
dagelijkse inlogbeloningen, notificaties, ranglijsten, iets dat afneemt.

### Waar een ouder terecht bezwaar zou maken

_"Mijn kind oefent voor de kist, niet om te leren."_ Het eerlijke antwoord: dat
klopt gedeeltelijk, en het is ook precies waarom de kist 50 goede antwoorden
kost en niets anders. Hij is niet te kopen, niet te versnellen en niet te
gokken. Welke 50 antwoorden het zijn bepaalt Leitner, niet het kind. De enige
weg naar de beloning loopt door de leerstof.

_"Hij zit er de hele avond op."_ Het product heeft geen mechaniek die een lange
sessie beloont boven een korte: geen multiplier, geen dagdoel dat oploopt, geen
combo die valt bij stoppen. Het dagplan is eindig en kan af zijn (ADR-139). Dat
is zeldzaam en het is een verkoopargument.

### Overjustification

Het echte risico. De literatuur is scherp genoeg om naar te handelen: verwachte,
tastbare, taakgebonden beloningen ondermijnen intrinsieke motivatie; onverwachte
en informatieve terugkoppeling doet dat niet.

Dit ontwerp voegt verwachte, tastbare beloningen toe. Drie dempingen, en ze zijn
alle drie ontwerpbeslissingen en geen slotalinea:

1. **De informatie gaat altijd vóór het token.** Het uitslagscherm zegt eerst
   wat er geleerd is ("je onthoudt er nu 4 meer", "11% weet je hier over drie
   weken nog van") en pas daarna wat het opleverde. Die volgorde staat er al en
   is nu een principe.
2. **Geen beloning hangt aan tempo of volume.** De klim hangt aan de
   Leitner-doos, dus aan wat je werkelijk onthoudt. Twintig makkelijke rondjes
   herhalen levert minder op dan tien moeilijke — het omgekeerde van XP.
3. **Het product zegt nooit "goed gedaan".** Dat staat in `RondeKlaar`:
   de pagina zegt wat er gebeurde, en wat het kind ervan vindt is van het kind.
   Die regel geldt ook voor de zesendertig momentregels van de helden: ze
   beschrijven, ze prijzen niet.

### Het kind dat achterloopt

Niets in dit ontwerp vergelijkt kinderen. De kist staat op een vaste telling,
dus een kind dat half zo snel gaat krijgt dezelfde kist, later. Het enige echte
risico is dat een kind dat vijf minuten per week oefent er drie weken over doet
— en dat is precies waarom het stermoment moet bestaan: op tien goede antwoorden
zit iedereen binnen één sessie.

### Het kind dat drie weken niets doet

Er gaat niets verloren. `kistenTeGoed` is een aftrekking en geen gebeurtenis:
de kisten staan er nog. De streak heeft rustdagen en vakantieregels
(`streak.ts`). Wat het kind wél tegenkomt is een ingestorte vergeetvoorspelling.

Eén nieuwe regel: **na meer dan veertien dagen afwezigheid opent het product met
wat er nog stáát, niet met wat weg is.** "Je weet er nog 42 van de 60" in plaats
van "je bent er 18 vergeten". Dezelfde waarheid, en alleen de tweede versie
zorgt dat een kind de app weer dichtdoet.

---

## 8. Meetbaarheid zonder tracking

Er is geen analytics en er komt er geen. Er is wel `afhaken.ts` en
`DiagnoseScherm.tsx` (ADR-128): een rekeninstrument op het apparaat zelf, over
data die er al staat.

Alleen: **er staat nog niets in, want er is nog geen verkeer.** Dat is het
belangrijkste dat er over dit hoofdstuk te zeggen valt, en het verandert de
volgorde van alles.

### Wat dat betekent voor nu

Fase 1 gaat **op redenering** de deur uit, niet op meting. Dat is geen
concessie maar de juiste volgorde, om een reden die over een halfjaar niet meer
geldt: met nul gebruikers kost een verkeerde gok niemand iets. Geen kind raakt
geïrriteerd, geen ouder zegt op, geen gewoonte wordt verstoord. Het enige dat
op het spel staat zijn één tot twee dagen werk aan vier ingrepen die allemaal
functies lezen die al bestaan en al getest zijn.

Dat is ook het omgekeerde van de fout die dit product eerder maakte. Munten, XP
en de verborgen kist gingen niet mis omdat ze ongemeten waren, maar omdat ze
nooit op een scherm kwamen. Fase 1 is per ingreep gebonden aan een scherm en een
frequentie (§3). Dat is de controle die hier beschikbaar is.

Wat er wél volgt uit "geen verkeer": **bouw niets in fase 1 dat later moeilijk
terug te draaien is.** Alle vier de ingrepen zijn beeld en tekst over bestaande
gegevens. Geen nieuwe opslag, geen migratie, geen wijziging in de economie.
Ongelijk krijgen kost dan een commit, geen ADR.

### De toets die klaarligt, voor het moment dat er wél kinderen zijn

Zodra vijf tot tien kinderen regelmatig oefenen, is dit het eerste dat gelezen
wordt — en het is gratis, want het rekent over data die er dan al staat:

**H-B (het stermoment).** `afhaken.ts` geeft de vorm van het afhaken: waar in de
ronde het stopt en hoeveel er misging in de laatste drie antwoorden.

- Afhaken in het middenstuk, normaal foutaandeel → verveling → de diagnose van
  §1 klopt.
- Afhaken met een hoog foutaandeel vlak ervoor → te moeilijk → dit document is
  het verkeerde medicijn en de vraag gaat over rondelengte en itemselectie.

**Leg de voorspelling nu vast, niet achteraf.** Anders is elke uitkomst
verenigbaar met wat ik hierboven heb geschreven, en dan heeft de meting niets
gedaan. Mijn voorspelling staat in §1 en is daarmee vastgelegd.

**Wat er níét bij hoort:** het diagnosescherm mag geen aanleiding worden om
alsnog iets over een kind te versturen. Het rekent op het apparaat, voor wie dat
apparaat vasthoudt, en dat is de hele reden dat het mag bestaan.

### Wat alleen met kinderen te toetsen is, en dat kan wél nu

Vijf kinderen, 8 tot 11, twintig minuten per kind, hardop denken, twee
toestellen naast elkaar (huidige build en de fase-1-build). Dit is op dit moment
het **enige** instrument dat er is, en dus geen fase-3-controle maar iets dat
tussen fase 1 en fase 2 hoort.

Drie vragen na afloop, elk met een vooraf vastgelegd afkeurcriterium:

1. _"Wat gebeurt er als je er tien goed hebt?"_ — Kan een kind dat na twintig
   minuten niet zeggen, dan is het stermoment niet zichtbaar genoeg.
2. _"Wie zit er in de volgende kist?"_ — Kan een kind dat niet zeggen, dan is de
   aankondiging mislukt, en daarmee de kern van dit hele voorstel.
3. _"Welke held wil je hebben, en waarom?"_ — Een antwoord zonder "waarom"
   betekent dat H1 nog leeft en dat fase 3 naar voren moet.

Eén observatie zonder vraag, en die is het meest waard: **stopt het kind uit
zichzelf vlak ná een kist, of gaat het door?** Doorgaan na de beloning is het
enige gedrag dat laat zien dat de lus draait in plaats van dat hij afrekent.

Bij een plafond van tien minuten per dag hoort er een vierde observatie bij, en
die kost een week in plaats van een middag: **komt het kind op dag twee terug
zonder dat een volwassene erom vraagt?** Dat is de enige uitkomst die er bij dit
plafond werkelijk toe doet, en geen enkele sessie van twintig minuten meet hem.

### Wat ik hier eerlijk over moet zeggen

Vijf kinderen is genoeg voor bruikbaarheid en niet voor smaak. De bekende
vuistregel dat vijf gebruikers het merendeel van de problemen vinden, gaat over
_kunnen bedienen_, niet over _leuk vinden_. Op vraag 3 is n=5 een anekdote. Op
vraag 1 en 2 is het een test, want daar is het antwoord goed of fout.

En: er is geen A/B-test mogelijk zonder server. Een vergelijking vóór en ná op
hetzelfde toestel is besmet door nieuwigheid. Dat is de prijs van geen tracking,
en het is een prijs die dit product bewust betaalt — maar het betekent wel dat
elke uitspraak over effect hier een beredeneerde inschatting blijft en geen
meting. Dat geldt ook voor dit document.

---

## 9. Aanbeveling en fasering

### Eén aanbeveling

**Bouw de middenschaal, maak van de dagafsluiting een terugkomreden, en laat de
tekeningen met rust.**

De klacht "de helden zijn saai" is echt en de oorzaak ligt niet bij de helden.
Het gat zit tussen het antwoord (elke 20 seconden) en de kist (elke 2,3 dagen),
en het product zwijgt over het enige dat het beter kan dan Brawl Stars en
Duolingo samen: het weet precies wat er komt en het mag het zeggen.

Het plafond van tien minuten per dag (§0b) scherpt dat aan. Een sessie is niet
te verlengen, dus alles wat een kind langer zou moeten vasthouden is
verspilling. Wat overblijft is: vaker iets laten gebeuren bínnen die tien
minuten, en ervoor zorgen dat het laatste wat een kind ziet over morgen gaat.

### Fase 1 — binnen een week, en het meeste effect

Er is geen meting om op te wachten (§8), dus dit gaat nu de deur uit. In deze
volgorde, want zo loopt hij van dagelijks naar zeldzaam:

1. **Het stermoment in de ronde** (§3.3) — `goedInSter()` bestaat, de pips zijn
   tien `<span>`s, de derde toon is één regel in `geluid.ts`. Vuurt 2,2× per
   dag: de enige beloning die élke dag valt.
2. **De dagafsluiting met "morgen staan er 14 klaar"** (§3.5) — plus de
   streakzin, die hiervoor uit premium moet (punt 5). Bij dit plafond is dit de
   enige groeias die er is, en daarom staat het niet meer in fase 2.
3. **"Nog X tot je kist. Erin zitten A, B en C."** op het uitslagscherm —
   `aanbod()` en `goedTotKist()` bestaan allebei en worden nergens gelezen. Bij
   tien minuten per dag overspant die belofte twee à drie dagen, wat haar
   sterker maakt, niet zwakker.
4. **De drie-op-rij-ring**, uit `state.combo` die er al is.
5. **"Niveau N" uit de kolom** (§6), vervangen door de kistregel — en **badges
   en streakzin uit premium** (§6), want punt 2 hangt daaraan.

_Afhankelijkheden:_ geen, op één na — punt 5 raakt `premium.ts` en ADR-116, en
dat is een besloten maar zichtbare wijziging. Verder leest alles functies die al
bestaan en getest zijn. Geen nieuwe opslag, geen migratie, geen tekening, niets
dat later moeilijk terug te draaien is.
_Bouwinspanning:_ grove orde twee tot drie dagen plus tests.
_Risico als je hier stopt:_ de kadans is gerepareerd, de belofte staat er en de
dag eindigt op morgen — maar de held blijft een portret. De klacht kan terugkomen
rond kist 12, bij dit plafond ongeveer **dag 27**, in de vorm "ik heb ze
allemaal al". Het antwoord daarop (de wekelijkse reeksstap) bestaat al maar
wordt dan nog niet gevierd.

### Fase 2 — twee tot drie weken

6. **Zesendertig momentregels en twaalf karakterregels** (§4).
7. **De eerste held kiezen uit alle twaalf**, op minuut nul.
8. **De reeksstap krijgt 1200 ms** (§4) — bij dit plafond is dat een wekelijkse
   gebeurtenis en daarmee de belangrijkste beloning van de lange termijn.
9. **De terugkomregel na veertien dagen** (§7).

_Afhankelijkheden:_ een kopijbesluit — 36 regels in de stem van twaalf dieren,
Nederlands, voor achtjarigen — en bij voorkeur de observatie uit §8, want die
zegt of fase 3 naar voren moet.
_Bouwinspanning:_ grove orde één week bouwen, plus het schrijven.
_Risico als je hier stopt:_ geen. Dit is een af product.

### Fase 3 — alleen op bewijs, of eerder als de observatie daarom vraagt

10. **Een tweede pose per held** (twaalf tekeningen) voor het stermoment en de
    drie-op-rij.
11. **De galerij** die ADR-112 verborg, terug of weg.

_Afhankelijkheid:_ vraag 3 bij vijf kinderen (§8). Komt daar uit dat de
tekeningen zélf het probleem zijn, dan wisselt dit met fase 2 — dan zijn woorden
het verkeerde gereedschap en is er geen reden om er eerst zesendertig te
schrijven.

---

## 10. Migratie

Niemand raakt iets kwijt. Per bezitting:

| wat een kind heeft                            | wat ermee gebeurt                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| helden, reeksen, dubbelen (`helden:<kindId>`) | onaangeraakt. `HeldenStand` verandert niet van vorm.                                                                                                                    |
| sterren                                       | worden afgeleid uit de teller (`sterrenVoor`). Een ster wordt een _gebeurtenis_, geen bezit: het aantal verandert niet, alleen of het wordt aangekondigd.               |
| openstaande kisten                            | `kistenTeGoed` is een aftrekking, geen gebeurtenis. Drie kisten tegoed blijven drie kisten tegoed.                                                                      |
| niveau                                        | afgeleid uit dezelfde teller (`levelFor`). Er wordt niets gewist; alleen de regel in de kolom verdwijnt. Wie het getal wil terugzien: het is één functie op één teller. |
| badges                                        | bestaan al, verdiend en verborgen. Ze worden zichtbaar.                                                                                                                 |
| streak, rustdagen                             | onaangeraakt.                                                                                                                                                           |
| gekozen held (`avatarConfig.sticker`)         | onaangeraakt, inclusief de ids van vóór ADR-098 via `Sticker.vroeger`.                                                                                                  |

Twee details die misgaan als je er niet op let:

**Het stermoment mag niet met terugwerkende kracht vuren.** Het moet hangen aan
een overgang binnen een lopende ronde (`goedInSter` die van 9 naar 0 gaat), nooit
aan het laden van een stand. Anders krijgt elk kind bij de eerstvolgende start
een ster die het vier weken geleden verdiende.

**Badges die uit premium komen, arriveren niet als nieuw.** Een kind dat er zes
tegelijk ziet verschijnen, moet één zin krijgen: _"Deze had je al."_ Zes
gelijktijdige vieringen voor werk van vorige maand is een leugen over wanneer
er iets gebeurde, en het holt de zevende uit.

---

## 11. Wat er gebouwd is

Fase 1 staat. Wat er feitelijk in de code veranderd is, en waar het afwijkt van
wat hierboven staat:

| ingreep                                                                                                   | waar                                                                              | frequentie   |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------ |
| **Het stermoment** — tien treden die vollopen, de ster die landt, en een derde toon op het antwoordgeluid | `features/round/ster.ts`, `Ster.tsx`, in alle vijf de rondeschermen naast de klim | 2,2× per dag |
| **Drie op rij** — een ring in de modulekleur om het maatje, en een teller die pas vanaf drie iets zegt    | `features/round/dreef.ts`, `Maatje.tsx`                                           | ~6× per dag  |
| **Het kistvooruitzicht** — vijf sterren, hoeveel antwoorden de kist nog is, en wie erin zit, bij naam     | `features/reis/Kist.tsx`                                                          | 3× per dag   |
| **De dag die af is** — de held op 120px, en wat er morgen klaarstaat                                      | `features/home/VandaagVerder.tsx`, `useVandaag.ts`                                | 1× per dag   |
| **Badges en streak uit premium**                                                                          | `badges/Badges.tsx`, `home/ReeksBlok.tsx`, `round/RondeKlaar.tsx`                 | —            |
| **Dode tellers weg** — `levelProgress`, `correctToNextLevel`, `kistProgress`, `RoundOutcome.sterren`      | `game-core/rewards.ts`, `helden.ts`, `store/rewardStore.ts`                       | —            |

### Drie afwijkingen van dit document, met reden

**De sterrij staat niet in de rondebalk maar in de terugkoppelkaart.** In §3.1
schreef ik "sterpips in de rondebalk". In de balk staan al tien stippen — de
tien vragen van deze ronde — en twee rijen van tien die verschillende dingen
tellen, is voor een kind van tien geen voortgang maar een raadsel. De
terugkoppelkaart is bovendien waar het gebeurt: daar klinkt het geluid, landt
het teken en komt het maatje binnen, dus het is één gebeurtenis en geen vier.

**"De sterren van deze ronde landen" op het uitslagscherm is er niet.** §3.4
vroeg erom. Maar de ster landt nu ín de ronde, op het moment dat hij verdiend
wordt; hem twee minuten later nog eens vieren is hetzelfde twee keer zeggen, en
bij tien minuten per dag is dat leertijd. Wat er wél staat is het
vooruitzicht — dat zegt iets nieuws.

**De streak is ruimer vrijgegeven dan §6 beschreef.** Daar stond "de streakzin".
Het getal en de week in de zijkolom zijn het ook geworden, want anders zou
hetzelfde feit op het ene scherm gratis zijn en op het andere niet. Wat premium
blijft is de reekspagina: de kalender, de zes getallen en het bijhouden week na
week. De premiumteksten zijn daarop aangepast, en badges en reeks staan nu in
"Wat gratis blijft".

### Wat nog niet gebouwd is

Alles van fase 2 en 3: de karakterregels en de momentregels, de eerste held
kiezen uit alle twaalf, de reeksstap op 1200 ms, de terugkomregel na veertien
dagen, en de tweede pose. En, gezien het bewijs in §1: de vraag of twaalf
Nederlandse bosdieren zijn wat een tienjarige wil hebben, staat nu vóór dat
rijtje in plaats van erachter.

---

## Bijlage — Brawl Stars en Duolingo op mechaniekniveau

### Brawl Stars

| moment         | gebeurtenis                                                       | duur    | frequentie          |
| -------------- | ----------------------------------------------------------------- | ------- | ------------------- |
| per raak schot | trefferteken, schermschud, geluid, superbalk vult                 | ~100 ms | elke 1-2 s          |
| super vol      | balk gloeit, stemregel "Super!"                                   | ~500 ms | elke ~20 s          |
| uitschakeling  | kill-teken, geluid, trofeeteller in beeld                         | ~700 ms | elke ~40 s          |
| einde match    | trofeeën erbij of eraf, trofeeweg schuift                         | ~4 s    | elke ~3 min         |
| trofeemijlpaal | kist of beloning op de trofeeweg, aangekondigd vóórdat je er bent | ~6 s    | elke ~5 matches     |
| einde dag/week | dagelijkse opdrachten, seizoenspas, seizoensreset                 | 10-30 s | dagelijks/wekelijks |

**Waarom het werkt:** progressiezichtbaarheid (de superbalk vult zichtbaar bij
elke actie), anticipatie (de trofeeweg toont de volgende drie beloningen vóóraf
en volledig deterministisch), verliesaversie (verlies kost trofeeën),
identiteit (skins, pins, spelersicoon), sociale vergelijking (clubs,
ranglijsten), ceremonie (het openen van een kist is vier tot zes seconden puur
theater met gelaagd geluid), variabele beloning (wat erin zit is kans),
bijna-winst (de zeldzaamheidsopbouw tijdens het openen is letterlijk een
gefabriceerde "bijna").

### Duolingo

| moment       | gebeurtenis                                                                    | duur    | frequentie         |
| ------------ | ------------------------------------------------------------------------------ | ------- | ------------------ |
| per antwoord | groen/rood vlak, toon, balk vult                                               | ~200 ms | elke 5-10 s        |
| combo        | "Onstuitbaar!" met XP-bonus                                                    | ~800 ms | elke ~5 antwoorden |
| einde les    | XP telt op, kist, dagopdracht, streak, league — 3 tot 5 opeenvolgende schermen | 8-15 s  | elke ~4 min        |
| einde dag    | vlam-animatie, streak verlengd                                                 | ~2 s    | dagelijks          |
| week         | leaguepromotie of -degradatie                                                  | ~5 s    | wekelijks          |
| mijlpaal     | kroonniveaus, sectie af                                                        | ~10 s   | maandelijks        |

**Waarom het werkt:** verliesaversie via de streak (het sterkste en het meest
bekritiseerde mechanisme in de app), ceremonie via _opeenvolging_ in plaats van
lengte, progressiezichtbaarheid (het pad toont de komende knopen), sociale
vergelijking (leagues met degradatie), variabele beloning (kisten, XP-boosts),
anticipatie (het pad).

### De drie bakken

**Overneembaar, binnen de kaders:**

- Het zichtbare pad vooruit (trofeeweg / Duolingo-pad) → §3.4, de kist bij naam.
- Ceremonie geschaald naar zeldzaamheid → §5, drie duren.
- Erkenning bij de reeks binnen een ronde → §3.2.
- Een balk die vult naar wat werkelijk iets uitkeert → bestaat al (ADR-099).

**Aanpasbaar — het principe werkt, de uitvoering moet anders:**

- _Variabele beloning_ → vervang de variantie door **keuze**. De spanning van
  "wat zit erin" wordt "welke neem ik". Dat staat er al (drie kaarten); wat
  ontbreekt is dat het kind ze vóór de kist kent, zodat er iets te willen valt.
- _Verliesaversie_ → richt hem op het enige echte verlies: vergeten. De
  drieweeksvoorspelling is verliesaversie op de werkelijkheid, en die staat er
  al. Nooit verzonnen verlies erbovenop.
- _Sociale vergelijking_ → vervang door vergelijking met jezelf in de tijd
  (§3.6, de weekregel). Geen netwerk nodig, geen kind dat wordt ingehaald.
- _Bijna-winst_ → alleen als hij waar is. "Nog 2 tot je eerste ster" ná een
  ronde van 8 goed is geen gefabriceerde bijna maar een mededeling.
- _Dagopdrachten_ → het dagplan is er al en heeft één ding meer dan Duolingo:
  het kan **af** zijn.

**Verboden, en waarom hard:**

- **Loot boxes en kansmechaniek.** De Kansspelautoriteit heeft in 2018 al
  vastgesteld dat bepaalde loot boxes onder de Wet op de kansspelen vallen;
  bij een doelgroep van tien jaar is dat niet eens de belangrijkste reden. De
  belangrijkste is dat de repository publiek is: een kansmechanisme is net zo
  controleerbaar als een tracker, en net zo onverdedigbaar tegenover een ouder.
- **Gefabriceerde bijna-winst** (de zeldzaamheidsopbouw). Het is de meest
  gokachtige animatie in kinderspellen en ze is met opzet misleidend.
- **Aflopende timers en tijdelijke evenementen.** Ze maken van oefenen een
  verplichting en straffen een kind wiens ouder over schermtijd gaat.
- **Streak-chantage en notificaties.** Geen server, geen account — technisch
  onmogelijk, en dat is maar goed ook.
- **Ranglijsten, leagues, "je vriend heeft je ingehaald".** Geen netwerk, en een
  klassenranglijst vernedert precies het kind dat het meeste oefenen nodig heeft.
- **Pay-to-progress.** En dat betekent ook: de betaalgrens weg bij badges en
  streak (§6). Dit is de enige plek waar dit product nu aan de verkeerde kant
  van zijn eigen regel staat.

### Waar deze producten slechter zijn dan leer.nu

**Brawl Stars straft verlies.** Een verloren match kost trofeeën. Dat werkt —
verliesaversie is sterker dan winstverlangen — en het is gif voor leren: een
kind dat bang is iets te verliezen vermijdt moeilijke items, en spaced
repetition leeft juist van het proberen van wat je bijna vergeten bent. ADR-048
maakt het niet weten overal goedkoop. Dat is pedagogisch beter én zeldzaam.

**Duolingo beloont volume boven beheersing.** XP komt uit het aantal lessen, dus
tien makkelijke lessen herhalen levert meer op dan één moeilijke worstelen. Het
resultaat is een app waarin je een streak van achthonderd dagen kunt hebben
zonder veel te kennen. leer.nu hangt zijn klim aan de Leitner-doos en zegt
hardop wat je over drie weken nog weet. Dat is de eerlijkste zin in alle drie de
producten, en hij staat alleen hier.

**Allebei laten ze de ceremonie de leertijd opeten.** Een Duolingo-les van vier
minuten eindigt in tien tot vijftien seconden schermen. Dat is het enige punt
waarop "leren wint van spelen" geen vroom voornemen is maar een getal.

---

## Slot — de drie zwakste plekken in dit voorstel

**1. Er is geen enkel empirisch anker, en dat is nu een feit en niet langer een
verzuim.** In de eerste versie van dit stuk was mijn zwakste plek dat ik het
diagnosescherm niet had gelezen. Dat scherm is leeg en blijft leeg tot er
gezinnen zijn. Dus rust dit hele document op één redenering — de kadanstabel in
§1 — en op mijn oordeel over wat een kind van tien voelt. Ik heb dat oordeel
niet. Het klopt dat de kosten van ongelijk krijgen nu laag zijn (§8), maar
"goedkoop fout" is iets anders dan "waarschijnlijk goed", en ik heb in §9 de
neiging om dat door elkaar te laten lopen.

**2. "Noem de volgende drie helden" kan precies averechts werken.** Ik verkoop
het als anticipatie. Het kan net zo goed lezen als een menu waarvan een kind
weet dat het uiteindelijk alles krijgt — en dan is de spanning eruit in plaats
van erin. Loot boxes werken juist doordat je het níét weet. Ik heb geen enkel
bewijs dat determinisme mét aankondiging even hard trekt als onzekerheid, en het
is exact het punt waarop dit product structureel afwijkt van alles wat bewezen
werkt. Als één ding in dit voorstel omvalt, is het dit — en punt 1 betekent dat
ik het pas merk als er kinderen zijn.

**3. Ik heb het plafond van tien minuten laat in het ontwerp gekregen en niet
overal doorgetrokken.** §3 en §9 zijn herrekend, maar het hele middenstuk —
zesendertig momentregels, twaalf karakterregels, een tweede pose — is bedacht
toen ik nog aannam dat een sessie kon uitlopen. Bij tien minuten per dag zijn
dat negen minuten oefenen en één minuut ceremonie, en de vraag of zesendertig
regels kopij dan hun schrijftijd waard zijn, heb ik niet opnieuw gesteld. Mijn
vermoeden is dat fase 2 bij dit plafond kleiner hoort te zijn dan ik hem heb
opgeschreven, en dat ik dat niet heb doorgezet omdat het stuk toen al stond.
