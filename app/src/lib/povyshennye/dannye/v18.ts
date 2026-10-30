/**
 * Вариант 18: шесть версий (18.1 — основная, 18.2…18.6 — параллельные).
 * Только параметры шаблонов: условия, ответы и решения собирают
 * движки разделов в браузере (shablony.ts). Числа заморожены — версия
 * «18.3» всегда одна и та же; проверка — pnpm test:povyshennye.
 */

import type { VariantPV } from '../types';

export const VARIANT: VariantPV = {
  k: 18,
  versii: [
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 49, b: 83, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 10, ay: -3, bx: 4, by: 7, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 6, b: 7, c: 8 } },
      { s: 'z04.taksi', p: { raskraska: 'ser-krasn', n: 25, k: 6, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 5, k: 4, p: 0.9 } },
      {
        s: 'z06.ozhidanie',
        p: { v: 'Y', xs: [3, 5, 7, 9, 11], ps: [10, 20, 40, 20, 10], den: 100 },
      },
      { s: 'z07.log-kvadratnoe', p: { a: 3, p: 2, q: 26, e: 1, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 3, r: 1, b: 1, s: 13, sign: 1, q: 2 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-7, -4],
            [-5, 1],
            [-2, -1],
            [0, 3],
            [2, -1],
            [3, 2],
            [6, -5],
          ],
          metki: [-4, -1, 1, 4],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 273,
          eta: 35,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $35\\%$ при температуре холодильника $T_2=273$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 357,
          v: 60,
          t0: 1.5,
          tekst:
            'Из города М в город Н выехал автобус, а через 1,5 ч следом за ним со скоростью 60 км/ч выехал автомобиль. Он догнал автобус в посёлке Р, сразу повернул обратно и вернулся в М в тот момент, когда автобус прибыл в Н. Найдите расстояние от М до Р (в километрах), если расстояние от М до Н равно 357 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: 2, Q: [1, -2], L: [1, 6] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 430, x: 264.5, imya: 'Арина', goal: 'на покупку мебели', year: 2028 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 71, b: 106, k: 0 } },
      { s: 'z02.skalyar-km', p: { ax: -7, ay: 4, bx: -2, by: -9, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 9, b: 5, c: 4 } },
      { s: 'z04.taksi', p: { raskraska: 'zel-bel', n: 40, k: 22, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 3, k: 2, p: 0.7 } },
      { s: 'z06.ozhidanie', p: { v: 'Z', xs: [-1, 1, 3, 5], ps: [25, 25, 30, 20], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 5, p: 4, q: 8, e: 2, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 1, r: 5, b: 5, s: 1, sign: 1, q: 2 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-6, -2],
            [-3, 1],
            [0, -3],
            [3, 4],
            [5, -1],
            [7, 3],
          ],
          metki: [-4, -1, 2, 4],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 304,
          eta: 20,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $20\\%$ при температуре холодильника $T_2=304$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 325,
          v: 80,
          t0: 1.5,
          tekst:
            'Из города П в город Т выехал автобус, а через 1,5 ч следом за ним со скоростью 80 км/ч выехал автомобиль. Он догнал автобус в посёлке С, сразу повернул обратно и вернулся в П в тот момент, когда автобус прибыл в Т. Найдите расстояние от П до С (в километрах), если расстояние от П до Т равно 325 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: 4, Q: [2, -1], L: [2, 3] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 530, x: 313.6, imya: 'Платон', goal: 'на ремонт гаража', year: 2029 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 38, b: 64, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 6, ay: 5, bx: -4, by: 7, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 12, b: 3, c: 7 } },
      { s: 'z04.taksi', p: { raskraska: 'chern-zhelt', n: 50, k: 19, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 4, k: 3, p: 0.9 } },
      { s: 'z06.ozhidanie', p: { v: 'X', xs: [2, 6, 10, 14], ps: [25, 20, 35, 20], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 2, p: 5, q: 23, e: -1, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 3, r: 1, b: 5, s: 1, sign: -1, q: 3 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-5, -5],
            [-4, 3],
            [-1, -5],
            [1, 5],
            [4, -2],
            [6, 6],
          ],
          metki: [-3, -2, 2, 5],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 261,
          eta: 10,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $10\\%$ при температуре холодильника $T_2=261$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 266,
          v: 60,
          t0: 2,
          tekst:
            'Из города К в город Л выехал автобус, а через 2 ч следом за ним со скоростью 60 км/ч выехал автомобиль. Он догнал автобус в посёлке Д, сразу повернул обратно и вернулся в К в тот момент, когда автобус прибыл в Л. Найдите расстояние от К до Д (в километрах), если расстояние от К до Л равно 266 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -2, Q: [-1, -1], L: [-1, 4] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 560, x: 384.4, imya: 'Ульяна', goal: 'на покупку теплицы', year: 2027 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 57, b: 92, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: -9, ay: 2, bx: 3, by: 8, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 8, b: 6, c: 10 } },
      { s: 'z04.taksi', p: { raskraska: 'bel-sin', n: 20, k: 3, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 6, k: 5, p: 0.8 } },
      {
        s: 'z06.ozhidanie',
        p: { v: 'Y', xs: [0, 5, 10, 15, 20], ps: [10, 20, 35, 25, 10], den: 100 },
      },
      { s: 'z07.log-kvadratnoe', p: { a: 3, p: 3, q: 24, e: 4, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 5, r: 1, b: 1, s: 26, sign: -1, q: 4 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-5, -3],
            [-3, 2],
            [0, -3],
            [3, 1],
            [6, -2],
          ],
          metki: [-4, -2, -1, 4],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 336,
          eta: 30,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $30\\%$ при температуре холодильника $T_2=336$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 255,
          v: 85,
          t0: 2,
          tekst:
            'Из города В в город Г выехал автобус, а через 2 ч следом за ним со скоростью 85 км/ч выехал автомобиль. Он догнал автобус в посёлке Е, сразу повернул обратно и вернулся в В в тот момент, когда автобус прибыл в Г. Найдите расстояние от В до Е (в километрах), если расстояние от В до Г равно 255 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: 4, Q: [2, -4], L: [2, 5] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 500, x: 450, imya: 'Богдан', goal: 'на запуск фермы', year: 2030 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 46, b: 118, k: 0 } },
      { s: 'z02.skalyar-km', p: { ax: 5, ay: -7, bx: 8, by: 4, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 5, b: 6, c: 11 } },
      { s: 'z04.taksi', p: { raskraska: 'ser-krasn', n: 16, k: 10, vtoroy: 0 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 5, k: 2, p: 0.4 } },
      { s: 'z06.ozhidanie', p: { v: 'Z', xs: [4, 8, 12], ps: [50, 30, 20], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 5, p: 2, q: 13, e: -1, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 4, r: 1, b: 1, s: 17, sign: 1, q: 1 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-5, 5],
            [-2, -3],
            [0, 3],
            [3, -2],
            [5, 3],
            [8, -3],
          ],
          metki: [1, 4, 6, 7],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 290,
          eta: 42,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $42\\%$ при температуре холодильника $T_2=290$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 368,
          v: 105,
          t0: 2,
          tekst:
            'Из города Б в город Ж выехал автобус, а через 2 ч следом за ним со скоростью 105 км/ч выехал автомобиль. Он догнал автобус в посёлке З, сразу повернул обратно и вернулся в Б в тот момент, когда автобус прибыл в Ж. Найдите расстояние от Б до З (в километрах), если расстояние от Б до Ж равно 368 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -4, Q: [-2, -1], L: [-2, 3] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 220, x: 144, imya: 'Есения', goal: 'на курсы', year: 2031 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 75, b: 99, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 2, ay: 11, bx: -6, by: 1, k: 1, m: 1 } },
      { s: 'z03.tetraedr-v-parallelepipede', p: { a: 10, b: 9, c: 4 } },
      { s: 'z04.taksi', p: { raskraska: 'zel-bel', n: 25, k: 14, vtoroy: 0 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 4, k: 1, p: 0.3 } },
      {
        s: 'z06.ozhidanie',
        p: { v: 'X', xs: [1, 4, 7, 10, 13], ps: [5, 25, 40, 20, 10], den: 100 },
      },
      { s: 'z07.log-kvadratnoe', p: { a: 7, p: 1, q: 16, e: 2, sleva: 0 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'sin', a: 1, r: 2, b: 2, s: 1, sign: -1, q: 3 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-6, -4],
            [-3, 6],
            [0, -1],
            [2, 6],
            [5, -2],
            [7, 5],
          ],
          metki: [-5, -4, -1, 3],
          naib: 1,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 315,
          eta: 25,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $25\\%$ при температуре холодильника $T_2=315$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 360,
          v: 50,
          t0: 3,
          tekst:
            'Из города Ф в город Х выехал автобус, а через 3 ч следом за ним со скоростью 50 км/ч выехал автомобиль. Он догнал автобус в посёлке Ц, сразу повернул обратно и вернулся в Ф в тот момент, когда автобус прибыл в Х. Найдите расстояние от Ф до Ц (в километрах), если расстояние от Ф до Х равно 360 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -2, Q: [-1, -2], L: [-1, 6] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 410, x: 220.5, imya: 'Мирон', goal: 'на новую лодку', year: 2032 },
      },
    ],
  ],
  /** Часть 2: задания 14–20 по версиям; проверка — pnpm test:povyshennye-chast2. */
  chast2: [
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 1,
          znam: 'sin',
          fi: 2,
          B: 5,
          minus1: false,
          minus2: false,
          lo: 0,
          hi: 6,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [1, 1], pl: 'ABC' } },
      { s: 'j16.korenDrob', p: { c: 7, p: 4, r: 2, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 10, sudno: 2 } },
      { s: 'j18.okrVUgle', p: { beta: 90, R2: 32, nado: 'S' } },
      { s: 'j19.cosKorni', p: { C: 0.8, t1: 0.64, t2: 0.65, m: -1, n: 4, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 4, mu: 4, A: 2019, B: 2020, T: 20 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 2,
          znam: 'sin',
          fi: -2,
          B: 3,
          minus1: true,
          minus2: false,
          lo: 2,
          hi: 8,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [2, 1], pl: 'BCC1' } },
      { s: 'j16.korenDrob', p: { c: 3, p: 5, r: 1, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 11.5, sudno: 3 } },
      { s: 'j18.okrVUgle', p: { beta: 120, R2: 39, nado: 'BN' } },
      { s: 'j19.cosKorni', p: { C: 0.3, t1: 1.26, t2: 1.27, m: -2, n: 3, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 4, mu: 1, A: 2007, B: 2008, T: 13 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 3,
          znam: 'sin',
          fi: 0,
          B: -3,
          minus1: false,
          minus2: false,
          lo: 0,
          hi: 6,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [6, 5], pl: 'ACC1' } },
      { s: 'j16.korenDrob', p: { c: 6, p: 6, r: 2, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 13.5, sudno: 4 } },
      { s: 'j18.okrVUgle', p: { beta: 120, R2: 13, nado: 'S' } },
      { s: 'j19.cosKorni', p: { C: 0.2, t1: 1.36, t2: 1.37, m: -1, n: 2, K: 12 } },
      { s: 'j20.summyCifr', p: { lam: 1, mu: 1, A: 1035, B: 1036, T: 9 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 0,
          znam: 'sin',
          fi: 3,
          B: 4,
          minus1: false,
          minus2: false,
          lo: 2,
          hi: 8,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [7, 8], pl: 'ABB1' } },
      { s: 'j16.korenDrob', p: { c: 2, p: 7, r: 3, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 15.5, sudno: 5 } },
      { s: 'j18.okrVUgle', p: { beta: 90, R2: 8, nado: 'DN' } },
      { s: 'j19.cosKorni', p: { C: 0.1, t1: 1.47, t2: 1.48, m: -2, n: 3, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 2, mu: 3, A: 2007, B: 2009, T: 21 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 1,
          znam: 'sin',
          fi: -1,
          B: 5,
          minus1: false,
          minus2: true,
          lo: -2,
          hi: 4,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [7, 4], pl: 'BCC1' } },
      { s: 'j16.korenDrob', p: { c: 10, p: 5, r: 3, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 16.5, sudno: 0 } },
      { s: 'j18.okrVUgle', p: { beta: 120, R2: 52, nado: 'DN' } },
      { s: 'j19.cosKorni', p: { C: 0.4, t1: 1.15, t2: 1.16, m: -1, n: 2, K: 12 } },
      { s: 'j20.summyCifr', p: { lam: 7, mu: 4, A: 1503, B: 1504, T: 36 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'cos',
          zapis: 2,
          znam: 'sin',
          fi: 4,
          B: -4,
          minus1: false,
          minus2: false,
          lo: 2,
          hi: 8,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [5, 2], pl: 'ACC1' } },
      { s: 'j16.korenDrob', p: { c: 1, p: 8, r: 2, znak: 'gt' } },
      { s: 'z17.kachka', p: { T: 18, sudno: 1 } },
      { s: 'j18.okrVUgle', p: { beta: 90, R2: 18, nado: 'BN' } },
      { s: 'j19.cosKorni', p: { C: 0.3, t1: 1.26, t2: 1.27, m: 0, n: 4, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 1, mu: 4, A: 2004, B: 2005, T: 28 } },
    ],
  ],
};
