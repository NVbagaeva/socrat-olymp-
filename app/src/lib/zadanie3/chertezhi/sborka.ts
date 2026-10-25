/**
 * Сборка сценария чертежа по разобранному условию.
 *
 * Здесь вторая половина «полуавтомата»: по разбору (razbor.ts)
 * выбираются размеры тела, ставятся подписи данных и элементы
 * условия (искомый отрезок, прямые угла, сечение, многогранник
 * с перечисленными вершинами). Вспомогательные построения и ссылки
 * шагов решения добавляет таблица прототипов (annotacii.ts).
 *
 * Размеры. У тела 1–3 неизвестных измерения (ребро куба; рёбра
 * параллелепипеда; сторона основания и высота). Каждое данное
 * условия — уравнение «длина (площадь, объём, отношение) на чертеже
 * равна данному». Система решается методом Гаусса — Ньютона по
 * логарифмам измерений; если данных меньше, чем измерений, свободные
 * измерения держатся у «школьных» пропорций слабой регуляризацией.
 * Валидатор потом сверяет каждое данное с готовой сценой.
 */

import type { Rakurs } from '@/lib/stereo/proekciya';
import type { V } from '@/lib/stereo/vec';
import {
  type Dannoe,
  type Element,
  type Proverka,
  type Scenariy,
  type TeloScenariya,
  type TochkaScenariya,
  geometriya,
  klyuchOtrezka,
  postroit,
} from '@/lib/chertezh3/sborka-api';
import { obolochka, sechenie } from '@/lib/chertezh3/obolochka';
import type { DannoeUsloviya, Mera, Razbor } from './razbor';

/** Что добавляет таблица прототипов. */
export interface Dobavki {
  tochki?: TochkaScenariya[];
  elementy?: Element[];
  /** Ссылки шагов решения: по массиву id на шаг. */
  shagi?: string[][];
  rakurs?: Rakurs;
  somneniya?: string[];
}

/** Что знает таблица прототипов о сцене, когда добавляет построения. */
export interface Kontekst {
  r: Razbor;
  /** Имена вершин в порядке сборщика (данные условием или школьные). */
  imena: string[];
  /** Вершины нижнего основания. */
  osnovanie: string[];
  /** Вершина пирамиды (у призмы — null). */
  vershina: string | null;
  /** Есть ли уже точка с таким именем. */
  est(imya: string): boolean;
  /** Положение вершины или точки (после подбора размеров). */
  p(imya: string): V | undefined;
  /** id элементов, уже поставленных сборщиком (условие). */
  elementy: string[];
  /** Все вершины тела с именами. */
  vershiny: { imya: string; p: V }[];
}

export interface Sborka {
  scenariy: Scenariy;
  shagi: string[][];
  somneniya: string[];
}

/* ── Тело по измерениям ─────────────────────────────────────── */

/** Произвольный треугольник основания: разносторонний, не прямоугольный. */
const TREUGOLNIK: readonly (readonly [number, number])[] = [
  [0, 0],
  [4.4, 0],
  [1.3, 2.9],
];

interface Shablon {
  izmereniya: number[];
  telo(d: readonly number[]): TeloScenariya;
}

