import { fireEvent, render, screen } from '@testing-library/react';
import { Volwassenencheck } from './Volwassenencheck';

/**
 * Wat het geboortejaar afwijst, en wat het met het antwoord doet (ADR-176).
 *
 * **Waarom dit hier staat en niet in e2e.** Het stond in `ouder.spec.ts`, als
 * stap in de reis naar de ouderpagina. Sinds ADR-178 loopt die reis op een bouw
 * mét gezinsproject langs het account, en de suite draait op zo'n bouw — dus de
 * reis komt hier niet meer langs. Deze poort blijft wel bestaan: hij is de
 * terugval voor een bouw zonder project, en dat is de bouw die vandaag live
 * staat. Een terugval zonder toets is een terugval die stil verrot.
 *
 * Wat hier ligt is dus niet minder dan wat e2e had, maar hetzelfde op de plek
 * waar het hoort: welke poort er bij welke bouw staat ligt in `Pinslot.test`,
 * wat déze poort afwijst ligt hier.
 */
describe('de volwassenencheck', () => {
  /** Het veld gooit alles weg wat geen cijfer is, dus tikken gaat per teken. */
  function typ(jaar: string) {
    const veld = screen.getByLabelText('In welk jaar ben je geboren?');
    fireEvent.change(veld, { target: { value: '' } });
    for (const teken of jaar) {
      fireEvent.change(veld, { target: { value: (veld as HTMLInputElement).value + teken } });
    }
  }

  it('laat een jaartal van een volwassene door', async () => {
    const goed = vi.fn();
    render(<Volwassenencheck onGoed={goed} />);

    typ('1985');
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));

    expect(goed).toHaveBeenCalledOnce();
  });

  it('wijst het jaartal van een kind af, en ook net geen achttien', async () => {
    const goed = vi.fn();
    render(<Volwassenencheck onGoed={goed} />);
    const veld = screen.getByLabelText('In welk jaar ben je geboren?');

    for (const jaar of ['2020', String(new Date().getFullYear() - 17)]) {
      typ(jaar);
      fireEvent.click(screen.getByRole('button', { name: 'Verder' }));

      expect(screen.getByRole('alert')).toHaveTextContent('Dat klopt niet');
      expect(goed).not.toHaveBeenCalled();
      // Het veld wordt leeggemaakt, zodat er niet doorgeteld kan worden met een
      // cijfer erbij tot er eentje langskomt die wel mag.
      expect(veld).toHaveValue('');
    }
  });

  it('bewaart het jaartal nergens', async () => {
    render(<Volwassenencheck onGoed={vi.fn()} />);

    typ('1985');
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));

    // ADR-050 zegt dat dit product nooit een geboortedatum vraagt. Die regel
    // gaat over het kind; dit is een vraag aan de volwassene waarvan het
    // antwoord niet blijft bestaan, en dát is wat de twee verenigbaar maakt.
    expect(JSON.stringify(window.localStorage)).not.toContain('1985');
    expect(JSON.stringify(window.sessionStorage)).not.toContain('1985');
  });

  it('laat letters er niet eens in', async () => {
    render(<Volwassenencheck onGoed={vi.fn()} />);
    const veld = screen.getByLabelText('In welk jaar ben je geboren?');

    typ('19a8b5');
    expect(veld).toHaveValue('1985');
  });
});
