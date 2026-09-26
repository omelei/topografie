import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import {
  ALFABET,
  bedragVoorMens,
  bedragVoorMollie,
  codeVoorMens,
  geldigTot,
  hashVanCode,
  isEmail,
  KassaFout,
  leesStatus,
  LENGTE,
  mailVoorCode,
  nieuweCode,
  normaliseerEmail,
  PRIJS_CENTEN,
  startBestelling,
  verwerkWebhook,
  type Bestelling,
  type Betaling,
  type Diensten,
} from './kassa';

/**
 * De kassa, nagespeeld (ADR-123).
 *
 * Er is hier geen Mollie, geen database en geen mailer: `kassa.ts` is puur en
 * krijgt zijn diensten aangereikt, dus alles wat een beslissing is kan hier
 * echt worden gecontroleerd. Wat níét hier staat is of Mollie doet wat de
 * documentatie zegt — dat is één testbetaling in de testmodus, en die staat in
 * `tools/premium/README.md`.
 */

/** Een neppe kassa: onthoudt wat er gebeurde, zodat een test het kan nakijken. */
function nepDiensten(overschrijf: Partial<Diensten> = {}) {
  const bestellingen = new Map<
    string,
    { code: string | null; geldigTot: string; gemaild: boolean }
  >();
  const gemaild: { aan: string; tekst: string }[] = [];
  const betalingen = new Map<string, Betaling>();
  let gemaakt = 0;

  const diensten: Diensten = {
    mollie: {
      maakBetaling: vi.fn(async () => {
        gemaakt += 1;
        const id = `tr_test${gemaakt}`;
        betalingen.set(id, { id, status: 'open', email: 'ouder@example.nl' });
        return { id, checkoutUrl: `https://mollie.test/checkout/${id}` };
      }),
      leesBetaling: vi.fn(async (id: string) => {
        const betaling = betalingen.get(id);
        if (!betaling) throw new KassaFout(502, 'mollie: onbekend');
        return betaling;
      }),
    },
    db: {
      legVast: vi.fn(async (input) => {
        const bestaand = bestellingen.get(input.betaling);
        if (bestaand) return { nieuw: false, ...bestaand } satisfies Bestelling;
        const nieuw = { code: input.code, geldigTot: input.geldigTot, gemaild: false };
        bestellingen.set(input.betaling, nieuw);
        return { nieuw: true, ...nieuw } satisfies Bestelling;
      }),
      lees: vi.fn(async (betaling: string) => {
        const rij = bestellingen.get(betaling);
        return rij ? ({ nieuw: false, ...rij } satisfies Bestelling) : null;
      }),
      noteerGemaild: vi.fn(async (betaling: string) => {
        const rij = bestellingen.get(betaling);
        if (rij) bestellingen.set(betaling, { ...rij, gemaild: true });
      }),
    },
    mail: {
      stuur: vi.fn(async (input) => {
        gemaild.push({ aan: input.aan, tekst: input.tekst });
      }),
    },
    nu: () => new Date('2026-09-14T10:00:00Z'),
    willekeur: (lengte) => {
      const bytes = new Uint8Array(lengte);
      for (let plek = 0; plek < lengte; plek++) bytes[plek] = plek * 7;
      return bytes;
    },
    premiumUrl: 'https://www.leer.nu/premium',
    terugUrl: 'https://www.leer.nu/kopen/klaar/',
    webhookUrl: 'https://kassa.test/kassa?actie=webhook',
    ...overschrijf,
  };

  /** Doen alsof de ouder betaald heeft. */
  const betaal = (id: string) => {
    const betaling = betalingen.get(id);
    if (betaling) betalingen.set(id, { ...betaling, status: 'paid' });
  };
  const zetStatus = (id: string, status: string) => {
    const betaling = betalingen.get(id);
    if (betaling) betalingen.set(id, { ...betaling, status });
  };

  return { diensten, gemaild, betaal, zetStatus, bestellingen };
}

