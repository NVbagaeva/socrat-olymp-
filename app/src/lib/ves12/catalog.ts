/**
 * Каталог «Весь №12»: типы функций и их прототипы для зачётной работы
 * и генератора по всем типам.
 *
 * Собирается на сервере из тех же источников, что окно выбора типа и
 * генераторы разделов: список типов и их статус — data/functionTypes.ts,
 * наборы и числа — манифест генератора, названия наборов —
 * content/skills12.ts. В браузер уходит готовый список: ни движка, ни
 * данных наборов экрану настройки не нужно.
 *
 * Новый тип попадает в оба инструмента сам, как только у него снят
 * флаг «Скоро» (status: 'active'); тип «Скоро» виден бледным и не
 * выбирается.
 */

import { prototypes } from '@/lib/graph/data/index.js';
import { functionTypes } from '@/data/functionTypes';
import { findManifestFamily } from '@/lib/generator/manifest';
import { ikonkaRazdela } from '@/components/tasks/razdely/ikonka';
import { skillTitle } from '@/content/skills12';
import { typeset } from '@/lib/tex';
import { fipiOfSet, type RawSet } from './fipi';
import type { Ves12Catalog, Ves12Type } from './types';

export function ves12Catalog(): Ves12Catalog {
  const raw = prototypes as unknown as RawSet[];
  const types: Ves12Type[] = functionTypes.map((type) => {
    const family = findManifestFamily(type.id);
    const sets = (family?.skills ?? [])
      .filter((skill) => skill.kind === 'prototype')
      .map((skill) => {
        const title = skillTitle[skill.id] ?? skill.id;
        const data = raw.find((set) => set.id === skill.id);
        return {
          id: skill.id,
          title,
          titleHtml: typeset(title),
          count: skill.count,
          fipi: data === undefined ? 0 : fipiOfSet(data),
        };
      });
    return {
      id: type.id,
      title: type.title,
      graphName: type.graphName,
      icon: ikonkaRazdela('12', type.icon),
      soon: type.status !== 'active' || sets.length === 0,
      sets,
    };
  });
  return { types };
}
