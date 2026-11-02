/**
 * Блок 10 «Замена сразу»: уравнение — квадратное относительно одной
 * функции. Первая задача — с полным разбором (условие из листа ученика,
 * промежуток б свой), остальные — свои, с подсказками.
 */

import { cos, otrezok, s, sin, sqrt, tg, u, ur, v, ctg } from '../dsl';
import type { Zadacha14 } from '../tipy';

const ZAMENA = ['$t=\\cos x$', '$t=\\cos^2 x$', '$t=\\sin x$'];

export const ZADACHI_10: Zadacha14[] = [
  ur({
    id: 'z10-01',
    iz: 'лист 22, №22',
    uravnenie: '6\\cos^2 x-7\\cos x-5=0',
    f: (x) => 6 * cos(x) ** 2 - 7 * cos(x) - 5,
    serii: [s(u(2, 3)), s(u(-2, 3))],
    promezhutok: otrezok(u(-2), u(1, 2)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'В уравнение входит только $\\cos x$ — в квадрате и в первой степени. Это квадратное уравнение относительно $\\cos x$, поэтому делаем замену $t=\\cos x$, причём $-1\\le t\\le 1$: косинус не выходит за эти границы.',
      'Получаем $6t^2-7t-5=0$. Дискриминант $D=49+120=169=13^2$, корни $t=\\dfrac{7+13}{12}=\\dfrac{5}{3}$ и $t=\\dfrac{7-13}{12}=-\\dfrac{1}{2}$.',
      'Проверяем условие $|t|\\le 1$: $t=\\dfrac{5}{3}>1$ — не подходит, у уравнения $\\cos x=\\dfrac{5}{3}$ корней нет. Остаётся $t=-\\dfrac{1}{2}$.',
      'Возвращаемся к $x$: $\\cos x=-\\dfrac{1}{2}$. На оси косинусов отмечаем $-\\dfrac{1}{2}$ и проводим прямую параллельно оси синусов. Она пересекает окружность в точках $\\dfrac{2\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$: они симметричны относительно оси косинусов.',
      'Ответ пункта а: $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какую замену сделать?', ZAMENA, 0, 'Обе части с $x$ — это $\\cos x$ в квадрате и в первой степени.'),
      v('Какие корни у $6t^2-7t-5=0$?', ['$t=\\dfrac{5}{3}$ и $t=-\\dfrac{1}{2}$', '$t=-\\dfrac{5}{3}$ и $t=\\dfrac{1}{2}$', '$t=1$ и $t=-\\dfrac{5}{6}$'], 0),
      v('Какой корень не подходит?', ['$t=\\dfrac{5}{3}$: косинус не больше $1$', '$t=-\\dfrac{1}{2}$: косинус не бывает отрицательным', 'Подходят оба'], 0),
      v('Решения $\\cos x=-\\dfrac{1}{2}$:', ['$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$x=-\\dfrac{\\pi}{6}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-02',
    uravnenie: '2\\sin^2 x-\\sin x-1=0',
    f: (x) => 2 * sin(x) ** 2 - sin(x) - 1,
    serii: [s(u(1, 2)), s(u(-1, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'nerav',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\sin x$, $-1\\le t\\le 1$: получаем $2t^2-t-1=0$.',
      '$D=1+8=9$, корни $t=1$ и $t=-\\dfrac{1}{2}$ — оба в пределах $[-1;\\,1]$.',
      '$\\sin x=1$: $x=\\dfrac{\\pi}{2}+2\\pi k$ — одна точка на окружности, верхняя.',
      '$\\sin x=-\\dfrac{1}{2}$: прямая $y=-\\dfrac{1}{2}$ пересекает окружность в точках $-\\dfrac{\\pi}{6}$ и $-\\dfrac{5\\pi}{6}$, отсюда $x=-\\dfrac{\\pi}{6}+2\\pi k$ и $x=-\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Какую замену сделать?', ['$t=\\sin x$', '$t=\\sin^2 x$', '$t=\\cos x$'], 0),
      v('Корни $2t^2-t-1=0$:', ['$t=1$ и $t=-\\dfrac{1}{2}$', '$t=-1$ и $t=\\dfrac{1}{2}$', '$t=2$ и $t=-1$'], 0),
      v('Подходят ли оба корня?', ['Да, оба лежат в $[-1;\\,1]$', 'Нет, $t=1$ не подходит', 'Нет, $t=-\\dfrac{1}{2}$ не подходит'], 0),
      v('Решения $\\sin x=-\\dfrac{1}{2}$:', ['$x=-\\dfrac{\\pi}{6}+2\\pi k$ и $x=-\\dfrac{5\\pi}{6}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=-\\dfrac{\\pi}{3}+2\\pi k$ и $x=-\\dfrac{2\\pi}{3}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-03',
    uravnenie: '2\\cos^2 x+3\\cos x+1=0',
    f: (x) => 2 * cos(x) ** 2 + 3 * cos(x) + 1,
    serii: [s(u(2, 3)), s(u(-2, 3)), s(u(1))],
    promezhutok: otrezok(u(-3), u(-3, 2)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\cos x$, $|t|\\le 1$: $2t^2+3t+1=0$.',
      '$D=9-8=1$, корни $t=-\\dfrac{1}{2}$ и $t=-1$ — оба подходят.',
      '$\\cos x=-1$: $x=\\pi+2\\pi k$.',
      '$\\cos x=-\\dfrac{1}{2}$: $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$.',
    ],
    podskazki: [
      v('Какую замену сделать?', ZAMENA, 0),
      v('Корни $2t^2+3t+1=0$:', ['$t=-\\dfrac{1}{2}$ и $t=-1$', '$t=\\dfrac{1}{2}$ и $t=1$', '$t=-2$ и $t=-\\dfrac{1}{2}$'], 0),
      v('Решения $\\cos x=-1$:', ['$x=\\pi+2\\pi k$', '$x=\\pi k$', '$x=-\\dfrac{\\pi}{2}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-04',
    uravnenie: '\\operatorname{tg}^2 x-(1+\\sqrt{3})\\operatorname{tg} x+\\sqrt{3}=0',
    f: (x) => tg(x) ** 2 - (1 + sqrt(3)) * tg(x) + sqrt(3),
    odz: (x) => Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1, 4), 1), s(u(1, 3), 1)],
    promezhutok: otrezok(u(2), u(7, 2)),
    otbor: 'nerav',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\operatorname{tg} x$. Ограничений на $t$ нет: тангенс принимает любые значения. Получаем $t^2-(1+\\sqrt{3})t+\\sqrt{3}=0$.',
      'По теореме Виета сумма корней $1+\\sqrt{3}$, произведение $\\sqrt{3}$: корни $t=1$ и $t=\\sqrt{3}$.',
      '$\\operatorname{tg} x=1$: $x=\\dfrac{\\pi}{4}+\\pi k$; $\\operatorname{tg} x=\\sqrt{3}$: $x=\\dfrac{\\pi}{3}+\\pi k$. У тангенса период $\\pi$.',
    ],
    podskazki: [
      v('Нужно ли условие $|t|\\le 1$ при замене $t=\\operatorname{tg}x$?', ['Нет, тангенс принимает любые значения', 'Да, как у синуса', 'Да, но только $t\\ge 0$'], 0),
      v('Корни $t^2-(1+\\sqrt{3})t+\\sqrt{3}=0$:', ['$t=1$ и $t=\\sqrt{3}$', '$t=-1$ и $t=-\\sqrt{3}$', '$t=1$ и $t=-\\sqrt{3}$'], 0, 'Сумма корней $1+\\sqrt{3}$, произведение $\\sqrt{3}$.'),
      v('Период серий тангенса:', ['$\\pi$', '$2\\pi$', '$\\dfrac{\\pi}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z10-05',
    uravnenie: '2\\sin^2 x+3\\sin x-2=0',
    f: (x) => 2 * sin(x) ** 2 + 3 * sin(x) - 2,
    serii: [s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(-4), u(-5, 2)),
    otbor: 'nerav',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\sin x$, $|t|\\le1$: $2t^2+3t-2=0$, $D=9+16=25$.',
      'Корни $t=\\dfrac{1}{2}$ и $t=-2$. Корень $t=-2$ не подходит: синус не меньше $-1$.',
      '$\\sin x=\\dfrac{1}{2}$: $x=\\dfrac{\\pi}{6}+2\\pi k$ и $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Корни $2t^2+3t-2=0$:', ['$t=\\dfrac{1}{2}$ и $t=-2$', '$t=-\\dfrac{1}{2}$ и $t=2$', '$t=1$ и $t=-\\dfrac{3}{2}$'], 0),
      v('Какой корень отбрасываем?', ['$t=-2$', '$t=\\dfrac{1}{2}$', 'Никакой'], 0, 'Синус лежит между $-1$ и $1$.'),
      v('Решения $\\sin x=\\dfrac{1}{2}$:', ['$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{5\\pi}{6}+2\\pi k$', '$\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$\\dfrac{\\pi}{3}+2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-06',
    uravnenie: '4\\sin^2 x-4\\sin x-3=0',
    f: (x) => 4 * sin(x) ** 2 - 4 * sin(x) - 3,
    serii: [s(u(-1, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(3), u(9, 2)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\sin x$, $|t|\\le 1$: $4t^2-4t-3=0$, $D=16+48=64$.',
      'Корни $t=\\dfrac{3}{2}$ и $t=-\\dfrac{1}{2}$; $t=\\dfrac{3}{2}>1$ не подходит.',
      '$\\sin x=-\\dfrac{1}{2}$: $x=-\\dfrac{\\pi}{6}+2\\pi k$ и $x=-\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Корни $4t^2-4t-3=0$:', ['$t=\\dfrac{3}{2}$ и $t=-\\dfrac{1}{2}$', '$t=-\\dfrac{3}{2}$ и $t=\\dfrac{1}{2}$', '$t=3$ и $t=-1$'], 0),
      v('Что делаем с $t=\\dfrac{3}{2}$?', ['Отбрасываем: $\\sin x\\le 1$', 'Решаем $\\sin x=\\dfrac{3}{2}$', 'Оставляем, это ответ'], 0),
      v('Решения $\\sin x=-\\dfrac{1}{2}$:', ['$-\\dfrac{\\pi}{6}+2\\pi k$ и $-\\dfrac{5\\pi}{6}+2\\pi k$', '$\\pm\\dfrac{2\\pi}{3}+2\\pi k$', '$-\\dfrac{\\pi}{6}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-07',
    uravnenie: '3\\operatorname{tg}^2 x-4\\sqrt{3}\\operatorname{tg} x+3=0',
    f: (x) => 3 * tg(x) ** 2 - 4 * sqrt(3) * tg(x) + 3,
    odz: (x) => Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1, 3), 1), s(u(1, 6), 1)],
    promezhutok: otrezok(u(-1), u(1, 2)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\operatorname{tg} x$: $3t^2-4\\sqrt{3}t+3=0$.',
      '$D=48-36=12$, $\\sqrt{D}=2\\sqrt{3}$; $t=\\dfrac{4\\sqrt{3}\\pm2\\sqrt{3}}{6}$, то есть $t=\\sqrt{3}$ или $t=\\dfrac{\\sqrt{3}}{3}$.',
      '$\\operatorname{tg}x=\\sqrt{3}$: $x=\\dfrac{\\pi}{3}+\\pi k$; $\\operatorname{tg}x=\\dfrac{\\sqrt{3}}{3}$: $x=\\dfrac{\\pi}{6}+\\pi k$.',
    ],
    podskazki: [
      v('Дискриминант $3t^2-4\\sqrt{3}t+3=0$:', ['$12$', '$84$', '$-12$'], 0),
      v('Корни:', ['$\\sqrt{3}$ и $\\dfrac{\\sqrt{3}}{3}$', '$-\\sqrt{3}$ и $-\\dfrac{\\sqrt{3}}{3}$', '$3$ и $1$'], 0),
      v('$\\operatorname{tg} x=\\dfrac{\\sqrt{3}}{3}$ при', ['$x=\\dfrac{\\pi}{6}+\\pi k$', '$x=\\dfrac{\\pi}{3}+\\pi k$', '$x=\\dfrac{\\pi}{6}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-08',
    uravnenie: '2\\cos^2 x+(2-\\sqrt{3})\\cos x-\\sqrt{3}=0',
    f: (x) => 2 * cos(x) ** 2 + (2 - sqrt(3)) * cos(x) - sqrt(3),
    serii: [s(u(1, 6)), s(u(-1, 6)), s(u(1))],
    promezhutok: otrezok(u(-5, 2), u(-1)),
    otbor: 'nerav',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\cos x$, $|t|\\le 1$: $2t^2+(2-\\sqrt{3})t-\\sqrt{3}=0$.',
      'Подбором: $t=-1$ — корень ($2-2+\\sqrt{3}-\\sqrt{3}=0$). По Виета произведение корней $-\\dfrac{\\sqrt{3}}{2}$, значит второй корень $t=\\dfrac{\\sqrt{3}}{2}$.',
      '$\\cos x=-1$: $x=\\pi+2\\pi k$; $\\cos x=\\dfrac{\\sqrt{3}}{2}$: $x=\\pm\\dfrac{\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Проверьте $t=-1$: это корень $2t^2+(2-\\sqrt{3})t-\\sqrt{3}=0$?', ['Да', 'Нет'], 0),
      v('Второй корень по теореме Виета:', ['$\\dfrac{\\sqrt{3}}{2}$', '$-\\dfrac{\\sqrt{3}}{2}$', '$\\sqrt{3}$'], 0, 'Произведение корней $\\dfrac{-\\sqrt{3}}{2}$, один из них $-1$.'),
      v('Решения $\\cos x=\\dfrac{\\sqrt{3}}{2}$:', ['$\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$\\dfrac{\\pi}{6}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z10-09',
    uravnenie: '3\\operatorname{ctg}^2 x-2\\sqrt{3}\\operatorname{ctg} x-3=0',
    f: (x) => 3 * ctg(x) ** 2 - 2 * sqrt(3) * ctg(x) - 3,
    odz: (x) => Math.abs(sin(x)) > 1e-6,
    serii: [s(u(1, 6), 1), s(u(2, 3), 1)],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\operatorname{ctg} x$ (котангенс — любое число): $3t^2-2\\sqrt{3}t-3=0$.',
      '$D=12+36=48$, $\\sqrt{D}=4\\sqrt{3}$; $t=\\dfrac{2\\sqrt{3}\\pm4\\sqrt{3}}{6}$: $t=\\sqrt{3}$ или $t=-\\dfrac{\\sqrt{3}}{3}$.',
      '$\\operatorname{ctg}x=\\sqrt{3}$: $x=\\dfrac{\\pi}{6}+\\pi k$; $\\operatorname{ctg}x=-\\dfrac{\\sqrt{3}}{3}$: $x=\\dfrac{2\\pi}{3}+\\pi k$.',
    ],
    podskazki: [
      v('Корни $3t^2-2\\sqrt{3}t-3=0$:', ['$\\sqrt{3}$ и $-\\dfrac{\\sqrt{3}}{3}$', '$-\\sqrt{3}$ и $\\dfrac{\\sqrt{3}}{3}$', '$1$ и $-1$'], 0),
      v('$\\operatorname{ctg}x=-\\dfrac{\\sqrt{3}}{3}$ при', ['$x=\\dfrac{2\\pi}{3}+\\pi k$', '$x=-\\dfrac{\\pi}{6}+\\pi k$', '$x=\\dfrac{5\\pi}{6}+\\pi k$'], 0, 'На оси котангенсов отмечаем $-\\dfrac{\\sqrt{3}}{3}$: луч из центра идёт в точку $\\dfrac{2\\pi}{3}$.'),
    ],
  }),
  ur({
    id: 'z10-10',
    uravnenie: '4\\sin^4 x-5\\sin^2 x+1=0',
    f: (x) => 4 * sin(x) ** 4 - 5 * sin(x) ** 2 + 1,
    serii: [s(u(1, 2), 1), s(u(1, 6), 1), s(u(-1, 6), 1)],
    promezhutok: otrezok(u(0), u(1)),
    otbor: 'krug',
    metody: ['zamena'],
    reshenie: [
      'Замена $t=\\sin^2 x$, теперь $0\\le t\\le 1$: $4t^2-5t+1=0$, корни $t=1$ и $t=\\dfrac{1}{4}$ — оба подходят.',
      '$\\sin^2x=1$, то есть $\\sin x=\\pm1$: точки $\\dfrac{\\pi}{2}$ и $-\\dfrac{\\pi}{2}$ диаметрально противоположны, серия $x=\\dfrac{\\pi}{2}+\\pi k$.',
      '$\\sin^2x=\\dfrac{1}{4}$, то есть $\\sin x=\\pm\\dfrac{1}{2}$: четыре точки $\\pm\\dfrac{\\pi}{6}$, $\\pm\\dfrac{5\\pi}{6}$. Противоположные объединяем: $x=\\pm\\dfrac{\\pi}{6}+\\pi k$.',
    ],
    podskazki: [
      v('Какая замена здесь удобна?', ['$t=\\sin^2 x$', '$t=\\sin x$', '$t=\\sin^4 x$'], 0),
      v('В каких пределах $t=\\sin^2 x$?', ['$0\\le t\\le 1$', '$-1\\le t\\le 1$', 'любое $t$'], 0),
      v('Сколько точек на окружности даёт $\\sin^2 x=\\dfrac{1}{4}$?', ['Четыре', 'Две', 'Одну'], 0, 'Это $\\sin x=\\dfrac{1}{2}$ и $\\sin x=-\\dfrac{1}{2}$.'),
    ],
  }),
];
