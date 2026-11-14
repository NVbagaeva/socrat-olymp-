/**
 * Тексты «Стеклянной сцены» задания №6: шапка вкладки «О задании»,
 * группы, «Где теряют балл», блок «Что нужно знать», подписи тренажёра
 * и опорных задач. ЧЕРНОВИК НА ВЫЧИТКУ — см. docs/zadanie-6-teksty.md.
 *
 * Названия типов, условия и разборы здесь не дублируются: они берутся
 * из банка (lib/zadanie6/prototypes). Обращение к ученику — на «ты»
 * (docs/razdel-pravila.md, п. 4); кодов прототипов в подписях нет.
 */

import type { Ton } from '@/components/tasks/steklo';
import type { GroupId } from '@/lib/zadanie6/types';
import { tekstyOpornyh, tekstyTrenazheraBanka, tipov } from './treningBanka';
import { nomerRazdela, slovoChasti } from './struktura';

export const SHAPKA6 = {
  nadzagolovok: `Задание №${nomerRazdela('sluchainye-velichiny')} · ${slovoChasti('sluchainye-velichiny')}`,
  zagolovok: 'Прочитать распределение и посчитать одно число',
  lead: 'Случайный опыт дан рисунком (диаграмма Эйлера, дерево), таблицей или записью распределения. Нужно найти вероятность, условную вероятность, математическое ожидание, дисперсию или оценку по неравенству Чебышёва. Новое задание ЕГЭ с 2027 года.',
  fakty: (tipovVsego: number) => [
    { znachenie: '1', podpis: 'первичный балл' },
    { znachenie: '≈ 4', podpis: 'минуты на экзамене' },
    { znachenie: String(tipovVsego), podpis: 'типов в пяти группах' },
  ],
  opasnoTitle: 'Чем опасно',
  opasno: [
    'Складывают вероятности не тех точек: берут все точки внутри овала, а не только со значением $k$.',
    'В условной вероятности делят не на то: $P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$, а не на $P(A)$.',
    'В лотерее забывают проигрышные билеты: их тоже считают, с выигрышем $0$.',
    'Путают $\\mathrm{M}(X^2)$ и $\\left(\\mathrm{M}(X)\\right)^2$ — и дисперсия выходит отрицательной или нулём.',
    'В оценке по выборке делят на $n$ вместо $n-1$.',
  ],
  oblozhkaAlt: 'Обложка раздела «Случайные величины»',
  gruppyTitle: 'Типы задач по группам',
  gruppyLead:
    'Нажми на тип — откроется разобранный пример. Кнопка «Потренировать этот тип» ведёт в тренажёр.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Формулы по темам, у каждой — маленький пример.',
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
  schitaem: 'Считаем с умом',
};

/** Оформление групп: значок-формула и тон. Состав группы — из банка. */
export const GRUPPY6_VID: Record<GroupId, { znak: string; ton: Ton }> = {
  I: { znak: 'p_i', ton: 'blue' },
  II: { znak: 'A\\mid B', ton: 'navy' },
  III: { znak: '\\mathrm{M}', ton: 'orange' },
  IV: { znak: '\\varepsilon', ton: 'terra' },
  V: { znak: '\\mathrm{D}', ton: 'green' },
};

/**
 * «Где теряют балл» — свой текст у каждого типа: показывается под
 * разобранным примером. Ключ — прототип банка.
 */
