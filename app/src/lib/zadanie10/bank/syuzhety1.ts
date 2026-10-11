/**
 * Сюжеты аналогов, группа I (П-01 … П-10).
 *
 * У каждого прототипа — список сюжетов (классические и современные:
 * дрон, электросамокат, смартфон, спорт, космос). Сюжет — это текст
 * условия по параметрам; генератор подбирает параметры «от ответа»,
 * чтобы ответ был целым или конечной десятичной дробью, а величины —
 * в правдоподобных пределах (проверяет `fizika`).
 *
 * Формулы в условии — в $…$, числа в тексте — с запятой.
 */

import type { Rng } from '../../vychisleniya/rng';
import type { Params } from '../types';
import { M, T, type GeneratorAnalogov } from './syuzhet-tip';

/* ── П-01 Мост ──────────────────────────────────────────────────── */

const MOST_INTRO = (chto: string, pro: string) =>
  `На рисунке изображена схема ${chto}. Вертикальные пилоны связаны провисающей цепью. Тросы, которые свисают с цепи и поддерживают ${pro}, называются вантами. Введём систему координат: ось $Oy$ направим вертикально вверх вдоль одного из пилонов, а ось $Ox$ направим вдоль ${pro === 'полотно моста' ? 'полотна моста' : 'настила'}, как показано на рисунке. `;

function mostText(chto: string, pro: string) {
  return (p: Params) =>
    MOST_INTRO(chto, pro) +
    `В этой системе координат линия, по которой провисает цепь, задаётся формулой $y=${M(p.a)}x^2-${M(-Number(p.b))}x+${M(p.c)}$, где $x$ и $y$ измеряются в метрах. Найдите длину ванты, расположенной в ${T(p.x)} метрах от пилона. Ответ дайте в метрах.`;
}

export const G_P01: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'most-reka',
      plot: 'мост через реку',
      modern: false,
      text: mostText('висячего моста через реку', 'полотно моста'),
    },
    {
      key: 'most-avto',
      plot: 'автомобильный мост',
      modern: false,
      text: mostText('автомобильного висячего моста', 'полотно моста'),
    },
    {
      key: 'park',
      plot: 'мост в верёвочном парке',
      modern: true,
      text: mostText('подвесного пешеходного моста в верёвочном парке', 'полотно моста'),
    },
    {
      key: 'velo',
      plot: 'велодорожка',
      modern: true,
      text: mostText('висячего моста для велодорожки и электросамокатов', 'полотно моста'),
    },
  ],
  gen(r: Rng) {
    const a = r.int(15, 50) / 10000;
    const xv = r.int(6, 10) * 10;
    const b = -Math.round(2 * a * xv * 100) / 100;
    const c = r.int(20, 40);
    const yMin = c - (b * b) / (4 * a);
    if (yMin < 1.5 || yMin > 12) {
      return null;
    }
    const x = r.int(1, Math.floor((2 * xv) / 10) - 1) * 10;
    return { a, b, c, x };
  },
  fizika: (p, ans) => ans > 1 && ans < Number(p.c),
};

/* ── П-02 Рейтинг ───────────────────────────────────────────────── */

interface Rejting {
  kto: string;
  pokazateli: [string, string, string][];
}

const IZDANIYA: Rejting = {
  kto: 'новостных изданий',
  pokazateli: [
    ['информативности', 'In', 'информативность'],
    ['оперативности', 'Op', 'оперативность'],
    ['объективности', 'Tr', 'объективность'],
  ],
};
const IGRY: Rejting = {
  kto: 'мобильных игр',
  pokazateli: [
    ['графики', 'G', 'графика'],
    ['сюжета', 'S', 'сюжет'],
    ['управления', 'U', 'управление'],
  ],
};
const BLOGI: Rejting = {
  kto: 'видеоблогов о науке',
  pokazateli: [
    ['достоверности', 'D', 'достоверность'],
    ['понятности', 'P', 'понятность'],
    ['оформления', 'V', 'оформление'],
  ],
};
const MUZEI: Rejting = {
  kto: 'городских музеев',
  pokazateli: [
    ['содержательности экспозиции', 'E', 'экспозиция'],
    ['удобства', 'U', 'удобство'],
    ['работы экскурсоводов', 'K', 'работа экскурсоводов'],
  ],
};

