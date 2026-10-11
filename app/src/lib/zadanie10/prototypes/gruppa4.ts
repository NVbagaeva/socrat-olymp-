/**
 * Группа IV — показательные и логарифмические зависимости (П-22 … П-25).
 *
 * $2^{-t/T}$ — «сколько раз величина уменьшилась вдвое», $\log_2 x$ —
 * «сколько раз нужно удвоить, чтобы получить $x$». Во всех задачах
 * банка показатель выходит целым, поэтому ответ находится через
 * степени двойки, без калькулятора.
 */

import { div, mul, sub } from '../../zadanie11/num';
import {
  chtoNayti,
  d,
  dano,
  fq,
  log2Q,
  num,
  q,
  razbor,
  sokrashchenie,
  str,
  val,
  vKakihEdinicah,
  vopros,
  type Q,
} from '../kit';
import type { Prototype } from '../types';

function stepen2(x: Q, gde: string): number {
  const k = log2Q(x);
  if (k === null) {
    throw new Error(`${gde}: ${fq(x)} — не степень двойки`);
  }
  return k;
}

/** «2 раза», «3 раза», «5 раз». */
function raz(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'раза' : 'раз';
}

/* ── П-22 Радиоактивный распад ──────────────────────────────────── */

const P22: Prototype = {
  id: 'P22',
  no: 22,
  group: 'IV',
  title: 'Радиоактивный распад',
  formula: 'm(t)=m_0\\cdot2^{-\\frac{t}{T}}',
  ask: 'время, за которое масса уменьшится до заданной',
  skills: ['logarifm'],
  fipiNos: '109–114',
  alt: 'Песочные часы и капсула с изотопом, масса которого тает со временем',
  solve(p) {
    const m0 = num(p, 'm0');
    const T = num(p, 'T');
    const m = num(p, 'm');
    const r = div(q(m0), q(m));
    const k = stepen2(r, 'П-22');
    const t = k * T;
    return {
      answer: t,
      iskomoe: 't',
      edinicy: 'мин',
      dano: [
        dano('m_0', m0, 'мг', 'начальная масса'),
        dano('T', T, 'мин', 'период полураспада'),
        dano('m', m, 'мг', 'масса в конце'),
      ],
      etapy: razbor({
        dano: [
          dano('m_0', m0, 'мг', 'начальная масса'),
          dano('T', T, 'мин', 'период полураспада'),
          dano('m', m, 'мг', 'масса в конце'),
        ],
        ishchem: [`Ищем $t$. Подставляем: $${d(m)}=${d(m0)}\\cdot2^{-\\frac{t}{${d(T)}}}$.`],
        vid: 'uravnenie',
        reshaem: [
          `Делим на $${d(m0)}$: $2^{-\\frac{t}{${d(T)}}}=\\dfrac{${d(m)}}{${d(m0)}}=${fq(q(m, m0))}=2^{${-k}}$.`,
          `Основания равны — равны и показатели: $\\dfrac{t}{${d(T)}}=${k}$, $t=${k}\\cdot${d(T)}=${d(t)}$.`,
        ],
        proverka: [
          `Масса уменьшилась в $${fq(r)}=2^{${k}}$ ${raz(val(r))}, то есть вдвое — $${k}$ ${raz(k)}. Каждое «вдвое» — это один период $${d(T)}$ мин: $${k}\\cdot${d(T)}=${d(t)}$ мин.`,
        ],
        answer: t,
        ed: 'мин',
      }),
      vychisleniya: [
        { tekst: 'Во сколько раз уменьшилась масса:', tex: `\\dfrac{${d(m0)}}{${d(m)}}=${fq(r)}` },
        { tekst: 'Степени двойки удобно знать наизусть:', tex: `2^{${k}}=${fq(r)}` },
      ],
      hints: [
        chtoNayti('время $t$', ['массу $m$', 'период полураспада']),
        vopros('Во сколько раз уменьшилась масса?', `в $${fq(r)}$ ${raz(val(r))}`, [
          `в $${d(m0 - m)}$ раз`,
          `в $${d(T)}$ раз`,
        ]),
        vopros(
          `Сколько раз нужно уменьшить вдвое, чтобы уменьшить в $${fq(r)}$ ${raz(val(r))}?`,
          `$${k}$`,
          [`$${k + 1}$`, `$${fq(r)}$`],
        ),
        vKakihEdinicah('в минутах', ['в часах', 'в миллиграммах']),
      ],
    };
  },
};

