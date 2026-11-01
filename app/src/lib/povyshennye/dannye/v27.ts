/**
 * Вариант 27: шесть версий (27.1 — основная, 27.2…27.6 — параллельные).
 * Только параметры шаблонов: условия, ответы и решения собирают
 * движки разделов в браузере (shablony.ts). Числа заморожены — версия
 * «27.3» всегда одна и та же; проверка — pnpm test:povyshennye.
 */

import type { VariantPV } from '../types';

export const VARIANT: VariantPV = {
  k: 27,
  versii: [
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 8, b: 12, s: 72, k: 0 } },
      { s: 'z02.skalyar-treh', p: { ax: -5, ay: 4, bx: 0, by: -6, cx: 6, cy: 4, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 30, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 9, osobye: 'dev', drugie: 'mal', vid: 'mezhdu', j: 1 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'summa-chet', b: 'odinakovoe' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [1, 3, 5], ps: [30, 40, 30], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 45, k: 2, b: -3, c: 1.5, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 2, s1: 2, s2: 3, x: 0.6, y: 0.6 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-9, 3],
            [-6, 0],
            [-4, -3],
            [-1, -1],
            [1, -4],
            [3, 0],
            [4, 2],
          ],
          p: -8,
          q: 1,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.4,
          dt: 0.2,
          tekst:
            'Школьник измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}4$ с. После дождя вода поднялась, и время падения изменилось на $0{,}2$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 10,
          p2: 35,
          p3: 30,
          M: 150,
          ask: 'raznica',
          met: 'меди',
          tekst:
            'Имеются два сплава: первый содержит 10 % меди, второй — 35 % меди. Из них получили третий сплав массой 150 кг, содержащий 30 % меди. На сколько килограммов масса первого сплава меньше массы второго?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -2], B: [4, 0], x0: 32 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 3000, r: 10, Z: 5148, imya: 'Кира', goal: 'на ремонт квартиры', year: 2029 },
      },
    ],
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 15, b: 25, s: 300, k: 0 } },
      { s: 'z02.skalyar-treh', p: { ax: 4, ay: 3, bx: -6, by: 0, cx: 2, cy: 5, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 45, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 6, osobye: 'mal', drugie: 'dev', vid: 'mezhdu', j: 1 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'odno-bolshe', b: 'odinakovoe' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [2, 4, 7], ps: [50, 30, 20], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 50, k: 4, b: 2, c: 2.5, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 3, s1: 2, s2: 3, x: 0.35, y: 0.1 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-7, -2],
            [-5, 0],
            [-3, 3],
            [0, 1],
            [2, 4],
            [4, 0],
            [5, -2],
          ],
          p: -6,
          q: 2,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.5,
          dt: 0.3,
          tekst:
            'Турист измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}5$ с. После дождя вода поднялась, и время падения изменилось на $0{,}3$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 8,
          p2: 20,
          p3: 17,
          M: 80,
          ask: 'raznica',
          met: 'олова',
          tekst:
            'Имеются два сплава: первый содержит 8 % олова, второй — 20 % олова. Из них получили третий сплав массой 80 кг, содержащий 17 % олова. На сколько килограммов масса первого сплава меньше массы второго?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 1], B: [3, 0], x0: 81 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 1500, r: 20, Z: 3648, imya: 'Демид', goal: 'на покупку мастерской', year: 2029 },
      },
    ],
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 10, b: 16, s: 120, k: 0 } },
      { s: 'z02.skalyar-treh', p: { ax: -3, ay: -6, bx: 5, by: 2, cx: -1, cy: 4, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 18, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 13, osobye: 'sest', drugie: 'gost', vid: 'mezhdu', j: 3 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'proizv-chet', b: 'odinakovoe' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [0, 1, 3], ps: [20, 50, 30], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 36, k: 5, b: -1, c: 1.2, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 5, s1: 2, s2: 3, x: 0.35, y: 0.1 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-4, 2],
            [-2, 0],
            [0, -3],
            [3, -1],
            [5, -4],
            [7, 0],
            [8, 2],
          ],
          p: -3,
          q: 6,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.2,
          dt: 0.2,
          tekst:
            'Геолог измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}2$ с. После дождя вода поднялась, и время падения изменилось на $0{,}2$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 15,
          p2: 40,
          p3: 25,
          M: 200,
          ask: 'pervyy',
          met: 'никеля',
          tekst:
            'Имеются два сплава: первый содержит 15 % никеля, второй — 40 % никеля. Из них получили третий сплав массой 200 кг, содержащий 25 % никеля. Сколько килограммов первого сплава пошло на третий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -1], B: [9, 1], x0: 243 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 2000, r: 10, Z: 4510, imya: 'Арина', goal: 'на обучение', year: 2029 },
      },
    ],
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 20, b: 32, s: 480, k: 1 } },
      { s: 'z02.skalyar-treh', p: { ax: 6, ay: -2, bx: -4, by: -3, cx: -2, cy: 6, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 21, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 21, osobye: 'dev', drugie: 'mal', vid: 'mezhdu', j: 2 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'summa-nechet', b: 'oba-chet' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [1, 2, 6], ps: [40, 40, 20], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 18, k: 2, b: 4, c: 0.6, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 2, s1: 4, s2: 6, x: 0.65, y: 0.4 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-6, -2],
            [-4, 0],
            [-2, 2],
            [0, 1],
            [3, 4],
            [5, 0],
            [7, -3],
          ],
          p: -5,
          q: 3,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.6,
          dt: 0.4,
          tekst:
            'Дачник измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}6$ с. После дождя вода поднялась, и время падения изменилось на $0{,}4$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 12,
          p2: 27,
          p3: 21,
          M: 90,
          ask: 'raznica',
          met: 'цинка',
          tekst:
            'Имеются два сплава: первый содержит 12 % цинка, второй — 27 % цинка. Из них получили третий сплав массой 90 кг, содержащий 21 % цинка. На сколько килограммов масса первого сплава меньше массы второго?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 2], B: [2, 1], x0: 128 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 1000, r: 20, Z: 4104, imya: 'Тихон', goal: 'на покупку катера', year: 2029 },
      },
    ],
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 6, b: 10, s: 45, k: 0 } },
      { s: 'z02.skalyar-treh', p: { ax: 2, ay: 5, bx: 3, by: -4, cx: 4, cy: -1, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 27, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 17, osobye: 'mal', drugie: 'dev', vid: 'mezhdu', j: 4 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'summa-chet', b: 'raznost-odin' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [-1, 1, 3], ps: [25, 50, 25], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 98, k: 4, b: -5, c: 3.5, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 3, s1: 1, s2: 4, x: 0.6, y: 0.35 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-7, 2],
            [-5, 4],
            [-3, 0],
            [-1, -3],
            [1, -2],
            [3, -4],
            [4, 0],
            [5, 1],
          ],
          p: -4,
          q: 3,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 1.1,
          dt: 0.1,
          tekst:
            'Краевед измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $1{,}1$ с. После дождя вода поднялась, и время падения изменилось на $0{,}1$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 6,
          p2: 26,
          p3: 16,
          M: 60,
          ask: 'vtoroy',
          met: 'серебра',
          tekst:
            'Имеются два сплава: первый содержит 6 % серебра, второй — 26 % серебра. Из них получили третий сплав массой 60 кг, содержащий 16 % серебра. Сколько килограммов второго сплава пошло на третий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, 0], B: [4, -1], x0: 16 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 4000, r: 10, Z: 6017, imya: 'Злата', goal: 'на открытие студии', year: 2029 },
      },
    ],
    [
      { s: 'z01.parallelogramm-vysota', p: { a: 9, b: 14, s: 63, k: 1 } },
      { s: 'z02.skalyar-treh', p: { ax: -4, ay: 3, bx: -3, by: -5, cx: 6, cy: 2, vid: 'a(b+c)' } },
      { s: 'z03.shar-cilindr-poverhnost', p: { S: 36, vid: 0 } },
      { s: 'z04.kruglyy-stol', p: { n: 8, osobye: 'sest', drugie: 'mal', vid: 'mezhdu', j: 3 } },
      { s: 'z05.kosti-otnoshenie', p: { a: 'proizv-chet', b: 'raznost-odin' } },
      {
        s: 'z06.dispersiya',
        p: { v: 'X', xs: [2, 3, 4], ps: [10, 80, 10], den: 100, forma: 'zapis' },
      },
      { s: 'z07.koren-drob', p: { A: 20, k: 8, b: 1, c: 0.4, v: 'menshiy' } },
      { s: 'z08.stepeni-proizvedenie', p: { b: 7, s1: 2, s2: 1, x: 0.3, y: 0.4 } },
      {
        s: 'z09.gorizontalnaya',
        p: {
          uzly: [
            [-9, -1],
            [-7, 0],
            [-5, 3],
            [-2, 1],
            [0, 4],
            [2, 0],
            [3, -2],
          ],
          p: -6,
          q: 3,
        },
      },
      {
        s: 'z10.kolodec',
        p: {
          t1: 2,
          dt: 0.5,
          tekst:
            'Мальчик измеряет время $t$ падения камешка в колодец и вычисляет расстояние до воды по формуле $h=5t^2$, где $h$ — расстояние в метрах, $t$ — время в секундах. До дождя камешек падал $2$ с. После дождя вода поднялась, и время падения изменилось на $0{,}5$ с. На сколько метров поднялся уровень воды?',
        },
      },
      {
        s: 'z11.splavy',
        p: {
          p1: 20,
          p2: 45,
          p3: 40,
          M: 250,
          ask: 'raznica',
          met: 'меди',
          tekst:
            'Имеются два сплава: первый содержит 20 % меди, второй — 45 % меди. Из них получили третий сплав массой 250 кг, содержащий 40 % меди. На сколько килограммов масса первого сплава меньше массы второго?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'logPlus', A: [1, -3], B: [5, -2], x0: 625 } },
      {
        s: 'z13.ravnye-popolneniya',
        p: { S: 2500, r: 20, Z: 8280, imya: 'Мирон', goal: 'на покупку дачи', year: 2029 },
      },
    ],
  ],
  /** Часть 2: задания 14–20 по версиям — свои задачи по кодификатору; проверка — pnpm test:povyshennye-chast2. */
  chast2: [
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: 2, ubrat: 'plus', lo: [-2, 1], hi: [1, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 12, h: 6, m: 2, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 5, d: 2, q: 3, znak: 'ge' } },
      { s: 'p17.korobka', p: { a: 8, b: 5, material: 0, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 13, b: 14, c: 15, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 6, u: 3, w: -4, m: 2 } },
      { s: 'p20.giri', p: { n1: 8, k1: 3, n2: 7, k2: 6, n3: 11 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: 2, ubrat: 'minus', lo: [0, 1], hi: [3, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 48, h: 10, m: 4, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 3, d: 1, q: 2, znak: 'le' } },
      { s: 'p17.korobka', p: { a: 16, b: 10, material: 1, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 15, b: 14, c: 13, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 4, u: 5, w: 12, m: 5 } },
      { s: 'p20.giri', p: { n1: 9, k1: 5, n2: 10, k2: 6, n3: 12 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: -2, ubrat: 'minus', lo: [-3, 1], hi: [0, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 108, h: 24, m: 1, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 0, d: 3, q: 4, znak: 'le' } },
      { s: 'p17.korobka', p: { a: 24, b: 9, material: 2, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 5, b: 6, c: 5, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 9, u: -3, w: 4, m: 2 } },
      { s: 'p20.giri', p: { n1: 7, k1: 4, n2: 8, k2: 6, n3: 13 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: 3, ubrat: 'plus', lo: [-1, 1], hi: [2, 1] } },
      { s: 'p15.prizmaABM', p: { a2: 48, h: 24, m: 1, n: 2, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 7, d: 3, q: 1, znak: 'ge' } },
      { s: 'p17.korobka', p: { a: 21, b: 16, material: 3, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 13, b: 10, c: 13, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 12, u: 6, w: 8, m: 7 } },
      { s: 'p20.giri', p: { n1: 10, k1: 5, n2: 9, k2: 3, n3: 9 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: 1, s2: 3, ubrat: 'plus', lo: [1, 1], hi: [7, 2] } },
      { s: 'p15.prizmaABM', p: { a2: 48, h: 9, m: 8, n: 1, ot: 'C1' } },
      { s: 'p16.korenDrob', p: { p: 8, d: 2, q: 2, znak: 'gt' } },
      { s: 'p17.korobka', p: { a: 45, b: 21, material: 0, vopros: 'x' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 5, b: 12, c: 13, nado: 'MN' } },
      { s: 'p19.dvaKruga', p: { R: 5, u: -4, w: -3, m: 1 } },
      { s: 'p20.giri', p: { n1: 11, k1: 3, n2: 12, k2: 13, n3: 14 } },
    ],
    [
      { s: 'p14.trigDrobSin', p: { sg: -1, s2: -2, ubrat: 'minus', lo: [-2, 1], hi: [1, 2] } },
      { s: 'p15.prizmaABM', p: { a2: 4, h: 2, m: 1, n: 1, ot: 'C' } },
      { s: 'p16.korenDrob', p: { p: 2, d: 3, q: 5, znak: 'ge' } },
      { s: 'p17.korobka', p: { a: 32, b: 20, material: 1, vopros: 'V' } },
      { s: 'p18.kasatelnayaParallel', p: { a: 17, b: 8, c: 15, nado: 'S' } },
      { s: 'p19.dvaKruga', p: { R: 10, u: 8, w: -15, m: 13 } },
      { s: 'p20.giri', p: { n1: 12, k1: 6, n2: 11, k2: 4, n3: 10 } },
    ],
  ],
};
