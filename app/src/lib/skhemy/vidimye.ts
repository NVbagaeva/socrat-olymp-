/**
 * Видимые параметры чертежа: схематично, но верно по смыслу.
 *
 * Чертёж задачи не обязан совпадать с числами один в один — он обязан
 * читаться на листе A4. Окружности радиусов 25 и 4 в точной пропорции —
 * крошечный кружок у большого; отрезки 2 и 12 — подпись «2» не влезает.
 * Поэтому сцену строят по видимым параметрам — подобранным для рисунка,
 * а числа в подписях берут из настоящих (sPodpisyamiIz).
 *
 * Сохраняется всё качественное: касание остаётся касанием, порядок
 * точек, тип фигуры, «что больше» — сжатие монотонно, равные остаются
 * равными. Сглаживаются только крайние пропорции.
 *
 * Пороги — общие для всех чертежей движка; по ним меряет
 * scripts/check-chertezhi-18.mjs (мерки — scripts/lib/mery-chertezha.mjs).
 */

import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from './tipy';

export const POROGI_CHERTEZHA = {
  /** Ширина чертежа на листе генератора, мм (lib/zadanie18/gen/list18.ts). */
  shirinaMm: 62,
  /** Наибольший подписанный отрезок к наименьшему — не больше. */
  otnoshenieOtrezkov: 3,
  /** Наибольший радиус к наименьшему — не больше. */
  otnoshenieRadiusov: 2.5,
  /** Наименьший радиус — доля размера чертежа (большей стороны рамки), не меньше. */
  radiusDolya: 0.09,
  /** Подписанный отрезок на листе, мм, — не короче (подпись в ~3 мм и поля вокруг). */
  otrezokMm: 8,
  /** Угол между линиями чертежа, градусы, — не уже. */
  ugol: 14,
  /** Подписанные точки — не ближе друг к другу, мм. */
  tochkiMm: 3.5,
} as const;

/**
 * Показатель степени, при котором наибольшее к наименьшему из vals
 * станет не больше max: 1 — сжимать не нужно.
 */
export function stepenSzhatiya(vals: readonly number[], max: number): number {
  const pol = vals.filter((v) => v > 0 && Number.isFinite(v));
  if (pol.length < 2) return 1;
  const r = Math.max(...pol) / Math.min(...pol);
  return r <= max ? 1 : Math.log(max) / Math.log(r);
}

/**
 * Сжать пропорции набора положительных величин степенью около их
 * среднего геометрического: v → g·(v / g)^α. Порядок и равенства
 * сохраняются, произведения и отношения — тоже (AP·PB = CP·PD остаётся
 * равенством), неравенство треугольника — тоже (степень α ≤ 1
 * полуаддитивна). Наибольшее к наименьшему — не больше max.
 *
 * proizvodnye — величины чертежа, которые следуют из этих по
 * произведениям и частным (PD = AP·PB / CP): их пропорции учитываются.
 */
export function szhat<K extends string>(
  p: Readonly<Record<string, number>>,
  klyuchi: readonly K[],
  max: number,
  proizvodnye: (x: Readonly<Record<string, number>>) => number[] = () => [],
): Record<string, number> {
  const vals = klyuchi.map((k) => p[k] ?? 0);
  const alpha = stepenSzhatiya([...vals, ...proizvodnye(p)], max);
  if (alpha >= 1) return { ...p };
  const g = Math.exp(vals.reduce((s, v) => s + Math.log(v), 0) / vals.length);
  const out: Record<string, number> = { ...p };
  for (const k of klyuchi) out[k] = g * ((p[k] ?? g) / g) ** alpha;
  return out;
}

/** Ограничить величину отрезком [ot; do]. */
export const vPredelah = (x: number, ot: number, doo: number) => Math.min(doo, Math.max(ot, x));

function teZheTochki(a: Tochki, b: Tochki): boolean {
  const ka = Object.keys(a);
  return (
    ka.length === Object.keys(b).length &&
    ka.every((k) => b[k] !== undefined && a[k]![0] === b[k]![0] && a[k]![1] === b[k]![1])
  );
}

