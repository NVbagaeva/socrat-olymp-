/**
 * Лист задания №11: адрес → план → задачи → описание листа.
 *
 * Всё, что определяет лист, живёт в адресе: режим, источник, состав,
 * число вариантов, seed и замены отдельных задач. Один адрес — один
 * и тот же лист; листы ученика и учителя по одному адресу содержат
 * одни и те же задачи. Задачи считает движок №11 в браузере, лист
 * раскладывает общий шаблон lib/sheet/.
 *
 * Режимы: «Задания для отработки» (по N задач на тип, блоками по
 * типам), «Варианты» (K вариантов; на позиции i во всех вариантах —
 * задача одного типа) и «Маршрут урока» (опорные → банк → новые).
 * Без повторов внутри листа: задача банка берётся один раз, новые —
 * с разными параметрами. Замена задачи («перегенерировать одну»)
 * берёт следующий кандидат того же типа и не трогает остальные.
 *
 * Привязка задач. Адреса генератора (ps=2) привязывают задачу к месту в
 * составе — «подтип + номер внутри подтипа», ключ «PR-04_0», а не к
 * номеру на листе. Тогда добавление и удаление тем, перестановка задач и
 * «Убрать» не меняют остальные задачи и не сдвигают замены. Прежние
 * адреса (без ps) и маршруты уроков собираются по старой схеме, как
 * раньше: напечатанные комплекты восстанавливаются теми же.
 */

import { MARSHRUTY_11, SHEET_11 } from '@/content/repetitory11';
import answers from '@/lib/sheet/answers.js';
import { typesetKrupno as typeset } from '../tex';
import { rngOf } from '../vychisleniya/rng';
import { generateBez, paramsKey, pohozhaNa, type Pohozha } from './gen/core';
import { type Kontekst, strokaHtml } from './proporciya/html';
import { kodNaSayte } from './kod';
import { d } from './num';
import { BLOKI } from './prep/bloki';
import { generateMikro } from './prep/generate';
import { subtype } from './prototypes';
import type { Istochnik, UslovieBanka } from './trenazher/sessiya';
import type { Params, Solved, Tablitsa } from './types';

export type Rezhim = 'otrabotka' | 'komplekt' | 'marshrut';

export interface SheetParams11 {
  rezhim: Rezhim;
  istochnik: Istochnik;
  /**
   * Состав: подтип и сколько задач (на лист или на вариант). k — ключ
   * первой из n задач (схема ps=2); нет — следующий после прежних.
   */
  sostav: { id: string; n: number; k?: number }[];
  variants: number;
  seed: string;
  /**
   * Замены задач → сколько раз заменяли. Ключ — «вариант.позиция»
   * («2.3»), в схеме ps=2 — «вариант.ключ» («2.PR-04_0»).
   */
  zameny: Record<string, number>;
  /** Схема ps=2: задача привязана к ключу позиции, а не к номеру. */
  poKlyucham?: boolean;
  /** Номер маршрута урока (режим «marshrut»). */
  marshrut: number;
  theme: 'color' | 'print';
}

export const VARIANTS_MAX_11 = 8;

/* ── Адрес ──────────────────────────────────────────────────────── */

const REZHIM_KOD: Record<Rezhim, string> = { otrabotka: 'o', komplekt: 'v', marshrut: 'r' };
const ISTOCHNIK_KOD: Record<Istochnik, string> = { bank: 'b', mix: 'm', new: 'n' };

export function sheetQuery11(p: SheetParams11): string {
  const q = new URLSearchParams();
  q.set('m', REZHIM_KOD[p.rezhim]);
  q.set('i', ISTOCHNIK_KOD[p.istochnik]);
  if (p.rezhim === 'marshrut') {
    q.set('r', String(p.marshrut));
  } else if (p.poKlyucham === true) {
    q.set('ps', '2');
    q.set('s', sostavStroka(p.sostav));
  } else {
    q.set('s', p.sostav.map((x) => `${x.id}:${x.n}`).join(','));
  }
  if (p.variants > 1) q.set('v', String(p.variants));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  if (p.theme === 'print') q.set('t', 'print');
  return q.toString();
}

