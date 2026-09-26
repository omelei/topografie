import { useEffect, useRef, useState } from 'react';
import { DiplomaIcon } from '@/components/Icon';
import {
  diplomaDrempel,
  KLOKDIPLOMA_VRAGEN,
  topodiplomaVragen,
  vlagdiplomaVragen,
  type ModeId,
} from '@/game-core';
import { Embleem } from '@/features/badges/Embleem';
import { doelwitVan, nodigVoor, standVan, type Stand } from '@/features/home/doel';
import { naamVan, type Onderdeel } from '@/features/module/onderdelen';
import { MODULE_ICON } from '@/features/shell/moduleIcons';
import { MODULES } from '@/features/shell/modules';
import { NaamVraag } from '@/features/player/NaamVraag';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { loadBehaald } from '@/store/rewardStore';
import type { ProfileRecord } from '@/store/db';

/** Ten sums of one table, in order: the tafeldiploma's round (`sums.ts`). */
const TAFELDIPLOMA_VRAGEN = 10;

/** Hoeveel vragen een diploma stelt, en hoeveel daarvan goed moeten. */
export function eisenVan(mode: ModeId, setGrootte: number): { vragen: number; drempel: number } {
  if (mode === 'tafeldiploma') return { vragen: TAFELDIPLOMA_VRAGEN, drempel: TAFELDIPLOMA_VRAGEN };
  const vragen =
    mode === 'vlag-diploma'
      ? vlagdiplomaVragen(setGrootte)
      : mode === 'klok-diploma'
        ? Math.min(KLOKDIPLOMA_VRAGEN, setGrootte)
        : topodiplomaVragen(setGrootte);
  return { vragen, drempel: diplomaDrempel(vragen) };
}

interface Voorkennis {
  readonly stand: Stand;
  readonly nodig: number;
  readonly alGehaald: boolean;
}

/**
 * Afzwemmen: het scherm vóór een diplomaronde (ADR-149).
 *
 * Zoals bij het zwemdiploma staat vooraf vast wat er gevraagd wordt, en een
 * kind weet of het klaar is om af te zwemmen: dat hangt aan de pagina, niet
 * aan één goede ronde. Is de pagina rijp, dan vraagt het scherm of er iemand
 * mag meekijken — een diploma is iets om samen te zien. Is ze het nog niet,
 * dan is er één knop, en die gaat terug naar oefenen: de toets afleggen terwijl
 * vaststaat dat er geen diploma uit kan komen, kan hier niet meer.
 *
 * Buiten het frame, zoals een ronde en zijn uitslag (ADR-041).
 *
 * **Zonder naam vraagt dit scherm hem eerst** (ADR-229). De naam komt op het
 * diploma, en dit is het moment waarop hij iets doet: daarom hier, en niet op
 * het eerste scherm van de app.
 */
