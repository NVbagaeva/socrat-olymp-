/**
 * №19 (варианты 11–12): ax² − 2(a + m)x + a + n = 0.
 *
 * a = 0: линейное −2mx + n = 0 — ровно один корень (m ≠ 0).
 * a ≠ 0: D/4 = (a + m)² − a(a + n) = (2m − n)a + m², ноль при
 * a₀ = −m²/(2m − n) (a₀ ≠ 0).
 * «odin» — ровно один корень: {0; a₀}.
 * «dva» — два различных корня: a ≠ 0 и (2m − n)a + m² > 0.
 */

import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA19 {
  m: number;
  n: number;
  vopros: 'odin' | 'dva';
}

export function chislaA19(p: PA19) {
  const k = 2 * p.m - p.n;
  if (p.m === 0 || k === 0) throw new Error('a19: параметры');
  const a0 = rat(-p.m * p.m, k);
  const A0 = { tex: ratTex(a0), v: toNumber(a0) };
  const Z = { tex: '0', v: 0 };
  let kuski: Kus[];
  if (p.vopros === 'odin') {
    const pts = [A0, Z].sort((u, v) => u.v - v.v);
    kuski = pts.map((t) => ({ lo: t, hi: t, loZ: true, hiZ: true }));
  } else if (k > 0) {
    kuski = [
      { lo: A0, hi: Z, loZ: false, hiZ: false },
      { lo: Z, hi: null, loZ: false, hiZ: false },
    ];
  } else {
    kuski = [
      { lo: null, hi: Z, loZ: false, hiZ: false },
      { lo: Z, hi: A0, loZ: false, hiZ: false },
    ];
  }
  return { k, a0, kuski };
}

function sobrat(p: PA19): Chast2Zadacha {
  const ch = chislaA19(p);
  const otv = mnozhTex(ch.kuski);
  const am = p.m > 0 ? `a+${p.m}` : `a-${-p.m}`;
  const an = p.n === 0 ? 'a' : p.n > 0 ? `a+${p.n}` : `a-${-p.n}`;
  const ur = `ax^2-2(${am})x+${an}=0`;
  const Dt = `${ch.k === 1 ? '' : ch.k === -1 ? '-' : ch.k}a+${p.m * p.m}`;
  const vopr = p.vopros === 'odin' ? 'ровно один корень' : 'два различных корня';
  return {
    no: 19,
    shablon: 'a19.kvadratParametr',
    uslovie: `Найдите все значения параметра $a$, при каждом из которых уравнение $${ur}$ имеет ${vopr}.`,
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
        title: 'Случай $a=0$',
        lines: [
          `Уравнение линейное: $${-2 * p.m}x${p.n === 0 ? '' : p.n > 0 ? `+${p.n}` : `-${-p.n}`}=0$ — ровно один корень $x=${ratTex(rat(p.n, 2 * p.m))}$.`,
        ],
      },
      {
        title: 'Случай $a\\ne0$: дискриминант',
        lines: [
          `$\\dfrac{D}{4}=(${am})^2-a(${an})=${Dt}$.`,
          `$D=0$ при $a=${ratTex(ch.a0)}$ — тогда корень один; $D>0$ при $a${ch.k > 0 ? '>' : '<'}${ratTex(ch.a0)}$ — два различных корня.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.vopros === 'odin'
            ? `Ровно один корень: $a=0$ или $a=${ratTex(ch.a0)}$.`
            : `Два различных корня: $a\\ne0$ и $a${ch.k > 0 ? '>' : '<'}${ratTex(ch.a0)}$.`,
          `Ответ: $a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Не забываем случай $a=0$', formula: 'a=0' },
      { slovo: 'Дискриминант', formula: `\\frac{D}{4}=${Dt}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), a0: toNumber(ch.a0) },
  };
}

export const A19_KVADRAT_PARAMETR: Shablon2<PA19> = {
  no: 19,
  prototip: 'Параметр при старшем коэффициенте: число корней с отдельным случаем a = 0',
  sobrat,
};
