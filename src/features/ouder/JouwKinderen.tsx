import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  dayKey,
  huidigeGroep,
  setRetention,
  WEEK_DREMPEL,
  weekOverzicht,
  type Groep,
  type WeekOverzicht,
} from '@/game-core';
import { TodayIcon } from '@/components/Icon';
import { t } from '@/i18n';
import { planSets } from '@/features/home/useVandaag';
import { naamVanSet, startbareOnderdelen } from '@/features/module/onderdelen';
import { AvatarTeken } from '@/features/player/avatars';
import { GroepKiezer } from '@/features/player/GroepKiezer';
import { PremiumSlot } from '@/features/premium/PremiumSlot';
import { leesbareDatum, usePremium } from '@/features/premium/usePremium';
import { geheugen, geoefend, perDag } from '@/features/retention/statistiek';
import {
  AVATAR_SLEUTEL,
  createChild,
  listChildren,
  MAX_KINDEREN,
  renameChild,
  setGroep,
} from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import { leesGeheugencheck, type GeheugencheckUitslag } from '@/store/geheugencheck';
import { verwijderKind } from '@/store/kindWeg';
import { loadItemStates, loadPlayedRounds } from '@/store/progress';
import { wensenVan } from '@/store/wensen';
import {
  GEEN_DOELEN,
  leesWeekdoelen,
  schrijfWeekdoelen,
  type Weekdoelen,
} from '@/store/weekdoelStore';

/**
 * Jouw kinderen, op de ouderpagina (ADR-262).
 *
 * **Eén kaart per kind, met alles over dat kind.** Er stonden vier blokken die
 * elk alle kinderen langsgingen: de namen ("Je kinderen", ADR-173), hoe het gaat
 * (ADR-177), deze week (ADR-227) en de geheugencheck (ADR-228). Een ouder met
 * twee kinderen las dan vier keer twee namen, en moest zelf bij elkaar zoeken
 * wat bij wie hoort. Nu staat per kind alles onder zijn naam: wat het wil, hoe
 * het gaat, wat het deze week deed en de geheugencheck. Naam, groep en weghalen
 * zitten achter "Wijzig", want dat doe je zelden.
 *
 * **Per kind en niet opgeteld** (ADR-177): twee kinderen optellen geeft een
 * getal dat over niemand gaat. Hoe het gaat is voortgang, en die staat er alleen
 * met premium (ADR-192); zonder code staat er één voorbeeld onder de kaarten.
 * Deze week en de geheugencheck staan er ook zonder code, met het aanbod
 * eronder, en niet als knop: de knop staat één keer op de pagina, bij de
 * premiumcode (ADR-236).
 *
 * **De weekdoelen staan hier**, onder de kaarten: of de app de kinderen doelen
 * voorstelt, gaat over wat de app van ze vraagt (ADR-171).
 *
 * **`onVeranderd`** zegt het tegen de rest van de pagina: `Overname` zet soms
 * een kind op dit apparaat, en dan begint dit blok opnieuw (ADR-189).
 */

/** De horizon van elke voorspelling in het product: drie weken. */
const DRIE_WEKEN_MS = 21 * 86_400_000;

interface Stand {
  readonly onthouden: number;
  readonly geoefend: number;
  /** Op hoeveel van de laatste zeven dagen er een ronde was. */
  readonly dagen: number;
  /** Naar schatting over drie weken, 0-100. Null zonder geoefend werk. */
  readonly schatting: number | null;
}

interface Overzicht {
  readonly kind: ProfileRecord;
  /** Of het kind ooit iets oefende. */
  readonly begonnen: boolean;
  /** Hoe het gaat, alleen met premium (ADR-192). */
  readonly stand: Stand | null;
  /** Deze week, vanaf 5 onderdelen (ADR-227). */
  readonly week: WeekOverzicht | null;
  readonly check: GeheugencheckUitslag | null;
  readonly klaar: readonly string[];
  readonly wil: readonly string[];
}

