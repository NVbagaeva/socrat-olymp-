/**
 * Сюжеты аналогов, группа II (П-11 … П-17): квадратичные зависимости.
 * Параметры подбираются «от корней»: сначала красивые корни, потом
 * коэффициенты, чтобы дискриминант был точным квадратом.
 */

import type { Params } from '../types';
import { M, T, type GeneratorAnalogov } from './syuzhet-tip';

/* ── П-11 Торможение ────────────────────────────────────────────── */

function tormozText(kto: string, zh: boolean, kratko: string) {
  const a = zh ? 'а' : '';
  return (p: Params) =>
    `${kto}, движущ${zh ? 'аяся' : 'ийся'} со скоростью $v_0=${M(p.v0)}$ м/с, начал${a} торможение с постоянным ускорением $a=${M(p.a)}$ м/с². За $t$ секунд после начала торможения ${zh ? 'она' : 'он'} прош${zh ? 'ла' : 'ёл'} путь $S=v_0t-\\dfrac{at^2}{2}$ (м). Определите время, прошедшее с момента начала торможения, если известно, что за это время ${kratko} проехал${a} ${T(p.S)} м. Ответ дайте в секундах.`;
}

export const G_P11: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'avto',
      plot: 'автомобиль',
      modern: false,
      text: tormozText('Автомобиль', false, 'автомобиль'),
      params: { kto: 'auto' },
    },
    {
      key: 'avtobus',
      plot: 'автобус',
      modern: false,
      text: tormozText('Автобус', false, 'автобус'),
      params: { kto: 'auto' },
    },
    {
      key: 'samokat',
      plot: 'электросамокат',
      modern: true,
      text: tormozText('Электросамокат', false, 'самокат'),
      params: { kto: 'samokat' },
    },
    {
      key: 'karting',
      plot: 'карт',
      modern: true,
      text: tormozText('Карт на картодроме', false, 'карт'),
      params: { kto: 'kart' },
    },
  ],
  gen(r, s): Params | null {
    const kto = String(s.params?.kto);
    const a = kto === 'samokat' ? r.pick([1, 2]) : r.int(2, 7);
    const tStop = kto === 'samokat' ? r.int(3, 6) : r.int(3, 12);
    const v0 = a * tStop;
    if ((kto === 'samokat' && v0 > 8) || v0 > 35) {
      return null;
    }
    const t = r.int(2, 2 * tStop - 1) / 2;
    const S = v0 * t - (a * t * t) / 2;
    return Number.isInteger(S * 100) ? { v0, a, S } : null;
  },
  fizika: (p, ans) => ans > 0 && ans < Number(p.v0) / Number(p.a),
};

/* ── П-12 Разгон за городом, ответ в минутах ────────────────────── */

function razgonText(kto: string, gde: string, on: string) {
  return (p: Params) =>
    `${kto}, движущийся ${gde} со скоростью $v_0=${M(p.v0)}$ км/ч, сразу после выезда начинает разгоняться с постоянным ускорением $a=${M(p.a)}$ км/ч². Расстояние (в км) до точки начала разгона вычисляется по формуле $S=v_0t+\\dfrac{at^2}{2}$, где $t$ — время в часах. Определите время, прошедшее после начала разгона, если известно, что за это время ${on} удалился на ${T(p.S)} км. Ответ дайте в минутах.`;
}

export const G_P12: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'moto',
      plot: 'мотоциклист',
      modern: false,
      text: razgonText('Мотоциклист', 'по городу', 'он'),
    },
    {
      key: 'gruzovik',
      plot: 'грузовик',
      modern: false,
      text: razgonText('Грузовик', 'по посёлку', 'он'),
    },
    {
      key: 'elektrobayk',
      plot: 'электробайк',
      modern: true,
      text: razgonText('Электробайк', 'по жилому кварталу', 'он'),
    },
    {
      key: 'bespilotnik',
      plot: 'беспилотное такси',
      modern: true,
      text: razgonText('Беспилотный автомобиль', 'по городу', 'он'),
    },
  ],
  gen(r): Params | null {
    const tMin = r.pick([
      3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 25, 27, 30, 33, 36, 40, 42, 45, 48, 50,
    ]);
    const t = tMin / 60;
    const v0 = r.int(4, 8) * 10 + r.pick([0, 5]);
    const a = r.int(1, 12) * 4;
    const S = v0 * t + (a * t * t) / 2;
    return Math.abs(S * 100 - Math.round(S * 100)) < 1e-9
      ? { v0, a, S: Math.round(S * 100) / 100 }
      : null;
  },
  fizika: (p, ans) => ans >= 5 && ans <= 60 && Number(p.S) >= 2,
};

/* ── П-13 Лебёдка ───────────────────────────────────────────────── */

