import type { Shag } from '../steklo';
import type { VoprosPodskazki } from '../trening';
import type { ShagChasti13 } from '@/lib/zadanie13/reshenieHtml';
import type { Vopros13 } from '@/lib/zadanie13/trening/zagruzka';

/**
 * Решение задачи №13 шагами «Стеклянной сцены»: подпись шага — его
 * название, пояснение и формула — те же, что в теории и на листе;
 * таблица по периодам и плашки — прежней разметкой (reshenie13.css)
 * прямо в шаге. «Внимание на формулировку» — тёплая плашка шага.
 * Работает и на сборке, и в браузере.
 */
export function shagi13(chasti: readonly ShagChasti13[]): Shag[] {
  return chasti.map((c) => ({
    zagolovokHtml: c.zagolovokHtml,
    chtoHtml: c.chtoHtml,
    formulaHtml: c.formulaHtml === '' ? '' : `<div class="z13-reshenie">${c.formulaHtml}</div>`,
    ...(c.vid === 'vnimanie' ? { ton: 'vnimanie' as const } : {}),
    ...(c.dopHtml === ''
      ? {}
      : {
          risunok: <div className="z13-reshenie" dangerouslySetInnerHTML={{ __html: c.dopHtml }} />,
        }),
  }));
}

/** Подсказки-вопросы движка — в общем виде. */
export function voprosy13(voprosy: readonly Vopros13[]): VoprosPodskazki[] {
  return voprosy.map((v) => ({
    voprosHtml: v.question,
    variantyHtml: v.options,
    verno: v.correct,
    ...(v.comment === null ? {} : { kommentariyHtml: v.comment }),
  }));
}
