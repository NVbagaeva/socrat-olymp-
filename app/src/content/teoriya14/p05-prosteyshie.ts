import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';
import { u } from '@/lib/zadanie14/ugol';

/** Пункт 3.5. Простейшие уравнения. */
export const PUNKT_5: Punkt14 = {
  id: 't-p05-prosteyshie',
  no: '3.5',
  title: 'Простейшие уравнения',
  bloki: [
    {
      vid: 'p',
      text: 'Простейшие уравнения — $\\sin x=a$, $\\cos x=a$, $\\operatorname{tg}x=a$, $\\operatorname{ctg}x=a$. К ним сводится любое уравнение задания №14, поэтому решать их нужно уверенно и с рисунком. **Уравнение $\\sin x=a$.** Синус — ордината, значит, ищем точки окружности на высоте $a$. Отмечаем $a$ на оси синусов и проводим через него прямую, **параллельную оси косинусов**. При $|a|<1$ она пересекает окружность в двух точках, симметричных относительно оси синусов. Правая точка — $\\arcsin a$ (угол от $-\\dfrac{\\pi}{2}$ до $\\dfrac{\\pi}{2}$), левая — $\\pi-\\arcsin a$.',
    },
    {
      vid: 'formula',
      tex: '\\sin x=a,\\ |a|\\le1\\quad\\Leftrightarrow\\quad\\left[\\begin{aligned}&x=\\arcsin a+2\\pi k,\\\\&x=\\pi-\\arcsin a+2\\pi k,\\end{aligned}\\right.\\quad k\\in\\mathbb{Z}.',
    },
    {
      vid: 'risunok',
      risunok: { vid: 'sechenie', funkciya: 'sin', podpis: 'Выбери значение $a$: прямая $y=a$ отсекает на окружности точки — корни уравнения $\\sin x=a$.' },
    },
    {
      vid: 'ramka',
      ton: 'zapomni',
      text: 'Частные случаи — без формулы, прямо с окружности: $\\sin x=0\\ \\Leftrightarrow\\ x=\\pi k$; $\\sin x=1\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{2}+2\\pi k$; $\\sin x=-1\\ \\Leftrightarrow\\ x=-\\dfrac{\\pi}{2}+2\\pi k$, $k\\in\\mathbb{Z}$. При $a=\\pm1$ прямая касается окружности — точка одна. При $|a|>1$ прямая проходит выше или ниже окружности — **корней нет**.',
      primer: {
        uslovie: 'Решим уравнения $2\\sin x+\\sqrt{2}=0$ и $\\sin x=\\dfrac{\\pi}{2}$.',
        shagi: [
          '$2\\sin x+\\sqrt{2}=0\\ \\Leftrightarrow\\ \\sin x=-\\dfrac{\\sqrt{2}}{2}$. Прямая $y=-\\dfrac{\\sqrt{2}}{2}$ ниже оси косинусов пересекает окружность в точках $-\\dfrac{\\pi}{4}$ (справа) и $\\pi-\\left(-\\dfrac{\\pi}{4}\\right)=\\dfrac{5\\pi}{4}$ (слева).',
          'Получаем $\\left[\\begin{aligned}&x=-\\dfrac{\\pi}{4}+2\\pi k,\\\\&x=\\dfrac{5\\pi}{4}+2\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
          'Во втором уравнении $\\dfrac{\\pi}{2}\\approx1{,}57>1$, а синус не бывает больше $1$: прямая не встречает окружность. Корней нет.',
        ],
        risunok: {
          vid: 'krug',
          spec: {
            sechenieSin: { a: -Math.SQRT1_2, tex: '-\\dfrac{\\sqrt{2}}{2}' },
            tochki: [
              { ugol: u(-1, 4), akcent: true },
              { ugol: u(5, 4), akcent: true },
            ],
          },
        },
        otvet: '$x=-\\dfrac{\\pi}{4}+2\\pi k$, $x=\\dfrac{5\\pi}{4}+2\\pi k$, $k\\in\\mathbb{Z}$; во втором уравнении корней нет.',
      },
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'В учебниках две серии синуса часто склеивают в одну: $x=(-1)^k\\arcsin a+\\pi k$, $k\\in\\mathbb{Z}$. Это **равносильная** запись — она даёт ровно те же корни. Но для отбора корней удобнее две отдельные серии, поэтому в решениях мы пишем их.',
      primer: {
        uslovie: 'Проверим, что $x=(-1)^k\\dfrac{\\pi}{6}+\\pi k$ — это решения уравнения $\\sin x=\\dfrac{1}{2}$.',
        shagi: [
          'Чётное $k=2n$, $n\\in\\mathbb{Z}$: $(-1)^{2n}=1$, получаем $x=\\dfrac{\\pi}{6}+2\\pi n$ — первая серия.',
          'Нечётное $k=2n+1$: $(-1)^{2n+1}=-1$, получаем $x=-\\dfrac{\\pi}{6}+\\pi+2\\pi n=\\dfrac{5\\pi}{6}+2\\pi n$ — вторая серия.',
          'Других целых $k$ нет, значит, записи совпадают.',
        ],
        otvet: '$x=\\dfrac{\\pi}{6}+2\\pi k$, $x=\\dfrac{5\\pi}{6}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'p',
      text: '**Уравнение $\\cos x=a$.** Косинус — абсцисса: отмечаем $a$ на оси косинусов и проводим прямую, **параллельную оси синусов**. Две точки пересечения симметричны относительно оси косинусов, поэтому их углы отличаются только знаком: $\\arccos a$ (угол от $0$ до $\\pi$, верхняя точка) и $-\\arccos a$ (нижняя). Знак «$+$» — идём от $0$ против часовой стрелки, «$-$» — по часовой. Итог: $\\cos x=a,\\ |a|\\le1\\ \\Leftrightarrow\\ x=\\pm\\arccos a+2\\pi k$, $k\\in\\mathbb{Z}$. Частные случаи: $\\cos x=0\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{2}+\\pi k$; $\\cos x=1\\ \\Leftrightarrow\\ x=2\\pi k$; $\\cos x=-1\\ \\Leftrightarrow\\ x=\\pi+2\\pi k$; при $|a|>1$ корней нет.',
    },
    {
      vid: 'risunok',
      risunok: { vid: 'sechenie', funkciya: 'cos', podpis: 'Прямая $x=a$ отсекает на окружности две точки, симметричные относительно оси косинусов.' },
    },
    {
      vid: 'primer',
      title: 'Косинус',
      primer: {
        uslovie: 'Решим уравнение $2\\cos x+1=0$.',
        shagi: [
          '$2\\cos x+1=0\\ \\Leftrightarrow\\ \\cos x=-\\dfrac{1}{2}$. Прямая $x=-\\dfrac{1}{2}$ левее центра.',
          'Верхняя точка — $\\dfrac{2\\pi}{3}$: она не доходит до $\\pi$ на $\\dfrac{\\pi}{3}$, а у $\\dfrac{\\pi}{3}$ абсцисса $\\dfrac{1}{2}$. Нижняя точка — её отражение, $-\\dfrac{2\\pi}{3}$.',
          '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        risunok: {
          vid: 'krug',
          spec: {
            sechenieCos: { a: -0.5, tex: '-\\dfrac{1}{2}' },
            tochki: [
              { ugol: u(2, 3), akcent: true },
              { ugol: u(-2, 3), akcent: true },
            ],
          },
        },
        otvet: '$x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'p',
      text: '**Уравнения $\\operatorname{tg}x=a$ и $\\operatorname{ctg}x=a$** решаются при любом $a$. Отмечаем $a$ на оси тангенсов (котангенсов) и соединяем с центром: прямая пересекает окружность в двух противоположных точках. Поэтому серия одна, с периодом $\\pi$: $\\operatorname{tg}x=a\\ \\Leftrightarrow\\ x=\\operatorname{arctg}a+\\pi k$; $\\operatorname{ctg}x=a\\ \\Leftrightarrow\\ x=\\operatorname{arcctg}a+\\pi k$, $k\\in\\mathbb{Z}$. Например, $\\operatorname{tg}x=-1\\ \\Leftrightarrow\\ x=-\\dfrac{\\pi}{4}+\\pi k$, $k\\in\\mathbb{Z}$.',
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'Если под функцией стоит не $x$, а $kx+b$, **решай относительно всего аргумента**, как будто это одна буква. Серию для аргумента записывай целиком, вместе с периодом, и только потом выражай $x$: при делении на коэффициент делится **всё**, в том числе $2\\pi k$ или $\\pi k$.',
      primer: {
        uslovie: 'Решим уравнение $\\sqrt{3}\\operatorname{tg}(5\\pi+2x)=3$.',
        shagi: [
          'Упрощаем аргумент. Тангенс повторяется через $\\pi$, а $5\\pi$ — это пять периодов: $\\operatorname{tg}(5\\pi+2x)=\\operatorname{tg}2x$.',
          'Делим на $\\sqrt{3}$ (это число, а не выражение с $x$ — переход равносилен): $\\operatorname{tg}2x=\\dfrac{3}{\\sqrt{3}}=\\sqrt{3}$.',
          'Решаем относительно аргумента $2x$: $2x=\\dfrac{\\pi}{3}+\\pi k$, $k\\in\\mathbb{Z}$.',
          'Делим обе части на $2$ — и начало, и период: $x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2}$, $k\\in\\mathbb{Z}$. Если забыть разделить $\\pi k$, потеряешь половину корней.',
        ],
        otvet: '$x=\\dfrac{\\pi}{6}+\\dfrac{\\pi k}{2}$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Аргумент со сдвигом',
      primer: {
        uslovie: 'Решим уравнение $\\cos\\left(2x+\\dfrac{\\pi}{6}\\right)=-\\dfrac{1}{2}$.',
        shagi: [
          'Обозначим мысленно $t=2x+\\dfrac{\\pi}{6}$. Уравнение $\\cos t=-\\dfrac{1}{2}$ уже решено выше: $t=\\pm\\dfrac{2\\pi}{3}+2\\pi k$.',
          'Возвращаемся к $x$ и разбиваем «$\\pm$» на две строки: $\\left[\\begin{aligned}&2x+\\dfrac{\\pi}{6}=\\dfrac{2\\pi}{3}+2\\pi k,\\\\&2x+\\dfrac{\\pi}{6}=-\\dfrac{2\\pi}{3}+2\\pi k\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&2x=\\dfrac{\\pi}{2}+2\\pi k,\\\\&2x=-\\dfrac{5\\pi}{6}+2\\pi k.\\end{aligned}\\right.$',
          'Делим всё на $2$: $\\left[\\begin{aligned}&x=\\dfrac{\\pi}{4}+\\pi k,\\\\&x=-\\dfrac{5\\pi}{12}+\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$. Период стал $\\pi$ — так и должно быть: $\\cos2x$ повторяется вдвое чаще, чем $\\cos x$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{4}+\\pi k$, $x=-\\dfrac{5\\pi}{12}+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
  ],
};
