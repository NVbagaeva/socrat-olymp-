/**
 * Живая сцена «Где наибольшее и наименьшее на отрезке» (теория №12,
 * раздел «Наибольшее и наименьшее на отрезке»): отрезок [a; b] скользит
 * по графику y = x³ − 12x, кандидаты — концы и нули производной внутри
 * отрезка, наибольшее и наименьшее перескакивают между ними.
 * Проверка — scripts/check-zhivye.mjs.
 */

export const X_MIN = -4.3;
export const X_MAX = 4.3;
export const Y_LIM = 20;
/** Нули производной y' = 3x² − 12. */
export const KRIT = [-2, 2] as const;

export function f(x: number): number {
  return x * x * x - 12 * x;
}

export interface Kandidat {
  x: number;
  y: number;
  vid: 'konec' | 'krit';
}

/** Кандидаты на отрезке: концы и нули производной строго внутри. */
export function kandidaty(a: number, b: number): Kandidat[] {
  const out: Kandidat[] = [{ x: a, y: f(a), vid: 'konec' }];
  for (const k of KRIT) if (k > a + 1e-9 && k < b - 1e-9) out.push({ x: k, y: f(k), vid: 'krit' });
  out.push({ x: b, y: f(b), vid: 'konec' });
  return out;
}

export function itog(a: number, b: number): { max: Kandidat; min: Kandidat } {
  const k = kandidaty(a, b);
  let max = k[0] as Kandidat;
  let min = k[0] as Kandidat;
  for (const c of k) {
    if (c.y > max.y + 1e-9) max = c;
    if (c.y < min.y - 1e-9) min = c;
  }
  return { max, min };
}
