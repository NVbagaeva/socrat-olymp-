/**
 * Лист задания №1: адрес → план → задачи → описание листа. Устройство
 * — как у листа №11 (lib/zadanie11/sheet11.ts).
 *
 * Всё, что определяет лист, живёт в адресе: режим, источник, состав,
 * число вариантов, seed, замены отдельных задач и рамка теории. Один
 * адрес — один и тот же лист; листы ученика и учителя по одному
 * адресу содержат одни и те же задачи. Задачи и чертежи считает
 * движок №1 в браузере, лист раскладывает общий шаблон lib/sheet/.
 *
 * Режимы: «Задания для отработки» (по N задач на тип, блоками I–X),
 * «Варианты» (K вариантов; на позиции i во всех вариантах — задача
 * одного типа) и «Маршрут урока» (опорные → банк → новые). Без
 * повторов внутри листа: задача банка берётся один раз, новые — с
 * разными числами. Замена задачи берёт следующий кандидат того же
 * типа и не трогает остальные.
 *
 * Рамка теории: перед задачами каждого блока — «Повторяем» (главные
 * факты раздела теории) и 0–2 разобранных примера с чертежом учителя.
 * Пример — задача того же типа, которой на листе нет.
 */

import { BLOKI_UROKA_1, SHEET_1, UROKI_1, type BlokUroka1 } from '@/content/repetitory1';
import { SHPARGALKI_1, kartochkaPrototipa } from '@/content/teoriya1';
import { O_ZADANII_1 } from '@/content/zadanie1';
import answers from '@/lib/sheet/answers.js';
import sheet from '@/lib/sheet/sheet.js';
import { typesetKrupno as typeset } from '../tex';
import { rngOf } from '../vychisleniya/rng';
import { zadachiPrototipa } from './bank/fipi';
import { BLOKI } from './prep/bloki';
import { generateMikro, sOtvetom } from './prep/generate';
import { renderPlan } from './render';
import { shirinaRisunka } from './shirina';
import { plitkiHtml } from './spravochnik';
import { parseKodSerii, planUroka, seriya, type NastroykiUroka } from './uroki';
import { PROTOTIPY, prototip } from './stseny';
import type { Blok, Params } from './stseny/dsl';
import {
  klyuchProto,
  protoKlyucha,
  type Istochnik,
  type UslovieBanka,
  type ZadachaPlan,
} from './trenazher/sessiya';
import { novyeParams, otvetTex, razreshit, sostavZadachi } from './trenazher/zadacha';

export type Rezhim = 'otrabotka' | 'komplekt' | 'urok';

export interface SheetParams1 {
  rezhim: Rezhim;
  istochnik: Istochnik;
  /** Состав: прототип («p05») и сколько задач (на лист или на вариант). */
  sostav: { id: string; n: number }[];
  variants: number;
  seed: string;
  /** Замены задач: «вариант.позиция» → сколько раз заменяли. */
  zameny: Record<string, number>;
  /** Урок серии «Для репетиторов» (режим «urok»): номер, код комплекта, настройки блоков. */
  urok: number;
  kod: string;
  nastroyki: NastroykiUroka;
  theme: 'color' | 'print';
  /** Рамка теории: −1 — нет, 0–2 — рамка и столько разобранных примеров. */
  ramka: number;
}

export const VARIANTS_MAX_1 = 8;

/* ── Адрес ──────────────────────────────────────────────────────── */

const REZHIM_KOD: Record<Rezhim, string> = { otrabotka: 'o', komplekt: 'v', urok: 'u' };
const ISTOCHNIK_KOD: Record<Istochnik, string> = { bank: 'b', mix: 'm', new: 'n' };

