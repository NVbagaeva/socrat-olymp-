/**
 * Карточки по теории задания №11 «Текстовые задачи».
 *
 * Колода идёт по разделам вкладки «Теория» №11 (content/teoriya11.ts и
 * общая теория единиц content/teoriya-edinicy.ts): как устроено задание
 * и ОДЗ, разминка и единицы, проценты, смеси, движение по прямой и
 * протяжённые тела, движение по воде и по окружности, работа,
 * прогрессии, лайфхаки. `source` — якорь страницы
 * (lib/zadanie11/teoriya-yakorya.ts): блок раздела #<раздел>-<часть>,
 * карточка раздела #t11-…, лайфхак #layfhak-…, ловушка #lovushka-…,
 * часть теории единиц #ed-…. Всё, что спрашивает колода, в теории №11
 * написано — карточек «добавлено» нет.
 *
 * Числа — свои, не задачи банка и не примеры теории. Ответ каждого
 * вычисления scripts/verify_cards пересчитывает заново (уравнение —
 * формулой корней с отбором по смыслу, движение и смеси — по таблице
 * раздела), формулы проверяет на случайных числах. Рисунки — движок
 * чертежей lib/graph без осей: трасса, тоннель, река.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { YAKOR_EDINIC } from '@/content/teoriya-edinicy';
import { YAKOR_11 } from '@/lib/zadanie11/teoriya-yakorya';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const Y = YAKOR_11.chast;
const K = YAKOR_11.kartochka;
const L = YAKOR_11.layfhak;
const LV = YAKOR_11.lovushka;
const ED = YAKOR_EDINIC;

/* ── Счёт для проверок ── */

/** Корни квадратного трёхчлена по формуле, по возрастанию. */
function korniKv(a: number, b: number, c: number): number[] {
  const D = b * b - 4 * a * c;
  if (D < -1e-12) return [];
  const s = Math.sqrt(Math.max(D, 0));
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y);
}

/** Единственный корень, подходящий по смыслу (условие `goden`), иначе NaN. */
function edinstvennyy(korni: number[], goden: (x: number) => boolean): number {
  const k = korni.filter(goden);
  return k.length === 1 ? (k[0] as number) : NaN;
}

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);
/** Целое из [lo; hi]. */
const tseloe = (rnd: () => number, lo: number, hi: number) =>
  lo + Math.floor(rnd() * (hi - lo + 1));

/* ── Рисунки: движок чертежей lib/graph, оси за краем поля ── */

/**
 * Сцена без осей: окно сдвинуто от нуля дальше поля чертежа, поэтому
 * оси и засечки движка остаются за краем рисунка.
 */
function bezOsey(
  okno: { xmin: number; xmax: number; ymin: number; ymax: number },
  shapes: unknown[],
  alt: string,
): () => Record<string, unknown> {
  return () => ({
    window: okno,
    cell: 44,
    grid: { step: 1, show: false },
    axes: { labelX: '', labelY: '', origin: '' },
    axisLabels: 'none',
    curves: [],
    points: [],
    shapes,
    alt,
  });
}

const podpis = (at: [number, number], text: string, color = 'axis', size = 16) => ({
  type: 'label',
  at,
  text,
  color,
  size,
});

/* Круговая трасса: два участника, оба едут против часовой стрелки. */
const C: [number, number] = [4.2, 3.1];
const RT = 1.5;
const naKruge = (grad: number, r = RT): [number, number] => [
  C[0] + r * Math.cos((grad * Math.PI) / 180),
  C[1] + r * Math.sin((grad * Math.PI) / 180),
];
const RIS_TRASSA = bezOsey(
  { xmin: 1.8, xmax: 7.6, ymin: 1.2, ymax: 5.0 },
  [
    { type: 'circle', at: C, radius: RT, color: 'axis', width: 2.4 },
    {
      type: 'segment',
      from: naKruge(0, RT - 0.2),
      to: naKruge(0, RT + 0.2),
      color: 'axis',
      width: 3,
    },
    podpis(naKruge(0, RT + 0.55), 'старт', 'axis', 13),
    { type: 'dot', at: naKruge(70), color: 'lineA', radius: 7 },
    podpis(naKruge(70, RT + 0.4), '1', 'lineA'),
    { type: 'dot', at: naKruge(200), color: 'lineB', radius: 7 },
    podpis(naKruge(200, RT + 0.4), '2', 'lineB'),
    {
      type: 'segment',
      from: naKruge(110, RT - 0.4),
      to: naKruge(140, RT - 0.4),
      color: 'lineA',
      arrow: true,
    },
    podpis(C, 'L', 'axis', 18),
  ],
  'Круговая трасса, отмечен старт; на трассе два участника, первый и второй, едут в одну сторону',
);

/* Поезд и тоннель: поезд длины L₁ подъезжает к тоннелю длины L₂. */
const RIS_TONNEL = bezOsey(
  { xmin: 1.4, xmax: 9.2, ymin: 1.2, ymax: 3.6 },
  [
    {
      type: 'polygon',
      points: [
        [4.6, 1.7],
        [8.2, 1.7],
        [8.2, 2.9],
        [4.6, 2.9],
      ],
      color: 'axis',
      fillOpacity: 0.12,
    },
    { type: 'segment', from: [4.6, 2.9], to: [8.2, 2.9], color: 'axis', width: 2.4 },
    { type: 'segment', from: [4.6, 1.7], to: [4.6, 2.9], color: 'axis', width: 2.4 },
    { type: 'segment', from: [8.2, 1.7], to: [8.2, 2.9], color: 'axis', width: 2.4 },
    { type: 'segment', from: [1.4, 1.7], to: [9.2, 1.7], color: 'axis', width: 2 },
    { type: 'segment', from: [1.8, 2.05], to: [4.0, 2.05], color: 'lineA', width: 10 },
    {
      type: 'segment',
      from: [4.15, 2.05],
      to: [4.45, 2.05],
      color: 'lineA',
      width: 2,
      arrow: true,
    },
    podpis([2.9, 2.6], 'L₁', 'lineA'),
    podpis([6.4, 3.25], 'L₂'),
  ],
  'Поезд подъезжает к тоннелю; подписаны длина поезда и длина тоннеля',
);

