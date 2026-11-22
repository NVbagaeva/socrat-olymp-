/**
 * Тексты «Стеклянной сцены» задания №13: шапка вкладки «О задании»,
 * группы, «Где теряют балл», блок «Что нужно знать», подписи тренажёра
 * и опорных задач. ЧЕРНОВИК НА ВЫЧИТКУ — см. docs/zadanie-13-teksty.md.
 *
 * Названия типов, условия и разборы здесь не дублируются: они берутся
 * из движка задач (lib/zadanie13/proto). Обращение к ученику — на «ты»
 * (docs/razdel-pravila.md, п. 4); кодов прототипов в подписях нет.
 */

import type { Ton } from '@/components/tasks/steklo';
import type { TypeCode, Units, Vopros13 } from '@/lib/zadanie13/types';
import { tekstyOpornyh, tekstyTrenazheraBanka, tipov, zadach } from './treningBanka';
import { nomerRazdela, slovoChasti } from './struktura';
import { ballText } from './variantOnline/bally';
import { EDINICY_POTERYA, MESTO13 } from './zadanie13';

/* ── Тренажёр ─────────────────────────────────────────────────── */

export const TRENAZHER13 = (() => {
  const t = tekstyTrenazheraBanka({
    nomer: nomerRazdela('ekonomika'),
    grupp: 'четырёх',
    istochniki: { vse: 'Все', fipi: 'Из банка ФИПИ', new: 'Не из банка' },
  });
  return {
    ...t,
    rezhimy: {
      ...t.rezhimy,
      /* Четвёртая карточка: прежний режим «Определить схему». */
      /* Пятая карточка: прежний режим «С оформлением». */
      oformlenie: {
        zag: 'С оформлением',
        lead: (n: number) => `${zadach(n)} вперемешку — схема, первая строка таблицы, потом число`,
      },
      tip: {
        zag: 'Определи тип',
        lead: (n: number) => `${zadach(n)} вперемешку — назови схему по условию, без вычислений`,
      },
    },
    vybor: {
      ...t.vybor,
      /* Как отвечать: прежнее поле «Ответ» тренажёра с фильтрами. */
      otvet: {
        title: 'Как отвечать',
        sposoby: [
          { id: '', label: 'Только число' },
          { id: 'oformlenie', label: 'С оформлением' },
        ],
      },
      /* Уровень: прежний фильтр со звёздочками. */
      urovni: {
        title: 'Уровень',
        labels: { vse: 'Все', '1': '★ Базовый', '2': '★★ Повышенный' },
        pusto: 'В выбранных типах нет задач этого уровня — выбери другой уровень или добавь типы.',
      },
      istochnikPusto: 'В выбранных типах нет задач из банка ФИПИ — выбери «Все» или добавь типы.',
    },
    /** Подпись над тренажёром: на экзамене — решение, здесь — проверка ответа. */
    podpis: MESTO13.vtorayaChast
      ? `На экзамене задание ${nomerRazdela('ekonomika')} решают полностью — с моделью, таблицей и уравнением. Здесь тренажёр проверяет ответ: число в тех единицах, что просит условие.`
      : null,
    ekran: {
      ...t.ekran,
      /* Вердикт «число верное, единицы нет» — как в прежнем тренажёре. */
      edinicy: {
        zag: 'Число верное, единицы нет',
        lead: `Посмотри, в чём просят ответ в условии, и переведи. На ЕГЭ такой ответ — ${EDINICY_POTERYA}.`,
      },
      tipVopros: 'Какая это схема?',
      tipOtvet: 'Схема',
    },
  };
})();

/* ── Группы: четыре схемы ─────────────────────────────────────── */

/** Значок и цвет группы-схемы. Названия схем — TYPE_NAMES (lib/zadanie13/types). */
export const GRUPPY13_VID: Record<TypeCode, { znak: string; ton: Ton; lead: string }> = {
  A: { znak: '\\tfrac{S}{n}', ton: 'blue', lead: 'Долг уменьшается ровной лесенкой' },
  B: { znak: 'kS', ton: 'navy', lead: 'Путь долга задан, но не одной лесенкой' },
  C: { znak: 'x', ton: 'orange', lead: 'Известны платежи, долг не задан' },
  D: { znak: '\\%', ton: 'green', lead: 'Вклад растёт, его пополняют или снимают' },
};

/* ── «О задании»: шапка ───────────────────────────────────────── */

