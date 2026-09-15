import { t } from '@/i18n';
import { NextIcon } from '@/components/Icon';
import { Heldplaat } from '@/components/Heldplaat';
import { useEigenHeld } from '@/features/reis/useEigenHeld';
import { useVandaag } from './useVandaag';

/**
 * Hoeveel er nog van vandaag over is, aan het eind van een ronde (ADR-139).
 *
 * Het dagplan slonk al — het wordt elke keer opnieuw gerekend — maar een kind
 * zag het niet gebeuren: het verliet het scherm en kwam terug op een ander. Hier
 * staat het op het moment zelf, met de knop naar de volgende erbij, zodat de dag
 * doorloopt in plaats van telkens via de voordeur.
 *
 * **En als vandaag af is, staat hier de dag zelf.** Dat was hiervoor niets: de
 * voordeur zei het, hier stond een leeg gat. Bij hoogstens tien minuten per dag
 * is dat het verkeerde gat om leeg te laten — een sessie is niet te verlengen,
 * de ouder bepaalt de lengte, en dan is het laatste wat een kind ziet het enige
 * dat nog over morgen kan gaan.
 *
 * Het is ook geen felicitatie, en dat was het bezwaar van ADR-139. Er staat
 * niet "goed gedaan" — dat zegt dit product nergens — maar wat er is: de dag is
 * af, en morgen staat er dít klaar. Het eerste is een feit en het tweede is een
 * reden.
 *
 * **Niets zonder plan.** Wie geen dagplan heeft — geen code, of niets aan de
 * beurt — ziet hier niets. Dit blok telt af, het verkoopt niet. Een dag die leeg
 * begon is ook niet "af": `voortgang.klaar` is onwaar zodra er niets te doen
 * viel, en een lege dag vieren is een compliment voor niets doen.
 */
export function VandaagVerder({ onVerder }: { readonly onVerder: () => void }) {
  const vandaag = useVandaag();
  if (vandaag === null) return null;

  if (vandaag.voortgang.klaar) return <DagAf morgen={vandaag.morgen} />;
  if (vandaag.volgende === null) return null;

  const { over } = vandaag.voortgang;
  if (over <= 0) return null;

  return (
    <button type="button" className="tk-lijstrij tk-vandaag-verder" onClick={onVerder}>
      <span className="tk-lijstrij-tekst">
        <span className="tk-lijstrij-titel">
          {over === 1 ? t('vandaag.overEen') : t('vandaag.over', { aantal: over })}
        </span>
        <span className="tk-lijstrij-regel">{t('vandaag.verder')}</span>
      </span>
      <span className="tk-lijstrij-pijl">
        <NextIcon size={20} />
      </span>
    </button>
  );
}

/**
 * De dag is af.
 *
 * De held van dit kind, groot, en één zin over morgen. Honderdtwintig pixels:
 * groter dan het maatje in een ronde (achtentachtig) en kleiner dan de kist,
 * want dit gebeurt één keer per dag — ceremonie schaalt met zeldzaamheid.
 *
 * **Morgen alleen als er morgen iets is.** Nul is een waar getal en een slechte
 * zin: "Morgen staan er 0 klaar" is een reden om niet terug te komen. Dan staat
 * er alleen dat vandaag af is, wat ook waar is en wat genoeg is.
 */
function DagAf({ morgen }: { readonly morgen: number }) {
  const { held, reeks } = useEigenHeld();

  return (
    <section className="tk-dagaf" aria-label={t('vandaag.afTitel')}>
      <Heldplaat sticker={held.id} reeks={reeks} size={120} className="tk-dagaf-held" />
      <span className="tk-dagaf-tekst">
        <span className="tk-dagaf-titel">{t('vandaag.af')}</span>
        {morgen > 0 ? (
          <span className="tk-lijstrij-regel">
            {morgen === 1 ? t('vandaag.morgenEen') : t('vandaag.morgen', { aantal: morgen })}
          </span>
        ) : null}
      </span>
    </section>
  );
}