export function parseSheetQuery11(q: URLSearchParams): SheetParams11 {
  const rezhim =
    (Object.keys(REZHIM_KOD) as Rezhim[]).find((k) => REZHIM_KOD[k] === q.get('m')) ?? 'otrabotka';
  const istochnik =
    (Object.keys(ISTOCHNIK_KOD) as Istochnik[]).find((k) => ISTOCHNIK_KOD[k] === q.get('i')) ??
    'bank';
  const poKlyucham = rezhim !== 'marshrut' && q.get('ps') === '2';
  const sostav = (q.get('s') ?? '')
    .split(',')
    .map((x) => x.split(':'))
    .map(([tok = '', n = '1']) => {
      const m = /^([A-Z]{2}-\d{2})(?:\.(\d{1,2}))?$/.exec(tok);
      /* Ключ в составе понимает только схема ps=2. */
      const id = m === null || (!poKlyucham && m[2] !== undefined) ? '' : (m[1] ?? '');
      const k = m?.[2] !== undefined && id !== '' ? { k: Number(m[2]) } : {};
      return { id, n: Math.max(1, Math.min(20, Number(n) || 1)), ...k };
    })
    .filter((x) => x.id !== '' && subtypeEst(x.id));
  const v = Number(q.get('v'));
  const r = Number(q.get('r'));
  const zameny: Record<string, number> = {};
  for (const item of (q.get('z') ?? '').split(',')) {
    const [pos = '', k = ''] = item.split(':');
    const fmt = poKlyucham ? /^\d+\.[A-Z]{2}-\d{2}_\d{1,2}$/ : /^\d+\.\d+$/;
    if (fmt.test(pos) && Number(k) > 0) zameny[pos] = Math.min(50, Number(k));
  }
  return {
    rezhim,
    istochnik,
    /* Повтор ключа в адресе — лишняя позиция: убирается. */
    sostav: poKlyucham ? sostavIzSlotov(slotySostava(sostav)) : sostav,
    variants: Number.isFinite(v) && v > 1 ? Math.min(VARIANTS_MAX_11, Math.floor(v)) : 1,
    seed: q.get('seed') ?? 'list',
    zameny,
    marshrut: MARSHRUTY_11.some((m) => m.no === r) ? r : 1,
    theme: q.get('t') === 'print' ? 'print' : 'color',
    ...(poKlyucham ? { poKlyucham } : {}),
  };
}

/* ── Ключи позиций (схема ps=2) ─────────────────────────────────── */

/** Позиция состава: подтип и номер внутри подтипа. */
export interface Slot11 {
  id: string;
  k: number;
}

export function klyuchSlota(s: Slot11): string {
  return `${s.id}_${s.k}`;
}

