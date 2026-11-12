/**
 * Тексты «Стеклянной сцены» задания №7: шапка вкладки «О задании»,
 * группы, «Где теряют балл», блок «Что нужно знать», подписи
 * тренажёра. ЧЕРНОВИК НА ВЫЧИТКУ — см. docs/zadanie-7-teksty.md.
 *
 * Названия типов и условия задач здесь не дублируются: они берутся из
 * банка (lib/zadanie7/prototypes). Обращение к ученику — на «вы», как
 * в №8 и №3; кодов прототипов в подписях нет.
 */

import type { Ton } from '@/components/tasks/steklo';
import type { GroupId } from '@/lib/zadanie7/types';
import { vremya } from './vychisleniya8/trenazher';

function tipov(n: number): string {
  const d = n % 10;
  const s = n % 100;
  return `${n} ${d === 1 && s !== 11 ? 'тип' : d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'типа' : 'типов'}`;
}

function zadach(n: number): string {
  const d = n % 10;
  const s = n % 100;
  return `${n} ${d === 1 && s !== 11 ? 'задача' : d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'задачи' : 'задач'}`;
}

export const SHAPKA7 = {
  nadzagolovok: 'Задание №7 · первая часть',
  zagolovok: 'Решить уравнение и записать корень',
  lead: 'Одно уравнение — одно число в ответ. Если корней несколько, в условии сказано, какой записать: меньший, больший, наименьший положительный или наибольший отрицательный.',
  fakty: (tipovVsego: number) => [
    { znachenie: '1', podpis: 'первичный балл' },
    { znachenie: '≈ 3', podpis: 'минуты на экзамене' },
    { znachenie: String(tipovVsego), podpis: 'типов в пяти группах' },
  ],
  opasnoTitle: 'Чем опасно',
  opasno: [
    'Не записали ОДЗ и взяли посторонний корень: у $\\sqrt{40+3x}=x$ корень $x=-5$ не подходит.',
    'Возвели обе части в квадрат и не проверили знак правой части.',
    'Просили меньший корень, а в ответ записали больший — или оба.',
    '«Сняли» логарифмы и забыли, что выражение под логарифмом положительно.',
    'В тригонометрическом уравнении записали серию с $\\pi$, а нужно одно число.',
  ],
  oblozhkaAlt: 'Обложка раздела «Уравнения»',
  gruppyTitle: 'Типы уравнений по группам',
  gruppyLead:
    'Нажмите на тип — откроется разобранный пример. Кнопка «Потренировать этот тип» ведёт в тренажёр.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Правила по группам, у каждого — маленький пример.',
  skhemyTitle: 'Равносильные переходы — цветными схемами',
  skhemyLead:
    'Синим — уравнение, оранжевым — условие, которое нельзя потерять. Все схемы — в теории.',
  skhemyKnopka: 'Все схемы в теории',
  tipov,
  povtorit: 'Стоит повторить',
  neNachato: 'ещё не начато',
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
  primer: 'Разобранный пример',
  primerZhdyot: 'Открываем пример…',
  primerNet: 'Пример не открылся — обновите страницу.',
  otvet: 'Ответ',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи',
  lovushka: 'Где теряют балл',
  vid: 'Вид уравнения',
  schitaem: 'Считаем с умом',
};

/** Оформление групп: значок-формула и тон. Состав группы — из банка. */
export const GRUPPY7_VID: Record<GroupId, { znak: string; ton: Ton; opasno: string }> = {
  I: {
    znak: 'ax=b',
    ton: 'blue',
    opasno:
      'При переносе слагаемого забывают сменить знак, а в дробном уравнении не проверяют, что знаменатель не обратился в нуль.',
  },
  II: {
    znak: '\\sqrt{x}',
    ton: 'navy',
    opasno:
      'Возводят в квадрат и не проверяют корни: квадратный корень не бывает отрицательным, поэтому отрицательная правая часть даёт посторонний корень.',
  },
  III: {
    znak: 'a^{x}',
    ton: 'orange',
    opasno:
      'Приравнивают показатели, не приведя обе части к одному основанию, и теряют минус у $\\dfrac{1}{a}=a^{-1}$.',
  },
  IV: {
    znak: '\\log_{a}x',
    ton: 'terra',
    opasno:
      'Забывают ОДЗ: выражение под логарифмом положительно, основание положительно и не равно единице.',
  },
  V: {
    znak: '\\sin x',
    ton: 'green',
    opasno:
      'Записывают в ответ серию с $\\pi$ или берут не тот корень: нужно перебрать $n$ и выбрать наименьший положительный или наибольший отрицательный.',
  },
};

