import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OefenenScherm } from './OefenenScherm';

/**
 * Oefenen (ADR-241): de vijf vakken in de volgorde van het plan, sinds ADR-242
 * als dezelfde tegels als onder "Kies een vak" op Vandaag: naam en toelichting.
 */
describe('Oefenen', () => {
  it('shows the five subjects as the tiles of Vandaag, in the order of the plan', () => {
    const geopend: string[] = [];
    render(<OefenenScherm onOpen={(id) => geopend.push(id)} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Oefenen' })).toBeInTheDocument();
    const tegels = screen.getAllByRole('button');
    expect(tegels.map((tegel) => tegel.className)).toEqual(Array(5).fill('tk-vaktegel'));
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
});
