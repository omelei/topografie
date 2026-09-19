import { Component, type ErrorInfo, type ReactNode } from 'react';
import { brand } from '@/config/brand';
import { Wordmark } from '@/components/Wordmark';
import { t } from '@/i18n';

/**
 * Wat er staat als er iets kapotgaat (ADR-166).
 *
 * Er stond niets. Een fout in welk scherm dan ook haalde de hele React-boom
 * weg en liet een wit vlak achter — geen woord, geen knop, geen weg terug. Op
 * een iPad in de keuken is dat het einde van het oefenen, en wat een ouder
 * ervan hoort is "de app is stuk".
 *
 * En de kans erop is niet theoretisch. Elk scherm leest IndexedDB, en dat is de
 * plek waar dit product zijn hele geheugen heeft staan: een browser die de
 * opslag halverwege weggooide, een rij uit een nieuwere versie, een iPad die
 * geen quota meer geeft. De stores lezen elk voor zich alsof een vreemde
 * geschreven had — `dagstandStore`, `weekdoelStore`, `testPlan` deden dat al —
 * maar dat dekt alleen de rij die ze zelf lezen.
 *
 * **Wat hier staat is een zin en twee knoppen**, en geen foutmelding. De tekst
 * van een uitzondering zegt een kind niets en een ouder bijna niets; wat allebei
 * verder helpt is "probeer opnieuw" en "ga terug naar het begin". De fout gaat
 * wél naar de console, want daar hoort hij, en daar kijkt degene die hem moet
 * oplossen.
 *
 * **Niets wordt weggegooid.** Opnieuw proberen tekent de boom opnieuw; terug
 * naar de voordeur laadt de pagina opnieuw. Geen van beide raakt de opslag aan,
 * want een scherm dat stuk is, is geen bewijs dat de voortgang stuk is — en het
 * is precies het moment waarop iemand in paniek op de verkeerde knop drukt.
 *
 * Een klasse en geen hook: `componentDidCatch` bestaat alleen op een klasse, en
 * er is geen hook-equivalent.
 */

interface Staat {
  readonly stuk: boolean;
}

export class Foutscherm extends Component<{ readonly children: ReactNode }, Staat> {
  override state: Staat = { stuk: false };

  static getDerivedStateFromError(): Staat {
    return { stuk: true };
  }

  override componentDidCatch(fout: Error, info: ErrorInfo): void {
    // De enige plek in de app die naar de console schrijft, en met reden: dit
    // is wat een ontwikkelaar nodig heeft en wat een kind nooit ziet.
    console.error('leer.nu kon dit scherm niet tekenen', fout, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.stuk) return this.props.children;

    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 p-6">
        <div>
          <Wordmark height={40} />
          <p className="mt-1 text-tekst-secundair">{brand.slogan}</p>
        </div>

        <section className="tk-card flex flex-col gap-4" aria-labelledby="fout-kop">
          <h1 id="fout-kop" className="tk-titel">
            {t('fout.titel')}
          </h1>
          <p className="text-lopend">{t('fout.uitleg')}</p>
          <p className="text-lopend text-tekst-secundair">{t('fout.bewaard')}</p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="tk-button"
              onClick={() => this.setState({ stuk: false })}
            >
              {t('fout.opnieuw')}
            </button>
            <button
              type="button"
              className="tk-button tk-button-secondary"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              {t('fout.naarBegin')}
            </button>
          </div>
        </section>
      </main>
    );
  }
}
