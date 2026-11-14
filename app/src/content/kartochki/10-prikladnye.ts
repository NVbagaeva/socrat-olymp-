/**
 * Карточки по теории задания №10 «Задачи с прикладным содержанием».
 *
 * Колода идёт по разделам вкладки «Теория» №10 (content/teoriya10.ts и
 * общая теория единиц content/teoriya-edinicy.ts): алгоритм, единицы и
 * степени десяти, дробные уравнения, квадратные зависимости, степени и
 * корни, распад и логарифм, тригонометрия, «Физика в двух словах»,
 * ловушки. `source` — якорь страницы (lib/zadanie10/teoriya-yakorya.ts):
 * рамка, таблица или ловушка #t10-…, карточка сюжета #fizika-…, часть
 * теории единиц #ed-…. Всё, что спрашивает колода, в теории №10
 * написано — карточек «добавлено» нет.
 *
 * Числа — свои, не задачи банка. Ответ каждого вычисления
 * scripts/verify_cards пересчитывает заново (корни — формулой, выбор
 * корня — по тому же правилу, что в теории), формулы проверяет на
 * случайных числах. Рисунки — мост движка №10 (lib/zadanie10/chertezh)
 * и графики движка чертежей lib/graph.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { YAKOR_EDINIC } from '@/content/teoriya-edinicy';
import { YAKOR_10 } from '@/lib/zadanie10/teoriya-yakorya';
import { nomerRazdela } from '@/content/struktura';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const R = YAKOR_10.blok;
const F = YAKOR_10.fizika;
const ED = YAKOR_EDINIC;

/* ── Счёт для проверок ── */

/** Корни квадратного трёхчлена по формуле, по возрастанию (D ≥ 0). */
function korniKv(a: number, b: number, c: number): number[] {
  const D = b * b - 4 * a * c;
  if (D < -1e-12) return [];
  const s = Math.sqrt(Math.max(D, 0));
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((x, y) => x - y);
}

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);
/** Целое из [lo; hi]. */
const tseloe = (rnd: () => number, lo: number, hi: number) =>
  lo + Math.floor(rnd() * (hi - lo + 1));
const GRAD = Math.PI / 180;

/* ── Рисунки: движок чертежей lib/graph ── */

type Tochka = [number, number];

/** Кривая ломаной из отрезков: движок рисует фигуры, а не произвольные функции. */
function krivaya(f: (x: number) => number, x0: number, x1: number, n = 48) {
  const out: unknown[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = x0 + ((x1 - x0) * i) / n;
    const b = x0 + ((x1 - x0) * (i + 1)) / n;
    out.push({ type: 'segment', from: [a, f(a)], to: [b, f(b)], color: 'lineA', width: 3 });
  }
  return out;
}

function scena(
  okno: { xmin: number; xmax: number; ymin: number; ymax: number },
  osi: { x: string; y: string },
  shapes: unknown[],
  ticks: { x?: { at: number; label?: string }[]; y?: { at: number; label?: string }[] },
  alt: string,
): () => Record<string, unknown> {
  return () => ({
    window: okno,
    cell: 46,
    grid: { step: 1, show: false },
    axes: { labelX: osi.x, labelY: osi.y, origin: '0', ticks },
    axisLabels: 'none',
    curves: [],
    points: [],
    shapes,
    alt,
  });
}

const tochka = (at: Tochka) => ({ type: 'dot', at, color: 'lineB', radius: 5.5 });
const punktir = (from: Tochka, to: Tochka) => ({
  type: 'segment',
  from,
  to,
  color: 'accent',
  style: 'dashed',
  width: 2,
});

/* Мяч: h = 0,6 + 3,2x − 0,8x², отметка на высоте 2,6 — корни 2 ∓ √1,5. */
const myach = (x: number) => 0.6 + 3.2 * x - 0.8 * x * x;
const [M1, M2] = korniKv(-0.8, 3.2, 0.6 - 2.6) as [number, number];
const RIS_MYACH = scena(
  { xmin: -0.6, xmax: 4.6, ymin: -0.6, ymax: 4.4 },
  { x: 't', y: 'h' },
  [
    punktir([0, 2.6], [4.3, 2.6]),
    ...krivaya(myach, 0, 4.12),
    { type: 'segment', from: [M1, 0], to: [M2, 0], color: 'lineB', width: 5 },
    punktir([M1, 0], [M1, 2.6]),
    punktir([M2, 0], [M2, 2.6]),
    tochka([M1, 2.6]),
    tochka([M2, 2.6]),
  ],
  {
    x: [
      { at: M1, label: 't₁' },
      { at: M2, label: 't₂' },
    ],
    y: [{ at: 2.6, label: 'H' }],
  },
  'Парабола высоты мяча h от времени t и пунктир на высоте H; парабола пересекает его в моменты t₁ и t₂, промежуток между ними выделен на оси времени',
);

/* Выручка: r = 3,6x − 0,8x² (ветви вниз), уровень 2,4 — корни 1 и 3,5. */
const vyruchka = (x: number) => 3.6 * x - 0.8 * x * x;
const [V1, V2] = korniKv(-0.8, 3.6, -2.4) as [number, number];
const RIS_VYRUCHKA = scena(
  { xmin: -0.6, xmax: 5.2, ymin: -0.6, ymax: 4.6 },
  { x: 'p', y: 'r' },
  [
    punktir([0, 2.4], [4.9, 2.4]),
    ...krivaya(vyruchka, 0, 4.5),
    { type: 'segment', from: [V1, 0], to: [V2, 0], color: 'lineB', width: 5 },
    punktir([V1, 0], [V1, 2.4]),
    punktir([V2, 0], [V2, 2.4]),
    tochka([V1, 2.4]),
    tochka([V2, 2.4]),
  ],
  {
    x: [
      { at: V1, label: 'p₁' },
      { at: V2, label: 'p₂' },
    ],
    y: [{ at: 2.4, label: '100' }],
  },
  'Парабола выручки r от цены p ветвями вниз и пунктир на уровне 100; парабола не ниже пунктира между ценами p₁ и p₂',
);

