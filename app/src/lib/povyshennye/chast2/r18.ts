/**
 * №18 (варианты 31–36), свои задачи раздела. Три конфигурации:
 *   rombMediana — ромб ABCD с диагоналями AC = d₁, BD = d₂, M — середина
 *                 BC, K = AM ∩ BD: а) BK : KD = 1 : 2 (K — точка
 *                 пересечения медиан треугольника ABC); б) AK² = (9d₁² + d₂²)/36;
 *   vpisPryam   — прямоугольный треугольник ABC (∠C = 90°), вписанная
 *                 окружность касается гипотенузы в T, AT = m, BT = n:
 *                 а) S = mn; б) r из r² + (m + n)r − mn = 0;
 *   trapBiss    — трапеция ABCD (AD ∥ BC), биссектрисы углов A и B
 *                 пересекаются в P, AP = p, BP = q: а) ∠APB = 90°;
 *                 б) высота трапеции 2pq/√(p² + q²).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export type PR18 =
  | { vid: 'rombMediana'; d1: number; d2: number }
  | { vid: 'vpisPryam'; m: number; n: number }
  | { vid: 'trapBiss'; p: number; q: number };

type P2 = [number, number];

export function chislaR18(p: PR18) {
  if (p.vid === 'rombMediana') {
    const AK2 = rat(9 * p.d1 * p.d1 + p.d2 * p.d2, 36);
    const AM2 = rat(9 * p.d1 * p.d1 + p.d2 * p.d2, 16);
    return { AM2, otv2: AK2, otv: surdTex(sqrtRat(AK2)), num: surdToNumber(sqrtRat(AK2)) };
  }
  if (p.vid === 'vpisPryam') {
    const s = p.m + p.n;
    const D = s * s + 4 * p.m * p.n;
    const k = Math.round(Math.sqrt(D));
    if (k * k !== D) throw new Error('r18: дискриминант не квадрат');
    const r = rat(k - s, 2);
    if (!(toNumber(r) > 0)) throw new Error('r18: r');
    return { r, D, k, otv2: mul(r, r), otv: ratTex(r), num: toNumber(r) };
  }
  const AB2 = rat(p.p * p.p + p.q * p.q);
  /* h = 2pq/AB, h² = 4p²q²/AB². */
  const h2 = div(rat(4 * p.p * p.p * p.q * p.q), AB2);
  return { AB2, otv2: h2, otv: surdTex(sqrtRat(h2)), num: surdToNumber(sqrtRat(h2)) };
}

