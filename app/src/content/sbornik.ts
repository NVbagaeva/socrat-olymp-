/**
 * «Интерактивный сборник для поступающих в вузы» — алгебра.
 *
 * Главы, типы задач и вкладки. Банк задач — data/sbornik (собирается
 * tools/sbornik, ответы проверены sympy), карта тем —
 * docs/sbornik/karta.md. Источник структуры на сайте не упоминается.
 */

import type { RazdelTab } from '@/content/vkladki';
import { SBORNIK_TAIL } from '@/lib/paths';

export const SBORNIK_TITLE = 'Интерактивный сборник для поступающих в вузы';

export const SBORNIK_LEAD =
  'Алгебра по главам: от преобразований выражений до начал анализа. ' +
  'Задачи трёх уровней с автопроверкой, подсказками-вопросами и решениями по шагам.';

/** Уровни: группы трудности внутри главы. */
export const UROVNI = [
  { id: 1, zvezdy: '★', nazvanie: 'Базовый', poyasnenie: 'обязательный минимум' },
  { id: 2, zvezdy: '★★', nazvanie: 'Средний', poyasnenie: 'уверенное владение программой' },
  { id: 3, zvezdy: '★★★', nazvanie: 'Повышенный', poyasnenie: 'для сильных вузов' },
] as const;

export type Uroven = 1 | 2 | 3;

export interface Glava {
  nomer: number;
  nazvanie: string;
  /** Коротко для карточки. */
  kratko: string;
  /** Значок: формула TeX. */
  znak: string;
  /** Сколько задач будет в главе. */
  zadach: number;
  /** Глава открыта на сайте. */
  gotova: boolean;
}

export const GLAVY: readonly Glava[] = [
  {
    nomer: 1,
    nazvanie: 'Тождественные преобразования алгебраических выражений',
    kratko: 'Дроби, степени, корни, модули',
    znak: '\\sqrt[3]{a^2}',
    zadach: 360,
    gotova: true,
  },
  {
    nomer: 2,
    nazvanie: 'Алгебраические уравнения и системы',
    kratko: 'Рациональные, иррациональные, системы',
    znak: 'x^2\\!=\\!9',
    zadach: 370,
    gotova: false,
  },
  {
    nomer: 3,
    nazvanie: 'Текстовые задачи',
    kratko: 'Движение, работа, проценты, смеси',
    znak: 's\\!=\\!vt',
    zadach: 380,
    gotova: false,
  },
  {
    nomer: 4,
    nazvanie: 'Тригонометрические преобразования',
    kratko: 'Формулы, упрощение, вычисление',
    znak: '\\sin 2\\alpha',
    zadach: 500,
    gotova: false,
  },
  {
    nomer: 5,
    nazvanie: 'Тригонометрические уравнения и системы',
    kratko: 'Серии корней, методы решения',
    znak: '\\pi k',
    zadach: 500,
    gotova: false,
  },
  {
    nomer: 6,
    nazvanie: 'Прогрессии',
    kratko: 'Арифметическая и геометрическая',
    znak: 'a_n',
    zadach: 90,
    gotova: false,
  },
  {
    nomer: 7,
    nazvanie: 'Логарифмы. Показательные и логарифмические уравнения',
    kratko: 'Вычисления, уравнения, системы',
    znak: '\\log_a b',
    zadach: 360,
    gotova: false,
  },
  {
    nomer: 8,
    nazvanie: 'Неравенства',
    kratko: 'Метод интервалов, ОДЗ, параметры',
    znak: 'x\\geqslant 0',
    zadach: 300,
    gotova: false,
  },
  {
    nomer: 9,
    nazvanie: 'Комбинаторика и бином Ньютона',
    kratko: 'Перестановки, сочетания, бином',
    znak: 'C_n^k',
    zadach: 90,
    gotova: false,
  },
  {
    nomer: 10,
    nazvanie: 'Дополнительные задачи',
    kratko: 'Функции, графики, модуль, параметры',
    znak: '|x|',
    zadach: 395,
    gotova: false,
  },
  {
    nomer: 11,
    nazvanie: 'Начала анализа',
    kratko: 'Производная, касательная, интеграл',
    znak: "f'(x)",
    zadach: 275,
    gotova: false,
  },
];

export interface TipZadach {
  /** «1.2» — глава.тип. */
  id: string;
  nazvanie: string;
  /** Что в типе: одна фраза. */
  opisanie: string;
  /** Значок: формула TeX. */
  znak: string;
}