/* Распад: m = 4 · 2^(−x), T — одна клетка; отмечены T, 2T, 3T. */
const raspad = (x: number) => 4 * 2 ** -x;
const RIS_RASPAD = scena(
  { xmin: -0.6, xmax: 4.6, ymin: -0.6, ymax: 5.2 },
  { x: 't', y: 'm' },
  [
    ...krivaya(raspad, 0, 4.3),
    ...[1, 2, 3].flatMap((k) => [
      punktir([k, 0], [k, raspad(k)]),
      punktir([0, raspad(k)], [k, raspad(k)]),
      tochka([k, raspad(k)]),
    ]),
    tochka([0, 4]),
  ],
  {
    x: [
      { at: 1, label: 'T' },
      { at: 2, label: '2T' },
      { at: 3, label: '3T' },
    ],
    y: [
      { at: 4, label: 'm₀' },
      { at: 2, label: '' },
      { at: 1, label: '' },
      { at: 0.5, label: '' },
    ],
  },
  'Кривая распада: масса m убывает от m₀; отмечены моменты T, 2T и 3T и масса в эти моменты',
);

/* Мост: цепь y = 0,005x² − 0,8x + 40, ванта в 60 м от пилона. */
const MOST = { a: 0.005, b: -0.8, c: 40, x: 60 };

