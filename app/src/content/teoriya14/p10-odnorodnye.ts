import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';

/** Пункт 3.10. Однородные уравнения. */
export const PUNKT_10: Punkt14 = {
  id: 't-p10-odnorodnye',
  no: '3.10',
  title: 'Однородные уравнения',
  bloki: [
    {
      vid: 'p',
      text: 'Уравнение называют **однородным**, если в каждом слагаемом синус и косинус вместе стоят в одной и той же степени, а свободного числа нет. **Первой степени:** $a\\sin x+b\\cos x=0$. **Второй степени:** $a\\sin^2x+b\\sin x\\cos x+c\\cos^2x=0$ — в каждом слагаемом ровно два множителя.',
    },
    {
      vid: 'p',
      text: '**Идея.** Делим обе части на $\\cos x$ (для первой степени) или на $\\cos^2x$ (для второй). Каждое слагаемое превращается в степень $\\dfrac{\\sin x}{\\cos x}=\\operatorname{tg}x$, и получается уравнение с одной функцией: $a\\operatorname{tg}x+b=0$ или $a\\operatorname{tg}^2x+b\\operatorname{tg}x+c=0$. Но делить можно только на то, что не равно нулю. Поэтому деление нужно **обосновать**.',
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      metka: 'Переписываем в решение',
      text: '«Пусть $\\cos x=0$. Тогда из уравнения $\\sin x=0$, что противоречит $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$, и можно разделить обе части на $\\cos^2x$». Это рассуждение работает, когда коэффициент при $\\sin^2x$ (или при $\\sin x$ в первой степени) не равен нулю.',
      primer: {
        uslovie: 'Решим уравнение $\\sin^2x-4\\sin x\\cos x+3\\cos^2x=0$.',
        shagi: [
          'Пусть $\\cos x=0$. Тогда в уравнении остаётся $\\sin^2x=0$, то есть $\\sin x=0$. Но синус и косинус не могут одновременно равняться нулю: $\\sin^2x+\\cos^2x=1$. Противоречие, значит, $\\cos x\\ne0$.',
          'Раз $\\cos x\\ne0$ для всех корней, деление на $\\cos^2x$ — равносильный переход: $\\operatorname{tg}^2x-4\\operatorname{tg}x+3=0$.',
          'Квадратное относительно $\\operatorname{tg}x$: корни $1$ и $3$ (по теореме Виета: сумма $4$, произведение $3$). $\\left[\\begin{aligned}&\\operatorname{tg}x=1,\\\\&\\operatorname{tg}x=3\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x=\\dfrac{\\pi}{4}+\\pi k,\\\\&x=\\operatorname{arctg}3+\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{4}+\\pi k$, $x=\\operatorname{arctg}3+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Однородное первой степени',
      primer: {
        uslovie: 'Решим уравнение $\\sin x+\\sqrt{3}\\cos x=0$.',
        shagi: [
          'Пусть $\\cos x=0$. Тогда из уравнения $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$.',
          'Делим на $\\cos x\\ne0$: $\\operatorname{tg}x+\\sqrt{3}=0\\ \\Leftrightarrow\\ \\operatorname{tg}x=-\\sqrt{3}$.',
          '$x=-\\dfrac{\\pi}{3}+\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=-\\dfrac{\\pi}{3}+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'Если **$a=0$** (нет слагаемого с $\\sin^2x$), на $\\cos^2x$ делить **нельзя**: при $\\cos x=0$ все слагаемые обнуляются, никакого противоречия нет — эти $x$ и есть корни, и при делении они потеряются. Если **$c=0$** (нет $\\cos^2x$), то же самое случится при делении на $\\sin^2x$. В обоих случаях не делим, а **выносим общий множитель**.',
      primer: {
        uslovie: 'Решим уравнение $\\sqrt{3}\\sin x\\cos x+\\cos^2x=0$.',
        shagi: [
          'Здесь $a=0$. Проверка: при $\\cos x=0$ левая часть равна $0$ — значит, такие $x$ являются корнями, деление на $\\cos^2x$ их бы выбросило.',
          'Выносим $\\cos x$: $\\cos x\\,(\\sqrt{3}\\sin x+\\cos x)=0\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&\\cos x=0,\\\\&\\sqrt{3}\\sin x+\\cos x=0.\\end{aligned}\\right.$',
          'Первая строка: $x=\\dfrac{\\pi}{2}+\\pi k$. Вторая — однородное первой степени: если $\\cos x=0$, то и $\\sin x=0$, противоречие; делим на $\\cos x$: $\\operatorname{tg}x=-\\dfrac{1}{\\sqrt{3}}$, $x=-\\dfrac{\\pi}{6}+\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{2}+\\pi k$, $x=-\\dfrac{\\pi}{6}+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Нет слагаемого с квадратом косинуса',
      primer: {
        uslovie: 'Решим уравнение $\\sin^2x-\\sqrt{3}\\sin x\\cos x=0$.',
        shagi: [
          'Здесь $c=0$, у обоих слагаемых общий множитель $\\sin x$. Выносим его — так точно ничего не потеряем: $\\sin x\\,(\\sin x-\\sqrt{3}\\cos x)=0$.',
          '$\\left[\\begin{aligned}&\\sin x=0,\\\\&\\sin x-\\sqrt{3}\\cos x=0.\\end{aligned}\\right.$ Первая строка: $x=\\pi k$.',
          'Вторая: если $\\cos x=0$, то и $\\sin x=0$ — противоречие; делим на $\\cos x$: $\\operatorname{tg}x=\\sqrt{3}$, $x=\\dfrac{\\pi}{3}+\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\pi k$, $x=\\dfrac{\\pi}{3}+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'zapomni',
      text: 'Если справа стоит **число** $d$, уравнение пока не однородное. Делаем его однородным, умножив число на единицу в виде основного тождества: $d=d\\,(\\sin^2x+\\cos^2x)$. После переноса в левую часть каждое слагаемое снова второй степени.',
      primer: {
        uslovie: 'Решим уравнение $10\\sin^2x+5\\sin x\\cos x+\\cos^2x=3$.',
        shagi: [
          '$3=3\\sin^2x+3\\cos^2x$: $10\\sin^2x+5\\sin x\\cos x+\\cos^2x=3\\sin^2x+3\\cos^2x\\ \\Leftrightarrow\\ 7\\sin^2x+5\\sin x\\cos x-2\\cos^2x=0$.',
          'Пусть $\\cos x=0$. Тогда $7\\sin^2x=0$, $\\sin x=0$ — противоречие с $\\sin^2x+\\cos^2x=1$. Значит, $\\cos x\\ne0$, делим на $\\cos^2x$: $7\\operatorname{tg}^2x+5\\operatorname{tg}x-2=0$.',
          '$D=25+56=81$, $\\operatorname{tg}x=\\dfrac{-5\\pm9}{14}$: $\\operatorname{tg}x=\\dfrac{2}{7}$ или $\\operatorname{tg}x=-1$.',
          '$x=\\operatorname{arctg}\\dfrac{2}{7}+\\pi k$, $x=-\\dfrac{\\pi}{4}+\\pi k$, $k\\in\\mathbb{Z}$. Проверка при $x=-\\dfrac{\\pi}{4}$: $10\\cdot\\dfrac{1}{2}+5\\cdot\\left(-\\dfrac{1}{2}\\right)+\\dfrac{1}{2}=3$ — верно.',
        ],
        otvet: '$x=-\\dfrac{\\pi}{4}+\\pi k$, $x=\\operatorname{arctg}\\dfrac{2}{7}+\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
  ],
};
