/**
 * База, задание №12, часть 2: площади параллелограмма, ромба и
 * трапеции, теорема Пифагора в треугольнике и трапеции (задачи
 * 115–162 задачника, прототипы P31–P41).
 */

import { parallelogramm, romb } from '@/lib/planimetriya/figury';
import { RAD, projT } from '@/lib/planimetriya/geom';
import { mn, oblast, otr, pryam, shtrih, tri, ug, vysota } from '@/lib/planimetriya/stseny/dsl';
import type { Prototip } from '../types';
import { DANNYE_12_2 as D } from './chast2-dannye';
import {
  type Ch,
  type T,
  clamp,
  del,
  gdeOsnovanie,
  geron,
  iskomyy,
  iz,
  koren,
  korenTseliy,
  kv,
  m$,
  minus,
  plus,
  ploshchadMn,
  prototip,
  prov,
  q,
  rasst,
  storona,
  tq,
  umn,
  vopros,
  zq,
} from './chast2-obshchee';

const dannye = (id: string): readonly (readonly number[])[] => {
  const d = D[id];
  if (d === undefined) throw new Error(`нет данных ${id}`);
  return d;
};

const skh = (a: number, b: number) => (Math.abs(a - b) > 1e-9 ? { skhematichno: true } : {});

/* ── P31. Параллелограмм: высота к большей стороне (115–118) ───── */

