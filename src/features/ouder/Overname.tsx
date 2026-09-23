import { useEffect, useId, useState, type FormEvent } from 'react';
import { CorrectIcon, PupilIcon } from '@/components/Icon';
import { t, type TranslationKey } from '@/i18n';
import { useAccount } from '@/features/account/useAccount';
import { leesbareDatum } from '@/features/premium/usePremium';
import { listChildren } from '@/store/children';
import type { ProfileRecord } from '@/store/db';
import type { Koppeling } from '@/store/gezin/koppeling';
import {
  gezinsstand,
  haalUitAccount,
  koppelAan,
  laadOvernameDiensten,
  neemMee,
  verstuurOpnieuw,
  zetKindHier,
  type OvernameFout,
  type OvernameStap,
  zetWachtwoordVoorKind,
} from '@/store/gezin/overname';
import type { ServerKind, WachtwoordFout } from '@/store/gezin/vervoer';

/**
 * De kinderen van dit apparaat, meegenomen naar het account van hun ouder
 * (ADR-187, `ouder-en-kind.md` §9).
 *
 * Alleen voor een ouder die is ingelogd, en alleen op de ouderpagina: dat is
 * waar een volwassene zit, achter de pincode, en het is waar het account al
 * staat. Er is geen enkele weg waarlangs dit gebeurt zonder dat die ouder erop
 * drukt.
 *
 * **Dit is het moment van toestemming** (artikel 8 AVG). Daarom staat erbij, in
 * gewone taal, wat er dan op de server komt en waar, en dat het er weer af kan;
 * en daarom is er een schakelaar die de ouder zelf omzet vóór de knop werkt.
 * Het moment zelf legt de database vast (`0002_toestemming.sql`).
 *
 * **Een tweede apparaat** (ADR-189). Een kind dat in het account staat maar
 * niet hier, zet de ouder hier neer, of koppelt het aan een kind dat hier al
 * oefent. Nooit vanzelf: twee keer Noor is niet per se één Noor (§9).
 *
 * **Wat het nog niet belooft.** Na elke ronde gaat beide kanten op mee wat er
 * bij kwam (ADR-188, ADR-189). Zelf inloggen met een code, voor een apparaat
 * zonder ouder erbij, is de volgende stap; de inlogcode staat er daarom nog
 * niet.
 */
export function Overname({ onKinderenVeranderd }: { readonly onKinderenVeranderd?: () => void }) {
  const { sessie } = useAccount();
  if (sessie === null) return null;
  // Per ouder een eigen stand: wie uitlogt en een ander laat inloggen, hoort
  // niet de kinderen van de vorige te zien.
  return <Blok key={sessie.gebruikerId} onKinderenVeranderd={onKinderenVeranderd} />;
}

type Stand =
  | { readonly soort: 'laden' }
  | { readonly soort: 'fout'; readonly reden: OvernameFout }
  | {
      readonly soort: 'klaar';
      readonly kinderen: readonly ProfileRecord[];
      readonly koppelingen: readonly Koppeling[];
      readonly inAccount: readonly ServerKind[];
    };

const FOUT: Record<OvernameFout, TranslationKey> = {
  'geen-verbinding': 'overname.fout.geen-verbinding',
  geweigerd: 'overname.fout.geweigerd',
  'niet-ingesteld': 'overname.fout.niet-ingesteld',
  'niet-ingelogd': 'overname.fout.niet-ingelogd',
  vol: 'overname.fout.vol',
};

function namen(lijst: readonly string[]): string {
  if (lijst.length <= 1) return lijst.join('');
  return `${lijst.slice(0, -1).join(', ')} ${t('overname.en')} ${lijst[lijst.length - 1]}`;
}

function Blok({
  onKinderenVeranderd,
}: {
  readonly onKinderenVeranderd?: (() => void) | undefined;
}) {
  const [stand, setStand] = useState<Stand>({ soort: 'laden' });
  const [versie, setVersie] = useState(0);

  useEffect(() => {
    let weg = false;
    void (async () => {
      const diensten = await laadOvernameDiensten();
      const [gezin, kinderen] = await Promise.all([gezinsstand(diensten), listChildren()]);
      if (weg) return;
      setStand(
        gezin.ok
          ? {
              soort: 'klaar',
              kinderen,
              koppelingen: gezin.koppelingen,
              inAccount: gezin.inAccount,
            }
          : { soort: 'fout', reden: gezin.reden },
      );
    })();
    return () => {
      weg = true;
    };
  }, [versie]);

  const opnieuwLezen = () => setVersie((vorige) => vorige + 1);

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('overname.titel')}
      aria-busy={stand.soort === 'laden'}
    >
      <h2 className="tk-sectie">{t('overname.titel')}</h2>
      {stand.soort === 'fout' ? (
        <div className="tk-card flex flex-col gap-3">
          {/* Geen `role="alert"`: dit gebeurt bij het openen van de pagina, niet
              na iets wat de ouder deed, en een schermlezer hoort er niet door
              onderbroken te worden. Een fout na een druk op een knop is wél
              een alert. */}
          <p className="text-lopend">{t(FOUT[stand.reden])}</p>
          <button
            type="button"
            className="tk-button tk-button-secondary self-start"
            onClick={opnieuwLezen}
          >
            {t('overname.opnieuwLaden')}
          </button>
        </div>
      ) : stand.soort === 'klaar' ? (
        <Inhoud
          stand={stand}
          onVeranderd={opnieuwLezen}
          onKinderenVeranderd={() => {
            opnieuwLezen();
            onKinderenVeranderd?.();
          }}
        />
      ) : null}
    </section>
  );
}

