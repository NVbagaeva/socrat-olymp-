/**
 * База, №12: опорные задачи — короткие задачи на один шаг. Из этих шагов
 * складывается любая задача номера: угол, отрезок по теореме Пифагора,
 * площадь, средняя линия, синус и косинус, вписанный угол, дуга.
 *
 * Ответ считается из чисел условия точно (lib/baza/chisla.ts). Пересчёт
 * proverka — другим способом: фигура строится в координатах, угол или
 * длина измеряются, площадь — по формуле шнурования. Сверяет pnpm test:baza.
 */

import { tex, zapis } from '@/lib/baza/chisla';
import type { BlokOpornyh, MikroZadacha, NavykOpornyh } from '@/lib/baza/types';

const zadachi = (slug: string, spisok: Omit<MikroZadacha, 'id'>[]): MikroZadacha[] =>
  spisok.map((z, i) => ({ ...z, id: `b12-${slug}-${String(i + 1).padStart(2, '0')}` }));

/* ── Геометрия для пересчёта ──────────────────────────────────── */

type T2 = readonly [number, number];
const RAD = Math.PI / 180;

/** Измеренное число → запись бланка (до тысячных; иначе — ошибка данных). */
function izFloat(x: number): string {
  const m = Math.round(x * 1000);
  if (Math.abs(x * 1000 - m) > 1e-6) throw new Error(`не конечная дробь: ${x}`);
  return zapis(m, 1000);
}

