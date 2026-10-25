/**
 * Каталог банка для кабинета: номера 1–20 и прототипы открытых заданий.
 * Файл katalog.json собирает pnpm build:kabinet-catalog из кода движков;
 * те же строки лежат в базе (supabase/seed/kabinet_katalog.sql).
 */

import katalog from '@/content/kabinet/katalog.json';

export interface CatalogPrototype {
  /** «<номер>:<id в движке>»: «7:P01», «12:12Q.A». */
  code: string;
  title: string;
}

export interface CatalogTask {
  no: number;
  name: string;
  ready: boolean;
  prototypes: CatalogPrototype[];
}

export const catalogTasks: readonly CatalogTask[] = katalog.tasks;

const sections: Record<string, string> = katalog.sections;

/** Подпись раздела тренажёра: «12:linear» → «№12 · Линейная функция». */
export function scopeTitle(scope: string): string {
  const no = Number(scope.split(':')[0]);
  const task = catalogTask(no);
  const head = task === undefined ? scope : `${taskLabel(no)} · ${task.name}`;
  const section = sections[scope];
  return section === undefined ? head : `${head} · ${section}`;
}

export function catalogTask(no: number): CatalogTask | undefined {
  return catalogTasks.find((task) => task.no === no);
}

export function prototypeTitle(code: string | null): string | null {
  if (code === null) {
    return null;
  }
  const no = Number(code.split(':')[0]);
  return catalogTask(no)?.prototypes.find((p) => p.code === code)?.title ?? code;
}

/** «№07»: номер так, как он написан в банке. */
export function taskLabel(no: number): string {
  return `№${String(no).padStart(2, '0')}`;
}

export { taskHrefByNo, taskNoOfScope, trainerHref } from './scope';
