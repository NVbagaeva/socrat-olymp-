/** Блок P9-1 · Угловой коэффициент по двум узлам. */

import type { Rng } from '../../veroyatnost/generator';
import { drobSSokrascheniem, nod } from '../prototypes/naklon';
import { shag } from '../prototypes/common';
import type { Figura, Tochka } from '../types';
import { figPryamaya, micro, qChislo, razborIz, sk, vopros, d } from './pomoshniki';
import type { PrepGenerated, PrepMicro } from './types';

interface Para {
  A: Tochka;
  B: Tochka;
  k: number;
}

/** Два узла на прямой с наклоном k: целые координаты в пределах окна. */
export function para(r: Rng, ks: number[], dxMin = 3, dxMax = 8): Para | null {
  const k = r.pick(ks);
  const dx = r.int(dxMin, dxMax);
  const dy = k * dx;
  if (!Number.isInteger(dy) || Math.abs(dy) > 8) {
    return null;
  }
  const x0 = r.int(-7, 7 - dx);
  const lo = Math.max(-6, -6 - Math.min(dy, 0));
  const hi = Math.min(6, 6 - Math.max(dy, 0));
  if (lo > hi) {
    return null;
  }
  const y0 = r.int(lo, hi);
  return { A: [x0, y0], B: [x0 + dx, y0 + dy], k };
}

/** Разбор по двум узлам: этапы с подписями. */
export function shagiK(A: Tochka, B: Tochka) {
  const dx = B[0] - A[0];
  const rawDy = B[1] - A[1];
  const dy = Math.abs(rawDy);
  const k = rawDy / dx;
  if (rawDy === 0) {
    return [
      shag('Выбираем два узла', `Узлы $A(${A[0]};\\ ${A[1]})$ и $B(${B[0]};\\ ${B[1]})$ лежат на одной высоте.`),
      shag('Считаем', 'Прямая горизонтальна, $\\Delta y=0$, поэтому $\\operatorname{tg}\\alpha=\\dfrac{0}{' + dx + '}=0$.'),
    ];
  }
  const vozr = rawDy > 0;
  return [
    shag('Выбираем два узла', `Берём узлы сетки на прямой: $A(${A[0]};\\ ${A[1]})$ и $B(${B[0]};\\ ${B[1]})$ — чем дальше друг от друга, тем меньше ошибка.`),
    shag(
      'Катеты',
      `По горизонтали $\\Delta x=${dx}$ клеток, по вертикали $\\Delta y=${dy}$ клеток.`,
      vozr
        ? 'Прямая идёт вверх: угол $\\alpha$ острый, $\\operatorname{tg}\\alpha>0$.'
        : 'Прямая идёт вниз: угол $\\alpha$ тупой, считаем через смежный острый угол: $\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)$.',
    ),
    shag(
      'Считаем',
      vozr ? `$k=\\dfrac{${dy}}{${dx}}$` : `$k=-\\dfrac{${dy}}{${dx}}$`,
      ...drobSSokrascheniem(dy, dx).map((s) => (vozr ? s : s.replace(/^\$\\dfrac/, '$-\\dfrac'))),
      `$k=${d(k)}$`,
    ),
  ];
}