/**
 * Сцена по видимым параметрам с подписями настоящих: у каждой величины
 * (velichina) видимой сцены текст — из точной сцены (по id элемента).
 * Числа на чертеже — из задачи, геометрия — читаемая.
 *
 * Живая схема (опорная задача) так рисуется в начальном положении
 * (и значения под чертежом — тоже из точной);
 * когда точку потянули, подписи снова считаются по чертежу.
 */
export function sPodpisyamiIz(tochnaya: ZhivayaSkhema, vidimaya: ZhivayaSkhema): ZhivayaSkhema {
  if (tochnaya === vidimaya) return tochnaya;
  const teksty = new Map<string, string>();
  const tochnyyKadr = tochnaya.postroit(tochnaya.nachalo);
  for (const el of tochnyyKadr.elementy) if (el.vid === 'velichina') teksty.set(el.id, el.tekst);
  const zamenit = (el: Element): Element =>
    el.vid === 'velichina' && teksty.has(el.id) ? { ...el, tekst: teksty.get(el.id)! } : el;
  return {
    ...vidimaya,
    postroit: (t, rezhim) => {
      const k = vidimaya.postroit(t, rezhim);
      if (!teZheTochki(t, vidimaya.nachalo)) return k;
      /* Значения под чертежом — тоже по числам задачи. */
      return {
        ...k,
        elementy: k.elementy.map(zamenit),
        znacheniya: tochnyyKadr.znacheniya,
        zametka: tochnyyKadr.zametka,
      };
    },
  };
}

/* ── Смысл чертежа: что сжатие менять не вправе ──────────────────── */

const dl = (a: T2, b: T2) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Качественное описание кадра строкой: взаимное положение окружностей
 * (касание, какая больше), точки на окружностях, порядок точек на
 * отрезках, перпендикулярные и параллельные отрезки, тип углов и равные
 * стороны фигур. У чертежа по видимым параметрам оно должно быть тем
 * же, что у чертежа в точной пропорции (тот же разбор — у
 * scripts/check-chertezhi-18.mjs, написанный независимо).
 */
