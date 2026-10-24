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
import { RAZDELY_TEORII_11 } from '@/content/teoriya11';
import answers from '@/lib/sheet/answers.js';
import { exampleItem } from '@/lib/sheet/sheet.js';
import {
  klyuchSlota,
  planPoKlyucham as planPoKlyuchamObshchiy,
  razobratSostav,
  slotySostava,
  sostavIzSlotov,
  sostavStroka,
  type Slot,
} from '@/lib/generator/obshchiy/klyuchi';
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
  /** «Дополнительно» генератора. Нет — лист как прежде. */
  dop?: Dop11;
}

export type VidRaboty11 = keyof typeof SHEET_11.vidy;

/**
 * «Дополнительно» генератора (docs/generator/02-design.md, макет А):
 * рамка теории перед типом задач, разобранные примеры, QR-код на лист
 * ученика, вид работы, дата и учитель в шапке. Всё — в адресе листа.
 */
export interface Dop11 {
  teoriya: boolean;
  /** Разобранных примеров на тип: 0–2. */
  primery: 0 | 1 | 2;
  qr: boolean;
  /** Вид работы в шапке; null — подпись по составу. */
  vid: VidRaboty11 | null;
  /** Дата на листе: «2026-10-24»; пусто — пустая линия. */
  data: string;
  uchitel: string;
}

export const DOP_11: Dop11 = {
  teoriya: false,
  primery: 0,
  qr: false,
  vid: null,
  data: '',
  uchitel: SHEET_11.head.author,
};

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
  const dop = p.rezhim === 'marshrut' ? undefined : p.dop;
  if (dop !== undefined) {
    if (dop.teoriya) q.set('tr', '1');
    if (dop.primery > 0) q.set('pr', String(dop.primery));
    if (dop.qr) q.set('qr', '1');
    if (dop.vid !== null) q.set('vr', dop.vid);
    if (dop.data !== '') q.set('d', dop.data);
    if (dop.uchitel !== DOP_11.uchitel) q.set('uch', dop.uchitel);
  }
  return q.toString();
}

/** «Дополнительно» из адреса; нет ни одного ключа — undefined. */
function dopIzZaprosa(q: URLSearchParams): Dop11 | undefined {
  if (!['tr', 'pr', 'qr', 'vr', 'd', 'uch'].some((k) => q.has(k))) return undefined;
  const pr = Number(q.get('pr'));
  const vr = q.get('vr') ?? '';
  const data = q.get('d') ?? '';
  return {
    teoriya: q.get('tr') === '1',
    primery: pr === 1 || pr === 2 ? pr : 0,
    qr: q.get('qr') === '1',
    vid: vr in SHEET_11.vidy ? (vr as VidRaboty11) : null,
    data: /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : '',
    uchitel: q.has('uch')
      ? (q.get('uch') ?? '')
          .replace(/[\u0000-\u001f<>]/g, '')
          .trim()
          .slice(0, 40)
      : DOP_11.uchitel,
  };
}

export function parseSheetQuery11(q: URLSearchParams): SheetParams11 {
  const rezhim =
    (Object.keys(REZHIM_KOD) as Rezhim[]).find((k) => REZHIM_KOD[k] === q.get('m')) ?? 'otrabotka';
  const istochnik =
    (Object.keys(ISTOCHNIK_KOD) as Istochnik[]).find((k) => ISTOCHNIK_KOD[k] === q.get('i')) ??
    'bank';
  const poKlyucham = rezhim !== 'marshrut' && q.get('ps') === '2';
  const dop = rezhim === 'marshrut' ? undefined : dopIzZaprosa(q);
  const sostav = razobratSostav(q.get('s') ?? '', poKlyucham, /[A-Z]{2}-\d{2}/, subtypeEst);
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
    ...(dop === undefined ? {} : { dop }),
  };
}

/* ── Ключи позиций (схема ps=2): lib/generator/obshchiy/klyuchi.ts ── */

export type Slot11 = Slot;
export { klyuchSlota, slotySostava, sostavIzSlotov };

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

