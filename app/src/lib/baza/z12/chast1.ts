/**
 * База, задание №12 «Планиметрия», часть 1: углы, треугольник
 * (биссектриса, медиана, высота, сумма углов, катет против угла 30°)
 * и четырёхугольники — задачи 1–114 задачника, переданные аналогами.
 *
 * Числа задач — в chast1-dannye.ts (одна строка — одна задача), текст
 * условия, разбор по шагам и чертёж строятся здесь по этим числам.
 * proverka у каждого прототипа считает ответ иначе, чем разбор: строит
 * фигуру в координатах по данным условия и измеряет искомое.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { tex, zapis } from '../chisla';
import type { GruppaBazy, HintStep, Params, Prototip, Resheno } from '../types';
import {
  bukvyUsloviya,
  risBissektrisaAL,
  risBissektrisaNaPryamoy,
  risBissektrisaParallelogramma,
  risDeltoid,
  risMedianaVysota,
  risParallelnye,
  risParallelogrammDiagonal,
  risPryamougolnayaTrapeciya,
  risPryamougolnyy,
  risRavnobedrennyy30,
  risRomb,
  risRombDiagonali,
  risSeredinaBC,
  risTrapeciya,
  risVneshniyRavnobedrennyy,
} from './chast1-ris';
import { DANNYE_12_1 } from './chast1-dannye';

export const GRUPPY_12_1: GruppaBazy[] = [
  { id: '1A', nazvanie: 'Углы и параллельные прямые', znak: '\\angle', ton: 'blue' },
  { id: '1B', nazvanie: 'Углы треугольника', znak: '180^\\circ', ton: 'orange' },
  { id: '1C', nazvanie: 'Катет против угла 30°', znak: '\\tfrac{c}{2}', ton: 'green' },
  { id: '1D', nazvanie: 'Медиана, высота, биссектриса', znak: 'BM', ton: 'navy' },
  { id: '1E', nazvanie: 'Четырёхугольники', znak: '\\square', ton: 'terra' },
];

/* ── Общее ─────────────────────────────────────────────────────── */

const VGRADUSAH = 'Ответ дайте в градусах.';

const num = (p: Params, key: string): number => {
  const v = p[key];
  if (typeof v !== 'number') throw new Error(`нет числа ${key}`);
  return v;
};

/** Число из целых m/n в TeX: «14{,}5». */
const t = (m: number, n = 1): string => tex(zapis(m, n));
/** Градусы в TeX. */
const g = (m: number, n = 1): string => `${t(m, n)}^\\circ`;
/** Вариант подсказки: число или градусы в $…$. */
const $ = (s: string): string => `$${s}$`;

/** Значение, измеренное на чертеже в координатах, — в запись бланка. */
function izmereno(x: number): string {
  const r = Math.round(x * 100);
  if (Math.abs(x * 100 - r) > 1e-6) throw new Error(`измерено не точно: ${x}`);
  return zapis(r, 100);
}

