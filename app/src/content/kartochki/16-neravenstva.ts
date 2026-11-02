/**
 * Карточки по теории задания №16 «Неравенства».
 *
 * Во вкладке «Теория» №16 написаны три пункта: «Стандартный вид» и
 * «Алгоритм и кратность корней» главы «Метод интервалов» и «Системы
 * неравенств» одноимённой главы (content/teoriya16.ts); остальные пункты
 * и главы — «Готовится» и «Скоро». Колода идёт только по написанному:
 * метод интервалов, кратность нулей, ограничения (ОДЗ), системы.
 * `source` — якорь карточки теории #t16-… (lib/zadanie16/teoriya-yakorya.ts).
 *
 * «Добавлено» — две карточки: как узнать знак на промежутке и как
 * отмечать нули нестрогого неравенства. Шаг «определить знак» в теории
 * назван, но не объяснён, а все её примеры строгие; без этих двух
 * фактов метод интервалов не довести до ответа.
 *
 * Числа — свои. Ответ каждого вычисления scripts/verify_cards
 * пересчитывает перебором целых чисел по самому неравенству (без метода
 * интервалов), формулы проверяет на случайных $x$. Рисунки — числовая
 * прямая и эскиз параболы движком чертежей lib/graph.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { DOBAVLENO } from '@/lib/kartochki/tipy';
import { YAKOR_16 } from '@/lib/zadanie16/teoriya-yakorya';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const K = YAKOR_16.kartochka;

/* ── Счёт для проверок: перебор целых ── */

/** Целые решения условия на отрезке [-1000; 1000]: ответы колоды лежат далеко внутри. */
function celye(uslovie: (x: number) => boolean): number[] {
  const out: number[] = [];
  for (let x = -1000; x <= 1000; x += 1) if (uslovie(x)) out.push(x);
  return out;
}

const skolko = (uslovie: (x: number) => boolean) => celye(uslovie).length;
const naibolshee = (uslovie: (x: number) => boolean) => Math.max(...celye(uslovie));
const naimenshee = (uslovie: (x: number) => boolean) => Math.min(...celye(uslovie));

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);

/* ── Рисунки: движок чертежей lib/graph, оси за краем поля ── */

function bezOsey(
  okno: { xmin: number; xmax: number; ymin: number; ymax: number },
  shapes: unknown[],
  alt: string,
): () => Record<string, unknown> {
  return () => ({
    window: okno,
    cell: 40,
    grid: { step: 1, show: false },
    axes: { labelX: '', labelY: '', origin: '' },
    axisLabels: 'none',
    curves: [],
    points: [],
    shapes,
    alt,
  });
}

/** Начало рисунка в координатах движка: оси — за краем окна. */
const X0 = 10;
const Y0 = 10;

const podpis = (at: [number, number], text: string, color = 'axis', size = 16) => ({
  type: 'label',
  at,
  text,
  color,
  size,
});

/** Выколотая точка: кружок с заливкой фона. */
const vykolotaya = (at: [number, number]) => ({
  type: 'circle',
  at,
  radius: 0.16,
  fill: 'bg',
  fillOpacity: 1,
  color: 'lineA',
  width: 2.4,
});

/**
 * Числовая прямая метода интервалов: нули по порядку на равных
 * расстояниях (масштаб не важен), под ними подписи, над промежутками —
 * знаки выражения.
 */
function pryamaya(nuli: readonly string[], znaki: readonly string[], alt: string) {
  const shag = 2;
  const dlina = shag * (nuli.length + 1);
  const shapes: unknown[] = [
    { type: 'segment', from: [X0, Y0], to: [X0 + dlina, Y0], color: 'axis', width: 2, arrow: true },
  ];
  nuli.forEach((t, i) => {
    const x = X0 + shag * (i + 1);
    shapes.push(vykolotaya([x, Y0]));
    shapes.push(podpis([x, Y0 - 0.65], t));
  });
  znaki.forEach((z, i) => {
    shapes.push(podpis([X0 + shag * i + shag / 2 + 0.1, Y0 + 0.6], z, 'lineB', 20));
  });
  return bezOsey(
    { xmin: X0 - 0.3, xmax: X0 + dlina + 0.3, ymin: Y0 - 1.2, ymax: Y0 + 1.2 },
    shapes,
    alt,
  );
}

