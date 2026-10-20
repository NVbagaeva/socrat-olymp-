/**
 * Разобранные примеры типов задачи №15 — карточки вкладки «О задании»
 * (docs/stereometry-plan.md, этап 2). Каждый — задача текущего
 * открытого банка ФИПИ (номер в `fipi`), решённая полностью: пункт а —
 * доказательство, пункт б — вычисление.
 *
 * Ответ проверяется независимо: `proverka` считает ту же величину по
 * координатам модели чертежа (pnpm test:stereo-razbory). Модель —
 * lib/solid в настоящих размерах задачи, шаги — поле shag.
 */

import { box, pyramid } from '../solid/figures';
import type { Model } from '../solid/model';
import { type Vec3, add, cross, dot, length, lerp, mid, scale, sub } from '../solid/vec';
import type { RazborStereo, ShagRazbora } from './razbory3';

const v = (x: number, y: number, z: number): Vec3 => [x, y, z];
const dist = (a: Vec3, b: Vec3) => length(sub(a, b));
/** Расстояние от точки до прямой ab. */
const doPryamoy = (p: Vec3, a: Vec3, b: Vec3) => length(cross(sub(p, a), sub(b, a))) / dist(a, b);
/** Угол между векторами, градусы. */
const ugol = (a: Vec3, b: Vec3) =>
  (Math.acos(Math.abs(dot(a, b)) / (length(a) * length(b))) * 180) / Math.PI;
const RAD = 180 / Math.PI;

/* ── Цилиндр: общий пункт а трёх задач банка ───────────────────── */

const CILINDR_A: readonly ShagRazbora[] = [
  {
    punkt: 'а',
    chto: 'Опускаем точку $C_1$ на нижнее основание',
    zachem: [
      'Пусть $CC_1$ — образующая, $C$ лежит на окружности нижнего основания. Отрезок $AC_1$ пересекает ось цилиндра, значит, его проекция $AC$ на плоскость нижнего основания проходит через проекцию оси — центр основания. Поэтому $AC$ — диаметр.',
    ],
  },
  {
    chto: 'Угол $ABC$ прямой',
    zachem: [
      'Вписанный угол, опирающийся на диаметр, прямой: $\\angle ABC = 90^\\circ$, то есть $AB \\perp BC$.',
    ],
  },
  {
    chto: 'Прямая $AB$ перпендикулярна плоскости $BCC_1$',
    zachem: [
      'Образующая $BB_1$ перпендикулярна основанию, поэтому $AB \\perp BB_1$. Прямая $AB$ перпендикулярна двум пересекающимся прямым $BC$ и $BB_1$ плоскости $BCC_1B_1$, значит, перпендикулярна и всей плоскости, а с ней — прямой $BC_1$ в этой плоскости: $\\angle ABC_1 = 90^\\circ$.',
    ],
  },
];

/** Точки задачи с цилиндром: A и C — концы диаметра, B на окружности. */
function cilindrTochki(ab: number, bc: number, h: number) {
  const r = Math.hypot(ab, bc) / 2;
  const A = v(-r, 0, 0);
  const C = v(r, 0, 0);
  /* B на окружности: из |AB| = ab получаем абсциссу B. */
  const bx = (ab * ab) / (2 * r) - r;
  const B = v(bx, -Math.sqrt(Math.max(0, r * r - bx * bx)), 0);
  const up = v(0, 0, h);
  return { r, A, B, C, B1: add(B, up), C1: add(C, up), h };
}

function cilindrModel(ab: number, bc: number, h: number, alt: string): Model {
  const { r, A, B, C, B1, C1 } = cilindrTochki(ab, bc, h);
  return {
    alt,
    bodies: [{ kind: 'cylinder', base: [0, 0, 0], r, h, glass: true }],
    marks: [
      { p: A, label: 'A' },
      { p: B, label: 'B' },
      { p: B1, label: 'B1' },
      { p: C1, label: 'C1' },
      { p: C, label: 'C', shag: 1 },
    ],
    lines: [
      { a: B, b: B1 },
      { a: A, b: C1 },
      { a: B1, b: C1 },
      { a: C, b: C1, shag: 1 },
      { a: A, b: C, shag: 1 },
      { a: A, b: B, shag: 2 },
      { a: B, b: C, shag: 2 },
      { a: B, b: C1, shag: 3 },
    ],
    angles: [
      { at: B, u: sub(A, B), v: sub(C, B), shag: 2 },
      { at: B, u: sub(A, B), v: sub(C1, B), shag: 3 },
    ],
  };
}

