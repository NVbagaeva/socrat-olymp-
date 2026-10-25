/**
 * Метрики читаемости чертежа на бумаге — общие для движков №3
 * (lib/chertezh3 — многогранники, lib/solid — тела вращения и
 * комбинации).
 *
 * На вход — чертёж на экране: точки с именами, прямые отрезки,
 * основание тела и масштаб «мм на единицу». Движок сам говорит, какие
 * отрезки лежат на одной прямой в пространстве (pryamaya) и на каких
 * отрезках лежит точка (lezhitNa): по картинке этого не понять.
 *
 * Правила (ТЗ «Стереометрия: качество чертежа»):
 *   — вершины не слипаются: две точки дальше 8 % размера фигуры;
 *   — отрезки не сливаются: угол между ними не меньше 12° или
 *     расстояние не меньше 3 мм; у отрезков из общей точки расстояние —
 *     от дальнего конца короткого до другого (веер расходится);
 *   — вершина не у чужого отрезка: дальше 2 мм от отрезка, концом
 *     которого она не служит и на котором не лежит;
 *   — основание не схлопнуто: высота его проекции не меньше 25 %
 *     ширины;
 *   — пропорции рисунка (высота к ширине) от 0,8 до 1,4.
 */

import type { P2 } from './vec';

export const PRAVILA_VIDA = {
  vershiny: 0.08,
  ugol: 12,
  rasstoyanieMm: 3,
  vershinaRebroMm: 2,
  osnovanie: 0.25,
  proporcii: [0.8, 1.4] as const,
} as const;

export interface TochkaVida {
  imya: string;
  p: P2;
}

export interface OtrezokVida {
  imya: string;
  a: P2;
  b: P2;
  /** Имена концов, если концы — точки чертежа. */
  ia: string | null;
  ib: string | null;
  /** Отрезки с одной меткой лежат на одной прямой в пространстве. */
  pryamaya: string;
}

export interface VhodVida {
  tochki: readonly TochkaVida[];
  otrezki: readonly OtrezokVida[];
  /** Какие отрезки проходят через точку в пространстве (по имени точки — имена отрезков). */
  lezhitNa: ReadonlyMap<string, ReadonlySet<string>>;
  /** Проекция основания тела: точки контура. */
  osnovanie: readonly P2[] | null;
  /** Миллиметров бумаги в единице чертежа. */
  mm: number;
  /** Рамка всего рисунка (с кривыми); нет — по отрезкам и точкам. */
  ramka?: { w: number; h: number };
}

export type PraviloVida = 'vershiny' | 'otrezki' | 'vershina-rebro' | 'osnovanie' | 'proporcii';

export interface Narushenie {
  pravilo: PraviloVida;
  chto: string;
}

export interface OtchetVida {
  proporciya: number;
  narusheniya: Narushenie[];
}