export function sheetQuery1(p: SheetParams1): string {
  const q = new URLSearchParams();
  q.set('m', REZHIM_KOD[p.rezhim]);
  q.set('i', ISTOCHNIK_KOD[p.istochnik]);
  if (p.rezhim === 'urok') {
    q.set('u', String(p.urok));
    q.set('k', p.kod);
    if (p.nastroyki.vykl.length > 0) q.set('b', p.nastroyki.vykl.join(','));
    if (p.nastroyki.polnye === true) q.set('pr', '1');
    const n = Object.entries(p.nastroyki.n).filter(([, x]) => x !== undefined);
    if (n.length > 0) q.set('n', n.map(([b, x]) => `${b}:${x}`).join(','));
  } else {
    q.set('s', p.sostav.map((x) => `${x.id}:${x.n}`).join(','));
  }
  if (p.variants > 1) q.set('v', String(p.variants));
  if (p.ramka >= 0) q.set('f', String(p.ramka));
  q.set('seed', p.seed);
  const z = Object.entries(p.zameny).filter(([, k]) => k > 0);
  if (z.length > 0) q.set('z', z.map(([pos, k]) => `${pos}:${k}`).join(','));
  if (p.theme === 'print') q.set('t', 'print');
  return q.toString();
}

const IDS = new Set(PROTOTIPY.map((p) => klyuchProto(p.id)));

export function parseSheetQuery1(q: URLSearchParams): SheetParams1 {
  const rezhim =
    (Object.keys(REZHIM_KOD) as Rezhim[]).find((k) => REZHIM_KOD[k] === q.get('m')) ?? 'otrabotka';
  const istochnik =
    (Object.keys(ISTOCHNIK_KOD) as Istochnik[]).find((k) => ISTOCHNIK_KOD[k] === q.get('i')) ??
    'bank';
  const sostav = (q.get('s') ?? '')
    .split(',')
    .map((x) => x.split(':'))
    .map(([id = '', n = '1']) => ({ id, n: Math.max(1, Math.min(20, Number(n) || 1)) }))
    .filter((x) => IDS.has(x.id));
  const v = Number(q.get('v'));
  const u = Number(q.get('u'));
  const BLOKI = new Set<string>(BLOKI_UROKA_1.map((b) => b.id));
  const vykl = (q.get('b') ?? '').split(',').filter((b): b is BlokUroka1 => BLOKI.has(b));
  const n: NastroykiUroka['n'] = {};
  for (const item of (q.get('n') ?? '').split(',')) {
    const [b = '', x = ''] = item.split(':');
    if (BLOKI.has(b) && /^\d+$/.test(x)) n[b as BlokUroka1] = Number(x);
  }
  const f = q.get('f');
  const zameny: Record<string, number> = {};
  for (const item of (q.get('z') ?? '').split(',')) {
    const [pos = '', k = ''] = item.split(':');
    if (/^\d+\.\d+$/.test(pos) && Number(k) > 0) zameny[pos] = Math.min(50, Number(k));
  }
  return {
    rezhim,
    istochnik,
    sostav,
    variants: Number.isFinite(v) && v > 1 ? Math.min(VARIANTS_MAX_1, Math.floor(v)) : 1,
    seed: q.get('seed') ?? 'list',
    zameny,
    urok: UROKI_1.some((x) => x.no === u) ? u : 1,
    kod: q.get('k') ?? '',
    nastroyki: { vykl, n, ...(q.get('pr') === '1' ? { polnye: true } : {}) },
    theme: q.get('t') === 'print' ? 'print' : 'color',
    ramka: f === '0' || f === '1' || f === '2' ? Number(f) : -1,
  };
}

/* ── План ───────────────────────────────────────────────────────── */

/** Что стоит на позиции листа. */
export type Pozitsiya = ZadachaPlan | { vid: 'mikro'; id: string; seed: string; blok: string };

interface Shablon {
  /** Прототип («p05») или опорный блок (P1-…). */
  id: string;
  istochnik: 'bank' | 'new' | 'mix' | 'mikro';
  /** Блок листа: блок I–X, «опорные», «банк», «новые». */
  blok: string;
}

function blokProto(id: string): Blok {
  return prototip(protoKlyucha(id)).blok;
}

function shablony(p: SheetParams1): Shablon[] {
  const ist = p.istochnik;
  return p.sostav.flatMap((x) =>
    Array.from({ length: x.n }, () => ({ id: x.id, istochnik: ist, blok: blokProto(x.id) })),
  );
}

