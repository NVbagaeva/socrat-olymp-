/**
 * Выбор вида чертежа тел вращения и комбинаций (разделы IV–VIII №3):
 * ракурс ortho и, если в сцене нет шара, вертикальный масштаб — по тем
 * же метрикам читаемости, что у многогранников (lib/stereo/metriki.ts).
 *
 * Статичный чертёж вписан в квадрат THEME.geometry.fit и печатается
 * шириной около SHIRINA_MM; метрики считаются в этих миллиметрах.
 * Модель с выбранным видом получает поле rakurs (и сжатые по высоте
 * координаты, если сжатие понадобилось); вид один и на листе, и на
 * сайте, и у живого чертежа в начале вращения.
 */

import type { Body, Model } from './model';
import { orthoAt, ORTHO_AZIMUTH, ORTHO_ELEVATION } from './project';
import { solidKarkas, SOLID_THEME } from './render';
import { type Vec3 } from './vec';
import {
  type Narushenie,
  type OtrezokVida,
  PRAVILA_VIDA,
  podobratSzhatie,
  proveritVid,
} from '../stereo/metriki';

export const SHIRINA_MM = 64;

/** Ракурсы по порядку: от вида по умолчанию (28°, 25°) к более далёким. */
export const KAMERY_SOLID: readonly { azimuth: number; elevation: number }[] = (() => {
  const out: { azimuth: number; elevation: number }[] = [];
  const az = [28, 34, 22, 40, 16, 46, 10, 52, 0, -28, -22, -34, -16, -40];
  const el = [25, 20, 30, 16, 35, 12, 40];
  for (const e of el) for (const a of az) out.push({ azimuth: a, elevation: e });
  const dal = (r: { azimuth: number; elevation: number }) =>
    Math.abs(r.azimuth - ORTHO_AZIMUTH) / 6 + Math.abs(r.elevation - ORTHO_ELEVATION) / 4;
  return out.sort((x, y) => dal(x) - dal(y));
})();

export interface MetrikiSolid {
  rakurs: { azimuth: number; elevation: number };
  szhatie: number;
  proporciya: number;
  narusheniya: Narushenie[];
}

const blizko = (a: Vec3, b: Vec3, eps: number) =>
  Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps && Math.abs(a[2] - b[2]) < eps;

function len3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Метрики модели при данном ракурсе (сжатие уже в координатах модели). */
export function metrikiSolid(
  model: Model,
  rakurs: { azimuth: number; elevation: number },
  szhatie = 1,
): MetrikiSolid {
  const view = model.view === 'cabinet' ? undefined : orthoAt(rakurs.azimuth, rakurs.elevation);
  const k = solidKarkas(model, view === undefined ? {} : { view });
  const eps = 1e-6 * Math.max(1, ...k.tochki.map((t) => len3(t.p3)));
  /* Конец отрезка — имя точки чертежа или, без имени, сама точка: общий
     конец двух отрезков узнаётся и у безымянных (вершина конуса). */
  const imya = (p: Vec3) =>
    k.tochki.find((t) => blizko(t.p3, p, eps))?.imya ??
    `@${p.map((x) => Math.round(x / eps) * eps).join(',')}`;
  /* Отрезки одной прямой в пространстве — одна метка. */
  const metki: string[] = [];
  k.otrezki.forEach((s, i) => {
    const d = sub3(s.b3, s.a3);
    const l = len3(d) || 1;
    const off = (p: Vec3) => {
      const w = sub3(p, s.a3);
      const x = (w[0] * d[0] + w[1] * d[1] + w[2] * d[2]) / l;
      return Math.hypot(w[0] - (d[0] * x) / l, w[1] - (d[1] * x) / l, w[2] - (d[2] * x) / l);
    };
    const j = k.otrezki.findIndex((t, m) => m < i && off(t.a3) < eps * 10 && off(t.b3) < eps * 10);
    metki.push(j >= 0 ? (metki[j] as string) : `p${i}`);
  });
  const otrezki: OtrezokVida[] = k.otrezki.map((s, i) => {
    const ia = imya(s.a3);
    const ib = imya(s.b3);
    return {
      imya: `${ia.startsWith('@') ? '·' : ia}${ib.startsWith('@') ? '·' : ib}#${i}`,
      a: s.a,
      b: s.b,
      ia,
      ib,
      pryamaya: metki[i] as string,
    };
  });
  const lezhitNa = new Map<string, Set<string>>();
  for (const t of k.tochki) {
    const na = new Set<string>();
    k.otrezki.forEach((s, i) => {
      const ab = len3(sub3(s.b3, s.a3));
      if (Math.abs(len3(sub3(t.p3, s.a3)) + len3(sub3(s.b3, t.p3)) - ab) < eps * 10) {
        na.add((otrezki[i] as OtrezokVida).imya);
      }
    });
    lezhitNa.set(t.imya, na);
  }
  const fit = SOLID_THEME.geometry.fit + 2 * SOLID_THEME.geometry.pad;
  const otchet = proveritVid({
    tochki: k.tochki.map((t) => ({ imya: t.imya, p: t.p })),
    otrezki,
    lezhitNa,
    osnovanie: k.osnovanie,
    mm: SHIRINA_MM / fit,
    /* Пропорции — по всему чертежу, вместе с эллипсами и контурами. */
    ramka: k.ramka,
  });
  return { rakurs, szhatie, ...otchet };
}

