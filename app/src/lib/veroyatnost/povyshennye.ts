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
import { chislo, vopros, zapisShag } from './podskazka';
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

/* ── №4. Частота и вероятность: на сколько частота меньше (больше) ─ */

/** Частота события: k случаев из N. */
const chastota = (p: Params) => tochnee(num(p, 'k') / num(p, 'N'));

const otvetChastota = (p: Params) => tochnee(Math.abs(veroyatnost(p, 'p') - chastota(p)));

/** «меньше» или «больше» — где частота стоит относительно вероятности. */
const kudaChastota = (p: Params) => (chastota(p) < veroyatnost(p, 'p') ? 'меньше' : 'больше');

/**
 * Дана вероятность того, что изделие за год попадёт в гарантийный
 * ремонт, и наблюдение «из N проданных в ремонт попали k». На сколько
 * частота меньше (больше) вероятности. Подвох — частота не число k, а
 * доля k : N, и вычитать надо из большего меньшее.
 */
export const PV4_CHASTOTA: Prototype = {
  id: 'pv4-chastota',
  blok: 'povyshennye',
  nazvanie: 'Частота события и его вероятность: разность',
  tip: 'Статистическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return `Вероятность того, что ${text(p, 'chto')} в течение года потребует гарантийного ремонта, равна ${dec(veroyatnost(p, 'p'))}. В одном городе за год продали ${N} ${text(p, 'mnogo')}, и ${k} из них за этот год ${skl(k, 'попал', 'попали', 'попали')} в гарантийную мастерскую. На сколько частота события «гарантийный ремонт» в этом городе ${kudaChastota(p)} его вероятности?`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    const o = otvetChastota(p);
    return (
      N >= 100 &&
      k >= 2 &&
      k < N &&
      q > 0 &&
      q < 1 &&
      celoeProtsentov(q, 1000) &&
      konechnaya(chastota(p)) &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetChastota,
  /* Второй путь: на 10 000 изделий целыми числами — ожидаемые и наблюдённые ремонты. */
  perebor: (p) => {
    const ozhid = shtuk(veroyatnost(p, 'p'), 10000);
    const nabl = (num(p, 'k') * 10000) / num(p, 'N');
    return Math.abs(ozhid - nabl) / 10000;
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    const f = chastota(p);
    const o = otvetChastota(p);
    const [b, m] = f < q ? [q, f] : [f, q];
    return [
      {
        etap: 'Количества',
        text: `Частота события — доля случаев, в которых оно произошло: ${k} ${skl(k, 'ремонт', 'ремонта', 'ремонтов')} на ${N} проданных изделий.`,
        formula: `\\nu = \\dfrac{${k}}{${N}} = ${tex(f)}`,
        value: f,
      },
      {
        etap: 'Ответ',
        text: `Частота ${dec(f)} ${kudaChastota(p)} вероятности ${dec(q)}. Из большего числа вычитаем меньшее:`,
        formula: `${tex(b)} - ${tex(m)} = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    const f = chastota(p);
    const [b, m] = f < q ? [q, f] : [f, q];
    return [
      vopros(
        'Что такое частота события в этом городе?',
        `Доля попавших в ремонт среди проданных: $\\dfrac{${k}}{${N}}$`,
        [`Само число $${k}$`, `Доля $\\dfrac{${k}}{100}$`, `Произведение $${N} \\cdot ${tex(q)}$`],
      ),
      vopros(
        'Чему равна частота?',
        `$${tex(f)}$`,
        [tochnee(k / 100), tochnee(1 - f), tochnee(k / (N * 10))]
          .filter((x) => x !== f && x > 0 && x < 1)
          .map((x) => `$${tex(x)}$`),
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(b)} - ${tex(m)}$`,
        [`$${tex(m)} - ${tex(b)}$`, `$${tex(q)} + ${tex(f)}$`, `$${k} - ${N} \\cdot ${tex(q)}$`],
        'Разница — из большего числа меньшее, она положительна.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №4. Жребий: следующим — соотечественник ────────────────────── */

/** Слова сюжета: где выступают, кто и как называется выход на старт. */
function start(p: Params): { gde: string; kto: [string, string, string]; vyhod: string } {
  switch (text(p, 'syuzhet')) {
    case 'biatlon':
      return {
        gde: 'В индивидуальной гонке биатлонистов',
        kto: ['спортсмен', 'спортсмена', 'спортсменов'],
        vyhod: 'стартует',
      };
    case 'figurnoe':
      return {
        gde: 'В короткой программе турнира по фигурному катанию',
        kto: ['фигурист', 'фигуриста', 'фигуристов'],
        vyhod: 'выступит',
      };
    default:
      return {
        gde: 'В лыжной гонке с раздельным стартом',
        kto: ['лыжник', 'лыжника', 'лыжников'],
        vyhod: 'стартует',
      };
  }
}

const otvetSootech = (p: Params) => tochnee((num(p, 'm') - 1) / (num(p, 'n') - 1));

/** n! в плавающей запятой: для n ≤ 40 отношения факториалов точны до 1e-12. */
function faktorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

/**
 * n участников, m из них — из одной команды; порядок определяет жребий.
 * Спортсмену этой команды выпал номер `nomer`. Вероятность, что сразу
 * за ним пойдёт его товарищ по команде. Подвох — номер не важен, а
 * исходов и благоприятных на одного меньше: n − 1 и m − 1.
 */
export const PV4_SOOTECHESTVENNIK: Prototype = {
  id: 'pv4-sootechestvennik',
  blok: 'povyshennye',
  nazvanie: 'Жребий: следующим — спортсмен той же команды',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const s = start(p);
    return `${s.gde} участвуют ${n} ${skl(n, ...s.kto)}, ${m} из них представляют ${text(p, 'strana')}. Порядок выступления определяет жребий. Спортсмену из ${text(p, 'komandy')} выпал номер ${num(p, 'nomer')}. Найдите вероятность того, что сразу после него ${s.vyhod} спортсмен из той же страны.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const nomer = num(p, 'nomer');
    const o = otvetSootech(p);
    return m >= 2 && m < n && n <= 40 && nomer >= 1 && nomer < n && o > 0 && o < 1 && konechnaya(o);
  },
  otvet: otvetSootech,
  /* Второй путь — через расстановки: «свои» на местах nomer и nomer + 1
     бывают в m(m − 1)(n − 2)! расстановках, «свой» на месте nomer — в m(n − 1)!. */
  perebor: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    return tochnee((m * (m - 1) * faktorial(n - 2)) / (m * faktorial(n - 1)));
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const nomer = num(p, 'nomer');
    return [
      {
        etap: 'Все исходы',
        text: `Номер ${nomer} уже занят. Следующий номер с равными шансами достанется любому из остальных участников, и каким по счёту был номер ${nomer}, не важно:`,
        formula: `n = ${n} - 1 = ${n - 1}`,
        value: n - 1,
      },
      {
        etap: 'Благоприятные исходы',
        text: 'Спортсмены той же страны среди остальных — все, кроме него самого:',
        formula: `m = ${m} - 1 = ${m - 1}`,
        value: m - 1,
      },
      shagP(m - 1, n - 1),
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    return [
      vopros(
        'Из скольких участников равновозможно выбирается следующий?',
        `$${n - 1}$`,
        [`$${n}$`, `$${n - num(p, 'nomer')}$`],
        'Из всех, кроме того, чей номер уже известен.',
      ),
      vopros(
        'Сколько среди них спортсменов из той же страны?',
        `$${m - 1}$`,
        [`$${m}$`, `$${m - 2}$`].filter((x) => x !== '$0$'),
        'Сам он в этот счёт уже не входит.',
      ),
      vopros('Какое выражение даёт ответ?', `$\\dfrac{${m - 1}}{${n - 1}}$`, [
        `$\\dfrac{${m}}{${n}}$`,
        `$\\dfrac{${m - 1}}{${n}}$`,
        `$\\dfrac{${m}}{${n - 1}}$`,
      ]),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Две мишени, три выстрела: выбор лучшего способа ─────────── */

/** Хотя бы одно попадание из двух выстрелов: 1 − (1 − x)(1 − y). */
const dvaVystrela = (x: number, y: number) => tochnee(1 - (1 - x) * (1 - y));

/** Вероятности двух способов: «2 + 1» и «1 + 2». */
function sposoby(p: Params): { h1: number; h2: number; P1: number; P2: number } {
  const a1 = veroyatnost(p, 'a1');
  const a2 = veroyatnost(p, 'a2');
  const b1 = veroyatnost(p, 'b1');
  const b2 = veroyatnost(p, 'b2');
  const h1 = dvaVystrela(a1, a2);
  const h2 = dvaVystrela(b1, b2);
  return { h1, h2, P1: tochnee(h1 * b1), P2: tochnee(a1 * h2) };
}

const otvetMisheni = (p: Params) => {
  const s = sposoby(p);
  return Math.max(s.P1, s.P2);
};

/** Кто стреляет и чем: стрелок в тире или лучник. */
function strelok(p: Params): { kto: string; chem: string; vystrel: string } {
  return p['syuzhet'] === 'luk'
    ? { kto: 'Лучник на тренировке', chem: 'три стрелы', vystrel: 'выстрела' }
    : { kto: 'Стрелок в тире', chem: 'три патрона', vystrel: 'выстрела' };
}

/**
 * Две мишени, у каждой свои вероятности попасть первым и вторым
 * выстрелом; всего три выстрела: «два по первой и один по второй» или
 * «один по первой и два по второй». Выбирают способ, где вероятность
 * поразить обе мишени больше; найти её. Подвох — посчитать оба способа
 * через противоположное событие и выбрать больший.
 */
export const PV5_DVE_MISHENI: Prototype = {
  id: 'pv5-dve-misheni',
  blok: 'povyshennye',
  nazvanie: 'Две мишени, три выстрела: лучший из двух способов',
  tip: 'Независимые события: перемножаем',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const s = strelok(p);
    const v = (k: string) => dec(veroyatnost(p, k));
    return `${s.kto} должен поразить две мишени, и у него ${s.chem}. В первую мишень он попадает первым выстрелом с вероятностью ${v('a1')}, а вторым — с вероятностью ${v('a2')}. Во вторую мишень — первым выстрелом с вероятностью ${v('b1')}, вторым — с вероятностью ${v('b2')}. Второй выстрел по мишени делают, только если первый прошёл мимо. Можно сделать два ${s.vystrel} по первой мишени и один по второй или один по первой и два по второй; выбирают тот способ, при котором вероятность поразить обе мишени больше. Найдите эту вероятность.`;
  },
  dopustimo: (p) => {
    const xs = ['a1', 'a2', 'b1', 'b2'].map((k) => veroyatnost(p, k));
    const s = sposoby(p);
    const o = otvetMisheni(p);
    return (
      xs.every((x) => x > 0 && x < 1 && celoeProtsentov(x, 100)) &&
      s.P1 !== s.P2 &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetMisheni,
  /* Второй путь: перебор всех восьми исходов трёх выстрелов у каждого способа. */
  perebor: (p) => {
    const a1 = veroyatnost(p, 'a1');
    const a2 = veroyatnost(p, 'a2');
    const b1 = veroyatnost(p, 'b1');
    const b2 = veroyatnost(p, 'b2');
    const sposob = (qs: number[], uspeh: (h: boolean[]) => boolean) => {
      let s = 0;
      for (let mask = 0; mask < 8; mask += 1) {
        const h = [0, 1, 2].map((i) => ((mask >> i) & 1) === 1);
        const w = h.reduce((acc, hit, i) => acc * (hit ? qs[i]! : 1 - qs[i]!), 1);
        if (uspeh(h)) s += w;
      }
      return s;
    };
    const P1 = sposob([a1, a2, b1], (h) => (h[0]! || h[1]!) && h[2]!);
    const P2 = sposob([a1, b1, b2], (h) => h[0]! && (h[1]! || h[2]!));
    return tochnee(Math.max(P1, P2));
  },
  shagi: (p) => {
    const a1 = veroyatnost(p, 'a1');
    const a2 = veroyatnost(p, 'a2');
    const b1 = veroyatnost(p, 'b1');
    const b2 = veroyatnost(p, 'b2');
    const { h1, h2, P1, P2 } = sposoby(p);
    const o = Math.max(P1, P2);
    return [
      {
        etap: 'Противоположное событие',
        text: 'Мишень, по которой стреляют дважды, останется целой, только если оба выстрела пройдут мимо. Вероятность поразить её двумя выстрелами — для первой и для второй мишени:',
        formula: `1 - ${tex(tochnee(1 - a1))} \\cdot ${tex(tochnee(1 - a2))} = ${tex(h1)},\\quad 1 - ${tex(tochnee(1 - b1))} \\cdot ${tex(tochnee(1 - b2))} = ${tex(h2)}`,
      },
      {
        etap: 'Путь по дереву',
        text: 'Мишени поражаются независимо — перемножаем. Два выстрела по первой и один по второй; один по первой и два по второй:',
        formula: `P_1 = ${tex(h1)} \\cdot ${tex(b1)} = ${tex(P1)},\\quad P_2 = ${tex(a1)} \\cdot ${tex(h2)} = ${tex(P2)}`,
      },
      {
        etap: 'Ответ',
        text: `Выбирают способ с большей вероятностью — ${P1 > P2 ? 'два выстрела по первой мишени' : 'два выстрела по второй мишени'}:`,
        formula: `P = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const a1 = veroyatnost(p, 'a1');
    const a2 = veroyatnost(p, 'a2');
    const b1 = veroyatnost(p, 'b1');
    const { h1, P1, P2 } = sposoby(p);
    return [
      vopros(
        'Как найти вероятность поразить первую мишень двумя выстрелами?',
        `$1 - ${tex(tochnee(1 - a1))} \\cdot ${tex(tochnee(1 - a2))}$`,
        [`$${tex(a1)} + ${tex(a2)}$`, `$${tex(a1)} \\cdot ${tex(a2)}$`],
        'Противоположное событие — оба выстрела мимо.',
      ),
      vopros(
        'Вероятность поразить обе мишени, если по первой стреляют дважды, равна…',
        `$${tex(h1)} \\cdot ${tex(b1)}$`,
        [`$${tex(a1)} \\cdot ${tex(a2)} \\cdot ${tex(b1)}$`, `$${tex(h1)} + ${tex(b1)}$`],
        'Обе мишени — независимые события: перемножаем.',
      ),
      vopros(
        'Какой способ выбирают?',
        P1 > P2 ? 'Два выстрела по первой мишени' : 'Два выстрела по второй мишени',
        [
          P1 > P2 ? 'Два выстрела по второй мишени' : 'Два выстрела по первой мишени',
          'Способы равноценны',
        ],
        'Сравните вероятности обоих способов.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Два ящика: шары одного цвета ───────────────────────────── */

interface SyuzhetTsveta {
  v1: string;
  v2: string;
  iz: string;
  tsveta: [string, string];
  /** «шар», «шара», «шаров». */
  sh: [string, string, string];
  dat: string;
  oba: string;
  /** «оба белых» — в разборе. */
  obaTsveta: [string, string];
}

const SYUZHETY_TSVETA: Record<string, SyuzhetTsveta> = {
  shary: {
    v1: 'В первом ящике',
    v2: 'во втором',
    iz: 'Из каждого ящика',
    tsveta: ['белых', 'чёрных'],
    sh: ['шар', 'шара', 'шаров'],
    dat: 'шару',
    oba: 'оба шара',
    obaTsveta: ['оба белых', 'оба чёрных'],
  },
  kubiki: {
    v1: 'В первой коробке',
    v2: 'во второй',
    iz: 'Из каждой коробки',
    tsveta: ['красных', 'синих'],
    sh: ['кубик', 'кубика', 'кубиков'],
    dat: 'кубику',
    oba: 'оба кубика',
    obaTsveta: ['оба красных', 'оба синих'],
  },
  zhetony: {
    v1: 'В первом мешочке',
    v2: 'во втором',
    iz: 'Из каждого мешочка',
    tsveta: ['жёлтых', 'зелёных'],
    sh: ['жетон', 'жетона', 'жетонов'],
    dat: 'жетону',
    oba: 'оба жетона',
    obaTsveta: ['оба жёлтых', 'оба зелёных'],
  },
};

function tsvet(p: Params): SyuzhetTsveta {
  const s = SYUZHETY_TSVETA[text(p, 'syuzhet')];
  if (s === undefined) throw new Error(`pv5-odin-tsvet: нет сюжета ${String(p['syuzhet'])}`);
  return s;
}

/** Доли цветов в двух ящиках. */
function doli(p: Params): { x1: number; y1: number; x2: number; y2: number } {
  const n1 = num(p, 'a1') + num(p, 'b1');
  const n2 = num(p, 'a2') + num(p, 'b2');
  return {
    x1: tochnee(num(p, 'a1') / n1),
    y1: tochnee(num(p, 'b1') / n1),
    x2: tochnee(num(p, 'a2') / n2),
    y2: tochnee(num(p, 'b2') / n2),
  };
}

const otvetTsvet = (p: Params) => {
  const d = doli(p);
  return tochnee(d.x1 * d.x2 + d.y1 * d.y2);
};

/**
 * Два ящика с предметами двух цветов (a1 и b1, a2 и b2); из каждого
 * вынимают по одному. Вероятность, что они одного цвета. Подвох — два
 * несовместных пути («оба первого цвета» и «оба второго»), по каждому
 * свои доли из своего ящика.
 */
export const PV5_ODIN_TSVET: Prototype = {
  id: 'pv5-odin-tsvet',
  blok: 'povyshennye',
  nazvanie: 'Два ящика: вынутые предметы одного цвета',
  tip: 'Независимые события: перемножаем',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const s = tsvet(p);
    const b1 = num(p, 'b1');
    const b2 = num(p, 'b2');
    return `${s.v1} лежат ${num(p, 'a1')} ${s.tsveta[0]} и ${b1} ${s.tsveta[1]} ${skl(b1, ...s.sh)}, ${s.v2} — ${num(p, 'a2')} ${s.tsveta[0]} и ${b2} ${s.tsveta[1]} ${skl(b2, ...s.sh)}. ${s.iz} наугад вынимают по одному ${s.dat}. Найдите вероятность того, что ${s.oba} окажутся одного цвета.`;
  },
  dopustimo: (p) => {
    const xs = ['a1', 'b1', 'a2', 'b2'].map((k) => num(p, k));
    const d = doli(p);
    const o = otvetTsvet(p);
    /* «21 белых» не по-русски: числа на 1 (кроме 11) не берём. */
    const soglasuetsya = (n: number) => n % 10 !== 1 || n % 100 === 11;
    return (
      xs.every((n) => Number.isInteger(n) && n >= 2 && soglasuetsya(n)) &&
      [d.x1, d.y1, d.x2, d.y2].every(konechnaya) &&
      o > 0 &&
      o < 1 &&
      konechnaya(o)
    );
  },
  otvet: otvetTsvet,
  /* Второй путь: все пары «предмет из первого × предмет из второго» штуками. */
  perebor: (p) => {
    const a1 = num(p, 'a1');
    const b1 = num(p, 'b1');
    const a2 = num(p, 'a2');
    const b2 = num(p, 'b2');
    let odin = 0;
    let vse = 0;
    for (let i = 0; i < a1 + b1; i += 1) {
      for (let j = 0; j < a2 + b2; j += 1) {
        vse += 1;
        if (i < a1 === j < a2) odin += 1;
      }
    }
    return tochnee(odin / vse);
  },
  shagi: (p) => {
    const s = tsvet(p);
    const a1 = num(p, 'a1');
    const b1 = num(p, 'b1');
    const a2 = num(p, 'a2');
    const b2 = num(p, 'b2');
    const { x1, y1, x2, y2 } = doli(p);
    const xx = tochnee(x1 * x2);
    const yy = tochnee(y1 * y2);
    return [
      {
        etap: 'Благоприятные исходы',
        text: `«Одного цвета» — это два несовместных случая: ${s.obaTsveta[0]} или ${s.obaTsveta[1]}.`,
      },
      {
        etap: 'Количества',
        text: 'Доли цветов в первом и во втором:',
        formula: `\\dfrac{${a1}}{${a1 + b1}} = ${tex(x1)},\\ \\dfrac{${b1}}{${a1 + b1}} = ${tex(y1)};\\quad \\dfrac{${a2}}{${a2 + b2}} = ${tex(x2)},\\ \\dfrac{${b2}}{${a2 + b2}} = ${tex(y2)}`,
      },
      {
        etap: 'Путь по дереву',
        text: `Вынимают независимо: вероятность каждого случая — произведение долей. Сначала ${s.obaTsveta[0]}, затем ${s.obaTsveta[1]}:`,
        formula: `${tex(x1)} \\cdot ${tex(x2)} = ${tex(xx)},\\quad ${tex(y1)} \\cdot ${tex(y2)} = ${tex(yy)}`,
      },
      {
        etap: 'Ответ',
        text: 'Случаи несовместны — складываем:',
        formula: `P = ${tex(xx)} + ${tex(yy)} = ${tex(tochnee(xx + yy))}`,
        value: tochnee(xx + yy),
      },
    ];
  },
  podskazka: (p) => {
    const s = tsvet(p);
    const { x1, y1, x2, y2 } = doli(p);
    return [
      vopros(
        '«Одного цвета» — это…',
        `${s.obaTsveta[0][0]!.toUpperCase()}${s.obaTsveta[0].slice(1)} или ${s.obaTsveta[1]}`,
        [`Только ${s.obaTsveta[0]}`, 'Один одного цвета, другой — другого'],
      ),
      vopros(
        `Вероятность случая «${s.obaTsveta[0]}» равна…`,
        `$${tex(x1)} \\cdot ${tex(x2)}$`,
        [`$${tex(x1)} + ${tex(x2)}$`, `$${tex(x1)}$`],
        'Каждый предмет — из своей коробки, со своей долей.',
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(x1)} \\cdot ${tex(x2)} + ${tex(y1)} \\cdot ${tex(y2)}$`,
        [
          `$${tex(x1)} \\cdot ${tex(y2)} + ${tex(y1)} \\cdot ${tex(x2)}$`,
          `$${tex(x1)} \\cdot ${tex(x2)} \\cdot ${tex(y1)} \\cdot ${tex(y2)}$`,
        ],
        'Вдоль пути — произведение, пути — складываем.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Два автомата: закончится в обоих ───────────────────────── */

interface SyuzhetAvtomata {
  gde: string;
  chto: string;
  zak: string;
  ost: string;
  v: string;
  oba: string;
  kogda: string;
}

const SYUZHETY_AVTOMATA: Record<string, SyuzhetAvtomata> = {
  kofe: {
    gde: 'В холле бизнес-центра стоят два одинаковых кофейных автомата.',
    chto: 'кофе',
    zak: 'закончится',
    ost: 'останется',
    v: 'в автомате',
    oba: 'в обоих автоматах',
    kogda: 'к вечеру',
  },
  bankomat: {
    gde: 'В отделении банка работают два одинаковых банкомата.',
    chto: 'наличные',
    zak: 'закончатся',
    ost: 'останутся',
    v: 'в банкомате',
    oba: 'в обоих банкоматах',
    kogda: 'к концу дня',
  },
  voda: {
    gde: 'В спортивном клубе стоят два одинаковых автомата с питьевой водой.',
    chto: 'вода',
    zak: 'закончится',
    ost: 'останется',
    v: 'в автомате',
    oba: 'в обоих автоматах',
    kogda: 'к закрытию',
  },
};

function avtomat(p: Params): SyuzhetAvtomata {
  const s = SYUZHETY_AVTOMATA[text(p, 'syuzhet')];
  if (s === undefined) throw new Error(`pv5-oba-zakonchilis: нет сюжета ${String(p['syuzhet'])}`);
  return s;
}

/** P(хотя бы в одном) = 1 − r, P(в обоих) = 2p − (1 − r). */
const otvetOba = (p: Params) => tochnee(2 * veroyatnost(p, 'p') - tochnee(1 - veroyatnost(p, 'r')));

/**
 * Обратная к p5-04 банка: дана вероятность «закончится в автомате» (у
 * обоих одна) и «останется в обоих»; найти «закончится в обоих».
 * Подвох — автоматы зависимы, перемножать p · p нельзя: сначала
 * противоположное событие, потом сумма совместных событий.
 */
export const PV5_OBA_ZAKONCHILIS: Prototype = {
  id: 'pv5-oba-zakonchilis',
  blok: 'povyshennye',
  nazvanie: 'Два автомата: закончится в обоих',
  tip: 'Совместные события: общая часть',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const s = avtomat(p);
    return `${s.gde} Вероятность того, что ${s.kogda} ${s.chto} ${s.zak} ${s.v}, равна ${dec(veroyatnost(p, 'p'))} — для каждого из них. Вероятность того, что ${s.kogda} ${s.chto} ${s.ost} ${s.oba}, равна ${dec(veroyatnost(p, 'r'))}. Найдите вероятность того, что ${s.kogda} ${s.chto} ${s.zak} ${s.oba}.`;
  },
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    const r = veroyatnost(p, 'r');
    const o = otvetOba(p);
    return (
      q > 0 &&
      q < 1 &&
      r > 0 &&
      r < 1 &&
      celoeProtsentov(q, 100) &&
      celoeProtsentov(r, 100) &&
      o > 0 &&
      o < q &&
      /* Иначе p · p даёт верный ответ, и подвоха нет. */
      tochnee(q * q) !== o &&
      konechnaya(o)
    );
  },
  otvet: otvetOba,
  /* Второй путь: сто дней штуками — «хотя бы в одном» и сумма двух автоматов. */
  perebor: (p) => {
    const A = shtuk(veroyatnost(p, 'p'), 100);
    const hotyaBy = 100 - shtuk(veroyatnost(p, 'r'), 100);
    return (A + A - hotyaBy) / 100;
  },
  shagi: (p) => {
    const s = avtomat(p);
    const q = veroyatnost(p, 'p');
    const r = veroyatnost(p, 'r');
    const h = tochnee(1 - r);
    const o = otvetOba(p);
    return [
      {
        etap: 'Противоположное событие',
        text: `«${s.chto[0]!.toUpperCase()}${s.chto.slice(1)} ${s.ost} ${s.oba}» противоположно событию «${s.chto} ${s.zak} хотя бы в одном автомате» — это сумма $A + B$:`,
        formula: `P(A + B) = 1 - ${tex(r)} = ${tex(h)}`,
        value: h,
      },
      {
        etap: 'Ответ',
        text: 'События $A$ и $B$ совместны: вероятность суммы — сумма вероятностей без общей части. Выражаем общую часть:',
        formula: `P(AB) = P(A) + P(B) - P(A + B) = ${tex(q)} + ${tex(q)} - ${tex(h)} = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const q = veroyatnost(p, 'p');
    const r = veroyatnost(p, 'r');
    const h = tochnee(1 - r);
    return [
      vopros(
        `Можно ли найти ответ как $${tex(q)} \\cdot ${tex(q)}$?`,
        'Нет: о независимости автоматов ничего не сказано',
        ['Да: автоматы одинаковые', 'Да: события несовместны'],
        'В людный день спрос растёт у обоих сразу — события зависимы.',
      ),
      vopros(
        'Чему равна вероятность «хотя бы в одном»?',
        chislo(h),
        [r, tochnee(1 - q), tochnee(2 * q)].filter((x) => x !== otvetOba(p)).map(chislo),
        'Это событие противоположно «останется в обоих».',
      ),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(q)} + ${tex(q)} - ${tex(h)}$`,
        [`$1 - ${tex(r)} - ${tex(q)}$`, `$${tex(q)} + ${tex(q)} - ${tex(r)}$`],
        '$P(AB) = P(A) + P(B) - P(A + B)$.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};