export interface PlanLista {
  poVariantam: Pozitsiya[][];
  bloki: string[];
  /** Урок: блоки по порядку листа, в том числе без задач (шпаргалка). */
  poryadok?: { id: string; title: string }[];
  /** Сколько позиций «из банка» пришлось заменить новыми: банк кончился. */
  nehvatka: number;
}

function klyuchNabora(id: string, p: Params): string {
  return `${id}|${Object.keys(p)
    .sort()
    .map((k) => `${k}=${p[k as keyof Params]}`)
    .join(';')}`;
}

/** Лист урока серии: блоки из lib/planimetriya/uroki.ts. */
function planUrokaLista(p: SheetParams1, bank: readonly UslovieBanka[]): PlanLista {
  const kod = parseKodSerii(p.kod) ?? { osnova: '000000', regen: {} };
  const plan = planUroka(seriya(kod, bank), p.urok, p.nastroyki);
  const bloki = plan.bloki.filter((b) => b.pozicii.length > 0 || b.id === 'shpargalka');
  return {
    poVariantam: [bloki.flatMap((b) => b.pozicii)],
    bloki: bloki.flatMap((b) => b.pozicii.map(() => b.id)),
    poryadok: bloki.map((b) => ({ id: b.id, title: b.title })),
    nehvatka: plan.nehvatka,
  };
}

