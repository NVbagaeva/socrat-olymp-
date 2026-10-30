/**
 * Группа III. Математическое ожидание.
 *
 *   6.4  лотерея: всего N билетов, таблица «выигрыш — число выигрышных
 *        билетов» → M(выигрыша на один билет); проигрышные билеты —
 *        N минус выигрышные, их выигрыш 0;
 *   6.5  беспроигрышная лотерея, цена билета → на сколько цена выше M;
 *   6.6  распределение таблицей → M(X);
 *   6.7  распределение записью X ∼ (…) → M(X);
 *   6.8  частоты «из 100 покупателей…» → M(количества в одной покупке);
 *   6.9  страхование: выплата, её вероятность и M(дохода) → цена полиса.
 */

import {
  arr,
  etapy,
  iSpisok,
  num,
  NBSP,
  otvetLine,
  plus,
  q,
  schitaem,
  skl,
  str,
  strOpt,
  sub,
  sumQ,
  t,
  tablica,
  tq,
  tx,
  umn,
  vopros,
  mul,
  add,
  lovushki,
  type Q,
} from '../kit';
import {
  formulaE,
  ozhidanie,
  pTex,
  raspr,
  slagaemoeXP,
  strokaProverki,
  summyRaspr,
  tablicaRaspr,
  tablicaReshenia,
  zapisTex,
} from '../raspredelenie';
import type { Params, Prototype, Ris, Solved, Tablica, Tema } from '../types';
import { velichina } from '../velichiny';

/* ════════════════════ 6.4 и 6.5: лотереи ════════════════════ */

export interface SyuzhetLotterei {
  key: string;
  tema: Tema;
  plot: string;
  /** Текст до таблицы. N — сколько выпущено. */
  text(N: number, cena?: number): string;
  zagW: string;
  zagC: string;
  posle: string;
  /** Правдоподобные N и выигрыши. */
  Ns: number[];
  ws: number[];
}

export const SYUZHETY_P04: SyuzhetLotterei[] = [
  {
    key: 'keisy',
    tema: 'igry',
    plot: 'подарочные кейсы с монетами',
    text: (N) =>
      `Разработчики игры выпустили ${tx(N)} подарочных кейсов. Внутриигровые монеты в кейсах распределены так:`,
    zagW: 'Монеты в кейсе',
    zagC: 'Число кейсов',
    posle:
      'В остальных кейсах монет нет. Игрок получает один случайный кейс. Найдите математическое ожидание случайной величины «число монет в кейсе».',
    Ns: [2000, 5000, 8000, 10000, 20000],
    ws: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000],
  },
  {
    key: 'skretch',
    tema: 'sport',
    plot: 'скретч-карты на матче',
    text: (N) =>
      `На матче футбольный клуб раздал зрителям ${tx(N)} скретч-карт с призами. Выигрыши распределены так:`,
    zagW: 'Выигрыш (руб.)',
    zagC: 'Число карт',
    posle: 'Найдите математическое ожидание выигрыша на одну скретч-карту. Ответ дайте в рублях.',
    Ns: [5000, 10000, 20000, 25000, 40000],
    ws: [100, 200, 500, 1000, 2000, 5000, 10000],
  },
  {
    key: 'promokody',
    tema: 'dostavka',
    plot: 'промокоды доставки',
    text: (N) =>
      `Сервис доставки разослал ${tx(N)} промокодов. Скидки по промокодам распределены так:`,
    zagW: 'Скидка (руб.)',
    zagC: 'Число промокодов',
    posle:
      'Остальные промокоды скидки не дают. Найдите математическое ожидание скидки по одному случайному промокоду. Ответ дайте в рублях.',
    Ns: [10000, 20000, 50000, 100000],
    ws: [50, 100, 150, 200, 300, 500, 1000],
  },
  {
    key: 'zonty',
    tema: 'pogoda',
    plot: 'купоны магазина зонтов',
    text: (N) =>
      `В сезон дождей магазин зонтов раздал покупателям ${tx(N)} лотерейных купонов. Выигрыши распределены так:`,
    zagW: 'Выигрыш (руб.)',
    zagC: 'Число купонов',
    posle: 'Найдите математическое ожидание выигрыша на один купон. Ответ дайте в рублях.',
    Ns: [1000, 2000, 4000, 5000, 8000],
    ws: [50, 100, 200, 300, 500, 1000, 2000],
  },
  {
    key: 'rozygrysh',
    tema: 'socseti',
    plot: 'розыгрыш у блогера',
    text: (N) =>
      `Блогер устроил розыгрыш среди ${tx(N)} подписчиков, оставивших комментарий. Призы распределены так:`,
    zagW: 'Приз (руб.)',
    zagC: 'Число победителей',
    posle:
      'Найдите математическое ожидание выигрыша одного участника розыгрыша. Ответ дайте в рублях.',
    Ns: [2000, 4000, 5000, 8000, 10000],
    ws: [100, 200, 500, 1000, 3000, 5000, 10000],
  },
  {
    key: 'sertifikaty',
    tema: 'ekzameny',
    plot: 'сертификаты онлайн-школы',
    text: (N) =>
      `Онлайн-школа разыграла среди ${tx(N)} участников пробного экзамена сертификаты на занятия:`,
    zagW: 'Номинал (руб.)',
    zagC: 'Число сертификатов',
    posle:
      'Участник без сертификата получает 0 рублей. Найдите математическое ожидание номинала сертификата, который достанется одному случайному участнику. Ответ дайте в рублях.',
    Ns: [1000, 2000, 5000, 8000, 10000],
    ws: [200, 500, 1000, 2000, 3000, 5000],
  },
  {
    key: 'chek-qr',
    tema: 'magaziny',
    plot: 'кэшбэк по QR-коду',
    text: (N) =>
      `Магазин напечатал ${tx(N)} чеков с QR-кодом, по которому начисляется кэшбэк. Кэшбэк распределён так:`,
    zagW: 'Кэшбэк (руб.)',
    zagC: 'Число чеков',
    posle:
      'По остальным чекам кэшбэк не начисляется. Найдите математическое ожидание кэшбэка по одному случайному чеку. Ответ дайте в рублях.',
    Ns: [10000, 20000, 40000, 50000],
    ws: [20, 50, 100, 200, 500, 1000, 5000],
  },
  {
    key: 'karty',
    tema: 'transport',
    plot: 'бонусы на транспортной карте',
    text: (N) =>
      `Транспортная компания выпустила ${tx(N)} новых карт, часть из них — с бонусом на поездки:`,
    zagW: 'Бонус (руб.)',
    zagC: 'Число карт',
    posle: 'Найдите математическое ожидание бонуса на одной случайной карте. Ответ дайте в рублях.',
    Ns: [10000, 20000, 25000, 50000],
    ws: [50, 100, 200, 300, 500, 1000],
  },
  {
    key: 'yarmarka',
    tema: 'shkola',
    plot: 'лотерея школьной ярмарки',
    text: (N) =>
      `На школьной ярмарке продали ${tx(N)} лотерейных билетов. Выигрыши распределены так:`,
    zagW: 'Выигрыш (руб.)',
    zagC: 'Число выигрышных билетов',
    posle: 'Найдите математическое ожидание выигрыша на один билет. Ответ дайте в рублях.',
    Ns: [400, 500, 800, 1000],
    ws: [20, 50, 100, 200, 300, 500],
  },
  {
    key: 'popkorn',
    tema: 'kofeynya',
    plot: 'бонусы на попкорн',
    text: (N) => `Кинотеатр раздал зрителям ${tx(N)} скретч-карт с бонусами на попкорн и напитки:`,
    zagW: 'Бонус (руб.)',
    zagC: 'Число карт',
    posle:
      'На остальных картах бонуса нет. Найдите математическое ожидание бонуса на одной карте. Ответ дайте в рублях.',
    Ns: [2000, 4000, 5000, 10000],
    ws: [50, 100, 150, 200, 300, 500],
  },
];

