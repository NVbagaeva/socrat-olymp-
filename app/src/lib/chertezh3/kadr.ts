/**
 * Кадр чертежа: всё, что видно при данном ракурсе, в экранных
 * координатах.
 *
 * Один и тот же кадр рисуют интерактивный чертёж (на каждом повороте)
 * и статичный SVG для листа и предпросмотра. Видимость считает ядро
 * (lib/stereo): рёбра тела — по граням или лучом для составного,
 * вспомогательные отрезки — лучом против выпуклых частей тела.
 * Подписи раскладывает ядро: не налезают друг на друга и не ложатся
 * на линии, длина ребра стоит по нормали к ребру снаружи.
 */

import {
  type P2,
  type V,
  add,
  centroid,
  cross,
  dist,
  dot,
  lerp,
  norm,
  scale,
  sub,
} from '@/lib/stereo/vec';
import { bazis, napravlenie, proj, SHKOLNYY, type Rakurs } from '@/lib/stereo/proekciya';
import { razlozhit } from '@/lib/stereo/metki';
import { type Kamera, kuskiOtrezka, zakrytaKemTo } from '@/lib/stereo/vidimost';
import type { Scena3 } from './postroit';
import { type Rol, MNOGOUGOLNIKI, OTREZKI, imyaTex, klyuchOtrezka, razbitImena } from './scenariy';

export type VidLinii = 'rebro' | Rol;

interface Svet {
  /** Ссылка: id элемента, ключ ребра «A-B», имя точки, id данного. */
  ref: string;
  yarko: boolean;
  tusklo: boolean;
}

export interface LiniyaKadra extends Svet {
  a: P2;
  b: P2;
  vidno: boolean;
  vid: VidLinii;
}

export interface ZalivkaKadra extends Svet {
  pts: P2[];
}

/** Ломаная: дуга угла, знак прямого угла. */
export interface PutKadra extends Svet {
  pts: P2[];
  vidno: boolean;
}

export interface TochkaKadra extends Svet {
  p: P2;
}

export type VidPodpisi = 'imya' | 'dannoe' | 'oboznachenie';

export interface PodpisKadra extends Svet {
  /** Ключ подписи — устойчив между кадрами (раскладка и DOM). */
  klyuch: string;
  tex: string;
  vid: VidPodpisi;
  /** Левый верхний угол и размер, px. */
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  /** Точка закрыта телом от зрителя: подпись видна, но бледнее. */
  skryta?: boolean;
}

export interface Kadr {
  W: number;
  H: number;
  linii: LiniyaKadra[];
  zalivki: ZalivkaKadra[];
  puti: PutKadra[];
  tochki: TochkaKadra[];
  podpisi: PodpisKadra[];
}

export interface OpciiKadra {
  rakurs?: Rakurs;
  /** Вертикальный масштаб тела (сценарий, szhatie): по умолчанию — из сценария. */
  szhatie?: number;
  /** Показывать вспомогательные построения (лист учителя, переключатель). */
  vspom: boolean;
  /** Подсветка шага решения: ссылки на элементы. Пусто — без подсветки. */
  podsvetka?: readonly string[] | null;
  shirina: number;
  /**
   * Высота окна. Задана — масштаб постоянный при любом ракурсе
   * (интерактив: фигура не «дышит» при вращении). Не задана — чертёж
   * вписывается по ширине, высота считается (лист, предпросмотр).
   */
  vysota?: number;
  kegl: number;
  /** Размер подписи по TeX: в браузере — замер KaTeX, иначе оценка. */
  razmer?: (tex: string, vid: VidPodpisi) => { w: number; h: number };
  /** Направления подписей прошлого кадра — чтобы не прыгали. */
  prezhnie?: ReadonlyMap<string, number>;
}

/** Оценка ширины TeX-подписи без браузера. */
export function ocenkaRazmera(tex: string, kegl: number): { w: number; h: number } {
  const plain = tex
    .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\^\\circ/g, '°')
    .replace(/\{,\}/g, ',')
    .replace(/\\[a-zA-Z]+/g, 'x')
    .replace(/[{}^]/g, '');
  const sub = /_\{?(\w+)\}?/.exec(plain);
  const base = plain.replace(/_\{?\w+\}?/, '');
  const w = kegl * (0.6 * base.length + 0.42 * (sub?.[1]?.length ?? 0)) + 2;
  const h = kegl * (/\\frac/.test(tex) ? 1.9 : 1.2);
  return { w, h };
}

