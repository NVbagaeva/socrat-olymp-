/**
 * Процедурная геометрия заставки: грани октаэдра (стеклянные пластины
 * с фаской), золотые рёбра, гладкие лепестки, тычинки и нити.
 * Ни одной готовой модели — всё считается здесь.
 *
 * Буферы возвращаются как типизированные массивы; в WebGL их грузит
 * scene.ts. Атрибуты: position (3), normal (3), extra (4) — смысл
 * extra у каждой геометрии свой и описан у функции.
 */

import { add, cross, madd, normalize, scale, sub, type Vec3 } from './math';

export interface Geometry {
  position: Float32Array;
  normal: Float32Array;
  extra: Float32Array;
  index?: Uint16Array | Uint32Array;
  count: number;
}

/* ── Октаэдр ──────────────────────────────────────────────────── */

/** Октаэдр с расстоянием 1 от центра до вершины: ребро √2. */
export const OCTA_EDGE = Math.SQRT2;
/** Высота грани — правильного треугольника с ребром √2. */
export const OCTA_FACE_H = (OCTA_EDGE * Math.sqrt(3)) / 2;
/** Наклон боковой грани к вертикали в собранном октаэдре: atan(1/√2). */
export const OCTA_FACE_TILT = Math.atan(Math.SQRT1_2);

type P2 = [number, number];

/**
 * Пластина-грань: треугольник p0 p1 p2 в плоскости z = 0 толщиной 2·dz
 * с фаской: лицевая и тыльная стороны — треугольник, ужатый на bevel,
 * их соединяют скосы к контуру. Нормали плоские — грани ловят блики,
 * как огранённый кристалл. extra = (x, y локально, сторона, 0).
 */
export function plateGeometry(tri: [P2, P2, P2], dz: number, bevel: number): Geometry {
  const c: P2 = [(tri[0][0] + tri[1][0] + tri[2][0]) / 3, (tri[0][1] + tri[1][1] + tri[2][1]) / 3];
  const inr = OCTA_EDGE / (2 * Math.sqrt(3));
  const k = 1 - bevel / inr;
  const inset = tri.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k] as P2);
  const outer = tri.map((p) => [p[0], p[1], 0] as Vec3);
  const front = inset.map((p) => [p[0], p[1], dz] as Vec3);
  const back = inset.map((p) => [p[0], p[1], -dz] as Vec3);

  const pos: number[] = [];
  const nrm: number[] = [];
  const ext: number[] = [];
  const face = (a: Vec3, b: Vec3, d: Vec3, side: number) => {
    const n = normalize(cross(sub(b, a), sub(d, a)));
    for (const v of [a, b, d]) {
      pos.push(v[0], v[1], v[2]);
      nrm.push(n[0], n[1], n[2]);
      ext.push(v[0], v[1], side, 0);
    }
  };
  /* Треугольник задан против часовой стрелки, если смотреть с +z. */
  face(front[0]!, front[1]!, front[2]!, 1);
  face(back[0]!, back[2]!, back[1]!, -1);
  for (let i = 0; i < 3; i += 1) {
    const j = (i + 1) % 3;
    face(front[i]!, outer[i]!, outer[j]!, 0.5);
    face(front[i]!, outer[j]!, front[j]!, 0.5);
    face(back[i]!, back[j]!, outer[j]!, -0.5);
    face(back[i]!, outer[j]!, outer[i]!, -0.5);
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(nrm),
    extra: new Float32Array(ext),
    count: pos.length / 3,
  };
}

/**
 * Рёбра пластины: тонкие трубки вдоль контура треугольника; skip —
 * рёбра, которые уже рисует соседняя пластина.
 * extra = (доля длины ребра 0…1, номер ребра, 0, 0).
 */
