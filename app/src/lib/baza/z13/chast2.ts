/**
 * База, задание №13, часть 2: пирамида — объём, высота, боковая
 * поверхность (задачи 27–72 задачника, на сайте — только их аналоги).
 *
 * proverka считает ответ иначе, чем разбор: по координатам вершин
 * (смешанное произведение), формулой Герона или перебором.
 */

import { zapis } from '../chisla';
import type { GruppaBazy, Params, Prototip } from '../types';
import {
  $,
  blank,
  drob,
  sPravilnogo,
  izmereno,
  koren,
  num,
  prototip,
  t,
  tselyyKoren,
  vopros,
} from './obshchee';
import {
  risKubPiramida,
  risPiramidaApofema,
  risPiramidaPravilnaya,
  risPiramidaPryamougolnik,
  risPiramidaPryamoyUgol,
  risPiramidaSA,
} from './ris';

export const GRUPPY_13_2: GruppaBazy[] = [
  { id: 'C', nazvanie: 'Объём пирамиды', znak: '\\tfrac13', ton: 'green' },
  { id: 'D', nazvanie: 'Боковая поверхность пирамиды', znak: 'S', ton: 'navy' },
];

type T3 = readonly [number, number, number];

/** Объём тетраэдра по координатам вершин: |смешанное произведение| / 6. */
function obemTetraedra(a: T3, b: T3, c: T3, d: T3): number {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  const det =
    u[0]! * (v[1]! * w[2]! - v[2]! * w[1]!) -
    u[1]! * (v[0]! * w[2]! - v[2]! * w[0]!) +
    u[2]! * (v[0]! * w[1]! - v[1]! * w[0]!);
  return Math.abs(det) / 6;
}

/** Площадь треугольника со сторонами x, y, z по формуле Герона. */
function geron(x: number, y: number, z: number): number {
  const p = (x + y + z) / 2;
  return Math.sqrt(p * (p - x) * (p - y) * (p - z));
}

/** Подсказка «формула объёма пирамиды»: частая ошибка — забыть 1/3. */
const FORMULA_V = (sdvig: number) =>
  vopros(
    'Как найти объём пирамиды?',
    '$V = \\frac{1}{3}Sh$',
    ['$V = Sh$', '$V = \\frac{1}{2}Sh$'],
    sdvig,
    'Пирамида втрое меньше призмы с тем же основанием и высотой.',
  );

/* ── P06. Пирамида с тремя перпендикулярными рёбрами ──────────── */

