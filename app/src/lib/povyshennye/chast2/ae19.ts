/**
 * №19 (варианты 17–18): b^{2x} − (c + a)·b^{x} + ac = 0 на [p; q].
 *
 * t = b^x ∈ [b^p; b^q]: (t − c)(t − a) = 0. Корень x = log_b c на
 * отрезке есть всегда (c внутри), второй — x = log_b a, если a в
 * [b^p; b^q] и a ≠ c.
 */

import { kuskiPoTochkam, drobTex } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE19 {
  b: number;
  c: number;
  lo: number;
  hi: number;
  n: 1 | 2;
}

const st = (b: number, e: number) => ({
  v: b ** e,
  tex: e >= 0 ? String(b ** e) : drobTex(1, b ** -e),
});

export function chislaAE19(p: PAE19) {
  const L = st(p.b, p.lo);
  const H = st(p.b, p.hi);
  if (!(p.c > L.v && p.c < H.v)) throw new Error('ae19: c внутри отрезка');
  const chislo = (a: number) => {
    let k = 1;
    if (a > 0 && a >= L.v - 1e-12 && a <= H.v + 1e-12 && Math.abs(a - p.c) > 1e-12) k += 1;
    return k;
  };
  const kuski = kuskiPoTochkam([L, H, { v: p.c, tex: String(p.c) }], (a) => chislo(a) === p.n);
  return { L, H, kuski };
}

function sobrat(p: PAE19): Chast2Zadacha {
  const ch = chislaAE19(p);
  const otv = mnozhTex(ch.kuski);
  const nT = p.n === 2 ? 'ровно два корня' : 'ровно один корень';
  return {
    no: 19,
    shablon: 'ae19.pokazOtrezok',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $${p.b}^{2x}-(a+${p.c})\\cdot ${p.b}^{x}+${p.c}a=0$ имеет ${nT} на отрезке $[${p.lo};\\ ${p.hi}]$.`,
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
        title: 'Замена',
        lines: [
          `Пусть $t=${p.b}^{x}$. Функция возрастает, отрезку $x\\in[${p.lo};\\ ${p.hi}]$ соответствует $t\\in[${ch.L.tex};\\ ${ch.H.tex}]$, причём взаимно однозначно.`,
          `$t^2-(a+${p.c})t+${p.c}a=(t-${p.c})(t-a)=0$: $t=${p.c}$ или $t=a$.`,
        ],
      },
      {
        title: 'Подсчёт корней',
        lines: [
          `$t=${p.c}$ лежит в $[${ch.L.tex};\\ ${ch.H.tex}]$ — это один корень при любом $a$.`,
          `Второй корень даёт $t=a$, если $a\\in[${ch.L.tex};\\ ${ch.H.tex}]$ и $a\\ne${p.c}$ (иначе корни совпадают).`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Замена', formula: `t=${p.b}^x\\in[${ch.L.tex};\\ ${ch.H.tex}]` },
      { slovo: 'Разложение', formula: `(t-${p.c})(t-a)=0` },
      { slovo: 'Условие на $a$', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const AE19_POKAZ_OTREZOK: Shablon2<PAE19> = {
  no: 19,
  prototip: 'Параметр: показательное уравнение, сводящееся к квадратному, число корней на отрезке',
  sobrat,
};
