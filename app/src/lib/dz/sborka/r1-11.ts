/**
 * №1 и №11 в ДЗ: задачи общего тренажёра (банк ФИПИ, аналоги и новые по
 * зерну), ответ и решение — теми же функциями, что собирают задачу
 * тренажёра (lib/planimetriya/trenazher/zadacha.ts,
 * lib/zadanie11/trenazher/zadacha.ts), но без отпечатка: ключ уходит в
 * базу. Опорные — микро-задачи блоков по зерну: аналог с новым зерном.
 * Работает в браузере репетитора при выдаче.
 *
 * Ключ задачи — как в тренажёре: «p05|b12» (банк), «p05|a1012» (аналог),
 * «p05|nСЕМЯ» (новая); у №11 ещё «|r1001» (разминка).
 */

import { typeset } from '@/lib/tex';
import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput, RazborDz, VidDz, VoprosDz } from '../types';
import { chisloEge, peremeshat, poKrugu } from './obshchee';
import type { SborshchikRazdela } from './razdely';

type Plan =
  | { vid: 'bank' | 'analog' | 'razminka'; no: number; id: string }
  | { vid: 'new'; id: string; seed: string };

/** Ключ → план тренажёра. */
export function planKlyucha(ref: string): Plan | null {
  const m = /^([^|]+)\|([bar])(\d+)$/.exec(ref);
  if (m !== null) {
    const vid = m[2] === 'b' ? 'bank' : m[2] === 'a' ? 'analog' : 'razminka';
    return { vid, no: Number(m[3]), id: m[1] as string };
  }
  const n = /^([^|]+)\|n(.+)$/.exec(ref);
  return n === null ? null : { vid: 'new', id: n[1] as string, seed: n[2] as string };
}

function klyuch(p: Plan): string {
  return p.vid === 'new'
    ? `${p.id}|n${p.seed}`
    : `${p.id}|${p.vid === 'bank' ? 'b' : p.vid === 'analog' ? 'a' : 'r'}${p.no}`;
}

/** Строка банка тренажёра (без ответа): то, что в каталоге раздела. */
export interface StrokaBanka {
  no: number;
  id: string;
  /** Аналог из пула (№1: analog true; №11: есть analog). */
  analog?: unknown;
  razminka?: boolean;
}

interface Postroeno {
  questionHtml: string;
  view: VidDz;
  answer: string;
  answerKind: 'number' | 'choice';
  razbor: RazborDz;
  source: string;
}

interface Konfig {
  postroit(plan: Plan, bank: readonly StrokaBanka[]): Promise<Postroeno>;
  /** Опорная по зерну. */
  opornaya(id: string, seed: string): Promise<Omit<Postroeno, 'source'> | null>;
}

