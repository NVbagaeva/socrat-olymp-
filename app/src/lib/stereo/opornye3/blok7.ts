/**
 * Опорные задачи №3, блок 7 «Цилиндр, конус, шар». Умение — читать и
 * считать: найти на чертеже высоту, радиус и образующую, выбрать
 * формулу поверхности или объёма и посчитать ответ, часто в единицах
 * пи. Рабочая фигура конуса — половина осевого сечения, треугольник
 * SOA с прямым углом при центре основания.
 *
 * Три задачи — из открытого банка ФИПИ (FcFB97, 135723, 37164B).
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): окружность — вписанный многоугольник, поверхности —
 * суммы площадей; автотест сверяет пересчёт с ответом.
 */

import type { Cone, Cylinder, Model, Sphere } from '../../solid/model';
import { ortho } from '../../solid/project';
import type { Vec3 } from '../../solid/vec';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const same = (a: Vec3, b: Vec3) => dist(a, b) < 1e-9;

/* ── Счёт по чертежу: окружность и поверхности многоугольником ───── */

const N_TOCHEK = 100000;

/** Точки окружности тела вращения: вписанный N-угольник. */
function okruzhnost(c: Vec3, r: number, n = N_TOCHEK): Vec3[] {
  return Array.from({ length: n }, (_, k) => ortho.circlePoint(c, r, (2 * Math.PI * k) / n));
}

/** Длина замкнутой ломаной. */
function perimetr(pts: readonly Vec3[]): number {
  return pts.reduce((s, p, k) => s + dist(p, pts[(k + 1) % pts.length] as Vec3), 0);
}

/** Площадь треугольника по координатам. */
function ploshchadTr(a: Vec3, b: Vec3, c: Vec3): number {
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return Math.hypot(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]) / 2;
}

/** Веер треугольников от точки к замкнутой ломаной: боковая поверхность конуса или круг. */
function veer(S: Vec3, pts: readonly Vec3[]): number {
  return pts.reduce((s, p, k) => s + ploshchadTr(S, p, pts[(k + 1) % pts.length] as Vec3), 0);
}

/* ── Чертежи ────────────────────────────────────────────────────── */

/** Конус: вершина S над центром O, A и B — концы диаметра основания. */
function konus(r: number, h: number) {
  const O: Vec3 = [0, 0, 0];
  const telo: Cone = { kind: 'cone', base: O, r, h };
  const S: Vec3 = [0, 0, h];
  const A = ortho.circlePoint(O, r, 0);
  const B = ortho.circlePoint(O, r, Math.PI);
  return { O, S, A, B, telo };
}

/** Конус с рабочим треугольником SOA и числами на чертеже. */
function konusSOA(r: number, h: number, { alt }: { alt: string }, chisla: { SO?: string; OA?: string; SA?: string }) {
  const k = konus(r, h);
  const { O, S, A } = k;
  const measures = [
    ...(chisla.SO === undefined ? [] : [{ a: S, b: O, text: chisla.SO }]),
    ...(chisla.OA === undefined ? [] : [{ a: O, b: A, text: chisla.OA }]),
    ...(chisla.SA === undefined ? [] : [{ a: S, b: A, text: chisla.SA }]),
  ];
  const model: Model = {
    alt,
    bodies: [k.telo],
    marks: [
      { p: S, label: 'S' },
      { p: O, label: 'O' },
      { p: A, label: 'A' },
    ],
    lines: [
      { a: S, b: O },
      { a: O, b: A },
      { a: S, b: A },
    ],
    ...(measures.length > 0 ? { measures } : {}),
  };
  return { ...k, model };
}