/** Лесенка: вверх или вниз; катеты; значение. */
export function lestnicaK(r: Rng, A: Tochka, B: Tochka): ReturnType<typeof vopros>[] {
  const dx = B[0] - A[0];
  const rawDy = B[1] - A[1];
  const dy = Math.abs(rawDy);
  const k = rawDy / dx;
  const out = [
    vopros(
      r,
      'Куда идёт прямая слева направо?',
      rawDy > 0 ? 'Вверх: $k>0$' : rawDy < 0 ? 'Вниз: $k<0$' : 'Горизонтально: $k=0$',
      [
        { tekst: rawDy > 0 ? 'Вниз: $k<0$' : 'Вверх: $k>0$', pochemu: rawDy > 0 ? 'Правая точка выше левой, значит прямая поднимается.' : 'Правая точка ниже левой, значит прямая опускается.' },
        { tekst: rawDy === 0 ? 'Вверх: $k>0$' : 'Горизонтально: $k=0$', pochemu: rawDy === 0 ? 'Обе точки на одной высоте: прямая не поднимается.' : 'Узлы на разной высоте, прямая наклонена.' },
      ],
      rawDy > 0 ? '$k>0$.' : rawDy < 0 ? '$k<0$.' : '$k=0$.',
    ),
  ];
  if (rawDy !== 0) {
    out.push(
      vopros(
        r,
        `Чему равны катеты треугольника на узлах $(${A[0]};\\ ${A[1]})$ и $(${B[0]};\\ ${B[1]})$?`,
        `$\\Delta x=${dx}$, $\\Delta y=${dy}$`,
        [
          { tekst: `$\\Delta x=${dy}$, $\\Delta y=${dx}$`, pochemu: 'Катеты поменяны местами: $\\Delta x$ — по горизонтали, $\\Delta y$ — по вертикали.' },
          { tekst: `$\\Delta x=${dx + 1}$, $\\Delta y=${dy}$`, pochemu: 'Горизонтальный катет посчитан с лишней клеткой.' },
          { tekst: `$\\Delta x=${dx}$, $\\Delta y=${dy + 1}$`, pochemu: 'Вертикальный катет посчитан с лишней клеткой.' },
        ],
        `Катеты: ${dx} и ${dy}.`,
        2,
      ),
      qChislo(
        r,
        'Чему равен угловой коэффициент?',
        k,
        [
          { v: -k, w: 'Знак перепутан: проверьте, поднимается прямая или опускается.' },
          { v: dx / rawDy, w: 'Катеты поделены наоборот: нужно $\\Delta y:\\Delta x$.' },
          { v: (dy + 1) / dx * Math.sign(k), w: 'Вертикальный катет сосчитан с ошибкой на клетку.' },
        ],
        `$k=${d(k)}$.`,
        2,
      ),
    );
  }
  if (rawDy === 0) {
    out.push(
      qChislo(
        r,
        `На сколько клеток отличаются высоты узлов $(${A[0]};\\ ${A[1]})$ и $(${B[0]};\\ ${B[1]})$?`,
        0,
        [
          { v: dx, w: 'Это расстояние по горизонтали, а нужна разность высот.' },
          { v: 1, w: 'Узлы стоят на одной высоте: разность ординат равна нулю.' },
        ],
        '$\\Delta y=0$.',
        2,
      ),
      qChislo(
        r,
        'Чему равен угловой коэффициент?',
        0,
        [
          { v: 1, w: 'Угол $45^\\circ$ дал бы $k=1$, а горизонтальная прямая идёт под углом $0^\\circ$.' },
          { v: dx, w: 'Горизонтальный катет — не угловой коэффициент: $k=\\Delta y:\\Delta x$.' },
        ],
        '$k=0:' + dx + '=0$.',
        2,
      ),
    );
  }
  return out;
}

/** Сборка задачи по рисунку. */
function poRisunku(r: Rng, ks: number[], condition: string[], dx: [number, number] = [3, 8]): PrepGenerated | null {
  const p = para(r, ks, dx[0], dx[1]);
  if (p === null) {
    return null;
  }
  const fig: Figura | null = figPryamaya(p.A, p.B, [{ t: 'treugolnik', shag: 2 }]);
  if (fig === null) {
    return null;
  }
  const u = fig.uzly;
  const proverka = ((u[1] as { y: number }).y - (u[0] as { y: number }).y) / ((u[1] as { x: number }).x - (u[0] as { x: number }).x);
  return {
    uslovie: r.pick(condition),
    risunok: fig,
    otvet: p.k,
    proverka,
    razbor: razborIz([...shagiK(p.A, p.B), shag('Ответ', `$k=${d(p.k)}$`)]),
    podskazka: lestnicaK(r, p.A, p.B),
    params: { ax: p.A[0], ay: p.A[1], bx: p.B[0], by: p.B[1] },
  };
}

const USL = [
  'На рисунке изображена прямая. Найдите её угловой коэффициент.',
  'Найдите угловой коэффициент прямой, изображённой на рисунке.',
  'Прямая проходит через две отмеченные узловые точки. Найдите её угловой коэффициент.',
];
const USL_TG = [
  'На рисунке изображена прямая. Найдите тангенс угла $\\alpha$ между этой прямой и положительным направлением оси $Ox$.',
  'Найдите $\\operatorname{tg}\\alpha$, где $\\alpha$ — угол наклона прямой, изображённой на рисунке.',
];