export const SHAPKA13 = {
  nadzagolovok: `Задание №${nomerRazdela('ekonomika')} · ${slovoChasti('ekonomika')}`,
  zagolovok: MESTO13.sOptimizaciey
    ? 'Кредит, вклад или оптимизация: модель и обоснованный ответ'
    : MESTO13.vtorayaChast
      ? 'Кредит или вклад: модель и обоснованный ответ'
      : 'Кредит или вклад: построить таблицу и найти одно число',
  lead: MESTO13.vtorayaChast
    ? 'По условию строим модель — таблицу по периодам и уравнение — и находим сумму, ставку, срок или платёж. На экзамене записывают решение целиком; в тренажёре проверяем итоговое число — в тех единицах, что просит условие.'
    : 'По условию строим таблицу по периодам и находим сумму, ставку, срок или платёж. В ответ — одно число в тех единицах, что просит условие. До 2027 года эти задачи шли заданием 16 с развёрнутым ответом.',
  fakty: (tipovVsego: number) => [
    {
      znachenie: String(MESTO13.ball),
      podpis: MESTO13.ball === 1 ? 'первичный балл' : 'первичных балла',
    },
    /* Развёрнутое решение — дольше одного числа: оценка на вычитку. */
    { znachenie: MESTO13.vtorayaChast ? '≈ 25' : '≈ 12', podpis: 'минут на экзамене' },
    { znachenie: String(tipovVsego), podpis: 'типов в четырёх схемах' },
  ],
  opasnoTitle: 'Чем опасно',
  opasno: [
    `Пишут ответ не в тех единицах: считали в тысячах, а условие просит рубли, — это ${EDINICY_POTERYA}.`,
    'Считают проценты от суммы кредита, а не от долга на начало периода.',
    'Путают сумму изменения долга и платёж: платёж = сумма изменения долга + переплата.',
    'В «на сколько процентов больше» берут за $100\\,\\%$ не ту величину.',
    'Во вкладе путают порядок: сначала начисление процентов или сначала пополнение.',
  ],
  oblozhkaAlt: 'Обложка раздела «Финансовая грамотность»',
  gruppyTitle: 'Типы задач по схемам',
  gruppyLead:
    'Схему узнаём по условию — по ней выбираем таблицу. Открой тип, чтобы увидеть разобранную задачу.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Формулы по схемам, у каждой — маленький пример.',
  priznakiTitle: 'Как узнать схему за 10 секунд',
  priznakiHead: ['Вижу в условии', 'Схема', 'Почему'] as const,
  tipov,
  povtorit: 'Стоит повторить',
  neNachato: 'ещё не начато',
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
  primer: 'Разобранный пример',
  primerZhdyot: 'Открываем пример…',
  primerNet: 'Пример не открылся — обнови страницу.',
  otvet: 'Ответ',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи',
  lovushka: 'Где теряют балл',
  povyshennyy: 'повышенный уровень',
  neIzBanka: 'не из открытого банка',
};

/* ── «Где теряют балл» у типа ────────────────────────────────────
   Собирается из двух частей: что спрашивают (тип вопроса задачи) или,
   если вопрос обычный, — ловушка схемы; и в каких единицах ответ. */

export const OPASNO_VOPROS13: Record<Vopros13, string> = {
  'ot-summy': 'Разность процентов считают от суммы кредита: за $100\\,\\%$ — $S$, а не переплата.',
  'ot-pereplaty': 'За $100\\,\\%$ берут переплату того банка, с которым сравнивают, — не наоборот.',
  'vo-skolko': '«Во сколько раз» — это отношение, а не разность и не проценты.',
  procent:
    'Нужна переплата в процентах от суммы кредита: $\\dfrac{S_{\\text{перепл}}}{S}\\cdot 100$, а не сама переплата.',
  rubli: 'Спрашивают переплату или разницу — не путай их с общей суммой выплат.',
  summa: 'Ищем сумму кредита $S$: не останавливайся на платеже или переплате.',
  stavka: 'Ищем ставку $r$ в процентах, а не множитель $k = 1 + \\dfrac{r}{100}$.',
  srok: 'Срок $n$ — целое число месяцев или лет: дробный $n$ значит, что ошибка выше.',
};

export const OPASNO_SHEMA13: Record<TypeCode, string> = {
  A: 'Переплату за месяц считают от долга на начало месяца, а не от суммы кредита.',
  B: 'Долг идёт не ровной лесенкой: переплату считают по каждому периоду — по его долгу и его ставке.',
  C: 'Проценты начисляются на долг на начало периода, а он после каждого платежа меньше $S$.',
  D: 'Следи за порядком: проценты начисляются на то, что на счёте в этот момент, — пополнение до начисления и после даёт разный итог.',
};

