/**
 * Живые рисунки №19: подвижная линия на ползунке параметра.
 *
 * Для метода областей (глава 3) подвижная линия — горизонтальная
 * прямая a = const на плоскости (x; a): под рисунком тогда не число
 * решений, а само множество решений по x — кусками, с точными концами
 * (концы — нули множителей, их формулы знает описание рисунка).
 *
 * Для чётности (глава 5) параметр меняет сам симметричный график:
 * решения отмечены точками, решение с x = 0 — акцентным цветом, а под
 * числом решений — вывод: при найденном значении решение одно, при
 * отброшенном кандидате кроме x = 0 есть ещё пара.
 *
 * Описание — данные и функции; функции в браузер со страницы не
 * передать, поэтому компонент (components/zadanie19/Zhivoy19.tsx)
 * берёт описание здесь по id. Число решений считается точно —
 * не по картинке: для ломаных — по кускам, где функция линейна.
 */

import {
  gorizontal,
  grafik,
  lomanaya,
  oblastMezhdu,
  okruzhnost,
  otrezokNa,
  pryamaya,
  scena,
  tochka,
  type Figura19,
  type Scena19,
  type Tochka19,
} from './risunok';

export interface Osoboe19 {
  a: number;
  /** Подпись кнопки: TeX без долларов. */
  tex: string;
}

/** Кусок множества решений по x: концы, включён ли конец; точка — ot = do. */
export interface KusokX19 {
  ot: number;
  do: number;
  otVkl: boolean;
  doVkl: boolean;
}

export interface Zhivoy19 {
  /**
   * Что движет параметр: поворачивает прямую (по умолчанию), сдвигает
   * её параллельно ('sdvig'), меняет окружность или горизонтальную
   * прямую a = const метода областей или сам график ('grafik', метод 5:
   * график чётной функции меняется вместе с параметром) — от этого
   * заголовок блока и строка под рисунком.
   */
  vid?: 'pryamaya' | 'sdvig' | 'okruzhnost' | 'gorizontal' | 'grafik';
  bukva: string;
  min: number;
  max: number;
  shag: number;
  start: number;
  osobye: Osoboe19[];
  scena: (a: number) => Scena19;
  /** Число решений; Infinity — бесконечно много. */
  resheniy?: (a: number) => number;
  /** Метод областей: множество решений по x при этом a. */
  mnozhestvo?: (a: number) => KusokX19[];
  /** Строка-вывод под множеством или после числа решений: текст с формулами в долларах. */
  itog?: (a: number) => string;
}

/**
 * Множество решений по x: условие verno(x) и все точки, где оно может
 * смениться (нули множителей, концы области). Между соседними точками
 * условие постоянно — проверяем середину; в самих точках — точно.
 */
export function mnozhestvoX(verno: (x: number) => boolean, granicy: number[]): KusokX19[] {
  const t = [...new Set(granicy.filter((v) => Number.isFinite(v)))].sort((p, q) => p - q);
  const b: number[] = [];
  for (const v of t) {
    if (b.length === 0 || v - b[b.length - 1]! > 1e-9) b.push(v);
  }
  if (b.length === 0) {
    return verno(0) ? [{ ot: -Infinity, do: Infinity, otVkl: false, doVkl: false }] : [];
  }
  const kuski: KusokX19[] = [];
  const dobavit = (k: KusokX19) => {
    const pr = kuski[kuski.length - 1];
    if (pr !== undefined && pr.do === k.ot && (pr.doVkl || k.otVkl)) {
      pr.do = k.do;
      pr.doVkl = k.doVkl;
    } else {
      kuski.push({ ...k });
    }
  };
  if (verno(b[0]! - 1)) dobavit({ ot: -Infinity, do: b[0]!, otVkl: false, doVkl: false });
  b.forEach((p, i) => {
    if (verno(p)) dobavit({ ot: p, do: p, otVkl: true, doVkl: true });
    const q = b[i + 1];
    const s = q === undefined ? p + 1 : (p + q) / 2;
    if (verno(s)) dobavit({ ot: p, do: q ?? Infinity, otVkl: false, doVkl: false });
  });
  return kuski;
}

/** Число в TeX: два знака, десятичная запятая. */
function chisloTex(v: number): string {
  if (v === Infinity) return '+\\infty';
  if (v === -Infinity) return '-\\infty';
  return String(Math.round(v * 100) / 100).replace('.', '{,}');
}

