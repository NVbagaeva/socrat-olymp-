/**
 * Проверка разметки чертежа: «чертёж — схема, а не масштабный рисунок».
 *
 * Берёт готовый рисунок (сцену, настройки и отчёт движка) и заново, по
 * экранным координатам, проверяет правила читаемости:
 *
 *   ugol       — отмеченный угол (кроме прямого) и угол многоугольника
 *                на экране в пределах MIN_UGOL…MAX_UGOL; значения углов
 *                не спорят с рисунком: острый — острый, тупой — тупой,
 *                меньший по числу не больше большего, равные — равны;
 *   podpis     — рамки подписей не касаются друг друга, линий и дуг;
 *                величина угла стоит рядом со своей дугой или к ней
 *                ведёт выноска;
 *   tochki     — соседние точки одной прямой разнесены не меньше чем
 *                на MIN_DOLYA длины этой прямой;
 *   splyushchen — фигура не сплющена: меньшая сторона рамки не меньше
 *                MIN_FORMAT большей;
 *   struktura  — связи условия выполняются точно: середина — середина,
 *                перпендикуляр — перпендикуляр, биссектриса делит угол
 *                пополам, равные отрезки равны, значок прямого угла —
 *                у угла 90°.
 *
 * Правила не зависят от того, как сцена построена: проверяется то, что
 * увидит ученик. Движок сюда не заглядывает — это взгляд со стороны.
 */

import { angleAt, dist } from './geom';
import { blizhayshee, rectGap } from './kollizii';
import { vidim } from './render';
import { PL } from './stil';
import type { Element, Optsii, Otchet, Rezhim, Scena, T2 } from './types';

export interface Porogi {
  /** Наименьший и наибольший отображаемый угол, градусы. */
  minUgol: number;
  maxUgol: number;
  /** Соседние точки одной прямой: доля её длины. */
  minDolya: number;
  /** Меньшая сторона рамки фигуры к большей. */
  minFormat: number;
  /** Острый и тупой угол отличаются от прямого не меньше чем на столько, градусы. */
  zapasVida: number;
}

/** Пороги автотеста. */
export const RAZMETKA = {
  minUgol: 25,
  maxUgol: 150,
  minDolya: 0.12,
  minFormat: 0.35,
  zapasVida: 0.5,
  /** Подпись величины угла без выноски — не дальше от своей дуги, px. */
  maxOtDugi: 18,
} as const;

export type KodRazmetki = 'ugol' | 'podpis' | 'tochki' | 'splyushchen' | 'struktura';

export interface ProblemaRazmetki {
  kod: KodRazmetki;
  tekst: string;
  /** Насколько правило нарушено — для подбора формы (skhema.ts). */
  shtraf: number;
}

/** Окружность на рисунке: центр и радиус в тех же единицах, что точки. */
export interface KrugRazmetki {
  c: T2;
  r: number;
}

const EPS_UGLA = 0.05;

function tochkiElementa(e: Element): string[] {
  switch (e.tip) {
    case 'otrezok':
    case 'pryamaya':
      return [e.a, e.b];
    case 'prodolzhenie':
      return e.doTochki ? [e.a, e.b, e.doTochki] : [e.a, e.b];
    case 'mnogougolnik':
    case 'oblast':
      return [...e.tochki];
    case 'duga':
      return [e.ot, e.do];
    case 'ugol':
      return [e.a, e.v, e.b];
    case 'tochka':
      return [e.t];
    default:
      return [];
  }
}

/** Градусы из подписи «37°» или «37,5°»; иначе null. */
function gradusy(znachenie: string | undefined): number | null {
  if (znachenie === undefined) return null;
  const m = /^(\d+(?:[.,]\d+)?)°$/.exec(znachenie.trim());
  return m === null ? null : Number((m[1] ?? '').replace(',', '.'));
}

/**
 * Правила геометрии рисунка — общие для автотеста (экранные px) и для
 * подбора формы (сцена, приведённая к размеру рисунка). format:
 * 'ramka' — рамка рисунка как он повёрнут; 'luboy' — при любом
 * повороте (наименьшая ширина фигуры к наибольшей).
 */
