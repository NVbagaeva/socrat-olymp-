/**
 * №18 (варианты 23–24): биссектрисы соседних углов параллелограмма.
 *
 * ABCD: AB = c, AD = b (b ≥ c), cos A = c1/c2 (острый угол A).
 * Биссектрисы углов A и D пересекают BC в точках M и N, друг друга — в K.
 * а) ∠A + ∠D = 180° ⇒ ∠KAD + ∠KDA = 90° ⇒ ∠AKD = 90°.
 * б) «MN»: ∠BMA = ∠MAD = ∠BAM ⇒ BM = AB = c, так же CN = CD = c,
 *    MN = |b − 2c|. «S»: AK = b·cos(A/2), DK = b·sin(A/2),
 *    S(AKD) = b²·sin A/4.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM18 {
  c: number;
  b: number;
  c1: number;
  s1: number;
  c2: number;
  nado: 'MN' | 'S';
}

export function chislaM18(p: PM18) {
  if (p.c1 * p.c1 + p.s1 * p.s1 !== p.c2 * p.c2) throw new Error('m18: тройка');
  if (!(p.b >= p.c)) throw new Error('m18: биссектрисы должны пересечь BC');
  const MN = Math.abs(p.b - 2 * p.c);
  if (MN === 0) throw new Error('m18: M и N совпадают');
  const S = rat(p.b * p.b * p.s1, 4 * p.c2);
  return { MN, S };
}

function chertezh(p: PM18, punkt: 'a' | 'b'): string {
  const al = Math.acos(p.c1 / p.c2);
  const k = 6 / p.b;
  const b = p.b * k;
  const c = p.c * k;
  const A: [number, number] = [0, 0];
  const D: [number, number] = [b, 0];
  const B: [number, number] = [c * Math.cos(al), c * Math.sin(al)];
  const C: [number, number] = [B[0] + b, B[1]];
  const M: [number, number] = [B[0] + c, B[1]];
  const N: [number, number] = [C[0] - c, C[1]];
  /* K — пересечение AM и DN. */
  const t = (() => {
    const [x1, y1] = A;
    const [x2, y2] = M;
    const [x3, y3] = D;
    const [x4, y4] = N;
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    return ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
  })();
  const K: [number, number] = [A[0] + t * (M[0] - A[0]), A[1] + t * (M[1] - A[1])];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    /* Если K за стороной BC, биссектрисы продолжаем до K. */
    { tip: 'otrezok', a: 'A', b: t > 1 ? 'K' : 'M' },
    { tip: 'otrezok', a: 'D', b: t > 1 ? 'K' : 'N' },
    { tip: 'ugol', a: 'B', v: 'A', b: 'K' },
    { tip: 'ugol', a: 'K', v: 'A', b: 'D' },
    { tip: 'ugol', a: 'A', v: 'D', b: 'K', dugi: 2 },
    { tip: 'ugol', a: 'K', v: 'D', b: 'C', dugi: 2 },
    { tip: 'tochka', t: 'M' },
    { tip: 'tochka', t: 'N' },
    { tip: 'tochka', t: 'K' },
  ];
  if (punkt === 'a')
    el.push({ tip: 'ugol', a: 'A', v: 'K', b: 'D', pryamoy: true, sloy: 'reshenie' });
  return renderPlan(
    {
      tochki: { A, B, C, D, M, N, K },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'D', 'M', 'N', 'K'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PM18): Chast2Zadacha {
  const ch = chislaM18(p);
  const mn = p.nado === 'MN';
  const otvT = mn ? String(ch.MN) : ratTex(ch.S);
  const cosT = ratTex(rat(p.c1, p.c2));
  const uslovie =
    `В параллелограмме $ABCD$ с острым углом $A$ биссектрисы углов $A$ и $D$ пересекают сторону $BC$ в точках $M$ и $N$ соответственно, а друг друга — в точке $K$.\n` +
    `а) Докажите, что угол $AKD$ прямой.\n` +
    `б) Найдите ${mn ? 'длину отрезка $MN$' : 'площадь треугольника $AKD$'}, если $AB=${p.c}$, $AD=${p.b}$${mn ? '' : `, $\\cos\\angle BAD=${cosT}$`}.`;
  const bLines = mn
    ? [
        `$BC\\parallel AD$, поэтому $\\angle BMA=\\angle MAD$ ({{t:nakrest-ugly|накрест лежащие углы}}), а $\\angle MAD=\\angle BAM$ ($AM$ — биссектриса). Значит, треугольник $ABM$ {{t:ravnobedr-ugly|равнобедренный}}: $BM=AB=${p.c}$.`,
        `Так же $\\angle CND=\\angle NDA$ ({{t:nakrest-ugly|накрест лежащие}}) $=\\angle CDN$, и $CN=CD=${p.c}$ ({{t:ravnobedr-ugly|равнобедренный треугольник}} $CDN$).`,
        `$BC=AD=${p.b}$, поэтому $MN=|BM+CN-BC|=|${2 * p.c}-${p.b}|=${ch.MN}$. Ответ: $${ch.MN}$.`,
      ]
    : [
        `В прямоугольном треугольнике $AKD$ гипотенуза $AD=${p.b}$, $\\angle KAD=\\dfrac{\\angle A}{2}$: $AK=AD\\cos\\dfrac{\\angle A}{2}$, $DK=AD\\sin\\dfrac{\\angle A}{2}$.`,
        `По {{t:ploshchad-treugolnika|формуле площади}} $S_{AKD}=\\dfrac12 AK\\cdot DK=\\dfrac{AD^2}{2}\\sin\\dfrac{\\angle A}{2}\\cos\\dfrac{\\angle A}{2}=\\dfrac{AD^2\\sin\\angle A}{4}$.`,
        `$\\sin\\angle A=\\sqrt{1-\\cos^2\\angle A}=${ratTex(rat(p.s1, p.c2))}$ (тождество следует из {{t:pifagor|теоремы Пифагора}}); по той же {{t:ploshchad-treugolnika|формуле площади}} $S_{AKD}=\\dfrac{${p.b * p.b}\\cdot${ratTex(rat(p.s1, p.c2))}}{4}=${otvT}$. Ответ: $${otvT}$.`,
      ];
  return {
    no: 18,
    shablon: 'm18.bissektrisy',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: mn ? 'Длина' : 'Площадь',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Сумма половин соседних углов',
        risunok: chertezh(p, 'a'),
        lines: [
          `Углы $A$ и $D$ параллелограмма прилежат к стороне $AD$ и в сумме дают $180^\\circ$ (односторонние углы при $AB\\parallel CD$; {{t:nakrest-ugly|параллельные прямые и секущая}}).`,
          `$\\angle KAD+\\angle KDA=\\dfrac{\\angle A}{2}+\\dfrac{\\angle D}{2}=90^\\circ$, поэтому в треугольнике $AKD$ $\\angle AKD=180^\\circ-90^\\circ=90^\\circ$.`,
        ],
      },
      {
        title: mn ? 'б) Равнобедренные треугольники' : 'б) Площадь',
        risunok: chertezh(p, 'b'),
        lines: bLines.slice(0, 2),
      },
      { title: 'б) Ответ', lines: bLines.slice(2) },
    ],
    razbor: [
      {
        slovo: 'а) Соседние углы параллелограмма в сумме $180^\\circ$',
        formula: '\\angle KAD+\\angle KDA=90^\\circ',
      },
      {
        slovo: mn
          ? 'б) Биссектриса отсекает равнобедренный треугольник'
          : 'б) Катеты через половину угла',
        formula: mn ? `BM=CN=${p.c}` : 'S=\\frac{AD^2\\sin A}{4}',
      },
      {
        slovo: mn ? 'б) $MN=|2AB-AD|$' : 'б) Синус угла',
        formula: mn ? `|${2 * p.c}-${p.b}|` : `\\sin A=${ratTex(rat(p.s1, p.c2))}`,
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: mn ? ch.MN : toNumber(ch.S) },
  };
}

export const M18_BISSEKTRISY: Shablon2<PM18> = {
  no: 18,
  prototip:
    'Биссектрисы соседних углов параллелограмма: прямой угол между ними, отрезок на стороне или площадь треугольника',
  sobrat,
};
