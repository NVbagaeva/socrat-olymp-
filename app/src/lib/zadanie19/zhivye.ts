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
 * Для симметрии (глава 6) — то же на плоскости xOy и для замены
 * x → 4 − x: решения на неподвижном множестве (прямая y = x, точка
 * x = 2) — акцентным цветом, остальные идут симметричными парами.
 *
 * Для метода инварианта (глава 7) спрашивают не про число решений, а
 * про свойство «при всех x» или «при любом b»: под рисунком только
 * вывод (itog), числа решений нет. Точки, где проверяется свойство, —
 * акцентным цветом, если оно там выполнено, и цветом пересечения, если
 * нарушено.
 *
 * Для метода оценки (глава 8) на рисунке обе части уравнения и граница
 * оценки y = M пунктиром: графики касаются, только когда границы
 * сходятся. Число решений считается точно — по точкам, где границы
 * достигаются, — точка касания акцентным цветом.
 *
 * Для аналитического способа (глава 9) на рисунке — корни x₁(a), x₂(a),
 * найденные по формуле: нули графика левой части или общие точки двух
 * графиков. Число корней считается по формуле, а не по картинке: корень,
 * ушедший за рамку, тоже считается, совпавшие корни — один раз,
 * посторонний корень (вне области) — пустой точкой и не в счёт.
 *
 * Для метода прямой параметра (глава 10) рисунок — сама прямая
 * параметра: полосы корней, а ползунок двигает по ней вертикальную метку.
 * На каждой полосе у метки — точка: закрашенная, если этот корень при
 * текущем a — решение, пустая, если нет. Число корней считается по
 * формулам корней: годные корни, совпавшие — один раз; под рисунком —
 * сами корни и пометка о совпавших.
 *
 * Для квадратных неравенств (глава 11) параметр двигает параболу, на
 * оси отмечен отрезок: под рисунком — множество решений неравенства и
 * вывод «верно ли оно при всех x отрезка». Наименьшее значение на
 * отрезке — точкой: акцентом, если оно положительно, цветом пересечения,
 * если нет; вершина вне отрезка — пустой точкой.
 *
 * Для тригонометрических уравнений (глава 12) ползунок двигает
 * горизонталь y = a над синусоидой, взятой только на отрезке из условия
 * (вне его — пунктиром), концы отрезка — точками. Корни на отрезке
 * считаются по формулам серий x = arcsin a + 2πk, x = π − arcsin a + 2πk:
 * концы отрезка включены, при a = ±1 серии совпадают — корень один.
 *
 * Для свойств функций (глава 13) ползунок двигает горизонталь y = a над
 * графиком y = x³ − 3x на отрезке [0; 2]; множество значений функции на
 * отрезке — толстым отрезком на оси y. Корни считаются по кускам
 * монотонности: на куске корень есть, только если a лежит между
 * значениями в его концах, общий конец кусков — один раз.
 *
 * Для метода упрощающего значения (глава 14) параметр меняет график
 * левой части неравенства, а проверяется одно число x = 1: его точка на
 * графике — акцентом, если значение там не больше нуля (x = 1 —
 * решение), цветом пересечения — если больше; когда x = 1 становится
 * нулём знаменателя, точки нет, через неё идёт асимптота. Под рисунком
 * только вывод (itog), как у метода 7.
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
  podpis,
  pryamaya,
  pryamayaParametra,
  scena,
  tochka,
  type Figura19,
  type KusokA19,
  type PryamayaParametra19,
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
  vid?: 'pryamaya' | 'sdvig' | 'okruzhnost' | 'gorizontal' | 'grafik' | 'parametr';
  bukva: string;
  min: number;
  max: number;
  shag: number;
  start: number;
  osobye: Osoboe19[];
  scena: (a: number) => Scena19;
  /**
   * Число решений; Infinity — бесконечно много. Нет его и нет множества —
   * под рисунком только вывод itog (метод 7: свойство «при всех x»).
   */
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

/** Общие точки окружности и замкнутой ломаной (по звеньям): точные, совпавшие — одна. */
export function peresecheniyaOkrLomanoy(
  centr: [number, number],
  r: number,
  vershiny: [number, number][],
): [number, number][] {
  const [cx, cy] = centr;
  const out: [number, number][] = [];
  if (!(r >= 0)) return out;
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
  return out;
}

