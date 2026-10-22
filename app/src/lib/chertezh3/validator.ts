/**
 * Валидатор сценария чертежа №3.
 *
 * Проверяет то, что глазом на сотнях чертежей не поймать:
 *   — тело: размеры положительные и конечные, число сторон 3, 4 или 6,
 *     блоки составного тела непустые и тело не пустое; тела вращения
 *     пока не поддержаны (следующий этап);
 *   — имена: по одному на вершину, правильного вида, без повторов;
 *   — точки и элементы: все упомянутые точки существуют, id не
 *     повторяются, у отрезка две точки, у многоугольника — от трёх и
 *     в одной плоскости, вырожденных нет;
 *   — размеры согласованы с условием: каждая проверка сценария
 *     (длина, площадь, отношение, угол) сходится с геометрией сцены;
 *   — подписи не дублируются: на одном отрезке одна подпись, одно и
 *     то же число не подписано дважды; число на чертеже есть в тексте
 *     условия (подписывается только то, что дано);
 *   — ссылки шагов решения ведут на существующие элементы.
 */

import { type V, cross, dist, dot, len, norm, sub } from '@/lib/stereo/vec';
import { postroit, type Scena3 } from './postroit';
import {
  type Dannoe,
  type Scenariy,
  MNOGOUGOLNIKI,
  OTREZKI,
  UGLY,
  imyaVerno,
  klyuchOtrezka,
  razbitImena,
} from './scenariy';

export interface KontekstProverki {
  /** Текст условия: числа подписей должны в нём быть. */
  uslovie?: string;
  /** Ссылки шагов решения на элементы чертежа. */
  shagi?: readonly (readonly string[])[];
}

const TELA_VRASHCHENIYA = ['cilindr', 'konus', 'usechennyy-konus', 'shar'];

/** Число из TeX подписи: «2{,}5» → 2.5, «\\sqrt{12}» → null (не число). */
export function chisloPodpisi(tex: string): number | null {
  const t = tex
    .replace(/\{,\}/g, ',')
    .replace(/\^\\circ|°/g, '')
    .trim();
  if (!/^-?\d+(,\d+)?$/.test(t)) return null;
  return Number(t.replace(',', '.'));
}

/** Числа из текста условия: «2,5», «7», «35√2» (как 35). */
export function chislaUsloviya(text: string): number[] {
  return (text.replace(/\{,\}/g, ',').match(/\d+(?:,\d+)?/g) ?? []).map((x) =>
    Number(x.replace(',', '.')),
  );
}

function pozitivno(x: unknown): boolean {
  return typeof x === 'number' && Number.isFinite(x) && x > 0;
}

function proveritTelo(sc: Scenariy, out: string[]): boolean {
  const t = sc.telo as { vid: string } & Record<string, unknown>;
  if (TELA_VRASHCHENIYA.includes(t.vid)) {
    out.push(`тело «${t.vid}»: тела вращения — следующий этап, пока не поддержаны`);
    return false;
  }
  switch (sc.telo.vid) {
    case 'kub':
      if (!pozitivno(sc.telo.a)) out.push('куб: ребро должно быть положительным');
      break;
    case 'parallelepiped':
      if (![sc.telo.a, sc.telo.b, sc.telo.c].every(pozitivno))
        out.push('параллелепипед: рёбра должны быть положительными');
      break;
    case 'prizma':
    case 'piramida':
      if (![3, 4, 6].includes(sc.telo.n))
        out.push(`число сторон основания ${sc.telo.n}: только 3, 4, 6`);
      if (!pozitivno(sc.telo.a) || !pozitivno(sc.telo.h))
        out.push('сторона основания и высота должны быть положительными');
      break;
    case 'tetraedr':
      if (!pozitivno(sc.telo.a)) out.push('тетраэдр: ребро должно быть положительным');
      break;
    case 'pryamaya-prizma':
    case 'piramida-proizv': {
      const b = sc.telo.osnovanie;
      if (b.length < 3) out.push('основание: меньше трёх точек');
      let s = 0;
      b.forEach((p, i) => {
        const q = b[(i + 1) % b.length] ?? p;
        s += p[0] * q[1] - q[0] * p[1];
      });
      if (!(s > 0)) out.push('основание: обход должен идти против часовой стрелки, площадь > 0');
      for (let i = 0; i < b.length; i += 1) {
        const [p, q, r] = [b[i], b[(i + 1) % b.length], b[(i + 2) % b.length]];
        if (p && q && r && (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]) <= 0)
          out.push('основание невыпуклое или с точками на одной прямой');
      }
      if (sc.telo.vid === 'pryamaya-prizma' && !pozitivno(sc.telo.h))
        out.push('высота призмы должна быть положительной');
      if (sc.telo.vid === 'piramida-proizv' && !(sc.telo.vershina[2] > 0))
        out.push('вершина пирамиды должна быть над основанием');
      break;
    }
    case 'sostavnoy':
      if (sc.telo.bloki.length === 0) out.push('составное тело без блоков');
      if (sc.telo.bloki[0]?.op !== '+') out.push('составное тело должно начинаться с блока «+»');
      sc.telo.bloki.forEach((bl, i) => {
        if (!bl.razmer.every(pozitivno))
          out.push(`блок ${i + 1}: размеры должны быть положительными`);
        if (!bl.ot.every((x) => Number.isFinite(x))) out.push(`блок ${i + 1}: угол не число`);
      });
      break;
    default:
      out.push(`неизвестное тело «${t.vid}»`);
      return false;
  }
  return out.length === 0;
}

