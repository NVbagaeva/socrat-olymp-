/**
 * №14 (варианты 29–30): √(±(c − x)) · (Q^x − (u + v)·q^x + uv) = 0,
 * Q = q², u = q^{e₁}, v = q^{e₂}.
 *
 * ОДЗ: x ≤ c (vid «leq») или x ≥ c (vid «geq»). Произведение равно нулю,
 * если один множитель равен нулю, а другой определён: x = c из корня;
 * q^x = u или q^x = v — x = e₁, x = e₂, из них остаются корни из ОДЗ.
 * б) Отбор на отрезке [lo; hi].
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ14 {
  q: number;
  c: number;
  /** «leq»: √(c − x), ОДЗ x ≤ c; «geq»: √(x − c), ОДЗ x ≥ c. */
  vid: 'leq' | 'geq';
  e1: number;
  e2: number;
  lo: number;
  hi: number;
}

export function chislaQ14(p: PQ14) {
  const u = p.q ** p.e1;
  const v = p.q ** p.e2;
  const vOdz = (x: number) => (p.vid === 'leq' ? x <= p.c : x >= p.c);
  const korni = [...new Set([p.c, ...[p.e1, p.e2].filter(vOdz)])].sort((a, b) => a - b);
  const lishnie = [p.e1, p.e2].filter((e) => !vOdz(e));
  const vybor = korni.filter((x) => x >= p.lo && x <= p.hi);
  return { u, v, korni, lishnie, vybor };
}

const minusX = (c: number, vid: 'leq' | 'geq') =>
  vid === 'leq' ? (c === 0 ? '-x' : `${c}-x`) : c === 0 ? 'x' : c > 0 ? `x-${c}` : `x+${-c}`;

function sobrat(p: PQ14): Chast2Zadacha {
  if (p.e1 === p.e2 || p.e1 < 0 || p.e2 < 0) throw new Error('q14: показатели');
  const ch = chislaQ14(p);
  if (ch.lishnie.length === 0) throw new Error('q14: нет лишнего корня');
  const Q = p.q * p.q;
  const kor = `\\sqrt{${minusX(p.c, p.vid)}}`;
  const tr = `${Q}^{x}-${ch.u + ch.v}\\cdot ${p.q}^{x}+${ch.u * ch.v}`;
  const ur = `${kor}\\cdot\\left(${tr}\\right)=0`;
  const odz = p.vid === 'leq' ? `x\\le ${p.c}` : `x\\ge ${p.c}`;
  const kT = ch.korni.map(String);
  const vT = ch.vybor.map(String);
  return {
    no: 14,
    shablon: 'q14.korenPokaz',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $[${p.lo};\\ ${p.hi}]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни уравнения', pole: { vid: 'korni', verno: kT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT } },
    ],
    otvet: `а) $${kT.join(';\\ ')}$; б) ${vT.length === 0 ? 'корней нет' : `$${vT.join(';\\ ')}$`}`,
    reshenie: [
      {
        title: 'ОДЗ',
        lines: [
          `Подкоренное выражение неотрицательно: $${odz}$. Второй множитель определён при всех $x$.`,
        ],
      },
      {
        title: 'Множители',
        lines: [
          `Произведение равно нулю, если один из множителей равен нулю, а другой при этом определён (на ОДЗ оба определены).`,
          `$${kor}=0$ при $x=${p.c}$.`,
          `$${tr}=0$: замена $t=${p.q}^x>0$, $t^2-${ch.u + ch.v}t+${ch.u * ch.v}=0$, $t=${ch.u}$ или $t=${ch.v}$, то есть $x=${p.e1}$ или $x=${p.e2}$.`,
          `${ch.lishnie.map((e) => `$x=${e}$`).join(' и ')} не ${ch.lishnie.length === 1 ? 'удовлетворяет' : 'удовлетворяют'} условию $${odz}$ — посторонний корень.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `Из корней $${kT.join(';\\ ')}$ отрезку $[${p.lo};\\ ${p.hi}]$ ${vT.length === 0 ? 'не принадлежит ни один' : `принадлежат $${vT.join(';\\ ')}$`}.`,
          `Ответ: а) $${kT.join(';\\ ')}$; б) ${vT.length === 0 ? 'корней нет' : `$${vT.join(';\\ ')}$`}.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'ОДЗ — из корня', formula: odz },
      { slovo: 'Корень равен нулю', formula: `x=${p.c}` },
      {
        slovo: 'Показательный трёхчлен — замена',
        formula: `${p.q}^x=${ch.u}\\ \\text{или}\\ ${p.q}^x=${ch.v}`,
      },
      { slovo: 'Отсев по ОДЗ и отбор', formula: kT.join(';\\ ') },
    ],
    kontrol: { korni: ch.korni, vybor: ch.vybor },
  };
}

export const Q14_KOREN_POKAZ: Shablon2<PQ14> = {
  no: 14,
  prototip:
    'Произведение корня и квадратного трёхчлена от q^x: ОДЗ из корня отсекает показательный корень, отбор на отрезке',
  sobrat,
};
