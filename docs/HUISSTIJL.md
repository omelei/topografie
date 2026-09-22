# Huisstijl

De huisstijl van leer.nu staat in drie bronnen, en elk is definitief voor zijn
eigen deel:

- **Het logo** is de levering `leernu-logo-denker`, ongewijzigd in `docs/logo`
  (ADR-154). Die map bepaalt het merk: Denker, het woordbeeld, de app-iconen en
  de vier merkkleuren koraal, koraal diep, cacao en room. Niemand retoucheert
  daar iets; `logo.test.ts` houdt elke kopie in `public` er byte voor byte aan.
- **Kleur en typografie** komen uit `docs/leer.nu Merk en stijlgids.dc.html`
  (ADR-179). Room als ondergrond, witte kaarten, cacao als inkt, koraal voor de
  knop en het merkvlak, teal voor wat gekozen is, en groen en framboos alleen
  voor goed en fout. De zes vakkleuren zijn nog die van "Leisteen" (ADR-144),
  tot de vakkleuren van de gids binnen zijn.
- **Ruimte, vorm, iconen en trefmaten** komen uit de overdracht
  `design_handoff_leernu` (in `topo-prive`, README onder "Ontwerptokens") en de
  styleguide die daarbij hoort, `docs/leer.nu Styleguide.dc.html`. Vorm en
  beweging uit de nieuwe gids volgen in een volgende stap (ADR-179).

Dit blad zegt hoe je een scherm bouwt dat erbij hoort; ADR-109 zegt waarom het
zo staat, ADR-112 wat daarna is gelijkgetrokken, ADR-144 wat de kleur betreft,
ADR-154 wat het logo is en ADR-179 wat de nieuwe gids veranderde.

## Waar de waarden staan

- **`src/index.css`** is de enige plek die een kleur, lettertype of maat van de
  _app_ noemt. Bovenaan staat `:root` met de tokentabel van de overdracht,
  daaronder de telefoon, VO, de modules en het blok `[data-thema='ronde']`.
- **`src/design/kleuren.css`** is de enige plek die een kleur van het _logo_
  noemt, en het is het bestand van de ontwerper zelf: `--leernu-koraal`,
  `--leernu-koraal-diep`, `--leernu-cacao`, `--leernu-room` en de drie
  `--denker-*` die de sprite inkleuren. Verder zijn er geen stylesheets, en dat
  is een regel die `huisstijl.test.ts` bewaakt: een derde is waar een tweede
  palet begint.
- **`tailwind.config.ts`** vertaalt de tokens naar klassen. Kleuren, fonts,
  radii, schaduwen en de typeschaal _vervangen_ Tailwinds eigen waarden:
  `bg-blue-500`, `rounded-lg`, `shadow-md` en `font-serif` bestaan hier niet.
  De merkkleuren staan er niet in, en horen er niet in.

## Een nieuw scherm

1. **Kleur op rol, niet op waarde.** `bg-papier` voor de grond van een scherm,
   `bg-kaart` voor een kaart of paneel, `text-inkt`, `text-tekst-secundair`,
   `text-tekst-tertiair`, `border-rand-licht` voor een kaart en
   `border-rand-bediening` voor de rand van iets dat je kunt indrukken.
2. **Typografie op rol.** Eén maat per rol, op elk scherm:

   | rol                                    | klasse                             | maat (PO)    |
   | -------------------------------------- | ---------------------------------- | ------------ |
   | paginatitel (`h1`)                     | `tk-titel`                         | 44 (tel 34)  |
   | zin onder de titel                     | `text-lopend text-tekst-secundair` | 18           |
   | sectiekop (`h2`)                       | `tk-sectie`                        | 20           |
   | titel van een kaart                    | `tk-kaart-titel`                   | 20           |
   | titel van een rij, tegel, chip of knop | `tk-lijstrij-titel`, `text-knop`   | 20           |
   | regel onder een rij of tegel           | `tk-lijstrij-regel`, `tk-hulp`     | 15           |
   | getal in een tegel                     | `tk-cijfer-getal`                  | 28           |
   | label boven een waarde of een kaart    | `tk-label`                         | 13, kapitaal |
   | de vraag in een ronde                  | `text-vraag`                       | 36 (tel 28)  |

   Baloo 2 voor koppen, de vraag, knoppen en getallen, Atkinson Hyperlegible
   voor al het andere. Het gewicht hoort bij de rol: zet er geen
   `font-semibold` of `font-bold` naast.

