/**
 * Задачи конспекта задания №4 как прототипы.
 *
 * Восемнадцать задач авторского конспекта урока 13–14 сентября. Каждая
 * стала параметрическим прототипом: вариант 1 — задача конспекта
 * дословно (это проверяется при загрузке модуля — см. ISHODNYE), ещё
 * десять собирает генератор с другими числами в пределах того же
 * сюжета. На вкладке подготовки показывается вариант 1; остальные
 * идут в подход тренажёра и в «Узнай метод».
 *
 * Ответ считается формулой прототипа и проверяется вторым путём
 * (`perebor`), как и в банке задачника.
 */

import { prototip, type Rng } from '../generator';
import { chelovek, perechislenie, poryadkovoe, skl } from '../morfologia';
import { konechnaya, num, text, type Params, type Prototype, type Step } from '../types';
import {
  drob,
  plitki,
  plitkiDvuh,
  ploshchadi,
  shagLL,
  shagP,
  tablitsaKostey,
  tsiferblat,
} from './vizual';

/* ── Общее ───────────────────────────────────────────────────────── */

const tochno = (): null => null;

/** Доля k из n, посчитанная перебором исходов. */
function dolya(n: number, podhodit: (i: number) => boolean): number {
  let ok = 0;
  for (let i = 1; i <= n; i += 1) {
    if (podhodit(i)) {
      ok += 1;
    }
  }
  return ok / n;
}

/** Доля пар на двух кубиках, подходящих под условие. */
function pary(podhodit: (a: number, b: number) => boolean): number {
  let ok = 0;
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      if (podhodit(a, b)) {
        ok += 1;
      }
    }
  }
  return ok / 36;
}

/** Все перестановки списка. */
function perestanovki<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) {
    return [[...items]];
  }
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const hvost of perestanovki(rest)) {
      out.push([item, ...hvost]);
    }
  });
  return out;
}

const INITSIALY = ['В.', 'Д.', 'Н.', 'К.', 'М.', 'П.', 'С.', 'Ж.'];
const STRANY = [
  'Норвегии',
  'России',
  'Испании',
  'Румынии',
  'Дании',
  'Польши',
  'Сербии',
  'Швейцарии',
  'Голландии',
  'Франции',
  'Австрии',
  'Венгрии',
  'Швеции',
  'Финляндии',
  'Италии',
  'Греции',
];
/** Имена в именительном и родительном падеже. */
const MALCHIKI: readonly [string, string][] = [
  ['Олег', 'Олега'],
  ['Юрий', 'Юрия'],
  ['Иван', 'Ивана'],
  ['Игорь', 'Игоря'],
  ['Пётр', 'Петра'],
  ['Артём', 'Артёма'],
  ['Саша', 'Саши'],
  ['Дима', 'Димы'],
  ['Миша', 'Миши'],
  ['Кирилл', 'Кирилла'],
  ['Никита', 'Никиты'],
  ['Андрей', 'Андрея'],
];
const DEVOCHKI: readonly [string, string][] = [
  ['Света', 'Светы'],
  ['Нина', 'Нины'],
  ['Оля', 'Оли'],
  ['Маша', 'Маши'],
  ['Катя', 'Кати'],
  ['Лена', 'Лены'],
  ['Аня', 'Ани'],
  ['Вера', 'Веры'],
];

/* ── Блок 1. Определение вероятности (конспект 1–10) ─────────────── */

const NACHINKI: Record<string, { tv: string; label: string }> = {
  myaso: { tv: 'мясом', label: 'мясо' },
  kapusta: { tv: 'капустой', label: 'капуста' },
  varenye: { tv: 'вареньем', label: 'варенье' },
};

const K01: Prototype = prototip({
  id: 'k4-01',
  blok: 'opredelenie',
  nazvanie: 'Пирожки трёх видов',
  tip: 'Классическое определение вероятности',
  zadachnik: [1, 1],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'm') + num(p, 'k') + num(p, 'v');
    return `На тарелке ${N} ${skl(N, 'пирожок', 'пирожка', 'пирожков')}: ${num(p, 'm')} с мясом, ${num(p, 'k')} с капустой и ${num(p, 'v')} с вареньем. Вы выбираете наугад один пирожок. С какой вероятностью он окажется с ${nachinka(p).tv}?`;
  },
  dopustimo: (p) =>
    num(p, 'm') >= 1 &&
    num(p, 'k') >= 1 &&
    num(p, 'v') >= 1 &&
    NACHINKI[text(p, 'ischem')] !== undefined &&
    konechnaya(kol01(p) / (num(p, 'm') + num(p, 'k') + num(p, 'v'))),
  otvet: (p) => kol01(p) / (num(p, 'm') + num(p, 'k') + num(p, 'v')),
  /* Тот же ответ через противоположное событие: не искомая начинка. */
  perebor: (p) => {
    const N = num(p, 'm') + num(p, 'k') + num(p, 'v');
    return 1 - (N - kol01(p)) / N;
  },
  shagi: (p) => {
    const N = num(p, 'm') + num(p, 'k') + num(p, 'v');
    return [
      {
        text: 'Все исходы — любой из пирожков:',
        formula: `n = ${num(p, 'm')} + ${num(p, 'k')} + ${num(p, 'v')} = ${N}`,
        value: N,
      },
      {
        text: `Благоприятные — пирожки с ${nachinka(p).tv}:`,
        formula: `m = ${kol01(p)}`,
        value: kol01(p),
      },
      shagP(kol01(p), N),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 1',
      params: { m: 7, k: 5, v: 4, ischem: 'varenye' },
    },
  ],
  generator: (r: Rng): Params => ({
    m: r.int(2, 9),
    k: r.int(2, 9),
    v: r.int(2, 9),
    ischem: r.pick(Object.keys(NACHINKI)),
  }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный выбор пирожка',
      'группы даны количествами, без процентов',
      'благоприятные — одна группа',
    ],
    fraza: (p) =>
      `прямой пересчёт — один случайный выбор из ${num(p, 'm') + num(p, 'k') + num(p, 'v')} одинаково вероятных пирожков.`,
    vizual: (p) =>
      plitki([
        { label: 'мясо', count: num(p, 'm'), blago: text(p, 'ischem') === 'myaso' },
        { label: 'капуста', count: num(p, 'k'), blago: text(p, 'ischem') === 'kapusta' },
        { label: 'варенье', count: num(p, 'v'), blago: text(p, 'ischem') === 'varenye' },
      ]),
  },
});

function nachinka(p: Params): { tv: string; label: string } {
  const n = NACHINKI[text(p, 'ischem')];
  if (n === undefined) {
    throw new Error(`Неизвестная начинка ${text(p, 'ischem')}`);
  }
  return n;
}

function kol01(p: Params): number {
  const key = { myaso: 'm', kapusta: 'k', varenye: 'v' }[text(p, 'ischem')];
  return key === undefined ? 0 : num(p, key);
}

const ZHANRY: Record<string, { tv: string; key: string }> = {
  drama: { tv: 'драмой', key: 'dram' },
  komediya: { tv: 'комедией', key: 'kom' },
  boevik: { tv: 'боевиком', key: 'boev' },
};

