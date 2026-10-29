/**
 * №18 (варианты 17–18): окружность (O; R) вписана в угол B, равный β
 * (60°, 90° или 120°), A и C — точки касания, AE и CD — диаметры;
 * прямые BD и BE вторично пересекают окружность в N и P.
 *
 * s = sin(β/2), c = cos(β/2): BA = Rc/s, BO = R/s, DE = AC = 2Rc,
 * ∠BOD = 90° + β/2 ⇒ BD² = BO² + R² + 2R² = R²(1/s² + 3).
 * Степень точки: BN·BD = BA², k = BN/BD = c²/(1 + 3s²).
 * BD = BE (симметрия) ⇒ PN ∥ DE, PN = k·DE;
 * S(DEPN) = S(BDE)(1 − k²), S(BDE) = ½·DE·(BO + Rs).
 * а) β = 60°: AB = DE; β = 120°: AD = 3BC; β = 90°: ACED — квадрат.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PJ18 {
  beta: 60 | 90 | 120;
  /** R² (R = √R2). */
  R2: number;
  nado: 'S' | 'PN' | 'BN' | 'DN';
}

const SC: Record<PJ18['beta'], { s2: Rat; c2: Rat; sT: string; cT: string }> = {
  60: { s2: rat(1, 4), c2: rat(3, 4), sT: '\\frac12', cT: '\\frac{\\sqrt3}{2}' },
  90: { s2: rat(1, 2), c2: rat(1, 2), sT: '\\frac{\\sqrt2}{2}', cT: '\\frac{\\sqrt2}{2}' },
  120: { s2: rat(3, 4), c2: rat(1, 4), sT: '\\frac{\\sqrt3}{2}', cT: '\\frac12' },
};

export function chislaJ18(p: PJ18) {
  const { s2, c2 } = SC[p.beta];
  const R2 = rat(p.R2);
  const BA2 = div(mul(R2, c2), s2);
  const BO2 = div(R2, s2);
  const BD2 = mul(R2, add(div(rat(1), s2), rat(3)));
  const k = div(c2, add(rat(1), mul(rat(3), s2)));
  const DE2 = mul(rat(4), mul(R2, c2));
  const BN2 = mul(BD2, mul(k, k));
  const DN2 = mul(BD2, mul(sub(rat(1), k), sub(rat(1), k)));
  const PN2 = mul(DE2, mul(k, k));
  /* S(BDE)² = R⁴c²(1 + s²)²/s². */
  const SBDE2 = div(mul(mul(R2, R2), mul(c2, mul(add(rat(1), s2), add(rat(1), s2)))), s2);
  const om = sub(rat(1), mul(k, k));
  const S2 = mul(SBDE2, mul(om, om));
  return { s2, c2, R2, BA2, BO2, BD2, k, DE2, BN2, DN2, PN2, SBDE2, S2 };
}

function chertezh(p: PJ18, punkt: 'a' | 'b'): string {
  const R = 2;
  const b = (p.beta * Math.PI) / 180;
  const s = Math.sin(b / 2);
  const c = Math.cos(b / 2);
  const BO = R / s;
  const B: [number, number] = [0, -BO];
  const A: [number, number] = [-R * c, -R * s];
  const C: [number, number] = [R * c, -R * s];
  const D: [number, number] = [-C[0], -C[1]];
  const E: [number, number] = [-A[0], -A[1]];
  const vtoraya = (Q: [number, number]): [number, number] => {
    const d = [Q[0] - B[0], Q[1] - B[1]];
    const a = d[0]! ** 2 + d[1]! ** 2;
    const bb = 2 * (B[0] * d[0]! + B[1] * d[1]!);
    const cc = B[0] ** 2 + B[1] ** 2 - R * R;
    const t = (-bb - Math.sqrt(bb * bb - 4 * a * cc)) / (2 * a);
    return [B[0] + t * d[0]!, B[1] + t * d[1]!];
  };
  const N = vtoraya(D);
  const P = vtoraya(E);
  const el: Element[] = [
    { tip: 'otrezok', a: 'B', b: 'A' },
    { tip: 'otrezok', a: 'B', b: 'C' },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'A', b: 'E' },
    { tip: 'otrezok', a: 'C', b: 'D' },
    { tip: 'tochka', t: 'O' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'O', b: 'A', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'B', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'E', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'A', b: 'C', stil: 'punktir', sloy: 'reshenie' });
  } else {
    el.push({ tip: 'otrezok', a: 'B', b: 'D' });
    el.push({ tip: 'otrezok', a: 'B', b: 'E' });
    el.push({ tip: 'mnogougolnik', tochki: ['D', 'E', 'P', 'N'], sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'N' });
    el.push({ tip: 'tochka', t: 'P' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, E, N, P, O: [0, 0] },
      okruzhnosti: { w: { centr: 'O', radius: R } },
      elementy: el,
      podpisi:
        punkt === 'a' ? ['A', 'B', 'C', 'D', 'E', 'O'] : ['A', 'B', 'C', 'D', 'E', 'O', 'N', 'P'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 240,
      alt: 'Окружность, вписанная в угол B, диаметры AE и CD',
    },
  );
}

