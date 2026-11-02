/**
 * Блок 01 «Простейшие уравнения»: синус, косинус, тангенс и котангенс
 * равны числу. Первая задача — с полным разбором, остальные — с
 * подсказками. Все задачи свои.
 */

import { ARC, cos, ctg, otrezok, promezhutok, s, sin, sqrt, tg, u, ua, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const ODZ_TG = (x: number): boolean => Math.abs(cos(x)) > 1e-6;
const ODZ_CTG = (x: number): boolean => Math.abs(sin(x)) > 1e-6;

export const ZADACHI_01: Zadacha14[] = [
  ur({
    id: 'z01-01',
    iz: 'авторская',
    uravnenie: '\\sin x=-\\dfrac{\\sqrt{3}}{2}',
    f: (x) => sin(x) + sqrt(3) / 2,
    serii: [s(u(-1, 3)), s(u(-2, 3))],
    zapisA: ['x=(-1)^{k+1}\\dfrac{\\pi}{3}+\\pi k'],
    promezhutok: otrezok(u(1), u(5, 2)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Синус точки окружности — её ордината, то есть координата по вертикальной оси. Значит, нужно найти все точки окружности, у которых ордината равна $-\\dfrac{\\sqrt{3}}{2}$.',
      'Отмечаем на оси синусов число $-\\dfrac{\\sqrt{3}}{2}$ и проводим через него горизонтальную прямую $y=-\\dfrac{\\sqrt{3}}{2}$. Так как $\\left|-\\dfrac{\\sqrt{3}}{2}\\right|<1$, прямая пересекает окружность в двух точках — обе в нижней половине.',
      'Правая точка — табличный угол: $\\sin\\dfrac{\\pi}{3}=\\dfrac{\\sqrt{3}}{2}$, а синус нечётен, поэтому $\\sin\\left(-\\dfrac{\\pi}{3}\\right)=-\\dfrac{\\sqrt{3}}{2}$. Это точка $-\\dfrac{\\pi}{3}$.',
      'Левая точка симметрична правой относительно оси синусов: $\\pi-\\left(-\\dfrac{\\pi}{3}\\right)=\\dfrac{4\\pi}{3}$, или, если идти по часовой стрелке, $-\\dfrac{2\\pi}{3}$. Удобнее взять $-\\dfrac{2\\pi}{3}$: обе точки подписаны одним обходом.',
      'В каждую точку мы попадаем снова через полный оборот, поэтому к каждой прибавляем $2\\pi k$: $x=-\\dfrac{\\pi}{3}+2\\pi k$ и $x=-\\dfrac{2\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Обе серии можно записать одной формулой через $(-1)^k$: $x=(-1)^k\\arcsin\\left(-\\dfrac{\\sqrt{3}}{2}\\right)+\\pi k=(-1)^{k+1}\\dfrac{\\pi}{3}+\\pi k$. При чётном $k$ получаем точку $-\\dfrac{\\pi}{3}$, при нечётном — $-\\dfrac{2\\pi}{3}$. Для отбора корней удобнее две серии.',
    ],
    podskazki: [
      v('Какая прямая даёт точки окружности с $\\sin x=-\\dfrac{\\sqrt{3}}{2}$?', ['Горизонтальная $y=-\\dfrac{\\sqrt{3}}{2}$', 'Вертикальная $x=-\\dfrac{\\sqrt{3}}{2}$', 'Луч из центра под углом $-\\dfrac{\\pi}{3}$'], 0, 'Синус — ордината точки.'),
      v('Правая из двух точек:', ['$-\\dfrac{\\pi}{3}$', '$-\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{3}$'], 0),
      v('Левая точка:', ['$-\\dfrac{2\\pi}{3}$', '$-\\dfrac{5\\pi}{6}$', '$\\dfrac{2\\pi}{3}$'], 0, 'Она симметрична точке $-\\dfrac{\\pi}{3}$ относительно оси синусов.'),
      v('Какой шаг у серий?', ['$2\\pi k$', '$\\pi k$', '$\\dfrac{\\pi k}{2}$'], 0),
    ],
  }),
  ur({
    id: 'z01-02',
    iz: 'авторская',
    uravnenie: '\\cos x=\\dfrac{1}{2}',
    f: (x) => cos(x) - 0.5,
    serii: [s(u(1, 3)), s(u(-1, 3))],
    promezhutok: otrezok(u(-5, 2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['prosteyshie'],
    reshenie: [
      'Косинус — абсцисса точки. Проводим вертикальную прямую $x=\\dfrac{1}{2}$: она пересекает окружность в двух точках, симметричных относительно оси косинусов.',
      'Верхняя точка — $\\dfrac{\\pi}{3}$, так как $\\cos\\dfrac{\\pi}{3}=\\dfrac{1}{2}$; нижняя — $-\\dfrac{\\pi}{3}$.',
      'Отсюда $x=\\pm\\dfrac{\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какую прямую проводим?', ['Вертикальную $x=\\dfrac{1}{2}$', 'Горизонтальную $y=\\dfrac{1}{2}$'], 0),
      v('Решения $\\cos x=\\dfrac{1}{2}$:', ['$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=\\dfrac{\\pi}{3}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z01-03',
    iz: 'авторская',
    uravnenie: '\\sin x=0',
    f: (x) => sin(x),
    serii: [s(u(0), 1)],
    promezhutok: otrezok(u(-3, 2), u(3, 2)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Ордината равна нулю у двух точек окружности: правой ($0$) и левой ($\\pi$). Они лежат на оси косинусов.',
      'Точки диаметрально противоположны: от одной до другой — пол-оборота. Поэтому обе записываются одной серией с шагом $\\pi$: $x=\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какие точки окружности имеют $\\sin x=0$?', ['Правая и левая', 'Верхняя и нижняя', 'Только правая'], 0),
      v('Решения $\\sin x=0$:', ['$x=\\pi k$', '$x=2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$'], 0, 'Частный случай: записываем без $(-1)^k$.'),
      v('Сколько корней на $\\left[-\\dfrac{3\\pi}{2};\\,\\dfrac{3\\pi}{2}\\right]$?', ['Три', 'Два', 'Четыре'], 0, 'Это $-\\pi$, $0$ и $\\pi$.'),
    ],
  }),
  ur({
    id: 'z01-04',
    iz: 'авторская',
    uravnenie: '\\cos x=0',
    f: (x) => cos(x),
    serii: [s(u(1, 2), 1)],
    promezhutok: otrezok(u(2), u(7, 2)),
    otbor: 'nerav',
    metody: ['prosteyshie'],
    reshenie: [
      'Абсцисса равна нулю у верхней ($\\dfrac{\\pi}{2}$) и нижней ($-\\dfrac{\\pi}{2}$) точек окружности.',
      'Эти точки диаметрально противоположны, поэтому серия одна, с шагом $\\pi$: $x=\\dfrac{\\pi}{2}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какие точки окружности имеют $\\cos x=0$?', ['Верхняя и нижняя', 'Правая и левая', 'Только верхняя'], 0),
      v('Решения $\\cos x=0$:', ['$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=\\dfrac{\\pi}{2}+2\\pi k$', '$x=\\pi k$'], 0, 'Записи $\\pm\\dfrac{\\pi}{2}+2\\pi k$ — то же самое, но длиннее.'),
    ],
  }),
  ur({
    id: 'z01-05',
    iz: 'авторская',
    uravnenie: '\\sin x=1',
    f: (x) => sin(x) - 1,
    serii: [s(u(1, 2))],
    promezhutok: otrezok(u(-4), u(-1)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Ордината равна $1$ только у одной точки — верхней, $\\dfrac{\\pi}{2}$: прямая $y=1$ касается окружности.',
      'В эту точку возвращаемся через полный оборот: $x=\\dfrac{\\pi}{2}+2\\pi k,\\ k\\in\\mathbb{Z}$. Шаг $\\pi$ здесь — ошибка: он добавил бы нижнюю точку, где $\\sin x=-1$.',
    ],
    podskazki: [
      v('Сколько точек окружности имеют $\\sin x=1$?', ['Одна', 'Две', 'Четыре'], 0),
      v('Решения $\\sin x=1$:', ['$x=\\dfrac{\\pi}{2}+2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=\\pi k$'], 0),
      v('Сколько корней на $[-4\\pi;\\,-\\pi]$?', ['Два', 'Один', 'Три'], 0, 'Это $-\\dfrac{7\\pi}{2}$ и $-\\dfrac{3\\pi}{2}$.'),
    ],
  }),
  ur({
    id: 'z01-06',
    iz: 'авторская',
    uravnenie: '\\cos x=-1',
    f: (x) => cos(x) + 1,
    serii: [s(u(1))],
    promezhutok: promezhutok(otrezok(u(-3), u(0)), [true, false]),
    otbor: 'nerav',
    metody: ['prosteyshie'],
    reshenie: [
      'Абсцисса равна $-1$ только у левой точки окружности, $\\pi$: прямая $x=-1$ касается окружности.',
      'Одна точка — одна серия с шагом полного оборота: $x=\\pi+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('Какая точка окружности имеет $\\cos x=-1$?', ['Левая, $\\pi$', 'Нижняя, $-\\dfrac{\\pi}{2}$', 'Правая, $0$'], 0),
      v('Решения $\\cos x=-1$:', ['$x=\\pi+2\\pi k$', '$x=\\pi k$', '$x=\\pm\\pi+\\pi k$'], 0),
      v('Входит ли $-3\\pi$ в промежуток $[-3\\pi;\\,0)$?', ['Да, левая скобка квадратная', 'Нет, скобка круглая'], 0),
    ],
  }),
  ur({
    id: 'z01-07',
    iz: 'авторская',
    uravnenie: '\\operatorname{tg}x=-\\sqrt{3}',
    f: (x) => tg(x) + sqrt(3),
    odz: ODZ_TG,
    serii: [s(u(-1, 3), 1)],
    promezhutok: otrezok(u(0), u(2)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Тангенс определён при $\\cos x\\ne0$. На оси тангенсов (касательная в точке $0$) отмечаем $-\\sqrt{3}$ и проводим луч из центра — он выходит к точке $-\\dfrac{\\pi}{3}$, ведь $\\operatorname{tg}\\dfrac{\\pi}{3}=\\sqrt{3}$, а тангенс нечётен.',
      'Прямая через центр пересекает окружность ещё в противоположной точке $\\dfrac{2\\pi}{3}$ — тангенс там тот же. У тангенса период $\\pi$: $x=-\\dfrac{\\pi}{3}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('$\\operatorname{arctg}(-\\sqrt{3})$ равен', ['$-\\dfrac{\\pi}{3}$', '$-\\dfrac{\\pi}{6}$', '$\\dfrac{2\\pi}{3}$'], 0, 'Арктангенс лежит в $\\left(-\\dfrac{\\pi}{2};\\,\\dfrac{\\pi}{2}\\right)$.'),
      v('Решения $\\operatorname{tg}x=-\\sqrt{3}$:', ['$x=-\\dfrac{\\pi}{3}+\\pi k$', '$x=-\\dfrac{\\pi}{3}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{3}+\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z01-08',
    iz: 'авторская',
    uravnenie: '\\operatorname{ctg}x=1',
    f: (x) => ctg(x) - 1,
    odz: ODZ_CTG,
    serii: [s(u(1, 4), 1)],
    promezhutok: otrezok(u(-1), u(1, 2)),
    otbor: 'nerav',
    metody: ['prosteyshie'],
    reshenie: [
      'Котангенс определён при $\\sin x\\ne0$. $\\operatorname{ctg}\\dfrac{\\pi}{4}=\\dfrac{\\cos\\frac{\\pi}{4}}{\\sin\\frac{\\pi}{4}}=1$, то есть $\\operatorname{arcctg}1=\\dfrac{\\pi}{4}$.',
      'Период котангенса — $\\pi$: та же прямая через центр проходит и через $\\dfrac{5\\pi}{4}$. Итог: $x=\\dfrac{\\pi}{4}+\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('При каком угле из $(0;\\,\\pi)$ котангенс равен $1$?', ['$\\dfrac{\\pi}{4}$', '$\\dfrac{3\\pi}{4}$', '$\\dfrac{\\pi}{6}$'], 0),
      v('Решения $\\operatorname{ctg}x=1$:', ['$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\dfrac{\\pi}{4}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$'], 0),
    ],
  }),
  ur({
    id: 'z01-09',
    iz: 'авторская',
    uravnenie: '\\operatorname{tg}x=2',
    f: (x) => tg(x) - 2,
    odz: ODZ_TG,
    serii: [s(ua(ARC.arctg(2, '2')), 1)],
    promezhutok: otrezok(u(-1), u(1)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Число $2$ не табличное значение тангенса, но уравнение $\\operatorname{tg}x=a$ имеет решения при любом $a$. Угол из $\\left(-\\dfrac{\\pi}{2};\\,\\dfrac{\\pi}{2}\\right)$ с тангенсом $2$ — это по определению $\\operatorname{arctg}2$.',
      'Период тангенса $\\pi$: $x=\\operatorname{arctg}2+\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Для отбора полезна оценка: $\\operatorname{tg}\\dfrac{\\pi}{4}=1<2<\\sqrt{3}=\\operatorname{tg}\\dfrac{\\pi}{3}$, поэтому $\\dfrac{\\pi}{4}<\\operatorname{arctg}2<\\dfrac{\\pi}{3}$.',
    ],
    podskazki: [
      v('Есть ли решения у $\\operatorname{tg}x=2$?', ['Да, тангенс принимает любые значения', 'Нет, $2>1$'], 0),
      v('Решения:', ['$x=\\operatorname{arctg}2+\\pi k$', '$x=\\pm\\operatorname{arctg}2+2\\pi k$', '$x=\\operatorname{arctg}2+2\\pi k$'], 0),
      v('Между какими углами лежит $\\operatorname{arctg}2$?', ['$\\dfrac{\\pi}{4}$ и $\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{3}$ и $\\dfrac{\\pi}{2}$', '$0$ и $\\dfrac{\\pi}{6}$'], 0, '$1<2<\\sqrt{3}$, а тангенс на этом участке растёт.'),
    ],
  }),
  ur({
    id: 'z01-10',
    iz: 'авторская',
    uravnenie: '\\cos x=-\\dfrac{\\sqrt{3}}{2}',
    f: (x) => cos(x) + sqrt(3) / 2,
    serii: [s(u(5, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(1, 2), u(2)),
    otbor: 'krug',
    metody: ['prosteyshie'],
    reshenie: [
      'Прямая $x=-\\dfrac{\\sqrt{3}}{2}$ пересекает окружность в двух точках левой половины, симметричных относительно оси косинусов.',
      '$\\arccos\\left(-\\dfrac{\\sqrt{3}}{2}\\right)=\\pi-\\dfrac{\\pi}{6}=\\dfrac{5\\pi}{6}$ — верхняя точка, нижняя — $-\\dfrac{5\\pi}{6}$.',
      'Итог: $x=\\pm\\dfrac{5\\pi}{6}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('$\\arccos\\left(-\\dfrac{\\sqrt{3}}{2}\\right)$ равен', ['$\\dfrac{5\\pi}{6}$', '$-\\dfrac{\\pi}{6}$', '$\\dfrac{2\\pi}{3}$'], 0, '$\\arccos(-a)=\\pi-\\arccos a$.'),
      v('Решения $\\cos x=-\\dfrac{\\sqrt{3}}{2}$:', ['$x=\\pm\\dfrac{5\\pi}{6}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=-\\dfrac{\\pi}{6}+2\\pi k$'], 0),
    ],
  }),
];
