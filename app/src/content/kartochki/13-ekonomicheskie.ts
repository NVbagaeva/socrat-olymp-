/**
 * Карточки по теории задания №13 «Экономические задачи» (кредиты и
 * вклады).
 *
 * Колода идёт по главам вкладки «Теория» №13 (content/teoriya13.ts):
 * проценты и увеличивающий коэффициент, кредит простыми словами, две
 * схемы, дифференцированный платёж, «поломанный» платёж, аннуитет,
 * вклады, как определить тип задачи, ловушки и лайфхаки. `source` —
 * якорь страницы (lib/zadanie13/teoriya-yakorya.ts): карточка, таблица,
 * рисунок или блок признаков #t13-…. Обозначения — как в теории: $S$,
 * $n$, $r$, $k = 1 + \frac{r}{100}$, $x$ — платёж. Всё, что спрашивает
 * колода, в теории №13 написано — карточек «добавлено» нет.
 *
 * Числа — свои, не задачи банка. Ответ каждого вычисления
 * scripts/verify_cards пересчитывает заново — таблицей по периодам, как
 * её заполняют в теории (а не формулой из ответа); формулы проверяет на
 * случайных кредитах. Рисунки — столбики платежей движком чертежей
 * lib/graph.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { YAKOR_13 } from '@/lib/zadanie13/teoriya-yakorya';
import { nomerRazdela } from '@/content/struktura';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

const R = YAKOR_13.blok;

/* ── Счёт для проверок: таблица по периодам ── */

interface Stroka {
  /** Долг на начало периода. */
  nachalo: number;
  /** Переплата: проценты от долга на начало. */
  pereplata: number;
  /** Сумма изменения долга. */
  izmenenie: number;
  /** Платёж = изменение + переплата. */
  platezh: number;
  /** Долг на конец. */
  konec: number;
}

/**
 * Кредит по трём правилам таблицы: каждый период переплата — ставка
 * периода от долга на начало, долг уменьшается на заданную сумму.
 */
function tablitsa(S: number, izmeneniya: readonly number[], stavki: readonly number[]): Stroka[] {
  let dolg = S;
  return izmeneniya.map((izm, i) => {
    const r = stavki[i] ?? (stavki[stavki.length - 1] as number);
    const pereplata = (dolg * r) / 100;
    const stroka = {
      nachalo: dolg,
      pereplata,
      izmenenie: izm,
      platezh: izm + pereplata,
      konec: dolg - izm,
    };
    dolg -= izm;
    return stroka;
  });
}

/** Дифференцированный платёж: долг уменьшается на S/n каждый период. */
const dif = (S: number, n: number, r: number) =>
  tablitsa(
    S,
    Array.from({ length: n }, () => S / n),
    [r],
  );

const summa = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);

/** Аннуитет и вклад: начислили (·k), потом вычли платёж (или прибавили пополнение). */
function tsepochka(S: number, k: number, platezhi: readonly number[]): number {
  return platezhi.reduce((dolg, x) => dolg * k - x, S);
}

/** Случайное число из [lo; hi). */
const ot = (rnd: () => number, lo: number, hi: number) => lo + rnd() * (hi - lo);
/** Целое из [lo; hi]. */
const tseloe = (rnd: () => number, lo: number, hi: number) =>
  lo + Math.floor(rnd() * (hi - lo + 1));

/**
 * Платёж аннуитета подбором: долг после n платежей монотонно убывает
 * с ростом платежа, ноль ищем делением отрезка пополам — без формулы.
 */
