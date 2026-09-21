# De schermen en het merk

Voorstel · 21 september 2026 · codebasis `b4c3db2` (ADR-173) · lezer: de eigenaar

De tekeningen horen bij dit blad en staan in
`docs/leer.nu Schermen en merk.dc.html`: vijftien bladen, in de volgorde
waarin ze hieronder besproken worden.

Er verandert in dit voorstel niets aan de app. Geen `src/`, geen `public/`,
geen test, en `docs/logo/` blijft onaangeroerd.

## 1 De maatstaf

Drie pagina's beantwoorden drie vragen, en dat is de toets voor elk blok.
Staat een blok op de verkeerde pagina, dan is het ruis.

| lezer | pagina  | de enige vraag                     |
| ----- | ------- | ---------------------------------- |
| Kind  | Vandaag | Wat doe ik nu?                     |
| Kind  | Jij     | Wat heb ik bereikt, en blijft het? |
| Ouder | Ouder   | Gaat het goed, en wat kost het?    |

Premium is geen vierde plek maar een folder: het kind mag hem lezen, de ouder
rekent af, en aanzetten gebeurt achter de pincode.

## 2 De diagnose, in getallen uit de code

1. **277 unieke `tk-`klassen** in `src/index.css`, 4615 regels, voor ongeveer
   tien schermen. Ze staan in ruim vijftig gemarkeerde secties; een deel zegt
   hetzelfde met een andere naam (`tk-kaart`, `tk-kaartje`, `tk-card`,
   `tk-kaartrij`, `tk-lijstrij`, `tk-plaat`, `tk-tegel`).
2. **De voordeur draagt zes tot acht blokken van gelijk gewicht.** Drie ervan —
   Meest geoefend, Recent geoefend en Maak af — leiden naar dezelfde soort
   ronde. Het antwoord op "wat doe ik nu" staat er dus drie keer, in drie
   vormen.
3. **De vakpagina is één scherm met vier vragen en ruim veertig
   aanraakvlakken.** De enige plek waar de keuze samenkomt, de startbalk, staat
   het verst van de eerste vraag.
4. **Jij vertelt voortgang in vier talen tegelijk** en zet twee percentages over
   hetzelfde twee blokken uit elkaar: "over drie weken nog 71%" en "nu blijft
   88% hangen".
5. **Drie navigatiepatronen naast elkaar.** Onder 1200 staan er twee balken
   boven de inhoud en één eronder: drie stroken frame voordat een kind iets van
   zijn eigen pagina ziet.
6. **Het merk doet nergens mee.** Koraal mag sinds ADR-159 de interface niet in,
   dus het logo bestaat alleen nog als plaatje in de hoek.

## 3 De look, en de aannames

**Een werkboek met een gezicht.** Papier als grond, witte kaarten, één
randdikte, alles op de ruimtemaat, geen schaduw. Precies één gevulde indigo
knop per scherm; al het andere is tekst, lijn of vlak. De kleur komt binnen
waar hij iets zegt — de zes vakken — en de warmte komt van de Denkers, een
familie die het product een gezicht geeft zonder ooit de plaats van een
resultaat in te nemen. Geen kermis en geen dashboard: de kast van een kind dat
wil zien wat het al kan.

Aannames:

- Kleur, typografie, radius, ruimtemaat, trefmaten en de vormregels voor
  goed/fout/gemist zijn kader, geen variabele. Wat toch moet wijken staat in
  hoofdstuk 12 en nergens anders.
- 390 is de ontwerpbreedte. 1280 is getekend waar het patroon echt verandert;
  Premium en Ouder volgen daar het paginaframe van Jij.
- Denker blijft bestaan, als familie naast het merk, niet als het logo.

## 4 De ronde

Eén layout voor elk vak, van boven naar beneden:

1. **De rondebalk**, 56 hoog, wit met een lijn eronder: stop (44), de
   voortgangsbalk in tien vakjes, de teller.
2. **Het toneel**: één witte kaart, radius 16, die zoveel mogelijk van het
   scherm vult. Bovenin altijd het label en de vraag; wat eronder staat
   verschilt per vak — bij rekenen niets, want de som ís de vraag, bij topo de
   kaart, bij klok de wijzerplaat.
3. **Het antwoordgebied**, vastgezet aan de onderrand, met een vaste hoogte.