describe('de code', () => {
  it('gebruikt hetzelfde alfabet en dezelfde lengte als het script dat ze met de hand maakt', () => {
    // Twee plekken die codes maken, één alfabet: een code uit de kassa en een
    // code uit maak-codes.mjs moeten voor een ouder hetzelfde ding zijn.
    const script = readFileSync('tools/premium/maak-codes.mjs', 'utf8');
    expect(script).toContain(`const ALFABET = '${ALFABET}';`);
    expect(script).toContain(`const LENGTE = ${LENGTE};`);
  });

  it('laat de tekens weg die een ouder verkeerd overtypt', () => {
    for (const teken of '0O1IL') expect(ALFABET).not.toContain(teken);
  });

  it('is acht tekens uit dat alfabet, en gooit scheve bytes weg', () => {
    // 248 tot en met 255 vallen buiten het laatste hele veelvoud van 31 en zouden
    // de eerste acht letters vaker laten vallen dan de rest.
    const code = nieuweCode(() => new Uint8Array([250, 251, 0, 1, 2, 3, 4, 5, 6, 7]));
    expect(code).toHaveLength(LENGTE);
    expect(code).toBe('ABCDEFGH');
    for (const teken of code) expect(ALFABET).toContain(teken);
  });

  it('blijft trekken tot er acht bruikbare bytes zijn', () => {
    let ronde = 0;
    const code = nieuweCode(() => {
      ronde += 1;
      return ronde === 1 ? new Uint8Array(16).fill(255) : new Uint8Array(16).fill(0);
    });
    expect(code).toBe('AAAAAAAA');
    expect(ronde).toBe(2);
  });

  it('wordt afgedrukt zoals hij op de premiumpagina wordt ingetypt', () => {
    expect(codeVoorMens('7K3MQ9TX')).toBe('LEER-7K3M-Q9TX');
  });

  it('wordt bewaard als dezelfde SHA-256 die het script en het schema rekenen', async () => {
    // Niet tegen een opgeschreven getal maar tegen node's eigen crypto, want dat
    // is precies wat maak-codes.mjs doet — en `premium_hash()` in schema.sql
    // rekent met digest('sha256') hetzelfde uit. Drie plekken, één hash, anders
    // opent een gekochte code niets.
    for (const code of ['7K3MQ9TX', 'ABCDEFGH', '23456789']) {
      const volgensNode = createHash('sha256').update(code).digest('hex');
      await expect(hashVanCode(code), code).resolves.toBe(volgensNode);
    }
  });
});

describe('het bedrag en de geldigheid', () => {
  it('staat op één plek en gaat naar Mollie met twee decimalen', () => {
    expect(PRIJS_CENTEN).toBe(5995);
    expect(bedragVoorMollie()).toBe('59.95');
    expect(bedragVoorMens()).toBe('€ 59,95');
  });

  it('staat in de app met hetzelfde bedrag als hier (ADR-124)', () => {
    // De premiumpagina noemt de prijs, want een knop naar een winkel waarvan je
    // het bedrag niet weet voelt als een val. Twee plekken met een prijs is
    // alleen veilig als iets ze gelijk houdt, en dat is deze regel.
    const app = readFileSync('src/i18n/nl.ts', 'utf8');
    expect(app).toContain(`'premium.prijs': '${bedragVoorMens()}',`);
  });

  it('geldt een jaar vanaf de dag van betalen', () => {
    expect(geldigTot(new Date('2026-09-14T10:00:00Z'))).toBe('2027-09-14');
    // Een schrikkeljaar ertussen schuift de datum een dag, en dat is goed: het
    // is 365 dagen premium, geen kalenderjaar met een gratis dag erin.
    expect(geldigTot(new Date('2027-03-01T10:00:00Z'))).toBe('2028-02-29');
  });
});

describe('het e-mailadres', () => {
  it('gaat zonder spaties en in kleine letters door', () => {
    expect(normaliseerEmail('  Ouder@Example.NL ')).toBe('ouder@example.nl');
  });

  it('laat door wat een adres kan zijn en houdt de rest tegen', () => {
    for (const goed of ['ouder@example.nl', 'a.b+c@mail.example.co.uk']) {
      expect(isEmail(goed), goed).toBe(true);
    }
    for (const fout of ['', 'ouder', 'ouder@', '@example.nl', 'ouder@example', 'a b@c.nl']) {
      expect(isEmail(fout), JSON.stringify(fout)).toBe(false);
    }
  });
});

describe('de mail', () => {
  it('zet de code erin, de datum in woorden, en zegt dat hij nergens anders staat', () => {
    const mail = mailVoorCode({
      code: '7K3MQ9TX',
      geldigTot: '2027-09-14',
      premiumUrl: 'https://www.leer.nu/premium',
    });
    expect(mail.onderwerp).toBe('Je code voor leer.nu premium');
    expect(mail.tekst).toContain('LEER-7K3M-Q9TX');
    expect(mail.tekst).toContain('14 september 2027');
    expect(mail.tekst).toContain('Bewaar deze mail');
    // Waar de code ingevuld wordt: de ouderpagina (ADR-173).
    expect(mail.tekst).toContain('https://www.leer.nu/ouder');
    expect(mail.html).toContain('href="https://www.leer.nu/ouder"');
    expect(mail.html).toContain('LEER-7K3M-Q9TX');
  });
});

