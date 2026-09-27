# leer.nu – logo Denker

Versie 3.0 · 27 september 2026

Denker is een zachte, ronde vorm met twee grote ogen die omhoog kijken: het moment waarop je iets probeert te onthouden. Sinds versie 3 (stijl Strip) heeft hij witte ogen met een pupil in nacht, oogleden voor de gevoelige uitdrukkingen, en geen losse punt en geen wenkbrauwen meer. De punt staat nog in het woordbeeld leer.nu. Denker is het beeldmerk én de mascotte van de app, met elf uitdrukkingen.

Deze levering komt uit het herontwerp van Denker (stijl Strip) en de Merk en stijlgids (`docs/leer.nu Merk en stijlgids.dc.html`), en wordt getekend door `tools/merk-uit-leer.mjs` uit `docs/leer.js`. Pas de tekening aan in `leer.js` en draai het script; retoucheer de bestanden hier niet met de hand (ADR-182, ADR-237).

## Inhoud

| Map | Bestanden | Gebruik |
|---|---|---|
| `logo/` | liggend, staand en alleen woordbeeld; elk in `kleur`, `cacao` en `wit` (SVG), plus PNG van de kleurversies | Kop van de app en website, e-mail, documenten |
| `beeldmerk/` | Denker los: `denker.svg` en `denker.png`, één versie voor elke ondergrond | Plaatsen waar het woordbeeld al in beeld staat |
| `beeldmerk/uitdrukkingen/` | denken, blij, juichen, bemoedigend, trots, slapen, zwaaien, verdrietig, jaloers, verbaasd, verward; elk ook als `-klein` | Terugkoppeling in de app |
| `app-icoon/` | `favicon.ico`, `favicon.svg`, PNG 16/32, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og-image.png` | Tabblad, beginscherm, delen via sociale media |
| `code/` | `kleuren.css`, `kleuren.json`, licentie Nunito | Inbouwen in de web-app |

Alle SVG's bestaan uitsluitend uit vormen, behalve de z's van `slapen` en het vraagteken van `verward`: die staan in Baloo 2, met Arial Rounded en een schreefloze letter als terugval. Voor het logo zelf is geen lettertype nodig.

## Regels

- **Standaard:** het liggende logo in kleur, op room (`#FFF3E6`) of wit.
- **Donkere ondergrond:** de `wit`-versie. **Op koraal:** de `cacao`-versie. Denker zelf is in alle drie gelijk; alleen het woordbeeld verandert van kleur.
- **Staand logo:** alleen waar weinig breedte is, zoals een inlog- of laadscherm.
- **Vrije ruimte:** rondom minstens de hoogte van de letter e.
- **Minimale grootte:** liggend logo 88 px breed; Denker los 24 px.
- **Onder 36 px:** de `-klein`-tekening. Glans, wangen, schaduw en de lichtjes in de ogen vallen weg; ogen, mond en armen blijven.
- **Uitdrukkingen:** alleen als terugkoppeling in de app, nooit in plaats van het logo, en hooguit één per scherm. Denker staat naast een uitslag, nooit als de uitslag.
- **Verdrietig en jaloers** gaan nooit over wat een kind deed of kon. Na een fout is Denker bemoedigend, niet verdrietig.
- **Niet doen:** kleuren omdraaien, vervormen, het woordbeeld in een ander lettertype zetten, of een uitdrukking tekenen die niet in `leer.js` staat.

## Uitdrukkingen

| Uitdrukking | Gebaar | Waar |
|---|---|---|
| `denken` | pupillen omhoog, knippert | Standaard, tijdens de vraag, laden; ook het beeldmerk |
| `blij` | knippert | Ronde klaar, lege staten |
| `juichen` | armen omhoog, springt | Goed antwoord, diploma gehaald |
| `bemoedigend` | duim omhoog, halfdichte ogen | Fout of bijna: "dat komt nog" |
| `trots` | armen in de zij, ogen dicht van plezier | Diploma, prijzenkast |
| `slapen` | ademt, z's stijgen op | Pauze, terugkomst, laat |
| `zwaaien` | zwaait | Welkom, profiel wisselen |
| `verdrietig` | traan, hangende oogleden | Iets is weg of mislukt dat niet aan het kind ligt, zoals een verbinding |
| `jaloers` | armen over elkaar, gluurt opzij | Speels, alleen in een spel of verhaal; nooit bij voortgang of een ander kind |
| `verbaasd` | grote ogen, schrikt op | Iets nieuws of onverwachts: een nieuw vak, een verrassing |
| `verward` | wiebelt, vraagteken | Er ging iets mis: een scherm of kaart die niet laadt |

Bij "Minder beweging" (`prefers-reduced-motion` of rustig in de app) staan ze stil; de z's, de traan en het vraagteken blijven dan zichtbaar.

## Kleuren

| Naam | Waarde | Gebruik |
|---|---|---|
| Koraal | `#FF6A4D` | Lijf van Denker, app-icoon, het merkvlak. Niet voor kleine tekst. |
| Koraal diep | `#C8412A` | Tekst en links op room of wit. |
| Cacao | `#2A1E17` | Woordbeeld, lopende tekst, de schaduw onder Denker. |
| Nacht | `#1B2A5E` | Pupillen, oogrand, mond en lijnen van Denker. Alleen in de tekening. |
| Room | `#FFF3E6` | De ondergrond. |
| Zon | `#FFC93C` | Beloning en premium. |

In de tekening staan verder: wangen `#FF3D6E` op 28%, oogleden `#F4603F`, de rand van de armen `#D94A30`, de tong `#FF7A8A` en de traan `#7CC6FF`.