export const RAZBORY_15: readonly RazborStereo[] = [
  {
    tip: 'ploshchad-secheniya',
    fipi: '30ED04',
    uslovie:
      'В основании правильной треугольной пирамиды $ABCD$ лежит треугольник $ABC$ со стороной 6. Боковое ребро пирамиды равно 5. На ребре $AD$ отмечена точка $T$ так, что $AT : TD = 2 : 1$. Через точку $T$ параллельно прямым $AC$ и $BD$ проведена плоскость. а) Докажите, что сечение пирамиды этой плоскостью — прямоугольник. б) Найдите площадь сечения.',
    model: () => {
      const R = 2 * Math.sqrt(3);
      const at = (deg: number) =>
        v(R * Math.cos((deg * Math.PI) / 180), R * Math.sin((deg * Math.PI) / 180), 0);
      const [A, B, C] = [at(200), at(320), at(80)];
      const D = v(0, 0, Math.sqrt(13));
      const p = pyramid([A, B, C], D, ['A', 'B', 'C'], 'D');
      const T = lerp(A, D, 2 / 3);
      const P = lerp(C, D, 2 / 3);
      const Q = lerp(A, B, 2 / 3);
      const Rr = lerp(C, B, 2 / 3);
      const O = v(0, 0, 0);
      const E = mid(A, C);
      return {
        alt: 'Правильная треугольная пирамида ABCD и сечение TQRP',
        bodies: [p],
        marks: [
          { p: T, label: 'T' },
          { p: P, label: 'P', shag: 1 },
          { p: Q, label: 'Q', shag: 1 },
          { p: Rr, label: 'R', shag: 2 },
          { p: O, label: 'O', shag: 3 },
          { p: E, label: 'E', shag: 3 },
        ],
        lines: [
          { a: T, b: P, shag: 1 },
          { a: T, b: Q, shag: 1 },
          { a: Q, b: Rr, shag: 2 },
          { a: P, b: Rr, shag: 2 },
          { a: D, b: O, shag: 3 },
          { a: B, b: E, shag: 3 },
          { a: T, b: P, label: '2', shag: 4 },
          { a: T, b: Q, label: '10/3', shag: 5 },
        ],
        sections: [{ points: [T, Q, Rr, P], shag: 2 }],
        angles: [{ at: E, u: sub(B, E), v: sub(A, E), shag: 3 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Строим сечение',
        zachem: [
          'Плоскость параллельна $AC$, а грань $ACD$ содержит $AC$ и общую с плоскостью точку $T$. Если плоскость проходит через точку и параллельна прямой другой плоскости, они пересекаются по прямой, параллельной этой прямой. Поэтому в грани $ACD$ проводим $TP \\parallel AC$, $P \\in CD$; в грани $ABD$ — $TQ \\parallel BD$, $Q \\in AB$.',
        ],
      },
      {
        chto: 'Замыкаем сечение и видим параллелограмм',
        zachem: [
          'По тому же правилу в основании $QR \\parallel AC$, а в грани $BCD$ — $PR \\parallel BD$. Противоположные стороны четырёхугольника $TQRP$ параллельны одной прямой: $TP \\parallel QR \\parallel AC$, $TQ \\parallel PR \\parallel BD$ — это параллелограмм.',
        ],
      },
      {
        chto: 'Доказываем, что $AC \\perp BD$',
        zachem: [
          'Пирамида правильная: высота $DO$ падает в центр $O$ треугольника $ABC$. Медиана $BE$ равностороннего треугольника — и его высота: $BE \\perp AC$. Отрезок $BO$ лежит на $BE$ и является проекцией наклонной $BD$ на основание. По теореме о трёх перпендикулярах $BD \\perp AC$.',
          'Соседние стороны параллелограмма параллельны $AC$ и $BD$, значит, перпендикулярны: сечение — прямоугольник.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Находим сторону $TP$',
        zachem: [
          'Треугольник $DTP$ подобен треугольнику $DAC$ ($TP \\parallel AC$) с коэффициентом $\\tfrac{DT}{DA} = \\tfrac13$.',
        ],
        formuly: ['TP = \\tfrac13\\, AC = \\tfrac13 \\cdot 6 = 2'],
      },
      {
        chto: 'Находим сторону $TQ$',
        zachem: [
          'Треугольник $ATQ$ подобен треугольнику $ADB$ ($TQ \\parallel DB$) с коэффициентом $\\tfrac{AT}{AD} = \\tfrac23$; боковое ребро $BD = 5$.',
        ],
        formuly: ['TQ = \\tfrac23\\, BD = \\tfrac23 \\cdot 5 = \\tfrac{10}{3}'],
      },
      {
        chto: 'Считаем площадь прямоугольника',
        zachem: ['Площадь прямоугольника — произведение соседних сторон.'],
        formuly: ['S = TP \\cdot TQ = 2 \\cdot \\tfrac{10}{3} = \\tfrac{20}{3}'],
      },
    ],
    otvet: 20 / 3,
    otvetTex: '$\\tfrac{20}{3}$',
    proverka: () => {
      const R = 2 * Math.sqrt(3);
      const at = (deg: number) =>
        v(R * Math.cos((deg * Math.PI) / 180), R * Math.sin((deg * Math.PI) / 180), 0);
      const [A, B, C] = [at(200), at(320), at(80)];
      const D = v(0, 0, Math.sqrt(13));
      const T = lerp(A, D, 2 / 3);
      return length(cross(sub(lerp(A, B, 2 / 3), T), sub(lerp(C, D, 2 / 3), T)));
    },
  },
  {
    tip: 'obem',
    fipi: '4679B2',
    uslovie:
      'В правильной треугольной пирамиде $SABC$ сторона основания $AB$ равна 6, а боковое ребро $SA$ равно $\\sqrt{21}$. На рёбрах $AB$ и $SB$ отмечены точки $M$ и $K$ соответственно, причём $AM = 4$, $SK : KB = 1 : 3$. а) Докажите, что плоскость $CKM$ перпендикулярна плоскости $ABC$. б) Найдите объём пирамиды $BCKM$.',
    model: () => {
      const A = v(0, 0, 0);
      const B = v(6, 0, 0);
      const C = v(3, 3 * Math.sqrt(3), 0);
      const O = v(3, Math.sqrt(3), 0);
      const S = v(3, Math.sqrt(3), 3);
      const M = v(4, 0, 0);
      const K = lerp(S, B, 1 / 4);
      const H = v(K[0], K[1], 0);
      return {
        alt: 'Правильная треугольная пирамида SABC и плоскость CKM',
        bodies: [pyramid([A, B, C], S, ['A', 'B', 'C'], 'S')],
        marks: [
          { p: M, label: 'M' },
          { p: K, label: 'K' },
          { p: O, label: 'O', shag: 1 },
          { p: H, label: 'H', shag: 2 },
        ],
        lines: [
          { a: S, b: O, label: '3', shag: 1 },
          { a: O, b: B, shag: 2 },
          { a: K, b: H, shag: 2 },
          { a: C, b: M, shag: 3 },
          { a: K, b: H, label: '9/4', shag: 5 },
        ],
        sections: [
          { points: [C, K, M], shag: 3 },
          { points: [B, C, M], shag: 4 },
        ],
        angles: [
          { at: O, u: sub(B, O), v: sub(S, O), shag: 1 },
          { at: H, u: sub(B, H), v: sub(K, H), shag: 2 },
        ],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Находим высоту пирамиды',
        zachem: [
          'Высота правильной пирамиды падает в центр $O$ основания. Радиус описанной окружности правильного треугольника $AO = \\tfrac{6}{\\sqrt3} = 2\\sqrt3$; треугольник $SOA$ прямоугольный.',
        ],
        formuly: ['SO = \\sqrt{SA^2 - AO^2} = \\sqrt{21 - 12} = 3'],
      },
      {
        chto: 'Опускаем перпендикуляр из $K$',
        zachem: [
          'Проведём $KH \\parallel SO$ в плоскости $SOB$: $KH \\perp ABC$, а точка $H$ лежит на $OB$, причём $BH : BO = BK : BS = 3 : 4$.',
        ],
      },
      {
        chto: 'Показываем, что $H$ лежит на $CM$',
        zachem: [
          'Введём координаты в основании: $A(0;0)$, $B(6;0)$, $C(3;3\\sqrt3)$, центр $O(3;\\sqrt3)$, $M(4;0)$. Тогда $H = B + \\tfrac34(O - B) = \\left(\\tfrac{15}{4};\\tfrac{3\\sqrt3}{4}\\right)$, и это точка $M + \\tfrac14(C - M)$ — она лежит на отрезке $CM$.',
          'Плоскость $CKM$ проходит через прямую $KH$, перпендикулярную плоскости $ABC$. По признаку перпендикулярности плоскостей $CKM \\perp ABC$.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Берём за основание треугольник $BCM$',
        zachem: [
          'У пирамиды $BCKM$ вершина $K$, основание $BCM$ лежит в плоскости $ABC$. $BM = 6 - 4 = 2$, высота треугольника $ABC$ к стороне $AB$ равна $3\\sqrt3$.',
        ],
        formuly: ['S_{BCM} = \\tfrac12 \\cdot 2 \\cdot 3\\sqrt3 = 3\\sqrt3'],
      },
      {
        chto: 'Высота — отрезок $KH$',
        zachem: ['Треугольник $BKH$ подобен $BSO$ с коэффициентом $\\tfrac{BK}{BS} = \\tfrac34$.'],
        formuly: ['KH = \\tfrac34 \\cdot SO = \\tfrac94'],
      },
      {
        chto: 'Считаем объём',
        zachem: ['Объём пирамиды — треть произведения площади основания на высоту.'],
        formuly: ['V = \\tfrac13 \\cdot 3\\sqrt3 \\cdot \\tfrac94 = \\tfrac{9\\sqrt3}{4}'],
      },
    ],
    otvet: (9 * Math.sqrt(3)) / 4,
    otvetTex: '$\\tfrac{9\\sqrt3}{4}$',
    proverka: () => {
      const B = v(6, 0, 0);
      const C = v(3, 3 * Math.sqrt(3), 0);
      const S = v(3, Math.sqrt(3), 3);
      const M = v(4, 0, 0);
      const K = lerp(S, B, 1 / 4);
      return Math.abs(dot(sub(C, B), cross(sub(K, B), sub(M, B)))) / 6;
    },
  },
  {
    tip: 'ugol-ploskostey',
    fipi: '17B23F',
    uslovie:
      'Сечением прямоугольного параллелепипеда $ABCDA_1B_1C_1D_1$ плоскостью $\\alpha$, содержащей прямую $BD_1$ и параллельной прямой $AC$, является ромб. а) Докажите, что грань $ABCD$ — квадрат. б) Найдите угол между плоскостями $\\alpha$ и $BCC_1$, если $AA_1 = 6$, $AB = 4$.',
    model: () => {
      const b = box(4, 4, 6);
      const B = v(4, 0, 0);
      const D1 = v(0, 4, 6);
      const M = v(0, 0, 3);
      const K = v(4, 4, 3);
      const M2 = v(4, 0, 3);
      const C1 = v(4, 4, 6);
      return {
        alt: 'Параллелепипед и сечение-ромб BKD₁M',
        bodies: [b],
        marks: [
          { p: M, label: 'M' },
          { p: K, label: 'K' },
          { p: M2, label: "M'", shag: 5 },
        ],
        sections: [
          { points: [B, K, D1, M], shag: 1 },
          { points: [B, M2, C1, K], shag: 5 },
        ],
        lines: [
          { a: M, b: K, shag: 1 },
          { a: B, b: D1, shag: 2 },
          { a: v(0, 0, 0), b: v(4, 4, 0), shag: 2 },
          { a: B, b: v(0, 4, 0), shag: 3 },
        ],
        angles: [{ at: v(2, 2, 0), u: v(1, 1, 0), v: v(-1, 1, 0), shag: 3 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Строим сечение',
        zachem: [
          'Плоскость $\\alpha$ параллельна $AC$, а плоскость $ACC_1A_1$ содержит $AC$, поэтому они пересекаются по прямой $MK \\parallel AC$ ($M \\in AA_1$, $K \\in CC_1$). Противоположные грани параллелепипеда параллельны, поэтому $BK \\parallel MD_1$ и $BM \\parallel KD_1$: сечение $BKD_1M$ — параллелограмм, по условию ромб.',
        ],
      },
      {
        chto: 'Диагонали ромба перпендикулярны',
        zachem: ['$BD_1 \\perp MK$, а $MK \\parallel AC$, значит, $BD_1 \\perp AC$.'],
      },
      {
        chto: 'Переходим к основанию',
        zachem: [
          '$BD$ — проекция наклонной $BD_1$ на плоскость основания. По теореме о трёх перпендикулярах из $BD_1 \\perp AC$ следует $BD \\perp AC$. Прямоугольник $ABCD$ с перпендикулярными диагоналями — квадрат.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Считаем площадь ромба',
        zachem: [
          'Площадь ромба — половина произведения диагоналей. $MK = AC = 4\\sqrt2$ ($AMKC$ — параллелограмм), $BD_1 = \\sqrt{4^2 + 4^2 + 6^2} = 2\\sqrt{17}$.',
        ],
        formuly: ['S = \\tfrac12 \\cdot 2\\sqrt{17} \\cdot 4\\sqrt2 = 4\\sqrt{34}'],
      },
      {
        chto: 'Проецируем ромб на грань $BCC_1B_1$',
        zachem: [
          "Ребро $AB$ перпендикулярно грани $BCC_1B_1$, поэтому проецируем вдоль $AB$: $B$ и $K$ остаются на месте, $D_1$ переходит в $C_1$, $M$ — в середину $M'$ ребра $BB_1$. Проекция — параллелограмм $BM'C_1K$ со стороной $BM' = 3$ и высотой $BC = 4$.",
        ],
        formuly: ['S_{\\text{пр}} = 3 \\cdot 4 = 12'],
      },
      {
        chto: 'Находим угол по площади проекции',
        zachem: [
          'Площадь проекции многоугольника равна его площади, умноженной на косинус угла между плоскостями.',
        ],
        formuly: [
          '\\cos\\varphi = \\dfrac{S_{\\text{пр}}}{S} = \\dfrac{12}{4\\sqrt{34}} = \\dfrac{3}{\\sqrt{34}}',
          '\\varphi = \\arccos\\dfrac{3}{\\sqrt{34}}',
        ],
      },
    ],
    otvet: Math.acos(3 / Math.sqrt(34)) * RAD,
    otvetTex: '$\\arccos\\dfrac{3}{\\sqrt{34}}$',
    proverka: () => {
      const n = cross(sub(v(0, 4, 6), v(4, 0, 0)), v(1, 1, 0));
      return ugol(n, v(1, 0, 0));
    },
  },
  {
    tip: 'do-ploskosti',
    fipi: '5D991D',
    uslovie:
      'В пирамиде $ABCD$ рёбра $DA$, $DB$ и $DC$ попарно перпендикулярны, а $AB = BC = AC = 6\\sqrt2$. а) Докажите, что эта пирамида правильная. б) На рёбрах $DA$ и $DC$ отмечены точки $M$ и $N$ соответственно, причём $DM : MA = DN : NC = 1 : 2$. Найдите расстояние от точки $D$ до плоскости $MNB$.',
    model: () => {
      const D = v(0, 0, 0);
      const A = v(6, 0, 0);
      const B = v(0, 6, 0);
      const C = v(0, 0, 6);
      const M = v(2, 0, 0);
      const N = v(0, 0, 2);
      const O = v(2, 2, 2);
      const F = v(18 / 19, 6 / 19, 18 / 19);
      const H = mid(M, N);
      return {
        alt: 'Пирамида с попарно перпендикулярными рёбрами при вершине D и плоскость MNB',
        bodies: [pyramid([A, B, C], D, ['A', 'B', 'C'], 'D')],
        marks: [
          { p: O, label: 'O', shag: 2 },
          { p: M, label: 'M', shag: 3 },
          { p: N, label: 'N', shag: 3 },
          { p: H, label: 'H', shag: 5 },
        ],
        angles: [
          { at: D, u: A, v: B, shag: 1 },
          { at: D, u: B, v: C, shag: 1 },
          { at: D, u: A, v: C, shag: 1 },
          { at: H, u: sub(M, H), v: sub(B, H), shag: 5 },
        ],
        lines: [
          { a: D, b: O, shag: 2 },
          { a: B, b: H, shag: 5 },
          { a: D, b: F, label: 'd', shag: 6 },
        ],
        sections: [{ points: [M, N, B], shag: 3 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Находим боковые рёбра',
        zachem: [
          'Грани при вершине $D$ — прямоугольные треугольники. По теореме Пифагора $DA^2 + DB^2 = 72$, $DB^2 + DC^2 = 72$ и $DA^2 + DC^2 = 72$. Вычитая равенства попарно, получаем $DA = DB = DC$, и каждое равно $6$.',
        ],
      },
      {
        chto: 'Узнаём правильную пирамиду',
        zachem: [
          'Основание $ABC$ — правильный треугольник. Боковые рёбра равны, поэтому их проекции на основание тоже равны: высота падает в центр описанной окружности основания $O$. Основание правильное, высота — в его центр: пирамида правильная.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Находим $DM$, $DN$, $DB$',
        zachem: ['$DM = \\tfrac13 DA = 2$, $DN = \\tfrac13 DC = 2$, $DB = 6$.'],
      },
      {
        chto: 'Считаем объём пирамиды $DMNB$',
        zachem: [
          'Рёбра при вершине $D$ попарно перпендикулярны: за основание берём прямоугольный треугольник $DMN$, высота — $DB$.',
        ],
        formuly: ['V = \\tfrac13 \\cdot \\tfrac12 \\cdot 2 \\cdot 2 \\cdot 6 = 4'],
      },
      {
        chto: 'Считаем площадь треугольника $MNB$',
        zachem: [
          '$MN = 2\\sqrt2$, $MB = NB = \\sqrt{2^2 + 6^2} = 2\\sqrt{10}$: треугольник равнобедренный, высота $BH$ падает в середину $MN$.',
        ],
        formuly: [
          'BH = \\sqrt{40 - 2} = \\sqrt{38}',
          'S_{MNB} = \\tfrac12 \\cdot 2\\sqrt2 \\cdot \\sqrt{38} = 2\\sqrt{19}',
        ],
      },
      {
        chto: 'Находим расстояние методом объёмов',
        zachem: [
          'Тот же объём через основание $MNB$: высота к нему — искомое расстояние $d$ от точки $D$ до плоскости.',
        ],
        formuly: ['d = \\dfrac{3V}{S_{MNB}} = \\dfrac{12}{2\\sqrt{19}} = \\dfrac{6\\sqrt{19}}{19}'],
      },
    ],
    otvet: 6 / Math.sqrt(19),
    otvetTex: '$\\dfrac{6\\sqrt{19}}{19}$',
    proverka: () => {
      const M = v(2, 0, 0);
      const N = v(0, 0, 2);
      const B = v(0, 6, 0);
      const n = cross(sub(N, M), sub(B, M));
      return Math.abs(dot(n, sub(v(0, 0, 0), M))) / length(n);
    },
  },
  {
    tip: 'otnoshenie',
    fipi: '0B28A5',
    uslovie:
      'В прямоугольном параллелепипеде $ABCDA_1B_1C_1D_1$ через середину $M$ диагонали $AC_1$ проведена плоскость $\\alpha$ перпендикулярно этой диагонали, $AB = 5$, $BC = 3$, $AA_1 = 4$. а) Докажите, что плоскость $\\alpha$ содержит точку $D_1$. б) Найдите отношение, в котором плоскость $\\alpha$ делит ребро $A_1B_1$.',
    model: () => {
      const b = box(5, 3, 4);
      const A = v(0, 0, 0);
      const C1 = v(5, 3, 4);
      const D1 = v(0, 3, 4);
      const B = v(5, 0, 0);
      const M = mid(A, C1);
      const P = v(9 / 5, 0, 4);
      const Q = v(16 / 5, 3, 0);
      return {
        alt: 'Параллелепипед и плоскость, перпендикулярная диагонали AC₁ в её середине',
        bodies: [b],
        marks: [
          { p: M, label: 'M' },
          { p: P, label: 'P', shag: 4 },
        ],
        lines: [
          { a: A, b: C1 },
          { a: A, b: C1, shag: 1 },
          { a: D1, b: A, label: '5', shag: 2 },
          { a: D1, b: C1, label: '5', shag: 2 },
          { a: P, b: A, shag: 4 },
          { a: P, b: C1, shag: 4 },
        ],
        sections: [{ points: [B, P, D1, Q], shag: 3 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Узнаём плоскость $\\alpha$',
        zachem: [
          'Плоскость, перпендикулярная отрезку и проходящая через его середину, — это множество точек, равноудалённых от его концов (серединный перпендикуляр в пространстве). Значит, точка лежит в $\\alpha$ тогда и только тогда, когда она одинаково удалена от $A$ и $C_1$.',
        ],
      },
      {
        chto: 'Сравниваем $D_1A$ и $D_1C_1$',
        zachem: ['$D_1A$ — диагональ грани $AA_1D_1D$, $D_1C_1 = AB$.'],
        formuly: ['D_1A = \\sqrt{3^2 + 4^2} = 5 = AB = D_1C_1'],
      },
      {
        chto: 'Делаем вывод',
        zachem: [
          'Точка $D_1$ равноудалена от $A$ и $C_1$, поэтому лежит в плоскости $\\alpha$. (Так же в ней лежит вершина $B$: $BA = 5$, $BC_1 = \\sqrt{3^2 + 4^2} = 5$.)',
        ],
      },
      {
        punkt: 'б',
        chto: 'Ищем точку $P$ на $A_1B_1$, равноудалённую от $A$ и $C_1$',
        zachem: [
          'Пусть $A_1P = x$. Из прямоугольных треугольников $AA_1P$ и $PB_1C_1$ (рёбра $AA_1$ и $B_1C_1$ перпендикулярны $A_1B_1$):',
        ],
        formuly: [
          'PA^2 = x^2 + 4^2,\\qquad PC_1^2 = (5 - x)^2 + 3^2',
          'x^2 + 16 = 25 - 10x + x^2 + 9 \\;\\Rightarrow\\; x = \\tfrac95',
        ],
      },
      {
        chto: 'Записываем отношение',
        zachem: ['$PB_1 = 5 - \\tfrac95 = \\tfrac{16}{5}$, считаем от точки $A_1$.'],
        formuly: ['A_1P : PB_1 = 9 : 16'],
      },
    ],
    otvet: 9 / 16,
    otvetTex: '$9 : 16$',
    proverka: () => {
      /* Точка на A1B1 в плоскости 5x + 3y + 4z = 25. */
      const t = (25 - 16) / 5;
      return t / (5 - t);
    },
  },
  {
    tip: 'pryamaya-ploskost',
    fipi: '135c80',
    uslovie:
      'В правильной четырёхугольной пирамиде $SABCD$ точки $M$ и $K$ — середины рёбер $AB$ и $SD$ соответственно. а) Докажите, что прямая $MK$ параллельна плоскости $SBC$. б) Найдите высоту пирамиды, если $AB = 12$, а угол между прямой $MK$ и плоскостью основания пирамиды равен $60^\\circ$.',
    model: () => {
      const h = 6 * Math.sqrt(30);
      const A = v(-6, -6, 0);
      const B = v(6, -6, 0);
      const C = v(6, 6, 0);
      const D = v(-6, 6, 0);
      const S = v(0, 0, h);
      const M = mid(A, B);
      const K = mid(S, D);
      const N = mid(S, C);
      const O = v(0, 0, 0);
      const H = mid(O, D);
      return {
        alt: 'Правильная четырёхугольная пирамида SABCD с отрезком MK',
        bodies: [pyramid([A, B, C, D], S)],
        marks: [
          { p: M, label: 'M' },
          { p: K, label: 'K' },
          { p: N, label: 'N', shag: 1 },
          { p: O, label: 'O', shag: 4 },
          { p: H, label: 'H', shag: 4 },
        ],
        lines: [
          { a: M, b: K },
          { a: K, b: N, shag: 1 },
          { a: B, b: N, shag: 2 },
          { a: S, b: O, shag: 4 },
          { a: K, b: H, shag: 4 },
          { a: M, b: H, shag: 5 },
        ],
        sections: [
          { points: [M, B, N, K], shag: 2 },
          { points: [M, H, K], shag: 6 },
        ],
        angles: [{ at: H, u: sub(M, H), v: sub(K, H), shag: 6 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Берём середину $N$ ребра $SC$',
        zachem: [
          '$KN$ — средняя линия треугольника $SDC$: $KN \\parallel DC$ и $KN = \\tfrac12 DC$.',
        ],
      },
      {
        chto: 'Находим параллелограмм',
        zachem: [
          '$MB \\parallel DC$ и $MB = \\tfrac12 AB = \\tfrac12 DC$. Значит, $KN \\parallel MB$ и $KN = MB$: четырёхугольник $MBNK$ — параллелограмм, и $MK \\parallel BN$.',
        ],
      },
      {
        chto: 'Применяем признак параллельности прямой и плоскости',
        zachem: [
          'Прямая $MK$ параллельна прямой $BN$, лежащей в плоскости $SBC$, и сама в этой плоскости не лежит. Значит, $MK \\parallel SBC$.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Проецируем $K$ на основание',
        zachem: [
          'Пусть $O$ — центр основания, $SO = h$ — высота. В плоскости $SOD$ проведём $KH \\parallel SO$: $H$ — середина $OD$ ($K$ — середина $SD$), $KH = \\tfrac{h}{2}$. Угол между $MK$ и основанием — угол $KMH$ между прямой и её проекцией $MH$.',
        ],
      },
      {
        chto: 'Находим проекцию $MH$',
        zachem: [
          'В координатах основания с началом в $O$: $M(0;-6)$, $H(-3;3)$ (середина $OD$, $D(-6;6)$).',
        ],
        formuly: ['MH = \\sqrt{3^2 + 9^2} = 3\\sqrt{10}'],
      },
      {
        chto: 'Решаем треугольник $KHM$',
        zachem: ['Треугольник $KHM$ прямоугольный с прямым углом $H$, $\\angle KMH = 60^\\circ$.'],
        formuly: [
          '\\tfrac{h}{2} = MH \\cdot \\operatorname{tg} 60^\\circ = 3\\sqrt{10} \\cdot \\sqrt3 = 3\\sqrt{30}',
          'h = 6\\sqrt{30}',
        ],
      },
    ],
    otvet: 6 * Math.sqrt(30),
    otvetTex: '$6\\sqrt{30}$',
    proverka: () => {
      const M = v(0, -6, 0);
      const H = v(-3, 3, 0);
      return 2 * dist(M, H) * Math.tan(Math.PI / 3);
    },
  },
  {
    tip: 'do-pryamoy',
    fipi: '8EBB9F',
    uslovie:
      'В цилиндре образующая перпендикулярна плоскости основания. На окружности одного из оснований цилиндра выбраны точки $A$ и $B$, а на окружности другого основания — точки $B_1$ и $C_1$, причём $BB_1$ — образующая цилиндра, а отрезок $AC_1$ пересекает ось цилиндра. а) Докажите, что угол $ABC_1$ прямой. б) Найдите расстояние от точки $B$ до прямой $AC_1$, если $AB = 21$, $BB_1 = 12$, $B_1C_1 = 16$.',
    model: () => {
      const m = cilindrModel(21, 16, 12, 'Цилиндр с точками A, B, B₁, C₁ и прямой AC₁');
      const { B, A, C1 } = cilindrTochki(21, 16, 12);
      const t = dot(sub(B, A), sub(C1, A)) / dot(sub(C1, A), sub(C1, A));
      const F = add(A, scale(sub(C1, A), t));
      return {
        ...m,
        lines: [...(m.lines ?? []), { a: B, b: F, label: 'd', shag: 5 }],
        angles: [...(m.angles ?? []), { at: F, u: sub(B, F), v: sub(C1, F), shag: 5 }],
      };
    },
    shagi: [
      ...CILINDR_A,
      {
        punkt: 'б',
        chto: 'Находим катет $BC_1$',
        zachem: ['$BCC_1B_1$ — прямоугольник, $BC = B_1C_1 = 16$, $CC_1 = BB_1 = 12$.'],
        formuly: ['BC_1 = \\sqrt{16^2 + 12^2} = 20'],
      },
      {
        chto: 'Находим расстояние как высоту прямоугольного треугольника',
        zachem: [
          'Расстояние от $B$ до прямой $AC_1$ — высота прямоугольного треугольника $ABC_1$, проведённая к гипотенузе. Её удобно найти через площадь: $AB \\cdot BC_1 = AC_1 \\cdot d$.',
        ],
        formuly: [
          'AC_1 = \\sqrt{21^2 + 20^2} = 29',
          'd = \\dfrac{AB \\cdot BC_1}{AC_1} = \\dfrac{21 \\cdot 20}{29} = \\dfrac{420}{29}',
        ],
      },
    ],
    otvet: 420 / 29,
    otvetTex: '$\\dfrac{420}{29}$',
    proverka: () => {
      const { A, B, C1 } = cilindrTochki(21, 16, 12);
      return doPryamoy(B, A, C1);
    },
  },
  {
    tip: 'dlina',
    fipi: '616CD3',
    uslovie:
      'Все рёбра правильной четырёхугольной пирамиды $SABCD$ с основанием $ABCD$ равны 4. Точка $O$ — центр основания пирамиды. Плоскость, параллельная прямой $SA$ и проходящая через точку $O$, пересекает рёбра $SC$ и $SD$ в точках $M$ и $N$ соответственно. Точка $N$ делит ребро $SD$ в отношении $SN : ND = 1 : 3$. а) Докажите, что точка $M$ — середина ребра $SC$. б) Найдите длину отрезка, по которому плоскость $OMN$ пересекает грань $SBC$.',
    model: () => {
      const h = 2 * Math.sqrt(2);
      const A = v(-2, -2, 0);
      const B = v(2, -2, 0);
      const C = v(2, 2, 0);
      const D = v(-2, 2, 0);
      const S = v(0, 0, h);
      const O = v(0, 0, 0);
      const M = mid(S, C);
      const N = lerp(S, D, 1 / 4);
      const P = v(2, 1, 0);
      return {
        alt: 'Правильная пирамида SABCD и сечение плоскостью OMN',
        bodies: [pyramid([A, B, C, D], S)],
        marks: [
          { p: O, label: 'O' },
          { p: N, label: 'N' },
          { p: M, label: 'M', shag: 1 },
          { p: P, label: 'P', shag: 4 },
        ],
        lines: [
          { a: A, b: C, shag: 1 },
          { a: O, b: M, shag: 1 },
          { a: M, b: P, label: '√3', shag: 5 },
        ],
        sections: [{ points: [O, P, M, N], shag: 4 }],
      };
    },
    shagi: [
      {
        punkt: 'а',
        chto: 'Смотрим на плоскость $SAC$',
        zachem: [
          'Плоскость $SAC$ содержит прямую $SA$ и точку $O$ (середину диагонали $AC$). Секущая плоскость параллельна $SA$ и проходит через $O$, поэтому пересекает плоскость $SAC$ по прямой, проходящей через $O$ параллельно $SA$. Эта прямая встречает ребро $SC$ в точке $M$: $OM \\parallel SA$.',
        ],
      },
      {
        chto: 'Средняя линия',
        zachem: [
          'В треугольнике $SAC$ прямая $OM$ проходит через середину $O$ стороны $AC$ параллельно $SA$, значит, она — средняя линия, и $M$ — середина $SC$.',
        ],
      },
      {
        punkt: 'б',
        chto: 'Вводим координаты',
        zachem: [
          'Начало — в $O$, оси — параллельно $AB$, $AD$ и вдоль высоты. Высоту находим из прямоугольного треугольника $SOA$, где $AO = 2\\sqrt2$ — половина диагонали.',
        ],
        formuly: [
          'SO = \\sqrt{SA^2 - AO^2} = \\sqrt{16 - 8} = 2\\sqrt2',
          'B(2;-2;0),\\; C(2;2;0),\\; D(-2;2;0),\\; S(0;0;2\\sqrt2)',
          'M(1;1;\\sqrt2),\\quad N = S + \\tfrac14(D - S) = \\left(-\\tfrac12;\\tfrac12;\\tfrac{3\\sqrt2}{2}\\right)',
        ],
      },
      {
        chto: 'Пишем уравнение плоскости $OMN$ и ищем её след на $BC$',
        zachem: [
          'Плоскость проходит через начало координат, нормаль — векторное произведение $\\vec{OM} \\times \\vec{ON}$. Подставляя вершины, видим: $S$ и $B$ по одну сторону плоскости, $C$ — по другую, значит, грань $SBC$ пересечена по отрезку от $M \\in SC$ до точки $P$ на $BC$.',
        ],
        formuly: [
          '\\sqrt2\\,x - 2\\sqrt2\\,y + z = 0',
          'P \\in BC:\\; P(2;t;0),\\; 2\\sqrt2 - 2\\sqrt2\\, t = 0 \\;\\Rightarrow\\; P(2;1;0)',
        ],
      },
      {
        chto: 'Считаем длину отрезка $MP$',
        zachem: ['Расстояние между точками по координатам.'],
        formuly: ['MP = \\sqrt{(2-1)^2 + (1-1)^2 + (0-\\sqrt2)^2} = \\sqrt3'],
      },
    ],
    otvet: Math.sqrt(3),
    otvetTex: '$\\sqrt3$',
    proverka: () => {
      const h = 2 * Math.sqrt(2);
      const S = v(0, 0, h);
      const M = mid(S, v(2, 2, 0));
      const N = lerp(S, v(-2, 2, 0), 1 / 4);
      const n = cross(M, N);
      /* След на BC: точка (2, t, 0), n · (2, t, 0) = 0. */
      const t = (-n[0] * 2) / n[1];
      return dist(M, v(2, t, 0));
    },
  },
  {
    tip: 'cilindr',
    fipi: '13D60B',
    uslovie:
      'В цилиндре образующая перпендикулярна плоскости основания. На окружности одного из оснований цилиндра выбраны точки $A$ и $B$, а на окружности другого основания — точки $B_1$ и $C_1$, причём $BB_1$ — образующая цилиндра, а отрезок $AC_1$ пересекает ось цилиндра. а) Докажите, что угол $ABC_1$ прямой. б) Найдите объём цилиндра, если $AB = 7$, $BB_1 = 24$, $B_1C_1 = 10$.',
    model: () => cilindrModel(7, 10, 24, 'Цилиндр с точками A, B, B₁, C₁'),
    shagi: [
      ...CILINDR_A,
      {
        punkt: 'б',
        chto: 'Находим диаметр основания',
        zachem: [
          '$BC = B_1C_1 = 10$, а $AC$ — диаметр, гипотенуза прямоугольного треугольника $ABC$.',
        ],
        formuly: ['AC = \\sqrt{7^2 + 10^2} = \\sqrt{149},\\qquad r^2 = \\tfrac{149}{4}'],
      },
      {
        chto: 'Считаем объём',
        zachem: ['Высота цилиндра — образующая $BB_1 = 24$.'],
        formuly: ['V = \\pi r^2 h = \\pi \\cdot \\tfrac{149}{4} \\cdot 24 = 894\\pi'],
      },
    ],
    otvet: 894 * Math.PI,
    otvetTex: '$894\\pi$',
    proverka: () => {
      const { r, h } = cilindrTochki(7, 10, 24);
      return Math.PI * r * r * h;
    },
  },
  {
    tip: 'ugol-pryamyh',
    fipi: '77C190',
    uslovie:
      'В цилиндре образующая перпендикулярна плоскости основания. На окружности одного из оснований цилиндра выбраны точки $A$ и $B$, а на окружности другого основания — точки $B_1$ и $C_1$, причём $BB_1$ — образующая цилиндра, а отрезок $AC_1$ пересекает ось цилиндра. а) Докажите, что угол $ABC_1$ прямой. б) Найдите угол между прямыми $BB_1$ и $AC_1$, если $AB = 6$, $BB_1 = 15$, $B_1C_1 = 8$.',
    model: () => {
      const m = cilindrModel(6, 8, 15, 'Цилиндр с прямыми BB₁ и AC₁');
      const { A, C, C1 } = cilindrTochki(6, 8, 15);
      return {
        ...m,
        sections: [{ points: [A, C, C1], shag: 4 }],
        angles: [...(m.angles ?? []), { at: C, u: sub(A, C), v: sub(C1, C), shag: 4 }],
      };
    },
    shagi: [
      ...CILINDR_A,
      {
        punkt: 'б',
        chto: 'Переносим $BB_1$ на образующую $CC_1$',
        zachem: [
          'Все образующие параллельны: $BB_1 \\parallel CC_1$. Угол между $BB_1$ и $AC_1$ равен углу между $CC_1$ и $AC_1$, то есть углу $AC_1C$ прямоугольного треугольника $ACC_1$.',
        ],
      },
      {
        chto: 'Решаем треугольник $ACC_1$',
        zachem: ['$BC = B_1C_1 = 8$, $AC = \\sqrt{6^2 + 8^2} = 10$ — диаметр, $CC_1 = 15$.'],
        formuly: [
          '\\operatorname{tg} \\angle AC_1C = \\dfrac{AC}{CC_1} = \\dfrac{10}{15} = \\dfrac23',
          '\\angle(BB_1, AC_1) = \\operatorname{arctg}\\dfrac23',
        ],
      },
    ],
    otvet: Math.atan(2 / 3) * RAD,
    otvetTex: '$\\operatorname{arctg}\\dfrac23$',
    proverka: () => {
      const { A, B, B1, C1 } = cilindrTochki(6, 8, 15);
      return ugol(sub(B1, B), sub(C1, A));
    },
  },
];

export function razbor15(tip: string): RazborStereo | undefined {
  return RAZBORY_15.find((r) => r.tip === tip);
}
