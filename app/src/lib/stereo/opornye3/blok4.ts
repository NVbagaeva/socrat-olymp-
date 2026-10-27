/**
 * Опорные задачи №3, блок 4 «Объём и площадь»: куб, прямоугольный
 * параллелепипед, призма. Формулы одной карточкой — объём призмы
 * S·h, боковая поверхность прямой призмы P·h — и доля отсечённой
 * части. Две задачи — из открытого банка (плоскость через среднюю
 * линию основания призмы), остальные со своими числами.
 *
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): площади граней и объёмы считаются по вершинам модели,
 * а не той формулой, которой получен ответ. Автотест сверяет его с ответом.
 */

import { box, prism, regularPrism, vertex } from '../../solid/figures';
import { hullVolume, polygonArea, polyhedronVolume, surfaceArea } from '../../solid/measure';
import type { Model, Polyhedron } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

/** Сумма площадей боковых граней призмы: все грани, кроме двух оснований. */
function bokovaya(body: Polyhedron): number {
  const n = body.vertices.length / 2;
  return body.faces
    .filter((f) => !(f.every((i) => i < n) || f.every((i) => i >= n)))
    .reduce((s, f) => s + polygonArea(f.map((i) => body.vertices[i] as Vec3)), 0);
}

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const FORMULA_PRIZMY: ShagPodskazki = {
  n: 4,
  vopros: 'По какой формуле считают объём призмы?',
  varianty: ['$V = S_{\\text{осн}}\\cdot h$', '$V = \\frac{1}{3}S_{\\text{осн}}\\cdot h$', '$V = P_{\\text{осн}}\\cdot h$'],
  verno: 0,
  vyvod: 'Призма — площадь основания на высоту; $\\frac{1}{3}$ бывает только у пирамиды и конуса.',
};

