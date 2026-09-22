import { render, screen } from '@testing-library/react';
import { useAccount } from '@/features/account/useAccount';
import { useOuder } from './useOuder';
import { Pinslot } from './Pinslot';

/**
 * Welke poort er vóór de pincode staat (ADR-176, ADR-178).
 *
 * Dit is de enige plek waar dat te toetsen is. De e2e-suite draait op een bouw
 * zonder gezinsproject — `VITE_GEZIN_URL` is leeg in CI — en komt dus altijd
 * langs het geboortejaar. De tak die er sinds ADR-178 naast staat, zou daar
 * nooit aangeraakt worden, en een tak die niemand aanraakt is een tak die stil
 * verrot.
 *
 * Wat de drie gevallen vastleggen is precies de beslissing:
 *
 * 1. Geen project → het geboortejaar. Zwakker, en de enige goede terugval voor
 *    een apparaat dat nergens iets kan navragen.
 * 2. Wel een project, geen sessie → het account. Hier zit ook "aangemeld maar
 *    de mail nog niet bevestigd" in: Supabase geeft dan een gebruiker terug
 *    zonder tokens, dus `sessie` blijft null en er komt niemand langs.
 * 3. Wel een project, wel een sessie → meteen de pincode zetten. Wie door de
 *    poort is, hoort er geen tweede te krijgen.
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
    inloggen: vi.fn(),
    aanmelden: vi.fn(),
    uitloggen: vi.fn(),
  } as unknown as ReturnType<typeof useAccount>);
}

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

  it('laat een ingelogde ouder meteen een pincode kiezen', () => {
    stand({ pinGezet: false, ingesteld: true, sessie: true });
    render(<Pinslot onOpen={vi.fn()} />);

    expect(screen.getByLabelText('Nieuwe pincode')).toBeInTheDocument();
    expect(screen.queryByTestId('accountformulier')).toBeNull();
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