Na een antwoord verschijnt de terugkoppeling **in het toneel**, waar de vraag
stond, en wordt het antwoordgebied vervangen door één knop — **Volgende vraag,
op de plek van de eerste antwoordknop**. Dat is de hele regel tegen
verspringen: de duim hoeft niet te verhuizen, op geen enkele maat en in geen
enkel vak.

Op 768 en 1280 wordt de ronde nooit twee kolommen. De kolom houdt op bij 720 en
gaat in het midden staan; wat breder wordt is de ruimte eromheen. Een kaart
wordt binnen het toneel gepast en nooit bijgesneden; Afrika is 1,04 breed op 1
hoog en houdt dan ruimte links en rechts over, zonder dat het antwoordgebied
meeschuift.

## 5 Het merk

### 5.1 Teken of karakter — allebei, met een rolverdeling

Het **logo wordt een teken**: de punt uit het woordbeeld, met een dikke open
ring eromheen — de aandacht die ergens naartoe gaat. Twaalf is de bovengrens
van de doelgroep, en een figuurtje dat voor een kind van zes warm is, is op die
leeftijd een kleuterlogo. Bovendien valt een gezicht op 16 px dicht: twee ogen
en een punt lopen daar in elkaar, een ring met een opening niet.

Het **woordmerk** is monolineair geconstrueerd: één stokdikte, ronde uiteinden,
en de punt van `.nu` is dezelfde cirkel als de punt in het beeldmerk. Het is
getekend, geen letterinstelling. Voor de echte levering hoort hier nog een
optische correctieslag van een letterontwerper overheen; wat er nu ligt is de
constructie, niet het eindresultaat.

En dan de **Denkers**. De geleverde Denker wordt geen weggegooid logo maar de
stamvader van een familie: één bouw — een zacht lijf, twee ogen die omhoog
kijken, de punt erboven — in zes silhouetten en de zes kleuren die er al zijn.
Er komt dus geen zevende kleur bij. Dit is de plek waar warmte, kleur en
herkenbaarheid het product binnenkomen, zonder één regel uit de briefing te
breken.

De rolverdeling in één zin: **het teken draagt de naam waar het klein is, de
Denker geeft het gezicht waar ruimte is.**

Waar een Denker wel staat: als vakicoon in de plaat van dat vak, op het
app-icoon, het laadscherm en de deelafbeelding, op een leeg blok en in het
terugkomblok, en náást een uitslag, een diploma of een uitreiking. Waar nooit:
op een knop, een chip of een balk, in de rondebalk, in het toneel tijdens een
vraag, als antwoordstaat, in de plaats van een cijfer of een vinkje, met twee
op één scherm, of bewegend.

Beweging blijft binnen ADR-142: 420 ms om het toneel op te komen, 240 ms om van
uitdrukking te wisselen, daarna stil. Niets herhaalt. Bij
`prefers-reduced-motion` en in de rustige stand verschijnt hij zonder beweging.

### 5.2 Wat het kleurbewijs zei — tegen de verwachting in

De briefing vraagt koraal werkbaar te maken langs drie wegen: rol, koraal
opschuiven, of fout opschuiven. Ik heb ze alle drie doorgerekend, in oklch, in
grijswaarden en in een Brettel/Viénot-simulatie van deuteranopie en
protanopie. De uitkomst is niet wat de briefing verwacht.

**Koraal opschuiven werkt niet.** Wat koraal `#FF6A4D` en fout `#BA3535` bij
elkaar houdt is lichtheid, niet tint. Elke oranjere variant verliest contrast
op papier (2,10 tot 2,37, tegen de huidige 2,50) en wint hooguit 0,3 afstand
tot fout. En koraal donkerder maken — de enige manier om de 3:1 uit de briefing
te halen — duwt hem juist ín de lichtheid van fout: `#EA4A26` haalt 3,37 op
papier maar staat nog maar op 1,52 van fout in deuteranopie, tegen 2,03 nu. Het
middel is erger dan de kwaal.

| kleur       | waarde    | oklch          | vs papier | vs fout, deuteranopie |
| ----------- | --------- | -------------- | --------- | --------------------- |
| koraal, nu  | `#FF6A4D` | 0,706 0,188 33 | 2,50      | 2,03                  |
| oranjer     | `#FB8B24` | 0,745 0,171 56 | 2,10      | 2,33                  |
| donkerder   | `#EA4A26` | 0,631 0,202 34 | 3,37      | 1,52                  |
| koraal diep | `#C8412A` | 0,565 0,175 32 | 4,37      | 1,16                  |

