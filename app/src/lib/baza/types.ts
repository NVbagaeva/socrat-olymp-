/**
 * Базовая математика: типы данных раздела задания.
 *
 * Раздел базы описывается данными (content/baza), а не своей разметкой:
 * оболочка, вкладки и экраны у всех 21 задания общие (components/baza).
 * Вкладка, для которой данных ещё нет, показывает «Материал готовится».
 */

import type { TipOtveta } from '@/lib/otvet/tipy';

export type { TipOtveta };

/** Идентификаторы вкладок раздела базы. */
export type VkladkaBazy =
  'o-zadanii' | 'teoriya' | 'kartochki' | 'opornye' | 'trenazher' | 'generator';

/** Паспорт задания: что проверяет и как записывается ответ. */
export interface PasportZadaniya {
  /** Одна строка под заголовком: что нужно сделать в задании. */
  lead: string;
  /** Основной тип ответа номера. */
  otvet: TipOtveta;
}
