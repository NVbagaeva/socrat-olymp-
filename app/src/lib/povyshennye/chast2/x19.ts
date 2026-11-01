/**
 * №19 (варианты 7–8): |x² − 2bx − c| = a — число корней.
 *
 * f(x) = x² − 2bx − c = (x − b)² − D, D = b² + c > 0. График y = |f(x)|:
 * «W» с нулями f, локальным максимумом D при x = b. Горизонталь y = a
 * пересекает его: a < 0 — нет точек; a = 0 — две; 0 < a < D — четыре;
 * a = D — три; a > D — две.
 * Вопросы: «dva» — ровно два корня ({0} ∪ (D; +∞));
 * «chetyre» — ровно четыре ((0; D)); «ne_menee3» — не менее трёх ((0; D]).
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX19 {
  b: number;
  c: number;
  vopros: 'dva' | 'chetyre' | 'ne_menee3';
}

const VOPROS: Record<PX19['vopros'], string> = {
  dva: 'ровно два различных корня',
  chetyre: 'ровно четыре различных корня',
  ne_menee3: 'не менее трёх различных корней',
};

export function chislaX19(p: PX19) {
  const D = p.b * p.b + p.c;
  if (!(D > 0) || p.b === 0) throw new Error('x19: параметры');
  const k = (v: number) => ({ tex: String(v), v });
  const kuski: Kus[] =
    p.vopros === 'dva'
      ? [
          { lo: k(0), hi: k(0), loZ: true, hiZ: true },
          { lo: k(D), hi: null, loZ: false, hiZ: false },
        ]
      : p.vopros === 'chetyre'
        ? [{ lo: k(0), hi: k(D), loZ: false, hiZ: false }]
        : [{ lo: k(0), hi: k(D), loZ: false, hiZ: true }];
  return { D, kuski };
}

function sobrat(p: PX19): Chast2Zadacha {
  const ch = chislaX19(p);
  const lin = p.b > 0 ? `-${2 * p.b}x` : `+${-2 * p.b}x`;
  const sv = p.c === 0 ? '' : p.c > 0 ? `-${p.c}` : `+${-p.c}`;
  const f = `x^2${lin}${sv}`;
  const otv = mnozhTex(ch.kuski);
  const xb = p.b > 0 ? `x-${p.b}` : `x+${-p.b}`;
  return {
    no: 19,
    shablon: 'x19.modulParaboly',
    uslovie: `Найдите все значения параметра $a$, при каждом из которых уравнение $\\left|${f}\\right|=a$ имеет ${VOPROS[p.vopros]}.`,
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
          `Выделим полный квадрат: $${f}=(${xb})^2-${ch.D}$. График $y=${f}$ — парабола с вершиной $(${p.b};\\ -${ch.D})$, ветви вверх.`,
          `График $y=\\left|${f}\\right|$ получается отражением части параболы под осью $Ox$ вверх: получаются две «ямы» с нулями трёхчлена и «горб» между ними, и локальным максимумом $${ch.D}$ при $x=${p.b}$.`,
        ],
      },
      {
        title: 'Число общих точек с горизонталью $y=a$',
        lines: [
          `При $a<0$ корней нет; при $a=0$ — два (нули трёхчлена); при $0<a<${ch.D}$ — четыре; при $a=${ch.D}$ — три (касание в вершине «горба»); при $a>${ch.D}$ — два.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`Нужно ${VOPROS[p.vopros]}: $a\\in${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'Полный квадрат', formula: `(${xb})^2-${ch.D}` },
      {
        slovo: 'Модуль отражает часть под осью вверх',
        formula: `\\max=${ch.D}\\ \\text{при}\\ x=${p.b}`,
      },
      { slovo: 'Считаем точки пересечения с $y=a$', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), D: ch.D },
  };
}

export const X19_MODUL_PARABOLY: Shablon2<PX19> = {
  no: 19,
  prototip: 'Параметр: число корней уравнения |квадратный трёхчлен| = a по графику',
  sobrat,
};
