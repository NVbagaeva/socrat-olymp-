/**
 * Блок 04 «Отбор корней по окружности»: уравнения простые, смысл
 * блока — пункт б. У всех задач с промежутком отбор по окружности.
 * Первая задача — с полным разбором (промежуток б свой), две разминки —
 * в формате части 1.
 */

import { cos, ctg, otrezok, PI, promezhutok, rz, s, sin, sqrt, tg, u, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

export const ZADACHI_04: Zadacha14[] = [
  ur({
    id: 'z04-01',
    iz: 'авторская',
    uravnenie: '\\sin\\left(\\dfrac{\\pi}{2}-x\\right)-\\cos(3\\pi-2x)=0',
    f: (x) => sin(PI / 2 - x) - cos(3 * PI - 2 * x),
    serii: [s(u(1)), s(u(1, 3)), s(u(-1, 3))],
    promezhutok: otrezok(u(1, 2), u(7, 2)),
    otbor: 'krug',
    metody: ['otbor-krug', 'privedenie', 'zamena'],
    reshenie: [
      'Упростим оба слагаемых формулами приведения. $\\sin\\left(\\dfrac{\\pi}{2}-x\\right)=\\cos x$: при $\\dfrac{\\pi}{2}$ функция меняется, угол в I четверти, синус там положителен.',
      '$\\cos(3\\pi-2x)=\\cos(\\pi-2x)$, так как $2\\pi$ — период. Функция не меняется, угол $\\pi-2x$ во II четверти, косинус там отрицателен: $\\cos(3\\pi-2x)=-\\cos 2x$.',
      'Уравнение принимает вид $\\cos x+\\cos 2x=0$. Чтобы осталась одна функция, берём $\\cos 2x=2\\cos^2x-1$: $2\\cos^2x+\\cos x-1=0$.',
      'Замена $t=\\cos x$, $|t|\\le1$: $2t^2+t-1=0$, $D=1+8=9$, корни $t=\\dfrac{1}{2}$ и $t=-1$ — оба подходят.',
      '$\\cos x=-1\\ \\Leftrightarrow\\ x=\\pi+2\\pi k$; $\\cos x=\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    ],
    podskazki: [
      v('$\\sin\\left(\\dfrac{\\pi}{2}-x\\right)$ равен', ['$\\cos x$', '$-\\cos x$', '$\\sin x$'], 0),
      v('$\\cos(3\\pi-2x)$ равен', ['$-\\cos 2x$', '$\\cos 2x$', '$\\sin 2x$'], 0, '$3\\pi-2x$ отличается от $\\pi-2x$ на период; угол во II четверти.'),
      v('Корни $2t^2+t-1=0$:', ['$\\dfrac{1}{2}$ и $-1$', '$-\\dfrac{1}{2}$ и $1$', '$1$ и $-2$'], 0),
      v('Сколько корней на $\\left[\\dfrac{\\pi}{2};\\,\\dfrac{7\\pi}{2}\\right]$?', ['Четыре', 'Три', 'Пять'], 0, 'Это $\\pi,\\ \\dfrac{5\\pi}{3},\\ \\dfrac{7\\pi}{3},\\ 3\\pi$.'),
    ],
  }),
  ur({
    id: 'z04-02',
    iz: 'авторская',
    uravnenie: '2\\cos x=\\sqrt{3}',
    f: (x) => 2 * cos(x) - sqrt(3),
    serii: [s(u(1, 6)), s(u(-1, 6))],
    promezhutok: otrezok(u(-3), u(-3, 2)),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$\\cos x=\\dfrac{\\sqrt{3}}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{\\pi}{6}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'На окружности — две точки правой половины, симметричные относительно оси косинусов.',
    ],
    podskazki: [
      v('Решения $\\cos x=\\dfrac{\\sqrt{3}}{2}$:', ['$x=\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$x=\\dfrac{\\pi}{6}+\\pi k$'], 0),
      v('Где на окружности точка $-3\\pi$?', ['Левая точка', 'Правая точка', 'Нижняя точка'], 0, '$-3\\pi=\\pi-4\\pi$.'),
      v('Какие корни на дуге?', ['$-\\dfrac{13\\pi}{6}$ и $-\\dfrac{11\\pi}{6}$', '$-\\dfrac{11\\pi}{6}$ и $-\\dfrac{\\pi}{6}$', '$-\\dfrac{13\\pi}{6}$ и $-\\dfrac{7\\pi}{6}$'], 0, 'Считаем от $-2\\pi$: на $\\dfrac{\\pi}{6}$ назад и вперёд.'),
    ],
  }),
  ur({
    id: 'z04-03',
    iz: 'авторская',
    uravnenie: '\\sin x=-\\dfrac{1}{2}',
    f: (x) => sin(x) + 0.5,
    serii: [s(u(-1, 6)), s(u(-5, 6))],
    promezhutok: otrezok(u(3), u(11, 2)),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$x=-\\dfrac{\\pi}{6}+2\\pi k$ или $x=-\\dfrac{5\\pi}{6}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Прямая $y=-\\dfrac{1}{2}$ пересекает окружность в двух точках нижней половины, симметричных относительно оси синусов: $-\\dfrac{\\pi}{6}$ и $-\\dfrac{5\\pi}{6}$.',
    ],
    podskazki: [
      v('Решения $\\sin x=-\\dfrac{1}{2}$:', ['$-\\dfrac{\\pi}{6}+2\\pi k$ и $-\\dfrac{5\\pi}{6}+2\\pi k$', '$\\pm\\dfrac{\\pi}{6}+2\\pi k$', '$-\\dfrac{\\pi}{3}+2\\pi k$ и $-\\dfrac{2\\pi}{3}+2\\pi k$'], 0),
      v('Сколько окружностей нужно для $\\left[3\\pi;\\,\\dfrac{11\\pi}{2}\\right]$?', ['Две', 'Одна', 'Три'], 0, 'Длина промежутка $\\dfrac{5\\pi}{2}>2\\pi$.'),
      v('Сколько корней на промежутке?', ['Три', 'Два', 'Четыре'], 0),
    ],
  }),
  ur({
    id: 'z04-04',
    iz: 'авторская',
    uravnenie: '\\operatorname{tg}x=1',
    f: (x) => tg(x) - 1,
    odz: (x) => Math.abs(cos(x)) > 1e-6,
    serii: [s(u(1, 4), 1)],
    promezhutok: promezhutok(otrezok(u(1, 4), u(9, 4)), [false, true]),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$x=\\dfrac{\\pi}{4}+\\pi k,\\ k\\in\\mathbb{Z}$: на окружности точки $\\dfrac{\\pi}{4}$ и $\\dfrac{5\\pi}{4}$.',
      'Точки $\\dfrac{\\pi}{4}$ и $\\dfrac{5\\pi}{4}$ диаметрально противоположны, поэтому серия одна — с шагом $\\pi$.',
    ],
    podskazki: [
      v('Решения $\\operatorname{tg}x=1$:', ['$x=\\dfrac{\\pi}{4}+\\pi k$', '$x=\\dfrac{\\pi}{4}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+\\pi k$'], 0),
      v('Входит ли $\\dfrac{\\pi}{4}$ в ответ пункта б?', ['Нет, левая скобка круглая', 'Да'], 0),
      v('Корни на промежутке:', ['$\\dfrac{5\\pi}{4}$ и $\\dfrac{9\\pi}{4}$', '$\\dfrac{\\pi}{4}$ и $\\dfrac{5\\pi}{4}$', '$\\dfrac{\\pi}{4},\\ \\dfrac{5\\pi}{4},\\ \\dfrac{9\\pi}{4}$'], 0),
    ],
  }),
  ur({
    id: 'z04-05',
    iz: 'авторская',
    uravnenie: '2\\sin x+\\sqrt{2}=0',
    f: (x) => 2 * sin(x) + sqrt(2),
    serii: [s(u(-1, 4)), s(u(-3, 4))],
    promezhutok: otrezok(u(-3), u(-1)),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$\\sin x=-\\dfrac{\\sqrt{2}}{2}\\ \\Leftrightarrow\\ x=-\\dfrac{\\pi}{4}+2\\pi k$ или $x=-\\dfrac{3\\pi}{4}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Это две точки нижней половины окружности, симметричные относительно оси синусов.',
    ],
    podskazki: [
      v('Решения $\\sin x=-\\dfrac{\\sqrt{2}}{2}$:', ['$-\\dfrac{\\pi}{4}+2\\pi k$ и $-\\dfrac{3\\pi}{4}+2\\pi k$', '$\\pm\\dfrac{\\pi}{4}+2\\pi k$', '$-\\dfrac{\\pi}{4}+\\pi k$'], 0),
      v('Корни на $[-3\\pi;\\,-\\pi]$:', ['$-\\dfrac{11\\pi}{4}$ и $-\\dfrac{9\\pi}{4}$', '$-\\dfrac{9\\pi}{4}$ и $-\\dfrac{7\\pi}{4}$', '$-\\dfrac{11\\pi}{4}$ и $-\\dfrac{5\\pi}{4}$'], 0),
    ],
  }),
  ur({
    id: 'z04-06',
    iz: 'авторская',
    uravnenie: '\\operatorname{ctg}x=-\\sqrt{3}',
    f: (x) => ctg(x) + sqrt(3),
    odz: (x) => Math.abs(sin(x)) > 1e-6,
    serii: [s(u(5, 6), 1)],
    promezhutok: promezhutok(otrezok(u(-1, 2), u(2)), [true, false]),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$\\operatorname{arcctg}(-\\sqrt{3})=\\pi-\\dfrac{\\pi}{6}=\\dfrac{5\\pi}{6}$, период $\\pi$: $x=\\dfrac{5\\pi}{6}+\\pi k,\\ k\\in\\mathbb{Z}$. Точки окружности: $\\dfrac{5\\pi}{6}$ и $-\\dfrac{\\pi}{6}$.',
      'Прямая через центр и точку $\\dfrac{5\\pi}{6}$ проходит и через противоположную точку $-\\dfrac{\\pi}{6}$ — поэтому шаг $\\pi$, а не $2\\pi$.',
    ],
    podskazki: [
      v('$\\operatorname{arcctg}(-\\sqrt{3})$ равен', ['$\\dfrac{5\\pi}{6}$', '$-\\dfrac{\\pi}{6}$', '$\\dfrac{2\\pi}{3}$'], 0, 'Арккотангенс лежит в $(0;\\,\\pi)$.'),
      v('Сколько корней на $\\left[-\\dfrac{\\pi}{2};\\,2\\pi\\right)$?', ['Три', 'Два', 'Четыре'], 0),
    ],
  }),
  ur({
    id: 'z04-07',
    iz: 'авторская',
    uravnenie: '\\sqrt{2}\\cos x+1=0',
    f: (x) => sqrt(2) * cos(x) + 1,
    serii: [s(u(3, 4)), s(u(-3, 4))],
    promezhutok: otrezok(u(-2), u(1, 2)),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$\\cos x=-\\dfrac{\\sqrt{2}}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{3\\pi}{4}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'На окружности — две точки левой половины, симметричные относительно оси косинусов: $\\dfrac{3\\pi}{4}$ и $-\\dfrac{3\\pi}{4}$.',
    ],
    podskazki: [
      v('Решения $\\cos x=-\\dfrac{\\sqrt{2}}{2}$:', ['$x=\\pm\\dfrac{3\\pi}{4}+2\\pi k$', '$x=\\pm\\dfrac{\\pi}{4}+2\\pi k$', '$x=\\dfrac{3\\pi}{4}+\\pi k$'], 0),
      v('Есть ли корни на дуге от $0$ до $\\dfrac{\\pi}{2}$?', ['Нет', 'Да, $\\dfrac{3\\pi}{4}$', 'Да, $\\dfrac{\\pi}{4}$'], 0, 'Корни лежат в левой половине окружности.'),
      v('Корни на $\\left[-2\\pi;\\,\\dfrac{\\pi}{2}\\right]$:', ['$-\\dfrac{5\\pi}{4}$ и $-\\dfrac{3\\pi}{4}$', '$-\\dfrac{5\\pi}{4},\\ -\\dfrac{3\\pi}{4},\\ \\dfrac{3\\pi}{4}$', '$-\\dfrac{7\\pi}{4}$ и $-\\dfrac{\\pi}{4}$'], 0),
    ],
  }),
  ur({
    id: 'z04-08',
    iz: 'авторская',
    uravnenie: '2\\sin x=\\sqrt{3}',
    f: (x) => 2 * sin(x) - sqrt(3),
    serii: [s(u(1, 3)), s(u(2, 3))],
    promezhutok: otrezok(u(-2), u(-1, 2)),
    otbor: 'krug',
    metody: ['otbor-krug', 'prosteyshie'],
    reshenie: [
      '$\\sin x=\\dfrac{\\sqrt{3}}{2}\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{3}+2\\pi k$ или $x=\\dfrac{2\\pi}{3}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
      'Это две точки верхней половины окружности, симметричные относительно оси синусов: $\\dfrac{2\\pi}{3}=\\pi-\\dfrac{\\pi}{3}$.',
    ],
    podskazki: [
      v('Решения $\\sin x=\\dfrac{\\sqrt{3}}{2}$:', ['$\\dfrac{\\pi}{3}+2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$', '$\\pm\\dfrac{\\pi}{3}+2\\pi k$', '$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{5\\pi}{6}+2\\pi k$'], 0),
      v('От какого конца удобно считать корни?', ['От $-2\\pi$', 'От $-\\dfrac{\\pi}{2}$', 'От $0$'], 0, 'Обе точки ближе к правой точке $-2\\pi$.'),
      v('Корни на промежутке:', ['$-\\dfrac{5\\pi}{3}$ и $-\\dfrac{4\\pi}{3}$', '$-\\dfrac{5\\pi}{3}$ и $-\\dfrac{2\\pi}{3}$', '$-\\dfrac{4\\pi}{3}$ и $-\\dfrac{\\pi}{3}$'], 0),
    ],
  }),
  rz({
    id: 'z04-09',
    iz: 'лист 22, №14',
    uravnenie: '\\sin\\dfrac{\\pi(x+9)}{4}=-\\dfrac{\\sqrt{2}}{2}',
    vopros: 'min-pol',
    f: (x) => sin((PI * (x + 9)) / 4) + sqrt(2) / 2,
    serii: [
      { x0: -2, h: 8, tex: '$x=-2+8k$' },
      { x0: 4, h: 8, tex: '$x=4+8k$' },
    ],
    otvet: 4,
    metody: ['otbor-krug', 'argument'],
    reshenie: [
      '$\\dfrac{\\pi(x+9)}{4}=-\\dfrac{\\pi}{4}+2\\pi k$ или $\\dfrac{\\pi(x+9)}{4}=-\\dfrac{3\\pi}{4}+2\\pi k$.',
      'Умножаем на $\\dfrac{4}{\\pi}$: $x+9=-1+8k$ или $x+9=-3+8k$, то есть $x=-10+8k$ или $x=-12+8k$. Сдвинув номер: $x=-2+8k$ или $x=4+8k,\\ k\\in\\mathbb{Z}$.',
      'Положительные корни первой серии: $6,\\ 14,\\ \\ldots$, второй: $4,\\ 12,\\ \\ldots$ Наименьший положительный — $4$.',
    ],
    podskazki: [
      v('Решения относительно аргумента:', ['$-\\dfrac{\\pi}{4}+2\\pi k$ и $-\\dfrac{3\\pi}{4}+2\\pi k$', '$\\pm\\dfrac{\\pi}{4}+2\\pi k$', '$-\\dfrac{\\pi}{4}+\\pi k$'], 0),
      v('Корни в числах:', ['$x=-10+8k$ и $x=-12+8k$', '$x=-10+2k$ и $x=-12+2k$', '$x=-8+8k$ и $x=-6+8k$'], 0),
      v('Наименьший положительный корень:', ['$4$', '$6$', '$2$'], 0),
    ],
  }),
  rz({
    id: 'z04-10',
    iz: 'лист 22, №15',
    uravnenie: '\\sin\\dfrac{\\pi(4x-3)}{4}=1',
    vopros: 'max-otr',
    f: (x) => sin((PI * (4 * x - 3)) / 4) - 1,
    serii: [{ x0: 1.25, h: 2, tex: '$x=\\dfrac{5}{4}+2k$' }],
    otvet: -0.75,
    metody: ['otbor-krug', 'argument'],
    reshenie: [
      '$\\sin t=1$ только при $t=\\dfrac{\\pi}{2}+2\\pi k$: $\\dfrac{\\pi(4x-3)}{4}=\\dfrac{\\pi}{2}+2\\pi k$.',
      'Умножаем на $\\dfrac{4}{\\pi}$: $4x-3=2+8k$, $x=\\dfrac{5}{4}+2k,\\ k\\in\\mathbb{Z}$.',
      'Корни: $\\ldots,\\ -2{,}75,\\ -0{,}75,\\ 1{,}25,\\ \\ldots$ Наибольший отрицательный — $-0{,}75$.',
    ],
    podskazki: [
      v('Решения $\\sin t=1$:', ['$t=\\dfrac{\\pi}{2}+2\\pi k$', '$t=\\dfrac{\\pi}{2}+\\pi k$', '$t=\\pi k$'], 0),
      v('Корни в числах:', ['$x=\\dfrac{5}{4}+2k$', '$x=\\dfrac{5}{4}+8k$', '$x=\\dfrac{1}{4}+2k$'], 0),
      v('Наибольший отрицательный корень:', ['$-0{,}75$', '$-2{,}75$', '$-0{,}25$'], 0),
    ],
  }),
];
