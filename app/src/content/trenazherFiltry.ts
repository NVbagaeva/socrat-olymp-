/**
 * Тренажёр с фильтрами сверху: слова панели, экрана задачи и итогов.
 * Одни на все разделы — названия те же, что в генераторе.
 */

import { plural } from '@/lib/plural';
import type { SlovaFiltra } from '@/lib/trenazher/filtr';
import type { Moi, Poryadok, Rezhim, Skolko } from '@/lib/trenazher/types';

export const SLOVA_FILTRA: SlovaFiltra = {
  vseTipy: 'все типы',
  tipov: (n) => `${n} ${plural(n, 'тип', 'типа', 'типов')}`,
  istochnik: { fipi: 'открытый банк ФИПИ', new: 'не из банка' },
  moi: { nereshennye: 'только нерешённые', oshibki: 'только с ошибками' },
  pravila: 'часть задач',
  bezOgranicheniya: 'без ограничения',
};

export const FILTRY = {
  tipy: 'Типы задач',
  vse: 'Все',
  istochnik: 'Источник',
  istochniki: {
    vse: 'Все',
    fipi: 'Открытый банк ФИПИ',
    new: 'Не из банка',
  },
  slozhnost: 'Сложность',
  slozhnostVse: 'Любая',
  skolko: 'Сколько задач',
  skolkoVarianty: { 5: '5', 10: '10', 20: '20', 0: 'Без ограничения' } satisfies Record<
    Skolko,
    string
  >,
  rezhim: 'Режим',
  rezhimy: {
    podskazki: { title: 'С подсказками', lead: 'Пошаговые вопросы, вторая попытка' },
    bez: { title: 'Без подсказок', lead: 'Одна попытка, разбор после ответа' },
    vremya: { title: 'На время', lead: 'Секундомер на каждую задачу' },
  } satisfies Record<Rezhim, { title: string; lead: string }>,
  poryadok: 'Порядок',
  poryadki: {
    prostye: 'От простых к сложным',
    sluchayno: 'Случайно',
  } satisfies Record<Poryadok, string>,
  moi: 'Мои задачи',
  moiVarianty: {
    vse: 'Все',
    nereshennye: 'Только нерешённые',
    oshibki: 'Только с ошибками',
  } satisfies Record<Moi, string>,
  nabory: 'Готовые наборы',
  naboryVarianty: {
    bystryy: { title: 'Быстрый старт', sub: '10 случайных задач' },
    oshibki: { title: 'Работа над ошибками', sub: 'Задачи, где были ошибки' },
    slozhnye: { title: 'Только сложные', sub: 'Самый высокий уровень' },
  },
  naydeno: (n: number) => `Найдено ${n} ${plural(n, 'задача', 'задачи', 'задач')}`,
  vozmyom: (n: number) => `в тренировку — ${n}`,
  sbrosit: 'Сбросить',
  snyat: (label: string) => `Снять фильтр «${label}»`,
  filtry: 'Фильтры',
  pokazat: (n: number) => `Показать ${n} ${plural(n, 'задачу', 'задачи', 'задач')}`,
  nachat: 'Начать тренировку',
  sobirayu: 'Собираю тренировку…',
  pusto: {
    title: 'Таких задач нет',
    text: 'Под все выбранные фильтры не подходит ни одна задача.',
    rasshirit: 'Расширить фильтры',
    sbrosit: 'Сбросить все фильтры',
    oshibok: 'Ошибок пока нет: здесь появятся задачи, в которых вы ошибётесь.',
  },
  nolChip: 'нет задач при этих фильтрах',
  resheno: (r: number, n: number) => `решено ${r} из ${n}`,
  pauza: {
    title: 'Тренировка на паузе',
    text: (r: number, n: number) => `Решено ${r} из ${n}. Её можно продолжить с того же места.`,
    prodolzhit: 'Продолжить тренировку',
  },
  ssylka: 'Ссылка на эти фильтры',
  skopirovano: 'Ссылка скопирована',
} as const;

export const EKRAN = {
  kFiltram: 'К фильтрам',
  kFiltramTitle: 'Вернуться к фильтрам?',
  kFiltramText: 'Тренировка встанет на паузу. Её можно будет продолжить с того же места.',
  kFiltramDa: 'К фильтрам',
  kFiltramNet: 'Остаться',
  lenta: 'Задачи тренировки',
  status: {
    new: 'не начата',
    open: 'начата',
    right: 'верно',
    wrong: 'ошибка',
    hinted: 'с подсказкой',
    skipped: 'пропущена',
  },
  zadacha: (i: number, n: number) => `Задача ${i} из ${n}`,
  istochnik: { fipi: 'Открытый банк ФИПИ', new: 'Не из открытого банка' },
  otvet: 'Ваш ответ:',
  proverit: 'Проверить',
  podskazka: 'Подсказка по шагам',
  podskazkaCena: 'Задача не будет засчитана.',
  propustit: 'Пропустить',
  pohozhaya: 'Похожая задача',
  razbor: 'Разбор',
  skrytRazbor: 'Скрыть разбор',
  dalshe: 'Дальше →',
  itogi: 'Смотреть результат →',
  kNereshennoy: 'К нерешённой задаче →',
  verno: 'Верно!',
  oshibka: 'Есть ошибка',
  eshchyoRaz: 'Попробуйте ещё раз: осталась одна попытка.',
  razborPosle: 'Попытки кончились — вот разбор.',
  reshenoSPodskazkoy: 'Задача решена с подсказкой — она не засчитана.',
  sobirayu: 'Собираю задачу…',
  neSobralas: 'Эту задачу собрать не удалось. Возьмите похожую или пропустите её.',
  sekundomer: 'Время на задачу',
} as const;

export const ITOGI = {
  pererreshat: (n: number) => `Перерешать ошибки (${n})`,
  povtorit: 'Ошибки по типам — повторить:',
  teoriya: 'Теория',
  opornye: 'Опорные задачи',
  vremya: 'Время по задачам',
  sek: (s: number) =>
    s < 60 ? `${Math.round(s)} с` : `${Math.floor(s / 60)} мин ${Math.round(s % 60)} с`,
} as const;
