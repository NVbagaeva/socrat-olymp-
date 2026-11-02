/**
 * Блок 12 «Однородные первой степени»: $a\sin x+b\cos x=0$. Доказываем
 * от противного, что $\cos x\ne0$, и делим на него. Первая задача —
 * с полным разбором, остальные — с подсказками.
 */

import { ARC, PI, cos, otrezok, s, sin, sqrt, u, ua, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const POCHEMU = (arg: string): string[] => [
  `Иначе и $\\sin ${arg}=0$, а $\\sin^2${arg}+\\cos^2${arg}=1$`,
  'Косинус никогда не равен нулю',
  'Делить на косинус можно всегда',
];

export const ZADACHI_12: Zadacha14[] = [
  ur({
    id: 'z12-01',
    iz: 'сторонний задачник',
    uravnenie: '\\sqrt{3}\\sin 2x+3\\cos 2x=0',
    f: (x) => sqrt(3) * sin(2 * x) + 3 * cos(2 * x),
    serii: [s(u(-1, 6), 1, 2)],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['odnorodnye-1', 'argument'],
    reshenie: [
      'Это однородное уравнение первой степени относительно $\\sin 2x$ и $\\cos 2x$: каждое слагаемое содержит ровно одну из этих функций в первой степени, свободного члена нет. План — разделить на $\\cos 2x$ и получить уравнение с тангенсом. Но делить можно только на то, что не равно нулю, — сначала докажем это.',
      'Пусть $\\cos 2x=0$. Подставим в уравнение: $\\sqrt{3}\\sin 2x+3\\cdot0=0$, то есть $\\sin 2x=0$. Но синус и косинус одного угла одновременно в ноль не обращаются: $\\sin^2 2x+\\cos^2 2x=1$, а получилось бы $0=1$. Противоречие. Значит, у корней уравнения $\\cos 2x\\ne0$.',
      'Делим обе части на $\\cos 2x\\ne0$ — переход равносильный: $\\sqrt{3}\\operatorname{tg}2x+3=0\\Leftrightarrow\\operatorname{tg}2x=-\\dfrac{3}{\\sqrt{3}}=-\\sqrt{3}$.',
      'Тангенс равен $-\\sqrt{3}$ в точке $-\\dfrac{\\pi}{3}$, период тангенса $\\pi$: $2x=-\\dfrac{\\pi}{3}+\\pi k$.',
      'Делим на $2$ и угол, и период: $x=-\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2},\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('На что делим обе части?', ['$\\cos 2x$', '$\\sin 2x$', '$\\cos x$'], 0),
      v('Почему $\\cos 2x\\ne0$?', POCHEMU('2x'), 0),
      v(
        'Чему равен $\\operatorname{tg}2x$?',
        ['$-\\sqrt{3}$', '$\\sqrt{3}$', '$-\\dfrac{\\sqrt{3}}{3}$'],
        0,
        '$\\dfrac{3}{\\sqrt{3}}=\\sqrt{3}$.',
      ),
      v(
        'Решения:',
        [
          '$x=-\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2}$',
          '$x=-\\dfrac{\\pi}{6}+\\pi k$',
          '$x=-\\dfrac{\\pi}{3}+\\dfrac{\\pi k}{2}$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-02',
    iz: 'сторонний задачник',
    uravnenie: '\\sin x+\\cos x=0',
    f: (x) => sin(x) + cos(x),
    serii: [s(u(-1, 4), 1)],
    promezhutok: otrezok(u(-5, 2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['odnorodnye-1'],
    reshenie: [
      'Пусть $\\cos x=0$. Тогда из уравнения $\\sin x=0$, что противоречит $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$, и можно разделить на $\\cos x$: $\\operatorname{tg}x+1=0$.',
      '$\\operatorname{tg}x=-1$: $x=-\\dfrac{\\pi}{4}+\\pi k$.',
    ],
    podskazki: [
      v('Почему можно делить на $\\cos x$?', POCHEMU('x'), 0),
      v(
        'Уравнение после деления:',
        ['$\\operatorname{tg}x=-1$', '$\\operatorname{tg}x=1$', '$\\operatorname{ctg}x=0$'],
        0,
      ),
      v(
        'Решения $\\operatorname{tg}x=-1$:',
        [
          '$x=-\\dfrac{\\pi}{4}+\\pi k$',
          '$x=-\\dfrac{\\pi}{4}+2\\pi k$',
          '$x=\\dfrac{3\\pi}{4}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-03',
    iz: 'сторонний задачник',
    uravnenie: '\\sin x-\\sqrt{3}\\cos x=0',
    f: (x) => sin(x) - sqrt(3) * cos(x),
    serii: [s(u(1, 3), 1)],
    promezhutok: otrezok(u(-1), u(2)),
    otbor: 'krug',
    metody: ['odnorodnye-1'],
    reshenie: [
      'Если $\\cos x=0$, то из уравнения и $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим на $\\cos x$: $\\operatorname{tg}x=\\sqrt{3}$.',
      '$x=\\dfrac{\\pi}{3}+\\pi k$.',
    ],
    podskazki: [
      v('Почему можно делить на $\\cos x$?', POCHEMU('x'), 0),
      v(
        'Чему равен $\\operatorname{tg}x$?',
        ['$\\sqrt{3}$', '$-\\sqrt{3}$', '$\\dfrac{\\sqrt{3}}{3}$'],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=\\dfrac{\\pi}{3}+\\pi k$',
          '$x=\\dfrac{\\pi}{6}+\\pi k$',
          '$x=\\dfrac{\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-04',
    iz: 'сторонний задачник',
    uravnenie: '\\sin 4x+\\sqrt{3}\\cos 4x=0',
    f: (x) => sin(4 * x) + sqrt(3) * cos(4 * x),
    serii: [s(u(-1, 12), 1, 4)],
    promezhutok: otrezok(u(1, 2), u(1)),
    otbor: 'nerav',
    metody: ['odnorodnye-1', 'argument'],
    reshenie: [
      'Если $\\cos 4x=0$, то и $\\sin 4x=0$ — противоречие с $\\sin^2 4x+\\cos^2 4x=1$. Значит, $\\cos 4x\\ne0$; делим: $\\operatorname{tg}4x=-\\sqrt{3}$.',
      '$4x=-\\dfrac{\\pi}{3}+\\pi k\\Leftrightarrow x=-\\dfrac{\\pi}{12}+\\dfrac{\\pi k}{4}$.',
    ],
    podskazki: [
      v('На что делим?', ['$\\cos 4x$', '$\\cos x$', '$\\sin 4x$'], 0),
      v(
        'Чему равен $\\operatorname{tg}4x$?',
        ['$-\\sqrt{3}$', '$\\sqrt{3}$', '$-\\dfrac{1}{\\sqrt{3}}$'],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=-\\dfrac{\\pi}{12}+\\dfrac{\\pi k}{4}$',
          '$x=-\\dfrac{\\pi}{12}+\\pi k$',
          '$x=-\\dfrac{\\pi}{3}+\\dfrac{\\pi k}{4}$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-05',
    iz: 'сторонний задачник',
    uravnenie: '\\cos 3x-\\sin 3x=0',
    f: (x) => cos(3 * x) - sin(3 * x),
    serii: [s(u(1, 12), 1, 3)],
    promezhutok: otrezok(u(-1), u(-1, 2)),
    otbor: 'nerav',
    metody: ['odnorodnye-1', 'argument'],
    reshenie: [
      'Если $\\cos 3x=0$, то из уравнения $\\sin 3x=0$ — противоречие с $\\sin^2 3x+\\cos^2 3x=1$. Значит, $\\cos 3x\\ne0$; делим на него: $1-\\operatorname{tg}3x=0$, $\\operatorname{tg}3x=1$.',
      '$3x=\\dfrac{\\pi}{4}+\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{12}+\\dfrac{\\pi k}{3}$.',
    ],
    podskazki: [
      v(
        'Уравнение после деления на $\\cos 3x$:',
        ['$\\operatorname{tg}3x=1$', '$\\operatorname{tg}3x=-1$', '$\\operatorname{tg}x=1$'],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=\\dfrac{\\pi}{12}+\\dfrac{\\pi k}{3}$',
          '$x=\\dfrac{\\pi}{12}+\\pi k$',
          '$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{3}$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-06',
    iz: 'сторонний задачник',
    uravnenie: '2\\sin x=5\\cos x',
    f: (x) => 2 * sin(x) - 5 * cos(x),
    serii: [s(ua(ARC.arctg(2.5, '2{,}5')), 1)],
    promezhutok: otrezok(u(0), u(5, 2)),
    otbor: 'krug',
    metody: ['odnorodnye-1'],
    reshenie: [
      'Если $\\cos x=0$, то $2\\sin x=0$, $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим на $2\\cos x$: $\\operatorname{tg}x=\\dfrac{5}{2}=2{,}5$.',
      'Значение не табличное: $x=\\operatorname{arctg}2{,}5+\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равен $\\operatorname{tg}x$?',
        ['$2{,}5$', '$0{,}4$', '$-2{,}5$'],
        0,
        '$\\operatorname{tg}x=\\dfrac{\\sin x}{\\cos x}=\\dfrac{5}{2}$.',
      ),
      v(
        'Решения:',
        [
          '$x=\\operatorname{arctg}2{,}5+\\pi k$',
          '$x=\\operatorname{arctg}2{,}5+2\\pi k$',
          '$x=\\operatorname{arctg}0{,}4+\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-07',
    iz: 'авторская',
    uravnenie: '\\sqrt{3}\\sin x+\\cos x=0',
    f: (x) => sqrt(3) * sin(x) + cos(x),
    serii: [s(u(-1, 6), 1)],
    promezhutok: otrezok(u(1), u(3)),
    otbor: 'nerav',
    metody: ['odnorodnye-1'],
    reshenie: [
      'Если $\\cos x=0$, то $\\sqrt{3}\\sin x=0$, $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим: $\\sqrt{3}\\operatorname{tg}x+1=0$.',
      '$\\operatorname{tg}x=-\\dfrac{1}{\\sqrt{3}}=-\\dfrac{\\sqrt{3}}{3}$: $x=-\\dfrac{\\pi}{6}+\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равен $\\operatorname{tg}x$?',
        ['$-\\dfrac{\\sqrt{3}}{3}$', '$-\\sqrt{3}$', '$\\dfrac{\\sqrt{3}}{3}$'],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=-\\dfrac{\\pi}{6}+\\pi k$',
          '$x=-\\dfrac{\\pi}{3}+\\pi k$',
          '$x=\\dfrac{5\\pi}{6}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-08',
    iz: 'авторская',
    uravnenie: '\\sin\\dfrac{x}{2}-\\cos\\dfrac{x}{2}=0',
    f: (x) => sin(x / 2) - cos(x / 2),
    serii: [s(u(1, 2))],
    promezhutok: otrezok(u(-7, 2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['odnorodnye-1', 'argument'],
    reshenie: [
      'Если $\\cos\\dfrac{x}{2}=0$, то и $\\sin\\dfrac{x}{2}=0$ — противоречие с $\\sin^2\\dfrac{x}{2}+\\cos^2\\dfrac{x}{2}=1$. Значит, $\\cos\\dfrac{x}{2}\\ne0$; делим: $\\operatorname{tg}\\dfrac{x}{2}=1$.',
      '$\\dfrac{x}{2}=\\dfrac{\\pi}{4}+\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{2}+2\\pi k$.',
    ],
    podskazki: [
      v('На что делим?', ['$\\cos\\dfrac{x}{2}$', '$\\cos x$', '$\\sin\\dfrac{x}{2}$'], 0),
      v(
        'Решения $\\operatorname{tg}\\dfrac{x}{2}=1$:',
        [
          '$x=\\dfrac{\\pi}{2}+2\\pi k$',
          '$x=\\dfrac{\\pi}{8}+\\dfrac{\\pi k}{2}$',
          '$x=\\dfrac{\\pi}{2}+\\pi k$',
        ],
        0,
        'Умножаем на $2$ и угол, и период.',
      ),
    ],
  }),
  ur({
    id: 'z12-09',
    iz: 'авторская',
    uravnenie: '\\sin(\\pi-x)+\\sqrt{3}\\sin\\left(\\dfrac{\\pi}{2}+x\\right)=0',
    f: (x) => sin(PI - x) + sqrt(3) * sin(PI / 2 + x),
    serii: [s(u(-1, 3), 1)],
    promezhutok: otrezok(u(-3, 2), u(1, 2)),
    otbor: 'krug',
    metody: ['odnorodnye-1', 'privedenie'],
    reshenie: [
      'Приведение: $\\sin(\\pi-x)=\\sin x$, $\\sin\\left(\\dfrac{\\pi}{2}+x\\right)=\\cos x$. Получаем $\\sin x+\\sqrt{3}\\cos x=0$.',
      'Если $\\cos x=0$, то и $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим: $\\operatorname{tg}x=-\\sqrt{3}$.',
      '$x=-\\dfrac{\\pi}{3}+\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\sin\\left(\\dfrac{\\pi}{2}+x\\right)$?',
        ['$\\cos x$', '$-\\cos x$', '$\\sin x$'],
        0,
      ),
      v(
        'Уравнение после приведения:',
        [
          '$\\sin x+\\sqrt{3}\\cos x=0$',
          '$\\sin x-\\sqrt{3}\\cos x=0$',
          '$-\\sin x+\\sqrt{3}\\cos x=0$',
        ],
        0,
      ),
      v(
        'Решения $\\operatorname{tg}x=-\\sqrt{3}$:',
        [
          '$x=-\\dfrac{\\pi}{3}+\\pi k$',
          '$x=-\\dfrac{\\pi}{6}+\\pi k$',
          '$x=\\dfrac{2\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z12-10',
    iz: 'сторонний задачник',
    uravnenie:
      '\\sin x+\\left(\\cos\\dfrac{x}{2}-\\sin\\dfrac{x}{2}\\right)\\left(\\cos\\dfrac{x}{2}+\\sin\\dfrac{x}{2}\\right)=0',
    f: (x) => sin(x) + (cos(x / 2) - sin(x / 2)) * (cos(x / 2) + sin(x / 2)),
    serii: [s(u(-1, 4), 1)],
    promezhutok: otrezok(u(-1), u(1)),
    otbor: 'krug',
    metody: ['odnorodnye-1', 'dvoynoy'],
    reshenie: [
      'Произведение скобок — разность квадратов: $\\cos^2\\dfrac{x}{2}-\\sin^2\\dfrac{x}{2}=\\cos x$. Уравнение: $\\sin x+\\cos x=0$.',
      'Если $\\cos x=0$, то и $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим: $\\operatorname{tg}x=-1$.',
      '$x=-\\dfrac{\\pi}{4}+\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно произведение скобок?',
        ['$\\cos x$', '$\\sin x$', '$1$'],
        0,
        '$\\cos^2\\alpha-\\sin^2\\alpha=\\cos 2\\alpha$ при $\\alpha=\\dfrac{x}{2}$.',
      ),
      v('Почему можно делить на $\\cos x$?', POCHEMU('x'), 0),
      v(
        'Решения $\\operatorname{tg}x=-1$:',
        [
          '$x=-\\dfrac{\\pi}{4}+\\pi k$',
          '$x=\\dfrac{\\pi}{4}+\\pi k$',
          '$x=-\\dfrac{\\pi}{4}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
];
