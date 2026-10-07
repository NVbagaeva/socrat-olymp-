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
  ratStr,
  sub as rsub,
} from './rational';
import {
  type Line3,
  type Plane,
  type V3,
  coplanarLines,
  dot,
  intersectLines,
  intersectPlanes,
  lerp,
  lineThrough,
  onLine,
  onPlane,
  parallelLines,
  parallelPlanes,
  paramOn,
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
  | { op: 'plane3'; a: ObjId; b: ObjId; c: ObjId }
  /**
   * Прямая пересечения двух плоскостей (грани или построенной).
   * Общие точки, через которые она проходит, не хранятся: они могут
   * появиться позже, и считаются по запросу — meetThrough().
   */
  | { op: 'planeMeet'; a: PlaneRef; b: PlaneRef };

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
  /** Подпись в TeX: «\\alpha», «\\beta». Нет — по трём точкам: (MNK). */
  label?: string;
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
    | 'parallel-planes'
    | 'same-plane'
    | 'unknown';
  message: string;
}
export type Result<T> = { ok: true; value: T } | Refusal;

const refuse = (code: Refusal['code'], message: string): Refusal => ({ ok: false, code, message });

/** Буквы для новых точек: сначала обычные для сечений. */
const NAME_POOL = ['M', 'N', 'K', 'L', 'P', 'Q', 'R', 'S', 'T', 'E', 'F', 'G', 'H', 'X', 'Y', 'Z'];

/** Имя точки: буква, индекс через «_», штрихи. A, M_1, K', X_{12}''. */
export const NAME_RE = /^[A-ZА-Я](_(\d+|\{\d+\}))?'{0,3}$/;

