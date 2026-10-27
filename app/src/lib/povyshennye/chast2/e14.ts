/**
 * №14 (варианты 9–10): log²_{q^e}(c^{√x} + s) − κ·log_q(c^{√x} + s) + μ = 0.
 *
 * t = log_q(c^{√x} + s): log_{q^e} = t/e, уравнение t²/e² − κt + μ = 0
 * с целыми корнями t₁, t₂ (κ, μ подобраны по ним). Затем
 * c^{√x} = q^{tᵢ} − s, √x = log_c(q^{tᵢ} − s) ≥ 0, x = log²_c(q^{tᵢ} − s).
 * б) Отрезок [k₁²; k₂²]: x на нём ⇔ c^{k₁} ≤ q^{tᵢ} − s ≤ c^{k₂}.
 */

import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];

export interface PE14 {
  /** Основание показательной функции c^{√x}. */
  c: number;
  /** Сдвиг: c^{√x} + s. */
  s: number;
  /** Основание второго логарифма q и показатель e основания первого: q^e. */
  q: number;
  e: Dr;
  t1: number;
  t2: number;
  /** Отрезок б: [k₁²; k₂²]. */
  k1: number;
  k2: number;
}

/** Степень показателя, при которой c^k = v; null — не степень. */
function stepenC(c: number, v: number): number | null {
  for (let k = 0; k <= 40; k += 1) if (c ** k === v) return k;
  return null;
}

export function korniE14(p: PE14) {
  const out: { t: number; v: Rat; k: number | null; x: number }[] = [];
  for (const t of [p.t1, p.t2]) {
    const y = t >= 0 ? rat(p.q ** t) : rat(1, p.q ** -t);
    const v = sub(y, rat(p.s));
    if (toNumber(v) < 1) continue;
    const k = v.d === 1n ? stepenC(p.c, Number(v.n)) : null;
    const x = Math.log(toNumber(v)) / Math.log(p.c);
    out.push({ t, v, k, x: x * x });
  }
  return out.sort((a, b) => a.x - b.x);
}

function osnTex(q: number, e: Rat): string {
  const v = e.d === 1n ? (e.n >= 0n ? rat(q ** Number(e.n)) : rat(1, q ** Number(-e.n))) : null;
  if (v !== null) return v.d === 1n ? `${v.n}` : tochnoTex(v);
  if (e.n === 1n && e.d === 2n) return `\\sqrt{${q}}`;
  if (e.n === -1n && e.d === 2n) return `\\dfrac{1}{\\sqrt{${q}}}`;
  throw new Error('e14: основание');
}

const xTex = (c: number, r: { v: Rat; k: number | null }) =>
  r.k !== null ? `${r.k * r.k}` : `\\log_{${c}}^{2}${ratTex(r.v)}`;

