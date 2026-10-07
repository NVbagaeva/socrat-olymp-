/**
 * Построение с «происхождением» каждого объекта.
 *
 * Каждая точка, прямая и плоскость хранит, из каких объектов и какой
 * операцией она получена. Из этого генерируются обоснования шагов
 * («X = MN ∩ AB, обе прямые лежат в плоскости AA_1B_1B»), подсветка
 * «почему точка лежит в сечении» и проверка заданий: вершина сечения,
 * у которой цепочка не доходит до точек условия, не засчитывается.
 *
 * Правила метода следов проверяются здесь же: соединять можно только
 * точки одной грани (или её продолжения), пересекать — только прямые
 * одной плоскости. Нарушение — не исключение, а ответ с кодом и
 * понятным ученику текстом.
 */

import { type Polyhedron, at, edgeName } from './polyhedron';
import {
  type Rat,
  ONE,
  ZERO,
  add as radd,
  div as rdiv,
  isZero,
  lt,
  rat,
  sub as rsub,
} from './rational';
import {
  type Line3,
  type Plane,
  type V3,
  coplanarLines,
  dot,
  intersectLines,
  lerp,
  lineThrough,
  onPlane,
  parallelLines,
  parallelPlanes,
  planeThrough,
  sameLine,
  veq,
} from './vec';

export type ObjId = string;

/** Плоскость, в которой выполнено построение: грань или построенная плоскость. */
export type PlaneRef = { kind: 'face'; face: number } | { kind: 'plane'; id: ObjId };

export type Origin =
  /** Вершина многогранника. */
  | { op: 'vertex'; vertex: number }
  /** Точка условия на ребре: A + t(B − A); t вне (0; 1) — на продолжении. */
  | { op: 'onEdge'; edge: number; t: Rat }
  /** Поставлена «на глаз» — без построения; обоснования нет. */
  | { op: 'free' }
  /** Прямая ребра. */
  | { op: 'edgeLine'; edge: number }
  /** Прямая через две точки, лежащие в одной плоскости. */
  | { op: 'line'; a: ObjId; b: ObjId; plane: PlaneRef }
  /** Точка пересечения двух прямых одной плоскости. */
  | { op: 'intersect'; l1: ObjId; l2: ObjId; plane: PlaneRef | null }
  /** Прямая через точку параллельно данной. */
  | { op: 'parallel'; line: ObjId; through: ObjId; plane: PlaneRef | null; reason: ParallelReason }
  /** Плоскость через три точки. */
  | { op: 'plane3'; a: ObjId; b: ObjId; c: ObjId };

/**
 * На что опирается параллельная прямая:
 * 'parallel-faces' — плоскость пересекает параллельные грани по
 * параллельным прямым; 'in-plane' — параллельная в той же плоскости
 * (аксиома параллельных); 'axiom' — через точку вне прямой.
 */
export type ParallelReason = 'parallel-faces' | 'in-plane' | 'axiom';

export interface PointObj {
  id: ObjId;
  kind: 'point';
  name: string;
  p: V3;
  origin: Origin;
}

export interface LineObj {
  id: ObjId;
  kind: 'line';
  line: Line3;
  /** Через какие точки проведена (для подписи «MN»); у прямой ребра — его концы. */
  through: [ObjId, ObjId] | null;
  origin: Origin;
}

export interface PlaneObj {
  id: ObjId;
  kind: 'plane';
  plane: Plane;
  origin: Origin;
}

export type Obj = PointObj | LineObj | PlaneObj;

/** Отказ в построении — с кодом для проверки и текстом для ученика. */
export interface Refusal {
  ok: false;
  code:
    | 'same-point'
    | 'not-coplanar'
    | 'parallel'
    | 'skew'
    | 'same-line'
    | 'collinear'
    | 'point-on-line'
    | 'name-taken'
    | 'name-invalid'
    | 'unknown';
  message: string;
}
export type Result<T> = { ok: true; value: T } | Refusal;

