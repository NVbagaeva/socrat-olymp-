/**
 * Опорные задачи №3, блок 11 «Части тел». Умение — рисовать: выделить
 * на чертеже многогранник по названным вершинам, увидеть, пирамида это
 * или призма, найти её основание и высоту и взять долю от целого тела.
 * Части цилиндра и конуса по центральному углу — доля угла от 360°;
 * тетраэдр через середины рёбер — подобие с коэффициентом 1/2.
 *
 * Три задачи — из открытого банка ФИПИ (ADF4FE, 29FE0E, 2359E0).
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): объём части — выпуклой оболочкой её вершин, радиус,
 * высота и угол сектора — по точкам; автотест сверяет его с ответом.
 */

import { box, regularPrism, sektorCilindra, sektorKonusa, tetrahedron, vertex } from '../../solid/figures';
import { hullVolume } from '../../solid/measure';
import type { Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (u: Vec3, v: Vec3): Vec3 => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Центральный угол AOB в градусах — по координатам. */
function ugolGrad(A: Vec3, O: Vec3, B: Vec3): number {
  const u = sub(A, O);
  const v = sub(B, O);
  return (Math.acos(dot(u, v) / (Math.hypot(...u) * Math.hypot(...v))) * 180) / Math.PI;
}

/** Отрезок перпендикулярен плоскости основания (z = 0). */
function vertikalno(p: Vec3, q: Vec3): boolean {
  const d = sub(q, p);
  return near(Math.abs(d[2]), Math.hypot(...d));
}

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const FORMULA_PIRAMIDY: ShagPodskazki = {
  n: 4,
  vopros: 'Какую часть призмы с тем же основанием и той же высотой составляет пирамида?',
  varianty: ['$\\frac{1}{3}$', '$\\frac{1}{2}$', 'Столько же'],
  verno: 0,
  vyvod: '$V_{\\text{пир}} = \\frac{1}{3}S\\cdot h$, а у призмы $V = S\\cdot h$.',
};

const DOLYA_UGLA: ShagPodskazki = {
  n: 4,
  vopros: 'Какую долю целого тела составляет часть с центральным углом $\\alpha$?',
  varianty: ['$\\frac{\\alpha}{360^\\circ}$', '$\\frac{\\alpha}{180^\\circ}$', '$\\frac{\\alpha}{90^\\circ}$'],
  verno: 0,
  vyvod: 'Полный оборот — $360^\\circ$: доля части равна её углу, делённому на $360^\\circ$.',
};

const V_BLANK: ShagPodskazki = {
  n: 5,
  vopros: 'Что писать в бланк, если просят ответ, делённый на $\\pi$?',
  varianty: ['Коэффициент перед $\\pi$', 'Число, подставив $\\pi \\approx 3{,}14$'],
  verno: 0,
  vyvod: '$\\pi$ оставляем множителем до конца и пишем число перед ним.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

/** Параллелепипед с пирамидой B₁ABCD: основание залито, боковые рёбра проведены. */
function piramidaB1(a: number, b: number, c: number, { alt }: { alt: string }, chisla: boolean) {
  const body = box(a, b, c);
  const v = (n: string) => vertex(body, n);
  const model: Model = {
    alt,
    view: 'cabinet',
    bodies: [body],
    lines: [
      { a: v('B1'), b: v('A') },
      { a: v('B1'), b: v('C') },
      { a: v('B1'), b: v('D') },
    ],
    sections: [{ points: [v('A'), v('B'), v('C'), v('D')] }],
    ...(chisla
      ? {
          measures: [
            { a: v('A'), b: v('B'), text: String(a) },
            { a: v('B'), b: v('C'), text: String(b) },
            { a: v('B'), b: v('B1'), text: String(c) },
          ],
        }
      : {}),
  };
  return { v, model };
}

/** Куб с тетраэдром AA₁BD, отсечённым плоскостью A₁BD. */
function kubTetraedr(a: number, { alt }: { alt: string }, chislo: boolean) {
  const body = box(a, a, a);
  const v = (n: string) => vertex(body, n);
  const model: Model = {
    alt,
    view: 'cabinet',
    bodies: [body],
    lines: [
      { a: v('A1'), b: v('B') },
      { a: v('A1'), b: v('D') },
      { a: v('B'), b: v('D') },
    ],
    sections: [{ points: [v('A1'), v('B'), v('D')] }],
    ...(chislo ? { measures: [{ a: v('A'), b: v('B'), text: String(a) }] } : {}),
  };
  return { body, v, model };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka11(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: высота пирамиды B₁ABCD. */
  {
    const { v, model } = piramidaB1(4, 3, 5, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁, внутри пирамида с основанием ABCD и вершиной B₁: проведены отрезки B₁A, B₁C, B₁D' }, false);
    const celi = [
      { id: 'B1D', points: [v('B1'), v('D')], label: '$B_1D$' },
      { id: 'B1B', points: [v('B1'), v('B')], label: '$B_1B$' },
      { id: 'B1A', points: [v('B1'), v('A')], label: '$B_1A$' },
    ];
    out.push({
      id: 'o3-11-01',
      kratko: 'Высота пирамиды в параллелепипеде',
      blok: 'chasti',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Внутри прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$ выделена пирамида $B_1ABCD$. Нажмите на чертеже на её высоту.',
      model,
      celi,
      otvet: 'B1B',
      podskazka: [
        {
          n: 1,
          vopros: 'Где основание пирамиды $B_1ABCD$?',
          varianty: ['Нижняя грань $ABCD$', 'Грань $AA_1B_1B$', 'Треугольник $AB_1C$'],
          verno: 0,
          vyvod: 'Вершина — $B_1$, основание — нижняя грань параллелепипеда.',
        },
        {
          n: 3,
          vopros: 'Какой отрезок из $B_1$ перпендикулярен плоскости $ABCD$?',
          varianty: ['Боковое ребро параллелепипеда', 'Диагональ параллелепипеда', 'Диагональ боковой грани'],
          verno: 0,
          vyvod: 'Боковое ребро прямоугольного параллелепипеда перпендикулярно основанию — высоту проводить не нужно, она уже есть.',
        },
      ],
      uchitel: [
        { etap: 'Пирамида', formuly: ['B_1ABCD:\\ \\text{основание } ABCD,\\ \\text{вершина } B_1'] },
        { etap: 'Высота', formuly: ['B_1B \\perp (ABC) \\Rightarrow h = B_1B'] },
      ],
      uchenik: [
        { n: 1, chto: 'Основание пирамиды — нижняя грань $ABCD$, вершина $B_1$ — на верхней грани.' },
        {
          n: 3,
          chto: 'Высота — перпендикуляр из вершины на плоскость основания. Ребро $B_1B$ перпендикулярно основанию. Отрезки $B_1A$ и $B_1D$ — наклонные, это боковые рёбра пирамиды.',
          formula: 'h = B_1B',
        },
      ],
      pereschet: () => celi.find((c) => vertikalno(c.points[0] as Vec3, c.points[1] as Vec3))?.id ?? '',
    });
  }

  /* 2. Выбор: доля пирамиды с вершиной на верхней грани. */
  {
    const body = box(4, 3, 4);
    const v = (n: string) => vertex(body, n);
    const M: Vec3 = [2.6, 1.8, 4];
    const varianty = ['$\\frac{1}{3}$', '$\\frac{1}{2}$', '$\\frac{1}{6}$', 'Зависит от точки $M$'];
    const doli = [1 / 3, 1 / 2, 1 / 6];
    out.push({
      id: 'o3-11-02',
      kratko: 'Пирамида — треть параллелепипеда',
      blok: 'chasti',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Точка $M$ лежит на верхней грани прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$. Какую часть объёма параллелепипеда составляет объём пирамиды $MABCD$?',
      model: {
        alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁, точка M на верхней грани и пирамида MABCD с основанием ABCD',
        view: 'cabinet',
        bodies: [body],
        marks: [{ p: M, label: 'M' }],
        lines: ['A', 'B', 'C', 'D'].map((n) => ({ a: M, b: v(n) })),
        sections: [{ points: [v('A'), v('B'), v('C'), v('D')] }],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Чему равна высота пирамиды $MABCD$?',
          varianty: ['Боковому ребру параллелепипеда', 'Отрезку $MA$', 'Половине бокового ребра'],
          verno: 0,
          vyvod: 'Где бы ни лежала $M$ на верхней грани, расстояние от неё до нижней грани — боковое ребро.',
        },
        FORMULA_PIRAMIDY,
      ],
      uchitel: [
        { etap: 'Общее', formuly: ['S_{\\text{осн}} = S_{ABCD},\\quad h = AA_1'] },
        { etap: 'Доля', formuly: ['\\dfrac{V_{MABCD}}{V} = \\dfrac{\\frac{1}{3}S_{ABCD}\\cdot AA_1}{S_{ABCD}\\cdot AA_1} = \\dfrac{1}{3}'] },
      ],
      uchenik: [
        { n: 2, chto: 'У пирамиды и параллелепипеда общее основание $ABCD$. Высота пирамиды — расстояние от $M$ до нижней грани, оно равно боковому ребру при любом положении $M$.' },
        { n: 4, chto: 'Пирамида — треть призмы с тем же основанием и той же высотой. Ответ $\\frac{1}{6}$ был бы, если бы основание было половиной грани.', formula: 'V_{MABCD} = \\frac{1}{3}V' },
      ],
      pereschet: () => {
        const dolya = hullVolume([M, v('A'), v('B'), v('C'), v('D')]) / hullVolume(body.vertices);
        return String(doli.findIndex((d) => near(d, dolya)));
      },
    });
  }

  /* 3. Часть цилиндра с углом 90°: ответ, делённый на π. */
  {
    const body = sektorCilindra(4, 5, 90, 225);
    const v = (n: string) => vertex(body, n);
    out.push({
      id: 'o3-11-03',
      kratko: 'Четверть цилиндра',
      blok: 'chasti',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'От цилиндра с радиусом основания $4$ и высотой $5$ двумя плоскостями через ось отрезали часть с центральным углом $AOB = 90^\\circ$. Найдите объём этой части, делённый на $\\pi$.',
      model: {
        alt: 'Часть цилиндра с центральным углом AOB = 90°: радиус OA = 4, высота OO₁ = 5',
        bodies: [body],
        measures: [
          { a: v('O'), b: v('A'), text: '4' },
          { a: v('B'), b: v('B1'), text: '5' },
        ],
      },
      otvet: '20',
      podskazka: [
        {
          n: 1,
          vopros: 'Какую часть полного оборота составляет угол $90^\\circ$?',
          varianty: ['Четверть', 'Половину', 'Треть'],
          verno: 0,
          vyvod: '$\\frac{90^\\circ}{360^\\circ} = \\frac{1}{4}$: это четверть цилиндра.',
        },
        {
          n: 4,
          vopros: 'Объём всего цилиндра — это…',
          varianty: ['$\\pi r^2 h$', '$\\frac{1}{3}\\pi r^2 h$', '$2\\pi r h$'],
          verno: 0,
          vyvod: 'Площадь круга основания на высоту.',
        },
        V_BLANK,
      ],
      uchitel: [
        { etap: 'Цилиндр', formuly: ['V = \\pi\\cdot 4^2\\cdot 5 = 80\\pi'] },
        { etap: 'Часть', formuly: ['V_{\\text{части}} = 80\\pi\\cdot\\frac{90^\\circ}{360^\\circ} = 20\\pi'] },
      ],
      uchenik: [
        { n: 1, chto: 'Две плоскости через ось вырезают из цилиндра «кусок торта». Угол $90^\\circ$ — четверть оборота.' },
        { n: 4, chto: 'Объём части — та же доля от объёма всего цилиндра.', formula: 'V = \\pi r^2 h\\cdot\\frac{\\alpha}{360^\\circ}' },
        { n: 5, chto: 'Сначала сокращаем долю, $\\pi$ оставляем множителем.', formula: '\\pi\\cdot 16\\cdot 5 : 4 = 20\\pi' },
      ],
      pereschet: () => {
        const r = dist(v('O'), v('A'));
        const h = dist(v('O'), v('O1'));
        return okr((r * r * h * ugolGrad(v('A'), v('O'), v('B'))) / 360);
      },
    });
  }

  /* 4. Банк 29FE0E: пирамида B₁ABCD. */
  {
    const { v, model } = piramidaB1(9, 3, 8, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами AB = 9, BC = 3, BB₁ = 8 и пирамида B₁ABCD' }, true);
    out.push({
      id: 'o3-11-04',
      kratko: 'Пирамида $B_1ABCD$',
      blok: 'chasti',
      uroven: 1,
      istochnik: 'fipi',
      fipi: '29FE0E',
      vid: 'chislo',
      uslovie:
        'Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, $D$, $B_1$ прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, у которого $AB = 9$, $BC = 3$, $BB_1 = 8$.',
      model,
      otvet: '72',
      podskazka: [
        {
          n: 1,
          vopros: 'Что за многогранник с вершинами $A$, $B$, $C$, $D$, $B_1$?',
          varianty: ['Четырёхугольная пирамида с вершиной $B_1$', 'Треугольная призма', 'Тетраэдр'],
          verno: 0,
          vyvod: 'Четыре вершины лежат в нижней грани — это основание, пятая $B_1$ — вершина пирамиды.',
        },
        {
          n: 2,
          vopros: 'Что служит высотой пирамиды?',
          varianty: ['Ребро $BB_1$', 'Отрезок $B_1D$', 'Ребро $AB$'],
          verno: 0,
          vyvod: '$BB_1$ перпендикулярно основанию $ABCD$.',
        },
        FORMULA_PIRAMIDY,
      ],
      uchitel: [
        { etap: 'Многогранник', formuly: ['B_1ABCD:\\ S_{ABCD} = 9\\cdot 3 = 27,\\quad h = BB_1 = 8'] },
        { etap: 'Объём', formuly: ['V = \\frac{1}{3}\\cdot 27\\cdot 8 = 72'] },
      ],
      uchenik: [
        { n: 1, chto: 'Рисуем: соединяем $B_1$ с $A$, $C$ и $D$. Получилась пирамида с основанием $ABCD$.' },
        { n: 2, chto: 'Высота — ребро $BB_1$: оно перпендикулярно нижней грани.' },
        { n: 5, chto: 'Пирамида — треть параллелепипеда. Сначала делим удобное число на $3$.', formula: 'V = \\frac{1}{3}\\cdot 9\\cdot 3\\cdot 8 = 9\\cdot 8 = 72' },
      ],
      pereschet: () => okr(hullVolume([v('A'), v('B'), v('C'), v('D'), v('B1')])),
    });
  }

  /* 5. Банк ADF4FE: половина параллелепипеда — прямая призма. */
  {
    const body = box(8, 7, 6);
    const v = (n: string) => vertex(body, n);
    out.push({
      id: 'o3-11-05',
      kratko: 'Призма $ABCA_1B_1C_1$',
      blok: 'chasti',
      uroven: 2,
      istochnik: 'fipi',
      fipi: 'ADF4FE',
      vid: 'chislo',
      uslovie:
        'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ известно, что $AB = 8$, $BC = 7$, $AA_1 = 6$. Найдите объём многогранника, вершинами которого являются точки $A$, $B$, $C$, $A_1$, $B_1$, $C_1$.',
      model: {
        alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами AB = 8, BC = 7, AA₁ = 6; выделена треугольная призма ABCA₁B₁C₁, отрезанная диагональной плоскостью ACC₁A₁',
        view: 'cabinet',
        bodies: [body],
        lines: [
          { a: v('A'), b: v('C') },
          { a: v('A1'), b: v('C1') },
        ],
        sections: [{ points: [v('A'), v('C'), v('C1'), v('A1')] }],
        measures: [
          { a: v('A'), b: v('B'), text: '8' },
          { a: v('B'), b: v('C'), text: '7' },
          { a: v('A'), b: v('A1'), text: '6' },
        ],
      },
      otvet: '168',
      podskazka: [
        {
          n: 1,
          vopros: 'Что за многогранник с вершинами $A$, $B$, $C$, $A_1$, $B_1$, $C_1$?',
          varianty: ['Прямая треугольная призма', 'Треугольная пирамида', 'Четырёхугольная пирамида'],
          verno: 0,
          vyvod: 'Основания — треугольники $ABC$ и $A_1B_1C_1$, боковые рёбра $AA_1$, $BB_1$, $CC_1$.',
        },
        {
          n: 2,
          vopros: 'Какую часть параллелепипеда она составляет?',
          varianty: ['Половину', 'Треть', 'Шестую часть'],
          verno: 0,
          vyvod: 'Диагональ $AC$ делит основание пополам, высота та же.',
        },
      ],
      uchitel: [
        { etap: 'Многогранник', formuly: ['ABCA_1B_1C_1\\ \\text{— призма},\\quad S_{ABC} = \\frac{1}{2}\\cdot 8\\cdot 7 = 28'] },
        { etap: 'Объём', formuly: ['V = 28\\cdot 6 = 168'] },
      ],
      uchenik: [
        { n: 1, chto: 'Рисуем: проводим диагонали $AC$ и $A_1C_1$. Плоскость $ACC_1A_1$ разрезает параллелепипед на две равные призмы.' },
        { n: 4, chto: 'Это призма, а не пирамида: множителя $\\frac{1}{3}$ нет. Основание — половина прямоугольника.', formula: 'V = \\frac{1}{2}\\cdot 8\\cdot 7\\cdot 6' },
        { n: 5, chto: 'Половину берём у чётного числа.', formula: 'V = 4\\cdot 7\\cdot 6 = 168' },
      ],
      pereschet: () => okr(hullVolume([v('A'), v('B'), v('C'), v('A1'), v('B1'), v('C1')])),
    });
  }

  /* 6. Банк 2359E0: пирамида C₁ABC в правильной треугольной призме. */
  {
    /* Чертёж не в масштабе условия (тонкая призма плохо читается):
       объём части берём долей от призмы по координатам, призма — 7 · 9. */
    const body = regularPrism(3, 2.6, 4.4, 'cabinet');
    const v = (n: string) => vertex(body, n);
    out.push({
      id: 'o3-11-06',
      kratko: 'Пирамида в призме',
      blok: 'chasti',
      uroven: 2,
      istochnik: 'fipi',
      fipi: '2359E0',
      vid: 'chislo',
      uslovie:
        'Найдите объём многогранника, вершинами которого являются вершины $A$, $B$, $C$, $C_1$ правильной треугольной призмы $ABCA_1B_1C_1$, площадь основания которой равна $7$, а боковое ребро равно $9$.',
      model: {
        alt: 'Правильная треугольная призма ABCA₁B₁C₁ с боковым ребром 9; выделена пирамида C₁ABC: проведены отрезки C₁A и C₁B',
        view: 'cabinet',
        bodies: [body],
        lines: [
          { a: v('C1'), b: v('A') },
          { a: v('C1'), b: v('B') },
        ],
        sections: [{ points: [v('A'), v('B'), v('C')] }],
        measures: [{ a: v('B'), b: v('B1'), text: '9' }],
      },
      otvet: '21',
      podskazka: [
        {
          n: 1,
          vopros: 'Что за многогранник с вершинами $A$, $B$, $C$, $C_1$?',
          varianty: ['Треугольная пирамида с основанием $ABC$', 'Треугольная призма', 'Четырёхугольная пирамида'],
          verno: 0,
          vyvod: 'Три вершины — основание призмы, четвёртая $C_1$ — вершина пирамиды.',
        },
        {
          n: 2,
          vopros: 'Чему равна высота пирамиды $C_1ABC$?',
          varianty: ['Боковому ребру $CC_1$', 'Отрезку $C_1A$', 'Стороне основания'],
          verno: 0,
          vyvod: 'Призма правильная, значит, прямая: $CC_1$ перпендикулярно основанию.',
        },
        FORMULA_PIRAMIDY,
      ],
      uchitel: [
        { etap: 'Многогранник', formuly: ['C_1ABC:\\ S_{ABC} = 7,\\quad h = CC_1 = 9'] },
        { etap: 'Объём', formuly: ['V = \\frac{1}{3}\\cdot 7\\cdot 9 = 21'] },
      ],
      uchenik: [
        { n: 1, chto: 'Рисуем: соединяем $C_1$ с $A$ и $B$. Получилась пирамида с тем же основанием, что у призмы.' },
        { n: 2, chto: 'Высота — боковое ребро $CC_1$: в правильной призме оно перпендикулярно основанию.' },
        { n: 5, chto: 'Пирамида — треть призмы: $9$ делится на $3$.', formula: 'V = \\frac{1}{3}\\cdot 7\\cdot 9 = 7\\cdot 3 = 21' },
      ],
      pereschet: () => okr((7 * 9 * hullVolume([v('A'), v('B'), v('C'), v('C1')])) / hullVolume(body.vertices)),
    });
  }

  /* 7. Нажми: основание тетраэдра AA₁BD, к которому проведена высота AA₁. */
  {
    const { v, model } = kubTetraedr(4, { alt: 'Куб ABCDA₁B₁C₁D₁, плоскость A₁BD отсекает от него тетраэдр AA₁BD' }, false);
    const celi = [
      { id: 'A1BD', points: [v('A1'), v('B'), v('D')], label: 'треугольник $A_1BD$' },
      { id: 'ABD', points: [v('A'), v('B'), v('D')], label: 'треугольник $ABD$' },
      { id: 'AA1B', points: [v('A'), v('A1'), v('B')], label: 'треугольник $AA_1B$' },
    ];
    out.push({
      id: 'o3-11-07',
      kratko: 'Основание отсечённого тетраэдра',
      blok: 'chasti',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Плоскость $A_1BD$ отсекает от куба $ABCDA_1B_1C_1D_1$ тетраэдр $AA_1BD$. Его высотой удобно взять ребро $AA_1$. Нажмите на основание тетраэдра, к которому проведена эта высота.',
      model,
      celi,
      otvet: 'ABD',
      podskazka: [
        {
          n: 3,
          vopros: 'Какой плоскости перпендикулярно ребро $AA_1$?',
          varianty: ['Нижней грани $ABCD$', 'Сечению $A_1BD$', 'Грани $AA_1B_1B$'],
          verno: 0,
          vyvod: 'Боковое ребро куба перпендикулярно нижней грани.',
        },
        {
          n: 2,
          vopros: 'Какая грань тетраэдра лежит в нижней грани куба?',
          varianty: ['$ABD$', '$A_1BD$', '$AA_1D$'],
          verno: 0,
          vyvod: 'Основание — прямоугольный треугольник $ABD$, половина квадрата.',
        },
      ],
      uchitel: [{ etap: 'Высота и основание', formuly: ['AA_1 \\perp (ABD) \\Rightarrow V = \\frac{1}{3}S_{ABD}\\cdot AA_1'] }],
      uchenik: [
        { n: 2, chto: 'У тетраэдра любая грань может быть основанием. Удобно взять ту, к которой высота уже есть на чертеже.' },
        {
          n: 3,
          chto: 'Ребро $AA_1$ перпендикулярно нижней грани куба, а в ней лежит грань $ABD$. Сечение $A_1BD$ содержит саму точку $A_1$, а грань $AA_1B$ — всё ребро $AA_1$: высотой к ним оно быть не может.',
          formula: 'AA_1 \\perp (ABD)',
        },
      ],
      pereschet: () => {
        const h = sub(v('A1'), v('A'));
        const found = celi.find((c) => {
          const [p, q, r] = c.points as [Vec3, Vec3, Vec3];
          const n = cross(sub(q, p), sub(r, p));
          return near(Math.abs(dot(n, h)), Math.hypot(...n) * Math.hypot(...h));
        });
        return found?.id ?? '';
      },
    });
  }

  /* 8. Тетраэдр, отсечённый от куба: шестая часть. */
  {
    const { v, model } = kubTetraedr(6, { alt: 'Куб ABCDA₁B₁C₁D₁ с ребром 6, плоскость A₁BD отсекает от него тетраэдр AA₁BD' }, true);
    out.push({
      id: 'o3-11-08',
      kratko: 'Тетраэдр от куба',
      blok: 'chasti',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Ребро куба $ABCDA_1B_1C_1D_1$ равно $6$. Плоскость $A_1BD$ отсекает от куба тетраэдр $AA_1BD$. Найдите его объём.',
      model,
      otvet: '36',
      podskazka: [
        {
          n: 2,
          vopros: 'Что взять за основание и высоту тетраэдра?',
          varianty: ['Основание $ABD$, высота $AA_1$', 'Основание $A_1BD$, высота $AA_1$', 'Основание $ABCD$, высота $AA_1$'],
          verno: 0,
          vyvod: '$AA_1$ перпендикулярно грани $ABD$, которая лежит в основании куба.',
        },
        {
          n: 4,
          vopros: 'Какую часть куба составляет тетраэдр?',
          varianty: ['$\\frac{1}{6}$', '$\\frac{1}{3}$', '$\\frac{1}{2}$'],
          verno: 0,
          vyvod: 'Основание — половина грани, а пирамида — треть призмы: $\\frac{1}{2}\\cdot\\frac{1}{3}$.',
        },
      ],
      uchitel: [
        { etap: 'Основание и высота', formuly: ['S_{ABD} = \\frac{1}{2}\\cdot 6\\cdot 6 = 18,\\quad h = AA_1 = 6'] },
        { etap: 'Объём', formuly: ['V = \\frac{1}{3}\\cdot 18\\cdot 6 = 36 = \\frac{1}{6}\\cdot 6^3'] },
      ],
      uchenik: [
        { n: 2, chto: 'Основание — прямоугольный треугольник $ABD$ в нижней грани, высота — ребро $AA_1$.' },
        { n: 4, chto: 'Треть от половины: тетраэдр — шестая часть куба. Ответ «треть куба» — частая ошибка: основание не вся грань.', formula: 'V = \\frac{1}{6}a^3' },
        { n: 5, chto: 'Шестая часть от $216$.', formula: 'V = 216 : 6 = 36' },
      ],
      pereschet: () => okr(hullVolume([v('A'), v('A1'), v('B'), v('D')])),
    });
  }

  /* 9. Часть конуса с углом 90°: высота из треугольника SOA. */
  {
    const body = sektorKonusa(6, 8, 90, 225);
    const v = (n: string) => vertex(body, n);
    const S = v('S');
    const O = v('O');
    const A = v('A');
    out.push({
      id: 'o3-11-09',
      kratko: 'Четверть конуса',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'chasti',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'От конуса двумя плоскостями через ось отрезали часть с центральным углом $AOB = 90^\\circ$. Радиус основания конуса $OA = 6$, образующая $SA = 10$. Найдите объём этой части, делённый на $\\pi$.',
      model: {
        alt: 'Часть конуса с вершиной S и центральным углом AOB = 90°: радиус OA = 6, образующая SA = 10',
        bodies: [body],
        measures: [
          { a: O, b: A, text: '6' },
          { a: S, b: A, text: '10' },
        ],
      },
      otvet: '24',
      podskazka: [
        {
          n: 2,
          vopros: 'Чего не хватает для объёма конуса и где его искать?',
          varianty: ['Высоты $SO$ — из треугольника $SOA$', 'Радиуса — из треугольника $AOB$', 'Ничего, всё дано'],
          verno: 0,
          vyvod: 'Ребро $SO$ части — это ось конуса, его высота.',
        },
        {
          n: 3,
          vopros: 'Почему угол $SOA$ прямой?',
          varianty: ['Ось $SO$ перпендикулярна плоскости основания, $OA$ лежит в ней', 'Угол $AOB$ прямой', 'Треугольник $SOA$ равнобедренный'],
          verno: 0,
          vyvod: 'Высота конуса перпендикулярна любой прямой в плоскости основания.',
        },
        DOLYA_UGLA,
        V_BLANK,
      ],
      uchitel: [
        { etap: 'Рабочий треугольник SOA', formuly: ['SO = \\sqrt{10^2 - 6^2} = 8'] },
        { etap: 'Конус', formuly: ['V = \\frac{1}{3}\\pi\\cdot 6^2\\cdot 8 = 96\\pi'] },
        { etap: 'Часть', formuly: ['V_{\\text{части}} = 96\\pi\\cdot\\frac{90^\\circ}{360^\\circ} = 24\\pi'] },
      ],
      uchenik: [
        { n: 2, chto: 'Для объёма нужна высота. Она — ребро $SO$ части, катет треугольника $SOA$.' },
        { n: 3, chto: 'Ось конуса перпендикулярна основанию, радиус $OA$ лежит в нём.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'Тройка $6, 8, 10$; потом доля $\\frac{1}{4}$, $\\pi$ оставляем множителем.', formula: 'SO = 8,\\quad V = \\frac{1}{3}\\pi\\cdot 36\\cdot 8 : 4 = 24\\pi' },
      ],
      pereschet: () => {
        const r = dist(O, A);
        const h = dist(S, O);
        return okr(((r * r * h) / 3) * (ugolGrad(A, O, v('B')) / 360));
      },
    });
  }

  /* 10. Тетраэдр через середины трёх рёбер из одной вершины. */
  {
    const body = tetrahedron(5);
    const v = (n: string) => vertex(body, n);
    const K = mid(v('D'), v('A'));
    const L = mid(v('D'), v('B'));
    const M = mid(v('D'), v('C'));
    out.push({
      id: 'o3-11-10',
      kratko: 'Середины рёбер тетраэдра',
      blok: 'chasti',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Объём тетраэдра $ABCD$ равен $48$. Точки $K$, $L$, $M$ — середины рёбер $DA$, $DB$, $DC$. Найдите объём тетраэдра $DKLM$, который отсекает плоскость $KLM$.',
      model: {
        alt: 'Тетраэдр ABCD; точки K, L, M — середины рёбер DA, DB, DC; плоскость KLM отсекает тетраэдр DKLM',
        bodies: [body],
        marks: [
          { p: K, label: 'K' },
          { p: L, label: 'L' },
          { p: M, label: 'M' },
        ],
        sections: [{ points: [K, L, M] }],
      },
      otvet: '6',
      podskazka: [
        {
          n: 1,
          vopros: 'Как связаны тетраэдры $DKLM$ и $DABC$?',
          varianty: ['Подобны с коэффициентом $\\frac{1}{2}$', 'Равны', 'У них общее основание'],
          verno: 0,
          vyvod: 'Все рёбра из $D$ уменьшились вдвое, плоскость $KLM$ параллельна $ABC$.',
        },
        {
          n: 4,
          vopros: 'Во сколько раз меняется объём при подобии с коэффициентом $k$?',
          varianty: ['В $k^3$ раз', 'В $k^2$ раз', 'В $k$ раз'],
          verno: 0,
          vyvod: 'Объём — три измерения: площадь основания меняется в $k^2$ раз, высота — в $k$ раз.',
        },
      ],
      uchitel: [
        { etap: 'Подобие', formuly: ['DK = \\tfrac{1}{2}DA,\\ DL = \\tfrac{1}{2}DB,\\ DM = \\tfrac{1}{2}DC \\Rightarrow k = \\tfrac{1}{2}'] },
        { etap: 'Объём', formuly: ['V_{DKLM} = k^3\\cdot V = \\tfrac{1}{8}\\cdot 48 = 6'] },
      ],
      uchenik: [
        { n: 1, chto: 'Отсечённая часть — маленький тетраэдр с той же вершиной $D$, его рёбра из $D$ вдвое короче.' },
        { n: 2, chto: 'Основание $KLM$: стороны — средние линии граней, площадь — четверть $ABC$. Высота из $D$ — вдвое меньше.' },
        { n: 4, chto: 'Площадь в $4$ раза, высота в $2$ раза — объём в $8$ раз меньше. Частая ошибка — разделить на $2$ или на $4$.', formula: 'V_{DKLM} = 48 : 8 = 6' },
      ],
      pereschet: () => okr((48 * hullVolume([v('D'), K, L, M])) / hullVolume(body.vertices)),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-11-${String(i + 1).padStart(2, '0')}` }));
}
