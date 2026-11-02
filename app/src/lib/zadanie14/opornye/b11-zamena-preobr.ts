/**
 * Блок 11 «Замена после преобразований»: сначала оставляем одну функцию —
 * через основное тождество, двойной угол или приведение, — затем замена.
 * Первая задача — с полным разбором, остальные — с подсказками.
 */

import { ARC, PI, cos, ctg, otrezok, s, sin, sqrt, tg, u, ua, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const COS2X = ['$2\\cos^2x-1$', '$1-2\\sin^2x$', '$\\cos^2x-\\sin^2x$'];

export const ZADACHI_11: Zadacha14[] = [
  ur({
    id: 'z11-01',
    iz: 'лист 22, №18',
    uravnenie: '6\\sin^2 x+5\\sin\\left(\\dfrac{\\pi}{2}-x\\right)-2=0',
    f: (x) => 6 * sin(x) ** 2 + 5 * sin(PI / 2 - x) - 2,
    serii: [s(u(2, 3)), s(u(-2, 3))],
    promezhutok: otrezok(u(1, 2), u(3)),
    otbor: 'krug',
    metody: ['zamena-preobr', 'privedenie'],
    reshenie: [
      'В уравнении две разные функции. Сначала упростим $\\sin\\left(\\dfrac{\\pi}{2}-x\\right)$ по формуле приведения: угол $\\dfrac{\\pi}{2}$ отложен по вертикальной оси — синус меняется на косинус. Если $x$ в первой четверти, то $\\dfrac{\\pi}{2}-x$ тоже в первой, синус там положителен — знак «плюс». Итак, $\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=\\cos x$.',
      'Получили $6\\sin^2x+5\\cos x-2=0$ — здесь синус и косинус. Чтобы осталась одна функция, заменим $\\sin^2x$ по основному тождеству: $\\sin^2x=1-\\cos^2x$.',
      '$6(1-\\cos^2x)+5\\cos x-2=0\\Leftrightarrow-6\\cos^2x+5\\cos x+4=0\\Leftrightarrow6\\cos^2x-5\\cos x-4=0$.',
      'Теперь это квадратное уравнение относительно косинуса. Замена $t=\\cos x$, $-1\\le t\\le1$: $6t^2-5t-4=0$, $D=25+96=121$, $t=\\dfrac{5\\pm11}{12}$, то есть $t=\\dfrac{4}{3}$ или $t=-\\dfrac{1}{2}$.',
      'Проверяем $|t|\\le1$: $t=\\dfrac{4}{3}>1$ не подходит — уравнение $\\cos x=\\dfrac{4}{3}$ корней не имеет. Остаётся $\\cos x=-\\dfrac{1}{2}$.',
      'На оси косинусов отмечаем $-\\dfrac{1}{2}$: прямая, параллельная оси синусов, пересекает окружность в точках $\\dfrac{2\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$. Отсюда $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\sin\\left(\\dfrac{\\pi}{2}-x\\right)$?',
        ['$\\cos x$', '$-\\cos x$', '$\\sin x$'],
        0,
      ),
      v(
        'Чем заменить $\\sin^2x$, чтобы осталась одна функция?',
        ['$1-\\cos^2x$', '$\\cos^2x-1$', '$1+\\cos^2x$'],
        0,
      ),
      v(
        'Корни $6t^2-5t-4=0$:',
        [
          '$\\dfrac{4}{3}$ и $-\\dfrac{1}{2}$',
          '$-\\dfrac{4}{3}$ и $\\dfrac{1}{2}$',
          '$1$ и $-\\dfrac{2}{3}$',
        ],
        0,
      ),
      v(
        'Какой корень не подходит?',
        ['$t=\\dfrac{4}{3}$', '$t=-\\dfrac{1}{2}$', 'Подходят оба'],
        0,
        'Косинус не больше $1$.',
      ),
      v(
        'Решения $\\cos x=-\\dfrac{1}{2}$:',
        [
          '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$',
          '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$',
          '$x=-\\dfrac{\\pi}{6}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-02',
    iz: 'лист 22, №17',
    uravnenie: '\\cos 2x=\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)',
    f: (x) => cos(2 * x) - sin((3 * PI) / 2 - x),
    serii: [s(u(1, 3)), s(u(-1, 3)), s(u(1))],
    promezhutok: otrezok(u(-5, 2), u(-1)),
    otbor: 'nerav',
    metody: ['zamena-preobr', 'privedenie', 'dvoynoy'],
    reshenie: [
      'Приведение: $\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)=-\\cos x$ (угол $\\dfrac{3\\pi}{2}$ — синус меняется на косинус; $\\dfrac{3\\pi}{2}-x$ в третьей четверти, синус там отрицателен).',
      'Справа косинус, поэтому и $\\cos 2x$ записываем через косинус: $2\\cos^2x-1=-\\cos x\\Leftrightarrow2\\cos^2x+\\cos x-1=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $2t^2+t-1=0$, $t=\\dfrac{1}{2}$ или $t=-1$ — оба подходят.',
      '$\\cos x=\\dfrac{1}{2}$: $x=\\pm\\dfrac{\\pi}{3}+2\\pi k$; $\\cos x=-1$: $x=\\pi+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)$?',
        ['$-\\cos x$', '$\\cos x$', '$-\\sin x$'],
        0,
      ),
      v('Какую формулу для $\\cos 2x$ выбрать?', COS2X, 0, 'В уравнении остаётся только косинус.'),
      v(
        'Корни $2t^2+t-1=0$:',
        ['$\\dfrac{1}{2}$ и $-1$', '$-\\dfrac{1}{2}$ и $1$', '$1$ и $-2$'],
        0,
      ),
      v(
        'Решения $\\cos x=-1$:',
        ['$x=\\pi+2\\pi k$', '$x=\\pi k$', '$x=-\\dfrac{\\pi}{2}+2\\pi k$'],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-03',
    iz: 'сторонний задачник',
    uravnenie: '2\\sin^2 x+\\cos(-x)-1=0',
    f: (x) => 2 * sin(x) ** 2 + cos(-x) - 1,
    serii: [s(u(0)), s(u(2, 3)), s(u(-2, 3))],
    promezhutok: otrezok(u(0), u(5, 2)),
    otbor: 'krug',
    metody: ['zamena-preobr'],
    reshenie: [
      'Косинус — чётная функция: $\\cos(-x)=\\cos x$. По основному тождеству $\\sin^2x=1-\\cos^2x$.',
      '$2(1-\\cos^2x)+\\cos x-1=0\\Leftrightarrow2\\cos^2x-\\cos x-1=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $2t^2-t-1=0$, $t=1$ или $t=-\\dfrac{1}{2}$.',
      '$\\cos x=1$: $x=2\\pi k$; $\\cos x=-\\dfrac{1}{2}$: $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\cos(-x)$?',
        ['$\\cos x$', '$-\\cos x$', '$\\sin x$'],
        0,
        'Косинус — чётная функция.',
      ),
      v(
        'Уравнение после замены $\\sin^2x=1-\\cos^2x$:',
        ['$2\\cos^2x-\\cos x-1=0$', '$2\\cos^2x+\\cos x-1=0$', '$2\\cos^2x-\\cos x+1=0$'],
        0,
      ),
      v(
        'Корни $2t^2-t-1=0$:',
        ['$1$ и $-\\dfrac{1}{2}$', '$-1$ и $\\dfrac{1}{2}$', '$2$ и $-1$'],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-04',
    iz: 'сторонний задачник',
    uravnenie: '\\cos 2x-5\\sqrt{2}\\cos x-5=0',
    f: (x) => cos(2 * x) - 5 * sqrt(2) * cos(x) - 5,
    serii: [s(u(3, 4)), s(u(-3, 4))],
    promezhutok: otrezok(u(1, 2), u(3)),
    otbor: 'krug',
    metody: ['zamena-preobr', 'dvoynoy'],
    reshenie: [
      '$\\cos 2x=2\\cos^2x-1$: $2\\cos^2x-5\\sqrt{2}\\cos x-6=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $2t^2-5\\sqrt{2}t-6=0$, $D=50+48=98$, $\\sqrt{D}=7\\sqrt{2}$, $t=\\dfrac{5\\sqrt{2}\\pm7\\sqrt{2}}{4}$: $t=3\\sqrt{2}$ или $t=-\\dfrac{\\sqrt{2}}{2}$.',
      '$t=3\\sqrt{2}>1$ не подходит. $\\cos x=-\\dfrac{\\sqrt{2}}{2}$: $x=\\pm\\dfrac{3\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v('Какую формулу для $\\cos 2x$ выбрать?', COS2X, 0),
      v(
        'Корни $2t^2-5\\sqrt{2}t-6=0$:',
        [
          '$3\\sqrt{2}$ и $-\\dfrac{\\sqrt{2}}{2}$',
          '$-3\\sqrt{2}$ и $\\dfrac{\\sqrt{2}}{2}$',
          '$\\sqrt{2}$ и $-3$',
        ],
        0,
      ),
      v(
        'Решения $\\cos x=-\\dfrac{\\sqrt{2}}{2}$:',
        [
          '$x=\\pm\\dfrac{3\\pi}{4}+2\\pi k$',
          '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$',
          '$x=-\\dfrac{\\pi}{4}+\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-05',
    iz: 'сторонний задачник',
    uravnenie: '\\cos 2x+3\\sin x-2=0',
    f: (x) => cos(2 * x) + 3 * sin(x) - 2,
    serii: [s(u(1, 2)), s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['zamena-preobr', 'dvoynoy'],
    reshenie: [
      'Кроме $\\cos 2x$ здесь синус, поэтому $\\cos 2x=1-2\\sin^2x$: $1-2\\sin^2x+3\\sin x-2=0\\Leftrightarrow2\\sin^2x-3\\sin x+1=0$.',
      'Замена $t=\\sin x$, $|t|\\le1$: $2t^2-3t+1=0$, $t=1$ или $t=\\dfrac{1}{2}$.',
      '$\\sin x=1$: $x=\\dfrac{\\pi}{2}+2\\pi k$; $\\sin x=\\dfrac{1}{2}$: $x=\\dfrac{\\pi}{6}+2\\pi k$ или $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какую формулу для $\\cos 2x$ выбрать?',
        COS2X,
        1,
        'В уравнении есть $\\sin x$ — выражаем всё через синус.',
      ),
      v(
        'Корни $2t^2-3t+1=0$:',
        ['$1$ и $\\dfrac{1}{2}$', '$-1$ и $-\\dfrac{1}{2}$', '$2$ и $1$'],
        0,
      ),
      v(
        'Решения $\\sin x=1$:',
        ['$x=\\dfrac{\\pi}{2}+2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=2\\pi k$'],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-06',
    iz: 'сторонний задачник',
    uravnenie: '\\cos 2x-3\\cos x+2=0',
    f: (x) => cos(2 * x) - 3 * cos(x) + 2,
    serii: [s(u(0)), s(u(1, 3)), s(u(-1, 3))],
    promezhutok: otrezok(u(-3), u(-1)),
    otbor: 'krug',
    metody: ['zamena-preobr', 'dvoynoy'],
    reshenie: [
      '$\\cos 2x=2\\cos^2x-1$: $2\\cos^2x-3\\cos x+1=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $2t^2-3t+1=0$, $t=1$ или $t=\\dfrac{1}{2}$.',
      '$\\cos x=1$: $x=2\\pi k$; $\\cos x=\\dfrac{1}{2}$: $x=\\pm\\dfrac{\\pi}{3}+2\\pi k$.',
    ],
    podskazki: [
      v('Какую формулу для $\\cos 2x$ выбрать?', COS2X, 0),
      v(
        'Корни $2t^2-3t+1=0$:',
        ['$1$ и $\\dfrac{1}{2}$', '$-1$ и $-\\dfrac{1}{2}$', '$3$ и $-1$'],
        0,
      ),
      v('Решения $\\cos x=1$:', ['$x=2\\pi k$', '$x=\\pi k$', '$x=\\dfrac{\\pi}{2}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z11-07',
    iz: 'сторонний задачник',
    uravnenie: '2\\cos 2x+4\\sqrt{3}\\cos x-7=0',
    f: (x) => 2 * cos(2 * x) + 4 * sqrt(3) * cos(x) - 7,
    serii: [s(u(1, 6)), s(u(-1, 6))],
    promezhutok: otrezok(u(-1), u(3, 2)),
    otbor: 'nerav',
    metody: ['zamena-preobr', 'dvoynoy'],
    reshenie: [
      '$2\\cos 2x=4\\cos^2x-2$: $4\\cos^2x+4\\sqrt{3}\\cos x-9=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $D=48+144=192$, $\\sqrt{D}=8\\sqrt{3}$, $t=\\dfrac{-4\\sqrt{3}\\pm8\\sqrt{3}}{8}$: $t=\\dfrac{\\sqrt{3}}{2}$ или $t=-\\dfrac{3\\sqrt{3}}{2}$.',
      '$-\\dfrac{3\\sqrt{3}}{2}<-1$ — не подходит. $\\cos x=\\dfrac{\\sqrt{3}}{2}$: $x=\\pm\\dfrac{\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Квадратное уравнение после замены $\\cos 2x=2\\cos^2x-1$:',
        ['$4t^2+4\\sqrt{3}t-9=0$', '$4t^2+4\\sqrt{3}t-8=0$', '$2t^2+4\\sqrt{3}t-8=0$'],
        0,
        'Не забудь умножить на $2$ и единицу: $2(2t^2-1)=4t^2-2$.',
      ),
      v(
        'Корни:',
        [
          '$\\dfrac{\\sqrt{3}}{2}$ и $-\\dfrac{3\\sqrt{3}}{2}$',
          '$-\\dfrac{\\sqrt{3}}{2}$ и $\\dfrac{3\\sqrt{3}}{2}$',
          '$\\sqrt{3}$ и $-\\dfrac{\\sqrt{3}}{2}$',
        ],
        0,
      ),
      v(
        'Какой корень отбрасываем?',
        ['$-\\dfrac{3\\sqrt{3}}{2}$', '$\\dfrac{\\sqrt{3}}{2}$', 'Никакой'],
        0,
        '$\\dfrac{3\\sqrt{3}}{2}\\approx2{,}6>1$.',
      ),
    ],
  }),
  ur({
    id: 'z11-08',
    iz: 'сторонний задачник',
    uravnenie: '4\\operatorname{tg}^2 x+\\dfrac{3}{\\cos x}+3=0',
    f: (x) => 4 * tg(x) ** 2 + 3 / cos(x) + 3,
    odz: (x) => Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1))],
    promezhutok: otrezok(u(-3), u(0)),
    otbor: 'nerav',
    metody: ['zamena-preobr'],
    reshenie: [
      'ОДЗ: $\\cos x\\ne0$. Выразим тангенс через косинус: $\\operatorname{tg}^2x=\\dfrac{1-\\cos^2x}{\\cos^2x}=\\dfrac{1}{\\cos^2x}-1$.',
      '$\\dfrac{4}{\\cos^2x}-4+\\dfrac{3}{\\cos x}+3=0\\Leftrightarrow\\dfrac{4}{\\cos^2x}+\\dfrac{3}{\\cos x}-1=0$.',
      'Замена $t=\\dfrac{1}{\\cos x}$, причём $|t|\\ge1$: $4t^2+3t-1=0$, $t=\\dfrac{1}{4}$ или $t=-1$. $t=\\dfrac{1}{4}$ не подходит: тогда $\\cos x=4$.',
      '$\\cos x=-1$: $x=\\pi+2\\pi k$ — здесь $\\cos x\\ne0$, корни входят в ОДЗ.',
    ],
    podskazki: [
      v(
        'Как выразить $\\operatorname{tg}^2x$ через косинус?',
        ['$\\dfrac{1}{\\cos^2x}-1$', '$1-\\dfrac{1}{\\cos^2x}$', '$\\dfrac{1}{\\cos^2x}+1$'],
        0,
      ),
      v(
        'Корни $4t^2+3t-1=0$:',
        ['$\\dfrac{1}{4}$ и $-1$', '$-\\dfrac{1}{4}$ и $1$', '$\\dfrac{1}{2}$ и $-\\dfrac{1}{2}$'],
        0,
      ),
      v(
        'Какой корень отбрасываем?',
        [
          '$t=\\dfrac{1}{4}$: тогда $\\cos x=4$',
          '$t=-1$: косинус не бывает отрицательным',
          'Никакой',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-09',
    iz: 'сторонний задачник',
    uravnenie: '8\\cos^2 x+2\\sqrt{3}\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)=9',
    f: (x) => 8 * cos(x) ** 2 + 2 * sqrt(3) * sin((3 * PI) / 2 - x) - 9,
    serii: [s(u(5, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(-1, 2), u(2)),
    otbor: 'krug',
    metody: ['zamena-preobr', 'privedenie'],
    reshenie: [
      'Приведение: $\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)=-\\cos x$. Получаем $8\\cos^2x-2\\sqrt{3}\\cos x-9=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $D=12+288=300$, $\\sqrt{D}=10\\sqrt{3}$, $t=\\dfrac{2\\sqrt{3}\\pm10\\sqrt{3}}{16}$: $t=\\dfrac{3\\sqrt{3}}{4}$ или $t=-\\dfrac{\\sqrt{3}}{2}$.',
      '$\\dfrac{3\\sqrt{3}}{4}=\\dfrac{\\sqrt{27}}{4}>\\dfrac{\\sqrt{16}}{4}=1$ — не подходит. $\\cos x=-\\dfrac{\\sqrt{3}}{2}$: $x=\\pm\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)$?',
        ['$-\\cos x$', '$\\cos x$', '$-\\sin x$'],
        0,
      ),
      v(
        'Корни $8t^2-2\\sqrt{3}t-9=0$:',
        [
          '$\\dfrac{3\\sqrt{3}}{4}$ и $-\\dfrac{\\sqrt{3}}{2}$',
          '$-\\dfrac{3\\sqrt{3}}{4}$ и $\\dfrac{\\sqrt{3}}{2}$',
          '$\\dfrac{\\sqrt{3}}{4}$ и $-\\dfrac{3\\sqrt{3}}{2}$',
        ],
        0,
      ),
      v(
        'Подходит ли $t=\\dfrac{3\\sqrt{3}}{4}$?',
        ['Нет, это больше $1$', 'Да, это меньше $1$'],
        0,
        '$3\\sqrt{3}=\\sqrt{27}>4$.',
      ),
      v(
        'Решения $\\cos x=-\\dfrac{\\sqrt{3}}{2}$:',
        [
          '$x=\\pm\\dfrac{5\\pi}{6}+2\\pi k$',
          '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$',
          '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z11-10',
    iz: 'авторская',
    uravnenie: '\\operatorname{tg} x+3\\operatorname{ctg} x=4',
    f: (x) => tg(x) + 3 * ctg(x) - 4,
    odz: (x) => Math.abs(sin(x)) > 1e-6 && Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1, 4), 1), s(ua(ARC.arctg(3, '3')), 1)],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'krug',
    metody: ['zamena-preobr'],
    reshenie: [
      'ОДЗ: $\\sin x\\ne0$, $\\cos x\\ne0$. Котангенс выражаем через тангенс: $\\operatorname{ctg}x=\\dfrac{1}{\\operatorname{tg}x}$.',
      'Замена $t=\\operatorname{tg}x$, $t\\ne0$: $t+\\dfrac{3}{t}=4\\Leftrightarrow t^2-4t+3=0$ (умножили на $t\\ne0$). Корни $t=1$ и $t=3$.',
      '$\\operatorname{tg}x=1$: $x=\\dfrac{\\pi}{4}+\\pi k$; $\\operatorname{tg}x=3$: $x=\\operatorname{arctg}3+\\pi k$. В этих точках тангенс конечен и не равен нулю — ОДЗ выполнена.',
    ],
    podskazki: [
      v(
        'Как выразить $\\operatorname{ctg}x$ через тангенс?',
        ['$\\dfrac{1}{\\operatorname{tg}x}$', '$-\\operatorname{tg}x$', '$1-\\operatorname{tg}x$'],
        0,
      ),
      v('Корни $t^2-4t+3=0$:', ['$1$ и $3$', '$-1$ и $-3$', '$1$ и $-3$'], 0),
      v(
        'Решения $\\operatorname{tg}x=3$:',
        [
          '$x=\\operatorname{arctg}3+\\pi k$',
          '$x=\\operatorname{arctg}3+2\\pi k$',
          '$x=\\pm\\operatorname{arctg}3+\\pi k$',
        ],
        0,
      ),
    ],
  }),
];