export const SYUZHETY_P05: SyuzhetLotterei[] = [
  {
    key: 'sunduk',
    tema: 'igry',
    plot: 'сундуки с подарочными кодами',
    text: (N, c) =>
      `В интернет-магазине игр продают сундуки по ${tx(c ?? 0)} рублей. В каждом сундуке — подарочный код на покупку в игре. Всего выпущено ${tx(N)} сундуков, номиналы кодов показаны в таблице:`,
    zagW: 'Номинал кода (руб.)',
    zagC: 'Число сундуков',
    posle:
      'Игрок покупает один случайный сундук. На сколько рублей цена сундука выше математического ожидания номинала кода?',
    Ns: [500, 800, 1000, 2000],
    ws: [20, 30, 50, 70, 100, 300, 500, 1000, 3000],
  },
  {
    key: 'paket',
    tema: 'sport',
    plot: 'пакеты болельщика',
    text: (N, c) =>
      `Фан-шоп клуба продаёт «пакеты болельщика» по ${tx(c ?? 0)} рублей: в каждом — сертификат на покупку в магазине клуба. Всего подготовлено ${tx(N)} пакетов:`,
    zagW: 'Сертификат (руб.)',
    zagC: 'Число пакетов',
    posle:
      'Болельщик покупает один случайный пакет. На сколько рублей цена пакета выше математического ожидания номинала сертификата?',
    Ns: [400, 500, 1000, 2000],
    ws: [100, 150, 200, 300, 500, 1000, 3000, 5000],
  },
  {
    key: 'korobka',
    tema: 'dostavka',
    plot: 'коробки-сюрпризы доставки',
    text: (N, c) =>
      `Сервис доставки продаёт коробки-сюрпризы по ${tx(c ?? 0)} рублей: в каждой — промокод на заказ. Всего ${tx(N)} коробок, промокоды распределены так:`,
    zagW: 'Промокод (руб.)',
    zagC: 'Число коробок',
    posle:
      'Покупатель берёт одну случайную коробку. На сколько рублей цена коробки выше математического ожидания суммы промокода?',
    Ns: [500, 1000, 2000, 2500],
    ws: [100, 200, 300, 500, 1000, 2000, 5000],
  },
  {
    key: 'dozhd',
    tema: 'pogoda',
    plot: 'лотерея магазина зонтов',
    text: (N, c) =>
      `В сезон дождей магазин зонтов продаёт билеты беспроигрышной лотереи по ${tx(c ?? 0)} рублей: каждый билет — скидка на покупку. Выпущено ${tx(N)} билетов:`,
    zagW: 'Скидка (руб.)',
    zagC: 'Количество билетов',
    posle:
      'Покупатель берёт один случайный билет. На сколько рублей цена билета выше математического ожидания скидки?',
    Ns: [400, 500, 800, 1000],
    ws: [20, 30, 50, 100, 200, 500, 1000],
  },
  {
    key: 'merch',
    tema: 'socseti',
    plot: 'мерч блогера',
    text: (N, c) =>
      `Блогер продаёт коробки с мерчем по ${tx(c ?? 0)} рублей; содержимое у коробок разное. Всего ${tx(N)} коробок, стоимость содержимого показана в таблице:`,
    zagW: 'Стоимость содержимого (руб.)',
    zagC: 'Число коробок',
    posle:
      'Подписчик покупает одну случайную коробку. На сколько рублей цена коробки выше математического ожидания стоимости её содержимого?',
    Ns: [200, 500, 1000],
    ws: [300, 400, 500, 800, 1000, 2000, 5000],
  },
  {
    key: 'bilet-udachi',
    tema: 'ekzameny',
    plot: '«билеты удачи» онлайн-школы',
    text: (N, c) =>
      `Онлайн-школа продаёт «билеты удачи» по ${tx(c ?? 0)} рублей: в каждом — сертификат на занятия. Выпущено ${tx(N)} билетов:`,
    zagW: 'Сертификат (руб.)',
    zagC: 'Количество билетов',
    posle:
      'Ученик покупает один случайный билет. На сколько рублей цена билета выше математического ожидания номинала сертификата?',
    Ns: [500, 800, 1000, 2000],
    ws: [50, 100, 150, 200, 500, 1000, 2000],
  },
  {
    key: 'syurpriz',
    tema: 'magaziny',
    plot: 'пакеты-сюрпризы',
    text: (N, c) =>
      `Магазин продаёт пакеты-сюрпризы по ${tx(c ?? 0)} рублей. Всего ${tx(N)} пакетов, стоимость товаров в пакете показана в таблице:`,
    zagW: 'Стоимость товаров (руб.)',
    zagC: 'Число пакетов',
    posle:
      'Покупатель берёт один случайный пакет. На сколько рублей цена пакета выше математического ожидания стоимости товаров в нём?',
    Ns: [400, 500, 1000, 2000],
    ws: [200, 300, 400, 500, 1000, 2000, 3000],
  },
  {
    key: 'minuty',
    tema: 'transport',
    plot: 'бонус-паки каршеринга',
    text: (N, c) =>
      `Каршеринг продаёт бонус-паки по ${tx(c ?? 0)} рублей: в каждом — бонусные минуты на некоторую сумму. Выпущено ${tx(N)} паков:`,
    zagW: 'Бонус (руб.)',
    zagC: 'Число паков',
    posle:
      'Водитель покупает один случайный пак. На сколько рублей цена пака выше математического ожидания бонуса?',
    Ns: [500, 1000, 2000, 4000],
    ws: [100, 150, 200, 300, 500, 1000, 3000],
  },
  {
    key: 'yarmarka',
    tema: 'shkola',
    plot: 'беспроигрышная лотерея на ярмарке',
    text: (N, c) =>
      `На школьной ярмарке продают билеты беспроигрышной лотереи по ${tx(c ?? 0)} рублей. Выпущено ${tx(N)} билетов:`,
    zagW: 'Выигрыш (руб.)',
    zagC: 'Количество билетов',
    posle:
      'Ученик покупает один случайный билет. На сколько рублей цена билета выше математического ожидания выигрыша?',
    Ns: [200, 250, 400, 500],
    ws: [5, 10, 20, 30, 50, 100, 200],
  },
  {
    key: 'kofe',
    tema: 'kofeynya',
    plot: 'кофейная лотерея',
    text: (N, c) =>
      `Кофейня продаёт билеты «кофейной лотереи» по ${tx(c ?? 0)} рублей: каждый билет — купон на напиток или десерт. Выпущено ${tx(N)} билетов:`,
    zagW: 'Купон (руб.)',
    zagC: 'Количество билетов',
    posle:
      'Посетитель покупает один случайный билет. На сколько рублей цена билета выше математического ожидания суммы купона?',
    Ns: [200, 400, 500, 1000],
    ws: [50, 80, 100, 150, 200, 300, 500],
  },
];

const LOTEREI = new Map([...SYUZHETY_P04, ...SYUZHETY_P05].map((s) => [`${s.key}`, s]));

export function syuzhetLotterei(key: string): SyuzhetLotterei {
  const s = LOTEREI.get(key);
  if (s === undefined) {
    throw new Error(`нет сюжета лотереи ${key}`);
  }
  return s;
}

