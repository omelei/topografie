import { fireEvent, render, screen } from '@testing-library/react';
import { PREMIUM_SLEUTEL, toonApparaten, vervangPlek } from '@/store/premium';
import { Apparaten } from './Apparaten';

vi.mock('@/store/premium', async (echt) => ({
  ...(await echt<typeof import('@/store/premium')>()),
  toonApparaten: vi.fn(),
  vervangPlek: vi.fn(),
}));

const tonen = vi.mocked(toonApparaten);
const vervang = vi.mocked(vervangPlek);

function zetCode(plek: boolean) {
  window.localStorage.setItem(
    PREMIUM_SLEUTEL,
    JSON.stringify({
      code: '7K3MQ9TX',
      geldigTot: '2099-12-31',
      gecontroleerd: new Date().toISOString(),
      plek,
    }),
  );
}

const lijst = (vervangingenOver: number) =>
  ({
    ok: true,
    bezet: 3,
    plekken: 3,
    vervangingenOver,
    apparaten: [
      {
        plek: 'aaaa',
        label: 'ipad',
        toegevoegd: '2026-09-01',
        laatstGezien: '2026-09-26',
        ditApparaat: true,
      },
      {
        plek: 'bbbb',
        label: 'chromebook',
        toegevoegd: '2026-09-02',
        laatstGezien: '2026-07-01',
        ditApparaat: false,
      },
    ],
  }) as const;

/** Het blok Apparaten op de ouderpagina (ADR-226). */
describe('apparaten op de ouderpagina', () => {
  afterEach(() => {
    window.localStorage.clear();
    tonen.mockReset();
    vervang.mockReset();
  });

  it('staat er niet zonder code', () => {
    render(<Apparaten />);
    expect(screen.queryByRole('region', { name: 'Apparaten' })).toBeNull();
  });

  it('vraagt niets tot de ouder erom vraagt, en zegt of dit apparaat een plek heeft', () => {
    zetCode(false);
    render(<Apparaten />);
    expect(screen.getByText('Dit apparaat heeft nog geen plek op de code.')).toBeInTheDocument();
    expect(tonen).not.toHaveBeenCalled();
  });

  it('vervangt pas na een tweede druk, en zegt daarna dat de plek vrij is', async () => {
    zetCode(true);
    tonen.mockResolvedValue(lijst(3));
    vervang.mockResolvedValue({ ok: true, vervangingenOver: 2 });
    render(<Apparaten />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekijk de apparaten' }));

    expect(await screen.findByText('iPad (dit apparaat)')).toBeInTheDocument();
    // Dit apparaat vervang je niet; het andere wel.
    expect(screen.getAllByRole('button', { name: /vervangen$/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Chromebook vervangen' }));
    expect(vervang).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ja, vervangen' }));

    expect(await screen.findByRole('status')).toHaveTextContent('De plek is vrij');
    expect(vervang).toHaveBeenCalledWith('bbbb');
  });

  it('verwijst na de derde keer naar info@leer.nu', async () => {
    zetCode(true);
    tonen.mockResolvedValue(lijst(0));
    render(<Apparaten />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekijk de apparaten' }));
    expect(await screen.findByText(/info@leer\.nu/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vervangen$/ })).toBeNull();
  });

  it('zegt op een apparaat zonder plek hoeveel er bezet zijn, en niet welke', async () => {
    zetCode(false);
    tonen.mockResolvedValue({ ok: false, reden: 'geen-plek', bezet: 3, plekken: 3 });
    render(<Apparaten />);
    fireEvent.click(screen.getByRole('button', { name: 'Bekijk de apparaten' }));
    expect(await screen.findByText(/3 van de 3 plekken zijn in gebruik/)).toBeInTheDocument();
    expect(screen.queryByText(/Chromebook/)).toBeNull();
  });
});
