/**
 * Подписи точек живой схемы: буква ставится туда, где она не касается
 * ни линий, ни окружностей, ни дуг углов, ни чужих точек и подписей.
 *
 * Работает в пикселях экрана, поэтому при повороте чертежа буквы
 * остаются прямыми и заново находят себе место. Правило то же, что в
 * движке №1 (lib/planimetriya/kollizii.ts), но облегчённое: кадр
 * пересчитывается при каждом движении пальца, перебор должен
 * укладываться в доли миллисекунды.
 *
 * Желаемое направление — середина самого широкого «просвета» между
 * линиями, выходящими из точки: буква встаёт снаружи угла, а не
 * внутрь него. Кандидаты — 24 направления и пять отступов; штраф за
 * касание огромный, за удаление от точки и от желаемого направления —
 * небольшой.
 */

import type { T2 } from './tipy';

export interface Prepyatstviya {
  otrezki: [T2, T2][];
  /** Центр и радиус. */
  okruzhnosti: [T2, number][];
  tochki: T2[];
}

/** Зазор подписи до препятствий, px. */
export const ZAZOR = 2;
const OTSTUPY = [3, 6, 10, 15, 21] as const;
const NAPRAVLENIY = 24;

export interface Gabarit {
  /** Полуширина и полувысота прямоугольника буквы. */
  hw: number;
  hh: number;
}

export function gabaritBukvy(imya: string, kegl: number): Gabarit {
  const [, indeks] = imya.split('_');
  const shirina = kegl * 0.72 + (indeks === undefined ? 0 : indeks.length * kegl * 0.42);
  return { hw: shirina / 2, hh: kegl * 0.42 };
}

type Pryamougolnik = readonly [number, number, number, number];

