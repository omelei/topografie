# De toren — het beloningsprogramma van leer.nu

**Status:** ontwerp. **Datum:** 2026-09-19. Op verzoek van de eigenaar.
Vervangt het album (ADR-149). Vastgelegd als ADR-1nn.

Dit document beschrijft één beloningssysteem, van de regel tot de tekst op het
scherm. Het is geschreven om te bouwen, niet om te overtuigen: wat hier staat is
besloten, en waarom het besloten is staat erbij.

---

## 1. De regel

> **Een antwoord levert één steen op als alle drie waar zijn:**
>
> 1. het antwoord is goed,
> 2. het item was aan de beurt,
> 3. het item is eerder al eens beantwoord.
>
> **Alles daarbuiten levert nul op. Er gaat nooit iets af.**

Niet bij een fout, niet na een week niets doen, nooit.

**Tien stenen is een verdieping.** Die krijgt een nummer en een datum en blijft
voor altijd staan. Er is geen niveau boven de verdieping, geen rang, geen titel,
geen einde. De drempel loopt nooit op: de tienduizendste steen kost evenveel als
de eerste.

Dat is het hele systeem. Eén regel, één getal, één beeld.

### Wat de regel precies betekent

De regel is **strenger dan de doosstap van Leitner**, en dat is met opzet. Een
nieuw item is per definitie aan de beurt en gaat bij een goed antwoord van doos 1
naar doos 2 — maar het levert geen steen op, want je wist het nog niet, je leerde
het net. De steen is er voor het moment dat iets terugkwam en je het _nog_ wist.
Dat is het enige moment waarop er bewijs is dat er iets blijft hangen, en het is
precies wat spaced repetition meet.

Het begrip bestond al in de code, alleen te smal: `leitner.ts` schreef een
_stempel_ bij een goed, aan-de-beurt antwoord op een item in doos 5. De steen is
hetzelfde, maar voor alle dozen. Eén boekhouding, geen tweede.

### Wat de regel níét is

- Geen punten voor volume. Tien rondes op één dag leveren niet meer op dan wat er
  die dag aan de beurt was.
- Geen straf. Een fout kost niets, een gemiste week kost niets.
- Geen valuta. Er is niets te kopen, te ruilen, te sparen of te verliezen.
- Geen snelheid. Hoe lang je over een antwoord doet, telt nergens mee.

---

## 2. Waarom het album weg moet

ADR-149 gaf elk item een _laag_, afgeleid van de hoogste doos die het ooit
bereikte, en legde daar stempels, tekens, een weekkaart, een weekdoel, zegels,
een jaarstrook en bijhoudstempels bovenop. Zes boekhoudingen over één feit.

Drie dingen gingen daar mis.

**Een kind van zes kan niet in één zin zeggen wat het kreeg.** Dat is de toets
die het album niet haalde: laag, stempel, teken, zegel en doel zijn vijf dingen
die alle vijf iets anders tellen, en een van de vijf (het teken) gaat zelfs over
iets wat _slechter_ ging.

**Een kind van twaalf ziet dat het plaatje klaar is.** De laag volgt de hoogste
doos ooit. Eén keer doos 5 gehaald, en er verandert nooit meer iets aan waar het
kind naar kijkt. De stempel die dat moest repareren, kan hooguit eens per drie
weken vallen — dus zeventien van de twintig dagen gebeurt er zichtbaar niets.

**Het plaatje is niet de leerstof.** Het album beloofde dat de beloning de stof
zelf zou zijn, maar een ingekleurd plaatje van Drenthe is geen kennis van
Drenthe; het is een sticker die toevallig Drenthe heet.

De toren lost alle drie op door er één ding van te maken dat elke dag beweegt en
nooit af is.

---

## 3. De toren

**Een verdieping is 5 stenen breed en 2 hoog.** Tien is dan nog na te tellen
(5 + 5), maar het silhouet is een toren en geen muur.

**Elke steen krijgt de kleur van zijn vak** — de module-accenten uit
`src/index.css`. Kleur is versiering. Er staat geen informatie in die alleen in
kleur te zien is: een verdiende steen is _gevuld_, een steen die klaarligt is een
_gestippelde omtrek_. Dat verschil is een vorm, niet een tint.

