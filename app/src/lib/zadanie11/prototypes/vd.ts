/**
 * Раздел ВД — движение по воде (ВД-01 … ВД-07).
 *
 * По течению v + c, против течения v − c; плот плывёт со скоростью
 * течения; на озере течения нет.
 */

import { chtoSprashivayut, etapy, key, kvadrat, num, str, tablitsa, vopros } from '../kit';
import { d, div, fq, mul, q, sub, txt, val, type Q } from '../num';
import { chasy, sk, vremya, SLOVA } from '../sklonenie';
import type { HintStep, Subtype } from '../types';
import { otvet } from './common';

const HEAD = ['', '$v$, км/ч', '$t$, ч', '$S$, км'];

/** Время туда и обратно: S/(v + c) + S/(v − c) в TeX. */
const tudaObratno = (S: string, v: string, c: string): string =>
  `\\dfrac{${S}}{${v}+${c}}+\\dfrac{${S}}{${v}-${c}}`;

function tablitsaReki(
  S: string,
  v: string,
  c: string,
  label: [string, string] = ['По течению', 'Против течения'],
) {
  return tablitsa(HEAD, [
    [label[0], `$${v}+${c}$`, `$\\dfrac{${S}}{${v}+${c}}$`, `$${S}$`],
    [label[1], `$${v}-${c}$`, `$\\dfrac{${S}}{${v}-${c}}$`, `$${S}$`],
  ]);
}

const HINT_SKOROSTI: HintStep = vopros(
  'Какая скорость по течению и против течения?',
  '$v+c$ и $v-c$',
  ['$v-c$ и $v+c$', '$v$ и $c$'],
);

/**
 * Неизвестна собственная скорость x: T·x² − 2S·x − T·c² = 0, где T —
 * время в движении (дробь). Возвращает строки решения и корень.
 */
function sobstvennaya(S: number, c: number, T: Q): { lines: string[]; x: number } {
  const a = T.n;
  const b = -2 * S * T.m;
  const cc = -c * c * T.n;
  const sol = kvadrat(a, b, cc);
  const x = val(sol.roots[1]);
  return {
    lines: [
      `Приводим к общему знаменателю: $${d(S)}(x-${d(c)})+${d(S)}(x+${d(c)})=${fq(T)}(x^2-${d(c * c)})$, то есть $${d(2 * S)}x=${fq(T)}(x^2-${d(c * c)})$.`,
      `$${sol.ishodnoe}$.`,
      ...sol.lines,
    ],
    x,
  };
}