/** Цилиндр и конус с общим основанием и общей высотой, h = r. */
function cilindrIKonus(r: number) {
  const O: Vec3 = [0, 0, 0];
  const S: Vec3 = [0, 0, r];
  const A = ortho.circlePoint(O, r, 0);
  const cil: Cylinder = { kind: 'cylinder', base: O, r, h: r, glass: true };
  const kon: Cone = { kind: 'cone', base: O, r, h: r, hideBase: true };
  const model: Model = {
    alt: 'Цилиндр и конус с общим основанием и общей высотой: вершина конуса S — центр верхнего основания цилиндра, высота h и радиус r',
    bodies: [cil, kon],
    marks: [
      { p: S, label: 'S' },
      { p: O, label: 'O' },
      { p: A, label: 'A' },
    ],
    lines: [
      { a: S, b: O, label: 'h' },
      { a: O, b: A, label: 'r' },
      { a: S, b: A },
    ],
  };
  return { O, S, A, kon, model };
}

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const PRYAMOY_SOA: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол $SOA$ прямой?',
  varianty: [
    'Высота $SO$ перпендикулярна плоскости основания, а $OA$ лежит в этой плоскости',
    'Треугольник $SOA$ равнобедренный',
    'На чертеже угол выглядит прямым',
  ],
  verno: 0,
  vyvod: 'Высота конуса перпендикулярна любой прямой в плоскости основания.',
};