const RIS_DVA = pryamaya(
  ['1', '4'],
  ['+', '−', '+'],
  'Числовая прямая с выколотыми точками 1 и 4; знаки на промежутках слева направо: плюс, минус, плюс',
);

const RIS_KRATNOST = pryamaya(
  ['−1', '2'],
  ['−', '+', '+'],
  'Числовая прямая с выколотыми точками минус один и два; знаки слева направо: минус, плюс, плюс — через точку 2 знак не меняется',
);

/* Эскиз параболы y = (x − 5)²: касается оси в точке 5. Ось — x от 2 до 8. */
const RIS_PARABOLA = (() => {
  const sx = (x: number) => X0 + (x - 2);
  const sy = (y: number) => Y0 + y * 0.45;
  const shapes: unknown[] = [
    { type: 'segment', from: [sx(2), Y0], to: [sx(8.4), Y0], color: 'axis', width: 2, arrow: true },
  ];
  const n = 40;
  for (let i = 0; i < n; i += 1) {
    const a = 2.6 + (4.8 * i) / n;
    const b = 2.6 + (4.8 * (i + 1)) / n;
    shapes.push({
      type: 'segment',
      from: [sx(a), sy((a - 5) ** 2)],
      to: [sx(b), sy((b - 5) ** 2)],
      color: 'lineA',
      width: 3,
    });
  }
  shapes.push(vykolotaya([sx(5), Y0]));
  shapes.push(podpis([sx(5), Y0 - 0.6], '5'));
  shapes.push(podpis([sx(8.2), Y0 - 0.6], 'x'));
  return bezOsey(
    { xmin: sx(2) - 0.3, xmax: sx(8.4) + 0.3, ymin: Y0 - 1.1, ymax: sy(5.76) + 0.3 },
    shapes,
    'Парабола ветвями вверх касается оси абсцисс в точке 5, точка 5 выколота; вся остальная парабола выше оси',
  );
})();

/* ── Карточки ── */