function platezhPodborom(S: number, k: number, n: number): number {
  let lo = 0;
  let hi = S * k ** n;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (
      tsepochka(
        S,
        k,
        Array.from({ length: n }, () => mid),
      ) > 0
    )
      lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/* ── Рисунки: столбики платежей, движок чертежей lib/graph ── */

/**
 * Сцена без осей: окно сдвинуто от нуля дальше поля чертежа, поэтому
 * оси движка остаются за краем рисунка (как у колоды №11).
 */
function bezOsey(
  okno: { xmin: number; xmax: number; ymin: number; ymax: number },
  shapes: unknown[],
  alt: string,
): () => Record<string, unknown> {
  return () => ({
    window: okno,
    cell: 30,
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
const MASSHTAB = 2;

/** Столбики: внизу сумма изменения долга (синий), сверху переплата (оранжевый). */
function stolbiki(stroki: readonly Stroka[], alt: string): () => Record<string, unknown> {
  const shir = 0.7;
  const shag = 1.05;
  const pryam = (x: number, y0: number, y1: number, color: string) => ({
    type: 'polygon',
    points: [
      [x, y0],
      [x + shir, y0],
      [x + shir, y1],
      [x, y1],
    ],
    color,
    fillOpacity: 0.85,
  });
  const shapes: unknown[] = [];
  stroki.forEach((s, i) => {
    const x = X0 + 0.4 + i * shag;
    const hIzm = s.izmenenie * MASSHTAB;
    const hPer = s.pereplata * MASSHTAB;
    shapes.push(pryam(x, Y0, Y0 + hIzm, 'lineA'));
    shapes.push(pryam(x, Y0 + hIzm, Y0 + hIzm + hPer, 'lineB'));
  });
  const konec = X0 + 0.4 + stroki.length * shag;
  shapes.push({ type: 'segment', from: [X0, Y0], to: [konec, Y0], color: 'axis', width: 2 });
  const verh = Math.max(...stroki.map((s) => s.platezh)) * MASSHTAB;
  return bezOsey(
    { xmin: X0 - 0.3, xmax: konec + 0.3, ymin: Y0 - 0.4, ymax: Y0 + verh + 0.4 },
    shapes,
    alt,
  );
}

/* Как на рисунке теории: кредит 8 на 8 месяцев под 10 %. */
const RIS_DIF = stolbiki(
  dif(8, 8, 10),
  'Восемь столбиков-платежей: нижняя часть у всех одинаковая, верхняя каждый месяц меньше, поэтому платежи убывают',
);
const RIS_ANN = stolbiki(
  (() => {
    const k = 1.1;
    const x = platezhPodborom(8, k, 8);
    let dolg = 8;
    return Array.from({ length: 8 }, () => {
      const pereplata = dolg * (k - 1);
      const s = {
        nachalo: dolg,
        pereplata,
        izmenenie: x - pereplata,
        platezh: x,
        konec: dolg - (x - pereplata),
      };
      dolg = s.konec;
      return s;
    });
  })(),
  'Восемь столбиков-платежей одной высоты: нижняя часть от месяца к месяцу растёт, верхняя уменьшается',
);

/* ── Карточки ── */

const kartochki: Kartochka[] = [
  /* ── Проценты и увеличивающий коэффициент ── */
  {
    id: '13-oboznacheniya',
    task: 13,
    topic: 'procenty',
    type: 'svoystvo',
    front: `Что в разборах №${nomerRazdela('ekonomika')} обозначают $x$ и $X$?`,
    back: '$x$ — **платёж** (у вклада — снятие). $X$ — **на сколько уменьшается долг**, если эта сумма неизвестна. Это разные числа.',
    pochemu:
      'Остальные буквы тоже одни на все разборы: $S$ — кредит, $n$ — срок, $r\\,\\%$ — ставка.',
    level: B,
    source: R('oboznacheniya'),
  },
  {
    id: '13-procent',
    task: 13,
    topic: 'procenty',
    type: 'svoystvo',
    front: 'Что такое $1\\,\\%$ числа? Что такое $100\\,\\%$?',
    back: '$1\\,\\%$ — **одна сотая часть** числа, $100\\,\\%$ — всё число целиком.',
    pochemu: '$50\\,\\%$ — половина, $25\\,\\%$ — четверть.',
    level: B,
    source: R('procent'),
  },
  {
    id: '13-sto-procentov',
    task: 13,
    topic: 'procenty',
    type: 'svoystvo',
    front: 'Что принимаем за $100\\,\\%$ в вопросе «на сколько процентов больше»?',
    back: 'То, **с чем сравниваем**, — то, что стоит после слова «чем».',
    pochemu: 'Нет «чем» в вопросе — добавь его мысленно: «больше, **чем** кредит».',
    level: E,
    source: R('sto-procentov'),
  },
  {
    id: '13-na-skolko-v',
    task: 13,
    topic: 'procenty',
    type: 'vychislenie',
    front:
      'Кредит — $400$ тыс. рублей, вернули $520$ тыс. На сколько процентов выплаты больше кредита?',
    back: '$100\\,\\%$ — кредит $400$. Пропорция: $?=\\dfrac{520\\cdot100}{400}=130\\,\\%$, то есть больше на $130-100=30\\,\\%$.',
    otvet: '30',
    proverka: () => ((520 - 400) / 400) * 100,
    level: B,
    source: R('proporciya'),
  },
  {
    id: '13-k',
    task: 13,
    topic: 'procenty',
    type: 'formula',
    front: 'Увеличивающий коэффициент $k$ при ставке $r\\,\\%$?',
    back: '$k=1+\\dfrac{r}{100}$',
    pochemu: 'Было $100\\,\\%$, стало $(100+r)\\,\\%$: увеличить на $r\\,\\%$ — умножить на $k$.',
    level: B,
    source: R('koeffitsient'),
  },
  {
    id: '13-k-v',
    task: 13,
    topic: 'procenty',
    type: 'vychislenie',
    front: 'Ставка $12{,}5\\,\\%$. Чему равен увеличивающий коэффициент $k$?',
    back: '$k=1+\\dfrac{12{,}5}{100}=1{,}125$.',
    otvet: '1,125',
    proverka: () => 1 + 12.5 / 100,
    level: B,
    source: R('koeffitsient'),
  },
  {
    id: '13-dva-nachisleniya-v',
    task: 13,
    topic: 'procenty',
    type: 'vychislenie',
    front:
      'Долг $2000$ рублей, банк начисляет $10\\,\\%$. Каким станет долг после двух начислений подряд, если ничего не платить?',
    back: 'Второй раз проценты начисляют уже на новый долг: $2000\\cdot1{,}1^2=2000\\cdot1{,}21=2420$ рублей.',
    otvet: '2420',
    proverka: () => {
      const posle1 = 2000 + (2000 * 10) / 100;
      return posle1 + (posle1 * 10) / 100;
    },
    level: B,
    source: R('koeffitsient'),
  },
  {
    id: '13-ne-skladyvat-l',
    task: 13,
    topic: 'procenty',
    type: 'verno',
    front: 'Цену снизили на $20\\,\\%$, потом подняли на $20\\,\\%$ — она вернулась к прежней.',
    verno: false,
    back: 'Неверно: каждое изменение считается от своего «$100\\,\\%$». $0{,}8\\cdot1{,}2=0{,}96$ — цена стала на $4\\,\\%$ меньше.',
    level: E,
    source: R('ne-skladyvat'),
  },
  {
    id: '13-dzhinsy-v',
    task: 13,
    topic: 'procenty',
    type: 'vychislenie',
    front:
      'Товар стоил $2000$ ₽. Цену подняли на $50\\,\\%$, потом снизили на $50\\,\\%$. Сколько рублей стоит товар?',
    back: '$2000\\cdot1{,}5=3000$, затем $100\\,\\%$ — это уже $3000$: $3000\\cdot0{,}5=1500$ ₽.',
    otvet: '1500',
    proverka: () => {
      const posle = 2000 + 2000 * 0.5;
      return posle - posle * 0.5;
    },
    level: B,
    source: R('ne-skladyvat'),
  },
  {
    id: '13-umenshit-l',
    task: 13,
    topic: 'procenty',
    type: 'verno',
    front: 'Уменьшить число на $20\\,\\%$ — значит разделить его на $1{,}2$.',
    verno: false,
    back: 'Неверно: уменьшить на $20\\,\\%$ — умножить на $1-0{,}2=0{,}8$. А $\\dfrac{1}{1{,}2}\\approx0{,}83$.',
    level: E,
    source: R('umenshit'),
  },
  {
    id: '13-k-drobyu',
    task: 13,
    topic: 'procenty',
    type: 'svoystvo',
    front: 'Как удобно записать $k=1{,}25$, $1{,}2$ и $1{,}125$, чтобы не умножать столбиком?',
    back: '**Обыкновенной дробью:** $1{,}25=\\dfrac54$, $1{,}2=\\dfrac65$, $1{,}125=\\dfrac98$.',
    pochemu: 'Тогда умножение превращается в сокращение.',
    level: B,
    source: R('k-drobyu'),
  },
  {
    id: '13-drob-v',
    task: 13,
    topic: 'procenty',
    type: 'vychislenie',
    front: 'Найдите $3600\\cdot1{,}125$.',
    back: '$1{,}125=\\dfrac98$, $3600$ делится на $8$: $3600\\cdot\\dfrac98=450\\cdot9=4050$.',
    otvet: '4050',
    proverka: () => 3600 * 1.125,
    level: B,
    source: R('k-drobyu'),
  },

  /* ── Кредит простыми словами ── */
  {
    id: '13-kredit',
    task: 13,
    topic: 'slova',
    type: 'svoystvo',
    front: 'Что происходит с кредитом каждый период (месяц или год)?',
    back: 'Банк **начисляет проценты** на долг, а заёмщик **вносит платёж** — пока долг не станет нулём.',
    level: B,
    source: R('kredit'),
  },
  {
    id: '13-pereplata-mesyac',
    task: 13,
    topic: 'slova',
    type: 'formula',
    front: 'Переплата за один месяц?',
    back: 'переплата $=$ долг на начало $\\cdot\\dfrac{r}{100}$',
    pochemu: 'Переплата — деньги сверх того, что взяли: проценты от долга на начало месяца.',
    level: B,
    source: R('pereplata'),
  },
  {
    id: '13-izmenenie-l',
    task: 13,
    topic: 'slova',
    type: 'verno',
    front: 'Если сложить суммы изменения долга за весь срок, получится сумма кредита $S$.',
    verno: true,
    back: 'Верно: долг уменьшился с $S$ до нуля — на $S$ целиком.',
    level: B,
    source: R('izmenenie'),
  },
  {
    id: '13-dolg-na-konec',
    task: 13,
    topic: 'slova',
    type: 'formula',
    front: 'Долг на конец месяца?',
    back: 'долг на конец $=$ долг на начало $-$ сумма изменения долга',
    pochemu: 'Долг на конец этого месяца — долг на начало следующего.',
    level: B,
    source: R('dolg-na-konec'),
  },
  {
    id: '13-dolg-v',
    task: 13,
    topic: 'slova',
    type: 'vychislenie',
    front:
      'Долг на начало месяца $900$ рублей, ставка $10\\,\\%$ в месяц, долг уменьшается на $150$ рублей. Каким будет долг на конец месяца?',
    back: '$900-150=750$ рублей. Переплату не вычитаем: она уходит банку, долг уменьшает только сумма изменения.',
    otvet: '750',
    proverka: () => (tablitsa(900, [150], [10])[0] as Stroka).konec,
    level: E,
    source: R('dolg-na-konec'),
  },
  {
    id: '13-platezh',
    task: 13,
    topic: 'slova',
    type: 'formula',
    front: 'Из чего состоит платёж месяца?',
    back: 'платёж $=$ сумма изменения долга $+$ переплата',
    level: B,
    source: R('platezh'),
  },
  {
    id: '13-platezh-v',
    task: 13,
    topic: 'slova',
    type: 'vychislenie',
    front:
      'Долг на начало $1200$ рублей, ставка $5\\,\\%$ в месяц, долг уменьшается на $300$ рублей. Какой платёж?',
    back: 'Переплата: $1200\\cdot\\dfrac{5}{100}=60$. Платёж: $300+60=360$ рублей.',
    otvet: '360',
    proverka: () => (tablitsa(1200, [300], [5])[0] as Stroka).platezh,
    level: B,
    source: R('platezh'),
  },
  {
    id: '13-vernut',
    task: 13,
    topic: 'slova',
    type: 'formula',
    front: 'Сколько всего вернули банку за весь срок?',
    back: '$S_{\\text{общ}}=S+S_{\\text{перепл}}$',
    pochemu: 'Каждый платёж — изменение долга плюс переплата; сумма изменений — весь кредит $S$.',
    level: E,
    source: R('vernut'),
  },
  {
    id: '13-vernut-v',
    task: 13,
    topic: 'slova',
    type: 'vychislenie',
    front:
      'Кредит $2000$ рублей на $4$ месяца под $5\\,\\%$ в месяц, долг каждый месяц уменьшается на одну и ту же сумму. Сколько рублей вернули банку?',
    back: 'Долги на начало: $2000$, $1500$, $1000$, $500$. Переплата: $0{,}05\\cdot5000=250$. Вернули $2000+250=2250$ рублей.',
    otvet: '2250',
    proverka: () => summa(dif(2000, 4, 5).map((s) => s.platezh)),
    level: B,
    source: R('petya'),
  },
  {
    id: '13-lov-vernut-l',
    task: 13,
    topic: 'slova',
    type: 'verno',
    front: '«Сколько вернули банку» и «сколько переплатили» — один и тот же вопрос.',
    verno: false,
    back: 'Неверно: вернули $S_{\\text{общ}}=S+S_{\\text{перепл}}$, а переплатили только $S_{\\text{перепл}}$. Читай вопрос до конца.',
    level: E,
    source: R('lov-vernut'),
  },

  /* ── Две схемы кредита ── */
  {
    id: '13-dif-slovami',
    task: 13,
    topic: 'shemy',
    type: 'svoystvo',
    front: 'Дифференцированный платёж: что одинаковое каждый месяц, а что меняется?',
    back: 'Одинаковая **сумма изменения долга**. Переплата уменьшается вместе с долгом, поэтому платежи становятся всё меньше.',
    level: B,
    source: R('dif-slovami'),
  },
  {
    id: '13-ann-slovami',
    task: 13,
    topic: 'shemy',
    type: 'svoystvo',
    front: 'Аннуитет: что одинаковое весь срок и что меняется внутри платежа?',
    back: '**Платежи равные.** В начале большая часть платежа — переплата, к концу — основной долг.',
    level: B,
    source: R('ann-slovami'),
  },
  {
    id: '13-ann-l',
    task: 13,
    topic: 'shemy',
    type: 'verno',
    front: 'При аннуитете платежи уменьшаются от месяца к месяцу.',
    verno: false,
    back: 'Неверно: при аннуитете платежи равные. Уменьшаются платежи при дифференцированном платеже.',
    level: B,
    source: R('ann-slovami'),
  },
  {
    id: '13-ris-dif',
    task: 13,
    topic: 'shemy',
    type: 'chertezh',
    front:
      'Столбик — платёж месяца: внизу сумма изменения долга, сверху переплата. Какая схема кредита на рисунке?',
    back: '**Дифференцированный платёж:** нижняя часть одинаковая (долг уменьшается на одну и ту же величину), переплата и платежи убывают.',
    figure: { dvizhok: 'graph', scena: RIS_DIF },
    level: B,
    source: R('ris-dve-shemy'),
  },
  {
    id: '13-ris-ann',
    task: 13,
    topic: 'shemy',
    type: 'chertezh',
    front:
      'Столбик — платёж месяца: внизу сумма изменения долга, сверху переплата. Какая схема кредита на рисунке?',
    back: '**Аннуитет:** столбики одной высоты — платежи равные; переплата убывает, а доля основного долга растёт.',
    figure: { dvizhok: 'graph', scena: RIS_ANN },
    level: B,
    source: R('ris-dve-shemy'),
  },
  {
    id: '13-kak-uznat-l',
    task: 13,
    topic: 'shemy',
    type: 'verno',
    front:
      'В условии сказано: «долг должен быть на одну и ту же величину меньше долга на то же число предыдущего месяца». Это аннуитет.',
    verno: false,
    back: 'Неверно: сказано про **долг** — это дифференцированный платёж. Про **платежи** («равными платежами») — аннуитет.',
    level: E,
    source: R('kak-uznat'),
  },

  /* ── Дифференцированный платёж ── */
  {
    id: '13-tri-pravila',
    task: 13,
    topic: 'dif',
    type: 'svoystvo',
    front:
      'Три правила таблицы дифференцированного платежа (кредит $S$ на $n$ месяцев под $r\\,\\%$)?',
    back: '1) Сумма изменения долга $=\\dfrac{S}{n}$ — столбец одинаковый.\n2) Переплата $=$ долг на начало $\\cdot\\dfrac{r}{100}$.\n3) Долг на конец $=$ долг на начало $-$ сумма изменения; он же долг на начало следующего месяца.',
    level: E,
    source: R('tri-pravila'),
  },
  {
    id: '13-izmenenie-v',
    task: 13,
    topic: 'dif',
    type: 'vychislenie',
    front:
      'Кредит $9000$ рублей на $3$ месяца под $4\\,\\%$ в месяц, дифференцированный платёж. Найдите переплату за 2-й месяц.',
    back: 'Сумма изменения $9000:3=3000$, долг на начало 2-го месяца $9000-3000=6000$. Переплата $6000\\cdot\\dfrac{4}{100}=240$ рублей.',
    otvet: '240',
    proverka: () => (dif(9000, 3, 4)[1] as Stroka).pereplata,
    level: B,
    source: R('tri-pravila'),
  },
  {
    id: '13-dolg-nachalo',
    task: 13,
    topic: 'dif',
    type: 'formula',
    front: 'Дифференцированный платёж, кредит $S$ на $n$ месяцев. Долг на начало $i$-го месяца?',
    back: '$\\dfrac{(n-i+1)\\,S}{n}$',
    pochemu:
      'До $i$-го месяца долг уменьшился $i-1$ раз на $\\dfrac{S}{n}$: $S,\\ \\dfrac{(n-1)S}{n},\\ \\dots,\\ \\dfrac{S}{n}$.',
    level: E,
    source: R('tablitsa-dif'),
  },
  {
    id: '13-platezh-mesyaca-v',
    task: 13,
    topic: 'dif',
    type: 'vychislenie',
    front:
      'Кредит $1200$ тыс. рублей на $12$ месяцев под $3\\,\\%$ в месяц, дифференцированный платёж. Найдите платёж 5-го месяца (тыс. рублей).',
    back: 'Сумма изменения $1200:12=100$. Долг на начало 5-го месяца $1200-4\\cdot100=800$, переплата $800\\cdot0{,}03=24$. Платёж $100+24=124$ тыс.',
    otvet: '124',
    proverka: () => (dif(1200, 12, 3)[4] as Stroka).platezh,
    level: E,
    source: R('tablitsa-dif'),
  },
  {
    id: '13-summa-dolgov',
    task: 13,
    topic: 'dif',
    type: 'formula',
    front: 'Сумма долгов на начало всех $n$ месяцев при дифференцированном платеже?',
    back: '$\\dfrac{S+\\frac{S}{n}}{2}\\cdot n=\\dfrac{S(n+1)}{2}$',
    pochemu:
      'Долги на начало — арифметическая прогрессия: полусумма первого и последнего членов, умноженная на их число.',
    level: E,
    source: R('formula-dif'),
  },
  {
    id: '13-pereplata-dif',
    task: 13,
    topic: 'dif',
    type: 'formula',
    front: 'Переплата при дифференцированном платеже?',
    back: '$S_{\\text{перепл}}=S\\cdot\\dfrac{n+1}{2}\\cdot\\dfrac{r}{100}$',
    pochemu: 'Переплата — $r\\,\\%$ от суммы всех долгов на начало. Вывод на экзамене обязателен.',
    level: E,
    source: R('formula-dif'),
  },
  {
    id: '13-pereplata-dif-v',
    task: 13,
    topic: 'dif',
    type: 'vychislenie',
    front:
      'Кредит $600$ тыс. рублей на $11$ месяцев под $2\\,\\%$ в месяц, дифференцированный платёж. Найдите переплату (тыс. рублей).',
    back: '$S_{\\text{перепл}}=600\\cdot\\dfrac{11+1}{2}\\cdot\\dfrac{2}{100}=600\\cdot6\\cdot0{,}02=72$ тыс.',
    otvet: '72',
    proverka: () => summa(dif(600, 11, 2).map((s) => s.pereplata)),
    level: B,
    source: R('formula-dif'),
  },
  {
    id: '13-n1-l',
    task: 13,
    topic: 'dif',
    type: 'verno',
    front: 'В формуле переплаты дифференцированного платежа стоит множитель $\\dfrac{n}{2}$.',
    verno: false,
    back: 'Неверно: $\\dfrac{n+1}{2}$. В сумме долгов на начало есть и первый долг $S$, и последний $\\dfrac{S}{n}$.',
    level: E,
    source: R('lov-n1'),
  },

  /* ── «Поломанный» дифференцированный платёж ── */
  {
    id: '13-po-kuskam',
    task: 13,
    topic: 'polomannyy',
    type: 'formula',
    front: 'Долг уменьшается не одной ровной лесенкой. Сколько вернуть банку при ставке $r\\,\\%$?',
    back: '$S_{\\text{общ}}=S+\\dfrac{r}{100}\\,(D_0+D_1+\\dots+D_{n-1})$',
    pochemu:
      'Три правила таблицы работают; сумму долгов на начало считаем по кускам, при разных ставках — каждый кусок со своей.',
    level: E,
    source: R('po-kuskam'),
  },
  {
    id: '13-dve-stavki-v',
    task: 13,
    topic: 'polomannyy',
    type: 'vychislenie',
    front:
      'Кредит $600$ тыс. рублей на $3$ года, долг каждый год уменьшается на $200$ тыс. Первый год ставка $10\\,\\%$, следующие два — $20\\,\\%$. Сколько вернуть банку (тыс. рублей)?',
    back: 'Долги на начало: $600$, $400$, $200$. Переплата $0{,}1\\cdot600+0{,}2\\cdot(400+200)=60+120=180$. Всего $600+180=780$ тыс.',
    otvet: '780',
    proverka: () => summa(tablitsa(600, [200, 200, 200], [10, 20, 20]).map((s) => s.platezh)),
    level: E,
    source: R('po-kuskam'),
  },
  {
    id: '13-po-kuskam-l',
    task: 13,
    topic: 'polomannyy',
    type: 'verno',
    front:
      'При «поломанном» платеже (две ставки, остаток одним платежом) сумма изменений долга за весь срок по-прежнему равна $S$.',
    verno: true,
    back: 'Верно: долг всё равно уменьшился с $S$ до нуля. Меняется только переплата — её считаем по кускам.',
    level: B,
    source: R('po-kuskam'),
  },
  {
    id: '13-periody',
    task: 13,
    topic: 'polomannyy',
    type: 'svoystvo',
    front:
      '«С 1-го по 20-й месяц долг на $30$ тыс. меньше, чем месяцем раньше, к 21-му погашен». Сколько периодов и сколько уменьшений на $30$ тыс.?',
    back: '**Периодов $21$, уменьшений $20$.** Долг после 20-го месяца — $S-20\\cdot30$, а не $S-21\\cdot30$.',
    level: E,
    source: R('lov-periody'),
  },
  {
    id: '13-periody-v',
    task: 13,
    topic: 'polomannyy',
    type: 'vychislenie',
    front:
      'Кредит $900$ тыс. рублей. С 1-го по 20-й месяц долг уменьшается на $30$ тыс. в месяц, в 21-м месяце погашается полностью. Каким будет долг после 20-го месяца (тыс. рублей)?',
    back: 'Уменьшений $20$: $900-20\\cdot30=300$ тыс. Его гасят одним платежом в 21-м месяце.',
    otvet: '300',
    proverka: () =>
      (
        tablitsa(
          900,
          Array.from({ length: 20 }, () => 30),
          [1],
        ).at(-1) as Stroka
      ).konec,
    level: E,
    source: R('lov-periody'),
  },
  {
    id: '13-kazhdaya',
    task: 13,
    topic: 'polomannyy',
    type: 'svoystvo',
    front:
      'Условие: «каждая выплата — целое число» или «каждая выплата не меньше …». Как его проверять?',
    back: 'Найти **все** выплаты и взять самое строгое ограничение.',
    level: E,
    source: R('lov-kazhdaya'),
  },

  /* ── Аннуитет ── */
  {
    id: '13-tsepochka',
    task: 13,
    topic: 'annuitet',
    type: 'formula',
    front: 'Аннуитет: как получить долг на конец года из долга на начало $D$ и платежа $x$?',
    back: 'долг на конец $=D\\cdot k-x$',
    pochemu: 'Сначала начисление — долг умножается на $k$, потом платёж вычитается.',
    level: B,
    source: R('tsepochka'),
  },
  {
    id: '13-dolg-ann-v',
    task: 13,
    topic: 'annuitet',
    type: 'vychislenie',
    front:
      'Долг на начало года $5000$ рублей, ставка $20\\,\\%$, платёж $2600$ рублей. Каким будет долг на конец года?',
    back: '$k=1{,}2$: долг после начисления $5000\\cdot1{,}2=6000$, на конец $6000-2600=3400$ рублей.',
    otvet: '3400',
    proverka: () => 5000 + (5000 * 20) / 100 - 2600,
    level: B,
    source: R('tsepochka'),
  },
  {
    id: '13-geom',
    task: 13,
    topic: 'annuitet',
    type: 'formula',
    front: 'Уравнение для $n$ равных платежей по $x$ после раскрытия скобок?',
    back: '$Sk^n=x\\,(k^{n-1}+k^{n-2}+\\dots+k+1)$',
    pochemu:
      '$S$ доживает до конца с множителем $k^n$, а каждый платёж — с $k$ в степени «сколько лет прошло после него».',
    level: E,
    source: R('geom'),
  },
  {
    id: '13-tri-platezha',
    task: 13,
    topic: 'annuitet',
    type: 'formula',
    front: 'Кредит $S$ погашают тремя равными платежами. Платёж $x$?',
    back: '$x=\\dfrac{Sk^3}{k^2+k+1}$',
    pochemu: 'Из цепочки $\\big((Sk-x)k-x\\big)k-x=0$: раскрываем скобки и выносим $x$.',
    level: E,
    source: R('tablitsa-ann'),
  },
  {
    id: '13-tri-platezha-v',
    task: 13,
    topic: 'annuitet',
    type: 'vychislenie',
    front:
      'Кредит $3640$ тыс. рублей под $20\\,\\%$ годовых погашают тремя равными ежегодными платежами. Найдите платёж (тыс. рублей).',
    back: '$k=1{,}2$, $k^3=1{,}728$, $k^2+k+1=3{,}64$. $x=\\dfrac{3640\\cdot1{,}728}{3{,}64}=1000\\cdot1{,}728=1728$ тыс.',
    otvet: '1728',
    proverka: () => platezhPodborom(3640, 1.2, 3),
    level: E,
    source: R('tablitsa-ann'),
  },
  {
    id: '13-ann-v',
    task: 13,
    topic: 'annuitet',
    type: 'vychislenie',
    front:
      'Кредит $4200$ рублей под $10\\,\\%$ годовых погашают двумя равными платежами после начисления процентов. Найдите платёж.',
    back: '$Sk^2=x(k+1)$: $x=\\dfrac{4200\\cdot1{,}21}{2{,}1}=2000\\cdot1{,}21=2420$ рублей. Проверка: $4200\\cdot1{,}1-2420=2200$, $2200\\cdot1{,}1-2420=0$.',
    otvet: '2420',
    proverka: () => platezhPodborom(4200, 1.1, 2),
    level: B,
    source: R('geom'),
  },
  {
    id: '13-chetyre',
    task: 13,
    topic: 'annuitet',
    type: 'formula',
    front: 'Четыре равных платежа: как разложить $k^3+k^2+k+1$ на множители?',
    back: '$k^3+k^2+k+1=(k^2+1)(k+1)$',
    pochemu: '$k^2(k+1)+(k+1)$ — общий множитель $k+1$; потом дроби сокращаются.',
    level: E,
    source: R('chetyre'),
  },
  {
    id: '13-lov-k-l',
    task: 13,
    topic: 'annuitet',
    type: 'verno',
    front: 'Квадратное уравнение относительно $k$ дало корни $1{,}2$ и $0{,}8$. Оба годятся.',
    verno: false,
    back: 'Неверно: ставка положительная, значит $k>1$. Корень $0{,}8<1$ отбрасываем — это и пишем в решении.',
    level: E,
    source: R('lov-k'),
  },
  {
    id: '13-pereplata-ann',
    task: 13,
    topic: 'annuitet',
    type: 'formula',
    front: 'Кредит $S$ погашен $n$ равными платежами по $x$. Переплата?',
    back: '$nx-S$',
    pochemu: 'Банку вернули $nx$, а взяли $S$.',
    level: B,
    source: R('lov-pereplata-ann'),
  },
  {
    id: '13-pereplata-ann-v',
    task: 13,
    topic: 'annuitet',
    type: 'vychislenie',
    front: 'Кредит $4200$ рублей погашен двумя платежами по $2420$ рублей. Найдите переплату.',
    back: 'Вернули $2\\cdot2420=4840$, переплата $4840-4200=640$ рублей.',
    otvet: '640',
    proverka: () => {
      /* Переплата — сумма начисленных процентов по цепочке. */
      const d1 = 4200 * 1.1 - 2420;
      return 4200 * 0.1 + d1 * 0.1;
    },
    level: B,
    source: R('lov-pereplata-ann'),
  },

  /* ── Вклады ── */
  {
    id: '13-vklad',
    task: 13,
    topic: 'vklady',
    type: 'svoystvo',
    front: 'Вклад: в каком порядке идут действия за год?',
    back: 'Сначала **начисление** — вклад умножается на $k$; потом **пополнение или снятие** — прибавляем или вычитаем.',
    pochemu: 'Та же таблица, что у кредита, «в обратную сторону»: сумма растёт.',
    level: B,
    source: R('vklad'),
  },
  {
    id: '13-vklad-v',
    task: 13,
    topic: 'vklady',
    type: 'vychislenie',
    front:
      'Вклад $2$ млн рублей под $10\\,\\%$ годовых, в конце каждого года после начисления его пополняют на $1$ млн. Сколько миллионов будет через $2$ года?',
    back: 'Первый год: $2\\cdot1{,}1+1=3{,}2$. Второй: $3{,}2\\cdot1{,}1+1=4{,}52$ млн.',
    otvet: '4,52',
    proverka: () => tsepochka(2, 1.1, [-1, -1]),
    level: B,
    source: R('vklad'),
  },
  {
    id: '13-vklad-tri',
    task: 13,
    topic: 'vklady',
    type: 'formula',
    front: 'Вклад $S$, после каждого начисления пополнение $y$. Сколько будет через $3$ года?',
    back: '$Sk^3+y\\,(k^2+k+1)$',
    pochemu: 'Первое пополнение пролежало два начисления, второе — одно, третье — ни одного.',
    level: E,
    source: R('tablitsa-vklad'),
  },
  {
    id: '13-nachalo-goda',
    task: 13,
    topic: 'vklady',
    type: 'svoystvo',
    front: 'Пополнение «в начале третьего года» — в какой строке таблицы вклада оно стоит?',
    back: 'В строке **второго** года: сразу после начисления за второй год. Конец второго года и начало третьего — один момент.',
    level: E,
    source: R('lov-nachalo'),
  },
  {
    id: '13-punkty-l',
    task: 13,
    topic: 'vklady',
    type: 'verno',
    front: 'Ставку $20\\,\\%$ увеличили на $5$ процентных пунктов — она стала $25\\,\\%$.',
    verno: true,
    back: 'Верно: процентные пункты прибавляют к ставке. А «на $5$ процентов» — умножить ставку на $1{,}05$.',
    level: B,
    source: R('punkty'),
  },
  {
    id: '13-punkty-v',
    task: 13,
    topic: 'vklady',
    type: 'vychislenie',
    front:
      'Ставка была $40\\,\\%$, её увеличили на $30$ **процентов** (не пунктов). Какой стала ставка (в процентах)?',
    back: 'Ставку умножили на $1{,}3$: $40\\cdot1{,}3=52\\,\\%$. Увеличение на $30$ пунктов дало бы $70\\,\\%$.',
    otvet: '52',
    proverka: () => 40 + (40 * 30) / 100,
    level: E,
    source: R('punkty'),
  },
  {
    id: '13-nachislit-v',
    task: 13,
    topic: 'vklady',
    type: 'vychislenie',
    front:
      'Вклад $1$ млн рублей под $10\\,\\%$, в конце 1-го и 2-го годов после начисления его пополняют на $0{,}5$ млн. Сколько миллионов **начислит банк** за $2$ года?',
    back: 'Итог: $1\\cdot1{,}1+0{,}5=1{,}6$, $1{,}6\\cdot1{,}1+0{,}5=2{,}26$. Начислено — итог минус вклад и пополнения: $2{,}26-1-1=0{,}26$ млн.',
    otvet: '0,26',
    proverka: () => {
      /* Сумма процентов по годам: 10 % от суммы на начало каждого года. */
      const god1 = 1 * 0.1;
      const god2 = (1 + god1 + 0.5) * 0.1;
      return god1 + god2;
    },
    level: E,
    source: R('lov-nachislit'),
  },

  /* ── Как определить тип задачи ── */
  {
    id: '13-tip-ann-l',
    task: 13,
    topic: 'tip',
    type: 'verno',
    front:
      '«Кредит выплачен за 2 года платежами 240 и 288 тыс. рублей. Найдите ставку». Это дифференцированный платёж.',
    verno: false,
    back: 'Неверно: известны платежи, а долг по периодам не задан — это **аннуитет**.',
    level: E,
    source: R('opredeli'),
  },
  {
    id: '13-tip-brk',
    task: 13,
    topic: 'tip',
    type: 'svoystvo',
    front:
      'Две ставки; «с 1-го по 20-й месяц на 30 тыс. меньше, к 21-му погашен»; «первые годы долг не меняется». Какая схема?',
    back: '**«Поломанный» дифференцированный платёж:** путь долга задан, но не одной равномерной лесенкой.',
    level: E,
    source: R('priznaki'),
  },
  {
    id: '13-tip-ann',
    task: 13,
    topic: 'tip',
    type: 'svoystvo',
    front:
      '«Равными платежами», «каждый следующий платёж вдвое больше», «по $x$ за 4 года или по $y$ за 2». Какая схема?',
    back: '**Аннуитет:** известны платежи, а долг по периодам не задан.',
    level: E,
    source: R('priznaki'),
  },
  {
    id: '13-tip-vklad',
    task: 13,
    topic: 'tip',
    type: 'svoystvo',
    front: 'По каким словам в условии видно, что задача про вклад?',
    back: '«Вклад», «пополняет», «снял», «вложить в проект», «накопить» — **сумма растёт, а не убывает**.',
    level: B,
    source: R('priznaki'),
  },

  /* ── Ловушки и лайфхаки ── */
  {
    id: '13-edinicy-v',
    task: 13,
    topic: 'lovushki',
    type: 'vychislenie',
    front:
      'Ответ вышел $1{,}35$ млн рублей, а просят «ответ выразите в рублях». Что записать в бланк?',
    back: '$1{,}35\\cdot1\\,000\\,000$ — в бланк $1350000$. Ответ не в тех единицах — потерянный балл.',
    otvet: '1350000',
    proverka: () => 1.35 * 1e6,
    level: E,
    source: R('lov-edinicy'),
  },
  {
    id: '13-v-tysyachah',
    task: 13,
    topic: 'lovushki',
    type: 'svoystvo',
    front: 'Кредит $2\\,400\\,000$ рублей на $24$ месяца. Как не утонуть в нулях?',
    back: '**Считать в тысячах** и переводить только в конце: $2400:24=100$ тыс. $=100\\,000$ рублей.',
    level: B,
    source: R('v-tysyachah'),
  },
  {
    id: '13-lov-stroka',
    task: 13,
    topic: 'lovushki',
    type: 'svoystvo',
    front: 'Ответ не сошёлся. Где в таблице искать ошибку в первую очередь?',
    back: 'В **первой и последней строке**: чаще всего теряется первый или последний период.',
    level: B,
    source: R('lov-stroka'),
  },
  {
    id: '13-lov-chem-l',
    task: 13,
    topic: 'lovushki',
    type: 'verno',
    front:
      '«На сколько процентов сумма выплат больше суммы кредита»: здесь $100\\,\\%$ — сумма выплат.',
    verno: false,
    back: 'Неверно: $100\\,\\%$ — **кредит**, он стоит после «чем» («больше, чем кредит»).',
    level: E,
    source: R('lov-chem'),
  },
  {
    id: '13-sokrashchaem-v',
    task: 13,
    topic: 'lovushki',
    type: 'vychislenie',
    front: 'Найдите $\\dfrac{330\\,000\\cdot1{,}21}{1{,}1}$, не умножая столбиком.',
    back: '$\\dfrac{1{,}21}{1{,}1}=1{,}1$: $330\\,000\\cdot1{,}1=363\\,000$. В бланк: $363000$.',
    otvet: '363000',
    proverka: () => (330000 * 121) / 110,
    level: B,
    source: R('sokrashchaem'),
  },
  {
    id: '13-delimost-l',
    task: 13,
    topic: 'lovushki',
    type: 'verno',
    front: 'Число $918\\,082$ делится на $11$.',
    verno: true,
    back: 'Верно: суммы цифр на нечётных и чётных местах $9+8+8=25$ и $1+0+2=3$, разность $22$ делится на $11$.',
    level: B,
    source: R('delimost'),
  },
];

/* ── Проверки формул: случайные кредиты и вклады ── */

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '13-k',
    sluchay: (rnd) => {
      const S = ot(rnd, 1, 1000);
      const r = ot(rnd, 0.5, 60);
      /* Умножить на k — то же, что прибавить r % от числа. */
      return { poFormule: S * (1 + r / 100), pryamo: S + (S / 100) * r };
    },
  },
  {
    kartochka: '13-pereplata-mesyac',
    sluchay: (rnd) => {
      const D = ot(rnd, 1, 1000);
      const r = ot(rnd, 0.5, 30);
      /* Пропорция «долг — 100 %, переплата — r %» решается через 1 %. */
      return { poFormule: (D * r) / 100, pryamo: (D / 100) * r };
    },
  },
  {
    kartochka: '13-dolg-na-konec',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 2, 24);
      const r = ot(rnd, 1, 20);
      /* Долг на конец по таблице = начисленный долг минус платёж. */
      const s = dif(S, n, r)[tseloe(rnd, 0, n - 1)] as Stroka;
      return { poFormule: s.nachalo - s.izmenenie, pryamo: s.nachalo * (1 + r / 100) - s.platezh };
    },
  },
  {
    kartochka: '13-platezh',
    sluchay: (rnd) => {
      const D = ot(rnd, 100, 1000);
      const r = ot(rnd, 1, 20);
      const x = ot(rnd, D * (r / 100), D * (1 + r / 100));
      /* Платёж x после начисления: долг упал на x − переплата. */
      const izm = D - (D * (1 + r / 100) - x);
      return { poFormule: izm + (D * r) / 100, pryamo: x };
    },
  },
  {
    kartochka: '13-vernut',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 2, 24);
      /* Любой путь долга и разные ставки: сумма платежей = S + переплата. */
      const doli = Array.from({ length: n }, () => ot(rnd, 0.1, 1));
      const izm = doli.map((d) => (d / summa(doli)) * S);
      const stavki = Array.from({ length: n }, () => ot(rnd, 1, 20));
      const t = tablitsa(S, izm, stavki);
      return {
        poFormule: S + summa(t.map((s) => s.pereplata)),
        pryamo: summa(t.map((s) => s.platezh)),
      };
    },
  },
  {
    kartochka: '13-dolg-nachalo',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 2, 36);
      const i = tseloe(rnd, 1, n);
      return {
        poFormule: ((n - i + 1) * S) / n,
        pryamo: (dif(S, n, 5)[i - 1] as Stroka).nachalo,
      };
    },
  },
  {
    kartochka: '13-summa-dolgov',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 1, 36);
      return {
        poFormule: (S * (n + 1)) / 2,
        pryamo: summa(dif(S, n, 5).map((s) => s.nachalo)),
      };
    },
  },
  {
    kartochka: '13-pereplata-dif',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 1, 36);
      const r = ot(rnd, 0.5, 30);
      return {
        poFormule: S * ((n + 1) / 2) * (r / 100),
        pryamo: summa(dif(S, n, r).map((s) => s.pereplata)),
      };
    },
  },
  {
    kartochka: '13-po-kuskam',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const n = tseloe(rnd, 2, 20);
      const r = ot(rnd, 1, 25);
      /* Неравномерный путь долга, ставка одна. */
      const doli = Array.from({ length: n }, () => ot(rnd, 0, 1));
      const izm = doli.map((d) => (d / summa(doli)) * S);
      const t = tablitsa(S, izm, [r]);
      return {
        poFormule: S + (r / 100) * summa(t.map((s) => s.nachalo)),
        pryamo: summa(t.map((s) => s.platezh)),
      };
    },
  },
  {
    kartochka: '13-tsepochka',
    sluchay: (rnd) => {
      const D = ot(rnd, 100, 1000);
      const r = ot(rnd, 1, 30);
      const x = ot(rnd, 0, D);
      /* Начислили r % и вычли платёж. */
      return { poFormule: D * (1 + r / 100) - x, pryamo: D + (D * r) / 100 - x };
    },
  },
  {
    kartochka: '13-geom',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const k = 1 + ot(rnd, 1, 40) / 100;
      const n = tseloe(rnd, 1, 10);
      /* Платёж подбором (долг в ноль), затем обе части уравнения. */
      const x = platezhPodborom(S, k, n);
      const skobka = summa(Array.from({ length: n }, (_, i) => k ** i));
      return { poFormule: x * skobka, pryamo: S * k ** n };
    },
  },
  {
    kartochka: '13-tri-platezha',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const k = 1 + ot(rnd, 1, 40) / 100;
      return { poFormule: (S * k ** 3) / (k * k + k + 1), pryamo: platezhPodborom(S, k, 3) };
    },
  },
  {
    kartochka: '13-chetyre',
    sluchay: (rnd) => {
      const k = ot(rnd, -5, 5);
      return { poFormule: (k * k + 1) * (k + 1), pryamo: k ** 3 + k ** 2 + k + 1 };
    },
  },
  {
    kartochka: '13-pereplata-ann',
    sluchay: (rnd) => {
      const S = ot(rnd, 100, 1000);
      const k = 1 + ot(rnd, 1, 40) / 100;
      const n = tseloe(rnd, 1, 10);
      const x = platezhPodborom(S, k, n);
      /* Переплата — сумма процентов, начисленных по цепочке. */
      let dolg = S;
      let procenty = 0;
      for (let i = 0; i < n; i += 1) {
        procenty += dolg * (k - 1);
        dolg = dolg * k - x;
      }
      return { poFormule: n * x - S, pryamo: procenty };
    },
  },
  {
    kartochka: '13-vklad-tri',
    sluchay: (rnd) => {
      const S = ot(rnd, 1, 1000);
      const k = 1 + ot(rnd, 1, 40) / 100;
      const y = ot(rnd, 0, 500);
      return { poFormule: S * k ** 3 + y * (k * k + k + 1), pryamo: tsepochka(S, k, [-y, -y, -y]) };
    },
  },
];

const KOLODA_13: Koloda = {
  task: 13,
  slug: '13',
  title: 'Экономические задачи',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'procenty', title: 'Проценты и коэффициент $k$' },
    { id: 'slova', title: 'Кредит простыми словами' },
    { id: 'shemy', title: 'Две схемы кредита' },
    { id: 'dif', title: 'Дифференцированный платёж' },
    { id: 'polomannyy', title: '«Поломанный» платёж' },
    { id: 'annuitet', title: 'Аннуитет' },
    { id: 'vklady', title: 'Вклады' },
    { id: 'tip', title: 'Как определить тип' },
    { id: 'lovushki', title: 'Ловушки и лайфхаки' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_13;
