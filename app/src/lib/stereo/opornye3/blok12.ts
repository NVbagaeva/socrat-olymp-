/**
 * Опорные задачи №3, блок 12 «Считаю удобно». Умение — считать: довести
 * решение до числа без калькулятора. Приёмы — те же, что в главе
 * «Как считать без калькулятора»: разность квадратов, пифагоровы тройки
 * и кратные им, корень разложением на полные квадраты, квадрат
 * диагонали без корня сразу во второй Пифагор, ответ «делённый на пи»
 * и проверка правдоподобия.
 *
 * Числа свои: в открытом банке №3 задач на устный счёт как такового нет.
 * У каждой задачи — стереометрический чертёж и пересчёт ответа по его
 * координатам (pereschet): автотест сверяет пересчёт с ответом.
 */

import { box, polygonStart, pyramid, regularPolygon, vertex } from '../../solid/figures';
import type { Cone, Model } from '../../solid/model';
import { ortho } from '../../solid/project';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const okr = (x: number) => Math.round(x * 1e6) / 1e6;

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const PRYAMOY_SOA_PIR: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол $SOA$ прямой?',
  varianty: [
    'Высота $SO$ перпендикулярна плоскости основания, а $OA$ лежит в ней',
    'Треугольник $SOA$ равнобедренный',
    'На чертеже угол выглядит прямым',
  ],
  verno: 0,
  vyvod: 'Высота перпендикулярна любой прямой в плоскости основания.',
};

const PRYAMOY_SOA_KON: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол $SOA$ прямой?',
  varianty: [
    'Высота $SO$ перпендикулярна плоскости основания, а радиус $OA$ лежит в ней',
    'Образующая равна радиусу',
    'На чертеже угол выглядит прямым',
  ],
  verno: 0,
  vyvod: 'Половина осевого сечения конуса — прямоугольный треугольник $SOA$.',
};

const PRYAMOY_ACC1: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол $ACC_1$ прямой?',
  varianty: [
    'Ребро $CC_1$ перпендикулярно основанию, а $AC$ лежит в нём',
    'Все грани параллелепипеда — квадраты',
    'На чертеже угол выглядит прямым',
  ],
  verno: 0,
  vyvod: 'Боковое ребро перпендикулярно любой прямой в плоскости основания.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

type Chisla = Partial<Record<'SO' | 'SA' | 'OA' | 'AB', string>>;

/** Правильная четырёхугольная пирамида с центром основания O. */
function piramida(R: number, h: number, { alt }: { alt: string }, chisla: Chisla, sOA = false) {
  const body = pyramid(regularPolygon(4, R, 0, polygonStart(4)), [0, 0, h]);
  const v = (n: string) => vertex(body, n);
  const O: Vec3 = [0, 0, 0];
  const S = v('S');
  const A = v('A');
  const otrezki: Record<keyof Chisla, [Vec3, Vec3]> = { SO: [S, O], SA: [S, A], OA: [O, A], AB: [A, v('B')] };
  const model: Model = {
    alt,
    bodies: [body],
    marks: [{ p: O, label: 'O' }],
    lines: [{ a: S, b: O }, ...(sOA ? [{ a: O, b: A }] : [])],
    measures: (Object.keys(chisla) as (keyof Chisla)[]).map((k) => {
      const [a, b] = otrezki[k];
      return { a, b, text: chisla[k] as string };
    }),
  };
  return { model, v, O, S, A };
}

/** Конус: вершина S над центром O, A — точка окружности основания. */
function konus(r: number, h: number, { alt }: { alt: string }, chisla: Omit<Chisla, 'AB'>) {
  const O: Vec3 = [0, 0, 0];
  const S: Vec3 = [0, 0, h];
  const A = ortho.circlePoint(O, r, 0);
  const telo: Cone = { kind: 'cone', base: O, r, h };
  const otrezki: Record<'SO' | 'SA' | 'OA', [Vec3, Vec3]> = { SO: [S, O], SA: [S, A], OA: [O, A] };
  const model: Model = {
    alt,
    bodies: [telo],
    marks: [
      { p: S, label: 'S' },
      { p: O, label: 'O' },
      { p: A, label: 'A' },
    ],
    lines: [
      { a: S, b: O },
      { a: O, b: A },
      { a: S, b: A },
    ],
    measures: (Object.keys(chisla) as ('SO' | 'SA' | 'OA')[]).map((k) => {
      const [a, b] = otrezki[k];
      return { a, b, text: chisla[k] as string };
    }),
  };
  return { model, O, S, A };
}

