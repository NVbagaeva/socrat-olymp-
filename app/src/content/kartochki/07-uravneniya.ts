/**
 * Карточки по теории задания №7 «Простейшие уравнения».
 *
 * Колода идёт по разделам вкладки «Теория» №7 (content/teoriya7.ts и
 * блок «Иррациональные уравнения» content/teoriya7-irr.ts): общий
 * порядок решения и ОДЗ, линейные и дробные, степенные, квадратные,
 * иррациональные, показательные, логарифмические, тригонометрические.
 * `source` — якорь страницы (lib/zadanie7/teoriya-yakorya.ts): карточка
 * теории #k-…, рамка или таблица раздела #t7-…. Всё, что спрашивает
 * колода, в теории №7 написано — карточек «добавлено» нет.
 *
 * Чертежи — единичная окружность на движке чертежей lib/graph, как у
 * живого круга теории. Уравнения — свои, не задачи банка. Каждый корень
 * scripts/verify_cards подставляет обратно в уравнение (`koren`), а
 * свойства степеней, логарифмов и серии тригонометрических уравнений
 * проверяет на случайных числах.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { YAKOR_7 } from '@/lib/zadanie7/teoriya-yakorya';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const K = YAKOR_7.kartochka;
const R = YAKOR_7.blok;

/* ── Счёт для проверок ── */

const EPS = 1e-9;

/**
 * Корень уравнения левая = правая: число, если подстановка даёт верное
 * равенство (и обе части существуют), иначе NaN — проверка не пройдёт.
 */
function koren(x: number, levaya: (x: number) => number, pravaya: (x: number) => number): number {
  const l = levaya(x);
  const r = pravaya(x);
  return Number.isFinite(l) &&
    Number.isFinite(r) &&
    Math.abs(l - r) < EPS * Math.max(1, Math.abs(r))
    ? x
    : NaN;
}

/** Корни квадратного трёхчлена по формуле (D ≥ 0). */
function korniKv(a: number, b: number, c: number): number[] {
  const D = b * b - 4 * a * c;
  if (D < 0) return [];
  return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)];
}

/** Логарифм по основанию; NaN вне ОДЗ (аргумент ≤ 0, основание ≤ 0 или 1). */
const log = (a: number, b: number) => (a > 0 && a !== 1 && b > 0 ? Math.log(b) / Math.log(a) : NaN);

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);
/** Положительное основание, не близкое к 1. */
const osnovanie = (rnd: () => number) => {
  const a = ot(rnd, 0.1, 9);
  return Math.abs(a - 1) < 0.05 ? a + 0.5 : a;
};
/** Целое n из [−5; 5]. */
const tseloe = (rnd: () => number) => Math.floor(rnd() * 11) - 5;

/** Корни тригонометрической серии x₀ + T·n при n от −6 до 6. */
const seriya = (x0: number, T: number) => Array.from({ length: 13 }, (_, i) => x0 + T * (i - 6));

/* ── Единичная окружность на движке lib/graph ── */

/** Подпись угла в долях π: 1/3 → «π/3», 5/6 → «5π/6». */
function ugol(n: number, m: number): string {
  const ch = n === 1 ? 'π' : `${n}π`;
  return m === 1 ? ch : `${ch}/${m}`;
}

/**
 * Круг с отмеченными углами (доли π) и, если задано, прямой y = a —
 * «где синус равен a». Тот же вид, что у живого круга теории
 * (components/tasks/zadanie7/ZhivoyKrug7.tsx).
 */
function krug(
  ugly: readonly (readonly [number, number])[],
  alt: string,
  pryamayaY?: number,
): () => Record<string, unknown> {
  return () => {
    const shapes: unknown[] = [
      { type: 'circle', at: [0, 0], radius: 1, color: 'axis', width: 1.6 },
    ];
    if (pryamayaY !== undefined) {
      shapes.push({
        type: 'segment',
        from: [-1.4, pryamayaY],
        to: [1.4, pryamayaY],
        color: 'accent',
        style: 'dashed',
      });
    }
    ugly.forEach(([n, m], i) => {
      const th = (n / m) * Math.PI;
      const x = Math.cos(th);
      const y = Math.sin(th);
      shapes.push({ type: 'segment', from: [0, 0], to: [x, y], color: 'lineA', width: 1.8 });
      shapes.push({
        type: 'arc',
        at: [0, 0],
        from: 0,
        to: (n / m) * 180,
        radius: 0.22 + 0.1 * i,
        color: 'lineA',
      });
      shapes.push({ type: 'dot', at: [x, y], color: 'lineA', radius: 5.5 });
      shapes.push({
        type: 'label',
        at: [x * 1.27, y * 1.2],
        text: ugol(n, m),
        color: 'lineA',
        size: 15,
      });
    });
    return {
      window: { xmin: -1.6, xmax: 1.6, ymin: -1.45, ymax: 1.45 },
      cell: 120,
      grid: { step: 1, show: false },
      axes: { labelX: 'x', labelY: 'y', origin: '' },
      axisLabels: 'minimal',
      curves: [],
      points: [],
      shapes,
      alt,
    };
  };
}