function otrezokVPryamougolnike(a: T2, b: T2, r: Pryamougolnik): boolean {
  /* Лян — Барски: отсечение отрезка прямоугольником. */
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - r[0], r[2] - a[0], a[1] - r[1], r[3] - a[1]];
  for (let i = 0; i < 4; i += 1) {
    const pi = p[i]!;
    const qi = q[i]!;
    if (Math.abs(pi) < 1e-12) {
      if (qi < 0) return false;
    } else {
      const t = qi / pi;
      if (pi < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

function okruzhnostVPryamougolnike(c: T2, rad: number, r: Pryamougolnik): boolean {
  const nx = Math.max(r[0], Math.min(c[0], r[2]));
  const ny = Math.max(r[1], Math.min(c[1], r[3]));
  const blizh = Math.hypot(c[0] - nx, c[1] - ny);
  const dal = Math.max(
    Math.hypot(c[0] - r[0], c[1] - r[1]),
    Math.hypot(c[0] - r[2], c[1] - r[1]),
    Math.hypot(c[0] - r[0], c[1] - r[3]),
    Math.hypot(c[0] - r[2], c[1] - r[3]),
  );
  return blizh <= rad && rad <= dal;
}

function peresekayutsya(a: Pryamougolnik, b: Pryamougolnik): boolean {
  return a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
}

/** Сколько препятствий задевает прямоугольник (с зазором). */
export function kasaniya(
  r: Pryamougolnik,
  prep: Prepyatstviya,
  zanyato: readonly Pryamougolnik[],
  svoya: T2 | null,
): number {
  const z: Pryamougolnik = [r[0] - ZAZOR, r[1] - ZAZOR, r[2] + ZAZOR, r[3] + ZAZOR];
  let n = 0;
  for (const [a, b] of prep.otrezki) if (otrezokVPryamougolnike(a, b, z)) n += 1;
  for (const [c, rad] of prep.okruzhnosti) if (okruzhnostVPryamougolnike(c, rad, z)) n += 1;
  for (const p of prep.tochki) {
    if (svoya !== null && p[0] === svoya[0] && p[1] === svoya[1]) continue;
    if (p[0] > z[0] - 3 && p[0] < z[2] + 3 && p[1] > z[1] - 3 && p[1] < z[3] + 3) n += 1;
  }
  for (const q of zanyato) if (peresekayutsya(z, q)) n += 1;
  return n;
}

/** Направления линий, выходящих из точки p (радианы, экран). */
function luchi(p: T2, prep: Prepyatstviya): number[] {
  const out: number[] = [];
  const blizko = 1.5;
  for (const [a, b] of prep.otrezki) {
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const lab = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (lab < 3) continue;
    if (la < blizko) out.push(Math.atan2(b[1] - p[1], b[0] - p[0]));
    else if (lb < blizko) out.push(Math.atan2(a[1] - p[1], a[0] - p[0]));
    else if (Math.abs(la + lb - lab) < 0.05) {
      /* Точка внутри отрезка: линия уходит в обе стороны. */
      out.push(Math.atan2(a[1] - p[1], a[0] - p[0]), Math.atan2(b[1] - p[1], b[0] - p[0]));
    }
  }
  for (const [c, rad] of prep.okruzhnosti) {
    const d = Math.hypot(p[0] - c[0], p[1] - c[1]);
    if (Math.abs(d - rad) < blizko) {
      const k = Math.atan2(p[1] - c[1], p[0] - c[0]);
      out.push(k + Math.PI / 2, k - Math.PI / 2);
    }
  }
  return out;
}

function zhelaemoe(p: T2, prep: Prepyatstviya, centr: T2): number {
  const l = luchi(p, prep)
    .map((x) => (x + 2 * Math.PI) % (2 * Math.PI))
    .sort((a, b) => a - b);
  if (l.length === 0) return Math.atan2(p[1] - centr[1], p[0] - centr[0]);
  let luchshiy = 0;
  let shirina = -1;
  for (let i = 0; i < l.length; i += 1) {
    const a = l[i]!;
    const b = i + 1 < l.length ? l[i + 1]! : l[0]! + 2 * Math.PI;
    if (b - a > shirina) {
      shirina = b - a;
      luchshiy = (a + b) / 2;
    }
  }
  return luchshiy;
}

function raznostUglov(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/**
 * Места подписей: центр каждой буквы в пикселях экрана. Точки, у
 * которых сходится больше линий, расставляются первыми — им теснее.
 */
export function razmestitPodpisi(
  tochki: readonly { p: T2; imya: string }[],
  prep: Prepyatstviya,
  W: number,
  H: number,
  kegl: number,
): T2[] {
  const centr: T2 = [W / 2, H / 2];
  const poryadok = tochki
    .map((t, i) => ({ i, n: luchi(t.p, prep).length }))
    .sort((a, b) => b.n - a.n)
    .map((x) => x.i);
  const mesta: T2[] = tochki.map((t) => t.p);
  const zanyato: Pryamougolnik[] = [];
  for (const i of poryadok) {
    const { p, imya } = tochki[i]!;
    const g = gabaritBukvy(imya, kegl);
    const zhel = zhelaemoe(p, prep, centr);
    let luchshee: T2 = [p[0] + g.hw + 4, p[1] - g.hh - 4];
    let luchshiyShtraf = Infinity;
    let luchshiyPr: Pryamougolnik | null = null;
    for (const ots of OTSTUPY) {
      for (let k = 0; k < NAPRAVLENIY; k += 1) {
        const ug = zhel + (k * 2 * Math.PI) / NAPRAVLENIY;
        const dx = Math.cos(ug);
        const dy = Math.sin(ug);
        const vynos = ots + Math.abs(dx) * g.hw + Math.abs(dy) * g.hh;
        const c: T2 = [p[0] + dx * vynos, p[1] + dy * vynos];
        const pr: Pryamougolnik = [c[0] - g.hw, c[1] - g.hh, c[0] + g.hw, c[1] + g.hh];
        const vne = pr[0] < 1 || pr[1] < 1 || pr[2] > W - 1 || pr[3] > H - 1 ? 1 : 0;
        const shtraf =
          1e4 * kasaniya(pr, prep, zanyato, p) + 3e3 * vne + ots * 1.6 + raznostUglov(ug, zhel) * 9;
        if (shtraf < luchshiyShtraf) {
          luchshiyShtraf = shtraf;
          luchshee = c;
          luchshiyPr = pr;
        }
      }
      /* Нашлось чистое место на этом отступе — дальше не уходим. */
      if (luchshiyShtraf < 1e3) break;
    }
    mesta[i] = luchshee;
    if (luchshiyPr !== null) zanyato.push(luchshiyPr);
  }
  return mesta;
}