export const BLOCK_1: PrepMicro[] = [
  micro('P9-1-01', 'Возрастающая прямая, целый коэффициент', 'number', (r) => poRisunku(r, [1, 2, 3], USL, [2, 5])),
  micro('P9-1-02', 'Возрастающая прямая, пологая', 'number', (r) => poRisunku(r, [0.5, 0.25, 0.75], USL, [4, 8])),
  micro('P9-1-03', 'Возрастающая прямая, крутая', 'number', (r) => poRisunku(r, [1.5, 2.5, 3.5, 1.25], USL, [2, 4])),
  micro('P9-1-04', 'Убывающая прямая, целый коэффициент', 'number', (r) => poRisunku(r, [-1, -2, -3], USL, [2, 5])),
  micro('P9-1-05', 'Убывающая прямая, дробный коэффициент', 'number', (r) => poRisunku(r, [-0.5, -0.25, -0.75, -1.5], USL, [4, 8])),
  micro('P9-1-06', 'Тангенс тупого угла наклона', 'number', (r) => poRisunku(r, [-0.5, -1, -2, -1.5, -0.75, -0.25], USL_TG, [4, 8])),
  micro('P9-1-07', 'Любая прямая, в том числе горизонтальная', 'number', (r) => {
    const ks = r.next() < 0.4 ? [0] : [1, -1, 2, -2, 0.5, -0.5];
    return poRisunku(r, ks, USL, [4, 8]);
  }),
  micro('P9-1-08', 'Прямая через две точки с координатами', 'number', (r) => {
    const k = r.pick([1, -1, 2, -2, 3, -3, 0.5, -0.5, 1.5, -1.5, 0.25, -0.25, 0.75, -0.75]);
    const dx = r.int(2, 8);
    if (!Number.isInteger(k * dx)) {
      return null;
    }
    const A: Tochka = [r.int(-9, 0), r.int(-9, 9)];
    const B: Tochka = [A[0] + dx, A[1] + k * dx];
    const g = nod(B[1] - A[1], dx);
    return {
      uslovie: `Прямая проходит через точки $A(${d(A[0])};\\ ${d(A[1])})$ и $B(${d(B[0])};\\ ${d(B[1])})$. Найдите её угловой коэффициент.`,
      risunok: null,
      otvet: k,
      proverka: (B[1] - A[1]) / (B[0] - A[0]),
      razbor: razborIz([
        shag('Формула', 'Угловой коэффициент равен отношению приращений: $k=\\dfrac{y_B-y_A}{x_B-x_A}$.'),
        shag(
          'Приращения',
          `$y_B-y_A=${sk(B[1])}-${sk(A[1])}=${d(B[1] - A[1])}$, $x_B-x_A=${sk(B[0])}-${sk(A[0])}=${dx}$.`,
        ),
        shag('Считаем', `$k=\\dfrac{${d(B[1] - A[1])}}{${dx}}=${d(k)}$${g > 1 ? `, сократили на $${g}$` : ''}.`),
        shag('Ответ', `$k=${d(k)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Как найти угловой коэффициент по двум точкам?',
          'Разделить разность ординат на разность абсцисс',
          [
            { tekst: 'Разделить разность абсцисс на разность ординат', pochemu: 'Дробь перевёрнута: $k=\\Delta y:\\Delta x$.' },
            { tekst: 'Сложить координаты точек', pochemu: 'Сумма координат наклон не определяет.' },
          ],
          '$k=\\dfrac{y_B-y_A}{x_B-x_A}$.',
        ),
        qChislo(
          r,
          'Чему равна разность ординат $y_B-y_A$?',
          B[1] - A[1],
          [
            { v: A[1] - B[1], w: 'Вычитать надо из ординаты $B$ ординату $A$, а не наоборот.' },
            { v: B[1] + A[1], w: 'Ординаты нужно вычитать, а не складывать.' },
          ],
          `$y_B-y_A=${d(B[1] - A[1])}$.`,
        ),
        qChislo(
          r,
          'Чему равен угловой коэффициент?',
          k,
          [
            { v: -k, w: 'Знак перепутан: порядок вычитания в числителе и знаменателе должен быть одинаковым.' },
            { v: dx / (B[1] - A[1]), w: 'Дробь перевёрнута.' },
          ],
          `$k=${d(k)}$.`,
        ),
      ],
      params: { ax: A[0], ay: A[1], bx: B[0], by: B[1] },
    };
  }),
  micro('P9-1-09', 'Катеты треугольника даны словами', 'number', (r) => {
    const q = r.pick([2, 4, 5, 8]);
    const p = r.int(1, 12);
    if (nod(p, q) !== 1 && r.next() < 0.5) {
      return null;
    }
    const vozr = r.next() < 0.5;
    const k = (vozr ? 1 : -1) * (p / q);
    return {
      uslovie: `Прямая образует с положительным направлением оси $Ox$ угол $\\alpha$ и ${vozr ? 'идёт вверх' : 'идёт вниз'} слева направо. Прямоугольный треугольник, гипотенуза которого лежит на этой прямой, а катеты параллельны осям, имеет горизонтальный катет ${q} и вертикальный катет ${p}. Найдите $\\operatorname{tg}\\alpha$.`,
      risunok: null,
      otvet: k,
      proverka: (vozr ? 1 : -1) * (p / q),
      razbor: razborIz([
        shag('Катеты', `По горизонтали $\\Delta x=${q}$, по вертикали $\\Delta y=${p}$.`),
        shag(
          'Знак',
          vozr ? 'Прямая идёт вверх: угол острый, тангенс положителен.' : 'Прямая идёт вниз: угол тупой, $\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)$, тангенс отрицателен.',
        ),
        shag('Считаем', `$\\operatorname{tg}\\alpha=${vozr ? '' : '-'}\\dfrac{${p}}{${q}}=${d(k)}$`),
        shag('Ответ', `$${d(k)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Что показывает отношение вертикального катета к горизонтальному?',
          'Тангенс острого угла треугольника, лежащего при горизонтальном катете',
          [
            { tekst: 'Синус угла', pochemu: 'Синус — отношение катета к гипотенузе, а гипотенуза здесь не дана.' },
            { tekst: 'Косинус угла', pochemu: 'Косинус — отношение прилежащего катета к гипотенузе.' },
          ],
          'Тангенс острого угла: противолежащий катет делим на прилежащий.',
        ),
        vopros(
          r,
          'Какой знак у $\\operatorname{tg}\\alpha$?',
          vozr ? 'Плюс: прямая идёт вверх' : 'Минус: прямая идёт вниз, угол тупой',
          [
            {
              tekst: vozr ? 'Минус' : 'Плюс',
              pochemu: vozr ? 'Прямая поднимается, угол острый, тангенс положителен.' : 'Прямая опускается, угол тупой, тангенс тупого угла отрицателен.',
            },
          ],
          vozr ? '$k>0$.' : '$k<0$.',
        ),
        qChislo(
          r,
          'Чему равен $\\operatorname{tg}\\alpha$?',
          k,
          [
            { v: -k, w: 'Знак не тот: смотрите, возрастает прямая или убывает.' },
            { v: (vozr ? 1 : -1) * (q / p), w: 'Катеты поделены наоборот.' },
          ],
          `$\\operatorname{tg}\\alpha=${d(k)}$.`,
        ),
      ],
      params: { p, q, vozr: vozr ? 1 : 0 },
    };
  }),
  micro('P9-1-10', 'Прямая через точку на оси ординат', 'number', (r) => {
    const k = r.pick([1, -1, 2, -2, 3, -3, 0.5, -0.5, 1.5, -1.5, 0.25, -0.25]);
    const x1 = r.pick([2, 4, 6, 8, -2, -4, -6]);
    const m = r.int(-8, 8);
    const y1 = m + k * x1;
    if (!Number.isInteger(y1) || x1 === 0) {
      return null;
    }
    return {
      uslovie: `Прямая пересекает ось ординат в точке $(0;\\ ${d(m)})$ и проходит через точку $B(${d(x1)};\\ ${d(y1)})$. Найдите её угловой коэффициент.`,
      risunok: null,
      otvet: k,
      proverka: (y1 - m) / (x1 - 0),
      razbor: razborIz([
        shag('Две точки', `Известны точки $A(0;\\ ${d(m)})$ и $B(${d(x1)};\\ ${d(y1)})$.`),
        shag('Приращения', `$\\Delta y=${sk(y1)}-${sk(m)}=${d(y1 - m)}$, $\\Delta x=${sk(x1)}-0=${d(x1)}$.`),
        shag('Считаем', `$k=\\dfrac{${d(y1 - m)}}{${d(x1)}}=${d(k)}$`),
        shag('Ответ', `$${d(k)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Какие две точки прямой известны?',
          `$(0;\\ ${d(m)})$ и $(${d(x1)};\\ ${d(y1)})$`,
          [
            { tekst: `$(${d(m)};\\ 0)$ и $(${d(x1)};\\ ${d(y1)})$`, pochemu: 'На оси ординат абсцисса равна нулю: точка имеет вид $(0;\\ m)$.' },
            { tekst: `$(0;\\ ${d(y1)})$ и $(${d(x1)};\\ ${d(m)})$`, pochemu: 'Ординаты переставлены между точками.' },
          ],
          'Две точки найдены.',
        ),
        qChislo(
          r,
          'Чему равны приращения: найдите $\\Delta y$.',
          y1 - m,
          [
            { v: m - y1, w: 'Вычитать нужно из второй ординаты первую.' },
            { v: y1, w: 'Ордината точки на оси $Oy$ не равна нулю, её тоже надо вычесть.' },
          ],
          `$\\Delta y=${d(y1 - m)}$.`,
        ),
        qChislo(
          r,
          'Чему равен угловой коэффициент?',
          k,
          [
            { v: -k, w: 'Знак потерян при вычитании.' },
            { v: x1 / (y1 - m), w: 'Дробь перевёрнута.' },
          ],
          `$k=${d(k)}$.`,
        ),
      ],
      params: { m, x1, y1 },
    };
  }),
];