const VO: Record<number, string> = { 2: 'вдвое', 3: 'втрое', 4: 'вчетверо', 5: 'в пять раз' };

function rejtingText(rt: Rejting) {
  return (p: Params) => {
    const w = [Number(p.wIn), Number(p.wOp), Number(p.wTr)];
    const [a, b, c] = rt.pokazateli;
    const sym = (i: number) => `\\mathit{${rt.pokazateli[i]?.[1] ?? ''}}`;
    const term = (k: number, i: number) => (k === 1 ? sym(i) : `${k}${sym(i)}`);
    const chisl = w.map((k, i) => term(k, i)).join('+');
    /* «X ценится втрое, а Y — вдвое дороже, чем Z» (Z — с весом 1). */
    const base = w.indexOf(1);
    const others = [0, 1, 2].filter((i) => i !== base);
    const fr = others
      .map(
        (i, j) =>
          `${j === 0 ? '' : 'а '}${rt.pokazateli[i]?.[2] ?? ''}${j === 0 ? ' ценится' : ' —'} ${VO[w[i] ?? 0] ?? `в ${w[i]} раз`}`,
      )
      .join(', ');
    return `Независимое агентство намерено ввести рейтинг $R$ ${rt.kto} на основе показателей ${a?.[0]} $${sym(0)}$, ${b?.[0]} $${sym(1)}$ и ${c?.[0]} $${sym(2)}$. Каждый показатель оценивается целыми числами от ${Number(p.lo) < 0 ? `$${M(p.lo)}$` : T(p.lo)} до ${T(p.hi)}. Составители рейтинга считают, что ${fr} дороже, чем ${rt.pokazateli[base]?.[2]}, то есть $R=\\dfrac{${chisl}}{A}$. Найдите, каким должно быть число $A$, чтобы ${rt.kto === 'новостных изданий' ? 'издание' : 'участник рейтинга'}, у которого все показатели наибольшие, получил${rt.kto === 'новостных изданий' ? 'о' : ''} рейтинг ${T(p.R)}.`;
  };
}

export const G_P02: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'izdaniya',
      plot: 'новостные издания',
      modern: false,
      text: rejtingText(IZDANIYA),
      params: { names: 'In,Op,Tr' },
    },
    {
      key: 'muzei',
      plot: 'музеи',
      modern: false,
      text: rejtingText(MUZEI),
      params: { names: 'E,U,K' },
    },
    {
      key: 'igry',
      plot: 'мобильные игры',
      modern: true,
      text: rejtingText(IGRY),
      params: { names: 'G,S,U' },
    },
    {
      key: 'blogi',
      plot: 'научные видеоблоги',
      modern: true,
      text: rejtingText(BLOGI),
      params: { names: 'D,P,V' },
    },
  ],
  gen(r): Params | null {
    const w = r.sample([1, 2, 3, 4, 5], 3);
    if (!w.includes(1)) {
      w[r.int(0, 2)] = 1;
    }
    if (new Set(w).size < 3) {
      return null;
    }
    const lo = r.pick([0, 1, -1, 0]);
    const hi = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 2, 1]);
    if (hi <= lo + 1) {
      return null;
    }
    const top = (w[0] ?? 0) + (w[1] ?? 0) + (w[2] ?? 0);
    const R = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30, 40, 50, 60, 80, 100]);
    const A = (top * hi) / R;
    if (Math.abs(A * 100 - Math.round(A * 100)) > 1e-9) {
      return null;
    }
    return { wIn: w[0] ?? 1, wOp: w[1] ?? 1, wTr: w[2] ?? 1, lo, hi, R };
  },
  fizika: (_p, ans) => ans >= 0.05 && ans <= 40,
};

