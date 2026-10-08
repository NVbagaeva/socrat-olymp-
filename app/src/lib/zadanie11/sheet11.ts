/**
 * Лист задания №11: адрес → план → задачи → описание листа.
 *
 * Всё, что определяет лист, живёт в адресе: режим, источник, состав,
 * число вариантов, блоки листа, seed и замены отдельных задач. Один
 * адрес — один и тот же лист; листы ученика и учителя по одному
 * адресу содержат одни и те же задачи. Задачи считает движок №11 в
 * браузере, лист раскладывает общий шаблон lib/sheet/.
 *
 * Режимы: «Задания для отработки» (по N задач на тип, блоками по
 * типам), «Варианты» (K вариантов; на позиции i во всех вариантах —
 * задача одного типа) и «Маршрут урока» (опорные → банк → новые).
 * Без повторов внутри листа: задача банка берётся один раз, новые —
 * с разными параметрами. Замена задачи («перегенерировать одну»)
 * берёт следующий кандидат того же типа и не трогает остальные.
 *
 * Блоки рабочего листа (вкл/выкл и порядок — в адресе): «Что нужно
 * знать» (формула, таблица, лайфхак и ловушка разделов листа — из
 * теории), «Разобранный пример» (задача банка с решением — и у
 * ученика), «Разминка навыка» (опорные микрозадачи к разделам листа),
 * «Задачи» (состав), «Найди ошибку» (наш разбор с одной типичной
 * ошибкой раздела — oshibki.ts), «Попробуй сам» (две похожие задачи ★)
 * и «Домашняя работа» — отдельной страницей, те же типы, другие задачи.
 * Лист учителя — решения и ответы ко всему, домашняя работа — своей
 * таблицей ответов.
 */

import { MARSHRUTY_11, SHEET_11 } from '@/content/repetitory11';
import { LAYFHAKI, LOVUSHKI, RAZDELY_TEORII_11 } from '@/content/teoriya11';
import { O_ZADANII_11 } from '@/content/zadanie11';
import answers from '@/lib/sheet/answers.js';
import sheet from '@/lib/sheet/sheet.js';
import { typesetKrupno as typeset } from '../tex';
import { rngOf } from '../vychisleniya/rng';
import { generateBez, paramsKey, pohozhaNa, type Pohozha } from './gen/core';
import { kodNaSayte } from './kod';
import { d } from './num';
import { naytiOshibku, type Etap, type NaydennayaOshibka } from './oshibki';
import { BLOKI } from './prep/bloki';
import { generateMikro } from './prep/generate';
import { subtype } from './prototypes';
import { SECTIONS } from './taxonomy';
import type { Istochnik, UslovieBanka } from './trenazher/sessiya';
import type { Params, SectionId, Solved, Tablitsa } from './types';

export type Rezhim = 'otrabotka' | 'komplekt' | 'marshrut';

/** Блок рабочего листа. «Задачи» есть всегда. */
export type BlokLista = 'znat' | 'primer' | 'razminka' | 'zadachi' | 'oshibka' | 'sam' | 'dz';

/** Все блоки в порядке по умолчанию. */
export const BLOKI_LISTA: readonly BlokLista[] = [
  'znat',
  'primer',
  'razminka',
  'zadachi',
  'oshibka',
  'sam',
  'dz',
];

/** Лист без адреса блоков — только задачи: так же, как раньше. */
export const BLOKI_PO_UMOLCHANIYU: readonly BlokLista[] = ['zadachi'];
export const DZ_PO_UMOLCHANIYU = 4;
export const DZ_MAX = 10;
/** Микрозадач в «Разминке навыка» и задач в «Попробуй сам». */
const RAZMINKA_N = 4;
const SAM_N = 2;