const kartochki: Kartochka[] = [
  /* ── Как решать прикладную задачу ── */
  {
    id: '10-algoritm',
    task: 10,
    topic: 'algoritm',
    type: 'svoystvo',
    front: 'Шесть шагов решения прикладной задачи?',
    back: '1) Что дано — таблицей.\n2) Что ищем и что подставляем.\n3) Решаем уравнение или неравенство.\n4) Выбираем корень по смыслу.\n5) Переводим единицы.\n6) Проверка здравым смыслом.',
    level: E,
    source: R('algoritm'),
  },
  {
    id: '10-fizika-l',
    task: 10,
    topic: 'algoritm',
    type: 'verno',
    front: `Чтобы решить задачу №${nomerRazdela('prikladnye-zadachi')}, нужно знать физику: формулу придётся вспомнить самому.`,
    verno: false,
    back: 'Неверно: формула дана в условии, все буквы в нём объяснены. Нужно подставить числа и решить уравнение.',
    level: B,
    source: R('algoritm'),
  },
  {
    id: '10-formula-dana',
    task: 10,
    topic: 'algoritm',
    type: 'svoystvo',
    front: 'Формула в условии дана. С чего начинаем решение?',
    back: 'Ищем, **какая буква неизвестна** и какие числа подставить вместо остальных.',
    pochemu: 'Длинное условие почти всегда сокращается до строки «подставь и посчитай».',
    level: B,
    source: R('formula-dana'),
  },
  {
    id: '10-vanta-ch',
    task: 10,
    topic: 'algoritm',
    type: 'chertezh',
    front:
      'Цепь моста — парабола $y=ax^2+bx+c$, полотно лежит на оси $Ox$. Как найти длину ванты на расстоянии $x$ от пилона?',
    back: 'Длина ванты — **значение $y$ в точке $x$**: ванта висит вертикально от цепи до полотна, а полотно — это $y=0$.',
    pochemu: 'Никаких теорем Пифагора: просто подставляем $x$.',
    figure: {
      dvizhok: 'most10',
      most: MOST,
      title: 'Висячий мост: пилоны, провисающая цепь, вертикальные ванты и полотно моста',
    },
    level: B,
    source: R('vanta'),
  },
  {
    id: '10-vanta-v',
    task: 10,
    topic: 'algoritm',
    type: 'vychislenie',
    front:
      'Цепь моста: $y=0{,}005x^2-0{,}8x+40$ (в метрах), полотно — ось $Ox$. Найдите длину ванты в $60$ м от пилона.',
    back: '$y(60)=0{,}005\\cdot3600-0{,}8\\cdot60+40=18-48+40=10$ м.',
    otvet: '10',
    proverka: () => MOST.a * MOST.x ** 2 + MOST.b * MOST.x + MOST.c,
    level: B,
    source: R('vanta'),
  },

  /* ── Единицы измерения и степени десяти ── */
  {
    id: '10-edinicy-formuly',
    task: 10,
    topic: 'edinicy',
    type: 'svoystvo',
    front:
      'Скорость дана в км/ч, ускорение — в км/ч². В каких единицах получится время из формулы?',
    back: 'В **часах**: числа подставляют в тех единицах, в которых записана формула, и результат выходит в них же.',
    pochemu: 'Переводят, если величины даны в разных единицах или ответ просят в других.',
    level: B,
    source: R('edinicy-v-formule'),
  },
  {
    id: '10-otvet-edinicy',
    task: 10,
    topic: 'edinicy',
    type: 'svoystvo',
    front: 'Где посмотреть, в каких единицах записывать ответ?',
    back: 'В **последнем** предложении условия («Ответ дайте в минутах»). Перечитываем его перед бланком.',
    level: E,
    source: R('otvet-v-edinicah'),
  },
  {
    id: '10-gorizont-l',
    task: 10,
    topic: 'edinicy',
    type: 'verno',
    front:
      'В формуле горизонта $l=\\sqrt{\\dfrac{Rh}{500}}$ ($R$ в км) высоту $h$ в метрах нужно сначала перевести в километры.',
    verno: false,
    back: 'Неверно: $2R\\cdot\\dfrac{h}{1000}=\\dfrac{Rh}{500}$ — деление на $500$ уже переводит метры в километры, $h$ подставляют в метрах.',
    level: E,
    source: R('otvet-v-edinicah'),
  },
  {
    id: '10-perevod',
    task: 10,
    topic: 'edinicy',
    type: 'svoystvo',
    front: 'Из большей единицы в меньшую — умножаем или делим? А из меньшей в большую?',
    back: 'Из большей в меньшую — **умножаем**, из меньшей в большую — **делим**.',
    pochemu: 'В мелких единицах число больше: $3\\text{ ч}=180\\text{ мин}$.',
    level: B,
    source: ED('kak-perevodit'),
  },
  {
    id: '10-minuty-v',
    task: 10,
    topic: 'edinicy',
    type: 'vychislenie',
    front: 'Из формулы вышло $t=0{,}4$ ч, а ответ просят в минутах. Что записать в бланк?',
    back: '$1\\text{ ч}=60\\text{ мин}$; часы → минуты: большая → меньшая, умножаем: $0{,}4\\cdot60=24$ мин.',
    otvet: '24',
    proverka: () => 0.4 * 60,
    level: B,
    source: ED('kak-perevodit'),
  },
  {
    id: '10-kmch-v',
    task: 10,
    topic: 'edinicy',
    type: 'vychislenie',
    front: 'Переведите $54$ км/ч в м/с.',
    back: 'Скорость — дробь: $\\dfrac{54\\cdot1000\\text{ м}}{3600\\text{ с}}=15$ м/с.',
    pochemu: 'Числитель и знаменатель переводим отдельно.',
    otvet: '15',
    proverka: () => (54 * 1000) / 3600,
    level: B,
    source: ED('sostavnye'),
  },
  {
    id: '10-umnozhenie-stepeney',
    task: 10,
    topic: 'edinicy',
    type: 'formula',
    front: 'Умножение и деление степеней с одинаковым основанием?',
    back: '$a^m\\cdot a^n=a^{m+n}$, $a^m:a^n=a^{m-n}$',
    pochemu: 'Основание прежнее, показатели складываем или вычитаем.',
    level: B,
    source: ED('stepeni'),
  },
  {
    id: '10-otricatelnaya',
    task: 10,
    topic: 'edinicy',
    type: 'formula',
    front: 'Чему равны $a^0$ и $a^{-n}$ ($a\\ne0$)?',
    back: '$a^0=1$, $a^{-n}=\\dfrac{1}{a^n}$',
    pochemu: 'Минус в показателе «переворачивает» число в дробь: $2^{-3}=\\dfrac18$, а не $-8$.',
    level: B,
    source: ED('stepeni'),
  },
  {
    id: '10-stepen-stepeni',
    task: 10,
    topic: 'edinicy',
    type: 'formula',
    front: 'Степень степени: $(a^m)^n=\\,?$ Сколько м² в $1$ км²?',
    back: '$(a^m)^n=a^{mn}$, $1\\text{ км}^2=(10^3\\text{ м})^2=10^6\\text{ м}^2$',
    level: B,
    source: ED('stepeni'),
  },
  {
    id: '10-pristavki',
    task: 10,
    topic: 'edinicy',
    type: 'svoystvo',
    front: 'Какие множители означают приставки нано, микро, милли, кило, мега, гига?',
    back: 'нано — $10^{-9}$, микро — $10^{-6}$, милли — $10^{-3}$,\nкило — $10^3$, мега — $10^6$, гига — $10^9$.',
    level: B,
    source: ED('stepeni'),
  },
  {
    id: '10-stepeni-v',
    task: 10,
    topic: 'edinicy',
    type: 'vychislenie',
    front: 'Вычислите $4\\cdot10^{-6}\\cdot2{,}5\\cdot10^{6}$.',
    back: 'Числа отдельно, степени отдельно: $(4\\cdot2{,}5)\\cdot10^{-6+6}=10\\cdot10^0=10$.',
    otvet: '10',
    proverka: () => 4 * 10 ** -6 * 2.5 * 10 ** 6,
    level: B,
    source: ED('stepeni'),
  },

  /* ── Линейные и дробно-рациональные уравнения ── */
  {
    id: '10-proporciya',
    task: 10,
    topic: 'drobnye',
    type: 'formula',
    front: 'Основное свойство пропорции: $\\dfrac{a}{b}=\\dfrac{c}{d}$ равносильно…?',
    back: '$ad=bc$ (при $b\\ne0$, $d\\ne0$)',
    pochemu: 'Перемножаем «крест-накрест» — дробное уравнение становится линейным.',
    level: B,
    source: R('proporciya'),
  },
  {
    id: '10-vyrazit-r',
    task: 10,
    topic: 'drobnye',
    type: 'formula',
    front: 'Выразите $R$ из $U=\\dfrac{\\varepsilon R}{R+r}$.',
    back: '$U(R+r)=\\varepsilon R$, $R=\\dfrac{Ur}{\\varepsilon-U}$',
    pochemu: 'Перемножили «крест-накрест», собрали $R$ в одной части, вынесли за скобку.',
    level: E,
    source: R('vyrazit-r'),
  },
  {
    id: '10-ehds-v',
    task: 10,
    topic: 'drobnye',
    type: 'vychislenie',
    front:
      '$U=\\dfrac{\\varepsilon R}{R+r}$, $\\varepsilon=120$ В, $r=2$ Ом. При каком $R$ (в омах) напряжение $U=100$ В?',
    back: '$100(R+2)=120R$, $20R=200$, $R=10$ Ом.',
    otvet: '10',
    proverka: () => {
      const R = (100 * 2) / (120 - 100);
      return Math.abs((120 * R) / (R + 2) - 100) < 1e-9 ? R : NaN;
    },
    level: B,
    source: R('vyrazit-r'),
  },
  {
    id: '10-znamenatel',
    task: 10,
    topic: 'drobnye',
    type: 'svoystvo',
    front: 'Когда можно умножить обе части уравнения на знаменатель? Как это видно в задаче?',
    back: 'Только если знаменатель **не ноль**. В задачах это видно по смыслу: $R+r>0$ — сопротивления положительны, $c-v>0$ — звук быстрее участника.',
    level: E,
    source: R('znamenatel'),
  },
  {
    id: '10-granica',
    task: 10,
    topic: 'drobnye',
    type: 'svoystvo',
    front:
      '«Общее сопротивление не меньше $20$ Ом. Найдите наименьшее $R_2$». Что решаем и почему?',
    back: 'Решаем **равенство** $R_{\\text{общ}}=20$: чем меньше $R_2$, тем меньше общее сопротивление, поэтому наименьшее $R_2$ даёт его ровно на границе.',
    level: E,
    source: R('znamenatel'),
  },
  {
    id: '10-parallel-v',
    task: 10,
    topic: 'drobnye',
    type: 'vychislenie',
    front:
      '$R_{\\text{общ}}=\\dfrac{R_1R_2}{R_1+R_2}$, $R_1=30$ Ом. Общее сопротивление должно быть не меньше $12$ Ом. Наименьшее $R_2$ (в омах)?',
    back: 'Граница: $30R_2=12(30+R_2)$, $18R_2=360$, $R_2=20$ Ом.',
    otvet: '20',
    proverka: () => {
      /* Наименьшее R₂ на сетке 0,01: общее сопротивление растёт с R₂. */
      for (let k = 1; k < 100000; k += 1) {
        const r2 = k / 100;
        if ((30 * r2) / (30 + r2) >= 12 - 1e-12) return r2;
      }
      return NaN;
    },
    level: E,
    source: R('znamenatel'),
  },

  /* ── Квадратные уравнения и неравенства ── */
  {
    id: '10-korni',
    task: 10,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'Корни уравнения $at^2+bt+c=0$?',
    back: '$D=b^2-4ac$, $t_{1,2}=\\dfrac{-b\\pm\\sqrt{D}}{2a}$',
    pochemu: 'Сначала избавьтесь от дробей и сократите на общий множитель — числа станут меньше.',
    level: B,
    source: R('formula-korney'),
  },
  {
    id: '10-ostanovka',
    task: 10,
    topic: 'kvadratnye',
    type: 'formula',
    front:
      'Автомобиль тормозит: $S=v_0t-\\dfrac{at^2}{2}$. Когда он остановится? Какой корень лишний?',
    back: 'Остановка при $t=\\dfrac{v_0}{a}$. Корень больше этого момента лишний — он описывает «движение назад», которого нет.',
    level: E,
    source: R('vybor-kornya'),
  },
  {
    id: '10-tormozhenie-v',
    task: 10,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      '$S=v_0t-\\dfrac{at^2}{2}$, $v_0=20$ м/с, $a=4$ м/с². За сколько секунд автомобиль проедет $48$ м?',
    back: '$48=20t-2t^2$, $t^2-10t+24=0$, $t=4$ или $t=6$. Остановка через $\\dfrac{20}{4}=5$ с, корень $6$ — после неё. Ответ: $4$.',
    otvet: '4',
    proverka: () => {
      const stop = 20 / 4;
      const k = korniKv(-2, 20, -48).filter((t) => t >= 0 && t <= stop);
      return k.length === 1 ? (k[0] as number) : NaN;
    },
    level: E,
    source: R('vybor-kornya'),
  },
  {
    id: '10-nagrevatel',
    task: 10,
    topic: 'kvadratnye',
    type: 'svoystvo',
    front: 'Нагреватель: температура дважды достигает опасной отметки. Какой корень берём?',
    back: '**Меньший**: прибор отключают при первом достижении опасной температуры. После этого формула описывает уже испорченный прибор.',
    level: E,
    source: R('vybor-kornya'),
  },
  {
    id: '10-nagrevatel-v',
    task: 10,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      '$T(t)=1400+150t-10t^2$ (К, $t$ в минутах). Выше $1900$ К прибор портится. Через сколько минут его отключить?',
    back: '$1400+150t-10t^2=1900$, $t^2-15t+50=0$, $t=5$ или $t=10$. Отключаем при первом достижении: $5$ мин.',
    otvet: '5',
    proverka: () => Math.min(...korniKv(-10, 150, 1400 - 1900)),
    level: B,
    source: R('vybor-kornya'),
  },
  {
    id: '10-vyruchka-ch',
    task: 10,
    topic: 'kvadratnye',
    type: 'chertezh',
    front:
      'Выручка $r(p)$ — парабола ветвями вниз, пунктир — уровень $100$. При каких $p$ выручка не менее $100$? Где наибольшая цена?',
    back: 'При $p_1\\le p\\le p_2$ — **между корнями** уравнения $r(p)=100$. Наибольшая цена — правый конец $p_2$.',
    pochemu: 'После переноса в одну часть парабола ветвями вверх $\\le0$ между корнями.',
    figure: { dvizhok: 'graph', scena: RIS_VYRUCHKA },
    level: E,
    source: R('neravenstvo'),
  },
  {
    id: '10-vyruchka-v',
    task: 10,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      'Спрос $q=50-5p$, выручка $r=q\\cdot p$. Найдите наибольшую цену $p$, при которой выручка не менее $80$.',
    back: '$50p-5p^2\\ge80$, $p^2-10p+16\\le0$, $2\\le p\\le8$. Наибольшая цена — $8$.',
    otvet: '8',
    proverka: () => Math.max(...korniKv(-5, 50, -80)),
    level: B,
    source: R('neravenstvo'),
  },
  {
    id: '10-vershina',
    task: 10,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'В задаче про бак дискриминант $D=0$. Что это значит и когда вода вытекла до крана?',
    back: 'Парабола касается оси времени в одной точке — вершине: $t=-\\dfrac{b}{2a}$.',
    level: B,
    source: R('vershina'),
  },
  {
    id: '10-bak-v',
    task: 10,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      '$H(t)=\\dfrac{1}{500}t^2-\\dfrac15t+5$ (м, $t$ в минутах). Через сколько минут вода вытечет до уровня крана ($H=0$)?',
    back: '$D=\\dfrac{1}{25}-4\\cdot\\dfrac{1}{500}\\cdot5=0$, вершина: $t=\\dfrac15:\\dfrac{2}{500}=50$ мин.',
    otvet: '50',
    proverka: () => {
      const [t1, t2] = korniKv(1 / 500, -1 / 5, 5) as [number, number];
      return Math.abs(t1 - t2) < 1e-4 ? (t1 + t2) / 2 : NaN;
    },
    level: B,
    source: R('vershina'),
  },
  {
    id: '10-myach-ch',
    task: 10,
    topic: 'kvadratnye',
    type: 'chertezh',
    front: 'Высота мяча $h(t)$, пунктир — отметка $H$. Сколько секунд мяч выше отметки?',
    back: '$t_2-t_1$, где $t_1$, $t_2$ — **оба** корня уравнения $h(t)=H$: мяч пересекает отметку на подъёме и на спуске.',
    figure: { dvizhok: 'graph', scena: RIS_MYACH },
    level: E,
    source: R('promezhutok'),
  },
  {
    id: '10-myach-v',
    task: 10,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      '$h(t)=1+9t-5t^2$ (м, $t$ в секундах). Сколько секунд мяч находится на высоте не менее $5$ м?',
    back: '$5t^2-9t+4\\le0$, $t_1=0{,}8$, $t_2=1$. Время: $1-0{,}8=0{,}2$ с.',
    otvet: '0,2',
    proverka: () => {
      const [t1, t2] = korniKv(-5, 9, 1 - 5) as [number, number];
      return t2 - t1;
    },
    level: E,
    source: R('promezhutok'),
  },

  /* ── Степени и корни ── */
  {
    id: '10-kvadrat',
    task: 10,
    topic: 'stepeni',
    type: 'svoystvo',
    front: 'Как достать неизвестную из-под корня в $v=\\sqrt{2la}$? Почему так можно?',
    back: 'Возвести обе части в квадрат: $v^2=2la$. Можно, потому что обе части неотрицательны.',
    level: B,
    source: R('vozvedenie'),
  },
  {
    id: '10-razgon-v',
    task: 10,
    topic: 'stepeni',
    type: 'vychislenie',
    front:
      '$v=\\sqrt{2la}$, $a=5000$ км/ч². Какой путь $l$ (в км) нужен, чтобы разогнаться до $100$ км/ч?',
    back: '$100^2=2l\\cdot5000$, $10\\,000=10\\,000l$, $l=1$ км.',
    otvet: '1',
    proverka: () => 100 ** 2 / (2 * 5000),
    level: B,
    source: R('vozvedenie'),
  },
  {
    id: '10-koren-4-l',
    task: 10,
    topic: 'stepeni',
    type: 'verno',
    front: 'Из $T^4=625$ следует $T=5$, если $T$ — температура в кельвинах.',
    verno: true,
    back: 'Верно: температура в кельвинах положительна, поэтому $\\sqrt[4]{T^4}=T$, и $T=\\sqrt[4]{625}=5$.',
    level: B,
    source: R('vozvedenie'),
  },
  {
    id: '10-drobnyy',
    task: 10,
    topic: 'stepeni',
    type: 'formula',
    front: 'Степень с дробным показателем: $a^{\\frac{m}{n}}=\\,?$ Какая дробь — $1{,}4$?',
    back: '$a^{\\frac{m}{n}}=\\left(\\sqrt[n]{a}\\right)^m$, $1{,}4=\\dfrac75$',
    pochemu: 'Сначала корень, потом степень.',
    level: E,
    source: R('drobnyy-pokazatel'),
  },
  {
    id: '10-adiabata-v',
    task: 10,
    topic: 'stepeni',
    type: 'vychislenie',
    front: 'Найдите $x>0$, если $x^{1{,}4}=3^7$.',
    back: '$x^{\\frac75}=3^7$; возводим в степень $\\dfrac57$: $x=3^5=243$.',
    otvet: '243',
    proverka: () => (3 ** 7) ** (5 / 7),
    level: E,
    source: R('drobnyy-pokazatel'),
  },
  {
    id: '10-standartnyy',
    task: 10,
    topic: 'stepeni',
    type: 'svoystvo',
    front: 'Что такое стандартный вид числа?',
    back: 'Запись $a\\cdot10^n$, где $1\\le a<10$: например, $5{,}7\\cdot10^{-8}$.',
    level: B,
    source: R('standartnyy-vid'),
  },
  {
    id: '10-koren-4-v',
    task: 10,
    topic: 'stepeni',
    type: 'vychislenie',
    front: 'Найдите $\\sqrt[4]{8{,}1\\cdot10^{13}}$.',
    back: 'Подгоняем показатель под кратный $4$: $8{,}1\\cdot10^{13}=81\\cdot10^{12}$, корень: $3\\cdot10^3=3000$.',
    otvet: '3000',
    proverka: () => 8.1e13 ** 0.25,
    level: E,
    source: R('standartnyy-vid'),
  },
  {
    id: '10-odno-osnovanie',
    task: 10,
    topic: 'stepeni',
    type: 'svoystvo',
    front: 'Как извлечь корень в уме, если под ним $128$, $32$ или $625$?',
    back: 'Представить числа степенями одного основания: $128=2^7$, $32=2^5$, $625=5^4$.',
    level: B,
    source: R('odno-osnovanie'),
  },

  /* ── Показательные и логарифмические зависимости ── */
  {
    id: '10-raspad',
    task: 10,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Закон радиоактивного распада? Что такое $T$?',
    back: '$m(t)=m_0\\cdot2^{-\\frac{t}{T}}$; $T$ — период полураспада: за него масса уменьшается **вдвое**.',
    pochemu: 'Показатель $\\dfrac{t}{T}$ — сколько раз масса успела уменьшиться вдвое.',
    level: B,
    source: R('raspad'),
  },
  {
    id: '10-raspad-ch',
    task: 10,
    topic: 'pokazatelnye',
    type: 'chertezh',
    front: 'Кривая распада $m(t)=m_0\\cdot2^{-\\frac{t}{T}}$. Какая масса останется через $3T$?',
    back: '$\\dfrac{m_0}{8}$: за каждый период масса уменьшается вдвое, $2^3=8$.',
    figure: { dvizhok: 'graph', scena: RIS_RASPAD },
    level: B,
    source: R('raspad'),
  },
  {
    id: '10-16-raz-l',
    task: 10,
    topic: 'pokazatelnye',
    type: 'verno',
    front: 'Масса изотопа уменьшилась в $16$ раз — значит, прошло $16$ периодов полураспада.',
    verno: false,
    back: 'Неверно: $16=2^4$, масса уменьшилась вдвое $4$ раза — прошло $4$ периода, $t=4T$.',
    level: E,
    source: R('raspad'),
  },
  {
    id: '10-raspad-v',
    task: 10,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front:
      '$m(t)=m_0\\cdot2^{-\\frac{t}{T}}$, $m_0=40$ мг, $T=5$ мин. Через сколько минут масса станет $5$ мг?',
    back: '$2^{-\\frac{t}{5}}=\\dfrac{5}{40}=\\dfrac18=2^{-3}$, $\\dfrac{t}{5}=3$, $t=15$ мин.',
    otvet: '15',
    proverka: () => 5 * Math.log2(40 / 5),
    level: B,
    source: R('raspad'),
  },
  {
    id: '10-logarifm',
    task: 10,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Что значит $\\log_2x=k$?',
    back: '$\\log_2x=k\\iff x=2^k$: $k$ — показатель, в который нужно возвести $2$, чтобы получить $x$.',
    pochemu: '$\\log_28=3$, потому что $2^3=8$.',
    level: B,
    source: R('logarifm'),
  },
  {
    id: '10-kolokol-v',
    task: 10,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: '$\\log_2\\dfrac{p_2}{p_1}=3$, $p_1=1{,}5$ атм. Найдите $p_2$ (в атм).',
    back: '$\\dfrac{p_2}{1{,}5}=2^3=8$, $p_2=12$ атм.',
    otvet: '12',
    proverka: () => 1.5 * 2 ** 3,
    level: B,
    source: R('logarifm'),
  },
  {
    id: '10-rc',
    task: 10,
    topic: 'pokazatelnye',
    type: 'svoystvo',
    front: 'Задача о конденсаторе: что сделать с произведением $RC$ до вычислений?',
    back: 'Сократить степени десяти: множители $10^k$ и $10^{-k}$ дают $10^0=1$, и $RC$ получается «чистым».',
    level: E,
    source: R('rc'),
  },
  {
    id: '10-pochemu',
    task: 10,
    topic: 'pokazatelnye',
    type: 'svoystvo',
    front: 'Разряд конденсатора: «прошло не менее $t$ секунд». Какое напряжение ищем?',
    back: '**Наибольшее** $U$: время и напряжение меняются в разные стороны. Решаем равенство и берём границу: при большем $t$ напряжение только меньше.',
    level: E,
    source: R('pochemu'),
  },
  {
    id: '10-kondensator-v',
    task: 10,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front:
      '$t=\\alpha RC\\log_2\\dfrac{U_0}{U}$, $\\alpha=1{,}5$, $R=4\\cdot10^6$ Ом, $C=5\\cdot10^{-7}$ Ф, $U_0=32$ кВ. Прошло не менее $9$ с. Наибольшее напряжение (в кВ)?',
    back: '$RC=20\\cdot10^{-1}=2$, $\\alpha RC=3$, $\\log_2\\dfrac{32}{U}\\ge3$, на границе $\\dfrac{32}{U}=2^3$, $U=4$ кВ.',
    otvet: '4',
    proverka: () => {
      const aRC = 1.5 * 4e6 * 5e-7;
      return 32 / 2 ** (9 / aRC);
    },
    level: E,
    source: R('celoe-k'),
  },
  {
    id: '10-dvoyka-v',
    task: 10,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Масса изотопа уменьшилась в $128$ раз. Сколько прошло периодов полураспада?',
    back: 'По таблице степеней двойки: $128=2^7$ — прошло $7$ периодов.',
    otvet: '7',
    proverka: () => Math.log2(128),
    level: B,
    source: R('stepeni-dvoyki'),
  },

  /* ── Тригонометрия в прикладных задачах ── */
  {
    id: '10-tablica-trig',
    task: 10,
    topic: 'trigonometriya',
    type: 'svoystvo',
    front: 'Синус и косинус $30^\\circ$, $45^\\circ$, $60^\\circ$?',
    back: '$\\sin30^\\circ=\\cos60^\\circ=\\dfrac12$,\n$\\sin45^\\circ=\\cos45^\\circ=\\dfrac{\\sqrt2}{2}$,\n$\\sin60^\\circ=\\cos30^\\circ=\\dfrac{\\sqrt3}{2}$.',
    level: B,
    source: R('tablichnye'),
  },
  {
    id: '10-monotonnost',
    task: 10,
    topic: 'trigonometriya',
    type: 'svoystvo',
    front: 'Угол броска острый, $\\sin\\alpha\\ge\\dfrac12$. Какой угол наименьший и почему?',
    back: '$30^\\circ$: на $[0^\\circ;90^\\circ]$ синус **растёт**, поэтому неравенство верно при $\\alpha\\ge30^\\circ$.',
    level: E,
    source: R('monotonnost'),
  },
  {
    id: '10-cos-l',
    task: 10,
    topic: 'trigonometriya',
    type: 'verno',
    front: 'На промежутке $[0^\\circ;180^\\circ]$ косинус возрастает.',
    verno: false,
    back: 'Неверно: косинус там **убывает**, поэтому $\\cos2\\alpha\\le\\dfrac12$ при $2\\alpha\\ge60^\\circ$.',
    level: B,
    source: R('monotonnost'),
  },
  {
    id: '10-polet-v',
    task: 10,
    topic: 'trigonometriya',
    type: 'vychislenie',
    front:
      '$t=\\dfrac{2v_0\\sin\\alpha}{g}$, $v_0=15$ м/с, $g=10$ м/с². При каком наименьшем угле $\\alpha$ (в градусах) время полёта не меньше $1{,}5$ с?',
    back: '$\\sin\\alpha\\ge\\dfrac{1{,}5\\cdot10}{2\\cdot15}=\\dfrac12$, синус растёт — $\\alpha=30^\\circ$.',
    otvet: '30',
    proverka: () => Math.asin((1.5 * 10) / (2 * 15)) / GRAD,
    level: B,
    source: R('monotonnost'),
  },
  {
    id: '10-ponizhenie',
    task: 10,
    topic: 'trigonometriya',
    type: 'formula',
    front: 'Как связаны $\\sin^2\\alpha$ и $\\cos2\\alpha$?',
    back: '$\\sin^2\\alpha=\\dfrac{1-\\cos2\\alpha}{2}$, $1-\\cos2\\alpha=2\\sin^2\\alpha$',
    pochemu: 'Формула понижения степени.',
    level: E,
    source: R('ponizhenie'),
  },
  {
    id: '10-soudarenie-v',
    task: 10,
    topic: 'trigonometriya',
    type: 'vychislenie',
    front:
      'Соударение: $Q=mv^2\\sin^2\\alpha$, $m=1$ кг, $v=6$ м/с, $Q=27$ Дж. Под каким углом $2\\alpha$ (в градусах) двигались тела?',
    back: '$\\sin^2\\alpha=\\dfrac{27}{36}=\\dfrac34$, $\\sin\\alpha=\\dfrac{\\sqrt3}{2}$, $\\alpha=60^\\circ$. Спрашивают $2\\alpha=120^\\circ$.',
    otvet: '120',
    proverka: () => 2 * (Math.asin(Math.sqrt(27 / (1 * 36))) / GRAD),
    level: E,
    source: R('kakoy-ugol'),
  },
  {
    id: '10-radiany-v',
    task: 10,
    topic: 'trigonometriya',
    type: 'vychislenie',
    front: 'Груз на пружине: угол $\\dfrac{2\\pi t}{T}$, $t=3$ с, $T=24$ с. Сколько это градусов?',
    back: '$\\dfrac{2\\pi\\cdot3}{24}=\\dfrac{\\pi}{4}$; $\\pi$ — это $180^\\circ$, значит, $45^\\circ$.',
    otvet: '45',
    proverka: () => (2 * Math.PI * 3) / 24 / GRAD,
    level: B,
    source: R('kakoy-ugol'),
  },

  /* ── Физика в двух словах ── */
  {
    id: '10-parallelno-l',
    task: 10,
    topic: 'fizika',
    type: 'verno',
    front: 'При параллельном подключении общее сопротивление больше, чем у каждого прибора.',
    verno: false,
    back: 'Неверно: общее сопротивление **меньше** каждого из приборов, и ток в сети растёт.',
    level: B,
    source: F('P06'),
  },
  {
    id: '10-dopler-l',
    task: 10,
    topic: 'fizika',
    type: 'verno',
    front: 'Приближающийся источник звучит ниже, чем неподвижный.',
    verno: false,
    back: 'Неверно: выше — волны «сжимаются» (эффект Доплера).',
    level: B,
    source: F('P08'),
  },
  {
    id: '10-vyruchka-smysl',
    task: 10,
    topic: 'fizika',
    type: 'svoystvo',
    front: 'Почему выручка «цена × количество» — парабола?',
    back: 'Чем выше цена, тем меньше покупают: выручка сначала растёт, потом падает.',
    level: B,
    source: F('P14'),
  },
  {
    id: '10-pyat',
    task: 10,
    topic: 'fizika',
    type: 'svoystvo',
    front: 'Что за коэффициент $5$ в формуле высоты мяча $h(t)=h_0+v_0t-5t^2$?',
    back: '$5\\approx\\dfrac{g}{2}$: мяч поднимается и падает, высота — парабола ветвями вниз.',
    level: B,
    source: F('P17'),
  },
  {
    id: '10-zvezda-l',
    task: 10,
    topic: 'fizika',
    type: 'verno',
    front: 'Мощность излучения нагретого тела растёт как квадрат температуры.',
    verno: false,
    back: 'Неверно: как **четвёртая** степень температуры ($P=\\sigma ST^4$) — поэтому горячие звёзды так ярки.',
    level: B,
    source: F('P20'),
  },
  {
    id: '10-adiabata-l',
    task: 10,
    topic: 'fizika',
    type: 'verno',
    front: 'При резком (адиабатическом) сжатии давление газа растёт быстрее, чем падает объём.',
    verno: true,
    back: 'Верно: газ не успевает отдать тепло; давление выросло в $128$ раз — объём уменьшился лишь в $32$ раза.',
    level: B,
    source: F('P21'),
  },

  /* ── Ловушки ── */
  {
    id: '10-ne-menee-l',
    task: 10,
    topic: 'lovushki',
    type: 'verno',
    front: '«Выручка не менее $100$» записывают как $r(p)\\le100$.',
    verno: false,
    back: 'Неверно: «не менее» — это $\\ge$, «не более» — это $\\le$: $r(p)\\ge100$.',
    level: E,
    source: R('lov-znak'),
  },
  {
    id: '10-koren-l',
    task: 10,
    topic: 'lovushki',
    type: 'verno',
    front:
      'Торможение: корни $t=6$ и $t=10$, автомобиль остановился через $8$ с. В ответ идёт $10$.',
    verno: false,
    back: 'Неверно: корень $10$ — после остановки, ответ $6$.',
    level: E,
    source: R('lov-koren'),
  },
  {
    id: '10-otricatelnoe',
    task: 10,
    topic: 'lovushki',
    type: 'svoystvo',
    front: 'Среди корней получилось отрицательное время $t=-7$. Что с ним делать?',
    back: 'Отбросить и объяснить почему: время, длина, масса, температура в кельвинах — **положительные**.',
    level: B,
    source: R('lov-smysl'),
  },
  {
    id: '10-pered-otvetom',
    task: 10,
    topic: 'lovushki',
    type: 'svoystvo',
    front: 'Что проверить, прежде чем записать ответ в бланк?',
    back: 'Единицы; тот ли корень; тот ли знак неравенства; похоже ли на правду.',
    level: E,
    source: R('pered-otvetom'),
  },
];

