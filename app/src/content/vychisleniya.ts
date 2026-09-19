/**
 * Тексты раздела задания №8 «Вычисления и преобразования».
 *
 * Здесь только то, что читается глазами: заголовок, подпись, вкладки,
 * меню материалов, названия и формулы навыков на карточках. Текста
 * теории нет намеренно — его пишет автор, вкладка честно говорит
 * «Материал готовится».
 */

import type { TutorMaterial } from './sections';

export interface VychisleniyaTab {
  id: string;
  label: string;
  /** Часть адреса после /zadaniya/8/. Пусто — сам адрес раздела. */
  tail: string;
}

export const VYCHISLENIYA = {
  no: '08',
  slug: '8',
  title: 'Вычисления и преобразования',
  lead: 'Пять групп прототипов: степени и корни, логарифмы, тригонометрия по четверти, тригонометрические преобразования и буквенные выражения. Числа в каждой задаче свои.',
  badge: 'Базовый уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/' },
    { id: 'podgotovka', label: 'Подготовительные задачи', tail: 'podgotovka/' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/' },
    { id: 'generator', label: 'Генератор', tail: 'generator/' },
  ] as readonly VychisleniyaTab[],
  /** Вкладка «О задании»: короткое описание раздела и его групп. */
  about: {
    title: 'О задании',
    lead: 'В задании №8 нужно найти значение числового или буквенного выражения: со степенями и корнями, с логарифмами, с тригонометрическими функциями или с подстановкой чисел в формулу.',
    groupsTitle: 'Навыки раздела',
  },
  /* Те же две карточки, что у №4, №5 и №12, и ведут они на те же
     файлы ученика: их собирает и кладёт в ветку workflow «PDF 8».
     Файл учителя с ответами в репозитории не лежит — только архивом
     запуска. */
  tutors: {
    title: 'Для репетиторов',
    lead: 'Материалы для занятий по теме «Вычисления и преобразования».',
    items: [
      {
        id: 'workbook',
        title: 'Рабочая тетрадь для репетиторов',
        lead: 'Готовые материалы для занятий',
        icon: 'doc',
        file: '/materials/zadanie-8/zadanie-8-vychisleniya-uchenik.pdf',
      },
      {
        id: 'pdf',
        title: 'PDF-практикум',
        lead: 'Все задания по теме в одном файле',
        icon: 'pdf',
        file: '/materials/zadanie-8/zadanie-8-vychisleniya-uchenik-chb.pdf',
      },
    ] as TutorMaterial[],
  },
} as const;

export interface AboutGroup {
  id: string;
  title: string;
  lead: string;
}

/** Пять групп прототипов задания №8: заголовок и описание в одну строку. */
export const ABOUT_GROUPS: AboutGroup[] = [
  { id: 'I', title: 'Степени и корни', lead: 'Свойства степеней, корни разных степеней, раскрытие скобок' },
  { id: 'II', title: 'Логарифмы', lead: 'Определение, сумма и разность, переход к новому основанию' },
  { id: 'III', title: 'Тригонометрия: значения по четверти', lead: 'sin, cos, tg по данному значению и четверти' },
  { id: 'IV', title: 'Тригонометрия: преобразования', lead: 'Табличные значения, формулы двойного угла и приведения' },
  { id: 'V', title: 'Буквенные выражения', lead: 'Формулы сокращённого умножения, свойства степеней и логарифмов с буквами' },
];

/** Формула на карточке навыка, в записи TeX: по одной на навык. */
export const SKILL_FORMULA: Record<string, string> = {
  S1: 'a^{m} \\cdot a^{n} = a^{m+n}',
  S2: '\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{ab}',
  S3: '\\log_a x + \\log_a y = \\log_a xy',
  S4: '\\log_a b = \\dfrac{\\log_c b}{\\log_c a}',
  S5: '\\sin^2\\alpha + \\cos^2\\alpha = 1',
  S6: '\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}',
  S7: '\\sin 30^\\circ = \\dfrac{1}{2}',
  S8: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha',
  S9: '\\sin(90^\\circ - \\alpha) = \\cos\\alpha',
  S10: 'a^2 - b^2 = (a - b)(a + b)',
  S11: '\\sqrt{a}\\cdot\\sqrt{b} = \\sqrt{ab}',
};

/** Заголовок окна браузера: «Вкладка · Вычисления и преобразования — Будет на ЕГЭ». */
export function vychisleniyaTitle(tab: string): string {
  return `${tab} · ${VYCHISLENIYA.title} — Будет на ЕГЭ`;
}

/** Подписи вкладки подготовки. */
export const prep8Page = {
  title: 'Подготовительные задачи',
  lead: 'Одно свойство — одно действие',
  allLabel: 'Все блоки',
  again: 'Ещё вариант',
};
