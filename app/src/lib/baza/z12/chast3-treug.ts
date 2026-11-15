/**
 * База №12, часть 3: треугольники — синус, косинус, тангенс острого
 * угла и теорема Пифагора (задачи 243–340 задачника, прототипы
 * P61–P72).
 *
 * Прямоугольный треугольник рисуется как в задачнике: A слева внизу,
 * прямой угол C справа внизу, B над C. Равнобедренный — основание AC
 * внизу, вершина B сверху.
 */

import { gr, otr, prod, pryam, scena as sc, shtrih, tri, ug } from '@/lib/planimetriya/stseny/dsl';
import type { Element, T2 } from '@/lib/planimetriya/types';
import { tex } from '../chisla';
import {
  POROG_UGLA,
  type PrototipChasti3,
  type Q,
  RAD,
  drob,
  drobUsloviya,
  izFloat,
  kor,
  korChertezh,
  korKv,
  korenTex,
  num,
  ploshchadTr,
  q,
  qDiv,
  qKoren,
  qKv,
  qMul,
  qSub,
  qAdd,
  qTex,
  qZapis,
  rasst,
  sobrat,
  ugolMezhdu,
  v$,
  vopros,
  zazhat,
} from './chast3-obshchee';

const PRYAMOY = 'В треугольнике $ABC$ угол $C$ равен $90^\\circ$';

/* ── Чертежи ─────────────────────────────────────────────────── */

/** Данная сторона: подпись числа на уже нарисованной стороне. */
const st = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie: zn,
});
/** Искомая сторона — выделена. */
const isk = (a: string, b: string): Element => otr(a, b, { vydelit: 'iskomoe' });

/** Прямоугольный треугольник: A слева, C — прямой угол справа внизу, B над C. */
function pryamoyC(ugolA: number): { t: Record<string, T2>; sk: boolean } {
  const a = zazhat(ugolA, POROG_UGLA, 90 - POROG_UGLA);
  return {
    t: { A: [-10 * Math.cos(a * RAD), 0], C: [0, 0], B: [0, 10 * Math.sin(a * RAD)] },
    sk: Math.abs(a - ugolA) > 1e-9,
  };
}

/** Равнобедренный AB = BC: основание AC внизу, угол при основании ugolA. */
function ravnobedrennyyB(ugolA: number): { t: Record<string, T2>; sk: boolean } {
  const a = zazhat(ugolA, 18, 80);
  return {
    t: { A: [-5, 0], C: [5, 0], B: [0, 5 * Math.tan(a * RAD)], M: [0, 0] },
    sk: Math.abs(a - ugolA) > 1e-9,
  };
}

const ravnyeBoka: Element[] = [shtrih('A', 'B', 1), shtrih('B', 'C', 1)];

const deg = (x: number): number => x / RAD;

/* ── P61. sin A или cos B по гипотенузе и катету AC ──────────── */

const P61 = sobrat({
  id: 'P61',
  gruppa: '3A',
  title: '$\\sin A$ или $\\cos B$ по $AB$ и $AC$',
  polya: ['q', 'ab', 'k', 'm'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    const f = num(p, 'q') === 1 ? '\\cos B' : '\\sin A';
    return `${PRYAMOY}, $AB=${num(p, 'ab')}$, $AC=${kor(num(p, 'k'), num(p, 'm'))}$. Найдите $${f}$.`;
  },
  solve(p) {
    const ab = num(p, 'ab');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const kos = num(p, 'q') === 1;
    const f = kos ? '\\cos B' : '\\sin A';
    const bc2 = ab * ab - k * k * m;
    const bc = qKoren(q(bc2));
    const otvet = qZapis(qDiv(bc, q(ab)));
    return {
      otvet,
      etapy: [
        {
          title: 'Нужное отношение',
          lines: [
            kos
              ? 'Косинус острого угла — прилежащий катет, делённый на гипотенузу. К углу $B$ прилежит катет $BC$:'
              : 'Синус острого угла — противолежащий катет, делённый на гипотенузу. Против угла $A$ лежит катет $BC$:',
            `$${f}=\\dfrac{BC}{AB}$.`,
          ],
        },
        {
          title: 'Катет BC по теореме Пифагора',
          lines: [
            `$BC^2=AB^2-AC^2=${ab}^2-${korKv(k, m)}=${ab * ab}-${k * k * m}=${bc2}$.`,
            `$BC=\\sqrt{${bc2}}=${qTex(bc)}$.`,
          ],
        },
        {
          title: 'Ответ',
          lines: [`$${f}=\\dfrac{${qTex(bc)}}{${ab}}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          `Чему равен $${f}$ в этом треугольнике?`,
          '$\\dfrac{BC}{AB}$',
          ['$\\dfrac{AC}{AB}$', '$\\dfrac{BC}{AC}$'],
          ab,
          kos
            ? 'Прилежащий к $B$ катет — $BC$, гипотенуза — $AB$.'
            : 'Противолежащий $A$ катет — $BC$.',
        ),
        vopros(
          'Чему равен катет $BC$?',
          v$(qTex(bc)),
          [v$(bc2), v$(korenTex(q(ab * ab + k * k * m)))],
          k + m,
          '$BC^2=AB^2-AC^2$.',
        ),
      ],
    };
  },
  proverka(p) {
    const ab = num(p, 'ab');
    const ac = num(p, 'k') * Math.sqrt(num(p, 'm'));
    const A: T2 = [-ac, 0];
    const C: T2 = [0, 0];
    const B: T2 = [0, Math.sqrt(ab * ab - ac * ac)];
    return izFloat(
      num(p, 'q') === 1 ? Math.cos(ugolMezhdu(A, B, C) * RAD) : Math.sin(ugolMezhdu(C, A, B) * RAD),
    );
  },
  scena(p) {
    const ab = num(p, 'ab');
    const ac = num(p, 'k') * Math.sqrt(num(p, 'm'));
    const { t, sk } = pryamoyC(deg(Math.acos(ac / ab)));
    return sc(
      {
        tochki: t,
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          st('A', 'B', String(ab)),
          st('A', 'C', korChertezh(num(p, 'k'), num(p, 'm'))),
          num(p, 'q') === 1
            ? ug('A', 'B', 'C', { vydelit: 'iskomoe' })
            : ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
        ],
      },
      sk,
    );
  },
});

/* ── P62. tg A по AB = √n и BC ───────────────────────────────── */

const P62 = sobrat({
  id: 'P62',
  gruppa: '3A',
  title: '$\\mathrm{tg}\\,A$ по $AB=\\sqrt{n}$ и $BC$',
  polya: ['n', 'bc'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    return `${PRYAMOY}, $AB=\\sqrt{${num(p, 'n')}}$, $BC=${num(p, 'bc')}$. Найдите $\\mathrm{tg}\\,A$.`;
  },
  solve(p) {
    const n = num(p, 'n');
    const bc = num(p, 'bc');
    const ac2 = n - bc * bc;
    const ac = qKoren(q(ac2));
    const otvet = qZapis(qDiv(q(bc), ac));
    return {
      otvet,
      etapy: [
        {
          title: 'Нужное отношение',
          lines: [
            'Тангенс острого угла — противолежащий катет, делённый на прилежащий:',
            '$\\mathrm{tg}\\,A=\\dfrac{BC}{AC}$.',
          ],
        },
        {
          title: 'Катет AC по теореме Пифагора',
          lines: [
            `$AC^2=AB^2-BC^2=(\\sqrt{${n}})^2-${bc}^2=${n}-${bc * bc}=${ac2}$.`,
            `$AC=\\sqrt{${ac2}}=${qTex(ac)}$.`,
          ],
        },
        {
          title: 'Ответ',
          lines: [`$\\mathrm{tg}\\,A=\\dfrac{${bc}}{${qTex(ac)}}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен $\\mathrm{tg}\\,A$?',
          '$\\dfrac{BC}{AC}$',
          ['$\\dfrac{AC}{BC}$', '$\\dfrac{BC}{AB}$'],
          n,
          'Противолежащий катет делим на прилежащий.',
        ),
        vopros(
          'Чему равен катет $AC$?',
          v$(qTex(ac)),
          [v$(ac2), v$(korenTex(q(n + bc * bc)))],
          bc,
          '$(\\sqrt{n})^2=n$, поэтому $AC^2=AB^2-BC^2$.',
        ),
      ],
    };
  },
  proverka(p) {
    const bc = num(p, 'bc');
    const ac = Math.sqrt(num(p, 'n') - bc * bc);
    return izFloat(Math.tan(ugolMezhdu([0, 0], [-ac, 0], [0, bc]) * RAD));
  },
  scena(p) {
    const bc = num(p, 'bc');
    const n = num(p, 'n');
    const { t, sk } = pryamoyC(deg(Math.asin(bc / Math.sqrt(n))));
    return sc(
      {
        tochki: t,
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          st('A', 'B', `√${n}`),
          st('C', 'B', String(bc)),
          ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
        ],
      },
      sk,
    );
  },
});

