/**
 * Сюжеты аналогов, группа V (П-26 … П-29, П-33, П-34): тригонометрия.
 * Все углы табличные, поэтому у П-26, П-28, П-29 разных ответов мало —
 * это исключения из правила «не меньше 12 разных ответов» (см. ISKLYUCHENIYA).
 */

import type { Params } from '../types';
import { M, T, type GeneratorAnalogov } from './syuzhet-tip';

/* ── П-26 Время полёта ──────────────────────────────────────────── */

function poletText(chto: string) {
  return (p: Params) =>
    `${chto} бросили под углом $\\alpha$ к плоской горизонтальной поверхности земли. Время полёта (в секундах) определяется по формуле $t=\\dfrac{2v_0\\sin\\alpha}{g}$. При каком наименьшем значении угла $\\alpha$ (в градусах) время полёта будет не меньше ${T(p.t)} с, если начальная скорость $v_0=${M(p.v0)}$ м/с? Считайте, что ускорение свободного падения $g=10$ м/с².`;
}

export const G_P26: GeneratorAnalogov = {
  syuzhety: [
    { key: 'myach', plot: 'мяч', modern: false, text: poletText('Мяч') },
    { key: 'kamen', plot: 'камень', modern: false, text: poletText('Камень') },
    { key: 'frisbi', plot: 'мяч для регби', modern: true, text: poletText('Мяч для регби') },
    { key: 'padel', plot: 'мяч в паделе', modern: true, text: poletText('Мяч для падел-тенниса') },
  ],
  gen(r): Params | null {
    const v0 = r.int(6, 30);
    const s = r.pick([1, 2, 2, 2]);
    const t = s === 2 ? v0 / 10 : v0 / 5;
    return { t, v0, g: 10 };
  },
  fizika: () => true,
};

/* ── П-27 Груз на пружине ───────────────────────────────────────── */

function pruzhinaText(chto: string, fn: 'sin' | 'cos') {
  const start = fn === 'sin' ? 'начала колебаний' : 'начала наблюдения';
  return (p: Params) =>
    `${chto} массой ${T(p.m)} кг колеблется на пружине. Его скорость $v$ (в м/с) меняется по закону $v=v_0\\${fn}\\dfrac{2\\pi t}{T}$, где $t$ — время с момента ${start} в секундах, $T=${M(p.T)}$ с — период колебаний, $v_0=${M(p.v0)}$ м/с. Кинетическая энергия $E$ (в Дж) вычисляется по формуле $E=\\dfrac{mv^2}{2}$, где $m$ — масса (в кг), $v$ — скорость (в м/с). Найдите кинетическую энергию через ${T(p.t)} с после ${start}. Ответ дайте в джоулях.`;
}

export const G_P27: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'gruz-sin',
      plot: 'груз на пружине',
      modern: false,
      text: pruzhinaText('Груз', 'sin'),
      params: { fn: 'sin' },
    },
    {
      key: 'gruz-cos',
      plot: 'груз на пружине',
      modern: false,
      text: pruzhinaText('Груз', 'cos'),
      params: { fn: 'cos' },
    },
    {
      key: 'smartfon',
      plot: 'смартфон на пружинном держателе',
      modern: true,
      text: pruzhinaText('Смартфон в пружинном держателе велосипеда', 'sin'),
      params: { fn: 'sin' },
    },
    {
      key: 'igrushka',
      plot: 'игрушка-попрыгунчик',
      modern: true,
      text: pruzhinaText('Брелок-попрыгунчик', 'cos'),
      params: { fn: 'cos' },
    },
  ],
  gen(r, s): Params | null {
    const m = r.pick([0.1, 0.16, 0.2, 0.25, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 2, 2.5]);
    const v0 = r.pick([0.2, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 3]);
    const T = r.pick([2, 3, 4, 6, 8, 12, 24]);
    /* Угол 360·t/T кратен 30° или 45°. */
    const t = r.int(1, 40);
    const theta = (360 * t) / T;
    if (!Number.isInteger(theta / 30) && !Number.isInteger(theta / 45)) {
      return null;
    }
    const red = theta % 180;
    if (red === 0 || red === 90) {
      return null;
    }
    return { m, T, v0, t, fn: String(s.params?.fn) };
  },
  fizika: (_p, ans) => ans > 0 && ans <= 10,
};

