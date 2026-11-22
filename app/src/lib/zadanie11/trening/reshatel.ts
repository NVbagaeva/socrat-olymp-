/**
 * Решатель тренажёра №11 в браузере: функция подтипа по параметрам и
 * готовый к показу разбор — этапы (строки с пропорциями и краткой
 * записью, как в прежнем тренажёре), таблицы модели, подсказки-вопросы.
 * Модуль тяжёлый (движок всех подтипов и KaTeX): тренажёр и «О задании»
 * загружают его отдельным куском, когда нужна первая задача.
 */

import { typesetKrupno as typeset } from '../../tex';
import { strokaHtml } from '../proporciya/html';
import { subtype } from '../prototypes';
import type { Params, Solved, Tablitsa } from '../types';

export interface EtapHtml {
  /** Название этапа без «Шаг N.», текстом и набранное. */
  zag: string;
  zagHtml: string;
  /** Строки этапа: готовый HTML. */
  stroki: string[];
}

export interface VoprosHtml {
  vopros: string;
  varianty: string[];
  verno: number;
  kommentariy?: string;
}

/** Разбор задачи №11: всё содержание — дословно из функции подтипа. */
export interface Razbor11 {
  answer: number;
  /** Номер верного варианта с единицы (РЗ-17); нет — ответ числом. */
  vybor?: number;
  etapy: EtapHtml[];
  tables: Tablitsa[];
  voprosy: VoprosHtml[];
}

/** «Шаг 3. Уравнение» → «Уравнение»: номер ставит сам список шагов. */
export function nazvanieEtapa11(title: string): string {
  return title.replace(/^Шаг \d+\.\s*/, '');
}

export function razobrat11(s: Solved): Razbor11 {
  return {
    answer: s.answer,
    ...(s.vybor === undefined ? {} : { vybor: s.vybor.correct + 1 }),
    etapy: s.etapy.map((e) => {
      const zag = nazvanieEtapa11(e.title);
      return {
        zag,
        zagHtml: typeset(zag),
        stroki: e.lines.map((line) => strokaHtml(line, { typeset })),
      };
    }),
    tables: s.tables ?? [],
    voprosy: s.hints.map((h) => ({
      vopros: typeset(h.question),
      varianty: h.options.map((o) => typeset(o)),
      verno: h.correct,
      ...(h.comment === undefined || h.comment === '' ? {} : { kommentariy: typeset(h.comment) }),
    })),
  };
}

/** Подтип для общего загрузчика: solve(params) → готовый разбор. */
export function prototip11(id: string): { solve(params: Params): Razbor11 } {
  const st = subtype(id);
  return { solve: (params) => razobrat11(st.solve(params)) };
}

export { typeset as nabor11 };
