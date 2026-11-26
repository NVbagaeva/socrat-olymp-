/**
 * Живая сцена «Как меняется знак» (теория №15, неравенства, глава
 * «Метод интервалов»): пробная точка x идёт по прямой слева направо,
 * у каждого множителя на своей полосе рисуется его знак, внизу — знак
 * произведения. На каждом нуле — пауза: нечётная кратность меняет знак,
 * чётная — нет. В конце — штриховка ответа.
 *
 * Модельное время t: x = xMin + t. Проверка — scripts/check-zhivye.mjs.
 */

import type { HodOpcii } from './hod';

export interface Mnozhitel {
  /** Нуль множителя (x − a)^k. */
  a: number;
  k: number;
}

export type Znak = '>' | '<' | '>=' | '<=';

export interface Primer15 {
  id: string;
  mnozhiteli: readonly Mnozhitel[];
  znak: Znak;
}

/** Промежуток ответа: границы (±Infinity — бесконечность) и входят ли они. */
export interface Kusok {
  ot: number;
  do: number;
  otVkl: boolean;
  doVkl: boolean;
}

export function znakMnozhitelya(m: Mnozhitel, x: number): -1 | 0 | 1 {
  const d = x - m.a;
  if (Math.abs(d) < 1e-9) return 0;
  if (m.k % 2 === 0) return 1;
  return d > 0 ? 1 : -1;
}

export function znakProizvedeniya(p: Primer15, x: number): -1 | 0 | 1 {
  let s = 1;
  for (const m of p.mnozhiteli) {
    const z = znakMnozhitelya(m, x);
    if (z === 0) return 0;
    s *= z;
  }
  return s as -1 | 1;
}

/** Значение многочлена (для проверки и формы кривой). */
export function znachenie(p: Primer15, x: number): number {
  return p.mnozhiteli.reduce((s, m) => s * (x - m.a) ** m.k, 1);
}

/** Нули по возрастанию с суммарной кратностью. */
export function nuli(p: Primer15): Mnozhitel[] {
  const by = new Map<number, number>();
  for (const m of p.mnozhiteli) by.set(m.a, (by.get(m.a) ?? 0) + m.k);
  return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([a, k]) => ({ a, k }));
}

export function granicy(p: Primer15): { xMin: number; xMax: number } {
  const n = nuli(p);
  return { xMin: (n[0]?.a ?? 0) - 1.5, xMax: (n.at(-1)?.a ?? 0) + 1.5 };
}

export function hodZnakov(p: Primer15): HodOpcii {
  const { xMin, xMax } = granicy(p);
  return {
    tMax: xMax - xMin,
    ostanovki: nuli(p).map((z) => z.a - xMin),
    sekNaEd: 0.85,
    sekSnimok: 2.2,
    razgon: 0.2,
  };
}

/** Знак на каждом из промежутков между нулями (их на один больше, чем нулей). */
export function znakiPromezhutkov(p: Primer15): (-1 | 1)[] {
  const n = nuli(p);
  const tochki = [-Infinity, ...n.map((z) => z.a), Infinity];
  const out: (-1 | 1)[] = [];
  for (let i = 0; i + 1 < tochki.length; i += 1) {
    const l = tochki[i] as number;
    const r = tochki[i + 1] as number;
    const x = !Number.isFinite(l) ? r - 1 : !Number.isFinite(r) ? l + 1 : (l + r) / 2;
    out.push(znakProizvedeniya(p, x) as -1 | 1);
  }
  return out;
}

/** Ответ неравенства — промежутки и отдельные точки (точка: ot = do). */
export function otvet(p: Primer15): Kusok[] {
  const n = nuli(p);
  const z = znakiPromezhutkov(p);
  const nuzhen = p.znak === '>' || p.znak === '>=' ? 1 : -1;
  const nestrogo = p.znak === '>=' || p.znak === '<=';
  const tochki = [-Infinity, ...n.map((x) => x.a), Infinity];
  const out: Kusok[] = [];
  for (let i = 0; i < z.length; i += 1) {
    const ot = tochki[i] as number;
    const doX = tochki[i + 1] as number;
    if (z[i] === nuzhen) {
      const posl = out.at(-1);
      if (posl !== undefined && posl.do === ot && nestrogo) {
        posl.do = doX;
        posl.doVkl = nestrogo && Number.isFinite(doX);
      } else {
        out.push({
          ot,
          do: doX,
          otVkl: nestrogo && Number.isFinite(ot),
          doVkl: nestrogo && Number.isFinite(doX),
        });
      }
    } else if (nestrogo && i > 0) {
      /* Нуль, к которому не примыкает выбранный промежуток, — отдельная точка. */
      const posl = out.at(-1);
      if (posl === undefined || posl.do !== ot) out.push({ ot, do: ot, otVkl: true, doVkl: true });
    }
  }
  return out;
}

/** Число для TeX: «-2», «4». */
function ch(x: number): string {
  return Number.isInteger(x) ? String(x) : String(x).replace('.', '{,}');
}

export function otvetTex(k: readonly Kusok[]): string {
  if (k.length === 0) return '\\varnothing';
  return k
    .map((u) => {
      if (u.ot === u.do) return `\\{${ch(u.ot)}\\}`;
      const l = Number.isFinite(u.ot) ? ch(u.ot) : '-\\infty';
      const r = Number.isFinite(u.do) ? ch(u.do) : '+\\infty';
      return `${u.otVkl ? '[' : '('}${l};\\,${r}${u.doVkl ? ']' : ')'}`;
    })
    .join('\\cup');
}

/** Множитель в TeX: «(x+2)», «(x-3)^2». */
export function mnozhitelTex(m: Mnozhitel): string {
  const s = m.a === 0 ? 'x' : `(x${m.a > 0 ? '-' : '+'}${ch(Math.abs(m.a))})`;
  return m.k === 1 ? s : `${s}^{${m.k}}`;
}

/** Множитель обычным текстом для SVG: «(x + 2)», «(x − 3)²». */
export function mnozhitelText(m: Mnozhitel): string {
  const s = m.a === 0 ? 'x' : `(x ${m.a > 0 ? '−' : '+'} ${Math.abs(m.a)})`;
  const st = ['', '', '²', '³', '⁴'][m.k] ?? `^${m.k}`;
  return s + st;
}

const ZNAK_TEX: Record<Znak, string> = { '>': '>', '<': '<', '>=': '\\ge', '<=': '\\le' };

export function neravenstvoTex(p: Primer15): string {
  return `${p.mnozhiteli.map(mnozhitelTex).join('')}${ZNAK_TEX[p.znak]}0`;
}

/**
 * Высота кривой для рисунка: знак тот же, что у многочлена, у нулей —
 * прежний вид (пересекает или касается), вдали — не уходит за рамку.
 */
export function vysotaKrivoy(p: Primer15, x: number, masshtab: number): number {
  const f = znachenie(p, x);
  return f / (masshtab + Math.abs(f));
}

/** Масштаб для vysotaKrivoy: наибольший |f| между крайними нулями (или 1). */
export function masshtabKrivoy(p: Primer15): number {
  const n = nuli(p);
  const l = n[0]?.a ?? 0;
  const r = n.at(-1)?.a ?? 0;
  let m = 0;
  for (let i = 0; i <= 200; i += 1)
    m = Math.max(m, Math.abs(znachenie(p, l + ((r - l) * i) / 200)));
  return m > 1e-9 ? m * 0.7 : 1;
}
