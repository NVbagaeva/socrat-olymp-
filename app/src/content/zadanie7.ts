/**
 * Тексты раздела задания №7 «Простейшие уравнения»: шапка, вкладки,
 * прогресс. Теория — content/teoriya7.ts.
 */

import type { ShapkaArt } from '@/components/tasks/IllyustratsiyaShapki';
import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { RazdelTab } from './vkladki';
import { nomerDvumya, nomerRazdela } from './struktura';

export const ZADANIE7 = {
  no: nomerDvumya('uravneniya'),
  slug: '7',
  title: taskName('7'),
  lead: 'Линейные, дробные, иррациональные, показательные, логарифмические и тригонометрические уравнения: найти корень, проверить ОДЗ и выбрать нужный.',
  badge: 'Профильный уровень',
  /**
   * Иллюстрация шапки (как у №1, №4, №10). Пока картинки нет — null, и
   * слот в шапке не выводится, без заглушек. Когда появится: исходник —
   * assets/zadanie-07/shapka-uravneniya.png, строка в SHAPKI
   * (scripts/build-shapka.mjs), здесь — { src, width, height, shiriny }.
   */
  art: null as ShapkaArt | null,
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Уравнения — Будет на ЕГЭ». */
export function zadanie7Title(tab: string): string {
  return `${tab} · ${ZADANIE7.title} — Будет на ЕГЭ`;
}

export const PROGRESS_7 = {
  /** Ключ прочитанных разделов теории в lib/theoryRead. */
  teoriyaKey: '7',
} as const;

/* ── Тренажёр ────────────────────────────────────────────────────── */

export const TRENAZHER_7 = {
  vybor: 'Что тренируем',
  istochnik: 'Источник задач',
  istochniki: [
    { id: 'fipi', label: 'Только ФИПИ' },
    { id: 'analog', label: 'Сгенерированные' },
    { id: 'mix', label: 'Вперемешку' },
  ],
  bezFipi: 'нет в открытом банке — только аналоги',
  zadach: 'Задач',
  nachat: 'Начать',
  pusto: 'Отметьте хотя бы один прототип.',
  netZadach: 'Нет задач для выбранных прототипов.',
  neUdalos: 'Не удалось собрать тренировку:',
  fipiNo: (no: number) => `Задача ФИПИ №${no}`,
  analog: 'Не из открытого банка',
  otvet: 'Ответ',
  proverit: 'Проверить',
  verno: 'Верно!',
  neverno: 'Неверно. Попробуйте ещё раз или откройте подсказку.',
  pi: 'Ответ — число, без $\\pi$: например, $0{,}5$, а не $\\dfrac{\\pi}{6}$.',
  nechislo: 'Введите число: целое или десятичную дробь, можно обыкновенную — $7/5$.',
  podskazka: 'Подсказка',
  skrytPodskazku: 'Скрыть подсказку',
  razbor: 'Показать разбор',
  teoriya: 'Повторить теорию',
  dalshe: 'Дальше',
  rezultat: 'Смотреть результат →',
  zagruzka: 'Загружаем задачу…',
  podumayte: 'Подумайте ещё.',
  hinted: 'С подсказкой или после ошибки',
} as const;

/* ── Генератор ───────────────────────────────────────────────────── */

export const GENERATOR_7 = {
  istochnik: 'Источник задач',
  sostav: 'Сколько задач каждого типа в варианте',
  variantov: 'Вариантов',
  primery: 'Рамки теории: разобранных примеров на тип',
  primeryBez: '0 — без теории',
  vsego: 'В варианте задач:',
  section: `№${nomerRazdela('uravneniya')} · Простейшие уравнения`,
  zagolovok: `Задание №${nomerRazdela('uravneniya')}. Простейшие уравнения`,
  teoriya: 'Повторяем теорию',
  zadachi: 'Задачи',
  uchenik: 'лист ученика',
  uchitel: 'лист учителя',
  fio: 'Фамилия, имя ________________________ Дата ________',
  otvetPole: 'Ответ: ______________',
  otvety: 'Ответы:',
  analogMetka: '(не из открытого банка)',
  pechat: 'Скачать (печать в PDF)',
  sobiraem: 'Собираем лист…',
  plohayaSsylka: 'Неверная ссылка на лист.',
  otbor: 'Отбор корней и ОДЗ — в выделенных шагах разбора.',
} as const;