/* Геометрия для независимого пересчёта. */
type V = [number, number];
const RAD = Math.PI / 180;
const pol = (deg: number, r = 1): V => [Math.cos(deg * RAD) * r, Math.sin(deg * RAD) * r];
const raz = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1]];
const dl = (a: V, b: V): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Угол APB, градусы. */
function ugol(a: V, p: V, b: V): number {
  const u = raz(a, p);
  const v = raz(b, p);
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return Math.acos(Math.min(1, Math.max(-1, c))) / RAD;
}
/** Пересечение прямых a + s·da и b + t·db. */
function pere(a: V, da: V, b: V, db: V): V {
  const d = da[0] * db[1] - da[1] * db[0];
  const s = ((b[0] - a[0]) * db[1] - (b[1] - a[1]) * db[0]) / d;
  return [a[0] + da[0] * s, a[1] + da[1] * s];
}
/** Корень f на [lo, hi] делением пополам (f меняет знак). */
function koren(f: (x: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  const fa = f(a);
  for (let i = 0; i < 200; i += 1) {
    const m = (a + b) / 2;
    if (f(m) * fa > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (повторы убраны),
 * место верного зависит от sdvig — одно и то же при пересборке.
 */
function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  const mesto = prochie.length === 0 ? 0 : sdvig % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/**
 * Прототип по таблице чисел: generate берёт одну строку chast1-dannye
 * и называет её числа ключами kluchi. Чертёж проверяется по буквам
 * условия: каждая буква вершины из текста должна быть подписана.
 */
function prototip(o: {
  id: string;
  gruppa: string;
  title: string;
  kluchi: readonly string[];
  text: (p: Params) => string;
  solve: (p: Params) => Resheno;
  proverka: (p: Params) => string;
  risunok: (p: Params, bukvy: string[]) => string;
}): Prototip {
  const stroki = DANNYE_12_1[o.id];
  if (stroki === undefined) throw new Error(`нет чисел ${o.id}`);
  return {
    id: o.id,
    gruppa: o.gruppa,
    title: o.title,
    tip: 'chislo',
    zadach: stroki.length,
    generate(rng: Rng) {
      const s = stroki[rng.int(0, stroki.length - 1)] ?? [];
      const p: Params = {};
      o.kluchi.forEach((k, i) => {
        p[k] = s[i] ?? NaN;
      });
      return p;
    },
    text: o.text,
    solve: o.solve,
    proverka: o.proverka,
    risunok(p) {
      return o.risunok(p, bukvyUsloviya(o.text(p)));
    },
  };
}

/* ── I. Углы ───────────────────────────────────────────────────── */

const NA_PRYAMOY =
  'На прямой $AB$ взята точка $M$. Луч $MD$ — биссектриса угла $CMB$. Известно, что';

const P01 = prototip({
  id: 'P01',
  gruppa: '1A',
  title: 'Биссектриса угла $CMB$: $\\angle DMC \\to \\angle CMA$',
  kluchi: ['a'],
  text: (p) => `${NA_PRYAMOY} $\\angle DMC = ${g(num(p, 'a'))}$. Найдите угол $CMA$. ${VGRADUSAH}`,
  solve(p) {
    const a = num(p, 'a');
    const otvet = zapis(180 - 2 * a, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $CMB$',
          lines: [
            `Биссектриса $MD$ делит угол $CMB$ на два равных угла $DMC$ и $DMB$.`,
            `$\\angle CMB = 2\\cdot\\angle DMC = 2\\cdot ${g(a)} = ${g(2 * a)}$.`,
          ],
        },
        {
          title: 'Смежный угол',
          lines: [
            'Точка $M$ лежит на прямой $AB$, поэтому углы $CMA$ и $CMB$ смежные: вместе они дают $180^\\circ$.',
            `$\\angle CMA = 180^\\circ - ${g(2 * a)} = ${g(180 - 2 * a)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $CMB$?',
          $(g(2 * a)),
          [$(g(a)), $(g(180 - a))],
          a,
          'Биссектриса делит угол пополам, значит, весь угол вдвое больше половины.',
        ),
        vopros(
          'Как связаны углы $CMA$ и $CMB$?',
          'В сумме дают $180^\\circ$',
          ['Равны', 'В сумме дают $90^\\circ$'],
          a + 1,
          'Это смежные углы: их стороны $MA$ и $MB$ — лучи одной прямой.',
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    /* Луч MB — ось x, MD повёрнут на a, MC — ещё на a (биссектриса). */
    const D = pol(a);
    const C = pol(ugol(pol(0), [0, 0], D) * 2);
    return izmereno(ugol(C, [0, 0], [-1, 0]));
  },
  risunok: (p) =>
    risBissektrisaNaPryamoy(num(p, 'a'), { ugol: 'DMC', znachenie: num(p, 'a') }, 'CMA'),
});

const P02 = prototip({
  id: 'P02',
  gruppa: '1A',
  title: 'Биссектриса угла $CMB$: $\\angle CMA \\to \\angle DMB$',
  kluchi: ['c'],
  text: (p) => `${NA_PRYAMOY} $\\angle CMA = ${g(num(p, 'c'))}$. Найдите угол $DMB$. ${VGRADUSAH}`,
  solve(p) {
    const c = num(p, 'c');
    const otvet = zapis(180 - c, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Смежный угол',
          lines: [
            'Углы $CMA$ и $CMB$ смежные: $M$ лежит на прямой $AB$, их сумма $180^\\circ$.',
            `$\\angle CMB = 180^\\circ - ${g(c)} = ${g(180 - c)}$.`,
          ],
        },
        {
          title: 'Половина угла',
          lines: [
            'Биссектриса $MD$ делит угол $CMB$ пополам.',
            `$\\angle DMB = ${g(180 - c)} : 2 = ${g(180 - c, 2)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $CMB$?',
          $(g(180 - c)),
          [$(g(c)), $(g(90 - c / 2))],
          c,
          'Углы $CMA$ и $CMB$ смежные.',
        ),
        vopros(
          'Какую часть угла $CMB$ составляет угол $DMB$?',
          'Половину',
          ['Треть', 'Весь угол'],
          c + 2,
          '$MD$ — биссектриса угла $CMB$.',
        ),
      ],
    };
  },
  proverka(p) {
    const c = num(p, 'c');
    const C = pol(180 - c);
    /* Биссектриса — по сумме единичных векторов сторон угла. */
    const D: V = [C[0] + 1, C[1]];
    return izmereno(ugol(D, [0, 0], [1, 0]));
  },
  risunok: (p) =>
    risBissektrisaNaPryamoy(
      (180 - num(p, 'c')) / 2,
      { ugol: 'CMA', znachenie: num(p, 'c') },
      'DMB',
    ),
});

const P03 = prototip({
  id: 'P03',
  gruppa: '1A',
  title: 'Параллельные прямые: $\\angle 1$ и $\\angle 2 \\to \\angle 3$',
  kluchi: ['a', 'b'],
  text: (p) =>
    `Прямые $m$ и $n$ параллельны (см. рисунок). Найдите величину угла $3$, если $\\angle 1 = ${g(num(p, 'a'))}$, $\\angle 2 = ${g(num(p, 'b'))}$. ${VGRADUSAH}`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const otvet = zapis(180 - a - b, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол треугольника при прямой $n$',
          lines: [
            'Секущие и прямая $n$ образуют треугольник, угол $3$ — его угол при вершине на прямой $m$.',
            `Угол треугольника при левой вершине на $n$ и $\\angle 1$ — соответственные углы при параллельных $m$ и $n$, поэтому он равен $${g(a)}$.`,
          ],
        },
        {
          title: 'Сумма углов треугольника',
          lines: [
            `Углы треугольника: $${g(a)}$, $\\angle 2 = ${g(b)}$ и $\\angle 3$.`,
            `$\\angle 3 = 180^\\circ - ${g(a)} - ${g(b)} = ${g(180 - a - b)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол треугольника при левой вершине на прямой $n$?',
          $(g(a)),
          [$(g(180 - a)), $(g(b))],
          a + b,
          'Он и угол $1$ — соответственные углы при параллельных прямых.',
        ),
        vopros(
          'Чему равна сумма углов треугольника?',
          '$180^\\circ$',
          ['$360^\\circ$', '$90^\\circ$'],
          a,
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const X: V = [0, 0];
    const Y: V = [5, 0];
    /* Прямая n — ось x, m — через P параллельно ей; ∠1 — между m и XP. */
    const P = pere(X, pol(a), Y, pol(180 - b));
    return izmereno(ugol(X, P, Y));
  },
  risunok: (p) => risParallelnye(num(p, 'a'), num(p, 'b')),
});

/* ── II. Углы треугольника ─────────────────────────────────────── */

const P04 = prototip({
  id: 'P04',
  gruppa: '1B',
  title: 'Равнобедренный: внешний угол при $B$ → угол $C$',
  kluchi: ['b'],
  text: (p) =>
    `В треугольнике $ABC$ стороны $AC$ и $BC$ равны. Внешний угол при вершине $B$ равен $${g(num(p, 'b'))}$. Найдите угол $C$. ${VGRADUSAH}`,
  solve(p) {
    const b = num(p, 'b');
    const B = 180 - b;
    const otvet = zapis(180 - 2 * B, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $B$',
          lines: [
            `Внешний и внутренний углы при $B$ смежные: $\\angle B = 180^\\circ - ${g(b)} = ${g(B)}$.`,
          ],
        },
        {
          title: 'Угол $A$',
          lines: [
            `$AC = BC$, значит, треугольник равнобедренный с основанием $AB$, и углы при основании равны: $\\angle A = \\angle B = ${g(B)}$.`,
          ],
        },
        {
          title: 'Угол $C$',
          lines: [`$\\angle C = 180^\\circ - ${g(B)} - ${g(B)} = ${g(180 - 2 * B)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $B$ треугольника?',
          $(g(B)),
          [$(g(b)), $(g(b - 90))],
          b,
          'Внешний угол и угол треугольника при той же вершине — смежные.',
        ),
        vopros(
          'Какие углы треугольника равны?',
          '$\\angle A$ и $\\angle B$',
          ['$\\angle A$ и $\\angle C$', '$\\angle B$ и $\\angle C$'],
          b + 1,
          'Равны углы при основании $AB$ — против равных сторон $BC$ и $AC$.',
        ),
      ],
    };
  },
  proverka(p) {
    const B = 180 - num(p, 'b');
    const A: V = [0, 0];
    const Bv: V = [1, 0];
    /* C — на серединном перпендикуляре к AB (AC = BC), под углом B к основанию. */
    const C = pere(Bv, pol(180 - B), [0.5, 0], [0, 1]);
    return izmereno(ugol(A, C, Bv));
  },
  risunok: (p) => risVneshniyRavnobedrennyy(num(p, 'b')),
});

const P05 = prototip({
  id: 'P05',
  gruppa: '1B',
  title: 'Биссектриса $AL$: углы $ALC$ и $ABC$ → угол $ACB$',
  kluchi: ['l', 'b'],
  text: (p) =>
    `В треугольнике $ABC$ проведена биссектриса $AL$, угол $ALC$ равен $${g(num(p, 'l'))}$, угол $ABC$ равен $${g(num(p, 'b'))}$. Найдите угол $ACB$. ${VGRADUSAH}`,
  solve(p) {
    const l = num(p, 'l');
    const b = num(p, 'b');
    const pol2 = l - b;
    const A = 2 * pol2;
    const otvet = zapis(180 - b - A, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $BAL$',
          lines: [
            'Угол $ALC$ — внешний угол треугольника $ABL$ при вершине $L$. Он равен сумме двух углов этого треугольника, не смежных с ним: $\\angle ALC = \\angle ABL + \\angle BAL$.',
            `$\\angle BAL = ${g(l)} - ${g(b)} = ${g(pol2)}$.`,
          ],
        },
        {
          title: 'Угол $A$',
          lines: [`$AL$ — биссектриса, поэтому $\\angle BAC = 2\\cdot ${g(pol2)} = ${g(A)}$.`],
        },
        {
          title: 'Угол $C$',
          lines: [`$\\angle ACB = 180^\\circ - ${g(b)} - ${g(A)} = ${g(180 - b - A)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $BAL$?',
          $(g(pol2)),
          [$(g(l + b > 180 ? 360 - l - b : 180 - l - b)), $(g(2 * pol2))],
          l,
          'Внешний угол $ALC$ треугольника $ABL$ равен сумме углов $B$ и $BAL$.',
        ),
        vopros(
          'Чему равен весь угол $BAC$?',
          $(g(A)),
          [$(g(pol2)), $(g(180 - l))],
          l + b,
          'Биссектриса делит угол $A$ пополам.',
        ),
      ],
    };
  },
  proverka(p) {
    const l = num(p, 'l');
    const b = num(p, 'b');
    /* Подбор угла A: строим треугольник, L — по свойству биссектрисы, меряем ALC. */
    const uALC = (uA: number): number => {
      const A: V = [0, 0];
      const C: V = [1, 0];
      const B = pere(A, pol(uA), C, pol(180 - (180 - uA - b)));
      const k = dl(A, B) / (dl(A, B) + dl(A, C));
      const L: V = [B[0] + (C[0] - B[0]) * k, B[1] + (C[1] - B[1]) * k];
      return ugol(A, L, C) - l;
    };
    const uA = koren(uALC, 0.01, 179.99 - b);
    return izmereno(180 - uA - b);
  },
  risunok: (p) => risBissektrisaAL(num(p, 'l'), num(p, 'b')),
});

/* ── Треугольник: медиана и высота ─────────────────────────────── */

const P06 = prototip({
  id: 'P06',
  gruppa: '1D',
  title: 'Медиана $BM$, высота $BH$, $BC = BM$ → $AH$',
  kluchi: ['c'],
  text: (p) =>
    `В треугольнике $ABC$ сторона $AC = ${num(p, 'c')}$, $BM$ — медиана, $BH$ — высота, $BC = BM$. Найдите длину отрезка $AH$.`,
  solve(p) {
    const c = num(p, 'c');
    const otvet = zapis(3 * c, 4);
    return {
      otvet,
      etapy: [
        {
          title: 'Половины стороны $AC$',
          lines: [`$BM$ — медиана: $AM = MC = ${c} : 2 = ${t(c, 2)}$.`],
        },
        {
          title: 'Треугольник $MBC$',
          lines: [
            '$BC = BM$, значит, треугольник $MBC$ равнобедренный с основанием $MC$. Высота $BH$ в нём — ещё и медиана.',
            `$MH = HC = ${t(c, 2)} : 2 = ${t(c, 4)}$.`,
          ],
        },
        {
          title: 'Отрезок $AH$',
          lines: [`$AH = AM + MH = ${t(c, 2)} + ${t(c, 4)} = ${t(3 * c, 4)}$.`],
        },
      ],
      hints: [
        vopros(
          'Каким отрезком будет высота $BH$ в треугольнике $MBC$?',
          'Медианой',
          ['Средней линией', 'Стороной'],
          c,
          'В равнобедренном треугольнике высота к основанию — и медиана, и биссектриса.',
        ),
        vopros(
          'Какую часть стороны $AC$ составляет $AH$?',
          '$\\dfrac34$',
          ['$\\dfrac12$', '$\\dfrac14$'],
          c + 1,
          '$AM$ — половина $AC$, $MH$ — ещё четверть.',
        ),
      ],
    };
  },
  proverka(p) {
    const c = num(p, 'c');
    /* B = (x, 1) подбирается так, чтобы BM = BC; H — проекция B на AC. */
    const x = koren((s) => dl([s, 1], [c / 2, 0]) - dl([s, 1], [c, 0]), c / 2, c);
    return izmereno(x);
  },
  risunok: (p) => risMedianaVysota(num(p, 'c')),
});

/* ── Катет против угла 30° ─────────────────────────────────────── */

function katet30(o: {
  ugolStupen: { title: string; lines: string[] };
  kakoyKatet: string;
  protiv: string;
  dano: string;
  danoZn: number;
  iskomoe: string;
  gipotenuza: boolean;
  hintUgol: HintStep;
}): Resheno {
  const k = o.danoZn;
  const otvet = o.gipotenuza ? zapis(2 * k, 1) : zapis(k, 2);
  const zapisOtveta = o.gipotenuza
    ? `$${o.iskomoe} = 2\\cdot ${o.dano} = 2\\cdot ${k} = ${tex(otvet)}$.`
    : `$${o.iskomoe} = ${o.dano} : 2 = ${k} : 2 = ${tex(otvet)}$.`;
  return {
    otvet,
    etapy: [
      o.ugolStupen,
      {
        title: 'Катет против угла $30^\\circ$',
        lines: [
          `Катет ${o.kakoyKatet} лежит против угла $${o.protiv} = 30^\\circ$, поэтому он равен половине гипотенузы.`,
          zapisOtveta,
        ],
      },
    ],
    hints: [
      o.hintUgol,
      vopros(
        'Чему равен катет, лежащий против угла $30^\\circ$?',
        'Половине гипотенузы',
        ['Гипотенузе', 'Удвоенной гипотенузе'],
        k,
      ),
    ],
  };
}

const P07 = prototip({
  id: 'P07',
  gruppa: '1C',
  title: 'Внешний угол $150^\\circ$ при $A$: катет $BC$ → гипотенуза',
  kluchi: ['k'],
  text: (p) =>
    `В прямоугольном треугольнике $ABC$ внешний угол при вершине $A$ равен $150^\\circ$. Катет $BC = ${num(p, 'k')}$. Найдите длину гипотенузы $AB$.`,
  solve: (p) =>
    katet30({
      ugolStupen: {
        title: 'Угол $A$',
        lines: [
          'Внешний и внутренний углы при $A$ смежные: $\\angle A = 180^\\circ - 150^\\circ = 30^\\circ$.',
        ],
      },
      kakoyKatet: '$BC$',
      protiv: '\\angle A',
      dano: 'BC',
      danoZn: num(p, 'k'),
      iskomoe: 'AB',
      gipotenuza: true,
      hintUgol: vopros(
        'Чему равен угол $A$?',
        '$30^\\circ$',
        ['$150^\\circ$', '$60^\\circ$'],
        num(p, 'k'),
      ),
    }),
  proverka(p) {
    const k = num(p, 'k');
    const B = pere([0, 0], pol(30), [1, 0], [0, 1]);
    return izmereno((dl([0, 0], B) / B[1]) * k);
  },
  risunok: (p) =>
    risPryamougolnyy({
      ugolA: 30,
      vneshniy: 'A',
      dano: ['B', 'C', num(p, 'k')],
      iskomoe: ['A', 'B'],
    }),
});

const P08 = prototip({
  id: 'P08',
  gruppa: '1C',
  title: 'Внешний угол $150^\\circ$ при $A$: гипотенуза → катет $BC$',
  kluchi: ['k'],
  text: (p) =>
    `В прямоугольном треугольнике $ABC$ внешний угол при вершине $A$ равен $150^\\circ$. Гипотенуза $AB = ${num(p, 'k')}$. Найдите длину катета $BC$.`,
  solve: (p) =>
    katet30({
      ugolStupen: {
        title: 'Угол $A$',
        lines: [
          'Внешний и внутренний углы при $A$ смежные: $\\angle A = 180^\\circ - 150^\\circ = 30^\\circ$.',
        ],
      },
      kakoyKatet: '$BC$',
      protiv: '\\angle A',
      dano: 'AB',
      danoZn: num(p, 'k'),
      iskomoe: 'BC',
      gipotenuza: false,
      hintUgol: vopros(
        'Чему равен угол $A$?',
        '$30^\\circ$',
        ['$150^\\circ$', '$60^\\circ$'],
        num(p, 'k') + 1,
      ),
    }),
  proverka(p) {
    const k = num(p, 'k');
    return izmereno(pol(30, k)[1]);
  },
  risunok: (p) =>
    risPryamougolnyy({
      ugolA: 30,
      vneshniy: 'A',
      dano: ['A', 'B', num(p, 'k')],
      iskomoe: ['B', 'C'],
    }),
});

const P09 = prototip({
  id: 'P09',
  gruppa: '1C',
  title: 'Внешний угол $120^\\circ$ при $A$: катет $AC$ → гипотенуза',
  kluchi: ['k'],
  text: (p) =>
    `В прямоугольном треугольнике $ABC$ внешний угол при вершине $A$ равен $120^\\circ$. Катет $AC = ${num(p, 'k')}$. Найдите длину гипотенузы $AB$.`,
  solve: (p) =>
    katet30({
      ugolStupen: {
        title: 'Углы $A$ и $B$',
        lines: [
          'Внешний и внутренний углы при $A$ смежные: $\\angle A = 180^\\circ - 120^\\circ = 60^\\circ$.',
          'Острые углы прямоугольного треугольника дают в сумме $90^\\circ$: $\\angle B = 90^\\circ - 60^\\circ = 30^\\circ$.',
        ],
      },
      kakoyKatet: '$AC$',
      protiv: '\\angle B',
      dano: 'AC',
      danoZn: num(p, 'k'),
      iskomoe: 'AB',
      gipotenuza: true,
      hintUgol: vopros(
        'Против какого угла лежит катет $AC$?',
        '$\\angle B = 30^\\circ$',
        ['$\\angle A = 60^\\circ$', '$\\angle C = 90^\\circ$'],
        num(p, 'k'),
        'Угол $A = 60^\\circ$, значит, $\\angle B = 30^\\circ$; катет $AC$ — против него.',
      ),
    }),
  proverka(p) {
    const k = num(p, 'k');
    /* A в начале, C = (k, 0), B на перпендикуляре в C под углом 60° от A. */
    const B = pere([0, 0], pol(60), [k, 0], [0, 1]);
    return izmereno(dl([0, 0], B));
  },
  risunok: (p) =>
    risPryamougolnyy({
      ugolA: 60,
      vneshniy: 'A',
      dano: ['A', 'C', num(p, 'k')],
      iskomoe: ['A', 'B'],
    }),
});

const P10 = prototip({
  id: 'P10',
  gruppa: '1C',
  title: 'Внешний угол $120^\\circ$ при $B$: гипотенуза → катет $BC$',
  kluchi: ['k'],
  text: (p) =>
    `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = ${num(p, 'k')}$. Внешний угол при вершине $B$ равен $120^\\circ$. Найдите $BC$.`,
  solve: (p) =>
    katet30({
      ugolStupen: {
        title: 'Углы $B$ и $A$',
        lines: [
          'Внешний и внутренний углы при $B$ смежные: $\\angle B = 180^\\circ - 120^\\circ = 60^\\circ$.',
          '$\\angle A = 90^\\circ - 60^\\circ = 30^\\circ$.',
        ],
      },
      kakoyKatet: '$BC$',
      protiv: '\\angle A',
      dano: 'AB',
      danoZn: num(p, 'k'),
      iskomoe: 'BC',
      gipotenuza: false,
      hintUgol: vopros(
        'Чему равен угол $A$?',
        '$30^\\circ$',
        ['$60^\\circ$', '$120^\\circ$'],
        num(p, 'k'),
        'Сначала $\\angle B = 60^\\circ$, затем $\\angle A = 90^\\circ - 60^\\circ$.',
      ),
    }),
  proverka(p) {
    const k = num(p, 'k');
    /* B в начале, BA под углом 60° к BC: проекция AB на BC. */
    return izmereno(pol(60, k)[0]);
  },
  risunok: (p) =>
    risPryamougolnyy({
      ugolA: 30,
      vneshniy: 'B',
      dano: ['A', 'B', num(p, 'k')],
      iskomoe: ['B', 'C'],
    }),
});

/* ── Равнобедренный с углами 30°, 30°, 120° ───────────────────── */

/** Ответ через треугольник 30–60–90: BK = AB/2 в равнобедренном с углом 120°. */
function proverka30(polovina: boolean, k: number): string {
  /* A = (0, 0), C = (2, 0), B = (1, tg 30°): углы 30°, 30°, 120°. */
  const A: V = [0, 0];
  const B: V = [1, Math.tan(30 * RAD)];
  const K: V = [1, 0];
  const otn = dl(B, K) / dl(A, B);
  return izmereno(polovina ? k * otn : k / otn);
}

const P11 = prototip({
  id: 'P11',
  gruppa: '1D',
  title: 'Внешний угол $150^\\circ$ при основании, медиана → боковая сторона',
  kluchi: ['k'],
  text: (p) =>
    `В равнобедренном треугольнике $ABC$ внешний угол при основании равен $150^\\circ$, а медиана $BM$, проведённая к основанию, равна $${num(p, 'k')}$. Найдите боковую сторону треугольника $ABC$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(2 * k, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол при основании',
          lines: [
            'Угол при основании и внешний угол при той же вершине смежные: $180^\\circ - 150^\\circ = 30^\\circ$. Значит, $\\angle A = 30^\\circ$.',
          ],
        },
        {
          title: 'Медиана — высота',
          lines: [
            'В равнобедренном треугольнике медиана $BM$, проведённая к основанию, — ещё и высота. Треугольник $ABM$ прямоугольный, $AB$ — его гипотенуза.',
          ],
        },
        {
          title: 'Катет против угла $30^\\circ$',
          lines: [
            'Катет $BM$ лежит против угла $A = 30^\\circ$ и равен половине гипотенузы $AB$.',
            `$AB = 2\\cdot BM = 2\\cdot ${k} = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros('Чему равен угол при основании?', '$30^\\circ$', ['$150^\\circ$', '$75^\\circ$'], k),
        vopros(
          'Чем ещё является медиана $BM$?',
          'Высотой',
          ['Средней линией', 'Боковой стороной'],
          k + 1,
          'Медиана к основанию равнобедренного треугольника — и высота, и биссектриса.',
        ),
        vopros(
          'Как связаны $BM$ и $AB$?',
          '$AB = 2\\cdot BM$',
          ['$AB = BM$', '$BM = 2\\cdot AB$'],
          k + 2,
          'Катет против угла $30^\\circ$ — половина гипотенузы.',
        ),
      ],
    };
  },
  proverka: (p) => proverka30(false, num(p, 'k')),
  risunok: (p, bukvy) =>
    risRavnobedrennyy30({
      seredina: 'M',
      vid: 'mediana',
      vneshnie: ['C'],
      dano: ['B', 'M', num(p, 'k')],
      iskomoe: ['A', 'B'],
      ravnyeStorony: true,
      alt: `Равнобедренный треугольник ${bukvy.slice(0, 3).join('')} с медианой BM`,
    }),
});

const P12 = prototip({
  id: 'P12',
  gruppa: '1D',
  title: '$AB = BC$, внешний угол $150^\\circ$ при $C$ → медиана $BK$',
  kluchi: ['k'],
  text: (p) =>
    `В треугольнике $ABC$ известно, что $AB = BC = ${num(p, 'k')}$, внешний угол при вершине $C$ равен $150^\\circ$. Найдите длину медианы $BK$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(k, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $C$',
          lines: [
            'Внешний и внутренний углы при $C$ смежные: $\\angle C = 180^\\circ - 150^\\circ = 30^\\circ$.',
          ],
        },
        {
          title: 'Медиана — высота',
          lines: [
            '$AB = BC$, поэтому треугольник равнобедренный с основанием $AC$, и медиана $BK$ — ещё и высота. Треугольник $BKC$ прямоугольный с гипотенузой $BC$.',
          ],
        },
        {
          title: 'Катет против угла $30^\\circ$',
          lines: [
            `$BK$ лежит против угла $C = 30^\\circ$: $BK = BC : 2 = ${k} : 2 = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros('Чему равен угол $C$?', '$30^\\circ$', ['$150^\\circ$', '$60^\\circ$'], k),
        vopros(
          'Как найти $BK$ в прямоугольном треугольнике $BKC$?',
          '$BK = BC : 2$',
          ['$BK = BC$', '$BK = 2\\cdot BC$'],
          k + 1,
          'Катет против угла $30^\\circ$ — половина гипотенузы.',
        ),
      ],
    };
  },
  proverka: (p) => proverka30(true, num(p, 'k')),
  risunok: (p) =>
    risRavnobedrennyy30({
      seredina: 'K',
      vid: 'mediana',
      vneshnie: ['C'],
      dano: ['A', 'B', num(p, 'k')],
      iskomoe: ['B', 'K'],
      ravnyeStorony: true,
      alt: 'Треугольник ABC, AB = BC, медиана BK',
    }),
});

const P13 = prototip({
  id: 'P13',
  gruppa: '1D',
  title: 'Внешние углы $150^\\circ$ при $A$ и $C$ → биссектриса $BK$',
  kluchi: ['k'],
  text: (p) =>
    `В треугольнике $ABC$ внешние углы при вершинах $A$ и $C$ равны $150^\\circ$, $AB = ${num(p, 'k')}$. Найдите длину биссектрисы $BK$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(k, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Углы $A$ и $C$',
          lines: [
            '$\\angle A = \\angle C = 180^\\circ - 150^\\circ = 30^\\circ$. Углы при $A$ и $C$ равны, значит, треугольник равнобедренный: $AB = BC$.',
          ],
        },
        {
          title: 'Биссектриса — высота',
          lines: [
            'Биссектриса $BK$, проведённая к основанию равнобедренного треугольника, — ещё и высота. Треугольник $ABK$ прямоугольный с гипотенузой $AB$.',
          ],
        },
        {
          title: 'Катет против угла $30^\\circ$',
          lines: [
            `$BK$ лежит против угла $A = 30^\\circ$: $BK = AB : 2 = ${k} : 2 = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros('Чему равен угол $A$?', '$30^\\circ$', ['$150^\\circ$', '$120^\\circ$'], k),
        vopros(
          'Каким ещё отрезком будет биссектриса $BK$?',
          'Высотой',
          ['Средней линией', 'Стороной $AC$'],
          k + 1,
          'Треугольник равнобедренный ($\\angle A = \\angle C$), $BK$ проведена к основанию.',
        ),
      ],
    };
  },
  proverka: (p) => proverka30(true, num(p, 'k')),
  risunok: (p) =>
    risRavnobedrennyy30({
      seredina: 'K',
      vid: 'bissektrisa',
      vneshnie: ['A', 'C'],
      dano: ['A', 'B', num(p, 'k')],
      iskomoe: ['B', 'K'],
      ravnyeStorony: false,
      alt: 'Треугольник ABC с внешними углами при A и C и биссектрисой BK',
    }),
});

const P14 = prototip({
  id: 'P14',
  gruppa: '1D',
  title: 'Угол $120^\\circ$ при вершине, высота $BK$ → боковая сторона',
  kluchi: ['k'],
  text: (p) =>
    `В равнобедренном треугольнике $ABC$ угол $ABC$ равен $120^\\circ$. Высота $BK$, проведённая к основанию $AC$, равна $${num(p, 'k')}$. Найдите длину стороны $AB$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(2 * k, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Углы при основании',
          lines: [
            'Углы при основании $AC$ равны: $\\angle A = \\angle C = (180^\\circ - 120^\\circ) : 2 = 30^\\circ$.',
          ],
        },
        {
          title: 'Прямоугольный треугольник $ABK$',
          lines: [
            '$BK$ — высота, треугольник $ABK$ прямоугольный, $AB$ — гипотенуза, катет $BK$ лежит против угла $A = 30^\\circ$.',
            `$AB = 2\\cdot BK = 2\\cdot ${k} = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros('Чему равен угол $A$?', '$30^\\circ$', ['$60^\\circ$', '$120^\\circ$'], k),
        vopros(
          'Как связаны $BK$ и $AB$?',
          '$AB = 2\\cdot BK$',
          ['$AB = BK$', '$BK = 2\\cdot AB$'],
          k + 1,
          'Катет против угла $30^\\circ$ — половина гипотенузы.',
        ),
      ],
    };
  },
  proverka: (p) => proverka30(false, num(p, 'k')),
  risunok: (p) =>
    risRavnobedrennyy30({
      seredina: 'K',
      vid: 'vysota',
      vneshnie: [],
      ugolB: true,
      dano: ['B', 'K', num(p, 'k')],
      iskomoe: ['A', 'B'],
      ravnyeStorony: true,
      alt: 'Равнобедренный треугольник ABC с углом 120° и высотой BK',
    }),
});

const P15 = prototip({
  id: 'P15',
  gruppa: '1D',
  title: 'Угол $B = 120^\\circ$, медиана $BM$ — биссектриса → $AB$',
  kluchi: ['k'],
  text: (p) =>
    `В треугольнике $ABC$ угол $B$ равен $120^\\circ$. Медиана $BM$ делит угол $B$ пополам и равна $${num(p, 'k')}$. Найдите длину стороны $AB$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(2 * k, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Треугольник равнобедренный',
          lines: [
            'Медиана $BM$ — ещё и биссектриса. Так бывает только в равнобедренном треугольнике: $AB = BC$, и $BM$ — ещё и высота.',
          ],
        },
        {
          title: 'Угол $A$',
          lines: ['$\\angle A = \\angle C = (180^\\circ - 120^\\circ) : 2 = 30^\\circ$.'],
        },
        {
          title: 'Катет против угла $30^\\circ$',
          lines: [
            'В прямоугольном треугольнике $ABM$ катет $BM$ лежит против угла $30^\\circ$ и равен половине гипотенузы $AB$.',
            `$AB = 2\\cdot BM = 2\\cdot ${k} = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Каким получается треугольник $ABC$?',
          'Равнобедренным: $AB = BC$',
          ['Прямоугольным', 'Равносторонним'],
          k,
          'Если медиана совпадает с биссектрисой, треугольник равнобедренный.',
        ),
        vopros('Чему равен угол $A$?', '$30^\\circ$', ['$60^\\circ$', '$120^\\circ$'], k + 1),
      ],
    };
  },
  proverka: (p) => proverka30(false, num(p, 'k')),
  risunok: (p) =>
    risRavnobedrennyy30({
      seredina: 'M',
      vid: 'mediana-bissektrisa',
      vneshnie: [],
      ugolB: true,
      dano: ['B', 'M', num(p, 'k')],
      iskomoe: ['A', 'B'],
      ravnyeStorony: false,
      alt: 'Треугольник ABC с углом 120° и медианой-биссектрисой BM',
    }),
});

const P16 = prototip({
  id: 'P16',
  gruppa: '1D',
  title: '$AB = BC$, угол $120^\\circ$ → биссектриса $BK$',
  kluchi: ['k'],
  text: (p) =>
    `В треугольнике $ABC$ известно, что $AB = BC = ${num(p, 'k')}$, $\\angle ABC = 120^\\circ$, $BK$ — биссектриса. Найдите длину отрезка $BK$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(k, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $A$',
          lines: [
            'Треугольник равнобедренный с основанием $AC$: $\\angle A = \\angle C = (180^\\circ - 120^\\circ) : 2 = 30^\\circ$.',
          ],
        },
        {
          title: 'Биссектриса — высота',
          lines: [
            'Биссектриса $BK$ к основанию равнобедренного треугольника — ещё и высота: треугольник $ABK$ прямоугольный с гипотенузой $AB$.',
          ],
        },
        {
          title: 'Катет против угла $30^\\circ$',
          lines: [`$BK = AB : 2 = ${k} : 2 = ${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros('Чему равен угол $A$?', '$30^\\circ$', ['$60^\\circ$', '$120^\\circ$'], k),
        vopros(
          'Как найти $BK$?',
          '$BK = AB : 2$',
          ['$BK = AB$', '$BK = 2\\cdot AB$'],
          k + 1,
          '$BK$ — катет против угла $30^\\circ$ в треугольнике $ABK$.',
        ),
      ],
    };
  },
  proverka: (p) => proverka30(true, num(p, 'k')),
  risunok: (p) =>
    risRavnobedrennyy30({
      seredina: 'K',
      vid: 'bissektrisa',
      vneshnie: [],
      ugolB: true,
      dano: ['A', 'B', num(p, 'k')],
      iskomoe: ['B', 'K'],
      ravnyeStorony: true,
      alt: 'Равнобедренный треугольник ABC с углом 120° и биссектрисой BK',
    }),
});

const P17 = prototip({
  id: 'P17',
  gruppa: '1D',
  title: 'Высота $BK$ и середина $P$ стороны $BC$ → $KP$',
  kluchi: ['c', 'h'],
  text: (p) =>
    `В равнобедренном треугольнике $ABC$ основание $AC = ${num(p, 'c')}$, высота $BK$, проведённая к основанию, равна $${num(p, 'h')}$. Точка $P$ — середина стороны $BC$. Найдите длину отрезка $KP$.`,
  solve(p) {
    const c = num(p, 'c');
    const h = num(p, 'h');
    const kc = c / 2;
    const bc = Math.round(Math.sqrt(kc * kc + h * h));
    if (bc * bc !== kc * kc + h * h) throw new Error('BC не целое');
    const otvet = zapis(bc, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Отрезок $KC$',
          lines: [
            `Высота к основанию равнобедренного треугольника — ещё и медиана: $KC = ${c} : 2 = ${kc}$.`,
          ],
        },
        {
          title: 'Сторона $BC$',
          lines: [
            'Треугольник $BKC$ прямоугольный, по теореме Пифагора:',
            `$BC = \\sqrt{${kc}^2 + ${h}^2} = \\sqrt{${kc * kc + h * h}} = ${bc}$.`,
          ],
        },
        {
          title: 'Медиана к гипотенузе',
          lines: [
            '$KP$ — медиана прямоугольного треугольника $BKC$, проведённая к гипотенузе. Она равна половине гипотенузы.',
            `$KP = ${bc} : 2 = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равна сторона $BC$?',
          $(String(bc)),
          [$(String(kc + h)), $(String(Math.round(Math.sqrt(c * c + h * h))))],
          c,
          `Теорема Пифагора в треугольнике $BKC$ с катетами $${kc}$ и $${h}$.`,
        ),
        vopros(
          'Чему равна медиана, проведённая к гипотенузе?',
          'Половине гипотенузы',
          ['Гипотенузе', 'Меньшему катету'],
          h,
        ),
      ],
    };
  },
  proverka(p) {
    const c = num(p, 'c');
    const h = num(p, 'h');
    const P: V = [(c / 2 + c) / 2, h / 2];
    return izmereno(dl([c / 2, 0], P));
  },
  risunok: (p) => risSeredinaBC(num(p, 'c'), num(p, 'h')),
});

/* ── III. Четырёхугольники ─────────────────────────────────────── */

const P18 = prototip({
  id: 'P18',
  gruppa: '1E',
  title: 'Дельтоид: углы $B$ и $D$ → угол $A$',
  kluchi: ['b', 'd'],
  text: (p) =>
    `В выпуклом четырёхугольнике $ABCD$ известно, что $AB = BC$, $AD = CD$, $\\angle B = ${g(num(p, 'b'))}$, $\\angle D = ${g(num(p, 'd'))}$. Найдите угол $A$. ${VGRADUSAH}`,
  solve(p) {
    const b = num(p, 'b');
    const d = num(p, 'd');
    const ost = 360 - b - d;
    const otvet = zapis(ost, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Углы $A$ и $C$ равны',
          lines: [
            'Треугольники $ABD$ и $CBD$ равны по трём сторонам: $AB = CB$, $AD = CD$, $BD$ — общая. Значит, $\\angle A = \\angle C$.',
          ],
        },
        {
          title: 'Сумма углов четырёхугольника',
          lines: [
            `$\\angle A + \\angle C = 360^\\circ - ${g(b)} - ${g(d)} = ${g(ost)}$.`,
            `$\\angle A = ${g(ost)} : 2 = ${g(ost, 2)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Какие углы четырёхугольника равны?',
          '$\\angle A$ и $\\angle C$',
          ['$\\angle A$ и $\\angle B$', '$\\angle B$ и $\\angle D$'],
          b,
          'Диагональ $BD$ делит четырёхугольник на два равных треугольника.',
        ),
        vopros(
          'Чему равна сумма углов выпуклого четырёхугольника?',
          '$360^\\circ$',
          ['$180^\\circ$', '$540^\\circ$'],
          d,
        ),
      ],
    };
  },
  proverka(p) {
    const b = num(p, 'b');
    const d = num(p, 'd');
    const B: V = [0, 0];
    const D: V = [1, 0];
    const C = pere(B, pol(b / 2), D, pol(180 - d / 2));
    const A: V = [C[0], -C[1]];
    return izmereno(ugol(B, A, D));
  },
  risunok: (p) => risDeltoid(num(p, 'b'), num(p, 'd')),
});

const P19 = prototip({
  id: 'P19',
  gruppa: '1E',
  title: 'Параллелограмм, $AC = 2AB$: угол $ACD$ → угол между диагоналями',
  kluchi: ['x'],
  text: (p) =>
    `В параллелограмме $ABCD$ диагональ $AC$ в два раза больше стороны $AB$ и $\\angle ACD = ${g(num(p, 'x'))}$. Найдите угол между диагоналями параллелограмма. ${VGRADUSAH}`,
  solve(p) {
    const x = num(p, 'x');
    const otvet = zapis(180 - x, 2);
    return {
      otvet,
      etapy: [
        {
          title: 'Треугольник $ABO$',
          lines: [
            'Пусть $O$ — точка пересечения диагоналей. Диагонали параллелограмма делятся ею пополам: $AO = AC : 2 = AB$.',
            'Треугольник $ABO$ равнобедренный: $AB = AO$, углы при основании $BO$ равны.',
          ],
        },
        {
          title: 'Угол $BAO$',
          lines: [
            `$AB \\parallel CD$, $AC$ — секущая, поэтому накрест лежащие углы равны: $\\angle BAO = \\angle ACD = ${g(x)}$.`,
          ],
        },
        {
          title: 'Угол между диагоналями',
          lines: [
            `$\\angle AOB = (180^\\circ - ${g(x)}) : 2 = ${g(180 - x, 2)}$.`,
            `Это острый угол между диагоналями, ответ: $${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен $AO$, если $O$ — точка пересечения диагоналей?',
          '$AB$',
          ['$AC$', '$2\\cdot AB$'],
          x,
          'Диагонали делятся точкой пересечения пополам, а $AC = 2\\cdot AB$.',
        ),
        vopros(
          'Чему равен угол $BAC$?',
          $(g(x)),
          [$(g(180 - x)), $(g(x, 2))],
          x + 1,
          'Он и угол $ACD$ — накрест лежащие при $AB \\parallel CD$.',
        ),
      ],
    };
  },
  proverka(p) {
    const x = num(p, 'x');
    /* A = 0, C = (2, 0), |AB| = 1: угол θ подбирается так, чтобы ∠ACD = x. */
    const pg = (th: number) => {
      const B = pol(th);
      const D: V = [2 - B[0], -B[1]];
      return { B, D };
    };
    const th = koren((s) => ugol([0, 0], [2, 0], pg(s).D) - x, 0.001, 179.999);
    const u = ugol(pg(th).B, [1, 0], [0, 0]);
    return izmereno(Math.min(u, 180 - u));
  },
  risunok: (p) => risParallelogrammDiagonal(num(p, 'x')),
});

const P20 = prototip({
  id: 'P20',
  gruppa: '1E',
  title: 'Параллелограмм: биссектриса угла $A$ → отрезок $KC$',
  kluchi: ['a', 'per'],
  text: (p) =>
    `В параллелограмме $ABCD$ проведена биссектриса угла $A$, пересекающая сторону $BC$ в точке $K$. Найдите $KC$, если $AB = ${num(p, 'a')}$, а периметр параллелограмма равен $${num(p, 'per')}$.`,
  solve(p) {
    const a = num(p, 'a');
    const per = num(p, 'per');
    const bc = per / 2 - a;
    const otvet = zapis(bc - a, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Треугольник $ABK$',
          lines: [
            '$\\angle BKA = \\angle KAD$ как накрест лежащие при $BC \\parallel AD$, а $\\angle KAD = \\angle BAK$, ведь $AK$ — биссектриса.',
            `Значит, $\\angle BKA = \\angle BAK$, треугольник $ABK$ равнобедренный: $BK = AB = ${a}$.`,
          ],
        },
        {
          title: 'Сторона $BC$',
          lines: [`$AB + BC$ — половина периметра: $BC = ${per} : 2 - ${a} = ${bc}$.`],
        },
        {
          title: 'Отрезок $KC$',
          lines: [`$KC = BC - BK = ${bc} - ${a} = ${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен $BK$?',
          $(String(a)),
          [$(String(bc)), $(String(per / 2))],
          a,
          'Биссектриса отсекает от параллелограмма равнобедренный треугольник $ABK$.',
        ),
        vopros(
          'Чему равна сторона $BC$?',
          $(String(bc)),
          [$(String(per - a)), $(String(per / 4))],
          per,
          'Сумма соседних сторон — половина периметра.',
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const per = num(p, 'per');
    const bc = per / 2 - a;
    /* Угол A = 70°: точка K — пересечение биссектрисы с прямой BC. */
    const B = pol(70, a);
    const C: V = [B[0] + bc, B[1]];
    const K = pere([0, 0], pol(35), B, [1, 0]);
    return izmereno(dl(K, C));
  },
  risunok: (p) => risBissektrisaParallelogramma(num(p, 'a'), num(p, 'per') / 2 - num(p, 'a')),
});

const P21 = prototip({
  id: 'P21',
  gruppa: '1E',
  title: 'Равнобедренная трапеция: углы $BDA$ и $BDC$ → угол $ABD$',
  kluchi: ['a', 'b'],
  text: (p) =>
    `В трапеции $ABCD$ известно, что $AB = CD$, $\\angle BDA = ${g(num(p, 'a'))}$ и $\\angle BDC = ${g(num(p, 'b'))}$. Найдите угол $ABD$. ${VGRADUSAH}`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const d = a + b;
    const otvet = zapis(180 - d - a, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Угол $D$ трапеции',
          lines: [`$\\angle ADC = \\angle BDA + \\angle BDC = ${g(a)} + ${g(b)} = ${g(d)}$.`],
        },
        {
          title: 'Угол $A$',
          lines: [
            `$AB = CD$ — трапеция равнобедренная, углы при основании $AD$ равны: $\\angle BAD = ${g(d)}$.`,
          ],
        },
        {
          title: 'Треугольник $ABD$',
          lines: [`$\\angle ABD = 180^\\circ - ${g(d)} - ${g(a)} = ${g(180 - d - a)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $BAD$?',
          $(g(d)),
          [$(g(a)), $(g(180 - d))],
          a,
          'В равнобедренной трапеции углы при основании равны: $\\angle BAD = \\angle CDA$.',
        ),
        vopros(
          'Из какого треугольника найти угол $ABD$?',
          '$ABD$',
          ['$BCD$', '$ACD$'],
          b,
          'В треугольнике $ABD$ известны два угла: $\\angle BAD$ и $\\angle BDA$.',
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    /* D в начале, DA — влево по оси x; B и C — на прямой y = 1. */
    const D: V = [0, 0];
    const B = pere(D, pol(180 - a), [0, 1], [1, 0]);
    const C = pere(D, pol(180 - a - b), [0, 1], [1, 0]);
    /* A на оси x так, что AB = CD и AB не параллельна CD. */
    const cd = dl(C, D);
    const dx = Math.sqrt(cd * cd - 1);
    const kandidaty: V[] = [
      [B[0] - dx, 0],
      [B[0] + dx, 0],
    ];
    const A = kandidaty.find((q) => Math.abs(q[0] - B[0] - (D[0] - C[0])) > 1e-6) ?? kandidaty[0]!;
    return izmereno(ugol(A, B, D));
  },
  risunok: (p) => risTrapeciya(num(p, 'a'), num(p, 'b')),
});

const P22 = prototip({
  id: 'P22',
  gruppa: '1E',
  title: 'Прямоугольная трапеция с углом $135^\\circ$ → меньшая боковая сторона',
  kluchi: ['a', 'b'],
  text: (p) =>
    `В прямоугольной трапеции основания равны $${num(p, 'a')}$ и $${num(p, 'b')}$, а один из углов равен $135^\\circ$. Найдите меньшую боковую сторону.`,
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const otvet = zapis(b - a, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Углы трапеции',
          lines: [
            'У прямоугольной трапеции два прямых угла при меньшей боковой стороне. Угол $135^\\circ$ — тупой угол при наклонной стороне.',
            'Второй угол при наклонной стороне: $180^\\circ - 135^\\circ = 45^\\circ$.',
          ],
        },
        {
          title: 'Высота',
          lines: [
            'Опустим высоту из вершины тупого угла на большее основание. Она отсечёт прямоугольный треугольник с углом $45^\\circ$ — равнобедренный.',
            `Его катет на большем основании: $${b} - ${a} = ${b - a}$, значит, и высота равна $${b - a}$.`,
          ],
        },
        {
          title: 'Меньшая боковая сторона',
          lines: [`Меньшая боковая сторона равна высоте: $${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равен острый угол трапеции?',
          '$45^\\circ$',
          ['$35^\\circ$', '$135^\\circ$'],
          a,
          'Углы при боковой стороне трапеции в сумме дают $180^\\circ$.',
        ),
        vopros(
          'Чему равна высота трапеции?',
          $(String(b - a)),
          [$(String(a + b)), $(String(b))],
          b,
          'Треугольник с углом $45^\\circ$ — равнобедренный: высота равна разности оснований.',
        ),
      ],
    };
  },
  proverka(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    /* Высота h подбирается так, чтобы тупой угол трапеции был 135°. */
    const h = koren((s) => ugol([0, s], [a, s], [b, 0]) - 135, 1e-6, 1000);
    return izmereno(h);
  },
  risunok: (p) => risPryamougolnayaTrapeciya(num(p, 'a'), num(p, 'b')),
});

const P23 = prototip({
  id: 'P23',
  gruppa: '1E',
  title: 'Диагонали перпендикулярны, $\\angle A + \\angle C = 120^\\circ$ → $BD$',
  kluchi: ['k'],
  text: (p) =>
    `В параллелограмме $ABCD$ диагонали перпендикулярны. Сумма углов $A$ и $C$ равна $120^\\circ$, $AB = ${num(p, 'k')}$. Найдите $BD$.`,
  solve(p) {
    const k = num(p, 'k');
    const otvet = zapis(k, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Ромб',
          lines: ['Параллелограмм с перпендикулярными диагоналями — ромб: $AB = AD$.'],
        },
        {
          title: 'Угол $A$',
          lines: [
            'Противоположные углы параллелограмма равны: $\\angle A = \\angle C = 120^\\circ : 2 = 60^\\circ$.',
          ],
        },
        {
          title: 'Треугольник $ABD$',
          lines: [
            'В треугольнике $ABD$ $AB = AD$ и угол между ними $60^\\circ$ — он равносторонний.',
            `$BD = AB = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен угол $A$?',
          '$60^\\circ$',
          ['$120^\\circ$', '$30^\\circ$'],
          k,
          'Углы $A$ и $C$ противоположные, они равны.',
        ),
        vopros(
          'Каким получается треугольник $ABD$?',
          'Равносторонним',
          ['Прямоугольным', 'Тупоугольным'],
          k + 1,
          'Ромб: $AB = AD$, а угол между ними $60^\\circ$.',
        ),
      ],
    };
  },
  proverka(p) {
    const k = num(p, 'k');
    /* Ромб: AD = AB = k, угол A = 60°. */
    return izmereno(dl(pol(60, k), [k, 0]));
  },
  risunok: (p) => risRombDiagonali(num(p, 'k')),
});

/** Угол ромба, из которого видна меньшая диагональ, и почему он 60°. */
function ugolRomba(s: number): string[] {
  return s < 180
    ? [
        `Соседние углы ромба дают в сумме $180^\\circ$, значит, углы с суммой $${g(s)}$ — противоположные и равны: каждый $${g(s)} : 2 = 60^\\circ$.`,
      ]
    : [
        `Соседние углы ромба дают в сумме $180^\\circ$, значит, углы с суммой $${g(s)}$ — противоположные: каждый $${g(s)} : 2 = 120^\\circ$, а острый угол ромба $180^\\circ - 120^\\circ = 60^\\circ$.`,
      ];
}

const P24 = prototip({
  id: 'P24',
  gruppa: '1E',
  title: 'Ромб с углом $60^\\circ$: меньшая диагональ → периметр',
  kluchi: ['s', 'd'],
  text: (p) =>
    `Сумма двух углов ромба равна $${g(num(p, 's'))}$, а его меньшая диагональ равна $${num(p, 'd')}$. Найдите периметр ромба.`,
  solve(p) {
    const s = num(p, 's');
    const d = num(p, 'd');
    const otvet = zapis(4 * d, 1);
    return {
      otvet,
      etapy: [
        { title: 'Острый угол ромба', lines: ugolRomba(s) },
        {
          title: 'Сторона ромба',
          lines: [
            'Меньшая диагональ отсекает от ромба треугольник с двумя сторонами ромба и углом $60^\\circ$ между ними. Он равносторонний: сторона ромба равна меньшей диагонали.',
            `Сторона $= ${d}$.`,
          ],
        },
        { title: 'Периметр', lines: [`$P = 4\\cdot ${d} = ${tex(otvet)}$.`] },
      ],
      hints: [
        vopros(
          'Чему равен острый угол ромба?',
          '$60^\\circ$',
          [$(g(s)), '$30^\\circ$'],
          d,
          'Углы с данной суммой — противоположные, они равны.',
        ),
        vopros(
          'Чему равна сторона ромба?',
          $(String(d)),
          [$(String(2 * d)), $(t(d, 2))],
          d + 1,
          'Треугольник из двух сторон и меньшей диагонали — равносторонний.',
        ),
      ],
    };
  },
  proverka(p) {
    const s = num(p, 's');
    const d = num(p, 'd');
    const ostryy = s < 180 ? s / 2 : 180 - s / 2;
    /* Меньшая диагональ = 2·x·sin(острый/2) — сторона x отсюда. */
    const x = d / (2 * Math.sin((ostryy / 2) * RAD));
    return izmereno(4 * x);
  },
  risunok: (p) => risRomb(num(p, 's'), num(p, 'd')),
});

const P25 = prototip({
  id: 'P25',
  gruppa: '1E',
  title: 'Ромб с углом $60^\\circ$: периметр → меньшая диагональ',
  kluchi: ['s', 'per'],
  text: (p) =>
    `Сумма двух углов ромба равна $${g(num(p, 's'))}$, а его периметр равен $${num(p, 'per')}$. Найдите длину меньшей диагонали ромба.`,
  solve(p) {
    const s = num(p, 's');
    const per = num(p, 'per');
    const otvet = zapis(per, 4);
    return {
      otvet,
      etapy: [
        { title: 'Острый угол ромба', lines: ugolRomba(s) },
        {
          title: 'Сторона ромба',
          lines: [`Все четыре стороны равны: $${per} : 4 = ${t(per, 4)}$.`],
        },
        {
          title: 'Меньшая диагональ',
          lines: [
            'Меньшая диагональ и две стороны с углом $60^\\circ$ между ними образуют равносторонний треугольник.',
            `Меньшая диагональ равна стороне: $${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros('Чему равна сторона ромба?', $(t(per, 4)), [$(t(per, 2)), $(String(per))], per),
        vopros(
          'Как связаны меньшая диагональ и сторона?',
          'Равны',
          ['Диагональ вдвое больше', 'Диагональ вдвое меньше'],
          per + 1,
          'Острый угол ромба $60^\\circ$, треугольник со стороной-диагональю равносторонний.',
        ),
      ],
    };
  },
  proverka(p) {
    const s = num(p, 's');
    const x = num(p, 'per') / 4;
    const ostryy = s < 180 ? s / 2 : 180 - s / 2;
    return izmereno(dl(pol(0, x), pol(ostryy, x)));
  },
  risunok: (p) => risRomb(num(p, 's'), null),
});

export const PROTOTIPY_12_1: Prototip[] = [
  P01,
  P02,
  P03,
  P04,
  P05,
  P06,
  P07,
  P08,
  P09,
  P10,
  P11,
  P12,
  P13,
  P14,
  P15,
  P16,
  P17,
  P18,
  P19,
  P20,
  P21,
  P22,
  P23,
  P24,
  P25,
];