function Inhoud({
  stand,
  onVeranderd,
  onKinderenVeranderd,
}: {
  readonly stand: Extract<Stand, { soort: 'klaar' }>;
  readonly onVeranderd: () => void;
  readonly onKinderenVeranderd: () => void;
}) {
  const gekoppeld = new Map(stand.koppelingen.map((k) => [k.lokaalId, k]));
  const hier = stand.kinderen.filter((kind) => gekoppeld.has(kind.id));
  const mee = stand.kinderen.filter((kind) => !gekoppeld.has(kind.id));
  const hierIds = new Set(stand.koppelingen.map((k) => k.kindId));
  const alleenDaar = stand.inAccount.filter((kind) => !hierIds.has(kind.id));

  return (
    <>
      <p className="text-lopend text-tekst-secundair">{t('overname.uitleg')}</p>

      {hier.length > 0 ? (
        <ul className="tk-lijst">
          {hier.map((kind) => (
            <GekoppeldKind
              key={kind.id}
              kind={kind}
              koppeling={gekoppeld.get(kind.id)!}
              inlogcode={
                stand.inAccount.find((daar) => daar.id === gekoppeld.get(kind.id)?.kindId)
                  ?.inlogcode ?? null
              }
              onVeranderd={onVeranderd}
            />
          ))}
        </ul>
      ) : null}

      {mee.length > 0 ? <Meenemen kinderen={mee} onVeranderd={onVeranderd} /> : null}

      {alleenDaar.length > 0 ? (
        <ul className="tk-lijst" aria-label={t('overname.alleenDaarTitel')}>
          {alleenDaar.map((kind) => (
            <AlleenInAccount
              key={kind.id}
              kind={kind}
              losHier={mee}
              onVeranderd={onKinderenVeranderd}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}

function GekoppeldKind({
  kind,
  koppeling,
  inlogcode,
  onVeranderd,
}: {
  readonly kind: ProfileRecord;
  readonly koppeling: Koppeling;
  readonly inlogcode: string | null;
  readonly onVeranderd: () => void;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<OvernameFout | null>(null);
  const [vraagWeg, setVraagWeg] = useState(false);

  async function opnieuw() {
    setBezig(true);
    setFout(null);
    const uit = await verstuurOpnieuw(koppeling, await laadOvernameDiensten());
    setBezig(false);
    if (uit.ok) onVeranderd();
    else setFout(uit.reden);
  }

  async function haalWeg() {
    setBezig(true);
    setFout(null);
    const uit = await haalUitAccount(koppeling, await laadOvernameDiensten());
    setBezig(false);
    if (uit.ok) onVeranderd();
    else setFout(uit.reden);
  }

  return (
    <li className="flex flex-col gap-3 p-4">
      <p className="flex items-center gap-3">
        <span className="tk-plaat tk-plaat-neutraal">
          <PupilIcon size={24} />
        </span>
        <span className="flex flex-col">
          <span className="tk-lijstrij-titel">{kind.naam}</span>
          <span className="tk-lijstrij-regel">
            {koppeling.verstuurdOp === null
              ? t('overname.nietVerstuurd')
              : t('overname.verstuurd', {
                  datum: leesbareDatum(koppeling.verstuurdOp.slice(0, 10)),
                })}
          </span>
        </span>
      </p>

      {inlogcode !== null ? (
        <Inlogcode code={inlogcode} kindId={koppeling.kindId} naam={kind.naam} />
      ) : null}

      {vraagWeg ? (
        <div className="flex flex-col gap-3">
          <p className="text-lopend">{t('overname.haalWegVraag', { naam: kind.naam })}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="tk-button tk-button-secondary"
              disabled={bezig}
              onClick={() => void haalWeg()}
            >
              {t('overname.haalWegJa')}
            </button>
            <button
              type="button"
              className="tk-button tk-button-tertiary"
              disabled={bezig}
              onClick={() => setVraagWeg(false)}
            >
              {t('overname.haalWegNee')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {koppeling.verstuurdOp === null ? (
            <button
              type="button"
              className="tk-button tk-button-secondary"
              disabled={bezig}
              onClick={() => void opnieuw()}
            >
              {bezig ? t('account.bezig') : t('overname.opnieuw')}
            </button>
          ) : null}
          <button
            type="button"
            className="tk-button tk-button-tertiary"
            disabled={bezig}
            onClick={() => setVraagWeg(true)}
          >
            {t('overname.haalWeg')}
          </button>
        </div>
      )}

      {fout ? (
        <p role="alert" className="text-lopend">
          {t(FOUT[fout])}
        </p>
      ) : null}
    </li>
  );
}

function Meenemen({
  kinderen,
  onVeranderd,
}: {
  readonly kinderen: readonly ProfileRecord[];
  readonly onVeranderd: () => void;
}) {
  const [gekozen, setGekozen] = useState<ReadonlySet<string>>(
    () => new Set(kinderen.map((kind) => kind.id)),
  );
  const [toestemming, setToestemming] = useState(false);
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [fout, setFout] = useState<OvernameFout | null>(null);

  function wissel(id: string) {
    const volgende = new Set(gekozen);
    if (volgende.has(id)) volgende.delete(id);
    else volgende.add(id);
    setGekozen(volgende);
  }

  async function neem() {
    setFout(null);
    const diensten = await laadOvernameDiensten();
    for (const kind of kinderen.filter((k) => gekozen.has(k.id))) {
      setBezigMet(kind.naam);
      const uit = await neemMee(kind, diensten);
      if (!uit.ok) {
        setBezigMet(null);
        setFout(uit.reden);
        // Wat wél lukte, staat al in het account en is gekoppeld; laat dat zien.
        onVeranderd();
        return;
      }
    }
    setBezigMet(null);
    onVeranderd();
  }

  const namenHier = namen(kinderen.map((kind) => kind.naam));
  const klaarOmTeGaan = toestemming && gekozen.size > 0 && bezigMet === null;

  return (
    <div className="tk-card flex flex-col gap-3">
      <p className="text-lopend">
        {kinderen.length === 1
          ? t('overname.hierEen', { namen: namenHier })
          : t('overname.hierMeer', { namen: namenHier })}
      </p>

      <ul className="tk-lijst" aria-label={t('overname.wie')}>
        {kinderen.map((kind) => (
          <li key={kind.id}>
            <button
              type="button"
              className="tk-lijstrij"
              aria-pressed={gekozen.has(kind.id)}
              disabled={bezigMet !== null}
              onClick={() => wissel(kind.id)}
            >
              <span className="tk-plaat tk-plaat-neutraal">
                <PupilIcon size={24} />
              </span>
              <span className="tk-lijstrij-tekst">
                <span className="tk-lijstrij-titel">{kind.naam}</span>
              </span>
              <span className="tk-lijstrij-pijl">
                <span className="tk-schakelaar" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-lopend">{t('overname.toestemmingUitleg')}</p>

      <ul className="tk-lijst">
        <li>
          <button
            type="button"
            className="tk-lijstrij"
            aria-pressed={toestemming}
            disabled={bezigMet !== null}
            onClick={() => setToestemming(!toestemming)}
          >
            <span className="tk-plaat tk-plaat-neutraal">
              <CorrectIcon size={24} />
            </span>
            <span className="tk-lijstrij-tekst">
              <span className="tk-lijstrij-titel">{t('overname.toestemming')}</span>
            </span>
            <span className="tk-lijstrij-pijl">
              <span className="tk-schakelaar" aria-hidden="true" />
            </span>
          </button>
        </li>
      </ul>

      <button
        type="button"
        className="tk-button self-start"
        disabled={!klaarOmTeGaan}
        onClick={() => void neem()}
      >
        {bezigMet === null ? t('overname.knop') : t('overname.bezig', { naam: bezigMet })}
      </button>

      {fout ? (
        <p role="alert" className="text-lopend">
          {t(FOUT[fout])}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Een kind dat in het account staat maar niet op dit apparaat (ADR-189).
 *
 * Twee wegen, en de ouder kiest. Staat het kind hier nog niet, dan komt het
 * erbij met alles wat het op het andere apparaat deed. Oefent het hier al —
 * onder dezelfde naam of een andere — dan wordt het daaraan gekoppeld, en
 * worden de twee samengevoegd met de regels van ADR-155.
 */
function AlleenInAccount({
  kind,
  losHier,
  onVeranderd,
}: {
  readonly kind: ServerKind;
  readonly losHier: readonly ProfileRecord[];
  readonly onVeranderd: () => void;
}) {
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<OvernameFout | null>(null);

  async function doe(stap: OvernameStap) {
    setBezig(true);
    setFout(null);
    const uit = await stap();
    setBezig(false);
    if (uit.ok) onVeranderd();
    else setFout(uit.reden);
  }

  return (
    <li className="flex flex-col gap-3 p-4">
      <p className="flex items-center gap-3">
        <span className="tk-plaat tk-plaat-neutraal">
          <PupilIcon size={24} />
        </span>
        <span className="flex flex-col">
          <span className="tk-lijstrij-titel">{kind.voornaam}</span>
          <span className="tk-lijstrij-regel">{t('overname.nietHier')}</span>
        </span>
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="tk-button tk-button-secondary"
          disabled={bezig}
          onClick={() => void doe(async () => zetKindHier(kind, await laadOvernameDiensten()))}
        >
          {bezig ? t('account.bezig') : t('overname.zetHier', { naam: kind.voornaam })}
        </button>
      </div>

      {losHier.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="tk-hulp">{t('overname.ofKoppel', { naam: kind.voornaam })}</p>
          <div className="flex flex-wrap gap-3">
            {losHier.map((hier) => (
              <button
                key={hier.id}
                type="button"
                className="tk-button tk-button-tertiary"
                disabled={bezig}
                onClick={() =>
                  void doe(async () => koppelAan(hier, kind, await laadOvernameDiensten()))
                }
              >
                {t('overname.koppel', { hier: hier.naam, daar: kind.voornaam })}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {fout ? (
        <p role="alert" className="text-lopend">
          {t(FOUT[fout])}
        </p>
      ) : null}
    </li>
  );
}

const WACHTWOORD_FOUT: Record<'te-kort' | 'te-simpel' | 'eigen-naam', TranslationKey> = {
  'te-kort': 'overname.wachtwoordFout.te-kort',
  'te-simpel': 'overname.wachtwoordFout.te-simpel',
  'eigen-naam': 'overname.wachtwoordFout.eigen-naam',
};

/** Een code zoals hij wordt voorgelezen: `KIND-ABCD-2345` (`_gezin/code.ts`). */
function codeVoorMens(code: string): string {
  return `KIND-${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * De inlogcode van een kind, en het wachtwoord waarmee het zelf inlogt
 * (ADR-190).
 *
 * Een kind dat werd meegenomen, kreeg een wachtwoord dat niemand kent
 * (ADR-187). Wil het op een ander apparaat zelf inloggen, dan zet de ouder er
 * hier een. De regels zijn die voor een kind (`_gezin/code.ts`): minstens zes
 * tekens, niet de eigen naam, niet het eerste wat iemand intikt. Een nieuw
 * wachtwoord logt het kind overal uit, zoals bij elk herstel (ADR-155).
 */
function Inlogcode({
  code,
  kindId,
  naam,
}: {
  readonly code: string;
  readonly kindId: string;
  readonly naam: string;
}) {
  const [wachtwoord, setWachtwoord] = useState('');
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<WachtwoordFout | 'niet-ingelogd' | null>(null);
  const [klaar, setKlaar] = useState(false);
  const veld = useId();
  const melding = useId();

  async function zet(event: FormEvent) {
    event.preventDefault();
    setBezig(true);
    setFout(null);
    setKlaar(false);
    const uit = await zetWachtwoordVoorKind(kindId, wachtwoord, await laadOvernameDiensten());
    setBezig(false);
    if (uit.ok) {
      setWachtwoord('');
      setKlaar(true);
    } else {
      setFout(uit.reden);
    }
  }

  return (
    <form className="flex flex-col gap-2" noValidate onSubmit={(event) => void zet(event)}>
      <p className="text-lopend">{t('overname.code', { code: codeVoorMens(code) })}</p>
      <label htmlFor={veld} className="tk-label">
        {t('overname.wachtwoordVeld', { naam })}
      </label>
      <input
        id={veld}
        className="tk-input max-w-xs"
        type="password"
        autoComplete="new-password"
        maxLength={200}
        value={wachtwoord}
        onChange={(event) => setWachtwoord(event.target.value)}
        aria-describedby={fout ? melding : undefined}
        aria-invalid={fout ? true : undefined}
      />
      <p className="tk-hulp">{t('overname.wachtwoordUitleg', { naam })}</p>
      <button type="submit" className="tk-button tk-button-secondary self-start" disabled={bezig}>
        {bezig ? t('account.bezig') : t('overname.wachtwoordKnop')}
      </button>
      {fout ? (
        <p id={melding} role="alert" className="text-lopend">
          {fout === 'te-kort' || fout === 'te-simpel' || fout === 'eigen-naam'
            ? t(WACHTWOORD_FOUT[fout], { naam })
            : t(FOUT[fout])}
        </p>
      ) : null}
      {klaar ? (
        <p role="status" className="text-lopend">
          {t('overname.wachtwoordKlaar', { naam })}
        </p>
      ) : null}
    </form>
  );
}
