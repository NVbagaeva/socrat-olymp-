/**
 * №16 (варианты 21–22): однородное показательное неравенство.
 *
 * A·(p²)^x − B·(pq)^x + C·(q²)^x ∨ 0. Делим на (q²)^x > 0, t = (p/q)^x:
 * A t² − B t + C ∨ 0, корни t₁ = (p/q)^{e1}, t₂ = (p/q)^{e2}.
 * Ответ в x — по монотонности t(x): концы промежутков — e1 и e2.
 */

import { add, mul, rat, ratTex, type Rat } from '@/lib/zadanie15/core/rational';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL16 {
  p: number;
  q: number;
  e1: number;
  e2: number;
  znak: 'le' | 'ge';
}

const st = (b: Rat, e: number): Rat => {
  let r = rat(1);
  const m = e >= 0 ? b : rat(Number(b.d), Number(b.n));
  for (let i = 0; i < Math.abs(e); i += 1) r = mul(r, m);
  return r;
};

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));

export function chislaL16(p: PL16) {
  if (!(p.e1 < p.e2) || p.p === p.q) throw new Error('l16: параметры');
  const base = rat(p.p, p.q);
  const t1 = st(base, p.e1);
  const t2 = st(base, p.e2);
  const S = add(t1, t2);
  const P = mul(t1, t2);
  /* Целые коэффициенты: (t² − St + P)·L. */
  const lcm = (a: bigint, b: bigint) => (a * b) / gcd(a, b);
  const L = lcm(S.d, P.d);
  const A = L;
  const B = (S.n * L) / S.d;
  const C = (P.n * L) / P.d;
  const g = gcd(gcd(A, B), C);
  const [AA, BB, CC] = [Number(A / g), Number(B / g), Number(C / g)];
  const f = (x: number) => AA * (p.p * p.p) ** x - BB * (p.p * p.q) ** x + CC * (p.q * p.q) ** x;
  const mid = (p.e1 + p.e2) / 2;
  const vnutri = p.znak === 'le' ? f(mid) < 0 : f(mid) > 0;
  const K = (v: number) => ({ v, tex: String(v) });
  const kuski: Kus[] = vnutri
    ? [{ lo: K(p.e1), hi: K(p.e2), loZ: true, hiZ: true }]
    : [
        { lo: null, hi: K(p.e1), loZ: false, hiZ: true },
        { lo: K(p.e2), hi: null, loZ: true, hiZ: false },
      ];
  return { t1, t2, S, P, A: AA, B: BB, C: CC, kuski, f };
}

function sobrat(p: PL16): Chast2Zadacha {
  const ch = chislaL16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const k = (c: number) => (c === 1 ? '' : `${c}\\cdot`);
  const ner = `${k(ch.A)}${p.p * p.p}^x-${k(ch.B)}${p.p * p.q}^x+${k(ch.C)}${p.q * p.q}^x${zn}0`;
  const otv = mnozhTex(ch.kuski);
  const bT = `\\left(\\dfrac{${p.p}}{${p.q}}\\right)^x`;
  const ub = p.p < p.q;
  return {
    no: 16,
    shablon: 'l16.odnorodnoe',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Однородное неравенство',
        lines: [
          `$${p.p * p.p}^x=\\left(${p.p}^x\\right)^2$, $${p.q * p.q}^x=\\left(${p.q}^x\\right)^2$, $${p.p * p.q}^x=${p.p}^x\\cdot${p.q}^x$ — все слагаемые второй степени относительно $${p.p}^x$ и $${p.q}^x$.`,
          `Делим на $${p.q * p.q}^x>0$ и вводим $t=${bT}>0$: $${ch.A === 1 ? '' : ch.A}t^2-${ch.B === 1 ? '' : ch.B}t+${ch.C}${zn}0$.`,
        ],
      },
      {
        title: 'Неравенство относительно $t$',
        lines: [
          `Корни квадратного трёхчлена: $t_1=${ratTex(ch.t1)}=\\left(\\dfrac{${p.p}}{${p.q}}\\right)^{${p.e1}}$ и $t_2=${ratTex(ch.t2)}=\\left(\\dfrac{${p.p}}{${p.q}}\\right)^{${p.e2}}$ (проверка — по теореме Виета).`,
          p.znak === 'le'
            ? `Решение: $t$ между корнями (включительно).`
            : `Решение: $t$ не больше меньшего корня или не меньше большего (с учётом $t>0$ — оба корня положительны).`,
        ],
      },
      {
        title: 'Возвращаемся к $x$',
        lines: [
          `Функция $t=${bT}$ ${ub ? 'убывает (основание меньше 1)' : 'возрастает (основание больше 1)'}, значения $t_1$ и $t_2$ она принимает при $x=${p.e1}$ и $x=${p.e2}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Делим на старшую степень', formula: `t=${bT}` },
      {
        slovo: 'Квадратное неравенство',
        formula: `${ch.A === 1 ? '' : ch.A}t^2-${ch.B === 1 ? '' : ch.B}t+${ch.C}${zn}0`,
      },
      { slovo: 'Корни — степени основания', formula: `x=${p.e1},\\ x=${p.e2}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), A: ch.A, B: ch.B, C: ch.C },
  };
}

export const L16_ODNORODNOE: Shablon2<PL16> = {
  no: 16,
  prototip:
    'Однородное показательное неравенство: деление на старшую степень, квадратное неравенство, монотонность',
  sobrat,
};
