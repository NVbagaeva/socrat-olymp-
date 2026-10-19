/**
 * Теория задания №16 «Неравенства» — каркас глав.
 *
 * Каждая глава устроена одинаково: пункты теории (карточки),
 * опорные задачи с разбором и тренировочные работы по десять
 * заданий с проверкой ответа. Номера пунктов («3.1», «3.3 Опорные
 * задачи») не пишутся руками — их считает punktyGlavy16 по порядку.
 *
 * Пока у глав только заголовки: пустой блок показывает «Готовится».
 * Задания — свои или с изменёнными числами; чужие пособия сюда не
 * переносятся и в репозиторий не кладутся.
 *
 * Формулы — только $…$ (KaTeX), выделение — **…**. Ответ задания —
 * TeX-запись множества: «(-\infty;\,-3]\cup(2;\,5)», её же разбирает
 * автопроверка (lib/zadanie16/otvet.ts).
 */

import type { Chertezh16 } from '@/lib/zadanie16/chertezh';

/** Карточка теории. */
export interface Kartochka16 {
  title: string;
  text?: string;
  /** Формула крупно, TeX без долларов. */
  tex?: string;
  /** Числовая прямая или эскиз параболы под текстом. */
  chertezh?: Chertezh16;
  /** Тон карточки: правило, ловушка («нельзя»), пример. */
  ton?: 'pravilo' | 'lovushka' | 'primer';
}

/** Пункт теории главы: «3.1 Метод параболы». */
export interface Punkt16 {
  id: string;
  title: string;
  kartochki: Kartochka16[];
}

/** Опорная задача: условие, решение по шагам, ответ. */
export interface Opornaya16 {
  id: string;
  uslovie: string;
  shagi: string[];
  chertezh?: Chertezh16;
  /** Ответ: TeX-запись множества. */
  otvet: string;
}

/** Задание тренировочной работы. */
export interface Zadanie16 {
  id: string;
  /** Условие: «Решите неравенство $x^2-5x+6<0$». */
  uslovie: string;
  /** Ответ: TeX-запись множества (lib/zadanie16/otvet.ts). */
  otvet: string;
}

/** Тренировочная работа: десять заданий. */
export interface Rabota16 {
  id: string;
  title: string;
  zadaniya: Zadanie16[];
}

export interface Glava16 {
  /** Идентификатор: якорь прокрутки и ключ «прочитано». */
  id: string;
  title: string;
  /** Глава ещё не открыта: в теории — плашка «Скоро». */
  skoro?: true;
  lead?: string;
  teoriya: Punkt16[];
  opornye: Opornaya16[];
  /** Заголовок блока опорных задач: «Опорные задачи». */
  opornyeTitle?: string;
  raboty: Rabota16[];
  /** Заголовок блока работ: «Тренировочная работа» или «…работы». */
  rabotyTitle?: string;
  /** Темы главы «Скоро»: одной строкой каждая. */
  temy?: string[];
}

/** Заданий в тренировочной работе. */
export const ZADANIY_V_RABOTE = 10;

export const BLOKI_16 = {
  teoriya: 'Теория',
  opornaya: 'Опорная задача',
  opornye: 'Опорные задачи',
  rabota: 'Тренировочная работа',
  raboty: 'Тренировочные работы',
  gotovitsya: 'Готовится',
  gotovitsyaTeoriya: 'Карточки теории этого пункта ещё пишутся.',
  gotovitsyaOpornye: 'Опорная задача с разбором появится вместе с теорией главы.',
  gotovitsyaRabota: (n: number) => `${n} заданий с проверкой ответа — готовятся.`,
  skoro: 'Скоро',
  skoroText: 'Глава в работе: появится после основных глав.',
  reshenie: 'Решение',
  otvet: 'Ответ',
} as const;

const pusto = (id: string, title: string): Punkt16 => ({ id, title, kartochki: [] });
const rabota = (id: string, title: string = BLOKI_16.rabota): Rabota16 => ({
  id,
  title,
  zadaniya: [],
});

