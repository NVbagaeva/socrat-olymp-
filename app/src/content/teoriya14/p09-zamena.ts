import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';

/** Пункт 3.9. Метод замены. */
export const PUNKT_9: Punkt14 = {
  id: 't-p09-zamena',
  no: '3.9',
  title: 'Метод замены',
  bloki: [
    {
      vid: 'p',
      text: 'Если в уравнении стоит **одна и та же функция от одного и того же аргумента** — например, только $\\cos x$ в разных степенях, — её удобно обозначить новой буквой: $t=\\cos x$. Тригонометрическое уравнение превращается в обычное алгебраическое (чаще всего квадратное). Решаем его, а потом возвращаемся к $x$ через простейшие уравнения.',
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'Синус и косинус принимают значения только от $-1$ до $1$. Поэтому при замене $t=\\sin x$ или $t=\\cos x$ сразу пишем условие $|t|\\le1$ — **системой** вместе с уравнением. Корни $t$, которые вылезают за отрезок $[-1;\\,1]$, отбрасываем: для них простейшее уравнение корней не имеет.',
      primer: {
        uslovie: 'Решим уравнение $6\\cos^2x-7\\cos x-5=0$.',
        shagi: [
          'Замена видна сразу: $t=\\cos x$. Получаем $\\begin{cases}6t^2-7t-5=0,\\\\|t|\\le1.\\end{cases}$',
          '$D=49+120=169=13^2$, $t=\\dfrac{7\\pm13}{12}$: $t=\\dfrac{5}{3}$ или $t=-\\dfrac{1}{2}$.',
          '$\\dfrac{5}{3}>1$ — не подходит, косинус таким не бывает. Остаётся $\\cos x=-\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'p',
      text: 'Чаще замена появляется **не сразу**, а после преобразований: в уравнении стоят разные функции или разные аргументы, и сначала их надо привести к одной функции одного аргумента. Три типичных инструмента: основное тождество $\\sin^2x+\\cos^2x=1$, формулы двойного угла и формулы приведения.',
    },
    {
      vid: 'primer',
      title: 'Через основное тождество',
      primer: {
        uslovie: 'Решим уравнение $6\\sin^2x+5\\cos x-2=0$.',
        shagi: [
          'Здесь и синус, и косинус. Синус стоит в квадрате, поэтому его легко выразить через косинус: $\\sin^2x=1-\\cos^2x$.',
          '$6(1-\\cos^2x)+5\\cos x-2=0\\ \\Leftrightarrow\\ 6\\cos^2x-5\\cos x-4=0$.',
          'Замена $t=\\cos x$, $|t|\\le1$: $6t^2-5t-4=0$, $D=25+96=121$, $t=\\dfrac{5\\pm11}{12}$, то есть $t=\\dfrac{4}{3}$ (не подходит, больше $1$) или $t=-\\dfrac{1}{2}$.',
          '$\\cos x=-\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Через двойной угол',
      primer: {
        uslovie: 'Решим уравнение $\\cos2x+3\\sin x-2=0$.',
        shagi: [
          'Аргументы разные: $2x$ и $x$. Рядом стоит синус, поэтому $\\cos2x=1-2\\sin^2x$.',
          '$1-2\\sin^2x+3\\sin x-2=0\\ \\Leftrightarrow\\ 2\\sin^2x-3\\sin x+1=0$.',
          'Замена $t=\\sin x$, $|t|\\le1$: $2t^2-3t+1=0$, $D=9-8=1$, $t=\\dfrac{3\\pm1}{4}$: $t=1$ или $t=\\dfrac{1}{2}$ — оба подходят.',
          '$\\left[\\begin{aligned}&\\sin x=1,\\\\&\\sin x=\\dfrac{1}{2}\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x=\\dfrac{\\pi}{2}+2\\pi k,\\\\&x=\\dfrac{\\pi}{6}+2\\pi k,\\\\&x=\\dfrac{5\\pi}{6}+2\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
        ],
        otvet:
          '$x=\\dfrac{\\pi}{2}+2\\pi k$, $x=\\dfrac{\\pi}{6}+2\\pi k$, $x=\\dfrac{5\\pi}{6}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Через формулу приведения',
      primer: {
        uslovie: 'Решим уравнение $\\cos2x=\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)$.',
        shagi: [
          'Приведение: $\\dfrac{3\\pi}{2}$ — вертикальная ось, синус меняется на косинус; угол в III четверти, синус там отрицателен. $\\sin\\left(\\dfrac{3\\pi}{2}-x\\right)=-\\cos x$.',
          'Теперь справа косинус, поэтому $\\cos2x=2\\cos^2x-1$: $2\\cos^2x-1=-\\cos x\\ \\Leftrightarrow\\ 2\\cos^2x+\\cos x-1=0$.',
          'Замена $t=\\cos x$, $|t|\\le1$: $D=1+8=9$, $t=\\dfrac{-1\\pm3}{4}$: $t=\\dfrac{1}{2}$ или $t=-1$ — оба подходят.',
          '$\\cos x=\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{\\pi}{3}+2\\pi k$; $\\cos x=-1\\ \\Leftrightarrow\\ x=\\pi+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\pm\\dfrac{\\pi}{3}+2\\pi k$, $x=\\pi+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'zapomni',
      text: 'Для тангенса и котангенса ограничения $|t|\\le1$ **нет** — они принимают любые значения. Но следи, чтобы функции существовали: если в уравнении есть и $\\operatorname{tg}x$, и $\\operatorname{ctg}x=\\dfrac{1}{\\operatorname{tg}x}$, то $t=\\operatorname{tg}x\\ne0$.',
      primer: {
        uslovie: 'Решим уравнение $\\operatorname{tg}x-2\\operatorname{ctg}x+1=0$.',
        shagi: [
          'Где обе функции существуют, $\\operatorname{ctg}x=\\dfrac{1}{\\operatorname{tg}x}$. Замена $t=\\operatorname{tg}x$, условие $t\\ne0$: $t-\\dfrac{2}{t}+1=0$.',
          'Умножаем на $t\\ne0$ — переход равносилен именно благодаря этому условию: $\\begin{cases}t^2+t-2=0,\\\\t\\ne0\\end{cases}\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&t=1,\\\\&t=-2.\\end{aligned}\\right.$',
          '$\\operatorname{tg}x=1\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{4}+\\pi k$; $\\operatorname{tg}x=-2\\ \\Leftrightarrow\\ x=-\\operatorname{arctg}2+\\pi k$, $k\\in\\mathbb{Z}$. Значение $-2$ не табличное, но для тангенса годится любое число.',
        ],
        otvet:
          '$x=\\dfrac{\\pi}{4}+\\pi k$, $x=-\\operatorname{arctg}2+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
  ],
};
