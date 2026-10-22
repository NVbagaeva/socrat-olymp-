/**
 * Подбор задач для листов задания №6: генератор и (будущие) уроки
 * репетитора — та же схема, что у №10 (lib/zadanie10/sborka.ts).
 *
 * Модуль чистый и браузерный: на вход — индекс задач (id, прототип,
 * источник), на выход — модель листа из id задач. Тексты и разборы
 * подставляет страница печати. Всё детерминировано seed-ом:
 *
 *   генератор — seed листа в адресе (`s=`), лист ученика и лист
 *   учителя строятся из одного запроса и потому из одних задач;
 *
 *   уроки — код комплекта `K6Q2AB` (6 знаков) и номера перегенераций
 *   уроков (`-5.2` — урок 5 перегенерирован дважды). Код восстанавливает
 *   всю серию на любом устройстве: seed урока = код + номер урока
 *   (+ номер перегенерации), localStorage не нужен. Уроков столько,
 *   сколько в content/uroki6.ts (пока ноль — вкладка «Для репетиторов»
 *   говорит «Материалы разрабатываются»); последний урок без прототипов
 *   — итоговая работа (только исходные задачи, все группы).
 */

import { UROKI_6 } from '../../content/uroki6';
import { rngOf, type Rng } from '../vychisleniya/rng';
import type { IndeksZadachi } from './dannye';
import { podStil, type Stil } from './shablony';

/* ── Общее ──────────────────────────────────────────────────────── */

export type Istochnik = 'fipi' | 'analog' | 'mix';

/** Группы прототипов (сверяется с lib/zadanie6/prototypes самотестом). */
export const GRUPPY_PROTOTIPOV: Record<string, string[]> = {
  I: ['P01', 'P02'],
  II: ['P03'],
  III: ['P04', 'P05', 'P06', 'P07', 'P08', 'P09'],
  IV: ['P10', 'P11'],
  V: ['P12', 'P13', 'P14', 'P15'],
};

/** Число уроков серии. */
export const UROKOV = UROKI_6.length;

/** Перемешать копию списка (Фишер — Йейтс). */
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

class Pul {
  private po: Map<string, { f: string[]; a: string[] }>;
  constructor(
    indeks: readonly IndeksZadachi[],
    r: Rng,
    private zanyato: Set<string>,
    stil: Stil = 'vse',
  ) {
    this.po = new Map();
    for (const z of indeks.filter((x) => podStil(x.st, stil))) {
      const e = this.po.get(z.p) ?? { f: [], a: [] };
      (z.s === 'f' ? e.f : e.a).push(z.id);
      this.po.set(z.p, e);
    }
    for (const [k, e] of [...this.po.entries()].sort(([x], [y]) => x.localeCompare(y))) {
      this.po.set(k, { f: peremeshat(r, e.f), a: peremeshat(r, e.a) });
    }
  }

  /** Взять n задач прототипа: сначала из нужного источника, потом из другого. */
  vzyat(proto: string, n: number, ist: Istochnik, strogo = false): string[] {
    const e = this.po.get(proto);
    if (e === undefined) {
      return [];
    }
    const out: string[] = [];
    const svobodnye = (spisok: string[]) => spisok.filter((id) => !this.zanyato.has(id));
    for (let i = 0; i < n; i += 1) {
      const f = svobodnye(e.f);
      const a = svobodnye(e.a);
      let id: string | undefined;
      if (ist === 'fipi') {
        id = f[0] ?? (strogo ? undefined : a[0]);
      } else if (ist === 'analog') {
        id = a[0] ?? (strogo ? undefined : f[0]);
      } else {
        id = i % 2 === 0 ? (f[0] ?? a[0]) : (a[0] ?? f[0]);
      }
      if (id === undefined) {
        break;
      }
      this.zanyato.add(id);
      out.push(id);
    }
    return out;
  }
}

/* ── Генератор ──────────────────────────────────────────────────── */

export interface ZaprosLista {
  /** Прототипы и число задач каждого в одном варианте. */
  tipy: { id: string; n: number }[];
  istochnik: Istochnik;
  variantov: number;
  /** Разобранных примеров на тип в рамке теории: 0–2. */
  primery: 0 | 1 | 2;
  /** Сюжетные, стандартные или все. */
  stil: Stil;
  seed: string;
}

