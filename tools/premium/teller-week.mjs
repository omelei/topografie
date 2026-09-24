/**
 * Het weekoverzicht van de teller (ADR-215).
 *
 * Leest de tabel `teller` op de premiumserver via de Management API van
 * Supabase (met SUPABASE_ACCESS_TOKEN, hetzelfde geheim als de kassa-workflow)
 * en schrijft een overzicht in Markdown naar stdout. De workflow
 * `teller-week.yml` zet dat elke maandag in een issue.
 *
 *   SUPABASE_ACCESS_TOKEN=… PREMIUM_PROJECT_REF=… node tools/premium/teller-week.mjs
 *
 * `--voorbeeld` drukt het overzicht af met verzonnen getallen, om de opmaak te
 * zien zonder server.
 */

const GEBEURTENISSEN = [
  ['binnenkomst', 'Binnengekomen'],
  ['ronde-zonder-naam', 'Ronde zonder naam'],
  ['naam', 'Naam ingevuld'],
  ['ronde', 'Ronde met naam'],
  ['gedeeld', 'Uitslag gedeeld'],
  ['werkblad', 'Werkblad geprint'],
  ['qr', 'QR-code gescand'],
  ['premium', 'Premiumpagina bekeken'],
  ['kassa', 'Naar de kassa'],
];

async function vraag(ref, token, sql) {
  const antwoord = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  const tekst = await antwoord.text();
  if (!antwoord.ok) throw new Error(`HTTP ${antwoord.status}: ${tekst.slice(0, 300)}`);
  return JSON.parse(tekst);
}

/** Het overzicht, uit de rijen van de twee vragen. Puur, zodat het te testen is. */
export function verslag({ totalen, binnen }, vandaag) {
  const per = new Map(totalen.map((rij) => [rij.gebeurtenis, rij]));
  const regels = [
    `Wat de teller zag in de week tot en met ${vandaag}, en de week ervoor (ADR-210).`,
    '',
    '| Gebeurtenis | Deze week | Week ervoor |',
    '| --- | ---: | ---: |',
    ...GEBEURTENISSEN.map(([sleutel, naam]) => {
      const rij = per.get(sleutel);
      return `| ${naam} | ${Number(rij?.deze ?? 0)} | ${Number(rij?.vorige ?? 0)} |`;
    }),
    '',
    '**Waar mensen binnenkwamen (deze week, top 10)**',
    '',
    ...(binnen.length === 0
      ? ['Nog niemand.']
      : [
          '| Adres | Aantal |',
          '| --- | ---: |',
          ...binnen.map((rij) => `| ${rij.pad || '/'} | ${Number(rij.aantal)} |`),
        ]),
    '',
    'Herladen telt opnieuw, en wie niet geteld wil worden (Do Not Track, Global Privacy Control), telt niet mee.',
  ];
  return regels.join('\n');
}

const vandaag = new Date().toISOString().slice(0, 10);

if (process.argv.includes('--voorbeeld')) {
  console.log(
    verslag(
      {
        totalen: [
          { gebeurtenis: 'binnenkomst', deze: 42, vorige: 12 },
          { gebeurtenis: 'ronde-zonder-naam', deze: 17, vorige: 3 },
          { gebeurtenis: 'naam', deze: 6, vorige: 1 },
        ],
        binnen: [
          { pad: '/topografie/provincies', aantal: 20 },
          { pad: '/', aantal: 9 },
        ],
      },
      vandaag,
    ),
  );
  process.exit(0);
}

const token = process.env.SUPABASE_ACCESS_TOKEN ?? '';
const ref = process.env.PREMIUM_PROJECT_REF ?? '';
if (token === '' || !/^[a-z0-9]{20}$/.test(ref)) {
  console.error('SUPABASE_ACCESS_TOKEN en PREMIUM_PROJECT_REF zijn nodig.');
  process.exit(1);
}

try {
  const totalen = await vraag(
    ref,
    token,
    `select gebeurtenis,
       sum(aantal) filter (where dag > current_date - 7) as deze,
       sum(aantal) filter (where dag <= current_date - 7 and dag > current_date - 14) as vorige
     from public.teller where dag > current_date - 14 group by gebeurtenis`,
  );
  const binnen = await vraag(
    ref,
    token,
    `select pad, sum(aantal) as aantal from public.teller
     where gebeurtenis = 'binnenkomst' and dag > current_date - 7
     group by pad order by aantal desc limit 10`,
  );
  console.log(verslag({ totalen, binnen }, vandaag));
} catch (fout) {
  const tekst = String(fout);
  if (/teller.*does not exist/i.test(tekst)) {
    console.error(
      'De tabel teller bestaat nog niet: draai tools/premium/schema.sql in de SQL Editor.',
    );
  } else {
    console.error(`De teller was niet te lezen: ${tekst}`);
  }
  process.exit(1);
}