/* ── П-28 Соударение ────────────────────────────────────────────── */

function udarText(chto: string) {
  return (p: Params) =>
    `${chto} массой $m=${M(p.m)}$ кг каждое движутся с одинаковой скоростью $v=${M(p.v)}$ м/с под углом $2\\alpha$ друг к другу. Энергия (в Дж), выделяющаяся при их абсолютно неупругом соударении, вычисляется по формуле $Q=mv^2\\sin^2\\alpha$. Найдите, под каким углом $2\\alpha$ должны двигаться тела, чтобы при соударении выделилась энергия, равная ${T(p.Q)} Дж. Ответ дайте в градусах.`;
}

export const G_P28: GeneratorAnalogov = {
  syuzhety: [
    { key: 'tela', plot: 'два тела', modern: false, text: udarText('Два тела') },
    {
      key: 'shary',
      plot: 'пластилиновые шары',
      modern: false,
      text: udarText('Два пластилиновых шара'),
    },
    { key: 'roboty', plot: 'роботы-сумоисты', modern: true, text: udarText('Два робота-сумоиста') },
    {
      key: 'kerling',
      plot: 'шайбы аэрохоккея',
      modern: true,
      text: udarText('Две липкие шайбы на столе для аэрохоккея'),
    },
  ],
  gen(r): Params | null {
    const m = r.int(1, 12);
    const v = r.int(2, 12);
    const s2 = r.pick([0.25, 0.5, 0.75, 1, 0.25, 0.5, 0.75]);
    const Q = m * v * v * s2;
    return Number.isInteger(Q * 100) ? { m, v, Q } : null;
  },
  fizika: () => true,
};

/* ── П-29 Мячик над стеной ──────────────────────────────────────── */

function stenaText(chto: string, kto: string, nad: string) {
  return (p: Params) =>
    `${chto} бросают под острым углом $\\alpha$ к плоской горизонтальной поверхности земли. Максимальная высота полёта $H$ (в м) вычисляется по формуле $H=\\dfrac{v_0^2}{4g}(1-\\cos2\\alpha)$, где $v_0=${M(p.v0)}$ м/с — начальная скорость, а $g$ — ускорение свободного падения (считайте $g=10$ м/с²). При каком наименьшем значении угла $\\alpha$ ${kto} пролетит над ${nad} ${T(p.h)} м на расстоянии 1 м? Ответ дайте в градусах.`;
}

export const G_P29: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'stena',
      plot: 'мячик над стеной',
      modern: false,
      text: stenaText('Небольшой мячик', 'мячик', 'стеной высотой'),
    },
    {
      key: 'zabor',
      plot: 'мяч над забором',
      modern: false,
      text: stenaText('Мяч', 'мяч', 'забором стадиона высотой'),
    },
    {
      key: 'skalodrom',
      plot: 'мяч над скалодромом',
      modern: true,
      text: stenaText('Мяч из тренировочной пушки', 'мяч', 'стеной скалодрома высотой'),
    },
    {
      key: 'dron',
      plot: 'мяч над дроном',
      modern: true,
      text: stenaText('Мяч для фрисби-гольфа', 'мяч', 'дроном, зависшим на высоте'),
    },
  ],
  gen(r): Params | null {
    const v0 = r.int(8, 36);
    const k = r.pick([0.5, 1, 1.5]);
    const H = (k * v0 * v0) / 40;
    const h = Math.round((H - 1) * 100) / 100;
    if (Math.abs(h - (H - 1)) > 1e-9 || h < 1.5 || h > 30) {
      return null;
    }
    return { v0, g: 10, h, gap: 1 };
  },
  fizika: () => true,
};

/* ── П-33 Дифракционная решётка ─────────────────────────────────── */

function difrUgol(chto: string) {
  return (p: Params) =>
    `При нормальном падении света с длиной волны $\\lambda=${M(p.lambda)}$ нм на ${chto} с периодом $d$ нм наблюдают серию дифракционных максимумов. Угол $\\varphi$ (от перпендикуляра к решётке), под которым наблюдается максимум, и номер максимума $k$ связаны соотношением $d\\sin\\varphi=k\\lambda$. Под каким наименьшим углом $\\varphi$ (в градусах) можно наблюдать ${Number(p.k) === 1 ? 'первый' : Number(p.k) === 2 ? 'второй' : 'третий'} максимум на решётке с периодом, не превосходящим ${T(p.dmax)} нм?`;
}

