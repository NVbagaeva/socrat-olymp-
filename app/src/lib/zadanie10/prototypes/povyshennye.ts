/**
 * Прототипы раздела «Варианты повышенной сложности» для задания №10.
 * В реестр PROTOTYPES не входят — в банк, тренажёр и «Собрать вариант»
 * не попадают; числа и текст условия задаёт вариант. Разбор — теми же
 * кирпичами, что у прототипов разделов (kit.ts): «Дано», этапы,
 * подсказки с кнопками.
 */

import { div, mul, sub } from '../../zadanie11/num';
import {
  chtoNayti,
  d,
  dano,
  fq,
  num,
  q,
  razbor,
  sokrashchenie,
  val,
  vKakihEdinicah,
  vopros,
  type Q,
} from '../kit';
import type { Prototype } from '../types';

/* ── Линза: наибольшее расстояние до лампочки ──────────────────── */

/**
 * Собирающая линза, d₁ и d₂ — в заданных пределах; найти наибольшее d₁,
 * при котором изображение на экране чёткое. Подвох — d₁ наибольшее при
 * наименьшем d₂ (а не при наибольшем), и это значение лежит внутри
 * пределов для d₁, а не на их правом конце.
 */
export const PV10_LINZA_MAX: Prototype = {
  id: 'PV10-LINZA-MAX',
  no: 107,
  group: 'I',
  title: 'Собирающая линза: наибольшее расстояние до лампочки',
  formula: '\\dfrac{1}{d_1}+\\dfrac{1}{d_2}=\\dfrac{1}{f}',
  ask: 'наибольшее расстояние от линзы до лампочки',
  skills: ['podstanovka'],
  fipiNos: '',
  alt: 'Лампочка, собирающая линза и экран на оптической скамье',
  solve(p) {
    const f = num(p, 'f');
    const d1min = num(p, 'd1min');
    const d1max = num(p, 'd1max');
    const d2min = num(p, 'd2min');
    const d2max = num(p, 'd2max');
    const top = f * d2min;
    const raz = d2min - f;
    const d1 = val(q(top, raz));
    if (!Number.isInteger(d1) || d1 <= d1min || d1 >= d1max) {
      throw new Error(`PV10-LINZA-MAX: d₁ = ${d1} вне пределов (${d1min}; ${d1max})`);
    }
    /* Нижняя граница d₁ (при наибольшем d₂) не выше верхней: условие совместно. */
    if (val(q(f * d2max, d2max - f)) > d1) {
      throw new Error('PV10-LINZA-MAX: пределы для d₂ несовместны с d₁');
    }
    const inv = sub(q(1, f), q(1, d2min));
    const dn = [
      dano('f', f, 'см', 'фокусное расстояние'),
      dano('d_1', `${d(d1min)}\\ldots${d(d1max)}`, 'см', 'от линзы до лампочки'),
      dano('d_2', `${d(d2min)}\\ldots${d(d2max)}`, 'см', 'от линзы до экрана'),
    ];
    return {
      answer: d1,
      iskomoe: 'd_1',
      edinicy: 'см',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем наибольшее $d_1$. Выразим его: $\\dfrac{1}{d_1}=\\dfrac{1}{${d(f)}}-\\dfrac{1}{d_2}$.`,
          `$d_1$ наибольшее, когда $\\dfrac{1}{d_1}$ наименьшее, то есть когда вычитаемое $\\dfrac{1}{d_2}$ наибольшее — при наименьшем $d_2=${d(d2min)}$ см.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$\\dfrac{1}{d_1}=\\dfrac{1}{${d(f)}}-\\dfrac{1}{${d(d2min)}}=\\dfrac{${d(d2min)}-${d(f)}}{${d(f)}\\cdot${d(d2min)}}=${fq(inv)}$.`,
          `$d_1=\\dfrac{${d(top)}}{${d(raz)}}=${d(d1)}$ см.`,
        ],
        proverka: [
          `$${d(d1)}$ см лежит в пределах для лампочки ($${d(d1min)}$–$${d(d1max)}$ см). Взять $d_1=${d(d1max)}$ см нельзя: тогда экран пришлось бы поставить ближе $${d(d2min)}$ см.`,
        ],
        answer: d1,
        ed: 'см',
      }),
      vychisleniya: sokrashchenie([f, d2min], raz, 'd_1'),
      hints: [
        chtoNayti('наибольшее расстояние $d_1$', ['фокусное расстояние', 'расстояние до экрана']),
        vopros('Какое $d_2$ взять, чтобы $d_1$ было наибольшим?', `наименьшее, $${d(d2min)}$ см`, [
          `наибольшее, $${d(d2max)}$ см`,
          `равное $f=${d(f)}$ см`,
        ]),
        vopros(
          'Можно ли сразу ответить $d_1=' + d(d1max) + '$ см?',
          'нет: экран тогда не помещается в свои пределы',
          ['да, это наибольшее допустимое $d_1$', 'да, если линза собирающая'],
        ),
        vKakihEdinicah('в сантиметрах', ['в метрах', 'в миллиметрах']),
      ],
    };
  },
};

/* ── Доля времени, когда скорость не больше заданной ──────────── */

/** Угол α ∈ (0°; 90°) по квадрату синуса и синус в TeX. */
const UGOL: Record<string, { u: number; tex: string }> = {
  '1/4': { u: 30, tex: '\\dfrac{1}{2}' },
  '1/2': { u: 45, tex: '\\dfrac{\\sqrt{2}}{2}' },
  '3/4': { u: 60, tex: '\\dfrac{\\sqrt{3}}{2}' },
};

/** Коэффициент k√m в TeX: «2\sqrt{2}», «4». */
function kKoren(k: number, m: number): string {
  if (m === 1) return d(k);
  return `${k === 1 ? '' : d(k)}\\sqrt{${m}}`;
}

/** Дробь Q·π в TeX: «\dfrac{\pi}{6}», «\dfrac{7\pi}{12}». */
function piTex(x: Q): string {
  const n = x.n === 1 ? '' : d(x.n);
  return x.m === 1 ? `${n}\\pi` : `\\dfrac{${n}\\pi}{${d(x.m)}}`;
}

/**
 * v(t) = A·sin(πt/T), A = k√m. Какую долю времени из первых τ секунд
 * скорость не больше c? На [0; τ] аргумент не доходит до π − α, поэтому
 * подходит только начальный участок [0; t₁]. Подвох — делить t₁ на τ,
 * а не на период и не брать вторую дугу синуса, которой ещё нет.
 */
export const PV10_DOLYA: Prototype = {
  id: 'PV10-DOLYA',
  no: 134,
  group: 'V',
  title: 'Колебания: какую долю времени скорость не больше заданной',
  formula: 'v=A\\sin\\dfrac{\\pi t}{T}',
  ask: 'долю времени, когда скорость не превышает заданную',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Поплавок качается на волнах',
  solve(p) {
    const ak = num(p, 'ak');
    const am = num(p, 'am');
    const c = num(p, 'c');
    const T = num(p, 'T');
    const tau = num(p, 'tau');
    const s2 = div(q(c * c), q(ak * ak * am));
    const ug = UGOL[`${s2.n}/${s2.m}`];
    if (ug === undefined) throw new Error(`PV10-DOLYA: sin² = ${fq(s2)} — не табличный`);
    const alfa = q(ug.u, 180);
    const t1 = mul(alfa, q(T));
    const t2 = sub(q(T), t1);
    const tauQ = q(tau);
    if (!(val(tauQ) > val(t1) && val(tauQ) < val(t2))) {
      throw new Error('PV10-DOLYA: τ должно лежать между t₁ и T − t₁');
    }
    const dolya = div(t1, tauQ);
    const ans = val(dolya);
    const A = kKoren(ak, am);
    const argTau = div(tauQ, q(T));
    const dn = [
      dano('A', A, 'см/с', 'наибольшая скорость'),
      dano('T', T, 'с', 'знаменатель в аргументе синуса'),
      dano('v', `\\le${d(c)}`, 'см/с', 'нужная скорость'),
      dano('\\tau', tau, 'с', 'рассматриваемое время'),
    ];
    return {
      answer: ans,
      iskomoe: '\\dfrac{t_1}{\\tau}',
      edinicy: '',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Нужно $${A}\\sin\\dfrac{\\pi t}{${d(T)}}\\le${d(c)}$, то есть $\\sin\\dfrac{\\pi t}{${d(T)}}\\le\\dfrac{${d(c)}}{${A}}=${ug.tex}$, при $0\\le t\\le${d(tau)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `Аргумент $x=\\dfrac{\\pi t}{${d(T)}}$ за первые $${d(tau)}$ с растёт от $0$ до $${piTex(argTau)}$.`,
          `$\\sin x=${ug.tex}$ при $x=${piTex(alfa)}$ и $x=${piTex(sub(q(1), alfa))}$. Синус не больше $${ug.tex}$ при $0\\le x\\le${piTex(alfa)}$ и снова — при $x\\ge${piTex(sub(q(1), alfa))}$, но до этого значения за $${d(tau)}$ с аргумент не доходит: $${piTex(argTau)}<${piTex(sub(q(1), alfa))}$.`,
          `$\\dfrac{\\pi t}{${d(T)}}\\le${piTex(alfa)}$, $t\\le${fq(t1)}$: скорость не больше $${d(c)}$ см/с первые $${fq(t1)}$ с.`,
          `Доля: $${fq(t1)}:${d(tau)}=${d(ans)}$.`,
        ],
        proverka: [
          `В начале движения тело разгоняется от нуля, поэтому скорость мала только на первом участке; дальше до $t=${d(tau)}$ с она больше $${d(c)}$ см/с. Доля $${d(ans)}$ меньше $1$ — так и должно быть.`,
        ],
        answer: ans,
        ed: '',
      }),
      vychisleniya: [
        { tekst: 'Синус:', tex: `\\dfrac{${d(c)}}{${A}}=${ug.tex}` },
        { tekst: 'Время:', tex: `t_1=${d(T)}\\cdot${fq(alfa)}=${fq(t1)}` },
      ],
      hints: [
        chtoNayti('долю первых $' + d(tau) + '$ с, когда $v\\le' + d(c) + '$', [
          'момент, когда $v=' + d(c) + '$',
          'наибольшую скорость',
        ]),
        vopros(
          'Какое неравенство на синус получится?',
          `$\\sin\\dfrac{\\pi t}{${d(T)}}\\le${ug.tex}$`,
          [
            `$\\sin\\dfrac{\\pi t}{${d(T)}}\\ge${ug.tex}$`,
            `$\\sin\\dfrac{\\pi t}{${d(T)}}\\le${d(c)}$`,
          ],
        ),
        vopros(
          'Есть ли второй промежуток с $v\\le' + d(c) + '$ за первые $' + d(tau) + '$ с?',
          `нет: он начинается при $t=${fq(t2)}>${d(tau)}$`,
          ['да, симметричный первому', 'да, весь конец промежутка'],
        ),
        vopros('На что делить найденное время?', `на $${d(tau)}$ с`, [
          `на $${d(2 * T)}$ с — период`,
          `на $${d(T)}$ с`,
        ]),
      ],
    };
  },
};
