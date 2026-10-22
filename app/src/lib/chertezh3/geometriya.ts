/**
 * Тело сценария → геометрия: вершины, грани, рёбра, выпуклые части.
 *
 * Сборщики не знают ни о проекции, ни о подписях. Выпуклое тело
 * отдаёт вершины и грани; составное — выпуклые блоки и рёбра своей
 * поверхности, найденные по сетке (см. sostavnoe).
 */

import { type V, centroid } from '@/lib/stereo/vec';
import { type ImennoeRebro, type RisuemoeTelo, izChastey, vypuklyy } from '@/lib/stereo/tela';
import { blok, razmerTochek, teloIzIndeksov } from '@/lib/stereo/telo';
import { type TeloScenariya, type Tochka2, klyuchOtrezka } from './scenariy';

export interface Geometriya {
  /** Вершины в порядке сборщика (у составного тела — пусто). */
  vershiny: V[];
  /** Имена вершин по умолчанию — школьные буквы. */
  imenaPoUmolchaniyu: string[];
  /** Грани индексами (у выпуклого тела). */
  grani: number[][];
  vypukloe: boolean;
  /** Рёбра индексами вершин (у выпуклого тела). */
  rebra: [number, number][];
  /** Рёбра составного тела точками. */
  rebraSostavnogo: ImennoeRebro[];
  /** Блоки составного тела. */
  bloki: { p: V; d: V }[];
  /** Объём (для проверок и тестов). */
  obem: number;
  razmer: number;
  centr: V;
}

const BUKVY = 'ABCDEFGH';

/** Правильный n-угольник со стороной a: сторона AB спереди, обход против часовой. */
export function pravilnyy(n: number, a: number): Tochka2[] {
  const R = a / (2 * Math.sin(Math.PI / n));
  const start = (3 * Math.PI) / 2 - Math.PI / n;
  return Array.from({ length: n }, (_, i) => {
    const t = start + (2 * Math.PI * i) / n;
    return [R * Math.cos(t), R * Math.sin(t)] as const;
  });
}

/** Площадь многоугольника по точкам (обход против часовой — плюс). */
export function ploshchad2(pts: readonly Tochka2[]): number {
  let s = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length] as Tochka2;
    s += p[0] * q[1] - q[0] * p[1];
  });
  return s / 2;
}

function prizma(base: readonly Tochka2[], h: number): Omit<Geometriya, 'razmer' | 'centr'> {
  const n = base.length;
  const vershiny: V[] = [
    ...base.map(([x, y]): V => [x, y, 0]),
    ...base.map(([x, y]): V => [x, y, h]),
  ];
  const grani = [
    Array.from({ length: n }, (_, i) => n - 1 - i),
    Array.from({ length: n }, (_, i) => n + i),
    ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i]),
  ];
  const bukvy = BUKVY.slice(0, n).split('');
  return {
    vershiny,
    imenaPoUmolchaniyu: [...bukvy, ...bukvy.map((b) => `${b}1`)],
    grani,
    vypukloe: true,
    rebra: rebraGraney(grani),
    rebraSostavnogo: [],
    bloki: [],
    obem: Math.abs(ploshchad2(base)) * h,
  };
}

function piramida(
  base: readonly Tochka2[],
  apex: V,
  imyaVershiny = 'S',
): Omit<Geometriya, 'razmer' | 'centr'> {
  const n = base.length;
  const vershiny: V[] = [...base.map(([x, y]): V => [x, y, 0]), apex];
  const grani = [
    Array.from({ length: n }, (_, i) => n - 1 - i),
    ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n]),
  ];
  return {
    vershiny,
    imenaPoUmolchaniyu: [...BUKVY.slice(0, n).split(''), imyaVershiny],
    grani,
    vypukloe: true,
    rebra: rebraGraney(grani),
    rebraSostavnogo: [],
    bloki: [],
    obem: (Math.abs(ploshchad2(base)) * apex[2]) / 3,
  };
}

export function rebraGraney(grani: readonly (readonly number[])[]): [number, number][] {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  for (const g of grani) {
    g.forEach((a, i) => {
      const b = g[(i + 1) % g.length] as number;
      const k = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!seen.has(k)) {
        seen.add(k);
        out.push(a < b ? [a, b] : [b, a]);
      }
    });
  }
  return out;
}