export interface SheetParams11 {
  rezhim: Rezhim;
  istochnik: Istochnik;
  /** Состав: подтип и сколько задач (на лист или на вариант). */
  sostav: { id: string; n: number }[];
  variants: number;
  seed: string;
  /** Замены задач: «вариант.позиция» → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Номер маршрута урока (режим «marshrut»). */
  marshrut: number;
  theme: 'color' | 'print';
  /** Блоки листа в порядке печати; «zadachi» — всегда. В маршруте не используется. */
  bloki: BlokLista[];
  /** Задач в домашней работе (блок «dz»). */
  dz: number;
  /** Место для решения (поле в клетку) под задачами на листе ученика. */
  mesto: boolean;
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
  } else {
    q.set('s', p.sostav.map((x) => `${x.id}:${x.n}`).join(','));
  }
  if (p.variants > 1) q.set('v', String(p.variants));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  if (p.theme === 'print') q.set('t', 'print');
  if (p.bloki.join() !== BLOKI_PO_UMOLCHANIYU.join()) q.set('b', p.bloki.join(','));
  if (p.bloki.includes('dz') && p.dz !== DZ_PO_UMOLCHANIYU) q.set('d', String(p.dz));
  if (p.mesto) q.set('p', '1');
  return q.toString();
}

/** Блоки из адреса: только известные, без повторов, «Задачи» обязательно. */
export function normBloki(spisok: readonly string[]): BlokLista[] {
  const out: BlokLista[] = [];
  for (const b of spisok) {
    if ((BLOKI_LISTA as readonly string[]).includes(b) && !out.includes(b as BlokLista)) {
      out.push(b as BlokLista);
    }
  }
  if (!out.includes('zadachi')) out.push('zadachi');
  return out;
}

