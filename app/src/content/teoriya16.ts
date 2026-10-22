/**
 * Теория задания №16 «Неравенства» — главы по макету
 * docs/mockups/zadanie-16/teoriya.png.
 *
 * У главы три вкладки: «Теория» (пункты с карточками), «Разбор»
 * (опорные задачи с решением) и «Тренировочная работа» (десять
 * заданий с проверкой ответа). Номера пунктов («4.1», «4.2») не
 * пишутся руками — их считает punktyGlavy16 по порядку. Главы
 * «Скоро» — отдельными строками содержания с замком.
 *
 * Пока написаны только примеры с макета (главы 4 и 6); у остальных
 * пустой блок показывает «Готовится». Задания — свои или с
 * изменёнными числами; чужие пособия сюда не переносятся и в
 * репозиторий не кладутся.
 *
 * Формулы — только $…$ (KaTeX), выделение — **…**. Ответ — TeX-запись
 * множества через точку с запятой: «(-\infty;\,1)\cup(4;\,+\infty)»,
 * её же разбирает автопроверка (lib/zadanie16/otvet.ts).
 */

import { metodIntervalov16, type Chertezh16 } from '@/lib/zadanie16/chertezh';

/**
 * Вид карточки: даёт метку с значком и цвет. Метку можно заменить
 * полем metka («Ещё пример»).
 */
export type Ton16 =
  'opredelenie' | 'vazhno' | 'vyvod' | 'primer' | 'oshibka' | 'ogranicheniya' | 'algoritm';

/** Половина сравнения «неверно / верно». */
export interface Variant16 {
  title: string;
  text?: string;
  chertezh?: Chertezh16;
  /** Ответ варианта: TeX-запись множества. */
  otvet?: string;
}

/** Карточка теории. */
export interface Kartochka16 {
  ton: Ton16;
  /** Своя подпись метки вместо стандартной. */
  metka?: string;
  title?: string;
  text?: string;
  /** Формула крупно, TeX без долларов. */
  tex?: string;
  /** Нумерованные шаги. */
  shagi?: string[];
  /** Числовая прямая, система или эскиз параболы. */
  chertezh?: Chertezh16;
  /** Строка под чертежом. */
  podpis?: string;
  /** Ответ: TeX-запись множества, выводится «Ответ: x ∈ …». */
  otvet?: string;
  /** Неверное решение рядом с верным. */
  sravnenie?: { neverno: Variant16; verno: Variant16 };
  /** Плитки «выражение → условие» (ограничения ОДЗ). */
  plitki?: { tex: string; text: string }[];
  /** Плашка-вывод внизу карточки. */
  itog?: string;
  /** Ширина на широком экране, из шести колонок; по умолчанию 2. */
  shirina?: 2 | 3 | 4 | 6;
}

/** Пункт теории главы: «4.1 Стандартный вид». */
export interface Punkt16 {
  id: string;
  title: string;
  kartochki: Kartochka16[];
}

/** Опорная задача вкладки «Разбор»: условие, решение по шагам, ответ. */
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
  /** Глава ещё не открыта: в содержании замок, в теории — «Скоро». */
  skoro?: true;
  lead?: string;
  teoriya: Punkt16[];
  opornye: Opornaya16[];
  raboty: Rabota16[];
}

/** Как записывать ответ: строка над заданиями работы. */
export const PRIMER_OTVETA_16 =
  'Ответ записывайте промежутками через «;», например: $(-\\infty;\\,-2]\\cup(3;\\,+\\infty)$.';

/** Заданий в тренировочной работе. */
export const ZADANIY_V_RABOTE = 10;

export const BLOKI_16 = {
  /* Вкладки главы. «Разбор», а не «Опорные задачи»: так зовётся
     верхняя вкладка раздела. */
  teoriya: 'Теория',
  razbor: 'Разбор',
  rabota: `Тренировочная работа (${ZADANIY_V_RABOTE} заданий)`,
  gotovitsya: 'Готовится',
  gotovitsyaTeoriya: 'Карточки теории этого пункта ещё пишутся.',
  gotovitsyaRazbor: 'Разбор опорных задач появится вместе с теорией главы.',
  gotovitsyaRabota: (n: number) => `${n} заданий с проверкой ответа — готовятся.`,
  skoro: 'Скоро',
  skoroText: 'Глава в работе: появится после основных глав.',
  reshenie: 'Решение',
  otvet: 'Ответ',
  neverno: 'Неверно',
  verno: 'Верно',
  metki: {
    opredelenie: 'Определение',
    vazhno: 'Важно',
    vyvod: 'Вывод',
    primer: 'Пример',
    oshibka: 'Частая ошибка',
    ogranicheniya: 'Ограничения',
    algoritm: 'Алгоритм',
  } satisfies Record<Ton16, string>,
} as const;

