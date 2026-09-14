import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nl } from '@/i18n/nl';
import { PremiumScreen } from './PremiumScreen';
import { PremiumSlot } from './PremiumSlot';

const ROOT = process.cwd();

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, out);
    else if (/\.tsx$/.test(entry) && !/\.test\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * How the line between free and premium is drawn on screen (ADR-124).
 *
 * ADR-122 decided *what* is on which side and `premium.test.ts` checks that.
 * What is checked here is the other half of the same decision: whether a
 * family can see the line, and whether being on the free side of it is a
 * readable state of the app rather than a wall of identical locks.
 */
describe('what a family without a code sees', () => {
  it('puts what premium is before the field only a code holder can fill', () => {
    render(<PremiumScreen aside={null} />);

    const koppen = screen.getAllByRole('heading', { level: 2 }).map((kop) => kop.textContent);

    // The comparison first, the code field last. The other way round — which is
    // how this page read until ADR-124 — opens with an input for a code that
    // almost nobody arriving from a lock has.
    expect(koppen).toEqual([nl['premium.vergelijkTitel'], nl['premium.codeTitelNog']]);
  });

  it('shows both halves of the offer, not only the paid one', () => {
    render(<PremiumScreen aside={null} />);

    // The free side used to be one grey line under the premium list. It is the
    // whole of oefenen since ADR-122, and an offer shown against nothing cannot
    // be weighed.
    expect(screen.getByText(nl['premium.gratisTitel'])).toBeInTheDocument();
    expect(screen.getByText(nl['premium.gratis.voorspelling'])).toBeInTheDocument();
    expect(screen.getByText(nl['premium.premiumTitel'])).toBeInTheDocument();
    expect(screen.getByText(nl['premium.functie.onthouden'])).toBeInTheDocument();
  });

  it('says what this block would hold, and offers one door where it has one', () => {
    const { unmount } = render(<PremiumSlot wat="premium.slot.onthouden" />);
    expect(screen.getByText(nl['premium.slot.onthouden'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: nl['premium.slotKnop'] })).toBeInTheDocument();
    unmount();

    // The repeated locks on one page say the same thing without a second
    // button: a call to action four times down a page is nagging, and the page
    // always has one.
    render(<PremiumSlot wat="premium.slot.kinderen" knop={false} />);
    expect(screen.getByText(nl['premium.slot.kinderen'])).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('never leaves a lock saying only that premium exists', () => {
    // The generic sentence is the component's fallback and stays as one, for a
    // lock added in a hurry. What it must not be is what every lock says: on
    // Jij there were seven of them under seven headings, and seven copies of
    // one sentence tell a reader nothing seven times.
    const kaal: string[] = [];

    for (const full of tsxFiles(join(ROOT, 'src'))) {
      const file = relative(ROOT, full).split(sep).join('/');
      if (file === 'src/features/premium/PremiumSlot.tsx') continue;

      const bron = readFileSync(full, 'utf8');
      for (const match of bron.matchAll(/<Premium(Slot|Sectie)\b([\s\S]*?)\/>/g)) {
        if (!(match[2] ?? '').includes('wat=')) kaal.push(`${file}: <Premium${match[1] ?? ''} …>`);
      }
    }

    expect(kaal, 'give each lock its own line: what would stand here').toEqual([]);
  });
});
