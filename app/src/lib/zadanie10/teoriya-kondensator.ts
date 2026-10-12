/**
 * Разобранный пример про разряд конденсатора (П-24) для теории №10:
 * шаги, рамка «Почему так» с таблицей и чертёж $U(t)$.
 *
 * Всё считается из параметров задачи банка (точной арифметикой, без
 * округлений), а не вписано руками: автотест сверяет ответ с решателем
 * банка. Модуль серверный — в браузер ответы не уходят (лист генератора
 * подключает content/teoriya10, а не этот файл).
 */

import { d, div, fq, fromDecimal, isInt, mul, q, val, type Q } from '../zadanie11/num';
import type { ShagPrimera } from '@/components/teoriya/Ramki';
import { esc, px, svgText, textWidth, THEME } from '../graph/renderer.js';
import type { Params } from './types';

export interface ParamsKondensatora {
  /** C = Cm·10⁻⁶ Ф. */
  Cm: number;
  /** R = Rm·10⁶ Ом. */
  Rm: number;
  U0: number;
  alpha: number;
  t: number;
}

export function paramsKondensatora(p: Params): ParamsKondensatora {
  const n = (k: string): number => {
    const v = p[k];
    if (typeof v !== 'number') {
      throw new Error(`конденсатор: нет числа ${k}`);
    }
    return v;
  };
  return { Cm: n('Cm'), Rm: n('Rm'), U0: n('U0'), alpha: n('alpha'), t: n('t') };
}

export interface Raschet {
  RC: Q;
  aRC: Q;
  /** log₂(U₀/U) на границе — целое. */
  k: number;
  /** U₀/U на границе = 2ᵏ. */
  otnoshenie: number;
  /** Наибольшее напряжение — ответ. */
  U: Q;
}

/** Расчёт по шагам. Нецелое k — ошибка данных: такой пример в теорию не годится. */
export function raschet(p: ParamsKondensatora): Raschet {
  const RC = mul(fromDecimal(p.Cm), fromDecimal(p.Rm));
  const aRC = mul(fromDecimal(p.alpha), RC);
  const kq = div(fromDecimal(p.t), aRC);
  if (!isInt(kq) || kq.n < 1) {
    throw new Error(`конденсатор: log₂ вышел нецелым (${val(kq)})`);
  }
  const otnoshenie = 2 ** kq.n;
  const U = div(fromDecimal(p.U0), q(otnoshenie));
  return { RC, aRC, k: kq.n, otnoshenie, U };
}

const ch = (x: Q): string => fq(x, true);

export interface PrimerKondensatora {
  shagi: ShagPrimera[];
  otvet: string;
  /** Число ответа — для сверки с решателем банка. */
  answer: number;
}

/**
 * Шаги примера. zametka — для второго примера: подчеркнуть, что
 * степенью двойки было отношение, а не ответ.
 */
export function primerKondensatora(p: ParamsKondensatora, zametka = false): PrimerKondensatora {
  const r = raschet(p);
  const U0 = d(p.U0);
  const drob = `\\dfrac{${U0}}{U}`;
  const otvetU = ch(r.U);
  const stepen = Number.isInteger(val(r.U)) && Number.isInteger(Math.log2(val(r.U)));
  const shagi: ShagPrimera[] = [
    {
      label: 'Считаем $RC$ — степени десяти сокращаются',
      formuly: [
        `RC=${d(p.Cm)}\\cdot10^{-6}\\cdot${d(p.Rm)}\\cdot10^{6}=${ch(r.RC)}\\cdot10^{0}=${ch(r.RC)}`,
      ],
      paras: [
        '$10^{-6}\\cdot10^{6}=10^{-6+6}=10^{0}=1$, поэтому множители $10^{6}$ и $10^{-6}$ можно сразу вычеркнуть — это и есть совет из «Важно!».',
      ],
    },
    {
      label: 'Коэффициент перед логарифмом',
      formuly: [`\\alpha RC=${d(p.alpha)}\\cdot${ch(r.RC)}=${ch(r.aRC)}`],
    },
    {
      label: 'Записываем условие задачи',
      paras: [
        `«Прошло не менее $${d(p.t)}$ с» — это $t\\ge${d(p.t)}$; вместо $t$ подставили формулу из условия.`,
      ],
      formuly: [`${ch(r.aRC)}\\cdot\\log_2${drob}\\ge${d(p.t)}`],
    },
    {
      label: `Делим на $${ch(r.aRC)}$`,
      formuly: [`\\log_2${drob}\\ge${r.k}`],
    },
    {
      label: 'Убираем логарифм',
      paras: [
        'Основание $2>1$, функция $y=\\log_2x$ возрастает, поэтому знак неравенства сохраняется.',
      ],
      formuly: [`${drob}\\ge2^{${r.k}}=${r.otnoshenie}`],
    },
    {
      label: 'Выражаем $U$',
      paras: [
        `$U>0$ (это напряжение), поэтому умножили обе части на $U$ и разделили на $${r.otnoshenie}$.`,
      ],
      formuly: [`U\\le\\dfrac{${U0}}{${r.otnoshenie}}=${otvetU}`],
    },
    {
      label: 'Ответ на вопрос',
      paras: [
        `Напряжение не больше $${otvetU}$ кВ, наибольшее возможное — $${otvetU}$.`,
        ...(zametka && !stepen
          ? [
              `Ответ $${otvetU}$ — не степень двойки: степенью двойки было отношение $${drob}=${r.otnoshenie}$.`,
            ]
          : []),
      ],
    },
  ];
  return { shagi, otvet: `**Ответ:** $${otvetU}$.`, answer: val(r.U) };
}