**De dichtste buur van het merk is niet fout-rood.** Het is de arcering van
fout, `#EB827B`: in deuteranopie staan die op **1,03** en in grijswaarden op
1,08. Dat is dezelfde kleur. Dáár zit de verwarring die ADR-159 beschrijft, en
dat is één token.

**En het hele palet valt sowieso samen.** De zes vakkleuren staan op gelijke
lichtheid (L 0,549–0,579) en worden in grijswaarden allemaal `#6D6D6D` tot
`#767676`. Goed tegen actie is 1,18, fout tegen actie 1,24. Dat is geen fout
van het palet maar de prijs van gelijke lichtheid, en precies de reden dat de
vormregel bestaat: **kleur voegt snelheid toe, vorm en plaats dragen de
betekenis.**

Conclusie: **koraal blijft `#FF6A4D`**, en wordt van fout gescheiden door rol
en plaats — weg 1, strakker geformuleerd en ruimer toegepast. Waar het merk
klein en in één kleur moet staan, zoals de favicon op 16 px, gebruiken we
`--leernu-koraal-diep #C8412A` (4,37:1 op papier). Die waarde zit al in de
levering; er is geen nieuw token nodig. De enige tokenwijziging die iets
oplevert staat in hoofdstuk 12.

## 6 De navigatie

De geplakte vakknop verdwijnt. Vakken worden een van de drie plekken in de
tabbalk en openen hetzelfde paneel. Daarmee geldt overal: **één balk boven, en
één balk onder óf een rail links — nooit drie stroken.**

- **390 en 768**: appbalk boven (logo links, profielwisselaar rechts), tabbalk
  onder met Vandaag, Vakken en Jij.
- **1280**: appbalk met het logo, de drie bestemmingen als woorden en de
  wisselaar; links de rail met de vijf vakken. Geen tabbalk.

Waar je bent lees je aan de indigo tint-pil; in welk vak je bent aan de kleur
en de Denker van dat vak. Premium is geen tab: je komt er vanaf een slot en
vanaf Jij, want een kind hoeft niet drie keer per dag langs de prijs.

Het vakmenu en de wisselaar krijgen dezelfde vorm: een vlak over de pagina, een
kop, rijen van 56 en één uitweg. De knop in de balk krijgt een rand en een
teken, zodat hij leest als een schakelaar en niet als een naamlabel; open staat
de rand op 2 px in indigo.

## 7 De vakpagina

De vier stappen worden **vier regels in één kaart**. Eén stap staat open, de
rest toont zijn antwoord of een streepje; een beantwoorde stap klapt dicht en
opent de volgende, en je kunt altijd terug door op een regel te tikken. Dat
brengt ruim veertig aanraakvlakken terug naar vier plus de opties van de open
stap.

De **startbalk verdwijnt als aparte strook**. Wat je koos staat al in de vier
regels erboven, dus de chips die dat herhaalden zijn overbodig en Start hoort
onder stap 4, in dezelfde kaart. Zolang er een stap ontbreekt is Start uit en
staat er één regel onder: "Kies nog bij stap 3 en 4". Dat berispt niet en zegt
precies waar je heen moet, want de stappen zijn genummerd.

Voor het kind dat alleen zijn vaste ronde wil herhalen staat er bovenaan één
kaart, **Verder waar je was**, met de combinatie van de vorige keer en één
Start-knop. Eén tik. De pagina antwoordt daarmee nog steeds niet vóór het kind:
de keuzekaart eronder is leeg.

De pagina telt zo drie blokken: verder waar je was, de keuzekaart, de
diploma's. Rekenen gebruikt hetzelfde patroon met het toetsenbord van twaalf in
de open stap; Klok heeft één stap minder en dus één regel minder. Geen tweede
ontwerp.

## 8 De vier pagina's

### Vandaag

Drie blokken, hooguit vier: **Hier begin je mee vandaag** (één kaart die de
ronde ís, met de enige gevulde knop), **Je doelen voor deze week**, en **Verder
oefenen**. Ligt er een halve ronde, dan komt **Maak af** bovenaan en zakt de
eerste kaart naar een rij — vier blokken, en dat is het plafond.

Wat weggaat: Meest geoefend als aparte rij (het is de bron van blok 1
geworden), en Recent geoefend, dat naar Jij verhuist — dat is geschiedenis, en
de vraag van Vandaag is wat je nú doet. De groepsvraag wordt een regel binnen
blok 1 in plaats van een eigen blok. Het terugkomblok vervangt blok 1 wanneer
het er is, in plaats van erbij te komen.