function sozdat(k: Konfig): SborshchikRazdela {
  const bankOf = (kat: KatalogRazdela) => (kat.bankTrenazhera ?? []) as StrokaBanka[];
  const tipHtml = (kat: KatalogRazdela, id: string) =>
    kat.trenazher.flatMap((g) => g.tipy).find((t) => t.id === id)?.nazvanieHtml ?? id;

  async function edinitsa(
    kat: KatalogRazdela,
    plan: Plan,
    studentId: string | null,
  ): Promise<HwUnitInput | null> {
    try {
      const p = await k.postroit(plan, bankOf(kat));
      return {
        studentId,
        kind: plan.id,
        ref: klyuch(plan),
        answerKind: p.answerKind,
        questionHtml: p.questionHtml,
        view: { ...p.view, tipHtml: tipHtml(kat, plan.id) },
        answer: p.answer,
        razbor: p.razbor,
        source: p.source,
      };
    } catch {
      return null;
    }
  }

  return {
    opornyeIzZerna: true,
    async trenazher(kat, tipy, skolko, zerno, komu) {
      const bank = bankOf(kat);
      const ochered = new Map(
        tipy.map((t) => [
          t,
          peremeshat(
            bank.filter((b) => b.id === t && b.razminka !== true),
            `${zerno}:${t}`,
          ),
        ]),
      );
      const order = poKrugu(tipy, skolko);
      const shag = new Map<string, number>();
      const units: HwUnitInput[] = [];
      for (const [s, student] of komu.entries()) {
        const vidno = new Set<string>();
        for (const [j, t] of order.entries()) {
          const q = ochered.get(t) ?? [];
          let u: HwUnitInput | null = null;
          for (let popytka = 0; u === null && popytka < 20; popytka += 1) {
            const i = shag.get(t) ?? 0;
            shag.set(t, i + 1);
            const b = q[i];
            const plan: Plan =
              b !== undefined
                ? { vid: b.analog ? 'analog' : 'bank', no: b.no, id: t }
                : { vid: 'new', id: t, seed: `${zerno}:${s}:${j}:${popytka}` };
            const c = await edinitsa(kat, plan, student);
            if (c !== null && !vidno.has(c.questionHtml)) u = c;
          }
          if (u !== null) {
            vidno.add(u.questionHtml);
            units.push(u);
          }
        }
      }
      return units;
    },
    async zadacha(kat, ref) {
      const plan = planKlyucha(ref);
      const u = plan === null ? null : await edinitsa(kat, plan, null);
      return u === null ? [] : [u];
    },
    async analogZadachi(kat, ref, student, zerno) {
      const plan = planKlyucha(ref);
      if (plan === null) return null;
      for (let i = 0; i < 20; i += 1) {
        const u = await edinitsa(kat, { vid: 'new', id: plan.id, seed: `${zerno}:${i}` }, student);
        if (u !== null) return u;
      }
      return null;
    },
    async opornye(blok, ids, zerno, komu) {
      const out: HwUnitInput[] = [];
      for (const [s, student] of komu.entries()) {
        for (const id of ids) {
          const u = await opornaya(blok, id, `${zerno}:${s}`, student);
          if (u !== null) out.push(u);
        }
      }
      return out;
    },
    analogOpornoy: (blok, kind, _ref, zerno, student) => opornaya(blok, kind, zerno, student),
  };

  async function opornaya(
    blok: BlokKat,
    id: string,
    seed: string,
    studentId: string | null,
  ): Promise<HwUnitInput | null> {
    const p = await k.opornaya(id, seed).catch(() => null);
    const z = blok.zadachi.find((x) => x.id === id);
    if (p === null || z === undefined) return null;
    return {
      studentId,
      kind: id,
      ref: `${id}|${seed}`,
      answerKind: p.answerKind,
      questionHtml: p.questionHtml,
      view: {
        ...p.view,
        tipHtml: z.nazvanie ?? blok.nazvanie,
        zapomni: blok.zapomniHtml,
        ...(z.podskazkaHtml === '' ? {} : { podskazka: z.podskazkaHtml }),
      },
      answer: p.answer,
      razbor: p.razbor,
      source: `опорная ${id}`,
    };
  }
}

function voprosy(
  list: readonly { question: string; options: string[]; correct: number; comment?: string }[],
): VoprosDz[] {
  return list.map((h) => ({
    voprosHtml: typeset(h.question),
    variantyHtml: h.options.map((o) => typeset(o)),
    verno: h.correct,
    ...(h.comment === undefined || h.comment === '' ? {} : { kommentariyHtml: typeset(h.comment) }),
  }));
}

/* ── №1 ───────────────────────────────────────────────────────────── */

export const SBORSHCHIK_1 = sozdat({
  async postroit(plan, bank) {
    const z = await import('@/lib/planimetriya/trenazher/zadacha');
    const r = z.razreshit(plan as never, bank as never);
    const s = z.sostavZadachi(r);
    return {
      questionHtml: `${typeset(s.uslovie)}<div class="trn-risunok pl-wrap">${s.risunokSvg}</div>`,
      view: {
        tekst: true,
        voprosy: s.podskazki.voprosy.map((v) => ({
          voprosHtml: v.vopros,
          variantyHtml: v.knopki,
          verno: v.verno,
          ...(v.poyasnenie === '' ? {} : { kommentariyHtml: v.poyasnenie }),
        })),
      },
      answer: chisloEge(s.otvet),
      answerKind: 'number',
      razbor: {
        shagi: s.razbor.shagi.map((sh) => ({
          zag: sh.zagolovok,
          chto: sh.tekst.map((t) => `<p>${t}</p>`).join('') + sh.formuly.join(''),
          tex: '',
        })),
        delimost: [],
        posle: `<div class="trn-risunok pl-wrap">${s.razbor.risunokSvg}</div>`,
      },
      source: r.fipi !== null ? `ФИПИ № ${r.fipi}` : plan.vid === 'analog' ? 'аналог' : 'новая',
    };
  },
  async opornaya(id, seed) {
    const [g, b, render] = await Promise.all([
      import('@/lib/planimetriya/prep/generate'),
      import('@/lib/planimetriya/prep/bloki'),
      import('@/lib/planimetriya/render'),
    ]);
    const m = b.mikroById(id);
    if (m === undefined) return null;
    const t = g.generateMikro(id, seed);
    const ris =
      t.risunok === null ? '' : render.renderPlan(t.risunok, { chisla: true, alt: m.nazvanie });
    const risR =
      t.risunok === null
        ? ''
        : render.renderPlan(g.sOtvetom(t.risunok, t.otvet), {
            rezhim: { rezhim: 'uchitel' },
            chisla: true,
          });
    return {
      questionHtml:
        typeset(t.uslovie) + (ris === '' ? '' : `<div class="trn-risunok pl-wrap">${ris}</div>`),
      view: { tekst: true, podskazka: typeset(`$${m.formula}$`) },
      answer: chisloEge(t.otvet),
      answerKind: 'number',
      razbor: {
        shagi: t.razbor.map((l) => ({ chto: `<p>${typeset(l)}</p>`, tex: '' })),
        delimost: [],
        ...(risR === '' ? {} : { posle: `<div class="trn-risunok pl-wrap">${risR}</div>` }),
      },
    };
  },
});

