'use client';

/**
 * Задача журнала «как её видел ученик» (docs/kabinet-zhurnal.md): раздел
 * собирает её заново по task_ref — те же числа и чертёж — и сверяет
 * отпечаток условия. Не совпал или раздел не умеет собирать — сохранённое
 * условие и картинка из записи.
 */

import type { ZadachaView } from './api';
import { otpechatokUsloviya } from './model';

export interface PokazZadachi {
  /** Условие готовым HTML (KaTeX уже набран) или текстом. */
  uslovieHtml: string | null;
  /** Путь картинки сайта. */
  risunok: string | null;
  /** Верный ответ, если раздел его знает. */
  otvet: string | null;
  /** Показано по записи: генератор изменился. */
  poZapisi: boolean;
}

function izZapisi(z: ZadachaView, poZapisi: boolean): PokazZadachi {
  return {
    uslovieHtml: z.uslovie_tex ?? null,
    risunok: z.risunok ?? null,
    otvet: z.answer_key ?? null,
    poZapisi,
  };
}

export async function pokazatZadachu(z: ZadachaView): Promise<PokazZadachi> {
  if (z.task_no === 8 && z.place !== 'opornye' && z.place !== 'variant') {
    const [{ sobrat8 }, { taskById }] = await Promise.all([
      import('@/lib/vychisleniya/zhurnal8'),
      import('@/lib/vychisleniya/session'),
    ]);
    const s = sobrat8(z.task_ref);
    const task = taskById(z.task_ref);
    if (s === null || task === null) return izZapisi(z, true);
    if (z.gen_hash !== undefined && otpechatokUsloviya(s.uslovie) !== z.gen_hash) return izZapisi(z, true);
    return { uslovieHtml: task.questionHtml, risunok: null, otvet: s.otvet, poZapisi: false };
  }
  /* №5 — задачи банка: условие и картинка сохранены в записи при решении. */
  return izZapisi(z, false);
}