Zonder premium is blok 1 je meest geoefende in plaats van de eerste ronde van
het dagplan — dezelfde vorm, een andere bron — met daaronder één slotregel.
Eén, op de hele pagina.

### Jij

Bovenaan de etalage in indigo met **één getal**: "88 van de 140 onderdelen
onthoud je", met de balk. Daarmee is de tegenspraak weg: de voorspelling over
drie weken verhuist naar Ouder, waar iemand hem leest. Daaronder de kast, dan
per vak, dan recent geoefend. Instellingen worden één rij onderaan, geen blok —
zo blijft de pagina op vier.

Ook naar Ouder: het jaaroverzicht in weken en de staafgrafiek per vak. Dit
neemt een deel van ADR-172 terug; zie hoofdstuk 13.

Zonder premium: één slot, onder Per vak.

### Premium

De prijs is niet meer het grootste cijfer op de pagina. Voor het kind staan er
vier regels **Wat je ermee kunt** en vier regels **Waarom leer.nu**; voor de
ouder staat er onderaan één rustig blok met de kop **Voor ouders**, waarin de
prijs in lopende tekst staat en de knop naar de kassa. De vergelijktabel
verdwijnt naar één uitklapregel: "Wat zit er niet in de basis?" Aanzetten van
een code gebeurt op de ouderpagina, en dat staat er ook.

Drie staten: nog niets, aan met einddatum, en bijna verlopen. Die laatste
gebruikt de vorm van "gemist" — open vlak, dubbele rand, punt — en zegt wat
blijft staan als de code afloopt: je diploma's en wat je onthoudt.

### Ouder

Dezelfde kleuren en hetzelfde raster, een andere dichtheid: rijen van 48 in
plaats van 56, tekst 16 in plaats van 17, geen gekleurde platen behalve de
initiaal van een kind, geen etalage. Eén kolom, secties gescheiden door een
kop en een lijn. Het verschil is dus **dichtheid en schaal, niet een tweede
huisstijl** — een volwassene herkent de app en wil er sneller doorheen.

De poort is één kaart met een slotteken, vier velden en één knop, en zegt dat
de sessie vijf minuten duurt. Leegmaken staat onderaan, als enige met een rode
rand, met de zin dat het niet terug kan.

## 9 De zeven vragen uit deel 6

1. **Welke pagina is de plek van een kind?** Vandaag. Jij is de kast en krijgt
   Recent geoefend erbij; de cijfers over het schooljaar gaan naar Ouder;
   Premium verdwijnt uit de tabbalk.
2. **Hoeveel blokken verdraagt 390?** **Vier**, en op Vandaag liefst drie. Een
   vijfde blok betekent dat er een op de verkeerde pagina staat.
3. **Hier druk je, of dit is informatie?** Een kaart met een rand in
   tekst-tertiair is indrukbaar; een kaart met een lichte rand is een
   mededeling. Gevuld indigo bestaat precies één keer per scherm.
4. **Één taal voor voortgang.** De balk, met "x van de y" erboven. De tien
   stippen in een ronde zijn diezelfde balk in tien vakjes. De ring op een
   diploma wordt de balk; het percentage in een tegel wordt "x van de y". Het
   cijfer blijft alleen waar het een uitslag is — na een oefentoets — want daar
   betekent het iets anders dan voortgang.
5. **Waar zit 8–12?** Zie hoofdstuk 10.
6. **Hoeveel componenten echt nodig?** Tweeëndertig. Zie hoofdstuk 11.
7. **Wat doet de vakkleur?** Hij zegt "waar ben ik", nooit "wat gebeurt er": de
   plaat en de Denker van een vak, de gekozen staat binnen dat vak, en de
   voortgangsbalk binnen dat vak. Niet de grond, niet de knop, niet de
   rondebalk, nooit goed of fout, en nooit twee vakken tegelijk op één scherm.

## 10 Waar de leeftijd zichtbaar is

Drie plekken waar je 8–12 ziet:

- **De dichtheid en de schaal.** Vier blokken op 390, raakvlakken van 56 in een
  ronde, de vraag op 32 en de som op 48. Een kind van tien krijgt ruimte, geen
  grote knoppen.