function difrPeriod(chto: string) {
  return (p: Params) =>
    `При нормальном падении света с длиной волны $\\lambda=${M(p.lambda)}$ нм на ${chto} с периодом $d$ нм наблюдают серию дифракционных максимумов. Угол $\\varphi$, под которым наблюдается максимум, и номер максимума $k$ связаны соотношением $d\\sin\\varphi=k\\lambda$. При каком наименьшем периоде $d$ (в нм) ${Number(p.k) === 1 ? 'первый' : Number(p.k) === 2 ? 'второй' : 'третий'} максимум будет виден под углом не больше $${M(p.phi)}^\\circ$?`;
}

export const G_P33: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'reshetka-ugol',
      plot: 'дифракционная решётка',
      modern: false,
      text: difrUgol('дифракционную решётку'),
      params: { form: 'ugol' },
    },
    {
      key: 'reshetka-period',
      plot: 'дифракционная решётка',
      modern: false,
      text: difrPeriod('дифракционную решётку'),
      params: { form: 'period' },
    },
    {
      key: 'cd',
      plot: 'CD-диск и лазерная указка',
      modern: true,
      text: difrUgol('дорожки компакт-диска (они работают как решётка)'),
      params: { form: 'ugol' },
    },
    {
      key: 'lazer',
      plot: 'лазерная указка',
      modern: true,
      text: difrPeriod('решётку из набора для опытов с лазерной указкой'),
      params: { form: 'period' },
    },
  ],
  gen(r, s): Params | null {
    const lambda = r.int(40, 70) * 10;
    const k = r.int(1, 3);
    if (s.params?.form === 'ugol') {
      const sn = r.pick([2, 2, 1]);
      return { lambda, k, dmax: k * lambda * sn, form: 'ugol' };
    }
    const phi = 30;
    return { lambda, k, phi, form: 'period' };
  },
  fizika: () => true,
};

/* ── П-34 Доля периода ──────────────────────────────────────────── */

function dolyaText(chto: string) {
  return (p: Params) =>
    `${chto} массой ${T(p.m)} кг колеблется на пружине. Его скорость меняется по закону $v=${M(p.v0)}\\sin\\dfrac{2\\pi t}{${M(p.T)}}$, где $t$ — время в секундах. Кинетическая энергия (в Дж) вычисляется по формуле $E=\\dfrac{mv^2}{2}$. Сколько секунд в течение первых ${T(p.T)} с кинетическая энергия будет не менее ${T(p.E0)} Дж?`;
}

export const G_P34: GeneratorAnalogov = {
  syuzhety: [
    { key: 'gruz', plot: 'груз на пружине', modern: false, text: dolyaText('Груз') },
    {
      key: 'mayatnik',
      plot: 'пружинный маятник',
      modern: false,
      text: dolyaText('Шарик пружинного маятника'),
    },
    {
      key: 'datchik',
      plot: 'датчик в смартфоне',
      modern: true,
      text: dolyaText('Грузик вибромотора смартфона в учебной модели'),
    },
    {
      key: 'batut',
      plot: 'фигурка на пружине',
      modern: true,
      text: dolyaText('Брелок-попрыгунчик на пружинке'),
    },
  ],
  gen(r): Params | null {
    const m = r.pick([0.1, 0.2, 0.4, 0.5, 0.8, 1, 2]);
    const v0 = r.pick([0.5, 2, 1.5, 3, 2.5, 0.8]);
    const T = r.pick([3, 6, 9, 12, 15, 18, 24, 30, 1.5, 4.5, 2]);
    const s2 = r.pick([0.25, 0.5, 0.75]);
    const E0 = (m * v0 * v0 * s2) / 2;
    return Math.abs(E0 * 10000 - Math.round(E0 * 10000)) < 1e-9 ? { m, v0, T, E0 } : null;
  },
  fizika: () => true,
};
