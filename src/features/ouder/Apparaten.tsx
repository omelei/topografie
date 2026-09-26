import { useState } from 'react';
import { brand } from '@/config/brand';
import { t, type TranslationKey } from '@/i18n';
import { leesbareDatum, usePremium } from '@/features/premium/usePremium';
import {
  toonApparaten,
  vervangPlek,
  type Apparaat,
  type ApparaatLabel,
  type Apparaten as ApparatenStand,
  type VervangUitkomst,
} from '@/store/premium';

/**
 * Welke apparaten de code gebruiken, en zelf een plek vervangen (ADR-226).
 *
 * **Een plek is een apparaat waarop een kind premium startte.** Niet elk
 * apparaat waarop de code is ingevuld: een ouder die op zijn telefoon de code
 * intypt om deze pagina te zien, neemt er geen. Dat zegt het blok eerst, want
 * het is precies wat een ouder met drie plekken wil weten.
 *
 * **De lijst komt pas na een druk op de knop.** Deze pagina vraagt uit zichzelf
 * niemand iets (ADR-116): wie hem opent om een instelling om te zetten, stuurt
 * niets weg.
 *
 * **Alleen een apparaat met een plek ziet de lijst.** Dat regelt de server.
 * Een klassencode kennen veertig gezinnen, en welke tablets er bij een ander
 * thuis liggen, gaat hen niets aan. Zonder plek staat er hoeveel plekken bezet
 * zijn, en waar het wél kan.
 *
 * **Vervangen vraagt eerst of het zeker is**, want het kan drie keer per jaar.
 * Daarna verwijst de melding naar het adres van leer.nu.
 */
export function Apparaten() {
  const { actief, stand } = usePremium();
  const [lijst, setLijst] = useState<ApparatenStand | null>(null);
  const [bezig, setBezig] = useState(false);
  const [zeker, setZeker] = useState<string | null>(null);
  const [uitkomst, setUitkomst] = useState<VervangUitkomst | null>(null);

  if (!actief || stand === null) return null;

  const laad = async () => {
    setBezig(true);
    setLijst(await toonApparaten());
    setBezig(false);
  };

  const vervang = async (plek: string) => {
    setBezig(true);
    const gedaan = await vervangPlek(plek);
    setZeker(null);
    setUitkomst(gedaan);
    setLijst(await toonApparaten());
    setBezig(false);
  };

  return (
    <section className="flex flex-col gap-3" aria-label={t('ouder.apparaten')}>
      <h2 className="tk-sectie">{t('ouder.apparaten')}</h2>
      <div className="tk-card flex flex-col gap-3" aria-busy={bezig}>
        <p className="text-lopend">
          {t(stand.plek === true ? 'ouder.apparatenDitMet' : 'ouder.apparatenDitZonder')}
        </p>
        <p className="tk-hulp">{t('ouder.apparatenUitleg')}</p>

        {uitkomst ? <Melding uitkomst={uitkomst} /> : null}

        {lijst === null ? (
          <button
            type="button"
            className="tk-button tk-button-secondary self-start"
            disabled={bezig}
            onClick={() => void laad()}
          >
            {t('ouder.apparatenBekijk')}
          </button>
        ) : lijst.ok ? (
          <>
            <p className="text-lopend">
              {t('ouder.apparatenBezet', { bezet: lijst.bezet, plekken: lijst.plekken })}
            </p>
            <ul className="flex flex-col gap-3">
              {lijst.apparaten.map((apparaat) => (
                <Rij
                  key={apparaat.plek}
                  apparaat={apparaat}
                  zeker={zeker === apparaat.plek}
                  kanVervangen={lijst.vervangingenOver > 0 && !bezig}
                  onVraag={() => {
                    setUitkomst(null);
                    setZeker(apparaat.plek);
                  }}
                  onNee={() => setZeker(null)}
                  onJa={() => void vervang(apparaat.plek)}
                />
              ))}
            </ul>
            <p className="tk-hulp">
              {lijst.vervangingenOver > 0
                ? t('ouder.apparatenOver', { aantal: lijst.vervangingenOver })
                : t('ouder.apparatenGrens', { adres: brand.contact })}
            </p>
          </>
        ) : (
          <p className="text-lopend">
            {lijst.reden === 'geen-plek'
              ? t('ouder.apparatenGeenPlek', {
                  bezet: lijst.bezet ?? 0,
                  plekken: lijst.plekken ?? 0,
                })
              : t(LIJST_FOUT[lijst.reden] ?? 'ouder.apparatenFout.anders')}
          </p>
        )}
      </div>
    </section>
  );
}

