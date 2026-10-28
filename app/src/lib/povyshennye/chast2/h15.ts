/**
 * №15 (варианты 15–16): правильная пирамида SABCD с высотой SO,
 * K — середина SB, N = DK ∩ (SAC).
 *
 * Плоскости SAC и SBD пересекаются по SO; DK и SO — медианы треугольника
 * SBD, N — точка их пересечения: SN : NO = 2 : 1.
 * а) Прямая через N параллельно SC делит SA (SQ : QA = 1 : 2) или
 *    AC (AP : PC = 2 : 1) — подобие.
 * б) Координаты с началом в O: A(−r;0;0), C(r;0;0), B(0;−r;0), D(0;r;0),
 *    S(0;0;h), r = a/√2. DK ∥ (0; −3r; h), SC ∥ (r; 0; −h).
 *    Расстояние: плоскость через DK параллельно SC, ρ² = 4a²h²/(20h² + 9a²).
 *    Угол: cos² = h⁴/((9r² + h²)(r² + h²)).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PH15 {
  /** AB², SO². */
  a2: number;
  h2: number;
  delit: 'SA' | 'AC';
  nado: 'rasst' | 'ugol';
}

export function chislaH15(p: PH15) {
  const a2 = rat(p.a2);
  const h2 = rat(p.h2);
  const r2 = div(a2, rat(2));
  const rasst2 = div(mul(rat(4), mul(a2, h2)), add(mul(rat(20), h2), mul(rat(9), a2)));
  const cos2 = div(mul(h2, h2), mul(add(mul(rat(9), r2), h2), add(r2, h2)));
  return { a2, h2, r2, rasst2, cos2 };
}

