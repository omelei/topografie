import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OefenLijst, type OefenRijData } from './OefenLijst';

function rijen(aantal: number, gedrukt: string[] = []): OefenRijData[] {
  return Array.from({ length: aantal }, (_, plek) => ({
    sleutel: `set-${plek}`,
    moduleId: 'topo',
    titel: `Onderwerp ${plek + 1}`,
    regel: 'Meerkeuze',
    onClick: () => gedrukt.push(`set-${plek}`),
  }));
}

/** Een rij van Vandaag als lijst, op een telefoon (ADR-252). */
describe('OefenLijst', () => {
  it('toont drie rijen en klapt de rest uit met "Nog {n} tonen"', () => {
    const gedrukt: string[] = [];
    render(<OefenLijst titel="Verder oefenen" rijen={rijen(5, gedrukt)} />);

    const groep = screen.getByRole('group', { name: 'Verder oefenen' });
    expect(groep.querySelectorAll('.tk-oefenrij')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Nog 2 tonen' }));
    expect(groep.querySelectorAll('.tk-oefenrij')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: /^Nog \d+ tonen$/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Onderwerp 5/ }));
    expect(gedrukt).toEqual(['set-4']);
  });

  it('zegt "Nog 1 tonen" bij één, en niets bij drie of minder', () => {
    const { unmount } = render(<OefenLijst titel="Past bij groep 6" rijen={rijen(4)} />);
    expect(screen.getByRole('button', { name: 'Nog 1 tonen' })).toBeInTheDocument();
    unmount();

    render(<OefenLijst titel="Past bij groep 6" rijen={rijen(3)} />);
    expect(screen.queryByRole('button', { name: /tonen/ })).toBeNull();
  });

  it('zet het aantal vragen rechts in de kop', () => {
    render(<OefenLijst titel="Vandaag herhalen" meta="12 vragen" rijen={rijen(2)} />);
    expect(screen.getByRole('region', { name: 'Vandaag herhalen' })).toHaveTextContent(
      'Vandaag herhalen12 vragen',
    );
  });
});
