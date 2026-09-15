import { useEffect, useState } from 'react';
import { t, type TranslationKey } from '@/i18n';
import { Heldplaat } from '@/components/Heldplaat';
import { STICKERS } from '@/components/stickerSet';
import {
  aanbod,
  AANTAL_HELDEN,
  DUBBELEN_PER_REEKS,
  watKistDoet,
  type HeldenStand,
  type KistUitkomst,
  type Reeks,
} from '@/game-core';
import { kiesHeld, kistenOpenstaand, loadHelden } from '@/store/heldenStore';
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
  const [gewonnen, setGewonnen] = useState<KistUitkomst | null>(null);
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    void Promise.all([loadHelden(), kistenOpenstaand()]).then(([nu, open]) => {
      setStand(nu);
      setTeGoed(open);
    });
  }, []);

  if (stand === null) return null;
  if (teGoed <= 0 && gewonnen === null) return null;

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
        const [nu, open] = await Promise.all([loadHelden(), kistenOpenstaand()]);
        setStand(nu);
        setTeGoed(open);
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
