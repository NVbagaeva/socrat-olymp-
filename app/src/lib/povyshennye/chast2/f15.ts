/**
 * №15 (варианты 11–12): пирамида SABCD, SA — высота, ABCD — квадрат,
 * K — середина SB, N = DK ∩ (SAC).
 *
 * Плоскости SBD и SAC пересекаются по SO (O — центр квадрата), DK и SO —
 * медианы треугольника SBD, N — точка их пересечения: SN : NO = 2 : 1.
 * а) Прямая через N параллельно SC делит AC (AP : PC = 2 : 1) или
 *    SA (SQ : QA = 1 : 2) — подобие треугольников.
 * б) Угол между DK и одной из прямых SC, SA, AC, BC — в координатах:
 *    DK ∥ (a; −2a; h), |·|² = 5a² + h².
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PF15 {
  /** Квадрат стороны основания a². */
  a2: number;
  /** Квадрат высоты SA. */
  h2: number;
  /** а) какую прямую делит: диагональ AC или ребро SA. */
  delit: 'AC' | 'SA';
  /** б) угол между DK и этой прямой. */
  pr: 'SC' | 'SA' | 'AC' | 'BC';
}

/** cos² угла между DK и прямой пункта б. */
export function cos2F15(p: PF15): Rat {
  const a2 = rat(p.a2);
  const h2 = rat(p.h2);
  const dk = rat(5 * p.a2 + p.h2);
  switch (p.pr) {
    case 'SC': {
      const s = rat(p.a2 + p.h2);
      return div(mul(s, s), mul(dk, rat(2 * p.a2 + p.h2)));
    }
    case 'SA':
      return div(h2, dk);
    case 'AC':
      return div(a2, mul(rat(2), dk));
    case 'BC':
      return div(mul(rat(4), a2), dk);
  }
}

const VEKTOR: Record<PF15['pr'], { v: string; dot: string; dl: string }> = {
  SC: { v: '(a;\\,a;\\,-h)', dot: 'a^2-2a^2-h^2=-(a^2+h^2)', dl: '\\sqrt{2a^2+h^2}' },
  SA: { v: '(0;\\,0;\\,-h)', dot: '-h^2', dl: 'h' },
  AC: { v: '(a;\\,a;\\,0)', dot: 'a^2-2a^2=-a^2', dl: 'a\\sqrt2' },
  BC: { v: '(0;\\,a;\\,0)', dot: '-2a^2', dl: 'a' },
};