function sobrat(p: PE14): Chast2Zadacha {
  const e = rat(p.e[0], p.e[1]);
  const e2 = mul(e, e);
  const kappa = div(rat(p.t1 + p.t2), e2);
  const mu = div(rat(p.t1 * p.t2), e2);
  const kor = korniE14(p);
  if (kor.length === 0 || p.t1 === p.t2) throw new Error('e14: корней нет');
  const arg = `${p.c}^{\\sqrt{x}}${p.s === 0 ? '' : p.s > 0 ? `+${p.s}` : `${p.s}`}`;
  const L2 = `\\log^2_{${osnTex(p.q, e)}}\\left(${arg}\\right)`;
  const L1 = `\\log_{${p.q}}\\left(${arg}\\right)`;
  const kT = (r: Rat) => (r.n === 1n && r.d === 1n ? '' : tochnoTex(r));
  const sred =
    kappa.n === 0n
      ? ''
      : `${kappa.n > 0n ? '-' : '+'}${kT(kappa.n > 0n ? kappa : rat(-kappa.n, kappa.d))}${L1}`;
  const svob =
    mu.n === 0n ? '' : `${mu.n > 0n ? '+' : '-'}${tochnoTex(mu.n > 0n ? mu : rat(-mu.n, mu.d))}`;
  const ur = `${L2}${sred}${svob}=0`;
  const lo = p.k1 * p.k1;
  const hi = p.k2 * p.k2;
  const uslovie =
    `а) Решите уравнение $${ur}$.\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${lo};\\ ${hi}\\right]$.`;
  const vse = kor.map((r) => xTex(p.c, r));
  const nado = kor.filter((r) => toNumber(r.v) >= p.c ** p.k1 && toNumber(r.v) <= p.c ** p.k2);
  if (nado.length === 0) throw new Error('e14: на отрезке нет корней');
  const vTex = nado.map((r) => xTex(p.c, r));
  const eT = e.d === 1n ? `${e.n}` : ratTex(e);
  const ea = e.n < 0n ? rat(-e.n, e.d) : e;
  const tDel = `${e.n < 0n ? '-' : ''}${ea.n === 1n && ea.d === 1n ? 't' : ea.d === 1n ? `\\dfrac{t}{${ea.n}}` : `${ea.d}t`}`;
  const tKv = `t^2${p.t1 + p.t2 === 0 ? '' : p.t1 + p.t2 > 0 ? `-${p.t1 + p.t2}t` : `+${-(p.t1 + p.t2)}t`}${p.t1 * p.t2 === 0 ? '' : p.t1 * p.t2 > 0 ? `+${p.t1 * p.t2}` : `${p.t1 * p.t2}`}=0`;
  const otsev = [p.t1, p.t2].filter((t) => !kor.some((r) => r.t === t));

  return {
    no: 14,
    shablon: 'e14.logKoren',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: vse } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${vse.join(';\\ ')}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Замена',
        lines: [
          `Пусть $t=${L1}$. Так как $${osnTex(p.q, e)}=${p.q}^{${eT}}$, то $\\log_{${osnTex(p.q, e)}}\\left(${arg}\\right)=${tDel}$, и уравнение принимает вид $${kT(div(rat(1), e2))}t^2${sred.replace(L1, 't')}${svob}=0$, то есть $${tKv}$.`,
          `Корни: $t=${p.t1}$ и $t=${p.t2}$.`,
        ],
      },
      {
        title: 'а) Возвращаемся к $x$',
        lines: [
          ...[p.t1, p.t2].map((t) => {
            const r = kor.find((z) => z.t === t);
            const y = t >= 0 ? `${p.q ** t}` : ratTex(rat(1, p.q ** -t));
            if (r === undefined)
              return `$${arg}=${y}$: $${p.c}^{\\sqrt x}=${ratTex(sub(t >= 0 ? rat(p.q ** t) : rat(1, p.q ** -t), rat(p.s)))}<1$, а при $x\\ge0$ $${p.c}^{\\sqrt x}\\ge1$ — корней нет.`;
            return `$${arg}=${y}$: $${p.c}^{\\sqrt x}=${ratTex(r.v)}$, $\\sqrt x=\\log_{${p.c}}${ratTex(r.v)}${r.k !== null ? `=${r.k}` : ''}\\ge0$, $x=${xTex(p.c, r)}$.`;
          }),
          ...(otsev.length > 0 ? [] : []),
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `$${lo}\\le x\\le ${hi}$ $\\Leftrightarrow$ $${p.k1}\\le\\sqrt x\\le ${p.k2}$ $\\Leftrightarrow$ $${p.c ** p.k1}\\le ${p.c}^{\\sqrt x}\\le ${p.c ** p.k2}$ (функция $y=${p.c}^u$ возрастает).`,
          ...kor.map((r) => {
            const v = toNumber(r.v);
            const ok = v >= p.c ** p.k1 && v <= p.c ** p.k2;
            return `$${p.c}^{\\sqrt x}=${ratTex(r.v)}$ — ${ok ? 'подходит' : 'не подходит'}.`;
          }),
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: `Замена $t=\\log_{${p.q}}(${arg})$ — квадратное уравнение`, formula: tKv },
      { slovo: 'Находим $\\sqrt x$ через логарифм', formula: vse.join(';\\ ') },
      { slovo: 'Отбор: сравниваем значения показательной функции', formula: vTex.join(';\\ ') },
    ],
    kontrol: { korni: kor.map((r) => r.x), otbor: nado.map((r) => r.x), lo, hi },
  };
}

void add;

export const E14_LOG_KOREN: Shablon2<PE14> = {
  no: 14,
  prototip:
    'Квадратное уравнение относительно логарифма от c^{√x} + s: замена и отбор через показательную функцию',
  sobrat,
};
