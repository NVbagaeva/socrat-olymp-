/**
 * Шаблоны раздела «Варианты повышенной сложности» для заданий №4 и №5.
 *
 * Прототипы того же устройства, что банк раздела (types.ts, `Prototype`):
 * условие, допустимость, ответ формулой и вторым путём (перебор), шаги
 * с этапами из общего словаря и подсказки-вопросы. В BANK_4 и BANK_5
 * они не входят — в тренажёр и генератор раздела не попадают; чисел
 * своих у них нет (`varianty` пусто): числа задаёт вариант.
 */

import { plitkiDvuh, shagP } from './bank4/vizual';
import { shtuk, tex, tochnee, tochno, veroyatnost } from './bank5/obshchee';
import { skl } from './morfologia';
import { chislo, vopros, zapisShag } from './podskazka';
import { dec, konechnaya, num, round, text, type Params, type Prototype } from './types';

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
  nazvanie: 'Вложенные события «не менее $a$» и «не менее $b$»: разность',
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
  nazvanie: 'Вложенные события «больше $a$» и «больше $b$»: разность',
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
  nazvanie: 'Число из отрезка натурального ряда делится на $d$',
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
  nazvanie: 'Значение между двумя порогами: $p_1 + p_2 - 1$',
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
  nazvanie: 'Две кости: «хотя бы раз $g$» при условии «сумма не $s$»',
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

/* ── №4. Доля брака в партии: своя копия прототипа блока II ────────
   Тот же разбор, что у прототипов p4-19 и p4-20 банка (bank4/
   statisticheskoe), но без чисел банка: импорт самого банка унёс бы
   в сборку раздела его варианты. */

/** Округление, заданное параметром варианта: 0 — округления нет. */
const poParametru4 = (p: Record<string, number | string>): 2 | 3 | null => {
  const znakov = p['znakov'];
  return znakov === 2 ? 2 : znakov === 3 ? 3 : null;
};

export const PV4_NASOSY: Prototype = {
  id: 'pv4-nasosy',
  blok: 'povyshennye',
  nazvanie: 'Садовые насосы: брак в партии',
  tip: 'Вероятность противоположного события по доле',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: () => null,
  uslovie: (p) => {
    const k = num(p, 'k');
    return `В среднем из ${num(p, 'N')} садовых насосов, поступивших в продажу, ${k} ${skl(k, 'подтекает', 'подтекают', 'подтекают')}. Найдите вероятность того, что один случайно выбранный для контроля насос не подтекает.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return k >= 1 && k < N && konechnaya((N - k) / N);
  },
  otvet: (p) => (num(p, 'N') - num(p, 'k')) / num(p, 'N'),
  perebor: (p) => {
    /* Считаем не «целые минус бракованные», а прямым обходом партии:
       это второй способ прийти к тому же числу. */
    const N = num(p, 'N');
    const k = num(p, 'k');
    let celyh = 0;
    for (let i = 1; i <= N; i += 1) {
      if (i > k) {
        celyh += 1;
      }
    }
    return celyh / N;
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return [
      {
        etap: 'Все исходы',
        text: 'На проверку может попасть любой насос из партии, все равновозможны:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        etap: 'Благоприятные исходы',
        text: 'Подходят насосы, которые не подтекают:',
        formula: `m = ${N} - ${k} = ${N - k}`,
        value: N - k,
      },
      shagP(N - k, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайно выбранный насос из всех',
      'даны количества «из $N$ — $k$», не проценты',
      'благоприятные — исправные: вычитаем',
    ],
    fraza: (p) =>
      `прямой пересчёт — на контроль равновероятно попадает любой из ${num(p, 'N')} насосов.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'исправный', count: num(p, 'N') - num(p, 'k') },
        { label: 'подтекает', count: num(p, 'k') },
      ),
  },
  varianty: [],
};

export const PV4_SUMKI: Prototype = {
  id: 'pv4-sumki',
  blok: 'povyshennye',
  nazvanie: 'Фабрика сумок: доля с дефектом',
  tip: 'Вероятность противоположного события по доле',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: poParametru4,
  uslovie: (p) => {
    const k = num(p, 'k');
    const N = num(p, 'N');
    const okr = num(p, 'znakov') === 0 ? '' : ' Результат округлите до сотых.';
    return `Фабрика выпускает сумки. В среднем ${k} ${skl(k, 'сумка', 'сумки', 'сумок')} из ${N} ${skl(k, 'имеет', 'имеют', 'имеют')} скрытые дефекты. Найдите вероятность того, что купленная сумка окажется без дефектов.${okr}`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const znakov = num(p, 'znakov');
    if (k < 1 || k >= N || (znakov !== 0 && znakov !== 2)) {
      return false;
    }
    return znakov === 2 || konechnaya((N - k) / N);
  },
  otvet: (p) => (num(p, 'N') - num(p, 'k')) / num(p, 'N'),
  perebor: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    let celyh = 0;
    for (let i = 1; i <= N; i += 1) {
      if (i > k) {
        celyh += 1;
      }
    }
    return celyh / N;
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const znakov = num(p, 'znakov') === 2 ? 2 : null;
    return [
      {
        etap: 'Все исходы',
        text: 'Покупателю может достаться любая сумка из партии, все равновозможны:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        etap: 'Благоприятные исходы',
        text: 'Подходят сумки, у которых дефекта нет:',
        formula: `m = ${N} - ${k} = ${N - k}`,
        value: N - k,
      },
      shagP(N - k, N, znakov),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одна купленная сумка — один случайный выбор',
      'даны количества «$k$ из $N$»',
      'благоприятные — без дефектов: вычитаем',
    ],
    fraza: (p) =>
      `прямой пересчёт — покупателю равновероятно достаётся любая из ${num(p, 'N')} сумок.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'без дефекта', count: num(p, 'N') - num(p, 'k') },
        { label: 'с дефектом', count: num(p, 'k') },
      ),
  },
  varianty: [],
};

/* ── Партия 3 (варианты 13–18) ──────────────────────────────────── */

/* ── №4. Пары первого тура: соперник — соотечественник ──────────── */

/** Слова сюжета: вид спорта и как называют игрока. */
function turnir(p: Params): { gde: string; kto: [string, string, string]; kem: string } {
  switch (text(p, 'syuzhet')) {
    case 'shahmaty':
      return {
        gde: 'В чемпионате по шахматам',
        kto: ['шахматист', 'шахматиста', 'шахматистов'],
        kem: 'шахматистом',
      };
    case 'badminton':
      return {
        gde: 'В турнире по бадминтону',
        kto: ['бадминтонист', 'бадминтониста', 'бадминтонистов'],
        kem: 'бадминтонистом',
      };
    case 'tennis':
      return {
        gde: 'В турнире по настольному теннису',
        kto: ['теннисист', 'теннисиста', 'теннисистов'],
        kem: 'теннисистом',
      };
    default:
      return {
        gde: 'В чемпионате по шашкам',
        kto: ['шашист', 'шашиста', 'шашистов'],
        kem: 'шашистом',
      };
  }
}

const otvetPary = (p: Params) => tochnee((num(p, 'm') - 1) / (num(p, 'n') - 1));

/** (2k − 1)!! — число разбиений 2k участников на пары. */
function razbieniyNaPary(n: number): number {
  let f = 1;
  for (let i = n - 1; i >= 1; i -= 2) f *= i;
  return f;
}

/**
 * n участников (чётное), m из них — из одной страны, среди них
 * названный игрок. Первый тур — случайное разбиение на пары.
 * Вероятность, что соперник названного — из его страны. Подвох —
 * соперника выбирают из n − 1 остальных, своих среди них m − 1.
 */
export const PV4_PARY: Prototype = {
  id: 'pv4-pary',
  blok: 'povyshennye',
  nazvanie: 'Пары первого тура: соперник из той же страны',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const t = turnir(p);
    const kto = text(p, 'kto');
    return `${t.gde} участвуют ${n} ${skl(n, 'спортсмен', 'спортсмена', 'спортсменов')}, среди которых ${m} ${skl(m, ...t.kto)} из ${text(p, 'strana')}, в том числе ${kto}. Для игр первого тура участников разбивают на игровые пары случайным образом. Найдите вероятность того, что в первом туре ${kto} будет играть с каким-либо ${t.kem} из ${text(p, 'strana')}.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const o = otvetPary(p);
    return n % 2 === 0 && m >= 2 && m < n && n <= 100 && o > 0 && o < 1 && konechnaya(o);
  },
  otvet: otvetPary,
  /* Второй путь — через разбиения на пары: пара «он + свой» и любое
     разбиение остальных n − 2, из всех разбиений n участников. */
  perebor: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    return tochnee(((m - 1) * razbieniyNaPary(n - 2)) / razbieniyNaPary(n));
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const m = num(p, 'm');
    const kto = text(p, 'kto');
    return [
      {
        etap: 'Все исходы',
        text: `Соперником может оказаться любой из остальных участников — с равными шансами:`,
        formula: `n = ${n} - 1 = ${n - 1}`,
        value: n - 1,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Соотечественники среди них — все, кроме самого игрока (${kto} входит в число ${m}):`,
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
        'Из скольких участников равновозможно выбирается соперник?',
        `$${n - 1}$`,
        [`$${n}$`, `$${n / 2}$`],
        'Из всех, кроме самого игрока.',
      ),
      vopros(
        'Сколько среди них его соотечественников?',
        `$${m - 1}$`,
        [`$${m}$`, `$${m - 2}$`].filter((x) => x !== '$0$'),
        'Сам игрок в этот счёт не входит.',
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

/* ── №5. Трое друзей и случайное деление на группы ──────────────── */

/** C(n, k) в плавающей запятой: n ≤ 60, точность с запасом. */
function soch(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i += 1) c = (c * (n - k + i)) / i;
  return c;
}

/** Три имени друзей через запятую и «и». */
function troe(p: Params): string {
  return `${text(p, 'i1')}, ${text(p, 'i2')} и ${text(p, 'i3')}`;
}

/** Вероятность, что трое из n окажутся в одной из двух равных групп. */
const vOdnoy = (n: number) => ((n / 2 - 1) * (n / 2 - 2)) / ((n - 1) * (n - 2));

/** Округление по условию: okr = 2 — до сотых, иначе ответ точный. */
const okrDvuh = (p: Params): 2 | null => (num(p, 'okr') === 2 ? 2 : null);

/**
 * n человек (чётное) делят на две равные группы. Вероятность, что три
 * друга окажутся в одной группе. Подвох — первый друг уже где-то, для
 * второго свободных мест в его группе n/2 − 1 из n − 1, для третьего —
 * n/2 − 2 из n − 2.
 */
export const PV5_ODNA_GRUPPA: Prototype = {
  id: 'pv5-odna-gruppa',
  blok: 'povyshennye',
  nazvanie: 'Две равные группы: трое друзей в одной',
  tip: 'Умножение вероятностей',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: okrDvuh,
  uslovie: (p) => {
    const n = num(p, 'n');
    return `${text(p, 'gde')} ${n} ${skl(n, 'человек', 'человека', 'человек')}, в том числе три друга — ${troe(p)}. ${text(p, 'kogo')} случайным образом разбивают на две равные группы. Найдите вероятность того, что все три друга окажутся в одной группе.${okrDvuh(p) === 2 ? ' Ответ округлите до сотых.' : ''}`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const o = vOdnoy(n);
    return n % 2 === 0 && n >= 8 && n <= 60 && (okrDvuh(p) === 2 || konechnaya(tochnee(o)));
  },
  otvet: (p) => {
    const o = vOdnoy(num(p, 'n'));
    return okrDvuh(p) === 2 ? round(o, 2) : tochnee(o);
  },
  /* Второй путь — через сочетания: группа с друзьями дополняется n/2 − 3
     из остальных n − 3; таких групп две (чья — первая или вторая). */
  perebor: (p) => {
    const n = num(p, 'n');
    const o = (2 * soch(n - 3, n / 2 - 3)) / soch(n, n / 2);
    return okrDvuh(p) === 2 ? round(o, 2) : tochnee(o);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const g = n / 2;
    const o = vOdnoy(n);
    const otv = okrDvuh(p) === 2 ? round(o, 2) : tochnee(o);
    return [
      {
        etap: 'Связь событий',
        text: `Первый друг попал в какую-то группу. Нужно, чтобы двое других попали к нему: в каждой группе ${g} ${skl(g, 'место', 'места', 'мест')}.`,
      },
      {
        etap: 'Количества',
        text: `Для второго друга свободных мест в группе первого — ${g - 1} из ${n - 1} оставшихся, для третьего — ${g - 2} из ${n - 2}:`,
        formula: `\\dfrac{${g - 1}}{${n - 1}},\\qquad \\dfrac{${g - 2}}{${n - 2}}`,
      },
      {
        etap: 'Ответ',
        text: 'Оба события должны произойти — вероятности перемножаются:',
        formula: `P = \\dfrac{${g - 1}}{${n - 1}}\\cdot\\dfrac{${g - 2}}{${n - 2}} = \\dfrac{${(g - 1) * (g - 2)}}{${(n - 1) * (n - 2)}} ${okrDvuh(p) === 2 ? '\\approx' : '='} ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const g = n / 2;
    return [
      vopros(
        'Сколько мест осталось для второго друга в группе первого?',
        `$${g - 1}$ из $${n - 1}$`,
        [`$${g}$ из $${n}$`, `$${g - 1}$ из $${n}$`],
        'Одно место в группе уже занял первый друг, и он же выбыл из числа распределяемых.',
      ),
      vopros('А для третьего?', `$${g - 2}$ из $${n - 2}$`, [
        `$${g - 1}$ из $${n - 1}$`,
        `$${g - 2}$ из $${n - 1}$`,
      ]),
      zapisShag('десятичная', okrDvuh(p)),
    ];
  },
  varianty: [],
};