export interface Formula7 {
  tex: string;
  /** Пример применения, TeX. */
  primer: string;
}

export interface FormulyGruppy7 {
  id: string;
  nazvanie: string;
  ton: Ton;
  formuly: Formula7[];
}

/** «Что нужно знать»: правила по группам, каждое — с примером. */
export const FORMULY7: FormulyGruppy7[] = [
  {
    id: 'odz',
    nazvanie: 'ОДЗ — записываем всегда',
    ton: 'terra',
    formuly: [
      {
        tex: '\\dfrac{A}{B}:\\quad B \\ne 0',
        primer: '\\dfrac{1}{3x-4}=5:\\quad x \\ne \\dfrac{4}{3}',
      },
      {
        tex: '\\sqrt{A}:\\quad A \\ge 0',
        primer: '\\sqrt{2x+6}:\\quad x \\ge -3',
      },
      {
        tex: '\\log_{a}A:\\quad A > 0',
        primer: '\\log_{2}(x-5):\\quad x > 5',
      },
    ],
  },
  {
    id: 'kvadratnye',
    nazvanie: 'Линейные и квадратные',
    ton: 'blue',
    formuly: [
      { tex: 'ax = b \\iff x = \\dfrac{b}{a}', primer: '4x = 10 \\iff x = 2{,}5' },
      {
        tex: '\\dfrac{a}{b}=\\dfrac{c}{d} \\iff ad = bc',
        primer: '\\dfrac{1}{x+2}=\\dfrac{1}{5} \\iff x+2 = 5',
      },
      {
        tex: 'x^{2} = a,\\ a > 0 \\iff x = \\pm\\sqrt{a}',
        primer: 'x^{2} = 49 \\iff x = \\pm 7',
      },
      {
        tex: 'D = b^{2}-4ac,\\quad x = \\dfrac{-b \\pm \\sqrt{D}}{2a}',
        primer: 'x^{2}-3x-40=0:\\ D = 169,\\ x = -5;\\ 8',
      },
    ],
  },
  {
    id: 'korni',
    nazvanie: 'Иррациональные',
    ton: 'navy',
    formuly: [
      {
        tex: '\\sqrt{A} = b,\\ b \\ge 0 \\iff A = b^{2}',
        primer: '\\sqrt{x+5} = 3 \\iff x+5 = 9',
      },
      {
        tex: '\\sqrt{A} = B \\iff \\begin{cases} A = B^{2} \\\\ B \\ge 0 \\end{cases}',
        primer: '\\sqrt{40+3x} = x \\Rightarrow x = 8',
      },
      {
        tex: '\\sqrt[3]{A} = b \\iff A = b^{3}',
        primer: '\\sqrt[3]{x-4} = -2 \\iff x-4 = -8',
      },
    ],
  },
  {
    id: 'pokazatelnye',
    nazvanie: 'Показательные',
    ton: 'orange',
    formuly: [
      {
        tex: 'a^{f(x)} = a^{g(x)} \\iff f(x) = g(x)',
        primer: '2^{x-3} = 2^{-4} \\iff x-3 = -4',
      },
      { tex: '\\dfrac{1}{a^{n}} = a^{-n}', primer: '\\dfrac{1}{16} = 2^{-4}' },
      { tex: '(a^{m})^{n} = a^{mn}', primer: '9^{x} = (3^{2})^{x} = 3^{2x}' },
    ],
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмические',
    ton: 'blue',
    formuly: [
      {
        tex: '\\log_{a}f(x) = c \\iff f(x) = a^{c}',
        primer: '\\log_{2}(x+1) = 3 \\iff x+1 = 8',
      },
      {
        tex: '\\log_{a}f = \\log_{a}g \\iff f = g > 0',
        primer: '\\log_{5}(x+3) = \\log_{5}7 \\iff x+3 = 7',
      },
      { tex: 'n\\log_{a}b = \\log_{a}b^{n}', primer: '2\\log_{3}4 = \\log_{3}16' },
    ],
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Тригонометрические',
    ton: 'green',
    formuly: [
      {
        tex: '\\sin t = \\dfrac{1}{2} \\iff t = \\dfrac{\\pi}{6}+2\\pi n,\\ t = \\dfrac{5\\pi}{6}+2\\pi n',
        primer: 'n = 0:\\ t = \\dfrac{\\pi}{6},\\ t = \\dfrac{5\\pi}{6}',
      },
      {
        tex: '\\cos t = \\dfrac{1}{2} \\iff t = \\pm\\dfrac{\\pi}{3}+2\\pi n',
        primer: 'n = 0:\\ t = \\dfrac{\\pi}{3},\\ t = -\\dfrac{\\pi}{3}',
      },
      {
        tex: '\\operatorname{tg} t = 1 \\iff t = \\dfrac{\\pi}{4}+\\pi n',
        primer: 'n = -1:\\ t = -\\dfrac{3\\pi}{4}',
      },
    ],
  },
];

