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
import { skl } from './morfologia';
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

/** Слова про две игры: шахматные партии (вариант 1) или футбольные матчи. */
function igr(p: Params): { rod: string; odna: string; nezav: string; svoi: string; put: string } {
  return p['syuzhet'] === 'futbol'
    ? {
        rod: 'матчей',
        odna: 'игре',
        nezav: 'Матчи независимы',
        svoi: 'Дома и в гостях вероятности свои',
        put: 'победа дома, ничья в гостях',
      }
    : {
        rod: 'партий',
        odna: 'партии',
        nezav: 'Партии независимы',
        svoi: 'У белых и у чёрных вероятности свои',
        put: 'победа белыми, ничья чёрными',
      };
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
    if (p['syuzhet'] === 'futbol') {
      const k = text(p, 'kto');
      return `Футбольная команда «${k}» проводит два матча: первый — на своём поле, второй — в гостях. Дома «${k}» побеждает с вероятностью ${dec(veroyatnost(p, 'w1'))}, а играет вничью с вероятностью ${dec(veroyatnost(p, 'd1'))}. В гостях вероятность победы равна ${dec(veroyatnost(p, 'w2'))}, ничьей — ${dec(veroyatnost(p, 'd2'))}. За победу команда получает 3 очка, за ничью — 1, за поражение — 0. Найдите вероятность того, что за два матча «${k}» наберёт не меньше 4 очков.`;
    }
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
        text: `Не меньше 4 очков дают три исхода двух ${igr(p).rod}: победа и победа (6 очков), победа и ничья, ничья и победа (по 4 очка). Ничья и ничья — только 2 очка, поражение в любой ${igr(p).odna} оставляет не больше 3 очков.`,
      },
      {
        etap: 'Путь по дереву',
        text: `${igr(p).nezav}: вдоль каждого пути вероятности перемножаются. ${igr(p).svoi}:`,
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
        `Какие исходы двух ${igr(p).rod} дают не меньше 4 очков?`,
        'Победа-победа, победа-ничья, ничья-победа',
        ['Только победа-победа', 'Победа-победа и ничья-ничья'],
        'Победа — 3 очка, ничья — 1: подходят $3 + 3$, $3 + 1$ и $1 + 3$.',
      ),
      vopros(
        `Вероятность пути «${igr(p).put}» равна…`,
        `$${tex(w1)} \\cdot ${tex(d2)}$`,
        [`$${tex(w1)} \\cdot ${tex(d1)}$`, `$${tex(w1)} + ${tex(d2)}$`],
        `В каждой ${igr(p).odna} берём её собственную вероятность и перемножаем.`,
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

/* ── №4. «Больше a» и «больше b»: от a + 1 до b ──────────────────── */

const otvetBolshe = (p: Params) => tochnee(veroyatnost(p, 'p1') - veroyatnost(p, 'p2'));

/**
 * Как PV4_NE_MENEE, но границы строгие: «больше a» — p1, «больше b» —
 * p2 (b > a). Искомое — «от a + 1 до b» включительно. Подвох — строгие
 * неравенства: граница a в ответ не входит, а b входит.
 */
export const PV4_BOLSHE: Prototype = {
  id: 'pv4-bolshe',
  blok: 'povyshennye',
  nazvanie: 'Вложенные события «больше a» и «больше b»: разность',
  tip: 'Промежутки на числовой прямой',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const kogo = text(p, 'kogo');
    return `${text(p, 'gde')} Вероятность того, что ${text(p, 'chto')} окажется больше ${b} ${kogo}, равна ${dec(veroyatnost(p, 'p2'))}. Вероятность того, что ${text(p, 'chto')} окажется больше ${a} ${kogo}, равна ${dec(veroyatnost(p, 'p1'))}. Найдите вероятность того, что ${text(p, 'chto')} окажется от ${a + 1} до ${b} ${kogo} включительно.`;
  },
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const o = otvetBolshe(p);
    return (
      a >= 1 &&
      b - a >= 2 &&
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
  otvet: otvetBolshe,
  /* Второй путь: сто дней наблюдений целыми числами. */
  perebor: (p) => (shtuk(veroyatnost(p, 'p1'), 100) - shtuk(veroyatnost(p, 'p2'), 100)) / 100,
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const A = shtuk(p1, 100);
    const B = shtuk(p2, 100);
    return [
      {
        etap: 'Связь событий',
        text: `«Больше ${b}» входит в «больше ${a}»: если их больше ${b}, то тем более больше ${a}. «От ${a + 1} до ${b}» — это «больше ${a}», но не «больше ${b}». Число ${a} сюда не входит, а ${b} — входит.`,
      },
      {
        etap: 'Количества',
        text: `Возьмём 100 случаев. Больше ${a} бывает в ${A} из них, больше ${b} — в ${B}:`,
        formula: `100 \\cdot ${tex(p1)} = ${A},\\quad 100 \\cdot ${tex(p2)} = ${B}`,
      },
      {
        etap: 'Благоприятные исходы',
        text: `От ${a + 1} до ${b} — первые без вторых:`,
        formula: `m = ${A} - ${B} = ${A - B}`,
        value: A - B,
      },
      shagP(A - B, 100),
    ];
  },
  podskazka: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return [
      vopros(`Как связаны события «больше ${a}» и «больше ${b}»?`, 'Второе входит в первое', [
        'Они несовместны',
        'Они противоположны',
      ]),
      vopros(
        `Входит ли в искомое событие значение ${a}?`,
        `Нет: «больше ${a}» начинается с ${a + 1}`,
        [`Да, ${a} входит`, `Нет, и ${b} тоже не входит`],
        `«Больше ${a}» — это ${a + 1}, ${a + 2}, …; «больше ${b}» — это ${b + 1}, ${b + 2}, … Остаются ${a + 1}, …, ${b}.`,
      ),
      vopros('Какое выражение даёт ответ?', `$${tex(p1)} - ${tex(p2)}$`, [
        `$${tex(p1)} + ${tex(p2)}$`,
        `$1 - ${tex(p2)}$`,
      ]),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №4. Натуральное число из отрезка делится на d ──────────────── */

function kratnyh(a: number, b: number, d: number): number {
  return Math.floor(b / d) - Math.floor((a - 1) / d);
}

/**
 * Из натуральных чисел от a до b наугад выбирают одно. Вероятность, что
 * оно делится на d. Подвох — посчитать числа на отрезке (b − a + 1, а не
 * b − a) и кратные, не потеряв концы отрезка, если они кратны d.
 */
export const PV4_DELITSYA: Prototype = {
  id: 'pv4-delitsya',
  blok: 'povyshennye',
  nazvanie: 'Число из отрезка натурального ряда делится на d',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `${text(p, 'kto')} наугад выбирает натуральное число от ${num(p, 'a')} до ${num(p, 'b')} включительно. Найдите вероятность того, что выбранное число делится на ${num(p, 'd')}.`,
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const d = num(p, 'd');
    const o = kratnyh(a, b, d) / (b - a + 1);
    return a >= 1 && b > a && d >= 2 && o > 0 && konechnaya(o);
  },
  otvet: (p) =>
    tochnee(kratnyh(num(p, 'a'), num(p, 'b'), num(p, 'd')) / (num(p, 'b') - num(p, 'a') + 1)),
  /* Второй путь: перебор всех чисел отрезка. */
  perebor: (p) => {
    let m = 0;
    let n = 0;
    for (let x = num(p, 'a'); x <= num(p, 'b'); x += 1) {
      n += 1;
      if (x % num(p, 'd') === 0) m += 1;
    }
    return tochnee(m / n);
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const d = num(p, 'd');
    const n = b - a + 1;
    const m = kratnyh(a, b, d);
    const pervoe = Math.ceil(a / d) * d;
    const xs = Array.from({ length: m }, (_, i) => pervoe + i * d);
    return [
      {
        etap: 'Все исходы',
        text: `Чисел от ${a} до ${b} включительно — на одно больше, чем разность концов:`,
        formula: `n = ${b} - ${a} + 1 = ${n}`,
        value: n,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Кратные ${d} на этом отрезке: ${xs.join(', ')}.`,
        formula: `m = ${m}`,
        value: m,
      },
      shagP(m, n),
    ];
  },
  podskazka: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const d = num(p, 'd');
    const n = b - a + 1;
    const m = kratnyh(a, b, d);
    return [
      vopros(
        `Сколько натуральных чисел от ${a} до ${b} включительно?`,
        `$${n}$`,
        [`$${b - a}$`, `$${b}$`],
        'Оба конца входят: к разности прибавляем единицу.',
      ),
      vopros(
        `Сколько из них делятся на ${d}?`,
        `$${m}$`,
        [`$${m + 1}$`, `$${Math.floor(b / d)}$`].filter((x) => x !== `$${m}$`),
        'Выпишите кратные, начиная с первого не меньше начала отрезка.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №4. Противоположное событие ─────────────────────────────────── */

/**
 * Дана вероятность события — найти вероятность противоположного.
 * Подвох — сформулировать противоположное правильно: «отклонение не
 * больше» ↔ «меньше нижней или больше верхней границы», «ниже t» ↔
 * «не ниже t». Сюжет: деталь с допуском или температура.
 */
export const PV4_PROTIVOPOLOZHNOE: Prototype = {
  id: 'pv4-protivopolozhnoe',
  blok: 'povyshennye',
  nazvanie: 'Противоположное событие: допуск или порог',
  tip: 'Противоположное событие',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const q = dec(veroyatnost(p, 'p'));
    if (p['syuzhet'] === 'detal') {
      const x = num(p, 'x');
      const e = num(p, 'e');
      return `${text(p, 'detal')} должен иметь ${text(p, 'razmer')} ${dec(x)} мм. Вероятность того, что ${text(p, 'razmer')} будет отличаться от нормы не больше чем на ${dec(e)} мм, равна ${q}. Найдите вероятность того, что у случайно выбранного изделия ${text(p, 'razmer')} будет меньше ${dec(tochnee(x - e))} мм или больше ${dec(tochnee(x + e))} мм.`;
    }
    return `${text(p, 'gde')} вероятность того, что температура окажется ниже ${dec(num(p, 't'))} °C, равна ${q}. Найдите вероятность того, что температура будет ${dec(num(p, 't'))} °C или выше.`;
  },
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    const o = tochnee(1 - q);
    return q > 0 && q < 1 && konechnaya(o) && (p['syuzhet'] !== 'detal' || num(p, 'e') > 0);
  },
  otvet: (p) => tochnee(1 - veroyatnost(p, 'p')),
  /* Второй путь: из тысячи изделий (дней) целыми числами. */
  perebor: (p) => (1000 - shtuk(veroyatnost(p, 'p'), 1000)) / 1000,
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const detal = p['syuzhet'] === 'detal';
    const text1 = detal
      ? `«Меньше ${dec(tochnee(num(p, 'x') - num(p, 'e')))} или больше ${dec(tochnee(num(p, 'x') + num(p, 'e')))} мм» — то же, что «отличается от нормы больше чем на ${dec(num(p, 'e'))} мм». Это событие противоположно данному: вместе они покрывают все случаи и не пересекаются.`
      : `«${dec(num(p, 't'))} °C или выше» — противоположное событие к «ниже ${dec(num(p, 't'))} °C»: одно из двух происходит всегда, и вместе — никогда.`;
    return [
      { etap: 'Связь событий', text: text1 },
      {
        etap: 'Ответ',
        text: 'Вероятности противоположных событий в сумме дают 1:',
        formula: `P = 1 - ${tex(q)} = ${tex(tochnee(1 - q))}`,
        value: tochnee(1 - q),
      },
    ];
  },
  podskazka: (p) => {
    const q = veroyatnost(p, 'p');
    const detal = p['syuzhet'] === 'detal';
    return [
      vopros(
        'Как связаны данное и искомое события?',
        'Они противоположны',
        ['Искомое входит в данное', 'Они независимы'],
        detal
          ? 'Размер либо в пределах допуска, либо выходит за него — третьего нет.'
          : 'Температура либо ниже порога, либо не ниже — третьего нет.',
      ),
      vopros('Какое выражение даёт ответ?', `$1 - ${tex(q)}$`, [`$${tex(q)}$`, `$${tex(q)} : 2$`]),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Значение между двумя порогами ───────────────────────────── */

const otvetMezhdu = (p: Params) => tochnee(veroyatnost(p, 'p1') + veroyatnost(p, 'p2') - 1);

/**
 * P(T > t1) = p1 и P(T < t2) = p2, t1 < t2. Найти P(t1 < T < t2).
 * Подвох — события пересекаются, и сумма больше 1: искомое — их
 * пересечение, p1 + p2 − 1 (как p5-13 банка).
 */
export const PV5_MEZHDU: Prototype = {
  id: 'pv5-mezhdu',
  blok: 'povyshennye',
  nazvanie: 'Значение между двумя порогами: p₁ + p₂ − 1',
  tip: 'Сложение вероятностей',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const t1 = dec(num(p, 't1'));
    const t2 = dec(num(p, 't2'));
    return `${text(p, 'gde')} Вероятность того, что ${text(p, 'chto')} окажется выше ${t1} ${text(p, 'ed')}, равна ${dec(veroyatnost(p, 'p1'))}. Вероятность того, что ${text(p, 'chto')} окажется ниже ${t2} ${text(p, 'ed')}, равна ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что ${text(p, 'chto')} окажется в промежутке от ${t1} до ${t2} ${text(p, 'ed')}.`;
  },
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const o = otvetMezhdu(p);
    return (
      num(p, 't1') < num(p, 't2') &&
      p1 > 0 &&
      p1 < 1 &&
      p2 > 0 &&
      p2 < 1 &&
      celoeProtsentov(p1, 100) &&
      celoeProtsentov(p2, 100) &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetMezhdu,
  /* Второй путь: сто наблюдений; «ниже t1» = 100 − «выше t1», «выше t2» = 100 − «ниже t2». */
  perebor: (p) => {
    const nizhe1 = 100 - shtuk(veroyatnost(p, 'p1'), 100);
    const vyshe2 = 100 - shtuk(veroyatnost(p, 'p2'), 100);
    return (100 - nizhe1 - vyshe2) / 100;
  },
  shagi: (p) => {
    const t1 = dec(num(p, 't1'));
    const t2 = dec(num(p, 't2'));
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const n1 = tochnee(1 - p1);
    const v2 = tochnee(1 - p2);
    return [
      {
        etap: 'Связь событий',
        text: `Все случаи делятся на три несовместных: ниже ${t1}, от ${t1} до ${t2}, выше ${t2}. Их вероятности в сумме дают 1.`,
      },
      {
        etap: 'Противоположное событие',
        text: `«Не выше ${t1}» — противоположно «выше ${t1}», «не ниже ${t2}» — противоположно «ниже ${t2}»:`,
        formula: `1 - ${tex(p1)} = ${tex(n1)},\\quad 1 - ${tex(p2)} = ${tex(v2)}`,
      },
      {
        etap: 'Ответ',
        text: 'Искомое — всё, кроме двух крайних случаев:',
        formula: `P = 1 - ${tex(n1)} - ${tex(v2)} = ${tex(otvetMezhdu(p))}`,
        value: otvetMezhdu(p),
      },
    ];
  },
  podskazka: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return [
      vopros(
        'Почему нельзя просто сложить данные вероятности?',
        'События пересекаются: промежуток между порогами входит в оба',
        ['Можно, они несовместны', 'Надо их перемножить'],
        `Сумма $${tex(p1)} + ${tex(p2)}$ больше 1 — так и бывает у пересекающихся событий.`,
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(p1)} + ${tex(p2)} - 1$`,
        [`$${tex(p1)} \\cdot ${tex(p2)}$`, `$${tex(p2)} - ${tex(p1)}$`],
        'Из единицы вычитаем вероятности двух крайних случаев.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Две кости: «хотя бы раз g» при условии «сумма не s» ──────── */

function paryKost(s: number, g: number): { m: number; n: number } {
  let m = 0;
  let n = 0;
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      if (a + b === s) continue;
      n += 1;
      if (a === g || b === g) m += 1;
    }
  }
  return { m, n };
}

const okr2 = (x: number) => Math.round(x * 100) / 100;

/**
 * Кость бросают дважды; известно, что сумма не равна s. Вероятность,
 * что хотя бы раз выпало g, до сотых. Подвох — условие убирает из 36
 * пар не только пары с g, но и все пары с суммой s (как p5-05).
 */
export const PV5_KOST_USLOVIE: Prototype = {
  id: 'pv5-kost-uslovie',
  blok: 'povyshennye',
  nazvanie: 'Две кости: «хотя бы раз g» при условии «сумма не s»',
  tip: 'Вероятность при условии',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const s = num(p, 's');
    const g = num(p, 'g');
    return `Игральную кость бросают два раза. Известно, что в сумме выпало не ${s} ${skl(s, 'очко', 'очка', 'очков')}. Найдите при этом условии вероятность того, что хотя бы при одном броске выпало ${g} ${skl(g, 'очко', 'очка', 'очков')}. Результат округлите до сотых.`;
  },
  dopustimo: (p) => {
    const s = num(p, 's');
    const g = num(p, 'g');
    const { m, n } = paryKost(s, g);
    /* Пары с суммой s и гранью g есть — иначе условие ничего не меняет. */
    return s >= 3 && s <= 11 && g >= 1 && g <= 6 && s - g >= 1 && s - g <= 6 && m > 0 && n < 36;
  },
  otvet: (p) => {
    const { m, n } = paryKost(num(p, 's'), num(p, 'g'));
    return okr2(m / n);
  },
  /* Второй путь: P(AB) : P(B) от всех 36 исходов, с дополнением. */
  perebor: (p) => {
    const s = num(p, 's');
    const g = num(p, 'g');
    const sG = 1 - (5 / 6) ** 2;
    let sumS = 0;
    let sumSG = 0;
    for (let a = 1; a <= 6; a += 1) {
      const b = s - a;
      if (b >= 1 && b <= 6) {
        sumS += 1;
        if (a === g || b === g) sumSG += 1;
      }
    }
    return okr2((sG - sumSG / 36) / (1 - sumS / 36));
  },
  shagi: (p) => {
    const s = num(p, 's');
    const g = num(p, 'g');
    const { m, n } = paryKost(s, g);
    const sumS: string[] = [];
    for (let a = 1; a <= 6; a += 1) {
      const b = s - a;
      if (b >= 1 && b <= 6) sumS.push(`(${a}; ${b})`);
    }
    const sG = sumS.filter((x) => x.includes(String(g)));
    return [
      {
        etap: 'Все исходы',
        text: `Из 36 пар условие убирает пары с суммой ${s}: ${sumS.join(', ')}. Остальные равновозможны:`,
        formula: `n = 36 - ${sumS.length} = ${n}`,
        value: n,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Пар, где хотя бы раз выпало ${g}, всего 11 (6 с ${g} на первой кости и ещё 5 — на второй). Из них убраны ${sG.join(' и ')}:`,
        formula: `m = 11 - ${11 - m} = ${m}`,
        value: m,
      },
      shagP(m, n, 2),
    ];
  },
  podskazka: (p) => {
    const s = num(p, 's');
    const g = num(p, 'g');
    const { m, n } = paryKost(s, g);
    return [
      vopros(
        'Сколько равновозможных пар остаётся после условия?',
        `$${n}$`,
        ['$36$', `$${n - 1}$`],
        `Убираем пары с суммой ${s}.`,
      ),
      vopros(
        `Сколько из них содержат ${g}?`,
        `$${m}$`,
        ['$11$', '$12$'].filter((x) => x !== `$${m}$`),
        `Пар с ${g} всего 11; пары с суммой ${s} из них выбыли.`,
      ),
      zapisShag('десятичная', 2),
    ];
  },
  varianty: [],
};