function shablon(r: Razbor): Shablon | null {
  const n = (r.n ?? 4) as 3 | 4 | 6;
  switch (r.telo) {
    case 'kub':
      return { izmereniya: [4], telo: ([a = 4]) => ({ vid: 'kub', a }) };
    case 'parallelepiped':
      return {
        izmereniya: [5, 3.2, 3.4],
        telo: ([a = 5, b = 3, c = 3]) => ({ vid: 'parallelepiped', a, b, c }),
      };
    case 'prizma':
      return {
        izmereniya: n === 3 ? [4, 4.6] : n === 4 ? [3, 4.4] : [2.4, 4.4],
        telo: ([a = 3, h = 4]) => ({ vid: 'prizma', n, a, h }),
      };
    case 'pryamaya-prizma':
      if (r.katety) {
        // Прямой угол при C — спереди слева; CA вдоль фронта, CB вглубь.
        return {
          izmereniya: [r.katety[0], r.katety[1], 4],
          telo: ([a = 3, b = 3, h = 4]) => ({
            vid: 'pryamaya-prizma',
            osnovanie: [
              [a, 0],
              [0, b],
              [0, 0],
            ],
            h,
          }),
        };
      }
      return {
        izmereniya: [1, 4],
        telo: ([s = 1, h = 4]) => ({
          vid: 'pryamaya-prizma',
          osnovanie: TREUGOLNIK.map(([x, y]) => [x * s, y * s] as const),
          h,
        }),
      };
    case 'piramida':
      return {
        izmereniya: n === 3 ? [5, 4.4] : n === 4 ? [4, 4.2] : [3, 4.6],
        telo: ([a = 4, h = 4]) => ({ vid: 'piramida', n, a, h }),
      };
    case 'piramida-proizv':
      return {
        izmereniya: [1, 4],
        telo: ([s = 1, h = 4]) => ({
          vid: 'piramida-proizv',
          osnovanie: TREUGOLNIK.map(([x, y]) => [x * s, y * s] as const),
          vershina: [1.9 * s, 1.0 * s, h],
        }),
      };
    case 'tetraedr':
      return { izmereniya: [4], telo: ([a = 4]) => ({ vid: 'tetraedr', a }) };
    default:
      return null;
  }
}

/* ── Измерения на сцене ─────────────────────────────────────── */

function imenaTela(r: Razbor, t: TeloScenariya): string[] {
  return r.imena ?? geometriya(t).imenaPoUmolchaniyu;
}

/** Значение меры на сцене. «@» — вершина пирамиды. */
function izmerit(
  t: TeloScenariya,
  imena: string[],
  mera: Mera,
  n: number,
  tochki: Razbor['tochki'] = [],
): number {
  const g = geometriya(t);
  const v = (x: string) => g.vershiny[x === '@' ? imena.length - 1 : imena.indexOf(x)];
  const p = (x: string): V | undefined => {
    const t0 = tochki.find((q) => q.imya === x);
    if (t0 === undefined) return v(x);
    const pts = 'centrOsnovaniya' in t0.gde ? g.vershiny.slice(0, n) : t0.gde.seredina.map(v);
    if (pts.some((q) => q === undefined) || pts.length === 0) return undefined;
    const s = (pts as V[]).reduce((a, q) => [a[0] + q[0], a[1] + q[1], a[2] + q[2]] as V, [
      0, 0, 0,
    ] as V);
    return [s[0] / pts.length, s[1] / pts.length, s[2] / pts.length];
  };
  const d = (a: V | undefined, b: V | undefined) =>
    a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : NaN;
  if ('dlina' in mera) return d(p(mera.dlina[0]), p(mera.dlina[1]));
  if ('otnoshenie' in mera) {
    const [[a, b], [c, e]] = mera.otnoshenie;
    return d(p(a), p(b)) / d(p(c), p(e));
  }
  if ('obem' in mera) return g.obem;
  if ('vysota' in mera) return Math.max(...g.vershiny.map((v) => v[2]));
  // Площадь основания: первые n вершин.
  const b = g.vershiny.slice(0, n);
  let s = 0;
  b.forEach((v, i) => {
    const q = b[(i + 1) % b.length] as V;
    s += v[0] * q[1] - q[0] * v[1];
  });
  return Math.abs(s) / 2;
}

/** Степень меры по длине: длина 1, площадь 2, объём 3, отношение 0. */
function stepen(m: Mera): number {
  if ('otnoshenie' in m) return 0;
  if ('obem' in m) return 3;
  if ('ploshchadOsnovaniya' in m) return 2;
  return 1;
}

