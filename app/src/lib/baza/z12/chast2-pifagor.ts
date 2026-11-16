/**
 * База, задание №12, часть 2: ромб, прямоугольник и треугольник —
 * теорема Пифагора и площадь (задачи 163–214 задачника, прототипы
 * P42–P54).
 */

import { mn, oblast, otr, pryam, shtrih, tri, ug, vysota } from '@/lib/planimetriya/stseny/dsl';
import { nod } from '../chisla';
import type { Prototip } from '../types';
import { DANNYE_12_2 as D } from './chast2-dannye';
import {
  type Q,
  type T,
  del,
  geron,
  iskomyy,
  koren,
  kv,
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

const f = (x: Q): number => x[0] / x[1];

/** Ромб по диагоналям: AC = p по оси x, BD = r по оси y, O — центр. */
const rombD = (p: number, r: number) => ({
  A: [-p / 2, 0] as T,
  B: [0, r / 2] as T,
  C: [p / 2, 0] as T,
  D: [0, -r / 2] as T,
});

/** Прямоугольник ABCD: AB = a — вертикальная сторона, AD = b — нижняя. */
const pryamoug = (a: number, b: number) => ({
  A: [0, 0] as T,
  B: [0, a] as T,
  C: [b, a] as T,
  D: [b, 0] as T,
});

/** Прямоугольный треугольник: C — прямой угол, CA = a (вертикальный катет), CB = b. */
const pryamTr = (a: number, b: number) => ({ C: [0, 0] as T, A: [0, a] as T, B: [b, 0] as T });

const ROMB_DIAGONALI =
  'Диагонали параллелограмма — биссектрисы его углов, значит, это ромб: в треугольнике $ABC$ углы при $A$ и $C$ равны, поэтому $AB = BC$.';

/* ── P42. Ромб: сторона и диагональ → другая диагональ (163–166) ── */

const P42 = prototip({
  id: 'P42',
  gruppa: '2E',
  title: 'Ромб: сторона и диагональ → другая диагональ',
  dannye: dannye('P42'),
  polya: ['a', 'd'],
  text: (c) =>
    `В параллелограмме $ABCD$ диагонали являются биссектрисами его углов, $AB = ${c.a}$, $AC = ${c.d}$. Найдите $BD$.`,
  solve(c, sd) {
    const ao = q(c.d!, 2);
    const bo2 = minus(kv(q(c.a!)), kv(ao));
    const bo = koren(bo2);
    const bd = umn(bo, q(2));
    return {
      otvet: zq(bd),
      etapy: [
        { title: 'Это ромб', lines: [ROMB_DIAGONALI] },
        {
          title: 'Половины диагоналей',
          lines: [
            'Диагонали ромба перпендикулярны и точкой пересечения $O$ делятся пополам.',
            `$AO = ${c.d} : 2 = ${tq(ao)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `В прямоугольном треугольнике $AOB$: $BO^2 = AB^2 - AO^2 = ${c.a}^2 - ${tq(ao)}^2 = ${tq(bo2)}$, $\\;BO = ${tq(bo)}$.`,
            `$BD = 2 \\cdot BO = ${tq(bd)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Каким параллелограммом является $ABCD$?',
          'ромбом',
          ['прямоугольником', 'квадратом'],
          sd,
          'Диагональ — биссектриса, поэтому соседние стороны равны.',
        ),
        vopros(
          'Чему равен $BO$ — половина диагонали $BD$?',
          `$${tq(bo)}$`,
          [`$${tq(bd)}$`, `$${tq(minus(q(c.a!), ao))}$`],
          sd + 1,
          `Катет треугольника $AOB$ с гипотенузой $${c.a}$ и катетом $${tq(ao)}$.`,
        ),
      ],
    };
  },
  proverka(c) {
    const pol = Math.acos(c.d! / 2 / c.a!);
    return prov(2 * c.a! * Math.sin(pol));
  },
  scena(c) {
    const bd = umn(koren(minus(kv(q(c.a!)), kv(q(c.d!, 2)))), q(2));
    return {
      tochki: rombD(c.d!, f(bd)),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        iskomyy('B', 'D', zq(bd)),
        storona('A', 'B', String(c.a)),
        ug('B', 'A', 'C', { dugi: 1 }),
        ug('C', 'A', 'D', { dugi: 1 }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
            ['C', 'D'],
            ['D', 'A'],
          ],
        },
      ],
      otvet: zq(bd),
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D'],
});

/* ── P43. Ромб: диагонали → периметр (167–170) ─────────────────── */

const P43 = prototip({
  id: 'P43',
  gruppa: '2E',
  title: 'Ромб: две диагонали → периметр',
  dannye: dannye('P43'),
  polya: ['p', 'q'],
  text: (c) =>
    `В параллелограмме $ABCD$ диагонали являются биссектрисами его углов и равны $${c.p}$ и $${c.q}$. Найдите периметр параллелограмма $ABCD$.`,
  solve(c, sd) {
    const x = q(c.p!, 2);
    const y = q(c.q!, 2);
    const a2 = plus(kv(x), kv(y));
    const a = koren(a2);
    const P = umn(a, q(4));
    return {
      otvet: zq(P),
      etapy: [
        { title: 'Это ромб', lines: [ROMB_DIAGONALI, 'У ромба все четыре стороны равны.'] },
        {
          title: 'Сторона ромба',
          lines: [
            `Диагонали ромба перпендикулярны и делятся точкой пересечения пополам: половины равны $${tq(x)}$ и $${tq(y)}$.`,
            `Сторона — гипотенуза: $a^2 = ${tq(x)}^2 + ${tq(y)}^2 = ${tq(a2)}$, $\\;a = ${tq(a)}$.`,
          ],
        },
        { title: 'Периметр', lines: [`$P = 4a = 4 \\cdot ${tq(a)} = ${tq(P)}$.`] },
      ],
      hints: [
        vopros(
          'Какие катеты у прямоугольного треугольника, где сторона ромба — гипотенуза?',
          `$${tq(x)}$ и $${tq(y)}$`,
          [`$${c.p}$ и $${c.q}$`, `$${tq(x)}$ и $${c.q}$`],
          sd,
          'Катеты — половины диагоналей.',
        ),
        vopros(
          'Чему равна сторона ромба?',
          `$${tq(a)}$`,
          [`$${tq(P)}$`, `$${tq(plus(x, y))}$`],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    const t = rombD(c.p!, c.q!);
    return prov(rasst(t.A, t.B) + rasst(t.B, t.C) + rasst(t.C, t.D) + rasst(t.D, t.A));
  },
  scena(c) {
    const P = zq(umn(koren(plus(kv(q(c.p!, 2)), kv(q(c.q!, 2)))), q(4)));
    return {
      tochki: rombD(c.p!, c.q!),
      elementy: [
        mn(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.p) }),
        otr('B', 'D', { vydelit: 'dano', znachenie: String(c.q) }),
        ug('B', 'A', 'C', { dugi: 1 }),
        ug('C', 'A', 'D', { dugi: 1 }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
            ['C', 'D'],
            ['D', 'A'],
          ],
        },
      ],
      otvet: P,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D'],
});

/* ── P44. Параллелограмм с равными диагоналями: площадь (171–174) ─ */

const P44 = prototip({
  id: 'P44',
  gruppa: '2A',
  title: 'Параллелограмм с равными диагоналями: площадь',
  dannye: dannye('P44'),
  polya: ['a', 'd'],
  text: (c) =>
    `В параллелограмме $ABCD$ известно, что $AB = ${c.a}$, $AC = BD = ${c.d}$. Найдите площадь параллелограмма.`,
  solve(c, sd) {
    const ad2 = c.d! * c.d! - c.a! * c.a!;
    const ad = koren(q(ad2));
    const S = umn(ad, q(c.a!));
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Это прямоугольник',
          lines: ['Диагонали параллелограмма равны — значит, это прямоугольник, угол $B$ прямой.'],
        },
        {
          title: 'Вторая сторона',
          lines: [
            'В прямоугольном треугольнике $ABC$ диагональ $AC$ — гипотенуза.',
            `$BC^2 = AC^2 - AB^2 = ${c.d}^2 - ${c.a}^2 = ${ad2}$, $\\;BC = ${tq(ad)}$.`,
          ],
        },
        { title: 'Площадь', lines: [`$S = AB \\cdot BC = ${c.a} \\cdot ${tq(ad)} = ${tq(S)}$.`] },
      ],
      hints: [
        vopros(
          'Каким параллелограммом является $ABCD$?',
          'прямоугольником',
          ['ромбом', 'трапецией'],
          sd,
          'Равные диагонали бывают у параллелограмма, только если он прямоугольник.',
        ),
        vopros(
          'Чему равна сторона $BC$?',
          `$${tq(ad)}$`,
          [`$${c.d! - c.a!}$`, `$${c.d}$`],
          sd + 1,
          '$AC$ — гипотенуза треугольника $ABC$.',
        ),
      ],
    };
  },
  proverka(c) {
    const b = Math.sqrt(c.d! * c.d! - c.a! * c.a!);
    const t = pryamoug(c.a!, b);
    return prov(ploshchadMn([t.A, t.B, t.C, t.D]));
  },
  scena(c) {
    const ad = koren(q(c.d! * c.d! - c.a! * c.a!));
    return {
      tochki: pryamoug(c.a!, f(ad)),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        otr('B', 'D', { vydelit: 'dano', znachenie: String(c.d) }),
        storona('A', 'B', String(c.a)),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
      ],
      otvet: zq(umn(ad, q(c.a!))),
    };
  },
  bukvy: () => ['A', 'B', 'C', 'D'],
});

/* ── Равнобедренный треугольник ABC: основание AC по оси x ─────── */

const rbTr = (b: number, h: number) => ({
  A: [-b / 2, 0] as T,
  C: [b / 2, 0] as T,
  B: [0, h] as T,
  M: [0, 0] as T,
});

/* ── P45. Равнобедренный треугольник: площадь (175–178) ────────── */

const P45 = prototip({
  id: 'P45',
  gruppa: '2C',
  title: 'Равнобедренный треугольник: площадь по сторонам',
  dannye: dannye('P45'),
  polya: ['l', 'b'],
  text: (c) =>
    `В треугольнике $ABC$ известно, что $AB = BC = ${c.l}$, $AC = ${c.b}$. Найдите площадь треугольника $ABC$.`,
  solve(c, sd) {
    const am = q(c.b!, 2);
    const h2 = minus(kv(q(c.l!)), kv(am));
    const h = koren(h2);
    const S = umn(am, h);
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Высота к основанию',
          lines: [
            'Проведём высоту $BM$ к основанию $AC$. В равнобедренном треугольнике она и медиана: $AM = ' +
              `${c.b} : 2 = ${tq(am)}$.`,
            `$BM^2 = AB^2 - AM^2 = ${c.l}^2 - ${tq(am)}^2 = ${tq(h2)}$, $\\;BM = ${tq(h)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [
            `$S = \\dfrac{AC \\cdot BM}{2} = \\dfrac{${c.b} \\cdot ${tq(h)}}{2} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна высота $BM$, проведённая к основанию?',
          `$${tq(h)}$`,
          [`$${c.l}$`, `$${tq(am)}$`],
          sd,
          `Катет при гипотенузе $${c.l}$ и катете $${tq(am)}$.`,
        ),
        vopros(
          'Как найти площадь?',
          `$\\dfrac{${c.b} \\cdot ${tq(h)}}{2}$`,
          [`$${c.b} \\cdot ${tq(h)}$`, `$\\dfrac{${c.l} \\cdot ${c.b}}{2}$`],
          sd + 1,
          'Половина основания на высоту к нему.',
        ),
      ],
    };
  },
  proverka: (c) => prov(geron(c.l!, c.l!, c.b!)),
  scena(c) {
    const h = koren(minus(kv(q(c.l!)), kv(q(c.b!, 2))));
    return {
      tochki: rbTr(c.b!, f(h)),
      elementy: [
        tri('A', 'B', 'C'),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        storona('A', 'B', String(c.l)),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        storona('A', 'C', String(c.b)),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: zq(umn(q(c.b!, 2), h)),
    };
  },
  bukvy: () => ['A', 'B', 'C'],
});