/* ── Сжатие высоты ─────────────────────────────────────────────── */

const zz = (p: Vec3, k: number): Vec3 => [p[0], p[1], p[2] * k];

function szhatTelo(b: Body, k: number): Body {
  switch (b.kind) {
    case 'polyhedron':
      return { ...b, vertices: b.vertices.map((v) => zz(v, k)) };
    case 'cylinder':
      return {
        ...b,
        base: zz(b.base, k),
        h: b.h * k,
        ...(b.liquid === undefined ? {} : { liquid: b.liquid * k }),
      };
    case 'cone':
      return {
        ...b,
        base: zz(b.base, k),
        h: b.h * k,
        ...(b.liquid === undefined ? {} : { liquid: b.liquid * k }),
      };
    case 'sphere':
      return b;
  }
}

/** Модель со сжатой (k < 1) или вытянутой высотой. Шар так не сжать — его модель не меняется. */
export function szhatModel(model: Model, k: number): Model {
  if (k === 1 || model.bodies.some((b) => b.kind === 'sphere')) return model;
  return {
    ...model,
    bodies: model.bodies.map((b) => szhatTelo(b, k)),
    ...(model.marks ? { marks: model.marks.map((m) => ({ ...m, p: zz(m.p, k) })) } : {}),
    ...(model.lines
      ? { lines: model.lines.map((l) => ({ ...l, a: zz(l.a, k), b: zz(l.b, k) })) }
      : {}),
    ...(model.angles
      ? {
          angles: model.angles.map((a) => ({
            ...a,
            at: zz(a.at, k),
            u: zz(a.u, k),
            v: zz(a.v, k),
          })),
        }
      : {}),
    ...(model.sections
      ? { sections: model.sections.map((s) => ({ ...s, points: s.points.map((p) => zz(p, k)) })) }
      : {}),
    ...(model.measures
      ? { measures: model.measures.map((m) => ({ ...m, a: zz(m.a, k), b: zz(m.b, k) })) }
      : {}),
    ...(model.notes ? { notes: model.notes.map((n) => ({ ...n, p: zz(n.p, k) })) } : {}),
  };
}

export interface VybranVidSolid {
  model: Model;
  metriki: MetrikiSolid;
  popytok: number;
}

/** Ограничения сжатия — как у многогранников (lib/chertezh3/vid.ts). */
const SZHATIE = { min: 0.34, max: 2.6 } as const;

/**
 * Вид модели: первый годный ракурс набора с подобранным сжатием (если
 * шара нет). Годного нет — вид с наименьшим числом нарушений: он уходит
 * в отчёт (автотест падает).
 */
export function vybratVidSolid(model: Model): VybranVidSolid {
  const kamery = model.view === 'cabinet' ? [{ azimuth: 0, elevation: 0 }] : KAMERY_SOLID;
  const estShar = model.bodies.some((b) => b.kind === 'sphere');
  let luchshiy: VybranVidSolid | null = null;
  let i = 0;
  for (const rakurs of kamery) {
    i += 1;
    const szhatie = estShar
      ? 1
      : podobratSzhatie(
          (sz) => metrikiSolid(szhatModel(model, sz), rakurs, sz).proporciya,
          SZHATIE.min,
          SZHATIE.max,
        );
    const m = szhatModel(model, szhatie);
    const metriki = metrikiSolid(m, rakurs, szhatie);
    const s = model.view === 'cabinet' ? m : { ...m, rakurs };
    const kand = { model: s, metriki, popytok: i };
    if (metriki.narusheniya.length === 0) return kand;
    if (luchshiy === null || metriki.narusheniya.length < luchshiy.metriki.narusheniya.length) {
      luchshiy = kand;
    }
  }
  return luchshiy as VybranVidSolid;
}

export { PRAVILA_VIDA };
