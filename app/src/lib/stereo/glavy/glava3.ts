/**
 * №3, теория, глава 3 «Многогранники»: куб и параллелепипед, призма,
 * пирамида (куда проецируется вершина, апофема), сечения.
 */

import { box, dir, polygonStart, pyramid, regularPolygon, regularPrism, vertex } from '../../solid/figures';
import type { Model, Polyhedron } from '../../solid/model';
import { dlina, P, ploshchadMnogougolnika, ploshchadPoverhnosti, pri, seredina } from './schet';
import type { GlavaDannye } from './tipy';

function imena(body: Polyhedron) {
  return (n: string) => vertex(body, n);
}

/** Правильная четырёхугольная пирамида SABCD: сторона s, высота h; O — центр. */
function piramida4(s: number, h: number) {
  const body = pyramid(regularPolygon(4, s / Math.SQRT2, 0, polygonStart(4)), P(0, 0, h));
  return { body, v: imena(body), O: P(0, 0, 0) };
}

/** Площадь боковой поверхности: вся поверхность без оснований. */
function bokovaya(body: Polyhedron, osnovaniya: readonly (readonly string[])[]): number {
  const v = imena(body);
  return osnovaniya.reduce(
    (s, names) => s - ploshchadMnogougolnika(names.map(v)),
    ploshchadPoverhnosti(body),
  );
}

/** Ракурс пониже для пирамид, у которых высота меньше основания. */
const NIZKO = { azimuth: 28, elevation: 14 };

