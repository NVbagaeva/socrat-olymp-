/**
 * №15 (варианты 21–22): сечение треугольной пирамиды SABC плоскостью
 * через точки K ∈ SA, L ∈ SB, M ∈ BC.
 *
 * SK : KA = m1 : n1, SL : LB = m2 : n2, BM : MC = m3 : n3, KL ∦ AB.
 * а) Прямые KL, AB и MN (N — точка пересечения плоскости KLM с AC)
 *    проходят через одну точку T: T = KL ∩ AB лежит и в плоскости KLM,
 *    и в плоскости ABC, то есть на их общей прямой MN.
 * б) Менелай в SAB: AT/TB = (n1·m2)/(m1·n2); в ABC: AN/NC = AT/TB·BM/MC.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL15 {
  m1: number;
  n1: number;
  m2: number;
  n2: number;
  m3: number;
  n3: number;
}

export function chislaL15(p: PL15) {
  const ro = rat(p.n1 * p.m2, p.m1 * p.n2);
  if (ro.n === ro.d) throw new Error('l15: KL ∥ AB');
  const sg = mul(ro, rat(p.m3, p.n3));
  return { ro, sg };
}

function scenariy(p: PL15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaL15(p);
  const r = toNumber(c.ro);
  const s = toNumber(c.sg);
  /* T на прямой AB: AT/TB = r, точка вне отрезка. */
  const tT = r > 1 ? r / (r - 1) : -r / (1 - r);
  const sc: Scenariy = {
    id: `PV-L15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Треугольная пирамида, точки на рёбрах SA, SB, BC и прямая KL до пересечения с прямой AB'
        : 'Треугольная пирамида, четырёхугольник сечения KLMN',
    telo: { vid: 'piramida', n: 3, a: 6, h: 6 },
    imena: ['A', 'B', 'C', 'S'],
    tochki: [
      { imya: 'K', gde: { naOtrezke: ['S', 'A', p.m1 / (p.m1 + p.n1)] }, rol: 'uslovie' },
      { imya: 'L', gde: { naOtrezke: ['S', 'B', p.m2 / (p.m2 + p.n2)] }, rol: 'uslovie' },
      { imya: 'M', gde: { naOtrezke: ['B', 'C', p.m3 / (p.m3 + p.n3)] }, rol: 'uslovie' },
      { imya: 'N', gde: { naOtrezke: ['A', 'C', s / (1 + s)] } },
      ...(punkt === 'a' ? [{ imya: 'T', gde: { naOtrezke: ['A', 'B', tT] } as const }] : []),
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'kt', vid: 'otrezok', tochki: ['K', 'T'] },
            { id: 'at', vid: 'otrezok', tochki: ['A', 'T'] },
            { id: 'tn', vid: 'otrezok', tochki: ['T', 'N'] },
          ]
        : [{ id: 'sech', vid: 'mnogougolnik', tochki: ['K', 'L', 'M', 'N'], rol: 'uslovie' }],
  };
  if (punkt === 'b') {
    const s0 = scenariy(p, 'a');
    return { ...sc, rakurs: s0.rakurs, szhatie: s0.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyL15(p: PL15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PL15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PL15): Chast2Zadacha {
  const c = chislaL15(p);
  const roT = ratTex(c.ro);
  const otvT = ratTex(c.sg);
  const blizhe = toNumber(c.ro) > 1 ? 'B' : 'A';
  const uslovie =
    `В треугольной пирамиде $SABC$ на рёбрах $SA$, $SB$ и $BC$ отмечены точки $K$, $L$ и $M$ соответственно так, что $SK:KA=${p.m1}:${p.n1}$, $SL:LB=${p.m2}:${p.n2}$, $BM:MC=${p.m3}:${p.n3}$. Плоскость $KLM$ пересекает ребро $AC$ в точке $N$.\n` +
    `а) Докажите, что прямые $KL$, $MN$ и $AB$ проходят через одну точку.\n` +
    `б) Найдите отношение $AN:NC$.`;
  return {
    no: 15,
    shablon: 'l15.menelay',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: '$AN:NC$',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Точка пересечения $KL$ и $AB$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Прямые $KL$ и $AB$ лежат в плоскости $SAB$. Они не параллельны: $\\dfrac{SK}{KA}=\\dfrac{${p.m1}}{${p.n1}}\\ne\\dfrac{${p.m2}}{${p.n2}}=\\dfrac{SL}{LB}$ (иначе по {{t:podobie-uu|подобию}} треугольников $SKL$ и $SAB$ было бы $KL\\parallel AB$). Пусть $T$ — точка их пересечения.`,
          `Точка $T$ лежит на прямой $KL$, значит, в плоскости $KLM$, и на прямой $AB$, значит, в плоскости $ABC$. Плоскости $KLM$ и $ABC$ пересекаются по прямой $MN$ (точки $M$ и $N$ — общие). Поэтому $T\\in MN$: три прямые проходят через $T$.`,
        ],
      },
      {
        title: 'б) Отношение $AT:TB$',
        lines: [
          `По {{t:teorema-menelaya|теореме Менелая}} для треугольника $SAB$ и прямой $KLT$: $\\dfrac{SK}{KA}\\cdot\\dfrac{AT}{TB}\\cdot\\dfrac{BL}{LS}=1$, откуда $\\dfrac{AT}{TB}=\\dfrac{${p.n1}}{${p.m1}}\\cdot\\dfrac{${p.m2}}{${p.n2}}=${roT}$; точка $T$ лежит на продолжении $AB$ за точкой $${blizhe}$. Сама теорема Менелая доказывается через {{t:podobie-uu|подобие треугольников}} с прямой, параллельной $AB$.`,
        ],
      },
      {
        title: 'б) Отношение $AN:NC$',
        risunok: chertezh(p, 'b'),
        lines: [
          `По {{t:teorema-menelaya|теореме Менелая}} для треугольника $ABC$ и прямой $TMN$: $\\dfrac{AT}{TB}\\cdot\\dfrac{BM}{MC}\\cdot\\dfrac{CN}{NA}=1$.`,
          `$\\dfrac{AN}{NC}=\\dfrac{AT}{TB}\\cdot\\dfrac{BM}{MC}=${roT}\\cdot\\dfrac{${p.m3}}{${p.n3}}=${otvT}$. Прямая $TM$ входит в треугольник $ABC$ через внутреннюю точку $M$ стороны $BC$ и пересекает продолжение $AB$, поэтому выходит через сторону $AC$: точка $N$ лежит на ребре.`,
          `Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) $T=KL\\cap AB$ — общая точка плоскостей $KLM$ и $ABC$', formula: 'T\\in MN' },
      { slovo: 'б) Менелай в грани $SAB$', formula: `\\frac{AT}{TB}=${roT}` },
      {
        slovo: 'б) Менелай в основании $ABC$',
        formula: `\\frac{AN}{NC}=\\frac{AT}{TB}\\cdot\\frac{BM}{MC}`,
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: toNumber(c.sg), ro: toNumber(c.ro) },
  };
}

export const L15_MENELAY: Shablon2<PL15> = {
  no: 15,
  prototip:
    'Сечение треугольной пирамиды через точки на трёх рёбрах: три прямые через одну точку, отношение по теореме Менелая',
  sobrat,
};
