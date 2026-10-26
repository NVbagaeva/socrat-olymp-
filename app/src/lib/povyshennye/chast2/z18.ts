/**
 * №18: в пятиугольник ABCDE вписана окружность с центром O; ABDE —
 * равнобедренная трапеция с основаниями AE < BD; P — точка касания с AE.
 * а) C, O, P на одной прямой. б) Площадь ABCDE по AE, BD, AB.
 *
 * AE = 2e, BD = 2b, AB = l, (b − e, h, l) — пифагорова тройка: высота
 * трапеции целая. Радиус r = e(l + d)/h (d = b − e), O лежит внутри
 * трапеции (r < h), C — за прямой BD. Все величины рациональны: tg углов
 * и площадь считаются дробями.
 *
 * Чертежи — к решению (в условии, как на экзамене, чертежа нет).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element, Scena } from '@/lib/planimetriya/types';
import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface P18 {
  e: number;
  b: number;
  l: number;
  /**
   * Что дано в пункте б: BD (вариант 1) или радиус окружности ω
   * (вариант 2: AE, AB и r — BD и высоту ученик находит сам).
   */
  dano?: 'BD' | 'r';
}

export function chisla18(p: P18) {
  const d = p.b - p.e;
  const h = Math.sqrt(p.l * p.l - d * d);
  if (!Number.isInteger(h)) throw new Error('z18: высота трапеции не целая');
  const r = rat(p.e * (p.l + d), h);
  const om = sub(rat(h), r);
  const bg = p.l - p.e;
  const t1 = div(r, rat(bg));
  const t2 = div(om, rat(p.b));
  const tg = div(sub(t1, t2), add(rat(1), mul(t1, t2)));
  const cm = mul(rat(p.b), tg);
  const sTrap = rat((p.e + p.b) * h);
  const sBcd = mul(rat(p.b), cm);
  const s = add(sTrap, sBcd);
  return { d, h, r, om, bg, t1, t2, tg, cm, sTrap, sBcd, s };
}

const n = (x: Rat) => toNumber(x);

/**
 * Этапы «высота и радиус», когда дан радиус (вариант 2): из
 * tg∠OAP = r/AP находим угол трапеции, затем высоту и BD.
 */
function etapyPoR(p: P18, c: ReturnType<typeof chisla18>, risunok: string) {
  const r = ratTex(c.r);
  const e2 = rat(p.e * p.e);
  const r2 = mul(c.r, c.r);
  const cos = div(sub(r2, e2), add(r2, e2));
  const sin = div(mul(rat(2 * p.e), c.r), add(r2, e2));
  return [
    {
      title: 'б) Угол трапеции из радиуса',
      risunok,
      lines: [
        `$OP\\perp AE$ — {{t:kasatelnaya-radius|радиус в точку касания перпендикулярен касательной}}, $AP=\\dfrac{AE}{2}=${p.e}$, поэтому $\\operatorname{tg}\\angle OAP=\\dfrac{OP}{AP}=\\dfrac{${r}}{${p.e}}$.`,
        `$AO$ — {{t:centr-v-ugle|биссектриса угла}} $BAE$, $\\angle BAE=180^\\circ-\\angle ABD$, поэтому $\\angle OAP=90^\\circ-\\dfrac{\\angle ABD}{2}$ и $\\operatorname{tg}\\dfrac{\\angle ABD}{2}=\\dfrac{${p.e}}{${r}}$.`,
        `Отсюда $\\cos\\angle ABD=\\dfrac{1-\\operatorname{tg}^2\\frac{\\angle ABD}{2}}{1+\\operatorname{tg}^2\\frac{\\angle ABD}{2}}=${ratTex(cos)}$, $\\sin\\angle ABD=${ratTex(sin)}$.`,
      ],
    },
    {
      title: 'б) Высота и большее основание',
      lines: [
        `Высота трапеции $h=AB\\cdot\\sin\\angle ABD=${p.l}\\cdot${ratTex(sin)}=${c.h}$, проекция боковой стороны на $BD$ равна $AB\\cdot\\cos\\angle ABD=${c.d}$, поэтому $BD=AE+2\\cdot${c.d}=${2 * p.b}$.`,
        `$r<h$, поэтому $O$ лежит внутри трапеции; пусть $M$ — середина $BD$, тогда $OM=h-r=${ratTex(c.om)}$.`,
      ],
    },
  ];
}

