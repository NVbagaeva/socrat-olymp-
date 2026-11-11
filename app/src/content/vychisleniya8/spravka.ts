/**
 * Шапка вкладки «О задании» №8, блок «Что нужно знать» и признаки
 * делимости. ЧЕРНОВИК НА ВЫЧИТКУ — см. docs/zadanie-8-teksty.md.
 */

import type { Ton8 } from './gruppy';

export const SHAPKA8 = {
  nadzagolovok: 'Задание №8 · первая часть',
  zagolovok: 'Найти значение выражения',
  lead: 'Одно выражение — одно число в ответ. Проверяется, умеете ли вы упростить запись свойствами степеней, корней, логарифмов и тригонометрии, а не считать «в лоб».',
  fakty: [
    { znachenie: '1', podpis: 'первичный балл' },
    { znachenie: '≈ 3', podpis: 'минуты на экзамене' },
    { znachenie: '26', podpis: 'типов в пяти группах' },
  ],
  opasnoTitle: 'Чем опасно',
  opasno: [
    'Нашли синус по косинусу и забыли про четверть — потеряли знак.',
    'Путают $(a^{m})^{n}$ и $a^{m} \\cdot a^{n}$: где показатели умножают, а где складывают.',
    '$\\sqrt{a^{2}}$ — это $\\lvert a \\rvert$, а не $a$: при отрицательном $a$ ответ меняет знак.',
    'Свойства логарифмов применяют к сумме под логарифмом — у $\\log_{a}(x + y)$ формулы нет.',
    'Перемножают всё подряд вместо того, чтобы сократить, — и ошибаются в счёте.',
  ],
  gruppyTitle: 'Типы задач по группам',
  gruppyLead:
    'Нажмите на тип — откроется разобранный пример. Кнопка «Потренировать этот тип» ведёт в тренажёр.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Формулы по группам, у каждой — маленький пример применения.',
  tipov: (n: number) => `${n} ${n === 1 ? 'тип' : n < 5 ? 'типа' : 'типов'}`,
  povtorit: 'Стоит повторить',
  neNachato: 'ещё не начато',
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
  primer: 'Разобранный пример',
  primerZhdyot: 'Собираем пример…',
  primerNet: 'Пример не собрался — попробуйте тренажёр.',
  otvet: 'Ответ',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи',
  lovushka: 'Где теряют балл',
  delimostTitle: 'Признаки делимости — чтобы быстро сокращать дроби',
};

export interface Formula8 {
  tex: string;
  /** Пример применения, TeX. */
  primer: string;
}

export interface FormulyGruppy8 {
  id: string;
  nazvanie: string;
  ton: Ton8;
  formuly: Formula8[];
}

