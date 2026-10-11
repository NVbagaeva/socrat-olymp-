/**
 * Живые чертежи: вершину можно тянуть, движок перерисовывает фигуру,
 * значения под чертежом пересчитываются. Для карточек теории и
 * витрины движка (компонент ZhivoyChertezh).
 *
 * Сцена живого чертежа — функция от положений подвижных точек.
 * Перетаскиваемая точка сначала проходит через ogranichit: точку на
 * окружности оно возвращает на окружность, точку, которая нарушила
 * бы чертёж (вырожденный треугольник, вершина «перескочила» на другую
 * дугу, вышла за окно), отклоняет — тогда точка остаётся на месте.
 * Значения (углы, длины) считаются по тем же координатам: величины
 * на рисунке и под ним всегда согласованы.
 *
 * Углы на рисунке округляются до целых так, чтобы сумма, о которой
 * говорит карточка, сохранялась: три угла треугольника в сумме дают
 * ровно 180°.
 */

import { chislo, duga, okr, otr, pryam, shtrih, tochka, tri, ug } from './stseny/dsl';
import type { Element, Scena, T2 } from './types';

export type Tochki = Readonly<Record<string, T2>>;

export interface ZhivayaStsena {
  id: string;
  nazvanie: string;
  /** Начальные положения всех точек, которые задаются координатами. */
  nachalo: Tochki;
  /** Какие точки можно тянуть. */
  podvizhnye: readonly string[];
  /** Неподвижное окно сцены: масштаб не меняется при перетаскивании. */
  okno: readonly [number, number, number, number];
  scena: (t: Tochki) => Scena;
  /** Новое положение точки или null — так тянуть нельзя. */
  ogranichit: (imya: string, p: T2, t: Tochki) => T2 | null;
  /** Строки под чертежом, TeX без долларов: пересчитанные величины. */
  znacheniya: (t: Tochki) => string[];
}

/* ── Геометрия ───────────────────────────────────────────────────── */

const RAD = Math.PI / 180;
const sub = (a: T2, b: T2): T2 => [a[0] - b[0], a[1] - b[1]];
const dlina = (a: T2, b: T2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Угол AVB, градусы (0–180). */
export function ugolGr(a: T2, v: T2, b: T2): number {
  const p = sub(a, v);
  const q = sub(b, v);
  const c = (p[0] * q[0] + p[1] * q[1]) / (Math.hypot(...p) * Math.hypot(...q));
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
}

/** Точка, сдвинутая на окружность с центром c и радиусом r. */
function naOkruzhnost(p: T2, c: T2, r: number): T2 {
  const d = sub(p, c);
  const l = Math.hypot(...d);
  if (l < 1e-9) return [c[0] + r, c[1]];
  return [c[0] + (d[0] / l) * r, c[1] + (d[1] / l) * r];
}

/** Полярный угол точки на окружности, градусы 0–360. */
function polyarnyy(p: T2, c: T2): number {
  const a = Math.atan2(p[1] - c[1], p[0] - c[0]) / RAD;
  return a < 0 ? a + 360 : a;
}

function vOkne(p: T2, okno: readonly [number, number, number, number], pole = 0.6): boolean {
  return (
    p[0] > okno[0] + pole && p[0] < okno[2] - pole && p[1] > okno[1] + pole && p[1] < okno[3] - pole
  );
}

/** Треугольник не вырожден: углы не меньше 15°, стороны не короче 2. */
function treugolnikOk(a: T2, b: T2, c: T2): boolean {
  if (dlina(a, b) < 2 || dlina(b, c) < 2 || dlina(c, a) < 2) return false;
  return ugolGr(b, a, c) >= 15 && ugolGr(a, b, c) >= 15 && ugolGr(a, c, b) >= 15;
}

/** Целые значения с той же суммой: метод наибольших остатков. */
export function okruglitSSummoy(x: readonly number[], summa: number): number[] {
  const nizhe = x.map((v) => Math.floor(v));
  let ostatok = summa - nizhe.reduce((s, v) => s + v, 0);
  const poryadok = x.map((v, i) => [v - Math.floor(v), i] as const).sort((p, q) => q[0] - p[0]);
  const out = [...nizhe];
  for (const [, i] of poryadok) {
    if (ostatok <= 0) break;
    out[i] = (out[i] ?? 0) + 1;
    ostatok -= 1;
  }
  return out;
}

const dl = (x: number) => chislo(Math.round(x * 10) / 10).replace(',', '{,}');
const gr = (x: number) => `${x}°`;

function pt(t: Tochki, n: string): T2 {
  const p = t[n];
  if (p === undefined) throw new Error(`нет точки ${n}`);
  return p;
}

/* ── Сцены ───────────────────────────────────────────────────────── */

const OKNO_TRI = [-1, -1, 13, 9] as const;

/** Сумма углов треугольника. */
const summaUglov: ZhivayaStsena = {
  id: 'summa-uglov',
  nazvanie: 'Сумма углов треугольника',
  nachalo: { A: [0, 0], B: [11, 0], C: [3.5, 7] },
  podvizhnye: ['A', 'B', 'C'],
  okno: OKNO_TRI,
  scena: (t) => {
    const [a, b, c] = ugly(t);
    return {
      tochki: { A: pt(t, 'A'), B: pt(t, 'B'), C: pt(t, 'C') },
      elementy: [
        tri('A', 'B', 'C'),
        ug('C', 'A', 'B', { znachenie: gr(a) }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: gr(b) }),
        ug('B', 'C', 'A', { dugi: 3, vydelit: 'iskomoe', znachenie: gr(c) }),
      ],
    };
  },
  ogranichit: (n, p, t) => {
    const nov = { ...t, [n]: p };
    return vOkne(p, OKNO_TRI) && treugolnikOk(pt(nov, 'A'), pt(nov, 'B'), pt(nov, 'C')) ? p : null;
  },
  znacheniya: (t) => {
    const [a, b, c] = ugly(t);
    return [`${a}^\\circ + ${b}^\\circ + ${c}^\\circ = 180^\\circ`];
  },
};

