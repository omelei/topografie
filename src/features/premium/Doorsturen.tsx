import { useState } from 'react';
import { FamilyIcon } from '@/components/Icon';
import { pathFor } from '@/features/shell/routes';
import { t } from '@/i18n';

/**
 * "Stuur het naar je vader of moeder" (ADR-174).
 *
 * Dit is het gat dat ADR-163 openliet en dat de opdracht van de eigenaar met
 * zoveel woorden noemt: **een kind kan alleen zitten oefenen.** Het drukt om
 * vier uur op een slot, er is niemand in de kamer, en het venster dat opengaat
 * vraagt om een code die het niet heeft en niet kan krijgen. Dan is er maar
 * één ding dat helpt: de beslissing doorgeven aan iemand die er later naar
 * kijkt.
 *
 * Dus gaat er een link de deur uit. De ouder opent hem om zeven uur op zijn
 * eigen telefoon, leest daar wat het is, en koopt of niet. Het kind hoeft er
 * niets meer voor te doen; de volgende keer dat het de app opent, staat het
 * open.
 *
 * **De link wijst naar de premiumpagina en niet naar de kassa.** Wie een link
 * koud binnenkrijgt, heeft eerst de uitleg nodig en niet een betaalformulier.
 * De kassaknop staat op die pagina, één druk verder.
 *
 * **Er gaat niets mee dan het adres.** Geen naam, geen voortgang, geen
 * apparaatnummer, en ook niet welke oefening het kind wilde doen. Dat laatste
 * zou verleidelijk zijn — het maakt de pagina van de ouder persoonlijker — maar
 * het is het soort gegeven dat dit product juist niet de deur uit doet, en het
 * reist bovendien via WhatsApp of de mail van iemand anders.
 *
 * **Drie manieren, in deze volgorde.** De deelknop van het toestel als die er
 * is (op een telefoon is dat precies wat een kind kent: WhatsApp, Berichten,
 * de mail van zijn ouder). Anders de link kopiëren. En als kopiëren ook niet
 * mag — dat kan, `clipboard` vraagt een beveiligde context en mag geweigerd
 * worden — staat het adres er gewoon, om over te tikken of vast te pakken.
 */

type Stand =
  | { readonly soort: 'klaar' }
  | { readonly soort: 'bezig' }
  | { readonly soort: 'gedeeld' }
  | { readonly soort: 'gekopieerd' }
  | { readonly soort: 'handmatig' };

/** Het adres dat de ouder opent. Absoluut, want het gaat dit apparaat uit. */
function premiumAdres(): string {
  return `${window.location.origin}${pathFor({ name: 'premium' })}`;
}

export function Doorsturen() {
  const [stand, setStand] = useState<Stand>({ soort: 'klaar' });
  const adres = premiumAdres();

  async function stuur() {
    setStand({ soort: 'bezig' });

    // De deelknop van het toestel. Hij moet uit een echte aanraking komen —
    // daarom staat hij in de klikafhandeling en niet achter een `await` die
    // eerst iets anders doet.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: t('doorsturen.onderwerp'),
          text: t('doorsturen.bericht'),
          url: adres,
        });
        setStand({ soort: 'gedeeld' });
        return;
      } catch {
        // Wegklikken gooit hier ook (`AbortError`), en dat is geen fout: het
        // kind bedacht zich. Dus geen melding, maar terug naar de knop — en
        // als delen echt niet kan, gaat het hieronder alsnog via kopiëren.
        if (typeof navigator.clipboard?.writeText !== 'function') {
          setStand({ soort: 'handmatig' });
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${t('doorsturen.bericht')} ${adres}`);
      setStand({ soort: 'gekopieerd' });
    } catch {
      setStand({ soort: 'handmatig' });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="tk-kaartteken">
        <FamilyIcon size={24} />
      </p>
      <h2 className="tk-titel">{t('doorsturen.titel')}</h2>
      <p className="text-lopend">{t('doorsturen.uitleg')}</p>

      {stand.soort === 'gedeeld' || stand.soort === 'gekopieerd' ? (
        <p role="status" className="text-lopend">
          {stand.soort === 'gedeeld' ? t('doorsturen.verstuurd') : t('doorsturen.gekopieerd')}
        </p>
      ) : (
        <button
          type="button"
          className="tk-button self-start"
          disabled={stand.soort === 'bezig'}
          onClick={() => void stuur()}
        >
          {stand.soort === 'bezig' ? t('doorsturen.bezig') : t('doorsturen.knop')}
        </button>
      )}

      {/* Het adres zelf, als delen én kopiëren niets deden. Geen veld maar
          tekst: er valt niets in te typen, en een veld zou suggereren van wel. */}
      {stand.soort === 'handmatig' ? (
        <>
          <p className="text-lopend">{t('doorsturen.zelf')}</p>
          <p className="tk-adres">{adres}</p>
        </>
      ) : null}

      {/* De mail staat er altijd bij, als tweede weg en niet als vangnet. Een
          kind dat het adres van zijn ouder kent, is hiermee in één druk klaar,
          ook op een laptop waar de deelknop niet bestaat. */}
      <a
        className="tk-doel-ander self-start"
        href={`mailto:?subject=${encodeURIComponent(t('doorsturen.onderwerp'))}&body=${encodeURIComponent(
          `${t('doorsturen.bericht')}\n\n${adres}`,
        )}`}
      >
        {t('doorsturen.mail')}
      </a>
    </div>
  );
}
