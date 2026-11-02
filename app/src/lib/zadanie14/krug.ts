/**
 * Тригонометрическая окружность задания №14 — геометрия.
 *
 * Здесь только расчёт в координатах viewBox: окружность, оси, точки,
 * сечения $\sin x=a$ и $\cos x=a$, дуга промежутка со стрелкой обхода,
 * оси тангенсов и котангенсов и подписи с их рамками. Рисует
 * lib/zadanie14/krugHtml.ts: линии — SVG, подписи — KaTeX поверх.
 *
 * Правила подписей (общие для рисунков сайта):
 * — подпись точки стоит снаружи окружности, по лучу точки, и не
 *   касается линии окружности;
 * — подписи не перекрывают друг друга и подписи осей: тесная подпись
 *   отодвигается дальше по лучу или чуть вбок;
 * — viewBox растягивается под подписи, поэтому ничего не обрезается.
 * Это проверяет scripts/check-zadanie14.mjs (рамки не пересекаются,
 * не заходят на окружность).
 */

import { ugolTex, znach, type Ugol } from './ugol';

export const R = 100;
/** Кегль подписи в единицах viewBox; на экране — та же доля ширины. */
export const KEGL = 15;
const ZAZOR = 7;

export interface TochkaKruga {
  ugol: Ugol;
  /** Подпись TeX; не задана — сам угол; '' — без подписи. */
  tex?: string;
  /** Ключевая точка — цветом акцента и крупнее. */
  akcent?: boolean;
  /** Выколотая: конец промежутка, который не входит. */
  vykolota?: boolean;
  /** Радиус-луч от центра до точки. */
  luch?: boolean;
  /** Пунктирные проекции на оси. */
  proekcii?: boolean;
}

export interface DugaKruga {
  ot: Ugol;
  do: Ugol;
  vkl: [boolean, boolean];
  /** Подписать концы (по умолчанию — да). */
  podpisi?: boolean;
  /** Стрелка обхода в середине дуги (по умолчанию — да). */
  strelka?: boolean;
}

export interface KrugSpec {
  /** Пустая окружность для листа ученика: только окружность и оси. */
  pustoy?: boolean;
  /** Подписи осей sin и cos (по умолчанию — да). */
  podpisiOsey?: boolean;
  osTg?: boolean;
  osCtg?: boolean;
  tochki?: TochkaKruga[];
  /** Прямая $\sin x=a$: горизонталь на высоте a; tex — подпись a на оси синусов. */
  sechenieSin?: { a: number; tex: string };
  /** Прямая $\cos x=a$: вертикаль; tex — подпись a на оси косинусов. */
  sechenieCos?: { a: number; tex: string };
  /** Значение на оси тангенсов (точка и подпись). */
  tgZnach?: { a: number; tex: string };
  ctgZnach?: { a: number; tex: string };
  duga?: DugaKruga;
  /** Засечки деления окружности на n равных частей (4, 8, 12). */
  delenie?: number;
  /** Описание для экранного диктора. */
  opisanie?: string;
}

export interface Ramka {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PodpisKruga {
  tex: string;
  vid: 'tochka' | 'os' | 'konec' | 'znach';
  akcent?: boolean;
  /** Центр рамки. */
  x: number;
  y: number;
  ramka: Ramka;
}

export interface GeomKruga {
  vb: { x: number; y: number; w: number; h: number };
  pustoy: boolean;
  osi: { x1: number; x2: number; y1: number; y2: number };
  osTg?: { x: number; y1: number; y2: number };
  osCtg?: { y: number; x1: number; x2: number };
  linii: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    vid: 'sechenie' | 'proekciya' | 'luch' | 'tg';
  }[];
  /** Дуга промежутка: path, стрелка, концы. */
  duga?: { d: string; strelka: string };
  zasechki: { x1: number; y1: number; x2: number; y2: number }[];
  tochki: { x: number; y: number; akcent: boolean; vykolota: boolean; znach?: boolean }[];
  podpisi: PodpisKruga[];
  opisanie: string;
}