/** Выигрыш в таблице вида «Б» (исходная задача 9): «100 р.», «10 тыс. р.». */
function vyigryshB(w: number): string {
  return w >= 10000 && w % 1000 === 0 ? `${tx(w / 1000)}${NBSP}тыс.${NBSP}р.` : `${tx(w)}${NBSP}р.`;
}

const ZAG_W: Record<string, string> = {
  A: 'Выигрыш (руб.)',
  B: 'Выигрыш',
  C: 'Выигрыш (в рублях)',
};

function tablicaLotterei(p: Params, bezproigr: boolean): Tablica {
  const w = arr(p, 'w');
  const c = arr(p, 'c');
  const sj = strOpt(p, 'sj');
  if (sj !== undefined) {
    const s = syuzhetLotterei(sj);
    return tablica([
      { zag: s.zagW, yach: w.map(tx) },
      { zag: s.zagC, yach: c.map(tx) },
    ]);
  }
  const tab = str(p, 'tab', ['A', 'B', 'C'] as const);
  return tablica([
    { zag: ZAG_W[tab] as string, yach: w.map((x) => (tab === 'B' ? vyigryshB(x) : tx(x))) },
    {
      zag: bezproigr ? 'Количество билетов' : 'Число выигрышных билетов',
      yach: c.map(tx),
    },
  ]);
}

/** Сумма выигрышей по таблице: Σ w·c — целое. */
function summaVyigryshey(w: readonly number[], c: readonly number[]): number {
  return w.reduce((s, x, i) => s + x * (c[i] as number), 0);
}

function slagaemyeWC(w: readonly number[], c: readonly number[]): string[] {
  return w.map((x, i) => umn(t(x), t(c[i] as number)));
}

/** Что лотерея называет «билетом» — для слов разбора. */
function edinicyLotterei(p: Params): {
  bilet: string;
  bileta: string;
  biletov: string;
  vinit: string;
  v: string;
  rub: boolean;
} {
  const sj = strOpt(p, 'sj');
  const zag = sj === undefined ? 'билет' : syuzhetLotterei(sj).zagC;
  const vybor: Array<[RegExp, [string, string, string, string]]> = [
    [/кейс/, ['кейс', 'кейса', 'кейсов', 'кейсы']],
    [/карт/, ['карта', 'карты', 'карт', 'карты']],
    [/промокод/, ['промокод', 'промокода', 'промокодов', 'промокоды']],
    [/купон/, ['купон', 'купона', 'купонов', 'купоны']],
    [/победител/, ['участник', 'участника', 'участников', 'участников']],
    [/сертификат/, ['участник', 'участника', 'участников', 'участников']],
    [/чек/, ['чек', 'чека', 'чеков', 'чеки']],
    [/сундук/, ['сундук', 'сундука', 'сундуков', 'сундуки']],
    [/пакет/, ['пакет', 'пакета', 'пакетов', 'пакеты']],
    [/коробк/, ['коробка', 'коробки', 'коробок', 'коробки']],
    [/пак/, ['пак', 'пака', 'паков', 'паки']],
  ];
  const [bilet, bileta, biletov, vinit] = vybor.find(([re]) => re.test(zag))?.[1] ?? [
    'билет',
    'билета',
    'билетов',
    'билеты',
  ];
  const rub = sj === undefined || !/Монет/.test(syuzhetLotterei(sj).zagW);
  return { bilet, bileta, biletov, vinit, v: rub ? 'выигрыш' : 'число монет', rub };
}

/** «68,5 рубля», «55 рублей», «12 монет». */
function edinicaOtveta(x: number, rub: boolean): string {
  if (!Number.isInteger(x)) {
    return rub ? 'рубля' : 'монеты';
  }
  return rub ? skl(x, 'рубль', 'рубля', 'рублей') : skl(x, 'монета', 'монеты', 'монет');
}

/* ── 6.4 ──────────────────────────────────────────────────────────── */

