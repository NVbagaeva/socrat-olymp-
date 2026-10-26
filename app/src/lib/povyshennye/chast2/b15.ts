/**
 * №15 (варианты 3–4): прямая треугольная призма ABCA₁B₁C₁ с AB = BC,
 * плоскости через B параллельно AC.
 *
 * Плоскость через B ∥ AC пересекает рёбра AA₁ и CC₁ на одной высоте u
 * и отрезает пирамиду B·ACC′A′ объёмом ⅓·AC·u·BM, где BM — высота
 * основания к AC; доля от объёма призмы ½·AC·BM·H равна 2u/(3H).
 * а) доля f_a задана (в образце ½) — доказать AN : NA₁;
 * б) доля f_b (в образце ⅓) — косинус угла между двумя такими
 * плоскостями: линейный угол при B в плоскости, перпендикулярной AC.
 */

import {
  chertezhSvg,
  postroit,
  sVidom,
  vybratVid,
  type Scenariy,
  type TochkaScenariya,
} from '@/lib/chertezh3';
import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdScale, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import { ratTex, sklon } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];

export interface PB15 {
  /** Основание: правильный, прямоугольный равнобедренный (гипотенуза AC), с углом B = 120°. */
  osn: 'prav' | 'pryam' | 'tupoy';
  /** AB : AA₁ = a : h. */
  a: number;
  h: number;
  /** Доля объёма части с ребром AC в пункте а (½ — «равные объёмы»). */
  fa?: Dr;
  /** Доля объёма многогранника ABCKP в пункте б (⅓ — «в 3 раза меньше»). */
  fb?: Dr;
}

export function chislaB15(p: PB15) {
  const a2 = rat(p.a * p.a);
  /* BM² — квадрат высоты основания к AC; AC² — квадрат гипотенузы/основания. */
  const bm2 =
    p.osn === 'prav'
      ? mul(a2, rat(3, 4))
      : p.osn === 'pryam'
        ? mul(a2, rat(1, 2))
        : mul(a2, rat(1, 4));
  const ac2 = p.osn === 'prav' ? a2 : p.osn === 'pryam' ? mul(a2, rat(2)) : mul(a2, rat(3));
  const fa = rat(...(p.fa ?? [1, 2]));
  const fb = rat(...(p.fb ?? [1, 3]));
  const H = rat(p.h);
  const u1 = mul(mul(fa, H), rat(3, 2));
  const u2 = mul(mul(fb, H), rat(3, 2));
  const X = add(bm2, mul(u1, u2));
  const y1 = add(bm2, mul(u1, u1));
  const y2 = add(bm2, mul(u2, u2));
  const Y = mul(y1, y2);
  const cos = surdScale(sqrtRat(Y), div(X, Y));
  return { bm2, ac2, fa, fb, H, u1, u2, y1, y2, X, cos };
}

/** Отношение дроби k к 1 − k целыми: 3/4 → [3, 1]. */
function otn(x: Rat, y: Rat): [bigint, bigint] {
  const q = div(x, y);
  return [q.n, q.d];
}

const OSN = {
  prav: 'В правильной треугольной призме $ABCA_1B_1C_1$',
  pryam:
    'Основанием прямой призмы $ABCA_1B_1C_1$ является равнобедренный прямоугольный треугольник $ABC$ с гипотенузой $AC$. В этой призме',
  tupoy:
    'Основанием прямой призмы $ABCA_1B_1C_1$ является равнобедренный треугольник $ABC$, в котором $AB=BC$ и $\\angle ABC=120^\\circ$. В этой призме',
} as const;

const ALT = {
  a: {
    alt: 'Прямая треугольная призма ABCA1B1C1, плоскость через B параллельно AC пересекает рёбра AA1 и CC1 в точках N и N′',
  },
  b: {
    alt: 'Призма с двумя плоскостями через B параллельно AC и линейным углом между ними при вершине B',
  },
};

const na = (a: string, b: string, t: number): TochkaScenariya['gde'] => ({ naOtrezke: [a, b, t] });
const sered = (a: string, b: string): TochkaScenariya['gde'] => ({ seredina: [a, b] });

