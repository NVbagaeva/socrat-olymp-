/**
 * Опорные задачи №18, тема «Площади». Составлены для сайта.
 * Проверка: scripts/verify_opornye18/ploshchadi.mjs.
 */

import type { Opornaya18 } from './tipy';

export const OP18_TRI_UGLA: Opornaya18 = {
  id: 'tri-ugla-ploshchad',
  no: 15,
  gruppa: 'ploshchadi',
  nazvanie: 'Треугольник с вершинами на сторонах',
  uslovie:
    'На сторонах $AB$, $BC$ и $CA$ треугольника $ABC$ отмечены точки $K$, $L$ и $M$ так, что каждое из отношений $AK : KB$, $BL : LC$ и $CM : MA$ равно $1 : 2$.',
  a: 'Докажите, что площадь треугольника $KLM$ равна трети площади треугольника $ABC$.',
  b: 'Найдите площадь треугольника $KLM$, если $AB = 13$, $BC = 14$ и $CA = 15$.',
  skhemy: [
    {
      id: 'obshchiy-ugol',
      zachem: 'площади треугольников с общим углом относятся как произведения сторон при этом угле',
    },
  ],
  reshenieA: [
    {
      tekst:
        'У треугольников $AKM$ и $ABC$ общий угол $A$, и $AK = \\dfrac13 AB$, $AM = \\dfrac23 AC$. Поэтому $S_{AKM} = \\dfrac13\\cdot\\dfrac23\\cdot S_{ABC} = \\dfrac29\\,S_{ABC}$.',
      gruppy: ['akm'],
    },
    {
      tekst:
        'Так же $S_{BLK} = \\dfrac{BL}{BC}\\cdot\\dfrac{BK}{BA}\\cdot S_{ABC} = \\dfrac29\\,S_{ABC}$ и $S_{CML} = \\dfrac29\\,S_{ABC}$.',
      gruppy: ['bkl', 'clm'],
    },
    {
      tekst: '$S_{KLM} = S_{ABC} - 3\\cdot\\dfrac29\\,S_{ABC} = \\dfrac13\\,S_{ABC}$.',
      gruppy: ['klm'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По формуле Герона: $p = \\dfrac{13 + 14 + 15}{2} = 21$, $S_{ABC} = \\sqrt{21\\cdot 8\\cdot 7\\cdot 6} = 84$.',
      gruppy: ['geron'],
    },
    {
      tekst: 'По пункту а) $S_{KLM} = \\dfrac{84}{3} = 28$.',
      gruppy: ['klm'],
    },
  ],
  otvet: '$28$',
};

export const OP18_RASSTOYANIYA: Opornaya18 = {
  id: 'rasstoyaniya-do-storon',
  no: 16,
  gruppa: 'ploshchadi',
  nazvanie: 'Расстояния до сторон правильного треугольника',
  uslovie:
    'Точка $P$ лежит внутри правильного треугольника $ABC$; $PK$, $PL$ и $PM$ — перпендикуляры к сторонам $AB$, $BC$ и $CA$.',
  a: 'Докажите, что сумма $PK + PL + PM$ равна высоте треугольника.',
  b: 'Найдите сторону треугольника, если $PK = 1$, $PL = 2$ и $PM = 3$.',
  skhemy: [
    {
      id: 'metod-ploshchadey',
      zachem: 'площадь фигуры, сосчитанная двумя способами, даёт уравнение на длины',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Отрезки $PA$, $PB$, $PC$ делят треугольник на три: $S_{ABC} = S_{PAB} + S_{PBC} + S_{PCA}$. Высоты этих треугольников, проведённые из $P$, — это $PK$, $PL$, $PM$.',
      gruppy: ['razb'],
    },
    {
      tekst:
        'Пусть $a$ — сторона, $h$ — высота. Тогда $\\dfrac12 ah = \\dfrac12 a\\cdot PK + \\dfrac12 a\\cdot PL + \\dfrac12 a\\cdot PM$, и после сокращения на $\\dfrac a2$ получаем $PK + PL + PM = h$.',
      gruppy: ['sum'],
    },
  ],
  reshenieB: [
    {
      tekst: 'По пункту а) высота $h = 1 + 2 + 3 = 6$.',
      gruppy: ['sum'],
    },
    {
      tekst:
        'Высота правильного треугольника $h = \\dfrac{a\\sqrt3}{2}$, отсюда $a = \\dfrac{2h}{\\sqrt3} = \\dfrac{12}{\\sqrt3} = 4\\sqrt3$.',
      gruppy: ['vys'],
    },
  ],
  otvet: '$4\\sqrt3$',
};