const P06 = prototip({
  id: 'P06',
  gruppa: 'C',
  title: 'Рёбра $AB$, $AC$, $AD$ взаимно перпендикулярны',
  text: (p) =>
    `В треугольной пирамиде $ABCD$ рёбра $AB$, $AC$ и $AD$ взаимно перпендикулярны. Найдите объём ${num(p, 'f') === 0 ? 'этой ' : ''}пирамиды, если $AB=${num(p, 'a')}$, $AC=${num(p, 'b')}$ и $AD=${num(p, 'c')}$.`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const s = t(a * b, 2);
    const otvet = t(a * b * c, 6);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Основание и высота',
          lines: [
            'Примем за основание треугольник $ABC$. Ребро $AD$ перпендикулярно $AB$ и $AC$ — двум пересекающимся прямым плоскости $ABC$, значит, $AD$ перпендикулярно всей плоскости и служит высотой.',
            `Треугольник $ABC$ прямоугольный с прямым углом $A$: $S_{ABC} = \\frac{1}{2}\\cdot ${a}\\cdot ${b} = ${s}$.`,
          ],
        },
        {
          title: 'Объём',
          lines: [
            `$V = \\frac{1}{3}S_{ABC}\\cdot AD = \\frac{1}{3}\\cdot ${s}\\cdot ${c} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какой отрезок служит высотой, если основание — треугольник $ABC$?',
          '$AD$',
          ['$AB$', '$BC$'],
          a + c,
          '$AD$ перпендикулярно двум пересекающимся прямым плоскости $ABC$.',
        ),
        vopros(
          'Чему равна площадь треугольника $ABC$?',
          $(s),
          [$(String(a * b)), $(drob(b * c, 2)), $(drob(a * c, 2)), $(drob(a * b, 3))],
          b,
          'Треугольник прямоугольный: половина произведения катетов $AB$ и $AC$.',
        ),
        FORMULA_V(c),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return izmereno(obemTetraedra([0, 0, 0], [a, 0, 0], [0, b, 0], [0, 0, c]));
  },
  model: (p) => risPiramidaPryamoyUgol(num(p, 'a'), num(p, 'b'), num(p, 'c')),
});

/* ── P07. Пирамида SABC, ребро SA перпендикулярно основанию ──── */

const P07 = prototip({
  id: 'P07',
  gruppa: 'C',
  title: 'Пирамида $SABC$, ребро $SA$ — высота',
  text: (p) =>
    `В основании пирамиды $SABC$ лежит правильный треугольник $ABC$ со стороной ${num(p, 'a')}, а боковое ребро $SA$ перпендикулярно основанию и равно $${koren(num(p, 'k'), num(p, 's'))}$. Найдите объём пирамиды $SABC$.`,
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    if (num(p, 's') !== 3) throw new Error('ребро — k√3');
    const otvet = t(a * a * k, 4);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Площадь основания',
          lines: [
            'Основание — правильный треугольник со стороной $a$: $S = \\frac{a^2\\sqrt{3}}{4}$.',
            `$S = \\frac{${a}^2\\sqrt{3}}{4} = ${sPravilnogo(a)}$.`,
          ],
        },
        {
          title: 'Высота и объём',
          lines: [
            `Ребро $SA$ перпендикулярно основанию, значит, это высота пирамиды: $h = ${koren(k, 3)}$.`,
            `$V = \\frac{1}{3}Sh = \\frac{1}{3}\\cdot\\frac{${a * a}\\sqrt{3}}{4}\\cdot ${koren(k, 3)} = \\frac{${a * a}\\cdot ${k}\\cdot 3}{12} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь правильного треугольника со стороной $a$?',
          '$\\frac{a^2\\sqrt{3}}{4}$',
          ['$\\frac{a^2}{2}$', '$a^2\\sqrt{3}$'],
          a,
        ),
        vopros(
          'Что служит высотой пирамиды?',
          'Ребро $SA$',
          ['Ребро $SB$', 'Сторона $AB$'],
          k,
          'Ребро $SA$ перпендикулярно плоскости основания.',
        ),
        FORMULA_V(a + k),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const h = num(p, 'k') * Math.sqrt(num(p, 's'));
    return izmereno(
      obemTetraedra([0, 0, 0], [a, 0, 0], [a / 2, (a * Math.sqrt(3)) / 2, 0], [0, 0, h]),
    );
  },
  model: (p) => risPiramidaSA(num(p, 'a'), num(p, 'k') * Math.sqrt(num(p, 's'))),
});

/* ── P08. Высота пирамиды с прямоугольником в основании ───────── */

