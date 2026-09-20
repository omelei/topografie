import { useEffect, useState } from 'react';
import { loadDiplomaRijen } from '@/store/rewardStore';

/** Zoals elke datum die een kind te zien krijgt: "20 september 2026". */
const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });

export function datumVan(iso: string | Date): string {
  return DATUM.format(typeof iso === 'string' ? new Date(iso) : iso);
}

/**
 * Wanneer elk diploma gehaald is, per id.
 *
 * De vier wanden lezen elk een eigen verzameling ids (`loadDiplomas` en
 * familie) en die laten de datum vallen. Een gehaalde kaart draagt zijn datum,
 * dus die komt hier vandaan — één uitlezing voor het hele raster, en de eerste
 * datum blijft staan omdat `rewardStore` een diploma alleen wegschrijft als het
 * er nog niet stond.
 */
export function useDiplomaDatums(): ReadonlyMap<string, string> {
  const [datums, setDatums] = useState<ReadonlyMap<string, string>>(new Map());

  useEffect(() => {
    let levend = true;
    void loadDiplomaRijen().then((rijen) => {
      if (!levend) return;
      setDatums(new Map(rijen.map((rij) => [rij.id, rij.behaaldOp])));
    });
    return () => {
      levend = false;
    };
  }, []);

  return datums;
}
