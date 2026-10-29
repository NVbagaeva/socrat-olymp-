/**
 * №15 (варианты 13–14): правильная призма ABCDA₁B₁C₁D₁ (AB = a, AA₁ = h),
 * N — середина AB, K на C₁D₁ с C₁K : KD₁ = m : n, плоскость α через N и K
 * параллельно BD.
 *
 * а) BD ⊥ AC и BD ⊥ AA₁ ⇒ BD ⊥ CA₁. В координатах NK·CA₁ = h² − a²(3/2 − t),
 *    t = m/(m+n): условие задачи задаёт h² = a²(3/2 − t), и CA₁ ⊥ NK.
 *    Две пересекающиеся прямые плоскости (NM ∥ BD и NK) ⊥ CA₁ ⇒ CA₁ ⊥ α.
 * б) α: ax + ay − hz = a²/2. Сечение — шестиугольник NPLKQM (P, Q — на BB₁
 *    и DD₁ на высоте a²/(2h)), его проекция на основание — квадрат без
 *    углов: S₀ = a²(7/8 − t²/2). cos(α, ABC) = h/√(2a² + h²),
 *    ρ(C, α) = (3a²/2)/√(2a² + h²): V = S₀·a²/(2h), S = S₀·√(2a²+h²)/h.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PG15 {
  /** AB² (AB = √a2). */
  a2: number;
  /** C₁K : KD₁ = m : n. */
  m: number;
  n: number;
  /** б) объём пирамиды с вершиной C или площадь сечения. */
  nado: 'V' | 'S';
}

export function chislaG15(p: PG15) {
  const t = rat(p.m, p.m + p.n);
  const a2 = rat(p.a2);
  const h2 = mul(a2, sub(rat(3, 2), t));
  const s0 = mul(a2, sub(rat(7, 8), div(mul(t, t), rat(2))));
  /* V² = S₀²·a⁴/(4h²), S² = S₀²·(2a² + h²)/h². */
  const V2 = div(mul(mul(s0, s0), mul(a2, a2)), mul(rat(4), h2));
  const S2 = div(mul(mul(s0, s0), add(mul(rat(2), a2), h2)), h2);
  return { t, a2, h2, s0, V2, S2, d2: add(mul(rat(2), a2), h2) };
}

