# Het beloningsprogramma, opnieuw ontworpen

Datum: 15 september 2026 · Voor: Jeroen Weijs
Basis: `src/game-core/{helden,rewards,klim,streak,dagplan}.ts`,
`src/features/round/*`, `src/features/reis/Kist.tsx`, `src/components/stickerSet.ts`,
`src/index.css` (bewegingslaag), `src/features/diagnose/afhaken.ts`,
`docs/DECISIONS.md` (ADR-096, 097, 098, 099, 112, 116, 128, 130, 134, 137–144).

---

## 0. Drie feiten uit de opdracht die niet kloppen

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

Aanname die ik nergens kan verifiëren en die onder alle getallen hieronder
ligt: **20 seconden per vraag inclusief nakijken, 80% goed, rondes van tien
vragen** (topo vijftien, `ROUND_SIZE`). Dus 27 vragen en 22 goede antwoorden
per tien minuten. Klopt dit niet, dan schuift de hele kadans mee.

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

### Het derde gat: twee tellers die niets uitkeren

Op élk scherm staat "Niveau 34" en "nog 143 goede antwoorden tot niveau 35"
(`SideColumn.tsx`). Sinds ADR-096 deelt een niveau niets uit. Het is de
zichtbaarste onwaarheid in het product: een aftelling naar niets, op elke
pagina, elke dag. De combo-teller is dezelfde fout op een kleiner scherm.

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

Lees dat scherm vóórdat er iets gebouwd wordt.

---

## 2. Ontwerpprincipes

Zeven regels. Elke latere keuze wordt hiermee beslecht.

1. **Wat bestaat, wordt aangekondigd.** Determinisme is pas iets waard als het
   wordt uitgesproken. Elke beloning die vaststaat, is vooraf te zien.
2. **Ceremonie schaalt met zeldzaamheid.** Iets dat 27× per sessie gebeurt mag
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

### 3.1 Per antwoord — 27× per sessie

**Blijft zoals het is.** Geluid (twee tonen omhoog, 90 + 120 ms), uitkomstteken
44px dat landt in 260 ms, maatje 88px dat doorveert bij goed, klimtrede 300 ms.
Dit is het enige niveau dat al af is.

Eén toevoeging, nul beweging: de **sterpips** in de rondebalk, tien puntjes die
vollopen. `goedInSter()` bestaat al. Het kind ziet daarmee voor het eerst dat er
iets kleiners aankomt dan een kist.

_Wat het kind erna wil:_ de volgende vraag.

### 3.2 Drie goed op rij — ~6× per sessie

**Nieuw, uit een teller die er al is.** Bij de derde, zesde en negende
opeenvolgende goede antwoord sluit een ring in de modulekleur om het maatje,
300 ms, en `×3` in de balk wordt het woord "3 op rij". Geen geluid: het
antwoordgeluid klonk 0 ms eerder, en twee geluiden binnen 400 ms lezen als één
rommelig geluid.

Waarom een ring en geen extra ster: de economie blijft onaangeraakt. Tien goed
is een ster, altijd, voor iedereen. Dit is **erkenning, geen valuta**.

_Wat het kind erna wil:_ een vierde goede op rij.

### 3.3 Het stermoment — 2× per sessie

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

### 3.4 Einde ronde — 3× per sessie

Het uitslagscherm blijft in de volgorde die ADR-143 en ADR-126 hebben gezet:
eerst wat er geleerd is, dan pas wat het opleverde. Dat is geen smaak maar de
demping tegen overjustification (§7). Twee toevoegingen:

- **De sterren van deze ronde landen**, met 80 ms ertussen, totaal ~600 ms.
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

Per sessie van tien minuten (27 vragen, 22 goed):

| moment                         | nu       | na       |
| ------------------------------ | -------- | -------- |
| antwoord                       | 27       | 27       |
| 3 op rij                       | 0        | 6        |
| ster                           | 0        | 2        |
| ronde klaar                    | 3        | 3        |
| kist                           | 0,44     | 0,44     |
| **totaal**                     | **30,4** | **38,4** |
| waarvan op het kleinste niveau | 89%      | 70%      |

Het aantal momenten stijgt met een kwart; belangrijker is dat het middengat
dicht is. Er is nooit meer dan ~90 seconden tussen twee gebeurtenissen die
groter zijn dan één antwoord.

### 3.8 Het eerste uur van een nieuw kind, minuut voor minuut

