/**
 * База №12, часть 3: средняя линия трапеции, отношения площадей,
 * правильные многоугольники и длина дуги (задачи 439–463 задачника,
 * прототипы P87–P91).
 */

import {
  duga,
  mn,
  okr,
  otr,
  pryam,
  scena as sc,
  shtrih,
  tochka,
  ug,
  gr,
} from '@/lib/planimetriya/stseny/dsl';
import type { Element, T2 } from '@/lib/planimetriya/types';
import { tex } from '../chisla';
import {
  RAD,
  drob,
  izFloat,
  num,
  ploshchadTr,
  type PrototipChasti3,
  q,
  qAdd,
  qDiv,
  qKoren,
  qMul,
  qTex,
  qZapis,
  rasst,
  sobrat,
  ugolMezhdu,
  v$,
  vopros,
  zazhat,
} from './chast3-obshchee';

const st = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie: zn,
});

/* ── P87. Прямоугольная трапеция: средняя линия ──────────────── */

const P87 = sobrat({
  id: 'P87',
  gruppa: '3F',
  title: 'Прямоугольная трапеция с $BC=CD$ → средняя линия',
  polya: ['ab', 'bc'],
  alt: 'Прямоугольная трапеция ABCD со средней линией',
  text(p) {
    return `В прямоугольной трапеции $ABCD$ с основаниями $BC$ и $AD$ угол $BAD$ прямой, $AB=${num(p, 'ab')}$, $BC=CD=${num(p, 'bc')}$. Найдите среднюю линию трапеции.`;
  },
  solve(p) {
    const h = num(p, 'ab');
    const a = num(p, 'bc');
    const hd2 = a * a - h * h;
    const hd = qKoren(q(hd2));
    const ad = qAdd(q(a), hd);
    const otvet = qZapis(qDiv(qAdd(q(a), ad), q(2)));
    return {
      otvet,
      etapy: [
        {
          title: 'Высота из вершины $C$',
          lines: [
            'Опустим высоту $CH$ на $AD$. Четырёхугольник $ABCH$ — прямоугольник:',
            `$CH=AB=${h}$, $AH=BC=${a}$.`,
          ],
        },
        {
          title: 'Отрезок HD по теореме Пифагора',
          lines: [
            `$HD^2=CD^2-CH^2=${a}^2-${h}^2=${hd2}$, $HD=${qTex(hd)}$.`,
            `$AD=AH+HD=${a}+${qTex(hd)}=${qTex(ad)}$.`,
          ],
        },
        {
          title: 'Средняя линия',
          lines: [
            'Средняя линия трапеции — полусумма оснований:',
            `$\\dfrac{BC+AD}{2}=\\dfrac{${a}+${qTex(ad)}}{2}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равно большее основание $AD$?',
          v$(qTex(ad)),
          [v$(qTex(hd)), v$(a + h)],
          h,
          '$AD=BC+HD$, где $CH$ — высота.',
        ),
        vopros(
          'Чему равна средняя линия трапеции?',
          '$\\dfrac{BC+AD}{2}$',
          ['$BC+AD$', '$\\dfrac{AD-BC}{2}$'],
          a,
        ),
      ],
    };
  },
  proverka(p) {
    const h = num(p, 'ab');
    const a = num(p, 'bc');
    /* D — точка оси x на расстоянии a от C(a; h). */
    const D: T2 = [a + Math.sqrt(a * a - h * h), 0];
    if (Math.abs(rasst([a, h], D) - a) > 1e-9) return '?';
    return izFloat((a + D[0]) / 2);
  },
  scena(p) {
    const h = num(p, 'ab');
    const a = num(p, 'bc');
    const D: T2 = [a + Math.sqrt(a * a - h * h), 0];
    return {
      tochki: {
        A: [0, 0],
        B: [0, h],
        C: [a, h],
        D,
        P: { seredina: ['A', 'B'] },
        Q: { seredina: ['C', 'D'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        pryam('B', 'A', 'D'),
        st('A', 'B', String(h)),
        { ...st('B', 'C', String(a)), shtrihi: 1 },
        { ...st('C', 'D', String(a)), shtrihi: 1 },
        otr('P', 'Q', { vydelit: 'iskomoe' }),
      ],
      bezPodpisi: ['P', 'Q'],
    };
  },
});

/* ── P88. Отношение площадей треугольников с общим углом ─────── */

const P88 = sobrat({
  id: 'P88',
  gruppa: '3F',
  title: 'Общий угол $B$: $BM:AB$ и $BK:BC$ → отношение площадей',
  polya: ['a', 'b', 'c', 'd'],
  alt: 'Треугольник ABC с точками M на AB и K на BC',
  text(p) {
    return `В треугольнике $ABC$ на сторонах $AB$ и $BC$ отмечены точки $M$ и $K$ соответственно так, что $BM:AB=${num(p, 'a')}:${num(p, 'b')}$, а $BK:BC=${num(p, 'c')}:${num(p, 'd')}$. Во сколько раз площадь треугольника $ABC$ больше площади треугольника $MBK$?`;
  },
  solve(p) {
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((k) => num(p, k)) as [
      number,
      number,
      number,
      number,
    ];
    const otvet = qZapis(q(b * d, a * c));
    return {
      otvet,
      etapy: [
        {
          title: 'Площадь через две стороны и угол',
          lines: [
            'У треугольников $ABC$ и $MBK$ общий угол $B$:',
            '$S_{ABC}=\\dfrac12\\,AB\\cdot BC\\cdot\\sin B$, $S_{MBK}=\\dfrac12\\,BM\\cdot BK\\cdot\\sin B$.',
          ],
        },
        {
          title: 'Отношение',
          lines: [
            `$\\dfrac{S_{ABC}}{S_{MBK}}=\\dfrac{AB}{BM}\\cdot\\dfrac{BC}{BK}=${drob(b, a)}\\cdot ${drob(d, c)}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Что общего у треугольников $ABC$ и $MBK$?',
          'угол $B$',
          ['сторона $AC$', 'высота из $B$'],
          b + d,
          'Площадь треугольника — половина произведения двух сторон на синус угла между ними.',
        ),
        vopros(
          'Во сколько раз $AB$ больше $BM$?',
          v$(qTex(q(b, a))),
          [v$(qTex(q(a, b))), v$(qTex(q(d, c)))],
          c,
        ),
      ],
    };
  },
  proverka(p) {
    const A: T2 = [0, 0];
    const B: T2 = [3, 7];
    const C: T2 = [11, 0];
    const tm = num(p, 'a') / num(p, 'b');
    const tk = num(p, 'c') / num(p, 'd');
    const M: T2 = [B[0] + (A[0] - B[0]) * tm, B[1] + (A[1] - B[1]) * tm];
    const K: T2 = [B[0] + (C[0] - B[0]) * tk, B[1] + (C[1] - B[1]) * tk];
    return izFloat(ploshchadTr(A, B, C) / ploshchadTr(M, B, K));
  },
  scena(p) {
    return {
      tochki: {
        A: [0, 0],
        B: [4, 8],
        C: [11, 0],
        M: { naPryamoy: ['B', 'A', num(p, 'a') / num(p, 'b')] },
        K: { naPryamoy: ['B', 'C', num(p, 'c') / num(p, 'd')] },
      },
      elementy: [mn(['A', 'B', 'C']), otr('M', 'K'), tochka('M'), tochka('K')],
    };
  },
});

/* ── P89. Медиана BM и точка K на AB → площадь ABC ───────────── */

const P89 = sobrat({
  id: 'P89',
  gruppa: '3F',
  title: 'Медиана $BM$, $AK=\\frac{p}{q}AB$, площадь $AMK$ → площадь $ABC$',
  polya: ['p', 'q', 's'],
  alt: 'Треугольник ABC с медианой BM и отрезком KM',
  text(p) {
    return `В треугольнике $ABC$ проведена медиана $BM$, на стороне $AB$ взята точка $K$ так, что $AK=${drob(num(p, 'p'), num(p, 'q'))}AB$. Площадь треугольника $AMK$ равна $${num(p, 's')}$. Найдите площадь треугольника $ABC$.`;
  },
  solve(p) {
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const s = num(p, 's');
    const abm = qMul(q(s), q(qq, pp));
    const otvet = qZapis(qMul(abm, q(2)));
    return {
      otvet,
      etapy: [
        {
          title: 'Треугольники AMK и AMB',
          lines: [
            'У треугольников $AMK$ и $AMB$ общая высота из вершины $M$ на прямую $AB$, поэтому их площади относятся как основания:',
            `$\\dfrac{S_{AMK}}{S_{AMB}}=\\dfrac{AK}{AB}=${drob(pp, qq)}$, $S_{AMB}=${s}\\cdot ${drob(qq, pp)}=${qTex(abm)}$.`,
          ],
        },
        {
          title: 'Медиана делит площадь пополам',
          lines: [
            'Медиана $BM$ делит треугольник $ABC$ на два равновеликих: $S_{ABC}=2\\cdot S_{AMB}$.',
            `$S_{ABC}=2\\cdot ${qTex(abm)}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна площадь треугольника $AMB$?',
          v$(qTex(abm)),
          [v$(qTex(qDiv(q(s), q(qq)))), v$(qTex(qMul(abm, q(2))))],
          s,
          'Площади треугольников с общей высотой относятся как основания.',
        ),
        vopros(
          'Какую часть площади $ABC$ составляет $S_{AMB}$?',
          'половину',
          ['треть', 'четверть'],
          qq,
          'Медиана делит треугольник на два равновеликих.',
        ),
      ],
    };
  },
  proverka(p) {
    const A: T2 = [0, 0];
    const B: T2 = [6, 7];
    const C: T2 = [10, 0];
    const t = num(p, 'p') / num(p, 'q');
    const M: T2 = [5, 0];
    const K: T2 = [B[0] * t, B[1] * t];
    /* Подобие площадей: масштаб под данную площадь AMK. */
    return izFloat((ploshchadTr(A, B, C) * num(p, 's')) / ploshchadTr(A, M, K));
  },
  scena(p) {
    return {
      tochki: {
        A: [0, 0],
        B: [6, 7],
        C: [10, 0],
        M: { seredina: ['A', 'C'] },
        K: { naPryamoy: ['A', 'B', num(p, 'p') / num(p, 'q')] },
      },
      elementy: [
        mn(['A', 'B', 'C']),
        otr('B', 'M'),
        otr('K', 'M'),
        shtrih('A', 'M', 1),
        shtrih('M', 'C', 1),
      ],
    };
  },
});

/* ── P90. Правильный многоугольник: вписанный угол ───────────── */

const NAZVANIYA: Record<number, string> = {
  8: 'восьмиугольник',
  9: 'девятиугольник',
  10: 'десятиугольник',
  12: 'двенадцатиугольник',
};
const bukva = (i: number): string => String.fromCharCode(65 + i);
/** Вершины правильного n-угольника: A внизу слева, обход по часовой стрелке. */
const vershina = (n: number, i: number): T2 => {
  const u = (-90 - 180 / n - (360 / n) * i) * RAD;
  return [5 * Math.cos(u), 5 * Math.sin(u)];
};
/** Сколько сторон на дуге XZ, не содержащей Y. */
function storonNaDuge(n: number, x: number, y: number, z: number): number {
  const shagov = (((z - x) % n) + n) % n;
  const yNaDuge = (((y - x) % n) + n) % n < shagov;
  return yNaDuge ? n - shagov : shagov;
}

const P90 = sobrat({
  id: 'P90',
  gruppa: '3G',
  title: 'Правильный многоугольник: угол между диагоналями и сторонами',
  polya: ['n', 'x', 'y', 'z'],
  alt: 'Правильный многоугольник с отмеченным углом',
  text(p) {
    const n = num(p, 'n');
    const imya = Array.from({ length: n }, (_, i) => bukva(i)).join('');
    const ugol = bukva(num(p, 'x')) + bukva(num(p, 'y')) + bukva(num(p, 'z'));
    return `$${imya}$ — правильный ${NAZVANIYA[n] ?? `${n}-угольник`}. Найдите угол $${ugol}$. Ответ дайте в градусах.`;
  },
  solve(p) {
    const n = num(p, 'n');
    const [x, y, z] = [num(p, 'x'), num(p, 'y'), num(p, 'z')];
    const ugol = bukva(x) + bukva(y) + bukva(z);
    const k = storonNaDuge(n, x, y, z);
    const duga1 = q(360, n);
    const otvet = qZapis(q(180 * k, n));
    return {
      otvet,
      etapy: [
        {
          title: 'Описанная окружность',
          lines: [
            'Около правильного многоугольника можно описать окружность. Его стороны — равные хорды, каждая стягивает дугу',
            `$\\dfrac{360^\\circ}{${n}}=${qTex(duga1)}^\\circ$.`,
          ],
        },
        {
          title: 'Дуга под углом',
          lines: [
            `Угол $${ugol}$ — вписанный, он опирается на дугу $${bukva(x)}${bukva(z)}$, не содержащую точку $${bukva(y)}$. На ней ${k} ${k === 1 ? 'сторона' : k < 5 ? 'стороны' : 'сторон'}:`,
            `$${k}\\cdot ${qTex(duga1)}^\\circ=${qTex(qMul(q(k), duga1))}^\\circ$.`,
          ],
        },
        {
          title: 'Вписанный угол',
          lines: [
            `$\\angle ${ugol}=\\dfrac{${qTex(qMul(q(k), duga1))}^\\circ}{2}=${tex(otvet)}^\\circ$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какую дугу стягивает одна сторона?',
          v$(`${qTex(duga1)}^\\circ`),
          [v$(`${qTex(q(180, n))}^\\circ`), v$(`${qTex(q(180 * (n - 2), n))}^\\circ`)],
          n + x,
          'Вершины делят описанную окружность на равные дуги.',
        ),
        vopros(
          `Сколько сторон на дуге $${bukva(x)}${bukva(z)}$, на которую опирается угол?`,
          v$(k),
          [v$(n - k), v$(k + 1)],
          y + z,
          `Считаем стороны по дуге, не проходящей через $${bukva(y)}$.`,
        ),
      ],
    };
  },
  proverka(p) {
    const n = num(p, 'n');
    return izFloat(
      ugolMezhdu(vershina(n, num(p, 'x')), vershina(n, num(p, 'y')), vershina(n, num(p, 'z'))),
    );
  },
  scena(p) {
    const n = num(p, 'n');
    const [x, y, z] = [bukva(num(p, 'x')), bukva(num(p, 'y')), bukva(num(p, 'z'))];
    const tochki: Record<string, T2> = {};
    for (let i = 0; i < n; i += 1) tochki[bukva(i)] = vershina(n, i);
    return {
      tochki,
      elementy: [
        mn(Array.from({ length: n }, (_, i) => bukva(i))),
        otr(y, x),
        otr(y, z),
        ug(x, y, z, { vydelit: 'iskomoe' }),
      ],
    };
  },
});

/* ── P91. Длина дуги: меньшая → большая ──────────────────────── */

const P91 = sobrat({
  id: 'P91',
  gruppa: '3G',
  title: 'Центральный угол и меньшая дуга → большая дуга',
  polya: ['u', 'l'],
  alt: 'Окружность с центром O и центральным углом AOB',
  text(p) {
    return `На окружности с центром $O$ отмечены точки $A$ и $B$ так, что $\\angle AOB=${num(p, 'u')}^\\circ$. Длина меньшей дуги $AB$ равна $${num(p, 'l')}$. Найдите длину большей дуги.`;
  },
  solve(p) {
    const u = num(p, 'u');
    const l = num(p, 'l');
    const otvet = qZapis(q(l * (360 - u), u));
    return {
      otvet,
      etapy: [
        {
          title: 'Градусная мера большей дуги',
          lines: [
            `Меньшая дуга $AB$ — $${u}^\\circ$, большая — $360^\\circ-${u}^\\circ=${360 - u}^\\circ$.`,
          ],
        },
        {
          title: 'Длины пропорциональны градусам',
          lines: [
            `$${u}^\\circ$ дуги имеют длину $${l}$. Большая дуга в $\\dfrac{${360 - u}}{${u}}$ раз длиннее:`,
            `$${l}\\cdot\\dfrac{${360 - u}}{${u}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Сколько градусов в большей дуге $AB$?',
          v$(`${360 - u}^\\circ`),
          [v$(`${180 - u}^\\circ`), v$(`${2 * u}^\\circ`)],
          u,
        ),
        vopros(
          'Как связаны длина дуги и её градусная мера?',
          'прямо пропорциональны',
          ['обратно пропорциональны', 'не связаны'],
          l,
        ),
      ],
    };
  },
  proverka(p) {
    const u = num(p, 'u');
    const R = num(p, 'l') / (u * RAD);
    return izFloat(R * (2 * Math.PI - u * RAD));
  },
  scena(p) {
    const u0 = num(p, 'u');
    const u = zazhat(u0, 24, 90);
    return sc(
      {
        tochki: { O: [0, 0], B: [5, 0], A: [5 * Math.cos(u * RAD), 5 * Math.sin(u * RAD)] },
        okruzhnosti: { w: { centr: 'O', radius: 5 } },
        elementy: [
          okr('w'),
          otr('O', 'A'),
          otr('O', 'B'),
          tochka('O'),
          ug('B', 'O', 'A', { vydelit: 'dano', znachenie: gr(u0) }),
          duga('w', 'B', 'A', { vydelit: 'dano', znachenie: String(num(p, 'l')) }),
        ],
      },
      Math.abs(u - u0) > 1e-9,
    );
  },
});

export const PROTOTIPY_PROCHEE: PrototipChasti3[] = [P87, P88, P89, P90, P91];
