/**
 * База, №13: опорные задачи — короткие задачи на один шаг. Из этих шагов
 * складывается любая задача номера: площадь основания, катет по теореме
 * Пифагора, объём призмы и пирамиды, апофема, величина тела вращения
 * «в π», отношение величин двух тел, подобие.
 *
 * Ответ считается из чисел условия точно (lib/baza/chisla.ts). Пересчёт
 * proverka — другим способом: перебором целых, формулой Герона, числами
 * с π или через объём усечённого конуса. Сверяет pnpm test:baza.
 */

import { tex, zapis } from '@/lib/baza/chisla';
import type { BlokOpornyh, MikroZadacha, NavykOpornyh } from '@/lib/baza/types';

const zadachi = (slug: string, spisok: Omit<MikroZadacha, 'id'>[]): MikroZadacha[] =>
  spisok.map((z, i) => ({ ...z, id: `b13-${slug}-${String(i + 1).padStart(2, '0')}` }));

/** Число, посчитанное в плавающей точке, → запись бланка (до тысячных). */
function izFloat(x: number): string {
  const m = Math.round(x * 1000);
  if (Math.abs(x * 1000 - m) > 1e-6) throw new Error(`не конечная дробь: ${x}`);
  return zapis(m, 1000);
}

const t = (m: number, n = 1): string => tex(zapis(m, n));

/** Целый корень перебором. */
function korenPerebor(n: number): number {
  for (let r = 0; r * r <= n; r += 1) if (r * r === n) return r;
  return NaN;
}

/** Площадь треугольника по трём сторонам (Герон). */
function geron(x: number, y: number, z: number): number {
  const p = (x + y + z) / 2;
  return Math.sqrt(p * (p - x) * (p - y) * (p - z));
}

/* ══ Навык 1. Площадь основания ═════════════════════════════════ */

const KATETY: [number, number][] = [
  [6, 7],
  [5, 8],
  [9, 4],
  [3, 11],
  [7, 10],
];

const blokKatety: BlokOpornyh = {
  slug: 'katety',
  nazvanie: 'Прямоугольный треугольник',
  opisanie: 'Площадь основания призмы, если в нём прямоугольный треугольник',
  zapomni: '$S = \\dfrac{ab}{2}$ — половина произведения катетов.',
  znak: '\\tfrac{ab}{2}',
  zadachi: zadachi(
    'katety',
    KATETY.map(([a, b]) => ({
      uslovie: `Катеты прямоугольного треугольника равны ${a} и ${b}. Найдите его площадь.`,
      otvet: zapis(a * b, 2),
      podskazka: 'Перемножьте катеты и разделите пополам.',
      razbor: [`$S = \\dfrac{${a}\\cdot ${b}}{2} = ${t(a * b, 2)}$.`],
      proverka: () => izFloat(geron(a, b, Math.hypot(a, b))),
    })),
  ),
};

/* Произведение «площадь правильного треугольника × k√3». */
const PRAVILNYY: [number, number][] = [
  [2, 5],
  [4, 3],
  [6, 1],
  [8, 2],
  [10, 3],
];

const blokPravilnyy: BlokOpornyh = {
  slug: 'pravilnyy',
  nazvanie: 'Правильный треугольник и корень из трёх',
  opisanie: 'Площадь правильного треугольника умножить на высоту с корнем из трёх',
  zapomni:
    '$S = \\dfrac{a^2\\sqrt{3}}{4}$. Высота вида $k\\sqrt{3}$ сокращает корень: $\\sqrt{3}\\cdot\\sqrt{3} = 3$.',
  znak: '\\sqrt3',
  zadachi: zadachi(
    'pravilnyy',
    PRAVILNYY.map(([a, k]) => ({
      uslovie: `Найдите произведение площади правильного треугольника со стороной ${a} на число $${k === 1 ? '' : k}\\sqrt{3}$.`,
      otvet: zapis(3 * a * a * k, 4),
      podskazka: 'Площадь $\\dfrac{a^2\\sqrt{3}}{4}$; при умножении корни дадут $3$.',
      razbor: [
        `$S = \\dfrac{${a * a}\\sqrt{3}}{4}$.`,
        `$\\dfrac{${a * a}\\sqrt{3}}{4}\\cdot ${k === 1 ? '' : k}\\sqrt{3} = \\dfrac{${a * a}\\cdot ${k}\\cdot 3}{4} = ${t(3 * a * a * k, 4)}$.`,
      ],
      proverka: () => izFloat(geron(a, a, a) * k * Math.sqrt(3)),
    })),
  ),
};

