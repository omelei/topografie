import { useEffect, useState } from 'react';
import { t } from '@/i18n';
import { setRetention, type ItemState } from '@/game-core';
import { isPremiumOnderwerp } from '@/features/module/premium';
import { naamVan, startbareOnderdelen, type Onderdeel } from '@/features/module/onderdelen';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { usePremium } from '@/features/premium/usePremium';
import { loadItemStates } from '@/store/progress';
import { weekbericht, type BerichtSet } from './weekbericht';

/**
 * Het weekbericht (ADR-133), sinds ADR-171 op Jij tussen de andere cijfers.
 *
 * Het stond op Voor ouders, de enige pagina die een ouder opende. Die pagina is
 * er niet meer: ouders loggen niet in, kinderen wel. De drie zinnen zijn
 * feiten en geen oproep, dus ze lezen voor een kind net zo goed.
 *
 * Boven dit blok staan vier tegels met feiten over deze week. Dit blok leest ze:
 * is er geoefend, blijft het hangen, en wat wacht er. Die drie zinnen zijn waar
 * het abonnement over gaat — de vraag achter een betaling is niet "hoeveel
 * rondes" maar "gaat het goed, en moet ik iets doen".
 *
 * **Premium**, en zonder code staat er één slot in plaats van drie halve zinnen.
 * De vier tegels erboven blijven gratis: dat zijn feiten over het eigen kind en
 * die houd je niet achter (ADR-124).
 */
export function Weekbericht({
  afgemaakt,
  now,
}: {
  /** De momenten waarop een ronde is afgemaakt, nieuwste eerst. */
  readonly afgemaakt: readonly string[];
  readonly now: Date;
}) {
  const { actief } = usePremium();
  const [states, setStates] = useState<ReadonlyMap<string, ItemState> | null>(null);

  useEffect(() => {
    void loadItemStates().then(setStates);
  }, []);

  if (!actief) {
    return (
      <section className="flex flex-col gap-3" aria-label={t('you.berichtTitel')}>
        <h2 className="tk-sectie">{t('you.berichtTitel')}</h2>
        <PremiumSlot wat="premium.wat.bericht" />
      </section>
    );
  }

  if (states === null) return null;

  const sets = berichtSets(startbareOnderdelen());
  const geoefendeIds = [...states.keys()];
  const bericht = weekbericht({
    afgemaakt,
    sets,
    states,
    onthouden: geoefendeIds.length === 0 ? null : setRetention(states, geoefendeIds, now),
    now,
  });

  return (
    <section className="flex flex-col gap-3" aria-label={t('you.berichtTitel')}>
      <h2 className="tk-sectie">{t('you.berichtTitel')}</h2>
      <div className="tk-card flex flex-col gap-2">
        <p className="text-lopend">{oefenZin(bericht.geoefend, bericht.schooldagen)}</p>
        {bericht.onthouden !== null ? (
          <p className="text-lopend">{t('you.berichtOnthouden', { procent: bericht.onthouden })}</p>
        ) : null}
        <p className="text-lopend">{wachtZin(bericht.wankelt)}</p>
        {/* De reeks stond hier voor de ouder (ADR-158). Het kind ziet hem niet
            (ADR-169), en dit blok staat nu bij het kind (ADR-171). */}
      </div>
    </section>
  );
}

/**
 * De sets waar het bericht over rekent.
 *
 * Dezelfde twee uitzonderingen als het dagplan en het toetsvooruitzicht: een mix
 * is de andere sets bij elkaar en zou zichzelf altijd aanwijzen, en een
 * foutenlijst is een dwarsdoorsnede en geen set.
 */
function berichtSets(alles: readonly Onderdeel[]): BerichtSet<Onderdeel>[] {
  return alles
    .filter((deel) => !deel.mix && !isPremiumOnderwerp(deel.setId))
    .map((deel) => ({ set: deel, items: deel.items }));
}

function oefenZin(geoefend: number, schooldagen: number): string {
  if (geoefend === 0) return t('you.berichtNiets');
  if (geoefend === 1) return t('you.berichtGeoefendEen', { schooldagen });
  return t('you.berichtGeoefend', { dagen: geoefend, schooldagen });
}

function wachtZin(wankelt: ReturnType<typeof weekbericht<Onderdeel>>['wankelt']): string {
  if (wankelt === null) return t('you.berichtNiksWacht');
  const set = naamVan(wankelt.set);
  if (wankelt.wacht === 0) return t('you.berichtWankeltVandaag', { set, aantal: wankelt.aantal });
  if (wankelt.aantal === 1) return t('you.berichtWankeltEen', { set, dagen: wankelt.wacht });
  return t('you.berichtWankelt', { set, aantal: wankelt.aantal, dagen: wankelt.wacht });
}
