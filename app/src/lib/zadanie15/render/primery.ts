/**
 * Сцены витрины: сечения из тестов ядра (этап 1).
 *
 * Всё строится ядром: точки на рёбрах, плоскость по трём точкам,
 * сечение, а для пятиугольника — и само построение методом следов
 * (продолжения отрезков до пересечения с прямыми рёбер). Здесь ядро
 * только переводится в отрезки и подписи для рисования.
 */

import {
  Construction,
  type ObjId,
  type Polyhedron,
  box,
  cube,
  rat,
  section as coreSection,
  toArray,
} from '../core';
import { type V, dist } from './geom';
import {
  type Metka,
  type Otrezok,
  type Scena,
  scena,
  sechenieIzYadra,
  storonySecheniya,
} from './scena';

export interface Primer {
  id: string;
  /** Подпись на кнопке, TeX в $…$. */
  title: string;
  build: () => Scena;
}

type Tochka = string | [string, string, [number, number], string];

function postroit(
  poly: Polyhedron,
  tochki: Tochka[],
  extra?: (c: Construction, ids: ObjId[]) => { otrezki: [ObjId, ObjId][]; tochki: ObjId[] },
): Scena {
  const c = new Construction(poly);
  const ids = tochki.map((t) => {
    if (typeof t === 'string') {
      return c.vertex(t);
    }
    const r = c.pointOnEdge(t[0], t[1], rat(t[2][0], t[2][1]), t[3]);
    if (!r.ok) throw new Error(r.message);
    return r.value;
  });
  const pl = c.plane3(ids[0] as ObjId, ids[1] as ObjId, ids[2] as ObjId);
  if (!pl.ok) throw new Error(pl.message);
  const plane = c.plane(pl.value).plane;
  const ex = extra?.(c, ids) ?? { otrezki: [], tochki: [] };

  const nazv = (id: ObjId): Metka => {
    const p = c.point(id);
    return { p: toArray(p.p) as V, name: p.name, vid: 'tochka' };
  };
  const svoi = [...ids.filter((id) => c.get(id).origin.op !== 'vertex'), ...ex.tochki];
  const tochkiSceny = [...new Set(svoi)].map(nazv);
  const vspom: Otrezok[] = ex.otrezki.map(([a, b]) => ({
    a: toArray(c.point(a).p) as V,
    b: toArray(c.point(b).p) as V,
    vid: 'vspom',
  }));

  const sc = scena(poly, { tochki: tochkiSceny });
  const s = sechenieIzYadra(poly, coreSection(poly, plane), plane);
  if (s) {
    // Имена вершин сечения, которые совпали с точками построения.
    s.names = s.pts.map(
      (p, i) =>
        s.names[i] ?? tochkiSceny.find((t) => dist(t.p, p) < sc.razmer * 1e-6)?.name ?? null,
    );
  }
  return { ...sc, sechenie: s, otrezki: [...(s ? storonySecheniya(s) : []), ...vspom] };
}

const half: [number, number] = [1, 2];

/** Построение пятиугольника следами: X = MN ∩ C_1B_1, Y = MN ∩ C_1D_1. */
function sledyPyatiugolnika(
  c: Construction,
  ids: ObjId[],
): { otrezki: [ObjId, ObjId][]; tochki: ObjId[] } {
  const [M, N, C] = ids as [ObjId, ObjId, ObjId];
  const mn = c.lineThrough(M, N);
  if (!mn.ok) throw new Error(mn.message);
  const x = c.intersect(mn.value, c.edgeLine('B_1', 'C_1'), 'X');
  const y = c.intersect(mn.value, c.edgeLine('C_1', 'D_1'), 'Y');
  if (!x.ok || !y.ok) throw new Error('след не построен');
  const xc = c.lineThrough(x.value, C);
  const yc = c.lineThrough(y.value, C);
  if (!xc.ok || !yc.ok) throw new Error('след не построен');
  const k = c.intersect(xc.value, c.edgeLine('B', 'B_1'), 'K');
  const l = c.intersect(yc.value, c.edgeLine('D', 'D_1'), 'L');
  if (!k.ok || !l.ok) throw new Error('след не построен');
  const C1 = c.vertex('C_1');
  return {
    otrezki: [
      [x.value, y.value], // прямая MN до пересечения с продолжениями рёбер
      [x.value, C1], // продолжение ребра C_1B_1
      [y.value, C1], // продолжение ребра C_1D_1
      [x.value, C], // след в грани BB_1C_1C
      [y.value, C], // след в грани CC_1D_1D
    ],
    tochki: [x.value, y.value, k.value, l.value],
  };
}

export const PRIMERY: Primer[] = [
  {
    id: 'kub-treugolnik',
    title: 'Куб: $A_1BD$',
    build: () => postroit(cube(6), ['A_1', 'B', 'D']),
  },
  {
    id: 'kub-trapetsiya',
    title: 'Куб: трапеция $BDNM$',
    build: () =>
      postroit(cube(6), ['B', 'D', ['A_1', 'B_1', half, 'M'], ['A_1', 'D_1', half, 'N']]),
  },
  {
    id: 'kub-pyatiugolnik',
    title: 'Куб: пятиугольник',
    build: () =>
      postroit(
        cube(6),
        [['A_1', 'B_1', half, 'M'], ['A_1', 'D_1', half, 'N'], 'C'],
        sledyPyatiugolnika,
      ),
  },
  {
    id: 'kub-shestiugolnik',
    title: 'Куб: правильный шестиугольник',
    build: () =>
      postroit(cube(6), [
        ['A', 'B', half, 'M'],
        ['B', 'C', half, 'N'],
        ['C', 'C_1', half, 'K'],
      ]),
  },
  {
    id: 'par-treugolnik',
    title: 'Параллелепипед $2\\times3\\times4$: $A_1BD$',
    build: () => postroit(box(2, 3, 4), ['A_1', 'B', 'D']),
  },
  {
    id: 'par-pyatiugolnik',
    title: 'Параллелепипед $4\\times6\\times3$: пятиугольник',
    build: () =>
      postroit(box(4, 6, 3), [
        ['A', 'B', half, 'M'],
        ['A', 'D', half, 'N'],
        ['C', 'C_1', [2, 3], 'K'],
      ]),
  },
];

export const primer = (id: string): Primer =>
  PRIMERY.find((p) => p.id === id) ?? (PRIMERY[0] as Primer);
