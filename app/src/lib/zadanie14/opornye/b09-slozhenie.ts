/**
 * Блок 09 «Формулы сложения»: раскрываем синус и косинус суммы и
 * разности или, наоборот, сворачиваем сумму произведений в одну
 * функцию. Первая задача — с полным разбором, остальные — с подсказками.
 */

import { PI, cos, otrezok, s, sin, sqrt, u, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const SVERTKA = ['$\\sin(\\alpha+\\beta)$', '$\\cos(\\alpha-\\beta)$', '$\\cos(\\alpha+\\beta)$', '$\\sin(\\alpha-\\beta)$'];

export const ZADACHI_09: Zadacha14[] = [
  ur({
    id: 'z09-01',
    iz: 'авторская',
    uravnenie: '\\sin\\left(\\dfrac{\\pi}{6}-x\\right)-\\cos\\left(\\dfrac{\\pi}{3}-x\\right)=\\sqrt{3}',
    f: (x) => sin(PI / 6 - x) - cos(PI / 3 - x) - sqrt(3),
    serii: [s(u(-1, 2))],
    promezhutok: otrezok(u(-3), u(0)),
    otbor: 'nerav',
    metody: ['slozhenie'],
    reshenie: [
      'В обеих скобках — разность двух углов. Раскроем их по формулам сложения: $\\sin(\\alpha-\\beta)=\\sin\\alpha\\cos\\beta-\\cos\\alpha\\sin\\beta$ и $\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta$. После этого останутся только $\\sin x$ и $\\cos x$ с числовыми коэффициентами.',
      'Первая скобка: $\\sin\\left(\\dfrac{\\pi}{6}-x\\right)=\\sin\\dfrac{\\pi}{6}\\cos x-\\cos\\dfrac{\\pi}{6}\\sin x=\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x$.',
      'Вторая скобка: $\\cos\\left(\\dfrac{\\pi}{3}-x\\right)=\\cos\\dfrac{\\pi}{3}\\cos x+\\sin\\dfrac{\\pi}{3}\\sin x=\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x$.',
      'Подставляем. Перед второй скобкой стоит минус — он меняет знак у обоих её слагаемых: $\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x-\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x=\\sqrt{3}$.',
      'Косинусы взаимно уничтожаются, синусы складываются: $-\\sqrt{3}\\sin x=\\sqrt{3}\\Leftrightarrow\\sin x=-1$. Делим на число $-\\sqrt{3}\\ne0$ — это равносильный переход.',
      'Синус равен $-1$ в одной точке окружности — нижней, $-\\dfrac{\\pi}{2}$. Она повторяется через полный оборот: $x=-\\dfrac{\\pi}{2}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Чему равно $\\sin\\left(\\dfrac{\\pi}{6}-x\\right)$?', ['$\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x$', '$\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x$', '$\\dfrac{\\sqrt{3}}{2}\\cos x-\\dfrac{1}{2}\\sin x$'], 0),
      v('Чему равно $\\cos\\left(\\dfrac{\\pi}{3}-x\\right)$?', ['$\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x$', '$\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x$', '$\\dfrac{\\sqrt{3}}{2}\\cos x+\\dfrac{1}{2}\\sin x$'], 0, 'В косинусе разности — знак «плюс».'),
      v('Что остаётся после вычитания скобок?', ['$-\\sqrt{3}\\sin x=\\sqrt{3}$', '$\\cos x=\\sqrt{3}$', '$0=\\sqrt{3}$'], 0, 'Минус перед второй скобкой меняет знак у обоих её слагаемых.'),
      v('Решения $\\sin x=-1$:', ['$x=-\\dfrac{\\pi}{2}+2\\pi k$', '$x=-\\dfrac{\\pi}{2}+\\pi k$', '$x=\\pi+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z09-02',
    iz: 'сторонний задачник',
    uravnenie: '\\sin 2x\\cos 3x+\\cos 2x\\sin 3x=\\cos 5x',
    f: (x) => sin(2 * x) * cos(3 * x) + cos(2 * x) * sin(3 * x) - cos(5 * x),
    serii: [s(u(1, 20), 1, 5)],
    promezhutok: otrezok(u(1, 2), u(1)),
    otbor: 'nerav',
    metody: ['slozhenie', 'odnorodnye-1'],
    reshenie: [
      'Левая часть — синус суммы: $\\sin 2x\\cos 3x+\\cos 2x\\sin 3x=\\sin(2x+3x)=\\sin 5x$. Уравнение принимает вид $\\sin 5x=\\cos 5x$.',
      'Пусть $\\cos 5x=0$. Тогда из уравнения и $\\sin 5x=0$, что противоречит $\\sin^2 5x+\\cos^2 5x=1$. Значит, $\\cos 5x\\ne0$, и можно разделить на него: $\\operatorname{tg}5x=1$.',
      '$5x=\\dfrac{\\pi}{4}+\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{20}+\\dfrac{\\pi k}{5}$.',
    ],
    podskazki: [
      v('Какую формулу «сворачиваем» в левой части?', SVERTKA, 0),
      v('Левая часть равна', ['$\\sin 5x$', '$\\cos 5x$', '$\\sin x$'], 0),
      v('Решения $\\operatorname{tg}5x=1$:', ['$x=\\dfrac{\\pi}{20}+\\dfrac{\\pi k}{5}$', '$x=\\dfrac{\\pi}{20}+\\pi k$', '$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{5}$'], 0, 'Период $\\pi$ тоже делится на $5$.'),
    ],
  }),
  ur({
    id: 'z09-03',
    iz: 'сторонний задачник',
    uravnenie: '\\cos x\\cos 3x-\\sin x\\sin 3x=\\sin 4x',
    f: (x) => cos(x) * cos(3 * x) - sin(x) * sin(3 * x) - sin(4 * x),
    serii: [s(u(1, 16), 1, 4)],
    promezhutok: otrezok(u(-1), u(-1, 2)),
    otbor: 'nerav',
    metody: ['slozhenie', 'odnorodnye-1'],
    reshenie: [
      'Левая часть — косинус суммы: $\\cos x\\cos 3x-\\sin x\\sin 3x=\\cos(x+3x)=\\cos 4x$. Получаем $\\cos 4x=\\sin 4x$.',
      'Если $\\cos 4x=0$, то и $\\sin 4x=0$ — противоречие с $\\sin^2 4x+\\cos^2 4x=1$. Значит, $\\cos 4x\\ne0$; делим: $\\operatorname{tg}4x=1$.',
      '$4x=\\dfrac{\\pi}{4}+\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{16}+\\dfrac{\\pi k}{4}$.',
    ],
    podskazki: [
      v('Какую формулу «сворачиваем» в левой части?', SVERTKA, 2),
      v('Почему можно делить на $\\cos 4x$?', ['Иначе и $\\sin 4x=0$, а так не бывает', 'Косинус никогда не равен нулю', 'Делить нельзя'], 0),
      v('Решения $\\operatorname{tg}4x=1$:', ['$x=\\dfrac{\\pi}{16}+\\dfrac{\\pi k}{4}$', '$x=\\dfrac{\\pi}{16}+\\pi k$', '$x=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{4}$'], 0),
    ],
  }),
  ur({
    id: 'z09-04',
    iz: 'сторонний задачник',
    uravnenie: '\\sin\\dfrac{5x}{2}\\sin\\dfrac{3x}{2}+\\cos\\dfrac{5x}{2}\\cos\\dfrac{3x}{2}=2\\cos^2 x',
    f: (x) => sin((5 * x) / 2) * sin((3 * x) / 2) + cos((5 * x) / 2) * cos((3 * x) / 2) - 2 * cos(x) ** 2,
    serii: [s(u(1, 2), 1), s(u(1, 3)), s(u(-1, 3))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'krug',
    metody: ['slozhenie'],
    reshenie: [
      'Левая часть — косинус разности: $\\cos\\dfrac{5x}{2}\\cos\\dfrac{3x}{2}+\\sin\\dfrac{5x}{2}\\sin\\dfrac{3x}{2}=\\cos\\left(\\dfrac{5x}{2}-\\dfrac{3x}{2}\\right)=\\cos x$.',
      '$\\cos x=2\\cos^2x\\Leftrightarrow\\cos x(2\\cos x-1)=0$. Множитель $\\cos x$ выносим, а не сокращаем: иначе потеряем корни $\\cos x=0$.',
      '$\\left[\\begin{aligned}&\\cos x=0,\\\\&\\cos x=\\dfrac{1}{2}\\end{aligned}\\right.\\Leftrightarrow\\left[\\begin{aligned}&x=\\dfrac{\\pi}{2}+\\pi k,\\\\&x=\\pm\\dfrac{\\pi}{3}+2\\pi k.\\end{aligned}\\right.$',
    ],
    podskazki: [
      v('Какую формулу «сворачиваем» в левой части?', SVERTKA, 1),
      v('Можно ли разделить $\\cos x=2\\cos^2x$ на $\\cos x$?', ['Нет: потеряем корни $\\cos x=0$, выносим множитель', 'Да, это равносильный переход'], 0),
      v('Решения $\\cos x=\\dfrac{1}{2}$:', ['$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=\\dfrac{\\pi}{3}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z09-05',
    iz: 'авторская',
    uravnenie: '\\sin\\left(x+\\dfrac{\\pi}{3}\\right)+\\sin\\left(x-\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{2}}{2}',
    f: (x) => sin(x + PI / 3) + sin(x - PI / 3) - sqrt(2) / 2,
    serii: [s(u(1, 4)), s(u(3, 4))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'krug',
    metody: ['slozhenie'],
    reshenie: [
      'Раскрываем обе скобки: $\\sin x\\cos\\dfrac{\\pi}{3}+\\cos x\\sin\\dfrac{\\pi}{3}+\\sin x\\cos\\dfrac{\\pi}{3}-\\cos x\\sin\\dfrac{\\pi}{3}$.',
      'Слагаемые с $\\cos x$ взаимно уничтожаются, остаётся $2\\sin x\\cos\\dfrac{\\pi}{3}=\\sin x$. Уравнение: $\\sin x=\\dfrac{\\sqrt{2}}{2}$.',
      '$x=\\dfrac{\\pi}{4}+2\\pi k$ или $x=\\dfrac{3\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v('Чему равна левая часть после раскрытия скобок?', ['$\\sin x$', '$\\sqrt{3}\\cos x$', '$2\\sin x$'], 0, '$2\\sin x\\cos\\dfrac{\\pi}{3}=2\\cdot\\dfrac{1}{2}\\sin x$.'),
      v('Решения $\\sin x=\\dfrac{\\sqrt{2}}{2}$:', ['$\\dfrac{\\pi}{4}+2\\pi k$ и $\\dfrac{3\\pi}{4}+2\\pi k$', '$\\pm\\dfrac{\\pi}{4}+2\\pi k$', '$\\dfrac{\\pi}{4}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z09-06',
    iz: 'авторская',
    uravnenie: '\\cos\\left(\\dfrac{\\pi}{4}+x\\right)+\\cos\\left(\\dfrac{\\pi}{4}-x\\right)=1',
    f: (x) => cos(PI / 4 + x) + cos(PI / 4 - x) - 1,
    serii: [s(u(1, 4)), s(u(-1, 4))],
    promezhutok: otrezok(u(3, 2), u(4)),
    otbor: 'krug',
    metody: ['slozhenie'],
    reshenie: [
      '$\\cos\\left(\\dfrac{\\pi}{4}+x\\right)=\\dfrac{\\sqrt{2}}{2}\\cos x-\\dfrac{\\sqrt{2}}{2}\\sin x$, $\\cos\\left(\\dfrac{\\pi}{4}-x\\right)=\\dfrac{\\sqrt{2}}{2}\\cos x+\\dfrac{\\sqrt{2}}{2}\\sin x$.',
      'Синусы уничтожаются: $\\sqrt{2}\\cos x=1\\Leftrightarrow\\cos x=\\dfrac{1}{\\sqrt{2}}=\\dfrac{\\sqrt{2}}{2}$.',
      '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$.',
    ],
    podskazki: [
      v('Сумма скобок равна', ['$\\sqrt{2}\\cos x$', '$\\sqrt{2}\\sin x$', '$\\cos x$'], 0),
      v('Чему равен $\\cos x$?', ['$\\dfrac{\\sqrt{2}}{2}$', '$\\sqrt{2}$', '$\\dfrac{1}{2}$'], 0),
      v('Решения:', ['$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$', '$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\pm\\dfrac{3\\pi}{4}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z09-07',
    iz: 'авторская',
    uravnenie: '2\\cos\\left(x-\\dfrac{\\pi}{3}\\right)-\\sqrt{3}\\sin x=\\cos 2x',
    f: (x) => 2 * cos(x - PI / 3) - sqrt(3) * sin(x) - cos(2 * x),
    serii: [s(u(0)), s(u(2, 3)), s(u(-2, 3))],
    promezhutok: otrezok(u(-1), u(3, 4)),
    otbor: 'krug',
    metody: ['slozhenie', 'zamena-preobr'],
    reshenie: [
      '$2\\cos\\left(x-\\dfrac{\\pi}{3}\\right)=2\\left(\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x\\right)=\\cos x+\\sqrt{3}\\sin x$. Слагаемые с синусом уничтожаются: $\\cos x=\\cos 2x$.',
      'Записываем $\\cos 2x=2\\cos^2x-1$: $2\\cos^2x-\\cos x-1=0$. Замена $t=\\cos x$: $2t^2-t-1=0$, $t=1$ или $t=-\\dfrac{1}{2}$.',
      '$\\cos x=1$: $x=2\\pi k$; $\\cos x=-\\dfrac{1}{2}$: $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$.',
    ],
    podskazki: [
      v('Что остаётся в левой части после раскрытия скобки?', ['$\\cos x$', '$\\cos x+2\\sqrt{3}\\sin x$', '$\\sqrt{3}\\cos x$'], 0),
      v('Как записать $\\cos 2x$?', ['$2\\cos^2x-1$', '$1-2\\sin^2x$', '$2\\cos x-1$'], 0, 'Слева только косинус — выражаем через косинус и правую часть.'),
      v('Корни $2t^2-t-1=0$:', ['$1$ и $-\\dfrac{1}{2}$', '$-1$ и $\\dfrac{1}{2}$', '$2$ и $-1$'], 0),
    ],
  }),
  ur({
    id: 'z09-08',
    iz: 'авторская',
    uravnenie: '\\sin 3x\\cos x-\\cos 3x\\sin x=\\cos x',
    f: (x) => sin(3 * x) * cos(x) - cos(3 * x) * sin(x) - cos(x),
    serii: [s(u(1, 2), 1), s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'nerav',
    metody: ['slozhenie', 'dvoynoy'],
    reshenie: [
      'Левая часть — синус разности: $\\sin(3x-x)=\\sin 2x$. Получаем $\\sin 2x=\\cos x\\Leftrightarrow 2\\sin x\\cos x-\\cos x=0$.',
      'Выносим $\\cos x$: $\\cos x(2\\sin x-1)=0$.',
      '$\\cos x=0$: $x=\\dfrac{\\pi}{2}+\\pi k$; $\\sin x=\\dfrac{1}{2}$: $x=\\dfrac{\\pi}{6}+2\\pi k$ или $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Какую формулу «сворачиваем» в левой части?', SVERTKA, 3),
      v('После формулы двойного угла:', ['$\\cos x(2\\sin x-1)=0$', '$2\\sin x=1$', '$\\sin x(2\\cos x-1)=0$'], 0, 'Сокращать на $\\cos x$ нельзя — выносим за скобку.'),
      v('Решения $\\cos x=0$:', ['$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=\\dfrac{\\pi}{2}+2\\pi k$', '$x=\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z09-09',
    iz: 'авторская',
    uravnenie: '\\cos 5x\\cos 3x+\\sin 5x\\sin 3x=\\dfrac{\\sqrt{2}}{2}',
    f: (x) => cos(5 * x) * cos(3 * x) + sin(5 * x) * sin(3 * x) - sqrt(2) / 2,
    serii: [s(u(1, 8), 1), s(u(-1, 8), 1)],
    promezhutok: otrezok(u(-1), u(0)),
    otbor: 'nerav',
    metody: ['slozhenie', 'argument'],
    reshenie: [
      'Левая часть — косинус разности: $\\cos(5x-3x)=\\cos 2x$. Уравнение: $\\cos 2x=\\dfrac{\\sqrt{2}}{2}$.',
      '$2x=\\pm\\dfrac{\\pi}{4}+2\\pi k\\Leftrightarrow x=\\pm\\dfrac{\\pi}{8}+\\pi k$.',
    ],
    podskazki: [
      v('Какую формулу «сворачиваем» в левой части?', SVERTKA, 1),
      v('Левая часть равна', ['$\\cos 2x$', '$\\cos 8x$', '$\\sin 2x$'], 0),
      v('Решения $\\cos 2x=\\dfrac{\\sqrt{2}}{2}$:', ['$x=\\pm\\dfrac{\\pi}{8}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{8}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+\\pi k$'], 0, 'Делим на $2$ и угол, и период.'),
    ],
  }),
  ur({
    id: 'z09-10',
    iz: 'авторская',
    uravnenie: '\\sqrt{2}\\sin\\left(x-\\dfrac{\\pi}{4}\\right)+\\cos x=2\\sin^2 x',
    f: (x) => sqrt(2) * sin(x - PI / 4) + cos(x) - 2 * sin(x) ** 2,
    serii: [s(u(0), 1), s(u(1, 6)), s(u(5, 6))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'krug',
    metody: ['slozhenie'],
    reshenie: [
      '$\\sqrt{2}\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=\\sqrt{2}\\left(\\dfrac{\\sqrt{2}}{2}\\sin x-\\dfrac{\\sqrt{2}}{2}\\cos x\\right)=\\sin x-\\cos x$. Косинусы уничтожаются: $\\sin x=2\\sin^2x$.',
      'Выносим $\\sin x$: $\\sin x(1-2\\sin x)=0$.',
      '$\\sin x=0$: $x=\\pi k$; $\\sin x=\\dfrac{1}{2}$: $x=\\dfrac{\\pi}{6}+2\\pi k$ или $x=\\dfrac{5\\pi}{6}+2\\pi k$.',
    ],
    podskazki: [
      v('Чему равно $\\sqrt{2}\\sin\\left(x-\\dfrac{\\pi}{4}\\right)$?', ['$\\sin x-\\cos x$', '$\\sin x+\\cos x$', '$\\cos x-\\sin x$'], 0),
      v('Что делаем с $\\sin x=2\\sin^2x$?', ['Выносим $\\sin x$ за скобку', 'Делим на $\\sin x$', 'Делаем замену $t=\\cos x$'], 0, 'При делении потерялись бы корни $\\sin x=0$.'),
      v('Решения $\\sin x=0$:', ['$x=\\pi k$', '$x=2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$'], 0),
    ],
  }),
];