export function parseSheetQuery11(q: URLSearchParams): SheetParams11 {
  const rezhim =
    (Object.keys(REZHIM_KOD) as Rezhim[]).find((k) => REZHIM_KOD[k] === q.get('m')) ?? 'otrabotka';
  const istochnik =
    (Object.keys(ISTOCHNIK_KOD) as Istochnik[]).find((k) => ISTOCHNIK_KOD[k] === q.get('i')) ??
    'bank';
  const sostav = (q.get('s') ?? '')
    .split(',')
    .map((x) => x.split(':'))
    .map(([id = '', n = '1']) => ({ id, n: Math.max(1, Math.min(20, Number(n) || 1)) }))
    .filter((x) => /^[A-Z]{2}-\d{2}$/.test(x.id) && subtypeEst(x.id));
  const v = Number(q.get('v'));
  const r = Number(q.get('r'));
  const dz = Number(q.get('d'));
  const zameny: Record<string, number> = {};
  for (const item of (q.get('z') ?? '').split(',')) {
    const [pos = '', k = ''] = item.split(':');
    if (/^\d+\.\d+$/.test(pos) && Number(k) > 0) zameny[pos] = Math.min(50, Number(k));
  }
  return {
    rezhim,
    istochnik,
    sostav,
    variants: Number.isFinite(v) && v > 1 ? Math.min(VARIANTS_MAX_11, Math.floor(v)) : 1,
    seed: q.get('seed') ?? 'list',
    zameny,
    marshrut: MARSHRUTY_11.some((m) => m.no === r) ? r : 1,
    theme: q.get('t') === 'print' ? 'print' : 'color',
    bloki: normBloki((q.get('b') ?? BLOKI_PO_UMOLCHANIYU.join(',')).split(',')),
    dz: Number.isFinite(dz) && dz >= 1 ? Math.min(DZ_MAX, Math.floor(dz)) : DZ_PO_UMOLCHANIYU,
    mesto: q.get('p') === '1',
  };
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

/** Часть листа, в которой стоит задача. */
export type Chast = Exclude<BlokLista, 'znat'>;

/** Шаблон позиции: что нужно, без конкретной задачи. */
interface Shablon {
  /** Подтип или опорный блок (P11-…). */
  id: string;
  istochnik: 'bank' | 'new' | 'mix' | 'mikro';
  /** Блок листа: тип задачи, «опорные», «банк», «новые». */
  blok: string;
  chast: Chast;
}

/** Разделы задач состава — в порядке изучения. */
function razdelySostava(p: SheetParams11): SectionId[] {
  const est = new Set(p.sostav.map((x) => subtype(x.id).section));
  return SECTIONS.map((s) => s.id).filter((id) => est.has(id));
}

/** Типы состава от ★ к ★★★ (устойчиво: при равном уровне — порядок состава). */
function tipyPoUrovnyu(p: SheetParams11): string[] {
  return p.sostav
    .map((x, i) => ({ id: x.id, level: subtype(x.id).level, i }))
    .sort((a, b) => a.level - b.level || a.i - b.i)
    .map((x) => x.id);
}

/** Опорные блоки к разделам листа: свои и те, что нужны перед разделом. */
function opornyeDlya(razdely: SectionId[]) {
  const nuzhny = razdely.flatMap((s) => O_ZADANII_11.pered[s] ?? []);
  const svoi = BLOKI.filter(
    (b) => razdely.includes(b.razdel as SectionId) || nuzhny.includes(b.nazvanie),
  );
  return svoi.length > 0 ? svoi : BLOKI.slice(0, 1);
}

/**
 * Шаблоны позиций. Сначала «Задачи» — их номера позиций (замены
 * «вариант.позиция») не зависят от других блоков; затем разминка,
 * разобранный пример, «Попробуй сам» и домашняя работа.
 */
/**
 * Тип для «Найди ошибку»: первый тип состава (от сложных к простым —
 * у сложных разбор длиннее и ошибок больше), к разбору которого
 * применима хоть одна ошибка словаря; проверяется на задаче банка и
 * на новой задаче. Нет такого — null, блока на листе не будет.
 */
function tipDlyaOshibki(p: SheetParams11, bank: readonly UslovieBanka[]): string | null {
  const pohozha = pohozhaNa(bank);
  for (const id of [...tipyPoUrovnyu(p)].reverse()) {
    const st = subtype(id);
    const probы: Etap[][] = [];
    const b = bank.find((x) => x.id === id && x.analog === undefined);
    if (b !== undefined) probы.push(st.solve(b.params as Params).etapy);
    try {
      probы.push(generateBez(id, `${p.seed}|osh`, pohozha).solved.etapy);
    } catch {
      /* Не подобралось — хватит задачи банка. */
    }
    if (probы.length > 0 && probы.every((e) => naytiOshibku(e, st.section, 'x') !== null)) {
      return id;
    }
  }
  return null;
}

function shablony(p: SheetParams11, bank: readonly UslovieBanka[]): Shablon[] {
  if (p.rezhim === 'marshrut') {
    const m = MARSHRUTY_11.find((x) => x.no === p.marshrut) ?? MARSHRUTY_11[0];
    if (m === undefined) return [];
    const chast = 'zadachi' as const;
    return [
      ...m.opornye.map((id) => ({ id, istochnik: 'mikro' as const, blok: 'opornye', chast })),
      ...m.bank.map((id) => ({ id, istochnik: 'bank' as const, blok: 'bank', chast })),
      ...m.novye.map((id) => ({ id, istochnik: 'new' as const, blok: 'novye', chast })),
    ];
  }
  const ist = p.istochnik === 'mix' ? 'mix' : p.istochnik === 'new' ? 'new' : 'bank';
  const out: Shablon[] = p.sostav.flatMap((x) =>
    Array.from(
      { length: x.n },
      () => ({ id: x.id, istochnik: ist, blok: x.id, chast: 'zadachi' }) as Shablon,
    ),
  );
  if (p.sostav.length === 0) return out;
  const tipy = tipyPoUrovnyu(p);
  if (p.bloki.includes('razminka')) {
    const bloki = opornyeDlya(razdelySostava(p));
    for (let i = 0; i < RAZMINKA_N; i += 1) {
      const b = bloki[i % bloki.length];
      if (b !== undefined) {
        out.push({ id: b.id, istochnik: 'mikro', blok: 'razminka', chast: 'razminka' });
      }
    }
  }
  if (p.bloki.includes('primer')) {
    /* Пример — самый простой тип листа, из банка (как на экзамене);
       в режиме «похожие» — похожая. */
    out.push({
      id: tipy[0] ?? '',
      istochnik: ist === 'new' ? 'new' : 'bank',
      blok: 'primer',
      chast: 'primer',
    });
  }
  if (p.bloki.includes('oshibka')) {
    const id = tipDlyaOshibki(p, bank);
    if (id !== null) out.push({ id, istochnik: ist, blok: 'oshibka', chast: 'oshibka' });
  }
  if (p.bloki.includes('sam')) {
    for (let i = 0; i < SAM_N; i += 1) {
      out.push({ id: tipy[i] ?? tipy[0] ?? '', istochnik: 'new', blok: 'sam', chast: 'sam' });
    }
  }
  if (p.bloki.includes('dz')) {
    for (let i = 0; i < p.dz; i += 1) {
      out.push({ id: tipy[i % tipy.length] ?? '', istochnik: ist, blok: 'dz', chast: 'dz' });
    }
  }
  return out;
}

export interface PlanLista {
  /** Позиции по вариантам. */
  poVariantam: Pozitsiya[][];
  /** Шаблоны позиций: блок листа у каждой. */
  bloki: string[];
  /** Шаблоны позиций: часть листа у каждой. */
  chasti: Chast[];
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

export function planLista(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  const sh = shablony(p, bank);
  const pohozha = pohozhaNa(bank);
  const zanyatoNovye = new Set<string>();
  const ochered = new Map<string, UslovieBanka[]>();
  /* Очередь задач банка для подтипа: перемешана по seed листа. */
  function bankDlya(id: string): UslovieBanka[] {
    let o = ochered.get(id);
    if (o === undefined) {
      const r = rngOf(`z11-list|${p.seed}|${id}`);
      /* Разминка — не открытый банк: её задачи идут только в «банк + новые». */
      const svoi = bank.filter(
        (b) => b.id === id && b.analog === undefined && (!b.razminka || p.istochnik === 'mix'),
      );
      o = r.sample(svoi, svoi.length);
      ochered.set(id, o);
    }
    return o;
  }
  /* Пул аналогов подтипа: «новые» задачи берутся сначала из него. */
  const pul = new Map<string, UslovieBanka[]>();
  function analogDlya(id: string): UslovieBanka | undefined {
    let o = pul.get(id);
    if (o === undefined) {
      const svoi = bank.filter((b) => b.id === id && b.analog !== undefined);
      o = rngOf(`z11-analog|${p.seed}|${id}`).sample(svoi, svoi.length);
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
  return {
    poVariantam,
    bloki: sh.map((s) => s.blok),
    chasti: sh.map((s) => s.chast),
    nehvatka,
  };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export interface ListZadacha {
  /** Номер на листе: сквозной по частям, домашняя работа — с единицы, пример — 0. */
  no: number;
  /** «вариант.позиция» — для кнопки замены. */
  pos: string;
  poz: Pozitsiya;
  blok: string;
  chast: Chast;
  kod: string;
  title: string;
  questionHtml: string;
  /** Ответ строкой для таблицы ответов. */
  answer: string;
  /** Ответ, набранный KaTeX. */
  answerHtml: string;
  /** Решение по этапам с таблицами: для листа учителя. */
  solutionHtml: string;
  /** «Найди ошибку»: что внесено в разбор. */
  oshibka?: NaydennayaOshibka;
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
  /* Строка уравнения подписана под таблицей; в условии (skryt) — нет:
     там это подсказка. */
  const vyn =
    !skryt && t.uravnenie !== undefined
      ? `<p class="z11-sheet-tab-vyn">${SHEET_11.uravnenie}</p>`
      : '';
  return `<table class="z11-sheet-tab">${title}<thead>${head}</thead><tbody>${rows}</tbody></table>${vyn}`;
}

/** Число для ответа: 2.25 → «2,25». */
function chislo(x: number): string {
  return String(Math.round(x * 1e9) / 1e9).replace('.', ',');
}

function reshenieHtml(etapy: { title: string; lines: string[] }[], tables: Tablitsa[]): string {
  const tab = tables.map((t) => tablitsaHtml(t)).join('');
  /* Узкая таблица S | v | t или A | p | t — справа от шагов, шаги её
     обтекают: решение на листе учителя короче на высоту таблицы. */
  const t0 = tables[0];
  const sboku =
    tables.length === 1 &&
    t0 !== undefined &&
    (t0.vid === 'dvizhenie' || t0.vid === 'rabota') &&
    t0.head.length <= 4;
  const items = etapy
    .map((e) => {
      const lines = e.lines.filter((l) => !/^\*\*Ответ:\*\*/.test(l));
      if (lines.length === 0) return '';
      return `<li class="sheet-step"><b>${typeset(e.title)}.</b> ${lines.map((l) => typeset(l)).join(' ')}</li>`;
    })
    .join('');
  return `<div class="z11-sheet-resh${sboku ? ' z11-sheet-resh--sboku' : ''}">${tab}<ol class="sheet-steps z11-sheet-steps">${items}</ol></div>`;
}

/** Разбор с ошибкой для ученика: таблицы и шаги, без ответа и без пометок. */
function oshibkaUcheniku(o: NaydennayaOshibka, tables: Tablitsa[]): string {
  const tab = tables.map((t) => tablitsaHtml(t)).join('');
  const items = o.etapy
    .map((e) => {
      const lines = e.lines.filter((l) => !/^\*\*Ответ:\*\*/.test(l));
      if (lines.length === 0) return '';
      return `<li><b>${typeset(e.title)}.</b> ${lines.map((l) => typeset(l)).join(' ')}</li>`;
    })
    .join('');
  return `<div class="z11-sheet-osh"><p class="z11-sheet-osh__lead">${SHEET_11.oshibka.lead}</p>${tab}<ol class="z11-sheet-osh__steps">${items}</ol></div>`;
}

/** Разбор ошибки для учителя: где, что не так, как было и как верно. */
function oshibkaUchitelyu(o: NaydennayaOshibka): string {
  const { gde, bylo, verno } = SHEET_11.oshibka;
  return (
    `<p class="z11-sheet-osh__gde"><b>${gde}: ${o.shag}.</b> ${typeset(o.oshibka.chto)}</p>` +
    `<p>${bylo}: ${typeset(o.stalo)}</p>` +
    `<p>${verno}: ${typeset(o.bylo)}</p>` +
    `<p>${typeset(o.oshibka.verno)}</p>`
  );
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

/** Карточка «Что нужно знать» одного раздела: готовая разметка листа. */
export interface ZnatKarta {
  section: SectionId;
  nazvanie: string;
  html: string;
}

export interface SobrannyyList {
  poVariantam: ListZadacha[][];
  bloki: string[];
  nehvatka: number;
  /** «Что нужно знать» по разделам листа; пусто — блок выключен. */
  znat: ZnatKarta[];
}

/**
 * «Что нужно знать» — по карточке на раздел листа: главная формула,
 * таблица модели (если разделов не больше двух — иначе лист распухает),
 * первый лайфхак и первая ловушка раздела из теории.
 */
function znatKarty(razdely: SectionId[]): ZnatKarta[] {
  const sTablitsey = razdely.length <= 2;
  return razdely.flatMap((sec): ZnatKarta[] => {
    const r = RAZDELY_TEORII_11.find((x) => x.section === sec);
    const nazvanie = SECTIONS.find((s) => s.id === sec)?.nazvanie ?? sec;
    if (r === undefined) return [];
    const stroki: string[] = [];
    if (r.formula !== undefined) {
      stroki.push(
        `<p class="z11-znat__row"><b>${SHEET_11.znat.zapomni}.</b> <span class="z11-znat__formula">${typeset(`$${r.formula.tex}$`)}</span> — ${typeset(r.formula.podpis)}</p>`,
      );
    } else if (r.idei[0] !== undefined) {
      stroki.push(
        `<p class="z11-znat__row"><b>${SHEET_11.znat.zapomni}.</b> ${typeset(r.idei[0])}</p>`,
      );
    }
    const tab = r.tablitsa?.tables[0];
    if (sTablitsey && tab !== undefined) stroki.push(tablitsaHtml(tab));
    const lh = r.layfhaki[0];
    if (lh !== undefined) {
      stroki.push(
        `<p class="z11-znat__row"><b>${SHEET_11.znat.layfhak}.</b> ${typeset(LAYFHAKI[lh].title)}: ${typeset(LAYFHAKI[lh].lead)}</p>`,
      );
    }
    const lv = r.lovushki.map((id) => LOVUSHKI[id]).find((x) => x !== undefined);
    if (lv !== undefined) {
      stroki.push(
        `<p class="z11-znat__row"><b>${SHEET_11.znat.lovushka}.</b> ${typeset(lv.title)}: ${typeset(lv.text)}</p>`,
      );
    }
    return [
      {
        section: sec,
        nazvanie,
        html: `<section class="sheet-recap z11-znat"><div class="sheet-recap-main"><h2 class="sheet-recap-title">${nazvanie}</h2>${stroki.join('')}</div></section>`,
      },
    ];
  });
}

/**
 * Номера задач на листе: сквозные по частям в порядке блоков листа;
 * домашняя работа — отдельная страница, с единицы; пример без номера.
 */
function pronumerovat(p: SheetParams11, zs: ListZadacha[]): void {
  let n = 0;
  for (const b of p.rezhim === 'marshrut' ? (['zadachi'] as const) : p.bloki) {
    if (b === 'znat' || b === 'primer') continue;
    if (b === 'dz') {
      zs.filter((z) => z.chast === 'dz').forEach((z, i) => {
        z.no = i + 1;
      });
      continue;
    }
    for (const z of zs) {
      if (z.chast === b) {
        n += 1;
        z.no = n;
      }
    }
  }
}

/** Задачи листа по вариантам: условия, ответы, решения. */
export function sobratList(p: SheetParams11, bank: readonly UslovieBanka[]): SobrannyyList {
  const plan = planLista(p, bank);
  const pohozha = pohozhaNa(bank);
  const poVariantam = plan.poVariantam.map((row, vi) =>
    row.map((pozIsh, i): ListZadacha => {
      const pos = `${vi + 1}.${i + 1}`;
      const blok = plan.bloki[i] ?? '';
      const chast = plan.chasti[i] ?? 'zadachi';
      if (pozIsh.vid === 'mikro') {
        const poz = pozIsh;
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
          no: 0,
          pos,
          poz,
          blok,
          chast,
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
              .map((l) => `<li class="sheet-step">${typeset(l)}</li>`)
              .join('')}</ol>`,
        };
      }
      let poz: Exclude<Pozitsiya, { vid: 'mikro' }> = pozIsh;
      let s = zadachaIzBanka(poz, bank, pohozha);
      const st = subtype(poz.id);
      if (chast === 'oshibka') {
        /* К этой задаче ошибка не подобралась — берём новую того же
           типа (seed позиции), пока не подберётся. */
        let o = naytiOshibku(s.etapy, st.section, `${p.seed}|${pos}`);
        for (let k = 1; o === null && k <= 12; k += 1) {
          try {
            const g = generateBez(poz.id, `${p.seed}|${pos}|osh${k}`, pohozha);
            const kand = naytiOshibku(g.solved.etapy, st.section, `${p.seed}|${pos}|${k}`);
            if (kand !== null) {
              s = g.solved;
              poz = { vid: 'new', id: poz.id, seed: `${p.seed}|${pos}|osh${k}` };
              o = kand;
            }
          } catch {
            /* Следующий seed. */
          }
        }
        if (o !== null) {
          return {
            no: 0,
            pos,
            poz,
            blok,
            chast,
            kod: kodNaSayte(poz.id),
            title: st.title,
            questionHtml: typeset(s.uslovie) + oshibkaUcheniku(o, s.tables ?? []),
            answer: o.shag,
            answerHtml: o.shag,
            solutionHtml: oshibkaUchitelyu(o),
            oshibka: o,
          };
        }
      }
      const vybor = s.vybor;
      const otvetVybor = vybor === undefined ? null : (vybor.options[vybor.correct] ?? '');
      return {
        no: 0,
        pos,
        poz,
        blok,
        chast,
        kod: kodNaSayte(poz.id),
        title: st.title,
        questionHtml: typeset(
          (poz.vid === 'new' ? undefined : bank.find((b) => b.no === poz.no)?.analog?.tekst) ??
            s.uslovie,
        ),
        answer: otvetVybor === null ? chislo(s.answer) : otvetVybor.replace(/\$/g, ''),
        answerHtml: otvetVybor === null ? typeset(`$${d(s.answer)}$`) : typeset(otvetVybor),
        solutionHtml: reshenieHtml(s.etapy, s.tables ?? []),
      };
    }),
  );
  for (const zs of poVariantam) pronumerovat(p, zs);
  const znat =
    p.rezhim !== 'marshrut' && p.bloki.includes('znat') ? znatKarty(razdelySostava(p)) : [];
  return { poVariantam, bloki: plan.bloki, nehvatka: plan.nehvatka, znat };
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

interface SheetBlock {
  head?: false;
  title: string;
  note: string;
  tasks?: SheetTask[];
  /** Готовые куски потока: рамки «что нужно знать», разобранный пример. */
  items?: string[];
}

type Task = (z: ListZadacha) => SheetTask;

/**
 * Блоки части «Задачи»: по типам (отработка), по этапам урока
 * (маршрут) или один; без полосы, если на листе нет других блоков.
 */
function blokiZadach(
  p: SheetParams11,
  zadachi: ListZadacha[],
  task: Task,
  sPolosoy: boolean,
): SheetBlock[] {
  if (p.rezhim === 'komplekt') {
    return [
      sPolosoy
        ? { title: SHEET_11.chasti.zadachi, note: '', tasks: zadachi.map(task) }
        : { head: false, title: '', note: '', tasks: zadachi.map(task) },
    ];
  }
  const order: string[] = [];
  for (const z of zadachi) if (!order.includes(z.blok)) order.push(z.blok);
  return order.map((b) => {
    const tasks = zadachi.filter((z) => z.blok === b);
    const first = tasks[0];
    return p.rezhim === 'marshrut'
      ? { title: BLOK_ROUTE[b] ?? b, note: '', tasks: tasks.map(task) }
      : { title: first?.title ?? b, note: '', tasks: tasks.map(task) };
  });
}

/** Разобранный пример: условие, решение по этапам и ответ — виден и ученику. */
function primerItem(z: ListZadacha): string {
  return sheet.exampleItem({
    label: SHEET_11.chasti.primer,
    title: z.title,
    conditionHtml: z.questionHtml,
    solutionHtml: `${z.solutionHtml}<p class="z11-sheet-primer-otvet">${SHEET_11.otvet}: <b>${z.answerHtml}</b></p>`,
    figureSvg: null,
  });
}

/**
 * Блоки страницы варианта в порядке блоков листа (без домашней работы —
 * она на своей странице). Маршрут урока — как прежде: опорные → банк → новые.
 */
function blokiStranitsy(
  p: SheetParams11,
  zs: ListZadacha[],
  znat: ZnatKarta[],
  task: Task,
): SheetBlock[] {
  if (p.rezhim === 'marshrut') return blokiZadach(p, zs, task, false);
  const drugie = p.bloki.some(
    (b) =>
      b !== 'zadachi' &&
      b !== 'dz' &&
      (b === 'znat' ? znat.length > 0 : zs.some((z) => z.chast === b)),
  );
  const out: SheetBlock[] = [];
  for (const b of p.bloki) {
    if (b === 'dz') continue;
    if (b === 'znat') {
      if (znat.length > 0) {
        out.push({
          title: SHEET_11.chasti.znat,
          note: '',
          items: znat.map((k) => `<div class="sheet-item">${k.html}</div>`),
        });
      }
      continue;
    }
    if (b === 'primer') {
      const z = zs.find((x) => x.chast === 'primer');
      if (z !== undefined) out.push({ head: false, title: '', note: '', items: [primerItem(z)] });
      continue;
    }
    if (b === 'zadachi') {
      out.push(
        ...blokiZadach(
          p,
          zs.filter((z) => z.chast === 'zadachi'),
          task,
          drugie,
        ),
      );
      continue;
    }
    const tasks = zs.filter((z) => z.chast === b);
    if (tasks.length > 0) {
      out.push({ title: SHEET_11.chasti[b], note: SHEET_11.chastiNote[b], tasks: tasks.map(task) });
    }
  }
  return out;
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

function bejdzh(z: ListZadacha): string {
  /* Код типа — только учителю и мелко: по нему задача находится в тренажёре и генераторе. */
  const kod =
    z.poz.vid === 'mikro' ? '' : `<span class="z11-sheet-kod">${SHEET_11.tip} ${z.kod}</span>`;
  return `<span class="z11-sheet-badge">${SHEET_11.bejdzh[z.poz.vid]}</span>${kod}`;
}

/**
 * Описание листа. Ученику — условия и строка «Ответ: ____»; учителю —
 * те же задачи с решением по этапам (таблицы по методике), ответом и
 * пометкой «банк» / «новая», в конце — таблица ответов. Домашняя
 * работа — отдельной страницей после варианта, у учителя — своей
 * таблицей ответов. «Всё одним файлом» — листы учеников всех
 * вариантов, затем листы учителя.
 */
export function sheetSpec11(p: SheetParams11, list: SobrannyyList, vid: VidLista) {
  const title = (variant?: string, uchitel = false, dz = false) => ({
    chip: SHEET_11.title.chip,
    text: SHEET_11.title.text,
    subtitle:
      subtitleOf(p) +
      (dz ? ` · ${SHEET_11.chasti.dz}` : '') +
      (uchitel ? ` · ${SHEET_11.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
  });
  /* Поле для решения: у задач листа, кроме опорных микрозадач; у
     «Найди ошибку» — пониже, там пишут одну исправленную строку. */
  const mesto = (z: ListZadacha): string =>
    !p.mesto || z.poz.vid === 'mikro' || z.chast === 'razminka' || z.chast === 'primer'
      ? ''
      : `<div class="z11-sheet-mesto${z.chast === 'oshibka' ? ' z11-sheet-mesto--malo' : ''}"></div>`;
  const uchenikTask =
    (sStrokoy: boolean) =>
    (z: ListZadacha): SheetTask => {
      const html = mesto(z) + (sStrokoy ? STROKA_OTVETA : '');
      return {
        no: z.no,
        id: z.pos,
        questionHtml: z.questionHtml,
        options: null,
        figureSvg: null,
        solutionHtml: html === '' ? null : html,
      };
    };
  const uchitelTask = (z: ListZadacha): SheetTask => ({
    no: z.no,
    id: z.pos,
    questionHtml: `${bejdzh(z)} ${z.questionHtml}`,
    options: null,
    figureSvg: null,
    solutionHtml: `${z.solutionHtml}<p class="sheet-task-answer">${SHEET_11.otvet}: <b>${z.answerHtml}</b></p>`,
  });
  const nV = list.poVariantam.length;
  const variantTitle = (i: number) => (nV > 1 ? `Вариант ${i + 1}` : undefined);
  /* Страницы одного вида: вариант, за ним — его домашняя работа. */
  const stranitsy = (task: Task, uchitel: boolean) =>
    list.poVariantam.flatMap((zs, i) => {
      const dz = zs.filter((z) => z.chast === 'dz');
      return [
        { title: title(variantTitle(i), uchitel), blocks: blokiStranitsy(p, zs, list.znat, task) },
        ...(dz.length === 0
          ? []
          : [
              {
                title: title(variantTitle(i), uchitel, true),
                blocks: [{ head: false as const, title: '', note: '', tasks: dz.map(task) }],
              },
            ]),
      ];
    });
  const poVariantam =
    vid === 'uchenik'
      ? stranitsy(uchenikTask(false), false)
      : vid === 'uchitel'
        ? stranitsy(uchitelTask, true)
        : [...stranitsy(uchenikTask(true), false), ...stranitsy(uchitelTask, true)];
  const tablitsa = (zs: ListZadacha[]) =>
    answers.table(
      SHEET_11.otvety,
      zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
      5,
    );
  const otvety: string[] =
    vid === 'uchenik'
      ? []
      : [
          /* Один вариант без домашней работы — ответы сразу за последней
             задачей, если помещаются: отдельная страница ради таблицы в
             одну строку не нужна. Вариантов несколько или есть домашняя
             работа (своя страница) — раздел ответов с новой страницы. */
          nV > 1 || list.poVariantam.some((zs) => zs.some((z) => z.chast === 'dz'))
            ? answers.sectionHead(SHEET_11.otvety, SHEET_11.otvetyNote, { section: nV > 1 })
            : answers
                .sectionHead(SHEET_11.otvety, SHEET_11.otvetyNote, { section: false })
                .replace(' data-page-break="1"', ''),
          ...list.poVariantam.flatMap((zs, i) => {
            const osnovnye = zs.filter((z) => z.chast !== 'dz' && z.chast !== 'primer');
            const dz = zs.filter((z) => z.chast === 'dz');
            return [
              ...(nV > 1 ? [answers.subHead(`Вариант ${i + 1}`)] : []),
              tablitsa(osnovnye),
              ...(dz.length === 0
                ? []
                : [
                    answers.subHead(
                      nV > 1 ? `Вариант ${i + 1}. ${SHEET_11.chasti.dz}` : SHEET_11.chasti.dz,
                    ),
                    tablitsa(dz),
                  ]),
            ];
          }),
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
