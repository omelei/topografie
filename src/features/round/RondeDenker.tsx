import { useEffect, useRef } from 'react';
import { Brandmark } from '@/components/Brandmark';
import type { Uitkomst } from './UitkomstTeken';
import { sterren, vlieg } from './feest';

/**
 * Denker naast de terugkoppeling in een ronde (Merk en stijlgids §05, ADR-183).
 *
 * Na een goed antwoord juicht hij: er springen sterren uit zijn ster, en een
 * punt vliegt van hem naar het bolletje van de voortgang dat net gevuld is.
 * Na een fout of een bijna is hij bemoedigend — "dat komt nog" — en danst er
 * verder niets: een fout hoort te landen.
 *
 * Hij staat náást de uitslag en is nooit de uitslag zelf: het teken ervoor
 * (UitkomstTeken) en de zin zeggen wat er gebeurde, Denker zegt hoe dat
 * voelt. Daarom zwijgt hij voor een schermlezer. Hij verschijnt pas na het
 * antwoord, dus tijdens de vraag staat er niets dat beweegt.
 */
export function RondeDenker({ uitkomst }: { readonly uitkomst: Uitkomst }) {
  const plek = useRef<HTMLSpanElement>(null);
  const goed = uitkomst === 'goed';

  useEffect(() => {
    if (!goed) return;
    const denker = plek.current;
    sterren(denker);
    // Het bolletje dat net gevuld is: het laatste dat af is.
    const af = document.querySelectorAll('.tk-round-dot-done');
    const doel = af.length > 0 ? af[af.length - 1] : null;
    vlieg(denker, doel ?? null);
  }, [goed]);

  return (
    <span ref={plek} className="tk-ronde-denker">
      <Brandmark size={56} uitdrukking={goed ? 'juichen' : 'bemoedigend'} />
    </span>
  );
}