/** Чертёж к решению: пункт а — касательные отрезки и ось; б — углы при B. */
function chertezh(p: P18, punkt: 'a' | 'b'): string {
  const c = chisla18(p);
  const r = n(c.r);
  const yC = c.h + n(c.cm);
  const kas = (x1: number, y1: number, x2: number, y2: number): [number, number] => {
    /* Основание перпендикуляра из O(0; r) на прямую через две точки. */
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = ((0 - x1) * dx + (r - y1) * dy) / (dx * dx + dy * dy);
    return [x1 + t * dx, y1 + t * dy];
  };
  const A: [number, number] = [-p.e, 0];
  const E: [number, number] = [p.e, 0];
  const B: [number, number] = [-p.b, c.h];
  const D: [number, number] = [p.b, c.h];
  const C: [number, number] = [0, yC];
  const tochki: Scena['tochki'] = {
    A,
    B,
    C,
    D,
    E,
    O: [0, r],
    P: [0, 0],
    F: kas(...A, ...B),
    G: kas(...B, ...C),
    N: kas(...C, ...D),
    K: kas(...D, ...E),
    M: [0, c.h],
  };
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D', 'E'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'B', b: 'D' },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'P' },
    { tip: 'otrezok', a: 'P', b: 'C', stil: 'punktir', sloy: 'reshenie' },
  ];
  if (punkt === 'a') {
    for (const t of ['F', 'G', 'N', 'K'] as const) el.push({ tip: 'tochka', t, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'B', b: 'F', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'K', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'B', b: 'G', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'N', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'tochka', t: 'G', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'M', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'B', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'G', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'A', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'O', v: 'G', b: 'B', pryamoy: true, sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'C', v: 'M', b: 'B', pryamoy: true, sloy: 'reshenie' });
  }
  const scena: Scena = {
    tochki,
    okruzhnosti: { w: { centr: 'O', radius: r } },
    elementy: el,
    podpisi:
      punkt === 'a'
        ? ['A', 'B', 'C', 'D', 'E', 'O', 'P', 'F', 'G', 'N', 'K']
        : ['A', 'B', 'C', 'D', 'E', 'O', 'P', 'G', 'M'],
    proverki: [{ naPryamoy: ['C', 'O', 'P'] }],
  };
  return renderPlan(scena, {
    rezhim: { rezhim: 'uchitel' },
    shirina: 260,
    vysota: 260,
    alt: 'Пятиугольник ABCDE с вписанной окружностью, ось симметрии CP',
  });
}

export function chertezh18(p: P18, punkt: 'a' | 'b'): string {
  return chertezh(p, punkt);
}

