/**
 * Разделы и прототипы №3 для экрана генератора — собираются на сборке.
 *
 * В браузер уходят только названия, число задач открытого банка и
 * какие варианты из него: ни условий, ни ответов. Сами задачи генератор
 * грузит при первой сборке листа — тем же файлом, что «Собрать
 * вариант» (/variant/dannye/z03.json, lib/variant/data/z03.ts).
 */

import { typeset } from '../../tex';
import { RAZDELY } from '../index';
import { FIPI_3 } from '../fipi';

export interface Prototip3 {
  /** «P03-19». */
  id: string;
  /** Название без разметки: «Объём параллелепипеда по трём рёбрам». */
  title: string;
  /** Название, набранное KaTeX, если в нём формулы. */
  titleHtml?: string;
  /** Номера вариантов из открытого банка ФИПИ. */
  bank: number[];
  /** Все номера вариантов прототипа. */
  varianty: number[];
}

export interface Razdel3 {
  /** «prizma». */
  id: string;
  /** «II». */
  nomer: string;
  nazvanie: string;
  prototipy: Prototip3[];
}

/** Название без формул — для подписи кнопки и сводки. */
function bezFormul(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_, tex: string) =>
    tex
      .replace(/\\[a-z]+\s*/gi, '')
      .replace(/[{}_^]/g, '')
      .trim(),
  );
}

export function info3(): Razdel3[] {
  return RAZDELY.map((r) => ({
    id: r.slug,
    nomer: r.nomer,
    nazvanie: r.nazvanie,
    prototipy: r.prototipy.map((p) => ({
      id: p.id,
      title: bezFormul(p.nazvanie),
      ...(p.nazvanie.includes('$') ? { titleHtml: typeset(p.nazvanie) } : {}),
      bank: p.varianty.filter((v) => FIPI_3[`${p.id}#${v.n}`] !== undefined).map((v) => v.n),
      varianty: p.varianty.map((v) => v.n),
    })),
  }));
}