export const OPASNO_EDINICY13: Partial<Record<Units, string>> = {
  rub: 'Считать удобно в тысячах, но в ответ — рубли.',
  thous: 'Ответ — в тысячах рублей: не переводи его в рубли.',
  mln: 'Ответ — в миллионах рублей: не переводи его в рубли.',
};

/** «Где теряют балл» у типа: вопрос (или схема) и единицы ответа. */
export function opasno13(type: TypeCode, vopros: Vopros13 | undefined, units: Units): string {
  return [
    vopros === undefined ? OPASNO_SHEMA13[type] : OPASNO_VOPROS13[vopros],
    OPASNO_EDINICY13[units],
  ]
    .filter((s): s is string => s !== undefined)
    .join(' ');
}

/* ── «Что нужно знать» ────────────────────────────────────────────
   Формулы и примеры — из теории раздела (content/teoriya13.ts). */

export interface Formula13 {
  tex: string;
  primer: string;
}

export const FORMULY13: { id: string; nazvanie: string; ton: Ton; formuly: Formula13[] }[] = [
  {
    id: 'procenty',
    nazvanie: 'Проценты и множитель',
    ton: 'blue',
    formuly: [
      { tex: 'k = 1 + \\frac{r}{100}', primer: 'r = 10:\\ k = 1{,}1' },
      { tex: 'S\\cdot k^n', primer: '1000\\cdot 1{,}1^2 = 1000\\cdot 1{,}21 = 1210' },
    ],
  },
  {
    id: 'dif',
    nazvanie: 'Дифференцированный платёж',
    ton: 'blue',
    formuly: [
      {
        tex: '\\text{платёж} = \\text{сумма изменения долга} + \\text{переплата}',
        primer: '250 + 75 = 325',
      },
      {
        tex: 'S_{\\text{перепл}} = S\\cdot\\frac{n+1}{2}\\cdot\\frac{r}{100}',
        primer: 'S = 1000,\\ n = 3,\\ r = 10:\\ 1000\\cdot 2\\cdot 0{,}1 = 200',
      },
      { tex: 'S_{\\text{общ}} = S + S_{\\text{перепл}}', primer: '1000 + 250 = 1250' },
    ],
  },
  {
    id: 'polomannyy',
    nazvanie: '«Поломанный» платёж',
    ton: 'navy',
    formuly: [
      {
        tex: 'S_{\\text{общ}} = S + \\frac{r}{100}\\,(D_0 + D_1 + \\dots + D_{n-1})',
        primer: '0{,}1\\cdot(800 + 600) + 0{,}2\\cdot(400 + 200) = 260',
      },
    ],
  },
  {
    id: 'annuitet',
    nazvanie: 'Аннуитет',
    ton: 'orange',
    formuly: [
      {
        tex: 'Sk^n = x\\,(k^{n-1} + k^{n-2} + \\dots + k + 1)',
        primer: 'n = 3:\\ x = \\frac{Sk^3}{k^2 + k + 1}',
      },
      {
        tex: '\\text{долг на конец} = \\text{долг}\\cdot k - x',
        primer: '2100\\cdot 1{,}1 - 1210 = 1100',
      },
    ],
  },
  {
    id: 'vklad',
    nazvanie: 'Вклад',
    ton: 'green',
    formuly: [
      {
        tex: '\\text{на конец} = \\text{на начало}\\cdot k \\pm \\text{пополнение или снятие}',
        primer: '1\\cdot 1{,}1 + 0{,}5 = 1{,}6',
      },
    ],
  },
  {
    id: 'edinicy',
    nazvanie: 'Единицы ответа',
    ton: 'terra',
    formuly: [
      {
        tex: '1\\ \\text{тыс.} = 1000\\ \\text{руб.}',
        primer: '100\\ \\text{тыс.} = 100\\,000\\ \\text{руб.}',
      },
      {
        tex: '1\\ \\text{млн} = 1000\\ \\text{тыс.}',
        primer: '1{,}25\\ \\text{млн} = 1\\,250\\,000\\ \\text{руб.}',
      },
    ],
  },
];

/* ── Опорные задачи ───────────────────────────────────────────── */

