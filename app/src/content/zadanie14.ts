/**
 * Тексты раздела задания №14 «Уравнение»: шапка, вкладки, «О задании»,
 * типы уравнений и заглушки будущих глав.
 *
 * Готова глава «Тригонометрические уравнения». Показательные,
 * логарифмические, иррациональные и комбинированные уравнения заведены
 * в архитектуре заглушками: у комбинированных сразу четыре подтипа,
 * задачи для будущих глав собраны в OTLOZHENO_14.
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';
import { nomerDvumya, nomerRazdela } from './struktura';

export const ZADANIE14 = {
  no: nomerDvumya('uravnenie-s-otborom'),
  slug: '14',
  title: taskName('14'),
  lead: 'Уравнение с развёрнутым решением: в пункте а решить, в пункте б отобрать корни на промежутке.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'okruzhnost', label: 'Окружность', tail: 'okruzhnost/trenazher/', icon: 'compass' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна: «Вкладка · Уравнение — Будет на ЕГЭ». */
export function zadanie14Title(tab: string): string {
  return `${tab} · ${ZADANIE14.title} — Будет на ЕГЭ`;
}

export const PROGRESS_14 = {
  teoriyaKey: '14',
} as const;

/* ── «О задании» ────────────────────────────────────────────────── */

export const O_ZADANII_14 = {
  title: `Задание ${nomerRazdela('uravnenie-s-otborom')}. Уравнение`,
  lead: 'Первое задание второй части: решение записывается полностью, а не только ответ.',
  format: [
    '**Пункт а** — решить уравнение: найти все корни и записать их сериями, например $x=\\dfrac{\\pi}{6}+2\\pi k,\\ k\\in\\mathbb{Z}$.',
    '**Пункт б** — найти корни, которые лежат на данном промежутке. Отбирают их по окружности или двойным неравенством.',
  ],
  kriteriiTitle: 'Как оценивается',
  kriterii: [
    { bally: '2', text: 'Обоснованно получены верные ответы в обоих пунктах.' },
    {
      bally: '1',
      text: 'Обоснованно получен верный ответ в пункте а, или получены неверные ответы из‑за вычислительной ошибки, но есть верная последовательность всех шагов решения обоих пунктов.',
    },
    { bally: '0', text: 'Решение не подходит ни под один из случаев выше.' },
  ],
  kriteriiNote:
    'Критерии — по проекту демонстрационного варианта ЕГЭ‑2027 (ФИПИ). Максимум — 2 балла. Правильный ответ без решения оценивается в 0 баллов.',
  tipyTitle: 'Типы уравнений',
  tipyLead: `Уравнение №${nomerRazdela('uravnenie-s-otborom')} бывает разных типов. Начни с тригонометрии — она встречается чаще всего.`,
  kTeorii: 'Открыть теорию',
} as const;

export type TipId14 = 'trig' | 'pokaz' | 'log' | 'irr' | 'komb';

export interface Tip14 {
  id: TipId14;
  title: string;
  text: string;
  /** Пример уравнения, TeX без долларов. */
  primer: string;
  gotovo: boolean;
  podtipy?: { id: string; title: string }[];
}

