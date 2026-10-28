/**
 * №18 (варианты 13–14): ромб ABCD, M на BC (BM : MC = m : n), DB = DM.
 *
 * а) Высота DK равнобедренного треугольника BDM — медиана: BK = BM/2.
 *    В прямоугольном треугольнике DKC: cos∠C = KC/CD = 1 − μ/2, μ = BM/BC;
 *    угол C ромба острый.
 * б) H — основание высоты из B в треугольнике BDM, P на луче BH.
 *    «vpis»: ABPD описанный ⇔ AB + PD = BP + AD ⇔ PB = PD ⇔ P на AC.
 *    ∠HBD = 90° − α = ∠O′BD (O′ — центр окружности BCD), поэтому P = O′,
 *    PB = s/(2cos(α/2)), AP = AC − PC, r = S/p = s(sin α − sin(α/2)).
 *    «opis»: окружность ABPD описана около ABD, R = BD/(2 sin α) = s/(2cos(α/2)).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber, type Surd } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PG18 {
  /** BM : MC = m : n. */
  m: number;
  n: number;
  /** AB² (AB = √s2). */
  s2: number;
  vid: 'vpis' | 'opis';
}

/** Конечная десятичная дробь — «0{,}75», иначе дробь. */
function chisloTex(x: Rat): string {
  let d = x.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n ? String(toNumber(x)).replace('.', '{,}') : ratTex(x);
}

/** A − B для корней: при одинаковом подкоренном — одно слагаемое. */
function raznost(A: Surd, B: Surd): string {
  if (A.m === B.m) return surdTex({ k: sub(A.k, B.k), m: A.m });
  return `${surdTex(A)}-${surdTex(B)}`;
}

export function chislaG18(p: PG18) {
  const mu = rat(p.m, p.m + p.n);
  const c = sub(rat(1), div(mu, rat(2)));
  const s2 = rat(p.s2);
  /* cos²(α/2) = (1 + c)/2, sin²(α/2) = (1 − c)/2, sin²α = 1 − c². */
  const cosH2 = div(add(rat(1), c), rat(2));
  const sinH2 = div(sub(rat(1), c), rat(2));
  const sin2 = sub(rat(1), mul(c, c));
  /* r = √(s²sin²α) − √(s²sin²(α/2)), R = √(s²/(4cos²(α/2))). */
  const rA = sqrtRat(mul(s2, sin2));
  const rB = sqrtRat(mul(s2, sinH2));
  const R = sqrtRat(div(s2, mul(rat(4), cosH2)));
  /* «opis»: луч BH пересекает окружность ABD второй раз, только если
     ∠HBD = 90° − α меньше угла α между касательной в B и хордой BD: α > 45°. */
  if (p.vid === 'opis' && !(toNumber(mul(rat(2), mul(c, c))) < 1))
    throw new Error('g18: при α ≤ 45° точки P на луче BH нет');
  const rV = surdToNumber(rA) - surdToNumber(rB);
  return { mu, c, cosH2, sinH2, sin2, rA, rB, R, rV, RV: surdToNumber(R) };
}

