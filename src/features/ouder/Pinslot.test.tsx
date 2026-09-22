import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useAccount } from '@/features/account/useAccount';
import { useOuder } from './useOuder';
import { Pinslot } from './Pinslot';

/**
 * Welke poort er vóór de pincode staat (ADR-176, ADR-178).
 *
 * Dit is de enige plek waar de tak zónder gezinsproject te toetsen is. De
 * e2e-suite draait op een bouw mét project — `playwright.config.ts` geeft hem
 * er een — en komt dus altijd langs het account. De terugval die ernaast staat
 * zou daar nooit aangeraakt worden, en een tak die niemand aanraakt is een tak
 * die stil verrot. Het is bovendien de tak die vandaag live staat.
 *
 * Wat de gevallen vastleggen is precies de beslissing:
 *
 * 1. Geen project → het geboortejaar. Zwakker, en de enige goede terugval voor
 *    een apparaat dat nergens iets kan navragen.
 * 2. Wel een project → het account. Hier zit ook "aangemeld maar de mail nog
 *    niet bevestigd" in: Supabase geeft dan een gebruiker terug zonder tokens,
 *    dus `sessie` blijft null en er komt niemand langs.
 * 3. Wel een project én een sessie → nog steeds het account, nu om het
 *    wachtwoord. Dit is het geval dat ertoe doet: de sessie van een ouder staat
 *    maanden in `localStorage` op een apparaat dat het hele gezin gebruikt.
 *    Zou die sessie de poort openen, dan tikt het kind op "Pincode vergeten?"
 *    en zet er zijn eigen code op.
 * 4. Staat er een pincode, dan wordt die gevraagd — wat er ook ingesteld is.
 */

vi.mock('./useOuder', () => ({ useOuder: vi.fn() }));
vi.mock('@/features/account/useAccount', () => ({ useAccount: vi.fn() }));

// Het formulier van het account praat met Supabase zodra het gemonteerd wordt;
// wat hier getest wordt is welke poort er staat, niet wat erachter gebeurt.
vi.mock('@/features/account/AccountBlok', () => ({
  AccountBlok: () => <div data-testid="accountformulier" />,
}));

const alsOuder = vi.mocked(useOuder);
const alsAccount = vi.mocked(useAccount);

const inloggen = vi.fn();

function stand({
  pinGezet,
  ingesteld,
  sessie,
}: {
  readonly pinGezet: boolean;
  readonly ingesteld: boolean;
  readonly sessie: boolean;
}) {
  alsOuder.mockReturnValue({ pinGezet, ouder: false });
  alsAccount.mockReturnValue({
    ingesteld,
    sessie: sessie
      ? {
          gebruikerId: 'ouder-1',
          email: 'ouder@example.nl',
          token: 't',
          vernieuwToken: 'v',
          verlooptOp: '',
        }
      : null,
    inloggen,
    aanmelden: vi.fn(),
    uitloggen: vi.fn(),
  } as unknown as ReturnType<typeof useAccount>);
}

beforeEach(() => inloggen.mockReset());

describe('de poort vóór de pincode', () => {
  it('vraagt zonder gezinsproject een geboortejaar', () => {
    stand({ pinGezet: false, ingesteld: false, sessie: false });
    render(<Pinslot onOpen={vi.fn()} />);

    expect(screen.getByLabelText('In welk jaar ben je geboren?')).toBeInTheDocument();
    expect(screen.queryByTestId('accountformulier')).toBeNull();
  });

  it('vraagt mét een gezinsproject om een account, en niet om een jaartal', () => {
    stand({ pinGezet: false, ingesteld: true, sessie: false });
    render(<Pinslot onOpen={vi.fn()} />);

    expect(screen.getByTestId('accountformulier')).toBeInTheDocument();
    expect(screen.queryByLabelText('In welk jaar ben je geboren?')).toBeNull();
    // En de zin zegt waaróm, want een mailadres vragen zonder reden leest als
    // een product dat adressen verzamelt.
    expect(screen.getByRole('heading', { name: 'Maak een ouderaccount' })).toBeInTheDocument();
  });

  it('laat een ingelogde ouder er niet zomaar langs, maar vraagt zijn wachtwoord', () => {
    stand({ pinGezet: false, ingesteld: true, sessie: true });
    render(<Pinslot onOpen={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Ben jij het?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Je wachtwoord')).toBeInTheDocument();
    // Geen pincodeveld: de sessie alleen is niet genoeg.
    expect(screen.queryByLabelText('Nieuwe pincode')).toBeNull();
    // En het adres staat er als tekst, niet als veld: de vraag is niet wie je
    // bent maar of jij het bent.
    expect(screen.queryByLabelText('E-mailadres')).toBeNull();
    expect(screen.getByText(/ouder@example\.nl/)).toBeInTheDocument();
  });

  it('laat de pincode kiezen zodra het wachtwoord klopt', async () => {
    inloggen.mockResolvedValue({ ok: true, sessie: null });
    stand({ pinGezet: false, ingesteld: true, sessie: true });
    render(<Pinslot onOpen={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Je wachtwoord'), { target: { value: 'geheimwoord' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));

    await waitFor(() => expect(screen.getByLabelText('Nieuwe pincode')).toBeInTheDocument());
    expect(inloggen).toHaveBeenCalledWith('ouder@example.nl', 'geheimwoord');
  });

  it('houdt een fout wachtwoord tegen, en zegt waarom', async () => {
    inloggen.mockResolvedValue({ ok: false, reden: 'onjuist' });
    stand({ pinGezet: false, ingesteld: true, sessie: true });
    render(<Pinslot onOpen={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Je wachtwoord'), { target: { value: 'gegokt' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verder' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('horen niet bij elkaar'),
    );
    expect(screen.queryByLabelText('Nieuwe pincode')).toBeNull();
  });

  it('vraagt de bestaande pincode zodra er een staat, wat er ook ingesteld is', () => {
    for (const ingesteld of [false, true]) {
      stand({ pinGezet: true, ingesteld, sessie: false });
      const { unmount } = render(<Pinslot onOpen={vi.fn()} />);

      expect(screen.getByLabelText('Pincode')).toBeInTheDocument();
      expect(screen.queryByLabelText('Nieuwe pincode')).toBeNull();
      unmount();
    }
  });
});