const P08 = prototip({
  id: 'P08',
  gruppa: 'C',
  title: 'Высота пирамиды по объёму, в основании прямоугольник',
  text: (p) =>
    `Основанием четырёхугольной пирамиды является прямоугольник со сторонами ${num(p, 'a')} и ${num(p, 'b')}. Найдите высоту этой пирамиды, если её объём равен ${num(p, 'v')}.`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const v = num(p, 'v');
    const s = a * b;
    const otvet = t(3 * v, s);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Площадь основания',
          lines: [`Площадь прямоугольника: $S = ${a}\\cdot ${b} = ${s}$.`],
        },
        {
          title: 'Высота из формулы объёма',
          lines: [
            '$V = \\frac{1}{3}Sh$, отсюда $h = \\frac{3V}{S}$.',
            `$h = \\frac{3\\cdot ${v}}{${s}} = \\frac{${3 * v}}{${s}} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь основания?',
          $(String(s)),
          [$(String(2 * (a + b))), $(drob(s, 2))],
          a,
          'Площадь прямоугольника — произведение сторон.',
        ),
        vopros(
          'Как выразить высоту из формулы $V = \\frac{1}{3}Sh$?',
          '$h = \\frac{3V}{S}$',
          ['$h = \\frac{V}{S}$', '$h = \\frac{V}{3S}$'],
          b,
          'Умножь обе части на $3$ и раздели на $S$.',
        ),
      ],
    };
  },
  proverka(p) {
    /* Перебор высоты с шагом 0,01: объём пирамиды abh/3 должен совпасть. */
    const ab = num(p, 'a') * num(p, 'b');
    const v = num(p, 'v');
    for (let h100 = 1; h100 <= 100000; h100 += 1) {
      if (ab * h100 === 300 * v) return zapis(h100, 100);
    }
    throw new Error('высота не найдена');
  },
  model: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return risPiramidaPryamougolnik(a, b, (3 * num(p, 'v')) / (a * b));
  },
});

/* ── P09. Правильная четырёхугольная пирамида: сторона и ребро ── */

const P09 = prototip({
  id: 'P09',
  gruppa: 'C',
  title: 'Правильная четырёхугольная пирамида: сторона и боковое ребро',
  text: (p) =>
    `Найдите объём правильной четырёхугольной пирамиды, сторона основания которой равна ${num(p, 'a')}, а боковое ребро равно $${koren(num(p, 'k'), num(p, 'n'))}$.`,
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    const n = num(p, 'n');
    const l = koren(k, n);
    const l2 = k * k * n;
    const pd2 = (a * a) / 2;
    const h = tselyyKoren(l2 - pd2);
    const otvet = t(a * a * h, 3);
    const kvL = k === 1 ? `${l2}` : `${k}^2\\cdot ${n} = ${l2}`;
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Половина диагонали основания',
          lines: [
            'В основании — квадрат, высота пирамиды падает в его центр — точку пересечения диагоналей.',
            `Диагональ квадрата $${a}\\sqrt{2}$, её половина $\\frac{${a}\\sqrt{2}}{2}$, а квадрат половины: $\\frac{${a}^2\\cdot 2}{4} = ${t(pd2)}$.`,
          ],
        },
        {
          title: 'Высота — по теореме Пифагора',
          lines: [
            'Боковое ребро, высота и половина диагонали образуют прямоугольный треугольник, ребро — гипотенуза.',
            `$(${l})^2 = ${kvL}$.`,
            `$h = \\sqrt{${l2} - ${t(pd2)}} = \\sqrt{${t(l2 - pd2)}} = ${h}$.`,
          ],
        },
        {
          title: 'Объём',
          lines: [
            `$V = \\frac{1}{3}Sh = \\frac{1}{3}\\cdot ${a}^2\\cdot ${h} = \\frac{${a * a}\\cdot ${h}}{3} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен квадрат половины диагонали основания?',
          $(t(pd2)),
          [$(String(a * a)), $(drob(a * a, 4))],
          a + n,
          'Диагональ квадрата со стороной $a$ равна $a\\sqrt{2}$.',
        ),
        vopros(
          'Чему равна высота пирамиды?',
          $(String(h)),
          [$(drob(l2 - pd2)), $(`\\sqrt{${drob(4 * l2 - a * a, 4)}}`)],
          k + a,
          'Высота — катет: из квадрата ребра вычти квадрат половины диагонали.',
        ),
        FORMULA_V(n),
      ],
    };
  },
  proverka(p) {
    /* Вершина над центром квадрата: высоту ищем по длине ребра, объём — двумя тетраэдрами. */
    const a = num(p, 'a');
    const l = num(p, 'k') * Math.sqrt(num(p, 'n'));
    const h = Math.sqrt(l * l - (a / 2) ** 2 - (a / 2) ** 2);
    const A: T3 = [-a / 2, -a / 2, 0];
    const B: T3 = [a / 2, -a / 2, 0];
    const C: T3 = [a / 2, a / 2, 0];
    const D: T3 = [-a / 2, a / 2, 0];
    const S: T3 = [0, 0, h];
    return izmereno(obemTetraedra(A, B, C, S) + obemTetraedra(A, C, D, S));
  },
  model(p) {
    const a = num(p, 'a');
    const l2 = num(p, 'k') ** 2 * num(p, 'n');
    return risPiramidaPravilnaya(4, a, Math.sqrt(l2 - (a * a) / 2));
  },
});