/** Решить систему «меры = данным» по измерениям (Гаусс — Ньютон в логарифмах). */
export function podobrat(r: Razbor, sh: Shablon, dannye: readonly DannoeUsloviya[]): number[] {
  const n = r.n ?? 4;
  const d0 = [...sh.izmereniya];
  const imena = imenaTela(r, sh.telo(d0));
  const f = (d: readonly number[], m: Mera) => izmerit(sh.telo(d), imena, m, n, r.tochki);
  // Масштаб: подогнать начальное приближение по первому размерному данному.
  const raz = dannye.find((x) => stepen(x.mera) > 0);
  let sigma = 1;
  if (raz) {
    const v = f(d0, raz.mera);
    if (v > 0) sigma = (raz.znachenie / v) ** (1 / stepen(raz.mera));
  }
  if (r.katety) sigma = 1;
  let u = d0.map((x, i) => Math.log(r.katety && i < 2 ? x : x * sigma));
  const ref = u.slice();
  const W = 1e-4;
  const nev = (uu: number[]) => [
    ...dannye.map((x) => Math.log(f(uu.map(Math.exp), x.mera) / x.znachenie)),
    ...uu.map((x, i) => W * (x - (ref[i] as number))),
  ];
  for (let it = 0; it < 60; it += 1) {
    const r0 = nev(u);
    const J = u.map((_, j) => {
      const h = 1e-6;
      const up = u.slice();
      up[j] = (up[j] as number) + h;
      const r1 = nev(up);
      return r1.map((x, i) => (x - (r0[i] as number)) / h);
    });
    // Нормальные уравнения (JᵀJ + λI) δ = −Jᵀr.
    const m = u.length;
    const A = Array.from({ length: m }, (_, a) =>
      Array.from(
        { length: m },
        (_, b) =>
          r0.reduce((s, _x, i) => s + (J[a]?.[i] ?? 0) * (J[b]?.[i] ?? 0), 0) +
          (a === b ? 1e-12 : 0),
      ),
    );
    const g = Array.from(
      { length: m },
      (_, a) => -r0.reduce((s, x, i) => s + (J[a]?.[i] ?? 0) * x, 0),
    );
    const delta = reshit(A, g);
    if (delta === null) break;
    u = u.map((x, i) => x + Math.max(-1, Math.min(1, delta[i] as number)));
    if (Math.max(...delta.map(Math.abs)) < 1e-13) break;
  }
  // Почти круглые числа — круглыми: чтобы сценарий читался глазами.
  return u.map((x) => {
    const d = Math.exp(x);
    const r6 = Math.round(d * 1e6) / 1e6;
    return Math.abs(r6 - d) < 1e-7 * Math.max(1, d) ? r6 : d;
  });
}

/** Гаусс с выбором ведущего элемента. */
function reshit(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i] as number]);
  for (let c = 0; c < n; c += 1) {
    let p = c;
    for (let i = c + 1; i < n; i += 1) if (Math.abs(M[i]![c]!) > Math.abs(M[p]![c]!)) p = i;
    if (Math.abs(M[p]![c]!) < 1e-300) return null;
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let i = 0; i < n; i += 1) {
      if (i === c) continue;
      const k = M[i]![c]! / M[c]![c]!;
      for (let j = c; j <= n; j += 1) M[i]![j] = M[i]![j]! - k * M[c]![j]!;
    }
  }
  return M.map((row, i) => row[n]! / row[i]!);
}

/* ── Крайние пропорции ─────────────────────────────────────── */

/** Больше этого отношения измерений чертёж в истинных размерах не читается. */
export const PREDEL_PROPORCII = 3.2;
/** До какого отношения сжимается такой чертёж. */
export const PREDEL_RISUNKA = 2.6;

const telo0 = (sh: Shablon, d: readonly number[]) => sh.telo(d);

/**
 * Тело с крайними пропорциями (параллелепипед 12 : 1, игла-призма)
 * рисуется не в масштабе, как в учебнике: длинное измерение сжимается
 * до 3 : 1. Числа на чертеже остаются числами условия.
 */