/** Экранные координаты точки окружности радиуса r (ось y вниз). */
function naKruge(theta: number, r = R): { x: number; y: number } {
  return { x: r * Math.cos(theta), y: -r * Math.sin(theta) };
}

/** Грубый размер подписи KaTeX в единицах viewBox: ширина и высота. */
export function razmerTex(tex: string, kegl = KEGL): { w: number; h: number } {
  /* Минус перед дробью KaTeX набирает с отступами — шире буквы. */
  const minus = tex.trim().startsWith('-') ? 0.5 * kegl : 0;
  const em = kegl;
  const prostoy = (t: string) =>
    t
      .replace(/\\operatorname\{([a-z]+)\}/g, '$1')
      .replace(/\\boldsymbol\{([^{}]*)\}/g, '$1')
      .replace(/\\(pi|alpha|varphi|varnothing)/g, 'p')
      .replace(/\\sqrt\{([^{}]*)\}/g, 'V$1')
      .replace(/\\[a-zA-Z]+|[{}\s]/g, '').length;
  const fr = /\\[dt]?frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}/.exec(tex);
  if (fr !== null) {
    const ost = tex.replace(fr[0], '');
    const w =
      Math.max(prostoy(fr[1] as string), prostoy(fr[2] as string)) * 0.6 + prostoy(ost) * 0.62;
    return { w: (w + 0.5) * em + minus, h: 2.5 * em };
  }
  return { w: (prostoy(tex) * 0.62 + 0.4) * em + minus, h: 1.35 * em };
}

function ramkaVokrug(x: number, y: number, w: number, h: number): Ramka {
  return { x1: x - w / 2, y1: y - h / 2, x2: x + w / 2, y2: y + h / 2 };
}

export function peresekayutsya(a: Ramka, b: Ramka, zapas = 2): boolean {
  return a.x1 < b.x2 + zapas && b.x1 < a.x2 + zapas && a.y1 < b.y2 + zapas && b.y1 < a.y2 + zapas;
}

/** Ближайшее расстояние от центра окружности до рамки и дальнее — для проверки «не на линии». */
export function rasstoyaniyaRamki(r: Ramka): { min: number; max: number } {
  const cx = Math.max(r.x1, Math.min(0, r.x2));
  const cy = Math.max(r.y1, Math.min(0, r.y2));
  const min = Math.hypot(cx, cy);
  const max = Math.max(
    Math.hypot(r.x1, r.y1),
    Math.hypot(r.x1, r.y2),
    Math.hypot(r.x2, r.y1),
    Math.hypot(r.x2, r.y2),
  );
  return { min, max };
}

/** Рамка пересекает окружность (линию), если окружность проходит между ближней и дальней точкой. */
export function naLiniiKruga(r: Ramka, zapas = 2): boolean {
  const { min, max } = rasstoyaniyaRamki(r);
  return min < R + zapas && max > R - zapas;
}

/**
 * Подпись по лучу θ снаружи окружности: рамка касается окружности с
 * зазором; если место занято — шаг дальше по лучу или вбок.
 */
function postavit(
  tex: string,
  theta: number,
  zanyato: Ramka[],
  vid: PodpisKruga['vid'],
  akcent: boolean,
  start = R + ZAZOR,
): PodpisKruga {
  const { w, h } = razmerTex(tex);
  const c = Math.cos(theta);
  const sn = Math.sin(theta);
  /* Расстояние до центра рамки, при котором ближний угол рамки — на радиусе start. */
  const baza = start + Math.abs(c) * (w / 2) + Math.abs(sn) * (h / 2);
  const popytki: [number, number][] = [];
  for (let shag = 0; shag < 14; shag += 1) {
    for (const bok of [0, 1, -1, 2, -2, 3, -3]) popytki.push([shag * 5, bok * 0.09]);
  }
  for (const [dal, bok] of popytki) {
    const t = theta + bok;
    const cc = Math.cos(t);
    const ss = Math.sin(t);
    const dist = start + dal + Math.abs(cc) * (w / 2) + Math.abs(ss) * (h / 2);
    const x = dist * cc;
    const y = -dist * ss;
    const ramka = ramkaVokrug(x, y, w, h);
    if (naLiniiKruga(ramka, 3)) continue;
    if (zanyato.some((z) => peresekayutsya(z, ramka))) continue;
    zanyato.push(ramka);
    return { tex, vid, akcent, x, y, ramka };
  }
  const x = baza * c;
  const y = -baza * sn;
  const ramka = ramkaVokrug(x, y, w, h);
  zanyato.push(ramka);
  return { tex, vid, akcent, x, y, ramka };
}

