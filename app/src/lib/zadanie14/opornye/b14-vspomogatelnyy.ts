/**
 * Блок 14 «Вспомогательный угол»: $a\sin x+b\cos x=c$ — делим на
 * $\sqrt{a^2+b^2}$ и сворачиваем левую часть в синус (косинус) суммы.
 * Первая задача — с полным разбором, остальные — с подсказками.
 */

import { cos, otrezok, promezhutok, s, sin, sqrt, u, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

export const ZADACHI_14: Zadacha14[] = [
  ur({
    id: 'z14-01',
    iz: 'авторская',
    uravnenie: '\\sqrt{3}\\sin x+\\cos x=2',
    f: (x) => sqrt(3) * sin(x) + cos(x) - 2,
    serii: [s(u(1, 3))],
    promezhutok: otrezok(u(-2), u(1)),
    otbor: 'nerav',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Слева — синус и косинус в первой степени с разными коэффициентами $a=\\sqrt{3}$ и $b=1$, справа — число. Выразить одну функцию через другую не получится, поэтому сворачиваем левую часть в одну функцию. Для этого делим обе части на $\\sqrt{a^2+b^2}=\\sqrt{3+1}=2$.',
      'Получаем $\\dfrac{\\sqrt{3}}{2}\\sin x+\\dfrac{1}{2}\\cos x=1$. Почему делим именно на $\\sqrt{a^2+b^2}$: после деления сумма квадратов коэффициентов равна единице, $\\left(\\dfrac{\\sqrt{3}}{2}\\right)^2+\\left(\\dfrac{1}{2}\\right)^2=\\dfrac{3}{4}+\\dfrac{1}{4}=1$. Значит, точка $\\left(\\dfrac{\\sqrt{3}}{2};\\,\\dfrac{1}{2}\\right)$ лежит на единичной окружности, и её координаты — косинус и синус одного и того же угла.',
      'Здесь этот угол табличный: $\\dfrac{\\sqrt{3}}{2}=\\cos\\dfrac{\\pi}{6}$, $\\dfrac{1}{2}=\\sin\\dfrac{\\pi}{6}$. Подставляем: $\\sin x\\cos\\dfrac{\\pi}{6}+\\cos x\\sin\\dfrac{\\pi}{6}=1$.',
      'Слева — формула синуса суммы $\\sin(\\alpha+\\beta)=\\sin\\alpha\\cos\\beta+\\cos\\alpha\\sin\\beta$ при $\\alpha=x$, $\\beta=\\dfrac{\\pi}{6}$. Сворачиваем: $\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=1$.',
      'Получилось простейшее уравнение. Синус равен $1$ только в верхней точке окружности: $x+\\dfrac{\\pi}{6}=\\dfrac{\\pi}{2}+2\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Проверка: $\\sqrt{3}\\sin\\dfrac{\\pi}{3}+\\cos\\dfrac{\\pi}{3}=\\dfrac{3}{2}+\\dfrac{1}{2}=2$ — верно. Заметь: справа после деления стоит $\\dfrac{c}{\\sqrt{a^2+b^2}}$. Если это число по модулю больше $1$, корней нет: левая часть не бывает больше $\\sqrt{a^2+b^2}$.',
    ],
    podskazki: [
      v(
        'На какое число делим обе части?',
        ['$2$', '$4$', '$\\sqrt{3}+1$'],
        0,
        '$\\sqrt{a^2+b^2}=\\sqrt{(\\sqrt{3})^2+1^2}=\\sqrt{4}=2$.',
      ),
      v(
        'Коэффициенты $\\dfrac{\\sqrt{3}}{2}$ и $\\dfrac{1}{2}$ — это',
        [
          '$\\cos\\dfrac{\\pi}{6}$ и $\\sin\\dfrac{\\pi}{6}$',
          '$\\cos\\dfrac{\\pi}{3}$ и $\\sin\\dfrac{\\pi}{3}$',
          '$\\cos\\dfrac{\\pi}{4}$ и $\\sin\\dfrac{\\pi}{4}$',
        ],
        0,
      ),
      v(
        'Во что сворачивается левая часть?',
        [
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)$',
          '$\\cos\\left(x+\\dfrac{\\pi}{6}\\right)$',
          '$\\sin\\left(x-\\dfrac{\\pi}{6}\\right)$',
        ],
        0,
        'Синус суммы: $\\sin x\\cos\\beta+\\cos x\\sin\\beta=\\sin(x+\\beta)$.',
      ),
      v(
        'Решения $\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=1$:',
        [
          '$x=\\dfrac{\\pi}{3}+2\\pi k$',
          '$x=\\dfrac{\\pi}{3}+\\pi k$',
          '$x=\\dfrac{2\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $[-2\\pi;\\,\\pi]$?',
        ['Два', 'Три', 'Один'],
        0,
        'Это $-\\dfrac{5\\pi}{3}$ и $\\dfrac{\\pi}{3}$.',
      ),
    ],
  }),
  ur({
    id: 'z14-02',
    iz: 'сторонний задачник, B48',
    uravnenie: '\\dfrac{\\sqrt{2}}{2}\\sin x-\\dfrac{\\sqrt{2}}{2}\\cos x=1',
    f: (x) => (sqrt(2) / 2) * (sin(x) - cos(x)) - 1,
    serii: [s(u(3, 4))],
    promezhutok: otrezok(u(-3, 2), u(3, 2)),
    otbor: 'krug',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делить не нужно: $\\left(\\dfrac{\\sqrt{2}}{2}\\right)^2+\\left(\\dfrac{\\sqrt{2}}{2}\\right)^2=1$, коэффициенты уже косинус и синус одного угла: $\\dfrac{\\sqrt{2}}{2}=\\cos\\dfrac{\\pi}{4}=\\sin\\dfrac{\\pi}{4}$.',
      '$\\sin x\\cos\\dfrac{\\pi}{4}-\\cos x\\sin\\dfrac{\\pi}{4}=1$ — синус разности: $\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=1$.',
      '$x-\\dfrac{\\pi}{4}=\\dfrac{\\pi}{2}+2\\pi k\\Leftrightarrow x=\\dfrac{3\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Нужно ли делить на $\\sqrt{a^2+b^2}$?',
        ['Нет, оно уже равно $1$', 'Да, на $\\sqrt{2}$', 'Да, на $2$'],
        0,
      ),
      v(
        'Левая часть равна',
        [
          '$\\sin\\left(x-\\dfrac{\\pi}{4}\\right)$',
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)$',
          '$\\cos\\left(x-\\dfrac{\\pi}{4}\\right)$',
        ],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=\\dfrac{3\\pi}{4}+2\\pi k$',
          '$x=\\dfrac{\\pi}{4}+2\\pi k$',
          '$x=-\\dfrac{\\pi}{4}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-03',
    iz: 'сторонний задачник, B49',
    uravnenie: '\\dfrac{\\sqrt{3}}{2}\\cos x-\\dfrac{1}{2}\\sin x=1',
    f: (x) => (sqrt(3) / 2) * cos(x) - sin(x) / 2 - 1,
    serii: [s(u(-1, 6))],
    promezhutok: otrezok(u(-5, 2), u(1, 2)),
    otbor: 'nerav',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Сумма квадратов коэффициентов $\\dfrac{3}{4}+\\dfrac{1}{4}=1$ — делить не нужно: $\\dfrac{\\sqrt{3}}{2}=\\cos\\dfrac{\\pi}{6}$, $\\dfrac{1}{2}=\\sin\\dfrac{\\pi}{6}$.',
      '$\\cos x\\cos\\dfrac{\\pi}{6}-\\sin x\\sin\\dfrac{\\pi}{6}=1$ — косинус суммы: $\\cos\\left(x+\\dfrac{\\pi}{6}\\right)=1$.',
      '$x+\\dfrac{\\pi}{6}=2\\pi k\\Leftrightarrow x=-\\dfrac{\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какую формулу узнаём слева?',
        ['Косинус суммы', 'Синус суммы', 'Косинус разности'],
        0,
        '$\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta=\\cos(\\alpha+\\beta)$.',
      ),
      v(
        'Уравнение сворачивается в',
        [
          '$\\cos\\left(x+\\dfrac{\\pi}{6}\\right)=1$',
          '$\\cos\\left(x-\\dfrac{\\pi}{6}\\right)=1$',
          '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=1$',
        ],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=-\\dfrac{\\pi}{6}+2\\pi k$',
          '$x=\\dfrac{\\pi}{6}+2\\pi k$',
          '$x=-\\dfrac{\\pi}{6}+\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-04',
    iz: 'сторонний задачник, B50',
    uravnenie: '\\sin x+\\sqrt{3}\\cos x=1',
    f: (x) => sin(x) + sqrt(3) * cos(x) - 1,
    serii: [s(u(-1, 6)), s(u(1, 2))],
    promezhutok: otrezok(u(1), u(3)),
    otbor: 'krug',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делим на $\\sqrt{1+3}=2$: $\\dfrac{1}{2}\\sin x+\\dfrac{\\sqrt{3}}{2}\\cos x=\\dfrac{1}{2}$, где $\\dfrac{1}{2}=\\cos\\dfrac{\\pi}{3}$, $\\dfrac{\\sqrt{3}}{2}=\\sin\\dfrac{\\pi}{3}$.',
      'Синус суммы: $\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$.',
      '$x+\\dfrac{\\pi}{3}=\\dfrac{\\pi}{6}+2\\pi k$ или $x+\\dfrac{\\pi}{3}=\\dfrac{5\\pi}{6}+2\\pi k$, откуда $x=-\\dfrac{\\pi}{6}+2\\pi k$ или $x=\\dfrac{\\pi}{2}+2\\pi k$.',
    ],
    podskazki: [
      v('На что делим?', ['$2$', '$4$', '$\\sqrt{3}$'], 0),
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
          '$\\cos\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$',
        ],
        0,
        '$\\dfrac{1}{2}=\\cos\\dfrac{\\pi}{3}$ стоит при $\\sin x$.',
      ),
      v(
        'Чему равен $x+\\dfrac{\\pi}{3}$?',
        [
          '$\\dfrac{\\pi}{6}+2\\pi k$ или $\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{6}+\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$-\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{\\pi}{2}+2\\pi k$',
          '$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{\\pi}{2}+2\\pi k$',
          '$-\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{7\\pi}{6}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-05',
    iz: 'авторская',
    uravnenie: '\\sin x+\\cos x=\\sqrt{2}',
    f: (x) => sin(x) + cos(x) - sqrt(2),
    serii: [s(u(1, 4))],
    promezhutok: otrezok(u(-4), u(-1)),
    otbor: 'nerav',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делим на $\\sqrt{1+1}=\\sqrt{2}$: $\\dfrac{\\sqrt{2}}{2}\\sin x+\\dfrac{\\sqrt{2}}{2}\\cos x=1$.',
      '$\\dfrac{\\sqrt{2}}{2}=\\cos\\dfrac{\\pi}{4}=\\sin\\dfrac{\\pi}{4}$, синус суммы: $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=1$.',
      '$x+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{2}+2\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v('На что делим?', ['$\\sqrt{2}$', '$2$', '$\\dfrac{\\sqrt{2}}{2}$'], 0),
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=1$',
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$',
          '$\\cos\\left(x+\\dfrac{\\pi}{4}\\right)=1$',
        ],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=\\dfrac{\\pi}{4}+2\\pi k$',
          '$x=\\dfrac{\\pi}{4}+\\pi k$',
          '$x=\\dfrac{3\\pi}{4}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-06',
    iz: 'авторская',
    uravnenie: '\\sqrt{3}\\cos x-\\sin x=1',
    f: (x) => sqrt(3) * cos(x) - sin(x) - 1,
    serii: [s(u(1, 6)), s(u(-1, 2))],
    promezhutok: promezhutok(otrezok(u(-1), u(2)), [false, true]),
    otbor: 'krug',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делим на $\\sqrt{3+1}=2$: $\\dfrac{\\sqrt{3}}{2}\\cos x-\\dfrac{1}{2}\\sin x=\\dfrac{1}{2}$.',
      'Здесь удобнее косинус суммы: $\\cos x\\cos\\dfrac{\\pi}{6}-\\sin x\\sin\\dfrac{\\pi}{6}=\\cos\\left(x+\\dfrac{\\pi}{6}\\right)$. Получаем $\\cos\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$.',
      '$x+\\dfrac{\\pi}{6}=\\pm\\dfrac{\\pi}{3}+2\\pi k$: $x=\\dfrac{\\pi}{6}+2\\pi k$ или $x=-\\dfrac{\\pi}{2}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'В какую функцию удобно свернуть $\\dfrac{\\sqrt{3}}{2}\\cos x-\\dfrac{1}{2}\\sin x$?',
        [
          '$\\cos\\left(x+\\dfrac{\\pi}{6}\\right)$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)$',
          '$\\cos\\left(x-\\dfrac{\\pi}{6}\\right)$',
        ],
        0,
        'Знак «минус» между произведениями — косинус суммы.',
      ),
      v(
        'Решения $\\cos\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$ для $x+\\dfrac{\\pi}{6}$:',
        [
          '$\\pm\\dfrac{\\pi}{3}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{3}+\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\dfrac{\\pi}{6}+2\\pi k$ и $-\\dfrac{\\pi}{2}+2\\pi k$',
          '$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{\\pi}{2}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-07',
    iz: 'авторская',
    uravnenie: '\\cos x-\\sqrt{3}\\sin x=-1',
    f: (x) => cos(x) - sqrt(3) * sin(x) + 1,
    serii: [s(u(1, 3)), s(u(1))],
    promezhutok: otrezok(u(2), u(7, 2)),
    otbor: 'nerav',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делим на $2$: $\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x=-\\dfrac{1}{2}$, где $\\dfrac{1}{2}=\\cos\\dfrac{\\pi}{3}$, $\\dfrac{\\sqrt{3}}{2}=\\sin\\dfrac{\\pi}{3}$.',
      'Косинус суммы: $\\cos\\left(x+\\dfrac{\\pi}{3}\\right)=-\\dfrac{1}{2}$.',
      '$x+\\dfrac{\\pi}{3}=\\pm\\dfrac{2\\pi}{3}+2\\pi k$: $x=\\dfrac{\\pi}{3}+2\\pi k$ или $x=-\\pi+2\\pi k$, то есть $x=\\pi+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Уравнение после деления на $2$ и свёртки:',
        [
          '$\\cos\\left(x+\\dfrac{\\pi}{3}\\right)=-\\dfrac{1}{2}$',
          '$\\cos\\left(x-\\dfrac{\\pi}{3}\\right)=-\\dfrac{1}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=-\\dfrac{1}{2}$',
        ],
        0,
      ),
      v(
        '$x+\\dfrac{\\pi}{3}$ равно',
        [
          '$\\pm\\dfrac{2\\pi}{3}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{3}+2\\pi k$',
          '$-\\dfrac{\\pi}{6}+2\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\dfrac{\\pi}{3}+2\\pi k$ и $\\pi+2\\pi k$',
          '$\\dfrac{\\pi}{3}+2\\pi k$ и $-\\dfrac{\\pi}{3}+2\\pi k$',
          '$\\pi+2\\pi k$',
        ],
        0,
        'Из $-\\dfrac{2\\pi}{3}-\\dfrac{\\pi}{3}=-\\pi$, а $-\\pi$ и $\\pi$ — одна точка.',
      ),
    ],
  }),
  ur({
    id: 'z14-08',
    iz: 'авторская',
    uravnenie: '\\sin x-\\sqrt{3}\\cos x=\\sqrt{3}',
    f: (x) => sin(x) - sqrt(3) * cos(x) - sqrt(3),
    serii: [s(u(2, 3)), s(u(1))],
    promezhutok: otrezok(u(-3), u(-1)),
    otbor: 'krug',
    metody: ['vspomogatelnyy'],
    reshenie: [
      'Делим на $2$: $\\dfrac{1}{2}\\sin x-\\dfrac{\\sqrt{3}}{2}\\cos x=\\dfrac{\\sqrt{3}}{2}$.',
      '$\\sin x\\cos\\dfrac{\\pi}{3}-\\cos x\\sin\\dfrac{\\pi}{3}=\\sin\\left(x-\\dfrac{\\pi}{3}\\right)$, получаем $\\sin\\left(x-\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$.',
      '$x-\\dfrac{\\pi}{3}=\\dfrac{\\pi}{3}+2\\pi k$ или $x-\\dfrac{\\pi}{3}=\\dfrac{2\\pi}{3}+2\\pi k$: $x=\\dfrac{2\\pi}{3}+2\\pi k$ или $x=\\pi+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x-\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$',
          '$\\cos\\left(x-\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$',
        ],
        0,
      ),
      v(
        '$x-\\dfrac{\\pi}{3}$ равно',
        [
          '$\\dfrac{\\pi}{3}+2\\pi k$ или $\\dfrac{2\\pi}{3}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{3}+\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\dfrac{2\\pi}{3}+2\\pi k$ и $\\pi+2\\pi k$',
          '$2\\pi k$ и $\\dfrac{\\pi}{3}+2\\pi k$',
          '$\\dfrac{2\\pi}{3}+2\\pi k$ и $\\dfrac{\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $[-3\\pi;\\,-\\pi]$?',
        ['Три', 'Два', 'Один'],
        0,
        'Это $-3\\pi$, $-\\dfrac{4\\pi}{3}$ и $-\\pi$: оба конца — корни.',
      ),
    ],
  }),
  ur({
    id: 'z14-09',
    iz: 'авторская',
    uravnenie: '\\sqrt{2}\\sin x+\\sqrt{2}\\cos x=1',
    f: (x) => sqrt(2) * (sin(x) + cos(x)) - 1,
    serii: [s(u(-1, 12)), s(u(7, 12))],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'nerav',
    metody: ['vspomogatelnyy'],
    reshenie: [
      '$\\sqrt{a^2+b^2}=\\sqrt{2+2}=2$, делим: $\\dfrac{\\sqrt{2}}{2}\\sin x+\\dfrac{\\sqrt{2}}{2}\\cos x=\\dfrac{1}{2}$.',
      'Синус суммы с углом $\\dfrac{\\pi}{4}$: $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{1}{2}$.',
      '$x+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{6}+2\\pi k$ или $x+\\dfrac{\\pi}{4}=\\dfrac{5\\pi}{6}+2\\pi k$. Вычитаем $\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{12}$: $x=-\\dfrac{\\pi}{12}+2\\pi k$ или $x=\\dfrac{7\\pi}{12}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'На что делим?',
        ['$2$', '$\\sqrt{2}$', '$4$'],
        0,
        '$\\sqrt{(\\sqrt{2})^2+(\\sqrt{2})^2}=\\sqrt{4}$.',
      ),
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{1}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
        ],
        0,
      ),
      v(
        '$\\dfrac{5\\pi}{6}-\\dfrac{\\pi}{4}=$',
        ['$\\dfrac{7\\pi}{12}$', '$\\dfrac{\\pi}{2}$', '$\\dfrac{11\\pi}{12}$'],
        0,
        '$\\dfrac{10\\pi}{12}-\\dfrac{3\\pi}{12}=\\dfrac{7\\pi}{12}$.',
      ),
      v(
        'Серии для $x$:',
        [
          '$-\\dfrac{\\pi}{12}+2\\pi k$ и $\\dfrac{7\\pi}{12}+2\\pi k$',
          '$\\dfrac{\\pi}{12}+2\\pi k$ и $\\dfrac{7\\pi}{12}+2\\pi k$',
          '$-\\dfrac{\\pi}{12}+\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z14-10',
    iz: 'авторская',
    uravnenie: '\\sqrt{3}\\sin 2x+\\cos 2x=1',
    f: (x) => sqrt(3) * sin(2 * x) + cos(2 * x) - 1,
    serii: [s(u(0), 1), s(u(1, 3), 1)],
    promezhutok: otrezok(u(3, 2), u(3)),
    otbor: 'krug',
    metody: ['vspomogatelnyy', 'argument'],
    reshenie: [
      'Аргумент у синуса и косинуса один и тот же — $2x$, поэтому вспомогательный угол работает так же. Делим на $2$: $\\dfrac{\\sqrt{3}}{2}\\sin 2x+\\dfrac{1}{2}\\cos 2x=\\dfrac{1}{2}$.',
      'Синус суммы: $\\sin\\left(2x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$.',
      '$2x+\\dfrac{\\pi}{6}=\\dfrac{\\pi}{6}+2\\pi k\\Leftrightarrow 2x=2\\pi k\\Leftrightarrow x=\\pi k$.',
      '$2x+\\dfrac{\\pi}{6}=\\dfrac{5\\pi}{6}+2\\pi k\\Leftrightarrow 2x=\\dfrac{2\\pi}{3}+2\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{3}+\\pi k$. Период делится на $2$ вместе с углом.',
    ],
    podskazki: [
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(2x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
          '$\\sin\\left(2x+\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$',
        ],
        0,
      ),
      v(
        'Серии для $2x$:',
        [
          '$2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$',
          '$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\pi k$ и $\\dfrac{\\pi}{3}+\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\pi k$ и $\\dfrac{\\pi}{3}+\\pi k$',
          '$2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$',
          '$\\dfrac{\\pi k}{2}$ и $\\dfrac{\\pi}{3}+\\dfrac{\\pi k}{2}$',
        ],
        0,
        'Делим на $2$ и начало серии, и период.',
      ),
    ],
  }),
];