function chertezh(p: PR18, punkt: 'a' | 'b'): string {
  let tochki: Record<string, P2>;
  let el: Element[];
  let podpisi: string[];
  let okr: Record<string, { centr: string; radius: number }> | undefined;
  let alt: string;
  if (p.vid === 'rombMediana') {
    const a = p.d1 / 2;
    const b = p.d2 / 2;
    const s = 3 / Math.max(a, b);
    const A: P2 = [-a * s, 0];
    const C: P2 = [a * s, 0];
    const B: P2 = [0, b * s];
    const D: P2 = [0, -b * s];
    const M: P2 = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
    const K: P2 = [0, (b * s) / 3];
    tochki = { A, B, C, D, M, K, O: [0, 0] };
    el = [
      { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
      { tip: 'otrezok', a: 'B', b: 'D' },
      { tip: 'otrezok', a: 'A', b: 'M' },
      { tip: 'tochka', t: 'K' },
      { tip: 'tochka', t: 'M' },
    ];
    if (punkt === 'a')
      el.push({ tip: 'otrezok', a: 'A', b: 'C', stil: 'punktir', sloy: 'reshenie' });
    else el.push({ tip: 'otrezok', a: 'A', b: 'C', sloy: 'reshenie' });
    podpisi = ['A', 'B', 'C', 'D', 'M', 'K', 'O'];
    alt = 'Ромб ABCD, отрезок AM к середине стороны BC и диагональ BD';
  } else if (p.vid === 'vpisPryam') {
    const ch = chislaR18(p) as { r: Rat };
    const r = toNumber(ch.r);
    const a = p.m + r;
    const b = p.n + r;
    const s = 5 / Math.max(a, b);
    const C: P2 = [0, 0];
    const A: P2 = [0, a * s];
    const B: P2 = [b * s, 0];
    const I: P2 = [r * s, r * s];
    /* T — точка касания на AB: AT = m. */
    const AB = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const t = (p.m * s) / AB;
    const T: P2 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    tochki = { A, B, C, I, T, E: [0, r * s], F: [r * s, 0] };
    okr = { w: { centr: 'I', radius: r * s } };
    el = [
      { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
      { tip: 'okruzhnost', okr: 'w' },
      { tip: 'tochka', t: 'T' },
    ];
    if (punkt === 'b') {
      el.push({ tip: 'otrezok', a: 'I', b: 'E', stil: 'punktir', sloy: 'reshenie' });
      el.push({ tip: 'otrezok', a: 'I', b: 'F', stil: 'punktir', sloy: 'reshenie' });
      el.push({ tip: 'otrezok', a: 'I', b: 'T', stil: 'punktir', sloy: 'reshenie' });
    }
    podpisi = punkt === 'b' ? ['A', 'B', 'C', 'T', 'I', 'E', 'F'] : ['A', 'B', 'C', 'T'];
    alt = 'Прямоугольный треугольник ABC и вписанная окружность';
  } else {
    const AB = Math.hypot(p.p, p.q);
    const al = Math.atan2(p.q, p.p);
    const s = 4 / AB;
    const A: P2 = [0, 0];
    const B: P2 = [AB * s * Math.cos(2 * al), AB * s * Math.sin(2 * al)];
    const P: P2 = [p.p * s * Math.cos(al), p.p * s * Math.sin(al)];
    /* Q = AP ∩ BC; C ставим правее Q, чтобы подписи не слились. */
    const Qx = P[0] * (B[1] / P[1]);
    const C: P2 = [Math.max(B[0] + AB * s * 0.9, Qx + AB * s * 0.45), B[1]];
    const D: P2 = [C[0] + AB * s * 0.7, 0];
    tochki = { A, B, C, D, P };
    el = [
      { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
      { tip: 'otrezok', a: 'A', b: 'P' },
      { tip: 'otrezok', a: 'B', b: 'P' },
    ];
    if (punkt === 'a') {
      /* Q = AP ∩ BC. */
      const tq = B[1] / P[1];
      tochki.Q = [P[0] * tq, B[1]];
      el.push({ tip: 'otrezok', a: 'P', b: 'Q', stil: 'punktir', sloy: 'reshenie' });
    }
    podpisi = punkt === 'a' ? ['A', 'B', 'C', 'D', 'P', 'Q'] : ['A', 'B', 'C', 'D', 'P'];
    alt = 'Трапеция и биссектрисы двух углов при боковой стороне';
  }
  return renderPlan(
    { tochki, ...(okr ? { okruzhnosti: okr } : {}), elementy: el, podpisi },
    { rezhim: { rezhim: 'uchitel' }, shirina: 300, vysota: 220, alt },
  );
}

function sobrat(p: PR18): Chast2Zadacha {
  const ch = chislaR18(p);
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  let podpis = '';
  if (p.vid === 'rombMediana') {
    const c = ch as { AM2: Rat };
    podpis = 'AK';
    uslovie =
      `Диагонали ромба $ABCD$ равны $AC=${p.d1}$ и $BD=${p.d2}$. Точка $M$ — середина стороны $BC$, отрезок $AM$ пересекает диагональ $BD$ в точке $K$.\n` +
      'а) Докажите, что $BK:KD=1:2$.\n' +
      'б) Найдите $AK$.';
    reshenie = [
      {
        title: 'а) Доказательство',
        risunok: chertezh(p, 'a'),
        lines: [
          'Пусть $O$ — точка пересечения диагоналей. {{t:romb-diagonali|Диагонали ромба точкой пересечения делятся пополам}}, поэтому $BO$ — медиана треугольника $ABC$; $AM$ — тоже медиана.',
          '{{t:mediany-2-1|Медианы пересекаются в одной точке и делятся ею в отношении $2:1$}} от вершины: $BK=\\dfrac23BO=\\dfrac13BD$, $KD=\\dfrac23BD$, то есть $BK:KD=1:2$.',
        ],
      },
      {
        title: 'б) Длина медианы',
        risunok: chertezh(p, 'b'),
        lines: [
          `{{t:romb-diagonali|Диагонали ромба перпендикулярны}}. Введём координаты с началом в $O$: $A\\left(-${ratTex(rat(p.d1, 2))};0\\right)$, $B\\left(0;${ratTex(rat(p.d2, 2))}\\right)$, $C\\left(${ratTex(rat(p.d1, 2))};0\\right)$, $M\\left(${ratTex(rat(p.d1, 4))};${ratTex(rat(p.d2, 4))}\\right)$.`,
          `{{t:pifagor|По теореме Пифагора}} $AM^2=\\left(${ratTex(rat(3 * p.d1, 4))}\\right)^2+\\left(${ratTex(rat(p.d2, 4))}\\right)^2=${ratTex(c.AM2)}$.`,
        ],
      },
      {
        title: 'б) Ответ',
        lines: [
          `{{t:mediany-2-1|$K$ делит медиану $AM$ в отношении $2:1$}}: $AK=\\dfrac23AM$, $AK^2=\\dfrac49\\cdot${ratTex(c.AM2)}=${ratTex(ch.otv2)}$, $AK=${ch.otv}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Две медианы треугольника ABC', formula: 'BO,\\ AM' },
      { slovo: 'Точка пересечения медиан', formula: 'BK=\\tfrac13BD' },
      { slovo: 'Координаты и теорема Пифагора', formula: `AM^2=${ratTex(c.AM2)}` },
      { slovo: 'Ответ', formula: `AK=${ch.otv}` },
    ];
  } else if (p.vid === 'vpisPryam') {
    const c = ch as { r: Rat; k: number };
    const s = p.m + p.n;
    podpis = 'Радиус';
    uslovie =
      `Окружность, вписанная в прямоугольный треугольник $ABC$ с прямым углом $C$, касается гипотенузы $AB$ в точке $T$, причём $AT=${p.m}$, $BT=${p.n}$.\n` +
      `а) Докажите, что площадь треугольника $ABC$ равна $AT\\cdot BT$.\n` +
      'б) Найдите радиус вписанной окружности.';
    reshenie = [
      {
        title: 'а) Катеты',
        risunok: chertezh(p, 'b'),
        lines: [
          'Пусть $I$ — центр окружности, $r$ — радиус, $E$ и $F$ — точки касания с катетами $AC$ и $BC$. {{t:kasatelnaya-radius|Радиусы в точки касания перпендикулярны касательным}}, поэтому $IECF$ — квадрат со стороной $r$, $CE=CF=r$.',
          '{{t:kasatelnye-otrezki|Отрезки касательных из одной точки равны}}: $AE=AT=m$, $BF=BT=n$ (здесь $m=AT$, $n=BT$). Значит, $AC=m+r$, $BC=n+r$.',
        ],
      },
      {
        title: 'а) Площадь',
        lines: [
          '{{t:pifagor|По теореме Пифагора}} $(m+r)^2+(n+r)^2=(m+n)^2$, откуда $r^2+(m+n)r=mn$.',
          '{{t:ploshchad-treugolnika|Площадь}} $S=\\dfrac12(m+r)(n+r)=\\dfrac12\\left(mn+(m+n)r+r^2\\right)=\\dfrac12(mn+mn)=mn$, что и требовалось.',
        ],
      },
      {
        title: 'б) Радиус',
        lines: [
          `$r^2+${s}r-${p.m * p.n}=0$: $r=\\dfrac{-${s}+\\sqrt{${s * s}+${4 * p.m * p.n}}}{2}=\\dfrac{-${s}+${c.k}}{2}=${ch.otv}$ (второй корень отрицателен).`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Квадрат у прямого угла', formula: 'CE=CF=r' },
      { slovo: 'Отрезки касательных', formula: 'AC=m+r,\\ BC=n+r' },
      { slovo: 'Теорема Пифагора', formula: 'r^2+(m+n)r=mn' },
      { slovo: 'Ответ', formula: `r=${ch.otv}` },
    ];
  } else {
    const c = ch as { AB2: Rat };
    podpis = 'Высота трапеции';
    uslovie =
      `Биссектрисы углов $A$ и $B$ трапеции $ABCD$ с основаниями $AD$ и $BC$ пересекаются в точке $P$, причём $AP=${p.p}$, $BP=${p.q}$.\n` +
      'а) Докажите, что угол $APB$ прямой.\n' +
      'б) Найдите высоту трапеции.';
    reshenie = [
      {
        title: 'а) Доказательство',
        risunok: chertezh(p, 'a'),
        lines: [
          'Пусть прямая $AP$ пересекает прямую $BC$ в точке $Q$. {{t:nakrest-ugly|Накрест лежащие углы при параллельных}} $AD$ и $BC$ равны: $\\angle BQA=\\angle QAD=\\angle BAQ$ ($AQ$ — биссектриса).',
          '{{t:ravnobedr-ugly|Треугольник $ABQ$ с равными углами при основании $AQ$ равнобедренный}}: $BA=BQ$. В нём $BP$ — биссектриса угла при вершине, и {{t:ravnobedr-vysota|она же высота}}: $BP\\perp AQ$, $\\angle APB=90^\\circ$.',
        ],
      },
      {
        title: 'б) Расстояние от $P$ до сторон',
        risunok: chertezh(p, 'b'),
        lines: [
          '{{t:bissektrisa-gmt|Точка биссектрисы угла равноудалена от его сторон}}: $P$ на биссектрисе угла $A$, поэтому равноудалена от $AD$ и $AB$; на биссектрисе угла $B$ — от $AB$ и $BC$. Значит, $P$ находится на расстоянии $h_P$ от всех трёх прямых, а высота трапеции равна $2h_P$.',
          `$h_P$ — {{t:vysota-pryamougolnogo|высота прямоугольного треугольника}} $APB$, проведённая к гипотенузе: $AB^2=${p.p * p.p}+${p.q * p.q}=${ratTex(c.AB2)}$ ({{t:pifagor|по теореме Пифагора}}), $h_P=\\dfrac{AP\\cdot BP}{AB}$.`,
        ],
      },
      {
        title: 'б) Ответ',
        lines: [
          `Высота трапеции $2h_P=\\dfrac{2\\cdot${p.p}\\cdot${p.q}}{AB}$, её квадрат равен $${ratTex(ch.otv2)}$, высота равна $${ch.otv}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Равнобедренный треугольник ABQ', formula: 'BA=BQ' },
      { slovo: 'Биссектриса — высота', formula: '\\angle APB=90^\\circ' },
      { slovo: '$P$ равноудалена от трёх сторон', formula: 'h=2h_P' },
      { slovo: 'Ответ', formula: ch.otv },
    ];
  }
  void add;
  void sub;
  return {
    no: 18,
    shablon: 'r18.planimetriya',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis, pole: { vid: 'chislo', verno: ch.otv.replace(/\\dfrac/g, '\\frac') } },
    ],
    otvet: `б) $${ch.otv}$`,
    reshenie,
    razbor,
    kontrol: { otv: ch.num, otv2: toNumber(ch.otv2) },
  };
}

export const R18_PLANIMETRIYA: Shablon2<PR18> = {
  no: 18,
  prototip:
    'Планиметрия: медиана ромба к середине стороны; вписанная окружность прямоугольного треугольника (S = AT·BT); биссектрисы углов трапеции при боковой стороне',
  sobrat,
};