**Hoogte: 3 meter per verdieping.** De toren groeit omhoog en wordt altijd
geschaald op zijn eigen kader. Dat doet twee dingen tegelijk: hij loopt nooit
buiten beeld, en twee torens zijn nooit met het oog te vergelijken. Een kind dat
over de schouder van een ander kijkt, ziet geen ranglijst.

**Hooguit de bovenste ~40 verdiepingen worden los getekend.** Alles daaronder is
één fundamentblok met het aantal erin. Dat is goed voor de tekensnelheid, en het
is zelf een beloning: je begin wordt piepklein.

Dat getal van 40 is niet willekeurig. Op een telefoon van 393px blijft er na de
schermpadding en de kaartpadding ongeveer 321px over. Vijf stenen naast elkaar
geven dan een steen van hoogstens 28px, en dat is het maximum — bereikt bij een
toren van vijf verdiepingen. Daarboven krimpt de steen mee. Bij 40 verdiepingen
zijn het 80 rijen in ongeveer 320px hoogte: 4px per rij, en dat is precies de
grens waaronder een verdieping niets meer laat zien.

Natelbaarheid werkt dus zolang de toren klein is, en dat is precies wanneer het
ertoe doet. Wie veertig verdiepingen heeft, telt verdiepingen.

### De ijkpunten

Bij elke passage van een ijkpunt: één regel en één moment. Niet meer.

Het is inhoud en geen regel, dus het staat in één const met een test, en het is
zonder code te wijzigen aan te vullen.

**Groep 3-5 en zonder groep** — met beeld, zonder meters:

| verdiepingen | hoogte | wat het is      |
| ------------ | ------ | --------------- |
| 2            | 6 m    | een giraf       |
| 4            | 12 m   | een huis        |
| 7            | 21 m   | de hoogste boom |
| 11           | 33 m   | een windmolen   |
| 17           | 51 m   | een kerktoren   |
| 25           | 75 m   | een reuzenrad   |
| 38           | 114 m  | de Domtoren     |
| 62           | 186 m  | de Euromast     |
| 100          | 300 m  | de Eiffeltoren  |
| 167          | 501 m  | de wolken       |
| 334          | 1002 m | een kilometer   |

**Groep 6-8** — dezelfde lijst zonder giraf en boom, met de echte hoogte erbij,
en aan de bovenkant verlengd: Burj Khalifa (276 verdiepingen, 828 m) en 10 km
("waar vliegtuigen vliegen", 3334 verdiepingen).

Alleen de vijf échte bouwwerken krijgen een geverifieerde hoogte: Domtoren 112 m,
Euromast 185 m, Eiffeltoren 300 m, Burj Khalifa 828 m, en de twee ronde getallen.
Huis, windmolen, kerktoren en reuzenrad zijn "ongeveer". Dat is geen slordigheid
maar een keuze: een twaalfjarige die één getal natrekt en het mis vindt, gelooft
de rest van de app ook niet meer.

---

## 4. De kadans, doorgerekend met de echte getallen

De kadanstabel van het oude ontwerp rekende met rondes van tien vragen en keek
langs `composeRound` heen. Hieronder staat de uitkomst van de échte planner:
`INTERVAL_DAYS` (1, 2, 5, 8, 21 dagen), `review` inclusief zijn vroege tak voor
goed-maar-niet-aan-de-beurt, `mixVoor`/`TEMPO_MIX`, en `composeRound` met het
opvullen van tekorten en het terugzetten van een fout antwoord in dezelfde ronde.
`ROUND_SIZE` is `{ topo: 15, tafels: 10, klok: 10, vlaggen: 10, taal: 10 }` en de
setgroottes zijn de echte. Veertig gesimuleerde kinderen per set; de tabel geeft
de mediaan van de eerste dag waarop het gebeurt, met dag 1 als eerste oefendag.

**Elke dag oefenen, foutloos:**