/* ── P10. Правильная треугольная пирамида: сторона и высота ───── */

const P10 = prototip({
  id: 'P10',
  gruppa: 'C',
  title: 'Правильная треугольная пирамида, высота $k\\sqrt{3}$',
  text: (p) =>
    `Сторона основания правильной треугольной пирамиды равна ${num(p, 'a')}, а высота пирамиды равна $${koren(num(p, 'k'), num(p, 's'))}$. Найдите объём этой пирамиды.`,
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    if (num(p, 's') !== 3) throw new Error('высота — k√3');
    const otvet = t(a * a * k, 4);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Площадь основания',
          lines: [
            'Основание правильной треугольной пирамиды — правильный треугольник: $S = \\frac{a^2\\sqrt{3}}{4}$.',
            `$S = \\frac{${a}^2\\sqrt{3}}{4} = ${sPravilnogo(a)}$.`,
          ],
        },
        {
          title: 'Объём',
          lines: [
            `$V = \\frac{1}{3}Sh = \\frac{1}{3}\\cdot\\frac{${a * a}\\sqrt{3}}{4}\\cdot ${koren(k, 3)} = \\frac{${a * a}\\cdot ${k}\\cdot 3}{12} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь основания?',
          $(sPravilnogo(a)),
          [$(drob(a * a, 2)), $(`${a * a}\\sqrt{3}`)],
          a,
          'Площадь правильного треугольника: $\\frac{a^2\\sqrt{3}}{4}$.',
        ),
        FORMULA_V(k),
        vopros(
          'Чему равен объём?',
          $(otvet),
          [$(drob(3 * a * a * k, 4)), $(drob(a * a * k, 12))],
          a + k,
          'Не забудь множитель $\\frac{1}{3}$ и что $\\sqrt{3}\\cdot\\sqrt{3} = 3$.',
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    return izmereno((geron(a, a, a) * num(p, 'k') * Math.sqrt(num(p, 's'))) / 3);
  },
  model: (p) => risPiramidaPravilnaya(3, num(p, 'a'), num(p, 'k') * Math.sqrt(num(p, 's'))),
});

/* ── P11. Пирамида в кубе ─────────────────────────────────────── */

const P11 = prototip({
  id: 'P11',
  gruppa: 'C',
  title: 'Пирамида $B_1BKP$ в кубе',
  text: (p) =>
    `Длина ребра куба $ABCDA_1B_1C_1D_1$ равна ${num(p, 'a')}. На рёбрах $AB$ и $BC$ отмечены точки $K$ и $P$ — середины рёбер соответственно. Найдите объём пирамиды $B_1BKP$.`,
  solve(p) {
    const a = num(p, 'a');
    const pol = a / 2;
    const s = t(pol * pol, 2);
    const otvet = t(a * a * a, 24);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Основание — треугольник $BKP$',
          lines: [
            `$BK = BP = ${a} : 2 = ${t(pol)}$, угол $KBP$ прямой — это угол квадрата $ABCD$.`,
            `$S_{BKP} = \\frac{1}{2}\\cdot ${t(pol)}\\cdot ${t(pol)} = ${s}$.`,
          ],
        },
        {
          title: 'Высота — ребро $BB_1$',
          lines: [
            `Ребро $BB_1$ перпендикулярно грани $ABCD$, значит, это высота пирамиды: $h = ${a}$.`,
            `$V = \\frac{1}{3}\\cdot ${s}\\cdot ${a} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь треугольника $BKP$?',
          $(s),
          [$(drob(pol * pol)), $(drob(a * a, 2))],
          a,
          '$BK$ и $BP$ — катеты, каждый — половина ребра.',
        ),
        vopros(
          'Что служит высотой пирамиды $B_1BKP$ с основанием $BKP$?',
          'Ребро $BB_1$',
          ['Отрезок $B_1K$', 'Отрезок $KP$'],
          a + 1,
          'Ребро $BB_1$ перпендикулярно плоскости $ABCD$.',
        ),
        FORMULA_V(a + 2),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    /* B — начало координат, BA и BC — по осям, BB₁ — вверх. */
    return izmereno(obemTetraedra([0, 0, 0], [a / 2, 0, 0], [0, a / 2, 0], [0, 0, a]));
  },
  model: () => risKubPiramida(),
});