export const OPORNYE13 = {
  ...tekstyOpornyh(
    'От таблицы руками до задач на целый вклад: короткие задачи на один навык. В каждом блоке десять задач.',
  ),
  otvet: 'Ответ',
  eshcheVariant: 'Ещё вариант',
};

/** Как сгруппированы блоки на вкладке: группы — прежние, цвет — по схеме. */
export const NAVYKI13: { id: string; ton: Ton }[] = [
  { id: 'tablitsa', ton: 'terra' },
  { id: 'dif', ton: 'blue' },
  { id: 'polomannyy', ton: 'navy' },
  { id: 'annuitet', ton: 'orange' },
  { id: 'vklady', ton: 'green' },
  { id: 'vse', ton: 'blue' },
];

/* ── Вторая часть: критерии и два вида задач ─────────────────────
   ЕГЭ-2027: задание во второй части, задачи на оптимизацию — внутри
   него вторым видом. ЧЕРНОВИК НА ВЫЧИТКУ. */

const N = nomerRazdela('ekonomika');

/** Блок «Как оценивается» на «О задании»: строки — KRITERII13 (content/teoriya13-chast2.ts). */
export const KRITERII_BLOK13 = {
  title: 'Как оценивается',
  head: ['Баллы', 'Что сделано'] as const,
  note: `Критерии — по демонстрационному варианту ЕГЭ-2027 (ФИПИ). Максимум — ${ballText(MESTO13.ball)}. Верный ответ без решения оценивается в 0 баллов.`,
  teoriya: 'Как записать решение на 2 балла',
};

/** Одна фраза о демоверсии: вид «На оптимизацию» может не встретиться. */
const DEMO_OPTIMIZACIYA =
  'В демоверсии 2027 года на этом месте кредит, поэтому вид «На оптимизацию» на экзамене может и не встретиться.';

export type Vid13 = 'ekonomika' | 'optimizaciya';

/** Блок «Два вида задач» на «О задании». */
export const VIDY13 = {
  title: 'Два вида задач',
  lead: `В задании ${N} встречаются задачи двух видов. ${DEMO_OPTIMIZACIYA}`,
  ekonomika: {
    metka: 'Вид 1',
    title: 'Экономические задачи',
    text: (tipovVsego: number) =>
      `Кредиты и вклады: четыре схемы, ${tipov(tipovVsego)} с разобранным примером. Ещё — цена и спрос, прибыль и расходы: такие задачи есть в вариантах.`,
    tipy: 'Типы по схемам',
    varianty: 'Решения из вариантов',
  },
  optimizaciya: {
    metka: 'Вид 2',
    title: 'Задачи на оптимизацию',
    text: 'Наибольшее или наименьшее значение величины в задаче из физики или геометрии: составить функцию одной переменной и исследовать её производной.',
    syuzhety: 'Сюжеты',
    zadachi: 'Задачи с решениями',
    teoriya: 'Теория',
  },
};

/** Экономические задачи из вариантов на «О задании» (якорь #iz-variantov). */
export const IZ_VARIANTOV13 = {
  title: 'Экономические задачи из вариантов',
  lead: 'Задачи второй части из вариантов повышенной сложности и ежемесячных: условие, решение по этапам и ответ. Так выглядит развёрнутое решение на экзамене.',
};

/** Вкладка «На оптимизацию». */
export const OPTIMIZACIYA13 = {
  title: 'Задачи на оптимизацию',
  lead: `Второй вид задания ${N}: наибольшее или наименьшее значение величины. Все задачи на оптимизацию из вариантов повышенной сложности и ежемесячных — по сюжетам, у каждой условие, решение по этапам и ответ.`,
  demo: DEMO_OPTIMIZACIYA,
  teoriya: 'Теория: как решать',
  teoriya12: `Теория задания ${nomerRazdela('naibolshee-naimenshee')}: наибольшее и наименьшее`,
};

/** Карточка задачи из варианта. */
export const ZADACHA_VARIANTA13 = {
  zhdyot: 'Открываем задачу…',
  net: 'Задача не открылась — обнови страницу.',
  reshenie: 'Решение и ответ',
  zadach,
};

export type SyuzhetId13 =
  | 'kredit'
  | 'cena-spros'
  | 'pribyl'
  | 'sudno'
  | 'drugie-ekonomika'
  | 'korobka'
  | 'uchastok'
  | 'polukrug'
  | 'lampa'
  | 'marshrut'
  | 'perekrestok'
  | 'koncentraciya'
  | 'moshchnost'
  | 'fizika'
  | 'drugie-optimizaciya';

