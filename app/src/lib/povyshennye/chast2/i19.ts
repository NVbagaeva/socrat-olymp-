/**
 * №19 (варианты 15–16): x³ − 3x = a на отрезке [p; q].
 *
 * f(x) = x³ − 3x возрастает на (−∞; −1], убывает на [−1; 1], возрастает
 * на [1; +∞); f(−1) = 2, f(1) = −2. Число корней на отрезке меняется при
 * a = f(p), f(q), ±2.
 */

import { kuskiPoTochkam } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI19 {
  lo: number;
  hi: number;
  n: number;
}

const f = (x: number) => x * x * x - 3 * x;

/** Корни f(x) = a на [lo; hi]: бисекция на участках монотонности. */
export function korniI19(lo: number, hi: number, a: number): number[] {
  const uzly = [lo, ...[-1, 1].filter((t) => t > lo && t < hi), hi];
  const out: number[] = [];
  for (let i = 0; i < uzly.length - 1; i += 1) {
    let l = uzly[i]!;
    let r = uzly[i + 1]!;
    const gl = f(l) - a;
    const gr = f(r) - a;
    if (Math.abs(gl) < 1e-12) out.push(l);
    if (Math.abs(gr) < 1e-12) out.push(r);
    if (gl * gr < 0) {
      for (let k = 0; k < 200; k += 1) {
        const m = (l + r) / 2;
        if ((f(l) - a) * (f(m) - a) <= 0) r = m;
        else l = m;
      }
      out.push((l + r) / 2);
    }
  }
  return out.sort((u, v) => u - v).filter((x, i, m) => i === 0 || Math.abs(x - m[i - 1]!) > 1e-7);
}

export function chislaI19(p: PI19) {
  if (!(p.lo < -1 && p.hi > 1)) throw new Error('i19: отрезок должен содержать [−1; 1]');
  const tochki = [f(p.lo), f(p.hi), 2, -2].map((v) => ({ v, tex: String(v) }));
  const kuski = kuskiPoTochkam(tochki, (a) => korniI19(p.lo, p.hi, a).length === p.n);
  if (kuski.length === 0) throw new Error('i19: пусто');
  return { kuski, flo: f(p.lo), fhi: f(p.hi) };
}

function sobrat(p: PI19): Chast2Zadacha {
  const ch = chislaI19(p);
  const otv = mnozhTex(ch.kuski);
  const nT =
    p.n === 2 ? 'ровно два' : p.n === 3 ? 'ровно три' : p.n === 1 ? 'ровно один' : `ровно ${p.n}`;
  return {
    no: 19,
    shablon: 'i19.kubOtrezok',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $x^3-3x=a$ имеет ${nT} ${p.n === 1 ? 'корень' : 'корня'} на отрезке $[${p.lo};\\ ${p.hi}]$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'Исследуем функцию',
        lines: [
          `$f(x)=x^3-3x$, $f'(x)=3x^2-3=3(x-1)(x+1)$. На отрезке $[${p.lo};\\ ${p.hi}]$: $f$ возрастает на $[${p.lo};\\ -1]$, убывает на $[-1;\\ 1]$, возрастает на $[1;\\ ${p.hi}]$.`,
          `$f(${p.lo})=${ch.flo}$, $f(-1)=2$, $f(1)=-2$, $f(${p.hi})=${ch.fhi}$.`,
        ],
      },
      {
        title: 'Считаем пересечения',
        lines: [
          `Число корней — число точек пересечения графика $y=f(x)$ на отрезке с горизонтальной прямой $y=a$. На каждом участке монотонности не больше одного корня; число меняется при $a=${ch.flo}$, $-2$, $2$, $${ch.fhi}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Производная', formula: "f'(x)=3(x-1)(x+1)" },
      {
        slovo: 'Значения в концах и экстремумах',
        formula: `f(${p.lo})=${ch.flo},\\ f(-1)=2,\\ f(1)=-2,\\ f(${p.hi})=${ch.fhi}`,
      },
      { slovo: 'Горизонтальная прямая $y=a$', formula: 'y=a' },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const I19_KUB_OTREZOK: Shablon2<PI19> = {
  no: 19,
  prototip: 'Параметр: число корней кубического уравнения на отрезке по графику',
  sobrat,
};
