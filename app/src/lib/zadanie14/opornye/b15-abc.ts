/**
 * Блок 15 «a sin x + b cos x = c двумя способами»: половинный угол
 * (однородное уравнение относительно $\frac{x}{2}$) и вспомогательный
 * угол. Первые две задачи — оба способа полностью, остальные — удобный
 * способ и одна фраза про второй.
 */

import { ARC, cos, otrezok, s, sin, sqrt, u, ua, ur, v } from '../dsl';
import type { Zadacha14 } from '../tipy';

const ARCTG_3_4 = ARC.arctg(3 / 4, '\\dfrac{3}{4}');
/** $2\operatorname{arctg}\frac{3}{2}$ — угол во второй четверти. */
const DVA_ARCTG_3_2 = { tex: '2\\operatorname{arctg}\\dfrac{3}{2}', v: 2 * Math.atan(1.5) };

const POLOVINNYY_SIN = [
  '$2\\sin\\alpha\\cos\\alpha$',
  '$\\sin^2\\alpha-\\cos^2\\alpha$',
  '$2\\sin\\alpha$',
];

export const ZADACHI_15: Zadacha14[] = [
  ur({
    id: 'z15-01',
    iz: 'сторонний задачник, B51',
    uravnenie: '\\sin x+\\cos x=1',
    f: (x) => sin(x) + cos(x) - 1,
    serii: [s(u(0)), s(u(1, 2))],
    promezhutok: otrezok(u(-1), u(2)),
    otbor: 'nerav',
    metody: ['abc', 'odnorodnye-2', 'vspomogatelnyy'],
    reshenie: [
      '**Способ 1 — половинный угол.** Обозначим $x=2\\alpha$, то есть $\\alpha=\\dfrac{x}{2}$, и запишем всё через $\\alpha$: $\\sin x=2\\sin\\alpha\\cos\\alpha$, $\\cos x=\\cos^2\\alpha-\\sin^2\\alpha$, а единицу справа — по основному тождеству: $1=\\sin^2\\alpha+\\cos^2\\alpha$. Зачем: тогда каждое слагаемое станет второй степени, и уравнение — однородным.',
      'Получаем $2\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha-\\sin^2\\alpha=\\sin^2\\alpha+\\cos^2\\alpha$. Переносим всё влево, $\\cos^2\\alpha$ уходит: $2\\sin\\alpha\\cos\\alpha-2\\sin^2\\alpha=0$ — однородное уравнение второй степени.',
      'Выносим общий множитель (не сокращаем!): $2\\sin\\alpha(\\cos\\alpha-\\sin\\alpha)=0\\Leftrightarrow\\left[\\begin{aligned}&\\sin\\alpha=0,\\\\&\\sin\\alpha=\\cos\\alpha.\\end{aligned}\\right.$',
      'Во втором уравнении делить на $\\cos\\alpha$ можно. Пусть $\\cos\\alpha=0$. Тогда из уравнения $\\sin\\alpha=0$, что противоречит $\\sin^2\\alpha+\\cos^2\\alpha=1$. Значит, $\\cos\\alpha\\ne0$, и $\\sin\\alpha=\\cos\\alpha\\Leftrightarrow\\operatorname{tg}\\alpha=1$.',
      'Возвращаемся к $x=2\\alpha$: $\\sin\\alpha=0\\Leftrightarrow\\alpha=\\pi k\\Leftrightarrow x=2\\pi k$; $\\operatorname{tg}\\alpha=1\\Leftrightarrow\\alpha=\\dfrac{\\pi}{4}+\\pi k\\Leftrightarrow x=\\dfrac{\\pi}{2}+2\\pi k$. Угол удвоился — и период тоже.',
      '**Способ 2 — вспомогательный угол.** Делим на $\\sqrt{1^2+1^2}=\\sqrt{2}$: $\\dfrac{\\sqrt{2}}{2}\\sin x+\\dfrac{\\sqrt{2}}{2}\\cos x=\\dfrac{\\sqrt{2}}{2}$. Коэффициенты — $\\cos\\dfrac{\\pi}{4}$ и $\\sin\\dfrac{\\pi}{4}$, сворачиваем в синус суммы: $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$.',
      '$x+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{4}+2\\pi k$ или $x+\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}+2\\pi k$, то есть $x=2\\pi k$ или $x=\\dfrac{\\pi}{2}+2\\pi k$ — те же серии.',
      '**Какой способ выбрать.** Если $\\sqrt{a^2+b^2}$ «хороший» и после деления получаются табличные косинус и синус (как здесь: $\\dfrac{\\sqrt{2}}{2}$) — быстрее вспомогательный угол. Если угол не табличный (например, в $3\\sin x+2\\cos x=2$ делить пришлось бы на $\\sqrt{13}$) — надёжнее половинный угол: он всегда даёт однородное уравнение, а ответ — через $\\operatorname{tg}\\dfrac{x}{2}$.',
    ],
    podskazki: [
      v('Как записать $\\sin x$ через $\\alpha=\\dfrac{x}{2}$?', POLOVINNYY_SIN, 0),
      v(
        'Что получится после переноса всего влево?',
        [
          '$2\\sin\\alpha\\cos\\alpha-2\\sin^2\\alpha=0$',
          '$2\\sin\\alpha\\cos\\alpha+2\\cos^2\\alpha=0$',
          '$2\\sin\\alpha\\cos\\alpha-1=0$',
        ],
        0,
        'Единицу справа мы записали как $\\sin^2\\alpha+\\cos^2\\alpha$.',
      ),
      v(
        'Как решить $2\\sin\\alpha(\\cos\\alpha-\\sin\\alpha)=0$?',
        [
          '$\\sin\\alpha=0$ или $\\sin\\alpha=\\cos\\alpha$',
          'Только $\\sin\\alpha=\\cos\\alpha$',
          'Только $\\sin\\alpha=0$',
        ],
        0,
        'Произведение равно нулю, когда хотя бы один множитель равен нулю.',
      ),
      v(
        'Серии для $x$ из $\\alpha=\\pi k$ и $\\alpha=\\dfrac{\\pi}{4}+\\pi k$:',
        [
          '$x=2\\pi k$ и $x=\\dfrac{\\pi}{2}+2\\pi k$',
          '$x=\\pi k$ и $x=\\dfrac{\\pi}{4}+\\pi k$',
          '$x=\\dfrac{\\pi k}{2}$ и $x=\\dfrac{\\pi}{8}+\\dfrac{\\pi k}{2}$',
        ],
        0,
      ),
      v(
        'Вспомогательный угол: $\\sin x+\\cos x$ равно',
        [
          '$\\sqrt{2}\\sin\\left(x+\\dfrac{\\pi}{4}\\right)$',
          '$2\\sin\\left(x+\\dfrac{\\pi}{4}\\right)$',
          '$\\sqrt{2}\\sin\\left(x+\\dfrac{\\pi}{2}\\right)$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-02',
    iz: 'сторонний задачник, C1',
    uravnenie: '3\\sin x+4\\cos x=5',
    f: (x) => 3 * sin(x) + 4 * cos(x) - 5,
    serii: [s(ua(ARCTG_3_4))],
    promezhutok: otrezok(u(-1, 2), u(5, 2)),
    otbor: 'krug',
    metody: ['abc', 'vspomogatelnyy', 'odnorodnye-2'],
    reshenie: [
      '**Способ 1 — половинный угол**, $\\alpha=\\dfrac{x}{2}$: $6\\sin\\alpha\\cos\\alpha+4\\cos^2\\alpha-4\\sin^2\\alpha=5\\sin^2\\alpha+5\\cos^2\\alpha$, то есть $9\\sin^2\\alpha-6\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha=0$.',
      'Слева полный квадрат: $(3\\sin\\alpha-\\cos\\alpha)^2=0\\Leftrightarrow\\cos\\alpha=3\\sin\\alpha$. Пусть $\\cos\\alpha=0$. Тогда и $\\sin\\alpha=0$, что противоречит $\\sin^2\\alpha+\\cos^2\\alpha=1$. Значит, $\\cos\\alpha\\ne0$, делим: $\\operatorname{tg}\\alpha=\\dfrac{1}{3}$.',
      '$\\alpha=\\operatorname{arctg}\\dfrac{1}{3}+\\pi k$, откуда $x=2\\operatorname{arctg}\\dfrac{1}{3}+2\\pi k$.',
      '**Способ 2 — вспомогательный угол.** $\\sqrt{3^2+4^2}=5$, делим: $\\dfrac{3}{5}\\sin x+\\dfrac{4}{5}\\cos x=1$. Возьмём угол $\\varphi$ первой четверти с $\\sin\\varphi=\\dfrac{3}{5}$, $\\cos\\varphi=\\dfrac{4}{5}$; у него $\\operatorname{tg}\\varphi=\\dfrac{3}{4}$, то есть $\\varphi=\\operatorname{arctg}\\dfrac{3}{4}$.',
      'Слева $\\cos x\\cos\\varphi+\\sin x\\sin\\varphi=\\cos(x-\\varphi)$, и уравнение — $\\cos(x-\\varphi)=1$: $x-\\varphi=2\\pi k$, $x=\\operatorname{arctg}\\dfrac{3}{4}+2\\pi k$.',
      'Ответы записаны по-разному, но серия одна: $2\\operatorname{arctg}\\dfrac{1}{3}=\\operatorname{arctg}\\dfrac{3}{4}$. Пусть $\\beta=\\operatorname{arctg}\\dfrac{1}{3}$. По формуле тангенса двойного угла $\\operatorname{tg}2\\beta=\\dfrac{2\\operatorname{tg}\\beta}{1-\\operatorname{tg}^2\\beta}=\\dfrac{2\\cdot\\frac{1}{3}}{1-\\frac{1}{9}}=\\dfrac{3}{4}$. А так как $0<\\dfrac{1}{3}<1$, то $0<\\beta<\\dfrac{\\pi}{4}$ и $0<2\\beta<\\dfrac{\\pi}{2}$ — там же, где лежит $\\operatorname{arctg}\\dfrac{3}{4}$. Углы из $\\left(-\\dfrac{\\pi}{2};\\,\\dfrac{\\pi}{2}\\right)$ с равными тангенсами равны.',
      'Здесь удобнее вспомогательный угол: $\\sqrt{a^2+b^2}=5$ — целое число, и справа сразу получается $1$ — наибольшее значение левой части.',
    ],
    podskazki: [
      v(
        'После перехода к половинному углу получаем',
        [
          '$9\\sin^2\\alpha-6\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha=0$',
          '$\\sin^2\\alpha-6\\sin\\alpha\\cos\\alpha+9\\cos^2\\alpha=0$',
          '$6\\sin\\alpha\\cos\\alpha-\\sin^2\\alpha=5$',
        ],
        0,
      ),
      v(
        '$(3\\sin\\alpha-\\cos\\alpha)^2=0$ даёт',
        [
          '$\\operatorname{tg}\\alpha=\\dfrac{1}{3}$',
          '$\\operatorname{tg}\\alpha=3$',
          '$\\operatorname{tg}\\alpha=\\pm\\dfrac{1}{3}$',
        ],
        0,
      ),
      v('На что делим во втором способе?', ['$5$', '$7$', '$25$'], 0, '$\\sqrt{9+16}=5$.'),
      v(
        'Почему $2\\operatorname{arctg}\\dfrac{1}{3}=\\operatorname{arctg}\\dfrac{3}{4}$?',
        [
          'Тангенс двойного угла равен $\\dfrac{3}{4}$, и оба угла лежат в $\\left(0;\\,\\dfrac{\\pi}{2}\\right)$',
          'Это неверно: $2\\cdot\\dfrac{1}{3}\\ne\\dfrac{3}{4}$, серии разные',
          'Всегда $2\\operatorname{arctg}a=\\operatorname{arctg}2a$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-03',
    iz: 'сторонний задачник, C2',
    uravnenie: '3\\sin x+2\\cos x=2',
    f: (x) => 3 * sin(x) + 2 * cos(x) - 2,
    serii: [s(u(0)), s(ua(DVA_ARCTG_3_2))],
    promezhutok: otrezok(u(-1), u(2)),
    otbor: 'krug',
    metody: ['abc', 'odnorodnye-2'],
    reshenie: [
      '$\\sqrt{3^2+2^2}=\\sqrt{13}$ — угол не табличный, поэтому решаем через половинный угол, $\\alpha=\\dfrac{x}{2}$: $6\\sin\\alpha\\cos\\alpha+2\\cos^2\\alpha-2\\sin^2\\alpha=2\\sin^2\\alpha+2\\cos^2\\alpha$.',
      '$\\cos^2\\alpha$ уходит: $6\\sin\\alpha\\cos\\alpha-4\\sin^2\\alpha=0\\Leftrightarrow 2\\sin\\alpha(3\\cos\\alpha-2\\sin\\alpha)=0$.',
      '$\\sin\\alpha=0$: $\\alpha=\\pi k$, $x=2\\pi k$.',
      '$2\\sin\\alpha=3\\cos\\alpha$: если $\\cos\\alpha=0$, то и $\\sin\\alpha=0$ — противоречие, значит, делим на $\\cos\\alpha$: $\\operatorname{tg}\\alpha=\\dfrac{3}{2}$, $\\alpha=\\operatorname{arctg}\\dfrac{3}{2}+\\pi k$, $x=2\\operatorname{arctg}\\dfrac{3}{2}+2\\pi k$.',
      'Вспомогательный угол дал бы $\\sin(x+\\varphi)=\\dfrac{2}{\\sqrt{13}}$ с нетабличным $\\varphi$ — ответ вышел бы громоздким.',
    ],
    podskazki: [
      v(
        'Какой способ здесь удобнее?',
        [
          'Половинный угол: $\\sqrt{13}$ не даёт табличного угла',
          'Вспомогательный угол: делим на $\\sqrt{13}$',
          'Замена $t=\\sin x$',
        ],
        0,
      ),
      v(
        'Однородное уравнение после переноса:',
        [
          '$6\\sin\\alpha\\cos\\alpha-4\\sin^2\\alpha=0$',
          '$6\\sin\\alpha\\cos\\alpha-4\\cos^2\\alpha=0$',
          '$6\\sin\\alpha\\cos\\alpha=2$',
        ],
        0,
      ),
      v(
        'Из $2\\sin\\alpha=3\\cos\\alpha$:',
        [
          '$\\operatorname{tg}\\alpha=\\dfrac{3}{2}$',
          '$\\operatorname{tg}\\alpha=\\dfrac{2}{3}$',
          '$\\operatorname{tg}\\alpha=6$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$2\\pi k$ и $2\\operatorname{arctg}\\dfrac{3}{2}+2\\pi k$',
          '$\\pi k$ и $\\operatorname{arctg}\\dfrac{3}{2}+\\pi k$',
          '$2\\pi k$ и $\\operatorname{arctg}\\dfrac{3}{2}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-04',
    iz: 'авторская',
    uravnenie: '\\sin x-\\cos x=1',
    f: (x) => sin(x) - cos(x) - 1,
    serii: [s(u(1, 2)), s(u(1))],
    promezhutok: otrezok(u(-5, 2), u(-1, 2)),
    otbor: 'nerav',
    metody: ['abc', 'vspomogatelnyy'],
    reshenie: [
      'Вспомогательный угол: делим на $\\sqrt{2}$, $\\dfrac{\\sqrt{2}}{2}\\sin x-\\dfrac{\\sqrt{2}}{2}\\cos x=\\dfrac{\\sqrt{2}}{2}$, то есть $\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$.',
      '$x-\\dfrac{\\pi}{4}=\\dfrac{\\pi}{4}+2\\pi k$ или $x-\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}+2\\pi k$: $x=\\dfrac{\\pi}{2}+2\\pi k$ или $x=\\pi+2\\pi k$.',
      'Половинным углом: $2\\sin\\alpha\\cos\\alpha-\\cos^2\\alpha+\\sin^2\\alpha=\\sin^2\\alpha+\\cos^2\\alpha\\Leftrightarrow 2\\cos\\alpha(\\sin\\alpha-\\cos\\alpha)=0$ — те же серии.',
    ],
    podskazki: [
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$',
          '$\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=1$',
        ],
        0,
      ),
      v(
        '$x-\\dfrac{\\pi}{4}$ равно',
        [
          '$\\dfrac{\\pi}{4}+2\\pi k$ или $\\dfrac{3\\pi}{4}+2\\pi k$',
          '$\\pm\\dfrac{\\pi}{4}+2\\pi k$',
          '$\\dfrac{\\pi}{4}+\\pi k$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\dfrac{\\pi}{2}+2\\pi k$ и $\\pi+2\\pi k$',
          '$2\\pi k$ и $\\dfrac{\\pi}{2}+2\\pi k$',
          '$\\dfrac{\\pi}{2}+2\\pi k$ и $-\\pi+\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-05',
    iz: 'авторская',
    uravnenie: '\\sqrt{3}\\sin x-\\cos x=1',
    f: (x) => sqrt(3) * sin(x) - cos(x) - 1,
    serii: [s(u(1, 3)), s(u(1))],
    promezhutok: otrezok(u(2), u(4)),
    otbor: 'krug',
    metody: ['abc', 'vspomogatelnyy'],
    reshenie: [
      'Вспомогательный угол: делим на $2$, $\\dfrac{\\sqrt{3}}{2}\\sin x-\\dfrac{1}{2}\\cos x=\\dfrac{1}{2}$, то есть $\\sin\\left(x-\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$.',
      '$x-\\dfrac{\\pi}{6}=\\dfrac{\\pi}{6}+2\\pi k$ или $x-\\dfrac{\\pi}{6}=\\dfrac{5\\pi}{6}+2\\pi k$: $x=\\dfrac{\\pi}{3}+2\\pi k$ или $x=\\pi+2\\pi k$.',
      'Половинным углом: после переноса $2\\cos\\alpha(\\sqrt{3}\\sin\\alpha-\\cos\\alpha)=0$, откуда $\\cos\\dfrac{x}{2}=0$ или $\\operatorname{tg}\\dfrac{x}{2}=\\dfrac{\\sqrt{3}}{3}$ — тот же ответ, но длиннее.',
    ],
    podskazki: [
      v('На что делим?', ['$2$', '$\\sqrt{3}$', '$4$'], 0),
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x-\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
          '$\\sin\\left(x-\\dfrac{\\pi}{3}\\right)=\\dfrac{1}{2}$',
          '$\\cos\\left(x-\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$\\dfrac{\\pi}{3}+2\\pi k$ и $\\pi+2\\pi k$',
          '$\\dfrac{\\pi}{6}+2\\pi k$ и $\\dfrac{5\\pi}{6}+2\\pi k$',
          '$\\dfrac{\\pi}{3}+2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-06',
    iz: 'авторская',
    uravnenie: '\\sin x+\\sqrt{3}\\cos x=\\sqrt{3}',
    f: (x) => sin(x) + sqrt(3) * cos(x) - sqrt(3),
    serii: [s(u(0)), s(u(1, 3))],
    promezhutok: otrezok(u(-5, 2), u(1, 2)),
    otbor: 'nerav',
    metody: ['abc', 'vspomogatelnyy'],
    reshenie: [
      'Вспомогательный угол: делим на $2$, $\\dfrac{1}{2}\\sin x+\\dfrac{\\sqrt{3}}{2}\\cos x=\\dfrac{\\sqrt{3}}{2}$, то есть $\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$.',
      '$x+\\dfrac{\\pi}{3}=\\dfrac{\\pi}{3}+2\\pi k$ или $x+\\dfrac{\\pi}{3}=\\dfrac{2\\pi}{3}+2\\pi k$: $x=2\\pi k$ или $x=\\dfrac{\\pi}{3}+2\\pi k$.',
      'Половинным углом: $2\\sin\\alpha\\cos\\alpha-2\\sqrt{3}\\sin^2\\alpha=0\\Leftrightarrow 2\\sin\\alpha(\\cos\\alpha-\\sqrt{3}\\sin\\alpha)=0$ — тоже коротко.',
    ],
    podskazki: [
      v(
        'Уравнение после свёртки:',
        [
          '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\dfrac{\\sqrt{3}}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{6}\\right)=\\dfrac{\\sqrt{3}}{2}$',
          '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)=\\sqrt{3}$',
        ],
        0,
      ),
      v(
        '$x+\\dfrac{\\pi}{3}$ равно',
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
          '$2\\pi k$ и $\\dfrac{\\pi}{3}+2\\pi k$',
          '$\\dfrac{\\pi}{3}+2\\pi k$ и $\\dfrac{2\\pi}{3}+2\\pi k$',
          '$\\pi k$',
        ],
        0,
      ),
      v(
        'Сколько корней на $\\left[-\\dfrac{5\\pi}{2};\\,\\dfrac{\\pi}{2}\\right]$?',
        ['Четыре', 'Три', 'Два'],
        0,
        '$-2\\pi$, $-\\dfrac{5\\pi}{3}$, $0$, $\\dfrac{\\pi}{3}$.',
      ),
    ],
  }),
  ur({
    id: 'z15-07',
    iz: 'авторская',
    uravnenie: '\\cos x-\\sin x=1',
    f: (x) => cos(x) - sin(x) - 1,
    serii: [s(u(0)), s(u(-1, 2))],
    promezhutok: otrezok(u(1), u(3)),
    otbor: 'krug',
    metody: ['abc', 'odnorodnye-2'],
    reshenie: [
      'Половинный угол, $\\alpha=\\dfrac{x}{2}$: $\\cos^2\\alpha-\\sin^2\\alpha-2\\sin\\alpha\\cos\\alpha=\\sin^2\\alpha+\\cos^2\\alpha\\Leftrightarrow -2\\sin^2\\alpha-2\\sin\\alpha\\cos\\alpha=0\\Leftrightarrow -2\\sin\\alpha(\\sin\\alpha+\\cos\\alpha)=0$.',
      '$\\sin\\alpha=0$: $\\alpha=\\pi k$, $x=2\\pi k$.',
      '$\\sin\\alpha=-\\cos\\alpha$: $\\cos\\alpha\\ne0$ (иначе и $\\sin\\alpha=0$), $\\operatorname{tg}\\alpha=-1$, $\\alpha=-\\dfrac{\\pi}{4}+\\pi k$, $x=-\\dfrac{\\pi}{2}+2\\pi k$.',
      'Вспомогательным углом: $\\cos\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$, $x+\\dfrac{\\pi}{4}=\\pm\\dfrac{\\pi}{4}+2\\pi k$ — так же быстро.',
    ],
    podskazki: [
      v(
        'Однородное уравнение после переноса:',
        [
          '$-2\\sin^2\\alpha-2\\sin\\alpha\\cos\\alpha=0$',
          '$2\\cos^2\\alpha-2\\sin\\alpha\\cos\\alpha=0$',
          '$-2\\sin\\alpha\\cos\\alpha=1$',
        ],
        0,
      ),
      v(
        'Множители:',
        [
          '$\\sin\\alpha=0$ или $\\operatorname{tg}\\alpha=-1$',
          '$\\cos\\alpha=0$ или $\\operatorname{tg}\\alpha=1$',
          'Только $\\operatorname{tg}\\alpha=-1$',
        ],
        0,
      ),
      v(
        'Серии для $x$:',
        [
          '$2\\pi k$ и $-\\dfrac{\\pi}{2}+2\\pi k$',
          '$\\pi k$ и $-\\dfrac{\\pi}{4}+\\pi k$',
          '$2\\pi k$ и $\\dfrac{\\pi}{2}+2\\pi k$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-08',
    iz: 'авторская',
    uravnenie: '2\\sin x+\\cos x=2',
    f: (x) => 2 * sin(x) + cos(x) - 2,
    serii: [s(u(1, 2)), s(ua(ARCTG_3_4))],
    promezhutok: otrezok(u(-1), u(3, 2)),
    otbor: 'krug',
    metody: ['abc', 'odnorodnye-2'],
    reshenie: [
      '$\\sqrt{2^2+1^2}=\\sqrt{5}$ — угол не табличный, берём половинный угол: $4\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha-\\sin^2\\alpha=2\\sin^2\\alpha+2\\cos^2\\alpha\\Leftrightarrow 3\\sin^2\\alpha-4\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha=0$.',
      'Если $\\cos\\alpha=0$, то из уравнения $\\sin\\alpha=0$ — противоречие с $\\sin^2\\alpha+\\cos^2\\alpha=1$. Значит, $\\cos\\alpha\\ne0$, делим на $\\cos^2\\alpha$: $3\\operatorname{tg}^2\\alpha-4\\operatorname{tg}\\alpha+1=0$, корни $\\operatorname{tg}\\alpha=1$ и $\\operatorname{tg}\\alpha=\\dfrac{1}{3}$.',
      '$\\operatorname{tg}\\alpha=1$: $x=\\dfrac{\\pi}{2}+2\\pi k$. $\\operatorname{tg}\\alpha=\\dfrac{1}{3}$: $x=2\\operatorname{arctg}\\dfrac{1}{3}+2\\pi k=\\operatorname{arctg}\\dfrac{3}{4}+2\\pi k$ (тангенс двойного угла равен $\\dfrac{3}{4}$, как в задаче $3\\sin x+4\\cos x=5$).',
      'Вспомогательный угол дал бы $\\sin(x+\\varphi)=\\dfrac{2}{\\sqrt{5}}$ — с нетабличными углами, неудобно.',
    ],
    podskazki: [
      v(
        'Однородное уравнение:',
        [
          '$3\\sin^2\\alpha-4\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha=0$',
          '$\\sin^2\\alpha-4\\sin\\alpha\\cos\\alpha+3\\cos^2\\alpha=0$',
          '$4\\sin\\alpha\\cos\\alpha-3\\sin^2\\alpha=2$',
        ],
        0,
      ),
      v(
        'Корни $3t^2-4t+1=0$, где $t=\\operatorname{tg}\\alpha$:',
        ['$1$ и $\\dfrac{1}{3}$', '$-1$ и $-\\dfrac{1}{3}$', '$3$ и $1$'],
        0,
      ),
      v(
        '$\\operatorname{tg}\\dfrac{x}{2}=1$ даёт',
        [
          '$x=\\dfrac{\\pi}{2}+2\\pi k$',
          '$x=\\dfrac{\\pi}{4}+\\pi k$',
          '$x=\\dfrac{\\pi}{2}+\\pi k$',
        ],
        0,
      ),
      v(
        '$2\\operatorname{arctg}\\dfrac{1}{3}$ равно',
        [
          '$\\operatorname{arctg}\\dfrac{3}{4}$',
          '$\\operatorname{arctg}\\dfrac{2}{3}$',
          '$\\operatorname{arctg}\\dfrac{1}{9}$',
        ],
        0,
      ),
    ],
  }),
  ur({
    id: 'z15-09',
    iz: 'авторская',
    uravnenie: '\\sin x+\\cos x=-1',
    f: (x) => sin(x) + cos(x) + 1,
    serii: [s(u(1)), s(u(-1, 2))],
    promezhutok: otrezok(u(-5, 2), u(0)),
    otbor: 'nerav',
    metody: ['abc', 'odnorodnye-2', 'vspomogatelnyy'],
    reshenie: [
      'Половинный угол: $2\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha-\\sin^2\\alpha=-\\sin^2\\alpha-\\cos^2\\alpha\\Leftrightarrow 2\\sin\\alpha\\cos\\alpha+2\\cos^2\\alpha=0$.',
      'Внимание: делить на $\\cos^2\\alpha$ здесь нельзя — при $\\cos\\alpha=0$ уравнение верно, и мы потеряли бы корни. Выносим множитель: $2\\cos\\alpha(\\sin\\alpha+\\cos\\alpha)=0$.',
      '$\\cos\\alpha=0$: $\\alpha=\\dfrac{\\pi}{2}+\\pi k$, $x=\\pi+2\\pi k$. $\\sin\\alpha=-\\cos\\alpha$: $\\operatorname{tg}\\alpha=-1$, $x=-\\dfrac{\\pi}{2}+2\\pi k$.',
      'Вспомогательным углом: $\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=-\\dfrac{\\sqrt{2}}{2}$ — тоже коротко, и корни не теряются.',
    ],
    podskazki: [
      v(
        'Однородное уравнение:',
        [
          '$2\\sin\\alpha\\cos\\alpha+2\\cos^2\\alpha=0$',
          '$2\\sin\\alpha\\cos\\alpha-2\\sin^2\\alpha=0$',
          '$2\\sin\\alpha\\cos\\alpha+1=0$',
        ],
        0,
      ),
      v(
        'Можно ли разделить на $\\cos^2\\alpha$?',
        [
          'Нет: $\\cos\\alpha=0$ даёт решения',
          'Да, косинус не равен нулю',
          'Да, если потом проверить ответ',
        ],
        0,
        'Подставь $\\cos\\alpha=0$: получится $0=0$.',
      ),
      v(
        '$\\cos\\dfrac{x}{2}=0$ даёт',
        ['$x=\\pi+2\\pi k$', '$x=\\dfrac{\\pi}{2}+\\pi k$', '$x=\\pi k$'],
        0,
      ),
      v(
        'Сколько корней на $\\left[-\\dfrac{5\\pi}{2};\\,0\\right]$?',
        ['Три', 'Два', 'Четыре'],
        0,
        '$-\\dfrac{5\\pi}{2}$, $-\\pi$, $-\\dfrac{\\pi}{2}$.',
      ),
    ],
  }),
  ur({
    id: 'z15-10',
    iz: 'авторская',
    uravnenie: '4\\sin x-3\\cos x=5',
    f: (x) => 4 * sin(x) - 3 * cos(x) - 5,
    serii: [s(ua(ARCTG_3_4, 1, 1, 2))],
    promezhutok: otrezok(u(-2), u(1)),
    otbor: 'krug',
    metody: ['abc', 'vspomogatelnyy'],
    reshenie: [
      'Вспомогательный угол: $\\sqrt{16+9}=5$, делим: $\\dfrac{4}{5}\\sin x-\\dfrac{3}{5}\\cos x=1$.',
      'Угол $\\varphi$ первой четверти с $\\cos\\varphi=\\dfrac{4}{5}$, $\\sin\\varphi=\\dfrac{3}{5}$: $\\varphi=\\operatorname{arctg}\\dfrac{3}{4}$. Слева $\\sin x\\cos\\varphi-\\cos x\\sin\\varphi=\\sin(x-\\varphi)$.',
      '$\\sin(x-\\varphi)=1$: $x-\\varphi=\\dfrac{\\pi}{2}+2\\pi k$, $x=\\operatorname{arctg}\\dfrac{3}{4}+\\dfrac{\\pi}{2}+2\\pi k$.',
      'Половинным углом получится $(\\sin\\alpha-2\\cos\\alpha)^2=0$ и $x=2\\operatorname{arctg}2+2\\pi k$ — это та же серия, но доказывать равенство дольше.',
    ],
    podskazki: [
      v('На что делим?', ['$5$', '$7$', '$1$'], 0),
      v(
        'Левая часть после деления равна',
        [
          '$\\sin(x-\\varphi)$, $\\varphi=\\operatorname{arctg}\\dfrac{3}{4}$',
          '$\\sin(x+\\varphi)$, $\\varphi=\\operatorname{arctg}\\dfrac{3}{4}$',
          '$\\cos(x-\\varphi)$, $\\varphi=\\operatorname{arctg}\\dfrac{4}{3}$',
        ],
        0,
      ),
      v(
        'Решения:',
        [
          '$x=\\operatorname{arctg}\\dfrac{3}{4}+\\dfrac{\\pi}{2}+2\\pi k$',
          '$x=\\operatorname{arctg}\\dfrac{3}{4}+2\\pi k$',
          '$x=\\operatorname{arctg}\\dfrac{3}{4}+\\dfrac{\\pi}{2}+\\pi k$',
        ],
        0,
      ),
    ],
  }),
];