/** Ссылка на ребро «AB1» или «A-B1» → ключ «A-B1». */
function klyuchRebra(ref: string): string | null {
  if (ref.includes('-')) {
    const [a, b] = ref.split('-');
    return a && b ? klyuchOtrezka(a, b) : null;
  }
  const n = razbitImena(ref);
  return n.length === 2 && n.join('') === ref
    ? klyuchOtrezka(n[0] as string, n[1] as string)
    : null;
}

/**
 * Вид чертежа: ракурс и вертикальный масштаб sz. Чертёж сцены со
 * сжатой высотой — это проекция образа S·p, S = diag(1, 1, sz). Луч к
 * зрителю k в сжатой сцене — это луч S⁻¹k в исходной, а лицевая грань
 * остаётся лицевой (n·S⁻¹k = S⁻ᵀn·k). Поэтому видимость считается
 * по самой сцене с камерой S⁻¹k, а на экран идёт S·p.
 */
export function vidKadra(rakurs: Rakurs, sz: number): { kam: Kamera; raw: (p: V) => P2 } {
  const k = napravlenie(rakurs);
  const b = bazis(k);
  const kam: Kamera = { vid: 'orto', k: norm([b.k[0], b.k[1], b.k[2] / sz]) };
  return { kam, raw: (p: V) => proj(b, [p[0], p[1], p[2] * sz]) };
}

/** Масштаб и сдвиг кадра по ширине: те же формулы, что у листа. */
export function vpisat(
  pts2: readonly P2[],
  W: number,
  kegl: number,
): { s: number; ox: number; oy: number; H: number } {
  const pole = kegl * 2.2;
  const xs = pts2.map((p) => p[0]);
  const ys = pts2.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const maxH = W * 1.15;
  const s = Math.min(
    (W - 2 * pole) / Math.max(x1 - x0, 1e-9),
    (maxH - 2 * pole) / Math.max(y1 - y0, 1e-9),
  );
  return {
    s,
    ox: (W - (x1 - x0) * s) / 2 - x0 * s,
    oy: pole - y0 * s,
    H: Math.round((y1 - y0) * s + 2 * pole),
  };
}