export function smyslKadra(kadr: Kadr): string {
  const el = kadr.elementy;
  const vse: T2[] = [];
  for (const e of el) {
    if (e.vid === 'otrezok') vse.push(e.a, e.b);
    else if (e.vid === 'tochka') vse.push(e.p);
    else if (e.vid === 'okruzhnost') vse.push(e.c);
  }
  const xs = vse.map((p) => p[0]);
  const ys = vse.map((p) => p[1]);
  const L = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
  const eps = 1e-6 * L;
  const okr = el.filter((e): e is Element & { vid: 'okruzhnost' } => e.vid === 'okruzhnost');
  const otr = el.filter(
    (e): e is Element & { vid: 'otrezok' } => e.vid === 'otrezok' && dl(e.a, e.b) > eps,
  );
  const tochki = el.filter(
    (e): e is Element & { vid: 'tochka' } => e.vid === 'tochka' && e.imya !== undefined,
  );
  const out: string[] = [];
  for (let i = 0; i < okr.length; i += 1)
    for (let j = i + 1; j < okr.length; j += 1) {
      const a = okr[i]!;
      const b = okr[j]!;
      const d = dl(a.c, b.c);
      const vn = a.r + b.r;
      const vt = Math.abs(a.r - b.r);
      const k =
        Math.abs(d - vn) < eps
          ? 'kv'
          : Math.abs(d - vt) < eps
            ? 'kn'
            : d > vn
              ? 'vne'
              : d < vt
                ? 'vnu'
                : 'per';
      out.push(`o:${a.id}/${b.id}:${k}${vt < eps ? '=' : a.r > b.r ? '>' : '<'}`);
    }
  for (const c of okr)
    out.push(
      `n:${c.id}:${tochki
        .filter((t) => Math.abs(dl(t.p, c.c) - c.r) < eps)
        .map((t) => t.imya)
        .join(',')}`,
    );
  for (const s of otr) {
    const l2 = dl(s.a, s.b) ** 2;
    const na = tochki
      .map((t) => {
        const u =
          ((t.p[0] - s.a[0]) * (s.b[0] - s.a[0]) + (t.p[1] - s.a[1]) * (s.b[1] - s.a[1])) / l2;
        const q: T2 = [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u];
        return { imya: t.imya, u, d: dl(t.p, q) };
      })
      .filter((x) => x.d < eps && x.u > -1e-6 && x.u < 1 + 1e-6)
      .sort((x, y) => x.u - y.u);
    out.push(`p:${s.id}:${na.map((x) => x.imya).join('-')}`);
  }
  for (let i = 0; i < otr.length; i += 1)
    for (let j = i + 1; j < otr.length; j += 1) {
      const a = otr[i]!;
      const b = otr[j]!;
      const u: T2 = [a.b[0] - a.a[0], a.b[1] - a.a[1]];
      const w: T2 = [b.b[0] - b.a[0], b.b[1] - b.a[1]];
      const n = Math.hypot(...u) * Math.hypot(...w);
      const c = (u[0] * w[0] + u[1] * w[1]) / n;
      const sn = (u[0] * w[1] - u[1] * w[0]) / n;
      if (Math.abs(c) < 1e-6) out.push(`u:${a.id}/${b.id}:perp`);
      else if (Math.abs(sn) < 1e-6) out.push(`u:${a.id}/${b.id}:par`);
    }
  for (const m of el) {
    if (m.vid !== 'mnogougolnik') continue;
    const t = m.tochki;
    const n = t.length;
    const ugly: string[] = [];
    const st: number[] = [];
    for (let k = 0; k < n; k += 1) {
      const a = t[(k + n - 1) % n]!;
      const v = t[k]!;
      const b = t[(k + 1) % n]!;
      const u: T2 = [a[0] - v[0], a[1] - v[1]];
      const w: T2 = [b[0] - v[0], b[1] - v[1]];
      const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
      ugly.push(Math.abs(c) < 1e-6 ? 'p' : c > 0 ? 'o' : 't');
      st.push(dl(v, b));
    }
    const ravnye: string[] = [];
    for (let a = 0; a < n; a += 1)
      for (let b = a + 1; b < n; b += 1)
        if (Math.abs(st[a]! - st[b]!) < eps) ravnye.push(`${a}=${b}`);
    out.push(`f:${m.id}:${n === 3 ? ugly.join('') : ''}:${ravnye.join(',')}`);
  }
  return out.join('|');
}

/** Параметры на доле t пути от p к g (по степени: отношения меняются плавно). */
export function napolovinu(
  p: Readonly<Record<string, number>>,
  g: Readonly<Record<string, number>>,
  t: number,
): Record<string, number> {
  const out: Record<string, number> = { ...p };
  for (const k of Object.keys(g)) {
    const a = p[k];
    const b = g[k]!;
    if (a === undefined) out[k] = b;
    else out[k] = a > 0 && b > 0 ? a ** (1 - t) * b ** t : a + (b - a) * t;
  }
  return out;
}

type Chisla = Readonly<Record<string, number>>;

/**
 * Видимые параметры, которые не меняют смысла чертежа и подписей.
 * g — видимые параметры или кандидаты по порядку предпочтения. Берётся
 * первый кандидат, у сцены которого тот же smyslKadra и те же подписи
 * данных, что у точной; у единственного g пробуются и промежуточные
 * (3/4, 1/2, 1/4 пути к настоящим). Ничего не подошло — настоящие числа.
 */
export function vidimyeSoSmyslom(
  p: Chisla,
  g: Chisla | readonly Chisla[],
  scena: (x: Chisla) => ZhivayaSkhema,
): Chisla {
  if (g === p) return p;
  const opis = (x: Chisla) => {
    const s = scena(x);
    const k = s.postroit(s.nachalo);
    const podpisi = k.elementy
      .filter((e) => e.vid === 'velichina')
      .map((e) => e.id)
      .sort()
      .join(',');
    return `${smyslKadra(k)}#${podpisi}`;
  };
  const nado = opis(p);
  const kandidaty: Chisla[] = Array.isArray(g)
    ? [...(g as readonly Chisla[])]
    : [0.75, 0.5, 0.25].reduce<Chisla[]>(
        (a, t) => [...a, napolovinu(p, g as Chisla, t)],
        [g as Chisla],
      );
  return kandidaty.find((x) => opis(x) === nado) ?? p;
}
