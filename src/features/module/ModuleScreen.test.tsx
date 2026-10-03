import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MODULES } from '@/features/shell/modules';
import { ModuleScreen } from './ModuleScreen';

// Geen IndexedDB in jsdom: de pagina leest een lege voortgang en geen diploma's.
vi.mock('@/store/progress', () => ({ loadItemStates: () => Promise.resolve(new Map()) }));
vi.mock('@/store/children', () => ({ groepVanActiefKind: () => Promise.resolve(undefined) }));
vi.mock('@/store/rewardStore', () => {
  const leeg = () => Promise.resolve(new Set());
  return {
    loadDiplomas: leeg,
    loadVlagDiplomas: leeg,
    loadKlokDiplomas: leeg,
    loadTopoDiplomas: leeg,
    loadBehaald: leeg,
    loadDiplomaRijen: () => Promise.resolve([]),
  };
});
vi.mock('@/features/premium/usePremium', () => ({
  usePremium: () => ({ actief: true, stand: null }),
  naarPremium: () => {},
}));

// Een telefoon: `useSmallScreen` vraagt naar `(max-width: 767px)`.
const echt = window.matchMedia;
beforeAll(() => {
  window.matchMedia = (media: string) =>
    ({
      matches: media.includes('max-width: 767px'),
      media,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
});
afterAll(() => {
  window.matchMedia = echt;
});

/** De pagina met zijn adres, zoals `App` hem zet: een set kiezen zet hem erin. */
function Pagina({ id }: { readonly id: string }) {
  const module = MODULES.find((kandidaat) => kandidaat.id === id);
  const [setId, setSetId] = useState<string | null>(null);
  if (!module) throw new Error(id);
  return <ModuleScreen module={module} setId={setId} onSet={setSetId} onStart={() => {}} />;
}

const stap = (naam: string | RegExp) => screen.getByRole('region', { name: naam });
const geenStap = (naam: string | RegExp) =>
  expect(screen.queryByRole('region', { name: naam })).toBeNull();
const kies = (regio: string | RegExp, knop: string | RegExp) =>
  fireEvent.click(within(stap(regio)).getByRole('button', { name: knop }));

describe('de vakpagina op een telefoon (ADR-252)', () => {
  it('begint met niets gekozen en stap 1 open, en gaat na elke keuze vanzelf door', () => {
    render(<Pagina id="topo" />);

    // Stap 1 open, de kaart nog niet gekozen; de rest wacht.
    expect(
      within(stap(/Waar op de kaart/)).getByRole('button', { name: /Nederland/ }),
    ).toHaveAttribute('aria-pressed', 'false');
    geenStap('Kies een onderwerp');
    expect(
      screen.getByRole('button', { name: 'Naar stap 2: Kies een onderwerp' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Stap 1 van 3')).toBeInTheDocument();

    kies(/Waar op de kaart/, /Nederland/);
    geenStap(/Waar op de kaart/);
    expect(
      screen.getByRole('button', { name: /^Wijzig stap 1, Waar op de kaart\?: Nederland/ }),
    ).toBeInTheDocument();

    kies('Kies een onderwerp', /^Provincies/);
    kies(/Hoe wil je/, /^Meerkeuze/);

    // Na de laatste keuze is alles dicht, en staat het startblok er.
    expect(
      screen
        .queryAllByRole('region')
        .filter((r) => r.tagName === 'SECTION' && r.classList.contains('tk-stapopen')),
    ).toEqual([]);
    expect(screen.getByText('Klaar om te starten')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Start: / })).toBeEnabled();
  });

  it('opent met Wijzig die stap, en gaat na een keuze naar de eerste stap die nog leeg is', () => {
    render(<Pagina id="topo" />);
    kies(/Waar op de kaart/, /Nederland/);
    kies('Kies een onderwerp', /^Provincies/);
    kies(/Hoe wil je/, /^Meerkeuze/);

    // Wijzig de spelvorm: alleen die stap open, en een kleine Start.
    fireEvent.click(screen.getByRole('button', { name: /^Wijzig stap 3, Hoe wil je oefenen/ }));
    expect(stap(/Hoe wil je/)).toBeInTheDocument();
    expect(screen.getByText('Alles gekozen')).toBeInTheDocument();

    // Een andere spelvorm: alles weer dicht.
    kies(/Hoe wil je/, /^Aanwijzen/);
    geenStap(/Hoe wil je/);
    expect(screen.getByText('Klaar om te starten')).toBeInTheDocument();

    // Wijzig de kaart, en kies een andere: het onderwerp is gewist, en daar
    // gaat het verder — niet bij de spelvorm, die nog staat.
    fireEvent.click(screen.getByRole('button', { name: /^Wijzig stap 1/ }));
    kies(/Waar op de kaart/, /Europa/);
    expect(stap('Kies een onderwerp')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Wijzig stap 3, Hoe wil je oefenen/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Wijzig stap 2/ })).toBeNull();
  });

  it('dezelfde kaart nog eens houdt het onderwerp', () => {
    render(<Pagina id="topo" />);
    kies(/Waar op de kaart/, /Nederland/);
    kies('Kies een onderwerp', /^Provincies/);

    fireEvent.click(screen.getByRole('button', { name: /^Wijzig stap 1/ }));
    kies(/Waar op de kaart/, /Nederland/);
    expect(
      screen.getByRole('button', { name: /^Wijzig stap 2, Kies een onderwerp: Provincies/ }),
    ).toBeInTheDocument();
    expect(stap(/Hoe wil je/)).toBeInTheDocument();
  });

  it('wist met een ander onderwerp ook welke je koos', () => {
    render(<Pagina id="tafels" />);

    // Rekenen vraagt eerst welke sommen (ADR-258), dan het onderwerp.
    kies('Welke sommen?', /^Keer en delen/);
    kies('Kies een onderwerp', /^Tafels/);
    kies('Welke tafel?', 'Tafel van 7');
    expect(
      screen.getByRole('button', { name: /^Wijzig stap 3, Welke tafel\?: 7/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Wijzig stap 2/ }));
    kies('Kies een onderwerp', /^Keersommen/);
    // De tafel is weg, en de vraag die erbij hoort staat open.
    expect(stap('Tot welk getal?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Welke tafel/ })).toBeNull();
  });
});