function ugly(t: Tochki): [number, number, number] {
  const a = pt(t, 'A');
  const b = pt(t, 'B');
  const c = pt(t, 'C');
  const [x = 0, y = 0, z = 0] = okruglitSSummoy(
    [ugolGr(c, a, b), ugolGr(a, b, c), ugolGr(b, c, a)],
    180,
  );
  return [x, y, z];
}

const O: T2 = [0, 0];
const R = 5;
const OKNO_KRUG = [-6.5, -6.5, 6.5, 6.5] as const;

/** Точки на окружности: проекция, порядок и зазор между соседями. */
function naKruge(p: T2): T2 {
  return naOkruzhnost(p, O, R);
}

/** Минимальная дуга между двумя точками окружности, градусы. */
function dugaMezhdu(p: T2, q: T2): number {
  const d = Math.abs(polyarnyy(p, O) - polyarnyy(q, O));
  return Math.min(d, 360 - d);
}

/** С какой стороны прямой AB лежит точка: +1 или −1. */
function storona(a: T2, b: T2, p: T2): number {
  return Math.sign((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
}

/** Вписанные углы, опирающиеся на одну дугу, равны. */
const odnaDuga: ZhivayaStsena = {
  id: 'odna-duga',
  nazvanie: 'Вписанные углы на одну дугу',
  nachalo: {
    A: naKruge([-4, -3]),
    B: naKruge([4, -3]),
    C: naKruge([-2, 4.6]),
    D: naKruge([3, 4]),
  },
  podvizhnye: ['C', 'D', 'A', 'B'],
  okno: OKNO_KRUG,
  scena: (t) => {
    const u = Math.round(ugolGr(pt(t, 'A'), pt(t, 'C'), pt(t, 'B')));
    return {
      tochki: { O, ...t },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: [
        okr('w'),
        otr('C', 'A'),
        otr('C', 'B'),
        otr('D', 'A'),
        otr('D', 'B'),
        duga('w', 'A', 'B', { vydelit: 'iskomoe' }),
        ug('A', 'C', 'B', { znachenie: gr(u) }),
        ug('A', 'D', 'B', { znachenie: gr(u) }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    };
  },
  ogranichit: (n, p, t) => {
    const q = naKruge(p);
    const nov = { ...t, [n]: q };
    const a = pt(nov, 'A');
    const b = pt(nov, 'B');
    const c = pt(nov, 'C');
    const d = pt(nov, 'D');
    /* C и D — по одну сторону от хорды AB, все точки разнесены. */
    if (storona(a, b, c) !== storona(a, b, d) || storona(a, b, c) === 0) return null;
    /* Вписанный угол не меньше порога схематичного рисунка. */
    if (ugolGr(a, c, b) < 14) return null;
    const para = [a, b, c, d];
    for (let i = 0; i < 4; i += 1)
      for (let j = i + 1; j < 4; j += 1) if (dugaMezhdu(para[i]!, para[j]!) < 22) return null;
    return q;
  },
  znacheniya: (t) => {
    const u = ugolGr(pt(t, 'A'), pt(t, 'C'), pt(t, 'B'));
    return [
      `\\angle ACB = \\angle ADB = ${Math.round(u)}^\\circ = \\tfrac12 \\overset{\\smile}{AB}`,
    ];
  },
};

/** Угол, опирающийся на диаметр, прямой. */
const naDiametr: ZhivayaStsena = {
  id: 'na-diametr',
  nazvanie: 'Угол на диаметр',
  nachalo: { A: [-R, 0], B: [R, 0], C: naKruge([1.5, 4.7]) },
  podvizhnye: ['C'],
  okno: OKNO_KRUG,
  scena: (t) => ({
    tochki: { O, ...t },
    okruzhnosti: { w: { centr: 'O', radius: R } },
    elementy: [
      okr('w'),
      otr('A', 'B'),
      otr('C', 'A'),
      otr('C', 'B'),
      pryam('A', 'C', 'B', { vydelit: 'iskomoe' }),
      tochka('O'),
    ],
  }),
  ogranichit: (_n, p, t) => {
    const q = naKruge(p);
    return dugaMezhdu(q, pt(t, 'A')) >= 18 && dugaMezhdu(q, pt(t, 'B')) >= 18 ? q : null;
  },
  znacheniya: (t) => {
    const u = ugolGr(pt(t, 'A'), pt(t, 'C'), pt(t, 'B'));
    return [`AB \\text{ — диаметр}: \\ \\angle ACB = ${Math.round(u)}^\\circ`];
  },
};

/** Медиана к гипотенузе равна её половине. */
const medianaGipotenuza: ZhivayaStsena = {
  id: 'mediana-gipotenuza',
  nazvanie: 'Медиана к гипотенузе',
  nachalo: { A: [-R, 0], B: [R, 0], C: naKruge([-1.8, 4.66]), M: [0, 0] },
  podvizhnye: ['C'],
  okno: [-6.5, -1.2, 6.5, 6.5],
  scena: (t) => ({
    tochki: t,
    elementy: [
      tri('A', 'B', 'C'),
      otr('C', 'M', { vydelit: 'iskomoe' }),
      pryam('A', 'C', 'B'),
      shtrih('A', 'M', 1, { tolkoShtrihi: true }),
      shtrih('M', 'B', 1, { tolkoShtrihi: true }),
      shtrih('C', 'M', 1, { tolkoShtrihi: true }),
    ],
  }),
  ogranichit: (_n, p, t) => {
    const q = naKruge(p);
    if (q[1] < 0.5) return null;
    return dugaMezhdu(q, pt(t, 'A')) >= 20 && dugaMezhdu(q, pt(t, 'B')) >= 20 ? q : null;
  },
  znacheniya: (t) => {
    const ab = dlina(pt(t, 'A'), pt(t, 'B'));
    const cm = dlina(pt(t, 'C'), pt(t, 'M'));
    return [`CM = ${dl(cm)} = \\tfrac12 AB = \\tfrac12 \\cdot ${dl(ab)}`];
  },
};

/** Противоположные углы вписанного четырёхугольника. */
const vpisannyyChetyrehugolnik: ZhivayaStsena = {
  id: 'vpisannyy-chetyrehugolnik',
  nazvanie: 'Вписанный четырёхугольник',
  nachalo: {
    A: naKruge([-4.8, -1.2]),
    B: naKruge([-1.2, 4.8]),
    C: naKruge([4.9, 0.8]),
    D: naKruge([0.6, -5]),
  },
  podvizhnye: ['A', 'B', 'C', 'D'],
  okno: OKNO_KRUG,
  scena: (t) => {
    const [a, b, c, d] = uglyChetyrehugolnika(t);
    return {
      tochki: { O, ...t },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: [
        okr('w'),
        { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
        ug('D', 'A', 'B', { znachenie: gr(a) }),
        ug('A', 'B', 'C', { dugi: 2, znachenie: gr(b) }),
        ug('B', 'C', 'D', { vydelit: 'iskomoe', znachenie: gr(c) }),
        ug('C', 'D', 'A', { dugi: 2, znachenie: gr(d) }),
      ],
      podpisi: ['A', 'B', 'C', 'D'],
    };
  },
  ogranichit: (n, p, t) => {
    const q = naKruge(p);
    const nov = { ...t, [n]: q };
    /* Порядок A, B, C, D по часовой стрелке не меняется, соседние дуги ≥ 35°. */
    const u = ['A', 'B', 'C', 'D'].map((k) => polyarnyy(pt(nov, k), O));
    for (let i = 0; i < 4; i += 1) {
      const d = (((u[i]! - u[(i + 1) % 4]!) % 360) + 360) % 360;
      if (d < 35 || d > 200) return null;
    }
    return q;
  },
  znacheniya: (t) => {
    const [a, b, c, d] = uglyChetyrehugolnika(t);
    return [
      `\\angle A + \\angle C = ${a}^\\circ + ${c}^\\circ = 180^\\circ`,
      `\\angle B + \\angle D = ${b}^\\circ + ${d}^\\circ = 180^\\circ`,
    ];
  },
};

function uglyChetyrehugolnika(t: Tochki): [number, number, number, number] {
  const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((k) => pt(t, k)) as [T2, T2, T2, T2];
  const [ua = 0, uc = 0] = okruglitSSummoy([ugolGr(d, a, b), ugolGr(b, c, d)], 180);
  const [ub = 0, ud = 0] = okruglitSSummoy([ugolGr(a, b, c), ugolGr(c, d, a)], 180);
  return [ua, ub, uc, ud];
}

/** Описанный четырёхугольник: суммы противоположных сторон равны. */
const RV = 3;
const opisannyyChetyrehugolnik: ZhivayaStsena = {
  id: 'opisannyy-chetyrehugolnik',
  nazvanie: 'Описанный четырёхугольник',
  /* Подвижны точки касания на вписанной окружности; вершины — пересечения касательных. */
  nachalo: {
    K: naOkruzhnost([-1, 3], O, RV),
    L: naOkruzhnost([3, 0.5], O, RV),
    M: naOkruzhnost([1, -3], O, RV),
    N: naOkruzhnost([-3, -0.8], O, RV),
  },
  podvizhnye: ['K', 'L', 'M', 'N'],
  okno: [-8, -8, 8, 8],
  scena: (t) => ({
    tochki: { O, ...t, ...vershiny(t) },
    okruzhnosti: { w: { centr: 'O', radius: RV } },
    elementy: [
      okr('w'),
      { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
      otr('A', 'B', { vydelit: 'iskomoe' }),
      otr('C', 'D', { vydelit: 'iskomoe' }),
      tochka('K'),
      tochka('L'),
      tochka('M'),
      tochka('N'),
    ],
    podpisi: ['A', 'B', 'C', 'D'],
  }),
  ogranichit: (n, p, t) => {
    const q = naOkruzhnost(p, O, RV);
    const nov = { ...t, [n]: q };
    /* Порядок точек касания сохраняется, каждая дуга между соседними
       от 50° до 150°: вершины остаются в окне. */
    const u = ['K', 'L', 'M', 'N'].map((k) => polyarnyy(pt(nov, k), O));
    for (let i = 0; i < 4; i += 1) {
      const d = (((u[i]! - u[(i + 1) % 4]!) % 360) + 360) % 360;
      if (d < 50 || d > 150) return null;
    }
    const v = vershiny(nov);
    return Object.values(v).every((x) => vOkne(x, [-8, -8, 8, 8], 0.3)) ? q : null;
  },
  znacheniya: (t) => {
    const v = vershiny(t);
    const ab = dlina(v.A, v.B);
    const bc = dlina(v.B, v.C);
    const cd = dlina(v.C, v.D);
    const da = dlina(v.D, v.A);
    return [
      `AB + CD = ${dl(ab)} + ${dl(cd)} = ${dl(ab + cd)}`,
      `BC + AD = ${dl(bc)} + ${dl(da)} = ${dl(bc + da)}`,
    ];
  },
};

/** Вершина — пересечение касательных в точках касания под углами a и b. */
function vershinaKasatelnyh(a: number, b: number): T2 {
  let d = (b - a) % 360;
  if (d < 0) d += 360;
  const sered = (a + d / 2) * RAD;
  const l = RV / Math.cos((d / 2) * RAD);
  return [Math.cos(sered) * l, Math.sin(sered) * l];
}

function vershiny(t: Tochki): { A: T2; B: T2; C: T2; D: T2 } {
  /* Точки касания идут по часовой стрелке: K (на AB), L (BC), M (CD), N (DA). */
  const u = ['K', 'L', 'M', 'N'].map((k) => polyarnyy(pt(t, k), O)) as [
    number,
    number,
    number,
    number,
  ];
  return {
    B: vershinaKasatelnyh(u[1], u[0]),
    C: vershinaKasatelnyh(u[2], u[1]),
    D: vershinaKasatelnyh(u[3], u[2]),
    A: vershinaKasatelnyh(u[0], u[3]),
  };
}

/** Средняя линия треугольника. */
const srednyayaLiniya: ZhivayaStsena = {
  id: 'srednyaya-liniya',
  nazvanie: 'Средняя линия треугольника',
  nachalo: { A: [0, 0], B: [11, 0], C: [4, 7.5] },
  podvizhnye: ['A', 'B', 'C'],
  okno: OKNO_TRI,
  scena: (t) => {
    const a = pt(t, 'A');
    const b = pt(t, 'B');
    const c = pt(t, 'C');
    return {
      tochki: {
        A: a,
        B: b,
        C: c,
        M: [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2],
        N: [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2],
      },
      elementy: [
        tri('A', 'B', 'C'),
        otr('M', 'N', { vydelit: 'iskomoe' }),
        shtrih('A', 'M', 1, { tolkoShtrihi: true }),
        shtrih('M', 'C', 1, { tolkoShtrihi: true }),
        shtrih('B', 'N', 2, { tolkoShtrihi: true }),
        shtrih('N', 'C', 2, { tolkoShtrihi: true }),
      ] as Element[],
    };
  },
  ogranichit: (n, p, t) => {
    const nov = { ...t, [n]: p };
    return vOkne(p, OKNO_TRI) && treugolnikOk(pt(nov, 'A'), pt(nov, 'B'), pt(nov, 'C')) ? p : null;
  },
  znacheniya: (t) => {
    const ab = dlina(pt(t, 'A'), pt(t, 'B'));
    return [`MN \\parallel AB`, `MN = \\tfrac12 AB = \\tfrac12 \\cdot ${dl(ab)} = ${dl(ab / 2)}`];
  },
};

export const ZHIVYE: readonly ZhivayaStsena[] = [
  summaUglov,
  odnaDuga,
  naDiametr,
  medianaGipotenuza,
  vpisannyyChetyrehugolnik,
  opisannyyChetyrehugolnik,
  srednyayaLiniya,
];

export function zhivaya(id: string): ZhivayaStsena {
  const z = ZHIVYE.find((x) => x.id === id);
  if (z === undefined) throw new Error(`нет живого чертежа ${id}`);
  return z;
}