/** Угол в [0; 2π). */
export function vKruge(x: number): number {
  const t = x % (2 * Math.PI);
  return t < 0 ? t + 2 * Math.PI : t;
}

function svobodno(ramka: Ramka, zanyato: Ramka[]): boolean {
  return !zanyato.some((z) => peresekayutsya(z, ramka));
}

/** Подпись у точки на оси/прямой: пробует места по очереди. */
function postavitRyadom(
  tex: string,
  x0: number,
  y0: number,
  mesta: [number, number][],
  zanyato: Ramka[],
  vid: PodpisKruga['vid'],
): PodpisKruga | null {
  const { w, h } = razmerTex(tex);
  for (const [dx, dy] of mesta) {
    const x = x0 + dx * (w / 2 + 5);
    const y = y0 + dy * (h / 2 + 5);
    const ramka = ramkaVokrug(x, y, w, h);
    if (naLiniiKruga(ramka, 2)) continue;
    if (svobodno(ramka, zanyato)) {
      zanyato.push(ramka);
      return { tex, vid, x, y, ramka };
    }
  }
  return null;
}

export function geomKruga(spec: KrugSpec): GeomKruga {
  const pustoy = spec.pustoy === true;
  const OS = R + 32;
  const zanyato: Ramka[] = [];
  const podpisi: PodpisKruga[] = [];
  const linii: GeomKruga['linii'] = [];
  const tochki: GeomKruga['tochki'] = [];
  const zasechki: GeomKruga['zasechki'] = [];
  const OPIS: string[] = ['Единичная окружность с осями косинусов и синусов'];
  /* Линии — тоже препятствия: подпись не ложится на ось или прямую. */
  const T = 2.5;
  zanyato.push({ x1: -OS, x2: OS, y1: -T, y2: T }, { x1: -T, x2: T, y1: -OS, y2: OS });

  /* Подписи осей: cos справа под осью, sin сверху слева от оси. */
  if (spec.podpisiOsey !== false) {
    const pc = postavitRyadom('\\cos', OS - 10, 18, [[0, 0]], zanyato, 'os');
    const ps = postavitRyadom('\\sin', -20, -OS + 8, [[0, 0]], zanyato, 'os');
    if (pc) podpisi.push(pc);
    if (ps) podpisi.push(ps);
  }
  /* Центр — точка 0 не подписывается: подпись 0 спорила бы с углом 0. */

  let osTg: GeomKruga['osTg'];
  let osCtg: GeomKruga['osCtg'];
  if (!pustoy && spec.osTg) {
    osTg = { x: R, y1: OS, y2: -OS };
    zanyato.push({ x1: R - T, x2: R + T, y1: -OS, y2: OS });
    const p = postavitRyadom('\\operatorname{tg}', R + 22, -OS + 6, [[0, 0]], zanyato, 'os');
    if (p) podpisi.push(p);
    OPIS.push('ось тангенсов — касательная x = 1');
  }
  if (!pustoy && spec.osCtg) {
    osCtg = { y: -R, x1: -OS, x2: OS };
    zanyato.push({ x1: -OS, x2: OS, y1: -R - T, y2: -R + T });
    const p = postavitRyadom('\\operatorname{ctg}', OS - 4, -R - 16, [[0, 0]], zanyato, 'os');
    if (p) podpisi.push(p);
    OPIS.push('ось котангенсов — касательная y = 1');
  }

  if (!pustoy && spec.delenie !== undefined) {
    for (let i = 0; i < spec.delenie; i += 1) {
      const t = (2 * Math.PI * i) / spec.delenie;
      const a = naKruge(t, R - 5);
      const b = naKruge(t, R + 5);
      zasechki.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
  }

  /* Сечения: прямая и подпись значения на оси. */
  if (!pustoy && spec.sechenieSin !== undefined) {
    const y = -spec.sechenieSin.a * R;
    linii.push({ x1: -OS + 8, y1: y, x2: OS - 8, y2: y, vid: 'sechenie' });
    zanyato.push({ x1: -OS, x2: OS, y1: y - T, y2: y + T });
    const p = postavitRyadom(
      spec.sechenieSin.tex,
      0,
      y,
      [
        [-1.15, -1],
        [1.15, -1],
        [-1.15, 1],
        [1.15, 1],
      ],
      zanyato,
      'znach',
    );
    if (p) podpisi.push(p);
    tochki.push({ x: 0, y, akcent: true, vykolota: false, znach: true });
    OPIS.push(`прямая sin x = ${spec.sechenieSin.tex}`);
  }
  if (!pustoy && spec.sechenieCos !== undefined) {
    const x = spec.sechenieCos.a * R;
    linii.push({ x1: x, y1: -OS + 8, x2: x, y2: OS - 8, vid: 'sechenie' });
    zanyato.push({ x1: x - T, x2: x + T, y1: -OS, y2: OS });
    const p = postavitRyadom(
      spec.sechenieCos.tex,
      x,
      0,
      [
        [-1, 1.2],
        [1, 1.2],
        [-1, -1.2],
        [1, -1.2],
      ],
      zanyato,
      'znach',
    );
    if (p) podpisi.push(p);
    tochki.push({ x, y: 0, akcent: true, vykolota: false, znach: true });
    OPIS.push(`прямая cos x = ${spec.sechenieCos.tex}`);
  }
  if (!pustoy && spec.tgZnach !== undefined) {
    const y = -spec.tgZnach.a * R;
    tochki.push({ x: R, y, akcent: true, vykolota: false, znach: true });
    const p = postavitRyadom(
      spec.tgZnach.tex,
      R,
      y,
      [
        [1.25, 0],
        [1.25, -1],
        [1.25, 1],
      ],
      zanyato,
      'znach',
    );
    if (p) podpisi.push(p);
  }
  if (!pustoy && spec.ctgZnach !== undefined) {
    const x = spec.ctgZnach.a * R;
    tochki.push({ x, y: -R, akcent: true, vykolota: false, znach: true });
    const p = postavitRyadom(
      spec.ctgZnach.tex,
      x,
      -R,
      [
        [0, -1.3],
        [1, -1.3],
        [-1, -1.3],
      ],
      zanyato,
      'znach',
    );
    if (p) podpisi.push(p);
  }

  /* Дуга промежутка: от начала против часовой стрелки. */
  let duga: GeomKruga['duga'];
  const konci: { theta: number; tex: string; vkl: boolean }[] = [];
  if (!pustoy && spec.duga !== undefined) {
    const a = znach(spec.duga.ot);
    const b = znach(spec.duga.do);
    const dl = Math.min(b - a, 2 * Math.PI - 1e-6);
    const t1 = vKruge(a);
    const RD = R;
    const p1 = naKruge(t1, RD);
    const p2 = naKruge(t1 + dl, RD);
    const large = dl > Math.PI ? 1 : 0;
    const d = `M${f(p1.x)} ${f(p1.y)}A${RD} ${RD} 0 ${large} 0 ${f(p2.x)} ${f(p2.y)}`;
    /* Стрелка: в середине дуги, по касательной против часовой. */
    const tm = t1 + dl / 2;
    const m = naKruge(tm, RD);
    const tx = -Math.sin(tm);
    const ty = -Math.cos(tm);
    const L = 11;
    const W = 6;
    const nx = Math.cos(tm);
    const ny = -Math.sin(tm);
    const tip = { x: m.x + tx * (L / 2), y: m.y + ty * (L / 2) };
    const base = { x: m.x - tx * (L / 2), y: m.y - ty * (L / 2) };
    const strelka =
      spec.duga.strelka === false
        ? ''
        : `M${f(tip.x)} ${f(tip.y)}L${f(base.x + nx * W)} ${f(base.y + ny * W)}L${f(base.x - nx * W)} ${f(base.y - ny * W)}Z`;
    duga = { d, strelka };
    konci.push(
      { theta: t1, tex: ugolTex(spec.duga.ot), vkl: spec.duga.vkl[0] },
      { theta: t1 + dl, tex: ugolTex(spec.duga.do), vkl: spec.duga.vkl[1] },
    );
    OPIS.push(
      `выделена дуга от ${ugolTex(spec.duga.ot)} до ${ugolTex(spec.duga.do)} против часовой стрелки`,
    );
  }

  /* Точки: сначала ключевые, их подписи ставятся первыми. */
  const vse = (pustoy ? [] : (spec.tochki ?? [])).map((t) => ({
    t,
    theta: znach(t.ugol),
  }));
  const poryadok = [...vse].sort(
    (a, b) => Number(b.t.akcent ?? false) - Number(a.t.akcent ?? false),
  );
  for (const { t, theta } of vse) {
    const p = naKruge(theta);
    if (t.luch) linii.push({ x1: 0, y1: 0, x2: p.x, y2: p.y, vid: 'luch' });
    if (t.proekcii) {
      linii.push({ x1: p.x, y1: p.y, x2: p.x, y2: 0, vid: 'proekciya' });
      linii.push({ x1: p.x, y1: p.y, x2: 0, y2: p.y, vid: 'proekciya' });
    }
    tochki.push({ x: p.x, y: p.y, akcent: t.akcent === true, vykolota: t.vykolota === true });
  }
  /* Концы промежутка: точки (выколотые, если конец не входит). */
  for (const k of konci) {
    const p = naKruge(k.theta);
    const est = tochki.some((tt) => Math.hypot(tt.x - p.x, tt.y - p.y) < 0.5);
    if (!est) tochki.push({ x: p.x, y: p.y, akcent: false, vykolota: !k.vkl });
    else if (!k.vkl) {
      tochki.forEach((tt) => {
        if (Math.hypot(tt.x - p.x, tt.y - p.y) < 0.5) tt.vykolota = true;
      });
    }
  }
  const podpisannye: { theta: number; tex: string }[] = [];
  for (const { t, theta } of poryadok) {
    const tex = t.tex ?? ugolTex(t.ugol);
    if (tex === '') continue;
    const tk = vKruge(theta);
    if (podpisannye.some((pp) => Math.abs(vKruge(pp.theta) - tk) < 1e-6 && pp.tex === tex))
      continue;
    podpisannye.push({ theta, tex });
    podpisi.push(postavit(tex, theta, zanyato, 'tochka', t.akcent === true));
  }
  if (spec.duga?.podpisi !== false) {
    for (const k of konci) {
      if (
        podpisannye.some(
          (pp) => Math.abs(vKruge(pp.theta) - vKruge(k.theta)) < 1e-6 && pp.tex === k.tex,
        )
      )
        continue;
      podpisannye.push({ theta: k.theta, tex: k.tex });
      podpisi.push(postavit(k.tex, k.theta, zanyato, 'konec', false));
    }
  }

  /* viewBox: окружность, оси и все рамки подписей с полем. */
  let x1 = -OS - 14;
  let x2 = OS + 14;
  let y1 = -OS - 14;
  let y2 = OS + 14;
  for (const p of podpisi) {
    x1 = Math.min(x1, p.ramka.x1 - 4);
    x2 = Math.max(x2, p.ramka.x2 + 4);
    y1 = Math.min(y1, p.ramka.y1 - 4);
    y2 = Math.max(y2, p.ramka.y2 + 4);
  }
  return {
    vb: { x: x1, y: y1, w: x2 - x1, h: y2 - y1 },
    pustoy,
    osi: { x1: -OS, x2: OS, y1: OS, y2: -OS },
    ...(osTg === undefined ? {} : { osTg }),
    ...(osCtg === undefined ? {} : { osCtg }),
    linii,
    ...(duga === undefined ? {} : { duga }),
    zasechki,
    tochki,
    podpisi,
    opisanie: spec.opisanie ?? `${OPIS.join(', ')}.`,
  };
}

function f(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

export { f as chislo };