- **De toon van belonen.** Het diploma is de beloning, en die verdien je met
  drie keer goed op drie verschillende dagen. Geen confetti, geen reeks die je
  kunt verliezen, geen punten. De Denker die naast een uitslag staat viert niet
  de uitslag; hij staat ernaast.
- **De taal.** "Wat wil je oefenen, Sem?" en "Nog 8 van de 15 vragen", geen
  systeemtaal en geen aanmoediging die nergens over gaat.

Eén plek waar bewust niets gebeurt: **contrast, kleur en raakmaten**. Die zijn
voor iedereen gelijk. Er wordt niets groter of bonter gemaakt omdat de lezer
een kind is; dat is precies het betuttelen dat de briefing verbiedt.

Voor de kinderen van zes en zeven die er ook zijn verandert er niets aan de
vorm. Twee voorstellen die bij de bouw horen, niet in een scherm: laat
"Vragen voorlezen" standaard aan staan onder groep 5, en zet in stap 3 de
aanwijzen- en meerkeuzevormen bovenaan in plaats van typen. Beide leunen op de
groep die het kind al invult.

## 11 Componenteninventaris: van 277 naar 32

Zeven families. Wat verdwijnt gaat op in de vorm ernaast; de namen zijn die van
`docs/HUISSTIJL.md` waar ze bestaan.

| familie       | vormen                                                                         | wat erin opgaat                                                                             |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Frame (4)     | appbalk, bestemmingenbalk (tab óf rail), paneel, profielwisselaar              | `tk-vakmenu*` en `tk-tabbar*` worden één bestemmingenbalk; de vakknop vervalt               |
| Pagina (5)    | etalage, sectie, kaart, lijst + lijstrij, tegelraster                          | `tk-kaartje`, `tk-card`, `tk-kaartrij`, `tk-kaartteken`, `tk-plaat` gaan op in kaart en rij |
| Bediening (6) | knop (primair, secundair, stil), chip, keuzetegel, veld, schakelaar, pil-label | de startbalk-chips vervallen; `tk-vakjes` wordt het toetsenbord binnen keuzetegel           |
| Voortgang (3) | balk (met "x van de y"), stippenbalk, cijfer (alleen uitslag)                  | ring, percentagetegel en losse voortgangsbalken gaan op in balk                             |
| Ronde (6)     | rondebalk, toneel, antwoordveld, meerkeuze, terugkoppelvlak, uitslag           | `tk-sum`, `tk-klok-*`, `tk-vlag-*`, `tk-zin` worden inhoud van het toneel, geen eigen vorm  |
| Merk (4)      | logo, Denker, diploma, zegel                                                   | `tk-embleem`, `tk-diplomamuur`, `tk-groot-diploma` gaan op in diploma en tegelraster        |
| Staten (4)    | slot, leeg, laden, fout                                                        | `tk-statuslabel` en de losse slotvarianten worden één slotrij                               |

Dat is de brug naar de bouwfase: elke vorm is één component met varianten, en
elke `tk-`klasse die overblijft hoort bij precies één ervan.

## 12 Tokenvoorstellen

Apart, want elke wijziging kost hier een test en een besluit. Niets hiervan is
stilzwijgend in een scherm verwerkt; de tekeningen gebruiken de huidige
waarden.

| token                    | nu        | voorstel  | waarom                                                                                                                                           | wat het raakt                                                   |
| ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `--fout-arcering-streep` | `#EB827B` | `#BD6980` | vs koraal in deuteranopie van **1,03 naar 1,42**, in grijs van 1,08 naar 1,37; op papier van 2,31 naar 3,37, dus de arcering wordt ook zichtbaar | `huisstijl.test.ts`, `contrast.test.ts`, `answerStates.test.ts` |
| `--fout`                 | `#BA3535` | `#9E2540` | vs koraal in deuteranopie van 2,03 naar **2,66**; contrast op papier van 5,08 naar 6,64                                                          | `huisstijl.test.ts`, `contrast.test.ts`                         |
| `--fout-vlak`            | `#FFE4E1` | `#FBE3E9` | volgt het koelere rood; fout-tekst erop haalt 6,18:1                                                                                             | `contrast.test.ts`                                              |

Aanbeveling: **doe de arcering in elk geval.** Dat is de grootste winst voor de
kleinste wijziging, en het is de kleur die het probleem van ADR-159 echt
veroorzaakt. De andere twee zijn een nette afronding en mogen wachten.