export interface PochemuKondensatora {
  paras: string[];
  head: string[];
  rows: string[][];
  podpis: string;
  /** Значения таблицы — для автотеста: t по формуле в каждой точке. */
  tochki: { U: number; t: number }[];
}

/** Рамка «Почему так»: «не менее t» → «не более U», таблица на четыре напряжения. */
export function pochemuKondensatora(p: ParamsKondensatora): PochemuKondensatora {
  const r = raschet(p);
  const U0 = d(p.U0);
  /* Напряжения U₀, U₀/2, U₀/4, … до U₀/2^(k+1): граница — в середине таблицы. */
  const shagov = r.k + 1;
  const tochki: { U: Q; o: number; t: Q }[] = [];
  for (let i = 0; i <= shagov; i += 1) {
    tochki.push({ U: div(fromDecimal(p.U0), q(2 ** i)), o: 2 ** i, t: mul(r.aRC, q(i)) });
  }
  return {
    paras: [
      'Чем больше времени прошло после выключения, тем сильнее разрядился конденсатор — тем меньше напряжение.',
      `Это видно и по формуле: при уменьшении $U$ дробь $\\dfrac{U_0}{U}$ растёт, а логарифм по основанию $2$ растёт вместе с ней, значит, растёт $t$. Поэтому «времени прошло не меньше» означает «напряжение стало не больше».`,
      `Посчитаем для этого примера: $t=${ch(r.aRC)}\\cdot\\log_2\\dfrac{${U0}}{U}$.`,
    ],
    head: ['$U$, кВ', ...tochki.map((x) => `$${ch(x.U)}$`)],
    rows: [
      [`$\\dfrac{${U0}}{U}$`, ...tochki.map((x) => `$${x.o}$`)],
      ['$t$, с', ...tochki.map((x) => `$${ch(x.t)}$`)],
    ],
    podpis: `Напряжение падает — время растёт. Время $${d(p.t)}$ с соответствует $U=${ch(r.U)}$ кВ; если прошло больше, напряжение ещё меньше. Поэтому $${ch(r.U)}$ — наибольшее возможное.`,
    tochki: tochki.map((x) => ({ U: val(x.U), t: val(x.t) })),
  };
}

/* ── Чертёж U(t) ─────────────────────────────────────────────────── */

const W = 440;
const H = 280;
const POLE = { l: 44, r: 20, t: 26, b: 42 };

/**
 * Убывающая кривая $U(t)=U_0\cdot2^{-t/(\alpha RC)}$ от $U_0$ при $t=0$.
 * Отмечена граничная точка; участок $t\ge t_0$ подсвечен на кривой и на
 * оси $t$, а на оси $U$ — соответствующий ему отрезок $U\le U_{\max}$.
 * Подписи только у точки и осей. В ч/б печати подсветка видна по
 * толщине линии.
 */