/* Река: течение слева направо, лодка плывёт справа налево. */
const RIS_REKA = bezOsey(
  { xmin: 1.4, xmax: 9.2, ymin: 1.2, ymax: 4.0 },
  [
    { type: 'segment', from: [1.4, 1.5], to: [9.2, 1.5], color: 'axis', width: 2.4 },
    { type: 'segment', from: [1.4, 3.7], to: [9.2, 3.7], color: 'axis', width: 2.4 },
    { type: 'segment', from: [2.2, 2.1], to: [4.6, 2.1], color: 'lineB', width: 2.4, arrow: true },
    podpis([3.4, 2.5], 'течение', 'lineB', 14),
    { type: 'segment', from: [8.2, 3.0], to: [5.4, 3.0], color: 'lineA', width: 3, arrow: true },
    podpis([6.8, 3.35], 'лодка', 'lineA', 14),
  ],
  'Река между двумя берегами: течение направлено вправо, лодка плывёт влево, против течения',
);

const kartochki: Kartochka[] = [
  /* ── Как устроено задание ── */
  {
    id: '11-otvet',
    task: 11,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Каким бывает ответ в задании №11? Что делать, если вышло иррациональное число?',
    back: 'Целое число или конечная десятичная дробь. Иррациональное число или бесконечная дробь — ищите ошибку.',
    level: B,
    source: YAKOR_11.razdel('kak-ustroeno'),
  },
  {
    id: '11-shagi',
    task: 11,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Семь шагов решения текстовой задачи?',
    back: '1) Выбрать переменную.\n2) Заполнить таблицу.\n3) Составить уравнение.\n4) Записать ОДЗ и условие по смыслу.\n5) Решить.\n6) Отобрать корни.\n7) Ответить именно на вопрос.',
    level: E,
    source: Y('kak-ustroeno', 'glavnoe'),
  },
  {
    id: '11-odz',
    task: 11,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Что такое ОДЗ и что она значит для уравнения с дробями?',
    back: 'Область допустимых значений — все $x$, при которых каждое выражение имеет смысл. Для дробей: **знаменатели не равны нулю**.',
    pochemu: '$\\dfrac{70}{x}-\\dfrac{70}{x+3}=3$: ОДЗ $x\\ne0$, $x\\ne-3$.',
    level: B,
    source: K('odz'),
  },
  {
    id: '11-lishnie-l',
    task: 11,
    topic: 'obshchee',
    type: 'verno',
    front:
      'После умножения обеих частей дробного уравнения на общий знаменатель корни остаются прежними — проверять их не нужно.',
    verno: false,
    back: 'Неверно: могут появиться корни, при которых знаменатель равен нулю. Каждый корень проверяем по ОДЗ.',
    level: E,
    source: K('lishnie-korni'),
  },
  {
    id: '11-lishnie-v',
    task: 11,
    topic: 'obshchee',
    type: 'vychislenie',
    front: 'Решите уравнение $\\dfrac{x^2}{x-3}=\\dfrac{9}{x-3}$.',
    back: 'ОДЗ: $x\\ne3$. $x^2=9$, $x=3$ или $x=-3$; $x=3$ не входит в ОДЗ. Ответ: $-3$.',
    otvet: '-3',
    proverka: () => edinstvennyy(korniKv(1, 0, -9), (x) => Math.abs(x - 3) > 1e-9),
    level: B,
    source: K('lishnie-korni'),
  },
  {
    id: '11-smysl-l',
    task: 11,
    topic: 'obshchee',
    type: 'verno',
    front: 'Корень, который входит в ОДЗ, всегда подходит и по смыслу задачи.',
    verno: false,
    back: 'Неверно: $x=-10$ может входить в ОДЗ, но скорость, время, масса положительны. Отбираем корни по обоим условиям.',
    level: E,
    source: K('odz-i-smysl'),
  },
  {
    id: '11-protiv-smysl',
    task: 11,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'В задаче есть скорость против течения $x-3$. Какое условие по смыслу записать?',
    back: '$x>3$: скорость против течения тоже положительна.',
    level: B,
    source: K('odz-i-smysl'),
  },
  {
    id: '11-uchastnik',
    task: 11,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Нашли $x$. Что перечитать, прежде чем записать ответ?',
    back: 'Вопрос: спрашивают первого или второго участника? Пришедшего первым или вторым? Из А в В или обратно? Проценты или килограммы?',
    level: E,
    source: LV('uchastnik'),
  },

  /* ── Разминка и единицы ── */
  {
    id: '11-proporciya-v',
    task: 11,
    topic: 'razminka',
    type: 'vychislenie',
    front: 'Цена снизилась на $20\\,\\%$ и стала $2400$ рублей. Какой была цена?',
    back: 'За $100\\,\\%$ — старая цена, новая — $80\\,\\%$: $\\dfrac{100}{80}=\\dfrac{x}{2400}$, $x=3000$.',
    otvet: '3000',
    proverka: () => (2400 * 100) / 80,
    level: B,
    source: K('proporciya'),
  },
  {
    id: '11-poyasa',
    task: 11,
    topic: 'razminka',
    type: 'svoystvo',
    front:
      'Вылет и прилёт даны по местному времени в разных часовых поясах. Как найти время в пути?',
    back: 'Сначала перевести **оба** момента в одно время, потом вычесть.',
    level: B,
    source: K('poyasa'),
  },
  {
    id: '11-avtobusy-v',
    task: 11,
    topic: 'razminka',
    type: 'vychislenie',
    front: 'В автобусе $40$ мест. Сколько автобусов нужно, чтобы перевезти $250$ человек?',
    back: '$250:40=6{,}25$ — округляем **вверх**, иначе не хватит: $7$ автобусов.',
    otvet: '7',
    proverka: () => Math.ceil(250 / 40),
    level: B,
    source: K('okruglenie'),
  },
  {
    id: '11-tetradi-l',
    task: 11,
    topic: 'razminka',
    type: 'verno',
    front:
      'Тетрадь стоит $80$ рублей. $700:80=8{,}75$, значит, на $700$ рублей можно купить $9$ тетрадей.',
    verno: false,
    back: 'Неверно: тетради на сумму округляем **вниз** — на девятую денег не хватит. Можно купить $8$ тетрадей.',
    level: E,
    source: LV('okruglenie'),
  },
  {
    id: '11-mestami-v',
    task: 11,
    topic: 'razminka',
    type: 'vychislenie',
    front: 'Найдите $16\\,\\%$ от $25$.',
    back: '$16\\,\\%$ от $25$ равно $25\\,\\%$ от $16$, то есть четверти: $4$.',
    otvet: '4',
    proverka: () => (16 * 25) / 100,
    level: B,
    source: K('procenty-mestami'),
  },
  {
    id: '11-minuty',
    task: 11,
    topic: 'razminka',
    type: 'svoystvo',
    front: '$1$ час $20$ минут — сколько это часов?',
    back: '$1+\\dfrac{20}{60}=\\dfrac43$ ч, а не $1{,}2$!',
    pochemu: 'Минуты → часы: из меньшей единицы в большую — делим на $60$.',
    level: E,
    source: LV('minuty'),
  },
  {
    id: '11-mch-v',
    task: 11,
    topic: 'razminka',
    type: 'vychislenie',
    front: 'Переведите $25$ м/с в км/ч.',
    back: 'Скорость — дробь: $\\dfrac{25\\cdot3600}{1000}=90$ км/ч.',
    pochemu: 'Метры → километры — делим на $1000$, секунды → часы — делим на $3600$.',
    otvet: '90',
    proverka: () => (25 / 1000) * 3600,
    level: B,
    source: ED('sostavnye'),
  },
  {
    id: '11-chasy-v',
    task: 11,
    topic: 'razminka',
    type: 'vychislenie',
    front: 'Сколько часов в $45$ минутах?',
    back: '$1\\text{ ч}=60\\text{ мин}$; минуты → часы: меньшая → большая, делим: $45:60=0{,}75$ ч.',
    otvet: '0,75',
    proverka: () => 45 / 60,
    level: B,
    source: ED('kak-perevodit'),
  },

  /* ── Проценты ── */
  {
    id: '11-procent-formula',
    task: 11,
    topic: 'procenty',
    type: 'formula',
    front: 'Величину увеличили или уменьшили на $p\\,\\%$. Как найти новое значение?',
    back: '$\\text{новое}=\\text{старое}\\cdot\\left(1\\pm\\dfrac{p}{100}\\right)$',
    pochemu: 'Уменьшить на $15\\,\\%$ — умножить на $0{,}85$.',
    level: B,
    source: Y('procenty', 'formula'),
  },
  {
    id: '11-sto-v',
    task: 11,
    topic: 'procenty',
    type: 'vychislenie',
    front: 'На сколько процентов $20$ меньше $50$?',
    back: 'За $100\\,\\%$ — то, с чем сравниваем, то есть $50$: $\\dfrac{50-20}{50}\\cdot100=60\\,\\%$.',
    pochemu: 'А $50$ больше $20$ на $150\\,\\%$: тогда за $100\\,\\%$ берём $20$.',
    otvet: '60',
    proverka: () => ((50 - 20) / 50) * 100,
    level: E,
    source: LV('sto'),
  },
  {
    id: '11-ne-skladyvayutsya-l',
    task: 11,
    topic: 'procenty',
    type: 'verno',
    front:
      'Товар подорожал на $15\\,\\%$, затем подешевел на $15\\,\\%$ — цена вернулась к прежней.',
    verno: false,
    back: 'Неверно: множители перемножаются, $1{,}15\\cdot0{,}85=0{,}9775$ — цена стала меньше.',
    level: E,
    source: LV('procenty'),
  },
  {
    id: '11-mnozhiteli-v',
    task: 11,
    topic: 'procenty',
    type: 'vychislenie',
    front:
      'Цену увеличили на $20\\,\\%$, затем уменьшили на $25\\,\\%$. На какое число умножилась цена?',
    back: 'Множители перемножаются: $1{,}2\\cdot0{,}75=0{,}9$.',
    otvet: '0,9',
    proverka: () => 1.2 * 0.75,
    level: B,
    source: Y('procenty', 'tablitsa'),
  },
  {
    id: '11-vremya-v',
    task: 11,
    topic: 'procenty',
    type: 'vychislenie',
    front: 'Скорость увеличили в $4$ раза, путь тот же. На сколько процентов уменьшилось время?',
    back: 'Время умножилось на $\\dfrac14=0{,}25$ — это на $75\\,\\%$ меньше.',
    otvet: '75',
    proverka: () => (1 - 1 / 4) * 100,
    level: E,
    source: Y('procenty', 'tablitsa'),
  },
  {
    id: '11-t-kvadrat',
    task: 11,
    topic: 'procenty',
    type: 'formula',
    front:
      'Акции подорожали на долю $t$, потом подешевели на ту же долю $t$. Каков итоговый множитель?',
    back: '$(1+t)(1-t)=1-t^2$',
    level: E,
    source: Y('procenty', 'glavnoe'),
  },
  {
    id: '11-akcii-v',
    task: 11,
    topic: 'procenty',
    type: 'vychislenie',
    front:
      'Акции подорожали на некоторое число процентов, потом подешевели на столько же и в итоге подешевели на $9\\,\\%$. На сколько процентов они дорожали?',
    back: '$1-t^2=0{,}91$, $t^2=0{,}09$, $t=0{,}3$ — на $30\\,\\%$.',
    otvet: '30',
    proverka: () => Math.sqrt(1 - 0.91) * 100,
    level: E,
    source: Y('procenty', 'glavnoe'),
  },
  {
    id: '11-slozhnye',
    task: 11,
    topic: 'procenty',
    type: 'formula',
    front: 'Цена каждый год умножается на $x$. На что она умножится за два года?',
    back: 'На $x^2$ — сложные проценты.',
    level: B,
    source: Y('procenty', 'glavnoe'),
  },

  /* ── Смеси и сплавы ── */
  {
    id: '11-koncentraciya',
    task: 11,
    topic: 'smesi',
    type: 'svoystvo',
    front: 'Что такое концентрация вещества в растворе?',
    back: 'Доля массы вещества в массе всего раствора, выраженная в процентах.',
    pochemu: '$20$ г сахара в $200$ г раствора: $\\dfrac{20}{200}=10\\,\\%$.',
    level: B,
    source: Y('smesi', 'opredelenie'),
  },
  {
    id: '11-p-formula',
    task: 11,
    topic: 'smesi',
    type: 'formula',
    front: 'Формула концентрации?',
    back: '$p=\\dfrac{m_{\\text{в-ва}}}{m_{\\text{р-ра}}}\\cdot100\\,\\%$',
    level: B,
    source: Y('smesi', 'formula'),
  },
  {
    id: '11-sledstviya',
    task: 11,
    topic: 'smesi',
    type: 'formula',
    front: 'Выразите из формулы концентрации массу вещества и массу раствора.',
    back: '$m_{\\text{в-ва}}=m_{\\text{р-ра}}\\cdot\\dfrac{p}{100}$, $m_{\\text{р-ра}}=\\dfrac{100\\,m_{\\text{в-ва}}}{p}$',
    level: E,
    source: Y('smesi', 'formula'),
  },
  {
    id: '11-treugolnik',
    task: 11,
    topic: 'smesi',
    type: 'svoystvo',
    front:
      'Треугольник: сверху $m_{\\text{в-ва}}$, снизу $m_{\\text{р-ра}}$ и $\\dfrac{p}{100}$. Как им пользоваться?',
    back: 'Закрой то, что ищешь: остались верх и низ — **делим**, два нижних — **умножаем**.',
    pochemu: 'Так же устроено $S=v\\cdot t$.',
    level: B,
    source: Y('smesi', 'layfhaki'),
  },
  {
    id: '11-skolko-bylo',
    task: 11,
    topic: 'smesi',
    type: 'svoystvo',
    front: 'По какой строке таблицы составляют уравнение в задачах на смеси и почему?',
    back: 'По строке **массы вещества**: при смешивании и разбавлении чистого вещества «сколько было, столько стало».',
    level: E,
    source: Y('smesi', 'opredelenie'),
  },
  {
    id: '11-voda-v',
    task: 11,
    topic: 'smesi',
    type: 'vychislenie',
    front:
      'В сосуд с $12$ л $15\\,\\%$-го раствора добавили $3$ л воды. Какой стала концентрация (в процентах)?',
    back: 'Вещества $0{,}15\\cdot12=1{,}8$ л, раствора стало $15$ л: $\\dfrac{1{,}8}{15}\\cdot100=12\\,\\%$.',
    otvet: '12',
    proverka: () => ((0.15 * 12 + 0) / (12 + 3)) * 100,
    level: B,
    source: Y('smesi', 'tablitsa'),
  },
  {
    id: '11-ravnye-massy',
    task: 11,
    topic: 'smesi',
    type: 'formula',
    front:
      'Смешали **равные** массы растворов концентрации $x\\,\\%$ и $y\\,\\%$. Концентрация смеси?',
    back: '$z=\\dfrac{x+y}{2}$ — среднее арифметическое.',
    pochemu: 'Масса $m$ в уравнении по веществу сокращается.',
    level: E,
    source: Y('smesi', 'tablitsa'),
  },
  {
    id: '11-ravnye-v',
    task: 11,
    topic: 'smesi',
    type: 'vychislenie',
    front:
      'Смешали равные массы $23\\,\\%$-го и $15\\,\\%$-го растворов кислоты. Какова концентрация смеси (в процентах)?',
    back: 'Равные массы — среднее арифметическое: $\\dfrac{23+15}{2}=19\\,\\%$.',
    otvet: '19',
    proverka: () => {
      const m = 7;
      return ((0.23 * m + 0.15 * m) / (2 * m)) * 100;
    },
    level: B,
    source: L('equal-mass-average'),
  },
  {
    id: '11-suhoe-v',
    task: 11,
    topic: 'smesi',
    type: 'vychislenie',
    front:
      'Свежие фрукты содержат $90\\,\\%$ воды, высушенные — $5\\,\\%$. Сколько кг свежих фруктов нужно на $20$ кг высушенных?',
    back: 'Сухого вещества $10\\,\\%$ и $95\\,\\%$, его масса не меняется: $0{,}1x=0{,}95\\cdot20$, $x=190$ кг.',
    otvet: '190',
    proverka: () => (0.95 * 20) / 0.1,
    level: E,
    source: L('dry-matter'),
  },
  {
    id: '11-chistoe-l',
    task: 11,
    topic: 'smesi',
    type: 'verno',
    front: 'Если в раствор добавили чистое вещество, в таблице у него концентрация $0\\,\\%$.',
    verno: false,
    back: 'Неверно: у чистого вещества концентрация $100\\,\\%$, в строке массы вещества — вся его масса. $0\\,\\%$ — у воды.',
    level: B,
    source: Y('smesi', 'glavnoe'),
  },

  /* ── Движение по прямой и протяжённые тела ── */
  {
    id: '11-svt',
    task: 11,
    topic: 'dvizhenie',
    type: 'formula',
    front: 'Главная формула движения? Какие столбцы у таблицы?',
    back: '$S=v\\cdot t$; таблица $S\\mid v\\mid t$, время $t=\\dfrac{S}{v}$.',
    level: B,
    source: Y('pryamaya', 'formula'),
  },
  {
    id: '11-raznica',
    task: 11,
    topic: 'dvizhenie',
    type: 'svoystvo',
    front: 'Велосипедист тратит на путь больше времени, чем автомобилист. Как составить уравнение?',
    back: '**Из большего вычитаем меньшее — получаем разницу**: $\\dfrac{S}{x}-\\dfrac{S}{x+d}=\\Delta t$.',
    level: E,
    source: Y('pryamaya', 'tablitsa'),
  },
  {
    id: '11-srednyaya',
    task: 11,
    topic: 'dvizhenie',
    type: 'formula',
    front: 'Средняя скорость? Чему она равна для двух равных половин пути?',
    back: '$v_{\\text{ср}}=\\dfrac{S_1+S_2}{t_1+t_2}$ — весь путь на всё время; для равных половин пути $v_{\\text{ср}}=\\dfrac{2v_1v_2}{v_1+v_2}$.',
    level: E,
    source: Y('pryamaya', 'glavnoe'),
  },
  {
    id: '11-srednyaya-v',
    task: 11,
    topic: 'dvizhenie',
    type: 'vychislenie',
    front:
      'Первую половину пути машина ехала со скоростью $30$ км/ч, вторую — $60$ км/ч. Найдите среднюю скорость.',
    back: '$v_{\\text{ср}}=\\dfrac{2\\cdot30\\cdot60}{30+60}=40$ км/ч.',
    otvet: '40',
    proverka: () => {
      const S = 120;
      return S / (S / 2 / 30 + S / 2 / 60);
    },
    level: E,
    source: Y('pryamaya', 'glavnoe'),
  },
  {
    id: '11-srednyaya-l',
    task: 11,
    topic: 'dvizhenie',
    type: 'verno',
    front: 'Средняя скорость всегда равна среднему арифметическому скоростей на участках.',
    verno: false,
    back: 'Неверно: весь путь делим на всё время. Среднее арифметическое подходит, только если равны **промежутки времени**.',
    level: B,
    source: LV('srednyaya'),
  },
  {
    id: '11-navstrechu',
    task: 11,
    topic: 'dvizhenie',
    type: 'svoystvo',
    front: 'Что происходит со скоростями при встречном движении и при движении вдогонку?',
    back: 'Навстречу — скорости **складываются**, вдогонку (в одном направлении) — **вычитаются**.',
    level: B,
    source: Y('pryamaya', 'glavnoe'),
  },
  {
    id: '11-tonnel-ch',
    task: 11,
    topic: 'dvizhenie',
    type: 'chertezh',
    front:
      'Поезд длины $L_1$ проходит тоннель длины $L_2$. Какой путь он проходит целиком? А мимо столба?',
    back: 'Через тоннель: $S=L_1+L_2$. Мимо столба: $S=L_1$ — длина поезда.',
    pochemu: 'Поезд — не точка: от входа головы до выхода хвоста.',
    figure: { dvizhok: 'graph', scena: RIS_TONNEL },
    level: E,
    source: Y('protyazhennye', 'formula'),
  },
  {
    id: '11-stolb-v',
    task: 11,
    topic: 'dvizhenie',
    type: 'vychislenie',
    front:
      'Поезд, двигаясь со скоростью $72$ км/ч, проходит мимо столба за $40$ с. Найдите длину поезда в метрах.',
    back: '$72$ км/ч $=\\dfrac{72\\cdot1000}{3600}=20$ м/с; мимо столба путь — длина поезда: $20\\cdot40=800$ м.',
    otvet: '800',
    proverka: () => ((72 * 1000) / 3600) * 40,
    level: B,
    source: Y('protyazhennye', 'glavnoe'),
  },
  {
    id: '11-poezda-v',
    task: 11,
    topic: 'dvizhenie',
    type: 'vychislenie',
    front:
      'Поезда идут навстречу со скоростями $60$ и $48$ км/ч. Пассажирский длиной $450$ м, скорый прошёл мимо него за $40$ с. Найдите длину скорого (в метрах).',
    back: 'Навстречу: $108$ км/ч $=30$ м/с. $x+450=30\\cdot40=1200$, $x=750$ м.',
    otvet: '750',
    proverka: () => (((60 + 48) * 1000) / 3600) * 40 - 450,
    level: E,
    source: Y('protyazhennye', 'tablitsa'),
  },

  /* ── Движение по воде ── */
  {
    id: '11-techenie',
    task: 11,
    topic: 'voda',
    type: 'formula',
    front: 'Собственная скорость $x$, течение $v_{\\text{теч.}}$. Скорость по течению и против?',
    back: '$v_{\\text{по теч.}}=x+v_{\\text{теч.}}$, $v_{\\text{против теч.}}=x-v_{\\text{теч.}}$',
    level: B,
    source: Y('voda', 'formula'),
  },
  {
    id: '11-reka-ch',
    task: 11,
    topic: 'voda',
    type: 'chertezh',
    front:
      'Течение направлено по стрелке, лодка плывёт против него. С какой скоростью она движется относительно берега?',
    back: '$x-v_{\\text{теч.}}$, где $x$ — собственная скорость лодки (в неподвижной воде).',
    figure: { dvizhok: 'graph', scena: RIS_REKA },
    level: B,
    source: Y('voda', 'formula'),
  },
  {
    id: '11-protiv-v',
    task: 11,
    topic: 'voda',
    type: 'vychislenie',
    front:
      'Собственная скорость теплохода $18$ км/ч, скорость течения $3$ км/ч. За сколько часов он пройдёт $60$ км против течения?',
    back: 'Против течения: $18-3=15$ км/ч, $t=\\dfrac{60}{15}=4$ ч.',
    otvet: '4',
    proverka: () => 60 / (18 - 3),
    level: B,
    source: Y('voda', 'formula'),
  },
  {
    id: '11-plot-l',
    task: 11,
    topic: 'voda',
    type: 'verno',
    front: 'Плот не имеет своей скорости, поэтому по реке он не движется.',
    verno: false,
    back: 'Неверно: плот плывёт со скоростью течения. А на озере течения нет — скорость лодки одна и та же в обе стороны.',
    level: E,
    source: LV('plot'),
  },
  {
    id: '11-stoyanka-v',
    task: 11,
    topic: 'voda',
    type: 'vychislenie',
    front:
      'Теплоход вышел в $9{:}00$, вернулся в $19{:}00$, стоянка длилась $3$ часа. Сколько часов он был в движении?',
    back: 'Всего $10$ ч, минус стоянка: $10-3=7$ ч.',
    otvet: '7',
    proverka: () => 19 - 9 - 3,
    level: B,
    source: Y('voda', 'glavnoe'),
  },

  /* ── Движение по окружности ── */
  {
    id: '11-obgon',
    task: 11,
    topic: 'okruzhnost',
    type: 'formula',
    front: 'Первый в $n$-й раз обгоняет второго на круге длины $L$. Как связаны их пути?',
    back: '$S_1-S_2=n\\cdot L$',
    pochemu: 'Обогнать на круг — проехать на длину круга больше.',
    level: E,
    source: Y('okruzhnost', 'formula'),
  },
  {
    id: '11-trassa-ch',
    task: 11,
    topic: 'okruzhnost',
    type: 'chertezh',
    front:
      'Двое стартуют из одной точки круговой трассы длины $L$ в одну сторону. Когда быстрый впервые догонит медленного?',
    back: 'Когда проедет на **один круг** больше: $S_1-S_2=L$, то есть $(v_1-v_2)t=L$.',
    figure: { dvizhok: 'graph', scena: RIS_TRASSA },
    level: B,
    source: Y('okruzhnost', 'formula'),
  },
  {
    id: '11-krug-v',
    task: 11,
    topic: 'okruzhnost',
    type: 'vychislenie',
    front:
      'Длина круга $15$ км. Первый едет со скоростью $80$ км/ч и через $45$ минут опережает второго на круг. Найдите скорость второго.',
    back: '$45$ мин $=\\dfrac34$ ч. $\\dfrac34(80-x)=15$, $80-x=20$, $x=60$ км/ч.',
    otvet: '60',
    proverka: () => 80 - 15 / (45 / 60),
    level: B,
    source: Y('okruzhnost', 'tablitsa'),
  },
  {
    id: '11-sblizhenie-v',
    task: 11,
    topic: 'okruzhnost',
    type: 'vychislenie',
    front:
      'Через $20$ минут после старта один бегун опередил другого на круг длиной $0{,}8$ км. Найдите разность их скоростей (км/ч).',
    back: '$20$ мин $=\\dfrac13$ ч; разность скоростей $0{,}8:\\dfrac13=2{,}4$ км/ч.',
    otvet: '2,4',
    proverka: () => 0.8 / (20 / 60),
    level: E,
    source: L('closing-speed'),
  },

  /* ── Работа ── */
  {
    id: '11-apt',
    task: 11,
    topic: 'rabota',
    type: 'formula',
    front: 'Главная формула задач на работу? Что берём за переменную?',
    back: '$A=p\\cdot t$; переменная — производительность $p$ (работа за единицу времени), таблица $A\\mid p\\mid t$.',
    level: B,
    source: Y('rabota', 'formula'),
  },
  {
    id: '11-za-edinicu',
    task: 11,
    topic: 'rabota',
    type: 'svoystvo',
    front: 'Объём работы в условии не дан. Что делать?',
    back: 'Принять всю работу за $1$ и написать это в решении.',
    level: B,
    source: Y('rabota', 'glavnoe'),
  },
  {
    id: '11-vmeste',
    task: 11,
    topic: 'rabota',
    type: 'formula',
    front: 'Двое выполняют работу за $t_1$ и $t_2$ часов. За сколько они сделают её вместе?',
    back: 'Производительности складываются: $\\dfrac{1}{t_1}+\\dfrac{1}{t_2}$; время $t=1:\\left(\\dfrac{1}{t_1}+\\dfrac{1}{t_2}\\right)$.',
    level: E,
    source: Y('rabota', 'tablitsa'),
  },
  {
    id: '11-vmeste-v',
    task: 11,
    topic: 'rabota',
    type: 'vychislenie',
    front:
      'Один мастер выполняет заказ за $12$ часов, другой — за $6$. За сколько часов они выполнят его вместе?',
    back: '$\\dfrac{1}{12}+\\dfrac16=\\dfrac14$, вместе — за $4$ часа.',
    otvet: '4',
    proverka: () => 1 / (1 / 12 + 1 / 6),
    level: B,
    source: Y('rabota', 'tablitsa'),
  },
  {
    id: '11-troe',
    task: 11,
    topic: 'rabota',
    type: 'svoystvo',
    front: 'Трое работают попарно, известно время каждой пары. Как найти время всех троих вместе?',
    back: 'Сложить три уравнения: получится $2(x+y+z)$ — находим $x+y+z$ целиком, по отдельности производительности не нужны.',
    level: E,
    source: Y('rabota', 'glavnoe'),
  },
  {
    id: '11-troe-v',
    task: 11,
    topic: 'rabota',
    type: 'vychislenie',
    front:
      'Первый и второй рабочие вместе делают работу за $12$ дней, второй и третий — за $15$, первый и третий — за $20$. За сколько дней сделают её все трое?',
    back: '$2(x+y+z)=\\dfrac{1}{12}+\\dfrac{1}{15}+\\dfrac{1}{20}=\\dfrac15$, $x+y+z=\\dfrac{1}{10}$ — за $10$ дней.',
    otvet: '10',
    proverka: () => {
      /* Производительности по отдельности — решение системы, потом сумма. */
      const s = (1 / 12 + 1 / 15 + 1 / 20) / 2;
      const x = s - 1 / 15;
      const y = s - 1 / 20;
      const z = s - 1 / 12;
      return Math.abs(x + y - 1 / 12) < 1e-12 && Math.abs(y + z - 1 / 15) < 1e-12
        ? 1 / (x + y + z)
        : NaN;
    },
    level: E,
    source: Y('rabota', 'glavnoe'),
  },

  /* ── Прогрессии ── */
  {
    id: '11-summa',
    task: 11,
    topic: 'progressii',
    type: 'formula',
    front: 'Сумма первых $n$ членов арифметической прогрессии?',
    back: '$S_n=\\dfrac{(a_1+a_n)\\cdot n}{2}$',
    pochemu: '«Каждый день на одно и то же больше» — арифметическая прогрессия.',
    level: B,
    source: Y('progressii', 'formula'),
  },
  {
    id: '11-ulitka-v',
    task: 11,
    topic: 'progressii',
    type: 'vychislenie',
    front:
      'Улитка в первый день проползла $2$ м, в последний — $18$ м, каждый день на одно и то же больше; всего $120$ м. Сколько дней она ползла?',
    back: '$\\dfrac{(2+18)\\cdot n}{2}=120$, $10n=120$, $n=12$.',
    otvet: '12',
    proverka: () => {
      /* Перебор: прогрессия от 2 до 18 за n дней даёт сумму 120. */
      for (let n = 2; n < 200; n += 1) {
        const d = (18 - 2) / (n - 1);
        let s = 0;
        for (let i = 0; i < n; i += 1) s += 2 + d * i;
        if (Math.abs(s - 120) < 1e-9) return n;
      }
      return NaN;
    },
    level: B,
    source: Y('progressii', 'glavnoe'),
  },
  {
    id: '11-an-v',
    task: 11,
    topic: 'progressii',
    type: 'vychislenie',
    front: 'Арифметическая прогрессия: $a_1=3$, $n=10$, $S_{10}=210$. Найдите $a_{10}$.',
    back: '$\\dfrac{(3+a_{10})\\cdot10}{2}=210$, $3+a_{10}=42$, $a_{10}=39$.',
    otvet: '39',
    proverka: () => {
      const d = (39 - 3) / 9;
      let s = 0;
      for (let i = 0; i < 10; i += 1) s += 3 + d * i;
      return Math.abs(s - 210) < 1e-9 ? 3 + 9 * d : NaN;
    },
    level: B,
    source: Y('progressii', 'glavnoe'),
  },

  /* ── Лайфхаки ── */
  {
    id: '11-podbor',
    task: 11,
    topic: 'layfhaki',
    type: 'svoystvo',
    front:
      'Где искать целый корень дробного уравнения в текстовой задаче? Что обязательно после подбора?',
    back: 'Среди делителей числа из условия. После подбора — **проверка подстановкой** и обоснование, что других подходящих корней нет (например, по теореме Виета).',
    level: E,
    source: L('root-guess'),
  },
  {
    id: '11-podbor-l',
    task: 11,
    topic: 'layfhaki',
    type: 'verno',
    front: 'Подобрали корень $x=7$ и проверили подстановкой — решение закончено.',
    verno: false,
    back: 'Неверно: нужно ещё показать, что других подходящих корней нет — например, второй корень по Виету отрицателен. Без этого подбор — не решение.',
    level: E,
    source: L('root-guess'),
  },
  {
    id: '11-shablon',
    task: 11,
    topic: 'layfhaki',
    type: 'formula',
    front: 'К какому виду сводится уравнение $\\dfrac{S}{x}-\\dfrac{S}{x+d}=d$?',
    back: '$x(x+d)=S$: ищем два множителя числа $S$, которые отличаются на $d$.',
    level: E,
    source: L('x-x-plus-d'),
  },
  {
    id: '11-shablon-v',
    task: 11,
    topic: 'layfhaki',
    type: 'vychislenie',
    front: 'Решите $\\dfrac{90}{x}-\\dfrac{90}{x+1}=1$, если $x>0$.',
    back: '$x(x+1)=90=9\\cdot10$, $x=9$. Второй корень по Виету $-10<0$.',
    otvet: '9',
    proverka: () => edinstvennyy(korniKv(1, 1, -90), (x) => x > 0),
    level: B,
    source: L('x-x-plus-d'),
  },
  {
    id: '11-sokrati',
    task: 11,
    topic: 'layfhaki',
    type: 'svoystvo',
    front:
      'Все числа уравнения $\\dfrac{108}{x-3}-\\dfrac{108}{x}=3$ делятся на $3$. Что сделать до раскрытия скобок?',
    back: 'Сократить: $\\dfrac{36}{x-3}-\\dfrac{36}{x}=1$ — числа маленькие, ошибок меньше.',
    level: B,
    source: L('divide-equation'),
  },
  {
    id: '11-zamena-v',
    task: 11,
    topic: 'layfhaki',
    type: 'vychislenie',
    front:
      'Уравнение $y^2+30y-4000=0$. Сделайте замену $y=10z$ и найдите положительный корень $y$.',
    back: '$100z^2+300z-4000=0$, $z^2+3z-40=0$, $z=5$, $y=50$.',
    otvet: '50',
    proverka: () => edinstvennyy(korniKv(1, 30, -4000), (y) => y > 0),
    level: B,
    source: L('substitution'),
  },
  {
    id: '11-raznost-v',
    task: 11,
    topic: 'layfhaki',
    type: 'vychislenie',
    front: 'Вычислите $62^2-38^2$ без столбика.',
    back: 'Разность квадратов: $(62-38)(62+38)=24\\cdot100=2400$.',
    otvet: '2400',
    proverka: () => 62 * 62 - 38 * 38,
    level: B,
    source: L('fast-count'),
  },
  {
    id: '11-na-pyat-v',
    task: 11,
    topic: 'layfhaki',
    type: 'vychislenie',
    front: 'Вычислите $85^2$ в уме.',
    back: '$8\\cdot9=72$ и приписываем $25$: $7225$.',
    otvet: '7225',
    proverka: () => 85 * 85,
    level: B,
    source: L('fast-count'),
  },
];