/* Катет по гипотенузе: гипотенуза — корень или целое. */
const PIFAGOR: [number, number][] = [
  [4, 41],
  [2, 40],
  [5, 61],
  [6, 100],
  [3, 25],
];

const blokPifagor: BlokOpornyh = {
  slug: 'pifagor',
  nazvanie: 'Катет по теореме Пифагора',
  opisanie: 'Второй катет, высота или ребро — из гипотенузы и известного катета',
  zapomni: '$b = \\sqrt{c^2 - a^2}$. Если $c = \\sqrt{n}$, то $c^2 = n$.',
  znak: 'c^2',
  zadachi: zadachi(
    'pifagor',
    PIFAGOR.map(([a, c2]) => {
      const kv = korenPerebor(c2);
      const c = Number.isNaN(kv) ? `\\sqrt{${c2}}` : String(kv);
      const b = Math.sqrt(c2 - a * a);
      return {
        uslovie: `Гипотенуза прямоугольного треугольника равна $${c}$, один катет равен ${a}. Найдите второй катет.`,
        otvet: zapis(Math.round(b), 1),
        podskazka: 'Из квадрата гипотенузы вычтите квадрат известного катета.',
        razbor: [`$b = \\sqrt{${c2} - ${a * a}} = \\sqrt{${c2 - a * a}} = ${t(Math.round(b))}$.`],
        proverka: () => String(korenPerebor(c2 - a * a)),
      };
    }),
  ),
};

/* ══ Навык 2. Объёмы многогранников ══════════════════════════════ */

const TRETYE: [number, number, number][] = [
  [4, 5, 120],
  [3, 8, 96],
  [6, 7, 210],
  [2, 9, 54],
  [5, 5, 75],
];

const blokTretye: BlokOpornyh = {
  slug: 'tretye-rebro',
  nazvanie: 'Третье ребро параллелепипеда',
  opisanie: 'Из объёма и двух рёбер найти третье ребро',
  zapomni: '$V = abc$, значит, $c = \\dfrac{V}{ab}$.',
  znak: 'abc',
  zadachi: zadachi(
    'tretye',
    TRETYE.map(([a, b, v]) => ({
      uslovie: `Объём прямоугольного параллелепипеда равен ${v}, два его ребра — ${a} и ${b}. Найдите третье ребро.`,
      otvet: zapis(v, a * b),
      podskazka: 'Разделите объём на произведение известных рёбер.',
      razbor: [`$c = \\dfrac{${v}}{${a}\\cdot ${b}} = \\dfrac{${v}}{${a * b}} = ${t(v, a * b)}$.`],
      proverka: () => {
        for (let c = 1; c <= 1000; c += 1) if (a * b * c === v) return String(c);
        return '';
      },
    })),
  ),
};

const PRIZMY: [number, number][] = [
  [12, 5],
  [7, 6],
  [15, 4],
  [9, 8],
  [20, 3],
];

const blokPrizma: BlokOpornyh = {
  slug: 'prizma',
  nazvanie: 'Объём призмы',
  opisanie: 'Площадь основания умножить на высоту',
  zapomni: '$V = S_{\\text{осн}}\\cdot h$ — без множителя $\\frac{1}{3}$.',
  znak: 'Sh',
  zadachi: zadachi(
    'prizma',
    PRIZMY.map(([s, h]) => ({
      uslovie: `Площадь основания призмы равна ${s}, высота — ${h}. Найдите объём призмы.`,
      otvet: String(s * h),
      podskazka: 'Объём призмы — площадь основания на высоту.',
      razbor: [`$V = ${s}\\cdot ${h} = ${s * h}$.`],
      proverka: () => String(Array.from({ length: h }, () => s).reduce((x, y) => x + y, 0)),
    })),
  ),
};

