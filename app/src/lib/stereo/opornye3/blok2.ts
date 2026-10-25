/**
 * Опорные задачи №3, блок 2 «Пространство → треугольник» (пилот новой
 * методики). Десять задач от простых к сложным; подсказки — вопросы по
 * шагам главного алгоритма ①–⑤, решение учителя по этапам и разбор для
 * ученика словами и формулой. Числа свои: задач на расстояние между
 * вершинами в открытом банке №3 сейчас нет.
 *
 * У каждой задачи — пересчёт ответа по координатам того же чертежа
 * (pereschet): автотест сверяет его с ответом.
 */

import { box, dir, polygonStart, pyramid, regularPolygon, regularPrism, vertex } from '../../solid/figures';
import type { Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { teloStupenki, vershinyStupenki, type Stupenka } from '../stupenka';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const okr = (x: number) => Math.round(x * 1e6) / 1e6;

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const PERP_REBRO: ShagPodskazki = {
  n: 3,
  vopros: 'Почему угол рабочего треугольника прямой?',
  varianty: [
    'Отрезок перпендикулярен плоскости грани, а другая сторона лежит в этой грани',
    'На чертеже угол выглядит прямым',
    'Все рёбра многогранника равны',
  ],
  verno: 0,
  vyvod: 'Прямая, перпендикулярная плоскости, перпендикулярна любой прямой в этой плоскости.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

function parallelepiped(a: number, b: number, c: number, { alt }: { alt: string }, s1 = false): { model: Model; v: (n: string) => Vec3 } {
  const body = box(a, b, c);
  const v = (n: string) => vertex(body, n);
  return {
    v,
    model: {
      alt,
      bodies: [body],
      measures: [
        { a: v('A'), b: v('B'), text: String(a) },
        { a: v('B'), b: v('C'), text: String(b) },
        { a: v('C'), b: v('C1'), text: String(c) },
      ],
      ...(s1 ? { lines: [{ a: v('A'), b: v('C1') }] } : {}),
    },
  };
}

function stupenka(
  s: Stupenka,
  { alt }: { alt: string },
  sF: boolean,
): { model: Model; A: Vec3; C2: Vec3; F: Vec3; v: Record<string, Vec3> } {
  const v = vershinyStupenki(s);
  const A = v['A'] as Vec3;
  const C2 = v['C2'] as Vec3;
  const F: Vec3 = [C2[0], C2[1], 0];
  return {
    A,
    C2,
    F,
    v,
    model: {
      alt,
      view: 'cabinet',
      bodies: [teloStupenki(s, ['A', 'B', 'C', 'D', 'C2'])],
      ...(sF
        ? {
            marks: [{ p: F, label: 'F' }],
            lines: [
              { a: C2, b: F },
              { a: A, b: C2 },
            ],
          }
        : { lines: [{ a: A, b: C2 }] }),
      measures: [
        { a: v['A2'] as Vec3, b: v['B2'] as Vec3, text: String(s.w) },
        { a: v['A'] as Vec3, b: v['D'] as Vec3, text: String(s.D) },
        { a: v['A'] as Vec3, b: v['A2'] as Vec3, text: String(s.H) },
      ],
    },
  };
}

function piramida(R: number, h: number, { alt }: { alt: string }, SA: number) {
  const body = pyramid(regularPolygon(4, R, 0, polygonStart(4)), [0, 0, h]);
  const v = (n: string) => vertex(body, n);
  const O: Vec3 = [0, 0, 0];
  const model: Model = {
    alt,
    bodies: [body],
    marks: [{ p: O, label: 'O' }],
    lines: [{ a: v('S'), b: O }],
    measures: [
      { a: v('S'), b: O, text: String(h) },
      { a: v('S'), b: v('A'), text: String(SA) },
    ],
  };
  return { model, v, O };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka2(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: катет, перпендикулярный основанию. */
  {
    const { model, v } = parallelepiped(3, 4, 12, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с диагональю AC₁' }, true);
    const celi = [
      { id: 'AC', points: [v('A'), v('C')], label: '$AC$' },
      { id: 'CC1', points: [v('C'), v('C1')], label: '$CC_1$' },
      { id: 'AC1', points: [v('A'), v('C1')], label: '$AC_1$' },
    ];
    out.push({
      id: 'o3-2-01',
      kratko: 'Катет, перпендикулярный основанию',
      rabochaya: { points: [v('A'), v('C'), v('C1')], pryamoy: v('C') },
      blok: 'treugolnik',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Диагональ $AC_1$ прямоугольного параллелепипеда — гипотенуза рабочего треугольника $ACC_1$. Нажмите на чертеже на катет, который перпендикулярен плоскости основания.',
      model,
      celi,
      otvet: 'CC1',
      podskazka: [
        {
          n: 2,
          vopros: 'Какие отрезки — стороны треугольника $ACC_1$?',
          varianty: ['$AC$, $CC_1$ и $AC_1$', '$AB$, $BC$ и $AC$', '$AA_1$, $A_1C_1$ и $AC_1$'],
          verno: 0,
          vyvod: 'Катеты — $AC$ и $CC_1$, гипотенуза — $AC_1$.',
        },
        {
          n: 3,
          vopros: 'Какой из катетов — боковое ребро параллелепипеда?',
          varianty: ['$CC_1$', '$AC$'],
          verno: 0,
          vyvod: 'Боковое ребро перпендикулярно плоскости основания.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник', formuly: ['\\triangle ACC_1:\\ AC_1\\ \\text{— гипотенуза}'] },
        { etap: 'Прямой угол', formuly: ['CC_1 \\perp (ABC),\\ AC \\subset (ABC)\\ \\Rightarrow\\ CC_1 \\perp AC'] },
      ],
      uchenik: [
        { n: 2, chto: 'Стороны треугольника $ACC_1$: диагональ основания $AC$, боковое ребро $CC_1$ и диагональ $AC_1$.' },
        { n: 3, chto: 'Боковое ребро $CC_1$ перпендикулярно плоскости основания — это и есть нужный катет.', formula: 'CC_1 \\perp (ABC)' },
      ],
      pereschet: () => {
        const up: Vec3 = [0, 0, 1];
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          const d = dir(p, q);
          return Math.abs(Math.abs(dot(d, up)) - Math.hypot(...d)) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 2. Почему угол прямой: высота пирамиды. */
  {
    const { model, v, O } = piramida(10, 24, { alt: 'Правильная четырёхугольная пирамида SABCD с высотой SO' }, 26);
    const varianty = [
      '$SO$ — высота, она перпендикулярна плоскости основания, а $OA$ лежит в этой плоскости',
      'Диагонали квадрата перпендикулярны',
      'Треугольник $SOA$ равнобедренный',
      'На чертеже угол выглядит прямым',
    ];
    out.push({
      id: 'o3-2-02',
      kratko: 'Почему угол $SOA$ прямой',
      rabochaya: { points: [v('S'), O, v('A')], pryamoy: O },
      blok: 'treugolnik',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'В правильной пирамиде $SABCD$ точка $O$ — центр основания. Почему угол $SOA$ прямой?',
      model: { ...model, lines: [...(model.lines ?? []), { a: O, b: v('A') }], sections: [{ points: [v('S'), O, v('A')] }] },
      varianty,
      otvet: '0',
      podskazka: [
        {
          n: 3,
          vopros: 'Где лежит отрезок $OA$?',
          varianty: ['В плоскости основания', 'В боковой грани $SAB$', 'Вне пирамиды'],
          verno: 0,
          vyvod: '$O$ и $A$ — точки основания, значит, $OA$ лежит в его плоскости.',
        },
        {
          n: 3,
          vopros: 'Как расположена высота $SO$ относительно основания?',
          varianty: ['Перпендикулярно плоскости основания', 'Параллельно ребру $SA$'],
          verno: 0,
          vyvod: 'Высота перпендикулярна плоскости основания — значит, и любой прямой в ней.',
        },
      ],
      uchitel: [{ etap: 'Прямой угол', formuly: ['SO \\perp (ABC),\\ OA \\subset (ABC)\\ \\Rightarrow\\ SO \\perp OA'] }],
      uchenik: [
        { n: 3, chto: 'Высота пирамиды перпендикулярна плоскости основания. Отрезок $OA$ лежит в этой плоскости, поэтому $SO \\perp OA$.', formula: 'SO \\perp (ABC),\\ OA \\subset (ABC)\\ \\Rightarrow\\ \\angle SOA = 90^\\circ' },
      ],
      pereschet: () => (Math.abs(dot(dir(O, v('S')), dir(O, v('A')))) < 1e-9 ? '0' : '?'),
    });
  }

  /* 3. Нажми: рабочий треугольник в ступеньке. */
  {
    const s: Stupenka = { W: 7, w: 3, H: 12, h: 4, D: 4 };
    const { model, A, C2, F, v } = stupenka(s, { alt: 'Многогранник с прямыми двугранными углами, отрезок AC₂ и перпендикуляр C₂F' }, true);
    const B = v['B'] as Vec3;
    const K = v['K'] as Vec3;
    const celi = [
      { id: 'ABC2', points: [A, B, C2], label: 'треугольник $ABC_2$' },
      { id: 'AKC2', points: [A, K, C2], label: 'треугольник $AKC_2$' },
      { id: 'AFC2', points: [A, F, C2], label: 'треугольник $AFC_2$' },
    ];
    out.push({
      id: 'o3-2-03',
      kratko: 'Рабочий треугольник ступеньки',
      rabochaya: { points: [A, F, C2], pryamoy: F },
      blok: 'treugolnik',
      uroven: 2,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Все двугранные углы многогранника прямые, $C_2F$ — перпендикуляр к плоскости нижней грани. Нажмите на чертеже на прямоугольный треугольник, в котором $AC_2$ — гипотенуза.',
      model,
      celi,
      otvet: 'AFC2',
      podskazka: [
        {
          n: 3,
          vopros: 'Какой отрезок точно перпендикулярен плоскости нижней грани?',
          varianty: ['$C_2F$', '$AB$', '$AC_2$'],
          verno: 0,
          vyvod: 'Значит, $C_2F$ перпендикулярно любой прямой нижней грани, в том числе $AF$.',
        },
        PERP_REBRO,
      ],
      uchitel: [{ etap: 'Рабочий треугольник', formuly: ['C_2F \\perp (ABC),\\ AF \\subset (ABC)\\ \\Rightarrow\\ \\angle AFC_2 = 90^\\circ'] }],
      uchenik: [
        { n: 2, chto: 'Ищем треугольник, где $AC_2$ — сторона, а прямой угол — напротив неё.' },
        { n: 3, chto: 'Прямой угол есть только там, где его можно обосновать: $C_2F$ перпендикулярно нижней грани, $AF$ в ней лежит. В треугольниках $ABC_2$ и $AKC_2$ прямого угла нет — он только похож на прямой.', formula: '\\angle AFC_2 = 90^\\circ' },
      ],
      pereschet: () => {
        const found = celi.find((c) => {
          const [p, q, r] = c.points as [Vec3, Vec3, Vec3];
          return Math.abs(dot(dir(q, p), dir(q, r))) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 4. Диагональ параллелепипеда 3 × 4 × 12. */
  {
    const { model, v } = parallelepiped(3, 4, 12, { alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 3, 4 и 12' });
    out.push({
      id: 'o3-2-04',
      kratko: 'Диагональ параллелепипеда',
      rabochaya: { points: [v('A'), v('C'), v('C1')], pryamoy: v('C') },
      blok: 'treugolnik',
      uroven: 1,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Рёбра прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, выходящие из одной вершины, равны $3$, $4$ и $12$. Найдите диагональ $AC_1$.',
      model,
      otvet: '13',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике $AC_1$ — гипотенуза?',
          varianty: ['$ACC_1$', '$ABC$', '$AA_1B_1$'],
          verno: 0,
          vyvod: 'Катеты — диагональ основания $AC$ и ребро $CC_1 = 12$.',
        },
        PERP_REBRO,
        {
          n: 5,
          vopros: 'Чему равна диагональ основания $AC$?',
          varianty: ['$5$', '$7$', '$12$'],
          verno: 0,
          vyvod: 'Тройка $3, 4, 5$: $AC = 5$. Дальше снова тройка: $5, 12, 13$.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AC = \\sqrt{3^2 + 4^2} = 5'] },
        { etap: 'Рабочий треугольник $ACC_1$', formuly: ['CC_1 \\perp (ABC) \\Rightarrow \\angle ACC_1 = 90^\\circ', 'AC_1 = \\sqrt{5^2 + 12^2} = 13'] },
      ],
      uchenik: [
        { n: 1, chto: 'Отмечаем рёбра $3$, $4$ и $12$.' },
        { n: 2, chto: 'Рабочий треугольник — $ACC_1$, искомое $AC_1$ в нём гипотенуза.' },
        { n: 3, chto: 'Ребро $CC_1$ перпендикулярно основанию, $AC$ лежит в основании.', formula: 'CC_1 \\perp AC' },
        { n: 5, chto: 'Две пифагоровы тройки подряд.', formula: 'AC = 5,\\quad AC_1 = \\sqrt{25 + 144} = 13' },
      ],
      pereschet: () => okr(dist(v('A'), v('C1'))),
    });
  }

  /* 5. Выбери плоский чертёж: пирамида, SO = 15, SA = 17. */
  {
    const { model, v } = piramida(8, 15, { alt: 'Правильная четырёхугольная пирамида SABCD, SO = 15, SA = 17' }, 17);
    const ploskie = [
      { vershiny: ['O', 'A', 'S'] as const, kateti: [8, 15] as const, podpisi: { a: '?', b: '15', c: '17' }, iskomoe: 'a' as const, alt: 'Прямой угол при O, катет SO = 15, гипотенуза SA = 17, катет OA — искомый' },
      { vershiny: ['A', 'O', 'S'] as const, kateti: [8, 17] as const, podpisi: { a: '?', b: '17', c: '15' }, iskomoe: 'a' as const, alt: 'Прямой угол при A, катет SA = 17, гипотенуза SO = 15' },
      { vershiny: ['S', 'O', 'A'] as const, kateti: [15, 17] as const, podpisi: { a: '15', b: '17', c: '?' }, iskomoe: 'c' as const, alt: 'Прямой угол при S, катеты SO = 15 и SA = 17, гипотенуза OA — искомая' },
    ];
    out.push({
      id: 'o3-2-05',
      kratko: 'Плоский чертёж пирамиды',
      rabochaya: { points: [v('S'), [0, 0, 0], v('A')], pryamoy: [0, 0, 0] },
      blok: 'treugolnik',
      uroven: 2,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'В правильной пирамиде $SABCD$ точка $O$ — центр основания, $SO = 15$, $SA = 17$. Какой плоский чертёж — рабочий треугольник для нахождения $OA$?',
      model,
      ploskie,
      otvet: '0',
      podskazka: [
        {
          n: 3,
          vopros: 'Где в треугольнике $SOA$ прямой угол?',
          varianty: ['При $O$', 'При $A$', 'При $S$'],
          verno: 0,
          vyvod: 'Высота $SO$ перпендикулярна основанию, значит, прямой угол — при $O$.',
        },
        {
          n: 4,
          vopros: 'Какая сторона — гипотенуза?',
          varianty: ['$SA = 17$', '$SO = 15$', '$OA$'],
          verno: 0,
          vyvod: 'Гипотенуза лежит напротив прямого угла и длиннее любого катета.',
        },
      ],
      uchitel: [{ etap: 'Рабочий треугольник SOA', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ,\\ SA\\ \\text{— гипотенуза}'] }],
      uchenik: [
        { n: 3, chto: 'Высота перпендикулярна основанию, $OA$ лежит в основании: прямой угол при $O$.' },
        { n: 4, chto: 'Против прямого угла — гипотенуза $SA = 17$, катеты $SO = 15$ и искомый $OA$. На втором чертеже гипотенуза короче катета, на третьем прямой угол не там.' },
      ],
      pereschet: () => {
        const SA = Math.round(dist(v('S'), v('A')));
        const at = ploskie.findIndex((p) => p.vershiny[0] === 'O' && p.podpisi.c === String(SA));
        return String(at);
      },
    });
  }

  /* 6. Пирамида: SO = 15, SA = 17 → BD. */
  {
    const { model, v } = piramida(8, 15, { alt: 'Правильная четырёхугольная пирамида SABCD, SO = 15, SA = 17' }, 17);
    out.push({
      id: 'o3-2-06',
      kratko: 'Диагональ основания пирамиды',
      rabochaya: { points: [v('S'), [0, 0, 0], v('A')], pryamoy: [0, 0, 0] },
      blok: 'treugolnik',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В правильной четырёхугольной пирамиде $SABCD$ точка $O$ — центр основания, $SO = 15$, $SA = 17$. Найдите длину отрезка $BD$.',
      model: { ...model, lines: [...(model.lines ?? []), { a: v('B'), b: v('D') }] },
      otvet: '16',
      podskazka: [
        {
          n: 2,
          vopros: 'Как связаны $BD$ и $OA$?',
          varianty: ['$BD = 2\\cdot OA$', '$BD = OA$', '$BD = SA$'],
          verno: 0,
          vyvod: 'Диагонали квадрата равны и делятся точкой $O$ пополам.',
        },
        {
          n: 3,
          vopros: 'Почему треугольник $SOA$ прямоугольный?',
          varianty: ['$SO$ перпендикулярно основанию, $OA$ в нём лежит', 'Он равнобедренный'],
          verno: 0,
          vyvod: '$\\angle SOA = 90^\\circ$.',
        },
        {
          n: 5,
          vopros: 'Чему равно $OA$?',
          varianty: ['$8$', '$2$', '$32$'],
          verno: 0,
          vyvod: '$17^2 - 15^2 = 2\\cdot 32 = 64$, тройка $8, 15, 17$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник SOA', formuly: ['SO \\perp (ABC) \\Rightarrow \\angle SOA = 90^\\circ'] },
        { etap: 'Счёт', formuly: ['OA^2 = 17^2 - 15^2 = (17 - 15)(17 + 15) = 64,\\ OA = 8', 'BD = AC = 2\\cdot OA = 16'] },
      ],
      uchenik: [
        { n: 1, chto: 'Пирамида правильная: основание — квадрат, $O$ — точка пересечения его диагоналей.' },
        { n: 2, chto: 'Диагонали квадрата равны: $BD = AC = 2\\cdot OA$. Ищем $OA$ из треугольника $SOA$.' },
        { n: 3, chto: 'Высота $SO$ перпендикулярна основанию, $OA$ в нём лежит.', formula: '\\angle SOA = 90^\\circ' },
        { n: 5, chto: 'Разность квадратов.', formula: 'OA^2 = (17 - 15)(17 + 15) = 64,\\quad OA = 8,\\quad BD = 16' },
      ],
      pereschet: () => okr(dist(v('B'), v('D'))),
    });
  }

  /* 7. Ступенька: 4 × 4, высота 7 → 9. */
  {
    const s: Stupenka = { W: 7, w: 4, H: 7, h: 3, D: 4 };
    const { model, A, C2 } = stupenka(s, { alt: 'Многогранник с прямыми двугранными углами: высокий блок 4 на 4 на 7, отрезок AC₂' }, false);
    out.push({
      id: 'o3-2-07',
      kratko: 'Расстояние между вершинами',
      rabochaya: { points: [A, [C2[0], C2[1], 0], C2], pryamoy: [C2[0], C2[1], 0] },
      blok: 'treugolnik',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Все двугранные углы многогранника на рисунке прямые. Размеры высокого блока: $4$, $4$ и $7$. Найдите расстояние между вершинами $A$ и $C_2$.',
      model,
      otvet: '9',
      podskazka: [
        {
          n: 2,
          vopros: 'Что удобно провести из точки $C_2$?',
          varianty: ['Перпендикуляр на плоскость нижней грани', 'Биссектрису', 'Медиану'],
          verno: 0,
          vyvod: 'Основание перпендикуляра $F$ лежит в нижней грани; треугольник $AFC_2$ — рабочий.',
        },
        PERP_REBRO,
        {
          n: 5,
          vopros: 'Чему равно $AF^2$?',
          varianty: ['$32$', '$8$', '$16$'],
          verno: 0,
          vyvod: '$AF$ — диагональ квадрата $4 \\times 4$: $AF^2 = 16 + 16 = 32$. Корень не извлекаем.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник $AFC_2$', formuly: ['C_2F \\perp (ABC) \\Rightarrow \\angle AFC_2 = 90^\\circ'] },
        { etap: 'Счёт', formuly: ['AF^2 = 4^2 + 4^2 = 32', 'AC_2^2 = 32 + 7^2 = 81,\\ AC_2 = 9'] },
      ],
      uchenik: [
        { n: 2, chto: 'Опускаем перпендикуляр $C_2F$ на плоскость нижней грани.' },
        { n: 3, chto: '$C_2F$ перпендикулярно нижней грани, $AF$ лежит в ней: угол $AFC_2$ прямой.' },
        { n: 5, chto: 'Квадрат диагонали квадрата — не извлекая корня — сразу во второй Пифагор.', formula: 'AC_2^2 = (4^2 + 4^2) + 7^2 = 81,\\quad AC_2 = 9' },
      ],
      pereschet: () => okr(dist(A, C2)),
    });
  }

  /* 8. Квадрат расстояния: сдвиги 3, 5, 2. */
  {
    const s: Stupenka = { W: 6, w: 3, H: 2, h: 1, D: 5 };
    const { model, A, C2 } = stupenka(s, { alt: 'Многогранник с прямыми двугранными углами: высокий блок 3 на 5 на 2, отрезок AC₂' }, false);
    out.push({
      id: 'o3-2-08',
      kratko: 'Квадрат расстояния',
      rabochaya: { points: [A, [C2[0], C2[1], 0], C2], pryamoy: [C2[0], C2[1], 0] },
      blok: 'treugolnik',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Все двугранные углы многогранника на рисунке прямые. Размеры высокого блока: $3$, $5$ и $2$. Найдите квадрат расстояния между вершинами $A$ и $C_2$.',
      model,
      otvet: '38',
      podskazka: [
        {
          n: 2,
          vopros: 'На сколько надо сдвинуться от $A$ до $C_2$ по трём направлениям?',
          varianty: ['$3$, $5$ и $2$', '$6$, $5$ и $1$', '$3$, $5$ и $1$'],
          verno: 0,
          vyvod: 'Вправо на ширину высокого блока, вглубь на глубину, вверх на высоту.',
        },
        {
          n: 5,
          vopros: 'Чему равен квадрат расстояния?',
          varianty: ['$3^2 + 5^2 + 2^2$', '$3 + 5 + 2$', '$(3 + 5 + 2)^2$'],
          verno: 0,
          vyvod: 'Два Пифагора подряд — сумма квадратов трёх сдвигов.',
        },
      ],
      uchitel: [{ etap: 'Сдвиги 3, 5, 2', formuly: ['AC_2^2 = 3^2 + 5^2 + 2^2 = 38'] }],
      uchenik: [
        { n: 2, chto: 'Рабочий треугольник — $AFC_2$, где $F$ — проекция $C_2$ на нижнюю грань; $AF^2 = 3^2 + 5^2$.' },
        { n: 5, chto: 'Квадрат расстояния — сумма квадратов трёх сдвигов. Корень извлекать не нужно: спрашивают квадрат.', formula: 'AC_2^2 = 9 + 25 + 4 = 38' },
      ],
      pereschet: () => okr(dist(A, C2) ** 2),
    });
  }

  /* 9. Тангенс угла: AF = 10, FC₂ = 25. */
  {
    const s: Stupenka = { W: 10, w: 6, H: 25, h: 6, D: 8 };
    const { model, A, C2, F } = stupenka(s, { alt: 'Многогранник с прямыми двугранными углами: высокий блок 6 на 8 на 25, угол C₂AF' }, true);
    out.push({
      id: 'o3-2-09',
      kratko: 'Тангенс угла',
      rabochaya: { points: [A, F, C2], pryamoy: F },
      blok: 'treugolnik',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Все двугранные углы многогранника на рисунке прямые, размеры высокого блока $6$, $8$ и $25$. Точка $F$ — основание перпендикуляра из $C_2$ на плоскость нижней грани. Найдите тангенс угла $C_2AF$.',
      model,
      otvet: '2,5',
      podskazka: [
        PERP_REBRO,
        {
          n: 4,
          vopros: 'Тангенс угла $C_2AF$ — это…',
          varianty: ['$\\dfrac{FC_2}{AF}$', '$\\dfrac{AF}{FC_2}$', '$\\dfrac{FC_2}{AC_2}$'],
          verno: 0,
          vyvod: 'Противолежащий катет делим на прилежащий.',
        },
        {
          n: 5,
          vopros: 'Чему равно $AF$?',
          varianty: ['$10$', '$14$', '$100$'],
          verno: 0,
          vyvod: 'Тройка $6, 8, 10$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник', formuly: ['C_2F \\perp (ABC) \\Rightarrow \\angle AFC_2 = 90^\\circ'] },
        { etap: 'Тангенс', formuly: ['AF = \\sqrt{6^2 + 8^2} = 10', '\\operatorname{tg}\\angle C_2AF = \\dfrac{25}{10} = 2{,}5'] },
      ],
      uchenik: [
        { n: 3, chto: 'Угол $AFC_2$ прямой: $C_2F$ перпендикулярно нижней грани, $AF$ в ней лежит.' },
        { n: 4, chto: 'В прямоугольном треугольнике тангенс острого угла — противолежащий катет на прилежащий.' },
        { n: 5, chto: '$AF$ — диагональ прямоугольника $6 \\times 8$, это $10$.', formula: '\\operatorname{tg}\\angle C_2AF = \\dfrac{25}{10} = 2{,}5' },
      ],
      pereschet: () => okr(dist(C2, F) / dist(A, F)),
    });
  }

  /* 10. Шестиугольная призма: квадрат AD₁. */
  {
    const body = regularPrism(6, 5, 5);
    const v = (n: string) => vertex(body, n);
    out.push({
      id: 'o3-2-10',
      kratko: 'Шестиугольная призма',
      rabochaya: { points: [v('A'), v('D'), v('D1')], pryamoy: v('D') },
      blok: 'treugolnik',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В правильной шестиугольной призме $ABCDEFA_1B_1C_1D_1E_1F_1$ все рёбра равны $5$. Найдите квадрат расстояния между вершинами $A$ и $D_1$.',
      model: {
        alt: 'Правильная шестиугольная призма с рёбрами 5, отрезок AD₁',
        bodies: [body],
        lines: [{ a: v('A'), b: v('D1') }],
        measures: [
          { a: v('A'), b: v('B'), text: '5' },
          { a: v('A'), b: v('A1'), text: '5' },
        ],
      },
      otvet: '125',
      podskazka: [
        {
          n: 2,
          vopros: 'В каком треугольнике $AD_1$ — гипотенуза?',
          varianty: ['$ADD_1$', '$ABD_1$', '$AA_1D_1$ с прямым углом при $D_1$'],
          verno: 0,
          vyvod: 'Катеты — большая диагональ основания $AD$ и ребро $DD_1$.',
        },
        {
          n: 5,
          vopros: 'Чему равна большая диагональ правильного шестиугольника со стороной $5$?',
          varianty: ['$10$', '$5\\sqrt3$', '$5$'],
          verno: 0,
          vyvod: 'Шестиугольник — шесть правильных треугольников; большая диагональ — две их стороны.',
        },
      ],
      uchitel: [
        { etap: 'Основание', formuly: ['AD = 2\\cdot 5 = 10'] },
        { etap: 'Рабочий треугольник $ADD_1$', formuly: ['DD_1 \\perp (ABC) \\Rightarrow \\angle ADD_1 = 90^\\circ', 'AD_1^2 = 10^2 + 5^2 = 125'] },
      ],
      uchenik: [
        { n: 1, chto: 'Призма правильная: в основании правильный шестиугольник, боковые рёбра перпендикулярны основанию.' },
        { n: 2, chto: 'Рабочий треугольник — $ADD_1$.' },
        { n: 3, chto: 'Ребро $DD_1$ перпендикулярно основанию, $AD$ лежит в нём.', formula: '\\angle ADD_1 = 90^\\circ' },
        { n: 5, chto: 'Шестиугольник делится на шесть правильных треугольников: $AD = 10$.', formula: 'AD_1^2 = 100 + 25 = 125' },
      ],
      pereschet: () => okr(dist(v('A'), v('D1')) ** 2),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-2-${String(i + 1).padStart(2, '0')}` }));
}