/** Множество решений по x — TeX: «x\in(-\infty;\,-1{,}5]\cup[0;\,1]», пустое — \varnothing. */
export function mnozhestvoTex(kuski: KusokX19[]): string {
  if (kuski.length === 0) return 'x\\in\\varnothing';
  const chasti = kuski.map((k) =>
    k.ot === k.do
      ? `\\{${chisloTex(k.ot)}\\}`
      : `${k.otVkl ? '[' : '('}${chisloTex(k.ot)};\\,${chisloTex(k.do)}${k.doVkl ? ']' : ')'}`,
  );
  return `x\\in${chasti.join('\\cup')}`;
}

/** Куски решения на прямой a = const: толстые отрезки третьего цвета, концы — точки (выколотые — пустые). */
function kuskiNaPryamoy(
  kuski: KusokX19[],
  a: number,
  x: [number, number],
): { shapes: Figura19[]; points: Tochka19[] } {
  const shapes: Figura19[] = [];
  const points: Tochka19[] = [];
  for (const k of kuski) {
    const ot = Math.max(k.ot, x[0]);
    const dO = Math.min(k.do, x[1]);
    if (dO < ot) continue;
    if (dO > ot) shapes.push(otrezokNa(ot, a, dO, a, 'lineC', 'solid', 5.5));
    const koncy: [number, boolean][] =
      k.ot === k.do
        ? [[k.ot, true]]
        : [
            [k.ot, k.otVkl],
            [k.do, k.doVkl],
          ];
    for (const [v, vkl] of koncy) {
      if (Number.isFinite(v) && v >= x[0] && v <= x[1]) {
        points.push(tochka(v, a, null, !vkl, 'lineC'));
      }
    }
  }
  return { shapes, points };
}

/** Корни кусочно-линейной f: изломы известны, на каждом куске — линейное уравнение. */
export function korniKL(f: (x: number) => number, izlomy: number[]): number {
  const t = [...new Set(izlomy)].sort((p, q) => p - q);
  const granicy = [-Infinity, ...t, Infinity];
  const korni: number[] = [];
  for (let i = 0; i + 1 < granicy.length; i++) {
    const lo = granicy[i]!;
    const hi = granicy[i + 1]!;
    const p =
      lo === -Infinity ? (hi === Infinity ? 0 : hi - 1) : hi === Infinity ? lo + 1 : (lo + hi) / 2;
    const q = lo === -Infinity ? p - 1 : hi === Infinity ? p + 1 : (lo + 3 * hi) / 4;
    const k = (f(q) - f(p)) / (q - p);
    const b = f(p) - k * p;
    if (Math.abs(k) < 1e-12) {
      if (Math.abs(b) < 1e-12) return Infinity;
      continue;
    }
    const x = -b / k;
    if (x >= lo - 1e-12 && x <= hi + 1e-12 && !korni.some((y) => Math.abs(x - y) < 1e-9)) {
      korni.push(x);
    }
  }
  return korni.length;
}

/** Общие точки окружности и ломаной (по звеньям): точные, совпавшие — одна. */
export function tochkiOkrLomanoy(
  centr: [number, number],
  r: number,
  vershiny: [number, number][],
): number {
  const [cx, cy] = centr;
  const out: [number, number][] = [];
  if (!(r >= 0)) return 0;
  for (let i = 0; i < vershiny.length; i++) {
    const [px, py] = vershiny[i]!;
    const [qx, qy] = vershiny[(i + 1) % vershiny.length]!;
    const dx = qx - px;
    const dy = qy - py;
    const fx = px - cx;
    const fy = py - cy;
    const A = dx * dx + dy * dy;
    const B = 2 * (fx * dx + fy * dy);
    const C = fx * fx + fy * fy - r * r;
    /* Касание: дискриминант — нуль с ошибкой округления (R = √32), его
       допуск — относительный, иначе одна точка касания дала бы две. */
    const dop = 1e-9 * Math.max(1, B * B, Math.abs(4 * A * C));
    let D = B * B - 4 * A * C;
    if (D < -dop) continue;
    if (D < dop) D = 0;
    for (const t of [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)]) {
      if (t < -1e-9 || t > 1 + 1e-9) continue;
      const x = px + t * dx;
      const y = py + t * dy;
      if (!out.some(([u, v]) => Math.abs(u - x) < 1e-7 && Math.abs(v - y) < 1e-7)) {
        out.push([x, y]);
      }
    }
  }
  return out.length;
}

const W = (x: number) => Math.abs(Math.abs(x) - 2);

/** Ромб |x| + |y| = 2 разбора метода 2. */
const ROMB_2: [number, number][] = [
  [2, 0],
  [0, 2],
  [-2, 0],
  [0, -2],
];

