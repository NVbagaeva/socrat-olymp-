/**
 * Разобранный пример типа №9 для карты задания: та же задача, что была
 * примером прежней «О задании» (seed опорной задачи прототипа,
 * opornayaSeed — она же на листе учителя). Условие, чертёж и разбор —
 * из генератора, без правок. Модуль работает и на сборке (первый
 * раскрытый пример), и в браузере (остальные — по раскрытию карточки).
 *
 * Чертёж — в нескольких видах: условие (без построений), построения
 * подсказки по шагам и все построения (как на листе учителя). Пример
 * показывает их по выбору ученика рядом с шагами решения.
 */

import { generate, opornayaSeed } from '@/lib/proizvodnaya/generate';
import { renderFigura } from '@/lib/proizvodnaya/render';
import { typeset } from '@/lib/tex';
import type { Shag } from '../steklo';
import { otvet9, shagiIz9 } from './shagi9';

/** Вид чертежа: подпись кнопки и готовый SVG движка. */
export interface VidChertezha9 {
  /** 'uslovie' — без построений, 'shag' — построения подсказки до шага k, 'vse' — все построения. */
  vid: 'uslovie' | 'shag' | 'vse';
  /** Номер шага построений (у вида 'shag'). */
  k?: number;
  svg: string;
}

export interface Primer9Dannye {
  uslovieHtml: string;
  /** Виды чертежа; пусто — задача без рисунка (одна колонка). */
  chertezhi: VidChertezha9[];
  shagi: Shag[];
  otvet: string;
}

export function primer9(prototip: string): Primer9Dannye {
  const task = generate(prototip, opornayaSeed(prototip));
  const fig = task.risunok;
  const chertezhi: VidChertezha9[] = [];
  if (fig !== null) {
    chertezhi.push({ vid: 'uslovie', svg: renderFigura(fig, { rezhim: 'student' }) });
    /* Промежуточные построения: шаги, с которых появляются элементы. */
    const shagi = [...new Set((fig.pomoshch ?? []).map((p) => p.shag ?? 0))]
      .filter((k) => k > 0)
      .sort((a, b) => a - b);
    for (const k of shagi.slice(0, -1)) {
      chertezhi.push({ vid: 'shag', k, svg: renderFigura(fig, { rezhim: 'hint', shag: k }) });
    }
    chertezhi.push({ vid: 'vse', svg: renderFigura(fig, { rezhim: 'teacher' }) });
  }
  return {
    uslovieHtml: typeset(task.uslovie),
    chertezhi,
    shagi: shagiIz9(task.shagi, { bezOtveta: true }),
    otvet: otvet9(task.shagi),
  };
}