function sobrat(p: P18): Chast2Zadacha {
  const c = chisla18(p);
  if (!(n(c.r) < c.h) || !(n(c.tg) > 0) || p.l <= p.e)
    throw new Error('z18: конфигурация вырождена');
  const AE = 2 * p.e;
  const BD = 2 * p.b;
  const uslovie =
    `В пятиугольник $ABCDE$ вписана окружность $\\omega$ с центром $O$. Четырёхугольник $ABDE$ — равнобедренная трапеция с большим основанием $BD$; $P$ — точка касания окружности $\\omega$ со стороной $AE$.\n` +
    `а) Докажите, что точки $C$, $O$ и $P$ лежат на одной прямой.\n` +
    (p.dano === 'r'
      ? `б) Найдите площадь пятиугольника $ABCDE$, если $AE=${AE}$, $AB=${p.l}$, а радиус окружности $\\omega$ равен $${ratTex(c.r)}$.`
      : `б) Найдите площадь пятиугольника $ABCDE$, если $AE=${AE}$, $BD=${BD}$, $AB=${p.l}$.`);
  const S = ratTex(c.s);
  const r = ratTex(c.r);
  const tgA = ratTex(rat(p.l + c.d, c.h));

  return {
    no: 18,
    shablon: 'z18.pyatiugolnik',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Площадь',
        pole: { vid: 'chislo', verno: S.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${S}$`,
    reshenie: [
      {
        title: 'а) Центр лежит на оси трапеции',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $F$, $G$, $N$, $K$ — точки касания $\\omega$ со сторонами $AB$, $BC$, $CD$, $DE$.`,
          `Окружность $\\omega$ касается прямых $BA$ и $DE$, то есть вписана в угол между ними, и {{t:centr-v-ugle|её центр лежит на биссектрисе этого угла}}. У равнобедренной трапеции эта биссектриса — {{t:ravnobedr-trapeciya-os|ось симметрии}}: прямая через середины оснований, перпендикулярная им. Значит, $O$ лежит на оси трапеции.`,
          `{{t:kasatelnaya-radius|Радиус в точку касания перпендикулярен касательной}}: $OP\\perp AE$. Ось тоже проходит через $O$ перпендикулярно $AE$, поэтому $P$ лежит на оси — это середина $AE$.`,
        ],
      },
      {
        title: 'а) Точка $C$ тоже на оси',
        lines: [
          `{{t:kasatelnye-otrezki|Отрезки касательных из одной точки равны}}: $AF=AP=PE=EK$. Тогда $BF=AB-AF=ED-EK=DK$.`,
          `Далее $BG=BF=DK=DN$ и $CG=CN$, поэтому $BC=BG+GC=DN+NC=DC$.`,
          `Точка $C$ равноудалена от $B$ и $D$, значит, {{t:seredinnyy-perp|лежит на серединном перпендикуляре}} к $BD$ — это та же ось. Итак, $C$, $O$ и $P$ лежат на оси трапеции, то есть на одной прямой.`,
        ],
      },
      ...(p.dano === 'r'
        ? etapyPoR(p, c, chertezh(p, 'b'))
        : [
            {
              title: 'б) Высота трапеции',
              lines: [
                `Проекция боковой стороны на большее основание равна $\\dfrac{BD-AE}{2}=${c.d}$. По {{t:pifagor|теореме Пифагора}} высота трапеции $h=\\sqrt{${p.l}^2-${c.d}^2}=${c.h}$, $\\cos\\angle ABD=\\dfrac{${c.d}}{${p.l}}$.`,
              ],
            },
            {
              title: 'б) Радиус окружности',
              risunok: chertezh(p, 'b'),
              lines: [
                `$AO$ — {{t:centr-v-ugle|биссектриса угла}} $BAE$, а $\\angle BAE=180^\\circ-\\angle ABD$ (углы при боковой стороне трапеции). Поэтому $\\operatorname{tg}\\angle OAP=\\operatorname{tg}\\left(90^\\circ-\\dfrac{\\angle ABD}{2}\\right)=\\sqrt{\\dfrac{1+\\cos\\angle ABD}{1-\\cos\\angle ABD}}=\\sqrt{\\dfrac{${p.l + c.d}}{${p.l - c.d}}}=${tgA}$.`,
                `В прямоугольном треугольнике $AOP$: $r=OP=AP\\cdot\\operatorname{tg}\\angle OAP=${p.e}\\cdot${tgA}=${r}$.`,
                `$r<h=${c.h}$, поэтому $O$ лежит внутри трапеции; пусть $M$ — середина $BD$, тогда $OM=h-r=${ratTex(c.om)}$.`,
              ],
            },
          ]),
      {
        title: 'б) Угол CBD',
        lines: [
          `$BG=BF=AB-AF=${p.l}-${p.e}=${c.bg}$. $BO$ — биссектриса угла $ABC$, $OG\\perp BC$, поэтому $\\operatorname{tg}\\angle OBG=\\dfrac{OG}{BG}=\\dfrac{${r}}{${c.bg}}=${ratTex(c.t1)}$.`,
          `В треугольнике $OMB$: $\\operatorname{tg}\\angle OBM=\\dfrac{OM}{MB}=${ratTex(c.t2)}$.`,
          `$\\angle CBD=\\angle OBG-\\angle OBM$, по формуле тангенса разности $\\operatorname{tg}\\angle CBD=\\dfrac{${ratTex(c.t1)}-${ratTex(c.t2)}}{1+${ratTex(c.t1)}\\cdot${ratTex(c.t2)}}=${ratTex(c.tg)}$.`,
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          `$CM\\perp BD$ (ось), $CM=MB\\cdot\\operatorname{tg}\\angle CBD=${p.b}\\cdot${ratTex(c.tg)}=${ratTex(c.cm)}$.`,
          `$S_{ABDE}=\\dfrac{AE+BD}{2}\\cdot h=${ratTex(c.sTrap)}$, $S_{BCD}=\\dfrac12\\,BD\\cdot CM=${ratTex(c.sBcd)}$.`,
          `$S_{ABCDE}=${ratTex(c.sTrap)}+${ratTex(c.sBcd)}=${S}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Центр окружности, вписанной в угол между боковыми сторонами, — на оси трапеции',
        formula: 'O\\in\\text{оси}',
      },
      { slovo: 'Отрезки касательных равны, поэтому $BC=DC$ и $C$ — на оси', formula: 'BC=DC' },
      ...(p.dano === 'r'
        ? [
            {
              slovo: 'Угол трапеции — через радиус: $\\operatorname{tg}$ половины угла',
              formula: `\\operatorname{tg}\\dfrac{\\angle ABD}{2}=\\dfrac{${p.e}}{${r}}`,
            },
            { slovo: 'Высота и большее основание', formula: `h=${c.h},\\ BD=${2 * p.b}` },
          ]
        : [
            { slovo: 'Высота трапеции по теореме Пифагора', formula: `h=${c.h}` },
            { slovo: 'Радиус — через половину угла при основании', formula: `r=${r}` },
          ]),
      {
        slovo: 'Тангенс угла CBD — как тангенс разности',
        formula: `\\operatorname{tg}\\angle CBD=${ratTex(c.tg)}`,
      },
      { slovo: 'Площадь — трапеция плюс треугольник BCD', formula: `S=${S}` },
    ],
    kontrol: { S: n(c.s), r: n(c.r), h: c.h, cm: n(c.cm) },
  };
}

export const Z18_PYATIUGOLNIK: Shablon2<P18> = {
  no: 18,
  prototip: 'Пятиугольник с вписанной окружностью и равнобедренной трапецией; площадь',
  sobrat,
};
