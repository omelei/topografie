/**
 * Eén gebied als plaatje: de vorm uit de kaart, los en passend gemaakt.
 *
 * Voor de terugkoppeling na een antwoord, waar het plaatje klein is en de kaart
 * ernaast al staat. Een rand van acht procent eromheen, zodat een lange vorm als
 * Zeeland niet tegen de kant van het vakje drukt.
 */
export function KaartVorm({
  d,
  bbox,
}: {
  readonly d: string;
  readonly bbox: readonly [number, number, number, number];
}) {
  const [x0, y0, x1, y1] = bbox;
  const rand = Math.max(x1 - x0, y1 - y0) * 0.08;
  const viewBox = [x0 - rand, y0 - rand, x1 - x0 + 2 * rand, y1 - y0 + 2 * rand].join(' ');
  return (
    <svg className="tk-plaatje-vorm" viewBox={viewBox} aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}
