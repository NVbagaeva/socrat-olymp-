/**
 * Параллельная проекция, ракурс и вращение — общее ядро чертежей.
 *
 * Ракурс школьного чертежа задаётся двумя углами: азимут (поворот
 * вокруг вертикали) и высота (насколько зритель над горизонтом).
 * Направление взгляда k — единичный вектор от сцены к зрителю.
 * Вращение мышью или пальцем меняет эти два угла; высота
 * ограничена, чтобы вертикаль не переворачивалась.
 */

import { type P2, type V, cross, dot, norm } from './vec';

/** Базис экрана для параллельной проекции: вправо, вверх, к зрителю. */
export interface Bazis {
  r: V;
  u: V;
  k: V;
}

export function bazis(k: V, up: V = [0, 0, 1]): Bazis {
  const kk = norm(k);
  let r = cross(up, kk);
  if (Math.hypot(r[0], r[1], r[2]) < 1e-9) {
    r = cross([0, 1, 0], kk);
  }
  r = norm(r);
  return { r, u: cross(kk, r), k: kk };
}

/** Точка на экране: x вправо, y вниз (как в SVG). */
export const proj = (b: Bazis, p: V): P2 => [dot(p, b.r), -dot(p, b.u)];

/** Ракурс: углы в градусах. */
export interface Rakurs {
  /** Азимут: 0 — смотрим строго спереди (с −y), плюс — заходим справа. */
  azimut: number;
  /** Высота над горизонтом: 0 — сбоку, 90 — сверху. */
  vysota: number;
}

/** Школьный ракурс: спереди, чуть справа и сверху. */
export const SHKOLNYY: Rakurs = { azimut: 24, vysota: 24 };

export const VYSOTA_MIN = -80;
export const VYSOTA_MAX = 85;

const RAD = Math.PI / 180;

/** Направление к зрителю по ракурсу. */
export function napravlenie(r: Rakurs): V {
  const a = r.azimut * RAD;
  const h = r.vysota * RAD;
  return [Math.sin(a) * Math.cos(h), -Math.cos(a) * Math.cos(h), Math.sin(h)];
}

/** Ракурс по направлению к зрителю (обратно к napravlenie). */
export function rakursIz(k: V): Rakurs {
  const n = norm(k);
  return {
    azimut: Math.atan2(n[0], -n[1]) / RAD,
    vysota: Math.asin(Math.max(-1, Math.min(1, n[2]))) / RAD,
  };
}

/**
 * Поворот перетаскиванием: dx, dy — сдвиг указателя в пикселях,
 * chuvstv — градусов на пиксель. Вправо — фигура поворачивается
 * вправо (азимут растёт навстречу), вниз — смотрим сверху.
 */
export function povernut(r: Rakurs, dx: number, dy: number, chuvstv = 0.5): Rakurs {
  let azimut = r.azimut - dx * chuvstv;
  azimut = ((((azimut + 180) % 360) + 360) % 360) - 180;
  const vysota = Math.max(VYSOTA_MIN, Math.min(VYSOTA_MAX, r.vysota + dy * chuvstv));
  return { azimut, vysota };
}

/* ── Подписи текстом SVG (печать, экспорт, первый кадр) ───────── */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export { esc as escSvg };

/** Имя «A_1», «K'» → разметка SVG: курсив, индекс нижний, штрихи ′. */
export function imyaSvg(name: string): string {
  const m = /^([A-ZА-Я])(?:_\{?(\d+)\}?)?('*)$/.exec(name);
  if (m === null) {
    return esc(name);
  }
  const [, base, idx, primes] = m;
  return (
    `<tspan font-style="italic">${base}</tspan>` +
    (primes ? `<tspan>${'′'.repeat(primes.length)}</tspan>` : '') +
    (idx ? `<tspan baseline-shift="sub" font-size="70%">${idx}</tspan>` : '')
  );
}

/** Ширина подписи на глаз: буква ≈ 0,62 кегля, индекс ≈ 0,45. */
export function shirinaImeni(name: string, size: number): number {
  const m = /^(.)(?:_\{?(\d+)\}?)?('*)$/.exec(name);
  const idx = m?.[2]?.length ?? 0;
  const primes = m?.[3]?.length ?? 0;
  return size * (0.62 + 0.45 * idx + 0.25 * primes);
}