export const FORMULY8: FormulyGruppy8[] = [
  {
    id: 'stepeni',
    nazvanie: 'Степени',
    ton: 'blue',
    formuly: [
      { tex: 'a^{m} \\cdot a^{n} = a^{m+n}', primer: '2^{3} \\cdot 2^{4} = 2^{7}' },
      { tex: 'a^{m} : a^{n} = a^{m-n}', primer: '5^{7} : 5^{5} = 5^{2} = 25' },
      { tex: '(a^{m})^{n} = a^{mn}', primer: '(5^{2})^{3} = 5^{6}' },
      { tex: 'a^{n} \\cdot b^{n} = (ab)^{n}', primer: '2^{5} \\cdot 5^{5} = 10^{5}' },
      { tex: 'a^{-n} = \\dfrac{1}{a^{n}}', primer: '2^{-3} = \\dfrac{1}{8} = 0{,}125' },
    ],
  },
  {
    id: 'korni',
    nazvanie: 'Корни',
    ton: 'navy',
    formuly: [
      {
        tex: '\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{ab}',
        primer: '\\sqrt{2} \\cdot \\sqrt{8} = \\sqrt{16} = 4',
      },
      { tex: '(\\sqrt{a})^{2} = a', primer: '(3\\sqrt{5})^{2} = 9 \\cdot 5 = 45' },
      { tex: '\\sqrt[n]{a} = a^{\\frac{1}{n}}', primer: '\\sqrt[3]{8} = 8^{\\frac{1}{3}} = 2' },
      { tex: '\\sqrt{a^{2}} = \\lvert a \\rvert', primer: '\\sqrt{(-7)^{2}} = 7' },
      {
        tex: '(\\sqrt{a} - \\sqrt{b})^{2} = a - 2\\sqrt{ab} + b',
        primer: '(\\sqrt{3} - \\sqrt{2})^{2} = 5 - 2\\sqrt{6}',
      },
    ],
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмы',
    ton: 'orange',
    formuly: [
      {
        tex: '\\log_{a} x + \\log_{a} y = \\log_{a} xy',
        primer: '\\log_{6} 4 + \\log_{6} 9 = \\log_{6} 36 = 2',
      },
      {
        tex: '\\log_{a} x - \\log_{a} y = \\log_{a} \\dfrac{x}{y}',
        primer: '\\log_{2} 60 - \\log_{2} 15 = \\log_{2} 4 = 2',
      },
      { tex: '\\log_{a} b^{k} = k\\log_{a} b', primer: '\\log_{2} \\sqrt[5]{2} = \\dfrac{1}{5}' },
      {
        tex: '\\dfrac{\\log_{c} b}{\\log_{c} a} = \\log_{a} b',
        primer: '\\dfrac{\\log_{3} 8}{\\log_{3} 2} = \\log_{2} 8 = 3',
      },
      {
        tex: '\\log_{a} b \\cdot \\log_{b} c = \\log_{a} c',
        primer: '\\log_{5} 13 \\cdot \\log_{13} 625 = \\log_{5} 625 = 4',
      },
      { tex: 'a^{\\log_{a} b} = b', primer: '7^{\\log_{7} 5} = 5' },
    ],
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Тригонометрия',
    ton: 'terra',
    formuly: [
      {
        tex: '\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1',
        primer: '\\cos\\alpha = -0{,}8 \\Rightarrow \\sin^{2}\\alpha = 0{,}36',
      },
      {
        tex: '\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}',
        primer: '\\dfrac{0{,}6}{-0{,}8} = -0{,}75',
      },
      {
        tex: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha',
        primer: '2\\sin 15^\\circ\\cos 15^\\circ = \\sin 30^\\circ = \\tfrac{1}{2}',
      },
      {
        tex: '\\cos 2\\alpha = \\cos^{2}\\alpha - \\sin^{2}\\alpha = 1 - 2\\sin^{2}\\alpha',
        primer: '\\sin\\alpha = 0{,}5 \\Rightarrow \\cos 2\\alpha = 0{,}5',
      },
      {
        tex: '\\sin(90^\\circ - \\alpha) = \\cos\\alpha',
        primer: '\\sin 72^\\circ = \\cos 18^\\circ',
      },
      {
        tex: '\\cos(180^\\circ - \\alpha) = -\\cos\\alpha',
        primer: '\\cos 172^\\circ = -\\cos 8^\\circ',
      },
      {
        tex: '\\operatorname{tg}\\alpha \\cdot \\operatorname{tg}(90^\\circ - \\alpha) = 1',
        primer: '\\operatorname{tg} 5^\\circ \\cdot \\operatorname{tg} 85^\\circ = 1',
      },
    ],
  },
  {
    id: 'bukvennye',
    nazvanie: 'Буквенные выражения',
    ton: 'green',
    formuly: [
      { tex: 'a^{2} - b^{2} = (a - b)(a + b)', primer: '\\dfrac{a^{2} - 4b^{2}}{a + 2b} = a - 2b' },
      { tex: '(a \\pm b)^{2} = a^{2} \\pm 2ab + b^{2}', primer: '(a + b)^{2} - (a - b)^{2} = 4ab' },
      { tex: '(ab)^{n} = a^{n}b^{n}', primer: '(5a)^{3} = 125a^{3}' },
      {
        tex: '\\log_{a}(a^{k} b) = k + \\log_{a} b',
        primer: '\\log_{a}(a^{5} b) - \\log_{a} b = 5',
      },
    ],
  },
];

export interface Delimost8 {
  na: string;
  pravilo: string;
  primer: string;
}

export const DELIMOST8: Delimost8[] = [
  { na: '2', pravilo: 'последняя цифра чётная', primer: '704' },
  { na: '3', pravilo: 'сумма цифр делится на 3', primer: '243: 2 + 4 + 3 = 9' },
  { na: '4', pravilo: 'число из двух последних цифр делится на 4', primer: '1024: 24 = 4 · 6' },
  { na: '5', pravilo: 'последняя цифра 0 или 5', primer: '625' },
  { na: '6', pravilo: 'чётное и сумма цифр делится на 3', primer: '96: 9 + 6 = 15' },
  { na: '8', pravilo: 'число из трёх последних цифр делится на 8', primer: '2176: 176 = 8 · 22' },
  { na: '9', pravilo: 'сумма цифр делится на 9', primer: '576: 5 + 7 + 6 = 18' },
  { na: '25', pravilo: 'оканчивается на 00, 25, 50 или 75', primer: '625' },
];
