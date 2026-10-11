/**
 * Чтение рисунка «по структуре»: ответ, который прототип получает из
 * задуманных узлов, а не из выборки. Пересчёт по данным — reshit.ts;
 * расхождение двух путей и есть сигнал об ошибке.
 */

import type { Uzel } from './types';

export type Znak = -1 | 0 | 1;

function sgn(v: number): Znak {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

/** Узел-экстремум: соседние перепады разных знаков. */
export function ekstremumUzla(uzly: readonly Uzel[], i: number): 'max' | 'min' | null {
  const prev = uzly[i - 1];
  const cur = uzly[i];
  const next = uzly[i + 1];
  if (prev === undefined || cur === undefined || next === undefined) {
    return null;
  }
  if (prev.y < cur.y && next.y < cur.y) {
    return 'max';
  }
  if (prev.y > cur.y && next.y > cur.y) {
    return 'min';
  }
  return null;
}

/** Знак производной нарисованной функции в целой точке x (по узлам). */
export function znakProizvodnoy(uzly: readonly Uzel[], x: number): Znak {
  for (let i = 0; i < uzly.length; i += 1) {
    const u = uzly[i] as Uzel;
    if (u.x === x) {
      if (ekstremumUzla(uzly, i) !== null) {
        return 0;
      }
      const a = uzly[i - 1] ?? u;
      const b = uzly[i + 1] ?? u;
      return sgn(b.y - a.y);
    }
    const next = uzly[i + 1];
    if (next !== undefined && u.x < x && x < next.x) {
      return sgn(next.y - u.y);
    }
  }
  return 0;
}

/** Знак самой нарисованной функции (график f′ выше или ниже оси) в точке x. */
export function znakZnacheniya(uzly: readonly Uzel[], x: number): Znak {
  for (let i = 0; i < uzly.length; i += 1) {
    const u = uzly[i] as Uzel;
    if (u.x === x) {
      return sgn(u.y);
    }
    const next = uzly[i + 1];
    if (next !== undefined && u.x < x && x < next.x) {
      return sgn(u.y + next.y);
    }
  }
  return 0;
}

/** Нули графика f′ — узлы на оси, в порядке возрастания. */
export function nuliUzlov(uzly: readonly Uzel[]): { x: number; sleva: 1 | -1 }[] {
  const out: { x: number; sleva: 1 | -1 }[] = [];
  for (let i = 1; i < uzly.length - 1; i += 1) {
    const u = uzly[i] as Uzel;
    if (u.y === 0) {
      const prev = uzly[i - 1] as Uzel;
      out.push({ x: u.x, sleva: prev.y > 0 ? 1 : -1 });
    }
  }
  return out;
}

/** Экстремумы волны f: узлы-максимумы и минимумы. */
export function ekstremumyUzlov(uzly: readonly Uzel[]): { x: number; tip: 'max' | 'min' }[] {
  const out: { x: number; tip: 'max' | 'min' }[] = [];
  for (let i = 1; i < uzly.length - 1; i += 1) {
    const tip = ekstremumUzla(uzly, i);
    if (tip !== null) {
      out.push({ x: (uzly[i] as Uzel).x, tip });
    }
  }
  return out;
}

/** Целые абсциссы внутри интервала, подходящие под условие, — n штук по возрастанию. */
export function vybratMetki(
  r: { int(a: number, b: number): number },
  a: number,
  b: number,
  n: number,
  podhodit: (x: number) => boolean,
): number[] | null {
  const pool: number[] = [];
  for (let x = a + 1; x < b; x += 1) {
    if (podhodit(x)) {
      pool.push(x);
    }
  }
  if (pool.length < n) {
    return null;
  }
  const rest = [...pool];
  const out: number[] = [];
  while (out.length < n) {
    const i = r.int(0, rest.length - 1);
    out.push(rest[i] as number);
    rest.splice(i, 1);
  }
  return out.sort((p, q) => p - q);
}
