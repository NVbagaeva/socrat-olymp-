/**
 * Все прототипы задания №6 в порядке классификации: 6.1…6.15 — список
 * автора раздела. Новых прототипов (6.16+) из открытого банка ФИПИ пока
 * нет: банк из среды разработки недоступен, см. docs/zadanie-6-otchet.md.
 */

import { chistaya } from '../../zadanie10/kit';
import type { Etap, GroupId, Prototype, Solved, Uslovie } from '../types';
import { GRUPPA_I } from './gruppa1';
import { GRUPPA_II } from './gruppa2';
import { GRUPPA_III } from './gruppa3';
import { GRUPPA_IV } from './gruppa4';
import { GRUPPA_V } from './gruppa5';

/** Последний проход: множители 1 после подстановок убираются во всех формулах. */
function chistoVsyudu(s: Solved): Solved {
  return {
    ...s,
    etapy: s.etapy.map((e): Etap => ({
      ...e,
      title: chistaya(e.title),
      lines: e.lines.map(chistaya),
    })),
    vychisleniya: s.vychisleniya.map((c) =>
      c.tex ? { tekst: chistaya(c.tekst), tex: c.tex } : { tekst: chistaya(c.tekst) },
    ),
    hints: s.hints.map((h) => ({
      ...h,
      question: chistaya(h.question),
      options: h.options.map(chistaya),
      ...(h.comment ? { comment: chistaya(h.comment) } : {}),
    })),
  };
}

function chistoeUslovie(u: Uslovie): Uslovie {
  return { ...u, text: chistaya(u.text), ...(u.posle ? { posle: chistaya(u.posle) } : {}) };
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
    uslovie: (params) => chistoeUslovie(p.uslovie.call(p, params)),
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

/** «6.1» — код прототипа на сайте. */
export function kodNaSayte(id: string): string {
  return `6.${Number(id.slice(1))}`;
}

export const GROUPS: { id: GroupId; title: string; lead: string }[] = [
  {
    id: 'I',
    title: 'Диаграмма Эйлера',
    lead: 'Точки — элементарные события: складываем вероятности нужных точек или считаем их.',
  },
  {
    id: 'II',
    title: 'Условная вероятность',
    lead: 'Дерево эксперимента: вероятности исходов — произведения вдоль ветвей, затем $P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$.',
  },
  {
    id: 'III',
    title: 'Математическое ожидание',
    lead: 'Лотереи, распределения, частоты, страхование: $E(X)=\\sum x_ip_i$.',
  },
  {
    id: 'IV',
    title: 'Оценка вероятности',
    lead: 'Неравенство Чебышёва и вероятность попадания в промежуток.',
  },
  {
    id: 'V',
    title: 'Дисперсия',
    lead: 'Несмещённая оценка по выборке, $D(X)=E(X^2)-\\left(E(X)\\right)^2$ и $\\sigma=\\sqrt{D}$.',
  },
];

export function prototypesOfGroup(g: GroupId): Prototype[] {
  return PROTOTYPES.filter((p) => p.group === g);
}
