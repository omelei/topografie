# Huisstijl

De huisstijl van leer.nu komt uit de overdracht `design_handoff_leernu` (in
`topo-prive`, README onder "Ontwerptokens"). De waarden daarin zijn definitief.
Dit blad zegt hoe je een scherm bouwt dat erbij hoort; ADR-109 zegt waarom het
zo staat, ADR-112 wat daarna is gelijkgetrokken.

## Waar de waarden staan

- **`src/index.css`** is de enige plek die een kleur, lettertype of maat van de
  huisstijl noemt. Bovenaan staat `:root` met de tokentabel van de overdracht,
  daaronder de telefoon, VO, de modules en het blok `[data-thema='ronde']`.
- **`tailwind.config.ts`** vertaalt de tokens naar klassen. Kleuren, fonts,
  radii, schaduwen en de typeschaal _vervangen_ Tailwinds eigen waarden:
  `bg-blue-500`, `rounded-lg`, `shadow-md` en `font-serif` bestaan hier niet.

## Een nieuw scherm

1. **Kleur op rol, niet op waarde.** `bg-papier` voor de grond van een scherm,
   `bg-kaart` voor een kaart of paneel, `text-inkt`, `text-tekst-secundair`,
   `text-tekst-tertiair`, `border-rand-licht` voor een kaart en
   `border-rand-bediening` voor de rand van iets dat je kunt indrukken.
2. **Typografie op rol.** Eén maat per rol, op elk scherm:

   | rol                                      | klasse                          | maat (PO)  |
   | ---------------------------------------- | ------------------------------- | ---------- |
   | paginatitel (`h1`)                       | `tk-titel`                      | 40 (tel 24) |
   | zin onder de titel                       | `text-lopend text-tekst-secundair` | 16      |
   | sectiekop (`h2`)                         | `tk-sectie`                     | 20         |
   | titel van een kaart                      | `tk-kaart-titel`                | 20         |
   | titel van een rij, tegel, chip of knop   | `tk-lijstrij-titel`, `text-knop` | 17        |
   | regel onder een rij of tegel             | `tk-lijstrij-regel`, `tk-hulp`  | 14         |
   | getal in een tegel                       | `tk-cijfer-getal`               | 28         |
   | label boven een waarde of een kaart      | `tk-label`                      | 13, kapitaal |
   | de vraag in een ronde                    | `text-vraag`                    | 32 (tel 24) |

   Archivo voor koppen en getallen, Public Sans voor al het andere. Het gewicht
   hoort bij de rol: zet er geen `font-semibold` of `font-bold` naast.
3. **Vorm.** `rounded-kaart` (12) voor kaarten, knoppen en velden,
   `rounded-chip` (6) voor een chip, optie of plaat, `rounded-pil` voor een pil.
   Randen zijn 1 px (`border-hair`), 2 px (`border-active`) alleen bij nadruk of
   een gekozen staat. Geen schaduw, behalve `drop-shadow-beloning` op een
   beloningsafbeelding.
4. **Bouwstenen.** Een sectie is een `h2.tk-sectie` met eronder de inhoud; een
   lijst is `ul.tk-lijst` met `tk-lijstrij` per rij (plaat, titel, regel, stand,
   pijl); getallen zijn `dl.tk-cijfers` met een `tk-cijfer` per tegel; wat je
   kunt verdienen draagt een `Embleem`.
5. **Trefmaten.** Een knop is `h-knop` (56 in PO, 44 in VO). Het kleinste dat
   iets indrukbaars mag zijn is `raak`: 44 onder een muis, 48 op een tablet, 56
   onder een duim en altijd 56 in een ronde. Nooit een vaste maat eronder.
6. **De kleur van een vak.** Binnen een vak — de vakpagina, de ronde, de rail,
   de uitslag — draagt wat gekozen is de kleur van dat vak: zet
   `data-module` en `data-accent="module"` op de wortel. Daarbuiten is het accent
   het groen van de overdracht. Goed is altijd groen en fout altijd rood,
   in welk vak ook.
7. **Een ronde is licht.** Zet `data-thema="ronde"` op de wortel van een scherm
   waarin een kind antwoordt: dat zet de trefmaten op 56. De kleuren zijn die
   van de rest van de app (ADR-112); de vraag en de kaart staan elk op een
   kaart.
8. **Goed, fout, gemist.** Kleur voegt snelheid toe, vorm draagt de betekenis:
   - goed is een dicht vlak met een vinkje,
   - fout is een gearceerd vlak (45°, periode 8 px) met een kruis,
   - gemist is een open vlak met een dubbele rand en een punt.

   Na een antwoord staat `UitkomstTeken` naast de terugkoppeling; op de kaart
   doen `.tk-shape-correct`, `.tk-shape-wrong` en `.tk-shape-missed-outer` het.
   Nooit kleur als enige drager.

## Wat het bewaakt

- `src/design/huisstijl.test.ts` houdt elke tokenwaarde aan de overdracht, en
  faalt op een losse hex in een regel, een schaduw, een derde lettertype, een
  oude tokennaam, een Tailwind-klasse buiten de tokens of een kleur in de
  ronde.
- `src/design/contrast.test.ts` meet de kleurparen, ook die van elk vak.
- `src/design/accent.test.ts` houdt bij waar een accent mag.
- `src/design/answerStates.test.ts` houdt de vormregels vast.
- `src/design/logo.test.ts` houdt het logo aan de bestanden in `docs/logo`.
- `e2e/huisstijl.spec.ts` kijkt in de draaiende app: de grond, Archivo in de
  koppen, en een ronde op dezelfde grond met knoppen van 56.
- ESLint weigert een hexwaarde in TypeScript.