/* ── П-23 Водолазный колокол ────────────────────────────────────── */

const P23: Prototype = {
  id: 'P23',
  no: 23,
  group: 'IV',
  title: 'Водолазный колокол',
  formula: 'A=\\alpha\\nu T\\log_2\\dfrac{p_2}{p_1}',
  ask: 'конечное давление или объём воздуха',
  skills: ['logarifm'],
  fipiNos: '123–130',
  alt: 'Водолазный колокол опускают на тросе на дно водоёма',
  solve(p) {
    const find = str(p, 'find', ['p2', 'V2'] as const);
    const nu = num(p, 'nu');
    const al = num(p, 'alpha');
    const T = num(p, 'T');
    const A = num(p, 'A');
    const prod = mul(mul(q(al), q(nu)), q(T));
    const k = val(div(q(A), prod));
    if (!Number.isInteger(k)) {
      throw new Error(`П-23: логарифм не целый (${k})`);
    }
    const v1 = find === 'p2' ? num(p, 'p1') : num(p, 'V1');
    const ans = find === 'p2' ? v1 * 2 ** k : val(div(q(v1), q(2 ** k)));
    const lg = find === 'p2' ? `\\log_2\\dfrac{p_2}{${d(v1)}}` : `\\log_2\\dfrac{${d(v1)}}{V_2}`;
    const dn = [
      dano('\\nu', nu, 'моль', 'количество воздуха'),
      find === 'p2'
        ? dano('p_1', v1, 'атм', 'начальное давление')
        : dano('V_1', v1, 'л', 'начальный объём'),
      dano('\\alpha', al, 'Дж/(моль·К)', 'постоянная'),
      dano('T', T, 'К', 'температура'),
      dano('A', A, 'Дж', 'работа воды'),
    ];
    return {
      answer: ans,
      iskomoe: find === 'p2' ? 'p_2' : 'V_2',
      edinicy: find === 'p2' ? 'атм' : 'л',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем $${find === 'p2' ? 'p_2' : 'V_2'}$. Подставляем: $${d(A)}=${d(al)}\\cdot${d(nu)}\\cdot${d(T)}\\cdot${lg}$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$${d(al)}\\cdot${d(nu)}\\cdot${d(T)}=${fq(prod, true)}$, поэтому $${lg}=\\dfrac{${d(A)}}{${fq(prod, true)}}=${d(k)}$.`,
          find === 'p2'
            ? `По определению логарифма: $\\dfrac{p_2}{${d(v1)}}=2^{${k}}=${d(2 ** k)}$, $p_2=${d(v1)}\\cdot${d(2 ** k)}=${d(ans)}$.`
            : `По определению логарифма: $\\dfrac{${d(v1)}}{V_2}=2^{${k}}=${d(2 ** k)}$, $V_2=\\dfrac{${d(v1)}}{${d(2 ** k)}}=${d(ans)}$.`,
        ],
        proverka: [
          find === 'p2'
            ? `Колокол опускают глубже — давление растёт: $${d(ans)}>${d(v1)}$ атм. Сходится.`
            : `Воздух сжимается — объём уменьшается: $${d(ans)}<${d(v1)}$ л. Сходится.`,
        ],
        answer: ans,
        ed: find === 'p2' ? 'атм' : 'л',
      }),
      vychisleniya: sokrashchenie([A], val(prod), '\\log_2'),
      hints: [
        chtoNayti(find === 'p2' ? 'давление $p_2$' : 'объём $V_2$', [
          'работу $A$',
          'температуру $T$',
        ]),
        vopros('Чему равен логарифм?', `$${d(k)}$`, [`$${d(2 ** k)}$`, `$${d(k + 1)}$`]),
        vopros(`Что значит $\\log_2 x=${k}$?`, `$x=2^{${k}}=${d(2 ** k)}$`, [
          `$x=${d(2 * k)}$`,
          `$x=${k}^2$`,
        ]),
        vKakihEdinicah(find === 'p2' ? 'в атмосферах' : 'в литрах', ['в джоулях', 'в кельвинах']),
      ],
    };
  },
};

/* ── П-24 Конденсатор телевизора ────────────────────────────────── */

const P24: Prototype = {
  id: 'P24',
  no: 24,
  group: 'IV',
  title: 'Разряд конденсатора',
  formula: 't=\\alpha RC\\log_2\\dfrac{U_0}{U}',
  ask: 'наибольшее напряжение через заданное время',
  skills: ['logarifm'],
  fipiNos: '131–134',
  alt: 'Плата с высоковольтным конденсатором и резистором внутри выключенного устройства',
  solve(p) {
    const Cm = num(p, 'Cm');
    const Rm = num(p, 'Rm');
    const U0 = num(p, 'U0');
    const al = num(p, 'alpha');
    const t = num(p, 't');
    const RC = Cm * Rm;
    const aRC = mul(q(al), q(RC));
    const k = val(div(q(t), aRC));
    if (!Number.isInteger(k)) {
      throw new Error(`П-24: логарифм не целый (${k})`);
    }
    const U = val(div(q(U0), q(2 ** k)));
    const dn = [
      dano('C', `${d(Cm)}\\cdot10^{-6}`, 'Ф', 'ёмкость'),
      dano('R', `${d(Rm)}\\cdot10^{6}`, 'Ом', 'сопротивление'),
      dano('U_0', U0, 'кВ', 'напряжение во время работы'),
      dano('\\alpha', al, '', 'постоянная'),
      dano('t', `\\ge${d(t)}`, 'с', 'время после выключения'),
    ];
    return {
      answer: U,
      iskomoe: 'U',
      edinicy: 'кВ',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем наибольшее $U$. Условие: $${d(al)}\\cdot${d(Rm)}\\cdot10^6\\cdot${d(Cm)}\\cdot10^{-6}\\cdot\\log_2\\dfrac{${d(U0)}}{U}\\ge${d(t)}$.`,
          'Чем больше прошло времени, тем сильнее разрядился конденсатор. Наибольшее напряжение — в граничный момент, решаем равенство.',
        ],
        vid: 'uravnenie',
        reshaem: [
          `$10^6$ и $10^{-6}$ сокращаются: $${d(al)}\\cdot${d(RC)}=${fq(aRC, true)}$. Тогда $\\log_2\\dfrac{${d(U0)}}{U}=\\dfrac{${d(t)}}{${fq(aRC, true)}}=${k}$.`,
          `$\\dfrac{${d(U0)}}{U}=2^{${k}}=${d(2 ** k)}$, $U=\\dfrac{${d(U0)}}{${d(2 ** k)}}=${d(U)}$.`,
          `При $t\\ge${d(t)}$ с напряжение $U\\le${d(U)}$ кВ.`,
        ],
        proverka: [
          `За $${d(t)}$ с напряжение упало в $${d(2 ** k)}$ ${raz(2 ** k)} — конденсатор разряжается, всё логично.`,
        ],
        answer: U,
        ed: 'кВ',
      }),
      vychisleniya: [
        {
          tekst: 'Множители $10^6$ и $10^{-6}$ дают $1$:',
          tex: `${d(Rm)}\\cdot10^6\\cdot${d(Cm)}\\cdot10^{-6}=${d(RC)}`,
        },
        {
          tekst: 'Деление десятичных дробей — умножаем на 10:',
          tex: `\\dfrac{${d(t)}}{${fq(aRC, true)}}=${k}`,
        },
      ],
      hints: [
        chtoNayti('наибольшее напряжение $U$', ['время $t$', 'ёмкость $C$']),
        vopros('Что делать с $10^6$ и $10^{-6}$?', 'они сокращаются', [
          'складываются в $10^{12}$',
          'дают $10^0=10$',
        ]),
        vopros(`Чему равен $\\log_2\\dfrac{U_0}{U}$?`, `$${k}$`, [`$${d(2 ** k)}$`, `$${d(t)}$`]),
        vKakihEdinicah('в киловольтах', ['в вольтах', 'в секундах']),
      ],
    };
  },
};

