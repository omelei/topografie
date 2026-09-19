import { useEffect, useState, type CSSProperties } from 'react';
import { Brandmark } from '@/components/Brandmark';
import { bereikt, standVan, volgende, type Register, type TorenStand } from '@/game-core';
import { geheugen, type Geheugen } from '@/features/retention/statistiek';
import { t, type TranslationKey } from '@/i18n';
import { loadItemStates } from '@/store/progress';
import { leesToren } from '@/store/torenStore';
import { ReeksBlok } from './ReeksBlok';
import { useReeks } from './reeks';
import { useRegister } from './register';
import { Toren } from './Toren';

/**
 * De toren op Jij (ADR-158): wat een kind tot nu toe heeft staan.
 *
 * **Twee gezichten, één regel.** Wat een steen is verandert hier niet; alleen
 * wat er vooraan staat. Een kind van zes krijgt het beeld en een zin; een kind
 * van twaalf krijgt de getallen en de datumlog, want dat is voor die leeftijd
 * het interessantste deel.
 *
 * Naast de getallen staat de onthoudring. Dat is met opzet: het is het antwoord
 * op het bezwaar dat een twaalfjarige binnen een week zelf bedenkt — hoe beter
 * ik iets ken, hoe minder stenen ik krijg. Dat klopt, en de ring is het getal
 * dat juist wél omhooggaat naarmate je iets beheerst. Twee getallen die de
 * andere kant op wijzen zijn eerlijker dan één dat alles moet dragen.
 */
export function TorenPagina() {
  const register = useRegister();
  const reeks = useReeks();
  const [stand, setStand] = useState<TorenStand | null>(null);
  const [onthouden, setOnthouden] = useState<Geheugen | null>(null);

  useEffect(() => {
    let levend = true;
    void Promise.all([leesToren(), loadItemStates()]).then(([toren, states]) => {
      if (!levend) return;
      setStand(standVan(toren));
      setOnthouden(geheugen(states, new Date()));
    });
    return () => {
      levend = false;
    };
  }, []);

  if (stand === null) return null;

  return (
    <>
      <section className="flex flex-col gap-3" aria-label={t('toren.naam')}>
        <div className="tk-sectie">
          <h2>{t('toren.naam')}</h2>
        </div>

        <div className="tk-card tk-torenkaart" data-register={register}>
          {register === 'getal' ? (
            <Getallen stand={stand} onthouden={onthouden} />
          ) : (
            <Beeld stand={stand} />
          )}
          <p className="tk-hulp">{t('toren.uitleg')}</p>
        </div>
      </section>

      <ReeksBlok reeks={reeks} />
    </>
  );
}

/** De zin bij het hoogste ijkpunt dat gehaald is, of null. */
function hogerDan(stand: TorenStand, register: Register): string | null {
  const gehaald = bereikt(stand.verdiepingen, register);
  if (gehaald === null) return null;
  return t('toren.hoger', { ding: t(`ijkpunt.${gehaald.id}` as TranslationKey) });
}

/** De zin naar het eerstvolgende ijkpunt, of null als er geen meer is. */
function naarHoger(stand: TorenStand, register: Register): string | null {
  const komt = volgende(stand.verdiepingen, register);
  if (komt === null) return null;
  return t('toren.naarHoger', {
    aantal: komt.verdiepingen - stand.verdiepingen,
    ding: t(`ijkpunt.${komt.id}` as TranslationKey),
  });
}

/**
 * Het beeldgezicht: de toren groot, Denker aan de voet, en één zin.
 *
 * Geen meters en geen datums. Denker staat er op een vaste maat en niet op ware
 * schaal: een poppetje dat met de toren mee krimpt, is bij tien verdiepingen
 * een stip, en dan zegt het niets meer. Wat de hoogte betekent, staat in
 * woorden — en dat is ook wat een kind van zes ervan navertelt.
 */
function Beeld({ stand }: { readonly stand: TorenStand }) {
  const hoger = hogerDan(stand, 'beeld');
  const komt = naarHoger(stand, 'beeld');

  return (
    <>
      <div className="tk-torenbeeld">
        <Toren stand={stand} />
        <span className="tk-torenbeeld-denker">
          <Brandmark size={40} uitdrukking={stand.stenen === 0 ? 'iets-nieuws' : 'goed-gedaan'} />
        </span>
      </div>

      {stand.stenen === 0 ? (
        <p className="text-lopend">{t('toren.leegNul')}</p>
      ) : (
        <>
          {hoger !== null ? <p className="tk-torenzin">{hoger}</p> : null}
          <p className="text-lopend">
            {stand.rest === 1
              ? t('toren.restEen', { n: stand.inAanbouw })
              : t('toren.rest', { aantal: stand.rest, n: stand.inAanbouw })}
          </p>
          {komt !== null ? <p className="tk-hulp">{komt}</p> : null}
        </>
      )}
    </>
  );
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Het getallengezicht: de stand voorop, de datumlog eronder, de toren ernaast.
 *
 * Nuchtere woorden en geen aaibaarheid. De datumlog staat hier hoog omdat hij
 * voor deze leeftijd het interessantste deel is: het is de enige plek in de app
 * waar staat wanneer iets gebeurde.
 */
function Getallen({
  stand,
  onthouden,
}: {
  readonly stand: TorenStand;
  readonly onthouden: Geheugen | null;
}) {
  const hoger = hogerDan(stand, 'getal');
  const komt = naarHoger(stand, 'getal');
  const procent = onthouden?.overDrieWeken ?? null;

  return (
    <>
      <div className="tk-torengetallen">
        <div className="flex min-w-0 flex-col gap-2">
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
            <span className="tk-torenstand-deel">{t('toren.hoogte', { meter: stand.meter })}</span>
          </p>
          {hoger !== null ? <p className="text-lopend">{hoger}</p> : null}
          {komt !== null ? <p className="tk-hulp">{komt}</p> : null}
        </div>

        <div className="tk-torengetallen-beeld">
          <Toren stand={stand} />
        </div>
      </div>

      {/* Het getal dat wél omhooggaat naarmate je iets kent. */}
      {procent !== null ? (
        <div className="tk-torenring">
          <div
            className="tk-ring"
            style={{ '--vul': `${procent}%` } as CSSProperties}
            aria-hidden="true"
          >
            <span className="tk-ring-getal">{t('retention.procent', { procent })}</span>
            <span className="tk-ring-label">{t('retention.ringLabel')}</span>
          </div>
          <p className="text-lopend">{t('retention.ringZin', { procent })}</p>
        </div>
      ) : null}

      {stand.volle.length > 0 ? (
        <ul className="tk-verdiepinglog">
          {[...stand.volle].reverse().map((verdieping) => (
            <li key={verdieping.nummer}>
              {t('toren.verdiepingDatum', {
                n: verdieping.nummer,
                datum: DATUM.format(new Date(verdieping.datum)),
              })}
            </li>
          ))}
        </ul>
      ) : null}

      {stand.fundament > 0 ? <p className="tk-hulp">{t('toren.fundamentUitleg')}</p> : null}
    </>
  );
}