const refuse = (code: Refusal['code'], message: string): Refusal => ({ ok: false, code, message });

/** Буквы для новых точек: сначала обычные для сечений. */
const NAME_POOL = ['M', 'N', 'K', 'L', 'P', 'Q', 'R', 'S', 'T', 'E', 'F', 'G', 'H', 'X', 'Y', 'Z'];

/** Имя точки: буква, индекс через «_», штрихи. A, M_1, K', X_{12}''. */
export const NAME_RE = /^[A-ZА-Я](_(\d+|\{\d+\}))?'{0,3}$/;

export class Construction {
  readonly poly: Polyhedron;
  private objs = new Map<ObjId, Obj>();
  /** Порядок создания — это и порядок шагов протокола. */
  private order: ObjId[] = [];
  private counter = 0;
  private edgeLineIds = new Map<number, ObjId>();
  private vertexIds: ObjId[] = [];

  constructor(poly: Polyhedron) {
    this.poly = poly;
    poly.vertices.forEach((v, i) => {
      const id = this.put({
        id: '',
        kind: 'point',
        name: v.name,
        p: v.p,
        origin: { op: 'vertex', vertex: i },
      });
      this.vertexIds.push(id);
    });
  }

  /* ── Доступ ─────────────────────────────────────────────── */

  get(id: ObjId): Obj {
    const o = this.objs.get(id);
    if (o === undefined) throw new Error(`нет объекта ${id}`);
    return o;
  }
  point(id: ObjId): PointObj {
    const o = this.get(id);
    if (o.kind !== 'point') throw new Error(`${id} — не точка`);
    return o;
  }
  line(id: ObjId): LineObj {
    const o = this.get(id);
    if (o.kind !== 'line') throw new Error(`${id} — не прямая`);
    return o;
  }
  plane(id: ObjId): PlaneObj {
    const o = this.get(id);
    if (o.kind !== 'plane') throw new Error(`${id} — не плоскость`);
    return o;
  }
  has = (id: ObjId): boolean => this.objs.has(id);
  /** Все объекты в порядке построения. */
  all = (): Obj[] => this.order.map((id) => this.get(id));
  vertex = (name: string): ObjId => {
    const i = this.poly.vertices.findIndex((v) => v.name === name);
    if (i < 0) throw new Error(`нет вершины ${name}`);
    return this.vertexIds[i] as ObjId;
  };
  byName(name: string): PointObj | undefined {
    return this.all().find((o): o is PointObj => o.kind === 'point' && o.name === name);
  }

  private put<T extends Obj>(o: T): ObjId {
    this.counter += 1;
    const id = `${o.kind[0]}${this.counter}`;
    const withId = { ...o, id } as T;
    this.objs.set(id, withId);
    this.order.push(id);
    return id;
  }

  /* ── Имена ─────────────────────────────────────────────── */

  freeName(): string {
    const taken = new Set(this.all().flatMap((o) => (o.kind === 'point' ? [o.name] : [])));
    for (const n of NAME_POOL) if (!taken.has(n)) return n;
    for (let i = 1; ; i++) {
      for (const n of NAME_POOL) {
        const s = `${n}_${i}`;
        if (!taken.has(s)) return s;
      }
    }
  }

  /** Переименовать точку: имя проверяется на формат и уникальность. */
  rename(id: ObjId, name: string): Result<ObjId> {
    const p = this.point(id);
    const clean = name.trim();
    if (!NAME_RE.test(clean)) {
      return refuse(
        'name-invalid',
        "Имя — заглавная буква, можно с индексом и штрихами: $M$, $M_1$, $K'$.",
      );
    }
    const other = this.byName(clean);
    if (other !== undefined && other.id !== id) {
      return refuse('name-taken', `Точка $${clean}$ уже есть на чертеже.`);
    }
    this.objs.set(id, { ...p, name: clean });
    return { ok: true, value: id };
  }

