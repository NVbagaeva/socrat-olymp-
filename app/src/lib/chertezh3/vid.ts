/**
 * Выбор вида чертежа многогранника: ракурс и вертикальный масштаб по
 * метрикам читаемости (lib/stereo/metriki.ts).
 *
 * Метрики считаются на бумаге: кадр шириной SHIRINA печатается шириной
 * SHIRINA_MM (лист №3, lib/zadanie3/pechat.ts), по чертежу учителя —
 * со всеми построениями: вид один на оба листа. Пропорции (высота
 * рисунка к ширине 0,8–1,4) держит сжатие высоты тела, а у плоского
 * тела — вытягивание, не больше чем в 2,6 раза; числа условия при этом
 * истинные, такие варианты попадают в отчёт «пропорции изменены».
 *
 * Перебираются ракурсы набора KAMERY — от школьного (спереди справа
 * сверху) к более далёким; для каждого подбирается сжатие. Берётся
 * первый годный; если годного нет — вид с наименьшим числом нарушений,
 * и он уходит в отчёт (автотест падает).
 */

import { type P2, type V, dist, dot, len, norm, sub } from '@/lib/stereo/vec';
import { SHKOLNYY, type Rakurs } from '@/lib/stereo/proekciya';
import {
  type Narushenie,
  type OtrezokVida,
  PRAVILA_VIDA,
  podobratSzhatie,
  proveritVid,
} from '@/lib/stereo/metriki';
import { vidKadra, vpisat } from './kadr';
import { type Scena3 } from './postroit';
import { MNOGOUGOLNIKI, OTREZKI, type Scenariy } from './scenariy';

/** Ширина кадра листа и ширина рисунка на бумаге (lib/zadanie3/pechat.ts). */
export const SHIRINA = 280;
export const KEGL = 15;
export const SHIRINA_MM = 64;

export const PRAVILA = {
  ...PRAVILA_VIDA,
  /** Сжатие высоты — не сильнее, чем втрое; вытягивание плоского тела — до 2,6. */
  szhatieMin: 0.34,
  szhatieMax: 2.6,
} as const;

/** Ракурсы по порядку: от школьного (24°, 24°) к более далёким; отрицательный азимут — слева. */
export const KAMERY: readonly Rakurs[] = (() => {
  const out: Rakurs[] = [];
  const az = [24, 30, 18, 36, 14, 42, 10, 48, 6, 0, -24, -30, -18, -36, 54, 60, -42, -6];
  const vys = [24, 20, 28, 16, 32, 36, 12, 40];
  for (const v of vys) for (const a of az) out.push({ azimut: a, vysota: v });
  const dal = (r: Rakurs) =>
    Math.abs(r.azimut - SHKOLNYY.azimut) / 6 + Math.abs(r.vysota - SHKOLNYY.vysota) / 4;
  return out.sort((x, y) => dal(x) - dal(y));
})();

export type { Narushenie };

export interface Metriki {
  rakurs: Rakurs;
  szhatie: number;
  /** Высота рисунка к ширине. */
  proporciya: number;
  narusheniya: Narushenie[];
}

interface Otrezok3 {
  a: V;
  b: V;
  imya: string;
}

/** Отрезки чертежа учителя: рёбра тела целиком и стороны элементов, без повторов. */
function otrezkiSceny(scena: Scena3): Otrezok3[] {
  const out: Otrezok3[] = [];
  const eps = scena.geom.razmer * 1e-6;
  const dobavit = (a: V, b: V, imya: string) => {
    if (dist(a, b) < eps) return;
    const est = out.some(
      (o) =>
        (dist(o.a, a) < eps && dist(o.b, b) < eps) || (dist(o.a, b) < eps && dist(o.b, a) < eps),
    );
    if (!est) out.push({ a, b, imya });
  };
  /* Куски одного ребра лежат на одной прямой: ребро — от крайнего до крайнего. */
  const rebra = new Map<string, { a: V; b: V }>();
  for (const l of scena.telo.linii({ vid: 'orto', k: [0, -1, 0] })) {
    const r = rebra.get(l.id);
    if (r === undefined) {
      rebra.set(l.id, { a: l.a, b: l.b });
      continue;
    }
    const d = sub(r.b, r.a);
    const t = (p: V) => dot(sub(p, r.a), d);
    const pts = [r.a, r.b, l.a, l.b].sort((x, y) => t(x) - t(y));
    rebra.set(l.id, { a: pts[0] as V, b: pts[3] as V });
  }
  for (const [id, r] of rebra) dobavit(r.a, r.b, id);
  for (const e of scena.elementy) {
    if (OTREZKI.includes(e.el.vid)) {
      dobavit(e.pts[0] as V, e.pts[1] as V, e.el.id);
    } else if (MNOGOUGOLNIKI.includes(e.el.vid)) {
      e.pts.forEach((p, i) => dobavit(p, e.pts[(i + 1) % e.pts.length] as V, `${e.el.id}${i + 1}`));
    }
  }
  return out;
}

