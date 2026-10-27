/**
 * Опорные задачи №3, блок 8 «Во сколько раз»: подобие и уровень
 * жидкости. Длины в k раз — площади в k², объёмы в k³; объём конуса
 * и цилиндра при изменении радиуса и высоты; отсечённые конус и
 * пирамида; жидкость в коническом и цилиндрическом сосудах. Три задачи —
 * из открытого банка, остальные со своими числами.
 *
 * У каждой задачи — пересчёт ответа по тому же чертежу (pereschet):
 * объёмы и площади считаются по размерам тел модели, ответ — их
 * отношением. Автотест сверяет его с ответом.
 */

import { box, polygonStart, pyramid, regularPolygon, vertex } from '../../solid/figures';
import { surfaceArea } from '../../solid/measure';
import type { Cone, Cylinder, Model, Polyhedron } from '../../solid/model';
import { ortho } from '../../solid/project';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';
import type { ShagPodskazki, ZadachaOp3 } from './tipy';

const okr = (x: number) => Math.round(x * 1e6) / 1e6;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Объём конуса по размерам тела модели. */
const vKonusa = (c: Pick<Cone, 'r' | 'h'>) => (Math.PI * c.r * c.r * c.h) / 3;
/** Объём цилиндра по размерам тела модели. */
const vCilindra = (c: Pick<Cylinder, 'r' | 'h'>) => Math.PI * c.r * c.r * c.h;
/** Жидкость в конусе вершиной вниз — конус с той же вершиной высотой liquid. */
const zhidkostVKonuse = (c: Cone): Pick<Cone, 'r' | 'h'> => {
  const l = c.liquid ?? 0;
  return { r: (c.r * l) / c.h, h: l };
};

/** Сдвиг вправо по экрану на d: тела рядом не заслоняют друг друга. */
const vpravo = (d: number): Vec3 => ortho.circlePoint([0, 0, 0], d, 0);

/** Тело, сдвинутое на вектор; без подписей вершин. */
function sdvig(body: Polyhedron, [dx, dy, dz]: Vec3): Polyhedron {
  return {
    kind: 'polyhedron',
    vertices: body.vertices.map(([x, y, z]) => [x + dx, y + dy, z + dz]),
    faces: body.faces,
  };
}

/* ── Общие шаги подсказок ───────────────────────────────────────── */

const OBEM_KONUSA: ShagPodskazki = {
  n: 4,
  vopros: 'Как входят радиус и высота в объём конуса $V = \\frac{1}{3}\\pi r^2h$?',
  varianty: ['Радиус — в квадрате, высота — в первой степени', 'Оба — в первой степени', 'Радиус — в первой, высота — в квадрате'],
  verno: 0,
  vyvod: 'Множитель радиуса возводим в квадрат, множитель высоты берём как есть.',
};

const PODOBNYY_KONUS: ShagPodskazki = {
  n: 2,
  vopros: 'Какое тело образует жидкость в конусе вершиной вниз?',
  varianty: ['Конус, подобный сосуду, с той же вершиной', 'Цилиндр', 'Усечённый конус'],
  verno: 0,
  vyvod: 'Коэффициент подобия — отношение уровня жидкости к высоте сосуда.',
};

const KUB_K: ShagPodskazki = {
  n: 4,
  vopros: 'Длины подобных тел относятся как $k$. Как относятся их объёмы?',
  varianty: ['Как $k^3$', 'Как $k^2$', 'Как $k$'],
  verno: 0,
  vyvod: 'У объёма три измерения — коэффициент в кубе.',
};

/* ── Чертежи ────────────────────────────────────────────────────── */

/** Конус с вершиной S над центром O; A — точка окружности основания. */
function konus(r: number, h: number, { alt }: { alt: string }) {
  const O: Vec3 = [0, 0, 0];
  const S: Vec3 = [0, 0, h];
  const A = ortho.circlePoint(O, r, 0);
  const telo: Cone = { kind: 'cone', base: O, r, h };
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
    ],
  };
  return { telo, model, O, S, A };
}