export function kadr(scena: Scena3, o: OpciiKadra): Kadr {
  const sc = scena.sc;
  const rakurs = o.rakurs ?? sc.rakurs ?? SHKOLNYY;
  const { kam, raw } = vidKadra(rakurs, o.szhatie ?? sc.szhatie ?? 1);
  const eps = scena.geom.razmer * 1e-7;
  const chasti = scena.telo.chasti;

  /* Подсветка: что ярко. Концы подсвеченных отрезков и вершины
     подсвеченных многоугольников тоже ярко подписаны. */
  const H = new Set(o.podsvetka ?? []);
  const yarkieTochki = new Set<string>();
  const yarkieRebra = new Set<string>();
  for (const ref of H) {
    const el = scena.elementy.find((e) => e.el.id === ref);
    if (el) {
      el.el.tochki.forEach((t) => yarkieTochki.add(t));
      continue;
    }
    if (scena.tochki.has(ref)) {
      yarkieTochki.add(ref);
      continue;
    }
    const kr = klyuchRebra(ref);
    if (kr) {
      yarkieRebra.add(kr);
      kr.split('-').forEach((t) => yarkieTochki.add(t));
    }
  }
  const est = H.size > 0;
  const svet = (ref: string, yarko: boolean): Svet => ({ ref, yarko, tusklo: est && !yarko });

  const vidimElement = (rol: Rol, id: string) => rol === 'uslovie' || o.vspom || H.has(id);

  /* ── 3D-примитивы ─────────────────────────────────────────── */
  const linii3: { a: V; b: V; vidno: boolean; vid: VidLinii; s: Svet }[] = [];
  for (const l of scena.telo.linii(kam)) {
    linii3.push({
      a: l.a,
      b: l.b,
      vidno: l.vidno,
      vid: 'rebro',
      s: svet(l.id, yarkieRebra.has(l.id)),
    });
  }
  const zalivki3: { pts: V[]; s: Svet }[] = [];
  const puti3: { pts: V[]; vidno: boolean; s: Svet }[] = [];
  const otrezok = (a: V, c: V, vid: VidLinii, s: Svet) => {
    for (const q of kuskiOtrezka(a, c, chasti, kam, eps)) {
      linii3.push({ a: lerp(a, c, q.t0), b: lerp(a, c, q.t1), vidno: q.vidno, vid, s });
    }
  };
  const ugolRazmer = scena.geom.razmer * 0.07;
  for (const e of scena.elementy) {
    if (!vidimElement(e.rol, e.el.id)) continue;
    const s = svet(e.el.id, H.has(e.el.id));
    if (OTREZKI.includes(e.el.vid)) {
      otrezok(e.pts[0] as V, e.pts[1] as V, e.rol, s);
    } else if (MNOGOUGOLNIKI.includes(e.el.vid)) {
      zalivki3.push({ pts: e.pts, s });
      e.pts.forEach((p, i) => otrezok(p, e.pts[(i + 1) % e.pts.length] as V, e.rol, s));
    } else {
      const [p, v, q] = e.pts as [V, V, V];
      const u1 = norm(sub(p, v));
      const u2 = norm(sub(q, v));
      const r = Math.min(ugolRazmer, dist(p, v) * 0.35, dist(q, v) * 0.35);
      let pts: V[];
      if (e.el.vid === 'pryamoy-ugol') {
        pts = [add(v, scale(u1, r)), add(v, add(scale(u1, r), scale(u2, r))), add(v, scale(u2, r))];
      } else {
        // Дуга в плоскости угла: от u1 к u2.
        const n = cross(u1, u2);
        const w = norm(cross(n, u1));
        const ug = Math.acos(Math.max(-1, Math.min(1, dot(u1, u2))));
        pts = Array.from({ length: 13 }, (_, i) => {
          const t = (ug * i) / 12;
          return add(v, add(scale(u1, r * 1.4 * Math.cos(t)), scale(w, r * 1.4 * Math.sin(t))));
        });
      }
      const mid = pts[Math.floor(pts.length / 2)] as V;
      puti3.push({ pts, vidno: !zakrytaKemTo(mid, chasti, kam, eps), s });
    }
  }

  /* Точки: вершины с именами и показанные дополнительные. */
  const tochki3 = [...scena.tochki.values()].filter(
    (t) => t.pokazat && (t.rol === 'vershina' || vidimElement(t.rol, t.imya)),
  );

  /* ── Экран ────────────────────────────────────────────────── */
  let s = 1;
  let ox = 0;
  let oy = 0;
  const W = o.shirina;
  let Hh: number;
  if (o.vysota !== undefined) {
    Hh = o.vysota;
    // Центр — середина габарита: шар вокруг него наименьший, и фигура
    // при любом повороте помещается в окно одним масштабом.
    const vse = [...scena.tochki.values()].map((t) => t.p);
    for (const bl of scena.geom.bloki) vse.push(bl.p, add(bl.p, bl.d));
    const os = (i: 0 | 1 | 2) => {
      const xs = vse.map((p) => p[i]);
      return (Math.min(...xs) + Math.max(...xs)) / 2;
    };
    const c: V = vse.length > 0 ? [os(0), os(1), os(2)] : scena.geom.centr;
    const sz = o.szhatie ?? sc.szhatie ?? 1;
    const R = Math.max(
      ...vse.map((p) => dist([p[0], p[1], p[2] * sz], [c[0], c[1], c[2] * sz])),
      1e-9,
    );
    s = (Math.min(W, Hh) / 2 - o.kegl * 1.5) / R;
    const c2 = raw(c);
    ox = W / 2 - c2[0] * s;
    oy = Hh / 2 - c2[1] * s;
  } else {
    const pts2 = linii3.flatMap((l) => [raw(l.a), raw(l.b)]).concat(tochki3.map((t) => raw(t.p)));
    ({ s, ox, oy, H: Hh } = vpisat(pts2, W, o.kegl));
  }
  const P = (p: V): P2 => {
    const q = raw(p);
    return [q[0] * s + ox, q[1] * s + oy];
  };

  const linii: LiniyaKadra[] = bezPovtorov(
    linii3.map((l) => ({
      a: P(l.a),
      b: P(l.b),
      vidno: l.vidno,
      vid: l.vid,
      ...l.s,
    })),
  );
  const zalivki: ZalivkaKadra[] = zalivki3.map((z) => ({ pts: z.pts.map(P), ...z.s }));
  const puti: PutKadra[] = puti3.map((z) => ({ pts: z.pts.map(P), vidno: z.vidno, ...z.s }));
  const tochki: TochkaKadra[] = tochki3
    .filter((t) => t.rol !== 'vershina')
    .map((t) => ({ p: P(t.p), ...svet(t.imya, yarkieTochki.has(t.imya)) }));

  /* ── Подписи ──────────────────────────────────────────────── */
  const centr2 = P(scena.geom.centr);
  const razmer = o.razmer ?? ((tex: string) => ocenkaRazmera(tex, o.kegl));
  interface Zad {
    klyuch: string;
    tex: string;
    vid: VidPodpisi;
    p: P2;
    pref?: P2;
    zapas?: P2[];
    s: Svet;
    skryta?: boolean;
  }
  /* Точка закрыта от зрителя, если все куски линий, сходящихся в ней,
     невидимы (вершина тела: её рёбра — пунктир). Точка без линий —
     по лучу к зрителю. */
  const skrytaTochka = (p2: P2, p3: V): boolean => {
    const u = linii.filter(
      (l) =>
        Math.hypot(l.a[0] - p2[0], l.a[1] - p2[1]) < 0.75 ||
        Math.hypot(l.b[0] - p2[0], l.b[1] - p2[1]) < 0.75,
    );
    return u.length > 0 ? u.every((l) => !l.vidno) : zakrytaKemTo(p3, chasti, kam, eps);
  };
  const zad: Zad[] = [];
  for (const t of tochki3) {
    zad.push({
      klyuch: `t:${t.imya}`,
      tex: imyaTex(t.imya),
      vid: 'imya',
      p: P(t.p),
      s: svet(t.imya, yarkieTochki.has(t.imya)),
      ...(skrytaTochka(P(t.p), t.p) ? { skryta: true } : {}),
    });
  }
  /** Подпись у отрезка: в середине, по нормали наружу от центра фигуры. */
  const uOtrezka = (a: V, c: V): { p: P2; pref: P2; zapas: P2[] } => {
    const A = P(a);
    const C = P(c);
    const m: P2 = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    let nrm: P2 = [-(C[1] - A[1]), C[0] - A[0]];
    const l = Math.hypot(nrm[0], nrm[1]) || 1;
    nrm = [nrm[0] / l, nrm[1] / l];
    if ((m[0] - centr2[0]) * nrm[0] + (m[1] - centr2[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
    const vdol = (t: number): P2 => [A[0] + (C[0] - A[0]) * t, A[1] + (C[1] - A[1]) * t];
    return { p: m, pref: nrm, zapas: [vdol(0.32), vdol(0.68), vdol(0.2), vdol(0.8)] };
  };
  const tp = (n: string) => scena.tochki.get(n)?.p;
  for (const d of sc.dannye ?? []) {
    const na = d.na;
    let pos: { p: P2; pref?: P2; zapas?: P2[] } | null = null;
    let yarko = H.has(d.id);
    if ('otrezok' in na) {
      const [a, c] = [tp(na.otrezok[0]), tp(na.otrezok[1])];
      if (a && c) pos = uOtrezka(a, c);
      yarko ||= yarkieRebra.has(klyuchOtrezka(na.otrezok[0], na.otrezok[1]));
    } else if ('ugol' in na) {
      const [a, v, c] = na.ugol.map(tp);
      if (a && v && c) {
        const bis = norm(add(norm(sub(a, v)), norm(sub(c, v))));
        const r = Math.min(ugolRazmer * 2.6, dist(a, v) * 0.5, dist(c, v) * 0.5);
        pos = { p: P(add(v, scale(bis, r))) };
      }
    } else {
      const e = scena.elementy.find((x) => x.el.id === na.element);
      if (e) {
        pos =
          e.pts.length === 2 ? uOtrezka(e.pts[0] as V, e.pts[1] as V) : { p: P(centroid(e.pts)) };
        yarko ||= H.has(e.el.id);
      }
    }
    if (pos) {
      zad.push({ klyuch: `d:${d.id}`, tex: d.tekst, vid: 'dannoe', ...pos, s: svet(d.id, yarko) });
    }
  }
  for (const e of scena.elementy) {
    if (!e.el.podpis || !vidimElement(e.rol, e.el.id)) continue;
    const pos =
      e.pts.length === 2 ? uOtrezka(e.pts[0] as V, e.pts[1] as V) : { p: P(centroid(e.pts)) };
    zad.push({
      klyuch: `e:${e.el.id}`,
      tex: e.el.podpis,
      vid: 'oboznachenie',
      ...pos,
      s: svet(e.el.id, H.has(e.el.id)),
    });
  }
  const razmery = zad.map((z) => razmer(z.tex, z.vid));
  const segs = linii
    .map((l) => [l.a, l.b] as const)
    .concat(puti.flatMap((pt) => pt.pts.slice(1).map((q, i) => [pt.pts[i] as P2, q] as const)));
  const pol = razlozhit(
    zad.map((z, i) => ({
      p: z.p,
      w: razmery[i]?.w ?? 10,
      h: razmery[i]?.h ?? 10,
      pref: z.pref,
      zapas: z.zapas,
    })),
    segs,
    centr2,
    zad.map((z) => o.prezhnie?.get(z.klyuch)),
    Math.max(3, o.kegl * 0.28),
    { koltsa: [1, 1.8, 2.8, 4, 5.5, 7], shtrafLinii: 60 },
  );
  const podpisi: PodpisKadra[] = zad.map((z, i) => ({
    klyuch: z.klyuch,
    tex: z.tex,
    vid: z.vid,
    x: pol[i]?.x ?? 0,
    y: pol[i]?.y ?? 0,
    w: razmery[i]?.w ?? 10,
    h: razmery[i]?.h ?? 10,
    dir: pol[i]?.dir ?? 0,
    ...z.s,
    ...(z.skryta === true ? { skryta: true } : {}),
  }));

  return { W, H: Hh, linii, zalivki, puti, tochki, podpisi };
}

/* ── Один отрезок — одна линия ─────────────────────────────────────
   Один и тот же отрезок может прийти дважды: диагональ условия и
   сторона треугольника построения (AC₁ и треугольник ACC₁). Невидимые
   копии навстречу друг другу дают штрихи со сдвигом фазы, и пунктир на
   глаз сливается в сплошную. Поэтому каждая линия идёт в одну сторону
   (слева направо, сверху вниз), а отрезок условия или построения,
   лежащий на другом таком же с той же видимостью, рисуется один раз —
   остаётся яркий, затем не тусклый, затем отрезок условия (он толще),
   при равенстве — позже в списке (лёг бы сверху). */

const RANG = (l: LiniyaKadra) =>
  (l.yarko ? 4 : 0) + (l.tusklo ? 0 : 2) + (l.vid === 'uslovie' ? 1 : 0);

function vPoryadke(l: LiniyaKadra): LiniyaKadra {
  const naoborot = l.a[0] > l.b[0] + 1e-9 || (Math.abs(l.a[0] - l.b[0]) <= 1e-9 && l.a[1] > l.b[1]);
  return naoborot ? { ...l, a: l.b, b: l.a } : l;
}

/** Отрезок s лежит на t (на чертеже, допуск d единиц). */
function lezhitNa(s: LiniyaKadra, t: LiniyaKadra, d: number): boolean {
  const ab = [t.b[0] - t.a[0], t.b[1] - t.a[1]] as const;
  const l2 = ab[0] * ab[0] + ab[1] * ab[1];
  if (l2 < 1e-12) return false;
  const du = d / Math.sqrt(l2);
  return [s.a, s.b].every((p) => {
    const u = ((p[0] - t.a[0]) * ab[0] + (p[1] - t.a[1]) * ab[1]) / l2;
    const qx = t.a[0] + ab[0] * u - p[0];
    const qy = t.a[1] + ab[1] * u - p[1];
    return u >= -du && u <= 1 + du && Math.hypot(qx, qy) <= d;
  });
}

function bezPovtorov(linii: LiniyaKadra[]): LiniyaKadra[] {
  const out = linii.map(vPoryadke);
  const lishniy = new Set<number>();
  out.forEach((s, i) => {
    if (s.vid === 'rebro') return;
    out.forEach((t, j) => {
      if (i === j || lishniy.has(j) || t.vid === 'rebro' || s.vidno !== t.vidno) return;
      if (!lezhitNa(s, t, 0.05)) return;
      const ravny = lezhitNa(t, s, 0.05);
      if (!ravny || RANG(t) > RANG(s) || (RANG(t) === RANG(s) && j > i)) lishniy.add(i);
    });
  });
  return out.filter((_, i) => !lishniy.has(i));
}
