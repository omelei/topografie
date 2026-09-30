# Groep 1 en 2

Het plan voor kinderen uit groep 1 en 2 (ADR-244): wat er komt, in welke
volgorde, en wat er eerst gemeten wordt. Wat er gebouwd is, staat in ADR-244;
dit blad is het plan eromheen en de opnamelijst voor de stem.

## Waarom anders dan groep 3 tot en met 8

Een kind uit groep 1 of 2 is geen jongere versie van een kind uit groep 5. Het
verschil stuurt elke keuze hieronder.

- **Het leest niet en typt niet.** Elke vraag wordt voorgelezen, en antwoorden
  gaat met één tik op een groot vlak.
- **Het heeft geen toets en geen lijst van school.** Kleuters leren al spelend.
  Een oefentoets, een cijfer en een toetsdatum horen hier niet.
- **Een ouder zet het klaar en leest mee.** Naam, groep en de keuze van een vak
  doet meestal de ouder.
- **Een ronde is kort.** 5 of 6 vragen, een paar minuten.
- **Wat telt, is de stap naar groep 3.** Getalbegrip en klankbewustzijn zijn
  goede voorspellers van hoe rekenen en lezen in groep 3 gaan. Dat is ook de
  stof waar leer.nu voor groep 3 al op aansluit: plussommen tot 20, splitsen tot
  10 en hele uren.

We claimen geen aansluiting op een leerlijn of leesmethode (ADR-011). De
indeling per groep is van ons, net als in `content/schoolgroepen.json`.

## Stap 0: meten (ADR-244)

Groep 1 en 2 staan in de groepsvraag. Een kind uit groep 1 of 2 krijgt op
Vandaag te lezen dat er iets aankomt, en kan elk vak kiezen. De teller telt de
keuze als `groep` met `/1` of `/2` (ADR-243). Bij het uitlezen van de teller
kiest de eigenaar of fase 1 gebouwd wordt.

## De oefeningen

### Rekenen: tellen en getallen (fase 1)

| Onderwerp                 | Groep                  | Vraag (drie keuzes, tikken)                                 | Items   | Nodig                  |
| ------------------------- | ---------------------- | ----------------------------------------------------------- | ------- | ---------------------- |
| Hoeveel zie je?           | 1: tot 5; 2: tot 10    | Stippen of dingen; tik het goede aantal                     | 5 / 10  | tekening in code       |
| Getalbeelden              | 1 en 2                 | Dobbelsteen, vingers of rekenrek herkennen zonder te tellen | ~20     | tekening in code       |
| Cijfers                   | 1: 0 tot 10; 2: tot 20 | Hoor "zeven", tik 7; of zie 7, tik de goede hoeveelheid     | 11 / 21 | stem                   |
| Meer, minder, evenveel    | 1 en 2                 | Twee groepjes; tik waar er meer zijn                        | ~20     | tekening in code       |
| Wat komt erna?            | 2                      | 4, 5, ▢                                                     | ~20     | tekening in code, stem |
| Hoeveel zijn er verstopt? | 2                      | 5 stippen, 2 te zien: hoeveel onder het doekje?             | ~10     | tekening in code       |

"Hoeveel zijn er verstopt?" is de opstap naar splitsen tot 10 in groep 3.

### Taal: klanken en woorden (fase 2 en 3)

| Onderwerp         | Groep                | Vraag                           | Items       | Fase |
| ----------------- | -------------------- | ------------------------------- | ----------- | ---- |
| Klappen           | 1 en 2               | Hoor "olifant", tik 3           | ~40 woorden | 2    |
| Rijmen            | 1 en 2               | Wat rijmt op kat? Drie plaatjes | ~30 paren   | 2    |
| Beginklank        | 2                    | Welk plaatje begint met /m/?    | ~12 klanken | 3    |
| Hakken en plakken | 2                    | Hoor v‑i‑s, tik het plaatje     | ~30 woorden | 3    |
| Letterklanken     | 2, eind van het jaar | Hoor /s/, tik de s              | 10 tot 15   | 3    |

Fase 3 vraagt losse klanken. Een browserstem zegt "em" waar het /m/ moet zijn,
dus die worden ingesproken.

### Bewust niet

- **Vormen en kleuren:** te weinig om te herhalen.
- **Topografie, vlaggen en de klok:** hele uren blijft groep 3.
- **Letters schrijven:** dat is motoriek, geen scherm.
- **Het hele alfabet en leren lezen:** dat doet groep 3, met de methode van de
  school.

## De kleuterstand

