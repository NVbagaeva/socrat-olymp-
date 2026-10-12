/**
 * Общие кирпичи опорных задач №9: сборка микрозадачи, вопросы подсказки,
 * выбор из вариантов, рисунки (прямая, ломаная, волны f и f′).
 */

import type { Rng } from '../../veroyatnost/generator';
import { razmerKletki } from '../krivye';
import { risunokChist } from '../render';
import { peremeshat, vopros } from '../prototypes/common';
import type { Nevernyy } from '../prototypes/common';
import { d } from '../tex';
import type { Figura, Okno, Pomoshch, Shag, Tochka, Uzel, Vopros } from '../types';
import type { PrepGenerated, PrepMicro } from './types';

export { peremeshat, vopros, d };

export function micro(
  id: string,
  nazvanie: string,
  answerType: 'number' | 'choice',
  generate: (r: Rng) => PrepGenerated | null,
): PrepMicro {
  return { id, nazvanie, answerType, generate };
}

/** Число в скобках, если оно отрицательное. */
export function sk(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

/** Разбор из этапов: строки «Шаг n. Заголовок. текст». */
export function razborIz(shagi: Shag[]): string[] {
  return shagi.map((s, i) => `Шаг ${i + 1}. ${s.zagolovok}. ${s.stroki.join(' ')}`);
}

export interface Neverno {
  v: number;
  w: string;
}

/** Вопрос подсказки с числовыми вариантами; неверные без повторов и совпадений с верным. */
export function qChislo(
  r: Rng,
  text: string,
  verno: number,
  neverno: Neverno[],
  itog?: string,
  shagNomer?: number,
): Vopros {
  const seen = new Set<string>([d(verno)]);
  const list: Nevernyy[] = [];
  for (const n of neverno) {
    if (Number.isFinite(n.v) && !seen.has(d(n.v))) {
      seen.add(d(n.v));
      list.push({ tekst: `$${d(n.v)}$`, pochemu: n.w });
    }
  }
  for (const v of [verno + 1, verno - 1, -verno, verno * 2, verno + 2]) {
    if (list.length >= 2) {
      break;
    }
    if (!seen.has(d(v))) {
      seen.add(d(v));
      list.push({
        tekst: `$${d(v)}$`,
        pochemu: 'Вычислительная ошибка: пересчитайте этот шаг ещё раз.',
      });
    }
  }
  return vopros(r, text, `$${d(verno)}$`, list.slice(0, 3), itog, shagNomer);
}

/** Выбор из вариантов-строк: порядок по seed, otvet — индекс верного. */
export function vybor(
  r: Rng,
  verno: string,
  neverno: string[],
): { knopki: string[]; otvet: number } {
  const all = peremeshat(r, [verno, ...neverno]);
  return { knopki: all, otvet: all.indexOf(verno) };
}

export function okoshko(xs: [number, number], ys: [number, number], pole = 1): Okno {
  return {
    xmin: Math.min(Math.floor(xs[0]) - pole, -1),
    xmax: Math.max(Math.ceil(xs[1]) + pole, 1),
    ymin: Math.min(Math.floor(ys[0]) - pole, -1),
    ymax: Math.max(Math.ceil(ys[1]) + pole, 1),
  };
}

function bazovaya(
  rezhim: Figura['rezhim'],
  podpis: string,
  uzly: Uzel[],
  okno: Okno,
  extra: Partial<Figura>,
): Figura {
  return {
    rezhim,
    okno,
    podpis,
    uzly,
    levyy: 'none',
    pravyy: 'none',
    chisla: 'vse',
    chislaY: 'vse',
    cell: razmerKletki(okno),
    ...extra,
  };
}

/** Рисунок «прямая по двум узлам». null — подписи не помещаются. */
export function figPryamaya(A: Tochka, B: Tochka, pom: Pomoshch[] = []): Figura | null {
  const uzly: Uzel[] = [
    { x: A[0], y: A[1] },
    { x: B[0], y: B[1] },
  ];
  const win = okoshko(
    [Math.min(A[0], B[0]), Math.max(A[0], B[0])],
    [Math.min(A[1], B[1]), Math.max(A[1], B[1])],
    1,
  );
  const fig = bazovaya('pryamaya', '', uzly, win, { pomoshch: pom });
  return risunokChist(fig).length === 0 ? fig : null;
}

/** Рисунок «ломаная»: вершины на узлах сетки. */
export function figLomanaya(uzly: Uzel[], pom: Pomoshch[] = []): Figura | null {
  const ys = uzly.map((u) => u.y);
  const win = okoshko(
    [(uzly[0] as Uzel).x, (uzly[uzly.length - 1] as Uzel).x],
    [Math.min(...ys), Math.max(...ys)],
    1,
  );
  const fig = bazovaya('lomanaya', 'f(x)', uzly, win, {
    levyy: 'closed',
    pravyy: 'closed',
    pomoshch: pom,
  });
  return risunokChist(fig).length === 0 ? fig : null;
}

/** Рисунок-кривая (график f или f′) с окном по узлам. */
export function figKrivaya(
  rezhim: 'f' | 'fprime',
  uzly: Uzel[],
  win: Okno,
  extra: Partial<Figura> = {},
): Figura | null {
  const fig = bazovaya(rezhim, rezhim === 'f' ? 'f(x)' : "f'(x)", uzly, win, {
    levyy: 'open',
    pravyy: 'open',
    chislaY: 'minimum',
    ...extra,
  });
  return risunokChist(fig).length === 0 ? fig : null;
}

export function strokaTochek(idx: number[]): string {
  return idx.map((i) => `x_{${i}}`).join(',\\ ');
}
