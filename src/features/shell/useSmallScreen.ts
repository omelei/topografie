import { useEffect, useState } from 'react';

/**
 * One question about the screen, for the few places a layout decision is not
 * enough.
 *
 * Almost everything about size in this product is CSS: §D's postures follow the
 * number of hands and the distance to the screen, and a media query says all of
 * it without React knowing. This is the exception, because it changes something
 * a stylesheet cannot.
 *
 * **Whether this is a phone** changes which way of practising is offered first,
 * and a default is state (ADR-087). Below 768 a map gets about two hundred
 * pixels of height.
 *
 * There was a second question here — whether there was a column beside the work
 * — for the blocks that stood from 1200 wide. ADR-168 made the page one column,
 * so the question has no answer to change any more.
 */
const PHONE = '(max-width: 767px)';

export function useSmallScreen(): boolean {
  return useMedia(PHONE);
}

function useMedia(media: string): boolean {
  // Guarded because jsdom has no matchMedia and a component under test must not
  // fall over on a question about the screen it is not being drawn on.
  const [matches, setMatches] = useState(() => query(media)?.matches ?? false);

  useEffect(() => {
    const mq = query(media);
    if (!mq) return;

    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [media]);

  return matches;
}

function query(media: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(media)
    : null;
}
