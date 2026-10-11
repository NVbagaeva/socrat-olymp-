/**
 * Сюжеты аналогов, группа III (П-18 … П-21, П-30 … П-32): степени и корни.
 */

import type { Rng } from '../../vychisleniya/rng';
import type { Params } from '../types';
import { M, T, type GeneratorAnalogov } from './syuzhet-tip';

/* ── П-18 Разгон ────────────────────────────────────────────────── */

function razgonL(kto: string, gde: string) {
  return (p: Params) =>
    `${kto} разгоняется ${gde} с постоянным ускорением $a=${M(p.a)}$ км/ч². Скорость $v$ (в км/ч) вычисляется по формуле $v=\\sqrt{2la}$, где $l$ — пройденный путь (в км). Найдите, сколько километров будет пройдено к моменту, когда скорость станет равна ${T(p.v)} км/ч.`;
}

function razgonA(kto: string, gde: string) {
  return (p: Params) =>
    `${kto} разгоняется ${gde} с постоянным ускорением $a$ (в км/ч²). Скорость $v$ (в км/ч) вычисляется по формуле $v=\\sqrt{2la}$, где $l$ — пройденный путь (в км). Найдите ускорение, с которым нужно двигаться, чтобы, пройдя ${T(p.l)} км, приобрести скорость ${T(p.v)} км/ч. Ответ дайте в км/ч².`;
}

export const G_P18: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'avto-l',
      plot: 'автомобиль',
      modern: false,
      text: razgonL('Автомобиль', 'на прямолинейном участке шоссе'),
      params: { find: 'l' },
    },
    {
      key: 'avto-a',
      plot: 'автомобиль',
      modern: false,
      text: razgonA('Автомобиль', 'на прямолинейном участке шоссе'),
      params: { find: 'a' },
    },
    {
      key: 'elektrokar-l',
      plot: 'электрокар',
      modern: true,
      text: razgonL('Электрокар', 'на тестовой трассе'),
      params: { find: 'l' },
    },
    {
      key: 'bolid-a',
      plot: 'студенческий болид',
      modern: true,
      text: razgonA('Гоночный болид студенческой команды', 'на прямой трассы'),
      params: { find: 'a' },
    },
  ],
  gen(r, s): Params | null {
    if (s.params?.find === 'l') {
      const v = r.int(3, 15) * 10;
      const a = r.int(1, 30) * 500;
      const l = (v * v) / (2 * a);
      return Math.abs(l * 100 - Math.round(l * 100)) < 1e-9 && l >= 0.1 && l <= 2
        ? { a, v, find: 'l' }
        : null;
    }
    const v = r.int(3, 15) * 10;
    const l = r.int(1, 15) / 10;
    const a = (v * v) / (2 * l);
    return Number.isInteger(a) && a >= 1000 && a <= 40000 ? { l, v, find: 'a' } : null;
  },
  fizika: () => true,
};

/* ── П-19 Горизонт ──────────────────────────────────────────────── */

function gorizontKm(kto: string) {
  return (p: Params) =>
    `${kto} находится на высоте $h$ (в км). Расстояние $l$ (в км) от него до линии горизонта вычисляется по формуле $l=\\sqrt{2Rh}$, где $R=6400$ км — радиус Земли. На какой высоте находится ${kto.toLowerCase()}, если линия горизонта видна на расстоянии ${T(p.l)} км? Ответ дайте в км.`;
}

function gorizontM(kto: string) {
  return (p: Params) =>
    `${kto} находится на высоте $h$, выраженной в метрах. Расстояние от него до линии горизонта, выраженное в километрах, вычисляется по формуле $l=\\sqrt{\\dfrac{Rh}{500}}$, где $R=6400$ км — радиус Земли. На какой высоте находится ${kto.toLowerCase()}, если линия горизонта видна на расстоянии ${T(p.l)} км? Ответ дайте в метрах.`;
}

export const G_P19: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'nablyudatel',
      plot: 'наблюдатель на горе',
      modern: false,
      text: gorizontKm('Наблюдатель на горе'),
      params: { form: 'km' },
    },
    {
      key: 'mayak',
      plot: 'смотритель маяка',
      modern: false,
      text: gorizontM('Смотритель маяка'),
      params: { form: 'm' },
    },
    {
      key: 'mks',
      plot: 'космонавт на орбите',
      modern: true,
      text: gorizontKm('Космонавт на орбитальной станции'),
      params: { form: 'km' },
    },
    {
      key: 'dron',
      plot: 'дрон с камерой',
      modern: true,
      text: gorizontM('Дрон с камерой'),
      params: { form: 'm' },
    },
  ],
  gen(r, s): Params | null {
    if (s.params?.form === 'km') {
      const big = s.key === 'mks';
      const l = big ? r.int(100, 180) * 16 : r.int(2, 12) * 16;
      const h = (l * l) / 12800;
      return Math.abs(h * 1000 - Math.round(h * 1000)) < 1e-9 ? { R: 6400, l, form: 'km' } : null;
    }
    const k = s.key === 'dron' ? r.int(5, 30) : r.int(5, 60);
    const l = Math.round(k * 0.8 * 10) / 10;
    return { R: 6400, l, form: 'm' };
  },
  fizika: (p, ans) => (p.form === 'm' ? ans >= 1 && ans <= 600 : ans >= 0.05 && ans <= 450),
};