export function glava3(): GlavaDannye {
  /* Куб с диагональю 5√3. */
  const k5 = box(5, 5, 5);
  const v5 = imena(k5);
  const [A, C, C1] = [v5('A'), v5('C'), v5('C1')];

  /* Правильная треугольная призма: сторона 6, ребро 5. */
  const pr3 = regularPrism(3, 6 / Math.sqrt(3), 5);
  const w3 = imena(pr3);

  /* Пирамида: сторона 6, высота 4; M — середина AB. */
  const p6 = piramida4(6, 4);
  const M = seredina(p6.v('A'), p6.v('B'));
  const S = p6.v('S');

  /* Ловушка: сторона 4√2, высота 3. */
  const p3 = piramida4(4 * Math.SQRT2, 3);
  const M3 = seredina(p3.v('A'), p3.v('B'));
  const lovPir = (verno: boolean): Model => ({
    alt: verno
      ? 'Правильная пирамида SABCD: высота SO падает в центр основания, треугольник SOA прямоугольный'
      : 'Правильная пирамида SABCD: апофема SM, принятая за высоту, и треугольник SMA',
    bodies: [p3.body],
    rakurs: NIZKO,
    marks: verno ? [{ p: p3.O, label: 'O' }] : [{ p: M3, label: 'M' }],
    lines: verno ? [{ a: p3.v('S'), b: p3.O }, { a: p3.O, b: p3.v('A') }] : [{ a: p3.v('S'), b: M3 }],
    sections: [{ points: verno ? [p3.v('S'), p3.O, p3.v('A')] : [p3.v('S'), M3, p3.v('A')] }],
    ...(verno ? { angles: [{ at: p3.O, u: dir(p3.O, p3.v('A')), v: dir(p3.O, p3.v('S')) }] } : {}),
  });

  /* Сечения: параллелепипед 3 × 4 × 10. */
  const b10 = box(3, 4, 10);
  const u = imena(b10);
  const b5 = box(5, 3, 4);
  const x = imena(b5);
  const k3 = box(3, 3, 3);
  const y = imena(k3);
  const lovSech = (verno: boolean, { alt }: { alt: string }): Model => ({
    alt,
    bodies: [k3],
    sections: [{ points: verno ? ['A', 'B', 'C1', 'D1'].map(y) : ['A', 'B', 'C1'].map(y) }],
  });

  return {
    id: 'mnogogranniki',
    lead: 'Куб, параллелепипед, призма и пирамида: где в каждом из них прямые углы и какой треугольник выносить.',
    razdely: [
      {
        id: 'g3-kub',
        title: 'Куб и прямоугольный параллелепипед',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Диагональ параллелепипеда находится за два шага Пифагора: сначала диагональ основания, потом треугольник с боковым ребром. Оба шага складываются в одну формулу — квадрат диагонали равен сумме квадратов трёх рёбер.',
            ],
          },
          { vid: 'formula', tex: 'd^2 = a^2 + b^2 + c^2' },
          {
            vid: 'primer',
            primer: {
              id: 'g3-kub-diagonal',
              title: 'Объём куба по диагонали',
              uslovie: 'Диагональ куба $ABCDA_1B_1C_1D_1$ равна $5\\sqrt{3}$. Найдите объём куба.',
              model: {
                alt: 'Куб ABCDA₁B₁C₁D₁: диагональ грани AC, ребро CC₁ и диагональ куба AC₁',
                bodies: [k5],
                lines: [
                  { a: A, b: C, shag: 1 },
                  { a: A, b: C1, shag: 2 },
                ],
                sections: [{ points: [A, C, C1], shag: 2 }],
                angles: [{ at: C, u: dir(C, A), v: dir(C, C1), shag: 2 }],
                measures: [{ a: A, b: C1, text: '5√3' }],
              },
              shagiChertezha: [
                'Диагональ грани $AC$ — её длина $a\\sqrt{2}$.',
                'Треугольник $ACC_1$: угол при $C$ прямой, $AC_1$ — гипотенуза.',
              ],
              ploskiy: {
                vershiny: ['C', 'A', 'C1'],
                kateti: [5 * Math.SQRT2, 5],
                podpisi: { a: 'a√2', b: 'a', c: '5√3' },
                iskomoe: 'b',
                alt: 'Прямоугольный треугольник ACC₁: катеты a√2 и a, гипотенуза 5√3; ребро a — искомое',
              },
              shagi: [
                {
                  title: 'Связываем диагональ с ребром',
                  paras: ['Все три ребра куба равны $a$, поэтому диагональ — $a\\sqrt{3}$.'],
                  formuly: ['d^2 = a^2 + a^2 + a^2 = 3a^2,\\quad d = a\\sqrt{3}'],
                },
                {
                  title: 'Находим ребро',
                  paras: ['Сравниваем с условием: $a\\sqrt{3} = 5\\sqrt{3}$.'],
                  formuly: ['a = 5'],
                },
                {
                  title: 'Считаем объём',
                  paras: [],
                  formuly: ['V = a^3 = 5^3 = 125'],
                },
              ],
              otvet: 'Ответ: $125$.',
              chislo: 125,
              pereschet: () => pri([[dlina(A, C1), 5 * Math.sqrt(3)]], dlina(A, v5('B')) ** 3),
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: диагональ куба — ребро, умноженное на $\\sqrt{3}$',
            paras: ['Если ребро уже содержит $\\sqrt{3}$, корни перемножатся в целое число.'],
            zadacha: {
              uslovie: 'Ребро куба равно $2\\sqrt{3}$. Найдите диагональ куба.',
              reshenie: ['Умножаем ребро на $\\sqrt{3}$.'],
              formuly: ['d = 2\\sqrt{3}\\cdot\\sqrt{3} = 2\\cdot 3 = 6'],
              otvet: 'Ответ: $6$.',
              chislo: 6,
              pereschet: () => {
                const k = box(2 * Math.sqrt(3), 2 * Math.sqrt(3), 2 * Math.sqrt(3));
                return dlina(vertex(k, 'A'), vertex(k, 'C1'));
              },
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: диагональ грани — $a\\sqrt{2}$, диагональ куба — $a\\sqrt{3}$',
            paras: ['Грань — квадрат, в её диагонали два ребра; в диагонали куба — три.'],
            zadacha: {
              uslovie: 'Ребро куба равно $3\\sqrt{2}$. Найдите диагональ его грани.',
              reshenie: ['Диагональ грани — диагональ квадрата со стороной $3\\sqrt{2}$.'],
              formuly: ['d_{\\text{гр}} = 3\\sqrt{2}\\cdot\\sqrt{2} = 6'],
              otvet: 'Ответ: $6$.',
              chislo: 6,
              pereschet: () => {
                const k = box(3 * Math.SQRT2, 3 * Math.SQRT2, 3 * Math.SQRT2);
                return dlina(vertex(k, 'A'), vertex(k, 'C'));
              },
            },
          },
        ],
      },
      {
        id: 'g3-prizma',
        title: 'Призма: прямая и правильная',
        bloki: [
          {
            vid: 'opredelenie',
            plashka: 'Прямая призма',
            paras: ['Боковые рёбра перпендикулярны основанию. Боковые грани — прямоугольники, высота равна боковому ребру.'],
          },
          {
            vid: 'opredelenie',
            plashka: 'Правильная призма',
            paras: ['Прямая призма, в основании которой правильный многоугольник: все боковые грани — равные прямоугольники.'],
          },
          {
            vid: 'formula',
            tex: 'S_{\\text{бок}} = P_{\\text{осн}}\\cdot h',
          },
          {
            vid: 'primer',
            primer: {
              id: 'g3-prizma-bok',
              title: 'Боковая поверхность правильной призмы',
              uslovie:
                'Сторона основания правильной треугольной призмы $ABCA_1B_1C_1$ равна $6$, боковое ребро — $5$. Найдите площадь боковой поверхности призмы.',
              model: {
                alt: 'Правильная треугольная призма ABCA₁B₁C₁: боковая грань ABB₁A₁ — прямоугольник 6 на 5',
                bodies: [pr3],
                sections: [{ points: ['A', 'B', 'B1', 'A1'].map(w3), shag: 1 }],
                measures: [
                  { a: w3('A'), b: w3('B'), text: '6' },
                  { a: w3('B'), b: w3('B1'), text: '5' },
                ],
              },
              shagiChertezha: ['Каждая боковая грань — прямоугольник $6 \\times 5$.'],
              shagi: [
                {
                  title: 'Смотрим на грани',
                  paras: ['Призма правильная: три боковые грани — равные прямоугольники со сторонами $6$ и $5$.'],
                },
                {
                  title: 'Считаем',
                  paras: ['Периметр основания — $3\\cdot 6 = 18$.'],
                  formuly: ['S_{\\text{бок}} = 18\\cdot 5 = 90'],
                },
              ],
              otvet: 'Ответ: $90$.',
              chislo: 90,
              pereschet: () =>
                pri(
                  [
                    [dlina(w3('A'), w3('B')), 6],
                    [dlina(w3('A'), w3('A1')), 5],
                  ],
                  bokovaya(pr3, [
                    ['A', 'B', 'C'],
                    ['A1', 'B1', 'C1'],
                  ]),
                ),
            },
          },
          {
            vid: 'lovushka',
            title: 'Боковая поверхность — без оснований',
            neverno: ['«Площадь боковой поверхности: $4\\cdot 3\\cdot 10 + 2\\cdot 3^2 = 138$». Прибавили два основания — это уже полная поверхность.'],
            verno: ['Боковая поверхность — только боковые грани. Основания добавляют, когда спрашивают полную поверхность.'],
            zadacha: {
              uslovie:
                'Сторона основания правильной четырёхугольной призмы равна $3$, боковое ребро — $10$. Найдите площадь боковой поверхности.',
              reshenie: ['Четыре боковые грани — прямоугольники $3 \\times 10$.'],
              formuly: ['S_{\\text{бок}} = 4\\cdot 3\\cdot 10 = 120'],
              otvet: 'Ответ: $120$.',
              chislo: 120,
              pereschet: () =>
                bokovaya(box(3, 3, 10), [
                  ['A', 'B', 'C', 'D'],
                  ['A1', 'B1', 'C1', 'D1'],
                ]),
            },
          },
        ],
      },
      {
        id: 'g3-piramida',
        title: 'Пирамида: куда проецируется вершина, апофема',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'У правильной пирамиды вершина проецируется в центр основания $O$. Отсюда два рабочих треугольника с прямым углом при $O$: с боковым ребром (катет — радиус описанной окружности основания) и с апофемой (катет — радиус вписанной).',
            ],
          },
          {
            vid: 'opredelenie',
            plashka: 'Апофема',
            paras: ['Высота боковой грани правильной пирамиды, проведённая из вершины. Она падает в середину стороны основания.'],
            formuly: ['S_{\\text{бок}} = \\frac{1}{2}P_{\\text{осн}}\\cdot l'],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g3-apofema',
              title: 'Апофема и боковая поверхность',
              uslovie:
                'Сторона основания правильной четырёхугольной пирамиды $SABCD$ равна $6$, высота — $4$. Найдите площадь боковой поверхности пирамиды.',
              model: {
                alt: 'Правильная пирамида SABCD: высота SO, отрезок OM до середины стороны AB, апофема SM',
                bodies: [p6.body],
                rakurs: NIZKO,
                marks: [
                  { p: p6.O, label: 'O' },
                  { p: M, label: 'M', shag: 1 },
                ],
                lines: [
                  { a: S, b: p6.O },
                  { a: p6.O, b: M, shag: 1 },
                  { a: S, b: M, shag: 2 },
                ],
                sections: [{ points: [S, p6.O, M], shag: 2 }],
                angles: [{ at: p6.O, u: dir(p6.O, M), v: dir(p6.O, S), shag: 2 }],
                measures: [{ a: p6.v('B'), b: p6.v('C'), text: '6' }],
              },
              shagiChertezha: [
                '$M$ — середина $AB$; $OM$ — половина стороны, $3$.',
                'Треугольник $SOM$: прямой угол при $O$, гипотенуза — апофема $SM$.',
              ],
              ploskiy: {
                vershiny: ['O', 'M', 'S'],
                kateti: [3, 4],
                podpisi: { a: '3', b: '4', c: '?' },
                iskomoe: 'c',
                alt: 'Прямоугольный треугольник SOM: катеты OM = 3 и SO = 4, гипотенуза SM — апофема, искомая',
              },
              shagi: [
                {
                  title: 'Находим апофему',
                  paras: ['Катеты $3$ и $4$ — тройка $3,\\ 4,\\ 5$.'],
                  formuly: ['SM^2 = 3^2 + 4^2 = 25,\\quad SM = 5'],
                },
                {
                  title: 'Считаем боковую поверхность',
                  paras: ['Периметр основания — $24$.'],
                  formuly: ['S_{\\text{бок}} = \\frac{1}{2}\\cdot 24\\cdot 5 = 60'],
                },
              ],
              otvet: 'Ответ: $60$.',
              chislo: 60,
              pereschet: () => bokovaya(p6.body, [['A', 'B', 'C', 'D']]),
            },
          },
          {
            vid: 'vazhno',
            title: 'Важно: апофема — катет, боковое ребро — гипотенуза',
            paras: ['В боковой грани апофема, половина стороны и боковое ребро образуют прямоугольный треугольник.'],
            zadacha: {
              uslovie:
                'Сторона основания правильной четырёхугольной пирамиды равна $10$, боковое ребро — $13$. Найдите апофему.',
              reshenie: ['Половина стороны — $5$; тройка $5,\\ 12,\\ 13$.'],
              formuly: ['l^2 = 13^2 - 5^2 = 144,\\quad l = 12'],
              otvet: 'Ответ: $12$.',
              chislo: 12,
              pereschet: () => {
                const p = piramida4(10, Math.sqrt(169 - 50));
                return pri([[dlina(p.v('S'), p.v('A')), 13]], dlina(p.v('S'), seredina(p.v('A'), p.v('B'))));
              },
            },
          },
          {
            vid: 'lovushka',
            title: 'Высота — не апофема',
            neverno: [
              '«Высота $3$ — это $SM$, значит, $SA^2 = 3^2 + (2\\sqrt{2})^2 = 17$». Апофема лежит в боковой грани и длиннее высоты.',
            ],
            verno: [
              'Высота $SO$ падает в центр $O$. В треугольнике $SOA$ катет $OA$ — половина диагонали основания: $OA = 4$.',
            ],
            risunki: { neverno: lovPir(false), verno: lovPir(true) },
            zadacha: {
              uslovie:
                'Сторона основания правильной четырёхугольной пирамиды $SABCD$ равна $4\\sqrt{2}$, высота — $3$. Найдите боковое ребро.',
              reshenie: ['Диагональ основания — $4\\sqrt{2}\\cdot\\sqrt{2} = 8$, половина — $4$.'],
              formuly: ['SA^2 = 3^2 + 4^2 = 25,\\quad SA = 5'],
              otvet: 'Ответ: $5$.',
              chislo: 5,
              pereschet: () => dlina(p3.v('S'), p3.v('A')),
            },
          },
        ],
      },
      {
        id: 'g3-secheniya',
        title: 'Сечения куба и параллелепипеда',
        bloki: [
          {
            vid: 'ideya',
            paras: [
              'Плоскость, проходящая через два параллельных ребра, режет параллелепипед по прямоугольнику: одна его сторона — ребро, другая — диагональ грани. Площадь — произведение этих двух отрезков.',
            ],
          },
          {
            vid: 'primer',
            primer: {
              id: 'g3-sechenie',
              title: 'Диагональное сечение',
              uslovie:
                'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ $AB = 3$, $AD = 4$, $AA_1 = 10$. Найдите площадь сечения, проходящего через рёбра $AA_1$ и $CC_1$.',
              model: {
                alt: 'Параллелепипед ABCDA₁B₁C₁D₁: треугольник ABC в основании и сечение ACC₁A₁',
                bodies: [b10],
                lines: [{ a: u('A'), b: u('C'), shag: 1 }],
                angles: [{ at: u('B'), u: dir(u('B'), u('A')), v: dir(u('B'), u('C')), shag: 1 }],
                sections: [{ points: ['A', 'C', 'C1', 'A1'].map(u), shag: 2 }],
                measures: [
                  { a: u('A'), b: u('B'), text: '3' },
                  { a: u('B'), b: u('C'), text: '4' },
                  { a: u('C'), b: u('C1'), text: '10' },
                ],
              },
              shagiChertezha: [
                'В основании треугольник $ABC$ с прямым углом при $B$.',
                'Сечение $ACC_1A_1$ — прямоугольник со сторонами $AC$ и $AA_1$.',
              ],
              ploskiy: {
                vershiny: ['B', 'A', 'C'],
                kateti: [3, 4],
                podpisi: { a: '3', b: '4', c: '?' },
                iskomoe: 'c',
                alt: 'Прямоугольный треугольник ABC: катеты 3 и 4, гипотенуза AC — искомая',
              },
              most: 'Выносим основание: треугольник $ABC$',
              shagi: [
                {
                  title: 'Узнаём фигуру',
                  paras: ['$AA_1$ и $CC_1$ параллельны и перпендикулярны основанию: сечение $ACC_1A_1$ — прямоугольник.'],
                },
                {
                  title: 'Находим диагональ основания',
                  paras: ['Тройка $3,\\ 4,\\ 5$.'],
                  formuly: ['AC = 5'],
                },
                {
                  title: 'Считаем площадь',
                  paras: [],
                  formuly: ['S = AC\\cdot AA_1 = 5\\cdot 10 = 50'],
                },
              ],
              otvet: 'Ответ: $50$.',
              chislo: 50,
              pereschet: () => ploshchadMnogougolnika(['A', 'C', 'C1', 'A1'].map(u)),
            },
          },
          {
            vid: 'layfhak',
            title: 'Лайфхак: сторона сечения — диагональ боковой грани',
            paras: ['Если сечение проходит через ребро основания и противоположное ребро верхней грани, вторая его сторона — диагональ боковой грани.'],
            zadacha: {
              uslovie:
                'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ $AB = 5$, $AD = 3$, $AA_1 = 4$. Найдите площадь сечения $ABC_1D_1$.',
              reshenie: ['Сечение — прямоугольник со сторонами $AB = 5$ и $BC_1$; $BC_1$ — гипотенуза с катетами $3$ и $4$.'],
              formuly: ['BC_1 = 5,\\quad S = 5\\cdot 5 = 25'],
              otvet: 'Ответ: $25$.',
              chislo: 25,
              pereschet: () => ploshchadMnogougolnika(['A', 'B', 'C1', 'D1'].map(x)),
            },
          },
          {
            vid: 'lovushka',
            title: 'Сечение — вся фигура в плоскости, а не три точки',
            neverno: ['«Сечение через $A$, $B$, $C_1$ — треугольник $ABC_1$». Плоскость идёт дальше и пересекает куб ещё по ребру $C_1D_1$.'],
            verno: [
              'Прямая $C_1D_1$ параллельна $AB$, поэтому лежит в той же плоскости. Сечение — прямоугольник $ABC_1D_1$.',
            ],
            risunki: {
              neverno: lovSech(false, { alt: 'Куб: треугольник ABC₁, ошибочно принятый за сечение' }),
              verno: lovSech(true, { alt: 'Куб: сечение плоскостью ABC₁ — прямоугольник ABC₁D₁' }),
            },
            zadacha: {
              uslovie:
                'Ребро куба $ABCDA_1B_1C_1D_1$ равно $3$. Найдите квадрат площади сечения куба плоскостью, проходящей через точки $A$, $B$ и $C_1$.',
              reshenie: ['Стороны прямоугольника — $AB = 3$ и $BC_1 = 3\\sqrt{2}$.'],
              formuly: ['S = 3\\cdot 3\\sqrt{2} = 9\\sqrt{2},\\quad S^2 = 81\\cdot 2 = 162'],
              otvet: 'Ответ: $162$.',
              chislo: 162,
              pereschet: () => ploshchadMnogougolnika(['A', 'B', 'C1', 'D1'].map(y)) ** 2,
            },
          },
        ],
      },
    ],
  };
}
