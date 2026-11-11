/* Данные демо-страницы задания №8 (/styleguide/zadanie-8/).

   Задачи, разборы и названия типов — настоящие, из генератора №8.
   Подписи шагов, подсказки-вопросы, шапка и примеры к формулам —
   черновик для показа оформления: перед выходом на сайт их читает
   автор. Прогресс ученика — образец, в бою он придёт из хранилища. */

export interface Gruppa8 {
  id: string;
  nazvanie: string;
  /** Формула-значок группы, TeX. */
  znak: string;
  /** Тон значка: синий, тёмно-синий, оранжевый, терракотовый. */
  ton: 'blue' | 'navy' | 'orange' | 'terra';
  prototypes: string[];
  /** Образец прогресса: решено, верно, ошибок из последних пяти. */
  resheno: number;
  verno: number;
  oshibokIz5: number;
}

export const GRUPPY8: Gruppa8[] = [
  {
    id: 'stepeni',
    nazvanie: 'Степени',
    znak: 'a^{n}',
    ton: 'blue',
    prototypes: ['8.A', '8.C', '8.D'],
    resheno: 12,
    verno: 9,
    oshibokIz5: 1,
  },
  {
    id: 'korni',
    nazvanie: 'Корни',
    znak: '\\sqrt{a}',
    ton: 'navy',
    prototypes: ['8.B', '8.E', '8.F', '8.G'],
    resheno: 7,
    verno: 3,
    oshibokIz5: 3,
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмы',
    znak: '\\log_{a} b',
    ton: 'orange',
    prototypes: ['8.H', '8.I', '8.J', '8.K', '8.L'],
    resheno: 0,
    verno: 0,
    oshibokIz5: 0,
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Тригонометрия',
    znak: '\\sin\\alpha',
    ton: 'terra',
    prototypes: ['8.M', '8.N', '8.O', '8.P', '8.Q', '8.R', '8.S', '8.T', '8.U', '8.V'],
    resheno: 18,
    verno: 15,
    oshibokIz5: 0,
  },
  {
    id: 'bukvennye',
    nazvanie: 'Буквенные выражения',
    znak: 'a^2-b^2',
    ton: 'blue',
    prototypes: ['8.W', '8.X', '8.Y', '8.Z'],
    resheno: 4,
    verno: 2,
    oshibokIz5: 2,
  },
];

export const SHAPKA8 = {
  nadzagolovok: 'Задание №8 · первая часть',
  zagolovok: 'Найти значение выражения',
  lead: 'Одно выражение — одно число в ответ. Проверяется, умеете ли вы упростить запись свойствами степеней, корней, логарифмов и тригонометрии, а не считать «в лоб».',
  fakty: [
    { znachenie: '1', podpis: 'первичный балл' },
    { znachenie: '≈ 3', podpis: 'минуты на экзамене' },
    { znachenie: '26', podpis: 'типов в пяти группах' },
  ],
  opasno: [
    'Знак: четверть угла и минус перед скобкой теряют чаще всего.',
    'Счёт «в лоб»: большие степени и корни не вычисляют, а сокращают.',
  ],
};

/** Подписи шагов разбора и подсказка-вопрос: по прототипу. */
export const SHAGI8: Record<string, { shagi: string[]; podskazka: string; sovet?: string }> = {
  '8.A': {
    shagi: [
      'Сначала степень в степени: показатели перемножаем.',
      'Основания одинаковые — при делении показатели вычитаем. Считаем только последнюю, маленькую степень.',
    ],
    podskazka: 'Что происходит с показателями, когда степень возводят в степень?',
    sovet:
      'Не вычисляйте $3^{64}$ — число огромное и не нужно. Вся работа идёт с показателями, считать приходится только $3^{4}$.',
  },
  '8.H': {
    shagi: [
      'Основания одинаковые — разность логарифмов собираем в логарифм частного.',
      'Спрашиваем себя: в какую степень возвести основание, чтобы получить число под логарифмом?',
    ],
    podskazka: 'Основания одинаковые. Во что превращается разность двух логарифмов?',
  },
  '8.M': {
    shagi: [
      'Из основного тождества находим квадрат синуса.',
      'Знак выбираем по четверти: смотрим, где лежит угол.',
    ],
    podskazka: 'В какой четверти лежит угол и какой знак там у синуса?',
  },
};

