/**
 * Живая сцена «Тригонометрический круг» (теория №6, уравнения,
 * раздел 8): точка обегает единичную окружность, рядом рисуется график
 * функции на [−2π; 2π], корни уравнения f(x) = a «падают» на ось x в
 * момент, когда точка их проходит. Серии и значения — lib/zadanie7/trig.ts
 * (не тронут). Проверка — scripts/check-zhivye.mjs.
 *
 * Модельное время t — угол в долях π, сдвинутый на 2: t = 0 — x = −2π,
 * t = 4 — x = 2π. Снимки — на каждом корне.
 */

import { add, mul, q, val, type Q } from '@/lib/zadanie11/num';
import { serii, znachenie, type Funkciya } from '@/lib/zadanie7/trig';
import type { HodOpcii } from './hod';

export const X_MIN = -2;
export const X_MAX = 2;

export interface Koren {
  /** Корень в долях π. */
  t: Q;
  /** Нужный по вопросу (наименьший положительный или наибольший отрицательный). */
  nuzhnyy: boolean;
}

export type Vopros = 'minPol' | 'maxOtr';

/** Корни на [−2π; 2π] по возрастанию и нужный по вопросу. */
export function korni(f: Funkciya, kod: string, v: Vopros): Koren[] {
  const vse: Q[] = [];
  for (const s of serii(f, kod)) {
    for (let n = -4; n <= 4; n += 1) {
      const t = add(s.t0, mul(q(s.per), q(n)));
      if (val(t) >= X_MIN - 1e-9 && val(t) <= X_MAX + 1e-9 && !vse.some((x) => val(x) === val(t))) {
        vse.push(t);
      }
    }
  }
  vse.sort((a, b) => val(a) - val(b));
  const kand = vse.filter((t) => (v === 'minPol' ? val(t) > 0 : val(t) < 0));
  const nuzhnyy = v === 'minPol' ? kand[0] : kand.at(-1);
  return vse.map((t) => ({ t, nuzhnyy: nuzhnyy !== undefined && val(t) === val(nuzhnyy) }));
}

/** Опции хода: точка обегает круг дважды; снимок на каждом корне внутри шкалы. */
export function hodKruga(k: readonly Koren[]): HodOpcii {
  const tMax = X_MAX - X_MIN;
  return {
    tMax,
    ostanovki: k.map((r) => val(r.t) - X_MIN).filter((s) => s > 1e-9 && s < tMax - 1e-9),
    sekNaEd: 2.4,
    sekSnimok: 1.1,
    razgon: 0.12,
  };
}

/** Значение функции в точке x (в долях π); у тангенса у полюса — ±∞. */
export function f(fn: Funkciya, xPi: number): number {
  const x = xPi * Math.PI;
  if (fn === 'sin') return Math.sin(x);
  if (fn === 'cos') return Math.cos(x);
  return Math.tan(x);
}

export { znachenie };

/** Угол для подписи в SVG: «π/6», «−5π/6», «2π», «0». */
export function ugolText(t: Q): string {
  if (t.n === 0) return '0';
  const s = t.n < 0 ? '−' : '';
  const n = Math.abs(t.n);
  const ch = n === 1 ? 'π' : `${n}π`;
  return t.m === 1 ? `${s}${ch}` : `${s}${ch}/${t.m}`;
}

/** Угол в (−π; π]: та же точка круга. */
export function vKruge(t: Q): Q {
  let r = t;
  while (val(r) > 1) r = add(r, q(-2));
  while (val(r) <= -1) r = add(r, q(2));
  return r;
}
