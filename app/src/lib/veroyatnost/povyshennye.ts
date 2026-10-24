/**
 * Шаблоны раздела «Варианты повышенной сложности» для заданий №4 и №5.
 *
 * Прототипы того же устройства, что банк раздела (types.ts, `Prototype`):
 * условие, допустимость, ответ формулой и вторым путём (перебор), шаги
 * с этапами из общего словаря и подсказки-вопросы. В BANK_4 и BANK_5
 * они не входят — в тренажёр и генератор раздела не попадают; чисел
 * своих у них нет (`varianty` пусто): числа задаёт вариант.
 */

import { shagP } from './bank4/vizual';
import { shtuk, tex, tochnee, tochno, veroyatnost } from './bank5/obshchee';
import { vopros, zapisShag } from './podskazka';
import { dec, konechnaya, num, text, type Params, type Prototype } from './types';

/** x·base — целое (с допуском: 0,58·100 в плавающей запятой не ровно 58). */
const celoeProtsentov = (x: number, base: number) =>
  Math.abs(x * base - Math.round(x * base)) < 1e-9;

/* ── №4. Вложенные события «не менее a» и «не менее b» ───────────── */

/** a, a + 1, …, b − 1 словами: «7, 8 или 9». */
function perechen(a: number, b: number): string {
  const xs = Array.from({ length: b - a }, (_, i) => String(a + i));
  return xs.length === 1 ? xs[0]! : `${xs.slice(0, -1).join(', ')} или ${xs.at(-1)}`;
}

const otvetNeMenee = (p: Params) => tochnee(veroyatnost(p, 'p1') - veroyatnost(p, 'p2'));

/**
 * Лучник делает N выстрелов: «не менее a попаданий» — p1, «не менее b»
 * — p2. Найти вероятность a, a + 1, …, b − 1 попаданий. Подвох — понять,
 * что второе событие вложено в первое и искомое — их разность.
 */
