/**
 * Блок 08 «Двойной угол и общий множитель»: $\sin 2x$, три вида
 * $\cos 2x$ (берём тот, после которого остаётся одна функция) и
 * вынесение общего множителя вместо сокращения. Задачи из листа и
 * сторонних подборок — с новыми промежутками, остальные — свои.
 */

import { cos, otrezok, PI, promezhutok, s, sin, sqrt, u, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const VYNESTI = [
  'Перенести всё влево и вынести общий множитель',
  'Сократить на общий множитель',
  'Возвести обе части в квадрат',
];

export const ZADACHI_08: Zadacha14[] = [
  ur({
    id: 'z08-01',
    iz: 'авторская',
    uravnenie: '\\sin 2x=\\cos x',
    f: (x) => sin(2 * x) - cos(x),
    serii: [s(u(1, 2), 1), s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'krug',
    metody: ['dvoynoy'],
    reshenie: [
      'Слева угол $2x$, справа $x$. Приводим к одному аргументу по формуле синуса двойного угла: $\\sin 2x=2\\sin x\\cos x$. Получаем $2\\sin x\\cos x=\\cos x$.',
      'Хочется разделить обе части на $\\cos x$ и получить $2\\sin x=1$. **Так делать нельзя.** Делить можно только на то, что не равно нулю, а $\\cos x$ бывает равен нулю. Проверим: при $\\cos x=0$ обе части уравнения равны нулю — значит, все $x$ с $\\cos x=0$ — корни. Сократив на $\\cos x$, мы потеряли бы целую серию $x=\\dfrac{\\pi}{2}+\\pi k$.',
      'Правильный путь — перенести всё в одну часть и вынести общий множитель: $2\\sin x\\cos x-\\cos x=0\\ \\Leftrightarrow\\ \\cos x\\,(2\\sin x-1)=0$.',
      'Произведение равно нулю, когда хотя бы один множитель равен нулю, а остальные при этом имеют смысл. Здесь оба множителя определены при любом $x$, поэтому переход равносилен: $\\cos x\\,(2\\sin x-1)=0\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&\\cos x=0,\\\\&\\sin x=\\dfrac{1}{2}.\\end{aligned}\\right.$',
      '$\\cos x=0$ в точках $\\dfrac{\\pi}{2}$ и $-\\dfrac{\\pi}{2}$; они противоположны, поэтому одна серия с шагом $\\pi$: $x=\\dfrac{\\pi}{2}+\\pi k$.',
      '$\\sin x=\\dfrac{1}{2}$: прямая $y=\\dfrac{1}{2}$ пересекает окружность в точках $\\dfrac{\\pi}{6}$ и $\\dfrac{5\\pi}{6}$, то есть $x=\\dfrac{\\pi}{6}+2\\pi k$ и $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Как записать $\\sin 2x$?',
        ['$2\\sin x\\cos x$', '$2\\sin x$', '$\\sin^2 x-\\cos^2 x$'],
        0,
      ),
      v(
        'Что делаем с $\\cos x$ в уравнении $2\\sin x\\cos x=\\cos x$?',
        VYNESTI,
        0,
        'Если сократить, потеряется серия $x=\\dfrac{\\pi}{2}+\\pi k$.',
      ),
      v(
        'Какая совокупность получится?',
        [
          '$\\cos x=0$ или $\\sin x=\\dfrac{1}{2}$',
          'Только $\\sin x=\\dfrac{1}{2}$',
          '$\\cos x=0$ или $\\sin x=2$',
        ],
        0,
      ),
      v(
        'Решения $\\cos x=0$:',
        ['$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=\\dfrac{\\pi}{2}+2\\pi k$', '$x=\\pi k$'],
        0,
      ),
      v(
        'Сколько корней на $\\left[\\pi;\\,\\dfrac{5\\pi}{2}\\right]$?',
        ['Три', 'Два', 'Четыре'],
        0,
        '$\\dfrac{3\\pi}{2}$, $\\dfrac{13\\pi}{6}$, $\\dfrac{5\\pi}{2}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-02',
    iz: 'лист 22, №16',
    uravnenie: '\\sin\\left(\\dfrac{\\pi}{2}+x\\right)=\\sin 2x',
    f: (x) => sin(PI / 2 + x) - sin(2 * x),
    serii: [s(u(1, 2), 1), s(u(1, 6)), s(u(5, 6))],
    promezhutok: promezhutok(otrezok(u(-5, 2), u(-3, 2)), [true, false]),
    otbor: 'nerav',
    metody: ['dvoynoy', 'privedenie'],
    reshenie: [
      '$\\sin\\left(\\dfrac{\\pi}{2}+x\\right)=\\cos x$ (функция меняется, II четверть, синус положителен); $\\sin 2x=2\\sin x\\cos x$.',
      '$\\cos x=2\\sin x\\cos x\\ \\Leftrightarrow\\ \\cos x\\,(1-2\\sin x)=0$ — выносим $\\cos x$, а не сокращаем.',
      '$\\left[\\begin{aligned}&\\cos x=0,\\\\&\\sin x=\\dfrac{1}{2};\\end{aligned}\\right.$ $x=\\dfrac{\\pi}{2}+\\pi k$, $x=\\dfrac{\\pi}{6}+2\\pi k$, $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Чему равно $\\sin\\left(\\dfrac{\\pi}{2}+x\\right)$?',
        ['$\\cos x$', '$-\\cos x$', '$\\sin x$'],
        0,
      ),
      v('Что делаем с $\\cos x$?', VYNESTI, 0),
      v(
        'Серии:',
        [
          '$\\dfrac{\\pi}{2}+\\pi k$, $\\dfrac{\\pi}{6}+2\\pi k$, $\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{6}+2\\pi k$, $\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{2}+\\pi k$, $\\pm\\dfrac{\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
      v(
        'Неравенство для $x=\\dfrac{\\pi}{2}+\\pi k$ на $\\left[-\\dfrac{5\\pi}{2};\\,-\\dfrac{3\\pi}{2}\\right)$:',
        [
          '$-\\dfrac{5}{2}\\le\\dfrac{1}{2}+k<-\\dfrac{3}{2}$, $k=-3$',
          '$-\\dfrac{5}{2}\\le\\dfrac{1}{2}+k\\le-\\dfrac{3}{2}$, $k=-3,\\,-2$',
          '$-\\dfrac{5}{2}<\\dfrac{1}{2}+k<-\\dfrac{3}{2}$, нет $k$',
        ],
        0,
        'Правый конец не входит, левый входит.',
      ),
    ],
  }),
  ur({
    id: 'z08-03',
    iz: 'сторонний задачник',
    uravnenie: '\\sin 2x+\\sqrt{3}\\sin x=0',
    f: (x) => sin(2 * x) + sqrt(3) * sin(x),
    serii: [s(u(0), 1), s(u(5, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'krug',
    metody: ['dvoynoy'],
    reshenie: [
      '$2\\sin x\\cos x+\\sqrt{3}\\sin x=0\\ \\Leftrightarrow\\ \\sin x\\,(2\\cos x+\\sqrt{3})=0$.',
      'Оба множителя определены при всех $x$: $\\left[\\begin{aligned}&\\sin x=0,\\\\&\\cos x=-\\dfrac{\\sqrt{3}}{2}.\\end{aligned}\\right.$',
      '$x=\\pi k$; $x=\\pm\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Какой общий множитель?', ['$\\sin x$', '$\\cos x$', '$\\sqrt{3}$'], 0),
      v(
        'Второй множитель равен нулю, когда',
        [
          '$\\cos x=-\\dfrac{\\sqrt{3}}{2}$',
          '$\\cos x=\\dfrac{\\sqrt{3}}{2}$',
          '$\\sin x=-\\dfrac{\\sqrt{3}}{2}$',
        ],
        0,
      ),
      v(
        'Решения $\\cos x=-\\dfrac{\\sqrt{3}}{2}$:',
        [
          '$\\pm\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{6}+2\\pi k$',
          '$\\pm\\dfrac{2\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $\\left[-2\\pi;\\,-\\dfrac{\\pi}{2}\\right]$?',
        ['Четыре', 'Три', 'Два'],
        0,
        '$-2\\pi$, $-\\dfrac{7\\pi}{6}$, $-\\pi$, $-\\dfrac{5\\pi}{6}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-04',
    iz: 'сторонний задачник',
    uravnenie: '\\sin 2x+\\sqrt{2}\\sin x=2\\cos x+\\sqrt{2}',
    f: (x) => sin(2 * x) + sqrt(2) * sin(x) - 2 * cos(x) - sqrt(2),
    serii: [s(u(1, 2)), s(u(3, 4)), s(u(-3, 4))],
    promezhutok: otrezok(u(-2), u(0)),
    otbor: 'nerav',
    metody: ['dvoynoy'],
    reshenie: [
      '$2\\sin x\\cos x+\\sqrt{2}\\sin x-2\\cos x-\\sqrt{2}=0$. Группируем: $2\\cos x\\,(\\sin x-1)+\\sqrt{2}\\,(\\sin x-1)=0$.',
      'Выносим общую скобку: $(\\sin x-1)(2\\cos x+\\sqrt{2})=0$. Оба множителя определены при всех $x$.',
      '$\\left[\\begin{aligned}&\\sin x=1,\\\\&\\cos x=-\\dfrac{\\sqrt{2}}{2};\\end{aligned}\\right.$ $x=\\dfrac{\\pi}{2}+2\\pi k$, $x=\\pm\\dfrac{3\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Как сгруппировать слагаемые?',
        [
          '$2\\cos x\\,(\\sin x-1)+\\sqrt{2}\\,(\\sin x-1)$',
          '$\\sin x\\,(2\\cos x+\\sqrt{2})-2\\cos x$',
          '$2\\sin x\\,(\\cos x-1)+\\sqrt{2}\\,(\\sin x-1)$',
        ],
        0,
      ),
      v(
        'Какое произведение получится?',
        [
          '$(\\sin x-1)(2\\cos x+\\sqrt{2})=0$',
          '$(\\sin x+1)(2\\cos x-\\sqrt{2})=0$',
          '$(\\cos x-1)(2\\sin x+\\sqrt{2})=0$',
        ],
        0,
      ),
      v(
        'Решения $\\cos x=-\\dfrac{\\sqrt{2}}{2}$:',
        [
          '$\\pm\\dfrac{3\\pi}{4}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{4}+2\\pi k$',
          '$-\\dfrac{\\pi}{4}+\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $[-2\\pi;\\,0]$?',
        ['Три', 'Два', 'Четыре'],
        0,
        '$-\\dfrac{3\\pi}{2}$, $-\\dfrac{5\\pi}{4}$, $-\\dfrac{3\\pi}{4}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-05',
    iz: 'авторская',
    uravnenie: '\\cos 2x=1-2\\sin x',
    f: (x) => cos(2 * x) - 1 + 2 * sin(x),
    serii: [s(u(0), 1), s(u(1, 2))],
    promezhutok: otrezok(u(-3), u(-3, 2)),
    otbor: 'nerav',
    metody: ['dvoynoy'],
    reshenie: [
      'Справа $\\sin x$, поэтому берём вид $\\cos 2x=1-2\\sin^2 x$ — останется одна функция.',
      '$1-2\\sin^2 x=1-2\\sin x\\ \\Leftrightarrow\\ 2\\sin x\\,(\\sin x-1)=0$ — выносим $\\sin x$.',
      '$\\left[\\begin{aligned}&\\sin x=0,\\\\&\\sin x=1;\\end{aligned}\\right.$ $x=\\pi k$, $x=\\dfrac{\\pi}{2}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какой вид $\\cos 2x$ выбрать?',
        ['$1-2\\sin^2 x$', '$2\\cos^2 x-1$', '$\\cos^2 x-\\sin^2 x$'],
        0,
        'Справа синус — пусть и слева будет только синус.',
      ),
      v(
        'Что получится?',
        ['$\\sin x\\,(\\sin x-1)=0$', '$\\sin x\\,(\\sin x+1)=0$', '$\\sin x=1$'],
        0,
        'Если сократить на $\\sin x$, потеряем серию $x=\\pi k$.',
      ),
      v(
        'Сколько корней на $\\left[-3\\pi;\\,-\\dfrac{3\\pi}{2}\\right]$?',
        ['Три', 'Два', 'Четыре'],
        0,
        '$-3\\pi$, $-2\\pi$, $-\\dfrac{3\\pi}{2}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-06',
    iz: 'авторская',
    uravnenie: '\\cos 2x=3\\sin x+2',
    f: (x) => cos(2 * x) - 3 * sin(x) - 2,
    serii: [s(u(-1, 2)), s(u(-1, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(1), u(2)),
    otbor: 'krug',
    metody: ['dvoynoy', 'zamena-preobr'],
    reshenie: [
      'Справа $\\sin x$ — берём $\\cos 2x=1-2\\sin^2 x$: $1-2\\sin^2 x=3\\sin x+2\\ \\Leftrightarrow\\ 2\\sin^2 x+3\\sin x+1=0$.',
      'Замена $t=\\sin x$: $D=9-8=1$, $t=-\\dfrac{1}{2}$ или $t=-1$ — оба подходят.',
      '$\\sin x=-1$: $x=-\\dfrac{\\pi}{2}+2\\pi k$; $\\sin x=-\\dfrac{1}{2}$: $x=-\\dfrac{\\pi}{6}+2\\pi k$, $x=-\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какой вид $\\cos 2x$ выбрать?',
        ['$1-2\\sin^2 x$', '$2\\cos^2 x-1$', '$\\cos^2 x-\\sin^2 x$'],
        0,
      ),
      v(
        'Корни $2t^2+3t+1=0$:',
        ['$-\\dfrac{1}{2}$ и $-1$', '$\\dfrac{1}{2}$ и $1$', '$-2$ и $-\\dfrac{1}{2}$'],
        0,
      ),
      v(
        'Решения $\\sin x=-1$:',
        ['$-\\dfrac{\\pi}{2}+2\\pi k$', '$-\\dfrac{\\pi}{2}+\\pi k$', '$\\pi+2\\pi k$'],
        0,
      ),
      v(
        'Сколько корней на $[\\pi;\\,2\\pi]$?',
        ['Три', 'Два', 'Один'],
        0,
        '$\\dfrac{7\\pi}{6}$, $\\dfrac{3\\pi}{2}$, $\\dfrac{11\\pi}{6}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-07',
    iz: 'авторская',
    uravnenie: '\\cos 2x+\\sin^2 x=\\cos x',
    f: (x) => cos(2 * x) + sin(x) ** 2 - cos(x),
    serii: [s(u(1, 2), 1), s(u(0))],
    promezhutok: otrezok(u(2), u(7, 2)),
    otbor: 'nerav',
    metody: ['dvoynoy'],
    reshenie: [
      'Здесь удобен вид $\\cos 2x=\\cos^2 x-\\sin^2 x$: квадрат синуса сократится. $\\cos^2 x-\\sin^2 x+\\sin^2 x=\\cos x\\ \\Leftrightarrow\\ \\cos^2 x=\\cos x$.',
      '$\\cos x\\,(\\cos x-1)=0$ — выносим, а не сокращаем на $\\cos x$.',
      '$\\left[\\begin{aligned}&\\cos x=0,\\\\&\\cos x=1;\\end{aligned}\\right.$ $x=\\dfrac{\\pi}{2}+\\pi k$, $x=2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какой вид $\\cos 2x$ здесь удобнее?',
        ['$\\cos^2 x-\\sin^2 x$', '$1-2\\sin^2 x$', '$2\\sin x\\cos x$'],
        0,
        'Тогда $\\sin^2 x$ взаимно уничтожится.',
      ),
      v(
        'Что получится?',
        ['$\\cos x\\,(\\cos x-1)=0$', '$\\cos x=1$', '$\\cos x\\,(\\cos x+1)=0$'],
        0,
      ),
      v(
        'Сколько корней на $\\left[2\\pi;\\,\\dfrac{7\\pi}{2}\\right]$?',
        ['Три', 'Два', 'Четыре'],
        0,
        '$2\\pi$, $\\dfrac{5\\pi}{2}$, $\\dfrac{7\\pi}{2}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-08',
    iz: 'авторская',
    uravnenie: '\\cos 2x=\\sqrt{2}\\cos x-1',
    f: (x) => cos(2 * x) - sqrt(2) * cos(x) + 1,
    serii: [s(u(1, 2), 1), s(u(1, 4)), s(u(-1, 4))],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['dvoynoy'],
    reshenie: [
      'Справа $\\cos x$ — берём $\\cos 2x=2\\cos^2 x-1$: $2\\cos^2 x-1=\\sqrt{2}\\cos x-1\\ \\Leftrightarrow\\ \\cos x\\,(2\\cos x-\\sqrt{2})=0$.',
      '$\\left[\\begin{aligned}&\\cos x=0,\\\\&\\cos x=\\dfrac{\\sqrt{2}}{2};\\end{aligned}\\right.$ $x=\\dfrac{\\pi}{2}+\\pi k$, $x=\\pm\\dfrac{\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Какой вид $\\cos 2x$ выбрать?',
        ['$2\\cos^2 x-1$', '$1-2\\sin^2 x$', '$\\cos^2 x-\\sin^2 x$'],
        0,
      ),
      v(
        'Что получится после переноса?',
        [
          '$\\cos x\\,(2\\cos x-\\sqrt{2})=0$',
          '$2\\cos x=\\sqrt{2}$',
          '$2\\cos^2 x-\\sqrt{2}\\cos x-2=0$',
        ],
        0,
        'Единицы взаимно уничтожились.',
      ),
      v(
        'Решения $\\cos x=\\dfrac{\\sqrt{2}}{2}$:',
        [
          '$\\pm\\dfrac{\\pi}{4}+2\\pi k$',
          '$\\dfrac{\\pi}{4}+\\pi k$',
          '$\\pm\\dfrac{3\\pi}{4}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z08-09',
    iz: 'авторская',
    uravnenie: '\\sin 2x=2\\cos^2 x',
    f: (x) => sin(2 * x) - 2 * cos(x) ** 2,
    serii: [s(u(1, 2), 1), s(u(1, 4), 1)],
    promezhutok: otrezok(u(-2), u(-1)),
    otbor: 'nerav',
    metody: ['dvoynoy', 'odnorodnye-1'],
    reshenie: [
      '$2\\sin x\\cos x-2\\cos^2 x=0\\ \\Leftrightarrow\\ 2\\cos x\\,(\\sin x-\\cos x)=0$.',
      '$\\left[\\begin{aligned}&\\cos x=0,\\\\&\\sin x=\\cos x.\\end{aligned}\\right.$ Первое: $x=\\dfrac{\\pi}{2}+\\pi k$.',
      'Во втором уравнении $\\cos x\\ne0$: если $\\cos x=0$, то и $\\sin x=0$, что противоречит $\\sin^2 x+\\cos^2 x=1$. Значит, можно разделить на $\\cos x$: $\\operatorname{tg} x=1$, $x=\\dfrac{\\pi}{4}+\\pi k$.',
    ],
    podskazki: [
      v('Какой общий множитель?', ['$2\\cos x$', '$2\\sin x$', '$\\cos^2 x$'], 0),
      v(
        'Можно ли в уравнении $\\sin x=\\cos x$ делить на $\\cos x$?',
        [
          'Да: при $\\cos x=0$ было бы и $\\sin x=0$, так не бывает',
          'Нет, никогда',
          'Да, всегда можно',
        ],
        0,
      ),
      v(
        'Решения $\\operatorname{tg} x=1$:',
        [
          '$\\dfrac{\\pi}{4}+\\pi k$',
          '$\\dfrac{\\pi}{4}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{4}+\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $[-2\\pi;\\,-\\pi]$?',
        ['Два', 'Три', 'Один'],
        0,
        '$-\\dfrac{7\\pi}{4}$ и $-\\dfrac{3\\pi}{2}$.',
      ),
    ],
  }),
  ur({
    id: 'z08-10',
    iz: 'авторская',
    uravnenie: '\\sin 2x+2\\sin x=\\cos x+1',
    f: (x) => sin(2 * x) + 2 * sin(x) - cos(x) - 1,
    serii: [s(u(1)), s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(-3), u(0)),
    otbor: 'krug',
    metody: ['dvoynoy'],
    reshenie: [
      '$2\\sin x\\cos x+2\\sin x-\\cos x-1=0$. Группируем: $2\\sin x\\,(\\cos x+1)-(\\cos x+1)=0$.',
      '$(\\cos x+1)(2\\sin x-1)=0$; оба множителя определены при всех $x$.',
      '$\\left[\\begin{aligned}&\\cos x=-1,\\\\&\\sin x=\\dfrac{1}{2};\\end{aligned}\\right.$ $x=\\pi+2\\pi k$, $x=\\dfrac{\\pi}{6}+2\\pi k$, $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v(
        'Как сгруппировать?',
        [
          '$2\\sin x\\,(\\cos x+1)-(\\cos x+1)$',
          '$2\\cos x\\,(\\sin x+1)-(\\sin x+1)$',
          '$\\sin x\\,(2\\cos x+2)-\\cos x$',
        ],
        0,
      ),
      v(
        'Какое произведение получится?',
        [
          '$(\\cos x+1)(2\\sin x-1)=0$',
          '$(\\cos x-1)(2\\sin x+1)=0$',
          '$(\\sin x+1)(2\\cos x-1)=0$',
        ],
        0,
      ),
      v('Решения $\\cos x=-1$:', ['$\\pi+2\\pi k$', '$\\pi k$', '$\\dfrac{\\pi}{2}+\\pi k$'], 0),
      v(
        'Сколько корней на $[-3\\pi;\\,0]$?',
        ['Четыре', 'Три', 'Пять'],
        0,
        '$-3\\pi$, $-\\dfrac{11\\pi}{6}$, $-\\dfrac{7\\pi}{6}$, $-\\pi$.',
      ),
    ],
  }),
];