const K02: Prototype = prototip({
  id: 'k4-02',
  blok: 'opredelenie',
  nazvanie: 'Фильмы: «не будет драмой»',
  tip: 'Благоприятные через вычитание',
  zadachnik: [2, 2],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const kom = num(p, 'kom');
    const boev = num(p, 'boev');
    const dram = num(p, 'dram');
    const N = kom + boev + dram;
    return `В онлайн-кинотеатре доступно по подписке ${N} ${skl(N, 'новый фильм', 'новых фильма', 'новых фильмов')}: ${kom} ${skl(kom, 'комедия', 'комедии', 'комедий')}, ${boev} ${skl(boev, 'боевик', 'боевика', 'боевиков')}, ${dram} ${skl(dram, 'драма', 'драмы', 'драм')}. Какова вероятность, что наугад выбранный фильм не будет ${zhanr(p).tv}?`;
  },
  dopustimo: (p) =>
    num(p, 'kom') >= 1 &&
    num(p, 'boev') >= 1 &&
    num(p, 'dram') >= 1 &&
    ZHANRY[text(p, 'ne')] !== undefined &&
    konechnaya(otvet02(p)),
  otvet: otvet02,
  perebor: (p) => 1 - num(p, zhanr(p).key) / n02(p),
  shagi: (p) => {
    const N = n02(p);
    const ne = num(p, zhanr(p).key);
    const ostalnye = Object.values(ZHANRY)
      .filter((z) => z.key !== zhanr(p).key)
      .map((z) => num(p, z.key));
    return [
      { text: 'Все исходы — любой из фильмов:', formula: `n = ${N}`, value: N },
      {
        text: `Благоприятные — все, кроме ${zhanr(p).tv.replace(/ой$|ом$|ей$/, (m) => ({ ой: 'ы', ом: 'ов', ей: 'й' })[m] ?? m)}, то есть остальные два жанра:`,
        formula: `m = ${ostalnye.join(' + ')} = ${N - ne}`,
        value: N - ne,
      },
      shagP(N - ne, N),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 2',
      params: { kom: 20, boev: 15, dram: 15, ne: 'drama' },
    },
  ],
  generator: (r: Rng): Params => ({
    kom: r.int(5, 30),
    boev: r.int(5, 30),
    dram: r.int(5, 30),
    ne: r.pick(Object.keys(ZHANRY)),
  }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайно выбранный фильм',
      'даны количества по жанрам',
      '«не …» — благоприятные считаются вычитанием',
    ],
    fraza: (p) =>
      `прямой пересчёт — один случайный выбор из ${n02(p)} одинаково вероятных фильмов.`,
    vizual: (p) =>
      plitki([
        { label: 'комедия', count: num(p, 'kom'), blago: text(p, 'ne') !== 'komediya' },
        { label: 'боевик', count: num(p, 'boev'), blago: text(p, 'ne') !== 'boevik' },
        { label: 'драма', count: num(p, 'dram'), blago: text(p, 'ne') !== 'drama' },
      ]),
  },
});

function zhanr(p: Params): { tv: string; key: string } {
  const z = ZHANRY[text(p, 'ne')];
  if (z === undefined) {
    throw new Error(`Неизвестный жанр ${text(p, 'ne')}`);
  }
  return z;
}

function n02(p: Params): number {
  return num(p, 'kom') + num(p, 'boev') + num(p, 'dram');
}

function otvet02(p: Params): number {
  return (n02(p) - num(p, zhanr(p).key)) / n02(p);
}

const IGROKI = ['Антон', 'Артём', 'Денис', 'Кирилл', 'Максим', 'Никита', 'Илья', 'Егор'];

const K03: Prototype = prototip({
  id: 'k4-03',
  blok: 'opredelenie',
  nazvanie: '«Мафия»: карты',
  tip: 'Классическое определение вероятности',
  zadachnik: [3, 3],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `${text(p, 'imya')} играет с друзьями в «Мафию». В игре ${N} ${skl(N, 'карта', 'карты', 'карт')}, из них ${num(p, 'k')} — мафия. С какой вероятностью ${text(p, 'imya')} станет «мафиози»?`;
  },
  dopustimo: (p) =>
    num(p, 'k') >= 1 && num(p, 'k') < num(p, 'N') && konechnaya(num(p, 'k') / num(p, 'N')),
  otvet: (p) => num(p, 'k') / num(p, 'N'),
  perebor: (p) => 1 - (num(p, 'N') - num(p, 'k')) / num(p, 'N'),
  shagi: (p) => [
    { text: 'Все исходы — любая из карт:', formula: `n = ${num(p, 'N')}`, value: num(p, 'N') },
    { text: 'Благоприятные — карты мафии:', formula: `m = ${num(p, 'k')}`, value: num(p, 'k') },
    shagP(num(p, 'k'), num(p, 'N')),
  ],
  varianty: [
    { n: 1, source: 'конспект', ref: 'конспект, задача 3', params: { N: 10, k: 2, imya: 'Антон' } },
  ],
  generator: (r: Rng): Params => ({ N: r.int(8, 25), k: r.int(1, 4), imya: r.pick(IGROKI) }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одна карта из колоды — один случайный выбор',
      'даны количества: всего карт и карт мафии',
    ],
    fraza: (p) =>
      `прямой пересчёт — ${text(p, 'imya')} достаётся одна из ${num(p, 'N')} одинаково вероятных карт.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'мафия', count: num(p, 'k') },
        { label: 'мирный', count: num(p, 'N') - num(p, 'k') },
      ),
  },
});

const K04: Prototype = prototip({
  id: 'k4-04',
  blok: 'opredelenie',
  nazvanie: 'Кот в подъездах',
  tip: 'Классическое определение вероятности',
  zadachnik: [4, 4],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const kak = num(p, 'k') === 2 ? 'в первом или втором' : 'в одном из первых трёх';
    return `Кот спрятался в одном из ${N} ${skl(N, 'подъезда', 'подъездов', 'подъездов')}. Хозяева проверяют подъезды по порядку, начиная с первого. С какой вероятностью кот будет найден ${kak} по счету из проверенных подъездов?`;
  },
  dopustimo: (p) =>
    [2, 3].includes(num(p, 'k')) &&
    num(p, 'N') > num(p, 'k') &&
    konechnaya(num(p, 'k') / num(p, 'N')),
  otvet: (p) => num(p, 'k') / num(p, 'N'),
  perebor: (p) => dolya(num(p, 'N'), (i) => i <= num(p, 'k')),
  shagi: (p) => [
    { text: 'Все исходы — любой из подъездов:', formula: `n = ${num(p, 'N')}`, value: num(p, 'N') },
    {
      text:
        num(p, 'k') === 2
          ? 'Благоприятные — первый и второй подъезды:'
          : 'Благоприятные — первые три подъезда:',
      formula: `m = ${num(p, 'k')}`,
      value: num(p, 'k'),
    },
    shagP(num(p, 'k'), num(p, 'N')),
  ],
  varianty: [{ n: 1, source: 'конспект', ref: 'конспект, задача 4', params: { N: 10, k: 2 } }],
  generator: (r: Rng): Params => ({ N: r.int(5, 25), k: r.pick([2, 3]) }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'кот в одном из подъездов, все одинаково вероятны',
      'благоприятные — первые несколько подъездов',
      'исходы пересчитываются напрямую',
    ],
    fraza: (p) => `прямой пересчёт — кот равновероятно сидит в любом из ${num(p, 'N')} подъездов.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: num(p, 'k') === 2 ? '1-й или 2-й' : '1-й, 2-й, 3-й', count: num(p, 'k') },
        { label: 'дальше', count: num(p, 'N') - num(p, 'k') },
      ),
  },
});

/** Артисты: имя в именительном и родительном, первая буква для плиток. */
const ARTISTY: readonly [string, string][] = [
  ['Клим', 'Клима'],
  ['Гога', 'Гоги'],
  ['Алекс', 'Алекса'],
  ['Тима', 'Тимы'],
  ['Вова', 'Вовы'],
  ['Макс', 'Макса'],
  ['Влад', 'Влада'],
  ['Боря', 'Бори'],
  ['Рома', 'Ромы'],
  ['Стас', 'Стаса'],
];

function artisty05(p: Params): string[] {
  return text(p, 'soperniki')
    .split(',')
    .map((s) => s.trim());
}

