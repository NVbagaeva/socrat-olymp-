/**
 * Сюжетные случайные величины для прототипов с распределением
 * (6.6, 6.7, 6.11, 6.13, 6.14, 6.15): по две на каждую тему из списка
 * задания. Величина названа по-человечески («число голов, забитых
 * командой за матч»), а её распределение по-прежнему задаётся таблицей
 * или записью $X\sim(\ldots)$ — математика у сюжетной задачи та же.
 *
 * `znacheniya` — какие значения величина принимает в жизни: генератор
 * берёт из них подряд идущие или выборку.
 */

import type { Tema } from './types';

export interface Velichina {
  key: string;
  tema: Tema;
  /** Метка для галереи. */
  plot: string;
  /** Первая фраза: что происходит. */
  kontekst: string;
  /** Величина по-человечески, без буквы. */
  velichina: string;
  znacheniya: number[];
}

export const TEMY: Tema[] = [
  'igry',
  'sport',
  'dostavka',
  'pogoda',
  'socseti',
  'ekzameny',
  'magaziny',
  'transport',
  'shkola',
  'kofeynya',
];

export const NAZVANIYA_TEM: Record<Tema, string> = {
  igry: 'игры, киберспорт, лутбоксы',
  sport: 'спорт',
  dostavka: 'доставка',
  pogoda: 'погода',
  socseti: 'соцсети и подписчики',
  ekzameny: 'экзамены и олимпиады',
  magaziny: 'магазины и акции',
  transport: 'транспорт',
  shkola: 'школьная жизнь',
  kofeynya: 'кофейня, кино',
};

export const VELICHINY: Velichina[] = [
  {
    key: 'lut',
    tema: 'igry',
    plot: 'редкие предметы в лутбоксе',
    kontekst: 'Игрок открывает лутбокс.',
    velichina: 'число редких предметов в лутбоксе',
    znacheniya: [0, 1, 2, 3, 4],
  },
  {
    key: 'pobedy',
    tema: 'igry',
    plot: 'победы киберспортивной команды',
    kontekst: 'Киберспортивная команда играет за день несколько матчей турнира.',
    velichina: 'число побед команды за игровой день',
    znacheniya: [0, 1, 2, 3, 4],
  },
  {
    key: 'goly',
    tema: 'sport',
    plot: 'голы за матч',
    kontekst: 'Футбольная команда проводит очередной матч чемпионата.',
    velichina: 'число голов, забитых командой за матч',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
  {
    key: 'trehochkovye',
    tema: 'sport',
    plot: 'трёхочковые за игру',
    kontekst: 'Баскетболист выходит на очередную игру.',
    velichina: 'число трёхочковых попаданий баскетболиста за игру',
    znacheniya: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    key: 'dostavka',
    tema: 'dostavka',
    plot: 'время доставки',
    kontekst: 'Покупатель заказывает ужин в приложении доставки.',
    velichina: 'время доставки заказа в минутах',
    znacheniya: [20, 25, 30, 35, 40, 45, 50],
  },
  {
    key: 'zakazy',
    tema: 'dostavka',
    plot: 'заказы курьера за час',
    kontekst: 'Курьер выходит на вечернюю смену.',
    velichina: 'число заказов, которые курьер доставит за час',
    znacheniya: [1, 2, 3, 4, 5, 6],
  },
  {
    key: 'temperatura',
    tema: 'pogoda',
    plot: 'температура в полдень',
    kontekst: 'Синоптики составили прогноз на первое марта.',
    velichina: 'температура воздуха в полдень в градусах Цельсия',
    znacheniya: [-3, -2, -1, 0, 1, 2, 3, 4],
  },
  {
    key: 'dozhd',
    tema: 'pogoda',
    plot: 'дождливые дни недели',
    kontekst: 'Синоптики дают прогноз на следующую неделю.',
    velichina: 'число дождливых дней в эту неделю',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
  {
    key: 'laiki',
    tema: 'socseti',
    plot: 'реакции на сторис',
    kontekst: 'Блогер выкладывает сторис.',
    velichina: 'число реакций на сторис за первую минуту',
    znacheniya: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    key: 'podpischiki',
    tema: 'socseti',
    plot: 'новые подписчики за час',
    kontekst: 'У небольшого канала выходит новое видео.',
    velichina: 'число новых подписчиков канала за час после выхода видео',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
  {
    key: 'resheno',
    tema: 'ekzameny',
    plot: 'решённые задачи пробника',
    kontekst: 'Ученик пишет пробный экзамен из пяти задач.',
    velichina: 'число верно решённых задач',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
  {
    key: 'ball',
    tema: 'ekzameny',
    plot: 'балл за задачу олимпиады',
    kontekst: 'Участник олимпиады решает последнюю задачу.',
    velichina: 'балл за эту задачу',
    znacheniya: [0, 1, 2, 3, 4],
  },
  {
    key: 'keshbek',
    tema: 'magaziny',
    plot: 'кэшбэк за покупку',
    kontekst: 'Покупатель оплачивает заказ картой с кэшбэком.',
    velichina: 'сумма кэшбэка в рублях',
    znacheniya: [0, 20, 50, 100, 150, 200],
  },
  {
    key: 'tovary',
    tema: 'magaziny',
    plot: 'товары по акции в чеке',
    kontekst: 'В магазине идёт акция «товар недели».',
    velichina: 'число акционных товаров в чеке случайного покупателя',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
  {
    key: 'ozhidanie',
    tema: 'transport',
    plot: 'ожидание автобуса',
    kontekst: 'Пассажир приходит на остановку в случайный момент.',
    velichina: 'время ожидания автобуса в минутах',
    znacheniya: [0, 2, 4, 6, 8, 10],
  },
  {
    key: 'samokaty',
    tema: 'transport',
    plot: 'свободные самокаты у метро',
    kontekst: 'Утром студент выходит из метро.',
    velichina: 'число свободных самокатов у выхода',
    znacheniya: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    key: 'ocenka',
    tema: 'shkola',
    plot: 'оценка за контрольную',
    kontekst: 'Ученик пишет контрольную работу.',
    velichina: 'оценка за контрольную',
    znacheniya: [2, 3, 4, 5],
  },
  {
    key: 'opozdavshie',
    tema: 'shkola',
    plot: 'опоздавшие на первый урок',
    kontekst: 'В классе начинается первый урок.',
    velichina: 'число опоздавших на первый урок',
    znacheniya: [0, 1, 2, 3, 4],
  },
  {
    key: 'kofe',
    tema: 'kofeynya',
    plot: 'напитки в заказе',
    kontekst: 'В кофейню заходит посетитель.',
    velichina: 'число напитков в его заказе',
    znacheniya: [1, 2, 3, 4],
  },
  {
    key: 'mesta',
    tema: 'kofeynya',
    plot: 'свободные места в ряду',
    kontekst: 'За пять минут до сеанса зритель заглядывает в зал кинотеатра.',
    velichina: 'число свободных мест в последнем ряду',
    znacheniya: [0, 1, 2, 3, 4, 5],
  },
];

const PO_KLYUCHU = new Map(VELICHINY.map((v) => [v.key, v]));

export function velichina(key: string): Velichina {
  const v = PO_KLYUCHU.get(key);
  if (v === undefined) {
    throw new Error(`нет сюжетной величины ${key}`);
  }
  return v;
}

/** Величины темы по порядку: 0 — первая, 1 — вторая. */
export function velichinyTemy(tema: Tema): Velichina[] {
  return VELICHINY.filter((v) => v.tema === tema);
}
