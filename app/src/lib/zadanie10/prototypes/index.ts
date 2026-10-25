/**
 * Все прототипы задания №10 в порядке классификации: 1…29 — открытый
 * банк ФИПИ, 30+ — из стороннего курса (не из открытого банка).
 */

import { bezEdinic, chistaya } from '../kit';
import type { GroupId, Prototype, Solved } from '../types';
import { GRUPPA_I } from './gruppa1';
import { GRUPPA_II } from './gruppa2';
import { GRUPPA_III } from './gruppa3';
import { GRUPPA_IV } from './gruppa4';
import { GRUPPA_V } from './gruppa5';

/**
 * Последний проход по решению: множители 1 после подстановки
 * («$170\cdot1$», «$1t^2$», «$p=1\cdot10^6$») убираются во всех
 * формулах — так разбор не зависит от того, выпала ли в данных единица.
 */
function bezEdinicVsyudu(s: Solved): Solved {
  return {
    ...s,
    dano: s.dano.map((r) => ({ ...r, znach: bezEdinic(r.znach), smysl: chistaya(r.smysl) })),
    etapy: s.etapy.map((e) => ({ title: e.title, lines: e.lines.map(chistaya) })),
    vychisleniya: s.vychisleniya.map((c) =>
      c.tex ? { tekst: chistaya(c.tekst), tex: bezEdinic(c.tex) } : { tekst: chistaya(c.tekst) },
    ),
    hints: s.hints.map((h) => ({
      ...h,
      question: chistaya(h.question),
      options: h.options.map(chistaya),
      ...(h.comment ? { comment: chistaya(h.comment) } : {}),
    })),
  };
}

export const PROTOTYPES: Prototype[] = [
  ...GRUPPA_I,
  ...GRUPPA_II,
  ...GRUPPA_III,
  ...GRUPPA_IV,
  ...GRUPPA_V,
]
  .sort((a, b) => a.no - b.no)
  .map((p) => ({ ...p, solve: (params) => bezEdinicVsyudu(p.solve(params)) }));

/** Тот же последний проход для прототипа вне реестра (варианты повышенной сложности). */
export function sChistymResheniem(p: Prototype): Prototype {
  return { ...p, solve: (params) => bezEdinicVsyudu(p.solve(params)) };
}

const PO_ID = new Map(PROTOTYPES.map((p) => [p.id, p]));

export function prototype(id: string): Prototype {
  const p = PO_ID.get(id);
  if (p === undefined) {
    throw new Error(`нет прототипа ${id}`);
  }
  return p;
}

/** «П-01» — код прототипа на сайте. */
export function kodNaSayte(id: string): string {
  return `П-${id.slice(1)}`;
}

export const GROUPS: { id: GroupId; title: string; lead: string }[] = [
  {
    id: 'I',
    title: 'Подстановка, линейные и дробные уравнения',
    lead: 'Подставить известное в формулу и выразить неизвестное.',
  },
  {
    id: 'II',
    title: 'Квадратичные зависимости',
    lead: 'Квадратное уравнение или неравенство и выбор корня по смыслу.',
  },
  {
    id: 'III',
    title: 'Степени и корни',
    lead: 'Возвести в степень, извлечь корень, работать со степенями десяти.',
  },
  {
    id: 'IV',
    title: 'Показательные и логарифмические',
    lead: 'Степени двойки: «сколько раз уменьшилось вдвое».',
  },
  {
    id: 'V',
    title: 'Тригонометрические',
    lead: 'Табличные значения синуса и косинуса, наименьший угол.',
  },
];

export function prototypesOfGroup(g: GroupId): Prototype[] {
  return PROTOTYPES.filter((p) => p.group === g);
}