export interface Formula8 {
  tex: string;
  primer: string;
}

/** «Что нужно знать»: формула и маленький пример применения. */
export const FORMULY8: { gruppa: string; ton: Gruppa8['ton']; formuly: Formula8[] }[] = [
  {
    gruppa: 'Степени',
    ton: 'blue',
    formuly: [
      { tex: 'a^{m} \\cdot a^{n} = a^{m+n}', primer: '2^{3} \\cdot 2^{4} = 2^{7}' },
      { tex: '(a^{m})^{n} = a^{mn}', primer: '(5^{2})^{3} = 5^{6}' },
      { tex: 'a^{n} \\cdot b^{n} = (ab)^{n}', primer: '2^{5} \\cdot 5^{5} = 10^{5}' },
    ],
  },
  {
    gruppa: 'Корни',
    ton: 'navy',
    formuly: [
      {
        tex: '\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{ab}',
        primer: '\\sqrt{2} \\cdot \\sqrt{8} = \\sqrt{16} = 4',
      },
      { tex: '(\\sqrt{a})^{2} = a', primer: '(3\\sqrt{5})^{2} = 9 \\cdot 5 = 45' },
      { tex: '\\sqrt[n]{a} = a^{\\frac{1}{n}}', primer: '\\sqrt[3]{8} = 8^{\\frac{1}{3}} = 2' },
    ],
  },
  {
    gruppa: 'Логарифмы',
    ton: 'orange',
    formuly: [
      {
        tex: '\\log_{a} x + \\log_{a} y = \\log_{a} xy',
        primer: '\\log_{6} 4 + \\log_{6} 9 = \\log_{6} 36 = 2',
      },
      {
        tex: '\\dfrac{\\log_{c} b}{\\log_{c} a} = \\log_{a} b',
        primer: '\\dfrac{\\log_{3} 8}{\\log_{3} 2} = \\log_{2} 8 = 3',
      },
      { tex: '\\log_{a} b^{k} = k\\log_{a} b', primer: '\\log_{2} 2^{5} = 5' },
    ],
  },
  {
    gruppa: 'Тригонометрия',
    ton: 'terra',
    formuly: [
      {
        tex: '\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1',
        primer: '\\cos\\alpha = 0{,}8 \\Rightarrow \\sin^{2}\\alpha = 0{,}36',
      },
      {
        tex: '\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha',
        primer: '2\\sin 15^\\circ\\cos 15^\\circ = \\sin 30^\\circ = \\tfrac{1}{2}',
      },
      {
        tex: '\\sin(90^\\circ - \\alpha) = \\cos\\alpha',
        primer: '\\sin 72^\\circ = \\cos 18^\\circ',
      },
    ],
  },
];

export const DELIMOST8 = [
  { na: '2', pravilo: 'последняя цифра чётная', primer: '704' },
  { na: '3', pravilo: 'сумма цифр делится на 3', primer: '$243$: $2 + 4 + 3 = 9$' },
  { na: '4', pravilo: 'число из двух последних цифр делится на 4', primer: '$1024$: $24$' },
  { na: '5', pravilo: 'последняя цифра 0 или 5', primer: '625' },
  { na: '9', pravilo: 'сумма цифр делится на 9', primer: '$576$: $5 + 7 + 6 = 18$' },
];

export const VARIANTY8 = [
  {
    id: 'a',
    bukva: 'А',
    nazvanie: 'Витрина',
    lead: 'Крупные стеклянные карточки сеткой, значок-формула у каждой группы, экран задачи — одна колонка по центру.',
  },
  {
    id: 'b',
    bukva: 'Б',
    nazvanie: 'Маршрут',
    lead: 'Плотный список с цветной направляющей слева, прогресс справа в строке, экран задачи на широком экране — в две колонки.',
  },
] as const;

export type Variant8 = (typeof VARIANTY8)[number]['id'];
