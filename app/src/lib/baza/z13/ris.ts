/**
 * База, задание №13 «Стереометрия»: чертежи условий.
 *
 * Чертёж строится движком стереометрии профиля (lib/solid — тот же, что
 * рисует тела задания №3): тело задаётся в пространстве, проекция,
 * видимость рёбер (невидимые — штрихом), знаки прямого угла и раскладка
 * подписей считаются движком. Вид выбирается по метрикам читаемости
 * (chertezhBanka): многогранники с основанием-прямоугольником — в
 * кабинетной проекции, пирамиды и тела вращения — в ортогональной.
 *
 * Размеры тела — по числам задачи (известное ребро, найденная высота),
 * только слишком вытянутые пропорции сжаты до PROPORCIYA : 1, чтобы
 * чертёж читался. Числа на чертеже не пишутся — как в задачнике и в
 * банке №3; подписаны буквы вершин из условия и названные элементы
 * (h, r, l, d — курсивом).
 *
 * narisovat() проверяет результат: SVG разбирается — теги закрыты по
 * порядку, корень один, есть viewBox, — и на нём подписаны все вершины,
 * названные в условии. Ошибка — исключение: такой чертёж не попадёт в
 * банк. Основной цвет линий и подписей — currentColor: рисунок берёт
 * цвет текста страницы.
 */

import { chertezhBanka } from '@/lib/solid';
import { circleSection } from '@/lib/solid/drawings/common';
import {
  box,
  prism,
  pyramid,
  regularPolygon,
  sphereOutlinePoint,
  vertex,
} from '@/lib/solid/figures';
import type { Line, Model, Polyhedron, RightAngle, Section } from '@/lib/solid/model';
import { ortho, viewOf } from '@/lib/solid/project';
import type { Vec3 } from '@/lib/solid/vec';

/** Самое вытянутое отношение размеров тела на чертеже. */
const PROPORCIYA = 2.4;

/* ── Проверка SVG ─────────────────────────────────────────────── */

/**
 * SVG разбирается: каждый открытый тег закрыт в обратном порядке,
 * атрибуты в кавычках, корень — один <svg>, есть viewBox. Возвращает
 * тексты элементов <text> (подписи; индекс в <tspan> — подряд: «A1»).
 */
export function razobratSvg(svg: string): string[] {
  const stek: string[] = [];
  const teksty: string[] = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/g;
  let pos = 0;
  let korney = 0;
  let tekst: string[] | null = null;
  for (let m = re.exec(svg); m !== null; m = re.exec(svg)) {
    if (m.index !== pos) throw new Error(`SVG: не разобран кусок у ${pos}`);
    pos = re.lastIndex;
    const [, zakr, imya, , sam, kusok] = m;
    if (kusok !== undefined) {
      if (stek.length === 0) throw new Error('SVG: текст вне корня');
      if (tekst !== null && stek.includes('text') && !stek.includes('title')) tekst.push(kusok);
      continue;
    }
    if (imya === undefined) continue;
    if (zakr === '/') {
      if (stek.pop() !== imya) throw new Error(`SVG: </${imya}> не по порядку`);
      if (imya === 'text' && tekst !== null) {
        teksty.push(tekst.join(''));
        tekst = null;
      }
      continue;
    }
    if (stek.length === 0) {
      korney += 1;
      if (imya !== 'svg') throw new Error(`SVG: корень <${imya}>`);
    }
    if (sam === '/') continue;
    stek.push(imya);
    if (imya === 'text') tekst = [];
  }
  if (pos !== svg.length) throw new Error('SVG: хвост не разобран');
  if (stek.length !== 0) throw new Error(`SVG: не закрыт <${stek[stek.length - 1] ?? ''}>`);
  if (korney !== 1) throw new Error(`SVG: корней ${korney}`);
  if (!/viewBox="[-\d. ]+"/.test(svg)) throw new Error('SVG: нет viewBox');
  return teksty;
}

/**
 * Вершины, названные в условии: имена точек в формулах $…$ — заглавная
 * латинская буква с индексом или без («A», «B_1» → «B1»). Команды TeX
 * (\sqrt, \pi) не в счёт.
 */