Wat **niet** verandert: koraal, de zes vakkleuren, indigo, groen, en elke maat,
radius en trefmaat. Zie hoofdstuk 5.2 voor waarom koraal blijft.

## 13 Gevolgen voor eerdere besluiten

- **ADR-154 (het logo is de levering `leernu-logo-denker`)** wordt teruggenomen
  als je het nieuwe logo wilt. Dat betekent: `logo.test.ts` gaat om,
  `src/design/kleuren.css` wordt opnieuw geleverd, en app-icoon, favicon,
  `public/og-image.png` en de sprite worden vervangen. Dat is een besluit, geen
  aanpassing. De Denkers zijn nieuw tekenwerk bovenop die levering.
- **ADR-171 (drie pagina's)** blijft staan, maar Premium verdwijnt uit de
  tabbalk onder 1200. Op 1280 blijft hij in de appbalk.
- **ADR-172 (Jij opnieuw ingedeeld)** wordt gedeeltelijk teruggenomen: het
  jaaroverzicht, de staafgrafiek per vak en de voorspelling over drie weken
  verhuizen naar Ouder. De kast blijft bovenaan, zoals ADR-172 besloot.
- **ADR-173 (de ouder is een profiel)** blijft; de wisselaar krijgt alleen de
  vorm van een schakelaar in plaats van een label.
- **ADR-093 en ADR-121 (de drie houdingen en het vakmenu)** worden teruggebracht
  tot twee houdingen; de aan het glas geplakte vakknop vervalt.
- **ADR-115 (Maak af)** blijft, maar het blok verhuist naar de bovenkant en
  vervangt dan de eerste kaart in plaats van eronder te staan.
- **ADR-159** blijft overeind en wordt strakker: koraal blijft de kleur van het
  merk en verder niets, en krijgt er een lijst merkmomenten bij.

## 14 Bouwvolgorde

1. De rondelayout, in één vak, met de vaste plek voor Volgende vraag. Daarna de
   andere vier vakken erop.
2. De navigatie: de tabbalk naar drie plekken, de vakknop weg, de wisselaar als
   schakelaar.
3. De vakpagina als één kaart met vier regels; de startbalk weg. Dit levert de
   meeste klassen op die vervallen.
4. Vandaag, daarna Jij, daarna Premium en Ouder.
5. De componenteninventaris opruimen in `src/index.css`, per familie, met
   `huisstijl.test.ts` als vangnet.
6. Het merk, als de eigenaar daarvoor kiest: eerst het besluit, dan de levering,
   dan de code.

## 15 Wat hier niet getekend is

Vijftien artboards is een grens, en die kost iets. Niet getekend: Premium en
Ouder op 1280 (ze volgen het paginaframe van Jij), de vakpagina's van Taal en
Vlaggen (hetzelfde patroon als Klok), de ronde voor klok, taal en vlaggen
(hetzelfde toneel), en het "zo niet"-blad is teruggebracht tot zes voorbeelden
op het logoblad. De componenteninventaris en de tokenvoorstellen staan als
tabel hierboven in plaats van als blad, omdat ze zo beter te lezen én te
gebruiken zijn.

Nieuwe teksten die nog niet in `src/i18n/nl.ts` staan en er dus bij horen als
dit gebouwd wordt: de zin onder de kop van Jij, de kop "Verder waar je was",
"Voor ouders", "Wat zit er niet in de basis?" en de regel bij een bijna
verlopen code. De rest van de teksten op de bladen komt uit `nl.ts`.

## 16 Wat ik aan jou vraag

1. **Het merk: ga je akkoord met een teken in plaats van Denker als logo?** Dat
   neemt ADR-154 terug. Zeg je nee, dan blijft het huidige logo staan en
   blijven de Denkers alsnog werken — ze zijn niet afhankelijk van het nieuwe
   teken.
2. **De Denkers: zes silhouetten of één lijf met zes kleuren?** Zes is rijker
   en duurder om te tekenen; één lijf is goedkoper en saaier.
3. **Het tokenvoorstel voor de arcering**: overnemen, of laten staan en het
   alleen bij de rolregel houden?
4. **Jij en Ouder**: ben je het eens dat het jaaroverzicht, de staafgrafiek en
   de voorspelling naar de ouder gaan? Dat neemt een deel van ADR-172 terug.
5. **Premium uit de tabbalk**: akkoord, of moet hij bereikbaar blijven als
   vierde plek?
