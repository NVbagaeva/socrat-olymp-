/**
 * Шаблоны раздела «Ежемесячные варианты» для задания №9 по графику
 * самой функции f: число её нулей и число точек минимума. Тот же движок,
 * что у шаблонов вариантов повышенной сложности (povyshennye.ts): кривая
 * по целым узлам, вспомогательные построения по шагам, сборка с
 * проверкой рисунка и независимым пересчётом ответа (`sobrat` →
 * `reshit`). В банк, тренажёр и генератор №9 не входит.
 */

import { rngOf } from '../vychisleniya/rng';
import { ekstremumyUzlov } from './chtenie';
import { figura } from './krivye';
import { chislaOtvet } from './otvet';
import { xRavno } from './prototypes/chtenie-pom';
import { NE_IZ_BANKA, shag, sobrat, vopros } from './prototypes/common';
import { postroit } from './spline';
import { d, interval, otrezok } from './tex';
import type { Figura, Generated, Pomoshch, Uzel } from './types';

export interface PoGrafikuF {
  /** Узлы кривой f: [x, y], x по возрастанию, концы — границы промежутка. */
  uzly: [number, number][];
}

const tochek = (n: number) =>
  n % 10 === 1 && n % 100 !== 11
    ? 'точка'
    : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
      ? 'точки'
      : 'точек';

/** Нули кривой между узлами: смена знака у соседних узлов (узлов с y = 0 нет). */
function nuliMezhduUzlami(uzly: readonly Uzel[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < uzly.length - 1; i += 1) {
    const u0 = uzly[i]!;
    const u1 = uzly[i + 1]!;
    if (u0.y * u1.y < 0) out.push([u0.x, u1.x]);
  }
  return out;
}

/**
 * Число точек, в которых f(x) = 0, по графику f (как 8.x 2026 года).
 * Подвох — считать «горки» и «ямки» вместо пересечений с осью: у
 * рисунка вершин на одну больше, чем нулей.
 */
export function nuliFunkcii(par: PoGrafikuF): Generated | null {
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  if (uzly.some((u) => u.y === 0)) return null;
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const pary = nuliMezhduUzlami(uzly);
  const ans = pary.length;
  const exs = ekstremumyUzlov(uzly);
  if (ans < 2 || exs.length === ans) return null;
  const fig: Figura = figura('f', 'f(x)', uzly, {
    pomoshch: [{ t: 'goriz', y: 0, shag: 1 }],
  });
  const kod = `ev9nf|${par.uzly.join(';')}`;
  const r = rngOf(kod);
  const draft = sobrat(fig, { t: 'chislo-nuley-funkcii' }, ans, {
    uslovie: `На рисунке изображён график функции $y=f(x)$, определённой на интервале $${interval(a, b)}$. Найдите количество точек, в которых $f(x)=0$.`,
    shagi: [
      shag(
        'Что такое $f(x)=0$ на графике',
        'Значение функции — ордината точки графика. $f(x)=0$ там, где график пересекает ось $Ox$ (или касается её).',
      ),
      shag(
        'Считаем пересечения',
        ...pary.map(
          ([x0, x1], i) =>
            `${i + 1}) между $x=${d(x0)}$ и $x=${d(x1)}$ график переходит ${uzly.find((u) => u.x === x0)!.y > 0 ? 'сверху вниз' : 'снизу вверх'} через ось.`,
        ),
        `Всего $${ans}$ ${tochek(ans)}. Вершины «горок» и «ямок» (их $${exs.length}$) здесь ни при чём: в них нулю равна производная, а не сама функция.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(r, 'Где на графике $f(x)=0$?', 'Где график пересекает ось $Ox$', [
        { tekst: 'В вершинах «горок» и «ямок»', pochemu: "Там $f'(x)=0$, а не $f(x)$." },
        { tekst: 'Где график пересекает ось $Oy$', pochemu: 'Это значение $f(0)$, одна точка.' },
      ]),
      vopros(r, 'Сколько раз график пересекает ось $Ox$?', `$${ans}$`, [
        { tekst: `$${exs.length}$`, pochemu: 'Это число вершин графика.' },
        { tekst: `$${ans - 1}$`, pochemu: 'Пропущено одно пересечение.' },
      ]),
    ],
    params: { a, b, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : { ...draft, prototype: 'EV9-NULI-F', seed: 'fixed', istochnik: NE_IZ_BANKA };
}

/**
 * Число точек минимума по графику f на отрезке (как 8.x 2026 года).
 * Подвох — посчитать конец отрезка, где значение наименьшее рядом, или
 * точки, где график пересекает ось.
 */
export function chisloMinF(par: PoGrafikuF): Generated | null {
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const exs = ekstremumyUzlov(uzly);
  const mins = exs.filter((e) => e.tip === 'min');
  const maxs = exs.filter((e) => e.tip === 'max');
  const ans = mins.length;
  if (ans < 2 || maxs.length < 1) return null;
  /* Конец отрезка, у которого функция убывает к нему, — ловушка «минимум на краю». */
  const spl = postroit(uzly);
  const kraj = [a, b].filter((x) => (x === a ? spl.dy(a + 0.01) > 0 : spl.dy(b - 0.01) < 0));
  const fig: Figura = figura('f', 'f(x)', uzly, {
    levyy: 'closed',
    pravyy: 'closed',
    pomoshch: mins.map((e): Pomoshch => ({ t: 'vert', x: e.x, shag: 1 })),
  });
  const kod = `ev9mf|${par.uzly.join(';')}`;
  const r = rngOf(kod);
  const draft = sobrat(fig, { t: 'chislo-min-f' }, ans, {
    uslovie: `На рисунке изображён график функции $y=f(x)$, определённой на отрезке $${otrezok(a, b)}$. Найдите количество точек минимума функции $f(x)$ на этом отрезке.`,
    shagi: [
      shag(
        'Что такое точка минимума',
        'Точка минимума — внутренняя точка, где убывание сменяется возрастанием: на графике это дно «ямки». Концы отрезка точками минимума не считаются.',
      ),
      shag(
        'Находим «ямки»',
        `Дно «ямки» — в точках ${xRavno(mins.map((e) => e.x))}.`,
        `Вершины «горок» ${xRavno(maxs.map((e) => e.x))} — точки максимума, не считаем.`,
        ...(kraj.length === 0 ? [] : [`${xRavno(kraj)} — конец отрезка, это не точка минимума.`]),
        `Итого $${ans}$ ${tochek(ans)} минимума.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(r, 'Как выглядит точка минимума на графике функции?', 'Дно «ямки»', [
        { tekst: 'Вершина «горки»', pochemu: 'Это точка максимума.' },
        { tekst: 'Пересечение с осью $Ox$', pochemu: 'Там $f(x)=0$, а не минимум.' },
      ]),
      vopros(r, 'Сколько «ямок» у графика внутри отрезка?', `$${ans}$`, [
        { tekst: `$${exs.length}$`, pochemu: 'Посчитаны и «горки».' },
        ...(kraj.length > 0
          ? [{ tekst: `$${ans + kraj.length}$`, pochemu: 'Конец отрезка — не точка минимума.' }]
          : [{ tekst: `$${maxs.length}$`, pochemu: 'Это число «горок».' }]),
      ]),
    ],
    params: { a, b, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : { ...draft, prototype: 'EV9-MIN-F', seed: 'fixed', istochnik: NE_IZ_BANKA };
}