export function vershinyUsloviya(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\$([^$]*)\$/g)) {
    const formula = (m[1] ?? '').replace(/\\[a-zA-Z]+/g, ' ');
    for (const v of formula.matchAll(/([A-Z])(?:_(\d)|_\{(\d+)\})?/g)) {
      out.add(`${v[1] ?? ''}${v[2] ?? v[3] ?? ''}`);
    }
  }
  return [...out];
}

/** Основной цвет движка (рёбра, подписи) — на цвет текста страницы. */
const OSNOVNOY = /#101728/gi;

/**
 * Чертёж модели. vershiny — имена вершин из условия: каждая обязана
 * стоять на чертеже подписью.
 */
export function narisovat(model: Model, vershiny: readonly string[]): string {
  const svg = chertezhBanka(model)
    .replace(OSNOVNOY, 'currentColor')
    .replace('<svg ', '<svg style="max-width:100%;height:auto" ');
  const teksty = razobratSvg(svg);
  for (const v of vershiny) {
    if (!teksty.includes(v)) throw new Error(`чертёж «${model.alt}»: нет подписи ${v}`);
  }
  return svg;
}

/* ── Помощники ───────────────────────────────────────────────── */

/** Размеры для чертежа: самое большое не длиннее PROPORCIYA самых малых. */
export function proporcii(...razmery: number[]): number[] {
  const max = Math.max(...razmery);
  return razmery.map((r) => Math.max(r, max / PROPORCIYA));
}

const bezImen = (p: Polyhedron): Polyhedron => ({ ...p, names: p.vertices.map(() => null) });

const v = (p: Polyhedron, imya: string): Vec3 => vertex(p, imya);

const sered = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];

const raz = (a: Vec3, b: Vec3): Vec3 => [b[0] - a[0], b[1] - a[1], b[2] - a[2]];

/** Знак прямого угла в точке o между направлениями на a и b. */
const pryamoy = (o: Vec3, a: Vec3, b: Vec3): RightAngle => ({ at: o, u: raz(o, a), v: raz(o, b) });

const otrezok = (a: Vec3, b: Vec3, label?: string): Line =>
  label === undefined ? { a, b } : { a, b, label };

/* ── I. Параллелепипед и куб ──────────────────────────────────── */

/** Прямоугольный параллелепипед без букв: рёбра a, b, c. */
export function risParallelepiped(a: number, b: number, c: number): Model {
  const [x, y, z] = proporcii(a, b, c);
  return {
    alt: 'Прямоугольный параллелепипед',
    view: 'cabinet',
    bodies: [bezImen(box(x ?? a, y ?? b, z ?? c))],
  };
}

/**
 * Параллелепипед ABCDA₁B₁C₁D₁ с диагональю боковой грани. AB = ab,
 * AD = ad, AA₁ = h; diagonal — концы диагонали, pryamoy — вершина
 * прямого угла треугольника с этой диагональю и два его соседа.
 */
export function risParallelepipedDiagonal(
  ab: number,
  ad: number,
  h: number,
  diagonal: readonly [string, string],
  ugol: readonly [string, string, string],
): Model {
  const [x, y, z] = proporcii(ab, ad, h);
  const p = box(x ?? ab, y ?? ad, z ?? h);
  return {
    alt: `Прямоугольный параллелепипед ABCDA₁B₁C₁D₁ с диагональю грани ${diagonal.join('')}`,
    view: 'cabinet',
    bodies: [p],
    lines: [otrezok(v(p, diagonal[0]), v(p, diagonal[1]))],
    angles: [pryamoy(v(p, ugol[0]), v(p, ugol[1]), v(p, ugol[2]))],
  };
}

/** Куб ABCDA₁B₁C₁D₁, K и P — середины AB и BC, пирамида B₁BKP. */
export function risKubPiramida(): Model {
  const p = box(4, 4, 4);
  const B = v(p, 'B');
  const B1 = v(p, 'B1');
  const K = sered(v(p, 'A'), B);
  const P = sered(B, v(p, 'C'));
  return {
    alt: 'Куб ABCDA₁B₁C₁D₁ и пирамида B₁BKP, K и P — середины рёбер AB и BC',
    view: 'cabinet',
    bodies: [p],
    marks: [
      { p: K, label: 'K' },
      { p: P, label: 'P' },
    ],
    lines: [otrezok(B1, K), otrezok(B1, P), otrezok(K, P)],
    sections: [{ points: [B1, K, P] }],
  };
}

