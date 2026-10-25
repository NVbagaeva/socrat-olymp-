/**
 * Лист из банка готовых задач (схема ps=2) — общий для №6, №7 и №10.
 *
 * У этих разделов задачи не генерируются на лету: банк — исходные
 * задачи (ФИПИ, образцы) и аналоги, подготовленные заранее. Позиция
 * листа — «прототип + номер внутри прототипа» (ключ «P04_1», как у №11):
 * задача позиции зависит только от ключа, варианта и seed, поэтому
 * добавление, удаление и перестановка задач не трогают остальные, а
 * «Заменить» берёт следующую свободную задачу того же прототипа.
 *
 * Разобранные примеры — аналоги из конца перемешанного пула прототипа,
 * отложенные всегда, включены примеры или нет: так переключатель не
 * меняет задачи листа. Исходных задач ФИПИ у прототипа одна-две — они
 * остаются задачам листа.
 *
 * Модуль чистый: на вход — индекс банка, на выход — id задач по
 * позициям. Тексты, рисунки и разборы подставляет лист раздела.
 */

import { rngOf, type Rng } from '@/lib/vychisleniya/rng';
import { klyuchSlota, Pul, razobratSostav, slotySostava, sostavStroka, type Slot } from './klyuchi';

/** Строка индекса банка: id, прототип, f — исходная / a — аналог, стиль. */
export interface ZadachaBanka {
  id: string;
  p: string;
  s: 'f' | 'a';
  st?: 'f' | 's';
}

export type IstochnikBanka = 'fipi' | 'analog' | 'mix';

/** Разобранных примеров на прототип — не больше. */
export const PRIMEROV_MAX = 2;

/**
 * Мест пула на вариант: позиция «номер k варианта v» берёт место
 * v × 12 + k. Место не зависит от числа вариантов и других позиций.
 */
const MEST_NA_VARIANT = 12;

export interface ZaprosBanka {
  sostav: { id: string; n: number; k?: number }[];
  istochnik: IstochnikBanka;
  variants: number;
  seed: string;
  /** Замены: «вариант.ключ» → сколько раз. */
  zameny: Record<string, number>;
  /** Памятка (карточки теории прототипов листа). */
  pamyatka: boolean;
  /** Разобранных примеров на прототип. */
  primery: 0 | 1 | 2;
  /** Вид работы в шапке — словами; пусто — нет. */
  kind: string;
  /** Дата «2026-10-24»; пусто — линия. */
  date: string;
  /** Учитель в шапке, если отличается от автора. */
  uchitel?: string;
  qr: boolean;
  /** Фильтр раздела (у №6 — формулировка: s, f, v); нет — без фильтра. */
  filtr?: string;
}

/** Адрес листа: ps=2&s=P01:2,P04.3:1&i=m&v=2&seed=…&z=1.P01_0:1… */
export function zaprosBankaQuery(z: ZaprosBanka, avtor: string): string {
  const q = new URLSearchParams();
  q.set('ps', '2');
  q.set('s', sostavStroka(z.sostav));
  q.set('i', z.istochnik === 'fipi' ? 'f' : z.istochnik === 'analog' ? 'a' : 'm');
  if (z.variants > 1) q.set('v', String(z.variants));
  q.set('seed', z.seed);
  if (z.filtr !== undefined) q.set('st', z.filtr);
  if (z.pamyatka) q.set('tr', '1');
  if (z.primery > 0) q.set('pr', String(z.primery));
  if (z.kind !== '') q.set('k', z.kind);
  if (z.date !== '') q.set('d', z.date);
  if (z.uchitel !== undefined && z.uchitel !== avtor) q.set('uch', z.uchitel);
  if (z.qr) q.set('qr', '1');
  const zz = Object.entries(z.zameny).filter(([, k]) => k > 0);
  if (zz.length > 0) q.set('z', zz.map(([pos, k]) => `${pos}:${k}`).join(','));
  return q.toString();
}