const P04: Prototype = {
  id: 'P04',
  no: 4,
  group: 'III',
  title: 'Лотерея: выигрыш на один билет',
  formula: '$\\mathrm{M}=\\dfrac{\\sum x_i\\cdot n_i}{N}$, проигрышные билеты — с выигрышем $0$',
  skills: ['chastoty', 'stroka-xp'],
  istochnik: 'Математическое ожидание, №1, 4, 9',
  ris: (p) => ({ vid: 'tablica', tablica: tablicaLotterei(p, false) }),
  uslovie(p) {
    const N = num(p, 'N');
    const sj = strOpt(p, 'sj');
    const ris: Ris = { vid: 'tablica', tablica: tablicaLotterei(p, false) };
    if (sj !== undefined) {
      const s = syuzhetLotterei(sj);
      return { text: s.text(N), ris, posle: s.posle };
    }
    const forma = str(p, 'forma', ['org', 'vsego'] as const);
    if (forma === 'vsego') {
      return {
        text: `Всего выпущено ${tx(N)} лотерейных билетов. Сумма выигрышей и число выигрышных билетов показаны в таблице.`,
        ris,
        posle:
          'Найдите математическое ожидание случайной величины «выигрыш на один билет», который получит один случайный покупатель лотерейного билета. Ответ дайте в рублях.',
      };
    }
    return {
      text: `Организаторы лотереи выпустили ${tx(N)} билетов. Выигрыши распределены следующим образом${str(p, 'tab', ['A', 'B', 'C'] as const) === 'C' ? '.' : ':'}`,
      ris,
      posle:
        'Найдите математическое ожидание величины «выигрыш на один билет». Ответ дайте в рублях.',
    };
  },
  solve(p) {
    const N = num(p, 'N');
    const w = arr(p, 'w');
    const c = arr(p, 'c');
    const ed = edinicyLotterei(p);
    const vyigr = c.reduce((s, x) => s + x, 0);
    const pusto = N - vyigr;
    const S = summaVyigryshey(w, c);
    const E = q(S, N);
    const answer = E.n / E.m;
    const tab = tablicaLotterei(p, false);
    const sDobavkoy: Tablica = {
      stroki: tab.stroki.map((s, i) => ({ ...s, yach: [i === 0 ? '0' : tx(pusto), ...s.yach] })),
      vydelit: [0],
    };
    const lovushka = q(S, vyigr);
    const srednee = q(
      w.reduce((s, x) => s + x, 0),
      w.length,
    );
    return {
      answer,
      etapy: etapy(
        {
          t: `Добавляем ${ed.vinit} без выигрыша`,
          lines: [
            `С выигрышем: $${plus(c.map((x) => t(x)))}=${t(vyigr)}$ ${skl(vyigr, ed.bilet, ed.bileta, ed.biletov)}. Остальные $${t(N)}-${t(vyigr)}=${t(pusto)}$ ничего не дают: для них ${ed.v} равен $0$. Это тоже значение случайной величины — дописываем его в таблицу.`,
          ],
          tablica: sDobavkoy,
        },
        {
          t: 'Переходим к вероятностям',
          lines: [
            `Каждый ${ed.bilet} — один из $${t(N)}$ равновозможных, поэтому вероятность значения — доля таких ${ed.biletov}: $p_i=\\dfrac{n_i}{${t(N)}}$. Например, вероятность получить $0$ равна $\\dfrac{${t(pusto)}}{${t(N)}}$.`,
          ],
        },
        {
          t: 'Считаем математическое ожидание',
          lines: [
            `$\\mathrm{M}=\\sum x_ip_i=\\dfrac{${umn('0', t(pusto))}+${plus(slagaemyeWC(w, c))}}{${t(N)}}=\\dfrac{${t(S)}}{${t(N)}}=${tq(E)}$.`,
            `В среднем на один ${ed.bilet} приходится $${tq(E)}$ ${edinicaOtveta(answer, ed.rub)} — это и есть «${ed.v} на один ${ed.bilet}».`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: schitaem(S, N, '\\mathrm{M}'),
      hints: [
        vopros(
          `Сколько ${ed.biletov} ничего не выигрывают?`,
          `$${t(pusto)}$`,
          [`$${t(vyigr)}$`, `$${t(N)}$`, '$0$'],
          `Из всех ${ed.biletov} вычитаем выигрышные: $${t(N)}-${t(vyigr)}=${t(pusto)}$.`,
        ),
        vopros(
          'На что делим общую сумму выигрышей?',
          `на число всех ${ed.biletov}, $${t(N)}$`,
          [`на число выигрышных, $${t(vyigr)}$`, `на число столбцов таблицы, $${w.length}$`],
          'Вероятность — доля среди всех, в том числе проигрышных.',
        ),
        vopros('Чему равно математическое ожидание?', `$${tq(E)}$`, [
          `$${tq(lovushka)}$`,
          `$${tq(srednee)}$`,
          `$${t(S)}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    const N = num(p, 'N');
    const w = arr(p, 'w');
    const c = arr(p, 'c');
    let s = 0;
    w.forEach((x, i) => {
      s += x * ((c[i] as number) / N);
    });
    return Math.round(s * 1e9) / 1e9;
  },
  summy(p) {
    const N = num(p, 'N');
    const c = arr(p, 'c');
    return [
      {
        chto: 'билетов без выигрыша не меньше нуля',
        doli: [N - c.reduce((s, x) => s + x, 0)],
        nado: null,
      },
    ];
  },
};

/* ── 6.5 ──────────────────────────────────────────────────────────── */

const P05: Prototype = {
  id: 'P05',
  no: 5,
  group: 'III',
  title: 'Беспроигрышная лотерея: цена и ожидание выигрыша',
  formula: '$\\text{цена}-\\mathrm{M}$, где $\\mathrm{M}=\\dfrac{\\sum x_i\\cdot n_i}{N}$',
  skills: ['chastoty', 'stroka-xp'],
  istochnik: 'Математическое ожидание, №2, 5',
  ris: (p) => ({ vid: 'tablica', tablica: tablicaLotterei(p, true) }),
  uslovie(p) {
    const N = num(p, 'N');
    const cena = num(p, 'cena');
    const sj = strOpt(p, 'sj');
    const ris: Ris = { vid: 'tablica', tablica: tablicaLotterei(p, true) };
    if (sj !== undefined) {
      const s = syuzhetLotterei(sj);
      return { text: s.text(N, cena), ris, posle: s.posle };
    }
    return {
      text: `В таблице показано количество билетов и возможные выигрыши беспроигрышной денежной лотереи. Цена билета равна ${tx(cena)} ${skl(cena, 'рубль', 'рубля', 'рублей')}. Всего выпущено ${tx(N)} билетов. Участник покупает один случайный билет. На сколько рублей цена билета выше математического ожидания выигрыша?`,
      ris,
    };
  },
  solve(p) {
    const N = num(p, 'N');
    const cena = num(p, 'cena');
    const w = arr(p, 'w');
    const c = arr(p, 'c');
    const ed = edinicyLotterei(p);
    const S = summaVyigryshey(w, c);
    const E = q(S, N);
    const otv = sub(q(cena), E);
    const answer = otv.n / otv.m;
    const srednee = q(
      w.reduce((s, x) => s + x, 0),
      w.length,
    );
    return {
      answer,
      etapy: etapy(
        {
          t: 'Проверяем, что лотерея беспроигрышная',
          lines: [
            `$${plus(c.map((x) => t(x)))}=${t(N)}$ — выигрыш есть у каждого ${ed.bileta}, столбца «$0$ рублей» нет.`,
          ],
        },
        {
          t: 'Считаем математическое ожидание выигрыша',
          lines: [
            `Вероятность выигрыша — доля таких ${ed.biletov} среди всех $${t(N)}$: $\\mathrm{M}=\\dfrac{${plus(slagaemyeWC(w, c))}}{${t(N)}}=\\dfrac{${t(S)}}{${t(N)}}=${tq(E)}$.`,
          ],
        },
        {
          t: 'Сравниваем с ценой',
          lines: [
            `Цена выше ожидаемого выигрыша на $${t(cena)}-${tq(E)}=${tq(otv)}$ ${edinicaOtveta(answer, true)} — столько в среднем зарабатывает продавец с каждой продажи.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: schitaem(S, N, '\\mathrm{M}'),
      hints: [
        vopros('На что делим общую сумму выигрышей?', `на число всех ${ed.biletov}, $${t(N)}$`, [
          `на число столбцов таблицы, $${w.length}$`,
          `на цену, $${t(cena)}$`,
        ]),
        vopros('Чему равно математическое ожидание выигрыша?', `$${tq(E)}$`, [
          `$${tq(srednee)}$`,
          `$${t(S)}$`,
          `$${tq(otv)}$`,
        ]),
        vopros(
          'Что нужно найти в ответе?',
          `разность $${t(cena)}-${tq(E)}$`,
          [`само ожидание $${tq(E)}$`, `сумму $${t(cena)}+${tq(E)}$`],
          'Спрашивают, на сколько цена выше ожидания.',
        ),
      ],
    };
  },
  pereschet(p) {
    const N = num(p, 'N');
    const cena = num(p, 'cena');
    const w = arr(p, 'w');
    const c = arr(p, 'c');
    let s = 0;
    w.forEach((x, i) => {
      s += (x * (c[i] as number)) / N;
    });
    return Math.round((cena - s) * 1e9) / 1e9;
  },
  summy(p) {
    return [{ chto: 'все билеты с выигрышем', doli: arr(p, 'c'), nado: num(p, 'N') }];
  },
};

/* ════════════════════ 6.6 и 6.7: M(X) по распределению ════════════════════ */

function vstupleniyeVelichiny(p: Params): { kontekst: string; velichina: string } | null {
  const sj = strOpt(p, 'sj');
  if (sj === undefined) {
    return null;
  }
  const v = velichina(sj);
  return { kontekst: v.kontekst, velichina: v.velichina };
}

function reshenieE(p: Params): Solved {
  const r = raspr(p);
  const E = ozhidanie(r);
  const answer = E.n / E.m;
  const srednee = q(
    r.xs.reduce((s, x) => s + x, 0),
    r.xs.length,
  );
  /* Слагаемое для подсказки — у значения, где произведение не равно самой вероятности. */
  const imax = Math.max(
    0,
    r.xs.reduce(
      (best, x, i) => (x !== 0 && x !== 1 && Math.abs(x) >= Math.abs(r.xs[best] ?? 0) ? i : best),
      -1,
    ),
  );
  const xp = mul(q(r.xs[imax] as number), r.p[imax] as typeof E);
  const sumX = q(r.xs.reduce((s, x) => s + x, 0));
  return {
    answer,
    etapy: etapy(
      {
        t: 'Добавляем строку $x_ip_i$',
        lines: [
          strokaProverki(r),
          'Под каждым значением пишем произведение значения на его вероятность:',
        ],
        tablica: tablicaReshenia(r, false),
      },
      {
        t: 'Складываем строку $x_ip_i$',
        lines: [
          `Математическое ожидание — сумма произведений значений на их вероятности: $${formulaE(r)}$.`,
          otvetLine(answer),
        ],
      },
    ),
    vychisleniya: [],
    hints: [
      vopros(`Как найти $\\mathrm{M}(${r.v})$?`, 'сложить произведения значений на их вероятности', [
        'сложить значения и разделить на их число',
        'сложить вероятности',
        'взять значение с наибольшей вероятностью',
      ]),
      vopros(
        `Чему равно слагаемое для значения $${t(r.xs[imax] as number)}$?`,
        `$${slagaemoeXP(r, imax)}=${tq(xp)}$`,
        [`$${t(r.xs[imax] as number)}+${pTex(r, imax)}$`, `$${pTex(r, imax)}$`],
      ),
      vopros(`Чему равно $\\mathrm{M}(${r.v})$?`, `$${tq(E)}$`, lovushki(E, [srednee, sumX, q(1)])),
    ],
  };
}

const P06: Prototype = {
  id: 'P06',
  no: 6,
  group: 'III',
  title: 'Распределение таблицей: математическое ожидание',
  formula: '$\\mathrm{M}(X)=x_1p_1+x_2p_2+\\ldots+x_np_n$',
  skills: ['stroka-xp'],
  istochnik: 'Математическое ожидание, №3',
  ris: (p) => ({ vid: 'tablica', tablica: tablicaRaspr(raspr(p)) }),
  uslovie(p) {
    const r = raspr(p);
    const ris: Ris = { vid: 'tablica', tablica: tablicaRaspr(r) };
    const s = vstupleniyeVelichiny(p);
    if (s === null) {
      return {
        text: `В таблице показано распределение случайной величины $${r.v}$. Найдите $\\mathrm{M}(${r.v})$ — математическое ожидание этой случайной величины.`,
        ris,
      };
    }
    return {
      text: `${s.kontekst} В таблице показано распределение случайной величины $${r.v}$ — ${s.velichina}.`,
      ris,
      posle: `Найдите $\\mathrm{M}(${r.v})$ — математическое ожидание этой случайной величины.`,
    };
  },
  solve: reshenieE,
  pereschet(p) {
    const xs = arr(p, 'xs');
    const ps = arr(p, 'ps');
    const den = num(p, 'den');
    return Math.round(xs.reduce((s, x, i) => s + (x * (ps[i] as number)) / den, 0) * 1e9) / 1e9;
  },
  summy: (p) => summyRaspr(raspr(p)),
};

const P07: Prototype = {
  id: 'P07',
  no: 7,
  group: 'III',
  title: 'Распределение записью $X\\sim(\\ldots)$: математическое ожидание',
  formula: '$\\mathrm{M}(X)=x_1p_1+x_2p_2+\\ldots+x_np_n$',
  skills: ['stroka-xp'],
  istochnik: 'Математическое ожидание, №6',
  ris: (p) => ({ vid: 'zapis', tex: zapisTex(raspr(p)) }),
  uslovie(p) {
    const r = raspr(p);
    const ris: Ris = { vid: 'zapis', tex: zapisTex(r) };
    const s = vstupleniyeVelichiny(p);
    if (s === null) {
      return {
        text: `Вычислите математическое ожидание случайной величины $${r.v}$, если известно её распределение:`,
        ris,
      };
    }
    return {
      text: `${s.kontekst} Случайная величина $${r.v}$ — ${s.velichina} — имеет распределение`,
      ris,
      posle: `Вычислите математическое ожидание случайной величины $${r.v}$.`,
    };
  },
  solve: reshenieE,
  pereschet: (p) => P06.pereschet(p),
  summy: (p) => summyRaspr(raspr(p)),
};

/* ════════════════════ 6.8: частоты ════════════════════ */

export interface Tovar {
  key: string;
  tema?: Tema;
  plot: string;
  /** Как продаётся: «Пластиковые бутылки с питьевой водой продаются поштучно, либо упаковками по 9 или 12 штук.» */
  prodazha(k: readonly number[]): string;
  /** Кто покупает: «покупателя» / «посетителей». */
  kto: [string, string, string];
  /** Как называется покупка размера k: «одну бутылку», «упаковку, в которой 9 бутылок». */
  pokupka(k: number): string;
  /** «эту воду» — что не покупают. */
  chto: string;
  /** Название величины: «количество бутылок в одной покупке». */
  velichina: string;
  /** Размеры упаковок: первый — 1 (поштучно) или нет. */
  razmery: number[][];
}

const shtuk = (k: number, odin: string, dva: string, pyat: string) =>
  `${k} ${skl(k, odin, dva, pyat)}`;

export const TOVARY_FIPI: Tovar[] = [
  {
    key: 'voda',
    plot: 'бутылки воды',
    prodazha: (k) =>
      `Пластиковые бутылки с питьевой водой продаются поштучно, либо упаковками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) =>
      k === 1 ? 'одну бутылку' : `упаковку, в которой ${shtuk(k, 'бутылка', 'бутылки', 'бутылок')}`,
    chto: 'эту воду',
    velichina: 'количество бутылок в одной покупке',
    razmery: [
      [1, 6, 12],
      [1, 9, 12],
      [1, 4, 6],
      [1, 6, 9],
      [1, 8, 12],
    ],
  },
  {
    key: 'batareyki',
    plot: 'батарейки',
    prodazha: (k) =>
      `Батарейки продаются поштучно, либо упаковками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) =>
      k === 1
        ? 'одну батарейку'
        : `упаковку, в которой ${shtuk(k, 'батарейка', 'батарейки', 'батареек')}`,
    chto: 'батарейки',
    velichina: 'количество батареек в одной покупке',
    razmery: [
      [1, 2, 4],
      [1, 4, 8],
      [1, 4, 10],
      [1, 2, 6],
    ],
  },
  {
    key: 'tetradi',
    plot: 'тетради',
    prodazha: (k) =>
      `Тетради продаются поштучно, либо пачками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) =>
      k === 1 ? 'одну тетрадь' : `пачку, в которой ${shtuk(k, 'тетрадь', 'тетради', 'тетрадей')}`,
    chto: 'тетради',
    velichina: 'количество тетрадей в одной покупке',
    razmery: [
      [1, 5, 10],
      [1, 4, 12],
      [1, 6, 10],
      [1, 5, 12],
    ],
  },
  {
    key: 'yogurty',
    plot: 'йогурты',
    prodazha: (k) =>
      `Йогурты продаются поштучно, либо упаковками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) =>
      k === 1 ? 'один йогурт' : `упаковку, в которой ${shtuk(k, 'йогурт', 'йогурта', 'йогуртов')}`,
    chto: 'йогурты',
    velichina: 'количество йогуртов в одной покупке',
    razmery: [
      [1, 3, 6],
      [1, 4, 8],
      [1, 2, 4],
      [1, 4, 6],
    ],
  },
  {
    key: 'yaytsa',
    plot: 'яйца',
    prodazha: (k) =>
      `Яйца продаются упаковками по ${iSpisok(k.map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) => `упаковку, в которой ${shtuk(k, 'яйцо', 'яйца', 'яиц')}`,
    chto: 'яйца',
    velichina: 'количество яиц в одной покупке',
    razmery: [
      [6, 10, 20],
      [6, 10, 30],
      [10, 20, 30],
    ],
  },
];

export const TOVARY_SYUZHET: Tovar[] = [
  {
    key: 'kristally',
    tema: 'igry',
    plot: 'кристаллы в игровом магазине',
    prodazha: (k) =>
      `Кристаллы в мобильной игре продаются поштучно, либо наборами по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['игрок', 'игрока', 'игроков'],
    pokupka: (k) =>
      k === 1 ? 'один кристалл' : `набор из ${shtuk(k, 'кристалла', 'кристаллов', 'кристаллов')}`,
    chto: 'кристаллы',
    velichina: 'количество кристаллов в одной покупке',
    razmery: [
      [1, 10, 50],
      [1, 20, 50],
      [1, 10, 25],
    ],
  },
  {
    key: 'myachi',
    tema: 'sport',
    plot: 'теннисные мячи',
    prodazha: (k) =>
      `Теннисные мячи продаются поштучно, либо банками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штуки.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) => (k === 1 ? 'один мяч' : `банку, в которой ${shtuk(k, 'мяч', 'мяча', 'мячей')}`),
    chto: 'мячи',
    velichina: 'количество мячей в одной покупке',
    razmery: [
      [1, 3, 4],
      [1, 2, 4],
    ],
  },
  {
    key: 'picca',
    tema: 'dostavka',
    plot: 'пиццы в заказе',
    prodazha: (k) =>
      `В приложении пиццерии можно заказать одну пиццу или комбо-набор из ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} пицц.`,
    kto: ['пользователь', 'пользователя', 'пользователей'],
    pokupka: (k) => (k === 1 ? 'одну пиццу' : `комбо из ${shtuk(k, 'пиццы', 'пицц', 'пицц')}`),
    chto: 'ничего',
    velichina: 'количество пицц в одном заказе',
    razmery: [
      [1, 3, 5],
      [1, 2, 4],
    ],
  },
  {
    key: 'dozhdeviki',
    tema: 'pogoda',
    plot: 'дождевики у входа в парк',
    prodazha: (k) =>
      `В дождливый день у входа в парк аттракционов продают дождевики поштучно, либо семейными наборами по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штуки.`,
    kto: ['посетитель', 'посетителя', 'посетителей'],
    pokupka: (k) =>
      k === 1 ? 'один дождевик' : `набор из ${shtuk(k, 'дождевика', 'дождевиков', 'дождевиков')}`,
    chto: 'дождевики',
    velichina: 'количество дождевиков в одной покупке',
    razmery: [
      [1, 3, 4],
      [1, 2, 4],
    ],
  },
  {
    key: 'stikery',
    tema: 'socseti',
    plot: 'стикерпаки',
    prodazha: (k) =>
      `Стикеры для мессенджера продаются поштучно, либо паками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['пользователь', 'пользователя', 'пользователей'],
    pokupka: (k) =>
      k === 1 ? 'один стикер' : `пак из ${shtuk(k, 'стикера', 'стикеров', 'стикеров')}`,
    chto: 'стикеры',
    velichina: 'количество стикеров в одной покупке',
    razmery: [
      [1, 10, 25],
      [1, 5, 20],
    ],
  },
  {
    key: 'ruchki',
    tema: 'ekzameny',
    plot: 'гелевые ручки перед экзаменом',
    prodazha: (k) =>
      `Перед экзаменами гелевые ручки продаются поштучно, либо наборами по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) => (k === 1 ? 'одну ручку' : `набор из ${shtuk(k, 'ручки', 'ручек', 'ручек')}`),
    chto: 'ручки',
    velichina: 'количество ручек в одной покупке',
    razmery: [
      [1, 5, 10],
      [1, 4, 12],
    ],
  },
  {
    key: 'noski',
    tema: 'magaziny',
    plot: 'носки по акции',
    prodazha: (k) =>
      `В магазине по акции носки продаются по одной паре, либо наборами по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} пар.`,
    kto: ['покупатель', 'покупателя', 'покупателей'],
    pokupka: (k) => (k === 1 ? 'одну пару' : `набор из ${shtuk(k, 'пары', 'пар', 'пар')}`),
    chto: 'носки',
    velichina: 'количество пар носков в одной покупке',
    razmery: [
      [1, 3, 5],
      [1, 5, 10],
    ],
  },
  {
    key: 'poezdki',
    tema: 'transport',
    plot: 'билеты на поездки',
    prodazha: (k) =>
      `В автомате продаются билеты на одну поездку, а также на ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} поездок.`,
    kto: ['пассажир', 'пассажира', 'пассажиров'],
    pokupka: (k) =>
      k === 1 ? 'билет на одну поездку' : `билет на ${shtuk(k, 'поездку', 'поездки', 'поездок')}`,
    chto: 'билеты',
    velichina: 'количество поездок в одной покупке',
    razmery: [
      [1, 20, 60],
      [1, 10, 40],
    ],
  },
  {
    key: 'pirozhki',
    tema: 'shkola',
    plot: 'пирожки в школьном буфете',
    prodazha: (k) =>
      `В школьном буфете пирожки продают поштучно, либо наборами по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['ученик', 'ученика', 'учеников'],
    pokupka: (k) =>
      k === 1 ? 'один пирожок' : `набор из ${shtuk(k, 'пирожка', 'пирожков', 'пирожков')}`,
    chto: 'пирожки',
    velichina: 'количество пирожков в одной покупке',
    razmery: [
      [1, 3, 5],
      [1, 2, 5],
    ],
  },
  {
    key: 'ponchiki',
    tema: 'kofeynya',
    plot: 'пончики в кофейне',
    prodazha: (k) =>
      `В кофейне пончики продают поштучно, либо коробками по ${iSpisok(k.slice(1).map(String)).replace(' и ', ' или ')} штук.`,
    kto: ['посетитель', 'посетителя', 'посетителей'],
    pokupka: (k) =>
      k === 1 ? 'один пончик' : `коробку, в которой ${shtuk(k, 'пончик', 'пончика', 'пончиков')}`,
    chto: 'пончики',
    velichina: 'количество пончиков в одной покупке',
    razmery: [
      [1, 4, 6],
      [1, 6, 12],
    ],
  },
];

const TOVARY = new Map([...TOVARY_FIPI, ...TOVARY_SYUZHET].map((t0) => [t0.key, t0]));

export function tovar(key: string): Tovar {
  const x = TOVARY.get(key);
  if (x === undefined) {
    throw new Error(`нет товара ${key}`);
  }
  return x;
}

/** Склеить «72 покупателя из 100 эту воду не покупают, 14 покупают одну бутылку, 9 человек — …, и 5 человек берут …». */
function chastotyText(tv: Tovar, n0: number, k: readonly number[], n: readonly number[]): string {
  const [kto1, kto2, kto5] = tv.kto;
  const zakaz = tv.chto === 'ничего';
  /* «61 покупатель … не покупает», «72 покупателя … не покупают». */
  const odin = (m: number) => m % 10 === 1 && m % 100 !== 11;
  const nachalo = zakaz
    ? `Известно, что в среднем ${n0} ${skl(n0, kto1, kto2, kto5)} из 100, открывших приложение, ничего не ${odin(n0) ? 'заказывает' : 'заказывают'}`
    : `Известно, что в среднем ${n0} ${skl(n0, kto1, kto2, kto5)} из 100 ${tv.chto} не ${odin(n0) ? 'покупает' : 'покупают'}`;
  const chelovek = (m: number) => `${m} ${skl(m, 'человек', 'человека', 'человек')}`;
  const chasti = k.map((kk, i) => {
    const m = n[i] as number;
    if (i === 0) {
      const glagol = zakaz
        ? odin(m)
          ? 'заказывает'
          : 'заказывают'
        : odin(m)
          ? 'покупает'
          : 'покупают';
      return `${m} ${glagol} ${tv.pokupka(kk)}`;
    }
    if (i === k.length - 1) {
      return `и ${chelovek(m)} ${odin(m) ? 'берёт' : 'берут'} ${tv.pokupka(kk)}`;
    }
    return `${chelovek(m)} — ${tv.pokupka(kk)}`;
  });
  return `${nachalo}, ${chasti.slice(0, -1).join(', ')}, ${chasti.at(-1)}.`;
}

const P08: Prototype = {
  id: 'P08',
  no: 8,
  group: 'III',
  title: 'Частоты «из 100 покупателей»: ожидание количества в покупке',
  formula: '$p_i=\\dfrac{n_i}{100}$, $\\mathrm{M}=\\sum x_ip_i$',
  skills: ['chastoty', 'stroka-xp'],
  istochnik: 'Математическое ожидание, №7',
  ris: () => undefined,
  uslovie(p) {
    const tv = tovar(str(p, 'tovar', [...TOVARY.keys()]));
    const k = arr(p, 'k');
    const n = arr(p, 'n');
    const n0 = num(p, 'n0');
    return {
      text: `${tv.prodazha(k)} ${chastotyText(tv, n0, k, n)} Найдите математическое ожидание случайной величины «${tv.velichina}».`,
    };
  },
  solve(p) {
    const tv = tovar(str(p, 'tovar', [...TOVARY.keys()]));
    const k = arr(p, 'k');
    const n = arr(p, 'n');
    const n0 = num(p, 'n0');
    const xs = [0, ...k];
    const cnt = [n0, ...n];
    const ps = cnt.map((c) => q(c, 100));
    const E = sumQ(xs.map((x, i) => mul(q(x), ps[i] as Q)));
    const answer = E.n / E.m;
    const tab = tablica(
      [
        { zag: 'Количество в покупке', yach: xs.map((x) => tx(x)) },
        { zag: 'Частота из 100', yach: cnt.map((x) => tx(x)) },
        { zag: 'Вероятность', yach: ps.map((x) => `$${tq(x)}$`) },
      ],
      undefined,
      [2],
    );
    const bezNulya = xs.map((x, i) => umn(t(x), tq(ps[i] as Q)));
    const lovushka = q(
      xs.reduce((s, x, i) => s + x * (cnt[i] as number), 0),
      100 - n0,
    );
    const iMax = k.length - 1;
    return {
      answer,
      etapy: etapy(
        {
          t: 'Переводим частоты в вероятности',
          lines: [
            `Проверяем, что учтены все 100 ${tv.kto[2]}: $${plus(cnt.map((x) => t(x)))}=100$. Тот, кто ничего не купил, — это значение $0$. Делим каждую частоту на $100$:`,
          ],
          tablica: tab,
        },
        {
          t: 'Считаем математическое ожидание',
          lines: [
            `$\\mathrm{M}=${plus(bezNulya)}=${plus(xs.map((x, i) => tq(mul(q(x), ps[i] as Q))))}=${tq(E)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [],
      hints: [
        vopros(
          `Какова вероятность, что ${tv.kto[0]} возьмёт ${tv.pokupka(k[iMax] as number)}?`,
          `$${tq(ps[iMax + 1] as Q)}$`,
          [`$${t(n[iMax] as number)}$`, `$${tq(q(n[iMax] as number, 10))}$`],
          `Частоту делим на $100$: $${t(n[iMax] as number)}:100=${tq(ps[iMax + 1] as Q)}$.`,
        ),
        vopros(
          `Какое значение величины у тех, кто ничего не ${tv.chto === 'ничего' ? 'заказал' : 'купил'}?`,
          '$0$',
          ['$1$', `$${t(n0)}$`],
          'Их тоже нужно учесть: значение $0$ с вероятностью $' + tq(q(n0, 100)) + '$.',
        ),
        vopros('Чему равно математическое ожидание?', `$${tq(E)}$`, [
          `$${tq(lovushka)}$`,
          `$${tq(
            q(
              k.reduce((s, x) => s + x, 0),
              k.length,
            ),
          )}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    const k = arr(p, 'k');
    const n = arr(p, 'n');
    return Math.round(k.reduce((s, x, i) => s + x * ((n[i] as number) / 100), 0) * 1e9) / 1e9;
  },
  summy(p) {
    return [{ chto: 'частоты из 100', doli: [num(p, 'n0'), ...arr(p, 'n')], nado: 100 }];
  },
};

/* ════════════════════ 6.9: страхование ════════════════════ */

export interface SyuzhetStrahovki {
  key: string;
  tema: Tema;
  plot: string;
  /** Текст условия по выплате, вероятности и ожидаемому доходу. */
  text(V: string, p: string, R: string): string;
  Vs: number[];
  /** Вероятности в тысячных. */
  pTys: number[];
  Rs: number[];
}

/** Выплата в тексте: «1,5 млн рублей», «300 000 рублей». */
export function vyplataText(V: number): string {
  if (V >= 1_000_000 && V % 100_000 === 0) {
    return `${tx(V / 1_000_000)}${NBSP}млн рублей`;
  }
  return `${tx(V)} ${skl(V, 'рубль', 'рубля', 'рублей')}`;
}

export const SYUZHETY_P09: SyuzhetStrahovki[] = [
  {
    key: 'pristavka',
    tema: 'igry',
    plot: 'страховка игровой приставки',
    text: (V, p, R) =>
      `Прокат игровых приставок предлагает к аренде страховку: если приставка сломается, прокат сам оплатит ремонт стоимостью ${V}. Вероятность поломки за время аренды равна ${p}. Математическое ожидание случайной величины «доход проката от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [8000, 10000, 12000, 15000, 20000],
    pTys: [10, 20, 25, 30, 40, 50],
    Rs: [100, 150, 200, 250, 300],
  },
  {
    key: 'zabeg',
    tema: 'sport',
    plot: 'страховка участника забега',
    text: (V, p, R) =>
      `Организатор городского забега продаёт участникам страховку: при травме на дистанции участник получает выплату ${V}. Вероятность травмы равна ${p}. Математическое ожидание случайной величины «доход организатора от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [20000, 30000, 40000, 50000],
    pTys: [2, 4, 5, 8, 10],
    Rs: [100, 120, 150, 200],
  },
  {
    key: 'posylka',
    tema: 'dostavka',
    plot: 'страховка посылки',
    text: (V, p, R) =>
      `Служба доставки предлагает застраховать посылку: если посылка потеряется, клиент получит ${V}. Вероятность потерять посылку равна ${p}. Математическое ожидание случайной величины «доход службы от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [5000, 10000, 15000, 20000, 30000],
    pTys: [2, 4, 5, 6, 8, 10],
    Rs: [50, 60, 80, 100, 150],
  },
  {
    key: 'festival',
    tema: 'pogoda',
    plot: 'страховка от дождя на фестивале',
    text: (V, p, R) =>
      `Организаторы фестиваля под открытым небом продают «страховку от дождя»: если в день фестиваля пойдёт дождь, зритель получит ${V}. Вероятность дождя в этот день равна ${p}. Математическое ожидание случайной величины «доход организаторов от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [1000, 1500, 2000, 2500, 3000],
    pTys: [100, 150, 200, 250, 300],
    Rs: [50, 80, 100, 150, 200],
  },
  {
    key: 'prodvizhenie',
    tema: 'socseti',
    plot: 'гарантия продвижения',
    text: (V, p, R) =>
      `Сервис продвижения в соцсетях продаёт к рекламе гарантию: если пост не наберёт обещанных просмотров, клиенту вернут ${V}. Вероятность такого исхода равна ${p}. Математическое ожидание случайной величины «доход сервиса от продажи одной гарантии» равно ${R}. Найдите стоимость гарантии в рублях.`,
    Vs: [2000, 3000, 4000, 5000],
    pTys: [40, 50, 60, 80, 100],
    Rs: [100, 150, 200, 300],
  },
  {
    key: 'kurs',
    tema: 'ekzameny',
    plot: 'курс с гарантией балла',
    text: (V, p, R) =>
      `Онлайн-школа продаёт к курсу гарантию: если ученик не наберёт на экзамене обещанный балл, ему выплатят ${V}. Вероятность этого равна ${p}. Математическое ожидание случайной величины «доход школы от продажи одной гарантии» равно ${R}. Найдите стоимость гарантии в рублях.`,
    Vs: [10000, 15000, 20000, 25000],
    pTys: [20, 40, 50, 60, 80],
    Rs: [200, 300, 400, 500],
  },
  {
    key: 'garantiya',
    tema: 'magaziny',
    plot: 'расширенная гарантия на смартфон',
    text: (V, p, R) =>
      `Магазин электроники продаёт расширенную гарантию на смартфон: при поломке магазин оплачивает ремонт стоимостью ${V}. Вероятность поломки за срок гарантии равна ${p}. Математическое ожидание случайной величины «доход магазина от продажи одной гарантии» равно ${R}. Найдите стоимость гарантии в рублях.`,
    Vs: [10000, 12000, 15000, 18000, 20000],
    pTys: [40, 50, 60, 80, 100],
    Rs: [300, 400, 500, 600, 800],
  },
  {
    key: 'poezd',
    tema: 'transport',
    plot: 'страховка от задержки поезда',
    text: (V, p, R) =>
      `Перевозчик продаёт страховку от задержки поезда: если поезд задержится больше чем на час, пассажир получит ${V}. Вероятность такой задержки равна ${p}. Математическое ожидание случайной величины «доход перевозчика от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [1000, 2000, 3000, 5000],
    pTys: [10, 20, 25, 40, 50],
    Rs: [40, 50, 60, 80, 100],
  },
  {
    key: 'ekskursiya',
    tema: 'shkola',
    plot: 'страховка школьной экскурсии',
    text: (V, p, R) =>
      `Турфирма продаёт к школьной экскурсии страховку от отмены поездки: при отмене ученику вернут ${V}. Вероятность отмены равна ${p}. Математическое ожидание случайной величины «доход турфирмы от продажи одной страховки» равно ${R}. Найдите стоимость страховки в рублях.`,
    Vs: [3000, 4000, 5000, 6000],
    pTys: [20, 25, 40, 50],
    Rs: [50, 80, 100, 120],
  },
  {
    key: 'vozvrat',
    tema: 'kofeynya',
    plot: 'билет в кино с возвратом',
    text: (V, p, R) =>
      `Кинотеатр продаёт к билету опцию возврата: если зритель не сможет прийти, ему вернут ${V}. Вероятность, что зритель не придёт, равна ${p}. Математическое ожидание случайной величины «доход кинотеатра от продажи одной опции» равно ${R}. Найдите стоимость опции в рублях.`,
    Vs: [300, 400, 500, 600],
    pTys: [50, 100, 150, 200],
    Rs: [10, 20, 25, 30, 40],
  },
];

const STRAHOVKI = new Map(SYUZHETY_P09.map((s) => [s.key, s]));

function rubley(x: number): string {
  return `${tx(x)} ${skl(x, 'рубль', 'рубля', 'рублей')}`;
}

const P09: Prototype = {
  id: 'P09',
  no: 9,
  group: 'III',
  title: 'Страхование: стоимость полиса по ожидаемому доходу',
  formula: '$\\mathrm{M}(\\text{дохода})=c-V\\cdot p$, отсюда $c=\\mathrm{M}+V\\cdot p$',
  skills: ['stroka-xp'],
  istochnik: 'Математическое ожидание, №8',
  ris: () => undefined,
  uslovie(p) {
    const V = num(p, 'V');
    const pn = num(p, 'pn');
    const pden = num(p, 'pden');
    const R = num(p, 'R');
    const sj = strOpt(p, 'sj');
    const pTxt = tx(pn / pden);
    if (sj !== undefined) {
      const s = STRAHOVKI.get(sj) as SyuzhetStrahovki;
      return { text: s.text(vyplataText(V), pTxt, rubley(R)) };
    }
    return {
      text: `Страховая компания заключает с клиентами страховые договоры (полисы). При наступлении страхового случая клиент получает выплату ${vyplataText(V)}. Вероятность события «выплата по отдельно взятому договору» равна ${pTxt}. Математическое ожидание случайной величины «доход страховой компании от продажи одного полиса» равно ${tx(R)} ${skl(R, 'рубль', 'рубля', 'рублей')}. Найдите стоимость полиса в рублях.`,
    };
  },
  solve(p) {
    const V = num(p, 'V');
    const pn = num(p, 'pn');
    const pden = num(p, 'pden');
    const R = num(p, 'R');
    const pr = q(pn, pden);
    const ne = sub(q(1), pr);
    const Vp = mul(q(V), pr);
    const c = add(q(R), Vp);
    const answer = c.n / c.m;
    const tab = tablica([
      { zag: 'Доход (руб.)', yach: ['$c$', `$c-${t(V)}$`] },
      { zag: 'Вероятность', yach: [`$${tq(ne)}$`, `$${tq(pr)}$`] },
    ]);
    return {
      answer,
      etapy: etapy(
        {
          t: 'Записываем доход как случайную величину',
          lines: [
            `Пусть полис стоит $c$ рублей. Если выплаты нет (вероятность $1-${tq(pr)}=${tq(ne)}$), доход равен $c$. Если выплата есть (вероятность $${tq(pr)}$), доход равен $c-${t(V)}$.`,
          ],
          tablica: tab,
        },
        {
          t: 'Находим математическое ожидание дохода',
          lines: [
            `$\\mathrm{M}=c\\cdot${tq(ne)}+(c-${t(V)})\\cdot${tq(pr)}=c-${t(V)}\\cdot${tq(pr)}=c-${tq(Vp)}$.`,
          ],
        },
        {
          t: 'Выражаем стоимость полиса',
          lines: [
            `По условию $c-${tq(Vp)}=${t(R)}$, откуда $c=${t(R)}+${tq(Vp)}=${tq(c)}$.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [
        {
          tekst: `Умножаем выплату на вероятность: $${t(V)}\\cdot${tq(pr)}=${t(V)}\\cdot\\dfrac{${t(pn)}}{${t(pden)}}=${tq(Vp)}$.`,
        },
      ],
      hints: [
        vopros(
          'Чему равен доход компании с полиса, если произошла выплата?',
          `$c-${t(V)}$`,
          [`$-${t(V)}$`, '$c$', `$${t(V)}-c$`],
          'Деньги за полис компания уже получила, а выплату отдаёт.',
        ),
        vopros('Чему равно математическое ожидание дохода?', `$c-${tq(Vp)}$`, [
          `$c-${t(V)}$`,
          `$c\\cdot${tq(ne)}$`,
        ]),
        vopros('Сколько стоит полис?', `$${tq(c)}$`, [
          `$${tq(sub(q(R), Vp))}$`,
          `$${tq(Vp)}$`,
          `$${t(R)}$`,
        ]),
      ],
    };
  },
  pereschet(p) {
    return Math.round((num(p, 'R') + (num(p, 'V') * num(p, 'pn')) / num(p, 'pden')) * 1e9) / 1e9;
  },
  summy(p) {
    const pn = num(p, 'pn');
    const pden = num(p, 'pden');
    return [{ chto: 'выплата есть или нет', doli: [pn, pden - pn], nado: pden }];
  },
};

export const GRUPPA_III: Prototype[] = [P04, P05, P06, P07, P08, P09];
