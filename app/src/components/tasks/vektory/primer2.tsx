import { typeset } from '@/lib/tex';
import { generate, opornayaSeed } from '@/lib/vektory/generate';
import { renderVectorPlane } from '@/lib/vektory/render';
import type { Shag } from '../steklo';
import { otvetTekstom, shagiIz2 } from './shagi2';

export interface Primer2 {
  uslovieHtml: string;
  /** Рисунок с катетами — разобранный образец; null у задач без рисунка. */
  risunokSvg: string | null;
  shagi: Shag[];
  otvet: string;
}

/**
 * Разобранный пример типа: та же задача, что была разобрана на вкладке
 * «Опорные задачи» (seed «<id>#opornaya», lib/vektory/opornye.ts), —
 * условие, рисунок с катетами, шаги и ответ. Работает и на сборке
 * (первая раскрытая карточка), и в браузере (остальные — по раскрытию,
 * отдельным куском сборки).
 */
export function primerTipa2(id: string): Primer2 {
  const task = generate(id, opornayaSeed(id));
  return {
    uslovieHtml: typeset(task.uslovie),
    risunokSvg: task.risunok === null ? null : renderVectorPlane({ ...task.risunok, hints: true }),
    shagi: shagiIz2(task.shagi, { bezOtveta: true }),
    otvet: otvetTekstom(task.otvet),
  };
}

/** Для ленивой загрузки в браузере. */
export async function primer2(id: string): Promise<Primer2> {
  return primerTipa2(id);
}
