/**
 * База, задание №13, часть 3: цилиндр, конус, шар (задачи 73–132
 * задачника, на сайте — только их аналоги).
 *
 * proverka считает ответ иначе, чем разбор: величины тел — числами
 * с π и отношение уже потом, перебором целых или через другую формулу
 * (развёртка конуса, объём усечённого конуса).
 */

import { zapis } from '../chisla';
import type { GruppaBazy, Params, Prototip } from '../types';
import {
  $,
  blank,
  drob,
  izmereno,
  korenPereborom,
  num,
  prototip,
  t,
  tselyyKoren,
  vopros,
} from './obshchee';
import {
  risCilindrSechenie,
  risDvaCilindra,
  risDvaKonusa,
  risDvaShara,
  risKonus,
  risKonusSechenie,
} from './ris';

export const GRUPPY_13_3: GruppaBazy[] = [
  { id: 'E', nazvanie: 'Цилиндр', znak: '\\pi r^2', ton: 'terra' },
  { id: 'F', nazvanie: 'Конус', znak: 'V', ton: 'blue' },
  { id: 'G', nazvanie: 'Шар', znak: 'R^3', ton: 'orange' },
];

/** Отношение большего к меньшему: какое тело в вопросе больше. */
interface Dva {
  r1: number;
  x1: number;
  r2: number;
  x2: number;
  /** Номер тела, которое в вопросе «больше»: 1 или 2. */
  bolshe: 1 | 2;
}

const PERVOE = ['первого', 'второго'] as const;

/* ── Два цилиндра: объём и боковая поверхность ────────────────── */

interface FormulirovkaDvuh {
  /** «первого цилиндра» или просто «первого». */
  pervogo: string;
  bolshe: 1 | 2;
}

const CIL_OBEM: readonly FormulirovkaDvuh[] = [
  { pervogo: 'первого цилиндра', bolshe: 2 },
  { pervogo: 'первого цилиндра', bolshe: 1 },
  { pervogo: 'первого', bolshe: 1 },
];
const CIL_BOK: readonly FormulirovkaDvuh[] = [
  { pervogo: 'первого цилиндра', bolshe: 1 },
  { pervogo: 'первого цилиндра', bolshe: 2 },
];

function formulirovka(spisok: readonly FormulirovkaDvuh[], p: Params): FormulirovkaDvuh {
  const f = spisok[num(p, 'f')];
  if (f === undefined) throw new Error('нет формулировки');
  return f;
}

/** Числа двух тел из параметров: r1, h1 (или l1), r2, h2 (или l2). */
function dva(p: Params, x: 'h' | 'l', bolshe: 1 | 2): Dva {
  return {
    r1: num(p, 'r1'),
    x1: num(p, `${x}1`),
    r2: num(p, 'r2'),
    x2: num(p, `${x}2`),
    bolshe,
  };
}

/**
 * Разбор отношения величин двух тел вида k·r^a·x^b·π: величина каждого
 * тела, затем отношение «большего по вопросу» к другому.
 */
