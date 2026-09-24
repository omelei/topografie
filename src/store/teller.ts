import { premiumServer, sleutelKoppen } from './premium';

/**
 * De teller (ADR-210): hoeveel keer iets gebeurde, per dag, zonder te weten
 * door wie.
 *
 * Er gaat een gebeurtenis heen en soms een adres van leer.nu zelf
 * ("/topografie/provincies"). Geen naam, geen apparaatnummer, geen cookie, en
 * er wordt niets op het apparaat bewaard om iemand te herkennen: de server
 * houdt per dag alleen een aantal bij. Wat een kind oefent, blijft op het
 * apparaat; hier staat alleen dát er ergens een ronde begon.
 *
 * Nooit in de weg: zonder premiumserver, met "Do Not Track" of "Global Privacy
 * Control" aan, of zonder verbinding gebeurt er niets, en een mislukte telling
 * zegt niets tegen niemand.
 */

export type Gebeurtenis =
  'binnenkomst' | 'ronde' | 'ronde-zonder-naam' | 'naam' | 'gedeeld' | 'premium' | 'kassa';

/** Of deze browser zegt: tel mij niet. */
function wilNietGeteld(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1';
}

export function tel(gebeurtenis: Gebeurtenis, pad = ''): void {
  const doel = premiumServer();
  if (doel === null || wilNietGeteld()) return;
  try {
    void fetch(`${doel.url}/rest/v1/rpc/teller_tel`, {
      method: 'POST',
      headers: sleutelKoppen(doel.sleutel),
      body: JSON.stringify({ p_gebeurtenis: gebeurtenis, p_pad: pad }),
      // Ook als de pagina net weggaat, zoals bij de knop naar de kassa.
      keepalive: true,
      credentials: 'omit',
    }).catch(() => undefined);
  } catch {
    // Een browser zonder fetch telt niet mee.
  }
}

let binnen = false;

/**
 * Waar iemand binnenkwam, één keer per keer dat de app opent. Niet bewaard:
 * wie herlaadt, telt opnieuw. Dat is een kleine overtelling, en de prijs van
 * niets op het apparaat achterlaten.
 */
export function telBinnenkomst(pad: string): void {
  if (binnen) return;
  binnen = true;
  tel('binnenkomst', pad);
}
