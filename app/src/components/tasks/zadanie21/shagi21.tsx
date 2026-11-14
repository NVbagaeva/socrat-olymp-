import { shemaSvg } from '@/lib/zadanie21/shema';
import type { Reshenie21 } from '@/lib/zadanie21/trening/zagruzka';
import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import { otvetTekstom, shagiIzEtapov, voprosyIzRazbora } from '../trening/bank/shagi';

/**
 * Разбор движка (этапы «Шаг 1. Производная» и строки с $…$) шагами
 * «Стеклянной сцены» — общий перевод разбора. Этап «Ответ» на карте
 * задания идёт своей строкой, в шаги не попадает. У этапа со знаками
 * производной под строками — схема: координатная прямая (lib/zadanie21/shema.ts).
 */
export function shagi21(s: Pick<Reshenie21, 'etapy'>): Shag[] {
  return shagiIzEtapov(
    s.etapy.filter((e) => e.title !== 'Ответ'),
    {
      /* Схема знаков производной: координатная прямая под строками шага. */
      risunok: (e) =>
        e.shema === undefined ? null : (
          <div
            className="z21-shema-ramka"
            dangerouslySetInnerHTML={{ __html: shemaSvg(e.shema) }}
          />
        ),
    },
  );
}

export function voprosy21(s: Pick<Reshenie21, 'hints'>): VoprosPodskazki[] {
  return voprosyIzRazbora(s.hints);
}

export { otvetTekstom };
