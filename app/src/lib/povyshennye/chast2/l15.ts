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

import { vPredelah } from '@/lib/skhemy/vidimye';
import {
  chertezhSvg,
  postroit,
  sVidom,
  metrikiVida,
  vybratObshchiyVid,
  type Scenariy,
} from '@/lib/chertezh3';
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

/**
 * Видимые отношения (lib/skhemy/vidimye.ts): точка, делящая ребро как
 * 1 : 3, жмётся к вершине. Кандидаты: K, L, M — не ближе 0,3 (0,25,
 * 0,35, 0,2) ребра к его концам (отношения — целые до 20), они же со
 * сдвигом K на 1–2 двадцатых ребра, затем настоящие. Годен кандидат, у которого KL не параллельна AB и T по ту
 * же сторону, что в задаче; из годных — с наименьшим числом нарушений
 * правил вида (lib/chertezh3/vid.ts). Чисел на чертеже нет.
 */
function kandidaty(p: PL15): PL15[] {
  const r = (x: PL15) => (x.n1 * x.m2) / (x.m1 * x.n2);
  const out: PL15[] = [];
  for (const g of [0.3, 0.25, 0.35, 0.2]) {
    const k = (m: number, n: number): [number, number] => {
      const t = Math.round(vPredelah(m / (m + n), g, 1 - g) * 20);
      return [t, 20 - t];
    };
    const [m1, n1] = k(p.m1, p.n1);
    const [m2, n2] = k(p.m2, p.n2);
    const [m3, n3] = k(p.m3, p.n3);
    const q = { ...p, m1, n1, m2, n2, m3, n3 };
    if (r(q) !== 1 && r(q) > 1 === r(p) > 1) out.push(q);
  }
  /* Прямая KT может лечь на чужую вершину при любом ракурсе: K сдвигается
     на 1/20 ребра в обе стороны (точка остаётся внутри ребра). */
  const sdvig = [...out]
    .flatMap((q) => [-1, 1, -2, 2].map((d) => ({ ...q, m1: q.m1 + d, n1: q.n1 - d })))
    .filter((q) => q.m1 > 0 && q.n1 > 0 && r(q) !== 1 && r(q) > 1 === r(p) > 1);
  return [...out, ...sdvig, p];
}

const VIDIMYE = new Map<string, PL15>();

function vidimye(p: PL15): PL15 {
  const kl = JSON.stringify(p);
  const est = VIDIMYE.get(kl);
  if (est !== undefined) return est;
  let luchshiy = p;
  let min = Infinity;
  for (const q of kandidaty(p)) {
    const sceny = (['a', 'b'] as const).map((k) => postroit(scenariyPo(q, k)));
    const v = vybratObshchiyVid(sceny);
    const n = sceny.reduce(
      (s, sc) => s + metrikiVida(sc, v.rakurs, v.szhatie).narusheniya.length,
      0,
    );
    if (n < min) {
      min = n;
      luchshiy = q;
    }
    if (n === 0) break;
  }
  VIDIMYE.set(kl, luchshiy);
  return luchshiy;
}

function scenariy(p0: PL15, punkt: 'a' | 'b', bezVida = false): Scenariy {
  const p = bezVida ? p0 : vidimye(p0);
  return scenariyPo(p, punkt, bezVida);
}

/**
 * Сценарий по отношениям p (уже видимым). bezVida — без ракурса; иначе
 * ракурс общий для этапов а) и б).
 */
function scenariyPo(p: PL15, punkt: 'a' | 'b', bezVida = true): Scenariy {
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
  if (bezVida) return sc;
  /* Этапы а) и б) — с одного ракурса, годного для обоих чертежей. */
  const vid = vybratObshchiyVid([postroit(scenariyPo(p, 'a')), postroit(scenariyPo(p, 'b'))]);
  return sVidom(sc, vid);
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
