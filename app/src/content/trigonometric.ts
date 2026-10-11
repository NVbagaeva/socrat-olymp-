/**
 * Подтема «Тригонометрические функции» задания №12: всё, чем она
 * отличается от подтемы «Линейная функция» по конфигу. Признаки стоят в
 * data/functionTypes.ts у записи trigonometric, тексты — здесь.
 *
 * Обозначения — как в открытом банке ФИПИ: f(x) = a cos x + b,
 * f(x) = a sin x + b, f(x) = a tg x + b; спрашивают a или b.
 *
 * «Типы задач»: шесть типов банка, каждая плашка раскрывает разбор.
 * Метод во всех разборах один: цена клетки → две отмеченные точки →
 * значения функции в них → система → b → формула с числом → a →
 * формула полностью → проверка по графику. Рисунки —
 * lib/theoryFigures.ts (trig-ex-*), числа те же. Примеры — не из
 * открытого банка.
 *
 * Разметка внутри строк: $…$ — формула TeX, **…** — выделение.
 */

import type { Formulation, SectionAbout, TutorMaterial } from './sections';
import type { RichExample } from './theoryRich';

const CHECK = 'Проверка по графику';

const cosA: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\cos x + b$, найти $a$',
  condition: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $a$.',
  figure: 'trig-ex-cos-a',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Клетка по оси $x$ — $\\dfrac{\\pi}{4}$, по оси $y$ — единица. Отмечены точки $(0;\\, 2)$ и $\\left(\\dfrac{\\pi}{2};\\, -1\\right)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\cos 0 = 1$, $\\cos \\dfrac{\\pi}{2} = 0$. Подставляем:'],
      lines: ['\\begin{cases} a + b = 2 \\\\ b = -1 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$, затем $a$',
      paras: ['Второе уравнение сразу даёт $b = -1$. Формула: $f(x) = a\\cos x - 1$. Из первого уравнения:'],
      lines: ['a - 1 = 2 \\;\\Rightarrow\\; a = 3'],
      more: [{ paras: ['Формула теперь полностью известна:'], lines: ['f(x) = 3\\cos x - 1'] }],
    },
    {
      label: CHECK,
      paras: ['Наибольшее значение $-1 + 3 = 2$ при $x = 0$, наименьшее $-1 - 3 = -4$ при $x = \\pi$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '3',
};

const cosB: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\cos x + b$, найти $b$',
  condition: 'На рисунке изображён график функции $f(x) = a\\cos x + b$. Найдите $b$.',
  figure: 'trig-ex-cos-b',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Клетка по оси $x$ — $\\dfrac{\\pi}{4}$, по оси $y$ — единица. Отмечены точки $(0;\\, 3)$ и $(\\pi;\\, -1)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\cos 0 = 1$, $\\cos \\pi = -1$. Подставляем:'],
      lines: ['\\begin{cases} a + b = 3 \\\\ -a + b = -1 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$',
      paras: ['Складываем уравнения — $a$ уходит:'],
      lines: ['2b = 3 + (-1) = 2 \\;\\Rightarrow\\; b = 1'],
      more: [{ paras: ['Формула теперь выглядит так:'], lines: ['f(x) = a\\cos x + 1'] }],
    },
    {
      label: 'Шаг 4. Находим $a$',
      paras: ['Из первого уравнения $a = 3 - 1 = 2$. Формула теперь полностью известна:'],
      lines: ['f(x) = 2\\cos x + 1'],
    },
    {
      label: CHECK,
      paras: ['Середина волны — прямая $y = 1$: ровно посередине между $3$ и $-1$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '1',
};

const tgA: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\operatorname{tg} x + b$, найти $a$',
  condition: 'На рисунке изображён график функции $f(x) = a\\operatorname{tg} x + b$. Найдите $a$.',
  figure: 'trig-ex-tg-a',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Клетка по оси $x$ — $\\dfrac{\\pi}{4}$, по оси $y$ — единица. Отмечены точки $(0;\\, -1)$ и $\\left(\\dfrac{\\pi}{4};\\, 2\\right)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\operatorname{tg} 0 = 0$, $\\operatorname{tg} \\dfrac{\\pi}{4} = 1$. Подставляем:'],
      lines: ['\\begin{cases} b = -1 \\\\ a + b = 2 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$, затем $a$',
      paras: ['Первое уравнение сразу даёт $b = -1$. Из второго:'],
      lines: ['a - 1 = 2 \\;\\Rightarrow\\; a = 3'],
      more: [{ paras: ['Формула теперь полностью известна:'], lines: ['f(x) = 3\\operatorname{tg} x - 1'] }],
    },
    {
      label: CHECK,
      paras: ['График пересекает ось $Oy$ в точке $(0;\\, -1)$, ветви возрастают — $a > 0$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '3',
};

const tgB: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\operatorname{tg} x + b$, найти $b$',
  condition: 'На рисунке изображён график функции $f(x) = a\\operatorname{tg} x + b$. Найдите $b$.',
  figure: 'trig-ex-tg-b',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Отмечены точки $\\left(\\dfrac{\\pi}{4};\\, 3\\right)$ и $\\left(-\\dfrac{\\pi}{4};\\, -1\\right)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\operatorname{tg} \\dfrac{\\pi}{4} = 1$, $\\operatorname{tg}\\left(-\\dfrac{\\pi}{4}\\right) = -1$. Подставляем:'],
      lines: ['\\begin{cases} a + b = 3 \\\\ -a + b = -1 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$',
      paras: ['Складываем уравнения — $a$ уходит:'],
      lines: ['2b = 3 + (-1) = 2 \\;\\Rightarrow\\; b = 1'],
      more: [{ paras: ['Формула теперь выглядит так:'], lines: ['f(x) = a\\operatorname{tg} x + 1'] }],
    },
    {
      label: 'Шаг 4. Находим $a$',
      paras: ['Вычитаем уравнения: $2a = 3 - (-1) = 4$, $a = 2$. Формула теперь полностью известна:'],
      lines: ['f(x) = 2\\operatorname{tg} x + 1'],
    },
    {
      label: CHECK,
      paras: ['При $x = 0$ тангенс равен нулю, и $f(0) = b = 1$: график проходит через $(0;\\, 1)$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '1',
};

const sinA: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\sin x + b$, найти $a$',
  condition: 'На рисунке изображён график функции $f(x) = a\\sin x + b$. Найдите $a$.',
  figure: 'trig-ex-sin-a',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Единица на оси $y$ — две клетки, значит, клетка — $0{,}5$. Отмечены точки $(0;\\, 0{,}5)$ и $\\left(\\dfrac{\\pi}{2};\\, 2\\right)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\sin 0 = 0$, $\\sin \\dfrac{\\pi}{2} = 1$. Подставляем:'],
      lines: ['\\begin{cases} b = 0{,}5 \\\\ a + b = 2 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$, затем $a$',
      paras: ['Первое уравнение сразу даёт $b = 0{,}5$. Из второго:'],
      lines: ['a + 0{,}5 = 2 \\;\\Rightarrow\\; a = 1{,}5'],
      more: [{ paras: ['Формула теперь полностью известна:'], lines: ['f(x) = 1{,}5\\sin x + 0{,}5'] }],
    },
    {
      label: CHECK,
      paras: ['Наибольшее значение $0{,}5 + 1{,}5 = 2$ при $x = \\dfrac{\\pi}{2}$, наименьшее $0{,}5 - 1{,}5 = -1$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '1,5',
};

const sinB: RichExample = {
  type: 'example',
  title: 'Пример. $f(x) = a\\sin x + b$, найти $b$',
  condition: 'На рисунке изображён график функции $f(x) = a\\sin x + b$. Найдите $b$.',
  figure: 'trig-ex-sin-b',
  steps: [
    {
      label: 'Шаг 1. Клетки и точки',
      paras: ['Клетка по оси $y$ — $0{,}5$. Отмечены точки $\\left(\\dfrac{\\pi}{2};\\, 2{,}5\\right)$ и $\\left(-\\dfrac{\\pi}{2};\\, -0{,}5\\right)$.'],
    },
    {
      label: 'Шаг 2. Значения и система',
      paras: ['$\\sin \\dfrac{\\pi}{2} = 1$, $\\sin\\left(-\\dfrac{\\pi}{2}\\right) = -1$. Подставляем:'],
      lines: ['\\begin{cases} a + b = 2{,}5 \\\\ -a + b = -0{,}5 \\end{cases}'],
    },
    {
      label: 'Шаг 3. Находим $b$',
      paras: ['Складываем уравнения — $a$ уходит:'],
      lines: ['2b = 2{,}5 + (-0{,}5) = 2 \\;\\Rightarrow\\; b = 1'],
      more: [{ paras: ['Формула теперь выглядит так:'], lines: ['f(x) = a\\sin x + 1'] }],
    },
    {
      label: 'Шаг 4. Находим $a$',
      paras: ['Вычитаем уравнения: $2a = 3$, $a = 1{,}5$. Формула теперь полностью известна:'],
      lines: ['f(x) = 1{,}5\\sin x + 1'],
    },
    {
      label: CHECK,
      paras: ['Середина волны — прямая $y = 1$, ровно посередине между $2{,}5$ и $-0{,}5$. Сходится с рисунком.'],
      check: true,
    },
  ],
  answer: '1',
};

const TYPES: Formulation[] = [
  {
    no: '01',
    title: 'Косинус: найти $a$',
    hint: 'Точка, где косинус равен нулю, даёт $b$; вторая точка — $a$.',
    icon: 'value',
    typeScene: 'trig-cos',
    analysis: {
      id: 'trig-cos-a',
      examples: [cosA],
      trainer: 'koef-a',
      prep: 'trig-cos',
    },
  },
  {
    no: '02',
    title: 'Косинус: найти $b$',
    hint: 'Точки со значениями $1$ и $-1$: складываем уравнения.',
    icon: 'value',
    typeScene: 'trig-cos',
    analysis: {
      id: 'trig-cos-b',
      examples: [cosB],
      trainer: 'koef-b',
      prep: 'trig-sistema',
    },
  },
  {
    no: '03',
    title: 'Тангенс: найти $a$',
    hint: 'В точке $x = 0$ тангенс равен нулю — там $f(0) = b$; затем $a$.',
    icon: 'value',
    typeScene: 'trig-tg',
    analysis: {
      id: 'trig-tg-a',
      examples: [tgA],
      trainer: 'koef-a',
      prep: 'trig-tg',
    },
  },
  {
    no: '04',
    title: 'Тангенс: найти $b$',
    hint: 'Точки при $x = \\pm\\dfrac{\\pi}{4}$: значения $1$ и $-1$, складываем.',
    icon: 'value',
    typeScene: 'trig-tg',
    analysis: {
      id: 'trig-tg-b',
      examples: [tgB],
      trainer: 'koef-b',
      prep: 'trig-sistema',
    },
  },
  {
    no: '05',
    title: 'Синус: найти $a$',
    hint: 'Сначала цена клетки по оси $y$, потом система.',
    icon: 'value',
    typeScene: 'trig-sin',
    analysis: {
      id: 'trig-sin-a',
      examples: [sinA],
      trainer: 'koef-a',
      prep: 'trig-polovina',
    },
  },
  {
    no: '06',
    title: 'Синус: найти $b$',
    hint: 'Значения $1$ и $-1$ при $x = \\pm\\dfrac{\\pi}{2}$: складываем уравнения.',
    icon: 'value',
    typeScene: 'trig-sin',
    analysis: {
      id: 'trig-sin-b',
      examples: [sinB],
      trainer: 'koef-b',
      prep: 'trig-sin',
    },
  },
];

export const TRIGONOMETRIC_ABOUT: Omit<SectionAbout, 'hint' | 'title'> = {
  description:
    'Разбираем графики функций $f(x) = a\\cos x + b$, $f(x) = a\\sin x + b$ и $f(x) = a\\operatorname{tg} x + b$ — все шесть типов задач открытого банка ФИПИ. Параметры не угадываем по рисунку: читаем цену клетки, берём две отмеченные точки и решаем систему.',
  formsTitle: 'Типы задач в этом разделе',
  forms: TYPES,
  skillsTitle: 'Что нужно уметь для задания №12',
  skills: [
    'Читать клетку: по оси $x$ — $\\dfrac{\\pi}{4}$, по оси $y$ — по подписанной единице',
    'Знать значения: $\\cos 0 = 1$, $\\sin \\dfrac{\\pi}{2} = 1$, $\\operatorname{tg} \\dfrac{\\pi}{4} = 1$ и где функция равна нулю',
    'Составлять систему по двум отмеченным точкам в узлах сетки',
    'Находить $b$ по точке, где функция равна нулю',
    'Складывать и вычитать уравнения, когда значения $1$ и $-1$',
    'Проверять ответ по графику: максимум, минимум, точка $(0;\\, b)$ у тангенса',
  ],
  later: {
    title: 'Это пригодится позже',
    text: 'Тригонометрические уравнения и неравенства, задачи на колебания, производная синуса и косинуса. Всё начинается с умения читать график и значения в основных точках.',
    action: 'Подробнее о тригонометрии',
  },
};

export const TRIGONOMETRIC = {
  /** Шапка: H1 общий на задание; название подтемы — из data/functionTypes.ts. */
  head: true,
  about: TRIGONOMETRIC_ABOUT,
  /* Материалов для репетиторов у подтемы ещё нет: листы — в генераторе. */
  tutors: [] as TutorMaterial[],
} as const;