export const PV4_NE_MENEE: Prototype = {
  id: 'pv4-ne-menee',
  blok: 'povyshennye',
  nazvanie: 'Вложенные события «не менее a» и «не менее b»: разность',
  tip: 'Промежутки на числовой прямой',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    return `${text(p, 'kto')} на тренировке делает ${N} выстрелов из лука. Вероятность того, что в «десятку» попадут не меньше ${a} стрел, равна ${dec(veroyatnost(p, 'p1'))}, а вероятность того, что попадут не меньше ${b} стрел, равна ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что в «десятку» попадут ровно ${perechen(a, b)} стрел.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const o = otvetNeMenee(p);
    return (
      a >= 2 &&
      a < b &&
      b <= N &&
      p2 > 0 &&
      p1 < 1 &&
      p1 > p2 &&
      celoeProtsentov(p1, 100) &&
      celoeProtsentov(p2, 100) &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetNeMenee,
  /* Второй путь: сто серий выстрелов, считаем серии целыми числами. */
  perebor: (p) => (shtuk(veroyatnost(p, 'p1'), 100) - shtuk(veroyatnost(p, 'p2'), 100)) / 100,
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const A = shtuk(p1, 100);
    const B = shtuk(p2, 100);
    const m = A - B;
    return [
      {
        etap: 'Связь событий',
        text: `Событие «не меньше ${b} попаданий» входит в событие «не меньше ${a} попаданий». Ровно ${perechen(a, b)} попаданий — это первое событие без второго.`,
      },
      {
        etap: 'Количества',
        text: `Возьмём 100 тренировок. Не меньше ${a} попаданий бывает в ${A} из них, не меньше ${b} — в ${B}:`,
        formula: `100 \\cdot ${tex(p1)} = ${A},\\quad 100 \\cdot ${tex(p2)} = ${B}`,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Тренировки, где попаданий от ${a} до ${b - 1}, — это первые без вторых:`,
        formula: `m = ${A} - ${B} = ${m}`,
        value: m,
      },
      shagP(m, 100),
    ];
  },
  podskazka: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return [
      vopros(
        `Как связаны события «не меньше ${a}» и «не меньше ${b}» попаданий?`,
        'Второе входит в первое',
        ['Они несовместны', 'Они противоположны'],
        `Если попаданий не меньше ${b}, то их тем более не меньше ${a}.`,
      ),
      vopros(
        `Что такое «ровно ${perechen(a, b)}» через эти события?`,
        `«Не меньше ${a}», но не «не меньше ${b}»`,
        [`«Не меньше ${a}» и «не меньше ${b}» одновременно`, `Всё, кроме «не меньше ${b}»`],
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(p1)} - ${tex(p2)}$`,
        [`$${tex(p1)} + ${tex(p2)}$`, `$1 - ${tex(p2)}$`, `$${tex(p1)} \\cdot ${tex(p2)}$`],
        'Вероятность разности вложенных событий — разность вероятностей.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Две разные партии: «не менее 4 очков» ─────────────────────── */

/** Исходы одной партии: очки и вероятность. */
function ishody(w: number, d: number): [number, number][] {
  return [
    [3, w],
    [1, d],
    [0, tochnee(1 - w - d)],
  ];
}

function otvetOchki(p: Params): number {
  const w1 = veroyatnost(p, 'w1');
  const d1 = veroyatnost(p, 'd1');
  const w2 = veroyatnost(p, 'w2');
  const d2 = veroyatnost(p, 'd2');
  return tochnee(w1 * w2 + w1 * d2 + d1 * w2);
}

/**
 * Две партии в разных условиях (своя пара «победа/ничья» у каждой);
 * победа — 3 очка, ничья — 1. Найти вероятность набрать не меньше
 * 4 очков. Подвох — выбрать три подходящих пути и не забыть, что
 * вероятности у партий разные.
 */
export const PV5_DVE_PARTII: Prototype = {
  id: 'pv5-dve-partii',
  blok: 'povyshennye',
  nazvanie: 'Две партии с разными вероятностями: не меньше 4 очков',
  tip: 'Независимые события: перемножаем',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const kto = text(p, 'kto');
    const s = text(p, 'soper');
    return `В турнире по шахматам ${kto} играет с ${s} две партии: первую — белыми, вторую — чёрными. Играя белыми, ${kto} выигрывает с вероятностью ${dec(veroyatnost(p, 'w1'))}, а партия заканчивается вничью с вероятностью ${dec(veroyatnost(p, 'd1'))}. Играя чёрными, ${kto} выигрывает с вероятностью ${dec(veroyatnost(p, 'w2'))}, а ничья случается с вероятностью ${dec(veroyatnost(p, 'd2'))}. По правилам турнира за победу дают 3 очка, за ничью — 1 очко, за поражение — 0. Найдите вероятность того, что за две партии ${kto} наберёт не меньше 4 очков.`;
  },
  dopustimo: (p) => {
    const xs = ['w1', 'd1', 'w2', 'd2'].map((k) => veroyatnost(p, k));
    const o = otvetOchki(p);
    return (
      xs.every((x) => x > 0 && x < 1 && celoeProtsentov(x, 10)) &&
      xs[0]! + xs[1]! < 1 &&
      xs[2]! + xs[3]! < 1 &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetOchki,
  /* Второй путь: перебор всех девяти исходов двух партий. */
  perebor: (p) => {
    let s = 0;
    for (const [o1, q1] of ishody(veroyatnost(p, 'w1'), veroyatnost(p, 'd1'))) {
      for (const [o2, q2] of ishody(veroyatnost(p, 'w2'), veroyatnost(p, 'd2'))) {
        if (o1 + o2 >= 4) s += q1 * q2;
      }
    }
    return tochnee(s);
  },
  shagi: (p) => {
    const w1 = veroyatnost(p, 'w1');
    const d1 = veroyatnost(p, 'd1');
    const w2 = veroyatnost(p, 'w2');
    const d2 = veroyatnost(p, 'd2');
    const vv = tochnee(w1 * w2);
    const vn = tochnee(w1 * d2);
    const nv = tochnee(d1 * w2);
    return [
      {
        etap: 'Благоприятные исходы',
        text: 'Не меньше 4 очков дают три исхода двух партий: победа и победа (6 очков), победа и ничья, ничья и победа (по 4 очка). Ничья и ничья — только 2 очка, поражение в любой партии оставляет не больше 3 очков.',
      },
      {
        etap: 'Путь по дереву',
        text: 'Партии независимы: вдоль каждого пути вероятности перемножаются. У белых и у чёрных вероятности свои:',
        formula: `${tex(w1)} \\cdot ${tex(w2)} = ${tex(vv)},\\quad ${tex(w1)} \\cdot ${tex(d2)} = ${tex(vn)},\\quad ${tex(d1)} \\cdot ${tex(w2)} = ${tex(nv)}`,
      },
      {
        etap: 'Ответ',
        text: 'Пути несовместны — складываем:',
        formula: `P = ${tex(vv)} + ${tex(vn)} + ${tex(nv)} = ${tex(tochnee(vv + vn + nv))}`,
        value: tochnee(vv + vn + nv),
      },
    ];
  },
  podskazka: (p) => {
    const w1 = veroyatnost(p, 'w1');
    const d1 = veroyatnost(p, 'd1');
    const w2 = veroyatnost(p, 'w2');
    const d2 = veroyatnost(p, 'd2');
    return [
      vopros(
        'Какие исходы двух партий дают не меньше 4 очков?',
        'Победа-победа, победа-ничья, ничья-победа',
        ['Только победа-победа', 'Победа-победа и ничья-ничья'],
        'Победа — 3 очка, ничья — 1: подходят $3 + 3$, $3 + 1$ и $1 + 3$.',
      ),
      vopros(
        'Вероятность пути «победа белыми, ничья чёрными» равна…',
        `$${tex(w1)} \\cdot ${tex(d2)}$`,
        [`$${tex(w1)} \\cdot ${tex(d1)}$`, `$${tex(w1)} + ${tex(d2)}$`],
        'В каждой партии берём её собственную вероятность и перемножаем.',
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(w1)} \\cdot ${tex(w2)} + ${tex(w1)} \\cdot ${tex(d2)} + ${tex(d1)} \\cdot ${tex(w2)}$`,
        [
          `$${tex(w1)} \\cdot ${tex(w2)}$`,
          `$${tex(w1)} \\cdot ${tex(w2)} + ${tex(w1)} \\cdot ${tex(d2)}$`,
        ],
        'Вдоль пути — произведение, пути — складываем.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};
