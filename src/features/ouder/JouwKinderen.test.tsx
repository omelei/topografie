import { act, render, screen } from '@testing-library/react';
import { emptyState, type ItemState, type Schedulable } from '@/game-core';
import { listChildren } from '@/store/children';
import { loadItemStates } from '@/store/progress';
import { PREMIUM_SLEUTEL } from '@/store/premium';
import { JouwKinderen } from './JouwKinderen';

vi.mock('@/store/children', async (origineel) => ({
  ...(await origineel<typeof import('@/store/children')>()),
  listChildren: vi.fn(),
}));
vi.mock('@/store/progress', () => ({
  loadItemStates: vi.fn(),
  loadPlayedRounds: vi.fn(async () => []),
}));
vi.mock('@/store/weekdoelStore', async (origineel) => ({
  ...(await origineel<typeof import('@/store/weekdoelStore')>()),
  leesWeekdoelen: vi.fn(async () => ({ doelen: [], uit: false })),
}));
vi.mock('@/store/geheugencheck', () => ({ leesGeheugencheck: vi.fn(async () => null) }));
vi.mock('@/features/module/onderdelen', () => ({ startbareOnderdelen: () => [] }));
vi.mock('@/features/home/useVandaag', () => ({
  planSets: () => [
    {
      sleutel: 'tafel-7',
      set: 'tafel-7',
      items: Array.from({ length: 8 }, (_, i) => ({ id: `t${i}` }) as Schedulable),
    },
  ],
}));

const kinderen = vi.mocked(listChildren);
const standen = vi.mocked(loadItemStates);

const DAG = 86_400_000;

/** `aantal` onderdelen vandaag geoefend, terug over twee en vijf dagen. */
function geoefend(aantal: number): Map<string, ItemState> {
  const nu = Date.now();
  return new Map(
    Array.from({ length: aantal }, (_, i) => [
      `t${i}`,
      {
        ...emptyState(`t${i}`),
        box: 2,
        laatsteReview: new Date(nu).toISOString(),
        volgendeReview: new Date(nu + (i % 2 === 0 ? 2 : 5) * DAG).toISOString(),
      } as ItemState,
    ]),
  );
}

/** Deze week, in de kaart van het kind op de ouderpagina (ADR-227, ADR-262). */
describe('deze week', () => {
  beforeEach(() => {
    kinderen.mockResolvedValue([{ id: 'fem', naam: 'Fem', avatarConfig: {} }] as never);
  });
  afterEach(() => {
    window.localStorage.clear();
    standen.mockReset();
  });

  it('zegt zonder code wat het plan zou doen, zonder eigen koopknop (ADR-236)', async () => {
    standen.mockResolvedValue(geoefend(6));
    render(<JouwKinderen />);
    expect(
      await screen.findByText('Fem oefende deze week 6 verschillende vragen.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Met premium zet het plan ze voor Fem .+ klaar om te herhalen/),
    ).toHaveTextContent(/ en /);
    // Het aanbod staat één keer op de ouderpagina, in het blok Premium.
    expect(screen.getByText(/Premium laat elke vraag terugkomen/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Wat zit er in premium?' })).toBeNull();
  });

  it('staat er niet onder 5 onderdelen', async () => {
    standen.mockResolvedValue(geoefend(4));
    await act(async () => {
      render(<JouwKinderen />);
    });
    expect(standen).toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Fem' })).toBeInTheDocument();
    expect(screen.queryByText(/verschillende vragen/)).toBeNull();
  });

  it('is met een code een feit, zonder aanbod', async () => {
    window.localStorage.setItem(
      PREMIUM_SLEUTEL,
      JSON.stringify({
        code: '7K3MQ9TX',
        geldigTot: '2099-12-31',
        gecontroleerd: new Date().toISOString(),
      }),
    );
    standen.mockResolvedValue(geoefend(5));
    render(<JouwKinderen />);
    expect(await screen.findByText(/Het plan zet ze .+ weer klaar/)).toBeInTheDocument();
    expect(screen.queryByText(/Met premium zet het plan/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Wat zit er in premium?' })).toBeNull();
  });
});
