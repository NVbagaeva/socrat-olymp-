/**
 * №3, теория, глава 2 «Главный приём: пространство → плоский
 * треугольник». Тексты, чертежи (lib/solid) и рабочие треугольники
 * (ploskiy.ts) разобранных примеров — одним модулем, как разборы
 * типов (razbory3.ts): числа задачи стоят в одном месте, и автотест
 * считает ответ по координатам того же чертежа.
 *
 * Каждый пример идёт по шагам главного алгоритма ①–⑤ (ALGORITM).
 */

import { box, dir, polygonStart, pyramid, regularPolygon, vertex } from '../solid/figures';
import type { Model } from '../solid/model';
import { type Vec3 } from '../solid/vec';
import type { PloskiyTreugolnik } from './ploskiy';
import { teloStupenki, vershinyStupenki, type Stupenka } from './stupenka';

/** Пять шагов главного алгоритма: заголовки и что делаем. */
export const ALGORITM: readonly { title: string; text: string }[] = [
  { title: 'Узнать тело', text: 'Что это за тело и где на чертеже данные — отметить их.' },
  {
    title: 'Найти рабочую плоскую фигуру',
    text: 'Чаще всего — прямоугольный треугольник, у которого искомое — сторона или угол.',
  },
  {
    title: 'Обосновать прямой угол',
    text: 'Не «на глаз»: ребро перпендикулярно грани, высота — основанию, ось — основанию.',
  },
  { title: 'Нарисовать фигуру отдельно', text: 'Плоско, в натуральную величину, с данными.' },
  {
    title: 'Посчитать удобно',
    text: 'Тройки, разность квадратов, без лишних корней на промежуточных шагах.',
  },
];

/** Шаг разобранного примера: номер шага алгоритма, что делаем и почему, выкладка. */
export interface ShagG2 {
  /** Номер шага алгоритма, 1–5. */
  n: 1 | 2 | 3 | 4 | 5;
  paras: readonly string[];
  formuly?: readonly string[];
}

export interface PrimerG2 {
  id: string;
  title: string;
  uslovie: string;
  /** Чертёж: элементы с шагом появляются на шагах живого чертежа. */
  model: Model;
  /** Подписи шагов живого чертежа (шаги модели 1…). */
  shagiChertezha: readonly string[];
  /** Рабочий треугольник отдельно. */
  ploskiy: PloskiyTreugolnik;
  shagi: readonly ShagG2[];
  otvet: string;
  /** Ответ числом — для автотеста. */
  chislo: number;
  /** Что считать по координатам чертежа: искомый отрезок или угол (градусы). */
  proverka: { otrezok: [Vec3, Vec3] } | { ugol: [Vec3, Vec3, Vec3] };
}

const P = (x: number, y: number, z: number): Vec3 => [x, y, z];

/* ── Пример 1: диагональ параллелепипеда ────────────────────────── */