const P31 = prototip({
  id: 'P31',
  gruppa: '2A',
  title: 'Параллелограмм: высота к большей стороне',
  dannye: dannye('P31'),
  polya: ['a', 'b', 'h'],
  text: (c) =>
    `Стороны параллелограмма равны $${c.a}$ и $${c.b}$. Высота, опущенная на меньшую сторону, равна $${c.h}$. Найдите высоту, опущенную на большую сторону параллелограмма.`,
  solve(c, sd) {
    const S = c.a! * c.h!;
    const x = q(S, c.b);
    return {
      otvet: zq(x),
      etapy: [
        {
          title: 'Площадь через меньшую сторону',
          lines: [
            'Площадь параллелограмма равна стороне, умноженной на высоту, опущенную на эту сторону.',
            `Меньшая сторона $${c.a}$, высота к ней $${c.h}$: $S = ${c.a} \\cdot ${c.h} = ${S}$.`,
          ],
        },
        {
          title: 'Высота к большей стороне',
          lines: [
            `Та же площадь через большую сторону: $S = ${c.b} \\cdot h$.`,
            `$h = ${S} : ${c.b} = ${tq(x)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь параллелограмма?',
          `$${S}$`,
          [`$${c.b! * c.h!}$`, `$${c.a! * c.b!}$`],
          sd,
          `Высоту $${c.h}$ умножаем на сторону, к которой она проведена, — на меньшую.`,
        ),
        vopros(
          'Как найти высоту, опущенную на большую сторону?',
          `$${S} : ${c.b}$`,
          [`$${S} : ${c.a}$`, `$${S} \\cdot ${c.b}$`],
          sd + 1,
          'Площадь делим на сторону, к которой проведена высота.',
        ),
      ],
    };
  },
  proverka(c) {
    /* A в начале координат, AD = b по оси x, AB = a под углом φ:
       расстояние от D до AB равно b·sin φ = h. */
    const sin = c.h! / c.b!;
    const B: T = [c.a! * Math.sqrt(1 - sin * sin), c.a! * sin];
    return prov(ploshchadMn([[0, 0], B, [B[0] + c.b!, B[1]], [c.b!, 0]]) / c.b!);
  },
  scena(c) {
    const f0 = Math.asin(c.h! / c.b!) / RAD;
    /* Основание высоты из D не должно слипаться с вершиной B: угол
       рисунка растёт, пока основание не уйдёт внутрь стороны AB
       (или далеко за B). */
    let f = clamp(f0, 28, 75);
    let t = parallelogramm(f, c.b, c.a);
    const blizko = () => {
      const u = projT(t.D, t.A, t.B);
      return u > 0.85 && u < 1.3;
    };
    for (let i = 0; i < 12 && blizko(); i += 1) {
      f = Math.min(f + 5, 85);
      t = parallelogramm(f, c.b, c.a);
    }
    const x = zq(q(c.a! * c.h!, c.b));
    return {
      tochki: { ...t, H: { osnovanie: ['B', 'A', 'D'] }, K: { osnovanie: ['D', 'A', 'B'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        ...vysota('D', 'A', 'B', 'K', gdeOsnovanie(t.D, t.A, t.B), {
          vydelit: 'dano',
          znachenie: String(c.h),
        }),
        ...vysota('B', 'A', 'D', 'H', null, { vydelit: 'iskomoe', znachenie: x, otvet: true }),
        storona('A', 'D', String(c.b)),
        storona('A', 'B', String(c.a)),
      ],
      podpisi: false,
      otvet: x,
      ...skh(f, f0),
    };
  },
  bukvy: () => [],
});

/* ── P32. Ромб: высота и угол 30° → площадь (119–122) ──────────── */

const P32 = prototip({
  id: 'P32',
  gruppa: '2A',
  title: 'Ромб: высота и угол $30^\\circ$ → площадь',
  dannye: dannye('P32'),
  polya: ['h2'],
  text: (c) =>
    `Найдите площадь ромба, если его высота равна ${m$(iz(c.h2!, true))}, а острый угол равен $30^\\circ$.`,
  solve(c, sd) {
    const h = iz(c.h2!, true);
    const a = umn(h, q(2));
    const S = umn(a, h);
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Сторона ромба',
          lines: [
            'Высота, проведённая из вершины тупого угла, отсекает прямоугольный треугольник: сторона ромба — его гипотенуза, высота — катет против угла $30^\\circ$.',
            `Катет против угла $30^\\circ$ равен половине гипотенузы, поэтому сторона вдвое больше высоты: $a = 2 \\cdot ${tq(h)} = ${tq(a)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [
            'Площадь ромба (как у любого параллелограмма) — сторона, умноженная на высоту:',
            `$S = a \\cdot h = ${tq(a)} \\cdot ${tq(h)} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна сторона ромба?',
          `$${tq(a)}$`,
          [`$${tq(h)}$`, `$${tq(del(h, q(2)))}$`],
          sd,
          'Высота лежит против угла $30^\\circ$, а сторона ромба — гипотенуза: она вдвое больше.',
        ),
        vopros(
          'По какой формуле считать площадь ромба?',
          '$S = a \\cdot h$',
          ['$S = \\dfrac{a \\cdot h}{2}$', '$S = a^2$'],
          sd + 1,
          'Ромб — параллелограмм: сторона на высоту к ней.',
        ),
      ],
    };
  },
  proverka(c) {
    const h = c.h2! / 2;
    const a = h / Math.sin(30 * RAD);
    return prov(a * a * Math.sin(30 * RAD));
  },
  scena(c) {
    const h = iz(c.h2!, true);
    const t = romb(30, c.h2);
    return {
      tochki: { ...t, H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        ug('D', 'A', 'B', { vydelit: 'dano', znachenie: '30°' }),
        ...vysota('B', 'A', 'D', 'H', null, { vydelit: 'dano', znachenie: zq(h) }),
      ],
      podpisi: false,
      proverki: [{ ugol: ['D', 'A', 'B'], gradusy: 30 }],
      otvet: zq(umn(h, umn(h, q(2)))),
    };
  },
  bukvy: () => [],
});

/* ── P33. Ромб и квадрат с равными сторонами (123–126) ─────────── */

const P33 = prototip({
  id: 'P33',
  gruppa: '2A',
  title: 'Ромб и квадрат с равными сторонами',
  dannye: dannye('P33'),
  polya: ['s'],
  text: (c) =>
    `Ромб и квадрат имеют равные стороны. Найдите площадь ромба, если его острый угол равен $30^\\circ$, а площадь квадрата равна $${c.s}$.`,
  solve(c, sd) {
    const S = q(c.s!, 2);
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Квадрат стороны',
          lines: [
            `Площадь квадрата со стороной $a$ равна $a^2$, значит, $a^2 = ${c.s}$. Саму сторону находить не нужно.`,
          ],
        },
        {
          title: 'Площадь ромба',
          lines: [
            'Площадь ромба — произведение двух сторон на синус угла между ними:',
            `$S = a^2 \\cdot \\sin 30^\\circ = ${c.s} \\cdot \\dfrac{1}{2} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Как связаны площадь ромба и площадь квадрата с той же стороной?',
          '$S_{\\text{ромба}} = a^2 \\sin 30^\\circ$',
          ['$S_{\\text{ромба}} = a^2$', '$S_{\\text{ромба}} = a^2 \\cos 30^\\circ$'],
          sd,
          'Площадь параллелограмма — две стороны на синус угла между ними.',
        ),
        vopros(
          'Чему равен $\\sin 30^\\circ$?',
          '$\\dfrac{1}{2}$',
          ['$\\dfrac{\\sqrt{3}}{2}$', '$\\dfrac{\\sqrt{2}}{2}$'],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    const a = Math.sqrt(c.s!);
    const B: T = [a * Math.cos(30 * RAD), a * Math.sin(30 * RAD)];
    return prov(ploshchadMn([[0, 0], B, [B[0] + a, B[1]], [a, 0]]));
  },
  scena(c) {
    const a = Math.sqrt(c.s!);
    const x0 = a * 1.35;
    const r = romb(30, a);
    const sdv = (p: T): T => [p[0] + x0, p[1]];
    return {
      tochki: {
        K: [0, 0],
        L: [0, a],
        M: [a, a],
        N: [a, 0],
        A: sdv(r.A),
        B: sdv(r.B),
        C: sdv(r.C),
        D: sdv(r.D),
      },
      elementy: [
        mn(['K', 'L', 'M', 'N']),
        pryam('N', 'K', 'L'),
        shtrih('K', 'L', 1),
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        shtrih('A', 'B', 1),
        ug('D', 'A', 'B', { vydelit: 'dano', znachenie: '30°' }),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['K', 'L'],
            ['A', 'B'],
            ['A', 'D'],
          ],
        },
      ],
      otvet: zq(q(c.s!, 2)),
    };
  },
  bukvy: () => [],
});

/* ── P34. Трапеция: боковая сторона под углом 150° (127–130) ───── */

const P34 = prototip({
  id: 'P34',
  gruppa: '2B',
  title: 'Трапеция: боковая сторона и угол $150^\\circ$ → площадь',
  dannye: dannye('P34'),
  polya: ['a', 'b', 'c'],
  text: (c) =>
    `Основания трапеции равны $${c.a}$ и $${c.b}$, боковая сторона, равная $${c.c}$, образует с одним из оснований трапеции угол $150^\\circ$. Найдите площадь трапеции.`,
  solve(c, sd) {
    const h = q(c.c!, 2);
    const sr = q(c.a! + c.b!, 2);
    const S = umn(sr, h);
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Острый угол при другом основании',
          lines: [
            'Основания параллельны, поэтому углы, прилежащие к боковой стороне, в сумме дают $180^\\circ$.',
            'Боковая сторона образует с другим основанием угол $180^\\circ - 150^\\circ = 30^\\circ$.',
          ],
        },
        {
          title: 'Высота',
          lines: [
            `Опустим высоту из конца боковой стороны. Получится прямоугольный треугольник с гипотенузой $${c.c}$ и углом $30^\\circ$.`,
            `Высота — катет против угла $30^\\circ$: $h = ${c.c} : 2 = ${tq(h)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [
            `$S = \\dfrac{${c.a} + ${c.b}}{2} \\cdot h = ${tq(sr)} \\cdot ${tq(h)} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна высота трапеции?',
          `$${tq(h)}$`,
          [`$${c.c}$`, `$${tq(umn(q(c.c!), q(2)))}$`],
          sd,
          'Высота лежит против угла $30^\\circ$ в треугольнике с гипотенузой — боковой стороной.',
        ),
        vopros(
          'По какой формуле считать площадь трапеции?',
          '$S = \\dfrac{a + b}{2} \\cdot h$',
          ['$S = (a + b) \\cdot h$', '$S = \\dfrac{a \\cdot b}{2} \\cdot h$'],
          sd + 1,
          'Полусумма оснований на высоту.',
        ),
      ],
    };
  },
  proverka(c) {
    const B: T = [c.c! * Math.cos(30 * RAD), c.c! * Math.sin(30 * RAD)];
    return prov(ploshchadMn([[0, 0], B, [B[0] + c.a!, B[1]], [c.b!, 0]]));
  },
  scena(c) {
    const B: T = [c.c! * Math.cos(30 * RAD), c.c! * Math.sin(30 * RAD)];
    const C: T = [B[0] + c.a!, B[1]];
    /* Угол при D — от 12° до 65°: иначе вершины D и C слипаются или
       сторона CD ложится на основание. */
    const d0 = c.b!;
    const d = clamp(d0, C[0] + B[1] / Math.tan(65 * RAD), C[0] + B[1] / Math.tan(12 * RAD));
    const S = zq(umn(q(c.a! + c.b!, 2), q(c.c!, 2)));
    return {
      tochki: { A: [0, 0], B, C, D: [d, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '150°' }),
        storona('A', 'D', String(c.b)),
        storona('B', 'C', String(c.a)),
        storona('A', 'B', String(c.c)),
      ],
      podpisi: false,
      proverki: [
        { ugol: ['A', 'B', 'C'], gradusy: 150 },
        {
          parallelny: [
            ['A', 'D'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: S,
      ...skh(d, d0),
    };
  },
  bukvy: () => [],
});

/* ── P35. Трапеция: площадь треугольника ABC (131–134) ─────────── */

const P35 = prototip({
  id: 'P35',
  gruppa: '2B',
  title: 'Трапеция: площадь треугольника $ABC$',
  dannye: dannye('P35'),
  polya: ['a', 'b', 's'],
  text: (c) =>
    `В трапеции $ABCD$ известно, что $AD = ${c.a}$, $BC = ${c.b}$, а её площадь равна $${c.s}$. Найдите площадь треугольника $ABC$.`,
  solve(c, sd) {
    const x = q(c.s! * c.b!, c.a! + c.b!);
    return {
      otvet: zq(x),
      etapy: [
        {
          title: 'Общая высота',
          lines: [
            'Высота треугольника $ABC$, опущенная на сторону $BC$, равна высоте трапеции $h$: вершина $A$ лежит на другом основании.',
            `$S_{ABC} = \\dfrac{${c.b} \\cdot h}{2}$, $\\;S_{ABCD} = \\dfrac{(${c.a} + ${c.b}) \\cdot h}{2}$.`,
          ],
        },
        {
          title: 'Отношение площадей',
          lines: [
            `Площади относятся как $${c.b} : (${c.a} + ${c.b}) = ${c.b} : ${c.a! + c.b!}$.`,
            `$S_{ABC} = ${c.s} \\cdot \\dfrac{${c.b}}{${c.a! + c.b!}} = ${tq(x)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какую часть площади трапеции составляет площадь треугольника $ABC$?',
          `$\\dfrac{${c.b}}{${c.a! + c.b!}}$`,
          [`$\\dfrac{${c.b}}{${c.a}}$`, `$\\dfrac{${c.a}}{${c.a! + c.b!}}$`],
          sd,
          'Высота общая, поэтому площади относятся как $BC$ к сумме оснований.',
        ),
        vopros(
          'Чему равна площадь треугольника $ABC$?',
          `$${tq(x)}$`,
          [`$${tq(q(c.s! * c.a!, c.a! + c.b!))}$`, `$${tq(q(c.s!, 2))}$`],
          sd + 2,
        ),
      ],
    };
  },
  proverka(c) {
    const h = (2 * c.s!) / (c.a! + c.b!);
    const B: T = [(c.a! - c.b!) * 0.3, h];
    const C: T = [B[0] + c.b!, h];
    return prov(ploshchadMn([[0, 0], B, C]));
  },
  scena(c) {
    const h0 = (2 * c.s!) / (c.a! + c.b!);
    const h = clamp(h0, 0.4 * c.a!, 0.75 * c.a!);
    const B: T = [(c.a! - c.b!) * 0.3, h];
    return {
      tochki: { A: [0, 0], B, C: [B[0] + c.b!, h], D: [c.a!, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        storona('A', 'D', String(c.a)),
        storona('B', 'C', String(c.b)),
      ],
      proverki: [
        {
          parallelny: [
            ['A', 'D'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: zq(q(c.s! * c.b!, c.a! + c.b!)),
      ...skh(h, h0),
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D'],
});

/* ── Равнобедренный треугольник ABC с медианой BM ─────────────── */

/** Точки: основание AC = b по оси x, M — середина, BM = m. */
const ravnobedr = (b: number, m: number) => ({
  A: [-b / 2, 0] as T,
  C: [b / 2, 0] as T,
  B: [0, m] as T,
  M: [0, 0] as T,
});

/* ── P36. Медиана перпендикулярна стороне (135–138) ────────────── */

const P36 = prototip({
  id: 'P36',
  gruppa: '2C',
  title: 'Медиана $BM \\perp AC$ → сторона $AB$',
  dannye: dannye('P36'),
  polya: ['m', 'b'],
  text: (c) =>
    `В треугольнике $ABC$ медиана $BM$ перпендикулярна $AC$. Найдите $AB$, если $BM = ${c.m}$, $AC = ${c.b}$.`,
  solve(c, sd) {
    const am = q(c.b!, 2);
    const ab2 = plus(kv(q(c.m!)), kv(am));
    const ab = koren(ab2);
    return {
      otvet: zq(ab),
      etapy: [
        {
          title: 'Половина стороны',
          lines: [`$M$ — середина $AC$, поэтому $AM = ${c.b} : 2 = ${tq(am)}$.`],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            '$BM \\perp AC$, значит, треугольник $ABM$ прямоугольный с прямым углом $M$, $AB$ — гипотенуза.',
            `$AB^2 = BM^2 + AM^2 = ${c.m}^2 + ${tq(am)}^2 = ${tq(ab2)}$.`,
            `$AB = \\sqrt{${tq(ab2)}} = ${tq(ab)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен отрезок $AM$?',
          `$${tq(am)}$`,
          [`$${c.b}$`, `$${c.m}$`],
          sd,
          'Медиана делит сторону пополам.',
        ),
        vopros(
          'Как найти $AB$?',
          '$AB^2 = BM^2 + AM^2$',
          ['$AB^2 = AM^2 - BM^2$', '$AB = BM + AM$'],
          sd + 1,
          '$AB$ — гипотенуза прямоугольного треугольника $ABM$.',
        ),
      ],
    };
  },
  proverka(c) {
    const t = ravnobedr(c.b!, c.m!);
    return prov(rasst(t.A, t.B));
  },
  scena(c) {
    const ab = zq(koren(plus(kv(q(c.m!)), kv(q(c.b!, 2)))));
    return {
      tochki: ravnobedr(c.b!, c.m!),
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'M', { vydelit: 'dano', znachenie: String(c.m) }),
        pryam('B', 'M', 'C'),
        shtrih('A', 'M', 1),
        shtrih('M', 'C', 1),
        storona('A', 'C', String(c.b)),
        iskomyy('A', 'B', ab),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'M'],
            ['M', 'C'],
          ],
        },
        { ugol: ['B', 'M', 'C'], vid: 'pryamoy' },
      ],
      otvet: ab,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'M'],
});

/* ── P37. Медиана равнобедренного треугольника (139–146) ───────── */

const P37 = prototip({
  id: 'P37',
  gruppa: '2C',
  title: 'Равнобедренный треугольник: медиана к основанию',
  dannye: dannye('P37'),
  polya: ['v', 'l', 'b'],
  text: (c) =>
    c.v === 0
      ? `В треугольнике $ABC$ известно, что $AB = BC = ${c.l}$, $AC = ${c.b}$. Найдите длину медианы $BM$.`
      : `В треугольнике каждая из двух сторон равна $${c.l}$, а третья сторона равна $${c.b}$. Найдите длину медианы, проведённой к третьей стороне треугольника.`,
  solve(c, sd) {
    const am = q(c.b!, 2);
    const bm2 = minus(kv(q(c.l!)), kv(am));
    const bm = koren(bm2);
    const [AB, AM, BM, ABM] = c.v === 0 ? ['AB', 'AM', 'BM', 'ABM'] : ['l', 'x', 'm', ''];
    return {
      otvet: zq(bm),
      etapy: [
        {
          title: 'Медиана — высота',
          lines: [
            c.v === 0
              ? 'Треугольник $ABC$ равнобедренный с основанием $AC$. Медиана к основанию является и высотой: $BM \\perp AC$.'
              : 'Треугольник равнобедренный, третья сторона — основание. Медиана к основанию является и высотой.',
            `Медиана делит основание пополам: $${AM} = ${c.b} : 2 = ${tq(am)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            c.v === 0
              ? `В прямоугольном треугольнике $${ABM}$ гипотенуза $AB = ${c.l}$, катет $AM = ${tq(am)}$.`
              : `Медиана $${BM}$ — катет прямоугольного треугольника с гипотенузой $${AB} = ${c.l}$ и катетом $${tq(am)}$.`,
            `$${BM}^2 = ${c.l}^2 - ${tq(am)}^2 = ${tq(bm2)}$, $\\;${BM} = \\sqrt{${tq(bm2)}} = ${tq(bm)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какой угол образует медиана с основанием?',
          '$90^\\circ$',
          ['$60^\\circ$', '$45^\\circ$'],
          sd,
          'В равнобедренном треугольнике медиана к основанию — ещё и высота.',
        ),
        vopros(
          'Чему равен квадрат медианы?',
          `$${c.l}^2 - ${tq(am)}^2$`,
          [`$${c.l}^2 + ${tq(am)}^2$`, `$${c.l}^2 - ${c.b}^2$`],
          sd + 1,
          'Медиана — катет, боковая сторона — гипотенуза, катет — половина основания.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Формула Герона: площадь, затем высота к основанию. */
    return prov((2 * geron(c.l!, c.l!, c.b!)) / c.b!);
  },
  scena(c) {
    const m = Math.sqrt(c.l! * c.l! - (c.b! * c.b!) / 4);
    const bm = zq(koren(minus(kv(q(c.l!)), kv(q(c.b!, 2)))));
    return {
      tochki: ravnobedr(c.b!, m),
      elementy: [
        tri('A', 'B', 'C'),
        iskomyy('B', 'M', bm),
        shtrih('A', 'M', 2),
        shtrih('M', 'C', 2),
        storona('A', 'B', String(c.l)),
        shtrih('B', 'C', 1),
        shtrih('A', 'B', 1),
        storona('A', 'C', String(c.b)),
      ],
      podpisi: c.v === 0,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: bm,
    };
  },
  bukvy: (c) => (c.v === 0 ? ['A', 'B', 'C', 'M'] : []),
});

/* ── P38. Прямоугольник и равнобедренный треугольник ABE (147–150) */

const P38 = prototip({
  id: 'P38',
  gruppa: '2E',
  title: 'Прямоугольник: равнобедренный $ABE$ → отрезок $ED$',
  dannye: dannye('P38'),
  polya: ['a', 'b'],
  text: (c) =>
    `На стороне $BC$ прямоугольника $ABCD$, у которого $AB = ${c.a}$ и $AD = ${c.b}$, отмечена точка $E$ так, что треугольник $ABE$ равнобедренный. Найдите $ED$.`,
  solve(c, sd) {
    const ec = c.b! - c.a!;
    const ed2 = c.a! * c.a! + ec * ec;
    const ed = korenTseliy(ed2);
    return {
      otvet: String(ed),
      etapy: [
        {
          title: 'Отрезок BE',
          lines: [
            'Угол $B$ прямоугольника прямой, поэтому в равнобедренном треугольнике $ABE$ равны катеты: $BE = AB = ' +
              `${c.a}$.`,
          ],
        },
        {
          title: 'Отрезок EC',
          lines: [`$BC = AD = ${c.b}$, $\\;EC = BC - BE = ${c.b} - ${c.a} = ${ec}$.`],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `Треугольник $ECD$ прямоугольный: $CD = AB = ${c.a}$, угол $C$ прямой.`,
            `$ED^2 = EC^2 + CD^2 = ${ec}^2 + ${c.a}^2 = ${ed2}$, $\\;ED = ${ed}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен отрезок $EC$?',
          `$${ec}$`,
          [`$${c.a}$`, `$${c.b! + c.a!}$`],
          sd,
          `$BE = AB = ${c.a}$, а вся сторона $BC = ${c.b}$.`,
        ),
        vopros(
          'Из какого треугольника находится $ED$?',
          'из прямоугольного $ECD$',
          ['из равнобедренного $ABE$', 'из треугольника $AED$'],
          sd + 1,
          'В треугольнике $ECD$ известны оба катета.',
        ),
      ],
    };
  },
  proverka(c) {
    return prov(rasst([c.a!, c.a!], [c.b!, 0]));
  },
  scena(c) {
    const ed = String(korenTseliy(c.a! * c.a! + (c.b! - c.a!) ** 2));
    return {
      tochki: { A: [0, 0], B: [0, c.a!], C: [c.b!, c.a!], D: [c.b!, 0], E: [c.a!, c.a!] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'E'),
        iskomyy('E', 'D', ed),
        storona('A', 'B', String(c.a)),
        shtrih('A', 'B', 1),
        shtrih('B', 'E', 1),
        storona('A', 'D', String(c.b)),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'E'],
          ],
        },
        { naPryamoy: ['B', 'E', 'C'] },
      ],
      otvet: ed,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D', 'E'],
});

/* ── P39. Равные диагонали параллелограмма (151–154) ───────────── */

const P39 = prototip({
  id: 'P39',
  gruppa: '2E',
  title: 'Параллелограмм с равными диагоналями: соседняя сторона',
  dannye: dannye('P39'),
  polya: ['d', 'a'],
  text: (c) =>
    `Обе диагонали параллелограмма равны $${c.d}$. Одна из сторон параллелограмма равна $${c.a}$. Найдите сторону параллелограмма, соседнюю с данной.`,
  solve(c, sd) {
    const x2 = c.d! * c.d! - c.a! * c.a!;
    const x = korenTseliy(x2);
    return {
      otvet: String(x),
      etapy: [
        {
          title: 'Это прямоугольник',
          lines: ['Параллелограмм с равными диагоналями — прямоугольник: все его углы прямые.'],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            'Диагональ делит прямоугольник на два прямоугольных треугольника: стороны — катеты, диагональ — гипотенуза.',
            `$x^2 = ${c.d}^2 - ${c.a}^2 = ${x2}$, $\\;x = ${x}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Каким параллелограммом является параллелограмм с равными диагоналями?',
          'прямоугольником',
          ['ромбом', 'любым — это ничего не даёт'],
          sd,
        ),
        vopros(
          'Как найти соседнюю сторону $x$?',
          `$x^2 = ${c.d}^2 - ${c.a}^2$`,
          [`$x^2 = ${c.d}^2 + ${c.a}^2$`, `$x = ${c.d} - ${c.a}$`],
          sd + 1,
          'Диагональ — гипотенуза, стороны — катеты.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Сумма квадратов диагоналей равна сумме квадратов всех сторон. */
    return prov(Math.sqrt((c.d! * c.d! + c.d! * c.d!) / 2 - c.a! * c.a!));
  },
  scena(c) {
    const x = korenTseliy(c.d! * c.d! - c.a! * c.a!);
    return {
      tochki: { A: [0, 0], B: [0, c.a!], C: [x, c.a!], D: [x, 0] },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        otr('B', 'D', { vydelit: 'dano', znachenie: String(c.d) }),
        storona('A', 'B', String(c.a)),
        iskomyy('A', 'D', String(x)),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      ],
      otvet: String(x),
    };
  },
  bukvy: () => [],
});

/* ── Равнобедренная трапеция ──────────────────────────────────── */

/** Основания a < b, боковая c: высота как дробь и вершины. */
function rbTrapeciya(a: number, b: number, c: number) {
  const pr = q(b - a, 2);
  const h2 = minus(kv(q(c)), kv(pr));
  const h = koren(h2);
  const hf = h[0] / h[1];
  const x = (b - a) / 2;
  return {
    pr,
    h2,
    h,
    tochki: { A: [0, 0] as T, B: [x, hf] as T, C: [x + a, hf] as T, D: [b, 0] as T },
  };
}

const rbElementy = (c: Ch) => [
  mn(['A', 'B', 'C', 'D']),
  storona('A', 'D', String(c.b)),
  storona('B', 'C', String(c.a)),
  storona('A', 'B', String(c.c)),
  shtrih('A', 'B', 1),
  shtrih('C', 'D', 1),
];

/* ── P40. Равнобедренная трапеция: высота (155–158) ────────────── */

const P40 = prototip({
  id: 'P40',
  gruppa: '2B',
  title: 'Равнобедренная трапеция: высота',
  dannye: dannye('P40'),
  polya: ['a', 'b', 'c'],
  text: (c) =>
    `Основания равнобедренной трапеции равны $${c.a}$ и $${c.b}$, боковая сторона равна $${c.c}$. Найдите высоту трапеции.`,
  solve(c, sd) {
    const t = rbTrapeciya(c.a!, c.b!, c.c!);
    return {
      otvet: zq(t.h),
      etapy: [
        {
          title: 'Проекция боковой стороны',
          lines: [
            'Опустим высоты из концов меньшего основания. Они отсекают от большего основания два равных отрезка, а между ними остаётся отрезок, равный меньшему основанию.',
            `Каждый крайний отрезок: $\\dfrac{${c.b} - ${c.a}}{2} = ${tq(t.pr)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `Высота — катет прямоугольного треугольника с гипотенузой $${c.c}$ и катетом $${tq(t.pr)}$.`,
            `$h^2 = ${c.c}^2 - ${tq(t.pr)}^2 = ${tq(t.h2)}$, $\\;h = ${tq(t.h)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какой отрезок большего основания отсекает высота?',
          `$${tq(t.pr)}$`,
          [`$${c.b! - c.a!}$`, `$${tq(q(c.a! + c.b!, 2))}$`],
          sd,
          'Разность оснований делится поровну на два крайних отрезка.',
        ),
        vopros(
          'Чему равен квадрат высоты?',
          `$${c.c}^2 - ${tq(t.pr)}^2$`,
          [`$${c.c}^2 + ${tq(t.pr)}^2$`, `$${c.c}^2 - ${c.b! - c.a!}^2$`],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    /* Сдвинем одну боковую сторону к другой: треугольник со сторонами
       c, c, b − a имеет ту же высоту, что и трапеция. */
    return prov((2 * geron(c.c!, c.c!, c.b! - c.a!)) / (c.b! - c.a!));
  },
  scena(c) {
    const t = rbTrapeciya(c.a!, c.b!, c.c!);
    return {
      tochki: { ...t.tochki, H: { osnovanie: ['B', 'A', 'D'] } },
      elementy: [
        ...rbElementy(c),
        ...vysota('B', 'A', 'D', 'H', null, {
          vydelit: 'iskomoe',
          znachenie: zq(t.h),
          otvet: true,
        }),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      ],
      otvet: zq(t.h),
    };
  },
  bukvy: () => [],
});

/* ── P41. Равнобедренная трапеция: диагональ (159–162) ─────────── */

const P41 = prototip({
  id: 'P41',
  gruppa: '2B',
  title: 'Равнобедренная трапеция: диагональ',
  dannye: dannye('P41'),
  polya: ['a', 'b', 'c'],
  text: (c) =>
    `Основания равнобедренной трапеции равны $${c.a}$ и $${c.b}$, боковая сторона равна $${c.c}$. Найдите длину диагонали трапеции.`,
  solve(c, sd) {
    const t = rbTrapeciya(c.a!, c.b!, c.c!);
    const ah = q(c.a! + c.b!, 2);
    const d2 = plus(t.h2, kv(ah));
    const d = koren(d2);
    return {
      otvet: zq(d),
      etapy: [
        {
          title: 'Высота',
          lines: [
            `Высота из вершины меньшего основания отсекает от большего отрезок $\\dfrac{${c.b} - ${c.a}}{2} = ${tq(t.pr)}$.`,
            `$h^2 = ${c.c}^2 - ${tq(t.pr)}^2 = ${tq(t.h2)}$, $\\;h = ${tq(t.h)}$.`,
          ],
        },
        {
          title: 'Второй катет',
          lines: [
            `Диагональ из того же конца большего основания — гипотенуза прямоугольного треугольника с катетом $h$. Второй катет — оставшаяся часть большего основания: $${c.b} - ${tq(t.pr)} = ${tq(ah)}$ (это полусумма оснований).`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [`$d^2 = ${tq(t.h)}^2 + ${tq(ah)}^2 = ${tq(d2)}$, $\\;d = ${tq(d)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равна высота трапеции?',
          `$${tq(t.h)}$`,
          [`$${c.c}$`, `$${tq(t.pr)}$`],
          sd,
          `Катет при гипотенузе $${c.c}$ и другом катете $${tq(t.pr)}$.`,
        ),
        vopros(
          'Какой отрезок большего основания — второй катет для диагонали?',
          `$${tq(ah)}$`,
          [`$${tq(t.pr)}$`, `$${c.b}$`],
          sd + 1,
          'Большее основание минус крайний отрезок — это полусумма оснований.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Теорема Птолемея для вписанной равнобедренной трапеции: d² = ab + c². */
    return prov(Math.sqrt(c.a! * c.b! + c.c! * c.c!));
  },
  scena(c) {
    const t = rbTrapeciya(c.a!, c.b!, c.c!);
    const d = zq(koren(plus(t.h2, kv(q(c.a! + c.b!, 2)))));
    return {
      tochki: t.tochki,
      elementy: [...rbElementy(c), iskomyy('A', 'C', d)],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      ],
      otvet: d,
    };
  },
  bukvy: () => [],
});

export const PLOSHCHAD_12_2: Prototip[] = [P31, P32, P33, P34, P35, P36, P37, P38, P39, P40, P41];