| set (items, ronde)      | 1e steen | verd. 1 | verd. 2 (giraf) | verd. 4 (huis) | na 90 dagen |
| ----------------------- | -------- | ------- | --------------- | -------------- | ----------- |
| tafel-1 (10, 10)        | dag 3    | dag 4   | dag 9           | dag 39         | 60 stenen   |
| provincies (12, 15)     | dag 3    | dag 4   | dag 9           | dag 39         | 72          |
| klok heel (12, 10)      | dag 3    | dag 4   | dag 9           | dag 39         | 72          |
| spelling dt (40, 10)    | dag 3    | dag 5   | dag 6           | dag 10         | 240         |
| europa-landen (46, 15)  | dag 3    | dag 3   | dag 5           | dag 7          | 276         |
| klok vijf (96, 10)      | dag 3    | dag 5   | dag 6           | dag 10         | 501         |
| wereld-landen (167, 15) | dag 3    | dag 3   | dag 5           | dag 7          | 812         |

Drie keer per week (ma/wo/vr) schuift de eerste verdieping naar dag 4-7 en de
giraf naar dag 9-14.

Drie dingen volgen hieruit, en ze sturen het hele ontwerp.

### 4.1 De toren blijft twee dagen leeg

Op dag 1 is alles nieuw, dus niets levert een steen op. Op dag 2 is er nog niets
aan de beurt (doos 2 komt na twee dagen terug). **De eerste steen kan pas op dag
3 vallen, in élke module.**

Dat is geen detail dat je later oplost. Het maakt de lege-ronde-terugkoppeling
— de stenen die morgen klaarliggen, als gestippelde omtrekken, met "Je toren
begint morgen" — geen franje maar de drager van de eerste twee dagen. Daarom mag
die nooit overgeslagen worden.

En het maakt het fundament uit `goedCount` voor bestaande kinderen noodzakelijk:
zonder dat zou een kind dat al een half jaar oefent, op maandag naar een lege
toren kijken.

### 4.2 Een kleine set die je goed kent, droogt op

Tafel-1 foutloos geoefend geeft 60 stenen in 90 dagen. Dezelfde tafel met 15%
fouten geeft er 211.

Dat is de eerlijke keerzijde van "een fout kost nooit iets": wie het goed kent,
krijgt het minder vaak terug, en krijgt dus minder stenen. Het is precies het
bezwaar dat een kind van twaalf binnen een week zelf bedenkt — _hoe beter ik het
ken, hoe minder stenen ik krijg_ — en het is waar.

Het antwoord is niet om de regel te verbuigen. Het is drieledig:

1. **De toren telt over álle vakken.** Wie tafel-1 beheerst, gaat naar tafel-2,
   en dat opent nieuwe stenen. Eén toren voor alles, en niet één per set.
2. **Voor groep 6-8 staat de onthoudring ernaast**, want dat is het getal dat
   juist wél omhooggaat naarmate je iets beheerst. Dat is het antwoord aan een
   twaalfjarige in de vorm die een twaalfjarige accepteert: een tweede getal dat
   de andere kant op wijst.
3. **De ouder krijgt het uitgelegd** (`toren.ouderTempo`), zodat het thuis geen
   ruzie wordt.

### 4.3 Een fout op dag 1 levert de eerste steen een dag eerder op

Een fout item blijft in doos 1 en komt morgen terug; een goed item gaat naar doos
2 en komt overmorgen terug. Wie op dag 1 iets fout had, kan op dag 2 dus al een
steen verdienen.

Dat is geen bug en het wordt nergens uitgelegd — maar het is goed om te weten bij
het testen, en het is een prettige eigenschap: het systeem is nergens sneller
voor wie het al kan.

---

## 5. Twee gezichten, één regel

De app kent de groep al (`src/game-core/groep.ts`, ADR-151). Groep is optioneel en
altijd over te slaan. De regel verandert nooit; alleen wat er vooraan staat.

**Groep 3-5 en geen groep — het beeld voorop.** De toren groot, Denker aan de
voet, het ijkpunt in woorden ("Hoger dan een giraf."). Korte zinnen, geen meters,
geen datums.

Denker staat er op een vaste maat en niet op ware schaal. Op ware schaal is een
mens 1,7 van de 3 meter die een verdieping hoog is, dus bij schaal 1 zo'n 17
pixels — en zodra de toren boven de tien verdiepingen komt en de schaal krimpt,
is hij een stip. Een poppetje dat verdwijnt zegt minder dan geen poppetje. Wat
de hoogte betekent staat daarom in woorden, en dat is ook wat een kind van zes
ervan navertelt.