const kartochki: Kartochka[] = [
  /* ── Корень, ОДЗ, отбор ── */
  {
    id: '7-koren',
    task: 7,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Что называют **корнем уравнения**?',
    back: 'Число, при подстановке которого вместо $x$ уравнение превращается в верное числовое равенство.',
    pochemu: '$x=3$ — корень $2x+1=7$: $2\\cdot3+1=7$ — верно.',
    level: B,
    source: R('koren'),
  },
  {
    id: '7-ravnosilnye',
    task: 7,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Какие уравнения **равносильны**? Какие шаги решения опасны?',
    back: 'Равносильны — если у них одни и те же корни. Опасны возведение в квадрат, умножение на выражение с $x$ и «снятие» логарифма: после них возможны **посторонние корни**.',
    level: E,
    source: R('ravnosilnye'),
  },
  {
    id: '7-proizvedenie',
    task: 7,
    topic: 'obshchee',
    type: 'formula',
    front: 'Когда произведение $A\\cdot B$ равно нулю?',
    back: '$A\\cdot B=0\\iff A=0$ или $B=0$',
    pochemu: '«Или» — совокупность: подходит любой случай.',
    level: B,
    source: R('sovokupnost'),
  },
  {
    id: '7-odz',
    task: 7,
    topic: 'obshchee',
    type: 'svoystvo',
    front: 'Что записывают в ОДЗ для дроби, квадратного корня и логарифма?',
    back: '$\\dfrac{1}{A}$: $A\\ne0$.\n$\\sqrt{A}$: $A\\ge0$.\n$\\log_BA$: $A>0$, $B>0$, $B\\ne1$.',
    level: E,
    source: R('odz'),
  },
  {
    id: '7-odz-l',
    task: 7,
    topic: 'obshchee',
    type: 'verno',
    front: 'Число $3$ может оказаться корнем уравнения, в котором есть дробь $\\dfrac{1}{x-3}$.',
    verno: false,
    back: 'Неверно: при $x=3$ знаменатель равен нулю, дробь не существует — $3$ не входит в ОДЗ.',
    level: B,
    source: R('odz'),
  },
  {
    id: '7-menshiy-odin-l',
    task: 7,
    topic: 'obshchee',
    type: 'verno',
    front:
      '«Если уравнение имеет более одного корня, укажите меньший» — значит, корней у него точно два.',
    verno: false,
    back: 'Неверно: если после отбора остался один корень, его и пишем.',
    level: E,
    source: R('odno-chislo'),
  },
  {
    id: '7-dva-v-blank-l',
    task: 7,
    topic: 'obshchee',
    type: 'verno',
    front: 'Если корней два, в бланк можно записать оба через точку с запятой.',
    verno: false,
    back: 'Неверно: в бланк идёт **одно** число — то, о котором спросили: меньший, больший, наименьший положительный.',
    level: E,
    source: R('odno-chislo'),
  },

  /* ── Линейные и дробные ── */
  {
    id: '7-lineynoe',
    task: 7,
    topic: 'lineynye',
    type: 'formula',
    front: 'Корень линейного уравнения $kx+b=c$ при $k\\ne0$?',
    back: '$x=\\dfrac{c-b}{k}$',
    pochemu: 'Переносим $b$ с другим знаком и делим на коэффициент.',
    level: B,
    source: R('lineynoe'),
  },
  {
    id: '7-proporciya',
    task: 7,
    topic: 'lineynye',
    type: 'formula',
    front: 'Правило пропорции: $\\dfrac{a}{b}=\\dfrac{c}{d}$ при $b\\ne0$, $d\\ne0$?',
    back: '$\\dfrac{a}{b}=\\dfrac{c}{d}\\iff a\\cdot d=b\\cdot c$',
    pochemu: 'Произведение «крест-накрест»; знаменатели не равны нулю.',
    level: B,
    source: R('proporciya'),
  },
  {
    id: '7-odin-na',
    task: 7,
    topic: 'lineynye',
    type: 'svoystvo',
    front: '$\\dfrac{1}{A}=c$, $c\\ne0$. Чему равно $A$?',
    back: '$A=\\dfrac{1}{c}$ — числу, обратному правой части.',
    pochemu: 'Обратное к $5$ — это $0{,}2$, а не $-5$.',
    level: B,
    source: K('odin-na'),
  },
  {
    id: '7-odin-na-v',
    task: 7,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\dfrac{1}{3x-4}=0{,}5$.',
    back: '$3x-4=\\dfrac{1}{0{,}5}=2$, $3x=6$, $x=2$',
    otvet: '2',
    proverka: () =>
      koren(
        (1 / 0.5 + 4) / 3,
        (x) => 1 / (3 * x - 4),
        () => 0.5,
      ),
    level: B,
    source: K('odin-na'),
  },
  {
    id: '7-dve-drobi-v',
    task: 7,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\dfrac{1}{2x-5}=\\dfrac{1}{x+3}$.',
    back: 'Знаменатели равны: $2x-5=x+3$, $x=8$. Оба знаменателя равны $11\\ne0$.',
    otvet: '8',
    proverka: () =>
      koren(
        5 + 3,
        (x) => 1 / (2 * x - 5),
        (x) => 1 / (x + 3),
      ),
    level: B,
    source: K('dve-drobi'),
  },
  {
    id: '7-krest-v',
    task: 7,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\dfrac{x-2}{x+4}=3$.',
    back: '$x-2=3(x+4)$, $-2x=14$, $x=-7$. Знаменатель $-7+4=-3\\ne0$.',
    otvet: '-7',
    proverka: () =>
      koren(
        (-2 - 12) / 2,
        (x) => (x - 2) / (x + 4),
        () => 3,
      ),
    level: B,
    source: K('krest'),
  },
  {
    id: '7-smeshannoe-l',
    task: 7,
    topic: 'lineynye',
    type: 'verno',
    front: '$3\\dfrac{7}{9}=3\\cdot\\dfrac{7}{9}$',
    verno: false,
    back: 'Неверно: смешанное число — **сумма**: $3\\dfrac79=3+\\dfrac79=\\dfrac{34}{9}$.',
    level: E,
    source: K('smeshannoe'),
  },
  {
    id: '7-smeshannoe-v',
    task: 7,
    topic: 'lineynye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $1\\dfrac{1}{4}x=10$.',
    back: '$1\\dfrac14=\\dfrac54$, $x=10\\cdot\\dfrac45=8$',
    otvet: '8',
    proverka: () =>
      koren(
        10 * (4 / 5),
        (x) => (1 + 1 / 4) * x,
        () => 10,
      ),
    level: B,
    source: K('smeshannoe'),
  },
  {
    id: '7-drob-kvadrat-l',
    task: 7,
    topic: 'lineynye',
    type: 'verno',
    front:
      'В $x=\\dfrac{ax+b}{x+c}$ умножили обе части на $x+c$. Корень, при котором $x+c=0$, тоже идёт в ответ.',
    verno: false,
    back: 'Неверно: при нём исходная дробь не существует — корень посторонний.',
    level: E,
    source: K('drob-kvadrat'),
  },

  /* ── Степенные ── */
  {
    id: '7-skolko-korney',
    task: 7,
    topic: 'stepennye',
    type: 'svoystvo',
    front: 'Сколько корней у $t^n=b$ при **чётном** $n$, если $b>0$, $b=0$, $b<0$?',
    back: '$b>0$ — два: $\\pm\\sqrt[n]{b}$.\n$b=0$ — один: $t=0$.\n$b<0$ — корней нет.',
    pochemu: 'При нечётном $n$ корень всегда один.',
    level: E,
    source: R('skolko-korney'),
  },
  {
    id: '7-nechet-l',
    task: 7,
    topic: 'stepennye',
    type: 'verno',
    front: 'Уравнение $t^3=-8$ не имеет корней.',
    verno: false,
    back: 'Неверно: корень нечётной степени есть у любого числа: $t=\\sqrt[3]{-8}=-2$.',
    level: B,
    source: R('koren-n'),
  },
  {
    id: '7-nechetnaya',
    task: 7,
    topic: 'stepennye',
    type: 'formula',
    front: 'Как решить $(x+a)^n=b$ при нечётном $n$?',
    back: '$(x+a)^n=b\\iff x+a=\\sqrt[n]{b}$',
    pochemu: 'Корень один, знак сохраняется: $(x+9)^7=-128$ ⇒ $x+9=-2$.',
    level: B,
    source: K('nechetnaya'),
  },
  {
    id: '7-nechetnaya-v',
    task: 7,
    topic: 'stepennye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $(x-4)^3=-27$.',
    back: '$x-4=\\sqrt[3]{-27}=-3$, $x=1$',
    otvet: '1',
    proverka: () =>
      koren(
        4 + Math.cbrt(-27),
        (x) => (x - 4) ** 3,
        () => -27,
      ),
    level: B,
    source: K('nechetnaya'),
  },
  {
    id: '7-ravnye-kvadraty',
    task: 7,
    topic: 'stepennye',
    type: 'formula',
    front: 'Когда квадраты равны: $A^2=B^2$?',
    back: '$A^2=B^2\\iff A=B$ или $A=-B$',
    level: B,
    source: K('ravnye-kvadraty'),
  },
  {
    id: '7-ravnye-kvadraty-v',
    task: 7,
    topic: 'stepennye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $(x-6)^2=(x+2)^2$.',
    back: '$A=B$: $-6=2$ — неверно. $A=-B$: $x-6=-x-2$, $2x=4$, $x=2$',
    otvet: '2',
    proverka: () =>
      koren(
        (6 - 2) / 2,
        (x) => (x - 6) ** 2,
        (x) => (x + 2) ** 2,
      ),
    level: E,
    source: K('ravnye-kvadraty'),
  },
  {
    id: '7-polnyy-kvadrat-v',
    task: 7,
    topic: 'stepennye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $(x+5)^2=20x$.',
    back: '$x^2+10x+25=20x$, $x^2-10x+25=0$, $(x-5)^2=0$, $x=5$',
    pochemu: '$(a\\pm b)^2=a^2\\pm2ab+b^2$.',
    otvet: '5',
    proverka: () => {
      const [x1, x2] = korniKv(1, -10, 25);
      return x1 === x2 && x1 !== undefined
        ? koren(
            x1,
            (x) => (x + 5) ** 2,
            (x) => 20 * x,
          )
        : NaN;
    },
    level: E,
    source: K('polnyy-kvadrat'),
  },

  /* ── Квадратные ── */
  {
    id: '7-diskriminant',
    task: 7,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'Дискриминант и корни уравнения $ax^2+bx+c=0$?',
    back: '$D=b^2-4ac$, $x_{1,2}=\\dfrac{-b\\pm\\sqrt{D}}{2a}$',
    pochemu: 'Отрицательное $b$ в квадрат — в скобках: $(-8)^2=64$.',
    level: B,
    source: K('diskriminant'),
  },
  {
    id: '7-d-korney',
    task: 7,
    topic: 'kvadratnye',
    type: 'svoystvo',
    front: 'Сколько корней у квадратного уравнения при $D>0$, $D=0$, $D<0$?',
    back: '$D>0$ — два корня, $D=0$ — один, $D<0$ — корней нет.',
    level: B,
    source: R('formula-korney'),
  },
  {
    id: '7-diskriminant-v',
    task: 7,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      'Решите уравнение $x^2-2x-15=0$. Если уравнение имеет более одного корня, укажите меньший из них.',
    back: '$D=4+60=64$, $x=\\dfrac{2\\pm8}{2}$: $5$ и $-3$. Меньший: $-3$',
    otvet: '-3',
    proverka: () =>
      koren(
        Math.min(...korniKv(1, -2, -15)),
        (x) => x * x - 2 * x - 15,
        () => 0,
      ),
    level: B,
    source: K('diskriminant'),
  },
  {
    id: '7-vieta',
    task: 7,
    topic: 'kvadratnye',
    type: 'formula',
    front: 'Теорема Виета для приведённого уравнения $x^2+px+q=0$?',
    back: '$x_1+x_2=-p$, $x_1\\cdot x_2=q$',
    level: B,
    source: K('vieta'),
  },
  {
    id: '7-vieta-v',
    task: 7,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front: 'Подберите корни уравнения $x^2-11x+28=0$ по теореме Виета. В ответе укажите больший.',
    back: 'Сумма $11$, произведение $28$: корни $4$ и $7$. Больший: $7$',
    otvet: '7',
    proverka: () =>
      koren(
        Math.max(...korniKv(1, -11, 28)),
        (x) => x * x - 11 * x + 28,
        () => 0,
      ),
    level: B,
    source: K('vieta'),
  },
  {
    id: '7-nepolnye-l',
    task: 7,
    topic: 'kvadratnye',
    type: 'verno',
    front: 'У уравнения $4x^2=49$ один корень: $x=3{,}5$.',
    verno: false,
    back: 'Неверно: $x^2=\\dfrac{49}{4}$, корней два — $3{,}5$ и $-3{,}5$.',
    level: E,
    source: K('nepolnye'),
  },
  {
    id: '7-nepolnye-v',
    task: 7,
    topic: 'kvadratnye',
    type: 'vychislenie',
    front:
      'Решите уравнение $4x^2=81$. Если уравнение имеет более одного корня, укажите меньший из них.',
    back: '$x^2=\\dfrac{81}{4}$, $x=\\pm4{,}5$. Меньший: $-4{,}5$',
    otvet: '-4,5',
    proverka: () =>
      koren(
        -Math.sqrt(81 / 4),
        (x) => 4 * x * x,
        () => 81,
      ),
    level: B,
    source: K('nepolnye'),
  },
  {
    id: '7-menshiy-l',
    task: 7,
    topic: 'kvadratnye',
    type: 'verno',
    front: 'Из корней $-5$ и $3$ меньший — $3$, потому что $3<5$.',
    verno: false,
    back: 'Неверно: сравниваем на числовой прямой: $-5<3$, меньший — $-5$.',
    level: B,
    source: R('menshiy'),
  },

  /* ── Иррациональные ── */
  {
    id: '7-koren-chislo',
    task: 7,
    topic: 'irracionalnye',
    type: 'formula',
    front: 'Равносильный переход для $\\sqrt{f(x)}=a$ при $a\\ge0$. Что, если $a<0$?',
    back: '$a\\ge0$: $\\sqrt{f(x)}=a\\iff f(x)=a^2$.\n$a<0$: корней нет — корень не бывает отрицательным.',
    pochemu: '$f(x)\\ge0$ выполняется само: $f(x)=a^2$.',
    level: B,
    source: K('koren-chislo'),
  },
  {
    id: '7-koren-chislo-v',
    task: 7,
    topic: 'irracionalnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\sqrt{5x+1}=6$.',
    back: '$5x+1=36$, $x=7$. Проверка: $\\sqrt{36}=6$.',
    otvet: '7',
    proverka: () =>
      koren(
        (36 - 1) / 5,
        (x) => Math.sqrt(5 * x + 1),
        () => 6,
      ),
    level: B,
    source: K('koren-chislo'),
  },
  {
    id: '7-koren-minus-l',
    task: 7,
    topic: 'irracionalnye',
    type: 'verno',
    front: 'Уравнение $\\sqrt{x+7}=-2$ имеет корень $x=-3$.',
    verno: false,
    back: 'Неверно: корень не бывает отрицательным — корней нет. Число $-3$ решает другое уравнение, $\\sqrt{x+7}=2$.',
    level: E,
    source: K('koren-chislo'),
  },
  {
    id: '7-koren-x',
    task: 7,
    topic: 'irracionalnye',
    type: 'formula',
    front: 'Равносильный переход для $\\sqrt{f(x)}=g(x)$?',
    back: '$\\sqrt{f(x)}=g(x)\\iff \\begin{cases}f(x)=g^2(x)\\\\ g(x)\\ge0\\end{cases}$',
    pochemu: 'Корень с $g(x)<0$ — посторонний: он решает $\\sqrt{f(x)}=-g(x)$.',
    level: E,
    source: K('koren-x'),
  },
  {
    id: '7-koren-x-l',
    task: 7,
    topic: 'irracionalnye',
    type: 'verno',
    front: 'В уравнении $\\sqrt{f(x)}=g(x)$ посторонние корни отсекает условие $f(x)\\ge0$.',
    verno: false,
    back: 'Неверно: их отсекает $g(x)\\ge0$. У посторонних корней тоже $f=g^2\\ge0$, так что $f(x)\\ge0$ ничего не отсеет.',
    level: E,
    source: K('koren-x'),
  },
  {
    id: '7-koren-x-v',
    task: 7,
    topic: 'irracionalnye',
    type: 'vychislenie',
    front:
      'Решите уравнение $\\sqrt{2x+15}=x$. Если уравнение имеет более одного корня, укажите меньший из них.',
    back: '$2x+15=x^2$, $x^2-2x-15=0$: $x=5$ или $x=-3$. Условие $x\\ge0$ отсекает $-3$. Ответ: $5$',
    otvet: '5',
    proverka: () => {
      const svoi = korniKv(1, -2, -15).filter(
        (x) =>
          !Number.isNaN(
            koren(
              x,
              (t) => Math.sqrt(2 * t + 15),
              (t) => t,
            ),
          ),
      );
      return svoi.length === 1 && svoi[0] !== undefined ? svoi[0] : NaN;
    },
    level: E,
    source: K('koren-x'),
  },
  {
    id: '7-koren-koren',
    task: 7,
    topic: 'irracionalnye',
    type: 'formula',
    front: 'Равносильный переход для $\\sqrt{f(x)}=\\sqrt{g(x)}$?',
    back: '$\\sqrt{f(x)}=\\sqrt{g(x)}\\iff \\begin{cases}f(x)=g(x)\\\\ f(x)\\ge0\\end{cases}$',
    pochemu: 'Проверяем одно выражение — более простое: второе ему равно.',
    level: B,
    source: K('koren-koren'),
  },
  {
    id: '7-kub-v',
    task: 7,
    topic: 'irracionalnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\sqrt[3]{x+5}=-3$.',
    back: 'Возводим в куб, условий нет: $x+5=(-3)^3=-27$, $x=-32$',
    pochemu: 'Кубический корень есть у любого числа и бывает отрицательным.',
    otvet: '-32',
    proverka: () =>
      koren(
        (-3) ** 3 - 5,
        (x) => Math.cbrt(x + 5),
        () => -3,
      ),
    level: B,
    source: K('kub-koren'),
  },

  /* ── Показательные ── */
  {
    id: '7-stepeni',
    task: 7,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Свойства степеней: $a^m\\cdot a^n$, $\\dfrac{a^m}{a^n}$, $(a^m)^n$?',
    back: '$a^m\\cdot a^n=a^{m+n}$, $\\dfrac{a^m}{a^n}=a^{m-n}$, $(a^m)^n=a^{mn}$',
    level: B,
    source: R('svoystva-stepeney'),
  },
  {
    id: '7-otr-stepen',
    task: 7,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Чему равны $a^{-n}$ и $a^{\\frac{m}{n}}$?',
    back: '$a^{-n}=\\dfrac{1}{a^n}$, $a^{\\frac{m}{n}}=\\sqrt[n]{a^m}$',
    pochemu: '$\\dfrac{1}{16}=2^{-4}$, $8^{\\frac13}=2$.',
    level: B,
    source: R('svoystva-stepeney'),
  },
  {
    id: '7-pokazateli',
    task: 7,
    topic: 'pokazatelnye',
    type: 'formula',
    front: 'Когда $a^E=a^F$ при $a>0$, $a\\ne1$?',
    back: '$a^E=a^F\\iff E=F$',
    pochemu: 'Функция $y=a^t$ монотонна: каждое значение принимает один раз, поэтому корень один.',
    level: E,
    source: R('pokazateli'),
  },
  {
    id: '7-odno-osnovanie-v',
    task: 7,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $3^{x-2}=81$.',
    back: '$81=3^4$: $x-2=4$, $x=6$',
    otvet: '6',
    proverka: () =>
      koren(
        log(3, 81) + 2,
        (x) => 3 ** (x - 2),
        () => 81,
      ),
    level: B,
    source: K('odno-osnovanie'),
  },
  {
    id: '7-stepen-v-stepeni-v',
    task: 7,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $4^{x+1}=2^{3x}$.',
    back: '$4^{x+1}=(2^2)^{x+1}=2^{2x+2}$: $2x+2=3x$, $x=2$',
    otvet: '2',
    proverka: () =>
      koren(
        2,
        (x) => 4 ** (x + 1),
        (x) => 2 ** (3 * x),
      ),
    level: B,
    source: K('stepen-v-stepeni'),
  },
  {
    id: '7-drob-l',
    task: 7,
    topic: 'pokazatelnye',
    type: 'verno',
    front: '$\\left(\\dfrac15\\right)^{x-2}=5^{x-2}$',
    verno: false,
    back: 'Неверно: $\\left(\\dfrac15\\right)^{x-2}=5^{-(x-2)}=5^{2-x}$ — минус относится ко всему показателю.',
    level: E,
    source: K('odna-vtoraya'),
  },
  {
    id: '7-odna-vtoraya-v',
    task: 7,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\left(\\dfrac12\\right)^{x-4}=8$.',
    back: '$\\left(\\dfrac12\\right)^{x-4}=2^{4-x}$, $8=2^3$: $4-x=3$, $x=1$',
    otvet: '1',
    proverka: () =>
      koren(
        4 - 3,
        (x) => 0.5 ** (x - 4),
        () => 8,
      ),
    level: B,
    source: K('odna-vtoraya'),
  },
  {
    id: '7-x-v-obeih-v',
    task: 7,
    topic: 'pokazatelnye',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\left(\\dfrac14\\right)^{x+3}=2^x$.',
    back: 'Слева $2^{-2(x+3)}=2^{-2x-6}$: $-2x-6=x$, $x=-2$',
    otvet: '-2',
    proverka: () =>
      koren(
        -6 / 3,
        (x) => 0.25 ** (x + 3),
        (x) => 2 ** x,
      ),
    level: E,
    source: K('x-v-obeih'),
  },

  /* ── Логарифмы ── */
  {
    id: '7-log-opredelenie',
    task: 7,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Определение логарифма: $\\log_ab=c\\iff\\ ?$ При каких $a$ и $b$ он определён?',
    back: '$\\log_ab=c\\iff a^c=b$, где $b>0$, $a>0$, $a\\ne1$',
    pochemu: 'Логарифм — показатель степени, в которую возводят $a$, чтобы получить $b$.',
    level: B,
    source: R('logarifm'),
  },
  {
    id: '7-tozhdestvo',
    task: 7,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Основное логарифмическое тождество?',
    back: '$a^{\\log_ab}=b$',
    level: B,
    source: R('tozhdestvo'),
  },
  {
    id: '7-log-summa',
    task: 7,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Чему равны $\\log_a(bc)$ и $\\log_a\\dfrac{b}{c}$?',
    back: '$\\log_a(bc)=\\log_ab+\\log_ac$, $\\log_a\\dfrac{b}{c}=\\log_ab-\\log_ac$',
    level: B,
    source: R('svoystva-log'),
  },
  {
    id: '7-log-stepen',
    task: 7,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Чему равны $\\log_ab^m$ и $\\log_{a^k}b$?',
    back: '$\\log_ab^m=m\\log_ab$, $\\log_{a^k}b=\\dfrac{1}{k}\\log_ab$',
    pochemu: 'Множитель перед логарифмом уходит в показатель аргумента: $2\\log_53=\\log_59$.',
    level: E,
    source: R('svoystva-log'),
  },
  {
    id: '7-perehod',
    task: 7,
    topic: 'logarifmy',
    type: 'formula',
    front: 'Формула перехода к новому основанию для $\\log_ab$?',
    back: '$\\log_ab=\\dfrac{\\log_cb}{\\log_ca}$',
    pochemu: '$\\log_48=\\dfrac{\\log_28}{\\log_24}=\\dfrac32$.',
    level: B,
    source: R('svoystva-log'),
  },
  {
    id: '7-log-raznost-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Вычислите $\\log_354-\\log_32$.',
    back: '$\\log_354-\\log_32=\\log_3\\dfrac{54}{2}=\\log_327=3$',
    otvet: '3',
    proverka: () => log(3, 54) - log(3, 2),
    level: B,
    source: R('svoystva-log'),
  },
  {
    id: '7-log-chislo-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\log_2(x+3)=5$.',
    back: 'По определению: $x+3=2^5=32$, $x=29$',
    otvet: '29',
    proverka: () =>
      koren(
        2 ** 5 - 3,
        (x) => log(2, x + 3),
        () => 5,
      ),
    level: B,
    source: K('log-chislo'),
  },
  {
    id: '7-log-drob-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\log_{\\frac13}(x-1)=-2$.',
    back: '$x-1=\\left(\\dfrac13\\right)^{-2}=3^2=9$, $x=10$',
    otvet: '10',
    proverka: () =>
      koren(
        (1 / 3) ** -2 + 1,
        (x) => log(1 / 3, x - 1),
        () => -2,
      ),
    level: E,
    source: K('log-drob'),
  },
  {
    id: '7-log-ravny-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Найдите корень уравнения $\\log_5(2x-1)=\\log_5(x+4)$.',
    back: '$2x-1=x+4$, $x=5$. Аргумент $x+4=9>0$ — подходит.',
    otvet: '5',
    proverka: () =>
      koren(
        4 + 1,
        (x) => log(5, 2 * x - 1),
        (x) => log(5, x + 4),
      ),
    level: B,
    source: K('log-ravny'),
  },
  {
    id: '7-log-stepeni-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front: 'Вычислите $\\log_48$.',
    back: '$4=2^2$, $8=2^3$: $\\log_{2^2}2^3=\\dfrac32=1{,}5$',
    otvet: '1,5',
    proverka: () => log(4, 8),
    level: E,
    source: K('log-stepeni'),
  },
  {
    id: '7-osnovanie-x-v',
    task: 7,
    topic: 'logarifmy',
    type: 'vychislenie',
    front:
      'Решите уравнение $\\log_{x-2}49=2$. Если уравнение имеет более одного корня, укажите меньший из них.',
    back: '$(x-2)^2=49$, $x-2=\\pm7$: $x=9$ или $x=-5$. При $x=-5$ основание $-7<0$ — посторонний. Ответ: $9$',
    otvet: '9',
    proverka: () => {
      const svoi = [2 + 7, 2 - 7].filter(
        (x) =>
          !Number.isNaN(
            koren(
              x,
              (t) => log(t - 2, 49),
              () => 2,
            ),
          ),
      );
      return svoi.length === 1 && svoi[0] !== undefined ? svoi[0] : NaN;
    },
    level: E,
    source: K('log-osnovanie-x'),
  },
  {
    id: '7-odz-log-l',
    task: 7,
    topic: 'logarifmy',
    type: 'verno',
    front: '$\\log_20=0$',
    verno: false,
    back: 'Неверно: $\\log_20$ не существует — аргумент логарифма **строго** больше нуля. Нулю равен $\\log_21$.',
    level: E,
    source: R('odz-log'),
  },

  /* ── Тригонометрические ── */
  {
    id: '7-krug-ch',
    task: 7,
    topic: 'trigonometriya',
    type: 'chertezh',
    front: 'На единичной окружности отмечена точка угла $\\dfrac{\\pi}{3}$. Каковы её координаты?',
    back: '$\\left(\\cos\\dfrac{\\pi}{3};\\ \\sin\\dfrac{\\pi}{3}\\right)=\\left(\\dfrac12;\\ \\dfrac{\\sqrt3}{2}\\right)$',
    pochemu: 'Косинус — абсцисса точки, синус — ордината.',
    figure: {
      dvizhok: 'graph',
      scena: krug([[1, 3]], 'Единичная окружность, отмечена точка угла «пи на три»'),
    },
    level: B,
    source: R('okruzhnost'),
  },
  {
    id: '7-krug-sin-ch',
    task: 7,
    topic: 'trigonometriya',
    type: 'chertezh',
    front:
      'Отмечены точки окружности с ординатой $\\dfrac12$. Решения какого уравнения это? Запишите серии.',
    back: '$\\sin x=\\dfrac12$: $x=\\dfrac{\\pi}{6}+2\\pi n$ или $x=\\dfrac{5\\pi}{6}+2\\pi n$, $n\\in\\mathbb{Z}$',
    pochemu: 'Вторая серия — $\\pi-\\arcsin a$.',
    figure: {
      dvizhok: 'graph',
      scena: krug(
        [
          [1, 6],
          [5, 6],
        ],
        'Единичная окружность, горизонтальная прямая на высоте одна вторая и две точки на ней: углы «пи на шесть» и «пять пи на шесть»',
        0.5,
      ),
    },
    level: E,
    source: K('sin'),
  },
  {
    id: '7-znacheniya-l',
    task: 7,
    topic: 'trigonometriya',
    type: 'verno',
    front: '$\\sin\\dfrac{\\pi}{6}=\\dfrac{\\sqrt3}{2}$',
    verno: false,
    back: 'Неверно: $\\sin\\dfrac{\\pi}{6}=\\dfrac12$. Значение $\\dfrac{\\sqrt3}{2}$ — у $\\sin\\dfrac{\\pi}{3}$ и $\\cos\\dfrac{\\pi}{6}$.',
    level: B,
    source: R('znacheniya'),
  },
  {
    id: '7-sin',
    task: 7,
    topic: 'trigonometriya',
    type: 'formula',
    front: 'Решения уравнения $\\sin\\alpha=a$ при $|a|\\le1$?',
    back: '$\\alpha=\\arcsin a+2\\pi n$ или $\\alpha=\\pi-\\arcsin a+2\\pi n$, $n\\in\\mathbb{Z}$',
    pochemu: 'Две точки окружности с ординатой $a$.',
    level: E,
    source: K('sin'),
  },
  {
    id: '7-cos',
    task: 7,
    topic: 'trigonometriya',
    type: 'formula',
    front: 'Решения уравнения $\\cos\\alpha=a$ при $|a|\\le1$?',
    back: '$\\alpha=\\pm\\arccos a+2\\pi n$, $n\\in\\mathbb{Z}$',
    pochemu: 'Две точки с абсциссой $a$, симметричные относительно $Ox$.',
    level: E,
    source: K('cos'),
  },
  {
    id: '7-tg',
    task: 7,
    topic: 'trigonometriya',
    type: 'formula',
    front: 'Решения уравнения $\\operatorname{tg}\\alpha=a$?',
    back: '$\\alpha=\\operatorname{arctg}a+\\pi n$, $n\\in\\mathbb{Z}$',
    pochemu: 'При любом $a$ — одна серия, период $\\pi$.',
    level: B,
    source: K('tg'),
  },
  {
    id: '7-sin-1-l',
    task: 7,
    topic: 'trigonometriya',
    type: 'verno',
    front: 'У уравнения $\\sin\\alpha=1$ две серии решений.',
    verno: false,
    back: 'Неверно: частный случай — одна серия, $\\alpha=\\dfrac{\\pi}{2}+2\\pi n$: точка с ординатой $1$ на окружности одна.',
    level: E,
    source: K('sin'),
  },
  {
    id: '7-cos-net',
    task: 7,
    topic: 'trigonometriya',
    type: 'verno',
    front: 'Уравнение $\\cos x=1{,}5$ не имеет решений.',
    verno: true,
    back: 'Верно: косинус — абсцисса точки единичной окружности, $|\\cos x|\\le1$.',
    level: B,
    source: K('cos'),
  },
  {
    id: '7-perebor-v',
    task: 7,
    topic: 'trigonometriya',
    type: 'vychislenie',
    front: 'Найдите наибольший отрицательный корень уравнения $\\cos\\dfrac{\\pi x}{3}=\\dfrac12$.',
    back: '$\\dfrac{\\pi x}{3}=\\pm\\dfrac{\\pi}{3}+2\\pi n$, $x=\\pm1+6n$. Отрицательные: $-1$, $-5$, $-7$, … Наибольший: $-1$',
    otvet: '-1',
    proverka: () => {
      const korni = [...seriya(1, 6), ...seriya(-1, 6)].filter(
        (x) => Math.abs(Math.cos((Math.PI * x) / 3) - 0.5) < EPS,
      );
      return Math.max(...korni.filter((x) => x < 0));
    },
    level: E,
    source: K('perebor'),
  },
  {
    id: '7-perebor-tg-v',
    task: 7,
    topic: 'trigonometriya',
    type: 'vychislenie',
    front:
      'Найдите наименьший положительный корень уравнения $\\operatorname{tg}\\dfrac{\\pi x}{4}=-1$.',
    back: '$\\dfrac{\\pi x}{4}=-\\dfrac{\\pi}{4}+\\pi n$, $x=-1+4n$. При $n=1$: $x=3$',
    otvet: '3',
    proverka: () => {
      const korni = seriya(-1, 4).filter((x) => Math.abs(Math.tan((Math.PI * x) / 4) + 1) < 1e-7);
      return Math.min(...korni.filter((x) => x > 0));
    },
    level: E,
    source: K('perebor'),
  },
  {
    id: '7-nol-l',
    task: 7,
    topic: 'trigonometriya',
    type: 'verno',
    front: 'Если среди корней есть $0$, он и есть наименьший положительный корень.',
    verno: false,
    back: 'Неверно: ноль — не положительный и не отрицательный. Наименьший положительный — первый корень справа от нуля.',
    level: E,
    source: K('perebor'),
  },
];

