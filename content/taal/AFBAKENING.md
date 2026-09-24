# Welke woorden, en waarom

Peildatum: **13 september 2026**. Ontwerp van de module besproken met de
product owner; zie ADR-118. De items zijn aan de product owner voorgelegd
voordat ze in de app kwamen. Niet aanpassen "ter verbetering": een woord
toevoegen of weghalen is een inhoudelijke beslissing, geen onderhoud.

## Voor wie

Kinderen van **groep 5 tot en met 7**: dat is de leeftijd van de kinderen die
de eerste versie testen. Elk item heeft een veld `groep` met het jaar waarin
het op school meestal langskomt. Dat veld is een ordening, geen grens: het
bepaalt niets wat een kind wel of niet mag oefenen.

## De norm

Voor de spelling is de **Woordenlijst Nederlandse Taal** (het Groene Boekje)
de norm. Waar we twijfelden over een woord, hebben we het weggelaten. Er staan
alleen gewone woorden in die een kind van die leeftijd kent en gebruikt.

We claimen **geen aansluiting op een methode of een kerndoel** (ADR-011). De
indeling in onthoudwoorden, d of t, één of twee en woordeinden is de indeling
die op basisscholen gebruikelijk is; de woorden zijn door ons gekozen. De
leerdoelen staan in `content/leerdoelen.json`, met `kerndoelRefs` leeg.

## De zinnen

Elk woord staat in een zin, ook bij het flitsdictee. De zinnen zijn kort en
op het niveau van ongeveer AVI-M6. Er staan geen echte personen in, geen
merken en niets engs. Het woord staat precies één keer in de zin en nooit
vooraan, zodat een hoofdletter nooit iets verraadt.

Klinkt een woord hetzelfde als een ander woord, dan maakt de zin duidelijk
welk van de twee bedoeld is, en het item noemt het andere woord in
`klinktAls`: **wei** en **wij**, **hard** en **hart**.

## Spelling: tien sets

| Set                      | Items | Groep | Wat het kind beslist                          |
| ------------------------ | ----- | ----- | --------------------------------------------- |
| Onthoudwoorden: ei of ij | 40    | 5–6   | ei of ij; je hoort het verschil niet          |
| Onthoudwoorden: au of ou | 30    | 5–7   | au of ou; je hoort het verschil niet          |
| Onthoudwoorden: g of ch  | 30    | 7     | g of ch                                       |
| Onthoudwoorden: c of k   | 30    | 7     | c of k, vooral in woorden uit een andere taal |
| D of t                   | 40    | 5–6   | de laatste letter; maak het woord langer      |
| Eén of twee klinkers     | 30    | 5–6   | a of aa, e of ee, o of oo, u of uu            |
| Eén of twee medeklinkers | 30    | 5–6   | t of tt, k of kk en zo verder                 |
| Verkleinwoorden          | 40    | 5–6   | -je, -tje, -pje of -etje                      |
| Woorden op -ig           | 30    | 6–7   | -ig, niet „-ug” of „-ich”                     |
| Woorden op -lijk         | 30    | 6–7   | -lijk, niet „-luk” of „-lik”                  |

Samen **330 woorden**. De Spellingmix is geen eigen bestand: het zijn deze
330 onder één naam (ADR-062).

**Wat een kind te zien krijgt.** Bij _Kies de letters_ staan alleen de
letters die ertoe doen als knoppen: [ei] [ij], [d] [t], [je] [tje] [pje]
[etje]. Nooit een heel woord in een foute spelling: een kind dat een fout
woordbeeld ziet, onthoudt dat ook. Daarom is er ook geen woord waarbij het gat
het hele woord is (het woord **ei** staat er om die reden niet in).

**De hulp.** Bij d of t staat bij elk woord het langere woord waarin je de
letter hoort (hond, **honden**). Bij één of twee staat het woord in stukjes
(**bo-men**, **kat-ten**). Dat is wat na een fout antwoord en bij Ontdekken
staat.

## Werkwoorden: drie sets

| Set                | Items | Groep | Wat het kind beslist                                               |
| ------------------ | ----- | ----- | ------------------------------------------------------------------ |
| Tegenwoordige tijd | 40    | 6     | d, t of dt bij ik, jij en hij, ook met jij áchter het werkwoord    |
| Verleden tijd      | 30    | 7     | -te of -de, -ten of -den (’t kofschip)                             |
| Voltooid deelwoord | 30    | 7     | ge- + stam + t of d; geen ge- na be-, ver-, ont-, her-, ge- en er- |

Samen **100 zinnen**. De Werkwoordmix is deze 100 onder één naam.

**Uitgerekend, niet overgeschreven.** Elk zwak werkwoord in de content wordt in
de contenttest opnieuw uitgerekend door `werkwoordsvorm()` in game-core. Staat
er in een bestand een vorm die de regels niet maken, dan faalt de build.