const V_BLANK: ShagPodskazki = {
  n: 5,
  vopros: 'Что писать в бланк, если просят ответ, делённый на $\\pi$?',
  varianty: ['Коэффициент перед $\\pi$', 'Число, подставив $\\pi \\approx 3{,}14$'],
  verno: 0,
  vyvod: '$\\pi$ оставляем множителем до конца и пишем число перед ним.',
};

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka7(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: образующая конуса на осевом сечении. */
  {
    const { O, S, A, B, telo } = konus(4, 6);
    const celi = [
      { id: 'SO', points: [S, O], label: '$SO$' },
      { id: 'OA', points: [O, A], label: '$OA$' },
      { id: 'SA', points: [S, A], label: '$SA$' },
    ];
    out.push({
      id: 'o3-7-01',
      kratko: 'Образующая конуса',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vrashcheniya',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie: 'На чертеже — конус и его осевое сечение $SAB$, точка $O$ — центр основания. Нажмите на образующую конуса.',
      model: {
        alt: 'Конус с вершиной S и центром основания O, осевое сечение SAB и отрезок SO',
        bodies: [telo],
        marks: [
          { p: S, label: 'S' },
          { p: O, label: 'O' },
          { p: A, label: 'A' },
          { p: B, label: 'B' },
        ],
        lines: [
          { a: S, b: A },
          { a: S, b: B },
          { a: A, b: B },
          { a: S, b: O },
        ],
        sections: [{ points: [S, A, B] }],
      },
      celi,
      otvet: 'SA',
      podskazka: [
        {
          n: 1,
          vopros: 'Что такое образующая конуса?',
          varianty: [
            'Отрезок от вершины до точки окружности основания',
            'Отрезок от вершины до центра основания',
            'Отрезок от центра до точки окружности основания',
          ],
          verno: 0,
          vyvod: 'Образующая лежит на боковой поверхности конуса.',
        },
        {
          n: 2,
          vopros: 'Где проходит отрезок $SO$?',
          varianty: ['По оси конуса, внутри него', 'По боковой поверхности'],
          verno: 0,
          vyvod: '$SO$ — высота, $OA$ — радиус основания; образующая — боковая сторона осевого сечения.',
        },
      ],
      uchitel: [
        { etap: 'Элементы конуса', formuly: ['SO = h,\\quad OA = r,\\quad SA = l'] },
        { etap: 'Осевое сечение', formuly: ['\\triangle SAB:\\ SA = SB = l,\\quad AB = 2r'] },
      ],
      uchenik: [
        { n: 1, chto: 'Образующая соединяет вершину $S$ с точкой окружности основания и лежит на боковой поверхности.', formula: 'SA = l' },
        { n: 2, chto: '$SO$ идёт по оси — это высота, $OA$ лежит в основании — это радиус. Боковые стороны осевого сечения $SA$ и $SB$ — образующие.' },
      ],
      pereschet: () => {
        const vershina: Vec3 = [telo.base[0], telo.base[1], telo.base[2] + telo.h];
        const naOkruzhnosti = (p: Vec3) => Math.abs(dist(p, telo.base) - telo.r) < 1e-9 && Math.abs(p[2] - telo.base[2]) < 1e-9;
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          return (same(p, vershina) && naOkruzhnosti(q)) || (same(q, vershina) && naOkruzhnosti(p));
        });
        return found?.id ?? '';
      },
    });
  }

  /* 2. Выбор: формула боковой поверхности цилиндра. */
  {
    const r = 3;
    const h = 5;
    const O: Vec3 = [0, 0, 0];
    const A = ortho.circlePoint(O, r, 0);
    const A1 = ortho.circlePoint([0, 0, h], r, 0);
    const varianty = ['$2\\pi rh$', '$\\pi rh$', '$\\pi r^2h$', '$2\\pi r(r + h)$'];
    out.push({
      id: 'o3-7-02',
      kratko: 'Боковая поверхность цилиндра',
      blok: 'vrashcheniya',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'Радиус основания цилиндра равен $r$, высота — $h$. По какой формуле считают площадь боковой поверхности цилиндра?',
      model: {
        alt: 'Цилиндр с центром нижнего основания O, радиус r и образующая h',
        bodies: [{ kind: 'cylinder', base: O, r, h }],
        marks: [{ p: O, label: 'O' }],
        lines: [
          { a: O, b: A, label: 'r' },
          { a: A, b: A1, label: 'h' },
        ],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 4,
          vopros: 'Во что разворачивается боковая поверхность цилиндра?',
          varianty: ['В прямоугольник', 'В круговой сектор', 'В круг'],
          verno: 0,
          vyvod: 'Развёртка — прямоугольник, одна его сторона — высота $h$.',
        },
        {
          n: 4,
          vopros: 'Чему равна другая сторона прямоугольника-развёртки?',
          varianty: ['Длине окружности основания', 'Радиусу основания', 'Площади основания'],
          verno: 0,
          vyvod: 'Боковую поверхность раскатали в полосу длиной в окружность основания.',
        },
      ],
      uchitel: [
        { etap: 'Развёртка', formuly: ['\\text{прямоугольник } 2\\pi r \\times h'] },
        { etap: 'Площадь', formuly: ['S_{\\text{бок}} = 2\\pi r\\cdot h = 2\\pi rh'] },
      ],
      uchenik: [
        { n: 4, chto: 'Разрежьте боковую поверхность по образующей и разверните: получится прямоугольник со сторонами $2\\pi r$ и $h$.', formula: 'S_{\\text{бок}} = 2\\pi rh' },
        { n: 4, chto: 'Ловушки: $\\pi r^2h$ — объём, $2\\pi r(r + h)$ — полная поверхность с двумя основаниями, в $\\pi rh$ потеряна двойка из длины окружности.' },
      ],
      pereschet: () => {
        const rr = dist(O, A);
        const hh = dist(A, A1);
        const s = perimetr(okruzhnost(O, rr)) * hh;
        const formuly = [2 * Math.PI * rr * hh, Math.PI * rr * hh, Math.PI * rr * rr * hh, 2 * Math.PI * rr * (rr + hh)];
        return String(formuly.findIndex((f) => Math.abs(f - s) < 1e-6 * s));
      },
    });
  }

  /* 3. Образующая конуса: r = 8, h = 15. */
  {
    const { model, O, S, A } = konusSOA(8, 15, { alt: 'Конус с вершиной S: высота SO = 15, радиус OA = 8, образующая SA' }, { SO: '15', OA: '8' });
    out.push({
      id: 'o3-7-03',
      kratko: 'Образующая по радиусу и высоте',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vrashcheniya',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Радиус основания конуса равен $8$, высота — $15$. Найдите образующую конуса.',
      model,
      otvet: '17',
      podskazka: [
        {
          n: 2,
          vopros: 'Какой треугольник — рабочий?',
          varianty: ['$SOA$: высота, радиус и образующая', 'Осевое сечение $SAB$ целиком'],
          verno: 0,
          vyvod: 'Половина осевого сечения — треугольник $SOA$, образующая в нём — гипотенуза.',
        },
        PRYAMOY_SOA,
        {
          n: 5,
          vopros: 'Как найти $SA$?',
          varianty: ['$SA^2 = 8^2 + 15^2$', '$SA^2 = 15^2 - 8^2$', '$SA = 8 + 15$'],
          verno: 0,
          vyvod: 'Гипотенуза: сумма квадратов катетов, $64 + 225 = 289$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp OA \\Rightarrow \\angle SOA = 90^\\circ'] },
        { etap: 'Счёт', formuly: ['l^2 = r^2 + h^2 = 8^2 + 15^2 = 289,\\quad l = 17'] },
      ],
      uchenik: [
        { n: 2, chto: 'Высота, радиус и образующая — стороны треугольника $SOA$, половины осевого сечения.' },
        { n: 3, chto: 'Высота перпендикулярна основанию, радиус лежит в нём.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'Пифагорова тройка $8,\\ 15,\\ 17$.', formula: 'SA = \\sqrt{64 + 225} = 17' },
      ],
      pereschet: () => okr(dist(S, A)),
    });
  }

  /* 4. Поверхность шара в единицах π: R = 5. */
  {
    const O: Vec3 = [0, 0, 0];
    const shar: Sphere = { kind: 'sphere', center: O, r: 5, equator: true };
    const P = ortho.circlePoint(O, shar.r, 0);
    out.push({
      id: 'o3-7-04',
      kratko: 'Поверхность шара',
      blok: 'vrashcheniya',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Радиус шара равен $5$. Найдите площадь поверхности шара, делённую на $\\pi$.',
      model: {
        alt: 'Шар с центром O и радиусом 5',
        bodies: [shar],
        marks: [{ p: O, label: 'O' }],
        lines: [{ a: O, b: P }],
        measures: [{ a: O, b: P, text: '5' }],
      },
      otvet: '100',
      podskazka: [
        {
          n: 4,
          vopros: 'По какой формуле считают площадь поверхности шара?',
          varianty: ['$S = 4\\pi R^2$', '$S = \\frac{4}{3}\\pi R^3$', '$S = \\pi R^2$'],
          verno: 0,
          vyvod: 'Поверхность шара — четыре площади большого круга.',
        },
        V_BLANK,
      ],
      uchitel: [{ etap: 'Формула', formuly: ['S = 4\\pi R^2 = 4\\pi\\cdot 25 = 100\\pi,\\quad \\frac{S}{\\pi} = 100'] }],
      uchenik: [
        { n: 4, chto: 'Площадь поверхности шара — четыре больших круга. Формула объёма $\\frac{4}{3}\\pi R^3$ здесь не нужна.', formula: 'S = 4\\pi R^2' },
        { n: 5, chto: 'Подставляем $R = 5$ и делим на $\\pi$.', formula: '\\frac{S}{\\pi} = 4\\cdot 25 = 100' },
      ],
      pereschet: () => {
        /* Большой круг по чертежу — веер треугольников; поверхность — четыре таких круга. */
        const R = dist(O, P);
        return okr((4 * veer(O, okruzhnost(O, R))) / Math.PI);
      },
    });
  }

  /* 5. Выбор: формула боковой поверхности конуса. */
  {
    const { model, O, S, A } = konusSOA(3, 4, { alt: 'Конус с вершиной S: высота h, радиус r и образующая l' }, {});
    const varianty = ['$\\pi rl$', '$\\pi rh$', '$2\\pi rl$', '$\\pi r(r + l)$'];
    out.push({
      id: 'o3-7-05',
      kratko: 'Боковая поверхность конуса',
      blok: 'vrashcheniya',
      uroven: 2,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Радиус основания конуса равен $r$, высота — $h$, образующая — $l$. По какой формуле считают площадь боковой поверхности конуса?',
      model: {
        ...model,
        lines: [
          { a: S, b: O, label: 'h' },
          { a: O, b: A, label: 'r' },
          { a: S, b: A, label: 'l' },
        ],
      },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 4,
          vopros: 'Во что разворачивается боковая поверхность конуса?',
          varianty: ['В круговой сектор', 'В прямоугольник', 'В треугольник'],
          verno: 0,
          vyvod: 'Радиус сектора — образующая $l$, длина его дуги — окружность основания $2\\pi r$.',
        },
        {
          n: 4,
          vopros: 'Какой отрезок лежит на боковой поверхности конуса?',
          varianty: ['Образующая $l$', 'Высота $h$'],
          verno: 0,
          vyvod: 'Высота идёт по оси внутри конуса — в формулу поверхности входит образующая.',
        },
      ],
      uchitel: [
        { etap: 'Развёртка — сектор', formuly: ['\\text{радиус } l,\\quad \\text{дуга } 2\\pi r'] },
        { etap: 'Площадь сектора', formuly: ['S_{\\text{бок}} = \\tfrac{1}{2}\\cdot 2\\pi r\\cdot l = \\pi rl'] },
      ],
      uchenik: [
        { n: 4, chto: 'Развёртка боковой поверхности — сектор радиуса $l$ с дугой $2\\pi r$; его площадь — половина дуги на радиус.', formula: 'S_{\\text{бок}} = \\pi rl' },
        { n: 4, chto: 'Ловушки: в $\\pi rh$ взяли высоту вместо образующей, $2\\pi rl$ — перепутали с цилиндром, $\\pi r(r + l)$ — полная поверхность.' },
      ],
      pereschet: () => {
        const rr = dist(O, A);
        const hh = dist(S, O);
        const ll = dist(S, A);
        const s = veer(S, okruzhnost(O, rr));
        const formuly = [Math.PI * rr * ll, Math.PI * rr * hh, 2 * Math.PI * rr * ll, Math.PI * rr * (rr + ll)];
        return String(formuly.findIndex((f) => Math.abs(f - s) < 1e-6 * s));
      },
    });
  }

  /* 6. Плоский чертёж: SA = 15, OA = 9, ищем высоту. */
  {
    const { model, O, S, A } = konusSOA(9, 12, { alt: 'Конус с вершиной S: образующая SA = 15, радиус OA = 9, высота SO' }, { SA: '15', OA: '9' });
    const ploskie = [
      { vershiny: ['O', 'A', 'S'] as const, kateti: [9, 12] as const, podpisi: { a: '9', b: '?', c: '15' }, iskomoe: 'b' as const, alt: 'Прямой угол при O, катет OA = 9, гипотенуза SA = 15, катет SO — искомый' },
      { vershiny: ['A', 'O', 'S'] as const, kateti: [9, 15] as const, podpisi: { a: '9', b: '15', c: '?' }, iskomoe: 'c' as const, alt: 'Прямой угол при A, катеты AO = 9 и AS = 15, гипотенуза SO — искомая' },
      { vershiny: ['O', 'A', 'S'] as const, kateti: [9, 15] as const, podpisi: { a: '9', b: '15', c: '?' }, iskomoe: 'c' as const, alt: 'Прямой угол при O, катеты OA = 9 и OS = 15, гипотенуза SA — искомая' },
    ];
    out.push({
      id: 'o3-7-06',
      kratko: 'Плоский чертёж конуса',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vrashcheniya',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie: 'Образующая конуса равна $15$, радиус основания — $9$. Какой плоский чертёж — рабочий треугольник для нахождения высоты $SO$?',
      model,
      ploskie,
      otvet: '0',
      podskazka: [
        {
          n: 3,
          vopros: 'Где в треугольнике $SOA$ прямой угол?',
          varianty: ['При $O$', 'При $A$', 'При $S$'],
          verno: 0,
          vyvod: 'Высота перпендикулярна плоскости основания, $OA$ лежит в ней — прямой угол при $O$.',
        },
        {
          n: 4,
          vopros: 'Какая сторона — гипотенуза?',
          varianty: ['Образующая $SA = 15$', 'Высота $SO$', 'Радиус $OA = 9$'],
          verno: 0,
          vyvod: 'Против прямого угла — образующая; она длиннее и высоты, и радиуса.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp OA \\Rightarrow \\angle SOA = 90^\\circ,\\ SA\\ \\text{— гипотенуза}'] },
        { etap: 'Дальше счёт', formuly: ['SO^2 = 15^2 - 9^2 = 144'] },
      ],
      uchenik: [
        { n: 3, chto: 'Высота перпендикулярна основанию, радиус $OA$ лежит в основании: прямой угол при $O$.' },
        { n: 4, chto: 'Гипотенуза — образующая $SA = 15$, катеты — радиус $9$ и искомая высота. На втором чертеже прямой угол не там, на третьем образующую приняли за высоту.' },
      ],
      pereschet: () => {
        const SA = Math.round(dist(S, A));
        const OA = Math.round(dist(O, A));
        const at = ploskie.findIndex((p) => p.vershiny[0] === 'O' && p.podpisi.c === String(SA) && p.podpisi.a === String(OA));
        return String(at);
      },
    });
  }

  /* 7. Объём цилиндра в единицах π: диаметр 6, высота 7. */
  {
    const r = 3;
    const h = 7;
    const O: Vec3 = [0, 0, 0];
    const A = ortho.circlePoint(O, r, 0);
    const B = ortho.circlePoint(O, r, Math.PI);
    const A1 = ortho.circlePoint([0, 0, h], r, 0);
    out.push({
      id: 'o3-7-07',
      kratko: 'Объём цилиндра',
      blok: 'vrashcheniya',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Диаметр основания цилиндра равен $6$, высота — $7$. Найдите объём цилиндра, делённый на $\\pi$.',
      model: {
        alt: 'Цилиндр: диаметр основания AB = 6, высота 7',
        bodies: [{ kind: 'cylinder', base: O, r, h }],
        marks: [
          { p: A, label: 'A' },
          { p: B, label: 'B' },
        ],
        lines: [{ a: A, b: B }],
        measures: [
          { a: B, b: A, text: '6' },
          { a: A, b: A1, text: '7' },
        ],
      },
      otvet: '63',
      podskazka: [
        {
          n: 4,
          vopros: 'По какой формуле считают объём цилиндра?',
          varianty: ['$V = \\pi r^2h$', '$V = 2\\pi rh$', '$V = \\frac{1}{3}\\pi r^2h$'],
          verno: 0,
          vyvod: 'Объём — площадь основания на высоту.',
        },
        {
          n: 5,
          vopros: 'Что подставить вместо $r$?',
          varianty: ['Половину диаметра', 'Диаметр', 'Высоту'],
          verno: 0,
          vyvod: 'Радиус — половина диаметра: $r = 3$.',
        },
        V_BLANK,
      ],
      uchitel: [
        { etap: 'Радиус', formuly: ['r = \\frac{6}{2} = 3'] },
        { etap: 'Объём', formuly: ['V = \\pi r^2h = \\pi\\cdot 9\\cdot 7 = 63\\pi,\\quad \\frac{V}{\\pi} = 63'] },
      ],
      uchenik: [
        { n: 4, chto: 'Объём цилиндра — площадь круга-основания на высоту.', formula: 'V = \\pi r^2h' },
        { n: 5, chto: 'В условии диаметр — сначала делим его пополам. Если подставить $6$ вместо радиуса, ответ выйдет вчетверо больше.', formula: '\\frac{V}{\\pi} = 3^2\\cdot 7 = 63' },
      ],
      pereschet: () => {
        const rr = dist(A, B) / 2;
        const hh = dist(A, A1);
        const osnovanie = veer(O, okruzhnost(O, rr));
        return okr((osnovanie * hh) / Math.PI);
      },
    });
  }

  /* 8. Банк FcFB97: сечение через центр шара равно 12. */
  {
    const O: Vec3 = [0, 0, 0];
    const shar: Sphere = { kind: 'sphere', center: O, r: 3, equator: false, sections: [0] };
    out.push({
      id: 'o3-7-08',
      kratko: 'Шар по большому кругу',
      blok: 'vrashcheniya',
      uroven: 2,
      istochnik: 'fipi',
      fipi: 'FcFB97',
      vid: 'chislo',
      uslovie: 'Площадь сечения шара плоскостью, проходящей через центр шара, равна $12$. Найдите площадь поверхности шара.',
      model: {
        alt: 'Шар с центром O и его сечение плоскостью через центр',
        bodies: [shar],
        marks: [{ p: O, label: 'O' }],
      },
      otvet: '48',
      podskazka: [
        {
          n: 2,
          vopros: 'Что за фигура — сечение шара плоскостью через центр?',
          varianty: ['Большой круг радиуса $R$', 'Круг радиуса $\\frac{R}{2}$', 'Окружность без внутренности'],
          verno: 0,
          vyvod: 'Радиус сечения через центр равен радиусу шара: $\\pi R^2 = 12$.',
        },
        {
          n: 4,
          vopros: 'Как поверхность шара связана с площадью большого круга?',
          varianty: ['$S = 4\\pi R^2$ — четыре больших круга', '$S = 2\\pi R^2$ — два больших круга', '$S = \\frac{4}{3}\\pi R^3$'],
          verno: 0,
          vyvod: 'Радиус искать не нужно: площадь сечения умножаем на четыре.',
        },
      ],
      uchitel: [
        { etap: 'Большой круг', formuly: ['\\pi R^2 = 12'] },
        { etap: 'Поверхность', formuly: ['S = 4\\pi R^2 = 4\\cdot 12 = 48'] },
      ],
      uchenik: [
        { n: 2, chto: 'Плоскость через центр режет шар по большому кругу — его радиус равен радиусу шара.', formula: '\\pi R^2 = 12' },
        { n: 4, chto: 'Поверхность шара — четыре больших круга. $R$ и $\\pi$ по отдельности не нужны.', formula: 'S = 4\\cdot\\pi R^2 = 4\\cdot 12 = 48' },
      ],
      pereschet: () => {
        /* Сечение по чертежу — веер треугольников; поверхность 4πR² пересчитывается к данной площади 12. */
        const R = shar.r;
        const sechenie = veer(O, okruzhnost(O, R));
        return okr((12 * 4 * Math.PI * R * R) / sechenie);
      },
    });
  }

  /* 9. Банк 135723: конус 3√2 → цилиндр. */
  {
    const { model, O, S, A, kon } = cilindrIKonus(3);
    out.push({
      id: 'o3-7-09',
      kratko: 'Цилиндр по конусу',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vrashcheniya',
      uroven: 3,
      istochnik: 'fipi',
      fipi: '135723',
      vid: 'chislo',
      uslovie:
        'Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности конуса равна $3\\sqrt{2}$. Найдите площадь боковой поверхности цилиндра.',
      model,
      otvet: '6',
      podskazka: [
        {
          n: 2,
          vopros: 'Высота равна радиусу. Какой треугольник $SOA$?',
          varianty: ['Прямоугольный равнобедренный', 'Равносторонний', 'Тупоугольный'],
          verno: 0,
          vyvod: 'Катеты $SO = OA = r$, поэтому образующая $SA = r\\sqrt2$.',
        },
        {
          n: 4,
          vopros: 'Что подставить в формулы боковых поверхностей?',
          varianty: [
            '$S_{\\text{кон}} = \\pi r\\cdot r\\sqrt2$, $S_{\\text{цил}} = 2\\pi r\\cdot r$',
            '$S_{\\text{кон}} = \\pi r\\cdot r$, $S_{\\text{цил}} = 2\\pi r\\cdot r$',
          ],
          verno: 0,
          vyvod: 'В конусе — образующая, в цилиндре — высота; обе площади выражены через $\\pi r^2$.',
        },
        {
          n: 5,
          vopros: 'Во сколько раз боковая поверхность цилиндра больше, чем у конуса?',
          varianty: ['В $\\sqrt2$ раз', 'В $2$ раза', 'В $\\frac{\\sqrt2}{2}$ раза'],
          verno: 0,
          vyvod: '$\\frac{2\\pi r^2}{\\pi r^2\\sqrt2} = \\sqrt2$: данное число умножаем на $\\sqrt2$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO = OA = r,\\ \\angle SOA = 90^\\circ \\Rightarrow l = r\\sqrt2'] },
        { etap: 'Боковые поверхности', formuly: ['S_{\\text{кон}} = \\pi r l = \\pi r^2\\sqrt2,\\quad S_{\\text{цил}} = 2\\pi rh = 2\\pi r^2'] },
        { etap: 'Отношение', formuly: ['\\frac{S_{\\text{цил}}}{S_{\\text{кон}}} = \\frac{2}{\\sqrt2} = \\sqrt2,\\quad S_{\\text{цил}} = 3\\sqrt2\\cdot\\sqrt2 = 6'] },
      ],
      uchenik: [
        { n: 1, chto: 'Вершина конуса — центр верхнего основания цилиндра, высоты равны радиусу.' },
        { n: 2, chto: 'В треугольнике $SOA$ катеты равны $r$, образующая — гипотенуза.', formula: 'l = \\sqrt{r^2 + r^2} = r\\sqrt2' },
        { n: 4, chto: 'Пишем обе площади через $\\pi r^2$ — сам радиус находить не нужно.', formula: 'S_{\\text{кон}} = \\pi r^2\\sqrt2,\\quad S_{\\text{цил}} = 2\\pi r^2' },
        { n: 5, chto: 'Цилиндр больше конуса в $\\frac{2}{\\sqrt2} = \\sqrt2$ раз.', formula: 'S_{\\text{цил}} = 3\\sqrt2\\cdot\\sqrt2 = 6' },
      ],
      pereschet: () => {
        /* Отношение поверхностей по чертежу: развёртка цилиндра и веер конуса. */
        const okrO = okruzhnost(kon.base, dist(O, A));
        const sCil = perimetr(okrO) * dist(O, S);
        const sKon = veer(S, okrO);
        return okr((3 * Math.SQRT2 * sCil) / sKon);
      },
    });
  }

  /* 10. Банк 37164B: цилиндр 5√2 → конус. */
  {
    const { model, O, S, A, kon } = cilindrIKonus(4);
    out.push({
      id: 'o3-7-10',
      kratko: 'Конус по цилиндру',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vrashcheniya',
      uroven: 3,
      istochnik: 'fipi',
      fipi: '37164B',
      vid: 'chislo',
      uslovie:
        'Цилиндр и конус имеют общие основание и высоту. Высота цилиндра равна радиусу основания. Площадь боковой поверхности цилиндра равна $5\\sqrt{2}$. Найдите площадь боковой поверхности конуса.',
      model,
      otvet: '5',
      podskazka: [
        {
          n: 2,
          vopros: 'Чему равна образующая конуса, если $h = r$?',
          varianty: ['$r\\sqrt2$', '$r$', '$2r$'],
          verno: 0,
          vyvod: 'Треугольник $SOA$ прямоугольный равнобедренный, образующая — гипотенуза.',
        },
        PRYAMOY_SOA,
        {
          n: 5,
          vopros: 'Как получить площадь конуса из площади цилиндра?',
          varianty: ['Разделить на $\\sqrt2$', 'Умножить на $\\sqrt2$', 'Разделить на $2$'],
          verno: 0,
          vyvod: '$\\frac{S_{\\text{кон}}}{S_{\\text{цил}}} = \\frac{\\pi r^2\\sqrt2}{2\\pi r^2} = \\frac{\\sqrt2}{2} = \\frac{1}{\\sqrt2}$.',
        },
      ],
      uchitel: [
        { etap: 'Образующая', formuly: ['SO = OA = r \\Rightarrow l = r\\sqrt2'] },
        { etap: 'Боковые поверхности', formuly: ['S_{\\text{цил}} = 2\\pi r^2,\\quad S_{\\text{кон}} = \\pi r\\cdot r\\sqrt2 = \\pi r^2\\sqrt2'] },
        { etap: 'Отношение', formuly: ['S_{\\text{кон}} = S_{\\text{цил}}\\cdot\\frac{\\sqrt2}{2} = \\frac{5\\sqrt2\\cdot\\sqrt2}{2} = 5'] },
      ],
      uchenik: [
        { n: 2, chto: 'Высота равна радиусу: в треугольнике $SOA$ равные катеты, образующая — гипотенуза.', formula: 'l = r\\sqrt2' },
        { n: 3, chto: 'Угол $SOA$ прямой: высота перпендикулярна основанию.' },
        { n: 4, chto: 'Обе площади — через $\\pi r^2$; радиус находить не нужно.', formula: 'S_{\\text{цил}} = 2\\pi r^2,\\quad S_{\\text{кон}} = \\pi r^2\\sqrt2' },
        { n: 5, chto: 'Конус меньше цилиндра в $\\sqrt2$ раз — делим.', formula: 'S_{\\text{кон}} = \\frac{5\\sqrt2}{\\sqrt2} = 5' },
      ],
      pereschet: () => {
        const okrO = okruzhnost(kon.base, dist(O, A));
        const sCil = perimetr(okrO) * dist(O, S);
        const sKon = veer(S, okrO);
        return okr((5 * Math.SQRT2 * sKon) / sCil);
      },
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-7-${String(i + 1).padStart(2, '0')}` }));
}