/* Пирамида: [площадь основания, высота] — объём; и обратная задача. */
const PIRAMIDY: [number, number][] = [
  [15, 4],
  [9, 7],
  [24, 5],
  [12, 11],
  [30, 2],
];
const VYSOTY: [number, number][] = [
  [18, 30],
  [10, 40],
  [21, 28],
  [16, 32],
  [27, 45],
];

const blokPiramida: BlokOpornyh = {
  slug: 'piramida',
  nazvanie: 'Объём пирамиды',
  opisanie: 'Треть площади основания на высоту — и обратно, высота по объёму',
  zapomni: '$V = \\dfrac{1}{3}S h$, отсюда $h = \\dfrac{3V}{S}$.',
  znak: '\\tfrac13',
  zadachi: zadachi('piramida', [
    ...PIRAMIDY.map(([s, h]) => ({
      uslovie: `Площадь основания пирамиды равна ${s}, высота — ${h}. Найдите объём пирамиды.`,
      otvet: zapis(s * h, 3),
      podskazka: 'Не забудьте множитель $\\frac{1}{3}$.',
      razbor: [`$V = \\dfrac{1}{3}\\cdot ${s}\\cdot ${h} = ${t(s * h, 3)}$.`],
      proverka: () => izFloat((s * h) / 3),
    })),
    ...VYSOTY.map(([s, v]) => ({
      uslovie: `Объём пирамиды равен ${v}, площадь основания — ${s}. Найдите высоту пирамиды.`,
      otvet: zapis(3 * v, s),
      podskazka: 'Умножьте объём на $3$ и разделите на площадь основания.',
      razbor: [`$h = \\dfrac{3\\cdot ${v}}{${s}} = \\dfrac{${3 * v}}{${s}} = ${t(3 * v, s)}$.`],
      proverka: () => {
        for (let h100 = 1; h100 <= 100000; h100 += 1)
          if (s * h100 === 300 * v) return zapis(h100, 100);
        return '';
      },
    })),
  ]),
};

/* ══ Навык 3. Апофема и боковая поверхность ══════════════════════ */

const APOFEMY: [number, number][] = [
  [6, 5],
  [16, 17],
  [10, 13],
  [14, 25],
  [18, 15],
];

const blokApofema: BlokOpornyh = {
  slug: 'apofema',
  nazvanie: 'Апофема',
  opisanie: 'Высота боковой грани по стороне основания и боковому ребру',
  zapomni:
    '$m = \\sqrt{l^2 - \\left(\\dfrac{a}{2}\\right)^2}$: апофема делит сторону основания пополам.',
  znak: 'm',
  zadachi: zadachi(
    'apofema',
    APOFEMY.map(([a, l]) => {
      const m = Math.sqrt(l * l - (a / 2) ** 2);
      return {
        uslovie: `Сторона основания правильной пирамиды равна ${a}, боковое ребро — ${l}. Найдите апофему.`,
        otvet: zapis(Math.round(m), 1),
        podskazka: 'Апофема — катет: гипотенуза — ребро, второй катет — половина стороны.',
        razbor: [
          `$m = \\sqrt{${l}^2 - ${a / 2}^2} = \\sqrt{${l * l - (a / 2) ** 2}} = ${Math.round(m)}$.`,
        ],
        proverka: () => izFloat((2 * geron(a, l, l)) / a),
      };
    }),
  ),
};