export function primerDiagonal(): PrimerG2 {
  const body = box(2, 6, 9);
  const A = vertex(body, 'A');
  const C = vertex(body, 'C');
  const C1 = vertex(body, 'C1');
  return {
    id: 'diagonal',
    title: 'Диагональ прямоугольного параллелепипеда',
    uslovie:
      'Рёбра прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$, выходящие из одной вершины, равны $2$, $6$ и $9$. Найдите диагональ $AC_1$.',
    model: {
      alt: 'Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с рёбрами 2, 6 и 9; диагональ AC₁ и треугольник ACC₁',
      bodies: [body],
      measures: [
        { a: A, b: vertex(body, 'B'), text: '2' },
        { a: vertex(body, 'B'), b: C, text: '6' },
        { a: C, b: C1, text: '9' },
      ],
      lines: [
        { a: A, b: C, shag: 1 },
        { a: A, b: C1, shag: 2 },
      ],
      sections: [{ points: [A, C, C1], shag: 2 }],
      angles: [{ at: C, u: dir(C, A), v: dir(C, C1), shag: 3 }],
    },
    shagiChertezha: [
      'Диагональ основания $AC$ — в прямоугольнике $ABCD$.',
      'Рабочий треугольник $ACC_1$: искомое $AC_1$ — его гипотенуза.',
      '$CC_1$ перпендикулярно основанию, поэтому $\\angle ACC_1 = 90^\\circ$.',
    ],
    ploskiy: {
      vershiny: ['C', 'A', 'C1'],
      kateti: [Math.sqrt(40), 9],
      podpisi: { a: 'AC', b: '9', c: '?' },
      iskomoe: 'c',
      alt: 'Прямоугольный треугольник ACC₁: катеты AC и CC₁ = 9, прямой угол при C, гипотенуза AC₁ — искомая',
    },
    shagi: [
      {
        n: 1,
        paras: [
          'Прямоугольный параллелепипед: все грани — прямоугольники. Отмечаем $AB = 2$, $BC = 6$, $CC_1 = 9$.',
        ],
      },
      {
        n: 2,
        paras: [
          'Искомое $AC_1$ — гипотенуза треугольника $ACC_1$. Его катеты: ребро $CC_1$ и диагональ основания $AC$.',
        ],
      },
      {
        n: 3,
        paras: [
          'Ребро $CC_1$ перпендикулярно грани $ABCD$, а $AC$ лежит в этой грани. Значит, $CC_1 \\perp AC$.',
        ],
        formuly: ['CC_1 \\perp (ABC),\\ AC \\subset (ABC)\\ \\Rightarrow\\ CC_1 \\perp AC'],
      },
      {
        n: 4,
        paras: ['Рисуем треугольник $ACC_1$ отдельно: прямой угол при $C$, катеты $AC$ и $9$.'],
      },
      {
        n: 5,
        paras: [
          'Корень из $AC^2$ не извлекаем: в следующую формулу всё равно пойдёт квадрат.',
        ],
        formuly: [
          'AC^2 = AB^2 + BC^2 = 4 + 36 = 40',
          'AC_1^2 = AC^2 + CC_1^2 = 40 + 81 = 121,\\quad AC_1 = 11',
        ],
      },
    ],
    otvet: 'Ответ: $11$.',
    chislo: 11,
    proverka: { otrezok: [A, C1] },
  };
}

/* ── Пример 2: правильная пирамида — высота ⊥ основанию ─────────── */

export function primerPiramida(): PrimerG2 {
  const R = 10;
  const base = regularPolygon(4, R, 0, polygonStart(4));
  const body = pyramid(base, P(0, 0, 24));
  const A = vertex(body, 'A');
  const C = vertex(body, 'C');
  const S = vertex(body, 'S');
  const O = P(0, 0, 0);
  return {
    id: 'piramida',
    title: 'Правильная пирамида: высота перпендикулярна основанию',
    uslovie:
      'В правильной четырёхугольной пирамиде $SABCD$ точка $O$ — центр основания, $SO = 24$, $SA = 26$. Найдите длину отрезка $AC$.',
    model: {
      alt: 'Правильная четырёхугольная пирамида SABCD, высота SO, диагональ основания AC и треугольник SOA',
      bodies: [body],
      marks: [{ p: O, label: 'O' }],
      lines: [
        { a: S, b: O, shag: 1 },
        { a: A, b: C, shag: 1 },
      ],
      sections: [{ points: [S, O, A], shag: 2 }],
      angles: [{ at: O, u: dir(O, A), v: dir(O, S), shag: 3 }],
      measures: [
        { a: S, b: O, text: '24', shag: 1 },
        { a: S, b: A, text: '26' },
      ],
    },
    shagiChertezha: [
      'Высота $SO$ и диагональ основания $AC$; $O$ — её середина.',
      'Рабочий треугольник $SOA$: в нём известны $SO$ и $SA$.',
      'Высота перпендикулярна основанию: $\\angle SOA = 90^\\circ$.',
    ],
    ploskiy: {
      vershiny: ['O', 'A', 'S'],
      kateti: [10, 24],
      podpisi: { a: '?', b: '24', c: '26' },
      iskomoe: 'a',
      alt: 'Прямоугольный треугольник SOA: катет SO = 24, гипотенуза SA = 26, прямой угол при O, катет OA — искомый',
    },
    shagi: [
      {
        n: 1,
        paras: [
          'Пирамида правильная: в основании квадрат, вершина $S$ проецируется в его центр $O$ — точку пересечения диагоналей.',
        ],
      },
      {
        n: 2,
        paras: ['$AC = 2\\cdot OA$, а $OA$ — катет треугольника $SOA$, где $SA$ — гипотенуза.'],
      },
      {
        n: 3,
        paras: [
          '$SO$ — высота, она перпендикулярна плоскости основания, а $OA$ лежит в этой плоскости.',
        ],
        formuly: ['SO \\perp (ABC),\\ OA \\subset (ABC)\\ \\Rightarrow\\ SO \\perp OA'],
      },
      { n: 4, paras: ['Треугольник $SOA$ отдельно: прямой угол при $O$, $SO = 24$, $SA = 26$.'] },
      {
        n: 5,
        paras: [
          'Разность квадратов вместо $676 - 576$ в столбик. Или узнаём тройку: $10, 24, 26 = 2\\cdot(5, 12, 13)$.',
        ],
        formuly: [
          'OA^2 = 26^2 - 24^2 = (26 - 24)(26 + 24) = 2\\cdot 50 = 100',
          'OA = 10,\\quad AC = 2\\cdot OA = 20',
        ],
      },
    ],
    otvet: 'Ответ: $20$.',
    chislo: 20,
    proverka: { otrezok: [A, C] },
  };
}

