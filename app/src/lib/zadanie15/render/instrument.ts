/**
 * Инструмент «Сечение по трём точкам»: выбор точек и сцена.
 *
 * Без three.js и DOM — считается в node и проверяется тестами.
 * Движок (components/zadanie15/chertezh/dvizhok.ts) только находит,
 * куда ученик нажал (вершина, ребро или грань и где на них), и зовёт
 * методы этого класса; рисует то, что вернёт scena().
 *
 * Точки — объекты построения (core/construction): вершина берётся
 * как есть, новая точка на ребре — pointOnEdge, в грани —
 * pointOnFace. Приближённое место нажатия округляется до 1/12 ребра
 * или стороны грани, поэтому координаты точек — точные дроби.
 * Сечение и его новые вершины считает ядро (core/threePoints).
 */

import {
  type BuiltThreePointSection,
  type ObjId,
  type Polyhedron,
  type V3,
  Construction,
  buildThreePointSection,
  snapOnEdge,
  snapOnFace,
  toArray,
  veq,
} from '../core';
import { type V, add, centroid, cross, dot, norm, scale, sub } from './geom';
import {
  type Metka,
  type Scena,
  type Sechenie,
  razmerTochek,
  sechenieIzYadra,
  storonySecheniya,
  teloIzMnogogrannika,
} from './scena';

export const NUZHNO_TOCHEK = 3;

export interface Soobshchenie {
  /** oshibka — точку не взяли; info — пояснение (сечение — грань и т. п.). */
  vid: 'oshibka' | 'info';
  /** Текст для ученика, формулы в $…$. */
  text: string;
}

/** Точка, которую можно взять щелчком. */
export interface TochkaVybora {
  id: ObjId;
  name: string;
  p: V;
}

export class SechenieTryokhTochek {
  readonly c: Construction;
  private vybrany: ObjId[] = [];
  /** Точки, поставленные инструментом (при отмене удаляются). */
  private svoi = new Set<ObjId>();
  private rezultat: BuiltThreePointSection | null = null;
  soobshchenie: Soobshchenie | null = null;

  constructor(poly: Polyhedron) {
    this.c = new Construction(poly);
  }

  get poly(): Polyhedron {
    return this.c.poly;
  }

  get schyot(): number {
    return this.vybrany.length;
  }

  get itog(): BuiltThreePointSection | null {
    return this.rezultat;
  }

  /** Выбранные точки по порядку. */
  get vybor(): readonly ObjId[] {
    return this.vybrany;
  }

  /** Подсказка-счётчик. */
  get podskazka(): string {
    if (this.rezultat !== null) return 'Сечение построено (3/3)';
    const n = Math.min(this.vybrany.length + 1, NUZHNO_TOCHEK);
    return `Выберите три точки на рёбрах или гранях (${n}/${NUZHNO_TOCHEK})`;
  }

  /** Точки, которые можно взять щелчком: вершины и поставленные точки. */
  tochki(): TochkaVybora[] {
    return this.c
      .all()
      .flatMap((o) =>
        o.kind === 'point' && (o.origin.op === 'vertex' || this.svoi.has(o.id))
          ? [{ id: o.id, name: o.name, p: toArray(o.p) as V }]
          : [],
      );
  }

  /** Взять имеющуюся точку. false — не взята (причина в soobshchenie). */
  vzyat(id: ObjId): boolean {
    if (!this.mozhnoBrat()) return false;
    if (this.vybrany.includes(id)) {
      this.soobshchenie = {
        vid: 'oshibka',
        text: `Точка $${this.c.point(id).name}$ уже выбрана — нужны три разные точки.`,
      };
      return false;
    }
    return this.dobavit(id, false);
  }

  /** Новая точка на ребре: t — приближённый параметр от первого конца. */
  naRebre(edge: number, t: number): boolean {
    if (!this.mozhnoBrat()) return false;
    const s = snapOnEdge(this.poly, edge, t);
    if (s.kind === 'vertex') return this.vzyat(this.vershina(s.vertex));
    const est = this.naMeste(s.p);
    if (est !== null) return this.vzyat(est);
    const e = this.poly.edges[edge];
    if (e === undefined) return false;
    const r = this.c.pointOnEdge(
      this.poly.vertices[e.a]?.name ?? '',
      this.poly.vertices[e.b]?.name ?? '',
      s.t,
    );
    if (!r.ok) {
      this.soobshchenie = { vid: 'oshibka', text: r.message };
      return false;
    }
    return this.dobavit(r.value, true);
  }

  /** Новая точка в грани: α, β — приближённые координаты в грани (0…1). */
  naGrani(face: number, alpha: number, beta: number): boolean {
    if (!this.mozhnoBrat()) return false;
    const s = snapOnFace(this.poly, face, alpha, beta);
    if (s.kind === 'vertex') return this.vzyat(this.vershina(s.vertex));
    if (s.kind === 'edge') return this.naRebre(s.edge, Number(s.t.n) / Number(s.t.d));
    const est = this.naMeste(s.p);
    if (est !== null) return this.vzyat(est);
    const r = this.c.pointOnFace(s.face, s.p);
    if (!r.ok) {
      this.soobshchenie = { vid: 'oshibka', text: r.message };
      return false;
    }
    return this.dobavit(r.value, true);
  }

  /** Отменить последнюю выбранную точку. */
  otmenit(): void {
    this.ubratSechenie();
    const id = this.vybrany.pop();
    if (id !== undefined && this.svoi.has(id)) {
      this.c.remove(id);
      this.svoi.delete(id);
    }
    this.soobshchenie = null;
  }

