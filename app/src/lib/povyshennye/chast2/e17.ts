/**
 * №17 (варианты 9–10): переправа через реку шириной h со сносом.
 * Скорость в стоячей воде v меньше скорости течения u; курс — под углом α
 * к направлению течения, снос l(α) = h(u + v·cos α)/(v·sin α).
 *
 * l′(α) = −h(v + u·cos α)/(v·sin²α), минимум при cos α = −v/u:
 * l_min = h·√(u² − v²)/v. Числа подобраны так, что √(u² − v²) рационален.
 */

import { div, mul, rat, ratDec, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat } from '@/lib/zadanie15/core/surd';
import { tochnoTex } from './chisla';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** [кто, на чём, откуда (род. п.), что напротив]. */
const SYUZHETY = [
  ['Рыбак', 'на лодке', 'причала', 'мостки'],
  ['Спасатель', 'на моторной лодке', 'спасательной станции', 'пляж'],
  ['Турист', 'на байдарке', 'стоянки', 'палаточный лагерь'],
  ['Паромщик', 'на небольшом пароме', 'пристани', 'другая пристань'],
  ['Пловец', 'вплавь', 'купальни', 'вышка'],
  ['Гребец', 'на каноэ', 'лодочной станции', 'беседка'],
] as const;

export interface PE17 {
  /** Ширина реки, м. */
  h: number;
  /** Скорость течения, м/с (десятичная). */
  u: number;
  /** Собственная скорость, м/с (десятичная), v < u. */
  v: number;
  syuzhet: number;
}

export function otvetE17(p: PE17): { w: Rat; l: Rat; cos: Rat } {
  const u = ratDec(p.u);
  const v = ratDec(p.v);
  if (toNumber(v) >= toNumber(u)) throw new Error('e17: v ≥ u');
  const w = sqrtRat(sub(mul(u, u), mul(v, v)));
  if (w.m !== 1n) throw new Error('e17: корень не извлекается');
  const ww = w.k;
  const l = div(mul(rat(p.h), ww), v);
  return { w: ww, l, cos: div(v, u) };
}

function sobrat(p: PE17): Chast2Zadacha {
  const S = SYUZHETY[p.syuzhet];
  if (S === undefined) throw new Error('e17: сюжет');
  const [kto, na, ot, k] = S;
  const { w, l, cos } = otvetE17(p);
  const lT = tochnoTex(l);
  const cT = tochnoTex(cos);
  const u2 = mul(ratDec(p.u), ratDec(p.u));
  const v2 = mul(ratDec(p.v), ratDec(p.v));
  const uslovie =
    `Ширина прямого участка реки равна $h$ метров. ${kto} переправляется ${na} от ${ot} $A$ на противоположный берег; прямо напротив $A$ на другом берегу — ${k} $B$. ` +
    `Собственная скорость $v$ меньше скорости течения $u$, поэтому ${kto.toLowerCase()} держит курс под углом $\\alpha$ $(0<\\alpha<\\pi)$ к направлению течения, и его сносит: он оказывается в точке $C$ на расстоянии $l$ метров от точки $B$ вниз по течению, где\n` +
    `$\\displaystyle l=h\\cdot\\dfrac{u+v\\cos\\alpha}{v\\sin\\alpha}.$\n` +
    `Найдите наименьшее возможное значение $l$, если $h=${p.h}$ м, $u=${dec(p.u)}$ м/с, $v=${dec(p.v)}$ м/с.`;
  return {
    no: 17,
    shablon: 'e17.snos',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Наименьшее $l$, м',
        pole: { vid: 'chislo', verno: String(toNumber(l)) },
      },
    ],
    otvet: `$${lT}$ м`,
    reshenie: [
      {
        title: 'Производная',
        lines: [
          'При $0<\\alpha<\\pi$ знаменатель положителен, и $u+v\\cos\\alpha\\ge u-v>0$, поэтому $l>0$.',
          `$l'(\\alpha)=\\dfrac{h}{v}\\cdot\\dfrac{-v\\sin^2\\alpha-(u+v\\cos\\alpha)\\cos\\alpha}{\\sin^2\\alpha}=-\\dfrac{h}{v}\\cdot\\dfrac{v+u\\cos\\alpha}{\\sin^2\\alpha}$ (использовали $\\sin^2\\alpha+\\cos^2\\alpha=1$).`,
        ],
      },
      {
        title: 'Точка минимума',
        lines: [
          `$l'(\\alpha)=0$ при $\\cos\\alpha=-\\dfrac{v}{u}=-${cT}$; такой угол $\\alpha_0\\in(0;\\pi)$ единственный, так как $\\cos\\alpha$ на $(0;\\pi)$ убывает.`,
          "При $\\alpha<\\alpha_0$ имеем $\\cos\\alpha>-\\dfrac vu$, $v+u\\cos\\alpha>0$, $l'<0$; при $\\alpha>\\alpha_0$ — $l'>0$. Значит, $\\alpha_0$ — точка минимума.",
        ],
      },
      {
        title: 'Наименьшее значение',
        lines: [
          `$\\sin\\alpha_0=\\sqrt{1-\\dfrac{v^2}{u^2}}=\\dfrac{\\sqrt{u^2-v^2}}{u}$, $u+v\\cos\\alpha_0=\\dfrac{u^2-v^2}{u}$, поэтому $l_{\\min}=h\\cdot\\dfrac{u^2-v^2}{v\\sqrt{u^2-v^2}}=\\dfrac{h\\sqrt{u^2-v^2}}{v}$.`,
          `$u^2-v^2=${tochnoTex(u2)}-${tochnoTex(v2)}=${tochnoTex(sub(u2, v2))}$, $\\sqrt{u^2-v^2}=${tochnoTex(w)}$; $l_{\\min}=\\dfrac{${p.h}\\cdot${tochnoTex(w)}}{${dec(p.v)}}=${lT}$ (м).`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Производная по углу',
        formula: "l'=-\\dfrac{h}{v}\\cdot\\dfrac{v+u\\cos\\alpha}{\\sin^2\\alpha}",
      },
      {
        slovo: 'Минимум при $\\cos\\alpha=-v/u$',
        formula: 'l_{\\min}=\\dfrac{h\\sqrt{u^2-v^2}}{v}',
      },
      { slovo: 'Подставляем числа', formula: `l_{\\min}=${lT}` },
    ],
    kontrol: { l: toNumber(l), h: p.h, u: p.u, v: p.v },
  };
}

export const E17_SNOS: Shablon2<PE17> = {
  no: 17,
  prototip: 'Наименьший снос при переправе: производная по углу курса',
  sobrat,
};