/* ── P12, P13. Боковая поверхность правильной пирамиды ────────── */

function bokovaya(n: 3 | 6, id: string, title: string, nazvanie: string, svyazka: string) {
  return prototip({
    id,
    gruppa: 'D',
    title,
    text: (p) =>
      `Стороны основания правильной ${nazvanie} пирамиды равны ${num(p, 'a')}${svyazka}боковые рёбра равны ${num(p, 'l')}. Найдите площадь боковой поверхности этой пирамиды.`,
    solve(p: Params) {
      const a = num(p, 'a');
      const l = num(p, 'l');
      const dvaM = tselyyKoren(4 * l * l - a * a);
      const m = t(dvaM, 2);
      const grani = t(a * dvaM, 4);
      const otvet = t(n * a * dvaM, 4);
      const chislo = n === 3 ? 'три' : 'шесть';
      return {
        otvet: blank(otvet),
        etapy: [
          {
            title: 'Апофема — высота боковой грани',
            lines: [
              'Боковая грань — равнобедренный треугольник с боковыми сторонами $l$ и основанием $a$. Его высота (апофема) делит основание пополам.',
              `$m = \\sqrt{${l}^2 - \\left(\\frac{${a}}{2}\\right)^2} = \\sqrt{${l * l} - ${t(a * a, 4)}} = \\sqrt{${t(4 * l * l - a * a, 4)}} = ${m}$.`,
            ],
          },
          {
            title: 'Площадь одной грани',
            lines: [`$S_{\\text{грани}} = \\frac{1}{2}\\cdot ${a}\\cdot ${m} = ${grani}$.`],
          },
          {
            title: 'Боковая поверхность',
            lines: [
              `Боковых граней ${chislo}, все равны: $S = ${n}\\cdot ${grani} = ${otvet}$.`,
              `Ответ: $${otvet}$.`,
            ],
          },
        ],
        hints: [
          vopros(
            'Чему равна апофема — высота боковой грани?',
            $(m),
            [$(String(l)), $(String(dvaM)), $(`\\sqrt{${l * l + a * a}}`)],
            a + l,
            'Высота равнобедренного треугольника делит основание пополам: по теореме Пифагора $m^2 = l^2 - \\left(\\frac{a}{2}\\right)^2$.',
          ),
          vopros(
            'Чему равна площадь одной боковой грани?',
            $(grani),
            [$(drob(a * l, 2)), $(drob(a * dvaM, 2))],
            l,
            'Половина основания грани на её высоту.',
          ),
          vopros(
            'Сколько боковых граней у пирамиды?',
            $(String(n)),
            [$(String(n + 1)), $(String(2 * n))],
            a,
          ),
        ],
      };
    },
    proverka(p: Params) {
      const a = num(p, 'a');
      return izmereno(n * geron(a, num(p, 'l'), num(p, 'l')));
    },
    model: (p: Params) => risPiramidaApofema(n, num(p, 'a'), num(p, 'l')),
  });
}

const P12 = bokovaya(
  3,
  'P12',
  'Правильная треугольная пирамида: боковая поверхность',
  'треугольной',
  ', а ',
);
const P13 = bokovaya(
  6,
  'P13',
  'Правильная шестиугольная пирамида: боковая поверхность',
  'шестиугольной',
  ', ',
);

export const PROTOTIPY_13_2: Prototip[] = [P06, P07, P08, P09, P10, P11, P12, P13];