export const TRENAZHER7 = {
  title: 'Тренажёр',
  rezhimy: {
    title: 'Как потренируемся',
    mix: {
      zag: 'Все типы вперемешку',
      lead: (n: number) => `${zadach(n)} из всех пяти групп — как на экзамене`,
    },
    temy: { zag: 'Выбрать темы', lead: 'Группы и типы, число задач, таймер' },
    oshibki: {
      zag: 'Работа над ошибками',
      lead: (n: number) =>
        n === 0
          ? 'Пока нет ошибок — появятся после тренировки'
          : `${tipov(n)}, где были ошибки, — новые задачи на них`,
    },
    otlozhennye: (n: number) => `Отложенные задачи · ${n}`,
  },
  vybor: {
    title: 'Что тренируем',
    vse: 'Выбрать все',
    nichego: 'Снять все',
    skolko: 'Сколько задач',
    bezKonca: 'Без конца',
    taymer: 'Таймер',
    sTaymerom: 'С таймером',
    bezTaymera: 'Без таймера',
    bezPodskazok: 'Без подсказок и решений',
    bezPodskazokLead: 'Как на экзамене: решение откроется только в итогах',
    nachat: 'Начать тренировку',
    nazad: 'К режимам',
    itog: (n: number, vsegoTipov: number, skolko: number | null, taymer: boolean) =>
      `${n === vsegoTipov ? 'Все типы' : tipov(n)} · ${skolko === null ? 'без конца' : zadach(skolko)} · ${taymer ? 'с таймером' : 'без таймера'}`,
    pusto: 'Выберите хотя бы один тип',
    /* Источник задач: переключатель в выборе тем. */
    istochnik: 'Какие задачи',
    istochniki: {
      vse: 'Все',
      fipi: 'Из банка ФИПИ',
      new: 'Не из банка',
    },
    istochnikPusto: 'В выбранных типах таких задач нет — смените источник или добавьте типы.',
  },
  ekran: {
    otvet: 'Ответ',
    placeholder: 'Число',
    proverit: 'Проверить',
    podskazka: 'Подсказка',
    reshenie: 'Решение',
    skrytReshenie: 'Скрыть решение',
    pohozhaya: 'Похожая задача',
    dalshe: 'Дальше',
    itogi: 'К итогам',
    verno: 'Верно!',
    vernoLead: (sek: number | null) =>
      sek === null ? 'Идём дальше.' : `Решено за ${vremya(sek)}.`,
    neverno: 'Пока не так',
    nevernoLead: 'Посмотрите подсказку или решение — и попробуйте ещё раз.',
    sRazborom: 'Решено с разбором',
    sRazboromLead: 'В прогресс как верная не пойдёт — но тип засчитан как пройденный.',
    shagi: 'Решение по шагам',
    bezPodskazok: 'Режим без подсказок: решение откроется в итогах.',
    iz: 'из',
    zagruzka: 'Открываем задачу…',
    oshibkaZagruzki: 'Задача не открылась. Проверьте интернет и попробуйте ещё раз.',
    povtorit: 'Попробовать ещё раз',
    /* Подсказки о записи ответа: попытка не тратится. */
    pi: 'В ответе должно быть число без $\\pi$: например, $0{,}5$, а не $\\dfrac{\\pi}{6}$.',
    nechislo: 'Запишите число: целое или десятичную дробь, например $-1{,}5$.',
    fipi: (no: number) => `Открытый банк ФИПИ · задача №${no}`,
    neIzBanka: 'Не из открытого банка',
    zakladka: (tip: string) => `№7 · тренажёр, ${tip}`,
    voprosy: {
      title: 'Подсказка — вопросами',
      verno: 'Верно.',
      podumayte: 'Подумайте ещё.',
      varianty: 'Варианты ответа',
      gotovo: 'Все вопросы пройдены — теперь запишите ответ.',
    },
  },
  itogi: {
    title: (dolya: number) =>
      dolya >= 0.9
        ? 'Отличная тренировка'
        : dolya >= 0.6
          ? 'Хорошая тренировка'
          : 'Есть над чем поработать',
    lead: (sek: number, srednee: number | null, sRazborom: number) =>
      [
        `время ${vremya(sek)}`,
        srednee === null ? null : `в среднем ${vremya(srednee)} на задачу`,
        sRazborom === 0 ? null : `${sRazborom} с разбором`,
      ]
        .filter((s): s is string => s !== null)
        .join(' · '),
    poTipam: 'По группам',
    prosel: 'Просел',
    rabota: (n: number) => `Работа над ошибками · ${n}`,
    rabotaLead: 'Новые задачи тех же типов, а не те же самые.',
    eshcheRaz: 'Ещё раз',
    kVyboru: 'К выбору тем',
    zadachi: 'Задачи',
    razbor: 'Решение',
    skrytRazbor: 'Скрыть решение',
    otmetki: { right: 'Верно', wrong: 'Неверно', hinted: 'С разбором', skipped: 'Пропущено' },
  },
  progress: {
    title: 'Мой прогресс',
    povtorit: 'Стоит повторить',
    pusto: 'Здесь появится прогресс: сколько решено и какие группы стоит повторить.',
    schet: (resheno: number, vsego: number) => `Решено ${resheno} из ${vsego} задач банка`,
    oshibki: 'Мои ошибки',
    oshibokNet: 'Ошибок нет. Задачи с ошибкой или открытым решением появятся здесь.',
    otlozhennye: 'Отложенные',
    otlozhennyhNet: 'Ничего не отложено. Кнопка «Отложить на потом» есть у каждой задачи.',
    istoriya: 'История тренировок',
    istoriiNet: 'Завершённых тренировок пока нет.',
    sbros: 'Сбросить прогресс',
    sbrosVopros: 'Сбросить прогресс по заданию №7? Счётчики и список ошибок будут удалены.',
    otmena: 'Отмена',
  },
};