export const VARIANTOV_MAX = 6;
export const NA_TIP_MAX = 6;

export interface ModelLista {
  vid: 'generator' | 'urok';
  zagolovok: string;
  /** Подпись внизу листа: код комплекта или seed. */
  kod: string;
  /** Блоки листа по порядку. */
  bloki: BlokLista[];
}

export interface BlokLista {
  id: string;
  title: string;
  /** Пояснение под заголовком блока (на листе учителя). */
  note?: string;
  /** Рамки теории: прототипы, по которым печатаются их карточки теории. */
  teoriya?: string[];
  /** Разобранные примеры (печатаются с решением на обоих листах). */
  primery?: string[];
  /** Варианты задач: один или несколько. */
  spiski: string[][];
  /** На листе ученика — место для решения (разбор в классе). */
  mesto?: boolean;
}

/** Адресная строка запроса генератора: t=P01:2,P11:1&i=m&v=2&e=1&seed=AB12CD. */
export function zaprosQuery(z: ZaprosLista): string {
  const q = new URLSearchParams();
  q.set('t', z.tipy.map((t) => `${t.id}:${t.n}`).join(','));
  q.set('i', z.istochnik === 'fipi' ? 'f' : z.istochnik === 'analog' ? 'a' : 'm');
  q.set('v', String(z.variantov));
  q.set('e', String(z.primery));
  q.set('st', z.stil === 'syuzhet' ? 's' : z.stil === 'standart' ? 'f' : 'v');
  q.set('seed', z.seed);
  return q.toString();
}

export function parseZapros(q: URLSearchParams): ZaprosLista | null {
  const t = q.get('t');
  const s = q.get('seed');
  if (!t || !s) {
    return null;
  }
  const tipy = t
    .split(',')
    .map((x) => x.split(':'))
    .filter((x) => /^P(0[1-9]|1[0-5])$/.test(x[0] ?? ''))
    .map(([id, n]) => ({ id: id ?? '', n: Math.max(1, Math.min(NA_TIP_MAX, Number(n) || 1)) }));
  if (tipy.length === 0) {
    return null;
  }
  const i = q.get('i');
  const e = Number(q.get('e') ?? 0);
  const st = q.get('st');
  return {
    tipy,
    istochnik: i === 'f' ? 'fipi' : i === 'a' ? 'analog' : 'mix',
    variantov: Math.max(1, Math.min(VARIANTOV_MAX, Number(q.get('v')) || 1)),
    primery: e === 1 || e === 2 ? e : 0,
    stil: st === 's' ? 'syuzhet' : st === 'f' ? 'standart' : 'vse',
    seed: s.replace(/[^A-Za-z0-9]/g, '').slice(0, 12),
  };
}

/**
 * Лист генератора: варианты по запросу без повторов. Разобранные
 * примеры берутся из задач, не попавших в варианты (сначала исходные).
 */
export function sobratList(z: ZaprosLista, indeks: readonly IndeksZadachi[]): ModelLista {
  const r = rngOf(`z6-list|${z.seed}`);
  const zanyato = new Set<string>();
  const pul = new Pul(indeks, r, zanyato, z.stil);
  const spiski: string[][] = [];
  for (let v = 0; v < z.variantov; v += 1) {
    spiski.push(z.tipy.flatMap((t) => pul.vzyat(t.id, t.n, z.istochnik)));
  }
  /* Разобранные примеры — любого стиля: рамка теории не зависит от сюжета. */
  const pulPrimerov = new Pul(indeks, rngOf(`z6-primery|${z.seed}`), zanyato);
  const primery =
    z.primery > 0 ? z.tipy.flatMap((t) => pulPrimerov.vzyat(t.id, z.primery, 'fipi')) : [];
  const bloki: BlokLista[] = [];
  if (z.primery > 0) {
    bloki.push({
      id: 'teoriya',
      title: 'Повторяем теорию',
      teoriya: z.tipy.map((t) => t.id),
      primery,
      spiski: [],
    });
  }
  bloki.push({ id: 'zadachi', title: 'Задачи', spiski });
  return {
    vid: 'generator',
    zagolovok: 'Задание №6. Случайные величины и распределения',
    kod: z.seed,
    bloki,
  };
}

/* ── Уроки ──────────────────────────────────────────────────────── */

