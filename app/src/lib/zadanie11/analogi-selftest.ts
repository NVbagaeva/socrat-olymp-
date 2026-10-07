/**
 * Самопроверка пула аналогов задания №11 (pnpm test:zadanie11).
 *
 * На каждый прототип из пула — ровно 10 аналогов; у каждого:
 * solve(params) даёт ровно answer, ответ положительный, целый или с
 * двумя знаками после запятой; параметры модели не совпадают с банком
 * и с другими аналогами (и не отличаются от задачи банка одним
 * числом); тексты не повторяются; числа модели стоят в тексте, вопрос
 * текста совпадает с ask; числа правдоподобны для сюжета; варианты
 * вопроса распределены почти поровну; решение проходит те же проверки
 * методики, что задачи банка; склонения «1 час / 2 часа / 5 часов».
 */

import { BANK, RAZMINKA } from './bank';
import { POOL_ANALOGOV, type Analog } from './analogi';
import { paramsKey, pohozhaNa } from './gen/core';
import { kodNaSayte } from './kod';
import { METALL } from './prototypes/sm';
import { nice, txt } from './num';
import { subtype } from './prototypes';
import { GORODA } from './prototypes/rz';
import { GEROI, TARY, VESHCHESTVA } from './prototypes/syuzhety';
import {
  checkDrobnye,
  checkMetodika,
  checkOboznacheniya,
  checkSolved,
  type Problem,
} from './selftest';
import { chasy, chislo, sk, vremya, SLOVA } from './sklonenie';
import { VO_SKOLKO } from './prototypes/common';
import type { Params } from './types';

/** Ключи сюжета: на модель не влияют, в сравнении с банком не участвуют. */
const SYUZHET = new Set([
  'geroy',
  'vv',
  'tara',
  /* Слова сюжета разминки: товар, ёмкость, «кто» и «что» в процентах. */
  'tovar',
  'trRod',
  'eshche',
  'ostavit',
  'mat',
  'taraIm',
  'taraPr',
  'taraRod',
  'produkt',
  'ed',
  'edMn',
  'predmet',
  'lishniy',
  'mesto',
  'vse',
  'vseRod',
  'gr',
  'detiRod',
  'chast',
  'neTitle',
  'otvetChto',
  'grTitle',
  'tozhe',
  'oboz',
  'drob',
  'chisl',
  'znam',
  'novyy',
  'vel',
  'velVin',
  'mnozh',
  'zan',
  'zanRod',
  'pervaya',
  'dve',
  'per',
  'perRod',
  /* Проценты: кто получает доход, что дорожает, мелкая и крупная покупка. */
  'kto',
  'rost',
  'baza',
  'etap1',
  'etap2',
  'kogda1',
  'melk',
  'melkRod',
  'odna',
  'odnoy',
  'krupRod',
  'aKto',
  'aTitle',
  'aDohod',
  'bKto',
  'bTitle',
  'bDohod',
  'cKto',
  'cTitle',
  'cDohod',
  /* Смеси: металл, единицы, вещество и продукт. */
  'metal',
  'vesh',
  'veshIm',
  'smesPr',
  'perv',
  'syroe',
  'syroeRod',
  'syroePr',
  'suhoe',
  'suhoeRod',
  'suhoePr',
  'suhIm',
  'suhPr',
  'gotPr',
  'gotRod',
  'osnova',
  /* Движение: кто едет (быстрый и медленный, догоняющий). */
  'geroy2',
  'ktoRod',
  'bys',
  'bysRod',
  'medl',
  'medlRod',
  'ehal',
  'avto',
  'avtoRod',
  'avtoKr',
  'dog',
  'dogRod',
  'dogKr',
  /* Протяжённые тела: что проходит поезд, какие поезда. */
  'prep',
  'poezdA',
  'poezdARod',
  'poezdB',
  'poezdBRod',
]);

export function model(params: Params): Params {
  return Object.fromEntries(Object.entries(params).filter(([k]) => !SYUZHET.has(k)));
}

/** Число так, как оно пишется в условии: 15,2; 27 200 — пробелы сравниваем как обычные. */
function vTekste(x: number): string {
  return txt(x).replace(/\s/g, ' ');
}

/** Текст с обычными пробелами вместо неразрывных. */
const prostye = (t: string): string => t.replace(/\s/g, ' ');

/** Последнее предложение-вопрос условия. */
function poslednee(text: string): string {
  const parts = text.split(/(?<=[.?!])\s+/);
  return parts.filter((x) => x.includes('?') || /^(Найдите|Определите)/.test(x)).at(-1) ?? '';
}

/** Масса в граммах так, как её пишет разминка: 1250 → «1 кг 250 г». */
function massa(g: number): string {
  const kg = Math.floor(g / 1000);
  const gr = g - kg * 1000;
  return [kg > 0 ? `${kg} кг` : '', gr > 0 ? `${gr} г` : ''].filter(Boolean).join(' ');
}