export function chertezhRazryada(p: ParamsKondensatora): string {
  const r = raschet(p);
  const a = val(r.aRC);
  const Ub = val(r.U);
  const tMax = a * (r.k + 2);
  const uMax = p.U0 * 1.1;
  const X = (t: number) => POLE.l + (t / tMax) * (W - POLE.l - POLE.r);
  const Y = (u: number) => H - POLE.b - (u / uMax) * (H - POLE.t - POLE.b);
  const U = (t: number) => p.U0 * 2 ** (-t / a);
  const C = THEME.colors;
  const Wd = THEME.width;
  const parts: string[] = [];

  /* Подсветка: область под кривой при t ≥ t₀. */
  const N = 80;
  const oblast: string[] = [`${px(X(p.t))},${px(Y(0))}`];
  for (let i = 0; i <= N; i += 1) {
    const t = p.t + ((tMax - p.t) * i) / N;
    oblast.push(`${px(X(t))},${px(Y(U(t)))}`);
  }
  oblast.push(`${px(X(tMax))},${px(Y(0))}`);
  parts.push(
    `<polygon class="z10-razryad__oblast" points="${oblast.join(' ')}" fill="${C.accent}" fill-opacity="0.12"/>`,
  );

  /* Оси со стрелками. */
  const strelka = (x: number, y: number, dx: number, dy: number) => {
    const al = THEME.geometry.arrowLen;
    const ah = THEME.geometry.arrowHalf;
    return `<path d="M${px(x)},${px(y)} L${px(x - dx * al - dy * ah)},${px(y - dy * al + dx * ah)} L${px(x - dx * al + dy * ah)},${px(y - dy * al - dx * ah)} Z" fill="${C.axis}"/>`;
  };
  const xKon = W - 8;
  const yKon = 10;
  parts.push(
    `<line x1="${px(X(0))}" y1="${px(Y(0))}" x2="${px(xKon)}" y2="${px(Y(0))}" stroke="${C.axis}" stroke-width="${Wd.axis}"/>`,
    strelka(xKon, Y(0), 1, 0),
    `<line x1="${px(X(0))}" y1="${px(Y(0))}" x2="${px(X(0))}" y2="${px(yKon)}" stroke="${C.axis}" stroke-width="${Wd.axis}"/>`,
    strelka(X(0), yKon, 0, -1),
  );

  /* Подсвеченные отрезки осей: t ≥ t₀ и U ≤ U_max. */
  parts.push(
    `<line class="z10-razryad__os-t" x1="${px(X(p.t))}" y1="${px(Y(0))}" x2="${px(X(tMax))}" y2="${px(Y(0))}" stroke="${C.accent}" stroke-width="${Wd.curve + 2}" stroke-linecap="round"/>`,
    `<line class="z10-razryad__os-u" x1="${px(X(0))}" y1="${px(Y(0))}" x2="${px(X(0))}" y2="${px(Y(Ub))}" stroke="${C.accent}" stroke-width="${Wd.curve + 2}" stroke-linecap="round"/>`,
  );

  /* Кривая: до t₀ — обычная, после — подсвеченная и толще. */
  const kriv = (t0: number, t1: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= N; i += 1) {
      const t = t0 + ((t1 - t0) * i) / N;
      pts.push(`${px(X(t))},${px(Y(U(t)))}`);
    }
    return pts.join(' ');
  };
  parts.push(
    `<polyline points="${kriv(0, p.t)}" fill="none" stroke="${C.lineA}" stroke-width="${Wd.curve}" stroke-linejoin="round"/>`,
    `<polyline points="${kriv(p.t, tMax)}" fill="none" stroke="${C.accent}" stroke-width="${Wd.curve + 1}" stroke-linejoin="round"/>`,
  );

  /* Пунктир от точки к осям и сама точка. */
  parts.push(
    `<line x1="${px(X(p.t))}" y1="${px(Y(Ub))}" x2="${px(X(p.t))}" y2="${px(Y(0))}" stroke="${C.axis}" stroke-width="1" stroke-dasharray="4 4"/>`,
    `<line x1="${px(X(p.t))}" y1="${px(Y(Ub))}" x2="${px(X(0))}" y2="${px(Y(Ub))}" stroke="${C.axis}" stroke-width="1" stroke-dasharray="4 4"/>`,
    `<circle cx="${px(X(p.t))}" cy="${px(Y(Ub))}" r="4.5" fill="${C.accent}" stroke="#fff" stroke-width="1.5"/>`,
  );

  /* Подписи: точка, её координаты на осях, имена осей. */
  const f = THEME.font.axisName;
  const podpisTochki = `(${d(p.t).replace('{,}', ',')}; ${ch(r.U).replace('{,}', ',')})`;
  parts.push(
    svgText(podpisTochki, X(p.t) + 8, Y(Ub) - 10, 'start', { size: 16, weight: 600 }),
    svgText(d(p.t).replace('{,}', ','), X(p.t), Y(0) + 22, 'middle', { size: 15 }),
    svgText(ch(r.U).replace('{,}', ','), X(0) - 8, Y(Ub) + 5, 'end', { size: 15 }),
    svgText('t, с', xKon, Y(0) + 22, 'end', { size: f, style: 'italic' }),
    svgText('U, кВ', X(0) + 10, yKon + 10, 'start', { size: f, style: 'italic' }),
  );
  /* Ширина подписи точки не должна выходить за холст. */
  if (X(p.t) + 8 + textWidth(podpisTochki, 16) > W) {
    throw new Error('конденсатор: подпись точки не помещается');
  }

  const label = `График напряжения на конденсаторе после выключения: напряжение убывает от ${d(p.U0).replace('{,}', ',')} кВ; в момент ${d(p.t).replace('{,}', ',')} с оно равно ${ch(r.U).replace('{,}', ',')} кВ, а позже ещё меньше`;
  return (
    `<svg class="z10-razryad" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">` +
    `<title>${esc(label)}</title>${parts.join('')}</svg>`
  );
}