/* ── Проверки формул: случайные числа ── */

const proverki: ProverkaFormuly[] = [
  {
    /* Произведение равно нулю ровно тогда, когда нулю равен множитель. */
    kartochka: '7-proizvedenie',
    sluchay: (rnd) => {
      const A = rnd() < 0.4 ? 0 : tseloe(rnd);
      const Bm = rnd() < 0.4 ? 0 : tseloe(rnd);
      return { poFormule: A === 0 || Bm === 0 ? 1 : 0, pryamo: A * Bm === 0 ? 1 : 0 };
    },
  },
  {
    /* Корень по формуле подставляем в уравнение. */
    kartochka: '7-lineynoe',
    sluchay: (rnd) => {
      const k = ot(rnd, 0.5, 9) * (rnd() < 0.5 ? -1 : 1);
      const b = ot(rnd, -20, 20);
      const c = ot(rnd, -20, 20);
      const x = (c - b) / k;
      return { poFormule: k * x + b, pryamo: c };
    },
  },
  {
    kartochka: '7-proporciya',
    sluchay: (rnd) => {
      const a = ot(rnd, -9, 9);
      const b = ot(rnd, 0.5, 9);
      const d = ot(rnd, 0.5, 9);
      const c = (a * d) / b;
      return { poFormule: a / b, pryamo: c / d };
    },
  },
  {
    kartochka: '7-nechetnaya',
    sluchay: (rnd) => {
      const n = 2 * Math.floor(rnd() * 4) + 1;
      const a = ot(rnd, -10, 10);
      const b = ot(rnd, -1000, 1000);
      const x = -a + Math.sign(b) * Math.abs(b) ** (1 / n);
      return { poFormule: (x + a) ** n, pryamo: b };
    },
  },
  {
    /* Равенство квадратов — то же, что A = B или A = −B (B иногда ±A). */
    kartochka: '7-ravnye-kvadraty',
    sluchay: (rnd) => {
      const A = tseloe(rnd);
      const vybor = rnd();
      const Bv = vybor < 0.33 ? A : vybor < 0.66 ? -A : tseloe(rnd);
      return {
        poFormule: A === Bv || A === -Bv ? 1 : 0,
        pryamo: A * A === Bv * Bv ? 1 : 0,
      };
    },
  },
  {
    /* Оба корня подставляем в трёхчлен. */
    kartochka: '7-diskriminant',
    sluchay: (rnd) => {
      const r1 = ot(rnd, -10, 10);
      const r2 = ot(rnd, -10, 10);
      const a = ot(rnd, 0.5, 5) * (rnd() < 0.5 ? -1 : 1);
      const b = -a * (r1 + r2);
      const c = a * r1 * r2;
      const f = (x: number) => a * x * x + b * x + c;
      const korni = korniKv(a, b, c);
      return {
        poFormule:
          korni.length === 2 ? Math.abs(f(korni[0] ?? NaN)) + Math.abs(f(korni[1] ?? NaN)) : NaN,
        pryamo: 0,
      };
    },
  },
  {
    kartochka: '7-vieta',
    sluchay: (rnd) => {
      const p = ot(rnd, -20, 20);
      const q = ot(rnd, -50, (p * p) / 4);
      const [x1 = NaN, x2 = NaN] = korniKv(1, p, q);
      return { poFormule: -p, pryamo: x1 + x2 };
    },
  },
  {
    kartochka: '7-vieta',
    sluchay: (rnd) => {
      const p = ot(rnd, -20, 20);
      const q = ot(rnd, -50, (p * p) / 4);
      const [x1 = NaN, x2 = NaN] = korniKv(1, p, q);
      return { poFormule: q, pryamo: x1 * x2 };
    },
  },
  {
    /* f = a² + случайная константа: корень f(x) = a² подставляем обратно. */
    kartochka: '7-koren-chislo',
    sluchay: (rnd) => {
      const a = ot(rnd, 0, 12);
      const k = ot(rnd, 0.5, 5);
      const m = ot(rnd, -10, 10);
      const x = (a * a - m) / k;
      return { poFormule: Math.sqrt(k * x + m), pryamo: a };
    },
  },
  {
    /* Свой корень (g ≥ 0) — решение исходного; «чужой» (g < 0) — нет. */
    kartochka: '7-koren-x',
    sluchay: (rnd) => {
      const r1 = tseloe(rnd) + 6;
      const r2 = -1 - Math.floor(rnd() * 6);
      /* √f = x, где f = x² − (x − r1)(x − r2): f(r) = r² в обоих корнях. */
      const f = (x: number) => x * x - (x - r1) * (x - r2);
      const svoi = [r1, r2].filter((x) => x >= 0);
      const reshayut = [r1, r2].filter((x) => f(x) >= 0 && Math.abs(Math.sqrt(f(x)) - x) < EPS);
      /* Наборы корней сравниваем числом: 1000 · сколько + сумма. */
      const kod = (k: number[]) => 1000 * k.length + k.reduce((a, b) => a + b, 0);
      return { poFormule: kod(svoi), pryamo: kod(reshayut) };
    },
  },
  {
    kartochka: '7-koren-koren',
    sluchay: (rnd) => {
      /* f(x) = kx + m, g(x) = lx + s пересекаются в x₀; корень есть, только если f(x₀) ≥ 0. */
      const k = ot(rnd, 1, 4);
      const l = k + ot(rnd, 0.5, 3);
      const m = ot(rnd, -10, 10);
      const s = ot(rnd, -10, 10);
      const x0 = (m - s) / (l - k);
      const f0 = k * x0 + m;
      const g0 = l * x0 + s;
      const poSisteme = f0 >= 0 ? 1 : 0;
      const sushchestvuet =
        f0 >= 0 && g0 >= 0 && Math.abs(Math.sqrt(f0) - Math.sqrt(g0)) < EPS ? 1 : 0;
      return { poFormule: poSisteme, pryamo: sushchestvuet };
    },
  },
  {
    kartochka: '7-stepeni',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const m = ot(rnd, -3, 3);
      const n = ot(rnd, -3, 3);
      return { poFormule: a ** (m + n), pryamo: a ** m * a ** n };
    },
  },
  {
    kartochka: '7-stepeni',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const m = ot(rnd, -3, 3);
      const n = ot(rnd, -3, 3);
      return { poFormule: a ** (m - n), pryamo: a ** m / a ** n };
    },
  },
  {
    kartochka: '7-stepeni',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const m = ot(rnd, -2, 2);
      const n = ot(rnd, -2, 2);
      return { poFormule: a ** (m * n), pryamo: (a ** m) ** n };
    },
  },
  {
    kartochka: '7-otr-stepen',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const n = 1 + Math.floor(rnd() * 5);
      return { poFormule: 1 / a ** n, pryamo: a ** -n };
    },
  },
  {
    /* a^(m/n) — число, n-я степень которого равна a^m. */
    kartochka: '7-otr-stepen',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const m = 1 + Math.floor(rnd() * 5);
      const n = 1 + Math.floor(rnd() * 5);
      return { poFormule: (a ** (m / n)) ** n, pryamo: a ** m };
    },
  },
  {
    /* Равенство степеней — равенство показателей (показатели иногда равны). */
    kartochka: '7-pokazateli',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const Ep = tseloe(rnd);
      const Fp = rnd() < 0.5 ? Ep : tseloe(rnd);
      return {
        poFormule: Ep === Fp ? 1 : 0,
        pryamo: Math.abs(a ** Ep - a ** Fp) < 1e-12 * Math.max(1, a ** Ep) ? 1 : 0,
      };
    },
  },
  {
    kartochka: '7-log-opredelenie',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.01, 100);
      return { poFormule: a ** log(a, b), pryamo: b };
    },
  },
  {
    /* Тождество — через натуральный логарифм: a^(ln b / ln a) = e^(ln b). */
    kartochka: '7-tozhdestvo',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.01, 100);
      return { poFormule: Math.exp(Math.log(a) * log(a, b)), pryamo: b };
    },
  },
  {
    kartochka: '7-log-summa',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.01, 100);
      const c = ot(rnd, 0.01, 100);
      return { poFormule: log(a, b) + log(a, c), pryamo: log(a, b * c) };
    },
  },
  {
    kartochka: '7-log-summa',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.01, 100);
      const c = ot(rnd, 0.01, 100);
      return { poFormule: log(a, b) - log(a, c), pryamo: log(a, b / c) };
    },
  },
  {
    kartochka: '7-log-stepen',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.1, 20);
      const m = ot(rnd, -4, 4);
      return { poFormule: m * log(a, b), pryamo: log(a, b ** m) };
    },
  },
  {
    kartochka: '7-log-stepen',
    sluchay: (rnd) => {
      const a = ot(rnd, 1.2, 5);
      const b = ot(rnd, 0.1, 50);
      const k = 1 + Math.floor(rnd() * 4);
      return { poFormule: log(a, b) / k, pryamo: log(a ** k, b) };
    },
  },
  {
    kartochka: '7-perehod',
    sluchay: (rnd) => {
      const a = osnovanie(rnd);
      const b = ot(rnd, 0.01, 100);
      const c = osnovanie(rnd);
      /* Прямо — по определению: показатель t, при котором a^t = b. */
      const t = Math.log(b) / Math.log(a);
      return { poFormule: log(c, b) / log(c, a), pryamo: t };
    },
  },
  {
    /* Рисунок: точка угла π/3 — (1/2; √3/2). */
    kartochka: '7-krug-ch',
    sluchay: () => ({
      poFormule: 0.5 + 10 * (Math.sqrt(3) / 2),
      pryamo: Math.cos(Math.PI / 3) + 10 * Math.sin(Math.PI / 3),
    }),
  },
  {
    /* Серии рисунка: при любом n синус равен 1/2. */
    kartochka: '7-krug-sin-ch',
    sluchay: (rnd) => {
      const n = tseloe(rnd);
      const x = (rnd() < 0.5 ? Math.PI / 6 : (5 * Math.PI) / 6) + 2 * Math.PI * n;
      return { poFormule: Math.sin(x), pryamo: 0.5 };
    },
  },
  {
    kartochka: '7-sin',
    sluchay: (rnd) => {
      const a = ot(rnd, -1, 1);
      const n = tseloe(rnd);
      const x = (rnd() < 0.5 ? Math.asin(a) : Math.PI - Math.asin(a)) + 2 * Math.PI * n;
      return { poFormule: Math.sin(x), pryamo: a };
    },
  },
  {
    kartochka: '7-cos',
    sluchay: (rnd) => {
      const a = ot(rnd, -1, 1);
      const n = tseloe(rnd);
      const x = (rnd() < 0.5 ? 1 : -1) * Math.acos(a) + 2 * Math.PI * n;
      return { poFormule: Math.cos(x), pryamo: a };
    },
  },
  {
    kartochka: '7-tg',
    sluchay: (rnd) => {
      const a = ot(rnd, -20, 20);
      const n = tseloe(rnd);
      return { poFormule: Math.tan(Math.atan(a) + Math.PI * n), pryamo: a };
    },
  },
];

const KOLODA_7: Koloda = {
  task: 7,
  slug: '7',
  title: 'Простейшие уравнения',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'obshchee', title: 'Корень, ОДЗ и ответ' },
    { id: 'lineynye', title: 'Линейные и дробные' },
    { id: 'stepennye', title: 'Степенные' },
    { id: 'kvadratnye', title: 'Квадратные' },
    { id: 'irracionalnye', title: 'Иррациональные' },
    { id: 'pokazatelnye', title: 'Показательные' },
    { id: 'logarifmy', title: 'Логарифмы' },
    { id: 'trigonometriya', title: 'Тригонометрические' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_7;
