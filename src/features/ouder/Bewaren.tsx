import { useEffect, useState } from 'react';
import { CorrectIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { leesBewaarstand, vraagBlijvend, type Bewaarstand } from '@/store/bewaarstand';

/**
 * Of wat de kinderen oefenen op dit apparaat blijft staan (ADR-186).
 *
 * **Waarom dit op de ouderpagina staat.** Het hele product rekent in weken: de
 * langste tussenpoos van Leitner is eenentwintig dagen, en een diploma is iets
 * wat je houdt. Safari gooit na een week zonder bezoek alles weg, en dan is het
 * kind voor wie de planning het best werkt het kind dat alles kwijtraakt
 * (ADR-046). Het kind kan daar niets aan doen; de ouder wel, met één handeling.
 *
 * **Wat het zegt, per browser.** In een tabblad van Safari de regel van de week
 * en hoe je eromheen komt: het beginscherm. Staat de app daar, dan zegt het
 * dat. Elders wat de browser zelf opgeeft over opruimen bij een vol apparaat,
 * met een knop om te vragen of hij het wil bewaren. Weet de browser van niets,
 * dan staat er niets: een blok dat alleen "we weten het niet" zegt, helpt geen
 * ouder.
 *
 * Het vraagt nooit uit zichzelf om te bewaren. Firefox toont daarbij een
 * venster, en de knop is hoe dat venster voor de ouder komt te staan en niet
 * voor een kind.
 */
export function Bewaren() {
  const [stand, setStand] = useState<Bewaarstand | null>(null);
  const [gevraagd, setGevraagd] = useState(false);

  useEffect(() => {
    let weg = false;
    void leesBewaarstand().then((gelezen) => {
      if (!weg) setStand(gelezen);
    });
    return () => {
      weg = true;
    };
  }, []);

  if (stand === null) return null;
  if (stand.beginscherm === 'onbekend' && stand.blijvend === null) return null;

  async function vraag() {
    const antwoord = await vraagBlijvend();
    setGevraagd(true);
    if (antwoord !== null && stand !== null) setStand({ ...stand, blijvend: antwoord });
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t('bewaren.titel')}>
      <h2 className="tk-sectie">{t('bewaren.titel')}</h2>
      <div className="tk-card flex flex-col gap-3">
        {stand.beginscherm === 'kan-erop' ? (
          <>
            <p className="text-lopend">{t('bewaren.safari')}</p>
            <p className="text-lopend">{t('bewaren.beginscherm')}</p>
            <p className="tk-hulp">{t('bewaren.beginschermLet')}</p>
          </>
        ) : stand.beginscherm === 'staat-erop' || stand.blijvend === true ? (
          <p className="flex items-start gap-2 text-lopend">
            <CorrectIcon size={24} />
            <span>
              {stand.beginscherm === 'staat-erop' ? t('bewaren.staatErop') : t('bewaren.blijvend')}
            </span>
          </p>
        ) : (
          <>
            <p className="text-lopend">{t('bewaren.magOpruimen')}</p>
            <button
              type="button"
              className="tk-button tk-button-secondary self-start"
              onClick={() => void vraag()}
            >
              {t('bewaren.vraag')}
            </button>
            {gevraagd ? (
              <p role="status" className="tk-hulp">
                {t('bewaren.nee')}
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