/* ── П-03 Рейтинг интернет-магазина ─────────────────────────────── */

function magazinText(kto: string, kogo: string, form: 'mul' | 'pow') {
  return (p: Params) => {
    const formula =
      form === 'mul'
        ? '$R=r_{\\text{пок}}-\\dfrac{r_{\\text{пок}}-r_{\\text{экс}}}{(K+1)\\cdot\\frac{0{,}02K}{r_{\\text{пок}}+0{,}1}}$'
        : '$R=r_{\\text{пок}}-\\dfrac{r_{\\text{пок}}-r_{\\text{экс}}}{(K+1)^m}$';
    const m = form === 'mul' ? '' : ', а показатель $m=\\dfrac{0{,}02K}{r_{\\text{пок}}+0{,}1}$';
    return `Рейтинг $R$ ${kto} вычисляется по формуле ${formula}, где $r_{\\text{пок}}$ — средняя оценка ${kogo} (от 0 до 1), $r_{\\text{экс}}$ — оценка экспертов (от 0 до 0,7), $K$ — число ${form === 'mul' ? 'покупателей' : 'пользователей'}, оставивших отзыв${m}. Найдите рейтинг, если число оставивших отзыв равно ${T(p.K)}, их средняя оценка равна ${T(p.rPok)}, а оценка экспертов равна ${T(p.rEks)}.`;
  };
}

export const G_P03: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'magazin-mul',
      plot: 'интернет-магазин',
      modern: false,
      text: magazinText('интернет-магазина «Гамма»', 'магазина покупателями', 'mul'),
      params: { form: 'mul' },
    },
    {
      key: 'magazin-pow',
      plot: 'интернет-магазин',
      modern: false,
      text: magazinText('интернет-магазина «Дельта»', 'магазина покупателями', 'pow'),
      params: { form: 'pow' },
    },
    {
      key: 'krossovki',
      plot: 'магазин кроссовок',
      modern: true,
      text: magazinText('онлайн-магазина кроссовок', 'магазина покупателями', 'mul'),
      params: { form: 'mul' },
    },
    {
      key: 'prilozhenie',
      plot: 'приложение доставки',
      modern: true,
      text: magazinText('приложения доставки еды', 'приложения пользователями', 'pow'),
      params: { form: 'pow' },
    },
  ],
  gen(r, s): Params | null {
    const form = String(s.params?.form ?? 'mul');
    const rPok = r.int(10, 95) / 100;
    const rEks = r.int(5, 70) / 100;
    if (Math.abs(rPok - rEks) < 0.05) {
      return null;
    }
    if (form === 'mul') {
      const K = r.int(4, 40);
      return { K, rPok, rEks, form };
    }
    /* m = 0,02K/(r+0,1) — «удобная» дробь, K+1 — точная степень. */
    const var_ = r.pick([
      { K: 24, m: [1, 2] },
      { K: 8, m: [1, 2] },
      { K: 15, m: [1, 2] },
      { K: 26, m: [2, 3] },
      { K: 7, m: [1, 3] },
      { K: 7, m: [2, 3] },
      { K: 3, m: [1, 2] },
      { K: 35, m: [1, 2] },
      { K: 29, m: [1, 1] },
      { K: 9, m: [1, 1] },
      { K: 19, m: [1, 1] },
    ] as const);
    const [mn, md] = var_.m;
    const rp = (0.02 * var_.K * md) / mn - 0.1;
    const rpR = Math.round(rp * 100) / 100;
    if (Math.abs(rp - rpR) > 1e-9 || rpR <= 0.05 || rpR >= 1) {
      return null;
    }
    return { K: var_.K, rPok: rpR, rEks, form };
  },
  okOtvet: (x) => x > 0 && x < 1 && Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-7,
  fizika: () => true,
};

/* ── П-04 Закон Ома ─────────────────────────────────────────────── */

