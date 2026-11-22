/**
 * Опорные задачи №18 в порядке тем ключевых схем. Первые задачи
 * составлены для сайта в духе задания 18 ЕГЭ; задачи из novye.ts —
 * условия из курса подготовки, решения написаны заново (istochnik). Чертежи —
 * lib/zadanie18/opornye, проверка — pnpm test:opornye-18.
 */

import { OP18_KAS_OKR, OP18_KAS_SEK, OP18_OPIS_TRAP } from './kasatelnye';
import { OP18_DVE_VERSHINY, OP18_KVADRAT, OP18_TREZUBEC } from './okruzhnost';
import { OP18_BISS_MED, OP18_MENELAY } from './otnosheniya';
import { OP18_RASSTOYANIYA, OP18_TRI_UGLA } from './ploshchadi';
import {
  OP18_BISS_SRED,
  OP18_CHEREZ_CENTR,
  OP18_DIAG_TRAP,
  OP18_DVE_OKR,
  OP18_KAS_EF,
  OP18_KV_GIP_OTN,
  OP18_KVADRAT_PER,
  OP18_KVADRATY,
  OP18_SER_VYS,
  OP18_VNEVPIS,
  OP18_VPIS_KLM,
  OP18_VPIS_LMN,
  OP18_VYS_PERP,
} from './novye';
import type { Opornaya18 } from './tipy';
import { OP18_BABOCHKA, OP18_CHETYRE, OP18_PERP_DIAG } from './trapeciya';
import { OP18_BISSEKTRISA, OP18_MEDIANA, OP18_VYSOTY } from './treugolnik';
import { nomerRazdela } from '@/content/struktura';

export type { Opornaya18, SkhemaVZadache } from './tipy';

/* Порядок — по темам ключевых схем; номер задачи — её место в списке. */
const PO_TEMAM: readonly Opornaya18[] = [
  OP18_VYSOTY,
  OP18_VYS_PERP,
  OP18_BISSEKTRISA,
  OP18_BISS_SRED,
  OP18_MEDIANA,
  OP18_KVADRATY,
  OP18_SER_VYS,
  OP18_TREZUBEC,
  OP18_KVADRAT,
  OP18_KV_GIP_OTN,
  OP18_DVE_VERSHINY,
  OP18_DVE_OKR,
  OP18_CHEREZ_CENTR,
  OP18_VPIS_LMN,
  OP18_KAS_SEK,
  OP18_OPIS_TRAP,
  OP18_KAS_OKR,
  OP18_KAS_EF,
  OP18_VPIS_KLM,
  OP18_VNEVPIS,
  OP18_KVADRAT_PER,
  OP18_BABOCHKA,
  OP18_CHETYRE,
  OP18_PERP_DIAG,
  OP18_DIAG_TRAP,
  OP18_MENELAY,
  OP18_BISS_MED,
  OP18_TRI_UGLA,
  OP18_RASSTOYANIYA,
];

export const OPORNYE_18: readonly Opornaya18[] = PO_TEMAM.map((o, i) => ({ ...o, no: i + 1 }));

export function opornaya18(id: string): Opornaya18 | undefined {
  return OPORNYE_18.find((o) => o.id === id);
}

/** Подписи вкладки и страницы задачи. */
export const OPORNYE_18_UI = {
  lead: `Задачи в формате задания ${nomerRazdela('planimetriya-dokazatelstvo')}: в пункте а) нужно доказать, в пункте б) — найти. Каждая собрана из ключевых схем: на странице задачи — живой чертёж, схемы, которые в ней спрятаны, и решение по шагам с подсветкой на чертеже.`,
  sostavleno: 'Составлено для сайта',
  sostavlenoPodrobno: `Задачи составлены для сайта в формате задания ${nomerRazdela('planimetriya-dokazatelstvo')} профильного ЕГЭ; утверждение а) и ответ б) каждой проверены вычислением.`,
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
  izKursa: 'Условие из курса подготовки, решение — наше',
  variaciya: (no: number) => `Вариация к задаче ${no}`,
  podskazki: 'Подсказки',
  podskazkiPodskazka: 'Ответь на вопрос сам, потом сверься.',
  podskazkaOtvet: 'Ответ на вопрос',
  oshibki: 'Типичные ошибки',
  otmetka: 'Получилось?',
  otmetkaPodskazka:
    'Отметь честно — отметка появится на плитке задачи, и нерешённые будет легко найти.',
  reshil: 'Решил',
  neReshil: 'Не решил',
  otmechenoReshil: 'Отмечено: решил.',
  otmechenoNe: 'Отмечено: не решил — вернись к задаче позже.',
  statusReshena: 'Решена',
  statusNe: 'Не решена',
  reshenoIz: (n: number) => `из ${n} задач решено`,
  reshenoLabel: (r: number, n: number) => `Опорные задачи: решено ${r} из ${n}`,
  sbros: 'Сбросить отметки',
  sbrosVopros: `Сбросить отметки всех опорных задач №${nomerRazdela('planimetriya-dokazatelstvo')}?`,
} as const;
