import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DiplomaDialoog } from './DiplomaDialoog';
import type { DiplomaBeeld } from './GrootDiploma';

const BEELD: DiplomaBeeld = {
  module: 'tafels',
  soort: 'Tafeldiploma',
  naam: 'Tafel van 7',
  gehaald: true,
  kindNaam: 'Sanne',
  datum: '20 september 2026',
  vul: undefined,
  standZin: null,
};

/**
 * De dialoog is het bewerkelijkste deel van dit scherm, en het is het soort
 * werk dat half af gaat en dan alleen met een toetsenbord opvalt. Daarom staan
 * hier geen kleuren maar de vier dingen die stilletjes rotten: waar de focus
 * heen gaat, waar hij terugkomt, of Escape sluit, en of Tab binnen blijft.
 */
/**
 * Een browser geeft focus aan een knop die je indrukt; `fireEvent.click` doet
 * dat niet. Dus doen we het hier met de hand, anders toetsen we of de focus
 * terugkeert naar `document.body`.
 */
function druk(knop: HTMLElement) {
  knop.focus();
  fireEvent.click(knop);
}

function Proef() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open de kaart
      </button>
      {open ? (
        <DiplomaDialoog
          beeld={BEELD}
          titel="Bekijk je diploma: Tafel van 7"
          knop={
            <button type="button" className="tk-button">
              Print je diploma
            </button>
          }
          onSluit={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

describe('het diploma groot, met een toetsenbord', () => {
  it('is een dialoog met een naam', () => {
    render(<Proef />);
    druk(screen.getByRole('button', { name: 'Open de kaart' }));

    const venster = screen.getByRole('dialog');
    expect(venster).toHaveAttribute('aria-modal', 'true');
    expect(venster).toHaveAccessibleName('Bekijk je diploma: Tafel van 7');
  });

  it('zet de focus naar binnen', () => {
    render(<Proef />);
    druk(screen.getByRole('button', { name: 'Open de kaart' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Print je diploma' }));
  });

  it('sluit met Escape en geeft de focus terug aan de kaart', () => {
    render(<Proef />);
    const kaart = screen.getByRole('button', { name: 'Open de kaart' });
    druk(kaart);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(kaart);
  });

  it('sluit met Terug en geeft de focus terug', () => {
    render(<Proef />);
    const kaart = screen.getByRole('button', { name: 'Open de kaart' });
    druk(kaart);

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(kaart);
  });

  it('houdt Tab binnen de dialoog', () => {
    render(<Proef />);
    druk(screen.getByRole('button', { name: 'Open de kaart' }));

    const venster = screen.getByRole('dialog');
    const terug = screen.getByRole('button', { name: 'Terug' });
    terug.focus();

    // Voorbij de laatste: terug naar de eerste, en niet de pagina erachter in.
    fireEvent.keyDown(venster, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Print je diploma' }));

    // En andersom.
    fireEvent.keyDown(venster, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(terug);
  });

  it('laat de kast eronder niet scrollen, en zet dat terug', () => {
    render(<Proef />);
    druk(screen.getByRole('button', { name: 'Open de kaart' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByRole('button', { name: 'Terug' }));
    expect(document.body.style.overflow).toBe('');
  });
});
