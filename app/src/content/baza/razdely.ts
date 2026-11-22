/**
 * Разделы заданий базы: паспорта всех 21 задания, вкладки и общие
 * тексты. Наполнение вкладок (теория, опорные, тренажёр, карточки) —
 * в content/baza/zadaniya, по файлу на номер; пока его нет, вкладка
 * показывает PUSTO.
 */

import { OPORNYE } from '../opornye';
import type { RazdelTab } from '../vkladki';
import type { PasportZadaniya, TipOtveta, VkladkaBazy } from '@/lib/baza/types';

/** Вкладки задания базы — тот же набор, что у заданий профиля. */
export const VKLADKI_BAZY: readonly (RazdelTab & { id: VkladkaBazy })[] = [
  { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
  { id: 'kartochki', label: 'Карточки', tail: 'kartochki/', icon: 'cards' },
  { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
];

export function vkladkaBazy(id: VkladkaBazy): RazdelTab {
  const tab = VKLADKI_BAZY.find((t) => t.id === id);
  if (tab === undefined) throw new Error(`Нет вкладки ${id}`);
  return tab;
}

/** Как записывается ответ — строка для вкладки «О задании». */
export const OTVET_TEXT: Readonly<Record<TipOtveta, string>> = {
  chislo: 'Целое число или конечная десятичная дробь.',
  cifry: 'Последовательность цифр без пробелов и запятых — порядок важен.',
  nomera: 'Номера выбранных утверждений без пробелов и запятых — в любом порядке.',
  lyuboe: 'Число. Если подходящих чисел несколько, в ответе — любое одно из них.',
};

export const BAZA_TEXT = {
  badgeSoon: 'Скоро',
  format: {
    title: 'Формат задания',
    otvet: 'Ответ',
    ball: 'Балл',
    ballText: '1 балл за верный ответ',
    ekzamen: 'Экзамен',
    ekzamenText: '21 задание с кратким ответом, 180 минут, отметка от 2 до 5',
  },
  /* Вкладка без наполнения. */
  pusto: {
    title: 'Материал готовится',
    text: 'Раздел наполняется: теория под уровень базы, опорные задачи, тренажёр с подсказками и карточки. А пока можно заниматься другими заданиями.',
    action: 'К банку заданий',
  },
} as const;

/* Что нужно сделать в задании — по спецификации и демоверсии ФИПИ. */
export const PASPORTA: Readonly<Record<string, PasportZadaniya>> = {
  '1': {
    lead: 'Задача из жизни в одно-два действия: покупки, сдача, округление с избытком и с недостатком.',
    otvet: 'chislo',
  },
  '2': {
    lead: 'Соответствие между величинами и их возможными значениями.',
    otvet: 'cifry',
  },
  '3': { lead: 'Найти нужное значение по графику, диаграмме или таблице.', otvet: 'chislo' },
  '4': { lead: 'Подставить числа в готовую формулу и вычислить.', otvet: 'chislo' },
  '5': {
    lead: 'Классическое определение вероятности, противоположное событие, простые правила сложения и умножения.',
    otvet: 'chislo',
  },
  '6': {
    lead: 'Выбрать из таблицы вариант, который подходит под условия, или самый выгодный.',
    otvet: 'chislo',
  },
  '7': {
    lead: 'Соответствие между точками или промежутками графика и характеристиками функции и её производной.',
    otvet: 'cifry',
  },
  '8': { lead: 'Выбрать утверждения, которые следуют из данных условий.', otvet: 'nomera' },
  '9': { lead: 'Площадь фигуры на клетчатой бумаге или на плане.', otvet: 'chislo' },
  '10': {
    lead: 'Планиметрия в жизненной ситуации: участки, лестницы, колёса, столбы.',
    otvet: 'chislo',
  },
  '11': {
    lead: 'Объёмы и площади поверхности наглядных тел: бак, коробка, деталь.',
    otvet: 'chislo',
  },
  '12': {
    lead: 'Треугольники, четырёхугольники и окружность: углы, длины, площади.',
    otvet: 'chislo',
  },
  '13': {
    lead: 'Куб, призма, пирамида, цилиндр, конус, шар: объёмы и элементы.',
    otvet: 'chislo',
  },
  '14': { lead: 'Вычисления с обыкновенными и десятичными дробями.', otvet: 'chislo' },
  '15': { lead: 'Задача на проценты: скидка, наценка, доля.', otvet: 'chislo' },
  '16': {
    lead: 'Значение выражения: степени, корни, логарифмы, тригонометрия.',
    otvet: 'chislo',
  },
  '17': {
    lead: 'Линейные, квадратные, показательные, логарифмические и иррациональные уравнения.',
    otvet: 'chislo',
  },
  '18': {
    lead: 'Соответствие между неравенствами и их решениями или точками на числовой прямой.',
    otvet: 'cifry',
  },
  '19': { lead: 'Подобрать число по условиям: цифры, делимость, остатки.', otvet: 'lyuboe' },
  '20': { lead: 'Движение, работа, смеси и сплавы, проценты.', otvet: 'chislo' },
  '21': { lead: 'Нестандартная задача на рассуждение.', otvet: 'chislo' },
};

export function pasport(slug: string): PasportZadaniya {
  const p = PASPORTA[slug];
  if (p === undefined) throw new Error(`Нет паспорта задания базы №${slug}`);
  return p;
}