/** Делится ли нацело: вариант вопроса «nacelo» / «ostatok» разминки. */
function nacelo(a: Analog, top: number, bottom: number): string[] {
  const ok = Math.abs(top / bottom - Math.round(top / bottom)) < 1e-9;
  return (a.ask === 'nacelo') === ok
    ? []
    : [`ask = ${a.ask}, а ${top} : ${bottom} ${ok ? 'нацело' : 'с остатком'}`];
}

/** Число в промежутке. */
function vne(what: string, x: number, lo: number, hi: number): string[] {
  return x < lo || x > hi ? [`${what} ${x} вне ${lo}–${hi}`] : [];
}

interface Pravilo {
  /** Какие параметры модели обязаны стоять в тексте числами. */
  chisla: string[] | ((a: Analog) => string[]);
  /** Вопрос текста соответствует ask. */
  vopros: (a: Analog) => boolean;
  /** Правдоподобие чисел для сюжета: список нарушений. */
  pravdopodobie: (a: Analog) => string[];
}

const num = (p: Params, k: string): number => Number(p[k]);

const PRAVILA: Record<string, Pravilo> = {
  /* ── Движение по прямой ── */
  'DP-01': {
    chisla: ['S', 't'],
    vopros: (a) => /километрах в час/.test(a.text),
    pravdopodobie: (a) => skorosti(a, 'geroy', [a.answer]),
  },
  'DP-02': {
    chisla: ['v1', 't2', 'v2', 'v3'],
    vopros: (a) => /среднюю скорость/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...skorosti(
        a,
        'geroy',
        ['v1', 'v2', 'v3'].map((k) => num(a.params, k)),
      ),
      ...(/Первый час/.test(a.text) ? [] : ['нет «Первый час»']),
      ...((
        num(a.params, 't3') === 1
          ? /последний час|затем 1 час/.test(a.text)
          : prostye(a.text).includes(prostye(sk(num(a.params, 't3'), SLOVA.chas)))
      )
        ? []
        : ['в тексте нет третьего участка t3']),
    ],
  },
  'DP-03': {
    chisla: (a) =>
      a.params.form === 'treti' ? ['v1', 'v2', 'v3'] : ['s1', 'v1', 's2', 'v2', 's3', 'v3'],
    vopros: (a) =>
      a.ask === a.params.form &&
      /среднюю скорость/.test(poslednee(a.text)) &&
      (a.ask === 'treti') === /треть/.test(a.text),
    pravdopodobie: (a) =>
      skorosti(
        a,
        'geroy',
        ['v1', 'v2', 'v3'].map((k) => num(a.params, k)),
      ),
  },
  'DP-04': {
    chisla: ['v1', 'v2'],
    vopros: (a) =>
      a.ask === a.params.form &&
      (a.ask === 'vremya'
        ? /половин[уа][^.,]*времени/i.test(a.text) && !POLOVINA_PUTI.test(a.text)
        : POLOVINA_PUTI.test(a.text) && !/времени/.test(a.text)),
    pravdopodobie: (a) => skorosti(a, 'geroy', [num(a.params, 'v1'), num(a.params, 'v2')]),
  },
  'DP-05': {
    chisla: ['L', 'T', 't', 'd'],
    vopros: (a) => /на спуске/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...skorosti(a, 'geroy', [a.answer, a.answer - num(a.params, 'd')]),
      ...slovaVTekste(a, ['kto']),
    ],
  },
  'DP-06': {
    chisla: ['D', 'h', 'v2', 's'],
    vopros: (a) => /скорость первого/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...skorosti(a, 'geroy', [a.answer, num(a.params, 'v2')]),
      ...slovaVTekste(a, ['ktoRod']),
    ],
  },
  'DP-08': {
    chisla: ['S', 'd'],
    vopros: (a) =>
      a.ask === 'first'
        ? /первым/.test(poslednee(a.text))
        : /вторым|второй/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const x = a.ask === 'first' ? a.answer - num(a.params, 'd') : a.answer;
      return skorosti(a, 'geroy', [x, x + num(a.params, 'd')]);
    },
  },
  'DP-09': {
    chisla: ['S', 'dv'],
    vopros: (a) => poslednee(a.text).includes(`скорость ${String(a.params.medlRod)}`),
    pravdopodobie: (a) => [
      ...vremyaVTekste(a, num(a.params, 'dt')),
      ...skorosti(a, 'geroy', [a.answer]),
      ...skorosti(a, 'geroy2', [a.answer + num(a.params, 'dv')]),
      ...slovaVTekste(a, ['bys', 'medl']),
    ],
  },
  'DP-10': {
    chisla: ['D', 'u'],
    vopros: (a) => /расстояние от А до С/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const u = num(a.params, 'u');
      return [
        ...skorosti(a, 'geroy', [(u * a.answer) / (a.answer + u)]),
        ...skorosti(a, 'geroy2', [u]),
        ...slovaVTekste(a, ['avto', 'dog']),
        ...(/через 1 час/.test(a.text) ? [] : ['нет «через 1 час»']),
      ];
    },
  },
  'DP-11': {
    chisla: ['delta'],
    vopros: (a) => poslednee(a.text).includes(String(a.params.medl).split(' ').at(-1) ?? '?'),
    pravdopodobie: (a) => [
      ...vremyaVTekste(a, num(a.params, 't')),
      ...slovaVTekste(a, ['bys', 'medl']),
    ],
  },
  'DP-12': {
    chisla: ['d', 'u', 'bound'],
    vopros: (a) => /скорость первого/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...skorosti(a, 'geroy', [a.answer, a.answer - num(a.params, 'd'), num(a.params, 'u')]),
      ...(a.answer > num(a.params, 'bound') ? [] : ['ответ не больше границы']),
    ],
  },
  'DP-13': {
    chisla: ['S', 'h'],
    vopros: (a) => /скорость перв/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const g = GEROI[String(a.params.geroy)];
      return [
        ...skorosti(a, 'geroy', [a.answer, a.answer + num(a.params, 'h')]),
        ...slovaVTekste(a, ['ktoRod']),
        ...(g?.voda === true && !/озер/.test(a.text) ? ['по воде без течения — нужно озеро'] : []),
      ];
    },
  },
  'DP-07': {
    chisla: ['S', 'd'],
    vopros: (a) => {
      const last = a.text.slice(a.text.lastIndexOf('Найдите'));
      return a.ask === 'AB' ? /из А в В/.test(last) : /из В в А/.test(last);
    },
    pravdopodobie: (a) => {
      const out: string[] = [];
      const g = GEROI[String(a.params.geroy)];
      if (g === undefined) return ['неизвестный герой'];
      const S = num(a.params, 'S');
      const d = num(a.params, 'd');
      const x = a.ask === 'AB' ? a.answer : a.answer - d;
      for (const v of [x, x + d]) {
        if (v < g.v[0] || v > g.v[1]) out.push(`скорость ${v} км/ч вне ${g.v.join('–')}`);
      }
      if (g.voda !== (a.params.form === 'barzha')) out.push('герой не совпадает с видом пути');
      if (g.voda && !/озер/.test(a.text)) out.push('по воде без течения — нужно озеро');
      const t = S / x;
      if (t > 24 || t < 1) out.push(`время в пути ${t} ч неправдоподобно`);
      const st = a.params.st === undefined ? d : num(a.params, 'st');
      if (!new RegExp(`(?<!\\d)${st} час`).test(a.text)) out.push(`в тексте нет остановки ${st} ч`);
      return out;
    },
  },
  /* ── Смеси ── */
  'SM-01': {
    chisla: ['V', 'p', 'W'],
    vopros: (a) => /процент/.test(poslednee(a.text)) || /Ответ дайте в процентах/.test(a.text),
    pravdopodobie: (a) => [
      ...vVeshchestve(a, [num(a.params, 'p'), a.answer]),
      ...((a.params.ed === 'kg' ? /\d кг/.test(a.text) : /литр/.test(a.text))
        ? []
        : ['единицы в тексте не совпадают с ed']),
      ...vne('раствор', num(a.params, 'V'), 1, 100),
      ...vne('вода', num(a.params, 'W'), 1, 100),
    ],
  },
  'SM-02': {
    chisla: ['p1', 'p2'],
    vopros: (a) => /процент/.test(poslednee(a.text)) || /Ответ дайте в процентах/.test(a.text),
    pravdopodobie: (a) => [
      ...vVeshchestve(a, [num(a.params, 'p1'), num(a.params, 'p2')]),
      ...(/таким же количеством|такое же количество|равн|столько же/.test(a.text)
        ? []
        : ['нет «равных количеств»']),
    ],
  },
  'SM-03': {
    chisla: ['p1', 'p2', 'm1', 'm2'],
    vopros: (a) => /процент/.test(poslednee(a.text)) || /Ответ дайте в процентах/.test(a.text),
    pravdopodobie: (a) => [
      ...vne('объём I, л', num(a.params, 'm1'), 1, 20),
      ...vne('объём II, л', num(a.params, 'm2'), 1, 20),
      ...(num(a.params, 'm1') === num(a.params, 'm2') ? ['равные объёмы — это СМ-02'] : []),
    ],
  },
  'SM-04': {
    chisla: ['p1', 'p2', 'd', 'p3'],
    vopros: (a) =>
      /массу (третьего|получившегося) сплава/.test(a.text) && a.ask === a.params.heavier,
    pravdopodobie: (a) => {
      const t = a.text.toLowerCase();
      const kto = a.params.heavier === '2' ? 'второ' : 'перв';
      const ok = new RegExp(`масса ${kto}[^.]*больше|${kto}[а-я]* сплав[^.]*тяжелее`).test(t);
      return [
        ...metallVTekste(a),
        ...(ok
          ? []
          : [`в тексте тяжелее не ${a.params.heavier === '2' ? 'второй' : 'первый'} сплав`]),
        ...vne('масса третьего, кг', a.answer, 5, 500),
      ];
    },
  },
  'SM-05': {
    chisla: ['p1', 'p2', 'M', 'p3'],
    vopros: (a) => /меньше массы второго/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...metallVTekste(a),
      ...vne('масса третьего, кг', num(a.params, 'M'), 5, 500),
    ],
  },
  'SM-06': {
    chisla: (a) => (a.params.form === 'pyure' ? ['m', 'w1', 'w2'] : ['R', 'w1', 'w2']),
    vopros: (a) =>
      a.ask === a.params.form &&
      (a.ask === 'pyure'
        ? /Сколько граммов воды/.test(poslednee(a.text))
        : /Сколько килограммов/.test(poslednee(a.text))),
    pravdopodobie: (a) => {
      const w1 = num(a.params, 'w1');
      const w2 = num(a.params, 'w2');
      if (a.params.form === 'pyure') {
        return [...vne('вода в сухом, %', w1, 1, 15), ...vne('вода в готовом, %', w2, 60, 95)];
      }
      const slova = [a.params.syroeRod, a.params.suhoeRod].map(String);
      return [
        ...vne('вода в свежем, %', w1, 70, 95),
        ...vne('вода в сушёном, %', w2, 5, 30),
        ...slova.filter((w) => !a.text.includes(w)).map((w) => `в тексте нет «${w}»`),
      ];
    },
  },
  'SM-08': {
    chisla: ['a', 'b', 'c', 'd'],
    vopros: (a) =>
      poslednee(a.text).includes(`${num(a.params, 'a')}-процентного`) &&
      /Сколько килограммов/.test(poslednee(a.text)),
    pravdopodobie: (a) =>
      vVeshchestve(
        a,
        ['a', 'b', 'c', 'd'].map((k) => num(a.params, k)),
      ),
  },
  'SM-07': {
    chisla: ['m1', 'm2', 'c', 'e'],
    vopros: (a) =>
      a.ask === 'pct' ? /Сколько процентов/.test(a.text) : /Сколько килограммов/.test(a.text),
    pravdopodobie: (a) => {
      const out: string[] = [];
      const v = VESHCHESTVA[String(a.params.vv)];
      if (v === undefined || TARY[String(a.params.tara)] === undefined) {
        return ['неизвестное вещество или ёмкость'];
      }
      const m1 = num(a.params, 'm1');
      const m2 = num(a.params, 'm2');
      const c = num(a.params, 'c');
      const e = num(a.params, 'e');
      const x = (c * (m1 + m2) - 2 * e * m2) / (m1 - m2);
      const y = 2 * e - x;
      for (const p of [x, y, c, e]) {
        if (p < v.p[0] || p > v.p[1]) out.push(`концентрация ${p}% вне ${v.p.join('–')}`);
      }
      for (const m of [m1, m2]) {
        if (m < 1 || m > 500) out.push(`масса ${m} кг вне 1–500`);
      }
      if (v.splav !== /сплав/.test(a.text)) out.push('сплав/раствор не совпадает с веществом');
      return out;
    },
  },
  /* ── Проценты ── */
  'PR-01': {
    chisla: ['p', 'N'],
    vopros: (a) => /заработн/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...vne('зарплата', a.answer, 15000, 300000),
      ...(/налог/.test(a.text) ? [] : ['нет налога']),
    ],
  },
  'PR-02': {
    chisla: ['a', 'b'],
    vopros: (a) =>
      a.ask === 'umen' ? /уменьшил/.test(poslednee(a.text)) : /увеличил/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...vne('подорожание, %', num(a.params, 'a'), 1, 99),
      ...vne('подешевление, %', num(a.params, 'b'), 1, 99),
    ],
  },
  'PR-03': {
    chisla: ['d'],
    vopros: (a) => /На сколько процентов подорожал/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...vne('изменение, %', a.answer, 1, 99),
      ...(/на то же самое число процентов/.test(a.text)
        ? []
        : ['нет «то же самое число процентов»']),
    ],
  },
  'PR-04': {
    chisla: ['p'],
    vopros: (a) =>
      /На сколько процентов/.test(poslednee(a.text)) && /дороже/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const n = num(a.params, 'n');
      const m = num(a.params, 'm');
      const t = a.text.toLowerCase();
      const odna = (100 - num(a.params, 'p')) / n;
      return [
        ...(new RegExp(`(^|\\s)${chislo(n)}\\s`).test(t) ? [] : [`в тексте нет «${chislo(n)}»`]),
        ...(new RegExp(`(^|\\s)${chislo(m)}\\s`).test(t) ? [] : [`в тексте нет «${chislo(m)}»`]),
        ...(nice(odna, 2) ? [] : [`одна вещь стоит ${odna}% — не «красиво»`]),
        ...vne('доля одной вещи, %', odna, 5, 40),
      ];
    },
  },
  'PR-05': {
    chisla: ['a', 'b'],
    vopros: (a) => /Сколько процентов/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const k = num(a.params, 'k');
      const z = (num(a.params, 'b') * k) / (k - 1);
      return [
        ...(a.text.includes(`уменьшилась ${VO_SKOLKO[k] ?? '?'}`)
          ? []
          : [`нет «уменьшилась ${VO_SKOLKO[k] ?? '?'}»`]),
        ...(/увеличилась вдвое/.test(a.text) ? [] : ['нет «увеличилась вдвое»']),
        ...vne('доля третьего, %', z, 3, 25),
        ...vne('доля второго, %', a.answer, 15, 60),
      ];
    },
  },
  'PR-06': {
    chisla: (a) => (a.params.form === 'vklad' ? ['S', 'diff'] : ['P0', 'P2']),
    vopros: (a) =>
      a.ask === a.params.form &&
      (a.ask === 'vklad'
        ? /процент годовых/.test(poslednee(a.text))
        : /На сколько процентов/.test(poslednee(a.text))),
    pravdopodobie: (a) =>
      a.params.form === 'vklad'
        ? [
            ...vne('процент годовых', a.answer, 1, 30),
            ...vne('вклад', num(a.params, 'S'), 1000, 1000000),
            ...(/клиент А\./.test(a.text) && /клиент Б\./.test(a.text)
              ? []
              : ['нет клиентов А. и Б.']),
          ]
        : [
            ...vne('снижение в год, %', a.answer, 1, 30),
            ...vne('цена', num(a.params, 'P0'), 5000, 2000000),
          ],
  },
  'PR-07': {
    chisla: ['p'],
    vopros: (a) =>
      a.ask === 'bolshe'
        ? /больше времени/.test(poslednee(a.text))
        : /меньше времени/.test(poslednee(a.text)),
    pravdopodobie: (a) =>
      a.ask === 'bolshe'
        ? vne('снижение скорости, %', num(a.params, 'p'), 1, 80)
        : vne('рост скорости, %', num(a.params, 'p'), 1, 400),
  },
  /* ── Протяжённые тела ── */
  'PT-01': {
    chisla: ['L1', 'L2', 'v'],
    vopros: (a) =>
      a.ask === a.params.form &&
      /минут/.test(poslednee(a.text)) &&
      (a.ask === 'tonnel') === /через/.test(a.text),
    pravdopodobie: (a) => [
      ...vne('длина поезда, м', num(a.params, 'L1'), 100, 1500),
      ...vne('скорость поезда, км/ч', num(a.params, 'v'), 40, 150),
      ...slovaVTekste(a, ['prep']),
    ],
  },
  'PT-02': {
    chisla: ['v1', 'v2', 'L', 't'],
    vopros: (a) => poslednee(a.text).includes(`длину ${String(a.params.poezdARod)}`),
    pravdopodobie: (a) => poezda(a, /навстречу/i),
  },
  'PT-03': {
    chisla: ['v1', 'v2', 'L', 't'],
    vopros: (a) => poslednee(a.text).includes(`длину ${String(a.params.poezdARod)}`),
    pravdopodobie: (a) => poezda(a, /в одном направлении/i),
  },
  'PT-04': {
    chisla: ['L1', 'L2', 'a', 'b', 't'],
    vopros: (a) => /километров в час/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...vne('длина I, м', num(a.params, 'L1'), 50, 400),
      ...vne('длина II, м', num(a.params, 'L2'), 50, 400),
      ...vne('разность скоростей, км/ч', a.answer, 1, 20),
      ...slovaVTekste(a, ['ktoRod']),
    ],
  },
  /* ── Разминка ── */
  'RZ-01': {
    chisla: ['c', 'M'],
    vopros: (a) => /сдач/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const g = num(a.params, 'g');
      const cost = (num(a.params, 'c') * g) / 1000;
      return [
        ...(a.text.includes(massa(g)) ? [] : [`в тексте нет массы «${massa(g)}»`]),
        ...vne('цена за кг', num(a.params, 'c'), 50, 1500),
        ...vne('масса, г', g, 100, 5000),
        ...(cost < num(a.params, 'M') ? [] : ['денег не хватает на покупку']),
      ];
    },
  },
  'RZ-02': {
    chisla: ['S', 't'],
    vopros: (a) => /скорост/.test(a.text) && /километрах в час/.test(a.text),
    pravdopodobie: (a) => {
      const g = GEROI[String(a.params.geroy)];
      if (g === undefined) return ['неизвестный герой'];
      return vne('скорость, км/ч', a.answer, g.v[0], g.v[1]);
    },
  },
  'RZ-03': {
    chisla: ['S'],
    vopros: (a) => /среднюю скорость/.test(a.text),
    pravdopodobie: (a) => {
      const g = GORODA[String(a.params.gorod)];
      if (g === undefined) return ['неизвестный город'];
      const out: string[] = [];
      for (const t of [num(a.params, 't0'), num(a.params, 't1')]) {
        if (!a.text.includes(` ${chasy(t / 60, false)} `))
          out.push(`в тексте нет времени ${chasy(t / 60, false)}`);
        if (t % 5 !== 0) out.push(`минуты ${t % 60} не кратны 5`);
      }
      if (!prostye(a.text).includes(sk(g.dh, SLOVA.chas).replace(/\s/g, ' ')))
        out.push(`в тексте нет разницы ${g.dh} ч`);
      if (!a.text.includes(g.iz)) out.push('в тексте нет города');
      return [
        ...out,
        ...vne('скорость самолёта', a.answer, 600, 950),
        ...vne('длина трассы', num(a.params, 'S'), g.km[0], g.km[1]),
      ];
    },
  },
  'RZ-04': {
    chisla: ['cap', 'a', 'b'],
    vopros: (a) => /наименьшее число/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...nacelo(a, num(a.params, 'a') + num(a.params, 'b'), num(a.params, 'cap')),
      ...vne('вместимость', num(a.params, 'cap'), 2, 60),
    ],
  },
  'RZ-05': {
    chisla: ['g', 'area'],
    vopros: (a) => /наименьшее число/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const can = num(a.params, 'can');
      return [
        ...(new RegExp(`(?<![\\d,])${vTekste(can / 1000).replace(',', '\\,')} кг`).test(
          prostye(a.text),
        )
          ? []
          : [`в тексте нет ёмкости ${vTekste(can / 1000)} кг`]),
        ...nacelo(a, num(a.params, 'g') * num(a.params, 'area'), can),
        ...vne('масса ёмкости, кг', can / 1000, 0.5, 50),
      ];
    },
  },
  'RZ-06': {
    chisla: ['dose', 'times', 'days', 'pack', 'tab'],
    vopros: (a) => /наименьшего количества/.test(poslednee(a.text)),
    pravdopodobie: (a) => {
      const perDose = num(a.params, 'dose') / num(a.params, 'tab');
      const tablets = perDose * num(a.params, 'times') * num(a.params, 'days');
      return [
        ...(Number.isInteger(Math.round(perDose * 1e9) / 1e9)
          ? []
          : ['доза — не целое число таблеток']),
        ...nacelo(a, Math.round(tablets), num(a.params, 'pack')),
        ...vne('приёмов в день', num(a.params, 'times'), 1, 4),
        ...vne('дней курса', num(a.params, 'days'), 3, 90),
      ];
    },
  },
  'RZ-07': {
    chisla: ['k', 'unit'],
    vopros: (a) => /округл/.test(a.text) && a.ask === a.params.form,
    pravdopodobie: (a) => {
      const k = num(a.params, 'k');
      const unit = num(a.params, 'unit');
      if (a.params.form === 'yahta') {
        const g = GEROI[String(a.params.geroy)];
        if (g === undefined || !g.voda) return ['нужен водный герой'];
        return [
          ...vne('скорость, км/ч', (k * unit) / 1000, g.v[0], g.v[1]),
          ...(/узл|узел/.test(a.text) ? [] : ['нет узлов']),
        ];
      }
      return [
        ...vne('масса, г', k * unit, 20, 2000),
        ...(/унци|фунт/.test(a.text) ? [] : ['нет унций или фунтов']),
      ];
    },
  },
  'RZ-08': {
    chisla: ['price', 'money'],
    vopros: (a) => /наибольш/.test(poslednee(a.text)) && a.ask === a.params.chetnost,
    pravdopodobie: (a) =>
      (a.params.chetnost === 'nechet') === /нечётн/.test(a.text) && /чётн/.test(a.text)
        ? []
        : ['чётность в тексте не совпадает с параметром'],
  },
  'RZ-09': {
    chisla: ['price', 'p', 'money'],
    vopros: (a) => /наибольшее число/.test(a.text),
    pravdopodobie: (a) => vne('повышение, %', num(a.params, 'p'), 1, 99),
  },
  'RZ-10': {
    chisla: ['p', 'N'],
    vopros: (a) => /до (снижения|скидки|уценки|распродажи)|первоначальн/.test(poslednee(a.text)),
    pravdopodobie: (a) => vne('скидка, %', num(a.params, 'p'), 1, 99),
  },
  'RZ-11': {
    chisla: ['p', 'N'],
    vopros: (a) => /заработн|зарплат|заработал/.test(poslednee(a.text)),
    pravdopodobie: (a) => vne('зарплата', a.answer, 15000, 300000),
  },
  'RZ-12': {
    chisla: ['N', 'p1', 'p2'],
    vopros: (a) => /^Сколько/.test(poslednee(a.text)),
    pravdopodobie: (a) => [
      ...vne('p1, %', num(a.params, 'p1'), 1, 99),
      ...vne('p2, %', num(a.params, 'p2'), 1, 99),
    ],
  },
  'RZ-13': {
    chisla: ['a', 'b'],
    vopros: (a) => {
      const q = poslednee(a.text);
      return a.ask === 'bolshe'
        ? /больше|дороже|выше|длиннее|тяжелее/.test(q)
        : /меньше|дешевле|ниже|короче|легче/.test(q);
    },
    pravdopodobie: (a) =>
      num(a.params, 'a') > num(a.params, 'b') ? [] : ['первое число не больше второго'],
  },
  'RZ-14': {
    chisla: ['p'],
    vopros: (a) => {
      const q = poslednee(a.text);
      return a.ask === 'bolshe' ? /больше|дороже/.test(q) : /меньше|дешевле/.test(q);
    },
    pravdopodobie: (a) =>
      a.ask === 'bolshe'
        ? vne('p, %', num(a.params, 'p'), 1, 99)
        : vne('p, %', num(a.params, 'p'), 1, 400),
  },
  'RZ-15': {
    chisla: ['p1', 'p2'],
    vopros: (a) => /На сколько процентов (увеличилась|выросла)/.test(poslednee(a.text)),
    pravdopodobie: (a) => vne('p2, %', num(a.params, 'p2'), 1, 99),
  },
  'RZ-16': {
    chisla: ['p1', 'p2'],
    vopros: (a) => /На сколько процентов/.test(poslednee(a.text)),
    pravdopodobie: () => [],
  },
  'RZ-17': {
    chisla: ['a', 'b'],
    vopros: (a) => /Что больше/.test(a.text),
    pravdopodobie: () => [],
  },
  'RZ-18': {
    chisla: ['br'],
    vopros: (a) => /в часах/.test(a.text),
    pravdopodobie: (a) => {
      const out: string[] = [];
      for (const t of [num(a.params, 't0'), num(a.params, 't1')]) {
        if (!a.text.includes(chasy(t / 60, false)))
          out.push(`в тексте нет времени ${chasy(t / 60, false)}`);
        if (t % 5 !== 0 || t >= 24 * 60) out.push(`время ${t} мин не по расписанию`);
      }
      return [...out, ...vne('длительность, ч', a.answer, 0.25, 4)];
    },
  },
};

