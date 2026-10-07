/**
 * Раздел ОК — движение по окружности (ОК-01 … ОК-03).
 *
 * Кто обгоняет первый раз — проехал на 1 круг больше, n-й раз — на n
 * кругов. Работаем со скоростью сближения — разностью скоростей.
 * ОК-04 (стрелки часов) зарезервирован.
 */

import {
  chtoSprashivayut,
  drobnoe,
  dvizhenie,
  etapy,
  kvadrat,
  num,
  slovo,
  vopros,
  xxd,
} from '../kit';
import { d, div, fq, mul, q, txt, val, type Q } from '../num';
import { plural } from '../../plural';
import { sk, SLOVA } from '../sklonenie';
import type { Subtype } from '../types';
import { otvet } from './common';

/* ── ОК-01 Через t опережал на круг ──────────────────────────── */

const OK01: Subtype = {
  id: 'OK-01',
  section: 'OK',
  title: 'Одновременный старт: опередил на круг',
  level: 1,
  keywords: ['кольцевая дорога', 'опережал на один круг', 'автомобили'],
  solve(p) {
    const L = num(p, 'L');
    const v1 = num(p, 'v1');
    const t = num(p, 't'); // минуты
    const T = q(t, 60);
    const dv = div(q(L), T);
    const x = v1 - val(dv);
    /* Аналог: мотоциклисты, велосипедисты, лыжники. */
    const ktoRod = slovo(p, 'ktoRod', 'автомобиля');
    /* Бегуны и лыжники не «проезжают». */
    const proehat = slovo(p, 'proehat', 'проехать');
    const proehal = slovo(p, 'proehal', 'проехал');
    return {
      uslovie: `Из одной точки кольцевой дороги, длина которой равна ${txt(L)} км, одновременно в одном направлении выехали два автомобиля. Скорость первого автомобиля равна ${txt(v1)} км/ч, и через ${sk(t, SLOVA.minutu)} после старта он опережал второй автомобиль на один круг. Найдите скорость второго автомобиля. Ответ дайте в км/ч.`,
      answer: x,
      etapy: etapy(
        ['Обозначаем', [`Скорость второго ${ktoRod} — $x$ км/ч.`]],
        [
          'Скорость сближения',
          [
            `Опередить на круг — ${proehat} на $${d(L)}$ км больше. За $${fq(T)}$ ч это даёт разность скоростей $${d(L)}:${fq(T)}=${fq(dv)}$ км/ч.`,
          ],
        ],
        ['Уравнение', [`$${d(v1)}-x=${fq(dv)}$.`]],
        ['Решение', [`$x=${d(v1)}-${fq(dv)}=${d(x)}$.`]],
        ['Ответ на вопрос задачи', [`Спрашивают скорость второго ${ktoRod}.`, otvet(x)]],
      ),
      tables: [
        dvizhenie([
          ['Первый', `${d(v1)}\\cdot${fq(T)}`, `${d(v1)}`, `${fq(T)}`],
          ['Второй', `${fq(T)}x`, 'x', `${fq(T)}`],
        ]),
      ],
      hints: [
        vopros('Что значит «опережал на один круг»?', `${proehal} на $${d(L)}$ км больше`, [
          `${proehal} ровно один круг`,
          'ехал вдвое быстрее',
        ]),
        vopros(`Сколько часов в $${d(t)}$ минутах?`, `$${fq(T, true)}$`, [
          `$${d(t / 100)}$`,
          `$${d(t)}$`,
        ]),
        vopros('Чему равна разность скоростей?', `$${fq(dv)}$ км/ч`, [
          `$${d(L)}$ км/ч`,
          `$${fq(mul(q(L), T))}$ км/ч`,
          `$${fq(mul(dv, q(2)))}$ км/ч`,
        ]),
        chtoSprashivayut(`скорость второго ${ktoRod}`, ['скорость первого', 'разность скоростей']),
      ],
      lifehacks: ['closing-speed'],
    };
  },
};

/* ── ОК-02 Гонщики, n кругов ─────────────────────────────────── */

