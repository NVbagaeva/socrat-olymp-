/**
 * Набор разбора на сборке: формулы KaTeX, координатная прямая,
 * закрытая строка для браузера.
 *
 * Здесь единственное место, где разбор задания №4 и №5 встречается
 * с KaTeX. Модуль импортируют страницы (они серверные), а не
 * клиентские компоненты: те получают уже набранный HTML и в KaTeX
 * не нуждаются. Формат разбора и разделение шага на слова и
 * вычисление — в razbor.ts.
 */

import { katex } from '../graph/katex';
import { typeset } from '../tex';
import type { Pryamaya } from './pryamaya';
import { type Razbor, razdelit } from './razbor';
import { sealText } from './secret';
import type { Step } from './types';

/**
 * Формула вычисления отдельной строкой. Набирается в строчном режиме
 * с \displaystyle: дроби получаются полного размера, как в учебнике,
 * а строка остаётся прижатой к левому краю, а не по центру.
 *
 * `strogo` — падать на ошибке TeX: так работает автотест; на сборке
 * ошибка не роняет страницу, а оставляет формулу исходным текстом.
 */
export function naborFormuly(tex: string, strogo = false): string {
  return katex.renderToString(`\\displaystyle ${tex}`, {
    throwOnError: strogo,
    displayMode: false,
  });
}

/** Шаги банка → шаги для показа: слова и формула набраны. */
export function naborRazbora(shagi: readonly Step[], pryamaya?: Pryamaya, strogo = false): Razbor {
  return {
    shagi: shagi.map((shag) => {
      if (shag.formula !== undefined) {
        return { slova: typeset(shag.text), formula: naborFormuly(shag.formula, strogo) };
      }
      const { slova, tex } = razdelit(shag.text);
      return { slova: typeset(slova), formula: tex === null ? null : naborFormuly(tex, strogo) };
    }),
    ...(pryamaya === undefined ? {} : { pryamaya }),
  };
}

/** Закрыть разбор отпечатком ответа: вызывается на сборке. */
export function zapechatatRazbor(razbor: Razbor, seal: string): string {
  return sealText(JSON.stringify(razbor), seal);
}