/** Прямоугольный параллелепипед с рёбрами AB, BC, CC₁ и отрезком. */
function parallelepiped(a: number, b: number, c: number, { alt }: { alt: string }, otrezok: 'AC' | 'AC1') {
  const body = box(a, b, c);
  const v = (n: string) => vertex(body, n);
  const model: Model = {
    alt,
    bodies: [body],
    lines: [{ a: v('A'), b: v(otrezok === 'AC' ? 'C' : 'C1') }],
    measures: [
      { a: v('A'), b: v('B'), text: String(a) },
      { a: v('B'), b: v('C'), text: String(b) },
      { a: v('C'), b: v('C1'), text: String(c) },
    ],
  };
  return { model, v };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka12(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Выбор способа: OA² = 37² − 35² разложением. */
  {
    const { model, O, S, A } = piramida(12, 35, { alt: 'Правильная четырёхугольная пирамида SABCD с высотой SO = 35 и боковым ребром SA = 37' }, { SO: '35', SA: '37' }, true);
    const sposoby: { tex: string; znachenie: number }[] = [
      { tex: '$(37 - 35)(37 + 35)$', znachenie: (37 - 35) * (37 + 35) },
      { tex: '$1369 - 1225$', znachenie: 1369 - 1225 },
      { tex: '$(37 - 35)^2$', znachenie: (37 - 35) ** 2 },
      { tex: '$37^2 + 35^2$', znachenie: 37 ** 2 + 35 ** 2 },
    ];
    out.push({
      id: 'o3-12-01',
      kratko: 'Разность квадратов: способ',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'schet',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'В правильной четырёхугольной пирамиде $SABCD$ точка $O$ — центр основания, $SO = 35$, $SA = 37$. Какая запись $OA^2$ верна и считается в уме быстрее всего?',
      model,
      varianty: sposoby.map((s) => s.tex),
      otvet: '0',
      podskazka: [
        {
          n: 4,
          vopros: 'Какая сторона треугольника $SOA$ — гипотенуза?',
          varianty: ['$SA$', '$SO$', '$OA$'],
          verno: 0,
          vyvod: 'Против прямого угла при $O$ лежит $SA$, поэтому $OA^2 = SA^2 - SO^2$.',
        },
        {
          n: 5,
          vopros: 'Что удобно сделать с разностью квадратов?',
          varianty: ['Разложить на множители', 'Возвести числа в квадрат', 'Вычесть сами числа'],
          verno: 0,
          vyvod: '$c^2 - a^2 = (c - a)(c + a)$: числа близкие, первый множитель маленький.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'OA^2 = SA^2 - SO^2'] },
        { etap: 'Разность квадратов', formuly: ['37^2 - 35^2 = (37 - 35)(37 + 35) = 2\\cdot 72 = 144,\\quad OA = 12'] },
      ],
      uchenik: [
        { n: 3, chto: 'Высота перпендикулярна основанию: угол $SOA$ прямой, гипотенуза — $SA$.' },
        { n: 5, chto: 'Возводить $37$ и $35$ в квадрат долго. Раскладываем разность квадратов: разность $2$, сумма $72$. Квадрат разности или сумма квадратов — ошибка: это другие числа.', formula: '37^2 - 35^2 = 2\\cdot 72 = 144' },
      ],
      pereschet: () => {
        const oa2 = Math.round(dist(O, A) ** 2);
        return String(sposoby.findIndex((s) => s.znachenie === oa2));
      },
    });
  }

  /* 2. Конус: l = 41, h = 40 → r. */
  {
    const { model, O, S, A } = konus(9, 40, { alt: 'Конус с вершиной S: высота SO = 40, образующая SA = 41, радиус OA' }, { SO: '40', SA: '41' });
    out.push({
      id: 'o3-12-02',
      kratko: 'Радиус: 41 и 40',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'schet',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Образующая конуса равна $41$, высота — $40$. Найдите радиус основания конуса.',
      model,
      otvet: '9',
      podskazka: [
        PRYAMOY_SOA_KON,
        {
          n: 5,
          vopros: 'Как удобнее всего посчитать $41^2 - 40^2$?',
          varianty: ['$(41 - 40)(41 + 40)$', '$1681 - 1600$ столбиком', '$41 - 40$'],
          verno: 0,
          vyvod: 'Разность чисел $1$, остаётся только их сумма.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['\\angle SOA = 90^\\circ,\\quad r^2 = l^2 - h^2'] },
        { etap: 'Разность квадратов', formuly: ['r^2 = (41 - 40)(41 + 40) = 1\\cdot 81 = 81,\\quad r = 9'] },
      ],
      uchenik: [
        { n: 2, chto: 'Высота, радиус и образующая — стороны треугольника $SOA$, образующая в нём — гипотенуза.' },
        { n: 5, chto: 'Числа $41$ и $40$ близкие: раскладываем разность квадратов, и квадраты считать не нужно.', formula: 'r^2 = 1\\cdot 81,\\quad r = 9' },
      ],
      pereschet: () => okr(dist(O, A)),
    });
  }

  /* 3. Параллелепипед: AC при AB = 16, BC = 30 — тройка 8, 15, 17 на 2. */
  {
    const { model, v } = parallelepiped(16, 30, 10, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 16, 30 и 10, диагональ основания AC' }, 'AC');
    out.push({
      id: 'o3-12-03',
      kratko: 'Тройка, умноженная на 2',
      rabochaya: { points: [v('A'), v('B'), v('C')], pryamoy: v('B') },
      blok: 'schet',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ известно: $AB = 16$, $BC = 30$, $CC_1 = 10$. Найдите диагональ основания $AC$.',
      model,
      otvet: '34',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике $AC$ — гипотенуза?',
          varianty: ['$ABC$', '$ACC_1$', '$ABB_1$'],
          verno: 0,
          vyvod: 'Основание — прямоугольник, угол $ABC$ прямой. Ребро $CC_1$ здесь не нужно.',
        },
        {
          n: 5,
          vopros: 'На какое число удобно сократить катеты $16$ и $30$?',
          varianty: ['На $2$', 'На $3$', 'Ни на какое'],
          verno: 0,
          vyvod: 'Получаются $8$ и $15$ — узнаёте тройку $8,\\ 15,\\ 17$? Не забудьте умножить обратно.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $ABC$', formuly: ['\\angle ABC = 90^\\circ,\\quad AC^2 = AB^2 + BC^2'] },
        { etap: 'Тройка', formuly: ['16 = 2\\cdot 8,\\ 30 = 2\\cdot 15 \\Rightarrow AC = 2\\cdot 17 = 34'] },
      ],
      uchenik: [
        { n: 2, chto: 'Диагональ основания — гипотенуза треугольника $ABC$ с катетами $16$ и $30$.' },
        { n: 5, chto: 'Сначала сокращаем на общий множитель $2$: катеты $8$ и $15$ — тройка $8,\\ 15,\\ 17$. Гипотенуза — $17\\cdot 2$.', formula: 'AC = 2\\cdot 17 = 34' },
      ],
      pereschet: () => okr(dist(v('A'), v('C'))),
    });
  }

  /* 4. Что писать в бланк: V = 36π, просят делённый на π. */
  {
    const { model, O, S, A } = konus(3, 12, { alt: 'Конус с вершиной S: высота SO = 12, радиус OA = 3' }, { SO: '12', OA: '3' });
    const varianty = ['$36$', '$113{,}04$', '$36\\pi$', '$108$'];
    out.push({
      id: 'o3-12-04',
      kratko: 'Ответ, делённый на пи',
      blok: 'schet',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Радиус основания конуса равен $3$, высота — $12$. Найдите объём конуса, делённый на $\\pi$. Ученик посчитал: $V = 36\\pi$. Что он должен вписать в бланк?',
      model,
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 4,
          vopros: 'Можно ли вписать в бланк букву $\\pi$?',
          varianty: ['Нет: только цифры, запятая и минус', 'Да, как в черновике'],
          verno: 0,
          vyvod: 'Поэтому и просят ответ, делённый на $\\pi$.',
        },
        {
          n: 5,
          vopros: 'Что значит «делённый на $\\pi$»?',
          varianty: ['Взять множитель перед $\\pi$', 'Подставить $\\pi \\approx 3{,}14$', 'Разделить множитель ещё раз на $3{,}14$'],
          verno: 0,
          vyvod: '$\\pi$ держим множителем до конца, а в бланк пишем число перед ним.',
        },
      ],
      uchitel: [
        { etap: 'Объём', formuly: ['V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi\\cdot 9\\cdot 12 = 36\\pi'] },
        { etap: 'Ответ', formuly: ['\\frac{V}{\\pi} = 36'] },
      ],
      uchenik: [
        { n: 4, chto: 'Объём конуса — треть произведения площади основания на высоту. Без $\\frac{1}{3}$ вышло бы $108\\pi$.', formula: 'V = \\frac{1}{3}\\pi\\cdot 9\\cdot 12 = 36\\pi' },
        { n: 5, chto: 'Делим на $\\pi$ — остаётся множитель. Подставлять $3{,}14$ не нужно, а $\\pi$ в бланк не пишут.', formula: '\\frac{36\\pi}{\\pi} = 36' },
      ],
      pereschet: () => {
        const r = dist(O, A);
        const h = dist(S, O);
        return String(varianty.indexOf(`$${okr((r * r * h) / 3)}$`));
      },
    });
  }

  /* 5. Правдоподобие: радиус не больше образующей. */
  {
    const { model, S, A } = konus(8, 15, { alt: 'Конус с вершиной S: образующая SA = 17, высота SO и радиус OA' }, { SA: '17' });
    const varianty = ['$8$', '$15$', '$16$', '$18$'];
    out.push({
      id: 'o3-12-05',
      kratko: 'Какой радиус невозможен',
      blok: 'schet',
      uroven: 2,
      istochnik: 'new',
      vid: 'vybor',
      uslovie:
        'Образующая конуса равна $17$. Четыре ученика по-разному нашли радиус основания. Какой ответ точно неверен — это видно без вычислений?',
      model,
      varianty,
      otvet: '3',
      podskazka: [
        {
          n: 2,
          vopros: 'Чем в треугольнике $SOA$ служит радиус $OA$?',
          varianty: ['Катетом', 'Гипотенузой'],
          verno: 0,
          vyvod: 'Прямой угол — при $O$, гипотенуза — образующая $SA$.',
        },
        {
          n: 5,
          vopros: 'Каким может быть катет по сравнению с гипотенузой?',
          varianty: ['Только меньше', 'Любым', 'Только больше'],
          verno: 0,
          vyvod: 'Гипотенуза — самая длинная сторона прямоугольного треугольника.',
        },
      ],
      uchitel: [{ etap: 'Правдоподобие', formuly: ['\\angle SOA = 90^\\circ \\Rightarrow OA < SA = 17'] }],
      uchenik: [
        { n: 3, chto: 'Высота конуса перпендикулярна основанию: угол $SOA$ прямой, образующая — гипотенуза.' },
        { n: 5, chto: 'Катет короче гипотенузы, поэтому радиус меньше $17$. Остальные ответы возможны — при какой-то высоте конуса.', formula: 'OA < 17' },
      ],
      pereschet: () => {
        const l = dist(S, A);
        return String(varianty.findIndex((t) => Number(t.replace(/\$/g, '')) >= l));
      },
    });
  }

  /* 6. Плоский чертёж с тройкой 20, 21, 29. */
  {
    const { model, O, S, A } = piramida(20, 21, { alt: 'Правильная четырёхугольная пирамида SABCD: высота SO = 21, отрезок OA = 20' }, { SO: '21', OA: '20' }, true);
    const ploskie: PloskiyTreugolnik[] = [
      { vershiny: ['O', 'A', 'S'], kateti: [20, 21], podpisi: { a: '20', b: '21', c: '29' }, iskomoe: 'c', alt: 'Прямой угол при O, катеты OA = 20 и SO = 21, гипотенуза SA = 29' },
      { vershiny: ['O', 'A', 'S'], kateti: [20, 21], podpisi: { a: '20', b: '21', c: '41' }, iskomoe: 'c', alt: 'Прямой угол при O, катеты OA = 20 и SO = 21, гипотенуза SA = 41' },
      { vershiny: ['A', 'O', 'S'], kateti: [20, Math.sqrt(41)], podpisi: { a: '20', c: '21' }, iskomoe: 'b', alt: 'Прямой угол при A, катет OA = 20, гипотенуза SO = 21, катет SA — искомый' },
    ];
    out.push({
      id: 'o3-12-06',
      kratko: 'Тройка 20, 21, 29',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'schet',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'В правильной пирамиде $SABCD$ точка $O$ — центр основания, $SO = 21$, $OA = 20$. Ученики нарисовали рабочий треугольник $SOA$ и нашли $SA$. На каком чертеже всё верно: прямой угол на месте и стороны образуют пифагорову тройку?',
      model,
      ploskie,
      otvet: '0',
      podskazka: [
        PRYAMOY_SOA_PIR,
        {
          n: 4,
          vopros: 'Какая сторона — гипотенуза?',
          varianty: ['$SA$', '$SO$', '$OA$'],
          verno: 0,
          vyvod: 'Она против прямого угла и длиннее каждого катета.',
        },
        {
          n: 5,
          vopros: 'Как проверить подпись гипотенузы без корня?',
          varianty: ['Узнать тройку', 'Сложить катеты', 'Хватит, что она больше катетов'],
          verno: 0,
          vyvod: 'Сумма катетов — не гипотенуза: гипотенуза меньше суммы катетов.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ'] },
        { etap: 'Тройка', formuly: ['SA^2 = 20^2 + 21^2 = 400 + 441 = 841 = 29^2'] },
      ],
      uchenik: [
        { n: 3, chto: 'Высота перпендикулярна основанию: прямой угол — при $O$. На третьем чертеже прямой угол при $A$, и гипотенузой стала высота.' },
        { n: 5, chto: 'Катеты $20$ и $21$ — тройка $20,\\ 21,\\ 29$. На втором чертеже катеты просто сложили, а $\\sqrt{a^2 + b^2} \\ne a + b$.', formula: 'SA = \\sqrt{841} = 29' },
      ],
      pereschet: () => {
        const SA = Math.round(dist(S, A));
        return String(ploskie.findIndex((p) => p.vershiny[0] === 'O' && p.podpisi.c === String(SA)));
      },
    });
  }

  /* 7. Параллелепипед 9 × 12 × 36: две кратные тройки. */
  {
    const { model, v } = parallelepiped(9, 12, 36, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 9, 12 и 36, диагональ AC₁' }, 'AC1');
    out.push({
      id: 'o3-12-07',
      kratko: 'Две кратные тройки',
      rabochaya: { points: [v('A'), v('C'), v('C1')], pryamoy: v('C') },
      blok: 'schet',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Рёбра прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, выходящие из одной вершины, равны $9$, $12$ и $36$. Найдите диагональ $AC_1$.',
      model,
      otvet: '39',
      podskazka: [
        PRYAMOY_ACC1,
        {
          n: 5,
          vopros: 'Какая тройка спрятана в катетах $9$ и $12$?',
          varianty: ['$3,\\ 4,\\ 5$ на $3$', '$5,\\ 12,\\ 13$', '$9,\\ 40,\\ 41$'],
          verno: 0,
          vyvod: 'Значит, $AC = 3\\cdot 5$.',
        },
        {
          n: 5,
          vopros: 'Какой общий множитель у $AC$ и $CC_1 = 36$?',
          varianty: ['$3$', '$2$', '$5$'],
          verno: 0,
          vyvod: 'Сокращаем на $3$: катеты $5$ и $12$ — тройка $5,\\ 12,\\ 13$.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AC = 3\\cdot 5 = 15\\quad (9,\\ 12,\\ 15)'] },
        { etap: 'Рабочий треугольник $ACC_1$', formuly: ['CC_1 \\perp (ABC) \\Rightarrow \\angle ACC_1 = 90^\\circ', 'AC_1 = 3\\cdot 13 = 39\\quad (15,\\ 36,\\ 39)'] },
      ],
      uchenik: [
        { n: 2, chto: 'Рабочий треугольник — $ACC_1$, катеты — диагональ основания $AC$ и ребро $CC_1$.' },
        { n: 5, chto: 'Первая тройка: $9,\\ 12$ — это $3,\\ 4$ на $3$, $AC = 15$.' },
        { n: 5, chto: 'Вторая тройка: $15,\\ 36$ — это $5,\\ 12$ на $3$, гипотенуза — $13$ на $3$.', formula: 'AC_1 = 3\\cdot 13 = 39' },
      ],
      pereschet: () => okr(dist(v('A'), v('C1'))),
    });
  }

  /* 8. Пирамида: AB = 40, SO = 35 → SA, OA² без корня, √2025. */
  {
    const R = 20 * Math.SQRT2;
    const { model, S, A } = piramida(R, 35, { alt: 'Правильная четырёхугольная пирамида SABCD: сторона основания AB = 40, высота SO = 35' }, { AB: '40', SO: '35' }, true);
    out.push({
      id: 'o3-12-08',
      kratko: 'Корень из 2025',
      rabochaya: { points: [S, [0, 0, 0], A], pryamoy: [0, 0, 0] },
      blok: 'schet',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В правильной четырёхугольной пирамиде $SABCD$ сторона основания равна $40$, высота $SO = 35$. Найдите боковое ребро $SA$.',
      model,
      otvet: '45',
      podskazka: [
        PRYAMOY_SOA_PIR,
        {
          n: 5,
          vopros: 'Чему равно $OA^2$, если $AC^2 = 40^2 + 40^2$?',
          varianty: ['$800$', '$1600$', '$400$'],
          verno: 0,
          vyvod: '$OA = \\frac{AC}{2}$, значит $OA^2 = \\frac{AC^2}{4}$. Корень не извлекаем.',
        },
        {
          n: 5,
          vopros: 'Как удобно извлечь корень из $2025$?',
          varianty: ['$2025 = 81\\cdot 25$', 'Подбором от $40$', 'Столбиком'],
          verno: 0,
          vyvod: 'Раскладываем на полные квадраты: $\\sqrt{81\\cdot 25} = \\sqrt{81}\\cdot\\sqrt{25}$.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AC^2 = 40^2 + 40^2 = 3200,\\quad OA^2 = \\frac{AC^2}{4} = 800'] },
        { etap: 'Рабочий треугольник $SOA$', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ', 'SA^2 = 800 + 35^2 = 800 + 1225 = 2025'] },
        { etap: 'Корень', formuly: ['SA = \\sqrt{81\\cdot 25} = 9\\cdot 5 = 45'] },
      ],
      uchenik: [
        { n: 2, chto: 'Рабочий треугольник — $SOA$: высота, половина диагонали основания и боковое ребро.' },
        { n: 5, chto: '$OA = 20\\sqrt{2}$ — некрасиво. Не извлекаем корень: квадрат $OA^2 = 800$ сразу идёт во второй Пифагор.', formula: 'SA^2 = 800 + 1225 = 2025' },
        { n: 5, chto: 'Корень разложением: $2025 = 81\\cdot 25$.', formula: 'SA = 9\\cdot 5 = 45' },
      ],
      pereschet: () => okr(dist(S, A)),
    });
  }

  /* 9. Параллелепипед 8 × 16 × 38: вынести 2, корень из 1764. */
  {
    const { model, v } = parallelepiped(8, 16, 38, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 8, 16 и 38, диагональ AC₁' }, 'AC1');
    out.push({
      id: 'o3-12-09',
      kratko: 'Корень из 1764',
      rabochaya: { points: [v('A'), v('C'), v('C1')], pryamoy: v('C') },
      blok: 'schet',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Рёбра прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, выходящие из одной вершины, равны $8$, $16$ и $38$. Найдите диагональ $AC_1$.',
      model,
      otvet: '42',
      podskazka: [
        PRYAMOY_ACC1,
        {
          n: 5,
          vopros: 'Что делать с $AC = \\sqrt{8^2 + 16^2} = \\sqrt{320}$?',
          varianty: ['Взять $AC^2 = 320$ во второй Пифагор', 'Извлечь корень приближённо', 'Сложить $8 + 16$'],
          verno: 0,
          vyvod: '$AC_1^2 = 320 + 38^2$ — корень только в самом конце.',
        },
        {
          n: 5,
          vopros: 'Какой множитель удобно вынести из рёбер $8$, $16$, $38$?',
          varianty: ['$2$', '$4$', '$8$'],
          verno: 0,
          vyvod: 'Рёбра $2\\cdot 4$, $2\\cdot 8$, $2\\cdot 19$: под корнем остаётся $16 + 64 + 361$, а $2$ выходит множителем.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $ACC_1$', formuly: ['CC_1 \\perp (ABC) \\Rightarrow \\angle ACC_1 = 90^\\circ', 'AC_1^2 = AC^2 + CC_1^2 = (8^2 + 16^2) + 38^2'] },
        { etap: 'Счёт', formuly: ['AC_1^2 = 64 + 256 + 1444 = 1764', 'AC_1 = \\sqrt{4\\cdot 441} = 2\\cdot 21 = 42'] },
      ],
      uchenik: [
        { n: 2, chto: 'Рабочий треугольник — $ACC_1$, $AC$ — диагональ основания.' },
        { n: 5, chto: '$AC^2 = 320$ — корень некрасивый, не извлекаем. Квадрат диагонали — сумма квадратов трёх рёбер.', formula: 'AC_1^2 = 64 + 256 + 1444 = 1764' },
        { n: 5, chto: 'Корень разложением: $1764 = 4\\cdot 441$, а $441 = 21^2$.', formula: 'AC_1 = 2\\cdot 21 = 42' },
      ],
      pereschet: () => okr(dist(v('A'), v('C1'))),
    });
  }

  /* 10. Конус: l = 25, h = 24 → V/π. */
  {
    const { model, O, S, A } = konus(7, 24, { alt: 'Конус с вершиной S: высота SO = 24, образующая SA = 25, радиус OA' }, { SO: '24', SA: '25' });
    out.push({
      id: 'o3-12-10',
      kratko: 'Объём конуса без пи',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'schet',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie: 'Образующая конуса равна $25$, высота — $24$. Найдите объём конуса, делённый на $\\pi$.',
      model,
      otvet: '392',
      podskazka: [
        PRYAMOY_SOA_KON,
        {
          n: 5,
          vopros: 'Какая тройка даёт радиус?',
          varianty: ['$7,\\ 24,\\ 25$', '$3,\\ 4,\\ 5$', '$20,\\ 21,\\ 29$'],
          verno: 0,
          vyvod: 'Проверка разностью квадратов: $(25 - 24)(25 + 24) = 49$.',
        },
        {
          n: 5,
          vopros: 'С каким числом удобно сократить $\\frac{1}{3}$ в формуле $V = \\frac{1}{3}\\pi r^2 h$?',
          varianty: ['С высотой $24$', 'С квадратом радиуса', 'Ни с каким'],
          verno: 0,
          vyvod: '$\\frac{24}{3} = 8$: осталось умножить квадрат радиуса на $8$. В бланк — множитель перед $\\pi$.',
        },
      ],
      uchitel: [
        { etap: 'Радиус', formuly: ['r^2 = 25^2 - 24^2 = (25 - 24)(25 + 24) = 49,\\quad r = 7'] },
        { etap: 'Объём', formuly: ['V = \\frac{1}{3}\\pi r^2 h = \\pi\\cdot 49\\cdot \\frac{24}{3} = 392\\pi,\\quad \\frac{V}{\\pi} = 392'] },
      ],
      uchenik: [
        { n: 3, chto: 'Угол $SOA$ прямой, образующая — гипотенуза.' },
        { n: 5, chto: 'Тройка $7,\\ 24,\\ 25$ — радиус $7$. Нужен даже не он, а $r^2 = 49$.' },
        { n: 5, chto: 'Сначала сокращаем $\\frac{1}{3}$ с высотой, потом умножаем: $49\\cdot 8 = 392$. $\\pi$ держим множителем и в бланк не пишем.', formula: '\\frac{V}{\\pi} = 49\\cdot 8 = 392' },
      ],
      pereschet: () => {
        const r = dist(O, A);
        const h = dist(S, O);
        return okr((r * r * h) / 3);
      },
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-12-${String(i + 1).padStart(2, '0')}` }));
}