| tijd      | wat er gebeurt                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00      | Naam typen. **Nieuw:** kies je held uit alle twaalf, met hun karakterregel. Nu krijgt een kind de eerste drie en draagt het de eerste, zonder keuze.                                     |
| 0:01      | Eerste ronde. Vraag 1: geluid, teken, maatje. Het kind ziet zijn eigen gekozen held terugkomen.                                                                                          |
| 0:02      | Vraag 4: drie goed op rij, ring om het maatje. Eerste gebeurtenis boven antwoordniveau, binnen anderhalve minuut.                                                                        |
| 0:04      | Ronde klaar, 8 van 10 goed. Balk op 8 van de 10 pips. Regel: _"Nog 2 goede antwoorden tot je eerste ster."_ Geen ster, en dat is eerlijk — maar het is geteld, benoemd en binnen bereik. |
| 0:05      | Ronde 2, vraag 2: **de eerste ster landt, ín de ronde.** ~4 minuten na het begin.                                                                                                        |
| 0:08      | Ronde 2 klaar. _"Nog 32 tot je kist. Erin zitten Willem Wolf, Fem Flamingo en Daan Das."_ Eerste keer dat het kind weet wat er komt.                                                     |
| 0:12      | Ster 2.                                                                                                                                                                                  |
| 0:16      | Ster 3, halverwege de kist. Regel: "Nog 2 sterren."                                                                                                                                      |
| 0:20      | Ster 4.                                                                                                                                                                                  |
| 0:24      | **Ster 5 → de kist.** Drie kaarten komen op, elk zegt wat het doet, het kind kiest. De gekozen held wordt meteen gedragen (bestaat al).                                                  |
| 0:25      | _"De volgende kist: Harm Havik, Minou Marter of Esmee Egel."_ De belofte staat er weer, 50 antwoorden verderop.                                                                          |
| 0:26–0:48 | Sterren 6 t/m 10, kist 2 rond 0:48.                                                                                                                                                      |
| 0:50      | Dagplan leeg of sessie voorbij: dag af, held op 120px, "morgen staan er 14 klaar".                                                                                                       |

Het eerste uur: 2 kisten, 10 sterren, ~35 keer drie-op-rij, 3 helden in bezit.
Onder de huidige lus is dat: 2 kisten, en verder niets.

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
  **Dit vraagt een expliciet besluit van de eigenaar** (§9, vraag 2). Mijn
  motivering: die grens gaat over interfacebeweging — iets waar een kind
  doorheen wil. Dit is geen interface maar een afsluiting, er staat niets te
  lezen, en het gebeurt hoogstens tweemaal per maand.

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

Frequenties bij vijf sessies van tien minuten per week: 135 vragen, 110 goede
antwoorden, 15 rondes, 10 sterren, 2,2 kisten.

| trigger              | wat beweegt                                     | duur    | curve | geluid                         | per week | reduced motion                  |
| -------------------- | ----------------------------------------------- | ------- | ----- | ------------------------------ | -------- | ------------------------------- |
| antwoord nagekeken   | uitkomstteken 44px landt                        | 260 ms  | veer  | ja (bestaand)                  | 135×     | teken staat er, geen beweging   |
| antwoord goed        | maatje veert door en terug                      | 420 ms  | veer  | nee                            | 110×     | plaat verschijnt zonder veer    |
| antwoord goed        | klimtrede komt aan                              | 300 ms  | veer  | nee                            | ~95×     | trede is gevuld                 |
| antwoord goed        | sterpip vult                                    | 120 ms  | uit   | nee                            | 110×     | pip is gevuld                   |
| **3 op rij**         | ring om maatje sluit                            | 300 ms  | uit   | nee                            | ~30×     | ring staat er, woord verschijnt |
| **ster (10 goed)**   | pips lopen vol, sterteken landt                 | 420 ms  | veer  | ja, derde toon op de bestaande | 10×      | ster staat er, regel eronder    |
| ronde klaar          | kistbalk loopt naar nieuwe stand                | 240 ms  | uit   | nee                            | 15×      | balk staat op stand             |
| ronde klaar          | sterren van deze ronde landen, 80 ms uit elkaar | ~600 ms | veer  | nee                            | 15×      | sterren staan er                |
| kist verdiend        | drie kaarten komen op, gestaffeld               | 420 ms  | veer  | nee                            | 2,2×     | kaarten staan er                |
| kist gekozen         | held komt op (`tk-kist-held`, bestaat)          | 420 ms  | veer  | ja                             | 2,2×     | held staat er                   |
| **reeks omhoog**     | materiaalwissel + ring sluit                    | 1200 ms | uit   | ja                             | ~0,7×    | nieuwe plaat + zin              |
| dag af               | held 120px, ring sluit                          | 420 ms  | uit   | nee                            | 5×       | staat er                        |
| week                 | weekgetal telt op                               | 240 ms  | uit   | nee                            | 1×       | getal staat er                  |
| alle twaalf compleet | confetti, één keer ooit                         | 900 ms  | uit   | ja                             | 1× ooit  | statisch beeld + zin            |

