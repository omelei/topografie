import { useEffect, useRef, type ReactNode, type Ref } from 'react';
import { ChevronRightIcon, CorrectIcon, PaperIcon, StarIcon } from '@/components/Icon';
import { t } from '@/i18n';
import type { Segment, StapId } from './stappen';

/**
 * De vakpagina op een telefoon, als accordeon (ADR-252): de stukken die
 * `ModuleScreen` daar anders tekent dan vanaf 768. De keuzes zelf — welke
 * chips, welke tegels, wat een druk doet — blijven daar; hier staat alleen
 * de vorm eromheen.
 */

/** Een stap met zijn plek op de pagina en zijn vraag. */
export interface StapKop {
  readonly id: StapId;
  readonly nummer: number;
  readonly vraag: string;
}

/** Een stap met een antwoord: het korte label erboven en het antwoord zelf. */
export interface StapAntwoord extends StapKop {
  readonly label: string;
  readonly waarde: string;
}

/**
 * Wat gekozen is, samen in één witte kaart bovenaan: een vinkje, het label,
 * het antwoord en "Wijzig". De hele rij is de knop, en een druk opent die stap
 * weer.
 */
export function StappenGekozen({
  stappen,
  onWijzig,
}: {
  readonly stappen: readonly StapAntwoord[];
  readonly onWijzig: (id: StapId) => void;
}) {
  if (stappen.length === 0) return null;

  return (
    <ul className="tk-stappen-gekozen">
      {stappen.map(({ id, nummer, vraag, label, waarde }) => (
        <li key={id}>
          <button
            type="button"
            className="tk-stapgekozen"
            data-stap={id}
            aria-label={t('kies.wijzigLabel', { stap: nummer, vraag, waarde })}
            onClick={() => onWijzig(id)}
          >
            <span className="tk-stapgekozen-vink" aria-hidden="true">
              <CorrectIcon size={18} />
            </span>
            <span className="tk-stapgekozen-tekst" aria-hidden="true">
              <span className="tk-stapgekozen-label">{label}</span>
              <span className="tk-stapgekozen-waarde">{waarde}</span>
            </span>
            <span className="tk-stapgekozen-wijzig" aria-hidden="true">
              {t('kies.wijzig')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * De ene stap die openstaat: een witte kaart met een rand en een onderkant,
 * het nummer in inkt en de vraag. Dezelfde naam als vanaf 768 ("Kies een
 * onderwerp"), zodat wat de stap daar vindt, hem hier ook vindt.
 */
export function OpenStap({
  stap,
  stapRef,
  children,
}: {
  readonly stap: StapKop;
  readonly stapRef: Ref<HTMLElement>;
  readonly children: ReactNode;
}) {
  return (
    <section ref={stapRef} className="tk-stapopen" data-stap={stap.id} aria-label={stap.vraag}>
      <h2 className="tk-stapopen-kop">
        <span className="tk-stapopen-nummer">{stap.nummer}</span>
        <span className="tk-sr-only">, </span>
        {stap.vraag}
      </h2>
      {children}
    </section>
  );
}

/**
 * De stappen die nog komen: een gestippelde rij met een neutraal nummer en
 * "Nog kiezen". Een druk opent hem toch, want een rij die niets doet als je
 * erop drukt, is een kapotte knop.
 */
export function LaterStappen({
  stappen,
  onOpen,
}: {
  readonly stappen: readonly StapKop[];
  readonly onOpen: (id: StapId) => void;
}) {
  if (stappen.length === 0) return null;

  return (
    <ul className="tk-stappen-later">
      {stappen.map(({ id, nummer, vraag }) => (
        <li key={id}>
          <button
            type="button"
            className="tk-staplater"
            data-stap={id}
            aria-label={t('start.naarStap', { stap: nummer, vraag })}
            onClick={() => onOpen(id)}
          >
            <span className="tk-staplater-nummer" aria-hidden="true">
              {nummer}
            </span>
            <span className="tk-staplater-vraag" aria-hidden="true">
              {vraag}
            </span>
            <span className="tk-staplater-nog" aria-hidden="true">
              {t('kies.nogKiezen')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Het gele sterrondje op een premiumtegel, waar het label te veel woorden is. */
export function PremiumSter() {
  return (
    <span className="tk-ster" aria-hidden="true">
      <StarIcon size={14} />
    </span>
  );
}

/** Eén keer onder het raster, wat de ster betekent. */
export function PremiumLegenda() {
  return (
    <p className="tk-legenda">
      <PremiumSter />
      {t('kies.metPremium')}
    </p>
  );
}

/**
 * De voortgang onderaan terwijl je kiest: "Stap 2 van 4", en een segment per
 * stap — gekozen in het vak, open in een warm grijs, nog te doen leeg.
 */
export function StapVoortgang({ segmenten }: { readonly segmenten: readonly Segment[] }) {
  const nummer = segmenten.indexOf('open') + 1;

  return (
    <div className="tk-stapvoortgang">
      <p className="tk-stapvoortgang-tekst">
        {t('kies.stapVan', { stap: Math.max(nummer, 1), totaal: segmenten.length })}
      </p>
      <span className="tk-stapvoortgang-balk" aria-hidden="true">
        {segmenten.map((segment, plek) => (
          <span key={plek} className="tk-stapvoortgang-segment" data-stand={segment} />
        ))}
      </span>
    </div>
  );
}

/**
 * Een rij onder de stappen die naar iets buiten de keuze gaat: de diploma's
 * van dit vak, of "Over" het onderwerp. Dezelfde rij als op Vandaag.
 */
export function MeerRij({
  titel,
  regel,
  beeld,
  moduleId,
  onClick,
}: {
  readonly titel: string;
  readonly regel: string;
  readonly beeld: ReactNode;
  readonly moduleId: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-module={moduleId}
      className="tk-oefenrij"
      aria-haspopup="dialog"
      onClick={onClick}
    >
      <span className="tk-meerrij-beeld" aria-hidden="true">
        {beeld}
      </span>
      <span className="tk-oefenrij-tekst">
        <span className="tk-oefenrij-titel">{titel}</span>
        <span className="tk-oefenrij-regel">{regel}</span>
      </span>
      <span className="tk-oefenrij-pijl" aria-hidden="true">
        <ChevronRightIcon size={20} />
      </span>
    </button>
  );
}

/** Een kleine ring voor "2 van de 11 gehaald": neutraal, want het is voortgang. */
export function StandRing({ deel }: { readonly deel: number }) {
  const straal = 15;
  const omtrek = 2 * Math.PI * straal;
  const vol = Math.min(1, Math.max(0, deel));

  return (
    <svg className="tk-standring" width="40" height="40" viewBox="0 0 40 40">
      <circle className="tk-standring-baan" cx="20" cy="20" r={straal} />
      <circle
        className="tk-standring-vol"
        cx="20"
        cy="20"
        r={straal}
        strokeDasharray={`${vol * omtrek} ${omtrek}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

/** Het plaatje voor "Over": een neutrale plaat met een blad papier. */
export function OverBeeld() {
  return (
    <span className="tk-plaat tk-plaat-neutraal">
      <PaperIcon size={22} />
    </span>
  );
}

/**
 * Een blad dat van onderen opkomt (ADR-252): de diploma's en "Over" van de
 * vakpagina, op een telefoon. Een echte `<dialog>`, zoals het venster van
 * ADR-163: de browser vangt de focus en sluit op Escape.
 *
 * **Dicht is niet leeg.** Anders dan dat venster staat de inhoud er ook als
 * het blad dicht is: wat een ouder leest onder "Over" is ook wat Google leest,
 * en dat moet in de pagina blijven staan.
 */
export function Blad({
  open,
  titel,
  onSluit,
  children,
}: {
  readonly open: boolean;
  readonly titel: string;
  readonly onSluit: () => void;
  readonly children: ReactNode;
}) {
  const venster = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialoog = venster.current;
    if (!dialoog) return;
    // Zonder `showModal` (jsdom) het attribuut: dan staat hij er, zonder laag.
    if (open && !dialoog.open) {
      if (typeof dialoog.showModal === 'function') dialoog.showModal();
      else dialoog.setAttribute('open', '');
    }
    if (!open && dialoog.open) {
      if (typeof dialoog.close === 'function') dialoog.close();
      else dialoog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={venster}
      className="tk-venster tk-blad"
      aria-label={titel}
      onClose={onSluit}
      onClick={(event) => {
        if (event.target === venster.current) onSluit();
      }}
    >
      <div className="tk-venster-body">{children}</div>
      <button
        type="button"
        className="tk-venster-sluit"
        aria-label={t('kies.sluit')}
        onClick={onSluit}
      >
        <span aria-hidden="true">×</span>
      </button>
    </dialog>
  );
}