/* ── Ступенька: расстояние между вершинами, угол, тангенс ───────── */

function stupenkaModel(
  s: Stupenka,
  alt: string,
  iskomoe: [string, string],
  shagUgla: number,
): { model: Model; A: Vec3; X: Vec3; F: Vec3 } {
  const v = vershinyStupenki(s);
  const A = v[iskomoe[0]] as Vec3;
  const X = v[iskomoe[1]] as Vec3;
  /* F — основание перпендикуляра из X на плоскость нижней грани. */
  const F: Vec3 = [X[0], X[1], 0];
  const body = teloStupenki(s, ['A', 'B', 'C', 'D', iskomoe[1]]);
  return {
    A,
    X,
    F,
    model: {
      alt,
      view: 'cabinet',
      bodies: [body],
      marks: [{ p: F, label: 'F', shag: 1 }],
      measures: [
        { a: v['A2'] as Vec3, b: v['B2'] as Vec3, text: String(s.w) },
        { a: v['A'] as Vec3, b: v['D'] as Vec3, text: String(s.D) },
        { a: v['A'] as Vec3, b: v['A2'] as Vec3, text: String(s.H) },
      ],
      lines: [
        { a: X, b: F, shag: 1 },
        { a: A, b: F, shag: 1 },
        { a: A, b: X, shag: 2 },
      ],
      sections: [{ points: [A, F, X], shag: 2 }],
      angles: [{ at: F, u: dir(F, A), v: dir(F, X), shag: shagUgla }],
    },
  };
}

export function primerStupenka(): PrimerG2 {
  const s: Stupenka = { W: 7, w: 3, H: 12, h: 4, D: 4 };
  const { model, A, X } = stupenkaModel(
    s,
    'Многогранник с прямыми двугранными углами: высокий блок 3 на 4 на 12, отрезок AC₂ и треугольник AFC₂',
    ['A', 'C2'],
    3,
  );
  return {
    id: 'stupenka',
    title: 'Расстояние между вершинами многогранника',
    uslovie:
      'Все двугранные углы многогранника на рисунке прямые. Размеры высокого блока: $3$, $4$ и $12$. Найдите расстояние между вершинами $A$ и $C_2$.',
    model,
    shagiChertezha: [
      'Опускаем перпендикуляр $C_2F$ на плоскость нижней грани; $AF$ — диагональ прямоугольника $3 \\times 4$.',
      'Рабочий треугольник $AFC_2$: искомое $AC_2$ — гипотенуза.',
      '$C_2F$ параллельно вертикальным рёбрам и перпендикулярно нижней грани: $\\angle AFC_2 = 90^\\circ$.',
    ],
    ploskiy: {
      vershiny: ['F', 'A', 'C2'],
      kateti: [5, 12],
      podpisi: { a: '5', b: '12', c: '?' },
      iskomoe: 'c',
      alt: 'Прямоугольный треугольник AFC₂: катеты AF = 5 и FC₂ = 12, прямой угол при F, гипотенуза AC₂ — искомая',
    },
    shagi: [
      {
        n: 1,
        paras: [
          'Все двугранные углы прямые — значит, тело собрано из прямоугольных блоков, и каждое ребро идёт по одному из трёх направлений: вправо, вглубь, вверх.',
        ],
      },
      {
        n: 2,
        paras: [
          'Из $C_2$ опускаем перпендикуляр $C_2F$ на плоскость нижней грани. Треугольник $AFC_2$ — рабочий: $AC_2$ в нём гипотенуза.',
        ],
      },
      {
        n: 3,
        paras: [
          '$C_2F$ параллельно вертикальным рёбрам, а они перпендикулярны нижней грани. $AF$ лежит в нижней грани.',
        ],
        formuly: ['C_2F \\perp (ABC),\\ AF \\subset (ABC)\\ \\Rightarrow\\ C_2F \\perp AF'],
      },
      {
        n: 4,
        paras: [
          'Сначала плоский прямоугольник $3 \\times 4$ в основании: $AF$ — его диагональ. Потом треугольник $AFC_2$ с катетами $AF$ и $12$.',
        ],
      },
      {
        n: 5,
        paras: ['Две тройки подряд: $3, 4, 5$ и $5, 12, 13$ — считать почти не нужно.'],
        formuly: ['AF = \\sqrt{3^2 + 4^2} = 5', 'AC_2 = \\sqrt{5^2 + 12^2} = 13'],
      },
    ],
    otvet: 'Ответ: $13$.',
    chislo: 13,
    proverka: { otrezok: [A, X] },
  };
}

