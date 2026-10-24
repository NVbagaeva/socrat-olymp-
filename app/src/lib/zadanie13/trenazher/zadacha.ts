/**
 * Задача тренажёра №13: задача движка в закрытом виде плюс данные
 * режима «С оформлением».
 *
 * Модуль подгружается при старте тренировки (движок задач тяжёлый).
 * Оформление — три шага перед ответом:
 *  1. «Какая это схема?» — выбор из четырёх названий;
 *  2. первая строка таблицы — клетки, которые считаются по условию;
 *  3. шаги решения — остальные вопросы подсказки (уравнение, формула).
 * Всё оформление закрыто отпечатком ответа, как подсказки и разбор.
 */

import { katex } from '../../graph/katex';
import { generate } from '../generate';
import { chislo } from '../html';
import { hintType } from '../proto/common';
import { sealTask13, shagiHtml, type ShagHtml, type Zadacha13Sealed } from '../opornye/seal';
import { sealAnswer, sealText } from '../secret';
import { TABLE_FIELDS, TABLE_HEAD } from '../tablica';
import type { PeriodRow, Task13, TypeCode } from '../types';
import type { ZadachaPlan13 } from './plan';

export interface Zadacha13T extends Zadacha13Sealed {
  type: TypeCode;
  istochnik: 'bank' | 'new';
  vid: 'zadachi' | 'tip';
  /** Оформление: JSON Oformlenie13, закрыт отпечатком; null — у «Определи тип». */
  oformlenie: string | null;
}

export interface Kletka13 {
  title: string;
  /** Клетка дана или её не посчитать по условию: готовая разметка. */
  html: string | null;
  /** Клетку считает ученик: отпечаток числа. */
  seal: string | null;
  /** Верное значение для кнопки «Показать»; оформление и так закрыто отпечатком. */
  otvet: string | null;
}

export interface Stroka13 {
  /** «Месяц 1», «Год 2027». */
  label: string;
  kletki: Kletka13[];
}

export interface Oformlenie13 {
  shema: ShagHtml;
  stroka: Stroka13 | null;
  shagi: ShagHtml[];
}

/** Числа из текста условия: «1 200 000», «12,5», «10 %». */
export function chislaUsloviya(text: string): number[] {
  const flat = text.replace(/(\d)[\s   ]+(?=\d{3}\b)/g, '$1');
  return [...flat.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
}

const est = (list: readonly number[], x: number) => list.some((y) => Math.abs(y - x) < 1e-9);

/** Число, которое ученик посчитает и введёт: не больше двух знаков после запятой. */
function schitaemoe(x: number): boolean {
  return Number.isFinite(x) && Math.abs(Math.round(x * 100) - x * 100) < 1e-6;
}

function tex(x: number): string {
  return katex.renderToString(chislo(x), { throwOnError: true });
}

const NEIZVESTNO = '?';

/**
 * Первая строка таблицы: что дано (долг на начало, известный платёж),
 * что ученик считает сам (сумма изменения долга, переплата, долг с
 * процентами, долг на конец). Нет в условии суммы кредита или ставки —
 * строки нет: заполнить её по условию нельзя.
 */
function pervayaStroka(t: Task13): Stroka13 | null {
  const m = t.tableModel;
  const row: PeriodRow | undefined = m.rows[0];
  if (row === undefined) return null;
  const chisla = chislaUsloviya(t.condition);
  if (!est(chisla, row.start) || !est(chisla, row.rate)) return null;
  /* Ищут саму сумму кредита или ставку: число в условии совпало случайно. */
  if (est([row.start, row.rate], t.answer)) return null;
  const h = TABLE_HEAD[m.scheme];
  const fields = TABLE_FIELDS[m.scheme];
  const platezhDan = est(chisla, Math.abs(row.payment));
  const kletki = fields.map((f, i): Kletka13 => {
    const title = h.cols[i] ?? '';
    const v = row[f] as number;
    const dano = f === 'start' || (f === 'payment' && platezhDan);
    const neizvestno =
      m.scheme !== 'dif' && ((f === 'payment' && !platezhDan) || (f === 'end' && !platezhDan));
    if (dano) return { title, html: tex(v), seal: null, otvet: null };
    if (neizvestno) return { title, html: NEIZVESTNO, seal: null, otvet: null };
    if (!schitaemoe(v)) return { title, html: tex(v), seal: null, otvet: null };
    return { title, html: null, seal: sealAnswer(v), otvet: tex(v) };
  });
  if (!kletki.some((k) => k.seal !== null)) return null;
  return { label: `${h.period[m.period]} ${m.labels[0] ?? '1'}`, kletki };
}

function oformlenie(t: Task13, no: number): Oformlenie13 {
  const [first, ...rest] = t.hints;
  const estShema = first !== undefined && first.question === 'Какая это схема?';
  const [shema] = shagiHtml([estShema && first ? first : hintType(t.type, no)]);
  return {
    shema: shema as ShagHtml,
    stroka: pervayaStroka(t),
    shagi: shagiHtml(estShema ? rest : t.hints),
  };
}

export function sobratZadachu13(plan: ZadachaPlan13, no: number): Zadacha13T {
  const t = generate(plan.prototypeId, plan.seed);
  const sealed = sealTask13(t, plan.vid, no);
  return {
    ...sealed,
    type: t.type,
    istochnik: plan.istochnik,
    vid: plan.vid,
    oformlenie:
      plan.vid === 'tip' ? null : sealText(JSON.stringify(oformlenie(t, no)), sealed.seal),
  };
}
