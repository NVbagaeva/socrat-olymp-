/**
 * Лёгкое о задачах №8: идентификаторы, банк, названия типов.
 *
 * Без генераторов и KaTeX: его берут блоки прогресса, закладки и
 * кабинет, которым незачем тянуть движок задач. Названия совпадают с
 * prototypes/*.ts — это сверяет самотест (selftest.ts).
 */

import { BANK } from './bank';
import type { Level } from './types';

/** Названия прототипов: формулы в $…$, набираются KaTeX там, где показываются. */
export const PROTOTYPE_NAMES: Readonly<Record<string, string>> = {
  '8.A': 'Степени с одним основанием',
  '8.B': 'Корни: квадрат и раскрытие скобок',
  '8.C': 'Степени с дробными показателями',
  '8.D': 'Степени с разными основаниями',
  '8.E': 'Корни разных степеней',
  '8.F': 'Квадрат суммы корней',
  '8.G': 'Корни из десятичных дробей',
  '8.H': 'Сумма и разность логарифмов',
  '8.I': 'Переход к новому основанию с добавкой',
  '8.J': 'Частное логарифмов',
  '8.K': 'Произведение логарифмов',
  '8.L': 'Логарифм с корнем',
  '8.M': 'Найти $\\sin \\alpha$ по $\\cos \\alpha$',
  '8.N': 'Найти $\\cos \\alpha$ по $\\sin \\alpha$',
  '8.O': 'Найти $\\operatorname{tg} \\alpha$',
  '8.P': 'Косинус двойного угла по $\\sin$ или $\\cos$',
  '8.Q': 'Табличные значения',
  '8.R': 'Синус двойного угла',
  '8.S': 'Косинус двойного угла',
  '8.T': 'Формулы приведения',
  '8.U': 'Тангенсы дополнительных углов',
  '8.V': 'Основное тождество с приведением',
  '8.W': 'Дроби с буквами',
  '8.X': 'Корни с буквами',
  '8.Y': 'Степени с буквами',
  '8.Z': 'Логарифмы с буквами',
};

export function taskId(prototype: string, seed: string, level: Level | null): string {
  return `${prototype}|${seed}|${level ?? 'any'}`;
}

/** Части идентификатора задачи. null — идентификатор не читается. */
export function parseTaskId(id: string): { prototype: string; seed: string; level: Level | null } | null {
  const [prototype, seed, level] = id.split('|');
  if (prototype === undefined || seed === undefined || seed === '' || PROTOTYPE_NAMES[prototype] === undefined) {
    return null;
  }
  return { prototype, seed, level: level === 'base' || level === 'advanced' ? level : null };
}

/** Тип задачи по идентификатору: прототип. */
export function prototypeOfTask(id: string): string {
  return id.split('|')[0] ?? id;
}

const BANK_IDS: ReadonlySet<string> = new Set(
  BANK.flatMap((entry) => entry.variants.map((v) => taskId(entry.prototype, v.seed, v.level))),
);

/** Сколько задач в банке №8. */
export const BANK_TOTAL = BANK_IDS.size;

/** Задача банка — по ней считается «решено X из 260». */
export function isBankTask(id: string): boolean {
  return BANK_IDS.has(id);
}