/* ── P63. Гипотенуза и синус/косинус A → катет ───────────────── */

const P63 = sobrat({
  id: 'P63',
  gruppa: '3A',
  title: '$AB$ и $\\sin A$ или $\\cos A$ → катет',
  polya: ['f', 'ab', 'p', 'q', 'dec'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    const kos = num(p, 'f') === 1;
    const d = drobUsloviya(num(p, 'p'), num(p, 'q'), num(p, 'dec'));
    return `${PRYAMOY}, $AB=${num(p, 'ab')}$, $\\${kos ? 'cos' : 'sin'} A=${d}$. Найдите длину стороны $${kos ? 'BC' : 'AC'}$.`;
  },
  solve(p) {
    const kos = num(p, 'f') === 1;
    const ab = num(p, 'ab');
    const t = q(num(p, 'p'), num(p, 'q'));
    const d = drobUsloviya(num(p, 'p'), num(p, 'q'), num(p, 'dec'));
    /* Сначала катет из определения, потом второй — по Пифагору. */
    const pervyy = qMul(q(ab), t);
    const vtoroy2 = qSub(q(ab * ab), qKv(pervyy));
    const vtoroy = qKoren(vtoroy2);
    const otvet = qZapis(vtoroy);
    const [x, y] = kos ? ['AC', 'BC'] : ['BC', 'AC'];
    return {
      otvet,
      etapy: [
        {
          title: kos ? 'Прилежащий катет AC' : 'Противолежащий катет BC',
          lines: [
            kos
              ? `$\\cos A=\\dfrac{AC}{AB}$, поэтому $AC=AB\\cdot\\cos A=${ab}\\cdot ${d}=${qTex(pervyy)}$.`
              : `$\\sin A=\\dfrac{BC}{AB}$, поэтому $BC=AB\\cdot\\sin A=${ab}\\cdot ${d}=${qTex(pervyy)}$.`,
          ],
        },
        {
          title: `Катет ${y} по теореме Пифагора`,
          lines: [
            `$${y}^2=AB^2-${x}^2=${ab}^2-${qTex(pervyy)}^2=${qTex(vtoroy2)}$.`,
            `$${y}=\\sqrt{${qTex(vtoroy2)}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          `Чему равен катет $${x}$?`,
          v$(qTex(pervyy)),
          [v$(qTex(qDiv(q(ab), t))), v$(ab)],
          ab,
          kos ? '$AC=AB\\cdot\\cos A$.' : '$BC=AB\\cdot\\sin A$.',
        ),
        vopros(
          `Как найти $${y}$?`,
          `$\\sqrt{AB^2-${x}^2}$`,
          [`$AB-${x}$`, `$\\sqrt{AB^2+${x}^2}$`],
          num(p, 'q'),
          'Катет прямоугольного треугольника — по теореме Пифагора.',
        ),
      ],
    };
  },
  proverka(p) {
    const ab = num(p, 'ab');
    const a =
      num(p, 'f') === 1
        ? Math.acos(num(p, 'p') / num(p, 'q'))
        : Math.asin(num(p, 'p') / num(p, 'q'));
    const A: T2 = [-ab * Math.cos(a), 0];
    const C: T2 = [0, 0];
    const B: T2 = [0, ab * Math.sin(a)];
    return izFloat(num(p, 'f') === 1 ? rasst(B, C) : rasst(A, C));
  },
  scena(p) {
    const kos = num(p, 'f') === 1;
    const t0 = num(p, 'p') / num(p, 'q');
    const { t, sk } = pryamoyC(deg(kos ? Math.acos(t0) : Math.asin(t0)));
    return sc(
      {
        tochki: t,
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          st('A', 'B', String(num(p, 'ab'))),
          ug('C', 'A', 'B', { vydelit: 'dano' }),
          kos ? isk('B', 'C') : isk('A', 'C'),
        ],
      },
      sk,
    );
  },
});

/* ── P64. BC и tg A → AB ─────────────────────────────────────── */

const P64 = sobrat({
  id: 'P64',
  gruppa: '3A',
  title: '$BC$ и $\\mathrm{tg}\\,A$ → гипотенуза',
  polya: ['bc', 'p', 'q', 'dec'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    const d = drobUsloviya(num(p, 'p'), num(p, 'q'), num(p, 'dec'));
    return `${PRYAMOY}, сторона $BC$ равна $${num(p, 'bc')}$. Тангенс угла $A$ равен $${d}$. Найдите длину стороны $AB$.`;
  },
  solve(p) {
    const bc = num(p, 'bc');
    const tg = q(num(p, 'p'), num(p, 'q'));
    const d = drobUsloviya(num(p, 'p'), num(p, 'q'), num(p, 'dec'));
    const ac = qDiv(q(bc), tg);
    const ab2 = qAdd(q(bc * bc), qKv(ac));
    const ab = qKoren(ab2);
    const otvet = qZapis(ab);
    return {
      otvet,
      etapy: [
        {
          title: 'Катет AC',
          lines: [
            '$\\mathrm{tg}\\,A=\\dfrac{BC}{AC}$, поэтому',
            `$AC=\\dfrac{BC}{\\mathrm{tg}\\,A}=${bc}:${d}=${qTex(ac)}$.`,
          ],
        },
        {
          title: 'Гипотенуза по теореме Пифагора',
          lines: [
            `$AB^2=AC^2+BC^2=${qTex(ac)}^2+${bc}^2=${qTex(ab2)}$.`,
            `$AB=\\sqrt{${qTex(ab2)}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен катет $AC$?',
          v$(qTex(ac)),
          [v$(qTex(qMul(q(bc), tg))), v$(bc)],
          bc,
          '$AC=BC:\\mathrm{tg}\\,A$.',
        ),
        vopros(
          'Как найти гипотенузу $AB$?',
          '$\\sqrt{AC^2+BC^2}$',
          ['$AC+BC$', '$\\sqrt{AC^2-BC^2}$'],
          num(p, 'p'),
        ),
      ],
    };
  },
  proverka(p) {
    const bc = num(p, 'bc');
    const a = Math.atan(num(p, 'p') / num(p, 'q'));
    /* Гипотенуза из прямоугольного треугольника: BC = AB·sin A. */
    return izFloat(rasst([0, 0], [-bc / Math.tan(a), bc]));
  },
  scena(p) {
    const { t, sk } = pryamoyC(deg(Math.atan(num(p, 'p') / num(p, 'q'))));
    return sc(
      {
        tochki: t,
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          st('C', 'B', String(num(p, 'bc'))),
          ug('C', 'A', 'B', { vydelit: 'dano' }),
          isk('A', 'B'),
        ],
      },
      sk,
    );
  },
});

/* ── P65. Высота CH к гипотенузе: BH или CH ──────────────────── */

const P65 = sobrat({
  id: 'P65',
  gruppa: '3A',
  title: 'Высота $CH$: $BC$ и $\\sin A$ или $\\cos A$',
  polya: ['v', 'bc', 'p', 'q'],
  alt: 'Прямоугольный треугольник ABC с высотой CH к гипотенузе',
  text(p) {
    const d = drobUsloviya(num(p, 'p'), num(p, 'q'), 1);
    return num(p, 'v') === 0
      ? `${PRYAMOY}, $CH$ — высота, $BC=${num(p, 'bc')}$, $\\sin A=${d}$. Найдите длину отрезка $BH$.`
      : `${PRYAMOY}, $BC=${num(p, 'bc')}$, $\\cos A=${d}$. Найдите высоту $CH$.`;
  },
  solve(p) {
    const sin = num(p, 'v') === 0;
    const bc = num(p, 'bc');
    const t = q(num(p, 'p'), num(p, 'q'));
    const d = qTex(t);
    const otvet = qZapis(qMul(q(bc), t));
    return {
      otvet,
      etapy: [
        {
          title: 'Угол BCH равен углу A',
          lines: [
            'В треугольниках $ABC$ и $CBH$ угол $B$ общий, а углы $C$ и $H$ прямые. Значит,',
            '$\\angle BCH=90^\\circ-\\angle B=\\angle A$.',
          ],
        },
        {
          title: 'Прямоугольный треугольник BCH',
          lines: sin
            ? [
                'В треугольнике $BCH$ гипотенуза $BC$, а катет $BH$ лежит против угла $BCH$:',
                `$BH=BC\\cdot\\sin\\angle BCH=BC\\cdot\\sin A=${bc}\\cdot ${d}=${tex(otvet)}$.`,
              ]
            : [
                'В треугольнике $BCH$ гипотенуза $BC$, а катет $CH$ прилежит к углу $BCH$:',
                `$CH=BC\\cdot\\cos\\angle BCH=BC\\cdot\\cos A=${bc}\\cdot ${d}=${tex(otvet)}$.`,
              ],
        },
      ],
      hints: [
        vopros(
          'Какой угол треугольника $BCH$ равен углу $A$?',
          '$\\angle BCH$',
          ['$\\angle CBH$', '$\\angle CHB$'],
          bc,
          'Оба угла дополняют угол $B$ до $90^\\circ$.',
        ),
        vopros(
          sin ? 'Чему равен $BH$?' : 'Чему равна высота $CH$?',
          sin ? '$BC\\cdot\\sin A$' : '$BC\\cdot\\cos A$',
          sin
            ? ['$BC\\cdot\\cos A$', '$\\dfrac{BC}{\\sin A}$']
            : ['$BC\\cdot\\sin A$', '$\\dfrac{BC}{\\cos A}$'],
          num(p, 'p'),
        ),
      ],
    };
  },
  proverka(p) {
    const bc = num(p, 'bc');
    const t = num(p, 'p') / num(p, 'q');
    const a = num(p, 'v') === 0 ? Math.asin(t) : Math.acos(t);
    /* A в начале, AB по оси x: AB = BC / sin A, C — на луче под углом A. */
    const ab = bc / Math.sin(a);
    const ac = ab * Math.cos(a);
    const C: T2 = [ac * Math.cos(a), ac * Math.sin(a)];
    const H: T2 = [C[0], 0];
    return izFloat(num(p, 'v') === 0 ? rasst(H, [ab, 0]) : rasst(C, H));
  },
  scena(p) {
    const t0 = num(p, 'p') / num(p, 'q');
    const a0 = deg(num(p, 'v') === 0 ? Math.asin(t0) : Math.acos(t0));
    const a = zazhat(a0, 22, 68);
    const C: T2 = [10 * Math.cos(a * RAD) ** 2, 10 * Math.cos(a * RAD) * Math.sin(a * RAD)];
    const sin = num(p, 'v') === 0;
    return sc(
      {
        tochki: { A: [0, 0], B: [10, 0], C, H: { osnovanie: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'H', sin ? {} : { vydelit: 'iskomoe' }),
          pryam('C', 'H', 'B'),
          st('B', 'C', String(num(p, 'bc'))),
          ug('C', 'A', 'B', { vydelit: 'dano' }),
          ...(sin ? [isk('B', 'H')] : []),
        ],
      },
      Math.abs(a - a0) > 1e-9,
    );
  },
});

/* ── P66. BC и площадь → tg B ────────────────────────────────── */

const P66 = sobrat({
  id: 'P66',
  gruppa: '3A',
  title: '$BC$ и площадь → $\\mathrm{tg}\\,B$',
  polya: ['bc', 's'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    return `${PRYAMOY}, $BC=${num(p, 'bc')}$. Площадь треугольника равна $${num(p, 's')}$. Найдите $\\mathrm{tg}\\,B$.`;
  },
  solve(p) {
    const bc = num(p, 'bc');
    const s = num(p, 's');
    const ac = q(2 * s, bc);
    const otvet = qZapis(qDiv(ac, q(bc)));
    return {
      otvet,
      etapy: [
        {
          title: 'Катет AC из площади',
          lines: [
            'Площадь прямоугольного треугольника — половина произведения катетов:',
            `$S=\\dfrac{AC\\cdot BC}{2}$, $AC=\\dfrac{2S}{BC}=\\dfrac{2\\cdot ${s}}{${bc}}=${qTex(ac)}$.`,
          ],
        },
        {
          title: 'Тангенс угла B',
          lines: [
            'Против угла $B$ лежит катет $AC$, прилежит — катет $BC$:',
            `$\\mathrm{tg}\\,B=\\dfrac{AC}{BC}=\\dfrac{${qTex(ac)}}{${bc}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен катет $AC$?',
          v$(qTex(ac)),
          [v$(qTex(q(s, bc))), v$(qTex(q(2 * s - bc)))],
          s,
          '$S=\\dfrac{AC\\cdot BC}{2}$.',
        ),
        vopros(
          'Чему равен $\\mathrm{tg}\\,B$?',
          '$\\dfrac{AC}{BC}$',
          ['$\\dfrac{BC}{AC}$', '$\\dfrac{AC}{AB}$'],
          bc,
        ),
      ],
    };
  },
  proverka(p) {
    const bc = num(p, 'bc');
    const s = num(p, 's');
    /* Перебор: AC — та длина, при которой площадь треугольника равна S. */
    const C: T2 = [0, 0];
    const B: T2 = [0, bc];
    const A: T2 = [-(2 * s) / bc, 0];
    if (Math.abs(ploshchadTr(A, B, C) - s) > 1e-9) return '?';
    return izFloat(Math.tan(ugolMezhdu(A, B, C) * RAD));
  },
  scena(p) {
    const bc = num(p, 'bc');
    const ac = (2 * num(p, 's')) / bc;
    const { t, sk } = pryamoyC(deg(Math.atan(bc / ac)));
    return sc(
      {
        tochki: t,
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          st('C', 'B', String(bc)),
          ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
        ],
      },
      sk,
    );
  },
});

/* ── P67. Площадь прямоугольного треугольника ────────────────── */

const P67 = sobrat({
  id: 'P67',
  gruppa: '3A',
  title: 'Площадь прямоугольного треугольника по стороне и углу',
  polya: ['v', 'k', 'm', 'p', 'q'],
  alt: 'Прямоугольный треугольник ABC с прямым углом C',
  text(p) {
    const v = num(p, 'v');
    const k = num(p, 'k');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    if (v === 0) {
      return `${PRYAMOY}, $AB=${kor(k, num(p, 'm'))}$, $\\sin A=\\dfrac{${pp}}{\\sqrt{${qq}}}$. Найдите площадь треугольника.`;
    }
    if (v === 1) {
      return `${PRYAMOY}, $\\cos A=${drob(pp, qq)}$, $AB=${k}$. Найдите площадь треугольника $ABC$.`;
    }
    if (v === 2) {
      return `${PRYAMOY}, $\\cos B=${drobUsloviya(pp, qq, 1)}$, $AB=${k}$. Найдите площадь треугольника $ABC$.`;
    }
    return `${PRYAMOY}, $\\mathrm{tg}\\,B=${drob(pp, qq)}$, $BC=${k}$. Найдите площадь треугольника.`;
  },
  solve(p) {
    const v = num(p, 'v');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    let bc2: Q;
    let ac2: Q;
    const shagi: { title: string; lines: string[] }[] = [];
    if (v === 0) {
      const ab2 = q(k * k * m);
      bc2 = qMul(ab2, q(pp * pp, qq));
      ac2 = qSub(ab2, bc2);
      shagi.push(
        {
          title: 'Катет BC',
          lines: [
            `$BC=AB\\cdot\\sin A=${kor(k, m)}\\cdot\\dfrac{${pp}}{\\sqrt{${qq}}}=${korenTex(bc2)}$.`,
          ],
        },
        {
          title: 'Катет AC по теореме Пифагора',
          lines: [
            `$AC^2=AB^2-BC^2=${qTex(ab2)}-${qTex(bc2)}=${qTex(ac2)}$, $AC=${korenTex(ac2)}$.`,
          ],
        },
      );
    } else if (v === 3) {
      bc2 = q(k * k);
      const ac = qMul(q(k), q(pp, qq));
      ac2 = qKv(ac);
      shagi.push({
        title: 'Катет AC',
        lines: [
          '$\\mathrm{tg}\\,B=\\dfrac{AC}{BC}$, поэтому',
          `$AC=BC\\cdot\\mathrm{tg}\\,B=${k}\\cdot ${drob(pp, qq)}=${qTex(ac)}$.`,
        ],
      });
    } else {
      /* v = 1: cos A → AC; v = 2: cos B → BC. */
      const [x, y, ugol] = v === 1 ? ['AC', 'BC', 'A'] : ['BC', 'AC', 'B'];
      const pervyy = qMul(q(k), q(pp, qq));
      const vtoroy2 = qSub(q(k * k), qKv(pervyy));
      if (v === 1) {
        ac2 = qKv(pervyy);
        bc2 = vtoroy2;
      } else {
        bc2 = qKv(pervyy);
        ac2 = vtoroy2;
      }
      const d = v === 1 ? drob(pp, qq) : drobUsloviya(pp, qq, 1);
      shagi.push(
        {
          title: `Катет ${x}`,
          lines: [`$${x}=AB\\cdot\\cos ${ugol}=${k}\\cdot ${d}=${qTex(pervyy)}$.`],
        },
        {
          title: `Катет ${y} по теореме Пифагора`,
          lines: [
            `$${y}^2=AB^2-${x}^2=${k}^2-${qTex(pervyy)}^2=${qTex(vtoroy2)}$, $${y}=${korenTex(vtoroy2)}$.`,
          ],
        },
      );
    }
    const s = qDiv(qKoren(qMul(ac2, bc2)), q(2));
    const otvet = qZapis(s);
    shagi.push({
      title: 'Площадь',
      lines: [
        'Площадь прямоугольного треугольника — половина произведения катетов:',
        `$S=\\dfrac{AC\\cdot BC}{2}=\\dfrac{${korenTex(ac2)}\\cdot ${korenTex(bc2)}}{2}=${tex(otvet)}$.`,
      ],
    });
    return {
      otvet,
      etapy: shagi,
      hints: [
        vopros(
          'Как найти площадь прямоугольного треугольника $ABC$?',
          '$\\dfrac{AC\\cdot BC}{2}$',
          ['$AC\\cdot BC$', '$\\dfrac{AB\\cdot BC}{2}$'],
          k + v,
          'Катеты перпендикулярны: один — основание, другой — высота.',
        ),
        vopros(
          'Чему равно произведение катетов $AC\\cdot BC$?',
          v$(qTex(qKoren(qMul(ac2, bc2)))),
          [v$(qTex(s)), v$(qTex(qAdd(ac2, bc2)))],
          pp,
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const k = num(p, 'k');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    let A: T2;
    let B: T2;
    const C: T2 = [0, 0];
    if (v === 0) {
      const ab = k * Math.sqrt(num(p, 'm'));
      const a = Math.asin(pp / Math.sqrt(qq));
      A = [-ab * Math.cos(a), 0];
      B = [0, ab * Math.sin(a)];
    } else if (v === 1) {
      const a = Math.acos(pp / qq);
      A = [-k * Math.cos(a), 0];
      B = [0, k * Math.sin(a)];
    } else if (v === 2) {
      const b = Math.acos(pp / qq);
      A = [-k * Math.sin(b), 0];
      B = [0, k * Math.cos(b)];
    } else {
      const b = Math.atan(pp / qq);
      A = [-k * Math.tan(b), 0];
      B = [0, k];
    }
    return izFloat(ploshchadTr(A, B, C));
  },
  scena(p) {
    const v = num(p, 'v');
    const k = num(p, 'k');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    let a: number;
    if (v === 0) a = Math.asin(pp / Math.sqrt(qq));
    else if (v === 1) a = Math.acos(pp / qq);
    else if (v === 2) a = Math.PI / 2 - Math.acos(pp / qq);
    else a = Math.PI / 2 - Math.atan(pp / qq);
    const { t, sk } = pryamoyC(deg(a));
    const el: Element[] = [tri('A', 'B', 'C'), pryam('A', 'C', 'B')];
    if (v === 0)
      el.push(st('A', 'B', korChertezh(k, num(p, 'm'))), ug('C', 'A', 'B', { vydelit: 'dano' }));
    if (v === 1) el.push(st('A', 'B', String(k)), ug('C', 'A', 'B', { vydelit: 'dano' }));
    if (v === 2) el.push(st('A', 'B', String(k)), ug('A', 'B', 'C', { vydelit: 'dano' }));
    if (v === 3) el.push(st('C', 'B', String(k)), ug('A', 'B', 'C', { vydelit: 'dano' }));
    return sc({ tochki: t, elementy: el }, sk);
  },
});

/* ── P68. Равнобедренный: синус или косинус угла при основании ─ */

const P68 = sobrat({
  id: 'P68',
  gruppa: '3B',
  title: 'Равнобедренный: $\\sin$ или $\\cos$ угла при основании',
  polya: ['v', 'b', 'k', 'm'],
  alt: 'Равнобедренный треугольник ABC с основанием AC',
  text(p) {
    const b = num(p, 'b');
    const x = kor(num(p, 'k'), num(p, 'm'));
    return num(p, 'v') === 0
      ? `В треугольнике $ABC$ известно, что $AB=BC=${b}$, $AC=${x}$. Найдите синус угла $BAC$.`
      : `В равнобедренном треугольнике $ABC$ боковые стороны $AB=BC=${b}$, медиана $BM=${x}$. Найдите $\\cos\\angle BAC$.`;
  },
  solve(p) {
    const b = num(p, 'b');
    const k = num(p, 'k');
    const m = num(p, 'm');
    if (num(p, 'v') === 0) {
      const am2 = q(k * k * m, 4);
      const bm2 = qSub(q(b * b), am2);
      const bm = qKoren(bm2);
      const otvet = qZapis(qDiv(bm, q(b)));
      return {
        otvet,
        etapy: [
          {
            title: 'Высота к основанию',
            lines: [
              'Проведём медиану $BM$ к основанию $AC$. В равнобедренном треугольнике она же высота: $BM\\perp AC$.',
              `$AM=\\dfrac{AC}{2}=\\dfrac{${kor(k, m)}}{2}$, $AM^2=\\dfrac{${k * k * m}}{4}=${qTex(am2)}$.`,
            ],
          },
          {
            title: 'Высота BM по теореме Пифагора',
            lines: [`$BM^2=AB^2-AM^2=${b * b}-${qTex(am2)}=${qTex(bm2)}$, $BM=${qTex(bm)}$.`],
          },
          {
            title: 'Синус угла A',
            lines: [
              'В прямоугольном треугольнике $ABM$:',
              `$\\sin\\angle BAC=\\dfrac{BM}{AB}=\\dfrac{${qTex(bm)}}{${b}}=${tex(otvet)}$.`,
            ],
          },
        ],
        hints: [
          vopros(
            'Какой отрезок поможет найти синус угла $A$?',
            'высота $BM$ к основанию',
            ['биссектриса угла $A$', 'средняя линия'],
            b,
            'Высота даёт прямоугольный треугольник $ABM$.',
          ),
          vopros(
            'Чему равна высота $BM$?',
            v$(qTex(bm)),
            [v$(qTex(bm2)), v$(korenTex(qSub(q(b * b), q(k * k * m))))],
            k,
            'Сначала $AM=\\dfrac{AC}{2}$.',
          ),
        ],
      };
    }
    const am2 = q(b * b - k * k * m);
    const am = qKoren(am2);
    const otvet = qZapis(qDiv(am, q(b)));
    return {
      otvet,
      etapy: [
        {
          title: 'Медиана — высота',
          lines: [
            'В равнобедренном треугольнике медиана к основанию является высотой: треугольник $ABM$ прямоугольный, $\\angle AMB=90^\\circ$.',
          ],
        },
        {
          title: 'Катет AM по теореме Пифагора',
          lines: [`$AM^2=AB^2-BM^2=${b}^2-${korKv(k, m)}=${qTex(am2)}$, $AM=${qTex(am)}$.`],
        },
        {
          title: 'Косинус угла A',
          lines: [`$\\cos\\angle BAC=\\dfrac{AM}{AB}=\\dfrac{${qTex(am)}}{${b}}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Какой угол образует медиана $BM$ с основанием?',
          '$90^\\circ$',
          ['$45^\\circ$', '$60^\\circ$'],
          b,
          'В равнобедренном треугольнике медиана к основанию — высота.',
        ),
        vopros(
          'Чему равен $\\cos\\angle BAC$?',
          '$\\dfrac{AM}{AB}$',
          ['$\\dfrac{BM}{AB}$', '$\\dfrac{AM}{BM}$'],
          k + m,
        ),
      ],
    };
  },
  proverka(p) {
    const b = num(p, 'b');
    const x = num(p, 'k') * Math.sqrt(num(p, 'm'));
    if (num(p, 'v') === 0) {
      const B: T2 = [0, Math.sqrt(b * b - (x * x) / 4)];
      return izFloat(Math.sin(ugolMezhdu([x / 2, 0], [-x / 2, 0], B) * RAD));
    }
    const am = Math.sqrt(b * b - x * x);
    return izFloat(Math.cos(ugolMezhdu([am, 0], [-am, 0], [0, x]) * RAD));
  },
  scena(p) {
    const b = num(p, 'b');
    const x = num(p, 'k') * Math.sqrt(num(p, 'm'));
    const v0 = num(p, 'v') === 0;
    const a = v0 ? Math.acos(x / 2 / b) : Math.acos(Math.sqrt(b * b - x * x) / b);
    const { t, sk } = ravnobedrennyyB(deg(a));
    const zn = korChertezh(num(p, 'k'), num(p, 'm'));
    const el: Element[] = [tri('A', 'B', 'C'), ...ravnyeBoka, st('A', 'B', String(b))];
    if (v0) el.push(st('A', 'C', zn));
    else
      el.push(
        otr('B', 'M', { vydelit: 'dano', znachenie: zn }),
        shtrih('A', 'M', 2),
        shtrih('M', 'C', 2),
      );
    el.push(ug('C', 'A', 'B', { vydelit: 'iskomoe' }));
    return sc({ tochki: t, elementy: el, ...(v0 ? { bezPodpisi: ['M'] } : {}) }, sk);
  },
});

/* ── P69. Равнобедренный: боковая сторона по тангенсу ────────── */

const P69 = sobrat({
  id: 'P69',
  gruppa: '3B',
  title: 'Равнобедренный: боковая сторона по $\\mathrm{tg}\\,A$',
  polya: ['v', 'x', 'r', 'p', 'q'],
  alt: 'Равнобедренный треугольник ABC с основанием AC',
  text(p) {
    const x = num(p, 'x');
    const r = num(p, 'r');
    const tg = r === 1 ? drob(num(p, 'p'), num(p, 'q')) : `\\dfrac{\\sqrt{${r}}}{${num(p, 'q')}}`;
    return num(p, 'v') === 0
      ? `В равнобедренном треугольнике $ABC$ медиана $BM$, проведённая к основанию, равна $${x}$, а $\\mathrm{tg}\\,A=${tg}$. Найдите длину боковой стороны треугольника $ABC$.`
      : `В треугольнике $ABC$ известно, что $AB=BC$, $AC=${x}$, $\\mathrm{tg}\\angle BAC=${tg}$. Найдите длину стороны $AB$.`;
  },
  solve(p) {
    const x = num(p, 'x');
    const r = num(p, 'r');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const tgTex = r === 1 ? drob(pp, qq) : `\\dfrac{\\sqrt{${r}}}{${qq}}`;
    const tg2 = q(pp * pp * r, qq * qq);
    let am2: Q;
    let bm2: Q;
    const shagi: { title: string; lines: string[] }[] = [
      {
        title: 'Медиана — высота',
        lines: [
          'Медиана $BM$ к основанию равнобедренного треугольника — высота, поэтому треугольник $ABM$ прямоугольный и $\\mathrm{tg}\\,A=\\dfrac{BM}{AM}$.',
        ],
      },
    ];
    if (num(p, 'v') === 0) {
      bm2 = q(x * x);
      const am = qDiv(q(x), q(pp, qq));
      am2 = qKv(am);
      shagi.push({
        title: 'Катет AM',
        lines: [`$AM=\\dfrac{BM}{\\mathrm{tg}\\,A}=${x}:${tgTex}=${qTex(am)}$.`],
      });
    } else {
      am2 = q(x * x, 4);
      bm2 = qMul(am2, tg2);
      shagi.push({
        title: 'Катеты AM и BM',
        lines: [
          `$AM=\\dfrac{AC}{2}=${qTex(q(x, 2))}$.`,
          `$BM=AM\\cdot\\mathrm{tg}\\,A=${qTex(q(x, 2))}\\cdot ${tgTex}=${korenTex(bm2)}$.`,
        ],
      });
    }
    const ab2 = qAdd(am2, bm2);
    const otvet = qZapis(qKoren(ab2));
    shagi.push({
      title: 'Боковая сторона по теореме Пифагора',
      lines: [`$AB^2=AM^2+BM^2=${qTex(am2)}+${qTex(bm2)}=${qTex(ab2)}$.`, `$AB=${tex(otvet)}$.`],
    });
    return {
      otvet,
      etapy: shagi,
      hints: [
        vopros(
          'Чему равен $\\mathrm{tg}\\,A$ в треугольнике $ABM$?',
          '$\\dfrac{BM}{AM}$',
          ['$\\dfrac{AM}{BM}$', '$\\dfrac{BM}{AB}$'],
          x,
        ),
        vopros(
          'Как найти $AB$, зная $AM$ и $BM$?',
          '$\\sqrt{AM^2+BM^2}$',
          ['$AM+BM$', '$\\sqrt{BM^2-AM^2}$'],
          qq,
          '$AB$ — гипотенуза треугольника $ABM$.',
        ),
      ],
    };
  },
  proverka(p) {
    const x = num(p, 'x');
    const tg = (num(p, 'p') * Math.sqrt(num(p, 'r'))) / num(p, 'q');
    const a = Math.atan(tg);
    /* Вершина B — пересечение лучей из A и C под углом A к основанию. */
    const am = num(p, 'v') === 0 ? x / tg : x / 2;
    const B: T2 = [0, am * Math.tan(a)];
    return izFloat(rasst([-am, 0], B));
  },
  scena(p) {
    const tg = (num(p, 'p') * Math.sqrt(num(p, 'r'))) / num(p, 'q');
    const { t, sk } = ravnobedrennyyB(deg(Math.atan(tg)));
    const x = String(num(p, 'x'));
    const el: Element[] = [tri('A', 'B', 'C'), ...ravnyeBoka];
    if (num(p, 'v') === 0) {
      el.push(
        otr('B', 'M', { vydelit: 'dano', znachenie: x }),
        shtrih('A', 'M', 2),
        shtrih('M', 'C', 2),
      );
    } else el.push(st('A', 'C', x));
    el.push(ug('C', 'A', 'B', { vydelit: 'dano' }), isk('A', 'B'));
    return sc({ tochki: t, elementy: el, ...(num(p, 'v') === 0 ? {} : { bezPodpisi: ['M'] }) }, sk);
  },
});

/* ── P70. Площадь равнобедренного треугольника ───────────────── */

const P70 = sobrat({
  id: 'P70',
  gruppa: '3B',
  title: 'Площадь равнобедренного треугольника по стороне и углу',
  polya: ['v', 'x', 'p', 'q'],
  alt: 'Равнобедренный треугольник ABC с основанием AC',
  text(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    if (v === 0) {
      return `В равнобедренном треугольнике $ABC$ боковая сторона $AB=${x}$, $\\sin A=${drob(pp, qq)}$. Найдите площадь треугольника $ABC$.`;
    }
    if (v === 1) {
      return `В равнобедренном треугольнике $ABC$ основание $AC=${x}$, $\\mathrm{tg}\\,A=${drob(pp, qq)}$. Найдите площадь треугольника $ABC$.`;
    }
    return `В равнобедренном треугольнике $ABC$ высота $BM$, проведённая к основанию, равна $${x}$, а $\\mathrm{tg}\\,A=${drobUsloviya(pp, qq, 1)}$. Найдите площадь треугольника $ABC$.`;
  },
  solve(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const t = q(num(p, 'p'), num(p, 'q'));
    let am: Q;
    let bm: Q;
    const shagi: { title: string; lines: string[] }[] = [
      {
        title: 'Высота к основанию',
        lines: [
          'Высота $BM$ к основанию $AC$ равнобедренного треугольника делит основание пополам: $AC=2\\cdot AM$. Треугольник $ABM$ прямоугольный.',
        ],
      },
    ];
    if (v === 0) {
      bm = qMul(q(x), t);
      const am2 = qSub(q(x * x), qKv(bm));
      am = qKoren(am2);
      shagi.push({
        title: 'Катеты треугольника ABM',
        lines: [
          `$BM=AB\\cdot\\sin A=${x}\\cdot ${qTex(t)}=${qTex(bm)}$.`,
          `$AM=\\sqrt{AB^2-BM^2}=\\sqrt{${x * x}-${qTex(qKv(bm))}}=${qTex(am)}$.`,
        ],
      });
    } else if (v === 1) {
      am = q(x, 2);
      bm = qMul(am, t);
      shagi.push({
        title: 'Высота BM',
        lines: [
          `$AM=\\dfrac{AC}{2}=${qTex(am)}$.`,
          `$BM=AM\\cdot\\mathrm{tg}\\,A=${qTex(am)}\\cdot ${qTex(t)}=${qTex(bm)}$.`,
        ],
      });
    } else {
      bm = q(x);
      am = qDiv(bm, t);
      shagi.push({
        title: 'Половина основания',
        lines: [`$AM=\\dfrac{BM}{\\mathrm{tg}\\,A}=${x}:${qTex(t)}=${qTex(am)}$.`],
      });
    }
    const ac = qMul(am, q(2));
    const s = qDiv(qMul(ac, bm), q(2));
    const otvet = qZapis(s);
    shagi.push({
      title: 'Площадь',
      lines: [
        `$AC=2\\cdot AM=${qTex(ac)}$.`,
        `$S=\\dfrac{AC\\cdot BM}{2}=\\dfrac{${qTex(ac)}\\cdot ${qTex(bm)}}{2}=${tex(otvet)}$.`,
      ],
    });
    return {
      otvet,
      etapy: shagi,
      hints: [
        vopros(
          'Чему равна половина основания $AM$?',
          v$(qTex(am)),
          [v$(qTex(ac)), v$(qTex(bm))],
          x + v,
        ),
        vopros(
          'Как найти площадь треугольника $ABC$?',
          '$\\dfrac{AC\\cdot BM}{2}$',
          ['$AC\\cdot BM$', '$\\dfrac{AM\\cdot BM}{2}$'],
          num(p, 'p'),
          'Площадь — половина основания на высоту.',
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const t = num(p, 'p') / num(p, 'q');
    let a: number;
    let am: number;
    if (v === 0) {
      a = Math.asin(t);
      am = x * Math.cos(a);
    } else if (v === 1) {
      a = Math.atan(t);
      am = x / 2;
    } else {
      a = Math.atan(t);
      am = x / t;
    }
    return izFloat(ploshchadTr([-am, 0], [am, 0], [0, am * Math.tan(a)]));
  },
  scena(p) {
    const v = num(p, 'v');
    const t0 = num(p, 'p') / num(p, 'q');
    const a = v === 0 ? Math.asin(t0) : Math.atan(t0);
    const { t, sk } = ravnobedrennyyB(deg(a));
    const x = String(num(p, 'x'));
    const el: Element[] = [tri('A', 'B', 'C'), ...ravnyeBoka];
    if (v === 0) el.push(st('A', 'B', x));
    if (v === 1) el.push(st('A', 'C', x));
    if (v === 2) el.push(otr('B', 'M', { vydelit: 'dano', znachenie: x }), pryam('B', 'M', 'C'));
    el.push(ug('C', 'A', 'B', { vydelit: 'dano' }));
    return sc({ tochki: t, elementy: el, ...(v === 2 ? {} : { bezPodpisi: ['M'] }) }, sk);
  },
});

/* ── Треугольник с внешним углом при C ───────────────────────── */

/** A слева, C справа внизу, сторона AC продолжена за C, B — сверху. */
function sVneshnim(ugolA: number, ugolC: number, bc: number): Record<string, T2> {
  const a = ugolA * RAD;
  const c = ugolC * RAD;
  const C: T2 = [0, 0];
  const B: T2 = [-bc * Math.cos(c), bc * Math.sin(c)];
  /* A — на прямой y = 0 левее C, видит B под углом A. */
  const A: T2 = [B[0] - B[1] / Math.tan(a), 0];
  return { A, B, C, E: [bc * 0.45, 0] };
}

const P71 = sobrat({
  id: 'P71',
  gruppa: '3B',
  title: 'Внешний угол $150^\\circ$, $BC$ и $\\sin A$ → $AB$',
  polya: ['bc', 'p', 'q'],
  alt: 'Треугольник ABC с внешним углом при вершине C',
  text(p) {
    return `В треугольнике $ABC$ известно, что $BC=${num(p, 'bc')}$, $\\sin A=${drob(num(p, 'p'), num(p, 'q'))}$, внешний угол при вершине $C$ равен $150^\\circ$. Найдите $AB$.`;
  },
  solve(p) {
    const bc = num(p, 'bc');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const otvet = qZapis(q(bc * qq, 2 * pp));
    return {
      otvet,
      etapy: [
        {
          title: 'Угол C треугольника',
          lines: [
            'Внутренний и внешний углы при вершине $C$ смежные:',
            '$\\angle C=180^\\circ-150^\\circ=30^\\circ$, $\\sin C=\\dfrac{1}{2}$.',
          ],
        },
        {
          title: 'Теорема синусов',
          lines: [
            '$\\dfrac{AB}{\\sin C}=\\dfrac{BC}{\\sin A}$, поэтому',
            `$AB=\\dfrac{BC\\cdot\\sin C}{\\sin A}=\\dfrac{${bc}\\cdot\\frac{1}{2}}{${drob(pp, qq)}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $C$ треугольника?',
          '$30^\\circ$',
          ['$150^\\circ$', '$60^\\circ$'],
          bc,
          'Внешний угол и угол треугольника вместе дают $180^\\circ$.',
        ),
        vopros(
          'Какое равенство связывает $AB$ и $BC$?',
          '$\\dfrac{AB}{\\sin C}=\\dfrac{BC}{\\sin A}$',
          ['$\\dfrac{AB}{\\sin A}=\\dfrac{BC}{\\sin C}$', '$AB\\cdot\\sin C=BC\\cdot\\sin A$'],
          pp + qq,
          'Сторона против угла $C$ — $AB$, против угла $A$ — $BC$.',
        ),
      ],
    };
  },
  proverka(p) {
    const bc = num(p, 'bc');
    const a = deg(Math.asin(num(p, 'p') / num(p, 'q')));
    const t = sVneshnim(a, 30, bc);
    return izFloat(rasst(t.A!, t.B!));
  },
  scena(p) {
    const a0 = deg(Math.asin(num(p, 'p') / num(p, 'q')));
    const a = zazhat(a0, POROG_UGLA, 150 - 2 * POROG_UGLA);
    return sc(
      {
        tochki: sVneshnim(a, 30, 10),
        elementy: [
          tri('A', 'B', 'C'),
          prod('A', 'C', { doTochki: 'E', sploshnoe: true }),
          st('C', 'B', String(num(p, 'bc'))),
          ug('C', 'A', 'B', { vydelit: 'dano' }),
          ug('B', 'C', 'E', { vydelit: 'dano', znachenie: gr(150) }),
          isk('A', 'B'),
        ],
        bezPodpisi: ['E'],
      },
      Math.abs(a - a0) > 1e-9,
    );
  },
});

const P72 = sobrat({
  id: 'P72',
  gruppa: '3B',
  title: 'Внешний угол $120^\\circ$, $BC$ и $AC$ → $AB$',
  polya: ['k1', 'k2', 'm'],
  alt: 'Треугольник ABC с внешним углом при вершине C',
  text(p) {
    const m = num(p, 'm');
    return `В треугольнике $ABC$ известно, что $BC=${kor(num(p, 'k1'), m)}$, $AC=${kor(num(p, 'k2'), m)}$, внешний угол при вершине $C$ равен $120^\\circ$. Найдите $AB$.`;
  },
  solve(p) {
    const k1 = num(p, 'k1');
    const k2 = num(p, 'k2');
    const m = num(p, 'm');
    const bc2 = k1 * k1 * m;
    const ac2 = k2 * k2 * m;
    const pr = k1 * k2 * m;
    const ab2 = bc2 + ac2 - pr;
    const otvet = qZapis(qKoren(q(ab2)));
    return {
      otvet,
      etapy: [
        {
          title: 'Угол C треугольника',
          lines: ['$\\angle C=180^\\circ-120^\\circ=60^\\circ$, $\\cos 60^\\circ=\\dfrac{1}{2}$.'],
        },
        {
          title: 'Теорема косинусов',
          lines: [
            '$AB^2=BC^2+AC^2-2\\cdot BC\\cdot AC\\cdot\\cos C=BC^2+AC^2-BC\\cdot AC$.',
            `$BC^2=${bc2}$, $AC^2=${ac2}$, $BC\\cdot AC=${kor(k1, m)}\\cdot ${kor(k2, m)}=${pr}$.`,
            `$AB^2=${bc2}+${ac2}-${pr}=${ab2}$, $AB=\\sqrt{${ab2}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $C$ треугольника?',
          '$60^\\circ$',
          ['$120^\\circ$', '$30^\\circ$'],
          k2,
          'Внешний угол и угол треугольника смежные.',
        ),
        vopros(
          'Чему равно $AB^2$?',
          v$(ab2),
          [v$(bc2 + ac2 + pr), v$(bc2 + ac2)],
          k1 + m,
          'Теорема косинусов: $AB^2=BC^2+AC^2-2\\cdot BC\\cdot AC\\cdot\\cos 60^\\circ$.',
        ),
      ],
    };
  },
  proverka(p) {
    const m = Math.sqrt(num(p, 'm'));
    const bc = num(p, 'k1') * m;
    const ac = num(p, 'k2') * m;
    const B: T2 = [-bc * Math.cos(60 * RAD), bc * Math.sin(60 * RAD)];
    return izFloat(rasst([-ac, 0], B));
  },
  scena(p) {
    const k1 = num(p, 'k1');
    const k2 = num(p, 'k2');
    const m = num(p, 'm');
    /* Угол A — из сторон: B над прямой AC. */
    const B: T2 = [-k1 * Math.cos(60 * RAD), k1 * Math.sin(60 * RAD)];
    const a0 = deg(Math.atan2(B[1], B[0] + k2));
    const a = zazhat(a0, POROG_UGLA, 120 - POROG_UGLA);
    return sc(
      {
        tochki: sVneshnim(a, 60, 10),
        elementy: [
          tri('A', 'B', 'C'),
          prod('A', 'C', { doTochki: 'E', sploshnoe: true }),
          st('C', 'B', korChertezh(k1, m)),
          st('A', 'C', korChertezh(k2, m)),
          ug('B', 'C', 'E', { vydelit: 'dano', znachenie: gr(120) }),
          isk('A', 'B'),
        ],
        bezPodpisi: ['E'],
      },
      Math.abs(a - a0) > 1e-9,
    );
  },
});

export const PROTOTIPY_TREUG: PrototipChasti3[] = [
  P61,
  P62,
  P63,
  P64,
  P65,
  P66,
  P67,
  P68,
  P69,
  P70,
  P71,
  P72,
];