  /* ── Плоскости, в которых лежат объекты ─────────────────── */

  /** Грани (их плоскости с продолжением), содержащие все точки. */
  facesWith(points: V3[]): number[] {
    return this.poly.faces.flatMap((f, fi) =>
      points.every((p) => onPlane(f.plane, p)) ? [fi] : [],
    );
  }

  /** Построенные плоскости, содержащие все точки. */
  planesWith(points: V3[]): ObjId[] {
    return this.all().flatMap((o) =>
      o.kind === 'plane' && points.every((p) => onPlane(o.plane, p)) ? [o.id] : [],
    );
  }

  /** Лежит ли прямая в плоскости. */
  static lineIn(l: Line3, pl: Plane): boolean {
    return onPlane(pl, l.p) && isZero(dot(pl.n, l.dir));
  }

  /** Плоскости (грани, затем построенные), содержащие все прямые. */
  planesOfLines(lines: Line3[]): PlaneRef[] {
    const faces: PlaneRef[] = this.poly.faces.flatMap((f, fi) =>
      lines.every((l) => Construction.lineIn(l, f.plane))
        ? [{ kind: 'face' as const, face: fi }]
        : [],
    );
    const planes: PlaneRef[] = this.all().flatMap((o) =>
      o.kind === 'plane' && lines.every((l) => Construction.lineIn(l, o.plane))
        ? [{ kind: 'plane' as const, id: o.id }]
        : [],
    );
    return [...faces, ...planes];
  }

  planeOf(ref: PlaneRef): Plane {
    return ref.kind === 'face' ? at(this.poly.faces, ref.face).plane : this.plane(ref.id).plane;
  }

  /* ── Точки ─────────────────────────────────────────────── */

