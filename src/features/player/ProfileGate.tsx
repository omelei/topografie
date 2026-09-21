import { useState, type FormEvent } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import type { Groep } from '@/game-core';
import { t } from '@/i18n';
import { createProfile } from '@/store/profile';
import type { ProfileRecord } from '@/store/db';
import { GroepKiezer } from './GroepKiezer';

/**
 * The first screen. It asks for a name, and then in which group the child is
 * — no e-mail, no age. The name is used to say hello and never leaves the
 * device, and the copy says exactly that, because a child who is asked for
 * their name deserves to be told where it goes.
 *
 * **De groep is bewust teruggekomen** (ADR-151). Dit scherm vroeg eerst "no
 * class, no age", en dat was een keuze: wat je niet vraagt, hoef je niet te
 * bewaren. De groep is een aanwijzing voor de leeftijd, en hij wordt toch
 * gevraagd, omdat een kind uit groep 4 anders dezelfde voordeur krijgt als een
 * kind uit groep 8. Daarom kan hij altijd worden overgeslagen, blijft hij op
 * dit apparaat zoals de naam, en gaat hij nooit naar een derde. Het blijft bij
 * de groep: een leeftijd of een geboortedatum wordt nooit gevraagd.
 *
 * **De uitweg heet "Zeg ik niet"** (ADR-161). Hij heette "Weet ik niet", en dat
 * is het enige antwoord op deze kaart dat een kind iets over zichzelf laat
 * toegeven wat het gewoon weet. Overslaan hoort een keuze te zijn en geen
 * bekentenis; wat de app ermee doet, is precies hetzelfde.
 *
 * **En er is een derde weg: "Ik ben een ouder"** (ADR-161). Dit scherm is het
 * allereerste wat iemand van leer.nu ziet, en dat is vaak niet het kind maar de
 * volwassene die de app opzoekt. Die werd hier gedwongen een groep te kiezen om
 * ergens te komen. Nu maakt die knop het profiel aan zonder groep — de naam is
 * al getypt en de groep is toch altijd over te slaan — en opent Premium, waar
 * staat wat leer.nu doet en wat het kost. Dat was Voor ouders, tot die pagina
 * opging in Jij en Premium (ADR-171); de groep zet het kind zelf op Jij.
 *
 * Twee stappen op één kaart, en het kind bestaat pas na de tweede. Wie bij de
 * groep terug wil naar de naam, is nog niemand.
 */
export function ProfileGate({
  onReady,
}: {
  /**
   * Het profiel bestaat. `naarOuder` zegt of de app op Premium moet openen
   * in plaats van op de voordeur: dat is geen eigenschap van het profiel, dus
   * het reist ernaast mee en wordt nergens bewaard.
   */
  readonly onReady: (profile: ProfileRecord, naarOuder?: boolean) => void;
}) {
  const [naam, setNaam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stap, setStap] = useState<'naam' | 'groep'>('naam');
  const [busy, setBusy] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (naam.trim().length < 2) {
      setError(t('profile.nameTooShort'));
      return;
    }
    setStap('groep');
  }

  async function kies(groep: Groep | undefined, naarOuder = false) {
    setBusy(true);
    const kind = await createProfile(naam, groep);
    // Onbereikbaar: dit scherm staat er alleen als er nog geen kind is, en de
    // grens van ADR-173 ligt op drie. Het vangnet staat er omdat `createChild`
    // sinds die grens mag weigeren, en een scherm dat dat negeert loopt vast op
    // een leeg profiel in plaats van op deze regel.
    if (kind === null) {
      setBusy(false);
      return;
    }
    onReady(kind, naarOuder);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
      <div>
        <Wordmark height={40} />
        <p className="mt-1 text-tekst-secundair">{brand.slogan}</p>
      </div>

      {stap === 'naam' ? (
        <form onSubmit={handleSubmit} className="tk-card flex flex-col gap-4">
          <h1 className="tk-titel">{t('profile.title')}</h1>
          <label htmlFor="naam" className="text-tekst-secundair">
            {t('profile.help')}
          </label>
          <input
            id="naam"
            className="tk-input"
            value={naam}
            onChange={(event) => {
              setNaam(event.target.value);
              setError(null);
            }}
            placeholder={t('profile.placeholder')}
            autoComplete="off"
            maxLength={24}
            aria-describedby={error ? 'naam-error' : undefined}
            aria-invalid={error !== null}
          />
          {error !== null && (
            <p id="naam-error" role="alert" className="font-semibold text-fout">
              {error}
            </p>
          )}
          <button type="submit" className="tk-button">
            {t('profile.submit')}
          </button>
        </form>
      ) : (
        <section className="tk-card flex flex-col gap-4" aria-labelledby="groep-vraag">
          <h1 id="groep-vraag" className="tk-titel">
            {t('groep.vraag')}
          </h1>
          <p className="text-tekst-secundair">{t('groep.uitleg')}</p>
          <GroepKiezer
            gekozen={null}
            uitweg="groep.zegIkNiet"
            bezig={busy}
            onKies={(groep) => void kies(groep)}
            onOuder={() => void kies(undefined, true)}
          />
          <button
            type="button"
            className="tk-button tk-button-secondary"
            disabled={busy}
            onClick={() => setStap('naam')}
          >
            {t('groep.terug')}
          </button>
        </section>
      )}
    </main>
  );
}