/* ── Проверки формул на случайных числах ── */

const proverki: ProverkaFormuly[] = [
  {
    /* Увеличение на p % — прибавить p сотых старого значения. */
    kartochka: '11-procent-formula',
    sluchay: (rnd) => {
      const a = ot(rnd, 1, 1000);
      const p = ot(rnd, 0, 99);
      const zn = rnd() < 0.5 ? 1 : -1;
      return { poFormule: a * (1 + (zn * p) / 100), pryamo: a + (zn * a * p) / 100 };
    },
  },
  {
    kartochka: '11-t-kvadrat',
    sluchay: (rnd) => {
      const a = ot(rnd, 1, 1000);
      const t = ot(rnd, 0, 0.99);
      const posle = a * (1 + t) * (1 - t);
      return { poFormule: a * (1 - t * t), pryamo: posle };
    },
  },
  {
    /* Два года подряд по множителю x — то же, что x². */
    kartochka: '11-slozhnye',
    sluchay: (rnd) => {
      const a = ot(rnd, 1, 1000);
      const x = ot(rnd, 0.5, 1.5);
      return { poFormule: a * x ** 2, pryamo: a * x * x };
    },
  },
  {
    /* Концентрация — доля вещества: вещество и вода отдельными слоями. */
    kartochka: '11-p-formula',
    sluchay: (rnd) => {
      const veshch = ot(rnd, 0.1, 50);
      const voda = ot(rnd, 0, 200);
      return {
        poFormule: (veshch / (veshch + voda)) * 100,
        pryamo: 100 - (voda / (veshch + voda)) * 100,
      };
    },
  },
  {
    /* Выраженные массы подставляем обратно в формулу концентрации. */
    kartochka: '11-sledstviya',
    sluchay: (rnd) => {
      const mr = ot(rnd, 1, 200);
      const p = ot(rnd, 1, 100);
      const mv = mr * (p / 100);
      return { poFormule: (100 * mv) / p + (mv / mr) * 100, pryamo: mr + p };
    },
  },
  {
    /* Равные массы: концентрация смеси по строке массы вещества. */
    kartochka: '11-ravnye-massy',
    sluchay: (rnd) => {
      const m = ot(rnd, 0.1, 100);
      const x = ot(rnd, 0, 100);
      const y = ot(rnd, 0, 100);
      return { poFormule: (x + y) / 2, pryamo: (((x / 100) * m + (y / 100) * m) / (2 * m)) * 100 };
    },
  },
  {
    kartochka: '11-svt',
    sluchay: (rnd) => {
      const v = ot(rnd, 0.5, 200);
      const t = ot(rnd, 0.1, 20);
      const S = v * t;
      return { poFormule: S / v, pryamo: t };
    },
  },
  {
    /* Обе формулы: весь путь на всё время и случай равных половин пути. */
    kartochka: '11-srednyaya',
    sluchay: (rnd) => {
      const v1 = ot(rnd, 1, 120);
      const v2 = ot(rnd, 1, 120);
      const S = ot(rnd, 1, 500);
      const t1 = S / 2 / v1;
      const t2 = S / 2 / v2;
      return { poFormule: (2 * v1 * v2) / (v1 + v2), pryamo: S / (t1 + t2) };
    },
  },
  {
    /* Путь относительно берега: собственный путь плюс снос течением. */
    kartochka: '11-techenie',
    sluchay: (rnd) => {
      const x = ot(rnd, 5, 40);
      const w = ot(rnd, 0.5, 4.9);
      const t = ot(rnd, 0.1, 10);
      const po = x * t + w * t;
      const protiv = x * t - w * t;
      return { poFormule: (x + w) * t + (x - w) * t, pryamo: po + protiv };
    },
  },
  {
    /* Пошаговое движение: момент n-го обгона — разница путей n кругов. */
    kartochka: '11-obgon',
    sluchay: (rnd) => {
      const L = ot(rnd, 0.5, 30);
      const v2 = ot(rnd, 5, 100);
      const v1 = v2 + ot(rnd, 1, 50);
      const n = tseloe(rnd, 1, 6);
      /* Момент, когда первый в n-й раз поравнялся со вторым: ищем по
         числу кругов, на которое первый ушёл вперёд (пол разницы путей). */
      let lo = 0;
      let hi = (n * L) / (v1 - v2) + 10;
      for (let i = 0; i < 200; i += 1) {
        const mid = (lo + hi) / 2;
        if (Math.floor(((v1 - v2) * mid) / L + 1e-12) >= n) hi = mid;
        else lo = mid;
      }
      return { poFormule: n * L, pryamo: v1 * hi - v2 * hi };
    },
  },
  {
    /* Работа копится по часам: за каждый промежуток — p · Δt. */
    kartochka: '11-apt',
    sluchay: (rnd) => {
      const p = ot(rnd, 0.01, 50);
      const t = ot(rnd, 0.1, 40);
      const n = tseloe(rnd, 1, 50);
      let A = 0;
      for (let i = 0; i < n; i += 1) A += p * (t / n);
      return { poFormule: p * t, pryamo: A };
    },
  },
  {
    /* Вместе: за время t каждый сделал свою долю, доли дают всю работу. */
    kartochka: '11-vmeste',
    sluchay: (rnd) => {
      const t1 = ot(rnd, 0.5, 60);
      const t2 = ot(rnd, 0.5, 60);
      const t = 1 / (1 / t1 + 1 / t2);
      return { poFormule: t / t1 + t / t2, pryamo: 1 };
    },
  },
  {
    kartochka: '11-summa',
    sluchay: (rnd) => {
      const a1 = ot(rnd, -50, 50);
      const d = ot(rnd, -10, 10);
      const n = tseloe(rnd, 1, 60);
      let s = 0;
      for (let i = 0; i < n; i += 1) s += a1 + d * i;
      return { poFormule: ((a1 + (a1 + d * (n - 1))) * n) / 2, pryamo: s };
    },
  },
  {
    /* Корень шаблона x(x + d) = S подставляем в исходное уравнение. */
    kartochka: '11-shablon',
    sluchay: (rnd) => {
      const d = ot(rnd, 0.5, 20);
      const S = ot(rnd, 1, 2000);
      const x = (-d + Math.sqrt(d * d + 4 * S)) / 2;
      return { poFormule: S / x - S / (x + d), pryamo: d };
    },
  },
];

const KOLODA_11: Koloda = {
  task: 11,
  slug: '11',
  title: 'Текстовые задачи',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'obshchee', title: 'Как устроено задание и ОДЗ' },
    { id: 'razminka', title: 'Разминка и единицы' },
    { id: 'procenty', title: 'Проценты' },
    { id: 'smesi', title: 'Смеси и сплавы' },
    { id: 'dvizhenie', title: 'Движение по прямой' },
    { id: 'voda', title: 'Движение по воде' },
    { id: 'okruzhnost', title: 'Движение по окружности' },
    { id: 'rabota', title: 'Работа' },
    { id: 'progressii', title: 'Прогрессии' },
    { id: 'layfhaki', title: 'Лайфхаки' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_11;
