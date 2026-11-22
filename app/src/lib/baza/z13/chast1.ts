/**
 * База, задание №13, часть 1: параллелепипед и призма (задачи 1–26
 * задачника, на сайте — только их аналоги).
 *
 * proverka считает ответ иначе, чем разбор: через другое тождество,
 * перебором целых или по координатам вершин.
 */

import type { GruppaBazy, Params, Prototip } from '../types';
import {
  $,
  blank,
  drob,
  sPravilnogo,
  izmereno,
  koren,
  korenPereborom,
  num,
  prototip,
  t,
  tselyyKoren,
  vopros,
} from './obshchee';
import {
  risParallelepiped,
  risParallelepipedDiagonal,
  risPrizmaPravilnaya,
  risPrizmaPryamougolnaya,
} from './ris';

export const GRUPPY_13_1: GruppaBazy[] = [
  { id: 'A', nazvanie: 'Прямоугольный параллелепипед', znak: 'abc', ton: 'blue' },
  { id: 'B', nazvanie: 'Призма', znak: 'S h', ton: 'orange' },
];

const PARALLELEPIPED = '$ABCDA_1B_1C_1D_1$';

/* ── P01. Площадь поверхности по двум рёбрам и объёму ─────────── */

const P01 = prototip({
  id: 'P01',
  gruppa: 'A',
  title: 'Площадь поверхности по двум рёбрам и объёму',
  text: (p) =>
    `Два ребра прямоугольного параллелепипеда равны ${num(p, 'a')} и ${num(p, 'b')}, а объём параллелепипеда равен ${num(p, 'v')}. Найдите площадь поверхности этого параллелепипеда.`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const v = num(p, 'v');
    const ab = a * b;
    /* Третье ребро c = v / ab, площадь S = 2(ab + bc + ac) — в дробях со знаменателем ab. */
    const c = t(v, ab);
    const bc = t(b * v, ab);
    const ac = t(a * v, ab);
    const polu = t(ab * ab + (a + b) * v, ab);
    const otvet = t(2 * (ab * ab + (a + b) * v), ab);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Третье ребро',
          lines: [
            'Объём прямоугольного параллелепипеда — произведение трёх его измерений: $V = abc$.',
            `$${a}\\cdot ${b}\\cdot c = ${v}$, значит, $c = ${v} : ${ab} = ${c}$.`,
          ],
        },
        {
          title: 'Площади граней',
          lines: [
            'У параллелепипеда шесть граней, попарно равных: по две грани $a\\times b$, $b\\times c$ и $a\\times c$.',
            `$ab = ${ab}$, $bc = ${b}\\cdot ${c} = ${bc}$, $ac = ${a}\\cdot ${c} = ${ac}$.`,
          ],
        },
        {
          title: 'Площадь поверхности',
          lines: [
            `$S = 2(ab + bc + ac) = 2\\cdot(${ab} + ${bc} + ${ac}) = 2\\cdot ${polu} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равно третье ребро параллелепипеда?',
          $(c),
          [$(drob(v, a + b)), $(drob(v - ab))],
          a + b,
          'Объём — произведение трёх рёбер: раздели объём на произведение двух известных.',
        ),
        vopros(
          'Как найти площадь поверхности прямоугольного параллелепипеда?',
          '$S = 2(ab + bc + ac)$',
          ['$S = ab + bc + ac$', '$S = abc$'],
          v,
          'Граней шесть, и каждая из трёх разных встречается дважды.',
        ),
        vopros(
          'Чему равна сумма площадей трёх разных граней?',
          $(polu),
          [$(drob(ab * ab + (a + b) * v, 2 * ab)), $(drob(ab + (a + b)))],
          a,
          'Площадь поверхности вдвое больше этой суммы.',
        ),
      ],
    };
  },
  proverka(p) {
    /* 2(ab + bc + ca) = (a + b + c)² − (a² + b² + c²). */
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'v') / (a * b);
    return izmereno((a + b + c) ** 2 - (a * a + b * b + c * c));
  },
  model: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return risParallelepiped(a, b, num(p, 'v') / (a * b));
  },
});

/* ── P02. Объём по двум рёбрам и диагонали боковой грани ──────── */

interface VariantDiagonali {
  /** Начало условия: рёбра и диагональ. */
  text: string;
  /** Имена: известное ребро грани (x), второе ребро (y), диагональ. */
  x: string;
  y: string;
  diag: string;
  /** Ребро грани, равное x (если x в условии названо противоположным ребром). */
  xGrani: string;
  /** Боковое ребро треугольника и вершина прямого угла. */
  vysota: string;
  pryamoy: string;
  diagonal: readonly [string, string];
  /** Для чертежа: AB и AD через x и y. */
  ab: 'x' | 'y';
  /** Диагональ целая (без корня). */
  tselaya: boolean;
}

const DIAGONALI: readonly VariantDiagonali[] = [
  {
    text: 'рёбра $BC$, $AB$ и диагональ $DA_1$ боковой грани',
    x: 'BC',
    y: 'AB',
    diag: 'DA_1',
    xGrani: 'AD',
    vysota: 'AA_1',
    pryamoy: 'A',
    diagonal: ['D', 'A1'],
    ab: 'y',
    tselaya: false,
  },
  {
    text: 'рёбра $AB$, $AD$ и диагональ $AB_1$ боковой грани',
    x: 'AB',
    y: 'AD',
    diag: 'AB_1',
    xGrani: 'AB',
    vysota: 'BB_1',
    pryamoy: 'B',
    diagonal: ['A', 'B1'],
    ab: 'x',
    tselaya: false,
  },
  {
    text: 'рёбра $CD$, $BC$ и диагональ боковой грани $CD_1$',
    x: 'CD',
    y: 'BC',
    diag: 'CD_1',
    xGrani: 'CD',
    vysota: 'DD_1',
    pryamoy: 'D',
    diagonal: ['C', 'D1'],
    ab: 'x',
    tselaya: true,
  },
  {
    text: 'рёбра $BC$, $AB$ и диагональ $BC_1$ боковой грани',
    x: 'BC',
    y: 'AB',
    diag: 'BC_1',
    xGrani: 'BC',
    vysota: 'CC_1',
    pryamoy: 'C',
    diagonal: ['B', 'C1'],
    ab: 'y',
    tselaya: false,
  },
];

function diagonal(p: Params): VariantDiagonali {
  const d = DIAGONALI[num(p, 'f')];
  if (d === undefined) throw new Error('нет варианта диагонали');
  return d;
}

/** Квадрат диагонали: в условии √d или целое d. */
const kvDiag = (p: Params): number => (diagonal(p).tselaya ? num(p, 'd') ** 2 : num(p, 'd'));

const P02 = prototip({
  id: 'P02',
  gruppa: 'A',
  title: 'Объём по двум рёбрам и диагонали боковой грани',
  text(p) {
    const f = diagonal(p);
    const d = f.tselaya ? String(num(p, 'd')) : `$\\sqrt{${num(p, 'd')}}$`;
    return `В прямоугольном параллелепипеде ${PARALLELEPIPED} ${f.text} равны соответственно ${num(p, 'x')}, ${num(p, 'y')} и ${d}. Найдите объём параллелепипеда ${PARALLELEPIPED}.`;
  },
  solve(p) {
    const f = diagonal(p);
    const x = num(p, 'x');
    const y = num(p, 'y');
    const d2 = kvDiag(p);
    const dTex = f.tselaya ? String(num(p, 'd')) : `\\sqrt{${d2}}`;
    const h = tselyyKoren(d2 - x * x);
    const otvet = x * y * h;
    const svyaz =
      f.xGrani === f.x
        ? `Диагональ $${f.diag}$ лежит в грани вместе с ребром $${f.x} = ${x}$.`
        : `Диагональ $${f.diag}$ лежит в грани $ADD_1A_1$, а ребро $${f.xGrani}$ этой грани равно противоположному ребру: $${f.xGrani} = ${f.x} = ${x}$.`;
    return {
      otvet: String(otvet),
      etapy: [
        {
          title: 'Боковое ребро — по теореме Пифагора',
          lines: [
            svyaz,
            `Боковое ребро $${f.vysota}$ перпендикулярно основанию, поэтому треугольник с гипотенузой $${f.diag}$ прямоугольный, прямой угол — при вершине $${f.pryamoy}$.`,
            `$${f.vysota} = \\sqrt{${f.diag}^2 - ${f.xGrani}^2} = \\sqrt{${d2} - ${x * x}} = \\sqrt{${d2 - x * x}} = ${h}$.`,
          ],
        },
        {
          title: 'Объём',
          lines: [
            'Объём прямоугольного параллелепипеда — произведение трёх его измерений.',
            `$V = ${x}\\cdot ${y}\\cdot ${h} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          `Чему равен квадрат диагонали $${f.diag}$?`,
          $(String(d2)),
          [
            $(String(f.tselaya ? 2 * num(p, 'd') : 2 * d2)),
            $(String(f.tselaya ? num(p, 'd') : d2 * d2)),
          ],
          x,
          `$(${dTex})^2 = ${d2}$.`,
        ),
        vopros(
          `Чему равно боковое ребро $${f.vysota}$?`,
          $(String(h)),
          [$(String(d2 - x * x)), $(`\\sqrt{${d2 + x * x}}`)],
          x + y,
          `По теореме Пифагора: $${f.vysota}^2 = ${f.diag}^2 - ${f.xGrani}^2$.`,
        ),
        vopros(
          'Как найти объём прямоугольного параллелепипеда?',
          '$V = abc$',
          ['$V = \\frac{1}{3}abc$', '$V = 2(ab + bc + ac)$'],
          y,
        ),
      ],
    };
  },
  proverka(p) {
    /* Вершины в координатах: перебираем высоту, пока длина диагонали не совпадёт. */
    const f = diagonal(p);
    const x = num(p, 'x');
    const y = num(p, 'y');
    const d2 = kvDiag(p);
    const AB = f.ab === 'x' ? x : y;
    const AD = f.ab === 'x' ? y : x;
    for (let h = 1; h <= 1000; h += 1) {
      const V: Record<string, [number, number, number]> = {
        A: [0, 0, 0],
        B: [AB, 0, 0],
        C: [AB, AD, 0],
        D: [0, AD, 0],
        A1: [0, 0, h],
        B1: [AB, 0, h],
        C1: [AB, AD, h],
        D1: [0, AD, h],
      };
      const [P, Q] = f.diagonal.map((n) => V[n]) as [
        [number, number, number],
        [number, number, number],
      ];
      const kv = (P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2 + (P[2] - Q[2]) ** 2;
      if (kv === d2) return String(AB * AD * h);
    }
    throw new Error('высота не найдена');
  },
  model(p) {
    const f = diagonal(p);
    const x = num(p, 'x');
    const y = num(p, 'y');
    const h = Math.sqrt(kvDiag(p) - x * x);
    const AB = f.ab === 'x' ? x : y;
    const AD = f.ab === 'x' ? y : x;
    const [P, Q] = f.diagonal;
    const ugol = f.pryamoy;
    /* Прямой угол — в вершине ugol между ребром грани и боковым ребром. */
    const sosed = P === ugol ? Q : P;
    const verh = `${ugol}1`;
    return risParallelepipedDiagonal(AB, AD, h, f.diagonal, [
      ugol,
      sosed === verh ? P : sosed,
      verh,
    ]);
  },
});

