import { act, render, screen } from '@testing-library/react';
import { emptyState, type ItemState, type Schedulable } from '@/game-core';
import { listChildren } from '@/store/children';
import { loadItemStates } from '@/store/progress';
import { PREMIUM_SLEUTEL } from '@/store/premium';
import { DezeWeek } from './DezeWeek';

vi.mock('@/store/children', () => ({ listChildren: vi.fn() }));
vi.mock('@/store/progress', () => ({ loadItemStates: vi.fn() }));
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

/** Deze week op de ouderpagina (ADR-227). */
describe('deze week', () => {
  beforeEach(() => {
    kinderen.mockResolvedValue([{ id: 'fem', naam: 'Fem' }] as never);
  });
  afterEach(() => {
    window.localStorage.clear();
    standen.mockReset();
  });

  it('zegt zonder code wat het plan zou doen, met het aanbod erbij', async () => {
    standen.mockResolvedValue(geoefend(6));
    render(<DezeWeek />);
    expect(
      await screen.findByText('Fem oefende deze week 6 verschillende vragen.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Met premium zet het plan ze voor Fem klaar/)).toHaveTextContent(
      / en /,
    );
    expect(screen.getByRole('button', { name: 'Wat zit er in premium?' })).toBeInTheDocument();
  });

  it('staat er niet onder 5 onderdelen', async () => {
    standen.mockResolvedValue(geoefend(4));
    let container: HTMLElement | null = null;
    await act(async () => {
      container = render(<DezeWeek />).container;
    });
    expect(standen).toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
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
    render(<DezeWeek />);
    expect(await screen.findByText(/Het plan zet ze weer klaar/)).toBeInTheDocument();
    expect(screen.queryByText(/Met premium/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Wat zit er in premium?' })).toBeNull();
  });
});
