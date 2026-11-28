/**
 * Сечение многогранника плоскостью через три точки — для построения
 * сечений на живом чертеже №3.
 *
 * Точки, которые можно отметить: вершины многогранника и середины его
 * рёбер. Плоскость через три отмеченные точки пересекается с каждым
 * ребром; точки пересечения, упорядоченные по обходу в плоскости, —
 * вершины сечения. Всё в координатах модели, без экрана.
 */
import type { Model, Polyhedron } from './model';
import { type Vec3, add, cross, dot, length, mid, normalize, scale, sub } from './vec';

export interface TochkaVybora {
  /** id цели касания: «v3» — вершина, «m1-5» — середина ребра. */
  id: string;
  p: Vec3;
  /** Имя для текста: «A», «B1», «середина AB». */
  imya: string;
  /** Вершина многогранника (иначе середина ребра). */
  vershina: boolean;
}

export interface Sechenie {
  /** Вершины сечения по обходу. */
  points: Vec3[];
  /** Имена вершин сечения: имя вершины тела или null — точка на ребре. */
  imena: (string | null)[];
}

const EPS = 1e-7;

/** Первое непрозрачное тело-многогранник модели: в нём и строится сечение. */
export function telo(model: Model): Polyhedron | null {
  const p = model.bodies.find((b): b is Polyhedron => b.kind === 'polyhedron' && b.glass !== true);
  return p ?? null;
}

const ABC = 'ABCDEFGHKLMN';

/**
 * Имена вершин для построения сечения у тела без подписей (чертёж
 * тренажёра без букв): призма — A, B, C… и A1, B1, C1…, если верхнее
 * основание — сдвиг нижнего; пирамида — основание и S; иначе по
 * алфавиту. Тело с именами возвращается как есть.
 */
export function sImenami(poly: Polyhedron): Polyhedron {
  if ((poly.names ?? []).some((n) => n !== null && n !== '')) return poly;
  const v = poly.vertices;
  const k = v.length;
  let names: string[];
  const n = k / 2;
  const sdvig = Number.isInteger(n) && n >= 3 ? sub(v[n] as Vec3, v[0] as Vec3) : null;
  const prizma =
    sdvig !== null &&
    v.slice(0, n).every((p, i) => length(sub(sub(v[i + n] as Vec3, p), sdvig)) < 1e-6);
  if (prizma && n <= ABC.length) {
    names = [...ABC.slice(0, n)].concat([...ABC.slice(0, n)].map((c) => `${c}1`));
  } else if (k - 1 <= ABC.length && k >= 4) {
    /* Вершина пирамиды — точка вне плоскости остальных. */
    const [a, b, c] = v as Vec3[];
    const nor = cross(sub(b!, a!), sub(c!, a!));
    const vne = v.map((p) => Math.abs(dot(nor, sub(p, a!))) > 1e-6);
    const odna = vne.filter(Boolean).length === 1;
    let i = 0;
    names = v.map((_, j) => (odna && vne[j] ? 'S' : (ABC[i++] ?? `P${j}`)));
  } else {
    names = v.map((_, j) => ABC[j] ?? `P${j + 1}`);
  }
  return { ...poly, names };
}

/** Рёбра многогранника: пары индексов без повторов. */
export function ryobra(poly: Polyhedron): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const f of poly.faces) {
    for (let i = 0; i < f.length; i += 1) {
      const a = f[i] as number;
      const b = f[(i + 1) % f.length] as number;
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(a < b ? [a, b] : [b, a]);
    }
  }
  return out;
}

function imyaVershiny(poly: Polyhedron, i: number): string {
  return poly.names?.[i] ?? `V${i + 1}`;
}

/** Вершины и середины рёбер — точки, которые ученик может отметить. */
export function tochkiVybora(poly: Polyhedron): TochkaVybora[] {
  const v = poly.vertices.map((p, i) => ({
    id: `v${i}`,
    p,
    imya: imyaVershiny(poly, i),
    vershina: true,
  }));
  const m = ryobra(poly).map(([a, b]) => ({
    id: `m${a}-${b}`,
    p: mid(poly.vertices[a] as Vec3, poly.vertices[b] as Vec3),
    imya: `середина ${imyaVershiny(poly, a)}${imyaVershiny(poly, b)}`,
    vershina: false,
  }));
  return [...v, ...m];
}