/* ── II. Призма ───────────────────────────────────────────────── */

/** Прямая призма с прямоугольным треугольником в основании: катеты a, b, высота h. */
export function risPrizmaPryamougolnaya(a: number, b: number, h: number): Model {
  const [x, y, z] = proporcii(a, b, h);
  const base: Vec3[] = [
    [0, 0, 0],
    [x ?? a, 0, 0],
    [0, y ?? b, 0],
  ];
  const p = bezImen(prism(base, [0, 0, z ?? h], ['A', 'B', 'C']));
  const [A, B, C] = base as [Vec3, Vec3, Vec3];
  return {
    alt: 'Прямая призма, в основании — прямоугольный треугольник',
    view: 'cabinet',
    bodies: [p],
    angles: [pryamoy(A, B, C)],
  };
}

/** Правильная треугольная призма ABCA₁B₁C₁: сторона a, высота h. */
export function risPrizmaPravilnaya(a: number, h: number): Model {
  const [x, z] = proporcii(a, h);
  const s = x ?? a;
  const base: Vec3[] = [
    [0, 0, 0],
    [s, 0, 0],
    [s / 2, (s * Math.sqrt(3)) / 2, 0],
  ];
  const p = prism(base, [0, 0, z ?? h], ['A', 'B', 'C']);
  return {
    alt: 'Правильная треугольная призма ABCA₁B₁C₁',
    view: 'cabinet',
    bodies: [p],
  };
}

/* ── III. Пирамида ───────────────────────────────────────────── */

/** Пирамида ABCD: рёбра AB, AC, AD взаимно перпендикулярны. */
export function risPiramidaPryamoyUgol(ab: number, ac: number, ad: number): Model {
  const [x, y, z] = proporcii(ab, ac, ad);
  const A: Vec3 = [0, 0, 0];
  /* AC — вправо, AB — вглубь влево, AD — вверх: все три ребра видны. */
  const C: Vec3 = [y ?? ac, 0, 0];
  const B: Vec3 = [0, x ?? ab, 0];
  const D: Vec3 = [0, 0, z ?? ad];
  const p = pyramid([A, C, B], D, ['A', 'C', 'B'], 'D');
  return {
    alt: 'Треугольная пирамида ABCD, рёбра AB, AC и AD взаимно перпендикулярны',
    bodies: [p],
    angles: [pryamoy(A, B, C), pryamoy(A, B, D), pryamoy(A, C, D)],
  };
}

/** Пирамида SABC: ABC — правильный треугольник, SA перпендикулярно основанию. */
export function risPiramidaSA(a: number, h: number): Model {
  const [x, z] = proporcii(a, h);
  const s = x ?? a;
  const A: Vec3 = [0, 0, 0];
  const B: Vec3 = [s, 0, 0];
  const C: Vec3 = [s / 2, (s * Math.sqrt(3)) / 2, 0];
  const S: Vec3 = [0, 0, z ?? h];
  return {
    alt: 'Пирамида SABC, боковое ребро SA перпендикулярно основанию ABC',
    bodies: [pyramid([A, B, C], S, ['A', 'B', 'C'], 'S')],
    angles: [pryamoy(A, S, B), pryamoy(A, S, C)],
  };
}

/** Пирамида над многоугольником base с вершиной над точкой osn; высота подписана h. */
function piramidaSVysotoy(alt: string, base: Vec3[], osn: Vec3, h: number): Model {
  const S: Vec3 = [osn[0], osn[1], h];
  const p = bezImen(pyramid(base, S));
  return {
    alt,
    bodies: [p],
    lines: [otrezok(S, osn, 'h')],
    angles: [pryamoy(osn, S, base[0] ?? osn)],
  };
}