/* ── Проверки формул на случайных числах ── */

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '10-umnozhenie-stepeney',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.2, 5);
      const m = tseloe(rnd, -6, 6);
      const n = tseloe(rnd, -6, 6);
      /* Обе формулы карточки: произведение и частное. */
      return { poFormule: a ** (m + n) + a ** (m - n), pryamo: a ** m * a ** n + a ** m / a ** n };
    },
  },
  {
    kartochka: '10-otricatelnaya',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.2, 9) * (rnd() < 0.5 ? -1 : 1);
      const n = tseloe(rnd, 1, 8);
      /* a⁰ = aⁿ : aⁿ, a⁻ⁿ = a⁰ : aⁿ. */
      return { poFormule: 1 / a ** n + 1, pryamo: a ** -n + a ** n / a ** n };
    },
  },
  {
    kartochka: '10-stepen-stepeni',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.3, 4);
      const m = tseloe(rnd, -4, 4);
      const n = tseloe(rnd, -4, 4);
      return { poFormule: a ** (m * n), pryamo: (a ** m) ** n };
    },
  },
  {
    kartochka: '10-proporciya',
    sluchay: (rnd) => {
      const a = ot(rnd, -9, 9);
      const b = ot(rnd, 0.5, 9);
      const d = ot(rnd, 0.5, 9);
      const c = (a * d) / b;
      return { poFormule: a * d, pryamo: b * c };
    },
  },
  {
    /* R по формуле карточки подставляем обратно в U = εR/(R + r). */
    kartochka: '10-vyrazit-r',
    sluchay: (rnd) => {
      const eps = ot(rnd, 5, 300);
      const r = ot(rnd, 0.1, 10);
      const U = ot(rnd, 0.05, 0.95) * eps;
      const R = (U * r) / (eps - U);
      return { poFormule: (eps * R) / (R + r), pryamo: U };
    },
  },
  {
    /* Корни по формуле обращают трёхчлен в ноль. */
    kartochka: '10-korni',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.5, 9) * (rnd() < 0.5 ? -1 : 1);
      const t1 = ot(rnd, -10, 10);
      const t2 = ot(rnd, -10, 10);
      const b = -a * (t1 + t2);
      const c = a * t1 * t2;
      const D = b * b - 4 * a * c;
      const t = (-b + Math.sqrt(D)) / (2 * a);
      return { poFormule: a * t * t + b * t + c, pryamo: 0 };
    },
  },
  {
    /* В момент v₀/a скорость v₀ − at равна нулю, а путь — наибольший:
       дальше формула пути убывает («движение назад»). */
    kartochka: '10-ostanovka',
    sluchay: (rnd) => {
      const v0 = ot(rnd, 1, 40);
      const a = ot(rnd, 0.5, 10);
      const t = v0 / a;
      const S = (x: number) => v0 * x - (a * x * x) / 2;
      const h = 1e-3 * t;
      const maksimum = S(t) >= S(t - h) && S(t) >= S(t + h) ? 1 : 0;
      return { poFormule: v0 - a * t + maksimum, pryamo: 1 };
    },
  },
  {
    /* При D = 0 трёхчлен обращается в ноль в вершине −b/(2a). */
    kartochka: '10-vershina',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.001, 2);
      const b = -ot(rnd, 0.1, 5);
      const c = (b * b) / (4 * a);
      const t = -b / (2 * a);
      return { poFormule: a * t * t + b * t + c, pryamo: 0 };
    },
  },
  {
    kartochka: '10-drobnyy',
    sluchay: (rnd) => {
      const a = ot(rnd, 0.1, 50);
      const m = tseloe(rnd, 1, 9);
      const n = tseloe(rnd, 1, 9);
      return { poFormule: a ** (m / n), pryamo: Math.pow(a, 1 / n) ** m };
    },
  },
  {
    /* За период T масса уменьшается ровно вдвое. */
    kartochka: '10-raspad',
    sluchay: (rnd) => {
      const m0 = ot(rnd, 1, 500);
      const T = ot(rnd, 0.5, 50);
      const t = ot(rnd, 0, 200);
      const m = (x: number) => m0 * 2 ** (-x / T);
      return { poFormule: m(t + T), pryamo: m(t) / 2 };
    },
  },
  {
    kartochka: '10-logarifm',
    sluchay: (rnd) => {
      const k = ot(rnd, -10, 10);
      return { poFormule: Math.log2(2 ** k), pryamo: k };
    },
  },
  {
    kartochka: '10-ponizhenie',
    sluchay: (rnd) => {
      const al = ot(rnd, -7, 7);
      return { poFormule: (1 - Math.cos(2 * al)) / 2, pryamo: Math.sin(al) ** 2 };
    },
  },
];

const KOLODA_10: Koloda = {
  task: 10,
  slug: '10',
  title: 'Прикладные задачи',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'algoritm', title: 'Как решать задачу' },
    { id: 'edinicy', title: 'Единицы и степени десяти' },
    { id: 'drobnye', title: 'Дробные уравнения' },
    { id: 'kvadratnye', title: 'Квадратные зависимости' },
    { id: 'stepeni', title: 'Степени и корни' },
    { id: 'pokazatelnye', title: 'Распад и логарифмы' },
    { id: 'trigonometriya', title: 'Тригонометрия' },
    { id: 'fizika', title: 'Физика в двух словах' },
    { id: 'lovushki', title: 'Ловушки' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_10;