/** Число общих точек окружности и ломаной. */
export function tochkiOkrLomanoy(
  centr: [number, number],
  r: number,
  vershiny: [number, number][],
): number {
  return peresecheniyaOkrLomanoy(centr, r, vershiny).length;
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

/* ── Метод 6: симметрия ──────────────────────────────────────────── */

const S2 = Math.SQRT2;

/* Разбор метода 6: ромб |x| + |y| = 2 и окружность с центром (a; a) радиуса √2. */
function m06r1Tochki(a: number): [number, number][] {
  return peresecheniyaOkrLomanoy([a, a], S2, ROMB_2);
}

/**
 * Разбор метода 6: x² − 4x + a(|x − 1| + |x − 3|) = a² + 3a − 6. При t = x − 2:
 * на |t| ≤ 1 — t² = a² + a − 2, на |t| > 1 — u² + 2au − (a² + 3a − 2) = 0, u = |t|.
 */
function m06r2F(a: number, x: number): number {
  return x * x - 4 * x + a * (Math.abs(x - 1) + Math.abs(x - 3)) - (a * a + 3 * a - 6);
}

function m06r2Korni(a: number): number[] {
  const c = a * a + a - 2;
  const vnutri = Math.abs(c) < 1e-9 ? [0] : c > 0 && c <= 1 + 1e-12 ? [Math.sqrt(c)] : [];
  const snaruzhi = korniKv(1, 2 * a, -(a * a + 3 * a - 2)).filter((u) => u > 1 + 1e-12);
  return korniChetnye([...vnutri, ...snaruzhi]).map((t) => t + 2);
}

/* ── Метод 7: инвариант ──────────────────────────────────────────── */

/** Значения b, при которых рисуются прямые семейства разбора 1. */
const B_M07: number[] = [-2, -1, 0, 1, 2];

/* Разбор метода 7: a²x − 3a + 2 = b(ax − 1). Левая часть минус правая — прямая по x. */
const m07r1F = (a: number, b: number, x: number) => (a * a - a * b) * x - 3 * a + 2 + b;

/* Разбор метода 7: sin²x + 2a cos x < a² + 3/4. Левая часть минус правая. */
const m07r2G = (a: number, x: number) => Math.sin(x) ** 2 + 2 * a * Math.cos(x) - a * a - 0.75;

/* Разбор метода 7: x² + 2|x − a| ≥ a². Левая часть минус правая. */
const m07r3G = (a: number, x: number) => x * x + 2 * Math.abs(x - a) - a * a;

/** Точка проверки: акцентом — свойство выполнено, цветом пересечения — нарушено. */
const proverka = (x: number, y: number, verno: boolean) =>
  tochka(x, y, null, false, verno ? 'accent' : 'cross');

/* ── Метод 8: оценка ─────────────────────────────────────────────── */

/* Разбор метода 8: cos πx = (x − a)² + (a − 2)² + 1 — правая часть ≥ 1 ≥ левой. */
const m08r1Prav = (a: number, x: number) => (x - a) ** 2 + (a - 2) ** 2 + 1;

/* Разбор метода 8: √(x² − 5x + 4) + |(x − 2)(x − a)|; на (1; 4) не определена. */
const m08r2G = (a: number, x: number) => {
  const p = x * x - 5 * x + 4;
  return p < 0 ? null : Math.sqrt(p) + Math.abs((x - 2) * (x - a));
};

/** Корни разбора 2 метода 8: сумма неотрицательных — нуль только в нулях корня x = 1, x = 4. */
const m08r2Korni = (a: number) => [1, 4].filter((x) => Math.abs(m08r2G(a, x) ?? 1) < 1e-9);

/* Разбор метода 8: 2^|x| + |a − 1| + |a − 3| = 2 + cos x; сдвиг левой части — |a − 1| + |a − 3|. */
const m08r3Sdvig = (a: number) => Math.abs(a - 1) + Math.abs(a - 3);

/* ── Метод 9: аналитический способ ───────────────────────────────── */

/** Корни квадратного (при A = 0 — линейного) уравнения по порядку. */
const korniPoPoryadku = (A: number, B: number, C: number) => korniKv(A, B, C).sort((p, q) => p - q);

/* Разбор метода 9: (a − 1)x² + 2ax + a + 3 = 0; при a = 1 уравнение линейное. */
const m09r1Korni = (a: number) => korniPoPoryadku(a - 1, 2 * a, a + 3);

/* Разбор метода 9: √(x + a) = x ⇔ x² − x − a = 0 и x ≥ 0; корень с x < 0 — посторонний. */
const m09r3Kvadrat = (a: number) => korniPoPoryadku(1, -1, -a);
const m09r3Korni = (a: number) => m09r3Kvadrat(a).filter((x) => x >= -1e-12);

/* Разбор метода 9: x² − 2ax + a + 2 = 0 и отрезок [0; 3]; корни на отрезке — акцентом. */
const m09r6Korni = (a: number) => korniPoPoryadku(1, -2 * a, a + 2);
const m09r6NaOtrezke = (x: number) => x >= -1e-9 && x <= 3 + 1e-9;

/** Корни строкой TeX: «$x_1=-1{,}62$, $x_2=0{,}62$», один — «$x=-2$». */
function korniTex(korni: number[]): string {
  if (korni.length === 1) return `$x=${chisloTex(korni[0]!)}$`;
  return korni.map((x, i) => `$x_${i + 1}=${chisloTex(x)}$`).join(', ');
}

/* ── Метод 11: квадратные неравенства ─────────────────────────────── */

/* Разбор метода 11: x² − 2ax + 2a + 3 > 0 при всех x ∈ [0; 4]; вершина x = a. */
const m11r3F = (a: number, x: number) => x * x - 2 * a * x + 2 * a + 3;

/** Где на [0; 4] наименьшее значение: в вершине, если она на отрезке, иначе в ближнем конце. */
const m11r3Min = (a: number) => Math.min(4, Math.max(0, a));

/** Множество решений x² − 2ax + 2a + 3 > 0 по x: границы — нули трёхчлена. */
const m11r3Mnozhestvo = (a: number): KusokX19[] =>
  mnozhestvoX((x) => m11r3F(a, x) > 1e-12, korniKv(1, -2 * a, 2 * a + 3));

/* ── Метод 12: тригонометрические уравнения ───────────────────────── */

/* Разбор метода 12: sin x = a на отрезке [−π/6; 4π/3]. */
const M12_OT = -Math.PI / 6;
const M12_DO = (4 * Math.PI) / 3;

/**
 * Корни sin x = a на отрезке [ot; do] — по формулам серий x = arcsin a + 2πk
 * и x = π − arcsin a + 2πk, концы отрезка включены, совпавшие (a = ±1) — один раз.
 */
export function korniSinNaOtrezke(a: number, ot: number, dO: number): number[] {
  if (a < -1 - 1e-12 || a > 1 + 1e-12) return [];
  const x0 = Math.asin(Math.max(-1, Math.min(1, a)));
  const out: number[] = [];
  for (let k = -3; k <= 3; k++) {
    for (const x of [x0 + 2 * Math.PI * k, Math.PI - x0 + 2 * Math.PI * k]) {
      if (x >= ot - 1e-9 && x <= dO + 1e-9 && !out.some((y) => Math.abs(y - x) < 1e-9)) {
        out.push(x);
      }
    }
  }
  return out.sort((p, q) => p - q);
}

/** Вывод под живым рисунком метода 12: откуда корни и почему их столько. */
function m12r1Itog(a: number): string {
  const s3 = Math.sqrt(3) / 2;
  if (a > 1 + 1e-9 || a < -1 - 1e-9) return 'прямая не пересекает синусоиду: $|a|>1$';
  if (Math.abs(a - 1) < 1e-9)
    return 'прямая касается графика в вершине $x=\\frac\\pi2$ — корень один';
  if (a >= -0.5 - 1e-9) {
    const kray = Math.abs(a + 0.5) < 1e-9 ? ' (левый — сам конец $x=-\\frac\\pi6$)' : '';
    return `по корню на каждой ветви: $x=\\arcsin a$ и $x=\\pi-\\arcsin a$${kray}`;
  }
  if (a >= -s3 - 1e-9) {
    const kray = Math.abs(a + s3) < 1e-9 ? ' — это сам конец $x=\\frac{4\\pi}3$' : '';
    return `только $x=\\pi-\\arcsin a$${kray}: на возрастающей ветви $\\sin x\\ge-\\frac12$`;
  }
  return 'на отрезке синус не меньше $-\\frac{\\sqrt3}2$ — корней нет, хотя $|a|\\le1$';
}

/* ── Метод 13: свойства функций ──────────────────────────────────── */

/* Разбор метода 13: x³ − 3x = a на отрезке [0; 2]; куски монотонности [0; 1] и [1; 2]. */
const m13r3F = (x: number) => x ** 3 - 3 * x;
const M13_KUSKI: [number, number][] = [
  [0, 1],
  [1, 2],
];

/**
 * Корень f(x) = a на куске [p; q], где f монотонна: есть, только если a
 * лежит между значениями в концах (сравнение точное — значения в концах
 * целые); сама точка — делением пополам. Нет корня — null.
 */
function korenNaKuske(f: (x: number) => number, a: number, p: number, q: number): number | null {
  const fp = f(p) - a;
  const fq = f(q) - a;
  if (fp === 0) return p;
  if (fq === 0) return q;
  if (fp * fq > 0) return null;
  let [l, r] = [p, q];
  for (let i = 0; i < 80; i++) {
    const m = (l + r) / 2;
    if ((f(m) - a) * fp > 0) l = m;
    else r = m;
  }
  return (l + r) / 2;
}

/** Корни x³ − 3x = a на [0; 2]: по корню с куска, общий конец x = 1 — один раз. */
export function m13r3Korni(a: number): number[] {
  const out: number[] = [];
  for (const [p, q] of M13_KUSKI) {
    const x = korenNaKuske(m13r3F, a, p, q);
    if (x !== null && !out.some((y) => blizko(x, y))) out.push(x);
  }
  return out;
}

/** Вывод под живым рисунком метода 13: на каких кусках монотонности корни. */
function m13r3Itog(a: number): string {
  if (a < -2 || a > 2) return 'прямая не встречает график: $a\\notin E(f)=[-2;\\,2]$';
  if (a === -2) return 'прямая проходит через вершину $x=1$ — общий конец двух кусков, корень один';
  if (a < 0) return 'по корню на каждом куске монотонности: $[0;\\,1]$ и $[1;\\,2]$';
  if (a === 0) return 'по корню на каждом куске; левый — сам конец $x=0$';
  const kray = a === 2 ? ' — это сам конец $x=2$' : '';
  return `корень только на возрастающем куске $[1;\\,2]$${kray}: на $[0;\\,1]$ значения не больше $0$`;
}

/** Сцена разбора метода 13: график на [0; 2], множество значений на оси y, горизонталь y = a. */
export function m13r3Scena(a: number | null): Scena19 {
  const okno = { x: [-1.3, 3.1] as [number, number], y: [-2.8, 2.8] as [number, number] };
  const korni = a === null ? [] : m13r3Korni(a);
  return scena(
    { ...okno, shag: 0.5, kletka: 56, deleniya: { x: [1, 2], y: [-2, 2] } },
    {
      curves: [
        grafik(m13r3F, 'lineA', { ot: -0.3, do: 0 }, 'dashed'),
        grafik(m13r3F, 'lineA', { ot: 2, do: 2.2 }, 'dashed'),
        grafik(m13r3F, 'lineA', { ot: 0, do: 2 }),
      ],
      shapes: [
        otrezokNa(0, -2, 0, 2, 'accent', 'solid', 5),
        podpis(-1.2, 1.55, 'E(f)', 'accent'),
        ...(a === null ? [] : [gorizontal(a, okno.x)]),
      ],
      points: [
        tochka(0, 0, 'A', false, 'lineA'),
        tochka(1, -2, 'M', false, 'lineA'),
        tochka(2, 2, 'B', false, 'lineA'),
        ...korni.map((x) => tochka(x, a ?? 0, null)),
      ],
    },
    a === null
      ? 'График y = x³ − 3x на отрезке [0; 2]: убывает от A(0; 0) до вершины M(1; −2), возрастает до B(2; 2); на оси y выделено множество значений [−2; 2]'
      : `График y = x³ − 3x на отрезке [0; 2], множество значений [−2; 2] на оси y и прямая y = ${chislo(a)}; корней на отрезке: ${korni.length}`,
  );
}

/* ── Метод 14: упрощающее значение ───────────────────────────────── */

/* Разбор метода 14: (x − a²)/(x + a − 3) ≤ 0 и число x = 1. Левая часть. */
const m14r1F = (a: number, x: number) => (x - a * a) / (x + a - 3);

/** Окно рисунка разбора 1 метода 14. */
const OKNO_M14: { x: [number, number]; y: [number, number] } = { x: [-3, 6], y: [-5, 5] };

/**
 * Сцена разбора 1 метода 14: график y = (x − a²)/(x + a − 3), асимптота
 * x = 3 − a пунктиром и точка графика при x = 1 — акцентом, если значение
 * там не больше нуля, цветом пересечения, если больше. При a = 2 число
 * x = 1 — нуль знаменателя: точки нет.
 */
export function m14r1Scena(a: number): Scena19 {
  const okno = OKNO_M14;
  const polyus = 3 - a;
  const f = (x: number) => m14r1F(a, x);
  const y1 = blizko(polyus, 1) ? null : m14r1F(a, 1);
  const vOkne = (y: number) => y >= okno.y[0] && y <= okno.y[1];
  return scena(
    { ...okno, deleniya: { x: [1] } },
    {
      curves: [grafik(f, 'lineA', { do: polyus }), grafik(f, 'lineA', { ot: polyus })],
      shapes:
        polyus > okno.x[0] && polyus < okno.x[1]
          ? [otrezokNa(polyus, okno.y[0], polyus, okno.y[1], 'aux', 'dashed', 1.4)]
          : [],
      points: y1 !== null && vOkne(y1) ? [proverka(1, y1, y1 <= 1e-12)] : [],
    },
    y1 === null
      ? `График y = (x − a²)/(x + a − 3) при a = ${chislo(a)}: асимптота x = 1, при x = 1 дробь не определена`
      : `График y = (x − a²)/(x + a − 3) при a = ${chislo(a)}, асимптота пунктиром и точка графика при x = 1`,
  );
}

/** Вывод под живым рисунком метода 14: решение ли x = 1 при этом a. */
function m14r1Itog(a: number): string {
  if (blizko(a, 2)) return 'при $x=1$ знаменатель равен нулю: $x=1$ не решение';
  const y1 = m14r1F(a, 1);
  if (y1 <= 1e-12) {
    const znak = Math.abs(y1) < 1e-12 ? '=0' : `=${chisloTex(y1)}<0`;
    return `при $x=1$ значение $\\frac{1-a^2}{a-2}${znak}$: $x=1$ — решение`;
  }
  return `при $x=1$ значение $\\frac{1-a^2}{a-2}=${chisloTex(y1)}>0$: $x=1$ не решение`;
}

/* ── Метод 10: прямая параметра ──────────────────────────────────── */

const kA = (ot: number, dO: number, otVkl = true, doVkl = true): KusokA19 => ({
  ot,
  do: dO,
  otVkl,
  doVkl,
});
const VSYA_A = kA(-Infinity, Infinity, false, false);

/** Корень-кандидат: имя (TeX), формула и условие, при котором он — решение. */
interface KorenA19 {
  imya: string;
  x: (a: number) => number;
  verno: (a: number) => boolean;
}

/** Годные корни при этом a, совпавшие — один раз. */
function godnye(korni: KorenA19[], a: number): number[] {
  const out: number[] = [];
  for (const k of korni) {
    if (!k.verno(a)) continue;
    const x = k.x(a);
    if (!out.some((y) => blizko(x, y))) out.push(x);
  }
  return out.sort((p, q) => p - q);
}

/** Строка под рисунком: корни и что с ними при этом a. */
function itogKorney(korni: KorenA19[], a: number): string {
  const chasti: string[] = [];
  const vzyaty: { imya: string; x: number }[] = [];
  const sovpali: string[] = [];
  for (const k of korni) {
    if (!k.verno(a)) continue;
    const x = k.x(a);
    const pr = vzyaty.find((v) => blizko(v.x, x));
    if (pr === undefined) vzyaty.push({ imya: k.imya, x });
    else sovpali.push(`$${k.imya}$ совпал с $${pr.imya}$`);
  }
  const ne = korni.filter((k) => !k.verno(a)).map((k) => `$${k.imya}$`);
  chasti.push(
    vzyaty.length === 0
      ? 'годных корней нет'
      : `корни ${vzyaty.map((v) => `$${chisloTex(v.x)}$`).join(', ')}`,
  );
  if (sovpali.length > 0) chasti.push(sovpali.join(', '));
  if (ne.length > 0) chasti.push(`не решение: ${ne.join(', ')}`);
  return chasti.join('; ');
}

/** Прямая параметра разбора 1 метода 10: (x² − 3ax + 2a² − a − 1)·lg(x + 1) = 0. */
export const OPISANIE_M10_R1: Omit<PryamayaParametra19, 'alt'> = {
  a: [-3, 1.8],
  masshtab: 2,
  osobye: [-2, -1, -0.5, 0, 1],
  podpisi: ['−2', '−1', '−1/2', '0', '1'],
  polosy: [
    { imya: 'x = 0', kuski: [VSYA_A], cvet: 'lineA' },
    { imya: 'x = 2a + 1', kuski: [kA(-1, Infinity, false, false)], cvet: 'lineB' },
    { imya: 'x = a − 1', kuski: [kA(0, Infinity, false, false)], cvet: 'lineC' },
  ],
  schet: { promezhutki: [1, 1, 2, 2, 3, 3], tochki: [1, 1, 1, 2, 2] },
};

const KORNI_M10_R1: KorenA19[] = [
  { imya: 'x=0', x: () => 0, verno: () => true },
  { imya: 'x=2a+1', x: (a) => 2 * a + 1, verno: (a) => 2 * a + 1 > -1 + 1e-12 },
  { imya: 'x=a-1', x: (a) => a - 1, verno: (a) => a - 1 > -1 + 1e-12 },
];

/** Прямая параметра разбора 2 метода 10: (x² − (2a + 1)x + a² + a)/(x − 2) = 0 на [0; 3]. */
export const OPISANIE_M10_R2: Omit<PryamayaParametra19, 'alt'> = {
  a: [-2, 4],
  masshtab: 1.5,
  osobye: [-1, 0, 1, 2, 3],
  polosy: [
    { imya: 'x = a', kuski: [kA(0, 2, true, false), kA(2, 3, false, true)], cvet: 'lineA' },
    {
      imya: 'x = a + 1',
      kuski: [kA(-1, 1, true, false), kA(1, 2, false, true)],
      cvet: 'lineB',
    },
  ],
  schet: { promezhutki: [0, 1, 2, 2, 1, 0], tochki: [1, 2, 1, 1, 1] },
};

const naOtrezke03 = (x: number) => x >= -1e-12 && x <= 3 + 1e-12 && !blizko(x, 2);
const KORNI_M10_R2: KorenA19[] = [
  { imya: 'x=a', x: (a) => a, verno: (a) => naOtrezke03(a) },
  { imya: 'x=a+1', x: (a) => a + 1, verno: (a) => naOtrezke03(a + 1) },
];

/** Живой рисунок метода 10 по описанию прямой и корням. */
function zhivoyParametr(z: {
  opisanie: Omit<PryamayaParametra19, 'alt'>;
  korni: KorenA19[];
  osobye: Osoboe19[];
  start: number;
  alt: string;
}): Zhivoy19 {
  const { opisanie, korni } = z;
  return {
    vid: 'parametr',
    bukva: 'a',
    min: opisanie.a[0],
    max: opisanie.a[1],
    shag: 0.01,
    start: z.start,
    osobye: z.osobye,
    scena: (a) =>
      pryamayaParametra({
        ...opisanie,
        metka: { a, verny: korni.map((k) => k.verno(a)) },
        alt: `${z.alt} при a = ${chislo(a)}`,
      }),
    resheniy: (a) => godnye(korni, a).length,
    itog: (a) => itogKorney(korni, a),
  };
}

const ZHIVYE: Record<string, Zhivoy19> = {
  /*
   * Разбор метода 14: график левой части (x − a²)/(x + a − 3) ≤ 0 и его точка
   * при x = 1 — решение ли x = 1. Под рисунком только вывод, как у метода 7.
   */
  'm14-r1': {
    vid: 'grafik',
    bukva: 'a',
    min: -2.5,
    max: 4,
    shag: 0.01,
    start: 0,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
    ],
    scena: m14r1Scena,
    itog: m14r1Itog,
  },
  /*
   * Разбор метода 13: график y = x³ − 3x на отрезке [0; 2] (вне его — пунктиром),
   * множество значений [−2; 2] — толстым отрезком на оси y, горизонталь y = a.
   * Число корней — по кускам монотонности [0; 1] и [1; 2]: корень на куске есть,
   * только если a между значениями в его концах; общий конец x = 1 — один раз.
   */
  'm13-r3': {
    vid: 'sdvig',
    bukva: 'a',
    min: -2.6,
    max: 2.6,
    shag: 0.01,
    start: -1,
    osobye: [
      { a: -2, tex: '-2' },
      { a: 0, tex: '0' },
      { a: 2, tex: '2' },
    ],
    scena: (a) => m13r3Scena(a),
    resheniy: (a) => m13r3Korni(a).length,
    itog: m13r3Itog,
  },
  /*
   * Разбор метода 12: синусоида на отрезке [−π/6; 4π/3] (вне отрезка — пунктиром)
   * и горизонталь y = a; корни на отрезке — точками пересечения, концы отрезка — A и B.
   * Число корней — по формулам серий, а не по картинке.
   */
  'm12-r1': {
    vid: 'sdvig',
    bukva: 'a',
    min: -1.5,
    max: 1.5,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: -1, tex: '-1' },
      { a: -Math.sqrt(3) / 2, tex: '-\\frac{\\sqrt3}2' },
      { a: -0.5, tex: '-\\frac12' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
    ],
    scena: (a) => {
      /* Деления у края окна движок не ставит: до −π/6, 4π/3 и ±1 — больше клетки. */
      const okno = { x: [-1.6, 5.3] as [number, number], y: [-2.05, 2.05] as [number, number] };
      const korni = korniSinNaOtrezke(a, M12_OT, M12_DO);
      return scena(
        {
          ...okno,
          shag: 0.5,
          kletka: 52,
          deleniya: {
            x: [
              [M12_OT, '−π/6'],
              [Math.PI / 2, 'π/2'],
              [Math.PI, 'π'],
              [M12_DO, '4π/3'],
            ],
            y: [-1, 1],
          },
        },
        {
          curves: [
            grafik((x) => Math.sin(x), 'lineA', { ot: okno.x[0], do: M12_OT }, 'dashed'),
            grafik((x) => Math.sin(x), 'lineA', { ot: M12_DO, do: okno.x[1] }, 'dashed'),
            grafik((x) => Math.sin(x), 'lineA', { ot: M12_OT, do: M12_DO }),
          ],
          shapes: [gorizontal(a, okno.x)],
          points: [
            tochka(M12_OT, -0.5, 'A', false, 'lineA'),
            tochka(M12_DO, -Math.sqrt(3) / 2, 'B', false, 'lineA'),
            ...korni.map((x) => tochka(x, a, null)),
          ],
        },
        `График y = sin x на отрезке [−π/6; 4π/3] и прямая y = ${chislo(a)}; корней на отрезке: ${korni.length}`,
      );
    },
    resheniy: (a) => korniSinNaOtrezke(a, M12_OT, M12_DO).length,
    itog: m12r1Itog,
  },
  /*
   * Разбор метода 11: парабола y = x² − 2ax + 2a + 3 и отрезок [0; 4] на оси;
   * под рисунком — множество решений неравенства > 0 и вывод: наименьшее
   * значение на отрезке (в вершине или в конце) и верно ли неравенство на всём отрезке.
   */
  'm11-r3': {
    vid: 'grafik',
    bukva: 'a',
    min: -3,
    max: 5,
    shag: 0.01,
    start: -1.2,
    osobye: [
      { a: -1.5, tex: '-\\frac32' },
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 3, tex: '3' },
      { a: 4, tex: '4' },
    ],
    scena: (a) => {
      const okno = { x: [-3, 7] as [number, number], y: [-4, 9] as [number, number] };
      const m = m11r3Min(a);
      const fm = m11r3F(a, m);
      /* Точка, ушедшая ниже рамки, не рисуется: вывод под рисунком всё равно её называет. */
      const vOkne = (x: number, y: number) =>
        x >= okno.x[0] && x <= okno.x[1] && y >= okno.y[0] && y <= okno.y[1];
      const points = vOkne(m, fm)
        ? [tochka(m, fm, null, false, fm > 1e-12 ? 'accent' : 'cross')]
        : [];
      const fv = m11r3F(a, a);
      if (!blizko(m, a) && vOkne(a, fv)) {
        points.push(tochka(a, fv, null, true, 'lineA'));
      }
      return scena(
        okno,
        {
          curves: [grafik((x) => m11r3F(a, x), 'lineA')],
          shapes: [
            otrezokNa(0, 0, 4, 0, 'cross', 'solid', 4.5),
            otrezokNa(4, okno.y[0], 4, okno.y[1], 'cross', 'dashed', 1.2),
          ],
          points,
        },
        `Парабола y = x² − 2ax + 2a + 3 при a = ${chislo(a)}, отрезок [0; 4] на оси x и наименьшее значение на нём`,
      );
    },
    mnozhestvo: m11r3Mnozhestvo,
    itog: (a) => {
      const m = m11r3Min(a);
      const fm = m11r3F(a, m);
      const tochkaMin = a < 0 ? '0' : a > 4 ? '4' : 'a';
      const gde =
        a < 0
          ? 'вершина левее отрезка, наименьшее значение на $[0;\\,4]$ — в конце'
          : a > 4
            ? 'вершина правее отрезка, наименьшее значение на $[0;\\,4]$ — в конце'
            : `вершина $x=${chisloTex(a)}$ на отрезке, наименьшее значение на нём — в вершине`;
      const verdikt =
        fm > 1e-12
          ? 'неравенство верно при всех $x\\in[0;\\,4]$'
          : 'на отрезке есть $x$, где неравенство неверно';
      const znak = fm > 1e-12 ? '>0' : '\\le0';
      return `${gde}: $f(${tochkaMin})=${chisloTex(fm)}${znak}$ — ${verdikt}`;
    },
  },
  /* Разбор метода 10: прямая параметра, метка a и годные корни на полосах. */
  'm10-r1': zhivoyParametr({
    opisanie: OPISANIE_M10_R1,
    korni: KORNI_M10_R1,
    osobye: [
      { a: -2, tex: '-2' },
      { a: -1, tex: '-1' },
      { a: -0.5, tex: '-\\frac12' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
    ],
    start: -0.25,
    alt: 'Прямая параметра уравнения (x² − 3ax + 2a² − a − 1)·lg(x + 1) = 0, метка',
  }),
  'm10-r2': zhivoyParametr({
    opisanie: OPISANIE_M10_R2,
    korni: KORNI_M10_R2,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
      { a: 3, tex: '3' },
    ],
    start: 0.5,
    alt: 'Прямая параметра уравнения (x² − (2a + 1)x + a² + a)/(x − 2) = 0 на [0; 3], метка',
  }),
  /* Разбор метода 9: график y = (a − 1)x² + 2ax + a + 3 и его нули; при a = 1 — прямая. */
  'm09-r1': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 3,
    shag: 0.01,
    start: 0,
    osobye: [
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
      { a: 1.5, tex: '\\frac32' },
      { a: 2, tex: '2' },
    ],
    scena: (a) => {
      const okno = { x: [-7, 4] as [number, number], y: [-5, 7] as [number, number] };
      const korni = m09r1Korni(a);
      return scena(
        okno,
        {
          curves: [grafik((x) => (a - 1) * x * x + 2 * a * x + a + 3, 'lineA')],
          points: korni
            .filter((x) => x >= okno.x[0] && x <= okno.x[1])
            .map((x) => tochka(x, 0, null, false, korni.length === 1 ? 'accent' : 'cross')),
        },
        `График y = (a − 1)x² + 2ax + a + 3 при a = ${chislo(a)} и его нули`,
      );
    },
    resheniy: (a) => m09r1Korni(a).length,
    itog: (a) => {
      const korni = m09r1Korni(a);
      if (blizko(a, 1))
        return 'старший коэффициент — нуль: уравнение $2x+4=0$ линейное, корень $x=-2$';
      if (korni.length === 0) return '$\\frac D4=3-2a<0$: корней нет';
      if (korni.length === 1) return `$\\frac D4=0$: корень один, ${korniTex(korni)}`;
      const za = korni.some((x) => x < -7 || x > 4) ? ' (один — за рамкой рисунка)' : '';
      return `${korniTex(korni)}${za}`;
    },
  },
  /* Разбор метода 9: y = √(x + a) и y = x; посторонний корень x² − x − a = 0 с x < 0 — пустой точкой. */
  'm09-r3': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 2,
    shag: 0.01,
    start: -0.1,
    osobye: [
      { a: -0.25, tex: '-\\frac14' },
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
    ],
    scena: (a) => {
      const kv = m09r3Kvadrat(a);
      return scena(
        { x: [-2, 4], y: [-2, 3.5] },
        {
          curves: [
            grafik((x) => (x + a < 0 ? null : Math.sqrt(x + a)), 'lineA', { ot: -a }),
            grafik((x) => (x + a < 0 ? null : -Math.sqrt(x + a)), 'lineC', { ot: -a }, 'dashed'),
            pryamaya(1, 0, 'lineB'),
          ],
          points: kv.map((x) =>
            x >= -1e-12
              ? tochka(x, x, null, false, kv.length === 1 ? 'accent' : 'cross')
              : tochka(x, x, null, true, 'cross'),
          ),
        },
        `Графики y = √(x + a) при a = ${chislo(a)} и y = x; пунктиром — y = −√(x + a)`,
      );
    },
    resheniy: (a) => m09r3Korni(a).length,
    itog: (a) => {
      const kv = m09r3Kvadrat(a);
      const korni = m09r3Korni(a);
      if (kv.length === 0) return 'у $x^2-x-a=0$ корней нет: $1+4a<0$';
      if (kv.length === 1) return `корни $x^2-x-a=0$ совпали: ${korniTex(korni)}`;
      if (korni.length === 1)
        return `$x=${chisloTex(kv[0]!)}<0$ — посторонний: он корень уравнения $-\\sqrt{x+a}=x$`;
      return `оба корня $x^2-x-a=0$ не меньше нуля: ${korniTex(korni)}`;
    },
  },

  /* Разбор метода 9: парабола y = x² − 2ax + a + 2 и отрезок [0; 3]; под рисунком — сколько корней на отрезке. */
  'm09-r6': {
    vid: 'grafik',
    bukva: 'a',
    min: -3,
    max: 3.5,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: -2, tex: '-2' },
      { a: -1, tex: '-1' },
      { a: 2, tex: '2' },
      { a: 2.1, tex: '2{,}1' },
      { a: 2.2, tex: '\\frac{11}5' },
      { a: 3, tex: '3' },
    ],
    scena: (a) => {
      const okno = { x: [-4, 6] as [number, number], y: [-4, 7] as [number, number] };
      const korni = m09r6Korni(a);
      return scena(
        okno,
        {
          curves: [grafik((x) => x * x - 2 * a * x + a + 2, 'lineA')],
          shapes: [
            otrezokNa(0, 0, 3, 0, 'aux', 'solid', 4),
            otrezokNa(3, okno.y[0], 3, okno.y[1], 'aux', 'dashed', 1.4),
          ],
          points: korni
            .filter((x) => x >= okno.x[0] && x <= okno.x[1])
            .map((x) => tochka(x, 0, null, false, m09r6NaOtrezke(x) ? 'accent' : 'cross')),
        },
        `Парабола y = x² − 2ax + a + 2 при a = ${chislo(a)}, отрезок [0; 3] на оси x и нули параболы`,
      );
    },
    itog: (a) => {
      const korni = m09r6Korni(a);
      const na = korni.filter(m09r6NaOtrezke).length;
      const kontsy = `$f(0)=${chisloTex(a + 2)}$, $f(3)=${chisloTex(11 - 5 * a)}$`;
      if (korni.length === 0) return `корней нет: $\\frac D4=a^2-a-2<0$; ${kontsy}`;
      const za = korni.some((x) => x < -4 || x > 6) ? ' (один — за рамкой рисунка)' : '';
      if (na === 0) {
        const vne = korni.length === 1 ? 'двойной корень' : 'оба корня';
        return `на отрезке $[0;\\,3]$ корней нет, ${vne} вне его: ${korniTex(korni)}; ${kontsy}`;
      }
      const skolko =
        na === 1 ? 'на отрезке $[0;\\,3]$ ровно один корень' : 'на отрезке $[0;\\,3]$ два корня';
      const dvoynoy = korni.length === 1 ? ' (двойной)' : '';
      return `${skolko}${dvoynoy}: ${korniTex(korni)}${za}; ${kontsy}`;
    },
  },

  /* Разбор метода 8: косинусоида и парабола с вершиной (a; (a − 2)² + 1); касание только при a = 2. */
  'm08-r1': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 5,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
      { a: 3, tex: '3' },
    ],
    scena: (a) => {
      const okno = { x: [-2, 6] as [number, number], y: [-1.5, 6] as [number, number] };
      const vershina = (a - 2) ** 2 + 1;
      return scena(
        okno,
        {
          curves: [
            grafik((x) => Math.cos(Math.PI * x), 'lineA'),
            grafik((x) => m08r1Prav(a, x), 'lineB'),
            pryamaya(0, 1, 'aux', 'dashed'),
          ],
          points:
            vershina <= okno.y[1]
              ? [tochka(a, vershina, null, false, blizko(a, 2) ? 'accent' : 'cross')]
              : [],
        },
        `График y = cos πx, парабола y = (x − a)² + (a − 2)² + 1 при a = ${chislo(a)} и прямая y = 1`,
      );
    },
    resheniy: (a) => (blizko(a, 2) ? 1 : 0),
    itog: (a) =>
      blizko(a, 2)
        ? 'оценки сошлись: обе части равны $1$ при $x=2$'
        : `вершина параболы выше прямой $y=1$: правая часть не меньше $${chisloTex((a - 2) ** 2 + 1)}$`,
  },
  /* Разбор метода 8: график суммы неотрицательных на её области и нули модуля пунктиром. */
  'm08-r2': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 6,
    shag: 0.01,
    start: 2.5,
    osobye: [
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
      { a: 4, tex: '4' },
    ],
    scena: (a) => {
      const okno = { x: [-1.5, 6.5] as [number, number], y: [-1, 7] as [number, number] };
      return scena(
        okno,
        {
          curves: [
            grafik((x) => m08r2G(a, x), 'lineA'),
            grafik((x) => Math.abs((x - 2) * (x - a)), 'aux', {}, 'dashed'),
          ],
          points: [1, 4]
            .map((x) => [x, m08r2G(a, x) ?? 0] as const)
            .filter(([, y]) => y <= okno.y[1])
            .map(([x, y]) => proverka(x, y, Math.abs(y) < 1e-9)),
        },
        `График y = √(x² − 5x + 4) + |(x − 2)(x − a)| при a = ${chislo(a)} на области x ≤ 1, x ≥ 4; пунктиром — y = |(x − 2)(x − a)|`,
      );
    },
    resheniy: (a) => m08r2Korni(a).length,
    itog: (a) => {
      if (blizko(a, 1)) return 'при $x=1$ оба слагаемых — нули';
      if (blizko(a, 4)) return 'при $x=4$ оба слагаемых — нули';
      if (blizko(a, 2)) return 'модуль — нуль только при $x=2$, а там корень не определён';
      return 'в точках $x=1$ и $x=4$ модуль не нуль';
    },
  },
  /* Разбор метода 8: y = 2^|x| + |a − 1| + |a − 3| и y = 2 + cos x; касание в (0; 3) при 1 ≤ a ≤ 3. */
  'm08-r3': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 5,
    shag: 0.01,
    start: 0,
    osobye: [
      { a: 0, tex: '0' },
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
      { a: 3, tex: '3' },
      { a: 4, tex: '4' },
    ],
    scena: (a) => {
      const okno = { x: [-4, 4] as [number, number], y: [-0.5, 7] as [number, number] };
      const niz = 1 + m08r3Sdvig(a);
      return scena(
        okno,
        {
          curves: [
            grafik((x) => 2 + Math.cos(x), 'lineA'),
            grafik((x) => 2 ** Math.abs(x) + m08r3Sdvig(a), 'lineB'),
            pryamaya(0, 3, 'aux', 'dashed'),
          ],
          points:
            niz <= okno.y[1]
              ? [tochka(0, niz, null, false, niz <= 3 + 1e-9 ? 'accent' : 'cross')]
              : [],
        },
        `Графики y = 2^|x| + |a − 1| + |a − 3| при a = ${chislo(a)} и y = 2 + cos x, прямая y = 3`,
      );
    },
    resheniy: (a) => (m08r3Sdvig(a) <= 2 + 1e-9 ? 1 : 0),
    itog: (a) =>
      m08r3Sdvig(a) <= 2 + 1e-9
        ? '$|a-1|+|a-3|=2$: графики касаются в $(0;\\,3)$'
        : `$|a-1|+|a-3|=${chisloTex(m08r3Sdvig(a))}>2$: левая часть больше $3$`,
  },

  /* Разбор метода 7: прямые y = (a² − ab)x − 3a + 2 + b при b = −2…2; при a = 1 все через (1; 0). */
  'm07-r1': {
    vid: 'grafik',
    bukva: 'a',
    min: -1,
    max: 3,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
    ],
    scena: (a) => {
      const okno = { x: [-2, 4] as [number, number], y: [-5, 5] as [number, number] };
      const tochki = B_M07.map((b) => m07r1F(a, b, 1))
        .filter((y) => y >= okno.y[0] && y <= okno.y[1])
        .filter((y, i, v) => v.findIndex((u) => Math.abs(u - y) < 1e-9) === i)
        .map((y) => proverka(1, y, Math.abs(y) < 1e-9));
      return scena(
        okno,
        {
          curves: B_M07.map((b) => grafik((x) => m07r1F(a, b, x), b === 0 ? 'lineB' : 'lineA')),
          shapes: [otrezokNa(1, okno.y[0], 1, okno.y[1], 'aux', 'dashed', 1.4)],
          points: tochki,
        },
        `Прямые y = (a² − ab)x − 3a + 2 + b при b = −2, −1, 0, 1, 2 и a = ${chislo(a)}; пунктиром — прямая x = 1`,
      );
    },
    itog: (a) => {
      if (blizko(a, 1)) return 'все прямые проходят через $(1;\\,0)$: $x=1$ — корень при любом $b$';
      if (blizko(a, 2))
        return 'кандидат отброшен: через $(1;\\,0)$ проходит только прямая при $b=0$';
      return `$x=1$ — корень только при $b=${chisloTex(a - 2)}$, а не при любом $b$`;
    },
  },
  /* Разбор метода 7: график y = sin²x + 2a cos x − a² − 3/4 и проверка в x = 0, π/2, π. */
  'm07-r2': {
    vid: 'grafik',
    bukva: 'a',
    min: -2.5,
    max: 2.5,
    shag: 0.01,
    start: 0,
    osobye: [
      { a: -1.5, tex: '-\\frac32' },
      { a: -0.5, tex: '-\\frac12' },
      { a: 0, tex: '0' },
      { a: 0.5, tex: '\\frac12' },
      { a: 1.5, tex: '\\frac32' },
    ],
    scena: (a) => {
      const okno = { x: [-1, 7] as [number, number], y: [-7, 2] as [number, number] };
      return scena(
        okno,
        {
          curves: [grafik((x) => m07r2G(a, x), 'lineA')],
          points: [0, Math.PI / 2, Math.PI]
            .map((x) => [x, m07r2G(a, x)] as const)
            .filter(([, y]) => y >= okno.y[0] && y <= okno.y[1])
            .map(([x, y]) => proverka(x, y, y < 0)),
        },
        `График y = sin²x + 2a·cos x − a² − 3/4 при a = ${chislo(a)} и его точки при x = 0, π/2, π`,
      );
    },
    itog: (a) => {
      /* Наибольшее значение: 1/4 − d², d — расстояние от a до отрезка [−1; 1] (t = cos x). */
      const d = Math.max(0, Math.abs(a) - 1);
      if (0.25 - d * d < 0) return 'график ниже оси: неравенство верно при всех $x$';
      if (m07r2G(a, Math.PI / 2) >= 0) return 'неравенство нарушено при $x=\\frac\\pi2$';
      if (m07r2G(a, 0) >= 0) return 'неравенство нарушено при $x=0$';
      return 'неравенство нарушено при $x=\\pi$';
    },
  },
  /* Разбор метода 7: график y = x² + 2|x − a| − a² всегда проходит через (a; 0). */
  'm07-r3': {
    vid: 'grafik',
    bukva: 'a',
    min: -2.5,
    max: 2.5,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: -2, tex: '-2' },
      { a: -1, tex: '-1' },
      { a: 1, tex: '1' },
      { a: 2, tex: '2' },
    ],
    scena: (a) =>
      scena(
        { x: [-4, 4], y: [-3, 7] },
        {
          curves: [grafik((x) => m07r3G(a, x), 'lineA')],
          points: [
            proverka(a, 0, Math.abs(a) <= 1 + 1e-9),
            ...(a > 1 + 1e-9 ? [proverka(1, m07r3G(a, 1), false)] : []),
            ...(a < -1 - 1e-9 ? [proverka(-1, m07r3G(a, -1), false)] : []),
          ],
        },
        `График y = x² + 2|x − a| − a² при a = ${chislo(a)}: он проходит через точку (a; 0)`,
      ),
    itog: (a) => {
      if (a > 1 + 1e-9) return 'неравенство нарушено при $x=1$: там значение $-(a-1)^2<0$';
      if (a < -1 - 1e-9) return 'неравенство нарушено при $x=-1$: там значение $-(a+1)^2<0$';
      return 'график не ниже оси и касается её в $x=a$: неравенство верно при всех $x$';
    },
  },

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

  /* Разбор метода 6: ромб |x| + |y| = 2 и окружность с центром (a; a) на прямой y = x. */
  'm06-r1': {
    vid: 'okruzhnost',
    bukva: 'a',
    min: -3,
    max: 3,
    shag: 0.01,
    start: 0.5,
    osobye: [
      { a: -2, tex: '-2' },
      { a: 0, tex: '0' },
      { a: 2, tex: '2' },
    ],
    scena: (a) =>
      scena(
        { x: [-3.5, 4.5], y: [-3.5, 4.5] },
        {
          curves: [
            lomanaya(ROMB_2, 'lineA', true),
            pryamaya(1, 0, 'aux', 'dashed'),
            okruzhnost(a, a, S2, 'lineB'),
          ],
          points: m06r1Tochki(a).map(([x, y]) =>
            tochka(x, y, null, false, Math.abs(x - y) < 1e-9 ? 'accent' : 'cross'),
          ),
        },
        `Ромб |x| + |y| = 2, прямая y = x и окружность с центром (a; a) радиуса √2 при a = ${chislo(a)}`,
      ),
    resheniy: (a) => m06r1Tochki(a).length,
    itog: (a) => {
      if (blizko(a, 2)) return 'найденное значение: решение одно, $(1;\\,1)$ на прямой $y=x$';
      if (blizko(a, -2)) return 'найденное значение: решение одно, $(-1;\\,-1)$ на прямой $y=x$';
      if (blizko(a, 0)) return 'кандидат отброшен: решений четыре, $(\\pm1;\\,\\pm1)$';
      return m06r1Tochki(a).length > 0
        ? 'решения парами, симметричными относительно $y=x$'
        : 'решений нет';
    },
  },
  /* Разбор метода 6: график y = x² − 4x + a(|x − 1| + |x − 3|) − (a² + 3a − 6), симметричный относительно x = 2. */
  'm06-r2': {
    vid: 'grafik',
    bukva: 'a',
    min: -3,
    max: 2,
    shag: 0.01,
    start: 1.5,
    osobye: [
      { a: -2, tex: '-2' },
      { a: 1, tex: '1' },
    ],
    scena: (a) =>
      scena(
        { x: [-1.5, 5.5], y: [-5, 6] },
        {
          curves: [grafik((x) => m06r2F(a, x), 'lineA')],
          shapes: [otrezokNa(2, -5, 2, 6, 'aux', 'dashed', 1.4)],
          points: m06r2Korni(a).map((x) =>
            tochka(x, 0, null, false, Math.abs(x - 2) < 1e-9 ? 'accent' : 'cross'),
          ),
        },
        `График y = x² − 4x + a(|x − 1| + |x − 3|) − (a² + 3a − 6) при a = ${chislo(a)}, ось симметрии x = 2`,
      ),
    resheniy: (a) => m06r2Korni(a).length,
    itog: (a) => {
      if (blizko(a, 1)) return 'найденное значение: корень один, $x=2$';
      if (blizko(a, -2)) return 'кандидат отброшен: кроме $x=2$ ещё $x=0$ и $x=4$';
      return m06r2Korni(a).length > 0
        ? 'корни парами $x_0$ и $4-x_0$, $x=2$ не корень'
        : 'корней нет';
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
