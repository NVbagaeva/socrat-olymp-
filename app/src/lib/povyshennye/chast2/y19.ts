/**
 * №19 (варианты 9–10): x² − 2b|x| + c = a — число корней.
 *
 * Функция чётная: при x ≥ 0 это (x − b)² + c − b². График — «W»
 * с минимумами c − b² при x = ±b и локальным максимумом c при x = 0.
 * Горизонталь y = a: a < c − b² — нет точек; a = c − b² — две;
 * c − b² < a < c — четыре; a = c — три; a > c — две.
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY19 {
  b: number;
  c: number;
  vopros: 'dva' | 'chetyre' | 'ne_menee3';
}

const VOPROS: Record<PY19['vopros'], string> = {
  dva: 'ровно два различных корня',
  chetyre: 'ровно четыре различных корня',
  ne_menee3: 'не менее трёх различных корней',
};

export function chislaY19(p: PY19) {
  if (!(p.b > 0)) throw new Error('y19: параметры');
  const m = p.c - p.b * p.b;
  const k = (v: number) => ({ tex: String(v), v });
  const kuski: Kus[] =
    p.vopros === 'dva'
      ? [
          { lo: k(m), hi: k(m), loZ: true, hiZ: true },
          { lo: k(p.c), hi: null, loZ: false, hiZ: false },
        ]
      : p.vopros === 'chetyre'
        ? [{ lo: k(m), hi: k(p.c), loZ: false, hiZ: false }]
        : [{ lo: k(m), hi: k(p.c), loZ: false, hiZ: true }];
  return { m, kuski };
}

function sobrat(p: PY19): Chast2Zadacha {
  const ch = chislaY19(p);
  const sv = p.c === 0 ? '' : p.c > 0 ? `+${p.c}` : `-${-p.c}`;
  const f = `x^2-${2 * p.b}|x|${sv}`;
  const otv = mnozhTex(ch.kuski);
  const mT = String(ch.m);
  return {
    no: 19,
    shablon: 'y19.modulVnutri',
    uslovie: `Найдите все значения параметра $a$, при каждом из которых уравнение $${f}=a$ имеет ${VOPROS[p.vopros]}.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'График левой части',
        lines: [
          `Функция $y=${f}$ чётная: её график симметричен относительно оси $Oy$. При $x\\ge0$: $y=(x-${p.b})^2${ch.m === 0 ? '' : ch.m > 0 ? `+${ch.m}` : `-${-ch.m}`}$ — часть параболы с вершиной $(${p.b};\\ ${mT})$.`,
          `Вместе с отражением получаем две «ямы» и «горб» между ними: минимумы $${mT}$ при $x=\\pm${p.b}$ и локальный максимум $${p.c}$ при $x=0$.`,
        ],
      },
      {
        title: 'Горизонталь $y=a$',
        lines: [
          `При $a<${mT}$ корней нет; при $a=${mT}$ — два; при $${mT}<a<${p.c}$ — четыре; при $a=${p.c}$ — три (одна точка — на оси $Oy$); при $a>${p.c}$ — два.`,
        ],
      },
      { title: 'Ответ', lines: [`Нужно ${VOPROS[p.vopros]}: $a\\in${otv}$.`] },
    ],
    razbor: [
      {
        slovo: 'Чётная функция — строим при $x\\ge0$ и отражаем',
        formula: `(x-${p.b})^2${ch.m === 0 ? '' : ch.m > 0 ? `+${ch.m}` : `-${-ch.m}`}`,
      },
      { slovo: 'Особые значения', formula: `a=${mT},\\ a=${p.c}` },
      { slovo: 'Считаем точки пересечения', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), m: ch.m },
  };
}

export const Y19_MODUL_VNUTRI: Shablon2<PY19> = {
  no: 19,
  prototip: 'Параметр: число корней уравнения x² − 2b|x| + c = a по графику чётной функции',
  sobrat,
};