function otnoshenie(o: {
  d: Dva;
  /** TeX величины через r и x (с π): «\\pi r^2 h». */
  formula: string;
  /** Что сравниваем: «объём», «площадь боковой поверхности». */
  chto: string;
  /** Тело в родительном падеже: «цилиндра», «конуса». */
  telo: string;
  /** Буква величины: V или S. */
  bukva: string;
  /** Числовой множитель перед π (дробь): [числитель, знаменатель]. */
  mnozhitel: readonly [number, number];
  /** Значение без множителя и π: r²h, rh, rl. */
  znachenie: (r: number, x: number) => number;
  /** TeX подстановки: «4^2\\cdot 9». */
  podstanovka: (r: number, x: number) => string;
  /** Типичная ошибка в формуле (без квадрата или лишний квадрат) — для отвлекающих вариантов. */
  oshibka: (r: number, x: number) => number;
  /** Отвлекающие формулы для подсказки. */
  nevernye: readonly string[];
  /** Подсказка к верной формуле. */
  kommentariy: string;
}): ReturnType<Prototip['solve']> {
  const { d } = o;
  const z1 = o.znachenie(d.r1, d.x1);
  const z2 = o.znachenie(d.r2, d.x2);
  const [chis, znam] = o.mnozhitel;
  const kTex = znam === 1 ? (chis === 1 ? '' : String(chis)) : `\\frac{${chis}}{${znam}}`;
  const velichina = (z: number) =>
    `${chis === 1 && znam === 1 ? String(z) : drob(z * chis, znam)}\\pi`;
  const [verh, niz] = d.bolshe === 1 ? [z1, z2] : [z2, z1];
  const otvet = t(verh, niz);
  const [iV, iN] = d.bolshe === 1 ? ['1', '2'] : ['2', '1'];
  const o1 = o.oshibka(d.r1, d.x1);
  const o2 = o.oshibka(d.r2, d.x2);
  const oshibki = [o1, o2] as const;
  return {
    otvet: blank(otvet),
    etapy: [
      {
        title: `${o.chto[0]?.toUpperCase() ?? ''}${o.chto.slice(1)} каждого тела`,
        lines: [
          `$${o.bukva} = ${o.formula}$.`,
          `$${o.bukva}_1 = ${kTex}\\pi\\cdot ${o.podstanovka(d.r1, d.x1)} = ${velichina(z1)}$.`,
          `$${o.bukva}_2 = ${kTex}\\pi\\cdot ${o.podstanovka(d.r2, d.x2)} = ${velichina(z2)}$.`,
        ],
      },
      {
        title: 'Отношение',
        lines: [
          `Спрашивают, во сколько раз ${o.chto} ${PERVOE[Number(iV) - 1]} ${o.telo} больше, чем ${PERVOE[Number(iN) - 1]}: делим $${o.bukva}_${iV}$ на $${o.bukva}_${iN}$. Множитель ${kTex === '' ? '$\\pi$' : `$${kTex}\\pi$`} сокращается.`,
          `$\\frac{${o.bukva}_${iV}}{${o.bukva}_${iN}} = \\frac{${velichina(verh)}}{${velichina(niz)}} = \\frac{${znam === 1 ? verh * chis : verh}}{${znam === 1 ? niz * chis : niz}} = ${otvet}$.`,
          `Ответ: $${otvet}$.`,
        ],
      },
    ],
    hints: [
      vopros(
        `По какой формуле считается ${o.chto}?`,
        $(`${o.bukva} = ${o.formula}`),
        o.nevernye.map((f) => $(`${o.bukva} = ${f}`)),
        d.r1 + d.x2,
        o.kommentariy,
      ),
      vopros(
        `Чему равно $${o.bukva}_1$?`,
        $(velichina(z1)),
        [$(velichina(z2)), $(velichina(o.oshibka(d.r1, d.x1)))],
        d.x1,
        `Подставь в формулу числа первого тела: $${d.r1}$ и $${d.x1}$.`,
      ),
      vopros(
        `Чему равно отношение $\\frac{${o.bukva}_${iV}}{${o.bukva}_${iN}}$?`,
        $(otvet),
        [$(drob(niz, verh)), $(drob(...(d.bolshe === 1 ? oshibki : ([o2, o1] as const))))],
        d.r2 + d.x1,
        `Множитель $\\pi$ сокращается: $\\frac{${verh}}{${niz}}$.`,
      ),
    ],
  };
}

