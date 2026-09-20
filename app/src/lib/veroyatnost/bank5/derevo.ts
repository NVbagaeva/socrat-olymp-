/**
 * Задание №5, прототипы на дереве вероятностей: 5.7 умножение
 * независимых событий — два прототипа (шахматы; стрелок и четыре
 * мишени), 5.8 «хотя бы один» (лампы), 5.9 выбор двух объектов
 * (фломастеры), 5.10 перебор сценариев (футбол).
 *
 * Дерево растёт сверху вниз, подходящие пути подсвечены; вдоль пути
 * вероятности перемножаются, подходящие пути складываются.
 */

import { prototip, type Rng } from '../generator';
import { dec, konechnaya, num, text, type Params, type Prototype } from '../types';
import { derevo, type Vetv } from './vizual5';
import { tex, tochnee, tochno, veroyatnost } from './obshchee';

/* ── 5.7а. Умножение независимых: шахматы, обе партии ────────────── */

const P06: Prototype = prototip({
  id: 'p5-06',
  blok: 'nezavisimye',
  nazvanie: 'Шахматист: выиграет обе партии',
  tip: 'Умножение независимых событий',
  zadachnik: [29, 32],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Если шахматист А. играет белыми фигурами, то он выигрывает у шахматиста Б. с вероятностью ${dec(veroyatnost(p, 'pb'))}. Если А. играет чёрными, то А. выигрывает у Б. с вероятностью ${dec(veroyatnost(p, 'pc'))}. Шахматисты А. и Б. играют две партии, причём во второй партии меняют цвет фигур. Найдите вероятность того, что А. выиграет оба раза.`,
  dopustimo: (p) => {
    const pb = veroyatnost(p, 'pb');
    const pc = veroyatnost(p, 'pc');
    return pb > 0 && pb < 1 && pc > 0 && pc < 1 && konechnaya(tochnee(pb * pc));
  },
  otvet: (p) => tochnee(veroyatnost(p, 'pb') * veroyatnost(p, 'pc')),
  /* Второй путь: сотни партий каждого цвета — целыми штуками. */
  perebor: (p) => {
    const a = Math.round(veroyatnost(p, 'pb') * 100);
    const b = Math.round(veroyatnost(p, 'pc') * 100);
    return (a * b) / 10000;
  },
  shagi: (p) => {
    const pb = veroyatnost(p, 'pb');
    const pc = veroyatnost(p, 'pc');
    return [
      {
        text: `Первую партию А. играет белыми и выигрывает с вероятностью ${dec(pb)}, вторую — чёрными, с вероятностью ${dec(pc)}. Партии независимы.`,
      },
      {
        text: 'Нужен один путь по дереву — выигрыш и там, и там; вдоль пути вероятности перемножаются:',
        formula: `P = p_1 \\cdot p_2 = ${tex(pb)} \\cdot ${tex(pc)} = ${tex(tochnee(pb * pc))}`,
        value: tochnee(pb * pc),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 29', params: { pb: 0.5, pc: 0.32 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 30', params: { pb: 0.6, pc: 0.45 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 31', params: { pb: 0.5, pc: 0.3 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 32', params: { pb: 0.6, pc: 0.4 } },
  ],
  generator: (r: Rng): Params => ({ pb: r.dec(0.3, 0.7, 2), pc: r.dec(0.25, 0.6, 2) }),
  metodika: {
    metod: 'probability-tree',
    methodHints: [
      'два независимых испытания подряд — две партии',
      'спрашивают про конкретный исход в каждом из них',
      'один путь по дереву — вероятности перемножаются',
    ],
    fraza: () => 'дерево вероятностей — две независимые партии, подходит один путь: умножаем.',
    vizual: (p) => {
      const pb = veroyatnost(p, 'pb');
      const pc = veroyatnost(p, 'pc');
      const branches: Vetv[] = [
        { id: 'w', parent: null, label: 'выиграл', p: pb },
        { id: 'l', parent: null, label: 'не выиграл', p: tochnee(1 - pb) },
        { id: 'ww', parent: 'w', label: 'выиграл', p: pc },
        { id: 'wl', parent: 'w', label: 'не выиграл', p: tochnee(1 - pc) },
        { id: 'lw', parent: 'l', label: 'выиграл', p: pc },
        { id: 'll', parent: 'l', label: 'не выиграл', p: tochnee(1 - pc) },
      ];
      return derevo(['1-я партия, белые', '2-я партия, чёрные'], branches, ['ww']);
    },
  },
});

/* ── 5.7б. Умножение независимых: стрелок и четыре мишени ────────── */

/** Схема попаданий: буква на выстрел, «p» — попал, «m» — промах. */
const SHEMY: Record<string, string> = {
  pmmm: 'попадёт в первую мишень и не попадёт в три последние',
  pppm: 'в первые три мишени попадёт и не попадёт в последнюю',
  ppmm: 'попадёт в две первые мишени и не попадёт в две последние',
  mppp: 'не попадёт в первую мишень и попадёт в три последние',
  mmpp: 'не попадёт в две первые мишени и попадёт в две последние',
};

function shema(p: Params): string {
  const s = text(p, 'shema');
  if (SHEMY[s] === undefined) {
    throw new Error(`Неизвестная схема ${s}`);
  }
  return s;
}

const P07: Prototype = prototip({
  id: 'p5-07',
  blok: 'nezavisimye',
  nazvanie: 'Стрелок: четыре мишени по одному выстрелу',
  tip: 'Умножение независимых событий',
  zadachnik: [33, 36],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Стрелок стреляет по одному разу в каждую из четырёх мишеней. Вероятность попадания в мишень при каждом отдельном выстреле равна ${dec(veroyatnost(p, 'p'))}. Найдите вероятность того, что стрелок ${SHEMY[shema(p)]}.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    return q > 0 && q < 1 && SHEMY[text(p, 'shema')] !== undefined && konechnaya(P07otvet(p));
  },
  otvet: (p) => P07otvet(p),
  /* Второй путь: перебор всех 16 последовательностей с их весами. */
  perebor: (p) => {
    const q = veroyatnost(p, 'p');
    const s = shema(p);
    let summa = 0;
    for (let mask = 0; mask < 16; mask += 1) {
      let ves = 1;
      let sovpalo = true;
      for (let i = 0; i < 4; i += 1) {
        const popal = ((mask >> i) & 1) === 1;
        ves *= popal ? q : 1 - q;
        if (popal !== (s[i] === 'p')) {
          sovpalo = false;
        }
      }
      if (sovpalo) {
        summa += ves;
      }
    }
    return tochnee(summa);
  },
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const s = shema(p);
    const slova = [...s].map((c) => (c === 'p' ? 'попал' : 'промах')).join(', ');
    const mnozhiteli = [...s].map((c) => tex(c === 'p' ? q : tochnee(1 - q))).join(' \\cdot ');
    return [
      {
        text: `Выстрелы независимы. Попадание — ${dec(q)}, промах — всё остальное:`,
        formula: `1 - ${tex(q)} = ${tex(tochnee(1 - q))}`,
      },
      {
        text: `Нужная последовательность: ${slova}. Это один путь по дереву; вдоль пути вероятности перемножаются:`,
        formula: `P = ${mnozhiteli} = ${tex(P07otvet(p))}`,
        value: P07otvet(p),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 33', params: { p: 0.9, shema: 'pmmm' } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 34', params: { p: 0.8, shema: 'pmmm' } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 35', params: { p: 0.6, shema: 'pppm' } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 36', params: { p: 0.7, shema: 'ppmm' } },
  ],
  generator: (r: Rng): Params => ({ p: r.dec(0.5, 0.9, 1), shema: r.pick(Object.keys(SHEMY)) }),
  metodika: {
    metod: 'probability-tree',
    methodHints: [
      'несколько одинаковых независимых испытаний подряд',
      'спрашивают про конкретную последовательность попаданий и промахов',
      'один путь по дереву — вероятности перемножаются',
    ],
    fraza: () =>
      'дерево вероятностей — четыре независимых выстрела, подходит ровно один путь: умножаем.',
    vizual: (p) => {
      /* Дерево из четырёх уровней целиком не помещается: раскрываем
         только ветку нужного пути, остальные ветви — листья. */
      const q = veroyatnost(p, 'p');
      const s = shema(p);
      const branches: Vetv[] = [];
      let parent: string | null = null;
      let put = '';
      for (let i = 0; i < 4; i += 1) {
        const nuzhno = s[i] === 'p';
        for (const popal of [true, false]) {
          const id = put + (popal ? 'p' : 'm');
          branches.push({
            id,
            parent,
            label: popal ? 'попал' : 'промах',
            p: popal ? q : tochnee(1 - q),
          });
        }
        put += nuzhno ? 'p' : 'm';
        parent = put;
      }
      return derevo(['1-й выстрел', '2-й выстрел', '3-й выстрел', '4-й выстрел'], branches, [s]);
    },
  },
});

function P07otvet(p: Params): number {
  const q = veroyatnost(p, 'p');
  const s = shema(p);
  let out = 1;
  for (const c of s) {
    out *= c === 'p' ? q : 1 - q;
  }
  return tochnee(out);
}

/* ── 5.8. Лампы: хотя бы одна не перегорит ───────────────────────── */

/** Число ламп: в задачнике три; генератор берёт от двух до четырёх,
    иначе с ответом до четырёх знаков вариантов не набирается. */
function lamp(p: Params): number {
  return num(p, 'n');
}

const LAMPY: Record<number, string> = {
  2: 'двумя лампами',
  3: 'тремя лампами',
  4: 'четырьмя лампами',
};
const SLOVAMI: Record<number, string> = { 2: 'две', 3: 'три', 4: 'четыре' };

const P08: Prototype = prototip({
  id: 'p5-08',
  blok: 'hotya-by-odin',
  nazvanie: 'Лампы: хотя бы одна не перегорит',
  tip: '«Хотя бы один» через противоположное событие',
  zadachnik: [37, 40],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Помещение освещается ${LAMPY[lamp(p)]}. Вероятность перегорания каждой лампы в течение года равна ${dec(veroyatnost(p, 'p'))}. Лампы перегорают независимо друг от друга. Найдите вероятность того, что в течение года хотя бы одна лампа не перегорит.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    const n = lamp(p);
    return LAMPY[n] !== undefined && q > 0 && q < 1 && konechnaya(tochnee(1 - q ** n));
  },
  otvet: (p) => tochnee(1 - veroyatnost(p, 'p') ** lamp(p)),
  /* Второй путь: перебор восьми исходов, складываем подходящие. */
  perebor: (p) => {
    const q = veroyatnost(p, 'p');
    const n = lamp(p);
    let summa = 0;
    for (let mask = 0; mask < 2 ** n; mask += 1) {
      let ves = 1;
      let tselyh = 0;
      for (let i = 0; i < n; i += 1) {
        const peregorela = ((mask >> i) & 1) === 1;
        ves *= peregorela ? q : 1 - q;
        tselyh += peregorela ? 0 : 1;
      }
      if (tselyh >= 1) {
        summa += ves;
      }
    }
    return tochnee(summa);
  },
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const n = lamp(p);
    const vse = tochnee(q ** n);
    return [
      {
        text: `Противоположное событие — все ${SLOVAMI[n] ?? n} лампы перегорели. Лампы независимы, вдоль этого пути вероятности перемножаются:`,
        formula: `P(\\bar A) = ${tex(q)}^${n} = ${tex(vse)}`,
        value: vse,
      },
      {
        text: '«Хотя бы одна не перегорит» — всё остальное:',
        formula: `P = 1 - ${tex(vse)} = ${tex(tochnee(1 - vse))}`,
        value: tochnee(1 - vse),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 37', params: { n: 3, p: 0.8 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 38', params: { n: 3, p: 0.9 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 39', params: { n: 3, p: 0.7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 40', params: { n: 3, p: 0.6 } },
  ],
  /* Две лампы — вероятность с двумя знаками (ответ до четырёх),
     три и четыре — с одним. */
  generator: (r: Rng): Params => {
    const n = r.pick([2, 3, 4]);
    return { n, p: n === 2 ? r.dec(0.5, 0.95, 2) : r.dec(0.3, 0.9, 1) };
  },
  metodika: {
    metod: 'probability-tree',
    methodHints: [
      'несколько независимых одинаковых событий',
      'спрашивают «хотя бы один»',
      'проще через противоположное: «ни одного» — один путь по дереву',
    ],
    fraza: (p) =>
      `дерево вероятностей — «хотя бы одна» проще через противоположное событие: все ${SLOVAMI[lamp(p)] ?? lamp(p)} перегорели — один путь.`,
    vizual: (p) => {
      /* До конца раскрыт только путь противоположного события — «все
         перегорели»; как только лампа оказалась целой, событие уже
         наступило, и эта ветка — лист. Подсвечены все листья с целой
         лампой, их сумма и есть ответ. */
      const q = veroyatnost(p, 'p');
      const n = lamp(p);
      const ok = tochnee(1 - q);
      const branches: Vetv[] = [];
      const listya: string[] = [];
      let parent: string | null = null;
      let put = '';
      for (let uroven = 0; uroven < n; uroven += 1) {
        branches.push({ id: `${put}b`, parent, label: 'перегорела', p: q });
        branches.push({ id: `${put}c`, parent, label: 'целая', p: ok });
        listya.push(`${put}c`);
        put += 'b';
        parent = put;
      }
      return derevo(
        Array.from({ length: n }, (_, i) => `${i + 1}-я лампа`),
        branches,
        listya,
      );
    },
  },
});

/* ── 5.9. Выбор двух объектов: фломастеры ────────────────────────── */

function n09(p: Params): number {
  return num(p, 'a') + num(p, 'b') + num(p, 'c');
}

const P09: Prototype = prototip({
  id: 'p5-09',
  blok: 'dva-obekta',
  nazvanie: 'Фломастеры: один синий и один красный',
  tip: 'Выбор двух объектов',
  zadachnik: [41, 44],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В коробке ${num(p, 'a')} синих, ${num(p, 'b')} красных и ${num(p, 'c')} зелёных фломастеров. Случайным образом выбирают два фломастера. Найдите вероятность того, что окажутся выбраны один синий и один красный фломастеры.`,
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const n = a + b + c;
    return (
      a >= 3 &&
      b >= 3 &&
      c >= 3 &&
      n >= 15 &&
      n <= 30 &&
      konechnaya(tochnee((2 * a * b) / (n * (n - 1))))
    );
  },
  otvet: (p) => {
    const n = n09(p);
    return tochnee((2 * num(p, 'a') * num(p, 'b')) / (n * (n - 1)));
  },
  /* Второй путь: перебор упорядоченных пар разных фломастеров. */
  perebor: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const n = n09(p);
    const tsvet = (i: number): string => (i < a ? 's' : i < a + b ? 'k' : 'z');
    let ok = 0;
    let vsego = 0;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (i === j) {
          continue;
        }
        vsego += 1;
        const para = tsvet(i) + tsvet(j);
        if (para === 'sk' || para === 'ks') {
          ok += 1;
        }
      }
    }
    return tochnee(ok / vsego);
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const n = n09(p);
    const odin = a * b;
    const znam = n * (n - 1);
    return [
      {
        text: 'Фломастеров всего:',
        formula: `n = ${a} + ${b} + ${c} = ${n}`,
        value: n,
      },
      {
        text: 'Путь «сначала синий, потом красный»: второй берём из оставшихся, их на один меньше:',
        formula: `\\dfrac{${a}}{${n}} \\cdot \\dfrac{${b}}{${n - 1}} = \\dfrac{${odin}}{${znam}}`,
        value: odin / znam,
      },
      {
        text: 'Путь «сначала красный, потом синий» — столько же:',
        formula: `\\dfrac{${b}}{${n}} \\cdot \\dfrac{${a}}{${n - 1}} = \\dfrac{${odin}}{${znam}}`,
        value: odin / znam,
      },
      {
        text: 'Пути несовместны — складываем:',
        formula: `P = \\dfrac{${odin}}{${znam}} + \\dfrac{${odin}}{${znam}} = \\dfrac{${2 * odin}}{${znam}} = ${tex(tochnee((2 * odin) / znam))}`,
        value: tochnee((2 * odin) / znam),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 41', params: { a: 11, b: 6, c: 8 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 42', params: { a: 12, b: 6, c: 7 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 43', params: { a: 10, b: 3, c: 12 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 44', params: { a: 12, b: 4, c: 9 } },
  ],
  generator: (r: Rng): Params => {
    const n = r.int(15, 30);
    const a = r.int(3, n - 6);
    const b = r.int(3, n - a - 3);
    return { a, b, c: n - a - b };
  },
  metodika: {
    metod: 'probability-tree',
    methodHints: [
      'два предмета берут подряд из одной коробки — без возвращения',
      'после первого выбора остаётся на один предмет меньше',
      'подходят два пути (синий-красный и красный-синий) — складываем',
    ],
    fraza: () =>
      'дерево вероятностей — два выбора без возвращения, подходят два пути: умножаем вдоль каждого и складываем.',
    vizual: (p) => {
      const a = num(p, 'a');
      const b = num(p, 'b');
      const c = num(p, 'c');
      const n = n09(p);
      const tsveta = [
        ['s', 'синий', a],
        ['k', 'красный', b],
        ['z', 'зелёный', c],
      ] as const;
      const branches: Vetv[] = [];
      for (const [id, label, kol] of tsveta) {
        branches.push({ id, parent: null, label, p: kol / n, pLabel: `${kol}/${n}` });
      }
      /* Ветка «сначала зелёный» к ответу не ведёт — она остаётся
         листом, дерево не раскрывает её дальше. */
      for (const [id1, , kol1] of tsveta) {
        if (id1 === 'z') {
          continue;
        }
        for (const [id2, label, kol2] of tsveta) {
          const ostalos = id1 === id2 ? kol1 - 1 : kol2;
          branches.push({
            id: id1 + id2,
            parent: id1,
            label,
            p: ostalos / (n - 1),
            pLabel: `${ostalos}/${n - 1}`,
          });
        }
      }
      return derevo(['1-й фломастер', '2-й фломастер'], branches, ['sk', 'ks']);
    },
  },
});

