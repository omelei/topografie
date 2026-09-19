import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Brandmark } from '@/components/Brandmark';
import type { TorenStand } from '@/game-core';
import { t } from '@/i18n';
import { leesRustig } from '@/features/player/settings';
import { speelMoment } from '@/features/round/geluid';
import { draaiboek, type Beat, type RondeInvoer } from './draaiboek';
import { Toren } from './Toren';

/**
 * De scène na een ronde (ADR-158): het enige scherm in de app waar iets beweegt.
 *
 * **Eén integer stuurt alles.** Welke beat er speelt staat op `data-fase`, en de
 * CSS beslist wat daarbij binnenkomt. De vertraging tussen de stenen is een
 * custom property, zodat de compositor het werk doet en er nooit tien timers
 * afgezegd hoeven te worden.
 *
 * **Elke animatie is een binnenkomst waarvan het eind de gewone ruststand is.**
 * Geen enkele keyframe houdt met `forwards` iets vast dat niet al in de
 * stylesheet staat. Daardoor is overslaan altijd goed — de eindstand is wat er
 * toch al zou komen — en is de squash van `data-beweging='rustig'` vanzelf de
 * juiste eindstand.
 *
 * **Rustig springt naar het eind.** De squash in de stylesheet drukt alleen
 * duren plat; hij kent de tijdlijn hier niet en hij raakt `animation-delay`
 * niet. Daarom begint de teller bij rustig op de laatste beat en zet het
 * draaiboek de tussenruimte op nul: dezelfde beats, dezelfde zinnen, hetzelfde
 * geluid, nul beweging.
 *
 * **Overslaan neemt niets weg.** De tik zit op de tekening en niet op de pagina,
 * er komt geen laag overheen, en er wordt nooit `preventDefault` aangeroepen. De
 * knoppen eronder werken vanaf de eerste frame, en spatie op een knop met focus
 * drukt die knop in én eindigt de scène.
 */
export function Scene({
  stand,
  invoer,
  geluid,
  mijlpaalZin,
}: {
  /** De toren zoals hij na deze ronde is. */
  readonly stand: TorenStand;
  readonly invoer: Omit<RondeInvoer, 'rustig'>;
  readonly geluid: boolean;
  /** De zin bij een gepasseerd ijkpunt, of null. */
  readonly mijlpaalZin: string | null;
}) {
  const rustig = useMemo(() => leesRustig(), []);
  const plan = useMemo(() => draaiboek({ ...invoer, rustig }), [invoer, rustig]);

  // Bij rustig is de eerste frame meteen de eindstand: er wordt geen enkele
  // timer gewapend.
  const [stap, setStap] = useState(() => (rustig ? plan.beats.length : 0));
  const klaar = stap >= plan.beats.length;

  useEffect(() => {
    if (klaar) return;
    const id = window.setTimeout(() => setStap((n) => n + 1), plan.beats[stap]?.duur ?? 0);
    return () => window.clearTimeout(id);
  }, [stap, klaar, plan]);

  const overslaan = useCallback(() => {
    if (!plan.overslaanbaar) return;
    setStap(plan.beats.length);
  }, [plan]);

  // Het geluid van elke beat die voorbij is, precies één keer — ook wanneer een
  // tik over drie beats heen springt, en ook bij rustig, waar de teller meteen
  // aan het eind begint.
  const geklonken = useRef(-1);
  useEffect(() => {
    for (let i = geklonken.current + 1; i < stap; i++) {
      const moment = plan.beats[i]?.geluid;
      if (moment) speelMoment(moment, geluid);
    }
    geklonken.current = Math.max(geklonken.current, stap - 1);
  }, [stap, plan, geluid]);

  const huidig: Beat | undefined = plan.beats[Math.min(stap, plan.beats.length - 1)];
  const gezet = klaar || (huidig?.id !== 'toren' && huidig?.id !== 'stenen');

  return (
    <div
      className="tk-toneel"
      data-fase={huidig?.id}
      data-af={klaar ? 'ja' : undefined}
      onPointerDown={overslaan}
      style={{ '--tk-steenvertraging': `${plan.perSteen}ms` } as CSSProperties}
    >
      <div className="tk-toneel-beeld">
        <Toren
          stand={stand}
          spook={plan.overslaanbaar ? 0 : invoer.morgen}
          pan={invoer.verdiepingKlaar && gezet ? 1 : 0}
          nieuw={stap >= 1 ? invoer.stenen.length : 0}
        />
        <span className="tk-toneel-denker">
          <Brandmark size={48} uitdrukking={huidig?.denker ?? 'oefenen'} />
        </span>
      </div>

      {mijlpaalZin !== null ? <p className="tk-toneel-mijlpaal">{mijlpaalZin}</p> : null}

      {!plan.overslaanbaar ? (
        <p className="tk-toneel-morgen">
          {invoer.morgen === 0 ? t('toren.leegNul') : t('toren.leeg', { aantal: invoer.morgen })}
        </p>
      ) : null}
    </div>
  );
}
