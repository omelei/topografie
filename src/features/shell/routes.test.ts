import { describe, expect, it } from 'vitest';
import { MODULE_SLUG, pathFor, routeFor, RETENTION_SLUG } from './routes';
import { MODULES } from './modules';

/**
 * The addresses.
 *
 * Two things are being pinned. That every module in the plan has a path, so
 * adding the eighth cannot quietly leave it unreachable — and that a path a
 * child mistypes lands them somewhere they can carry on from rather than on an
 * error about their spelling.
 */
describe('the addresses', () => {
  it('opens the front door at the root', () => {
    expect(routeFor('/')).toEqual({ name: 'home' });
    expect(routeFor('')).toEqual({ name: 'home' });
  });

  it('gives every module in the plan a path of its own', () => {
    const slugs = MODULES.map((module) => MODULE_SLUG[module.id]);
    expect(new Set(slugs).size, 'two modules share a slug').toBe(slugs.length);

    for (const module of MODULES) {
      const route = routeFor(`/${MODULE_SLUG[module.id]}`);
      expect(route.name, module.id).toBe(module.built ? 'module' : 'soon');
    }
  });

  it('opens topography, which is the one that exists', () => {
    const route = routeFor('/topografie');
    expect(route).toMatchObject({ name: 'module' });
  });

  it('says "not yet" for a module the plan has and the product does not', () => {
    // Not a redirect to the home screen. The child asked a question by typing
    // an address, and showing them something else instead of answering is how
    // an app teaches you not to trust its addresses.
    //
    // This used to be klokkijken and then woordjes, which are now built — the
    // assertion moving to the next unbuilt module is the plan doing what
    // ADR-051 says it does.
    const route = routeFor('/tijdvakken');
    expect(route).toMatchObject({ name: 'soon' });
  });

  it('opens Taal at the word the rail says, and each part at its own name', () => {
    // ADR-118. /taal is the address; /spelling and /werkwoorden open Taal on
    // that part, and /woordjes, the placeholder, opens /taal.
    const taal = routeFor('/taal');
    expect(taal).toMatchObject({ name: 'module', setId: null });
    if (taal.name !== 'module') throw new Error('expected a module');
    expect(taal.module.id).toBe('woorden');
    expect(taal).not.toHaveProperty('regio');

    expect(routeFor('/spelling')).toMatchObject({ name: 'module', setId: null, regio: 'spelling' });
    expect(routeFor('/werkwoorden')).toMatchObject({ regio: 'werkwoorden', setId: null });
    expect(routeFor('/taal/werkwoorden')).toMatchObject({ regio: 'werkwoorden', setId: null });
    expect(pathFor(routeFor('/werkwoorden'))).toMatch(/\/taal\/werkwoorden$/);

    const woordjes = routeFor('/woordjes');
    expect(woordjes).toMatchObject({ name: 'module', setId: null });
    expect(pathFor(woordjes)).toMatch(/\/taal$/);
  });

  it('gives every set of Taal an address, and the two mixes their own names', () => {
    // A table of its own, because both parts have a mix and "mix" could only
    // have meant one of them.
    for (const [pad, setId] of [
      ['/taal/ei-ij', 'taal-sp-eiij'],
      ['/taal/d-of-t', 'taal-sp-dt'],
      ['/taal/verkleinwoorden', 'taal-sp-verkleinwoorden'],
      ['/taal/spellingmix', 'taal-sp-mix'],
      ['/taal/tegenwoordige-tijd', 'taal-ww-tt'],
      ['/taal/voltooid-deelwoord', 'taal-ww-vd'],
      ['/taal/werkwoordmix', 'taal-ww-mix'],
      ['/taal/werkwoorden-fouten', 'taal-ww-fouten'],
    ] as const) {
      expect(routeFor(pad), pad).toMatchObject({ name: 'module', setId });
      expect(pathFor(routeFor(pad)), pad).toMatch(new RegExp(`${pad}$`));
    }
    // A set under an alias, and a set nobody offers.
    expect(routeFor('/spelling/ei-ij')).toMatchObject({ setId: 'taal-sp-eiij' });
    expect(routeFor('/taal/mix')).toMatchObject({ name: 'module', setId: null });
  });

  it('sends a mistyped path to the front door rather than an error', () => {
    expect(routeFor('/topgrafie')).toEqual({ name: 'home' });
    expect(routeFor('/wat-dan-ook')).toEqual({ name: 'home' });
  });

  it('ignores the slashes people actually type', () => {
    expect(routeFor('/topografie/')).toMatchObject({ name: 'module' });
    expect(routeFor('topografie')).toMatchObject({ name: 'module' });
  });

  it('round-trips every route through its own path', () => {
    expect(routeFor(pathFor({ name: 'home' }))).toEqual({ name: 'home' });
    expect(routeFor(pathFor({ name: 'retention' }))).toEqual({ name: 'retention' });

    for (const module of MODULES) {
      const route = module.built
        ? ({ name: 'module', module, setId: null } as const)
        : ({ name: 'soon', module } as const);
      expect(routeFor(pathFor(route)), module.id).toMatchObject({ name: route.name });
    }
  });

  it('puts tafels under rekenen and klokkijken beside it', () => {
    // The distinction the owner drew: telling the time is not arithmetic, it is
    // reading an instrument. Business plan v6 already split them into two
    // modules with two accents, and the category is the word a parent types
    // without collapsing that back into one thing.
    //
    // What the word leads to is the tables themselves. A category holding one
    // built module *is* that module: a page with a single card on it saying
    // "Rekenen" is a redirect wearing a hat, and it charged a child a click.
    const rekenen = routeFor('/rekenen');
    expect(rekenen).toMatchObject({ name: 'module' });
    if (rekenen.name !== 'module') throw new Error('expected a module');
    expect(rekenen.module.id).toBe('tafels');

    // The module's own slug still works: it has been written down.
    expect(routeFor('/tafels')).toMatchObject({ name: 'module' });

    // And the clock keeps its own address, beside rekenen rather than under it.
    // Telling the time is not arithmetic, so it is not a set of /rekenen and
    // never was, and now that it is built that address opens the clock itself.
    const klok = routeFor('/klokkijken');
    expect(klok).toMatchObject({ name: 'module' });
    if (klok.name !== 'module') throw new Error('expected a module');
    expect(klok.module.id).toBe('klok');
  });

  it('lets the clock answer to the word a child says as well', () => {
    // The rail says "Klok" and nobody types "klokkijken" twice. Same shape as
    // /rekenen beside /tafels one level up: a word people use and a word the
    // product uses, both landing in the same place.
    const kort = routeFor('/klok');
    expect(kort).toMatchObject({ name: 'module' });
    if (kort.name !== 'module') throw new Error('expected a module');
    expect(kort.module.id).toBe('klok');

    // A set under the short word too, because that is what somebody writes on
    // a note. What `pathFor` writes back is still the module's own slug.
    expect(routeFor('/klok/halve-uren')).toMatchObject({ name: 'module', setId: 'klok-half' });
    expect(pathFor(routeFor('/klok/halve-uren'))).toMatch(/\/klokkijken\/halve-uren$/);
  });

  it('gives every step of the clock an address, and the mix the same word', () => {
    // "Mix" in all three modules rather than "klok-mix", "nl-mix" and
    // "rekenmix": those are ids, and an id is not what a parent writes down.
    for (const [pad, setId] of [
      ['/klokkijken/hele-uren', 'klok-heel'],
      ['/klokkijken/halve-uren', 'klok-half'],
      ['/klokkijken/kwartieren', 'klok-kwart'],
      ['/klokkijken/vijf-minuten', 'klok-vijf'],
      ['/klokkijken/mix', 'klok-mix'],
    ] as const) {
      expect(routeFor(pad), pad).toMatchObject({ name: 'module', setId });
      expect(pathFor(routeFor(pad)), pad).toMatch(new RegExp(`${pad}$`));
    }

    // And a step nobody offers opens the clock rather than an empty round.
    expect(routeFor('/klokkijken/seconden')).toMatchObject({ name: 'module', setId: null });
  });

  it('gives a set an address of its own, and the word a parent types', () => {
    // leer.nu/topografie/provincies is a place a child can be sent, which a
    // chooser is not. The map sets drop the source prefix from their ids —
    // nobody types the country twice — and the tables already name themselves.
    const provincies = routeFor('/topografie/provincies');
    expect(provincies).toMatchObject({ name: 'module', setId: 'nl-provincies' });

    const tafel = routeFor('/rekenen/tafel-7');
    expect(tafel).toMatchObject({ name: 'module', setId: 'tafel-7' });

    expect(pathFor(provincies)).toMatch(/\/topografie\/provincies$/);
    expect(pathFor(tafel)).toMatch(/\/rekenen\/tafel-7$/);
  });

  it('gives the new sums of rekenen an address each, and the mixes a word', () => {
    // Four kinds of sum and three mixes, all reachable by typing. The mix is
    // "mix" in both modules rather than "rekenmix" and "nl-mix": those are ids,
    // and an id is not what a parent writes on a note.
    for (const [pad, setId] of [
      ['/rekenen/delen-100', 'delen-100'],
      ['/rekenen/plus-20', 'plus-20'],
      ['/rekenen/min-1000', 'min-1000'],
      ['/rekenen/keer-10', 'keer-10'],
      ['/rekenen/keer-100', 'keer-100'],
      ['/rekenen/splitsen-20', 'splitsen-20'],
      ['/rekenen/halveren-1000', 'halveren-1000'],
      ['/rekenen/verdubbelen-20', 'verdubbelen-20'],
      ['/rekenen/alle-tafels', 'tafels-alle'],
      ['/rekenen/alle-deelsommen', 'deel-alle'],
      ['/rekenen/mix', 'rekenmix'],
      ['/rekenen/mix-makkelijk', 'rekenmix-1'],
      ['/rekenen/mix-gemiddeld', 'rekenmix-2'],
      ['/rekenen/mix-pittig', 'rekenmix-3'],
      ['/rekenen/fouten', 'fouten'],
      ['/topografie/mix', 'nl-mix'],
    ] as const) {
      expect(routeFor(pad), pad).toMatchObject({ name: 'module', setId });
      const route = routeFor(pad);
      expect(pathFor(route), pad).toMatch(new RegExp(`${pad}$`));
    }
  });

  it('opens the module when the set is one nobody has heard of', () => {
    // The child asked for topography by typing it. Answering with the front
    // door because the second word was wrong is the behaviour ADR-044 rejected
    // for modules, and it is no better one level down.
    expect(routeFor('/topografie/verzonnen')).toMatchObject({ name: 'module', setId: null });
    expect(routeFor('/rekenen/tafel-13')).toMatchObject({ name: 'module', setId: null });
    // And a range nobody offers. "Tot 50" is a plausible thing to type and
    // there is no such set, so it opens rekenen rather than an empty round.
    expect(routeFor('/rekenen/plus-50')).toMatchObject({ name: 'module', setId: null });
    expect(routeFor('/rekenen/splitsen-1000')).toMatchObject({ name: 'module', setId: null });
  });

  it('opens the range that holds them where "delen door" used to be', () => {
    // Twelve sets until ADR-120, at /rekenen/deel-7. Somebody may have written
    // that down, and its sums are still there under the same ids.
    expect(routeFor('/rekenen/deel-7')).toMatchObject({ name: 'module', setId: 'delen-100' });
    expect(routeFor('/rekenen/deel-12')).toMatchObject({ name: 'module', setId: 'delen-100' });
    expect(routeFor('/rekenen/deel-1')).toMatchObject({ name: 'module', setId: 'delen-10' });
    expect(pathFor(routeFor('/rekenen/deel-7'))).toMatch(/\/rekenen\/delen-100$/);
    // A table that never was is still a typo.
    expect(routeFor('/rekenen/deel-13')).toMatchObject({ name: 'module', setId: null });
  });

  it('opens the front door where the collection used to be', () => {
    // "Jouw voortgang" is hidden while it is thought through again (ADR-112).
    // An address somebody wrote down lands on the front door, not on nothing.
    expect(routeFor('/voortgang')).toEqual({ name: 'home' });
    expect(routeFor('/ontdekkingsreis')).toEqual({ name: 'home' });
  });

  it('laat de oude adressen van de week en de reeks naar de voordeur vallen', () => {
    // De weekkaart is met het album vervallen (ADR-158). Een adres dat iemand
    // bewaard heeft, komt ergens uit in plaats van op een leeg scherm — net als
    // elk ander woord dat de router niet kent.
    expect(routeFor('/week')).toEqual({ name: 'home' });
    expect(routeFor('/reeks')).toEqual({ name: 'home' });
  });

  it('keeps the retention screen at a word a child could type', () => {
    expect(RETENTION_SLUG).toBe('onthouden');
    expect(routeFor('/onthouden')).toEqual({ name: 'retention' });
  });
});