/** Адрес ps=2 → запрос; null — адрес не этой схемы или пустой состав. */
export function parseZaprosBanka(
  q: URLSearchParams,
  opts: { idRe: RegExp; est: (id: string) => boolean; variantsMax: number; filtry?: string[] },
): ZaprosBanka | null {
  if (q.get('ps') !== '2') return null;
  const seed = (q.get('seed') ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 12);
  const sostav = razobratSostav(q.get('s') ?? '', true, opts.idRe, opts.est);
  if (seed === '' || sostav.length === 0) return null;
  const i = q.get('i');
  const pr = Number(q.get('pr') ?? 0);
  const zameny: Record<string, number> = {};
  for (const part of (q.get('z') ?? '').split(',')) {
    const m = /^(\d{1,2}\.[A-Za-z0-9-]+_\d{1,2}):(\d{1,3})$/.exec(part);
    if (m !== null) zameny[m[1] as string] = Number(m[2]);
  }
  const st = q.get('st') ?? '';
  const uch = q.get('uch');
  return {
    sostav,
    istochnik: i === 'f' ? 'fipi' : i === 'a' ? 'analog' : 'mix',
    variants: Math.max(1, Math.min(opts.variantsMax, Number(q.get('v')) || 1)),
    seed,
    zameny,
    pamyatka: q.get('tr') === '1',
    primery: pr === 1 || pr === 2 ? pr : 0,
    kind: (q.get('k') ?? '').slice(0, 60),
    date: /^\d{4}-\d{2}-\d{2}$/.test(q.get('d') ?? '') ? (q.get('d') as string) : '',
    ...(uch === null ? {} : { uchitel: uch.slice(0, 40) }),
    qr: q.get('qr') === '1',
    ...(opts.filtry !== undefined
      ? { filtr: opts.filtry.includes(st) ? st : (opts.filtry[0] as string) }
      : {}),
  };
}

/** Позиция листа: ключ «вариант.ключ» и задача; задачи не хватило — id нет. */
export interface PoziciyaBanka {
  pos: string;
  proto: string;
  id: string | null;
}

export interface ListBanka {
  sloty: Slot[];
  poVariantam: PoziciyaBanka[][];
  /** Разобранные примеры: прототип → id задач, по порядку состава. */
  primery: { proto: string; ids: string[] }[];
  /** Позиций, на которые задачи не хватило. */
  nehvatka: number;
}

function peremeshat<T>(r: Rng, items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    const t = a[i] as T;
    a[i] = a[j] as T;
    a[j] = t;
  }
  return a;
}

/**
 * Задачи листа по позициям. Пулы прототипа — исходные и аналоги,
 * каждый перемешан своим seed «соль|seed|прототип|f(a)». Позиция берёт
 * сначала своё место в пуле нужного источника (вариант × 12 + номер),
 * потом свободную задачу с конца пула, потом другой источник. Остаток
 * раздаётся по вариантам по порядку — ещё один вариант не меняет
 * прежние, а маленький банк исходных задач расходится целиком.
 * podhodit — фильтр раздела (формулировка у №6); примеры — любые.
 */
