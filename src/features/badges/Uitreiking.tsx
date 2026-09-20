import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Brandmark } from '@/components/Brandmark';
import { t } from '@/i18n';
import { leesRustig } from '@/features/player/settings';
import { speelMoment } from '@/features/round/geluid';
import { draaiboek } from './draaiboek';
import { GrootDiploma, type DiplomaBeeld } from './GrootDiploma';

/**
 * De diploma-uitreiking: het enige scherm in dit programma waar iets beweegt.
 *
 * Zij neemt het scèneslot over dat ADR-158 op Ronde klaar uitzonderde op de
 * vierhonderdtwintig milliseconden van ADR-142, en maakt het kleiner. Er komt
 * geen tweede uitzondering bij, en tijdens de ronde komt er niets bij.
 *
 * **Eén teller stuurt alles.** Welke beats voorbij zijn staat als `data-aan` op
 * de delen van het diploma; de CSS beslist wat daarbij binnenkomt.
 *
 * **Elke animatie is een binnenkomst waarvan het eind de gewone ruststand is.**
 * Geen enkele keyframe houdt met `forwards` iets vast dat niet al in de
 * stylesheet staat. Daardoor is overslaan altijd goed — de eindstand is wat er
 * toch al zou komen — en is de squash van `data-beweging='rustig'` vanzelf de
 * juiste eindstand.
 *
 * **Rustig springt naar het eind.** De squash in de stylesheet drukt alleen
 * duren plat; hij kent de tijdlijn hier niet. Daarom wordt `rustig` synchroon
 * van `<html>` gelezen — `usePreferences()` geeft bij de eerste render nog de
 * standaardwaarden terug, en een scène die op mount begint zou dan bewegen
 * vóórdat de voorkeur binnen is — en begint de teller meteen aan het eind.
 *
 * **Overslaan neemt niets weg.** De tik zit op de tekening en niet op de
 * pagina, er komt geen laag overheen, en er wordt nooit `preventDefault`
 * aangeroepen. De knoppen eronder staan vanaf de eerste frame in de
 * documentvolgorde en werken vanaf dan.
 */
export function Uitreiking({
  beeld,
  geluid,
  knoppen,
}: {
  readonly beeld: DiplomaBeeld;
  readonly geluid: boolean;
  /** De knoppen eronder. Ze werken vanaf de eerste frame; alleen hun dekking komt op. */
  readonly knoppen: ReactNode;
}) {
  const rustig = useMemo(() => leesRustig(), []);
  const plan = useMemo(() => draaiboek({ rustig }), [rustig]);

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

  const aan = (id: string): 'ja' | undefined => {
    const index = plan.beats.findIndex((beat) => beat.id === id);
    return index >= 0 && stap > index ? 'ja' : undefined;
  };

  return (
    <section className="tk-uitreiking" aria-label={t('diploma.gehaaldKop')}>
      <div data-beat="diploma" data-aan={aan('diploma')} onPointerDown={overslaan}>
        <GrootDiploma beeld={beeld} />
      </div>

      <p className="tk-uitreiking-denker" data-beat="denker" data-aan={aan('denker')}>
        <Brandmark size={44} uitdrukking="goed-gedaan" />
        <span className="tk-uitreiking-kop">{t('diploma.gehaaldKop')}</span>
      </p>

      <div data-beat="knoppen" data-aan={aan('knoppen')}>
        {knoppen}
      </div>
    </section>
  );
}