export function rasstoyanieDoOtrezka(p: P2, a: P2, b: P2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function peresekayutsya(a: P2, b: P2, c: P2, d: P2): boolean {
  const o = (p: P2, q: P2, r: P2) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

export function rasstoyanieOtrezkov(a: P2, b: P2, c: P2, d: P2): number {
  if (peresekayutsya(a, b, c, d)) return 0;
  return Math.min(
    rasstoyanieDoOtrezka(a, c, d),
    rasstoyanieDoOtrezka(b, c, d),
    rasstoyanieDoOtrezka(c, a, b),
    rasstoyanieDoOtrezka(d, a, b),
  );
}

/** Острый угол между направлениями отрезков, градусы. */
export function ugolMezhdu(a: P2, b: P2, c: P2, d: P2): number {
  const u = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const v = Math.atan2(d[1] - c[1], d[0] - c[0]);
  let x = Math.abs(u - v) % Math.PI;
  if (x > Math.PI / 2) x = Math.PI - x;
  return (x * 180) / Math.PI;
}

/** Рамка чертежа по отрезкам и точкам: ширина и высота, единицы. */
export function ramkaVida(v: Pick<VhodVida, 'tochki' | 'otrezki'>): { w: number; h: number } {
  const pts = v.otrezki.flatMap((o) => [o.a, o.b]).concat(v.tochki.map((t) => t.p));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

/** Проверить вид по правилам: нарушения и пропорция рисунка. */
export function proveritVid(v: VhodVida): OtchetVida {
  const P = PRAVILA_VIDA;
  const out: Narushenie[] = [];
  const { w, h } = v.ramka ?? ramkaVida(v);
  const razmer = Math.max(w, h);
  const { tochki, otrezki, mm } = v;

  for (let i = 0; i < tochki.length; i += 1) {
    for (let j = i + 1; j < tochki.length; j += 1) {
      const a = tochki[i] as TochkaVida;
      const b = tochki[j] as TochkaVida;
      const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]);
      if (d < P.vershiny * razmer) {
        out.push({
          pravilo: 'vershiny',
          chto: `${a.imya} и ${b.imya}: ${((100 * d) / razmer).toFixed(1)} %`,
        });
      }
    }
  }

  for (let i = 0; i < otrezki.length; i += 1) {
    for (let j = i + 1; j < otrezki.length; j += 1) {
      const s = otrezki[i] as OtrezokVida;
      const t = otrezki[j] as OtrezokVida;
      if (s.pryamaya === t.pryamaya) continue;
      const ug = ugolMezhdu(s.a, s.b, t.a, t.b);
      if (ug >= P.ugol) continue;
      const obshchiy =
        s.ia !== null && (s.ia === t.ia || s.ia === t.ib)
          ? s.ia
          : s.ib !== null && (s.ib === t.ia || s.ib === t.ib)
            ? s.ib
            : null;
      let r: number;
      if (obshchiy === null) {
        r = rasstoyanieOtrezkov(s.a, s.b, t.a, t.b) * mm;
      } else {
        const ls = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
        const lt = Math.hypot(t.b[0] - t.a[0], t.b[1] - t.a[1]);
        const [kor, dl] = ls <= lt ? [s, t] : [t, s];
        const dalniy = kor.ia === obshchiy ? kor.b : kor.a;
        r = rasstoyanieDoOtrezka(dalniy, dl.a, dl.b) * mm;
      }
      if (r < P.rasstoyanieMm) {
        out.push({
          pravilo: 'otrezki',
          chto: `${s.imya} и ${t.imya}: ${ug.toFixed(1)}°, ${r.toFixed(1)} мм`,
        });
      }
    }
  }

  for (const t of tochki) {
    const na = v.lezhitNa.get(t.imya);
    for (const o of otrezki) {
      if (o.ia === t.imya || o.ib === t.imya || na?.has(o.imya)) continue;
      const d = rasstoyanieDoOtrezka(t.p, o.a, o.b) * mm;
      if (d < P.vershinaRebroMm) {
        out.push({ pravilo: 'vershina-rebro', chto: `${t.imya} у ${o.imya}: ${d.toFixed(1)} мм` });
      }
    }
  }

  if (v.osnovanie !== null && v.osnovanie.length >= 3) {
    const q = v.osnovanie;
    const bw = Math.max(...q.map((p) => p[0])) - Math.min(...q.map((p) => p[0]));
    const bh = Math.max(...q.map((p) => p[1])) - Math.min(...q.map((p) => p[1]));
    if (bh < P.osnovanie * bw) {
      out.push({
        pravilo: 'osnovanie',
        chto: `высота основания ${((100 * bh) / Math.max(bw, 1e-9)).toFixed(0)} % ширины`,
      });
    }
  }

  const proporciya = h / Math.max(w, 1e-9);
  if (proporciya < P.proporcii[0] || proporciya > P.proporcii[1]) {
    out.push({ pravilo: 'proporcii', chto: `высота к ширине ${proporciya.toFixed(2)}` });
  }
  return { proporciya, narusheniya: out };
}

/**
 * Сжатие высоты, при котором пропорция рисунка попадает в границы:
 * делением пополам (пропорция растёт со сжатием монотонно). 1 — менять
 * не нужно; иначе — до сотых, внутрь границ, не дальше [min, max].
 */
export function podobratSzhatie(
  proporciya: (sz: number) => number,
  min: number,
  max: number,
): number {
  const [niz, verh] = PRAVILA_VIDA.proporcii;
  const p1 = proporciya(1);
  if (p1 >= niz && p1 <= verh) return 1;
  const vysokiy = p1 > verh;
  const cel = vysokiy ? verh : niz;
  let lo = vysokiy ? min : 1;
  let hi = vysokiy ? 1 : max;
  if (vysokiy ? proporciya(lo) > cel : proporciya(hi) < cel) return vysokiy ? lo : hi;
  for (let i = 0; i < 14; i += 1) {
    const m = (lo + hi) / 2;
    if (proporciya(m) > cel) hi = m;
    else lo = m;
  }
  return vysokiy ? Math.floor(lo * 100) / 100 : Math.ceil(hi * 100) / 100;
}
