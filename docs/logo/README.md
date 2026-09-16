# leer.nu — logo

Het woordbeeld is _leernu_ in Hanken Grotesk 500, met _nu_ in de kleur van het
merk (ADR-147, vervangt het woordbeeld van ADR-113). Het beeldmerk is nog de
ring met een naaldje dat naar beneden in de ring wijst (ADR-113); de levering
van het woordbeeld bevat ook een nieuw beeldmerk, de zwaluw, dat nog niet in
de app staat.

## Kleuren

| naam   | waarde    | gebruik                                              |
| ------ | --------- | ---------------------------------------------------- |
| inkt   | `#1B2230` | _leer_, op papier                                    |
| ring   | `#385DB8` | _nu_, de ring en het naaldje; de grond van het icoon |
| papier | `#FFFFFF` | op inkt, en het merk uit het icoonvlak gespaard      |
| mos    | `#5B6A5E` | alleen in de uitwerking, niet in de app              |

Inkt, ring en papier zijn precies `--inkt`, `--merk` en `--kaart` uit
`src/index.css`. De ring draagt de actiekleur van de styleguide: het merk is
overal dezelfde en neemt nooit de kleur van een vak aan.

De levering in `png/` en de beeldmerken in `svg/` staan nog in de kleuren
waarin de ontwerper ze gaf. Dat is met opzet — dat is de levering. Wat het
product laadt staat in `public/logo/` en wordt door het script omgekleurd.

## Welk bestand wanneer

| bestand                                        | gebruik                                                   |
| ---------------------------------------------- | --------------------------------------------------------- |
| `svg/beeldmerk-inkt.svg` · `-papier`           | het beeldmerk los, vanaf 20 px                            |
| `svg/app-icoon.svg`                            | app-icoon: het merk in papier op een inktvlak             |
| `svg/leernu-woordbeeld-positief.svg`           | het woordbeeld: _leer_ in inkt, _nu_ in de ringkleur      |
| `svg/leernu-woordbeeld-wit.svg`                | het woordbeeld op inkt of indigo, zoals de app het tekent |
| `svg/leernu-woordbeeld-negatief.svg` · `-inkt` | zoals geleverd, niet in de app gebruikt                   |
| `svg/favicon.svg`                              | de favicon: de ring zonder naald (gegenereerd)            |
| `png/*`                                        | zoals geleverd: app-icoon, favicons, lockups, social      |
| `uitwerking/*.html`                            | de uitwerking van de ontwerper, met het lettertype erin   |

## Regels

- **Vrije ruimte** rond het woordbeeld: minimaal de x-hoogte.
- **Het domein** schrijf je altijd als leer.nu; alleen het woordbeeld is leernu.
- **Onder 20 px** verdwijnt het naaldje van het beeldmerk en blijft de ring
  over; dat houdt de favicon leesbaar.
- **Letterafstand** −0,028 em, gewicht 500.
- Het woordbeeld wordt niet in een ander lettertype nagetypt.

## Het woordbeeld als paden

De ontwerper leverde het woordbeeld al als paden. De twee paden (_leer_ en _nu_)
staan overgenomen in `src/design/woordbeeld.ts`, en `logo.test.ts` houdt ze aan
de bestanden hier. Een nieuwe levering: de SVG's in `svg/` vervangen en de
paden opnieuw overnemen.

`tools/logo/maak-logo.py` schrijft `src/design/logo.ts` (het beeldmerk), de
favicon, de iconen en de sociale kaart in `public/logo/`. Nooit met de hand
aanpassen: het script opnieuw draaien.

```
python tools/logo/maak-logo.py
```