async function lees(actief: boolean): Promise<Overzicht[]> {
  const kinderen = await listChildren();
  const now = new Date();
  const sets = planSets(startbareOnderdelen());

  return Promise.all(
    kinderen.map(async (kind) => {
      const states = await loadItemStates(kind.id);
      const week = weekOverzicht(sets, states, now);
      let stand: Stand | null = null;
      if (actief) {
        const rondes = await loadPlayedRounds(kind.id);
        const geheugenStand = geheugen(states, now);
        const gezien = [...states.keys()];
        stand = {
          onthouden: geheugenStand.onthouden,
          geoefend: geoefend(geheugenStand),
          dagen: perDag(rondes, now).filter((dag) => dag.rondes > 0).length,
          schatting:
            gezien.length === 0
              ? null
              : setRetention(states, gezien, new Date(now.getTime() + DRIE_WEKEN_MS)),
        };
      }
      return {
        kind,
        begonnen: states.size > 0,
        stand,
        week: week.geoefend >= WEEK_DREMPEL ? week : null,
        check: await leesGeheugencheck(kind.id),
        ...wensenVan(kind.id),
      };
    }),
  );
}

/** "vandaag", "morgen", of "dinsdag 29 september". */
function dagNaam(dag: string, now: Date): string {
  if (dag === dayKey(now)) return t('ouder.weekVandaag');
  const morgen = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (dag === dayKey(morgen)) return t('ouder.weekMorgen');
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dag}T12:00:00`));
}

export function JouwKinderen({ onVeranderd }: { readonly onVeranderd?: () => void }) {
  const { actief } = usePremium();
  const [overzicht, setOverzicht] = useState<readonly Overzicht[] | null>(null);
  const [versie, setVersie] = useState(0);
  const [erbij, setErbij] = useState(false);
  const [naam, setNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const veld = useId();

  useEffect(() => {
    let levend = true;
    void lees(actief).then((gelezen) => {
      if (levend) setOverzicht(gelezen);
    });
    return () => {
      levend = false;
    };
  }, [actief, versie]);

  const opnieuw = () => {
    setVersie((vorige) => vorige + 1);
    onVeranderd?.();
  };

  async function voegToe(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '') return;
    setBezig(true);
    await createChild(naam);
    setNaam('');
    setErbij(false);
    setBezig(false);
    opnieuw();
  }

  const lijst = overzicht ?? [];
  const vol = lijst.length >= MAX_KINDEREN;
  const metWeek = lijst.some((kind) => kind.week !== null);
  const metCheck = lijst.some((kind) => kind.check !== null);

  return (
    <section id="kinderen" className="tk-ouderblok" aria-label={t('ouder.kinderen')}>
      <h2 className="tk-sectie">{t('ouder.kinderen')}</h2>

      <ul className="tk-kindkaarten" aria-busy={overzicht === null}>
        {lijst.map((rij) => (
          <KindKaart
            key={rij.kind.id}
            overzicht={rij}
            magWeg={lijst.length > 1}
            onVeranderd={opnieuw}
          />
        ))}
        {vol ? null : (
          <li className="tk-kindkaart tk-kindkaart-erbij">
            {erbij ? (
              <form
                className="flex flex-wrap items-end gap-3"
                onSubmit={(event) => void voegToe(event)}
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor={veld} className="tk-label">
                    {t('ouder.kindNaam')}
                  </label>
                  <input
                    id={veld}
                    className="tk-input max-w-xs"
                    value={naam}
                    onChange={(event) => setNaam(event.target.value)}
                    autoComplete="off"
                    maxLength={24}
                    autoFocus
                  />
                </div>
                <button type="submit" className="tk-button" disabled={bezig || naam.trim() === ''}>
                  {t('ouder.kindToevoegen')}
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="tk-button tk-button-secondary self-start"
                onClick={() => setErbij(true)}
              >
                {t('ouder.nogEenKind')}
              </button>
            )}
          </li>
        )}
      </ul>

      <p className="tk-hulp">
        {vol ? t('ouder.kinderenVol', { aantal: MAX_KINDEREN }) : t('ouder.kinderenUitleg')}
      </p>

      {/* Zonder code: wat premium hier per kind zou laten zien, als voorbeeld,
          en één regel per blok dat het plan zou aanvullen (ADR-232, ADR-236). */}
      {actief ? (
        <>
          <p className="tk-hulp">{t('ouder.hoeGaatHetUitleg')}</p>
          {metCheck ? <p className="tk-hulp">{t('ouder.geheugencheckMetPremium')}</p> : null}
        </>
      ) : (
        <>
          <Voorbeeld />
          <PremiumSlot wat="premium.wat.voortgang" zonderKnop />
          {metWeek ? <p className="tk-hulp">{t('ouder.weekAanbod')}</p> : null}
          {metCheck ? <p className="tk-hulp">{t('ouder.geheugencheckAanbod')}</p> : null}
        </>
      )}

      <WeekdoelenSchakelaar />
    </section>
  );
}

/** Eén kind: wie het is, en alles wat er over dit kind te zeggen valt. */
function KindKaart({
  overzicht,
  magWeg,
  onVeranderd,
}: {
  readonly overzicht: Overzicht;
  readonly magWeg: boolean;
  readonly onVeranderd: () => void;
}) {
  const { kind, begonnen, stand, week, check, klaar, wil } = overzicht;
  const [open, setOpen] = useState(false);
  const groep = huidigeGroep(kind, new Date());
  const kopId = useId();
  const now = new Date();
  const dagen =
    week === null ? '' : week.herhaaldagen.map((dag) => dagNaam(dag, now)).join(t('ouder.weekEn'));
  const onderwerp = check === null ? '' : naamVanSet(check.setId);

  return (
    <li className="tk-kindkaart">
      <div className="tk-kindkaart-kop">
        <span className="tk-plaat tk-plaat-avatar tk-kindkaart-avatar" aria-hidden="true">
          <AvatarTeken id={kind.avatarConfig[AVATAR_SLEUTEL]} naam={kind.naam} size={48} />
        </span>
        <div className="tk-kindkaart-wie">
          <h3 id={kopId} className="tk-kindkaart-naam">
            {kind.naam}
          </h3>
          <p className="tk-hulp">
            {groep === undefined ? t('ouder.geenGroep') : t('ouder.inGroep', { groep })}
          </p>
        </div>
        <button
          type="button"
          className="tk-button tk-button-tertiary tk-kindkaart-wijzig"
          aria-expanded={open}
          aria-label={t('ouder.kindWijzig', { naam: kind.naam })}
          onClick={() => setOpen(!open)}
        >
          {t(open ? 'ouder.wijzigKlaar' : 'ouder.wijzig')}
        </button>
      </div>

      {open ? <KindBewerken kind={kind} magWeg={magWeg} onVeranderd={onVeranderd} /> : null}

      {klaar.length > 0 || wil.length > 0 ? (
        <div className="tk-kindkaart-wens">
          {klaar.map((wat) => (
            <p key={wat} className="text-lopend">
              {t('ouder.wensKlaar', { naam: kind.naam, wat })}
            </p>
          ))}
          {wil.length > 0 ? (
            <>
              <p className="text-lopend">{t('ouder.wensWil', { naam: kind.naam })}</p>
              <ul className="list-disc pl-6 text-lopend">
                {wil.map((wat) => (
                  <li key={wat}>{wat}</li>
                ))}
              </ul>
            </>
          ) : null}
          <a className="tk-hulp underline" href="#premiumcode">
            {t('ouder.naarPremiumcode')}
          </a>
        </div>
      ) : null}

      {!begonnen ? (
        <p className="text-lopend text-tekst-secundair">
          {t('ouder.kindNogNiets', { naam: kind.naam })}
        </p>
      ) : null}

      {stand !== null && stand.geoefend > 0 ? (
        <div className="tk-kindkaart-deel">
          <h4 className="tk-kindkaart-deelkop">{t('ouder.hoeGaatHet')}</h4>
          <p className="tk-reeks-getal">
            <span className="tk-reeks-aantal">{stand.onthouden}</span>
            <span className="tk-reeks-zin">{t('ouder.kindKent', { naam: kind.naam })}</span>
          </p>
          <p className="tk-hulp">
            {t('ouder.kindKentVan', { aantal: stand.geoefend, naam: kind.naam })}
          </p>
          <p className="text-lopend">
            {t(stand.dagen === 1 ? 'ouder.kindDagEen' : 'ouder.kindDagen', {
              dagen: stand.dagen,
              naam: kind.naam,
            })}
          </p>
          {stand.schatting === null ? null : (
            <p className="text-lopend text-tekst-secundair">
              {t('ouder.kindSchatting', { procent: stand.schatting })}
            </p>
          )}
        </div>
      ) : null}

      {week === null ? null : (
        <div className="tk-kindkaart-deel">
          <h4 className="tk-kindkaart-deelkop">{t('ouder.week')}</h4>
          <p className="text-lopend">
            {t('ouder.weekGeoefend', { naam: kind.naam, aantal: week.geoefend })}
          </p>
          {dagen === '' ? null : <WeekPlan naam={kind.naam} dagen={dagen} />}
        </div>
      )}

      {check === null ? null : (
        <div className="tk-kindkaart-deel">
          <h4 className="tk-kindkaart-deelkop">{t('ouder.geheugencheck')}</h4>
          <p className="tk-reeks-getal">
            <span className="tk-reeks-aantal">{check.goed}</span>
            <span className="tk-reeks-zin">
              {t('ouder.geheugencheckVan', { gevraagd: check.gevraagd })}
            </span>
          </p>
          <p className="text-lopend">
            {t(
              onderwerp === '' ? 'ouder.geheugencheckUitleg' : 'ouder.geheugencheckUitlegOnderwerp',
              {
                naam: kind.naam,
                datum: leesbareDatum(check.dag),
                onderwerp,
              },
            )}
          </p>
        </div>
      )}
    </li>
  );
}

/** Wanneer het plan het weer klaarzet: een feit met premium, anders het aanbod. */
function WeekPlan({ naam, dagen }: { readonly naam: string; readonly dagen: string }) {
  const { actief } = usePremium();
  return (
    <p className="text-lopend">
      {t(actief ? 'ouder.weekPlan' : 'ouder.weekPlanPremium', { naam, dagen })}
    </p>
  );
}

/** Naam, groep en weghalen: achter "Wijzig", want dat doe je zelden. */
function KindBewerken({
  kind,
  magWeg,
  onVeranderd,
}: {
  readonly kind: ProfileRecord;
  readonly magWeg: boolean;
  readonly onVeranderd: () => void;
}) {
  const [naam, setNaam] = useState(kind.naam);
  const [bezig, setBezig] = useState(false);
  const veld = useId();
  const groep = huidigeGroep(kind, new Date());

  async function bewaarNaam(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '' || naam.trim() === kind.naam) return;
    setBezig(true);
    await renameChild(kind.id, naam);
    setBezig(false);
    onVeranderd();
  }

  async function kiesGroep(gekozen: Groep | undefined) {
    setBezig(true);
    await setGroep(kind.id, gekozen);
    setBezig(false);
    onVeranderd();
  }

  return (
    <div className="tk-kindkaart-bewerken">
      <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void bewaarNaam(e)}>
        <div className="flex flex-col gap-2">
          <label htmlFor={veld} className="tk-label">
            {t('ouder.kindNaam')}
          </label>
          <input
            id={veld}
            className="tk-input max-w-xs"
            value={naam}
            onChange={(event) => setNaam(event.target.value)}
            autoComplete="off"
            maxLength={24}
          />
        </div>
        <button
          type="submit"
          className="tk-button tk-button-secondary"
          disabled={bezig || naam.trim() === '' || naam.trim() === kind.naam}
        >
          {t('ouder.naamBewaren')}
        </button>
      </form>

      <p className="tk-label">{t('ouder.groepVan', { naam: kind.naam })}</p>
      <GroepKiezer
        gekozen={groep}
        label={t('ouder.groepVan', { naam: kind.naam })}
        uitweg="groep.geen"
        bezig={bezig}
        onKies={(gekozen) => void kiesGroep(gekozen)}
      />

      {magWeg ? <Weghalen kind={kind} onWeg={onVeranderd} /> : null}
    </div>
  );
}

/** Dit kind van het apparaat halen, na één vraag (ADR-198). */
function Weghalen({ kind, onWeg }: { readonly kind: ProfileRecord; readonly onWeg: () => void }) {
  const [zeker, setZeker] = useState(false);
  const [bezig, setBezig] = useState(false);

  async function haalWeg() {
    setBezig(true);
    if (await verwijderKind(kind.id)) onWeg();
    setBezig(false);
  }

  if (!zeker) {
    return (
      <button
        type="button"
        className="tk-button tk-button-tertiary self-start"
        onClick={() => setZeker(true)}
      >
        {t('ouder.kindWeg', { naam: kind.naam })}
      </button>
    );
  }

  return (
    <div className="tk-card flex flex-col gap-3">
      <p className="text-lopend">{t('ouder.kindWegZeker', { naam: kind.naam })}</p>
      <p className="text-lopend text-tekst-secundair">{t('wissen.onomkeerbaar')}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="tk-button" onClick={() => setZeker(false)}>
          {t('wissen.laatMaar')}
        </button>
        <button
          type="button"
          className="tk-button tk-button-secondary"
          disabled={bezig}
          onClick={() => void haalWeg()}
        >
          {t('ouder.kindWegDoe', { naam: kind.naam })}
        </button>
      </div>
    </div>
  );
}

/**
 * Wat dit blok met premium laat zien, als voorbeeld (ADR-232).
 *
 * Met een voorbeeldkind en voorbeeldcijfers, nooit die van het eigen kind: een
 * getal over je eigen kind dat verzonnen is, is erger dan geen getal.
 */
function Voorbeeld() {
  const naam = t('ouder.voorbeeldNaam');
  return (
    <figure
      className="tk-card tk-voorbeeld flex flex-col gap-2"
      aria-label={t('ouder.voorbeeldLabel')}
    >
      <figcaption className="tk-pil self-start">{t('ouder.voorbeeldLabel')}</figcaption>
      <h3 className="tk-sectie">{naam}</h3>
      <p className="tk-reeks-getal">
        <span className="tk-reeks-aantal">90</span>
        <span className="tk-reeks-zin">{t('ouder.kindKent', { naam })}</span>
      </p>
      <p className="tk-hulp">{t('ouder.kindKentVan', { aantal: 120, naam })}</p>
      <p className="text-lopend">{t('ouder.kindDagen', { dagen: 4, naam })}</p>
      <p className="text-lopend text-tekst-secundair">
        {t('ouder.kindSchatting', { procent: 85 })}
      </p>
    </figure>
  );
}

/**
 * Of de app doelen voor de week voorstelt, voor het hele gezin (ADR-171). Het
 * is de schakelaar die bepaalt of de app de kinderen ergens toe aanzet, en dat
 * is een besluit van de ouder.
 */
function WeekdoelenSchakelaar() {
  const [doelen, setDoelen] = useState<Weekdoelen | null>(null);

  useEffect(() => {
    void leesWeekdoelen().then(setDoelen);
  }, []);

  const uit = doelen?.uit ?? false;

  return (
    <ul className="tk-lijst" aria-busy={doelen === null}>
      <li>
        <button
          type="button"
          className="tk-lijstrij"
          aria-pressed={!uit}
          onClick={() => {
            const huidig = doelen ?? GEEN_DOELEN;
            const volgende = { ...huidig, uit: !huidig.uit };
            void schrijfWeekdoelen(volgende).then(() => setDoelen(volgende));
          }}
        >
          <span className="tk-plaat tk-plaat-neutraal">
            <TodayIcon size={24} />
          </span>
          <span className="tk-lijstrij-tekst">
            <span className="tk-lijstrij-titel">{t('you.doelen')}</span>
            <span className="tk-lijstrij-regel">{t('you.doelenWhy')}</span>
          </span>
          <span className="tk-lijstrij-pijl">
            <span className="tk-schakelaar" aria-hidden="true" />
            <span className="tk-label">{uit ? t('you.off') : t('you.on')}</span>
          </span>
        </button>
      </li>
    </ul>
  );
}
