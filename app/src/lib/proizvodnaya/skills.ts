/**
 * Группы прототипов задания №9 — навыки конфигуратора тренажёра и
 * генератора. Названия — слова без формул: они стоят на карточках.
 * Состав групп берётся из реестра прототипов: отдельного списка нет.
 */

import { PROTOTYPES } from './prototypes';
import type { Gruppa, Prototype } from './types';

export interface GruppaInfo {
  id: Gruppa;
  /** Название на карточке. */
  nazvanie: string;
  /** Короткое описание типов — без формул. */
  lead: string;
}

export const GRUPPY: GruppaInfo[] = [
  {
    id: 'I',
    nazvanie: 'Физический смысл производной',
    lead: 'Скорость по закону движения: в заданный момент и когда скорость равна заданной',
  },
  {
    id: 'II',
    nazvanie: 'Касательная',
    lead: 'Угловой коэффициент по рисунку, параллельность прямой, параметр',
  },
  {
    id: 'III',
    nazvanie: 'Исследование по графику функции',
    lead: 'Знак производной в точках, целые точки, нули производной',
  },
  {
    id: 'IV',
    nazvanie: 'Исследование по графику производной',
    lead: 'Возрастание, экстремумы на отрезке, наибольшее и наименьшее значения',
  },
  {
    id: 'V',
    nazvanie: 'Первообразная',
    lead: 'Знак функции по графику первообразной, число решений, площадь',
  },
];

export function gruppaById(id: string): GruppaInfo | undefined {
  return GRUPPY.find((g) => g.id === id);
}

/** Прототипы группы по порядку кодов. */
export function prototypesOfGroup(id: Gruppa): Prototype[] {
  return PROTOTYPES.filter((p) => p.gruppa === id);
}

/** Группа, в которую входит прототип. */
export function gruppaOfPrototype(prototypeId: string): GruppaInfo | undefined {
  const proto = PROTOTYPES.find((p) => p.id === prototypeId);
  return proto === undefined ? undefined : gruppaById(proto.gruppa);
}