**Zonder groep krijgt een kind het beeld**, en dat is de veilige kant: een kind
van zes dat de getallen krijgt snapt er niets van, terwijl een twaalfjarige die
het beeld krijgt zich hoogstens jonger behandeld voelt — en dat is met één
schakelaar te repareren.

**Groep 6-8 — de getallen voorop.** "412 stenen · 41 verdiepingen · 123 meter",
daaronder de datumlog van de verdiepingen, en de toren kleiner ernaast. Nuchtere
woorden, geen aaibaarheid.

De datumlog is voor deze leeftijd het interessantste deel, en daarom staat hij
hier hoog en op het beeldgezicht helemaal niet. Ernaast staat de **onthoudring**
uit Onthouden (`src/features/retention/Overzicht.tsx`). Dat is het getal dat juist
wél omhooggaat naarmate je iets beheerst, en het is het antwoord op het bezwaar
uit §4.2.

Eén voorkeur op Voor ouders overschrijft het register, standaard afgeleid uit de
groep. Op het apparaat en niet per kind, zoals `voorlezen`, met dezelfde
afweging: het zijn schakelaars van het ding waar je op oefent.

Drie standen en niet twee: "volg de groep" moet zelf een stand zijn, anders
staat een kind dat overgaat voor altijd vast op wat er ooit een keer gekozen
is.

---

## 6. Wat het kind ziet, scherm voor scherm

### 6.1 Tijdens de ronde — er komt niets bij

**Geen strook, geen teller, geen toren.** Decoratie naast de leerstof schaadt het
leren (Rey 2012; Sundararajan & Adesope 2020, g −0,33), en dat is het eigen
onderzoek achter ADR-149. Denker staat hier nooit.

Op de plek waar nu `AlbumStap` staat komt precies één ding:

| geval                   | vorm                                       | zin                                                |
| ----------------------- | ------------------------------------------ | -------------------------------------------------- |
| steen verdiend          | klein **gevuld** blokje in vakkleur, 120ms | "Je wist hem nog. Eén steen."                      |
| goed, niet aan de beurt | dezelfde vorm als **gestippelde omtrek**   | "Die ken je al. Over {dagen} dagen telt hij weer." |
| nieuw item              | gestippelde omtrek                         | "Nieuw. Over {dagen} dagen komt hij terug."        |
| fout                    | het bestaande foutteken en de uitleg       | **niets**                                          |

Bij een fout: geen omtrek, geen knipperende toren, geen zin over stenen.
**Zwijgen is het ontwerp.** Een kind dat het niet wist, hoeft niet ook nog te
horen wat het daardoor niet kreeg.

De gestippelde omtrek is dezelfde taal als de gestippelde ring van een
niet-behaald embleem (`src/features/badges/Embleem.tsx`): gevuld is verdiend,
gestippeld is nog niet. Vorm, geen kleur.

### 6.2 Ronde klaar — de enige plek met beweging

Eén scène van hoogstens 3,2 seconden, met een tik over te slaan, en de knoppen
zijn vanaf de eerste frame bruikbaar. Alleen `transform` en `opacity`, met de
bestaande tokens (ADR-142).

1. De toren staat zoals hij was. Denker aan de voet, `oefenen`, rustige
   idle-beweging (4px, 2s lus).
2. De stenen van deze ronde vliegen van onderen in, elk 180ms, `--beweeg-uit`.
   De teller loopt mee.
3. Raakt een verdieping vol: 240ms zetten met `--beweeg-veer`, daarna pant de
   camera één verdieping omlaag in 420ms, Denker wordt `goed-gedaan`, en er
   klinkt één keer `speelMoment('pagina')`.
4. Wordt een ijkpunt gepasseerd: het silhouet schuift er in 420ms naast en blijft
   staan, met één regel. Denker maakt één sprongetje (240ms).
5. **Geen stenen deze ronde: geen scène.** Denker wordt `iets-nieuws`, en de
   stenen die morgen klaarliggen verschijnen als gestippelde omtrekken in de
   verdieping in aanbouw, met één pulse van 240ms. Dit is de compensatie voor de
   lege eerste twee dagen (§4.1) en het **mag nooit overgeslagen worden**.
6. Is vandaag klaar: Denker eindigt op `pauze`.
7. Helemaal onderaan licht de dag van vandaag op in de reeks, 120ms.