function omText(set: string, ustr: string, U: string) {
  return (p: Params) =>
    `Сила тока в цепи $I$ (в А) определяется напряжением в цепи и сопротивлением ${ustr} по закону Ома: $I=\\dfrac{U}{R}$, где $U$ — напряжение (в В), $R$ — сопротивление (в Ом). ${set} ${T(p.Imax)} А. Определите, какое наименьшее сопротивление может быть у ${ustr}, подключаемого к ${U} ${T(p.U)} В, чтобы цепь продолжала работать. Ответ дайте в омах.`;
}

export const G_P04: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'set',
      plot: 'бытовая сеть',
      modern: false,
      text: omText(
        'В электросеть включён предохранитель, который плавится, если сила тока превышает',
        'электроприбора',
        'сети в',
      ),
      params: { U: 220 },
    },
    {
      key: 'dacha',
      plot: 'щиток на даче',
      modern: false,
      text: omText(
        'В щитке на даче стоит автомат, который отключает линию, если сила тока превышает',
        'электроприбора',
        'сети в',
      ),
      params: { U: 220 },
    },
    {
      key: 'samokat',
      plot: 'зарядная станция самокатов',
      modern: true,
      text: omText(
        'На зарядной станции для электросамокатов стоит защита, которая размыкает цепь, если сила тока превышает',
        'зарядного устройства',
        'линии в',
      ),
      params: { U: 220 },
    },
    {
      key: 'usb',
      plot: 'USB-порт',
      modern: true,
      text: omText(
        'В USB-порт ноутбука встроена защита, которая отключает питание, если сила тока превышает',
        'подключаемого гаджета',
        'порту с напряжением',
      ),
      params: { U: 5 },
    },
  ],
  gen(r, s): Params | null {
    const U = Number(s.params?.U ?? 220);
    if (U === 5) {
      const I = r.pick([0.5, 1, 1.25, 2, 2.5, 4, 0.8, 0.4, 1.6, 3.2, 0.25, 0.625]);
      return { U, Imax: I };
    }
    const I = r.pick([
      2, 2.2, 2.5, 4, 4.4, 5, 5.5, 8, 8.8, 10, 11, 12.5, 16, 20, 22, 25, 27.5, 40, 44, 1.6, 3.2,
      6.4, 6.25, 1.25,
    ]);
    return { U, Imax: I };
  },
  fizika: (_p, ans) => ans > 0.5 && ans < 200,
};

/* ── П-05 ЭДС ───────────────────────────────────────────────────── */

function edsText(ist: string, nagr: string) {
  return (p: Params) =>
    `К ${ist} с ЭДС $\\varepsilon=${M(p.eps)}$ В и внутренним сопротивлением $r=${M(p.r)}$ Ом хотят подключить ${nagr} с сопротивлением $R$ (в Ом). Напряжение (в В) на нагрузке вычисляется по формуле $U=\\dfrac{\\varepsilon R}{R+r}$. При каком значении сопротивления нагрузки напряжение на ней будет равно ${T(p.U)} В? Ответ дайте в омах.`;
}

export const G_P05: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'istochnik',
      plot: 'источник тока',
      modern: false,
      text: edsText('источнику', 'нагрузку'),
      params: { tip: 'big' },
    },
    {
      key: 'generator',
      plot: 'генератор',
      modern: false,
      text: edsText('генератору', 'обогреватель'),
      params: { tip: 'big' },
    },
    {
      key: 'samokat',
      plot: 'аккумулятор электросамоката',
      modern: true,
      text: edsText('аккумулятору электросамоката', 'мотор'),
      params: { tip: 'samokat' },
    },
    {
      key: 'powerbank',
      plot: 'павербанк',
      modern: true,
      text: edsText('павербанку', 'смартфон на зарядке'),
      params: { tip: 'usb' },
    },
  ],
  gen(r, s): Params | null {
    const tip = String(s.params?.tip);
    if (tip === 'usb') {
      const eps = r.pick([5, 5.2, 5.4]);
      const r0 = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]);
      const U = r.pick([4, 4.5, 4.8, 5]);
      return U < eps ? { eps, r: r0, U } : null;
    }
    if (tip === 'samokat') {
      const eps = r.pick([36, 42, 48]);
      const r0 = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
      const U = eps - r.pick([2, 3, 4, 6]);
      return { eps, r: r0, U };
    }
    const eps = r.int(10, 25) * 10;
    const r0 = r.pick([0.2, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2]);
    const U = eps - r.pick([5, 10, 15, 20, 25, 30, 40]);
    return { eps, r: r0, U };
  },
  fizika: (p, ans) => ans > Number(p.r) && ans < 100,
};

