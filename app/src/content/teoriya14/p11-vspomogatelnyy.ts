import type { Punkt14 } from '@/lib/zadanie14/teoriyaTipy';

/** Пункт 3.11. Метод вспомогательного угла. */
export const PUNKT_11: Punkt14 = {
  id: 't-p11-vspomogatelnyy',
  no: '3.11',
  title: 'Метод вспомогательного угла',
  bloki: [
    {
      vid: 'p',
      text: 'Сумму $a\\sin x+b\\cos x$ можно свернуть в **один** синус (или косинус) со сдвинутым аргументом. Тогда уравнение $a\\sin x+b\\cos x=c$ становится простейшим. Приём называют методом вспомогательного угла.',
    },
    {
      vid: 'p',
      text: '**Шаг 1. Делим на $\\sqrt{a^2+b^2}$.** Обозначим $R=\\sqrt{a^2+b^2}$ и разделим обе части уравнения на это положительное число: $\\dfrac{a}{R}\\sin x+\\dfrac{b}{R}\\cos x=\\dfrac{c}{R}$.',
    },
    {
      vid: 'p',
      text: '**Шаг 2. Почему коэффициенты — косинус и синус угла.** Сложим квадраты новых коэффициентов: $\\left(\\dfrac{a}{R}\\right)^2+\\left(\\dfrac{b}{R}\\right)^2=\\dfrac{a^2+b^2}{R^2}=1$. Значит, точка $\\left(\\dfrac{a}{R};\\,\\dfrac{b}{R}\\right)$ лежит на единичной окружности. А у любой точки единичной окружности координаты — косинус и синус её угла. Обозначим этот угол $\\varphi$:',
    },
    {
      vid: 'formula',
      tex: '\\dfrac{a}{\\sqrt{a^2+b^2}}=\\cos\\varphi,\\qquad \\dfrac{b}{\\sqrt{a^2+b^2}}=\\sin\\varphi.',
    },
    {
      vid: 'p',
      text: '**Шаг 3. Сворачиваем.** Левая часть стала правой частью формулы синуса суммы: $\\sin x\\cos\\varphi+\\cos x\\sin\\varphi=\\sin(x+\\varphi)$. Если удобнее, можно собрать и косинус разности — нужно лишь назвать косинусом и синусом другие коэффициенты.',
    },
    {
      vid: 'formula',
      tex: 'a\\sin x+b\\cos x=\\sqrt{a^2+b^2}\\,\\bigl(\\sin x\\cos\\varphi+\\cos x\\sin\\varphi\\bigr)=\\sqrt{a^2+b^2}\\,\\sin(x+\\varphi).',
    },
    {
      vid: 'primer',
      title: 'Табличный вспомогательный угол',
      primer: {
        uslovie: 'Решим уравнение $\\sqrt{3}\\sin x+\\cos x=2$.',
        shagi: [
          '$R=\\sqrt{3+1}=2$. Делим на $2$: $\\dfrac{\\sqrt{3}}{2}\\sin x+\\dfrac{1}{2}\\cos x=1$.',
          'Точка $\\left(\\dfrac{\\sqrt{3}}{2};\\,\\dfrac{1}{2}\\right)$ — это точка $\\dfrac{\\pi}{6}$: $\\cos\\dfrac{\\pi}{6}=\\dfrac{\\sqrt{3}}{2}$, $\\sin\\dfrac{\\pi}{6}=\\dfrac{1}{2}$.',
          '$\\sin x\\cos\\dfrac{\\pi}{6}+\\cos x\\sin\\dfrac{\\pi}{6}=1\\ \\Leftrightarrow\\ \\sin\\left(x+\\dfrac{\\pi}{6}\\right)=1$.',
          '$x+\\dfrac{\\pi}{6}=\\dfrac{\\pi}{2}+2\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
        ],
        otvet: '$x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'primer',
      title: 'Две серии',
      primer: {
        uslovie: 'Решим уравнение $\\sin x+\\cos x=1$.',
        shagi: [
          '$R=\\sqrt{1+1}=\\sqrt{2}$. Делим на $\\sqrt{2}$: $\\dfrac{\\sqrt{2}}{2}\\sin x+\\dfrac{\\sqrt{2}}{2}\\cos x=\\dfrac{\\sqrt{2}}{2}$.',
          'Коэффициенты — координаты точки $\\dfrac{\\pi}{4}$: $\\sin x\\cos\\dfrac{\\pi}{4}+\\cos x\\sin\\dfrac{\\pi}{4}=\\dfrac{\\sqrt{2}}{2}\\ \\Leftrightarrow\\ \\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt{2}}{2}$.',
          'Простейшее для аргумента $x+\\dfrac{\\pi}{4}$: $\\left[\\begin{aligned}&x+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{4}+2\\pi k,\\\\&x+\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}+2\\pi k\\end{aligned}\\right.\\ \\Leftrightarrow\\ \\left[\\begin{aligned}&x=2\\pi k,\\\\&x=\\dfrac{\\pi}{2}+2\\pi k,\\end{aligned}\\right.$ $k\\in\\mathbb{Z}$.',
          'Проверка: $\\sin0+\\cos0=0+1=1$, $\\sin\\dfrac{\\pi}{2}+\\cos\\dfrac{\\pi}{2}=1+0=1$.',
        ],
        otvet: '$x=2\\pi k$, $x=\\dfrac{\\pi}{2}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
    {
      vid: 'ramka',
      ton: 'zapomni',
      text: 'Так как $|\\sin(x+\\varphi)|\\le1$, уравнение $a\\sin x+b\\cos x=c$ имеет корни **только при $|c|\\le\\sqrt{a^2+b^2}$**. Это можно проверить ещё до решения.',
      primer: {
        uslovie: 'Есть ли корни у уравнения $3\\sin x+4\\cos x=6$?',
        shagi: [
          '$R=\\sqrt{9+16}=5$. После деления: $\\dfrac{3}{5}\\sin x+\\dfrac{4}{5}\\cos x=\\dfrac{6}{5}$, где $\\dfrac{3}{5}=\\cos\\varphi$, $\\dfrac{4}{5}=\\sin\\varphi$ (проверка: $\\dfrac{9}{25}+\\dfrac{16}{25}=1$).',
          'Получаем $\\sin(x+\\varphi)=\\dfrac{6}{5}>1$ — синус таким не бывает.',
        ],
        otvet: 'корней нет.',
      },
    },
    {
      vid: 'ramka',
      ton: 'vazhno',
      text: 'Свернуть можно и в косинус — ответ получится тот же. Выбирай то, что быстрее узнаёшь. Главное — чтобы коэффициент, который ты назвал косинусом, стоял именно при той функции, которая нужна в формуле.',
      primer: {
        uslovie: 'Решим $\\sqrt{3}\\sin x+\\cos x=2$ через косинус разности.',
        shagi: [
          'После деления на $2$: $\\dfrac{1}{2}\\cos x+\\dfrac{\\sqrt{3}}{2}\\sin x=1$. Теперь считаем $\\dfrac{1}{2}=\\cos\\dfrac{\\pi}{3}$, $\\dfrac{\\sqrt{3}}{2}=\\sin\\dfrac{\\pi}{3}$.',
          'Косинус разности: $\\cos x\\cos\\dfrac{\\pi}{3}+\\sin x\\sin\\dfrac{\\pi}{3}=\\cos\\left(x-\\dfrac{\\pi}{3}\\right)$. Уравнение: $\\cos\\left(x-\\dfrac{\\pi}{3}\\right)=1$.',
          '$x-\\dfrac{\\pi}{3}=2\\pi k\\ \\Leftrightarrow\\ x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$ — то же, что и через синус.',
        ],
        otvet: '$x=\\dfrac{\\pi}{3}+2\\pi k$, $k\\in\\mathbb{Z}$.',
      },
    },
  ],
};