export function edgeGeometry(
  tri: [P2, P2, P2],
  radius: number,
  skip: readonly number[] = [],
  seg = 6,
): Geometry {
  const pos: number[] = [];
  const nrm: number[] = [];
  const ext: number[] = [];
  const idx: number[] = [];
  for (let e = 0; e < 3; e += 1) {
    if (skip.includes(e)) continue;
    const a: Vec3 = [tri[e]![0], tri[e]![1], 0];
    const b: Vec3 = [tri[(e + 1) % 3]![0], tri[(e + 1) % 3]![1], 0];
    const dir = normalize(sub(b, a));
    const u: Vec3 = [0, 0, 1];
    const v = cross(dir, u);
    const base = pos.length / 3;
    /* Чуть продлеваем за вершины — стык рёбер без щели. */
    const a2 = madd(a, dir, -radius);
    const b2 = madd(b, dir, radius);
    for (let end = 0; end < 2; end += 1) {
      const p = end === 0 ? a2 : b2;
      for (let s = 0; s < seg; s += 1) {
        const ang = (s / seg) * Math.PI * 2;
        const n = add(scale(u, Math.cos(ang)), scale(v, Math.sin(ang)));
        const q = madd(p, n, radius);
        pos.push(q[0], q[1], q[2]);
        nrm.push(n[0], n[1], n[2]);
        ext.push(end, e, 0, 0);
      }
    }
    for (let s = 0; s < seg; s += 1) {
      const s2 = (s + 1) % seg;
      idx.push(base + s, base + seg + s2, base + seg + s, base + s, base + s2, base + seg + s2);
    }
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(nrm),
    extra: new Float32Array(ext),
    index: new Uint16Array(idx),
    count: idx.length,
  };
}

/* ── Лепесток ─────────────────────────────────────────────────── */

export interface PetalShape {
  length: number;
  width: number;
  /** Толщина относительно ширины. */
  thickness: number;
  /** На сколько радиан кончик загибается к вертикали. */
  bend: number;
  /** Насколько края приподняты внутрь (чашечка). */
  cup: number;
  /** Острота кончика: больше — острее. */
  tip: number;
}

/**
 * Гладкий выпуклый лепесток — замкнутая «линза»: сечение — эллипс,
 * изогнутый чашечкой, на обоих концах стягивается в точку. Ось
 * лепестка растёт из начала координат вверх (+y), наружу — +z, поперёк
 * — x. Наклон наружу задаёт матрица модели. Нормали усреднены по
 * соседним граням — край сглажен, гранёности нет.
 * extra = (u вдоль 0…1, поперёк −1…1, сторона −1…1, 0).
 */