const OK02: Subtype = {
  id: 'OK-02',
  section: 'OK',
  title: 'Гонщики: обгон на круг и разница на финише',
  level: 3,
  keywords: ['гонщики', 'кругов', 'кольцевой трассе', 'обогнал на круг'],
  solve(p) {
    const N = num(p, 'N');
    const L = num(p, 'L');
    const dt = num(p, 'dt'); // минуты
    const t1 = num(p, 't1'); // минуты
    const k = div(q(L), q(t1, 60));
    const total = N * L;
    const Pq = div(mul(q(total), k), q(dt, 60)); // x(x + k) = P
    const P = val(Pq);
    const kk = val(k);
    /* Целые k и P — подбор множителей (x(x + k) = P). Дробные (разность
       скоростей 7,5 км/ч) — умножаем на общий знаменатель и решаем
       через дискриминант: подбором дробные множители не найти. */
    const celye = k.m === 1 && Pq.m === 1;
    const res = celye ? xxd(P, kk) : drobnyKvadrat(k, Pq);
    const x = res.root;
    /* Аналог: велогонщики, картингисты. */
    const ktoRod = slovo(p, 'ktoRod', 'гонщика');
    const t = drobnoe({
      nuli: [0, -kk],
      lo: 0,
      pochemu: 'скорость положительна',
      znamenatel: `x(x+${d(kk)})`,
      posle: [
        `$${d(total)}(x+${d(kk)})-${d(total)}x=${fq(q(dt, 60))}\\,x(x+${d(kk)})$, то есть $${d(total)}\\cdot${d(kk)}=${fq(q(dt, 60))}\\,x(x+${d(kk)})$, откуда`,
        ...res.lines,
      ],
      roots: res.roots,
    });
    return {
      uslovie: `Два гонщика участвуют в гонках. Им предстоит проехать ${txt(N)} ${slovoKrug(N)} по кольцевой трассе протяжённостью ${txt(L)} км. Оба гонщика стартовали одновременно, а на финиш первый пришёл раньше второго на ${sk(dt, SLOVA.minutu)}. Чему равнялась средняя скорость второго гонщика, если известно, что первый гонщик в первый раз обогнал второго на круг через ${sk(t1, SLOVA.minutu)}? Ответ дайте в км/ч.`,
      answer: x,
      etapy: etapy(
        ['Обозначаем', [`Скорость второго — $x$ км/ч.`]],
        [
          'Разность скоростей',
          [
            `Первый обгон на круг: за $${fq(q(t1, 60))}$ ч первый проехал на $${d(L)}$ км больше. Разность скоростей $${d(L)}:${fq(q(t1, 60))}=${d(kk)}$ км/ч, скорость первого $x+${d(kk)}$.`,
          ],
        ],
        [
          'Уравнение',
          [
            `Вся дистанция $${d(N)}\\cdot${d(L)}=${d(total)}$ км. $\\dfrac{${d(total)}}{x}-\\dfrac{${d(total)}}{x+${d(kk)}}=${fq(q(dt, 60))}$.`,
          ],
        ],
        t.odz,
        t.reshenie,
        ['Отбор корней и ответ', [...t.otbor, `Спрашивают скорость второго ${ktoRod}.`, otvet(x)]],
      ),
      tables: [
        dvizhenie([
          ['Первый', `${d(total)}`, `x+${d(kk)}`, `\\dfrac{${d(total)}}{x+${d(kk)}}`],
          ['Второй', `${d(total)}`, 'x', `\\dfrac{${d(total)}}{x}`],
        ]),
      ],
      hints: [
        vopros('Что даёт условие про первый обгон на круг?', 'разность скоростей', [
          'скорость первого',
          'длину трассы',
        ]),
        vopros('Чему равна разность скоростей?', `$${d(kk)}$ км/ч`, [
          `$${d(L)}$ км/ч`,
          `$${d(t1)}$ км/ч`,
        ]),
        vopros('Какая длина всей дистанции?', `$${d(total)}$ км`, [`$${d(N)}$ км`, `$${d(L)}$ км`]),
        t.hintOdz,
        t.hintKoren,
        chtoSprashivayut(`среднюю скорость второго ${ktoRod}`, [
          `скорость первого ${ktoRod}`,
          'время гонки',
        ]),
      ],
      lifehacks: celye ? ['closing-speed', 'x-x-plus-d', 'root-guess'] : ['closing-speed'],
    };
  },
};

/** x(x + k) = P с дробными k или P: x² + kx − P = 0, умноженное на общий знаменатель. */
function drobnyKvadrat(k: Q, P: Q): { lines: string[]; roots: number[]; root: number } {
  const L = (k.m * P.m) / nod(k.m, P.m);
  const sol = kvadrat(L, (k.n * L) / k.m, -(P.n * L) / P.m);
  const roots = sol.roots.map(val);
  const root = Math.max(...roots);
  return {
    lines: [
      `$x(x+${fq(k, true)})=${fq(P, true)}$, то есть $x^2+${fq(k, true)}x-${fq(P, true)}=0$. Коэффициенты дробные — умножаем обе части на $${d(L)}$: $${sol.ishodnoe}$.`,
      ...sol.lines,
    ],
    roots,
    root,
  };
}