export function neVMasshtabe(t: TeloScenariya): { telo: TeloScenariya; bylo: number } | null {
  const sjat = (xs: number[]) => {
    const mn = Math.min(...xs);
    return xs.map((x) => Math.min(x, mn * PREDEL_RISUNKA));
  };
  if (t.vid === 'parallelepiped') {
    const xs = [t.a, t.b, t.c];
    const bylo = Math.max(...xs) / Math.min(...xs);
    if (bylo <= PREDEL_PROPORCII) return null;
    const [a = t.a, b = t.b, c = t.c] = sjat(xs);
    return { telo: { ...t, a, b, c }, bylo };
  }
  if (t.vid === 'prizma' || t.vid === 'piramida') {
    // Сравнивается высота с поперечником основания, а не со стороной.
    const shir = t.n === 6 ? 2 * t.a : t.a;
    const bylo = Math.max(shir / t.h, t.h / shir);
    if (bylo <= PREDEL_PROPORCII) return null;
    const [s2 = shir, h = t.h] = sjat([shir, t.h]);
    return { telo: { ...t, a: (t.a * s2) / shir, h }, bylo };
  }
  return null;
}

/* ── Сценарий ───────────────────────────────────────────────── */

export interface OpciiSborki {
  id: string;
  alt: string;
  /** Тело задано прямо (ступенчатый многогранник по числам варианта). */
  telo?: TeloScenariya;
  /** Подписи и проверки для заданного прямо тела. */
  dannye?: Dannoe[];
  tochki?: TochkaScenariya[];
  proverki?: Proverka[];
  dobavki?: (k: Kontekst) => Dobavki;
}