export const TIPY6_OPASNO: Record<string, string> = {
  /* I. Диаграмма Эйлера */
  P01: 'Складывают вероятности всех точек внутри фигуры, а нужны только точки со значением $X=k$ — у других точек может быть то же место, но другое значение.',
  P02: 'Делят не на то: знаменатель — число всех точек опыта $S$, а не только тех, что внутри овала.',
  /* II. Условная вероятность */
  P03: 'Делят на $P(A)$ вместо $P(B)$ или забывают перемножить вероятности вдоль ветвей и складывают их.',
  /* III. Математическое ожидание */
  P04: 'Не учитывают проигрышные билеты: их число — все билеты минус выигрышные, и в сумме $\\sum x_in_i$ они дают $0$, но знаменатель — все $N$ билетов.',
  P05: 'Отвечают ожиданием выигрыша, а спрашивают, насколько цена билета больше: в ответ — цена минус $\\mathrm{M}$.',
  P06: 'Складывают значения или вероятности по отдельности. Ожидание — сумма произведений $x_ip_i$ по всем столбцам таблицы.',
  P07: 'Путают в записи $X\\sim(\\ldots)$, где значения, а где вероятности: верхняя строка — значения, нижняя — их вероятности.',
  P08: 'Не переводят частоты в вероятности ($\\dfrac{n_i}{100}$) или забывают, что в упаковке несколько штук: значение — число штук, а не упаковок.',
  P09: 'Путают знак: доход компании с договора — цена полиса минус ожидаемая выплата, поэтому цена $c=\\mathrm{M}+V\\cdot p$.',
  /* IV. Оценка вероятности */
  P10: 'Берут $\\varepsilon$ не как расстояние от $\\mathrm{M}(X)$ до границы или забывают возвести его в квадрат: $\\dfrac{\\mathrm{D}(X)}{\\varepsilon^2}$.',
  P11: 'Путают строгие и нестрогие знаки на границах: при $3<Y<6$ значения $3$ и $6$ не входят.',
  /* V. Дисперсия */
  P12: 'Делят сумму квадратов отклонений на $n$, а несмещённая оценка — на $n-1$. И считают отклонения не от среднего выборки.',
  P13: 'Ошибаются в дробях: приводят к общему знаменателю не всё и путают $\\mathrm{M}(X^2)$ с $\\left(\\mathrm{M}(X)\\right)^2$.',
  P14: 'Вычитают из $\\mathrm{M}(X^2)$ само ожидание, а не его квадрат: $\\mathrm{D}=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$.',
  P15: 'Отвечают дисперсией, а спрашивают стандартное отклонение: в ответ — $\\sqrt{\\mathrm{D}(X)}$.',
};

export interface Formula6 {
  tex: string;
  /** Пример применения, TeX. */
  primer: string;
}

export interface FormulyGruppy6 {
  id: string;
  nazvanie: string;
  ton: Ton;
  formuly: Formula6[];
}

/** «Что нужно знать»: формулы по темам, каждая — с примером. */
export const FORMULY6: FormulyGruppy6[] = [
  {
    id: 'veroyatnost',
    nazvanie: 'Вероятность и распределение',
    ton: 'blue',
    formuly: [
      {
        tex: 'p_1+p_2+\\ldots+p_n=1',
        primer: '0{,}2+0{,}5+p=1\\ \\Rightarrow\\ p=0{,}3',
      },
      {
        tex: 'P(A)=\\dfrac{m}{n}',
        primer: '3\\text{ точки из }12:\\ P=\\dfrac{3}{12}=0{,}25',
      },
    ],
  },
  {
    id: 'uslovnaya',
    nazvanie: 'Условная вероятность',
    ton: 'navy',
    formuly: [
      {
        tex: 'P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}',
        primer: '\\dfrac{0{,}3}{0{,}4}=0{,}75',
      },
      {
        tex: 'P(\\text{исход})=p_1\\cdot p_2',
        primer: '0{,}6\\cdot0{,}5=0{,}3',
      },
    ],
  },
  {
    id: 'ozhidanie',
    nazvanie: 'Математическое ожидание',
    ton: 'orange',
    formuly: [
      {
        tex: '\\mathrm{M}(X)=x_1p_1+\\ldots+x_np_n',
        primer: '1\\cdot0{,}5+3\\cdot0{,}5=2',
      },
      {
        tex: '\\mathrm{M}=\\dfrac{\\sum x_in_i}{N}',
        primer: '\\dfrac{100\\cdot2+0\\cdot8}{10}=20',
      },
    ],
  },
  {
    id: 'dispersiya',
    nazvanie: 'Дисперсия',
    ton: 'green',
    formuly: [
      {
        tex: '\\mathrm{D}(X)=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2',
        primer: '5-2^2=1',
      },
      {
        tex: '\\sigma(X)=\\sqrt{\\mathrm{D}(X)}',
        primer: '\\sqrt{2{,}25}=1{,}5',
      },
    ],
  },
  {
    id: 'vyborka',
    nazvanie: 'Выборка',
    ton: 'green',
    formuly: [
      {
        tex: '\\overline{x}=\\dfrac{x_1+\\ldots+x_n}{n}',
        primer: '\\dfrac{1+2+6}{3}=3',
      },
      {
        tex: 'S^2=\\dfrac{\\sum(x_i-\\overline{x})^2}{n-1}',
        primer: '\\dfrac{4+1+9}{3-1}=7',
      },
    ],
  },
  {
    id: 'chebyshev',
    nazvanie: 'Неравенство Чебышёва',
    ton: 'terra',
    formuly: [
      {
        tex: 'P\\left(|X-\\mathrm{M}(X)|\\geqslant\\varepsilon\\right)\\leqslant\\dfrac{\\mathrm{D}(X)}{\\varepsilon^2}',
        primer: '\\mathrm{M}=6,\\ \\mathrm{D}=1,\\ \\varepsilon=2:\\ \\dfrac{1}{4}=0{,}25',
      },
    ],
  },
];