/** Типы задач по главам: порядок — порядок на сайте. */
export const TIPY: Readonly<Record<number, readonly TipZadach[]>> = {
  1: [
    {
      id: '1.1',
      nazvanie: 'Рациональные дроби',
      opisanie: 'Общий знаменатель, многоэтажные дроби, отрицательные степени, формулы сокращённого умножения',
      znak: '\\tfrac{a}{b}',
    },
    {
      id: '1.2',
      nazvanie: 'Корни и дробные степени',
      opisanie: 'Вынесение множителя, общий показатель, сопряжённые множители, сокращение дробей с корнями',
      znak: 'a^{\\frac{2}{3}}',
    },
    {
      id: '1.3',
      nazvanie: 'Числовые выражения с радикалами',
      opisanie: 'Корни разных степеней: привести к одному показателю и вычислить точно',
      znak: '\\sqrt[6]{2}',
    },
    {
      id: '1.4',
      nazvanie: 'Вложенные радикалы',
      opisanie: 'Полный квадрат и полный куб под корнем: вычислить без калькулятора',
      znak: '\\sqrt{a\\!+\\!\\sqrt{b}}',
    },
    {
      id: '1.5',
      nazvanie: 'Подстановка',
      opisanie: 'Подставить данное выражение вместо переменной и упростить результат',
      znak: 'x\\!=\\!\\ldots',
    },
    {
      id: '1.6',
      nazvanie: 'Иррациональность в знаменателе',
      opisanie: 'Освободить знаменатель от корней: сопряжённое, сумма и разность кубов',
      znak: '\\tfrac{1}{\\sqrt{2}}',
    },
    {
      id: '1.7',
      nazvanie: 'Приёмы с сопряжёнными',
      opisanie: 'Найти сумму корней по разности, значения симметрических выражений',
      znak: 'a\\!+\\!b',
    },
    {
      id: '1.8',
      nazvanie: 'Дроби с многочленами',
      opisanie: 'Разложить многочлены третьей и четвёртой степени и сократить дробь',
      znak: 'x^3',
    },
    {
      id: '1.9',
      nazvanie: 'Сложные иррациональные выражения',
      opisanie: 'Вложенные корни, дробные степени, условия на буквы, подстановка значений',
      znak: '\\sqrt{\\sqrt{x}}',
    },
    {
      id: '1.10',
      nazvanie: 'Выражения с модулем',
      opisanie: 'Раскрыть модуль на промежутках и упростить: ответ по случаям',
      znak: '|a|',
    },
    {
      id: '1.11',
      nazvanie: 'Корни из полных квадратов',
      opisanie: 'Выделить полный квадрат под корнем, $\\sqrt{A^2}=|A|$, разобрать случаи',
      znak: '\\sqrt{A^2}',
    },
    {
      id: '1.12',
      nazvanie: 'Разные задачи',
      opisanie: 'Полный квадрат с параметром, суммы-«телескопы», простейшие дроби, разложение',
      znak: '\\Sigma',
    },
    {
      id: '1.13',
      nazvanie: 'Упрощение с областью определения',
      opisanie: 'Найти, где выражение определено, и упростить на каждом промежутке',
      znak: 'D(f)',
    },
    {
      id: '1.14',
      nazvanie: 'Разложение на множители',
      opisanie: 'Трудные многочлены: выделение квадрата, циклические выражения',
      znak: '(a)(b)',
    },
  ],
};

/** Вкладки главы: Теория · Задачи по типам · Тренажёр · Генератор. */
export const GLAVA_TABS: readonly RazdelTab[] = [
  { id: 'teoriya', label: 'Теория', tail: `${SBORNIK_TAIL.teoriya}/`, icon: 'book' },
  { id: 'zadachi', label: 'Задачи по типам', tail: '', icon: 'tasks' },
  { id: 'trenazher', label: 'Тренажёр', tail: `${SBORNIK_TAIL.trenazher}/`, icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: `${SBORNIK_TAIL.generator}/`, icon: 'settings' },
];

export function glavaPoNomeru(nomer: number): Glava | undefined {
  return GLAVY.find((g) => g.nomer === nomer);
}

/** Заголовок вкладки в <title>. */
export function sbornikTitle(...chasti: string[]): string {
  return [...chasti, 'Сборник для вузов'].join(' — ');
}