**De tussenruimte tussen de stenen is een formule, geen tabel.** De opdracht vraagt
60ms uit elkaar én een veeg van maximaal 700ms, en die twee spreken elkaar tegen
bij precies tien stenen: 9 × 60 + 180 = 720ms. Dus:

```
perSteen = aantal <= 1 ? 0 : min(60, (700 - 180) / (aantal - 1))
```

Vijf stenen staan 60ms uit elkaar (totaal 420ms), tien staan 57,8ms uit elkaar
(totaal precies 700ms), twintig staan 27ms uit elkaar — dat is de "veeg", en hij
ontstaat vanzelf in plaats van uit een tweede regel.

**Het budget**, slechtste geval: 300 (toren) + 700 (stenen) + 240 + 420
(verdieping) + 420 (ijkpunt) + 120 (reeks) = **2200ms**, ruim onder de 3,2s.

Onder de scène blijven drie regels met pictogram staan:

- "{beantwoord} vragen, {goed} goed"
- "{stenen} stenen erbij." / "Nog geen stenen — deze zag je voor het eerst."
- "Morgen komen er {aantal} terug."

De bestaande `OnthoudRegel` (het percentage over drie weken) blijft. Dat is
informatie en geen beloning.

### 6.3 Rustig moet écht werken

Bij `:root[data-beweging='rustig']` staat alles meteen in de eindstand. Zelfde
zinnen, zelfde geluid, nul beweging.

De globale regel in `src/index.css` drukt alleen _duur_ naar 0,01ms. Dat is op
drie plekken niet genoeg, en die drie krijgen een expliciete tak:

1. **`animation-delay` wordt niet gesquasht.** Tien stenen zouden dus nog steeds
   over 540ms binnendruppelen: de beweging weg, de volgorde niet. Daarom wordt
   `perSteen` op 0 gezet.
2. **De tijdlijn in JavaScript ziet CSS niet.** De scène zou 2,2 seconden lang
   niets doen. Daarom begint de teller op de laatste beat in plaats van op de
   eerste: de allereerste frame ís de eindstand.
3. **De teller is een getal, geen stijl.** Die volgt uit 2.

Eén valkuil die eerst gerepareerd moet worden: `usePreferences()` geeft bij de
eerste render de standaardwaarden terug (`rustig: false`) en leest pas daarna uit
IndexedDB. Een scène die op mount begint, beweegt dan vóórdat de voorkeur binnen
is. De scène leest `rustig` daarom synchroon van `document.documentElement`, met
`prefers-reduced-motion` als terugval.

De grondregel die de rest gratis goed maakt: **elke animatie is een binnenkomst
waarvan de eindstand de gewone ruststand is.** Geen enkele animatie houdt met
`forwards` een waarde vast die niet al in de stylesheet staat. Dan is de
0,01ms-squash vanzelf de juiste eindstand, en is overslaan vanzelf correct.

### 6.4 Modulepagina

Geen tweede toren en geen inkleurende kaart. Eén zin:

> "{aantal} komen hier vandaag terug." — of bij nul: "Hier komt vandaag niets
> terug. Morgen {aantal}."

### 6.5 Jij