/** Вероятность, что из троих хотя бы двое в одной из трёх равных групп. */
const hotyaByDve = (n: number) => 1 - ((2 * n) / 3 / (n - 1)) * (n / 3 / (n - 2));

/**
 * n человек (кратно трём) делят на три равные группы. Вероятность,
 * что хотя бы двое из трёх подруг окажутся в одной группе, до сотых.
 * Подвох — считать через противоположное «все в разных группах».
 */
export const PV5_HOTYA_BY_DVE: Prototype = {
  id: 'pv5-hotya-by-dve',
  blok: 'povyshennye',
  nazvanie: 'Три равные группы: хотя бы двое из трёх в одной',
  tip: 'Противоположное событие',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const n = num(p, 'n');
    return `${text(p, 'gde')} ${n} ${skl(n, 'человек', 'человека', 'человек')}, в том числе три ${text(p, 'kto')} — ${troe(p)}. ${text(p, 'kogo')} случайным образом разбивают на три равные группы. Найдите вероятность того, что хотя бы двое из трёх ${text(p, 'kogo2')} окажутся в одной группе. Ответ округлите до сотых.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    return n % 3 === 0 && n >= 9 && n <= 60;
  },
  otvet: (p) => round(hotyaByDve(num(p, 'n')), 2),
  /* Второй путь — через сочетания: «все в разных» — по одному в каждой
     группе, остальные n − 3 раскладываются по n/3 − 1 в каждую. */
  perebor: (p) => {
    const n = num(p, 'n');
    const g = n / 3;
    const vse = soch(n, g) * soch(n - g, g);
    const raznye = 6 * soch(n - 3, g - 1) * soch(n - 3 - (g - 1), g - 1);
    return round(1 - raznye / vse, 2);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const g = n / 3;
    const raznye = ((2 * g) / (n - 1)) * (g / (n - 2));
    const otv = round(1 - raznye, 2);
    return [
      {
        etap: 'Противоположное событие',
        text: 'Противоположное событие — все трое в разных группах. Его вероятность найти проще.',
      },
      {
        etap: 'Количества',
        text: `Первая попала в какую-то группу. Вторая должна попасть в другую — там ${2 * g} ${skl(2 * g, 'место', 'места', 'мест')} из ${n - 1}; третья — в оставшуюся, ${g} из ${n - 2}:`,
        formula: `P(\\bar A) = \\dfrac{${2 * g}}{${n - 1}}\\cdot\\dfrac{${g}}{${n - 2}} = \\dfrac{${2 * g * g}}{${(n - 1) * (n - 2)}}`,
      },
      {
        etap: 'Ответ',
        text: 'Искомая вероятность:',
        formula: `P = 1 - \\dfrac{${2 * g * g}}{${(n - 1) * (n - 2)}} = \\dfrac{${(n - 1) * (n - 2) - 2 * g * g}}{${(n - 1) * (n - 2)}} \\approx ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const g = n / 3;
    return [
      vopros(
        'Какое событие удобнее посчитать?',
        'Все трое в разных группах',
        ['Ровно двое в одной группе', 'Все трое в одной группе'],
        'Оно противоположно искомому и считается одним произведением.',
      ),
      vopros('Сколько мест в «чужих» группах для второй?', `$${2 * g}$ из $${n - 1}$`, [
        `$${g}$ из $${n - 1}$`,
        `$${2 * g}$ из $${n}$`,
      ]),
      zapisShag('десятичная', 2),
    ];
  },
  varianty: [],
};

/* ── №4. Три цвета: P(X или Y) и P(Z или Y) → P(Y) ─────────────── */

/** Цвета: родительный для чернил/шаров и творительный для «окажется …». */
const TSVETA: Record<string, { mn: string; zh: string; m: string; rod: string }> = {
  chern: { mn: 'чёрными', zh: 'чёрной', m: 'чёрным', rod: 'чёрного' },
  sin: { mn: 'синими', zh: 'синей', m: 'синим', rod: 'синего' },
  krasn: { mn: 'красными', zh: 'красной', m: 'красным', rod: 'красного' },
  zel: { mn: 'зелёными', zh: 'зелёной', m: 'зелёным', rod: 'зелёного' },
  fiol: { mn: 'фиолетовыми', zh: 'фиолетовой', m: 'фиолетовым', rod: 'фиолетового' },
};

function tsvetIz(p: Params, key: string) {
  const c = TSVETA[text(p, key)];
  if (c === undefined) throw new Error(`pv4-tri-tsveta: нет цвета ${text(p, key)}`);
  return c;
}

/** Сюжет: ручки (ж. р., чернила) или фломастеры (м. р.). */
function predmet(p: Params) {
  const ruchki = text(p, 'syuzhet') === 'ruchki';
  return {
    lezhat: ruchki
      ? (spisok: string) => `ручки с ${spisok} чернилами`
      : (spisok: string) => `фломастеры с ${spisok} стержнями`,
    odin: ruchki ? 'одну ручку' : 'один фломастер',
    ona: ruchki ? 'она' : 'он',
    kakoy: (k: string) => (ruchki ? tsvetIz(p, k).zh : tsvetIz(p, k).m),
    iskomyy: ruchki ? 'ручка' : 'фломастер',
  };
}

const otvetTriTsveta = (p: Params) => tochnee(veroyatnost(p, 'p1') + veroyatnost(p, 'p2') - 1);

/**
 * Три вида предметов X, Y, Z. Дано P(X или Y) = p1 и P(Z или Y) = p2;
 * найти P(Y). Подвох — сумма p1 + p2 больше 1: Y посчитан дважды,
 * а X + Y + Z = 1, поэтому P(Y) = p1 + p2 − 1.
 */
