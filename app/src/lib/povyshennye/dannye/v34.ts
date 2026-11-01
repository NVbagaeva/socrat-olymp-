/**
 * Вариант 34: шесть версий (34.1 — основная, 34.2…34.6 — параллельные).
 * Только параметры шаблонов: условия, ответы и решения собирают
 * движки разделов в браузере (shablony.ts). Числа заморожены — версия
 * «34.3» всегда одна и та же; проверка — pnpm test:povyshennye.
 */

import type { VariantPV } from '../types';

export const VARIANT: VariantPV = {
  k: 34,
  versii: [
    [
      { s: 'z01.sekushchie-acb', p: { t: 120, s: 40 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: 3, ay: -4, bIzv: 6, neizv: 'bx', k: 2, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 18, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 20, k: 5, r: 2, kto: 'Б.', reys: 'вторым' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 8, k: 3, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'X', xs: [3, 7, 8], ps: [30, 50, 20], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 2.5, s: 1, k: 1, b: 4, r: -1, m: 3, c: 0 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: -0.6, k: 25 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-6, -2],
            [-5, 0],
            [-4, 2],
            [-2, 3],
            [0, 0],
            [1, -2],
            [3, 0],
            [4, 1],
            [6, 3],
            [7, 2],
          ],
          metki: [-4, -3, -1, 1, 2, 4, 5, 6],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 2,
          Rm: 5,
          U0: 24,
          alpha: 0.9,
          t: 27,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=2\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=5\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=24$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}9$ — постоянная. Какое напряжение будет на конденсаторе через $27$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 3,
          N1: 90,
          N2: 60,
          tm: 300,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $3$ деталей меньше, чем второй. Заказ из $90$ деталей первый рабочий выполняет на $5$ ч дольше, чем второй выполняет заказ из $60$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [-2, 0], B: [2, 2], y0: 5 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 300, r: 20, Z: 1483.2, imya: 'Тихон', goal: 'на покупку яхты', year: 2028 },
      },
    ],
    [
      { s: 'z01.sekushchie-acb', p: { t: 140, s: 36 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: 1, ay: -2, bIzv: -3, neizv: 'bx', k: 3, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 22, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 40, k: 5, r: 3, kto: 'Ч.', reys: 'третьим' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 9, k: 4, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'Y', xs: [5, 7, 8], ps: [10, 80, 10], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 0.5, s: 1, k: 2, b: -1, r: -2, m: 1, c: 2 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: 0.7, k: 10 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-5, 3],
            [-4, 0],
            [-2, -3],
            [0, 0],
            [2, 2],
            [3, 0],
            [4, -2],
            [6, -1],
          ],
          metki: [-3, -2, -1, 1, 2, 4, 5],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 3,
          Rm: 4,
          U0: 18,
          alpha: 0.6,
          t: 14.4,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=3\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=4\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=18$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}6$ — постоянная. Какое напряжение будет на конденсаторе через $14{,}4$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 5,
          N1: 80,
          N2: 90,
          tm: 120,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $5$ деталей меньше, чем второй. Заказ из $80$ деталей первый рабочий выполняет на $2$ ч дольше, чем второй выполняет заказ из $90$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [1, 0], B: [5, -4], y0: -10 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 150, r: 20, Z: 1432.8, imya: 'Злата', goal: 'на ремонт', year: 2028 },
      },
    ],
    [
      { s: 'z01.sekushchie-acb', p: { t: 100, s: 30 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: 2, ay: 1, bIzv: 2.5, neizv: 'bx', k: 2.5, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 40, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 25, k: 5, r: 4, kto: 'Г.', reys: 'четвёртым' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 6, k: 2, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'Z', xs: [2, 3, 5], ps: [50, 20, 30], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 0.2, s: 1, k: 2, b: 1, r: -2, m: 1, c: -2 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: -0.8, k: 15 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-7, -1],
            [-6, -3],
            [-4, 0],
            [-3, 2],
            [-1, 0],
            [0, -1],
            [2, -3],
            [3, 0],
            [5, 3],
            [6, 2],
          ],
          metki: [-6, -5, -3, -2, 0, 1, 2, 4, 5],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 5,
          Rm: 2,
          U0: 56,
          alpha: 0.8,
          t: 32,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=5\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=2\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=56$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}8$ — постоянная. Какое напряжение будет на конденсаторе через $32$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 2,
          N1: 64,
          N2: 50,
          tm: 180,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $2$ деталей меньше, чем второй. Заказ из $64$ деталей первый рабочий выполняет на $3$ ч дольше, чем второй выполняет заказ из $50$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [-3, 0], B: [1, 3], y0: 6 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 400, r: 10, Z: 1323.3, imya: 'Демид', goal: 'на обучение детей', year: 2028 },
      },
    ],
    [
      { s: 'z01.sekushchie-acb', p: { t: 130, s: 44 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: 4, ay: 3, bIzv: -4.8, neizv: 'bx', k: 1.2, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 7, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 32, k: 4, r: 6, kto: 'З.', reys: 'шестым' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 10, k: 5, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'X', xs: [1, 3, 5], ps: [20, 50, 30], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 2.5, s: 2, k: 1, b: 0, r: -1, m: 1, c: -6 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: 0.5, k: 12 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-4, 2],
            [-3, 0],
            [-2, -2],
            [-1, 0],
            [1, 3],
            [3, 2],
            [4, 0],
            [6, -3],
            [7, -2],
          ],
          metki: [-2, 0, 1, 2, 3, 5, 6],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 4,
          Rm: 6,
          U0: 22,
          alpha: 0.5,
          t: 24,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=4\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=6\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=22$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}5$ — постоянная. Какое напряжение будет на конденсаторе через $24$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 4,
          N1: 120,
          N2: 84,
          tm: 360,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $4$ деталей меньше, чем второй. Заказ из $120$ деталей первый рабочий выполняет на $6$ ч дольше, чем второй выполняет заказ из $84$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [-1, 0], B: [8, -3], y0: -5 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 200, r: 10, Z: 1393.7, imya: 'Ульяна', goal: 'на покупку дома', year: 2028 },
      },
    ],
    [
      { s: 'z01.sekushchie-acb', p: { t: 156, s: 50 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: 5, ay: -12, bIzv: 10, neizv: 'bx', k: 2, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 13, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 50, k: 10, r: 3, kto: 'Ю.', reys: 'третьим' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 8, k: 4, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'Y', xs: [2, 3, 9], ps: [50, 20, 30], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 1.25, s: 1, k: 2, b: 1, r: -1, m: 1, c: -4 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: -0.3, k: 50 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-8, 2],
            [-7, 0],
            [-5, -2],
            [-3, 0],
            [-1, 3],
            [0, 2],
            [2, 0],
            [3, -1],
            [5, -3],
            [6, -1],
          ],
          metki: [-6, -5, -4, -2, -1, 0, 1, 3, 4, 5],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 2,
          Rm: 7,
          U0: 52,
          alpha: 0.5,
          t: 21,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=2\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=7\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=52$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}5$ — постоянная. Какое напряжение будет на конденсаторе через $21$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 3,
          N1: 72,
          N2: 54,
          tm: 360,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $3$ деталей меньше, чем второй. Заказ из $72$ деталей первый рабочий выполняет на $6$ ч дольше, чем второй выполняет заказ из $54$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [2, 0], B: [6, 4], y0: 7 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 500, r: 20, Z: 1665.6, imya: 'Лука', goal: 'на открытие пекарни', year: 2028 },
      },
    ],
    [
      { s: 'z01.sekushchie-acb', p: { t: 110, s: 26 } },
      {
        s: 'z02.dlina-otnoshenie',
        p: { ax: -2, ay: 4, bIzv: 6, neizv: 'bx', k: 1.5, vybor: 'bolshiy' },
      },
      { s: 'z03.cilindr-s-po-sharu', p: { S: 34, vid: 0 } },
      { s: 'z04.vertolet', p: { N: 60, k: 3, r: 5, kto: 'Ш.', reys: 'пятым' } },
      { s: 'z05.bernulli-otnoshenie', p: { syuzhet: 'moneta', n: 7, k: 2, p: 0.5 } },
      { s: 'z06.otklonenie', p: { v: 'Z', xs: [3, 5, 6], ps: [70, 20, 10], den: 100 } },
      { s: 'z07.pokazatelnoe-osnovaniya', p: { a: 4, s: 1, k: 3, b: -1, r: -1, m: 1, c: 3 } },
      { s: 'z08.cos-dvoynogo-po', p: { given: 'cos', s: 0.9, k: 20 } },
      {
        s: 'z09.metki-fprime',
        p: {
          znak: 1,
          uzly: [
            [-6, -1],
            [-5, 0],
            [-3, 3],
            [-1, 1],
            [0, 0],
            [2, -2],
            [3, 0],
            [5, 2],
            [6, 1],
          ],
          metki: [-4, -3, -2, -1, 1, 2, 4, 5],
        },
      },
      {
        s: 'z10.kondensator',
        p: {
          Cm: 6,
          Rm: 5,
          U0: 15,
          alpha: 0.4,
          t: 12,
          tekst:
            'В устройстве высоковольтный конденсатор ёмкостью $C=6\\cdot10^{-6}$ Ф подключён параллельно резистору сопротивлением $R=5\\cdot10^{6}$ Ом. Пока устройство работает, напряжение на конденсаторе равно $U_0=15$ кВ. После выключения напряжение на конденсаторе убывает до значения $U$ (кВ) за время $t=\\alpha RC\\log_2\\dfrac{U_0}{U}$ (с), где $\\alpha=0{,}4$ — постоянная. Какое напряжение будет на конденсаторе через $12$ с после выключения? Ответ дайте в киловольтах.',
        },
      },
      {
        s: 'z11.mastera',
        p: {
          r: 5,
          N1: 150,
          N2: 120,
          tm: 240,
          ask: 'pervyy',
          tekst:
            'Первый рабочий изготавливает в час на $5$ деталей меньше, чем второй. Заказ из $150$ деталей первый рабочий выполняет на $4$ ч дольше, чем второй выполняет заказ из $120$ таких же деталей. Сколько деталей в час изготавливает первый рабочий?',
        },
      },
      { s: 'z12.dva-uzla', p: { vid: 'korenSdvig', A: [-4, 0], B: [5, 6], y0: 9 } },
      {
        s: 'z13.vklad-nachalnyy',
        p: { x: 100, r: 20, Z: 1646.4, imya: 'Ева', goal: 'на путешествие', year: 2028 },
      },
    ],
  ],
  /** Часть 2: задания 14–20 по версиям — свои задачи раздела (шаблоны r14–r20); проверка — pnpm test:povyshennye-chast2. */
  chast2: [
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: '1', t2: 'k3/3', lo: -3, hi: 0 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 2, hN: 1, hD: 1 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [3, 1], u1: 1, u2: 3, w1: -1 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 84, c: 2, vopros: 'p' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 7, n: 30 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 5, kol: 2 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 16 } },
    ],
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: '-1', t2: '-k3', lo: 0, hi: 3 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 6, hN: 2, hD: 1 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [1, 5], u1: 0, u2: 4, w1: -2 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 72, c: 3, vopros: 'P' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 4, n: 6 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 3, kol: 4 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 18 } },
    ],
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: 'k3', t2: '-1', lo: -2, hi: 1 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 4, hN: 6, hD: 1 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [2, 1], u1: 2, u2: 6, w1: 1 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 77, c: 5, vopros: 'P' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 6, n: 9 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 4, kol: 3 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 20 } },
    ],
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: '-k3/3', t2: '1', lo: 1, hi: 4 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 8, hN: 4, hD: 1 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [1, 2], u1: -4, u2: 1, w1: -5 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 40, c: 1, vopros: 'p' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 8, n: 12 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 6, kol: 2 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 24 } },
    ],
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: 'k3/3', t2: '-1', lo: -1, hi: 2 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 10, hN: 5, hD: 1 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [7, 1], u1: -1, u2: 4, w1: -3 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 32, c: 2, vopros: 'P' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 10, n: 15 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 6, kol: 4 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 28 } },
    ],
    [
      { s: 'r14.trig', p: { vid: 'odnor', t1: '-k3', t2: 'k3/3', lo: 2, hi: 5 } },
      { s: 'r15.stereo', p: { vid: 'piramida', a: 6, hN: 9, hD: 2 } },
      { s: 'r16.neravenstvo', p: { vid: 'logOdz', q: [1, 3], u1: 1, u2: 5, w1: 0 } },
      { s: 'r17.ekstremum', p: { vid: 'pribyl', A: 45, c: 3, vopros: 'p' } },
      { s: 'r18.planimetriya', p: { vid: 'vpisPryam', m: 6, n: 20 } },
      { s: 'r19.parametr', p: { vid: 'okrModul', R: 3, kol: 3 } },
      { s: 'r20.teoriyaChisel', p: { vid: 'deliteli', k: 30 } },
    ],
  ],
};
