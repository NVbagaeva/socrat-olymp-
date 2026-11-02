/**
 * Блок 13 «Однородные второй степени»: $a\sin^2x+b\sin x\cos x+c\cos^2x=0$,
 * в том числе с числом справа ($d=d(\sin^2x+\cos^2x)$). Делим на
 * $\cos^2x$ только после доказательства $\cos x\ne0$; при $a=0$ или
 * $c=0$ выносим общий множитель. Первая задача — с полным разбором.
 */

import { ARC, cos, otrezok, s, sin, sqrt, u, ua, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const ARCTG3 = ARC.arctg(3, '3');

const POCHEMU = [
  'Иначе из уравнения и $\\sin x=0$, а $\\sin^2x+\\cos^2x=1$',
  'Косинус никогда не равен нулю',
  'Делить на $\\cos^2x$ можно всегда: квадрат не отрицателен',
];

export const ZADACHI_13: Zadacha14[] = [
  ur({
    id: 'z13-01',
    iz: 'сторонний задачник',
    uravnenie: '\\sin^2 x+2\\sin x\\cos x-3\\cos^2 x=0',
    f: (x) => sin(x) ** 2 + 2 * sin(x) * cos(x) - 3 * cos(x) ** 2,
    serii: [s(u(1, 4), 1), s(ua(ARCTG3, -1), 1)],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['odnorodnye-2', 'zamena'],
    reshenie: [
      'Каждое слагаемое — второй степени по $\\sin x$ и $\\cos x$: $\\sin^2x$, $\\sin x\\cos x$, $\\cos^2x$, свободного члена нет. Это однородное уравнение второй степени. План — разделить на $\\cos^2x$ и получить квадратное уравнение относительно $\\operatorname{tg}x$. Сначала проверим, что $\\cos x\\ne0$.',
      'Пусть $\\cos x=0$. Тогда второе и третье слагаемые обращаются в ноль, и уравнение даёт $\\sin^2x=0$, то есть $\\sin x=0$. Но $\\sin^2x+\\cos^2x=1$, а получилось бы $0=1$ — противоречие. Значит, $\\cos x\\ne0$.',
      'Делим обе части на $\\cos^2x\\ne0$ — переход равносильный: $\\dfrac{\\sin^2x}{\\cos^2x}+\\dfrac{2\\sin x\\cos x}{\\cos^2x}-\\dfrac{3\\cos^2x}{\\cos^2x}=0\\Leftrightarrow\\operatorname{tg}^2x+2\\operatorname{tg}x-3=0$.',
      'Замена $t=\\operatorname{tg}x$ (тангенс — любое число): $t^2+2t-3=0$. По теореме Виета $t=1$ или $t=-3$.',
      '$\\operatorname{tg}x=1$: $x=\\dfrac{\\pi}{4}+\\pi k$.',
      '$\\operatorname{tg}x=-3$ — значение не табличное, пишем арктангенс: $x=\\operatorname{arctg}(-3)+\\pi k=-\\operatorname{arctg}3+\\pi k$ (арктангенс — нечётная функция).',
    ],
    podskazki: [
      v('На что делим обе части?', ['$\\cos^2x$', '$\\cos x$', '$\\sin x\\cos x$'], 0),
      v('Почему $\\cos x\\ne0$?', POCHEMU, 0),
      v('Уравнение после деления:', ['$\\operatorname{tg}^2x+2\\operatorname{tg}x-3=0$', '$\\operatorname{tg}^2x+2\\operatorname{tg}x=0$', '$2\\operatorname{tg}x-3=0$'], 0),
      v('Корни $t^2+2t-3=0$:', ['$1$ и $-3$', '$-1$ и $3$', '$1$ и $3$'], 0),
      v('Решения $\\operatorname{tg}x=-3$:', ['$x=-\\operatorname{arctg}3+\\pi k$', '$x=-\\operatorname{arctg}3+2\\pi k$', '$x=\\pm\\operatorname{arctg}3+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-02',
    iz: 'авторская',
    uravnenie: '10\\sin^2 x+5\\sin x\\cos x+\\cos^2 x=3',
    f: (x) => 10 * sin(x) ** 2 + 5 * sin(x) * cos(x) + cos(x) ** 2 - 3,
    serii: [s(u(-1, 4), 1), s(ua(ARC.arctg(2 / 7, '\\dfrac{2}{7}')), 1)],
    promezhutok: otrezok(u(-1), u(1, 2)),
    otbor: 'krug',
    metody: ['odnorodnye-2'],
    reshenie: [
      'Справа число, и уравнение пока не однородное. Запишем $3=3(\\sin^2x+\\cos^2x)$ и перенесём всё влево: $7\\sin^2x+5\\sin x\\cos x-2\\cos^2x=0$.',
      'Пусть $\\cos x=0$. Тогда $7\\sin^2x=0$, $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим на $\\cos^2x$: $7\\operatorname{tg}^2x+5\\operatorname{tg}x-2=0$.',
      '$D=25+56=81$, $\\operatorname{tg}x=\\dfrac{-5\\pm9}{14}$: $\\operatorname{tg}x=\\dfrac{2}{7}$ или $\\operatorname{tg}x=-1$.',
      '$x=-\\dfrac{\\pi}{4}+\\pi k$ или $x=\\operatorname{arctg}\\dfrac{2}{7}+\\pi k$.',
    ],
    podskazki: [
      v('Что делаем с числом $3$ справа?', ['$3=3(\\sin^2x+\\cos^2x)$', 'Делим всё на $3$', 'Переносим влево и делим на $\\cos^2x$'], 0, 'Иначе после деления на $\\cos^2x$ останется $\\dfrac{3}{\\cos^2x}$.'),
      v('Однородное уравнение после переноса:', ['$7\\sin^2x+5\\sin x\\cos x-2\\cos^2x=0$', '$7\\sin^2x+5\\sin x\\cos x+\\cos^2x=0$', '$10\\sin^2x+5\\sin x\\cos x-2\\cos^2x=0$'], 0),
      v('Корни $7t^2+5t-2=0$:', ['$\\dfrac{2}{7}$ и $-1$', '$-\\dfrac{2}{7}$ и $1$', '$\\dfrac{1}{7}$ и $-2$'], 0),
    ],
  }),
  ur({
    id: 'z13-03',
    iz: 'авторская',
    uravnenie: '\\sin^2 x-\\sqrt{3}\\sin x\\cos x=0',
    f: (x) => sin(x) ** 2 - sqrt(3) * sin(x) * cos(x),
    serii: [s(u(0), 1), s(u(1, 3), 1)],
    promezhutok: otrezok(u(-3, 2), u(0)),
    otbor: 'nerav',
    metody: ['odnorodnye-2', 'odnorodnye-1'],
    reshenie: [
      'Слагаемого с $\\cos^2x$ нет, зато в обоих слагаемых есть $\\sin x$. Выносим его за скобку (сокращать нельзя — потеряем корни $\\sin x=0$): $\\sin x(\\sin x-\\sqrt{3}\\cos x)=0$.',
      '$\\sin x=0$: $x=\\pi k$.',
      '$\\sin x-\\sqrt{3}\\cos x=0$ — однородное первой степени. Если $\\cos x=0$, то и $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$; делим на $\\cos x\\ne0$: $\\operatorname{tg}x=\\sqrt{3}$, $x=\\dfrac{\\pi}{3}+\\pi k$.',
    ],
    podskazki: [
      v('Что делаем первым шагом?', ['Выносим $\\sin x$ за скобку', 'Делим на $\\sin x$', 'Делим на $\\sin^2x$'], 0),
      v('Решения $\\sin x=0$:', ['$x=\\pi k$', '$x=2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$'], 0),
      v('Решения $\\sin x-\\sqrt{3}\\cos x=0$:', ['$x=\\dfrac{\\pi}{3}+\\pi k$', '$x=\\dfrac{\\pi}{6}+\\pi k$', '$x=-\\dfrac{\\pi}{3}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-04',
    iz: 'сторонний задачник',
    uravnenie: '5\\sin^2 x+\\sqrt{3}\\sin x\\cos x+6\\cos^2 x=5',
    f: (x) => 5 * sin(x) ** 2 + sqrt(3) * sin(x) * cos(x) + 6 * cos(x) ** 2 - 5,
    serii: [s(u(1, 2), 1), s(u(-1, 6), 1)],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'nerav',
    metody: ['odnorodnye-2'],
    reshenie: [
      '$5=5\\sin^2x+5\\cos^2x$; переносим: $\\sqrt{3}\\sin x\\cos x+\\cos^2x=0$.',
      'Слагаемого с $\\sin^2x$ не осталось, и делить на $\\cos^2x$ нельзя: $\\cos x=0$ здесь как раз даёт корни. Выносим $\\cos x$: $\\cos x(\\sqrt{3}\\sin x+\\cos x)=0$.',
      '$\\cos x=0$: $x=\\dfrac{\\pi}{2}+\\pi k$.',
      '$\\sqrt{3}\\sin x+\\cos x=0$: если $\\cos x=0$, то и $\\sin x=0$ — противоречие; делим на $\\cos x$: $\\operatorname{tg}x=-\\dfrac{\\sqrt{3}}{3}$, $x=-\\dfrac{\\pi}{6}+\\pi k$.',
    ],
    podskazki: [
      v('Уравнение после переноса $5(\\sin^2x+\\cos^2x)$ влево:', ['$\\sqrt{3}\\sin x\\cos x+\\cos^2x=0$', '$\\sqrt{3}\\sin x\\cos x+6\\cos^2x=0$', '$\\sqrt{3}\\sin x\\cos x+\\cos^2x=5$'], 0),
      v('Можно ли теперь делить на $\\cos^2x$?', ['Нет: $\\cos x=0$ — корни, выносим $\\cos x$', 'Да, как всегда'], 0),
      v('Решения $\\sqrt{3}\\sin x+\\cos x=0$:', ['$x=-\\dfrac{\\pi}{6}+\\pi k$', '$x=-\\dfrac{\\pi}{3}+\\pi k$', '$x=\\dfrac{\\pi}{6}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-05',
    iz: 'сторонний задачник',
    uravnenie: '\\sin^2 x-4\\sin x\\cos x+3\\cos^2 x=0',
    f: (x) => sin(x) ** 2 - 4 * sin(x) * cos(x) + 3 * cos(x) ** 2,
    serii: [s(u(1, 4), 1), s(ua(ARCTG3), 1)],
    promezhutok: otrezok(u(-1), u(1, 2)),
    otbor: 'krug',
    metody: ['odnorodnye-2'],
    reshenie: [
      'Если $\\cos x=0$, то из уравнения $\\sin^2x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим на $\\cos^2x$: $\\operatorname{tg}^2x-4\\operatorname{tg}x+3=0$.',
      'По теореме Виета $\\operatorname{tg}x=1$ или $\\operatorname{tg}x=3$.',
      '$x=\\dfrac{\\pi}{4}+\\pi k$ или $x=\\operatorname{arctg}3+\\pi k$.',
    ],
    podskazki: [
      v('Почему $\\cos x\\ne0$?', POCHEMU, 0),
      v('Корни $t^2-4t+3=0$:', ['$1$ и $3$', '$-1$ и $-3$', '$1$ и $-3$'], 0),
      v('Решения $\\operatorname{tg}x=3$:', ['$x=\\operatorname{arctg}3+\\pi k$', '$x=\\operatorname{arctg}3+2\\pi k$', '$x=3+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-06',
    iz: 'сторонний задачник',
    uravnenie: '\\sin^2 x=3\\cos^2 x',
    f: (x) => sin(x) ** 2 - 3 * cos(x) ** 2,
    serii: [s(u(1, 3), 1), s(u(-1, 3), 1)],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['odnorodnye-2'],
    reshenie: [
      'Если $\\cos x=0$, то и $\\sin^2x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$; делим на $\\cos^2x$: $\\operatorname{tg}^2x=3$.',
      '$\\operatorname{tg}x=\\sqrt{3}$ или $\\operatorname{tg}x=-\\sqrt{3}$: $x=\\pm\\dfrac{\\pi}{3}+\\pi k$.',
    ],
    podskazki: [
      v('Уравнение после деления на $\\cos^2x$:', ['$\\operatorname{tg}^2x=3$', '$\\operatorname{tg}x=3$', '$\\operatorname{ctg}^2x=3$'], 0),
      v('Сколько значений у $\\operatorname{tg}x$?', ['Два: $\\pm\\sqrt{3}$', 'Одно: $\\sqrt{3}$', 'Одно: $3$'], 0),
      v('Решения:', ['$x=\\pm\\dfrac{\\pi}{3}+\\pi k$', '$x=\\dfrac{\\pi}{3}+\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-07',
    iz: 'сторонний задачник',
    uravnenie: '\\sin^2\\dfrac{x}{3}=\\cos^2\\dfrac{x}{3}',
    f: (x) => sin(x / 3) ** 2 - cos(x / 3) ** 2,
    serii: [s(u(3, 4), 3, 2)],
    promezhutok: otrezok(u(-3), u(0)),
    otbor: 'nerav',
    metody: ['odnorodnye-2', 'argument'],
    reshenie: [
      'Если $\\cos\\dfrac{x}{3}=0$, то и $\\sin\\dfrac{x}{3}=0$ — противоречие с основным тождеством. Делим на $\\cos^2\\dfrac{x}{3}\\ne0$: $\\operatorname{tg}^2\\dfrac{x}{3}=1$, $\\operatorname{tg}\\dfrac{x}{3}=\\pm1$.',
      '$\\dfrac{x}{3}=\\pm\\dfrac{\\pi}{4}+\\pi k$ — четыре точки окружности через четверть оборота: $\\dfrac{x}{3}=\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$.',
      'Умножаем на $3$ и угол, и период: $x=\\dfrac{3\\pi}{4}+\\dfrac{3\\pi k}{2}$.',
    ],
    podskazki: [
      v('Чему равен $\\operatorname{tg}\\dfrac{x}{3}$?', ['$\\pm1$', '$1$', '$0$'], 0),
      v('Объединённая серия для $\\dfrac{x}{3}$:', ['$\\dfrac{\\pi}{4}+\\dfrac{\\pi k}{2}$', '$\\dfrac{\\pi}{4}+\\pi k$', '$\\pm\\dfrac{\\pi}{4}+2\\pi k$'], 0),
      v('Решения:', ['$x=\\dfrac{3\\pi}{4}+\\dfrac{3\\pi k}{2}$', '$x=\\dfrac{\\pi}{12}+\\dfrac{\\pi k}{6}$', '$x=\\dfrac{3\\pi}{4}+\\dfrac{\\pi k}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z13-08',
    iz: 'сторонний задачник',
    uravnenie: '4\\sin^2 x-2\\sin x\\cos x=3',
    f: (x) => 4 * sin(x) ** 2 - 2 * sin(x) * cos(x) - 3,
    serii: [s(ua(ARCTG3), 1), s(u(-1, 4), 1)],
    promezhutok: otrezok(u(-3, 2), u(0)),
    otbor: 'krug',
    metody: ['odnorodnye-2'],
    reshenie: [
      '$3=3\\sin^2x+3\\cos^2x$; переносим: $\\sin^2x-2\\sin x\\cos x-3\\cos^2x=0$.',
      'Если $\\cos x=0$, то $\\sin^2x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Делим на $\\cos^2x\\ne0$: $\\operatorname{tg}^2x-2\\operatorname{tg}x-3=0$, $\\operatorname{tg}x=3$ или $\\operatorname{tg}x=-1$.',
      '$x=\\operatorname{arctg}3+\\pi k$ или $x=-\\dfrac{\\pi}{4}+\\pi k$.',
    ],
    podskazki: [
      v('Однородное уравнение после переноса:', ['$\\sin^2x-2\\sin x\\cos x-3\\cos^2x=0$', '$\\sin^2x-2\\sin x\\cos x=0$', '$4\\sin^2x-2\\sin x\\cos x-3\\cos^2x=0$'], 0),
      v('Корни $t^2-2t-3=0$:', ['$3$ и $-1$', '$-3$ и $1$', '$3$ и $1$'], 0),
      v('Решения $\\operatorname{tg}x=-1$:', ['$x=-\\dfrac{\\pi}{4}+\\pi k$', '$x=\\dfrac{3\\pi}{4}+2\\pi k$', '$x=-\\dfrac{\\pi}{4}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-09',
    iz: 'сторонний задачник',
    uravnenie: '3\\sin^2\\dfrac{x}{3}+4\\cos^2\\dfrac{x}{3}=3+\\sqrt{3}\\sin\\dfrac{x}{3}\\cos\\dfrac{x}{3}',
    f: (x) => 3 * sin(x / 3) ** 2 + 4 * cos(x / 3) ** 2 - 3 - sqrt(3) * sin(x / 3) * cos(x / 3),
    serii: [s(u(3, 2), 3), s(u(1, 2), 3)],
    promezhutok: otrezok(u(1), u(4)),
    otbor: 'nerav',
    metody: ['odnorodnye-2', 'argument'],
    reshenie: [
      '$3=3\\sin^2\\dfrac{x}{3}+3\\cos^2\\dfrac{x}{3}$; переносим: $\\cos^2\\dfrac{x}{3}-\\sqrt{3}\\sin\\dfrac{x}{3}\\cos\\dfrac{x}{3}=0$.',
      'Слагаемого с $\\sin^2$ нет — выносим $\\cos\\dfrac{x}{3}$: $\\cos\\dfrac{x}{3}\\left(\\cos\\dfrac{x}{3}-\\sqrt{3}\\sin\\dfrac{x}{3}\\right)=0$.',
      '$\\cos\\dfrac{x}{3}=0$: $\\dfrac{x}{3}=\\dfrac{\\pi}{2}+\\pi k$, $x=\\dfrac{3\\pi}{2}+3\\pi k$.',
      'Во второй скобке $\\cos\\dfrac{x}{3}\\ne0$ (иначе и синус равен нулю), делим: $\\operatorname{tg}\\dfrac{x}{3}=\\dfrac{1}{\\sqrt{3}}$, $\\dfrac{x}{3}=\\dfrac{\\pi}{6}+\\pi k$, $x=\\dfrac{\\pi}{2}+3\\pi k$.',
    ],
    podskazki: [
      v('Что остаётся после переноса числа $3=3\\left(\\sin^2\\dfrac{x}{3}+\\cos^2\\dfrac{x}{3}\\right)$?', ['$\\cos^2\\dfrac{x}{3}-\\sqrt{3}\\sin\\dfrac{x}{3}\\cos\\dfrac{x}{3}=0$', '$4\\cos^2\\dfrac{x}{3}-\\sqrt{3}\\sin\\dfrac{x}{3}\\cos\\dfrac{x}{3}=0$', '$\\cos^2\\dfrac{x}{3}=3$'], 0),
      v('Что делаем дальше?', ['Выносим $\\cos\\dfrac{x}{3}$', 'Делим на $\\cos^2\\dfrac{x}{3}$', 'Делим на $\\sin\\dfrac{x}{3}$'], 0),
      v('Решения $\\cos\\dfrac{x}{3}=0$:', ['$x=\\dfrac{3\\pi}{2}+3\\pi k$', '$x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{3}$', '$x=\\dfrac{3\\pi}{2}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z13-10',
    iz: 'сторонний задачник',
    uravnenie: '5\\sin^2 x-14\\sin x\\cos x-3\\cos^2 x=2',
    f: (x) => 5 * sin(x) ** 2 - 14 * sin(x) * cos(x) - 3 * cos(x) ** 2 - 2,
    serii: [s(ua(ARC.arctg(5, '5')), 1), s(ua(ARC.arctg(1 / 3, '\\dfrac{1}{3}'), -1), 1)],
    metody: ['odnorodnye-2'],
    reshenie: [
      '$2=2\\sin^2x+2\\cos^2x$; переносим: $3\\sin^2x-14\\sin x\\cos x-5\\cos^2x=0$.',
      'Если $\\cos x=0$, то $3\\sin^2x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Делим на $\\cos^2x\\ne0$: $3\\operatorname{tg}^2x-14\\operatorname{tg}x-5=0$.',
      '$D=196+60=256$, $\\operatorname{tg}x=\\dfrac{14\\pm16}{6}$: $\\operatorname{tg}x=5$ или $\\operatorname{tg}x=-\\dfrac{1}{3}$.',
      '$x=\\operatorname{arctg}5+\\pi k$ или $x=-\\operatorname{arctg}\\dfrac{1}{3}+\\pi k$.',
    ],
    podskazki: [
      v('Однородное уравнение после переноса:', ['$3\\sin^2x-14\\sin x\\cos x-5\\cos^2x=0$', '$5\\sin^2x-14\\sin x\\cos x-5\\cos^2x=0$', '$3\\sin^2x-14\\sin x\\cos x-3\\cos^2x=0$'], 0),
      v('Корни $3t^2-14t-5=0$:', ['$5$ и $-\\dfrac{1}{3}$', '$-5$ и $\\dfrac{1}{3}$', '$3$ и $-\\dfrac{5}{3}$'], 0),
      v('Решения $\\operatorname{tg}x=-\\dfrac{1}{3}$:', ['$x=-\\operatorname{arctg}\\dfrac{1}{3}+\\pi k$', '$x=\\operatorname{arctg}3+\\pi k$', '$x=-\\operatorname{arctg}3+\\pi k$'], 0),
    ],
  }),
];