const kartochki: Kartochka[] = [
  /* ── Метод интервалов ── */
  {
    id: '16-opredelenie',
    task: 16,
    topic: 'intervaly',
    type: 'svoystvo',
    front: 'Что такое метод интервалов?',
    back: 'Способ решения неравенств: нули выражения разбивают числовую прямую на промежутки, и на каждом **определяют знак** выражения.',
    level: B,
    source: K('opredelenie'),
  },
  {
    id: '16-algoritm',
    task: 16,
    topic: 'intervaly',
    type: 'svoystvo',
    front: 'Пять шагов метода интервалов для $f(x)>0$ (или $f(x)<0$)?',
    back: '1) Привести к стандартному виду.\n2) Найти нули множителей.\n3) Отметить нули на числовой прямой.\n4) Определить знак на каждом промежутке.\n5) Записать ответ.',
    level: E,
    source: K('algoritm'),
  },
  {
    id: '16-standartnyy-l',
    task: 16,
    topic: 'intervaly',
    type: 'verno',
    front:
      'Стандартный вид для метода интервалов: справа $0$, слева произведение, разложенное на множители до конца.',
    verno: true,
    back: 'Верно: это первый шаг алгоритма. Только тогда нули множителей — все точки смены знака.',
    level: B,
    source: K('algoritm'),
  },
  {
    id: '16-nuli-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Найдите сумму нулей множителей выражения $(2x-6)(x+5)(5x-1)$.',
    back: 'Нули: $2x-6=0\\Rightarrow x=3$, $x+5=0\\Rightarrow x=-5$, $5x-1=0\\Rightarrow x=0{,}2$. Сумма $3-5+0{,}2=-1{,}8$.',
    otvet: '-1,8',
    proverka: () => {
      /* Нуль множителя ax + b — где он обращается в 0. */
      const mnozhiteli: [number, number][] = [
        [2, -6],
        [1, 5],
        [5, -1],
      ];
      return mnozhiteli.reduce((s, [a, b]) => s + -b / a, 0);
    },
    level: B,
    source: K('algoritm'),
  },
  {
    id: '16-razlozhit',
    task: 16,
    topic: 'intervaly',
    type: 'formula',
    front: 'Неравенство $(x-1)(x^2-6x+9)>0$. Как разложить $x^2-6x+9$?',
    back: '$x^2-6x+9=(x-3)^2$',
    pochemu: 'Квадратный трёхчлен — тоже произведение. Не разложив его, знаки расставят неверно.',
    level: E,
    source: K('razlozhit'),
  },
  {
    id: '16-razlozhit-l',
    task: 16,
    topic: 'intervaly',
    type: 'verno',
    front:
      'Нули выражения $(x-1)(x^2-6x+9)$ — числа $1$ и $3$; знаки чередуются, поэтому $(x-1)(x^2-6x+9)>0$ при $x\\in(-\\infty;\\,1)\\cup(3;\\,+\\infty)$.',
    verno: false,
    back: 'Неверно: $(x-1)(x-3)^2>0$, нуль $3$ чётной кратности, знак через него не меняется. Ответ $(1;\\,3)\\cup(3;\\,+\\infty)$.',
    level: E,
    source: K('razlozhit'),
  },
  {
    id: '16-razlozhit-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Найдите наибольшее целое решение неравенства $(x-1)(x^2-6x+9)<0$.',
    back: '$(x-1)(x-3)^2<0$: множитель $(x-3)^2$ не отрицателен, поэтому $x-1<0$ и $x\\ne3$, то есть $x<1$. Наибольшее целое — $0$.',
    otvet: '0',
    proverka: () => naibolshee((x) => (x - 1) * (x * x - 6 * x + 9) < 0),
    level: E,
    source: K('razlozhit'),
  },
  {
    id: '16-dva-ch',
    task: 16,
    topic: 'intervaly',
    type: 'chertezh',
    front:
      'На прямой — нули выражения $(x-1)(x-4)$ и его знаки. При каких $x$ выражение больше нуля?',
    back: '$x\\in(-\\infty;\\,1)\\cup(4;\\,+\\infty)$ — промежутки со знаком «$+$». Точки выколоты: неравенство строгое.',
    figure: { dvizhok: 'graph', scena: RIS_DVA },
    level: B,
    source: K('primer-dva'),
  },
  {
    id: '16-dva-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Сколько целых решений у неравенства $(x-1)(x-4)<0$?',
    back: 'Знаки: $+$, $-$, $+$; выражение отрицательно на $(1;\\,4)$. Целые: $2$ и $3$ — всего $2$.',
    otvet: '2',
    proverka: () => skolko((x) => (x - 1) * (x - 4) < 0),
    level: B,
    source: K('primer-dva'),
  },
  {
    id: '16-vykolotye-l',
    task: 16,
    topic: 'intervaly',
    type: 'verno',
    front:
      'Неравенство строгое — нули на прямой отмечают выколотыми точками, в ответ они не входят.',
    verno: true,
    back: 'Верно: в нуле выражение равно $0$, а строгое неравенство $>0$ или $<0$ этого не допускает.',
    level: B,
    source: K('primer-dva'),
  },
  {
    id: '16-znak-promezhutok',
    task: 16,
    topic: 'intervaly',
    type: 'svoystvo',
    front: 'Как определить знак выражения на промежутке между нулями?',
    back: '**Подставить любое число** из промежутка (кроме нулей): знак выражения в нём — знак на всём промежутке.',
    pochemu:
      'Внутри промежутка нулей нет, и знак произведения не меняется. Удобно начать с большого $x$ справа.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '16-nestrogoe',
    task: 16,
    topic: 'intervaly',
    type: 'svoystvo',
    front:
      'Неравенство нестрогое ($\\ge0$ или $\\le0$). Как отмечают нули множителей и входят ли они в ответ?',
    back: '**Закрашенными** точками: нули входят в ответ, скобки у концов квадратные — $[\\,1;\\,4\\,]$.',
    pochemu: 'В нуле выражение равно $0$, а $0\\ge0$ — верно.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '16-celye-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Сколько целых решений у неравенства $(x+3)(x-2)<0$?',
    back: 'Нули $-3$ и $2$, выражение отрицательно на $(-3;\\,2)$. Целые: $-2$, $-1$, $0$, $1$ — всего $4$.',
    otvet: '4',
    proverka: () => skolko((x) => (x + 3) * (x - 2) < 0),
    level: B,
    source: K('primer-dva'),
  },
  {
    id: '16-tri-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Найдите наибольшее целое решение неравенства $(x+4)(x-1)(x-6)<0$.',
    back: 'Нули $-4$, $1$, $6$; знаки справа налево: $+$, $-$, $+$, $-$. Решение $(-\\infty;\\,-4)\\cup(1;\\,6)$, наибольшее целое — $5$.',
    otvet: '5',
    proverka: () => naibolshee((x) => (x + 4) * (x - 1) * (x - 6) < 0),
    level: E,
    source: K('algoritm'),
  },
  {
    id: '16-summa-v',
    task: 16,
    topic: 'intervaly',
    type: 'vychislenie',
    front: 'Найдите сумму целых решений неравенства $(x-2)(x-7)<0$.',
    back: 'Решение $(2;\\,7)$, целые: $3$, $4$, $5$, $6$. Сумма $18$.',
    otvet: '18',
    proverka: () => celye((x) => (x - 2) * (x - 7) < 0).reduce((s, x) => s + x, 0),
    level: B,
    source: K('primer-dva'),
  },

  /* ── Кратность нулей ── */
  {
    id: '16-kratnost',
    task: 16,
    topic: 'kratnost',
    type: 'svoystvo',
    front: 'При переходе через какие нули многочлен меняет знак, а через какие — нет?',
    back: 'Через нули **нечётной** кратности знак меняется, через нули **чётной** кратности — не меняется.',
    level: E,
    source: K('kratnost'),
  },
  {
    id: '16-chetnaya-l',
    task: 16,
    topic: 'kratnost',
    type: 'verno',
    front: 'При переходе через нуль $x=3$ выражения $(x-1)(x-3)^2$ знак меняется.',
    verno: false,
    back: 'Неверно: у $x=3$ кратность $2$ — чётная, знак через него не меняется.',
    level: E,
    source: K('kratnost'),
  },
  {
    id: '16-nechetnaya-l',
    task: 16,
    topic: 'kratnost',
    type: 'verno',
    front: 'При переходе через нуль $x=2$ выражения $(x-2)^3(x+1)$ знак меняется.',
    verno: true,
    back: 'Верно: у $x=2$ кратность $3$ — нечётная, знак меняется.',
    level: B,
    source: K('kratnost'),
  },
  {
    id: '16-kratnost-ch',
    task: 16,
    topic: 'kratnost',
    type: 'chertezh',
    front: 'Знаки выражения $(x+1)(x-2)^2$ на прямой. Почему через $2$ знак не меняется?',
    back: 'У нуля $2$ **кратность $2$** — чётная: $(x-2)^2>0$ и слева, и справа от него. Через $-1$ (кратность $1$) знак меняется.',
    figure: { dvizhok: 'graph', scena: RIS_KRATNOST },
    level: E,
    source: K('kratnost'),
  },
  {
    id: '16-vynesti',
    task: 16,
    topic: 'kratnost',
    type: 'formula',
    front: 'Какая кратность у нуля $3$ в выражении $(x-3)(2x-6)$?',
    back: '$(x-3)(2x-6)=2(x-3)^2$ — кратность $2$',
    pochemu: 'Выносим $2$ из второй скобки — и видно, что множитель $x-3$ повторяется.',
    level: E,
    source: K('primer-kratnost'),
  },
  {
    id: '16-kratnost-chislo-v',
    task: 16,
    topic: 'kratnost',
    type: 'vychislenie',
    front: 'Какова кратность нуля $x=1$ у выражения $(x-1)^2(3x-3)$?',
    back: '$3x-3=3(x-1)$, поэтому $(x-1)^2(3x-3)=3(x-1)^3$ — кратность $3$.',
    otvet: '3',
    proverka: () => {
      /* Множители (a, b, степень): сколько раз x − 1 входит в ax + b. */
      const mnozhiteli: [number, number, number][] = [
        [1, -1, 2],
        [3, -3, 1],
      ];
      return mnozhiteli.filter(([a, b]) => a * 1 + b === 0).reduce((s, [, , m]) => s + m, 0);
    },
    level: B,
    source: K('primer-kratnost'),
  },
  {
    id: '16-kratnost-v',
    task: 16,
    topic: 'kratnost',
    type: 'vychislenie',
    front: 'Сколько целых решений у неравенства $(x-3)^2(x+2)(x-6)<0$?',
    back: 'Нуль $3$ чётной кратности — знак не меняется, сама точка выколота. Решение $(-2;\\,3)\\cup(3;\\,6)$, целые: $-1$, $0$, $1$, $2$, $4$, $5$ — всего $6$.',
    otvet: '6',
    proverka: () => skolko((x) => (x - 3) ** 2 * (x + 2) * (x - 6) < 0),
    level: E,
    source: K('kratnost'),
  },
  {
    id: '16-kratnost2-v',
    task: 16,
    topic: 'kratnost',
    type: 'vychislenie',
    front: 'Найдите наименьшее целое решение неравенства $(x+1)^2(x-4)>0$.',
    back: '$(x+1)^2>0$ при $x\\ne-1$, поэтому нужно $x-4>0$: решение $(4;\\,+\\infty)$, наименьшее целое — $5$.',
    otvet: '5',
    proverka: () => naimenshee((x) => (x + 1) ** 2 * (x - 4) > 0),
    level: B,
    source: K('kratnost'),
  },
  {
    id: '16-kvadrat-l',
    task: 16,
    topic: 'kratnost',
    type: 'verno',
    front: 'Неравенство $(x-5)^2>0$ верно при всех $x$.',
    verno: false,
    back: 'Неверно: при $x=5$ выражение равно $0$. Ответ $(-\\infty;\\,5)\\cup(5;\\,+\\infty)$.',
    level: E,
    source: K('parabola'),
  },
  {
    id: '16-parabola-ch',
    task: 16,
    topic: 'kratnost',
    type: 'chertezh',
    front: 'Эскиз параболы $y=(x-5)^2$. Решите по нему неравенство $(x-5)^2>0$.',
    back: 'Парабола **касается** оси в точке $5$ и выше оси везде, кроме неё: $x\\in(-\\infty;\\,5)\\cup(5;\\,+\\infty)$.',
    figure: { dvizhok: 'graph', scena: RIS_PARABOLA },
    level: B,
    source: K('parabola'),
  },

  /* ── Ограничения (ОДЗ) ── */
  {
    id: '16-odz',
    task: 16,
    topic: 'odz',
    type: 'svoystvo',
    front: 'Откуда в неравенстве берутся ограничения (ОДЗ)?',
    back: 'Из условий, **при которых выражение имеет смысл**: знаменатель, корень, логарифм, тангенс и котангенс.',
    level: B,
    source: K('ogranicheniya'),
  },
  {
    id: '16-znamenatel',
    task: 16,
    topic: 'odz',
    type: 'svoystvo',
    front: 'Какое ограничение даёт выражение $\\dfrac{1}{f(x)}$?',
    back: 'Знаменатель не равен нулю: $f(x)\\ne0$.',
    level: B,
    source: K('ogranicheniya'),
  },
  {
    id: '16-koren',
    task: 16,
    topic: 'odz',
    type: 'svoystvo',
    front: 'Какое ограничение даёт выражение $\\sqrt{f(x)}$?',
    back: 'Под корнем неотрицательное число: $f(x)\\ge0$.',
    level: B,
    source: K('ogranicheniya'),
  },
  {
    id: '16-koren-znam-l',
    task: 16,
    topic: 'odz',
    type: 'verno',
    front: 'Для выражения $\\dfrac{1}{\\sqrt{f(x)}}$ достаточно условия $f(x)\\ge0$.',
    verno: false,
    back: 'Неверно: корень стоит в знаменателе и не может быть нулём, поэтому $f(x)>0$.',
    level: E,
    source: K('ogranicheniya'),
  },
  {
    id: '16-log',
    task: 16,
    topic: 'odz',
    type: 'svoystvo',
    front: 'Какие ограничения даёт $\\log_a f(x)$?',
    back: '$f(x)>0$, $a>0$, $a\\ne1$.',
    level: E,
    source: K('ogranicheniya'),
  },
  {
    id: '16-log-osn-l',
    task: 16,
    topic: 'odz',
    type: 'verno',
    front: 'Выражение $\\log_x 5$ имеет смысл при $x=1$.',
    verno: false,
    back: 'Неверно: основание логарифма $a>0$ и $a\\ne1$.',
    level: B,
    source: K('ogranicheniya'),
  },
  {
    id: '16-tg',
    task: 16,
    topic: 'odz',
    type: 'svoystvo',
    front: 'При каких $x$ не определены $\\operatorname{tg}x$ и $\\operatorname{ctg}x$?',
    back: '$\\operatorname{tg}x$: $x\\ne\\dfrac{\\pi}{2}+\\pi n$; $\\operatorname{ctg}x$: $x\\ne\\pi n$, $n\\in\\mathbb{Z}$.',
    level: E,
    source: K('ogranicheniya'),
  },
  {
    id: '16-odz-v',
    task: 16,
    topic: 'odz',
    type: 'vychislenie',
    front: 'Сколько целых чисел входит в ОДЗ выражения $\\sqrt{x+2}+\\dfrac{1}{\\sqrt{4-x}}$?',
    back: 'Под корнем $x+2\\ge0$, корень в знаменателе — $4-x>0$. ОДЗ $[-2;\\,4)$, целые: от $-2$ до $3$ — всего $6$.',
    otvet: '6',
    proverka: () => skolko((x) => x + 2 >= 0 && 4 - x > 0 && Number.isFinite(1 / Math.sqrt(4 - x))),
    level: E,
    source: K('ogranicheniya'),
  },
  {
    id: '16-log-v',
    task: 16,
    topic: 'odz',
    type: 'vychislenie',
    front: 'Найдите наименьшее целое $x$, при котором имеет смысл $\\log_3(2x-7)$.',
    back: '$2x-7>0\\Rightarrow x>3{,}5$. Наименьшее целое — $4$.',
    otvet: '4',
    proverka: () => naimenshee((x) => Number.isFinite(Math.log(2 * x - 7)) && 2 * x - 7 > 0),
    level: B,
    source: K('ogranicheniya'),
  },
  {
    id: '16-odz-sistema-l',
    task: 16,
    topic: 'odz',
    type: 'verno',
    front: 'Если ограничений несколько, их решают системой.',
    verno: true,
    back: 'Верно: выражение имеет смысл, когда выполнены **все** условия сразу — это система.',
    level: B,
    source: K('ogranicheniya'),
  },

  /* ── Системы неравенств ── */
  {
    id: '16-sistema',
    task: 16,
    topic: 'sistemy',
    type: 'svoystvo',
    front: 'Алгоритм решения системы неравенств?',
    back: '1) Решить каждое неравенство отдельно.\n2) Изобразить решения на числовых прямых друг под другом.\n3) Найти **пересечение** всех решений.',
    level: E,
    source: K('sistema'),
  },
  {
    id: '16-peresechenie-l',
    task: 16,
    topic: 'sistemy',
    type: 'verno',
    front: 'Решение системы неравенств — объединение решений всех её неравенств.',
    verno: false,
    back: 'Неверно: **пересечение** — подходят только $x$, которые решают все неравенства сразу.',
    level: B,
    source: K('sistema'),
  },
  {
    id: '16-sistema-v',
    task: 16,
    topic: 'sistemy',
    type: 'vychislenie',
    front:
      'Сколько целых решений у системы $\\begin{cases}x>-4,\\\\ x\\le3,\\\\ x\\ne1\\end{cases}$?',
    back: 'Пересечение: $(-4;\\,1)\\cup(1;\\,3]$. Целые: $-3$, $-2$, $-1$, $0$, $2$, $3$ — всего $6$.',
    otvet: '6',
    proverka: () => skolko((x) => x > -4 && x <= 3 && x !== 1),
    level: B,
    source: K('sistema'),
  },
  {
    id: '16-sistema2-v',
    task: 16,
    topic: 'sistemy',
    type: 'vychislenie',
    front:
      'Найдите наибольшее целое решение системы $\\begin{cases}(x-1)(x-5)<0,\\\\ x\\le3.\\end{cases}$',
    back: 'Первое: $(1;\\,5)$, второе: $(-\\infty;\\,3]$. Пересечение $(1;\\,3]$, наибольшее целое — $3$.',
    otvet: '3',
    proverka: () => naibolshee((x) => (x - 1) * (x - 5) < 0 && x <= 3),
    level: E,
    source: K('sistema'),
  },
  {
    id: '16-sistema3-v',
    task: 16,
    topic: 'sistemy',
    type: 'vychislenie',
    front:
      'Сколько целых решений у системы $\\begin{cases}(x+2)(x-6)<0,\\\\ (x-1)(x-9)>0\\end{cases}$?',
    back: 'Первое: $(-2;\\,6)$, второе: $(-\\infty;\\,1)\\cup(9;\\,+\\infty)$. Пересечение $(-2;\\,1)$, целые $-1$ и $0$ — всего $2$.',
    otvet: '2',
    proverka: () => skolko((x) => (x + 2) * (x - 6) < 0 && (x - 1) * (x - 9) > 0),
    level: E,
    source: K('sistema'),
  },
];

/* ── Проверки формул: случайные x ── */

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '16-razlozhit',
    sluchay: (rnd) => {
      const x = ot(rnd, -50, 50);
      return { poFormule: (x - 3) ** 2, pryamo: x * x - 6 * x + 9 };
    },
  },
  {
    kartochka: '16-vynesti',
    sluchay: (rnd) => {
      const x = ot(rnd, -50, 50);
      return { poFormule: 2 * (x - 3) ** 2, pryamo: (x - 3) * (2 * x - 6) };
    },
  },
];

const KOLODA_16: Koloda = {
  task: 16,
  slug: '16',
  title: 'Неравенства',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'intervaly', title: 'Метод интервалов' },
    { id: 'kratnost', title: 'Кратность нулей' },
    { id: 'odz', title: 'Ограничения (ОДЗ)' },
    { id: 'sistemy', title: 'Системы неравенств' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_16;
