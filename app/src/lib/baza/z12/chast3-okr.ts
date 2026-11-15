/**
 * База №12, часть 3: центральные и вписанные углы, диаметр и хорды
 * (задачи 371–438 задачника, прототипы P77–P86).
 *
 * Окружность на чертеже — радиуса 5 с центром O в начале координат,
 * точки ставятся по полярному углу (градусы против часовой стрелки).
 */

import {
  duga,
  gr,
  mn,
  okr,
  otr,
  pryam,
  scena as sc,
  tochka,
  ug,
} from '@/lib/planimetriya/stseny/dsl';
import type { Element, Scena, T2 } from '@/lib/planimetriya/types';
import { tex } from '../chisla';
import {
  RAD,
  drob,
  izFloat,
  kor,
  korChertezh,
  korKv,
  num,
  type PrototipChasti3,
  q,
  qDiv,
  qKoren,
  qTex,
  qZapis,
  rasst,
  sobrat,
  ugolMezhdu,
  v$,
  vopros,
  zazhat,
} from './chast3-obshchee';

const VGRADUSAH = 'Ответ дайте в градусах.';
const OKR = { w: { centr: 'O', radius: 5 } } as const;
const O0: T2 = [0, 0];
/** Точка окружности радиуса r по полярному углу в градусах. */
const pt = (gradus: number, r = 5): T2 => [r * Math.cos(gradus * RAD), r * Math.sin(gradus * RAD)];
/** Градусы в TeX: «46{,}5^\circ». */
const grT = (x: number): string => `${tex(String(x).replace('.', ','))}^\\circ`;

const st = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie: zn,
});

/* ── P77. Диаметры AC и BD: угол AOD ↔ угол ACB ──────────────── */

/** Диаметры AC и BD, центральный угол AOD внизу. */
function diametry(aod: number): Record<string, T2> {
  return {
    O: O0,
    A: pt(270 - aod / 2),
    D: pt(270 + aod / 2),
    C: pt(90 - aod / 2),
    B: pt(90 + aod / 2),
  };
}

const P77 = sobrat({
  id: 'P77',
  gruppa: '3D',
  title: 'Диаметры $AC$ и $BD$: угол $AOD$ ↔ угол $ACB$',
  polya: ['v', 'u'],
  alt: 'Окружность с центром O и диаметрами AC и BD',
  text(p) {
    const u = num(p, 'u');
    return num(p, 'v') === 0
      ? `В окружности с центром $O$ отрезки $AC$ и $BD$ — диаметры. Центральный угол $AOD$ равен $${grT(u)}$. Найдите угол $ACB$. ${VGRADUSAH}`
      : `В окружности с центром $O$ отрезки $AC$ и $BD$ — диаметры. Вписанный угол $ACB$ равен $${grT(u)}$. Найдите угол $AOD$. ${VGRADUSAH}`;
  },
  solve(p) {
    const u = num(p, 'u');
    const v0 = num(p, 'v') === 0;
    const otvet = qZapis(v0 ? q(180 - u, 2) : q(180 - 2 * u));
    const ravnobedr =
      'Треугольник $BOC$ равнобедренный: $OB=OC$ — радиусы, поэтому $\\angle OBC=\\angle OCB$. Точка $O$ лежит на $AC$, значит $\\angle OCB=\\angle ACB$.';
    return {
      otvet,
      etapy: v0
        ? [
            {
              title: 'Вертикальные углы',
              lines: [`$\\angle BOC=\\angle AOD=${grT(u)}$ — вертикальные углы.`],
            },
            { title: 'Равнобедренный треугольник BOC', lines: [ravnobedr] },
            {
              title: 'Ответ',
              lines: [
                `$\\angle ACB=\\dfrac{180^\\circ-\\angle BOC}{2}=\\dfrac{180^\\circ-${grT(u)}}{2}=${tex(otvet)}^\\circ$.`,
              ],
            },
          ]
        : [
            { title: 'Равнобедренный треугольник BOC', lines: [ravnobedr] },
            {
              title: 'Угол BOC',
              lines: [
                `$\\angle BOC=180^\\circ-2\\cdot\\angle OCB=180^\\circ-2\\cdot ${grT(u)}=${grT(180 - 2 * u)}$.`,
              ],
            },
            {
              title: 'Вертикальные углы',
              lines: [`$\\angle AOD=\\angle BOC=${tex(otvet)}^\\circ$.`],
            },
          ],
      hints: [
        vopros(
          'Какой угол равен углу $AOD$?',
          '$\\angle BOC$',
          ['$\\angle AOB$', '$\\angle OCB$'],
          u,
          'Углы $AOD$ и $BOC$ вертикальные.',
        ),
        vopros(
          'Какой треугольник помогает связать углы?',
          'равнобедренный $BOC$',
          ['прямоугольный $AOD$', 'равносторонний $AOB$'],
          u + 1,
          '$OB$ и $OC$ — радиусы.',
        ),
      ],
    };
  },
  proverka(p) {
    const u = num(p, 'u');
    if (num(p, 'v') === 0) {
      const t = diametry(u);
      return izFloat(ugolMezhdu(t.A!, t.C!, t.B!));
    }
    /* C и A — концы диаметра, B — там, где вписанный угол ACB равен u. */
    const A = pt(180);
    const B = pt(180 - 2 * u);
    const D: T2 = [-B[0], -B[1]];
    return izFloat(ugolMezhdu(A, O0, D));
  },
  scena(p) {
    const u = num(p, 'u');
    const v0 = num(p, 'v') === 0;
    const aod0 = v0 ? u : 180 - 2 * u;
    const aod = zazhat(aod0, 36, 150);
    return sc(
      {
        tochki: diametry(aod),
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('A', 'C'),
          otr('B', 'D'),
          otr('C', 'B'),
          tochka('O'),
          ug('A', 'O', 'D', v0 ? { vydelit: 'dano', znachenie: gr(u) } : { vydelit: 'iskomoe' }),
          ug('A', 'C', 'B', v0 ? { vydelit: 'iskomoe' } : { vydelit: 'dano', znachenie: gr(u) }),
        ],
      },
      Math.abs(aod - aod0) > 1e-9,
    );
  },
});

