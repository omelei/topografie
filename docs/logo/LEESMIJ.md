# leer.nu – logo Denker

Versie 1.0 · 17 september 2026

Denker is een zachte vorm met twee ogen die omhoog kijken naar een punt: het moment waarop je iets probeert te onthouden. Dezelfde punt staat in het woordbeeld leer.nu.

## Inhoud

| Map | Bestanden | Gebruik |
|---|---|---|
| `logo/` | liggend, staand en alleen woordbeeld; elk in `kleur`, `cacao` en `wit` (SVG), plus PNG van de kleurversies | Kop van de app en website, e-mail, documenten |
| `beeldmerk/` | Denker los (`kleur`, `cacao`, `wit`) | Plaatsen waar het woordbeeld al in beeld staat |
| `beeldmerk/uitdrukkingen/` | onthouden, goed-gedaan, iets-nieuws, oefenen, pauze | Terugkoppeling in de app |
| `app-icoon/` | `favicon.ico`, `favicon.svg`, PNG 16/32, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og-image.png` | Tabblad, beginscherm, delen via sociale media |
| `code/` | `denker-sprite.svg`, `kleuren.css`, `kleuren.json`, licentie Nunito | Inbouwen in de web-app |

Alle SVG's bestaan uitsluitend uit vormen. Er is geen lettertype nodig om het logo te tonen.

## Regels

- **Standaard:** het liggende logo in kleur, op room (`#FFF7EF`) of wit.
- **Donkere ondergrond:** de `wit`-versie. **Op koraal:** de `cacao`-versie.
- **Staand logo:** alleen waar weinig breedte is, zoals een inlog- of laadscherm.
- **Vrije ruimte:** rondom minstens de hoogte van de letter e.
- **Minimale grootte:** liggend logo 88 px breed; Denker los 24 px. Kleiner dan 24 px: gebruik `favicon.svg` (grotere ogen, zonder punt).
- **Uitdrukkingen:** alleen als terugkoppeling in de app, nooit in plaats van het logo, en hooguit één per scherm.
- **Niet doen:** kleuren omdraaien, vervormen, schaduwen of kleurverlopen toevoegen, een mond, armen of benen toevoegen, andere uitdrukkingen tekenen of het woordbeeld in een ander lettertype zetten.

## Kleuren

| Naam | Waarde | Gebruik |
|---|---|---|
| Koraal | `#FF6A4D` | Lijf van Denker, app-icoon, accenten. Niet voor kleine tekst. |
| Koraal diep | `#C8412A` | Alleen tekst en links op room of wit (contrast 4,7:1). |
| Cacao | `#2A1E17` | Ogen, punt, woordbeeld, lopende tekst. |
| Room | `#FFF7EF` | Rustige achtergrond. |

## Inbouwen in de web-app

1. Zet de bestanden uit `app-icoon/` in de publieke hoofdmap van de site.
2. Neem deze regels op in `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#FFF7EF">
<meta property="og:image" content="https://www.leer.nu/og-image.png">
```

3. Het logo in de kop:

```html
<a href="/" class="logo"><img src="/logo/leernu-logo-liggend-kleur.svg" alt="leer.nu" height="36"></a>
```

4. Een uitdrukking van Denker (zet `code/denker-sprite.svg` in de publieke map):

```html
<svg class="denker" width="72" height="72" aria-hidden="true">
  <use href="/denker-sprite.svg#denker-goed-gedaan"></use>
</svg>
```

De kleuren volgen de CSS-variabelen `--denker-lijf`, `--denker-oog` en `--denker-punt` uit `code/kleuren.css`. Beschikbare namen: `denker-onthouden`, `denker-goed-gedaan`, `denker-iets-nieuws`, `denker-oefenen`, `denker-pauze`.

## Opdracht voor Claude Code

> Vervang in leer.nu het huidige logo en de favicons door de bestanden uit de map `leernu-logo-denker`.
> 1. Kopieer alle bestanden uit `app-icoon/` en `code/denker-sprite.svg` naar de publieke hoofdmap; kopieer `logo/` naar `/logo/`.
> 2. Vervang bestaande favicon-, apple-touch-icon- en manifestverwijzingen in `<head>` door de regels uit LEESMIJ.md, stap 2. Verwijder oude icoonbestanden die niet meer worden gebruikt.
> 3. Vervang het logo in de kop door `logo/leernu-logo-liggend-kleur.svg` met `alt="leer.nu"`: 32 px hoog op mobiel, 40 px vanaf 768 px breed. Gebruik op donkere vlakken de `wit`-versie.
> 4. Voeg `code/kleuren.css` toe aan de globale stijlen. Wijzig het bestaande kleurenpalet van de app niet; dat is een aparte beslissing.
> 5. Controleer: favicon zichtbaar in het tabblad, geen manifestfouten in DevTools › Application, logo scherp op 1x en 2x.

## Vóór publiek gebruik

- Laat bij het BOIP controleren of het beeldmerk en de naam niet te veel lijken op bestaande merken in klasse 9 en 41.
- Het woordbeeld is gebaseerd op Nunito ExtraBold (SIL Open Font License 1.1, zie `code/NUNITO-OFL.txt`) en omgezet naar vormen. Dat is toegestaan. Voor koppen in de app kan Nunito zelf worden gebruikt.