Voor een kind in groep 1 of 2 werkt de app anders. Dit komt in fase 1.

- **Alles gesproken, vanzelf.** Een ingesproken stem uit `public/`, geen
  browserstem en geen dienst van buiten (ADR-128). Een luidsprekerknop speelt
  de vraag opnieuw.
- **Alleen tikken:** grote vlakken, drie keuzes, geen tekst die gelezen moet
  worden om te kunnen antwoorden.
- **Uit:** zelf typen, bliksemronde, overleven, toetsstand en cijfers.
- **Terugkoppeling zonder tekst:** "Goed!" gesproken, en na een fout telt de
  stem samen met het kind na. Geen rood kruis.
- **Rondes van 5 of 6**, met het herhaalsysteem eronder zoals overal.
- **Vandaag:** één grote knop met de ronde van vandaag.
- **Diploma's blijven**, om te printen: "Ik kan tellen tot 10".

De schrijfwijzer is geschreven voor kinderen van 8 tot 12. Fase 1 voegt er een
deel aan toe voor gesproken tekst voor kleuters.

## Gratis en premium

Akkoord van de eigenaar op 29 september. Bij kleuters is bijna alles
meerkeuze, dus de grens van ADR-192 (meerkeuze en ontdekken zijn gratis) zou
alles gratis maken. Daarom hier:

- **Gratis:** alle onderwerpen voor groep 1 en 2.
- **Premium:** herhalen en het dagplan, de diploma's, en wat een ouder ziet over
  wat het kind beheerst.

Dit wordt gebouwd in fase 1, met een eigen ADR.

## De stem: opnamelijst voor fase 1

De eigenaar spreekt de stem in. Zo gaat het het makkelijkst:

- **Waar:** een stille kamer met gordijnen of een kast vol kleren; geen
  keuken of badkamer.
- **Waarmee:** een telefoon met de standaard-app voor spraakmemo's, op 20 tot
  30 centimeter van je mond, iets onder je kin.
- **Hoe:** rustig, vriendelijk, iets langzamer dan normaal. Eén bestand per
  regel, met een halve seconde stilte ervoor en erna.
- **Naam van het bestand:** de code uit de eerste kolom, bijvoorbeeld
  `getal-07.m4a`. Elk formaat is goed; het wordt daarna omgezet en even hard
  gemaakt.

### Getallen (21)

`getal-00` tot en met `getal-20`: "nul", "één", "twee", … "twintig". Los
uitgesproken, zonder toon van een vraag. Ze worden ook gebruikt om samen na te
tellen.

### Waar is …? (21)

`waar-00` tot en met `waar-20`: "Waar is nul?", "Waar is één?", …
"Waar is twintig?".

### Vragen en terugkoppeling (13)

| Code                | Tekst                       |
| ------------------- | --------------------------- |
| `vraag-hoeveel`     | Hoeveel zie je?             |
| `vraag-meer`        | Waar zijn er meer?          |
| `vraag-minder`      | Waar zijn er minder?        |
| `evenveel`          | Evenveel.                   |
| `vraag-erna`        | Welk getal komt erna?       |
| `vraag-ervoor`      | Welk getal komt ervoor?     |
| `vraag-verstopt`    | Hoeveel zijn er verstopt?   |
| `vraag-hoeveelheid` | Waar zijn er zoveel?        |
| `goed`              | Goed!                       |
| `samen-tellen`      | Kijk, we tellen samen.      |
| `nog-een`           | Nog eentje.                 |
| `klaar`             | Klaar! Goed gedaan.         |
| `welkom`            | Hoi! Zullen we gaan tellen? |

55 korte opnames, een uur werk met pauzes. De lijsten voor fase 2 en 3
(woorden en losse klanken) volgen als fase 1 staat.

## De plaatjes

Claude tekent ze, als SVG in de huisstijl ([HUISSTIJL.md](HUISSTIJL.md)): de
kleuren uit `src/index.css`, ronde vormen en de harde onderkant, en Denker waar
een figuur nodig is.

- **Fase 1:** alleen wat te tellen is. Stippen, een dobbelsteen, vingers, een
  rekenrek en vijf eenvoudige dingen (appel, vis, ster, bal, blad), en een
  doekje voor "verstopt". Alles tekent zich in code, dus zonder losse
  bestanden.
- **Fase 2:** ongeveer 70 woordplaatjes voor klappen en rijmen: eenduidige
  dingen die een kind van 4 herkent (kat, maan, vis, huis, boom). De woordenlijst
  wordt eerst met de eigenaar gekozen.