export function planLista(p: SheetParams1, bank: readonly UslovieBanka[]): PlanLista {
  if (p.rezhim === 'urok') return planUrokaLista(p, bank);
  const sh = shablony(p);
  const zanyato = new Set<string>();
  const ochered = new Map<string, UslovieBanka[]>();
  function bankDlya(id: string): UslovieBanka[] {
    let o = ochered.get(id);
    if (o === undefined) {
      const svoi = bank.filter((b) => b.id === id && !b.analog);
      o = rngOf(`z1-list|${p.seed}|${id}`).sample(svoi, svoi.length);
      ochered.set(id, o);
    }
    return o;
  }
  const pul = new Map<string, UslovieBanka[]>();
  function analogDlya(id: string): UslovieBanka | undefined {
    let o = pul.get(id);
    if (o === undefined) {
      const svoi = bank.filter((b) => b.id === id && b.analog);
      o = rngOf(`z1-analog|${p.seed}|${id}`).sample(svoi, svoi.length);
      pul.set(id, o);
    }
    return o.shift();
  }
  /* Новая задача: seed, на котором числа ещё не встречались на листе. */
  function novaya(id: string, seed: string): Pozitsiya {
    for (let a = 0; a < 12; a += 1) {
      const s = a === 0 ? seed : `${seed}~${a}`;
      const params = novyeParams(protoKlyucha(id), s);
      if (params === null) continue;
      const key = klyuchNabora(id, params);
      if (!zanyato.has(key)) {
        zanyato.add(key);
        return { vid: 'new', id, seed: s };
      }
    }
    return { vid: 'new', id, seed };
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
      (s.istochnik === 'mix' && rngOf(`z1-mix|${p.seed}|${v}|${i}`).next() < 0.5);
    if (izBanka) {
      const b = bankDlya(s.id).shift();
      if (b !== undefined) {
        return { vid: 'bank', id: b.id, no: b.no };
      }
      if (s.istochnik === 'bank') nehvatka += 1;
    }
    const a = analogDlya(s.id);
    if (a !== undefined) {
      return { vid: 'analog', id: a.id, no: a.no };
    }
    return novaya(s.id, seed);
  };
  const poVariantam = Array.from({ length: p.variants }, (_, v) =>
    sh.map((s, i) => vybrat(s, v + 1, i + 1, 0)),
  );
  for (const [pos, k] of Object.entries(p.zameny)) {
    const [v = 0, i = 0] = pos.split('.').map(Number);
    const s = sh[i - 1];
    const row = poVariantam[v - 1];
    if (s === undefined || row === undefined) continue;
    row[i - 1] = vybrat(s, v, i, k);
  }
  return { poVariantam, bloki: sh.map((s) => s.blok), nehvatka };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export interface ListZadacha {
  no: number;
  /** «вариант.позиция» — для кнопки замены. */
  pos: string;
  poz: Pozitsiya;
  blok: string;
  /** Номер прототипа «05» или номер опорного блока. */
  kod: string;
  title: string;
  /** Номер задачи Блока 1 ФИПИ (только у задачи банка). */
  fipi: number | null;
  questionHtml: string;
  /** Чертёж условия (лист ученика) и со всеми построениями (учитель). */
  figureSvg: string | null;
  figureUchitelSvg: string | null;
  answer: string;
  answerHtml: string;
  solutionHtml: string;
  /** Ключевой шаг решения одной строкой — таблица ответов учителя. */
  klyuchShagHtml: string;
}

/** Ответ строкой для таблицы ответов: 4.5 → «4,5». */
function chisloOtveta(x: number): string {
  return String(Math.round(x * 1e9) / 1e9).replace('.', ',');
}

/** Чертёж решения на листе учителя: ширина по клетке раздела, не шире, мм
    (нижнюю границу и место — справа или под условием — даёт шаблон листа). */
const RESHENIE_MAX_MM = 44;

export { shirinaRisunka };

export interface SobrannyyList {
  poVariantam: ListZadacha[][];
  bloki: string[];
  poryadok?: { id: string; title: string }[];
  nehvatka: number;
}

export function sobratList(p: SheetParams1, bank: readonly UslovieBanka[]): SobrannyyList {
  const plan = planLista(p, bank);
  const poVariantam = plan.poVariantam.map((row, vi) =>
    row.map((poz, i): ListZadacha => {
      const pos = `${vi + 1}.${i + 1}`;
      const blok = plan.bloki[i] ?? '';
      if (poz.vid === 'mikro') {
        const z = generateMikro(poz.id, poz.seed);
        const b = BLOKI.find((x) => x.id === poz.blok);
        return {
          no: i + 1,
          pos,
          poz,
          blok,
          kod: b?.no ?? '',
          title: b?.nazvanie ?? '',
          fipi: null,
          questionHtml: typeset(z.uslovie),
          figureSvg: z.risunok === null ? null : renderPlan(z.risunok, { chisla: true }),
          figureUchitelSvg:
            z.risunok === null
              ? null
              : renderPlan(sOtvetom(z.risunok, z.otvet), {
                  rezhim: { rezhim: 'uchitel' },
                  chisla: true,
                }),
          answer: chisloOtveta(z.otvet),
          answerHtml: typeset(`$${otvetTex(z.otvet)}$`),
          solutionHtml: `<ol class="sheet-steps z1-sheet-steps">${z.razbor
            .map((l) => `<li class="sheet-step">${typeset(l)}</li>`)
            .join('')}</ol>`,
          klyuchShagHtml: typeset(z.razbor[z.razbor.length - 1] ?? ''),
        };
      }
      const r = razreshit(poz, bank);
      const s = sostavZadachi(r);
      return {
        no: i + 1,
        pos,
        poz,
        blok,
        kod: String(r.proto).padStart(2, '0'),
        title: s.title,
        fipi: r.fipi,
        questionHtml: typeset(s.uslovie),
        figureSvg: s.risunokSvg,
        figureUchitelSvg: s.razbor.risunokSvg,
        answer: chisloOtveta(s.otvet),
        answerHtml: s.razbor.otvetHtml,
        solutionHtml: s.reshenieLista,
        klyuchShagHtml: s.klyuchShag,
      };
    }),
  );
  return {
    poVariantam,
    bloki: plan.bloki,
    ...(plan.poryadok === undefined ? {} : { poryadok: plan.poryadok }),
    nehvatka: plan.nehvatka,
  };
}

/* ── Рамка теории ───────────────────────────────────────────────── */

export interface Ramka {
  title: string;
  /** Пункты «Повторяем» — HTML с формулами KaTeX. */
  items: string[];
  primery: {
    /** Название типа, набранное KaTeX. */
    title: string;
    conditionHtml: string;
    solutionHtml: string;
    figureSvg: string;
  }[];
}

/**
 * Рамка теории для прототипов: пункты «Запомни» их разделов теории и
 * k разобранных примеров — задачи тех же прототипов, которых на листе
 * нет (сначала задачи банка, иначе образец).
 */
export function ramkaDlya(
  title: string,
  protos: readonly number[],
  k: number,
  zanyatye: ReadonlySet<string>,
): Ramka {
  /* Пункты — карточки справочника, к которым ведут прототипы листа:
     тот же источник, что вкладка «Теория» и шпаргалки уроков. */
  const kartochki = [
    ...new Map(
      protos.flatMap((n) => {
        const k = kartochkaPrototipa(n);
        return k === null ? [] : [[k.id, k] as const];
      }),
    ).values(),
  ];
  const items = kartochki.map(
    (k) =>
      `<b>${typeset(k.title)}</b>${k.formula === undefined ? '' : ` ${typeset(`$${k.formula}$`)}`}`,
  );
  const primery: Ramka['primery'] = [];
  for (const n of [...new Set(protos)]) {
    if (primery.length >= k) break;
    const p = prototip(n);
    const svobodnaya = zadachiPrototipa(n).find((z) => !zanyatye.has(`b${z.n}`));
    const params = { ...p.primer, ...(svobodnaya?.params ?? {}) } as Params;
    const s = sostavZadachi({
      proto: n,
      params,
      variant: { povorot: 0, otrazhenie: false, bukvy: {} },
      fipi: svobodnaya?.n ?? null,
    });
    primery.push({
      title: typeset(s.title),
      conditionHtml: typeset(s.uslovie),
      solutionHtml: `${s.reshenieLista}<p class="sheet-task-answer">${SHEET_1.otvet}: <b>${s.razbor.otvetHtml}</b></p>`,
      figureSvg: s.razbor.risunokSvg,
    });
  }
  return { title, items, primery };
}

/** Рамки листа по блокам листа: заголовок блока → рамка. */
export function ramkiLista(p: SheetParams1, list: SobrannyyList): Map<string, Ramka> {
  const out = new Map<string, Ramka>();
  /* У урока вместо рамки — шпаргалка из карточек справочника. */
  if (p.ramka < 0 || p.rezhim === 'urok') return out;
  const zanyatye = new Set(
    list.poVariantam.flat().flatMap((z) => (z.poz.vid === 'bank' ? [`b${z.poz.no}`] : [])),
  );
  const protosBloka = (blok: string) => [
    ...new Set(
      list.poVariantam
        .flat()
        .filter((z) => z.blok === blok && z.poz.vid !== 'mikro')
        .map((z) => protoKlyucha(z.poz.id)),
    ),
  ];
  if (p.rezhim === 'otrabotka') {
    for (const blok of new Set(list.bloki)) {
      const tip = O_ZADANII_1.tipy.find((t) => t.blok === blok);
      out.set(blok, ramkaDlya(tip?.title ?? blok, protosBloka(blok), p.ramka, zanyatye));
    }
    return out;
  }
  /* Варианты и урок: одна рамка перед задачами по всем типам листа. */
  const vse = [
    ...new Set(
      list.poVariantam
        .flat()
        .filter((z) => z.poz.vid !== 'mikro')
        .map((z) => protoKlyucha(z.poz.id)),
    ),
  ];
  out.set('*', ramkaDlya('', vse, p.ramka, zanyatye));
  return out;
}

/* ── Описание листа для шаблона lib/sheet ───────────────────────── */

export type VidLista = 'uchenik' | 'uchitel' | 'vse';

function subtitleOf(p: SheetParams1): string {
  if (p.rezhim === 'urok') {
    const u = UROKI_1.find((x) => x.no === p.urok);
    return u === undefined ? '' : SHEET_1.subtitle.urok(u.no, u.title);
  }
  return SHEET_1.subtitle[p.rezhim];
}

/** Шпаргалка урока: плитка карточек справочника — тот же HTML, что печатная шпаргалка. */
function shpargalkaItem(urok: number): string {
  return `<div class="sheet-item z1-sheet-shpargalka">${plitkiHtml(SHPARGALKI_1[urok] ?? [])}</div>`;
}

interface SheetTask {
  no: number;
  id: string;
  questionHtml: string;
  options: null;
  figureSvg: string | null;
  figureWidth: number;
  figureBelow?: boolean;
  solutionHtml: string | null;
}

interface SheetBlock {
  id?: string;
  head?: boolean;
  title: string;
  note: string;
  recap?: { title: string; items: string[] } | null;
  leadItems?: string[];
  tasks: SheetTask[];
}

/**
 * Разобранный пример кусками потока: условие, чертёж и первый шаг —
 * один кусок, каждый следующий шаг и ответ — свои. Так пример после
 * «Повторяем» начинается на той же странице, если туда помещаются
 * условие, чертёж и первый шаг, а решение рвётся только между шагами.
 */
function primerKuskami(x: Ramka['primery'][number]): string[] {
  const shagi = x.solutionHtml.match(/<li class="sheet-step">[\s\S]*?<\/li>/g) ?? [];
  const otvet = /<p class="sheet-task-answer">[\s\S]*<\/p>/.exec(x.solutionHtml)?.[0] ?? '';
  const ol = (li: string, start: number) =>
    `<ol class="sheet-steps z1-sheet-steps" start="${start}">${li}</ol>`;
  const golova = sheet.exampleItem({
    label: SHEET_1.primer,
    title: x.title,
    conditionHtml: x.conditionHtml,
    /* Пример разобран и у ученика: рамка — опора, а не задача. */
    solutionHtml:
      shagi.length === 0 ? x.solutionHtml : ol(shagi[0]!, 1) + (shagi.length === 1 ? otvet : ''),
    figureSvg: x.figureSvg,
    figureWidth: shirinaRisunka(x.figureSvg, 44),
  });
  const dalee = shagi
    .slice(1)
    .map(
      (li, i) =>
        `<div class="sheet-item sheet-example sheet-example--dalee"><div class="sheet-example-text"><div class="sheet-task-solution">${ol(li, i + 2)}${i === shagi.length - 2 ? otvet : ''}</div></div></div>`,
    );
  return [golova, ...dalee];
}

function recapRamki(r: Ramka | undefined) {
  if (r === undefined) return { recap: null, leadItems: [] as string[] };
  return {
    recap:
      r.items.length === 0
        ? null
        : { title: `${SHEET_1.povtoryaem}${r.title === '' ? '' : ` ${r.title}`}`, items: r.items },
    leadItems: r.primery.flatMap((x) => primerKuskami(x)),
  };
}

/** Блоки листа: по блокам I–X (отработка), по этапам урока или один без полосы. */
function blokiLista(
  p: SheetParams1,
  zadachi: ListZadacha[],
  task: (z: ListZadacha) => SheetTask,
  ramki: Map<string, Ramka>,
  poryadok?: { id: string; title: string }[],
): SheetBlock[] {
  if (p.rezhim === 'komplekt') {
    return [
      {
        head: false,
        title: '',
        note: '',
        ...recapRamki(ramki.get('*')),
        tasks: zadachi.map(task),
      },
    ];
  }
  if (p.rezhim === 'urok') {
    return (poryadok ?? []).map((b) => ({
      title: b.title,
      note: '',
      ...(b.id === 'shpargalka' ? { leadItems: [shpargalkaItem(p.urok)] } : {}),
      tasks: zadachi.filter((z) => z.blok === b.id).map(task),
    }));
  }
  const order: string[] = [];
  for (const z of zadachi) if (!order.includes(z.blok)) order.push(z.blok);
  return order.map((b) => {
    const tasks = zadachi.filter((z) => z.blok === b);
    const tip = O_ZADANII_1.tipy.find((t) => t.blok === b);
    return {
      id: b,
      title: tip?.title ?? b,
      note: '',
      ...recapRamki(ramki.get(b)),
      tasks: tasks.map(task),
    };
  });
}

const STROKA_OTVETA =
  '<p class="sheet-answer-line">Ответ:<span class="sheet-answer-blank"></span></p>';

function bejdzh(z: ListZadacha): string {
  const fipi = z.fipi === null ? '' : ` · ${SHEET_1.fipi(z.fipi)}`;
  const tip = z.poz.vid === 'mikro' ? '' : ` · ${SHEET_1.analogK} ${z.kod}`;
  return `<span class="z1-sheet-badge">${SHEET_1.bejdzh[z.poz.vid]}${fipi}${tip}</span>`;
}

/**
 * Описание листа. Ученику — условия, чертёж и строка «Ответ: ____»;
 * учителю — те же задачи с чертежом со всеми построениями, решением
 * по шагам, ответом и пометкой «банк» / «новая», в конце — таблица
 * ответов. «Всё одним файлом» — листы учеников всех вариантов, затем
 * листы учителя. Рамка теории одинакова на обоих листах.
 */
export function sheetSpec1(p: SheetParams1, list: SobrannyyList, vid: VidLista) {
  const ramki = ramkiLista(p, list);
  const title = (variant?: string, uchitel = false) => ({
    chip: SHEET_1.title.chip,
    text: SHEET_1.title.text,
    subtitle: subtitleOf(p) + (uchitel ? ` · ${SHEET_1.resheniya}` : ''),
    ...(variant === undefined ? {} : { variant }),
  });
  const uchenikTask =
    (sStrokoy: boolean) =>
    (z: ListZadacha): SheetTask => ({
      no: z.no,
      id: z.pos,
      questionHtml: z.questionHtml,
      options: null,
      figureSvg: z.figureSvg,
      figureWidth: shirinaRisunka(z.figureSvg),
      solutionHtml: sStrokoy ? STROKA_OTVETA : null,
    });
  /* Учителю — тот же рисунок условия, что ученику (один комплект —
     одни рисунки), а чертёж со всеми построениями — рядом с решением. */
  /* Учителю — один чертёж: со всеми построениями (подсказка решения).
     Рисунок условия в данных тот же, что у ученика (один комплект —
     одни рисунки, это сверяет test:komplekty), но на листе учителя его
     заменяет чертёж решения (pechat1.css). Чертёж уже половины колонки
     стоит справа от решения, шире — под условием, перед решением. */
  const uchitelTask = (z: ListZadacha): SheetTask => {
    const w = z.figureUchitelSvg === null ? 0 : shirinaRisunka(z.figureUchitelSvg, RESHENIE_MAX_MM);
    /* Размер — по правилам крупных рисунков (sheet/figureRules.js): не уже
       40 % строки и не мельче, чем нужно подписям; такой рисунок справа
       встаёт, только если остаётся место решению, иначе — под условием. */
    const placed =
      z.figureUchitelSvg === null
        ? null
        : (sheet.placeFigure(z.figureUchitelSvg, { width: w }) as { below: boolean });
    const sprava = placed !== null && !placed.below;
    const pic =
      z.figureUchitelSvg === null
        ? ''
        : (sheet.placeFigure(z.figureUchitelSvg, {
            width: w,
            cls: `z1-sheet-reshenie__pic${sprava ? '' : ' z1-sheet-reshenie__pic--pod'}`,
          }).html as string);
    return {
      no: z.no,
      id: z.pos,
      questionHtml: `${bejdzh(z)} ${z.questionHtml}`,
      options: null,
      figureSvg: z.figureSvg,
      figureWidth: shirinaRisunka(z.figureSvg),
      figureBelow: z.figureUchitelSvg === null,
      solutionHtml: `<div class="z1-sheet-reshenie">${pic}${z.solutionHtml}<p class="sheet-task-answer">${SHEET_1.otvet}: <b>${z.answerHtml}</b></p></div>`,
    };
  };
  /* Урок: полное решение с чертежом — только у «Разбора» (или у всех,
     если учитель включил «Полные решения»). Остальные задачи у учителя —
     условие и рисунок, как у ученика; ответ и ключевой шаг — в таблице
     ответов в конце листа. */
  const kratko = (z: ListZadacha) =>
    p.rezhim === 'urok' && p.nastroyki.polnye !== true && z.blok !== 'razbor';
  const uchitelKratko = (z: ListZadacha): SheetTask => ({
    no: z.no,
    id: z.pos,
    questionHtml: `${bejdzh(z)} ${z.questionHtml}`,
    options: null,
    figureSvg: z.figureSvg,
    figureWidth: shirinaRisunka(z.figureSvg),
    solutionHtml: null,
  });
  const uchitelZadacha = (z: ListZadacha): SheetTask =>
    kratko(z) ? uchitelKratko(z) : uchitelTask(z);
  const nV = list.poVariantam.length;
  const variantTitle = (i: number) => (nV > 1 ? `Вариант ${i + 1}` : undefined);
  const uchenik = (sStrokoy: boolean) =>
    list.poVariantam.map((zs, i) => ({
      title: title(variantTitle(i)),
      blocks: blokiLista(p, zs, uchenikTask(sStrokoy), ramki, list.poryadok),
    }));
  const uchitel = () =>
    list.poVariantam.map((zs, i) => ({
      title: title(variantTitle(i), true),
      blocks: blokiLista(p, zs, uchitelZadacha, ramki, list.poryadok),
    }));
  const poVariantam =
    vid === 'uchenik'
      ? uchenik(false)
      : vid === 'uchitel'
        ? uchitel()
        : [...uchenik(true), ...uchitel()];
  const otvety: string[] =
    vid === 'uchenik'
      ? []
      : p.rezhim === 'urok'
        ? tablitsaOtvetov(list.poVariantam.flat())
        : [
            answers.sectionHead(SHEET_1.otvety, SHEET_1.otvetyNote, { section: nV > 1 }),
            ...list.poVariantam.flatMap((zs, i) => [
              ...(nV > 1 ? [answers.subHead(`Вариант ${i + 1}`)] : []),
              answers.table(
                SHEET_1.otvety,
                zs.map((z) => ({ no: z.no, answer: z.answer, html: null })),
                5,
              ),
            ]),
          ];
  const one = poVariantam.length === 1 ? poVariantam[0] : undefined;
  return {
    theme: p.theme,
    layout: 'single' as const,
    documentTitle: `${SHEET_1.title.chip}. ${SHEET_1.title.text} — ${subtitleOf(p)}`,
    head: SHEET_1.head,
    runner: SHEET_1.runner,
    title: one?.title ?? title(),
    recap: null,
    blocks: one?.blocks ?? [],
    fields: { date: '' },
    ...(one === undefined ? { variants: poVariantam } : {}),
    withAnswerLine: vid === 'uchenik',
    extraItems: otvety,
    foot: SHEET_1.foot,
  };
}

/**
 * Таблица ответов листа учителя урока: номер, ответ и ключевой шаг
 * одной строкой. Таблица режется на куски по TABLITSA_STROK строк —
 * каждый кусок отдельный элемент потока, и раскладка листа переносит
 * таблицу на новую страницу между кусками.
 */
const TABLITSA_STROK = 10;

function tablitsaOtvetov(zadachi: ListZadacha[]): string[] {
  const golova = `<thead><tr><th>${SHEET_1.otvetyTab.no}</th><th>${SHEET_1.otvetyTab.otvet}</th><th>${SHEET_1.otvetyTab.shag}</th></tr></thead>`;
  const kuski: string[] = [];
  for (let i = 0; i < zadachi.length; i += TABLITSA_STROK) {
    const stroki = zadachi
      .slice(i, i + TABLITSA_STROK)
      .map(
        (z) =>
          `<tr><td class="z1-otvety__no">${z.no}</td><td class="z1-otvety__otvet">${z.answerHtml}</td><td class="z1-otvety__shag">${z.klyuchShagHtml}</td></tr>`,
      )
      .join('');
    kuski.push(
      `<div class="sheet-item z1-otvety"><table class="z1-otvety__tab">${golova}<tbody>${stroki}</tbody></table></div>`,
    );
  }
  /* Заголовок без начала новой страницы (у общего answers.sectionHead
     она есть): компактная таблица урока идёт сразу за задачами и не
     оставляет полстраницы пустыми; один внизу страницы он не остаётся. */
  const zagolovok = `<div class="sheet-item sheet-block" data-keep-with-next="1"><header class="sheet-block-head"><h2 class="sheet-block-title">${SHEET_1.otvety}</h2></header></div>`;
  return [zagolovok, ...kuski];
}

/** Ответ задачи листа для превью генератора: число с запятой. */
export { otvetTex };