const sub = (a: T2, b: T2): T2 => [a[0] - b[0], a[1] - b[1]];
const dlina = (a: T2, b: T2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const seredina = (a: T2, b: T2): T2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const luch = (gradusy: number): T2 => [Math.cos(gradusy * RAD), Math.sin(gradusy * RAD)];

/** Угол между векторами в градусах. */
function ugol(u: T2, v: T2): number {
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
}

/** Угол при вершине V между лучами VA и VB. */
const ugolPri = (a: T2, v: T2, b: T2): number => ugol(sub(a, v), sub(b, v));

/** Площадь многоугольника по формуле шнурования. */
function ploshchad(t: readonly T2[]): number {
  let s = 0;
  t.forEach(([x1, y1], i) => {
    const [x2, y2] = t[(i + 1) % t.length] ?? t[0] ?? [0, 0];
    s += x1 * y2 - x2 * y1;
  });
  return Math.abs(s) / 2;
}

/** Треугольник с углами a и b при стороне AB = 1: вершина C. */
function vershinaC(a: number, b: number): T2 {
  const [ux, uy] = luch(a);
  const [vx, vy] = luch(180 - b);
  /* A + s·u = B + t·v, A = (0, 0), B = (1, 0). */
  const s = (1 * vy) / (ux * vy - uy * vx);
  return [s * ux, s * uy];
}

const A0: T2 = [0, 0];
const B0: T2 = [1, 0];
const gr = (zapisBlanka: string): string => `${tex(zapisBlanka)}^\\circ`;
const VGRADUSAH = 'Ответ дайте в градусах.';

/* ══ Навык 1. Углы ══════════════════════════════════════════════ */

/* Блок 1. До 180°: смежный, односторонний, соседний угол. */
const DO_180: [string, number][] = [
  ['Один из смежных углов равен #. Найдите другой угол.', 37],
  [
    'Параллельные прямые пересечены секущей. Один из односторонних углов равен #. Найдите второй.',
    112,
  ],
  ['Острый угол параллелограмма равен #. Найдите его тупой угол.', 54],
  [
    'Угол при большем основании трапеции равен #. Найдите угол при той же боковой стороне, прилежащий к меньшему основанию.',
    68,
  ],
  ['Внутренний угол треугольника равен #. Найдите внешний угол при этой вершине.', 103],
  ['Угол $AOB$ равен #. Луч $OC$ — продолжение луча $OA$. Найдите угол $BOC$.', 29],
];

const blokDo180: BlokOpornyh = {
  slug: 'do-180',
  nazvanie: 'Дополнить до 180°',
  opisanie: 'Смежные углы, односторонние углы, соседние углы параллелограмма и трапеции',
  zapomni:
    'Смежные углы, односторонние углы при параллельных прямых, соседние углы параллелограмма и углы при боковой стороне трапеции в сумме дают $180^\\circ$.',
  znak: '180^\\circ - \\alpha',
  zadachi: zadachi(
    'do180',
    DO_180.map(([shablon, a]) => ({
      uslovie: `${shablon.replace('#', `$${a}^\\circ$`)} ${VGRADUSAH}`,
      otvet: zapis(180 - a, 1),
      podskazka: 'Эти углы в сумме дают $180^\\circ$.',
      razbor: [`$180^\\circ - ${a}^\\circ = ${gr(zapis(180 - a, 1))}$.`],
      proverka: () => izFloat(ugol(luch(a), [-1, 0])),
    })),
  ),
};

/* Блок 2. Третий угол треугольника. */
const TRETIY: [number, number][] = [
  [52, 71],
  [38, 94],
  [27, 63],
  [105, 41],
  [66, 66],
  [19, 128],
];

const blokTretiy: BlokOpornyh = {
  slug: 'tretiy-ugol',
  nazvanie: 'Третий угол треугольника',
  opisanie: 'Два угла треугольника известны, третий находим из суммы углов',
  zapomni: 'Сумма углов треугольника: $\\angle A + \\angle B + \\angle C = 180^\\circ$.',
  znak: '180^\\circ',
  zadachi: zadachi(
    'tretiy',
    TRETIY.map(([a, b]) => ({
      uslovie: `В треугольнике $ABC$ угол $A$ равен $${a}^\\circ$, угол $B$ равен $${b}^\\circ$. Найдите угол $C$. ${VGRADUSAH}`,
      otvet: zapis(180 - a - b, 1),
      podskazka: 'Из $180^\\circ$ вычтите два известных угла.',
      razbor: [
        `$\\angle C = 180^\\circ - ${a}^\\circ - ${b}^\\circ = ${gr(zapis(180 - a - b, 1))}$.`,
      ],
      proverka: () => {
        const c = vershinaC(a, b);
        return izFloat(ugolPri(A0, c, B0));
      },
    })),
  ),
};

/* Блок 3. Угол при основании равнобедренного треугольника. */
const OSNOVANIE: number[] = [40, 112, 56, 90, 134, 17];

const blokOsnovanie: BlokOpornyh = {
  slug: 'ugol-osnovaniya',
  nazvanie: 'Угол при основании',
  opisanie: 'Равнобедренный треугольник: по углу при вершине найти угол при основании',
  zapomni:
    'Углы при основании равнобедренного треугольника равны: каждый $\\dfrac{180^\\circ - \\beta}{2}$, $\\beta$ — угол при вершине.',
  znak: '\\tfrac{180^\\circ - \\beta}{2}',
  zadachi: zadachi(
    'osnovanie',
    OSNOVANIE.map((b) => ({
      uslovie: `В треугольнике $ABC$ стороны $AB$ и $BC$ равны, угол $B$ равен $${b}^\\circ$. Найдите угол $A$. ${VGRADUSAH}`,
      otvet: zapis(180 - b, 2),
      podskazka: 'Углы $A$ и $C$ при основании равны и вместе дают $180^\\circ - \\angle B$.',
      razbor: [`$\\angle A = \\dfrac{180^\\circ - ${b}^\\circ}{2} = ${gr(zapis(180 - b, 2))}$.`],
      proverka: () => {
        const p = b / 2;
        const verh: T2 = [0, Math.cos(p * RAD)];
        const a: T2 = [-Math.sin(p * RAD), 0];
        const c: T2 = [Math.sin(p * RAD), 0];
        return izFloat(ugolPri(verh, a, c));
      },
    })),
  ),
};

/* Блок 4. Внешний угол — сумма двух не смежных с ним. */
const VNESHNIY: [number, number][] = [
  [48, 61],
  [35, 79],
  [72, 54],
  [23, 90],
  [88, 17],
  [41, 46],
];

const blokVneshniy: BlokOpornyh = {
  slug: 'vneshniy-ugol',
  nazvanie: 'Внешний угол',
  opisanie: 'Внешний угол треугольника через два внутренних, не смежных с ним',
  zapomni: 'Внешний угол треугольника равен сумме двух внутренних углов, не смежных с ним.',
  znak: '\\alpha + \\beta',
  zadachi: zadachi(
    'vneshniy',
    VNESHNIY.map(([a, b]) => ({
      uslovie: `В треугольнике $ABC$ угол $A$ равен $${a}^\\circ$, угол $B$ равен $${b}^\\circ$. Найдите внешний угол при вершине $C$. ${VGRADUSAH}`,
      otvet: zapis(a + b, 1),
      podskazka: 'Внешний угол при $C$ не смежен с углами $A$ и $B$.',
      razbor: [`$${a}^\\circ + ${b}^\\circ = ${gr(zapis(a + b, 1))}$.`],
      proverka: () => {
        const c = vershinaC(a, b);
        /* Продолжение стороны AC за точку C. */
        return izFloat(ugol(sub(B0, c), sub(c, A0)));
      },
    })),
  ),
};

/* ══ Навык 2. Прямоугольный треугольник ═════════════════════════ */

/* Блок 5. Катет против угла 30°. */
const UGOL30: number[] = [18, 27, 9, 34, 15, 41];

const blokUgol30: BlokOpornyh = {
  slug: 'katet-30',
  nazvanie: 'Катет против угла 30°',
  opisanie: 'Гипотенуза известна, катет против угла 30 градусов — её половина',
  zapomni:
    'Катет, лежащий против угла $30^\\circ$, равен половине гипотенузы: $a = \\dfrac{c}{2}$.',
  znak: '\\tfrac{c}{2}',
  zadachi: zadachi(
    'ugol30',
    UGOL30.map((c) => ({
      uslovie: `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, угол $A$ равен $30^\\circ$, $AB = ${c}$. Найдите $BC$.`,
      otvet: zapis(c, 2),
      podskazka: 'Катет $BC$ лежит против угла $A$.',
      razbor: [`$BC = \\dfrac{AB}{2} = \\dfrac{${c}}{2} = ${tex(zapis(c, 2))}$.`],
      proverka: () => {
        /* A — в начале координат, B — на луче под 30° на расстоянии c, C — проекция B. */
        const b: T2 = [c * Math.cos(30 * RAD), c * Math.sin(30 * RAD)];
        return izFloat(dlina(b, [b[0], 0]));
      },
    })),
  ),
};

/* Блок 6. Медиана к гипотенузе. */
const MEDIANA: [number, number][] = [
  [6, 8],
  [10, 24],
  [9, 40],
  [15, 20],
  [12, 35],
  [7, 24],
];

const blokMediana: BlokOpornyh = {
  slug: 'mediana-k-gipotenuze',
  nazvanie: 'Медиана к гипотенузе',
  opisanie: 'Медиана, проведённая к гипотенузе, равна её половине',
  zapomni: 'Медиана прямоугольного треугольника, проведённая к гипотенузе, равна $\\dfrac{c}{2}$.',
  znak: 'CM = \\tfrac{c}{2}',
  zadachi: zadachi(
    'mediana',
    MEDIANA.map(([a, b]) => {
      const c = Math.round(Math.hypot(a, b));
      return {
        uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$, гипотенуза — $${c}$. Найдите медиану, проведённую к гипотенузе.`,
        otvet: zapis(c, 2),
        podskazka: 'Медиана к гипотенузе — половина гипотенузы.',
        razbor: [`$\\dfrac{${c}}{2} = ${tex(zapis(c, 2))}$.`],
        proverka: () => {
          const pa: T2 = [a, 0];
          const pb: T2 = [0, b];
          return izFloat(dlina(A0, seredina(pa, pb)));
        },
      };
    }),
  ),
};

/* Блок 7. Гипотенуза по катетам. */
const GIPOTENUZA: [number, number][] = [
  [9, 12],
  [5, 12],
  [8, 15],
  [20, 21],
  [12, 16],
  [11, 60],
];

const blokGipotenuza: BlokOpornyh = {
  slug: 'gipotenuza',
  nazvanie: 'Гипотенуза по катетам',
  opisanie: 'Теорема Пифагора: сложить квадраты катетов и извлечь корень',
  zapomni: 'Теорема Пифагора: $c^2 = a^2 + b^2$, $c = \\sqrt{a^2 + b^2}$.',
  znak: 'c^2 = a^2 + b^2',
  zadachi: zadachi(
    'gipotenuza',
    GIPOTENUZA.map(([a, b]) => {
      const c = Math.round(Math.sqrt(a * a + b * b));
      return {
        uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$. Найдите гипотенузу.`,
        otvet: zapis(c, 1),
        podskazka: 'Сложите квадраты катетов.',
        razbor: [`$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}$.`],
        proverka: () => izFloat(dlina([a, 0], [0, b])),
      };
    }),
  ),
};

/* Блок 8. Катет по гипотенузе и катету. */
const KATET: [number, number][] = [
  [10, 6],
  [13, 12],
  [25, 7],
  [17, 15],
  [26, 10],
  [29, 21],
];

const blokKatet: BlokOpornyh = {
  slug: 'katet',
  nazvanie: 'Катет по гипотенузе',
  opisanie: 'Теорема Пифагора: из квадрата гипотенузы вычесть квадрат катета',
  zapomni: 'Катет: $a = \\sqrt{c^2 - b^2}$ — квадраты вычитают.',
  znak: '\\sqrt{c^2 - b^2}',
  zadachi: zadachi(
    'katet',
    KATET.map(([c, b]) => {
      const a = Math.round(Math.sqrt(c * c - b * b));
      return {
        uslovie: `Гипотенуза прямоугольного треугольника равна $${c}$, один из катетов равен $${b}$. Найдите другой катет.`,
        otvet: zapis(a, 1),
        podskazka: 'Из квадрата гипотенузы вычтите квадрат катета.',
        razbor: [`$a = \\sqrt{${c}^2 - ${b}^2} = \\sqrt{${c * c - b * b}} = ${a}$.`],
        proverka: () => {
          /* Точка на окружности радиуса c с абсциссой b. */
          const t: T2 = [b, Math.sqrt(c * c - b * b)];
          return izFloat(dlina(t, [b, 0]));
        },
      };
    }),
  ),
};

/* ══ Навык 3. Площади ═══════════════════════════════════════════ */

/* Блок 9. Площадь треугольника. */
const S_TREUG: [string, number, number][] = [
  ['Сторона треугольника равна $#a$, высота, проведённая к ней, равна $#h$.', 14, 9],
  ['Катеты прямоугольного треугольника равны $#a$ и $#h$.', 7, 12],
  ['Основание треугольника равно $#a$, высота к основанию равна $#h$.', 11, 6],
  ['Катеты прямоугольного треугольника равны $#a$ и $#h$.', 15, 8],
  ['Сторона треугольника равна $#a$, высота, проведённая к ней, равна $#h$.', 9, 5],
  ['Основание треугольника равно $#a$, высота к основанию равна $#h$.', 20, 13],
];

const blokSTreug: BlokOpornyh = {
  slug: 'ploshchad-treugolnika',
  nazvanie: 'Площадь треугольника',
  opisanie: 'Половина произведения стороны на высоту, проведённую к ней',
  zapomni:
    'Площадь треугольника $S = \\dfrac{1}{2} a h$. У прямоугольного катеты — сторона и высота: $S = \\dfrac{1}{2} a b$.',
  znak: '\\tfrac12 ah',
  zadachi: zadachi(
    's-treug',
    S_TREUG.map(([shablon, a, h]) => ({
      uslovie: `${shablon.replace('#a', String(a)).replace('#h', String(h))} Найдите площадь треугольника.`,
      otvet: zapis(a * h, 2),
      podskazka: 'Половина произведения стороны на высоту к ней.',
      razbor: [`$S = \\dfrac{1}{2} \\cdot ${a} \\cdot ${h} = ${tex(zapis(a * h, 2))}$.`],
      proverka: () =>
        izFloat(
          ploshchad([
            [0, 0],
            [a, 0],
            [a / 3, h],
          ]),
        ),
    })),
  ),
};

/* Блок 10. Площадь ромба по диагоналям. */
const S_ROMB: [number, number][] = [
  [6, 10],
  [12, 7],
  [16, 9],
  [5, 14],
  [18, 11],
  [13, 4],
];

const blokSRomb: BlokOpornyh = {
  slug: 'ploshchad-romba',
  nazvanie: 'Площадь ромба',
  opisanie: 'Половина произведения диагоналей',
  zapomni: 'Площадь ромба $S = \\dfrac{1}{2} d_1 d_2$.',
  znak: '\\tfrac12 d_1 d_2',
  zadachi: zadachi(
    's-romb',
    S_ROMB.map(([d1, d2]) => ({
      uslovie: `Диагонали ромба равны $${d1}$ и $${d2}$. Найдите площадь ромба.`,
      otvet: zapis(d1 * d2, 2),
      podskazka: 'Перемножьте диагонали и разделите на два.',
      razbor: [`$S = \\dfrac{${d1} \\cdot ${d2}}{2} = ${tex(zapis(d1 * d2, 2))}$.`],
      proverka: () =>
        izFloat(
          ploshchad([
            [d1 / 2, 0],
            [0, d2 / 2],
            [-d1 / 2, 0],
            [0, -d2 / 2],
          ]),
        ),
    })),
  ),
};

/* Блок 11. Площадь трапеции. */
const S_TRAP: [number, number, number][] = [
  [4, 10, 6],
  [3, 8, 4],
  [7, 15, 5],
  [9, 12, 8],
  [2, 13, 10],
  [6, 11, 3],
];

const blokSTrap: BlokOpornyh = {
  slug: 'ploshchad-trapecii',
  nazvanie: 'Площадь трапеции',
  opisanie: 'Полусумма оснований, умноженная на высоту',
  zapomni: 'Площадь трапеции $S = \\dfrac{a + b}{2} \\cdot h$.',
  znak: '\\tfrac{a+b}{2}h',
  zadachi: zadachi(
    's-trap',
    S_TRAP.map(([a, b, h]) => ({
      uslovie: `Основания трапеции равны $${a}$ и $${b}$, высота равна $${h}$. Найдите площадь трапеции.`,
      otvet: zapis((a + b) * h, 2),
      podskazka: 'Сложите основания, разделите пополам и умножьте на высоту.',
      razbor: [`$S = \\dfrac{${a} + ${b}}{2} \\cdot ${h} = ${tex(zapis((a + b) * h, 2))}$.`],
      proverka: () =>
        izFloat(
          ploshchad([
            [0, 0],
            [b, 0],
            [1 + a, h],
            [1, h],
          ]),
        ),
    })),
  ),
};

/* ══ Навык 4. Средняя линия и подобие ═══════════════════════════ */

/* Блок 12. Средняя линия треугольника. */
const SR_TREUG: number[] = [18, 25, 7, 32, 13, 46];

const blokSrTreug: BlokOpornyh = {
  slug: 'srednyaya-treugolnika',
  nazvanie: 'Средняя линия треугольника',
  opisanie: 'Отрезок между серединами двух сторон — половина третьей стороны',
  zapomni: 'Средняя линия треугольника параллельна третьей стороне и равна её половине.',
  znak: 'MN = \\tfrac{AC}{2}',
  zadachi: zadachi(
    'sr-treug',
    SR_TREUG.map((ac) => ({
      uslovie: `Точки $M$ и $N$ — середины сторон $AB$ и $BC$ треугольника $ABC$, $AC = ${ac}$. Найдите $MN$.`,
      otvet: zapis(ac, 2),
      podskazka: '$MN$ — средняя линия, параллельная $AC$.',
      razbor: [`$MN = \\dfrac{AC}{2} = \\dfrac{${ac}}{2} = ${tex(zapis(ac, 2))}$.`],
      proverka: () => {
        const b: T2 = [ac / 4, 7];
        const c: T2 = [ac, 0];
        return izFloat(dlina(seredina(A0, b), seredina(b, c)));
      },
    })),
  ),
};

/* Блок 13. Средняя линия трапеции. */
const SR_TRAP: [number, number][] = [
  [6, 14],
  [5, 12],
  [9, 21],
  [3, 18],
  [11, 16],
  [8, 27],
];

const blokSrTrap: BlokOpornyh = {
  slug: 'srednyaya-trapecii',
  nazvanie: 'Средняя линия трапеции',
  opisanie: 'Отрезок между серединами боковых сторон — полусумма оснований',
  zapomni: 'Средняя линия трапеции равна полусумме оснований: $m = \\dfrac{a + b}{2}$.',
  znak: '\\tfrac{a+b}{2}',
  zadachi: zadachi(
    'sr-trap',
    SR_TRAP.map(([a, b]) => ({
      uslovie: `Основания трапеции равны $${a}$ и $${b}$. Найдите её среднюю линию.`,
      otvet: zapis(a + b, 2),
      podskazka: 'Сложите основания и разделите пополам.',
      razbor: [`$m = \\dfrac{${a} + ${b}}{2} = ${tex(zapis(a + b, 2))}$.`],
      proverka: () => {
        const nizL: T2 = [0, 0];
        const nizP: T2 = [b, 0];
        const verhL: T2 = [2, 5];
        const verhP: T2 = [2 + a, 5];
        return izFloat(dlina(seredina(nizL, verhL), seredina(nizP, verhP)));
      },
    })),
  ),
};

/* Блок 14. Площади подобных треугольников. */
const PODOBIE: [number, number][] = [
  [2, 7],
  [3, 5],
  [2, 13],
  [4, 3],
  [3, 8],
  [5, 2],
];

const blokPodobie: BlokOpornyh = {
  slug: 'ploshchadi-podobnyh',
  nazvanie: 'Площади подобных фигур',
  opisanie: 'Стороны больше в несколько раз — площадь больше в квадрат этого числа раз',
  zapomni: 'Стороны подобных фигур отличаются в $k$ раз, площади — в $k^2$ раз.',
  znak: 'k^2',
  zadachi: zadachi(
    'podobie',
    PODOBIE.map(([k, s]) => ({
      uslovie: `Стороны одного треугольника в $${k}$ ${k < 5 ? 'раза' : 'раз'} больше соответствующих сторон подобного ему треугольника. Площадь меньшего треугольника равна $${s}$. Найдите площадь большего.`,
      otvet: zapis(s * k * k, 1),
      podskazka: `Площадь больше в $${k}^2$ раз.`,
      razbor: [`$S = ${s} \\cdot ${k}^2 = ${s} \\cdot ${k * k} = ${s * k * k}$.`],
      proverka: () => {
        /* Треугольник площади s и он же, растянутый в k раз. */
        const t: T2[] = [
          [0, 0],
          [2 * s, 0],
          [0.5, 1],
        ];
        return izFloat(ploshchad(t.map(([x, y]) => [k * x, k * y] as T2)));
      },
    })),
  ),
};

/* ══ Навык 5. Синус, косинус, тангенс ═══════════════════════════ */

type Funk = 'sin' | 'cos' | 'tg';
const ZNAK_FUNK: Record<Funk, string> = { sin: '\\sin', cos: '\\cos', tg: '\\mathrm{tg}\\,' };

/* Блок 15. Отношение сторон: катеты AC и BC, угол C прямой. */
const OTNOSHENIE: [Funk, number, number][] = [
  ['sin', 4, 3],
  ['cos', 24, 7],
  ['tg', 4, 3],
  ['sin', 15, 20],
  ['cos', 12, 16],
  ['tg', 5, 12],
];

const blokOtnoshenie: BlokOpornyh = {
  slug: 'otnoshenie-storon',
  nazvanie: 'Синус, косинус, тангенс по сторонам',
  opisanie: 'Разделить нужный катет на гипотенузу или на другой катет',
  zapomni:
    '$\\sin A = \\dfrac{BC}{AB}$ — противолежащий к гипотенузе, $\\cos A = \\dfrac{AC}{AB}$ — прилежащий к гипотенузе, $\\mathrm{tg}\\,A = \\dfrac{BC}{AC}$ — противолежащий к прилежащему.',
  znak: '\\tfrac{BC}{AB}',
  zadachi: zadachi(
    'otnoshenie',
    OTNOSHENIE.map(([f, ac, bc]) => {
      const ab = Math.round(Math.hypot(ac, bc));
      const [dano, chislitel, znamenatel, kak] =
        f === 'sin'
          ? [`$BC = ${bc}$, $AB = ${ab}$`, bc, ab, 'BC}{AB']
          : f === 'cos'
            ? [`$AC = ${ac}$, $AB = ${ab}$`, ac, ab, 'AC}{AB']
            : [`$AC = ${ac}$, $BC = ${bc}$`, bc, ac, 'BC}{AC'];
      const otvet = zapis(chislitel, znamenatel);
      return {
        uslovie: `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, ${dano}. Найдите $${ZNAK_FUNK[f]} A$.`,
        otvet,
        podskazka:
          f === 'tg'
            ? 'Тангенс — противолежащий катет к прилежащему.'
            : f === 'sin'
              ? 'Синус — противолежащий катет к гипотенузе.'
              : 'Косинус — прилежащий катет к гипотенузе.',
        razbor: [
          `$${ZNAK_FUNK[f]} A = \\dfrac{${kak}} = \\dfrac{${chislitel}}{${znamenatel}} = ${tex(otvet)}$.`,
        ],
        proverka: () => {
          const a = Math.atan2(bc, ac);
          return izFloat(f === 'sin' ? Math.sin(a) : f === 'cos' ? Math.cos(a) : Math.tan(a));
        },
      };
    }),
  ),
};

/* Блок 16. Катет по гипотенузе и синусу или косинусу (значение — в сотых). */
const KATET_TRIG: ['sin' | 'cos', number, number][] = [
  ['cos', 20, 45],
  ['sin', 50, 24],
  ['cos', 30, 80],
  ['sin', 16, 75],
  ['cos', 45, 40],
  ['sin', 60, 15],
];

const blokKatetTrig: BlokOpornyh = {
  slug: 'katet-po-gipotenuze',
  nazvanie: 'Катет через синус или косинус',
  opisanie: 'Гипотенузу умножить на синус или косинус острого угла',
  zapomni: 'Противолежащий катет $BC = AB \\cdot \\sin A$, прилежащий $AC = AB \\cdot \\cos A$.',
  znak: 'AB \\cos A',
  zadachi: zadachi(
    'katet-trig',
    KATET_TRIG.map(([f, ab, v]) => {
      const iskomyy = f === 'sin' ? 'BC' : 'AC';
      const otvet = zapis(ab * v, 100);
      const znach = tex(zapis(v, 100));
      return {
        uslovie: `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AB = ${ab}$, $${ZNAK_FUNK[f]} A = ${znach}$. Найдите $${iskomyy}$.`,
        otvet,
        podskazka:
          f === 'sin'
            ? '$BC$ лежит против угла $A$ — нужен синус.'
            : '$AC$ прилежит к углу $A$ — нужен косинус.',
        razbor: [
          `$${iskomyy} = AB \\cdot ${ZNAK_FUNK[f]} A = ${ab} \\cdot ${znach} = ${tex(otvet)}$.`,
        ],
        proverka: () => {
          /* Строим треугольник по углу и гипотенузе, меряем катет. */
          const a = f === 'sin' ? Math.asin(v / 100) : Math.acos(v / 100);
          const b: T2 = [ab * Math.cos(a), ab * Math.sin(a)];
          const c: T2 = [b[0], 0];
          return izFloat(f === 'sin' ? dlina(b, c) : dlina(A0, c));
        },
      };
    }),
  ),
};

/* Блок 17. Катет через тангенс (значение — в сотых). */
const KATET_TG: [number, number][] = [
  [6, 150],
  [12, 25],
  [7, 400],
  [20, 35],
  [9, 200],
  [16, 75],
];

const blokKatetTg: BlokOpornyh = {
  slug: 'katet-po-tangensu',
  nazvanie: 'Катет через тангенс',
  opisanie: 'Прилежащий катет умножить на тангенс острого угла',
  zapomni:
    'Противолежащий катет равен прилежащему, умноженному на тангенс: $BC = AC \\cdot \\mathrm{tg}\\,A$.',
  znak: 'AC\\,\\mathrm{tg}\\,A',
  zadachi: zadachi(
    'katet-tg',
    KATET_TG.map(([ac, v]) => {
      const otvet = zapis(ac * v, 100);
      const znach = tex(zapis(v, 100));
      return {
        uslovie: `В треугольнике $ABC$ угол $C$ равен $90^\\circ$, $AC = ${ac}$, $\\mathrm{tg}\\,A = ${znach}$. Найдите $BC$.`,
        otvet,
        podskazka: 'Тангенс — отношение $BC$ к $AC$.',
        razbor: [`$BC = AC \\cdot \\mathrm{tg}\\,A = ${ac} \\cdot ${znach} = ${tex(otvet)}$.`],
        proverka: () => {
          const a = Math.atan(v / 100);
          /* Луч из A под углом a до вертикали через C = (ac; 0). */
          const b: T2 = [ac, (ac * Math.sin(a)) / Math.cos(a)];
          return izFloat(dlina(b, [ac, 0]));
        },
      };
    }),
  ),
};

/* ══ Навык 6. Окружность ════════════════════════════════════════ */

/* Блок 18. Вписанный угол — половина центрального. */
const VPISANNYY: number[] = [84, 136, 58, 162, 47, 110];

const blokVpisannyy: BlokOpornyh = {
  slug: 'vpisannyy-ugol',
  nazvanie: 'Вписанный угол',
  opisanie: 'Вписанный угол равен половине центрального, опирающегося на ту же дугу',
  zapomni:
    'Вписанный угол равен половине дуги, на которую опирается: $\\angle ACB = \\dfrac{\\angle AOB}{2}$.',
  znak: '\\tfrac{\\angle AOB}{2}',
  zadachi: zadachi(
    'vpisannyy',
    VPISANNYY.map((u) => ({
      uslovie: `Точки $A$, $B$ и $C$ лежат на окружности с центром $O$, угол $AOB$ равен $${u}^\\circ$, точка $C$ лежит на большей дуге $AB$. Найдите угол $ACB$. ${VGRADUSAH}`,
      otvet: zapis(u, 2),
      podskazka: 'Углы $AOB$ и $ACB$ опираются на одну дугу.',
      razbor: [`$\\angle ACB = \\dfrac{${u}^\\circ}{2} = ${gr(zapis(u, 2))}$.`],
      proverka: () => {
        const a = luch(0);
        const b = luch(u);
        const c = luch(180 + u / 2);
        return izFloat(ugolPri(a, c, b));
      },
    })),
  ),
};

/* Блок 19. Угол, опирающийся на диаметр. */
const DIAMETR: number[] = [34, 52, 18, 71, 45, 26];

const blokDiametr: BlokOpornyh = {
  slug: 'ugol-na-diametr',
  nazvanie: 'Угол на диаметр',
  opisanie: 'Вписанный угол, опирающийся на диаметр, прямой',
  zapomni:
    'Вписанный угол, опирающийся на диаметр, равен $90^\\circ$. Тогда два других угла треугольника в сумме $90^\\circ$.',
  znak: '90^\\circ',
  zadachi: zadachi(
    'diametr',
    DIAMETR.map((a) => ({
      uslovie: `Отрезок $AB$ — диаметр окружности, точка $C$ лежит на окружности, угол $CAB$ равен $${a}^\\circ$. Найдите угол $CBA$. ${VGRADUSAH}`,
      otvet: zapis(90 - a, 1),
      podskazka: 'Угол $ACB$ опирается на диаметр.',
      razbor: [
        '$\\angle ACB = 90^\\circ$.',
        `$\\angle CBA = 90^\\circ - ${a}^\\circ = ${gr(zapis(90 - a, 1))}$.`,
      ],
      proverka: () => {
        const pa: T2 = [-1, 0];
        const pb: T2 = [1, 0];
        const c = luch(2 * a);
        return izFloat(ugolPri(c, pb, pa));
      },
    })),
  ),
};

/* Блок 20. Дуга стороны правильного многоугольника. */
const PRAVILNYY: [number, string][] = [
  [5, 'пятиугольника'],
  [8, 'восьмиугольника'],
  [9, 'девятиугольника'],
  [10, 'десятиугольника'],
  [15, 'пятнадцатиугольника'],
  [18, 'восемнадцатиугольника'],
];

const blokPravilnyy: BlokOpornyh = {
  slug: 'pravilnyy-mnogougolnik',
  nazvanie: 'Правильный многоугольник',
  opisanie: 'Вершины делят описанную окружность на равные дуги',
  zapomni:
    'Сторона правильного $n$-угольника стягивает дугу $\\dfrac{360^\\circ}{n}$ описанной окружности.',
  znak: '\\tfrac{360^\\circ}{n}',
  zadachi: zadachi(
    'pravilnyy',
    PRAVILNYY.map(([n, imya]) => ({
      uslovie: `Около правильного ${imya} описана окружность. Найдите градусную меру дуги, которую стягивает одна его сторона. ${VGRADUSAH}`,
      otvet: zapis(360, n),
      podskazka: `Вершины делят окружность на $${n}$ равных дуг.`,
      razbor: [`$\\dfrac{360^\\circ}{${n}} = ${gr(zapis(360, n))}$.`],
      proverka: () => {
        /* Центральный угол между соседними вершинами. */
        const v0: T2 = [1, 0];
        const v1: T2 = [Math.cos((2 * Math.PI) / n), Math.sin((2 * Math.PI) / n)];
        return izFloat(ugol(v0, v1));
      },
    })),
  ),
};

/* Блок 21. Длина большей дуги по меньшей. */
const DUGA: [number, number][] = [
  [40, 6],
  [90, 14],
  [120, 15],
  [30, 4],
  [72, 10],
  [45, 3],
];

const blokDuga: BlokOpornyh = {
  slug: 'dlina-dugi',
  nazvanie: 'Длина дуги',
  opisanie: 'Длина дуги пропорциональна её градусной мере',
  zapomni:
    'Две точки делят окружность на дуги $\\alpha$ и $360^\\circ - \\alpha$. Длины дуг относятся так же, как их градусные меры.',
  znak: '\\tfrac{\\alpha}{360^\\circ}',
  zadachi: zadachi(
    'duga',
    DUGA.map(([u, l]) => ({
      uslovie: `Центральный угол $AOB$ равен $${u}^\\circ$, длина меньшей дуги $AB$ равна $${l}$. Найдите длину большей дуги $AB$.`,
      otvet: zapis(l * (360 - u), u),
      podskazka: `Большая дуга — $${360 - u}^\\circ$, во сколько раз она больше $${u}^\\circ$?`,
      razbor: [
        `Большая дуга $360^\\circ - ${u}^\\circ = ${360 - u}^\\circ$ — в $\\dfrac{${360 - u}}{${u}}$ раз длиннее меньшей.`,
        `$${l} \\cdot \\dfrac{${360 - u}}{${u}} = ${tex(zapis(l * (360 - u), u))}$.`,
      ],
      proverka: () => {
        const r = l / (u * RAD);
        return izFloat(2 * Math.PI * r - l);
      },
    })),
  ),
};

export const OPORNYE_12: NavykOpornyh[] = [
  {
    id: 'ugly',
    nazvanie: 'Находим углы',
    lead: 'Смежные и односторонние углы, сумма углов треугольника, равнобедренный, внешний угол',
    ton: 'blue',
    bloki: [blokDo180, blokTretiy, blokOsnovanie, blokVneshniy],
  },
  {
    id: 'pryamougolnyy',
    nazvanie: 'Прямоугольный треугольник',
    lead: 'Катет против угла 30°, медиана к гипотенузе, теорема Пифагора',
    ton: 'green',
    bloki: [blokUgol30, blokMediana, blokGipotenuza, blokKatet],
  },
  {
    id: 'ploshchadi',
    nazvanie: 'Считаем площади',
    lead: 'Треугольник, ромб, трапеция',
    ton: 'orange',
    bloki: [blokSTreug, blokSRomb, blokSTrap],
  },
  {
    id: 'podobie',
    nazvanie: 'Средняя линия и подобие',
    lead: 'Половина стороны, полусумма оснований, площади в квадрат раз',
    ton: 'navy',
    bloki: [blokSrTreug, blokSrTrap, blokPodobie],
  },
  {
    id: 'trigonometriya',
    nazvanie: 'Синус, косинус, тангенс',
    lead: 'Отношение сторон и катет через острый угол',
    ton: 'terra',
    bloki: [blokOtnoshenie, blokKatetTrig, blokKatetTg],
  },
  {
    id: 'okruzhnost',
    nazvanie: 'Окружность',
    lead: 'Вписанный угол, угол на диаметр, правильный многоугольник, длина дуги',
    ton: 'blue',
    bloki: [blokVpisannyy, blokDiametr, blokPravilnyy, blokDuga],
  },
];