export type BlokUrokaId = 'razminka' | 'proverka' | 'shpargalka' | 'razbor' | 'sam' | 'dz' | 'itog';

export const BLOKI_UROKA: {
  id: BlokUrokaId;
  title: string;
  note: string;
  poProto: boolean;
  po: number;
}[] = [
  { id: 'razminka', title: 'Разминка', note: '3 задачи по прошлому уроку', poProto: false, po: 3 },
  {
    id: 'proverka',
    title: 'Мини-проверка прошлого урока',
    note: '4 задачи; печатается вместе с разминкой следующего урока',
    poProto: false,
    po: 4,
  },
  {
    id: 'shpargalka',
    title: 'Шпаргалка',
    note: 'формулы и «Важно!» по прототипам урока',
    poProto: false,
    po: 0,
  },
  {
    id: 'razbor',
    title: 'Разбор',
    note: 'по 1 исходной задаче на прототип — решаем вместе',
    poProto: true,
    po: 1,
  },
  { id: 'sam', title: 'Самостоятельно', note: 'по 2 аналога на прототип', poProto: true, po: 2 },
  {
    id: 'dz',
    title: 'Домашнее задание',
    note: 'по 3 на прототип: 2 исходные + 1 аналог',
    poProto: true,
    po: 3,
  },
  {
    id: 'itog',
    title: 'Итоговая работа',
    note: '2 варианта по 10 исходных задач, все группы',
    poProto: false,
    po: 10,
  },
];

export interface NastroykiUrokov {
  /** Сколько раз перегенерирован урок: номер урока → раз. */
  regen: Record<number, number>;
  /** Выключенные блоки. */
  vyklyucheno: BlokUrokaId[];
  /** Число задач в блоке (на прототип или всего); нет ключа — по умолчанию. */
  chislo: Partial<Record<BlokUrokaId, number>>;
}

export const NASTROYKI_PO_UMOLCHANIYU: NastroykiUrokov = { regen: {}, vyklyucheno: [], chislo: {} };

/** Код комплекта: 6 знаков без похожих букв. */
const ALFAVIT = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function novyyKod(random: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 6; i += 1) {
    s += ALFAVIT[Math.floor(random() * ALFAVIT.length)];
  }
  return s;
}

/** «K6Q2AB-5.2-7.1»: код и перегенерации уроков. */
export function kodSerii(kod: string, regen: Record<number, number>): string {
  const hvost = Object.entries(regen)
    .filter(([, r]) => r > 0)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([u, r]) => `-${u}.${r}`)
    .join('');
  return `${kod}${hvost}`;
}

export function parseKodSerii(text: string): { kod: string; regen: Record<number, number> } | null {
  const t = text.trim().toUpperCase().replace(/\s+/g, '');
  const m = /^([A-Z0-9]{6})((?:-\d\.\d+)*)$/.exec(t);
  if (!m) {
    return null;
  }
  const regen: Record<number, number> = {};
  for (const part of (m[2] ?? '').split('-').filter(Boolean)) {
    const [u, r] = part.split('.');
    regen[Number(u)] = Number(r);
  }
  return { kod: m[1] ?? '', regen };
}

function chislo(n: NastroykiUrokov, id: BlokUrokaId): number {
  const def = BLOKI_UROKA.find((b) => b.id === id)?.po ?? 0;
  return Math.max(0, Math.min(10, n.chislo[id] ?? def));
}

interface SostavUroka {
  razminka: string[];
  proverka: string[];
  razbor: string[];
  sam: string[];
  dz: string[];
  itog: string[][];
}

/** Задачи «по кругу» прототипов урока: всего n штук. */
function poKrugu(pul: Pul, prototipy: string[], n: number, ist: Istochnik): string[] {
  const out: string[] = [];
  for (let i = 0; out.length < n && i < n * 4; i += 1) {
    const p = prototipy[i % prototipy.length];
    if (p === undefined) {
      break;
    }
    out.push(...pul.vzyat(p, 1, ist));
  }
  return out;
}

