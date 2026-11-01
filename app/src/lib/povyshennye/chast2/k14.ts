/**
 * №14 (варианты 19–20): сумма косинусов и синус двойного угла.
 *
 * cos(x − φ) + cos(x + φ) = A·sin 2x, φ = π/fi, A = σ·cos φ / s.
 * Левая часть по формулам сложения: 2cos x·cos φ, правая: 2A·sin x·cos x.
 * 2cos x(cos φ − A sin x) = 0 ⇒ cos x = 0 или sin x = σs,
 * s ∈ {1/2, √2/2, √3/2}: x = π/2 + πk, x = θ + 2πn, x = π − θ + 2πm,
 * θ = σ·arcsin s.
 * б) Отрезок [lo·π/2; hi·π/2] — корни перебором серий, точно в долях π.
 */

import { add, div, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK14 {
  /** φ = π/fi. */
  fi: 3 | 4 | 6;
  /** sin x = σ·s: s = sin(π/u), u = 6 (1/2), 4 (√2/2), 3 (√3/2). */
  u: 3 | 4 | 6;
  sg: 1 | -1;
  /** Отрезок [lo·π/2; hi·π/2]. */
  lo: number;
  hi: number;
}

/** cos²(π/f): f = 3 → 1/4, 4 → 1/2, 6 → 3/4. */
const COS2: Record<number, Rat> = { 3: rat(1, 4), 4: rat(1, 2), 6: rat(3, 4) };
/** sin²(π/u). */
const SIN2: Record<number, Rat> = { 6: rat(1, 4), 4: rat(1, 2), 3: rat(3, 4) };
const SIN_TEX: Record<number, string> = {
  6: '\\dfrac{1}{2}',
  4: '\\dfrac{\\sqrt{2}}{2}',
  3: '\\dfrac{\\sqrt{3}}{2}',
};
const COS_TEX: Record<number, string> = {
  3: '\\dfrac{1}{2}',
  4: '\\dfrac{\\sqrt{2}}{2}',
  6: '\\dfrac{\\sqrt{3}}{2}',
};

function seriya(x0: Rat, T: number, b: string): string {
  const per = T === 1 ? `\\pi ${b}` : `${T}\\pi ${b}`;
  if (x0.n === 0n) return per;
  return `${piTex(x0)}+${per}`;
}

/** Остаток x по модулю m (в долях π), в [0; m). */
function ost(x: Rat, m: number): Rat {
  const v = toNumber(x);
  const k = Math.floor(v / m);
  return sub(x, rat(k * m));
}

export function chislaK14(p: PK14) {
  if (!(p.lo < p.hi)) throw new Error('k14: отрезок');
  const A2 = div(COS2[p.fi]!, SIN2[p.u]!);
  const th = rat(p.sg, p.u);
  /* Серии в долях π: (x0, период). */
  const serii: { x0: Rat; T: number; b: string }[] = [
    { x0: rat(1, 2), T: 1, b: 'k' },
    { x0: ost(th, 2), T: 2, b: 'n' },
    { x0: ost(sub(rat(1), th), 2), T: 2, b: 'm' },
  ];
  const L = rat(p.lo, 2);
  const H = rat(p.hi, 2);
  const vybor: Rat[] = [];
  for (const s of serii) {
    for (let j = -12; j <= 12; j += 1) {
      const x = add(s.x0, rat(j * s.T));
      if (toNumber(x) >= toNumber(L) - 1e-12 && toNumber(x) <= toNumber(H) + 1e-12) vybor.push(x);
    }
  }
  vybor.sort((a, b) => toNumber(a) - toNumber(b));
  return { A2, th, serii, L, H, vybor };
}

function sobrat(p: PK14): Chast2Zadacha {
  const ch = chislaK14(p);
  if (ch.vybor.length === 0) throw new Error('k14: на отрезке нет корней');
  const aAbs = surdTex(sqrtRat(ch.A2));
  const aTex = aAbs === '1' ? '' : aAbs;
  const znak = p.sg < 0 ? '-' : '';
  const fiT = `\\dfrac{\\pi}{${p.fi}}`;
  const ur = `\\cos\\left(x-${fiT}\\right)+\\cos\\left(x+${fiT}\\right)=${znak}${aTex}\\sin 2x`;
  const uslovie = `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$.`;
  const serii = ch.serii.map((s) => seriya(s.x0, s.T, s.b));
  const vTex = ch.vybor.map(piTex);
  const sinT = `${znak}${SIN_TEX[p.u]}`;
  const thT = piTex(ch.th);
  const pervyy = piTex(ch.serii[1]!.x0);
  const vtoroy = piTex(ch.serii[2]!.x0);
  const kontrPer = ch.serii.map((s) => toNumber(s.x0));
  return {
    no: 14,
    shablon: 'k14.kosSumma',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$, $k,n,m\\in\\mathbb{Z}$; б) $${vTex.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Преобразуем обе части',
        lines: [
          `По формулам косинуса разности и суммы $\\cos(x-\\varphi)+\\cos(x+\\varphi)=2\\cos x\\cos\\varphi$; при $\\varphi=${fiT}$ это $2\\cdot${COS_TEX[p.fi]}\\cos x$.`,
          `Справа $\\sin 2x=2\\sin x\\cos x$. Переносим всё в одну часть и выносим $2\\cos x$: $2\\cos x\\left(${COS_TEX[p.fi]}-${znak}${aTex === '' ? '' : aTex}\\sin x\\right)=0$.`,
        ],
      },
      {
        title: 'а) Два случая',
        lines: [
          `$\\cos x=0$: $x=${serii[0]}$, $k\\in\\mathbb{Z}$.`,
          `$\\sin x=${sinT}$ (делим ${COS_TEX[p.fi]} на ${znak}${aTex === '' ? '1' : aTex}): $x=${thT}+2\\pi n$ или $x=\\pi-\\left(${thT}\\right)+2\\pi m$, то есть $x=${pervyy}+2\\pi n$ и $x=${vtoroy}+2\\pi m$, $n,m\\in\\mathbb{Z}$.`,
          `Ответ а): $${serii.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Отрезок $\\left[${piTex(ch.L)};\\ ${piTex(ch.H)}\\right]$ длиной $${piTex(sub(ch.H, ch.L))}$. Подставляем в каждую серию целые $k$, $n$, $m$ и оставляем значения из отрезка (удобно отметить их на единичной окружности).`,
          `Подходят: $${vTex.join(';\\ ')}$.`,
          `Ответ б): $${vTex.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма косинусов — по формулам сложения', formula: `2\\cos x\\cos${fiT}` },
      { slovo: 'Синус двойного угла', formula: '\\sin 2x=2\\sin x\\cos x' },
      {
        slovo: 'Выносим $\\cos x$: два случая',
        formula: `\\cos x=0\\ \\text{или}\\ \\sin x=${sinT}`,
      },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ],
    kontrol: {
      A: Math.sqrt(toNumber(ch.A2)) * p.sg,
      x0: kontrPer,
      vybor: ch.vybor.map((x) => toNumber(x) * Math.PI),
    },
  };
}

export const K14_KOS_SUMMA: Shablon2<PK14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение: сумма косинусов по формулам сложения и синус двойного угла, отбор корней',
  sobrat,
};
