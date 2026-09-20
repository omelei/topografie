import { DiplomaIcon } from '@/components/Icon';
import type { Module } from '@/features/shell/modules';
import { t } from '@/i18n';
import { Embleem } from './Embleem';

export interface DiplomaBeeld {
  readonly module: Module['id'];
  /** "Tafeldiploma", "Vlaggendiploma". */
  readonly soort: string;
  /** "Tafel van 7", "Europa". */
  readonly naam: string;
  readonly gehaald: boolean;
  /** De naam van het kind, leeg als die er niet is. Alleen bij gehaald. */
  readonly kindNaam: string;
  /** Al opgemaakt: "20 september 2026". Alleen bij gehaald. */
  readonly datum: string | null;
  /** Hoe vol de ring staat als het diploma nog niet gehaald is. */
  readonly vul: number | undefined;
  /** De zin onderaan als het diploma nog niet gehaald is. */
  readonly standZin: string | null;
}

/**
 * Het diploma, groot — op het scherm en op papier hetzelfde ding.
 *
 * Dit bestond al, maar alleen als `.tk-diplomaprint`: een dubbele rand van acht
 * pixels, de soort, de naam, van wie en wanneer. Het stond nergens op het
 * scherm, dus wie zijn diploma een week later wilde ophangen kon dat niet — de
 * printknop zat alleen op Ronde klaar. Nu is het één component op twee plekken:
 * schermvullend bij de uitreiking, en als dialoog in de kast.
 *
 * Drie dingen zijn erbij gekomen ten opzichte van het papier. Een band in de
 * vakkleur langs de bovenrand, de enige plek waar het vak kleur krijgt. Het
 * embleem als zegel, op 88 in plaats van 56 — dezelfde vorm, geen nieuwe. En
 * een niet-gehaalde variant, want een kaart die je nog niet hebt gaat óók open:
 * dan draagt de rand de boog van wat je onthoudt, en staat er onderaan hoe ver
 * je bent in plaats van van wie hij is.
 *
 * `data-beat` markeert de delen die de uitreiking één voor één binnenhaalt. Er
 * staat geen animatie in dit bestand: het is een tekening, en de scène ernaast
 * beslist wanneer welk deel er staat.
 */
export function GrootDiploma({ beeld }: { readonly beeld: DiplomaBeeld }) {
  return (
    <div
      className="tk-grootdiploma"
      data-module={beeld.module}
      data-gehaald={beeld.gehaald ? 'ja' : undefined}
      data-print="ja"
    >
      <p className="tk-grootdiploma-soort" data-beat="soort">
        {beeld.soort}
      </p>
      <p className="tk-grootdiploma-naam" data-beat="naam">
        {beeld.naam}
      </p>

      <span className="tk-grootdiploma-zegel" data-beat="ring">
        <Embleem
          icon={DiplomaIcon}
          module={beeld.module}
          gehaald={beeld.gehaald}
          groot
          vul={beeld.vul}
        />
      </span>

      <div className="tk-grootdiploma-voet" data-beat="wie">
        {beeld.gehaald ? (
          <>
            <p>
              {beeld.kindNaam === ''
                ? t('afzwemmen.printZonderNaam')
                : t('afzwemmen.printNaam', { naam: beeld.kindNaam })}
            </p>
            {beeld.datum === null ? null : (
              <p>{t('afzwemmen.printDatum', { datum: beeld.datum })}</p>
            )}
          </>
        ) : beeld.standZin === null ? null : (
          <p>{beeld.standZin}</p>
        )}
      </div>
    </div>
  );
}