De toren vervangt `AlbumOverzicht`. Bij binnenkomst vanaf een ronde rijzen de
verdiepingen van onder naar boven op, 40ms uit elkaar, samen hoogstens 700ms.
Daaronder: de reeks, dan de prijzenkast (diploma's) en het jaaroverzicht,
opnieuw opgebouwd uit toren + reeksrecord + diploma's.

### 6.6 Onthouden

De inkleurende topokaart **verhuist hierheen** als statusbeeld voor de gekozen
set, gratis, naast de bestaande heatmap. Hij verdwijnt dus niet — hij houdt op
een beloning te zijn en wordt wat hij is: de stand.

Hij spreekt daar ook de taal van de pagina: elke plek draagt een van de vier
statussen die de stippen en de tabel ernaast ook gebruiken (nog niet geoefend,
aan het oefenen, onthouden, even opfrissen), in plaats van de albumlagen. Eén
taal voor drie beelden van hetzelfde. De stempels en de tekens die erop stonden,
zijn met het album vervallen.

---

## 7. De reeks

Op verzoek van de eigenaar, en met de regels die de eigenaar heeft gekozen.

- **Telt dagen op rij met een afgemaakte ronde.** Alle dagen tellen mee, ook het
  weekend en de vakantie.
- **Eén gemiste dag breekt hem.** Er is geen vrije dag.
- **Het record blijft voor altijd staan.** Breken kost dus nooit geschiedenis, en
  de zin bij een nieuwe start is "Je reeks begint opnieuw. Je toren staat er nog."
- **De reeks levert geen stenen op.** Er is geen herstel te koop, geen bevriezing,
  geen valuta, nergens.
- **Geen opslag.** Afgeleid uit de afgemaakte rondes met `dagenGeoefend`
  (`src/game-core/oefendagen.ts`), zoals de weekkaart dat nu doet.
- Hij staat op twee plekken: onderaan Ronde klaar en op Jij. Niet op de voordeur,
  niet in de ronde.

Gecontroleerd, want het is de voorwaarde voor "het record blijft staan":
`loadPlayedRounds` (`src/store/progress.ts`) geeft **elke** afgemaakte ronde van
dit kind terug en snoeit niets. Het record is dus over de hele geschiedenis
afleidbaar en hoeft niet bewaard te worden. Eén bekende beperking, die de
weekkaart vandaag al heeft: de sessies staan per apparaat in IndexedDB, dus een
kind op een tweede apparaat begint daar met een kortere geschiedenis.

### 7.1 De prikkel, en wat hij kost

De eigenaar heeft gevraagd om actief te sturen op het niet verliezen van de
reeks, in de app en in de communicatie. Dat wordt gebouwd: op de voordeur, als de
dag nog leeg is en er een reeks loopt, staat er één regel die zegt wat er op het
spel staat, en het ouderbericht noemt de reeks en of hij brak.

Wat er **niet** bij komt, omdat de opdracht het zelf verbiedt: geen aftelklok,
geen alarmkleur, geen herstel te koop, geen bevriezing, geen valuta, geen push.
Nooit "minder dan vorige week". De breukzin blijft mild en wijst naar de toren.

En dit is wat het kost, hier opgeschreven omdat het later niemand mag verrassen:

- Het is **verlies-als-prikkel bij kinderen vanaf zes**. Dat staat op de
  verbodenlijst van ons eigen onderzoek (het onderzoek dat aan ADR-149 voorafging).
- Het is **precies de reden waarom ADR-149 de reeks sloopte**: een reeks breekt op
  elke lege dag, en een lege dag is precies wat spreiden nodig heeft. Een kind dat
  zijn reeks wil redden, oefent op een dag dat er niets aan de beurt is — en dat
  levert per definitie nul stenen op. De reeks en de steenregel trekken dus aan
  hetzelfde kind twee kanten op.
- Het raakt **DSA art. 28 en de Code voor Kinderrechten**, die beide zien op
  ontwerp dat kinderen tot gebruik aanzet.

De toren zelf is hiertegen bestand: er gaat nooit iets af, dus een gebroken reeks
kost geen enkele steen. Dat is met opzet de enige verzachting in het ontwerp, en
het is de reden dat de breukzin over de toren gaat en niet over de reeks.

---

## 8. Wat verdwijnt en wat blijft

**Weg.** Lagen 0-5 en `hoogsteDoos` als zichtbaar begrip, de plaatjes en het
raster, de stempels, de tekens _lastig_ en _even opfrissen_ (die horen op
Onthouden), de weekkaart, het weekdoel, de zegels, de jaarstrook, de
bijhoudstempels, de seizoensvakjes, de pagina `/week` en de omleiding van
`/reeks`, en de knopnaam "Nieuwe plaatjes" (wordt "Iets nieuws leren", met erbij
dat het vandaag geen stenen oplevert).

`src/game-core/leitner.ts` verandert **geen letter**.

**Blijft.** De diploma's (als toets, niet als beloning: printbaar, met de
rijpheidslat van ADR-141 en proefzwemmen), het zelfgekozen doel (ADR-153 — voor
een kind van twaalf is dát de motor, niet de toren), Onthouden als statuspagina,
"Klaar voor vandaag" (ADR-139), en de terugkomzin na weken weg: "Je toren staat
er nog. {aantal} stenen liggen klaar."