function cilindry(o: {
  id: string;
  title: string;
  spisok: readonly FormulirovkaDvuh[];
  chto: 'объём' | 'площадь боковой поверхности';
}): Prototip {
  const obem = o.chto === 'объём';
  return prototip({
    id: o.id,
    gruppa: 'E',
    title: o.title,
    text(p) {
      const f = formulirovka(o.spisok, p);
      const [b, m] = f.bolshe === 1 ? ['первого', 'второго'] : ['второго', 'первого'];
      const vopr = obem
        ? `объём ${b} цилиндра больше объёма ${m}`
        : `площадь боковой поверхности ${b} цилиндра больше площади боковой поверхности ${m}`;
      return `Даны два цилиндра. Радиус основания и высота ${f.pervogo} равны соответственно ${num(p, 'r1')} и ${num(p, 'h1')}, а второго — ${num(p, 'r2')} и ${num(p, 'h2')}. Во сколько раз ${vopr}?`;
    },
    solve(p) {
      const d = dva(p, 'h', formulirovka(o.spisok, p).bolshe);
      return obem
        ? otnoshenie({
            d,
            telo: 'цилиндра',
            formula: '\\pi r^2 h',
            chto: 'объём',
            bukva: 'V',
            mnozhitel: [1, 1],
            znachenie: (r, h) => r * r * h,
            podstanovka: (r, h) => `${r}^2\\cdot ${h}`,
            oshibka: (r, h) => r * h,
            nevernye: ['2\\pi r h', '\\frac{1}{3}\\pi r^2 h'],
            kommentariy: 'Объём цилиндра — площадь основания $\\pi r^2$ на высоту.',
          })
        : otnoshenie({
            d,
            telo: 'цилиндра',
            formula: '2\\pi r h',
            chto: 'площадь боковой поверхности',
            bukva: 'S',
            mnozhitel: [2, 1],
            znachenie: (r, h) => r * h,
            podstanovka: (r, h) => `${r}\\cdot ${h}`,
            oshibka: (r, h) => r * r * h,
            nevernye: ['\\pi r^2 h', '\\pi r h'],
            kommentariy:
              'Боковая поверхность цилиндра — прямоугольник: длина окружности $2\\pi r$ на высоту.',
          });
    },
    proverka(p) {
      const d = dva(p, 'h', formulirovka(o.spisok, p).bolshe);
      const vel = (r: number, h: number) => (obem ? Math.PI * r * r * h : 2 * Math.PI * r * h);
      const v1 = vel(d.r1, d.x1);
      const v2 = vel(d.r2, d.x2);
      return izmereno(d.bolshe === 1 ? v1 / v2 : v2 / v1);
    },
    model: (p) => risDvaCilindra(num(p, 'r1'), num(p, 'h1'), num(p, 'r2'), num(p, 'h2')),
  });
}

const P14 = cilindry({
  id: 'P14',
  title: 'Два цилиндра: во сколько раз больше объём',
  spisok: CIL_OBEM,
  chto: 'объём',
});
const P15 = cilindry({
  id: 'P15',
  title: 'Два цилиндра: во сколько раз больше боковая поверхность',
  spisok: CIL_BOK,
  chto: 'площадь боковой поверхности',
});

/* ── P16. Сечение цилиндра, параллельное оси ──────────────────── */

const P16 = prototip({
  id: 'P16',
  gruppa: 'E',
  title: 'Сечение цилиндра, параллельное оси',
  text: (p) =>
    `Радиус основания цилиндра равен ${num(p, 'r')}, а его образующая равна ${num(p, 'h')}. Сечение, параллельное оси цилиндра, удалено от неё на расстояние, равное ${num(p, 'd')}. Найдите площадь этого сечения.`,
  solve(p) {
    const r = num(p, 'r');
    const h = num(p, 'h');
    const d = num(p, 'd');
    const pol = tselyyKoren(r * r - d * d);
    const otvet = 2 * pol * h;
    return {
      otvet: String(otvet),
      etapy: [
        {
          title: 'Что за сечение',
          lines: [
            'Сечение, параллельное оси, — прямоугольник. Одна его сторона — образующая $h$, другая — хорда основания.',
          ],
        },
        {
          title: 'Половина хорды',
          lines: [
            'Перпендикуляр из центра основания к хорде делит её пополам; радиус к концу хорды — гипотенуза.',
            `$\\frac{a}{2} = \\sqrt{r^2 - d^2} = \\sqrt{${r}^2 - ${d}^2} = \\sqrt{${r * r - d * d}} = ${pol}$, хорда $a = ${2 * pol}$.`,
          ],
        },
        {
          title: 'Площадь сечения',
          lines: [`$S = a\\cdot h = ${2 * pol}\\cdot ${h} = ${otvet}$.`, `Ответ: $${otvet}$.`],
        },
      ],
      hints: [
        vopros(
          'Какая фигура получается в сечении?',
          'Прямоугольник',
          ['Круг', 'Трапеция'],
          r,
          'Плоскость параллельна оси: она режет основания по хордам, а боковую поверхность — по образующим.',
        ),
        vopros(
          'Чему равна хорда основания — сторона сечения?',
          $(String(2 * pol)),
          [$(String(pol)), $(String(2 * r))],
          d + h,
          `Половина хорды — катет: $\\sqrt{${r}^2 - ${d}^2}$.`,
        ),
      ],
    };
  },
  proverka(p) {
    const r = num(p, 'r');
    const d = num(p, 'd');
    return String(2 * korenPereborom(r * r - d * d) * num(p, 'h'));
  },
  model: (p) => risCilindrSechenie(num(p, 'r'), num(p, 'h'), num(p, 'd')),
});

