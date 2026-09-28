import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OefenenScherm } from './OefenenScherm';

/** Oefenen (ADR-241): de vijf vakken als kaarten, in de volgorde van het plan. */
describe('Oefenen', () => {
  it('shows the five subjects as doors, in the order of the plan', () => {
    const geopend: string[] = [];
    render(<OefenenScherm onOpen={(id) => geopend.push(id)} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Oefenen' })).toBeInTheDocument();
    const kaarten = screen.getAllByRole('button');
    expect(kaarten.map((kaart) => kaart.textContent)).toEqual([
      'Topo',
      'Rekenen',
      'Klok',
      'Taal',
      'Vlaggen',
    ]);
    // Elke kaart draagt zijn vak, zodat de rand en de tint het vak volgen.
    expect(kaarten.map((kaart) => kaart.dataset.module)).toEqual([
      'topo',
      'tafels',
      'klok',
      'woorden',
      'vlaggen',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Klok' }));
    expect(geopend).toEqual(['klok']);
  });
});