---

## 9. Wat kinderen al verdiend hebben

Bij de eerste keer openen begint het aantal stenen op **de som van alle
`goedCount`** van dat kind. Die vormen het fundament, zonder datum, met één label:
"Wat je al had."

Royaal met opzet: de overgang mag nooit als verlies voelen. Een kind met 87 goede
antwoorden opent de app dus met 8 verdiepingen en 7 stenen in aanbouw; de
nummering van nieuwe verdiepingen loopt daarboven door. Vanaf dat moment geldt de
nieuwe regel.

Dat valt vanzelf samen met het fundamentblok dat de tekening toch al nodig heeft
voor alles onder de bovenste verdiepingen (§3): je begin wordt letterlijk
piepklein, en dat is precies de juiste boodschap.

**Opslag:** `toren:<kindId>` in de settings-store, zelfde vorm en zelfde
defensieve leeswijze als `zegels:<kindId>` in `src/store/weekStore.ts` —
append-only, met het totaal, de volle verdiepingen (nummer, datum, kleuren) en de
verdieping in aanbouw. Geen schemawijziging; de oude velden (`hoogsteDoos`,
`stempels`) blijven staan en worden door niets meer gelezen. Dat is het patroon
van ADR-130 en ADR-149.

---

## 10. De code

**De regel is één pure functie** in `src/game-core/toren.ts`, naast `leitner.ts`,
zonder React en zonder store:

```ts
export function levertSteen(vorige: ItemState, correct: boolean, now: Date): boolean {
  return correct && vorige.laatsteReview !== null && isDue(vorige, now);
}
```

**Het rondetotaal wordt per antwoord opgeteld, niet uit een verschil afgeleid.**
Dat is geen smaak. Een item dat eerst fout was en drie vragen later goed, staat na
de fout in doos 1 met een nieuwe `volgendeReview`; het tweede, goede antwoord is
dan niet aan de beurt en levert terecht nul op. Maar het _verschil_ tussen de
stand vóór en na de ronde laat `goedCount` +1 én een gewijzigde `volgendeReview`
zien, en een diff-functie zou daar een steen van maken. Per antwoord optellen is
bovendien de enige bron die het vraagscherm ook nodig heeft.

**Er zijn twee rondes, niet één.** `src/features/round/useRoundCore.ts` bedient
klok, tafels, vlaggen en taal; de topo-ronde draait op een eigen implementatie in
`src/features/practice/useRound.ts`, met een eigen `settle` en `finish`. Beide
haken op dezelfde functie aan. De regel staat maar één keer in `game-core`.

**De stenen dragen `data-vak`, niet `data-module`.** Dat is geen naamkeuze maar
een noodzaak: `[data-module='topo']` zet `--module` op `--actie` — de merkkleur,
niet de vakkleur — en verzet daarmee stilletjes elke `--module-*` token in de hele
subtree. Een steen met `data-module="topo"` zou dus blauw zijn om de verkeerde
reden. `data-vak` heeft dat bezwaar niet en kost één CSS-blok.

**De tekening is één SVG met een vaste viewBox** en een schaal die in eenheden
wordt uitgerekend, niet gemeten. Vaste viewBox omdat een viewBox die met het
aantal verdiepingen meebeweegt, betekent dat de code niet weet hoe groot een
letter op het scherm wordt. Het pannen van één verdieping is één CSS-transform op
een cameragroep, nooit een viewBox-wijziging, zodat het op de compositor blijft.
De toren staat een verdieping _in_ de grond, zodat een pan nooit een rand
blootlegt.

**De scène wordt door één puur draaiboek bepaald** (`draaiboek()`), zodat de
volgorde, de geluiden en het rustig-gedrag zonder DOM te testen zijn. De
component voert alleen uit. Geen Web Animations API: jsdom kent `Element.animate`
niet, en dan zou juist de bewering die het meest rot — "onder rustig is het
dezelfde scène zonder beweging" — niet te testen zijn.

De twee tests die dat bewijzen zijn één regel elk:

```ts
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.id)).toEqual(
  draaiboek({ ...basis, rustig: false }).beats.map((b) => b.id),
);
expect(draaiboek({ ...basis, rustig: true }).beats.map((b) => b.geluid)).toEqual(
  draaiboek({ ...basis, rustig: false }).beats.map((b) => b.geluid),
);
```

