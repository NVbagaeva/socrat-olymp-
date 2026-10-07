/**
 * Дерево задания №11: разделы в порядке изучения и их подтипы.
 *
 * Коды подтипов в данных латиницей (DP-07), на сайте — кириллицей
 * (ДП-07). Отсюда берут фильтры тренажёра и генератора, «карта
 * маршрута» вкладки «О задании» (число подтипов, наибольшая
 * сложность раздела) и поиск по сюжетным словам.
 */

import { BANK } from './bank';
import { kodNaSayte } from './kod';
import { SUBTYPES } from './prototypes';
import type { Level, SectionId, Subtype } from './types';

export interface Section {
  id: SectionId;
  /** Код на сайте: «ДП». */
  kod: string;
  nazvanie: string;
  /** Одна строка для карточки раздела. */
  opisanie: string;
  /** Не входит в ЕГЭ и не открытый банк (разминка). */
  razminka?: boolean;
}

/** Порядок изучения: РЗ → ПР → СМ → ДП → ПТ → ВД → ОК → РБ → ПГ. */
export const SECTIONS: Section[] = [
  {
    id: 'RZ',
    kod: 'РЗ',
    nazvanie: 'Разминка',
    opisanie: 'Простейшие задачи: проценты, единицы, округление. Не входит в ЕГЭ.',
    razminka: true,
  },
  {
    id: 'PR',
    kod: 'ПР',
    nazvanie: 'Проценты',
    opisanie: 'Множители изменения, последовательные изменения, доли.',
  },
  {
    id: 'SM',
    kod: 'СМ',
    nazvanie: 'Смеси и сплавы',
    opisanie: 'Уравнение по массе чистого вещества.',
  },
  {
    id: 'DP',
    kod: 'ДП',
    nazvanie: 'Движение по прямой',
    opisanie: 'Таблица скорость–время–путь, средняя скорость.',
  },
  {
    id: 'PT',
    kod: 'ПТ',
    nazvanie: 'Протяжённые тела',
    opisanie: 'Поезда и суда: путь — сумма длин.',
  },
  {
    id: 'VD',
    kod: 'ВД',
    nazvanie: 'Движение по воде',
    opisanie: 'По течению и против течения, плот.',
  },
  {
    id: 'OK',
    kod: 'ОК',
    nazvanie: 'Движение по окружности',
    opisanie: 'Обгон на круг, скорость сближения.',
  },
  {
    id: 'RB',
    kod: 'РБ',
    nazvanie: 'Работа',
    opisanie: 'Производительность, совместная работа, трубы.',
  },
  { id: 'PG', kod: 'ПГ', nazvanie: 'Прогрессии', opisanie: 'Сумма арифметической прогрессии.' },
];

/** Код подтипа для сайта: DP-07 → ДП-07 (lib/zadanie11/kod.ts). */
export { kodNaSayte };

export interface SectionInfo extends Section {
  subtypes: Subtype[];
  /** Наибольшая сложность подтипов раздела — звёзды на карточке. */
  maxLevel: Level;
  /** Сколько задач раздела в открытом банке (у разминки — свои задачи). */
  vBanke: number;
}

/** Разделы с подтипами и счётчиками. */
export function sectionsInfo(): SectionInfo[] {
  const perSubtype = new Map<string, number>();
  for (const item of BANK) {
    perSubtype.set(item.id, (perSubtype.get(item.id) ?? 0) + 1);
  }
  return SECTIONS.map((s) => {
    const subtypes = SUBTYPES.filter((st) => st.section === s.id);
    return {
      ...s,
      subtypes,
      maxLevel: subtypes.reduce<Level>((m, st) => (st.level > m ? st.level : m), 1),
      vBanke: subtypes.reduce((sum, st) => sum + (perSubtype.get(st.id) ?? 0), 0),
    };
  });
}

/** Поиск подтипов по сюжетным словам и названию: «изюм», «баржа». */
export function poisk(text: string): Subtype[] {
  const needle = text.trim().toLowerCase();
  if (needle === '') {
    return [];
  }
  return SUBTYPES.filter(
    (st) =>
      st.title.toLowerCase().includes(needle) ||
      kodNaSayte(st.id).toLowerCase().includes(needle) ||
      st.keywords.some((k) => k.toLowerCase().includes(needle)),
  );
}

/** Карточки лайфхаков теории: подписи для ссылок из разбора. */
export const LIFEHACKS: Record<string, string> = {
  'root-guess': 'Подбор целого корня',
  'divide-equation': 'Сначала сократи уравнение',
  substitution: 'Замена переменной',
  'x-x-plus-d': 'Подбор двух множителей с известной разностью',
  'fast-count': 'Быстрый счёт',
  'dry-matter': 'Сухое вещество не меняется',
  'equal-mass-average': 'Равные массы — среднее арифметическое',
  'closing-speed': 'Скорость сближения на окружности',
};