function ploshchad(pts: readonly V[]): number {
  let s: V = [0, 0, 0];
  for (let i = 1; i + 1 < pts.length; i += 1) {
    const c = cross(sub(pts[i] as V, pts[0] as V), sub(pts[i + 1] as V, pts[0] as V));
    s = [s[0] + c[0], s[1] + c[1], s[2] + c[2]];
  }
  return len(s) / 2;
}

function blizko(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
}

export function validirovat(sc: Scenariy, k: KontekstProverki = {}): string[] {
  const out: string[] = [];
  if (!proveritTelo(sc, out)) return out;

  let scena: Scena3;
  try {
    scena = postroit(sc);
  } catch (e) {
    return [`сцена не строится: ${(e as Error).message}`];
  }
  out.push(...scena.oshibki);
  if (scena.geom.obem <= 1e-9) out.push('тело пустое: объём 0');

  // Имена.
  const imena = (sc.imena ?? []).filter((x): x is string => x !== null);
  const vse = [...imena, ...(sc.tochki ?? []).map((t) => t.imya)];
  for (const n of vse)
    if (!imyaVerno(n)) out.push(`имя «${n}» не по форме (буква, индекс, штрихи)`);
  const povt = vse.filter((n, i) => vse.indexOf(n) !== i);
  if (povt.length > 0) out.push(`имена повторяются: ${[...new Set(povt)].join(', ')}`);

  // id элементов и данных.
  const ids = [...(sc.elementy ?? []).map((e) => e.id), ...(sc.dannye ?? []).map((d) => d.id)];
  const povtId = ids.filter((n, i) => ids.indexOf(n) !== i);
  if (povtId.length > 0) out.push(`id повторяются: ${[...new Set(povtId)].join(', ')}`);

  // Элементы.
  const tp = (n: string) => scena.tochki.get(n)?.p;
  const eps = scena.geom.razmer * 1e-6;
  for (const e of sc.elementy ?? []) {
    const pts = e.tochki.map(tp);
    if (OTREZKI.includes(e.vid) && e.tochki.length !== 2)
      out.push(`элемент ${e.id}: у отрезка две точки, а не ${e.tochki.length}`);
    if (MNOGOUGOLNIKI.includes(e.vid) && e.tochki.length < 3)
      out.push(`элемент ${e.id}: у многоугольника не меньше трёх точек`);
    if (UGLY.includes(e.vid) && e.tochki.length !== 3)
      out.push(`элемент ${e.id}: угол задаётся тремя точками`);
    if (new Set(e.tochki).size !== e.tochki.length) out.push(`элемент ${e.id}: точки повторяются`);
    if (pts.some((p) => p === undefined)) continue;
    const P = pts as V[];
    if (OTREZKI.includes(e.vid) && P.length === 2 && dist(P[0] as V, P[1] as V) < eps)
      out.push(`элемент ${e.id}: отрезок нулевой длины`);
    if (MNOGOUGOLNIKI.includes(e.vid) && P.length >= 3) {
      const n = cross(sub(P[1] as V, P[0] as V), sub(P[2] as V, P[0] as V));
      if (len(n) < eps * eps) {
        out.push(`элемент ${e.id}: первые три точки на одной прямой`);
      } else {
        const u = norm(n);
        if (P.some((p) => Math.abs(dot(u, sub(p, P[0] as V))) > eps))
          out.push(`элемент ${e.id}: точки не в одной плоскости`);
      }
    }
  }

  // Подписи данных: цель существует, без дублей.
  const naOtrezke = new Map<string, string>();
  /* Одна величина подписана дважды: одно и то же число на двух
     параллельных рёбрах одной грани (AB и DC у параллелепипеда) или
     на одном и том же отрезке. Равные числа на разных отрезках —
     разные величины (две ступеньки одной высоты), это не дубль. */
  const imenaV = sc.imena ?? [];
  const graniImen = scena.geom.grani.map((f) => new Set(f.map((i) => imenaV[i])));
  const odnaGran = (a: Dannoe, b: Dannoe) =>
    'otrezok' in a.na &&
    'otrezok' in b.na &&
    graniImen.some(
      (g) =>
        (a.na as { otrezok: readonly string[] }).otrezok.every((x) => g.has(x)) &&
        (b.na as { otrezok: readonly string[] }).otrezok.every((x) => g.has(x)),
    );
  const teksty = new Map<string, { d: Dannoe; dir: V | null }[]>();
  const napr = (d: (typeof sc.dannye & object)[number]): V | null => {
    let a: V | undefined;
    let b: V | undefined;
    if ('otrezok' in d.na) [a, b] = d.na.otrezok.map(tp);
    else if ('element' in d.na) {
      const id = d.na.element;
      const e = (sc.elementy ?? []).find((x) => x.id === id);
      if (e && e.tochki.length === 2) [a, b] = e.tochki.map(tp);
    }
    return a && b && dist(a, b) > eps ? norm(sub(b, a)) : null;
  };
  for (const d of sc.dannye ?? []) {
    let cel: string;
    if ('otrezok' in d.na) {
      for (const n of d.na.otrezok)
        if (!scena.tochki.has(n)) out.push(`данное ${d.id}: нет точки ${n}`);
      cel = `отрезок ${klyuchOtrezka(d.na.otrezok[0], d.na.otrezok[1])}`;
    } else if ('ugol' in d.na) {
      for (const n of d.na.ugol)
        if (!scena.tochki.has(n)) out.push(`данное ${d.id}: нет точки ${n}`);
      cel = `угол ${d.na.ugol.join('')}`;
    } else {
      const id = d.na.element;
      if (!(sc.elementy ?? []).some((e) => e.id === id))
        out.push(`данное ${d.id}: нет элемента ${id}`);
      cel = `элемент ${id}`;
    }
    if (naOtrezke.has(cel)) out.push(`${cel} подписан дважды: ${naOtrezke.get(cel)} и ${d.id}`);
    naOtrezke.set(cel, d.id);
    const t = d.tekst.replace(/\s+/g, '');
    const dir = napr(d);
    for (const prezh of teksty.get(t) ?? []) {
      const parallel = dir !== null && prezh.dir !== null && len(cross(dir, prezh.dir)) < 1e-6;
      if (parallel && odnaGran(prezh.d, d))
        out.push(`подпись «${d.tekst}» повторяется: ${prezh.d.id} и ${d.id}`);
    }
    teksty.set(t, [...(teksty.get(t) ?? []), { d, dir }]);
    if (k.uslovie !== undefined) {
      const x = chisloPodpisi(d.tekst);
      if (x !== null && !chislaUsloviya(k.uslovie).some((y) => blizko(x, y)))
        out.push(`подпись «${d.tekst}» (${d.id}): такого числа нет в условии`);
    }
  }
  for (const e of sc.elementy ?? []) {
    if (e.podpis && /\d/.test(e.podpis))
      out.push(
        `элемент ${e.id}: обозначение «${e.podpis}» с числом — числа подписываются только данными`,
      );
  }

  // Размеры согласованы с условием.
  for (const p of sc.proverki ?? []) {
    let fakt: number | null = null;
    let chto = '';
    const ravno = 'obem' in p ? p.obem : p.ravno;
    if ('dlina' in p) {
      const [a, b] = p.dlina.map(tp);
      chto = `длина ${p.dlina.join('')}`;
      if (a && b) fakt = dist(a, b);
    } else if ('ploshchad' in p) {
      const pts = p.ploshchad.map(tp);
      chto = `площадь ${p.ploshchad.join('')}`;
      if (pts.every(Boolean)) fakt = ploshchad(pts as V[]);
    } else if ('otnoshenie' in p) {
      const [a, b, c, d] = [...p.otnoshenie[0], ...p.otnoshenie[1]].map(tp);
      chto = `отношение ${p.otnoshenie[0].join('')} : ${p.otnoshenie[1].join('')}`;
      if (a && b && c && d) fakt = dist(a, b) / dist(c, d);
    } else if ('obem' in p) {
      chto = 'объём тела';
      fakt = scena.geom.obem;
    } else {
      const [a, v, c] = p.ugol.map(tp);
      chto = `угол ${p.ugol.join('')}`;
      if (a && v && c) {
        const cos = dot(norm(sub(a, v)), norm(sub(c, v)));
        fakt = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      }
    }
    if (fakt === null) out.push(`проверка «${chto}»: нет точек`);
    else if (!blizko(fakt, ravno))
      out.push(`${chto} на чертеже ${+fakt.toFixed(6)}, а в условии ${ravno}`);
  }

  // Ссылки шагов.
  const elementy = new Set((sc.elementy ?? []).map((e) => e.id));
  const dannye = new Set((sc.dannye ?? []).map((d) => d.id));
  const rebra = new Set(
    scena.geom.rebra.map(([a, b]) =>
      klyuchOtrezka(sc.imena?.[a] ?? `v${a}`, sc.imena?.[b] ?? `v${b}`),
    ),
  );
  (k.shagi ?? []).forEach((refs, i) => {
    for (const r of refs) {
      if (elementy.has(r) || dannye.has(r) || scena.tochki.has(r)) continue;
      const n = r.includes('-') ? r.split('-') : razbitImena(r);
      if (n.length === 2 && rebra.has(klyuchOtrezka(n[0] as string, n[1] as string))) continue;
      out.push(`шаг ${i + 1}: ссылка «${r}» ни на что не указывает`);
    }
  });
  return out;
}