const BOKOVAYA: ShagPodskazki = {
  n: 4,
  vopros: 'Как найти площадь боковой поверхности прямой призмы?',
  varianty: ['Периметр основания умножить на высоту', 'Площадь основания умножить на высоту', 'Сложить площади оснований'],
  verno: 0,
  vyvod: 'Боковые грани — прямоугольники высоты $h$; их ширины в сумме дают периметр основания.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

function korobka(
  a: number,
  b: number,
  c: number,
  { alt }: { alt: string },
  podpisi: readonly string[],
): { model: Model; body: Polyhedron; v: (n: string) => Vec3 } {
  const body = box(a, b, c);
  const v = (n: string) => vertex(body, n);
  const rebra: [string, string][] = [
    ['A', 'B'],
    ['B', 'C'],
    ['C', 'C1'],
  ];
  return {
    body,
    v,
    model: {
      alt,
      view: 'cabinet',
      bodies: [body],
      measures: podpisi.map((text, k) => {
        const [p, q] = rebra[k] as [string, string];
        return { a: v(p), b: v(q), text };
      }),
    },
  };
}

/** Прямая призма с прямоугольным треугольником в основании: AC = 5, BC = 12, прямой угол при C. */
function prizma512(h: number): { body: Polyhedron; v: (n: string) => Vec3 } {
  const body = prism(
    [
      [0, 0, 0],
      [13, 0, 0],
      [25 / 13, 60 / 13, 0],
    ],
    [0, 0, h],
  );
  return { body, v: (n: string) => vertex(body, n) };
}

/** Треугольная призма для задач банка: плоскость через среднюю линию MN основания. */
function sredLiniya({ alt }: { alt: string }) {
  const body = regularPrism(3, 2.6, 4.4, 'cabinet');
  const v = (n: string) => vertex(body, n);
  const M = mid(v('C'), v('A'));
  const N = mid(v('C'), v('B'));
  const M1 = mid(v('C1'), v('A1'));
  const N1 = mid(v('C1'), v('B1'));
  const model: Model = {
    alt,
    view: 'cabinet',
    bodies: [body],
    marks: [
      { p: M, label: 'M' },
      { p: N, label: 'N' },
      { p: M1, label: 'M1' },
      { p: N1, label: 'N1' },
    ],
    sections: [{ points: [M, N, N1, M1] }],
  };
  return { body, v, M, N, M1, N1, model };
}

const ALT_SRED = {
  alt: 'Треугольная призма ABCA₁B₁C₁; плоскость через среднюю линию MN основания, параллельная боковому ребру, отсекает призму CMNC₁M₁N₁',
};

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka4(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Поверхность куба по ребру. */
  {
    const { model, body } = korobka(4, 4, 4, { alt: 'Куб ABCDA₁B₁C₁D₁ с ребром 4' }, ['4']);
    out.push({
      id: 'o3-4-01',
      kratko: 'Поверхность куба',
      blok: 'obem',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Ребро куба $ABCDA_1B_1C_1D_1$ равно $4$. Найдите площадь его полной поверхности.',
      model,
      otvet: '96',
      podskazka: [
        {
          n: 1,
          vopros: 'Сколько граней у куба и какие они?',
          varianty: ['Шесть равных квадратов', 'Четыре квадрата и два прямоугольника', 'Восемь равных квадратов'],
          verno: 0,
          vyvod: 'Полная поверхность — шесть одинаковых квадратов.',
        },
        {
          n: 4,
          vopros: 'Какая формула площади поверхности куба с ребром $a$?',
          varianty: ['$S = 6a^2$', '$S = a^3$', '$S = 4a^2$'],
          verno: 0,
          vyvod: '$4a^2$ — только боковая поверхность, $a^3$ — объём.',
        },
      ],
      uchitel: [{ etap: 'Шесть граней', formuly: ['S = 6a^2 = 6\\cdot 4^2 = 6\\cdot 16 = 96'] }],
      uchenik: [
        { n: 1, chto: 'У куба шесть граней, каждая — квадрат со стороной $4$.' },
        { n: 5, chto: 'Площадь одной грани — $16$, граней шесть.', formula: 'S = 6\\cdot 16 = 96' },
      ],
      pereschet: () => okr(surfaceArea(body)),
    });
  }

  /* 2. Объём параллелепипеда по трём рёбрам. */
  {
    const { model, body } = korobka(6, 3, 4, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 6, 3 и 4' }, ['6', '3', '4']);
    out.push({
      id: 'o3-4-02',
      kratko: 'Объём параллелепипеда',
      blok: 'obem',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Рёбра прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, выходящие из одной вершины, равны $6$, $3$ и $4$. Найдите его объём.',
      model,
      otvet: '72',
      podskazka: [
        {
          n: 4,
          vopros: 'Как найти объём прямоугольного параллелепипеда?',
          varianty: ['Перемножить три ребра из одной вершины', 'Сложить три ребра', 'Сложить площади трёх граней'],
          verno: 0,
          vyvod: '$V = abc$ — это та же формула $S_{\\text{осн}}\\cdot h$: основание $ab$, высота $c$.',
        },
        {
          n: 5,
          vopros: 'В каком порядке удобно умножать?',
          varianty: ['В любом: например, $6\\cdot 3$, потом на $4$', 'Только в порядке $AB$, $BC$, $CC_1$'],
          verno: 0,
          vyvod: 'От перестановки множителей произведение не меняется — выбирайте удобный порядок.',
        },
      ],
      uchitel: [{ etap: 'Объём', formuly: ['V = abc = 6\\cdot 3\\cdot 4 = 72'] }],
      uchenik: [
        { n: 4, chto: 'Объём параллелепипеда — площадь основания на высоту, то есть произведение трёх рёбер.', formula: 'V = abc' },
        { n: 5, chto: 'Перемножаем.', formula: 'V = 6\\cdot 3\\cdot 4 = 72' },
      ],
      pereschet: () => okr(polyhedronVolume(body)),
    });
  }

  /* 3. Выбор формулы объёма призмы. */
  {
    const { body, v } = prizma512(6);
    const varianty = [
      '$V = S_{\\text{осн}}\\cdot h$',
      '$V = \\frac{1}{3}S_{\\text{осн}}\\cdot h$',
      '$V = \\frac{1}{2}S_{\\text{осн}}\\cdot h$',
      '$V = P_{\\text{осн}}\\cdot h$, где $P_{\\text{осн}}$ — периметр основания',
    ];
    const koef = [1, 1 / 3, 1 / 2];
    out.push({
      id: 'o3-4-03',
      kratko: 'Формула объёма призмы',
      blok: 'obem',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Площадь основания прямой треугольной призмы $ABCA_1B_1C_1$ равна $S_{\\text{осн}}$, высота равна $h$. По какой формуле считают её объём?',
      model: { alt: 'Прямая треугольная призма ABCA₁B₁C₁', view: 'cabinet', bodies: [body] },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 1,
          vopros: 'Какое это тело?',
          varianty: ['Призма: два равных основания, боковые грани — прямоугольники', 'Пирамида: у боковых граней общая вершина'],
          verno: 0,
          vyvod: 'Оснований два, и они равны — это призма.',
        },
        {
          n: 4,
          vopros: 'У какого тела в формуле объёма есть множитель $\\frac{1}{3}$?',
          varianty: ['У пирамиды', 'У призмы', 'У параллелепипеда'],
          verno: 0,
          vyvod: 'Пирамида — треть призмы с тем же основанием и высотой. У призмы множителя нет.',
        },
      ],
      uchitel: [{ etap: 'Объём призмы', formuly: ['V_{\\text{призмы}} = S_{\\text{осн}}\\cdot h,\\qquad V_{\\text{пирамиды}} = \\frac{1}{3}S_{\\text{осн}}\\cdot h'] }],
      uchenik: [
        { n: 1, chto: 'Два равных основания и прямоугольные боковые грани — это призма.' },
        {
          n: 4,
          chto: 'Призма складывается из тонких слоёв, равных основанию: площадь основания умножается на высоту. Множитель $\\frac{1}{3}$ — у пирамиды, а периметр на высоту — это боковая поверхность, а не объём.',
          formula: 'V = S_{\\text{осн}}\\cdot h',
        },
      ],
      pereschet: () => {
        const S = polygonArea([v('A'), v('B'), v('C')]);
        const k = polyhedronVolume(body) / (S * dist(v('A'), v('A1')));
        return String(koef.findIndex((x) => Math.abs(x - k) < 1e-9));
      },
    });
  }

  /* 4. Нажми: грань площадью 15. */
  {
    const { model, v } = korobka(5, 2, 3, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами AB = 5, BC = 2, CC₁ = 3' }, ['5', '2', '3']);
    const celi = [
      { id: 'ABB1A1', points: [v('A'), v('B'), v('B1'), v('A1')], label: 'грань $ABB_1A_1$' },
      { id: 'ABCD', points: [v('A'), v('B'), v('C'), v('D')], label: 'грань $ABCD$' },
      { id: 'BCC1B1', points: [v('B'), v('C'), v('C1'), v('B1')], label: 'грань $BCC_1B_1$' },
    ];
    out.push({
      id: 'o3-4-04',
      kratko: 'Грань нужной площади',
      blok: 'obem',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Рёбра прямоугольного параллелепипеда: $AB = 5$, $BC = 2$, $CC_1 = 3$. Нажмите на чертеже на грань, площадь которой равна $15$.',
      model,
      celi,
      otvet: 'ABB1A1',
      podskazka: [
        {
          n: 2,
          vopros: 'Из каких рёбер составлена грань площадью $15$?',
          varianty: ['$5$ и $3$', '$5$ и $2$', '$2$ и $3$'],
          verno: 0,
          vyvod: 'Грань — прямоугольник, её площадь — произведение двух её рёбер.',
        },
        {
          n: 2,
          vopros: 'Какая грань содержит рёбра $AB$ и $BB_1$?',
          varianty: ['Передняя $ABB_1A_1$', 'Нижняя $ABCD$', 'Боковая $BCC_1B_1$'],
          verno: 0,
          vyvod: '$BB_1 = CC_1 = 3$: противоположные рёбра параллелепипеда равны.',
        },
      ],
      uchitel: [
        { etap: 'Площади трёх граней', formuly: ['S_{ABB_1A_1} = 5\\cdot 3 = 15,\\quad S_{ABCD} = 5\\cdot 2 = 10,\\quad S_{BCC_1B_1} = 2\\cdot 3 = 6'] },
      ],
      uchenik: [
        { n: 2, chto: 'Каждая грань — прямоугольник из двух рёбер, выходящих из одной вершины. $15 = 5\\cdot 3$ — это рёбра $AB$ и $BB_1$.' },
        { n: 5, chto: 'Нижняя грань $5\\cdot 2 = 10$, боковая $2\\cdot 3 = 6$ — не подходят.', formula: 'S_{ABB_1A_1} = 5\\cdot 3 = 15' },
      ],
      pereschet: () => celi.find((c) => Math.abs(polygonArea(c.points) - 15) < 1e-9)?.id ?? '',
    });
  }

  /* 5. Нажми: высота наклонной призмы. */
  {
    const body = prism(
      [
        [0, 0, 0],
        [4, 0, 0],
        [1.5, 3, 0],
      ],
      [1.6, 1.2, 3.6],
    );
    const v = (n: string) => vertex(body, n);
    const A1 = v('A1');
    const H: Vec3 = [A1[0], A1[1], 0];
    const celi = [
      { id: 'AA1', points: [v('A'), A1], label: '$AA_1$' },
      { id: 'A1H', points: [A1, H], label: '$A_1H$' },
      { id: 'A1B', points: [A1, v('B')], label: '$A_1B$' },
    ];
    out.push({
      id: 'o3-4-05',
      kratko: 'Высота наклонной призмы',
      rabochaya: { points: [v('A'), H, A1], pryamoy: H },
      blok: 'obem',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Призма $ABCA_1B_1C_1$ наклонная: её боковые рёбра не перпендикулярны основанию. Для объёма $V = S_{\\text{осн}}\\cdot h$ нужна высота. Нажмите на чертеже на отрезок — высоту призмы.',
      model: {
        alt: 'Наклонная треугольная призма ABCA₁B₁C₁, из вершины A₁ проведён отрезок A₁H к плоскости основания',
        view: 'cabinet',
        bodies: [body],
        marks: [{ p: H, label: 'H' }],
        lines: [{ a: A1, b: H }],
      },
      celi,
      otvet: 'A1H',
      podskazka: [
        {
          n: 1,
          vopros: 'Что такое высота призмы?',
          varianty: ['Перпендикуляр из точки одного основания на плоскость другого', 'Боковое ребро', 'Любой отрезок между основаниями'],
          verno: 0,
          vyvod: 'Высота — расстояние между плоскостями оснований, по перпендикуляру.',
        },
        {
          n: 3,
          vopros: 'Можно ли взять боковое ребро $AA_1$ за высоту?',
          varianty: ['Нет: призма наклонная, ребро не перпендикулярно основанию', 'Да: у любой призмы боковое ребро — высота'],
          verno: 0,
          vyvod: 'Ребро — гипотенуза треугольника $AHA_1$, оно длиннее высоты.',
        },
      ],
      uchitel: [{ etap: 'Высота', formuly: ['A_1H \\perp (ABC) \\Rightarrow h = A_1H', 'AA_1 > A_1H\\ \\text{(гипотенуза длиннее катета)}'] }],
      uchenik: [
        { n: 1, chto: 'Высота призмы — перпендикуляр между плоскостями оснований.' },
        {
          n: 3,
          chto: 'У прямой призмы высота равна боковому ребру, у наклонной — нет: ребро $AA_1$ наклонено, а $A_1H$ перпендикулярно основанию. $A_1B$ — диагональ боковой грани.',
          formula: 'A_1H \\perp (ABC),\\quad V = S_{ABC}\\cdot A_1H',
        },
      ],
      pereschet: () => {
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 6. Куб по диагонали грани: объём. */
  {
    const { model, body, v } = korobka(3, 3, 3, { alt: 'Куб ABCDA₁B₁C₁D₁ с диагональю грани AB₁' }, []);
    out.push({
      id: 'o3-4-06',
      kratko: 'Объём куба по диагонали грани',
      rabochaya: { points: [v('A'), v('B'), v('B1')], pryamoy: v('B') },
      blok: 'obem',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Диагональ грани куба $ABCDA_1B_1C_1D_1$ равна $3\\sqrt{2}$. Найдите объём куба.',
      model: { ...model, lines: [{ a: v('A'), b: v('B1') }], measures: [{ a: v('A'), b: v('B1'), text: '3√2' }] },
      otvet: '27',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике $AB_1$ — гипотенуза?',
          varianty: ['$ABB_1$', '$AB_1C_1$', '$AA_1D_1$'],
          verno: 0,
          vyvod: 'Катеты $AB$ и $BB_1$ — рёбра куба, оба равны $a$.',
        },
        {
          n: 5,
          vopros: 'Как связаны диагональ квадрата $d$ и его сторона $a$?',
          varianty: ['$d = a\\sqrt{2}$', '$d = 2a$', '$d = a\\sqrt{3}$'],
          verno: 0,
          vyvod: '$d^2 = a^2 + a^2 = 2a^2$. А $a\\sqrt{3}$ — диагональ всего куба.',
        },
        FORMULA_PRIZMY,
      ],
      uchitel: [
        { etap: 'Ребро', formuly: ['AB_1 = a\\sqrt{2} = 3\\sqrt{2} \\Rightarrow a = 3'] },
        { etap: 'Объём', formuly: ['V = a^3 = 27'] },
      ],
      uchenik: [
        { n: 2, chto: 'Диагональ грани — гипотенуза равнобедренного прямоугольного треугольника $ABB_1$, катеты — рёбра куба.' },
        { n: 5, chto: 'Диагональ квадрата в $\\sqrt{2}$ раз больше стороны — ребро равно $3$.', formula: 'a = \\dfrac{3\\sqrt{2}}{\\sqrt{2}} = 3' },
        { n: 4, chto: 'Объём куба — площадь основания на высоту, то есть ребро в кубе.', formula: 'V = 3^3 = 27' },
      ],
      pereschet: () => okr(polyhedronVolume(body) * ((3 * Math.SQRT2) / dist(v('A'), v('B1'))) ** 3),
    });
  }

  /* 7. Плоский чертёж: гипотенуза основания для боковой поверхности. */
  {
    const { body, v } = prizma512(8);
    const ploskie: PloskiyTreugolnik[] = [
      { vershiny: ['C', 'A', 'B'], kateti: [5, 12], podpisi: { a: '5', b: '12', c: '?' }, iskomoe: 'c', alt: 'Прямой угол при C, катеты AC = 5 и BC = 12, гипотенуза AB — искомая' },
      { vershiny: ['A', 'C', 'B'], kateti: [5, Math.sqrt(119)], podpisi: { a: '5', b: '?', c: '12' }, iskomoe: 'b', alt: 'Прямой угол при A, катет AC = 5, гипотенуза BC = 12, катет AB — искомый' },
      { vershiny: ['B', 'C', 'A'], kateti: [12, 5], podpisi: { a: '12', b: '?', c: '5' }, iskomoe: 'b', alt: 'Прямой угол при B, катет BC = 12, гипотенуза AC = 5, катет AB — искомый' },
    ];
    out.push({
      id: 'o3-4-07',
      kratko: 'Третья сторона основания',
      rabochaya: { points: [v('A'), v('C'), v('B')], pryamoy: v('C') },
      blok: 'obem',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'В основании прямой призмы $ABCA_1B_1C_1$ — прямоугольный треугольник с прямым углом $C$, $AC = 5$, $BC = 12$. Для боковой поверхности нужен периметр основания, а значит, сторона $AB$. Какой плоский чертёж — рабочий треугольник для $AB$?',
      model: {
        alt: 'Прямая треугольная призма ABCA₁B₁C₁, в основании AC = 5, BC = 12',
        view: 'cabinet',
        bodies: [body],
        measures: [
          { a: v('A'), b: v('C'), text: '5' },
          { a: v('C'), b: v('B'), text: '12' },
        ],
      },
      ploskie,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Где лежит треугольник со сторонами $AB$, $AC$ и $BC$?',
          varianty: ['Это само основание $ABC$', 'Это боковая грань $ABB_1A_1$', 'Это сечение через $A_1$'],
          verno: 0,
          vyvod: 'Рабочий треугольник — основание, его не надо искать в пространстве.',
        },
        {
          n: 4,
          vopros: 'Какая сторона основания — гипотенуза?',
          varianty: ['$AB$: она напротив прямого угла $C$', '$BC = 12$: она самая длинная из данных', '$AC = 5$'],
          verno: 0,
          vyvod: 'Гипотенуза лежит напротив прямого угла.',
        },
      ],
      uchitel: [{ etap: 'Основание', formuly: ['\\angle C = 90^\\circ \\Rightarrow AB\\ \\text{— гипотенуза},\\quad AC = 5,\\ BC = 12\\ \\text{— катеты}'] }],
      uchenik: [
        { n: 2, chto: 'Нужная сторона $AB$ лежит в основании, рабочий треугольник — само основание $ABC$.' },
        { n: 4, chto: 'Прямой угол при $C$, напротив него — гипотенуза $AB$. На втором чертеже прямой угол не там, на третьем гипотенуза короче катета.' },
      ],
      pereschet: () => {
        const ac = Math.round(dist(v('A'), v('C')));
        const bc = Math.round(dist(v('B'), v('C')));
        return String(ploskie.findIndex((p) => p.vershiny[0] === 'C' && p.podpisi.a === String(ac) && p.podpisi.b === String(bc)));
      },
    });
  }

  /* 8. Боковая поверхность прямой призмы: периметр на высоту. */
  {
    const { body, v } = prizma512(10);
    out.push({
      id: 'o3-4-08',
      kratko: 'Боковая поверхность призмы',
      rabochaya: { points: [v('A'), v('C'), v('B')], pryamoy: v('C') },
      blok: 'obem',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В основании прямой призмы $ABCA_1B_1C_1$ — прямоугольный треугольник с прямым углом $C$, $AC = 5$, $BC = 12$. Боковое ребро равно $10$. Найдите площадь боковой поверхности призмы.',
      model: {
        alt: 'Прямая треугольная призма ABCA₁B₁C₁: AC = 5, BC = 12, боковое ребро 10',
        view: 'cabinet',
        bodies: [body],
        measures: [
          { a: v('A'), b: v('C'), text: '5' },
          { a: v('C'), b: v('B'), text: '12' },
          { a: v('B'), b: v('B1'), text: '10' },
        ],
      },
      otvet: '300',
      podskazka: [
        BOKOVAYA,
        {
          n: 5,
          vopros: 'Чему равна сторона $AB$?',
          varianty: ['$13$', '$17$', '$7$'],
          verno: 0,
          vyvod: 'Тройка $5, 12, 13$: $AB$ — гипотенуза основания.',
        },
        {
          n: 5,
          vopros: 'Чему равен периметр основания?',
          varianty: ['$30$', '$17$', '$60$'],
          verno: 0,
          vyvod: 'Периметр — сумма трёх сторон; осталось умножить его на высоту.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AB = \\sqrt{5^2 + 12^2} = 13,\\quad P = 5 + 12 + 13 = 30'] },
        { etap: 'Боковая поверхность', formuly: ['S_{\\text{бок}} = P\\cdot h = 30\\cdot 10 = 300'] },
      ],
      uchenik: [
        { n: 4, chto: 'Призма прямая: боковые грани — прямоугольники высоты $10$, их площади в сумме — периметр на высоту.', formula: 'S_{\\text{бок}} = P\\cdot h' },
        { n: 2, chto: 'Не хватает стороны $AB$ — это гипотенуза основания.' },
        { n: 5, chto: 'Пифагорова тройка, затем периметр и умножение.', formula: 'AB = 13,\\quad S_{\\text{бок}} = (5 + 12 + 13)\\cdot 10 = 300' },
      ],
      pereschet: () => okr(bokovaya(body)),
    });
  }

  /* 9. Банк 1F4550: боковая поверхность отсечённой призмы. */
  {
    const { body, v, M, N, M1, N1, model } = sredLiniya(ALT_SRED);
    out.push({
      id: 'o3-4-09',
      kratko: 'Отсечённая призма: боковая поверхность',
      blok: 'obem',
      uroven: 3,
      istochnik: 'fipi',
      fipi: '1F4550',
      vid: 'chislo',
      uslovie:
        'Площадь боковой поверхности треугольной призмы равна $24$. Через среднюю линию основания призмы проведена плоскость, параллельная боковому ребру. Найдите площадь боковой поверхности отсечённой треугольной призмы.',
      model,
      otvet: '12',
      podskazka: [
        {
          n: 1,
          vopros: 'Какое тело отсекает плоскость $MNN_1M_1$?',
          varianty: ['Треугольную призму $CMNC_1M_1N_1$ с тем же боковым ребром', 'Пирамиду $CMNC_1$', 'Четырёхугольную призму'],
          verno: 0,
          vyvod: 'Плоскость параллельна боковому ребру, поэтому отсечённая часть — тоже призма с прежними боковыми рёбрами.',
        },
        {
          n: 2,
          vopros: 'Во сколько раз стороны треугольника $CMN$ меньше сторон треугольника $CAB$?',
          varianty: ['В $2$ раза', 'В $4$ раза', 'Они равны'],
          verno: 0,
          vyvod: '$CM$ и $CN$ — половины сторон, средняя линия $MN$ — половина $AB$.',
        },
        {
          n: 4,
          vopros: 'Боковые грани — параллелограммы с тем же боковым ребром. Как изменится боковая поверхность?',
          varianty: ['Уменьшится вдвое', 'Уменьшится вчетверо', 'Не изменится'],
          verno: 0,
          vyvod: 'Каждая боковая грань вдвое уже при той же высоте — и вся боковая поверхность вдвое меньше.',
        },
      ],
      uchitel: [
        { etap: 'Отсечённая часть', formuly: ['CM = \\tfrac{1}{2}CA,\\quad CN = \\tfrac{1}{2}CB,\\quad MN = \\tfrac{1}{2}AB'] },
        { etap: 'Боковая поверхность', formuly: ["S_{\\text{бок}}' = \\tfrac{1}{2}S_{\\text{бок}} = \\tfrac{1}{2}\\cdot 24 = 12"] },
      ],
      uchenik: [
        { n: 1, chto: 'Плоскость через $MN$ параллельна боковому ребру — она отсекает треугольную призму $CMNC_1M_1N_1$ с тем же боковым ребром.' },
        { n: 2, chto: 'Стороны её основания — половины сторон $CA$, $CB$ и (средняя линия) $AB$.' },
        {
          n: 4,
          chto: 'Каждая боковая грань — вдвое уже при той же высоте, значит, вся боковая поверхность вдвое меньше. Форма треугольника в основании не важна.',
          formula: "S_{\\text{бок}}' = 24 : 2 = 12",
        },
      ],
      pereschet: () => {
        const otsech =
          polygonArea([v('C'), M, M1, v('C1')]) + polygonArea([v('C'), N, N1, v('C1')]) + polygonArea([M, N, N1, M1]);
        return okr((24 * otsech) / bokovaya(body));
      },
    });
  }

  /* 10. Банк 5C9973: объём отсечённой призмы. */
  {
    const { body, v, M, N, M1, N1, model } = sredLiniya(ALT_SRED);
    out.push({
      id: 'o3-4-10',
      kratko: 'Отсечённая призма: объём',
      blok: 'obem',
      uroven: 3,
      istochnik: 'fipi',
      fipi: '5C9973',
      vid: 'chislo',
      uslovie:
        'Через среднюю линию основания треугольной призмы, объём которой равен $52$, проведена плоскость, параллельная боковому ребру. Найдите объём отсечённой треугольной призмы.',
      model,
      otvet: '13',
      podskazka: [
        FORMULA_PRIZMY,
        {
          n: 2,
          vopros: 'Какую часть площади треугольника $CAB$ составляет площадь треугольника $CMN$?',
          varianty: ['Четверть', 'Половину', 'Треть'],
          verno: 0,
          vyvod: 'Треугольники подобны с коэффициентом $\\frac{1}{2}$, площади относятся как квадрат коэффициента.',
        },
        {
          n: 5,
          vopros: 'Что с высотой отсечённой призмы?',
          varianty: ['Та же, что у исходной', 'Вдвое меньше', 'Вчетверо меньше'],
          verno: 0,
          vyvod: 'Основания лежат в тех же плоскостях — высота прежняя, меняется только площадь основания.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['\\triangle CMN \\sim \\triangle CAB,\\ k = \\tfrac{1}{2} \\Rightarrow S_{CMN} = \\tfrac{1}{4}S_{CAB}'] },
        { etap: 'Объём', formuly: ["V' = S_{CMN}\\cdot h = \\tfrac{1}{4}S_{CAB}\\cdot h = \\tfrac{1}{4}\\cdot 52 = 13"] },
      ],
      uchenik: [
        { n: 1, chto: 'Отсечённая часть — треугольная призма $CMNC_1M_1N_1$ с той же высотой.' },
        { n: 2, chto: 'Средняя линия отсекает треугольник, подобный исходному с коэффициентом $\\frac{1}{2}$: его площадь — четверть.' },
        {
          n: 4,
          chto: 'Объём призмы — площадь основания на высоту; высота та же, основание вчетверо меньше. Типичная ошибка — разделить на $2$, как боковую поверхность.',
          formula: "V' = 52 : 4 = 13",
        },
      ],
      pereschet: () => okr((52 * hullVolume([v('C'), M, N, v('C1'), M1, N1])) / polyhedronVolume(body)),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-4-${String(i + 1).padStart(2, '0')}` }));
}
