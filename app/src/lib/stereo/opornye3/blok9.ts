/**
 * Опорные задачи №3, блок 9 «Комбинации тел»: вписанные и описанные
 * тела через осевое сечение. Шар и куб, шар и цилиндр, конус в шаре,
 * призма и цилиндр, цилиндр в параллелепипеде. Три задачи — из
 * открытого банка ФИПИ (48EB9B, 1D9551, D5AC0C), остальные числа свои.
 *
 * У каждой задачи — пересчёт ответа по размерам тел того же чертежа
 * (pereschet): автотест сверяет его с ответом.
 */

import { box, regularPrism, vertex } from '../../solid/figures';
import type { Cone, Cylinder, Polyhedron, Sphere } from '../../solid/model';
import { ortho } from '../../solid/project';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const sred = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const SECHENIE: ShagPodskazki = {
  n: 2,
  vopros: 'С чего начинаем задачу на комбинацию тел?',
  varianty: [
    'Проводим сечение через ось или центр шара и рисуем его отдельно',
    'Сразу подставляем числа в формулу объёма',
    'Рисуем развёртку внешнего тела',
  ],
  verno: 0,
  vyvod: 'В сечении оба тела — плоские фигуры, и радиус одного виден как отрезок другого.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

/** Куб с ребром a и шар: вписанный (касается граней) или описанный (через вершины). */
function kubShar(a: number, opisannyy: boolean): { kub: Polyhedron; shar: Sphere; v: (n: string) => Vec3; O: Vec3; M: Vec3 } {
  const kub = box(a, a, a);
  const v = (n: string) => vertex(kub, n);
  const O = sred(v('A'), v('C1'));
  const M = sred(v('A'), v('C'));
  if (!opisannyy) kub.glass = true;
  const shar: Sphere = { kind: 'sphere', center: O, r: opisannyy ? (a * Math.sqrt(3)) / 2 : a / 2, glass: opisannyy };
  return { kub, shar, v, O, M };
}

/** Шар, описанный около цилиндра: O — центр шара, Q — центр верхнего основания, A — точка его окружности. */
function sharOkoloCilindra(r: number, h: number) {
  const cil: Cylinder = { kind: 'cylinder', base: [0, 0, 0], r, h };
  const O: Vec3 = [0, 0, h / 2];
  const Q: Vec3 = [0, 0, h];
  const A = ortho.circlePoint(Q, r, 0);
  const A0: Vec3 = [A[0], A[1], 0];
  const shar: Sphere = { kind: 'sphere', center: O, r: dist(O, A), glass: true };
  return { cil, shar, O, Q, A, A0 };
}

/** Правильная четырёхугольная призма, вписанная в цилиндр. */
function prizmaVCilindre(R: number, h: number) {
  const prizma = regularPrism(4, R, h);
  prizma.noFill = true;
  const cil: Cylinder = { kind: 'cylinder', base: [0, 0, 0], r: R, h, glass: true };
  const v = (n: string) => vertex(prizma, n);
  const O: Vec3 = [0, 0, 0];
  return { prizma, cil, v, O };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka9(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: радиус шара, вписанного в куб. */
  {
    const { kub, shar, v, O, M } = kubShar(6, false);
    const A = v('A');
    const celi = [
      { id: 'OM', points: [O, M], label: '$OM$' },
      { id: 'AM', points: [A, M], label: '$AM$' },
      { id: 'OA', points: [O, A], label: '$OA$' },
    ];
    out.push({
      id: 'o3-9-01',
      kratko: 'Радиус шара в кубе',
      rabochaya: { points: [O, M, A], pryamoy: M },
      blok: 'kombinacii',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Шар вписан в куб $ABCDA_1B_1C_1D_1$, $O$ — центр шара, $M$ — центр грани $ABCD$. Нажмите на чертеже на отрезок, равный радиусу шара.',
      model: {
        alt: 'Шар с центром O, вписанный в куб ABCDA₁B₁C₁D₁; M — центр нижней грани; проведены отрезки OM, AM и OA',
        bodies: [kub, shar],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: O, b: M },
          { a: A, b: M },
          { a: O, b: A },
        ],
      },
      celi,
      otvet: 'OM',
      podskazka: [
        {
          n: 2,
          vopros: 'Чего касается шар, вписанный в куб?',
          varianty: ['Каждой грани куба', 'Каждой вершины куба', 'Каждого ребра куба'],
          verno: 0,
          vyvod: 'Радиус вписанного шара — расстояние от центра до грани.',
        },
        {
          n: 3,
          vopros: 'Какой отрезок из $O$ перпендикулярен грани $ABCD$?',
          varianty: ['Отрезок к центру грани', 'Отрезок к вершине', 'Отрезок к середине ребра'],
          verno: 0,
          vyvod: 'Перпендикуляр из центра куба падает в центр грани.',
        },
      ],
      uchitel: [
        { etap: 'Вписанный шар', formuly: ['OM \\perp (ABC),\\quad R = OM = \\frac{a}{2}'] },
        { etap: 'Ловушки', formuly: ['AM = \\frac{a\\sqrt2}{2},\\quad OA = \\frac{a\\sqrt3}{2}'] },
      ],
      uchenik: [
        { n: 2, chto: 'Сечение через центр параллельно грани — круг, вписанный в квадрат: диаметр шара равен ребру.' },
        {
          n: 3,
          chto: 'Шар касается грани $ABCD$ в её центре $M$, поэтому радиус — $OM$. $AM$ — половина диагонали грани, $OA$ — половина диагонали куба: это радиус описанного шара.',
          formula: 'R = OM = \\frac{a}{2}',
        },
      ],
      pereschet: () => {
        const r = O[2] - A[2];
        return celi.find((c) => near(dist(c.points[0] as Vec3, c.points[1] as Vec3), r))?.id ?? '';
      },
    });
  }

  /* 2. Выбор: радиус шара, описанного около куба. */
  {
    const { kub, shar, v, O } = kubShar(4, true);
    const varianty = ['$\\frac{a\\sqrt3}{2}$', '$\\frac{a}{2}$', '$\\frac{a\\sqrt2}{2}$', '$a\\sqrt3$'];
    const kef = [Math.sqrt(3) / 2, 1 / 2, Math.SQRT2 / 2, Math.sqrt(3)];
    out.push({
      id: 'o3-9-02',
      kratko: 'Шар около куба',
      rabochaya: { points: [v('A'), v('C'), v('C1')], pryamoy: v('C') },
      blok: 'kombinacii',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'Чему равен радиус шара, описанного около куба с ребром $a$?',
      model: {
        alt: 'Шар с центром O, описанный около куба ABCDA₁B₁C₁D₁; проведена диагональ куба AC₁',
        bodies: [shar, kub],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: v('A'), b: v('C1') }],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Через какие точки куба проходит описанный шар?',
          varianty: ['Через все вершины', 'Через центры граней', 'Через середины рёбер'],
          verno: 0,
          vyvod: 'Диаметр описанного шара соединяет противоположные вершины — это диагональ куба $AC_1$.',
        },
        {
          n: 3,
          vopros: 'В каком прямоугольном треугольнике $AC_1$ — гипотенуза?',
          varianty: ['$ACC_1$: ребро $CC_1$ перпендикулярно основанию', '$ABC$: угол $B$ прямой'],
          verno: 0,
          vyvod: 'Катеты — диагональ грани $a\\sqrt2$ и ребро $a$.',
        },
        {
          n: 5,
          vopros: 'Чему равна диагональ куба $AC_1$?',
          varianty: ['$a\\sqrt3$', '$a\\sqrt2$', '$2a$'],
          verno: 0,
          vyvod: '$AC_1^2 = 2a^2 + a^2 = 3a^2$. Радиус — половина диагонали.',
        },
      ],
      uchitel: [
        { etap: 'Диагональ куба', formuly: ['AC_1^2 = AC^2 + CC_1^2 = 2a^2 + a^2 = 3a^2,\\quad AC_1 = a\\sqrt3'] },
        { etap: 'Радиус', formuly: ['R = \\frac{AC_1}{2} = \\frac{a\\sqrt3}{2}'] },
      ],
      uchenik: [
        { n: 2, chto: 'Описанный шар проходит через все вершины куба, его центр — середина диагонали $AC_1$. Значит, диаметр — диагональ куба.' },
        { n: 3, chto: 'Треугольник $ACC_1$ прямоугольный: $CC_1$ перпендикулярно основанию.', formula: '\\angle ACC_1 = 90^\\circ' },
        {
          n: 5,
          chto: '$\\frac{a}{2}$ — радиус вписанного шара, $\\frac{a\\sqrt2}{2}$ — половина диагонали грани, $a\\sqrt3$ — весь диаметр.',
          formula: 'R = \\frac{a\\sqrt3}{2}',
        },
      ],
      pereschet: () => {
        const a = dist(v('A'), v('B'));
        const R = dist(O, v('A'));
        return String(kef.findIndex((k) => near(k * a, R)));
      },
    });
  }

  /* 3. Банк 48EB9B: шар в цилиндре, объём цилиндра. */
  {
    const cil: Cylinder = { kind: 'cylinder', base: [0, 0, 0], r: 2, h: 4, glass: true };
    const shar: Sphere = { kind: 'sphere', center: [0, 0, 2], r: 2 };
    out.push({
      id: 'o3-9-03',
      kratko: 'Шар в цилиндре',
      blok: 'kombinacii',
      uroven: 1,
      istochnik: 'fipi',
      fipi: '48EB9B',
      vid: 'chislo',
      uslovie: 'Шар, объём которого равен $24$, вписан в цилиндр. Найдите объём цилиндра.',
      model: {
        alt: 'Шар с центром O, вписанный в цилиндр: шар касается обоих оснований и боковой поверхности',
        bodies: [cil, shar],
        marks: [{ p: shar.center, label: 'O' }],
      },
      otvet: '36',
      podskazka: [
        {
          n: 2,
          vopros: 'Что получится в осевом сечении?',
          varianty: ['Круг, вписанный в квадрат', 'Круг в прямоугольнике $1 \\times 2$', 'Квадрат, вписанный в круг'],
          verno: 0,
          vyvod: 'Сторона квадрата равна диаметру круга.',
        },
        {
          n: 4,
          vopros: 'Чему равны радиус $r$ и высота $h$ цилиндра через радиус шара $R$?',
          varianty: ['$r = R$, $h = 2R$', '$r = R$, $h = R$', '$r = 2R$, $h = 2R$'],
          verno: 0,
          vyvod: '$V_{\\text{ц}} = \\pi R^2\\cdot 2R = 2\\pi R^3$, а $V_{\\text{ш}} = \\frac43\\pi R^3$.',
        },
        {
          n: 5,
          vopros: 'Во сколько раз объём цилиндра больше объёма шара?',
          varianty: ['В $\\frac32$ раза', 'В $2$ раза', 'В $\\frac43$ раза'],
          verno: 0,
          vyvod: '$2 : \\frac43 = \\frac32$ — радиус шара даже не нужен.',
        },
      ],
      uchitel: [
        { etap: 'Осевое сечение', formuly: ['r = R,\\quad h = 2R'] },
        { etap: 'Отношение объёмов', formuly: ['\\frac{V_{\\text{ц}}}{V_{\\text{ш}}} = \\frac{\\pi R^2\\cdot 2R}{\\frac43\\pi R^3} = \\frac32', 'V_{\\text{ц}} = 24\\cdot\\frac32 = 36'] },
      ],
      uchenik: [
        { n: 2, chto: 'Осевое сечение — круг, вписанный в квадрат: шар касается обоих оснований и боковой поверхности.' },
        { n: 4, chto: 'Радиус цилиндра равен радиусу шара, высота — диаметру.', formula: 'V_{\\text{ц}} = \\pi R^2\\cdot 2R = 2\\pi R^3' },
        { n: 5, chto: 'Делим один объём на другой: $\\pi R^3$ сокращается.', formula: 'V_{\\text{ц}} = \\frac32\\cdot 24 = 36' },
      ],
      pereschet: () => okr((24 * (Math.PI * cil.r ** 2 * cil.h)) / ((4 / 3) * Math.PI * shar.r ** 3)),
    });
  }

  /* 4. Объём куба по радиусу вписанного шара. */
  {
    const { kub, shar, v, O, M } = kubShar(6, false);
    out.push({
      id: 'o3-9-04',
      kratko: 'Куб около шара',
      rabochaya: { points: [O, M, v('A')], pryamoy: M },
      blok: 'kombinacii',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Шар радиуса $3$ вписан в куб. Найдите объём куба.',
      model: {
        alt: 'Шар с центром O, вписанный в куб; радиус OM к центру нижней грани равен 3',
        bodies: [kub, shar],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [{ a: O, b: M }],
        measures: [{ a: O, b: M, text: '3' }],
      },
      otvet: '216',
      podskazka: [
        SECHENIE,
        {
          n: 4,
          vopros: 'Как связаны ребро куба $a$ и радиус вписанного шара $R$?',
          varianty: ['$a = 2R$', '$a = R$', '$a = R\\sqrt2$'],
          verno: 0,
          vyvod: 'В сечении круг вписан в квадрат: диаметр круга равен стороне квадрата.',
        },
        {
          n: 5,
          vopros: 'Чему равно ребро куба?',
          varianty: ['$6$', '$3$', '$3\\sqrt2$'],
          verno: 0,
          vyvod: 'Осталось возвести ребро в куб.',
        },
      ],
      uchitel: [
        { etap: 'Сечение', formuly: ['a = 2R = 6'] },
        { etap: 'Объём', formuly: ['V = a^3 = 6^3 = 216'] },
      ],
      uchenik: [
        { n: 2, chto: 'Сечение через центр шара параллельно грани — круг в квадрате со стороной $a$.' },
        { n: 4, chto: 'Шар касается противоположных граней: между ними — диаметр.', formula: 'a = 2R = 6' },
        { n: 5, chto: 'Объём куба — куб ребра. Частая ошибка — взять ребро равным радиусу.', formula: 'V = 6^3 = 216' },
      ],
      pereschet: () => okr(dist(v('A'), v('B')) * dist(v('B'), v('C')) * dist(v('C'), v('C1'))),
    });
  }

  /* 5. Плоский чертёж: шар около цилиндра, r = 3, h = 8. */
  {
    const { cil, shar, O, Q, A, A0 } = sharOkoloCilindra(3, 8);
    const ploskie: PloskiyTreugolnik[] = [
      { vershiny: ['Q', 'O', 'A'], kateti: [4, 3], podpisi: { a: '4', b: '3', c: '?' }, iskomoe: 'c', alt: 'Прямой угол при Q, катеты OQ = 4 и QA = 3, гипотенуза OA — искомая' },
      { vershiny: ['Q', 'O', 'A'], kateti: [8, 3], podpisi: { a: '8', b: '3', c: '?' }, iskomoe: 'c', alt: 'Прямой угол при Q, катеты OQ = 8 и QA = 3, гипотенуза OA — искомая' },
      { vershiny: ['Q', 'O', 'A'], kateti: [4, 6], podpisi: { a: '4', b: '6', c: '?' }, iskomoe: 'c', alt: 'Прямой угол при Q, катеты OQ = 4 и QA = 6, гипотенуза OA — искомая' },
    ];
    out.push({
      id: 'o3-9-05',
      kratko: 'Сечение: шар около цилиндра',
      rabochaya: { points: [O, Q, A], pryamoy: Q },
      blok: 'kombinacii',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'Шар описан около цилиндра с радиусом основания $3$ и высотой $8$. $O$ — центр шара, $Q$ — центр верхнего основания, $A$ — точка окружности верхнего основания. Какой плоский чертёж — рабочий треугольник для радиуса шара $OA$?',
      model: {
        alt: 'Цилиндр с радиусом 3 и высотой 8, вписанный в шар с центром O; Q — центр верхнего основания, A — точка его окружности; проведены OQ, QA и OA',
        bodies: [cil, shar],
        marks: [
          { p: O, label: 'O' },
          { p: Q, label: 'Q' },
          { p: A, label: 'A' },
        ],
        lines: [
          { a: O, b: Q },
          { a: Q, b: A },
          { a: O, b: A },
        ],
        measures: [
          { a: Q, b: A, text: '3' },
          { a: A0, b: A, text: '8' },
        ],
      },
      ploskie,
      otvet: '0',
      podskazka: [
        {
          n: 2,
          vopros: 'Где лежит центр шара, описанного около цилиндра?',
          varianty: ['В середине оси цилиндра', 'В центре нижнего основания', 'В центре верхнего основания'],
          verno: 0,
          vyvod: 'Значит, $OQ$ — половина высоты цилиндра.',
        },
        {
          n: 3,
          vopros: 'Почему угол $OQA$ прямой?',
          varianty: ['Ось цилиндра перпендикулярна основанию, а $QA$ лежит в основании', 'Треугольник $OQA$ равнобедренный'],
          verno: 0,
          vyvod: 'Гипотенуза — радиус шара $OA$, катеты — $OQ$ и радиус основания $QA$.',
        },
        {
          n: 4,
          vopros: 'Чему равен катет $QA$?',
          varianty: ['Радиусу основания', 'Диаметру основания', 'Высоте цилиндра'],
          verno: 0,
          vyvod: 'На чертеже $3$ — радиус, а не диаметр; $8$ — вся высота, а не её половина.',
        },
      ],
      uchitel: [
        { etap: 'Осевое сечение', formuly: ['\\text{прямоугольник } 6 \\times 8\\ \\text{в круге}'] },
        { etap: 'Рабочий треугольник $OQA$', formuly: ['\\angle OQA = 90^\\circ,\\quad OQ = \\frac{h}{2} = 4,\\quad QA = r = 3'] },
      ],
      uchenik: [
        { n: 2, chto: 'Осевое сечение — прямоугольник, вписанный в круг. Центр шара — середина оси, до верхнего основания — половина высоты.' },
        { n: 3, chto: 'Ось перпендикулярна основанию, радиус $QA$ лежит в нём: прямой угол при $Q$.', formula: '\\angle OQA = 90^\\circ' },
        { n: 4, chto: 'Катеты $4$ и $3$, гипотенуза — радиус шара. На втором чертеже взята вся высота, на третьем — диаметр вместо радиуса.' },
      ],
      pereschet: () => String(ploskie.findIndex((p) => near(Math.hypot(...p.kateti), shar.r))),
    });
  }

  /* 6. Нажми: радиус цилиндра, описанного около призмы. */
  {
    const { prizma, cil, v, O } = prizmaVCilindre(4, 6);
    const A = v('A');
    const M = sred(A, v('B'));
    const celi = [
      { id: 'OM', points: [O, M], label: '$OM$' },
      { id: 'OA', points: [O, A], label: '$OA$' },
      { id: 'AC', points: [A, v('C')], label: '$AC$' },
    ];
    out.push({
      id: 'o3-9-06',
      kratko: 'Радиус цилиндра около призмы',
      rabochaya: { points: [O, M, A], pryamoy: M },
      blok: 'kombinacii',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Правильная четырёхугольная призма $ABCDA_1B_1C_1D_1$ вписана в цилиндр. $O$ — центр основания $ABCD$, $M$ — середина ребра $AB$. Нажмите на отрезок, равный радиусу основания цилиндра.',
      model: {
        alt: 'Правильная четырёхугольная призма, вписанная в цилиндр; O — центр нижнего основания, M — середина AB; проведены OM, OA и AC',
        bodies: [cil, prizma],
        marks: [
          { p: O, label: 'O' },
          { p: M, label: 'M' },
        ],
        lines: [
          { a: O, b: M },
          { a: O, b: A },
          { a: A, b: v('C') },
        ],
      },
      celi,
      otvet: 'OA',
      podskazka: [
        {
          n: 2,
          vopros: 'Что получится в сечении нижним основанием?',
          varianty: ['Квадрат, вписанный в круг', 'Круг, вписанный в квадрат', 'Квадрат и круг не связаны'],
          verno: 0,
          vyvod: 'Вершины квадрата лежат на окружности основания цилиндра.',
        },
        {
          n: 4,
          vopros: 'Какой отрезок соединяет центр круга с точкой окружности?',
          varianty: ['Отрезок к вершине квадрата', 'Отрезок к середине стороны', 'Диагональ квадрата'],
          verno: 0,
          vyvod: 'Радиус описанной окружности — половина диагонали квадрата.',
        },
      ],
      uchitel: [
        { etap: 'Сечение основанием', formuly: ['A,\\ B,\\ C,\\ D\\ \\text{лежат на окружности с центром } O'] },
        { etap: 'Радиус', formuly: ['r = OA = \\frac{AC}{2}'] },
      ],
      uchenik: [
        { n: 2, chto: 'Призма вписана в цилиндр — её основание вписано в основание цилиндра: квадрат в круге.' },
        {
          n: 4,
          chto: 'Радиус — от центра до вершины: $OA$. $OM$ — радиус круга, вписанного в квадрат (так было бы для цилиндра внутри призмы), $AC$ — весь диаметр.',
          formula: 'r = OA',
        },
      ],
      pereschet: () => {
        const r = Math.hypot(A[0] - cil.base[0], A[1] - cil.base[1]);
        return celi.find((c) => near(dist(c.points[0] as Vec3, c.points[1] as Vec3), r))?.id ?? '';
      },
    });
  }

  /* 7. Банк 1D9551: конус в шаре, объём шара. */
  {
    const shar: Sphere = { kind: 'sphere', center: [0, 0, 0], r: 3, glass: true };
    const konus: Cone = { kind: 'cone', base: [0, 0, 0], r: 3, h: 3 };
    const O: Vec3 = [0, 0, 0];
    const S: Vec3 = [0, 0, 3];
    const A = ortho.circlePoint(O, 3, 0);
    out.push({
      id: 'o3-9-07',
      kratko: 'Конус в шаре',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'kombinacii',
      uroven: 2,
      istochnik: 'fipi',
      fipi: '1D9551',
      vid: 'chislo',
      uslovie: 'Конус вписан в шар. Радиус основания конуса равен радиусу шара. Объём конуса равен $12$. Найдите объём шара.',
      model: {
        alt: 'Конус с вершиной S, вписанный в шар с центром O: основание конуса — большой круг шара; проведены высота SO и радиус OA',
        bodies: [shar, konus],
        marks: [
          { p: O, label: 'O' },
          { p: S, label: 'S' },
          { p: A, label: 'A' },
        ],
        lines: [
          { a: S, b: O },
          { a: O, b: A },
        ],
      },
      otvet: '48',
      podskazka: [
        {
          n: 2,
          vopros: 'Радиус основания конуса равен радиусу шара. Где тогда центр шара?',
          varianty: ['В центре основания конуса', 'В середине высоты конуса', 'В вершине конуса'],
          verno: 0,
          vyvod: 'Основание конуса — большой круг шара, в осевом сечении треугольник опирается на диаметр.',
        },
        {
          n: 4,
          vopros: 'Чему равна высота конуса $SO$?',
          varianty: ['$R$', '$2R$', '$R\\sqrt2$'],
          verno: 0,
          vyvod: 'Вершина $S$ лежит на шаре, а $O$ — его центр.',
        },
        {
          n: 5,
          vopros: 'Во сколько раз объём шара больше объёма конуса?',
          varianty: ['В $4$ раза', 'В $\\frac43$ раза', 'В $2$ раза'],
          verno: 0,
          vyvod: '$\\frac43\\pi R^3 : \\frac13\\pi R^3 = 4$.',
        },
      ],
      uchitel: [
        { etap: 'Осевое сечение', formuly: ['r = R,\\quad h = SO = R'] },
        { etap: 'Отношение объёмов', formuly: ['V_{\\text{к}} = \\frac13\\pi R^2\\cdot R = \\frac13\\pi R^3,\\quad V_{\\text{ш}} = \\frac43\\pi R^3 = 4V_{\\text{к}}', 'V_{\\text{ш}} = 4\\cdot 12 = 48'] },
      ],
      uchenik: [
        { n: 2, chto: 'Осевое сечение — треугольник в круге, его основание — диаметр. Центр шара $O$ — центр основания конуса.' },
        { n: 4, chto: 'Высота $SO$ — радиус шара: от центра до точки шара.', formula: 'h = R' },
        { n: 5, chto: 'Сравниваем формулы: в обеих $\\pi R^3$, коэффициенты $\\frac43$ и $\\frac13$.', formula: 'V_{\\text{ш}} = 4\\cdot 12 = 48' },
      ],
      pereschet: () => okr((12 * ((4 / 3) * Math.PI * shar.r ** 3)) / ((1 / 3) * Math.PI * konus.r ** 2 * dist(S, O))),
    });
  }

  /* 8. Банк D5AC0C: цилиндр в параллелепипеде. */
  {
    const r = 2;
    const h = 2;
    const kor = box(2 * r, 2 * r, h);
    kor.glass = true;
    const v = (n: string) => vertex(kor, n);
    const O1: Vec3 = [r, r, h];
    const T = ortho.circlePoint(O1, r, 0);
    const cil: Cylinder = { kind: 'cylinder', base: [r, r, 0], r, h };
    out.push({
      id: 'o3-9-08',
      kratko: 'Цилиндр в параллелепипеде',
      blok: 'kombinacii',
      uroven: 2,
      istochnik: 'fipi',
      fipi: 'D5AC0C',
      vid: 'chislo',
      uslovie:
        'Цилиндр вписан в прямоугольный параллелепипед. Радиус основания и высота цилиндра равны $2$. Найдите объём параллелепипеда.',
      model: {
        alt: 'Цилиндр, вписанный в прямоугольный параллелепипед: окружности оснований касаются сторон квадратов; радиус равен 2',
        bodies: [kor, cil],
        lines: [{ a: O1, b: T }],
        measures: [{ a: O1, b: T, text: '2' }],
      },
      otvet: '32',
      podskazka: [
        {
          n: 2,
          vopros: 'Что в основании параллелепипеда?',
          varianty: ['Квадрат, в который вписан круг основания', 'Прямоугольник любых размеров', 'Квадрат, вписанный в круг'],
          verno: 0,
          vyvod: 'Круг касается всех четырёх сторон — значит, это квадрат со стороной, равной диаметру.',
        },
        {
          n: 4,
          vopros: 'Какие размеры у параллелепипеда?',
          varianty: ['$4 \\times 4 \\times 2$', '$2 \\times 2 \\times 2$', '$4 \\times 4 \\times 4$'],
          verno: 0,
          vyvod: 'Сторона основания — диаметр, высота — высота цилиндра.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['a = 2r = 4'] },
        { etap: 'Объём', formuly: ['V = a^2\\cdot h = 4^2\\cdot 2 = 32'] },
      ],
      uchenik: [
        { n: 2, chto: 'Сечение основанием — круг, вписанный в квадрат: сторона квадрата равна диаметру.' },
        { n: 4, chto: 'Высота параллелепипеда равна высоте цилиндра: основания лежат в одних плоскостях.', formula: 'a = 4,\\quad h = 2' },
        { n: 5, chto: 'Объём — площадь основания на высоту. Ошибка — взять сторону равной радиусу.', formula: 'V = 16\\cdot 2 = 32' },
      ],
      pereschet: () => okr(dist(v('A'), v('B')) * dist(v('B'), v('C')) * dist(v('C'), v('C1'))),
    });
  }

  /* 9. Цилиндр около правильной призмы: объём, делённый на π. */
  {
    const { prizma, cil, v } = prizmaVCilindre(3 * Math.SQRT2, 5);
    out.push({
      id: 'o3-9-09',
      kratko: 'Цилиндр около призмы',
      rabochaya: { points: [v('A'), v('B'), v('C')], pryamoy: v('B') },
      blok: 'kombinacii',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Правильная четырёхугольная призма вписана в цилиндр. Сторона основания призмы равна $6$, высота — $5$. Найдите объём цилиндра, делённый на $\\pi$.',
      model: {
        alt: 'Правильная четырёхугольная призма ABCDA₁B₁C₁D₁ со стороной основания 6 и высотой 5, вписанная в цилиндр',
        bodies: [cil, prizma],
        measures: [
          { a: v('A'), b: v('B'), text: '6' },
          { a: v('A'), b: v('A1'), text: '5' },
        ],
      },
      otvet: '90',
      podskazka: [
        {
          n: 2,
          vopros: 'Каким отрезком квадрата служит диаметр основания цилиндра?',
          varianty: ['Диагональю', 'Стороной', 'Половиной стороны'],
          verno: 0,
          vyvod: 'Квадрат вписан в круг: его вершины на окружности, диагональ — диаметр.',
        },
        {
          n: 3,
          vopros: 'Почему $AC^2 = AB^2 + BC^2$?',
          varianty: ['Угол $ABC$ квадрата прямой', 'Диагонали квадрата равны'],
          verno: 0,
          vyvod: 'Можно считать сразу квадрат радиуса, без корней.',
        },
        {
          n: 5,
          vopros: 'Чему равен $r^2$?',
          varianty: ['$18$', '$9$', '$36$'],
          verno: 0,
          vyvod: '$AC^2 = 72$, $r^2 = \\frac{AC^2}{4}$. Высота цилиндра — высота призмы.',
        },
      ],
      uchitel: [
        { etap: 'Радиус', formuly: ['AC^2 = 6^2 + 6^2 = 72,\\quad r^2 = \\frac{AC^2}{4} = 18'] },
        { etap: 'Объём', formuly: ['V = \\pi r^2 h = 18\\cdot 5\\cdot\\pi = 90\\pi,\\quad \\frac{V}{\\pi} = 90'] },
      ],
      uchenik: [
        { n: 2, chto: 'Сечение основанием — квадрат, вписанный в круг: радиус — половина диагонали.' },
        { n: 3, chto: 'Диагональ квадрата — гипотенуза треугольника $ABC$ с прямым углом при $B$.', formula: 'AC^2 = 36 + 36 = 72' },
        { n: 5, chto: 'Корень не нужен: в формулу объёма входит $r^2$. Ошибка — взять $r = 3$, как у вписанного цилиндра.', formula: 'r^2 = 18,\\quad \\frac{V}{\\pi} = 18\\cdot 5 = 90' },
      ],
      pereschet: () => okr((dist(v('A'), v('C')) / 2) ** 2 * dist(v('A'), v('A1'))),
    });
  }

  /* 10. Шар около цилиндра: площадь поверхности, делённая на π. */
  {
    const { cil, shar, O, Q, A, A0 } = sharOkoloCilindra(3, 8);
    out.push({
      id: 'o3-9-10',
      kratko: 'Шар около цилиндра',
      rabochaya: { points: [O, Q, A], pryamoy: Q },
      blok: 'kombinacii',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Шар описан около цилиндра. Радиус основания цилиндра равен $3$, высота — $8$. Найдите площадь поверхности шара, делённую на $\\pi$.',
      model: {
        alt: 'Цилиндр с радиусом основания 3 и высотой 8, вписанный в шар с центром O',
        bodies: [cil, shar],
        marks: [{ p: O, label: 'O' }],
        measures: [
          { a: Q, b: A, text: '3' },
          { a: A0, b: A, text: '8' },
        ],
      },
      otvet: '100',
      podskazka: [
        SECHENIE,
        {
          n: 3,
          vopros: 'В каком прямоугольном треугольнике радиус шара — гипотенуза?',
          varianty: [
            'Центр шара, центр верхнего основания и точка его окружности',
            'Центр шара и концы диаметра основания',
            'Центры оснований и точка окружности',
          ],
          verno: 0,
          vyvod: 'Катеты — половина высоты и радиус основания; прямой угол — при центре основания.',
        },
        {
          n: 5,
          vopros: 'Чему равен радиус шара $R$?',
          varianty: ['$5$', '$\\sqrt{73}$', '$7$'],
          verno: 0,
          vyvod: 'Катеты $4$ и $3$ — египетский треугольник. Площадь сферы — $4\\pi R^2$.',
        },
      ],
      uchitel: [
        { etap: 'Осевое сечение', formuly: ['\\text{прямоугольник } 6 \\times 8\\ \\text{в круге}'] },
        { etap: 'Рабочий треугольник', formuly: ['R^2 = \\left(\\frac{h}{2}\\right)^2 + r^2 = 16 + 9 = 25,\\quad R = 5'] },
        { etap: 'Площадь', formuly: ['S = 4\\pi R^2 = 100\\pi,\\quad \\frac{S}{\\pi} = 100'] },
      ],
      uchenik: [
        { n: 2, chto: 'Осевое сечение — прямоугольник $6 \\times 8$, вписанный в круг; центр шара — середина оси цилиндра.' },
        { n: 3, chto: 'Ось перпендикулярна основанию: треугольник из центра шара, центра верхнего основания и точки окружности — прямоугольный.' },
        { n: 5, chto: 'Половина высоты — $4$, радиус основания — $3$, гипотенуза — $5$. Сразу $R^2 = 25$.', formula: 'S = 4\\pi\\cdot 25 = 100\\pi' },
      ],
      pereschet: () => okr(4 * dist(O, A) ** 2),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-9-${String(i + 1).padStart(2, '0')}` }));
}