describe('een bestelling starten', () => {
  it('maakt een betaling van het juiste bedrag en geeft de checkout terug', async () => {
    const { diensten } = nepDiensten();
    const uitkomst = await startBestelling(' Ouder@Example.NL ', diensten);

    expect(uitkomst.checkoutUrl).toBe('https://mollie.test/checkout/tr_test1');
    expect(diensten.mollie.maakBetaling).toHaveBeenCalledWith(
      expect.objectContaining({ bedrag: '59.95', valuta: 'EUR', email: 'ouder@example.nl' }),
    );
  });

  it('weigert een adres dat geen adres is, voordat er iets bij Mollie gebeurt', async () => {
    const { diensten } = nepDiensten();
    await expect(startBestelling('ouder@', diensten)).rejects.toThrow(KassaFout);
    expect(diensten.mollie.maakBetaling).not.toHaveBeenCalled();
  });
});

describe('de webhook', () => {
  it('maakt een code en mailt hem zodra er betaald is', async () => {
    const { diensten, gemaild, betaal } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    betaal('tr_test1');

    await verwerkWebhook('tr_test1', diensten);

    expect(gemaild).toHaveLength(1);
    expect(gemaild[0]?.aan).toBe('ouder@example.nl');
    expect(gemaild[0]?.tekst).toMatch(/LEER-[A-Z2-9]{4}-[A-Z2-9]{4}/);
  });

  it('doet niets bij een betaling die niet betaald is', async () => {
    const { diensten, gemaild, zetStatus } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);

    for (const status of ['open', 'pending', 'canceled', 'expired', 'failed']) {
      zetStatus('tr_test1', status);
      await verwerkWebhook('tr_test1', diensten);
    }

    expect(diensten.db.legVast).not.toHaveBeenCalled();
    expect(gemaild).toHaveLength(0);
  });

  it('maakt bij een tweede melding geen tweede code en stuurt geen tweede mail', async () => {
    // Mollie stuurt met opzet vaker. Twee codes voor één betaling zou zowel
    // verwarrend als duur zijn, en twee mails zijn er één te veel.
    const { diensten, gemaild, betaal } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    betaal('tr_test1');

    await verwerkWebhook('tr_test1', diensten);
    await verwerkWebhook('tr_test1', diensten);
    await verwerkWebhook('tr_test1', diensten);

    expect(gemaild).toHaveLength(1);
  });

  it('mailt alsnog wanneer een vorige poging de code wel vastlegde en de mail niet rondkreeg', async () => {
    // Het geval waar het om gaat: er is betaald, de code staat er, en de mailer
    // lag eruit. Mollie probeert het opnieuw en dan moet het stuk dat ontbrak
    // alsnog gebeuren — vandaar dat het mailen aan `gemaild` hangt en niet aan
    // `nieuw`.
    const { diensten, gemaild, betaal } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    betaal('tr_test1');

    vi.mocked(diensten.mail.stuur).mockRejectedValueOnce(new Error('mailer plat'));
    await expect(verwerkWebhook('tr_test1', diensten)).rejects.toThrow('mailer plat');
    expect(gemaild).toHaveLength(0);

    await verwerkWebhook('tr_test1', diensten);
    expect(gemaild).toHaveLength(1);
  });

  it('weigert een melding zonder betaling', async () => {
    const { diensten } = nepDiensten();
    await expect(verwerkWebhook('  ', diensten)).rejects.toThrow(KassaFout);
  });
});

describe('de pagina na het betalen', () => {
  it('zegt "bezig" zolang de betaling loopt', async () => {
    const { diensten } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    await expect(leesStatus('tr_test1', diensten)).resolves.toMatchObject({ status: 'bezig' });
  });

  it('zegt "bezig" wanneer er betaald is maar de webhook er nog niet langs was', async () => {
    const { diensten, betaal } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    betaal('tr_test1');
    await expect(leesStatus('tr_test1', diensten)).resolves.toMatchObject({ status: 'bezig' });
  });

  it('geeft de code zodra hij er is, zodat een ouder niet op de mail hoeft te wachten', async () => {
    const { diensten, betaal } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    betaal('tr_test1');
    await verwerkWebhook('tr_test1', diensten);

    const uitkomst = await leesStatus('tr_test1', diensten);
    expect(uitkomst.status).toBe('betaald');
    expect(uitkomst.code).toMatch(/^LEER-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(uitkomst.geldigTot).toBe('2027-09-14');
  });

  it('zegt "mislukt" bij een afgebroken betaling', async () => {
    const { diensten, zetStatus } = nepDiensten();
    await startBestelling('ouder@example.nl', diensten);
    zetStatus('tr_test1', 'canceled');
    await expect(leesStatus('tr_test1', diensten)).resolves.toMatchObject({ status: 'mislukt' });
  });
});