/* ── П-06 Параллельное соединение ───────────────────────────────── */

function paraText(pervyy: string, vtoroy: string) {
  return (p: Params) =>
    `В розетку электросети подключён ${pervyy}, сопротивление которого составляет $R_1=${M(p.R1)}$ Ом. Параллельно с ним в розетку предполагается подключить ${vtoroy}, сопротивление которого $R_2$ (в Ом). При параллельном соединении двух электроприборов с сопротивлениями $R_1$ и $R_2$ их общее сопротивление вычисляется по формуле $R_{\\text{общ}}=\\dfrac{R_1R_2}{R_1+R_2}$. Для нормальной работы электросети общее сопротивление в ней должно быть не меньше ${T(p.Rmin)} Ом. Определите наименьшее возможное сопротивление $R_2$. Ответ дайте в омах.`;
}

export const G_P06: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'chaynik',
      plot: 'чайник и утюг',
      modern: false,
      text: paraText('электрический чайник', 'утюг'),
    },
    {
      key: 'plita',
      plot: 'плита и обогреватель',
      modern: false,
      text: paraText('электрический обогреватель', 'тостер'),
    },
    {
      key: 'pk',
      plot: 'игровой компьютер',
      modern: true,
      text: paraText('игровой компьютер', 'зарядное устройство для электросамоката'),
    },
    {
      key: 'konsol',
      plot: 'игровая приставка',
      modern: true,
      text: paraText('увлажнитель воздуха', 'игровую приставку'),
    },
  ],
  gen(r): Params | null {
    const R1 = r.int(12, 150);
    const Rmin = r.int(4, R1 - 4);
    const R2 = (R1 * Rmin) / (R1 - Rmin);
    return Number.isInteger(R2) || Number.isInteger(R2 * 10) ? { R1, Rmin } : null;
  },
  fizika: (_p, ans) => ans >= 5 && ans <= 600,
};

/* ── П-07 Линза ─────────────────────────────────────────────────── */

function linzaText(chto: string, gde: string) {
  return (p: Params) =>
    `Для получения на экране увеличенного изображения ${chto} ${gde} используется собирающая линза с фокусным расстоянием $f=${M(p.f)}$ см. Расстояние $d_1$ от линзы до ${chto === 'лампочки' ? 'лампочки' : 'объекта'} может изменяться в пределах от ${T(p.d1min)} до ${T(p.d1max)} см, а расстояние $d_2$ от линзы до экрана — в пределах от ${T(p.d2min)} до ${T(p.d2max)} см. Изображение на экране будет чётким, если выполнено соотношение $\\dfrac{1}{d_1}+\\dfrac{1}{d_2}=\\dfrac{1}{f}$. Укажите, на каком наименьшем расстоянии от линзы нужно поместить ${chto === 'лампочки' ? 'лампочку' : 'объект'}, чтобы его изображение на экране было чётким. Ответ дайте в сантиметрах.`;
}