/* ── P78. Диаметр AB, точки D и C по разные стороны ──────────── */

const P78 = sobrat({
  id: 'P78',
  gruppa: '3D',
  title: 'Диаметр $AB$: угол $DBA$ → угол $DCB$',
  polya: ['u'],
  alt: 'Окружность с диаметром AB и точками D и C по разные стороны от него',
  text(p) {
    return `На окружности по разные стороны от диаметра $AB$ отмечены точки $D$ и $C$. Известно, что $\\angle DBA=${grT(num(p, 'u'))}$. Найдите угол $DCB$. ${VGRADUSAH}`;
  },
  solve(p) {
    const u = num(p, 'u');
    const otvet = String(90 - u);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол, опирающийся на диаметр',
          lines: [
            'Вписанный угол $ADB$ опирается на диаметр $AB$, поэтому $\\angle ADB=90^\\circ$.',
            `В треугольнике $ABD$: $\\angle DAB=90^\\circ-\\angle DBA=90^\\circ-${grT(u)}=${grT(90 - u)}$.`,
          ],
        },
        {
          title: 'Углы на одну дугу',
          lines: [
            'Вписанные углы $DCB$ и $DAB$ опираются на одну дугу $DB$, поэтому они равны:',
            `$\\angle DCB=\\angle DAB=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $ADB$?',
          '$90^\\circ$',
          [`$${grT(u)}$`, '$180^\\circ$'],
          u,
          'Он опирается на диаметр.',
        ),
        vopros(
          'Какой угол равен углу $DCB$?',
          '$\\angle DAB$',
          ['$\\angle DBA$', '$\\angle ADB$'],
          u + 1,
          'Оба опираются на дугу $DB$.',
        ),
      ],
    };
  },
  proverka(p) {
    const u = num(p, 'u');
    const D = pt(180 - 2 * u);
    return izFloat(ugolMezhdu(D, pt(245), pt(0)));
  },
  scena(p) {
    const u0 = num(p, 'u');
    const u = zazhat(u0, 16, 74);
    return sc(
      {
        tochki: { O: O0, A: pt(180), B: pt(0), D: pt(180 - 2 * u), C: pt(245) },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('A', 'B'),
          otr('B', 'D'),
          otr('D', 'C'),
          otr('C', 'B'),
          ug('D', 'B', 'A', { vydelit: 'dano', znachenie: gr(u0) }),
          ug('D', 'C', 'B', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      },
      Math.abs(u - u0) > 1e-9,
    );
  },
});

/* ── P79. Вписанный четырёхугольник: ABC, ABD, CAD ───────────── */

/** Вершины по дугам DA и CD; обход A → B → C → D по часовой стрелке. */
function vpisannyy(da: number, cd: number): Record<string, T2> {
  const ost = 360 - da - cd;
  const a = 195;
  const b = a - ost / 2;
  const c = b - ost / 2;
  const d = c - cd;
  return { O: O0, A: pt(a), B: pt(b), C: pt(c), D: pt(d) };
}

const P79 = sobrat({
  id: 'P79',
  gruppa: '3D',
  title: 'Вписанный $ABCD$: $\\angle ABC$, $\\angle ABD$ и $\\angle CAD$',
  polya: ['v', 'x', 'y'],
  alt: 'Четырёхугольник ABCD, вписанный в окружность, с диагоналями',
  text(p) {
    const x = grT(num(p, 'x'));
    const y = grT(num(p, 'y'));
    return num(p, 'v') === 0
      ? `Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $${x}$, угол $CAD$ равен $${y}$. Найдите угол $ABD$. ${VGRADUSAH}`
      : `Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен $${x}$, угол $CAD$ равен $${y}$. Найдите угол $ABC$. ${VGRADUSAH}`;
  },
  solve(p) {
    const x = num(p, 'x');
    const y = num(p, 'y');
    const v0 = num(p, 'v') === 0;
    const otvet = String(v0 ? x - y : x + y);
    return {
      otvet,
      etapy: [
        {
          title: 'Углы на одну дугу',
          lines: [
            'Вписанные углы $DBC$ и $DAC$ опираются на одну дугу $CD$, поэтому',
            `$\\angle DBC=\\angle CAD=${grT(y)}$.`,
          ],
        },
        {
          title: 'Угол $B$ из двух частей',
          lines: [
            'Диагональ $BD$ делит угол $ABC$ на углы $ABD$ и $DBC$:',
            v0
              ? `$\\angle ABD=\\angle ABC-\\angle DBC=${grT(x)}-${grT(y)}=${tex(otvet)}^\\circ$.`
              : `$\\angle ABC=\\angle ABD+\\angle DBC=${grT(x)}+${grT(y)}=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какой угол равен углу $CAD$?',
          '$\\angle DBC$',
          ['$\\angle ABD$', '$\\angle ACD$'],
          x,
          'Оба вписанных угла опираются на дугу $CD$.',
        ),
        vopros(
          v0 ? 'Как найти угол $ABD$?' : 'Как найти угол $ABC$?',
          v0 ? '$\\angle ABC-\\angle DBC$' : '$\\angle ABD+\\angle DBC$',
          v0
            ? ['$\\angle ABC+\\angle DBC$', '$180^\\circ-\\angle ABC$']
            : ['$\\angle ABD-\\angle DBC$', '$180^\\circ-\\angle ABD$'],
          y,
        ),
      ],
    };
  },
  proverka(p) {
    const x = num(p, 'x');
    const y = num(p, 'y');
    if (num(p, 'v') === 0) {
      /* Дуга ADC = 2·ABC, из неё дуга CD = 2·CAD. */
      const t = vpisannyy(2 * x - 2 * y, 2 * y);
      return izFloat(ugolMezhdu(t.A!, t.B!, t.D!));
    }
    const t = vpisannyy(2 * x, 2 * y);
    return izFloat(ugolMezhdu(t.A!, t.B!, t.C!));
  },
  scena(p) {
    const x = num(p, 'x');
    const y = num(p, 'y');
    const v0 = num(p, 'v') === 0;
    const da0 = v0 ? 2 * (x - y) : 2 * x;
    const cd0 = 2 * y;
    const da = zazhat(da0, 50, 170);
    const cd = zazhat(cd0, 50, 310 - da);
    return sc(
      {
        tochki: vpisannyy(da, cd),
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C'),
          otr('B', 'D'),
          ug('C', 'A', 'D', { vydelit: 'dano', znachenie: gr(y) }),
          v0
            ? ug('A', 'B', 'D', { vydelit: 'iskomoe' })
            : ug('A', 'B', 'D', { vydelit: 'dano', znachenie: gr(x) }),
          ...(v0 ? [] : [ug('A', 'B', 'C', { vydelit: 'iskomoe', dugi: 2 as const })]),
        ],
        bezPodpisi: ['O'],
      },
      Math.abs(da - da0) + Math.abs(cd - cd0) > 1e-9,
    );
  },
});

