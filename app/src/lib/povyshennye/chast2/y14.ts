/**
 * №14 (варианты 9–10): q^x + q^{c−x} = q^{e₁} + q^{e₂}, e₁ + e₂ = c.
 *
 * t = q^x > 0: t + q^c/t = s ⇒ t² − s·t + q^c = 0, корни t = q^{e₁},
 * t = q^{e₂} (теорема Виета) ⇒ x = e₁, x = e₂.
 * б) Отрезок [log_q u; log_q v] — сравнение q^e с u и v.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY14 {
  q: number;
  e1: number;
  e2: number;
  /** Отрезок [log_q u; log_q v]. */
  u: number;
  v: number;
}

export function chislaY14(p: PY14) {
  if (p.e1 === p.e2 || p.q < 2 || !(p.u > 0 && p.u < p.v)) throw new Error('y14: параметры');
  if ([p.u, p.v].some((w) => [p.e1, p.e2].some((e) => p.q ** e === w)))
    throw new Error('y14: конец отрезка совпал с корнем');
  const c = p.e1 + p.e2;
  const s = p.q ** p.e1 + p.q ** p.e2;
  const korni = [p.e1, p.e2].sort((a, b) => a - b);
  const vybor = korni.filter((e) => p.q ** e >= p.u && p.q ** e <= p.v);
  return { c, s, korni, vybor };
}

const step = (q: number, e: number) => (e === 1 ? String(q) : e === 0 ? '1' : `${q}^{${e}}`);

function sobrat(p: PY14): Chast2Zadacha {
  const ch = chislaY14(p);
  if (ch.vybor.length === 0) throw new Error('y14: на отрезке нет корней');
  const pok = ch.c === 0 ? '-x' : `${ch.c}-x`;
  const ur = `${p.q}^{x}+${p.q}^{${pok}}=${ch.s}`;
  const L = `\\log_{${p.q}}${p.u}`;
  const H = `\\log_{${p.q}}${p.v}`;
  const qc = p.q ** ch.c;
  const qcT = ch.c >= 0 ? String(qc) : `\\dfrac{1}{${p.q ** -ch.c}}`;
  const kT = ch.korni.map(String);
  const vT = ch.vybor.map(String);
  return {
    no: 14,
    shablon: 'y14.pokazSimm',
    uslovie: `а) Решите уравнение $${ur}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $\\left[${L};\\ ${H}\\right]$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Корни', pole: { vid: 'korni', verno: kT } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vT } },
    ],
    otvet: `а) $${kT.join(';\\ ')}$; б) $${vT.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Замена',
        lines: [
          `$${p.q}^{${pok}}=\\dfrac{${p.q}^{${ch.c}}}{${p.q}^{x}}=\\dfrac{${qcT}}{${p.q}^x}$. Обозначим $t=${p.q}^x$, $t>0$.`,
          `Уравнение принимает вид $t+\\dfrac{${qcT}}{t}=${ch.s}$, то есть $t^2-${ch.s}t+${qcT}=0$.`,
        ],
      },
      {
        title: 'а) Корни',
        lines: [
          `По теореме Виета $t_1=${step(p.q, p.e1)}$, $t_2=${step(p.q, p.e2)}$ (их сумма $${ch.s}$, произведение $${qcT}$); оба положительны.`,
          `$${p.q}^x=${step(p.q, p.e1)}$ ⇒ $x=${p.e1}$; $${p.q}^x=${step(p.q, p.e2)}$ ⇒ $x=${p.e2}$.`,
          `Ответ а): $${kT.join(';\\ ')}$.`,
        ],
      },
      {
        title: 'б) Отбор',
        lines: [
          `Функция $y=\\log_{${p.q}}t$ возрастает, поэтому корень $x=e$ лежит на отрезке тогда и только тогда, когда $${p.u}\\le ${p.q}^e\\le ${p.v}$.`,
          ch.korni
            .map(
              (e) =>
                `$${p.q}^{${e}}=${p.q ** e}$ — ${p.q ** e >= p.u && p.q ** e <= p.v ? 'подходит' : 'не подходит'}`,
            )
            .join('; ') + '.',
          `Ответ б): $${vT.join(';\\ ')}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена', formula: `t=${p.q}^x>0` },
      { slovo: 'Квадратное уравнение', formula: `t^2-${ch.s}t+${qcT}=0` },
      { slovo: 'Корни', formula: kT.join(';\\ ') },
      { slovo: 'Сравниваем степени с концами отрезка', formula: vT.join(';\\ ') },
    ],
    kontrol: { korni: ch.korni, vybor: ch.vybor },
  };
}

export const Y14_POKAZ_SIMM: Shablon2<PY14> = {
  no: 14,
  prototip:
    'Показательное уравнение q^x + q^(c−x) = s: замена и квадратное уравнение, отбор на отрезке с логарифмами',
  sobrat,
};
