/**
 * Навыки задания №8 — наборы прототипов для конфигуратора тренажёра.
 *
 * Навык — это набор прототипов одной формулы или одного приёма.
 * Названия утверждены заказчиком и правятся только здесь. Уровни
 * общие для раздела: базовый — один шаг, повышенный — два и более.
 */

import type { Group, Level } from './types';

export interface Skill {
  /** Идентификатор: S1 … S11. */
  id: string;
  group: Group;
  nazvanie: string;
  /** Коды прототипов таксономии. */
  prototypes: string[];
}

export interface GroupInfo {
  id: Group;
  nazvanie: string;
}

export const GROUPS: GroupInfo[] = [
  { id: 'I', nazvanie: 'Степени и корни' },
  { id: 'II', nazvanie: 'Логарифмы' },
  { id: 'III', nazvanie: 'Тригонометрия: значения по четверти' },
  { id: 'IV', nazvanie: 'Тригонометрия: преобразования' },
  { id: 'V', nazvanie: 'Буквенные выражения' },
];

export const SKILLS: Skill[] = [
  { id: 'S1', group: 'I', nazvanie: 'Свойства степеней', prototypes: ['8.A', '8.C', '8.D'] },
  { id: 'S2', group: 'I', nazvanie: 'Свойства корней', prototypes: ['8.B', '8.E', '8.F', '8.G'] },
  { id: 'S3', group: 'II', nazvanie: 'Сумма и разность логарифмов', prototypes: ['8.H', '8.L'] },
  { id: 'S4', group: 'II', nazvanie: 'Новое основание логарифма', prototypes: ['8.I', '8.J', '8.K'] },
  { id: 'S5', group: 'III', nazvanie: 'Синус и косинус по четверти', prototypes: ['8.M', '8.N'] },
  { id: 'S6', group: 'III', nazvanie: 'Тангенс и двойной угол', prototypes: ['8.O', '8.P'] },
  { id: 'S7', group: 'IV', nazvanie: 'Табличные значения', prototypes: ['8.Q'] },
  { id: 'S8', group: 'IV', nazvanie: 'Формулы двойного угла', prototypes: ['8.R', '8.S'] },
  { id: 'S9', group: 'IV', nazvanie: 'Формулы приведения', prototypes: ['8.T', '8.U', '8.V'] },
  { id: 'S10', group: 'V', nazvanie: 'Буквенные: дроби и степени', prototypes: ['8.W', '8.Y'] },
  { id: 'S11', group: 'V', nazvanie: 'Буквенные: корни и логарифмы', prototypes: ['8.X', '8.Z'] },
];

export interface LevelInfo {
  id: Level;
  nazvanie: string;
  lead: string;
}

export const LEVELS: LevelInfo[] = [
  { id: 'base', nazvanie: 'Базовая', lead: 'Один шаг преобразования' },
  { id: 'advanced', nazvanie: 'Повышенная', lead: 'Два шага или неочевидное основание' },
];

export function skillById(id: string): Skill | undefined {
  return SKILLS.find((skill) => skill.id === id);
}

/** Навык, в который входит прототип. */
export function skillOfPrototype(prototypeId: string): Skill | undefined {
  return SKILLS.find((skill) => skill.prototypes.includes(prototypeId));
}