/** Метки прямых: отрезки на одной прямой в пространстве получают одну. */
function metkiPryamyh(otrezki: readonly Otrezok3[], eps: number): string[] {
  const metki: string[] = [];
  otrezki.forEach((s, i) => {
    const d = norm(sub(s.b, s.a));
    const off = (p: V) => {
      const w = sub(p, s.a);
      const x = dot(w, d);
      return len([w[0] - d[0] * x, w[1] - d[1] * x, w[2] - d[2] * x]);
    };
    const j = otrezki.findIndex((t, k) => k < i && off(t.a) < eps && off(t.b) < eps);
    metki.push(j >= 0 ? (metki[j] as string) : `p${i}`);
  });
  return metki;
}

/** Метрики вида: нарушения правил при данном ракурсе и сжатии. */
export function metrikiVida(scena: Scena3, rakurs: Rakurs, szhatie: number): Metriki {
  const eps = scena.geom.razmer * 1e-6;
  const vse = [...scena.tochki.values()];
  const tochki = vse.filter((t) => t.pokazat);
  const imyaTochki = (p: V) => vse.find((t) => dist(t.p, p) < eps)?.imya ?? null;
  const otrezki = otrezkiSceny(scena);
  const { raw } = vidKadra(rakurs, szhatie);
  const ramka = vpisat(
    otrezki.flatMap((o) => [raw(o.a), raw(o.b)]).concat(tochki.map((t) => raw(t.p))),
    SHIRINA,
    KEGL,
  );
  const P = (p: V): P2 => {
    const q = raw(p);
    return [q[0] * ramka.s + ramka.ox, q[1] * ramka.s + ramka.oy];
  };
  const metki = metkiPryamyh(otrezki, eps * 10);
  const vidOtrezki: OtrezokVida[] = otrezki.map((o, i) => ({
    imya: o.imya,
    a: P(o.a),
    b: P(o.b),
    ia: imyaTochki(o.a),
    ib: imyaTochki(o.b),
    pryamaya: metki[i] as string,
  }));
  const lezhitNa = new Map<string, Set<string>>();
  for (const t of tochki) {
    const na = new Set<string>();
    for (const o of otrezki) {
      if (Math.abs(dist(o.a, t.p) + dist(t.p, o.b) - dist(o.a, o.b)) < eps * 10) na.add(o.imya);
    }
    lezhitNa.set(t.imya, na);
  }
  /* Основание — вершины тела на нижнем уровне. */
  let osnovanie: P2[] | null = null;
  const v = scena.geom.vershiny;
  if (scena.geom.vypukloe && v.length > 0) {
    const zmin = Math.min(...v.map((p) => p[2]));
    osnovanie = v.filter((p) => Math.abs(p[2] - zmin) < eps * 10).map(P);
  }
  const otchet = proveritVid({
    tochki: tochki.map((t) => ({ imya: t.imya, p: P(t.p) })),
    otrezki: vidOtrezki,
    lezhitNa,
    osnovanie,
    mm: SHIRINA_MM / SHIRINA,
  });
  return { rakurs, szhatie, ...otchet };
}

export interface VybranVid {
  rakurs: Rakurs;
  szhatie: number;
  metriki: Metriki;
  /** Номер ракурса в наборе, с которого вид годен (1 — первый). */
  popytok: number;
}

/**
 * Вид чертежа: первый годный ракурс набора (начиная с заданного
 * сценарием, если он есть) с подобранным сжатием.
 */
export function vybratVid(scena: Scena3): VybranVid {
  const svoy = scena.sc.rakurs;
  const kamery = svoy ? [svoy, ...KAMERY] : KAMERY;
  let luchshiy: VybranVid | null = null;
  let i = 0;
  for (const rakurs of kamery) {
    i += 1;
    const szhatie = podobratSzhatie(
      (sz) => metrikiVida(scena, rakurs, sz).proporciya,
      PRAVILA.szhatieMin,
      PRAVILA.szhatieMax,
    );
    const metriki = metrikiVida(scena, rakurs, szhatie);
    const kand = { rakurs, szhatie, metriki, popytok: i };
    if (metriki.narusheniya.length === 0) return kand;
    if (luchshiy === null || metriki.narusheniya.length < luchshiy.metriki.narusheniya.length) {
      luchshiy = kand;
    }
  }
  return luchshiy as VybranVid;
}

/** Сценарий с выбранным видом. */
export function sVidom(sc: Scenariy, vid: Pick<VybranVid, 'rakurs' | 'szhatie'>): Scenariy {
  return {
    ...sc,
    rakurs: vid.rakurs,
    ...(vid.szhatie === 1 ? {} : { szhatie: vid.szhatie }),
  };
}