const pusto = (id: string, title: string): Punkt16 => ({ id, title, kartochki: [] });
const rabota = (id: string, title = 'Работа 1'): Rabota16 => ({ id, title, zadaniya: [] });

/* ── Глава 4: метод интервалов (примеры с макета) ───────────── */

const STANDARTNYY_VID: Kartochka16[] = [
  {
    ton: 'opredelenie',
    shirina: 3,
    text: '**Метод интервалов** — способ решения неравенств, основанный на определении знака выражения на промежутках, на которые числовая прямая разбивается его нулями.',
  },
  {
    ton: 'vyvod',
    shirina: 3,
    text: 'Чтобы решить неравенство $f(x)>0$ (или $f(x)<0$):',
    shagi: [
      '**Привести к стандартному виду:** справа $0$, слева произведение, разложенное на множители до конца.',
      'Найти нули множителей.',
      'Отметить нули на числовой прямой.',
      'Определить знак выражения на каждом промежутке.',
      'Записать ответ.',
    ],
  },
  {
    ton: 'oshibka',
    title: 'Не разложили до конца',
    text: 'Решим $(x-1)(x^2-6x+9)>0$. Квадратный трёхчлен — тоже произведение: $x^2-6x+9=(x-3)^2$.',
    shirina: 6,
    sravnenie: {
      neverno: {
        title: 'Знаки чередуются, не разложив',
        text: 'Нули $1$ и $3$, знаки «через один»: $+\\;-\\;+$.',
        chertezh: {
          vid: 'pryamaya',
          tochki: [
            { x: 1, tex: '1', zakrashena: false },
            { x: 3, tex: '3', zakrashena: false },
          ],
          znaki: ['+', '-', '+'],
          shtrikh: [
            { ot: -1, do: 0 },
            { ot: 1, do: 2 },
          ],
        },
        otvet: '(-\\infty;\\,1)\\cup(3;\\,+\\infty)',
      },
      verno: {
        title: 'Разложили до конца',
        text: '$(x-1)(x-3)^2>0$: нуль $3$ чётной кратности, знак через него не меняется.',
        chertezh: metodIntervalov16({
          korni: [
            { x: 1, tex: '1' },
            { x: 3, tex: '3', kratnost: 2 },
          ],
          sprava: '+',
          znak: '>',
        }),
        otvet: '(1;\\,3)\\cup(3;\\,+\\infty)',
      },
    },
  },
];

const ALGORITM_KRATNOST: Kartochka16[] = [
  {
    ton: 'vazhno',
    text: 'Знак многочлена меняется только при переходе через его нули **нечётной кратности**. При переходе через нуль **чётной кратности** знак не меняется.',
    shirina: 2,
  },
  {
    ton: 'primer',
    title: 'Решить неравенство $(x-1)(x-4)>0$',
    shirina: 4,
    shagi: [
      'Находим нули: $x-1=0\\Rightarrow x=1$, $x-4=0\\Rightarrow x=4$.',
      'Отмечаем нули на числовой прямой — выколотыми: неравенство строгое — и определяем знак на каждом промежутке.',
      'Выбираем промежутки, где выражение положительно.',
    ],
    chertezh: metodIntervalov16({
      korni: [
        { x: 1, tex: '1' },
        { x: 4, tex: '4' },
      ],
      sprava: '+',
      znak: '>',
      dugi: true,
    }),
    otvet: '(-\\infty;\\,1)\\cup(4;\\,+\\infty)',
  },
  {
    ton: 'primer',
    title: 'Кратность нуля',
    shirina: 3,
    text: 'Решим $(x-3)(2x-6)>0$. Вынесем $2$ из второй скобки:',
    tex: '(x-3)(2x-6)>0\\;\\Longleftrightarrow\\;2(x-3)^2>0',
    chertezh: metodIntervalov16({
      korni: [{ x: 3, tex: '3', kratnost: 2 }],
      sprava: '+',
      znak: '>',
    }),
    podpis:
      'Нуль $x=3$ кратности $2$: в этой точке знак не меняется, справа и слева «$+$». Сама точка выколота: неравенство строгое.',
    otvet: '(-\\infty;\\,3)\\cup(3;\\,+\\infty)',
  },
  {
    ton: 'primer',
    metka: 'Ещё пример',
    title: '$(x-5)^2>0$',
    shirina: 3,
    chertezh: {
      vid: 'parabola',
      vetvi: 'vverh',
      oy: true,
      korni: [{ x: 5, tex: '5', zakrashena: false }],
      shtrikh: 'nad',
    },
    podpis:
      'Парабола $y=(x-5)^2$ касается оси $Ox$ в точке $5$: выражение положительно при всех $x$, кроме $x=5$.',
    otvet: '(-\\infty;\\,5)\\cup(5;\\,+\\infty)',
  },
];