const K05: Prototype = prototip({
  id: 'k4-05',
  blok: 'opredelenie',
  nazvanie: 'Рэпер выступает последним',
  tip: 'Перебор порядков',
  zadachnik: [5, 5],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const reper = text(p, 'reper');
    const rod = artisty05(p).map((imya) => ARTISTY.find(([im]) => im === imya)?.[1] ?? imya);
    return `Рэпер ${reper} готовится выступить на концерте. Он считает, что чем позже выступает артист на концерте, тем он круче. Порядок выступлений определяется случайным образом. С какой вероятностью ${reper} выступит после своих основных соперников: ${perechislenie(rod)}? Ответ округлите до сотых.`;
  },
  dopustimo: (p) => {
    const vse = [text(p, 'reper'), ...artisty05(p)];
    const bukvy = new Set(vse.map((s) => s[0]));
    return (
      vse.length >= 3 &&
      vse.length <= 4 &&
      bukvy.size === vse.length &&
      vse.every((imya) => ARTISTY.some(([im]) => im === imya))
    );
  },
  otvet: (p) => 1 / (artisty05(p).length + 1),
  /* Перебором всех порядков: рэпер последний в (k)! из (k+1)!. */
  perebor: (p) => {
    const vse = [text(p, 'reper'), ...artisty05(p)];
    const poryadki = perestanovki(vse);
    return (
      poryadki.filter((por) => por[por.length - 1] === text(p, 'reper')).length / poryadki.length
    );
  },
  shagi: (p) => {
    const vse = [text(p, 'reper'), ...artisty05(p)];
    const n = perestanovki(vse).length;
    const m = n / vse.length;
    return [
      {
        text: `Все исходы — порядки ${vse.length === 3 ? 'троих' : 'четверых'}: ${perechislenie(vse.map((s) => `${s} (${s[0]})`))}:`,
        formula: `n = ${n}`,
        value: n,
      },
      {
        text: `Благоприятные — порядки, где ${text(p, 'reper')} последний:`,
        formula: `m = ${m}`,
        value: m,
      },
      shagP(m, n, 2),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 5',
      params: { reper: 'Клим', soperniki: 'Гога, Алекс' },
    },
  ],
  generator: (r: Rng): Params => {
    const imena = r.sample(ARTISTY, r.pick([3, 4])).map(([im]) => im);
    return { reper: imena[0] as string, soperniki: imena.slice(1).join(', ') };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'порядок нескольких артистов — один жребий',
      'перестановок мало, их можно перечислить и пересчитать',
      'благоприятные — перестановки, где рэпер последний',
    ],
    fraza: (p) =>
      `прямой пересчёт — важен только порядок ${artisty05(p).length + 1 === 3 ? 'троих' : 'четверых'}, все порядки равновозможны.`,
    vizual: (p) => {
      const vse = [text(p, 'reper'), ...artisty05(p)];
      const poryadki = perestanovki(vse);
      return {
        parametry: {
          method: 'direct-count',
          outcomes: poryadki.map((por) => por.map((s) => s[0]).join('')),
          columns: 6,
        },
        podsvetka: {
          method: 'direct-count',
          favorable: poryadki.flatMap((por, i) =>
            por[por.length - 1] === text(p, 'reper') ? [i] : [],
          ),
        },
      };
    },
  },
});

const DEREVYA: Record<string, { label: string; key: string; im: string }> = {
  yablonya: { label: 'яблоня', key: 'a', im: 'яблоня' },
  grusha: { label: 'груша', key: 'b', im: 'груша' },
  vishnya: { label: 'вишня', key: 'c', im: 'вишня' },
};

