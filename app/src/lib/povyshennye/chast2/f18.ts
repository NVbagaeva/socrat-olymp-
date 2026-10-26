/**
 * №18 (варианты 11–12): прямоугольная трапеция ABCD (прямые углы A и D,
 * большее основание CD) описана около окружности (O; R), G — касание с
 * AB, биссектриса угла ADC перпендикулярна BC и пересекает её в N.
 *
 * O лежит на биссектрисе DN, ON ⊥ BC — N точка касания. ∠C = 45°,
 * высота BH = 2R = HC, BC = 2R√2. Отрезки касательных: BG = BN = x,
 * CN = 2R + x ⇒ 2x + 2R = 2R√2, x = R(√2 − 1).
 * б) Дельтоид BNOG: S = Rx, p = R√2, r = S/p = R(2 − √2)/2,
 *    описанная окружность с диаметром OB: R√(4 − 2√2)/2, периметр 2R√2.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PF18 {
  /** Радиус окружности (чётный — ответы без дробей). */
  R: number;
  /** а) какой отрезок равен (√2 − 1)R. */
  dok: 'BN' | 'BG';
  /** б) что найти для четырёхугольника BNOG. */
  nado: 'r' | 'Ro' | 'S' | 'P';
  /** Что дано в пункте б: радиус R или высота AD = 2R. */
  dano: 'R' | 'AD';
}

const koef = (k: number, t: string) => (k === 1 ? t : `${k}${t}`);

export function otvetF18(p: PF18): { tex: string; v: number } {
  const R = p.R;
  const s2 = Math.SQRT2;
  switch (p.nado) {
    case 'r':
      return { tex: `${R}-${koef(R / 2, '\\sqrt{2}')}`, v: (R * (2 - s2)) / 2 };
    case 'Ro':
      return { tex: koef(R / 2, '\\sqrt{4-2\\sqrt{2}}'), v: (R * Math.sqrt(4 - 2 * s2)) / 2 };
    case 'S':
      return { tex: `${koef(R * R, '\\sqrt{2}')}-${R * R}`, v: R * R * (s2 - 1) };
    case 'P':
      return { tex: koef(2 * R, '\\sqrt{2}'), v: 2 * R * s2 };
  }
}

function chertezh(punkt: 'a' | 'b'): string {
  const R = 2;
  const s2 = Math.SQRT2;
  const b = R * s2;
  const c = b + 2 * R;
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'ugol', a: 'B', v: 'A', b: 'D', pryamoy: true },
    { tip: 'ugol', a: 'A', v: 'D', b: 'C', pryamoy: true },
    { tip: 'otrezok', a: 'D', b: 'N' },
    { tip: 'ugol', a: 'D', v: 'N', b: 'C', pryamoy: true },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'G' },
    { tip: 'tochka', t: 'N' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'B', b: 'H', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'G', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'K', sloy: 'reshenie' });
  } else {
    el.push({ tip: 'oblast', tochki: ['B', 'N', 'O', 'G'], sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'G', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'B', stil: 'punktir', sloy: 'reshenie' });
  }
  const N: [number, number] = [R + R / s2, R + R / s2];
  return renderPlan(
    {
      tochki: {
        D: [0, 0],
        C: [c, 0],
        B: [b, 2 * R],
        A: [0, 2 * R],
        O: [R, R],
        G: [R, 2 * R],
        N,
        H: [b, 0],
        K: [R, 0],
      },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: el,
      podpisi:
        punkt === 'a'
          ? ['A', 'B', 'C', 'D', 'O', 'G', 'N', 'H', 'K']
          : ['A', 'B', 'C', 'D', 'O', 'G', 'N'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 200,
      alt: 'Прямоугольная трапеция ABCD с вписанной окружностью, биссектриса угла D перпендикулярна BC',
    },
  );
}

const NADO: Record<PF18['nado'], string> = {
  r: 'радиус окружности, вписанной в четырёхугольник $BNOG$',
  Ro: 'радиус окружности, описанной около четырёхугольника $BNOG$',
  S: 'площадь четырёхугольника $BNOG$',
  P: 'периметр четырёхугольника $BNOG$',
};