export const TIPY_14: Tip14[] = [
  {
    id: 'trig',
    title: 'Тригонометрические',
    text: 'Простейшие уравнения, формулы приведения и двойного угла, замена, однородные уравнения, вспомогательный угол.',
    primer: '6\\cos^2 x-7\\cos x-5=0',
    gotovo: true,
  },
  {
    id: 'pokaz',
    title: 'Показательные',
    text: 'Приведение к одному основанию и замена переменной.',
    primer: '4^x-2^{x+3}+15=0',
    gotovo: false,
  },
  {
    id: 'log',
    title: 'Логарифмические',
    text: 'Область допустимых значений, свойства логарифмов, замена.',
    primer: '2\\log_9^2 x-3\\log_9 x+1=0',
    gotovo: false,
  },
  {
    id: 'irr',
    title: 'Иррациональные',
    text: 'Корни: возведение в квадрат с условием и проверка.',
    primer: '\\sqrt{2x+3}=x',
    gotovo: false,
  },
  {
    id: 'komb',
    title: 'Комбинированные',
    text: 'Тригонометрия внутри дроби, логарифма, корня или показательной функции.',
    primer: '\\log_2(\\sin 2x)=\\log_2(\\sqrt{2}\\cos x)',
    gotovo: false,
    podtipy: [
      { id: 'drob', title: 'Тригонометрия и дробно‑рациональное уравнение' },
      { id: 'log', title: 'Тригонометрия и логарифм' },
      { id: 'koren', title: 'Тригонометрия и корень' },
      { id: 'pokaz', title: 'Тригонометрия и показательная функция' },
    ],
  },
];

export const SKORO_14 = 'Скоро';

/**
 * Задачи будущих глав: сохранены заранее, решения и разборы появятся
 * вместе с главой. На сайте пока не показываются.
 */
export const OTLOZHENO_14: {
  glava: TipId14;
  podtip?: string;
  uravnenie: string;
  promezhutok: string;
}[] = [
  { glava: 'pokaz', uravnenie: '4^x-2^{x+3}+15=0', promezhutok: '\\left[2;\\,\\sqrt{10}\\right]' },
  {
    glava: 'komb',
    podtip: 'log',
    uravnenie: '\\log_2(\\sin 2x)=\\log_2(\\sqrt{2}\\cos x)',
    promezhutok: '\\left[-\\pi;\\,\\dfrac{\\pi}{2}\\right]',
  },
  {
    glava: 'komb',
    podtip: 'pokaz',
    uravnenie: '3^{2\\sin^2 x+1}+3^{2\\cos^2 x}=12',
    promezhutok: '\\left[\\dfrac{5\\pi}{2};\\,4\\pi\\right]',
  },
  {
    glava: 'komb',
    podtip: 'pokaz',
    uravnenie:
      '\\left(\\dfrac{1}{16}\\right)^{\\cos x}+3\\cdot\\left(\\dfrac{1}{4}\\right)^{\\cos x}-4=0',
    promezhutok: '\\left[4\\pi;\\,7\\pi\\right]',
  },
  {
    glava: 'komb',
    podtip: 'pokaz',
    uravnenie:
      '\\left(\\dfrac{1}{9}\\right)^{\\cos\\left(\\frac{\\pi}{2}-x\\right)}=3^{2\\sin\\left(x+\\frac{\\pi}{2}\\right)}',
    promezhutok: '\\left[-\\dfrac{7\\pi}{2};\\,-2\\pi\\right]',
  },
  {
    glava: 'komb',
    podtip: 'koren',
    uravnenie: '(2\\sin x-1)\\left(\\sqrt{-\\cos x}+1\\right)=0',
    promezhutok: '\\left[\\dfrac{3\\pi}{2};\\,3\\pi\\right]',
  },
  {
    glava: 'komb',
    podtip: 'drob',
    uravnenie: '\\dfrac{9^{\\sin 2x}-3^{2\\sqrt{2}\\sin x}}{\\sqrt{2\\sin x}}=0',
    promezhutok: '\\left[\\dfrac{7\\pi}{2};\\,5\\pi\\right]',
  },
  {
    glava: 'komb',
    podtip: 'log',
    uravnenie: '\\log_3(\\sin 2x+\\cos(\\pi-x)+9)=2',
    promezhutok: '\\left[2\\pi;\\,\\dfrac{7\\pi}{2}\\right]',
  },
];

/** Вкладка, которая собирается следом за теорией. */
export const ZAGLUSHKA_14 = {
  title: 'Вкладка готовится',
  text: 'Скоро здесь появятся задания. Пока начни с теории.',
  kTeorii: 'Перейти к теории',
} as const;