/** «a = 0,25»: для подписи рисунка, плоским текстом. */
const chislo = (a: number) => String(Math.round(a * 100) / 100).replace('.', ',');

/* Разбор метода 3: (a − x²)(a − 2x − 3) ≤ 0 на плоскости (x; a). */
const PAR = (x: number) => x * x;
const PR3 = (x: number) => 2 * x + 3;
const OKNO_M03: { x: [number, number]; y: [number, number] } = { x: [-4, 5], y: [-2, 10] };

/** Область (a − x²)(a − 2x − 3) ≤ 0: a между параболой и прямой — три куска по x. */
export function oblastM03R1(): Figura19[] {
  const [x0, x1] = OKNO_M03.x;
  return [
    oblastMezhdu(PR3, PAR, x0, -1, OKNO_M03.y),
    oblastMezhdu(PAR, PR3, -1, 3, OKNO_M03.y),
    oblastMezhdu(PR3, PAR, 3, x1, OKNO_M03.y),
  ];
}

function m03r1Mnozhestvo(a: number): KusokX19[] {
  return mnozhestvoX(
    (x) => (a - x * x) * (a - 2 * x - 3) <= 1e-9,
    [(a - 3) / 2, ...(a >= 0 ? [-Math.sqrt(a), Math.sqrt(a)] : [])],
  );
}

/**
 * Корни квадратного (при A = 0 — линейного) уравнения Ax² + Bx + C = 0.
 * Касание — дискриминант нуль с ошибкой округления: допуск
 * относительный, иначе особое значение 2√2 дало бы два корня или ни одного.
 */
function korniKv(A: number, B: number, C: number): number[] {
  if (Math.abs(A) < 1e-12) {
    return Math.abs(B) < 1e-12 ? [] : [-C / B];
  }
  const D = B * B - 4 * A * C;
  const dop = 1e-9 * Math.max(1, B * B, Math.abs(4 * A * C));
  if (D < -dop) return [];
  if (D <= dop) return [-B / (2 * A)];
  const s = Math.sqrt(D);
  return [(-B - s) / (2 * A), (-B + s) / (2 * A)];
}

/* Разбор метода 4: √(4 − x²) = x + a. Корни 2x² + 2ax + a² − 4 = 0 с |x| ≤ 2 и x + a ≥ 0. */
function m04r1Resheniy(a: number): number {
  return korniKv(2, 2 * a, a * a - 4).filter((x) => Math.abs(x) <= 2 + 1e-9 && x + a >= -1e-9)
    .length;
}

/* Разбор метода 4: 1/|x| = kx + 2. При x > 0 — kx² + 2x − 1 = 0, при x < 0 — kx² + 2x + 1 = 0. */
function m04r3Resheniy(k: number): number {
  const prav = korniKv(k, 2, -1).filter((x) => x > 1e-12);
  const lev = korniKv(k, 2, 1).filter((x) => x < -1e-12);
  return prav.length + lev.length;
}

const POLUOKR_2 = (x: number) => Math.sqrt(Math.max(0, 4 - x * x));
const GIP_MOD = (x: number) => (Math.abs(x) < 0.12 ? null : 1 / Math.abs(x));

/* ── Метод 5: чётность ───────────────────────────────────────────── */

const blizko = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/**
 * Корни уравнения φ(|x|) = 0 по корням t ≥ 0 уравнения φ(t) = 0:
 * t = 0 даёт один корень x = 0, каждое t > 0 — пару ±t.
 */
function korniChetnye(t: number[]): number[] {
  const out: number[] = [];
  for (const v of t) {
    if (Math.abs(v) < 1e-9) out.push(0);
    else if (v > 0) out.push(-v, v);
  }
  return [...new Set(out)].sort((p, q) => p - q);
}

/* Разбор метода 5: x² + a|x| + a² − 4 = 0, при x ≥ 0 — t² + at + a² − 4 = 0. */
function m05r1Korni(a: number): number[] {
  return korniChetnye(korniKv(1, a, a * a - 4));
}

/* Разбор метода 5: y = x² + a, x² + y² = 1. Подстановка x² = y − a: y² + y − a − 1 = 0, x² = y − a ≥ 0. */
function m05r3Tochki(a: number): [number, number][] {
  const out: [number, number][] = [];
  for (const y of korniKv(1, 1, -a - 1)) {
    const x2 = y - a;
    if (Math.abs(x2) < 1e-9) out.push([0, y]);
    else if (x2 > 0) out.push([-Math.sqrt(x2), y], [Math.sqrt(x2), y]);
  }
  return out;
}

