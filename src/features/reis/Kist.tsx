import { useEffect, useState } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { Heldplaat } from '@/components/Heldplaat';
import { STICKERS } from '@/components/stickerSet';
import {
  aanbod,
  AANTAL_HELDEN,
  DUBBELEN_PER_REEKS,
  goedTotKist,
  sterrenInKist,
  STERREN_PER_KIST,
  watKistDoet,
  type HeldenStand,
  type KistUitkomst,
  type Reeks,
} from '@/game-core';
import { kiesHeld, kistenOpenstaand, loadHelden } from '@/store/heldenStore';
import { loadAccuracy } from '@/store/progress';
import { setSticker } from '@/store/profile';

/**
 * De kist opengaan (ADR-138).
 *
 * Tien goede antwoorden zijn een ster, vijf sterren een kist, en een kist biedt
 * drie helden waarvan het kind er één omdraait. Dat stond helemaal uitgewerkt in
 * `game-core/helden.ts` en `store/heldenStore.ts` — inclusief `kiesHeld`, dat
 * een kist niet twee keer laat uitgeven — en er was nergens een scherm dat het
 * aanriep. De pagina waar het op stond is met ADR-112 verborgen "tot het opnieuw
 * doordacht is", en de kist ging mee.
 *
 * Een kind verdiende dus kisten die niet opengingen, met in de balk een dicht
 * kistje als er nog geen held op die plek stond. Dat is erger dan een beloning
 * die niet bestaat.
 *
 * **Bovenaan de uitslag en niet bij de beloningen.** Alles op dat scherm is te
 * lézen — de tegels, het diploma, de missers — en dit is het enige dat ingedrukt
 * moet worden. Onder de knop "Nog een ronde" zou een kind er telkens langs
 * drukken, en dan komt de kist volgende ronde weer op dezelfde plek terug.
 *
 * **De drie zeggen wat ze doen** (`watKistDoet`): drie dingen die niet zeggen
 * wat ze zijn is geen keuze maar drie knoppen.
 *
 * **De verzameling telt pas mee vanaf de helft.** "0 van de 12" bij je eerste
 * kist is een berg; "7 van de 12" is een doel. De gaten verdienen zich, net als
 * de rest.
 *
 * **En als er geen kist te openen is, staat hier wat eraan komt.** Dat was tot
 * nu toe niets: geen kist, geen sectie, geen woord. Terwijl `aanbod()` precies
 * weet welke drie helden de volgende kist voorlegt — deterministisch, in een
 * vaste volgorde, voor elk kind hetzelfde — en `goedTotKist()` weet hoeveel
 * antwoorden dat nog is. Allebei puur, allebei getest, en allebei door geen
 * enkel scherm aangeroepen.
 *
 * Dat is de dure helft van determinisme zonder de goedkope helft. Een kist die
 * op kans draait, leeft van niet weten; deze heeft dat opgegeven — terecht, en
 * daar is ADR-097 duidelijk over — maar nam er niets voor terug. Het enige dat
 * een vaststaande beloning kan wat een kansbeloning niet kan, is **een belofte
 * doen**. Vanaf nu doet hij dat, met naam en toenaam.
 *
 * Bij tien minuten per dag ligt een kist twee à drie dagen weg. De belofte
 * overspant dus nachten, en dat maakt hem geen sessiebeloning maar een reden om
 * morgen terug te komen.
 */

/** Vanaf hoeveel helden er geteld wordt hoeveel er nog missen. */
export const TELLEN_VANAF = Math.ceil(AANTAL_HELDEN / 2);

function reeksNaam(reeks: Reeks): string {
  return t(`held.${reeks}` as TranslationKey);
}

function naamVan(plek: number): string {
  const sticker = STICKERS[plek];
  return sticker ? t(sticker.name) : '';
}