/* ── П-20 и П-30 Стефан — Больцман ──────────────────────────────── */

const SB_HEAD =
  'Для определения эффективной температуры звёзд используют закон Стефана — Больцмана, согласно которому мощность излучения $P$ (в ваттах) нагретого тела прямо пропорциональна площади его поверхности и четвёртой степени температуры: $P=\\sigma ST^4$, где $\\sigma=5{,}7\\cdot10^{-8}$ $\\dfrac{\\text{Вт}}{\\text{м}^2\\cdot\\text{К}^4}$ — постоянная, площадь $S$ измеряется в квадратных метрах, а температура $T$ — в кельвинах. ';

function sbText(kto: string, ge: boolean) {
  return (p: Params) =>
    SB_HEAD +
    (ge
      ? `Известно, что ${kto} имеет площадь поверхности $S=\\dfrac{1}{${M(p.Sden)}}\\cdot10^{${p.Sexp}}$ м², а излучаемая ею мощность $P$ не менее $${M(p.Pm)}\\cdot10^{${p.Pe}}$ Вт. Определите наименьшую возможную температуру. Ответ дайте в кельвинах.`
      : `Известно, что ${kto} имеет площадь поверхности $S=\\dfrac{1}{${M(p.Sden)}}\\cdot10^{${p.Sexp}}$ м², а излучаемая ею мощность $P$ равна $${M(p.Pm)}\\cdot10^{${p.Pe}}$ Вт. Определите температуру. Ответ дайте в кельвинах.`);
}

function sbGen(r: Rng) {
  const rT = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20]);
  const Sexp = r.pick([18, 19, 20, 21, 22]);
  const Sden = r.pick([2, 4, 5, 8, 10, 16, 18, 20, 25, 32, 50, 64, 81, 125, 128, 162, 250]);
  const C = (5.7 * rT ** 4) / Sden;
  let k = 0;
  let N = C;
  while (N >= 10) {
    N /= 10;
    k += 1;
  }
  while (N < 1) {
    N *= 10;
    k -= 1;
  }
  const Pm = Math.round(N * 10000) / 10000;
  if (Math.abs(Pm - N) > 1e-9) {
    return null;
  }
  return { sigmaM: 5.7, sigmaE: -8, Sden, Sexp, Pm, Pe: Sexp + 4 + k };
}

export const G_P20: GeneratorAnalogov = {
  syuzhety: [
    { key: 'zvezda', plot: 'звезда', modern: false, text: sbText('некоторая звезда', false) },
    {
      key: 'karlik',
      plot: 'красный карлик',
      modern: false,
      text: sbText('звезда — красный карлик —', false),
    },
    {
      key: 'teleskop',
      plot: 'космический телескоп',
      modern: true,
      text: sbText('звезда, которую изучает космический телескоп,', false),
    },
    {
      key: 'ekzoplaneta',
      plot: 'звезда с экзопланетой',
      modern: true,
      text: sbText('звезда, у которой нашли экзопланету,', false),
    },
  ],
  gen: (r) => {
    const g = sbGen(r);
    return g && { ...g, mode: 'eq' };
  },
  fizika: (_p, ans) => ans >= 2500 && ans <= 20000,
};

export const G_P30: GeneratorAnalogov = {
  syuzhety: [
    { key: 'zvezda', plot: 'звезда', modern: false, text: sbText('некоторая звезда', true) },
    { key: 'gigant', plot: 'звезда-гигант', modern: false, text: sbText('звезда-гигант', true) },
    {
      key: 'teleskop',
      plot: 'космический телескоп',
      modern: true,
      text: sbText('звезда из каталога космического телескопа', true),
    },
    {
      key: 'planetariy',
      plot: 'проект в планетарии',
      modern: true,
      text: sbText('звезда из школьного проекта в планетарии', true),
    },
  ],
  gen: (r) => {
    const g = sbGen(r);
    return g && { ...g, mode: 'ge' };
  },
  fizika: (_p, ans) => ans >= 2500 && ans <= 20000,
};

/* ── П-21, П-31, П-32 Адиабата ──────────────────────────────────── */

function adiabataDveText(chto: string, ge: boolean) {
  return (p: Params) =>
    `${chto} представляет собой сосуд с поршнем, резко сжимающим газ. При этом объём и давление связаны соотношением $p_1V_1^{1{,}4}=p_2V_2^{1{,}4}$, где $p_1$ и $p_2$ — давление газа (в атмосферах) в начальном и конечном состояниях, $V_1$ и $V_2$ — объём газа (в литрах). Изначально объём газа равен ${T(p.V1)} л, а давление — ${Number(p.p1) === 1 ? 'одной атмосфере' : `${T(p.p1)} атм`}. ${ge ? `Поршень выдерживает давление не более ${T(p.p2)} атм. До какого наименьшего объёма можно сжать газ?` : `До какого объёма нужно сжать газ, чтобы давление стало ${T(p.p2)} атм?`} Ответ дайте в литрах.`;
}

