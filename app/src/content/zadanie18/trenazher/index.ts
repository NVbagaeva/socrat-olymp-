/**
 * Банк тренажёра №18: 24 задачи, составленные для сайта в формате
 * задания 18 ЕГЭ (не взяты из сборников и не повторяют опорные
 * задачи), по четыре на каждую тему ключевых схем. Чертежи —
 * lib/zadanie18/trenazher, проверка — pnpm test:trenazher-18.
 */

import type { Uroven18, Zadacha18 } from './tipy';
import {
  KS18_DVE_KASATELNYE,
  KS18_OTREZKI,
  KS18_PRYAM_TRAP,
  KS18_VNUTR_KASANIE,
} from './kasatelnye';
import { OK18_BRAHMAGUPTA, OK18_HORDY, OK18_ORTOCENTR, OK18_SEKUSHCHIE } from './okruzhnost';
import { OT18_CHEVA, OT18_MEDIANY, OT18_MENELAY, OT18_PARALLELOGRAMM } from './otnosheniya';
import {
  PL18_BISSEKTRISA,
  PL18_OBSHCHAYA_VYSOTA,
  PL18_OBSHCHIY_UGOL,
  PL18_RELSY,
} from './ploshchadi';
import { TP18_BABOCHKA, TP18_RAVNOBOKAYA, TP18_SREDLIN, TP18_UGOL_90 } from './trapeciya';
import { TR18_INCENTR, TR18_MEDIANA, TR18_SREDLIN, TR18_VYSOTY } from './treugolnik';

export type { Uroven18, Zadacha18 } from './tipy';

export const ZADACHI_18: readonly Zadacha18[] = [
  TR18_SREDLIN,
  TR18_VYSOTY,
  TR18_INCENTR,
  TR18_MEDIANA,
  OK18_HORDY,
  OK18_ORTOCENTR,
  OK18_SEKUSHCHIE,
  OK18_BRAHMAGUPTA,
  KS18_OTREZKI,
  KS18_DVE_KASATELNYE,
  KS18_VNUTR_KASANIE,
  KS18_PRYAM_TRAP,
  TP18_SREDLIN,
  TP18_RAVNOBOKAYA,
  TP18_BABOCHKA,
  TP18_UGOL_90,
  OT18_MEDIANY,
  OT18_MENELAY,
  OT18_CHEVA,
  OT18_PARALLELOGRAMM,
  PL18_OBSHCHAYA_VYSOTA,
  PL18_OBSHCHIY_UGOL,
  PL18_RELSY,
  PL18_BISSEKTRISA,
];

export function zadacha18(id: string): Zadacha18 | undefined {
  return ZADACHI_18.find((z) => z.id === id);
}

/** Уровни по возрастанию: так задачи идут и в тренировке. */
export const UROVNI_18: Readonly<Record<Uroven18, string>> = {
  razminka: 'Разминка',
  ege: 'Уровень ЕГЭ',
  povyshennyy: 'Повышенный',
};

/** Подписи вкладки «Тренажёр» №18. */
export const TRENAZHER_18 = {
  lead: 'Задачи в формате задания 18: в пункте а) докажи, в пункте б) найди. Ответ б) проверяется сразу, доказательство а) сверяешь сам по шагам.',
  tema: 'Тема',
  vseTemy: 'Все темы',
  uroven: 'Уровень',
  vseUrovni: 'Все уровни',
  pusto: 'Под этот выбор задач нет — выбери другую тему или уровень.',
  note: 'Сначала реши задачу на бумаге целиком: и а), и б). Ответ б) введи в поле, доказательство а) сравни с образцом.',
  metka: 'Планиметрия',
  sostavleno: 'Составлено для сайта',
  uslovie: 'Условие',
  punktA: 'Пункт а): доказательство',
  punktAPodskazka:
    'Докажи на бумаге, потом открой доказательство и честно сравни: все ли шаги у тебя есть и обоснованы.',
  pokazatDok: 'Показать доказательство',
  skrytDok: 'Скрыть доказательство',
  samoocenka: 'Как у тебя?',
  dokazal: 'Доказал',
  neDokazal: 'Не доказал',
  otmetkaDokazal: 'Отмечено: доказал.',
  otmetkaNeDokazal: 'Отмечено: не доказал — разбери шаги ещё раз.',
  punktB: 'Пункт б): ответ',
  pole: 'Ответ пункта б)',
  polePodskazka: 'Например: 12, 2,5, 4/3, 2√3 или 2sqrt3',
  proverit: 'Проверить',
  verno: 'Верно',
  estOshibka: 'Есть ошибка',
  neverno: 'Ответ не совпал. Проверь вычисления — или открой подсказку.',
  vernoTekst: 'Ответ пункта б) совпал с верным.',
  vernoSResheniem: 'Ответ верный, но решение было открыто — задача не засчитана.',
  podskazka: 'Подсказка',
  skhemyZdes: 'Какие схемы здесь',
  reshenieB: 'Решение пункта б)',
  pokazatReshenie: 'Показать решение',
  nezachet: 'Задача не будет засчитана.',
  otvet: 'Ответ',
  shagPodskazka: 'Нажми на шаг — он подсветится на чертеже.',
  podskazkaChertezha:
    'Чертёж построен по данным пункта б). «Случайное положение» показывает другую фигуру из условия — утверждение а) верно и для неё.',
  itogA: (x: number, n: number) => `Пункт а): «Доказал» — ${x} из ${n}.`,
  itogANet: 'Пункт а) ни в одной задаче не отмечен.',
  itogASovet:
    'Отметка «Доказал» — твоя честная самооценка: на экзамене пункт а) засчитывают, только если доказательство полное.',
  kOpornym: 'Разобрать опорные задачи',
} as const;