export function Kist() {
  const [stand, setStand] = useState<HeldenStand | null>(null);
  const [teGoed, setTeGoed] = useState(0);
  // Alle goede antwoorden ooit: waar de ster en de kist op staan. Null zolang
  // het nog niet gelezen is, want een vooruitzicht dat op nul begint en dan
  // verspringt, heeft onderweg iets gezegd wat niet waar was.
  const [correct, setCorrect] = useState<number | null>(null);
  const [gewonnen, setGewonnen] = useState<KistUitkomst | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    void Promise.all([loadHelden(), kistenOpenstaand(), loadAccuracy()]).then(([nu, open, tot]) => {
      setStand(nu);
      setTeGoed(open);
      setCorrect(tot.correct);
    });
  }, []);

  if (stand === null) return null;
  if (teGoed <= 0 && gewonnen === null) {
    return correct === null ? null : <Vooruitzicht stand={stand} correct={correct} />;
  }

  async function kies(plek: number) {
    if (bezig) return;
    setBezig(true);
    try {
      const uitkomst = await kiesHeld(plek);
      if (uitkomst !== null) {
        setGewonnen(uitkomst);
        // De held die je net kreeg is de held die je draagt: zo verandert de
        // balk op elk scherm en is de beloning meteen ergens te zien.
        const sticker = STICKERS[uitkomst.plek];
        if (sticker) await setSticker(sticker.id);
        const [nu, open, tot] = await Promise.all([
          loadHelden(),
          kistenOpenstaand(),
          loadAccuracy(),
        ]);
        setStand(nu);
        setTeGoed(open);
        setCorrect(tot.correct);
      }
    } finally {
      setBezig(false);
    }
  }

  return (
    <section className="tk-kist" aria-label={t('kist.titel')}>
      {gewonnen === null ? (
        <Aanbod stand={stand} teGoed={teGoed} bezig={bezig} onKies={(plek) => void kies(plek)} />
      ) : (
        <Gewonnen
          uitkomst={gewonnen}
          teGoed={teGoed}
          aantal={stand.helden.length}
          onVolgende={() => setGewonnen(null)}
        />
      )}
    </section>
  );
}

