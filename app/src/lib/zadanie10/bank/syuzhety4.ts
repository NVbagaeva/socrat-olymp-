/**
 * Сюжеты аналогов, группа IV (П-22 … П-25): показательные и
 * логарифмические зависимости. Показатель степени двойки — целый.
 */

import type { Params } from '../types';
import { M, T, type GeneratorAnalogov } from './syuzhet-tip';

/* ── П-22 Распад ────────────────────────────────────────────────── */

function raspadText(chto: string) {
  return (p: Params) =>
    `В ходе распада ${chto} его масса $m$ (в мг) уменьшается по закону $m(t)=m_0\\cdot2^{-\\frac{t}{T}}$, где $m_0$ (мг) — начальная масса, $t$ (мин.) — время, прошедшее от начального момента, $T$ (мин.) — период полураспада. В начальный момент времени масса $m_0=${M(p.m0)}$ мг. Период полураспада $T=${M(p.T)}$ мин. Через сколько минут масса будет равна ${T(p.m)} мг?`;
}

export const G_P22: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'izotop',
      plot: 'радиоактивный изотоп',
      modern: false,
      text: raspadText('радиоактивного изотопа'),
    },
    {
      key: 'laboratoriya',
      plot: 'лабораторный образец',
      modern: false,
      text: raspadText('образца радиоактивного вещества в лаборатории'),
    },
    {
      key: 'pet',
      plot: 'изотоп для томографии',
      modern: true,
      text: raspadText('медицинского изотопа для позитронной томографии'),
    },
    {
      key: 'uskoritel',
      plot: 'изотоп с ускорителя',
      modern: true,
      text: raspadText('изотопа, полученного на ускорителе для школьной научной экспедиции,'),
    },
  ],
  gen(r): Params | null {
    const k = r.int(1, 6);
    const T = r.int(2, 25);
    const m = r.pick([1, 2, 2.5, 3, 4, 5, 6, 7.5, 9, 10, 12, 12.5, 15, 1.5]);
    const m0 = m * 2 ** k;
    return m0 <= 640 ? { m0, T, m } : null;
  },
  fizika: () => true,
};

/* ── П-23 Колокол ───────────────────────────────────────────────── */

function kolokolP(chto: string) {
  return (p: Params) =>
    `${chto}, содержащий $\\nu=${M(p.nu)}$ моль воздуха при давлении $p_1=${M(p.p1)}$ атм, медленно опускают на дно водоёма. При этом происходит изотермическое сжатие воздуха до конечного давления $p_2$. Работа, совершаемая водой при сжатии воздуха, определяется выражением $A=\\alpha\\nu T\\log_2\\dfrac{p_2}{p_1}$, где $\\alpha=${M(p.alpha)}$ $\\dfrac{\\text{Дж}}{\\text{моль}\\cdot\\text{К}}$ — постоянная, $T=300$ К — температура воздуха. Найдите, какое давление $p_2$ (в атм) будет иметь воздух, если при сжатии была совершена работа в ${T(p.A)} Дж.`;
}

function kolokolV(chto: string) {
  return (p: Params) =>
    `${chto}, содержащий в начальный момент $\\nu=${M(p.nu)}$ моль воздуха объёмом $V_1=${M(p.V1)}$ л, медленно опускают на дно водоёма. При этом происходит изотермическое сжатие воздуха до конечного объёма $V_2$ (в л). Работа, совершаемая водой при сжатии воздуха, вычисляется по формуле $A=\\alpha\\nu T\\log_2\\dfrac{V_1}{V_2}$, где $\\alpha=${M(p.alpha)}$ $\\dfrac{\\text{Дж}}{\\text{моль}\\cdot\\text{К}}$ — постоянная, $T=300$ К — температура воздуха. Найдите, какой объём $V_2$ будет занимать воздух, если при сжатии была совершена работа в ${T(p.A)} Дж. Ответ дайте в литрах.`;
}

export const G_P23: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'kolokol-p',
      plot: 'водолазный колокол',
      modern: false,
      text: kolokolP('Водолазный колокол'),
      params: { find: 'p2' },
    },
    {
      key: 'kolokol-v',
      plot: 'водолазный колокол',
      modern: false,
      text: kolokolV('Водолазный колокол'),
      params: { find: 'V2' },
    },
    {
      key: 'dom-p',
      plot: 'подводная лаборатория',
      modern: true,
      text: kolokolP('Модуль подводной лаборатории'),
      params: { find: 'p2' },
    },
    {
      key: 'dayving-v',
      plot: 'купол для дайверов',
      modern: true,
      text: kolokolV('Прозрачный купол для отдыха дайверов'),
      params: { find: 'V2' },
    },
  ],
  gen(r, s): Params | null {
    const k = r.int(1, 4);
    const nu = r.int(1, 8);
    const alpha = r.int(40, 200) / 10;
    const A = Math.round(alpha * nu * 300 * k * 1000) / 1000;
    if (!Number.isInteger(A)) {
      return null;
    }
    if (s.params?.find === 'p2') {
      const p1 = r.int(10, 30) / 10;
      return p1 * 2 ** k <= 25 ? { nu, p1, alpha, T: 300, A, find: 'p2' } : null;
    }
    const V2 = r.pick([2, 2.5, 3, 4, 5, 6, 7.5, 8, 10, 12, 15, 1.5]);
    return { nu, V1: V2 * 2 ** k, alpha, T: 300, A, find: 'V2' };
  },
  fizika: () => true,
};

