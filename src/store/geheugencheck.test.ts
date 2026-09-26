import { getSetting, setSetting } from './settings';
import {
  bewaarStilleSessie,
  leesGeheugencheck,
  neemStilleSessie,
  STIL,
  vergeetGeheugencheck,
  zetGeheugencheckKlaar,
} from './geheugencheck';

vi.mock('./settings', () => ({ getSetting: vi.fn(), setSetting: vi.fn() }));

const lees = vi.mocked(getSetting);
const schrijf = vi.mocked(setSetting);

/** De stille ronde van de geheugencheck (ADR-228). */
describe('de geheugencheck', () => {
  afterEach(() => {
    vergeetGeheugencheck();
    lees.mockReset();
    schrijf.mockReset();
  });

  it('maakt alleen de eerstvolgende sessie stil', () => {
    expect(neemStilleSessie()).toBeNull();
    zetGeheugencheckKlaar('kind-1', 'nl-provincies');
    const id = neemStilleSessie();
    expect(id?.startsWith(`${STIL}kind-1:nl-provincies:`)).toBe(true);
    // "Nog een keer" na de check is gewoon oefenen.
    expect(neemStilleSessie()).toBeNull();
  });

  it('staat uit als het kind iets anders begint', () => {
    zetGeheugencheckKlaar('kind-1', 'nl-provincies');
    vergeetGeheugencheck();
    expect(neemStilleSessie()).toBeNull();
  });

  it('bewaart de uitslag per kind, op de dag zelf', async () => {
    await bewaarStilleSessie(
      `${STIL}kind-1:taal-eigen:x:1b4e28ba-2fa1-11d2-883f-0016d3cca427`,
      7,
      10,
      new Date(2026, 8, 26, 15),
    );
    expect(schrijf).toHaveBeenCalledWith(
      'geheugencheck:kind-1',
      JSON.stringify({ dag: '2026-09-26', setId: 'taal-eigen:x', goed: 7, gevraagd: 10 }),
    );
  });

  it('telt een check die voor de 8e vraag stopte niet: dan komt hij terug', async () => {
    await bewaarStilleSessie(`${STIL}kind-1:nl-provincies:abc`, 3, 3);
    expect(schrijf).not.toHaveBeenCalled();
  });

  it('leest alleen een hele uitslag terug', async () => {
    lees.mockResolvedValue('{"dag":"2026-09-26","setId":"s","goed":7,"gevraagd":10}');
    expect(await leesGeheugencheck('kind-1')).toEqual({
      dag: '2026-09-26',
      setId: 's',
      goed: 7,
      gevraagd: 10,
    });
    lees.mockResolvedValue('{"dag":"2026-09-26"}');
    expect(await leesGeheugencheck('kind-1')).toBeNull();
    lees.mockResolvedValue(undefined);
    expect(await leesGeheugencheck('kind-1')).toBeNull();
  });
});
