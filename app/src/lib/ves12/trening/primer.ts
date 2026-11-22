/**
 * Разобранный пример типа №12 для карты «О задании» — на сборке.
 *
 * Пример — первая задача открытого банка ФИПИ в наборе (нет — первый
 * шаблон), собранная движком со своим seed («primer:…»): числа у неё
 * другие, чем у той же задачи в тренажёре, и разобранный пример не
 * подсказывает ответ тренировки. Условие, чертёж, ответ и шаги разбора
 * — движка, без правок.
 */

import { zadachaShablona } from '@/lib/trainerSession';
import { typeset } from '@/lib/tex';
import type { KatalogBanka } from '@/lib/trening/bank';
import { shagiIz12, type Shag12 } from './shagi12';

export interface Primer12 {
  /** Ключ задачи-примера: «Потренировать этот тип» и закладки. */
  klyuch: string;
  uslovieHtml: string;
  chertezhSvg: string | null;
  shagi: Shag12[];
  /** Ответ: число или номер варианта с его разметкой. */
  otvetHtml: string;
}

const cache = new Map();

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Seed примера: свой, не тот, что у набора в тренировке. */
export function seedPrimera12(nabor: string): (attempt: number) => string {
  return (attempt) => (attempt === 0 ? `primer:${nabor}` : `primer:${nabor}:${attempt}`);
}

export function klyuchPrimera12(katalog: KatalogBanka, nabor: string): string | undefined {
  const z = katalog[nabor];
  return z?.f[0] ?? z?.a[0];
}

export function primer12(katalog: KatalogBanka, nabor: string): Primer12 | null {
  const klyuch = klyuchPrimera12(katalog, nabor);
  if (klyuch === undefined) return null;
  const task = zadachaShablona(klyuch, seedPrimera12(nabor), cache);
  if (task === null) return null;
  const variant = task.options?.find((o) => o.number === task.answer);
  return {
    klyuch,
    uslovieHtml: task.questionHtml,
    chertezhSvg: task.chartSvg,
    shagi: shagiIz12(task.solution, task.rightHint, typeset),
    otvetHtml:
      variant === undefined
        ? esc(task.answer)
        : `${esc(variant.number)}: <span class="z12-otvet-variant">${variant.html}</span>`,
  };
}
