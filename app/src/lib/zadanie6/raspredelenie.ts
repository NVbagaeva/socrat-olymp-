/**
 * Общее для прототипов с распределением (6.6, 6.7, 6.11, 6.13–6.15):
 * таблица и запись $X\sim(\ldots)$, точные $\mathrm{M}(X)$, $\mathrm{M}(X^2)$, $\mathrm{D}(X)$,
 * строки решения «$x_ip_i$» и «$x_i^2p_i$» прямо в таблице.
 *
 * Параметры: `xs` — значения по возрастанию, `ps` — вероятности в целых
 * долях `den`, `v` — буква величины, `sj` — ключ сюжетной величины.
 * У 6.13 вероятности пишутся обыкновенными дробями (`obyk`).
 */

import {
  add,
  arr,
  drob,
  etapy,
  mul,
  num,
  plus,
  q,
  str,
  sub,
  sumQ,
  t,
  tq,
  umn,
  type Q,
} from './kit';
import type { Etap, Params, StrokaTablicy, Summa, Tablica } from './types';

export const BUKVY_RASPR = ['X', 'Y', 'Z'] as const;

export interface Raspr {
  v: string;
  xs: number[];
  ps: number[];
  den: number;
  /** Вероятности обыкновенными дробями (6.13). */
  obyk: boolean;
  /** Вероятности точными дробями. */
  p: Q[];
}

export function raspr(p: Params, obyk = false): Raspr {
  const xs = arr(p, 'xs');
  const ps = arr(p, 'ps');
  const den = num(p, 'den');
  if (xs.length !== ps.length) {
    throw new Error('значений и вероятностей разное число');
  }
  return {
    v: str(p, 'v', BUKVY_RASPR),
    xs,
    ps,
    den,
    obyk,
    p: ps.map((n) => q(n, den)),
  };
}

/** Вероятность в TeX: десятичной дробью или (6.13) обыкновенной. */
export function pTex(r: Raspr, i: number): string {
  const x = r.p[i] as Q;
  return r.obyk ? drob(x) : tq(x);
}

/** Дробь решения в TeX: у 6.13 — обыкновенная, иначе десятичная. */
export function qTex(r: Raspr, x: Q): string {
  return r.obyk ? drob(x) : tq(x);
}

export function zapisTex(r: Raspr): string {
  const verh = r.xs.map((x) => t(x)).join('&');
  const niz = r.xs.map((_, i) => pTex(r, i)).join('&');
  return `${r.v}\\sim\\begin{pmatrix}${verh}\\\\${niz}\\end{pmatrix}`;
}

/** Таблица распределения, как в условии: «Значения $X$» и «Вероятности». */
export function tablicaRaspr(r: Raspr): Tablica {
  return {
    stroki: [
      { zag: `Значения $${r.v}$`, yach: r.xs.map((x) => `$${t(x)}$`) },
      { zag: 'Вероятности', yach: r.xs.map((_, i) => `$${pTex(r, i)}$`) },
    ],
  };
}

export function ozhidanie(r: Raspr): Q {
  return sumQ(r.xs.map((x, i) => mul(q(x), r.p[i] as Q)));
}

export function ozhidanieKv(r: Raspr): Q {
  return sumQ(r.xs.map((x, i) => mul(q(x * x), r.p[i] as Q)));
}

export function dispersiya(r: Raspr): Q {
  const e = ozhidanie(r);
  return sub(ozhidanieKv(r), mul(e, e));
}

export function summyRaspr(r: Raspr): Summa[] {
  return [{ chto: 'вероятности распределения', doli: r.ps, nado: r.den }];
}

/* ── Шаги решения ───────────────────────────────────────────────── */

/** Число в скобках, если отрицательное — для произведений. */
function sx(x: number): string {
  return x < 0 ? `(${t(x)})` : t(x);
}

/** Слагаемое $x_ip_i$ в TeX. */
export function slagaemoeXP(r: Raspr, i: number): string {
  return umn(sx(r.xs[i] as number), pTex(r, i));
}

/** Слагаемое $x_i^2p_i$ в TeX: квадрат уже посчитан. */
export function slagaemoeX2P(r: Raspr, i: number): string {
  const x = r.xs[i] as number;
  return umn(t(x * x), pTex(r, i));
}

export interface ShagiE {
  E: Q;
  tablica: Tablica;
  stroki: StrokaTablicy[];
  formula: string;
}

