import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';

/** Пункт 3.12. Уравнение a sin x + b cos x = c двумя способами. */
export const PUNKT_12: Punkt14 = {
  id: 't-p12-abc',
  no: '3.12',
  title: 'Уравнение a sin x + b cos x = c двумя способами',
  bloki: [
    {
      vid: 'p',
      text: 'Уравнение $a\\sin x+b\\cos x=c$ с числом $c\\ne0$ не однородное: число справа — «нулевой степени». Есть два способа с ним справиться: **перейти к половинному углу** и получить однородное уравнение или **применить вспомогательный угол**. Решим одно и то же уравнение $\\sqrt{3}\\sin x-\\cos x=1$ обоими способами и сравним.',
    },
    {
      vid: 'primer',
      title: 'Способ 1. Половинный угол',
      primer: {
        uslovie: 'Решим уравнение $\\sqrt{3}\\sin x-\\cos x=1$ через половинный угол.',
        shagi: [
          'Обозначим $x=2\\alpha$, то есть $\\alpha=\\dfrac{x}{2}$. По формулам двойного угла $\\sin x=2\\sin\\alpha\\cos\\alpha$, $\\cos x=\\cos^2\\alpha-\\sin^2\\alpha$, а единицу запишем как $1=\\sin^2\\alpha+\\cos^2\\alpha$ — так все слагаемые станут второй степени.',
          '$2\\sqrt{3}\\sin\\alpha\\cos\\alpha-\\cos^2\\alpha+\\sin^2\\alpha=\\sin^2\\alpha+\\cos^2\\alpha\\ \\Leftrightarrow\\ 2\\sqrt{3}\\sin\\alpha\\cos\\alpha-2\\cos^2\\alpha=0$.',
          'Слагаемое с $\\sin^2\\alpha$ сократилось — делить на $\\cos^2\\alpha$ нельзя (см. пункт 3.10). Выносим общий множитель: $2\\cos\\alpha\\,(\\sqrt{3}\\sin\\alpha-\\cos\\alpha)=0\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&\\cos\\alpha=0,\\\\&\\sqrt{3}\\sin\\alpha-\\cos\\alpha=0.\\end{aligned}\\right.$',
          'Первая строка: $\\alpha=\\dfrac{\\pi}{2}+\\pi k$, значит, $x=2\\alpha=\\pi+2\\pi k$.',
          'Вторая строка однородная первой степени: если $\\cos\\alpha=0$, то и $\\sin\\alpha=0$ — противоречие с $\\sin^2\\alpha+\\cos^2\\alpha=1$, поэтому делим на $\\cos\\alpha\\ne0$: $\\operatorname{tg}\\alpha=\\dfrac{1}{\\sqrt{3}}$, $\\alpha=\\dfrac{\\pi}{6}+\\pi k$, $x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\pi+2\\pi k$, $x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Способ 2. Вспомогательный угол',
      primer: {
        uslovie: 'Решим то же уравнение $\\sqrt{3}\\sin x-\\cos x=1$ методом вспомогательного угла.',
        shagi: [
          '$R=\\sqrt{3+1}=2$. Делим на $2$: $\\dfrac{\\sqrt{3}}{2}\\sin x-\\dfrac{1}{2}\\cos x=\\dfrac{1}{2}$.',
          'Узнаём $\\dfrac{\\sqrt{3}}{2}=\\cos\\dfrac{\\pi}{6}$, $\\dfrac{1}{2}=\\sin\\dfrac{\\pi}{6}$. Получился синус разности: $\\sin x\\cos\\dfrac{\\pi}{6}-\\cos x\\sin\\dfrac{\\pi}{6}=\\sin\\left(x-\\dfrac{\\pi}{6}\\right)$.',
          '$\\sin\\left(x-\\dfrac{\\pi}{6}\\right)=\\dfrac{1}{2}\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x-\\dfrac{\\pi}{6}=\\dfrac{\\pi}{6}+2\\pi k,\\\\&x-\\dfrac{\\pi}{6}=\\dfrac{5\\pi}{6}+2\\pi k\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x=\\dfrac{\\pi}{3}+2\\pi k,\\\\&x=\\pi+2\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
          'Ответ тот же, что и в способе 1.',
        ],
        otvet: '$x=\\dfrac{\\pi}{3}+2\\pi k$, $x=\\pi+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'В способе 1 легко потерять серию $x=\\pi+2\\pi k$. Ей соответствует $\\cos\\alpha=\\cos\\dfrac{x}{2}=0$ — ровно то, на что хочется поделить. Поэтому перед делением на $\\cos^2\\alpha$ всегда смотри, осталось ли слагаемое с $\\sin^2\\alpha$, и проверяй $x=\\pi$ подстановкой.',
      primer: {
        uslovie: 'Покажем, что получится, если в способе 1 разделить $2\\sqrt{3}\\sin\\alpha\\cos\\alpha-2\\cos^2\\alpha=0$ на $\\cos^2\\alpha$.',
        shagi: [
          'После деления: $2\\sqrt{3}\\operatorname{tg}\\alpha-2=0$, $\\operatorname{tg}\\alpha=\\dfrac{1}{\\sqrt{3}}$, $x=\\dfrac{\\pi}{3}+2\\pi k$ — только одна серия.',
          'Подставим $x=\\pi$ в исходное уравнение: $\\sqrt{3}\\sin\\pi-\\cos\\pi=0-(-1)=1$ — верно, это корень. Он потерян, потому что при $x=\\pi$ как раз $\\cos\\dfrac{x}{2}=\\cos\\dfrac{\\pi}{2}=0$.',
        ],
        otvet: 'деление теряет серию $x=\\pi+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'tablica',
      zagolovki: ['Что сравниваем', 'Половинный угол', 'Вспомогательный угол'],
      stroki: [
        ['Коэффициенты «табличные» ($1$, $\\sqrt{3}$, $\\sqrt{2}$)', 'работает, но выкладки длиннее', 'быстрее: угол $\\varphi$ сразу узнаётся'],
        ['Коэффициенты «некрасивые» ($3$ и $4$, $5$ и $12$)', 'удобно: квадратное уравнение для $\\operatorname{tg}\\dfrac{x}{2}$', 'угол $\\varphi$ не табличный, его приходится записывать через $\\operatorname{arctg}$'],
        ['Есть ли корни', 'видно по дискриминанту', 'видно сразу: нужно $|c|\\le\\sqrt{a^2+b^2}$'],
        ['Главный риск', 'потерять $x=\\pi+2\\pi k$ при делении на $\\cos^2\\dfrac{x}{2}$', 'перепутать, какой коэффициент — косинус, а какой — синус'],
      ],
    },
    {
      vid: 'ramka',
      ton: 'vyvod',
      text: 'Если $c^2=a^2+b^2$, вспомогательный угол сразу даёт $\\sin(x+\\varphi)=\\pm1$ — одну серию. При «некрасивых» коэффициентах половинный угол даёт полный квадрат и аккуратный ответ через $\\operatorname{arctg}$. Оба ответа правильные, даже если выглядят по-разному.',
      primer: {
        uslovie: 'Решим уравнение $3\\sin x+4\\cos x=5$ двумя способами.',
        shagi: [
          'Вспомогательный угол: $R=5$, $\\dfrac{3}{5}\\sin x+\\dfrac{4}{5}\\cos x=1$. Пусть $\\cos\\varphi=\\dfrac{3}{5}$, $\\sin\\varphi=\\dfrac{4}{5}$, тогда $\\varphi=\\operatorname{arctg}\\dfrac{4}{3}$ и $\\sin(x+\\varphi)=1$, $x=\\dfrac{\\pi}{2}-\\operatorname{arctg}\\dfrac{4}{3}+2\\pi k$.',
          'Половинный угол: $x=2\\alpha$, $6\\sin\\alpha\\cos\\alpha+4\\cos^2\\alpha-4\\sin^2\\alpha=5\\sin^2\\alpha+5\\cos^2\\alpha\\ \\Leftrightarrow\\ 9\\sin^2\\alpha-6\\sin\\alpha\\cos\\alpha+\\cos^2\\alpha=0$.',
          'Пусть $\\cos\\alpha=0$; тогда $9\\sin^2\\alpha=0$ — противоречие с основным тождеством. Делим на $\\cos^2\\alpha$: $9\\operatorname{tg}^2\\alpha-6\\operatorname{tg}\\alpha+1=0\\ \\Leftrightarrow\\ (3\\operatorname{tg}\\alpha-1)^2=0\\ \\Leftrightarrow\\ \\operatorname{tg}\\alpha=\\dfrac{1}{3}$, $x=2\\operatorname{arctg}\\dfrac{1}{3}+2\\pi k$.',
          'Ответы совпадают: оба угла лежат в $\\left(0;\\,\\dfrac{\\pi}{2}\\right)$, и у обоих тангенс равен $\\dfrac{3}{4}$. Действительно, $\\operatorname{tg}\\left(\\dfrac{\\pi}{2}-\\varphi\\right)=\\operatorname{ctg}\\varphi=\\dfrac{3}{4}$, а $\\operatorname{tg}\\left(2\\operatorname{arctg}\\dfrac{1}{3}\\right)=\\dfrac{2\\cdot\\frac{1}{3}}{1-\\frac{1}{9}}=\\dfrac{3}{4}$.',
        ],
        otvet: '$x=2\\operatorname{arctg}\\dfrac{1}{3}+2\\pi k$, $k\\in\\mathbb{Z}$ (то же, что $x=\\operatorname{arctg}\\dfrac{3}{4}+2\\pi k$).',
      },
    },
    {
      vid: 'p',
      text: '**Как выбрать на экзамене.** Если $\\sqrt{a^2+b^2}$ — «круглое» число и после деления узнаются табличные значения, бери вспомогательный угол: решение в три строки. Если коэффициенты не табличные или ты не уверен в формулах сложения, переходи к половинному углу — это сводит задачу к уже знакомому однородному уравнению. Только не забудь про обоснование деления или вынесение множителя.',
    },
  ],
};
