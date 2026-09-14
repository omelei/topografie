/**
 * Het beetje Deno dat `index.ts` gebruikt.
 *
 * Supabase draait edge functions op Deno; de rest van dit project is Node en
 * TypeScript weet hier dus niets van. In plaats van dit bestand buiten `tsc` te
 * houden — waarmee het enige bestand dat echt met geld praat ongecontroleerd zou
 * blijven — staat hier wat ervan gebruikt wordt en niets meer.
 */
declare namespace Deno {
  const env: { get(naam: string): string | undefined };
  function serve(handler: (verzoek: Request) => Response | Promise<Response>): void;
}