/* ── P03. Прямая призма: катеты и высота ──────────────────────── */

const P03 = prototip({
  id: 'P03',
  gruppa: 'B',
  title: 'Прямая призма, в основании — катеты $a$ и $b$',
  text: (p) =>
    `В основании прямой призмы лежит прямоугольный треугольник, катеты которого равны ${num(p, 'a')} и ${num(p, 'b')}. Найдите объём призмы, если её высота равна ${num(p, 'h')}.`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const h = num(p, 'h');
    const s = t(a * b, 2);
    const otvet = t(a * b * h, 2);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Площадь основания',
          lines: [
            'Площадь прямоугольного треугольника — половина произведения катетов.',
            `$S = \\frac{1}{2}\\cdot ${a}\\cdot ${b} = ${s}$.`,
          ],
        },
        {
          title: 'Объём призмы',
          lines: [
            'Объём призмы — площадь основания, умноженная на высоту: $V = Sh$.',
            `$V = ${s}\\cdot ${h} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь основания?',
          $(s),
          [$(String(a * b)), $(drob(a + b))],
          a + h,
          'Площадь прямоугольного треугольника — половина произведения катетов.',
        ),
        vopros(
          'Как найти объём призмы?',
          '$V = Sh$',
          ['$V = \\frac{1}{3}Sh$', '$V = \\frac{1}{2}Sh$'],
          b,
          'У призмы, как у параллелепипеда, объём — площадь основания на высоту.',
        ),
      ],
    };
  },
  proverka: (p) =>
    /* Призма — половина прямоугольного параллелепипеда a × b × h. */
    izmereno((num(p, 'a') * num(p, 'b') * num(p, 'h')) / 2),
  model: (p) => risPrizmaPryamougolnaya(num(p, 'a'), num(p, 'b'), num(p, 'h')),
});

/* ── P04. Прямая призма: катет, гипотенуза и высота ───────────── */

const P04 = prototip({
  id: 'P04',
  gruppa: 'B',
  title: 'Прямая призма, в основании — катет и гипотенуза',
  text: (p) =>
    `В основании прямой призмы лежит прямоугольный треугольник, один из катетов которого равен ${num(p, 'a')}, а гипотенуза равна $\\sqrt{${num(p, 'c2')}}$. Найдите объём призмы, если её высота равна ${num(p, 'h')}.`,
  solve(p) {
    const a = num(p, 'a');
    const c2 = num(p, 'c2');
    const h = num(p, 'h');
    const b = tselyyKoren(c2 - a * a);
    const s = t(a * b, 2);
    const otvet = t(a * b * h, 2);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Второй катет',
          lines: [
            'По теореме Пифагора квадрат гипотенузы равен сумме квадратов катетов.',
            `$b = \\sqrt{(\\sqrt{${c2}})^2 - ${a}^2} = \\sqrt{${c2} - ${a * a}} = \\sqrt{${c2 - a * a}} = ${b}$.`,
          ],
        },
        {
          title: 'Площадь основания',
          lines: [`$S = \\frac{1}{2}\\cdot ${a}\\cdot ${b} = ${s}$.`],
        },
        {
          title: 'Объём призмы',
          lines: [`$V = Sh = ${s}\\cdot ${h} = ${otvet}$.`, `Ответ: $${otvet}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен второй катет основания?',
          $(String(b)),
          [$(String(c2 - a * a)), $(`\\sqrt{${c2 + a * a}}`)],
          a + h,
          `По теореме Пифагора: $b^2 = ${c2} - ${a}^2$.`,
        ),
        vopros(
          'Чему равна площадь основания?',
          $(s),
          [$(String(a * b)), $(drob(a * b * h, 3))],
          b,
          'Половина произведения катетов.',
        ),
        vopros(
          'Как найти объём призмы?',
          '$V = Sh$',
          ['$V = \\frac{1}{3}Sh$', '$V = \\frac{1}{2}Sh$'],
          h,
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const b = korenPereborom(num(p, 'c2') - a * a);
    return izmereno((a * b * num(p, 'h')) / 2);
  },
  model(p) {
    const a = num(p, 'a');
    return risPrizmaPryamougolnaya(a, Math.sqrt(num(p, 'c2') - a * a), num(p, 'h'));
  },
});