export function geometriya(t: TeloScenariya): Geometriya {
  const g = sobrat(t);
  const pts = g.vypukloe ? g.vershiny : g.bloki.flatMap((b) => uglyBloka(b.p, b.d));
  return { ...g, razmer: razmerTochek(pts), centr: centroid(pts) };
}

function sobrat(t: TeloScenariya): Omit<Geometriya, 'razmer' | 'centr'> {
  switch (t.vid) {
    case 'kub':
      return prizma(pryamougolnik(t.a, t.a), t.a);
    case 'parallelepiped':
      return prizma(pryamougolnik(t.a, t.b), t.c);
    case 'prizma':
      return prizma(pravilnyy(t.n, t.a), t.h);
    case 'pryamaya-prizma':
      return prizma(t.osnovanie, t.h);
    case 'piramida':
      return piramida(pravilnyy(t.n, t.a), [0, 0, t.h]);
    case 'piramida-proizv':
      return piramida(t.osnovanie, t.vershina);
    case 'tetraedr':
      return piramida(pravilnyy(3, t.a), [0, 0, t.a * Math.sqrt(2 / 3)], 'D');
    case 'sostavnoy':
      return sostavnoe(t.bloki);
  }
}

/** Прямоугольник ABCD: A в начале координат, AB по x, AD по y. */
function pryamougolnik(a: number, b: number): Tochka2[] {
  return [
    [0, 0],
    [a, 0],
    [a, b],
    [0, b],
  ];
}

function uglyBloka(p: V, d: V): V[] {
  const out: V[] = [];
  for (const dx of [0, d[0]]) {
    for (const dy of [0, d[1]]) {
      for (const dz of [0, d[2]]) {
        out.push([p[0] + dx, p[1] + dy, p[2] + dz]);
      }
    }
  }
  return out;
}

/* ── Составной многогранник ─────────────────────────────────── */

/**
 * Объединение и вычитание блоков по сетке. Все различные координаты
 * блоков делят пространство на ячейки; блоки по порядку заполняют
 * («+») или освобождают («−») ячейки. Поверхность — грани ячеек между
 * полной и пустой. Ребро сетки рисуется, если вокруг него из четырёх
 * ячеек заполнены одна, три или две по диагонали: в остальных
 * случаях там плоская грань или пустота. Соседние куски одного ребра
 * на одной прямой сливаются.
 */