export interface Syuzhet13 {
  id: SyuzhetId13;
  vid: Vid13;
  nazvanie: string;
  /** Значок группы, TeX без долларов. */
  znak: string;
  ton: Ton;
  lead: string;
}

/**
 * Сюжеты задач из вариантов, по порядку показа. Какой шаблон в каком
 * сюжете — lib/zadanie13/varianty17.ts.
 */
export const SYUZHETY13: readonly Syuzhet13[] = [
  {
    id: 'kredit',
    vid: 'ekonomika',
    nazvanie: 'Кредит на два года',
    znak: 'Sk^2',
    ton: 'orange',
    lead: 'Два равных платежа: найти платёж или сумму кредита',
  },
  {
    id: 'cena-spros',
    vid: 'ekonomika',
    nazvanie: 'Цена и спрос',
    znak: 'N(p)',
    ton: 'blue',
    lead: 'Спрос падает с ростом цены: при какой цене выручка или прибыль наибольшая',
  },
  {
    id: 'pribyl',
    vid: 'ekonomika',
    nazvanie: 'Прибыль фирмы',
    znak: 'q(p)',
    ton: 'green',
    lead: 'Продажи зависят от цены: наибольшая прибыль и цена, при которой она получается',
  },
  {
    id: 'sudno',
    vid: 'ekonomika',
    nazvanie: 'Расходы судна',
    znak: 'v^2',
    ton: 'navy',
    lead: 'Топливо дорожает со скоростью: при какой скорости рейс дешевле всего',
  },
  {
    id: 'drugie-ekonomika',
    vid: 'ekonomika',
    nazvanie: 'Другие экономические задачи',
    znak: '\ldots',
    ton: 'terra',
    lead: 'Задачи, которым ещё не назначен сюжет',
  },
  {
    id: 'korobka',
    vid: 'optimizaciya',
    nazvanie: 'Коробка из листа',
    znak: 'V(x)',
    ton: 'orange',
    lead: 'По углам листа вырезают квадраты: при какой стороне объём наибольший',
  },
  {
    id: 'uchastok',
    vid: 'optimizaciya',
    nazvanie: 'Участок и забор',
    znak: 'S = xy',
    ton: 'green',
    lead: 'Участок у стены: наименьшая длина или стоимость забора, наибольшая площадь',
  },
  {
    id: 'polukrug',
    vid: 'optimizaciya',
    nazvanie: 'Прямоугольник в полукруге',
    znak: 'R',
    ton: 'navy',
    lead: 'Вписанный прямоугольник наибольшей площади',
  },
  {
    id: 'lampa',
    vid: 'optimizaciya',
    nazvanie: 'Лампа над столом',
    znak: 'E(h)',
    ton: 'orange',
    lead: 'На какой высоте повесить лампу, чтобы край стола был освещён сильнее всего',
  },
  {
    id: 'marshrut',
    vid: 'optimizaciya',
    nazvanie: 'Спасатель и курьер',
    znak: 't(x)',
    ton: 'blue',
    lead: 'Часть пути быстро, часть медленно: где свернуть, чтобы успеть быстрее',
  },
  {
    id: 'perekrestok',
    vid: 'optimizaciya',
    nazvanie: 'Перекрёсток',
    znak: 'd(t)',
    ton: 'terra',
    lead: 'Двое движутся к перекрёстку: когда расстояние между ними наименьшее',
  },
  {
    id: 'koncentraciya',
    vid: 'optimizaciya',
    nazvanie: 'Концентрация лекарства',
    znak: 'C(t)',
    ton: 'green',
    lead: 'Через сколько часов после приёма концентрация наибольшая',
  },
  {
    id: 'moshchnost',
    vid: 'optimizaciya',
    nazvanie: 'Мощность в цепи',
    znak: 'P(R)',
    ton: 'navy',
    lead: 'Какое сопротивление подключить, чтобы мощность была наибольшей',
  },
  {
    id: 'fizika',
    vid: 'optimizaciya',
    nazvanie: 'Струя воды и сила тяги',
    znak: 'F(\alpha)',
    ton: 'blue',
    lead: 'Где пробить отверстие в бочке и под каким углом тянуть ящик',
  },
  {
    id: 'drugie-optimizaciya',
    vid: 'optimizaciya',
    nazvanie: 'Другие задачи на оптимизацию',
    znak: '\ldots',
    ton: 'terra',
    lead: 'Задачи, которым ещё не назначен сюжет',
  },
];
