/**
 * Вариант 17: шесть версий (17.1 — основная, 17.2…17.6 — параллельные).
 * Только параметры шаблонов: условия, ответы и решения собирают
 * движки разделов в браузере (shablony.ts). Числа заморожены — версия
 * «17.3» всегда одна и та же; проверка — pnpm test:povyshennye.
 */

import type { VariantPV } from '../types';

export const VARIANT: VariantPV = {
  k: 17,
  versii: [
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 52, b: 81, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: -3, ay: 5, bx: -4, by: -6, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 6, b: 8, c: 5 } },
      { s: 'z04.taksi', p: { raskraska: 'chern-zhelt', n: 40, k: 14, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 5, k: 4, p: 0.7 } },
      { s: 'z06.ozhidanie', p: { v: 'X', xs: [1, 3, 5, 7], ps: [20, 30, 30, 20], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 2, p: 2, q: 18, e: 1, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 1, r: 1, b: 1, s: 5, sign: 1, q: 4 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-6, 3],
            [-3, -3],
            [-2, 4],
            [1, -2],
            [2, 3],
            [4, -4],
            [6, 4],
          ],
          metki: [-5, -4, -1, 3],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 300,
          eta: 25,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $25\\%$ при температуре холодильника $T_2=300$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 275,
          v: 60,
          t0: 0.5,
          tekst:
            'Из города М в город Н выехал автобус, а через полчаса следом за ним со скоростью 60 км/ч выехал автомобиль. Он догнал автобус в посёлке Р, сразу повернул обратно и вернулся в М в тот момент, когда автобус прибыл в Н. Найдите расстояние от М до Р (в километрах), если расстояние от М до Н равно 275 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -2, Q: [-1, 1], L: [1, 4] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 420, x: 242, imya: 'Кира', goal: 'на ремонт', year: 2029 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 63, b: 95, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 7, ay: -2, bx: 3, by: 9, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 9, b: 4, c: 7 } },
      { s: 'z04.taksi', p: { raskraska: 'bel-sin', n: 25, k: 9, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 4, k: 3, p: 0.6 } },
      {
        s: 'z06.ozhidanie',
        p: { v: 'Y', xs: [2, 5, 8, 11, 14], ps: [10, 25, 30, 20, 15], den: 100 },
      },
      { s: 'z07.log-kvadratnoe', p: { a: 3, p: 2, q: 22, e: -1, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 2, r: 1, b: 1, s: 13, sign: -1, q: 3 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-7, 2],
            [-5, -1],
            [-3, 3],
            [0, -3],
            [1, 4],
            [3, -6],
            [5, 3],
          ],
          metki: [-6, -2, 2, 4],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 350,
          eta: 30,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $30\\%$ при температуре холодильника $T_2=350$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 360,
          v: 100,
          t0: 0.5,
          tekst:
            'Из города П в город Т выехал автобус, а через полчаса следом за ним со скоростью 100 км/ч выехал автомобиль. Он догнал автобус в посёлке С, сразу повернул обратно и вернулся в П в тот момент, когда автобус прибыл в Т. Найдите расстояние от П до С (в километрах), если расстояние от П до Т равно 360 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -4, Q: [-2, 2], L: [2, 3] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 550, x: 360, imya: 'Лука', goal: 'на покупку оборудования', year: 2028 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 37, b: 112, k: 0 } },
      { s: 'z02.skalyar-km', p: { ax: -5, ay: 8, bx: 6, by: 4, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 3, b: 10, c: 7 } },
      { s: 'z04.taksi', p: { raskraska: 'ser-krasn', n: 20, k: 13, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 5, k: 3, p: 0.8 } },
      { s: 'z06.ozhidanie', p: { v: 'Z', xs: [0, 2, 4, 6, 8], ps: [5, 15, 40, 25, 15], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 5, p: 1, q: 11, e: 1, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 4, r: 1, b: 5, s: 1, sign: -1, q: 2 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-5, -1],
            [-3, 6],
            [-1, -5],
            [0, 2],
            [1, -2],
            [4, 6],
            [7, -3],
          ],
          metki: [-4, -2, 5, 6],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 360,
          eta: 20,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $20\\%$ при температуре холодильника $T_2=360$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 286,
          v: 120,
          t0: 0.5,
          tekst:
            'Из города К в город Л выехал автобус, а через полчаса следом за ним со скоростью 120 км/ч выехал автомобиль. Он догнал автобус в посёлке Д, сразу повернул обратно и вернулся в К в тот момент, когда автобус прибыл в Л. Найдите расстояние от К до Д (в километрах), если расстояние от К до Л равно 286 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -4, Q: [-2, 2], L: [1, 2] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 460, x: 338, imya: 'Мира', goal: 'на открытие пекарни', year: 2030 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 44, b: 70, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 4, ay: 9, bx: -7, by: 2, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 12, b: 5, c: 6 } },
      { s: 'z04.taksi', p: { raskraska: 'zel-bel', n: 50, k: 17, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 4, k: 2, p: 0.5 } },
      { s: 'z06.ozhidanie', p: { v: 'X', xs: [-2, 0, 3, 5], ps: [20, 30, 35, 15], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 3, p: 4, q: 11, e: -1, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 5, r: 1, b: 1, s: 29, sign: 1, q: 1 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-5, 4],
            [-3, -6],
            [-2, 1],
            [1, -1],
            [2, 1],
            [4, -5],
            [7, 3],
          ],
          metki: [-4, -1, 5, 6],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 306,
          eta: 15,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $15\\%$ при температуре холодильника $T_2=306$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 396,
          v: 55,
          t0: 1,
          tekst:
            'Из города В в город Г выехал автобус, а через 1 ч следом за ним со скоростью 55 км/ч выехал автомобиль. Он догнал автобус в посёлке Е, сразу повернул обратно и вернулся в В в тот момент, когда автобус прибыл в Г. Найдите расстояние от В до Е (в километрах), если расстояние от В до Г равно 396 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: 4, Q: [2, 2], L: [-2, 3] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 900, x: 625, imya: 'Тихон', goal: 'на покупку участка', year: 2027 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 58, b: 101, k: 0 } },
      { s: 'z02.skalyar-km', p: { ax: -6, ay: -3, bx: 5, by: -8, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 4, b: 7, c: 6 } },
      { s: 'z04.taksi', p: { raskraska: 'bel-sin', n: 30, k: 12, vtoroy: 0 } },
      { s: 'z05.bernulli', p: { syuzhet: 'biatlon', n: 6, k: 4, p: 0.7 } },
      {
        s: 'z06.ozhidanie',
        p: { v: 'Y', xs: [10, 20, 30, 40, 50], ps: [15, 25, 30, 20, 10], den: 100 },
      },
      { s: 'z07.log-kvadratnoe', p: { a: 2, p: 3, q: 26, e: 2, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 4, r: 1, b: 1, s: 41, sign: 1, q: 4 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-6, 1],
            [-3, -5],
            [-1, 4],
            [1, -2],
            [4, 5],
            [5, -4],
          ],
          metki: [-5, -4, -2, 3],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 330,
          eta: 40,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $40\\%$ при температуре холодильника $T_2=330$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 300,
          v: 70,
          t0: 1,
          tekst:
            'Из города Б в город Ж выехал автобус, а через 1 ч следом за ним со скоростью 70 км/ч выехал автомобиль. Он догнал автобус в посёлке З, сразу повернул обратно и вернулся в Б в тот момент, когда автобус прибыл в Ж. Найдите расстояние от Б до З (в километрах), если расстояние от Б до Ж равно 300 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: 2, Q: [1, 2], L: [-1, 6] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 520, x: 291.6, imya: 'Злата', goal: 'на обучение', year: 2031 },
      },
    ],
    [
      { s: 'z01.vpisannyy-dva-ugla', p: { a: 66, b: 87, k: 1 } },
      { s: 'z02.skalyar-km', p: { ax: 8, ay: -5, bx: -2, by: -7, k: 1, m: 1 } },
      { s: 'z03.piramida-v-parallelepipede', p: { a: 8, b: 9, c: 3 } },
      { s: 'z04.taksi', p: { raskraska: 'chern-zhelt', n: 16, k: 4, vtoroy: 1 } },
      { s: 'z05.bernulli', p: { syuzhet: 'tir', n: 3, k: 1, p: 0.6 } },
      { s: 'z06.ozhidanie', p: { v: 'Z', xs: [1, 2, 4, 8], ps: [40, 30, 20, 10], den: 100 } },
      { s: 'z07.log-kvadratnoe', p: { a: 7, p: 3, q: 3, e: 1, sleva: 1 } },
      { s: 'z08.tg-po-znacheniyu', p: { f: 'cos', a: 1, r: 1, b: 1, s: 26, sign: -1, q: 3 } },
      {
        s: 'z09.naib-naim-metka',
        p: {
          uzly: [
            [-7, -3],
            [-4, 3],
            [-2, -4],
            [1, 2],
            [4, -3],
            [5, 3],
            [7, -1],
            [8, 3],
          ],
          metki: [-6, -5, -1, 3],
          naib: 0,
        },
      },
      {
        s: 'z10.kpd',
        p: {
          T2: 285,
          eta: 5,
          tekst:
            'КПД теплового двигателя вычисляется по формуле $\\eta=\\dfrac{T_1-T_2}{T_1}\\cdot100\\%$, где $T_1$ — температура нагревателя, $T_2$ — температура холодильника (обе в кельвинах). Какой должна быть температура нагревателя, чтобы КПД двигателя был равен $5\\%$ при температуре холодильника $T_2=285$ К? Ответ дайте в кельвинах.',
        },
      },
      {
        s: 'z11.avtobus-avtomobil',
        p: {
          S: 216,
          v: 90,
          t0: 1,
          tekst:
            'Из города Ф в город Х выехал автобус, а через 1 ч следом за ним со скоростью 90 км/ч выехал автомобиль. Он догнал автобус в посёлке Ц, сразу повернул обратно и вернулся в Ф в тот момент, когда автобус прибыл в Х. Найдите расстояние от Ф до Ц (в километрах), если расстояние от Ф до Х равно 216 км.',
        },
      },
      { s: 'z12.parabola-pryamaya', p: { r: -4, Q: [-3, 3], L: [1, 4] } },
      {
        s: 'z13.dva-ravnyh-stavka',
        p: { S: 240, x: 196, imya: 'Роман', goal: 'на покупку мотоцикла', year: 2032 },
      },
    ],
  ],
  /** Часть 2: задания 14–20 по версиям; проверка — pnpm test:povyshennye-chast2. */
  chast2: [
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 1,
          znam: 'cos',
          fi: 2,
          B: 3,
          minus1: false,
          minus2: false,
          lo: 0,
          hi: 6,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [1, 1], pl: 'BCC1' } },
      { s: 'j16.korenDrob', p: { c: 5, p: 1, r: 3, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 11, sudno: 0 } },
      { s: 'j18.okrVUgle', p: { beta: 60, R2: 48, nado: 'BN' } },
      { s: 'j19.cosKorni', p: { C: 0.8, t1: 0.64, t2: 0.65, m: 1, n: 5, K: 12 } },
      { s: 'j20.summyCifr', p: { lam: 2, mu: 3, A: 2016, B: 2017, T: 15 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 2,
          znam: 'cos',
          fi: -4,
          B: -3,
          minus1: false,
          minus2: false,
          lo: 2,
          hi: 8,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [2, 1], pl: 'ABC' } },
      { s: 'j16.korenDrob', p: { c: 3, p: 2, r: 6, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 13, sudno: 1 } },
      { s: 'j18.okrVUgle', p: { beta: 60, R2: 12, nado: 'PN' } },
      { s: 'j19.cosKorni', p: { C: 0.3, t1: 1.26, t2: 1.27, m: 1, n: 4, K: 12 } },
      { s: 'j20.summyCifr', p: { lam: 4, mu: 1, A: 1980, B: 1985, T: 10 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 3,
          znam: 'cos',
          fi: 0,
          B: 5,
          minus1: false,
          minus2: true,
          lo: -2,
          hi: 4,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [7, 4], pl: 'ACC1' } },
      { s: 'j16.korenDrob', p: { c: 8, p: 1, r: 7, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 16, sudno: 2 } },
      { s: 'j18.okrVUgle', p: { beta: 90, R2: 50, nado: 'S' } },
      { s: 'j19.cosKorni', p: { C: 0.2, t1: 1.36, t2: 1.37, m: 2, n: 6, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 1, mu: 4, A: 2022, B: 2023, T: 20 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 0,
          znam: 'cos',
          fi: -1,
          B: 4,
          minus1: false,
          minus2: false,
          lo: 2,
          hi: 8,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [5, 2], pl: 'ABB1' } },
      { s: 'j16.korenDrob', p: { c: 2, p: 2, r: 4, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 9, sudno: 3 } },
      { s: 'j18.okrVUgle', p: { beta: 60, R2: 21, nado: 'BN' } },
      { s: 'j19.cosKorni', p: { C: 0.1, t1: 1.47, t2: 1.48, m: 1, n: 3, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 7, mu: 1, A: 1500, B: 1501, T: 9 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 1,
          znam: 'cos',
          fi: 3,
          B: -5,
          minus1: true,
          minus2: false,
          lo: -4,
          hi: 2,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [3, 1], pl: 'ABC' } },
      { s: 'j16.korenDrob', p: { c: 6, p: 3, r: 5, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 17, sudno: 4 } },
      { s: 'j18.okrVUgle', p: { beta: 90, R2: 20, nado: 'PN' } },
      { s: 'j19.cosKorni', p: { C: 0.4, t1: 1.15, t2: 1.16, m: 1, n: 4, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 2, mu: 6, A: 2001, B: 2002, T: 18 } },
    ],
    [
      {
        s: 'j14.trigDrob',
        p: {
          chisl: 'sin',
          zapis: 2,
          znam: 'cos',
          fi: 1,
          B: 3,
          minus1: true,
          minus2: false,
          lo: 0,
          hi: 6,
        },
      },
      { s: 'j15.prizmaPerp', p: { lam: [9, 10], pl: 'ACC1' } },
      { s: 'j16.korenDrob', p: { c: 11, p: 1, r: 9, znak: 'lt' } },
      { s: 'z17.kachka', p: { T: 12.5, sudno: 5 } },
      { s: 'j18.okrVUgle', p: { beta: 60, R2: 27, nado: 'DN' } },
      { s: 'j19.cosKorni', p: { C: 0.1, t1: 1.47, t2: 1.48, m: 2, n: 7, K: 10 } },
      { s: 'j20.summyCifr', p: { lam: 2, mu: 9, A: 1197, B: 1198, T: 18 } },
    ],
  ],
};