export const PV4_TRI_TSVETA: Prototype = {
  id: 'pv4-tri-tsveta',
  blok: 'povyshennye',
  nazvanie: 'Три цвета: $P(X+Y)$ и $P(Z+Y)$ → $P(Y)$',
  tip: 'Сложение вероятностей',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const t = predmet(p);
    const spisok = `${tsvetIz(p, 'y').mn}, ${tsvetIz(p, 'x').mn} и ${tsvetIz(p, 'z').mn}`;
    return `${text(p, 'gde')} в одной коробке лежат вперемешку ${t.lezhat(spisok)}, одинаковые на вид. Покупатель случайным образом выбирает ${t.odin}. Вероятность того, что ${t.ona} окажется ${t.kakoy('x')} или ${t.kakoy('y')}, равна ${dec(veroyatnost(p, 'p1'))}, а того, что ${t.ona} окажется ${t.kakoy('z')} или ${t.kakoy('y')}, равна ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что ${t.iskomyy} окажется ${t.kakoy('y')}.`;
  },
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const o = otvetTriTsveta(p);
    const raznye = new Set([text(p, 'x'), text(p, 'y'), text(p, 'z')]).size === 3;
    return raznye && p1 < 1 && p2 < 1 && o > 0 && o < Math.min(p1, p2) && konechnaya(o);
  },
  otvet: otvetTriTsveta,
  /* Второй путь — сто предметов: X = 100 − (Z + Y), Z = 100 − (X + Y), Y = 100 − X − Z. */
  perebor: (p) => {
    const xy = shtuk(veroyatnost(p, 'p1'), 100);
    const zy = shtuk(veroyatnost(p, 'p2'), 100);
    const x = 100 - zy;
    const z = 100 - xy;
    return (100 - x - z) / 100;
  },
  shagi: (p) => {
    const t = predmet(p);
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const px = tochnee(1 - p2);
    const pz = tochnee(1 - p1);
    return [
      {
        etap: 'Связь событий',
        text: `Цветов три, и вместе их вероятности дают 1. Поэтому «${t.kakoy('z')} или ${t.kakoy('y')}» противоположно «${t.kakoy('x')}», а «${t.kakoy('x')} или ${t.kakoy('y')}» — «${t.kakoy('z')}».`,
      },
      {
        etap: 'Противоположное событие',
        text: `Вероятности ${tsvetIz(p, 'x').rod} и ${tsvetIz(p, 'z').rod} цвета:`,
        formula: `P_1 = 1 - ${tex(p2)} = ${tex(px)},\\qquad P_2 = 1 - ${tex(p1)} = ${tex(pz)}`,
      },
      {
        etap: 'Ответ',
        text: 'Искомая вероятность — всё, кроме двух других цветов:',
        formula: `P = 1 - ${tex(px)} - ${tex(pz)} = ${tex(otvetTriTsveta(p))}`,
        value: otvetTriTsveta(p),
      },
    ];
  },
  podskazka: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return [
      vopros('Почему сумма данных вероятностей больше 1?', 'Искомый цвет входит в оба события', [
        'События несовместны',
        'Так не бывает — в условии ошибка',
      ]),
      vopros(
        'Какое выражение даёт ответ?',
        `$${tex(p1)} + ${tex(p2)} - 1$`,
        [`$${tex(p1)} \\cdot ${tex(p2)}$`, `$${tex(p1)} - ${tex(p2)}$`, `$1 - ${tex(p1)}$`],
        'Каждый из двух других цветов — дополнение одного из данных событий.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Сумма очков достигла s: сколько было бросков ──────────── */

/** Все упорядоченные разбиения s на слагаемые 1…6 (s ≤ 6 — любые). */
function razbieniya(s: number): number[][] {
  if (s === 0) return [[]];
  const out: number[][] = [];
  for (let a = 1; a <= Math.min(6, s); a += 1)
    for (const r of razbieniya(s - a)) out.push([a, ...r]);
  return out;
}

/** P(сумма в какой-то момент равна s и бросков ровно k) — по числу бросков. */
function poBroskam(s: number): number[] {
  const w: number[] = [];
  for (let k = 1; k <= s; k += 1) w.push(soch(s - 1, k - 1) / 6 ** k);
  return w;
}

const broskov = (k: number) => `${k} ${skl(k, 'бросок', 'броска', 'бросков')}`;

/**
 * Кубик бросают N раз; известно, что в какой-то момент сумма очков
 * стала равна s (s ≤ 6). Вероятность, что к этому моменту было
 * сделано ровно k бросков, до сотых. Подвох — исходы «сумма s за j
 * бросков» не равновозможны: у каждого свой вес (1/6)ʲ.
 */
export const PV5_SUMMA_OCHKOV: Prototype = {
  id: 'pv5-summa-ochkov',
  blok: 'povyshennye',
  nazvanie: 'Сумма очков достигла $s$: ровно $k$ бросков',
  tip: 'Вероятность при условии',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const s = num(p, 's');
    const k = num(p, 'k');
    return `Правильный игральный кубик бросили ${num(p, 'N')} раз. Известно, что в какой-то момент сумма выпавших при бросаниях очков оказалась равна ${s}. Какова вероятность того, что к этому моменту было сделано ровно ${k === 1 ? 'один бросок' : broskov(k)}? Ответ округлите до сотых.`;
  },
  dopustimo: (p) => {
    const s = num(p, 's');
    const k = num(p, 'k');
    return s >= 2 && s <= 6 && k >= 1 && k <= s && num(p, 'N') >= s;
  },
  otvet: (p) => {
    const w = poBroskam(num(p, 's'));
    return round(w[num(p, 'k') - 1]! / w.reduce((a, b) => a + b, 0), 2);
  },
  /* Второй путь — перебор всех последовательностей бросков с суммой s и их весов. */
  perebor: (p) => {
    const k = num(p, 'k');
    let vse = 0;
    let blago = 0;
    for (const r of razbieniya(num(p, 's'))) {
      const ves = 1 / 6 ** r.length;
      vse += ves;
      if (r.length === k) blago += ves;
    }
    return round(blago / vse, 2);
  },
  shagi: (p) => {
    const s = num(p, 's');
    const k = num(p, 'k');
    const w = poBroskam(s);
    const kol = w.map((_, j) => soch(s - 1, j));
    /* Общий знаменатель 6^s: вес j бросков — C(s−1, j−1)·6^(s−j). */
    const chisla = kol.map((c, j) => c * 6 ** (s - (j + 1)));
    const vse = chisla.reduce((a, b) => a + b, 0);
    const otv = round(chisla[k - 1]! / vse, 2);
    return [
      {
        etap: 'Все исходы',
        text: `Сумма ${s} могла набраться за 1, 2, …, ${s} бросков. Число последовательностей из $j$ бросков с суммой ${s} — столько, сколькими способами ${s} раскладывается на $j$ слагаемых по порядку; вероятность каждой — $(1/6)^j$:`,
        formula: kol
          .map((c, j) => `j=${j + 1}:\\ ${c}\\cdot\\left(\\tfrac16\\right)^{${j + 1}}`)
          .join(',\\quad '),
      },
      {
        etap: 'Количества',
        text: `Домножим всё на $6^{${s}}$ — отношения не изменятся:`,
        formula: chisla.join(' + ') + ` = ${vse}`,
        value: vse,
      },
      {
        etap: 'Ответ',
        text: `Доля случаев, где бросков ровно ${k}:`,
        formula: `P = \\dfrac{${chisla[k - 1]}}{${vse}} \\approx ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const s = num(p, 's');
    return [
      vopros(
        'Равновозможны ли случаи «сумма за 1 бросок», «за 2 броска» и т. д.?',
        'Нет: у каждой последовательности из $j$ бросков вероятность $(1/6)^j$',
        ['Да, все равновозможны', `Да, их ${s}`],
      ),
      vopros(
        `Сколькими способами получить сумму ${s} за два броска?`,
        `$${s - 1}$`,
        [`$${s}$`, '$6$'].filter((x) => x !== `$${s - 1}$`),
        `Первый бросок — от 1 до ${s - 1}, второй определяется.`,
      ),
      zapisShag('десятичная', 2),
    ];
  },
  varianty: [],
};

/* ── №4. Такси: машина «другой» раскраски ──────────────────────── */

const RASKRASKI: Record<string, [string, string]> = {
  /* [цвет кузова, цвет надписей] у первой группы; у второй — наоборот. */
  'chern-zhelt': ['чёрного', 'жёлт'],
  'bel-sin': ['белого', 'син'],
  'ser-krasn': ['серого', 'красн'],
  'zel-bel': ['зелёного', 'бел'],
};

/** «жёлт» → «жёлтого» / «жёлтыми», «син» → «синего» / «синими». */
const myagkiy = (o: string) => o === 'син';
const rod = (o: string) => `${o}${myagkiy(o) ? 'его' : 'ого'}`;
const tvor = (o: string) => `${o}${myagkiy(o) ? 'ими' : 'ыми'}`;
/** Основа из родительного «чёрного» → «чёрн». */
const osnova = (r: string) => r.replace(/(ого|его)$/, '');

function raskraska(p: Params) {
  const r = RASKRASKI[text(p, 'raskraska')];
  if (r === undefined) throw new Error(`pv4-taksi: нет раскраски ${text(p, 'raskraska')}`);
  const [kuzov1, nadp1] = r;
  const o1 = osnova(kuzov1);
  return {
    pervye: `${kuzov1} цвета с ${tvor(nadp1)} надписями на бортах`,
    vtorye: `${rod(nadp1)} цвета с ${tvor(o1)} надписями`,
  };
}

const otvetTaksi = (p: Params) =>
  tochnee((num(p, 'vtoroy') === 1 ? num(p, 'n') - num(p, 'k') : num(p, 'k')) / num(p, 'n'));

/**
 * n машин, k одной раскраски, остальные — другой; найти вероятность
 * приезда машины второй (или первой) раскраски. Подвох — в условии дано
 * число машин первой раскраски, а спрашивают про вторую: n − k.
 */
export const PV4_TAKSI: Prototype = {
  id: 'pv4-taksi',
  blok: 'povyshennye',
  nazvanie: 'Такси двух раскрасок: приедет машина второй раскраски',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const r = raskraska(p);
    const isk = num(p, 'vtoroy') === 1 ? r.vtorye : r.pervye.replace(' на бортах', '');
    return `В фирме такси в наличии ${n} ${skl(n, 'легковой автомобиль', 'легковых автомобиля', 'легковых автомобилей')}: ${k} ${r.pervye}, остальные — ${r.vtorye}. Найдите вероятность того, что на случайный вызов приедет машина ${isk}.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const o = otvetTaksi(p);
    return k >= 1 && k < n && n <= 200 && o > 0 && o < 1 && konechnaya(o);
  },
  otvet: otvetTaksi,
  /* Второй путь — обход парка: каждая машина приезжает с вероятностью 1/n. */
  perebor: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    let m = 0;
    for (let i = 0; i < n; i += 1) if (i >= k === (num(p, 'vtoroy') === 1)) m += 1;
    return tochnee(m / n);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const m = num(p, 'vtoroy') === 1 ? n - k : k;
    return [
      {
        etap: 'Все исходы',
        text: 'Приехать может любая машина фирмы — с равными шансами:',
        formula: `n = ${n}`,
        value: n,
      },
      num(p, 'vtoroy') === 1
        ? {
            etap: 'Благоприятные исходы',
            text: 'Машин нужной раскраски — все, кроме названных первыми:',
            formula: `m = ${n} - ${k} = ${m}`,
            value: m,
          }
        : {
            etap: 'Благоприятные исходы',
            text: 'Машин нужной раскраски столько, сколько названо первыми:',
            formula: `m = ${m}`,
            value: m,
          },
      shagP(m, n),
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const m = num(p, 'vtoroy') === 1 ? n - k : k;
    return [
      vopros(
        'Сколько машин нужной раскраски?',
        `$${m}$`,
        [`$${n - m}$`, `$${n}$`],
        'Перечитайте, про какие машины спрашивают.',
      ),
      vopros('Какое выражение даёт ответ?', `$\\dfrac{${m}}{${n}}$`, [
        `$\\dfrac{${n - m}}{${n}}$`,
        `$\\dfrac{${m}}{${n - m}}$`,
      ]),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Схема Бернулли: k попаданий из n ──────────────────────── */

function strelba(p: Params): { kto: string; chto: string } {
  return text(p, 'syuzhet') === 'tir'
    ? { kto: 'Посетитель тира', chto: 'посетитель тира' }
    : { kto: 'Биатлонист', chto: 'биатлонист' };
}

const bernulli = (n: number, k: number, q: number) => soch(n, k) * q ** k * (1 - q) ** (n - k);

/**
 * n выстрелов по n мишеням, вероятность попадания p; найти вероятность
 * ровно k попаданий, до сотых. Подвох — промахи считаются вероятностью
 * 1 − p, а попадания могут прийтись на любые k мишеней из n: C(n, k).
 */
export const PV5_BERNULLI: Prototype = {
  id: 'pv5-bernulli',
  blok: 'povyshennye',
  nazvanie: 'Схема Бернулли: ровно $k$ попаданий из $n$',
  tip: 'Независимые события',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const s = strelba(p);
    const raz = (x: number) => `${x} ${skl(x, 'раз', 'раза', 'раз')}`;
    return `${s.kto} по одному разу стреляет по ${n} ${skl(n, 'мишени', 'мишеням', 'мишеням')}. Вероятность попадания в мишень при одном выстреле равна ${dec(veroyatnost(p, 'p'))}. Найдите вероятность того, что ${s.chto} ${raz(k)} попадёт в мишени и ${n - k === 1 ? 'один раз' : raz(n - k)} промахнётся. Результат округлите до сотых.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    return n >= 2 && n <= 8 && k >= 1 && k < n && q > 0 && q < 1;
  },
  otvet: (p) => round(bernulli(num(p, 'n'), num(p, 'k'), veroyatnost(p, 'p')), 2),
  /* Второй путь — перебор всех 2ⁿ исходов серии выстрелов. */
  perebor: (p) => {
    const n = num(p, 'n');
    const q = veroyatnost(p, 'p');
    let s = 0;
    for (let mask = 0; mask < 2 ** n; mask += 1) {
      let hits = 0;
      let w = 1;
      for (let i = 0; i < n; i += 1) {
        if ((mask >> i) & 1) {
          hits += 1;
          w *= q;
        } else w *= 1 - q;
      }
      if (hits === num(p, 'k')) s += w;
    }
    return round(s, 2);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    const odna = tochnee(q ** k * (1 - q) ** (n - k));
    const c = soch(n, k);
    const otv = round(c * odna, 2);
    return [
      {
        etap: 'Путь по дереву',
        text: `Выстрелы независимы. Одна конкретная серия — например, первые ${k} попадания, остальные промахи — имеет вероятность`,
        formula: `${tex(q)}^{${k}}\\cdot ${tex(tochnee(1 - q))}^{${n - k}} = ${tex(odna)}`,
        value: odna,
      },
      {
        etap: 'Количества',
        text: `Промахи могут прийтись на любые ${n - k} из ${n} мишеней — таких серий`,
        formula: `C_{${n}}^{${n - k}} = ${c}`,
        value: c,
      },
      {
        etap: 'Ответ',
        text: 'Серии несовместны — вероятности складываются:',
        formula: `P = ${c}\\cdot ${tex(odna)} = ${tex(tochnee(c * odna))} \\approx ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    return [
      vopros(
        'Сколько разных серий дают ровно нужное число попаданий?',
        `$${soch(n, k)}$`,
        ['$1$', `$${n * k}$`].filter((x) => x !== `$${soch(n, k)}$`),
        `Выбираем, на какие ${n - k} мишени из ${n} пришлись промахи.`,
      ),
      zapisShag('десятичная', 2),
    ];
  },
  varianty: [],
};

/* ══ Партия 4 (варианты 19–24) ══════════════════════════════════ */

/** Округление до сотых, если ответ длиннее двух знаков; иначе точно. */
const doSotyh = (x: number) => (Math.abs(x * 100 - Math.round(x * 100)) < 1e-7 ? null : 2);
const poUsloviyu = (x: number) => (doSotyh(x) === null ? tochnee(x) : round(tochnee(x), 2));
const okrFraza = (x: number) => (doSotyh(x) === null ? '' : ' Ответ округлите до сотых.');

/** n! — для перестановок до 8 участников. */
function fakt(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i += 1) f *= i;
  return f;
}

/** Все перестановки 0…n−1. */
function perestanovki(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const rest of perestanovki(n - 1)) {
    for (let i = 0; i <= rest.length; i += 1)
      out.push([...rest.slice(0, i), n - 1, ...rest.slice(i)]);
  }
  return out;
}

/** Имена из параметров: i1, i2, … до первого отсутствующего. */
function imena(p: Params): string[] {
  const out: string[] = [];
  for (let i = 1; typeof p[`i${i}`] === 'string'; i += 1) out.push(text(p, `i${i}`));
  return out;
}

/** «A, B и C». */
const iSpisok = (xs: readonly string[]) =>
  xs.length === 1 ? xs[0]! : `${xs.slice(0, -1).join(', ')} и ${xs.at(-1)}`;

/* ── №4. Порядок выступлений по жребию ───────────────────────────── */

/**
 * Условие на порядок названных участников (их m, остальные не важны):
 *  posle   — первый выступит позже всех остальных названных, 1/m;
 *  cepochka — названные выступят ровно в перечисленном порядке, 1/m!;
 *  mezhdu  — первый выступит между вторым и третьим (в любом порядке), 1/3;
 *  pary    — в каждой паре (1-й, 2-й), (3-й, 4-й)… первый раньше второго, 1/2^(m/2).
 */
function poryadokVerno(vid: string, m: number, perm: readonly number[]): boolean {
  const pos = (i: number) => perm.indexOf(i);
  if (vid === 'posle')
    return Array.from({ length: m - 1 }, (_, i) => i + 1).every((i) => pos(0) > pos(i));
  if (vid === 'cepochka')
    return Array.from({ length: m - 1 }, (_, i) => i).every((i) => pos(i) < pos(i + 1));
  if (vid === 'mezhdu') return (pos(1) - pos(0)) * (pos(2) - pos(0)) < 0;
  return Array.from({ length: m / 2 }, (_, j) => j).every((j) => pos(2 * j) < pos(2 * j + 1));
}

function poryadokTochno(vid: string, m: number): number {
  if (vid === 'posle') return 1 / m;
  if (vid === 'cepochka') return 1 / fakt(m);
  if (vid === 'mezhdu') return 1 / 3;
  return 1 / 2 ** (m / 2);
}

function poryadokTekst(vid: string, im: readonly string[]): string {
  if (vid === 'posle') return `${im[0]} выступит позже, чем ${iSpisok(im.slice(1))}`;
  if (vid === 'cepochka')
    return `${iSpisok(im)} выступят именно в таком порядке (не обязательно друг за другом)`;
  if (vid === 'mezhdu')
    return `${im[0]} выступит после одного, но раньше другого из двух участников: ${im[1]} и ${im[2]}`;
  const pary = Array.from({ length: im.length / 2 }, (_, j) =>
    j === 0
      ? `${im[0]} выступит раньше, чем ${im[1]}`
      : `${im[2 * j]} — раньше, чем ${im[2 * j + 1]}`,
  );
  return pary.length === 1 ? pary[0]! : `${pary.slice(0, -1).join(', ')}, а ${pary.at(-1)}`;
}

export const PV4_PORYADOK: Prototype = {
  id: 'pv4-poryadok',
  blok: 'povyshennye',
  nazvanie: 'Порядок выступлений по жребию: условие на взаимный порядок названных',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: (p) => doSotyh(poryadokTochno(text(p, 'vid'), imena(p).length)),
  uslovie: (p) => {
    const im = imena(p);
    const x = poryadokTochno(text(p, 'vid'), im.length);
    return `${text(p, 'gde')} — среди них ${iSpisok(im)}. Порядок выступлений определяется жребием. Какова вероятность того, что ${poryadokTekst(text(p, 'vid'), im)}?${okrFraza(x)}`;
  },
  dopustimo: (p) => {
    const vid = text(p, 'vid');
    const m = imena(p).length;
    return (
      ['posle', 'cepochka', 'mezhdu', 'pary'].includes(vid) &&
      m >= 2 &&
      m <= 6 &&
      (vid !== 'mezhdu' || m === 3) &&
      (vid !== 'pary' || m % 2 === 0)
    );
  },
  otvet: (p) => poUsloviyu(poryadokTochno(text(p, 'vid'), imena(p).length)),
  /* Второй путь — перебор всех порядков названных участников (остальные на взаимный порядок не влияют). */
  perebor: (p) => {
    const m = imena(p).length;
    const vse = perestanovki(m);
    const da = vse.filter((perm) => poryadokVerno(text(p, 'vid'), m, perm)).length;
    return poUsloviyu(da / vse.length);
  },
  shagi: (p) => {
    const vid = text(p, 'vid');
    const im = imena(p);
    const m = im.length;
    const vse = fakt(m);
    const da = Math.round(poryadokTochno(vid, m) * vse);
    const x = poryadokTochno(vid, m);
    return [
      {
        etap: 'Все исходы',
        text: `Остальные участники на ответ не влияют: важен только взаимный порядок названных. Все порядки ${m} названных равновозможны, их`,
        formula: `${m}! = ${vse}`,
        value: vse,
      },
      {
        etap: 'Благоприятные исходы',
        text:
          vid === 'posle'
            ? `Подходят порядки, где ${im[0]} — последний из названных; остальные ${m - 1} стоят перед ним в любом порядке:`
            : vid === 'cepochka'
              ? 'Подходит ровно один порядок — перечисленный:'
              : vid === 'mezhdu'
                ? `${im[0]} должен стоять посередине из трёх; крайние места двое занимают в любом порядке:`
                : 'В каждой паре годится один порядок из двух, пары независимы:',
        formula:
          vid === 'posle'
            ? `${m - 1}! = ${da}`
            : vid === 'cepochka'
              ? '1'
              : vid === 'mezhdu'
                ? '2! = 2'
                : `\\dfrac{${vse}}{2^{${m / 2}}} = ${da}`,
        value: da,
      },
      {
        etap: 'Ответ',
        text: 'Вероятность — доля благоприятных порядков:',
        formula: `P = \\dfrac{${da}}{${vse}} ${doSotyh(x) === null ? '=' : '\\approx'} ${tex(poUsloviyu(x))}`,
        value: poUsloviyu(x),
      },
    ];
  },
  podskazka: (p) => {
    const m = imena(p).length;
    return [
      vopros(
        'Порядки каких участников нужно перебирать?',
        'Только названных в условии',
        ['Всех участников', 'Только первых трёх по жребию'],
        'Остальные не влияют на то, кто из названных раньше.',
      ),
      vopros('Сколько всего порядков у названных?', `$${fakt(m)}$`, [`$${m}$`, `$${2 ** m}$`]),
      zapisShag('десятичная', doSotyh(poryadokTochno(text(p, 'vid'), m))),
    ];
  },
  varianty: [],
};

/* ── №4. Три исхода: два даны — третий через сумму 1 ─────────────── */

/**
 * Событие разбито на три несовместных исхода, вероятности двух даны —
 * найти третий: 1 − p₁ − p₂. vid 'promezhutok': ниже t₁ / выше t₂ →
 * от t₁ до t₂; vid 'tsveta': два цвета → третий. Подвох — исходы
 * несовместны и вместе дают 1, вычитать нужно оба.
 */
export const PV4_TRI_ISHODA: Prototype = {
  id: 'pv4-tri-ishoda',
  blok: 'povyshennye',
  nazvanie: 'Три несовместных исхода: два даны, третий через сумму $1$',
  tip: 'Противоположное событие',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    text(p, 'vid') === 'promezhutok'
      ? `${text(p, 'gde')} Вероятность того, что ${text(p, 'chto')} окажется меньше ${num(p, 't1')} ${text(p, 'ed')}, равна ${dec(veroyatnost(p, 'p1'))}. Вероятность того, что ${text(p, 'chto')} окажется больше ${num(p, 't2')} ${text(p, 'ed')}, равна ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что ${text(p, 'chto')} окажется в пределах от ${num(p, 't1')} до ${num(p, 't2')} ${text(p, 'ed')}.`
      : `${text(p, 'gde')} Вероятность того, что ${text(p, 'chto')} окажется ${text(p, 'c1')}, равна ${dec(veroyatnost(p, 'p1'))}, а того, что ${text(p, 'c2')}, — ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что ${text(p, 'chto')} окажется ${text(p, 'c3')}.`,
  dopustimo: (p) => {
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    return a > 0 && b > 0 && a + b < 1 && celoeProtsentov(a, 100) && celoeProtsentov(b, 100);
  },
  otvet: (p) => tochnee(1 - veroyatnost(p, 'p1') - veroyatnost(p, 'p2')),
  /* Второй путь — 100 равновозможных «исходов-процентов»: сколько не попали ни в первый, ни во второй. */
  perebor: (p) => {
    const a = Math.round(veroyatnost(p, 'p1') * 100);
    const b = Math.round(veroyatnost(p, 'p2') * 100);
    let ostalos = 0;
    for (let i = 0; i < 100; i += 1) if (i >= a + b) ostalos += 1;
    return tochnee(ostalos / 100);
  },
  shagi: (p) => {
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    const otv = tochnee(1 - a - b);
    return [
      {
        etap: 'Связь событий',
        text: 'Три исхода не пересекаются и вместе покрывают все случаи — их вероятности в сумме дают единицу.',
      },
      {
        etap: 'Ответ',
        text: 'Из единицы вычитаем оба известных исхода:',
        formula: `P = 1 - ${tex(a)} - ${tex(b)} = ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    return [
      vopros(
        'Чему равна сумма вероятностей всех трёх исходов?',
        '$1$',
        [`$${tex(tochnee(a + b))}$`, '$0$'],
        'Исходы несовместны и других случаев нет.',
      ),
      vopros('Какое выражение даёт ответ?', `$1-${tex(a)}-${tex(b)}$`, [
        `$${tex(a)}+${tex(b)}$`,
        `$1-${tex(a)}$`,
      ]),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №4. Два друга при делении на равные группы ─────────────────── */

const drugaVmeste = (n: number, g: number) => (n / g - 1) / (n - 1);

/**
 * n человек делят на g равных групп. Вероятность, что два друга окажутся
 * в одной группе (vmeste = 1) или в разных (vmeste = 0). Подвох — для
 * второго друга мест в группе первого n/g − 1 из n − 1, а не n/g из n.
 */
export const PV4_DVA_DRUGA: Prototype = {
  id: 'pv4-dva-druga',
  blok: 'povyshennye',
  nazvanie: 'Деление на равные группы: два друга в одной или в разных',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: (p) => doSotyh(otvetDruzey(p)),
  uslovie: (p) => {
    const n = num(p, 'n');
    const g = num(p, 'g');
    const x = otvetDruzey(p);
    const slovo = ['', '', 'две', 'три', 'четыре', 'пять', 'шесть'][g] ?? String(g);
    return `${text(p, 'gde')} ${n} ${skl(n, 'человек', 'человека', 'человек')}, среди них ${text(p, 'i1')} и ${text(p, 'i2')}. Всех случайным образом разбивают на ${slovo} равные группы. Найдите вероятность того, что ${text(p, 'i1')} и ${text(p, 'i2')} окажутся ${num(p, 'vmeste') === 1 ? 'в одной группе' : 'в разных группах'}.${okrFraza(x)}`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const g = num(p, 'g');
    return g >= 2 && g <= 6 && n % g === 0 && n / g >= 2 && n <= 60;
  },
  otvet: (p) => poUsloviyu(otvetDruzey(p)),
  /* Второй путь — через сочетания: друзья вместе — выбираем группу и ещё n/g − 2 человека в неё. */
  perebor: (p) => {
    const n = num(p, 'n');
    const g = num(p, 'g');
    /* Доля разбиений, где оба в первой группе, умноженная на число групп. */
    const v = (g * soch(n - 2, n / g - 2)) / soch(n, n / g);
    return poUsloviyu(num(p, 'vmeste') === 1 ? v : 1 - v);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const g = num(p, 'g');
    const k = n / g;
    const x = otvetDruzey(p);
    return [
      {
        etap: 'Все исходы',
        text: `${text(p, 'i1')} уже в какой-то группе. Для ${text(p, 'i2')} равновозможны все оставшиеся места:`,
        formula: `n = ${n} - 1 = ${n - 1}`,
        value: n - 1,
      },
      {
        etap: 'Благоприятные исходы',
        text:
          num(p, 'vmeste') === 1
            ? 'Подходят свободные места в группе первого друга:'
            : 'Подходят места в других группах — все, кроме свободных мест в группе первого:',
        formula:
          num(p, 'vmeste') === 1 ? `m = ${k} - 1 = ${k - 1}` : `m = ${n - 1} - ${k - 1} = ${n - k}`,
        value: num(p, 'vmeste') === 1 ? k - 1 : n - k,
      },
      {
        etap: 'Ответ',
        text: 'Вероятность — доля благоприятных мест:',
        formula: `P = \\dfrac{${num(p, 'vmeste') === 1 ? k - 1 : n - k}}{${n - 1}} ${doSotyh(x) === null ? '=' : '\\approx'} ${tex(poUsloviyu(x))}`,
        value: poUsloviyu(x),
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const k = n / num(p, 'g');
    return [
      vopros(
        'Сколько свободных мест в группе первого друга?',
        `$${k - 1}$`,
        [`$${k}$`, `$${n - 1}$`],
        'Одно место в его группе занял он сам.',
      ),
      vopros('Из скольких мест равновозможно выбирается место второго друга?', `$${n - 1}$`, [
        `$${n}$`,
        `$${k}$`,
      ]),
      zapisShag('десятичная', doSotyh(otvetDruzey(p))),
    ];
  },
  varianty: [],
};

function otvetDruzey(p: Params): number {
  const v = drugaVmeste(num(p, 'n'), num(p, 'g'));
  return num(p, 'vmeste') === 1 ? v : 1 - v;
}

/* ── №5. Отношение вероятностей «ровно k» и «ровно k − 1» ─────────── */

const otnoshenieBernulli = (n: number, k: number, q: number) => ((n - k + 1) / k) * (q / (1 - q));

/**
 * Серия из n независимых попыток с вероятностью успеха p: во сколько раз
 * вероятность ровно k успехов больше вероятности ровно k − 1. Подвох —
 * степени p и (1 − p) сокращаются, остаются C(n, k)/C(n, k − 1) и p/(1 − p).
 */
export const PV5_BERNULLI_OTNOSHENIE: Prototype = {
  id: 'pv5-bernulli-otnoshenie',
  blok: 'povyshennye',
  nazvanie: 'Схема Бернулли: отношение вероятностей «ровно $k$» и «ровно $k-1$»',
  tip: 'Независимые события',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: (p) => doSotyh(otnoshenieBernulli(num(p, 'n'), num(p, 'k'), veroyatnost(p, 'p'))),
  uslovie: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const x = otnoshenieBernulli(n, k, veroyatnost(p, 'p'));
    const s = text(p, 'syuzhet');
    const nachalo =
      s === 'semena'
        ? `Садовод посеял ${n} ${skl(n, 'семечко', 'семечка', 'семечек')} тыквы. Вероятность того, что отдельное семечко взойдёт, равна ${dec(veroyatnost(p, 'p'))}, всходы независимы.`
        : s === 'volleybol'
          ? `Волейболист подаёт мяч ${n} ${skl(n, 'раз', 'раза', 'раз')}. Вероятность того, что отдельная подача будет удачной, равна ${dec(veroyatnost(p, 'p'))}.`
          : `Лучник выпускает по мишени ${n} ${skl(n, 'стрелу', 'стрелы', 'стрел')}. Вероятность попадания при каждом выстреле равна ${dec(veroyatnost(p, 'p'))}.`;
    const sob = (m: number) =>
      s === 'semena'
        ? `«взойдут ровно ${m} ${skl(m, 'семечко', 'семечка', 'семечек')}»`
        : s === 'volleybol'
          ? `«ровно ${m} ${skl(m, 'удачная подача', 'удачные подачи', 'удачных подач')}»`
          : `«ровно ${m} ${skl(m, 'попадание', 'попадания', 'попаданий')}»`;
    return `${nachalo} Во сколько раз вероятность события ${sob(k)} больше вероятности события ${sob(k - 1)}?${okrFraza(x)}`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    return (
      n >= 3 && n <= 10 && k >= 1 && k <= n && q > 0 && q < 1 && otnoshenieBernulli(n, k, q) > 1
    );
  },
  otvet: (p) => poUsloviyu(otnoshenieBernulli(num(p, 'n'), num(p, 'k'), veroyatnost(p, 'p'))),
  /* Второй путь — обе вероятности перебором 2ⁿ серий, затем частное. */
  perebor: (p) => {
    const n = num(p, 'n');
    const q = veroyatnost(p, 'p');
    const P = [0, 0];
    for (let mask = 0; mask < 2 ** n; mask += 1) {
      let hits = 0;
      let w = 1;
      for (let i = 0; i < n; i += 1) {
        if ((mask >> i) & 1) {
          hits += 1;
          w *= q;
        } else w *= 1 - q;
      }
      if (hits === num(p, 'k')) P[0] = (P[0] ?? 0) + w;
      if (hits === num(p, 'k') - 1) P[1] = (P[1] ?? 0) + w;
    }
    return poUsloviyu(P[0]! / P[1]!);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const q = veroyatnost(p, 'p');
    const x = otnoshenieBernulli(n, k, q);
    const c1 = soch(n, k);
    const c0 = soch(n, k - 1);
    return [
      {
        etap: 'Путь по дереву',
        text: `Вероятность ровно $m$ успехов из ${n}: число серий $C_{${n}}^{m}$, умноженное на вероятность одной серии. Записываем обе вероятности:`,
        formula: `P_{${k}} = C_{${n}}^{${k}}\\cdot ${tex(q)}^{${k}}\\cdot ${tex(tochnee(1 - q))}^{${n - k}},\\qquad P_{${k - 1}} = C_{${n}}^{${k - 1}}\\cdot ${tex(q)}^{${k - 1}}\\cdot ${tex(tochnee(1 - q))}^{${n - k + 1}}`,
      },
      {
        etap: 'Количества',
        text: 'В частном степени сокращаются — остаются отношение чисел серий и одна дробь:',
        formula: `\\dfrac{P_{${k}}}{P_{${k - 1}}} = \\dfrac{${c1}}{${c0}}\\cdot\\dfrac{${tex(q)}}{${tex(tochnee(1 - q))}}`,
      },
      {
        etap: 'Ответ',
        text: 'Считаем:',
        formula: `\\dfrac{P_{${k}}}{P_{${k - 1}}} ${doSotyh(x) === null ? '=' : '\\approx'} ${tex(poUsloviyu(x))}`,
        value: poUsloviyu(x),
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    return [
      vopros(
        `Сколько серий дают ровно ${k} успехов?`,
        `$${soch(n, k)}$`,
        ['$1$', `$${n}$`].filter((x) => x !== `$${soch(n, k)}$`),
        `Выбираем, какие ${k} из ${n} попыток удались.`,
      ),
      vopros('Что остаётся от степеней вероятностей после деления?', `$\\dfrac{p}{1-p}$`, [
        '$p$',
        '$p^2$',
      ]),
      zapisShag('десятичная', doSotyh(otnoshenieBernulli(n, k, veroyatnost(p, 'p')))),
    ];
  },
  varianty: [],
};

/* ── №5. Мишени, на каждую — до двух выстрелов ──────────────────── */

/**
 * N мишеней, по каждой стреляют до поражения, но не больше двух раз:
 * p₁ — первым выстрелом, p₂ — вторым. Вероятность поразить ровно k
 * мишеней. Подвох — сначала вероятность поразить одну мишень
 * p = p₁ + (1 − p₁)·p₂, затем схема Бернулли по мишеням.
 */
const odnaMishen = (p: Params) =>
  veroyatnost(p, 'p1') + (1 - veroyatnost(p, 'p1')) * veroyatnost(p, 'p2');

export const PV5_MISHENI_DVA_VYSTRELA: Prototype = {
  id: 'pv5-misheni-dva-vystrela',
  blok: 'povyshennye',
  nazvanie: 'Мишени по два выстрела: ровно $k$ поражённых из $N$',
  tip: 'Независимые события',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const dat = ['', '', 'двум', 'трём', 'четырём'][N] ?? String(N);
    const rod = ['', '', 'двух', 'трёх', 'четырёх'][N] ?? String(N);
    const skolko =
      k === 1
        ? 'будет поражена ровно одна мишень'
        : `будут поражены ровно ${['', '', 'две', 'три'][k] ?? k} мишени`;
    return `${text(p, 'kto')} стреляет по ${dat} мишеням. По каждой мишени он стреляет до попадания, но не больше двух раз. Вероятность попадания первым выстрелом равна ${dec(veroyatnost(p, 'p1'))}, вторым — ${dec(veroyatnost(p, 'p2'))}. Найдите вероятность того, что ${skolko} из ${rod}.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const x = bernulli(N, k, odnaMishen(p));
    return (
      N >= 2 &&
      N <= 4 &&
      k >= 1 &&
      k < N &&
      konechnaya(tochnee(x)) &&
      String(tochnee(x)).length <= 7
    );
  },
  otvet: (p) => tochnee(bernulli(num(p, 'N'), num(p, 'k'), odnaMishen(p))),
  /* Второй путь — перебор исходов всех выстрелов: у мишени «первым», «вторым», «нет». */
  perebor: (p) => {
    const N = num(p, 'N');
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    const ishody = [
      { w: a, hit: 1 },
      { w: (1 - a) * b, hit: 1 },
      { w: (1 - a) * (1 - b), hit: 0 },
    ];
    let s = 0;
    for (let code = 0; code < 3 ** N; code += 1) {
      let w = 1;
      let hits = 0;
      let c = code;
      for (let i = 0; i < N; i += 1) {
        const o = ishody[c % 3]!;
        c = Math.floor(c / 3);
        w *= o.w;
        hits += o.hit;
      }
      if (hits === num(p, 'k')) s += w;
    }
    return tochnee(s);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    const q = tochnee(odnaMishen(p));
    const otv = tochnee(bernulli(N, k, q));
    return [
      {
        etap: 'Путь по дереву',
        text: 'Одна мишень поражена, если попал первый выстрел или первый мимо, а второй попал:',
        formula: `p = ${tex(a)} + ${tex(tochnee(1 - a))}\\cdot ${tex(b)} = ${tex(q)}`,
        value: q,
      },
      {
        etap: 'Количества',
        text: `Мишени независимы. Поражённые могут быть любыми ${k} из ${N} — таких наборов`,
        formula: `C_{${N}}^{${k}} = ${soch(N, k)}`,
        value: soch(N, k),
      },
      {
        etap: 'Ответ',
        text: 'Складываем вероятности несовместных наборов:',
        formula: `P = ${soch(N, k)}\\cdot ${tex(q)}^{${k}}\\cdot ${tex(tochnee(1 - q))}^{${N - k}} = ${tex(otv)}`,
        value: otv,
      },
    ];
  },
  podskazka: (p) => {
    const a = veroyatnost(p, 'p1');
    const b = veroyatnost(p, 'p2');
    const q = tochnee(odnaMishen(p));
    return [
      vopros(
        'С какой вероятностью поражена одна мишень?',
        `$${tex(q)}$`,
        [`$${tex(tochnee(a + b))}$`, `$${tex(tochnee(a * b))}$`].filter((x) => x !== `$${tex(q)}$`),
        'Попал первым — или промахнулся первым и попал вторым.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Сколько билетов купить, чтобы выигрыш был с вероятностью больше P ── */

/** Доля выигрышных билетов: каждый m-й (vid 'kazhdyy') или выигрышных на q % меньше, чем без выигрыша. */
function dolyaVyigrysha(p: Params): number {
  if (text(p, 'vid') === 'kazhdyy') return 1 / num(p, 'm');
  const w = 1 - num(p, 'q') / 100;
  return w / (1 + w);
}

function minBiletov(p: Params): number {
  const pr = 1 - dolyaVyigrysha(p);
  const P = veroyatnost(p, 'P');
  let n = 1;
  while (1 - pr ** n <= P + 1e-12) n += 1;
  return n;
}

/**
 * Наименьшее число билетов, чтобы хотя бы один выигрышный был с
 * вероятностью больше P. Подвох — считать через «ни одного выигрышного»:
 * (1 − p)ⁿ < 1 − P, а не складывать вероятности.
 */
export const PV5_BILETY: Prototype = {
  id: 'pv5-bilety',
  blok: 'povyshennye',
  nazvanie: 'Лотерея: наименьшее число билетов для выигрыша с вероятностью больше $P$',
  tip: 'Противоположное событие',
  sourceRange: [0, 0],
  format: 'целое',
  okruglenie: tochno,
  uslovie: (p) => {
    const nachalo =
      text(p, 'vid') === 'kazhdyy'
        ? `В ${text(p, 'gde')} выигрышным оказывается в среднем каждый ${num(p, 'm')}-й билет.`
        : `В ${text(p, 'gde')} выигрышных билетов на ${num(p, 'q')} % меньше, чем билетов без выигрыша.`;
    return `${nachalo} Какое наименьшее число билетов нужно купить, чтобы с вероятностью больше ${dec(veroyatnost(p, 'P'))} среди них нашёлся хотя бы один выигрышный?`;
  },
  dopustimo: (p) => {
    const P = veroyatnost(p, 'P');
    const d = dolyaVyigrysha(p);
    const n = minBiletov(p);
    /* Граница не на равенстве: (1 − d)ⁿ⁻¹ заметно больше 1 − P. */
    return (
      P > 0 &&
      P < 1 &&
      d > 0 &&
      d < 1 &&
      n >= 2 &&
      n <= 20 &&
      Math.abs((1 - d) ** (n - 1) - (1 - P)) > 1e-3
    );
  },
  otvet: minBiletov,
  /* Второй путь — точные дроби: (1 − d)ⁿ сравниваем с 1 − P без плавающей запятой. */
  perebor: (p) => {
    const [a, b] =
      text(p, 'vid') === 'kazhdyy' ? [num(p, 'm') - 1, num(p, 'm')] : [100, 200 - num(p, 'q')];
    const Pn = Math.round(veroyatnost(p, 'P') * 1000);
    for (let n = 1; n <= 40; n += 1) {
      /* (a/b)ⁿ < (1000 − Pn)/1000 ⇔ 1000·aⁿ < (1000 − Pn)·bⁿ. */
      if (1000n * BigInt(a) ** BigInt(n) < BigInt(1000 - Pn) * BigInt(b) ** BigInt(n)) return n;
    }
    return NaN;
  },
  shagi: (p) => {
    const d = dolyaVyigrysha(p);
    const pr = 1 - d;
    const P = veroyatnost(p, 'P');
    const n = minBiletov(p);
    const drob =
      text(p, 'vid') === 'kazhdyy'
        ? { w: `\\dfrac{1}{${num(p, 'm')}}`, l: `\\dfrac{${num(p, 'm') - 1}}{${num(p, 'm')}}` }
        : {
            w: `\\dfrac{${100 - num(p, 'q')}}{${200 - num(p, 'q')}}`,
            l: `\\dfrac{100}{${200 - num(p, 'q')}}`,
          };
    return [
      {
        etap: 'Противоположное событие',
        text: 'Вероятность выиграть одним билетом и вероятность проиграть:',
        formula: `p = ${drob.w},\\qquad 1-p = ${drob.l}`,
        value: d,
      },
      {
        etap: 'Связь событий',
        text: `Ни одного выигрышного среди $n$ билетов — с вероятностью $(1-p)^n$. Нужно, чтобы она стала меньше $1-${tex(P)}=${tex(tochnee(1 - P))}$:`,
        formula: `\\left(${drob.l}\\right)^{${n - 1}} \\approx ${tex(round(pr ** (n - 1), 3))} > ${tex(tochnee(1 - P))},\\qquad \\left(${drob.l}\\right)^{${n}} \\approx ${tex(round(pr ** n, 3))} < ${tex(tochnee(1 - P))}`,
      },
      {
        etap: 'Ответ',
        text: 'Наименьшее подходящее число билетов:',
        formula: `n = ${n}`,
        value: n,
      },
    ];
  },
  podskazka: (p) => [
    vopros(
      'Через какое событие удобнее считать?',
      'Ни одного выигрышного билета',
      ['Ровно один выигрышный', 'Все билеты выигрышные'],
      '«Хотя бы один» — противоположное к «ни одного».',
    ),
    vopros(
      'С какой вероятностью проигрывает один билет?',
      `$${tex(round(1 - dolyaVyigrysha(p), 3))}$`,
      [`$${tex(round(dolyaVyigrysha(p), 3))}$`, `$${tex(veroyatnost(p, 'P'))}$`].filter(
        (x) => x !== `$${tex(round(1 - dolyaVyigrysha(p), 3))}$`,
      ),
    ),
    zapisShag('целое', null),
  ],
  varianty: [],
};

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

/* ── №4. Запасная аудитория ─────────────────────────────────────── */

/**
 * N участников рассаживают: в k аудиториях по m человек, остальных — в
 * запасную. Найти вероятность попасть в запасную. Подвох — в запасную
 * идут не «одна аудитория из k + 1», а остаток N − k·m участников.
 */
export const PV4_ZAPASNAYA: Prototype = {
  id: 'pv4-zapasnaya',
  blok: 'povyshennye',
  nazvanie: 'Рассадка по аудиториям: попасть в запасную',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const m = num(p, 'm');
    return `${text(p, 'gde')} ${N} ${skl(N, 'участника', 'участников', 'участников')} распределяют по аудиториям: в ${k} ${skl(k, 'аудиторию', 'аудитории', 'аудиторий')} садятся по ${m} человек, а все остальные пишут работу в запасной аудитории в соседнем здании. Участник выбран случайно. Найдите вероятность того, что он окажется в запасной аудитории.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const ost = N - num(p, 'k') * num(p, 'm');
    return ost > 0 && ost < N && konechnaya(ost / N);
  },
  otvet: (p) => tochnee((num(p, 'N') - num(p, 'k') * num(p, 'm')) / num(p, 'N')),
  /* Второй путь — раздать номера мест по аудиториям и сосчитать запасные. */
  perebor: (p) => {
    const N = num(p, 'N');
    const zanyato = num(p, 'k') * num(p, 'm');
    let zap = 0;
    for (let i = 0; i < N; i += 1) if (i >= zanyato) zap += 1;
    return tochnee(zap / N);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const ost = N - k * m;
    return [
      {
        etap: 'Количества',
        text: 'Сначала узнаём, сколько человек в основных аудиториях, и вычитаем из всех участников:',
        formula: `${N} - ${k}\\cdot ${m} = ${ost}`,
        value: ost,
      },
      {
        etap: 'Ответ',
        text: 'Все участники равновозможны, вероятность — доля оставшихся:',
        formula: `P = \\dfrac{${ost}}{${N}} = ${tex(ost / N)}`,
        value: tochnee(ost / N),
      },
    ];
  },
  podskazka: (p) => {
    const N = num(p, 'N');
    const ost = N - num(p, 'k') * num(p, 'm');
    return [
      vopros(
        'Сколько участников пишут в запасной аудитории?',
        `$${ost}$`,
        [`$${num(p, 'm')}$`, `$${num(p, 'k') * num(p, 'm')}$`],
        'В запасную идут все, кому не хватило мест в основных аудиториях.',
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №4. Круглый стол ──────────────────────────────────────────── */

/** Названия групп: [один, два-четыре, много (род. мн.), творит. мн., им. мн.]. */
const GRUPPY: Record<string, readonly [string, string, string, string, string]> = {
  dev: ['девочка', 'девочки', 'девочек', 'девочками', 'девочки'],
  mal: ['мальчик', 'мальчика', 'мальчиков', 'мальчиками', 'мальчики'],
  gost: ['гость', 'гостя', 'гостей', 'гостями', 'гости'],
  sest: ['сестра', 'сестры', 'сестёр', 'сёстрами', 'сёстры'],
};

const gruppa = (p: Params, key: string) => {
  const g = GRUPPY[text(p, key)];
  if (g === undefined) throw new Error(`pv4-kruglyy-stol: нет группы ${text(p, key)}`);
  return g;
};

/** Сколько мест второму из двух особых, чтобы между ними было ровно j человек. */
function mestKruglyy(n: number, vid: string, j: number): number {
  if (vid === 'ne-ryadom') return n - 3;
  return 2 * (j + 1) === n ? 1 : 2;
}

/**
 * n стульев за круглым столом, двое особых (две девочки, два мальчика)
 * и n − 2 остальных. vid 'mezhdu': между особыми ровно j человек;
 * vid 'ne-ryadom': особые не рядом. Подвох — сажаем первого особого
 * куда угодно, второму остаётся n − 1 мест, из них подходящих — 2 (или
 * n − 3 для «не рядом»), а не перебираем все рассадки.
 */
export const PV4_KRUGLYY_STOL: Prototype = {
  id: 'pv4-kruglyy-stol',
  blok: 'povyshennye',
  nazvanie: 'Круглый стол: двое особых — через j человек или не рядом',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: (p) =>
    doSotyh(mestKruglyy(num(p, 'n'), text(p, 'vid'), num(p, 'j')) / (num(p, 'n') - 1)),
  uslovie: (p) => {
    const n = num(p, 'n');
    const o = gruppa(p, 'osobye');
    const d = gruppa(p, 'drugie');
    const ost = n - 2;
    const sob =
      text(p, 'vid') === 'ne-ryadom'
        ? `${o[4]} не окажутся рядом`
        : `между двумя ${o[3]} окажется ровно ${num(p, 'j') === 1 ? `один ${d[0]}` : `${num(p, 'j')} ${skl(num(p, 'j'), d[0], d[1], d[2])}`}`;
    const x = mestKruglyy(n, text(p, 'vid'), num(p, 'j')) / (n - 1);
    return `Вокруг круглого стола стоят ${n} ${skl(n, 'стул', 'стула', 'стульев')}. На них в случайном порядке садятся ${ost} ${skl(ost, d[0], d[1], d[2])} и 2 ${o[1]}. Найдите вероятность того, что ${sob}.${okrFraza(x)}`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const j = num(p, 'j');
    const vid = text(p, 'vid');
    return (
      n >= 5 &&
      ['mezhdu', 'ne-ryadom'].includes(vid) &&
      (vid === 'ne-ryadom' || (j >= 1 && 2 * (j + 1) <= n)) &&
      text(p, 'osobye') !== text(p, 'drugie')
    );
  },
  otvet: (p) => poUsloviyu(mestKruglyy(num(p, 'n'), text(p, 'vid'), num(p, 'j')) / (num(p, 'n') - 1)),
  /* Второй путь — все пары мест двух особых по кругу, считаем подходящие. */
  perebor: (p) => {
    const n = num(p, 'n');
    const j = num(p, 'j');
    let vse = 0;
    let da = 0;
    for (let a = 0; a < n; a += 1)
      for (let b = 0; b < n; b += 1) {
        if (a === b) continue;
        vse += 1;
        const r = Math.min((a - b + n) % n, (b - a + n) % n);
        if (text(p, 'vid') === 'ne-ryadom' ? r !== 1 : r === j + 1) da += 1;
      }
    return poUsloviyu(da / vse);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const o = gruppa(p, 'osobye');
    const da = mestKruglyy(n, text(p, 'vid'), num(p, 'j'));
    const x = da / (n - 1);
    return [
      {
        etap: 'Все исходы',
        text: `Пусть первая из двух — ${o[0]} — уже сидит; стол круглый, все её места одинаковы. Для второй равновозможны все остальные стулья:`,
        formula: `${n} - 1 = ${n - 1}`,
        value: n - 1,
      },
      {
        etap: 'Благоприятные исходы',
        text:
          text(p, 'vid') === 'ne-ryadom'
            ? 'Не подходят два соседних стула и её собственный, подходят все прочие:'
            : da === 1
              ? `Подходит один стул — ровно напротив, через ${num(p, 'j')} мест с обеих сторон:`
              : `Подходят два стула — через ${num(p, 'j')} мест слева и через ${num(p, 'j')} справа:`,
        formula: text(p, 'vid') === 'ne-ryadom' ? `${n} - 3 = ${da}` : `${da}`,
        value: da,
      },
      {
        etap: 'Ответ',
        text: 'Вероятность — доля подходящих стульев:',
        formula: `P = \\dfrac{${da}}{${n - 1}} ${doSotyh(x) === null ? '=' : '\\approx'} ${tex(poUsloviyu(x))}`,
        value: poUsloviyu(x),
      },
    ];
  },
  podskazka: (p) => {
    const n = num(p, 'n');
    const da = mestKruglyy(n, text(p, 'vid'), num(p, 'j'));
    return [
      vopros(
        'Сколько равновозможных мест у второй из двух, когда первая уже села?',
        `$${n - 1}$`,
        [`$${n}$`, `$${n - 2}$`],
        'Свой стул первая уже заняла.',
      ),
      vopros('Сколько из них подходит?', `$${da}$`, [`$${da === 2 ? 1 : 2}$`, `$${n - 2}$`]),
      zapisShag('десятичная', doSotyh(da / (n - 1))),
    ];
  },
  varianty: [],
};

/* ── №4. Очередь выступлений: кто на месте k ───────────────────── */

/**
 * N участников из трёх стран (a, b и остальные), порядок — жребий.
 * Найти вероятность, что выступающий k-м — из третьей страны. Подвох —
 * номер места не важен: на любом месте равновозможен любой участник,
 * ответ — доля третьей страны.
 */
export const PV4_OCHERED: Prototype = {
  id: 'pv4-ochered',
  blok: 'povyshennye',
  nazvanie: 'Жребий порядка: участник на данном месте — из третьей страны',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `${text(p, 'gde')} ${N} ${text(p, 'kto')}: ${num(p, 'a')} — ${text(p, 'iz1')}, ${num(p, 'b')} — ${text(p, 'iz2')}, остальные — ${text(p, 'iz3')}. Порядок выступлений определяет жеребьёвка. Найдите вероятность того, что ${text(p, 'mesto')} будет выступать участник ${text(p, 'iz3')}.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const c = N - num(p, 'a') - num(p, 'b');
    return c > 0 && konechnaya(c / N);
  },
  otvet: (p) => tochnee((num(p, 'N') - num(p, 'a') - num(p, 'b')) / num(p, 'N')),
  /* Второй путь — кто стоит на данном месте: N равновозможных участников, подходят из третьей страны. */
  perebor: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    let da = 0;
    for (let i = 0; i < N; i += 1) if (i >= a + b) da += 1;
    return tochnee(da / N);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const c = N - num(p, 'a') - num(p, 'b');
    return [
      {
        etap: 'Количества',
        text: `Участников ${text(p, 'iz3')} — все, кроме двух названных групп:`,
        formula: `${N} - ${num(p, 'a')} - ${num(p, 'b')} = ${c}`,
        value: c,
      },
      {
        etap: 'Ответ',
        text: 'Номер места роли не играет: на нём с равными шансами окажется любой из участников. Вероятность — доля третьей группы:',
        formula: `P = \\dfrac{${c}}{${N}} = ${tex(c / N)}`,
        value: tochnee(c / N),
      },
    ];
  },
  podskazka: (p) => [
    vopros(
      'Зависит ли ответ от номера места в очереди?',
      'Нет, на любом месте шансы одинаковы',
      ['Да, на первых местах шансы больше', 'Да, нужно учесть, кто выступил раньше'],
      'Жребий не отдаёт предпочтения никакому месту.',
    ),
    vopros(
      `Сколько участников ${text(p, 'iz3')}?`,
      `$${num(p, 'N') - num(p, 'a') - num(p, 'b')}$`,
      [`$${num(p, 'a') + num(p, 'b')}$`, `$${num(p, 'N')}$`],
    ),
    zapisShag('десятичная', null),
  ],
  varianty: [],
};

/* ── №5. Две линии: годное изделие ─────────────────────────────── */

const otvetDveLinii = (p: Params) => {
  const r = num(p, 'r');
  const p1 = veroyatnost(p, 'p1');
  const p2 = veroyatnost(p, 'p2');
  const brak = (r * p1 + p2) / (r + 1);
  return tochnee(text(p, 'vid') === 'brak' ? brak : 1 - brak);
};

/**
 * Две линии выпускают одинаковые изделия: первая — в r раз больше,
 * доли брака p1 и p2. Найти вероятность, что случайное изделие со
 * склада годное (vid 'goden') или бракованное (vid 'brak'). Подвох —
 * доля продукции первой линии r/(r + 1), а не 1/2.
 */
export const PV5_DVE_LINII: Prototype = {
  id: 'pv5-dve-linii',
  blok: 'povyshennye',
  nazvanie: 'Две линии, разный выпуск и брак: годное изделие со склада',
  tip: 'Формула полной вероятности',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const r = num(p, 'r');
    return `Одинаковые ${text(p, 'izd')} выпускают две линии. Первая выпускает в ${r === 1.5 ? 'полтора' : r} ${r === 1.5 ? 'раза' : skl(r, 'раз', 'раза', 'раз')} больше изделий, чем вторая. Вероятность брака на первой линии равна ${dec(veroyatnost(p, 'p1'))}, на второй — ${dec(veroyatnost(p, 'p2'))}. Всё, что выпущено, поступает на общий склад. Найдите вероятность того, что случайно взятое со склада изделие окажется ${text(p, 'vid') === 'brak' ? 'бракованным' : 'исправным'}.`;
  },
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return num(p, 'r') > 1 && p1 > 0 && p2 > 0 && p1 < 1 && p2 < 1 && konechnaya(otvetDveLinii(p));
  },
  otvet: otvetDveLinii,
  /* Второй путь — склад из (r + 1)·1000 изделий: считаем бракованные по линиям. */
  perebor: (p) => {
    const r = num(p, 'r');
    const n1 = Math.round(r * 1000);
    const n2 = 1000;
    const b1 = Math.round(n1 * veroyatnost(p, 'p1'));
    const b2 = Math.round(n2 * veroyatnost(p, 'p2'));
    const brak = (b1 + b2) / (n1 + n2);
    return tochnee(text(p, 'vid') === 'brak' ? brak : 1 - brak);
  },
  shagi: (p) => {
    const r = num(p, 'r');
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const d1 = tochnee(r / (r + 1));
    const d2 = tochnee(1 / (r + 1));
    const goden = text(p, 'vid') !== 'brak';
    const q1 = goden ? tochnee(1 - p1) : p1;
    const q2 = goden ? tochnee(1 - p2) : p2;
    return [
      {
        etap: 'Количества',
        text: 'Если вторая линия выпустила одну часть изделий, то первая — во столько раз больше частей; доля первой линии на складе:',
        formula: `\\dfrac{${tex(r)}}{${tex(r)} + 1} = ${tex(d1)},\\qquad \\text{от второй — } ${tex(d2)}`,
        value: d1,
      },
      {
        etap: 'Путь по дереву',
        text: goden
          ? 'Изделие исправно, если пришло с первой линии и исправно или со второй и исправно; пути складываем:'
          : 'Изделие бракованное, если пришло с первой линии и бракованное или со второй и бракованное; пути складываем:',
        formula: `P = ${tex(d1)}\\cdot ${tex(q1)} + ${tex(d2)}\\cdot ${tex(q2)}`,
      },
      {
        etap: 'Ответ',
        text: 'Считаем:',
        formula: `P = ${tex(tochnee(d1 * q1))} + ${tex(tochnee(d2 * q2))} = ${tex(otvetDveLinii(p))}`,
        value: otvetDveLinii(p),
      },
    ];
  },
  podskazka: (p) => {
    const r = num(p, 'r');
    return [
      vopros(
        'Какая доля изделий на складе — с первой линии?',
        `$\\dfrac{${tex(r)}}{${tex(r)}+1}$`,
        ['$\\dfrac12$', `$\\dfrac{1}{${tex(r)}}$`],
        'Если вторая выпустила одну часть, первая — r частей.',
      ),
      vopros(
        'Как соединить два пути по дереву?',
        'Сложить произведения по путям',
        ['Перемножить вероятности брака', 'Взять среднее вероятностей брака'],
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Две кости: во сколько раз одно событие вероятнее другого ─ */

const SOBYTIYA_KOSTI: Record<string, { tekst: string; da: (a: number, b: number) => boolean }> = {
  raznoe: { tekst: 'выпадет разное количество очков', da: (a, b) => a !== b },
  odinakovoe: { tekst: 'выпадет одинаковое количество очков', da: (a, b) => a === b },
  'oba-nechet': { tekst: 'оба раза выпадет нечётное число очков', da: (a, b) => a % 2 === 1 && b % 2 === 1 },
  'oba-chet': { tekst: 'оба раза выпадет чётное число очков', da: (a, b) => a % 2 === 0 && b % 2 === 0 },
  'raznye-nechet': {
    tekst: 'выпадут два разных нечётных числа очков',
    da: (a, b) => a % 2 === 1 && b % 2 === 1 && a !== b,
  },
  'raznye-chet': {
    tekst: 'выпадут два разных чётных числа очков',
    da: (a, b) => a % 2 === 0 && b % 2 === 0 && a !== b,
  },
  'summa-chet': { tekst: 'в сумме выпадет чётное число очков', da: (a, b) => (a + b) % 2 === 0 },
  'hotya-by-shest': { tekst: 'хотя бы раз выпадет шестёрка', da: (a, b) => a === 6 || b === 6 },
  'ni-razu-shest': { tekst: 'шестёрка не выпадет ни разу', da: (a, b) => a !== 6 && b !== 6 },
  'summa-nechet': { tekst: 'в сумме выпадет нечётное число очков', da: (a, b) => (a + b) % 2 === 1 },
  'proizv-chet': { tekst: 'произведение выпавших очков будет чётным', da: (a, b) => (a * b) % 2 === 0 },
  'odno-bolshe': { tekst: 'в первый раз выпадет больше очков, чем во второй', da: (a, b) => a > b },
  'summa-sem': { tekst: 'в сумме выпадет 7 очков', da: (a, b) => a + b === 7 },
  'raznost-odin': { tekst: 'выпавшие числа очков будут отличаться на 1', da: (a, b) => Math.abs(a - b) === 1 },
};

const kostSobytie = (p: Params, key: string) => {
  const s = SOBYTIYA_KOSTI[text(p, key)];
  if (s === undefined) throw new Error(`pv5-kosti-otnoshenie: нет события ${text(p, key)}`);
  return s;
};

/** Число исходов из 36, где событие наступает. */
function ishodyKosti(p: Params, key: string): number {
  const s = kostSobytie(p, key);
  let k = 0;
  for (let a = 1; a <= 6; a += 1) for (let b = 1; b <= 6; b += 1) if (s.da(a, b)) k += 1;
  return k;
}

/**
 * Кость бросают дважды: во сколько раз вероятность события A больше
 * вероятности события B. Подвох — делить не вероятности «на глаз», а
 * числа благоприятных исходов из 36: знаменатели сокращаются.
 */
export const PV5_KOSTI_OTNOSHENIE: Prototype = {
  id: 'pv5-kosti-otnoshenie',
  blok: 'povyshennye',
  nazvanie: 'Две кости: во сколько раз одно событие вероятнее другого',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Игральную кость бросают два раза. Во сколько раз вероятность события «${kostSobytie(p, 'a').tekst}» больше вероятности события «${kostSobytie(p, 'b').tekst}»?`,
  dopustimo: (p) => {
    const a = ishodyKosti(p, 'a');
    const b = ishodyKosti(p, 'b');
    return text(p, 'a') !== text(p, 'b') && b > 0 && a > b && konechnaya(a / b);
  },
  otvet: (p) => tochnee(ishodyKosti(p, 'a') / ishodyKosti(p, 'b')),
  /* Второй путь — вероятности по отдельности (с делением на 36), потом их частное. */
  perebor: (p) => tochnee(ishodyKosti(p, 'a') / 36 / (ishodyKosti(p, 'b') / 36)),
  shagi: (p) => {
    const a = ishodyKosti(p, 'a');
    const b = ishodyKosti(p, 'b');
    return [
      {
        etap: 'Все исходы',
        text: 'Пара очков при двух бросках — один из равновозможных исходов:',
        formula: '6\\cdot 6 = 36',
        value: 36,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Перебираем таблицу 6 на 6: событию «${kostSobytie(p, 'a').tekst}» подходят ${a} ${skl(a, 'исход', 'исхода', 'исходов')}, событию «${kostSobytie(p, 'b').tekst}» — ${b}.`,
        formula: `P_1 = \\dfrac{${a}}{36},\\qquad P_2 = \\dfrac{${b}}{36}`,
      },
      {
        etap: 'Ответ',
        text: 'Знаменатели одинаковы и сокращаются — делим числа исходов:',
        formula: `\\dfrac{P_1}{P_2} = \\dfrac{${a}}{${b}} = ${tex(a / b)}`,
        value: tochnee(a / b),
      },
    ];
  },
  podskazka: (p) => {
    const a = ishodyKosti(p, 'a');
    const b = ishodyKosti(p, 'b');
    return [
      vopros('Сколько всего равновозможных исходов у двух бросков?', '$36$', ['$12$', '$6$']),
      vopros(
        `Сколько исходов у события «${kostSobytie(p, 'b').tekst}»?`,
        `$${b}$`,
        [`$${b + 3}$`, `$${a}$`, `$${36 - b}$`],
      ),
      zapisShag('десятичная', null),
    ];
  },
  varianty: [],
};

/* ── №5. Билеты: ровно j выигрышных или хотя бы один ────────────── */

function otvetBiletyTochno(p: Params): number {
  const N = num(p, 'N');
  const W = num(p, 'W');
  const k = num(p, 'k');
  if (text(p, 'vid') === 'hotya-by') return 1 - soch(N - W, k) / soch(N, k);
  const j = num(p, 'j');
  return (soch(W, j) * soch(N - W, k - j)) / soch(N, k);
}

/**
 * Из N билетов W выигрышных, наугад берут k. vid 'rovno' — ровно j
 * выигрышных; vid 'hotya-by' — хотя бы один. Подвох — билеты берут
 * без возвращения: считать сочетания, а не перемножать одинаковые
 * вероятности; для «хотя бы один» — через «ни одного».
 */
export const PV5_BILETY_SOCHETANIYA: Prototype = {
  id: 'pv5-bilety-sochetaniya',
  blok: 'povyshennye',
  nazvanie: 'Билеты без возвращения: ровно j выигрышных или хотя бы один',
  tip: 'Классическое определение',
  sourceRange: [0, 0],
  format: 'десятичная',
  okruglenie: (p) => doSotyh(otvetBiletyTochno(p)),
  uslovie: (p) => {
    const N = num(p, 'N');
    const W = num(p, 'W');
    const k = num(p, 'k');
    const j = num(p, 'j');
    const sob =
      text(p, 'vid') === 'hotya-by'
        ? 'хотя бы один из них окажется выигрышным'
        : `среди них окажется ровно ${j === 1 ? 'один выигрышный' : `${j} ${skl(j, 'выигрышный', 'выигрышных', 'выигрышных')}`}`;
    return `В лотерее разыгрывают ${N} ${skl(N, 'билет', 'билета', 'билетов')}, ${W} из них — ${skl(W, 'выигрышный', 'выигрышные', 'выигрышные')}. Покупатель наугад берёт ${k} ${skl(k, 'билет', 'билета', 'билетов')}. Найдите вероятность того, что ${sob}.${okrFraza(otvetBiletyTochno(p))}`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const W = num(p, 'W');
    const k = num(p, 'k');
    const j = num(p, 'j');
    return (
      W > 0 &&
      W < N &&
      k > 0 &&
      k < N &&
      ['rovno', 'hotya-by'].includes(text(p, 'vid')) &&
      (text(p, 'vid') === 'hotya-by' || (j >= 1 && j <= Math.min(W, k)))
    );
  },
  otvet: (p) => poUsloviyu(otvetBiletyTochno(p)),
  /* Второй путь — перебор всех наборов из k билетов (номера 0…N−1, выигрышные — первые W). */
  perebor: (p) => {
    const N = num(p, 'N');
    const W = num(p, 'W');
    const k = num(p, 'k');
    let vse = 0;
    let da = 0;
    const obhod = (start: number, ostalos: number, vyigr: number) => {
      if (ostalos === 0) {
        vse += 1;
        if (text(p, 'vid') === 'hotya-by' ? vyigr > 0 : vyigr === num(p, 'j')) da += 1;
        return;
      }
      for (let i = start; i <= N - ostalos; i += 1) obhod(i + 1, ostalos - 1, vyigr + (i < W ? 1 : 0));
    };
    obhod(0, k, 0);
    return poUsloviyu(da / vse);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const W = num(p, 'W');
    const k = num(p, 'k');
    const j = num(p, 'j');
    const vse = soch(N, k);
    const x = otvetBiletyTochno(p);
    const okr = doSotyh(x) === null ? '=' : '\\approx';
    if (text(p, 'vid') === 'hotya-by') {
      const net = soch(N - W, k);
      return [
        {
          etap: 'Все исходы',
          text: `Порядок, в котором взяты билеты, не важен: исходы — наборы из ${k} билетов из ${N}.`,
          formula: `C_{${N}}^{${k}} = ${vse}`,
          value: vse,
        },
        {
          etap: 'Противоположное событие',
          text: 'Удобнее посчитать наборы без единого выигрышного билета: все взяты из невыигрышных.',
          formula: `C_{${N - W}}^{${k}} = ${net}`,
          value: net,
        },
        {
          etap: 'Ответ',
          text: 'Вероятность хотя бы одного выигрышного — дополнение:',
          formula: `P = 1 - \\dfrac{${net}}{${vse}} ${okr} ${tex(poUsloviyu(x))}`,
          value: poUsloviyu(x),
        },
      ];
    }
    const da = soch(W, j) * soch(N - W, k - j);
    return [
      {
        etap: 'Все исходы',
        text: `Порядок, в котором взяты билеты, не важен: исходы — наборы из ${k} билетов из ${N}.`,
        formula: `C_{${N}}^{${k}} = ${vse}`,
        value: vse,
      },
      {
        etap: 'Благоприятные исходы',
        text: `Выбираем ${j} из ${W} выигрышных и ${k - j} из ${N - W} невыигрышных, выборы независимы:`,
        formula: `C_{${W}}^{${j}}\\cdot C_{${N - W}}^{${k - j}} = ${soch(W, j)}\\cdot ${soch(N - W, k - j)} = ${da}`,
        value: da,
      },
      {
        etap: 'Ответ',
        text: 'Вероятность — доля благоприятных наборов:',
        formula: `P = \\dfrac{${da}}{${vse}} ${okr} ${tex(poUsloviyu(x))}`,
        value: poUsloviyu(x),
      },
    ];
  },
  podskazka: (p) => [
    vopros(
      'Важен ли порядок, в котором взяты билеты?',
      'Нет, важен только набор',
      ['Да, первый билет важнее', 'Да, нужно перебрать все порядки'],
    ),
    text(p, 'vid') === 'hotya-by'
      ? vopros('Через какое событие проще считать?', 'Ни одного выигрышного', [
          'Ровно один выигрышный',
          'Все выигрышные',
        ])
      : vopros(
          'Как считать благоприятные наборы?',
          'Сочетания выигрышных умножить на сочетания невыигрышных',
          ['Сложить сочетания', 'Взять сочетания только из выигрышных'],
        ),
    zapisShag('десятичная', doSotyh(otvetBiletyTochno(p))),
  ],
  varianty: [],
};
