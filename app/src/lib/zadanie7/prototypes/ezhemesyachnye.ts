/**
 * Прототипы раздела «Ежемесячные варианты» для задания №7. В общий
 * реестр PROTOTYPES не входят — в банк, тренажёр и генератор №7 не
 * попадают. Устроены как прототипы группы IV: разбор по тем же этапам
 * (`razbor`), подсказки — `hint`, проверка — подстановкой.
 */

import { d, hint, hintOtbor, num, razbor, uslovieTekst } from '../kit';
import type { Params, Prototype } from '../types';
import { logTex } from './gruppa4';

/** x² + px + q с коэффициентами-целыми: «x^2-3x-2». */
function trehchlen(pp: number, qq: number): string {
  const px = pp === 0 ? '' : `${pp < 0 ? '-' : '+'}${Math.abs(pp) === 1 ? '' : Math.abs(pp)}x`;
  const q = qq === 0 ? '' : `${qq < 0 ? '-' : '+'}${Math.abs(qq)}`;
  return `x^2${px}${q}`;
}

function uravnenieLog(p: Params): string {
  return `${logTex(num(p, 'a'))}(${trehchlen(num(p, 'p'), num(p, 'q'))})=${d(num(p, 'c'))}`;
}

/** Корни x² + px + (q − aᶜ) = 0 по возрастанию; дискриминант — точный квадрат. */
export function korniLogKv(p: Params): [number, number] {
  const a = num(p, 'a');
  const c = num(p, 'c');
  const B = num(p, 'p');
  const C = num(p, 'q') - a ** c;
  const D = B * B - 4 * C;
  const s = Math.round(Math.sqrt(D));
  if (D <= 0 || s * s !== D) throw new Error(`EV7-LOG-KVADRATNYY: D = ${D} — не квадрат`);
  return [(-B - s) / 2, (-B + s) / 2];
}

/**
 * log_a(x² + px + q) = c: по определению логарифма x² + px + q = aᶜ —
 * квадратное уравнение. Под логарифмом у обоих корней одно и то же
 * положительное число aᶜ, поэтому посторонних корней нет; подвох —
 * отбросить один корень «на всякий случай». Спрашивают меньший.
 */
export const EV7_LOG_KVADRATNYY: Prototype = {
  id: 'EV7-LOG-KVADRATNYY',
  no: 201,
  group: 'IV',
  title: 'Логарифм квадратного трёхчлена равен числу',
  formula: '\\log_a(x^2+px+q)=c',
  skills: ['log-opredelenie', 'diskriminant'],
  fipiNos: '',
  uravnenie: uravnenieLog,
  uslovie(p) {
    return uslovieTekst(uravnenieLog(p), 'menshiy');
  },
  vopros: () => 'menshiy',
  chisla(p) {
    const a = num(p, 'a');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const f = (x: number) => x * x + pp * x + qq;
    return {
      lhs: (x) => Math.log(f(x)) / Math.log(a),
      rhs: () => num(p, 'c'),
      odz: (x) => f(x) > 0,
    };
  },
  solve(p) {
    const a = num(p, 'a');
    const c = num(p, 'c');
    const pp = num(p, 'p');
    const qq = num(p, 'q');
    const N = a ** c;
    const [x1, x2] = korniLogKv(p);
    const T = trehchlen(pp, qq);
    const T0 = trehchlen(pp, qq - N);
    const D = pp * pp - 4 * (qq - N);
    const L = logTex(a);
    return {
      answer: x1,
      uravnenie: uravnenieLog(p),
      korni: [x1, x2],
      postoronnie: [],
      etapy: razbor({
        plan: [
          'Логарифм равен числу. По определению логарифма выражение под ним равно основанию в степени правой части — получится квадратное уравнение. Под логарифмом должно стоять положительное число.',
        ],
        odz: [`$${T}>0$.`],
        preobr: [
          `$${T}=${d(a)}^{${d(c)}}=${d(N)}$.`,
          `$${T0}=0$.`,
          `$D=${pp < 0 ? `(${pp})` : pp}^2-4\\cdot(${d(qq - N)})=${d(D)}=${d(Math.sqrt(D))}^2$.`,
        ],
        korni: [`$x=${d(x1)}$ или $x=${d(x2)}$.`],
        otbor: [
          `У обоих корней $${T}=${d(N)}>0$ — так мы их и получили, поэтому оба подходят.`,
          `Меньший из корней — $${d(x1)}$.`,
        ],
        proverka: [
          `$x=${d(x1)}$: $${L}(${d(x1 * x1)}${pp * x1 < 0 ? '' : '+'}${d(pp * x1)}${qq < 0 ? '' : '+'}${d(qq)})=${L}${d(N)}=${d(c)}$ — верно.`,
        ],
        answer: x1,
      }),
      vychisleniya: [{ tekst: 'Степень основания:', tex: `${d(a)}^{${d(c)}}=${d(N)}` }],
      hints: [
        hint(
          'Что следует из определения логарифма?',
          `$${T}=${d(N)}$`,
          [`$${T}=${d(a * c)}$`, `$${T}=${d(c)}$`],
          `$\\log_a b=c$ значит $a^c=b$; $${d(a)}^{${d(c)}}=${d(N)}$.`,
        ),
        hint('Какие корни у квадратного уравнения?', `$${d(x1)}$ и $${d(x2)}$`, [
          `$${d(-x1)}$ и $${d(-x2)}$`,
          `$${d(x2)}$`,
        ]),
        hintOtbor(
          'menshiy',
          `$${d(x1)}$`,
          [`$${d(x2)}$`, `$${d(-x1)}$`],
          `Под логарифмом у обоих корней $${d(N)}>0$ — посторонних нет, берём меньший.`,
        ),
      ],
    };
  },
};
