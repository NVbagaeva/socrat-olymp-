/**
 * Опорные задачи №3, блок 1 «Читаю чертёж». Умение — читать: найти на
 * рисунке прямоугольный треугольник, равные, параллельные и
 * перпендикулярные элементы. Опора — глава «Как читать и строить
 * чертёж»: проекция сохраняет параллельность и отношения отрезков на
 * одной прямой, а углы и длины искажает. Прямой угол — только тот,
 * который обоснован свойствами тела.
 *
 * Числа свои: задач этого умения в открытом банке №3 нет. У каждой
 * задачи — пересчёт ответа по координатам того же чертежа (pereschet).
 */

import { box, dir, polygonStart, pyramid, regularPolygon, tetrahedron, vertex } from '../../solid/figures';
import { polyhedronEdges, type Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const cross = (u: Vec3, v: Vec3): Vec3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const tochka = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Угол при вершине o, градусы. */
const ugol = (a: Vec3, o: Vec3, b: Vec3) => {
  const u = dir(o, a);
  const v = dir(o, b);
  return (Math.acos(dot(u, v) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
};
const kollinearny = (u: Vec3, w: Vec3) => Math.hypot(...cross(u, w)) < 1e-9;

/** Куб ABCDA₁B₁C₁D₁ с ребром a. */
function kub(a: number): { body: Polyhedron; v: (n: string) => Vec3 } {
  const body = box(a, a, a);
  return { body, v: (n: string) => vertex(body, n) };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka1(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: ребро, перпендикулярное основанию. */
  {
    const body = box(5, 3, 4);
    const v = (n: string) => vertex(body, n);
    const celi = [
      { id: 'AB', points: [v('A'), v('B')], label: '$AB$' },
      { id: 'AA1', points: [v('A'), v('A1')], label: '$AA_1$' },
      { id: 'A1B1', points: [v('A1'), v('B1')], label: '$A_1B_1$' },
    ];
    out.push({
      id: 'o3-1-01',
      kratko: 'Ребро, перпендикулярное грани',
      blok: 'chitayu',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Дан прямоугольный параллелепипед $ABCDA_1B_1C_1D_1$. Нажмите на чертеже на ребро, которое перпендикулярно плоскости основания $ABCD$.',
      model: { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁', bodies: [body] },
      celi,
      otvet: 'AA1',
      podskazka: [
        {
          n: 1,
          vopros: 'Как расположены боковые рёбра прямоугольного параллелепипеда?',
          varianty: ['Перпендикулярно плоскостям оснований', 'Параллельно основанию', 'Под острым углом к основанию'],
          verno: 0,
          vyvod: 'Боковые рёбра $AA_1$, $BB_1$, $CC_1$, $DD_1$ перпендикулярны основаниям.',
        },
        {
          n: 3,
          vopros: 'А ребро $A_1B_1$ — оно перпендикулярно основанию?',
          varianty: ['Нет, оно параллельно основанию: лежит в верхней грани', 'Да, оно над основанием'],
          verno: 0,
          vyvod: 'Рёбра оснований лежат в основаниях или параллельны им.',
        },
      ],
      uchitel: [{ etap: 'Боковое ребро', formuly: ['AA_1 \\perp AB,\\ AA_1 \\perp AD\\ \\Rightarrow\\ AA_1 \\perp (ABC)'] }],
      uchenik: [
        { n: 1, chto: 'Параллелепипед прямоугольный: все грани — прямоугольники, боковые рёбра перпендикулярны основанию.' },
        {
          n: 3,
          chto: '$AA_1$ перпендикулярно двум пересекающимся прямым основания $AB$ и $AD$ — значит, и всей плоскости. $AB$ лежит в основании, $A_1B_1$ ему параллельно.',
          formula: 'AA_1 \\perp (ABC)',
        },
      ],
      pereschet: () => {
        const n = cross(dir(v('A'), v('B')), dir(v('A'), v('D')));
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return kollinearny(dir(p, q), n);
        });
        return found?.id ?? '';
      },
    });
  }

  /* 2. Почему угол прямой, хотя выглядит тупым. */
  {
    const { body, v } = kub(5);
    out.push({
      id: 'o3-1-02',
      kratko: 'Тупой на вид угол $BAD$',
      rabochaya: { points: [v('A'), v('B'), v('D')], pryamoy: v('A') },
      blok: 'chitayu',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'На чертеже куба $ABCDA_1B_1C_1D_1$ угол $BAD$ выглядит тупым. Каков он на самом деле и почему?',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с диагональю грани BD',
        bodies: [body],
        lines: [{ a: v('B'), b: v('D') }],
      },
      varianty: [
        'Прямой: грань $ABCD$ — квадрат, а все углы квадрата прямые',
        'Тупой: на чертеже он больше прямого',
        'Острый: треугольник $ABD$ равнобедренный',
        'Узнать нельзя, пока не измерим его транспортиром на рисунке',
      ],
      otvet: '0',
      podskazka: [
        {
          n: 1,
          vopros: 'Сохраняет ли чертёж (параллельная проекция) углы?',
          varianty: ['Нет, углы искажаются', 'Да, углы те же'],
          verno: 0,
          vyvod: 'Угол на чертеже — не угол тела. Его берём из свойств тела.',
        },
        {
          n: 3,
          vopros: 'Какая фигура — грань $ABCD$ куба?',
          varianty: ['Квадрат', 'Параллелограмм с тупым углом', 'Ромб'],
          verno: 0,
          vyvod: 'Параллелограммом она только нарисована.',
        },
      ],
      uchitel: [{ etap: 'Свойство тела', formuly: ['ABCD\\ \\text{— квадрат}\\ \\Rightarrow\\ \\angle BAD = 90^\\circ'] }],
      uchenik: [
        { n: 1, chto: 'Чертёж — параллельная проекция: она сохраняет параллельность, а углы и длины искажает. Измерять угол на рисунке бессмысленно.' },
        { n: 3, chto: 'Все грани куба — квадраты, поэтому угол $BAD$ прямой при любом ракурсе, и треугольник $ABD$ прямоугольный.', formula: '\\angle BAD = 90^\\circ' },
      ],
      pereschet: () => (Math.abs(ugol(v('B'), v('A'), v('D')) - 90) < 1e-9 ? '0' : '?'),
    });
  }

  /* 3. Середина на чертеже — середина и в пространстве. */
  {
    const body = tetrahedron(6);
    const v = (n: string) => vertex(body, n);
    const K = tochka(v('A'), v('B'), 0.25);
    const L = tochka(v('B'), v('C'), 0.5);
    const N = tochka(v('A'), v('D'), 2 / 3);
    const tochki: [Vec3, Vec3, Vec3][] = [
      [K, v('A'), v('B')],
      [L, v('B'), v('C')],
      [N, v('A'), v('D')],
    ];
    out.push({
      id: 'o3-1-03',
      kratko: 'Середина ребра на чертеже',
      blok: 'chitayu',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'На чертеже правильного тетраэдра $ABCD$ отмечены точки: $K$ на ребре $AB$, $L$ на ребре $BC$ и $N$ на ребре $AD$. Какая из них — середина своего ребра?',
      model: {
        alt: 'Правильный тетраэдр ABCD, точки K на AB, L на BC, N на AD',
        bodies: [body],
        marks: [
          { p: K, label: 'K' },
          { p: L, label: 'L' },
          { p: N, label: 'N' },
        ],
      },
      varianty: [
        'Точка $K$ на ребре $AB$',
        'Точка $L$ на ребре $BC$',
        'Точка $N$ на ребре $AD$',
        'По чертежу узнать нельзя: проекция искажает длины',
      ],
      otvet: '1',
      podskazka: [
        {
          n: 1,
          vopros: 'Что сохраняет параллельная проекция?',
          varianty: ['Отношение отрезков на одной прямой', 'Длины отрезков', 'Величины углов'],
          verno: 0,
          vyvod: 'Длины искажаются, но отношение частей одного ребра — то же, что у тела.',
        },
        {
          n: 2,
          vopros: 'Значит, середина ребра на чертеже…',
          varianty: ['…делит нарисованное ребро пополам', '…может оказаться где угодно на ребре'],
          verno: 0,
          vyvod: 'Смотрим, какая точка делит своё ребро на чертеже на две равные части.',
        },
      ],
      uchitel: [{ etap: 'Свойство проекции', formuly: ['\\dfrac{AK}{KB} = \\dfrac{1}{3},\\quad \\dfrac{BL}{LC} = 1,\\quad \\dfrac{AN}{ND} = 2'] }],
      uchenik: [
        { n: 1, chto: 'Параллельная проекция сохраняет отношение отрезков на одной прямой. Поэтому отношение частей ребра можно читать прямо по рисунку.' },
        { n: 2, chto: 'На чертеже пополам делит своё ребро только точка $L$. Точка $K$ ближе к $A$, точка $N$ ближе к $D$.', formula: 'BL = LC' },
      ],
      pereschet: () => {
        const at = tochki.findIndex(([p, a, b]) => Math.abs(dist(a, p) - dist(p, b)) < 1e-9);
        return String(at);
      },
    });
  }

  /* 4. Нажми: ребро, параллельное AB. */
  {
    const { body, v } = kub(4);
    const celi = [
      { id: 'A1D1', points: [v('A1'), v('D1')], label: '$A_1D_1$' },
      { id: 'CC1', points: [v('C'), v('C1')], label: '$CC_1$' },
      { id: 'C1D1', points: [v('C1'), v('D1')], label: '$C_1D_1$' },
    ];
    out.push({
      id: 'o3-1-04',
      kratko: 'Ребро, параллельное $AB$',
      blok: 'chitayu',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie: 'Дан куб $ABCDA_1B_1C_1D_1$. Нажмите на чертеже на ребро, которое параллельно ребру $AB$.',
      model: { alt: 'Куб ABCDA₁B₁C₁D₁', bodies: [body] },
      celi,
      otvet: 'C1D1',
      podskazka: [
        {
          n: 1,
          vopros: 'Что параллельная проекция делает с параллельными рёбрами?',
          varianty: ['Рисует их параллельными', 'Может нарисовать их пересекающимися'],
          verno: 0,
          vyvod: 'Параллельные рёбра и на чертеже параллельны.',
        },
        {
          n: 2,
          vopros: 'Какому ребру грани $ABCD$ параллельно $AB$?',
          varianty: ['$CD$', '$BC$', '$AD$'],
          verno: 0,
          vyvod: 'Противоположные стороны квадрата параллельны. Теперь найдите ребро верхней грани, параллельное $CD$.',
        },
      ],
      uchitel: [{ etap: 'Параллельность', formuly: ['AB \\parallel CD,\\ CD \\parallel C_1D_1\\ \\Rightarrow\\ AB \\parallel C_1D_1'] }],
      uchenik: [
        { n: 1, chto: 'Проекция сохраняет параллельность: параллельные рёбра на рисунке тоже параллельны.' },
        {
          n: 2,
          chto: 'В квадрате $ABCD$ ребро $AB$ параллельно $CD$, а в квадрате $CDD_1C_1$ ребро $CD$ параллельно $C_1D_1$. $A_1D_1$ параллельно $AD$, $CC_1$ — боковое ребро.',
          formula: 'AB \\parallel C_1D_1',
        },
      ],
      pereschet: () => {
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return kollinearny(dir(p, q), dir(v('A'), v('B')));
        });
        return found?.id ?? '';
      },
    });
  }

  /* 5. Нажми: перпендикуляр к основанию пирамиды (невидимый отрезок). */
  {
    const body = pyramid(regularPolygon(4, 6 / Math.SQRT2, 0, polygonStart(4)), [0, 0, 5]);
    const v = (n: string) => vertex(body, n);
    const O: Vec3 = [0, 0, 0];
    const M = tochka(v('C'), v('D'), 0.5);
    const celi = [
      { id: 'SA', points: [v('S'), v('A')], label: '$SA$' },
      { id: 'SM', points: [v('S'), M], label: '$SM$' },
      { id: 'SO', points: [v('S'), O], label: '$SO$' },
    ];
    out.push({
      id: 'o3-1-05',
      kratko: 'Перпендикуляр к основанию пирамиды',
      rabochaya: { points: [v('S'), O, v('A')], pryamoy: O },
      blok: 'chitayu',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'В правильной пирамиде $SABCD$ точка $O$ — центр основания, $M$ — середина ребра $CD$. Нажмите на чертеже на отрезок, перпендикулярный плоскости основания.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD, отрезки SO и SM',
        bodies: [body],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: v('S'), b: O },
          { a: v('S'), b: M },
        ],
      },
      celi,
      otvet: 'SO',
      podskazka: [
        {
          n: 1,
          vopros: 'Куда проецируется вершина правильной пирамиды?',
          varianty: ['В центр основания $O$', 'В середину ребра основания', 'В вершину основания'],
          verno: 0,
          vyvod: 'Высота правильной пирамиды — отрезок от вершины до центра основания.',
        },
        {
          n: 3,
          vopros: 'Апофема $SM$ перпендикулярна…',
          varianty: ['…ребру $CD$, но не всей плоскости основания', '…всей плоскости основания'],
          verno: 0,
          vyvod: 'Перпендикулярность одной прямой — ещё не перпендикулярность плоскости.',
        },
      ],
      uchitel: [{ etap: 'Высота', formuly: ['SO\\ \\text{— высота}\\ \\Rightarrow\\ SO \\perp (ABC)', 'SM \\perp CD,\\ \\text{но}\\ SM \\not\\perp OM'] }],
      uchenik: [
        { n: 1, chto: 'Пирамида правильная: вершина $S$ проецируется в центр квадрата $O$. Высота $SO$ внутри тела — поэтому она пунктиром.' },
        { n: 3, chto: 'Апофема $SM$ перпендикулярна только ребру $CD$, ребро $SA$ — наклонное. Перпендикуляр к основанию — высота.', formula: 'SO \\perp (ABC)' },
      ],
      pereschet: () => {
        const n = cross(dir(v('A'), v('B')), dir(v('A'), v('D')));
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return kollinearny(dir(p, q), n);
        });
        return found?.id ?? '';
      },
    });
  }

  /* 6. Нажми: единственный прямоугольный треугольник. */
  {
    const { body, v } = kub(4);
    const celi = [
      { id: 'A1BD', points: [v('A1'), v('B'), v('D')], label: 'треугольник $A_1BD$' },
      { id: 'ABC1', points: [v('A'), v('B'), v('C1')], label: 'треугольник $ABC_1$' },
      { id: 'B1CD1', points: [v('B1'), v('C'), v('D1')], label: 'треугольник $B_1CD_1$' },
    ];
    out.push({
      id: 'o3-1-06',
      kratko: 'Прямоугольный треугольник в кубе',
      rabochaya: { points: [v('A'), v('B'), v('C1')], pryamoy: v('B') },
      blok: 'chitayu',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie: 'В кубе $ABCDA_1B_1C_1D_1$ выделены три треугольника. Только один из них прямоугольный. Нажмите на него.',
      model: { alt: 'Куб ABCDA₁B₁C₁D₁', bodies: [body] },
      celi,
      otvet: 'ABC1',
      podskazka: [
        {
          n: 2,
          vopros: 'Из каких отрезков состоит треугольник $A_1BD$?',
          varianty: ['Из трёх диагоналей граней', 'Из двух рёбер и диагонали грани', 'Из ребра и двух диагоналей куба'],
          verno: 0,
          vyvod: 'Диагонали граней куба равны: треугольник $A_1BD$ равносторонний. С $B_1CD_1$ — так же.',
        },
        {
          n: 3,
          vopros: 'Как обосновать прямой угол в оставшемся треугольнике?',
          varianty: [
            'Одна его сторона — ребро, перпендикулярное грани, а другая лежит в этой грани',
            'На чертеже угол похож на прямой',
            'Две его стороны равны',
          ],
          verno: 0,
          vyvod: 'Прямая, перпендикулярная плоскости, перпендикулярна любой прямой в этой плоскости.',
        },
      ],
      uchitel: [
        { etap: 'Равносторонние', formuly: ['A_1B = BD = A_1D = B_1C = CD_1 = B_1D_1 = 4\\sqrt{2}'] },
        { etap: 'Прямой угол', formuly: ['AB \\perp (BCC_1),\\ BC_1 \\subset (BCC_1)\\ \\Rightarrow\\ \\angle ABC_1 = 90^\\circ'] },
      ],
      uchenik: [
        {
          n: 2,
          chto: 'Стороны $A_1BD$ и $B_1CD_1$ — диагонали квадратных граней. Они равны, треугольники равносторонние, все углы по $60^\\circ$. На чертеже они только искажены.',
        },
        { n: 3, chto: 'В $ABC_1$ сторона $AB$ — ребро, перпендикулярное грани $BCC_1B_1$; сторона $BC_1$ в этой грани лежит.', formula: '\\angle ABC_1 = 90^\\circ' },
      ],
      pereschet: () => {
        const found = celi.find((c) => {
          const [p, q, r] = c.points as [Vec3, Vec3, Vec3];
          return [ugol(q, p, r), ugol(p, q, r), ugol(p, r, q)].some((x) => Math.abs(x - 90) < 1e-9);
        });
        return found?.id ?? '';
      },
    });
  }

  /* 7. Нажми: отрезок, равный диагонали грани AC. */
  {
    const { body, v } = kub(4);
    const celi = [
      { id: 'AC1', points: [v('A'), v('C1')], label: '$AC_1$' },
      { id: 'CC1', points: [v('C'), v('C1')], label: '$CC_1$' },
      { id: 'BC1', points: [v('B'), v('C1')], label: '$BC_1$' },
    ];
    out.push({
      id: 'o3-1-07',
      kratko: 'Отрезок, равный $AC$',
      blok: 'chitayu',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie: 'В кубе $ABCDA_1B_1C_1D_1$ проведены отрезки $AC$, $AC_1$ и $BC_1$. Нажмите на чертеже на отрезок, который равен $AC$.',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с отрезками AC, AC₁ и BC₁',
        bodies: [body],
        lines: [
          { a: v('A'), b: v('C') },
          { a: v('A'), b: v('C1') },
          { a: v('B'), b: v('C1') },
        ],
      },
      celi,
      otvet: 'BC1',
      podskazka: [
        {
          n: 1,
          vopros: 'Можно ли сравнить длины, приложив линейку к рисунку?',
          varianty: ['Нет: проекция искажает длины', 'Да: равные отрезки нарисованы равными'],
          verno: 0,
          vyvod: 'Сравниваем не рисунок, а то, чем отрезки являются в теле.',
        },
        {
          n: 2,
          vopros: 'Что такое $AC$ в кубе?',
          varianty: ['Диагональ грани', 'Ребро', 'Диагональ куба'],
          verno: 0,
          vyvod: 'Все грани куба — равные квадраты, их диагонали равны. Ищем ещё одну диагональ грани.',
        },
      ],
      uchitel: [
        { etap: 'Что за отрезки', formuly: ['AC,\\ BC_1\\ \\text{— диагонали граней},\\quad AC_1\\ \\text{— диагональ куба},\\quad CC_1\\ \\text{— ребро}'] },
        { etap: 'Длины при ребре $a$', formuly: ['AC = BC_1 = a\\sqrt{2},\\quad AC_1 = a\\sqrt{3},\\quad CC_1 = a'] },
      ],
      uchenik: [
        { n: 1, chto: 'На рисунке длины искажены, поэтому узнаём, чем является каждый отрезок.' },
        {
          n: 2,
          chto: '$AC$ — диагональ грани $ABCD$, $BC_1$ — диагональ грани $BCC_1B_1$. Грани — равные квадраты, значит, их диагонали равны. $AC_1$ проходит внутри куба и длиннее, $CC_1$ — ребро, оно короче.',
          formula: 'BC_1 = AC = a\\sqrt{2}',
        },
      ],
      pereschet: () => {
        const AC = dist(v('A'), v('C'));
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return Math.abs(dist(p, q) - AC) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 8. Плоский чертёж: треугольник BDD₁ в истинном виде. */
  {
    const { body, v } = kub(4);
    const ploskie = [
      { vershiny: ['D', 'B', 'D1'] as const, kateti: [4 * Math.SQRT2, 4] as const, podpisi: { a: '4√2', b: '4' }, alt: 'Прямой угол при D, катеты DB = 4√2 и DD₁ = 4' },
      { vershiny: ['D', 'B', 'D1'] as const, kateti: [4, 4] as const, podpisi: { a: '4', b: '4' }, alt: 'Прямой угол при D, катеты DB = 4 и DD₁ = 4' },
      { vershiny: ['B', 'D', 'D1'] as const, kateti: [4 * Math.SQRT2, 4] as const, podpisi: { a: '4√2', c: '4' }, alt: 'Прямой угол при B, катет BD = 4√2, гипотенуза DD₁ = 4' },
    ];
    out.push({
      id: 'o3-1-08',
      kratko: 'Треугольник $BDD_1$ в истинном виде',
      rabochaya: { points: [v('B'), v('D'), v('D1')], pryamoy: v('D') },
      blok: 'chitayu',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie: 'Ребро куба $ABCDA_1B_1C_1D_1$ равно $4$. Какой плоский чертёж показывает треугольник $BDD_1$ в истинном виде?',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с ребром 4, треугольник BDD₁',
        bodies: [body],
        lines: [
          { a: v('B'), b: v('D') },
          { a: v('B'), b: v('D1') },
        ],
        measures: [{ a: v('D'), b: v('D1'), text: '4' }],
      },
      ploskie,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Что такое $BD$ в кубе?',
          varianty: ['Диагональ грани $ABCD$', 'Ребро куба', 'Диагональ куба'],
          verno: 0,
          vyvod: 'Диагональ квадрата со стороной $4$ равна $4\\sqrt{2}$, а не $4$.',
        },
        {
          n: 3,
          vopros: 'Где в треугольнике $BDD_1$ прямой угол?',
          varianty: ['При $D$', 'При $B$', 'При $D_1$'],
          verno: 0,
          vyvod: 'Ребро $DD_1$ перпендикулярно грани $ABCD$, а $BD$ лежит в ней.',
        },
      ],
      uchitel: [
        { etap: 'Прямой угол', formuly: ['DD_1 \\perp (ABC),\\ BD \\subset (ABC)\\ \\Rightarrow\\ \\angle BDD_1 = 90^\\circ'] },
        { etap: 'Катеты', formuly: ['BD = 4\\sqrt{2},\\quad DD_1 = 4'] },
      ],
      uchenik: [
        { n: 2, chto: '$BD$ — диагональ квадратной грани, $DD_1$ — ребро, $BD_1$ — диагональ куба.' },
        { n: 3, chto: 'Ребро $DD_1$ перпендикулярно нижней грани, $BD$ в ней лежит: прямой угол при $D$.', formula: '\\angle BDD_1 = 90^\\circ' },
        { n: 4, chto: 'Рисуем отдельно: катеты $4\\sqrt{2}$ и $4$. На втором чертеже диагональ грани приняли за ребро, на третьем прямой угол не там — гипотенуза вышла короче катета.' },
      ],
      pereschet: () => {
        const BD = dist(v('B'), v('D'));
        const DD1 = dist(v('D'), v('D1'));
        const pryamoyPriD = Math.abs(ugol(v('B'), v('D'), v('D1')) - 90) < 1e-9;
        const at = ploskie.findIndex(
          (p) => pryamoyPriD && p.vershiny[0] === 'D' && Math.abs(p.kateti[0] - BD) < 1e-9 && Math.abs(p.kateti[1] - DD1) < 1e-9,
        );
        return String(at);
      },
    });
  }

  /* 9. Угол A₁BD: стороны — диагонали граней. */
  {
    const { body, v } = kub(6);
    out.push({
      id: 'o3-1-09',
      kratko: 'Угол $A_1BD$ в кубе',
      blok: 'chitayu',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Дан куб $ABCDA_1B_1C_1D_1$. Найдите угол $A_1BD$. Ответ дайте в градусах.',
      model: {
        alt: 'Куб ABCDA₁B₁C₁D₁ с треугольником A₁BD',
        bodies: [body],
        lines: [
          { a: v('A1'), b: v('B') },
          { a: v('B'), b: v('D') },
          { a: v('A1'), b: v('D') },
        ],
      },
      otvet: '60',
      podskazka: [
        {
          n: 2,
          vopros: 'Что такое стороны $A_1B$, $BD$ и $A_1D$?',
          varianty: ['Диагонали трёх граней куба', 'Рёбра куба', 'Диагонали куба'],
          verno: 0,
          vyvod: 'Грани куба — равные квадраты, их диагонали равны.',
        },
        {
          n: 3,
          vopros: 'Есть ли в треугольнике $A_1BD$ прямой угол?',
          varianty: ['Нет: обосновать его нечем, все стороны равны', 'Да, при $B$: так выглядит на рисунке'],
          verno: 0,
          vyvod: 'Треугольник с тремя равными сторонами — равносторонний.',
        },
        {
          n: 4,
          vopros: 'Что известно об углах равностороннего треугольника?',
          varianty: ['Они равны между собой, сумма — $180^\\circ$', 'Один прямой, два по $45^\\circ$'],
          verno: 0,
          vyvod: 'Делим сумму углов на три.',
        },
      ],
      uchitel: [
        { etap: 'Стороны', formuly: ['A_1B = BD = A_1D = a\\sqrt{2}'] },
        { etap: 'Угол', formuly: ['\\triangle A_1BD\\ \\text{— равносторонний}\\ \\Rightarrow\\ \\angle A_1BD = \\dfrac{180^\\circ}{3} = 60^\\circ'] },
      ],
      uchenik: [
        { n: 2, chto: 'Каждая сторона треугольника — диагональ квадратной грани куба. Все они равны.' },
        { n: 3, chto: 'На рисунке угол может казаться прямым или тупым, но прямой угол нужно обосновать — а тут стороны равны, и треугольник равносторонний.' },
        { n: 5, chto: 'Все углы равностороннего треугольника равны.', formula: '\\angle A_1BD = 180^\\circ : 3 = 60^\\circ' },
      ],
      pereschet: () => okr(ugol(v('A1'), v('B'), v('D'))),
    });
  }

  /* 10. Сколько рёбер куба перпендикулярны AB. */
  {
    const { body, v } = kub(4);
    out.push({
      id: 'o3-1-10',
      kratko: 'Рёбра, перпендикулярные $AB$',
      blok: 'chitayu',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сколько рёбер куба $ABCDA_1B_1C_1D_1$ перпендикулярны прямой $AB$? Считайте и рёбра, которые с $AB$ не пересекаются.',
      model: { alt: 'Куб ABCDA₁B₁C₁D₁', bodies: [body] },
      otvet: '8',
      podskazka: [
        {
          n: 2,
          vopros: 'Рёбра куба идут в трёх направлениях. Сколько рёбер в каждом направлении?',
          varianty: ['$4$', '$3$', '$2$'],
          verno: 0,
          vyvod: 'Рёбра одного направления параллельны друг другу.',
        },
        {
          n: 3,
          vopros: 'Ребро $C_1D_1$ — вдоль $AB$ или поперёк?',
          varianty: ['Вдоль: оно параллельно $AB$', 'Поперёк: оно перпендикулярно $AB$'],
          verno: 0,
          vyvod: 'Рёбра направления $AB$ не перпендикулярны ему. Перпендикулярны рёбра двух других направлений.',
        },
        {
          n: 3,
          vopros: 'Перпендикулярно ли $AB$ ребро $A_1D_1$, которое с $AB$ не пересекается?',
          varianty: ['Да: $A_1D_1 \\parallel AD$, а $AD \\perp AB$', 'Нет: перпендикулярными бывают только пересекающиеся прямые'],
          verno: 0,
          vyvod: 'Угол между скрещивающимися прямыми — угол между пересекающимися прямыми, параллельными им.',
        },
      ],
      uchitel: [
        { etap: 'Направления рёбер', formuly: ['AD \\perp AB,\\ AA_1 \\perp AB'] },
        { etap: 'Счёт', formuly: ['\\{AD,\\ BC,\\ A_1D_1,\\ B_1C_1\\} \\cup \\{AA_1,\\ BB_1,\\ CC_1,\\ DD_1\\}:\\ 4 + 4 = 8'] },
      ],
      uchenik: [
        { n: 2, chto: 'Двенадцать рёбер куба — три группы по четыре параллельных: как $AB$, как $AD$ и как $AA_1$.' },
        {
          n: 3,
          chto: 'Рёбра группы $AD$ и группы $AA_1$ перпендикулярны $AB$, даже если с ним не пересекаются: каждое параллельно ребру, которое пересекает $AB$ под прямым углом.',
        },
        { n: 5, chto: 'Две группы по четыре ребра. Частая ошибка — посчитать только рёбра, пересекающие $AB$: их четыре.', formula: '4 + 4 = 8' },
      ],
      pereschet: () => {
        const ab = dir(v('A'), v('B'));
        return polyhedronEdges(body.faces).filter(([i, j]) => {
          const p = body.vertices[i] as Vec3;
          const q = body.vertices[j] as Vec3;
          return Math.abs(dot(dir(p, q), ab)) < 1e-9;
        }).length;
      },
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-1-${String(i + 1).padStart(2, '0')}` }));
}
