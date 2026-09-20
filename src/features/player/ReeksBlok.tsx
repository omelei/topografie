import type { Reeks } from '@/game-core';
import { t } from '@/i18n';

/**
 * De reeks: dagen op rij met een afgemaakte ronde.
 *
 * **Alleen op Voor ouders, en niet meer bij het kind.** Hij stond op Jij en
 * onderaan Ronde klaar. ADR-158 schreef zelf op wat dat kostte: een reeks is
 * verlies-als-prikkel, dat staat op de verbodenlijst van het onderzoek dat aan
 * ADR-149 voorafging, en het raakt DSA art. 28 en de Code voor Kinderrechten.
 * Zolang de toren ernaast stond was er een verzachting — breken kostte geen
 * steen — maar die toren is er niet meer, en dan blijft alleen de prikkel over.
 *
 * Voor de ouder is hij wél informatie: volhouden is precies wat spreiden nodig
 * heeft, en een ouder kan er iets mee zonder dat een kind zich erop
 * blindstaart. Daarom spreekt dit blok de ouder aan en niet het kind.
 */
export function ReeksBlok({ reeks }: { readonly reeks: Reeks | null }) {
  if (reeks === null) return null;

  return (
    <section className="tk-card flex flex-col gap-2" aria-label={t('reeks.ouderNaam')}>
      <h2 className="tk-label">{t('reeks.ouderNaam')}</h2>
      <p className="text-lopend">
        {reeks.dagen > 0
          ? t('reeks.ouderRegel', { aantal: reeks.dagen, record: reeks.record })
          : reeks.record > 0
            ? t('reeks.ouderGeen', { record: reeks.record })
            : t('reeks.ouderNooit')}
      </p>
      <p className="tk-hulp">{t('reeks.ouderUitleg')}</p>
    </section>
  );
}