const K06: Prototype = prototip({
  id: 'k4-06',
  blok: 'opredelenie',
  nazvanie: 'Сад: отношение количеств',
  tip: 'Доля по отношению',
  zadachnik: [6, 6],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В посёлке Белая горка есть фруктовый сад, в котором растут яблони, груши и вишни. Их количества относятся как ${num(p, 'a')} : ${num(p, 'b')} : ${num(p, 'c')}. Для фотосессии в саду Маша выбирает наугад одно дерево. Какая вероятность, что это ${derevo06(p).im}?`,
  dopustimo: (p) =>
    num(p, 'a') >= 1 &&
    num(p, 'b') >= 1 &&
    num(p, 'c') >= 1 &&
    DEREVYA[text(p, 'ischem')] !== undefined &&
    konechnaya(num(p, derevo06(p).key) / n06(p)),
  otvet: (p) => num(p, derevo06(p).key) / n06(p),
  perebor: (p) => 1 - (n06(p) - num(p, derevo06(p).key)) / n06(p),
  shagi: (p) => [
    {
      text: 'Отношение задаёт доли: возьмём одну порцию деревьев в этом отношении. Все исходы — любое дерево в ней:',
      formula: `n = ${num(p, 'a')} + ${num(p, 'b')} + ${num(p, 'c')} = ${n06(p)}`,
      value: n06(p),
    },
    {
      text: `Благоприятные — ${derevo06(p).label === 'яблоня' ? 'яблони' : derevo06(p).label === 'груша' ? 'груши' : 'вишни'}:`,
      formula: `m = ${num(p, derevo06(p).key)}`,
      value: num(p, derevo06(p).key),
    },
    shagP(num(p, derevo06(p).key), n06(p)),
  ],
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 6',
      params: { a: 8, b: 1, c: 3, ischem: 'vishnya' },
    },
  ],
  generator: (r: Rng): Params => ({
    a: r.int(1, 9),
    b: r.int(1, 9),
    c: r.int(1, 9),
    ischem: r.pick(Object.keys(DEREVYA)),
  }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный выбор дерева',
      'даны отношения количеств — доли считаются как m/n',
      'нет ни процентов, ни независимых испытаний',
    ],
    fraza: (p) =>
      `прямой пересчёт — на каждые ${n06(p)} деревьев приходится ${num(p, derevo06(p).key)} искомых, выбор одинаково случаен.`,
    vizual: (p) =>
      plitki([
        { label: 'яблоня', count: num(p, 'a'), blago: text(p, 'ischem') === 'yablonya' },
        { label: 'груша', count: num(p, 'b'), blago: text(p, 'ischem') === 'grusha' },
        { label: 'вишня', count: num(p, 'c'), blago: text(p, 'ischem') === 'vishnya' },
      ]),
  },
});

function derevo06(p: Params): { label: string; key: string; im: string } {
  const d = DEREVYA[text(p, 'ischem')];
  if (d === undefined) {
    throw new Error(`Неизвестное дерево ${text(p, 'ischem')}`);
  }
  return d;
}

function n06(p: Params): number {
  return num(p, 'a') + num(p, 'b') + num(p, 'c');
}

/** Виды спорта: дательный падеж, множественное родительное, творительный. */
type Sport = readonly [string, string, string];
/** Непустой список: первый вид спорта — запасной, если параметр не узнан. */
const SPORT: readonly [Sport, ...Sport[]] = [
  ['теннису', 'теннисистов', 'теннисистом'],
  ['бадминтону', 'бадминтонистов', 'бадминтонистом'],
  ['шахматам', 'шахматистов', 'шахматистом'],
  ['шашкам', 'шашистов', 'шашистом'],
];
const SPORTSMENY = [
  'Ярослав Исаков',
  'Игорь Чаев',
  'Денис Полянкин',
  'Дмитрий Тоснин',
  'Андрей Фомин',
  'Павел Круглов',
  'Сергей Лапин',
  'Артём Зверев',
];

const K07: Prototype = prototip({
  id: 'k4-07',
  blok: 'opredelenie',
  nazvanie: 'Соперник из России',
  tip: 'Одного фиксируем',
  zadachnik: [7, 7],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    const sport = SPORT.find(([vid]) => vid === text(p, 'vid')) ?? SPORT[0];
    return `Перед началом первого тура чемпионата по ${sport[0]} участников разбивают на игровые пары случайным образом с помощью жребия. Всего в чемпионате участвует ${N} ${sport[1]}, среди которых ${r} ${skl(r, 'спортсмен', 'спортсмена', 'спортсменов')} из России, в том числе ${text(p, 'imya')}. Найдите вероятность того, что в первом туре ${text(p, 'imya')} будет играть с каким-либо ${sport[2]} из России.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    return (
      N % 2 === 0 && N >= 10 && N % 10 !== 1 && r >= 2 && r <= N && konechnaya((r - 1) / (N - 1))
    );
  },
  otvet: (p) => (num(p, 'r') - 1) / (num(p, 'N') - 1),
  perebor: (p) => 1 - (num(p, 'N') - num(p, 'r')) / (num(p, 'N') - 1),
  shagi: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    const familiya = text(p, 'imya').split(' ')[1] ?? text(p, 'imya');
    return [
      {
        text: `Все исходы — возможные соперники ${familiya.replace(/в$/, 'ва').replace(/н$/, 'на')}, любой из остальных:`,
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: 'Благоприятные — россияне без него самого:',
        formula: `m = ${r} - 1 = ${r - 1}`,
        value: r - 1,
      },
      shagP(r - 1, N - 1),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 7',
      params: { N: 46, r: 19, vid: 'теннису', imya: 'Ярослав Исаков' },
    },
  ],
  generator: (r: Rng): Params => {
    const N = 2 * r.int(6, 40);
    return { N, r: r.int(2, N), vid: r.pick(SPORT)[0], imya: r.pick(SPORTSMENY) };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный соперник из остальных',
      'одного фиксируем, остальные одинаково случайны',
      'благоприятные — россияне без него самого',
    ],
    fraza: (p) =>
      `прямой пересчёт — в соперники равновероятно попадёт любой из остальных ${num(p, 'N') - 1} участников.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'из России', count: num(p, 'r') - 1 },
        { label: 'из других стран', count: num(p, 'N') - num(p, 'r') },
      ),
  },
});

const K08: Prototype = prototip({
  id: 'k4-08',
  blok: 'opredelenie',
  nazvanie: 'Вертолёт: первый рейс',
  tip: 'Место в очереди',
  zadachnik: [8, 8],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В группе туристов ${chelovek(num(p, 'N'))}. Их вертолётом в несколько приёмов забрасывают в труднодоступный район по ${chelovek(num(p, 'k'))} за рейс. Порядок, в котором вертолёт перевозит туристов, случаен. Найдите вероятность того, что турист ${text(p, 'kto')} полетит первым рейсом вертолёта.`,
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return N > k && k >= 2 && N % k === 0 && konechnaya(k / N);
  },
  otvet: (p) => num(p, 'k') / num(p, 'N'),
  perebor: (p) => dolya(num(p, 'N'), (i) => i <= num(p, 'k')),
  shagi: (p) => [
    {
      text: 'Все исходы — места туриста в очереди:',
      formula: `n = ${num(p, 'N')}`,
      value: num(p, 'N'),
    },
    {
      text: 'Благоприятные — места первого рейса:',
      formula: `m = ${num(p, 'k')}`,
      value: num(p, 'k'),
    },
    shagP(num(p, 'k'), num(p, 'N')),
  ],
  varianty: [
    { n: 1, source: 'конспект', ref: 'конспект, задача 8', params: { N: 30, k: 6, kto: 'П.' } },
  ],
  generator: (r: Rng): Params => {
    const k = r.int(2, 20);
    return { N: k * r.int(2, 12), k, kto: r.pick(INITSIALY) };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один турист на случайном месте среди всех',
      'благоприятные — места первого рейса',
      'все места одинаково случайны',
    ],
    fraza: (p) =>
      `прямой пересчёт — турист занимает одно из ${num(p, 'N')} равновозможных мест, из них ${num(p, 'k')} в первом рейсе.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'первый рейс', count: num(p, 'k') },
        { label: 'другие рейсы', count: num(p, 'N') - num(p, 'k') },
      ),
  },
});

const K09: Prototype = prototip({
  id: 'k4-09',
  blok: 'opredelenie',
  nazvanie: 'Конференция: чей доклад по счёту',
  tip: 'Позиция в жеребьёвке',
  zadachnik: [9, 9],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const k1 = num(p, 'k1');
    return `На конференцию приехали ${k1} ${skl(k1, 'ученый', 'ученых', 'ученых')} из ${text(p, 's1')}, ${num(p, 'k2')} из ${text(p, 's2')} и ${num(p, 'k3')} из ${text(p, 's3')}. Каждый из них делает на конференции один доклад. Порядок докладов определяется жеребьёвкой. Найдите вероятность того, что ${poryadkovoe(num(p, 'm'))} окажется доклад ученого из ${text(p, `s${num(p, 'ischem')}`)}.`;
  },
  dopustimo: (p) => {
    const k = [1, 2, 3].map((i) => num(p, `k${i}`));
    const i = num(p, 'ischem');
    const n = k.reduce((s, x) => s + x, 0);
    const strany = [1, 2, 3].map((j) => text(p, `s${j}`));
    return (
      k.every((x) => x >= 1) &&
      i >= 1 &&
      i <= 3 &&
      num(p, 'm') >= 1 &&
      num(p, 'm') <= n &&
      new Set(strany).size === 3 &&
      konechnaya((k[i - 1] as number) / n)
    );
  },
  otvet: (p) => num(p, `k${num(p, 'ischem')}`) / n09(p),
  perebor: (p) => 1 - (n09(p) - num(p, `k${num(p, 'ischem')}`)) / n09(p),
  shagi: (p) => {
    const m = num(p, `k${num(p, 'ischem')}`);
    return [
      {
        text: `Все исходы — чей доклад окажется ${poryadkovoe(num(p, 'm'))}, любой из докладов:`,
        formula: `n = ${num(p, 'k1')} + ${num(p, 'k2')} + ${num(p, 'k3')} = ${n09(p)}`,
        value: n09(p),
      },
      {
        text: `Благоприятные — учёные из ${text(p, `s${num(p, 'ischem')}`)}:`,
        formula: `m = ${m}`,
        value: m,
      },
      shagP(m, n09(p)),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 9',
      params: { k1: 3, s1: 'Норвегии', k2: 3, s2: 'России', k3: 4, s3: 'Испании', m: 8, ischem: 2 },
    },
  ],
  generator: (r: Rng): Params => {
    const [s1, s2, s3] = r.sample(STRANY, 3) as [string, string, string];
    const k1 = r.int(2, 7);
    const k2 = r.int(2, 7);
    const k3 = r.int(2, 7);
    return { k1, s1, k2, s2, k3, s3, m: r.int(1, k1 + k2 + k3), ischem: r.int(1, 3) };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одна позиция — один жребий среди всех',
      'занять её может любой из докладов; благоприятные — из одной страны',
    ],
    fraza: (p) =>
      `прямой пересчёт — ${poryadkovoe(num(p, 'm'))} равновероятно окажется любой из ${n09(p)} докладов.`,
    vizual: (p) =>
      plitki(
        [1, 2, 3].map((i) => ({
          label: `из ${text(p, `s${i}`)}`,
          count: num(p, `k${i}`),
          blago: i === num(p, 'ischem'),
        })),
      ),
  },
});

function n09(p: Params): number {
  return num(p, 'k1') + num(p, 'k2') + num(p, 'k3');
}

/** Вопросы про два броска кости: текст, условие на пару и что показать в клетке. */
const KOST: Record<
  string,
  {
    vopros: string;
    blago: string;
    podhodit: (a: number, b: number) => boolean;
    kletka: (a: number, b: number) => string;
  }
> = {
  sovpadayut: {
    vopros: 'выпавшие значения совпадают',
    blago: 'клетки диагонали, где значения совпали',
    podhodit: (a, b) => a === b,
    kletka: (a, b) => (a === b ? String(a) : ''),
  },
  razlichny: {
    vopros: 'выпавшие значения различны',
    blago: 'все клетки, кроме диагонали',
    podhodit: (a, b) => a !== b,
    kletka: (a, b) => `${a};${b}`,
  },
  'oba-chet': {
    vopros: 'оба раза выпадет чётное число очков',
    blago: 'клетки, где оба числа чётные',
    podhodit: (a, b) => a % 2 === 0 && b % 2 === 0,
    kletka: (a, b) => `${a};${b}`,
  },
  'hotya-by-6': {
    vopros: 'хотя бы один раз выпадет шесть очков',
    blago: 'последняя строка и последний столбец',
    podhodit: (a, b) => a === 6 || b === 6,
    kletka: (a, b) => `${a};${b}`,
  },
  'summa-chet': {
    vopros: 'сумма выпавших очков чётная',
    blago: 'клетки с чётной суммой',
    podhodit: (a, b) => (a + b) % 2 === 0,
    kletka: (a, b) => String(a + b),
  },
  'proizv-chet': {
    vopros: 'произведение выпавших очков чётное',
    blago: 'клетки с чётным произведением',
    podhodit: (a, b) => (a * b) % 2 === 0,
    kletka: (a, b) => String(a * b),
  },
  'pervoe-bolshe': {
    vopros: 'в первый раз выпадет больше очков, чем во второй',
    blago: 'клетки под диагональю',
    podhodit: (a, b) => a > b,
    kletka: (a, b) => `${a};${b}`,
  },
  'summa-bolshe-9': {
    vopros: 'сумма выпавших очков больше 9',
    blago: 'клетки с суммой 10, 11 и 12',
    podhodit: (a, b) => a + b > 9,
    kletka: (a, b) => String(a + b),
  },
  'summa-5': {
    vopros: 'сумма выпавших очков делится на 5',
    blago: 'клетки с суммой 5 и 10',
    podhodit: (a, b) => (a + b) % 5 === 0,
    kletka: (a, b) => String(a + b),
  },
  'raznost-1': {
    vopros: 'выпавшие значения отличаются на 1',
    blago: 'клетки рядом с диагональю',
    podhodit: (a, b) => Math.abs(a - b) === 1,
    kletka: (a, b) => `${a};${b}`,
  },
  'hotya-by-1': {
    vopros: 'хотя бы один раз выпадет единица',
    blago: 'первая строка и первый столбец',
    podhodit: (a, b) => a === 1 || b === 1,
    kletka: (a, b) => `${a};${b}`,
  },
  'oba-nechet': {
    vopros: 'оба раза выпадет нечётное число очков',
    blago: 'клетки, где оба числа нечётные',
    podhodit: (a, b) => a % 2 === 1 && b % 2 === 1,
    kletka: (a, b) => `${a};${b}`,
  },
};

function kost(p: Params): (typeof KOST)[string] {
  const k = KOST[text(p, 'rezhim')];
  if (k === undefined) {
    throw new Error(`Неизвестный вопрос про кость ${text(p, 'rezhim')}`);
  }
  return k;
}

const K10: Prototype = prototip({
  id: 'k4-10',
  blok: 'opredelenie',
  nazvanie: 'Кость дважды',
  tip: 'Таблица 6×6',
  zadachnik: [10, 10],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) =>
    `Игральную кость бросают два раза. Найдите вероятность того, что ${kost(p).vopros}. Ответ округлите до сотых.`,
  dopustimo: (p) => KOST[text(p, 'rezhim')] !== undefined && pary(kost(p).podhodit) > 0,
  otvet: (p) => pary(kost(p).podhodit),
  perebor: (p) => 1 - pary((a, b) => !kost(p).podhodit(a, b)),
  shagi: (p) => {
    const m = Math.round(pary(kost(p).podhodit) * 36);
    return [
      {
        text: 'Все исходы — пары значений двух бросков, каждая — клетка таблицы:',
        formula: 'n = 6 \\cdot 6 = 36',
        value: 36,
      },
      { text: `Благоприятные — ${kost(p).blago}:`, formula: `m = ${m}`, value: m },
      shagP(m, 36, 2),
    ];
  },
  varianty: [
    { n: 1, source: 'конспект', ref: 'конспект, задача 10', params: { rezhim: 'sovpadayut' } },
  ],
  generator: (r: Rng): Params => ({ rezhim: r.pick(Object.keys(KOST)) }),
  metodika: {
    metod: 'outcome-table',
    methodHints: [
      'кость бросают два раза — пара исходов',
      'спрашивают про свойство пары',
      'всего пар 6 · 6 = 36: таблица',
    ],
    fraza: () =>
      'таблица исходов — два броска, результат определяется парой значений, порядок важен.',
    vizual: (p) => tablitsaKostey(kost(p).kletka, kost(p).podhodit),
  },
});

/* ── Блок 2. Жребий, две группы, круглый стол (конспект 11–15) ──── */

const RODITELNOE_K: Record<number, string> = { 2: 'двух', 3: 'трех', 4: 'четырех' };
const CHISLA: Record<number, string> = {
  2: 'два',
  3: 'три',
  4: 'четыре',
  5: 'пять',
  6: 'шесть',
  7: 'семь',
  8: 'восемь',
  9: 'девять',
  10: 'десять',
  11: 'одиннадцать',
  12: 'двенадцать',
};

const K11: Prototype = prototip({
  id: 'k4-11',
  blok: 'zhrebiy',
  nazvanie: 'Олигархи на Марс',
  tip: 'Жребий на несколько мест',
  zadachnik: [11, 11],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const a = num(p, 'a');
    return `Илон Маск с помощью жребия выбирает ${RODITELNOE_K[num(p, 'k')]} олигархов для отправки на Марс. На Марс хотят попасть ${CHISLA[a]} ${skl(a, 'олигарх', 'олигарха', 'олигархов')} из Америки и ${CHISLA[num(p, 'b')]} из России, среди которых есть олигарх ${text(p, 'kto')} Найдите вероятность того, что ${text(p, 'kto')} полетит на Марс.`;
  },
  dopustimo: (p) => {
    const k = num(p, 'k');
    const n = num(p, 'a') + num(p, 'b');
    return (
      RODITELNOE_K[k] !== undefined &&
      CHISLA[num(p, 'a')] !== undefined &&
      CHISLA[num(p, 'b')] !== undefined &&
      k < n &&
      konechnaya(k / n)
    );
  },
  otvet: (p) => num(p, 'k') / (num(p, 'a') + num(p, 'b')),
  perebor: (p) => 1 - (num(p, 'a') + num(p, 'b') - num(p, 'k')) / (num(p, 'a') + num(p, 'b')),
  shagi: (p) => {
    const n = num(p, 'a') + num(p, 'b');
    return [
      {
        text: 'Все исходы — претенденты, любой из них равноправен:',
        formula: `n = ${num(p, 'a')} + ${num(p, 'b')} = ${n}`,
        value: n,
      },
      {
        text: `Благоприятные для ${text(p, 'kto')} — места на Марс:`,
        formula: `m = ${num(p, 'k')}`,
        value: num(p, 'k'),
      },
      shagP(num(p, 'k'), n),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 11',
      params: { k: 3, a: 4, b: 8, kto: 'Д.' },
    },
  ],
  generator: (r: Rng): Params => ({
    k: r.int(2, 4),
    a: r.int(2, 9),
    b: r.int(2, 12),
    kto: r.pick(INITSIALY),
  }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один жребий среди одинаково случайных кандидатов',
      'благоприятные — места в выбранной группе',
      'исходы пересчитываются напрямую',
    ],
    fraza: (p) =>
      `прямой пересчёт — жребий одинаково случаен для всех ${num(p, 'a') + num(p, 'b')} претендентов, мест ${num(p, 'k')}.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'летит', count: num(p, 'k') },
        { label: 'остаётся', count: num(p, 'a') + num(p, 'b') - num(p, 'k') },
      ),
  },
});