function sobrat(p: PF18): Chast2Zadacha {
  if (p.R % 2 !== 0) throw new Error('f18: R нечётный');
  const R = p.R;
  const otv = otvetF18(p);
  const x = `${R}(\\sqrt{2}-1)`;
  const xT = `${koef(R, '\\sqrt{2}')}-${R}`;
  const uslovie =
    `В прямоугольную трапецию $ABCD$ с прямыми углами при вершинах $A$ и $D$ и большим основанием $CD$ вписана окружность с центром $O$ радиуса $R$; $G$ — точка касания окружности со стороной $AB$. Биссектриса угла $ADC$ перпендикулярна стороне $BC$ и пересекает её в точке $N$.\n` +
    `а) Докажите, что $${p.dok}=(\\sqrt{2}-1)R$.\n` +
    `б) Найдите ${NADO[p.nado]}, если ${p.dano === 'R' ? `$R=${R}$` : `$AD=${2 * R}$`}.`;
  const bLines: string[] = [
    `${p.dano === 'AD' ? `Высота трапеции равна диаметру: $R=\\dfrac{AD}{2}=${R}$. ` : ''}В четырёхугольнике $BNOG$: $OG=ON=R=${R}$, $BG=BN=${x}$, углы $G$ и $N$ прямые.`,
  ];
  switch (p.nado) {
    case 'r':
      bLines.push(
        `$BG+ON=BN+OG$, поэтому в $BNOG$ {{t:opisannyy-chetyrehugolnik|можно вписать окружность}}. Площадь: $S=2\\cdot\\dfrac12\\cdot OG\\cdot BG=${R}\\cdot${x}=${R * R}(\\sqrt2-1)$, полупериметр $p=R+BG=${R}\\sqrt2$.`,
        `Для описанного многоугольника $S=pr$: $r=\\dfrac{S}{p}=\\dfrac{${R * R}(\\sqrt2-1)}{${R}\\sqrt2}=\\dfrac{${R}(2-\\sqrt2)}{2}=${otv.tex}$.`,
      );
      break;
    case 'Ro':
      bLines.push(
        `Углы $G$ и $N$ прямые, поэтому точки $G$ и $N$ лежат на окружности с диаметром $OB$: середина $OB$ удалена от них на $\\dfrac{OB}{2}$ ({{t:mediana-gipotenuza|медиана к гипотенузе}}).`,
        `По {{t:pifagor|теореме Пифагора}} $OB^2=OG^2+BG^2=${R * R}+${R * R}(\\sqrt2-1)^2=${R * R}(4-2\\sqrt2)$, радиус $\\dfrac{OB}{2}=${otv.tex}$.`,
      );
      break;
    case 'S':
      bLines.push(
        `Диагональ $OB$ делит $BNOG$ на два равных прямоугольных треугольника: $S=2\\cdot\\dfrac12\\cdot OG\\cdot BG=${R}\\cdot${x}=${otv.tex}$.`,
      );
      break;
    case 'P':
      bLines.push(`$P=2(OG+BG)=2\\left(${R}+${xT}\\right)=${otv.tex}$.`);
      break;
  }
  return {
    no: 18,
    shablon: 'f18.trapeciyaOkr',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'chislo', verno: otv.tex } },
    ],
    otvet: `б) $${otv.tex}$`,
    reshenie: [
      {
        title: 'а) Точка $N$ — точка касания',
        risunok: chertezh('a'),
        lines: [
          'Центр вписанной окружности {{t:centr-v-ugle|лежит на биссектрисе}} угла $ADC$, то есть на прямой $DN$. Значит, $ON\\perp BC$, и $N$ — основание перпендикуляра из центра на касательную $BC$, то есть {{t:kasatelnaya-radius|точка касания}}.',
          'Угол $ODC$ равен $45^\\circ$, треугольник $DNC$ прямоугольный, поэтому $\\angle C=45^\\circ$.',
        ],
      },
      {
        title: 'а) Отрезки касательных',
        lines: [
          'Пусть $K$ — точка касания с $CD$. Четырёхугольники $AGOM$ и $DKOM$ ($M$ — касание с $AD$) — квадраты со стороной $R$, поэтому $AG=DK=R$, $AD=2R$.',
          `Пусть $BG=x$. {{t:kasatelnye-otrezki|Отрезки касательных}} равны: $BN=BG=x$, $CN=CK$. Проведём высоту $BH$: $BH=2R$, и в прямоугольном треугольнике $BHC$ с углом $45^\\circ$ $HC=2R$, по {{t:pifagor|теореме Пифагора}} $BC=2R\\sqrt2$.`,
          `$CK=CD-DK=(AB+HC)-R=(R+x+2R)-R=2R+x$. Тогда $BC=BN+NC=x+2R+x=2x+2R$.`,
          `Из $2x+2R=2R\\sqrt2$: $x=(\\sqrt2-1)R$, то есть $BG=BN=(\\sqrt2-1)R$.`,
        ],
      },
      { title: 'б) Четырёхугольник $BNOG$', risunok: chertezh('b'), lines: bLines },
    ],
    razbor: [
      { slovo: 'а) $N$ — точка касания, $\\angle C=45^\\circ$', formula: 'BC=2R\\sqrt2' },
      { slovo: 'а) Отрезки касательных', formula: '2x+2R=2R\\sqrt2,\\ x=(\\sqrt2-1)R' },
      { slovo: 'б) Дельтоид $BNOG$', formula: otv.tex },
    ],
    kontrol: { v: otv.v, R },
  };
}

export const F18_TRAPECIYA_OKR: Shablon2<PF18> = {
  no: 18,
  prototip: 'Прямоугольная описанная трапеция: отрезки касательных, дельтоид BNOG',
  sobrat,
};
