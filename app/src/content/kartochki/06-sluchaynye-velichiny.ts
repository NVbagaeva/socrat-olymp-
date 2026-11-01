/**
 * Карточки по теории задания №6 «Случайные величины и распределения».
 *
 * Колода идёт по разделам вкладки «Теория» №6 (content/teoriya6.ts):
 * распределение, диаграммы Эйлера и деревья, условная вероятность,
 * ожидание, дисперсия, выборка, неравенство Чебышёва, попадание в
 * промежуток. `source` — якорь страницы (lib/zadanie6/teoriya-yakorya.ts):
 * карточка теории #k-…, рамка раздела #t6-…. Всё, что спрашивает колода,
 * в теории №6 написано — карточек «добавлено» нет.
 *
 * Рисунки — те же, что в теории и тренажёре (Ris6: диаграмма Эйлера с
 * точками, дерево). Примеры с числами — свои, не задачи банка; ответы
 * и формулы проверяет scripts/verify_cards (формулы — на случайных
 * распределениях и выборках).
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { YAKOR_6 } from '@/lib/zadanie6/teoriya-yakorya';
import type { RisEilera } from '@/lib/zadanie6/risunkiKartochek';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const K = YAKOR_6.kartochka;
const R = YAKOR_6.blok;

/* ── Рисунки ── */

/** Диаграмма Эйлера карточки «6-eiler-ch»: значение 2 — у двух точек. */
const EILER_TOCHKI = [
  { x: '2', p: '0{,}1', pv: 0.1 },
  { x: '1', p: '0{,}25', pv: 0.25 },
  { x: '2', p: '0{,}3', pv: 0.3 },
  { x: '3', p: '0{,}15', pv: 0.15 },
  { x: '1', p: '0{,}2', pv: 0.2 },
] as const;

const RIS_EILER: RisEilera = {
  vid: 'eiler',
  tochki: EILER_TOCHKI.map(({ x, p }) => ({ x, p })),
  zerno: 'kartochki6-eiler',
};

/** Равновозможные исходы карточки «6-ravnovozm-ch»: значение 3 — у трёх точек из шести. */
const RAVNOVOZM_X = ['3', '5', '3', '8', '5', '3'] as const;

const RIS_RAVNOVOZM: RisEilera = {
  vid: 'eiler',
  tochki: RAVNOVOZM_X.map((x) => ({ x })),
  zerno: 'kartochki6-ravnovozm',
};

/* ── Счёт для проверок ── */

/** Распределение из 1–6 значений: значения целые от −5 до 9, вероятности в сумме 1. */
function raspredelenie(rnd: () => number): { x: number[]; p: number[] } {
  const n = 1 + Math.floor(rnd() * 6);
  const x = Array.from({ length: n }, () => Math.floor(rnd() * 15) - 5);
  const w = Array.from({ length: n }, () => 0.05 + rnd());
  const s = w.reduce((a, b) => a + b, 0);
  return { x, p: w.map((v) => v / s) };
}

const M = (x: readonly number[], p: readonly number[]) =>
  x.reduce((s, xi, i) => s + xi * (p[i] ?? 0), 0);

/** Сумма вероятностей значений, для которых верно условие. */
const Pv = (x: readonly number[], p: readonly number[], f: (v: number) => boolean) =>
  x.reduce((s, xi, i) => (f(xi) ? s + (p[i] ?? 0) : s), 0);

const sum = (a: readonly number[]) => a.reduce((s, v) => s + v, 0);

/** Выборка из 2–8 значений от −10 до 10. */
function vyborka(rnd: () => number): number[] {
  const n = 2 + Math.floor(rnd() * 7);
  return Array.from({ length: n }, () => Math.round((rnd() * 20 - 10) * 10) / 10);
}