export function Afzwemmen({
  deel,
  mode,
  onBegin,
  onTerug,
  naamNodig = false,
  onNaam,
}: {
  readonly deel: Onderdeel;
  readonly mode: ModeId;
  readonly onBegin: () => void;
  readonly onTerug: () => void;
  /** Dit kind heeft nog geen naam, en die komt op het diploma (ADR-229). */
  readonly naamNodig?: boolean;
  readonly onNaam?: ((kind: ProfileRecord) => void) | undefined;
}) {
  const [voorkennis, setVoorkennis] = useState<Voorkennis | null>(null);
  const [meekijken, setMeekijken] = useState(false);
  const beginKnop = useRef<HTMLButtonElement>(null);
  const module = MODULES.find((kandidaat) => kandidaat.id === deel.moduleId);
  const ModuleIcon = MODULE_ICON[deel.moduleId];
  const naam = naamVan(deel);
  const eisen = eisenVan(mode, deel.items.length);

  useEffect(() => {
    let levend = true;
    const doelwit = doelwitVan(deel);
    void Promise.all([loadItemStates(), loadBehaald()]).then(([states, behaald]) => {
      if (!levend || doelwit === null) return;
      const stand = standVan(doelwit, states, new Date());
      setVoorkennis({
        stand,
        nodig: nodigVoor(doelwit, stand.totaal),
        alGehaald: behaald.has(doelwit.id),
      });
    });
    return () => {
      levend = false;
    };
  }, [deel, mode]);

  // Wie "ja" zegt, haalt iemand erbij en komt terug bij de knop die begint.
  useEffect(() => {
    if (meekijken) beginKnop.current?.focus();
  }, [meekijken]);

  const eisRegels =
    mode === 'tafeldiploma'
      ? [t('afzwemmen.eisAlles', { vragen: eisen.vragen }), t('afzwemmen.eisEenFout')]
      : [t('afzwemmen.eisVragen', eisen), t('afzwemmen.eisStil')];

  return (
    <main className="tk-uitslag" data-module={deel.moduleId} data-accent="module">
      <div className="tk-uitslag-kolom">
        <header className="flex flex-col gap-3">
          {module ? (
            <p className="tk-modulebadge">
              <ModuleIcon size={16} />
              {t(module.name)}
            </p>
          ) : null}
          <div className="tk-afzwemmen-kop">
            <Embleem
              icon={DiplomaIcon}
              module={deel.moduleId}
              gehaald={voorkennis?.alGehaald ?? false}
            />
            <div className="flex flex-col gap-1">
              <h1 className="tk-titel">{t('afzwemmen.titel', { naam })}</h1>
              <p className="text-lopend text-tekst-secundair">
                {t(`mode.${mode}` as TranslationKey)}
              </p>
            </div>
          </div>
        </header>

        <section className="tk-card flex flex-col gap-3" aria-label={t('afzwemmen.eisenTitel')}>
          <h2 className="tk-sectie">{t('afzwemmen.eisenTitel')}</h2>
          <ul className="tk-regels">
            {[...eisRegels, t('afzwemmen.eisOpnieuw')].map((regel) => (
              <li key={regel}>{regel}</li>
            ))}
          </ul>
        </section>

        {voorkennis === null ? null : (
          <>
            <section
              className="tk-card tk-afzwemmen-stand flex flex-col gap-3"
              data-rijp={voorkennis.stand.rijp ? 'ja' : undefined}
              aria-label={t(voorkennis.stand.rijp ? 'diploma.rijp' : 'afzwemmen.nietRijpTitel')}
            >
              <h2 className="tk-sectie">
                {t(voorkennis.stand.rijp ? 'diploma.rijp' : 'afzwemmen.nietRijpTitel')}
              </h2>
              {voorkennis.stand.rijp ? (
                <p className="text-lopend">
                  {t('afzwemmen.rijpZin', {
                    onthouden: voorkennis.stand.onthouden,
                    totaal: voorkennis.stand.totaal,
                  })}
                </p>
              ) : (
                <>
                  <p className="text-lopend">
                    {voorkennis.stand.onthouden === 0
                      ? t('afzwemmen.nietRijpNiets', { nodig: voorkennis.nodig })
                      : t('afzwemmen.nietRijpZin', {
                          onthouden: voorkennis.stand.onthouden,
                          totaal: voorkennis.stand.totaal,
                          nodig: voorkennis.nodig,
                        })}
                  </p>
                  <p className="text-lopend text-tekst-secundair">
                    {t('afzwemmen.nietRijpUitleg')}
                  </p>
                </>
              )}
              {voorkennis.alGehaald ? (
                <p className="text-tekst-secundair">{t('afzwemmen.alGehaald')}</p>
              ) : null}
            </section>

            {voorkennis.stand.rijp && naamNodig ? (
              <>
                <NaamVraag moment="toets" onKlaar={(kind) => onNaam?.(kind)} />
                <div className="tk-uitslag-knoppen">
                  <button type="button" className="tk-button tk-button-secondary" onClick={onTerug}>
                    {t('afzwemmen.terug')}
                  </button>
                </div>
              </>
            ) : voorkennis.stand.rijp ? (
              <section className="flex flex-col gap-3" aria-label={t('afzwemmen.meekijkenVraag')}>
                <h2 className="tk-sectie">{t('afzwemmen.meekijkenVraag')}</h2>
                <p className="text-lopend">
                  {t(meekijken ? 'afzwemmen.samen' : 'afzwemmen.meekijkenUitleg')}
                </p>
                <div className="tk-uitslag-knoppen">
                  {meekijken ? (
                    <button ref={beginKnop} type="button" className="tk-button" onClick={onBegin}>
                      {t('afzwemmen.begin')}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="tk-button"
                        onClick={() => setMeekijken(true)}
                      >
                        {t('afzwemmen.metIemand')}
                      </button>
                      <button
                        type="button"
                        className="tk-button tk-button-secondary"
                        onClick={onBegin}
                      >
                        {t('afzwemmen.zonder')}
                      </button>
                    </>
                  )}
                  <button type="button" className="tk-button tk-button-secondary" onClick={onTerug}>
                    {t('afzwemmen.terug')}
                  </button>
                </div>
              </section>
            ) : (
              <div className="tk-uitslag-knoppen">
                <button type="button" className="tk-button" onClick={onTerug}>
                  {t('afzwemmen.oefen')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