/** Позиции состава по порядку; без k — следующий ключ после прежних. */
export function slotySostava(sostav: readonly { id: string; n: number; k?: number }[]): Slot11[] {
  const next = new Map<string, number>();
  const seen = new Set<string>();
  const out: Slot11[] = [];
  for (const x of sostav) {
    let k = x.k ?? next.get(x.id) ?? 0;
    for (let j = 0; j < x.n; j += 1, k += 1) {
      const key = `${x.id}_${k}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: x.id, k });
    }
    next.set(x.id, k);
  }
  return out;
}

/** Позиции → состав: подряд идущие ключи одного подтипа склеиваются. */
export function sostavIzSlotov(sloty: readonly Slot11[]): { id: string; n: number; k: number }[] {
  const out: { id: string; n: number; k: number }[] = [];
  for (const s of sloty) {
    const last = out[out.length - 1];
    if (last !== undefined && last.id === s.id && last.k + last.n === s.k) last.n += 1;
    else out.push({ id: s.id, n: 1, k: s.k });
  }
  return out;
}

/** «PR-04:2,SM-04.3:1»: ключ пишется, только если он не следующий. */
function sostavStroka(sostav: readonly { id: string; n: number; k?: number }[]): string {
  const next = new Map<string, number>();
  return sostav
    .map((x) => {
      const k = x.k ?? next.get(x.id) ?? 0;
      const tok = k === (next.get(x.id) ?? 0) ? x.id : `${x.id}.${k}`;
      next.set(x.id, k + x.n);
      return `${tok}:${x.n}`;
    })
    .join(',');
}

function subtypeEst(id: string): boolean {
  try {
    subtype(id);
    return true;
  } catch {
    return false;
  }
}

/* ── План ───────────────────────────────────────────────────────── */

/** Что стоит на позиции листа. */
export type Pozitsiya =
  | { vid: 'bank' | 'razminka' | 'analog'; id: string; no: number }
  | { vid: 'new'; id: string; seed: string }
  | { vid: 'mikro'; id: string; seed: string; blok: string };

/** Шаблон позиции: что нужно, без конкретной задачи. */
interface Shablon {
  /** Подтип или опорный блок (P11-…). */
  id: string;
  istochnik: 'bank' | 'new' | 'mix' | 'mikro';
  /** Блок листа: тип задачи, «опорные», «банк», «новые». */
  blok: string;
  /** Номер внутри подтипа (схема ps=2). */
  k: number;
}

function shablony(p: SheetParams11): Shablon[] {
  if (p.rezhim === 'marshrut') {
    const m = MARSHRUTY_11.find((x) => x.no === p.marshrut) ?? MARSHRUTY_11[0];
    if (m === undefined) return [];
    return [
      ...m.opornye.map((id) => ({ id, istochnik: 'mikro' as const, blok: 'opornye', k: 0 })),
      ...m.bank.map((id) => ({ id, istochnik: 'bank' as const, blok: 'bank', k: 0 })),
      ...m.novye.map((id) => ({ id, istochnik: 'new' as const, blok: 'novye', k: 0 })),
    ];
  }
  const ist = p.istochnik === 'mix' ? 'mix' : p.istochnik === 'new' ? 'new' : 'bank';
  if (p.poKlyucham === true) {
    return slotySostava(p.sostav).map((x) => ({ id: x.id, istochnik: ist, blok: x.id, k: x.k }));
  }
  return p.sostav.flatMap((x) =>
    Array.from({ length: x.n }, () => ({ id: x.id, istochnik: ist, blok: x.id, k: 0 }) as Shablon),
  );
}

/** Позиция задачи на листе: «2.3» или, в схеме ps=2, «2.PR-04_0». */
function posOf(p: SheetParams11, s: Shablon | undefined, v: number, i: number): string {
  return p.poKlyucham === true && s !== undefined ? `${v}.${klyuchSlota(s)}` : `${v}.${i}`;
}

export interface PlanLista {
  /** Позиции по вариантам. */
  poVariantam: Pozitsiya[][];
  /** Шаблоны позиций: блок листа у каждой. */
  bloki: string[];
  /** Сколько позиций «из банка» пришлось заменить новыми: банк кончился. */
  nehvatka: number;
}

/** Есть ли задача на этих параметрах — для «без повторов» у новых. */
function novayaZadacha(
  id: string,
  seed: string,
  pohozha: Pohozha,
  zanyato: Set<string>,
): { seed: string } {
  for (let a = 0; a < 25; a += 1) {
    const s = a === 0 ? seed : `${seed}~${a}`;
    try {
      const g = generateBez(id, s, pohozha);
      const key = paramsKey(id, g.params);
      if (!zanyato.has(key)) {
        zanyato.add(key);
        return { seed: s };
      }
    } catch {
      /* На этом seed не подобралось — следующий. */
    }
  }
  return { seed };
}

/** Задачи банка подтипа в порядке листа: перемешаны по seed листа. */
function bankPodtipa(p: SheetParams11, bank: readonly UslovieBanka[], id: string) {
  /* Разминка — не открытый банк: её задачи идут только в «банк + новые». */
  const svoi = bank.filter(
    (b) => b.id === id && b.analog === undefined && (!b.razminka || p.istochnik === 'mix'),
  );
  return rngOf(`z11-list|${p.seed}|${id}`).sample(svoi, svoi.length);
}

/** Аналоги подтипа: «новые» задачи берутся сначала из них. */
function analogiPodtipa(p: SheetParams11, bank: readonly UslovieBanka[], id: string) {
  const svoi = bank.filter((b) => b.id === id && b.analog !== undefined);
  return rngOf(`z11-analog|${p.seed}|${id}`).sample(svoi, svoi.length);
}

export function planLista(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  return p.poKlyucham === true && p.rezhim !== 'marshrut'
    ? planPoKlyucham(p, bank)
    : planPoNomeram(p, bank);
}

/**
 * Пул задач подтипа без повторов. У каждой позиции своё место в пуле —
 * «номер × число вариантов + вариант», — его она берёт первой: задачи не
 * зависят от соседей. Места плотные, чтобы маленького банка хватало на
 * весь лист; цена — при смене числа вариантов вторые и дальше задачи
 * одного подтипа берут другие места. Место занято или его нет — берётся
 * задача с конца пула: новые позиции занимают места с начала, так их
 * появление реже задевает остальные.
 */
class Pul<T> {
  private zanyato: boolean[];
  constructor(private items: readonly T[]) {
    this.zanyato = items.map(() => false);
  }
  svoyo(i: number): T | undefined {
    if (i >= this.items.length || this.zanyato[i] === true) return undefined;
    this.zanyato[i] = true;
    return this.items[i];
  }
  sKontsa(): T | undefined {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (this.zanyato[i] !== true) return this.svoyo(i);
    }
    return undefined;
  }
}

/** Схема ps=2: задача — функция ключа позиции, варианта и seed листа. */
function planPoKlyucham(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  const sh = shablony(p);
  const pohozha = pohozhaNa(bank);
  const banki = new Map<string, Pul<UslovieBanka>>();
  const analogi = new Map<string, Pul<UslovieBanka>>();
  const bankDlya = (id: string) => {
    let o = banki.get(id);
    if (o === undefined) banki.set(id, (o = new Pul(bankPodtipa(p, bank, id))));
    return o;
  };
  const analogDlya = (id: string) => {
    let o = analogi.get(id);
    if (o === undefined) analogi.set(id, (o = new Pul(analogiPodtipa(p, bank, id))));
    return o;
  };
  /* Ячейки листа в порядке «подтип → ключ → вариант»: от него зависят
     только задачи одного подтипа, порядок на листе не важен. */
  const yacheyki = sh
    .flatMap((s, i) =>
      Array.from({ length: p.variants }, (_, vi) => ({
        s,
        i,
        v: vi + 1,
        mesto: s.k * p.variants + vi,
        seed: `${p.seed}|${vi + 1}|${klyuchSlota(s)}`,
      })),
    )
    .sort((a, b) => a.s.id.localeCompare(b.s.id) || a.s.k - b.s.k || a.v - b.v);
  type Yacheyka = (typeof yacheyki)[number];
  const izBanka = (c: Yacheyka) =>
    c.s.istochnik === 'bank' ||
    (c.s.istochnik === 'mix' && rngOf(`z11-mix|${c.seed}`).next() < 0.5);
  const izBankaPoz = (b: UslovieBanka): Pozitsiya => ({
    vid: b.razminka ? 'razminka' : 'bank',
    id: b.id,
    no: b.no,
  });

  const poVariantam: (Pozitsiya | undefined)[][] = Array.from({ length: p.variants }, () =>
    sh.map(() => undefined),
  );
  const postavit = (c: Yacheyka, poz: Pozitsiya) => {
    const row = poVariantam[c.v - 1];
    if (row !== undefined) row[c.i] = poz;
  };
  let nehvatka = 0;

  /* Банк: сначала свои места, потом остаток с конца. */
  const bankovye = yacheyki.filter(izBanka);
  const bezBanka = bankovye.filter((c) => {
    const b = bankDlya(c.s.id).svoyo(c.mesto);
    if (b !== undefined) postavit(c, izBankaPoz(b));
    return b === undefined;
  });
  const nuzhenAnalog = yacheyki.filter((c) => !izBanka(c));
  for (const c of bezBanka) {
    const b = bankDlya(c.s.id).sKontsa();
    if (b !== undefined) postavit(c, izBankaPoz(b));
    else {
      if (c.s.istochnik === 'bank') nehvatka += 1;
      nuzhenAnalog.push(c);
    }
  }
  /* Аналоги — так же; не хватило — новая задача по своему seed. */
  nuzhenAnalog.sort((a, b) => yacheyki.indexOf(a) - yacheyki.indexOf(b));
  const bezAnaloga = nuzhenAnalog.filter((c) => {
    const a = analogDlya(c.s.id).svoyo(c.mesto);
    if (a !== undefined) postavit(c, { vid: 'analog', id: a.id, no: a.no });
    return a === undefined;
  });
  const zanyatoNovye = new Set<string>();
  for (const c of bezAnaloga) {
    const a = analogDlya(c.s.id).sKontsa();
    if (a !== undefined) postavit(c, { vid: 'analog', id: a.id, no: a.no });
    else
      postavit(c, {
        vid: 'new',
        id: c.s.id,
        ...novayaZadacha(c.s.id, c.seed, pohozha, zanyatoNovye),
      });
  }

  /* Замены: k-я замена берёт k-ю ещё не занятую задачу пула с конца;
     пул кончился — следующий источник, затем новая задача. */
  for (const c of yacheyki) {
    const n = p.zameny[`${c.v}.${klyuchSlota(c.s)}`] ?? 0;
    if (n <= 0) continue;
    const old = poVariantam[c.v - 1]?.[c.i];
    let left = n;
    let next: Pozitsiya | undefined;
    if (izBanka(c)) {
      while (left > 0) {
        const b = bankDlya(c.s.id).sKontsa();
        if (b === undefined) break;
        next = izBankaPoz(b);
        left -= 1;
      }
    }
    while (left > 0) {
      const a = analogDlya(c.s.id).sKontsa();
      if (a === undefined) break;
      next = { vid: 'analog', id: a.id, no: a.no };
      left -= 1;
    }
    if (left > 0) {
      let seed = `${c.seed}|z${n}`;
      /* Замена должна отличаться от прежней задачи. */
      if (old?.vid === 'new' && old.seed === seed) seed = `${c.seed}|z${n + 100}`;
      next = { vid: 'new', id: c.s.id, ...novayaZadacha(c.s.id, seed, pohozha, zanyatoNovye) };
    }
    if (next !== undefined) postavit(c, next);
  }
  return {
    poVariantam: poVariantam.map((row) => row.filter((x): x is Pozitsiya => x !== undefined)),
    bloki: sh.map((s) => s.blok),
    nehvatka,
  };
}

/** Прежняя схема: задача привязана к номеру позиции на листе. */
function planPoNomeram(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  const sh = shablony(p);
  const pohozha = pohozhaNa(bank);
  const zanyatoNovye = new Set<string>();
  const ochered = new Map<string, UslovieBanka[]>();
  /* Очередь задач банка для подтипа: перемешана по seed листа. */
  function bankDlya(id: string): UslovieBanka[] {
    let o = ochered.get(id);
    if (o === undefined) {
      o = bankPodtipa(p, bank, id);
      ochered.set(id, o);
    }
    return o;
  }
  /* Пул аналогов подтипа: «новые» задачи берутся сначала из него. */
  const pul = new Map<string, UslovieBanka[]>();
  function analogDlya(id: string): UslovieBanka | undefined {
    let o = pul.get(id);
    if (o === undefined) {
      o = analogiPodtipa(p, bank, id);
      pul.set(id, o);
    }
    return o.shift();
  }
  let nehvatka = 0;
  const vybrat = (s: Shablon, v: number, i: number, zamena: number): Pozitsiya => {
    const seed = `${p.seed}|${v}|${i}${zamena > 0 ? `|z${zamena}` : ''}`;
    if (s.istochnik === 'mikro') {
      const blok = BLOKI.find((b) => b.id === s.id);
      const n = blok?.zadachi.length ?? 1;
      const m = blok?.zadachi[(v * 3 + i + zamena) % n];
      return { vid: 'mikro', id: m?.id ?? `${s.id}-01`, seed, blok: s.id };
    }
    const izBanka =
      s.istochnik === 'bank' ||
      (s.istochnik === 'mix' && rngOf(`z11-mix|${p.seed}|${v}|${i}`).next() < 0.5);
    if (izBanka) {
      const b = bankDlya(s.id).shift();
      if (b !== undefined) {
        return { vid: b.razminka ? 'razminka' : 'bank', id: b.id, no: b.no };
      }
      if (s.istochnik === 'bank') nehvatka += 1;
    }
    const a = analogDlya(s.id);
    if (a !== undefined) {
      return { vid: 'analog', id: a.id, no: a.no };
    }
    return { vid: 'new', id: s.id, ...novayaZadacha(s.id, seed, pohozha, zanyatoNovye) };
  };
  /* Сначала весь лист без замен — замены берут оставшихся кандидатов
     и не сдвигают остальные задачи. */
  const poVariantam = Array.from({ length: p.variants }, (_, v) =>
    sh.map((s, i) => vybrat(s, v + 1, i + 1, 0)),
  );
  for (const [pos, k] of Object.entries(p.zameny)) {
    const [v = 0, i = 0] = pos.split('.').map(Number);
    const s = sh[i - 1];
    const row = poVariantam[v - 1];
    if (s === undefined || row === undefined) continue;
    const old = row[i - 1];
    let next: Pozitsiya = vybrat(s, v, i, k);
    /* Замена должна отличаться от прежней задачи. */
    if (old !== undefined && next.vid === 'new' && old.vid === 'new' && next.seed === old.seed) {
      next = vybrat(s, v, i, k + 100);
    }
    row[i - 1] = next;
  }
  return { poVariantam, bloki: sh.map((s) => s.blok), nehvatka };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export interface ListZadacha {
  no: number;
  /** «вариант.позиция» или «вариант.ключ» (ps=2) — для кнопки замены. */
  pos: string;
  poz: Pozitsiya;
  blok: string;
  kod: string;
  title: string;
  questionHtml: string;
  /** Ответ строкой для таблицы ответов. */
  answer: string;
  /** Ответ, набранный KaTeX. */
  answerHtml: string;
  /** Решение по этапам с таблицами: для листа учителя. */
  solutionHtml: string;
}

/** Таблица модели для листа: та же методика, что на сайте. */
export function tablitsaHtml(t: Tablitsa, skryt = false): string {
  const cell = (x: string) => typeset(x);
  const head = `<tr>${t.head.map((h) => `<th>${cell(h)}</th>`).join('')}</tr>`;
  const rows = t.rows
    .map(
      (r, ri) =>
        `<tr${ri === t.uravnenie ? ' class="is-uravnenie"' : ''}>${r
          .map((c, ci) =>
            ci === 0 ? `<th>${cell(c)}</th>` : `<td>${skryt && c === '?' ? '' : cell(c)}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');
  const title = t.title === undefined ? '' : `<caption>${cell(t.title)}</caption>`;
  return `<table class="z11-sheet-tab">${title}<thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

/** Число для ответа: 2.25 → «2,25». */
function chislo(x: number): string {
  return String(Math.round(x * 1e9) / 1e9).replace('.', ',');
}

function reshenieHtml(
  etapy: { title: string; lines: string[] }[],
  tables: Tablitsa[],
  k: Kontekst,
): string {
  const tab = tables.map((t) => tablitsaHtml(t)).join('');
  const items = etapy
    .map((e) => {
      const lines = e.lines.filter((l) => !/^\*\*Ответ:\*\*/.test(l));
      if (lines.length === 0) return '';
      return `<li class="sheet-step"><b>${typeset(e.title)}.</b> ${lines.map((l) => strokaHtml(l, k)).join(' ')}</li>`;
    })
    .join('');
  return `${tab}<ol class="sheet-steps z11-sheet-steps">${items}</ol>`;
}

function zadachaIzBanka(
  poz: Exclude<Pozitsiya, { vid: 'mikro' }>,
  bank: readonly UslovieBanka[],
  pohozha: Pohozha,
): Solved {
  if (poz.vid === 'new') {
    return generateBez(poz.id, poz.seed, pohozha).solved;
  }
  const b = bank.find((x) => x.no === poz.no) as UslovieBanka;
  return subtype(b.id).solve(b.params as Params);
}

export interface SobrannyyList {
  poVariantam: ListZadacha[][];
  bloki: string[];
  nehvatka: number;
}

/** Задачи листа по вариантам: условия, ответы, решения. */
export function sobratList(p: SheetParams11, bank: readonly UslovieBanka[]): SobrannyyList {
  const plan = planLista(p, bank);
  const pohozha = pohozhaNa(bank);
  const sh = shablony(p);
  const poVariantam = plan.poVariantam.map((row, vi) => {
    /* Правило пропорции и признаки делимости печатаются целиком один
       раз на вариант, дальше — строкой-ссылкой. */
    const k: Kontekst = { typeset, pechat: true, pokazano: { pravilo: false, priznaki: false } };
    return row.map((poz, i): ListZadacha => {
      const pos = posOf(p, sh[i], vi + 1, i + 1);
      const blok = plan.bloki[i] ?? '';
      if (poz.vid === 'mikro') {
        const z = generateMikro(poz.id, poz.seed);
        const blokInfo = BLOKI.find((b) => b.id === poz.blok);
        const otvet =
          z.answerType === 'number'
            ? chislo(z.otvet as number)
            : (z.vybory?.find((v) => v.number === z.otvet)?.label ?? String(z.otvet));
        const vybory =
          z.vybory === undefined
            ? ''
            : `<ol class="sheet-options">${z.vybory
                .map(
                  (v) =>
                    `<li class="sheet-option"><span class="sheet-option-no">${v.number})</span><span>${typeset(v.label)}</span></li>`,
                )
                .join('')}</ol>`;
        return {
          no: i + 1,
          pos,
          poz,
          blok,
          kod: blokInfo?.no ?? '',
          title: blokInfo?.nazvanie ?? '',
          questionHtml:
            typeset(z.uslovie) +
            (z.tablitsa === undefined ? '' : tablitsaHtml(z.tablitsa, true)) +
            vybory,
          answer: z.answerType === 'number' ? otvet : `№${String(z.otvet)}`,
          answerHtml:
            z.answerType === 'number'
              ? typeset(`$${d(z.otvet as number)}$`)
              : `${String(z.otvet)}) ${typeset(otvet)}`,
          solutionHtml:
            (z.razborTablitsa === undefined ? '' : tablitsaHtml(z.razborTablitsa)) +
            `<ol class="sheet-steps z11-sheet-steps">${z.razbor
              .filter((l) => !/^\*\*Ответ:\*\*/.test(l))
              .map((l) => `<li class="sheet-step">${strokaHtml(l, k)}</li>`)
              .join('')}</ol>`,
        };
      }
      const s = zadachaIzBanka(poz, bank, pohozha);
      const st = subtype(poz.id);
      const vybor = s.vybor;
      const otvetVybor = vybor === undefined ? null : (vybor.options[vybor.correct] ?? '');
      return {
        no: i + 1,
        pos,
        poz,
        blok,
        kod: kodNaSayte(poz.id),
        title: st.title,
        questionHtml: typeset(
          (poz.vid === 'new' ? undefined : bank.find((b) => b.no === poz.no)?.analog?.tekst) ??
            s.uslovie,
        ),
        answer: otvetVybor === null ? chislo(s.answer) : otvetVybor.replace(/\$/g, ''),
        answerHtml: otvetVybor === null ? typeset(`$${d(s.answer)}$`) : typeset(otvetVybor),
        solutionHtml: reshenieHtml(s.etapy, s.tables ?? [], k),
      };
    });
  });
  return { poVariantam, bloki: plan.bloki, nehvatka: plan.nehvatka };
}

/* ── Описание листа для шаблона lib/sheet ───────────────────────── */

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

function subtitleOf(p: SheetParams11): string {
  if (p.rezhim === 'marshrut') {
    const m = MARSHRUTY_11.find((x) => x.no === p.marshrut);
    return m === undefined ? '' : SHEET_11.subtitle.marshrut(m.no, m.title);
  }
  return SHEET_11.subtitle[p.rezhim];
}

const BLOK_ROUTE: Record<string, string> = {
  opornye: SHEET_11.bloki.opornye,
  bank: SHEET_11.bloki.bank,
  novye: SHEET_11.bloki.novye,
};

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: null;
  solutionHtml: string | null;
}

/** Блоки листа: по типам (отработка), по этапам урока или один без полосы. */
function blokiLista(p: SheetParams11, zadachi: ListZadacha[], task: (z: ListZadacha) => SheetTask) {
  if (p.rezhim === 'komplekt') {
    return [{ head: false, title: '', note: '', tasks: zadachi.map(task) }];
  }
  /* В схеме ps=2 порядок задач задаёт учитель: блок — подряд идущие
     задачи одного типа, номера на листе идут по порядку. */
  const gruppy: ListZadacha[][] = [];
  if (p.poKlyucham === true && p.rezhim === 'otrabotka') {
    for (const z of zadachi) {
      const last = gruppy[gruppy.length - 1];
      if (last !== undefined && last[0]?.blok === z.blok) last.push(z);
      else gruppy.push([z]);
    }
  } else {
    const order: string[] = [];
    for (const z of zadachi) if (!order.includes(z.blok)) order.push(z.blok);
    for (const b of order) gruppy.push(zadachi.filter((z) => z.blok === b));
  }
  return gruppy.map((tasks) => {
    const b = tasks[0]?.blok ?? '';
    const first = tasks[0];
    return p.rezhim === 'marshrut'
      ? { title: BLOK_ROUTE[b] ?? b, note: '', tasks: tasks.map(task) }
      : { id: first?.kod ?? b, title: first?.title ?? b, note: '', tasks: tasks.map(task) };
  });
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

function bejdzh(z: ListZadacha): string {
  /* У аналога учителю видно, к какому прототипу банка он относится. */
  const proto = z.poz.vid === 'analog' ? ` · ${SHEET_11.analogK} ${z.kod}` : '';
  return `<span class="z11-sheet-badge">${SHEET_11.bejdzh[z.poz.vid]}${proto}</span>`;
}

/**
 * Описание листа. Ученику — условия и строка «Ответ: ____»; учителю —
 * те же задачи с решением по этапам (таблицы по методике), ответом и
 * пометкой «банк» / «новая», в конце — таблица ответов. «Всё одним
 * файлом» — листы учеников всех вариантов, затем листы учителя.
 */
export function sheetSpec11(p: SheetParams11, list: SobrannyyList, vid: VidLista) {
  const title = (variant?: string, uchitel = false) => ({
    chip: SHEET_11.title.chip,
    text: SHEET_11.title.text,
    subtitle: subtitleOf(p) + (uchitel ? ` · ${SHEET_11.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
  });
  const uchenikTask =
    (sStrokoy: boolean) =>
    (z: ListZadacha): SheetTask => ({
      no: z.no,
      id: z.pos,
      questionHtml: z.questionHtml,
      options: null,
      figureSvg: null,
      solutionHtml: sStrokoy ? STROKA_OTVETA : null,
    });
  /* Лист генератора — без служебных пометок у задач: источник одной
     строкой в конце (docs/generator/02-design.md). Маршрут урока
     оставляет пометки: там они делят урок на этапы. */
  const sPometkoy = p.rezhim === 'marshrut';
  const uchitelTask = (z: ListZadacha): SheetTask => ({
    no: z.no,
    id: z.pos,
    questionHtml: sPometkoy ? `${bejdzh(z)} ${z.questionHtml}` : z.questionHtml,
    options: null,
    figureSvg: null,
    solutionHtml: `${z.solutionHtml}<p class="sheet-task-answer">${SHEET_11.otvet}: <b>${z.answerHtml}</b></p>`,
  });
  const nV = list.poVariantam.length;
  const variantTitle = (i: number) => (nV > 1 ? `Вариант ${i + 1}` : undefined);
  const poVariantam =
    vid === 'uchenik'
      ? list.poVariantam.map((zs, i) => ({
          title: title(variantTitle(i)),
          blocks: blokiLista(p, zs, uchenikTask(false)),
        }))
      : vid === 'uchitel'
        ? list.poVariantam.map((zs, i) => ({
            title: title(variantTitle(i), true),
            blocks: blokiLista(p, zs, uchitelTask),
          }))
        : [
            ...list.poVariantam.map((zs, i) => ({
              title: title(variantTitle(i)),
              blocks: blokiLista(p, zs, uchenikTask(true)),
            })),
            ...list.poVariantam.map((zs, i) => ({
              title: title(variantTitle(i), true),
              blocks: blokiLista(p, zs, uchitelTask),
            })),
          ];
  /* Источник задач — одной строкой в разделе ответов, у каждого варианта. */
  const istochnik = (zs: ListZadacha[]): string[] =>
    sPometkoy
      ? []
      : [
          `<div class="sheet-item z11-sheet-istochnik">${SHEET_11.istochnik(
            zs.filter((z) => z.poz.vid === 'bank').map((z) => z.no),
            zs.length,
          )}</div>`,
        ];
  const otvety: string[] =
    vid === 'uchenik'
      ? []
      : [
          answers.sectionHead(SHEET_11.otvety, SHEET_11.otvetyNote, { section: nV > 1 }),
          ...list.poVariantam.flatMap((zs, i) => [
            ...(nV > 1 ? [answers.subHead(`Вариант ${i + 1}`)] : []),
            ...istochnik(zs),
            answers.table(
              SHEET_11.otvety,
              zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
              5,
            ),
          ]),
        ];
  const one = poVariantam.length === 1 ? poVariantam[0] : undefined;
  return {
    theme: p.theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_11.title.chip}. ${SHEET_11.title.text} — ${subtitleOf(p)}`,
    head: SHEET_11.head,
    runner: SHEET_11.runner,
    title: one?.title ?? title(),
    recap: null,
    blocks: one?.blocks ?? [],
    fields: { date: '' },
    ...(one === undefined ? { variants: poVariantam } : {}),
    withAnswerLine: vid === 'uchenik',
    extraItems: otvety,
    foot: SHEET_11.foot,
  };
}
