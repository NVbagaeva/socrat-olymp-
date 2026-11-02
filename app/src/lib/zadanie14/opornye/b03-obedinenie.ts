/**
 * Блок 03 «Объединение серий»: несколько точек окружности — одной
 * серией. Первая задача — с полным разбором (промежуток б свой),
 * остальные — свои, с подсказками. Серии в данных — уже объединённые.
 */

import { cos, otrezok, promezhutok, s, sin, tg, u, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const SHAG = ['$\\pi$', '$\\dfrac{\\pi}{2}$', '$2\\pi$'];

export const ZADACHI_03: Zadacha14[] = [
  ur({
    id: 'z03-01',
    iz: 'авторская',
    uravnenie: '\\cos 2x+\\sin^2 x=0{,}5',
    f: (x) => cos(2 * x) + sin(x) ** 2 - 0.5,
    serii: [s(u(1, 4), 1, 2)],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'krug',
    metody: ['obedinenie', 'dvoynoy'],
    reshenie: [
      'В уравнении есть $\\cos 2x$ и $\\sin^2x$. Чтобы осталась одна функция, раскроем косинус двойного угла так, чтобы $\\sin^2 x$ сократился: $\\cos 2x=\\cos^2x-\\sin^2x$.',
      'Получаем $\\cos^2x-\\sin^2x+\\sin^2x=\\dfrac{1}{2}\\ \\Leftrightarrow\\ \\cos^2x=\\dfrac{1}{2}$.',
      'Извлекаем корень с обоими знаками: $\\cos^2x=\\dfrac{1}{2}\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&\\cos x=\\dfrac{\\sqrt{2}}{2},\\\\&\\cos x=-\\dfrac{\\sqrt{2}}{2}.\\end{aligned}\\right.$',
      'Первое уравнение даёт точки $\\dfrac{\\pi}{4}$ и $-\\dfrac{\\pi}{4}$, второе — $\\dfrac{3\\pi}{4}$ и $-\\dfrac{3\\pi}{4}$. Можно записать четыре серии с шагом $2\\pi$, но посмотрим на окружность.',
      'Отмечаем точки: $\\dfrac{\\pi}{4},\\ \\dfrac{3\\pi}{4},\\ \\dfrac{5\\pi}{4},\\ \\dfrac{7\\pi}{4}$ (это $-\\dfrac{3\\pi}{4}$ и $-\\dfrac{\\pi}{4}$ плюс оборот). Соседние отстоят ровно на $\\dfrac{\\pi}{2}$ — четверть оборота: это вершины квадрата.',
      'Значит, начав с $\\dfrac{\\pi}{4}$ и шагая по $\\dfrac{\\pi}{2}$, мы обойдём все четыре точки и только их. Все серии объединяются в одну: $x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какую формулу $\\cos 2x$ взять?', ['$\\cos^2x-\\sin^2x$', '$1-2\\sin^2x$', '$2\\cos^2x-1$'], 0, 'Тогда $\\sin^2x$ сокращается. Другие формулы тоже приводят к ответу, но длиннее.'),
      v('Что получилось после упрощения?', ['$\\cos^2x=\\dfrac{1}{2}$', '$\\cos x=\\dfrac{1}{2}$', '$\\sin^2x=\\dfrac{1}{2}$'], 0),
      v('Сколько точек на окружности?', ['Четыре', 'Две', 'Одна'], 0, '$\\cos x=\\dfrac{\\sqrt{2}}{2}$ и $\\cos x=-\\dfrac{\\sqrt{2}}{2}$ — по две точки.'),
      v('С каким шагом идут эти точки?', SHAG, 1),
    ],
  }),
  ur({
    id: 'z03-02',
    iz: 'авторская',
    uravnenie: '\\sin^2x=\\dfrac{3}{4}',
    f: (x) => sin(x) ** 2 - 0.75,
    serii: [s(u(1, 3), 1), s(u(-1, 3), 1)],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['obedinenie'],
    reshenie: [
      '$\\sin^2x=\\dfrac{3}{4}\\ \\Leftrightarrow\\ \\sin x=\\pm\\dfrac{\\sqrt{3}}{2}$: точки $\\dfrac{\\pi}{3},\\ \\dfrac{2\\pi}{3},\\ -\\dfrac{\\pi}{3},\\ -\\dfrac{2\\pi}{3}$.',
      'Точки $\\dfrac{\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$ диаметрально противоположны (разность $\\pi$) — серия $x=\\dfrac{\\pi}{3}+\\pi k$. Так же $-\\dfrac{\\pi}{3}$ и $\\dfrac{2\\pi}{3}$ — серия $x=-\\dfrac{\\pi}{3}+\\pi k$.',
      'Шагом $\\dfrac{\\pi}{2}$ их не объединить: расстояния между соседними точками разные ($\\dfrac{\\pi}{3}$ и $\\dfrac{2\\pi}{3}$). Итог: $x=\\pm\\dfrac{\\pi}{3}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Сколько точек даёт $\\sin^2x=\\dfrac{3}{4}$?', ['Четыре', 'Две', 'Три'], 0),
      v('Какая точка противоположна $\\dfrac{\\pi}{3}$?', ['$-\\dfrac{2\\pi}{3}$', '$\\dfrac{2\\pi}{3}$', '$-\\dfrac{\\pi}{3}$'], 0),
      v('Ответ:', ['$x=\\pm\\dfrac{\\pi}{3}+\\pi k$', '$x=\\dfrac{\\pi}{3}+\\dfrac{\\pi k}{2}$', '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$'], 0, 'Запись $\\pm\\dfrac{\\pi}{3}+2\\pi k$ теряет точки $\\pm\\dfrac{2\\pi}{3}$.'),
    ],
  }),
  ur({
    id: 'z03-03',
    iz: 'авторская',
    uravnenie: '\\operatorname{tg}^2x=1',
    f: (x) => tg(x) ** 2 - 1,
    odz: (x) => Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1, 4), 1, 2)],
    promezhutok: otrezok(u(-1, 2), u(1)),
    otbor: 'nerav',
    metody: ['obedinenie'],
    reshenie: [
      '$\\operatorname{tg}^2x=1\\ \\Leftrightarrow\\ \\operatorname{tg}x=\\pm1$: $x=\\dfrac{\\pi}{4}+\\pi k$ или $x=-\\dfrac{\\pi}{4}+\\pi k$.',
      'На окружности это четыре точки $\\pm\\dfrac{\\pi}{4},\\ \\pm\\dfrac{3\\pi}{4}$ — через четверть оборота. Объединяем: $x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('$\\operatorname{tg}^2x=1$ равносильно', ['$\\operatorname{tg}x=\\pm1$', '$\\operatorname{tg}x=1$', '$\\operatorname{tg}x=\\pm\\dfrac{1}{2}$'], 0),
      v('Расстояние между соседними точками:', SHAG, 1),
      v('Ответ:', ['$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$', '$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z03-04',
    iz: 'авторская',
    uravnenie: '\\cos^2x=\\dfrac{1}{4}',
    f: (x) => cos(x) ** 2 - 0.25,
    serii: [s(u(1, 3), 1), s(u(-1, 3), 1)],
    promezhutok: otrezok(u(2), u(7, 2)),
    otbor: 'krug',
    metody: ['obedinenie'],
    reshenie: [
      '$\\cos x=\\dfrac{1}{2}$ или $\\cos x=-\\dfrac{1}{2}$: точки $\\pm\\dfrac{\\pi}{3}$ и $\\pm\\dfrac{2\\pi}{3}$.',
      'Противоположные пары: $\\dfrac{\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$, $-\\dfrac{\\pi}{3}$ и $\\dfrac{2\\pi}{3}$. Каждая пара — серия с шагом $\\pi$: $x=\\pm\\dfrac{\\pi}{3}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('$\\cos^2x=\\dfrac{1}{4}$ равносильно', ['$\\cos x=\\pm\\dfrac{1}{2}$', '$\\cos x=\\dfrac{1}{2}$', '$\\cos x=\\pm\\dfrac{1}{4}$'], 0),
      v('Какая точка противоположна $-\\dfrac{\\pi}{3}$?', ['$\\dfrac{2\\pi}{3}$', '$\\dfrac{\\pi}{3}$', '$-\\dfrac{2\\pi}{3}$'], 0),
      v('Ответ:', ['$x=\\pm\\dfrac{\\pi}{3}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$x=\\dfrac{\\pi}{3}+\\dfrac{\\pi k}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z03-05',
    iz: 'авторская',
    uravnenie: '\\sin x\\cos x=0',
    f: (x) => sin(x) * cos(x),
    serii: [s(u(0), 1, 2)],
    promezhutok: promezhutok(otrezok(u(-3, 2), u(0)), [true, false]),
    otbor: 'nerav',
    metody: ['obedinenie'],
    reshenie: [
      'Произведение равно нулю, когда хотя бы один множитель равен нулю: $\\left[\\begin{aligned}&\\sin x=0,\\\\&\\cos x=0.\\end{aligned}\\right.$',
      '$\\sin x=0$ — правая и левая точки, $\\cos x=0$ — верхняя и нижняя. Вместе это четыре точки через $\\dfrac{\\pi}{2}$: $x=\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Как решать произведение, равное нулю?', ['Каждый множитель приравнять к нулю', 'Разделить на $\\cos x$', 'Возвести в квадрат'], 0, 'Делить на $\\cos x$ нельзя: потеряется серия $\\cos x=0$.'),
      v('Ответ:', ['$x=\\dfrac{\\pi k}{2}$', '$x=\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$'], 0),
      v('Входит ли $0$ в промежуток $\\left[-\\dfrac{3\\pi}{2};\\,0\\right)$?', ['Нет, скобка круглая', 'Да'], 0),
    ],
  }),
  ur({
    id: 'z03-06',
    iz: 'авторская',
    uravnenie: '\\sin 2x=0',
    f: (x) => sin(2 * x),
    serii: [s(u(0), 1, 2)],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['obedinenie', 'argument'],
    reshenie: [
      '$2x=\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
      'На окружности это четыре точки — правая, верхняя, левая, нижняя: деление периода на $2$ само дало объединённую серию. Это то же, что $2\\sin x\\cos x=0$.',
    ],
    podskazki: [
      v('Решение относительно $2x$:', ['$2x=\\pi k$', '$2x=2\\pi k$', '$2x=\\dfrac{\\pi}{2}+\\pi k$'], 0),
      v('Ответ:', ['$x=\\dfrac{\\pi k}{2}$', '$x=\\pi k$', '$x=2\\pi k$'], 0),
      v('Сколько корней на $\\left[\\dfrac{\\pi}{2};\\,2\\pi\\right]$?', ['Четыре', 'Три', 'Два'], 0, 'Это $\\dfrac{\\pi}{2},\\ \\pi,\\ \\dfrac{3\\pi}{2},\\ 2\\pi$.'),
    ],
  }),
  ur({
    id: 'z03-07',
    iz: 'авторская',
    uravnenie: '\\cos 2x=0',
    f: (x) => cos(2 * x),
    serii: [s(u(1, 4), 1, 2)],
    promezhutok: otrezok(u(-1), u(0)),
    otbor: 'nerav',
    metody: ['obedinenie', 'argument'],
    reshenie: [
      '$2x=\\dfrac{\\pi}{2}+\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
      'Это четыре точки $\\pm\\dfrac{\\pi}{4},\\ \\pm\\dfrac{3\\pi}{4}$ — середины четвертей, через $\\dfrac{\\pi}{2}$ друг от друга.',
    ],
    podskazki: [
      v('Решение относительно $2x$:', ['$2x=\\dfrac{\\pi}{2}+\\pi k$', '$2x=\\pi k$', '$2x=\\dfrac{\\pi}{2}+2\\pi k$'], 0),
      v('Ответ:', ['$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$', '$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\dfrac{\\pi}{2}+\\dfrac{\\pi k}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z03-08',
    iz: 'авторская',
    uravnenie: '4\\sin^2x=1',
    f: (x) => 4 * sin(x) ** 2 - 1,
    serii: [s(u(1, 6), 1), s(u(-1, 6), 1)],
    promezhutok: otrezok(u(-5, 2), u(-1)),
    otbor: 'krug',
    metody: ['obedinenie'],
    reshenie: [
      '$\\sin^2x=\\dfrac{1}{4}\\ \\Leftrightarrow\\ \\sin x=\\pm\\dfrac{1}{2}$: точки $\\dfrac{\\pi}{6},\\ \\dfrac{5\\pi}{6},\\ -\\dfrac{\\pi}{6},\\ -\\dfrac{5\\pi}{6}$.',
      '$\\dfrac{\\pi}{6}$ и $-\\dfrac{5\\pi}{6}$ противоположны, $-\\dfrac{\\pi}{6}$ и $\\dfrac{5\\pi}{6}$ — тоже. Итог: $x=\\pm\\dfrac{\\pi}{6}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Чему равен $\\sin x$?', ['$\\pm\\dfrac{1}{2}$', '$\\dfrac{1}{2}$', '$\\pm\\dfrac{1}{4}$'], 0),
      v('Какая точка противоположна $\\dfrac{\\pi}{6}$?', ['$-\\dfrac{5\\pi}{6}$', '$\\dfrac{5\\pi}{6}$', '$-\\dfrac{\\pi}{6}$'], 0),
      v('Ответ:', ['$x=\\pm\\dfrac{\\pi}{6}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z03-09',
    iz: 'авторская',
    uravnenie: '\\sin^2x=\\cos^2x',
    f: (x) => sin(x) ** 2 - cos(x) ** 2,
    serii: [s(u(1, 4), 1, 2)],
    promezhutok: otrezok(u(3, 2), u(3)),
    otbor: 'nerav',
    metody: ['obedinenie', 'dvoynoy'],
    reshenie: [
      'Переносим всё в одну часть: $\\cos^2x-\\sin^2x=0\\ \\Leftrightarrow\\ \\cos 2x=0$. Делить на $\\cos^2x$ не нужно — формула двойного угла сразу даёт простейшее уравнение.',
      '$2x=\\dfrac{\\pi}{2}+\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$ — четыре точки через четверть оборота.',
    ],
    podskazki: [
      v('Чему равно $\\cos^2x-\\sin^2x$?', ['$\\cos 2x$', '$\\sin 2x$', '$1$'], 0),
      v('Ответ:', ['$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$', '$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$'], 0, 'Запись $\\dfrac{\\pi}{4}+\\pi k$ теряет точки $\\dfrac{3\\pi}{4}$ и $-\\dfrac{\\pi}{4}$.'),
    ],
  }),
  ur({
    id: 'z03-10',
    iz: 'авторская',
    uravnenie: '2\\cos^2x=1+\\cos x',
    f: (x) => 2 * cos(x) ** 2 - 1 - cos(x),
    serii: [s(u(0), 2, 3)],
    promezhutok: otrezok(u(-3), u(-1, 2)),
    otbor: 'krug',
    metody: ['obedinenie', 'zamena'],
    reshenie: [
      '$2\\cos^2x-\\cos x-1=0$, замена $t=\\cos x$: $2t^2-t-1=0$, корни $t=1$ и $t=-\\dfrac{1}{2}$.',
      '$\\cos x=1$ — точка $0$; $\\cos x=-\\dfrac{1}{2}$ — точки $\\dfrac{2\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$.',
      'Три точки $0,\\ \\dfrac{2\\pi}{3},\\ \\dfrac{4\\pi}{3}$ делят окружность на три равные дуги по $\\dfrac{2\\pi}{3}$ — это вершины правильного треугольника. Значит, одна серия: $x=\\dfrac{2\\pi k}{3},\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Корни $2t^2-t-1=0$:', ['$1$ и $-\\dfrac{1}{2}$', '$-1$ и $\\dfrac{1}{2}$', '$1$ и $\\dfrac{1}{2}$'], 0),
      v('Сколько точек на окружности всего?', ['Три', 'Две', 'Четыре'], 0),
      v('Как их записать одной серией?', ['$x=\\dfrac{2\\pi k}{3}$', '$x=\\dfrac{\\pi k}{3}$', '$x=\\pm\\dfrac{2\\pi}{3}+\\pi k$'], 0, 'Соседние точки — через $\\dfrac{2\\pi}{3}$.'),
    ],
  }),
];