Alles binnen de bestaande tokens (`--beweeg-vlot` 120 ms, `--beweeg-rustig`
240 ms, `--beweeg-traag` 420 ms, twee curves), behalve de twee vetgedrukte
uitzonderingen die om een besluit vragen. Alleen `transform` en kleur; niets dat
de doos van een element verandert.

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

**1. "Niveau N" en "nog X tot niveau N+1" uit de zijkolom.** Sinds ADR-096 keert
een niveau niets uit. Het staat op élk scherm en het telt af naar niets. Het
wordt vervangen door de kistregel, die wél iets uitkeert. `levelFor()` is
afgeleid uit een teller; er gaat niets verloren, er wordt niets gewist.

**2. De combo-teller `×N` in de rondebalk.** Hij telt iets echts, hij staat
alleen boven 768 pixels, en hij keert niets uit. Hij wordt de
drie-op-rij-gebeurtenis of hij gaat weg. Als getal blijft hij niet staan.

**3. De premiumgrens om de badges en de streakzin (ADR-116).** Een badge die
verdiend wordt en niet getoond, is hetzelfde probleem als munten en XP, alleen
dan met een prijskaartje eromheen. Premium houdt wat het waard is: het dagplan,
de rapportage, de oefentoets, de herhaalplanning — allemaal dingen die een ouder
koopt. De beloningslus is van het kind.

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

### Wat gratis te toetsen is, vandaag, vóór er iets gebouwd wordt

**H-B (het stermoment).** `afhaken.ts` geeft de vorm van het afhaken: waar in de
ronde het stopt en hoeveel er misging in de laatste drie antwoorden. Twee
uitkomsten, twee conclusies:

- Afhaken in het middenstuk, normaal foutaandeel → verveling → §3.3 bouwen.
- Afhaken met een hoog foutaandeel vlak ervoor → te moeilijk → dit document is
  het verkeerde medicijn en de vraag gaat over rondelengte.

Dit kost nul bouwuren. **Dit is de eerste stap, niet fase 1.**

### Wat alleen met kinderen te toetsen is

Vijf kinderen, 8 tot 11, twintig minuten per kind, hardop denken, twee toestellen
naast elkaar (huidige build en de fase-1-build). Drie vragen na afloop, elk met
een vooraf vastgelegd afkeurcriterium:

1. _"Wat gebeurt er als je er tien goed hebt?"_ — Kan een kind dat na twintig
   minuten niet zeggen, dan is het stermoment niet zichtbaar genoeg.
2. _"Wie zit er in de volgende kist?"_ — Kan een kind dat niet zeggen, dan is de
   aankondiging mislukt, en daarmee de kern van dit hele voorstel.
3. _"Welke held wil je hebben, en waarom?"_ — Een antwoord zonder "waarom"
   betekent dat de karakterregels niet werken (H1 leeft nog).

Eén observatie zonder vraag, en die is het meest waard: **stopt het kind uit
zichzelf vlak ná een kist, of gaat het door?** Doorgaan na de beloning is het
enige gedrag dat laat zien dat de lus draait in plaats van dat hij afrekent.

### Wat ik hier eerlijk over moet zeggen

Vijf kinderen is genoeg voor bruikbaarheid en niet voor smaak. De bekende
vuistregel dat vijf gebruikers het merendeel van de problemen vinden, gaat over
_kunnen bedienen_, niet over _leuk vinden_. Op vraag 3 is n=5 een anekdote.
Op vraag 1 en 2 is het een test.

En: er is geen A/B-test mogelijk zonder server. Een vergelijking vóór en ná op
hetzelfde toestel is besmet door nieuwigheid. Dat is de prijs van geen tracking,
en het is een prijs die dit product bewust betaalt — maar het betekent wel dat
elke uitspraak over effect hier een beredeneerde inschatting blijft en geen
meting.

---

## 9. Aanbeveling en fasering

### Eén aanbeveling

**Bouw de middenschaal en spreek de belofte uit. Laat de tekeningen met rust.**