/* ── P80. Вписанный угол на долю окружности ──────────────────── */

const P80 = sobrat({
  id: 'P80',
  gruppa: '3D',
  title: 'Вписанный угол на дугу $\\frac{p}{q}$ окружности',
  polya: ['p', 'q'],
  alt: 'Вписанный угол, опирающийся на выделенную дугу',
  text(p) {
    return `Найдите вписанный угол, опирающийся на дугу, длина которой равна $${drob(num(p, 'p'), num(p, 'q'))}$ длины окружности. ${VGRADUSAH}`;
  },
  solve(p) {
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const duga0 = q(360 * pp, qq);
    const otvet = qZapis(q(180 * pp, qq));
    return {
      otvet,
      etapy: [
        {
          title: 'Градусная мера дуги',
          lines: [
            'Вся окружность — $360^\\circ$, длина дуги пропорциональна её градусной мере:',
            `$360^\\circ\\cdot ${drob(pp, qq)}=${qTex(duga0)}^\\circ$.`,
          ],
        },
        {
          title: 'Вписанный угол',
          lines: [
            'Вписанный угол равен половине дуги, на которую он опирается:',
            `$\\dfrac{${qTex(duga0)}^\\circ}{2}=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Сколько градусов в дуге?',
          v$(`${qTex(duga0)}^\\circ`),
          [v$(`${qTex(q(180 * pp, qq))}^\\circ`), v$(`${qTex(q(100 * pp, qq))}^\\circ`)],
          qq,
          'Вся окружность — $360^\\circ$.',
        ),
        vopros(
          'Как вписанный угол связан с дугой?',
          'равен половине дуги',
          ['равен дуге', 'вдвое больше дуги'],
          pp,
        ),
      ],
    };
  },
  proverka(p) {
    const arc = (360 * num(p, 'p')) / num(p, 'q');
    return izFloat(ugolMezhdu(pt(270 - arc / 2), pt(90), pt(270 + arc / 2)));
  },
  scena(p) {
    const arc0 = (360 * num(p, 'p')) / num(p, 'q');
    const arc = zazhat(arc0, 40, 200);
    return sc(
      {
        tochki: { O: O0, A: pt(270 - arc / 2), B: pt(270 + arc / 2), C: pt(98) },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('C', 'A'),
          otr('C', 'B'),
          duga('w', 'A', 'B', { vydelit: 'dano' }),
          ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      Math.abs(arc - arc0) > 1e-9,
    );
  },
});

/* ── P81. Окружность, вписанная в угол ───────────────────────── */

/** Угол C (вершина в начале, сторона CB по оси x), центр O на биссектрисе. */
function vpisannayaVUgol(u: number): { t: Record<string, T2>; R: number } {
  const d = 10;
  const pol = (u / 2) * RAD;
  const O: T2 = [d * Math.cos(pol), d * Math.sin(pol)];
  const kas = d * Math.cos(pol);
  const R = d * Math.sin(pol);
  /* Стороны угла выходят за точки касания на радиус. */
  const dl = kas + R;
  return {
    t: {
      C: [0, 0],
      O,
      B: [kas, 0],
      A: [kas * Math.cos(u * RAD), kas * Math.sin(u * RAD)],
      E: [dl * Math.cos(u * RAD), dl * Math.sin(u * RAD)],
      F: [dl, 0],
    },
    R,
  };
}

const P81 = sobrat({
  id: 'P81',
  gruppa: '3D',
  title: 'Окружность, вписанная в угол $C$ → угол $AOB$',
  polya: ['u'],
  alt: 'Окружность с центром O, вписанная в угол C и касающаяся его сторон в точках A и B',
  text(p) {
    return `В угол $C$, равный $${grT(num(p, 'u'))}$, вписана окружность с центром $O$, которая касается сторон угла в точках $A$ и $B$. Найдите угол $AOB$. ${VGRADUSAH}`;
  },
  solve(p) {
    const u = num(p, 'u');
    const otvet = String(180 - u);
    return {
      otvet,
      etapy: [
        {
          title: 'Радиусы в точки касания',
          lines: [
            'Радиус, проведённый в точку касания, перпендикулярен касательной: $\\angle OAC=\\angle OBC=90^\\circ$.',
          ],
        },
        {
          title: 'Сумма углов четырёхугольника',
          lines: [
            'Сумма углов четырёхугольника $AOBC$ равна $360^\\circ$:',
            `$\\angle AOB=360^\\circ-90^\\circ-90^\\circ-${grT(u)}=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какой угол между радиусом $OA$ и стороной угла $CA$?',
          '$90^\\circ$',
          [`$${grT(u)}$`, `$${grT(u / 2)}$`],
          u,
          'Сторона угла — касательная к окружности.',
        ),
        vopros(
          'Чему равна сумма углов четырёхугольника $AOBC$?',
          '$360^\\circ$',
          ['$180^\\circ$', '$540^\\circ$'],
          u + 2,
        ),
      ],
    };
  },
  proverka(p) {
    const { t } = vpisannayaVUgol(num(p, 'u'));
    return izFloat(ugolMezhdu(t.A!, t.O!, t.B!));
  },
  scena(p) {
    const u0 = num(p, 'u');
    const u = zazhat(u0, 30, 132);
    const { t, R } = vpisannayaVUgol(u);
    return sc(
      {
        tochki: t,
        okruzhnosti: { w: { centr: 'O', radius: R } },
        elementy: [
          okr('w'),
          otr('C', 'E'),
          otr('C', 'F'),
          otr('O', 'A'),
          otr('O', 'B'),
          tochka('O'),
          pryam('O', 'A', 'C'),
          pryam('O', 'B', 'C'),
          ug('B', 'C', 'A', { vydelit: 'dano', znachenie: gr(u0) }),
          ug('A', 'O', 'B', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['E', 'F'],
      },
      Math.abs(u - u0) > 1e-9,
    );
  },
});

/* ── P82. Угол между пересекающимися хордами ─────────────────── */

/** Хорды AB и KM: обход A → K → B → M по часовой стрелке. */
function hordy(
  ak: number,
  bm: number,
): Record<string, T2 | { peresechenie: [[string, string], [string, string]] }> {
  const ost = (360 - ak - bm) / 2;
  const a = 120;
  const k = a - ak;
  const b = k - ost;
  const m = b - bm;
  return {
    O: O0,
    A: pt(a),
    K: pt(k),
    B: pt(b),
    M: pt(m),
    P: {
      peresechenie: [
        ['A', 'B'],
        ['K', 'M'],
      ],
    },
  };
}

const P82 = sobrat({
  id: 'P82',
  gruppa: '3D',
  title: 'Угол между пересекающимися хордами по двум дугам',
  polya: ['ak', 'bm'],
  alt: 'Окружность с пересекающимися хордами AB и KM',
  text(p) {
    return `В окружности проведены пересекающиеся хорды $AB$ и $KM$. Величина дуги $AK$ равна $${grT(num(p, 'ak'))}$, а величина дуги $BM$ равна $${grT(num(p, 'bm'))}$. Чему равен угол между хордами $AB$ и $KM$? ${VGRADUSAH}`;
  },
  solve(p) {
    const ak = num(p, 'ak');
    const bm = num(p, 'bm');
    const otvet = qZapis(q(ak + bm, 2));
    return {
      otvet,
      etapy: [
        {
          title: 'Вспомогательная хорда',
          lines: [
            'Пусть $P$ — точка пересечения хорд. Проведём хорду $AM$. Вписанные углы равны половинам дуг:',
            `$\\angle BAM=\\dfrac{${grT(bm)}}{2}=${grT(bm / 2)}$, $\\angle AMK=\\dfrac{${grT(ak)}}{2}=${grT(ak / 2)}$.`,
          ],
        },
        {
          title: 'Внешний угол треугольника',
          lines: [
            'Угол $APK$ — внешний угол треугольника $APM$, он равен сумме двух углов, не смежных с ним:',
            `$\\angle APK=${grT(bm / 2)}+${grT(ak / 2)}=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол между хордами?',
          '$\\dfrac{\\arc{AK}+\\arc{BM}}{2}$',
          ['$\\arc{AK}+\\arc{BM}$', '$\\dfrac{\\arc{BM}-\\arc{AK}}{2}$'],
          ak,
          'Угол между пересекающимися хордами — полусумма дуг, заключённых между его сторонами и их продолжениями.',
        ),
        vopros(
          'Чему равна сумма дуг $AK$ и $BM$?',
          v$(`${ak + bm}^\\circ`),
          [v$(`${Math.abs(ak - bm)}^\\circ`), v$(`${360 - ak - bm}^\\circ`)],
          bm,
        ),
      ],
    };
  },
  proverka(p) {
    const t = hordy(num(p, 'ak'), num(p, 'bm'));
    const A = t.A as T2;
    const B = t.B as T2;
    const K = t.K as T2;
    const M = t.M as T2;
    /* Пересечение хорд — решением системы в координатах. */
    const d = (B[0] - A[0]) * (M[1] - K[1]) - (B[1] - A[1]) * (M[0] - K[0]);
    const s = ((K[0] - A[0]) * (M[1] - K[1]) - (K[1] - A[1]) * (M[0] - K[0])) / d;
    const P: T2 = [A[0] + s * (B[0] - A[0]), A[1] + s * (B[1] - A[1])];
    return izFloat(ugolMezhdu(A, P, K));
  },
  scena(p) {
    const ak0 = num(p, 'ak');
    const bm0 = num(p, 'bm');
    const ak = zazhat(ak0, 40, 120);
    const bm = zazhat(bm0, 40, 120);
    return sc(
      {
        tochki: hordy(ak, bm) as Scena['tochki'],
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('A', 'B'),
          otr('K', 'M'),
          duga('w', 'K', 'A', { vydelit: 'dano', znachenie: gr(ak0) }),
          duga('w', 'M', 'B', { vydelit: 'dano', znachenie: gr(bm0) }),
          ug('A', 'P', 'K', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O', 'P'],
      },
      Math.abs(ak - ak0) + Math.abs(bm - bm0) > 1e-9,
    );
  },
});

/* ── Диаметр AB и точка C на окружности ──────────────────────── */

/** A слева, B справа на диаметре, C сверху: ∠ABC = beta. */
function sDiametrom(beta: number): Record<string, T2> {
  return { O: O0, A: pt(180), B: pt(0), C: pt(180 - 2 * beta) };
}
const PRYAMOY_C =
  'Вписанный угол $ACB$ опирается на диаметр $AB$, поэтому $\\angle ACB=90^\\circ$ и треугольник $ABC$ прямоугольный с гипотенузой $AB$.';

/* ── P83. Угол COB = 120°, AC → диаметр ──────────────────────── */

const P83 = sobrat({
  id: 'P83',
  gruppa: '3E',
  title: 'Диаметр $AB$, угол $COB=120^\\circ$ и $AC$ → диаметр',
  polya: ['ac'],
  alt: 'Окружность с центром O, диаметром AB и точкой C',
  text(p) {
    return `На окружности с центром $O$ и диаметром $AB$ отмечена точка $C$ так, что угол $COB$ равен $120^\\circ$, $AC=${num(p, 'ac')}$. Найдите диаметр окружности.`;
  },
  solve(p) {
    const ac = num(p, 'ac');
    const otvet = String(2 * ac);
    return {
      otvet,
      etapy: [
        {
          title: 'Треугольник AOC',
          lines: [
            'Углы $AOC$ и $COB$ смежные: $\\angle AOC=180^\\circ-120^\\circ=60^\\circ$.',
            '$OA=OC$ — радиусы, значит, треугольник $AOC$ равнобедренный с углом $60^\\circ$ при вершине, то есть равносторонний.',
          ],
        },
        {
          title: 'Диаметр',
          lines: [`$R=OA=AC=${ac}$, $AB=2R=2\\cdot ${ac}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $AOC$?',
          '$60^\\circ$',
          ['$120^\\circ$', '$30^\\circ$'],
          ac,
          'Углы $AOC$ и $COB$ смежные.',
        ),
        vopros(
          'Каков треугольник $AOC$?',
          'равносторонний',
          ['прямоугольный', 'тупоугольный'],
          ac + 1,
          'Он равнобедренный ($OA=OC$) с углом $60^\\circ$.',
        ),
      ],
    };
  },
  proverka(p) {
    /* Единичная окружность: AC при R = 1, затем масштаб. */
    const ac1 = rasst(pt(180, 1), pt(120, 1));
    return izFloat((2 * num(p, 'ac')) / ac1);
  },
  scena(p) {
    return {
      tochki: { O: O0, A: pt(180), B: pt(0), C: pt(120) },
      okruzhnosti: OKR,
      elementy: [
        okr('w'),
        tri0('A', 'C', 'B'),
        otr('O', 'C'),
        tochka('O'),
        st('A', 'C', String(num(p, 'ac'))),
        ug('C', 'O', 'B', { vydelit: 'dano', znachenie: gr(120) }),
        otr('A', 'B', { vydelit: 'iskomoe' }),
      ],
    };
  },
});

function tri0(a: string, b: string, c: string): Element {
  return mn([a, b, c]);
}

/* ── P84. Радиус и AC → хорда BC ─────────────────────────────── */

const P84 = sobrat({
  id: 'P84',
  gruppa: '3E',
  title: 'Диаметр $AB$: радиус и хорда $AC$ → хорда $BC$',
  polya: ['r', 'k', 'm'],
  alt: 'Окружность с диаметром AB и точкой C',
  text(p) {
    return `На окружности радиуса $${num(p, 'r')}$ отмечена точка $C$. Отрезок $AB$ — диаметр окружности, $AC=${kor(num(p, 'k'), num(p, 'm'))}$. Найдите длину хорды $BC$.`;
  },
  solve(p) {
    const r = num(p, 'r');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const ab = 2 * r;
    const bc2 = ab * ab - k * k * m;
    const otvet = qZapis(qKoren(q(bc2)));
    return {
      otvet,
      etapy: [
        { title: 'Прямой угол', lines: [PRYAMOY_C, `$AB=2R=2\\cdot ${r}=${ab}$.`] },
        {
          title: 'Теорема Пифагора',
          lines: [
            `$BC^2=AB^2-AC^2=${ab}^2-${korKv(k, m)}=${ab * ab}-${k * k * m}=${bc2}$.`,
            `$BC=\\sqrt{${bc2}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $ACB$?',
          '$90^\\circ$',
          ['$60^\\circ$', '$180^\\circ$'],
          r,
          'Он опирается на диаметр.',
        ),
        vopros(
          'Чему равна гипотенуза $AB$?',
          v$(ab),
          [v$(r), v$(r * r)],
          k + m,
          'Диаметр — два радиуса.',
        ),
      ],
    };
  },
  proverka(p) {
    const r = num(p, 'r');
    const ac = num(p, 'k') * Math.sqrt(num(p, 'm'));
    const beta = Math.asin(ac / (2 * r)) / RAD;
    return izFloat(rasst(pt(180 - 2 * beta, r), pt(0, r)));
  },
  scena(p) {
    const r = num(p, 'r');
    const ac = num(p, 'k') * Math.sqrt(num(p, 'm'));
    const b0 = Math.asin(Math.min(1, ac / (2 * r))) / RAD;
    const b = zazhat(b0, 18, 72);
    return sc(
      {
        tochki: sDiametrom(b),
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'C', 'B']),
          tochka('O'),
          st('O', 'B', String(r)),
          st('A', 'C', korChertezh(num(p, 'k'), num(p, 'm'))),
          otr('C', 'B', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      },
      Math.abs(b - b0) > 1e-9,
    );
  },
});

/* ── P85. Радиус и AC → cos∠BAC или sin∠ABC ──────────────────── */

const P85 = sobrat({
  id: 'P85',
  gruppa: '3E',
  title: 'Диаметр $AB$: радиус и $AC$ → $\\cos\\angle BAC$ или $\\sin\\angle ABC$',
  polya: ['v', 'r', 'ac'],
  alt: 'Окружность с диаметром AB и точкой C',
  text(p) {
    const f = num(p, 'v') === 0 ? '\\cos\\angle BAC' : '\\sin\\angle ABC';
    return `На окружности радиуса $${num(p, 'r')}$ отмечена точка $C$. Отрезок $AB$ — диаметр окружности, $AC=${num(p, 'ac')}$. Найдите $${f}$.`;
  },
  solve(p) {
    const r = num(p, 'r');
    const ac = num(p, 'ac');
    const kos = num(p, 'v') === 0;
    const f = kos ? '\\cos\\angle BAC' : '\\sin\\angle ABC';
    const otvet = qZapis(qDiv(q(ac), q(2 * r)));
    return {
      otvet,
      etapy: [
        { title: 'Прямой угол', lines: [PRYAMOY_C, `$AB=2R=${2 * r}$.`] },
        {
          title: 'Ответ',
          lines: [
            kos ? 'Катет $AC$ прилежит к углу $BAC$:' : 'Катет $AC$ лежит против угла $ABC$:',
            `$${f}=\\dfrac{AC}{AB}=\\dfrac{${ac}}{${2 * r}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $ACB$?',
          '$90^\\circ$',
          ['$45^\\circ$', '$180^\\circ$'],
          r,
          'Он опирается на диаметр.',
        ),
        vopros(
          `Чему равен $${f}$?`,
          `$\\dfrac{${ac}}{${2 * r}}$`,
          [`$\\dfrac{${ac}}{${r}}$`, `$\\dfrac{${2 * r}}{${ac}}$`],
          ac,
          'Гипотенуза — диаметр, он вдвое больше радиуса.',
        ),
      ],
    };
  },
  proverka(p) {
    const r = num(p, 'r');
    const beta = Math.asin(num(p, 'ac') / (2 * r)) / RAD;
    const A = pt(180, r);
    const B = pt(0, r);
    const C = pt(180 - 2 * beta, r);
    return izFloat(
      num(p, 'v') === 0 ? Math.cos(ugolMezhdu(B, A, C) * RAD) : Math.sin(ugolMezhdu(A, B, C) * RAD),
    );
  },
  scena(p) {
    const r = num(p, 'r');
    const ac = num(p, 'ac');
    const b0 = Math.asin(ac / (2 * r)) / RAD;
    const b = zazhat(b0, 18, 72);
    return sc(
      {
        tochki: sDiametrom(b),
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'C', 'B']),
          otr('A', 'B'),
          tochka('O'),
          st('O', 'B', String(r)),
          st('A', 'C', String(ac)),
          num(p, 'v') === 0
            ? ug('B', 'A', 'C', { vydelit: 'iskomoe' })
            : ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      },
      Math.abs(b - b0) > 1e-9,
    );
  },
});

/* ── P86. AC и BC → радиус ───────────────────────────────────── */

const P86 = sobrat({
  id: 'P86',
  gruppa: '3E',
  title: 'Диаметр $AB$: хорды $AC$ и $BC$ → радиус',
  polya: ['ac', 'bc'],
  alt: 'Окружность с диаметром AB и точкой C',
  text(p) {
    return `На окружности отмечена точка $C$. Отрезок $AB$ — диаметр окружности, $AC=${num(p, 'ac')}$, $BC=${num(p, 'bc')}$. Найдите радиус окружности.`;
  },
  solve(p) {
    const ac = num(p, 'ac');
    const bc = num(p, 'bc');
    const ab2 = ac * ac + bc * bc;
    const ab = qKoren(q(ab2));
    const otvet = qZapis(qDiv(ab, q(2)));
    return {
      otvet,
      etapy: [
        { title: 'Прямой угол', lines: [PRYAMOY_C] },
        {
          title: 'Диаметр по теореме Пифагора',
          lines: [`$AB^2=AC^2+BC^2=${ac * ac}+${bc * bc}=${ab2}$, $AB=${qTex(ab)}$.`],
        },
        {
          title: 'Радиус',
          lines: [`$R=\\dfrac{AB}{2}=\\dfrac{${qTex(ab)}}{2}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен диаметр $AB$?',
          v$(qTex(ab)),
          [v$(ac + bc), v$(qTex(qDiv(ab, q(2))))],
          ac,
          '$AB$ — гипотенуза прямоугольного треугольника $ABC$.',
        ),
        vopros('Как найти радиус?', '$\\dfrac{AB}{2}$', ['$AB$', '$2\\cdot AB$'], bc),
      ],
    };
  },
  proverka(p) {
    const ac = num(p, 'ac');
    const bc = num(p, 'bc');
    /* C в начале, катеты по осям; радиус — расстояние от середины AB до C. */
    const A: T2 = [ac, 0];
    const B: T2 = [0, bc];
    return izFloat(rasst([(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], [0, 0]));
  },
  scena(p) {
    const ac = num(p, 'ac');
    const bc = num(p, 'bc');
    const b0 = Math.atan2(ac, bc) / RAD;
    const b = zazhat(b0, 18, 72);
    return sc(
      {
        tochki: sDiametrom(b),
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'C', 'B']),
          tochka('O'),
          st('A', 'C', String(ac)),
          st('C', 'B', String(bc)),
          otr('O', 'B', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      },
      Math.abs(b - b0) > 1e-9,
    );
  },
});

export const PROTOTIPY_OKR: PrototipChasti3[] = [P77, P78, P79, P80, P81, P82, P83, P84, P85, P86];