const LABEL: Record<ApparaatLabel, TranslationKey> = {
  ipad: 'apparaat.ipad',
  iphone: 'apparaat.iphone',
  'android-tablet': 'apparaat.android-tablet',
  'android-telefoon': 'apparaat.android-telefoon',
  chromebook: 'apparaat.chromebook',
  windows: 'apparaat.windows',
  mac: 'apparaat.mac',
  linux: 'apparaat.linux',
  onbekend: 'apparaat.onbekend',
};

const LIJST_FOUT: Partial<Record<string, TranslationKey>> = {
  'geen-verbinding': 'premium.fout.geen-verbinding',
  'niet-ingesteld': 'premium.fout.niet-ingesteld',
  'te-vaak': 'premium.fout.te-vaak',
};

function Rij({
  apparaat,
  zeker,
  kanVervangen,
  onVraag,
  onNee,
  onJa,
}: {
  readonly apparaat: Apparaat;
  readonly zeker: boolean;
  readonly kanVervangen: boolean;
  readonly onVraag: () => void;
  readonly onNee: () => void;
  readonly onJa: () => void;
}) {
  const naam = t(LABEL[apparaat.label]);
  return (
    <li className="flex flex-col gap-2 border-t border-rand-licht pt-3 first:border-t-0 first:pt-0">
      <p className="tk-lijstrij-titel">
        {apparaat.ditApparaat ? t('ouder.apparaatDit', { naam }) : naam}
      </p>
      <p className="tk-hulp">
        {t('ouder.apparaatDatums', {
          sinds: leesbareDatum(apparaat.toegevoegd),
          gezien: leesbareDatum(apparaat.laatstGezien),
        })}
      </p>
      {apparaat.ditApparaat ? null : zeker ? (
        <div className="flex flex-col gap-2">
          <p className="text-lopend">{t('ouder.apparaatVervangZeker', { naam })}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="tk-button tk-button-secondary" onClick={onJa}>
              {t('ouder.apparaatVervangJa')}
            </button>
            <button type="button" className="tk-button tk-button-tertiary" onClick={onNee}>
              {t('ouder.apparaatVervangNee')}
            </button>
          </div>
        </div>
      ) : kanVervangen ? (
        <button
          type="button"
          className="tk-button tk-button-tertiary self-start"
          aria-label={t('ouder.apparaatVervangNaam', { naam })}
          onClick={onVraag}
        >
          {t('ouder.apparaatVervang')}
        </button>
      ) : null}
    </li>
  );
}

function Melding({ uitkomst }: { readonly uitkomst: VervangUitkomst }) {
  if (uitkomst.ok) {
    return (
      <p role="status" className="tk-melding" data-soort="gelukt">
        {t('ouder.apparaatVervangen')}
      </p>
    );
  }
  const zin =
    uitkomst.reden === 'grens'
      ? t('ouder.apparatenGrens', { adres: brand.contact })
      : uitkomst.reden === 'geen-verbinding'
        ? t('premium.fout.geen-verbinding')
        : uitkomst.reden === 'te-vaak'
          ? t('premium.fout.te-vaak')
          : t('ouder.apparatenFout.anders');
  return (
    <p role="alert" className="tk-melding" data-soort="fout">
      {zin}
    </p>
  );
}