/** Схема ps=2: задача — функция ключа позиции, варианта и seed листа. */
function planPoKlyucham(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  const sh = shablony(p);
  const pohozha = pohozhaNa(bank);
  const { poVariantam, nehvatka } = planPoKlyuchamObshchiy<Shablon, UslovieBanka, Pozitsiya>({
    sh,
    variants: p.variants,
    seed: p.seed,
    zameny: p.zameny,
    mixSol: 'z11-mix',
    bank: (id) => bankPodtipa(p, bank, id),
    analogi: (id) => analogiPodtipa(p, bank, id),
    bankPoz: (b) => ({ vid: b.razminka ? 'razminka' : 'bank', id: b.id, no: b.no }),
    analogPoz: (a) => ({ vid: 'analog', id: a.id, no: a.no }),
    novaya: (c, seed, zanyato) => ({
      vid: 'new',
      id: c.s.id,
      ...novayaZadacha(c.s.id, seed, pohozha, zanyato),
    }),
    seedNovoy: (x) => (x.vid === 'new' ? x.seed : undefined),
  });
  return { poVariantam, bloki: sh.map((s) => s.blok), nehvatka };
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
  /** Разобранные примеры: подтип → примеры («*» — на весь вариант). */
  primery?: Record<string, Primer11[]>;
}

/** Разобранный пример: новая задача того же типа, которой нет на листе. */
export interface Primer11 {
  title: string;
  questionHtml: string;
  solutionHtml: string;
  answerHtml: string;
}

/**
 * Примеры листа. Отработка — k примеров к каждому подтипу, вариант
 * ЕГЭ — k на весь вариант, из первых подтипов. Одни и те же во всех
 * вариантах и у ученика, и у учителя; условие не повторяет задачи листа.
 */
function primeryLista(
  p: SheetParams11,
  poVariantam: ListZadacha[][],
  pohozha: Pohozha,
): Record<string, Primer11[]> {
  const k = p.dop?.primery ?? 0;
  if (k === 0 || p.rezhim === 'marshrut') return {};
  const zanyato = new Set(poVariantam.flat().map((z) => z.questionHtml));
  const ids = [...new Set((poVariantam[0] ?? []).map((z) => z.poz.id))];
  const primer = (id: string, a: number): Primer11 | null => {
    try {
      const g = generateBez(id, `${p.seed}|primer|${id}|${a}`, pohozha);
      const questionHtml = typeset(g.solved.uslovie);
      if (zanyato.has(questionHtml)) return null;
      zanyato.add(questionHtml);
      const kontekst: Kontekst = {
        typeset,
        pechat: true,
        pokazano: { pravilo: false, priznaki: false },
      };
      return {
        title: subtype(id).title,
        questionHtml,
        solutionHtml: reshenieHtml(g.solved.etapy, g.solved.tables ?? [], kontekst),
        answerHtml: typeset(`$${d(g.solved.answer)}$`),
      };
    } catch {
      return null;
    }
  };
  const nabrat = (id: string, n: number): Primer11[] => {
    const out: Primer11[] = [];
    for (let a = 0; out.length < n && a < 25; a += 1) {
      const x = primer(id, a);
      if (x !== null) out.push(x);
    }
    return out;
  };
  if (p.rezhim === 'otrabotka') {
    return Object.fromEntries(ids.map((id) => [id, nabrat(id, k)]));
  }
  const iz = ids.length >= k ? ids.slice(0, k) : ids;
  return { '*': iz.flatMap((id) => nabrat(id, ids.length >= k ? 1 : k)) };
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
  const primery = primeryLista(p, poVariantam, pohozha);
  return {
    poVariantam,
    bloki: plan.bloki,
    nehvatka: plan.nehvatka,
    ...(Object.keys(primery).length > 0 ? { primery } : {}),
  };
}

/* ── Описание листа для шаблона lib/sheet ───────────────────────── */

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

