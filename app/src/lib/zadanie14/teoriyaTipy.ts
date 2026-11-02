/**
 * Схема теории №14: глава — пункты, пункт — блоки подряд.
 *
 * Правило раздела: каждая рамка («Важно», «Запомни», «Вывод»,
 * «Лайфхак») идёт вместе с разобранным примером — у блока `ramka`
 * поле `primer` обязательно. Все формулы — KaTeX в `$…$`.
 */

import type { KrugSpec } from './krug';
import type { Promezhutok, Seriya } from './ugol';

/** Рисунок окружности: готовая сцена, серии пункта а или отбор пункта б. */
export type Risunok14 =
  | { vid: 'krug'; spec: KrugSpec; podpis?: string }
  | { vid: 'serii'; serii: Seriya[]; podpis?: string }
  | { vid: 'otbor'; serii: Seriya[]; promezhutok: Promezhutok; podpis?: string }
  /** Интерактив: точку можно тащить. */
  | { vid: 'zhivoy'; podpis?: string }
  /** Интерактив: деление окружности по шагам (четверти → восьмые → двенадцатые). */
  | { vid: 'delenie'; podpis?: string }
  /** Интерактив: сечение sin x = a / cos x = a по табличным значениям. */
  | { vid: 'sechenie'; funkciya: 'sin' | 'cos'; podpis?: string }
  /** Лайфхак: таблица значений через √0/2 … √4/2 по шагам. */
  | { vid: 'tablica-korni' };

/** Разобранный пример. */
export interface Primer14 {
  /** Условие (строка с $…$). */
  uslovie: string;
  /** Шаги: что делаем и зачем + формула. */
  shagi: string[];
  /** Рисунок после шагов. */
  risunok?: Risunok14;
  /** Ответ (строка с $…$). */
  otvet?: string;
}

export type BlokTeorii14 =
  | { vid: 'p'; text: string }
  /** Выносная формула, TeX без долларов. */
  | { vid: 'formula'; tex: string }
  | { vid: 'spisok'; punkty: string[]; numeraciya?: boolean }
  | {
      vid: 'ramka';
      ton: 'vazhno' | 'zapomni' | 'vyvod' | 'layfhak';
      /** Своя метка: «Вывод», «Запомни, это переписываем в решение». */
      metka?: string;
      text: string;
      primer: Primer14;
    }
  | { vid: 'primer'; primer: Primer14; title?: string }
  | { vid: 'risunok'; risunok: Risunok14 }
  /** Баннер «грустный котик» с кнопкой к макетам окружности. */
  | { vid: 'kotik' }
  /** Таблица: заголовки и строки (строки с $…$). */
  | { vid: 'tablica'; zagolovki: string[]; stroki: string[][] };

export interface Punkt14 {
  /** id якоря: «t-0-sistema». */
  id: string;
  /** Номер на экране: «3.0». */
  no: string;
  title: string;
  bloki: BlokTeorii14[];
}

export interface Glava14 {
  id: 'trig' | 'pokaz' | 'log' | 'irr' | 'komb';
  title: string;
  skoro?: boolean;
  lead?: string;
  punkty: Punkt14[];
}