export const G_P07: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'lampa',
      plot: 'лампочка в лаборатории',
      modern: false,
      text: linzaText('лампочки', 'в лаборатории'),
    },
    {
      key: 'diafilm',
      plot: 'кадр плёнки',
      modern: false,
      text: linzaText('кадра плёнки', 'в школьном фильмоскопе'),
    },
    {
      key: 'proektor',
      plot: 'проектор для смартфона',
      modern: true,
      text: linzaText('экрана смартфона', 'в самодельном проекторе из коробки'),
    },
    {
      key: 'mikro',
      plot: 'насекомое под линзой',
      modern: true,
      text: linzaText('насекомого', 'на школьном научном фестивале'),
    },
  ],
  gen(r): Params | null {
    const f = r.int(10, 60);
    const d2max = r.int(Math.ceil((f * 2.2) / 10), Math.floor((f * 6) / 10)) * 10;
    const d1 = (f * d2max) / (d2max - f);
    if (!Number.isInteger(d1) && !Number.isInteger(d1 * 10)) {
      return null;
    }
    const d1min = Math.max(f + 1, Math.floor(d1 - r.int(3, 15)));
    const d1max = Math.ceil(d1 + r.int(5, 20));
    const d2min = d2max - r.int(2, 7) * 10;
    if (d2min <= f) {
      return null;
    }
    return { f, d1min, d1max, d2min, d2max };
  },
  fizika: (p, ans) => ans >= Number(p.d1min) && ans <= Number(p.d1max),
};

/* ── П-08 Доплер: источник подъезжает ───────────────────────────── */

function doplerText(kto: string, zh: boolean, signal: string, gde: string) {
  const la = zh ? 'а' : '';
  const sya = zh ? 'ась' : 'ся';
  return (p: Params) =>
    `${kto} подал${la} ${signal} с частотой $f_0=${M(p.f0)}$ Гц, стоя на месте. Чуть позже ${signal} прозвучал, когда ${kto.toLowerCase()} приближал${sya} к ${gde}. Из-за эффекта Доплера частота второго сигнала $f$ (в Гц) больше первой: она зависит от скорости источника $v$ (в м/с) по закону $f(v)=\\dfrac{f_0}{1-\\frac{v}{c}}$ (Гц), где $c$ — скорость звука (в м/с). Человек различает сигналы по тону, если они отличаются не менее чем на ${T(p.df)} Гц. Определите, с какой минимальной скоростью приближал${sya} ${kto.toLowerCase()}, если человек смог различить сигналы, а $c=${M(p.c)}$ м/с. Ответ дайте в м/с.`;
}

export const G_P08: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'teplovoz',
      plot: 'тепловоз',
      modern: false,
      text: doplerText('Тепловоз', false, 'гудок', 'платформе'),
    },
    {
      key: 'skoraya',
      plot: 'скорая помощь',
      modern: false,
      text: doplerText('Машина скорой помощи', true, 'сигнал', 'перекрёстку'),
    },
    {
      key: 'dron',
      plot: 'дрон-доставщик',
      modern: true,
      text: doplerText('Дрон-доставщик', false, 'звуковой сигнал', 'точке выдачи заказа'),
    },
    {
      key: 'elektrokar',
      plot: 'электрокар',
      modern: true,
      text: doplerText('Электрокар', false, 'предупреждающий сигнал', 'пешеходному переходу'),
    },
  ],
  gen(r, s): Params | null {
    const c = r.pick([300, 320, 330, 340, 315, 310]);
    const v = s.key === 'dron' ? r.int(4, 20) : r.int(4, 30);
    const f = r.int(200, 900);
    const df = (v * f) / c;
    if (!Number.isInteger(df) || df < 3 || df > 40) {
      return null;
    }
    return { f0: f - df, df, c };
  },
  fizika: (_p, ans) => ans >= 3 && ans <= 35,
};

/* ── П-09 Источник и приёмник ───────────────────────────────────── */