export function primerUgol45(): PrimerG2 {
  const s: Stupenka = { W: 6, w: 3, H: 5, h: 2, D: 4 };
  const { model, A, X, F } = stupenkaModel(
    s,
    'Многогранник с прямыми двугранными углами: высокий блок 3 на 4 на 5, угол C₂AF',
    ['A', 'C2'],
    1,
  );
  return {
    id: 'ugol45',
    title: 'Угол в многограннике с прямыми углами',
    uslovie:
      'Все двугранные углы многогранника на рисунке прямые, размеры высокого блока $3$, $4$ и $5$. Точка $F$ — основание перпендикуляра из $C_2$ на плоскость нижней грани. Найдите угол $C_2AF$. Ответ дайте в градусах.',
    model,
    shagiChertezha: [
      'Перпендикуляр $C_2F$ и отрезок $AF$ в нижней грани.',
      'Рабочий треугольник $AFC_2$ с прямым углом при $F$.',
    ],
    ploskiy: {
      vershiny: ['F', 'A', 'C2'],
      kateti: [5, 5],
      podpisi: { a: '5', b: '5' },
      iskomoe: 'ugolB',
      alt: 'Прямоугольный треугольник AFC₂ с равными катетами 5 и 5; искомый угол при вершине A',
    },
    shagi: [
      { n: 1, paras: ['Многогранник из прямоугольных блоков. Данные: $3$, $4$, $5$.'] },
      { n: 2, paras: ['Угол $C_2AF$ — острый угол треугольника $AFC_2$.'] },
      {
        n: 3,
        paras: ['$C_2F$ перпендикулярно нижней грани, $AF$ в ней лежит.'],
        formuly: ['C_2F \\perp (ABC),\\ AF \\subset (ABC)\\ \\Rightarrow\\ \\angle AFC_2 = 90^\\circ'],
      },
      { n: 4, paras: ['Отдельно: прямоугольный треугольник с катетами $AF$ и $FC_2 = 5$.'] },
      {
        n: 5,
        paras: [
          'Катеты равны — треугольник равнобедренный, острые углы по $45^\\circ$. Тригонометрия не нужна.',
        ],
        formuly: ['AF = \\sqrt{3^2 + 4^2} = 5 = FC_2\\ \\Rightarrow\\ \\angle C_2AF = 45^\\circ'],
      },
    ],
    otvet: 'Ответ: $45$.',
    chislo: 45,
    proverka: { ugol: [X, A, F] },
  };
}