function lebedkaText(chto: string, gde: string) {
  return (p: Params) =>
    `${gde} используют ${chto}, которая равноускоренно наматывает кабель на катушку. Угол, на который поворачивается катушка, изменяется со временем по закону $\\varphi=\\omega t+\\dfrac{\\beta t^2}{2}$, где $t$ — время в минутах, прошедшее после начала работы, $\\omega=${M(p.omega)}$ град./мин — начальная угловая скорость вращения катушки, а $\\beta=${M(p.beta)}$ град./мин² — угловое ускорение. Определите время, прошедшее после начала работы, если известно, что за это время угол намотки $\\varphi$ достиг $${M(p.phi)}^\\circ$. Ответ дайте в минутах.`;
}

export const G_P13: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'zavod',
      plot: 'лебёдка на заводе',
      modern: false,
      text: lebedkaText('лебёдку', 'Для сматывания кабеля на заводе'),
    },
    {
      key: 'port',
      plot: 'лебёдка в порту',
      modern: false,
      text: lebedkaText('лебёдку', 'Для сматывания троса в порту'),
    },
    {
      key: 'filament',
      plot: '3D-принтер',
      modern: true,
      text: lebedkaText('намоточную машину', 'Для намотки пластиковой нити для 3D-принтеров'),
    },
    {
      key: 'optovolokno',
      plot: 'оптоволокно',
      modern: true,
      text: lebedkaText(
        'катушечную машину',
        'Для намотки оптоволоконного кабеля для домашнего интернета',
      ),
    },
  ],
  gen(r): Params | null {
    const t = r.int(5, 30);
    const beta = r.int(1, 10) * 2;
    const omega = r.int(1, 12) * 5;
    const phi = omega * t + (beta * t * t) / 2;
    return phi >= 500 && phi <= 6000 ? { omega, beta, phi } : null;
  },
  fizika: () => true,
};

/* ── П-14 Спрос и выручка ───────────────────────────────────────── */

function vyruchkaText(chto: string) {
  return (p: Params) =>
    `Зависимость объёма спроса $q$ (единиц в месяц) на ${chto} от цены $p$ (тыс. руб.) задаётся формулой $q=${M(p.A)}-${M(p.B)}p$. Выручка за месяц $r$ (в тыс. руб.) вычисляется по формуле $r(p)=q\\cdot p$. Определите наибольшую цену $p$, при которой месячная выручка $r(p)$ составит не менее ${T(p.r)} тыс. руб. Ответ приведите в тыс. руб.`;
}

export const G_P14: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'monopolist',
      plot: 'предприятие-монополист',
      modern: false,
      text: vyruchkaText('продукцию предприятия-монополиста'),
    },
    {
      key: 'mebel',
      plot: 'мебельная фабрика',
      modern: false,
      text: vyruchkaText('шкафы мебельной фабрики'),
    },
    {
      key: 'merch',
      plot: 'мерч блогера',
      modern: true,
      text: vyruchkaText('толстовки из мерча популярного блогера'),
    },
    {
      key: 'naushniki',
      plot: 'беспроводные наушники',
      modern: true,
      text: vyruchkaText('беспроводные наушники небольшой компании'),
    },
  ],
  gen(r): Params | null {
    const B = r.pick([2, 4, 5, 10]);
    const p1 = r.int(1, 8);
    const p2 = r.int(p1 + 1, 16);
    const A = B * (p1 + p2);
    const rr = B * p1 * p2;
    return A <= 250 ? { A, B, r: rr } : null;
  },
  fizika: () => true,
};

/* ── П-15 Бак ───────────────────────────────────────────────────── */