function adiabataConstText(chto: string, max: boolean) {
  return (p: Params) =>
    `${chto} выполняется закон $pV^k=${M(p.Cm)}\\cdot10^{${p.Ce}}$ Па·м⁵, где $p$ — давление газа (в Па), $V$ — объём газа (в м³), $k=\\dfrac{${M(p.kNum)}}{${M(p.kDen)}}$. ${max ? `Какой наибольший объём $V$ (в м³) может занимать газ при давлении не ниже $${M(p.pm)}\\cdot10^{${p.pe}}$ Па?` : `Найдите, какой объём $V$ (в м³) будет занимать газ при давлении $${M(p.pm)}\\cdot10^{${p.pe}}$ Па.`}`;
}

function genDve(r: Rng) {
  const p1 = r.pick([1, 1, 2, 0.5]);
  const V2 = r.int(1, 120) / 10;
  return { V1: Math.round(V2 * 32 * 10) / 10, p1, p2: p1 * 128, form: 'two' };
}

function genConst(r: Rng) {
  const [kn, kd] = r.pick([
    [5, 3],
    [4, 3],
  ] as const);
  const s = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.2, 1.5, 2, 2.5, 3, 4]);
  const x = s ** kn;
  const pm = r.pick([2, 2.5, 4, 5, 6.25, 8, 1.6, 3.2, 1.25]);
  const pe = r.int(4, 7);
  const C = x * pm;
  let Cm = C;
  let Ce = pe;
  while (Cm >= 10) {
    Cm /= 10;
    Ce += 1;
  }
  while (Cm < 1) {
    Cm *= 10;
    Ce -= 1;
  }
  const CmR = Math.round(Cm * 10000) / 10000;
  if (Math.abs(CmR - Cm) > 1e-9 || CmR === 1) {
    return null;
  }
  return { Cm: CmR, Ce, kNum: kn, kDen: kd, pm, pe, form: 'const' };
}

export const G_P21: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'ustanovka',
      plot: 'демонстрационная установка',
      modern: false,
      text: adiabataDveText('Установка для демонстрации адиабатического сжатия', false),
      params: { form: 'two' },
    },
    {
      key: 'gaz',
      plot: 'идеальный газ',
      modern: false,
      text: adiabataConstText('При адиабатическом процессе для идеального газа', false),
      params: { form: 'const' },
    },
    {
      key: 'ognivo',
      plot: 'пневматическое огниво',
      modern: true,
      text: adiabataDveText('Пневматическое огниво — опыт из научного шоу —', false),
      params: { form: 'two' },
    },
    {
      key: 'ballon',
      plot: 'баллон для дайвинга',
      modern: true,
      text: adiabataConstText('При быстром накачивании баллона для дайвинга для воздуха', false),
      params: { form: 'const' },
    },
  ],
  gen: (r, s) => (s.params?.form === 'two' ? genDve(r) : genConst(r)),
  fizika: (_p, ans) => ans > 0 && ans <= 30,
};

export const G_P31: GeneratorAnalogov = {
  syuzhety: [
    { key: 'nasos', plot: 'насос', modern: false, text: adiabataDveText('Поршневой насос', true) },
    {
      key: 'ustanovka',
      plot: 'установка',
      modern: false,
      text: adiabataDveText('Установка для демонстрации адиабатического сжатия', true),
    },
    {
      key: 'ognivo',
      plot: 'пневматическое огниво',
      modern: true,
      text: adiabataDveText('Пневматическое огниво из набора юного физика', true),
    },
    {
      key: 'velonasos',
      plot: 'велонасос',
      modern: true,
      text: adiabataDveText('Мощный насос для шин горного велосипеда', true),
    },
  ],
  gen: genDve,
  fizika: (_p, ans) => ans > 0 && ans <= 15,
};

export const G_P32: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'gaz',
      plot: 'одноатомный газ',
      modern: false,
      text: adiabataConstText('При адиабатическом сжатии идеального газа', true),
    },
    {
      key: 'cilindr',
      plot: 'цилиндр с газом',
      modern: false,
      text: adiabataConstText('В цилиндре двигателя при быстром сжатии газа', true),
    },
    {
      key: 'raketa',
      plot: 'модель ракеты',
      modern: true,
      text: adiabataConstText('При накачке воздуха в водяную модель ракеты', true),
    },
    {
      key: 'ballon',
      plot: 'баллон для пейнтбола',
      modern: true,
      text: adiabataConstText('При быстром заполнении баллона пейнтбольного маркера', true),
    },
  ],
  gen: genConst,
  fizika: (_p, ans) => ans > 0 && ans <= 30,
};
