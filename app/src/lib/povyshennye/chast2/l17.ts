/**
 * №17 (варианты 21–22): спасатель на берегу.
 *
 * Спасатель в точке A прямого берега, человек в воде в точке P на
 * расстоянии d от берега; основание перпендикуляра из P — точка H,
 * AH = L. Бег по берегу со скоростью v₁, вплавь — v₂ < v₁. Вход в воду
 * в точке X на отрезке AH, HX = x: T(x) = (L − x)/v₁ + √(d² + x²)/v₂.
 * T′(x) = 0 ⇔ x/√(d² + x²) = v₂/v₁ ⇔ x = d·v₂/W, W = √(v₁² − v₂²) — целое.
 */

import { add, div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PL17 {
  v1: number;
  v2: number;
  d: number;
  L: number;
  vopros: 'AX' | 'T';
}

export function chislaL17(p: PL17) {
  const W = Math.sqrt(p.v1 * p.v1 - p.v2 * p.v2);
  if (!Number.isInteger(W) || !(p.v2 < p.v1)) throw new Error('l17: скорости');
  const x = rat(p.d * p.v2, W);
  if (!(toNumber(x) < p.L)) throw new Error('l17: точка входа вне отрезка');
  const AX = sub(rat(p.L), x);
  /* √(d² + x²) = d·v₁/W. */
  const plyt = rat(p.d * p.v1, W);
  const T = add(div(AX, rat(p.v1)), div(plyt, rat(p.v2)));
  return { W, x, AX, plyt, T };
}

function sobrat(p: PL17): Chast2Zadacha {
  const ch = chislaL17(p);
  const voprAX = p.vopros === 'AX';
  const otvR = voprAX ? ch.AX : ch.T;
  const otvT = ratTex(otvR);
  const dec = (r: typeof otvR) => {
    let d = r.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n ? String(toNumber(r)).replace('.', '{,}') : ratTex(r);
  };
  const uslovie =
    `Спасатель стоит в точке $A$ на прямом берегу. Человек находится в воде в точке $P$ на расстоянии ${p.d} м от берега; основание перпендикуляра, опущенного из $P$ на линию берега, — точка $H$, $AH=${p.L}$ м. По берегу спасатель бежит со скоростью ${p.v1} м/с, а плывёт со скоростью ${p.v2} м/с. Спасатель бежит по берегу до некоторой точки $X$ отрезка $AH$, а затем плывёт к $P$ по прямой. ` +
    (voprAX
      ? 'На каком расстоянии от точки $A$ ему нужно войти в воду, чтобы добраться до человека за наименьшее время? Ответ дайте в метрах.'
      : 'За какое наименьшее время спасатель может добраться до человека? Ответ дайте в секундах.');
  return {
    no: 17,
    shablon: 'l17.spasatel',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: voprAX ? 'Расстояние, м' : 'Время, с',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `$${dec(otvR)}$`,
    reshenie: [
      {
        title: 'Время как функция',
        lines: [
          `Пусть $HX=x$, $0\\le x\\le ${p.L}$. Бег: $AX=${p.L}-x$; путь вплавь $XP=\\sqrt{${p.d}^2+x^2}$ (прямоугольный треугольник $XHP$).`,
          `$T(x)=\\dfrac{${p.L}-x}{${p.v1}}+\\dfrac{\\sqrt{${p.d * p.d}+x^2}}{${p.v2}}$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$T'(x)=-\\dfrac{1}{${p.v1}}+\\dfrac{x}{${p.v2}\\sqrt{${p.d * p.d}+x^2}}$. $T'(x)=0\\iff ${p.v1}x=${p.v2}\\sqrt{${p.d * p.d}+x^2}\\iff ${p.v1 * p.v1}x^2=${p.v2 * p.v2}x^2+${p.v2 * p.v2 * p.d * p.d}\\iff x^2=${ratTex(mul(ch.x, ch.x))}$.`,
          `$x=${ratTex(ch.x)}$; производная меняет знак с минуса на плюс (функция $\\dfrac{x}{\\sqrt{${p.d * p.d}+x^2}}$ возрастает) — это точка минимума, она лежит на отрезке $[0;\\ ${p.L}]$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: voprAX
          ? [`$AX=${p.L}-${ratTex(ch.x)}=${ratTex(ch.AX)}$ м. Ответ: $${dec(ch.AX)}$.`]
          : [
              `$XP=\\sqrt{${p.d * p.d}+${ratTex(mul(ch.x, ch.x))}}=${ratTex(ch.plyt)}$, $T_{\\min}=\\dfrac{${ratTex(ch.AX)}}{${p.v1}}+\\dfrac{${ratTex(ch.plyt)}}{${p.v2}}=${ratTex(ch.T)}$ с. Ответ: $${dec(ch.T)}$.`,
            ],
      },
    ],
    razbor: [
      {
        slovo: 'Время бега и плавания',
        formula: `T(x)=\\frac{${p.L}-x}{${p.v1}}+\\frac{\\sqrt{${p.d * p.d}+x^2}}{${p.v2}}`,
      },
      {
        slovo: 'Нуль производной',
        formula: `\\frac{x}{\\sqrt{${p.d * p.d}+x^2}}=\\frac{${p.v2}}{${p.v1}}`,
      },
      { slovo: 'Точка минимума', formula: `x=${ratTex(ch.x)}` },
      { slovo: 'Ответ', formula: dec(otvR) },
    ],
    kontrol: { otvet: toNumber(otvR), x: toNumber(ch.x) },
  };
}

export const L17_SPASATEL: Shablon2<PL17> = {
  no: 17,
  prototip: 'Спасатель: бег по берегу и путь вплавь, наименьшее время через производную',
  sobrat,
};