/* [число граней, сторона, апофема] */
const BOKOVYE: [number, number, number][] = [
  [3, 8, 5],
  [4, 6, 7],
  [6, 10, 12],
  [3, 14, 9],
  [6, 4, 15],
];
const NAZV: Record<number, string> = { 3: 'треугольной', 4: 'четырёхугольной', 6: 'шестиугольной' };

const blokBokovaya: BlokOpornyh = {
  slug: 'bokovaya',
  nazvanie: 'Боковая поверхность',
  opisanie: 'Площадь одной грани умножить на число граней',
  zapomni:
    '$S_{\\text{бок}} = n\\cdot\\dfrac{1}{2}am$ — у правильной пирамиды все боковые грани равны.',
  znak: 'S',
  zadachi: zadachi(
    'bokovaya',
    BOKOVYE.map(([n, a, m]) => ({
      uslovie: `Сторона основания правильной ${NAZV[n] ?? ''} пирамиды равна ${a}, апофема — ${m}. Найдите площадь боковой поверхности.`,
      otvet: zapis(n * a * m, 2),
      podskazka: `Граней ${n}, площадь каждой — $\\frac{1}{2}am$.`,
      razbor: [
        `Одна грань: $\\dfrac{1}{2}\\cdot ${a}\\cdot ${m} = ${t(a * m, 2)}$.`,
        `$S = ${n}\\cdot ${t(a * m, 2)} = ${t(n * a * m, 2)}$.`,
      ],
      proverka: () => izFloat(((n * a) / 2) * m),
    })),
  ),
};

/* ══ Навык 4. Тела вращения ══════════════════════════════════════ */

/* [вид, r, h]: объём «в π» — число перед π. */
const VPI: ['cil' | 'kon', number, number][] = [
  ['cil', 3, 5],
  ['kon', 3, 7],
  ['cil', 4, 2],
  ['kon', 6, 5],
  ['kon', 2, 9],
];

const blokPi: BlokOpornyh = {
  slug: 'pi',
  nazvanie: 'Объём без множителя пи',
  opisanie: 'Найти число, которое стоит перед пи в объёме цилиндра или конуса',
  zapomni: 'Цилиндр: $V = \\pi r^2 h$. Конус: $V = \\dfrac{1}{3}\\pi r^2 h$.',
  znak: '\\pi',
  zadachi: zadachi(
    'pi',
    VPI.map(([vid, r, h]) => {
      const n = vid === 'cil' ? r * r * h : (r * r * h) / 3;
      return {
        uslovie: `Радиус основания ${vid === 'cil' ? 'цилиндра' : 'конуса'} равен ${r}, высота — ${h}. Найдите объём, делённый на $\\pi$.`,
        otvet: zapis(vid === 'cil' ? r * r * h : r * r * h, vid === 'cil' ? 1 : 3),
        podskazka:
          vid === 'cil'
            ? 'Площадь основания $\\pi r^2$ на высоту.'
            : 'Треть площади основания на высоту.',
        razbor: [
          vid === 'cil'
            ? `$V = \\pi\\cdot ${r}^2\\cdot ${h} = ${t(n)}\\pi$, ответ $${t(n)}$.`
            : `$V = \\dfrac{1}{3}\\pi\\cdot ${r}^2\\cdot ${h} = ${t(r * r * h, 3)}\\pi$, ответ $${t(r * r * h, 3)}$.`,
        ],
        proverka: () => izFloat(((vid === 'cil' ? 1 : 1 / 3) * Math.PI * r * r * h) / Math.PI),
      };
    }),
  ),
};

/* Отношение объёмов двух цилиндров: [r1, h1, r2, h2], первый больше. */
const OTNOSHENIYA: [number, number, number, number][] = [
  [4, 3, 2, 2],
  [6, 2, 3, 4],
  [5, 4, 5, 1],
  [3, 8, 2, 6],
  [10, 1, 5, 2],
];