3. **Vorm.** `rounded-kaart` (12) voor kaarten, knoppen en velden,
   `rounded-chip` (6) voor een chip, optie of plaat, `rounded-pil` voor een pil.
   Randen zijn 1 px (`border-hair`), 2 px (`border-active`) alleen bij nadruk of
   een gekozen staat. Geen schaduw, behalve `drop-shadow-beloning` op een
   beloningsafbeelding.
4. **Bouwstenen.** Een sectie is een `h2.tk-sectie` met eronder de inhoud; een
   lijst is `ul.tk-lijst` met `tk-lijstrij` per rij (plaat, titel, regel, stand,
   pijl); getallen zijn `dl.tk-cijfers` met een `tk-cijfer` per tegel; wat je
   kunt verdienen draagt een `Embleem`. Een pagina opent met `tk-etalage`: de
   titel als `h1.tk-etalage-kop` en de zin eronder als `tk-etalage-tekst`, in
   indigo (ADR-150). Kaarten naast elkaar zijn `tk-kaarten` met een
   `tk-kaartje` per kaart; een kaart met een keuze is `tk-card tk-kaartrij`,
   met een `tk-kaartteken` ervoor.
5. **Trefmaten.** Een knop is `h-knop` (56 in PO, 44 in VO). Het kleinste dat
   iets indrukbaars mag zijn is `raak`: 44 onder een muis, 48 op een tablet, 56
   onder een duim en altijd 56 in een ronde. Nooit een vaste maat eronder.
6. **De kleur van een vak.** Binnen een vak — de vakpagina, de ronde, de rail,
   de uitslag — draagt de voortgang de kleur van dat vak: zet `data-module` op
   de wortel. Wat gekozen is, is overal teal (`accent`), en wat je indrukt
   overal koraal (`actie`). Goed is altijd groen en fout altijd framboos, in
   welk vak ook.
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

9. **Eén grond, overal** (styleguide §01, die ADR-120 terugneemt). De
   paginabrede vaktint is weg: die maakte witte kaarten grauw. Elk scherm staat
   op `papier`, en waar je bent lees je af aan de tegel van het vak. De tokens
   `--topo-grond` en `--vandaag-grond` blijven bestaan — `Shell` zet nog steeds
   `data-grond` — maar ze wijzen alle zeven naar `papier`, zodat een scherm het
   niet hoeft te weten. Maak er geen nieuwe hex voor.

10. **Het merk, en waar koraal wel en niet mag.** Het logo is een plaatje:
    `Wordmark` voor het liggende logo met de naam, `Brandmark` voor Denker los.
    Teken ze niet na en zet de naam nergens in een lettertype — het woordbeeld
    bestaat uit vormen en draagt `alt="leer.nu"`. Het logo staat op wit of op
    `papier`, nooit kleiner dan 88 px breed; Denker los nooit kleiner dan 24,
    en daaronder de favicon. Een uitdrukking van Denker is terugkoppeling,
    hooguit één per scherm, en nooit in plaats van het logo.

    Koraal mag op drie plekken (ADR-179): de primaire knop (`actie`, met wit
    erop, alleen op knoptekst van 20 px Baloo 700), het vlak waar een pagina
    begint (`koraal`, met cacao erop) en het logo. Het is geen antwoordstaat,
    geen voortgang, geen vak en niet wat gekozen is: koraal ligt twintig graden
    tint van framboos, en de vormen van punt 8 zeggen wat er gebeurd is, niet de
    kleur. Zet Denker naast een uitslag, niet _als_ de uitslag.

## Wat het bewaakt

- `src/design/huisstijl.test.ts` houdt elke tokenwaarde aan de overdracht, en
  faalt op een losse hex in een regel, een schaduw, een derde lettertype, een
  oude tokennaam, een Tailwind-klasse buiten de tokens of een kleur in de
  ronde.
- `src/design/contrast.test.ts` meet de kleurparen, ook die van elk vak en
  elke grond.
- `src/design/accent.test.ts` houdt bij waar een accent mag.
- `src/design/answerStates.test.ts` houdt de vormregels vast.
- `src/design/logo.test.ts` houdt de kopieën in `public` aan de levering in
  `docs/logo` (ADR-154). `huisstijl.test.ts` houdt de logotokens (`--leernu-`,
  `--denker-`) in `kleuren.css`, weigert een derde stylesheet, en houdt koraal
  buiten elke antwoord-, voortgangs-, vak- en keuzekleur (ADR-179).
- `e2e/huisstijl.spec.ts` kijkt in de draaiende app: de grond, Baloo 2 in de
  koppen, en een ronde op dezelfde grond met knoppen van 56.
- ESLint weigert een hexwaarde in TypeScript.