/** Итоговая работа: 2 варианта, в каждом поровну исходных задач из каждой группы. */
function itogVarianty(pul: Pul, r: Rng, n: NastroykiUrokov): string[][] {
  const naGruppu = Math.max(1, Math.round(chislo(n, 'itog') / 5));
  const out: string[][] = [];
  for (let v = 0; v < 2; v += 1) {
    const variant: string[] = [];
    for (const g of Object.values(GRUPPY_PROTOTIPOV)) {
      let vzyato = 0;
      for (const p of peremeshat(r, g)) {
        if (vzyato >= naGruppu) {
          break;
        }
        const ids = pul.vzyat(p, 1, 'fipi', true);
        variant.push(...ids);
        vzyato += ids.length;
      }
    }
    out.push(variant);
  }
  return out;
}

/** Задачи одного урока (кроме итоговой) из пула. */
function sostavUroka(no: number, pul: Pul, n: NastroykiUrokov): SostavUroka {
  const pr = UROKI_6.find((u) => u.no === no)?.prototipy ?? [];
  const pp = UROKI_6.find((u) => u.no === no - 1)?.prototipy ?? [];
  const s: SostavUroka = { razminka: [], proverka: [], razbor: [], sam: [], dz: [], itog: [] };
  if (pp.length > 0) {
    /* Разминка и проверка — аналоги: исходные задачи бережём для разбора,
       домашнего задания и итоговой. */
    s.razminka = poKrugu(pul, pp, chislo(n, 'razminka'), 'analog');
    s.proverka = poKrugu(pul, pp, chislo(n, 'proverka'), 'analog');
  }
  for (const p of pr) {
    s.razbor.push(...pul.vzyat(p, chislo(n, 'razbor'), 'fipi'));
  }
  for (const p of pr) {
    s.sam.push(...pul.vzyat(p, chislo(n, 'sam'), 'analog'));
  }
  for (const p of pr) {
    const vsego = chislo(n, 'dz');
    const analogov = Math.floor(vsego / 3);
    s.dz.push(...pul.vzyat(p, vsego - analogov, 'fipi'), ...pul.vzyat(p, analogov, 'analog'));
  }
  return s;
}

/**
 * Состав всех уроков серии. Базовая серия: итоговая работа (последний
 * урок) откладывается первой (только исходные), затем уроки подряд.
 * Перегенерированный урок подбирается заново из того, что не занято
 * базовой серией и прошлыми перегенерациями этого урока; остальные
 * уроки при этом не меняются.
 */
export function sostavSerii(
  kod: string,
  n: NastroykiUrokov,
  indeks: readonly IndeksZadachi[],
): Map<number, SostavUroka> {
  const zanyato = new Set<string>();
  const out = new Map<number, SostavUroka>();
  const itog = itogVarianty(
    new Pul(indeks, rngOf(`z6-itog|${kod}|0`), zanyato),
    rngOf(`z6-itog-g|${kod}|0`),
    n,
  );
  for (let no = 1; no <= UROKOV; no += 1) {
    out.set(no, sostavUroka(no, new Pul(indeks, rngOf(`z6-urok|${kod}|${no}|0`), zanyato), n));
  }
  const posledniy = out.get(UROKOV);
  if (posledniy) {
    posledniy.itog = itog;
  }
  for (const [uStr, raz] of Object.entries(n.regen).sort(([a], [b]) => Number(a) - Number(b))) {
    const no = Number(uStr);
    if (!(no >= 1 && no <= UROKOV) || !(raz > 0)) {
      continue;
    }
    for (let k = 1; k <= raz; k += 1) {
      const s = sostavUroka(no, new Pul(indeks, rngOf(`z6-urok|${kod}|${no}|${k}`), zanyato), n);
      if (no === UROKOV) {
        s.itog = itogVarianty(
          new Pul(indeks, rngOf(`z6-itog|${kod}|${k}`), zanyato),
          rngOf(`z6-itog-g|${kod}|${k}`),
          n,
        );
      }
      out.set(no, s);
    }
  }
  return out;
}