/** Таблица решения со строками $x_i$, $p_i$, $x_ip_i$ (и $x_i^2p_i$). */
export function tablicaReshenia(r: Raspr, sKvadratami: boolean): Tablica {
  const stroki: StrokaTablicy[] = [
    { zag: `$x_i$`, yach: r.xs.map((x) => `$${t(x)}$`) },
    { zag: `$p_i$`, yach: r.xs.map((_, i) => `$${pTex(r, i)}$`) },
    {
      zag: `$x_ip_i$`,
      yach: r.xs.map((x, i) => `$${qTex(r, mul(q(x), r.p[i] as Q))}$`),
    },
  ];
  if (sKvadratami) {
    stroki.push({
      zag: `$x_i^2p_i$`,
      yach: r.xs.map((x, i) => `$${qTex(r, mul(q(x * x), r.p[i] as Q))}$`),
    });
  }
  return { stroki, vydelitStroki: sKvadratami ? [2, 3] : [2] };
}

/** Сумма строки $x_ip_i$: «$\mathrm{M}(X)=…=3{,}9$». */
export function formulaE(r: Raspr): string {
  const E = ozhidanie(r);
  const sl = r.xs.map((_, i) => slagaemoeXP(r, i));
  const zn = r.xs.map((x, i) => {
    const v = mul(q(x), r.p[i] as Q);
    return v.n < 0 ? `(${qTex(r, v)})` : qTex(r, v);
  });
  return `\\mathrm{M}(${r.v})=${plus(sl)}=${plus(zn)}=${qTex(r, E)}`;
}

export function formulaEKv(r: Raspr): string {
  const E2 = ozhidanieKv(r);
  const sl = r.xs.map((_, i) => slagaemoeX2P(r, i));
  const zn = r.xs.map((x, i) => qTex(r, mul(q(x * x), r.p[i] as Q)));
  return `\\mathrm{M}(${r.v}^2)=${plus(sl)}=${plus(zn)}=${qTex(r, E2)}`;
}

/** Проверка распределения одной строкой: сумма вероятностей равна 1. */
export function strokaProverki(r: Raspr): string {
  return `Сумма вероятностей: $${plus(r.xs.map((_, i) => pTex(r, i)))}=1$ — распределение записано верно.`;
}

/** Квадрат числа в TeX: дробь — в скобках, отрицательное — в скобках. */
function kvadratTex(r: Raspr, x: Q): string {
  const s = qTex(r, x);
  return x.n < 0 || (r.obyk && x.m !== 1) ? `\\left(${s}\\right)^2` : `${s}^2`;
}

/** Шаги «$\mathrm{M}(X)$ → $\mathrm{M}(X^2)$ → $\mathrm{D}(X)$» для 6.13–6.15. */
export function shagiD(r: Raspr): { etapy: Etap[]; E: Q; E2: Q; D: Q } {
  const E = ozhidanie(r);
  const E2 = ozhidanieKv(r);
  const D = sub(E2, mul(E, E));
  const v = r.v;
  return {
    E,
    E2,
    D,
    etapy: etapy(
      {
        t: `Находим $\\mathrm{M}(${v})$ — строка $x_ip_i$`,
        lines: [
          strokaProverki(r),
          'Добавляем к таблице строки $x_ip_i$ и $x_i^2p_i$ и складываем первую из них:',
          `$${formulaE(r)}$.`,
        ],
        tablica: tablicaReshenia(r, true),
      },
      {
        t: `Находим $\\mathrm{M}(${v}^2)$ — строка $x_i^2p_i$`,
        lines: [`$${formulaEKv(r)}$.`],
      },
      {
        t: 'Дисперсия: среднее квадрата минус квадрат среднего',
        lines: [
          `$\\mathrm{D}(${v})=\\mathrm{M}(${v}^2)-\\left(\\mathrm{M}(${v})\\right)^2=${qTex(r, E2)}-${kvadratTex(r, E)}=${qTex(r, E2)}-${qTex(r, mul(E, E))}=${qTex(r, D)}${r.obyk && D.m !== 1 ? `=${tq(D)}` : ''}$.`,
        ],
      },
    ),
  };
}

/** Неверные ответы-ловушки для подсказок о дисперсии. */
export function lovushkiD(r: Raspr): Q[] {
  const E = ozhidanie(r);
  const E2 = ozhidanieKv(r);
  return [E2, sub(E2, E), add(E2, mul(E, E))];
}
