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

| Set                          | Items | Groep | Wat het kind beslist                           |
| ---------------------------- | ----- | ----- | ---------------------------------------------- |
| Onthoudwoorden: ei of ij     | 40    | 5–6   | ei of ij; je hoort het verschil niet           |
| Onthoudwoorden: au of ou     | 30    | 5–7   | au of ou; je hoort het verschil niet           |
| Onthoudwoorden: g of ch      | 30    | 7     | g of ch                                        |
| Onthoudwoorden: c of k       | 30    | 7     | c of k, vooral in woorden uit een andere taal  |
| D of t                       | 40    | 5–6   | de laatste letter; maak het woord langer       |
| Eén of twee klinkers         | 30    | 5–6   | a of aa, e of ee, o of oo, u of uu             |
| Eén of twee medeklinkers     | 30    | 5–6   | t of tt, k of kk en zo verder                  |
| Verkleinwoorden              | 40    | 5–6   | -je, -tje, -pje of -etje                       |
| Woorden op -ig               | 30    | 6–7   | -ig, niet „-ug” of „-ich”                      |
| Woorden op -lijk             | 30    | 6–7   | -lijk, niet „-luk” of „-lik”                   |

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

- De sets: `content/taal/spelling/*.json`, geladen door `src/content/loadTaal.ts`.
- De controle: `src/content/taal.content.test.ts` eist dat de letters in het
  gat bij de keuzes staan, dat elk woord één keer in zijn zin staat en nooit
  vooraan, dat geen id of woord dubbel voorkomt, en dat een paar dat
  hetzelfde klinkt niet dezelfde zin heeft.
