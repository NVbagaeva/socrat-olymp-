/**
 * №16 (варианты 9–10): p^{x²−m}(q^{x²−n} + K) ⋚ (p²)^{x² − (m+n)/2} + q^{x²−n},
 * K = p^{m−n}, q > p.
 *
 * a = p^{x²−m}, b = q^{x²−n}: (p²)^{…} = K·a², неравенство
 * ab + Ka − Ka² − b ⋚ 0 ⇔ (a − 1)(b − Ka) ⋚ 0, где a − 1 имеет знак
 * x² − m, а b − Ka = q^{x²−n} − p^{x²−n} — знак x² − n.
 * Итог: (x² − m)(x² − n) ⋚ 0.
 */

import type { Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PE16 {
  p: number;
  q: number;
  m: number;
  n: number;
  /** Знак исходного неравенства: lt (<, как в образце) или gt (>). */
  znak: 'lt' | 'gt' | 'le' | 'ge';
}

const kor = (v: number) => surdTex(sqrtRat(rat(v)));

/** Куски ответа по x: (x² − m)(x² − n) ⋚ 0, m > n ≥ 0. */
export interface KusokE16 {
  lo: string | null;
  hi: string | null;
  loZ: boolean;
  hiZ: boolean;
  loV: number;
  hiV: number;
}

export function otvetE16(p: PE16): KusokE16[] {
  const strogo = p.znak === 'lt' || p.znak === 'gt';
  const men = p.znak === 'lt' || p.znak === 'le';
  const sm = kor(p.m);
  const sn = kor(p.n);
  const vm = Math.sqrt(p.m);
  const vn = Math.sqrt(p.n);
  const z = !strogo;
  if (men) {
    /* n < x² < m. */
    if (p.n === 0 && !strogo) return [{ lo: `-${sm}`, hi: sm, loZ: z, hiZ: z, loV: -vm, hiV: vm }];
    return [
      { lo: `-${sm}`, hi: p.n === 0 ? '0' : `-${sn}`, loZ: z, hiZ: z, loV: -vm, hiV: -vn },
      { lo: sn, hi: sm, loZ: z, hiZ: z, loV: vn, hiV: vm },
    ];
  }
  /* x² < n или x² > m. */
  const out: KusokE16[] = [
    { lo: null, hi: `-${sm}`, loZ: false, hiZ: z, loV: -Infinity, hiV: -vm },
  ];
  if (p.n > 0) out.push({ lo: `-${sn}`, hi: sn, loZ: z, hiZ: z, loV: -vn, hiV: vn });
  else if (z) out.push({ lo: '0', hi: '0', loZ: true, hiZ: true, loV: 0, hiV: 0 });
  out.push({ lo: sm, hi: null, loZ: z, hiZ: false, loV: vm, hiV: Infinity });
  return out;
}

const pk = (x: number) => (x === 0 ? '' : x > 0 ? `-${x}` : `+${-x}`);
const pkD = (x: number) => (x === 0 ? '' : x > 0 ? `-${dec(x)}` : `+${dec(-x)}`);

function sobrat(p: PE16): Chast2Zadacha {
  if (!(p.q > p.p) || !(p.m > p.n) || p.n < 0) throw new Error('e16: параметры');
  const K = p.p ** (p.m - p.n);
  const zn = { lt: '<', gt: '>', le: '\\le', ge: '\\ge' }[p.znak];
  const men = p.znak === 'lt' || p.znak === 'le';
  const pol = `${p.p * p.p}^{x^2${pkD((p.m + p.n) / 2)}}`;
  const ner = `${p.p}^{x^2${pk(p.m)}}\\left(${p.q}^{x^2${pk(p.n)}}+${K}\\right)${zn}${pol}+${p.q}^{x^2${pk(p.n)}}`;
  const ks = otvetE16(p);
  const otv = ks
    .map((k) =>
      k.lo === k.hi && k.lo !== null
        ? `\\left\\{${k.lo}\\right\\}`
        : `\\left${k.loZ ? '[' : '('}${k.lo ?? '-\\infty'};\\ ${k.hi ?? '+\\infty'}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
  const pole: Mnozhestvo = {
    kuski: ks.map((k) =>
      k.lo === k.hi && k.lo !== null
        ? { t: 'tochka' as const, x: k.lo }
        : {
            t: 'interval' as const,
            lo: k.lo ?? '-inf',
            loZakr: k.loZ,
            hi: k.hi ?? 'inf',
            hiZakr: k.hiZ,
          },
    ),
  };
  const a = `${p.p}^{x^2${pk(p.m)}}`;
  const b = `${p.q}^{x^2${pk(p.n)}}`;
  const zn0 = { lt: '<', gt: '>', le: '\\le', ge: '\\ge' }[p.znak];
  return {
    no: 16,
    shablon: 'e16.pokazRazlozh',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество решений', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Обозначения',
        lines: [
          `Пусть $a=${a}>0$, $b=${b}>0$. Тогда $${pol}=${p.p}^{2x^2${pk(p.m + p.n)}}=${K}\\cdot\\left(${p.p}^{x^2${pk(p.m)}}\\right)^2=${K}a^2$ (так как $${K}=${p.p}^{${p.m - p.n}}$).`,
          `Неравенство: $a(b+${K})${zn}${K}a^2+b$, то есть $ab+${K}a-${K}a^2-b${zn0}0$.`,
        ],
      },
      {
        title: 'Разложение на множители',
        lines: [
          `$ab-b-${K}a^2+${K}a=b(a-1)-${K}a(a-1)=(a-1)(b-${K}a)$. Получаем $(a-1)(b-${K}a)${zn0}0$.`,
          `$${K}a=${p.p}^{${p.m - p.n}}\\cdot${p.p}^{x^2${pk(p.m)}}=${p.p}^{x^2${pk(p.n)}}$, поэтому $b-${K}a=${p.q}^{x^2${pk(p.n)}}-${p.p}^{x^2${pk(p.n)}}$.`,
        ],
      },
      {
        title: 'Знаки множителей',
        lines: [
          `$a-1=${p.p}^{x^2${pk(p.m)}}-${p.p}^0$ имеет тот же знак, что $x^2-${p.m}$ (функция $y=${p.p}^t$ возрастает).`,
          `$${p.q}^{t}-${p.p}^{t}=${p.p}^t\\left(\\left(\\tfrac{${p.q}}{${p.p}}\\right)^t-1\\right)$ имеет тот же знак, что $t$; при $t=x^2${pk(p.n)}$ — знак $x^2${pk(p.n)}$.`,
          `Значит, неравенство равносильно $\\left(x^2-${p.m}\\right)\\left(x^2${pk(p.n)}\\right)${zn0}0$: ${men ? `$${p.n}${p.znak === 'lt' ? '<' : '\\le'}x^2${p.znak === 'lt' ? '<' : '\\le'}${p.m}$` : `$x^2${p.znak === 'gt' ? '<' : '\\le'}${p.n}$ или $x^2${p.znak === 'gt' ? '>' : '\\ge'}${p.m}$`}.`,
        ],
      },
      { title: 'Ответ', lines: [`$x\\in${otv}$.`] },
    ],
    razbor: [
      {
        slovo: 'Вводим $a$ и $b$, переносим всё в одну часть',
        formula: `ab+${K}a-${K}a^2-b${zn0}0`,
      },
      { slovo: 'Группируем: разложение на множители', formula: `(a-1)(b-${K}a)${zn0}0` },
      {
        slovo: 'Заменяем множители на множители того же знака',
        formula: `\\left(x^2-${p.m}\\right)\\left(x^2${pk(p.n)}\\right)${zn0}0`,
      },
      { slovo: 'Решаем относительно $x$', formula: otv },
    ],
    utochnenie: { u: 'граничных точек' },
    kontrol: {
      kuski: ks.flatMap((k) => [
        k.loV === -Infinity ? -1e9 : k.loV,
        k.hiV === Infinity ? 1e9 : k.hiV,
        k.loZ ? 1 : 0,
        k.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const E16_POKAZ_RAZLOZH: Shablon2<PE16> = {
  no: 16,
  prototip: 'Показательное неравенство: две новые переменные, группировка, метод рационализации',
  sobrat,
};
