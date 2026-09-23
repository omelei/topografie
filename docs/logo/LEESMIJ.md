# leer.nu – logo Denker

Versie 2.0 · 22 september 2026

Denker is een zachte vorm met twee ogen die omhoog kijken naar een punt: het moment waarop je iets probeert te onthouden. Dezelfde punt staat in het woordbeeld leer.nu. Sinds versie 2 is Denker ook de mascotte van de app: met glans in de ogen, wenkbrauwen, een mond, wangen, een zacht verloop en armpjes voor gebaren.

Deze levering komt uit de Merk en stijlgids (`docs/leer.nu Merk en stijlgids.dc.html`) en wordt getekend door `tools/merk-uit-leer.mjs` uit `docs/leer.js`. Pas de tekening aan in `leer.js` en draai het script; retoucheer de bestanden hier niet met de hand (ADR-182).

## Inhoud

| Map | Bestanden | Gebruik |
|---|---|---|
| `logo/` | liggend, staand en alleen woordbeeld; elk in `kleur`, `cacao` en `wit` (SVG), plus PNG van de kleurversies | Kop van de app en website, e-mail, documenten |
| `beeldmerk/` | Denker los (`kleur`, `cacao`, `wit`) | Plaatsen waar het woordbeeld al in beeld staat |
| `beeldmerk/uitdrukkingen/` | denken, blij, juichen, bemoedigend, trots, slapen, zwaaien; elk ook als `-klein` | Terugkoppeling in de app |
| `app-icoon/` | `favicon.ico`, `favicon.svg`, PNG 16/32, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og-image.png` | Tabblad, beginscherm, delen via sociale media |
| `code/` | `kleuren.css`, `kleuren.json`, licentie Nunito | Inbouwen in de web-app |

Alle SVG's bestaan uitsluitend uit vormen. Er is geen lettertype nodig om het logo te tonen.

## Regels

- **Standaard:** het liggende logo in kleur, op room (`#FFF3E6`) of wit.
- **Donkere ondergrond:** de `wit`-versie. **Op koraal:** de `cacao`-versie.
- **Staand logo:** alleen waar weinig breedte is, zoals een inlog- of laadscherm.
- **Vrije ruimte:** rondom minstens de hoogte van de letter e.
- **Minimale grootte:** liggend logo 88 px breed; Denker los 24 px.
- **Onder 36 px:** de `-klein`-tekening. Mond, wenkbrauwen en wangen vallen weg; ogen en punt blijven.
- **Uitdrukkingen:** alleen als terugkoppeling in de app, nooit in plaats van het logo, en hooguit één per scherm. Denker staat naast een uitslag, nooit als de uitslag.
- **Niet doen:** kleuren omdraaien, vervormen, het woordbeeld in een ander lettertype zetten, of een uitdrukking tekenen die niet in `leer.js` staat.

## Kleuren

| Naam | Waarde | Gebruik |
|---|---|---|
| Koraal | `#FF6A4D` | Lijf van Denker, app-icoon, het merkvlak. Niet voor kleine tekst. |
| Koraal diep | `#C8412A` | Tekst en links op room of wit. |
| Cacao | `#2A1E17` | Ogen, punt, woordbeeld, lopende tekst. |
| Room | `#FFF3E6` | De ondergrond. |
| Zon | `#FFC93C` | Beloning en premium. |