export function primerTangens(): PrimerG2 {
  const s: Stupenka = { W: 10, w: 6, H: 15, h: 5, D: 8 };
  const { model, A, X, F } = stupenkaModel(
    s,
    'Многогранник с прямыми двугранными углами: высокий блок 6 на 8 на 15, угол C₂AF',
    ['A', 'C2'],
    1,
  );
  return {
    id: 'tangens',
    title: 'Тангенс угла',
    uslovie:
      'Все двугранные углы многогранника на рисунке прямые, размеры высокого блока $6$, $8$ и $15$. Точка $F$ — основание перпендикуляра из $C_2$ на плоскость нижней грани. Найдите тангенс угла $C_2AF$.',
    model,
    shagiChertezha: [
      'Перпендикуляр $C_2F$ и отрезок $AF$ в нижней грани.',
      'Рабочий треугольник $AFC_2$ с прямым углом при $F$.',
    ],
    ploskiy: {
      vershiny: ['F', 'A', 'C2'],
      kateti: [10, 15],
      podpisi: { a: '10', b: '15' },
      iskomoe: 'ugolB',
      alt: 'Прямоугольный треугольник AFC₂ с катетами AF = 10 и FC₂ = 15; искомый угол при вершине A',
    },
    shagi: [
      { n: 1, paras: ['Многогранник из прямоугольных блоков. Данные: $6$, $8$, $15$.'] },
      { n: 2, paras: ['Угол $C_2AF$ — острый угол треугольника $AFC_2$.'] },
      {
        n: 3,
        paras: ['Как и раньше: $C_2F$ перпендикулярно нижней грани, значит $\\angle AFC_2 = 90^\\circ$.'],
      },
      {
        n: 4,
        paras: ['Тангенс острого угла — противолежащий катет, делённый на прилежащий.'],
      },
      {
        n: 5,
        paras: ['$6, 8, 10$ — тройка $3, 4, 5$, умноженная на $2$.'],
        formuly: [
          'AF = \\sqrt{6^2 + 8^2} = 10',
          '\\operatorname{tg}\\angle C_2AF = \\dfrac{FC_2}{AF} = \\dfrac{15}{10} = 1{,}5',
        ],
      },
    ],
    otvet: 'Ответ: $1{,}5$.',
    chislo: 1.5,
    proverka: { ugol: [X, A, F] },
  };
}

/** Все разобранные примеры главы — для страницы и автотеста. */
export function primeryGlavy2(): PrimerG2[] {
  return [primerDiagonal(), primerPiramida(), primerStupenka(), primerUgol45(), primerTangens()];
}

/* ── Задачи к «Важно», «Лайфхакам» и «Ловушкам» ─────────────────── */

/** Задача к рамке: условие, решение по шагам, ответ числом для автотеста. */
export interface ZadachaRamki {
  uslovie: string;
  reshenie: readonly string[];
  formuly?: readonly string[];
  otvet: string;
  chislo: number;
  /** Как пересчитать ответ независимо: по координатам. */
  pereschet: () => number;
}

const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** «Важно»: перпендикуляр к плоскости перпендикулярен любой её прямой. */
export const VAZHNO_LYUBAYA: ZadachaRamki = {
  uslovie:
    'Куб $ABCDA_1B_1C_1D_1$. Найдите угол между прямыми $AA_1$ и $BD$. Ответ дайте в градусах.',
  reshenie: [
    'Прямые $AA_1$ и $BD$ скрещиваются: общей точки у них нет. Но $BD$ лежит в плоскости основания, а ребро $AA_1$ ей перпендикулярно — значит, $AA_1$ перпендикулярно и $BD$, хотя через точку $A$ прямая $BD$ не проходит.',
  ],
  formuly: ['AA_1 \\perp (ABC),\\ BD \\subset (ABC)\\ \\Rightarrow\\ AA_1 \\perp BD'],
  otvet: 'Ответ: $90$.',
  chislo: 90,
  pereschet: () => {
    const c = box(1, 1, 1);
    const u = dir(vertex(c, 'A'), vertex(c, 'A1'));
    const v = dir(vertex(c, 'B'), vertex(c, 'D'));
    const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (Math.hypot(...u) * Math.hypot(...v));
    return Math.round((Math.acos(Math.abs(cos)) * 180) / Math.PI);
  },
};

/** «Важно»: расстояние в многограннике с прямыми углами — по трём сдвигам. */
export const VAZHNO_SDVIGI: ZadachaRamki = {
  uslovie:
    'Все двугранные углы многогранника прямые. Чтобы пройти по рёбрам от вершины $M$ до вершины $N$, нужно сдвинуться на $2$ вправо, на $3$ вглубь и на $6$ вверх. Найдите $MN$.',
  reshenie: [
    'Два Пифагора подряд — сначала в горизонтальной плоскости, потом с вертикальным катетом — складываются в одну формулу: квадрат расстояния равен сумме квадратов трёх сдвигов.',
  ],
  formuly: ['MN^2 = 2^2 + 3^2 + 6^2 = 4 + 9 + 36 = 49,\\quad MN = 7'],
  otvet: 'Ответ: $7$.',
  chislo: 7,
  pereschet: () => dist(P(0, 0, 0), P(2, 3, 6)),
};

