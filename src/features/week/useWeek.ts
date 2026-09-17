import { useCallback, useEffect, useState } from 'react';
import { leesWeek, schrijfWeekdoel, type WeekStand } from '@/store/weekStore';

/**
 * De weekkaart, gelezen (ADR-149). Null tot hij bekend is: een kaart die leeg
 * begint en dan drie stempels krijgt, heeft een kind even iets verkeerds laten
 * zien.
 *
 * `kiesDoel` schrijft het nieuwe doel en leest de kaart opnieuw, zodat een
 * gehaald doel meteen zijn zegel krijgt.
 */
export function useWeek(): {
  readonly week: WeekStand | null;
  readonly kiesDoel: (doel: number) => void;
} {
  const [week, setWeek] = useState<WeekStand | null>(null);

  useEffect(() => {
    let levend = true;
    void leesWeek().then((stand) => {
      if (levend) setWeek(stand);
    });
    return () => {
      levend = false;
    };
  }, []);

  const kiesDoel = useCallback((doel: number) => {
    void schrijfWeekdoel(doel)
      .then(() => leesWeek())
      .then(setWeek);
  }, []);

  return { week, kiesDoel };
}