function scenariy(p: PF15, punkt: 'a' | 'b'): Scenariy {
  const a = Math.sqrt(p.a2);
  const h = Math.sqrt(p.h2);
  const sc: Scenariy = {
    id: `PV-F15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Пирамида SABCD с высотой SA, медианы DK и SO треугольника SBD'
        : `Пирамида SABCD, прямые DK и ${p.pr}`,
    telo: {
      vid: 'piramida-proizv',
      osnovanie: [
        [0, 0],
        [a, 0],
        [a, a],
        [0, a],
      ],
      vershina: [0, 0, h],
    },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [
      { imya: 'K', gde: { seredina: ['S', 'B'] }, rol: 'uslovie' },
      { imya: 'O', gde: { seredina: ['A', 'C'] } },
      { imya: 'N', gde: { naOtrezke: ['D', 'K', 2 / 3] }, rol: 'uslovie' },
      ...(punkt === 'a'
        ? [
            p.delit === 'AC'
              ? { imya: 'P', gde: { naOtrezke: ['A', 'C', 2 / 3] } }
              : { imya: 'Q', gde: { naOtrezke: ['S', 'A', 1 / 3] } },
          ]
        : []),
    ] as Scenariy['tochki'],
    elementy:
      punkt === 'a'
        ? [
            { id: 'sa', vid: 'vysota', tochki: ['S', 'A'], rol: 'uslovie' },
            { id: 'dk', vid: 'mediana', tochki: ['D', 'K'], rol: 'uslovie' },
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'], rol: 'uslovie' },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'so', vid: 'mediana', tochki: ['S', 'O'] },
            { id: 'sc', vid: 'otrezok', tochki: ['S', 'C'] },
            { id: 'np', vid: 'otrezok', tochki: p.delit === 'AC' ? ['N', 'P'] : ['N', 'Q'] },
          ]
        : [
            { id: 'sa', vid: 'vysota', tochki: ['S', 'A'], rol: 'uslovie' },
            { id: 'dk', vid: 'otrezok', tochki: ['D', 'K'], rol: 'uslovie' },
            { id: 'pr', vid: 'otrezok', tochki: [p.pr[0]!, p.pr[1]!], rol: 'uslovie' },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyF15(p: PF15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PF15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PF15): Chast2Zadacha {
  const c2 = cos2F15(p);
  const cos = sqrtRat(c2);
  const cosT = surdTex(cos);
  const otv = `\\arccos ${cosT}`;
  const aT = surdTex(sqrtRat(rat(p.a2)));
  const hT = surdTex(sqrtRat(rat(p.h2)));
  const AC = p.delit === 'AC';
  const uslovie =
    `В пирамиде $SABCD$ с высотой $SA$ основание — квадрат $ABCD$, точка $K$ — середина ребра $SB$. Прямая $DK$ пересекает плоскость $SAC$ в точке $N$.\n` +
    `а) Докажите, что прямая, проходящая через точку $N$ параллельно прямой $SC$, делит ${AC ? 'диагональ основания $AC$' : 'высоту $SA$'} в отношении $${AC ? '2:1' : '1:2'}$, считая от вершины ${AC ? '$A$' : '$S$'}.\n` +
    `б) Найдите угол между прямыми $DK$ и $${p.pr}$, если $AB=${aT}$, $SA=${hT}$.`;
  const v = VEKTOR[p.pr];
  const dkDl = `\\sqrt{5a^2+h^2}`;
  const dotNum = (() => {
    switch (p.pr) {
      case 'SC':
        return p.a2 + p.h2;
      case 'SA':
        return p.h2;
      case 'AC':
        return p.a2;
      case 'BC':
        return 2 * p.a2;
    }
  })();
  return {
    no: 15,
    shablon: 'f15.piramidaMediany',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Угол',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Точка $N$',
        risunok: chertezh(p, 'a'),
        lines: [
          'Пусть $O$ — точка пересечения диагоналей квадрата; {{t:romb-diagonali|диагонали квадрата делятся точкой пересечения пополам}}, поэтому $O$ — середина $BD$, и плоскости $SAC$ и $SBD$ пересекаются по прямой $SO$.',
          'Прямая $DK$ лежит в плоскости $SBD$, значит, точка $N$ лежит на $SO$. В треугольнике $SBD$ отрезки $DK$ и $SO$ — медианы, $N$ — точка их пересечения, и {{t:mediany-2-1|медианы делятся ей в отношении $2:1$}}: $SN:NO=2:1$.',
        ],
      },
      {
        title: 'а) Параллельная прямая',
        lines: AC
          ? [
              'Прямая через $N$, параллельная $SC$, лежит в плоскости $SAC$ и пересекает $AC$ в точке $P$ (на отрезке $OC$).',
              'Треугольники $ONP$ и $OSC$ {{t:podobie-uu|подобны по двум углам}} (общий угол $O$, соответственные углы при параллельных $NP$ и $SC$): $\\dfrac{OP}{OC}=\\dfrac{ON}{OS}=\\dfrac13$.',
              'Пусть $AO=OC=3t$. Тогда $OP=t$, $AP=4t$, $PC=2t$, и $AP:PC=2:1$.',
            ]
          : [
              'Прямая через $N$, параллельная $SC$, лежит в плоскости $SAC$ и пересекает $SA$ в точке $Q$, а $AC$ — в точке $P$.',
              'Треугольники $ONP$ и $OSC$ {{t:podobie-uu|подобны по двум углам}}: $\\dfrac{OP}{OC}=\\dfrac{ON}{OS}=\\dfrac13$; при $AO=OC=3t$ получаем $AP=4t$, $AC=6t$.',
              'Треугольники $AQP$ и $ASC$ подобны ($QP\\parallel SC$): $\\dfrac{AQ}{AS}=\\dfrac{AP}{AC}=\\dfrac23$. Значит, $SQ:QA=1:2$.',
            ],
      },
      {
        title: 'б) Координаты',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $a=AB=${aT}$, $h=SA=${hT}$. Начало — в $A$, оси — по $AB$, $AD$, $AS$: $B(a;0;0)$, $C(a;a;0)$, $D(0;a;0)$, $S(0;0;h)$, $K\\left(\\dfrac a2;\\,0;\\,\\dfrac h2\\right)$.`,
          `$\\overrightarrow{DK}=\\left(\\dfrac a2;\\,-a;\\,\\dfrac h2\\right)$; удобнее параллельный вектор $\\vec u=(a;\\,-2a;\\,h)$, $|\\vec u|=${dkDl}$. Направляющий вектор прямой $${p.pr}$: $\\vec v=${v.v}$, $|\\vec v|=${v.dl}$.`,
        ],
      },
      {
        title: 'б) Угол',
        lines: [
          `$\\vec u\\cdot\\vec v=${v.dot}$. По {{t:ugol-mezhdu-vektorami|формуле косинуса угла между прямыми}}: $\\cos\\varphi=\\dfrac{|\\vec u\\cdot\\vec v|}{|\\vec u|\\,|\\vec v|}$.`,
          `$a^2=${p.a2}$, $h^2=${p.h2}$: $|\\vec u\\cdot\\vec v|=${dotNum}$, $|\\vec u|^2=${5 * p.a2 + p.h2}$, $\\cos^2\\varphi=\\dfrac{${c2.n}}{${c2.d}}$, $\\cos\\varphi=${cosT}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) $N$ — точка пересечения медиан треугольника $SBD$', formula: 'SN:NO=2:1' },
      { slovo: 'а) Подобие при параллельной прямой', formula: AC ? 'AP:PC=2:1' : 'SQ:QA=1:2' },
      { slovo: 'б) Векторы в координатах', formula: `\\vec u=(a;\\,-2a;\\,h),\\ \\vec v=${v.v}` },
      { slovo: 'б) Косинус угла', formula: otv },
    ],
    kontrol: { cos: surdToNumber(cos), ugol: Math.acos(Math.sqrt(toNumber(c2))) },
  };
}

export const F15_PIRAMIDA_MEDIANY: Shablon2<PF15> = {
  no: 15,
  prototip:
    'Пирамида с высотой-ребром: точка пересечения медиан, параллельная прямая, угол между прямыми',
  sobrat,
};
