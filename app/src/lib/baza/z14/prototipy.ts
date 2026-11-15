/**
 * База, задание №14 «Действия с дробями»: прототипы задач тренажёра.
 *
 * Прототип — «задание» задачника (22 вида выражений), его задачи —
 * аналоги из vyrazheniya.ts. Генератор выбирает аналог по номеру,
 * условие — запись выражения, разбор по действиям строит razbor.ts,
 * независимый пересчёт ответа — proverka.ts.
 */

import type { GruppaBazy, Params, Prototip } from '../types';
import { proveritVyrazhenie } from './proverka';
import { razborVyrazheniya } from './razbor';
import { VYRAZHENIYA_14 } from './vyrazheniya';

export const GRUPPY_14: GruppaBazy[] = [
  { id: 'A', nazvanie: 'Обыкновенные дроби', znak: '\\dfrac{a}{b}', ton: 'blue' },
  { id: 'B', nazvanie: 'Многоэтажные дроби', znak: '\\dfrac{1}{1+\\frac{1}{n}}', ton: 'navy' },
  { id: 'C', nazvanie: 'Смешанные числа', znak: '2\\tfrac{1}{3}', ton: 'orange' },
  { id: 'D', nazvanie: 'Десятичные дроби', znak: '0{,}5', ton: 'green' },
  {
    id: 'E',
    nazvanie: 'Обыкновенные и десятичные вместе',
    znak: '\\tfrac{1}{2}+0{,}5',
    ton: 'terra',
  },
];

/** Номер прототипа (1…22) → группа и название. */
const VIDY: readonly { gruppa: string; title: string }[] = [
  { gruppa: 'A', title: 'Умножение и деление дробей' },
  { gruppa: 'A', title: 'Скобка с суммой или разностью дробей' },
  { gruppa: 'A', title: 'Дробь плюс произведение или частное' },
  { gruppa: 'A', title: 'Число умножить на скобку из трёх дробей' },
  { gruppa: 'B', title: 'Единица, делённая на сумму дробей' },
  { gruppa: 'C', title: 'Смешанное число минус целое' },
  { gruppa: 'C', title: 'Скобка со смешанными числами' },
  { gruppa: 'C', title: 'Сумма смешанных и целых чисел' },
  { gruppa: 'C', title: 'Целое число разделить на скобку' },
  { gruppa: 'D', title: 'Скобка, умножение и деление десятичных' },
  { gruppa: 'D', title: 'Произведение или частное и слагаемое' },
  { gruppa: 'D', title: 'Десятичные дроби под дробной чертой' },
  { gruppa: 'E', title: 'Дробь $\\frac{1}{n}$ умножить на десятичную' },
  { gruppa: 'E', title: 'Десятичную разделить на обыкновенную' },
  { gruppa: 'E', title: 'Смешанное число и произведение с десятичной' },
  { gruppa: 'E', title: 'Частное дробей и десятичная дробь' },
  { gruppa: 'B', title: 'Знаменатель $1+\\frac{1}{n}$' },
  { gruppa: 'E', title: 'Три слагаемых разного вида' },
  { gruppa: 'E', title: 'Вычитание отрицательного числа' },
  { gruppa: 'E', title: 'Скобка со смешанным числом и десятичной' },
  { gruppa: 'E', title: 'Отрицательные числа: дроби и десятичные' },
  { gruppa: 'E', title: 'Десятичную разделить на скобку' },
];

const nomer = (p: Params): number => {
  const v = p.i;
  if (typeof v !== 'number') throw new Error('нет номера аналога');
  return v;
};

function prototip(k: number): Prototip {
  const spisok = VYRAZHENIYA_14[k];
  const vid = VIDY[k];
  if (spisok === undefined || vid === undefined) throw new Error(`нет вида №${k + 1}`);
  const vyrazhenie = (p: Params): string => {
    const v = spisok[nomer(p)];
    if (v === undefined) throw new Error(`нет аналога ${nomer(p)}`);
    return v;
  };
  return {
    id: `P${String(k + 1).padStart(2, '0')}`,
    gruppa: vid.gruppa,
    title: vid.title,
    tip: 'chislo',
    zadach: spisok.length,
    generate(rng) {
      return { i: rng.int(0, spisok.length - 1) };
    },
    text(p) {
      const t = vyrazhenie(p)
        .replace(/\\frac/g, '\\dfrac')
        .replace(/(\d),(\d)/g, '$1{,}$2');
      return `Найдите значение выражения $${t}$.`;
    },
    solve(p) {
      return razborVyrazheniya(vyrazhenie(p), nomer(p) + k);
    },
    proverka(p) {
      return proveritVyrazhenie(vyrazhenie(p));
    },
  };
}

export const PROTOTIPY_14: Prototip[] = VYRAZHENIYA_14.map((_, k) => prototip(k));
