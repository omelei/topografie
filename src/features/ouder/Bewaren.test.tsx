import { fireEvent, render, screen } from '@testing-library/react';
import { leesBewaarstand, vraagBlijvend } from '@/store/bewaarstand';
import { Bewaren } from './Bewaren';

vi.mock('@/store/bewaarstand', () => ({ leesBewaarstand: vi.fn(), vraagBlijvend: vi.fn() }));

const stand = vi.mocked(leesBewaarstand);
const vraag = vi.mocked(vraagBlijvend);

/**
 * Wat de ouder leest over bewaren, per browser (ADR-186). Welke browser wat
 * zegt, ligt in `bewaarstand.test.ts`; hier ligt wat de pagina ermee doet.
 */
describe('bewaren op dit apparaat', () => {
  afterEach(() => {
    stand.mockReset();
    vraag.mockReset();
  });

  it('zegt in een tabblad van Safari de regel van de week, en de weg eromheen', async () => {
    stand.mockResolvedValue({ blijvend: false, beginscherm: 'kan-erop' });
    render(<Bewaren />);
    expect(await screen.findByText(/een week niet opent/)).toBeInTheDocument();
    expect(screen.getByText(/Zet op beginscherm/)).toBeInTheDocument();
    // Dat wat in Safari staat niet meegaat, staat er ook: een ouder hoort het
    // te weten vóór hij het doet.
    expect(screen.getByText(/begint de app leeg/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('zegt het als de app al op het beginscherm staat', async () => {
    stand.mockResolvedValue({ blijvend: null, beginscherm: 'staat-erop' });
    render(<Bewaren />);
    expect(await screen.findByText(/staat op het beginscherm/)).toBeInTheDocument();
  });

  it('vraagt pas om te bewaren als de ouder erop drukt, en zegt wat de browser antwoordt', async () => {
    stand.mockResolvedValue({ blijvend: false, beginscherm: 'onbekend' });
    vraag.mockResolvedValue(false);
    render(<Bewaren />);

    const knop = await screen.findByRole('button', { name: 'Vraag de browser het te bewaren' });
    expect(vraag).not.toHaveBeenCalled();
    fireEvent.click(knop);
    expect(await screen.findByRole('status')).toHaveTextContent('zegt nog nee');
  });

  it('laat zien dat het bewaard wordt als de browser ja zegt', async () => {
    stand.mockResolvedValue({ blijvend: false, beginscherm: 'onbekend' });
    vraag.mockResolvedValue(true);
    render(<Bewaren />);

    fireEvent.click(await screen.findByRole('button', { name: 'Vraag de browser het te bewaren' }));
    expect(await screen.findByText(/ook als het apparaat vol raakt/)).toBeInTheDocument();
  });

  it('tekent niets als de browser er niets over zegt', async () => {
    stand.mockResolvedValue({ blijvend: null, beginscherm: 'onbekend' });
    const { container } = render(<Bewaren />);
    await vi.waitFor(() => expect(stand).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