function scenariy(p: PH15, punkt: 'a' | 'b'): Scenariy {
  const a = Math.sqrt(p.a2);
  const h = Math.sqrt(p.h2);
  const SA = p.delit === 'SA';
  const sc: Scenariy = {
    id: `PV-H15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная пирамида SABCD, медианы DK и SO треугольника SBD'
        : 'Правильная пирамида SABCD, прямые DK и SC',
    telo: {
      vid: 'piramida-proizv',
      osnovanie: [
        [0, 0],
        [a, 0],
        [a, a],
        [0, a],
      ],
      vershina: [a / 2, a / 2, h],
    },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [
      { imya: 'K', gde: { seredina: ['S', 'B'] }, rol: 'uslovie' },
      { imya: 'O', gde: { seredina: ['A', 'C'] }, rol: 'uslovie' },
      { imya: 'N', gde: { naOtrezke: ['D', 'K', 2 / 3] }, rol: 'uslovie' },
      ...(punkt === 'a'
        ? [
            SA
              ? { imya: 'Q', gde: { naOtrezke: ['S', 'A', 1 / 3] } }
              : { imya: 'P', gde: { naOtrezke: ['A', 'C', 2 / 3] } },
          ]
        : []),
    ] as Scenariy['tochki'],
    elementy:
      punkt === 'a'
        ? [
            { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
            { id: 'dk', vid: 'mediana', tochki: ['D', 'K'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'nq', vid: 'otrezok', tochki: SA ? ['N', 'Q'] : ['N', 'P'] },
          ]
        : [
            { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
            { id: 'dk', vid: 'otrezok', tochki: ['D', 'K'], rol: 'uslovie' },
            { id: 'sc', vid: 'otrezok', tochki: ['S', 'C'], rol: 'uslovie' },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyH15(p: PH15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PH15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

const kv = (x: Rat) => surdTex(sqrtRat(x));

function sobrat(p: PH15): Chast2Zadacha {
  const c = chislaH15(p);
  const aT = kv(c.a2);
  const hT = kv(c.h2);
  const SA = p.delit === 'SA';
  const rasst = p.nado === 'rasst';
  const otvS = rasst ? sqrtRat(c.rasst2) : sqrtRat(c.cos2);
  const otvT = rasst ? surdTex(otvS) : `\\arccos ${surdTex(otvS)}`;
  const uslovie =
    `В правильной пирамиде $SABCD$ с высотой $SO$ точка $K$ — середина ребра $SB$. Прямая $DK$ пересекается с плоскостью $SAC$ в точке $N$.\n` +
    `а) Докажите, что прямая $a$, проходящая через точку $N$ параллельно прямой $SC$, делит ${SA ? 'ребро $SA$ в отношении $1:2$, считая от вершины $S$' : 'диагональ $AC$ в отношении $2:1$, считая от вершины $A$'}.\n` +
    `б) Найдите ${rasst ? 'расстояние между прямыми $DK$ и $SC$' : 'угол между прямыми $DK$ и $SC$'}, если $AB=${aT}$, $SO=${hT}$.`;
  const r2T = ratTex(c.r2);
  const bLines = rasst
    ? [
        `Плоскость $\\beta$ через $DK$ параллельно $SC$ — её нормаль $\\vec n=\\vec u\\times\\vec v$ для $\\vec u=(0;\\,-3r;\\,h)$, $\\vec v=(r;\\,0;\\,-h)$: $\\vec n=(3rh;\\,rh;\\,3r^2)\\parallel(3h;\\,h;\\,3r)$. Прямая $SC$ {{t:priznak-par-pryamoy-ploskosti|параллельна плоскости}} $\\beta$, и {{t:rasst-skreshch|расстояние между скрещивающимися прямыми}} равно расстоянию от точки $S$ до $\\beta$.`,
        `$\\overrightarrow{DS}=(0;\\,-r;\\,h)$, по {{t:rasst-do-ploskosti|формуле расстояния}}: $\\rho=\\dfrac{|\\overrightarrow{DS}\\cdot\\vec n|}{|\\vec n|}=\\dfrac{|-rh+3rh|}{\\sqrt{10h^2+9r^2}}=\\dfrac{2rh}{\\sqrt{10h^2+9r^2}}$.`,
        `$r^2=${r2T}$, $h^2=${p.h2}$: $\\rho^2=\\dfrac{4\\cdot${r2T}\\cdot${p.h2}}{10\\cdot${p.h2}+9\\cdot${r2T}}=${ratTex(c.rasst2)}$, $\\rho=${otvT}$.`,
      ]
    : [
        `По {{t:ugol-mezhdu-vektorami|формуле угла между прямыми}}: $\\cos\\varphi=\\dfrac{|\\vec u\\cdot\\vec v|}{|\\vec u|\\,|\\vec v|}$ для $\\vec u=(0;\\,-3r;\\,h)\\parallel DK$ и $\\vec v=(r;\\,0;\\,-h)\\parallel SC$.`,
        `$\\vec u\\cdot\\vec v=-h^2$, $|\\vec u|^2=9r^2+h^2$, $|\\vec v|^2=r^2+h^2$; при $r^2=${r2T}$, $h^2=${p.h2}$: $\\cos^2\\varphi=${ratTex(c.cos2)}$, $\\cos\\varphi=${surdTex(otvS)}$.`,
        `Ответ: $${otvT}$.`,
      ];
  return {
    no: 15,
    shablon: 'h15.pravPiramida',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: rasst ? 'Расстояние' : 'Угол',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Точка $N$',
        risunok: chertezh(p, 'a'),
        lines: [
          `В правильной пирамиде высота падает в центр квадрата $O$ — точку пересечения диагоналей; {{t:romb-diagonali|диагонали квадрата делятся ею пополам}}, поэтому $SO$ — медиана треугольника $SBD$, и плоскости $SAC$ и $SBD$ пересекаются по прямой $SO$.`,
          `$DK$ лежит в плоскости $SBD$, значит, $N=DK\\cap SO$ — точка пересечения медиан треугольника $SBD$, и {{t:mediany-2-1|медианы делятся ей в отношении $2:1$}}: $SN:NO=2:1$.`,
        ],
      },
      {
        title: 'а) Прямая $a$',
        lines: SA
          ? [
              'Прямая $a\\parallel SC$ проходит через $N$ и лежит в плоскости $SAC$; пусть она пересекает $AC$ в точке $P$ и $SA$ в точке $Q$.',
              'Треугольники $ONP$ и $OSC$ {{t:podobie-uu|подобны по двум углам}}: $\\dfrac{OP}{OC}=\\dfrac{ON}{OS}=\\dfrac13$. При $AO=OC=3t$ получаем $AP=4t$, $AC=6t$.',
              'Треугольники $AQP$ и $ASC$ подобны ($QP\\parallel SC$): $\\dfrac{AQ}{AS}=\\dfrac{AP}{AC}=\\dfrac23$, то есть $SQ:QA=1:2$.',
            ]
          : [
              'Прямая $a\\parallel SC$ проходит через $N$ и лежит в плоскости $SAC$; она пересекает $AC$ в точке $P$ на отрезке $OC$.',
              'Треугольники $ONP$ и $OSC$ {{t:podobie-uu|подобны по двум углам}}: $\\dfrac{OP}{OC}=\\dfrac{ON}{OS}=\\dfrac13$.',
              'При $AO=OC=3t$: $OP=t$, $AP=4t$, $PC=2t$, $AP:PC=2:1$.',
            ],
      },
      {
        title: 'б) Координаты',
        risunok: chertezh(p, 'b'),
        lines: [
          `Начало — в $O$, оси — по $OC$, $OD$, $OS$. Пусть $r=OA=\\dfrac{AB}{\\sqrt2}$, $h=SO$: $A(-r;0;0)$, $C(r;0;0)$, $B(0;-r;0)$, $D(0;r;0)$, $S(0;0;h)$, $K\\left(0;-\\frac r2;\\frac h2\\right)$.`,
          `$\\overrightarrow{DK}=\\left(0;\\,-\\frac{3r}{2};\\,\\frac h2\\right)\\parallel\\vec u=(0;\\,-3r;\\,h)$, $\\overrightarrow{SC}=\\vec v=(r;\\,0;\\,-h)$.`,
        ],
      },
      {
        title: rasst ? 'б) Расстояние' : 'б) Угол',
        lines: [...bLines, ...(rasst ? [`Ответ: $${otvT}$.`] : [])],
      },
    ],
    razbor: [
      { slovo: 'а) $N$ — точка пересечения медиан треугольника $SBD$', formula: 'SN:NO=2:1' },
      { slovo: 'а) Подобие при параллельной прямой', formula: SA ? 'SQ:QA=1:2' : 'AP:PC=2:1' },
      {
        slovo: 'б) Направляющие векторы',
        formula: '\\vec u=(0;\\,-3r;\\,h),\\ \\vec v=(r;\\,0;\\,-h)',
      },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: {
      otvet: rasst ? surdToNumber(otvS) : Math.acos(surdToNumber(otvS)),
      rasst2: toNumber(c.rasst2),
      cos2: toNumber(c.cos2),
    },
  };
}

export const H15_PRAV_PIRAMIDA: Shablon2<PH15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная пирамида: точка пересечения медиан, параллельная прямая; расстояние или угол между DK и SC',
  sobrat,
};