/* ── Глава 6: системы (примеры с макета) ────────────────────── */

const SISTEMY: Kartochka16[] = [
  {
    ton: 'ogranicheniya',
    title: 'Откуда берутся ограничения',
    shirina: 3,
    text: 'При решении неравенства важно учитывать **область допустимых значений** (ОДЗ): ограничения возникают из условий, при которых выражение имеет смысл.',
    plitki: [
      { tex: '\\dfrac{1}{f(x)}', text: 'Знаменатель: $f(x)\\ne0$' },
      { tex: '\\sqrt{f(x)}', text: 'Под корнем: $f(x)\\ge0$' },
      { tex: '\\dfrac{1}{\\sqrt{f(x)}}', text: 'Корень в знаменателе: $f(x)>0$' },
      { tex: '\\log_a f(x)', text: 'Логарифм: $f(x)>0$, $a>0$, $a\\ne1$' },
      {
        tex: '\\operatorname{tg}x,\\ \\operatorname{ctg}x',
        text: '$\\operatorname{tg}x$: $x\\ne\\dfrac{\\pi}{2}+\\pi n$; $\\operatorname{ctg}x$: $x\\ne\\pi n$, $n\\in\\mathbb{Z}$',
      },
    ],
    itog: 'Условий несколько $\\Rightarrow$ решаем систему.',
  },
  {
    ton: 'algoritm',
    title: 'Алгоритм решения системы',
    shirina: 3,
    shagi: [
      'Решаем каждое неравенство отдельно.',
      'Изображаем решения на числовых прямых друг под другом.',
      'Находим пересечение всех решений.',
    ],
    chertezh: {
      vid: 'sistema',
      tochki: [
        { x: -3, tex: '-3' },
        { x: 0, tex: '0' },
        { x: 2, tex: '2' },
      ],
      ryady: [
        { tex: 'x>-3', mnozhestvo: '(-3;\\,+\\infty)' },
        { tex: 'x\\le2', mnozhestvo: '(-\\infty;\\,2]' },
        { tex: 'x\\ne0', mnozhestvo: '(-\\infty;\\,0)\\cup(0;\\,+\\infty)' },
      ],
    },
    otvet: '(-3;\\,0)\\cup(0;\\,2]',
  },
];

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
    raboty: [rabota('kvadratichnye-r1')],
  },
  {
    id: 'intervaly',
    title: 'Метод интервалов',
    lead: 'Определение знака выражения на числовой прямой и решение неравенств.',
    teoriya: [
      { id: 'intervaly-vid', title: 'Стандартный вид', kartochki: STANDARTNYY_VID },
      {
        id: 'intervaly-algoritm',
        title: 'Алгоритм и кратность корней',
        kartochki: ALGORITM_KRATNOST,
      },
    ],
    opornye: [],
    raboty: [rabota('intervaly-r1'), rabota('intervaly-r2', 'Работа 2')],
  },
  {
    id: 'drobnye',
    title: 'Дробно-рациональные неравенства',
    teoriya: [pusto('drobnye-teoriya', 'Теория')],
    opornye: [],
    raboty: [rabota('drobnye-r1'), rabota('drobnye-r2', 'Работа 2')],
  },
  {
    id: 'sistemy',
    title: 'Системы неравенств',
    lead: 'Несколько условий сразу: решаем каждое и берём пересечение.',
    teoriya: [
      { id: 'sistemy-sistemy', title: 'Системы неравенств', kartochki: SISTEMY },
      pusto('sistemy-slozhnye', 'Более сложные неравенства'),
    ],
    opornye: [],
    raboty: [rabota('sistemy-r1')],
  },
  ...(
    [
      ['irracionalnye', 'Иррациональные и с модулем'],
      ['zamena-mnozhitelya', 'Метод замены множителя'],
      ['pokazatelnye', 'Показательные'],
      ['logarifmicheskie', 'Логарифмические'],
      ['kombinirovannye', 'Комбинированные'],
    ] as const
  ).map(([id, title]): Glava16 => ({
    id,
    title,
    skoro: true,
    teoriya: [],
    opornye: [],
    raboty: [],
  })),
];

/** Пункт теории с номером — для заголовка: «4.1». */
export interface PunktNomer16 {
  /** Якорь на странице. */
  id: string;
  /** «4.1». */
  no: string;
  title: string;
}

export function punktyGlavy16(glava: Glava16, nomer: number): PunktNomer16[] {
  return glava.teoriya.map((p, i) => ({ id: p.id, no: `${nomer}.${i + 1}`, title: p.title }));
}
