/**
 * «Живая задача» на главной (components/landing/proba/Proba.tsx): одна
 * настоящая задача экзамена, которую решают прямо на странице, без
 * входа. Прототип — из открытого банка ФИПИ, раздел «Вероятность:
 * простая»; числа и тема меняются кнопкой — как в тренажёре, где у
 * каждой задачи свои числа.
 */

import { nomerRazdela } from '@/content/struktura';
import { href, ZADANIYA } from '@/lib/paths';

/** Номер хранения раздела, из которого взята задача. */
const RAZDEL = 4;

export interface NaborProby {
  /** Всего билетов. */
  vsego: number;
  /** В скольких есть вопрос по теме. */
  sTemoy: number;
  tema: string;
}

/* Наборы подобраны так, чтобы ответ был конечной десятичной дробью. */
export const NABORY: readonly NaborProby[] = [
  { vsego: 25, sTemoy: 10, tema: 'Неравенства' },
  { vsego: 50, sTemoy: 8, tema: 'Производная' },
  { vsego: 20, sTemoy: 7, tema: 'Логарифмы' },
  { vsego: 40, sTemoy: 6, tema: 'Тригонометрия' },
  { vsego: 25, sTemoy: 4, tema: 'Векторы' },
  { vsego: 50, sTemoy: 19, tema: 'Окружность' },
];

/** Число по-русски: с запятой. */
export const zapyataya = (x: number) => String(x).replace('.', ',');

export const otvetProby = (n: NaborProby) => (n.vsego - n.sTemoy) / n.vsego;

export const PROBA = {
  metka: 'Без регистрации',
  zagolovok: 'Решите задачу прямо здесь',
  lid: 'Так устроен тренажёр: условие, поле ответа и проверка сразу. Числа у каждой задачи свои.',
  istochnik: `Задание ${nomerRazdela(RAZDEL)} · открытый банк ФИПИ`,
  uslovie: (n: NaborProby) =>
    `В сборнике билетов по математике всего ${n.vsego} билетов, в ${n.sTemoy} из них встречается вопрос по теме «${n.tema}». Найдите вероятность того, что в случайно выбранном на экзамене билете школьнику не достанется вопроса по теме «${n.tema}».`,
  pole: 'Ваш ответ',
  podskazkaPolya: 'Число',
  proverit: 'Проверить',
  drugie: 'Другие числа',
  reshenie: 'Показать решение',
  pusto: 'Введите число, например 0,5.',
  verno: 'Верно!',
  neverno: 'Пока нет. Сначала найдите, в скольких билетах этого вопроса нет.',
  shagi: (n: NaborProby) => [
    `Билетов без вопроса по теме: ${n.vsego} − ${n.sTemoy} = ${n.vsego - n.sTemoy}.`,
    `Вероятность: ${n.vsego - n.sTemoy} : ${n.vsego} = ${zapyataya(otvetProby(n))}.`,
  ],
  dalshe: { tekst: 'Ещё такие задачи — в тренажёре', href: href(ZADANIYA, RAZDEL, 'trenazher') },
} as const;
