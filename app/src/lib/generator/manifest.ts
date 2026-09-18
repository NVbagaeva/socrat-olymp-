/**
 * Манифест генератора — единственный источник чисел и названий для
 * окна выбора типа функции и вкладки «Генератор».
 *
 * Считается из данных движка graph/ и списка семейств в
 * data/functionTypes.ts; ни одного числа и ни одного названия здесь
 * не задано. Сама сборка — в manifest.js: модуль чистый, и тот же
 * код печатает таблицу из Node (scripts/print-generator-manifest.mjs).
 */

import { prep, prototypes } from '@/lib/graph/data/index.js';
import { functionTypes, type FunctionTypeId } from '@/data/functionTypes';
import { buildManifest } from './manifest.js';

export type SkillKind = 'prep' | 'prototype';

/** Навык — набор движка. Всё, что о нём известно, взято из набора. */
export interface ManifestSkill {
  /** Идентификатор набора: P12-1 … или 12.A …. */
  id: string;
  kind: SkillKind;
  title: string;
  subtitle: string;
  /** Сколько задач в наборе — длина tasks. */
  count: number;
  /** Уровни сложности, встреченные у задач набора. Пусто — поля нет. */
  levels: string[];
  levelCounts: Record<string, number>;
  answerRules: string[];
  answerTypes: string[];
  hasChart: boolean;
  /** Семейство кривой по данным набора: 'line' и т. д. */
  family: string | null;
}

export interface ManifestFamily {
  id: FunctionTypeId;
  title: string;
  shortTitle: string;
  status: 'active' | 'soon';
  skills: ManifestSkill[];
  prep: { sets: number; tasks: number };
  prototypes: { sets: number; tasks: number };
  total: number;
  levels: string[];
  /** Наборы, обещанные конфигом, которых в данных нет. */
  missing: string[];
}

export interface Manifest {
  families: ManifestFamily[];
  /** Наборы данных, не приписанные ни одному семейству. */
  orphans: string[];
}

export const manifest = buildManifest({ prep, prototypes }, functionTypes) as Manifest;

export function findManifestFamily(id: string): ManifestFamily | undefined {
  return manifest.families.find((family) => family.id === id);
}

export function findManifestSkill(familyId: string, skillId: string): ManifestSkill | undefined {
  return findManifestFamily(familyId)?.skills.find((skill) => skill.id === skillId);
}