/** Пара: кто они друг другу — во множественном родительном и именительном. */
type Para = readonly [string, string, boolean];
const PARY: readonly [Para, ...Para[]] = [
  ['братьев', 'братья', false],
  ['близнецов', 'близнецы', false],
  ['сестёр', 'сёстры', true],
  ['подруг', 'подруги', true],
  ['друзей', 'друзья', false],
];

function para12(p: Params): Para {
  return PARY.find(([rod]) => rod === text(p, 'para')) ?? PARY[0];
}

const K12: Prototype = prototip({
  id: 'k4-12',
  blok: 'zhrebiy',
  nazvanie: 'Братья в двух автобусах',
  tip: 'Одного фиксируем',
  zadachnik: [12, 12],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return `${N} ${skl(N, 'спортсмен', 'спортсмена', 'спортсменов')}, включая ${para12(p)[0]} ${text(p, 'aR')} и ${text(p, 'bR')}, случайным образом занимают места в двух автобусах, чтобы поехать на соревнование. В каждом автобусе по ${k} ${skl(k, 'место', 'места', 'мест')}. С какой вероятностью ${para12(p)[1]} окажутся в одном автобусе?`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return N === 2 * k && k >= 5 && k % 10 !== 1 && N % 10 !== 1 && konechnaya((k - 1) / (N - 1));
  },
  otvet: (p) => (num(p, 'k') - 1) / (num(p, 'N') - 1),
  perebor: (p) => 1 - num(p, 'k') / (num(p, 'N') - 1),
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return [
      {
        text: `Посадим ${text(p, 'aR')}. Все исходы — места ${text(p, 'bR')} среди оставшихся:`,
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: `Благоприятные — свободные места в автобусе ${text(p, 'aR')}:`,
        formula: `m = ${k} - 1 = ${k - 1}`,
        value: k - 1,
      },
      shagP(k - 1, N - 1),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 12',
      params: { N: 26, k: 13, para: 'братьев', a: 'Олег', aR: 'Олега', b: 'Юрий', bR: 'Юрия' },
    },
  ],
  generator: (r: Rng): Params => {
    const k = r.int(5, 20);
    const [rod, , devochki] = r.pick(PARY);
    const [[a, aR], [b, bR]] = r.sample(devochki ? DEVOCHKI : MALCHIKI, 2) as [
      [string, string],
      [string, string],
    ];
    return { N: 2 * k, k, para: rod, a, aR, b, bR };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одного фиксируем, второй занимает одно из оставшихся мест',
      'благоприятные — свободные места в том же автобусе',
      'все места одинаково случайны',
    ],
    fraza: (p) =>
      `прямой пересчёт — посадим ${text(p, 'aR')}; ${text(p, 'b')} равновероятно занимает любое из ${num(p, 'N') - 1} оставшихся мест.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: `в автобусе ${text(p, 'aR')}`, count: num(p, 'k') - 1 },
        { label: 'в другом', count: num(p, 'k') },
      ),
  },
});

const K13: Prototype = prototip({
  id: 'k4-13',
  blok: 'zhrebiy',
  nazvanie: 'Друзья в одной группе',
  tip: 'Одного фиксируем',
  zadachnik: [13, 13],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const g = num(p, 'g');
    return `В классе ${N} ${skl(N, 'учащийся', 'учащихся', 'учащихся')}, среди них ${text(p, 'para')} — ${text(p, 'a')} и ${text(p, 'b')}. Учащихся случайным образом разбивают на ${g} ${skl(g, 'равную группу', 'равные группы', 'равных групп')}. Найдите вероятность того, что ${text(p, 'a')} и ${text(p, 'b')} окажутся в одной группе.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const g = num(p, 'g');
    return g >= 2 && N % g === 0 && N / g >= 2 && N % 10 !== 1 && konechnaya((N / g - 1) / (N - 1));
  },
  otvet: (p) => (num(p, 'N') / num(p, 'g') - 1) / (num(p, 'N') - 1),
  perebor: (p) => 1 - (num(p, 'N') - num(p, 'N') / num(p, 'g')) / (num(p, 'N') - 1),
  shagi: (p) => {
    const N = num(p, 'N');
    const g = num(p, 'g');
    const razmer = N / g;
    return [
      {
        text: `${N} человек делятся на ${g} ${g === 2 ? 'группы' : 'групп'} по ${razmer}. Посадим ${text(p, 'aR')}. Все исходы — места ${text(p, 'bR')} среди оставшихся:`,
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: `Благоприятные — свободные места в группе ${text(p, 'aR')}:`,
        formula: `m = ${razmer} - 1 = ${razmer - 1}`,
        value: razmer - 1,
      },
      shagP(razmer - 1, N - 1),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 13',
      params: {
        N: 9,
        g: 3,
        para: 'два друга',
        a: 'Михаил',
        aR: 'Михаила',
        b: 'Андрей',
        bR: 'Андрея',
      },
    },
  ],
  generator: (r: Rng): Params => {
    const g = r.int(2, 7);
    const devochki = r.int(0, 1) === 1;
    const [[a, aR], [b, bR]] = r.sample(devochki ? DEVOCHKI : MALCHIKI, 2) as [
      [string, string],
      [string, string],
    ];
    return { N: g * r.int(2, 10), g, para: devochki ? 'две подруги' : 'два друга', a, aR, b, bR };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одного друга фиксируем, второй — одно из оставшихся мест',
      'благоприятные — места в той же группе',
    ],
    fraza: (p) =>
      `прямой пересчёт — посадим ${text(p, 'aR')}; ${text(p, 'b')} равновероятно занимает любое из ${num(p, 'N') - 1} оставшихся мест.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: `в группе ${text(p, 'aR')}`, count: num(p, 'N') / num(p, 'g') - 1 },
        { label: 'в других группах', count: num(p, 'N') - num(p, 'N') / num(p, 'g') },
      ),
  },
});

const K14: Prototype = prototip({
  id: 'k4-14',
  blok: 'zhrebiy',
  nazvanie: 'В круге рядом',
  tip: 'Одного фиксируем',
  zadachnik: [14, 14],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `«Встаньте, дети, встаньте в круг», — сказала Снегурочка на празднике. В круг встали ${N} ${skl(N, 'старшеклассник', 'старшеклассника', 'старшеклассников')}, среди них ${text(p, 'a')} и ${text(p, 'b')}. С какой вероятностью ${text(p, 'a')} и ${text(p, 'b')} окажутся в круге рядом?`;
  },
  dopustimo: (p) => num(p, 'N') >= 4 && konechnaya(2 / (num(p, 'N') - 1)),
  otvet: (p) => 2 / (num(p, 'N') - 1),
  perebor: (p) => dolya(num(p, 'N') - 1, (i) => i === 1 || i === num(p, 'N') - 1),
  shagi: (p) => {
    const N = num(p, 'N');
    return [
      {
        text: `Поставим ${text(p, 'aR')}. Все исходы — места ${text(p, 'bR')} среди оставшихся:`,
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: `Благоприятные — соседние с ${text(p, 'aT')} места, справа и слева:`,
        formula: 'm = 2',
        value: 2,
      },
      shagP(2, N - 1),
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'конспект',
      ref: 'конспект, задача 14',
      params: { N: 11, a: 'Маша', aR: 'Машу', aT: 'Машей', b: 'Артем', bR: 'Артёма' },
    },
  ],
  generator: (r: Rng): Params => {
    const [[a, aR], [b, bR]] = [r.pick(DEVOCHKI), r.pick(MALCHIKI)];
    /* Винительный и творительный девочки: «поставим Машу», «рядом с Машей». */
    const aV = aR.replace(/ы$|и$/, (m) => (m === 'ы' ? 'у' : 'ю'));
    const aT = a.replace(/а$/, 'ой').replace(/я$/, 'ей');
    return { N: r.int(6, 25), a, aR: aV, aT, b, bR };
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одного фиксируем, второй занимает одно из оставшихся мест в круге',
      'благоприятные — два соседних места',
      'все места одинаково случайны',
    ],
    fraza: (p) =>
      `прямой пересчёт — поставим ${text(p, 'aR')}; ${text(p, 'b')} равновероятно встаёт на любое из ${num(p, 'N') - 1} оставшихся мест.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: `рядом с ${text(p, 'aT')}`, count: 2 },
        { label: 'не рядом', count: num(p, 'N') - 3 },
      ),
  },
});