export function subtitleOf(p: SheetParams11): string {
  if (p.rezhim === 'marshrut') {
    const m = MARSHRUTY_11.find((x) => x.no === p.marshrut);
    return m === undefined ? '' : SHEET_11.subtitle.marshrut(m.no, m.title);
  }
  const vid = p.dop?.vid ?? null;
  return vid === null ? SHEET_11.subtitle[p.rezhim] : SHEET_11.vidy[vid];
}

/** «2026-10-24» → «24.10.2026». */
export function dataNaListe(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m === null ? '' : `${m[3]}.${m[2]}.${m[1]}`;
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
/** Задачи по блокам листа: по типам (отработка), по этапам урока или один блок. */
function gruppyLista(p: SheetParams11, zadachi: ListZadacha[]): ListZadacha[][] {
  if (p.rezhim === 'komplekt') return [zadachi];
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
  return gruppy;
}

/** Рамка «Повторяем»: пункты из вкладки «Теория». */
export interface Ramka11 {
  title: string;
  items: string[];
}

/** Пункты рамки раздела: определение, главная формула и следствия. */
function punktyTeorii(razdel: string, kratko: boolean): string[] {
  const r = RAZDELY_TEORII_11.find((x) => x.section === razdel);
  if (r?.formula === undefined) return [];
  const formula = (tex: string, podpis: string) => `${typeset(`$${tex}$`)} — ${typeset(podpis)}`;
  if (kratko) return [`<b>${typeset(r.title)}.</b> ${formula(r.formula.tex, r.formula.podpis)}`];
  return [
    typeset(r.lead),
    formula(r.formula.tex, r.formula.podpis),
    ...(r.formula.sledstviya ?? []).slice(0, 2).map((x) => formula(x.tex, x.podpis)),
  ];
}

/**
 * Что стоит перед блоком листа: рамка теории и разобранные примеры.
 * Отработка — перед первым блоком каждого раздела (рамка) и подтипа
 * (примеры); вариант ЕГЭ — одна рамка и примеры перед всеми задачами.
 * Ключ — номер блока.
 */
export function peredBlokami(
  p: SheetParams11,
  list: SobrannyyList,
  zadachi: ListZadacha[],
): Map<number, { ramka: Ramka11 | null; primery: Primer11[] }> {
  const out = new Map<number, { ramka: Ramka11 | null; primery: Primer11[] }>();
  const dop = p.dop;
  if (dop === undefined || p.rezhim === 'marshrut') return out;
  const razdelOf = (z: ListZadacha | undefined) =>
    z === undefined || z.poz.vid === 'mikro' ? '' : subtype(z.poz.id).section;
  if (p.rezhim === 'komplekt') {
    const razdely = [...new Set(zadachi.map((z) => razdelOf(z)))];
    const items = dop.teoriya ? razdely.flatMap((r) => punktyTeorii(r, true)) : [];
    const primery = list.primery?.['*'] ?? [];
    if (items.length > 0 || primery.length > 0)
      out.set(0, {
        ramka: items.length === 0 ? null : { title: SHEET_11.povtoryaem, items },
        primery,
      });
    return out;
  }
  const bylRazdel = new Set<string>();
  const bylPodtip = new Set<string>();
  gruppyLista(p, zadachi).forEach((g, i) => {
    const first = g[0];
    const razdel = razdelOf(first);
    const id = first?.poz.id ?? '';
    let ramka: Ramka11 | null = null;
    if (dop.teoriya && !bylRazdel.has(razdel)) {
      const items = punktyTeorii(razdel, false);
      const nazvanie = RAZDELY_TEORII_11.find((x) => x.section === razdel)?.title ?? '';
      if (items.length > 0) ramka = { title: `${SHEET_11.povtoryaem} ${nazvanie}`, items };
    }
    bylRazdel.add(razdel);
    const primery = bylPodtip.has(id) ? [] : (list.primery?.[id] ?? []);
    bylPodtip.add(id);
    if (ramka !== null || primery.length > 0) out.set(i, { ramka, primery });
  });
  return out;
}

/** То же, что peredBlokami, но ключ — номер задачи в варианте: для предпросмотра. */
export function peredZadachami(
  p: SheetParams11,
  list: SobrannyyList,
  zadachi: ListZadacha[],
): Map<number, { ramka: Ramka11 | null; primery: Primer11[] }> {
  const pered = peredBlokami(p, list, zadachi);
  const out = new Map<number, { ramka: Ramka11 | null; primery: Primer11[] }>();
  gruppyLista(p, zadachi).forEach((g, i) => {
    const x = pered.get(i);
    const first = g[0];
    if (x !== undefined && first !== undefined) out.set(zadachi.indexOf(first), x);
  });
  return out;
}

function primerItem(x: Primer11): string {
  return exampleItem({
    label: SHEET_11.primer,
    title: x.title,
    conditionHtml: x.questionHtml,
    /* Пример разобран и у ученика: рамка — опора, а не задача. */
    solutionHtml: `${x.solutionHtml}<p class="sheet-task-answer">${SHEET_11.otvet}: <b>${x.answerHtml}</b></p>`,
    figureSvg: null,
  });
}

function blokiLista(
  p: SheetParams11,
  zadachi: ListZadacha[],
  task: (z: ListZadacha) => SheetTask,
  pered: Map<number, { ramka: Ramka11 | null; primery: Primer11[] }> = new Map(),
) {
  return gruppyLista(p, zadachi).map((tasks, i) => {
    const b = tasks[0]?.blok ?? '';
    const first = tasks[0];
    const x = pered.get(i);
    const dop =
      x === undefined
        ? {}
        : {
            recap: x.ramka === null ? null : { ...x.ramka, stack: true },
            leadItems: x.primery.map((y) => primerItem(y)),
          };
    if (p.rezhim === 'komplekt') {
      return { head: false, title: '', note: '', ...dop, tasks: tasks.map(task) };
    }
    return p.rezhim === 'marshrut'
      ? { title: BLOK_ROUTE[b] ?? b, note: '', tasks: tasks.map(task) }
      : { id: first?.kod ?? b, title: first?.title ?? b, note: '', ...dop, tasks: tasks.map(task) };
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
export function sheetSpec11(
  p: SheetParams11,
  list: SobrannyyList,
  vid: VidLista,
  /** QR-код на лист ученика, SVG: считает страница печати по своему адресу. */
  qrSvg?: string,
) {
  const dop = p.rezhim === 'marshrut' ? undefined : p.dop;
  const title = (variant?: string, uchitel = false) => ({
    chip: SHEET_11.title.chip,
    text: SHEET_11.title.text,
    subtitle: subtitleOf(p) + (uchitel ? ` · ${SHEET_11.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
    ...(dop?.qr === true && qrSvg !== undefined ? { qr: qrSvg } : {}),
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
          blocks: blokiLista(p, zs, uchenikTask(false), peredBlokami(p, list, zs)),
        }))
      : vid === 'uchitel'
        ? list.poVariantam.map((zs, i) => ({
            title: title(variantTitle(i), true),
            blocks: blokiLista(p, zs, uchitelTask, peredBlokami(p, list, zs)),
          }))
        : [
            ...list.poVariantam.map((zs, i) => ({
              title: title(variantTitle(i)),
              blocks: blokiLista(p, zs, uchenikTask(true), peredBlokami(p, list, zs)),
            })),
            ...list.poVariantam.map((zs, i) => ({
              title: title(variantTitle(i), true),
              blocks: blokiLista(p, zs, uchitelTask, peredBlokami(p, list, zs)),
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
    head: dop === undefined ? SHEET_11.head : { ...SHEET_11.head, author: dop.uchitel },
    runner: SHEET_11.runner,
    title: one?.title ?? title(),
    recap: null,
    blocks: one?.blocks ?? [],
    fields: { date: dataNaListe(dop?.data ?? '') },
    ...(one === undefined ? { variants: poVariantam } : {}),
    withAnswerLine: vid === 'uchenik',
    extraItems: otvety,
    foot: SHEET_11.foot,
  };
}