function Aanbod({
  stand,
  teGoed,
  bezig,
  onKies,
}: {
  readonly stand: HeldenStand;
  readonly teGoed: number;
  readonly bezig: boolean;
  readonly onKies: (plek: number) => void;
}) {
  return (
    <>
      <p className="tk-kist-kop">
        <Heldplaat sticker={undefined} reeks="brons" size={40} gevonden={false} />
        <span>{teGoed === 1 ? t('kist.titel') : t('kist.titelMeer', { aantal: teGoed })}</span>
      </p>
      <p className="text-tekst-secundair">{t('kist.kies')}</p>

      <ul className="tk-kist-rij">
        {aanbod(stand).map((plek) => {
          const doet = watKistDoet(stand, plek);
          const sticker = STICKERS[plek];
          return (
            <li key={plek}>
              <button
                type="button"
                className="tk-kist-kaart"
                disabled={bezig}
                onClick={() => onKies(plek)}
              >
                <Heldplaat sticker={sticker?.id} reeks={doet.reeks} size={72} />
                <span className="tk-kist-naam">{naamVan(plek)}</span>
                <span className="tk-kist-doet">{watDoetZin(doet)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Wat kiezen van deze held zou doen, in één regel. */
function watDoetZin(doet: KistUitkomst): string {
  if (doet.soort === 'nieuw') return t('kist.nieuw');
  if (doet.soort === 'hoger') return t('kist.hoger', { reeks: reeksNaam(doet.reeks) });
  if (doet.soort === 'vol') return t('kist.vol');
  // `dubbelen` staat al op de stand ná deze kist, dus wat er nog te gaan is, is
  // het verschil met wat een stap omhoog kost.
  return t('kist.dubbel', { aantal: DUBBELEN_PER_REEKS - doet.dubbelen });
}

function Gewonnen({
  uitkomst,
  teGoed,
  aantal,
  onVolgende,
}: {
  readonly uitkomst: KistUitkomst;
  readonly teGoed: number;
  readonly aantal: number;
  readonly onVolgende: () => void;
}) {
  const naam = naamVan(uitkomst.plek);
  const sticker = STICKERS[uitkomst.plek];

  return (
    <>
      <p className="tk-kist-gewonnen">
        <Heldplaat
          sticker={sticker?.id}
          reeks={uitkomst.reeks}
          size={96}
          className="tk-kist-held"
        />
        <span className="tk-kist-uitkomst">{uitkomstZin(uitkomst, naam)}</span>
      </p>

      {/* Pas vanaf de helft geteld: "0 van de 12" bij je eerste kist is een berg. */}
      {aantal >= TELLEN_VANAF ? (
        <p className="text-tekst-secundair">
          {t('kist.verzameling', { aantal, totaal: AANTAL_HELDEN })}
        </p>
      ) : null}

      {teGoed > 0 ? (
        <button type="button" className="tk-button self-start" onClick={onVolgende}>
          {t('kist.volgende')}
        </button>
      ) : null}
    </>
  );
}

function uitkomstZin(uitkomst: KistUitkomst, naam: string): string {
  if (uitkomst.soort === 'nieuw') return t('kist.gewonnen', { naam });
  if (uitkomst.soort === 'hoger')
    return t('kist.gewonnenHoger', { naam, reeks: reeksNaam(uitkomst.reeks) });
  if (uitkomst.soort === 'vol') return t('kist.gewonnenVol', { naam });
  return t('kist.gewonnenDubbel', { naam, aantal: DUBBELEN_PER_REEKS - uitkomst.dubbelen });
}

/**
 * Wat er aankomt, op elk uitslagscherm waar geen kist te openen is.
 *
 * Drie dingen, en geen daarvan is nieuw uitgerekend: hoeveel van de vijf
 * sterren er staan, hoeveel goede antwoorden de kist nog is, en wie erin zit.
 * Alle drie stonden ze al in `game-core/helden.ts` en werden ze door niets
 * gelezen.
 *
 * **De namen zijn het punt.** "Nog 12 tot je kist" is een teller; "Erin zitten
 * Willem Wolf, Fem Flamingo en Daan Das" is een reden. Het is ook eerlijk:
 * `aanbod()` is de enige plek waar die regel bestaat, dus wat hier staat, staat
 * er straks ook — de volgorde is vast en voor elk kind gelijk (ADR-097).
 *
 * **Niets wanneer alles op ultra staat.** Dan is er geen held meer om te
 * beloven, en een belofte over niets is erger dan geen belofte.
 */
function Vooruitzicht({
  stand,
  correct,
}: {
  readonly stand: HeldenStand;
  readonly correct: number;
}) {
  const komen = aanbod(stand);
  if (komen.length === 0) return null;

  const gehaald = sterrenInKist(correct);
  const sterren = Array.from({ length: STERREN_PER_KIST }, (_, i) => i + 1);
  const namen = komen.map((plek) => naamVan(plek));
  const togaan = goedTotKist(correct);

  return (
    <section className="tk-vooruit" aria-label={t('kist.vooruitTitel')}>
      <p className="tk-vooruit-rij">
        <span className="tk-vooruit-sterren" aria-hidden="true">
          {sterren.map((ster) => (
            <span
              key={ster}
              className="tk-vooruit-ster"
              data-vol={ster <= gehaald ? 'ja' : undefined}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" focusable="false">
                <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
              </svg>
            </span>
          ))}
        </span>
        <span className="tk-vooruit-tekst">
          {togaan === 1 ? t('kist.vooruitEen') : t('kist.vooruit', { aantal: togaan })}
        </span>
      </p>
      <p className="text-tekst-secundair">
        {namen.length === 1
          ? t('kist.vooruitWieEen', { naam: namen[0] as string })
          : t('kist.vooruitWie', { namen: opsomming(namen) })}
      </p>
    </section>
  );
}

/** "A, B en C" — met "en" voor de laatste, zoals een kind het zou zeggen. */
function opsomming(namen: readonly string[]): string {
  if (namen.length <= 1) return namen[0] ?? '';
  return `${namen.slice(0, -1).join(', ')} ${t('kist.vooruitEn')} ${namen[namen.length - 1] as string}`;
}