export function sobratScenariy(r: Razbor, o: OpciiSborki): Sborka {
  const somneniya = [...r.somneniya];
  let telo: TeloScenariya;
  let uslovnye = false;
  /** false — размеры на чертеже сжаты, длины условия не сверяются. */
  let masshtab = true;
  if (o.telo) {
    telo = o.telo;
  } else {
    const sh = shablon(r);
    if (sh === null) {
      throw new Error(`${o.id}: тело не распознано`);
    }
    const razmernye = r.dannye.filter((x) => stepen(x.mera) > 0);
    if (razmernye.length === 0) uslovnye = true;
    const d = podobrat(r, sh, r.dannye);
    const szhato = neVMasshtabe(telo0(sh, d));
    if (szhato) {
      telo = szhato.telo;
      masshtab = false;
      somneniya.push(
        `чертёж не в масштабе: в истинных размерах ${szhato.bylo.toFixed(1)} : 1, нарисовано ${PREDEL_RISUNKA} : 1 (подписи — числа условия)`,
      );
    } else {
      telo = sh.telo(d);
    }
  }
  const g = geometriya(telo);
  const imena = o.telo && telo.vid === 'sostavnoy' ? [] : imenaTela(r, telo);
  const n = r.n ?? 0;
  const vershina =
    telo.vid === 'piramida' || telo.vid === 'piramida-proizv' || telo.vid === 'tetraedr'
      ? (imena[imena.length - 1] ?? null)
      : null;
  const osnovanie = imena.slice(0, n);
  const zamena = (x: string) => (x === '@' ? (vershina ?? x) : x);

  const tochki: TochkaScenariya[] = [...(o.tochki ?? [])];
  const elementy: Element[] = [];
  const dannye: Dannoe[] = [...(o.dannye ?? [])];
  const proverki: Proverka[] = [...(o.proverki ?? [])];
  const rebra = new Set(g.rebra.map(([a, b]) => klyuchOtrezka(imena[a] ?? '', imena[b] ?? '')));
  const estTochka = (x: string) => imena.includes(x) || tochki.some((t) => t.imya === x);
  const svobodnoe = (pref: string) => {
    for (let i = 1; ; i += 1) if (!estTochka(`${pref}${i}`)) return `${pref}${i}`;
  };
  const centrOsn = (rol: 'uslovie' | 'vspom', imya = 'O') => {
    if (!estTochka(imya)) tochki.push({ imya, gde: { centr: osnovanie }, rol });
    return imya;
  };

  for (const t of r.tochki) {
    tochki.push(
      'centrOsnovaniya' in t.gde
        ? { imya: t.imya, gde: { centr: osnovanie }, rol: 'uslovie' }
        : { imya: t.imya, gde: { seredina: t.gde.seredina }, rol: 'uslovie' },
    );
  }

  /* Данные: подписи и проверки. Отрезок, который не ребро тела,
     рисуется элементом условия (диагональ основания, высота). */
  const dobavitOtrezok = (a: string, b: string, vid: Element['vid'] = 'otrezok'): string => {
    const id = `${a}${b}`;
    if (!elementy.some((e) => e.id === id))
      elementy.push({ id, vid, tochki: [a, b], rol: 'uslovie' });
    return id;
  };
  let nomer = 0;
  const novyyId = () => `d${(nomer += 1)}`;
  r.dannye.forEach((d) => {
    const m = d.mera;
    if ('dlina' in m) {
      const [a, b] = [zamena(m.dlina[0]), zamena(m.dlina[1])];
      proverki.push({ dlina: [a, b], ravno: d.znachenie });
      if (!d.podpisat) return;
      if (rebra.has(klyuchOtrezka(a, b))) {
        dannye.push({ id: novyyId(), na: { otrezok: [a, b] }, tekst: d.tex });
      } else {
        const vid = telo.vid === 'kub' ? 'diagonal' : 'otrezok';
        dannye.push({ id: novyyId(), na: { element: dobavitOtrezok(a, b, vid) }, tekst: d.tex });
      }
    } else if ('otnoshenie' in m) {
      proverki.push({ otnoshenie: m.otnoshenie, ravno: d.znachenie });
    } else if ('obem' in m) {
      proverki.push({ obem: d.znachenie });
    } else if ('ploshchadOsnovaniya' in m) {
      proverki.push({ ploshchad: osnovanie, ravno: d.znachenie });
    } else if (vershina) {
      const O = centrOsn('vspom');
      proverki.push({ dlina: [vershina, O], ravno: d.znachenie });
      const id = dobavitOtrezok(vershina, O, 'vysota');
      if (d.podpisat) dannye.push({ id: novyyId(), na: { element: id }, tekst: d.tex });
    }
  });
  if (r.katety) {
    const [A, B, C] = imena;
    if (A && B && C)
      elementy.push({ id: 'pryamoy', vid: 'pryamoy-ugol', tochki: [A, C, B], rol: 'uslovie' });
  }

  /* Что ищут. */
  for (const i of r.iskomoe) {
    if ('otrezok' in i) {
      const [a, b] = i.otrezok;
      if (!rebra.has(klyuchOtrezka(a, b))) dobavitOtrezok(a, b, 'diagonal');
    } else if ('vysota' in i && vershina) {
      // Искомая высота — построение решения, а не данное: ученику не рисуется.
      const O = centrOsn('vspom');
      if (!elementy.some((e) => e.id === `${vershina}${O}`))
        elementy.push({
          id: `${vershina}${O}`,
          vid: 'vysota',
          tochki: [vershina, O],
          rol: 'vspom',
        });
    } else if ('ugolMezhdu' in i) {
      i.ugolMezhdu.forEach(([a, b], k) => {
        if (!elementy.some((e) => e.id === `${a}${b}`))
          elementy.push({ id: `${a}${b}`, vid: 'otrezok', tochki: [a, b], rol: 'uslovie' });
        void k;
      });
    } else if ('sechenie' in i && g.vypukloe) {
      const idx = i.sechenie.map((x) => imena.indexOf(x));
      if (idx.some((x) => x < 0)) {
        somneniya.push('сечение через точки, которых нет среди вершин');
        continue;
      }
      const [a, b, c] = idx.map((x) => g.vershiny[x] as V) as [V, V, V];
      const pts = sechenie(g.vershiny, g.rebra, a, b, c, g.razmer * 1e-9);
      const nazv = pts.map((p) => {
        const v = g.vershiny.findIndex(
          (q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < g.razmer * 1e-9,
        );
        if (v >= 0 && imena[v]) return imena[v] as string;
        const nm = svobodnoe('X');
        tochki.push({ imya: nm, gde: { xyz: p }, rol: 'uslovie', pokazat: false });
        return nm;
      });
      elementy.push({ id: 'sechenie', vid: 'ploskost', tochki: nazv, rol: 'uslovie' });
    } else if ('mnogogrannik' in i && g.vypukloe) {
      const idx = i.mnogogrannik.map((x) => imena.indexOf(x));
      if (idx.some((x) => x < 0)) {
        somneniya.push('в многограннике названы точки, которых нет среди вершин');
        continue;
      }
      const pts = idx.map((x) => g.vershiny[x] as V);
      const grani = obolochka(pts, g.razmer * 1e-7);
      const vyb = idx.map((x) => imena[x] as string);
      // Грани, не лежащие в гранях тела, — плоскости разреза; новые рёбра — отрезки.
      const teloGrani = g.grani.map((f) => new Set(f));
      grani.forEach((f, gi) => {
        const vIdx = f.map((m) => idx[m] as number);
        const vGrani = teloGrani.some((tg) => vIdx.every((v) => tg.has(v)));
        f.forEach((m, k) => {
          const a = vyb[m] as string;
          const b = vyb[f[(k + 1) % f.length] as number] as string;
          if (!rebra.has(klyuchOtrezka(a, b)))
            dobavitOtrezok(...([a, b].sort() as [string, string]));
        });
        if (!vGrani && f.length >= 3) {
          elementy.push({
            id: `razrez${gi}`,
            vid: 'mnogougolnik',
            tochki: f.map((m) => vyb[m] as string),
            rol: 'uslovie',
          });
        }
      });
    }
  }

  // Одна плоскость разреза — просто «razrez».
  const razrezy = elementy.filter((e) => e.id.startsWith('razrez'));
  if (razrezy.length === 1 && razrezy[0]) razrezy[0].id = 'razrez';

  const sc0: Scenariy = {
    id: o.id,
    alt: o.alt,
    telo,
    ...(imena.length > 0 ? { imena } : {}),
    ...(imena.length > 0 && r.imena === null ? { podpisatVershiny: false } : {}),
    tochki,
    dannye,
    elementy,
    // Не в масштабе — сверяются только отношения, длины на чертеже другие.
    proverki: masshtab ? proverki : [],
    ...(uslovnye || !masshtab ? { uslovnye: true } : {}),
  };
  const scena = postroit(sc0);
  const dob = o.dobavki?.({
    r,
    imena,
    osnovanie,
    vershina,
    est: (x) => scena.tochki.has(x),
    p: (x) => scena.tochki.get(x)?.p,
    elementy: elementy.map((e) => e.id),
    vershiny: [...scena.tochki.values()]
      .filter((t) => t.rol === 'vershina')
      .map((t) => ({ imya: t.imya, p: t.p })),
  });
  if (dob?.somneniya) somneniya.push(...dob.somneniya);
  const scenariy: Scenariy = {
    ...sc0,
    ...(dob?.rakurs ? { rakurs: dob.rakurs } : {}),
    tochki: [...tochki, ...(dob?.tochki ?? []).filter((t) => !estTochka(t.imya))],
    elementy: [
      ...elementy,
      ...(dob?.elementy ?? []).filter((e) => !elementy.some((x) => x.id === e.id)),
    ],
  };
  return { scenariy, shagi: dob?.shagi ?? [], somneniya };
}