/* ── P17, P18. Конус: радиус или высота по объёму ─────────────── */

const P17 = prototip({
  id: 'P17',
  gruppa: 'F',
  title: 'Радиус основания конуса по объёму',
  text: (p) =>
    `Объём конуса равен $${num(p, 'v')}\\pi$, а его высота равна ${num(p, 'h')}. Найдите радиус основания конуса.`,
  solve(p) {
    const v = num(p, 'v');
    const h = num(p, 'h');
    const r2 = (3 * v) / h;
    const r = tselyyKoren(r2);
    return {
      otvet: String(r),
      etapy: [
        {
          title: 'Формула объёма',
          lines: [
            '$V = \\frac{1}{3}\\pi r^2 h$.',
            `$\\frac{1}{3}\\pi r^2\\cdot ${h} = ${v}\\pi$. Делим на $\\pi$ и умножаем на $3$: $r^2\\cdot ${h} = ${3 * v}$.`,
          ],
        },
        {
          title: 'Радиус',
          lines: [`$r^2 = ${3 * v} : ${h} = ${r2}$, $r = ${r}$.`, `Ответ: $${r}$.`],
        },
      ],
      hints: [
        vopros(
          'По какой формуле считается объём конуса?',
          '$V = \\frac{1}{3}\\pi r^2 h$',
          ['$V = \\pi r^2 h$', '$V = \\pi r l$'],
          v,
          'Конус — «пирамида» с круглым основанием: треть площади основания на высоту.',
        ),
        vopros(
          'Чему равен $r^2$?',
          $(String(r2)),
          [$(drob(v, h)), $(String(r))],
          h,
          'Не забудь умножить объём на $3$.',
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const h = num(p, 'h');
    for (let r = 1; r <= 1000; r += 1) if (r * r * h === 3 * v) return String(r);
    throw new Error('радиус не найден');
  },
  model: (p) => risKonus(Math.sqrt((3 * num(p, 'v')) / num(p, 'h')), num(p, 'h')),
});

const P18 = prototip({
  id: 'P18',
  gruppa: 'F',
  title: 'Высота конуса по объёму',
  text: (p) =>
    `Объём конуса равен $${num(p, 'v')}\\pi$, а радиус его основания равен ${num(p, 'r')}. Найдите высоту конуса.`,
  solve(p) {
    const v = num(p, 'v');
    const r = num(p, 'r');
    const otvet = t(3 * v, r * r);
    return {
      otvet: blank(otvet),
      etapy: [
        {
          title: 'Формула объёма',
          lines: [
            '$V = \\frac{1}{3}\\pi r^2 h$.',
            `$\\frac{1}{3}\\pi\\cdot ${r}^2\\cdot h = ${v}\\pi$, то есть $\\frac{${r * r}}{3}h = ${v}$.`,
          ],
        },
        {
          title: 'Высота',
          lines: [
            `$h = \\frac{3\\cdot ${v}}{${r * r}} = \\frac{${3 * v}}{${r * r}} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'По какой формуле считается объём конуса?',
          '$V = \\frac{1}{3}\\pi r^2 h$',
          ['$V = \\pi r^2 h$', '$V = \\frac{1}{3}\\pi r h$'],
          v,
        ),
        vopros(
          'Как выразить высоту?',
          '$h = \\frac{3V}{\\pi r^2}$',
          ['$h = \\frac{V}{\\pi r^2}$', '$h = \\frac{3V}{\\pi r}$'],
          r,
          'Умножь обе части на $3$ и раздели на $\\pi r^2$.',
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const r = num(p, 'r');
    for (let h100 = 1; h100 <= 1000000; h100 += 1) {
      if (r * r * h100 === 300 * v) return zapis(h100, 100);
    }
    throw new Error('высота не найдена');
  },
  model: (p) => risKonus(num(p, 'r'), (3 * num(p, 'v')) / num(p, 'r') ** 2),
});

/* ── P19, P20. Два конуса ─────────────────────────────────────── */

function konusy(o: { id: string; title: string; obem: boolean }): Prototip {
  /* f = 0: больше второй (объём) или первый (боковая поверхность). */
  const bolshe = (p: Params): 1 | 2 => {
    const f = num(p, 'f');
    return o.obem ? (f === 0 ? 2 : 1) : f === 0 ? 1 : 2;
  };
  const x = o.obem ? 'h' : 'l';
  return prototip({
    id: o.id,
    gruppa: 'F',
    title: o.title,
    text(p) {
      const [b, m] = bolshe(p) === 1 ? ['первого', 'второго'] : ['второго', 'первого'];
      const chto = o.obem ? 'высота' : 'образующая';
      const vopr = o.obem
        ? `объём ${b} конуса больше объёма ${m}`
        : `площадь боковой поверхности ${b} конуса больше площади боковой поверхности ${m}`;
      return `Даны два конуса. Радиус основания и ${chto} первого конуса равны соответственно ${num(p, 'r1')} и ${num(p, `${x}1`)}, а второго — ${num(p, 'r2')} и ${num(p, `${x}2`)}. Во сколько раз ${vopr}?`;
    },
    solve(p) {
      const d = dva(p, x, bolshe(p));
      return o.obem
        ? otnoshenie({
            d,
            telo: 'конуса',
            formula: '\\frac{1}{3}\\pi r^2 h',
            chto: 'объём',
            bukva: 'V',
            mnozhitel: [1, 3],
            znachenie: (r, h) => r * r * h,
            podstanovka: (r, h) => `${r}^2\\cdot ${h}`,
            oshibka: (r, h) => r * h,
            nevernye: ['\\pi r^2 h', '\\pi r h'],
            kommentariy: 'Объём конуса — треть площади основания на высоту.',
          })
        : otnoshenie({
            d,
            telo: 'конуса',
            formula: '\\pi r l',
            chto: 'площадь боковой поверхности',
            bukva: 'S',
            mnozhitel: [1, 1],
            znachenie: (r, l) => r * l,
            podstanovka: (r, l) => `${r}\\cdot ${l}`,
            oshibka: (r, l) => r * r * l,
            nevernye: ['2\\pi r l', '\\pi r^2 l'],
            kommentariy: 'Боковая поверхность конуса: $\\pi$, радиус основания и образующая.',
          });
    },
    proverka(p) {
      const d = dva(p, x, bolshe(p));
      /* Объём — числом с π; боковая поверхность — площадью развёртки:
         сектор радиуса l с дугой 2πr, площадь ½·l·дуга. */
      const vel = (r: number, y: number) =>
        o.obem ? (Math.PI * r * r * y) / 3 : 0.5 * y * (2 * Math.PI * r);
      const v1 = vel(d.r1, d.x1);
      const v2 = vel(d.r2, d.x2);
      return izmereno(d.bolshe === 1 ? v1 / v2 : v2 / v1);
    },
    model: (p) =>
      risDvaKonusa(num(p, 'r1'), num(p, `${x}1`), num(p, 'r2'), num(p, `${x}2`), !o.obem),
  });
}

const P19 = konusy({ id: 'P19', title: 'Два конуса: во сколько раз больше объём', obem: true });
const P20 = konusy({
  id: 'P20',
  title: 'Два конуса: во сколько раз больше боковая поверхность',
  obem: false,
});

/* ── P21, P22. Конус, отсечённый плоскостью ───────────────────── */

const SECHENIE = (p: Params) =>
  `Через точку, делящую высоту конуса в отношении ${num(p, 'p')}:${num(p, 'q')}, считая от вершины, проведена плоскость, параллельная основанию.`;

/** Разбор подобия: коэффициент и куб коэффициента. */
function podobie(p: Params): { k: string; kub: number; vsego: number; chast: number } {
  const chast = num(p, 'p');
  const vsego = chast + num(p, 'q');
  return {
    k: `\\frac{${chast}}{${vsego}}`,
    kub: (vsego / chast) ** 3,
    vsego,
    chast,
  };
}

function shagPodobiya(p: Params): string[] {
  const { k, vsego, chast } = podobie(p);
  return [
    `Высота делится в отношении $${chast}:${num(p, 'q')}$ от вершины, значит, высота маленького конуса — $${chast}$ части из $${vsego}$, то есть $${k}$ высоты данного.`,
    `Плоскость параллельна основанию, поэтому отсечённый конус подобен данному с коэффициентом $k = ${k}$.`,
    'Объёмы подобных тел относятся как куб коэффициента подобия.',
  ];
}

const P21 = prototip({
  id: 'P21',
  gruppa: 'F',
  title: 'Объём отсечённого конуса',
  text: (p) =>
    `Объём конуса равен ${num(p, 'v')}. ${SECHENIE(p)} Найдите объём конуса, отсекаемого от данного конуса проведённой плоскостью.`,
  solve(p) {
    const v = num(p, 'v');
    const { k, kub } = podobie(p);
    const otvet = t(v, kub);
    return {
      otvet: blank(otvet),
      etapy: [
        { title: 'Подобие', lines: shagPodobiya(p) },
        {
          title: 'Объём отсечённого конуса',
          lines: [
            `$\\left(${k}\\right)^3 = \\frac{1}{${kub}}$.`,
            `$V_{\\text{отс}} = ${v}\\cdot\\frac{1}{${kub}} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен коэффициент подобия отсечённого конуса и данного?',
          $(k),
          [
            $(`\\frac{${num(p, 'p')}}{${num(p, 'q')}}`),
            $(`\\frac{${num(p, 'q')}}{${podobie(p).vsego}}`),
          ],
          v,
          'Сравни высоту маленького конуса со всей высотой, а не с оставшейся частью.',
        ),
        vopros(
          'Во сколько раз объём отсечённого конуса меньше данного?',
          $(String(kub)),
          [$(String(podobie(p).vsego)), $(String(podobie(p).vsego ** 2))],
          v + 1,
          'Объёмы подобных тел относятся как куб коэффициента подобия.',
        ),
      ],
    };
  },
  proverka(p) {
    /* Данный конус минус усечённый: V_ус = πh/3·(R² + Rr + r²) при R = 1, H = 1. */
    const kk = num(p, 'p') / (num(p, 'p') + num(p, 'q'));
    const celyy = Math.PI / 3;
    const usech = ((Math.PI * (1 - kk)) / 3) * (1 + kk + kk * kk);
    return izmereno((num(p, 'v') * (celyy - usech)) / celyy);
  },
  model: (p) => risKonusSechenie(num(p, 'p'), num(p, 'q')),
});

const P22 = prototip({
  id: 'P22',
  gruppa: 'F',
  title: 'Объём конуса по отсечённой части',
  text: (p) =>
    `${SECHENIE(p)} Найдите объём этого конуса, если объём конуса, отсекаемого от данного конуса проведённой плоскостью, равен ${num(p, 'v')}.`,
  solve(p) {
    const v = num(p, 'v');
    const { k, kub } = podobie(p);
    const otvet = v * kub;
    return {
      otvet: String(otvet),
      etapy: [
        { title: 'Подобие', lines: shagPodobiya(p) },
        {
          title: 'Объём данного конуса',
          lines: [
            `$\\left(${k}\\right)^3 = \\frac{1}{${kub}}$: отсечённый конус в $${kub}$ раз меньше данного.`,
            `$V = ${v}\\cdot ${kub} = ${otvet}$.`,
            `Ответ: $${otvet}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен коэффициент подобия отсечённого конуса и данного?',
          $(k),
          [
            $(`\\frac{${num(p, 'p')}}{${num(p, 'q')}}`),
            $(`\\frac{${num(p, 'q')}}{${podobie(p).vsego}}`),
          ],
          v,
          'Сравни высоту маленького конуса со всей высотой.',
        ),
        vopros(
          'Во сколько раз объём данного конуса больше отсечённого?',
          $(String(kub)),
          [$(String(podobie(p).vsego)), $(String(podobie(p).vsego ** 2))],
          v + 2,
          'Объёмы подобных тел относятся как куб коэффициента подобия.',
        ),
      ],
    };
  },
  proverka(p) {
    const kk = num(p, 'p') / (num(p, 'p') + num(p, 'q'));
    const usech = ((Math.PI * (1 - kk)) / 3) * (1 + kk + kk * kk);
    const otsech = Math.PI / 3 - usech;
    return izmereno((num(p, 'v') * (Math.PI / 3)) / otsech);
  },
  model: (p) => risKonusSechenie(num(p, 'p'), num(p, 'q')),
});

/* ── P23, P24. Два шара ───────────────────────────────────────── */

function shary(o: { id: string; title: string; obem: boolean }): Prototip {
  const step = o.obem ? 3 : 2;
  return prototip({
    id: o.id,
    gruppa: 'G',
    title: o.title,
    text: (p) =>
      `Даны два шара с радиусами ${num(p, 'r1')} и ${num(p, 'r2')}. Во сколько раз ${
        o.obem
          ? 'объём большего шара больше объёма меньшего'
          : 'площадь поверхности большего шара больше площади поверхности меньшего'
      }?`,
    solve(p) {
      const R = Math.max(num(p, 'r1'), num(p, 'r2'));
      const r = Math.min(num(p, 'r1'), num(p, 'r2'));
      const k = t(R, r);
      const otvet = t(R ** step, r ** step);
      const formula = o.obem ? 'V = \\frac{4}{3}\\pi R^3' : 'S = 4\\pi R^2';
      const chto = o.obem ? 'Объёмы' : 'Площади поверхностей';
      return {
        otvet: blank(otvet),
        etapy: [
          {
            title: 'Отношение радиусов',
            lines: [`Больший радиус $${R}$, меньший $${r}$: $\\frac{${R}}{${r}} = ${k}$.`],
          },
          {
            title: o.obem ? 'Объёмы — как кубы радиусов' : 'Площади — как квадраты радиусов',
            lines: [
              `$${formula}$: множитель ${o.obem ? '$\\frac{4}{3}\\pi$' : '$4\\pi$'} у обоих шаров одинаковый и сокращается.`,
              `${chto} относятся как ${o.obem ? 'кубы' : 'квадраты'} радиусов: $${k}^${step} = ${otvet}$.`,
              `Ответ: $${otvet}$.`,
            ],
          },
        ],
        hints: [
          vopros(
            o.obem
              ? 'По какой формуле считается объём шара?'
              : 'По какой формуле считается площадь сферы?',
            $(formula),
            o.obem
              ? ['$V = 4\\pi R^2$', '$V = \\frac{4}{3}\\pi R^2$']
              : ['$S = \\pi R^2$', '$S = \\frac{4}{3}\\pi R^3$'],
            R + r,
          ),
          vopros(
            `Во сколько раз ${o.obem ? 'объём' : 'площадь поверхности'} больше, если радиус больше в $${k}$ раз?`,
            $(otvet),
            [$(k), $(drob(R ** (5 - step), r ** (5 - step)))],
            R,
            o.obem ? 'Радиус входит в объём в кубе.' : 'Радиус входит в площадь в квадрате.',
          ),
        ],
      };
    },
    proverka(p) {
      const vel = (r: number) => (o.obem ? (4 / 3) * Math.PI * r ** 3 : 4 * Math.PI * r * r);
      const a = vel(num(p, 'r1'));
      const b = vel(num(p, 'r2'));
      return izmereno(Math.max(a, b) / Math.min(a, b));
    },
    model: (p) => risDvaShara(num(p, 'r1'), num(p, 'r2')),
  });
}

const P23 = shary({ id: 'P23', title: 'Два шара: во сколько раз больше объём', obem: true });
const P24 = shary({
  id: 'P24',
  title: 'Два шара: во сколько раз больше площадь поверхности',
  obem: false,
});

export const PROTOTIPY_13_3: Prototip[] = [P14, P15, P16, P17, P18, P19, P20, P21, P22, P23, P24];
