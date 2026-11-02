import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';

/** Пункт 3.8. Двойной угол и формулы сложения. */
export const PUNKT_8: Punkt14 = {
  id: 't-p08-dvoynoy',
  no: '3.8',
  title: 'Двойной угол и формулы сложения',
  bloki: [
    {
      vid: 'p',
      text: 'Если в уравнении есть $\\sin2x$ или $\\cos2x$ рядом с $\\sin x$ и $\\cos x$, аргументы нужно выровнять: всё выразить через $x$. Для этого — формулы двойного угла.',
    },
    { vid: 'formula', tex: '\\sin2x=2\\sin x\\cos x,' },
    { vid: 'formula', tex: '\\cos2x=\\cos^2x-\\sin^2x=2\\cos^2x-1=1-2\\sin^2x.' },
    {
      vid: 'p',
      text: 'У косинуса три вида. Второй и третий получаются из первого заменой по основному тождеству: $\\sin^2x=1-\\cos^2x$ или $\\cos^2x=1-\\sin^2x$. **Выбирай тот вид, после которого в уравнении останется одна функция.** Если рядом стоит $\\sin x$ — бери $1-2\\sin^2x$; если $\\cos x$ — бери $2\\cos^2x-1$. Тогда получится квадратное уравнение относительно одной функции.',
    },
    {
      vid: 'ramka',
      ton: 'vyvod',
      text: 'Вид $\\cos2x$ подбираем под остальные слагаемые: синус рядом — $1-2\\sin^2x$, косинус рядом — $2\\cos^2x-1$.',
      primer: {
        uslovie: 'Решим уравнение $\\cos2x+\\sin x=0$.',
        shagi: [
          'Рядом стоит $\\sin x$, поэтому $\\cos2x=1-2\\sin^2x$: $1-2\\sin^2x+\\sin x=0\\ \\Leftrightarrow\\ 2\\sin^2x-\\sin x-1=0$.',
          'Квадратное относительно $\\sin x$: $D=1+8=9$, $\\sin x=\\dfrac{1\\pm3}{4}$, то есть $\\left[\\begin{aligned}&\\sin x=1,\\\\&\\sin x=-\\dfrac{1}{2}.\\end{aligned}\\right.$ Оба значения в $[-1;\\,1]$.',
          '$\\sin x=1\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{2}+2\\pi k$; $\\sin x=-\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=-\\dfrac{\\pi}{6}+2\\pi k$ или $x=-\\dfrac{5\\pi}{6}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{2}+2\\pi k$, $x=-\\dfrac{\\pi}{6}+2\\pi k$, $x=-\\dfrac{5\\pi}{6}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Рядом косинус',
      primer: {
        uslovie: 'Решим уравнение $\\cos2x=\\cos x$.',
        shagi: [
          'Рядом $\\cos x$, поэтому $\\cos2x=2\\cos^2x-1$: $2\\cos^2x-1=\\cos x\\ \\Leftrightarrow\\ 2\\cos^2x-\\cos x-1=0$.',
          '$D=1+8=9$, $\\cos x=\\dfrac{1\\pm3}{4}$: $\\left[\\begin{aligned}&\\cos x=1,\\\\&\\cos x=-\\dfrac{1}{2}.\\end{aligned}\\right.$',
          '$\\cos x=1\\ \\Leftrightarrow\\ x=2\\pi k$; $\\cos x=-\\dfrac{1}{2}\\ \\Leftrightarrow\\ x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=2\\pi k$, $x=\\pm\\dfrac{2\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      metka: 'Не сокращай на косинус',
      text: 'После $\\sin2x=2\\sin x\\cos x$ в обеих частях часто появляется общий множитель. **Сокращать на него нельзя**: деление на $\\cos x$ допустимо только при $\\cos x\\ne0$, а те $x$, где $\\cos x=0$, вполне могут быть корнями — и они пропадут. Правильно: перенести всё в одну часть, вынести множитель и приравнять каждый множитель к нулю.',
      primer: {
        uslovie: 'Решим уравнение $\\sin2x=\\cos x$.',
        shagi: [
          'Раскрываем двойной угол и переносим: $2\\sin x\\cos x-\\cos x=0\\ \\Leftrightarrow\\ \\cos x\\,(2\\sin x-1)=0$.',
          'Произведение равно нулю, когда хотя бы один множитель равен нулю: $\\left[\\begin{aligned}&\\cos x=0,\\\\&\\sin x=\\dfrac{1}{2}\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x=\\dfrac{\\pi}{2}+\\pi k,\\\\&x=\\dfrac{\\pi}{6}+2\\pi k,\\\\&x=\\dfrac{5\\pi}{6}+2\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
          'Что было бы при сокращении на $\\cos x$: осталось бы $2\\sin x=1$, и серия $x=\\dfrac{\\pi}{2}+\\pi k$ потерялась бы. А она — корни: при $x=\\dfrac{\\pi}{2}$ слева $\\sin\\pi=0$, справа $\\cos\\dfrac{\\pi}{2}=0$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{2}+\\pi k$, $x=\\dfrac{\\pi}{6}+2\\pi k$, $x=\\dfrac{5\\pi}{6}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'p',
      text: '**Формулы сложения** раскрывают синус и косинус суммы и разности. Они нужны, когда в аргументе стоит $x$ плюс-минус табличный угол, который не сводится к приведению (например, $\\dfrac{\\pi}{6}$ или $\\dfrac{\\pi}{3}$). Сами формулы двойного угла — частный случай этих при $\\alpha=\\beta=x$.',
    },
    {
      vid: 'formula',
      tex: '\\begin{aligned}\\sin(\\alpha\\pm\\beta)&=\\sin\\alpha\\cos\\beta\\pm\\cos\\alpha\\sin\\beta,\\\\\\cos(\\alpha\\pm\\beta)&=\\cos\\alpha\\cos\\beta\\mp\\sin\\alpha\\sin\\beta.\\end{aligned}',
    },
    {
      vid: 'primer',
      title: 'Формулы сложения в уравнении',
      primer: {
        uslovie: 'Решим уравнение $\\sin\\left(\\dfrac{\\pi}{6}-x\\right)-\\cos\\left(\\dfrac{\\pi}{3}-x\\right)=\\sqrt{3}$.',
        shagi: [
          'Синус разности: $\\sin\\left(\\dfrac{\\pi}{6}-x\\right)=\\sin\\dfrac{\\pi}{6}\\cos x-\\cos\\dfrac{\\pi}{6}\\sin x=\\dfrac{1}{2}\\cos x-\\dfrac{\\sqrt{3}}{2}\\sin x$.',
          'Косинус разности: $\\cos\\left(\\dfrac{\\pi}{3}-x\\right)=\\cos\\dfrac{\\pi}{3}\\cos x+\\sin\\dfrac{\\pi}{3}\\sin x=\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x$.',
          'Вычитаем: косинусы взаимно уничтожаются, синусы складываются. $-\\sqrt{3}\\sin x=\\sqrt{3}\\ \\Leftrightarrow\\ \\sin x=-1$ (делим на число $-\\sqrt{3}\\ne0$ — переход равносилен).',
          '$\\sin x=-1\\ \\Leftrightarrow\\ x=-\\dfrac{\\pi}{2}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=-\\dfrac{\\pi}{2}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
  ],
};