/* ── П-25 Радиатор отопления ────────────────────────────────────── */

const P25: Prototype = {
  id: 'P25',
  no: 25,
  group: 'IV',
  title: 'Радиатор отопления',
  formula:
    'x=\\alpha\\dfrac{cm}{\\gamma}\\log_2\\dfrac{T_{\\text{в}}-T_{\\text{п}}}{T-T_{\\text{п}}}',
  ask: 'температуру воды на выходе',
  skills: ['logarifm'],
  fipiNos: '135–138',
  alt: 'Батарея отопления в комнате, по трубе течёт горячая вода',
  solve(p) {
    const Tp = num(p, 'Tp');
    const m = num(p, 'm');
    const Tv = num(p, 'Tv');
    const c = num(p, 'c');
    const g = num(p, 'gamma');
    const al = num(p, 'alpha');
    const x = num(p, 'x');
    const koef = div(mul(mul(q(al), q(c)), q(m)), q(g));
    const k = val(div(q(x), koef));
    if (!Number.isInteger(k)) {
      throw new Error(`П-25: логарифм не целый (${k})`);
    }
    const dT = Tv - Tp;
    const T = val(sub(q(Tp), q(-dT, 2 ** k)));
    const dn = [
      dano('T_{\\text{п}}', Tp, '°C', 'температура в комнате'),
      dano('T_{\\text{в}}', Tv, '°C', 'температура воды на входе'),
      dano('m', m, 'кг/с', 'расход воды'),
      dano('c', c, 'Вт·с/(кг·°C)', 'теплоёмкость воды'),
      dano('\\gamma', g, 'Вт/(м·°C)', 'коэффициент теплообмена'),
      dano('\\alpha', al, '', 'постоянная'),
      dano('x', x, 'м', 'длина трубы'),
    ];
    return {
      answer: T,
      iskomoe: 'T',
      edinicy: '°C',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем $T$. Сначала посчитаем множитель перед логарифмом: $\\alpha\\dfrac{cm}{\\gamma}=${d(al)}\\cdot\\dfrac{${d(c)}\\cdot${d(m)}}{${d(g)}}=${fq(koef, true)}$.`,
          `Подставляем: $${d(x)}=${fq(koef, true)}\\cdot\\log_2\\dfrac{${d(Tv)}-${d(Tp)}}{T-${d(Tp)}}$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$\\log_2\\dfrac{${d(dT)}}{T-${d(Tp)}}=\\dfrac{${d(x)}}{${fq(koef, true)}}=${k}$.`,
          `$\\dfrac{${d(dT)}}{T-${d(Tp)}}=2^{${k}}=${d(2 ** k)}$, $T-${d(Tp)}=\\dfrac{${d(dT)}}{${d(2 ** k)}}=${fq(q(dT, 2 ** k), true)}$.`,
          `$T=${d(Tp)}+${fq(q(dT, 2 ** k), true)}=${d(T)}$.`,
        ],
        proverka: [
          `Вода остыла с $${d(Tv)}\\,^\\circ\\text{C}$ до $${d(T)}\\,^\\circ\\text{C}$, но осталась теплее воздуха вокруг ($${d(Tp)}\\,^\\circ\\text{C}$) — так и работает радиатор.`,
        ],
        answer: T,
        ed: '°C',
      }),
      vychisleniya: sokrashchenie(
        [c, q(m).n, q(al).n],
        g * q(m).m * q(al).m,
        '\\alpha\\dfrac{cm}{\\gamma}',
      ),
      hints: [
        chtoNayti('температуру воды $T$', ['длину трубы', 'температуру в комнате']),
        vopros(
          'Что удобно посчитать первым?',
          'множитель $\\alpha\\dfrac{cm}{\\gamma}$ перед логарифмом',
          ['логарифм', 'разность температур'],
        ),
        vopros('Чему равен логарифм?', `$${k}$`, [`$${d(2 ** k)}$`, `$${k + 1}$`]),
        vKakihEdinicah('в градусах Цельсия', ['в кельвинах', 'в метрах']),
      ],
    };
  },
};

export const GRUPPA_IV: Prototype[] = [P22, P23, P24, P25];