function scenariy(p: PB15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaB15(p);
  const s = Math.sqrt(toNumber(c.ac2)) / 2;
  const bm = Math.sqrt(toNumber(c.bm2));
  const H = p.h;
  const t1 = toNumber(c.u1) / H;
  const t2 = toNumber(c.u2) / H;
  const tochki: TochkaScenariya[] = [
    { imya: 'N', gde: na('A', 'A1', t1), rol: 'uslovie' as const },
    { imya: "N'", gde: na('C', 'C1', t1), rol: 'uslovie' as const },
    ...(punkt === 'a'
      ? [{ imya: 'M', gde: sered('A', 'C') }]
      : [
          { imya: 'K', gde: na('A', 'A1', t2), rol: 'uslovie' as const },
          { imya: 'P', gde: na('C', 'C1', t2), rol: 'uslovie' as const },
          { imya: 'M', gde: sered('A', 'C') },
          { imya: 'E', gde: sered('N', "N'") },
          { imya: 'F', gde: sered('K', 'P') },
        ]),
  ];
  const sc: Scenariy = {
    id: `PV-B15-${punkt}`,
    alt: ALT[punkt].alt,
    telo: {
      vid: 'pryamaya-prizma',
      osnovanie: [
        [-s, 0],
        [0, -bm],
        [s, 0],
      ],
      h: H,
    },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
    tochki,
    elementy: [
      { id: 'alfa', vid: 'ploskost', tochki: ['B', 'N', "N'"], rol: 'uslovie' as const },
      ...(punkt === 'a'
        ? [
            { id: 'bm', vid: 'otrezok', tochki: ['B', 'M'] },
            { id: 'nn', vid: 'otrezok', tochki: ['N', "N'"] },
          ]
        : [
            { id: 'bkp', vid: 'treugolnik', tochki: ['B', 'K', 'P'], rol: 'uslovie' as const },
            { id: 'bm', vid: 'otrezok', tochki: ['B', 'M'] },
            { id: 'me', vid: 'otrezok', tochki: ['M', 'E'] },
            { id: 'be', vid: 'otrezok', tochki: ['B', 'E'] },
            { id: 'bf', vid: 'otrezok', tochki: ['B', 'F'] },
            { id: 'ugol', vid: 'ugol', tochki: ['E', 'B', 'F'] },
          ]),
    ] as Scenariy['elementy'],
    proverki: [
      {
        otnoshenie: [
          ['A', 'N'],
          ['N', 'A1'],
        ],
        ravno: t1 / (1 - t1),
      },
    ],
  };
  if (punkt === 'b') {
    const a = scenariy(p, 'a');
    return { ...sc, rakurs: a.rakurs, szhatie: a.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function chertezhB15(p: PB15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

export function scenariyB15(p: PB15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function sobrat(p: PB15): Chast2Zadacha {
  const c = chislaB15(p);
  const { fa, fb, H, u1, u2 } = c;
  if (toNumber(u1) >= p.h || toNumber(u2) >= p.h || toNumber(u1) === toNumber(u2))
    throw new Error('b15: точки не на рёбрах');
  const [an, na] = otn(u1, sub(H, u1));
  const one = rat(1);
  const chastA =
    fa.n === 1n && fa.d === 2n
      ? 'на два многогранника с равными объёмами'
      : (() => {
          const [x, y] = otn(fa, sub(one, fa));
          return `на два многогранника, объёмы которых (считая от многогранника с ребром $AC$) относятся как $${x}:${y}$`;
        })();
  const chastB =
    fb.n === 1n
      ? `объём многогранника $ABCKP$ в $${fb.d}$ ${sklon(Number(fb.d), 'раз', 'раза', 'раз')} меньше объёма призмы $ABCA_1B_1C_1$`
      : `объём многогранника $ABCKP$ составляет $${ratTex(fb)}$ объёма призмы $ABCA_1B_1C_1$`;
  const uslovie =
    `${OSN[p.osn]} через точку $B$ параллельно прямой $AC$ провели плоскость $\\alpha$, которая пересекла ребро $AA_1$ в точке $N$ и разбила призму ${chastA}.\n` +
    `а) Докажите, что $AN:NA_1=${an}:${na}$.\n` +
    `б) Через точку $B$ параллельно прямой $AC$ провели плоскость, которая пересекла рёбра $AA_1$ и $CC_1$ в точках $K$ и $P$ соответственно так, что ${chastB}. Найдите косинус угла между плоскостями $\\alpha$ и $BKP$, если $AB:AA_1=${p.a}:${p.h}$.`;

  const cosTex = surdTex(c.cos);
  const bmTex = surdTex(sqrtRat(c.bm2));
  const bmPoch =
    p.osn === 'prav'
      ? `$BM=\\dfrac{AB\\sqrt3}{2}=${bmTex}$`
      : p.osn === 'pryam'
        ? `$BM=\\dfrac{AB}{\\sqrt2}=${bmTex}$ (медиана к гипотенузе)`
        : `$BM=AB\\cos60^\\circ=${bmTex}$ ($BM$ — биссектриса угла $ABC$)`;
  const faTex = ratTex(fa);
  const u1t = ratTex(u1);
  const u2t = ratTex(u2);

  return {
    no: 15,
    shablon: 'b15.prizmaPloskost',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Косинус угла',
        pole: { vid: 'chislo', verno: cosTex.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${cosTex}$`,
    reshenie: [
      {
        title: 'а) Сечение — прямоугольник',
        risunok: chertezhB15(p, 'a'),
        lines: [
          `Прямая $AC$ параллельна плоскости $\\alpha$, а плоскость $AA_1C_1C$ проходит через $AC$ и пересекает $\\alpha$. По {{t:sled-par-ploskosti|свойству плоскости, проходящей через прямую, параллельную другой плоскости}}, линия пересечения $NN'$ параллельна $AC$ ($N'$ — на ребре $CC_1$). Тогда $ACN'N$ — прямоугольник: боковые рёбра прямой призмы перпендикулярны основанию, $CN'=AN$.`,
          `Плоскость $\\alpha$ отсекает от призмы пирамиду $BACN'N$ с вершиной $B$ и основанием $ACN'N$.`,
        ],
      },
      {
        title: 'а) Объёмы',
        lines: [
          `Пусть $M$ — середина $AC$; в равнобедренном треугольнике $ABC$ медиана $BM\\perp AC$. Кроме того, $BM\\perp AA_1$, поэтому по {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BM\\perp(AA_1C_1C)$ — это высота пирамиды.`,
          `По {{t:obem-piramidy|формуле объёма пирамиды}} $V_{BACN'N}=\\dfrac13\\cdot AC\\cdot AN\\cdot BM$, а объём призмы $V=S_{ABC}\\cdot AA_1=\\dfrac12\\cdot AC\\cdot BM\\cdot AA_1$.`,
          `Отношение $\\dfrac{V_{BACN'N}}{V}=\\dfrac{2AN}{3AA_1}=${faTex}$, откуда $AN=${ratTex(mul(fa, rat(3, 2)))}AA_1$ и $AN:NA_1=${an}:${na}$.`,
        ],
      },
      {
        title: 'б) Положение точек $K$ и $P$',
        lines: [
          `Так же, как в пункте а, $KP\\parallel AC$, $AK=CP$, и многогранник $ABCKP$ — пирамида $BACPK$ объёмом $\\dfrac13\\cdot AC\\cdot AK\\cdot BM$. Из условия $\\dfrac{2AK}{3AA_1}=${ratTex(fb)}$, то есть $AK=${ratTex(mul(fb, rat(3, 2)))}AA_1$.`,
          `Пусть $AB=${p.a}$, $AA_1=${p.h}$ (угол от масштаба не зависит). Тогда $AN=${u1t}$, $AK=${u2t}$, ${bmPoch}.`,
        ],
      },
      {
        title: 'б) Линейный угол',
        risunok: chertezhB15(p, 'b'),
        lines: [
          `Обе плоскости проходят через $B$ параллельно $AC$, поэтому пересекаются по прямой $\\ell$ через $B$, параллельной $AC$.`,
          `Пусть $E$ и $F$ — середины $NN'$ и $KP$; они лежат на перпендикуляре к основанию в точке $M$: $ME=AN$, $MF=AK$. Прямая $\\ell\\parallel AC$ перпендикулярна $BM$ и $ME$, значит, по {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} она перпендикулярна плоскости $BME$ и прямым $BE$ и $BF$ этой плоскости. Поэтому угол $EBF$ — {{t:ugol-mezhdu-ploskostyami|линейный угол}}, он равен углу между плоскостями.`,
        ],
      },
      {
        title: 'б) Косинус угла',
        lines: [
          `По {{t:pifagor|теореме Пифагора}} в треугольниках $BME$ и $BMF$: $BE^2=BM^2+ME^2=${ratTex(c.y1)}$, $BF^2=BM^2+MF^2=${ratTex(c.y2)}$; $EF=|AN-AK|=${ratTex(toNumber(u1) > toNumber(u2) ? sub(u1, u2) : sub(u2, u1))}$.`,
          `По {{t:teorema-kosinusov|теореме косинусов}} $\\cos\\angle EBF=\\dfrac{BE^2+BF^2-EF^2}{2\\,BE\\cdot BF}=\\dfrac{BM^2+AN\\cdot AK}{BE\\cdot BF}=\\dfrac{${ratTex(c.X)}}{\\sqrt{${ratTex(c.y1)}\\cdot${ratTex(c.y2)}}}=${cosTex}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: "а) Сечение плоскостью, параллельной $AC$, — прямоугольник $ACN'N$",
        formula: "NN'\\parallel AC",
      },
      {
        slovo: 'а) Отсечённая часть — пирамида с высотой $BM$',
        formula: `\\dfrac{V_{BACN'N}}{V}=\\dfrac{2AN}{3AA_1}=${faTex}`,
      },
      { slovo: 'б) Так же находим $AK$', formula: `AK=${ratTex(mul(fb, rat(3, 2)))}AA_1` },
      {
        slovo: 'б) Линейный угол — в плоскости $BME$, перпендикулярной $AC$',
        formula: '\\angle EBF',
      },
      { slovo: 'б) Теорема косинусов в треугольнике $EBF$', formula: `\\cos\\angle EBF=${cosTex}` },
    ],
    kontrol: {
      bm2: toNumber(c.bm2),
      ac2: toNumber(c.ac2),
      an: toNumber(u1),
      ak: toNumber(u2),
      cos: surdToNumber(c.cos),
    },
  };
}

export const B15_PRIZMA_PLOSKOST: Shablon2<PB15> = {
  no: 15,
  prototip:
    'Прямая призма с равнобедренным основанием, плоскости через B ∥ AC: доля объёма, угол между плоскостями',
  sobrat,
};