export function pravilaGeometrii(
  scena: Scena,
  vidimye: readonly Element[],
  tochka: (n: string) => T2 | undefined,
  krugi: readonly KrugRazmetki[],
  porogi: Porogi,
  format: 'ramka' | 'luboy' = 'ramka',
  imya: (n: string) => string = (n) => n,
): ProblemaRazmetki[] {
  const out: ProblemaRazmetki[] = [];
  const dob = (kod: KodRazmetki, tekst: string, shtraf = 100) => out.push({ kod, tekst, shtraf });
  const E = (n: string): T2 => {
    const p = tochka(n);
    if (p === undefined) throw new Error(`разметка: нет точки ${n}`);
    return p;
  };
  const im = (...n: string[]) => n.map(imya).join('');
  const minUgol = Math.min(porogi.minUgol, scena.minUgol ?? porogi.minUgol);
  const RAZMETKA = { ...porogi, minUgol };

  /* ── Углы ─────────────────────────────────────────────────────── */
  const ugly = vidimye.filter((e): e is Element & { tip: 'ugol' } => e.tip === 'ugol');
  const sChislom: { e: (typeof ugly)[number]; th: number; g: number }[] = [];
  for (const e of ugly) {
    const th = angleAt(E(e.a), E(e.v), E(e.b));
    if (e.pryamoy) {
      if (Math.abs(th - 90) > 0.5)
        dob('struktura', `значок прямого угла при ${imya(e.v)}, а угол ${th.toFixed(1)}°`, 2500);
      continue;
    }
    if (th < RAZMETKA.minUgol - EPS_UGLA)
      dob(
        'ugol',
        `угол ${im(e.a, e.v, e.b)} на чертеже ${th.toFixed(1)}° — меньше ${RAZMETKA.minUgol}°`,
        (RAZMETKA.minUgol - th) ** 2,
      );
    if (th > RAZMETKA.maxUgol + EPS_UGLA)
      dob(
        'ugol',
        `угол ${im(e.a, e.v, e.b)} на чертеже ${th.toFixed(1)}° — больше ${RAZMETKA.maxUgol}°`,
        (th - RAZMETKA.maxUgol) ** 2,
      );
    const g = gradusy(e.znachenie);
    if (g !== null && g < 180) sChislom.push({ e, th, g });
  }
  /* Настоящие величины углов без подписи (proverki сцены): те же
     правила — вид угла и порядок по величине. */
  for (const p of scena.proverki ?? []) {
    if (!('gradusy' in p) || p.gradusy >= 180) continue;
    const [a, v, b] = p.ugol;
    if (tochka(a) === undefined || tochka(v) === undefined || tochka(b) === undefined) continue;
    if (sChislom.some((x) => x.e.v === v && [x.e.a, x.e.b].sort().join() === [a, b].sort().join()))
      continue;
    sChislom.push({
      e: { tip: 'ugol', a, v, b, znachenie: `${String(p.gradusy).replace('.', ',')}°` },
      th: angleAt(E(a), E(v), E(b)),
      g: p.gradusy,
    });
  }
  for (const { e, th, g } of sChislom) {
    /* Вид угла по числу: прямой — ровно 90°; ближе 3° к прямому — не
       различить, вид не проверяется. */
    const vid = Math.abs(g - 90) < 1e-6 ? 0 : Math.abs(g - 90) < 3 ? null : g < 90 ? -1 : 1;
    if (vid === null) continue;
    const ok = vid === 0 ? Math.abs(th - 90) < 0.5 : vid * (th - 90) >= RAZMETKA.zapasVida - 1e-6;
    if (!ok) {
      const slovo = vid === 0 ? 'прямой' : vid < 0 ? 'острый' : 'тупой';
      dob(
        'ugol',
        `угол ${im(e.a, e.v, e.b)} = ${e.znachenie} — ${slovo}, а на чертеже ${th.toFixed(1)}°`,
        1e5 + 1e3 * (vid === 0 ? (th - 90) ** 2 : (RAZMETKA.zapasVida - vid * (th - 90)) ** 2),
      );
    }
  }
  for (let i = 0; i < sChislom.length; i += 1) {
    for (let j = i + 1; j < sChislom.length; j += 1) {
      const x = sChislom[i]!;
      const y = sChislom[j]!;
      const [m, b] = x.g <= y.g ? [x, y] : [y, x];
      if (Math.abs(m.g - b.g) < 1e-9) {
        if (Math.abs(m.th - b.th) > 0.5)
          dob(
            'ugol',
            `углы ${im(m.e.a, m.e.v, m.e.b)} и ${im(b.e.a, b.e.v, b.e.b)} равны (${m.e.znachenie}), а на чертеже ${m.th.toFixed(1)}° и ${b.th.toFixed(1)}°`,
            1e4 + 1e2 * (m.th - b.th) ** 2,
          );
      } else if (m.th > b.th + 0.5) {
        dob(
          'ugol',
          `угол ${im(m.e.a, m.e.v, m.e.b)} = ${m.e.znachenie} меньше ${im(b.e.a, b.e.v, b.e.b)} = ${b.e.znachenie}, а на чертеже больше (${m.th.toFixed(1)}° и ${b.th.toFixed(1)}°)`,
          1e4 + 1e2 * (m.th - b.th) ** 2,
        );
      }
    }
  }
  /* Углы многоугольников: тот же коридор. Правильные многоугольники с
     большим числом сторон не в счёт — их углы заданы самой фигурой. */
  for (const e of vidimye) {
    if (e.tip !== 'mnogougolnik' || e.tochki.length > 4) continue;
    const n = e.tochki.length;
    for (let i = 0; i < n; i += 1) {
      const th = angleAt(E(e.tochki[(i + n - 1) % n]!), E(e.tochki[i]!), E(e.tochki[(i + 1) % n]!));
      if (th < RAZMETKA.minUgol - EPS_UGLA || th > RAZMETKA.maxUgol + EPS_UGLA)
        dob(
          'ugol',
          `угол фигуры ${im(...e.tochki)} при ${imya(e.tochki[i]!)} на чертеже ${th.toFixed(1)}°`,
          Math.max(RAZMETKA.minUgol - th, th - RAZMETKA.maxUgol) ** 2,
        );
    }
  }

  /* ── Точки на одной прямой ────────────────────────────────────── */
  const vidimyeTochki = new Set<string>();
  for (const e of vidimye) for (const n of tochkiElementa(e)) vidimyeTochki.add(n);
  const bez = new Set(scena.bezPodpisi ?? []);
  const tochki = [...vidimyeTochki].filter((n) => !bez.has(n));
  const otrezki: [T2, T2][] = [];
  for (const e of vidimye) {
    if (e.tip === 'mnogougolnik') {
      const n = e.tochki.length;
      for (let i = 0; i < n; i += 1) otrezki.push([E(e.tochki[i]!), E(e.tochki[(i + 1) % n]!)]);
    } else if (e.tip === 'otrezok') {
      otrezki.push([E(e.a), E(e.b)]);
    } else if (e.tip === 'pryamaya') {
      const a = E(e.a);
      const b = E(e.b);
      const za = e.zaA ?? 0.3;
      const zb = e.zaB ?? 0.3;
      otrezki.push([
        [a[0] - (b[0] - a[0]) * za, a[1] - (b[1] - a[1]) * za],
        [b[0] + (b[0] - a[0]) * zb, b[1] + (b[1] - a[1]) * zb],
      ]);
    } else if (e.tip === 'prodolzhenie' && e.doTochki) {
      otrezki.push([E(e.a), E(e.doTochki)]);
    }
  }
  const proshli = new Set<string>();
  for (const [a, b] of otrezki) {
    const l = dist(a, b);
    if (l < 1) continue;
    const u: T2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    const na: { n: string; t: number }[] = [];
    for (const n of tochki) {
      const p = E(n);
      const dx = p[0] - a[0];
      const dy = p[1] - a[1];
      if (Math.abs(dx * u[1] - dy * u[0]) > 0.6) continue;
      /* Только точки на самой линии, а не на её продолжении (соседняя фигура). */
      const t = dx * u[0] + dy * u[1];
      if (t < -0.6 || t > l + 0.6) continue;
      na.push({ n, t });
    }
    if (na.length < 3) continue;
    na.sort((x, y) => x.t - y.t);
    const dlina = na[na.length - 1]!.t - na[0]!.t;
    for (let i = 0; i + 1 < na.length; i += 1) {
      const d = na[i + 1]!.t - na[i]!.t;
      const klyuch = [na[i]!.n, na[i + 1]!.n].sort().join('|');
      if (d < RAZMETKA.minDolya * dlina - 0.3 && !proshli.has(klyuch)) {
        proshli.add(klyuch);
        dob(
          'tochki',
          `точки ${imya(na[i]!.n)} и ${imya(na[i + 1]!.n)} на одной прямой в ${((d / dlina) * 100).toFixed(0)} % её длины друг от друга`,
          ((RAZMETKA.minDolya - d / dlina) * 100) ** 2 + 4,
        );
      }
    }
  }

  /* ── Фигура не сплющена ───────────────────────────────────────── */
  {
    /* На рисунке может быть несколько фигур (два равных треугольника,
       три вида углов в ряд): правило — для каждой связной фигуры. */
    const rod = new Map<string, string>();
    const koren = (n: string): string => {
      let k = n;
      while (rod.get(k) !== undefined && rod.get(k) !== k) k = rod.get(k)!;
      return k;
    };
    const svyazat = (x: string, y: string) => {
      const kx = koren(x);
      const ky = koren(y);
      rod.set(kx, kx);
      rod.set(ky, kx);
    };
    for (const e of vidimye) {
      const ts = tochkiElementa(e);
      for (const n of ts) svyazat(ts[0]!, n);
    }
    /* Точка на чужой линии привязывает свою фигуру к этой линии. */
    for (const n of vidimyeTochki) {
      const p = E(n);
      for (const e of vidimye) {
        const ts = tochkiElementa(e);
        const pary: [string, string][] =
          e.tip === 'mnogougolnik'
            ? ts.map((x, i) => [x, ts[(i + 1) % ts.length]!])
            : e.tip === 'otrezok' || e.tip === 'pryamaya' || e.tip === 'prodolzhenie'
              ? [[e.a, e.b]]
              : [];
        for (const [x, y] of pary) {
          const a = E(x);
          const b = E(y);
          const l = dist(a, b);
          if (l < 1) continue;
          const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (l * l);
          const cr = Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) / l;
          if (cr < 0.6 && t > -0.01 && t < 1.01) svyazat(x, n);
        }
      }
    }
    const figury = new Map<string, { pts: T2[]; krugi: KrugRazmetki[]; tochki: Set<string> }>();
    const figura = (n: string) => {
      const k = koren(n);
      let f = figury.get(k);
      if (f === undefined) {
        f = { pts: [], krugi: [], tochki: new Set() };
        figury.set(k, f);
      }
      return f;
    };
    for (const n of vidimyeTochki) {
      const f = figura(n);
      f.pts.push(E(n));
      f.tochki.add(n);
    }
    for (const e of vidimye) {
      if (e.tip === 'prodolzhenie' && !e.doTochki) {
        const a = E(e.a);
        const b = E(e.b);
        const k = e.dolya ?? 0.35;
        figura(e.a).pts.push([b[0] + (b[0] - a[0]) * k, b[1] + (b[1] - a[1]) * k]);
      } else if (e.tip === 'pryamaya') {
        const a = E(e.a);
        const b = E(e.b);
        const za = e.zaA ?? 0.3;
        const zb = e.zaB ?? 0.3;
        figura(e.a).pts.push(
          [a[0] - (b[0] - a[0]) * za, a[1] - (b[1] - a[1]) * za],
          [b[0] + (b[0] - a[0]) * zb, b[1] + (b[1] - a[1]) * zb],
        );
      }
    }
    /* Окружность — в фигуре точки, лежащей на ней или в её центре; иначе сама по себе. */
    for (const k of krugi) {
      let svoya: string | null = null;
      for (const n of vidimyeTochki) {
        const d = dist(E(n), k.c);
        if (d < 0.6 || Math.abs(d - k.r) < 0.6) {
          if (svoya === null) svoya = n;
          else svyazat(svoya, n);
        }
      }
      if (svoya !== null) figura(svoya).krugi.push(k);
    }
    /* После привязки окружностей корни могли смениться: собрать заново. */
    const itog = new Map<string, { pts: T2[]; krugi: KrugRazmetki[]; tochki: Set<string> }>();
    for (const [k, f] of figury) {
      const kk = koren(k);
      const g = itog.get(kk);
      if (g === undefined) itog.set(kk, f);
      else {
        g.pts.push(...f.pts);
        g.krugi.push(...f.krugi);
        for (const n of f.tochki) g.tochki.add(n);
      }
    }
    for (const fig of itog.values()) {
      if (fig.pts.length < 2 && fig.krugi.length === 0) continue;
      /* Ширина фигуры вдоль направления t (градусы). */
      const shirina = (t: number) => {
        const c = Math.cos((t * Math.PI) / 180);
        const sn = Math.sin((t * Math.PI) / 180);
        let lo = Infinity;
        let hi = -Infinity;
        for (const p of fig.pts) {
          const x = p[0] * c + p[1] * sn;
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
        for (const k of fig.krugi) {
          const x = k.c[0] * c + k.c[1] * sn;
          lo = Math.min(lo, x - k.r);
          hi = Math.max(hi, x + k.r);
        }
        return hi - lo;
      };
      let lo = Infinity;
      let hi = 0;
      for (let t = 0; t < 180; t += 5) {
        const w = shirina(t);
        lo = Math.min(lo, w);
        hi = Math.max(hi, w);
      }
      /* Все точки на одной прямой (точки на отрезке) — плоско по смыслу. */
      if (lo < 1 && fig.krugi.length === 0) continue;
      let f = lo / Math.max(hi, 1e-9);
      if (format === 'ramka') {
        const w = shirina(0);
        const h = shirina(90);
        f = Math.min(w, h) / Math.max(w, h, 1e-9);
      }
      if (f < RAZMETKA.minFormat - 1e-3)
        dob(
          'splyushchen',
          `фигура ${[...fig.tochki].slice(0, 4).map(imya).join('')} сплющена: стороны рамки относятся как ${f.toFixed(2)}`,
          ((RAZMETKA.minFormat - f) * 100) ** 2 + 4,
        );
    }
  }

  /* ── Структура ────────────────────────────────────────────────── */
  const estTochka = (n: string) => tochka(n) !== undefined;
  for (const n of vidimyeTochki) {
    const opr = scena.tochki[n];
    if (opr === undefined || Array.isArray(opr)) continue;
    if ('seredina' in opr) {
      const [a, b] = opr.seredina as readonly [string, string];
      if (!estTochka(a) || !estTochka(b)) continue;
      const m: T2 = [(E(a)[0] + E(b)[0]) / 2, (E(a)[1] + E(b)[1]) / 2];
      if (dist(m, E(n)) > 0.5) dob('struktura', `${imya(n)} — не середина ${im(a, b)}`);
    } else if ('osnovanie' in opr) {
      const [p, a, b] = opr.osnovanie as readonly [string, string, string];
      if (dist(E(p), E(n)) < 1 || dist(E(a), E(b)) < 1) continue;
      const dal = dist(E(a), E(n)) > dist(E(b), E(n)) ? a : b;
      const th = angleAt(E(p), E(n), E(dal));
      if (Math.abs(th - 90) > 0.2)
        dob('struktura', `${im(p, n)} — не перпендикуляр к ${im(a, b)}: ${th.toFixed(1)}°`);
    } else if ('bissektrisa' in opr) {
      const [v, p, q] = opr.bissektrisa as readonly [string, string, string];
      const t1 = angleAt(E(p), E(v), E(n));
      const t2 = angleAt(E(n), E(v), E(q));
      if (Math.abs(t1 - t2) > 0.2)
        dob('struktura', `${im(v, n)} — не биссектриса: ${t1.toFixed(1)}° и ${t2.toFixed(1)}°`);
    }
  }
  /* Равные отрезки: одинаковое число штрихов — одинаковая длина. */
  const poShtriham = new Map<number, { e: Element & { tip: 'otrezok' }; l: number }[]>();
  for (const e of vidimye) {
    if (e.tip !== 'otrezok' || e.shtrihi === undefined) continue;
    const g = poShtriham.get(e.shtrihi) ?? [];
    g.push({ e, l: dist(E(e.a), E(e.b)) });
    poShtriham.set(e.shtrihi, g);
  }
  for (const g of poShtriham.values()) {
    const ls = g.map((x) => x.l);
    if (Math.max(...ls) - Math.min(...ls) > 0.01 * Math.max(...ls) + 0.5)
      dob(
        'struktura',
        `отрезки с одинаковыми штрихами не равны: ${g.map((x) => `${im(x.e.a, x.e.b)} = ${x.l.toFixed(0)} px`).join(', ')}`,
      );
  }
  for (const p of scena.proverki ?? []) {
    if ('ravny' in p) {
      const ls = p.ravny.map(([a, b]) => dist(E(a), E(b)));
      if (Math.max(...ls) - Math.min(...ls) > 0.01 * Math.max(...ls) + 0.5)
        dob('struktura', `отрезки ${p.ravny.map((x) => im(...x)).join(', ')} не равны`);
    } else if ('parallelny' in p) {
      const [[a, b], [c, d]] = p.parallelny;
      const u = [E(b)[0] - E(a)[0], E(b)[1] - E(a)[1]] as const;
      const w = [E(d)[0] - E(c)[0], E(d)[1] - E(c)[1]] as const;
      const sin = Math.abs(u[0] * w[1] - u[1] * w[0]) / (Math.hypot(...u) * Math.hypot(...w) || 1);
      if (sin > 0.003) dob('struktura', `${im(a, b)} не параллельна ${im(c, d)}`);
    } else if ('vid' in p) {
      const [a, b, c] = p.ugol;
      const th = angleAt(E(a), E(b), E(c));
      const ok =
        p.vid === 'pryamoy' ? Math.abs(th - 90) < 0.2 : p.vid === 'tupoy' ? th > 90.2 : th < 89.8;
      if (!ok) dob('struktura', `угол ${im(a, b, c)} = ${th.toFixed(1)}°, а должен быть ${p.vid}`);
    }
  }
  return out;
}

