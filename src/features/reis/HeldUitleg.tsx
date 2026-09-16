import { useEffect, useState } from 'react';
import { stickerById } from '@/components/stickerSet';
import { aanbod, AANTAL_HELDEN } from '@/game-core';
import { t } from '@/i18n';
import { loadAccuracy } from '@/store/progress';
import { Vooruitzicht } from './Kist';
import { useHelden } from './useHelden';

/**
 * Wat de held naast de begroeting is, en hoe je er meer krijgt.
 *
 * Sinds ADR-142 staat de held groot op de voordeur, maar zonder één woord
 * erbij. Een kind zag een vos en een naam en kon niet weten dat dit zíjn held
 * is, dat er elf andere zijn, en dat spelen de manier is om ze te krijgen. De
 * eigenaar vroeg om precies die twee zinnen.
 *
 * Er wordt niets nieuw uitgerekend: de belofte is die van het uitslagscherm
 * (`Vooruitzicht` in `Kist.tsx`) — hoeveel sterren er staan, hoeveel goede
 * antwoorden de kist nog is en wie erin zit. Eén bron, zodat de voordeur en de
 * uitslag nooit twee verschillende getallen noemen.
 *
 * Leeg tot alles gelezen is, om de reden die bij `useHelden` staat.
 */
export function HeldUitleg({ sticker }: { readonly sticker: string | undefined }) {
  const stand = useHelden();
  const [correct, setCorrect] = useState<number | null>(null);

  useEffect(() => {
    void loadAccuracy().then((tot) => setCorrect(tot.correct));
  }, []);

  if (stand === null || correct === null) return null;

  const naam = t(stickerById(sticker).name);
  const alles = stand.helden.length >= AANTAL_HELDEN;
  const klaar = aanbod(stand).length === 0;

  return (
    <div className="tk-helduitleg">
      <p className="text-lopend">
        <strong className="font-semibold">{t('held.uitlegJouw', { naam })}</strong>{' '}
        {klaar ? t('held.uitlegKlaar') : alles ? t('held.uitlegSterker') : t('held.uitlegVerdien')}
      </p>
      <Vooruitzicht stand={stand} correct={correct} />
      {stand.helden.length > 1 ? <p className="tk-hulp">{t('held.uitlegWissel')}</p> : null}
    </div>
  );
}
