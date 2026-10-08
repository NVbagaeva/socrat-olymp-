/**
 * Раздел ВД — движение по воде (ВД-01 … ВД-07).
 *
 * По течению v + c, против течения v − c; плот плывёт со скоростью
 * течения; на озере течения нет.
 */

import {
  chtoSprashivayut,
  drobnoe,
  dvizhenie,
  etapy,
  key,
  kvadrat,
  num,
  osh,
  slovo,
  str,
  vopros,
  type DrobnoeEtapy,
} from '../kit';
import { d, div, fq, mul, q, sub, txt, val, type Q } from '../num';
import { chasy, sk, vremya, zaglavnaya, SLOVA } from '../sklonenie';
import type { HintStep, Subtype } from '../types';
import { otvet } from './common';

/** Время туда и обратно: S/(v + c) + S/(v − c) в TeX. */
const tudaObratno = (S: string, v: string, c: string): string =>
  `\\dfrac{${S}}{${v}+${c}}+\\dfrac{${S}}{${v}-${c}}`;

/** Таблица S | v | t для пути туда и обратно по реке. */
function tablitsaReki(
  S: string,
  v: string,
  c: string,
  label: [string, string] = ['По течению', 'Против течения'],
) {
  return dvizhenie([
    [label[0], S, `${v}+${c}`, `\\dfrac{${S}}{${v}+${c}}`],
    [label[1], S, `${v}-${c}`, `\\dfrac{${S}}{${v}-${c}}`],
  ]);
}

/** Вопрос подсказки о скорости против течения: собственная v, течение c (TeX). */
function hintSkorosti(v: string, c: string): HintStep {
  return vopros(
    'Какова скорость против течения?',
    `$${v}-${c}$`,
    [`$${v}+${c}$`, `$${c}-${v}$`],
    'Против течения скорость уменьшается на скорость течения.',
  );
}

/**
 * Неизвестна собственная скорость x: T·x² − 2S·x − T·c² = 0, где T —
 * время в движении (дробь). Возвращает шаги ОДЗ, решения и отбора
 * корней (lib/zadanie11/kit drobnoe) и корень.
 */
function sobstvennaya(S: number, c: number, T: Q): { t: DrobnoeEtapy; x: number } {
  const sol = kvadrat(T.n, -2 * S * T.m, -c * c * T.n);
  const t = drobnoe({
    nuli: [c, -c],
    lo: c,
    pochemu: `против течения скорость $x-${d(c)}$ положительна`,
    znamenatel: `(x+${d(c)})(x-${d(c)})`,
    posle: [
      `$${d(S)}(x-${d(c)})+${d(S)}(x+${d(c)})=${fq(T)}(x^2-${d(c * c)})$, то есть $${d(2 * S)}x=${fq(T)}(x^2-${d(c * c)})$.`,
      `$${sol.ishodnoe}$.`,
      ...sol.lines,
    ],
    roots: sol.roots.map(val),
  });
  return { t, x: t.root };
}

/** Неизвестна скорость течения x: x² = v² − 2Sv/T. */
function techenie(S: number, v: number, T: Q): { t: DrobnoeEtapy; c: number } {
  const c2 = sub(q(v * v), div(q(2 * S * v), T));
  const c = Math.sqrt(val(c2));
  const t = drobnoe({
    nuli: [v, -v],
    lo: 0,
    hi: v,
    pochemu: 'скорость течения положительна и меньше собственной скорости',
    znamenatel: `(${d(v)}+x)(${d(v)}-x)`,
    posle: [
      `$${d(S)}(${d(v)}-x)+${d(S)}(${d(v)}+x)=${fq(T)}(${d(v * v)}-x^2)$, то есть $${d(2 * S)}\\cdot${d(v)}=${fq(T)}(${d(v * v)}-x^2)$.`,
      `$${d(v * v)}-x^2=${fq(div(q(2 * S * v), T))}$, $x^2=${fq(c2)}$, $x=\\pm${d(c)}$.`,
    ],
    roots: [-c, c],
  });
  return { t, c: t.root };
}