function chertezh(p: PG18, punkt: 'a' | 'b'): string {
  const ch = chislaG18(p);
  const s = 4;
  const c = toNumber(ch.c);
  const sn = Math.sqrt(1 - c * c);
  const B: [number, number] = [0, 0];
  const C: [number, number] = [s, 0];
  const A: [number, number] = [-s * c, s * sn];
  const D: [number, number] = [A[0] + s, A[1]];
  const mu = toNumber(ch.mu);
  const M: [number, number] = [s * mu, 0];
  const K: [number, number] = [(s * mu) / 2, 0];
  /* H — основание перпендикуляра из B на DM. */
  const dx = D[0] - M[0];
  const dy = D[1] - M[1];
  const t = -(M[0] * dx + M[1] * dy) / (dx * dx + dy * dy);
  const H: [number, number] = [M[0] + t * dx, M[1] + t * dy];
  const hl = Math.hypot(H[0], H[1]);
  const ux = H[0] / hl;
  const uy = H[1] / hl;
  let P: [number, number];
  const okr: Record<string, { centr: string; radius: number }> = {};
  const tochki: Record<string, [number, number]> = { A, B, C, D, M, H, K };
  if (p.vid === 'vpis') {
    /* P — центр окружности BCD: на луче BH и на серединном перпендикуляре к BC. */
    const lam = s / 2 / ux;
    P = [lam * ux, lam * uy];
    const al = Math.acos(c);
    const r = s * (Math.sin(al) - Math.sin(al / 2));
    const AP = Math.hypot(P[0] - A[0], P[1] - A[1]);
    const ai = r / Math.sin(al / 2);
    tochki.I = [A[0] + ((P[0] - A[0]) * ai) / AP, A[1] + ((P[1] - A[1]) * ai) / AP];
    okr.w = { centr: 'I', radius: r };
  } else {
    /* Окружность ABD: центр O₁ на AC, радиус s/(2cos(α/2)); P — второе пересечение с лучом BH. */
    const R = s / (2 * Math.cos(Math.acos(c) / 2));
    const AC = [C[0] - A[0], C[1] - A[1]];
    const acl = Math.hypot(AC[0]!, AC[1]!);
    const O1: [number, number] = [A[0] + (AC[0]! * R) / acl, A[1] + (AC[1]! * R) / acl];
    const lam = 2 * (ux * O1[0] + uy * O1[1]);
    P = [lam * ux, lam * uy];
    tochki.I = O1;
    okr.w = { centr: 'I', radius: R };
  }
  tochki.P = P;
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'D', b: 'B' },
    { tip: 'otrezok', a: 'D', b: 'M' },
    { tip: 'tochka', t: 'M' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'D', b: 'K', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'D', v: 'K', b: 'C', pryamoy: true, sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'K', sloy: 'reshenie' });
  } else {
    el.push({ tip: 'otrezok', a: 'B', b: 'P' });
    el.push({ tip: 'ugol', a: 'B', v: 'H', b: 'D', pryamoy: true });
    el.push({ tip: 'mnogougolnik', tochki: ['A', 'B', 'P', 'D'], sloy: 'reshenie' });
    el.push({ tip: 'okruzhnost', okr: 'w', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'P' });
    el.push({ tip: 'tochka', t: 'H' });
    if (p.vid === 'vpis') {
      el.push({ tip: 'otrezok', a: 'A', b: 'C', stil: 'punktir', sloy: 'reshenie' });
    } else {
      /* P ближе H — высоту BH показываем целиком. */
      el.push({ tip: 'otrezok', a: 'B', b: 'H' });
    }
  }
  return renderPlan(
    {
      tochki,
      okruzhnosti: okr,
      elementy: el,
      podpisi: punkt === 'a' ? ['A', 'B', 'C', 'D', 'M', 'K'] : ['A', 'B', 'C', 'D', 'M', 'H', 'P'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 220,
      alt: 'Ромб ABCD, точка M на стороне BC, DB = DM',
    },
  );
}

