import { useEffect, useId, useState, type FormEvent } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PupilIcon } from '@/components/Icon';
import { huidigeGroep, type Groep } from '@/game-core';
import { t } from '@/i18n';
import { GroepKiezer } from '@/features/player/GroepKiezer';
import { createChild, listChildren, MAX_KINDEREN, renameChild, setGroep } from '@/store/children';
import type { ProfileRecord } from '@/store/db';

/**
 * Je kinderen, op de ouderpagina (ADR-173).
 *
 * Het verschil met de rij op Jij is wie er kijkt, en dat verandert alles. Op
 * Jij zet een kind **zijn eigen** naam en groep, in zijn eigen woorden ("Je
 * groep"). Hier zet een ouder ze **voor elk van zijn kinderen**, ook voor het
 * kind dat nu niet aan de beurt is — en dat kon nergens. `GroepInstelling` leest
 * met opzet het actieve kind, want daar is het de instelling van wie er oefent;
 * hier is het een lijst, dus staat de kiezer per rij.
 *
 * **Openklappen in plaats van een pagina per kind.** Een gezin heeft er hooguit
 * drie, en wat je per kind doet is een naam wijzigen en een groep zetten. Een
 * eigen scherm daarvoor zou een klik toevoegen aan iets wat één keer per jaar
 * gebeurt.
 *
 * **Verwijderen staat er nog niet.** Een kind weghalen is het weggooien van elk
 * diploma en elke doos die eronder hangt, en dat verdient hetzelfde soort
 * scherm als "alles van dit apparaat halen" — met de vraag wat er weggaat en
 * een knop die zegt wat hij doet. Het hoort bij de gegevensknoppen van F3, waar
 * ook het meenemen van de gegevens van een kind komt.
 *
 * **`onVeranderd` zegt het tegen de rest van de pagina** (ADR-177). Dit blok
 * houdt zijn eigen lijst bij, en sinds er een tweede blok op deze pagina staat
 * dat dezelfde kinderen leest — `HoeGaatHet` — liepen die twee uit elkaar: een
 * kind erbij verscheen hier meteen en daar pas na herladen.
 */
export function Kinderen({ onVeranderd }: { readonly onVeranderd?: () => void }) {
  const [kinderen, setKinderen] = useState<ProfileRecord[] | null>(null);
  const [erbij, setErbij] = useState(false);
  const [naam, setNaam] = useState('');
  const [bezig, setBezig] = useState(false);
  const veld = useId();

  useEffect(() => {
    void listChildren().then(setKinderen);
  }, []);

  async function voegToe(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '') return;
    setBezig(true);
    await createChild(naam);
    setKinderen(await listChildren());
    setNaam('');
    setErbij(false);
    setBezig(false);
    onVeranderd?.();
  }

  const vol = (kinderen?.length ?? 0) >= MAX_KINDEREN;

  return (
    <section className="flex flex-col gap-3" aria-label={t('ouder.kinderen')}>
      <h2 className="tk-sectie">{t('ouder.kinderen')}</h2>

      <ul className="tk-lijst" aria-busy={kinderen === null}>
        {(kinderen ?? []).map((kind) => (
          <Kind
            key={kind.id}
            kind={kind}
            onGewijzigd={(bijgewerkt) => {
              setKinderen((rijen) =>
                (rijen ?? []).map((rij) => (rij.id === bijgewerkt.id ? bijgewerkt : rij)),
              );
              onVeranderd?.();
            }}
          />
        ))}
      </ul>

      {erbij ? (
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => void voegToe(event)}>
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
      ) : null}

      {!erbij && !vol ? (
        <button
          type="button"
          className="tk-button tk-button-secondary self-start"
          onClick={() => setErbij(true)}
        >
          {t('ouder.nogEenKind')}
        </button>
      ) : null}

      <p className="tk-hulp">
        {vol ? t('ouder.kinderenVol', { aantal: MAX_KINDEREN }) : t('ouder.kinderenUitleg')}
      </p>
    </section>
  );
}

/** Eén kind: de naam en de groep van vandaag, en allebei te veranderen. */
function Kind({
  kind,
  onGewijzigd,
}: {
  readonly kind: ProfileRecord;
  readonly onGewijzigd: (kind: ProfileRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [naam, setNaam] = useState(kind.naam);
  const [bezig, setBezig] = useState(false);
  const veld = useId();

  const groep = huidigeGroep(kind, new Date());

  async function bewaarNaam(event: FormEvent) {
    event.preventDefault();
    if (naam.trim() === '' || naam.trim() === kind.naam) return;
    setBezig(true);
    const bijgewerkt = await renameChild(kind.id, naam);
    if (bijgewerkt) onGewijzigd(bijgewerkt);
    setBezig(false);
  }

  async function kiesGroep(gekozen: Groep | undefined) {
    setBezig(true);
    const bijgewerkt = await setGroep(kind.id, gekozen);
    if (bijgewerkt) onGewijzigd(bijgewerkt);
    setBezig(false);
  }

  return (
    <li>
      <button
        type="button"
        className="tk-lijstrij"
        aria-expanded={open}
        onClick={() => {
          setNaam(kind.naam);
          setOpen(!open);
        }}
      >
        <span className="tk-plaat tk-plaat-neutraal">
          <PupilIcon size={24} />
        </span>
        <span className="tk-lijstrij-tekst">
          <span className="tk-lijstrij-titel">{kind.naam}</span>
          <span className="tk-lijstrij-regel">
            {groep === undefined ? t('ouder.geenGroep') : t('ouder.inGroep', { groep })}
          </span>
        </span>
        <span className="tk-lijstrij-pijl">
          {open ? <ChevronUpIcon size={20} /> : <ChevronDownIcon size={20} />}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
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
            uitweg="groep.geen"
            bezig={bezig}
            onKies={(gekozen) => void kiesGroep(gekozen)}
          />
        </div>
      ) : null}
    </li>
  );
}