/* ── ВД-01 Найти весь путь ───────────────────────────────────── */

const VD01: Subtype = {
  id: 'VD-01',
  section: 'VD',
  title: 'Туда и обратно со стоянкой: найти весь путь',
  level: 1,
  keywords: ['теплоход', 'стоянка', 'весь рейс', 'течение'],
  solve(p) {
    const v = num(p, 'v');
    const c = num(p, 'c');
    const st = num(p, 'st');
    const T = num(p, 'T');
    const move = T - st;
    const S = val(div(q(move * (v * v - c * c)), q(2 * v)));
    const ans = 2 * S;
    /* Аналог: катер, буксир, паром (мужской род). */
    const kto = slovo(p, 'kto', 'теплоход');
    return {
      uslovie: `Теплоход, скорость которого в неподвижной воде равна ${txt(v)} км/ч, проходит по течению реки и после стоянки возвращается в исходный пункт. Скорость течения равна ${txt(c)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в исходный пункт теплоход возвращается через ${sk(T, SLOVA.chas)} после отправления из него. Сколько километров проходит теплоход за весь рейс?`,
      answer: ans,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Расстояние в одну сторону — $x$ км. Скорость по течению $${d(v + c)}$, против — $${d(v - c)}$ км/ч.`,
          ],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$\\dfrac{x}{${d(v + c)}}+\\dfrac{x}{${d(v - c)}}=${d(move)}$.`]],
        [
          'Решение',
          [
            `$x\\cdot\\dfrac{${d(v - c)}+${d(v + c)}}{${d(v + c)}\\cdot${d(v - c)}}=${d(move)}$, $x\\cdot\\dfrac{${d(2 * v)}}{${d(v * v - c * c)}}=${d(move)}$, $x=${d(S)}$.`,
          ],
        ],
        [
          'Ответ на вопрос задачи',
          [`Спрашивают весь рейс — туда и обратно: $2\\cdot${d(S)}=${d(ans)}$ км.`, otvet(ans)],
        ],
      ),
      tables: [tablitsaReki('x', d(v), d(c))],
      hints: [
        vopros(`С какой скоростью ${kto} идёт по течению?`, `$${d(v + c)}$ км/ч`, [
          `$${d(v - c)}$ км/ч`,
          `$${d(v)}$ км/ч`,
        ]),
        vopros(`Сколько часов ${kto} был в движении?`, `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros('Какое уравнение?', `$\\dfrac{x}{${d(v + c)}}+\\dfrac{x}{${d(v - c)}}=${d(move)}$`, [
          `$\\dfrac{x}{${d(v + c)}}+\\dfrac{x}{${d(v - c)}}=${d(T)}$`,
          `$\\dfrac{x}{${d(v + c)}}-\\dfrac{x}{${d(v - c)}}=${d(move)}$`,
        ]),
        chtoSprashivayut('путь за весь рейс — туда и обратно', [
          'путь в одну сторону',
          'время в пути',
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

/* ── ВД-02 Найти собственную скорость ────────────────────────── */

const VD02: Subtype = {
  id: 'VD-02',
  section: 'VD',
  title: 'Туда и обратно со стоянкой: найти собственную скорость',
  level: 2,
  keywords: ['теплоход', 'стоянка', 'неподвижной воде', 'собственная скорость'],
  solve(p) {
    const S = num(p, 'S');
    const c = num(p, 'c');
    const st = num(p, 'st');
    const T = num(p, 'T');
    const move = T - st;
    const r = sobstvennaya(S, c, q(move));
    /* Аналог: катер, буксир, паром (мужской род). */
    const kto = slovo(p, 'kto', 'теплоход');
    const ktoRod = slovo(p, 'ktoRod', 'теплохода');
    return {
      uslovie: `Теплоход проходит по течению реки до пункта назначения ${txt(S)} км и после стоянки возвращается в пункт отправления. Найдите скорость теплохода в неподвижной воде, если скорость течения равна ${txt(c)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в пункт отправления теплоход возвращается через ${sk(T, SLOVA.chas)}. Ответ дайте в км/ч.`,
      answer: r.x,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Скорость ${ktoRod} в неподвижной воде — $x$ км/ч. По течению $x+${d(c)}$, против — $x-${d(c)}$.`,
          ],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${d(move)}$.`]],
        r.t.odz,
        r.t.reshenie,
        ['Отбор корней и ответ', [...r.t.otbor, otvet(r.x)]],
      ),
      tables: [tablitsaReki(d(S), 'x', d(c))],
      hints: [
        hintSkorosti('x', d(c)),
        vopros(`Сколько часов ${kto} был в движении?`, `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros('Какое уравнение?', `$${tudaObratno(d(S), 'x', d(c))}=${d(move)}$`, [
          `$${tudaObratno(d(S), 'x', d(c))}=${d(T)}$`,
          `$\\dfrac{${d(S)}}{x-${d(c)}}-\\dfrac{${d(S)}}{x+${d(c)}}=${d(move)}$`,
        ]),
        r.t.hintOdz,
        r.t.hintKoren,
        chtoSprashivayut('скорость в неподвижной воде', [
          'скорость по течению',
          'скорость течения',
        ]),
      ],
      lifehacks: ['divide-equation', 'fast-count'],
    };
  },
};