/** Неизвестна скорость течения: c² = v² − 2Sv/T. */
function techenie(S: number, v: number, T: Q): { lines: string[]; c: number } {
  const c2 = sub(q(v * v), div(q(2 * S * v), T));
  const c = Math.sqrt(val(c2));
  return {
    lines: [
      `Приводим к общему знаменателю: $${d(2 * S)}\\cdot${d(v)}=${fq(T)}(${d(v * v)}-c^2)$.`,
      `$${d(v * v)}-c^2=${fq(div(q(2 * S * v), T))}$, $c^2=${fq(c2)}$, $c=\\pm${d(c)}$.`,
    ],
    c,
  };
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
    return {
      uslovie: `Теплоход, скорость которого в неподвижной воде равна ${txt(v)} км/ч, проходит по течению реки и после стоянки возвращается в исходный пункт. Скорость течения равна ${txt(c)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в исходный пункт теплоход возвращается через ${sk(T, SLOVA.chas)} после отправления из него. Сколько километров проходит теплоход за весь рейс?`,
      answer: ans,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Расстояние в одну сторону — $S$ км. Скорость по течению $${d(v + c)}$, против — $${d(v - c)}$ км/ч.`,
          ],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$\\dfrac{S}{${d(v + c)}}+\\dfrac{S}{${d(v - c)}}=${d(move)}$.`]],
        [
          'Решение',
          [
            `$S\\cdot\\dfrac{${d(v - c)}+${d(v + c)}}{${d(v + c)}\\cdot${d(v - c)}}=${d(move)}$, $S\\cdot\\dfrac{${d(2 * v)}}{${d(v * v - c * c)}}=${d(move)}$, $S=${d(S)}$.`,
          ],
        ],
        [
          'Ответ на вопрос задачи',
          [`Спрашивают весь рейс — туда и обратно: $2\\cdot${d(S)}=${d(ans)}$ км.`, otvet(ans)],
        ],
      ),
      table: tablitsaReki('S', d(v), d(c)),
      hints: [
        vopros('С какой скоростью теплоход идёт по течению?', `$${d(v + c)}$ км/ч`, [
          `$${d(v - c)}$ км/ч`,
          `$${d(v)}$ км/ч`,
        ]),
        vopros('Сколько часов теплоход был в движении?', `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros('Какое уравнение?', `$\\dfrac{S}{${d(v + c)}}+\\dfrac{S}{${d(v - c)}}=${d(move)}$`, [
          `$\\dfrac{S}{${d(v + c)}}+\\dfrac{S}{${d(v - c)}}=${d(T)}$`,
          `$\\dfrac{S}{${d(v + c)}}-\\dfrac{S}{${d(v - c)}}=${d(move)}$`,
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
    return {
      uslovie: `Теплоход проходит по течению реки до пункта назначения ${txt(S)} км и после стоянки возвращается в пункт отправления. Найдите скорость теплохода в неподвижной воде, если скорость течения равна ${txt(c)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в пункт отправления теплоход возвращается через ${sk(T, SLOVA.chas)}. Ответ дайте в км/ч.`,
      answer: r.x,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Скорость теплохода в неподвижной воде — $x$ км/ч. По течению $x+${d(c)}$, против — $x-${d(c)}$.`,
          ],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${d(move)}$.`]],
        ['Решение', r.lines],
        ['Отбор корня и ответ', [`Скорость больше скорости течения: $x=${d(r.x)}$.`, otvet(r.x)]],
      ),
      table: tablitsaReki(d(S), 'x', d(c)),
      hints: [
        HINT_SKOROSTI,
        vopros('Сколько часов теплоход был в движении?', `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros('Какое уравнение?', `$${tudaObratno(d(S), 'x', d(c))}=${d(move)}$`, [
          `$${tudaObratno(d(S), 'x', d(c))}=${d(T)}$`,
          `$\\dfrac{${d(S)}}{x-${d(c)}}-\\dfrac{${d(S)}}{x+${d(c)}}=${d(move)}$`,
        ]),
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
    return {
      uslovie: `Теплоход проходит по течению реки до пункта назначения ${txt(S)} км и после стоянки возвращается в пункт отправления. Найдите скорость течения, если скорость теплохода в неподвижной воде равна ${txt(v)} км/ч, стоянка длится ${sk(st, SLOVA.chas)}, а в пункт отправления теплоход возвращается через ${sk(T, SLOVA.chas)}. Ответ дайте в км/ч.`,
      answer: r.c,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $c$ км/ч. По течению $${d(v)}+c$, против — $${d(v)}-c$.`],
        ],
        ['Время в движении', [`$${d(T)}-${d(st)}=${d(move)}$ ч.`]],
        ['Уравнение', [`$${tudaObratno(d(S), d(v), 'c')}=${d(move)}$.`]],
        ['Решение', r.lines],
        ['Отбор корня и ответ', [`Скорость течения положительна: $c=${d(r.c)}$.`, otvet(r.c)]],
      ),
      table: tablitsaReki(d(S), d(v), 'c'),
      hints: [
        HINT_SKOROSTI,
        vopros('Сколько часов теплоход был в движении?', `$${d(move)}$`, [
          `$${d(T)}$`,
          `$${d(T + st)}$`,
        ]),
        vopros(
          'Какое уравнение получится после общего знаменателя?',
          `неполное квадратное: $c^2=\\ldots$`,
          ['линейное', 'кубическое'],
        ),
        chtoSprashivayut('скорость течения', ['скорость теплохода', 'время в пути']),
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
    if (ask === 'c') {
      const v = num(p, 'v');
      const sol = kvadrat(Dl, 2 * S, -Dl * v * v, 'c');
      const c = val(sol.roots[1]);
      return {
        uslovie: `Моторная лодка прошла против течения реки ${txt(S)} км и вернулась в пункт отправления, затратив на обратный путь на ${sk(Dl, SLOVA.chas)} меньше. Найдите скорость течения, если скорость лодки в неподвижной воде равна ${txt(v)} км/ч. Ответ дайте в км/ч.`,
        answer: c,
        etapy: etapy(
          [
            'Обозначаем',
            [`Скорость течения — $c$ км/ч. Против течения $${d(v)}-c$, по течению $${d(v)}+c$.`],
          ],
          ['Таблица', ['Против течения лодка шла дольше.']],
          ['Уравнение', [`$\\dfrac{${d(S)}}{${d(v)}-c}-\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$.`]],
          [
            'Решение',
            [
              `$${d(S)}(${d(v)}+c)-${d(S)}(${d(v)}-c)=${d(Dl)}(${d(v * v)}-c^2)$, $${d(2 * S)}c=${d(Dl)}(${d(v * v)}-c^2)$.`,
              `$${sol.ishodnoe}$.`,
              ...sol.lines,
            ],
          ],
          ['Отбор корня и ответ', [`Скорость течения положительна: $c=${d(c)}$.`, otvet(c)]],
        ),
        table: tablitsaReki(d(S), d(v), 'c', ['Обратно (по течению)', 'Туда (против течения)']),
        hints: [
          vopros('Какой путь занял больше времени?', 'против течения', ['по течению', 'одинаково']),
          vopros(
            'Какое уравнение?',
            `$\\dfrac{${d(S)}}{${d(v)}-c}-\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$`,
            [
              `$\\dfrac{${d(S)}}{${d(v)}+c}-\\dfrac{${d(S)}}{${d(v)}-c}=${d(Dl)}$`,
              `$\\dfrac{${d(S)}}{${d(v)}-c}+\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$`,
            ],
          ),
          chtoSprashivayut('скорость течения', ['скорость лодки', 'время в пути']),
        ],
        lifehacks: ['divide-equation'],
      };
    }
    const c = num(p, 'c');
    const sol = kvadrat(Dl, 0, -(2 * S * c + Dl * c * c), 'x');
    const x = val(sol.roots[1]);
    return {
      uslovie: `Моторная лодка прошла против течения реки ${txt(S)} км и вернулась в пункт отправления, затратив на обратный путь на ${sk(Dl, SLOVA.chas)} меньше. Найдите скорость лодки в неподвижной воде, если скорость течения равна ${txt(c)} км/ч. Ответ дайте в км/ч.`,
      answer: x,
      etapy: etapy(
        [
          'Обозначаем',
          [
            `Скорость лодки в неподвижной воде — $x$ км/ч. Против течения $x-${d(c)}$, по течению $x+${d(c)}$.`,
          ],
        ],
        ['Таблица', ['Против течения лодка шла дольше.']],
        ['Уравнение', [`$\\dfrac{${d(S)}}{x-${d(c)}}-\\dfrac{${d(S)}}{x+${d(c)}}=${d(Dl)}$.`]],
        [
          'Решение',
          [
            `$${d(S)}(x+${d(c)})-${d(S)}(x-${d(c)})=${d(Dl)}(x^2-${d(c * c)})$, $${d(2 * S * c)}=${d(Dl)}x^2-${d(Dl * c * c)}$.`,
            `$${sol.ishodnoe}$.`,
            ...sol.lines,
          ],
        ],
        ['Отбор корня и ответ', [`Скорость положительна: $x=${d(x)}$.`, otvet(x)]],
      ),
      table: tablitsaReki(d(S), 'x', d(c), ['Обратно (по течению)', 'Туда (против течения)']),
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
        chtoSprashivayut('скорость лодки в неподвижной воде', [
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
  solve(p) {
    const form = str(p, 'form', ['kater', 'barzha', 'lodka', 'baidarka'] as const);
    const s = key(SUDNO, form);
    const t0 = num(p, 't0');
    const S = num(p, 'S');
    const st = num(p, 'st'); // минуты
    const t1 = num(p, 't1');
    const lead = form !== 'lodka';
    const move = sub(sub(q(t1 * 60), q(t0 * 60)), q(st));
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
    const uslovie = `${s.kto} в ${chasy(t0, lead)} ${s.vyshel}${s.potech ? ' по течению реки' : ''} из пункта А в пункт В, расположенный в ${txt(S)} км от А. Пробыв в пункте В ${vremya(st)}, ${s.probyv} назад и ${s.vernulsya} в пункт А в ${chasy(t1, lead)} того же дня. ${vopr}`;
    const timeLines = [
      `С ${chasy(t0, lead)} до ${chasy(t1, lead)} прошло $${d(t1 - t0)}$ ч, из них ${vremya(st)} — стоянка. В движении: $${d(t1 - t0)}-${fq(q(st, 60))}=${fq(T)}$ ч.`,
    ];
    if (s.ask === 'v') {
      const c = num(p, 'c');
      const r = sobstvennaya(S, c, T);
      return {
        uslovie,
        answer: r.x,
        etapy: etapy(
          [
            'Обозначаем',
            [
              `Собственная скорость ${kogo} — $x$ км/ч. По течению $x+${d(c)}$, против — $x-${d(c)}$.`,
            ],
          ],
          ['Время в движении', timeLines],
          ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$.`]],
          ['Решение', r.lines],
          ['Отбор корня и ответ', [`Скорость больше скорости течения: $x=${d(r.x)}$.`, otvet(r.x)]],
        ),
        table: tablitsaReki(d(S), 'x', d(c)),
        hints: [
          vopros('Сколько часов судно было в движении?', `$${fq(T)}$`, [
            `$${d(t1 - t0)}$`,
            `$${fq(sub(q(t1 - t0), naive), true)}$`,
          ]),
          HINT_SKOROSTI,
          vopros('Какое уравнение?', `$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$`, [
            `$${tudaObratno(d(S), 'x', d(c))}=${d(t1 - t0)}$`,
            `$\\dfrac{${d(2 * S)}}{x}=${fq(T)}$`,
          ]),
          chtoSprashivayut('собственную скорость', ['скорость течения', 'время в пути']),
        ],
        lifehacks: ['divide-equation', 'fast-count'],
      };
    }
    const v = num(p, 'v');
    const r = techenie(S, v, T);
    return {
      uslovie,
      answer: r.c,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $c$ км/ч. По течению $${d(v)}+c$, против — $${d(v)}-c$.`],
        ],
        ['Время в движении', timeLines],
        ['Уравнение', [`$${tudaObratno(d(S), d(v), 'c')}=${fq(T)}$.`]],
        ['Решение', r.lines],
        ['Отбор корня и ответ', [`Скорость течения положительна: $c=${d(r.c)}$.`, otvet(r.c)]],
      ),
      table: tablitsaReki(d(S), d(v), 'c'),
      hints: [
        vopros('Сколько часов судно было в движении?', `$${fq(T)}$`, [
          `$${d(t1 - t0)}$`,
          `$${fq(sub(q(t1 - t0), naive), true)}$`,
        ]),
        HINT_SKOROSTI,
        vopros('Какое уравнение?', `$${tudaObratno(d(S), d(v), 'c')}=${fq(T)}$`, [
          `$${tudaObratno(d(S), d(v), 'c')}=${d(t1 - t0)}$`,
          `$\\dfrac{${d(2 * S)}}{${d(v)}}=${fq(T)}$`,
        ]),
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
    return {
      uslovie: `Расстояние между пристанями А и В равно ${txt(S)} км. Из А в В по течению реки отправился плот, а через ${sk(h, SLOVA.chas)} вслед за ним отправилась яхта, которая, прибыв в пункт В, тотчас повернула обратно и возвратилась в А. К этому времени плот проплыл ${txt(rr)} км. Найдите скорость яхты в неподвижной воде, если скорость течения реки равна ${txt(c)} км/ч. Ответ дайте в км/ч.`,
      answer: r.x,
      etapy: etapy(
        ['Обозначаем', [`Скорость яхты в неподвижной воде — $x$ км/ч.`]],
        [
          'Время яхты',
          [
            `Плот плывёт со скоростью течения: $${d(rr)}$ км он проплыл за $${frac2(rr, c)}=${fq(raft)}$ ч.`,
            `Яхта вышла на $${d(h)}$ ч позже: она в пути $${fq(raft)}-${d(h)}=${fq(T)}$ ч.`,
          ],
        ],
        ['Уравнение', [`$${tudaObratno(d(S), 'x', d(c))}=${fq(T)}$.`]],
        ['Решение', r.lines],
        ['Отбор корня и ответ', [`Скорость яхты положительна: $x=${d(r.x)}$.`, otvet(r.x)]],
      ),
      table: tablitsa(HEAD, [
        ['Плот', `$${d(c)}$`, `$${fq(raft)}$`, `$${d(rr)}$`],
        ['Яхта туда', `$x+${d(c)}$`, `$\\dfrac{${d(S)}}{x+${d(c)}}$`, `$${d(S)}$`],
        ['Яхта обратно', `$x-${d(c)}$`, `$\\dfrac{${d(S)}}{x-${d(c)}}$`, `$${d(S)}$`],
      ]),
      hints: [
        vopros('С какой скоростью плывёт плот?', 'со скоростью течения', [
          '$0$ — у плота нет скорости',
          'со скоростью яхты',
        ]),
        vopros('Сколько часов плыл плот?', `$${fq(raft)}$`, [
          `$${fq(sub(raft, q(h)))}$`,
          `$${d(rr)}$`,
        ]),
        vopros('Сколько часов была в пути яхта?', `$${fq(T)}$`, [
          `$${fq(raft)}$`,
          `$${fq(mul(q(2), raft))}$`,
        ]),
        chtoSprashivayut('скорость яхты в неподвижной воде', ['скорость течения', 'время яхты']),
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
    const sol = kvadrat(Dl, 2 * S, -Dl * v * v, 'c');
    const c = val(sol.roots[1]);
    return {
      uslovie: `Пройдя ${txt(S)} км по течению реки, катер возвращается в исходную точку, причём обратный путь занимает на ${sk(Dl, SLOVA.chas)} больше времени. Найдите скорость течения, если скорость катера в неподвижной воде равна ${txt(v)} км/ч.`,
      answer: c,
      etapy: etapy(
        [
          'Обозначаем',
          [`Скорость течения — $c$ км/ч. По течению $${d(v)}+c$, против — $${d(v)}-c$.`],
        ],
        ['Таблица', ['Обратный путь — против течения, он дольше.']],
        ['Уравнение', [`$\\dfrac{${d(S)}}{${d(v)}-c}-\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$.`]],
        [
          'Решение',
          [`$${d(2 * S)}c=${d(Dl)}(${d(v * v)}-c^2)$.`, `$${sol.ishodnoe}$.`, ...sol.lines],
        ],
        ['Отбор корня и ответ', [`Скорость течения положительна: $c=${d(c)}$.`, otvet(c)]],
      ),
      table: tablitsaReki(d(S), d(v), 'c'),
      hints: [
        vopros('Какой путь дольше?', 'обратный — против течения', ['по течению', 'одинаково']),
        vopros(
          'Какое уравнение?',
          `$\\dfrac{${d(S)}}{${d(v)}-c}-\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$`,
          [
            `$\\dfrac{${d(S)}}{${d(v)}+c}-\\dfrac{${d(S)}}{${d(v)}-c}=${d(Dl)}$`,
            `$\\dfrac{${d(S)}}{${d(v)}-c}+\\dfrac{${d(S)}}{${d(v)}+c}=${d(Dl)}$`,
          ],
        ),
        vopros('Какой лайфхак поможет с корнем?', `подобрать целое $c$ и проверить подстановкой`, [
          'взять среднее арифметическое',
          'перейти к минутам',
        ]),
        chtoSprashivayut('скорость течения', ['скорость катера', 'время в пути']),
      ],
      lifehacks: ['root-guess'],
    };
  },
};

export const VD: Subtype[] = [VD01, VD02, VD03, VD04, VD05, VD06, VD07];
