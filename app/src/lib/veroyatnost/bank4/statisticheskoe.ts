/**
 * Задание №4, блок II: статистическое определение вероятности.
 *
 * Три прототипа из задачника Е. А. Ширяевой «ЕГЭпроф 2025»,
 * задачи 89–102. Отличие от первого блока в том, откуда берётся
 * вероятность: не из равновозможных исходов, а из наблюдённой доли.
 *
 * У двух прототипов округление стоит не у всех вариантов: в
 * задачнике «19 сумок из 160» просят округлить до сотых, а
 * «4 сумки из 200» — нет, потому что там дробь конечная. Поэтому
 * округление объявлено методом и читается из параметров варианта.
 */

import { skl } from '../morfologia';
import { konechnaya, num, type Prototype } from '../types';
import { plitkiDvuh, shagP } from './vizual';

const BLOK = 'statisticheskoe';

/** Округление, заданное параметром варианта: 0 — округления нет. */
const poParametru = (p: Record<string, number | string>): 2 | 3 | null => {
  const znakov = p['znakov'];
  return znakov === 2 ? 2 : znakov === 3 ? 3 : null;
};

/* ── 19. Садовые насосы ──────────────────────────────────────────── */

const P19: Prototype = {
  id: 'p4-19',
  blok: BLOK,
  nazvanie: 'Садовые насосы: брак в партии',
  tip: 'Вероятность противоположного события по доле',
  zadachnik: [89, 94],
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
        text: 'Все исходы — насосы партии, на контроль равновероятно попадёт любой:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        text: 'Благоприятные — исправные насосы:',
        formula: `m = ${N} - ${k} = ${N - k}`,
        value: N - k,
      },
      shagP(N - k, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    fraza: (p) =>
      `прямой пересчёт — на контроль равновероятно попадает любой из ${num(p, 'N')} насосов.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'исправный', count: num(p, 'N') - num(p, 'k') },
        { label: 'подтекает', count: num(p, 'k') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 89', params: { N: 900, k: 27 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 90', params: { N: 1200, k: 24 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 91', params: { N: 500, k: 1 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 92', params: { N: 2000, k: 12 } },
    { n: 5, source: 'задачник', ref: 'задачник 04, № 93', params: { N: 1000, k: 10 } },
    { n: 6, source: 'задачник', ref: 'задачник 04, № 94', params: { N: 1100, k: 44 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { N: 400, k: 6 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { N: 250, k: 3 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { N: 2500, k: 45 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { N: 800, k: 36 } },
  ],
};

/* ── 20. Фабрика сумок: доля со скрытым дефектом ─────────────────── */

const P20: Prototype = {
  id: 'p4-20',
  blok: BLOK,
  nazvanie: 'Фабрика сумок: доля с дефектом',
  tip: 'Вероятность противоположного события по доле',
  zadachnik: [95, 98],
  format: 'десятичная',
  okruglenie: poParametru,
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
        text: 'Все исходы — сумки партии, покупателю равновероятно достанется любая:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        text: 'Благоприятные — сумки без дефекта:',
        formula: `m = ${N} - ${k} = ${N - k}`,
        value: N - k,
      },
      shagP(N - k, N, znakov),
    ];
  },
  metodika: {
    metod: 'direct-count',
    fraza: (p) =>
      `прямой пересчёт — покупателю равновероятно достаётся любая из ${num(p, 'N')} сумок.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'без дефекта', count: num(p, 'N') - num(p, 'k') },
        { label: 'с дефектом', count: num(p, 'k') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 95', params: { N: 200, k: 4, znakov: 0 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 96', params: { N: 75, k: 6, znakov: 0 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 97', params: { N: 160, k: 19, znakov: 2 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 98', params: { N: 170, k: 18, znakov: 2 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { N: 250, k: 15, znakov: 0 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { N: 120, k: 9, znakov: 0 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { N: 300, k: 12, znakov: 0 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { N: 90, k: 7, znakov: 2 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { N: 140, k: 13, znakov: 2 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { N: 60, k: 7, znakov: 2 } },
  ],
};

/* ── 21. Фабрика сумок: «на q качественных приходится d» ─────────── */

const P21: Prototype = {
  id: 'p4-21',
  blok: BLOK,
  nazvanie: 'Фабрика сумок: на сколько качественных',
  tip: 'Вероятность, когда дана не доля, а отношение',
  zadachnik: [99, 102],
  format: 'десятичная',
  okruglenie: () => 2,
  uslovie: (p) => {
    const q = num(p, 'q');
    const d = num(p, 'd');
    return `Фабрика выпускает сумки. В среднем на ${q} ${skl(q, 'качественную сумку', 'качественные сумки', 'качественных сумок')} приходится ${d} ${skl(d, 'сумка', 'сумки', 'сумок')} со скрытыми дефектами. Найдите вероятность того, что купленная сумка окажется качественной. Результат округлите до сотых.`;
  },
  dopustimo: (p) => num(p, 'q') >= 1 && num(p, 'd') >= 1 && num(p, 'd') < num(p, 'q'),
  otvet: (p) => num(p, 'q') / (num(p, 'q') + num(p, 'd')),
  perebor: (p) => {
    const q = num(p, 'q');
    const d = num(p, 'd');
    let horoshih = 0;
    for (let i = 1; i <= q + d; i += 1) {
      if (i <= q) {
        horoshih += 1;
      }
    }
    return horoshih / (q + d);
  },
  shagi: (p) => {
    const q = num(p, 'q');
    const d = num(p, 'd');
    return [
      {
        text: 'Все исходы — сумки партии, качественные вместе с дефектными:',
        formula: `n = ${q} + ${d} = ${q + d}`,
        value: q + d,
      },
      { text: 'Благоприятные — качественные сумки:', formula: `m = ${q}`, value: q },
      shagP(q, q + d, 2),
    ];
  },
  metodika: {
    metod: 'direct-count',
    fraza: (p) =>
      `прямой пересчёт — покупателю равновероятно достаётся любая из ${num(p, 'q') + num(p, 'd')} сумок партии.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'качественная', count: num(p, 'q') },
        { label: 'с дефектом', count: num(p, 'd') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 99', params: { q: 110, d: 3 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 100', params: { q: 150, d: 14 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 101', params: { q: 140, d: 3 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 102', params: { q: 170, d: 15 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { q: 120, d: 5 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { q: 90, d: 7 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { q: 160, d: 11 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { q: 75, d: 8 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { q: 250, d: 13 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { q: 60, d: 9 } },
  ],
};

export const STATISTICHESKOE: readonly Prototype[] = [P19, P20, P21];