/** Поезда ПТ-02/03: длины и скорости в пределах, поезда названы, направление в тексте. */
function poezda(a: Analog, napravlenie: RegExp): string[] {
  return [
    ...vne('длина поезда, м', a.answer, 100, 1500),
    ...vne('длина второго поезда, м', num(a.params, 'L'), 100, 1500),
    ...['v1', 'v2'].flatMap((k) => vne('скорость поезда, км/ч', num(a.params, k), 40, 150)),
    ...slovaVTekste(a, ['poezdARod', 'poezdBRod']),
    ...(napravlenie.test(a.text) ? [] : ['направление движения не то']),
  ];
}

/** «Половину пути / маршрута / дистанции» — вариант ДП-04 про путь. */
const POLOVINA_PUTI = /половин[уа] (пути|маршрута|дистанции)/i;

/** Скорости — в пределах героя (params[key]): лыжник 8–20 км/ч и т. п. */
function skorosti(a: Analog, key: string, vv: number[]): string[] {
  const g = GEROI[String(a.params[key])];
  if (g === undefined) return [`неизвестный герой ${key}`];
  return vv.flatMap((v) => vne(`скорость, км/ч (${key})`, v, g.v[0], g.v[1]));
}

/** Слова сюжета из параметров стоят в тексте (по первым буквам — падеж не важен). */
function slovaVTekste(a: Analog, keys: string[]): string[] {
  const t = a.text.toLowerCase();
  return keys.flatMap((k) => {
    const w =
      String(a.params[k] ?? '')
        .toLowerCase()
        .split(' ')
        .at(-1) ?? '';
    return w !== '' && t.includes(w.slice(0, Math.max(3, w.length - 2)))
      ? []
      : [`в тексте нет «${w}»`];
  });
}