De klacht "de helden zijn saai" is echt en de oorzaak ligt niet bij de helden.
Het gat zit tussen het antwoord (elke 20 seconden) en de kist (elke 17 minuten),
en het product zwijgt over het enige dat het beter kan dan Brawl Stars en
Duolingo samen: het weet precies wat er komt en het mag het zeggen.

### Fase 1 — binnen een week, en het meeste effect

Eerst het diagnosescherm lezen (§8). Dan, in deze volgorde:

1. **Het stermoment in de ronde** (§3.3) — `goedInSter()` bestaat, de pips zijn
   tien `<span>`s, de derde toon is één regel in `geluid.ts`.
2. **"Nog X tot je kist. Erin zitten A, B en C."** op het uitslagscherm —
   `aanbod()` en `goedTotKist()` bestaan allebei en worden nergens gelezen.
3. **De drie-op-rij-ring**, uit `state.combo` die er al is.
4. **"Niveau N" uit de kolom**, vervangen door de kistregel.

_Afhankelijkheden:_ geen. Alle vier lezen functies die al bestaan en getest zijn.
Geen nieuwe opslag, geen migratie, geen tekening.
_Bouwinspanning:_ grove orde één tot twee dagen plus tests.
_Risico als je hier stopt:_ de kadans is gerepareerd en de anticipatie staat er,
maar de held blijft een portret. De klacht kan terugkomen rond kist 12 — ongeveer
vijfenhalve week — in de vorm "ik heb ze allemaal al". Het antwoord daarop
(de reeksstap, elke anderhalve week) bestaat al maar wordt nog niet gevierd.

### Fase 2 — twee tot drie weken

5. **Zesendertig momentregels en twaalf karakterregels** (§4).
6. **De eerste held kiezen uit alle twaalf**, op minuut nul.
7. **De reeksstap krijgt 1200 ms** (§4, vraag 2 hieronder).
8. **Badges en streakzin uit premium** (§6) — inclusief de eenmalige zin voor
   een kind dat er ineens zes tegelijk ziet (§10).
9. **De dag-af-ceremonie en "morgen staan er 14 klaar"** (§3.5).
10. **De terugkomregel na veertien dagen** (§7).

_Afhankelijkheden:_ een kopijbesluit (36 regels in de stem van twaalf dieren,
Nederlands, voor achtjarigen) en twee expliciete besluiten van de eigenaar: de
420 ms-uitzondering en ADR-116.
_Bouwinspanning:_ grove orde één week bouwen, plus het schrijven.
_Risico als je hier stopt:_ geen. Dit is een af product.

### Fase 3 — alleen op bewijs

11. **Een tweede pose per held** (twaalf tekeningen) voor het stermoment en de
    drie-op-rij.
12. **De galerij** die ADR-112 verborg, terug of weg.

_Afhankelijkheid:_ uitkomst van vraag 3 bij vijf kinderen (§8). Zonder die
uitkomst is dit weken handwerk op een vermoeden.

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

**1. De diagnose leunt op een redenering, niet op data — terwijl de data er
ligt.** Ik beweer dat het middengat de oorzaak is, maar het enige harde bewijs
dat ik kan aanwijzen — de afhaakvorm uit `afhaken.ts` — heb ik niet gezien. Ligt
het afhaken gelijkmatig over de ronde in plaats van vlak vóór het tiende goede
antwoord, dan valt mijn belangrijkste argument voor het stermoment weg en blijft
er esthetiek over. Dat scherm lezen kost nul uur en ik heb het hele document
eromheen gebouwd zonder het.

**2. "Noem de volgende drie helden" kan precies averechts werken.** Ik verkoop
het als anticipatie. Het kan net zo goed lezen als een menu waarvan een kind
weet dat het uiteindelijk alles krijgt — en dan is de spanning eruit in plaats
van erin. Loot boxes werken juist doordat je het níét weet. Ik heb geen enkel
bewijs dat determinisme mét aankondiging even hard trekt als onzekerheid, en het
is exact het punt waarop dit product structureel afwijkt van alles wat bewezen
werkt. Als één ding in dit voorstel omvalt, is het dit.

**3. De heldenidentiteit blijft tekst, en kinderen lezen tekst één keer.**
Zesendertig regels kopij in de stem van twaalf dieren is veel schrijfwerk voor
iets wat een kind van tien na de derde keer wegklikt. Als "saai" over beeld
gaat, lost geen enkele zin het op — en dan is fase 3 eigenlijk fase 1 en heb ik
de volgorde omgedraaid om de goedkope ingreep eerst te kunnen doen. Dat is een
eerlijke afweging, maar het is ook precies het soort redenering waarmee je het
dure antwoord blijft uitstellen.
