import { readFileSync } from 'node:fs';
import ts from 'typescript';

/**
 * De teksten van de app uit `src/i18n/nl.ts` lezen, met de TypeScript-parser
 * en niet met een reguliere expressie: een tekst kan over twee regels lopen,
 * enkele of dubbele aanhalingstekens hebben, en een apostrof bevatten.
 *
 * Voor elke tekst: de sleutel, de tekst, het commentaar erboven (de uitleg
 * voor wie hem herschrijft) en waar de tekst in het bestand staat, zodat de
 * import precies die tekst kan vervangen en de rest laat staan.
 */
export const NL_PAD = 'src/i18n/nl.ts';

export function leesTeksten(pad = NL_PAD) {
  const bron = readFileSync(pad, 'utf8');
  const bestand = ts.createSourceFile(pad, bron, ts.ScriptTarget.Latest, true);
  const teksten = [];
  let commentaar = '';

  const bezoek = (knoop) => {
    if (ts.isObjectLiteralExpression(knoop)) {
      for (const eigenschap of knoop.properties) {
        if (!ts.isPropertyAssignment(eigenschap)) continue;
        const naam = eigenschap.name;
        const waarde = eigenschap.initializer;
        if (!ts.isStringLiteral(naam) || !ts.isStringLiteralLike(waarde)) continue;
        // Het commentaar direct boven deze sleutel, of anders het laatste
        // commentaar erboven: dat geldt voor een hele groep.
        const eigen = (ts.getLeadingCommentRanges(bron, eigenschap.getFullStart()) ?? [])
          .map((r) =>
            bron
              .slice(r.pos, r.end)
              .replace(/^\/\*+|\*+\/$/g, '')
              .split('\n')
              .map((regel) => regel.replace(/^\s*(\/\/|\*)\s?/, '').trim())
              .filter(Boolean)
              .join(' '),
          )
          .join(' ')
          .trim();
        if (eigen) commentaar = eigen;
        teksten.push({
          sleutel: naam.text,
          tekst: waarde.text,
          toelichting: commentaar,
          begin: waarde.getStart(bestand),
          eind: waarde.getEnd(),
        });
      }
      return;
    }
    ts.forEachChild(knoop, bezoek);
  };
  bezoek(bestand);
  return { bron, teksten };
}

/** De plekken die de app invult: {naam}, {aantal}. */
export function invulplekken(tekst) {
  return [...tekst.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}