/** Время в минутах так, как его пишет условие: «1 час 30 минут». */
function vremyaVTekste(a: Analog, minuty: number): string[] {
  const v = prostye(vremya(minuty, true));
  /* «2 часа», но не «2 часа 10 минут» и не «12 часов». */
  return new RegExp(`(?<!\\d)${v}(?!\\s\\d)`).test(prostye(a.text))
    ? []
    : [`в тексте нет времени «${v}»`];
}

/** Концентрации — в пределах вещества (соль не крепче 26 %), вещество названо в тексте. */
function vVeshchestve(a: Analog, pp: number[]): string[] {
  const v = VESHCHESTVA[String(a.params.vv)];
  if (v === undefined) return ['неизвестное вещество'];
  const koren = v.rod.slice(0, 4);
  return [
    ...pp.flatMap((x) => vne('концентрация, %', x, v.p[0], v.p[1])),
    ...(a.text.includes(koren) ? [] : [`в тексте нет вещества «${v.rod}»`]),
  ];
}

/** Металл сплава назван в тексте. */
function metallVTekste(a: Analog): string[] {
  const m = METALL[String(a.params.metal ?? 'med')];
  return m !== undefined && a.text.includes(m) ? [] : ['металл в тексте не совпадает с metal'];
}

/** Склонения часов и минут в тексте: «1 час», «2 часа», «5 часов». */
function sklonenia(text: string): string[] {
  const out: string[] = [];
  for (const forms of [
    SLOVA.chas,
    SLOVA.minuta,
    SLOVA.minutu,
    SLOVA.sekundu,
    SLOVA.detal,
    SLOVA.litr,
  ]) {
    const re = new RegExp(`(\\d+) (${forms.join('|')})(?![а-яё])`, 'g');
    for (const m of text.matchAll(re)) {
      const n = Number(m[1]);
      /* sk ставит неразрывный пробел — сравниваем по словам. */
      const ok = [sk(n, forms), sk(n, SLOVA.minuta), sk(n, SLOVA.minutu)].map((x) =>
        x.replace(/\s/g, ' '),
      );
      if (!ok.includes(`${m[1]} ${m[2]}`)) out.push(`«${m[0]}» вместо «${sk(n, forms)}»`);
    }
  }
  return out;
}

