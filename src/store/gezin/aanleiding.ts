import { isIngesteld } from '../account/omgeving';

/**
 * De ene deur naar `bijhouden.ts`, voor wie niets van accounts hoort te weten
 * (ADR-188): `finishSession` en het opstarten van de app.
 *
 * Een bouw zonder gezinsproject laadt hier niets — de productie van vandaag —
 * en een bouw mét laadt `bijhouden.ts` pas als er een ronde af is of de app
 * opent. Het mislukken ervan is nooit het probleem van wie het aanroept.
 */
export function laatBijhouden(): void {
  if (!isIngesteld()) return;
  void import('./bijhouden').then((mod) => mod.houBij()).catch(() => undefined);
}
