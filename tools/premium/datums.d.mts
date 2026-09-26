// De typen van datums.mjs, voor de toetsen in TypeScript.

export function schooljaarVan(dag: Date): number;
export function isDatum(tekst: string): boolean;
export function geldigheid(
  keuze: {
    readonly van?: string | undefined;
    readonly tot?: string | undefined;
    readonly klaspas?: number | true | undefined;
  },
  vandaag: Date,
): { readonly van: string; readonly tot: string } | { readonly fout: string };
