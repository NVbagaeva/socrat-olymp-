/**
 * Все прототипы задания №7 в порядке классификации: 1…28 — список
 * автора раздела (сверен с открытым банком ФИПИ), 29+ — дополнения
 * (П-29 — тип из открытого банка, которого не было в списке; П-30 —
 * не из открытого банка, нужен для посторонних корней у логарифмов).
 */

import { chistaya, chistoTex } from '../kit';
import type { GroupId, Prototype, Solved } from '../types';
import { GRUPPA_I } from './gruppa1';
import { GRUPPA_II } from './gruppa2';
import { GRUPPA_III } from './gruppa3';
import { GRUPPA_IV } from './gruppa4';
import { GRUPPA_V } from './gruppa5';

/**
 * Последний проход по решению: знаки после подстановок («+−», «−−»,
 * «−(−3)») склеиваются во всех формулах — так разбор не зависит от
 * того, какие знаки выпали в данных.
 */
function chistoVsyudu(s: Solved): Solved {
  return {
    ...s,
    uravnenie: chistoTex(s.uravnenie),
    etapy: s.etapy.map((e) => ({ title: e.title, lines: e.lines.map(chistaya) })),
    vychisleniya: s.vychisleniya.map((c) =>
      c.tex ? { tekst: chistaya(c.tekst), tex: chistoTex(c.tex) } : { tekst: chistaya(c.tekst) },
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
  .map((p) => ({
    ...p,
    uravnenie: (params) => chistoTex(p.uravnenie.call(p, params)),
    uslovie: (params) => chistaya(p.uslovie.call(p, params)),
    vopros: (params) => p.vopros.call(p, params),
    chisla: (params) => p.chisla.call(p, params),
    solve: (params) => chistoVsyudu(p.solve.call(p, params)),
  }));

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
    title: 'Линейные, дробно-рациональные, степенные',
    lead: 'Перенос, пропорция, извлечение корня, квадратное уравнение.',
  },
  {
    id: 'II',
    title: 'Иррациональные',
    lead: 'Возвести в квадрат или в куб и проверить условие $x\\ge0$.',
  },
  {
    id: 'III',
    title: 'Показательные',
    lead: 'Привести к одному основанию и приравнять показатели.',
  },
  {
    id: 'IV',
    title: 'Логарифмические',
    lead: 'Определение логарифма, свойства и ОДЗ.',
  },
  {
    id: 'V',
    title: 'Тригонометрические',
    lead: 'Серии решений и перебор $n$: наименьший положительный, наибольший отрицательный.',
  },
];

export function prototypesOfGroup(g: GroupId): Prototype[] {
  return PROTOTYPES.filter((p) => p.group === g);
}
