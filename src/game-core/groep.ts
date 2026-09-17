/**
 * In welke groep een kind zit, en wat daarbij past (ADR-151).
 *
 * **Een voorstel, geen slot.** Niets hier houdt een oefening tegen. De groep
 * bepaalt alleen wat bovenaan staat: welke tegel eerst komt, welke ronde van
 * Vandaag voorgaat als twee even lang wachten, met welke set een nieuw kind
 * begint. Een kind uit groep 4 dat de provincies wil doen, doet de provincies.
 *
 * **Eén plek die beslist.** `pastBijGroep` is de enige functie die een groep
 * naast de groepen van een set legt. Welke groepen een set heeft, staat in de
 * content (`content/schoolgroepen.json`, of per item); wat daaruit volgt, staat
 * hier en nergens anders — niet in een component, niet in het dagplan.
 *
 * **Zonder groep verandert er niets.** Geen groep, of een set zonder groepen,
 * is `neutraal`, en neutraal sorteert als "past nu". Een kind dat "Weet ik
 * niet" koos, ziet de app die er vóór ADR-151 was.
 */

/** Groep 3 tot en met 8. Groep 1 en 2 hebben geen stof in dit product. */
export type Groep = 3 | 4 | 5 | 6 | 7 | 8;

export const GROEPEN: readonly Groep[] = [3, 4, 5, 6, 7, 8];

export function isGroep(waarde: unknown): waarde is Groep {
  return typeof waarde === 'number' && (GROEPEN as readonly number[]).includes(waarde);
}

/**
 * Het schooljaar waar een datum in valt, als het jaar waarin het begon.
 *
 * Een schooljaar begint hier op 1 augustus. Dat is niet de eerste schooldag —
 * die verschilt per regio en valt eind augustus of begin september — maar het
 * is de dag waarop elk kind in elke regio al klaar is met het vorige jaar. Zo
 * schuift niemand een groep door terwijl de zomervakantie nog niet begon.
 *
 * Het album telt schooljaren vanaf 1 september (`schooljaarVan`, ADR-149):
 * daar hoort augustus nog bij het jaar ervoor. Hier moet een kind vóór de
 * eerste schooldag al een groep verder zijn, en daarom is dit een eigen functie.
 */
export function groepsjaarVan(now: Date): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

/**
 * De groep van nu, uit de groep die ooit werd opgegeven en het schooljaar
 * waarin dat gebeurde.
 *
 * Een ouder die in oktober "groep 5" kiest, heeft in september daarna een kind
 * in groep 6, en hoort dat niet te hoeven onthouden. Na groep 8 is er geen
 * groep meer: dan valt hij weg en is alles weer neutraal. Een kind dat bleef
 * zitten, zet de ouder op Voor ouders terug; dat gebeurt minder vaak dan een
 * zomer.
 */
export function huidigeGroep(
  opgegeven: { readonly groep?: unknown; readonly groepSchooljaar?: unknown },
  now: Date,
): Groep | undefined {
  if (!isGroep(opgegeven.groep)) return undefined;
  const sinds = typeof opgegeven.groepSchooljaar === 'number' ? opgegeven.groepSchooljaar : null;
  if (sinds === null) return opgegeven.groep;

  const verder = opgegeven.groep + Math.max(0, groepsjaarVan(now) - sinds);
  return isGroep(verder) ? verder : undefined;
}

/**
 * Hoe een set zich verhoudt tot de groep van een kind.
 *
 * - `nu`: de groep van het kind ligt tussen de laagste en de hoogste groep van
 *   de set, die twee meegeteld.
 * - `herhaling`: de set hoort bij een eerdere groep.
 * - `later`: de set hoort bij een latere groep.
 * - `neutraal`: er is geen groep, of de set heeft er geen.
 */
export type Indeling = 'nu' | 'herhaling' | 'later' | 'neutraal';

export function pastBijGroep(
  groepen: readonly Groep[] | undefined,
  groep: Groep | undefined,
): Indeling {
  if (groep === undefined || groepen === undefined || groepen.length === 0) return 'neutraal';
  // Van de laagste tot en met de hoogste: een set van groep 5 en 7 slaat groep
  // 6 niet over, hij is alleen in groep 6 niet geschreven.
  if (groep > Math.max(...groepen)) return 'herhaling';
  if (groep < Math.min(...groepen)) return 'later';
  return 'nu';
}

/**
 * Een getal om op te sorteren: lager staat hoger.
 *
 * Neutraal telt als "past nu". Een mix, een foutenlijst of een eigen lijst van
 * een ouder heeft geen groep, en hoort daarom niet onder "Voor later" te
 * zakken; en zonder groep is alles neutraal, zodat een stabiele sortering
 * precies de volgorde van vandaag teruggeeft.
 */
export function rangVoorGroep(indeling: Indeling): number {
  if (indeling === 'herhaling') return 1;
  if (indeling === 'later') return 2;
  return 0;
}

/**
 * Hoe een onderwerp van meer sets past: zoals zijn best passende set.
 *
 * "Keersommen" is tot 10, tot 100 en tot 1000. Voor een kind in groep 6 past
 * tot 100 nu, en dan past het onderwerp nu — ook al is tot 10 herhaling en tot
 * 1000 voor later. Een onderwerp waarin niets past en iets neutraal is, is
 * neutraal.
 */
export function samen(indelingen: readonly Indeling[]): Indeling {
  if (indelingen.includes('nu')) return 'nu';
  if (indelingen.length === 0 || indelingen.includes('neutraal')) return 'neutraal';
  return indelingen.includes('herhaling') ? 'herhaling' : 'later';
}

/**
 * Waarmee een kind begint dat nog niets deed: de vaste keuze als die past, en
 * anders de set die het best bij de groep past.
 *
 * "Het best" is de set die nu past en het laatst begint. Voor groep 6 past de
 * tafel van 11 (groep 5 en 6) en passen keersommen tot 100 (groep 6); het
 * tweede is de stof van dit jaar, het eerste die van vorig jaar die nog loopt.
 * Bij gelijke stand wint de eerste in de lijst, en dat is de volgorde van de
 * content. Past er niets, dan blijft de vaste keuze staan.
 */
export function kiesVoorGroep<T>(
  standaard: T,
  kandidaten: readonly T[],
  groepenVan: (waarde: T) => readonly Groep[] | undefined,
  groep: Groep | undefined,
): T {
  if (groep === undefined) return standaard;
  if (pastBijGroep(groepenVan(standaard), groep) === 'nu') return standaard;

  let beste: { waarde: T; begin: number } | null = null;
  for (const waarde of kandidaten) {
    const groepen = groepenVan(waarde);
    if (pastBijGroep(groepen, groep) !== 'nu' || groepen === undefined) continue;
    const begin = Math.min(...groepen);
    if (beste === null || begin > beste.begin) beste = { waarde, begin };
  }
  return beste?.waarde ?? standaard;
}

/** Een lijst op groep gezet, verder in de volgorde waarin hij kwam. */
export function opGroep<T>(lijst: readonly T[], indeling: (waarde: T) => Indeling): T[] {
  return lijst
    .map((waarde, plek) => ({ waarde, plek, rang: rangVoorGroep(indeling(waarde)) }))
    .sort((een, ander) => een.rang - ander.rang || een.plek - ander.plek)
    .map(({ waarde }) => waarde);
}