/** Аксиома, на которую опирается каждая линия пересечения плоскостей. */
export const AKSIOMA_PLOSKOSTEY =
  'аксиома: если две различные плоскости имеют общую точку, то они пересекаются по прямой, проходящей через эту точку';

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

  /** Плоскость через три точки (плоскость сечения MNK). label — TeX: «\\alpha». */
  plane3(a: ObjId, b: ObjId, c: ObjId, label?: string): Result<ObjId> {
    const pl = planeThrough(this.point(a).p, this.point(b).p, this.point(c).p);
    if (pl === null)
      return refuse('collinear', 'Точки лежат на одной прямой — плоскость не определена.');
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'plane',
        plane: pl,
        ...(label === undefined ? {} : { label }),
        origin: { op: 'plane3', a, b, c },
      }),
    };
  }

  /* ── Пересечение плоскостей ───────────────────────────────── */

  /**
   * Прямая пересечения двух плоскостей: граней многогранника или
   * построенных. Параллельные и совпадающие плоскости — отказ с
   * текстом для ученика. Одна и та же пара даёт одну прямую: повторный
   * вызов возвращает уже построенную.
   */
  planeMeet(a: PlaneRef, b: PlaneRef): Result<ObjId> {
    if (sameRef(a, b)) return refuse('same-plane', 'Это одна и та же плоскость.');
    const A = this.planeOf(a);
    const B = this.planeOf(b);
    const meet = intersectPlanes(A, B);
    if (meet.kind === 'same') {
      return refuse('same-plane', 'Плоскости совпадают — общая у них вся плоскость.');
    }
    if (meet.kind === 'parallel') {
      return refuse('parallel-planes', 'Плоскости параллельны — общей линии нет.');
    }
    const existing = this.all().find(
      (o): o is LineObj => o.kind === 'line' && sameLine(o.line, meet.line),
    );
    if (existing !== undefined) return { ok: true, value: existing.id };
    return {
      ok: true,
      value: this.put({
        id: '',
        kind: 'line',
        line: meet.line,
        through: null,
        origin: { op: 'planeMeet', a, b },
      }),
    };
  }

  /** Прямая пересечения, если она уже построена. */
  findMeet(a: PlaneRef, b: PlaneRef): ObjId | null {
    const found = this.all().find(
      (o): o is LineObj =>
        o.kind === 'line' &&
        o.origin.op === 'planeMeet' &&
        ((sameRef(o.origin.a, a) && sameRef(o.origin.b, b)) ||
          (sameRef(o.origin.a, b) && sameRef(o.origin.b, a))),
    );
    return found?.id ?? null;
  }

  /**
   * Построенные точки, лежащие в обеих плоскостях прямой пересечения,
   * — те, через которые её можно обосновать: «M ∈ α, M ∈ β». Берутся
   * первые две разные; вершины многогранника считаются тоже.
   */
  meetThrough(lineId: ObjId): ObjId[] {
    const l = this.line(lineId);
    if (l.origin.op !== 'planeMeet') return l.through === null ? [] : [...l.through];
    const out: ObjId[] = [];
    for (const o of this.all()) {
      if (o.kind !== 'point' || !onLine(l.line, o.p)) continue;
      if (out.some((id) => veq(this.point(id).p, o.p))) continue;
      out.push(o.id);
      if (out.length === 2) break;
    }
    return out;
  }

  /**
   * Где прямая пересекает рёбра многогранника и их продолжения —
   * кандидаты в вершины сечения. Точка в вершине засчитывается один
   * раз, со всеми рёбрами, через которые она прошла.
   */
  lineEdgeHits(lineId: ObjId): EdgeHit[] {
    const l = this.line(lineId).line;
    const hits: EdgeHit[] = [];
    this.poly.edges.forEach((e, ei) => {
      const A = at(this.poly.vertices, e.a).p;
      const B = at(this.poly.vertices, e.b).p;
      const el = lineThrough(A, B);
      if (sameLine(l, el) || parallelLines(l, el) || !coplanarLines(l, el)) return;
      const x = intersectLines(l, el);
      if (x === null) return;
      const t = paramOn(A, B, x);
      const onSegment = !lt(t, ZERO) && !lt(ONE, t);
      const same = hits.find((h) => veq(h.p, x));
      if (same !== undefined) {
        same.edges.push(ei);
        same.onSegment = same.onSegment || onSegment;
        return;
      }
      hits.push({ p: x, edge: ei, edges: [ei], t, onSegment });
    });
    return hits;
  }

  /* ── Пересчёт ─────────────────────────────────────────────── */

  /**
   * Сдвинуть точку условия по ребру: новый параметр t и пересчёт
   * всего, что от неё зависит, в порядке построения. Если какое-то
   * построение при этом перестаёт существовать (прямые стали
   * параллельны, три точки легли на прямую), сдвиг отменяется.
   */
  setEdgeParam(id: ObjId, t: Rat): Result<ObjId> {
    const p = this.point(id);
    if (p.origin.op !== 'onEdge') return refuse('unknown', 'Эта точка не на ребре.');
    const was = p.origin.t;
    const e = at(this.poly.edges, p.origin.edge);
    this.objs.set(id, {
      ...p,
      p: lerp(at(this.poly.vertices, e.a).p, at(this.poly.vertices, e.b).p, t),
      origin: { ...p.origin, t },
    });
    const broken = this.recompute();
    if (broken.length > 0) {
      this.objs.set(id, {
        ...p,
        p: lerp(at(this.poly.vertices, e.a).p, at(this.poly.vertices, e.b).p, was),
        origin: { ...p.origin, t: was },
      });
      this.recompute();
      return refuse('unknown', 'В этом положении построение распадается.');
    }
    return { ok: true, value: id };
  }

  /** Пересчитать геометрию всех объектов по их происхождению. */
  recompute(): ObjId[] {
    const broken: ObjId[] = [];
    for (const id of this.order) {
      const o = this.get(id);
      const g = o.origin;
      switch (g.op) {
        case 'line': {
          const a = this.point(g.a).p;
          const b = this.point(g.b).p;
          if (veq(a, b)) {
            broken.push(id);
            break;
          }
          this.objs.set(id, { ...(o as LineObj), line: lineThrough(a, b) });
          break;
        }
        case 'intersect': {
          const x = intersectLines(this.line(g.l1).line, this.line(g.l2).line);
          if (x === null) {
            broken.push(id);
            break;
          }
          this.objs.set(id, { ...(o as PointObj), p: x });
          break;
        }
        case 'parallel': {
          this.objs.set(id, {
            ...(o as LineObj),
            line: { p: this.point(g.through).p, dir: this.line(g.line).line.dir },
          });
          break;
        }
        case 'plane3': {
          const pl = planeThrough(this.point(g.a).p, this.point(g.b).p, this.point(g.c).p);
          if (pl === null) {
            broken.push(id);
            break;
          }
          this.objs.set(id, { ...(o as PlaneObj), plane: pl });
          break;
        }
        case 'planeMeet': {
          const m = intersectPlanes(this.planeOf(g.a), this.planeOf(g.b));
          if (m.kind !== 'line') {
            broken.push(id);
            break;
          }
          this.objs.set(id, { ...(o as LineObj), line: m.line });
          break;
        }
        default:
          break;
      }
    }
    return broken;
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
      case 'planeMeet':
        return [g.a, g.b].flatMap((r) => (r.kind === 'plane' ? [r.id] : []));
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

  /** Прямые пересечения, построенные с плоскостью грани. */
  linesOfFace(face: number): ObjId[] {
    return this.all().flatMap((o) =>
      o.kind === 'line' &&
      o.origin.op === 'planeMeet' &&
      [o.origin.a, o.origin.b].some((r) => r.kind === 'face' && r.face === face)
        ? [o.id]
        : [],
    );
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

  /**
   * «MN», «AB» — имя прямой по двум её точкам; у параллельной — «MN'»;
   * у прямой пересечения — «(α ∩ (ABC))», в скобках, чтобы стоять
   * внутри формулы.
   */
  lineName(id: ObjId): string {
    const l = this.line(id);
    if (l.through !== null)
      return `${this.point(l.through[0]).name}${this.point(l.through[1]).name}`;
    if (l.origin.op === 'parallel') return `${this.lineName(l.origin.line)}'`;
    if (l.origin.op === 'planeMeet') {
      const th = this.meetThrough(id);
      if (th.length === 2) return th.map((pid) => this.point(pid).name).join('');
      return `(${this.lineTex(id)})`;
    }
    return id;
  }

  /** Имена вершин грани в порядке, в каком они стоят в её имени: «ABCD» → A, B, C, D. */
  faceVertexNames(face: number): string[] {
    const f = at(this.poly.faces, face);
    const names = f.idx.map((i) => at(this.poly.vertices, i).name);
    const out: string[] = [];
    let rest = f.name;
    while (rest.length > 0) {
      const hit = names.filter((n) => rest.startsWith(n)).sort((a, b) => b.length - a.length)[0];
      if (hit === undefined) break;
      out.push(hit);
      rest = rest.slice(hit.length);
    }
    return out.length === names.length ? out : names;
  }

  planeName(ref: PlaneRef): string {
    if (ref.kind === 'face') return at(this.poly.faces, ref.face).name;
    const o = this.plane(ref.id).origin;
    return o.op === 'plane3'
      ? `${this.point(o.a).name}${this.point(o.b).name}${this.point(o.c).name}`
      : ref.id;
  }

  /**
   * Подпись плоскости в TeX: у построенной — её label («\\alpha») или
   * «(MNK)»; у грани — три первые вершины: «(ABC)» для основания ABCD.
   */
  planeTex(ref: PlaneRef): string {
    if (ref.kind === 'face') return `(${this.faceVertexNames(ref.face).slice(0, 3).join('')})`;
    const pl = this.plane(ref.id);
    return pl.label ?? `(${this.planeName(ref)})`;
  }

  /** Подпись прямой в TeX: «MN», «\\alpha \\cap (ABC)». */
  lineTex(id: ObjId): string {
    const l = this.line(id);
    if (l.origin.op === 'planeMeet') {
      return `${this.planeTex(l.origin.a)} \\cap ${this.planeTex(l.origin.b)}`;
    }
    return this.lineName(id);
  }

  /** Плоскости, которым принадлежит прямая пересечения. */
  meetPlanes(id: ObjId): [PlaneRef, PlaneRef] | null {
    const l = this.line(id);
    return l.origin.op === 'planeMeet' ? [l.origin.a, l.origin.b] : null;
  }

  /* ── Шаги и обоснования ───────────────────────────────────── */

  /** Шаги построения: всё, кроме вершин, в порядке создания. */
  steps(): ObjId[] {
    return this.order.filter((id) => this.get(id).origin.op !== 'vertex');
  }

  /**
   * Текст шага с обоснованием — с формулами в $…$. Для прямой
   * пересечения: «M ∈ α, M ∈ (ABC); N ∈ α, N ∈ (ABC) ⇒ MN = α ∩ (ABC)».
   */
  describe(id: ObjId): string {
    const o = this.get(id);
    const g = o.origin;
    const P = (pid: ObjId) => `$${this.point(pid).name}$`;
    switch (g.op) {
      case 'vertex':
        return `Вершина ${P(id)}.`;
      case 'onEdge': {
        const e = at(this.poly.edges, g.edge);
        const a = at(this.poly.vertices, e.a).name;
        const b = at(this.poly.vertices, e.b).name;
        const M = this.point(id).name;
        const inside = !lt(g.t, ZERO) && !lt(ONE, g.t);
        return inside
          ? `Точка $${M}$ на ребре $${a}${b}$, $${a}${M} : ${M}${b} = ${ratio(g.t)}$.`
          : `Точка $${M}$ на продолжении ребра $${a}${b}$: $${a}${M} = ${ratStr(g.t)} \\cdot ${a}${b}$.`;
      }
      case 'free':
        return `Точка ${P(id)} поставлена на глаз — построения у неё нет.`;
      case 'edgeLine':
        return `Продолжим ребро $${this.edgeName(g.edge)}$.`;
      case 'line':
        return `Прямая $${this.lineName(id)}$: точки ${P(g.a)} и ${P(g.b)} лежат в плоскости $${this.planeTex(g.plane)}$.`;
      case 'intersect': {
        const where =
          g.plane === null ? '' : ` — обе прямые лежат в плоскости $${this.planeTex(g.plane)}$`;
        return `$${this.point(id).name} = ${this.lineName(g.l1)} \\cap ${this.lineName(g.l2)}$${where}.`;
      }
      case 'parallel': {
        const why =
          g.reason === 'parallel-faces'
            ? 'плоскость пересекает параллельные грани по параллельным прямым'
            : g.reason === 'in-plane'
              ? 'в одной плоскости через точку проходит одна параллельная'
              : 'через точку вне прямой проходит одна параллельная ей прямая';
        return `Через ${P(g.through)} проведём прямую параллельно $${this.lineName(g.line)}$: ${why}.`;
      }
      case 'plane3':
        return `Плоскость $${this.planeTex({ kind: 'plane', id })}$ через точки ${P(g.a)}, ${P(g.b)}, ${P(g.c)}.`;
      case 'planeMeet': {
        const A = this.planeTex(g.a);
        const B = this.planeTex(g.b);
        const th = this.meetThrough(id);
        const name = this.lineTex(id);
        if (th.length === 2) {
          const [m, n] = th as [ObjId, ObjId];
          const M = this.point(m).name;
          const N = this.point(n).name;
          return (
            `$${M} \\in ${A}$ и $${M} \\in ${B}$, $${N} \\in ${A}$ и $${N} \\in ${B}$, $${M} \\ne ${N}$. ` +
            `Плоскости $${A}$ и $${B}$ различны и имеют общие точки, значит, они пересекаются по прямой (${AKSIOMA_PLOSKOSTEY}). ` +
            `Обе точки $${M}$ и $${N}$ лежат на этой прямой, значит, $${A} \\cap ${B} = ${M}${N}$.`
          );
        }
        if (th.length === 1) {
          const M = this.point(th[0] as ObjId).name;
          return (
            `$${M} \\in ${A}$ и $${M} \\in ${B}$. ` +
            `Плоскости $${A}$ и $${B}$ различны и имеют общую точку $${M}$, значит, они пересекаются по прямой, проходящей через $${M}$ (${AKSIOMA_PLOSKOSTEY}). ` +
            `Чтобы назвать прямую $${name}$ двумя буквами, нужна вторая общая точка — она там, где эта прямая пересекает ребро или его продолжение.`
          );
        }
        return `Плоскости $${A}$ и $${B}$ различны и не параллельны, значит, они пересекаются по прямой $${name}$. Чтобы её провести, нужны две общие точки плоскостей.`;
      }
    }
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

/** Одна и та же плоскость по ссылке. */
export function sameRef(a: PlaneRef, b: PlaneRef): boolean {
  return a.kind === 'face' && b.kind === 'face'
    ? a.face === b.face
    : a.kind === 'plane' && b.kind === 'plane' && a.id === b.id;
}

/** Точка пересечения прямой с ребром или его продолжением. */
export interface EdgeHit {
  p: V3;
  /** Первое ребро, на прямой которого лежит точка. */
  edge: number;
  /** Все рёбра через эту точку (в вершине их несколько). */
  edges: number[];
  /** Параметр от первого конца ребра edge. */
  t: Rat;
  /** На самом ребре (0 ≤ t ≤ 1), а не на продолжении. */
  onSegment: boolean;
}

/** Отношение t : (1 − t) целыми: «1:2». */
function ratio(t: Rat): string {
  const rest = rsub(ONE, t);
  let p = t.n * rest.d;
  let q = rest.n * t.d;
  const g = gcdBig(p, q);
  p /= g;
  q /= g;
  return `${p}:${q}`;
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x || 1n;
}