/** Модель листа урока: блоки по порядку, выключенные — пропущены. */
export function modelUroka(
  kod: string,
  no: number,
  n: NastroykiUrokov,
  indeks: readonly IndeksZadachi[],
): ModelLista {
  const sostav = sostavSerii(kod, n, indeks).get(no);
  const urok = UROKI_6.find((u) => u.no === no);
  if (sostav === undefined || urok === undefined) {
    throw new Error(`нет урока ${no}`);
  }
  const vkl = (id: BlokUrokaId) => !n.vyklyucheno.includes(id);
  const bloki: BlokLista[] = [];
  const meta = (id: BlokUrokaId) => BLOKI_UROKA.find((b) => b.id === id);
  if (vkl('razminka') && sostav.razminka.length > 0) {
    bloki.push({
      id: 'razminka',
      title: 'Разминка',
      note: meta('razminka')?.note ?? '',
      spiski: [sostav.razminka],
    });
  }
  if (vkl('proverka') && sostav.proverka.length > 0) {
    bloki.push({
      id: 'proverka',
      title: `Мини-проверка урока ${no - 1}`,
      note: meta('proverka')?.note ?? '',
      spiski: [sostav.proverka],
    });
  }
  if (vkl('shpargalka') && urok.prototipy.length > 0) {
    bloki.push({ id: 'shpargalka', title: 'Шпаргалка', teoriya: urok.prototipy, spiski: [] });
  }
  if (vkl('razbor') && sostav.razbor.length > 0) {
    bloki.push({
      id: 'razbor',
      title: 'Разбор',
      note: meta('razbor')?.note ?? '',
      spiski: [sostav.razbor],
      mesto: true,
    });
  }
  if (vkl('sam') && sostav.sam.length > 0) {
    bloki.push({
      id: 'sam',
      title: 'Самостоятельно',
      note: meta('sam')?.note ?? '',
      spiski: [sostav.sam],
    });
  }
  if (vkl('dz') && sostav.dz.length > 0) {
    bloki.push({
      id: 'dz',
      title: 'Домашнее задание',
      note: meta('dz')?.note ?? '',
      spiski: [sostav.dz],
    });
  }
  if (no === UROKOV && vkl('itog')) {
    bloki.push({
      id: 'itog',
      title: 'Итоговая работа',
      note: meta('itog')?.note ?? '',
      spiski: sostav.itog,
    });
  }
  return {
    vid: 'urok',
    zagolovok: `Задание №6 · Урок ${no}. ${urok.title}`,
    kod: kodSerii(kod, n.regen),
    bloki,
  };
}

/** Адрес листа урока: kod=K6Q2AB&u=5&r=5.2,7.1&x=sam,dz&n=sam:3. */
export function urokQuery(kod: string, no: number, n: NastroykiUrokov): string {
  const q = new URLSearchParams();
  q.set('kod', kod);
  q.set('u', String(no));
  const r = Object.entries(n.regen)
    .filter(([, v]) => v > 0)
    .map(([u, v]) => `${u}.${v}`)
    .join(',');
  if (r) {
    q.set('r', r);
  }
  if (n.vyklyucheno.length > 0) {
    q.set('x', n.vyklyucheno.join(','));
  }
  const c = Object.entries(n.chislo)
    .map(([b, v]) => `${b}:${v}`)
    .join(',');
  if (c) {
    q.set('n', c);
  }
  return q.toString();
}

export function parseUrokQuery(
  q: URLSearchParams,
): { kod: string; no: number; n: NastroykiUrokov } | null {
  const kod = (q.get('kod') ?? '').toUpperCase();
  const no = Number(q.get('u'));
  if (!/^[A-Z0-9]{6}$/.test(kod) || !(no >= 1 && no <= UROKOV)) {
    return null;
  }
  const regen: Record<number, number> = {};
  for (const part of (q.get('r') ?? '').split(',').filter(Boolean)) {
    const [u, v] = part.split('.');
    if (Number(u) >= 1 && Number(u) <= UROKOV && Number(v) > 0) {
      regen[Number(u)] = Math.min(20, Number(v));
    }
  }
  const ids = BLOKI_UROKA.map((b) => b.id);
  const vyklyucheno = (q.get('x') ?? '')
    .split(',')
    .filter((x): x is BlokUrokaId => (ids as string[]).includes(x));
  const chisloN: Partial<Record<BlokUrokaId, number>> = {};
  for (const part of (q.get('n') ?? '').split(',').filter(Boolean)) {
    const [b, v] = part.split(':');
    if ((ids as string[]).includes(b ?? '') && Number(v) >= 0) {
      chisloN[b as BlokUrokaId] = Math.min(10, Number(v));
    }
  }
  return { kod, no, n: { regen, vyklyucheno, chislo: chisloN } };
}