/** «Лайфхак»: корень на промежуточном шаге не извлекаем. */
export const LAYFHAK_KVADRAT: ZadachaRamki = {
  uslovie: 'Рёбра прямоугольного параллелепипеда равны $1$, $4$ и $8$. Найдите его диагональ.',
  reshenie: [
    'Диагональ основания $\\sqrt{17}$ — некрасивое число, но извлекать его не нужно: в следующий Пифагор она войдёт квадратом.',
  ],
  formuly: ['d^2 = (1^2 + 4^2) + 8^2 = 17 + 64 = 81,\\quad d = 9'],
  otvet: 'Ответ: $9$.',
  chislo: 9,
  pereschet: () => dist(P(0, 0, 0), P(1, 4, 8)),
};

/** «Лайфхак»: пространственные тройки. */
export const LAYFHAK_TROYKI: ZadachaRamki = {
  uslovie: 'Рёбра прямоугольного параллелепипеда равны $2$, $6$ и $9$. Найдите его диагональ.',
  reshenie: [
    'Бывают «тройки» и в пространстве — четвёрки, где сумма трёх квадратов — точный квадрат: $1, 2, 2 \\to 3$; $2, 3, 6 \\to 7$; $1, 4, 8 \\to 9$; $2, 6, 9 \\to 11$. Узнали четвёрку — ответ готов.',
  ],
  formuly: ['2^2 + 6^2 + 9^2 = 4 + 36 + 81 = 121 = 11^2'],
  otvet: 'Ответ: $11$.',
  chislo: 11,
  pereschet: () => dist(P(0, 0, 0), P(2, 6, 9)),
};

/** «Лайфхак»: равные катеты — 45°. */
export const LAYFHAK_45: ZadachaRamki = {
  uslovie:
    'В прямоугольном треугольнике рабочей плоскости катеты равны $\\sqrt{13}$ и $\\sqrt{13}$. Найдите острый угол. Ответ дайте в градусах.',
  reshenie: [
    'Длины катетов можно даже не считать до конца: если они равны, треугольник равнобедренный, и оба острых угла — по $45^\\circ$.',
  ],
  otvet: 'Ответ: $45$.',
  chislo: 45,
  pereschet: () => (Math.atan2(Math.sqrt(13), Math.sqrt(13)) * 180) / Math.PI,
};

/** «Ловушка»: перпендикуляр к плоскости — по двум пересекающимся прямым. */
export const LOVUSHKA_ODNA: {
  title: string;
  neverno: readonly string[];
  verno: readonly string[];
} = {
  title: 'одной перпендикулярной прямой мало',
  neverno: [
    'В пирамиде $SABCD$ боковое ребро $SA \\perp AB$. «Значит, $SA$ перпендикулярно основанию, и треугольник $SAC$ прямоугольный».',
  ],
  verno: [
    'Прямая перпендикулярна плоскости, если она перпендикулярна двум пересекающимся прямым этой плоскости. Нужно ещё $SA \\perp AD$ — тогда $SA \\perp (ABC)$ и $\\angle SAC = 90^\\circ$.',
  ],
};

/** «Ловушка»: прямой угол «на глаз». */
export const LOVUSHKA_GLAZ: {
  title: string;
  neverno: readonly string[];
  verno: readonly string[];
} = {
  title: 'прямой угол «на глаз»',
  neverno: [
    'На чертеже ступеньки угол $ABC_2$ выглядит прямым: «$AC_2^2 = AB^2 + BC_2^2$».',
  ],
  verno: [
    'На параллельной проекции прямые углы искажаются, а непрямые бывают похожи на прямые. Угол $90^\\circ$ только тот, что обоснован: ребро $\\perp$ грани, высота $\\perp$ основанию. Для $AC_2$ рабочий треугольник — $AFC_2$ с перпендикуляром $C_2F$.',
  ],
};