/** Четырёхугольная пирамида, в основании прямоугольник a × b, высота h. */
export function risPiramidaPryamougolnik(a: number, b: number, h: number): Model {
  const [x, y, z] = proporcii(a, b, h);
  const X = x ?? a;
  const Y = y ?? b;
  const base: Vec3[] = [
    [-X / 2, -Y / 2, 0],
    [X / 2, -Y / 2, 0],
    [X / 2, Y / 2, 0],
    [-X / 2, Y / 2, 0],
  ];
  return piramidaSVysotoy(
    'Четырёхугольная пирамида, в основании прямоугольник, проведена высота',
    base,
    [0, 0, 0],
    z ?? h,
  );
}

/** Правильная n-угольная пирамида: сторона a, высота h (n = 3, 4, 6). */
export function risPiramidaPravilnaya(n: 3 | 4 | 6, a: number, h: number): Model {
  const R = a / (2 * Math.sin(Math.PI / n));
  const [r, z] = proporcii(R, h);
  const base = regularPolygon(n, r ?? R, 0, ortho.polygonStart(n));
  const nazvanie = { 3: 'треугольная', 4: 'четырёхугольная', 6: 'шестиугольная' }[n];
  return piramidaSVysotoy(`Правильная ${nazvanie} пирамида с высотой`, base, [0, 0, 0], z ?? h);
}

/** Правильная n-угольная пирамида с апофемой боковой грани (боковая поверхность). */
export function risPiramidaApofema(n: 3 | 6, a: number, l: number): Model {
  const R = a / (2 * Math.sin(Math.PI / n));
  const h = Math.sqrt(Math.max(l * l - R * R, 0.01));
  const [Rr, z] = proporcii(R, h);
  const k = (Rr ?? R) / R;
  const base = regularPolygon(n, R * k, 0, ortho.polygonStart(n));
  const S: Vec3 = [0, 0, z ?? h];
  const p = bezImen(pyramid(base, S));
  /* Апофема — к середине передней стороны основания (между первыми вершинами). */
  const A = base[0] as Vec3;
  const B = base[1] as Vec3;
  const M = sered(A, B);
  return {
    alt: `Правильная ${n === 3 ? 'треугольная' : 'шестиугольная'} пирамида, проведена апофема боковой грани`,
    bodies: [p],
    lines: [otrezok(S, M)],
    angles: [pryamoy(M, S, B)],
  };
}

/* ── IV–VI. Тела вращения ─────────────────────────────────────── */

/** Два тела рядом: второе — правее первого на сумму радиусов и зазор. */
function ryadom(r1: number, r2: number): number {
  return r1 + r2 + Math.max(r1, r2) * 0.7;
}

/** Масштаб двух тел: оба в одном масштабе, самое малое не меньше 1/PROPORCIYA большого. */
function dvaRazmera(...r: number[]): number[] {
  return proporcii(...r);
}

/** Радиус и высота одного тела вращения: подписи r и h. */
function rh(o: Vec3, r: number, h: number, nomer = ''): Line[] {
  const vid = viewOf('ortho');
  return [
    otrezok(o, vid.circlePoint(o, r, -Math.PI / 2 + 0.35), `r${nomer}`),
    otrezok(o, [o[0], o[1], o[2] + h], `h${nomer}`),
  ];
}

/** Два цилиндра: радиусы и высоты. */
export function risDvaCilindra(r1: number, h1: number, r2: number, h2: number): Model {
  const [a1, b1, a2, b2] = dvaRazmera(r1, h1, r2, h2) as [number, number, number, number];
  const o1: Vec3 = [0, 0, 0];
  const o2: Vec3 = [ryadom(a1, a2), 0, 0];
  return {
    alt: 'Два цилиндра',
    bodies: [
      { kind: 'cylinder', base: o1, r: a1, h: b1 },
      { kind: 'cylinder', base: o2, r: a2, h: b2 },
    ],
    lines: [...rh(o1, a1, b1, '1'), ...rh(o2, a2, b2, '2')],
  };
}

