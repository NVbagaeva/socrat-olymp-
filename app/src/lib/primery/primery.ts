/**
 * Примеры задач для статического блока тренажёра и генератора
 * (components/seo/BlokRazdela.tsx). Сам выбор делает на сборке
 * scripts/build-primery.mjs — здесь только чтение готового файла.
 */

import dannye from '@/data/primery.json';

/** Пример задачи: условие и рисунок — то, что видно на странице. Ответа нет. */
export interface PrimerZadachi {
  /** Подтип (подпись фильтра «Собрать вариант»). */
  podtip: string;
  /** Условие: готовая вёрстка, формулы набраны KaTeX. */
  uslovieHtml: string;
  /** Рисунок условия (SVG), если он есть. */
  risunok: { svg: string; below: boolean } | null;
}

const D = dannye as {
  zadaniya: Record<string, PrimerZadachi[]>;
  podrazdely12: Record<string, PrimerZadachi[]>;
};

/** Примеры задания 1–13; у заданий второй части примеров нет. */
export function primeryZadaniya(no: number, skolko = 3): PrimerZadachi[] {
  return (D.zadaniya[String(no)] ?? []).slice(0, skolko);
}

/** Примеры подраздела №12 (тип функции: linear, quadratic…). */
export function primery12(tip: string): PrimerZadachi[] {
  return D.podrazdely12[tip] ?? [];
}
