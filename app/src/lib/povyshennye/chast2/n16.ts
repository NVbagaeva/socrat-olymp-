/**
 * №16 (варианты 25–26): (Q^x − (u + v)·q^x + uv) / (q^x − w) ⋚ 0,
 * Q = q², u = q^{e₁}, v = q^{e₂}, w = q^{e₃}.
 *
 * t = q^x > 0: (t − u)(t − v)/(t − w) ⋚ 0. Функция t = q^x возрастает
 * (q > 1), поэтому знак t − q^e совпадает со знаком x − e: неравенство
 * равносильно (x − e₁)(x − e₂)/(x − e₃) ⋚ 0 — метод интервалов.
 */

import { kuskiKontrol, kuskiPole, kuskiTex, reshitZnaki, ZNAK_TEX, type Znak } from './nZnaki';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN16 {
  q: number;
  e1: number;
  e2: number;
  e3: number;
  znak: Znak;
}

export function chislaN16(p: PN16) {
  const u = p.q ** p.e1;
  const v = p.q ** p.e2;
  const w = p.q ** p.e3;
  const f = (x: number) => (p.q ** (2 * x) - (u + v) * p.q ** x + u * v) / (p.q ** x - w);
  const g = (x: number) => ((x - p.e1) * (x - p.e2)) / (x - p.e3);
  const kuski = reshitZnaki(g, [p.e1, p.e2, p.e3], p.znak);
  return { u, v, w, f, kuski };
}

function sobrat(p: PN16): Chast2Zadacha {
  const es = [p.e1, p.e2, p.e3];
  if (new Set(es).size !== 3 || es.some((e) => e < 0) || p.q < 2) throw new Error('n16: параметры');
  const ch = chislaN16(p);
  const Q = p.q * p.q;
  const zn = ZNAK_TEX[p.znak];
  const ner = `\\dfrac{${Q}^x-${ch.u + ch.v}\\cdot ${p.q}^x+${ch.u * ch.v}}{${p.q}^x-${ch.w}}${zn}0`;
  const otv = kuskiTex(ch.kuski);
  const tNer = `\\dfrac{(t-${ch.u})(t-${ch.v})}{t-${ch.w}}${zn}0`;
  const xNer = `\\dfrac{(x${p.e1 === 0 ? '' : `-${p.e1}`})(x${p.e2 === 0 ? '' : `-${p.e2}`})}{x${p.e3 === 0 ? '' : `-${p.e3}`}}${zn}0`;
  const step = (e: number) => (e === 0 ? `1=${p.q}^0` : `${p.q ** e}=${p.q}^{${e}}`);
  return {
    no: 16,
    shablon: 'n16.pokazDrob',
    uslovie: `Решите неравенство $${ner}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: kuskiPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Замена',
        lines: [
          `$${Q}^x=\\left(${p.q}^x\\right)^2$. Обозначим $t=${p.q}^x$, $t>0$. Числитель — квадратный трёхчлен $t^2-${ch.u + ch.v}t+${ch.u * ch.v}=(t-${ch.u})(t-${ch.v})$ (корни по теореме Виета).`,
          `Неравенство принимает вид $${tNer}$.`,
        ],
      },
      {
        title: 'Переход к переменной $x$',
        lines: [
          `${[p.e1, p.e2, p.e3].map(step).join(', ')}. Функция $y=${p.q}^x$ возрастает, поэтому разность $${p.q}^x-${p.q}^{e}$ имеет тот же знак, что и $x-e$.`,
          `Значит, неравенство равносильно $${xNer}$ (знаменатель обращается в нуль только при $x=${p.e3}$).`,
        ],
      },
      {
        title: 'Метод интервалов',
        lines: [
          `Отмечаем на прямой точки $${[...es].sort((a, b) => a - b).join(';\\ ')}$ (точка $${p.e3}$ — выколотая) и расставляем знаки дроби справа налево: $+,\\ -,\\ +,\\ -$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Замена $t$ — степень', formula: `t=${p.q}^x>0` },
      { slovo: 'Разложение числителя', formula: tNer },
      { slovo: 'Знак разности степеней — как у разности показателей', formula: xNer },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: kuskiKontrol(ch.kuski) },
  };
}

export const N16_POKAZ_DROB: Shablon2<PN16> = {
  no: 16,
  prototip:
    'Показательная дробь: квадратный трёхчлен от q^x в числителе, q^x − w в знаменателе; метод интервалов по показателям',
  sobrat,
};
