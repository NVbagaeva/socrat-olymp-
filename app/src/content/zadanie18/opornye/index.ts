/**
 * Опорные задачи №18 в порядке тем ключевых схем. Задачи составлены
 * для сайта в духе задания 18 ЕГЭ (не взяты из сборников). Чертежи —
 * lib/zadanie18/opornye, проверка — pnpm test:opornye-18.
 */

import { OP18_KAS_OKR, OP18_KAS_SEK, OP18_OPIS_TRAP } from './kasatelnye';
import { OP18_DVE_VERSHINY, OP18_KVADRAT, OP18_TREZUBEC } from './okruzhnost';
import { OP18_BISS_MED, OP18_MENELAY } from './otnosheniya';
import { OP18_RASSTOYANIYA, OP18_TRI_UGLA } from './ploshchadi';
import type { Opornaya18 } from './tipy';
import { OP18_BABOCHKA, OP18_CHETYRE, OP18_PERP_DIAG } from './trapeciya';
import { OP18_BISSEKTRISA, OP18_MEDIANA, OP18_VYSOTY } from './treugolnik';

export type { Opornaya18, SkhemaVZadache } from './tipy';

export const OPORNYE_18: readonly Opornaya18[] = [
  OP18_VYSOTY,
  OP18_BISSEKTRISA,
  OP18_MEDIANA,
  OP18_TREZUBEC,
  OP18_KVADRAT,
  OP18_DVE_VERSHINY,
  OP18_KAS_SEK,
  OP18_OPIS_TRAP,
  OP18_KAS_OKR,
  OP18_BABOCHKA,
  OP18_CHETYRE,
  OP18_PERP_DIAG,
  OP18_MENELAY,
  OP18_BISS_MED,
  OP18_TRI_UGLA,
  OP18_RASSTOYANIYA,
];

export function opornaya18(id: string): Opornaya18 | undefined {
  return OPORNYE_18.find((o) => o.id === id);
}

/** Подписи вкладки и страницы задачи. */
export const OPORNYE_18_UI = {
  lead: 'Задачи в формате задания 18: в пункте а) нужно доказать, в пункте б) — найти. Каждая собрана из ключевых схем: на странице задачи — живой чертёж, схемы, которые в ней спрятаны, и решение по шагам с подсветкой на чертеже.',
  sostavleno: 'Составлено для сайта',
  sostavlenoPodrobno:
    'Задачи составлены для сайта в формате задания 18 профильного ЕГЭ; утверждение а) и ответ б) каждой проверены вычислением.',
  kakRabotat: 'Как работать с задачей',
  shagi: [
    'Прочитай условие и найди на чертеже знакомые схемы',
    'Реши сам: сначала а), потом б)',
    'Открывай решение по шагу и сверяйся',
  ],
  otkryt: 'Решать',
  nazad: 'Все опорные задачи',
  uslovie: 'Условие',
  skhemy: 'Какие схемы здесь',
  skhemyPodskazka: 'Узнай их на чертеже — с них начинается решение.',
  reshenieA: 'Решение пункта а)',
  reshenieB: 'Решение пункта б)',
  snachalaSam:
    'Сначала попробуй сам. Если б) не выходит без а) — прими утверждение а) как данное: так можно и на экзамене.',
  pokazatShag: 'Показать первый шаг',
  sleduyushchiy: 'Следующий шаг',
  vse: 'Показать всё',
  skryt: 'Скрыть решение',
  shag: (i: number, n: number) => `Шаг ${i} из ${n}`,
  shagPodskazka: 'Нажми на шаг — его подсветка вернётся на чертёж.',
  otvet: 'Ответ',
  pokazatOtvet: 'Показать ответ',
  podskazkaChertezha:
    'Чертёж построен по данным пункта б). «Случайное положение» показывает другую фигуру из условия — утверждение а) верно и для неё.',
  podskazkaTyani:
    'Тяни вершины: фигура меняется, а утверждение а) остаётся верным. «Сбросить» вернёт данные пункта б).',
  predydushchaya: 'Предыдущая задача',
  sleduyushchaya: 'Следующая задача',
  zadacha: (no: number) => `Задача ${no}`,
} as const;