function istPrText(kto: string, mode: 'eq' | 'ge') {
  return (p: Params) => {
    const head = `${kto} движутся в некоторой среде по прямой навстречу друг другу. Частота сигнала $f$ (в Гц), регистрируемого приёмником, вычисляется по формуле $f=f_0\\cdot\\dfrac{c+u}{c-v}$, где $f_0=${M(p.f0)}$ Гц — частота исходного сигнала, $c$ — скорость распространения сигнала в среде (в м/с), а $u=${M(p.u)}$ м/с и $v=${M(p.v)}$ м/с — скорости приёмника и источника относительно среды.`;
    return mode === 'eq'
      ? `${head} При какой скорости распространения сигнала в среде частота сигнала в приёмнике будет равна ${T(p.f)} Гц? Ответ дайте в м/с.`
      : `${head} При какой наибольшей скорости $c$ распространения сигнала частота в приёмнике будет не менее ${T(p.f)} Гц? Ответ дайте в м/с.`;
  };
}

export const G_P09: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'istochnik',
      plot: 'источник и приёмник',
      modern: false,
      text: istPrText('Источник и приёмник звуковых сигналов', 'eq'),
      params: { mode: 'eq' },
    },
    {
      key: 'katera',
      plot: 'катера',
      modern: false,
      text: istPrText('Катер с сиреной (источник) и буй с микрофоном (приёмник)', 'ge'),
      params: { mode: 'ge' },
    },
    {
      key: 'drony',
      plot: 'два дрона',
      modern: true,
      text: istPrText('Дрон с пищалкой (источник) и дрон с микрофоном (приёмник)', 'eq'),
      params: { mode: 'eq' },
    },
    {
      key: 'roboty',
      plot: 'роботы',
      modern: true,
      text: istPrText(
        'Робот-пылесос со звуковым маячком (источник) и робот-собака с датчиком звука (приёмник)',
        'ge',
      ),
      params: { mode: 'ge' },
    },
  ],
  gen(r, s): Params | null {
    const c = r.int(25, 50) * 10;
    const u = r.int(2, 20);
    const v = r.int(2, 20);
    const f0 = r.int(10, 30) * 10;
    const f = (f0 * (c + u)) / (c - v);
    if (!Number.isInteger(f)) {
      return null;
    }
    return { f0, u, v, f, mode: String(s.params?.mode ?? 'eq') };
  },
  fizika: (_p, ans) => ans >= 200 && ans <= 600,
};

/* ── П-10 Батискаф ──────────────────────────────────────────────── */

function batiskafText(kto: string) {
  return (p: Params) =>
    `Локатор ${kto}, равномерно погружающегося вертикально вниз, испускает ультразвуковые импульсы частотой ${T(p.f0)} МГц. Скорость погружения, выражаемая в м/с, определяется по формуле $v=c\\cdot\\dfrac{f-f_0}{f+f_0}$, где $c=1500$ м/с — скорость звука в воде, $f_0$ — частота испускаемых импульсов (в МГц), $f$ — частота отражённого от дна сигнала, регистрируемая приёмником (в МГц). Определите наибольшую возможную частоту отражённого сигнала $f$, если скорость погружения не должна превышать ${T(p.vmax)} м/с. Ответ дайте в МГц.`;
}

export const G_P10: GeneratorAnalogov = {
  syuzhety: [
    { key: 'batiskaf', plot: 'батискаф', modern: false, text: batiskafText('батискафа') },
    {
      key: 'kolokol',
      plot: 'исследовательский аппарат',
      modern: false,
      text: batiskafText('глубоководного исследовательского аппарата'),
    },
    {
      key: 'podvodnyy-dron',
      plot: 'подводный дрон',
      modern: true,
      text: batiskafText('подводного дрона'),
    },
    {
      key: 'robot',
      plot: 'подводный робот',
      modern: true,
      text: batiskafText('автономного подводного робота, снимающего коралловый риф,'),
    },
  ],
  gen(r): Params | null {
    const vmax = r.pick([2, 3, 4, 5, 6, 10, 12, 15, 18, 20, 25, 30]);
    const f0 = r.int(100, 800);
    const f = (f0 * (1500 + vmax)) / (1500 - vmax);
    if (Math.abs(f * 10 - Math.round(f * 10)) > 1e-9) {
      return null;
    }
    return { c: 1500, f0, vmax };
  },
  fizika: () => true,
};