function scenariy(p: PG15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaG15(p);
  const a = Math.sqrt(p.a2);
  const h = Math.sqrt(toNumber(c.h2));
  const t = toNumber(c.t);
  const zp = p.a2 / (2 * h) / h;
  const sc: Scenariy = {
    id: `PV-G15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная призма, плоскость через середину ребра основания параллельно диагонали основания и диагональ призмы'
        : 'Правильная призма, шестиугольное сечение и пирамида с вершиной в вершине основания',
    telo: {
      vid: 'pryamaya-prizma',
      osnovanie: [
        [0, 0],
        [a, 0],
        [a, a],
        [0, a],
      ],
      h,
    },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    tochki: [
      { imya: 'N', gde: { seredina: ['A', 'B'] }, rol: 'uslovie' },
      { imya: 'K', gde: { naOtrezke: ['C1', 'D1', t] }, rol: 'uslovie' },
      { imya: 'M', gde: { seredina: ['A', 'D'] } },
      { imya: 'L', gde: { naOtrezke: ['C1', 'B1', t] } },
      { imya: 'P', gde: { naOtrezke: ['B', 'B1', zp] } },
      { imya: 'Q', gde: { naOtrezke: ['D', 'D1', zp] } },
    ],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ca1', vid: 'diagonal', tochki: ['C', 'A1'], rol: 'uslovie' },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'nm', vid: 'otrezok', tochki: ['N', 'M'] },
            { id: 'nk', vid: 'otrezok', tochki: ['N', 'K'] },
          ]
        : [
            {
              id: 'sech',
              vid: 'mnogougolnik',
              tochki: ['N', 'P', 'L', 'K', 'Q', 'M'],
              rol: 'uslovie',
            },
            { id: 'cn', vid: 'otrezok', tochki: ['C', 'N'] },
            { id: 'cm', vid: 'otrezok', tochki: ['C', 'M'] },
            { id: 'cp', vid: 'otrezok', tochki: ['C', 'P'] },
            { id: 'cq', vid: 'otrezok', tochki: ['C', 'Q'] },
            { id: 'ck', vid: 'otrezok', tochki: ['C', 'K'] },
            { id: 'cl', vid: 'otrezok', tochki: ['C', 'L'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyG15(p: PG15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PG15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

const kv = (x: Rat) => surdTex(sqrtRat(x));

function sobrat(p: PG15): Chast2Zadacha {
  if (!(p.m > 0 && p.n > 0)) throw new Error('g15: отношение');
  const c = chislaG15(p);
  const aT = kv(c.a2);
  const hT = kv(c.h2);
  const tT = ratTex(c.t);
  const otv = p.nado === 'V' ? sqrtRat(c.V2) : sqrtRat(c.S2);
  const otvT = surdTex(otv);
  const uslovie =
    `Ребро $AB$ основания $ABCD$ правильной призмы $ABCDA_1B_1C_1D_1$ равно $${aT}$, а высота $AA_1$ равна $${hT}$. На рёбрах $AB$ и $C_1D_1$ отметили точки $N$ и $K$ соответственно так, что $N$ — середина ребра, а $C_1K:KD_1=${p.m}:${p.n}$. Через точки $N$ и $K$ параллельно прямой $BD$ провели плоскость $\\alpha$.\n` +
    `а) Докажите, что прямая $CA_1$ перпендикулярна плоскости $\\alpha$.\n` +
    `б) Найдите ${p.nado === 'V' ? 'объём пирамиды с вершиной в точке $C$ и основанием, которое образовано сечением призмы плоскостью $\\alpha$' : 'площадь сечения призмы плоскостью $\\alpha$'}.`;
  const a2 = p.a2;
  const s0T = ratTex(c.s0);
  const bLines =
    p.nado === 'V'
      ? [
          `Объём пирамиды: $V=\\dfrac13\\,S\\cdot\\rho(C,\\alpha)$ ({{t:obem-piramidy|объём пирамиды}}). Расстояние от $C(a;a;0)$ до плоскости — по {{t:rasst-do-ploskosti|формуле}}: $\\rho=\\dfrac{|2a^2-\\frac{a^2}{2}|}{\\sqrt{2a^2+h^2}}=\\dfrac{3a^2}{2\\sqrt{2a^2+h^2}}$.`,
          `Площадь сечения $S=\\dfrac{S_0}{\\cos\\varphi}=\\dfrac{S_0\\sqrt{2a^2+h^2}}{h}$, поэтому $V=\\dfrac13\\cdot\\dfrac{S_0\\sqrt{2a^2+h^2}}{h}\\cdot\\dfrac{3a^2}{2\\sqrt{2a^2+h^2}}=\\dfrac{S_0a^2}{2h}=\\dfrac{${s0T}\\cdot${a2}}{2\\cdot${hT}}=${otvT}$.`,
        ]
      : [
          `Площадь сечения $S=\\dfrac{S_0}{\\cos\\varphi}=\\dfrac{S_0\\sqrt{2a^2+h^2}}{h}=\\dfrac{${s0T}\\cdot\\sqrt{${ratTex(c.d2)}}}{${hT}}=${otvT}$.`,
        ];
  return {
    no: 15,
    shablon: 'g15.prizmaSechenie',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'V' ? 'Объём' : 'Площадь сечения',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Прямая $CA_1$ и прямая $BD$',
        risunok: chertezh(p, 'a'),
        lines: [
          `{{t:romb-diagonali|Диагонали квадрата перпендикулярны}}: $BD\\perp AC$; боковое ребро перпендикулярно основанию: $BD\\perp AA_1$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BD\\perp(ACC_1A_1)$, значит, $BD\\perp CA_1$.`,
          `Плоскость $\\alpha$ параллельна $BD$, поэтому пересекает основание по прямой $NM\\parallel BD$; $M$ — середина $AD$ ({{t:srednyaya-liniya-treugolnika|средняя линия треугольника $ABD$}}). Итак, $CA_1\\perp NM$.`,
        ],
      },
      {
        title: 'а) Вторая прямая в плоскости $\\alpha$',
        lines: [
          `Введём координаты: $A(0;0;0)$, $B(a;0;0)$, $D(0;a;0)$, $A_1(0;0;h)$, где $a=${aT}$, $h=${hT}$. Тогда $C(a;a;0)$, $N\\left(\\frac a2;0;0\\right)$, $K(a-${tT}a;\\,a;\\,h)$, так как $C_1K=${tT}\\,C_1D_1$.`,
          `$\\overrightarrow{CA_1}=(-a;-a;h)$, $\\overrightarrow{NK}=\\left(\\frac a2-${tT}a;\\,a;\\,h\\right)$; $\\overrightarrow{CA_1}\\cdot\\overrightarrow{NK}=-\\frac{a^2}{2}+${tT}a^2-a^2+h^2=h^2-a^2\\left(\\frac32-${tT}\\right)=${ratTex(c.h2)}-${a2}\\cdot${ratTex(sub(rat(3, 2), c.t))}=0$.`,
          `Прямая $CA_1$ перпендикулярна двум пересекающимся прямым $NM$ и $NK$ плоскости $\\alpha$ — по {{t:priznak-perp-ploskosti|признаку}} $CA_1\\perp\\alpha$.`,
        ],
      },
      {
        title: 'б) Сечение',
        risunok: chertezh(p, 'b'),
        lines: [
          `Нормаль плоскости $\\alpha$ — вектор $\\overrightarrow{CA_1}$, и $\\alpha$ проходит через $N$: $ax+ay-hz=\\frac{a^2}{2}$. Подставляя вершины, видим: $B$, $C$, $D$, $C_1$ — по одну сторону, $A$, $A_1$, $B_1$, $D_1$ — по другую. Сечение — шестиугольник $NPLKQM$: $P\\in BB_1$ и $Q\\in DD_1$ на высоте $z=\\frac{a^2}{2h}$, $L\\in B_1C_1$ с $C_1L=C_1K$.`,
          `Проекция сечения на основание — квадрат $ABCD$ без треугольника $ANM$ (площадь $\\frac{a^2}{8}$) и треугольника у вершины $C$ с катетами $${tT}a$: $S_0=a^2\\left(\\frac78-\\frac{(${tT})^2}{2}\\right)=${s0T}$.`,
          `Угол $\\varphi$ между $\\alpha$ и основанием — {{t:ugol-mezhdu-ploskostyami|угол между нормалями}}: $\\cos\\varphi=\\dfrac{h}{\\sqrt{2a^2+h^2}}=\\dfrac{${hT}}{\\sqrt{${ratTex(c.d2)}}}$.`,
        ],
      },
      { title: 'б) Ответ', lines: [...bLines, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) $BD\\perp CA_1$, а $\\alpha\\parallel BD$', formula: 'NM\\parallel BD' },
      {
        slovo: 'а) Вторая прямая — скалярное произведение',
        formula: '\\overrightarrow{CA_1}\\cdot\\overrightarrow{NK}=0',
      },
      { slovo: 'б) Сечение — шестиугольник, площадь проекции', formula: `S_0=${s0T}` },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: {
      h2: toNumber(c.h2),
      otvet: surdToNumber(otv),
      zP: p.a2 / (2 * Math.sqrt(toNumber(c.h2))),
    },
  };
}

export const G15_PRIZMA_SECHENIE: Shablon2<PG15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная призма: плоскость через середину ребра параллельно диагонали, перпендикулярная диагонали призмы; объём пирамиды или площадь сечения',
  sobrat,
};
