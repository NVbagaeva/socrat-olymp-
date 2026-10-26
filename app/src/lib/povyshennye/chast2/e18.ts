/**
 * №18 (варианты 9–10): остроугольный равнобедренный треугольник ABC с
 * основанием AC, высоты AN и CK пересекаются в H, P = BH ∩ KN, O — центр
 * окружности KBN.
 *
 * ∠BKH = ∠BNH = 90°, поэтому O — середина BH (медианы прямоугольных
 * треугольников BKH и BNH к общей гипотенузе), R = BH/2. BK = BN, KN ∥ AC,
 * KP ⊥ BH; ∠KOP — внешний угол равнобедренного треугольника BOK, он
 * равен ∠B, как и ∠AHK (∠CHN). а) Подобие по двум углам.
 * б) M — середина AC, BM = m, AM = a: HM = a²/m, R = (m² − a²)/(2m),
 * KN = AC·cos B = 2a(m² − a²)/(a² + m²).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PE18 {
  /** Половина основания AM. */
  a: number;
  /** Высота BM; a < m, a² + m² — точный квадрат. */
  m: number;
  /** Какой треугольник подобен KPO в пункте а. */
  tr: 'AKH' | 'CNH';
  /** Что найти в пункте б. */
  nado: 'R' | 'KN';
}

export function chislaE18(p: PE18) {
  const c = Math.round(Math.sqrt(p.a * p.a + p.m * p.m));
  if (c * c !== p.a * p.a + p.m * p.m || p.a >= p.m) throw new Error('e18: параметры');
  const a2 = rat(p.a * p.a);
  const HM = div(a2, rat(p.m));
  const BH = sub(rat(p.m), HM);
  const R = div(BH, rat(2));
  const cosB = rat(p.m * p.m - p.a * p.a, c * c);
  const BK = mul(rat(c), cosB);
  const KN = mul(rat(2 * p.a), cosB);
  return { c, HM, BH, R, cosB, BK, KN };
}

const fr = (r: Rat) => (r.d === 1n ? `${r.n}` : ratTex(r));