/* ── P46. Равнобедренный треугольник: основание и площадь → боковая (179–182) */

const P46 = prototip({
  id: 'P46',
  gruppa: '2C',
  title: 'Равнобедренный треугольник: основание и площадь → боковая сторона',
  dannye: dannye('P46'),
  polya: ['b', 's'],
  text: (c) =>
    `В равнобедренном треугольнике $ABC$ основание $AC$ равно $${c.b}$, площадь треугольника равна $${c.s}$. Найдите длину боковой стороны $AB$.`,
  solve(c, sd) {
    const h = q(2 * c.s!, c.b!);
    const am = q(c.b!, 2);
    const ab2 = plus(kv(h), kv(am));
    const ab = koren(ab2);
    return {
      otvet: zq(ab),
      etapy: [
        {
          title: 'Высота к основанию',
          lines: [
            `Площадь равна половине основания на высоту $BM$: $${c.s} = \\dfrac{${c.b} \\cdot BM}{2}$.`,
            `$BM = \\dfrac{2 \\cdot ${c.s}}{${c.b}} = ${tq(h)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `Высота к основанию равнобедренного треугольника — и медиана: $AM = ${c.b} : 2 = ${tq(am)}$.`,
            `$AB^2 = AM^2 + BM^2 = ${tq(am)}^2 + ${tq(h)}^2 = ${tq(ab2)}$, $\\;AB = ${tq(ab)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна высота, проведённая к основанию?',
          `$${tq(h)}$`,
          [`$${tq(q(c.s!, c.b!))}$`, `$${tq(q(c.s!, 2))}$`],
          sd,
          'Удвоенную площадь делим на основание.',
        ),
        vopros(
          'Какие катеты у треугольника $ABM$?',
          `$${tq(am)}$ и $${tq(h)}$`,
          [`$${c.b}$ и $${tq(h)}$`, `$${tq(am)}$ и $${c.s}$`],
          sd + 1,
          'Половина основания и высота.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Перебор боковой стороны с шагом 0,5: площадь по формуле Герона. */
    for (let k = 1; k <= 4000; k += 1) {
      const l = k / 2;
      if (2 * l > c.b! && Math.abs(geron(l, l, c.b!) - c.s!) < 1e-6) return prov(l);
    }
    throw new Error('P46: перебор не нашёл стороны');
  },
  scena(c) {
    const h = q(2 * c.s!, c.b!);
    const ab = zq(koren(plus(kv(h), kv(q(c.b!, 2)))));
    return {
      tochki: rbTr(c.b!, f(h)),
      elementy: [
        tri('A', 'B', 'C'),
        iskomyy('A', 'B', ab),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
        storona('A', 'C', String(c.b)),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: ab,
    };
  },
  bukvy: () => ['A', 'B', 'C'],
});

/* ── P47. Равнобедренный треугольник: медиана и площадь k√n (183–186) */

/** k√n / m в TeX, сокращённо. */
function korenDrob(k: number, n: number, m: number): string {
  const g = nod(k, m);
  const [kk, mm] = [k / g, m / g];
  const ch = `${kk === 1 ? '' : kk}\\sqrt{${n}}`;
  return mm === 1 ? ch : `\\dfrac{${ch}}{${mm}}`;
}

const P47 = prototip({
  id: 'P47',
  gruppa: '2C',
  title: 'Равнобедренный треугольник: медиана и площадь с корнем',
  dannye: dannye('P47'),
  polya: ['m', 'k', 'n'],
  text: (c) =>
    `В треугольнике $ABC$ известно, что $AB = BC$, медиана $BM$ равна $${c.m}$. Площадь треугольника $ABC$ равна $${c.k}\\sqrt{${c.n}}$. Найдите длину стороны $AB$.`,
  solve(c, sd) {
    const am = korenDrob(c.k!, c.n!, c.m!);
    const am2 = q(c.k! * c.k! * c.n!, c.m! * c.m!);
    const ab2 = plus(q(c.m! * c.m!), am2);
    const ab = koren(ab2);
    return {
      otvet: zq(ab),
      etapy: [
        {
          title: 'Медиана — высота',
          lines: [
            'Треугольник равнобедренный с основанием $AC$, поэтому медиана $BM$ является высотой.',
            `$S = \\dfrac{AC \\cdot BM}{2} = AM \\cdot BM$, откуда $AM = \\dfrac{${c.k}\\sqrt{${c.n}}}{${c.m}} = ${am}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `$AM^2 = \\left(${am}\\right)^2 = ${tq(am2)}$.`,
            `$AB^2 = BM^2 + AM^2 = ${c.m! * c.m!} + ${tq(am2)} = ${tq(ab2)}$, $\\;AB = ${tq(ab)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Как площадь выражается через $AM$ и $BM$?',
          '$S = AM \\cdot BM$',
          ['$S = \\dfrac{AM \\cdot BM}{2}$', '$S = AB \\cdot BM$'],
          sd,
          '$AC = 2AM$, а площадь — половина $AC \\cdot BM$.',
        ),
        vopros(
          'Чему равен $AM^2$?',
          `$${tq(am2)}$`,
          [`$${tq(q(c.k! * c.k! * c.n!, c.m!))}$`, `$${tq(q(c.k! * c.n!, c.m!))}$`],
          sd + 1,
          'Возводим в квадрат и числитель, и знаменатель.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Перебор целой стороны: площадь при медиане m. */
    const S = c.k! * Math.sqrt(c.n!);
    for (let l = c.m! + 1; l <= 2000; l += 1) {
      if (Math.abs(Math.sqrt(l * l - c.m! * c.m!) * c.m! - S) < 1e-6) return prov(l);
    }
    throw new Error('P47: перебор не нашёл стороны');
  },
  scena(c) {
    const amF = (c.k! * Math.sqrt(c.n!)) / c.m!;
    const ab = zq(koren(plus(q(c.m! * c.m!), q(c.k! * c.k! * c.n!, c.m! * c.m!))));
    return {
      tochki: rbTr(2 * amF, c.m!),
      elementy: [
        tri('A', 'B', 'C'),
        otr('B', 'M', { vydelit: 'dano', znachenie: String(c.m) }),
        shtrih('A', 'M', 2),
        shtrih('M', 'C', 2),
        iskomyy('A', 'B', ab),
        shtrih('A', 'B', 1),
        shtrih('B', 'C', 1),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
          ],
        },
      ],
      otvet: ab,
    };
  },
  bukvy: () => ['A', 'B', 'C', 'M'],
});

/* ── P48. Прямоугольный треугольник: гипотенуза √n и катет → площадь (187–190) */

const P48 = prototip({
  id: 'P48',
  gruppa: '2D',
  title: 'Прямоугольный треугольник: гипотенуза $\\sqrt{n}$ → площадь',
  dannye: dannye('P48'),
  polya: ['n', 'a'],
  text: (c) =>
    `Найдите площадь прямоугольного треугольника, если его гипотенуза равна $\\sqrt{${c.n}}$, а один из катетов равен $${c.a}$.`,
  solve(c, sd) {
    const b2 = c.n! - c.a! * c.a!;
    const b = koren(q(b2));
    const S = umn(umn(q(c.a!), b), q(1, 2));
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Второй катет',
          lines: [
            `Квадрат гипотенузы: $\\left(\\sqrt{${c.n}}\\right)^2 = ${c.n}$.`,
            `$b^2 = ${c.n} - ${c.a}^2 = ${b2}$, $\\;b = ${tq(b)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [
            `Площадь прямоугольного треугольника — половина произведения катетов: $S = \\dfrac{${c.a} \\cdot ${tq(b)}}{2} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен квадрат второго катета?',
          `$${b2}$`,
          [`$${c.n! + c.a! * c.a!}$`, `$${c.n! - c.a!}$`],
          sd,
          `$(\\sqrt{${c.n}})^2 = ${c.n}$, из него вычитаем квадрат катета.`,
        ),
        vopros(
          'Как найти площадь прямоугольного треугольника?',
          '$\\dfrac{a \\cdot b}{2}$',
          ['$a \\cdot b$', '$\\dfrac{a \\cdot c}{2}$'],
          sd + 1,
          'Катеты — основание и высота.',
        ),
      ],
    };
  },
  proverka(c) {
    for (let b = 1; b * b <= c.n!; b += 1) {
      if (c.a! * c.a! + b * b === c.n) return prov((c.a! * b) / 2);
    }
    throw new Error('P48: перебор не нашёл катета');
  },
  scena(c) {
    const b = koren(q(c.n! - c.a! * c.a!));
    /* Катеты на рисунке — не больше чем вчетверо разные: иначе острый
       угол слипается в точку. */
    const bV = Math.min(Math.max(f(b), c.a! / 4), c.a! * 4);
    return {
      tochki: pryamTr(c.a!, bV),
      elementy: [
        tri('A', 'B', 'C'),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        storona('A', 'B', `√${c.n}`),
      ],
      podpisi: false,
      otvet: zq(umn(umn(q(c.a!), b), q(1, 2))),
      ...(bV === f(b) ? {} : { skhematichno: true }),
    };
  },
  bukvy: () => [],
});

/* ── P49. Высота к гипотенузе (191–194) ─────────────────────────── */

const P49 = prototip({
  id: 'P49',
  gruppa: '2D',
  title: 'Прямоугольный треугольник: высота к гипотенузе',
  dannye: dannye('P49'),
  polya: ['a', 'b'],
  text: (c) =>
    `В прямоугольном треугольнике катеты равны $${c.a}$ и $${c.b}$. Найдите высоту, опущенную на гипотенузу.`,
  solve(c, sd) {
    const c2 = c.a! * c.a! + c.b! * c.b!;
    const g = koren(q(c2));
    const h = del(q(c.a! * c.b!), g);
    return {
      otvet: zq(h),
      etapy: [
        {
          title: 'Гипотенуза',
          lines: [`$c^2 = ${c.a}^2 + ${c.b}^2 = ${c2}$, $\\;c = ${tq(g)}$.`],
        },
        {
          title: 'Площадь двумя способами',
          lines: [
            `Через катеты: $S = \\dfrac{${c.a} \\cdot ${c.b}}{2}$. Через гипотенузу и высоту к ней: $S = \\dfrac{${tq(g)} \\cdot h}{2}$.`,
            `$h = \\dfrac{${c.a} \\cdot ${c.b}}{${tq(g)}} = \\dfrac{${c.a! * c.b!}}{${tq(g)}} = ${tq(h)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна гипотенуза?',
          `$${tq(g)}$`,
          [`$${c.a! + c.b!}$`, `$${c2}$`],
          sd,
          'Теорема Пифагора.',
        ),
        vopros(
          'Как выразить высоту к гипотенузе?',
          '$h = \\dfrac{ab}{c}$',
          ['$h = \\dfrac{ac}{b}$', '$h = \\dfrac{ab}{2c}$'],
          sd + 1,
          'Площадь треугольника считаем двумя способами.',
        ),
      ],
    };
  },
  proverka(c) {
    /* Расстояние от вершины прямого угла до прямой AB. */
    const t = pryamTr(c.a!, c.b!);
    return prov((2 * ploshchadMn([t.A, t.B, t.C])) / rasst(t.A, t.B));
  },
  scena(c) {
    const g = koren(q(c.a! * c.a! + c.b! * c.b!));
    const h = zq(del(q(c.a! * c.b!), g));
    return {
      tochki: { ...pryamTr(c.a!, c.b!), H: { osnovanie: ['C', 'A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        storona('C', 'B', String(c.b)),
        ...vysota('C', 'A', 'B', 'H', null, { vydelit: 'iskomoe', znachenie: h, otvet: true }),
      ],
      podpisi: false,
      otvet: h,
    };
  },
  bukvy: () => [],
});

/* ── P50. Прямоугольный треугольник: площадь и катет → гипотенуза (195–198) */

const P50 = prototip({
  id: 'P50',
  gruppa: '2D',
  title: 'Прямоугольный треугольник: площадь и катет → гипотенуза',
  dannye: dannye('P50'),
  polya: ['s', 'a'],
  text: (c) =>
    `Площадь прямоугольного треугольника $${c.s}$. Один из катетов $${c.a}$. Найдите гипотенузу этого треугольника.`,
  solve(c, sd) {
    const b = q(2 * c.s!, c.a!);
    const c2 = plus(q(c.a! * c.a!), kv(b));
    const g = koren(c2);
    return {
      otvet: zq(g),
      etapy: [
        {
          title: 'Второй катет',
          lines: [
            `Площадь — половина произведения катетов: $${c.s} = \\dfrac{${c.a} \\cdot b}{2}$.`,
            `$b = \\dfrac{2 \\cdot ${c.s}}{${c.a}} = ${tq(b)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [`$c^2 = ${c.a}^2 + ${tq(b)}^2 = ${tq(c2)}$, $\\;c = ${tq(g)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен второй катет?',
          `$${tq(b)}$`,
          [`$${tq(q(c.s!, c.a!))}$`, `$${tq(q(c.s!, 2))}$`],
          sd,
          'Удвоенную площадь делим на известный катет.',
        ),
        vopros(
          'Как найти гипотенузу?',
          '$c^2 = a^2 + b^2$',
          ['$c = a + b$', '$c^2 = a^2 - b^2$'],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    const t = pryamTr(c.a!, (2 * c.s!) / c.a!);
    return prov(rasst(t.A, t.B));
  },
  scena(c) {
    const b = q(2 * c.s!, c.a!);
    const g = zq(koren(plus(q(c.a! * c.a!), kv(b))));
    return {
      tochki: pryamTr(c.a!, f(b)),
      elementy: [
        tri('A', 'B', 'C'),
        pryam('A', 'C', 'B'),
        storona('C', 'A', String(c.a)),
        iskomyy('A', 'B', g),
      ],
      podpisi: false,
      otvet: g,
    };
  },
  bukvy: () => [],
});

/* ── P51. Прямоугольник: сторона и диагональ → площадь (199–202) ── */

const P51 = prototip({
  id: 'P51',
  gruppa: '2A',
  title: 'Прямоугольник: сторона и диагональ → площадь',
  dannye: dannye('P51'),
  polya: ['a', 'd'],
  text: (c) =>
    `В прямоугольнике одна из сторон равна $${c.a}$, а диагональ равна $${c.d}$. Найдите площадь этого прямоугольника.`,
  solve(c, sd) {
    const b2 = c.d! * c.d! - c.a! * c.a!;
    const b = koren(q(b2));
    const S = umn(q(c.a!), b);
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Вторая сторона',
          lines: [
            'Диагональ делит прямоугольник на два прямоугольных треугольника: стороны — катеты, диагональ — гипотенуза.',
            `$b^2 = ${c.d}^2 - ${c.a}^2 = ${b2}$, $\\;b = ${tq(b)}$.`,
          ],
        },
        { title: 'Площадь', lines: [`$S = ${c.a} \\cdot ${tq(b)} = ${tq(S)}$.`] },
      ],
      hints: [
        vopros(
          'Чему равна вторая сторона?',
          `$${tq(b)}$`,
          [`$${c.d! - c.a!}$`, `$${c.d}$`],
          sd,
          'Катет при гипотенузе — диагонали.',
        ),
        vopros(
          'Как найти площадь прямоугольника?',
          '$S = a \\cdot b$',
          ['$S = \\dfrac{a \\cdot b}{2}$', '$S = a \\cdot d$'],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    const t = pryamoug(c.a!, Math.sqrt(c.d! * c.d! - c.a! * c.a!));
    return prov(ploshchadMn([t.A, t.B, t.C, t.D]));
  },
  scena(c) {
    const b = koren(q(c.d! * c.d! - c.a! * c.a!));
    return {
      tochki: pryamoug(c.a!, f(b)),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        storona('A', 'B', String(c.a)),
      ],
      podpisi: false,
      otvet: zq(umn(q(c.a!), b)),
    };
  },
  bukvy: () => [],
});

/* ── P52. Прямоугольник: площадь и сторона → диагональ (203–206) ── */

const P52 = prototip({
  id: 'P52',
  gruppa: '2E',
  title: 'Прямоугольник: площадь и сторона → диагональ',
  dannye: dannye('P52'),
  polya: ['s', 'a'],
  text: (c) =>
    `Площадь прямоугольника равна $${c.s}$, а одна из сторон равна $${c.a}$. Найдите длину диагонали этого прямоугольника.`,
  solve(c, sd) {
    const b = q(c.s!, c.a!);
    const d2 = plus(q(c.a! * c.a!), kv(b));
    const d = koren(d2);
    return {
      otvet: zq(d),
      etapy: [
        {
          title: 'Вторая сторона',
          lines: [`$S = a \\cdot b$, поэтому $b = ${c.s} : ${c.a} = ${tq(b)}$.`],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            'Диагональ — гипотенуза прямоугольного треугольника со сторонами-катетами.',
            `$d^2 = ${c.a}^2 + ${tq(b)}^2 = ${tq(d2)}$, $\\;d = ${tq(d)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна вторая сторона?',
          `$${tq(b)}$`,
          [`$${tq(q(2 * c.s!, c.a!))}$`, `$${tq(q(c.s!, 2))}$`],
          sd,
          'Площадь делим на известную сторону.',
        ),
        vopros(
          'Как найти диагональ?',
          '$d^2 = a^2 + b^2$',
          ['$d = a + b$', '$d^2 = a \\cdot b$'],
          sd + 1,
        ),
      ],
    };
  },
  proverka(c) {
    const t = pryamoug(c.a!, c.s! / c.a!);
    return prov(rasst(t.A, t.C));
  },
  scena(c) {
    const b = q(c.s!, c.a!);
    const d = zq(koren(plus(q(c.a! * c.a!), kv(b))));
    return {
      tochki: pryamoug(c.a!, f(b)),
      elementy: [mn(['A', 'B', 'C', 'D']), storona('A', 'B', String(c.a)), iskomyy('A', 'C', d)],
      podpisi: false,
      otvet: d,
    };
  },
  bukvy: () => [],
});

/* ── P53. Ромб: сторона и диагональ → площадь (207–210) ────────── */

const P53 = prototip({
  id: 'P53',
  gruppa: '2A',
  title: 'Ромб: сторона и диагональ → площадь',
  dannye: dannye('P53'),
  polya: ['a', 'd'],
  text: (c) => `Сторона ромба $${c.a}$, одна из диагоналей равна $${c.d}$. Найдите площадь ромба.`,
  solve(c, sd) {
    const x = q(c.d!, 2);
    const y2 = minus(kv(q(c.a!)), kv(x));
    const y = koren(y2);
    const d2 = umn(y, q(2));
    const S = umn(umn(q(c.d!), d2), q(1, 2));
    return {
      otvet: zq(S),
      etapy: [
        {
          title: 'Вторая диагональ',
          lines: [
            `Диагонали ромба перпендикулярны и делятся пополам. Половина данной диагонали — $${tq(x)}$, сторона — гипотенуза.`,
            `Половина второй: $\\sqrt{${c.a}^2 - ${tq(x)}^2} = \\sqrt{${tq(y2)}} = ${tq(y)}$, вся вторая диагональ $${tq(d2)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [
            `Площадь ромба — половина произведения диагоналей: $S = \\dfrac{${c.d} \\cdot ${tq(d2)}}{2} = ${tq(S)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна вторая диагональ?',
          `$${tq(d2)}$`,
          [`$${tq(y)}$`, `$${tq(umn(minus(q(c.a!), x), q(2)))}$`],
          sd,
          'Найдите половину по теореме Пифагора и удвойте.',
        ),
        vopros(
          'Как найти площадь ромба по диагоналям?',
          '$S = \\dfrac{d_1 d_2}{2}$',
          ['$S = d_1 d_2$', '$S = a \\cdot d_1$'],
          sd + 1,
        ),
      ],
    };
  },
  proverka: (c) => prov(2 * geron(c.a!, c.a!, c.d!)),
  scena(c) {
    const y = koren(minus(kv(q(c.a!)), kv(q(c.d!, 2))));
    const d2 = umn(y, q(2));
    return {
      tochki: rombD(c.d!, f(d2)),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        oblast(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        otr('B', 'D'),
        storona('A', 'B', String(c.a)),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
            ['C', 'D'],
            ['D', 'A'],
          ],
        },
      ],
      otvet: zq(umn(umn(q(c.d!), d2), q(1, 2))),
    };
  },
  bukvy: () => [],
});

/* ── P54. Ромб: диагональ и площадь → сторона (211–214) ────────── */

const P54 = prototip({
  id: 'P54',
  gruppa: '2E',
  title: 'Ромб: диагональ и площадь → сторона',
  dannye: dannye('P54'),
  polya: ['d', 's'],
  text: (c) =>
    `Одна из диагоналей ромба равна $${c.d}$, а его площадь равна $${c.s}$. Найдите сторону ромба.`,
  solve(c, sd) {
    const d2 = q(2 * c.s!, c.d!);
    const x = q(c.d!, 2);
    const y = umn(d2, q(1, 2));
    const a2 = plus(kv(x), kv(y));
    const a = koren(a2);
    return {
      otvet: zq(a),
      etapy: [
        {
          title: 'Вторая диагональ',
          lines: [
            `$S = \\dfrac{d_1 d_2}{2}$, поэтому $d_2 = \\dfrac{2 \\cdot ${c.s}}{${c.d}} = ${tq(d2)}$.`,
          ],
        },
        {
          title: 'Теорема Пифагора',
          lines: [
            `Диагонали перпендикулярны и делятся пополам: половины равны $${tq(x)}$ и $${tq(y)}$, сторона — гипотенуза.`,
            `$a^2 = ${tq(x)}^2 + ${tq(y)}^2 = ${tq(a2)}$, $\\;a = ${tq(a)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна вторая диагональ?',
          `$${tq(d2)}$`,
          [`$${tq(q(c.s!, c.d!))}$`, `$${tq(q(c.s!, 2))}$`],
          sd,
          'Удвоенную площадь делим на известную диагональ.',
        ),
        vopros(
          'Какие катеты у треугольника, где сторона ромба — гипотенуза?',
          `$${tq(x)}$ и $${tq(y)}$`,
          [`$${c.d}$ и $${tq(d2)}$`, `$${tq(x)}$ и $${tq(d2)}$`],
          sd + 1,
          'Катеты — половины диагоналей.',
        ),
      ],
    };
  },
  proverka(c) {
    const t = rombD(c.d!, (2 * c.s!) / c.d!);
    return prov(rasst(t.A, t.B));
  },
  scena(c) {
    const d2 = q(2 * c.s!, c.d!);
    const a = zq(koren(plus(kv(q(c.d!, 2)), kv(umn(d2, q(1, 2))))));
    return {
      tochki: rombD(c.d!, f(d2)),
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C', { vydelit: 'dano', znachenie: String(c.d) }),
        otr('B', 'D'),
        iskomyy('A', 'B', a),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
            ['C', 'D'],
            ['D', 'A'],
          ],
        },
      ],
      otvet: a,
    };
  },
  bukvy: () => [],
});

export const PIFAGOR_12_2: Prototip[] = [
  P42,
  P43,
  P44,
  P45,
  P46,
  P47,
  P48,
  P49,
  P50,
  P51,
  P52,
  P53,
  P54,
];