/* ── Опорные задачи ───────────────────────────────────────────── */

/** Навыки: как сгруппированы блоки опорных задач на вкладке. */
export const NAVYKI7: {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  /** Блоки навыка: slug блока → значок (TeX). */
  bloki: { slug: string; znak: string }[];
}[] = [
  {
    id: 'lineynye',
    nazvanie: 'Перенос, пропорция, квадратное уравнение',
    lead: 'То, чем заканчивается почти любое уравнение',
    ton: 'blue',
    bloki: [
      { slug: 'perenos-i-znaki', znak: '\\pm' },
      { slug: 'proporciya', znak: '\\tfrac{a}{b}' },
      { slug: 'diskriminant-i-vieta', znak: 'D' },
    ],
  },
  {
    id: 'stepeni',
    nazvanie: 'Степени и корни',
    lead: 'Привести к одному основанию, избавиться от корня',
    ton: 'orange',
    bloki: [
      { slug: 'stepeni', znak: 'a^{n}' },
      { slug: 'korni', znak: '\\sqrt{a}' },
    ],
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмы',
    lead: 'Определение и свойства',
    ton: 'terra',
    bloki: [
      { slug: 'logarifm-po-opredeleniyu', znak: '\\log' },
      { slug: 'svoystva-logarifmov', znak: '\\log_{a}' },
    ],
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Тригонометрия',
    lead: 'Значения синуса, косинуса и тангенса на круге',
    ton: 'green',
    bloki: [{ slug: 'trigonometricheskiy-krug', znak: '\\sin' }],
  },
];

export const OPORNYE7 = {
  title: 'Опорные задачи',
  lead: 'Короткие задачи на один навык: из этих навыков складывается любое уравнение №7. В каждом блоке десять задач.',
  kListu: '← Все блоки',
  zapomni: 'Запомни.',
  gde: 'Где пригодится этот навык',
  spisok: {
    blokov: (n: number) => `${n} ${n === 1 ? 'блок' : n < 5 ? 'блока' : 'блоков'}`,
    neNachato: 'ещё не начато',
    zadach: (resheno: number, vsego: number) => `решено ${resheno} из ${vsego}`,
    gotovo: 'Готово',
  },
  zadacha: {
    zadacha: (k: number, n: number) => `Задача ${k} из ${n}`,
    nazad: 'Предыдущая задача',
    vpered: 'Следующая задача',
    otvet: 'Ответ',
    placeholder: 'Число',
    proverit: 'Проверить',
    podskazka: 'Подсказка',
    reshenie: 'Решение',
    skrytReshenie: 'Скрыть решение',
    propustit: 'Пропустить',
    sleduyushchaya: 'Следующая задача',
    verno: 'Верно!',
    vernoLead: 'Идём дальше.',
    neverno: 'Пока не так',
    nevernoLead: 'Посмотрите подсказку или решение — и попробуйте ещё раз.',
    shagi: 'Решение по шагам',
    zadachiBloka: 'Задачи блока',
    nomer: (k: number) => `Задача ${k}`,
  },
};
