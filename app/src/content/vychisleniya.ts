/**
 * Тексты раздела задания №8 «Вычисления и преобразования».
 *
 * Здесь только то, что читается глазами: заголовок, подпись, вкладки,
 * меню материалов, подписи опорных задач. Тексты вкладок «О задании» и
 * «Тренажёр» — в content/vychisleniya8/. Текста теории нет намеренно —
 * его пишет автор, вкладка честно говорит «Материал готовится».
 */

import { OPORNYE } from './opornye';
import type { RazdelTab } from './vkladki';
import { taskName } from './tasks';
import type { TutorMaterial } from './sections';

import { assetUrl } from '@/lib/assetUrl';
/* Вкладка описывается общим типом: лента у всех заданий одна. */
export type VychisleniyaTab = RazdelTab;

export const VYCHISLENIYA = {
  no: '08',
  slug: '8',
  title: taskName('8'),
  lead: 'Пять групп прототипов: степени и корни, логарифмы, тригонометрия по четверти, тригонометрические преобразования и буквенные выражения. Числа в каждой задаче свои.',
  badge: 'Базовый уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly VychisleniyaTab[],
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
        file: assetUrl('/materials/zadanie-8/zadanie-8-vychisleniya-uchenik.pdf'),
      },
      {
        id: 'pdf',
        title: 'PDF-практикум',
        lead: 'Все задания по теме в одном файле',
        icon: 'pdf',
        file: assetUrl('/materials/zadanie-8/zadanie-8-vychisleniya-uchenik-chb.pdf'),
      },
    ] as TutorMaterial[],
  },
} as const;

/** Заголовок окна браузера: «Вкладка · Вычисления и преобразования — Будет на ЕГЭ». */
export function vychisleniyaTitle(tab: string): string {
  return `${tab} · ${VYCHISLENIYA.title} — Будет на ЕГЭ`;
}

/** Подписи вкладки опорных задач. */
export const prep8Page = {
  title: OPORNYE.title,
  lead: 'Одно свойство — одно действие',
  allLabel: 'Все блоки',
  again: 'Ещё вариант',
};
