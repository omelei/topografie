import { useEffect, useState } from 'react';
import { bereikt, type TorenStand } from '@/game-core';
import { t, type TranslationKey } from '@/i18n';
import { leesToren } from '@/store/torenStore';
import { standVan } from '@/game-core';
import { Toren } from './Toren';

/**
 * De toren op Jij (ADR-158): wat een kind tot nu toe heeft staan.
 *
 * Vervangt `AlbumOverzicht`. Dat toonde zes modules met elk hun eigen pagina's
 * en lagen; hier staat één beeld en één getal, want de toren telt over alle
 * vakken tegelijk. Dat is niet alleen eenvoudiger — het is ook het antwoord op
 * de vraag waarom een set die je goed kent minder oplevert: er is altijd een
 * ander vak dat wél stenen geeft.
 *
 * De verdiepingen rijzen bij binnenkomst van onder naar boven op. Dat is de
 * enige beweging hier, hij duurt samen hoogstens 700ms, en bij rustig staat
 * alles meteen stil — de animatie is een binnenkomst naar de gewone ruststand,
 * dus de squash in de stylesheet landt vanzelf goed.
 */
export function TorenPagina() {
  const [stand, setStand] = useState<TorenStand | null>(null);

  useEffect(() => {
    let levend = true;
    void leesToren().then((toren) => {
      if (levend) setStand(standVan(toren));
    });
    return () => {
      levend = false;
    };
  }, []);

  if (stand === null) return null;

  const gehaald = bereikt(stand.verdiepingen, 'beeld');

  return (
    <section className="flex flex-col gap-3" aria-label={t('toren.naam')}>
      <div className="tk-sectie">
        <h2>{t('toren.naam')}</h2>
      </div>

      <div className="tk-card flex flex-col gap-4">
        <Toren stand={stand} />

        {stand.stenen === 0 ? (
          <p className="text-lopend">{t('toren.leegNul')}</p>
        ) : (
          <>
            <p className="tk-torenstand">
              <span className="tk-torenstand-getal">
                {stand.stenen === 1
                  ? t('toren.totaalEen')
                  : t('toren.totaal', { aantal: stand.stenen })}
              </span>
              <span className="tk-torenstand-deel">
                {stand.verdiepingen === 1
                  ? t('toren.verdiepingEen')
                  : t('toren.verdiepingen', { aantal: stand.verdiepingen })}
              </span>
              <span className="tk-torenstand-deel">
                {t('toren.hoogte', { meter: stand.meter })}
              </span>
            </p>

            {gehaald !== null ? (
              <p className="text-lopend">
                {t('toren.hoger', { ding: t(`ijkpunt.${gehaald.id}` as TranslationKey) })}
              </p>
            ) : null}

            <p className="tk-hulp">
              {stand.rest === 1
                ? t('toren.restEen', { n: stand.inAanbouw })
                : t('toren.rest', { aantal: stand.rest, n: stand.inAanbouw })}
            </p>

            {stand.fundament > 0 ? <p className="tk-hulp">{t('toren.fundamentUitleg')}</p> : null}
          </>
        )}

        <p className="tk-hulp">{t('toren.uitleg')}</p>
      </div>
    </section>
  );
}
