import type { SteenStap } from '@/game-core';
import { t } from '@/i18n';

/**
 * Wat één antwoord opleverde, in de ronde (ADR-158).
 *
 * Dit is alles wat er tijdens een ronde bij komt: één klein blokje en één zin.
 * Geen strook, geen teller, geen toren — decoratie naast de leerstof schaadt het
 * leren, en dat is het eigen onderzoek achter ADR-149.
 *
 * **Gevuld is verdiend, gestippeld ligt klaar.** Dat verschil is een vorm en geen
 * kleur, dezelfde taal als de gestippelde ring van een embleem dat nog niet
 * gehaald is. Een kind moet het zonder tekst kunnen aanwijzen.
 *
 * **Bij een fout staat hier niets.** Geen omtrek, geen zin over stenen. Het
 * uitkomstteken en de uitleg hebben dan al gezegd wat er te zeggen was, en een
 * kind dat het niet wist hoeft niet ook nog te horen wat het daardoor niet
 * kreeg. Zwijgen is het ontwerp.
 */
export function SteenRegel({ steen }: { readonly steen: SteenStap | null }) {
  if (steen === null || steen.uitkomst === 'fout') return null;

  const verdiend = steen.uitkomst === 'steen';
  const zin = verdiend
    ? t('toren.steenGoed')
    : steen.uitkomst === 'nieuw'
      ? t('toren.steenNieuw', { dagen: steen.dagen ?? 1 })
      : steen.dagen === 1
        ? t('toren.steenMorgen')
        : t('toren.steenAl', { dagen: steen.dagen ?? 1 });

  return (
    <p className="tk-steenregel">
      <span
        className="tk-steenregel-steen"
        data-vak={steen.vak}
        data-verdiend={verdiend ? 'ja' : undefined}
        aria-hidden="true"
      />
      <span className="tk-steenregel-zin">{zin}</span>
    </p>
  );
}
