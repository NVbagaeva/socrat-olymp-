/**
 * Подготовительные задачи: мост между конфигом навыков и движком.
 *
 * Единственное место, где приложение разговаривает с graph/. Экраны
 * получают готовые значения пропсами и про движок ничего не знают.
 */

import { prepSkills, type PrepSkill, type PrepSkillId } from '@/content/prepSkills';
import { demoPrepSolved } from '@/data/demo';
import { prep } from '@/lib/graph/data/index.js';

interface GraphSet {
  id: string;
  tasks: unknown[];
}

/** Сколько задач в наборе. Число берётся из данных, а не из конфига. */
function setSize(setId: string): number {
  const found = (prep as unknown as GraphSet[]).find((item) => item.id === setId);
  return found ? found.tasks.length : 0;
}

export interface PrepSkillView {
  skill: PrepSkill;
  /** Сколько задач в наборе. */
  total: number;
  /** Сколько решено — витринное значение из demo.ts. */
  solved: number;
  /** Доля решённого, 0–100. */
  percent: number;
}

export interface PrepOverview {
  skills: PrepSkillView[];
  solved: number;
  total: number;
  percent: number;
}

function share(solved: number, total: number): number {
  return total === 0 ? 0 : (solved / total) * 100;
}

/**
 * Состояние всех четырёх навыков разом.
 *
 * Общее число задач и проценты считаются здесь: отдельными
 * константами они не заданы нигде, поэтому разойтись с данными
 * им не на чем.
 */
export function prepOverview(): PrepOverview {
  const skills = prepSkills.map((skill) => {
    const total = setSize(skill.setId);
    /* Решено не может быть больше, чем есть: витринное число живёт
       отдельно от наборов и при их правке могло бы обогнать длину. */
    const solved = Math.min(demoPrepSolved[skill.id], total);
    return { skill, total, solved, percent: share(solved, total) };
  });

  const solved = skills.reduce((sum, item) => sum + item.solved, 0);
  const total = skills.reduce((sum, item) => sum + item.total, 0);
  return { skills, solved, total, percent: share(solved, total) };
}

/** Навык по части адреса. */
export function findPrepSkill(id: string): PrepSkill | undefined {
  return prepSkills.find((skill) => skill.id === id);
}

/** Адреса тренажёров навыков для статического экспорта. */
export function prepSkillIds(): PrepSkillId[] {
  return prepSkills.map((skill) => skill.id);
}