**Overslaan neemt niets weg.** De tik zit op de tekening en niet op de pagina, er
komt geen laag overheen, er wordt nooit `preventDefault` aangeroepen, en de
knoppen staan gewoon in de documentvolgorde eronder. Spatie op een knop met focus
drukt dus die knop in én eindigt de scène, en de eindstand is wat het kind toch
al te zien zou krijgen. Bij nul stenen is overslaan een lege functie, want dan is
er geen scène — beat 5 is een toestand en geen animatie.

---

## 11. De toetsen voordat dit af heet

Vijf, en de eerste drie kunnen alleen met echte kinderen.

1. **Laat een kind van zes of zeven na één ronde uitleggen wat het kreeg en
   waarom.** Komt daar meer dan één zin uit, dan is het ontwerp te groot.
2. **Laat datzelfde kind zonder tekst zeggen wat het verschil is** tussen de
   gevulde steen en de gestippelde omtrek.
3. **Laat een kind van elf of twaalf de pagina zien en vraag: "Is dit voor kleine
   kinderen?"** Zegt het ja, dan faalt het register en moet het getallengezicht
   verder van het beeldgezicht af.
4. **Zet rustig aan en doe een hele ronde.** Alles moet hetzelfde zeggen, zonder
   één beweging — in het bijzonder de lege-ronde-beat, die nooit overgeslagen
   mag worden.
5. **Teken Ronde klaar op 393px voordat er een regel CSS bij komt.**

---

## 12. De fasering

1. De regel, de opslag, de migratie van `goedCount`, de toren op Jij, de scène op
   Ronde klaar, en de zin op de modulepagina. Album eruit.
2. Het register per groep, de ijkpunten, de reeks, de kaart naar Onthouden, het
   jaaroverzicht opnieuw.
3. De diploma's naar Voor ouders, en de ouderuitleg.

Bij die derde is één ding anders uitgevallen dan "de etalage verhuist". **Jij
houdt wat gehaald is** — dat hoort bij de toren en de reeks, want het is wat dit
kind gebouwd heeft. Wat naar Voor ouders gaat, is het hele raster mét de gaten:
drieëndertig vakjes waarvan de meeste leeg, en dáár zijn die gaten het punt
(ADR-064) omdat een ouder er iets mee kan. Is er nog niets gehaald, dan staat er
op Jij niets — vier lege wanden met een kop erboven vertellen een kind op dag
één dat het niets heeft.

Daarmee verhuist ook de diepe link van ADR-153: "Bekijk alle diploma's" op de
voordeur gaat naar Voor ouders in plaats van naar Jij.

Eén ADR voor het hele besluit, drie PR's voor de code.

---

## 13. Wat hier zwak aan is

Vier dingen, opgeschreven omdat ze anders pas na de bouw gevonden worden.

**De reeks en de steenregel trekken twee kanten op** (§7.1). Een kind dat zijn
reeks wil redden op een dag dat er niets aan de beurt is, oefent voor nul stenen.
Dat is de prijs van het besluit om de reeks streng te maken, en het is de eerste
plek om te kijken als kinderen gaan klagen dat oefenen "niets doet".

**Een kleine, goed gekende set droogt op** (§4.2). Het antwoord (meer vakken, de
onthoudring, de ouderuitleg) is echt, maar het is een antwoord en geen oplossing.
Als dit in de praktijk bijt, is de eerlijkste ingreep niet de regel verbuigen maar
de nieuwe stof beter aanbieden.

**Twee dagen leeg aan het begin** (§4.1). De gestippelde omtrekken en "Je toren
begint morgen" moeten dat dragen. Dat is veel gevraagd van twee zinnen, en het is
het eerste wat getoetst moet worden bij een kind dat de app voor het eerst opent.

**Het fundament is genereus maar arbitrair.** De som van `goedCount` telt ook
antwoorden die onder de nieuwe regel nooit een steen zouden zijn geweest. Dat is
bewust — de overgang mag niet als verlies voelen — maar het betekent dat de
eerste verdiepingen van bestaande kinderen iets anders betekenen dan alle
verdiepingen daarna. Vandaar het aparte label en de ontbrekende datum.