function chertezh(p: PE18, punkt: 'a' | 'b'): string {
  const c = chislaE18(p);
  const a = p.a;
  const m = p.m;
  const hy = (a * a) / m;
  /* K — основание перпендикуляра из C на AB. */
  const ab: [number, number] = [a / c.c, m / c.c];
  const t = 2 * a * ab[0];
  const K: [number, number] = [-a + t * ab[0], t * ab[1]];
  const N: [number, number] = [-K[0], K[1]];
  const oy = (m + hy) / 2;
  const R = (m - hy) / 2;
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'otrezok', a: 'A', b: 'N' },
    { tip: 'otrezok', a: 'C', b: 'K' },
    { tip: 'ugol', a: 'A', v: 'N', b: 'C', pryamoy: true },
    { tip: 'ugol', a: 'C', v: 'K', b: 'A', pryamoy: true },
    { tip: 'otrezok', a: 'B', b: 'H' },
    { tip: 'otrezok', a: 'K', b: 'N' },
    { tip: 'okruzhnost', okr: 'w', sloy: 'reshenie' },
    { tip: 'tochka', t: 'H' },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'P' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'K', b: 'O', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'oblast', tochki: ['K', 'P', 'O'], sloy: 'reshenie' });
    el.push({
      tip: 'oblast',
      tochki: p.tr === 'AKH' ? ['A', 'K', 'H'] : ['C', 'N', 'H'],
      sloy: 'reshenie',
    });
  } else {
    el.push({ tip: 'otrezok', a: 'B', b: 'M', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'B', v: 'M', b: 'C', pryamoy: true, sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: {
        A: [-a, 0],
        C: [a, 0],
        B: [0, m],
        H: [0, hy],
        K,
        N,
        P: [0, K[1]],
        O: [0, oy],
        M: [0, 0],
      },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: el,
      podpisi:
        punkt === 'a'
          ? ['A', 'B', 'C', 'K', 'N', 'H', 'P', 'O']
          : ['A', 'B', 'C', 'K', 'N', 'H', 'P', 'O', 'M'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 260,
      vysota: 260,
      alt: 'Равнобедренный треугольник ABC, высоты AN и CK, окружность с диаметром BH',
    },
  );
}

function sobrat(p: PE18): Chast2Zadacha {
  const c = chislaE18(p);
  const AC = 2 * p.a;
  const AKH = p.tr === 'AKH';
  const [X, Y] = AKH ? ['A', 'K'] : ['C', 'N'];
  const uslovie =
    `Высоты $AN$ и $CK$ остроугольного равнобедренного треугольника $ABC$ с основанием $AC$ пересекаются в точке $H$, отрезки $BH$ и $KN$ — в точке $P$. Точка $O$ — центр окружности, описанной около треугольника $KBN$.\n` +
    `а) Докажите, что треугольники $${p.tr}$ и $KPO$ подобны.\n` +
    `б) Найдите ${p.nado === 'R' ? 'радиус окружности, описанной около треугольника $KBN$' : 'длину отрезка $KN$'}, если $AB=${c.c}$, $AC=${AC}$.`;
  const otv = p.nado === 'R' ? c.R : c.KN;
  const oT = tochnoTex(otv);
  const otvF = fr(otv);
  const bLines =
    p.nado === 'R'
      ? [
          `$R=\\dfrac{BH}{2}=\\dfrac{${fr(c.BH)}}{2}=${otvF}$${otvF !== oT ? `$=${oT}$` : ''}.`.replace(
            '$$',
            '',
          ),
        ]
      : [
          `$\\cos\\angle B=\\cos\\angle KBN$: в прямоугольном треугольнике $ABN$ $BN=AB\\cos\\angle B$. Из треугольника $ABM$: $\\sin\\dfrac{\\angle B}{2}=\\dfrac{AM}{AB}=\\dfrac{${p.a}}{${c.c}}$, $\\cos\\angle B=1-2\\sin^2\\dfrac{\\angle B}{2}=${fr(c.cosB)}$.`,
          `$BK=BN=${c.c}\\cdot${fr(c.cosB)}=${fr(c.BK)}$. Так как $KN\\parallel AC$, треугольники $KBN$ и $ABC$ подобны с коэффициентом $\\dfrac{BK}{BA}=${fr(c.cosB)}$: $KN=${AC}\\cdot${fr(c.cosB)}=${otvF}$${otvF !== oT ? `$=${oT}$` : ''}.`.replace(
            '$$',
            '',
          ),
        ];
  return {
    no: 18,
    shablon: 'e18.vysotyRavnobedr',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'R' ? 'Радиус' : 'Длина $KN$',
        pole: { vid: 'chislo', verno: otv.d === 1n ? String(otv.n) : `${otv.n}/${otv.d}` },
      },
    ],
    otvet: `б) $${otvF}$`,
    reshenie: [
      {
        title: 'а) Где центр окружности',
        risunok: chertezh(p, 'a'),
        lines: [
          'Углы $BKH$ и $BNH$ прямые ($CK$ и $AN$ — высоты). Пусть $O$ — середина $BH$; по {{t:mediana-gipotenuza|свойству медианы прямоугольного треугольника}} $OK=OB=OH=ON=\\dfrac{BH}{2}$.',
          'Значит, $O$ — центр окружности, описанной около треугольника $KBN$, а $BH$ — её диаметр.',
        ],
      },
      {
        title: 'а) Прямой угол при $P$',
        lines: [
          'Высоты треугольника пересекаются в одной точке, поэтому $BH$ — высота к основанию, а по {{t:ravnobedr-vysota|свойству высоты равнобедренного треугольника}} — и биссектриса угла $B$.',
          'Прямоугольные треугольники $ABN$ и $CBK$ равны по гипотенузе $AB=CB$ и общему острому углу $B$, поэтому $BK=BN$. В равнобедренном треугольнике $KBN$ биссектриса $BP$ является высотой: $KP\\perp BO$, $\\angle KPO=90^\\circ$.',
        ],
      },
      {
        title: 'а) Равные острые углы',
        lines: [
          `Треугольник $BOK$ равнобедренный ($OB=OK$), $\\angle OKB=\\angle OBK=\\dfrac{\\angle B}{2}$. Угол $KOP$ — {{t:vneshniy-ugol|внешний угол}} треугольника $BOK$: $\\angle KOP=\\dfrac{\\angle B}{2}+\\dfrac{\\angle B}{2}=\\angle B$.`,
          AKH
            ? 'В прямоугольном треугольнике $ABN$ $\\angle BAN=90^\\circ-\\angle B$, тогда в прямоугольном треугольнике $AKH$ ($\\angle AKH=90^\\circ$) $\\angle AHK=90^\\circ-\\angle KAH=\\angle B$.'
            : 'В прямоугольном треугольнике $CBK$ $\\angle BCK=90^\\circ-\\angle B$, тогда в прямоугольном треугольнике $CNH$ ($\\angle CNH=90^\\circ$) $\\angle CHN=90^\\circ-\\angle NCH=\\angle B$.',
          `Прямоугольные треугольники $${p.tr}$ и $KPO$ имеют равные острые углы $\\angle ${X}H${Y}=\\angle KOP$, значит, они {{t:podobie-uu|подобны по двум углам}}.`,
        ],
      },
      {
        title: 'б) Высота и ортоцентр',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $M$ — середина $AC$; $BM$ — высота, $AM=${p.a}$, по {{t:pifagor|теореме Пифагора}} $BM=\\sqrt{${c.c}^2-${p.a}^2}=${p.m}$.`,
          `Точка $H$ лежит на $BM$. $\\angle HAM=90^\\circ-\\angle C=\\angle MBC=\\angle ABM$, поэтому прямоугольные треугольники $AMH$ и $BMA$ подобны: $\\dfrac{HM}{AM}=\\dfrac{AM}{BM}$, $HM=\\dfrac{${p.a}^2}{${p.m}}=${fr(c.HM)}$.`,
          `$BH=BM-HM=${p.m}-${fr(c.HM)}=${fr(c.BH)}$.`,
        ],
      },
      { title: p.nado === 'R' ? 'б) Радиус' : 'б) Отрезок $KN$', lines: bLines },
    ],
    razbor: [
      { slovo: 'а) $O$ — середина $BH$: медианы к общей гипотенузе', formula: 'OK=OB=OH=ON' },
      {
        slovo: 'а) $KP\\perp BH$, внешний угол $\\angle KOP=\\angle B$',
        formula: `\\angle ${X}H${Y}=\\angle KOP=\\angle B`,
      },
      { slovo: 'б) Высота и отрезок $HM$', formula: `BH=${fr(c.BH)}` },
      { slovo: p.nado === 'R' ? 'б) Радиус — половина $BH$' : 'б) $KN=AC\\cos B$', formula: otvF },
    ],
    kontrol: { R: toNumber(c.R), KN: toNumber(c.KN), BH: toNumber(c.BH) },
  };
}

export const E18_VYSOTY_RAVNOBEDR: Shablon2<PE18> = {
  no: 18,
  prototip: 'Высоты равнобедренного треугольника: окружность с диаметром BH, подобие, радиус',
  sobrat,
};
