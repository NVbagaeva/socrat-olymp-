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
 */

import { MARSHRUTY_11, SHEET_11 } from '@/content/repetitory11';
import answers from '@/lib/sheet/answers.js';
import { typesetKrupno as typeset } from '../tex';
import { rngOf } from '../vychisleniya/rng';
import { generateBez, paramsKey, pohozhaNa, type Pohozha } from './gen/core';
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
  /** Состав: подтип и сколько задач (на лист или на вариант). */
  sostav: { id: string; n: number }[];
  variants: number;
  seed: string;
  /** Замены задач: «вариант.позиция» → сколько раз заменяли. */
  zameny: Record<string, number>;
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
  const sostav = (q.get('s') ?? '')
    .split(',')
    .map((x) => x.split(':'))
    .map(([id = '', n = '1']) => ({ id, n: Math.max(1, Math.min(20, Number(n) || 1)) }))
    .filter((x) => /^[A-Z]{2}-\d{2}$/.test(x.id) && subtypeEst(x.id));
  const v = Number(q.get('v'));
  const r = Number(q.get('r'));
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

/** Шаблон позиции: что нужно, без конкретной задачи. */
interface Shablon {
  /** Подтип или опорный блок (P11-…). */
  id: string;
  istochnik: 'bank' | 'new' | 'mix' | 'mikro';
  /** Блок листа: тип задачи, «опорные», «банк», «новые». */
  blok: string;
}

function shablony(p: SheetParams11): Shablon[] {
  if (p.rezhim === 'marshrut') {
    const m = MARSHRUTY_11.find((x) => x.no === p.marshrut) ?? MARSHRUTY_11[0];
    if (m === undefined) return [];
    return [
      ...m.opornye.map((id) => ({ id, istochnik: 'mikro' as const, blok: 'opornye' })),
      ...m.bank.map((id) => ({ id, istochnik: 'bank' as const, blok: 'bank' })),
      ...m.novye.map((id) => ({ id, istochnik: 'new' as const, blok: 'novye' })),
    ];
  }
  const ist = p.istochnik === 'mix' ? 'mix' : p.istochnik === 'new' ? 'new' : 'bank';
  return p.sostav.flatMap((x) =>
    Array.from({ length: x.n }, () => ({ id: x.id, istochnik: ist, blok: x.id }) as Shablon),
  );
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

export function planLista(p: SheetParams11, bank: readonly UslovieBanka[]): PlanLista {
  const sh = shablony(p);
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
  return { poVariantam, bloki: sh.map((s) => s.blok), nehvatka };
}

/* ── Задачи ─────────────────────────────────────────────────────── */

export interface ListZadacha {
  no: number;
  /** «вариант.позиция» — для кнопки замены. */
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

function reshenieHtml(etapy: { title: string; lines: string[] }[], tables: Tablitsa[]): string {
  const tab = tables.map((t) => tablitsaHtml(t)).join('');
  const items = etapy
    .map((e) => {
      const lines = e.lines.filter((l) => !/^\*\*Ответ:\*\*/.test(l));
      if (lines.length === 0) return '';
      return `<li class="sheet-step"><b>${typeset(e.title)}.</b> ${lines.map((l) => typeset(l)).join(' ')}</li>`;
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
  const poVariantam = plan.poVariantam.map((row, vi) =>
    row.map((poz, i): ListZadacha => {
      const pos = `${vi + 1}.${i + 1}`;
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
              .map((l) => `<li class="sheet-step">${typeset(l)}</li>`)
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
        solutionHtml: reshenieHtml(s.etapy, s.tables ?? []),
      };
    }),
  );
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
  const order: string[] = [];
  for (const z of zadachi) if (!order.includes(z.blok)) order.push(z.blok);
  return order.map((b) => {
    const tasks = zadachi.filter((z) => z.blok === b);
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
  const otvety: string[] =
    vid === 'uchenik'
      ? []
      : [
          answers.sectionHead(SHEET_11.otvety, SHEET_11.otvetyNote, { section: nV > 1 }),
          ...list.poVariantam.flatMap((zs, i) => [
            ...(nV > 1 ? [answers.subHead(`Вариант ${i + 1}`)] : []),
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