**Sterke werkwoorden** staan in `sterke-werkwoorden.json`, met hun verleden
tijd en voltooid deelwoord: eten, houden, lachen (lachte, maar gelachen),
lopen, rijden, vinden, weten, worden en zitten. Alleen een item waarvan het
antwoord uit die lijst komt, heet `sterk`. De tegenwoordige tijd van al deze
werkwoorden is gewoon: hij wordt, hij vindt, hij rijdt.

**Wat een kind te zien krijgt.** Bij _Kies de vorm_ staan drie vormen, en alle
drie bestaan: bij "Hij ▢ morgen tien" zijn dat word, wordt en werd. Nooit een
fout gespelde vorm als wort of fietsde. Vallen twee vormen samen (ik zet, hij
zet), dan komt er een andere echte vorm bij.

**Wat er in werkwoorden bewust niet in staat:**

- **Scheidbare werkwoorden** (opbellen, opgebeld): die komen later.
- **Leenwoorden met de klemtoon op -eren** (proberen, studeren): een regel
  hoort de klemtoon niet, en de stam is dan anders dan bij luisteren.
- **Werkwoorden die met er-, be- of ver- beginnen zonder dat het een
  voorvoegsel is** (ergeren, geërgerd): de regel voor ge- zou daar een fout
  maken.
- **De tegenwoordige tijd van onregelmatige werkwoorden** (zijn, hebben,
  kunnen, gaan): die volgen geen regel voor d, t of dt.

## Wat er bewust niet in staat

- **Woorden met een apostrof of een trema** in de spellingsets (opa’s, zeeën):
  die regels horen bij een latere set.
- **Scheidbare en samengestelde woorden** als onderwerp; ze komen hooguit in
  een zin voor.
- **Woorden die op twee manieren goed zijn** (bloempje en bloemetje): een
  meerkeuzevraag met twee goede antwoorden is geen vraag.
- **Eigen woordenlijsten** (het blaadje van school overtypen): niet in deze
  stap.

## Waar het in de code staat

- De sets: `content/taal/spelling/*.json` en `content/taal/werkwoorden/*.json`,
  geladen door `src/content/loadTaal.ts`; de sterke werkwoorden in
  `content/taal/sterke-werkwoorden.json`.
- De controle: `src/content/taal.content.test.ts` eist dat de letters in het
  gat bij de keuzes staan, dat elk woord één keer in zijn zin staat en nooit
  vooraan, dat geen id of woord dubbel voorkomt, dat een paar dat hetzelfde
  klinkt niet dezelfde zin heeft, en dat elke zwakke werkwoordsvorm is wat
  `werkwoordsvorm()` ervan maakt.
- Engels staat in `content/taal/engels/`; zie hieronder.

## Engels: elf sets (ADR-217)

Peildatum: **24 september 2026**. Voor **groep 7 en 8**, de jaren waarin
Engels op de meeste basisscholen woordjes leren is. Het kind krijgt het
Nederlandse woord en schrijft of kiest het Engelse, in een korte Engelse zin.
De woorden staan in de PR ter beoordeling bij de product owner, net als de
spelling toen.

| Set         | Items | Groep | Voorbeeld                     |
| ----------- | ----- | ----- | ----------------------------- |
| getallen    | 16    | 7     | twaalf: twelve                |
| dagen       | 18    | 7     | woensdag: Wednesday, mei: May |
| kleuren     | 14    | 7     | grijs: grey                   |
| kleding     | 16    | 8     | trui: jumper                  |
| familie     | 16    | 7     | oma: grandmother              |
| lichaam     | 17    | 7     | knie: knee                    |
| dieren      | 18    | 7     | konijn: rabbit                |
| eten        | 17    | 7     | aardappel: potato             |
| huis        | 17    | 8     | badkamer: bathroom            |
| school      | 16    | 8     | liniaal: ruler                |
| werkwoorden | 18    | 8     | zwemmen: swim                 |

**Brits Engels** is de norm, zoals op school: colour, grey, favourite,
trousers. Waar het Amerikaans anders is, telt dat ook goed (`aliassen`: color,
gray, pants). Een paar gewone tweede woorden tellen ook: grandpa naast
grandfather, tummy naast belly.

**Wat goed telt.** Hoofdletters tellen niet (monday is goed), en een lidwoord
of "to" ervoor ook niet: "a dog", "the dog" en "to walk" zijn goed. Verder is
het streng, zoals bij spelling: één letter anders is fout.

**Wat er bewust niet in staat.**

- Woorden die in beide talen hetzelfde zijn (winter, april, lamp, arm, bed):
  daar valt niets te leren.
- Nederlandse woorden met twee gewone vertalingen (kijken: look of watch, neef:
  cousin of nephew, bank: bank of sofa): één vraag, één antwoord.
- Zinnen en grammatica: dit is woordenschat, geen Engels als vak.

De controle staat in `src/content/taal.content.test.ts`: elk Engels woord één
keer in zijn zin en nooit vooraan, geen Nederlands of Engels woord dubbel, geen
woord dat in beide talen gelijk is, en vier verschillende keuzes uit dezelfde
set.