/* ── P05. Правильная треугольная призма ───────────────────────── */

const PRIZMA = '$ABCA_1B_1C_1$';

const P05 = prototip({
  id: 'P05',
  gruppa: 'B',
  title: 'Правильная треугольная призма, высота $k\\sqrt{3}$',
  text: (p) =>
    `Сторона основания правильной треугольной призмы ${PRIZMA} равна ${num(p, 'a')}, а высота этой призмы равна $${koren(num(p, 'k'), num(p, 's'))}$. Найдите объём призмы ${PRIZMA}.`,
  solve(p) {
    const a = num(p, 'a');
    const k = num(p, 'k');
    if (num(p, 's') !== 3) throw new Error('высота — k√3');
    const s = `\\frac{${a * a}\\sqrt{3}}{4}`;
    const sProsto = sPravilnogo(a);
    const otvet = t(3 * a * a * k, 4);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Площадь основания',
          lines: [
            'В основании — правильный (равносторонний) треугольник со стороной $a$: $S = \\frac{a^2\\sqrt{3}}{4}$.',
            `$S = \\frac{${a}^2\\sqrt{3}}{4} = ${sProsto}$.`,
          ],
        },
        {
          title: 'Объём призмы',
          lines: [
            `$V = Sh = ${s}\\cdot ${koren(k, 3)} = \\frac{${a * a}\\cdot ${k}\\cdot 3}{4} = ${otvet}$.`,
            'Корни сократились: $\\sqrt{3}\\cdot\\sqrt{3} = 3$.',
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Как найти площадь правильного треугольника со стороной $a$?',
          '$\\frac{a^2\\sqrt{3}}{4}$',
          ['$\\frac{a^2}{2}$', '$\\frac{a\\sqrt{3}}{2}$'],
          a + k,
          'Высота правильного треугольника $\\frac{a\\sqrt{3}}{2}$, площадь — половина стороны на высоту.',
        ),
        vopros('Чему равно $\\sqrt{3}\\cdot\\sqrt{3}$?', '$3$', ['$9$', '$\\sqrt{3}$'], k),
        vopros(
          'Чему равен объём призмы?',
          $(otvet),
          [$(drob(a * a * k, 4)), $(drob(a * a * k))],
          a,
          'Объём призмы — площадь основания на высоту.',
        ),
      ],
    };
  },
  proverka(p) {
    /* Площадь треугольника со сторонами a, a, a по формуле Герона, высота — числом. */
    const a = num(p, 'a');
    const pp = (3 * a) / 2;
    const s = Math.sqrt(pp * (pp - a) ** 3);
    return izmereno(s * num(p, 'k') * Math.sqrt(num(p, 's')));
  },
  model: (p) => risPrizmaPravilnaya(num(p, 'a'), num(p, 'k') * Math.sqrt(num(p, 's'))),
});

export const PROTOTIPY_13_1: Prototip[] = [P01, P02, P03, P04, P05];