function sobrat(p: PG18): Chast2Zadacha {
  if (!(p.m > 0 && p.n > 0)) throw new Error('g18: отношение');
  const ch = chislaG18(p);
  const cT = chisloTex(ch.c);
  const sT = surdTex(sqrtRat(rat(p.s2)));
  const tochkaM =
    p.m === p.n
      ? 'Точка $M$ — середина стороны $BC$ ромба $ABCD$'
      : `На стороне $BC$ ромба $ABCD$ отметили точку $M$ такую, что $BM:MC=${p.m}:${p.n}$`;
  const opis = p.vid === 'opis';
  const uslovie =
    `${tochkaM}, $DB=DM$.\n` +
    `а) Докажите, что косинус острого угла ромба равен $${cT}$.\n` +
    `б) На луче $BH$, где $BH$ — высота треугольника $BDM$, отметили такую точку $P$, что ${opis ? 'около четырёхугольника $ABPD$ можно описать окружность' : 'в четырёхугольник $ABPD$ можно вписать окружность'}. Найдите радиус этой окружности, если $AB=${sT}$.`;
  const otvT = opis ? surdTex(ch.R) : raznost(ch.rA, ch.rB);
  const otvV = opis ? ch.RV : ch.rV;
  const muT = ratTex(ch.mu);
  const cosH = surdTex(sqrtRat(ch.cosH2));
  const sinH = surdTex(sqrtRat(ch.sinH2));
  const sinA = surdTex(sqrtRat(ch.sin2));
  const bLines = opis
    ? [
        `Окружность, описанная около $ABPD$, проходит через $A$, $B$, $D$ — это окружность, описанная около треугольника $ABD$. В нём $\\angle BAD=\\alpha$ (острый угол ромба) и $BD=2s\\sin\\frac{\\alpha}{2}$ ($s=AB$; {{t:romb-diagonali|диагонали ромба перпендикулярны и делят углы пополам}}).`,
        `Такая точка $P$ есть: $\\angle DBC=90^\\circ-\\frac{\\alpha}{2}$, в {{t:ravnobedr-ugly|равнобедренном}} треугольнике $BDM$ $\\angle BDM=\\alpha$, поэтому $\\angle HBD=90^\\circ-\\alpha$. Касательная к окружности в точке $B$ образует с хордой $BD$ угол $\\alpha$, а $\\cos\\alpha=${cT}<\\frac{\\sqrt2}{2}$, то есть $\\alpha>45^\\circ$ и $90^\\circ-\\alpha<\\alpha$: луч $BH$ идёт внутрь окружности и пересекает её второй раз.`,
        `По {{t:teorema-sinusov|теореме синусов}} $R=\\dfrac{BD}{2\\sin\\alpha}=\\dfrac{2s\\sin\\frac{\\alpha}{2}}{4\\sin\\frac{\\alpha}{2}\\cos\\frac{\\alpha}{2}}=\\dfrac{s}{2\\cos\\frac{\\alpha}{2}}$.`,
        `$\\cos\\frac{\\alpha}{2}=\\sqrt{\\dfrac{1+\\cos\\alpha}{2}}=${cosH}$, поэтому $R=\\dfrac{${sT}}{2\\cdot${cosH}}=${otvT}$.`,
      ]
    : [
        `По {{t:opisannyy-chetyrehugolnik|признаку описанного четырёхугольника}} $AB+PD=BP+AD$, а $AB=AD$, значит, $PB=PD$: точка $P$ лежит на {{t:seredinnyy-perp|серединном перпендикуляре}} к $BD$, то есть на диагонали $AC$ ({{t:romb-diagonali|диагонали ромба перпендикулярны и делятся пополам}}).`,
        `Углы: $\\angle DBC=90^\\circ-\\frac{\\alpha}{2}$ (диагональ — биссектриса тупого угла $B$), в {{t:ravnobedr-ugly|равнобедренном}} треугольнике $BDM$ $\\angle BDM=180^\\circ-2\\left(90^\\circ-\\frac{\\alpha}{2}\\right)=\\alpha$, поэтому $\\angle HBD=90^\\circ-\\alpha$. Центр $O'$ окружности, описанной около остроугольного треугольника $BCD$, тоже даёт $\\angle O'BD=90^\\circ-\\angle BCD=90^\\circ-\\alpha$, и $O'$ лежит на $AC$. Значит, $P=O'$, и $PB=PC=PD=\\dfrac{BD}{2\\sin\\alpha}=\\dfrac{s}{2\\cos\\frac{\\alpha}{2}}$ ({{t:teorema-sinusov|теорема синусов}}).`,
        `$AC=2s\\cos\\frac{\\alpha}{2}$, $AP=AC-PC$, $BD=2s\\sin\\frac{\\alpha}{2}$. Площадь дельтоида $ABPD$ равна $\\frac12AP\\cdot BD$, полупериметр $s+PB$. Радиус вписанной окружности $r=\\dfrac{S}{p}=s\\sin\\frac{\\alpha}{2}\\cdot\\dfrac{4\\cos^2\\frac{\\alpha}{2}-1}{2\\cos\\frac{\\alpha}{2}+1}=s\\sin\\frac{\\alpha}{2}\\left(2\\cos\\frac{\\alpha}{2}-1\\right)=s\\sin\\alpha-s\\sin\\frac{\\alpha}{2}$.`,
        `$\\sin\\alpha=${sinA}$, $\\sin\\frac{\\alpha}{2}=\\sqrt{\\dfrac{1-\\cos\\alpha}{2}}=${sinH}$: $r=${sT}\\cdot${sinA}-${sT}\\cdot${sinH}=${otvT}$.`,
      ];
  return {
    no: 18,
    shablon: 'g18.rombVysota',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Радиус',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Высота равнобедренного треугольника',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $s=AB$, $DK$ — высота треугольника $BDM$. Он равнобедренный ($DB=DM$), поэтому {{t:ravnobedr-vysota|высота $DK$ является медианой}}: $BK=\\dfrac{BM}{2}=\\dfrac{${muT}s}{2}$.`,
          `Тогда $KC=s-\\dfrac{${muT}s}{2}$, и в прямоугольном треугольнике $DKC$ ($CD=s$): $\\cos\\angle C=\\dfrac{KC}{CD}=1-\\dfrac{${muT}}{2}=${cT}$.`,
          `Косинус положителен — угол $C$ острый; это и есть острый угол ромба $\\alpha$.`,
        ],
      },
      {
        title: 'б) Где лежит точка $P$',
        risunok: chertezh(p, 'b'),
        lines: bLines.slice(0, 2),
      },
      { title: 'б) Радиус', lines: [...bLines.slice(2), `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      {
        slovo: 'а) Высота равнобедренного треугольника — медиана',
        formula: `\\cos\\alpha=1-\\frac{BM}{2BC}=${cT}`,
      },
      {
        slovo: opis
          ? 'б) Окружность — описанная около $ABD$'
          : 'б) $PB=PD$: точка $P$ на диагонали $AC$',
        formula: opis ? 'R=\\frac{BD}{2\\sin\\alpha}' : "P=O'",
      },
      {
        slovo: 'б) Формула радиуса',
        formula: opis
          ? 'R=\\frac{s}{2\\cos\\frac{\\alpha}{2}}'
          : 'r=s\\sin\\alpha-s\\sin\\frac{\\alpha}{2}',
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { cos: toNumber(ch.c), otvet: otvV },
  };
}

export const G18_ROMB_VYSOTA: Shablon2<PG18> = {
  no: 18,
  prototip:
    'Ромб с равнобедренным треугольником BDM: косинус угла; точка на высоте — вписанная или описанная окружность четырёхугольника ABPD',
  sobrat,
};
