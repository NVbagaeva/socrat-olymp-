/**
 * Вариант 28: шесть версий (28.1 — основная, 28.2…28.6 — параллельные).
 * Только параметры шаблонов: условия, ответы и решения собирают
 * движки разделов в браузере (shablony.ts). Числа заморожены — версия
 * «28.3» всегда одна и та же; проверка — pnpm test:povyshennye.
 */

import type { VariantPV } from '../types';

export const VARIANT: VariantPV = {
  k: 28,
  versii: [
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 12, b: 18, h: 10 } },
      { s: 'z02.skalyar-treh', p: { ax: -5, ay: 0, bx: 6, by: 4, cx: -8, cy: 3, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 15, vid: 1 } },
      { s: 'z04.kruglyy-stol', p: { n: 11, osobye: 'mal', drugie: 'dev', vid: 'ne-ryadom', j: 0 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'raznoe', b: 'raznost-odin' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [0, 2, 6], ps: [30, 50, 20], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 16, k: 4, b: 9, c: 1.6, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 2, s1: 3, s2: 4, x: 0.4, y: 0.2 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-8, -3],
            [-6, -1],
            [-4, -4],
            [-2, 0],
            [1, 3],
            [3, 2],
            [5, 0],
            [6, -2],
          ],
          p: -7,
          q: 2,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1,
          dt: 0.4,
          tekst:
            'Студент измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1$ с. После дождя вода поднялась, и время падения изменилось на $0{,}4$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'izyum',
          w1: 80,
          w2: 4,
          M: 40,
          vid: 'syrye',
          tekst:
            'Изюм получают в процессе сушки винограда. Сколько килограммов винограда потребуется, чтобы получить 40 кг изюма, если виноград содержит 80 % воды, а изюм — 4 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -2], B: [3, -1], y0: 2 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 2000, r: 20, Z: 4248, imya: 'Таисия', goal: 'на путешествие', year: 2029 },
      },
    ],
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 15, b: 24, h: 10 } },
      { s: 'z02.skalyar-treh', p: { ax: 0, ay: 5, bx: 4, by: -6, cx: 5, cy: 7, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 32, vid: 1 } },
      { s: 'z04.kruglyy-stol', p: { n: 6, osobye: 'dev', drugie: 'mal', vid: 'ne-ryadom', j: 0 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'ni-razu-shest', b: 'raznost-odin' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [1, 4, 7], ps: [25, 50, 25], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 72, k: 2, b: 7, c: 2.4, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 3, s1: 3, s2: 2, x: 0.2, y: 0.2 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-3, -3],
            [-2, 0],
            [0, 2],
            [2, 1],
            [4, 3],
            [6, 0],
            [7, -1],
          ],
          p: -1,
          q: 7,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 0.8,
          dt: 0.3,
          tekst:
            'Лесник измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $0{,}8$ с. После дождя вода поднялась, и время падения изменилось на $0{,}3$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'kuraga',
          w1: 85,
          w2: 10,
          M: 45,
          vid: 'syrye',
          tekst:
            'Курага получают в процессе сушки абрикосов. Сколько килограммов абрикосов потребуется, чтобы получить 45 кг кураги, если абрикосы содержат 85 % воды, а курага — 10 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 1], B: [2, 2], y0: 6 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 1000, r: 10, Z: 2948, imya: 'Богдан', goal: 'на покупку трактора', year: 2029 },
      },
    ],
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 14, b: 21, h: 12 } },
      { s: 'z02.skalyar-treh', p: { ax: 4, ay: 0, bx: -7, by: -3, cx: 3, cy: -6, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 40, vid: 1 } },
      {
        s: 'z04.kruglyy-stol',
        p: { n: 21, osobye: 'gost', drugie: 'sest', vid: 'ne-ryadom', j: 0 },
      },
      { s: 'z05.kosti-otnoshenie', p: { a: 'summa-nechet', b: 'raznost-odin' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [-2, 0, 2], ps: [25, 50, 25], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 25, k: 5, b: 6, c: 1.25, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 5, s1: 1, s2: 2, x: 0.6, y: 0.7 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-6, 1],
            [-4, 0],
            [-2, -3],
            [1, -1],
            [3, -2],
            [5, 0],
            [6, 2],
          ],
          p: -5,
          q: 4,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.3,
          dt: 0.5,
          tekst:
            'Девочка измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}3$ с. После дождя вода поднялась, и время падения изменилось на $0{,}5$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'griby',
          w1: 90,
          w2: 12,
          M: 15,
          vid: 'syrye',
          tekst:
            'Сушёные грибы получают в процессе сушки грибов. Сколько килограммов свежих грибов потребуется, чтобы получить 15 кг сушёных грибов, если свежие грибы содержат 90 % воды, а сушёные грибы — 12 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -1], B: [4, 0], y0: 2 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 3000, r: 20, Z: 7296, imya: 'Варвара', goal: 'на ремонт дома', year: 2029 },
      },
    ],
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 16, b: 28, h: 12 } },
      { s: 'z02.skalyar-treh', p: { ax: -3, ay: 4, bx: 5, by: 2, cx: -2, cy: -4, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 9.5, vid: 1 } },
      { s: 'z04.kruglyy-stol', p: { n: 7, osobye: 'sest', drugie: 'dev', vid: 'ne-ryadom', j: 0 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'summa-chet', b: 'oba-nechet' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [3, 5, 6], ps: [20, 30, 50], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 10, k: 3, b: 1, c: 0.5, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 2, s1: 5, s2: 2, x: 0.3, y: 1.25 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-2, 3],
            [0, 0],
            [2, -2],
            [4, -1],
            [6, -3],
            [8, 0],
            [9, 1],
          ],
          p: 1,
          q: 9,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.7,
          dt: 0.3,
          tekst:
            'Фермер измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}7$ с. После дождя вода поднялась, и время падения изменилось на $0{,}3$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'chernosliv',
          w1: 75,
          w2: 20,
          M: 30,
          vid: 'syrye',
          tekst:
            'Чернослив получают в процессе сушки слив. Сколько килограммов слив потребуется, чтобы получить 30 кг чернослива, если сливы содержат 75 % воды, а чернослив — 20 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 3], B: [3, 2], y0: 0 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 2000, r: 10, Z: 3586, imya: 'Платон', goal: 'на оборудование', year: 2029 },
      },
    ],
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 10, b: 25, h: 8 } },
      { s: 'z02.skalyar-treh', p: { ax: 6, ay: 3, bx: -2, by: -7, cx: 4, cy: -5, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 28, vid: 1 } },
      { s: 'z04.kruglyy-stol', p: { n: 13, osobye: 'dev', drugie: 'mal', vid: 'ne-ryadom', j: 0 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'proizv-chet', b: 'oba-chet' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [0, 3, 4], ps: [10, 40, 50], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 49, k: 2, b: 9, c: 1.4, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 10, s1: 2, s2: 3, x: 0.35, y: 0.1 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-8, -2],
            [-5, 0],
            [-3, 2],
            [-1, 1],
            [1, 3],
            [3, 0],
            [4, -2],
          ],
          p: -4,
          q: 4,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 0.9,
          dt: 0.2,
          tekst:
            'Пастух измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $0{,}9$ с. После дождя вода поднялась, и время падения изменилось на $0{,}2$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'izyum',
          w1: 82,
          w2: 10,
          M: 36,
          vid: 'produkt',
          tekst:
            'Изюм получают в процессе сушки винограда. Сколько килограммов изюма получится из 36 кг винограда, если виноград содержит 82 % воды, а изюм — 10 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 0], B: [5, 1], y0: 3 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 500, r: 20, Z: 1392, imya: 'Ульяна', goal: 'на покупку автомобиля', year: 2029 },
      },
    ],
    [
      { s: 'z01.vysoty-treugolnika', p: { a: 18, b: 27, h: 16 } },
      { s: 'z02.skalyar-treh', p: { ax: 2, ay: -5, bx: 3, by: 6, cx: -7, cy: 2, vid: '(a+b)c' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 50, vid: 1 } },
      { s: 'z04.kruglyy-stol', p: { n: 26, osobye: 'mal', drugie: 'dev', vid: 'ne-ryadom', j: 0 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'odno-bolshe', b: 'summa-sem' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [1, 2, 5], ps: [20, 60, 20], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 12, k: 5, b: 13, c: 0.8, v: 'bolshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 6, s1: 2, s2: 1, x: 0.3, y: 0.4 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-5, 2],
            [-3, 0],
            [-1, -2],
            [1, -1],
            [2, -3],
            [4, 0],
            [5, 2],
          ],
          p: -2,
          q: 5,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.8,
          dt: 0.6,
          tekst:
            'Сторож измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}8$ с. После дождя вода поднялась, и время падения изменилось на $0{,}6$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.sushka',
        p: {
          chto: 'kuraga',
          w1: 88,
          w2: 4,
          M: 48,
          vid: 'syrye',
          tekst:
            'Курага получают в процессе сушки абрикосов. Сколько килограммов абрикосов потребуется, чтобы получить 48 кг кураги, если абрикосы содержат 88 % воды, а курага — 4 % воды?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -2], B: [2, -3], y0: -9 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 4000, r: 20, Z: 9552, imya: 'Савва', goal: 'на расширение бизнеса', year: 2029 },
      },
    ],
  ],
  /** Часть 2: задания 14–20 по версиям — свои задачи по кодификатору; проверка — pnpm test:povyshennye-chast2. */
  chast2: [
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: -3, ubrat: 'plus', lo: [2, 1], hi: [4, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 12, h: 5, m: 4, n: 1, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 4, d: 3, q: 2, znak: 'le' } },
      { s: 'p17.korobka', p: { a: 24, b: 15, material: 2, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 14, b: 15, c: 13, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 6, u: 4, w: 3, m: 3 } },
      { s: 'p20.giri', p: { n1: 13, k1: 7, n2: 9, k2: 9, n3: 15 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: 2, ubrat: 'plus', lo: [-3, 1], hi: [-1, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 108, h: 20, m: 3, n: 2, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 6, d: 2, q: 3, znak: 'lt' } },
      { s: 'p17.korobka', p: { a: 40, b: 25, material: 3, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 5, b: 8, c: 5, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 3, u: 0, w: 5, m: 1 } },
      { s: 'p20.giri', p: { n1: 6, k1: 3, n2: 12, k2: 4, n3: 16 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: 2, ubrat: 'minus', lo: [-1, 1], hi: [2, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 48, h: 6, m: 3, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 1, d: 2, q: 1, znak: 'ge' } },
      { s: 'p17.korobka', p: { a: 42, b: 32, material: 0, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 15, b: 18, c: 15, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 10, u: 12, w: 5, m: 8 } },
      { s: 'p20.giri', p: { n1: 15, k1: 4, n2: 14, k2: 7, n3: 7 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: -3, ubrat: 'minus', lo: [1, 1], hi: [3, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 12, h: 4, m: 1, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 9, d: 2, q: 3, znak: 'le' } },
      { s: 'p17.korobka', p: { a: 48, b: 18, material: 1, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 25, b: 14, c: 25, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 7, u: -5, w: -12, m: 6 } },
      { s: 'p20.giri', p: { n1: 14, k1: 5, n2: 13, k2: 13, n3: 17 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: 3, ubrat: 'minus', lo: [-2, 1], hi: [0, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 300, h: 30, m: 2, n: 1, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 0, d: 2, q: 1, znak: 'gt' } },
      { s: 'p17.korobka', p: { a: 56, b: 35, material: 2, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 13, b: 24, c: 13, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 9, u: 6, w: -8, m: 4 } },
      { s: 'p20.giri', p: { n1: 16, k1: 8, n2: 15, k2: 9, n3: 8 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: 3, ubrat: 'plus', lo: [3, 2], hi: [7, 2] } },
      { s: 'p15.prizmaABM', p: { a2: 108, h: 16, m: 3, n: 1, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 10, d: 4, q: 3, znak: 'ge' } },
      { s: 'p17.korobka', p: { a: 24, b: 9, material: 3, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 9, b: 10, c: 17, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 5, u: 15, w: 8, m: 15 } },
      { s: 'p20.giri', p: { n1: 10, k1: 11, n2: 11, k2: 6, n3: 6 } },
    ],
  ],
};
