import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOuder } from '@/features/ouder/useOuder';
import { PremiumPoort } from './PremiumPoort';

vi.mock('@/features/ouder/useOuder', () => ({ useOuder: vi.fn() }));
const alsOuder = vi.mocked(useOuder);

/** De deur voor de premiumpagina (ADR-232): eerst de vraag, dan de prijs. */

function zet(ouder: boolean) {
  alsOuder.mockReturnValue({ ouder } as ReturnType<typeof useOuder>);
}

function toon(onTerug = vi.fn()) {
  render(
    <PremiumPoort onTerug={onTerug}>
      <p>de premiumpagina</p>
    </PremiumPoort>,
  );
  return onTerug;
}

afterEach(() => window.sessionStorage.clear());

describe('de deur voor de premiumpagina', () => {
  it('vraagt eerst het geboortejaar, en laat de pagina dan pas zien', () => {
    zet(false);
    toon();
    expect(screen.queryByText('de premiumpagina')).toBeNull();

    fireEvent.change(screen.getByLabelText('In welk jaar ben je geboren?'), {
      target: { value: '1980' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(screen.getByText('de premiumpagina')).toBeInTheDocument();

    // Eén keer per tabblad: de volgende keer staat de pagina er meteen.
    cleanup();
    toon();
    expect(screen.getByText('de premiumpagina')).toBeInTheDocument();
  });

  it('laat een kind dat het niet weet er niet in', () => {
    zet(false);
    toon();
    fireEvent.change(screen.getByLabelText('In welk jaar ben je geboren?'), {
      target: { value: '2017' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));
    expect(screen.queryByText('de premiumpagina')).toBeNull();
  });

  it('heeft een weg terug', () => {
    zet(false);
    const onTerug = toon();
    fireEvent.click(screen.getByRole('button', { name: 'Terug naar Vandaag' }));
    expect(onTerug).toHaveBeenCalled();
  });

  it('laat wie de ouderpagina open heeft meteen door', () => {
    zet(true);
    toon();
    expect(screen.getByText('de premiumpagina')).toBeInTheDocument();
  });
});