const kartochki: Kartochka[] = [
  /* ── Случайная величина и распределение ── */
  {
    id: '6-velichina',
    task: 6,
    topic: 'raspredelenie',
    type: 'svoystvo',
    front: 'Что такое **случайная величина**?',
    back: 'Величина, которая в результате опыта принимает одно из своих возможных значений, и заранее неизвестно, какое именно.',
    pochemu: 'Например, $X$ — число очков на кубике: $1$, $2$, …, $6$.',
    level: B,
    source: R('velichina'),
  },
  {
    id: '6-raspredelenie',
    task: 6,
    topic: 'raspredelenie',
    type: 'svoystvo',
    front: 'Что называют **распределением** случайной величины?',
    back: 'Список всех её значений и вероятностей, с которыми она их принимает: таблица в две строки или запись $X\\sim(\\ldots)$ — сверху значения, снизу вероятности.',
    level: B,
    source: K('tablica-raspredeleniya'),
  },
  {
    id: '6-summa-1',
    task: 6,
    topic: 'raspredelenie',
    type: 'formula',
    front: 'Чему равна сумма всех вероятностей распределения $p_1+p_2+\\ldots+p_n$?',
    back: '$p_1+p_2+\\ldots+p_n=1$',
    pochemu: 'Величина обязательно принимает какое-то из своих значений.',
    level: B,
    source: K('tablica-raspredeleniya'),
  },
  {
    id: '6-summa-l',
    task: 6,
    topic: 'raspredelenie',
    type: 'verno',
    front:
      'Значения $0$, $1$, $2$ с вероятностями $0{,}3$, $0{,}5$, $0{,}3$ — это распределение случайной величины.',
    verno: false,
    back: 'Неверно: $0{,}3+0{,}5+0{,}3=1{,}1\\ne1$. Значение пропущено или вероятность прочитана неверно.',
    level: E,
    source: K('tablica-raspredeleniya'),
  },
  {
    id: '6-neotr-l',
    task: 6,
    topic: 'raspredelenie',
    type: 'verno',
    front:
      'Одна из вероятностей распределения может быть отрицательной, если в сумме всё равно $1$.',
    verno: false,
    back: 'Неверно: все вероятности неотрицательны, а их сумма равна единице.',
    level: B,
    source: K('tablica-raspredeleniya'),
  },
  {
    id: '6-propushchennaya-v',
    task: 6,
    topic: 'raspredelenie',
    type: 'vychislenie',
    front:
      'Величина $X$ принимает значения $1$, $2$, $3$, $4$ с вероятностями $0{,}15$, $0{,}4$, $p$, $0{,}2$. Найдите $p$.',
    back: '$p=1-(0{,}15+0{,}4+0{,}2)=0{,}25$',
    otvet: '0,25',
    proverka: () => 1 - (0.15 + 0.4 + 0.2),
    level: B,
    source: K('propushchennaya'),
  },
  {
    id: '6-proigrysh',
    task: 6,
    topic: 'raspredelenie',
    type: 'svoystvo',
    front:
      'В условии лотереи перечислены только выигрышные билеты. Какое значение выигрыша «пропущено»?',
    back: 'Проигрышные билеты: их выигрыш $0$, а число — всё, что осталось от $N$.',
    level: E,
    source: K('propushchennaya'),
  },
  {
    id: '6-proigrysh-v',
    task: 6,
    topic: 'raspredelenie',
    type: 'vychislenie',
    front:
      'В лотерее $1000$ билетов: $10$ выигрывают по $500$ рублей, $90$ — по $100$ рублей, остальные без выигрыша. Найдите вероятность, что купленный билет проигрышный.',
    back: 'Проигрышных $1000-10-90=900$, $P=\\dfrac{900}{1000}=0{,}9$',
    otvet: '0,9',
    proverka: () => (1000 - 10 - 90) / 1000,
    level: B,
    source: K('propushchennaya'),
  },

  /* ── Диаграммы Эйлера и деревья ── */
  {
    id: '6-eiler-chtenie',
    task: 6,
    topic: 'diagrammy',
    type: 'svoystvo',
    front:
      'Диаграмма Эйлера в №6: что означают прямоугольник, точка, число над точкой и число справа снизу?',
    back: 'Прямоугольник — весь опыт $S$, точка — элементарное событие. Над точкой — значение величины в этом исходе, справа снизу — вероятность исхода.',
    level: B,
    source: R('eiler-chtenie'),
  },
  {
    id: '6-eiler',
    task: 6,
    topic: 'diagrammy',
    type: 'formula',
    front: 'Как по диаграмме Эйлера найти $P(X=k)$?',
    back: '$P(X=k)=\\sum_{x_i=k}p_i$',
    pochemu:
      'Складываем вероятности всех точек, где величина равна $k$: одно значение может стоять у нескольких точек.',
    level: E,
    source: K('eiler-veroyatnosti'),
  },
  {
    id: '6-eiler-ch',
    task: 6,
    topic: 'diagrammy',
    type: 'chertezh',
    front: 'Найдите по диаграмме $P(X=2)$.',
    back: 'Значение $2$ стоит у двух точек: $P(X=2)=0{,}1+0{,}3=0{,}4$',
    figure: { dvizhok: 'zadanie6', ris: RIS_EILER },
    level: E,
    source: K('eiler-veroyatnosti'),
  },
  {
    id: '6-ravnovozm',
    task: 6,
    topic: 'diagrammy',
    type: 'formula',
    front:
      'На диаграмме Эйлера $n$ равновозможных исходов, значение $k$ стоит у $m$ из них. $P(X=k)$?',
    back: '$P(X=k)=\\dfrac{m}{n}$',
    pochemu: 'Каждая точка — вероятность $\\dfrac1n$, их $m$.',
    level: B,
    source: K('eiler-ravnovozmozhnye'),
  },
  {
    id: '6-ravnovozm-v',
    task: 6,
    topic: 'diagrammy',
    type: 'vychislenie',
    front:
      'На диаграмме Эйлера $8$ равновозможных исходов, значение $X=5$ стоит у трёх из них. Найдите $P(X=5)$.',
    back: '$P(X=5)=\\dfrac38=0{,}375$',
    otvet: '0,375',
    proverka: () => 3 / 8,
    level: B,
    source: K('eiler-ravnovozmozhnye'),
  },
  {
    id: '6-ravnovozm-ch',
    task: 6,
    topic: 'diagrammy',
    type: 'chertezh',
    front: 'Исходы на диаграмме равновозможны. Найдите $P(X=3)$.',
    back: 'Всего точек $n=6$, со значением $3$ — $m=3$: $P(X=3)=\\dfrac36=0{,}5$',
    figure: { dvizhok: 'zadanie6', ris: RIS_RAVNOVOZM },
    level: B,
    source: K('eiler-ravnovozmozhnye'),
  },
  {
    id: '6-ravnovozm-l',
    task: 6,
    topic: 'diagrammy',
    type: 'verno',
    front:
      'При равновозможных исходах $P(X=k)$ — число точек со значением $k$, делённое на число остальных точек.',
    verno: false,
    back: 'Неверно: делим на число **всех** точек $n$, а не остальных.',
    level: E,
    source: K('eiler-ravnovozmozhnye'),
  },
  {
    id: '6-derevo',
    task: 6,
    topic: 'diagrammy',
    type: 'formula',
    front: 'Как по дереву найти вероятность исхода — листа?',
    back: '$P(\\text{исхода})=p_1\\cdot p_2\\cdot\\ldots$',
    pochemu: 'Перемножаем вероятности на рёбрах пути от корня $S$ к листу.',
    level: B,
    source: K('derevo-iskhod'),
  },
  {
    id: '6-derevo-rebra',
    task: 6,
    topic: 'diagrammy',
    type: 'verno',
    front:
      'На дереве рёбра из одной вершины в сумме дают $1$, и вероятности всех листьев в сумме — тоже $1$.',
    verno: true,
    back: 'Верно: из вершины опыт идёт одним из её рёбер, а листья — все элементарные события.',
    level: B,
    source: R('derevo-chtenie'),
  },
  {
    id: '6-derevo-v',
    task: 6,
    topic: 'diagrammy',
    type: 'vychislenie',
    front:
      'На дереве путь к исходу проходит по рёбрам с вероятностями $0{,}8$ и $0{,}35$. Найдите вероятность этого исхода.',
    back: '$P=0{,}8\\cdot0{,}35=0{,}28$',
    otvet: '0,28',
    proverka: () => 0.8 * 0.35,
    level: B,
    source: K('derevo-iskhod'),
  },

  /* ── Условная вероятность ── */
  {
    id: '6-uslovnaya',
    task: 6,
    topic: 'uslovnaya',
    type: 'formula',
    front: 'Формула условной вероятности $P(A\\mid B)$?',
    back: '$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$',
    pochemu: 'В знаменателе — вероятность условия, того, что уже случилось.',
    level: E,
    source: K('uslovnaya-derevo'),
  },
  {
    id: '6-uslovnaya-smysl',
    task: 6,
    topic: 'uslovnaya',
    type: 'svoystvo',
    front: 'Как меняется «весь мир» опыта, когда известно, что событие $B$ уже случилось?',
    back: 'Мир сужается до $B$: исходы вне $B$ невозможны. Внутри $B$ нас интересуют исходы, где наступает и $A$, — то есть $A\\cap B$.',
    level: B,
    source: R('uslovnaya-smysl'),
  },
  {
    id: '6-uslovnaya-cherta-l',
    task: 6,
    topic: 'uslovnaya',
    type: 'verno',
    front: '$P(A\\mid B)$ и $P(B\\mid A)$ — всегда одно и то же число.',
    verno: false,
    back: 'Неверно: делим на вероятность события, которое стоит **после черты**, — $P(B)$ или $P(A)$, а они обычно разные.',
    level: E,
    source: R('uslovnaya-cherta'),
  },
  {
    id: '6-uslovnaya-znam',
    task: 6,
    topic: 'uslovnaya',
    type: 'verno',
    front: 'В $P(A\\mid B)$ знаменатель — сумма вероятностей исходов события $B$, а не единица.',
    verno: true,
    back: 'Верно: $P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$, и $P(B)$ — сумма вероятностей исходов $B$.',
    level: E,
    source: K('uslovnaya-derevo'),
  },
  {
    id: '6-uslovnaya-v',
    task: 6,
    topic: 'uslovnaya',
    type: 'vychislenie',
    front: '$P(A\\cap B)=0{,}12$, $P(B)=0{,}4$. Найдите $P(A\\mid B)$.',
    back: '$P(A\\mid B)=\\dfrac{0{,}12}{0{,}4}=0{,}3$',
    otvet: '0,3',
    proverka: () => 0.12 / 0.4,
    level: B,
    source: K('uslovnaya-derevo'),
  },
  {
    id: '6-uslovnaya-v2',
    task: 6,
    topic: 'uslovnaya',
    type: 'vychislenie',
    front:
      'Исходы $a$, $b$, $c$, $d$ имеют вероятности $0{,}2$, $0{,}3$, $0{,}1$, $0{,}4$. Событию $A$ благоприятствуют $a$, $b$, событию $B$ — $b$, $c$, $d$. Найдите $P(A\\mid B)$.',
    back: '$P(A\\cap B)=P(b)=0{,}3$, $P(B)=0{,}3+0{,}1+0{,}4=0{,}8$.\n$P(A\\mid B)=\\dfrac{0{,}3}{0{,}8}=0{,}375$',
    otvet: '0,375',
    proverka: () => {
      const p = { a: 0.2, b: 0.3, c: 0.1, d: 0.4 };
      const A = new Set(['a', 'b']);
      const Bs = ['b', 'c', 'd'] as const;
      const pB = sum(Bs.map((x) => p[x]));
      const pAB = sum(Bs.filter((x) => A.has(x)).map((x) => p[x]));
      return pAB / pB;
    },
    level: E,
    source: K('uslovnaya-derevo'),
  },

  /* ── Математическое ожидание ── */
  {
    id: '6-ozhidanie',
    task: 6,
    topic: 'ozhidanie',
    type: 'formula',
    front: 'Формула математического ожидания $\\mathrm{M}(X)$ по распределению?',
    back: '$\\mathrm{M}(X)=x_1p_1+x_2p_2+\\ldots+x_np_n=\\sum x_ip_i$',
    pochemu: 'Каждое значение умножаем на его вероятность и складываем.',
    level: B,
    source: K('ozhidanie-raspredelenie'),
  },
  {
    id: '6-ozhidanie-smysl',
    task: 6,
    topic: 'ozhidanie',
    type: 'svoystvo',
    front: 'Что показывает $\\mathrm{M}(X)$? Обязательно ли величина принимает это значение?',
    back: 'Среднее значение при многократном повторении опыта. Само это значение величина может и не принимать.',
    level: B,
    source: R('ozhidanie-smysl'),
  },
  {
    id: '6-ozhidanie-smysl-l',
    task: 6,
    topic: 'ozhidanie',
    type: 'verno',
    front: 'Математическое ожидание — самое вероятное значение случайной величины.',
    verno: false,
    back: 'Неверно: это среднее, а не «самое вероятное». У $X$ со значениями $0$, $1$, $2$, $3$ и вероятностями $0{,}1$, $0{,}3$, $0{,}4$, $0{,}2$ ожидание $1{,}7$ — такого значения нет вовсе.',
    level: E,
    source: R('ozhidanie-smysl'),
  },
  {
    id: '6-ozhidanie-v',
    task: 6,
    topic: 'ozhidanie',
    type: 'vychislenie',
    front:
      '$X$ принимает значения $-2$, $1$, $4$ с вероятностями $0{,}3$, $0{,}5$, $0{,}2$. Найдите $\\mathrm{M}(X)$.',
    back: '$\\mathrm{M}(X)=-2\\cdot0{,}3+1\\cdot0{,}5+4\\cdot0{,}2=-0{,}6+0{,}5+0{,}8=0{,}7$',
    pochemu: 'Отрицательное значение — со своим знаком.',
    otvet: '0,7',
    proverka: () => M([-2, 1, 4], [0.3, 0.5, 0.2]),
    level: B,
    source: K('ozhidanie-raspredelenie'),
  },
  {
    id: '6-loteraya',
    task: 6,
    topic: 'ozhidanie',
    type: 'formula',
    front:
      'Лотерея: $N$ билетов, из них $n_i$ билетов с выигрышем $x_i$. Ожидаемый выигрыш на один билет?',
    back: '$\\mathrm{M}=\\dfrac{x_1n_1+x_2n_2+\\ldots}{N}$',
    pochemu: 'Делим на **все** билеты: проигрышные — тоже значение величины, выигрыш $0$.',
    level: E,
    source: K('loteraya'),
  },
  {
    id: '6-loteraya-l',
    task: 6,
    topic: 'ozhidanie',
    type: 'verno',
    front: 'Ожидаемый выигрыш в лотерее — сумма выигрышей, делённая на число выигрышных билетов.',
    verno: false,
    back: 'Неверно: делим на число **всех** билетов $N$ — проигрышные билеты входят в распределение со значением $0$.',
    level: E,
    source: K('loteraya'),
  },
  {
    id: '6-loteraya-v',
    task: 6,
    topic: 'ozhidanie',
    type: 'vychislenie',
    front:
      'В лотерее $2000$ билетов: $4$ выигрывают по $1500$ рублей, $40$ — по $100$ рублей, остальные без выигрыша. Найдите математическое ожидание выигрыша на один билет.',
    back: '$\\mathrm{M}=\\dfrac{4\\cdot1500+40\\cdot100}{2000}=\\dfrac{10\\,000}{2000}=5$',
    otvet: '5',
    proverka: () => {
      const bilety = [
        ...Array<number>(4).fill(1500),
        ...Array<number>(40).fill(100),
        ...Array<number>(2000 - 44).fill(0),
      ];
      return sum(bilety) / bilety.length;
    },
    level: B,
    source: K('loteraya'),
  },
  {
    id: '6-chastoty-v',
    task: 6,
    topic: 'ozhidanie',
    type: 'vychislenie',
    front:
      'В среднем из $100$ покупателей $30$ тратят по $200$ рублей, $10$ — по $500$ рублей, остальные ничего не покупают. Найдите ожидаемую трату одного покупателя.',
    back: 'Вероятности $\\dfrac{30}{100}=0{,}3$ и $\\dfrac{10}{100}=0{,}1$: $\\mathrm{M}=200\\cdot0{,}3+500\\cdot0{,}1=110$',
    pochemu: 'Те, кто ничего не купил, — значение $0$.',
    otvet: '110',
    proverka: () => M([200, 500, 0], [30 / 100, 10 / 100, 60 / 100]),
    level: E,
    source: K('chastoty'),
  },
  {
    id: '6-strahovanie',
    task: 6,
    topic: 'ozhidanie',
    type: 'formula',
    front:
      'Полис стоит $c$, выплата $V$ случается с вероятностью $p$. Ожидаемый доход компании с одного полиса?',
    back: '$\\mathrm{M}=c(1-p)+(c-V)p=c-V\\cdot p$',
    pochemu: 'Доход $c$ без выплаты и $c-V$ с выплатой.',
    level: E,
    source: K('strahovanie'),
  },
  {
    id: '6-strahovanie-v',
    task: 6,
    topic: 'ozhidanie',
    type: 'vychislenie',
    front:
      'Полис стоит $3000$ рублей, выплата $100\\,000$ рублей случается с вероятностью $0{,}02$. Найдите ожидаемый доход компании с одного полиса.',
    back: '$\\mathrm{M}=3000-100\\,000\\cdot0{,}02=3000-2000=1000$',
    otvet: '1000',
    proverka: () => M([3000, 3000 - 100000], [1 - 0.02, 0.02]),
    level: B,
    source: K('strahovanie'),
  },
  {
    id: '6-svoystva-M',
    task: 6,
    topic: 'ozhidanie',
    type: 'formula',
    front:
      'Как меняется $\\mathrm{M}$, если ко всем значениям прибавить $c$? Если все значения умножить на $c$?',
    back: '$\\mathrm{M}(X+c)=\\mathrm{M}(X)+c$, $\\mathrm{M}(cX)=c\\cdot\\mathrm{M}(X)$',
    level: B,
    source: R('ozhidanie-svoystva'),
  },
  {
    id: '6-svoystva-M-v',
    task: 6,
    topic: 'ozhidanie',
    type: 'vychislenie',
    front: '$\\mathrm{M}(X)=4$. Найдите $\\mathrm{M}(3X+2)$.',
    back: '$\\mathrm{M}(3X+2)=3\\cdot\\mathrm{M}(X)+2=3\\cdot4+2=14$',
    otvet: '14',
    proverka: () => {
      /* Любое распределение с M(X) = 4: значения 1 и 7 поровну. */
      const x = [1, 7];
      const p = [0.5, 0.5];
      return M(
        x.map((v) => 3 * v + 2),
        p,
      );
    },
    level: B,
    source: R('ozhidanie-svoystva'),
  },

  /* ── Дисперсия и стандартное отклонение ── */
  {
    id: '6-dispersiya',
    task: 6,
    topic: 'dispersiya',
    type: 'formula',
    front: 'Удобная формула дисперсии $\\mathrm{D}(X)$ через ожидания?',
    back: '$\\mathrm{D}(X)=\\mathrm{M}(X^2)-\\left(\\mathrm{M}(X)\\right)^2$',
    pochemu:
      'По определению — средний квадрат отклонения от среднего: $\\mathrm{M}\\bigl((X-\\mathrm{M}(X))^2\\bigr)$.',
    level: E,
    source: K('dispersiya-raspredelenie'),
  },
  {
    id: '6-dispersiya-smysl',
    task: 6,
    topic: 'dispersiya',
    type: 'svoystvo',
    front: 'Что показывает дисперсия? Может ли у двух величин с одним средним она быть разной?',
    back: 'Насколько значения разбросаны вокруг среднего. Может: $X$ со значениями $4$, $5$, $6$ почти всегда равна $5$, а $Y$ со значениями $1$, $5$, $9$ часто уходит к краям — при $\\mathrm{M}=5$ у обеих.',
    level: B,
    source: R('dispersiya-razbros'),
  },
  {
    id: '6-dispersiya-znak-l',
    task: 6,
    topic: 'dispersiya',
    type: 'verno',
    front: 'Дисперсия может получиться отрицательной, если значения величины отрицательные.',
    verno: false,
    back: 'Неверно: дисперсия — средний квадрат отклонения, отрицательной она не бывает. Вышло $\\mathrm{D}<0$ — вычли в неправильном порядке: из $\\mathrm{M}(X^2)$ вычитают $\\left(\\mathrm{M}(X)\\right)^2$.',
    level: E,
    source: R('dispersiya-znak'),
  },
  {
    id: '6-dispersiya-v',
    task: 6,
    topic: 'dispersiya',
    type: 'vychislenie',
    front:
      '$X$ принимает значения $0$, $2$, $4$ с вероятностями $0{,}25$, $0{,}5$, $0{,}25$. Найдите $\\mathrm{D}(X)$.',
    back: '$\\mathrm{M}(X)=2\\cdot0{,}5+4\\cdot0{,}25=2$, $\\mathrm{M}(X^2)=4\\cdot0{,}5+16\\cdot0{,}25=6$.\n$\\mathrm{D}(X)=6-2^2=2$',
    otvet: '2',
    proverka: () => {
      const x = [0, 2, 4];
      const p = [0.25, 0.5, 0.25];
      const m = M(x, p);
      return M(
        x.map((v) => (v - m) ** 2),
        p,
      );
    },
    level: E,
    source: K('dispersiya-raspredelenie'),
  },
  {
    id: '6-bernulli',
    task: 6,
    topic: 'dispersiya',
    type: 'formula',
    front:
      'Величина принимает значения $0$ и $1$, единицу — с вероятностью $p$. Чему равна её дисперсия?',
    back: '$\\mathrm{D}=p(1-p)$',
    level: E,
    source: K('dispersiya-raspredelenie'),
  },
  {
    id: '6-bernulli-v',
    task: 6,
    topic: 'dispersiya',
    type: 'vychislenie',
    front: '$X=1$ с вероятностью $0{,}3$ и $X=0$ с вероятностью $0{,}7$. Найдите $\\mathrm{D}(X)$.',
    back: '$\\mathrm{D}=0{,}3\\cdot0{,}7=0{,}21$',
    otvet: '0,21',
    proverka: () => M([0, 1], [0.7, 0.3]) - M([0, 1], [0.7, 0.3]) ** 2,
    level: B,
    source: K('dispersiya-raspredelenie'),
  },
  {
    id: '6-sigma',
    task: 6,
    topic: 'dispersiya',
    type: 'formula',
    front: 'Как стандартное отклонение $\\sigma(X)$ связано с дисперсией?',
    back: '$\\sigma(X)=\\sqrt{\\mathrm{D}(X)}$',
    pochemu: 'Корень возвращает те же единицы, что у самой величины.',
    level: B,
    source: K('sigma'),
  },
  {
    id: '6-sigma-v',
    task: 6,
    topic: 'dispersiya',
    type: 'vychislenie',
    front: '$\\mathrm{D}(X)=6{,}25$. Найдите стандартное отклонение $\\sigma(X)$.',
    back: '$\\sigma=\\sqrt{6{,}25}=2{,}5$',
    otvet: '2,5',
    proverka: () => Math.sqrt(6.25),
    level: B,
    source: K('sigma'),
  },
  {
    id: '6-sigma-l',
    task: 6,
    topic: 'dispersiya',
    type: 'verno',
    front:
      'Спрашивают стандартное отклонение, посчитали $\\mathrm{D}=2{,}25$ — в ответ пишем $2{,}25$.',
    verno: false,
    back: 'Неверно: стандартное отклонение — корень из дисперсии, $\\sigma=\\sqrt{2{,}25}=1{,}5$.',
    level: E,
    source: K('sigma'),
  },

  /* ── Выборка и несмещённая оценка дисперсии ── */
  {
    id: '6-srednee',
    task: 6,
    topic: 'vyborka',
    type: 'formula',
    front: 'Выборочное среднее $\\overline{x}$ выборки $x_1,\\ x_2,\\ \\ldots,\\ x_n$?',
    back: '$\\overline{x}=\\dfrac{x_1+x_2+\\ldots+x_n}{n}$',
    level: B,
    source: R('vyborka-srednee'),
  },
  {
    id: '6-nesmeshch',
    task: 6,
    topic: 'vyborka',
    type: 'formula',
    front: 'Несмещённая оценка дисперсии $S^2$ по выборке из $n$ значений?',
    back: '$S^2=\\dfrac{(x_1-\\overline{x})^2+(x_2-\\overline{x})^2+\\ldots+(x_n-\\overline{x})^2}{n-1}$',
    pochemu: 'Среднее → отклонения → квадраты → сумма → делим на $n-1$.',
    level: E,
    source: K('nesmeshchennaya'),
  },
  {
    id: '6-pochemu-n-1',
    task: 6,
    topic: 'vyborka',
    type: 'svoystvo',
    front: 'Почему в несмещённой оценке дисперсии делят на $n-1$, а не на $n$?',
    back: 'Среднее $\\overline{x}$ посчитано по той же выборке: значения к нему ближе, чем к настоящему среднему, и разброс выходит заниженным. Деление на $n-1$ немного увеличивает результат и исправляет это.',
    level: B,
    source: R('vyborka-pochemu'),
  },
  {
    id: '6-n-1-l',
    task: 6,
    topic: 'vyborka',
    type: 'verno',
    front:
      'В выборке из $5$ значений для несмещённой оценки сумму квадратов отклонений делят на $5$.',
    verno: false,
    back: 'Неверно: делят на $n-1=4$.',
    level: E,
    source: K('nesmeshchennaya'),
  },
  {
    id: '6-srednee-v',
    task: 6,
    topic: 'vyborka',
    type: 'vychislenie',
    front: 'Выборка: $1$, $4$, $6$, $8$, $11$. Найдите выборочное среднее.',
    back: '$\\overline{x}=\\dfrac{1+4+6+8+11}{5}=\\dfrac{30}{5}=6$',
    otvet: '6',
    proverka: () => sum([1, 4, 6, 8, 11]) / 5,
    level: B,
    source: R('vyborka-srednee'),
  },
  {
    id: '6-nesmeshch-v',
    task: 6,
    topic: 'vyborka',
    type: 'vychislenie',
    front:
      'Выборка: $1$, $4$, $6$, $8$, $11$, её среднее $\\overline{x}=6$. Найдите несмещённую оценку дисперсии.',
    back: 'Отклонения $-5$, $-2$, $0$, $2$, $5$; квадраты $25+4+0+4+25=58$.\n$S^2=\\dfrac{58}{5-1}=14{,}5$',
    otvet: '14,5',
    proverka: () => {
      const x = [1, 4, 6, 8, 11];
      const m = sum(x) / x.length;
      return sum(x.map((v) => (v - m) ** 2)) / (x.length - 1);
    },
    level: E,
    source: K('nesmeshchennaya'),
  },

  /* ── Неравенство Чебышёва ── */
  {
    id: '6-chebyshev',
    task: 6,
    topic: 'chebyshev',
    type: 'formula',
    front:
      'Неравенство Чебышёва: оценка $P\\left(|X-\\mathrm{M}(X)|\\geqslant\\varepsilon\\right)$?',
    back: '$P\\left(|X-\\mathrm{M}(X)|\\geqslant\\varepsilon\\right)\\leqslant\\dfrac{\\mathrm{D}(X)}{\\varepsilon^2}$',
    pochemu:
      'Работает, даже когда распределение неизвестно: нужны только $\\mathrm{M}$ и $\\mathrm{D}$.',
    level: E,
    source: K('chebyshev'),
  },
  {
    id: '6-epsilon',
    task: 6,
    topic: 'chebyshev',
    type: 'svoystvo',
    front:
      '$\\mathrm{M}(X)=6$. Как записать событие «$X\\leqslant4$ или $X\\geqslant8$» через модуль? Чему равно $\\varepsilon$?',
    back: '$4=6-2$, $8=6+2$: это $|X-6|\\geqslant2$, $\\varepsilon=2$.',
    level: E,
    source: R('chebyshev-epsilon'),
  },
  {
    id: '6-chebyshev-v',
    task: 6,
    topic: 'chebyshev',
    type: 'vychislenie',
    front:
      '$\\mathrm{M}(X)=10$, $\\mathrm{D}(X)=1{,}6$. Оцените сверху по неравенству Чебышёва вероятность события «$X\\leqslant8$ или $X\\geqslant12$».',
    back: '$\\varepsilon=10-8=2$: $P\\leqslant\\dfrac{1{,}6}{2^2}=0{,}4$',
    otvet: '0,4',
    proverka: () => 1.6 / (12 - 10) ** 2,
    level: E,
    source: K('chebyshev'),
  },
  {
    id: '6-chebyshev-v2',
    task: 6,
    topic: 'chebyshev',
    type: 'vychislenie',
    front:
      '$\\mathrm{M}(X)=20$, $\\mathrm{D}(X)=2$. Оцените сверху по неравенству Чебышёва вероятность события «$X\\leqslant15$ или $X\\geqslant25$».',
    back: '$\\varepsilon=5$: $P\\leqslant\\dfrac{2}{5^2}=0{,}08$',
    otvet: '0,08',
    proverka: () => 2 / (25 - 20) ** 2,
    level: E,
    source: K('chebyshev'),
  },
  {
    id: '6-otsenka-l',
    task: 6,
    topic: 'chebyshev',
    type: 'verno',
    front: 'Неравенство Чебышёва даёт точную вероятность отклонения от среднего.',
    verno: false,
    back: 'Неверно: это **оценка сверху** — настоящая вероятность может быть и меньше. Ответ — само число $\\dfrac{\\mathrm{D}}{\\varepsilon^2}$.',
    level: B,
    source: R('chebyshev-otsenka'),
  },
  {
    id: '6-polezna',
    task: 6,
    topic: 'chebyshev',
    type: 'verno',
    front: 'При $\\varepsilon^2<\\mathrm{D}$ оценка Чебышёва ничего не говорит.',
    verno: true,
    back: 'Верно: тогда $\\dfrac{\\mathrm{D}}{\\varepsilon^2}>1$, а вероятность и так не больше $1$.',
    level: B,
    source: R('chebyshev-otsenka'),
  },
  {
    id: '6-kvadrat-l',
    task: 6,
    topic: 'chebyshev',
    type: 'verno',
    front: 'В неравенстве Чебышёва при $\\varepsilon=3$ дисперсию делят на $3$.',
    verno: false,
    back: 'Неверно: в знаменателе квадрат отклонения — делят на $3^2=9$.',
    level: E,
    source: K('chebyshev'),
  },

  /* ── Попадание в промежуток ── */
  {
    id: '6-promezhutok',
    task: 6,
    topic: 'promezhutok',
    type: 'formula',
    front: 'Как по распределению найти $P(a<X\\leqslant b)$?',
    back: '$P(a<X\\leqslant b)=\\sum_{a<x_i\\leqslant b}p_i$',
    pochemu: 'Выписываем значения из промежутка и складываем их вероятности.',
    level: B,
    source: K('promezhutok'),
  },
  {
    id: '6-strogiy',
    task: 6,
    topic: 'promezhutok',
    type: 'svoystvo',
    front: 'Входят ли значения $3$ и $6$ в $3<Y<6$? А в $3\\leqslant Y\\leqslant6$?',
    back: 'Знак $<$ — граница **не входит**: в $3<Y<6$ значения $3$ и $6$ не берём. Знак $\\leqslant$ — входит: берём.',
    level: E,
    source: R('promezhutok-znak'),
  },
  {
    id: '6-promezhutok-v',
    task: 6,
    topic: 'promezhutok',
    type: 'vychislenie',
    front:
      '$Y$ принимает значения $2$, $3$, $4$, $5$, $6$ с вероятностями $0{,}1$, $0{,}2$, $0{,}3$, $0{,}25$, $0{,}15$. Найдите $P(3<Y<6)$.',
    back: 'Подходят $4$ и $5$: $P=0{,}3+0{,}25=0{,}55$',
    otvet: '0,55',
    proverka: () => Pv([2, 3, 4, 5, 6], [0.1, 0.2, 0.3, 0.25, 0.15], (y) => 3 < y && y < 6),
    level: E,
    source: K('promezhutok'),
  },
  {
    id: '6-promezhutok-v2',
    task: 6,
    topic: 'promezhutok',
    type: 'vychislenie',
    front:
      '$Y$ принимает значения $2$, $3$, $4$, $5$, $6$ с вероятностями $0{,}1$, $0{,}2$, $0{,}3$, $0{,}25$, $0{,}15$. Найдите $P(3\\leqslant Y\\leqslant6)$.',
    back: 'Подходят $3$, $4$, $5$, $6$: $P=0{,}2+0{,}3+0{,}25+0{,}15=0{,}9$',
    otvet: '0,9',
    proverka: () => Pv([2, 3, 4, 5, 6], [0.1, 0.2, 0.3, 0.25, 0.15], (y) => 3 <= y && y <= 6),
    level: E,
    source: K('promezhutok'),
  },
  {
    id: '6-granitsa-vne',
    task: 6,
    topic: 'promezhutok',
    type: 'verno',
    front:
      'Если граница промежутка не совпадает ни с одним значением величины, строгий или нестрогий знак у неё ни на что не влияет.',
    verno: true,
    back: 'Верно: например, при значениях от $3$ события $-1\\leqslant Y$ и $-1<Y$ одинаковы.',
    level: B,
    source: R('promezhutok-znak'),
  },
];