const ZHIVYE: Record<string, Zhivoy19> = {
  /* Разбор метода 5: график y = x² + a|x| + a² − 4 и его нули — симметричные пары и x = 0. */
  'm05-r1': {
    vid: 'grafik',
    bukva: 'a',
    min: -3,
    max: 3,
    shag: 0.01,
    start: 1,
    osobye: [
      { a: -4 / Math.sqrt(3), tex: '-\\frac{4}{\\sqrt3}' },
      { a: -2, tex: '-2' },
      { a: 2, tex: '2' },
      { a: 4 / Math.sqrt(3), tex: '\\frac{4}{\\sqrt3}' },
    ],
    scena: (a) =>
      scena(
        { x: [-4, 4], y: [-5, 6] },
        {
          curves: [grafik((x) => x * x + a * Math.abs(x) + a * a - 4, 'lineA')],
          points: m05r1Korni(a).map((x) => tochka(x, 0, null, false, x === 0 ? 'accent' : 'cross')),
        },
        `График y = x² + a|x| + a² − 4 при a = ${chislo(a)} и его нули`,
      ),
    resheniy: (a) => m05r1Korni(a).length,
    itog: (a) => {
      if (blizko(a, 2)) return 'найденное значение: корень один, $x=0$';
      if (blizko(a, -2)) return 'кандидат отброшен: кроме $x=0$ ещё $x=\\pm2$';
      return m05r1Korni(a).length > 0 ? 'корни парами $\\pm x_0$, $x=0$ не корень' : 'корней нет';
    },
  },
  /* Разбор метода 5: окружность x² + y² = 1 и парабола y = x² + a, сдвигающаяся по вертикали. */
  'm05-r3': {
    vid: 'grafik',
    bukva: 'a',
    min: -2,
    max: 2,
    shag: 0.01,
    start: 0,
    osobye: [
      { a: -1.25, tex: '-\\frac54' },
      { a: -1, tex: '-1' },
      { a: 1, tex: '1' },
    ],
    scena: (a) =>
      scena(
        { x: [-2.5, 2.5], y: [-2, 2.5] },
        {
          curves: [okruzhnost(0, 0, 1, 'lineA'), grafik((x) => x * x + a, 'lineB')],
          points: m05r3Tochki(a).map(([x, y]) =>
            tochka(x, y, null, false, x === 0 ? 'accent' : 'cross'),
          ),
        },
        `Окружность x² + y² = 1 и парабола y = x² + a при a = ${chislo(a)}`,
      ),
    resheniy: (a) => m05r3Tochki(a).length,
    itog: (a) => {
      if (blizko(a, 1)) return 'найденное значение: решение одно, $(0;\\,1)$';
      if (blizko(a, -1)) return 'кандидат отброшен: кроме $(0;\\,-1)$ ещё $(\\pm1;\\,0)$';
      return m05r3Tochki(a).length > 0
        ? 'решения парами $(\\pm x_0;\\,y_0)$, $x=0$ ни в одном'
        : 'решений нет';
    },
  },

  /* Разбор метода 4: полуокружность y = √(4 − x²) и прямые y = x + a — сдвиг параллельно. */
  'm04-r1': {
    vid: 'sdvig',
    bukva: 'a',
    min: -3,
    max: 3.5,
    shag: 0.01,
    start: 1,
    osobye: [
      { a: -2, tex: '-2' },
      { a: 2, tex: '2' },
      { a: 2 * Math.SQRT2, tex: '2\\sqrt2' },
    ],
    scena: (a) =>
      scena(
        { x: [-4, 4], y: [-2, 4] },
        {
          curves: [grafik(POLUOKR_2, 'lineA', { ot: -2, do: 2 }), pryamaya(1, a, 'lineB')],
          points: [tochka(-2, 0, 'A'), tochka(2, 0, 'B'), tochka(-Math.SQRT2, Math.SQRT2, 'T')],
        },
        `Полуокружность y = √(4 − x²) и прямая y = x + a при a = ${chislo(a)}`,
      ),
    resheniy: m04r1Resheniy,
  },
  /* Разбор метода 4: график y = 1/|x| и пучок прямых y = kx + 2 через A(0; 2). */
  'm04-r3': {
    bukva: 'k',
    min: -2,
    max: 2,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
    ],
    scena: (k) =>
      scena(
        { x: [-5, 5], y: [-2, 5] },
        {
          curves: [grafik(GIP_MOD, 'lineA'), pryamaya(k, 2, 'lineB')],
          points: [tochka(0, 2, 'A'), tochka(1, 1, 'T₁'), tochka(-1, 1, 'T₂')],
        },
        `График y = 1/|x| и прямая y = kx + 2 при k = ${chislo(k)}`,
      ),
    resheniy: m04r3Resheniy,
  },

  /* Разбор метода 1: ||x| − 2| = a(x − 8) + 2, пучок через A(8; 2). */
  'm01-r1': {
    bukva: 'a',
    min: -1.5,
    max: 1.5,
    shag: 0.01,
    start: 0.25,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 1 / 5, tex: '\\frac15' },
      { a: 1 / 3, tex: '\\frac13' },
      { a: 1, tex: '1' },
    ],
    scena: (a) =>
      scena(
        { x: [-6, 10], y: [-3, 6] },
        {
          curves: [grafik(W), pryamaya(a, 2 - 8 * a, 'lineB')],
          points: [tochka(8, 2, 'A'), tochka(2, 0, 'B'), tochka(-2, 0, 'C'), tochka(0, 2, 'D')],
        },
        `Ломаная y = ||x| − 2| и прямая y = a(x − 8) + 2 при a = ${chislo(a)}`,
      ),
    resheniy: (a) => korniKL((x) => W(x) - a * (x - 8) - 2, [-2, 0, 2]),
  },
  /* Разбор метода 2: ромб |x| + |y| = 2 и окружность с центром C(3; 3), R² = a. */
  'm02-r1': {
    vid: 'okruzhnost',
    bukva: 'a',
    min: 0,
    max: 40,
    shag: 0.1,
    start: 20,
    osobye: [
      { a: 8, tex: '8' },
      { a: 10, tex: '10' },
      { a: 32, tex: '32' },
      { a: 34, tex: '34' },
    ],
    scena: (a) =>
      scena(
        { x: [-3, 9], y: [-3, 9] },
        {
          curves: [
            lomanaya(ROMB_2, 'lineA', true),
            ...(a > 0 ? [okruzhnost(3, 3, Math.sqrt(a), 'lineB')] : []),
          ],
          points: [
            tochka(3, 3, 'C'),
            tochka(2, 0, 'K'),
            tochka(0, 2, 'L'),
            tochka(-2, 0, 'M'),
            tochka(0, -2, 'N'),
          ],
        },
        `Ромб |x| + |y| = 2 и окружность с центром C(3; 3), квадрат радиуса a = ${chislo(a)}`,
      ),
    /* a = 0 — одна точка C, она не на ромбе. */
    resheniy: (a) => (a <= 0 ? 0 : tochkiOkrLomanoy([3, 3], Math.sqrt(a), ROMB_2)),
  },
  /* Разбор метода 3: прямая a = const над областью (a − x²)(a − 2x − 3) ≤ 0, полоса −2 ≤ x ≤ 1. */
  'm03-r1': {
    vid: 'gorizontal',
    bukva: 'a',
    min: -2,
    max: 10,
    shag: 0.05,
    start: 2.5,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
      { a: 4, tex: '4' },
      { a: 5, tex: '5' },
    ],
    scena: (a) => {
      const kuski = kuskiNaPryamoy(m03r1Mnozhestvo(a), a, OKNO_M03.x);
      return scena(
        { ...OKNO_M03, osi: ['x', 'a'], deleniya: { x: [-2, 1], y: [-1, 5] } },
        {
          curves: [grafik(PAR, 'lineA'), grafik(PR3, 'lineA')],
          points: [tochka(-1, 1, 'A'), tochka(3, 9, 'B'), ...kuski.points],
          shapes: [
            ...oblastM03R1(),
            otrezokNa(-2, OKNO_M03.y[0], -2, OKNO_M03.y[1], 'cross', 'dashed', 1.4),
            otrezokNa(1, OKNO_M03.y[0], 1, OKNO_M03.y[1], 'cross', 'dashed', 1.4),
            gorizontal(a, OKNO_M03.x),
            ...kuski.shapes,
          ],
        },
        `Область (a − x²)(a − 2x − 3) ≤ 0 на плоскости (x; a), полоса −2 ≤ x ≤ 1 и прямая a = ${chislo(a)}`,
      );
    },
    mnozhestvo: m03r1Mnozhestvo,
    itog: (a) =>
      m03r1Mnozhestvo(a).some((k) => k.do >= -2 && k.ot <= 1)
        ? 'на отрезке $[-2;\\,1]$ решения есть'
        : 'на отрезке $[-2;\\,1]$ решений нет',
  },
};

export function zhivoy19(id: string): Zhivoy19 | undefined {
  return ZHIVYE[id];
}