export const TRENAZHER6 = (() => {
  const t = tekstyTrenazheraBanka({
    nomer: nomerRazdela('sluchainye-velichiny'),
    grupp: 'пяти',
    istochniki: { vse: 'Все', fipi: 'Исходные', new: 'Сгенерированные' },
  });
  return {
    ...t,
    vybor: {
      ...t.vybor,
      /* Формулировка: переключатель в выборе тем (у №6 есть сюжетные задачи). */
      stil: 'Формулировка',
      stili: { vse: 'Все', syuzhet: 'Сюжетные', standart: 'Стандартные' },
    },
    ekran: {
      ...t.ekran,
      demo: 'Демоверсия ФИПИ',
      obrazec: (gde: string) => `${gde} · не из открытого банка`,
      neIzBanka: 'Не из открытого банка',
    },
  };
})();

/* ── Опорные задачи ───────────────────────────────────────────── */

/** Навыки: как сгруппированы блоки опорных задач на вкладке. */
export const NAVYKI6: {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  /** Блоки навыка: slug блока → значок (TeX). */
  bloki: { slug: string; znak: string }[];
}[] = [
  {
    id: 'veroyatnosti',
    nazvanie: 'Вероятности и распределение',
    lead: 'Сложить, перевести частоты, умножить по дереву',
    ton: 'blue',
    bloki: [
      { slug: 'slozhit-veroyatnosti', znak: '\\Sigma' },
      { slug: 'chastoty', znak: '\\tfrac{n}{100}' },
      { slug: 'umnozhenie-po-derevu', znak: 'p_1p_2' },
      { slug: 'promezhutok', znak: '(a;b]' },
    ],
  },
  {
    id: 'ozhidanie',
    nazvanie: 'Математическое ожидание',
    lead: 'Строка «значение на вероятность»',
    ton: 'orange',
    bloki: [{ slug: 'stroka-xp', znak: 'x_ip_i' }],
  },
  {
    id: 'dispersiya',
    nazvanie: 'Дисперсия и отклонения',
    lead: 'Квадраты, отклонения от среднего, выборка',
    ton: 'green',
    bloki: [
      { slug: 'kvadraty', znak: '\\mathrm{D}' },
      { slug: 'otkloneniya', znak: '\\overline{x}' },
    ],
  },
];

export const OPORNYE6 = tekstyOpornyh(
  `Короткие задачи на один навык: из этих навыков складывается любая задача №${nomerRazdela('sluchainye-velichiny')}. В каждом блоке десять задач.`,
);