/* ── Проверки формул: случайные распределения и выборки ── */

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '6-summa-1',
    sluchay: (rnd) => ({ poFormule: sum(raspredelenie(rnd).p), pryamo: 1 }),
  },
  {
    /* Значения 1–3 у точек диаграммы: сумма по точкам = строка таблицы распределения. */
    kartochka: '6-eiler',
    sluchay: (rnd) => {
      const { p } = raspredelenie(rnd);
      const x = p.map(() => 1 + Math.floor(rnd() * 3));
      const k = 1 + Math.floor(rnd() * 3);
      const tablica = new Map<number, number>();
      x.forEach((xi, i) => tablica.set(xi, (tablica.get(xi) ?? 0) + (p[i] ?? 0)));
      return { poFormule: Pv(x, p, (v) => v === k), pryamo: tablica.get(k) ?? 0 };
    },
  },
  {
    /* Рисунок карточки: число на обороте — сумма точек со значением 2. */
    kartochka: '6-eiler-ch',
    sluchay: () => ({
      poFormule: 0.4,
      pryamo: sum(EILER_TOCHKI.filter((t) => t.x === '2').map((t) => t.pv)),
    }),
  },
  {
    kartochka: '6-ravnovozm',
    sluchay: (rnd) => {
      const n = 1 + Math.floor(rnd() * 12);
      const x = Array.from({ length: n }, () => Math.floor(rnd() * 3));
      const m = x.filter((v) => v === 0).length;
      return { poFormule: m / n, pryamo: Pv(x, Array<number>(n).fill(1 / n), (v) => v === 0) };
    },
  },
  {
    /* Двухуровневое дерево: произведение вдоль пути — доля исходов в
       «частотном» дереве из N испытаний (N·p₁ уходят по ребру, из них p₂). */
    kartochka: '6-derevo',
    sluchay: (rnd) => {
      const p1 = rnd();
      const p2 = rnd();
      const N = 1e6;
      const poRebru = N * p1;
      return { poFormule: p1 * p2, pryamo: (poRebru * p2) / N };
    },
  },
  {
    kartochka: '6-ravnovozm-ch',
    sluchay: () => {
      const m = RAVNOVOZM_X.filter((x) => x === '3').length;
      return { poFormule: 0.5, pryamo: m / RAVNOVOZM_X.length };
    },
  },
  {
    /* Сужаем мир до B: новые вероятности p/P(B) внутри B, сумма по A. */
    kartochka: '6-uslovnaya',
    sluchay: (rnd) => {
      const { p } = raspredelenie(rnd);
      const ids = p.map((_, i) => i);
      const A = new Set(ids.filter(() => rnd() < 0.5));
      const Bs = ids.filter((i) => i === 0 || rnd() < 0.5);
      const pB = sum(Bs.map((i) => p[i] ?? 0));
      const pAB = sum(Bs.filter((i) => A.has(i)).map((i) => p[i] ?? 0));
      const novye = Bs.map((i) => ({ i, q: (p[i] ?? 0) / pB }));
      return { poFormule: pAB / pB, pryamo: sum(novye.filter((v) => A.has(v.i)).map((v) => v.q)) };
    },
  },
  {
    /* Вероятности k/N: среднее N равновозможных исходов. */
    kartochka: '6-ozhidanie',
    sluchay: (rnd) => {
      const n = 1 + Math.floor(rnd() * 5);
      const x = Array.from({ length: n }, () => Math.floor(rnd() * 21) - 10);
      const k = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 9));
      const N = sum(k);
      const iskhody = x.flatMap((xi, i) => Array<number>(k[i] ?? 0).fill(xi));
      return {
        poFormule: M(
          x,
          k.map((ki) => ki / N),
        ),
        pryamo: sum(iskhody) / N,
      };
    },
  },
  {
    kartochka: '6-loteraya',
    sluchay: (rnd) => {
      const vidy = 1 + Math.floor(rnd() * 3);
      const x = Array.from({ length: vidy }, () => 10 * (1 + Math.floor(rnd() * 100)));
      const n = Array.from({ length: vidy }, () => 1 + Math.floor(rnd() * 50));
      const N = sum(n) + Math.floor(rnd() * 500);
      const bilety = [
        ...x.flatMap((xi, i) => Array<number>(n[i] ?? 0).fill(xi)),
        ...Array<number>(N - sum(n)).fill(0),
      ];
      return {
        poFormule: sum(x.map((xi, i) => xi * (n[i] ?? 0))) / N,
        pryamo: sum(bilety) / bilety.length,
      };
    },
  },
  {
    kartochka: '6-strahovanie',
    sluchay: (rnd) => {
      const c = 100 + rnd() * 5000;
      const V = 1000 + rnd() * 1e5;
      const p = rnd() * 0.2;
      return { poFormule: c - V * p, pryamo: M([c, c - V], [1 - p, p]) };
    },
  },
  {
    /* Оба свойства разом: M(aX + c) = a·M(X) + c. */
    kartochka: '6-svoystva-M',
    sluchay: (rnd) => {
      const { x, p } = raspredelenie(rnd);
      const a = rnd() * 10 - 5;
      const c = rnd() * 10 - 5;
      return {
        poFormule: a * M(x, p) + c,
        pryamo: M(
          x.map((v) => a * v + c),
          p,
        ),
      };
    },
  },
  {
    kartochka: '6-dispersiya',
    sluchay: (rnd) => {
      const { x, p } = raspredelenie(rnd);
      const m = M(x, p);
      return {
        poFormule:
          M(
            x.map((v) => v * v),
            p,
          ) -
          m * m,
        pryamo: M(
          x.map((v) => (v - m) ** 2),
          p,
        ),
      };
    },
  },
  {
    kartochka: '6-bernulli',
    sluchay: (rnd) => {
      const q = rnd();
      const x = [0, 1];
      const p = [1 - q, q];
      const m = M(x, p);
      return {
        poFormule: q * (1 - q),
        pryamo: M(
          x.map((v) => (v - m) ** 2),
          p,
        ),
      };
    },
  },
  {
    kartochka: '6-sigma',
    sluchay: (rnd) => {
      const { x, p } = raspredelenie(rnd);
      const m = M(x, p);
      /* σ по формуле карточки (через M(X²) − M²) и корень из среднего
         квадрата отклонения — по определению дисперсии. */
      const D =
        M(
          x.map((v) => v * v),
          p,
        ) -
        m * m;
      return {
        poFormule: Math.sqrt(Math.max(0, D)),
        pryamo: Math.sqrt(
          M(
            x.map((v) => (v - m) ** 2),
            p,
          ),
        ),
      };
    },
  },
  {
    /* Среднее «на ходу»: m ← m + (x − m)/k. */
    kartochka: '6-srednee',
    sluchay: (rnd) => {
      const x = vyborka(rnd);
      let m = 0;
      x.forEach((v, i) => {
        m += (v - m) / (i + 1);
      });
      return { poFormule: sum(x) / x.length, pryamo: m };
    },
  },
  {
    /* Независимая запись: S² = Σ_{i<j}(xᵢ − xⱼ)² / (n(n − 1)). */
    kartochka: '6-nesmeshch',
    sluchay: (rnd) => {
      const x = vyborka(rnd);
      const n = x.length;
      const m = sum(x) / n;
      let pary = 0;
      for (let i = 0; i < n; i += 1)
        for (let j = i + 1; j < n; j += 1) pary += ((x[i] ?? 0) - (x[j] ?? 0)) ** 2;
      return {
        poFormule: sum(x.map((v) => (v - m) ** 2)) / (n - 1),
        pryamo: pary / (n * (n - 1)),
      };
    },
  },
  {
    /* Неравенство: 1, если настоящая вероятность не больше оценки. */
    kartochka: '6-chebyshev',
    sluchay: (rnd) => {
      const { x, p } = raspredelenie(rnd);
      const m = M(x, p);
      const D = M(
        x.map((v) => (v - m) ** 2),
        p,
      );
      const eps = 0.1 + rnd() * 8;
      const nastoyashchaya = Pv(x, p, (v) => Math.abs(v - m) >= eps);
      return { poFormule: nastoyashchaya <= D / eps ** 2 + 1e-12 ? 1 : 0, pryamo: 1 };
    },
  },
  {
    /* P(a < X ≤ b) = P(X ≤ b) − P(X ≤ a). */
    kartochka: '6-promezhutok',
    sluchay: (rnd) => {
      const { x, p } = raspredelenie(rnd);
      const a = Math.floor(rnd() * 15) - 6;
      const b = a + Math.floor(rnd() * 8);
      return {
        poFormule: Pv(x, p, (v) => a < v && v <= b),
        pryamo: Pv(x, p, (v) => v <= b) - Pv(x, p, (v) => v <= a),
      };
    },
  },
];

const KOLODA_6: Koloda = {
  task: 6,
  slug: '6',
  title: 'Случайные величины',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'raspredelenie', title: 'Случайная величина и распределение' },
    { id: 'diagrammy', title: 'Диаграммы Эйлера и деревья' },
    { id: 'uslovnaya', title: 'Условная вероятность' },
    { id: 'ozhidanie', title: 'Математическое ожидание' },
    { id: 'dispersiya', title: 'Дисперсия и стандартное отклонение' },
    { id: 'vyborka', title: 'Выборка и несмещённая оценка' },
    { id: 'chebyshev', title: 'Неравенство Чебышёва' },
    { id: 'promezhutok', title: 'Попадание в промежуток' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_6;