export function checkAnalogi(typeset: (tex: string) => string) {
  const problems: Problem[] = [];
  /* Банк сравниваем без слов сюжета (металл в СМ-04 — тоже сюжет). */
  const pohozha = pohozhaNa([...BANK, ...RAZMINKA].map((b) => ({ ...b, params: model(b.params) })));
  let checked = 0;
  /* Слово сюжета не может совпадать с числовым параметром модели банка. */
  for (const b of [...BANK, ...RAZMINKA]) {
    for (const [k, v] of Object.entries(b.params)) {
      if (typeof v === 'number' && SYUZHET.has(k)) {
        problems.push({ where: b.id, what: `ключ сюжета «${k}» — числовой параметр модели` });
      }
    }
  }
  for (const [proto, list] of Object.entries(POOL_ANALOGOV)) {
    const add = (where: string, what: string) => problems.push({ where, what });
    const st = subtype(proto);
    const pravilo = PRAVILA[proto];
    if (pravilo === undefined) add(proto, 'нет правил проверки для прототипа');
    if (list.length !== 10) add(proto, `аналогов ${list.length}, а нужно 10`);
    const kod = kodNaSayte(proto);
    const klyuchi = new Set<string>();
    const teksty = new Set<string>();
    list.forEach((a, i) => {
      const where = a.id;
      checked += 1;
      const want = `${kod}-a${String(i + 1).padStart(2, '0')}`;
      if (a.id !== want) add(where, `номер аналога должен быть ${want}`);
      if (a.prototypeId !== proto || a.source !== 'analog') add(where, 'prototypeId или source');
      if (a.level !== st.level) add(where, `уровень ${a.level}, у прототипа ${st.level}`);
      if (a.plotTag.trim() === '') add(where, 'нет метки сюжета');
      if (String(a.params.ask ?? a.ask) !== a.ask) add(where, 'ask не совпадает с params.ask');
      let s;
      try {
        s = st.solve(a.params);
      } catch (e) {
        add(where, `solve упал: ${(e as Error).message}`);
        return;
      }
      if (Math.abs(s.answer - a.answer) > 1e-9)
        add(where, `solve ${s.answer} ≠ answer ${a.answer}`);
      if (!(a.answer > 0) || !nice(a.answer, 2)) add(where, `ответ ${a.answer} не «красивый»`);
      /* Решение — те же проверки методики, что у банка; условие — текст аналога. */
      const solved = { ...s, uslovie: a.text };
      problems.push(
        ...checkSolved(where, solved, typeset),
        ...checkMetodika(where, proto, solved),
        ...checkDrobnye(where, solved),
        ...checkOboznacheniya(where, solved),
      );
      const m = model(a.params);
      const key = paramsKey(proto, m);
      if (klyuchi.has(key)) add(where, 'параметры повторяют другой аналог');
      klyuchi.add(key);
      if (pohozha(proto, m)) add(where, 'параметры совпадают с банком или отличаются одним числом');
      if (teksty.has(a.text)) add(where, 'текст повторяет другой аналог');
      teksty.add(a.text);
      if (pravilo !== undefined) {
        const chisla = typeof pravilo.chisla === 'function' ? pravilo.chisla(a) : pravilo.chisla;
        for (const k of chisla) {
          const n = vTekste(num(m, k));
          if (!new RegExp(`(?<![\\d,])${n.replace(',', '\\,')}(?![\\d,])`).test(prostye(a.text))) {
            add(where, `в тексте нет числа ${k} = ${n}`);
          }
        }
        if (!pravilo.vopros(a)) add(where, `вопрос текста не совпадает с ask = ${a.ask}`);
        for (const w of pravilo.pravdopodobie(a)) add(where, w);
      }
      for (const w of sklonenia(a.text)) add(where, `склонение: ${w}`);
    });
    /* Варианты вопроса — почти поровну. */
    const po = new Map<string, number>();
    for (const a of list) po.set(a.ask, (po.get(a.ask) ?? 0) + 1);
    const vsegoVariantov = new Set([
      ...list.map((a) => a.ask),
      ...[...BANK, ...RAZMINKA]
        .filter((b) => b.id === proto)
        .map((b) => String(b.params.ask ?? '')),
    ]);
    vsegoVariantov.delete('');
    if (vsegoVariantov.size > 1) {
      const counts = [...vsegoVariantov].map((v) => po.get(v) ?? 0);
      if (Math.max(...counts) - Math.min(...counts) > 2) {
        add(
          proto,
          `варианты вопроса распределены неровно: ${[...po].map(([k, n]) => `${k} ${n}`).join(', ')}`,
        );
      }
    }
  }
  return { problems, checked };
}
