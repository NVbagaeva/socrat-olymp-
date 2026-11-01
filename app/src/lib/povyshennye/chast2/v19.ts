/**
 * №19 (варианты 3–4): x² − (a + r)x + ar = 0 имеет ровно один корень на [L; H].
 *
 * Корни x = r и x = a. r ∈ [L; H] при любом a, поэтому второй корень a
 * не должен лежать на отрезке — или совпадать с r.
 */

import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import { mnozhPoChislu } from './uObshchee';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PV19 {
  r: number;
  L: number;
  H: number;
}

export function chisloV19(p: PV19, a: number): number {
  const s = new Set<number>();
  for (const x of [p.r, a]) if (x >= p.L - 1e-12 && x <= p.H + 1e-12) s.add(x);
  return s.size;
}

export function chislaV19(p: PV19) {
  if (!(p.L < p.r && p.r < p.H)) throw new Error('v19: r внутри отрезка');
  const krit = [p.L, p.r, p.H].map((v) => ({ v, tex: String(v) }));
  return { kuski: mnozhPoChislu(krit, (a) => chisloV19(p, a), 1) };
}

const lin = (k: number) => (k === 0 ? '' : k > 0 ? `+${k}` : `${k}`);

function sobrat(p: PV19): Chast2Zadacha {
  const ch = chislaV19(p);
  const otv = mnozhTex(ch.kuski);
  const ur = `x^2-\\left(a${lin(p.r)}\\right)x${p.r === 0 ? '' : `${p.r > 0 ? '+' : '-'}${Math.abs(p.r) === 1 ? '' : Math.abs(p.r)}a`}=0`;
  return {
    no: 19,
    shablon: 'v19.dvaKornya',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $${ur}$ имеет ровно один корень на отрезке $[${p.L};\\ ${p.H}]$.`,
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
        title: 'Корни',
        lines: [
          `Левая часть раскладывается: $(x-a)(x${lin(-p.r)})=0$, корни $x=${p.r}$ и $x=a$ (по теореме Виета их сумма $a${lin(p.r)}$, произведение $${p.r}a$).`,
        ],
      },
      {
        title: 'Условие',
        lines: [
          `Корень $x=${p.r}$ лежит на отрезке $[${p.L};\\ ${p.H}]$ при любом $a$. Значит, корней на отрезке ровно один, если $a\\notin[${p.L};\\ ${p.H}]$ или $a=${p.r}$ (тогда корни совпадают).`,
          `Ответ: $a\\in${otv}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $a\\in${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Разложение', formula: `(x-a)(x${lin(-p.r)})=0` },
      { slovo: 'Корень $x=r$ всегда на отрезке', formula: `${p.r}\\in[${p.L};${p.H}]` },
      { slovo: 'Второй корень вне отрезка или совпадает', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const V19_DVA_KORNYA: Shablon2<PV19> = {
  no: 19,
  prototip: 'Квадратное уравнение с корнями r и a: ровно один корень на отрезке',
  sobrat,
};
