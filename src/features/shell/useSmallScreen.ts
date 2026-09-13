import { useEffect, useState } from 'react';

/**
 * Two questions about the screen, for the few places a layout decision is not
 * enough.
 *
 * Almost everything about size in this product is CSS: §D's postures follow the
 * number of hands and the distance to the screen, and a media query says all of
 * it without React knowing. These two are the exceptions, and each is one
 * because it changes something a stylesheet cannot.
 *
 * **Whether this is a phone** changes which way of practising is offered first,
 * and a default is state (ADR-087). Below 768 a map gets about two hundred
 * pixels of height.
 *
 * **Whether there is a column beside the work** decides whether the child's own
 * blocks are there at all. From 1200 they are a column of their own; below it
 * they are not drawn, except the tests on the front door (ADR-119). That is a
 * question for React and not for CSS: a block hidden by a stylesheet is still
 * met by a keyboard and a screen reader.
 */
const PHONE = '(max-width: 767px)';
const DESK = '(min-width: 1200px)';

export function useSmallScreen(): boolean {
  return useMedia(PHONE);
}

export function useDesk(): boolean {
  return useMedia(DESK);
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