const DOK: Record<PJ18['beta'], string> = {
  60: '$AB=DE$',
  90: 'четырёхугольник $ACED$ — квадрат',
  120: '$AD=3BC$',
};

const NADO: Record<PJ18['nado'], string> = {
  S: 'площадь четырёхугольника $DEPN$',
  PN: 'длину отрезка $PN$',
  BN: 'длину отрезка $BN$',
  DN: 'длину отрезка $DN$',
};

function sobrat(p: PJ18): Chast2Zadacha {
  const ch = chislaJ18(p);
  const { sT, cT } = SC[p.beta];
  const RT = surdTex(sqrtRat(ch.R2));
  const otvS = sqrtRat(
    p.nado === 'S' ? ch.S2 : p.nado === 'PN' ? ch.PN2 : p.nado === 'BN' ? ch.BN2 : ch.DN2,
  );
  const otvT = surdTex(otvS);
  const uslovie =
    `Окружность с центром в точке $O$ радиуса $R$ вписана в угол с вершиной в точке $B$, равный $${p.beta}^\\circ$. Точки $A$ и $C$ — точки касания угла и окружности, а $AE$ и $CD$ — диаметры окружности.\n` +
    `а) Докажите, что ${DOK[p.beta]}.\n` +
    `б) Прямые $BD$ и $BE$ вторично пересекают окружность в точках $N$ и $P$ соответственно. Найдите ${NADO[p.nado]}, если $R=${RT}$.`;
  const half = p.beta / 2;
  const aLines: Record<PJ18['beta'], string[]> = {
    60: [
      `{{t:centr-v-ugle|Центр окружности, вписанной в угол, лежит на биссектрисе}}: $\\angle ABO=30^\\circ$, $OA\\perp AB$ ({{t:kasatelnaya-radius|касательная перпендикулярна радиусу}}), $AB=R\\,\\mathrm{ctg}\\,30^\\circ=R\\sqrt3$.`,
      `$AE$ и $CD$ — диаметры, поэтому $ACED$ — прямоугольник (диагонали равны и делятся пополам), $DE=AC$. $\\angle AOC=180^\\circ-60^\\circ=120^\\circ$, и в равнобедренном треугольнике $AOC$: $AC=2R\\sin60^\\circ=R\\sqrt3$. Значит, $AB=DE$.`,
    ],
    90: [
      `{{t:kasatelnaya-radius|Радиусы в точки касания перпендикулярны касательным}}: $\\angle OAB=\\angle OCB=90^\\circ$, $\\angle B=90^\\circ$, поэтому $\\angle AOC=90^\\circ$.`,
      `$AE$ и $CD$ — диаметры: $ACED$ — прямоугольник (диагонали равны и делятся пополам), а его диагонали перпендикулярны ($\\angle AOC=90^\\circ$). Прямоугольник с перпендикулярными диагоналями — квадрат.`,
    ],
    120: [
      `{{t:centr-v-ugle|Центр окружности, вписанной в угол, лежит на биссектрисе}}: $\\angle CBO=60^\\circ$, $OC\\perp BC$ ({{t:kasatelnaya-radius|касательная перпендикулярна радиусу}}), $BC=R\\,\\mathrm{ctg}\\,60^\\circ=\\dfrac{R}{\\sqrt3}$.`,
      `$D$ диаметрально противоположна $C$: $AD=\\sqrt{(2R)^2-AC^2}$ (угол $CAD$ опирается на диаметр). $\\angle AOC=180^\\circ-120^\\circ=60^\\circ$, $AC=R$, $AD=R\\sqrt3=3\\cdot\\dfrac{R}{\\sqrt3}=3BC$.`,
    ],
  };
  const otvLine: Record<PJ18['nado'], string> = {
    S: `{{t:ploshchadi-obshchiy-ugol|Площади треугольников с общим углом}}: $S_{BNP}=k^2S_{BDE}$, поэтому $S_{DEPN}=(1-k^2)S_{BDE}$. Высота треугольника $BDE$ из $B$ равна $BO+R\\sin${half}^\\circ$, $S_{BDE}^2=${ratTex(ch.SBDE2)}$, $S_{DEPN}=${otvT}$.`,
    PN: `$PN=k\\cdot DE$, $PN^2=${ratTex(ch.PN2)}$, $PN=${otvT}$.`,
    BN: `$BN=k\\cdot BD$, $BN^2=${ratTex(ch.BN2)}$, $BN=${otvT}$.`,
    DN: `$DN=BD-BN=(1-k)BD$, $DN^2=${ratTex(ch.DN2)}$, $DN=${otvT}$.`,
  };
  return {
    no: 18,
    shablon: 'j18.okrVUgle',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'S' ? 'Площадь' : 'Длина',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      { title: 'а) Доказательство', risunok: chertezh(p, 'a'), lines: aLines[p.beta] },
      {
        title: 'б) Длины',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $s=\\sin${half}^\\circ=${sT}$, $c=\\cos${half}^\\circ=${cT}$. {{t:kasatelnye-otrezki|Отрезки касательных}} $BA=BC=\\dfrac{Rc}{s}$, $BO=\\dfrac{R}{s}$, $DE=AC=2Rc$.`,
          `$\\angle BOD=180^\\circ-\\angle BOC=90^\\circ+${half}^\\circ$, по {{t:teorema-kosinusov|теореме косинусов}} $BD^2=BO^2+R^2+2\\cdot BO\\cdot R\\cdot s=\\dfrac{R^2}{s^2}+3R^2=${ratTex(ch.BD2)}$.`,
          `По {{t:kasatelnaya-sekushchaya|теореме о касательной и секущей}} $BN\\cdot BD=BA^2$, $k=\\dfrac{BN}{BD}=\\dfrac{BA^2}{BD^2}=${ratTex(ch.k)}$.`,
        ],
      },
      {
        title: 'б) Ответ',
        lines: [
          `Точки $D$ и $E$ симметричны относительно прямой $BO$, поэтому $BD=BE$, $BN=BP$, и треугольники $BNP$ и $BDE$ {{t:podobie-uu|подобны}} с коэффициентом $k$: $PN\\parallel DE$, $PN=k\\cdot DE$.`,
          otvLine[p.nado],
          `Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Отрезки касательных и хорда $AC$',
        formula: p.beta === 60 ? 'AB=DE=R\\sqrt3' : p.beta === 120 ? 'AD=3BC' : 'ACED',
      },
      { slovo: 'б) Теорема косинусов для $BD$', formula: `BD^2=${ratTex(ch.BD2)}` },
      { slovo: 'б) Степень точки', formula: `k=${ratTex(ch.k)}` },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: surdToNumber(otvS), k: toNumber(ch.k) },
  };
}

export const J18_OKR_V_UGLE: Shablon2<PJ18> = {
  no: 18,
  prototip: 'Окружность, вписанная в угол, и два диаметра: секущие из вершины угла, степень точки',
  sobrat,
};
