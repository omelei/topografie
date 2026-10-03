import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OefenenScherm } from './OefenenScherm';

/**
 * Oefenen (ADR-241): de vijf vakken in de volgorde van het plan, sinds ADR-242
 * als dezelfde vakken als onder "Kies een vak" op Vandaag: naam en toelichting,
 * sinds ADR-255 als rijen in de lijst van Vandaag, sinds ADR-259 als tegels in
 * de kleur van het vak, met Denker die zegt wat hij ervan vindt.
 */
describe('Oefenen', () => {
  it('shows the five subjects as tiles, in the order of the plan', () => {
    const geopend: string[] = [];
    render(<OefenenScherm onOpen={(id) => geopend.push(id)} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Oefenen' })).toBeInTheDocument();
    const tegels = screen
      .getAllByRole('button')
      .filter((knop) => knop.classList.contains('tk-vakvlak-tegel'));
    expect(tegels).toHaveLength(5);
    expect(tegels.map((tegel) => tegel.dataset.module)).toEqual([
      'topo',
      'tafels',
      'klok',
      'woorden',
      'vlaggen',
    ]);
    // Met een regel over wat erin zit.
    expect(tegels[0]).toHaveTextContent('TopoProvincies, steden en landen');
    expect(tegels[2]).toHaveTextContent('KlokKlokkijken, van hele uren tot minuten');

    fireEvent.click(screen.getByRole('button', { name: /^Klok/ }));
    expect(geopend).toEqual(['klok']);
  });

  it('lets Denker say something about the subject you point at', () => {
    render(<OefenenScherm onOpen={() => undefined} />);
    expect(screen.getByText('Waar heb je vandaag zin in?')).toBeInTheDocument();

    fireEvent.focus(screen.getByRole('button', { name: /^Rekenen/ }));
    expect(screen.getByText('Rekenen! Tafels en sommen.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Kietel Denker' }));
    expect(screen.getByText('Hihi, dat kietelt!')).toBeInTheDocument();
  });
});