const blokOtnoshenie: BlokOpornyh = {
  slug: 'otnoshenie',
  nazvanie: 'Во сколько раз больше',
  opisanie: 'Сравнить объёмы двух цилиндров: множитель пи сокращается',
  zapomni: '$\\dfrac{V_1}{V_2} = \\dfrac{r_1^2 h_1}{r_2^2 h_2}$ — сравнивай без $\\pi$.',
  znak: 'k',
  zadachi: zadachi(
    'otnoshenie',
    OTNOSHENIYA.map(([r1, h1, r2, h2]) => ({
      uslovie: `Радиус и высота первого цилиндра — ${r1} и ${h1}, второго — ${r2} и ${h2}. Во сколько раз объём первого больше объёма второго?`,
      otvet: zapis(r1 * r1 * h1, r2 * r2 * h2),
      podskazka: 'Сравните $r^2h$ двух цилиндров.',
      razbor: [
        `$\\dfrac{${r1}^2\\cdot ${h1}}{${r2}^2\\cdot ${h2}} = \\dfrac{${r1 * r1 * h1}}{${r2 * r2 * h2}} = ${t(r1 * r1 * h1, r2 * r2 * h2)}$.`,
      ],
      proverka: () => izFloat((Math.PI * r1 * r1 * h1) / (Math.PI * r2 * r2 * h2)),
    })),
  ),
};

/* Подобие: отсечённый конус, отношение 1 : m от вершины, объём данного. */
const PODOBIE: [number, number][] = [
  [1, 54],
  [2, 81],
  [3, 128],
  [1, 200],
  [4, 250],
];

const blokPodobie: BlokOpornyh = {
  slug: 'podobie',
  nazvanie: 'Подобие: куб коэффициента',
  opisanie: 'Объём отсечённого конуса через коэффициент подобия',
  zapomni:
    'Деление высоты $1:m$ от вершины — коэффициент $k = \\dfrac{1}{m+1}$. Объёмы относятся как $k^3$.',
  znak: 'k^3',
  zadachi: zadachi(
    'podobie',
    PODOBIE.map(([m, v]) => ({
      uslovie: `Объём конуса равен ${v}. Плоскость, параллельная основанию, делит высоту в отношении $1:${m}$, считая от вершины. Найдите объём отсечённого конуса.`,
      otvet: zapis(v, (m + 1) ** 3),
      podskazka: `От вершины одна часть из $${m + 1}$.`,
      razbor: [
        `$k = \\dfrac{1}{${m + 1}}$, $k^3 = \\dfrac{1}{${(m + 1) ** 3}}$.`,
        `$V = \\dfrac{${v}}{${(m + 1) ** 3}} = ${t(v, (m + 1) ** 3)}$.`,
      ],
      proverka: () => {
        /* Данный конус минус усечённый (R = H = 1). */
        const k = 1 / (m + 1);
        const usech = ((1 - k) / 3) * (1 + k + k * k);
        return izFloat((v * (1 / 3 - usech)) / (1 / 3));
      },
    })),
  ),
};

export const OPORNYE_13: NavykOpornyh[] = [
  {
    id: 'osnovanie',
    nazvanie: 'Площадь основания',
    lead: 'Прямоугольный и правильный треугольник, недостающий катет',
    ton: 'blue',
    bloki: [blokKatety, blokPravilnyy, blokPifagor],
  },
  {
    id: 'obemy',
    nazvanie: 'Объёмы многогранников',
    lead: 'Параллелепипед, призма, пирамида — и обратная задача',
    ton: 'orange',
    bloki: [blokTretye, blokPrizma, blokPiramida],
  },
  {
    id: 'bokovaya',
    nazvanie: 'Апофема и боковая поверхность',
    lead: 'Высота боковой грани и площадь всех граней',
    ton: 'green',
    bloki: [blokApofema, blokBokovaya],
  },
  {
    id: 'vrashchenie',
    nazvanie: 'Тела вращения и подобие',
    lead: 'Объём без множителя пи, отношения тел и куб коэффициента подобия',
    ton: 'terra',
    bloki: [blokPi, blokOtnoshenie, blokPodobie],
  },
];