export const GLAVY_16: Glava16[] = [
  {
    id: 'osnovy',
    title: 'Основы',
    teoriya: [
      pusto('osnovy-perehody', 'Равносильные переходы'),
      pusto('osnovy-sistema', 'Система и совокупность'),
      pusto('osnovy-zaprety', 'Типичные запреты'),
    ],
    opornye: [],
    raboty: [rabota('osnovy-r1')],
  },
  {
    id: 'lineynye',
    title: 'Линейные неравенства',
    teoriya: [pusto('lineynye-teoriya', 'Линейные неравенства')],
    opornye: [],
    raboty: [rabota('lineynye-r1')],
  },
  {
    id: 'kvadratichnye',
    title: 'Квадратичные неравенства',
    teoriya: [
      pusto('kvadratichnye-parabola', 'Метод параболы'),
      pusto('kvadratichnye-osobye', 'Особые случаи'),
    ],
    opornye: [],
    opornyeTitle: BLOKI_16.opornye,
    raboty: [rabota('kvadratichnye-r1')],
  },
  {
    id: 'intervaly',
    title: 'Метод интервалов',
    teoriya: [
      pusto('intervaly-vid', 'Стандартный вид'),
      pusto('intervaly-algoritm', 'Алгоритм и кратность корней'),
    ],
    opornye: [],
    opornyeTitle: BLOKI_16.opornye,
    raboty: [rabota('intervaly-r1', 'Работа 1'), rabota('intervaly-r2', 'Работа 2')],
    rabotyTitle: BLOKI_16.raboty,
  },
  {
    id: 'drobnye',
    title: 'Дробно-рациональные неравенства',
    teoriya: [pusto('drobnye-teoriya', 'Теория')],
    opornye: [],
    opornyeTitle: BLOKI_16.opornye,
    raboty: [rabota('drobnye-r1', 'Работа 1'), rabota('drobnye-r2', 'Работа 2')],
    rabotyTitle: BLOKI_16.raboty,
  },
  {
    id: 'sistemy',
    title: 'Системы неравенств и более сложные неравенства',
    teoriya: [
      pusto('sistemy-sistemy', 'Системы неравенств'),
      pusto('sistemy-slozhnye', 'Более сложные неравенства'),
    ],
    opornye: [],
    raboty: [rabota('sistemy-r1')],
  },
  {
    id: 'skoro',
    title: 'Другие виды неравенств',
    skoro: true,
    teoriya: [],
    opornye: [],
    raboty: [],
    temy: [
      'Иррациональные неравенства и неравенства с модулем',
      'Метод замены множителя',
      'Показательные неравенства',
      'Логарифмические неравенства',
      'Комбинированные неравенства',
    ],
  },
];

/* Пункты главы с номерами — для содержания и заголовков. */

export interface PunktNomer16 {
  /** Якорь на странице. */
  id: string;
  /** «3.1». */
  no: string;
  title: string;
  vid: 'teoriya' | 'opornye' | 'raboty' | 'tema';
}

export function punktyGlavy16(glava: Glava16, nomer: number): PunktNomer16[] {
  const out: PunktNomer16[] = [];
  const dobavit = (id: string, title: string, vid: PunktNomer16['vid']) =>
    out.push({ id, no: `${nomer}.${out.length + 1}`, title, vid });
  if (glava.skoro) {
    (glava.temy ?? []).forEach((t, i) => dobavit(`${glava.id}-tema-${i + 1}`, t, 'tema'));
    return out;
  }
  glava.teoriya.forEach((p) => dobavit(p.id, p.title, 'teoriya'));
  dobavit(
    `${glava.id}-opornye`,
    glava.opornyeTitle ?? (glava.opornye.length > 1 ? BLOKI_16.opornye : BLOKI_16.opornaya),
    'opornye',
  );
  dobavit(`${glava.id}-raboty`, glava.rabotyTitle ?? BLOKI_16.rabota, 'raboty');
  return out;
}
