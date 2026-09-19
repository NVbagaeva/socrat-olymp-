/**
 * Задание №5, прототипы метода «Формула»: 5.1 сумма несовместных,
 * 5.2 противоположное событие, 5.4 сумма совместных, 5.12 наименьшее
 * число попыток. Рисунка у них нет — только шаги с формулами.
 *
 * Исходные варианты — из задачника Е. А. Ширяевой «ЕГЭпроф 2025»,
 * остальные собирает генератор; ответ везде считается формулой типа.
 */

import { prototip, type Rng } from '../generator';
import { dec, konechnaya, text, type Params, type Prototype } from '../types';
import { bezRisunka } from './vizual5';
import { tex, tochnee, tochno, veroyatnost } from './obshchee';

/* ── 5.1. Сумма несовместных событий ─────────────────────────────── */

const TEMY = [
  'Вписанная окружность',
  'Внешние углы',
  'Тригонометрия',
  'Параллелограмм',
  'Треугольник',
  'Трапеция',
  'Площадь',
  'Углы',
  'Окружность',
  'Векторы',
  'Подобие',
  'Теорема Пифагора',
];

const P01: Prototype = prototip({
  id: 'p5-01',
  blok: 'nesovmestnye',
  nazvanie: 'Экзамен: вопрос по одной из двух тем',
  tip: 'Сумма несовместных событий',
  zadachnik: [1, 4],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `На экзамене по геометрии школьник отвечает на один вопрос из списка экзаменационных вопросов. Вероятность того, что это вопрос по теме «${text(p, 't1')}», равна ${dec(veroyatnost(p, 'p1'))}. Вероятность того, что это вопрос по теме «${text(p, 't2')}», равна ${dec(veroyatnost(p, 'p2'))}. Вопросов, которые одновременно относятся к этим двум темам, нет. Найдите вероятность того, что на экзамене школьнику достанется вопрос по одной из этих двух тем.`,
  dopustimo: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return (
      p1 > 0 &&
      p2 > 0 &&
      p1 + p2 < 1 &&
      text(p, 't1') !== text(p, 't2') &&
      konechnaya(tochnee(p1 + p2))
    );
  },
  otvet: (p) => tochnee(veroyatnost(p, 'p1') + veroyatnost(p, 'p2')),
  /* Второй путь: сто вопросов, подходящие считаются штуками. */
  perebor: (p) => {
    const a = Math.round(veroyatnost(p, 'p1') * 100);
    const b = Math.round(veroyatnost(p, 'p2') * 100);
    return (a + b) / 100;
  },
  shagi: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    return [
      {
        text: `События «вопрос по теме «${text(p, 't1')}»» и «вопрос по теме «${text(p, 't2')}»» несовместны: общих вопросов нет.`,
      },
      {
        text: 'Вероятность суммы несовместных событий — сумма их вероятностей:',
        formula: `P = p_1 + p_2 = ${tex(p1)} + ${tex(p2)} = ${tex(tochnee(p1 + p2))}`,
        value: tochnee(p1 + p2),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 1',
      params: { p1: 0.2, p2: 0.35, t1: 'Вписанная окружность', t2: 'Внешние углы' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 2',
      params: { p1: 0.25, p2: 0.35, t1: 'Тригонометрия', t2: 'Параллелограмм' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 3',
      params: { p1: 0.25, p2: 0.1, t1: 'Треугольник', t2: 'Трапеция' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 4',
      params: { p1: 0.45, p2: 0.45, t1: 'Площадь', t2: 'Углы' },
    },
  ],
  generator: (r: Rng): Params => {
    const [t1, t2] = r.sample(TEMY, 2) as [string, string];
    return { p1: tochnee(r.int(1, 12) * 0.05), p2: tochnee(r.int(1, 12) * 0.05), t1, t2 };
  },
  metodika: {
    metod: 'formula',
    methodHints: [
      'два события про один и тот же случайный выбор',
      'сказано, что вместе они не бывают — события несовместны',
      'нужна вероятность «одно или другое» — складываем',
    ],
    fraza: () => 'формула — события несовместны, вероятность суммы равна сумме вероятностей.',
    vizual: bezRisunka,
  },
});

/* ── 5.2. Противоположное событие ────────────────────────────────── */

const P02: Prototype = prototip({
  id: 'p5-02',
  blok: 'protivopolozhnoe',
  nazvanie: 'Температура тела: «или выше»',
  tip: 'Противоположное событие',
  zadachnik: [5, 8],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Вероятность того, что в случайный момент времени температура тела здорового человека окажется ниже ${text(p, 't')} °C, равна ${dec(veroyatnost(p, 'p'))}. Найдите вероятность того, что в случайный момент времени у здорового человека температура тела окажется ${text(p, 't')} °C или выше.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    return q > 0 && q < 1 && konechnaya(tochnee(1 - q));
  },
  otvet: (p) => tochnee(1 - veroyatnost(p, 'p')),
  /* Второй путь: из ста измерений «ниже» — целое число, остальные — «или выше». */
  perebor: (p) => (100 - Math.round(veroyatnost(p, 'p') * 100)) / 100,
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    return [
      {
        text: `События «ниже ${text(p, 't')} °C» и «${text(p, 't')} °C или выше» противоположны: одно из них происходит обязательно, вместе — никогда.`,
      },
      {
        text: 'Вероятность противоположного события — единица минус вероятность данного:',
        formula: `P = 1 - p = 1 - ${tex(q)} = ${tex(tochnee(1 - q))}`,
        value: tochnee(1 - q),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 5', params: { p: 0.87, t: '36,8' } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 6', params: { p: 0.94, t: '36,8' } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 7', params: { p: 0.89, t: '36,8' } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 8', params: { p: 0.91, t: '36,8' } },
  ],
  generator: (r: Rng): Params => ({ p: r.dec(0.75, 0.98, 2), t: r.pick(['36,8', '36,6', '36,9']) }),
  metodika: {
    metod: 'formula',
    methodHints: [
      'дана вероятность одного события, спрашивают про его отрицание',
      '«ниже» и «или выше» — противоположные события',
      'ответ — единица минус данная вероятность',
    ],
    fraza: () => 'формула — события противоположны, вероятность равна единице минус данная.',
    vizual: bezRisunka,
  },
});

/* ── 5.4. Сумма совместных событий: два автомата ─────────────────── */

const P04: Prototype = prototip({
  id: 'p5-04',
  blok: 'sovmestnye',
  nazvanie: 'Два автомата: кофе останется в обоих',
  tip: 'Сумма совместных событий',
  zadachnik: [21, 24],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В торговом центре два одинаковых автомата продают кофе. Вероятность того, что к концу дня в первом автомате закончится кофе, равна ${dec(veroyatnost(p, 'p'))}. Вероятность того, что кофе закончится во втором автомате, такая же. Вероятность того, что кофе закончится в обоих автоматах, равна ${dec(veroyatnost(p, 'p12'))}. Найдите вероятность того, что к концу дня кофе останется в обоих автоматах.`,
  dopustimo: (p) => {
    const q = veroyatnost(p, 'p');
    const q12 = veroyatnost(p, 'p12');
    return q > 0 && q12 > 0 && q12 < q && 2 * q - q12 < 1 && konechnaya(tochnee(1 - 2 * q + q12));
  },
  otvet: (p) => tochnee(1 - (2 * veroyatnost(p, 'p') - veroyatnost(p, 'p12'))),
  /* Второй путь: сто дней штуками — закончился в первом, во втором,
     в обоих; «хотя бы в одном» считается объединением. */
  perebor: (p) => {
    const a = Math.round(veroyatnost(p, 'p') * 100);
    const ab = Math.round(veroyatnost(p, 'p12') * 100);
    const hotyaBy = a + a - ab;
    return (100 - hotyaBy) / 100;
  },
  shagi: (p) => {
    const q = veroyatnost(p, 'p');
    const q12 = veroyatnost(p, 'p12');
    const hotyaBy = tochnee(2 * q - q12);
    return [
      {
        text: 'Событие «кофе закончится хотя бы в одном автомате» — сумма совместных событий A и B; их общую часть вычитаем, чтобы не посчитать дважды:',
        formula: `P(A + B) = P(A) + P(B) - P(AB) = ${tex(q)} + ${tex(q)} - ${tex(q12)} = ${tex(hotyaBy)}`,
        value: hotyaBy,
      },
      {
        text: '«Кофе останется в обоих» — противоположное событие:',
        formula: `P = 1 - ${tex(hotyaBy)} = ${tex(tochnee(1 - hotyaBy))}`,
        value: tochnee(1 - hotyaBy),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 21', params: { p: 0.1, p12: 0.03 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 22', params: { p: 0.1, p12: 0.05 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 23', params: { p: 0.2, p12: 0.05 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 24', params: { p: 0.2, p12: 0.06 } },
  ],
  generator: (r: Rng): Params => {
    const q = r.int(1, 6) * 0.05;
    return { p: tochnee(q), p12: r.dec(0.01, tochnee(q - 0.01), 2) };
  },
  metodika: {
    metod: 'formula',
    methodHints: [
      'два события могут случиться вместе — дана вероятность «в обоих»',
      'спрашивают про «ни в одном»: сначала «хотя бы в одном»',
      'сумма совместных событий минус их пересечение, затем противоположное',
    ],
    fraza: () =>
      'формула — события совместны: складываем вероятности, вычитаем общую часть, берём противоположное.',
    vizual: bezRisunka,
  },
});

/* ── 5.12. Наименьшее число патронов ─────────────────────────────── */

/** Наименьшее k, при котором 1 − (1 − p)^k ≥ q. */
function naimensheeK(p: number, q: number): number {
  let k = 1;
  while (tochnee(1 - (1 - p) ** k) < q) {
    k += 1;
    if (k > 50) {
      return k;
    }
  }
  return k;
}

const P12: Prototype = prototip({
  id: 'p5-12',
  blok: 'naimenshee',
  nazvanie: 'Стрелок стреляет, пока не попадёт',
  tip: 'Наименьшее число попыток',
  zadachnik: [55, 58],
  format: 'целое',
  okruglenie: tochno,
  uslovie: (p) =>
    `Стрелок в тире стреляет по мишени до тех пор, пока не поразит её. Известно, что он попадает в цель с вероятностью ${dec(veroyatnost(p, 'p'))} при каждом отдельном выстреле. Какое наименьшее количество патронов нужно дать стрелку, чтобы он поразил цель с вероятностью не меньше ${dec(veroyatnost(p, 'q'))}?`,
  dopustimo: (p) => {
    const pp = veroyatnost(p, 'p');
    const q = veroyatnost(p, 'q');
    if (pp <= 0 || pp >= 1 || q <= pp || q >= 1) {
      return false;
    }
    const k = naimensheeK(pp, q);
    return k >= 2 && k <= 6;
  },
  otvet: (p) => naimensheeK(veroyatnost(p, 'p'), veroyatnost(p, 'q')),
  /* Второй путь: складываем вероятности «первое попадание ровно на k-м
     выстреле», пока сумма не дотянет до порога. */
  perebor: (p) => {
    const pp = veroyatnost(p, 'p');
    const q = veroyatnost(p, 'q');
    let summa = 0;
    let k = 0;
    while (summa < q - 1e-12 && k < 50) {
      k += 1;
      summa = tochnee(summa + (1 - pp) ** (k - 1) * pp);
    }
    return k;
  },
  shagi: (p) => {
    const pp = veroyatnost(p, 'p');
    const q = veroyatnost(p, 'q');
    const k = naimensheeK(pp, q);
    const promah = tochnee(1 - pp);
    const stroki: string[] = [];
    for (let i = 1; i <= k; i += 1) {
      const pk = tochnee(1 - promah ** i);
      stroki.push(
        `P_{${i}} = 1 - ${tex(promah)}^{${i}} = ${tex(pk)} ${pk < q ? '<' : '\\ge'} ${tex(q)}`,
      );
    }
    return [
      {
        text: `Промах при одном выстреле — ${dec(promah)}. Стрелок не поразит цель за k выстрелов, если промахнётся все k раз; поразит — в противоположном случае:`,
        formula: `P_k = 1 - ${tex(promah)}^{k}`,
      },
      {
        text: 'Перебираем k, пока вероятность не дотянет до порога:',
        formula: stroki.join(';\\quad '),
      },
      { text: 'Наименьшее число патронов:', formula: `k = ${k}`, value: k },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 55', params: { p: 0.5, q: 0.7 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 56', params: { p: 0.5, q: 0.8 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 57', params: { p: 0.4, q: 0.7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 58', params: { p: 0.6, q: 0.8 } },
  ],
  generator: (r: Rng): Params => ({ p: r.dec(0.3, 0.7, 1), q: r.dec(0.7, 0.95, 2) }),
  metodika: {
    metod: 'formula',
    methodHints: [
      'испытание повторяется до первого успеха',
      'спрашивают наименьшее число попыток при заданном пороге',
      'вероятность «хотя бы раз за k» — единица минус промахи в степени k, k перебирается',
    ],
    fraza: () =>
      'формула — вероятность поразить цель за k выстрелов считается через противоположное событие, k подбирается перебором.',
    vizual: bezRisunka,
  },
});

export const FORMULY: readonly Prototype[] = [P01, P02, P04, P12];