/* ── №11 ──────────────────────────────────────────────────────────── */

export const SBORSHCHIK_11 = sozdat({
  async postroit(plan, bank) {
    const [z, sheet, html] = await Promise.all([
      import('@/lib/zadanie11/trenazher/zadacha'),
      import('@/lib/zadanie11/sheet11'),
      import('@/lib/zadanie11/proporciya/html'),
    ]);
    const s = z.reshitPlan(plan as never, bank as never);
    const analog =
      plan.vid === 'new'
        ? undefined
        : (bank.find((b) => b.no === plan.no)?.analog as { tekst?: string } | undefined);
    const vybor = s.vybor;
    const tablitsy = (s.tables ?? []).map((t) => sheet.tablitsaHtml(t)).join('');
    return {
      questionHtml: typeset(analog?.tekst ?? s.uslovie),
      view: {
        tekst: true,
        voprosy: voprosy(s.hints),
        ...(vybor === undefined
          ? {}
          : {
              varianty: vybor.options.map((o, i) => ({ number: String(i + 1), label: typeset(o) })),
            }),
      },
      answer: vybor === undefined ? chisloEge(s.answer) : String(vybor.correct + 1),
      answerKind: vybor === undefined ? 'number' : 'choice',
      razbor: {
        shagi: s.etapy.map((e) => ({
          zag: typeset(e.title),
          chto: e.lines.map((l) => `<p>${html.strokaHtml(l, { typeset })}</p>`).join(''),
          tex: '',
        })),
        delimost: [],
        ...(tablitsy === '' ? {} : { posle: `<div class="trn-tablitsy">${tablitsy}</div>` }),
      },
      source:
        plan.vid === 'bank' ? `банк № ${plan.no}` : plan.vid === 'analog' ? 'аналог' : 'новая',
    };
  },
  async opornaya(id, seed) {
    const [g, b, sheet] = await Promise.all([
      import('@/lib/zadanie11/prep/generate'),
      import('@/lib/zadanie11/prep/bloki'),
      import('@/lib/zadanie11/sheet11'),
    ]);
    if (b.mikroById(id) === undefined) return null;
    const t = g.generateMikro(id, seed);
    const vybor = t.answerType === 'choice' && t.vybory !== undefined;
    return {
      questionHtml:
        typeset(t.uslovie) + (t.tablitsa === undefined ? '' : sheet.tablitsaHtml(t.tablitsa, true)),
      view: {
        tekst: true,
        voprosy: voprosy(t.hints),
        ...(vybor
          ? {
              varianty: (t.vybory ?? []).map((v) => ({
                number: v.number,
                label: typeset(v.label),
              })),
            }
          : {}),
      },
      answer: vybor ? String(t.otvet) : chisloEge(Number(t.otvet)),
      answerKind: vybor ? 'choice' : 'number',
      razbor: {
        shagi: t.razbor.map((l) => ({ chto: `<p>${typeset(l)}</p>`, tex: '' })),
        delimost: [],
        ...(t.razborTablitsa === undefined ? {} : { posle: sheet.tablitsaHtml(t.razborTablitsa) }),
      },
    };
  },
});