export function petalGeometry(shape: PetalShape, segU: number, segV: number): Geometry {
  const { length, width, thickness, bend, cup, tip } = shape;
  const a = 0.55;
  const b = tip;
  const peak = (a / (a + b)) ** a * (b / (a + b)) ** b;
  const profile = (u: number) => (u ** a * (1 - u) ** b) / peak;

  /* Хребет: интегрируем направление, которое к кончику встаёт вертикальнее. */
  const spine: Vec3[] = [];
  const along: Vec3[] = [];
  let p: Vec3 = [0, 0, 0];
  for (let i = 0; i <= segU; i += 1) {
    const u = i / segU;
    const ang = -bend * u * u;
    const dir: Vec3 = [0, Math.cos(ang), Math.sin(ang)];
    spine.push(p);
    along.push(dir);
    p = madd(p, dir, length / segU);
  }

  const rows = segU + 1;
  const cols = segV;
  const pos = new Float32Array(rows * cols * 3);
  const ext = new Float32Array(rows * cols * 4);
  for (let i = 0; i < rows; i += 1) {
    const u = i / segU;
    const w = (width / 2) * profile(Math.min(u, 1));
    const th = w * thickness;
    const dir = along[i]!;
    /* Внутренняя нормаль хребта — к оси цветка. */
    const inner: Vec3 = [0, dir[2], -dir[1]];
    const side: Vec3 = [1, 0, 0];
    for (let j = 0; j < cols; j += 1) {
      const beta = (j / cols) * Math.PI * 2;
      const x = Math.cos(beta);
      const y = Math.sin(beta);
      let q = madd(spine[i]!, side, w * x);
      q = madd(q, inner, th * y + cup * w * x * x);
      pos.set(q, (i * cols + j) * 3);
      ext.set([u, x, y, 0], (i * cols + j) * 4);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < segU; i += 1) {
    for (let j = 0; j < cols; j += 1) {
      const j2 = (j + 1) % cols;
      const a0 = i * cols + j;
      const a1 = i * cols + j2;
      const b0 = (i + 1) * cols + j;
      const b1 = (i + 1) * cols + j2;
      idx.push(a0, b1, b0, a0, a1, b1);
    }
  }
  const index = new Uint16Array(idx);
  return {
    position: pos,
    normal: smoothNormals(pos, index),
    extra: ext,
    index,
    count: idx.length,
  };
}

function smoothNormals(pos: Float32Array, index: Uint16Array): Float32Array {
  const acc = new Float64Array(pos.length);
  const v = (i: number): Vec3 => [pos[i * 3]!, pos[i * 3 + 1]!, pos[i * 3 + 2]!];
  for (let f = 0; f < index.length; f += 3) {
    const ia = index[f]!;
    const ib = index[f + 1]!;
    const ic = index[f + 2]!;
    const fn = cross(sub(v(ib), v(ia)), sub(v(ic), v(ia)));
    for (const i of [ia, ib, ic]) {
      acc[i * 3] = acc[i * 3]! + fn[0];
      acc[i * 3 + 1] = acc[i * 3 + 1]! + fn[1];
      acc[i * 3 + 2] = acc[i * 3 + 2]! + fn[2];
    }
  }
  const n = new Float32Array(pos.length);
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(acc[i]!, acc[i + 1]!, acc[i + 2]!) || 1;
    n[i] = acc[i]! / l;
    n[i + 1] = acc[i + 1]! / l;
    n[i + 2] = acc[i + 2]! / l;
  }
  return n;
}

/* ── Тычинки ──────────────────────────────────────────────────── */

/** Случайные числа с семенем: один и тот же цветок при каждом показе. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Пучок тычинок: тонкие нити с шариками на концах, одним буфером.
 * Растут из корня: extra = (корень x, y, z, задержка роста).
 * Нормаль шарика — обычная; у нити — от её оси.
 */
export function stamenGeometry(
  root: Vec3,
  count: number,
  seed: number,
  detail: { seg: number; ball: number },
): Geometry {
  const rand = rng(seed);
  const pos: number[] = [];
  const nrm: number[] = [];
  const ext: number[] = [];
  const idx: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let k = 0; k < count; k += 1) {
    /* Направления — по спирали Ферма внутри широкого конуса: пучок
       веером, в середине выше, по краям почти лёжа (слой 5). */
    const f = (k + 0.5) / count;
    const tilt = Math.sqrt(f) * 1.38;
    const az = k * golden;
    const len = 0.5 + 0.32 * (1 - f) + rand() * 0.12;
    const dir: Vec3 = [
      Math.sin(tilt) * Math.sin(az),
      Math.cos(tilt),
      Math.sin(tilt) * Math.cos(az),
    ];
    const start = madd(root, dir, 0.05);
    const end = madd(root, dir, len);
    const delay = f * 0.35 + rand() * 0.1;
    const r = 0.012;
    /* Нить. */
    const u = normalize(cross(dir, Math.abs(dir[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]));
    const v = cross(dir, u);
    const base = pos.length / 3;
    for (const p of [start, end]) {
      for (let s = 0; s < detail.seg; s += 1) {
        const ang = (s / detail.seg) * Math.PI * 2;
        const n = add(scale(u, Math.cos(ang)), scale(v, Math.sin(ang)));
        const q = madd(p, n, r);
        pos.push(...q);
        nrm.push(...n);
        ext.push(root[0], root[1], root[2], delay);
      }
    }
    for (let s = 0; s < detail.seg; s += 1) {
      const s2 = (s + 1) % detail.seg;
      idx.push(
        base + s,
        base + detail.seg + s,
        base + detail.seg + s2,
        base + s,
        base + detail.seg + s2,
        base + s2,
      );
    }
    /* Шарик. */
    const br = 0.045 + rand() * 0.018;
    const ballBase = pos.length / 3;
    const lat = detail.ball;
    const lon = detail.ball * 2;
    for (let i = 0; i <= lat; i += 1) {
      const th = (i / lat) * Math.PI;
      for (let j = 0; j < lon; j += 1) {
        const ph = (j / lon) * Math.PI * 2;
        const n: Vec3 = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
        const q = madd(end, n, br);
        pos.push(...q);
        nrm.push(...n);
        ext.push(root[0], root[1], root[2], delay);
      }
    }
    for (let i = 0; i < lat; i += 1) {
      for (let j = 0; j < lon; j += 1) {
        const j2 = (j + 1) % lon;
        const a0 = ballBase + i * lon + j;
        const a1 = ballBase + i * lon + j2;
        const b0 = ballBase + (i + 1) * lon + j;
        const b1 = ballBase + (i + 1) * lon + j2;
        idx.push(a0, b0, b1, a0, b1, a1);
      }
    }
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(nrm),
    extra: new Float32Array(ext),
    index: new Uint16Array(idx),
    count: idx.length,
  };
}