/** Цилиндр с сечением, параллельным оси, на расстоянии d от оси. */
export function risCilindrSechenie(r: number, h: number, d: number): Model {
  const [R, H] = proporcii(r, h) as [number, number];
  const k = R / r;
  const D = d * k;
  const pol = Math.sqrt(R * R - D * D);
  /* Хорда сечения — перед осью, ближе к зрителю: сечение видно почти анфас. */
  const P1: Vec3 = [-pol, -D, 0];
  const P2: Vec3 = [pol, -D, 0];
  const O: Vec3 = [0, 0, 0];
  const M: Vec3 = [0, -D, 0];
  return {
    alt: 'Цилиндр и сечение, параллельное его оси',
    bodies: [{ kind: 'cylinder', base: O, r: R, h: H }],
    sections: [{ points: [P1, P2, [pol, -D, H], [-pol, -D, H]] }],
    lines: [otrezok(O, M, 'd'), otrezok(O, P2, 'r'), otrezok(O, [0, 0, H])],
    angles: [pryamoy(M, O, P2)],
  };
}

/** Конус с радиусом и высотой. */
export function risKonus(r: number, h: number): Model {
  const [R, H] = proporcii(r, h) as [number, number];
  const O: Vec3 = [0, 0, 0];
  return {
    alt: 'Конус, проведены высота и радиус основания',
    bodies: [{ kind: 'cone', base: O, r: R, h: H }],
    lines: rh(O, R, H),
    angles: [pryamoy(O, [0, 0, H], viewOf('ortho').circlePoint(O, R, -Math.PI / 2 + 0.35))],
  };
}

/** Два конуса: радиусы и высоты (или образующие — тогда подпись l). */
export function risDvaKonusa(
  r1: number,
  h1: number,
  r2: number,
  h2: number,
  obrazuyushchie: boolean,
): Model {
  const [a1, b1, a2, b2] = dvaRazmera(r1, h1, r2, h2) as [number, number, number, number];
  const o1: Vec3 = [0, 0, 0];
  const o2: Vec3 = [ryadom(a1, a2), 0, 0];
  const vid = viewOf('ortho');
  const linii = (o: Vec3, r: number, h: number, i: string): Line[] => {
    const kraj = vid.circlePoint(o, r, -Math.PI / 2 + 0.35);
    const S: Vec3 = [o[0], o[1], o[2] + h];
    return obrazuyushchie
      ? [otrezok(o, kraj, `r${i}`), otrezok(S, kraj, `l${i}`)]
      : [otrezok(o, kraj, `r${i}`), otrezok(o, S, `h${i}`)];
  };
  /* С образующей l высота конуса — √(l² − r²). */
  const vys = (r: number, l: number) => (obrazuyushchie ? Math.sqrt(l * l - r * r) : l);
  const H1 = vys(a1, b1);
  const H2 = vys(a2, b2);
  return {
    alt: 'Два конуса',
    bodies: [
      { kind: 'cone', base: o1, r: a1, h: H1 },
      { kind: 'cone', base: o2, r: a2, h: H2 },
    ],
    lines: [...linii(o1, a1, H1, '1'), ...linii(o2, a2, H2, '2')],
  };
}

/** Конус и плоскость, параллельная основанию: часть высоты p : q от вершины. */
export function risKonusSechenie(p: number, q: number): Model {
  const R = 2.5;
  const H = 4.6;
  const t = p / (p + q);
  const O: Vec3 = [0, 0, 0];
  const S: Vec3 = [0, 0, H];
  const c: Vec3 = [0, 0, H * (1 - t)];
  const sechenie: Section = circleSection(c, R * t);
  return {
    alt: 'Конус и сечение плоскостью, параллельной основанию',
    bodies: [{ kind: 'cone', base: O, r: R, h: H }],
    lines: [otrezok(S, O)],
    sections: [sechenie],
    marks: [{ p: c }],
  };
}

/** Два шара с радиусами. */
export function risDvaShara(r1: number, r2: number): Model {
  const [a1, a2] = dvaRazmera(r1, r2) as [number, number];
  const c1: Vec3 = [0, 0, 0];
  const c2: Vec3 = [ryadom(a1, a2), 0, 0];
  return {
    alt: 'Два шара',
    bodies: [
      { kind: 'sphere', center: c1, r: a1 },
      { kind: 'sphere', center: c2, r: a2 },
    ],
    marks: [{ p: c1 }, { p: c2 }],
    lines: [
      otrezok(c1, sphereOutlinePoint(c1, a1, 35), 'R'),
      otrezok(c2, sphereOutlinePoint(c2, a2, 35), 'r'),
    ],
  };
}