function bakText(chto: string) {
  return (p: Params) =>
    `В боковой стенке ${chto} у самого дна закреплён кран. После его открытия вода начинает вытекать, при этом высота столба воды, выраженная в метрах, меняется по закону $H(t)=at^2+bt+H_0$, где $H_0=${M(p.H0)}$ м — начальный уровень воды, $a=\\dfrac{1}{${M(p.aDen)}}$ м/мин² и $b=-\\dfrac{${M(p.bNum)}}{${M(p.bDen)}}$ м/мин — постоянные, $t$ — время в минутах, прошедшее с момента открытия крана. В течение какого времени вода будет вытекать? Ответ приведите в минутах.`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export const G_P15: GeneratorAnalogov = {
  syuzhety: [
    { key: 'bak', plot: 'бак', modern: false, text: bakText('высокого цилиндрического бака') },
    {
      key: 'cisterna',
      plot: 'цистерна',
      modern: false,
      text: bakText('цилиндрической цистерны для полива'),
    },
    {
      key: 'basseyn',
      plot: 'каркасный бассейн',
      modern: true,
      text: bakText('каркасного бассейна на даче'),
    },
    {
      key: 'akvarium',
      plot: 'бак аквариума',
      modern: true,
      text: bakText('цилиндрического бака для домашней гидропонной фермы'),
    },
  ],
  gen(r): Params | null {
    /* D = 0: a = H0/t², b = −2H0/t. Нужно t²/H0 — целое. */
    const t = r.int(4, 40);
    const H0 = r.pick([1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 6, 6.25, 7, 8, 0.5, 2.25]);
    const N = (t * t) / H0;
    if (!Number.isInteger(N)) {
      return null;
    }
    /* b = −2H0/t как несократимая дробь с целыми. */
    const num = Math.round(2 * H0 * 4);
    const den = t * 4;
    const g = gcd(num, den);
    return { H0, aDen: N, bNum: num / g, bDen: den / g };
  },
  fizika: (p, ans) => ans >= 4 && ans <= 120 && Number(p.aDen) <= 2000,
};

/* ── П-16 Нагреватель ───────────────────────────────────────────── */

function nagrevText(chto: string) {
  return (p: Params) =>
    `Для ${chto} экспериментально получена зависимость температуры (в К) от времени работы: $T(t)=T_0+bt+at^2$, где $t$ — время (в мин.), $T_0=${M(p.T0)}$ К, $a=${Number(p.aDen) === 1 ? M(p.aNum) : `-\\dfrac{${M(-Number(p.aNum))}}{${M(p.aDen)}}`}$ К/мин², $b=${M(p.b)}$ К/мин. Известно, что при температуре свыше ${T(p.Tmax)} К прибор может испортиться, поэтому его нужно отключить. Найдите, через какое наибольшее время после начала работы нужно отключить прибор. Ответ дайте в минутах.`;
}

export const G_P16: GeneratorAnalogov = {
  syuzhety: [
    {
      key: 'pribor',
      plot: 'нагревательный элемент',
      modern: false,
      text: nagrevText('нагревательного элемента некоторого прибора'),
    },
    {
      key: 'pech',
      plot: 'муфельная печь',
      modern: false,
      text: nagrevText('спирали лабораторной муфельной печи'),
    },
    {
      key: '3d',
      plot: '3D-принтер',
      modern: true,
      text: nagrevText('нагревателя сопла 3D-принтера по металлу'),
    },
    {
      key: 'payalnik',
      plot: 'паяльная станция',
      modern: true,
      text: nagrevText('нагревателя паяльной станции в кружке робототехники'),
    },
  ],
  gen(r): Params | null {
    const a = -r.int(2, 30);
    const t1 = r.int(1, 15);
    const t2 = r.int(t1 + 4, 30);
    const T0 = r.int(30, 150) * 10;
    const Tmax = T0 - a * t1 * t2;
    const b = -a * (t1 + t2);
    return Tmax <= 2400 ? { T0, aNum: a, aDen: 1, b, Tmax } : null;
  },
  fizika: () => true,
};

/* ── П-17 Мяч ───────────────────────────────────────────────────── */

function myachText(chto: string, kto: string) {
  return (p: Params) =>
    `Высота над землёй подброшенного вверх ${chto} меняется по закону $h(t)=${M(p.h0)}+${M(p.v0)}t-5t^2$, где $h$ — высота в метрах, $t$ — время в секундах, прошедшее с момента броска. Сколько секунд ${kto} будет находиться на высоте не менее ${T(p.H)} м?`;
}

export const G_P17: GeneratorAnalogov = {
  syuzhety: [
    { key: 'myach', plot: 'мяч', modern: false, text: myachText('мяча', 'мяч') },
    { key: 'kamen', plot: 'камешек', modern: false, text: myachText('камешка', 'камешек') },
    {
      key: 'voleybol',
      plot: 'волейбольный мяч',
      modern: true,
      text: myachText('мяча при волейбольной подаче', 'мяч'),
    },
    {
      key: 'basket',
      plot: 'баскетбольный мяч',
      modern: true,
      text: myachText('баскетбольного мяча в стритболе', 'мяч'),
    },
  ],
  gen(r): Params | null {
    const t1 = r.int(1, 8) / 10;
    const t2 = r.int(Math.round(t1 * 10) + 2, 30) / 10;
    const v0 = Math.round(5 * (t1 + t2) * 10) / 10;
    const h0 = r.pick([1, 1.2, 1.4, 1.5, 1.6, 1.8, 2]);
    const H = Math.round((h0 + 5 * t1 * t2) * 100) / 100;
    if (v0 > 16 || !Number.isInteger(v0) || H <= h0 + 0.5) {
      return null;
    }
    return { h0, v0, g2: 5, H };
  },
  fizika: (p) => Number(p.H) <= 14,
};
