/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №9.
 *
 * Тот же движок, что у прототипов группы IV: волна f′ по целым узлам
 * (`figura`, сплайн из spline.ts), вспомогательные построения по шагам,
 * сборка с проверкой рисунка и независимым пересчётом ответа
 * (`sobrat` → `reshit`). Узлы задаёт вариант, а не генератор. В банк,
 * тренажёр и генератор №9 не входит.
 */

import { rngOf } from '../vychisleniya/rng';
import { nuliUzlov } from './chtenie';
import { figura } from './krivye';
import { chislaOtvet } from './otvet';
import { promezhutki, xRavno, znakiPomoshch } from './prototypes/chtenie-pom';
import { NE_IZ_BANKA, shag, sobrat, vopros } from './prototypes/common';
import { znakZnacheniya } from './chtenie';
import { d, otrezok } from './tex';
import type { Figura, Generated, Pomoshch, Uzel } from './types';
import { grafikP } from './uslovie';

const MINUS_PLUS = 'с $-$ на $+$';
const PLUS_MINUS = 'с $+$ на $-$';

export interface MaxNaOtrezke {
  /** Узлы волны f′: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Отрезок вопроса. */
  p: number;
  q: number;
}

/**
 * Точка максимума f на отрезке по графику f′, когда на отрезке есть и
 * точка минимума, а у f′ внутри отрезка — вершина, которая нулём не
 * является. Подвох: выбрать нуль со сменой знака «+ на −», а не любой
 * нуль и не вершину графика f′.
 */
export function maxNaOtrezke(par: MaxNaOtrezke): Generated | null {
  const { p, q } = par;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const nuli = nuliUzlov(uzly).map((z) => ({ x: z.x, tip: z.sleva > 0 ? 'max' : 'min' }));
  const zs = nuli.map((z) => z.x);
  const vnutri = nuli.filter((z) => z.x > p && z.x < q);
  const max = vnutri.filter((z) => z.tip === 'max');
  const min = vnutri.filter((z) => z.tip === 'min');
  if (max.length !== 1 || min.length < 1) return null;
  const ans = max[0]!.x;
  /* Вершина f′ на отрезке, не нуль: ловушка «экстремум производной». */
  const vershiny = uzly.filter((u, i) => {
    const l = uzly[i - 1];
    const r = uzly[i + 1];
    return (
      l !== undefined &&
      r !== undefined &&
      u.y !== 0 &&
      u.x > p &&
      u.x < q &&
      (u.y - l.y) * (u.y - r.y) > 0
    );
  });
  const ps = promezhutki([a, ...zs, b], (m) => znakZnacheniya(uzly, m));
  const fig: Figura = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'otrezok', p, q, shag: 1 },
      ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
      ...znakiPomoshch(ps, 3),
    ],
  });
  const r = rngOf(`pv9|${par.uzly.join(';')}|${p}|${q}`);
  const minX = min.map((z) => z.x);
  const draft = sobrat(fig, { t: 'max-na-otrezke', p, q }, ans, {
    uslovie: `${grafikP(a, b)} В какой точке отрезка $${otrezok(p, q)}$ функция $f(x)$ имеет максимум?`,
    shagi: [
      shag(
        'Что такое точка максимума',
        "В точке максимума функции $f$ производная $f'$ равна нулю и меняет знак с «$+$» на «$-$»: слева функция возрастает, справа убывает. На графике $f'$ — это пересечение оси $Ox$ сверху вниз.",
      ),
      shag(
        'Находим нули производной',
        `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}.`,
        ...nuli.map(
          (z) =>
            `$x=${d(z.x)}$: знак $f'$ меняется ${z.tip === 'max' ? PLUS_MINUS : MINUS_PLUS}, точка ${z.tip === 'max' ? 'максимума' : 'минимума'}.`,
        ),
      ),
      shag(
        'Выбираем точку на отрезке',
        `На отрезке $${otrezok(p, q)}$ лежат нули ${xRavno(vnutri.map((z) => z.x))}.`,
        `${xRavno(minX)} — точк${minX.length === 1 ? 'а' : 'и'} минимума (знак меняется ${MINUS_PLUS}), ${minX.length === 1 ? 'она' : 'они'} не подходит.`.replace(
          'не подходит',
          minX.length === 1 ? 'не подходит' : 'не подходят',
        ),
        ...(vershiny.length === 0
          ? []
          : [
              `Вершины графика $f'$ (${xRavno(vershiny.map((u) => u.x))}) — не нули производной: там $f'\\ne0$, экстремума функции $f$ нет.`,
            ]),
        `Точка максимума на отрезке одна: $x=${d(ans)}$.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(
        r,
        "Как на графике $f'$ узнать точку максимума функции $f$?",
        "$f'$ пересекает ось $Ox$, меняя знак с «$+$» на «$-$»",
        [
          {
            tekst: "Это наивысшая точка графика $f'$",
            pochemu: "Вершина графика $f'$ — экстремум производной, а не функции $f$.",
          },
          {
            tekst: "$f'$ пересекает ось $Ox$, меняя знак с «$-$» на «$+$»",
            pochemu: 'Так выглядит точка минимума: функция сначала убывает, потом возрастает.',
          },
        ],
        "Слева от точки максимума $f$ возрастает ($f'>0$), справа убывает ($f'<0$).",
      ),
      vopros(
        r,
        `Какие нули $f'$ лежат на отрезке $${otrezok(p, q)}$?`,
        xRavno(vnutri.map((z) => z.x)),
        [
          {
            tekst: xRavno([ans]),
            pochemu: 'На отрезке есть и другие нули — посмотрите на весь отрезок.',
          },
          {
            tekst: xRavno(zs),
            pochemu: 'Часть этих нулей лежит вне отрезка.',
          },
        ],
        undefined,
        2,
      ),
      vopros(
        r,
        'Какой из них — точка максимума?',
        `$x=${d(ans)}$`,
        [
          ...minX.slice(0, 1).map((x) => ({
            tekst: `$x=${d(x)}$`,
            pochemu: `Здесь знак $f'$ меняется ${MINUS_PLUS}: это минимум.`,
          })),
          ...vershiny.slice(0, 1).map((u) => ({
            tekst: `$x=${d(u.x)}$`,
            pochemu: "Это вершина графика $f'$, там $f'\\ne0$.",
          })),
        ],
        `Знак меняется ${PLUS_MINUS} только в $x=${d(ans)}$.`,
        3,
      ),
    ],
    params: { a, b, p, q, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: `pv9|${par.uzly.join(';')}|${p}|${q}`,
  });
  return draft === null
    ? null
    : { ...draft, prototype: 'PV9-MAX', seed: 'fixed', istochnik: NE_IZ_BANKA };
}