/** Сосуд — конус вершиной S вниз; O — центр верхнего основания, жидкость до уровня liquid. */
function sosud(r: number, h: number, liquid: number) {
  const S: Vec3 = [0, 0, 0];
  const O: Vec3 = [0, 0, h];
  const O1: Vec3 = [0, 0, liquid];
  const A = ortho.circlePoint(O, r, 0);
  const A1 = ortho.circlePoint(O1, (r * liquid) / h, 0);
  const telo: Cone = { kind: 'cone', base: O, r, h, inverted: true, liquid };
  return { telo, S, O, O1, A, A1 };
}

/** Правильная четырёхугольная пирамида и сечение, параллельное основанию, на высоте z. */
function piramidaSecheniem(R: number, H: number, z: number) {
  const osn = regularPolygon(4, R, 0, polygonStart(4));
  const body = pyramid(osn, [0, 0, H]);
  const v = (n: string) => vertex(body, n);
  const t = (H - z) / H;
  const sech = osn.map(([x, y]): Vec3 => [x * t, y * t, z]);
  return { body, v, sech, O: [0, 0, 0] as Vec3, K: [0, 0, z] as Vec3 };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export function zadachiBloka8(): ZadachaOp3[] {
  const out: ZadachaOp3[] = [];

  /* 1. Нажми: высота отсечённой пирамиды. */
  {
    const { body, v, sech, O, K } = piramidaSecheniem(4.5, 6, 4);
    const S = v('S');
    const M = sech[0] as Vec3;
    const celi = [
      { id: 'SK', points: [S, K], label: '$SK$' },
      { id: 'KO', points: [K, O], label: '$KO$' },
      { id: 'SM', points: [S, M], label: '$SM$' },
    ];
    out.push({
      id: 'o3-8-01',
      kratko: 'Высота отсечённой пирамиды',
      blok: 'vo-skolko-raz',
      uroven: 1,
      istochnik: 'new',
      vid: 'nazhmi',
      uslovie:
        'Плоскость, параллельная основанию пирамиды $SABCD$, пересекает высоту $SO$ в точке $K$ и отсекает пирамиду с вершиной $S$, подобную исходной. Нажмите на отрезок, который относится к $SO$ как коэффициент подобия.',
      model: {
        alt: 'Правильная четырёхугольная пирамида SABCD с высотой SO; сечение, параллельное основанию, пересекает высоту в точке K, ребро SA — в точке M',
        bodies: [body],
        sections: [{ points: sech }],
        marks: [
          { p: O, label: 'O' },
          { p: K, label: 'K' },
          { p: M, label: 'M' },
        ],
        lines: [{ a: S, b: O }],
      },
      celi,
      otvet: 'SK',
      podskazka: [
        {
          n: 1,
          vopros: 'Где вершина отсечённой пирамиды и где её основание?',
          varianty: ['Вершина $S$, основание — сечение', 'Вершина $K$, основание — $ABCD$', 'Вершина $O$, основание — сечение'],
          verno: 0,
          vyvod: 'Маленькая пирамида — верхушка над сечением, вершина у неё общая с исходной.',
        },
        {
          n: 2,
          vopros: 'Какой отрезок — высота отсечённой пирамиды?',
          varianty: ['От вершины до сечения по высоте $SO$', 'От сечения до основания', 'Её боковое ребро'],
          verno: 0,
          vyvod: 'Коэффициент подобия — отношение соответственных высот.',
        },
      ],
      uchitel: [{ etap: 'Подобные пирамиды', formuly: ['k = \\dfrac{SK}{SO}'] }],
      uchenik: [
        { n: 1, chto: 'Плоскость, параллельная основанию, отсекает пирамиду с той же вершиной $S$ — она подобна исходной.' },
        {
          n: 2,
          chto: 'Её высота — часть $SK$ высоты $SO$. Отрезок $KO$ — высота нижней, усечённой части, а $SM$ — боковое ребро, а не высота.',
          formula: 'k = \\dfrac{SK}{SO}',
        },
      ],
      pereschet: () => {
        const H = S[2];
        const zSech = M[2];
        const found = celi.find((c) => {
          const [p, q] = c.points as [Vec3, Vec3];
          const vert = Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;
          const verh = Math.max(p[2], q[2]);
          const niz = Math.min(p[2], q[2]);
          return vert && Math.abs(verh - H) < 1e-9 && Math.abs(niz - zSech) < 1e-9;
        });
        return found?.id ?? '';
      },
    });
  }

  /* 2. Выбор: рёбра куба вдвое — поверхность. */
  {
    const malyy = sdvig(box(2, 2, 2), [0, 0, 0]);
    const bolshoy = sdvig(box(4, 4, 4), [4, 0, 0]);
    const varianty = ['$2$', '$4$', '$8$', '$6$'];
    out.push({
      id: 'o3-8-02',
      kratko: 'Поверхность куба, ребро вдвое',
      blok: 'vo-skolko-raz',
      uroven: 1,
      istochnik: 'new',
      vid: 'vybor',
      uslovie: 'Все рёбра куба увеличили в $2$ раза. Во сколько раз увеличится площадь его поверхности?',
      model: {
        alt: 'Два куба рядом: ребро второго вдвое длиннее ребра первого',
        view: 'cabinet',
        bodies: [malyy, bolshoy],
      },
      varianty,
      otvet: '1',
      podskazka: [
        {
          n: 2,
          vopros: 'Сторона квадрата-грани выросла в $k$ раз. Во сколько раз выросла его площадь?',
          varianty: ['В $k^2$ раз', 'В $k$ раз', 'В $k^3$ раз'],
          verno: 0,
          vyvod: 'У площади два измерения: каждое выросло в $2$ раза.',
        },
        {
          n: 5,
          vopros: 'Граней по-прежнему шесть. Что тогда с суммой их площадей?',
          varianty: ['Растёт во столько же раз, что и каждая грань', 'Растёт ещё в $6$ раз сильнее'],
          verno: 0,
          vyvod: 'Поверхность — площадь, коэффициент в квадрате.',
        },
      ],
      uchitel: [{ etap: 'Площади подобных тел', formuly: ['\\dfrac{S_2}{S_1} = k^2 = 2^2 = 4'] }],
      uchenik: [
        { n: 2, chto: 'Кубы подобны с коэффициентом $k = 2$. Площадь каждой грани — квадрат стороны.', formula: '(2a)^2 = 4a^2' },
        { n: 5, chto: 'Площадь поверхности — площадь, поэтому множитель $k^2$. Ответ $2$ — ошибка «как длина», $8$ — «как объём».', formula: '\\dfrac{S_2}{S_1} = 4' },
      ],
      pereschet: () => String(varianty.indexOf(`$${okr(surfaceArea(bolshoy) / surfaceArea(malyy))}$`)),
    });
  }

  /* 3. Банк 33B18F: радиус конуса в 11 раз. */
  {
    const { telo, model, S, O, A } = konus(2, 4, { alt: 'Конус с вершиной S: высота SO и радиус основания OA' });
    out.push({
      id: 'o3-8-03',
      kratko: 'Радиус конуса в 11 раз',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vo-skolko-raz',
      uroven: 1,
      istochnik: 'fipi',
      fipi: '33B18F',
      vid: 'chislo',
      uslovie: 'Во сколько раз увеличится объём конуса, если радиус его основания увеличится в $11$ раз, а высота останется прежней?',
      model,
      otvet: '121',
      podskazka: [
        OBEM_KONUSA,
        {
          n: 5,
          vopros: 'Какой множитель даёт радиус, выросший в $11$ раз?',
          varianty: ['$11^2$', '$11$', '$11^3$'],
          verno: 0,
          vyvod: 'Высота прежняя — других множителей нет.',
        },
      ],
      uchitel: [
        { etap: 'Отношение объёмов', formuly: ['\\dfrac{V_2}{V_1} = \\dfrac{\\frac{1}{3}\\pi (11r)^2h}{\\frac{1}{3}\\pi r^2h} = 11^2 = 121'] },
      ],
      uchenik: [
        { n: 4, chto: 'Объём конуса $\\frac{1}{3}\\pi r^2h$: радиус стоит в квадрате.' },
        { n: 5, chto: 'Множители $\\frac{1}{3}$, $\\pi$ и $h$ сокращаются, остаётся квадрат множителя радиуса.', formula: '11^2 = 121' },
      ],
      pereschet: () => okr(vKonusa({ r: 11 * telo.r, h: telo.h }) / vKonusa(telo)),
    });
  }

  /* 4. Банк E71725: высота конуса в 9 раз меньше. */
  {
    const { telo, model, S, O, A } = konus(2, 4, { alt: 'Конус с вершиной S: высота SO и радиус основания OA' });
    out.push({
      id: 'o3-8-04',
      kratko: 'Высота конуса в 9 раз меньше',
      rabochaya: { points: [S, O, A], pryamoy: O },
      blok: 'vo-skolko-raz',
      uroven: 1,
      istochnik: 'fipi',
      fipi: 'E71725',
      vid: 'chislo',
      uslovie: 'Во сколько раз уменьшится объём конуса, если его высота уменьшится в $9$ раз, а радиус основания останется прежним?',
      model,
      otvet: '9',
      podskazka: [
        OBEM_KONUSA,
        {
          n: 5,
          vopros: 'Высота входит в формулу в первой степени. Что это значит для объёма?',
          varianty: ['Объём уменьшится во столько же раз, что и высота', 'Объём уменьшится в квадрат этого числа раз', 'Объём не изменится'],
          verno: 0,
          vyvod: 'При прежнем радиусе объём пропорционален высоте.',
        },
      ],
      uchitel: [
        { etap: 'Отношение объёмов', formuly: ['\\dfrac{V_1}{V_2} = \\dfrac{\\frac{1}{3}\\pi r^2h}{\\frac{1}{3}\\pi r^2\\cdot\\frac{h}{9}} = 9'] },
      ],
      uchenik: [
        { n: 4, chto: 'В объёме конуса $\\frac{1}{3}\\pi r^2h$ высота стоит в первой степени.' },
        { n: 5, chto: 'Радиус прежний — меняется только множитель $h$. Возводить в квадрат здесь нечего: квадрат — у радиуса.', formula: '\\dfrac{V_1}{V_2} = 9' },
      ],
      pereschet: () => okr(vKonusa(telo) / vKonusa({ r: telo.r, h: telo.h / 9 })),
    });
  }

  /* 5. Банк 61D99A: два цилиндра. */
  {
    const c1: Cylinder = { kind: 'cylinder', base: [0, 0, 0], r: 1, h: 3 };
    const c2: Cylinder = { kind: 'cylinder', base: vpravo(4), r: 2, h: 1 };
    out.push({
      id: 'o3-8-05',
      kratko: 'Два цилиндра',
      blok: 'vo-skolko-raz',
      uroven: 2,
      istochnik: 'fipi',
      fipi: '61D99A',
      vid: 'chislo',
      uslovie:
        'Дано два цилиндра. Объём первого цилиндра равен $18$. У второго цилиндра высота в $3$ раза меньше, а радиус основания в $2$ раза больше, чем у первого. Найдите объём второго цилиндра.',
      model: {
        alt: 'Два цилиндра рядом: первый узкий и высокий, второй вдвое шире и втрое ниже',
        bodies: [c1, c2],
      },
      otvet: '24',
      podskazka: [
        {
          n: 4,
          vopros: 'Как входят радиус и высота в объём цилиндра $V = \\pi r^2h$?',
          varianty: ['Радиус — в квадрате, высота — в первой степени', 'Оба — в первой степени'],
          verno: 0,
          vyvod: 'Множитель радиуса возводим в квадрат.',
        },
        {
          n: 5,
          vopros: 'Какой общий множитель получится у объёма?',
          varianty: ['$2^2\\cdot\\frac{1}{3}$', '$2\\cdot\\frac{1}{3}$', '$2^3\\cdot\\frac{1}{3}$'],
          verno: 0,
          vyvod: 'Радиус даёт множитель $4$, высота — $\\frac{1}{3}$; объём первого умножаем на их произведение.',
        },
      ],
      uchitel: [
        { etap: 'Множитель', formuly: ['\\dfrac{V_2}{V_1} = \\dfrac{\\pi (2r)^2\\cdot\\frac{h}{3}}{\\pi r^2h} = \\dfrac{4}{3}'] },
        { etap: 'Объём', formuly: ['V_2 = 18\\cdot\\dfrac{4}{3} = 24'] },
      ],
      uchenik: [
        { n: 4, chto: 'Объём цилиндра $\\pi r^2h$: радиус — в квадрате, высота — в первой степени.' },
        { n: 5, chto: 'Сначала делим на $3$, потом умножаем на $4$ — так удобнее. Если забыть квадрат, получится $12$.', formula: 'V_2 = 18 : 3\\cdot 4 = 24' },
      ],
      pereschet: () => okr((18 * vCilindra(c2)) / vCilindra(c1)),
    });
  }

  /* 6. Отсечённый конус через середину высоты. */
  {
    const bolshoy: Cone = { kind: 'cone', base: [0, 0, 0], r: 3, h: 6 };
    const malyy: Cone = { kind: 'cone', base: [0, 0, 3], r: 1.5, h: 3 };
    const S: Vec3 = [0, 0, 6];
    const O: Vec3 = [0, 0, 0];
    const K: Vec3 = [0, 0, 3];
    out.push({
      id: 'o3-8-06',
      kratko: 'Верхушка конуса',
      blok: 'vo-skolko-raz',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Объём конуса равен $72$. Через середину $K$ его высоты $SO$ параллельно основанию проведено сечение. Найдите объём отсечённого конуса с вершиной $S$.',
      model: {
        alt: 'Конус с вершиной S и высотой SO; сечение, параллельное основанию, проходит через середину K высоты',
        bodies: [bolshoy, malyy],
        marks: [
          { p: S, label: 'S' },
          { p: K, label: 'K' },
          { p: O, label: 'O' },
        ],
        lines: [{ a: S, b: O }],
      },
      otvet: '9',
      podskazka: [
        {
          n: 1,
          vopros: 'Какое тело отсекает сечение сверху?',
          varianty: ['Конус, подобный исходному, с той же вершиной', 'Цилиндр', 'Усечённый конус'],
          verno: 0,
          vyvod: 'Верхушка — конус с высотой $SK$.',
        },
        {
          n: 2,
          vopros: 'Чему равен коэффициент подобия?',
          varianty: ['$\\frac{SK}{SO} = \\frac{1}{2}$', '$\\frac{KO}{SK} = 1$', '$\\frac{SO}{SK} = 2$'],
          verno: 0,
          vyvod: 'Маленький конус — уменьшенная вдвое копия большого.',
        },
        KUB_K,
      ],
      uchitel: [
        { etap: 'Подобие', formuly: ['k = \\dfrac{SK}{SO} = \\dfrac{1}{2}'] },
        { etap: 'Объём', formuly: ['V = 72\\cdot\\left(\\dfrac{1}{2}\\right)^3 = \\dfrac{72}{8} = 9'] },
      ],
      uchenik: [
        { n: 1, chto: 'Плоскость, параллельная основанию, отсекает конус с той же вершиной — он подобен исходному.' },
        { n: 2, chto: 'Высота маленького конуса вдвое меньше: $k = \\frac{1}{2}$. Радиус тоже вдвое меньше.' },
        { n: 5, chto: 'Объём — в кубе коэффициента. Деление на $2$ — ошибка «как длина», на $4$ — «как площадь».', formula: 'V = 72 : 8 = 9' },
      ],
      pereschet: () => okr((72 * vKonusa(malyy)) / vKonusa(bolshoy)),
    });
  }

  /* 7. Конический сосуд, налитый до половины высоты: доля объёма. */
  {
    const { telo, S, O, O1 } = sosud(3, 6, 3);
    out.push({
      id: 'o3-8-07',
      kratko: 'Конус налит до половины',
      blok: 'vo-skolko-raz',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Сосуд в форме конуса поставлен вершиной вниз и заполнен жидкостью до половины высоты. Какую часть объёма сосуда занимает жидкость? Ответ запишите десятичной дробью.',
      model: {
        alt: 'Конический сосуд вершиной S вниз, жидкость налита до точки O₁ — середины высоты SO',
        bodies: [telo],
        marks: [
          { p: S, label: 'S' },
          { p: O1, label: 'O1' },
          { p: O, label: 'O' },
        ],
        lines: [{ a: S, b: O }],
      },
      otvet: '0,125',
      podskazka: [
        PODOBNYY_KONUS,
        {
          n: 2,
          vopros: 'Чему равен коэффициент подобия?',
          varianty: ['$\\frac{SO_1}{SO} = \\frac{1}{2}$', '$\\frac{O_1O}{SO_1} = 1$'],
          verno: 0,
          vyvod: 'Уровень жидкости — половина высоты сосуда.',
        },
        KUB_K,
      ],
      uchitel: [
        { etap: 'Подобие', formuly: ['k = \\dfrac{SO_1}{SO} = \\dfrac{1}{2}'] },
        { etap: 'Доля объёма', formuly: ['\\dfrac{V_{\\text{ж}}}{V} = \\left(\\dfrac{1}{2}\\right)^3 = \\dfrac{1}{8} = 0{,}125'] },
      ],
      uchenik: [
        { n: 2, chto: 'Жидкость — конус с той же вершиной $S$, подобный сосуду, с вдвое меньшей высотой.' },
        {
          n: 5,
          chto: 'Объём — в кубе коэффициента. Половина высоты — это не половина объёма: внизу конус узкий.',
          formula: '\\left(\\dfrac{1}{2}\\right)^3 = \\dfrac{1}{8} = 0{,}125',
        },
      ],
      pereschet: () => okr(vKonusa(zhidkostVKonuse(telo)) / vKonusa(telo)),
    });
  }

  /* 8. Переливание в цилиндр вдвое шире. */
  {
    const c1: Cylinder = { kind: 'cylinder', base: [0, 0, 0], r: 1, h: 4, liquid: 3 };
    const c2: Cylinder = { kind: 'cylinder', base: vpravo(4), r: 2, h: 2 };
    const UROVEN = 48;
    const L1 = c1.liquid ?? 0;
    const a = ortho.circlePoint(c1.base, c1.r, Math.PI);
    const b: Vec3 = [a[0], a[1], L1];
    out.push({
      id: 'o3-8-08',
      kratko: 'Переливание в широкий цилиндр',
      blok: 'vo-skolko-raz',
      uroven: 2,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'Вода в цилиндрическом сосуде стоит на уровне $48$ см. Её перелили в цилиндрический сосуд, радиус основания которого в $2$ раза больше. На какой высоте в сантиметрах будет уровень воды во втором сосуде?',
      model: {
        alt: 'Два цилиндрических сосуда: в узком вода на уровне 48, второй вдвое шире и пуст',
        bodies: [c1, c2],
        measures: [{ a, b, text: String(UROVEN) }],
      },
      otvet: '12',
      podskazka: [
        {
          n: 1,
          vopros: 'Что одинаково у воды в первом и во втором сосуде?',
          varianty: ['Объём', 'Уровень', 'Площадь основания'],
          verno: 0,
          vyvod: 'Объём воды $\\pi r^2h$ при переливании не меняется.',
        },
        {
          n: 4,
          vopros: 'Во сколько раз больше площадь дна второго сосуда?',
          varianty: ['В $2^2$ раза', 'В $2$ раза', 'В $2^3$ раза'],
          verno: 0,
          vyvod: 'Площадь круга растёт как квадрат радиуса.',
        },
        {
          n: 5,
          vopros: 'Объём тот же, дно во столько-то раз больше. Что с уровнем?',
          varianty: ['Во столько же раз ниже', 'Во столько же раз выше', 'Не изменится'],
          verno: 0,
          vyvod: 'Уровень — объём, делённый на площадь дна.',
        },
      ],
      uchitel: [
        { etap: 'Объём не меняется', formuly: ['\\pi r^2\\cdot 48 = \\pi (2r)^2\\cdot h'] },
        { etap: 'Уровень', formuly: ['h = \\dfrac{48}{4} = 12'] },
      ],
      uchenik: [
        { n: 1, chto: 'При переливании объём воды тот же.' },
        { n: 4, chto: 'Площадь дна второго сосуда в $2^2 = 4$ раза больше: радиус входит в квадрате.' },
        { n: 5, chto: 'Та же вода растекается по вчетверо большему дну — уровень вчетверо ниже. Если забыть квадрат, получится $24$.', formula: 'h = 48 : 4 = 12' },
      ],
      pereschet: () => {
        const L2 = vCilindra({ r: c1.r, h: L1 }) / (Math.PI * c2.r * c2.r);
        return okr((UROVEN * L2) / L1);
      },
    });
  }

  /* 9. Плоский чертёж: радиус поверхности жидкости в коническом сосуде. */
  {
    const { telo, S, O, O1, A, A1 } = sosud(9, 12, 8);
    const ploskie: PloskiyTreugolnik[] = [
      {
        vershiny: ['O1', 'S', 'A1'],
        kateti: [8, 6],
        podpisi: { a: '8', b: '?' },
        iskomoe: 'b',
        alt: 'Прямой угол при O₁, катет SO₁ = 8, катет O₁A₁ — искомый',
      },
      {
        vershiny: ['O1', 'S', 'A1'],
        kateti: [4, 3],
        podpisi: { a: '4', b: '?' },
        iskomoe: 'b',
        alt: 'Прямой угол при O₁, катет SO₁ = 4, катет O₁A₁ — искомый',
      },
      {
        vershiny: ['S', 'O1', 'A1'],
        kateti: [8, 10],
        podpisi: { a: '8', c: '?' },
        iskomoe: 'c',
        alt: 'Прямой угол при S, катет SO₁ = 8, гипотенуза O₁A₁ — искомая',
      },
    ];
    out.push({
      id: 'o3-8-09',
      kratko: 'Радиус поверхности жидкости',
      rabochaya: { points: [S, O1, A1], pryamoy: O1 },
      blok: 'vo-skolko-raz',
      uroven: 3,
      istochnik: 'new',
      vid: 'ploskiy',
      uslovie:
        'Сосуд в форме конуса поставлен вершиной $S$ вниз: высота $SO = 12$, радиус $OA = 9$. Жидкость налита до уровня $8$ от вершины, $O_1$ — центр её поверхности. Какой плоский чертёж — рабочий треугольник для радиуса поверхности жидкости $O_1A_1$?',
      model: {
        alt: 'Конический сосуд вершиной S вниз, высота SO = 12, радиус OA = 9; жидкость до уровня O₁, радиус её поверхности O₁A₁',
        bodies: [telo],
        marks: [
          { p: S, label: 'S' },
          { p: O, label: 'O' },
          { p: A, label: 'A' },
          { p: O1, label: 'O1' },
          { p: A1, label: 'A1' },
        ],
        lines: [
          { a: S, b: O },
          { a: O, b: A },
          { a: O1, b: A1 },
          { a: S, b: A },
        ],
        measures: [{ a: O, b: A, text: '9' }],
      },
      ploskie,
      otvet: '0',
      podskazka: [
        PODOBNYY_KONUS,
        {
          n: 3,
          vopros: 'Где прямой угол треугольника $SO_1A_1$?',
          varianty: ['При $O_1$', 'При $S$', 'При $A_1$'],
          verno: 0,
          vyvod: 'Ось $SO$ перпендикулярна поверхности жидкости, а $O_1A_1$ лежит в ней.',
        },
        {
          n: 4,
          vopros: 'Чему равен катет $SO_1$?',
          varianty: ['Уровню жидкости от вершины', 'Высоте пустой части $O_1O$', 'Высоте сосуда $SO$'],
          verno: 0,
          vyvod: 'Уровень отсчитан от вершины $S$.',
        },
      ],
      uchitel: [
        { etap: 'Рабочий треугольник', formuly: ['SO \\perp O_1A_1 \\Rightarrow \\angle SO_1A_1 = 90^\\circ,\\quad SO_1 = 8'] },
        { etap: 'Подобие', formuly: ['\\triangle SO_1A_1 \\sim \\triangle SOA,\\quad k = \\dfrac{8}{12} = \\dfrac{2}{3}'] },
      ],
      uchenik: [
        { n: 2, chto: 'Жидкость — конус с вершиной $S$, подобный сосуду. В осевом сечении — треугольник $SO_1A_1$, подобный $SOA$.' },
        { n: 3, chto: 'Ось сосуда перпендикулярна поверхности жидкости: прямой угол при $O_1$.' },
        { n: 4, chto: 'Катет $SO_1 = 8$ — уровень от вершины, искомый катет $O_1A_1$. На втором чертеже взята пустая часть $12 - 8 = 4$, на третьем прямой угол не там.' },
      ],
      pereschet: () => {
        const L = String(Math.round(dist(S, O1)));
        return String(ploskie.findIndex((p) => p.vershiny[0] === 'O1' && p.podpisi.a === L));
      },
    });
  }

  /* 10. Сколько долить в конический сосуд, налитый до 2/3 высоты. */
  {
    const { telo, S, O, O1, A1 } = sosud(3, 6, 4);
    out.push({
      id: 'o3-8-10',
      kratko: 'Сколько долить',
      rabochaya: { points: [S, O1, A1], pryamoy: O1 },
      blok: 'vo-skolko-raz',
      uroven: 3,
      istochnik: 'new',
      vid: 'chislo',
      uslovie:
        'В сосуд в форме конуса, поставленного вершиной вниз, налили $64$ мл жидкости — до $\\frac{2}{3}$ высоты сосуда. Сколько миллилитров жидкости нужно долить, чтобы заполнить сосуд доверху?',
      model: {
        alt: 'Конический сосуд вершиной S вниз, жидкость налита до точки O₁ на двух третях высоты SO',
        bodies: [telo],
        marks: [
          { p: S, label: 'S' },
          { p: O1, label: 'O1' },
          { p: O, label: 'O' },
        ],
        lines: [{ a: S, b: O }],
      },
      otvet: '152',
      podskazka: [
        PODOBNYY_KONUS,
        {
          n: 4,
          vopros: 'Во сколько раз объём сосуда больше объёма жидкости?',
          varianty: ['В $\\left(\\frac{3}{2}\\right)^3$ раза', 'В $\\frac{3}{2}$ раза', 'В $\\left(\\frac{3}{2}\\right)^2$ раза'],
          verno: 0,
          vyvod: 'Сосуд — увеличенная в $\\frac{3}{2}$ раза копия жидкости; объём — в кубе.',
        },
        {
          n: 5,
          vopros: 'Что спрашивают в задаче?',
          varianty: ['Разность объёмов сосуда и жидкости', 'Объём сосуда'],
          verno: 0,
          vyvod: 'Из объёма сосуда вычитаем уже налитое.',
        },
      ],
      uchitel: [
        { etap: 'Подобие', formuly: ['k = \\dfrac{SO_1}{SO} = \\dfrac{2}{3}'] },
        { etap: 'Объём сосуда', formuly: ['V = 64\\cdot\\left(\\dfrac{3}{2}\\right)^3 = 64\\cdot\\dfrac{27}{8} = 216'] },
        { etap: 'Долить', formuly: ['216 - 64 = 152'] },
      ],
      uchenik: [
        { n: 2, chto: 'Жидкость — конус с вершиной $S$, подобный сосуду; высоты относятся как $2 : 3$.' },
        { n: 4, chto: 'Объёмы — как кубы: $V_{\\text{ж}} : V = 8 : 27$. На каждые $8$ частей жидкости — $27$ частей сосуда.', formula: 'V = 64 : 8\\cdot 27 = 216' },
        { n: 5, chto: 'Спрашивают, сколько долить, — это разность. Частая ошибка — записать в ответ весь объём.', formula: '216 - 64 = 152' },
      ],
      pereschet: () => okr((64 * vKonusa(telo)) / vKonusa(zhidkostVKonuse(telo)) - 64),
    });
  }

  /* От простых к сложным: по уровню, внутри уровня — как написаны.
     Ключ — по месту в блоке. */
  return out
    .map((z, at) => ({ z, at }))
    .sort((p, q) => p.z.uroven - q.z.uroven || p.at - q.at)
    .map(({ z }, i) => ({ ...z, id: `o3-8-${String(i + 1).padStart(2, '0')}` }));
}