export function sostavnoe(
  bloki: readonly { op: '+' | '-'; ot: readonly number[]; razmer: readonly number[] }[],
): Omit<Geometriya, 'razmer' | 'centr'> {
  const osi = [0, 1, 2].map((ax) =>
    [
      ...new Set(
        bloki.flatMap((b) => [b.ot[ax] as number, (b.ot[ax] as number) + (b.razmer[ax] as number)]),
      ),
    ].sort((x, y) => x - y),
  ) as [number[], number[], number[]];
  const [nx, ny, nz] = osi.map((o) => o.length - 1) as [number, number, number];
  const polno = new Uint8Array(Math.max(nx * ny * nz, 0));
  const idx = (i: number, j: number, k: number) => (k * ny + j) * nx + i;
  const est = (i: number, j: number, k: number) =>
    i >= 0 && j >= 0 && k >= 0 && i < nx && j < ny && k < nz && polno[idx(i, j, k)] === 1;
  for (const b of bloki) {
    const rng = [0, 1, 2].map((ax) => {
      const o = osi[ax] as number[];
      return [
        o.indexOf(b.ot[ax] as number),
        o.indexOf((b.ot[ax] as number) + (b.razmer[ax] as number)),
      ];
    }) as [number[], number[], number[]];
    for (let k = rng[2][0] as number; k < (rng[2][1] as number); k += 1) {
      for (let j = rng[1][0] as number; j < (rng[1][1] as number); j += 1) {
        for (let i = rng[0][0] as number; i < (rng[0][1] as number); i += 1) {
          polno[idx(i, j, k)] = b.op === '+' ? 1 : 0;
        }
      }
    }
  }

  // Выпуклые части: жадное слияние ячеек в блоки (x, потом y, потом z).
  const zanyato = new Uint8Array(polno.length);
  const chasti: { p: V; d: V }[] = [];
  let obem = 0;
  const svobodno = (i: number, j: number, k: number) => est(i, j, k) && zanyato[idx(i, j, k)] === 0;
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        if (!svobodno(i, j, k)) continue;
        let i1 = i + 1;
        while (svobodno(i1, j, k)) i1 += 1;
        const ryad = (jj: number, kk: number) => {
          for (let ii = i; ii < i1; ii += 1) if (!svobodno(ii, jj, kk)) return false;
          return true;
        };
        let j1 = j + 1;
        while (j1 < ny && ryad(j1, k)) j1 += 1;
        const sloy = (kk: number) => {
          for (let jj = j; jj < j1; jj += 1) if (!ryad(jj, kk)) return false;
          return true;
        };
        let k1 = k + 1;
        while (k1 < nz && sloy(k1)) k1 += 1;
        for (let kk = k; kk < k1; kk += 1)
          for (let jj = j; jj < j1; jj += 1)
            for (let ii = i; ii < i1; ii += 1) zanyato[idx(ii, jj, kk)] = 1;
        const p: V = [osi[0][i] as number, osi[1][j] as number, osi[2][k] as number];
        const q: V = [osi[0][i1] as number, osi[1][j1] as number, osi[2][k1] as number];
        const d: V = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
        chasti.push({ p, d });
        obem += d[0] * d[1] * d[2];
      }
    }
  }

  // Рёбра поверхности.
  const rebra: ImennoeRebro[] = [];
  const ostrye = (c: [boolean, boolean, boolean, boolean]) => {
    // Порядок: (−,−), (+,−), (−,+), (+,+) по двум поперечным осям.
    const n = c.filter(Boolean).length;
    return n === 1 || n === 3 || (n === 2 && c[0] === c[3]);
  };
  for (let ax = 0; ax < 3; ax += 1) {
    const [p1, p2] = [(ax + 1) % 3, (ax + 2) % 3] as [number, number];
    const o = osi[ax] as number[];
    const n1 = (osi[p1] as number[]).length;
    const n2 = (osi[p2] as number[]).length;
    for (let a = 0; a < n1; a += 1) {
      for (let b = 0; b < n2; b += 1) {
        let start: number | null = null;
        const zakryt = (konec: number) => {
          if (start === null) return;
          const A = [0, 0, 0];
          const B = [0, 0, 0];
          A[ax] = o[start] as number;
          B[ax] = o[konec] as number;
          A[p1] = B[p1] = (osi[p1] as number[])[a] as number;
          A[p2] = B[p2] = (osi[p2] as number[])[b] as number;
          rebra.push({ a: A as unknown as V, b: B as unknown as V, id: `e${rebra.length}` });
          start = null;
        };
        for (let s = 0; s < o.length - 1; s += 1) {
          const kl = (d1: number, d2: number) => {
            const c = [0, 0, 0];
            c[ax] = s;
            c[p1] = a + d1;
            c[p2] = b + d2;
            return est(c[0] as number, c[1] as number, c[2] as number);
          };
          const on = ostrye([kl(-1, -1), kl(0, -1), kl(-1, 0), kl(0, 0)]);
          if (on && start === null) start = s;
          if (!on) zakryt(s);
        }
        zakryt(o.length - 1);
      }
    }
  }
  return {
    vershiny: [],
    imenaPoUmolchaniyu: [],
    grani: [],
    vypukloe: false,
    rebra: [],
    rebraSostavnogo: rebra,
    bloki: chasti,
    obem,
  };
}

/** Рисуемое тело ядра по геометрии и именам вершин. */
export function risuemoe(g: Geometriya, imena: readonly (string | null)[]): RisuemoeTelo {
  if (!g.vypukloe) {
    return izChastey(
      g.bloki.map((b) => blok(b.p, b.d)),
      g.rebraSostavnogo,
      g.razmer,
    );
  }
  const telo = teloIzIndeksov(g.vershiny, g.grani);
  const eps = g.razmer * 1e-6;
  const imyaTochki = (p: V) => {
    const i = g.vershiny.findIndex(
      (v) => Math.abs(v[0] - p[0]) + Math.abs(v[1] - p[1]) + Math.abs(v[2] - p[2]) < eps,
    );
    return imena[i] ?? `v${i}`;
  };
  return vypuklyy(telo, (a, b) => klyuchOtrezka(imyaTochki(a), imyaTochki(b)), g.razmer);
}