function nod(a: number, b: number): number {
  return b === 0 ? a : nod(b, a % b);
}

function slovoKrug(n: number): string {
  return plural(n, ...SLOVA.krug);
}

/* ── ОК-03 Стартовал позже, догнал дважды ────────────────────── */

const OK03: Subtype = {
  id: 'OK-03',
  section: 'OK',
  title: 'Стартовал позже, догнал первый и второй раз',
  level: 3,
  keywords: ['круговой трассы', 'мотоциклист', 'велосипедист', 'догнал во второй раз'],
  solve(p) {
    const t0 = num(p, 't0');
    const t1 = num(p, 't1');
    const t2 = num(p, 't2');
    const L = num(p, 'L');
    const dv = q(60 * L, t2); // x − y
    const y = div(mul(q(60 * L), q(t1)), q(t0 * t2));
    const x = val(y) + val(dv);
    /* Аналог: кто стартовал первым и кто догонял (автомобиль и автобус,
       велосипедист и пешеход). */
    const dog = slovo(p, 'dog', 'мотоциклист');
    const dogRod = slovo(p, 'dogRod', 'мотоциклиста');
    const medl = slovo(p, 'medl', 'велосипедист');
    const medlRod = slovo(p, 'medlRod', 'велосипедиста');
    const ehal = slovo(p, 'ehal', 'ехал');
    const ehalDog = slovo(p, 'ehalDog', 'ехал');
    const proehal = slovo(p, 'proehal', 'проехал');
    return {
      uslovie: `Из пункта А круговой трассы выехал велосипедист, а через ${sk(t0, SLOVA.minutu)} следом за ним отправился мотоциклист. Через ${sk(t1, SLOVA.minutu)} после отправления он догнал велосипедиста в первый раз, а ещё через ${sk(t2, SLOVA.minutu)} после этого догнал его во второй раз. Найдите скорость мотоциклиста, если длина трассы равна ${txt(L)} км. Ответ дайте в км/ч.`,
      answer: x,
      etapy: etapy(
        ['Обозначаем', [`Скорость ${dogRod} — $x$ км/ч, ${medlRod} — $y$ км/ч.`]],
        [
          'Первая встреча',
          [
            `К первой встрече ${dog} ${ehalDog} $${fq(q(t1, 60))}$ ч, ${medl} — $${fq(q(t0 + t1, 60))}$ ч, пути равны: $${fq(q(t1, 60))}x=${fq(q(t0 + t1, 60))}y$, то есть $${d(t1)}x=${d(t0 + t1)}y$.`,
          ],
        ],
        [
          'Вторая встреча',
          [
            `Между встречами ${dog} ${proehal} на круг больше: $${fq(q(t2, 60))}(x-y)=${d(L)}$, $x-y=${fq(dv)}$.`,
          ],
        ],
        [
          'Решение системы',
          [
            `Из первого уравнения $x=${fq(q(t0 + t1, t1))}y$. Тогда $${fq(q(t0, t1))}y=${fq(dv)}$, $y=${fq(y)}$, $x=${fq(y)}+${fq(dv)}=${d(x)}$.`,
          ],
        ],
        ['Ответ на вопрос задачи', [`Спрашивают скорость ${dogRod}.`, otvet(x)]],
      ),
      hints: [
        vopros('Что одинаково у них к первой встрече?', 'пройденный путь', [
          'время в пути',
          'скорость',
        ]),
        vopros(`Сколько минут ${ehal} ${medl} до первой встречи?`, `$${d(t0 + t1)}$`, [
          `$${d(t1)}$`,
          `$${d(t0)}$`,
        ]),
        vopros('Что значит «догнал во второй раз»?', 'между встречами проехал на круг больше', [
          'проехал ровно один круг',
          'догнал на старте',
        ]),
        chtoSprashivayut(`скорость ${dogRod}`, [`скорость ${medlRod}`, 'разность скоростей']),
      ],
      lifehacks: ['closing-speed'],
    };
  },
};

export const OK: Subtype[] = [OK01, OK02, OK03];