/* ── ВД-03 Найти скорость течения ────────────────────────────── */

const VD03: Subtype = {
  id: 'VD-03',
  section: 'VD',
  title: 'Туда и обратно со стоянкой: найти скорость течения',
  level: 2,
  keywords: ['теплоход', 'стоянка', 'скорость течения'],
  solve(p) {
    const S = num(p, 'S');
    const v = num(p, 'v');
    const st = num(p, 'st');
    const T = num(p, 'T');
    const move = T - st;
    const r = techenie(S, v, q(move));
    /* Аналог: катер, буксир, паром (мужской род). */
    const kto = slovo(p, 'kto', 'теплоход');
    const ktoRod = slovo(p, 'ktoRod', 'теплохода');
    return {
      uslovie: `Теплоход проходит по течению реки до пункта назначения ${txt(S)} км и после стоянки возвращается в пункт отправления. Найдите скорость течения, если скорость теплохода в неподвижной воде равна ${txt(v)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в пункт отправления теплоход возвращается через ${sk(T, SLOVA.chas)}. Ответ дайте в км/ч.`,
      answer: r.c,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $x$ км/ч. По течению $${d(v)}+x$, против — $${d(v)}-x$.`],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$${tudaObratno(d(S), d(v), 'x')}=${d(move)}$.`]],
        r.t.odz,
        r.t.reshenie,
        ['Отбор корней и ответ', [...r.t.otbor, otvet(r.c)]],
      ),
      tables: [tablitsaReki(d(S), d(v), 'x')],
      hints: [
        hintSkorosti(d(v), 'x'),
        vopros(`Сколько часов ${kto} был в движении?`, `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros(
          'Какое уравнение получится после общего знаменателя?',
          `неполное квадратное: $x^2=\\ldots$`,
          ['линейное', 'кубическое'],
        ),
        r.t.hintOdz,
        r.t.hintKoren,
        chtoSprashivayut('скорость течения', [`скорость ${ktoRod}`, 'время в пути']),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

/* ── ВД-04 Против течения и обратно, обратный путь на Δ меньше ─ */

const VD04: Subtype = {
  id: 'VD-04',
  section: 'VD',
  title: 'Против течения и обратно: обратный путь быстрее',
  level: 2,
  keywords: ['моторная лодка', 'против течения', 'обратный путь', 'меньше'],
  solve(p) {
    const S = num(p, 'S');
    const Dl = num(p, 'delta');
    const ask = str(p, 'ask', ['c', 'v'] as const);
    /* Аналог: катер, байдарка, буксир. */
    const ktoRod = slovo(p, 'ktoRod', 'лодки');
    const shla = slovo(p, 'shla', 'лодка шла');
    if (ask === 'c') {
      const v = num(p, 'v');
      const sol = kvadrat(Dl, 2 * S, -Dl * v * v, 'x');
      const c = val(sol.roots[1]);
      const dr = drobnoe({
        nuli: [v, -v],
        lo: 0,
        hi: v,
        pochemu: `скорость течения положительна и меньше скорости ${ktoRod}`,
        znamenatel: `(${d(v)}-x)(${d(v)}+x)`,
        posle: [
          `$${d(S)}(${d(v)}+x)-${d(S)}(${d(v)}-x)=${d(Dl)}(${d(v * v)}-x^2)$, $${d(2 * S)}x=${d(Dl)}(${d(v * v)}-x^2)$.`,
          `$${sol.ishodnoe}$.`,
          ...sol.lines,
        ],
        roots: sol.roots.map(val),
      });
      return {
        uslovie: `Моторная лодка прошла против течения реки ${txt(S)} км и вернулась в пункт отправления, затратив на обратный путь на ${sk(Dl, SLOVA.chas)} меньше. Найдите скорость течения, если скорость лодки в неподвижной воде равна ${txt(v)} км/ч. Ответ дайте в км/ч.`,
        answer: c,
        etapy: etapy(
          [
            'Обозначаем',
            [`Скорость течения — $x$ км/ч. Против течения $${d(v)}-x$, по течению $${d(v)}+x$.`],
          ],
          ['Таблица', [`Против течения ${shla} дольше.`]],
          ['Уравнение', [`$\\dfrac{${d(S)}}{${d(v)}-x}-\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$.`]],
          dr.odz,
          dr.reshenie,
          ['Отбор корней и ответ', [...dr.otbor, otvet(c)]],
        ),
        tables: [tablitsaReki(d(S), d(v), 'x', ['Обратно (по течению)', 'Туда (против течения)'])],
        hints: [
          vopros('Какой путь занял больше времени?', 'против течения', ['по течению', 'одинаково']),
          vopros(
            'Какое уравнение?',
            `$\\dfrac{${d(S)}}{${d(v)}-x}-\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$`,
            [
              `$\\dfrac{${d(S)}}{${d(v)}+x}-\\dfrac{${d(S)}}{${d(v)}-x}=${d(Dl)}$`,
              `$\\dfrac{${d(S)}}{${d(v)}-x}+\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$`,
            ],
          ),
          dr.hintOdz,
          dr.hintKoren,
          chtoSprashivayut('скорость течения', [`скорость ${ktoRod}`, 'время в пути']),
        ],
        lifehacks: ['divide-equation'],
      };
    }
    const c = num(p, 'c');
    const sol = kvadrat(Dl, 0, -(2 * S * c + Dl * c * c), 'x');
    const x = val(sol.roots[1]);
    const dr = drobnoe({
      nuli: [c, -c],
      lo: c,
      pochemu: `против течения скорость $x-${d(c)}$ положительна`,
      znamenatel: `(x-${d(c)})(x+${d(c)})`,
      posle: [
        `$${d(S)}(x+${d(c)})-${d(S)}(x-${d(c)})=${d(Dl)}(x^2-${d(c * c)})$, $${d(2 * S * c)}=${d(Dl)}x^2-${d(Dl * c * c)}$.`,
        `$${sol.ishodnoe}$.`,
        ...sol.lines,
      ],
      roots: sol.roots.map(val),
    });
    return {
      uslovie: `Моторная лодка прошла против течения реки ${txt(S)} км и вернулась в пункт отправления, затратив на обратный путь на ${sk(Dl, SLOVA.chas)} меньше. Найдите скорость лодки в неподвижной воде, если скорость течения равна ${txt(c)} км/ч. Ответ дайте в км/ч.`,
      answer: x,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Скорость ${ktoRod} в неподвижной воде — $x$ км/ч. Против течения $x-${d(c)}$, по течению $x+${d(c)}$.`,
          ],
        ],
        ['Таблица', [`Против течения ${shla} дольше.`]],
        ['Уравнение', [`$\\dfrac{${d(S)}}{x-${d(c)}}-\\dfrac{${d(S)}}{x+${d(c)}}=${d(Dl)}$.`]],
        dr.odz,
        dr.reshenie,
        ['Отбор корней и ответ', [...dr.otbor, otvet(x)]],
      ),
      tables: [tablitsaReki(d(S), 'x', d(c), ['Обратно (по течению)', 'Туда (против течения)'])],
      hints: [
        vopros('Какой путь занял больше времени?', 'против течения', ['по течению', 'одинаково']),
        vopros(
          'Какое уравнение?',
          `$\\dfrac{${d(S)}}{x-${d(c)}}-\\dfrac{${d(S)}}{x+${d(c)}}=${d(Dl)}$`,
          [
            `$\\dfrac{${d(S)}}{x+${d(c)}}-\\dfrac{${d(S)}}{x-${d(c)}}=${d(Dl)}$`,
            `$\\dfrac{${d(S)}}{x-${d(c)}}+\\dfrac{${d(S)}}{x+${d(c)}}=${d(Dl)}$`,
          ],
        ),
        vopros(
          'Что получится после общего знаменателя?',
          'неполное квадратное уравнение $x^2=\\ldots$',
          ['линейное уравнение', 'полное квадратное'],
        ),
        dr.hintOdz,
        dr.hintKoren,
        chtoSprashivayut(`скорость ${ktoRod} в неподвижной воде`, [
          'скорость течения',
          'скорость против течения',
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

/* ── ВД-05 Время по часам ────────────────────────────────────── */

const SUDNO: Record<
  string,
  {
    kto: string;
    vyshel: string;
    probyv: string;
    vernulsya: string;
    ask: 'v' | 'c';
    potech: boolean;
  }
> = {
  kater: {
    kto: 'Катер',
    vyshel: 'вышел',
    probyv: 'катер отправился',
    vernulsya: 'вернулся',
    ask: 'v',
    potech: true,
  },
  barzha: {
    kto: 'Баржа',
    vyshel: 'вышла',
    probyv: 'баржа отправилась',
    vernulsya: 'вернулась',
    ask: 'c',
    potech: false,
  },
  lodka: {
    kto: 'Моторная лодка',
    vyshel: 'вышла',
    probyv: 'лодка отправилась',
    vernulsya: 'вернулась',
    ask: 'c',
    potech: false,
  },
  baidarka: {
    kto: 'Байдарка',
    vyshel: 'вышла',
    probyv: 'байдарка отправилась',
    vernulsya: 'вернулась',
    ask: 'v',
    potech: false,
  },
};

const VD05: Subtype = {
  id: 'VD-05',
  section: 'VD',
  title: 'Время по часам: вышел в 10:00, вернулся в 18:00',
  level: 2,
  keywords: ['катер', 'баржа', 'байдарка', 'лодка', 'вернулся в', 'того же дня'],
  oshibki: ['stoyanka', 'ne-ta-velichina'],
  solve(p) {
    const form = str(p, 'form', ['kater', 'barzha', 'lodka', 'baidarka'] as const);
    const s = key(SUDNO, form);
    const t0 = num(p, 't0');
    const S = num(p, 'S');
    const st = num(p, 'st'); // минуты
    const t1 = num(p, 't1');
    const lead = form !== 'lodka';
    /* «Найди ошибку»: стоянка не вычтена или в ответ записана скорость по течению. */
    const oshibka = osh(p);
    const move =
      oshibka === 'stoyanka'
        ? sub(q(t1 * 60), q(t0 * 60))
        : sub(sub(q(t1 * 60), q(t0 * 60)), q(st));
    const T = div(move, q(60));
    /* Типичная ошибка: «1 ч 30 мин» как 1,3 ч. */
    const naive = q(Math.floor(st / 60) * 100 + (st % 60), 100);
    const kogo =
      form === 'kater'
        ? 'катера'
        : form === 'barzha'
          ? 'баржи'
          : form === 'lodka'
            ? 'лодки'
            : 'байдарки';
    const vopr =
      s.ask === 'v'
        ? `Определите ${form === 'kater' ? 'собственную скорость катера (в км/ч)' : '(в км/ч) собственную скорость байдарки'}, если известно, что скорость течения реки ${txt(num(p, 'c'))} км/ч.`
        : `Определите (в км/ч) скорость течения реки, если известно, что собственная скорость ${kogo} равна ${txt(num(p, 'v'))} км/ч.`;
    const uslovie = `${s.kto} в ${chasy(t0, lead)} ${s.vyshel}${s.potech ? ' по течению реки' : ''} из пункта А в пункт В, расположенный в ${txt(S)} км от А. Пробыв в пункте В ${vremya(st, true)}, ${s.probyv} назад и ${s.vernulsya} в пункт А в ${chasy(t1, lead)} того же дня. ${vopr}`;
    const timeLines =
      oshibka === 'stoyanka'
        ? [
            `С ${chasy(t0, lead)} до ${chasy(t1, lead)} прошло $${d(t1 - t0)}$ ч — это время в движении.`,
          ]
        : [
            `С ${chasy(t0, lead)} до ${chasy(t1, lead)} прошло $${d(t1 - t0)}$ ч, из них ${vremya(st)} — стоянка. В движении: $${d(t1 - t0)}-${fq(q(st, 60))}=${fq(T)}$ ч.`,
          ];
    if (s.ask === 'v') {
      const c = num(p, 'c');
      const r = sobstvennaya(S, c, T);
      const potech = oshibka === 'ne-ta-velichina';
      const ans = potech ? r.x + c : r.x;
      return {
        uslovie,
        answer: ans,
        etapy: etapy(
          [
            'Обозначаем',
            [
              `Собственная скорость ${kogo} — $x$ км/ч. По течению $x+${d(c)}$, против — $x-${d(c)}$.`,
            ],
          ],
          ['Время в движении', timeLines],
          ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$.`]],
          r.t.odz,
          r.t.reshenie,
          [
            'Отбор корней и ответ',
            [
              ...r.t.otbor,
              ...(potech ? [`Скорость по течению: $x+${d(c)}=${d(ans)}$ км/ч.`] : []),
              otvet(ans),
            ],
          ],
        ),
        tables: [tablitsaReki(d(S), 'x', d(c))],
        hints: [
          vopros('Сколько часов судно было в движении?', `$${fq(T)}$`, [
            `$${d(t1 - t0)}$`,
            `$${fq(sub(q(t1 - t0), naive), true)}$`,
          ]),
          hintSkorosti('x', d(c)),
          vopros('Какое уравнение?', `$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$`, [
            `$${tudaObratno(d(S), 'x', d(c))}=${d(t1 - t0)}$`,
            `$\\dfrac{${d(2 * S)}}{x}=${fq(T)}$`,
          ]),
          r.t.hintOdz,
          r.t.hintKoren,
          chtoSprashivayut('собственную скорость', ['скорость течения', 'время в пути']),
        ],
        lifehacks: ['divide-equation', 'fast-count'],
      };
    }
    const v = num(p, 'v');
    const r = techenie(S, v, T);
    const potech = oshibka === 'ne-ta-velichina';
    const ans = potech ? v + r.c : r.c;
    return {
      uslovie,
      answer: ans,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $x$ км/ч. По течению $${d(v)}+x$, против — $${d(v)}-x$.`],
        ],
        ['Время в движении', timeLines],
        ['Уравнение', [`$${tudaObratno(d(S), d(v), 'x')}=${fq(T)}$.`]],
        r.t.odz,
        r.t.reshenie,
        [
          'Отбор корней и ответ',
          [
            ...r.t.otbor,
            ...(potech ? [`Скорость по течению: $${d(v)}+x=${d(ans)}$ км/ч.`] : []),
            otvet(ans),
          ],
        ],
      ),
      tables: [tablitsaReki(d(S), d(v), 'x')],
      hints: [
        vopros('Сколько часов судно было в движении?', `$${fq(T)}$`, [
          `$${d(t1 - t0)}$`,
          `$${fq(sub(q(t1 - t0), naive), true)}$`,
        ]),
        hintSkorosti(d(v), 'x'),
        vopros('Какое уравнение?', `$${tudaObratno(d(S), d(v), 'x')}=${fq(T)}$`, [
          `$${tudaObratno(d(S), d(v), 'x')}=${d(t1 - t0)}$`,
          `$\\dfrac{${d(2 * S)}}{${d(v)}}=${fq(T)}$`,
        ]),
        r.t.hintOdz,
        r.t.hintKoren,
        chtoSprashivayut('скорость течения', ['собственную скорость', 'время в пути']),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

/* ── ВД-06 Плот и яхта ───────────────────────────────────────── */

const VD06: Subtype = {
  id: 'VD-06',
  section: 'VD',
  title: 'Плот и яхта',
  level: 3,
  keywords: ['плот', 'яхта', 'вслед', 'повернула обратно'],
  solve(p) {
    const S = num(p, 'S');
    const h = num(p, 'h');
    const rr = num(p, 'r');
    const c = num(p, 'c');
    const raft = q(rr, c);
    const T = sub(raft, q(h));
    const r = sobstvennaya(S, c, T);
    /* Аналог: моторная лодка, байдарка (женский род). */
    const kto = slovo(p, 'kto', 'яхта');
    const ktoRod = slovo(p, 'ktoRod', 'яхты');
    return {
      uslovie: `Расстояние между пристанями А и В равно ${txt(S)} км. Из А в В по течению реки отправился плот, а через ${sk(h, SLOVA.chas)} вслед за ним отправилась яхта, которая, прибыв в пункт В, тотчас повернула обратно и возвратилась в А. К этому времени плот проплыл ${txt(rr)} км. Найдите скорость яхты в неподвижной воде, если скорость течения реки равна ${txt(c)} км/ч. Ответ дайте в км/ч.`,
      answer: r.x,
      etapy: etapy(
        ['Обозначаем', [`Скорость ${ktoRod} в неподвижной воде — $x$ км/ч.`]],
        [
          `Время ${ktoRod}`,
          [
            `Плот плывёт со скоростью течения: $${d(rr)}$ км он проплыл за $${frac2(rr, c)}=${fq(raft)}$ ч.`,
            `${zaglavnaya(kto)} вышла на $${d(h)}$ ч позже: она в пути $${fq(raft)}-${d(h)}=${fq(T)}$ ч.`,
          ],
        ],
        ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$.`]],
        r.t.odz,
        r.t.reshenie,
        ['Отбор корней и ответ', [...r.t.otbor, otvet(r.x)]],
      ),
      tables: [
        dvizhenie([
          ['Плот', d(rr), d(c), fq(raft)],
          [`${zaglavnaya(kto)} туда`, d(S), `x+${d(c)}`, `\\dfrac{${d(S)}}{x+${d(c)}}`],
          [`${zaglavnaya(kto)} обратно`, d(S), `x-${d(c)}`, `\\dfrac{${d(S)}}{x-${d(c)}}`],
        ]),
      ],
      hints: [
        vopros('С какой скоростью плывёт плот?', 'со скоростью течения', [
          '$0$ — у плота нет скорости',
          `со скоростью ${ktoRod}`,
        ]),
        vopros('Сколько часов плыл плот?', `$${fq(raft)}$`, [
          `$${fq(sub(raft, q(h)))}$`,
          `$${d(rr)}$`,
        ]),
        vopros(`Сколько часов была в пути ${kto}?`, `$${fq(T)}$`, [
          `$${fq(raft)}$`,
          `$${fq(mul(q(2), raft))}$`,
        ]),
        r.t.hintOdz,
        r.t.hintKoren,
        chtoSprashivayut(`скорость ${ktoRod} в неподвижной воде`, [
          'скорость течения',
          `время ${ktoRod}`,
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
};

function frac2(a: number, b: number): string {
  return `\\dfrac{${d(a)}}{${d(b)}}`;
}

/* ── ВД-07 По течению и обратно, обратный путь дольше на Δ ──── */

const VD07: Subtype = {
  id: 'VD-07',
  section: 'VD',
  title: 'По течению и обратно: обратный путь дольше',
  level: 2,
  keywords: ['катер', 'по течению', 'обратный путь', 'больше времени'],
  solve(p) {
    const S = num(p, 'S');
    const Dl = num(p, 'delta');
    const v = num(p, 'v');
    const sol = kvadrat(Dl, 2 * S, -Dl * v * v, 'x');
    /* Аналог: теплоход, лодка, буксир. */
    const ktoRod = slovo(p, 'ktoRod', 'катера');
    const c = val(sol.roots[1]);
    const dr = drobnoe({
      nuli: [v, -v],
      lo: 0,
      hi: v,
      pochemu: `скорость течения положительна и меньше скорости ${ktoRod}`,
      znamenatel: `(${d(v)}-x)(${d(v)}+x)`,
      posle: [`$${d(2 * S)}x=${d(Dl)}(${d(v * v)}-x^2)$.`, `$${sol.ishodnoe}$.`, ...sol.lines],
      roots: sol.roots.map(val),
    });
    return {
      uslovie: `Пройдя ${txt(S)} км по течению реки, катер возвращается в исходную точку, причём обратный путь занимает на ${sk(Dl, SLOVA.chas)} больше времени. Найдите скорость течения, если скорость катера в неподвижной воде равна ${txt(v)} км/ч.`,
      answer: c,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $x$ км/ч. По течению $${d(v)}+x$, против — $${d(v)}-x$.`],
        ],
        ['Таблица', ['Обратный путь — против течения, он дольше.']],
        ['Уравнение', [`$\\dfrac{${d(S)}}{${d(v)}-x}-\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$.`]],
        dr.odz,
        dr.reshenie,
        ['Отбор корней и ответ', [...dr.otbor, otvet(c)]],
      ),
      tables: [tablitsaReki(d(S), d(v), 'x')],
      hints: [
        vopros('Какой путь дольше?', 'обратный — против течения', ['по течению', 'одинаково']),
        vopros(
          'Какое уравнение?',
          `$\\dfrac{${d(S)}}{${d(v)}-x}-\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$`,
          [
            `$\\dfrac{${d(S)}}{${d(v)}+x}-\\dfrac{${d(S)}}{${d(v)}-x}=${d(Dl)}$`,
            `$\\dfrac{${d(S)}}{${d(v)}-x}+\\dfrac{${d(S)}}{${d(v)}+x}=${d(Dl)}$`,
          ],
        ),
        vopros('Какой лайфхак поможет с корнем?', `подобрать целое $x$ и проверить подстановкой`, [
          'взять среднее арифметическое',
          'перейти к минутам',
        ]),
        dr.hintOdz,
        dr.hintKoren,
        chtoSprashivayut('скорость течения', [`скорость ${ktoRod}`, 'время в пути']),
      ],
      lifehacks: ['root-guess'],
    };
  },
};

export const VD: Subtype[] = [VD01, VD02, VD03, VD04, VD05, VD06, VD07];
