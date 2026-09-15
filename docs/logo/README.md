# leer.nu — logo

Uitwerking 3a: Hanken Grotesk met een rondje (ADR-113). Het woordbeeld is
_leer_, het beeldmerk, _nu_. Het beeldmerk is een ring met een naaldje dat naar
beneden in de ring wijst.

## Kleuren

| naam   | waarde    | gebruik                                        |
| ------ | --------- | ---------------------------------------------- |
| inkt   | `#1B2230` | de letters, op papier                          |
| ring   | `#385DB8` | de ring en het naaldje; de grond van het icoon |
| papier | `#FFFFFF` | op inkt, en het merk uit het icoonvlak gespaard |
| mos    | `#5B6A5E` | alleen in de uitwerking, niet in de app        |

Inkt, ring en papier zijn precies `--inkt`, `--merk` en `--kaart` uit
`src/index.css`. De ring draagt de actiekleur van de styleguide: het merk is
overal dezelfde en neemt nooit de kleur van een vak aan.

De levering in `png/` en de beeldmerken in `svg/` staan nog in de kleuren
waarin de ontwerper ze gaf. Dat is met opzet — dat is de levering. Wat het
product laadt staat in `public/logo/` en wordt door het script omgekleurd.

## Welk bestand wanneer

| bestand                              | gebruik                                           |
| ------------------------------------ | ------------------------------------------------- |
| `svg/beeldmerk-inkt.svg` · `-papier` | het beeldmerk los, vanaf 20 px                    |
| `svg/app-icoon.svg`                  | app-icoon: het merk in papier op een inktvlak     |
| `svg/woordbeeld-inkt.svg` · `-papier` | het woordbeeld als paden (gegenereerd, zie onder) |
| `svg/favicon.svg`                    | de favicon: de ring zonder naald (gegenereerd)    |
| `png/*`                              | zoals geleverd: app-icoon, favicons, lockups, social |
| `uitwerking/*.html`                  | de uitwerking van de ontwerper, met het lettertype erin |

## Regels

- **Vrije ruimte**: rondom de diameter van het rondje.
- **Het rondje** staat op de x-hoogte, niet op de kaslijn, en net boven de
  basislijn.
- **Onder 20 px** verdwijnt het naaldje en blijft de ring over; dat houdt de
  favicon leesbaar.
- **Letterafstand** −0,02 em, gewicht 600; het rondje is 0,48 em.
- Het woordbeeld wordt niet in een ander lettertype nagetypt.

## Het woordbeeld als paden

De ontwerper leverde het woordbeeld als afbeelding, gezet in Hanken Grotesk. De
app laadt geen lettertype van een ander domein, dus snijdt
`tools/logo/maak-logo.py` het woordbeeld uit tot paden, uit het lettertype dat
in `uitwerking/leer-nu-logo-uitwerking.html` zit ingebed (SIL Open Font
License). Het script schrijft ook `src/design/logo.ts`, de favicon en de
iconen in `public/logo/`. Nooit met de hand aanpassen: het script opnieuw
draaien.

```
python tools/logo/maak-logo.py
```