/* ── 5.10. Перебор сценариев: футбол, хотя бы 4 очка ─────────────── */

const P10: Prototype = prototip({
  id: 'p5-10',
  blok: 'perebor-stsenariev',
  nazvanie: 'Футбол: хотя бы 4 очка в двух играх',
  tip: 'Перебор сценариев',
  zadachnik: [45, 48],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Чтобы пройти в следующий круг соревнований, футбольной команде нужно набрать хотя бы 4 очка в двух играх. Если команда выигрывает, она получает 3 очка, в случае ничьей — 1 очко, если проигрывает — 0 очков. Найдите вероятность того, что команде удастся выйти в следующий круг соревнований. Считайте, что в каждой игре вероятности выигрыша и проигрыша одинаковы и равны ${dec(veroyatnost(p, 'p'))}.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    /* Ничья — всё остальное, и она должна быть возможна. */
    return q > 0 && 1 - 2 * q > 0 && konechnaya(tochnee(2 * q - 3 * q * q));
  },
  otvet: (p) => {
    const q = veroyatnost(p, 'p');
    return tochnee(2 * q - 3 * q * q);
  },
  /* Второй путь: перебор девяти исходов двух игр с очками. */
  perebor: (p) => {
    const q = veroyatnost(p, 'p');
    const ishody = [
      [3, q],
      [1, 1 - 2 * q],
      [0, q],
    ] as const;
    let summa = 0;
    for (const [o1, p1] of ishody) {
      for (const [o2, p2] of ishody) {
        if (o1 + o2 >= 4) {
          summa += p1 * p2;
        }
      }
    }
    return tochnee(summa);
  },
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const nich = tochnee(1 - 2 * q);
    const vv = tochnee(q * q);
    const vn = tochnee(q * nich);
    return [
      {
        text: 'Ничья — всё, что не выигрыш и не проигрыш:',
        formula: `1 - ${tex(q)} - ${tex(q)} = ${tex(nich)}`,
      },
      {
        text: 'Хотя бы 4 очка дают три исхода двух игр: выигрыш-выигрыш (6 очков), выигрыш-ничья и ничья-выигрыш (по 4 очка). Вдоль каждого пути вероятности перемножаются, пути складываются:',
        formula: `P = ${tex(q)} \\cdot ${tex(q)} + ${tex(q)} \\cdot ${tex(nich)} + ${tex(nich)} \\cdot ${tex(q)} = ${tex(vv)} + ${tex(vn)} + ${tex(vn)} = ${tex(tochnee(vv + 2 * vn))}`,
        value: tochnee(vv + 2 * vn),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 45', params: { p: 0.3 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 46', params: { p: 0.4 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 47', params: { p: 0.2 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 48', params: { p: 0.1 } },
  ],
  generator: (r: Rng): Params => ({ p: r.dec(0.1, 0.45, 2) }),
  metodika: {
    metod: 'probability-tree',
    methodHints: [
      'две игры подряд, у каждой три исхода со своими вероятностями',
      'спрашивают про сумму очков — подходят несколько сочетаний',
      'несколько путей по дереву: умножаем вдоль каждого и складываем',
    ],
    fraza: () =>
      'дерево вероятностей — две игры по три исхода, подходят три пути: умножаем вдоль каждого и складываем.',
    vizual: (p) => {
      const q = veroyatnost(p, 'p');
      const nich = tochnee(1 - 2 * q);
      const ishody = [
        ['v', 'выигрыш', q],
        ['n', 'ничья', nich],
        ['l', 'проигрыш', q],
      ] as const;
      const branches: Vetv[] = [];
      for (const [id, label, pp] of ishody) {
        branches.push({ id, parent: null, label, p: pp });
      }
      /* После проигрыша в первой игре четырёх очков уже не набрать:
         эта ветка остаётся листом, дерево раскрывает только две. */
      for (const [id1] of ishody) {
        if (id1 === 'l') {
          continue;
        }
        for (const [id2, label, pp] of ishody) {
          branches.push({ id: id1 + id2, parent: id1, label, p: pp });
        }
      }
      return derevo(['1-я игра', '2-я игра'], branches, ['vv', 'vn', 'nv']);
    },
  },
});

export const DEREVO: readonly Prototype[] = [P06, P07, P08, P09, P10];