  /** Сбросить выбор целиком. */
  sbrosit(): void {
    while (this.vybrany.length > 0) this.otmenit();
  }

  /* ── Сцена ────────────────────────────────────────────── */

  /** Сцена для рисования: тело, выбранные точки, сечение и плоскость. */
  scena(): Scena {
    const poly = this.poly;
    const telo = teloIzMnogogrannika(poly);
    const verts = poly.vertices.map((v) => toArray(v.p) as V);
    const razmer = razmerTochek(verts);
    const vybrany = new Set(this.vybrany);
    const r = this.rezultat;
    const vershinySecheniya = new Set(r?.vertexIds ?? []);
    const metki: Metka[] = this.c.all().flatMap((o): Metka[] => {
      if (o.kind !== 'point') return [];
      const vershina = o.origin.op === 'vertex';
      if (!vershina && !vybrany.has(o.id) && !vershinySecheniya.has(o.id)) return [];
      return [
        {
          p: toArray(o.p) as V,
          name: o.name,
          vid: vershina ? 'vershina' : 'tochka',
          ...(vybrany.has(o.id) ? { vybrana: true } : {}),
        },
      ];
    });
    const sechenie = r === null ? null : this.sechenie(r);
    return {
      tela: [telo],
      sechenie,
      otrezki: sechenie ? storonySecheniya(sechenie) : [],
      metki,
      ploskost: sechenie ? parallelogramm(sechenie, razmer) : null,
      razmer,
      centr: centroid(verts),
    };
  }

  /* ── Внутреннее ───────────────────────────────────────── */

  private sechenie(r: BuiltThreePointSection): Sechenie | null {
    const poly = this.poly;
    const pl = this.c.plane(r.plane).plane;
    const s = sechenieIzYadra(poly, { ...r.section, kind: 'polygon' }, pl);
    if (s === null) return null;
    s.names = r.vertexIds.map((id) => this.c.point(id).name);
    return s;
  }

  private mozhnoBrat(): boolean {
    if (this.rezultat !== null || this.vybrany.length >= NUZHNO_TOCHEK) {
      this.soobshchenie = {
        vid: 'info',
        text: 'Три точки уже выбраны. Отмените последнюю точку или сбросьте выбор.',
      };
      return false;
    }
    return true;
  }

  private vershina(i: number): ObjId {
    const v = this.poly.vertices[i];
    if (v === undefined) throw new Error(`нет вершины ${i}`);
    return this.c.vertex(v.name);
  }

  /** Уже поставленная точка в этом месте (вершина или точка инструмента). */
  private naMeste(p: V3): ObjId | null {
    const o = this.c
      .all()
      .find(
        (x) =>
          x.kind === 'point' && (x.origin.op === 'vertex' || this.svoi.has(x.id)) && veq(x.p, p),
      );
    return o?.id ?? null;
  }

  private dobavit(id: ObjId, nov: boolean): boolean {
    this.vybrany.push(id);
    if (nov) this.svoi.add(id);
    this.soobshchenie = null;
    if (this.vybrany.length < NUZHNO_TOCHEK) return true;
    const [a, b, c] = this.vybrany as [ObjId, ObjId, ObjId];
    const r = buildThreePointSection(this.c, [a, b, c]);
    if (!r.ok) {
      // Третья точка не подходит: не берём её, объясняем почему.
      this.vybrany.pop();
      if (nov) {
        this.c.remove(id);
        this.svoi.delete(id);
      }
      this.soobshchenie = { vid: 'oshibka', text: r.message };
      return false;
    }
    this.rezultat = r.value;
    if (r.value.note !== undefined) this.soobshchenie = { vid: 'info', text: r.value.note };
    return true;
  }

  private ubratSechenie(): void {
    if (this.rezultat === null) return;
    for (const id of [...this.rezultat.created].reverse()) {
      if (this.c.has(id)) this.c.remove(id);
    }
    this.rezultat = null;
  }
}

/**
 * Секущая плоскость — прямоугольник в её плоскости вокруг сечения с
 * запасом (на чертеже — параллелограмм, выходящий за фигуру, как в
 * учебниках). Стороны — вдоль самой длинной стороны сечения и
 * поперёк неё.
 */
export function parallelogramm(s: Sechenie, razmer: number, zapas = 0.2): V[] {
  const n = s.pts.length;
  let u: V = [1, 0, 0];
  let best = -1;
  for (let i = 0; i < n; i += 1) {
    const d = sub(s.pts[(i + 1) % n] as V, s.pts[i] as V);
    const l = Math.hypot(d[0], d[1], d[2]);
    if (l > best) {
      best = l;
      u = norm(d);
    }
  }
  const w = norm(cross(s.n, u));
  const c = centroid(s.pts);
  let [u0, u1, w0, w1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of s.pts) {
    const d = sub(p, c);
    const x = dot(d, u);
    const y = dot(d, w);
    u0 = Math.min(u0, x);
    u1 = Math.max(u1, x);
    w0 = Math.min(w0, y);
    w1 = Math.max(w1, y);
  }
  const m = zapas * razmer;
  const P = (x: number, y: number): V => add(c, add(scale(u, x), scale(w, y)));
  return [P(u0 - m, w0 - m), P(u1 + m, w0 - m), P(u1 + m, w1 + m), P(u0 - m, w1 + m)];
}