export function sobratPoKlyucham(
  z: ZaprosBanka,
  indeks: readonly ZadachaBanka[],
  sol: string,
  podhodit: (x: ZadachaBanka) => boolean = () => true,
): ListBanka {
  const sloty = slotySostava(z.sostav);
  const protos = [...new Set(sloty.map((s) => s.id))];
  const pulF = new Map<string, Pul<string>>();
  const pulA = new Map<string, Pul<string>>();
  const primery: { proto: string; ids: string[] }[] = [];
  for (const p of protos) {
    const f = peremeshat(
      rngOf(`${sol}|${z.seed}|${p}|f`),
      indeks.filter((x) => x.p === p && x.s === 'f').map((x) => x.id),
    );
    const a = peremeshat(
      rngOf(`${sol}|${z.seed}|${p}|a`),
      indeks.filter((x) => x.p === p && x.s === 'a').map((x) => x.id),
    );
    /* Примеры — последние аналоги пула (исходные, если аналогов нет). */
    const zapas = (a.length > 0 ? a : f).slice(-PRIMEROV_MAX).reverse();
    primery.push({ proto: p, ids: zapas.slice(0, z.primery) });
    const ok = new Set(indeks.filter(podhodit).map((x) => x.id));
    const bez = (ids: string[]) => ids.filter((id) => ok.has(id) && !zapas.includes(id));
    pulF.set(p, new Pul(bez(f)));
    pulA.set(p, new Pul(bez(a)));
  }
  const poVariantam: PoziciyaBanka[][] = Array.from({ length: z.variants }, (_, vi) =>
    sloty.map((s) => ({ pos: `${vi + 1}.${klyuchSlota(s)}`, proto: s.id, id: null })),
  );
  /* Ячейки в порядке «вариант → прототип → ключ»: порядок на листе не важен. */
  const yacheyki = sloty
    .flatMap((s, i) => Array.from({ length: z.variants }, (_, vi) => ({ s, i, v: vi })))
    .sort((x, y) => x.v - y.v || x.s.id.localeCompare(y.s.id) || x.s.k - y.s.k);
  const izF = (c: (typeof yacheyki)[number]) =>
    z.istochnik === 'fipi' ||
    (z.istochnik === 'mix' &&
      rngOf(`${sol}-mix|${z.seed}|${c.v + 1}|${klyuchSlota(c.s)}`).next() < 0.5);
  const pulyDlya = (c: (typeof yacheyki)[number]) => {
    const f = pulF.get(c.s.id) as Pul<string>;
    const a = pulA.get(c.s.id) as Pul<string>;
    return izF(c) ? [f, a] : [a, f];
  };
  const postavit = (c: (typeof yacheyki)[number], id: string | undefined) => {
    const p = poVariantam[c.v]?.[c.i];
    if (p !== undefined && id !== undefined) p.id = id;
  };
  /* Свои места нужного источника, затем остаток с конца, затем другой источник. */
  const bezMesta = yacheyki.filter((c) => {
    const [nuzhnyy] = pulyDlya(c);
    const id = nuzhnyy?.svoyo(c.v * MEST_NA_VARIANT + c.s.k);
    postavit(c, id);
    return id === undefined;
  });
  for (const c of bezMesta) {
    const [nuzhnyy, drugoy] = pulyDlya(c);
    postavit(c, nuzhnyy?.sKontsa() ?? drugoy?.sKontsa());
  }
  /* Замены: k-я замена — k-я ещё свободная задача с конца пула. */
  for (const c of yacheyki) {
    let n = z.zameny[`${c.v + 1}.${klyuchSlota(c.s)}`] ?? 0;
    if (n <= 0) continue;
    const [nuzhnyy, drugoy] = pulyDlya(c);
    let id: string | undefined;
    while (n > 0) {
      const next = nuzhnyy?.sKontsa() ?? drugoy?.sKontsa();
      if (next === undefined) break;
      id = next;
      n -= 1;
    }
    postavit(c, id);
  }
  const nehvatka = poVariantam.flat().filter((p) => p.id === null).length;
  return { sloty, poVariantam, primery, nehvatka };
}

/** Шапка листа из «Дополнительно». */
export interface ShapkaBanka {
  kind: string;
  date: string;
  uchitel?: string;
  qr: boolean;
}

/** Блок листа банка: рамки теории, примеры, варианты задач с ключами позиций. */
export interface BlokBanka {
  id: string;
  title: string;
  teoriya?: string[];
  primery?: string[];
  spiski: string[][];
  /** Ключи позиций задач — параллельно spiski. */
  pozicii?: string[][];
}

/** Блоки листа ps=2: «Повторяем теорию» (памятка и примеры) и «Задачи». */
export function blokiBanka(z: ZaprosBanka, l: ListBanka): BlokBanka[] {
  const protos = [...new Set(l.sloty.map((s) => s.id))];
  const primery = l.primery.flatMap((p) => p.ids);
  const bloki: BlokBanka[] = [];
  if (z.pamyatka || primery.length > 0) {
    bloki.push({
      id: 'teoriya',
      title: z.pamyatka ? 'Повторяем теорию' : 'Разобранные примеры',
      ...(z.pamyatka ? { teoriya: protos } : {}),
      primery,
      spiski: [],
    });
  }
  const est = l.poVariantam.map((v) => v.filter((p) => p.id !== null));
  bloki.push({
    id: 'zadachi',
    title: 'Задачи',
    spiski: est.map((v) => v.map((p) => p.id as string)),
    pozicii: est.map((v) => v.map((p) => p.pos)),
  });
  return bloki;
}

export function shapkaBanka(z: ZaprosBanka): ShapkaBanka {
  return {
    kind: z.kind,
    date: z.date,
    ...(z.uchitel === undefined ? {} : { uchitel: z.uchitel }),
    qr: z.qr,
  };
}