const K15: Prototype = prototip({
  id: 'k4-15',
  blok: 'zhrebiy',
  nazvanie: 'Круглый стол: через одного',
  tip: 'Одного фиксируем',
  zadachnik: [15, 15],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const m = N - 2;
    return `За круглый стол на ${N} ${skl(N, 'стул', 'стула', 'стульев')} в случайном порядке рассаживаются ${m} ${skl(m, 'мальчик', 'мальчика', 'мальчиков')} и 2 девочки. Найдите вероятность того, что между девочками будет сидеть один мальчик.`;
  },
  dopustimo: (p) => num(p, 'N') >= 6 && konechnaya(2 / (num(p, 'N') - 1)),
  otvet: (p) => 2 / (num(p, 'N') - 1),
  /* Перебором: из N − 1 мест второй девочке подходят ровно два —
     через один стул вправо и через один влево. */
  perebor: (p) => dolya(num(p, 'N') - 1, (i) => i === 2 || i === num(p, 'N') - 2),
  shagi: (p) => {
    const N = num(p, 'N');
    return [
      {
        text: 'Посадим первую девочку. Все исходы — стулья второй среди оставшихся:',
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: 'Благоприятные — стулья через одного мальчика от первой, справа и слева:',
        formula: 'm = 2',
        value: 2,
      },
      shagP(2, N - 1),
    ];
  },
  varianty: [{ n: 1, source: 'конспект', ref: 'конспект, задача 15', params: { N: 201 } }],
  generator: (r: Rng): Params => ({
    N: r.pick([11, 21, 26, 41, 51, 81, 101, 126, 201, 251, 401, 501, 1001]),
  }),
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одну девочку фиксируем, вторая — одно из оставшихся мест',
      'благоприятные — места через одно от первой',
      'все места одинаково случайны',
    ],
    fraza: (p) =>
      `прямой пересчёт — посадим первую девочку; вторая равновероятно садится на любой из ${num(p, 'N') - 1} оставшихся стульев.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'через одного', count: 2 },
        { label: 'другие стулья', count: num(p, 'N') - 3 },
      ),
  },
});

/* ── Блок 3. Геометрическая вероятность (конспект 16–18) ────────── */

/** Длина дуги по часовой стрелке от a до b в часовых делениях. */
function duga(a: number, b: number): number {
  return (b - a + 12) % 12;
}

const K16: Prototype = prototip({
  id: 'k4-16',
  blok: 'geometricheskaya',
  nazvanie: 'Часы: где встала стрелка',
  tip: 'Отношение дуг',
  zadachnik: [16, 16],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Механические часы с двенадцатичасовым циферблатом в какой-то момент сломались и перестали идти. Найдите вероятность того, что часовая стрелка остановилась, достигнув отметки ${num(p, 'a')}, но не дойдя до отметки ${num(p, 'b')}.`,
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return a >= 1 && a <= 12 && b >= 1 && b <= 12 && a !== b && [3, 6, 9].includes(duga(a, b));
  },
  otvet: (p) => duga(num(p, 'a'), num(p, 'b')) / 12,
  /* Перебором положений стрелки по минутам: 720 положений за круг. */
  perebor: (p) =>
    dolya(720, (i) => {
      const chasy = (i - 1) / 60;
      return (chasy - num(p, 'a') + 12) % 12 < duga(num(p, 'a'), num(p, 'b'));
    }),
  shagi: (p) => {
    const l = duga(num(p, 'a'), num(p, 'b'));
    return [
      {
        text: 'Вся мера — полный круг циферблата, двенадцать часовых делений:',
        formula: 'L = 12',
        value: 12,
      },
      {
        text: `Благоприятная дуга — от отметки ${num(p, 'a')} до отметки ${num(p, 'b')}:`,
        formula: `l = ${l}`,
        value: l,
      },
      shagLL(l, 12, l / 12),
    ];
  },
  varianty: [{ n: 1, source: 'конспект', ref: 'конспект, задача 16', params: { a: 10, b: 1 } }],
  generator: (r: Rng): Params => {
    const a = r.int(1, 12);
    const d = r.pick([3, 6, 9]);
    return { a, b: ((a + d - 1) % 12) + 1 };
  },
  metodika: {
    metod: 'coordinate-line',
    methodHints: [
      'стрелка останавливается равномерно на круге',
      'событие задано промежутком между отметками',
      'вероятность — отношение дуги ко всей окружности',
    ],
    fraza: () =>
      'отношение мер — стрелка равновероятно останавливается в любой точке круга, событие задано дугой.',
    vizual: (p) => tsiferblat(num(p, 'a'), num(p, 'b')),
  },
});