/* ── П-24 Конденсатор ───────────────────────────────────────────── */

function kondText(gde: string) {
  return (p: Params) =>
    `Ёмкость высоковольтного конденсатора ${gde} $C=${M(p.Cm)}\\cdot10^{-6}$ Ф. Параллельно с конденсатором подключён резистор с сопротивлением $R=${M(p.Rm)}\\cdot10^6$ Ом. Во время работы напряжение на конденсаторе $U_0=${M(p.U0)}$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время, определяемое выражением $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=${M(p.alpha)}$ — постоянная. Определите наибольшее возможное напряжение на конденсаторе, если после выключения прошло не менее ${T(p.t)} с. Ответ дайте в кВ (киловольтах).`;
}

export const G_P24: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'televizor',
      plot: 'телевизор',
      modern: false,
      text: kondText('в старом ламповом телевизоре'),
    },
    {
      key: 'rentgen',
      plot: 'рентгеновский аппарат',
      modern: false,
      text: kondText('в рентгеновском аппарате'),
    },
    {
      key: 'defibrillyator',
      plot: 'дефибриллятор',
      modern: true,
      text: kondText('в учебном дефибрилляторе'),
    },
    {
      key: 'lazer',
      plot: 'лазерная установка',
      modern: true,
      text: kondText('в импульсной лазерной установке для лазерного шоу'),
    },
  ],
  gen(r): Params | null {
    const k = r.int(1, 5);
    const Cm = r.int(1, 8);
    const Rm = r.int(2, 8);
    const alpha = r.int(5, 20) / 10;
    const t = Math.round(alpha * Cm * Rm * k * 100) / 100;
    const U = r.pick([0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 0.25]);
    const U0 = U * 2 ** k;
    return U0 <= 40 && Number.isInteger(U0 * 2) ? { Cm, Rm, U0, alpha, t } : null;
  },
  fizika: () => true,
};

/* ── П-25 Радиатор ──────────────────────────────────────────────── */

function radiatorText(nachalo: string) {
  return (p: Params) =>
    `${nachalo.replace('{Tp}', `$T_{\\text{п}}=${M(p.Tp)}\\,^\\circ\\text{C}$`)} Расход воды $m=${M(p.m)}$ кг/с. Проходя по трубе расстояние $x$, вода охлаждается от начальной температуры $T_{\\text{в}}=${M(p.Tv)}\\,^\\circ\\text{C}$ до температуры $T$ (°C), причём $x=\\alpha\\dfrac{cm}{\\gamma}\\log_2\\dfrac{T_{\\text{в}}-T_{\\text{п}}}{T-T_{\\text{п}}}$, где $c=4200$ $\\dfrac{\\text{Вт}\\cdot\\text{с}}{\\text{кг}\\cdot{}^\\circ\\text{C}}$ — теплоёмкость воды, $\\gamma=${M(p.gamma)}$ $\\dfrac{\\text{Вт}}{\\text{м}\\cdot{}^\\circ\\text{C}}$ — коэффициент теплообмена, $\\alpha=${M(p.alpha)}$ — постоянная. Найдите, до какой температуры (в градусах Цельсия) охладится вода, если длина трубы равна ${T(p.x)} м.`;
}

export const G_P25: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'radiator',
      plot: 'радиатор отопления',
      modern: false,
      text: radiatorText(
        'Для обогрева помещения, температура в котором поддерживается на уровне {Tp}, через радиатор отопления пропускают горячую воду.',
      ),
    },
    {
      key: 'teplica',
      plot: 'теплица',
      modern: false,
      text: radiatorText(
        'Для обогрева теплицы, температура в которой поддерживается на уровне {Tp}, через трубу отопления пропускают горячую воду.',
      ),
    },
    {
      key: 'pol',
      plot: 'тёплый пол',
      modern: true,
      text: radiatorText(
        'Для обогрева комнаты, температура в которой поддерживается на уровне {Tp}, через трубу водяного тёплого пола пропускают горячую воду.',
      ),
    },
    {
      key: 'pk',
      plot: 'водяное охлаждение ПК',
      modern: true,
      text: radiatorText(
        'В системе водяного охлаждения игрового компьютера нагретая вода проходит через медную трубку радиатора, обдуваемого воздухом температуры {Tp}.',
      ),
    },
  ],
  gen(r, s): Params | null {
    const k = r.int(1, 3);
    const Tp = s.key === 'pk' ? r.int(25, 35) : r.int(15, 25);
    const dT = r.pick([16, 24, 32, 40, 48, 56, 64, 72, 8, 12, 20, 28, 36, 44, 52, 60]);
    if (!Number.isInteger(dT / 2 ** k) || Tp + dT > 95) {
      return null;
    }
    const m =
      s.key === 'pk' ? r.pick([0.02, 0.025, 0.05]) : r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6]);
    const gamma = r.int(14, 84);
    const alpha = r.int(5, 20) / 10;
    const x = Math.round(((alpha * 4200 * m) / gamma) * k * 1000) / 1000;
    return Number.isInteger(x) && x >= 2 && x <= 250
      ? { Tp, m, Tv: Tp + dT, c: 4200, gamma, alpha, x }
      : null;
  },
  fizika: () => true,
};