/** Проверка готового рисунка по отчёту движка: экранные координаты. */
export function proveritRazmetku(scena: Scena, optsii: Optsii, o: Otchet): ProblemaRazmetki[] {
  const rezhim: Rezhim = optsii.rezhim ?? { rezhim: 'uchenik' };
  const vidimye = scena.elementy.filter((e) => vidim(e.sloy ?? 'uslovie', rezhim));
  const imya = (n: string) => optsii.variant?.bukvy[n] ?? n;
  const krugi: KrugRazmetki[] = [];
  for (const p of o.prepyatstviya) if (p.tip === 'krug') krugi.push({ c: p.c, r: p.r });
  const out = pravilaGeometrii(scena, vidimye, (n) => o.ekran[n], krugi, RAZMETKA, 'ramka', imya);
  const dob = (kod: KodRazmetki, tekst: string) => out.push({ kod, tekst, shtraf: 100 });
  const ugly = vidimye.filter((e): e is Element & { tip: 'ugol' } => e.tip === 'ugol');

  /* ── Подписи ──────────────────────────────────────────────────── */
  const pr = (r: Otchet['ramki'][number]) => ({
    left: r.x,
    top: r.y,
    right: r.x + r.w,
    bottom: r.y + r.h,
  });
  for (let i = 0; i < o.ramki.length; i += 1) {
    const r = o.ramki[i]!;
    const b = blizhayshee(pr(r), o.prepyatstviya);
    if (b.min < PL.gap - 1e-6) dob('podpis', `подпись ${r.id} касается: ${b.chto}`);
    for (let j = i + 1; j < o.ramki.length; j += 1) {
      if (rectGap(pr(r), pr(o.ramki[j]!)) < PL.gap - 1e-6)
        dob('podpis', `подписи ${r.id} и ${o.ramki[j]!.id} касаются`);
    }
  }
  for (const p of o.problems) {
    if (/не помещается|задевает/.test(p)) dob('podpis', p);
  }
  /* Величина угла — у своей дуги или с выноской. */
  for (const r of o.ramki) {
    if (r.kind !== 'znachenie') continue;
    const svoi = ugly.filter((e) => e.znachenie === r.id && !e.pryamoy);
    if (svoi.length === 0 || gradusy(r.id) === null) continue;
    /* То же число подписано у дуги окружности или отрезка — рамка может быть их. */
    if (vidimye.some((e) => e.tip !== 'ugol' && e.znachenie === r.id)) continue;
    if (o.vynoski.some((v) => v.id === r.id)) continue;
    const dugi = o.prepyatstviya.filter((p) => svoi.some((e) => p.chto === `дуга угла ${e.v}`));
    if (dugi.length === 0) continue;
    const d = blizhayshee(pr(r), dugi).min;
    if (d > RAZMETKA.maxOtDugi)
      dob('podpis', `величина ${r.id} стоит в ${d.toFixed(0)} px от своей дуги без выноски`);
  }
  for (const p of o.problems) {
    if (/не равны|не параллельна|не на одной прямой|не на окружности|должен быть/.test(p))
      dob('struktura', p);
  }
  return out;
}