  /**
   * Точка на ребре или его продолжении: A + t(B − A), ребро задано
   * концами. Отношение AM : MB = m : n внутри ребра — t = m/(m+n).
   */
  pointOnEdge(a: string, b: string, t: Rat, name?: string): Result<ObjId> {
    const ia = this.poly.vertices.findIndex((v) => v.name === a);
    const ib = this.poly.vertices.findIndex((v) => v.name === b);
    const ei = this.poly.edges.findIndex(
      (e) => (e.a === ia && e.b === ib) || (e.a === ib && e.b === ia),
    );
    if (ia < 0 || ib < 0 || ei < 0) return refuse('unknown', `Нет ребра $${a}${b}$.`);
    const e = at(this.poly.edges, ei);
    // Параметр храним от первого конца ребра (e.a).
    const tt = e.a === ia ? t : rsub(ONE, t);
    const p = lerp(at(this.poly.vertices, ia).p, at(this.poly.vertices, ib).p, t);
    const nm = name ?? this.freeName();
    const ren = this.checkName(nm);
    if (ren !== null) return ren;
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'point',
        name: nm,
        p,
        origin: { op: 'onEdge', edge: ei, t: tt },
      }),
    };
  }

  /** Отношение AM : MB = m : n → параметр t. Снаружи (M за B или за A) — t = m/(m − n). */
  static ratio(m: number, n: number, outside = false): Rat {
    return outside ? rat(m, m - n) : rat(m, m + n);
  }

  /** Точка «на глаз»: без построения. Обоснования у неё нет. */
  freePoint(p: V3, name?: string): Result<ObjId> {
    const nm = name ?? this.freeName();
    const ren = this.checkName(nm);
    if (ren !== null) return ren;
    return {
      ok: true,
      value: this.put({ id: '', kind: 'point', name: nm, p, origin: { op: 'free' } }),
    };
  }

  private checkName(name: string): Refusal | null {
    if (!NAME_RE.test(name))
      return refuse('name-invalid', 'Имя — заглавная буква, можно с индексом и штрихами.');
    if (this.byName(name) !== undefined)
      return refuse('name-taken', `Точка $${name}$ уже есть на чертеже.`);
    return null;
  }

  /* ── Прямые ────────────────────────────────────────────── */

  /** Прямая ребра (для «продлим ребро AB»). Одна на ребро. */
  edgeLine(a: string, b: string): ObjId {
    const ia = this.poly.vertices.findIndex((v) => v.name === a);
    const ib = this.poly.vertices.findIndex((v) => v.name === b);
    const ei = this.poly.edges.findIndex(
      (e) => (e.a === ia && e.b === ib) || (e.a === ib && e.b === ia),
    );
    if (ei < 0) throw new Error(`нет ребра ${a}${b}`);
    return this.edgeLineByIndex(ei);
  }

  edgeLineByIndex(ei: number): ObjId {
    const cached = this.edgeLineIds.get(ei);
    if (cached !== undefined && this.objs.has(cached)) return cached;
    const e = at(this.poly.edges, ei);
    const id = this.put({
      id: '',
      kind: 'line',
      line: lineThrough(at(this.poly.vertices, e.a).p, at(this.poly.vertices, e.b).p),
      through: [this.vertexIds[e.a] as ObjId, this.vertexIds[e.b] as ObjId],
      origin: { op: 'edgeLine', edge: ei },
    });
    this.edgeLineIds.set(ei, id);
    return id;
  }

  /**
   * Прямая через две точки. Разрешена, только если точки лежат
   * в одной грани (её плоскости) или в построенной плоскости.
   */
  lineThrough(a: ObjId, b: ObjId, opts: { allowPlanes?: boolean } = {}): Result<ObjId> {
    const pa = this.point(a);
    const pb = this.point(b);
    if (veq(pa.p, pb.p)) return refuse('same-point', 'Точки совпадают — прямую провести нельзя.');
    const l = lineThrough(pa.p, pb.p);
    const existing = this.all().find((o): o is LineObj => o.kind === 'line' && sameLine(o.line, l));
    const faces = this.facesWith([pa.p, pb.p]);
    let plane: PlaneRef | null =
      faces.length > 0 ? { kind: 'face', face: faces[0] as number } : null;
    if (plane === null && opts.allowPlanes === true) {
      const pls = this.planesWith([pa.p, pb.p]);
      if (pls.length > 0) plane = { kind: 'plane', id: pls[0] as ObjId };
    }
    if (plane === null) {
      return refuse('not-coplanar', 'Эти точки не лежат в одной грани — так соединять нельзя.');
    }
    if (existing !== undefined) return { ok: true, value: existing.id };
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'line',
        line: l,
        through: [a, b],
        origin: { op: 'line', a, b, plane },
      }),
    };
  }

  /**
   * Точка пересечения двух прямых. Только если они лежат в одной
   * плоскости; иначе — отказ «скрещиваются» или «параллельны».
   */
  intersect(l1: ObjId, l2: ObjId, name?: string): Result<ObjId> {
    const a = this.line(l1);
    const b = this.line(l2);
    if (sameLine(a.line, b.line)) return refuse('same-line', 'Это одна и та же прямая.');
    if (parallelLines(a.line, b.line)) {
      return refuse('parallel', 'Эти прямые параллельны — точки пересечения нет.');
    }
    if (!coplanarLines(a.line, b.line)) {
      return refuse('skew', 'Эти прямые скрещиваются — точки пересечения нет.');
    }
    const x = intersectLines(a.line, b.line);
    if (x === null) return refuse('unknown', 'Точку пересечения найти не удалось.');
    const planes = this.planesOfLines([a.line, b.line]);
    const nm = name ?? this.freeName();
    const ren = this.checkName(nm);
    if (ren !== null) return ren;
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'point',
        name: nm,
        p: x,
        origin: { op: 'intersect', l1, l2, plane: planes[0] ?? null },
      }),
    };
  }

  /**
   * Прямая через точку параллельно данной. Обоснование выбирается
   * по положению: данная прямая в одной грани, точка — в параллельной
   * ей грани ⇒ «плоскость пересекает параллельные плоскости по
   * параллельным прямым».
   */
  parallelThrough(lineId: ObjId, pointId: ObjId): Result<ObjId> {
    const L = this.line(lineId);
    const P = this.point(pointId);
    const l: Line3 = { p: P.p, dir: L.line.dir };
    if (sameLine(l, L.line)) {
      return refuse(
        'point-on-line',
        'Точка лежит на этой прямой — параллельную через неё не провести.',
      );
    }
    // Грань, где пройдёт новая прямая (содержит точку и направление).
    const newFaces = this.poly.faces.flatMap((f, fi) =>
      Construction.lineIn(l, f.plane) ? [fi] : [],
    );
    const oldFaces = this.poly.faces.flatMap((f, fi) =>
      Construction.lineIn(L.line, f.plane) ? [fi] : [],
    );
    let reason: ParallelReason = 'axiom';
    let plane: PlaneRef | null = null;
    const common = newFaces.find((f) => oldFaces.includes(f));
    if (common !== undefined) {
      reason = 'in-plane';
      plane = { kind: 'face', face: common };
    } else {
      for (const nf of newFaces) {
        const par = oldFaces.find((of) =>
          parallelPlanes(at(this.poly.faces, nf).plane, at(this.poly.faces, of).plane),
        );
        if (par !== undefined) {
          reason = 'parallel-faces';
          plane = { kind: 'face', face: nf };
          break;
        }
      }
      if (plane === null && newFaces.length > 0)
        plane = { kind: 'face', face: newFaces[0] as number };
    }
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'line',
        line: l,
        through: null,
        origin: { op: 'parallel', line: lineId, through: pointId, plane, reason },
      }),
    };
  }

  /** Плоскость через три точки (плоскость сечения MNK). */
  plane3(a: ObjId, b: ObjId, c: ObjId): Result<ObjId> {
    const pl = planeThrough(this.point(a).p, this.point(b).p, this.point(c).p);
    if (pl === null)
      return refuse('collinear', 'Точки лежат на одной прямой — плоскость не определена.');
    return {
      ok: true,
      value: this.put({ id: '', kind: 'plane', plane: pl, origin: { op: 'plane3', a, b, c } }),
    };
  }

  /* ── Зависимости ───────────────────────────────────────── */

  /** Непосредственные «родители» объекта. */
  static parents(o: Obj): ObjId[] {
    const g = o.origin;
    switch (g.op) {
      case 'line':
        return [g.a, g.b];
      case 'intersect':
        return [g.l1, g.l2];
      case 'parallel':
        return [g.line, g.through];
      case 'plane3':
        return [g.a, g.b, g.c];
      case 'edgeLine':
        /* Прямая ребра опирается на его концы — вершины. */
        return o.kind === 'line' && o.through !== null ? [...o.through] : [];
      default:
        return [];
    }
  }

  /** Всё, что построено с опорой на объект (транзитивно), в порядке построения. */
  dependents(id: ObjId): ObjId[] {
    const bad = new Set([id]);
    const out: ObjId[] = [];
    for (const oid of this.order) {
      if (oid === id) continue;
      const o = this.get(oid);
      const parents = Construction.parents(o);
      const viaPlane =
        (o.origin.op === 'line' || o.origin.op === 'intersect' || o.origin.op === 'parallel') &&
        o.origin.plane?.kind === 'plane' &&
        bad.has(o.origin.plane.id);
      if (parents.some((p) => bad.has(p)) || viaPlane) {
        bad.add(oid);
        out.push(oid);
      }
    }
    return out;
  }

  /** Удалить объект со всем, что от него зависит. Вершины не удаляются. */
  remove(id: ObjId): ObjId[] {
    const o = this.get(id);
    if (o.origin.op === 'vertex') return [];
    const gone = [id, ...this.dependents(id)];
    for (const g of gone) this.objs.delete(g);
    this.order = this.order.filter((x) => !gone.includes(x));
    for (const [ei, lid] of this.edgeLineIds) if (gone.includes(lid)) this.edgeLineIds.delete(ei);
    return gone;
  }

  /**
   * Цепочка происхождения: объект и все его предки, от исходных
   * (вершин, точек условия) к самому объекту.
   */
  chain(id: ObjId): ObjId[] {
    const seen = new Set<ObjId>();
    const walk = (x: ObjId) => {
      if (seen.has(x)) return;
      const o = this.get(x);
      for (const p of Construction.parents(o)) walk(p);
      if (
        (o.origin.op === 'line' || o.origin.op === 'intersect' || o.origin.op === 'parallel') &&
        o.origin.plane?.kind === 'plane'
      ) {
        walk(o.origin.plane.id);
      }
      seen.add(x);
    };
    walk(id);
    return [...seen];
  }

  /**
   * Обоснована ли точка: вся её цепочка состоит из допустимых
   * построений и упирается в вершины и точки условия. Точка «на глаз»
   * (free) где-либо в цепочке — не обоснована.
   */
  grounded(id: ObjId): boolean {
    return this.chain(id).every((x) => this.get(x).origin.op !== 'free');
  }

  /* ── Подписи ───────────────────────────────────────────── */

  /** «MN», «AB» — имя прямой по двум её точкам; у параллельной — «a». */
  lineName(id: ObjId): string {
    const l = this.line(id);
    if (l.through !== null)
      return `${this.point(l.through[0]).name}${this.point(l.through[1]).name}`;
    if (l.origin.op === 'parallel') return `${this.lineName(l.origin.line)}'`;
    return id;
  }

  planeName(ref: PlaneRef): string {
    if (ref.kind === 'face') return at(this.poly.faces, ref.face).name;
    const o = this.plane(ref.id).origin;
    return o.op === 'plane3'
      ? `${this.point(o.a).name}${this.point(o.b).name}${this.point(o.c).name}`
      : ref.id;
  }

  edgeName = (ei: number): string => edgeName(this.poly, at(this.poly.edges, ei));

  /** Лежит ли точка на отрезке ребра (а не на продолжении). */
  onEdgeSegment(id: ObjId): number | null {
    const p = this.point(id).p;
    for (let ei = 0; ei < this.poly.edges.length; ei++) {
      const e = at(this.poly.edges, ei);
      const A = at(this.poly.vertices, e.a).p;
      const B = at(this.poly.vertices, e.b).p;
      const l = lineThrough(A, B);
      if (!Construction.lineIn(l, at(this.poly.faces, e.faces[0]).plane)) continue;
      const t = paramIfOn(A, B, p);
      if (t !== null && !lt(t, ZERO) && !lt(ONE, t)) return ei;
    }
    return null;
  }
}

/** Параметр t точки P на прямой AB, если P на ней лежит. */
function paramIfOn(A: V3, B: V3, P: V3): Rat | null {
  const d = { x: rsub(B.x, A.x), y: rsub(B.y, A.y), z: rsub(B.z, A.z) };
  const v = { x: rsub(P.x, A.x), y: rsub(P.y, A.y), z: rsub(P.z, A.z) };
  let t: Rat | null = null;
  for (const k of ['x', 'y', 'z'] as const) {
    if (!isZero(d[k])) {
      t = rdiv(v[k], d[k]);
      break;
    }
  }
  if (t === null) return null;
  const back = {
    x: radd(A.x, mulR(d.x, t)),
    y: radd(A.y, mulR(d.y, t)),
    z: radd(A.z, mulR(d.z, t)),
  };
  return veq(back, P) ? t : null;
}

const mulR = (a: Rat, b: Rat): Rat => rat(a.n * b.n, a.d * b.d);