/**
 * Сечение плоскостью через три точки. null — точки на одной прямой
 * (плоскость не задана) или плоскость лишь касается тела.
 */
export function postroitSechenie(poly: Polyhedron, a: Vec3, b: Vec3, c: Vec3): Sechenie | null {
  const n0 = cross(sub(b, a), sub(c, a));
  const razmer = Math.max(...poly.vertices.map((v) => length(sub(v, a))), 1);
  if (length(n0) < EPS * razmer * razmer) return null;
  const n = normalize(n0);
  const d = (p: Vec3) => dot(n, sub(p, a));
  const tol = EPS * razmer;

  const tochki: { p: Vec3; imya: string | null }[] = [];
  const dobavit = (p: Vec3, imya: string | null) => {
    const est = tochki.find((t) => length(sub(t.p, p)) < tol * 10);
    if (est !== undefined) {
      if (est.imya === null && imya !== null) est.imya = imya;
      return;
    }
    tochki.push({ p, imya });
  };
  poly.vertices.forEach((v, i) => {
    if (Math.abs(d(v)) < tol) dobavit(v, imyaVershiny(poly, i));
  });
  for (const [i, j] of ryobra(poly)) {
    const p = poly.vertices[i] as Vec3;
    const q = poly.vertices[j] as Vec3;
    const dp = d(p);
    const dq = d(q);
    if ((dp > tol && dq < -tol) || (dp < -tol && dq > tol)) {
      dobavit(add(p, scale(sub(q, p), dp / (dp - dq))), null);
    }
  }
  if (tochki.length < 3) return null;

  /* Обход по углу вокруг центра в плоскости сечения. */
  const centr = scale(
    tochki.reduce<Vec3>((s, t) => add(s, t.p), [0, 0, 0]),
    1 / tochki.length,
  );
  const u = normalize(sub(tochki[0]!.p, centr));
  const w = cross(n, u);
  const ugol = (p: Vec3) => {
    const r = sub(p, centr);
    return Math.atan2(dot(r, w), dot(r, u));
  };
  tochki.sort((x, y) => ugol(x.p) - ugol(y.p));
  /* Вырожденное сечение (все точки на одной прямой — ребро тела). */
  const pl = tochki.reduce(
    (s, t, i) => {
      const t2 = tochki[(i + 1) % tochki.length]!;
      return add(s, cross(sub(t.p, centr), sub(t2.p, centr)));
    },
    [0, 0, 0] as Vec3,
  );
  if (length(pl) < tol * razmer) return null;
  /* Название — с первой отмеченной точки и в сторону второй, если она
     соседняя: «ABC₁D₁», а не «D₁ABC₁». */
  const blizhe = (p: Vec3) =>
    tochki.reduce((bi, t, i) => (length(sub(t.p, p)) < length(sub(tochki[bi]!.p, p)) ? i : bi), 0);
  const ia = blizhe(a);
  const ib = blizhe(b);
  const k = tochki.length;
  if (length(sub(tochki[ia]!.p, a)) < tol * 10) {
    const vpered = tochki.slice(ia).concat(tochki.slice(0, ia));
    const nazad = [vpered[0]!, ...vpered.slice(1).reverse()];
    const obratno = (ib - ia + k) % k === k - 1 && length(sub(tochki[ib]!.p, b)) < tol * 10;
    tochki.splice(0, k, ...(obratno ? nazad : vpered));
  }
  return { points: tochki.map((t) => t.p), imena: tochki.map((t) => t.imya) };
}

const NAZVANIYA: Record<number, string> = {
  3: 'треугольник',
  4: 'четырёхугольник',
  5: 'пятиугольник',
  6: 'шестиугольник',
};

/** «треугольник», «четырёхугольник», … по числу вершин. */
export function vidSecheniya(n: number): string {
  return NAZVANIYA[n] ?? `${n}-угольник`;
}