/**
 * Светящиеся нити вокруг ядра: замкнутые петли, отрезками (gl.LINES).
 * extra = (доля петли 0…1, номер петли, 0, 0); нормаль не нужна.
 */
export function filamentGeometry(count: number, seed: number, points = 72): Geometry {
  const rand = rng(seed);
  const pos: number[] = [];
  const ext: number[] = [];
  for (let k = 0; k < count; k += 1) {
    /* Почти большие круги со слабой волной: вместе — сеточка-шар вокруг
       ядра (слой 5). */
    const r = 0.2 + rand() * 0.1;
    const tiltA = Math.acos(1 - 2 * rand());
    const tiltB = rand() * Math.PI * 2;
    const wob = 2 + Math.floor(rand() * 3);
    const wobA = 0.06 + rand() * 0.08;
    const n: Vec3 = normalize([
      Math.sin(tiltA) * Math.cos(tiltB),
      Math.cos(tiltA),
      Math.sin(tiltA) * Math.sin(tiltB),
    ]);
    const e1 = normalize(cross(n, [0.3, 1, 0.2]));
    const e2 = cross(n, e1);
    const at = (i: number): Vec3 => {
      const a = (i / points) * Math.PI * 2;
      const rr = r * (1 + wobA * Math.sin(a * wob + k));
      return madd(
        madd(scale(n, wobA * r * Math.cos(a * (wob + 1))), e1, rr * Math.cos(a)),
        e2,
        rr * Math.sin(a),
      );
    };
    for (let i = 0; i < points; i += 1) {
      const a = at(i);
      const b = at(i + 1);
      pos.push(...a, ...b);
      ext.push(i / points, k, 0, 0, (i + 1) / points, k, 0, 0);
    }
  }
  return {
    position: new Float32Array(pos),
    normal: new Float32Array(pos.length),
    extra: new Float32Array(ext),
    count: pos.length / 3,
  };
}

/** Частицы: только семена, движение считает шейдер. extra = 4 случайных числа. */
export function particleGeometry(count: number, seed: number): Geometry {
  const rand = rng(seed);
  const ext = new Float32Array(count * 4);
  for (let i = 0; i < ext.length; i += 1) ext[i] = rand();
  return {
    position: new Float32Array(count * 3),
    normal: new Float32Array(count * 3),
    extra: ext,
    count,
  };
}

/** Квадрат −1…1 для спрайтов и полноэкранных проходов (два треугольника). */
export function quadGeometry(): Geometry {
  const p = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0];
  return {
    position: new Float32Array(p),
    normal: new Float32Array(p.length),
    extra: new Float32Array((p.length / 3) * 4),
    count: 6,
  };
}
