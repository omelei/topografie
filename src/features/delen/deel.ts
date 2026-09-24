/**
 * Iets delen dat het apparaat uit gaat: een link met een zin erbij.
 *
 * Drie manieren, in deze volgorde (ADR-174). De deelknop van het toestel als
 * die er is: op een telefoon is dat wat een kind kent, WhatsApp, Berichten, de
 * mail van zijn ouder. Anders de link kopiëren. En als kopiëren ook niet mag —
 * `clipboard` vraagt een beveiligde context en mag geweigerd worden — zegt de
 * uitkomst dat, zodat het scherm de link zelf laat zien.
 *
 * Aanroepen vanuit een klik, zonder `await` ervoor: de deelknop moet uit een
 * echte aanraking komen.
 */
export type DeelUitkomst = 'gedeeld' | 'gekopieerd' | 'handmatig';

export async function deel({
  titel,
  tekst,
  adres,
}: {
  readonly titel: string;
  readonly tekst: string;
  readonly adres: string;
}): Promise<DeelUitkomst> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: titel, text: tekst, url: adres });
      return 'gedeeld';
    } catch {
      // Wegklikken gooit hier ook (`AbortError`). Dan gaat het via kopiëren,
      // en als dat niet bestaat, staat de link er zelf.
      if (typeof navigator.clipboard?.writeText !== 'function') return 'handmatig';
    }
  }

  try {
    await navigator.clipboard.writeText(`${tekst} ${adres}`);
    return 'gekopieerd';
  } catch {
    return 'handmatig';
  }
}