const K17: Prototype = prototip({
  id: 'k4-17',
  blok: 'geometricheskaya',
  nazvanie: 'Озеро и домик для уточки',
  tip: 'Отношение площадей',
  zadachnik: [17, 17],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В парке имеется озеро круглой формы радиусом ${num(p, 'R')} м. На поверхности озера располагается круглый домик для уточки с диаметром ${num(p, 'd')} м. Парашютист случайно приземляется в озеро. С какой вероятностью он попадет на домик для уточки?`,
  dopustimo: (p) =>
    num(p, 'd') >= 1 &&
    num(p, 'd') < num(p, 'R') &&
    konechnaya((num(p, 'd') / 2) ** 2 / num(p, 'R') ** 2),
  otvet: (p) => (num(p, 'd') / 2) ** 2 / num(p, 'R') ** 2,
  /* Тот же ответ через площади с числом π: оно сокращается. */
  perebor: (p) => (Math.PI * (num(p, 'd') / 2) ** 2) / (Math.PI * num(p, 'R') ** 2),
  shagi: (p) => {
    const R = num(p, 'R');
    const r = num(p, 'd') / 2;
    const rTex = String(r).replace('.', '{,}');
    return [
      {
        text: 'Вся мера — площадь озера:',
        formula: `L = \\pi \\cdot ${R}^2 = ${R * R}\\pi`,
        value: R * R,
      },
      {
        text: 'Благоприятная — площадь домика; его радиус — половина диаметра:',
        formula: `r = \\dfrac{${num(p, 'd')}}{2} = ${rTex},\\quad l = \\pi \\cdot ${rTex}^2 = ${String(r * r).replace('.', '{,}')}\\pi`,
        value: r * r,
      },
      shagLL(`${String(r * r).replace('.', '{,}')}\\pi`, `${R * R}\\pi`, (r * r) / (R * R)),
    ];
  },
  varianty: [{ n: 1, source: 'конспект', ref: 'конспект, задача 17', params: { R: 5, d: 1 } }],
  generator: (r: Rng): Params => ({ R: r.pick([2, 4, 5, 6, 8, 10, 20]), d: r.int(1, 8) }),
  metodika: {
    metod: 'coordinate-line',
    methodHints: [
      'точка приземления равномерна по площади озера',
      'событие — попасть в фигуру внутри',
      'вероятность — отношение площадей',
    ],
    fraza: () =>
      'отношение мер — парашютист равновероятно попадает в любую точку озера, событие задано площадью.',
    vizual: (p) => ploshchadi(Math.PI * num(p, 'R') ** 2, Math.PI * (num(p, 'd') / 2) ** 2, 'м²'),
  },
});

const K18: Prototype = prototip({
  id: 'k4-18',
  blok: 'geometricheskaya',
  nazvanie: 'Колечко в саду',
  tip: 'Отношение площадей',
  zadachnik: [18, 18],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const t = num(p, 't');
    const T = num(p, 'T');
    return `Маша потеряла в саду колечко. Площадь сада ${num(p, 'S')} м², колечко может оказаться в любом месте сада. За ${t} ${skl(t, 'минуту', 'минуты', 'минут')} Маша успеет тщательно осмотреть 1 м² сада. С какой вероятностью Маша найдет колечко, если через ${T} ${skl(T, 'минуту', 'минуты', 'минут')} ей надо уезжать из сада?`;
  },
  dopustimo: (p) => {
    const S = num(p, 'S');
    const t = num(p, 't');
    const T = num(p, 'T');
    return t >= 1 && T % t === 0 && T / t < S && konechnaya(T / t / S);
  },
  otvet: (p) => num(p, 'T') / num(p, 't') / num(p, 'S'),
  perebor: (p) => 1 - (num(p, 'S') - num(p, 'T') / num(p, 't')) / num(p, 'S'),
  shagi: (p) => {
    const S = num(p, 'S');
    const l = num(p, 'T') / num(p, 't');
    return [
      {
        text: 'Вся мера — площадь сада, колечко равновероятно в любой его точке:',
        formula: `L = ${S}`,
        value: S,
      },
      {
        text: `Благоприятная — то, что Маша успеет осмотреть за ${num(p, 'T')} ${skl(num(p, 'T'), 'минуту', 'минуты', 'минут')}:`,
        formula: `l = ${drob(num(p, 'T'), num(p, 't'))} = ${l}`,
        value: l,
      },
      shagLL(l, S, l / S),
    ];
  },
  varianty: [
    { n: 1, source: 'конспект', ref: 'конспект, задача 18', params: { S: 800, t: 5, T: 40 } },
  ],
  generator: (r: Rng): Params => {
    const t = r.pick([2, 4, 5, 10]);
    return { S: r.int(4, 20) * 50, t, T: t * r.int(2, 24) };
  },
  metodika: {
    metod: 'coordinate-line',
    methodHints: [
      'колечко в любом месте сада равновероятно',
      'осмотренная площадь — благоприятная часть',
      'вероятность — отношение площадей',
    ],
    fraza: () =>
      'отношение мер — колечко равновероятно в любой точке сада, событие задано осмотренной площадью.',
    vizual: (p) => ploshchadi(num(p, 'S'), num(p, 'T') / num(p, 't'), 'м²'),
  },
});

/* ── Проверка дословности конспекта ─────────────────────────────── */

/** Условия конспекта — как они записаны у автора. Вариант 1 каждого
    прототипа обязан совпадать с ними символ в символ. */
const ISHODNYE: Record<string, string> = {
  'k4-01':
    'На тарелке 16 пирожков: 7 с мясом, 5 с капустой и 4 с вареньем. Вы выбираете наугад один пирожок. С какой вероятностью он окажется с вареньем?',
  'k4-02':
    'В онлайн-кинотеатре доступно по подписке 50 новых фильмов: 20 комедий, 15 боевиков, 15 драм. Какова вероятность, что наугад выбранный фильм не будет драмой?',
  'k4-03':
    'Антон играет с друзьями в «Мафию». В игре 10 карт, из них 2 — мафия. С какой вероятностью Антон станет «мафиози»?',
  'k4-04':
    'Кот спрятался в одном из 10 подъездов. Хозяева проверяют подъезды по порядку, начиная с первого. С какой вероятностью кот будет найден в первом или втором по счету из проверенных подъездов?',
  'k4-05':
    'Рэпер Клим готовится выступить на концерте. Он считает, что чем позже выступает артист на концерте, тем он круче. Порядок выступлений определяется случайным образом. С какой вероятностью Клим выступит после своих основных соперников: Гоги и Алекса? Ответ округлите до сотых.',
  'k4-06':
    'В посёлке Белая горка есть фруктовый сад, в котором растут яблони, груши и вишни. Их количества относятся как 8 : 1 : 3. Для фотосессии в саду Маша выбирает наугад одно дерево. Какая вероятность, что это вишня?',
  'k4-07':
    'Перед началом первого тура чемпионата по теннису участников разбивают на игровые пары случайным образом с помощью жребия. Всего в чемпионате участвует 46 теннисистов, среди которых 19 спортсменов из России, в том числе Ярослав Исаков. Найдите вероятность того, что в первом туре Ярослав Исаков будет играть с каким-либо теннисистом из России.',
  'k4-08':
    'В группе туристов 30 человек. Их вертолётом в несколько приёмов забрасывают в труднодоступный район по 6 человек за рейс. Порядок, в котором вертолёт перевозит туристов, случаен. Найдите вероятность того, что турист П. полетит первым рейсом вертолёта.',
  'k4-09':
    'На конференцию приехали 3 ученых из Норвегии, 3 из России и 4 из Испании. Каждый из них делает на конференции один доклад. Порядок докладов определяется жеребьёвкой. Найдите вероятность того, что восьмым окажется доклад ученого из России.',
  'k4-10':
    'Игральную кость бросают два раза. Найдите вероятность того, что выпавшие значения совпадают. Ответ округлите до сотых.',
  'k4-11':
    'Илон Маск с помощью жребия выбирает трех олигархов для отправки на Марс. На Марс хотят попасть четыре олигарха из Америки и восемь из России, среди которых есть олигарх Д. Найдите вероятность того, что Д. полетит на Марс.',
  'k4-12':
    '26 спортсменов, включая братьев Олега и Юрия, случайным образом занимают места в двух автобусах, чтобы поехать на соревнование. В каждом автобусе по 13 мест. С какой вероятностью братья окажутся в одном автобусе?',
  'k4-13':
    'В классе 9 учащихся, среди них два друга — Михаил и Андрей. Учащихся случайным образом разбивают на 3 равные группы. Найдите вероятность того, что Михаил и Андрей окажутся в одной группе.',
  'k4-14':
    '«Встаньте, дети, встаньте в круг», — сказала Снегурочка на празднике. В круг встали 11 старшеклассников, среди них Маша и Артем. С какой вероятностью Маша и Артем окажутся в круге рядом?',
  'k4-15':
    'За круглый стол на 201 стул в случайном порядке рассаживаются 199 мальчиков и 2 девочки. Найдите вероятность того, что между девочками будет сидеть один мальчик.',
  'k4-16':
    'Механические часы с двенадцатичасовым циферблатом в какой-то момент сломались и перестали идти. Найдите вероятность того, что часовая стрелка остановилась, достигнув отметки 10, но не дойдя до отметки 1.',
  'k4-17':
    'В парке имеется озеро круглой формы радиусом 5 м. На поверхности озера располагается круглый домик для уточки с диаметром 1 м. Парашютист случайно приземляется в озеро. С какой вероятностью он попадет на домик для уточки?',
  'k4-18':
    'Маша потеряла в саду колечко. Площадь сада 800 м², колечко может оказаться в любом месте сада. За 5 минут Маша успеет тщательно осмотреть 1 м² сада. С какой вероятностью Маша найдет колечко, если через 40 минут ей надо уезжать из сада?',
};

/** Прототипы конспекта по порядку номеров 1–18. */
export const KONSPEKT_4: readonly Prototype[] = [
  K01,
  K02,
  K03,
  K04,
  K05,
  K06,
  K07,
  K08,
  K09,
  K10,
  K11,
  K12,
  K13,
  K14,
  K15,
  K16,
  K17,
  K18,
];

for (const P of KONSPEKT_4) {
  const pervyy = P.varianty[0];
  const ishodnoe = ISHODNYE[P.id];
  if (pervyy === undefined || pervyy.source !== 'конспект') {
    throw new Error(`${P.id}: первый вариант должен быть задачей конспекта`);
  }
  if (ishodnoe === undefined || P.uslovie(pervyy.params) !== ishodnoe) {
    throw new Error(
      `${P.id}: условие варианта 1 разошлось с конспектом:\n${P.uslovie(pervyy.params)}\n${ishodnoe}`,
    );
  }
}

/** Разбор без формул — тем же способом, что у конспекта. */
export type { Step };
