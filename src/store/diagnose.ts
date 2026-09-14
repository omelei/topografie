import { getDb, SINGLETON_KEY } from './db';
import { listChildren } from './children';
import { NIET_AF_TE_MAKEN } from './progress';
import type { DiagnoseAntwoord, DiagnoseRonde } from '@/features/diagnose/afhaken';

/**
 * De rondes van dit apparaat, ruw genoeg om te kunnen tellen waar het misging
 * (ADR-128).
 *
 * `loadPlayedRounds` laat precies weg wat hier de vraag is: het gooit rondes
 * eruit die nooit zijn afgemaakt, en dat zijn de rondes waar een kind afhaakte.
 * `loadOpenRounds` houdt juist alleen die over, maar alleen de nieuwste per set
 * en alleen van de laatste dertig dagen, want het is er om een knop te vullen.
 * Geen van beide is een geschiedenis. Dit wel.
 *
 * **Per kind, en niet alleen de actieve.** Elke andere lezer in dit bestand
 * vraagt om "wie er oefent", want dat is wat een scherm nodig heeft. De vraag
 * hier is een andere: met twee kinderen op één iPad zit het verschil tussen hen
 * vaak dichter bij het antwoord dan hun gemiddelde.
 *
 * Er gaat niets weg. Dit leest wat er al staat en schrijft niets terug.
 */

export interface KindRondes {
  readonly kindId: string;
  readonly naam: string;
  readonly rondes: readonly DiagnoseRonde[];
}

export async function loadDiagnoseRondes(): Promise<KindRondes[]> {
  const db = await getDb();

  // Antwoorden eerst, op sessie. Wat een ronde werkelijk gevraagd heeft staat
  // in de sessie; hoe ver het kwam staat alleen hier, want een ronde die is
  // weggeklikt heeft nooit opgeschreven waar hij bleef.
  const perSessie = new Map<string, DiagnoseAntwoord[]>();
  for (const attempt of await db.getAll('attempts')) {
    const lijst = perSessie.get(attempt.sessionId) ?? [];
    lijst.push({
      correct: attempt.correct,
      responseMs: attempt.responseMs,
      tijdstip: attempt.tijdstip,
    });
    perSessie.set(attempt.sessionId, lijst);
  }
  for (const lijst of perSessie.values()) {
    lijst.sort((een, ander) => een.tijdstip.localeCompare(ander.tijdstip));
  }

  const perKind = new Map<string, DiagnoseRonde[]>();
  for (const session of await db.getAll('sessions')) {
    const kindId = session.kindId ?? SINGLETON_KEY;
    const itemIds: readonly string[] = Array.isArray(session.itemSet)
      ? (session.itemSet as string[])
      : [];

    const lijst = perKind.get(kindId) ?? [];
    lijst.push({
      mode: session.mode,
      // Nul voor een ronde zonder vast einde, want dan is "niet afgemaakt" geen
      // afhaken: een bliksemronde duurt een minuut en een overlevingsronde drie
      // levens. `diagnose` laat die op dat nul buiten de telling vallen.
      gevraagd: NIET_AF_TE_MAKEN.has(session.mode) ? 0 : itemIds.length,
      gestart: session.gestart,
      antwoorden: perSessie.get(session.id) ?? [],
    });
    perKind.set(kindId, lijst);
  }

  const kinderen = await listChildren();
  return kinderen.map((kind) => ({
    kindId: kind.id,
    naam: kind.naam,
    rondes: perKind.get(kind.id) ?? [],
  }));
}
